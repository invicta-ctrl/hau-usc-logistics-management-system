# Materials Committee workflow contract

Status: Slice 8 repository contract. This document defines additive application
behavior only; it does not authorize a migration, deployment, Script Property
change, Google Sheets/Drive write, or posted ledger transaction.

## Request contract

Each non-empty `MATERIALS` composite section creates exactly one independently
actionable child owned by `COM_MATERIALS`. Its `materials.version` is `1` and it
contains:

- one controlled material category: `OFFICE_SUPPLIES`, `PRINTING_SIGNAGE`,
  `EVENT_MATERIALS`, `CLEANING_SUPPLIES`, or `OTHER_CONTROLLED`;
- a bounded exact specification and bounded operational usage/purpose;
- an ISO `YYYY-MM-DD` required-by date;
- a requester sourcing preference of `STOCK_REVIEW` or
  `PROCUREMENT_REQUIRED`;
- positive exact line quantities in the controlled units `piece`, `box`,
  `pack`, `ream`, `roll`, `sheet`, `bottle`, `meter`, `kilogram`, or `liter`;
- a committee-owned fulfillment path, substitution decision, blocker state,
  and fulfillment-evidence reference.

`OTHER_CONTROLLED` requires a meaningful specification. Arbitrary units,
implicit conversion, automatic equivalence, and silent normalization are
invalid.

## Catalog reference and provenance rules

A free-text line creates no stock authority. A catalog-backed line is accepted
only when the server resolves its stable reference and verifies all of the
following:

1. The item exists and is active.
2. Its status is not `VERIFY`.
3. The submitted name exactly matches the server source name, ignoring case
   only; it is not silently renamed.
4. The submitted unit exactly matches the server source unit.
5. The persisted immutable snapshot records the reference ID, exact source
   name, requested quantity, source unit/status, and any legacy source sheet,
   row, and block.

`VERIFY` items remain non-transactable. This slice records request and workflow
state only and never posts a reservation, issue, receipt, release, reversal, or
other ledger movement.

## Fulfillment, substitution, blocker, and evidence matrix

| Decision | Allowed value | Server rule |
| --- | --- | --- |
| Fulfillment path | `PENDING_DECISION` | Initial state only; cannot reach handoff. |
| Fulfillment path | `STOCK_ISSUE` | Exclusive authoritative path; completion evidence must be `MATERIALS_ISSUE_PROOF` linked to this component. |
| Fulfillment path | `PROCUREMENT_RECEIPT` | Exclusive authoritative path; completion evidence must be `DELIVERABLE_RECEIPT` linked to this component. |
| Substitution | `EXACT_ONLY` | Default; substitute reference and reason must remain empty. |
| Substitution | `APPROVED_SUBSTITUTION` | Requires an active, non-`VERIFY` replacement reference and a recorded approval reason; no automatic choice occurs. |
| Blocker | `NONE` | Blocker reason is cleared. |
| Blocker | `BLOCKED` | A bounded reason is mandatory and handoff is denied. |

The scalar fulfillment path prevents stock and procurement from both claiming
authoritative fulfillment. Changing the path never creates a transaction.
Uploaded evidence is revalidated by exact type, entity type, component ID, and
`UPLOADED` state before it can be linked or used for completion.

## Lifecycle and concurrency

- Generic component lifecycle remains `FOR_REVIEW` → `ACCEPTED` →
  `IN_PROGRESS` → optional `PARTIALLY_FULFILLED` → `READY_FOR_HANDOFF` →
  `COMPLETED`.
- `READY_FOR_HANDOFF` requires one non-pending fulfillment path, no active
  blocker, and a complete approved-substitution decision where applicable.
- `COMPLETED` requires path-matching uploaded fulfillment evidence.
- Materials mutations require `request.review`, `COM_MATERIALS` scope, an
  idempotency key, the script lock, and exact expected revision. Generic
  transition, cancel, reopen, amend, assign, and escalate paths also require
  the current Materials revision.
- Reopen and amendment recompute Materials attention; they cannot erase
  unresolved fulfillment, substitution, blocker, or evidence signals.
- Parent status is always derived from all active children; one Materials child
  cannot complete a multi-section parent by itself.

## Scoped reads and UI

The Materials queue returns only Materials children plus bounded parent event,
priority, purpose, and department context. It excludes requester email, sibling
payloads, supplier contacts/TINs, prices, payment data, and unrestricted
evidence links. UI visibility does not grant authority; server authorization is
required for every read and mutation.

The active form exposes controlled category, exact specification, required-by,
usage/purpose, sourcing preference, exact quantity, and controlled unit. The
committee queue exposes the recorded decision state and a revision-safe update
form. New Materials submissions are fail-closed behind
`HAU_MATERIALS_REQUESTS_ENABLED`; stored versioned children remain readable and
actionable when new submission is disabled.

## Rollback and external boundary

Set `HAU_MATERIALS_REQUESTS_ENABLED=false` to stop new Materials sections while
retaining stored versioned children and immutable history. A code rollback uses
a focused revert of the Slice 8 commit; it must not reset or discard unrelated
work. No deployment, migration, external Apps Script/Sheets/Drive write,
private operational-data access, or production action belongs to this slice.
