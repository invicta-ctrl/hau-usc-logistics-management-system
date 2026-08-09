# Inventory Truth Baseline — Schema 30

Status: v0.8.0 Slice 2 post-repair truth
Baseline SHA: `88bfdf026e716ffdc779cb2ce7534978f36df0f3`
Slice 2 starting SHA: `77286cc65827070c7d93a07eaf4454c28d2d1147`
Runtime boundary: production v0.7.2, schema 30/0030
Accepted specification: `.codex/specs/active/v0.8.0-inventory-truth-ledger-lock-slice-1.md`

This document records the current implementation; it does not change Inventory
behavior. Cloudflare D1 is the operational structured-data authority. R2 is the
authoritative evidence/file store where applicable. Apps Script, Google Sheets,
and Google Drive are packaged sidecar, projection, import/reconciliation, backup,
or reference surfaces and are not production Inventory authority.

## Canonical truth formula

Schema 24 migrated every nonzero `inventory_items.opening_quantity` into one
`OPENING_BALANCE` ledger row, zeroed the metadata column, and added insert/update
guards that reject future direct opening quantities
([0024_inventory_opening_ledger.sql](../migrations/0024_inventory_opening_ledger.sql#L1)).
The final schema-30 `inventory_balances` view therefore defines:

```text
on_hand = SUM(inventory_ledger.signed_quantity WHERE status = POSTED)
reserved = SUM(MAX(reservation.quantity - consumed_quantity, 0)
               WHERE reservation.status = ACTIVE)
available_to_promise = on_hand - reserved
```

The view is created at
[0024_inventory_opening_ledger.sql](../migrations/0024_inventory_opening_ledger.sql#L84).
`inventory_nonnegative_guard`, `reservation_capacity_guard`, and
`reservation_consumption_guard` enforce the principal capacity rules at the
database boundary
([0006_transaction_guards.sql](../migrations/0006_transaction_guards.sql#L16)).

## Authoritative schema objects

There is no separate stock-area/location table. `inventory_items.stock_area` and
`inventory_items.storage_location` are catalog metadata; quantity remains global
per item in the ledger/view contract.

| Purpose                          | Current schema objects and controls                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Item identity and classification | `inventory_items`, `item_aliases`; classification fields and `inventory_classification_history`; fail-closed unclassified/unsafe-reusable triggers; classification history is update/delete protected. See [0001](../migrations/0001_operational_schema.sql#L138), [0025](../migrations/0025_inventory_classification_workflow.sql#L1), and [0026](../migrations/0026_fail_closed_legacy_inventory.sql#L1).                                                                                                 |
| Physical quantity truth          | `inventory_ledger`, `inventory_balances`, `idx_ledger_item_created`, `idx_ledger_related`; posted ledger rows are update/delete protected and negative inserts are rejected. Opening quantity is locked at zero after migration 0024. See [0001](../migrations/0001_operational_schema.sql#L215), [0006](../migrations/0006_transaction_guards.sql#L52), and [0024](../migrations/0024_inventory_opening_ledger.sql#L84).                                                                                   |
| Reservations                     | `reservations`, `reservation_consumptions`, item/status and consumption indexes, capacity and consumption guards. Consumption rows are append-only. Reservation state itself is mutable and supports `ACTIVE`, `CLEARED`, `RELEASED`, and `CANCELLED`. See [0001](../migrations/0001_operational_schema.sql#L197) and [0006](../migrations/0006_transaction_guards.sql#L1).                                                                                                                                 |
| Request and release              | `requests`, `request_lines`, `release_confirmations`, `release_corrections`; confirmation and correction idempotency; linked reversal ledger row; correction quantity guard; correction rows append-only. See [0001](../migrations/0001_operational_schema.sql#L170) and [0022](../migrations/0022_shared_release_desk.sql#L1).                                                                                                                                                                             |
| Restocking and receiving         | `restock_requests`, `restock_receipts`, `receiving_records`; unique receipt idempotency; cumulative over-receiving triggers and indexes. See [0001](../migrations/0001_operational_schema.sql#L238) and [0006](../migrations/0006_transaction_guards.sql#L61).                                                                                                                                                                                                                                              |
| Lending and custody              | `lending_tickets`, `lending_handoffs`, `lending_returns`, `inventory_asset_instances`, `lending_ticket_assets`, `inventory_asset_movements`, `inventory_asset_maintenance`, `inventory_asset_photos`; one handoff/return per ticket; one active asset assignment; append-only movement and maintenance histories. See [0001](../migrations/0001_operational_schema.sql#L269), [0014](../migrations/0014_lending_catalog_assets.sql#L26), and [0029](../migrations/0029_reusable_asset_reassignment.sql#L1). |
| Idempotency and audit            | `idempotency_keys(scope, idempotency_key)` stores actor, request fingerprint, and result; `status_history` and `audit_log` preserve status and command evidence with update/delete guards. See [0001](../migrations/0001_operational_schema.sql#L441) and [operational-service.js](../src/server/d1/operational-service.js#L919).                                                                                                                                                                           |
| Evidence linkage                 | `evidence_metadata` links governed R2 objects to entities; release, receiving, return, classification, correction, and asset-history records carry evidence IDs/keys as applicable. Drive backup jobs and restore history are secondary recovery records; restore history is append-only. See [0001](../migrations/0001_operational_schema.sql#L423) and [0023](../migrations/0023_hybrid_evidence_storage.sql#L20).                                                                                        |
| Reconciliation and health        | `app_metadata`, `d1_migrations`, import batches/source rows, and the System Owner health projection. Inventory health independently sums posted `signed_quantity` and reports negative, low-stock, and classification counts. See [operational-health-service.js](../src/server/operational-health-service.js#L29).                                                                                                                                                                                         |

Schema 0030 adds low-stock controls only to the Inventory surface; it does not
replace the schema-24 balance contract
([0030_production_access_and_operations.sql](../migrations/0030_production_access_and_operations.sql#L248)).

## Server, transaction, and command map

The authoritative call chain is:

```text
src/visual runtime
  -> createLegacyRuntimeAdapter / HttpApiAdapter
  -> POST /api/<method>
  -> Worker session + CSRF + capability authorization
  -> createD1OperationalService.call
  -> one D1 batch containing business rows, audit/history, idempotency, revisions
```

The Worker performs the capability lookup and server authorization before dispatch
([worker/index.js](../src/worker/index.js#L1162)). The D1 method/capability map is
defined at [operational-service.js](../src/server/d1/operational-service.js#L34).
D1 `batch()` is the atomic transaction boundary used by the commands below.

| Command/effect                           | Atomic                                                 | Server-authorized                                                        | Retry protected                         | Explicit append-only effect                                                                | Focused proof                                                   |
| ---------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------ | --------------------------------------- | ------------------------------------------------------------------------------------------ | --------------------------------------------------------------- |
| `submitRequest`                          | Yes                                                    | `request.create`                                                         | Fingerprinted                           | Request, lines, status history, audit only; deliberately no stock row                      | Worker/D1 lifecycle plus `public-request-v072-contract.test.js` |
| `reserveStock`                           | Yes, including a guarded request-line compare-and-swap | `fulfillment.reserve` plus entity/location scope                         | Fingerprinted                           | Reservation + audit/history; no ledger row                                                 | Worker/D1 lifecycle and RV-01 concurrent/top-up tests           |
| `approveLendingTicket`                   | Yes                                                    | `lending.approve` plus entity scope                                      | Fingerprinted                           | Active reservation; asset assignment/movement/history when traceable                       | Worker/D1 lending and traceable-asset tests                     |
| `confirmLendingHandoff`                  | Yes                                                    | `lending.handoff` plus entity scope                                      | Fingerprinted and unique handoff/ticket | One `ISSUE` or `LOAN_OUT`, reservation release, custody/status/audit                       | Worker/D1 lifecycle and traceable-asset tests                   |
| `confirmReturn`                          | Yes                                                    | `lending.return` plus entity scope                                       | Fingerprinted and unique return/ticket  | One `LOAN_RETURN` for returned quantity, return/custody/condition history                  | Worker/D1 lifecycle and traceable-asset tests                   |
| `confirmRelease`                         | Yes                                                    | `fulfillment.release` plus entity scope                                  | Fingerprinted                           | Reservation consumption, `ISSUE`, release confirmation, status/audit                       | Worker/D1 lifecycle and RV-01 tests                             |
| `correctRelease`                         | Yes                                                    | System Owner only                                                        | Fingerprinted                           | Linked positive `REVERSAL`, compensating reservation, append-only correction/history/audit | Worker/D1 lifecycle                                             |
| `receiveRestock` / `receiveDeliverable`  | Yes; schema guard rechecks cumulative ceiling          | `fulfillment.receive` plus entity scope                                  | Fingerprinted and unique receipt        | Receiving row, receipt where applicable, `RECEIVE`, status/audit                           | Worker/D1 cumulative-receiving test                             |
| `createInventoryItem` with initial stock | Yes                                                    | catalog manage plus receive/adjust/system capability for nonzero opening | Fingerprinted                           | Catalog row and `OPENING_BALANCE`; direct opening metadata remains zero                    | Catalog and production-import tests                             |
| `postCycleCountAdjustment`               | Yes; guarded current-balance sentinel                  | `inventory.adjust`                                                       | Fingerprinted and replay-first          | `CYCLE_COUNT_ADJUSTMENT` plus audit                                                        | Slice 2 same-snapshot race and winner-replay regression         |
| Event-item transfer                      | Yes; guarded paired ledger insert                      | `inventory.merge` plus entity scope                                      | Fingerprinted                           | Paired outbound/inbound rows under one logical mapping                                     | Slice 2 paired/race/retry/denial regression                     |
| Accepted request/lending cancellation    | Yes; parent/reservation/custody/history batch          | Existing requester self-scope or lending cancellation boundary           | Fingerprinted                           | Reservation cancellation; reserved asset restoration/history where applicable              | Slice 2 cancellation/retry/stale-state regressions              |

## Direct contract consumers

- **Request:** `submitRequest` records demand only; `reviewRequest` routes lines;
  `reserveStock` is a separate explicit command. The strengthened Worker/D1 test
  proves submission leaves on-hand, reserved, ATP, and ledger count unchanged.
- **Release Desk:** `confirmRelease` revalidates line status, remaining approved
  quantity, reservation coverage, and the database nonnegative guard before its
  atomic batch. `correctRelease` is a System Owner compensating record, never an
  update/delete of the original ledger row.
- **Lending:** review creates the reservation; handoff posts the outbound effect;
  return posts only the physically returned quantity and preserves lost/damaged
  custody/maintenance history.
- **Receiving/Restocking:** receipts are cumulative append-only rows. Parent
  counters use additive updates and schema triggers prevent cumulative overage.
- **Overview/Inventory/Lending projections:** D1 joins `inventory_balances` or
  `lending_catalog_availability`; item DTOs carry authoritative values only to
  actors with `view.inventory`.

## Balance and reservation calculation inventory

| Path                                                   | Classification                                    | Finding                                                                                                                                     |
| ------------------------------------------------------ | ------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `migrations/0024` `inventory_balances`                 | **AUTHORITATIVE**                                 | Sole physical and reservation formula for schema 30.                                                                                        |
| `migrations/0014` `lending_catalog_availability`       | **DERIVED_FROM_AUTHORITATIVE**                    | Joins `inventory_balances`, adds ready/on-loan/asset availability, and never replaces on-hand.                                              |
| `operational-service.js` item queries/DTO              | **DERIVED_FROM_AUTHORITATIVE**                    | Projects view values and redacts on-hand/reserved/ATP from requester/public/non-inventory actors.                                           |
| `operational-health-service.js` posted-ledger CTE      | **DERIVED_FROM_AUTHORITATIVE**                    | Independent owner-only health/reconciliation count from posted signed ledger rows.                                                          |
| `runtime.js` `itemOnHand` / `availableToPromise`       | **PRESENTATION_ONLY** in production               | Production prefers server-supplied values; the no-server fallback now consumes the canonical explicit signed quantity helper.               |
| `runtime-extensions.js` `inventoryBalance`             | **PRESENTATION_ONLY**                             | Production recomputes ATP from supplied authoritative values; its fallback now uses the same explicit signed quantity helper.               |
| `src/domain/inventory.js` and `src/features/inventory` | **LEGACY_OR_DEAD** for the built production entry | The alternate/mock reducer now honors explicit signed quantity and treats only `IN`/`OUT` as implicit direction fallbacks.                  |
| `src/services/mock-service.js`                         | **PRESENTATION_ONLY / TEST DOUBLE**               | In-memory preview contract with serialized mutations and local ledger/reservation calculations; not runtime authority.                      |
| `apps-script/InventoryService.gs` and related services | **LEGACY SIDECAR — NOT RUNTIME AUTHORITY**        | Sheet calculations remain packaged for reference/recovery compatibility. Production does not consult them when D1 or Google is unavailable. |

## Invariant coverage matrix

| Invariant                                    | Current boundary                                                                   | Post-Slice-2 proof                                                                         | Result                          |
| -------------------------------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ------------------------------- |
| INV-01 one physical truth                    | Schema-24 `inventory_balances`; ledger/update/delete/opening guards                | Existing production-import/Worker proof plus Slice 2 transfers use only the D1 ledger/view | **PASS**                        |
| INV-02 reservation does not change on-hand   | Reservations and consumptions remain distinct from ledger movement                 | Accepted request/lending cancellation restores ATP while on-hand remains unchanged         | **PASS**                        |
| INV-03 request submission does not deduct    | Submission batch contains no stock effect                                          | Existing public Request and Worker/D1 lifecycle proof                                      | **PASS_WITH_EXISTING_EVIDENCE** |
| INV-04 consistent availability               | Schema view exact formula; presentation fallback consumes explicit signed quantity | Schema-30 harness plus signed adjustment/reversal reducer regression                       | **PASS**                        |
| INV-05 explicit movements/history            | All physical effects append ledger/movement/history rows                           | Transfer pair, lending asset restoration, existing receive/release/lending proof           | **PASS**                        |
| INV-06 retry safety                          | Canonical fingerprinted `idempotency_keys` in the same atomic batch                | Exact retry, altered-payload conflict, cancellation replay, cycle winner replay            | **PASS**                        |
| INV-07 authorization/privacy                 | Server capability/entity/self-scope and protected projections                      | Transfer denial has no effect; existing public Request/Lending privacy contracts pass      | **PASS**                        |
| INV-08 append-only history                   | Ledger, status, audit, custody, and evidence histories remain additive             | Repairs insert paired/compensating records and never update/delete immutable history       | **PASS**                        |
| INV-09 no negative/impossible accepted state | Guarded D1 sentinels plus schema triggers and uniqueness constraints               | Transfer and cycle races accept one effect; stale cancellation leaves no partial effect    | **PASS**                        |
| INV-10 Google not authority                  | Worker -> D1/R2; Google remains sidecar/recovery                                   | No Google path or external write changed                                                   | **PASS_WITH_EXISTING_EVIDENCE** |

## Defect and gap register

### V080-S1-INV-01 — P2 — transfer client/server contract mismatch

- **Reproduction:** the production launch contract and
  `legacy-runtime-adapter.transferEventItemToInventory()` issue
  `POST /api/transferEventItemToInventory`, while `METHOD_CAPABILITIES` and
  `mutationHandlers` contain no such method. The generic Worker route therefore
  returns `OPERATION_NOT_FOUND` before D1 dispatch.
- **Root boundary:** [launch-service-contract.js](../src/services/launch-service-contract.js#L1),
  [legacy-runtime-adapter.js](../src/services/legacy-runtime-adapter.js#L478), and
  [operational-service.js](../src/server/d1/operational-service.js#L8793).
- **Consequence:** the claimed production event-item transfer cannot create its
  outbound/inbound ledger pair; mock/Apps Script behavior is not production proof.
- **Slice 2 regression:** Worker/D1 test for one atomic paired transfer with distinct
  transaction IDs, shared relation, replay safety, available-quantity recheck, and over-transfer denial.
- **Smallest repair:** add the D1 method, capability mapping, and existing client-name
  handler; no schema change.
- **Migration impact:** none.

### V080-S1-INV-02 — P2 — no governed release/cancel path for an active reservation

- **Reproduction:** schema supports `CANCELLED`, but server writes reservation state
  only during lending handoff (`RELEASED`) and request release consumption. Requester
  and lending cancellations are limited to `FOR_REVIEW`, before a reservation exists.
- **Root boundary:** [operational-service.js](../src/server/d1/operational-service.js#L4124),
  [operational-service.js](../src/server/d1/operational-service.js#L4564), and
  [operational-service.js](../src/server/d1/operational-service.js#L5306).
- **Consequence:** an accepted request/lending reservation that will no longer proceed
  has no ordinary command to restore ATP without completing a physical movement.
- **Slice 2 regression:** create an active reservation, cancel/release it through an
  authorized parent transition, then prove on-hand unchanged, reserved/ATP restored,
  history/audit appended, and retry creates one effect.
- **Smallest repair:** bounded reservation-cancellation service path integrated with
  accepted Request/Lending cancellation semantics.
- **Migration impact:** none; the existing status and history/idempotency tables suffice.

### V080-S1-INV-03 — P2 — cycle-count adjustment lacks a stale-balance concurrency guard

- **Reproduction:** two distinct authorized calls can read the same `on_hand`, compute
  the same delta, and each submit a valid `db.batch`; the function has no revision or
  current-balance sentinel inside the batch. Idempotency protects retries of one key,
  not two independently accepted adjustments.
- **Root boundary:** [operational-service.js](../src/server/d1/operational-service.js#L7936).
- **Consequence:** a narrow concurrent same-item count can double-apply an adjustment;
  history remains recoverable, but authoritative on-hand may no longer equal the count.
- **Slice 2 regression:** concurrent same-item, same-count commands with distinct keys;
  require one accepted effect or an atomic recomputation and final on-hand equal to the count.
- **Smallest repair:** reuse the existing atomic revision-guarded batch pattern or add
  an in-batch current-balance sentinel before the ledger insert.
- **Migration impact:** none; existing `data_revisions`, ledger, audit, and idempotency
  structures are sufficient.

### V080-S1-INV-04 — P3 — no-server presentation reducers misclassify non-IN directions

- **Reproduction:** mock/fallback reducers add only `IN` and subtract every other
  direction. A positive `REVERSAL` or positive `ADJUSTMENT` is therefore displayed as
  outbound when authoritative supplied D1 balances are absent.
- **Root boundary:** [runtime.js](../src/visual/runtime.js#L245),
  [runtime-extensions.js](../src/visual/runtime-extensions.js#L6900), and
  [inventory.js](../src/domain/inventory.js#L1).
- **Consequence:** preview/legacy presentation can contradict a correction/positive
  adjustment; production D1 values are not affected and are preferred by the shipped runtime.
- **Slice 2 regression:** reducer cases for `IN`, `OUT`, positive/negative `ADJUSTMENT`,
  and `REVERSAL`, using explicit signed quantity.
- **Smallest repair:** project/use `signedQuantity` or a transaction-type-aware sign
  helper in non-authoritative reducers.
- **Migration impact:** none.

## Slice 2 closure

All four Slice 1 entries were classified `REPAIR_IN_SLICE_2` and closed without a
schema change. The exact reproduction, root cause, files, and post-repair evidence
are recorded in [INVENTORY_SLICE_2_REPAIR_REGISTER.md](./INVENTORY_SLICE_2_REPAIR_REGISTER.md).
No historical record was rewritten or reconciled. No item was deferred to Slice 3.

## Migration decision

`MIGRATION_DECISION: NONE_REQUIRED`

Schema 30 already provides the authoritative signed ledger, reservation and
consumption model, transfer-capable `event_item_id` and relation fields, cancellation
status, audit/status/idempotency tables, correction/reversal linkage, evidence links,
append-only guards, and data revisions needed for the Slice 2 repairs above. Every
confirmed gap is in a service/caller/concurrency/presentation boundary. Migration 0031
would add no required invariant and is not authorized.

## Slice 2 do-not-change boundaries

- Do not add or trust a mutable on-hand column or Google fallback.
- Do not rewrite/delete original ledger, release, reservation-consumption, audit,
  status, custody, classification, evidence, or recovery history.
- Do not fold reservation creation into request submission.
- Do not change the schema-24 balance formula or double-count opening stock.
- Keep every irreversible effect, audit/history, replay result, and revision in one
  atomic D1 batch.
- Preserve server capability, entity/location scope, CSRF, privacy redaction, evidence,
  and exact retry-fingerprint boundaries.

## v0.8.0 final server/domain contract freeze

This section freezes the v0.8.0 server/domain contract. It does not promise an expanded
Inventory UI.

### Inventory truth

- Physical on-hand authority is the sum of `POSTED inventory_ledger.signed_quantity`.
- Reserved authority is the sum of each `ACTIVE` reservation's nonnegative unconsumed
  remainder. A reservation never changes physical on-hand.
- Available-to-promise is exactly `on_hand - reserved` from `inventory_balances`.
- `inventory_items` owns identity, unit, thresholds, and catalog/classification metadata;
  it does not own a mutable physical balance.
- Direct opening quantity remains zero. An authorized nonzero opening is an explicit
  `OPENING_BALANCE` ledger effect created with the item.
- Only posted ledger rows affect on-hand. Immutable ledger rows are never updated or
  deleted; corrections are linked compensating effects.
- Low-stock is a projection from authoritative ATP and the catalog threshold, not a
  second quantity source.

### Frozen command effects

All commands below require an authenticated Worker session, CSRF where applicable,
server capability and entity/location scope, an idempotency key plus request fingerprint,
and one atomic D1 batch. Exact replay returns the accepted result; the same key with a
different fingerprint fails without a business effect. Public responses remain scoped
and redacted; owner-only reconciliation/audit detail is not public.

| Command                                 | State precondition and capability                                                                         | Atomic authoritative effects                                                                                                               | Safe failure behavior                                                            |
| --------------------------------------- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| `submitRequest`                         | valid demand; `request.create`                                                                            | request, lines, status/audit/idempotency; no reservation or ledger effect                                                                  | validation/auth/conflict leaves stock unchanged                                  |
| `reserveStock`                          | accepted routed line with current ATP; `fulfillment.reserve` and entity/location scope                    | active reservation/top-up, status/audit/idempotency; no ledger effect                                                                      | guarded line/revision/capacity conflict rolls back                               |
| `approveLendingTicket`                  | exact approvable ticket snapshot and current ATP; `lending.approve` and entity scope                      | reservation plus traceable asset assignment/movement/history where applicable                                                              | stale/capacity/asset conflict rolls back                                         |
| `confirmLendingHandoff`                 | approved pre-handoff ticket and reservation; `lending.handoff`                                            | unique handoff, one `ISSUE` or `LOAN_OUT`, reservation release, custody/status/audit/idempotency                                           | stale, duplicate, insufficient, or unauthorized command has no partial effect    |
| `confirmReturn`                         | handed-off reusable ticket; `lending.return`                                                              | unique return, returned-quantity `LOAN_RETURN`, custody/condition/status/audit/idempotency                                                 | duplicate or impossible return fails atomically                                  |
| `confirmRelease`                        | releasable approved line, reservation coverage, current ATP guard; `fulfillment.release`                  | consumption, negative `ISSUE`, confirmation, counters/status/audit/idempotency                                                             | stale/over-release/insufficient/conflict leaves no effect                        |
| `correctRelease`                        | existing confirmation and owner authority                                                                 | linked positive `REVERSAL`, compensating reservation/correction/status/audit/idempotency                                                   | never changes the original confirmation, consumption, or ledger row              |
| `receiveRestock` / `receiveDeliverable` | exact receivable procurement parent (`TO_BE_PROCURED` is also valid for Restocking), item/unit, counters, and cumulative ceiling; `fulfillment.receive` | receiving/receipt, positive `RECEIVE`, counters/status/audit/idempotency | terminal/over-receipt/stale/duplicate mismatch rolls back |
| `createInventoryItem` with stock        | catalog authority plus receive/adjust/system capability for nonzero stock                                 | catalog row and explicit positive `OPENING_BALANCE`; opening metadata stays zero                                                           | invalid identity/unit/capability creates neither row                             |
| `postCycleCountAdjustment`              | counted quantity and atomically current on-hand; `inventory.adjust`                                       | one signed `CYCLE_COUNT_ADJUSTMENT`, audit/idempotency/revision                                                                            | stale current-state sentinel fails with no ledger effect; winner replay is exact |
| `transferEventItemToInventory`          | source event item, destination identity/unit, current source quantity; `inventory.merge` and entity scope | exact negative/positive paired ledger rows sharing one logical mapping, audit/idempotency/revisions                                        | over-transfer, unit mismatch, stale race, denial, or altered retry has no pair   |
| accepted Request/Lending cancellation   | accepted pre-physical-effect parent and permitted self/entity cancellation scope                          | parent terminal state, active reservation cancellation, audit/history/idempotency, and reserved-asset restoration history where applicable | stale/closed/post-effect state rejects without partial release                   |

### Reservation lifecycle

- Creation/top-up is explicit and atomically checks the authoritative availability and
  guarded parent/line state.
- Active remainder is `max(quantity - accepted consumption, 0)`.
- Consumption is append-only, linked to a valid active reservation, and cannot exceed
  reserved quantity.
- Cancellation/release changes the reservation to a terminal state only through the
  supported parent command; terminal reservations are excluded from reserved stock.
- Physical on-hand changes only when a separate supported ledger movement is posted.
- Stale state, capacity races, or the losing concurrent command fail the complete batch.
- Lending review, handoff, cancellation, asset maintenance/custody, and receiving use
  exact in-batch state guards; a zero-row transition cannot retain dependent effects.

### Downstream version contracts

- **v0.8.1 Inventory Operations/UI:** may present and invoke this contract, but must use
  `inventory_balances`/server projections and must not introduce mutable balance state.
- **v0.8.2 Release Desk:** must preserve authoritative pre-effect recheck,
  reservation/consumption, idempotent release/correction, and append-only ledger/audit.
- **v0.8.3 Lending:** must use the same ATP/reservation contract and preserve unique
  handoff/return plus custody/asset history.
- **v0.8.4 Request Center:** submission remains demand-only; reservation is a separate
  explicit atomic action after accepted routing and never deducts physical stock.

### Explicit unsupported or deferred behavior

- Expanded Inventory Operations/UI belongs to v0.8.1.
- Release Desk expansion belongs to v0.8.2; only the commands above are frozen now.
- Lending expansion belongs to v0.8.3; lost/damaged behavior is supported only where
  the current schema/commands explicitly record it.
- Request Center expansion belongs to v0.8.4.
- Direct balance edits, unpaired transfers, reservation-on-submission, Google quantity
  authority/fallback, history rewrite/delete, and undocumented movement types are not
  supported in v0.8.0.
- No additional v0.8.0 behavior beyond these frozen commands is supported.
