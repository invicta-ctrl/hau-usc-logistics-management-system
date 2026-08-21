# v0.8.4 Live Operations and Performance — Readiness Packet

```text
DOCUMENT_STATUS: CANDIDATE ONLY — NOT ACCEPTED
AUTHORITY: read-only product scouting; owner-authorized documentation push
IMPLEMENTATION: DO NOT IMPLEMENT FROM THIS DOCUMENT UNTIL ADOPTED
REFRESHED_AGAINST: final v0.8.3 closing main 86553349f5c2ebefaa637c30828c560a301f99ba
PRODUCT_MUTATIONS: NONE
PROVIDER_MUTATIONS: NONE
```

This packet removes v0.8.4 discovery uncertainty. It is a planning guardrail,
not an implementation authorization, and it does not amend `AGENTS.md`,
`.codex/CURRENT.md`, `.codex/CURRENT_TASK.md`, `.codex/CURRENT_HANDOFF.md`, or
any accepted specification. Every technical claim below carries a source path
and was re-verified at the exact tree this document is committed onto.

---

## 1. Refreshed handshake

```text
PROGRAM                    HAU-USC Logistics
BRANCH                     release/v0.8.4-live-operations-performance
SCOUT_BASE_SHA             b1359c2e9351099333e1dcb2189cbf27d9599445
                           "docs(v0.8.4): complete preservation refresh"
FINAL_V083_MAIN            86553349f5c2ebefaa637c30828c560a301f99ba
V083_TAG                   v0.8.3 -> 07aa2d2dfcee12fb1ec26fc5a3658ca9ca9be34e
FROZEN_PRODUCT_CANDIDATE   f8e63372bc8afcb6d092970b7f9fc9ee72fd3580
FROZEN_TREE                5788251d483f23ec5e19048e1a946b3a00450436
PRODUCTION                 v0.8.3 at the exact frozen candidate; schema 32;
                           latest migration 0032_staff_account_activity_history.sql
PLAYGROUND                 0.8.3-playground.1 at the exact frozen candidate; schema 32
PACKAGE_VERSION            0.8.3 (not yet advanced for v0.8.4)
ACTIVE_WRITER              NONE
WRITER_LOCK                RELEASED
V084_IMPLEMENTATION        NOT STARTED
DESIGN_BASELINE            DESIGN_BASELINE_2026-08-20-F / Figma Make v39
DESIGN_CONTENT_SHA         e2773775c086402e002082220c233cbca84b9557
DESIGN_BRANCH_TIP          c435657 (Phase 9 adoption-intake documents only; no src change)
```

### 1.1 Product-source parity proof

```text
git diff --name-only f8e6337 b1359c2 -- src migrations   ->  0 files
git diff --name-status origin/main b1359c2               ->  only .codex/CURRENT.md,
                                                             .codex/CURRENT_TASK.md,
                                                             .codex/CURRENT_HANDOFF.md
```

The v0.8.4 branch is governance-only ahead of final v0.8.3 main, and the
application source is byte-identical to the frozen Production candidate.
**Every finding in this packet therefore describes exactly what is running in
Production today.** Each was re-verified line-by-line at `b1359c2` before this
document was written; the line numbers cited are the numbers at that tree.

```text
STALE_IF = any blob under src/, migrations/, tests/, wrangler.jsonc,
           package.json, or package-lock.json changes relative to b1359c2.
           A governance-only pointer commit does NOT invalidate this packet.
```

---

## 2. The decisive finding

**A live-invalidation substrate already exists, and it already emits inside the
authoritative D1 transaction.** v0.8.4 is not a greenfield realtime project. It
is the completion, correction, and measurement of the existing RV-01 mechanism.

| Layer         | Path                                                                                                                                                        | Fact                                                                                                                                                                     |
| ------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Schema        | `migrations/0004_data_revisions.sql`                                                                                                                        | `data_revisions(scope, revision, updated_at)` seeded with `global, overview, request, lending, release, restocking, procurement, inventory`. Untouched by 0031 and 0032. |
| Emit          | `src/server/d1/operational-service.js:887`                                                                                                                  | `revisionStatements(db, scopes, timestamp)` returns `UPDATE data_revisions SET revision = revision + 1` statements                                                       |
| Ordering      | ~40 call sites: `:3016 :3778 :4108 :4215 :4348 :4493 :4672 :4818 :4923 :5316 :5546 :5779 :6155 :6434 :6672 :6868 :7226 :7412 :7474 :7558 :7613 :8149 :8244` | the bump is appended to the **same `db.batch([...])`** as the business rows, `inventory_ledger`, `audit_log`, `status_history`, and the idempotency record               |
| Read          | `src/server/d1/operational-service.js:1416`                                                                                                                 | `revision(db, scope)` single-row read                                                                                                                                    |
| Transport     | `src/worker/index.js:1243` `POST /api/getScopedRevision` (also `:1241` `/api/getDataRevision`)                                                              | contract `scoped-revision` v1 — `{enabled, scope, token, globalRevision, updatedAt, environment, metrics}`; no operational rows, no cached authorization decision        |
| Client core   | `src/app/revision-sync.js:94` `createRevisionPoller`                                                                                                        | 15 s cadence, ±10 % jitter, exponential backoff to 120 s, single-flight, out-of-order guard, visible/online/active eligibility, fail-closed remote disable               |
| Client wiring | `src/v5/integration/runtime.js:424` `createV5RevisionSync`, `:487`, `:676`                                                                                  | active-route scope only; `visibilitychange` / `focus` / `online` / `offline` listeners                                                                                   |
| Accepted doc  | `docs/NEAR_LIVE_REFRESH.md`                                                                                                                                 | accepted behavior plus the owner-approved **p95 ≤ 25 s** visibility target, no routine sample above 35 s                                                                 |

### 2.1 The safe emit point already exists and is already correct

D1 returns batch results only after every statement in the batch has run, so a
bumped `data_revisions.revision` is observable **if and only if** the
authoritative write committed. v0.8.4 must preserve this: the live signal stays
as the final statements of the committing batch, and is never emitted from
`executionContext.waitUntil(...)` or from a follow-up write.

### 2.2 Why WebSockets are the wrong answer for v0.8.4

