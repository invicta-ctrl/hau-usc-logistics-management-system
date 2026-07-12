# Apps Script Setup

Perform these steps in staging first with the designated deployment-owner institutional account.

1. Create a standalone Apps Script project and copy `.clasp.json.example` to untracked `.clasp.json` with the staging Script ID.
2. Run `npm install`, `npm run check`, and `npm run build`.
3. Run `clasp status` and `clasp push --dry-run`; inspect the file list before `clasp push`.
4. In Apps Script, run `setupDatabase()` and review its detailed report. It must identify the exact supplied production spreadsheet and must not wipe rows.
5. Run `validateDatabaseSchema()`.
6. Enter `DRIVE_ROOT_FOLDER_ID`, then run `setupDriveFolders()` or enter all seven reviewed folder IDs manually.
7. Run `validateDriveConfiguration()`; all results must be `VALID`.
8. Run `seedRolesAndPermissions()` with explicit institutional accounts. Review `14_USERS_ACCESS`.
9. Run `runMigrationDryRun()`, `runReconciliation()`, `createLaunchBackup()`, and `healthCheck()`. Do not run `applyApprovedMigration()` until mappings are approved.
10. Run `setupTimeTriggers()` once and confirm no duplicate overdue/backup triggers.

## Setup functions

`setupDatabase`, `validateDatabaseSchema`, `setupDriveFolders`, `validateDriveConfiguration`, `setupTimeTriggers`, `seedRolesAndPermissions`, `runMigrationDryRun`, `applyApprovedMigration`, `createLaunchBackup`, `runReconciliation`, and `healthCheck` are administrator operations.

`setupDatabase()` adds missing backend tabs/config keys only, validates exact headers, records schema version, freezes/styles headers, and leaves legacy tabs untouched. Setup errors are returned with correlation IDs and logged without exposing configuration values to public users.
