# Restock Safety Workflow

## Accepted boundary

Slice 11 replaces the prominent browser-only restock status controls with one
server-owned workflow. A restock is not a second mutable business entity: it is
the durable projection of exactly one `CATALOG_RESTOCK` request line. The
projection uses the request-line ID as its durable source identity and exposes
a stable `RRQ-<request-line-id>` display ID.

The queue primary action is **Review details**. The detail surface receives its
current status, numeric workflow revision, prerequisites, cumulative receipts,
remaining quantity, bounded timeline, allowed actions, and disabled-action
explanations from the server. A consequential action requires a summary
confirmation and a reason. Browser state never authorizes or persists a live
transition.

## Transition and prerequisite matrix

| Current status | Allowed server action | Result | Required precondition |
|---|---|---|---|
| `FOR_CANVASSING` | `SEND_TO_BUDGET_REVIEW` | `WAITING_FOR_BUDGET` | Active preferred canvass/quote and reason |
| `WAITING_FOR_BUDGET` | `AUTHORIZE_PROCUREMENT` | `TO_BE_PROCURED` | Active preferred canvass/quote and reason |
| `FOR_CANVASSING`, `WAITING_FOR_BUDGET` | `REJECT` | `REJECTED` | Reason |
| Any non-terminal, including partial receipt | `CANCEL` | `CANCELLED` | Reason; completed receipts and ledger remain immutable |
| `TO_BE_PROCURED`, `PARTIALLY_RECEIVED` | line-level receipt | `PARTIALLY_RECEIVED` or `RESTOCKED` | Receive capability, exact line/item/unit, expected revision, positive quantity, no over-receipt |

`RESTOCKED`, `REJECTED`, and `CANCELLED` are terminal for this slice. There is
no status-button path to `RESTOCKED`: only cumulative immutable receipts can
derive it. No transition or receipt changes any sibling request line.

## Authority, concurrency, and persistence

- Detail reads require internal request visibility in the Inventory and Pantry
  committee scope. Review/procurement transitions require the corresponding
  server capability and scope. Receiving separately requires receive
  capability and scope.
- Every mutation requires a client idempotency key, obtains the script lock,
  re-reads the line, compares `expectedRevision`, validates current state and
  prerequisites, and increments `Workflow_Revision` exactly once.
- A replay returns the recorded result without another status, receipt, ledger,
  history, audit, or shared-revision write.
- A receipt appends an immutable `08_RESTOCK` row and one immutable
  `PURCHASE_RECEIPT` ledger row before updating only the linked request line.
  Parent request state is then derived from all active children.
- `HAU_RESTOCK_WORKFLOW_ENABLED=false` is the fail-closed rollback/default for
  consequential actions. Read-only queue/detail remains available.

## Safe DTO and UI

Queue/detail data is allowlisted. It may include stable IDs, item name and unit,
bounded requester/department context, requested/received/remaining quantities,
status/revision/timestamps, preferred-quote summary without supplier private
fields, safe receipt summaries, and status-history reason/time. It excludes
supplier TIN, contacts, raw Sheet rows, Drive IDs, audit internals, identities
outside approved display context, and configuration values.

After a durable result the client refreshes authoritative restocking module
state before showing final success. If refresh fails, it reports that the action
was recorded and instructs the operator to refresh without resubmitting.

## Rollback and external boundary

Disable `HAU_RESTOCK_WORKFLOW_ENABLED` to remove all consequential actions and
retain read-only queue/detail. Never delete or rewrite receipts, ledger rows,
status history, audit, or idempotency records. Slice 11 performs no deployment,
property change, live schema setup, migration/import, or Google external write.
