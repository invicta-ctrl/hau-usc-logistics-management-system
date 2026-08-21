# Inventory v0.8.0 Final Finding Register

Status: FINAL CANDIDATE RECONCILIATION
Slice 2 ending / Slice 3 starting SHA: `c5f53ddf44aaf28ab4a3e43b74d42f66d09e257d`
Migration impact for every item: `NONE`
Additional Slice 2 findings: `NONE`
Additional Slice 3 high-risk-review findings: eight P1 concurrency/custody/ownership gaps, all closed by
bounded schema-30 repairs below

## V080-S1-INV-01

- **Severity:** P2
- **Original evidence:** the production client advertised event-item transfer while the
  Worker capability map and D1 mutation dispatch did not implement it.
- **Slice 2 disposition:** one guarded D1 batch appends the paired outbound/inbound
  ledger rows, audit, idempotency result, and revisions.
- **Final status:** `CLOSED_BY_REPAIR`
- **Runtime change:** yes; `transferEventItemToInventory` is a supported server command.
- **Regression test:** paired transfer, denied actor, exact replay, fingerprint conflict,
  over-transfer denial, same-snapshot race, and new-destination coverage in the
  schema-30 Inventory hardening harness.
- **Migration impact:** none.
- **Reconciliation impact:** paired rows must share the logical mapping and have exact
  opposite signed quantities; an orphan or malformed pair blocks the candidate.
- **Contract-freeze impact:** transfer is supported only through the frozen command;
  direct or unpaired ledger effects are unsupported.
- **Remaining risk:** none within the accepted v0.8.0 contract.

## V080-S1-INV-02

- **Severity:** P2
- **Original evidence:** schema 30 allowed reservation cancellation, but accepted
  Request and pre-handoff Lending states had no governed command that released stock.
- **Slice 2 disposition:** accepted cancellation atomically changes the parent,
  cancels the active reservation, restores reserved reusable assets where applicable,
  and appends audit/history/idempotency evidence.
- **Final status:** `CLOSED_BY_REPAIR`
- **Runtime change:** yes; accepted Request and ready-to-claim Lending cancellation now
  release reservations without changing physical on-hand.
- **Regression test:** Request/Lending cancellation, exact replay, reusable-asset
  restoration, unchanged on-hand, restored ATP, and stale-state atomic rollback.
- **Migration impact:** none.
- **Reconciliation impact:** terminal reservations cannot contribute reserved stock;
  malformed terminal combinations are quarantined or blocking according to truth impact.
- **Contract-freeze impact:** cancellation is supported only before physical release or
  handoff and never rewrites consumption or ledger history.
- **Remaining risk:** none within the accepted v0.8.0 contract.

## V080-S1-INV-03

- **Severity:** P2
- **Original evidence:** two distinct cycle counts could derive the same stale balance
  and append duplicate adjustments.
- **Slice 2 disposition:** replay is resolved first and the atomic batch revalidates the
  current on-hand sentinel before inserting one adjustment.
- **Final status:** `CLOSED_BY_REPAIR`
- **Runtime change:** yes; stale cycle counts now fail closed with no partial effect.
- **Regression test:** same-snapshot distinct-key race, one winner, one stale rejection,
  final on-hand equal to counted quantity, and exact winner replay.
- **Migration impact:** none.
- **Reconciliation impact:** every cycle-count ledger effect must match the accepted
  counted/current-state delta and its idempotency/audit evidence.
- **Contract-freeze impact:** direct balance overwrite is unsupported; cycle counts are
  append-only adjustments guarded by authoritative current state.
- **Remaining risk:** none within the accepted v0.8.0 contract.

## V080-S1-INV-04

- **Severity:** P3
- **Original evidence:** presentation-only fallback reducers subtracted every direction
  other than `IN` and ignored explicit signed quantity.
- **Slice 2 disposition:** the proven reducers share one helper that prefers explicit
  signed quantity and uses only `IN`/`OUT` as implicit fallbacks.