`wrangler.jsonc` binds only `ASSETS`, `DB` (D1), `BRAND_ASSETS` and
`EVIDENCE_ASSETS` (R2), plus a `*/5 * * * *` cron. There is **no Durable Object
namespace, no Queue, and no KV**. WebSockets on Cloudflare Workers require a
Durable Object for coordination, which means a new provider resource, a new
wrangler migration tag, and a Class I architecture change under
`.codex/PHASE_AND_CONTEXT_POLICY.md`. Server-Sent Events from a stateless Worker
would mean a long-lived invocation polling D1 per client — strictly worse than a
15-second client poll at the accepted 10-expected / 30-peak session envelope.

Decisively: none of the user-visible defects in §4 and §7 are caused by polling.
Replacing the transport would leave every one of them intact.

**Recommendation: keep polling. Fix invalidation coverage, delta application,
freshness proof, and cost.** If push is still wanted after §8 measurement, it is
a v0.9.x Class I proposal with its own accepted specification.

---

## 3. Authoritative write-path map

Internal mutations funnel through one place: `src/worker/index.js:1287`, the
generic single-segment `POST /api/<method>` route —
`operations.capabilityForMethod(method)` → `authorize(..., {mutation:true})` →
`operations.call(method, {account, command, correlationId})`. Named routes exist
only for portal, admin, owner, auth, and public surfaces.

Invariants verified across the RPC mutation call sites:

```text
authorization  assertCapability(account, METHOD_CAPABILITIES[method])   operational-service.js:34
               plus assertEntityScope(...) committee/owner narrowing
idempotency    replay(db, scope, command.clientRequestId, account.id, command)   :921
               idempotency_keys(scope, idempotency_key) + request_fingerprint;
               fingerprint mismatch -> 409 IDEMPOTENCY_CONFLICT;
               match -> replay the stored result_json, no re-execution
transaction    a single db.batch([...]) — the D1 batch is the transaction boundary
concurrency    runAtomicRevisionGuardedBatch(db, {...})   :895
               a guarded UPDATE with a status/quantity/updated_at predicate, followed by a
               NOT NULL assertion on data_revisions.updated_at that aborts and rolls back the
               whole batch when changes() != 1, mapped to a typed 409
audit          auditStatement(db, ...) -> audit_log        :784
history        historyStatement(db, ...) -> status_history :809
               eventActivityHistoryStatement(...) -> event_activity_history
ledger         INSERT INTO inventory_ledger  :5500 :5787 :6326 :6579 :6828 :7187 :8431 :8487 :8569
live signal    ...revisionStatements(db, [scopes])  — LAST, INSIDE THE SAME BATCH
R2             evidence via requireStoredEvidence(); uploadEvidence backup deferred to
               executionContext.waitUntil(...)   worker/index.js:1305
response       { ok: true, ...result }; most mutations do not echo a scope revision
```

### 3.1 Per-module summary

| Module                          | Mutation entrypoints                                                                                                                                                                                                                                                                         | Scopes bumped                                                                         | Guard                                                                                                                                                | Conflict code                                                                                                    |
| ------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| Inventory                       | `createInventoryItem` `updateInventoryItem` `updateInventoryStorageContext` `archiveInventoryItem` `restoreInventoryItem` `postCycleCountAdjustment` `classifyInventoryItem` `bulkClassifyInventoryItems` `transferEventItem(ToInventory)` `registerInventoryAsset` `recordAssetMaintenance` | `inventory`, `lending`, always plus `global` and `overview`                           | `classification_revision` optimistic version (`:7759`, `:7986`); `updated_at` equality on asset instances (`:4943`)                                  | `ASSET_MAINTENANCE_STATE_CONFLICT`, classification revision mismatch                                             |
| Requests                        | `submitRequest` `submitRequesterRequest` `cancelRequesterRequest` `reviewRequest` `reserveStock`                                                                                                                                                                                             | `request`; `request`+`inventory`; changed-scope-only set on review (`:6065`, `:6155`) | review guarded UPDATE (`:6157`); reserve guarded `request_lines` UPDATE asserting `qty <= requested - released - SUM(active reservations)` (`:4361`) | `REQUEST_STATE_CONFLICT`                                                                                         |
| Lending                         | `createLendingTicket` `approveLendingTicket` `confirmLendingHandoff` `confirmReturn`                                                                                                                                                                                                         | `lending`; `lending`+`inventory`                                                      | guarded UPDATE on `status` + `updated_at` (`:5011`); available-to-promise and asset-availability assertions                                          | `LENDING_STATE_CONFLICT`, `LENDING_HANDOFF_STATE_CONFLICT`, `INSUFFICIENT_STOCK`, `ASSET_ASSIGNMENT_UNAVAILABLE` |
| Release Desk                    | `confirmRelease` `correctRelease`                                                                                                                                                                                                                                                            | `release`, `request`, `inventory`                                                     | guarded release/correction statements plus reservation-coverage and on-hand-negative assertions (`:6445`, `:6674`)                                   | `RELEASE_STATE_CONFLICT`, `CORRECTION_STATE_CONFLICT`, `RESERVATION_CONFLICT`, `INSUFFICIENT_STOCK`              |
| Restocking / Procurement        | `transitionRestock` `receiveRestock` `receiveDeliverable` `transitionDeliverable` `saveCanvassReference` `updateCanvassReference` `archiveCanvassReference` `selectPreferredCanvass`                                                                                                         | `procurement`, `restocking`, `request`, `inventory`                                   | `workflow_revision` optimistic version on `request_lines` (`:3568`, `:3610`)                                                                         | guarded-batch conflict                                                                                           |
| Staff / Directory / Access      | `POST /api/admin/access/*` → `src/server/access/service.js` → `src/server/d1/access-management-repository.js:468 :746 :1006 :1070 :1089 :1120 :1168`                                                                                                                                         | **none**                                                                              | `runAtomicRevisionGuardedBatch` used for atomicity only                                                                                              | `ACCESS_WRITE_CONFLICT`                                                                                          |
| Account applications / Identity | `src/server/account-application/service.js`, `src/server/identity-foundation/*`, `src/server/identity-roster/*`                                                                                                                                                                              | **none**                                                                              | varies                                                                                                                                               | —                                                                                                                |

### 3.2 Gap A — access, identity, and directory emit no live signal

`grep -c revisionStatements src/server/d1/access-management-repository.js` → `0`.
There is no `data_revisions` scope bump anywhere in the access, identity, or
account-application write paths, and no `access` or `directory` scope row in
`data_revisions`. Account status changes, Access-ID changes, policy and role
changes, session revocation, unlock, starter-account creation, staff-directory
projection changes, and account-application review are therefore invisible to
every open client until a manual reload.

---

## 4. Frontend state map (shipped V5 application)

