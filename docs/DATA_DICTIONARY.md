# Data Dictionary

Canonical identifiers are strings and are never sheet row numbers. Date-times are stored as ISO-like values rendered in `Asia/Manila`; date-only fields remain date-only strings where applicable. Quantities are finite non-negative numbers; movement commands require positive quantities.

| Concept | Identity | Quantity/status authority | Important links |
|---|---|---|---|
| Item | `Item_ID` (`ITM-`) | Opening quantity plus posted item ledger; `VERIFY` blocks transactions | Legacy sheet/row/block, catalog type, storage, handling, lending audience |
| Ledger transaction | `Transaction_ID` (`TXN-`) | Immutable signed movement | item/event item, related entity, idempotency key |
| Request | `Request_ID` (`LREQ-`) | Parent status derived from lines | event, requester, parent request |
| Request line | `Request_Line_ID` (`RL-`) | Requested/received/released quantities plus `Workflow_Revision` for guarded restock mutations | item/event item, split group |
| Reservation | `Reservation_ID` (`RSV-`) | `ACTIVE` quantities reduce ATP | request line or lending ticket |
| Lending ticket | `Lending_Ticket_ID` (`LND-`) | circulation status + ledger | borrower, item, due date |
| Release | `Release_ID` (`REL-`) | posted release header plus ledger | request/lines/evidence |
| Restock receipt | `Restock_ID` (`RST-`) | immutable receipt and purchase ledger | item/request line/evidence |
| Deliverable | `Deliverable_ID` (`DEL-`) | procurement and cumulative receipt state | request line/event/EIT |
| Canvass | `Canvass_ID` (`CAN-`) | quote reference, preferred flag | supplier/request line/deliverable |
| Supplier | `Supplier_ID` (`SUP-`) | active/archive state | quote history |
| Evidence | `Evidence_ID` (`EVD-`) | upload status and digest | Drive file and operational entity |
| Status history | `History_ID` (`HIS-`) | append-only state changes | any entity |
| Audit log | `Audit_ID` (`AUD-`) | append-only actions/correlation | any entity |
| Migration mapping | `Migration_ID` (`MAP-`) | explicit approval/apply decision | legacy source and new item |
| Data revision | `DATA_REVISION` config key | monotonic exactly-once successful mutation counter | update timestamp and environment |

`RRQ-<Request_Line_ID>` is a stable display/projection identifier for a durable
catalog-restock request line. It is not a second persisted workflow record and
must never be generated independently of the linked `Request_Line_ID`.

## Catalog and circulation fields

| Field | Meaning |
|---|---|
| `Handling` | physical workflow: `CONSUMABLE`, `LOANABLE`, `REUSABLE_ASSET`, or `NON_CIRCULATING` |
| `Lending_Audience` | eligibility: `NOT_AVAILABLE_FOR_LENDING`, `USC_STAFF_ONLY`, `STUDENTS_AND_STAFF`, or `DOL_INTERNAL_ONLY` |
| `Catalog_Type` | `OFFICE_INVENTORY`, `PANTRY`, or `EVENT_SPECIFIC` |
| `Storage_Location` | descriptive physical location; never quantity authority |
| `Reorder_Threshold` | non-negative planning threshold; never an automatic ledger movement |
| `Default_Loan_Days` | positive default due-date interval for returnable items; blank otherwise |
| `Maximum_Loan_Qty` | optional positive per-ticket ceiling, rechecked against live ATP |
| `Approval_Required` | boolean circulation/catalog policy; default true |
| `Updated_At`, `Updated_By` | latest catalog metadata attribution |
| `Can_Manage_Catalog` | explicit user permission for create/update/storage/archive/restore controls; internal detail lookup also permits `Can_Review` |

Handling never implies audience. For example, a reusable asset can be staff-only, students-and-staff, or unavailable. Browser labels are advisory; the server normalizes and validates canonical values.

The predictive search stores the selected `Item_ID`, not the visible query text. A query without a suggestion-backed Item ID is `ITEM_NOT_SELECTED` and cannot create a lending ticket.

Sensitive fields include student identifiers, borrower contacts, requester email, supplier TIN, Drive IDs, and access records. They never appear in public bootstrap payloads or Drive filenames.