- **Final status:** `CLOSED_BY_REPAIR`
- **Runtime change:** yes, presentation-only; D1 remains the authority.
- **Regression test:** `IN`, `OUT`, positive/negative `ADJUSTMENT`, and `REVERSAL`
  reducer matrix with authoritative server values preferred.
- **Migration impact:** none.
- **Reconciliation impact:** none for D1 truth; the independent ledger sum remains the
  arbiter of physical quantity.
- **Contract-freeze impact:** client reducers are presentation fallbacks and cannot
  become a mutable balance source.
- **Remaining risk:** none within the accepted v0.8.0 contract.

No item is deferred, quarantined, or waiting on an owner amendment. A later live-data
discrepancy can change that conclusion only through the dispositions in
[INVENTORY_V080_RECONCILIATION.md](./INVENTORY_V080_RECONCILIATION.md); it must never be
silently repaired.

## V080-S3-INV-01

- **Severity:** P1
- **Original evidence:** a release could retain a stale releasable-line/reservation
  snapshot while requester cancellation or another release changed the same state.
- **Slice 2 disposition:** not identified in Slice 2.
- **Final status:** `CLOSED_BY_REPAIR`
- **Runtime change:** the release batch now guards exact line status, released counter,
  item/unit, and current active-reservation coverage before any effect can commit.
- **Regression test:** real schema-30 cancellation-after-snapshot race plus static guard
  contract.
- **Migration impact:** none.
- **Reconciliation impact:** cancelled lines cannot gain consumption, ISSUE ledger, or
  confirmation effects.
- **Contract-freeze impact:** stale release loses atomically.
- **Remaining risk:** none within the accepted v0.8.0 contract.

## V080-S3-INV-02

- **Severity:** P1
- **Original evidence:** a stale lending handoff could append handoff/ledger/history
  after borrower cancellation made the ticket and reservation terminal.
- **Slice 2 disposition:** not identified in Slice 2.
- **Final status:** `CLOSED_BY_REPAIR`
- **Runtime change:** handoff now atomically guards ticket/item/reservation and assigned
  asset custody state.
- **Regression test:** real schema-30 cancellation-after-handoff-snapshot race plus
  static guard contract.
- **Migration impact:** none.
- **Reconciliation impact:** cancelled tickets cannot gain outbound stock effects.
- **Contract-freeze impact:** cancellation-first or handoff-first has one atomic winner.
- **Remaining risk:** none within the accepted v0.8.0 contract.

## V080-S3-INV-03

- **Severity:** P1
- **Original evidence:** stale or concurrent lending approval could insert active
  reservations/assets even when its ticket transition affected zero rows.
- **Slice 2 disposition:** not identified in Slice 2.
- **Final status:** `CLOSED_BY_REPAIR`
- **Runtime change:** approval/rejection use the ticket and current lendable-item state
  as an in-batch compare-and-swap; pre-guard reservation/asset writes roll back with a
  losing guard.
- **Regression test:** real schema-30 borrower-cancellation-after-review-snapshot race
  plus static approval guard contract.
- **Migration impact:** none.
- **Reconciliation impact:** a cancelled/reviewed ticket cannot retain a losing active
  reservation or idempotency result.
- **Contract-freeze impact:** exactly one review outcome wins.
- **Remaining risk:** none within the accepted v0.8.0 contract.

## V080-S3-INV-04

- **Severity:** P1
- **Original evidence:** maintenance used an id-only asset update, so a concurrent
  lending assignment could be overwritten while custody still referenced the ticket.
- **Slice 2 disposition:** not identified in Slice 2.
- **Final status:** `CLOSED_BY_REPAIR`
- **Runtime change:** maintenance now guards the exact lifecycle/update snapshot and
  requires no active lending assignment.
- **Regression test:** real schema-30 maintenance-read/approval-wins race plus static
  custody guard contract.
- **Migration impact:** none.
- **Reconciliation impact:** assigned assets cannot be moved into a contradictory
  maintenance lifecycle by a stale command.