The shipped artifact is **V5**. `vite.config.js` sets root `src`;
`src/index.html` loads `./v5/styles/*`; `scripts/v5-application-plugin.mjs`
bridges `src/v5/src/app.js`; the build is a single inlined `dist/index.html`
(643,918 bytes). `src/visual/*` is the **legacy** runtime and is **not** in the
shipped bundle — `grep -c createFormDirtyTracker dist/index.html` → `0`.

| Concern             | Shipped behavior                                                                                                                                                         | Evidence                                              |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------- |
| Initial fetch       | `ensureAuthenticated()` → `backend.session()` then `backend.bootstrap()`                                                                                                 | `runtime.js:897`, `:913`                              |
| Module fetch        | `/api/getBootstrapModule`, `pageSize: 500` for inventory, `100` otherwise                                                                                                | `v5/integration/backend.js` `module()`                |
| Manual refresh      | `data-act="refresh"` → `loadRoute(route(), {refresh:true})`                                                                                                              | `runtime.js:2208`, `:867`                             |
| Automatic refetch   | changed token → `refresh()` → `loadRoute(..., {refresh:true, expectedRevision})` → `loadModule` → **full module refetch**                                                | `runtime.js:676`, `:1129`, `:924`                     |
| Polling             | 15 s ± 10 % jitter, active route's scope only                                                                                                                            | `revision-sync.js:10`, `runtime.js:487`               |
| Cache/state owner   | one mutable `integration` object plus `app.integrationState`                                                                                                             | `runtime.js` `createV5Runtime`                        |
| Row / detail reload | none — the whole route re-renders; `inventory.item` additionally fetches `getInventoryItem`                                                                              | `runtime.js:940`                                      |
| Summary reload      | only when the active route's scope is `overview`                                                                                                                         | `MODULE_BY_ROUTE` `runtime.js:20`                     |
| Rendering           | `root.innerHTML = ...` — the entire shell and surface are destroyed and rebuilt                                                                                          | `src/v5/src/app.js:722`                               |
| Loading state       | `render('loading')` on a cold load, **suppressed during a revision refresh**                                                                                             | `runtime.js:1161`                                     |
| Stale state         | `'stale'` exists in `ROUTE_STATES['request.queue']` and renders a real conflict notice, but `resolveV5RouteState` is **never called with `'stale'`** in the live runtime | `runtime.js:252`; `v5/src/surfaces/operations.js:373` |
| Error state         | `integration.failedRoutes` plus a toast; a failed revision refresh returns `false` silently                                                                              | `runtime.js:1188`                                     |
| Reconnect state     | poller computes `offline` / `delayed` / `stale` / `updates-available` / `manual-only`, but nothing consumes them                                                         | `revision-sync.js:98-99`; `runtime.js:424-438`        |

### 4.1 Gap B — poller telemetry is computed and discarded

`grep -c onStatus src/v5/integration/runtime.js` → `0`.
`createV5RevisionSync` destructures `readRevision, refresh, getScope, getSession,
getGeneration, getRoute, acceptedRevisions, documentTarget, windowTarget,
isOnline, schedule, cancel, now, random` — and passes no `onStatus` and no
`onMetrics` to `createRevisionPoller`, so both fall back to the no-op defaults at
`revision-sync.js:98-99`. Every connection-health signal the accepted RV-01
contract promises — last-successful-update time, checking / delayed / stale /
offline / updates-available, and the read metrics at `revision-sync.js:120` and
`:207` — is produced and thrown away. The user has no freshness indicator and no
reconnect indicator.

### 4.2 Gap C — dirty-state protection is absent from the shipped application

`docs/NEAR_LIVE_REFRESH.md` records the accepted behavior: _never overwrite a
dirty form, open consequential modal, or unsaved runtime state; show Refresh now
and Continue editing instead._ That contract is implemented **only** in
`src/visual/form-dirty-state.js` with `src/visual/runtime-extensions.js:688`,
`:5471`, `:8826` — the legacy runtime, which does not ship.
`grep -rl form-dirty-state src` returns `src/visual/runtime-extensions.js` alone.

In V5, a poll tick on a changed token reaches `root.innerHTML = ...` and destroys
any half-typed form, open drawer, scroll position, and table search state. The
poller's `isActive()` returns true while the user is typing, because it tests
`documentTarget.hasFocus()` (`runtime.js:497`). This is the ordinary path, not an
edge case.

This gap also directly contradicts a non-negotiable contract that the frontend
adoption intake already relies on — see §11.1.

### 4.3 Gap D — surfaces with no live signal at all

`MODULE_BY_ROUTE` (`runtime.js:20`) omits `admin.access`, `admin.directory`,
`account.profile`, `owner.health`, `events.series`, and the reference surfaces.
Those routes poll nothing and load through `loadSpecial` (`runtime.js:976`) with
no revision seed. Combined with Gap A, Directory and Access are non-live end to
end, on both the write side and the read side.

---

## 5. Candidate architecture — RV-02 scoped change cursor

Smallest design compatible with the actual stack: **invalidate, then perform an
authoritative targeted read.** The browser is never authoritative and events
carry no mutable business rows.

```text
EVENT SOURCE           data_revisions, bumped inside the authoritative D1 batch (unchanged)
EVENT IDENTITY         (scope, revision), monotonic per scope; global revision as tiebreak
EVENT SCOPE            the 8 existing scopes, plus a new 'access' scope
                       (and 'directory' only if evidence shows it changes independently)
AUTHORIZATION          unchanged: every read still passes authorize(request, auth, capability).
                       A revision token is metadata only. Unknown or unauthorized scopes fail
                       closed at normalizeScopedRevisionPayload and MODULE_CAPABILITIES.
PAYLOAD MINIMUM        { contract:'scoped-revision', contractVersion:2, enabled,
                         tokens:{scope:token,...}, globalRevision, updatedAt, environment, metrics }
CLIENT SUBSCRIPTION    one poller per session (unchanged), but ONE multi-scope request per tick;
                       the client tracks accepted tokens for every scope it renders — active
                       route plus summary scopes — not only the active route
TARGETED REFRESH       a changed scope triggers a targeted authoritative read and a DOM patch of
                       the affected rows and summaries. Full-module refetch stays as the fallback.
ORDERING               keep the existing single-flight, the `requestId !== issued` discard
                       (revision-sync.js:161), and the strict monotonic comparison
                       revisionChanged() (revision-sync.js:59). Never accept a lower token.
DEDUPLICATION          the per-scope acceptedRevisions map (runtime.js:479) already provides it
RECONNECT              see §6
FALLBACK               contract v2 unavailable or enabled:false -> degrade to v1 single-scope,
                       then to manual-only. Fail closed, never fail open.
OBSERVABILITY          see §8
```

