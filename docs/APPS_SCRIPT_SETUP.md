# Apps Script Setup

Perform these steps in staging first with the designated deployment-owner institutional account.

## Current `1.0.0-rc.1` target gate

The repository candidate is ready for a controlled staging setup, but this handoff does not identify a safe live target. The only authenticated ignored `.clasp.json` inspected during the V1 task conflicts with the committed staging Version 9 record. Do not copy it, push through it, or infer a rollback version from it. The deployment owner must privately confirm the intended staging project/account/environment, current deployment pointer, and preceding immutable rollback version before any status, source upload, setup, trigger, Sheet, Drive, version, or deployment mutation.

## Required Script Properties

Before running any setup function, open **Apps Script → Project Settings → Script Properties** and add all three values:

| Property | Staging value |
|---|---|
| `HAU_ENVIRONMENT` | `STAGING` |
| `HAU_SPREADSHEET_ID` | ID of the disposable demo spreadsheet |
| `HAU_BACKUP_SPREADSHEET_ID` | ID of a separate demo baseline/backup spreadsheet |

For production, use `PRODUCTION` and separately reviewed production IDs. The operational and backup IDs must be different. Missing values, placeholders, malformed IDs, and unsupported environments fail closed. The repository contains no spreadsheet-ID fallback.

## Staging sequence

1. Create a disposable demo copy of the operational spreadsheet and a separate baseline/backup copy.
2. Privately confirm the reviewed staging Apps Script project, then copy `.clasp.json.example` to an untracked `.clasp.json` with that staging Script ID. Never reuse an authenticated config merely because it is available locally.
3. Add the three Script Properties above and verify `HAU_ENVIRONMENT=STAGING` before any write.
4. Run `npm ci`, `npm run check`, `npm run verify`, and `npm run build`.
5. Run `clasp status` and inspect the bounded file list. Clasp 3.3.0 has no `push --dry-run`; follow the remote-pull/manifest/parity safeguard in `docs/LAUNCH_RUNBOOK.md` before any authorized push.
6. In Apps Script, create a staging schema backup, then run `setupDatabase()` and review its detailed report. The report must show `STAGING` and the exact disposable demo spreadsheet ID. Stop immediately if either value is wrong.
7. Run `validateDatabaseSchema()`. Confirm schema `1.2.0`: all expected `01_ITEM_MASTER` through `22_COMMAND_JOURNAL` headers, the additive catalog/access fields, content/branding/command-journal tables, and data-revision config rows without changing prior values.
8. Run `setupOperationalEditTrigger()` once. Its result must report either one newly created trigger or the existing matching trigger; duplicates are a failure.
9. Enter `DRIVE_ROOT_FOLDER_ID`, then run `setupDriveFolders()` or enter all eleven reviewed canonical folder IDs manually: Requests, Lending, Releases and Returns, Procurement, Canvassing, Receipts and Invoices, Inventory Evidence, Branding, Exports, Backups, and Quarantine.
10. Run `validateDriveConfiguration()`; the root and all eleven exact-name direct-child mappings, legacy aliases, cross-key uniqueness, and sharing results must be `VALID` and private.
11. Run `seedRolesAndPermissions()` with explicit institutional accounts. Review `14_USERS_ACCESS`, especially `Can_Manage_Catalog`; do not grant it broadly.
12. Run `runMigrationDryRun()`, `runReconciliation()`, `createLaunchBackup()`, and `healthCheck()`. `healthCheck()` is admin-only and must report the expected environment and spreadsheet IDs.
13. Do not run `applyApprovedMigration()` until mappings are approved.
14. Run `setupTimeTriggers()` once and confirm no duplicate overdue/backup triggers.

## Setup functions

`setupDatabase`, `validateDatabaseSchema`, `setupOperationalEditTrigger`, `setupDriveFolders`, `validateDriveConfiguration`, `setupTimeTriggers`, `seedRolesAndPermissions`, `runMigrationDryRun`, `applyApprovedMigration`, `createLaunchBackup`, `runReconciliation`, and `healthCheck` are administrator operations.

`setupDatabase()` adds missing backend tabs, approved missing trailing headers, validation rules, warning-only system-column protections, and config keys only; fills safe defaults only when new fields are blank; validates exact header compatibility; records schema `1.2.0` for the active environment; freezes/styles headers; and leaves legacy tabs untouched. It preflights every known sheet before repair, stops on duplicate/incompatible headers, preserves unexpected legacy columns, and is safe to rerun. The schema retains the additive catalog/access/revision fields and adds `20_CONTENT`, `21_BRANDING`, and `22_COMMAND_JOURNAL`. All central append, batch, and update paths neutralize formula-leading text before Sheet writes.

`setupOperationalEditTrigger()` creates at most one installable `handleOperationalSheetEdit` trigger for the configured operational spreadsheet. Repository build/test commands do not install it. Apps Script-originated mutations advance revision explicitly because they do not fire edit triggers; direct human edits advance revision through this trigger. The handler ignores the human README tab and edits limited to the revision keys to avoid self-trigger loops.

## V1 additive migration safety

The additive schema migration may run before the new web deployment is activated only after target identity, a fresh verified backup, and the approved staging window are established. The historically documented Version 9 ignores the earlier appended catalog/revision fields, but its identity is not verified for the currently available authenticated target. If code rollback is needed, restore the privately confirmed preceding immutable deployment version while retaining additive schema and all content, branding, command-journal, audit, history, and ledger data. Never “roll back” by deleting columns, config rows, versions, or posted records. Removing or disabling a trigger is a separate external action requiring owner authorization and evidence that the trigger is implicated.
