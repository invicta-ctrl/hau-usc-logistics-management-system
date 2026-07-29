# Domain Rules

## Inventory and ledger

- Catalog records contain metadata and the preserved launch opening quantity. All later quantity changes are ledger movements.
- Every receipt, issue, loan, return, adjustment, emergency issue, and transfer is an immutable ledger movement.
- Every movement stores unique ID, type, direction, quantity, item/event-item, related entity, idempotency key, actor, timestamp, note, and audit correlation ID.
- Raw negative balances remain visible. Allocation views may clamp to zero, but audit values are never hidden.
- New allocations are blocked when available-to-promise is insufficient or negative.

## Reservations

- Request submission never reserves or deducts stock.
- Acceptance recalculates full/partial/none/new routing from current available-to-promise.
- All line routing and reservations commit together. Any failure rolls back the request, lines, deliverables, and reservations.
- Release/handoff consumes the exact active reservation; missing or insufficient reservations block stock lines.

## Requests and parent status

- Request: `FOR_REVIEW -> ACCEPTED | REJECTED | CANCELLED`.
- Lines route to stock (`READY_TO_RELEASE`) or procurement (`FOR_CANVASSING`); partial availability creates two child lines.
- Parent status is always recomputed from active children: all complete/restocked -> `COMPLETED`; any partial/completed child with remaining work -> `PARTIALLY_FULFILLED`; progressed children -> `ACCEPTED`; untouched children -> `FOR_REVIEW`; no active children -> `CANCELLED`.

## Receiving

- Each receipt is immutable. `quantityReceivedTotal` is the sum of receipts, never an overwritten field.
- `0 < total < required` -> `PARTIALLY_RECEIVED`.
- Event total equals required -> `READY_TO_RELEASE`; restock total equals required -> `RESTOCKED`.
- Totals above the authorized quantity raise `OVER_RECEIPT` unless an authorized amendment increases the limit.
- Damage, rejection, shortage/backorder, substitution, supplier, receipt status, evidence, condition, receiver, and timestamp remain attached to each receipt.
- Restock receipts address one `restockRequestId` and `requestLineId`; siblings are never completed implicitly.

## Release

- Release validates positive quantity, request remainder, reservation balance for stock, physical balance, and event-item balance when applicable.
- One atomic command appends the `ISSUE`, consumes reservation, updates line, derives parent, creates release history, and appends audit.
- Partial release requires a reason. Duplicate retries return the stored result.

## Lending

- Handling and lending audience are separate policies. Supported handling values are `CONSUMABLE`, `LOANABLE`, `REUSABLE_ASSET`, and `NON_CIRCULATING`.
- Supported audiences are `NOT_AVAILABLE_FOR_LENDING`, `USC_STAFF_ONLY`, `STUDENTS_AND_STAFF`, and future-ready `DOL_INTERNAL_ONLY`.
- `STUDENTS_AND_STAFF` permits student/`ANGELITE` and `USC_STAFF` borrowers. `USC_STAFF_ONLY` permits only `USC_STAFF`. `NOT_AVAILABLE_FOR_LENDING` always blocks Lending Hub circulation. `DOL_INTERNAL_ONLY`, when used, requires an eligible authenticated DOL user.
- Loanable and reusable-asset lifecycle: `FOR_REVIEW -> READY_TO_CLAIM -> ON_LOAN -> RETURNED`; a future due date is required and past-due `ON_LOAN` displays as `OVERDUE`.
- Consumables require no return due date and follow `FOR_REVIEW -> READY_TO_CLAIM -> COMPLETED`.
- Non-circulating, inactive, archived, and `VERIFY` items cannot create lending tickets.
- Ticket quantity must be positive, no greater than configured `Maximum_Loan_Qty`, and no greater than current available-to-promise. These checks run at creation and are repeated during approval/handoff where applicable.
- Handoff requires exact reservation and creates one `LOAN_OUT`/`ISSUE`.
- Return is allowed only from active/overdue loan. Restored quantity excludes lost and unusably damaged quantity. A completed ticket cannot return again.

## Catalog management

- Item IDs, opening quantity, current on-hand, reservations, available-to-promise, posted ledger rows, and legacy provenance are never editable catalog metadata.
- A new item receives a server ID. Any authorized initial quantity is an append-only ledger movement, not a metadata overwrite.
- Unit changes are blocked after any dependent ledger, reservation, lending, request-line, restock, or release history exists. Genuine corrections require a separate documented administrative migration/correction workflow.
- Archive requires raw on-hand of zero, active reservations of zero, and no open lending or active request/release dependency. Archive preserves history and forces lending audience to `NOT_AVAILABLE_FOR_LENDING`.
- Restore preserves all history. An item with a verification note returns to `VERIFY`; other safe restores default to staff-only unless an explicit reviewed audience is supplied.
- Catalog mutations require `Can_Manage_Catalog`, a script lock, idempotency, before/after audit data, and status history for status changes.
- Nonzero initial stock additionally requires receive or admin permission, is posted only through the append-only ledger, and is rejected for VERIFY or inactive items. Catalog-only users create at zero and use the approved receiving workflow.

## Data revision

- Each successful non-replay mutation advances the shared data revision exactly once, including commands that write multiple rows atomically.
- An idempotent replay returns the original result and does not advance the revision again.
- Bootstrap reads, revision reads, searches, diagnostics, health checks, and validation-only reads do not advance the revision.
- Direct relevant human spreadsheet edits advance the revision through the installable operational edit trigger. Edits to the human README tab and the revision rows themselves are ignored to prevent loops.

## Transfers

- Transfer quantity must be positive and no greater than raw event-item balance.
- Existing destinations require compatible unit/handling, semantic confirmation, explicit reason, and supervisor permission.
- New destinations require a controlled category; a description is never used as category.
- OUT and IN movements receive separately allocated unique IDs and share one mapping/correlation record with retained provenance.

## Idempotency and errors

- Every irreversible command requires an idempotency key.
- Repeating a completed key returns the original result without new movements.
- Errors include code, safe message, correlation ID, retryable flag, optional field errors, and development-only cause logging.
