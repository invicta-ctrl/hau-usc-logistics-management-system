# P05 FI-00 through FI-17 Frontend Reconciliation

DATE: 2026-08-28
PROGRAM: PLAYGROUND-MASTER-2026-08-28
STATUS: COMPLETE_PENDING_FINAL_CHECKPOINT

## Exact identities

- Frozen accepted FI product commit: 3da03dcc78caafe144afbe02fc09197979bce0a3
- Frozen accepted FI product tree: 4d9c6f40625fd738530e22347597ead1ce787017
- Prior migration source commit: 9d7cb7556a70e6c1cfd9438901410ffb74c1547b
- Prior migration source tree: 7c19a6eeb518a57f9e5dd5e81c29a274b5093cfa
- Selected Playground base: 631724a5f32a49b9dcf45eec5a894aa7baf66266
- P05 starting reconciliation HEAD: aaf199dea964e2a9fc17acd5626fe054b4510759

The frozen FI product contained 182 files under src/frontend. At the prior 9d7cb755 migration source, 173 of those files were source-identical. Nine frontend paths diverged because the migration had to preserve Playground operational contracts or resolve a mixed frontend/runtime conflict.

## Nine divergent frontend paths

| Path                                                   | Classification              | Decision                                                                                                                                                             |
| ------------------------------------------------------ | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| src/frontend/app/AppRouteRenderer.tsx                  | REPAIR_CONFLICT             | Keep real Playground authorization and operational adapters; keep accepted FI components in explicit Preview inspection paths.                                       |
| src/frontend/app/appTypes.ts                           | KEEP_NEWER_SHARED_CONTRACT  | Preserve exact server-projected capability vocabulary used by current route gates.                                                                                   |
| src/frontend/app/auth/StaffSignInPage.tsx              | KEEP_PLAYGROUND_INTEGRATION | Preserve the version-gated, staging-only credential-free test entry; Production remains denied.                                                                      |
| src/frontend/app/operations/OperationalModuleRoute.tsx | KEEP_PLAYGROUND_INTEGRATION | Preserve real read-only backend projections for Overview, Release, Restocking, and Procurement in normal runtime.                                                    |
| src/frontend/app/overview/OverviewRoute.tsx            | REPAIR_CONFLICT             | Keep the real backend Overview in normal runtime; restore the accepted FI command-table implementation as OverviewPreviewRoute for explicit Preview inspection only. |
| src/frontend/app/routeStyleScope.ts                    | ADOPT_FI_FRONTEND           | Restore the accepted FI-13 generic rooted-selector conversion; the selected migration had retained the weaker pre-FI13 transform.                                    |
| src/frontend/app/useAppController.ts                   | KEEP_PLAYGROUND_INTEGRATION | Preserve real session, capability, active test-session, and staging-entry behavior. P04 canonical hash synchronization remains additive.                             |
| src/frontend/integration/backend.ts                    | KEEP_PLAYGROUND_INTEGRATION | Preserve current real Worker/API adapters and staging-only session contract.                                                                                         |
| src/frontend/styles/fonts.css                          | KEEP_PLAYGROUND_INTEGRATION | Preserve same-origin fallback stacks because the deployed CSP intentionally blocks external font fetches.                                                            |

## Test and generated-pipeline differences