### 5.1 Delta strategy — two options; measure before choosing

- **D1, preferred, migration-free.** Targeted read by watermark:
  `WHERE updated_at > :lastAcceptedUpdatedAt`, bounded by the existing scope
  filters. `data_revisions.updated_at` already carries the batch timestamp and is
  written from the same `nowIso()` value the row updates use, because
  `revisionStatements(db, scopes, timestamp)` accepts the timestamp explicitly.
  Hazards that must be proven or rejected before adoption: same-millisecond ties,
  deletes and archival, and rows whose `updated_at` was bound separately.
- **D2, fallback, requires migration 0033.** Append-only
  `change_events(scope, revision, entity_type, entity_id, occurred_at)` written in
  the same batch and read with `WHERE scope = ? AND revision > ?`. Exact,
  orderable, trivially recoverable — but a schema change on a database that has
  just completed the 0031 and 0032 chain, so it must be its own accepted slice
  with its own migration and recovery evidence.

Choose D1 unless the S1 measurement proves the watermark unsafe. Do not build
both.

---

## 6. Reconnect and missed-event recovery

Already present: `visibilitychange` / `focus` / `online` / `offline` listeners
(`runtime.js:540-546`), `poller.resume(reason)` forcing an immediate check,
bounded backoff with jitter, `epoch` invalidation across an authentication
boundary, and `acceptedRevisions` cleared on `clear()`.

Missing: any client-visible proof of freshness, any recovery of scopes other than
the active route, and any bound on how stale an unattended tab may be before it
must refuse to act.

Required v0.8.4 behavior:

```text
tab sleeps / hidden      pause on hidden; on visible, resume with an immediate multi-scope check.
                         If any tracked token advanced while hidden, pre-sleep data MUST NOT be
                         presented as current.
network loss             pause and surface 'offline' (requires the Gap B fix).
Worker reconnect         the first successful multi-scope read after a failure is the only
                         freshness proof. "The request succeeded" is not proof; accepted token
                         equal to server token IS proof.
returns after N updates  recovery is token-difference driven, never event-replay driven. A client
                         that missed fifty bumps and one that missed one take the same path.
duplicate events         revisionChanged() is a strict `>` comparison (revision-sync.js:59), so a
                         repeated token is a no-op by construction. Keep it.
out-of-order responses   keep `requestId !== issued` (revision-sync.js:161) and never lower an
                         accepted token (runtime.js:479); extend both per scope.
stale detail view        request review, lending detail, release confirm, and inventory item MUST
                         enter the existing 'stale' state and BLOCK the consequential action until
                         reloaded. The UI already exists at surfaces/operations.js:373 and is
                         currently unreachable — wire it.
stale summary count      summaries reconcile on the same multi-scope tick, not on next navigation.
```

**Freshness proof contract.** A surface may present itself as current only when,
for every scope it renders, `acceptedToken(scope) === serverToken(scope)` as of
the most recent successful check, and that check is newer than
`DEFAULT_STALE_AFTER_MS` (60 s, `revision-sync.js:11`). Otherwise it renders
`stale` or `delayed`, and consequential actions are disabled.

Recovery must never re-issue a mutation. The accepted rule that refresh never
retries or replays a write stands — see §7 R-2 for why that is currently unsafe.

---

## 7. Concurrency and conflict map

Server-side optimistic concurrency is genuinely strong. The gaps are at the
edges and in the user interface.

| #   | Operation                                 | Current guard                                                                                   | Race risk                                                                                                                                       | Idempotency                   | Behavior today                         | Recommended v0.8.4 protection                                                                        |
| --- | ----------------------------------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------- | -------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| C-1 | Inventory quantity, cycle count, classify | `classification_revision` version (`:7759`, `:7986`) plus guarded batch                         | Low                                                                                                                                             | `clientRequestId`             | generic error toast                    | typed conflict plus a `stale` reload affordance                                                      |
| C-2 | Reservations, `reserveStock`              | guarded `request_lines` UPDATE with an availability assertion (`:4361`)                         | Low                                                                                                                                             | yes                           | generic toast                          | typed `RESERVATION_CONFLICT` with fresh availability                                                 |
| C-3 | Request review and routing                | guarded UPDATE (`:6157`), changed-scope-only bump (`:6065`)                                     | **Medium** — two reviewers on one request; the loser loses every line decision                                                                  | key defaults to `review-<id>` | decisions silently lost, generic toast | wire the existing `stale` notice; block Accept while stale; preserve entered decisions across reload |
| C-4 | Lending approve, handoff, return          | guarded UPDATE on `status` and `updated_at` (`:5011`) plus ATP and asset assertions             | Low–Medium                                                                                                                                      | yes                           | generic toast                          | typed conflict copy per code; refresh the ticket row in place                                        |
| C-5 | Release confirm and correct               | guarded statements plus reservation-coverage and on-hand-negative assertions (`:6445`, `:6674`) | Medium — highest consequence path                                                                                                               | yes                           | generic toast                          | hard `stale` gate before `recipientConfirmed`; never confirm on a stale projection                   |
| C-6 | Access and account changes                | `runAtomicRevisionGuardedBatch` for atomicity, `ACCESS_WRITE_CONFLICT`                          | **High visibility gap** — no revision bump, so a revoked or disabled account's peers and the admin's own directory view stay stale indefinitely | partial                       | nothing surfaced                       | add the `access` scope and bump it; poll it from `admin.access` and `admin.directory`                |
| C-7 | Asset maintenance                         | `updated_at` equality guard (`:4943`)                                                           | Low                                                                                                                                             | yes                           | generic toast                          | typed conflict                                                                                       |
| C-8 | Restock and deliverable transitions       | `workflow_revision` version (`:3568`, `:3610`)                                                  | Low                                                                                                                                             | yes                           | generic toast                          | typed conflict                                                                                       |

### 7.1 R-2 — client-generated idempotency keys defeat retry safety

`src/v5/integration/operations-parity.js:74`

```js
function clientRequestId(action) {
  const id = globalThis.crypto?.randomUUID?.();
  if (!id) throw new Error('A strong client request identifier could not be created.');
  return `${action}:${id}`;
}
```

