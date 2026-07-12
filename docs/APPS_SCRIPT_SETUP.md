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
5. Run `clasp status` and `clasp push --dry-run`; inspect the file list before `clasp push`.
6. In Apps Script, run `setupDatabase()` and review its detailed report. The report must show `STAGING` and the exact disposable demo spreadsheet ID. Stop immediately if either value is wrong.
7. Run `validateDatabaseSchema()`.
8. Enter `DRIVE_ROOT_FOLDER_ID`, then run `setupDriveFolders()` or enter all seven reviewed folder IDs manually.
9. Run `validateDriveConfiguration()`; all results must be `VALID`.
10. Run `seedRolesAndPermissions()` with explicit institutional accounts. Review `14_USERS_ACCESS`.
11. Run `runMigrationDryRun()`, `runReconciliation()`, `createLaunchBackup()`, and `healthCheck()`. `healthCheck()` is admin-only and must report the expected environment and spreadsheet IDs.
12. Do not run `applyApprovedMigration()` until mappings are approved.
13. Run `setupTimeTriggers()` once and confirm no duplicate overdue/backup triggers.

## Setup functions

`setupDatabase`, `validateDatabaseSchema`, `setupDriveFolders`, `validateDriveConfiguration`, `setupTimeTriggers`, `seedRolesAndPermissions`, `runMigrationDryRun`, `applyApprovedMigration`, `createLaunchBackup`, `runReconciliation`, and `healthCheck` are administrator operations.

`setupDatabase()` adds missing backend tabs/config keys only, validates exact headers, records schema version for the active environment, freezes/styles headers, and leaves legacy tabs untouched. Setup errors are returned with correlation IDs and safe property names only; configured values are not exposed to public users.
