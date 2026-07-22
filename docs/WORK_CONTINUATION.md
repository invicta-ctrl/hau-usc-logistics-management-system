# Work Continuation

## Current resume block

- **Inventory & Pantry checkpoint:** code milestone `bf350fe1f1bbd06c547cdcf8bbf71fa66b5035c6` implements the S0002 Inventory & Pantry experience inside the shared role layer. `INVENTORY.html` was read at SHA-256 `107f447e9aef8d3b9a377b5d059a745807e744833272e02d55150c5ed30fbf19` and its durable decisions were appended to `.codex/DESIGN_REFERENCE_DIGEST.md`.
- **Inventory scope and boundaries:** exception-first catalog attention, circulation, and release-readiness signals lead to existing shared workspaces; on-hand, reserved, and available-to-promise remain distinct. The amber accent and Inventory ownership grant no authority; stock-moving actions remain capability-bound, revalidated, and ledger-aware.
- **Inventory verification:** focused role unit tests pass 3 / 3; the combined responsive role proof passes 6 / 12 intentional skips, including Inventory at 390px and 1366px with no horizontal overflow; `npm run check` passes with governance, lint, 46 Vitest files / 344 tests, deterministic build/parity, Apps Script validation, and standalone verification. `dist/index.html` is 442,740 bytes / SHA-256 `294987c65799bfb750610fa13d6ae597d0ee0ec1ba76f44c09e75a5ade141f65`.
- **Next action:** push the Inventory & Pantry checkpoint and verify PR #9 CI, then read only `MATERIALS.html` and begin the authorized Materials & Documentation role slice.

- **Food checkpoint:** code milestone `a6bcd7e3be934479496ce6fc05e43903989420a0` implements the S0002 Food experience inside the shared role layer. `Food.html` was read at SHA-256 `0f15dd3c493b471572d3ad417edca6356b691c6d8247e624314871ffbc6f2390` and its durable decisions were appended to `.codex/DESIGN_REFERENCE_DIGEST.md`.
- **Food scope and boundaries:** deadline-first food requirements, sourcing/budget, cumulative receiving, and release-readiness signals lead to existing shared workspaces. The orange accent and Food ownership grant no authority; procurement, receiving, evidence, and controlled distribution remain server-owned.
- **Food verification:** focused role unit tests pass 2 / 2; Food responsive browser proof passes 2 / 4 intentional skips at 390px and 1366px with no horizontal overflow; `npm run check` passes with governance, lint, 46 Vitest files / 343 tests, deterministic build/parity, Apps Script validation, and standalone verification. `dist/index.html` is 440,545 bytes / SHA-256 `cfa862f01e0f3b437836533dd337b6593b3ca8287b466c399ae6fa9c31f0946f`.
- **Next action:** push the Food checkpoint and verify PR #9 CI, then read only `INVENTORY.html` and begin the authorized Inventory & Pantry role slice.

- **Director checkpoint:** code milestone `c54d68af372865be272eda0331f8258b7d84858f` implements the S0002 Director experience inside the existing shared shell. `DIRECTOR.html` was read at SHA-256 `e2bb882de9bd53598b8a4b5d3886183a37e5731175b4615e8772521a8990b072` and its durable decisions were appended to `.codex/DESIGN_REFERENCE_DIGEST.md`.
- **Director scope and boundaries:** server-derived event-series, leadership-decision, blocker, and release-readiness signals lead to existing shared workspaces. The bounded Management & Access explanation creates no client authorization, configuration, service, transaction, ledger, or environment path.
- **Director verification:** focused role unit tests pass 2 / 2; `tests/e2e/role-experiences.spec.js` passes 2 / 4 intentional skips at 390px and 1366px with no horizontal overflow; `npm run check` passes with governance, lint, 46 Vitest files / 342 tests, deterministic build/parity, Apps Script validation, and standalone verification. `dist/index.html` is 438,742 bytes / SHA-256 `5ac5b62cb5852000a14e0b4630dece6142e81cbad55b90332835bb6d38d9f3de`.
- **Next action:** push the Director checkpoint and verify PR #9 CI, then read only `Food.html` and begin the already-authorized Food role slice.

- **Administrator checkpoint:** code milestone `658410b24b6556131d11901551911d553a1832b7` is pushed on `chore/v0.6-codex-continuity-bootstrap`. It read only `ADMIN.html` (SHA-256 `88e13f1e34cb9175d943f362444655f0f10d4bc6179f9e4af2be825ef2e6c5a3`), appended durable decisions to `.codex/DESIGN_REFERENCE_DIGEST.md`, and added the exception-first control desk to `src/visual/views/reference-admin.html`.
- **Scope and boundaries:** Access Management, Reference Data, Link Registry, and Audit & System are presentation entry points that select the existing `PERMISSIONS`, `VENUES`, `ROUTING`, and `SYNC_HEALTH` domains. They never grant a role/capability, bypass server authorization or distinct review, mutate ledger truth, or expose protected configuration. Sync health and roster ownership remain read-only.
- **Administrator verification:** focused unit tests pass 10 / 10; `tests/e2e/reference-administration.spec.js` passes 6 / 24 intentional skips; `npm run check` passes with governance, lint, 45 Vitest files / 341 tests, deterministic build/parity, and Apps Script validation. Generated artifacts are rebuilt through the documented pipeline.
- **Next action:** verify PR #9 CI for the pushed Administrator checkpoint, then stop pending an explicitly authorized next role slice. Do not read a non-Administrator role reference.