| Paths                                                                                                                                                                                                                                                                                                                                                             | Classification              | Decision                                                                                                                                                                                                        |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| tests/e2e/fi07-lending-hub.spec.js, fi11-reference-surfaces.spec.js, frontend-cutover.spec.js, preview-index.spec.js, r3-a1-a2-routing.spec.js                                                                                                                                                                                                                    | REPAIR_CONFLICT             | Retain accepted FI behavior assertions adapted to real Playground routes, authorization, and Preview inspection gates.                                                                                          |
| tests/e2e/fi17-production-artifact.spec.js                                                                                                                                                                                                                                                                                                                        | SUPERSEDED                  | Do not restore the branch-local artifact test; current release-pipeline, deploy-artifact, production-mode, and Playground-denial gates cover the accepted artifact boundary against the current build pipeline. |
| tests/unit/fi07-lending-hub.test.js, fi08-release-desk.test.js, fi09-supply-operations.test.js, fi12-route-style-scope.test.js, frontend-backend-adapter.test.js, post-fi17-overview-hero-recovery.test.js                                                                                                                                                        | REPAIR_CONFLICT             | Preserve mixed FI presentation assertions and current backend/fixture boundaries; strengthen Overview split and FI-13 style containment.                                                                        |
| tests/unit/frontend-font-policy.test.js, frontend-playground-guard.test.js, playground-baseline-data.test.js, playground-deployment-history.test.js, playground-evidence-placeholders.test.js, playground-r2-reset-worker.test.js, playground-reset-workspace-contract.test.js, release-pipeline.test.js, staging-sandbox.test.js, verify-deploy-artifact.test.js | KEEP_PLAYGROUND_INTEGRATION | Preserve deterministic Playground backend, reset, privacy, deployment, CSP, and Production-denial coverage.                                                                                                     |
| tests/unit/codex-governance.test.js                                                                                                                                                                                                                                                                                                                               | KEEP_NEWER_SHARED_CONTRACT  | Preserve current governance expectations; frozen FI routing text is historical.                                                                                                                                 |

## Later Playground and master-program deltas

- src/frontend/app/landing/HeroMotion.tsx, src/public/_headers, and their regression were changed after migration only for byte-identical Cloudflare hero reconstruction and the narrow same-origin/blob media CSP allowance: KEEP_PLAYGROUND_INTEGRATION.
- P03 fail-open visibility, live isolation audit, and branch-policy alignment: KEEP_NEWER_SHARED_CONTRACT.
- P04 canonical route/history and exact deployed-Playground inspection gate: KEEP_NEWER_SHARED_CONTRACT.
- P04 wording changes do not change fixture or backend semantics; they make the deployed Preview surface truthful.

## P05 repairs

1. Added OverviewPreviewRoute from the frozen accepted FI command-table implementation under the explicit Preview inspection boundary.
2. Kept OverviewRoute as the real backend read-only module in normal runtime.
3. Extended the no-protected-network Playwright gate to open the Overview preview before the other protected fixtures.
4. Restored the accepted FI-13 route-style containment implementation and its stronger desktop/mobile descendant regression.

## Result

All accepted FI routes are present. No accepted completed route remains a reserved/not-built placeholder. Real Playground runtime keeps its Worker/API/auth/D1/R2 integration, while deterministic FI fixture presentations remain confined to explicit Preview inspection. No broad merge, source-worktree mutation, provider write, deployment, reset, migration, Production write, Google write, or Figma write occurred.

## Verification

- Focused P05 unit suite: 5 files / 52 tests passed.
- Exact-4173 no-protected-network Preview inspection plus exhaustive 15-route navigation: 2/2 Playwright tests passed.
- Preview build and verify:dist passed.
- dist/index.html and HAU-USC_Logistics-Frontend-Shareable.html: 48,829,263 bytes; identical SHA-256 A59F9DD5AAFD4D1D7CC1BB3A7722244DBCD81F5A671DA8F536030CE701873679.
- Cloudflare staging build and hero reconstruction passed.
- Staging index: 804,510 bytes; SHA-256 719767F6076D5276CB7E147EBCA10FD4458A31DB4DB0627D58B4A6CC6AB97489.
- Hero source: 36,018,711 bytes; SHA-256 657b38b82d452a234ab76c64a3c4312133279ec3d59b9923c84c5e24501e71d1.
- Controlled local 4173 server was stopped; the port was confirmed free.
- Repository-wide lint retains the pre-existing unrelated prototype baseline: 26 browser-global errors in prototypes/public-portals-r3/app.js and two existing unused-variable warnings. Targeted changed JavaScript reported no error; this ESLint configuration does not lint the changed TypeScript/TSX paths.

  KEEP_PLAYGROUND_INTEGRATION = PASS
  ADOPT_FI_FRONTEND = PASS
  REPAIR_CONFLICT = PASS
  KEEP_NEWER_SHARED_CONTRACT = PASS
  SUPERSEDED = EXPLICIT_AND_COVERED
  UNVERIFIED = 0
  RESERVED_ACCEPTED_ROUTES = 0
