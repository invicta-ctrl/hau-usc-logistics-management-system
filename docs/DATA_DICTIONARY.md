# Data Dictionary

Canonical identifiers are strings and are never sheet row numbers. Date-times are stored as ISO-like values rendered in `Asia/Manila`; date-only fields remain date-only strings where applicable. Quantities are finite non-negative numbers; movement commands require positive quantities.

| Concept            | Identity                     | Quantity/status authority                                              | Important links                                                           |
| ------------------ | ---------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| Item               | `Item_ID` (`ITM-`)           | Opening quantity plus posted item ledger; `VERIFY` blocks transactions | Legacy sheet/row/block, catalog type, storage, handling, lending audience |
| Ledger transaction | `Transaction_ID` (`TXN-`)    | Immutable signed movement                                              | item/event item, related entity, idempotency key                          |
| Request            | `Request_ID` (`LREQ-`)       | Parent status derived from lines                                       | event, requester, parent request                                          |
| Request line       | `Request_Line_ID` (`RL-`)    | Requested/received/released quantities                                 | item/event item, split group                                              |
| Reservation        | `Reservation_ID` (`RSV-`)    | `ACTIVE` quantities reduce ATP                                         | request line or lending ticket                                            |
| Lending ticket     | `Lending_Ticket_ID` (`LND-`) | circulation status + ledger                                            | borrower, item, due date                                                  |
| Release            | `Release_ID` (`REL-`)        | posted release header plus ledger                                      | request/lines/evidence                                                    |
| Restock receipt    | `Restock_ID` (`RST-`)        | immutable receipt and purchase ledger                                  | item/request line/evidence                                                |
| Deliverable        | `Deliverable_ID` (`DEL-`)    | procurement and cumulative receipt state                               | request line/event/EIT                                                    |
| Canvass            | `Canvass_ID` (`CAN-`)        | quote reference, preferred flag                                        | supplier/request line/deliverable                                         |
| Supplier           | `Supplier_ID` (`SUP-`)       | active/archive state                                                   | quote history                                                             |
| Evidence           | `Evidence_ID` (`EVD-`)       | upload status and digest                                               | Drive file and operational entity                                         |
| Status history     | `History_ID` (`HIS-`)        | append-only state changes                                              | any entity                                                                |
| Audit log          | `Audit_ID` (`AUD-`)          | append-only actions/correlation                                        | any entity                                                                |
| Migration mapping  | `Migration_ID` (`MAP-`)      | explicit approval/apply decision                                       | legacy source and new item                                                |
| Data revision      | `DATA_REVISION` config key   | monotonic exactly-once successful mutation counter                     | update timestamp and environment                                          |

## Catalog and circulation fields

| Field                      | Meaning                                                                                                                       |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `Handling`                 | physical workflow: `CONSUMABLE`, `LOANABLE`, `REUSABLE_ASSET`, or `NON_CIRCULATING`                                           |
| `Lending_Audience`         | eligibility: `NOT_AVAILABLE_FOR_LENDING`, `USC_STAFF_ONLY`, `STUDENTS_AND_STAFF`, or `DOL_INTERNAL_ONLY`                      |
| `Catalog_Type`             | `OFFICE_INVENTORY`, `PANTRY`, or `EVENT_SPECIFIC`                                                                             |
| `Storage_Location`         | descriptive physical location; never quantity authority                                                                       |
| `Reorder_Threshold`        | non-negative planning threshold; never an automatic ledger movement                                                           |
| `Default_Loan_Days`        | positive default due-date interval for returnable items; blank otherwise                                                      |
| `Maximum_Loan_Qty`         | optional positive per-ticket ceiling, rechecked against live ATP                                                              |
| `Approval_Required`        | boolean circulation/catalog policy; default true                                                                              |
| `Updated_At`, `Updated_By` | latest catalog metadata attribution                                                                                           |
| `Can_Manage_Catalog`       | explicit user permission for create/update/storage/archive/restore controls; internal detail lookup also permits `Can_Review` |