- **Repository/worktree:** `D:\Documents\Codex\HAU-USC Logistics\active\hau-usc-logistics-management-system`; authoritative v0.6 continuity checkout.
- **Branch/HEAD/upstream:** local work remains on `chore/v0.6-codex-continuity-bootstrap` over verified remote handoff `d8af7bb4a5e986fc4dfd166ae664f5758c46a1fd`; it tracks `origin/chore/v0.6-codex-continuity-bootstrap`; draft PR #9 is unchanged. Fetch and inspect the local worktree before continuing.
- **Current phase/stage:** `PHASE_2_SHARED_SHELL_CHECKPOINTED`; `.codex/CURRENT.md` is `ACTIVE` for Phase 2 / GPT-5.6 Terra.
- **Accepted scope:** S0003 ingestion and shared shell/design-system implementation only; no role-specific experience is included in this checkpoint.
- **Completed work:** S0003 was read once and compressed into `.codex/DESIGN_REFERENCE_DIGEST.md`; `src/styles/visual/runtime-extensions.css` and `src/visual/runtime-extensions.js` implement the shared visual shell, scoped accents, compact mobile navigation, accessible overflow navigation, and safe bottom content spacing without changing domain/security behavior.
- **Files changed by purpose:** `.codex/` records the design source and active Phase 2 slice; visual runtime extension sources carry the presentation-only shell; responsive E2E navigation helpers prove existing module destinations remain reachable; generated artifacts were regenerated from source.
- **Test evidence:** focused shared-shell/baseline unit tests, lint, `npm run check` (45 Vitest files / 341 tests), build/parity/package checks, responsive browser proofs at 390, 768, and 1366px, and the complete `npx playwright test --reporter=dot` gate (`status: passed`; 216 scheduled; no failed tests) pass. Generated artifacts were rebuilt through `npm run build` and verify deterministically.
- **Tests verified at current SHA:** source verification is complete before the shared-shell checkpoint commit; the commit SHA and remote PR/CI state must be verified after the normal push.
- **Generated artifacts:** `dist/index.html`, the all-in-one shareable, guided demo, seven module shareables, and the parser-safe Apps Script bundle were regenerated only through `npm run build`.
- **External actions:** no deployment, Sheets/Drive write, D1 migration, access seed, trigger change, production action, `main` update, or PR merge occurred. The shared-shell commit is limited to the normal branch/PR checkpoint push.
- **Rollback:** discard only by a focused revert after a reviewed commit; until then the local diff is recoverable. The Phase 1 checkpoints `c07e6e6`, `aeb05c7`, `12cdfd4`, and `81efe826` remain preserved.
- **Blocker:** none for the next repository-side slice. The separate v0.5 Slice 13 distinct-identity acceptance blocker remains unresolved and must not be bypassed.
- **Next three actions:** read only `ADMIN.html`; append Administrator-specific decisions to the digest; implement only the Administrator experience inside the existing shared system.
- **Resume commands:** `git fetch --prune`; `git status --short --branch`; `git diff --stat`; read `AGENTS.md`, `.codex/CURRENT.md`, `.codex/PHASE_AND_CONTEXT_POLICY.md`, `.codex/specs/v0.6-phase-2-terra.md`, and `.codex/DESIGN_REFERENCE_DIGEST.md`.
- **Prohibited actions:** do not ingest a non-Administrator role reference, change Phase 1 authentication/authorization/ledger contracts, deploy, migrate, write institutional data, merge PR #9, or discard the local worktree.
- **Resume commands:** `git fetch --prune`; `git status --short --branch`; `git rev-list --left-right --count 'HEAD...@{upstream}'`; `gh pr checks 9`; read `AGENTS.md`, `.codex/CURRENT.md`, `.codex/PHASE_AND_CONTEXT_POLICY.md`, and `.codex/specs/v0.6-phase-2-terra.md`.
- **Prohibited actions:** no continuation of Phase 1 after the phase-stop message; no Phase 3, production promotion, Apps Script/Cloudflare deployment, operational institutional-data write, migration, destructive history rewrite, secret/private identifier commit, `main` update, PR merge, or authorization/separation-of-duties bypass.

## Verified Phase 2 design-reference bundle

- S0003 design-direction preview: `HAU-USC_Logistics_S0003_Design_Direction_Preview.html`, 42,048 bytes, SHA-256 `89D7741B25146806C2FFED8C0BCF85DD58CDBA1D84144C6DD65C54ADA0318429`.
- Administrator: `ADMIN.html`, 79,771 bytes, SHA-256 `88E13F1E34CB9175D943F362444655F0F10D4BC6179F9E4AF2BE825EF2E6C5A3`.
- Director: `DIRECTOR.html`, 81,395 bytes, SHA-256 `E2BB882DE9BD53598B8A4B5D3886183A37E5731175B4615E8772521A8990B072`.
- Food: `Food.html`, 72,934 bytes, SHA-256 `0F15DD3C493B471572D3AD417EDCA6356B691C6D8247E624314871FFBC6F2390`.
- Inventory and Pantry: `INVENTORY.html`, 68,867 bytes, SHA-256 `107F447E9AEF8D3B9A377B5D059A745807E744833272E02D55150C5ED30FBF19`.
- Materials: actual supplied file `MATERIALS.html`, 90,871 bytes, SHA-256 `0C7B82D130470772C1045DC53A3C1810155B15274CF173C3453FBBB6D1BD09E5`; resolve the older `MATERIALS(2).html` name discrepancy in Phase 2 without guessing.
- v0.5 baseline reference: `HAU-USC_Logistics-BASELINE.html`, 411,048 bytes, SHA-256 `B65D717F22FD085ACAA19D847CA827964F891374E1A03B9D0578ADD5BA833580`.
- Ingestion rule: Phase 2 reads S0003 fully first and records `.codex/DESIGN_REFERENCE_DIGEST.md`; read a role reference only when implementing that role.

## Remaining Phase 1 risks and intentionally unrun checks

- The in-memory account/session/reset repository and sliding-window limiter are synthetic adapters only. They prove the portable service contract but are not distributed production infrastructure.
- Phase 3 still owns reviewed Worker/D1 repositories and transactions, distributed rate limiting, transport wiring, secrets/configuration, migration/reconciliation, hardening, and deployment proof.
- No live Cloudflare Worker/D1, Apps Script, Sheet, Drive, institutional-account, migration, deployment, or production check ran in Phase 1. Phase 2 must treat the authentication API as a locked contract, not as a deployed service.

## Latest checkpoint — v0.6 account-portable Codex continuity bootstrap

- Date: `2026-07-21` (`Asia/Manila`)
- Repository: `invicta-ctrl/hau-usc-logistics-management-system`
- Active continuity branch: `chore/v0.6-codex-continuity-bootstrap`
- Preserved launch-readiness predecessor: `81efe82618048b79a821f93bd95a0be00eaeff43`
- `main` / merge-base checkpoint at continuity setup: `91a30ee2de015bce1471a2d4fd71d9325af3e936`
- Preserved predecessor relationship: `63` commits ahead / `0` behind `main`
- Historical PR #2: **closed and not merged**
- Historical branch `feat/apps-script-backend-and-launch-readiness`: not present as a remote branch when continuity setup began
- Known staging deployment inherited from the preserved predecessor: immutable Version 9
- Production state: untouched

### Why this checkpoint exists

The project is being continued from a fresh Codex/ChatGPT context. The previous implementation must therefore be recoverable from Git alone, without relying on the former agent's chat history.

The old launch-readiness branch ref was no longer present, but its final known commit still existed. That commit was verified against `main` and used non-destructively as the base of a new continuity branch so the 63-commit launch-readiness implementation is preserved.

### Repository continuity files added

- `.codex/CURRENT.md` — active operational pointer
- `.codex/BOOTSTRAP.md` — fresh-session recovery procedure
- `.codex/specs/v0.6-phase-1-sol-high.md`
- `.codex/specs/v0.6-phase-2-terra.md`
- `.codex/specs/v0.6-phase-3-sol-high.md`
- `.codex/specs/README.md`

`AGENTS.md` now requires the durable entry path:

`Git state -> AGENTS.md -> .codex/CURRENT.md -> active spec -> targeted status/source/tests`

### v0.6 phase routing

1. Phase 1 — **SOL High**: repository/baseline reconciliation, architecture, authentication, security contracts.
2. Phase 2 — **TERRA**: shared UI, five role experiences, Request Center, Lending Hub, operational implementation, responsive previews.
3. Phase 3 — **SOL High**: integration, Cloudflare/D1 migration, Google sidecars, hardening, final repository acceptance.

