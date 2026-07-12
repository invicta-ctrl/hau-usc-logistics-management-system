# Data Dictionary

Canonical identifiers are strings and are never sheet row numbers. Date-times are stored as ISO-like values rendered in `Asia/Manila`; date-only fields remain date-only strings where applicable. Quantities are finite non-negative numbers; movement commands require positive quantities.

| Concept | Identity | Quantity/status authority | Important links |
|---|---|---|---|
| Item | `Item_ID` (`ITM-`) | Opening quantity plus posted item ledger; `VERIFY` blocks transactions | Legacy sheet/row/block |
| Ledger transaction | `Transaction_ID` (`TXN-`) | Immutable signed movement | item/event item, related entity, idempotency key |
| Request | `Request_ID` (`LREQ-`) | Parent status derived from lines | event, requester, parent request |
| Request line | `Request_Line_ID` (`RL-`) | Requested/received/released quantities | item/event item, split group |
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

Sensitive fields include student identifiers, borrower contacts, requester email, supplier TIN, Drive IDs, and access records. They never appear in public bootstrap payloads or Drive filenames.
