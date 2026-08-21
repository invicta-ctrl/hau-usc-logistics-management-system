# Inventory Slice 2 Repair Register

Status: COMPLETE
Slice 1 ending / Slice 2 starting SHA: `77286cc65827070c7d93a07eaf4454c28d2d1147`
Accepted specification: `.codex/specs/active/v0.8.0-inventory-truth-ledger-lock-slice-2.md`
Migration impact for every accepted item: `NONE`

Every runtime change below maps to a Slice 1 defect classified `REPAIR_IN_SLICE_2`.

## V080-S1-INV-01

- **Classification:** `REPAIR_IN_SLICE_2`
- **Slice 1 invariants:** INV-05, INV-06, INV-07, INV-08, INV-09, INV-10
- **Severity:** P2
- **Reproduction:** production client calls `transferEventItemToInventory`, while the
  Worker capability map and D1 mutation map have no method; current call fails with
  safe operation-not-found before D1 dispatch.
- **Authoritative current boundary:** client adapter -> Worker capability/dispatch ->
  D1 operational service atomic batch.
- **Exact current test gap:** no Worker/D1 paired-transfer test covering authorization,
  availability recheck, shared logical identity, replay, over-transfer denial, and
  all-or-nothing ledger/audit/idempotency effects.
- **Smallest repair boundary:** existing client method name, Worker capability mapping,
  and one D1 atomic mutation using current schema-30 relation fields.
- **Affected direct callers:** production legacy runtime event-item transfer action.
- **Adjacent invariants unchanged:** global ledger-derived on-hand, reservations, request
  submission, immutable history, privacy, and Google non-authority.
- **Migration impact:** `NONE`
- **Root cause:** the launch/client contract advertised the method, but the D1 method,
  capability, and dispatch entries were absent.
- **Files/boundary changed:** `src/server/d1/operational-service.js` and the focused
  schema-30 D1 regression harness.
- **Post-fix result:** one authorized command appends a distinct outbound/inbound pair
  under one mapping; exact retry replays, altered payload conflicts, over-transfer is
  denied, and two same-snapshot transfers accept only one.
- **Adjacent invariant proof:** denial appends no rows; the losing race leaves exactly
  the two pairs from accepted commands, and authoritative source/target balances are
  1 and 5 respectively after the deterministic fixture.

## V080-S1-INV-02

- **Classification:** `REPAIR_IN_SLICE_2`
- **Slice 1 invariants:** INV-02, INV-04, INV-06, INV-07, INV-08, INV-09
- **Severity:** P2
- **Reproduction:** schema supports reservation cancellation, but no governed command
  releases an active accepted Request/Lending reservation without physical movement.
- **Authoritative current boundary:** accepted parent Request/Lending transition -> D1
  reservation/status/history/audit/idempotency batch.
- **Exact current test gap:** no authorized active-reservation cancellation/release test
  proving on-hand unchanged, reserved/ATP restored, one retry effect, stale/closed
  rejection, and denied-actor no-effect.
- **Smallest repair boundary:** integrate reservation release into current accepted
  Request/Lending cancellation semantics; do not add a new reservation feature family.
- **Affected direct callers:** current Request and Lending cancellation actions.
- **Adjacent invariants unchanged:** request submission non-deduction, fulfillment
  consumption semantics, custody, explicit stock history, privacy, Google non-authority.
- **Migration impact:** `NONE`
- **Root cause:** both cancellation commands rejected every post-review state even
  though approval creates the active reservation and schema 30 supports cancellation.
- **Files/boundary changed:** `src/server/d1/operational-service.js`, requester and
  borrower cancellation actions, and the focused schema-30 D1 regression harness.
- **Post-fix result:** accepted Request and ready-to-claim Lending cancellation atomically
  cancel active reservations; reusable assignments are restored with append-only asset
  movement; exact retry produces one result.
- **Adjacent invariant proof:** on-hand is unchanged, reserved/ATP is restored, and a
  forced stale parent-state update rejects with no reservation/history/audit/idempotency
  residue.

## V080-S1-INV-03

- **Classification:** `REPAIR_IN_SLICE_2`
- **Slice 1 invariants:** INV-01, INV-05, INV-06, INV-07, INV-08, INV-09
- **Severity:** P2
- **Reproduction:** two distinct authorized cycle-count commands can read the same
  on-hand and independently insert the same adjustment because the batch lacks an
  in-transaction current-balance/revision sentinel.
- **Authoritative current boundary:** D1 `postCycleCountAdjustment` read/compute/batch.
- **Exact current test gap:** no deterministic same-item/same-count distinct-key race
  proving final on-hand equals the physical count with one accepted adjustment effect.
- **Smallest repair boundary:** reuse the existing schema-30 atomic revision/sentinel
  pattern before ledger insertion; keep audit/history/idempotency in the same batch.
- **Affected direct callers:** authorized Inventory cycle-count adjustment command.
- **Adjacent invariants unchanged:** ledger-derived on-hand, retry replay contract,
  append-only history, server authorization/privacy, Google non-authority.
- **Migration impact:** `NONE`
- **Root cause:** the adjustment delta was computed before an unconditional batch and
  replay lookup happened only after the stale balance comparison.
- **Files/boundary changed:** `src/server/d1/operational-service.js` and the focused
  schema-30 D1 race regression.
- **Post-fix result:** replay is resolved first and a current-on-hand sentinel guards the
  ledger insert inside the atomic batch.
- **Adjacent invariant proof:** two same-snapshot commands yield one accepted adjustment,
  one `INVENTORY_COUNT_STALE`, final on-hand equal to the count, and winner replay with
  no second ledger effect.

## V080-S1-INV-04

- **Classification:** `REPAIR_IN_SLICE_2`
- **Slice 1 invariants:** INV-01, INV-04, INV-05
- **Severity:** P3
- **Reproduction:** no-server reducers add only `IN` and subtract all other directions,
  so positive reversals/adjustments display as outbound without authoritative balances.
- **Authoritative current boundary:** presentation-only fallback reducers; D1 balances
  remain authoritative and preferred in production.
- **Exact current test gap:** no reducer matrix for `IN`, `OUT`, signed positive/negative
  `ADJUSTMENT`, and `REVERSAL`.
- **Smallest repair boundary:** one existing signed-quantity/transaction-aware helper
  reused by only the proven fallback reducers.
- **Affected direct callers:** no-server preview/legacy Inventory balance presentation.
- **Adjacent invariants unchanged:** authoritative D1 balance projection, reservation
  availability, authorization/privacy, immutable history, Google non-authority.
- **Migration impact:** `NONE`
- **Root cause:** three local reducers treated every direction other than `IN` as
  outbound and ignored explicit signed quantity.
- **Files/boundary changed:** `src/domain/inventory.js`, `src/visual/runtime.js`,
  `src/visual/runtime-extensions.js`, the D1 ledger DTO projection, and the focused
  reducer regression.
- **Post-fix result:** the shared helper prefers explicit signed quantity, otherwise
  treats only `IN` and `OUT` as implicit signed directions.
- **Adjacent invariant proof:** `IN`, `OUT`, positive/negative adjustment, and reversal
  cases pass while server-supplied authoritative D1 balances remain preferred.
