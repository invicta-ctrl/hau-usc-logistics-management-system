# Apps Script Setup

Perform these steps in staging first with the designated deployment-owner institutional account.

## Current `1.0.0-rc.1` target gate

The reviewed package is deployed through the existing staging and production pointers at immutable Version 13 and Version 3. Both remote projects were pulled back with exact 33-file source/manifest parity. Private predeployment spreadsheet backups, Script Properties, schema 1.2.0 setup, Drive validation, trigger setup, migration dry run, reconciliation, launch backup, and health checks were verified.

The remaining gate is functional and governance acceptance, not source upload: no approved non-personal fixture exists for the full mutation matrix, and legacy TO_CLASSIFY handling values remain VERIFY/non-circulating until the data owner approves a source-preserving reconciliation. Do not seed or transact those items.

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

## Deployment evidence

- Staging: Version 13, existing web deployment pointer, 33-file parity, live internal/request-only/lending smoke passed, staging diagnostic passed.
- Production: Version 3, existing web deployment pointer, 33-file parity, live internal/request-only/lending smoke passed.
- The installed Clasp 3.3 CLI does not support push --dry-run; the required safeguard was the pre-push remote pull plus post-push pull/parity comparison.
- The current source maps invalid legacy handling values to VERIFY/non-circulating DTOs and rejects transactions without changing the authoritative source cell.

## Setup functions

`setupDatabase`, `validateDatabaseSchema`, `setupOperationalEditTrigger`, `setupDriveFolders`, `validateDriveConfiguration`, `setupTimeTriggers`, `seedRolesAndPermissions`, `runMigrationDryRun`, `applyApprovedMigration`, `createLaunchBackup`, `runReconciliation`, and `healthCheck` are administrator operations.

`setupDatabase()` adds missing backend tabs, approved missing trailing headers, validation rules, warning-only system-column protections, and config keys only; fills safe defaults only when new fields are blank; validates exact header compatibility; records schema `1.2.0` for the active environment; freezes/styles headers; and leaves legacy tabs untouched. It preflights every known sheet before repair, stops on duplicate/incompatible headers, preserves unexpected legacy columns, and is safe to rerun. The schema retains the additive catalog/access/revision fields and adds `20_CONTENT`, `21_BRANDING`, and `22_COMMAND_JOURNAL`. All central append, batch, and update paths neutralize formula-leading text before Sheet writes.

`setupOperationalEditTrigger()` runs under the script lock and reconciles the current user's installable `handleOperationalSheetEdit_` trigger. It requires the exact `ON_EDIT` event, `SPREADSHEETS` source, and configured operational spreadsheet, removes current-user legacy/mismatched/duplicate handlers, and audits the result. Repository build/test commands do not install it. Apps Script-originated mutations advance revision explicitly because they do not fire edit triggers; direct human edits advance revision through this private handler. The handler ignores the human README tab and edits limited to the revision keys to avoid self-trigger loops. Because Apps Script exposes only the active user's installable triggers, the release record must identify the trigger owner and confirm prior-owner cleanup separately.

`setupTimeTriggers()` similarly reconciles private `updateOverdueLending_` and `scheduledBackup_` `CLOCK` handlers under the script lock and audits current-user changes. Source upload removes the legacy public handler names before this migration runs, so use a bounded maintenance window. If migration fails, restore the captured predeployment source as well as the prior deployment pointer; a web-app pointer change alone does not restore project-HEAD trigger functions.

## V1 additive migration safety

The additive schema migration may run before a new web deployment is activated only after target identity, a fresh verified backup, and the approved window are established. Staging Version 9 is the private rollback for current Version 13; production Versions 1 and 2 precede current Version 3. If code rollback is needed, restore the confirmed preceding deployment version and, when trigger handlers are implicated, the captured predeployment source, while retaining additive schema and all content, branding, command-journal, audit, history, and ledger data. Never “roll back” by deleting columns, config rows, versions, or posted records. Removing or disabling a trigger is a separate external action requiring owner authorization and evidence that the trigger is implicated.
