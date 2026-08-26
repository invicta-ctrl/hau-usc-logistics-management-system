# FI-13 Final Craft / Exact Frontend Freeze Receipt

STATUS: CLOSED__SOL_ACCEPTED__LOCAL_FRONTEND_FREEZE__FI14_CANDIDATE_GATE_REFROZEN
DATE: 2026-08-26
PROGRAM: HAU-USC Logistics FI-04 → FI-17 R1
BRANCH: frontend-design-integration
START_HEAD: 67504579aa062ae809c7fb44c629518042a77b3d
PRIOR_FROZEN_FRONTEND_SOURCE_COMMIT: 7c2321f9cf1754d2781b57748cea5bf37be75d3f
PRIOR_FROZEN_FRONTEND_SOURCE_TREE: d0362449654998dc238beaa58f973ea5af30d7d1
PREVIOUS_FI14_CONFIG_FREEZE_COMMIT: 1c8ac73b88078fc08c96b8836348f29cf418bc6a
PREVIOUS_FI14_CONFIG_FREEZE_TREE: dc2e4e2286d68efc4b48ea15076d43435949dedf
PREVIOUS_FI14_ROLLBACK_GUARD_FREEZE_COMMIT: 1751fd390fc79a6a691c7410107e8b7e1cc36226
PREVIOUS_FI14_ROLLBACK_GUARD_FREEZE_TREE: 586cf5f7a7679d6dcabea21b204ce7fb6b5d9d05
FROZEN_FRONTEND_SOURCE_COMMIT: a377f079ce39f6c8b8e5e76f80f59b62e932d80e
FROZEN_FRONTEND_SOURCE_TREE: 4177693026d0b239dff6255d5a4cbaa52cf26d86
AUTHORITY: Earl FI09-FI17-SOL-COGNEE-2026-08-26 owner attachment, FI-13 accepted packet, TOKEN-OPT-001-A8, project policy, current repository contracts, and accepted Make-v44/Figma Design evidence.

## Bounded repair

- A true FI-12 responsive regression was reproduced at 320px: rooted embedded route selectors within CSS `@scope` no longer matched their own route root, so both the Release Desk table trigger and mobile-card trigger were visible.
- `scopeRouteCss` now converts post-boundary rooted rules to `:scope` before containment. The accepted Make-v44 CSS payload, root token/control rules, module markup, visual composition, and route boundaries remain unchanged.
- FI-12 unit coverage now asserts rooted desktop and responsive `table`, `th`, and `td` rules. FI-10's current Administration preview-state label and desktop/mobile FI-11 tab presentation are asserted without weakening its privacy or zero-traffic checks.

## Exact candidate identity

- Toolchain: Node `v26.3.0`; npm `11.16.0`.
- Dependency lock: `package-lock.json` SHA-256 `C84EE33BEAD67DB1C3A620462191727A9040E197D9F6A9767B54F4CADCECC183`.
- Deterministic frontend artifacts: `dist/index.html` and `HAU-USC_Logistics-Frontend-Shareable.html` share SHA-256 `B1B1F51E7C5DB3B96F7EB55A9CFE3C6E7F36B9D741807219BB6BEA2FB1B20556`.
- Repository-only backend identity, unchanged by FI-13: `wrangler.jsonc` blob `8f0a2f2f3b3fc79167616b1884cb4cac19dc80d4`; `cloudflare/wrangler.preview.jsonc` blob `d8fa2a8519c7be9b033b1c1856fe81707903352b`; `migrations/` tree `eabf44d962a2eb36343ed59e67fc6bea7c9af89f`.
- No Worker, schema, migration, provider, Playground, or Production verification was attempted or implied; all are out of FI-13 scope.

## FI-14 release-path configuration refreeze

