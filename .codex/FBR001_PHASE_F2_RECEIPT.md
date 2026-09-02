# FBR-001 Phase F2 Receipt — internal operations visual parity

STATUS: COMPLETE
SCOPE: F2 only — inventory, Internal Request Hub, Release/Receiving/Procurement, Internal Lending Hub, and Events.
START: `164f1fde612dd04a7a45fa3a94a17260486c78d9`
PRODUCTION_OR_PROVIDER_WRITES: NONE

## Authority and judgment

- Claude remains composition authority; Playground Worker/API, server session, capabilities, CSRF, custody, ledger, evidence, idempotency, and returned state remain functional authority.
- F2 composes existing generated foundation vocabulary and route-local styles; it does not modify the foundation generator, adapter, Worker, schema, migration, or capability projection.
- The inherited Internal Request Hub selected-row side stripe was replaced with a semantic top decision rule, preserving selection behavior and satisfying the accepted no-side-stripe constraint.
- Inventory direct reserve/adjust/restock-transition controls and procurement/events mutations remain intentionally deferred because no current accepted React route command is available.

## Implemented boundary

- `InventoryRoute`, `InternalRequestHub`, `InternalLendingHub`, `OperationalModuleRoute`, and `EventReadinessRoute` declare scoped F2 Workbench boundaries.
- Shared F2 CSS keeps headers ruled, attention states top-ruled, controls focus-visible, and request/lending tab systems horizontally scrollable rather than wrapping at narrow widths.
- Existing canonical adapter reads and accepted request/release/receiving/lending writes remain untouched; normal runtime still has no preview data or competing transport.

## Deterministic evidence

- `npm.cmd run lint` — PASS, 0 errors; one pre-existing `_clientRequestId` warning in `src/server/public-request-service.js:159`.
- `npm.cmd exec vitest run tests/unit/fbr001-phase-f2-visual-parity.test.js tests/unit/fbr001-read-integration.test.js tests/unit/fi07-lending-hub.test.js tests/unit/fi08-release-desk.test.js tests/unit/fi09-supply-operations.test.js tests/unit/mfr002-overview-inventory.test.js tests/unit/mobile-shell-contract.test.js` — PASS, 7 files / 32 tests.
- `npm.cmd run verify:frontend:fixture-boundary`; `npm.cmd run design:foundation:check`; `npm.cmd run build` — PASS. The build completed in 12.42s.
- `node C:\Users\adria\.codex\skills\impeccable\scripts\detect.mjs --json <five F2 route sources plus F2 stylesheet>` — PASS with exit 0.
- `npm.cmd run check:governance`; `npm.cmd run handoff:verify`; `git diff --check` — PASS before final receipt closeout.

## Remaining and no-repeat

- Phase F3: administration, profile, and Playground utility body parity only.
- Phase G: retire any remaining seed/mock paths only after equivalent real behavior is separately proven.
- Phase H: browser/accessibility matrix and only then any separately authorized isolated Playground candidate deployment.
- Browser matrix is deferred to Phase H by accepted scope; no provider, Playground, D1, R2, Google, Figma, or Production action occurred.
- Do not rerun `npm ci`; do not deploy, push, mutate providers, add a second frontend transport, change backend/schema/capabilities/security, or rewrite Git history.