Do not advance because an account/chat changes. Advance only after the active phase has a verified repository handoff and `.codex/CURRENT.md` is updated.

### Verified remote evidence at continuity setup

- Commit `81efe82618048b79a821f93bd95a0be00eaeff43` exists.
- Comparison against `main` showed 63 commits ahead and 0 behind.
- GitHub workflow runs associated with that checkpoint completed successfully for both `CI` and `Apps Script static check`.
- PR #2 was verified closed and unmerged.
- Searching for the former feature branch ref returned no remote branch.
- The new continuity branch was created from the preserved predecessor; no reset, force-push, deletion, or destructive history rewrite was performed.

### Files changed in this continuity checkpoint

- `AGENTS.md`
- `PROJECT_STATUS.md`
- `CHANGELOG.md`
- `docs/WORK_CONTINUATION.md`
- `.codex/CURRENT.md`
- `.codex/BOOTSTRAP.md`
- `.codex/specs/README.md`
- `.codex/specs/v0.6-phase-1-sol-high.md`
- `.codex/specs/v0.6-phase-2-terra.md`
- `.codex/specs/v0.6-phase-3-sol-high.md`

### Runtime/code impact

None.

This checkpoint does not change application source, generated artifacts, Apps Script source, dependencies, Google Sheets, Drive, staging deployment, migrations, triggers, access rows, or production state.

No new runtime suite is claimed for these documentation/specification-only commits. The unchanged application implementation retains the predecessor's verified test/CI evidence; the next Codex task must still perform the required Git handshake and verify the actual local checkout before implementation.

### Documentation reconciliation note

Historical 0.4.0 records below say PR #2 is open/draft and reference the old feature branch. Those statements are preserved as historical evidence but are stale for current PR/branch state.

Current v0.6 work must use `.codex/CURRENT.md` plus freshly verified GitHub state rather than executing an old “next action” blindly.

### Exact next action

Start a **fresh Codex task** at the Git root and remain **READ / VERIFY / REPORT only**.

Read in order:

1. `AGENTS.md`
2. `.codex/CURRENT.md`
3. `.codex/specs/v0.6-phase-1-sol-high.md`
4. required status/continuation/architecture files specified by `AGENTS.md`

Then:

- report repository root, branch, HEAD, upstream, and `git status --short`;
- `git fetch origin --prune` when network is available;
- compare local/upstream;
- verify the preserved launch-readiness history;
- reconcile stale branch/PR documentation;
- determine the safe v0.5/v0.6 baseline integration path;
- report whether Phase 1 implementation is authorized before editing application code.

### Hard stops

- Do not start v0.6 from stale `main` if that would discard the preserved launch-readiness history.
- Do not reset, clean, discard, force-push, or overwrite unknown work.
- Do not deploy Apps Script or create another staging version from this continuity checkpoint.
- Do not perform operational Sheet/Drive writes, access seeding, migration application, trigger changes, or production actions.
- Do not begin Phase 2 until Phase 1 produces a verified handoff and advances `.codex/CURRENT.md`.

---

## Integrated v0.5 baseline continuation evidence

## Current resume block

- **Repository/worktree:** `D:\Documents\HAU-USC Logistics\active\hau-usc-logistics-management-system`; single authoritative checkout.
- **Branch/HEAD/upstream:** `integration/v0.5-baseline`; source checkpoint `24ef0b9d435eca1522e9b72dc449167453266618` is pushed at parity and PR #7 checks are green.
- **Current phase/stage:** `SLICE_13_GATE_E_PARTIAL_DISTINCT_TEST_IDENTITIES_REQUIRED`; Gates A-D pass and Gate E remains partial.
- **Accepted scope:** owner-approved Gate B-F execution against the named private current demo; production, PR merge, hosting, and database remain outside this slice.
- **Completed work:** private authorization through Gate F; read-only preflight; launch backup; schema/Drive/migration-dry-run/reconciliation/triggers; exact source push/pull; isolated Version 26; safe synthetic access seed; duplicate-ID repair; revocation proof; canonical authorization v2 activation; trace/privacy/performance/private-owner load acceptance; six-width live compatibility; bounded near-live rollback; and one namespaced request submitted for review with no stock movement.
- **Files changed by purpose:** the progressive bootstrap read DTO applies the established fail-closed legacy handling/lending mapping; the runtime extension contains the mobile Reference Administration decoration/header at 320 px; focused regressions cover both. Private IDs, contacts, configs, and evidence remain outside Git.
- **Tests verified at current SHA:** source checkpoint `24ef0b9` passes `npm run check` with 39 Vitest files / 323 tests, build, 33 Apps Script sources / 55 functions, deterministic generated parity, standalone verification, guided demo, seven module shareables, and full Playwright. PR #7 `validate`, `verify`, and `browser-smoke` pass.
- **Generated artifacts:** `dist/index.html` is 411,309 bytes / SHA-256 `461efc9cfa504e9f94134863e1c13488203bea829ca7cebe12fc1a58e930acca`; Apps Script `AppStyles.html` is 30,203 bytes / SHA-256 `c65128770015110c1bc894386cab61337659bbb0b3af6ccea6dcbea8ca8458d0`; Apps Script client remains SHA-256 `4c5cc56134c30a1b746c44b5a4fd33bb80b862e22925fc8cf92cb9b52878abe2`.
- **Remote evidence:** 39/39 exact pull-back parity, owner-only manifest, isolated repair Version 26, accepted current demo recovered to Version 13, distinct verified backup Version 12, five reconciled access rows, zero duplicate IDs, four mapped active rows, and one inactive synthetic row. All six exact widths pass in the in-app browser; two near-live sessions were restored to manual-only; exact sync latency, multi-browser, and manual accessibility rows remain unsigned. Version 18 is retained as incident evidence only.
- **External actions:** staging-only actions above occurred. No operational review/reservation/receipt/release/lending/evidence-upload after the blocker; the accepted pointer moved only for documented recovery from Version 18 to Version 13; no production, merge, `main`, hosting, or database action.
- **Preservation:** accepted Phase 3.5 archive tags and verified full-ref bundle remain unchanged; no private configuration entered Git; immutable audit/history rows are retained.
- **Rollback:** accepted Version 13 is current and immutable Version 12 is the separately verified backup. Stop writes and preserve all append-only rows; do not delete the synthetic request, audit, history, access, or Version 18 incident evidence.
- **Blocker:** one authenticated `ADMINISTRATOR` cannot satisfy operational reviewer capabilities or approve its own permission expansion. Obtain a distinct signed-in institutional DOL operational test identity and a distinct access-review identity; do not bypass self-escalation or separation of duties.
- **Windows note:** private staging candidate files remain outside Git under the consolidated `private-config` root; do not copy or print their values. The obsolete `D:\Documents\DOL Website GitHub` compatibility shell is unrelated.
- **Next three actions:** add the two distinct institutional test identities; rerun AUTH-01/FUNC-01 and the remaining Gate E rows on isolated Version 26 while keeping near-live manual-only; promote the candidate only after every must-pass row is signed.
- **Resume commands:** `git status --short --untracked-files=all`; `git rev-list --left-right --count 'HEAD...@{upstream}'`; `gh pr checks 7`; validate the private authorization package; resume from the private Gate E checkpoint without repeating Gates B-D.
- **Prohibited actions:** no self-role override, direct capability grant, reviewer impersonation, deletion of append-only evidence, non-recovery accepted-pointer move before Gate E/F, PR merge, history rewrite, production, hosting, or database action.