- The prior FI-13 source identity is retained as historical evidence, but it is not a lawful FI-14 deployment candidate because the tracked `release-candidate.yml` upload step named a retired shareable artifact that does not exist in the frozen tree.
- Under Earl's accepted FI-14 authority and Sol's bounded release-preparation decision, only that upload path changed from `HAU-USC_Logistics-Prototype-Shareable.html` to the existing deterministic `HAU-USC_Logistics-Frontend-Shareable.html`; the directly coupled release-pipeline assertion now proves the retired path is absent.
- Refrozen source/config commit: `1c8ac73b88078fc08c96b8836348f29cf418bc6a`; tree: `dc2e4e2286d68efc4b48ea15076d43435949dedf`.
- The refreeze ran focused release-pipeline/Playground governance/config tests (12/12), `npm.cmd run build`, and `npm.cmd run verify:dist`. Both deterministic application artifacts remain SHA-256 `B1B1F51E7C5DB3B96F7EB55A9CFE3C6E7F36B9D741807219BB6BEA2FB1B20556`.
- This is a configuration-only candidate update: no application source, visual composition, route behavior, backend identity, schema, provider binding, or deployed environment changed. FI-13 browser, Hallmark, and Impeccable evidence is reused only because the two application artifacts are byte-identical.
- The prospective temporary release ref must point exactly to this refrozen source/config commit, never to the old FI-13 source or a docs-only closure commit.

## FI-14 rollback-target guard refreeze

- A final read-only FI-14 predeploy gate could prove existing isolated staging version inventory but could not safely prove the private manifest rollback tuple before upload. Under Earl's section-20 authority and Sol's bounded decision, the native Playground guard was strengthened before any candidate ref or deployment.
- `deploy-playground.mjs` now resolves the private manifest's rollback staging version through a read-only staging version view before upload. `playground-config.mjs` rejects an absent/mismatched rollback version, D1, brand R2, or evidence R2 tuple; it also rejects any rollback D1/R2 equality with the current Production bindings and an incomplete Production comparison tuple.
- Direct release-pipeline coverage and functional Playground-config coverage prove the fail-closed tuple behavior. Focused release-pipeline/Playground tests passed 13/13.
- Refrozen source/config commit: `1751fd390fc79a6a691c7410107e8b7e1cc36226`; tree: `586cf5f7a7679d6dcabea21b204ce7fb6b5d9d05`. This supersedes `1c8ac73b88078fc08c96b8836348f29cf418bc6a` only as the FI-14 candidate because of the authorized guard change.
- `npm.cmd run build` and `npm.cmd run verify:dist` reproved both deterministic application artifacts at SHA-256 `B1B1F51E7C5DB3B96F7EB55A9CFE3C6E7F36B9D741807219BB6BEA2FB1B20556`; browser, Hallmark, and Impeccable evidence remains reusable only on that exact application-byte basis.
- The canonical local preview was recovered through its documented stale-state clear and runtime-only private manifest flow after verifying the live staging target in memory; no private path, hostname, manifest content, source artifact, or repository residue was committed.

## FI-14 candidate-gate refreeze

- The preserved first candidate workflow run failed before private-manifest decode, Cloudflare/provider access, or deployment because its repository gate still asserted obsolete A6/A7 staffing phrases. After that A8 validator repair, the unchanged global lint exposed only the historical, non-shipped `prototypes/public-portals-r3/**` prototype warnings.
- Under Earl's accepted FI-14 section-20 authority and Sol's bounded decision, `check-agent-instructions.mjs` and its deterministic test now require active A8 semantics and reject obsolete zero-child/Sol-child clauses. `lint:release-candidate` excludes only that historical prototype, and `check:release-candidate` keeps the global governance, build, unit test, Apps Script, dist verification, and Cloudflare dry-run stages unchanged; only the candidate workflow uses the scoped check.
- Refrozen source/config commit: `a377f079ce39f6c8b8e5e76f80f59b62e932d80e`; tree: `4177693026d0b239dff6255d5a4cbaa52cf26d86`. Its complete source diff is limited to the A8 validator/test, candidate-only package scripts, candidate workflow command, and direct release-pipeline assertion.
- Focused governance/release-pipeline coverage passed 19/19. The exact candidate gate passed governance, candidate lint with zero errors (two pre-existing warnings), build, 155 test files/1160 tests, Apps Script validation, deterministic dist verification, and Cloudflare dry-run. Both deterministic application artifacts remain SHA-256 `B1B1F51E7C5DB3B96F7EB55A9CFE3C6E7F36B9D741807219BB6BEA2FB1B20556`.
- The existing temporary release ref remains at the prior rollback-guard candidate with its failed pre-provider workflow evidence. This source refreeze does not update that ref, decode a manifest, contact a provider, or dispatch another workflow. Sol review and a new exact-candidate preflight are required before any such action.

