# FBR-001 Phase G Receipt

STATUS: LOCAL_VERIFICATION_COMPLETE
BRANCH: `release/v0.8.3-fbr001-claude-frontend-reconciliation`
PARENT: `2587217802ae2334183189d949ef4a72b879a054`
SCOPE: Exact runtime seed/mock retirement and duplicate-path cleanup only.

## Preservation-first candidate inventory

| Path | Classification and executable reachability | Decision | Recovery / hash |
|---|---|---|---|
| `src/frontend/app/LendingHubRoute.tsx` | Zero executable consumers; local loan fixture and simulated state duplicate canonical `lending/InternalLendingHub`. | DELETED | F3 parent; Git blob `8f235206431e14e7b070863a2a4ecbb27c55c5d7`; SHA-256 `33C7A8E1ED468A0DBA2906E680879E0BC686F2712C3C424C95DF996C27AA8870`. |
| `src/frontend/app/RequestCenterRouteWithStates.tsx` | Zero executable consumers; local preview-state wrapper around its only child. | DELETED | F3 parent; Git blob `8c8746361183c696369cf623ce121572019b3bee`; SHA-256 `2AE1D8D171B18CA76E465C9DD02B432C24015D9B7599601009135E31D2FCB903`. |
| `src/frontend/app/RequestCenterRoute.tsx` | Only executable consumer was retired wrapper; old local presentation duplicate of canonical `request/InternalRequestHub`. | DELETED | F3 parent; SHA-256 `55A29B245BEE233B42BE330AF79481587392E8B4079345212DEF888FA2D08686`. |
| `src/frontend/app/profile/profileFixtures.ts` | No executable consumer but unique orphan sample content without proven replacement. | KEPT | SHA-256 `1BDFCFE17892C4AE3AB2581D239750CDF56F93B6724A25DDED1F42F589A02BBC`. |
| `inventoryFixtures.ts`, `overviewFixtures.ts`, `OverviewPreviewRoute.tsx`, `preview/index/previewData.ts` | Explicit inspection-only data/presenter reachable via validated Playground inspection. | KEPT | Required Playground visual testing; never normal runtime authority. |
| `ReleaseDeskRoute.tsx`, `SupplyRoutes.tsx` | Inspection route surface; `SupplyRoutes` also remains current Events runtime composition. | KEPT | Existing route/test references retained. |

The historical `theme.css` comment naming the retired request path was intentionally retained as non-executable adoption evidence; it is excluded from executable-consumer checks.

## Canonical-runtime proof

- `AppRouteRenderer` composes `InternalRequestHub`, `InternalLendingHub`, and `OperationalModuleRoute` for normal routes.
- Preview fixtures remain reached only through the trusted Playground index/inspection gate; `projectPreviewIndexGate({ playground: false })` denies index access.
- `scripts/verify-frontend-fixture-boundary.mjs` now requires zero executable references to all three deleted names. It is the build prerequisite and fails closed on drift.
- No adapter, API, schema, capability, session, CSRF, security, privacy, or provider behavior changed.

## Local verification

- `npm.cmd exec vitest run tests/unit/fbr001-phase-g-runtime-boundary.test.js` — PASS, 1 file / 3 tests.
- `npm.cmd run verify:frontend:fixture-boundary` — PASS after verifier correction.
- `npm.cmd run build` — PASS, including fixture-boundary and foundation checks.
- `npm.cmd run lint` — PASS, 0 errors; one unchanged `_clientRequestId` unused-variable warning in `src/server/public-request-service.js:159`.
- `npm.cmd exec vitest run tests/unit/fbr001-phase-g-runtime-boundary.test.js tests/unit/frontend-playground-guard.test.js tests/unit/mfr002-preview-index.test.js tests/unit/frontend-backend-adapter.test.js` — PASS, 4 files / 41 tests.
- `npm.cmd run verify:dist` — PASS; normal application artifact 13 files / 37,317,789 bytes.
- `npm.cmd run build:cloudflare` followed by `npm.cmd run verify:deploy:artifact staging .wrangler/build/staging` — PASS; local staging artifact only, 13 files / 37,317,843 bytes. No upload, deployment, provider call, or environment mutation occurred.
- `npm.cmd run check:governance` — PASS (agent instructions and continuation).
- `npm.cmd run handoff:verify` — PASS (canonical records, Git state, and secret scan).
- `git diff --check` — PASS; complete logical diff review confirms exactly the three authorized deletions, zero-reference verifier correction, focused G boundary test, and Phase G records.

## Remaining

Phase H browser/accessibility acceptance remains pending separate parent direction. No Playground, provider, or Production action occurred.
