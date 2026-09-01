# FBR-001 Phase F1 Receipt — public, requester, and overview visual parity

STATUS: COMPLETE
SCOPE: F1 only — landing/current announcements, staff access, authenticated requester portal, public lending/tracking, and server-derived overview.
START: `c5a14d7f9d5aa1bf8a907046ec722cdffef97556`
PRODUCTION_OR_PROVIDER_WRITES: NONE

## Authority and judgment

- Claude is the composition authority; Playground Worker/API, session, capabilities, CSRF, and returned state remain functional authority.
- The canonical theme/foundation pipeline already supplied required tokens and primitives. No shared primitive gap was proven, so neither foundation source nor generated output changed.
- Hallmark direction retained: editorial public/access surfaces and Workbench overview, warm paper/oxblood/gold restraint, ruled sheets, tabs, attention and timeline order. The standalone Hallmark root-token/stamp convention is intentionally not used because `DESIGN.md` and the governed generator are the repository's canonical design source.
- Impeccable hardening retained visible focus, touch-safe controls, responsive tab overflow, reduced-motion-safe existing foundation behavior, and truthful recovery states.

## Implemented boundary

- `LandingPage` and live `CurrentSection` now declare the F1 editorial gateway boundary while preserving `publicAdvertisements` loading, empty, request-error, and media-error branches.
- `StaffSignInPage`, recovery, and access flows retain canonical login/activation/recovery/denial/service-error behavior in a tokenized access-sheet boundary; no archive role picker or local session authority was adopted.
- `PublicFlows` retains public catalogue, submit, returned receipt, and private tracking branches; its local navigation becomes a deliberate mobile-scrollable tab strip.
- `ExternalRequestCenter` retains the Phase E server-reconciled cancellation control and existing requester submission/history/conflict states under the entry-flow boundary.
- `OverviewRoute` retains authorized projection, loading, denied, error, stale, and queue states; F1 applies Workbench sheet/attention treatment without inventing metrics.

## Deterministic evidence

- `npm.cmd exec vitest run tests/unit/fbr001-phase-f1-visual-parity.test.js tests/unit/fbr001-read-integration.test.js tests/unit/fbr001-requester-cancellation.test.js tests/unit/mfr002-entry-flows.test.js tests/unit/mobile-shell-contract.test.js` — PASS, 5 files / 17 tests.
- `npm.cmd run lint` — PASS, 0 errors; one pre-existing `_clientRequestId` warning in `src/server/public-request-service.js:159`.
- `npm.cmd run verify:frontend:fixture-boundary` — PASS; normal routes backend-backed and fixtures explicit-preview-only or unreachable legacy source.
- `npm.cmd run design:foundation:check` — PASS; generated foundation current.
- `node C:\Users\adria\.codex\skills\impeccable\scripts\detect.mjs --json <all changed F1 UI sources>` — PASS, `[]` after moving public type-ramp values and auth backdrop treatment to governed tokens/classes.
- `npm.cmd run build` — PASS; 1,696 modules transformed.
- `npm.cmd run check:governance`; `npm.cmd run handoff:verify`; `git diff --check` — PASS.
- Browser matrix is deferred to Phase H by accepted scope; deterministic route/state visual contracts cover F1 at this checkpoint.

## Remaining and no-repeat

- Phase F2: internal inventory, request center, release/restocking, lending, procurement, and events route bodies only.
- Phase F3: administration, profile, and Playground utility body parity only.
- Phase G: retire any remaining seed/mock paths only after equivalent real behavior is separately proven.
- Do not rerun `npm ci`; do not deploy, push, mutate providers, revive anonymous public request, add a second frontend transport, change backend/schema/capabilities/security, or rewrite Git history.
