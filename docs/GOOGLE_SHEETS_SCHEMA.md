# Google Sheets Schema

The operational database is selected only by the reviewed environment Script Properties. `apps-script/Config.gs` contains the exact required headers. `setupDatabase()` adds missing backend tabs or approved missing headers without wiping data; `validateDatabaseSchema()` reports discrepancies.

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
| `20_USER_COMMITTEE_SCOPE`–`23_ACCESS_SYNC_MEMBERSHIP_SNAPSHOT` | canonical membership and roster-sync evidence |
| `24_COMPOSITE_REQUESTS` | versioned composite parent/child records |
| `25_VENUE_EQUIPMENT_REFERENCES`, `26_VENUE_EQUIPMENT_ROUTES` | effective-dated Venue and Equipment references and server-owned routing |
| `27_REFERENCE_ADMIN_RECORDS` | versioned organization, committee, and lifecycle administration records |
| `28_REFERENCE_ADMIN_CHANGES` | direct and review-gated administrative change evidence |

## Version 0.5.0 additive fields

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

`14_USERS_ACCESS` appends `Can_Manage_Catalog` and the canonical authorization/source fields after all legacy fields. Slice 10 adds `Admin_Revision`, a numeric optimistic-concurrency token used only by the controlled permission-change workflow. It does not replace `Authorization_Revision` or roster source revisions. Blank values preserve catalog management only for ADMIN and DOL_DIRECTOR; no other role receives an implicit grant.

`17_CONFIG` receives `DATA_REVISION` and `DATA_REVISION_UPDATED_AT` when missing. The first is a monotonic non-negative integer; the second records its last update time. They are operational coordination metadata, not secrets.

The migration is safe to run before the 0.5.0 web deployment becomes active. Existing values, legacy tabs, Drive configuration, users, audit/history records, and operational rows remain in place. Repeated setup runs fill only missing schema/default values and must not reset reviewed fields.

## Slice 10 reference administration records

`27_REFERENCE_ADMIN_RECORDS` stores an append-only sequence of stable-ID revisions for domains without a dedicated table. `28_REFERENCE_ADMIN_CHANGES` stores the before/after proposal, changed-field allowlist, risk, requester, distinct reviewer, decision timestamps, idempotency key, and correlation ID. Specific venue/equipment and route revisions remain in tabs 25 and 26. Applying a revision marks the prior current row `SUPERSEDED` and appends the new row; archive and restore are new revisions, not deletion.

`HAU_REFERENCE_ADMIN_WRITES_ENABLED` is a Script Property kill switch and defaults to `false`. It is not stored in `17_CONFIG`, does not appear in a client DTO, and must be enabled only in an explicitly authorized environment after schema validation, backup, dry run, reconciliation, and rollback proof.

## Sheet usability

`setupDatabase()` freezes headers, applies institutional header styling and filters, and creates missing Drive config rows. Status, role, unit, evidence-type validation, protected system columns, conditional formatting, and monitoring filter views should be applied in staging and verified manually before production; do not use formatting work as a reason to mutate legacy layouts.
