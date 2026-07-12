# Google Sheets Schema

The production database is `1D28OX2dTx0rfus4hDd9VcyDZtxo26CFLGFk22URFAjw`. `apps-script/Config.gs` contains the exact required headers. `setupDatabase()` adds missing backend tabs or approved missing headers without wiping data; `validateDatabaseSchema()` reports discrepancies.

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

## Sheet usability

`setupDatabase()` freezes headers, applies institutional header styling and filters, and creates missing Drive config rows. Status, role, unit, evidence-type validation, protected system columns, conditional formatting, and monitoring filter views should be applied in staging and verified manually before production; do not use formatting work as a reason to mutate legacy layouts.