`invokeOperation` (`:1400`) mints a fresh UUID **per attempt**. The server-side
`replay()` dedupe (`operational-service.js:921`) keys on
`(scope, idempotency_key)`. A user who resubmits after a timeout, a dropped
connection, or a mid-flight reconnect therefore produces a different key, and the
mutation executes **twice**. The server protection is real, correct, and
unreachable from the shipped user interface in exactly the reconnect scenario
v0.8.4 exists to make safe.

Fix shape: mint the key once per **user intent** — per form instance or command
invocation — persist it across retry, and reuse it verbatim on resubmit. Do not
add automatic client-side retry.

No locks and no migrations were designed or implemented by this scout.

---

## 8. Performance readiness — measure first

### 8.1 What must become measurable

| Signal                    | Available today                                                                                                                                                                        | Gap                                                                                  |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Worker and API latency    | `structuredLog` `API_REQUEST_COMPLETED` already emits `latencyMs`, `path`, `method`, `status` (`worker/index.js:1440`); wrangler observability logs enabled at `head_sampling_rate: 1` | none — usable now                                                                    |
| D1 query duration         | not captured                                                                                                                                                                           | needs a thin instrumented `db` wrapper, non-production only                          |
| Query count per operation | **falsely reported** — `metrics.readCount` is a hardcoded literal `2` at `operational-service.js:1475` and `4` at `:2270`                                                              | must be replaced by a real counter before any count is quoted as evidence            |
| Frontend request count    | `poller.metrics` totals exist (`revision-sync.js:120`, `:207`) but nothing consumes them                                                                                               | wire `onMetrics` — same fix as Gap B                                                 |
| Payload size              | measurable from Worker responses and Playwright                                                                                                                                        | record per module                                                                    |
| Render and refetch count  | not captured                                                                                                                                                                           | count `render()` (`runtime.js:789`) and `loadModule` calls per session-minute        |
| Realtime event volume     | derivable from `data_revisions` deltas and poll counts                                                                                                                                 | define                                                                               |
| Reconnect recovery cost   | not captured                                                                                                                                                                           | measure requests, bytes, and milliseconds from `resume()` to first reconciled render |

### 8.2 Candidates — candidates, not claimed defects

| #       | Candidate                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Evidence                                                                                                                             | How to measure before changing it                                                                                                                                                                         |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **P-1** | **Duplicate session resolution on every authorized request.** `authorize()` calls `auth.authenticate()` and then `auth.authorize()`; both call `readSession()`. `readSession` is `getSession` + `getAccountById`; `getAccountById` runs `accountFromRow`, which awaits a department lookup, `committeeIds()`, and `accessProfile()` sequentially. That is roughly ten sequential D1 reads per authorized request before any business query, paid on **every 15-second poll tick**. | `worker/index.js:406-417`; `server/auth/service.js:120-145`, `:374`, `:391`; `server/d1/auth-repository.js:10`, `:23`, `:42`, `:259` | instrument a D1 statement counter; log reads per request for `/api/getScopedRevision`, `/api/getBootstrapModule`, and one mutation; compare against a single `readSession` with a batched account hydrate |
| **P-2** | **Two revision reads per poll tick.** `/api/getScopedRevision` calls `operations.revision(scope)` and then `operations.revision('global')` — two D1 round trips for two rows of one table.                                                                                                                                                                                                                                                                                         | `worker/index.js:1249`, `:1263`; `operational-service.js:1416`                                                                       | count reads per tick; compare with one `WHERE scope IN (?, ?)` read, then with the multi-scope contract of §5                                                                                             |
| **P-3** | **Sequential read fan-out in `bootstrapModule`.** 35 awaited D1 operations in the function, executed sequentially, with per-module blocks of five to ten dependent `rows()` calls.                                                                                                                                                                                                                                                                                                 | `operational-service.js:1479-2270`                                                                                                   | measure wall-clock per module at realistic row counts; separate genuinely dependent awaits from parallelizable ones (`db.batch` for reads, or `Promise.all`)                                              |
| **P-4** | **Full-module refetch plus full DOM rebuild on every change tick.**                                                                                                                                                                                                                                                                                                                                                                                                                | `runtime.js:676`, `:1129`, `:924`; `v5/src/app.js:722`                                                                               | measure bytes, milliseconds, and lost UI state per tick on a queue with realistic rows; compare against a targeted row patch                                                                              |
| **P-5** | **`pageSize: 500` inventory module payload.**                                                                                                                                                                                                                                                                                                                                                                                                                                      | `v5/integration/backend.js` `module()`                                                                                               | measure payload bytes and parse time at production row counts                                                                                                                                             |
| **P-6** | **`/api/getBootstrapData` runs `essential()` and `bootstrapModule()` and merges both.**                                                                                                                                                                                                                                                                                                                                                                                            | `worker/index.js:1213-1227`                                                                                                          | confirm whether V5 uses it — V5 calls the two endpoints separately — and treat it as contract surface if unused                                                                                           |
| **P-7** | **`resolveOperationalContext` re-resolved in both `essential()` and `bootstrapModule()`.**                                                                                                                                                                                                                                                                                                                                                                                         | `operational-service.js:1437`, `:1487`                                                                                               | count reads for a cold sign-in                                                                                                                                                                            |
| **P-8** | **Single 643,918-byte inlined `dist/index.html` served `no-cache, no-store, must-revalidate`.**                                                                                                                                                                                                                                                                                                                                                                                    | `dist/index.html`; `dist/_headers`                                                                                                   | measure cold and warm load bytes and time; confirm whether the no-store policy is a deliberate release-identity requirement before touching it                                                            |
| **P-9** | **Correlated subqueries in hot list queries** — `getMaterialsWorkQueue` runs three correlated `canvass_references` subqueries per row; inventory rows carry a per-item `(SELECT COUNT(*) FROM inventory_ledger …)`.                                                                                                                                                                                                                                                                | `operational-service.js:2280-2310`, `:6961`, `:7748`                                                                                 | `EXPLAIN QUERY PLAN` plus timing at realistic row counts before any rewrite                                                                                                                               |

### 8.3 Sequencing rule

No optimization lands before its measurement exists, is recorded, and is
reproducible at a named SHA. The `metrics.readCount` literals must be made real
**first**, because P-1, P-2, and P-3 all depend on trusting a read counter.

---

## 9. Performance budgets

### 9.1 Existing and accepted

