# Domain Rules

## Inventory and ledger

- Catalog records contain metadata only.
- Every opening balance, receipt, issue, loan, return, adjustment, emergency issue, and transfer is an immutable ledger movement.
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

- Loanable lifecycle: `FOR_REVIEW -> READY_TO_CLAIM -> ON_LOAN -> RETURNED`; past-due `ON_LOAN` displays as `OVERDUE`.
- Consumables: `FOR_REVIEW -> READY_TO_CLAIM -> COMPLETED`.
- Handoff requires exact reservation and creates one `LOAN_OUT`/`ISSUE`.
- Return is allowed only from active/overdue loan. Restored quantity excludes lost and unusably damaged quantity. A completed ticket cannot return again.

## Transfers

- Transfer quantity must be positive and no greater than raw event-item balance.
- Existing destinations require compatible unit/handling, semantic confirmation, explicit reason, and supervisor permission.
- New destinations require a controlled category; a description is never used as category.
- OUT and IN movements receive separately allocated unique IDs and share one mapping/correlation record with retained provenance.

## Idempotency and errors

- Every irreversible command requires an idempotency key.
- Repeating a completed key returns the original result without new movements.
- Errors include code, safe message, correlation ID, retryable flag, optional field errors, and development-only cause logging.