## Current checkpoint - Slice 6 committed, pushed, and CI verified

- Date: `2026-07-15` (`Asia/Manila`)
- Repository root: `D:\Documents\DOL Website GitHub`; branch: `feat/live-sync-lending-search-catalog-controls`; approved starting checkpoint: `6548ca23f5d46b5afe40e592a3833de548b18574`; upstream: `origin/feat/live-sync-lending-search-catalog-controls`; rollback tag: `hau-usc-slice6-start-6548ca2`.
- Current stage: `SLICE_6_COMMITTED_PUSHED_CI_GREEN_PENDING_MANAGER_REVIEW`. Implementation commit `813f6b8f01b975e0952f553dc1bde4e3bc90fe0a` is pushed; local, upstream, and PR #6 heads matched; local/upstream count was `0 0`; and the worktree was clean before this documentation checkpoint.
- Scope delivered: feature-flagged Composite Event Logistics request foundation only - Food, Materials, and Venue & Equipment parent/child hierarchy, validation, duplicate consolidation, atomic/idempotent creation, independent lifecycle, parent derivation, cancellation/reopen/amend/add-section, assignment/escalation boundaries, history, audit, and requester-scoped reads. Slice 7 specialization and all later slices remain gated.
- Local evidence: lint passed; Vitest passed with 24 files / 203 tests; `npm run verify` passed with 29 Apps Script sources / 47 required functions; full Playwright passed 61 / 101 intentional skips / 0 failed across 162 cases; focused composite browser smoke passed; and `git diff --check` passed. Independent implementation review is PASS after the mock concurrent-mutation repair.
- Generated evidence: `dist/index.html` and `HAU-USC_Logistics-Prototype-Shareable.html` are 293,406 bytes each / SHA-256 `f9592c86f6e63377b82d656333b64188dea0c4284f2b23108cecb2dfd0866558`; `apps-script/Index.html` is 766 bytes / SHA-256 `9615ba949ac8479ed6b8057c6561370eedcdda0db997f238ef4c631b727a47de`; split outputs pass deterministic parity.
- Remote evidence: Apps Script static check run `29377313232` passed `validate`; CI run `29377313250` passed `verify` and `browser-smoke`; PR #6 remained open and draft at the exact implementation head.
- Privacy/external boundary: changed additions contain no newly introduced credentials, `.clasp` content, private Google identifiers, roster/student records, private contacts, supplier TINs, or evidence links/files. No Sheet/Drive/Apps Script external write, Script Property change, migration, or deployment occurred. `clasp status` and `clasp push --dry-run` remain unrun because no staging script is configured.
- Owner-confirmed Phase 2 `.codex` configuration files were preserved at `D:\Documents\DOL Website GitHub Backups\HAU_USC_CODEX_PHASE2_PRESERVATION_20260715-074959`; each archived SHA-256 matched its source before the untracked originals were removed. They were not included in Slice 6.
- Rollback: disable `HAU_COMPOSITE_REQUESTS_ENABLED` for new submissions; retain created records for read continuity; if code rollback is required, use a focused revert to `hau-usc-slice6-start-6548ca2` without resetting or discarding unrelated work.
- Next action: manager review of pushed commit `813f6b8f01b975e0952f553dc1bde4e3bc90fe0a` and its green CI evidence. Do not deploy, migrate, change external configuration, begin Phase 2, or start Slice 7 before acceptance.

## Current checkpoint - Slice 5 committed, pushed, and CI verified

- Date: `2026-07-14` (`Asia/Manila`)
- Branch: `feat/live-sync-lending-search-catalog-controls`
- Approved Slice 5 starting checkpoint: `89a7accdf0bcd3e3d080bcde5ad2e8874ba7d03e`; upstream: `origin/feat/live-sync-lending-search-catalog-controls`; local/upstream count at scope lock and after push: `0 0`; remote head and PR #6 head match implementation commit `a1784f15bc6a160ebf3c2405e9776b6517ce52e5`.
- Current stage: `SLICE_5_COMMITTED_PUSHED_CI_GREEN_PENDING_MANAGER_REVIEW`. The worktree was clean after the implementation commit; this documentation checkpoint records the required handoff files only.
- Scope delivered: one server-scoped capability-aware Committee Main Hub, active committee context, bounded queue/count/detail projections, safe history/audit activity, recent completions, quick links, freshness/manual refresh state, and canonical active-context propagation to existing inventory-family module reads.
- Queue defaults recorded for this repository slice: due soon 7 days, upcoming needs 14 days, recent completions 30 days, and at most 100 returned record identifiers per queue. Exact owner queue definitions, institutional timezone boundary samples, and safe staff-display policy remain later staging inputs.
- Local evidence: `npm run check` passed with 22 Vitest files / 183 tests, build, Apps Script validation (28 source files / 38 required functions), generated parity, and standalone verification; `npm run verify` passed; full Playwright passed 56 with 100 skipped and 0 failures across 156 cases; `git diff --check` passed; the changed-source sensitive scan passed with zero matches across all protected categories; independent review was PASS.
- Generated evidence: standalone HTML artifacts are 282,306 bytes each / SHA-256 `fe937a21807ee12dad4317b0ac3945d7a5ecf0a1389a6b307226a655db0f248d`; `apps-script/Index.html` is 681 bytes / `342dd291abea325d54a69646ea717abd5942397504302b780042574cfd7a1af8`; the split Apps Script bundle passed deterministic parity.
- Implementation commit: `a1784f15bc6a160ebf3c2405e9776b6517ce52e5` (`feat: add committee main hub dashboard`); pushed with PR #6 `validate`, `verify`, and `browser-smoke` green. Local rollback tag: `hau-usc-slice5-start-89a7acc`.
- No deployment, Script Property change, trigger activation, Sheet/Drive write, migration, private operational-data access, or production change occurred. `clasp status` and `clasp push --dry-run` were intentionally not run because no staging script is configured. The accepted Phase E staging state remains the prior dependency baseline; Slice 6 is gated on manager review.

## Current checkpoint - Slice 4 committed and CI verified

