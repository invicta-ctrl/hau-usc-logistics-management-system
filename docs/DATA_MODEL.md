# Data Model

Core preview collections mirror the recommended future persistence entities:

| Collection                            | Responsibility                                            |
| ------------------------------------- | --------------------------------------------------------- |
| `eventSeries`, `events`               | Approved event choices and stable date-only values        |
| `requests`, `requestLines`            | Parent intake and item-level fulfillment                  |
| `inventoryItems`                      | Catalog metadata only                                     |
| `ledgerTransactions`                  | Immutable quantity movements                              |
| `reservations`                        | Active/cleared allocations                                |
| `lendingTickets`                      | Borrower, item, due date, condition, exceptions           |
| `restockRequests`, `restockReceipts`  | Catalog demand and immutable deliveries                   |
| `deliverables`, `deliverableReceipts` | Event procurement and EIT receiving                       |
| `suppliers`, `quotes`                 | Normalized supplier/canvass records and price history     |
| `evidenceFiles`                       | Safe preview metadata; future controlled Drive references |
| `eventTasks`                          | Owner, due date, dependency, block, readiness impact      |
| `auditLog`                            | Actor, action, entity, timestamp, correlation, summary    |
| `idempotencyRecords`                  | Command key and stored normalized result                  |

Dates ending in `Date`, `On`, `Start`, or `End` use `YYYY-MM-DD`. Timestamps use ISO 8601 instants and display in `Asia/Manila`.

The mock store is deliberately denormalized in a few read-facing fields. Production persistence must use stable IDs and server-side joins/DTO assembly. Supplier TINs, borrower histories, contacts, and audit rows must never enter the public/requester bootstrap.
