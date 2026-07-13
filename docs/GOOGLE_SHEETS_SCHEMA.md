# Google Sheets Schema

The operational database is selected only by reviewed environment Script Properties. `apps-script/Config.gs` defines schema `1.2.0` and the exact required headers. `setupDatabase()` preflights every known table, adds missing backend tabs or compatible missing trailing headers without wiping data, and stops before repair on duplicate or incompatible headers. `validateDatabaseSchema()` reports discrepancies.

## Preserved legacy tabs

`MAIN INVENTORY`, `FAST MOVING ITEMS`, `FOR SALE ITEMS`, and `TO BUY` are read-only migration inputs. The application never deletes, merges, corrects, or posts transactions into them.

## Backend tabs

| Tab | Purpose |
|---|---|
| `00_README` | human operating notes |
| `01_ITEM_MASTER` | catalog metadata, opening quantity, legacy provenance, verification status |
| `02_LEDGER` | immutable inventory/event-item movements |
| `03_REQUESTS`, `04_REQUEST_LINES` | request headers and fulfillment lines |
| `05_RESERVATIONS` | active/cleared allocations |
| `06_LENDING`, `07_RELEASES`, `08_RESTOCK`, `09_DELIVERABLES` | operational workflows |
| `10_CANVASS`, `11_SUPPLIERS` | quote and supplier library |
| `12_EVIDENCE` | Drive evidence metadata |
| `13_EVENTS`, `14_USERS_ACCESS` | event choices and authorization |
| `15_STATUS_HISTORY`, `16_AUDIT_LOG`, `18_ERROR_LOG` | observability and history |
| `17_CONFIG` | non-secret operational configuration |
| `19_MIGRATION_MAP` | explicit migration/reconciliation decisions |
| `20_CONTENT` | immutable content revisions and publish/revert provenance |
| `21_BRANDING` | versioned private branding metadata and activation history |
| `22_COMMAND_JOURNAL` | mutation lifecycle, idempotency payload digest, bounded result/error, and recovery state |

There are 22 application tables (`01`–`22`) plus the human `00_README` tab. The four preserved legacy tabs remain outside this managed schema.

## V1 additive fields

`setupDatabase()` appends the following fields after the pre-existing `01_ITEM_MASTER` columns; it does not insert or reorder them:

| Field | Purpose / safe blank default |
|---|---|
| `Catalog_Type` | `OFFICE_INVENTORY`, `PANTRY`, or `EVENT_SPECIFIC`, derived from stock area when blank |
| `Storage_Location` | physical context; blank values become `TO_BE_ASSIGNED` |
| `Reorder_Threshold` | non-negative metadata; default `0` |
| `Lending_Audience` | active circulating legacy items default `USC_STAFF_ONLY`; VERIFY/inactive/archived/non-circulating items default `NOT_AVAILABLE_FOR_LENDING` |
| `Default_Loan_Days` | returnable items default `3`; consumables/non-circulating items remain blank |
| `Maximum_Loan_Qty` | conservative positive limit; default `1` for circulating items and blank for non-circulating items |
| `Approval_Required` | default `TRUE` |
| `Updated_At`, `Updated_By` | catalog metadata change attribution |
| `Notes` | non-quantity catalog notes |

`14_USERS_ACCESS` appends `Can_Manage_Catalog` after all existing fields. Blank values preserve catalog management only for ADMIN and DOL_DIRECTOR; no other role receives an implicit grant.

`17_CONFIG` receives `DATA_REVISION` and `DATA_REVISION_UPDATED_AT` when missing. The first is a monotonic non-negative integer; the second records its last update time. They are operational coordination metadata, not secrets.

The migration is additive and may run before the V1 web deployment becomes active only in the verified environment after a fresh backup. Existing values, legacy tabs, Drive configuration, users, audit/history/ledger records, and operational rows remain in place. Repeated setup runs fill only missing schema/default values and must not reset reviewed fields. Unexpected extra legacy columns are preserved and reported; duplicate or incompatible expected headers stop repair.

## Write safety, command recovery, and backup evidence

All repository-controlled append, batch, and update paths route through `setValuesSafely_`, which prefixes user-controlled strings beginning with `=`, `+`, `-`, `@`, tab, or carriage return so Sheets does not interpret them as formulas. Numbers, booleans, dates, and ordinary text retain their types. Tests cover append, batch, update, and `22_COMMAND_JOURNAL` writes; staging must still verify representative import/export and live Sheet behavior.

The command journal permits `PENDING`, `COMPLETED`, and `FAILED` lifecycle states plus `NOT_REQUIRED`, `REVIEW_REQUIRED`, `RECOVERED`, and `MANUAL_REVIEW` recovery states. It complements idempotency, audit, and immutable ledger/history records; it never authorizes editing posted rows. Ambiguous release recovery must be reconciled by correlation and related entity before retry.

Launch backup creation opens the distinct copied spreadsheet and compares the sheet inventory, exact headers, and row counts with the operational source. A failed, inaccessible, identical-resource, or mismatched copy is not accepted as a backup. No backup was created in this task because the live target was not verified.

## Sheet usability

`setupDatabase()` freezes headers, applies institutional header styling and filters, creates missing Drive config rows, applies known enum validations, and adds repeatable warning-only protections to system-managed columns without removing institutional protections. Operators must still review editors and strengthen range protections where policy requires. Conditional formatting and monitoring filter views should be verified manually in staging; do not use formatting work as a reason to mutate legacy layouts.