- Date: `2026-07-14` (`Asia/Manila`)
- Branch: `feat/live-sync-lending-search-catalog-controls`
- Approved Slice 4 starting checkpoint: `a3fffb91eee5d06b3a41acc0876bf0f7f227c891`; upstream: `origin/feat/live-sync-lending-search-catalog-controls`; local/upstream count at scope lock was `0 0`; remote head matched the starting checkpoint.
- Current stage: `SLICE_4_COMMITTED_PUSHED_CI_GREEN_PENDING_MANAGER_REVIEW`. The worktree is clean and contains the bounded Slice 4 implementation, tests, and required documentation updates.
- Implementation commit: `113b6002eb7b4e713b518c4e4fd5afa6c2aca1df` (`feat: add private roster sync and access freshness`); pushed to the feature branch with local/upstream count `0 0`.
- Phase D compatibility-mode acceptance passed on immutable staging Version 17 with bootstrap contract v1 and authorization contract v1/absent. Version 13 is the preserved rollback target. The reviewed 32-file package matched remotely, the web-app manifest was preserved, the existing staging deployment served Version 17, and non-target deployments were unchanged. A fresh timestamped staging backup was verified before the push.
- Live v1 checks passed for the diagnostic route, authorized internal workspace, request-only portal, desktop cold/warm startup, mobile startup, and legacy v1 endpoint. Request-only content remained sanitized and empty of internal operational lists; no operational mutation was performed.
- Accepted Phase E evidence reports immutable Version 18 with `HAU_BOOTSTRAP_CONTRACT_VERSION=2`, authorization contract v1/absent, a ready v2 internal workspace, and passing diagnostic/request-only privacy checks. The former approximately 40-second read-only module callback exceeded the old 30-second client deadline; `api_getBootstrapModule` now uses a bounded 60-second deadline while mutations and all other calls remain at 30 seconds.
- The staging handoff reports 32-file pull-back parity and preservation of the owner-only web-app manifest. Version 13 remains the rollback target. The live staging evidence was accepted from the supplied handoff and was not re-fetched in this session because the local Chrome bridge was unavailable.
- Local gates after the fix passed: `npm run check` (20 Vitest files / 164 tests), `npm run verify`, full Playwright (50 passed / 100 skipped / 0 failed across 150 cases), `git diff --check`, generated parity, and the sensitive-value scan. Independent review was reported as PASS.
- Slice 4 adds the exact private-roster source boundary, safe source validation, explicit approval/disable/freshness controls, access and committee-membership last-known-good snapshots, emergency deny, safe health output, and zero source reads during ordinary startup. The private source ID and all source contents remain external Script Property/Sheet state and are not present here.
- Local evidence: `npm run check` passes with 21 Vitest files / 177 tests, build, Apps Script validation, generated parity, and standalone verification; `npm run verify` passes; full Playwright passes 50 with 100 intentional skips and 0 failures across 150 cases; `npm run lint`, `git diff --check`, and the changed-scope sensitive scan pass. Independent implementation review found no blocking issue. Commit `113b6002eb7b4e713b518c4e4fd5afa6c2aca1df` is pushed and PR #6 CI is green.
- No schema migration, trigger activation, deployment, Google Sheets/Drive write, private operational-data access, or production change was performed. Rollback checkpoint: local tag `hau-usc-slice4-start-a3fffb9`.
- PR #6 `validate`, `verify`, and `browser-smoke` checks are green for the implementation commit; the only annotation is the repository’s non-blocking Node.js deprecation warning. Manager review of the exact diff and evidence is the next gate before Slice 5.
- Safe rollback remains: set the bootstrap contract back to its effective v1 setting and, if needed, point the existing deployment to immutable Version 13; preserve all versions and the backup.

## Historical checkpoint - Slice 3 canonical roles, committee scopes, and authorization contract

- Date: `2026-07-14` (`Asia/Manila`)
- Branch: `feat/live-sync-lending-search-catalog-controls`
- Approved starting commit: `23c4f61e5f1b113d4b77c2955f1716139a03c121`
- Upstream: `origin/feat/live-sync-lending-search-catalog-controls`
- Current stage: `PENDING_MANAGER_REVIEW`; the bounded Slice 3 implementation is committed, pushed, and the worktree is clean.
- Handshake: fetch completed, local/upstream count was `0 0`, remote head matched the starting commit, and no competing writer or repository lock was found.
- Implementation commit: `5107afc57904dccc5214fcafc20aba65c0622632` (`feat: add canonical authorization contract`); rollback tags `hau-usc-slice2-checkpoint-23c4f61` and `hau-usc-slice3-checkpoint-5107afc` are present.
- Remote/CI evidence: branch and PR #6 head match the implementation commit; `validate`, `verify`, and `browser-smoke` pass; local/upstream count is `0 0`; `git status --short` is empty.

### Delivered locally

- Added the canonical server authorization registry, six role IDs, exactly three committee IDs, capability/scope decisions, safe denial reasons, and fail-closed mapping status.
- Added additive access and membership schema fields, a versioned authorization rollout property, mapping dry-run reporting, and an explicit approval-gated additive apply path.
- Added sanitized authorization metadata to essential/bootstrap current-user DTOs, strict browser validation, server-capability client projection, and catalog-control integration.
- Regenerated visual/standalone artifacts through the repository generator and build path; no generated file was hand-edited.

### Evidence and boundary

- Owner-auto-accepted defaults and the reconciliation contract are recorded in `docs/AUTHORIZATION_CONTRACT.md`.
- `npm run lint`, full Vitest (20 files / 151 tests), `npm run build`, and `npm run check:apps-script` pass.
- Final local evidence is green: `npm run check` passes with ESLint, 20 Vitest files / 161 tests, production build, Apps Script validation (26 source files / 32 required functions), generated parity, and standalone verification; `npm run verify` passes; full Chromium passes 49 with 95 intentionally skipped and 0 failed across 144 cases; and `git diff --check` passes.
- The sensitive-value scan passes with no `.clasp` files, credentials, private Google identifiers, non-placeholder contacts, private supplier-TIN values, evidence links, roster rows, or operational records in the changed scope; regenerated standalone files retain only the pre-existing fictional preview baseline. Initial independent-review findings were repaired and covered by focused tests; the implementation-validator found no blocking issue; no re-review PASS is claimed because the second reviewer did not return before handoff.
- Generated parity: standalone artifacts are 274,038 bytes each / SHA-256 `3646b8b799cecc954c3226580ca0a173da1b2cd61e94740b485597ebaaf11fa9`; Apps Script `Index.html` is 681 bytes / `342dd291abea325d54a69646ea717abd5942397504302b780042574cfd7a1af8`, and `AppScript.html` is 214,742 bytes / `986b0e4e5148172936ad5e680c0dd8400f5b13ff19c694e2187a7863b4bb8a2e`.
- No roster import, committee UI, composite request, catalog, restock, polling/live-update, hosting, database, migration, deployment, staging/production, Google Sheets/Drive write, or private operational-data work was performed.

### Rollback and next stage

- Local rollback tag: `hau-usc-slice2-checkpoint-23c4f61` at `23c4f61e5f1b113d4b77c2955f1716139a03c121`.
- Preserve the current worktree; after commit use a focused revert if rollback is required. Do not reset or discard work.
- The focused implementation unit is verified remotely. Obtain manager acceptance before beginning Slice 4; do not repeat the commit, local gates, or push.

## Current checkpoint - Slice 2 essential bootstrap and lazy module contracts