Handling never implies audience. For example, a reusable asset can be staff-only, students-and-staff, or unavailable. Browser labels are advisory; the server normalizes and validates canonical values.

The predictive search stores the selected `Item_ID`, not the visible query text. A query without a suggestion-backed Item ID is `ITEM_NOT_SELECTED` and cannot create a lending ticket.

Sensitive fields include student identifiers, borrower contacts, requester email, supplier TIN, Drive IDs, and access records. They never appear in public bootstrap payloads or Drive filenames.

## Quantity and status derivations

These calculations are server-side and use canonical IDs:

- `on_hand(item) = Opening_Qty + sum(POSTED ledger Signed_Qty for Item_ID)`.
- `reserved(item) = sum(Quantity for ACTIVE reservations for Item_ID)`.
- `available_to_promise(item) = on_hand - reserved`.
- Event-item on-hand is the sum of posted event-item ledger quantities; it has no item-master opening balance.
- Request parent status is derived from its lines. A sibling line cannot be completed merely because one receipt or release is complete.
- Deliverable received and released totals are cumulative. Every physical receipt/release remains an immutable linked event.
- A lending ticket status is lifecycle state; actual stock authority remains the ledger and its reservation.
- `DATA_REVISION` is synchronization metadata, not a business sequence or transaction ID.

Cached quantity-looking fields in a Sheet or browser DTO are display aids. Reconciliation and writes always recompute from posted authority.

## Current Sheets to future PostgreSQL mapping

The future names below are a design mapping, not deployed tables. PostgreSQL would use internal UUID primary keys plus unique human-readable display IDs. Legacy identifiers remain immutable alternate keys during migration.

| CURRENT Sheet/tab          | Current purpose and classification                                          | FUTURE relation or service                                                             | Required future constraint                                                               |
| -------------------------- | --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `00_README`                | Operator notes; internal                                                    | Versioned runbook/config metadata, not a business table                                | Repository remains canonical documentation                                               |
| `01_ITEM_MASTER`           | Catalog, opening balance, provenance; internal                              | `items`, `item_aliases`, `legacy_item_provenance`                                      | Unique display ID; non-negative opening balance; VERIFY provenance immutable             |
| `02_LEDGER`                | Posted quantity movements; restricted integrity data                        | `inventory_ledger_entries`                                                             | Append-only; unique display/idempotency keys; signed quantity and reversal constraints   |
| `03_REQUESTS`              | Request header and requester identity; personal/internal                    | `requests`                                                                             | Requester/event foreign keys; lifecycle check; unique client request key                 |
| `04_REQUEST_LINES`         | Requested and fulfillment quantities; internal                              | `request_lines`                                                                        | Request foreign key; positive quantity; exactly one valid fulfillment target             |
| `05_RESERVATIONS`          | Active/cleared allocations; restricted integrity data                       | `reservations`                                                                         | Item plus request-line/ticket foreign keys; positive quantity; indexed active scope      |
| `06_LENDING`               | Borrower/student/contact and circulation state; restricted personal         | `lending_tickets`, optional protected `borrower_profiles`                              | Row-level access; due/status checks; minimize retained contact fields                    |
| `07_RELEASES`              | Handoff headers and serialized line arrays; restricted integrity            | `releases`, `release_lines`                                                            | Normalize arrays into child rows; quantities positive; linked ledger entries             |
| `08_RESTOCK`               | Receipt, price, supplier tax and storage context; restricted                | `restock_receipts`                                                                     | Request-line/item/supplier foreign keys; positive quantities; protect tax data           |
| `09_DELIVERABLES`          | Procurement/receipt aggregate; internal                                     | `deliverables`, `deliverable_receipts`                                                 | Request-line/event foreign keys; cumulative totals derived from receipts                 |
| `10_CANVASS`               | Quotes, supplier tax and source; restricted                                 | `canvass_references`, `supplier_price_observations`                                    | Valid price/date; one preferred quote per reviewed scope                                 |
| `11_SUPPLIERS`             | Supplier/contact/tax library; restricted                                    | `suppliers`, protected `supplier_private_details`                                      | Normalized duplicate index; least-privilege field access                                 |
| `12_EVIDENCE`              | File metadata, digest and storage reference; restricted                     | `evidence_objects`, `evidence_links`                                                   | Unique storage object; digest/entity duplicate index; private object policy              |
| `13_EVENTS`                | Event series and schedule; internal/request-safe subset                     | `event_series`, `events`                                                               | Unique code; valid date range; archived/active rules                                     |
| `14_USERS_ACCESS`          | Identity, role and permission flags; highly restricted                      | Identity-provider subject mapping, `users`, `roles`, `user_roles`, `permission_grants` | Unique normalized institutional email/subject; deny by default; access-review timestamps |
| `15_STATUS_HISTORY`        | Append-only transitions; restricted                                         | `status_history`                                                                       | Append-only; entity/type/time and idempotency indexes                                    |
| `16_AUDIT_LOG`             | Actor, before/after, correlation and idempotency results; highly restricted | `audit_logs`, `idempotency_records`                                                    | Append-only; unique `(scope, idempotency_key)`; protected actor/context fields           |
| `17_CONFIG`                | Non-secret operational configuration and revision; restricted               | Environment config service plus `application_settings`                                 | Environment-scoped unique key; secrets stay in secret manager                            |
| `18_ERROR_LOG`             | Stack traces and operation context; highly restricted                       | Structured observability platform and bounded `error_events`                           | Access-controlled retention; no public stack/value exposure                              |
| `19_MIGRATION_MAP`         | Legacy coordinate and review decision; restricted integrity                 | `migration_mappings`, `migration_runs`                                                 | Unique legacy sheet/row/block; explicit approval and immutable applied result            |
| Four preserved legacy tabs | Original migration evidence; restricted, read-only                          | Encrypted migration archive plus provenance rows                                       | No in-place correction; checksum and custodian record                                    |