```text
ACCEPTED  near-live visibility p95 <= 25 s for an eligible clean second session,
          with no routine sample above 35 s.            docs/NEAR_LIVE_REFRESH.md
ACCEPTED  poll cadence 15 s plus bounded jitter; backoff to 120 s maximum.
                                                        src/app/revision-sync.js:10-12
ACCEPTED  engineering capacity envelope: 10 active sessions expected, 30 peak,
          giving 2,400 and 7,200 upper-bound revision requests per hour.
                                                        docs/NEAR_LIVE_REFRESH.md
KNOWN     normal visibility and network timing can exceed the 25 s p95 target.
                                                        docs/KNOWN_LIMITATIONS.md:5
```

No latency, payload, or query-count budget exists anywhere in `docs/`,
`scripts/`, or `package.json`.

Note that `docs/NEAR_LIVE_REFRESH.md` still frames its platform preflight around
Apps Script execution quotas. That section is historical: the runtime is
Cloudflare Workers with D1. v0.8.4 should restate the capacity model against the
actual platform rather than inherit the Apps Script ceilings.

### 9.2 Proposed

```text
PROPOSED — NOT YET ACCEPTED

D1 reads per unchanged poll tick            <= 2       (today roughly 12, unmeasured)
D1 reads per authorized read request        <= 6       (today roughly 10 plus module, unmeasured)
Worker p95 /api/getScopedRevision           <= 150 ms  PLAYGROUND / STAGING ONLY
Worker p95 /api/getBootstrapModule          <= 800 ms  PLAYGROUND / STAGING ONLY
scoped-revision response payload            <= 1 KB
module refresh payload, non-inventory       <= 256 KB
renders per change tick                     1 targeted patch, 0 full-shell rebuilds
reconnect reconciliation                    <= 1 revision read plus 1 read per changed scope
```

Every number above is a target to be validated against measurement. **No
baseline was measured by this scout and none is claimed.**

---

## 10. Test matrix

Existing foundations — extend these, do not replace them:

- `tests/cloudflare-e2e/rv01-request-visibility.spec.js` — real local Worker and
  real D1, two independent contexts, with the authenticated Main Hub opened
  **before** the public submission and never reloaded. This is precisely the
  multi-actor live harness v0.8.4 needs.
- `tests/cloudflare-e2e/local-worker.spec.js`, harness
  `scripts/start-local-worker-acceptance.mjs`, config
  `playwright.cloudflare.config.js`, script `npm run test:e2e:cloudflare:local`.
- `tests/unit/v5-revision-sync.test.js` — 22 cases covering single-flight,
  backoff, hidden and offline, remote disable, authentication boundary,
  out-of-order, and seed-once.
- `tests/unit/request-visibility-rv01.test.js` — 8 cases.
- `tests/e2e/v5-current-application.spec.js`, `playwright.v5.config.js`.
- `tests/integration/workflows.test.js`, `tests/integration/audit-probes.test.js`.

### T-1 Inventory live update

```text
Staff A commits an inventory mutation
  -> the D1 batch commits rows, inventory_ledger, audit_log, status_history, idempotency
  -> data_revisions.inventory and .global advance in the SAME batch
  -> Staff B, already open and never reloaded, receives the changed token on the next tick
  -> the affected row refreshes
  -> summaries reconcile in the same tick
  -> assert zero full-page reloads, zero re-authentications, focus and scroll preserved
```

### T-2 Disconnected client

```text
Staff B goes offline; the poller pauses and 'offline' is surfaced
  -> Staff A performs at least three mutations across at least two scopes
  -> Staff B returns online
  -> assert one resume check, all changed scopes recovered, state matches A's authoritative state,
     accepted tokens equal server tokens, and ZERO duplicate mutations were issued by B
```

### T-3 Concurrent action

```text
Two authorized users act on the same resource concurrently
  -> exactly one authoritative outcome
  -> the loser receives its typed 409 (REQUEST_STATE_CONFLICT / LENDING_STATE_CONFLICT /
     RELEASE_STATE_CONFLICT / RESERVATION_CONFLICT / ACCESS_WRITE_CONFLICT)
  -> the loser's surface enters 'stale' and BLOCKS the consequential action until reloaded
  -> audit_log, status_history, and inventory_ledger contain exactly one committed effect
```

Repeat T-1, T-2, and T-3 for Requests, Lending, Release, and — once the `access`
scope exists — Directory and Access.

### Suite coverage to add

| Tier                  | Additions                                                                                                                                                                                                                   |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| unit                  | multi-scope contract v2 normalize and reject; per-scope accepted-token map; freshness predicate; `stale` entry and exit; dirty-state deferral; single-intent idempotency key reuse; `onStatus` and `onMetrics` wiring       |
| contract              | `scoped-revision` v2 shape; unknown or unauthorized scope fails closed; v1 fallback; `enabled:false` fails closed                                                                                                           |
| integration           | a table-driven assertion over `METHOD_CAPABILITIES` and the access repository proving every mutation emits its revision bump inside the same batch; `access` scope bump on each access mutation                             |
| browser               | T-1, T-2, T-3 per module against the real local Worker and D1; targeted patching asserted by DOM node identity, not by text                                                                                                 |
| failure and reconnect | offline to online; hidden to visible after N updates; Worker 5xx with backoff; duplicate token; out-of-order response; session expiry mid-poll                                                                              |
| performance           | D1 read counter per endpoint; payload bytes per module; renders per tick; reconnect cost — recorded as evidence and reproducible at a named SHA                                                                             |
| authorization         | a revision token must never widen scope; polling a scope the caller lacks capability for fails closed with no row data; conflict responses must not leak another actor's identity (`src/server/observability.js` redaction) |
| regression            | `npm run check`; `npm run test:e2e:cloudflare:local`; `npm run test:e2e:v5`; `npm run check:governance`; `npm run check:playground`; `npm run verify:dist`                                                                  |

---

## 11. Frontend-adoption overlap

Authority read for this section: `docs/design/V083_TO_FRONTEND_INTEGRATION_MAP.md`
and `docs/design/V083_FRONTEND_DESIGN_ADOPTION_INTAKE.md` on
`release/…/frontend-design-integration` at `c435657`. That intake is complete,
its functional baseline is final v0.8.3 main, frontend implementation is not
started, and deploy is not authorized. Nothing on that branch was modified.

Structural fact: the design branch carries **no `src/v5/` directory**. Its source
changes are confined to `src/visual/*`, `src/styles/visual/*`, and
`src/index.html` — the legacy runtime, which the integration map itself
classifies `DO_NOT_MIGRATE`. Adoption is a re-platform of design intent onto the
V5 shell, not a merge.