- **Contract-freeze impact:** custody assignment and maintenance have one atomic winner.
- **Remaining risk:** none within the accepted v0.8.0 contract.

## V080-S3-INV-04B

- **Severity:** P1
- **Original evidence:** pre-handoff cancellation restored an asset to `AVAILABLE` but
  left its assignment `returned_at` null, so the schema-29/30 active-assignment unique
  index permanently blocked reassignment.
- **Slice 2 disposition:** cancellation restored lifecycle state but did not terminally
  close the assignment row.
- **Final status:** `CLOSED_BY_REPAIR`
- **Runtime change:** cancellation now records both release and terminal return timestamps
  on the unused pre-handoff assignment while preserving its immutable history.
- **Regression test:** real schema-30 reusable cancellation followed by successful
  reassignment of the same physical asset to a new ticket.
- **Migration impact:** none.
- **Reconciliation impact:** cancelled pre-handoff assignments no longer masquerade as
  active custody slots.
- **Contract-freeze impact:** asset restoration makes the asset genuinely reassignable.
- **Remaining risk:** none within the accepted v0.8.0 contract.

## V080-S3-INV-05

- **Severity:** P1
- **Original evidence:** receiving did not require an open procurement state in its
  batch, allowing a stale receipt to resurrect a cancelled deliverable/restock record.
- **Slice 2 disposition:** not identified in Slice 2.
- **Final status:** `CLOSED_BY_REPAIR`
- **Runtime change:** receiving now guards exact open status, counters, quantity ceiling,
  item, and unit before receipt/ledger/history effects.
- **Regression test:** real schema-30 deliverable-cancellation-after-receiving-snapshot
  race plus static RESTOCK/DELIVERABLE guard contract.
- **Migration impact:** none.
- **Reconciliation impact:** terminal procurement records cannot gain RECEIVE effects.
- **Contract-freeze impact:** only the exact frozen receivable states are supported;
  Restocking also accepts its authorized `TO_BE_PROCURED` state.
- **Remaining risk:** none within the accepted v0.8.0 contract.

## V080-S3-INV-06

- **Severity:** P1
- **Original evidence:** an ALL-scope actor could call `reserveStock` without a request
  line and create an orphan active reservation with no governed cancellation/release path.
- **Slice 2 disposition:** request-line atomic guards existed only when a line ID was
  supplied; the owner-scope exception remained reachable.
- **Final status:** `CLOSED_BY_REPAIR`
- **Runtime change:** every direct stock reservation now requires one governed request
  line; Lending continues to create its reservation only through lending review.
- **Regression test:** real schema-30 owner-scope orphan attempt fails with zero
  reservations, plus static contract coverage.
- **Migration impact:** none.
- **Reconciliation impact:** active reservations must have an accepted Request or Lending
  owner and cannot become permanent anonymous ATP deductions.
- **Contract-freeze impact:** `reserveStock` is line-bound without role exceptions.
- **Remaining risk:** none within the accepted v0.8.0 contract.

## V080-S3-INV-06B

- **Severity:** P1
- **Original evidence:** a caller could bind one otherwise valid Request-line reservation
  to an arbitrary Lending ticket, allowing a later Lending handoff to release stock owned
  by the Request flow and bypass the one-owner allocation contract.
- **Slice 2 disposition:** the reservation insert still accepted an optional
  `lendingTicketId` on the direct Request reservation command.
- **Final status:** `CLOSED_BY_REPAIR`
- **Runtime change:** `reserveStock` rejects a Lending owner and persists only the
  governed Request-line owner; Lending reservations remain exclusive to lending review.
- **Regression test:** real schema-30 valid-line plus foreign-Lending-owner attempt fails
  with zero reservations.
- **Migration impact:** none.
- **Reconciliation impact:** a direct stock reservation cannot be consumed or released by
  a different domain owner.
- **Contract-freeze impact:** every active reservation has exactly one governed owner path.
- **Remaining risk:** none within the accepted v0.8.0 contract.