## Verification evidence

- `npm.cmd exec -- vitest run tests/unit/fi12-route-style-scope.test.js tests/unit/frontend-backend-adapter.test.js tests/unit/fi07-lending-hub.test.js tests/unit/fi08-release-desk.test.js tests/unit/fi09-supply-operations.test.js tests/unit/fi10-administration.test.js tests/unit/fi11-reference-surfaces.test.js` — passed 7 files, 48/48.
- `npm.cmd run build` — passed; `npm.cmd run verify:dist` — passed with the recorded artifact SHA-256.
- Exact persistent `http://127.0.0.1:4173/` Playwright ran serially at 320, 390, 768, 1024, and 1440. It verified responsive rendering, keyboard/focus lifecycle and visible focus, modal containment/restoration, reduced motion, truthful real/synthetic labels, Preview Index zero protected traffic, console assertions, and public/requester/DOL route separation.
- The full 365-selection serial run completed all executable checks through selection 334 and 336–350. REQ-04 at 1440 hit the temporary CLI 90-second limit only after accumulated runner load; its exact isolated run with the original 30-second limit passed in 3.7s. The focused serial rerun of REQ-04 plus selections 351–365 completed 16 selections: 15 passed and 1 expected desktop mobile-drawer skip; REQ-04 passed in 2.8s. This is harness-load sensitivity, not a reproducible product defect.
- Preview Index registry evidence remains 15 entries and preserves `ACCEPTED` / `VISUAL ONLY` / `Real module` truth without a backend binding or protected request.
- The candidate-gate refreeze passed `npm.cmd run check:continuation`, `npm.cmd run handoff:verify`, and `git diff --check` both before and after this docs-only synchronization.

## Craft and safety audits

- Hallmark bounded audit: `0 critical · 0 major · 0 minor` introduced. No generic-dashboard, hierarchy, copy, card, visual-language, token, typography, or Make-v44 composition drift was found.
- Impeccable Operate audit: accessibility, performance, theming, responsive behavior, and implementation integrity are accepted for this bounded selector repair; its one required detector run against `src/frontend/app/routeStyleScope.ts` returned `[]`.
- Contrast evidence is reused unchanged: this repair changes no color, typography, visual token, or focus-ring declaration. Existing semantic/keyboard/focus/motion evidence remained green across the five-width matrix.
- Sol final candidate review: `ACCEPT` after the continuity wording correction in `CURRENT_HANDOFF.md`; no actionable source finding remains.

## Preserved boundaries and residuals

- `.ai-bridge/` remains untracked, excluded, untouched, and uncommitted.
- No backend, Worker, API, authentication, authorization, permission, session, schema, migration, D1, R2, provider, Figma, Make, Playground, Production, main, deployment, protected request, or mutation behavior changed.
- Accepted residuals only: the pre-existing favicon 404 and the pre-existing Preview Inspection `#fff4d6` advisory are unchanged and out of scope.

## Closure boundary

- The FI-13 Terra writer lock remains released; the separate FI-14 Terra writer lock is recorded only in the active FI-14 current chain.
- NEXT_EXACT_ACTION: Await Sol review of `a377f079ce39f6c8b8e5e76f80f59b62e932d80e`; only after explicit authorization re-run the FI-14 exact-candidate, Cloudflare/GitHub authorization, isolation, and rollback preflight, update the preserved temporary ref to that exact commit, and dispatch the existing isolated workflow only if every gate remains green. Do not alter Production from this receipt.
