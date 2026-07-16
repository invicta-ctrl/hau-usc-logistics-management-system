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

## Restock workflow activation (Slice 11)

`HAU_RESTOCK_WORKFLOW_ENABLED` is optional and defaults to `false`. Leave it
unset or false during repository verification and schema preparation. Enabling
it is an external operational action and requires an authorized staging
checkpoint after schema `1.6.0` is validated, a fresh backup exists, stored
`Received_Qty` values reconcile with immutable `08_RESTOCK` totals, and the
rollback path has been reviewed. Disabling the property immediately returns
the restock workspace to read-only review without deleting history, receipts,
ledger rows, or audit evidence.

## Private roster synchronization (Slice 4)

Private access synchronization is an explicit, admin-controlled boundary. The source spreadsheet is configured only in an Apps Script Script Property; the source ID, source rows, and institutional identities must never be committed, logged, placed in fixtures, or returned by a diagnostic endpoint.

| Property | Meaning | Safe default |
|---|---|---|
| `HAU_PRIVATE_ROSTER_SOURCE_ID` | Private source spreadsheet ID | unset; sync cannot activate |
| `HAU_ROSTER_FRESHNESS_MINUTES` | Last-known-good access freshness window | `1440` minutes |
| `HAU_ROSTER_SYNC_APPROVED` | Explicit activation approval gate | absent/false |
| `HAU_ROSTER_SYNC_DISABLED` | Configuration-level emergency stop for sync | absent/false |
| `HAU_ROSTER_EMERGENCY_DENY` | Manual fail-closed access stop | absent/false |

The first source tab must have exactly these five headers, in this order: `Institutional_Email`, `Display_Name`, `Active`, `Role_ID`, and `Committee_IDs`. `Active` is a strict boolean/`TRUE`/`FALSE`; `Role_ID` must resolve to a canonical role; and `Committee_IDs` is a JSON array of canonical committee IDs. Normalized email duplicates, unknown roles or committees, invalid types, and missing scope are rejected without activation. The source is read only by an explicit sync or the scheduled handler; ordinary bootstrap and login never open it.

Run `setupDatabase()` before a first sync so the additive `21_ACCESS_SYNC_RUNS`, `22_ACCESS_SYNC_SNAPSHOT`, and `23_ACCESS_SYNC_MEMBERSHIP_SNAPSHOT` tabs and roster access columns exist. Use `api_runRosterSync({clientRequestId: '...', activate: false})` for an admin dry run. Activation additionally requires `HAU_ROSTER_SYNC_APPROVED=TRUE`, a valid source, a clean local conflict report, a local last-known-good snapshot, and a reviewed rollback checkpoint. Committee memberships are updated in `20_USER_COMMITTEE_SCOPE` only for roster-managed rows; a manual membership conflict blocks activation. Use `api_getRosterSyncHealth()` for bounded admin metadata only. Use `api_setRosterEmergencyDeny({clientRequestId: '...', disabled: true, reason: '...'})` when immediate fail-closed access is required; the reason is not returned or copied into audit metadata.

`setupRosterSyncTrigger({clientRequestId: '...'})` installs at most one hourly trigger and is itself locked, administrator-authorized, and idempotent; it does not run during repository tests or build commands. Do not activate it until the staging owner has separately reviewed the private Script Properties, backup, schema, and rollback plan. A failed or stale sync leaves the last-known-good snapshot in force until its freshness window expires; after expiry or emergency deny, roster-managed accounts are denied while manual access rows are never silently granted roster permissions.

## Staging sequence

1. Create a disposable demo copy of the operational spreadsheet and a separate baseline/backup copy.
2. Create a standalone Apps Script project and copy `.clasp.json.example` to untracked `.clasp.json` with the staging Script ID.
3. Add the three Script Properties above and verify `HAU_ENVIRONMENT=STAGING` before any write.
4. Run `npm install`, `npm run check`, and `npm run build`.
5. Run `clasp status` and inspect the bounded file list. Clasp 3.3.0 has no `push --dry-run`; follow the remote-pull/manifest/parity safeguard in `docs/LAUNCH_RUNBOOK.md` before any authorized push.
6. In Apps Script, create a staging schema backup, then run `setupDatabase()` and review its detailed report. The report must show `STAGING` and the exact disposable demo spreadsheet ID. Stop immediately if either value is wrong.
7. Run `validateDatabaseSchema()`. Confirm the appended 0.5.0 item/access fields, Slice 4 roster tabs/columns (including the membership rollback snapshot), Slice 11 `Workflow_Revision` request-line field, and the two data-revision config rows without changing prior values.
8. Run `setupOperationalEditTrigger()` once. Its result must report either one newly created trigger or the existing matching trigger; duplicates are a failure.
9. Enter `DRIVE_ROOT_FOLDER_ID`, then run `setupDriveFolders()` or enter all seven reviewed folder IDs manually.
10. Run `validateDriveConfiguration()`; all results must be `VALID`.
11. Run `seedRolesAndPermissions()` with explicit institutional accounts. Review `14_USERS_ACCESS`, especially `Can_Manage_Catalog`; do not grant it broadly.
12. Run `runMigrationDryRun()`, `runReconciliation()`, `createLaunchBackup()`, and `healthCheck()`. `healthCheck()` is admin-only and must report the expected environment and spreadsheet IDs.
13. Do not run `applyApprovedMigration()` until mappings are approved.
14. Run `setupTimeTriggers()` once and confirm no duplicate overdue/backup triggers.
15. Keep private roster synchronization disabled until the redacted dry run is reviewed. If approved, run the roster dry run, verify the bounded conflict/count report, create a fresh backup, and only then perform one explicitly reviewed activation. Do not paste source rows into chat or commit them.

## Setup functions

`setupDatabase`, `validateDatabaseSchema`, `setupOperationalEditTrigger`, `setupDriveFolders`, `validateDriveConfiguration`, `setupTimeTriggers`, `seedRolesAndPermissions`, `runMigrationDryRun`, `applyApprovedMigration`, `createLaunchBackup`, `runReconciliation`, and `healthCheck` are administrator operations.

`setupDatabase()` adds missing backend tabs, approved appended headers, and config keys only; fills safe defaults only when new fields are blank; validates exact headers; records schema version for the active environment; freezes/styles headers; and leaves legacy tabs untouched. The 0.5.0 migration appends ten item fields, appends `Can_Manage_Catalog`, and ensures `DATA_REVISION` / `DATA_REVISION_UPDATED_AT`. Slice 4 appends roster access freshness columns and creates metadata/snapshot tabs. Slice 11 appends `Workflow_Revision` to request lines for optimistic concurrency. It preserves all existing item, user, Drive, audit, history, and operational values and is safe to rerun.

`setupOperationalEditTrigger()` creates at most one installable `handleOperationalSheetEdit` trigger for the configured operational spreadsheet. Repository build/test commands do not install it. Apps Script-originated mutations advance revision explicitly because they do not fire edit triggers; direct human edits advance revision through this trigger. The handler ignores the human README tab and edits limited to the revision keys to avoid self-trigger loops.

## Version 0.5.0 migration safety

The additive schema migration may run before the new web deployment is activated. Existing Version 9 ignores the appended columns and revision rows. If code rollback is needed, restore the preceding immutable deployment version but retain the additive schema and all audit/history/ledger data. Never “roll back” by deleting columns, config rows, or catalog values. Removing or disabling the operational edit trigger is a separate external action that requires owner authorization and evidence that the trigger is implicated.
