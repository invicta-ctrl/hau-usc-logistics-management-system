# Apps Script Setup

Perform these steps in staging first with the designated deployment-owner institutional account.

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
2. Create a standalone Apps Script project and copy `.clasp.json.example` to untracked `.clasp.json` with the staging Script ID.
3. Add the three Script Properties above and verify `HAU_ENVIRONMENT=STAGING` before any write.
4. Run `npm install`, `npm run check`, and `npm run build`.
5. Run `clasp status` and inspect the bounded file list. Clasp 3.3.0 has no `push --dry-run`; follow the remote-pull/manifest/parity safeguard in `docs/LAUNCH_RUNBOOK.md` before any authorized push.
6. In Apps Script, create a staging schema backup, then run `setupDatabase()` and review its detailed report. The report must show `STAGING` and the exact disposable demo spreadsheet ID. Stop immediately if either value is wrong.
7. Run `validateDatabaseSchema()`. Confirm the appended 0.5.0 item/access fields and the two data-revision config rows without changing prior values.
8. Run `setupOperationalEditTrigger()` once. Its result must report either one newly created trigger or the existing matching trigger; duplicates are a failure.
9. Enter `DRIVE_ROOT_FOLDER_ID`, then run `setupDriveFolders()` or enter all seven reviewed folder IDs manually.
10. Run `validateDriveConfiguration()`; all results must be `VALID`.
11. Run `seedRolesAndPermissions()` with explicit institutional accounts. Review `14_USERS_ACCESS`, especially `Can_Manage_Catalog`; do not grant it broadly.
12. Run `runMigrationDryRun()`, `runReconciliation()`, `createLaunchBackup()`, and `healthCheck()`. `healthCheck()` is admin-only and must report the expected environment and spreadsheet IDs.
13. Do not run `applyApprovedMigration()` until mappings are approved.
14. Run `setupTimeTriggers()` once and confirm no duplicate overdue/backup triggers.

## Setup functions

`setupDatabase`, `validateDatabaseSchema`, `setupOperationalEditTrigger`, `setupDriveFolders`, `validateDriveConfiguration`, `setupTimeTriggers`, `seedRolesAndPermissions`, `runMigrationDryRun`, `applyApprovedMigration`, `createLaunchBackup`, `runReconciliation`, and `healthCheck` are administrator operations.

`setupDatabase()` adds missing backend tabs, approved appended headers, and config keys only; fills safe defaults only when new fields are blank; validates exact headers; records schema version for the active environment; freezes/styles headers; and leaves legacy tabs untouched. The 0.5.0 migration appends ten item fields, appends `Can_Manage_Catalog`, and ensures `DATA_REVISION` / `DATA_REVISION_UPDATED_AT`. It preserves all existing item, user, Drive, audit, history, and operational values and is safe to rerun.

`setupOperationalEditTrigger()` creates at most one installable `handleOperationalSheetEdit` trigger for the configured operational spreadsheet. Repository build/test commands do not install it. Apps Script-originated mutations advance revision explicitly because they do not fire edit triggers; direct human edits advance revision through this trigger. The handler ignores the human README tab and edits limited to the revision keys to avoid self-trigger loops.

## Version 0.5.0 migration safety

The additive schema migration may run before the new web deployment is activated. Existing Version 9 ignores the appended columns and revision rows. If code rollback is needed, restore the preceding immutable deployment version but retain the additive schema and all audit/history/ledger data. Never “roll back” by deleting columns, config rows, or catalog values. Removing or disabling the operational edit trigger is a separate external action that requires owner authorization and evidence that the trigger is implicated.