- Date: `2026-07-14` (`Asia/Manila`)
- Branch: `feat/live-sync-lending-search-catalog-controls`
- Approved starting commit: `8b40f60a48323065ad69517e37915a33f32a51d2`
- Upstream: `origin/feat/live-sync-lending-search-catalog-controls`
- Current stage: `PENDING_MANAGER_REVIEW`; implementation, repairs, final local gates, push, and PR CI are complete.
- Handshake: worktree clean, local/upstream `0 0`, remote head is `576393f1be28687d984ea7632a2501aa8d3fc30d`, and no competing writer was found.

### Slice 2 implementation

- Added the versioned `essential-bootstrap` and `bootstrap-module` contracts with strict allowlists, JSON-safety checks, sensitive-field rejection, pagination bounds, request-only enforcement, and legacy-compatible state merging.
- Added Apps Script essential/module APIs beside the existing bootstrap endpoint. Repository reads are deduplicated within one request, and the browser controller deduplicates in-flight reads, cancels stale responses, and caches only bounded public-reference projections.
- Added the reversible runtime flag and generated-runtime path: `HAU_BOOTSTRAP_CONTRACT_VERSION` defaults to v1 and explicit v2 loads essential bootstrap followed by the active module; version 1 retains the compatibility endpoint.
- Added final UTF-8 payload-byte measurement with a 100 KiB server bound, bounded page/filter handling across module collections, and fail-closed explicit entity-scope filtering for committee-scoped sessions.
- Added synthetic contract, cache, cancellation, adapter, Apps Script VM, and packaged Chromium coverage. Generated outputs were rebuilt through the repository generator/build path.

### Scope and external boundary

- No committee, roster, composite-request, catalog, restock, polling/live-update, hosting, database, migration, deployment, staging/production, Google Sheets/Drive/Apps Script external write, or private operational-data work was performed.
- `clasp status` and `clasp push --dry-run` remain unrun because no staging script was configured for this local checkpoint.

### Current evidence and next transition

- `npm run check` passed with 18 Vitest files / 143 tests; `npm run verify` passed; focused packaging passed 15/15; full Playwright passed 49 with 95 intentionally scoped skips and 0 failures across 144 cases. Initial independent-review FAIL findings were repaired. A current-snapshot re-review returned WARN/incomplete, so no re-review PASS is claimed.
- Sensitive scan and generated parity pass. The focused implementation commit is `576393f1be28687d984ea7632a2501aa8d3fc30d`; draft PR #6 is open and `validate`, `verify`, and `browser-smoke` pass. Obtain manager acceptance before any new milestone; do not deploy or broaden the scope.

## Latest checkpoint — P0 Production Bootstrap Diagnosis and Recovery

- Date: `2026-07-14` (`Asia/Manila`)
- Repository branch: `feat/live-sync-lending-search-catalog-controls`
- Approved starting commit: `2a9ac342ca584257e0bbf6ea09ffb9d4f892a7c7`
- Upstream: `origin/feat/live-sync-lending-search-catalog-controls`
- Ending commit: this focused P0 implementation commit; exact SHA is reported after commit
- Worktree policy: the accepted planning-document commit was the only ahead commit at start; no push was performed

### Delivered

- Contained the complete read-only bootstrap startup sequence inside one controller boundary with explicit request, response validation, normalization, static options, extensions, bindings, first render, post-render, and ready stages.
- Added supported-envelope validation before normalization, safe synthetic fixtures, server-side JSON-safe serialization coverage, client stage timings/counts, an eight-second slow state, one active attempt, Retry reset, and obsolete callback protection.
- Added an accessible loading failure surface with plain-language copy, safe support code, live-region semantics, keyboard focus on Retry, and an idempotent success/failure finalizer.
- Regenerated the visual runtime and additive loading styles from the preserved legacy baseline. No generated HTML was hand-edited.

### Local evidence

- `npm ci`: passed.
- `npm run check`: passed; full Vitest 15 files / 118 tests, Apps Script package/static checks, generated parity, and standalone verification passed.
- Focused packaged Apps Script Chromium suite: 14 passed at 390 px, including slow-state and rapid Retry coverage.
- Complete Playwright matrix: 138 cases across 320, 390, 768, 1024, 1366, and 1440 px projects; 48 passed, 90 scoped skips, 0 failed.
- Synthetic local static shell measurement: visible in 81 ms at 390x844; this does not establish staging or production p95.
- No `clasp` command, push, deployment, Sheet/Drive write, or other external action was performed.

### Remaining unknowns and rollback

- Live Apps Script timing, HTML Service behavior, deployment response shape, and production-volume behavior remain unverified because staging and production were not touched.
- If this commit is later integrated, revert the single focused implementation commit. If later deployed under separate authorization, move only the deployment pointer back to the preceding immutable version; no external records require rollback from this checkpoint.

### Next action

Manager review of the exact diff and local evidence. Do not push or begin another milestone until separately authorized.

## Latest working checkpoint — Version 0.5.0 live sync, lending search, and catalog controls

- Date: `2026-07-13` (`Asia/Manila`)
- Repository: `invicta-ctrl/hau-usc-logistics-management-system`
- Branch: `feat/live-sync-lending-search-catalog-controls`
- Starting commit: `81efe82618048b79a821f93bd95a0be00eaeff43`
- Ending commit: this handoff commit; exact SHA is reported after commit and push
- Base pull request: draft PR #2 remains open and unmodified by this milestone
- Current staging deployment: immutable version 9 on the existing deployment ID
- Production state: untouched

### Repository behavior prepared

- Apps Script mutations now require a successful authoritative bootstrap reload before the browser renders success. The mutation is never automatically resubmitted if that read fails; the UI reports that the action was recorded, includes a correlation ID when available, and offers a safe Refresh action.
- Internal clients poll the compact `api_getDataRevision` endpoint every five seconds only while visible, online, and not already checking. Visibility restoration, focus, reconnect, and manual Refresh cause immediate checks. Repeated failures use bounded backoff. This is polling, not WebSockets.
- `DATA_REVISION` and `DATA_REVISION_UPDATED_AT` in `17_CONFIG` form a monotonic shared revision. A successful non-replay mutation advances it exactly once; read-only bootstrap/search/health/diagnostic calls do not.
- `handleOperationalSheetEdit(e)` advances the revision for relevant direct edits to the configured operational spreadsheet. `setupOperationalEditTrigger()` is idempotent and must be run explicitly in each environment after review.
- Dirty forms, request drafts, pending uploads, and open modal workflows defer background reload and show “New operational data is available” with Refresh now and Continue editing choices.
- The Lending Hub uses an accessible predictive search instead of the hundreds-item select. Typed but unselected text cannot submit, and unavailable, out-of-stock, VERIFY, staff-only, non-circulating, quantity-limited, and no-match states remain distinguishable.
- Handling and audience are separate. `CONSUMABLE` completes on handoff without a return due date; `LOANABLE` and `REUSABLE_ASSET` require a future due date and return workflow; `NON_CIRCULATING` is blocked. Audience is `NOT_AVAILABLE_FOR_LENDING`, `USC_STAFF_ONLY`, `STUDENTS_AND_STAFF`, or future-ready `DOL_INTERNAL_ONLY`.
- Website catalog controls call server APIs for item lookup, creation, metadata/storage editing, archive, and restore. Server authorization, lock, idempotency, server IDs, before/after audit, status history, and append-only quantity rules remain authoritative.
- Unit changes are blocked when historical or active ledger, reservation, lending, request, restock, or release records depend on the item. Archive requires zero on-hand, zero active reservation, and no open lending/request dependency. Restore preserves history and returns verification-marked items to `VERIFY`.
- `Can_Manage_Catalog` is appended to `14_USERS_ACCESS`. Blank cells retain catalog permission only for ADMIN and DOL_DIRECTOR; other roles require explicit true.

