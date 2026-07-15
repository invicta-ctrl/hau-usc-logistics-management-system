# Venue and Equipment Reference and Request Workflow

## Status and authority

- Slice: Phase 4 / Slice 9.
- Owner decision: the 2026-07-15 instruction accepting all recommended master
  program decisions approves the defaults recorded in Section 12 of the master
  plan.
- Permanent committees remain exactly `COM_FOOD`, `COM_INVENTORY_PANTRY`, and
  `COM_MATERIALS`. Venue and Equipment is a request component, never a fourth
  permanent committee.
- Routing is server-selected from an active, effective-dated reference/routing
  revision. Client labels, aliases, or regular expressions never grant or
  select authority.

## Reference contract

Venue and equipment/logistics references use stable IDs and immutable revision
snapshots. A request-safe reference contains only:

- reference type `VENUE` or `EQUIPMENT`;
- controlled category ID, display name, aliases, and optional safe location;
- exact controlled unit;
- `REQUESTABLE` or `NOT_REQUESTABLE` wording, effective dates, and active or
  archived lifecycle;
- instructions, business-day lead time, responsible office ID, approving
  authority ID, and contact role only (never private contact details);
- an effective route ID/revision to one approved existing committee and
  optional approved owner;
- whether an equipment reference creates a return obligation; and
- the reference revision and source revision needed for historical rendering.

`REQUESTABLE` means the reference may be requested. It does not promise a room,
time slot, equipment stock, reservation, or booking. Only an approved future
schedule/inventory integration may provide such a guarantee.

The live Apps Script catalog is additive and initially empty. No institutional
name, office, authority, or reference is invented in source. Synthetic
`SYN-*` references exist only in mock/test fixtures. Activation requires an
approved external list; no import, backfill, or external write occurs in this
slice.

## Search and selection

- Server lookup is bounded, request-safe, keyboard-compatible, and grouped by
  reference type/category.
- Normalized IDs, names, and aliases are unique within the active catalog;
  conflicts fail closed rather than choosing the first match.
- Archived, inactive, not-yet-effective, expired, or not-requestable references
  cannot be selected for a new child.
- Venue selection uses a searchable combobox. Equipment uses predictive search,
  add, quantity/unit, edit/remove, and a selected summary.
- Exact unit and submitted reference revision are server validated.
- `OTHER_CONTROLLED` is constrained free text routed through an explicit active
  `OTHER` triage rule. It never creates a catalog record. It remains visibly
  pending classification until an authorized reviewer records a disposition.

## Child and routing contract

A specialized Venue and Equipment child stores version `1`, purpose/schedule
context, normalized lines, reference snapshots, routing snapshots, Other triage
state, confirmation state, blocker state, return obligation state, and linked
evidence. Amendments preserve operational decisions and immutable prior
snapshots in provenance history while revalidating the live catalog.

Every selected line must resolve to one effective route and all lines in one
child must resolve to one owner committee. A conflict fails closed with a safe
routing error; there is no text-guessing or fourth-committee fallback while the
specialization is active. The child owner is derived from the route, and every
read/mutation is reauthorized against that stored scope.

Handoff requires confirmed routing/request acceptance, resolved blockers, and
an approved Other disposition. Completion rechecks those conditions, requires
component-linked uploaded confirmation evidence, and requires all equipment
return obligations to be resolved. Status history and audit are append-only;
posted ledger entries are never edited or deleted.

## Runtime, migration, and rollback

- New reference-based sections are controlled by the fail-closed
  `HAU_VENUE_EQUIPMENT_REQUESTS_ENABLED` property. The property is not changed
  by repository work.
- Stored specialized children remain readable/actionable if new specialized
  submission is disabled.
- Schema changes are additive. No historical request is reinterpreted and no
  reference/routing import runs in this slice.
- Rollback disables new specialized selection, preserves snapshots/history, and
  uses a focused code revert. It never deletes references, children, evidence,
  history, audit, or ledger records.

## Acceptance evidence

- reference/alias/effective-date/requestability validation;
- truthful requestability wording and no booking claim;
- keyboard search, grouping, predictive add/edit/remove, Other triage, and
  mobile/desktop rendering;
- server-owned routing to an existing committee, route conflicts, permission
  scope, revision/idempotency/locking, and no fourth committee;
- amendment/history behavior after catalog revision/archive;
- confirmation, blocker, return, evidence, and parent-derivation transitions;
- every composite combination remains valid;
- deterministic generated parity, sensitive-value scan, full repository and
  browser gates, independent review, focused push, and green CI.