## Future transaction shape

One future command transaction must commit business rows, ledger entries, status history, audit, idempotency result, and an outbox event together. A separate worker may then project the outbox event to reporting Sheets. The projection stores the outbox event ID as its idempotency key and updates a checkpoint only after the Sheet write is verified. A failed projection retries with backoff and eventually moves to a dead-letter queue; it never rolls back the committed PostgreSQL business transaction.

PostgreSQL row-level security can narrow requester reads, but privileged workflow commands still belong in server-side functions using an explicit authorization policy. Browser credentials must never receive permission to insert or update ledger, audit, idempotency, role, or migration tables directly.

## Classification and retention owners

| Class                         | Examples                                                                     | Default handling                                                          | Decision owner                     |
| ----------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------- | ---------------------------------- |
| Public/request-safe           | Approved event name/date and sanitized catalog suggestion                    | May be returned only by the request-only DTO                              | DOL data owner                     |
| Internal operational          | Item metadata, request purpose, statuses, storage context                    | Authorized staff only; no public links                                    | DOL data owner                     |
| Restricted personal           | Student ID, borrower/requester contact, user email                           | Collect minimum; role-scoped access; deletion/retention schedule required | HAU privacy/data protection owner  |
| Restricted commercial         | Supplier contact, quote source, tax information                              | Procurement/admin scope only                                              | DOL and finance/procurement owner  |
| Restricted security/integrity | Resource IDs, audit/error details, idempotency responses, migration evidence | Admin/auditor scope; never client logs or public evidence packs           | System owner and security reviewer |

Retention durations are unresolved institutional decisions and must be recorded before production. Until approved, do not automate destructive deletion. Legal hold, incident preservation, ledger immutability, and backup expiry need separate rules rather than one blanket retention period.