### Additive schema preparation

- `01_ITEM_MASTER` appends `Catalog_Type`, `Storage_Location`, `Reorder_Threshold`, `Lending_Audience`, `Default_Loan_Days`, `Maximum_Loan_Qty`, `Approval_Required`, `Updated_At`, `Updated_By`, and `Notes` after all prior columns.
- `14_USERS_ACCESS` appends `Can_Manage_Catalog`.
- `17_CONFIG` receives `DATA_REVISION` and `DATA_REVISION_UPDATED_AT` rows when missing.
- Repeated `setupDatabase()` runs add only missing columns/rows and preserve existing values, legacy tabs, Drive configuration, users, audit history, and operational data.
- Blank legacy defaults fail closed: active circulating items become staff-only unless explicitly reviewed; VERIFY, inactive, archived, and non-circulating items remain unavailable; returnable items default to three loan days; maximum ticket quantity defaults to one; approval defaults to true.

### Repository verification

- `npm ci`: passed.
- ESLint: passed.
- Vitest: 12 files / 93 tests passed.
- Focused 0.5.0 Chromium suite at 390 px: 4 passed.
- `npm run check`: passed, including a 22-module Vite build, Apps Script validation across 24 source files and 27 required entry points, generated-file parity, and standalone verification.
- `npm run verify`: passed.
- Complete Playwright/browser matrix at 320, 390, 768, 1024, 1366, and 1440 px: 38 passed, 40 intentionally scoped skips, 0 failed.
- A second build was byte-deterministic: both 238,891-byte standalone artifacts retained SHA-256 `8192ddff053f9776ba41f74be4eadf9c627b6db638db0cf7f8b6cf03d410ed8f`; the 615-byte Apps Script shell retained SHA-256 `e31ed283e193703ec5a403e3b9d40ba504d17f57a3dc2eb02424741f1aa73495`.

### External actions

- No `clasp push` was run.
- No immutable Apps Script version was created.
- No deployment was updated.
- No Google Sheet or Drive write was performed.
- No live trigger was created, changed, or removed.
- Production was not touched.
- PR #2 was not modified, merged, or deleted.

### Deployment handoff after separate authorization

Staging order: verify the reviewed commit and full checks; create a staging schema backup; compare/push the reviewed package; run additive `setupDatabase()`; run idempotent `setupOperationalEditTrigger()`; validate schema, Drive, permissions, and revision rows; run functional and privacy acceptance; then create an immutable staging version and update the existing deployment ID. Production order: obtain owner approval; create a fresh production backup; push the exact accepted commit; run the additive schema migration and edit-trigger setup before activating the web version; validate schema/Drive/access; create and activate an immutable production version; then run bounded acceptance.

Rollback changes only the deployment pointer to the preceding immutable version. Do not delete the appended columns, revision rows, audit/history/ledger records, or migrated metadata. The additive schema remains backward-compatible with Version 9. If the edit trigger itself is implicated, stop writes, preserve evidence, and remove or disable it only with explicit owner authorization.

### Next action

Review the pushed handoff commit and CI state, then obtain manager approval before any staging work or new milestone. Do not deploy, migrate a live Sheet, install a live trigger, or start a new milestone without separate explicit authorization.

## Historical checkpoint — Version 9 live privacy acceptance and runtime-truthfulness repair

- Date: `2026-07-13` (`Asia/Manila`)
- Repository: `invicta-ctrl/hau-usc-logistics-management-system`
- Branch: `feat/apps-script-backend-and-launch-readiness`
- Starting commit: `d8b7e784ceb4207162507e95b3ceef0fb3845873`
- Runtime-truthfulness commit: `7156c256414b797f4b0f19431b399009f31feebd`
- Pull request: draft PR #2, open, mergeable, and unmerged
- Current staging deployment: immutable version 9 on the existing deployment ID
- Production state: untouched

### Live Version 9 acceptance

- The staging diagnostic passed body rendering, style application, inline-script execution, and the harmless server-call check.
- Authorized internal `/exec` rendered the full workspace and cleared the loading overlay.
- Request-only `/exec?request=1` rendered only the requester portal.
- Request-only mode exposed no internal navigation, exact inventory balances, ledger, release desk, supplier internals, users, or administrative controls.
- No operational Google Sheet or Drive workflow was performed.

### Runtime-truthfulness repair

- `doGet(e)` resolves the trusted Script Property environment and passes it to the evaluated template.
- Generated body markup contains `data-request-only` and `data-app-environment`.
- Browser runtime configuration consumes the server-rendered environment.
- Visible Apps Script labels distinguish staging from production.
- Local mock mode retains `Preview mode · local data` and `Reset Demo Data`.
- Apps Script mode hides and disables Reset Demo Data, removes it from keyboard focus, and does not attach its click handler.
- The server-side/mock reset guard remains in place.
- CRLF normalization prevents Windows visual extraction from dropping existing runtime bridges.
- Request-only privacy behavior remains unchanged.

### Verification

- Focused tests: 2 files / 14 tests passed.
- `npm run check`: passed with 10 Vitest files / 69 tests, Vite build, Apps Script static validation, deterministic package checks, and artifact verification.
- Standalone artifacts: 210,112 bytes each.
- `npm run test:e2e`: 29 passed, 25 intentionally skipped, 0 failed.
- GitHub Apps Script static check run 52: passed.
- GitHub CI run 52: passed.

### External actions

- No `clasp push` was run.
- No Version 10 was created.
- No deployment was updated.
- No Sheet or Drive operational write occurred.
- Production was not touched.
- PR #2 was not merged.

### Historical next action

The repository review and CI gate were complete. The then-next bounded milestone was one explicitly authorized Version 10 staging deployment of commit `7156c256414b797f4b0f19431b399009f31feebd`, preserving the current deployment ID and performing no operational Sheet or Drive writes. This action is now historical and is **not automatically authorized** by the v0.6 continuity bootstrap.

## Previous verified checkpoint — Version 8 request-only privacy failure; repository repair pending deployment