| Area                                    | Files                                                                                                                | v0.8.4 touches                                                        | Adoption touches                                                   | Adoption-map class                     | Overlap class                 |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------ | -------------------------------------- | ----------------------------- |
| Worker routing and API                  | `src/worker/**`                                                                                                      | yes                                                                   | no                                                                 | —                                      | `NO_OVERLAP`                  |
| D1 services and repositories            | `src/server/**`                                                                                                      | yes                                                                   | no                                                                 | —                                      | `NO_OVERLAP`                  |
| Migrations                              | `migrations/**`                                                                                                      | only if D2 is chosen                                                  | no                                                                 | —                                      | `NO_OVERLAP`                  |
| Revision core                           | `src/app/revision-sync.js`                                                                                           | **heavily**                                                           | present but unmodified                                             | —                                      | `SHARED_STATE_LAYER`          |
| V5 integration runtime                  | `src/v5/integration/runtime.js`, `backend.js`, `view-models.js`                                                      | **heavily**                                                           | `PORT_WITH_CONTRACT_PRESERVATION`; also named in "Reconcile first" | authenticated shell                    | `HIGH_CONFLICT_RISK`          |
| V5 parity modules                       | `operations-parity.js`, `admin-parity.js`                                                                            | yes                                                                   | `RECONCILE`                                                        | queues and administration              | `DIRECT_COMPONENT_OVERLAP`    |
| V5 render and surfaces                  | `v5/src/app.js`, `surfaces/operations.js`, `surfaces/public.js`, `surfaces/admin.js`, `components.js`, `registry.js` | **yes** — targeted patching replaces the full rebuild; `stale` wiring | `RECONCILE`                                                        | primary design surface                 | `HIGH_CONFLICT_RISK`          |
| Loading, error, stale, reconnect chrome | `registry.js` `ROUTE_STATES`, `surfaces/operations.js:373`, `v5/styles/*`, `owner-visual-feedback.css`               | yes — new freshness, offline, delayed, stale, conflict states         | `RECONCILE`                                                        | visual language for these exact states | `DIRECT_COMPONENT_OVERLAP`    |
| Directory and Access                    | `surfaces/admin.js`, `admin-parity.js`                                                                               | yes — new `access` scope and polling                                  | `RECONCILE`                                                        | administration patterns                | `DIRECT_COMPONENT_OVERLAP`    |
| Legacy visual runtime                   | `src/visual/**`, `src/styles/visual/**`                                                                              | no                                                                    | `DO_NOT_MIGRATE`                                                   | —                                      | `LOW_OVERLAP` (but see §11.1) |
| Theme, tokens, motion                   | `src/index.html`, `v5/styles/tokens.css`, `theme-source.mjs`                                                         | minimal                                                               | `PORT_WITH_CONTRACT_PRESERVATION`                                  | —                                      | `LOW_OVERLAP`                 |
| Build                                   | `vite.config.js`, `scripts/v5-application-plugin.mjs`                                                                | no                                                                    | likely                                                             | —                                      | `LOW_OVERLAP`                 |

### 11.1 A contract the adoption map assumes and the product does not have

`V083_TO_FRONTEND_INTEGRATION_MAP.md` lists, for the authenticated shell slice,
the non-negotiable preservation of _"route guards, capability checks, focus
behavior, **dirty-state safety**, and server-backed view models."_

Per §4.2, dirty-state safety **does not exist in the shipped V5 application**. It
exists only in `src/visual/form-dirty-state.js`, on the branch the same map
classifies `DO_NOT_MIGRATE`. There is therefore nothing for adoption to preserve
and nothing for it to port from an approved source.

This is not an objection to the adoption plan; it is a dependency the plan cannot
satisfy on its own. v0.8.4 S5 is the natural place to establish the contract in
V5, after which adoption has something real to preserve. If adoption runs first,
it will either faithfully preserve a gap or improvise a safety behavior outside
any accepted specification.

### 11.2 Recommendation

**Frontend adoption should wait until v0.8.4 closes.** In order of weight:

1. v0.8.4's core deliverable changes **how V5 surfaces update** — targeted
   patching instead of `root.innerHTML` rebuild. Adopting a new design into a
   render model that is about to be replaced means paying for the surfaces twice.
2. v0.8.4 introduces **new required UI states** — freshness, delayed, stale,
   offline, conflict — that do not exist today (Gaps B and C). Designing them
   after v0.8.4 fixes their semantics is cheaper and truer than retrofitting.
3. Dirty-state safety is a stated adoption prerequisite that only v0.8.4 can
   supply (§11.1).
4. `v5/integration/runtime.js`, `operations-parity.js`, `admin-parity.js`, and
   `v5/src/app.js` are the four largest conflict surfaces and are central to both
   programmes at once.

Concurrent-run exception, if the owner wants one: work confined to
`src/v5/styles/**`, `tokens.css`, and non-operational public surfaces
(`surfaces/public.js` landing and sign-in) is `LOW_OVERLAP` and can proceed in a
separate worktree. Anything touching operational tables, queues, detail panes, or
state chrome should wait for **S5** at the earliest and preferably for closure.

---

## 12. Candidate specification

> **CANDIDATE ONLY — NOT ACCEPTED — DO NOT IMPLEMENT UNTIL ADOPTED**

**Objective.** Make authoritative changes visible, provably fresh, and safe under
concurrency across Inventory, Requests, Lending, Release, and Access; and
establish measured performance instrumentation with evidence-backed optimization
of proven hot paths.

**Baseline.** `release/v0.8.4-live-operations-performance` at
`b1359c2e9351099333e1dcb2189cbf27d9599445`; final v0.8.3 main
`86553349f5c2ebefaa637c30828c560a301f99ba`; product source identical to the
frozen candidate `f8e6337`; Production and Playground at schema 32 with
`0032_staff_account_activity_history.sql` as the latest migration.

**In scope.**

- Multi-scope `scoped-revision` contract v2, with per-scope accepted tokens.
- A new `access` revision scope, plus revision bumps for access, identity,
  directory, and account-application mutations.
- Wire `onStatus` and `onMetrics`; freshness indicator; offline and delayed
  states.
- Make the `stale` state reachable on consequential detail surfaces and block the
  action while stale.
- Dirty-state protection in V5, porting the accepted contract from
  `src/visual/form-dirty-state.js`.
- Single-intent idempotency keys, replacing the per-attempt UUID.
- Targeted row and summary patching, replacing whole-route `innerHTML` rebuild on
  a change tick.
