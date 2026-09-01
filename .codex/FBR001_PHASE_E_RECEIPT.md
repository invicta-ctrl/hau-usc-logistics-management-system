# FBR-001 Phase E Receipt — Write Integration

STATUS: COMPLETE

## Outcome

Phase E confirmed that the current React frontend already sends every accepted current mutation workflow through `src/frontend/integration/backend.ts`. The only missing frontend connection was requester cancellation. `ExternalRequestCenter.tsx` now calls the existing `cancelRequesterRequest` adapter method only for server-cancellable `FOR_REVIEW` and `ACCEPTED` records.

The control is omitted in inspection mode, disables while its request is pending, sends a fresh caller-supplied idempotency key, reports returned safe errors without local success, applies the authoritative returned status, and reloads the portal after success, denial, or conflict. The adapter retains same-origin credentials and in-memory CSRF; no second transport, preview state, backend change, or external write was added.

## Exact mutation authority

| Family | Canonical adapter/endpoint | Evidence |
|---|---|---|
| Public lending | `submitPublicLending` → `POST /api/public/lending` | `PublicFlows.tsx` retains server receipt and error state. |
| Requester submit/cancel | `submitRequesterRequest` / `cancelRequesterRequest` → `POST /api/portal/request` and `/cancel` | requester capability is server-authorized; cancellation D1 tests prove idempotency, reservation cleanup, stale conflict, and audit safety. |
| Internal request review | `reviewRequest` → `POST /api/reviewRequest` | current Internal Request Hub preserves line validation and conflict/denial recovery. |
| Release/receiving/evidence | `uploadOperationalEvidence`, `confirmRelease`, `receiveRestock` → `/api/uploadEvidence`, `/api/confirmRelease`, `/api/receiveRestock` | current stations preserve receipt/reload and cumulative/idempotent behavior. |
| Lending | `approveLendingTicket`, `confirmLendingHandoff`, `uploadLendingReturnEvidence`, `confirmLendingReturn` → canonical Worker endpoints | current Lending Hub preserves custody, evidence, conflict, denial, and returned-state handling. |
| Profile/account/session | current profile, account-application, recovery, and logout adapter methods | existing server-controlled credential/session revocation retained. |
| Playground reset | `requestPlaygroundReset` | existing admin route remains server-gated; no reset call was made. |

## Deferred by accepted scope

- Anonymous public request is superseded by the owner-locked authenticated requester model; do not reconnect it.
- Direct inventory reserve/adjust/restock-transition and procurement/events writes have no current accepted React adapter/route command. They remain `INTENTIONALLY_DEFERRED`; Phase F is required before any visual route-body work, and backend/capability expansion is forbidden.

## Verification

| Command | Result |
|---|---|
| `npm.cmd exec vitest run tests/unit/fbr001-requester-cancellation.test.js tests/unit/frontend-backend-adapter.test.js tests/unit/inventory-slice2-d1.test.js tests/unit/inventory-command-cancellation-races.test.js tests/unit/mfr002-entry-flows.test.js tests/unit/fi08-release-desk.test.js tests/unit/fi09-supply-operations.test.js tests/unit/playground-profile-route.test.js tests/unit/v072-worker-route-contract.test.js` | PASS — 9 files, 64 tests. |
| `node C:\\Users\\adria\\.codex\\skills\\impeccable\\scripts\\detect.mjs --json src/frontend/app/request/ExternalRequestCenter.tsx` | PASS — `[]`. |
| `npm.cmd run verify:frontend:fixture-boundary` | PASS — normal routes remain backend-backed; fixtures are preview-only or unreachable legacy source. |
| `npm.cmd run design:foundation:check` | PASS — foundation current. |
| `npm.cmd run lint` | PASS — 0 errors; one pre-existing unrelated warning in `src/server/public-request-service.js`. |
| `npm.cmd run build` | PASS — fixture boundary, foundation check, and application build. |
| `npm.cmd run check:governance` | PASS — agents and continuation checks. |
| `npm.cmd run handoff:verify` | PASS — canonical records, Git state, and secret scan. |
| `git diff --check` | PASS. |

## Boundaries and next action

- No `npm ci` retry, history rewrite, deployment, push, provider/data/Playground/Production write, schema/migration/business-rule/capability/security change, or legacy deletion occurred.
- Do not replace cancellation with a local-only status transition, use preview state, or revive anonymous public request.
- Await parent direction for Phase F missing-parity work; Phase G seed retirement and Phase H acceptance/deployment remain out of scope.