- Date: `2026-07-12` (`Asia/Manila`)
- Repository: `invicta-ctrl/hau-usc-logistics-management-system`
- Branch: `feat/apps-script-backend-and-launch-readiness`
- Pull request: draft PR #2, open, mergeable, unmerged
- Packaging-repair code checkpoint: `74f2f0f342bc9513681693be0fd542cf1f4d923a`
- Documentation checkpoint before this update: `09acfd63c854c3d1844f39a7bee080be5542ad7d`
- Current staging deployment: immutable version 8 on the existing deployment ID
- GitHub Apps Script static check run 47: passed
- GitHub CI run 47: passed
- Production state: untouched
- External actions during controlled recovery: one effective 29-file staging push, immutable versions 7 and 8, and two updates of the existing staging deployment; no new deployment ID

Always verify the current remote head and CI. Documentation commits after the code checkpoint do not change the repaired application behavior.

## What was repaired

- Removed regular-expression extraction of JavaScript and CSS from `dist/index.html`.
- Built Apps Script body, CSS, and JavaScript from deterministic separate Vite outputs.
- Added a small `Index.html` template shell that includes complete generated style/body/script partials exactly once.
- Escaped case-insensitive raw-text closing sequences before embedding JavaScript or CSS in HTML.
- Added an HTML tokenizer/assembler used by generation, static validation, unit tests, and browser tests.
- Added generated-file hash/size/marker diagnostics and deterministic parity checks.
- Added regression fixtures for multiple script/style outputs, minified bootstrap identifiers, literal `</script>`, script-like template text, nested-wrapper prevention, and unchanged approved body markup.
- Added a real Chromium test that assembles the Apps Script page, injects a mocked `google.script.run`, reaches `api_getBootstrapData` exactly once, and confirms the loading overlay advances.
- Added a staging-only `DiagnosticShell.html` and harmless `api_htmlDiagnosticPing()`.
- Added admin-only `htmlTemplateDiagnostics()` that logs bounded lengths/prefixes/suffixes rather than the full generated application.
- Added failure-only CI artifacts so future failures retain concise logs without exposing secrets.

## Confirmed diagnosis

A deterministic regression fixture reproduced the visible-raw-JavaScript failure class: a literal raw-text closing sequence inside JavaScript closes the surrounding script element, and the remaining minified source becomes body text. The former build path was vulnerable because it parsed already-minified HTML with regular expressions and force-printed raw partials inside outer container tags.

The repaired generated package prevents that class of failure. The actual fixed package contains one application script element, one application style element, no nested wrappers, no unexpected Apps Script template delimiters in generated source, and no substantial JavaScript body text.

The exact live Version 6 exception remains partly unobservable because Apps Script omitted the oversized log. The repository does not prove that a literal `</script>` in the real Version 6 application bundle was the sole live cause. One controlled staging deployment was therefore required to confirm the HTML Service result.

## CI incident during implementation

Intermediate PR runs failed because the first visible-text detector treated the ordinary UI phrase `Lead-time class` as JavaScript `class` syntax. This was a test false positive, not a packaging regression. The detector now requires actual JavaScript-like punctuation and assignment/function/class structure. The browser check was also made network-independent by using `about:blank` plus `page.setContent()`.

## Exact verified results

At code checkpoint `74f2f0f...`:

- `npm run check`: passed in GitHub CI.
- ESLint: passed.
- Vitest: 10 test files / 67 tests passed.
- Vite build: passed; 17 modules transformed.
- Apps Script static validation: 23 `.gs` files / 18 required functions passed.
- Deterministic package parity: passed.
- Standalone artifact verification: passed; 209,742 bytes for each standalone artifact.
- GitHub browser smoke: passed across 320, 390, 768, 1024, 1366, and 1440 px projects.
- Verified generated Apps Script sizes:
  - `Index.html`: 512 bytes
  - `AppBody.html`: 28,967 bytes
  - `AppStyles.html`: 26,850 bytes
  - `AppScript.html`: 153,161 bytes
- Local packaging browser test with installed Chromium: 1 test passed.

No Playwright result is claimed from a local downloaded Playwright browser; the full matrix result above is from GitHub CI.

## Controlled staging deployment outcome

The initial approved `clasp push` command did not update Google Apps Script. With clasp 3.3.0, `push --dry-run` is unsupported and a non-interactive push prints `Skipping push` when `appsscript.json` changed and the manifest-overwrite prompt cannot be answered. Version 7 was consequently created from the old remote package.

Version 7 `/exec` reproduced `Exception: Malformed HTML content` and exposed minified application source in the error. A bounded `clasp pull` confirmed that the remote project still contained the pre-repair structure:

- `Index.html` wrapped raw includes inside outer script/style elements;
- remote `AppScript.html` and `AppStyles.html` contained raw source with zero wrappers;
- the local reviewed package contained complete script/style elements.

The existing remote `webapp` manifest block was preserved exactly. One authorized `clasp push --force` then pushed 29 files. A fresh remote pull matched all 29 local files and confirmed one script and one style wrapper. Immutable version 8 was created and the same staging deployment ID was updated to version 8.

Verified live version-8 results:

- `?diagnostic=1`: body rendered, style applied, inline script executed, harmless server call completed;
- authorized internal `/exec`: page rendered, loading overlay cleared, no raw JavaScript or malformed-HTML error, Apps Script staging adapter reached bootstrap;
- no Sheet/Drive workflow, setup, migration, backup, trigger, production, or PR-merge action occurred.

Remaining verified defect at that historical point: the visible internal header still said `Preview mode · local data` and showed `Reset Demo Data`. This was stale UI wording, not a mock fallback; the sidebar changed to `Apps Script staging` only after non-mock bootstrap and the reset handler refused to act outside mock mode.

## Request-only privacy incident and repository repair

Live Version 8 `/exec?request=1` rendered the full internal workspace. Staging workflow testing was stopped and access was not broadened.

Confirmed cause:

- `doGet(e)` correctly assigned `template.requestOnly` from `e.parameter.request`;
- the generated `Index.html` did not consume that template variable;
- the compatibility runtime read `location.search` inside the Google sandbox iframe;
- the iframe did not retain the outer `/exec?request=1` query, so the browser called `api_getBootstrapData({ requestOnly: false })`.

The repository repair:

- injects `data-request-only="<?= requestOnly ? 'true' : 'false' ?>"` into the generated body opening tag;
- resolves the marker during deterministic test assembly;
- makes the compatibility runtime trust `document.body.dataset.requestOnly` while preserving the local direct-query fallback;
- validates internal `false` and request-only `true` paths in unit, static, and real Chromium packaging tests.

The repair later passed live request-only acceptance in Version 9.

## Staging work already completed — do not repeat merely because context changed

- Dedicated staging Apps Script project creation
- Apps Script API enablement and local `clasp` authentication
- Required `STAGING` Script Properties
- `setupDatabase()` and schema validation
- Drive root/child folder setup and validation
- Migration dry-run
- Reconciliation
- Launch backup
- Trigger setup
- Earlier staging deployment versions used during the incident

## External-write boundary

Historical staging recovery/deployment actions above do not authorize any new `clasp push`, deployment version, access seeding, staging workflow write, production work, migration application, or PR merge.