- Real D1 read counters replacing the hardcoded `metrics.readCount` literals.
- Latency, read-count, and payload instrumentation with recorded baselines.
- Measured optimization of P-1, P-2, and P-3; P-4, P-5, and P-9 only if measured.

**Out of scope.**

- WebSockets, Server-Sent Events, Durable Objects, Queues, KV, or any new
  Cloudflare binding or provider resource.
- Any authentication, authorization, or capability semantic change.
- Any change to ledger or immutable-record invariants, including the schema-32
  Activity History append-only triggers.
- Frontend design adoption, Figma Make v39, Hallmark or Impeccable work.
- Production mutation, deployment, recovery rotation, credential rotation.
- Schema migrations, unless D2 is chosen and separately accepted as 0033.
- v0.8.5 governance and repository work.

**Architecture, event model, reconnect model, concurrency model, performance
measurement.** Sections 5, 6, 7, and 8 respectively.

**Implementation slices.** Section 13.

**Tests.** Section 10.

**Playground gates.** The exact frozen candidate deployed to the isolated
Playground; schema, foreign-key, ledger, and invariant reconciliation; a
two-context live-update manual test; a reconnect manual test; a recorded
performance baseline; and owner acceptance before any Production GO. Playground
is never skipped.

**Rollback.** Every slice must be revertible by Git revert alone. Contract v2 must
degrade to v1, and v1 to manual-only, both fail-closed. Worker rollback versions
and D1 Time Travel bookmarks captured before any Playground mutation.

**Stop conditions.** A conflicting active writer; unknown work outside authorized
paths; any P0 or P1; privacy or secret exposure; an authorization or capability
regression; a revision signal observed outside its authoritative batch; a
measured regression against a recorded baseline; a migration need discovered
outside accepted scope; provider or environment crossover; a missing owner
Production GO.

**Frontend-adoption interaction.** Section 11.

---

## 13. Recommended implementation slices

Adjusted from a generic realtime plan because the substrate already exists: the
highest-value work is correction, coverage, and measurement, not a new event
foundation.

```text
S1  REVISION CONTRACT V2 AND MEASUREMENT FOUNDATION
    multi-scope scoped-revision v2, server and client, with v1 fallback and fail-closed
    behavior; single-read revision query; real D1 read counters replacing the
    metrics.readCount literals; wire onStatus and onMetrics; record the first honest
    baseline for P-1, P-2, and P-3.

S2  LIVE-SIGNAL COVERAGE
    add the 'access' scope; emit revision bumps from access-management,
    account-application, identity-foundation, and staff-directory mutations, inside the
    existing authoritative batch and never outside it; add the table-driven integration
    test over every mutation entrypoint.

S3  FRESHNESS, RECONNECT, AND STALE SAFETY
    per-scope accepted tokens; the freshness predicate; a reachable 'stale' state on
    request review, lending detail, release confirm, and inventory item; block
    consequential actions on stale projections; offline and delayed indicators;
    reconnect recovery across all tracked scopes.

S4  CONCURRENCY UX AND IDEMPOTENCY INTEGRITY
    single-intent clientRequestId lifetime; typed conflict handling and copy for every
    409 code in §7; no client auto-retry; a duplicate-mutation regression proof.

S5  DIRTY-STATE PROTECTION AND TARGETED UPDATE
    port the accepted dirty-state contract into V5; replace the whole-route innerHTML
    rebuild with targeted row and summary patching on a change tick; preserve focus,
    scroll, search, and in-progress input.
    (Earliest point at which parallel frontend adoption becomes tolerable — see §11.)

S6  MEASURED PERFORMANCE FIXES
    P-1 duplicate readSession and batched account hydrate; P-2 single revision read;
    P-3 parallelized bootstrapModule reads; P-4, P-5, and P-9 only if the S1 baseline
    proves them. No change without a before-and-after number.

S7  FULL VERIFICATION AND ISOLATED PLAYGROUND
    npm run check; cloudflare e2e; v5 e2e; governance; playground; verify:dist; the
    two-context live, reconnect, and concurrency manual tests; recorded performance
    evidence; owner acceptance.

S8  CLOSURE
    candidate freeze, pointer, handoff, and changelog updates, v0.8.5 handoff, stop.
```

Deviation from a generic S1–S8: a "realtime foundation" slice is replaced by
"contract v2 and measurement foundation", because the event foundation already
exists and is correct. Inventory, Request, Lending, and Release are not separate
slices, because their live signal is already uniform — what differs between them
is the surface, which S3 and S5 handle module by module.

---

## 14. Top risks

1. **Frontend adoption and v0.8.4 collide in four files.**
   `v5/integration/runtime.js`, `operations-parity.js`, `admin-parity.js`, and
   `v5/src/app.js` are central to both programmes. Sequencing is the mitigation.
2. **Fabricated metrics can become "evidence".** `metrics.readCount` is a
   hardcoded literal in two places. Any performance claim built on it is false.
   Fix it before measuring anything.
3. **Duplicate mutations on reconnect** (§7.1). The server protection exists and
   is unreachable from the shipped UI in exactly the scenario v0.8.4 targets.
4. **Silent data loss on a poll tick** (§4.2). A change tick destroys an
   in-progress form. This is current shipped and Production behavior, and it
   contradicts both the accepted RV-01 dirty-state contract and a stated frontend
   adoption prerequisite.
5. **Access and identity are non-live end to end** (Gap A, Gap D). A revoked or
   disabled account is invisible to open sessions until a manual reload.

---

## 15. Verification of this packet

```text
[x] every material claim carries a source or test path
[x] every claim re-verified at b1359c2, the exact tree this file is committed onto
[x] product-source parity with the frozen Production candidate proven by diff
[x] no Product, runtime, provider, migration, or deployment change
[x] no .codex pointer, AGENTS.md, accepted specification, or design branch modification
[x] realtime recommendation grounded in wrangler.jsonc bindings and existing code
[x] commit-to-event ordering explicit: same db.batch, final statements
[x] reconnect recovery and its freshness proof explicit
[x] concurrency risks mapped per operation with guard, code, and gap
[x] performance work is measure-first; no baseline measured and none claimed
[x] test matrix executable against existing harnesses
[x] frontend overlap reconciled against the completed adoption intake
[x] candidate specification marked provisional
[x] STALE_IF stated
```

```text
PRODUCT MUTATIONS: NONE
PROVIDER MUTATIONS: NONE
DEPLOYMENTS: NONE
MIGRATIONS: NONE
DESIGN BRANCH: UNMODIFIED
GOVERNANCE POINTERS: UNMODIFIED
```
