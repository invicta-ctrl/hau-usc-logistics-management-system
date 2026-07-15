# Project Status

## Current version

- Version: `0.5.0` (Slices 1-3 staging-accepted; Slices 4-7 and Phase 2 governance committed and CI-verified; Slice 8 locally accepted pending commit; Phase 3/3.5 consolidation complete; naming baseline finalized; production undeployed)
- Date: `2026-07-15`
- Branch: `integration/v0.5-baseline`
- Accepted Slice 8 starting commit: `290dc629fd9c0765bca39144224798c65b667eaa` (Slice 7 remote-verification documentation checkpoint)
- Current implementation checkpoint: Slice 8 is locally verified and independently accepted in the working tree; focused commit/push and PR #7 CI remain
- Packaging-repair code checkpoint: `74f2f0f342bc9513681693be0fd542cf1f4d923a`
- Pull request: draft PR #7, open and unmerged on `integration/v0.5-baseline`; PR #6 was closed automatically by GitHub during the branch rename and is retained as the audit trail
- Local/demo backend: `mock`
- Apps Script bundle mode: `apps-script` with explicit Script Property environment
- Current staging deployment: immutable Version 18 with bootstrap contract v2; Version 13 remains the preserved rollback target and exactly one WEB_APP entry point was verified
- Standalone artifact: `dist/index.html`
- Production deployment: **not performed**
- Live readiness: Phase E staging acceptance for Slices 1-3 passed; Slices 4-8 are repository-only; production remains untouched.

Always verify the current remote head and CI because documentation commits may follow the code checkpoint.

## Current Slice 8 - Materials Committee workflow

- Stage: `SLICE_8_IMPLEMENTED_VERIFIED_INDEPENDENT_PASS_PENDING_COMMIT` from
  accepted starting checkpoint `290dc629fd9c0765bca39144224798c65b667eaa`
  on `integration/v0.5-baseline`.
- Scope delivered: versioned controlled Materials category/specification,
  exact quantity/unit, required-by and usage, sourcing preference, live catalog
  validation, immutable legacy source provenance and amendment history, exact
  `ACTIVE`/category and `VERIFY` denial, one stock-or-procurement path,
  approved-substitution audit, blockers, path-matching evidence, completion
  rechecks, Materials-scoped queue/update, authorization/revision/idempotency,
  active UI, and fail-closed feature control.
- Verification: `npm run check` passes 30 Vitest files / 244 tests, a 31-module
  build, 31 Apps Script sources / 51 required functions, deterministic package
  parity, and two 329,544-byte standalone artifacts. Full Playwright passes
  61 / 101 intentional skips / 0 failures. The changed-scope sensitive scan and
  `git diff --check` pass. Independent final review is PASS with no findings.
- Generated evidence: standalone SHA-256
  `8c34bf25f14fc09b8bd2e89433fdbba7c4c23ec0ca402b05b4b69a8f748e4216`;
  Apps Script `Index.html` is 926 bytes / SHA-256
  `8d9035ee09f9eb514bcb374a9b399714bac693c02898825b196555f3c0621485`;
  `AppScript.html` is 265,782 bytes / SHA-256
  `946a2424d5c30e23b12128049bc60a5551279b8ad9f146b4405ccc1100b32faf`.
- External boundary: no deployment, migration, Script Property change, Apps
  Script/Sheets/Drive write, PR merge, Cloudflare, database, staging, or
  production action occurred.
- Rollback: set `HAU_MATERIALS_REQUESTS_ENABLED=false` for new Materials
  sections while retaining versioned stored children/history; use a focused
  revert of the eventual Slice 8 commit for code rollback.

## Current Slice 7 - Food Committee workflow

- Stage: `SLICE_7_COMMITTED_PUSHED_CI_GREEN_ACCEPTED` from accepted starting
  checkpoint `5c9bb501e01eeee961bae01279f2c0188d0429ce` on
  `integration/v0.5-baseline`.
- Scope delivered: versioned controlled Food fields, aggregate-only dietary
  handling, server-owned lead-time derivation, sourcing and completion-evidence
  gates, Food-scoped queue/detail projection, canonical authorization,
  revision/idempotency guards across generic and specialized mutation paths,
  durable history/audit, and mock/service/active-UI parity.
- Privacy and authority: public guessed-ID reads fail closed; Food users cannot
  receive sibling payloads; delivery evidence is revalidated by type/entity/
  component/upload status; Administrator system authority remains separate
  from Director operational oversight. No person-level dietary narrative,
  private supplier/contact/TIN/payment data, credentials, or Google resource
  URL was introduced.
- Verification: full `npm run check` passes governance, lint, 28 Vitest files / 231
  tests, a 30-module build, 30 Apps Script sources / 49 functions, deterministic
  package assembly, and both 311,165-byte standalone artifacts. Full Playwright
  passes 61 / 101 intentional skips / 0 failures across 162 cases; the focused
  rendered Food submission/queue/update flow passes; changed-file sensitive
  scans and `git diff --check` pass. Final independent review is PASS.
- Generated evidence: standalone SHA-256
  `d35d9ebcc08b1b4d0be788057e9993f24d12602eb227cdb2f7421e5027b8ce73`;
  Apps Script `Index.html` is 841 bytes / SHA-256
  `6c8709cf75c5558156407f292308abd95ac2f034dfe8092b9f8a0955096bad0c`;
  `AppScript.html` is 247,320 bytes / SHA-256
  `c100b172d3c77cdee4edf67f762787cf87ba46af7e1a8643bebc9a592a2f20a8`.
- Packaging hardening: Apps Script template assembly now inserts generated
  partials with a replacement callback, preventing minified `$&` tokens from
  being interpreted as string-replacement directives; regression coverage is
  included.
- Remote evidence: implementation commit
  `e85e27558f02e6a1f8b3b51be514a0382df24a10` is pushed; PR #7 head matched
  it and remained open/draft/mergeable. Apps Script run `29388258079` passed
  `validate`; CI run `29388258076` passed `verify` and `browser-smoke`.
- Acceptance: the owner authorized uninterrupted continuation without another
  manager-approval prompt; the passed local, independent-review, push, and CI
  gates accept Slice 7 and unlock bounded Slice 8.
- External boundary: no deployment, migration, Script Property change, Apps
  Script/Sheets/Drive write, PR merge, Cloudflare, database, staging, or
  production action occurred.
- Rollback: set `HAU_FOOD_REQUESTS_ENABLED=false` to stop new Food submissions
  while retaining stored versioned children for read/service continuity; use a
  focused revert of the eventual Slice 7 commit for code rollback.

## Current naming and visibility baseline

- Stage: `NAMING_BASELINE_IMPLEMENTED_PENDING_FINAL_CI`.
- Authority: `D:\Documents\HAU-USC Logistics\active\hau-usc-logistics-management-system` on `integration/v0.5-baseline`; upstream parity was `0 0` and status clean before this documentation update.
- GitHub: only `integration/v0.5-baseline` and `main` remain as branches. PRs #3-#5 were closed without merge. Their exact heads, the superseded routing head, and the approved prototype snapshot are preserved by dated remote archive tags and the verified full-ref bundle.
- Review surface: GitHub closed PR #6 as a side effect of the branch rename and would not reopen it. Draft PR #7 replaces it at the unchanged head and keeps #6 as the linked audit trail.
- Workspace: legacy top-level HAU-USC folders moved intact under `D:\Documents\HAU-USC Logistics` using `active`, `backups`, `private-config`, and `source-material` categories. The older non-Git Context Vault snapshot moved to `D:\Documents\GitHub\archives` and the active Context Vault repository was not changed.
- Private configuration: both ignored Apps Script configurations are outside Git under `private-config\apps-script`; no values were printed or committed.
- Preservation: `hau-usc-all-refs-naming-cleanup-20260715-110336.bundle` contains 37 refs and complete history; 1,574,863 bytes; SHA-256 `EE76A23C590679F2E19B95B047FCB18B42F520B28C547A7799A4EA342E53C765`.
- Windows compatibility shell: the old `D:\Documents\DOL Website GitHub` directory contains no files but remains hidden while the running Codex workspace holds its empty `.git` directory handle. It can be deleted after this task/workspace releases the handle.
- Boundary: no PR merge, `main` update, product change, generated application edit, deployment, migration, Apps Script push, Sheet/Drive write, or production action occurred.

## Current Phase 3.5 - Repository and workspace final reconciliation

- Stage:
  `PHASE_3_5_COMMITTED_PUSHED_CI_GREEN_TAGGED_PENDING_MANAGER_ACCEPTANCE`.
- Authority: `D:\Documents\DOL Website GitHub` remains the single active
  checkout on `feat/live-sync-lending-search-catalog-controls` from clean,
  synchronized, CI-green starting head `6abfb411...`.
- Preservation: new 34-ref complete-history bundle, 1,559,241 bytes, SHA-256
  `924E52E027E40EAFB141A73C4431E0FAF0DA35432D84F36AA531E090B10BE04F`.
  The routing clone's six runtime files are preserved exactly with zero copy
  mismatches and metadata aggregate SHA-256
  `548C972D309A3DFADDFB7B0A76AC6DFC53CA6102516CAA6B3174E54D0AD49535`.
- Local structure: the clean deployment linked worktree moved through Git to
  `D:\Documents\HAU-USC Logistics System\worktrees\v1-deployment`; the
  redundant routing clone was removed only after remote/bundle/runtime parity.
- GitHub reconciliation: PR #1 and PR #2 were closed without merge because
  their complete heads are contained in active and bundled. Their head branches
  and the fully contained runtime-truthfulness branch were deleted remotely and
  verified absent after prune.
- Retained: PR #3-#6; active, main, deployment, SDD, QR, routing, and snapshot
  branches; every tag; all unique/private/unknown folders and backups.
- Codex placement: `.codex/config.toml`, `agents/repo-mapper.toml`, and
  `agents/log-triage.toml` are present in the authoritative checkout and nowhere
  else among current local HAU-USC checkouts. Root `AGENTS.md` already contains
  the required skill, intent, Caveman, cost, and sole-writer triggers.
- No product/generated source, deployment, migration, Apps Script, Sheets,
  Drive, Cloudflare, database, staging, production, or PR #6 merge occurred.
- Verification: governance passed 8 project files / 14 continuation fields;
  full `npm run check` passed 25 files / 216 tests, 28-module build, 29 Apps
  Script sources / 47 functions, generated parity, and two 293,406-byte
  artifacts. Git integrity, bundle, manifest, structure, PR/ref,
  Codex-placement, and diff checks pass.
- Remote result: checkpoint `efee2dda0148c5a70bd9c681e729a75372622b8e`
  is pushed at branch/PR parity. Actions runs `29385021439` and `29385021514`
  passed `validate` (13 seconds), `verify` (15 seconds), and `browser-smoke` (1
  minute 36 seconds).
- Lightweight tag `hau-usc-phase3.5-consolidation-efee2dd` is verified locally
  and remotely at the checkpoint. PR #6 remains open/draft/mergeable with
  corrected title `feat: complete HAU-USC v0.5 repository baseline` and a
  cumulative evidence body.
- Remaining gate: push this remote-verification record, verify final parity/CI
  and clean structure, then obtain manager acceptance.
- Complete evidence and rollback:
  `docs/REPOSITORY_AND_WORKSPACE_CONSOLIDATION_PLAN.md`.

## Current Phase 3 - Repository and local workspace consolidation

- Stage: `PHASE_3_COMMITTED_PUSHED_CI_GREEN_TAGGED_PENDING_MANAGER_REVIEW`.
- Authority: `D:\Documents\DOL Website GitHub` remains the one authoritative
  active checkout on `feat/live-sync-lending-search-catalog-controls` from
  accepted starting checkpoint `048578d1db9fdda93b9ba95b94b74ac1791cfc8c`.
- Worktrees: reduced from eight registered entries to two. The authoritative
  checkout and clean `feat/v1-one-shot-demo-and-deployment` dependency remain;
  six patch-equivalent specialist worktrees were removed normally through Git.
- Branches: six bundled `codex/v1-*` refs and the fully contained local Apps
  Script launch-readiness ref were removed. `main`, the authoritative branch,
  and the deployment dependency remain locally. No remote ref or PR changed.
- Unique work: the separate clean planning clone at
  `D:\Documents\GitHub\hau-usc-logistics-management-system` remains because
  `feat/automated-codex-model-routing` contains four unique remote-backed commits.
- Preservation: current 47-ref complete-history bundle verified at 1,518,711
  bytes and SHA-256
  `DBA723337646546AC841A417FFFC9B2BA54C6FBEA2536B61CC1CF1F86CB5C7C0`.
  Exact Drive/QA generated files and binary patches plus two distinct private
  configuration copies are hash-verified outside Git.
- Archives: historical prototype/analysis and pre-sync generated folders moved
  intact to dated archives. Potentially private `06. LOGISTICS`, Download
  exports, release evidence/backups, open PRs, remote branches, and rollback
  tags remain untouched.
- Verification: governance passed 8 files / 14 continuation fields; full
  `npm run check` passed 25 test files / 216 tests, 28-module build, 29 Apps
  Script sources / 47 functions, deterministic generated parity, and two
  293,406-byte artifacts. `git diff --check`, Git integrity, bundle verification,
  and external manifest parsing pass.
- Detailed classification and recovery are recorded in
  `docs/WORKSPACE_CONSOLIDATION.md`. Independent review passed with no remaining
  actionable findings.
- Checkpoint `58168edd4eec5ea0a063558dfb8071c4a7fd6c99` is pushed at branch/PR
  parity. PR #6 runs `29383790687` and `29383790688` passed `validate` (14
  seconds), `verify` (16 seconds), and `browser-smoke` (1 minute 45 seconds).
- Lightweight development-baseline tag `hau-usc-phase3-baseline-58168ed` is
  verified locally and remotely at the checkpoint commit. Manager acceptance
  remains before Phase 4 or Slice 7.
- No Slice 7 code, application/generated repository source, PR merge/close,
  deployment, migration, Apps Script, Sheets, Drive, Cloudflare, database, or
  production action occurred.

## Current Phase 2 - Caveman Light and efficiency layer

- Stage: `PHASE_2_COMMITTED_PUSHED_CI_GREEN_PENDING_MANAGER_REVIEW`.
- Scope: repository-only intent/skill routing, Caveman Light short-command expansion, compact task/history/resume packets, bounded output/context tools, deterministic agent/continuation validators, and two read-only custom-agent profiles. Slice 7 and all external systems remain out of scope.
- Codex configuration: project `.codex/config.toml` limits concurrency to two threads and one delegation level; current official documentation supports the project config/custom-agent locations and the selected `gpt-5.6-terra`, low-reasoning, read-only profiles.
- Verification: governance checks pass 8 required project files and 14 continuation fields; focused Vitest passes 13 tests; repaired capped `npm run check` passes 25 files / 216 tests, a 28-module build, 29 Apps Script sources / 47 required functions, generated parity, and standalone verification. ESLint, targeted Prettier, and `git diff --check` pass.
- Review: the initial three findings are repaired. The re-review verified those repairs but found JSON's `\/` escape was still accepted; the second and final targeted round now rejects every escape outside the supported TOML subset. Final independent review is PASS with no actionable findings.
- Remote verification: implementation commit `8e82a8601e930ecf223a6e9170dc3d4dd9954bb1` is pushed; local, upstream, and PR #6 heads matched with local/upstream `0 0`. Actions runs `29379450091` and `29379450069` passed `validate` (14s), `verify` (16s), and `browser-smoke` (1m53s).
- Generated application artifacts remain unchanged. Local Playwright was not repeated because no browser/application source changed; accepted Slice 6 browser evidence is reused and PR CI will run after push.
- Strict Codex config parsing is unrun because the local `codex.exe` launcher is access-denied; no strict-parser pass is claimed. No deployment, migration, configuration outside the repository, Apps Script action, or Google Sheets/Drive write occurred.
- Rollback: focused `git revert 8e82a8601e930ecf223a6e9170dc3d4dd9954bb1`. Next gate is manager acceptance before consolidation or Slice 7.

## Current Slice 6 - Composite Event Logistics request foundation

- Stage: `SLICE_6_COMMITTED_PUSHED_CI_GREEN_PENDING_MANAGER_REVIEW`.
- Scope: a feature-flagged, server-owned parent request with one independent child for each non-empty Food, Materials, and Venue & Equipment section; validation, exact duplicate consolidation, atomic idempotent creation, visible hierarchy, child lifecycle, derived parent status, cancellation/reopen/amend/add-section, assignment/escalation boundaries, history, and audit.
- Repository implementation: additive `24_COMPOSITE_REQUESTS` schema and `CompositeRequestService.gs`, nine Apps Script routes, canonical domain/service contracts, serialized mock mutations, feature-flagged source UI, and focused unit/Apps Script/browser tests. Existing `03_REQUESTS.Parent_Request_ID` remains untouched.
- Evidence: `npm run lint` passed; `npm test` passed with 24 files / 203 tests; `npm run verify` passed with 29 Apps Script sources / 47 required functions; full Playwright passed 61 / 101 intentional skips / 0 failed across 162 cases; the focused composite browser test passed; and `git diff --check` passed. Independent review is PASS after the concurrency repair.
- Generated evidence: standalone artifacts are 293,406 bytes each / SHA-256 `f9592c86f6e63377b82d656333b64188dea0c4284f2b23108cecb2dfd0866558`; Apps Script `Index.html` is 766 bytes / `9615ba949ac8479ed6b8057c6561370eedcdda0db997f238ef4c631b727a47de`; split outputs pass deterministic parity.
- Remote evidence: implementation commit `813f6b8f01b975e0952f553dc1bde4e3bc90fe0a` is pushed and PR #6 `validate`, `verify`, and `browser-smoke` are green in runs `29377313232` and `29377313250`.
- Privacy/external boundary: no newly introduced credentials, `.clasp` content, private identifiers, roster/student data, private contacts, supplier TINs, or evidence files/links; no Sheet/Drive/Apps Script external write, Script Property change, migration, or deployment occurred. `clasp status` and `clasp push --dry-run` remain unrun because no staging script is configured.
- Rollback: disable `HAU_COMPOSITE_REQUESTS_ENABLED` for new submissions; retain any created records for read continuity; use a focused revert to the `hau-usc-slice6-start-6548ca2` checkpoint if required. Do not reset or discard work. Slice 7 remains gated.

## Current Slice 5 - Committee Main Hub and Inventory and Pantry vertical slice

- Stage: `COMMITTED_PUSHED_CI_GREEN_PENDING_MANAGER_REVIEW`.
- Scope: one capability-aware Main Hub with active committee context, server-scoped queue/count/detail projections, bounded status-history/audit activity, recent completions, safe links, freshness/manual refresh state, and active-context propagation into existing inventory-family module reads.
- Queue defaults: new/unassigned, awaiting review, needs information, due soon (7 days), overdue, blocked, missing evidence, escalated, inventory attention, lending review/overdue, upcoming needs (14 days), and recent completions (30 days). Exact owner policy and institutional timezone boundary samples remain later staging inputs.
- Repository implementation: `apps-script/CommitteeDashboardService.gs`, bootstrap authorization/context reuse, additive 1.3.0 dashboard collections, active-context module requests, visual Main Hub source, generated artifacts, and focused synthetic/browser tests. No private roster, contact, supplier-TIN, evidence-link, credential, or external operational value was added.
- Evidence: `npm run check` passes with 22 Vitest files / 183 tests, build, Apps Script validation (28 source files / 38 required functions), generated parity, and standalone verification; `npm run verify` passes; full Playwright passes 56 with 100 intentional skips and 0 failures across 156 cases; `git diff --check` and the changed-scope sensitive scan pass. Independent review is PASS.
- Generated parity: `dist/index.html` and `HAU-USC_Logistics-Prototype-Shareable.html` are 282,306 bytes each / SHA-256 `fe937a21807ee12dad4317b0ac3945d7a5ecf0a1389a6b307226a655db0f248d`; `apps-script/Index.html` is 681 bytes / `342dd291abea325d54a69646ea717abd5942397504302b780042574cfd7a1af8`; the split Apps Script generated outputs passed deterministic parity.
- Implementation commit `a1784f15bc6a160ebf3c2405e9776b6517ce52e5` is pushed and PR #6 CI is green. Rollback checkpoint is `hau-usc-slice5-start-89a7acc`; use a focused revert if rejected and preserve the starting tag.
- No staging/production deployment, Script Property change, trigger activation, Sheet/Drive write, migration, or external operational-data access occurred. `clasp status` and `clasp push --dry-run` were not run because no staging script is configured; live volume timing and owner policy confirmation remain for the later staging slice.

## Current Slice 4 - Private roster synchronization and access freshness

- Stage: `COMMITTED_PUSHED_CI_GREEN_PENDING_MANAGER_REVIEW`.
- Scope: exact private-roster source validation, explicit/admin or scheduled sync, metadata-only run records, access and membership last-known-good snapshots, freshness expiry, emergency deny, safe admin health, and zero private-source reads during ordinary startup.
- Additive schema: `HAU_CONFIG.SCHEMA_VERSION=1.3.0`; roster access fields on `14_USERS_ACCESS`; `21_ACCESS_SYNC_RUNS`; `22_ACCESS_SYNC_SNAPSHOT`; and `23_ACCESS_SYNC_MEMBERSHIP_SNAPSHOT`. No schema migration or external setup was run.
- Repository implementation: `apps-script/RosterSyncService.gs`, access/config/authorization/setup wiring, synthetic VM coverage in `tests/unit/apps-script-roster-sync.test.js`, and updated setup/security documentation. No private source ID, source row, credential, roster record, or operational value is present in the changed files.
- Evidence: local `npm run check` passes with 21 Vitest files / 177 tests, build, Apps Script validation, generated parity, and standalone verification; `npm run verify` passes; full Playwright passes 50 with 100 intentional skips and 0 failures across 150 cases; `npm run lint`, `git diff --check`, and the changed-scope sensitive scan pass. Independent implementation review found no blocking issue. Commit `113b6002eb7b4e713b518c4e4fd5afa6c2aca1df` is pushed and PR #6 CI is green.
- Rollback checkpoint: local tag `hau-usc-slice4-start-a3fffb9` points to the approved starting HEAD. A rejected implementation must be reverted as a focused commit; do not reset or discard work.

## Current staging acceptance checkpoint - Phase E accepted

STAGING ACCEPTANCE: SLICES 1-3 PASSED

- Date: `2026-07-14` (`Asia/Manila`)
- Branch: `feat/live-sync-lending-search-catalog-controls`; implementation checkpoint: `fcb004e8be78d3d431164c95c7f847ab1033d927`.
- The accepted staging handoff reports Version 18 serving bootstrap contract v2 with authorization contract v1/absent. Version 13 remains available for rollback.
- Root cause identified in staging: the read-only bootstrap-module callback completed at approximately 40 seconds, beyond the former 30-second browser deadline. The fix gives `api_getBootstrapModule` a bounded 60-second client deadline while mutations and all other calls remain at 30 seconds.
- The staging handoff reports 32-file pull-back parity, preservation of the owner-only web-app manifest, a ready internal v2 workspace, and passing diagnostic and request-only privacy checks. No production or operational records were touched.
- Local verification after the fix: `npm run check` passed with 20 Vitest files / 164 tests; `npm run verify` passed; full Playwright passed 50 with 100 intentionally skipped and 0 failed across 150 cases; `git diff --check` passed; the sensitive-value scan passed.
- Generated parity: `dist/index.html` and `HAU-USC_Logistics-Prototype-Shareable.html` are 274,348 bytes each / SHA-256 `63e25fc21657c725c5c40cab8500a702f74aaaa521efa156b6218bd690c91485`; `apps-script/Index.html` is 681 bytes / `342dd291abea325d54a69646ea717abd5942397504302b780042574cfd7a1af8`; `AppScript.html` is 215,052 bytes / `6c3ee9ade3fe465d34ad0ffeefce6cd81aa8c37cb53023ded34df35a27fccbd1`.
- Independent review was reported as PASS in the staging handoff. The live staging claims above are accepted from that handoff and were not re-fetched in this session because the local Chrome bridge was unavailable.
- No Slice 4 work, production deployment, Google Sheets/Drive write, or private operational-data change had been performed at this historical Phase E handoff. The active Slices 4-16 continuation goal now authorizes a focused repository push after Slice 4 gates; that push has not yet occurred.

## Superseded staging acceptance checkpoint - Phase E previously blocked

- Date: `2026-07-14` (`Asia/Manila`)
- Branch: `feat/live-sync-lending-search-catalog-controls`; current local documentation checkpoint: `85aef6b`
- Phase D compatibility acceptance passed on immutable staging Version 17 with bootstrap contract v1 and authorization contract v1/absent.
- Phase E v2 direct read-only endpoint checks passed, but the live v2 workspace remained in slow startup and reached the retryable read-only-service timeout instead of ready.
- The existing staging deployment was immediately rolled back to immutable Version 13; the staging owner reports the bootstrap property is restored to `1`, while this checkout has no direct Script Property read path. Authorization contract v1/absent remains the required setting.
- A local synthetic end-to-end check covering the checked-in Apps Script DTO, authorization v1/absent behavior, JSON-safe callback normalization, and browser v2 validation passes; no local contract-shape defect or reproducible timeout was found.
- The exact marker `STAGING ACCEPTANCE: SLICES 1-3 PASSED` is absent. No push, production deployment, Slice 4 work, Sheet/Drive write, or private operational-data change is authorized from this blocked checkpoint.

## Slice 3 - canonical roles, committee scopes, and authorization contract (repository-only)

- Date: `2026-07-14` (`Asia/Manila`)
- Approved starting commit: `23c4f61e5f1b113d4b77c2955f1716139a03c121`
- Current stage: `PENDING_MANAGER_REVIEW`; implementation commit is pushed and PR #6 CI is green.
- Scope: server-owned canonical role/capability decisions, exactly three committee IDs, sanitized bootstrap authorization DTO, client projection, safe denial reasons, and additive legacy mapping dry-run/apply controls.
- Owner-auto-accepted defaults recorded from the planning package: six roles (`Requester`, `DOL Staff`, `Committee Head`, `Director`, `Administrator`, `Read-only Auditor`); `Food Committee`, `Inventory and Pantry Committee`, and `Materials Committee`; immutable canonical IDs; multiple memberships as rows; committee heads scoped to their committees with no release capability by default; Director oversight separated from Administrator reference/access/system administration.
- `HAU_AUTHORIZATION_CONTRACT_VERSION` defaults to legacy v1 when absent; canonical v2 is opt-in and is not activated in any external environment by this checkpoint.
- `14_USERS_ACCESS` additions and `20_USER_COMMITTEE_SCOPE` are additive schema definitions only. The mapping dry run reports unknown roles/committees, missing scope, and invalid overrides; apply requires explicit approval and does not rewrite immutable history. No migration or external write was run.
- Final local evidence: `npm run check` passes with ESLint, full Vitest (20 files / 161 tests), production build, Apps Script validation (26 source files / 32 required functions), generated parity, and standalone verification; `npm run verify` passes; full Chromium passes 49 with 95 intentionally skipped and 0 failed across 144 cases; `git diff --check` and the sensitive-value scan pass.
- Generated parity: standalone artifacts are 274,038 bytes each / SHA-256 `3646b8b799cecc954c3226580ca0a173da1b2cd61e94740b485597ebaaf11fa9`; `apps-script/Index.html` is 681 bytes / `342dd291abea325d54a69646ea717abd5942397504302b780042574cfd7a1af8`; `AppScript.html` is 214,742 bytes / `986b0e4e5148172936ad5e680c0dd8400f5b13ff19c694e2187a7863b4bb8a2e`.
- Initial independent-review findings were repaired and covered by focused tests. The implementation-validator pass found no blocking issue; a second reviewer did not return a final response before handoff, so no re-review PASS is claimed. No sensitive/private values, roster rows, external identifiers, credentials, private supplier-TIN values, or operational records were introduced in the changed scope; regenerated standalone files retain only the pre-existing fictional preview baseline.
- No roster import, committee UI, composite request, catalog, restock, polling/live-update, hosting, database, deployment, staging/production, Google Sheets/Drive write, or private operational-data work was performed.

## Slice 2 - essential bootstrap and lazy module contracts (repository-only)

- Date: `2026-07-14` (`Asia/Manila`)
- Approved starting commit: `8b40f60a48323065ad69517e37915a33f32a51d2`
- Current stage: `PENDING_MANAGER_REVIEW`; implementation, repairs, final local gates, push, and PR CI are complete.
- Remote ending SHA: `576393f1be28687d984ea7632a2501aa8d3fc30d`; local/upstream ahead/behind is `0 0`.
- Apps Script renders `HAU_BOOTSTRAP_CONTRACT_VERSION` from Script Properties: absent defaults to v1, explicit v2 requests an allowlisted essential DTO followed by one active-module DTO, and v1 retains the compatibility endpoint.
- Added bounded pagination/filtering across module collections, fail-closed explicit entity-scope filtering for committee-scoped sessions, strict JSON/sensitive-field validation, exact UTF-8 payload metrics with a 100 KiB server bound, safe public-reference caching, in-request Sheet-read deduplication, and generated-runtime integration.
- Verification: `npm run check` passed with 18 Vitest files / 143 tests; `npm run verify` passed; focused packaging passed 15/15; full Playwright passed 49 with 95 intentionally scoped skips and 0 failures across 144 cases.
- No deployment, `clasp` command, Google Sheets/Drive/Apps Script external write, staging/production action, private-data access, migration, database, hosting, committee, roster, composite-request, catalog, restock, or polling work was performed.
- Rollback: set `HAU_BOOTSTRAP_CONTRACT_VERSION=1` to use the compatibility endpoint; if code rollback is required after commit, revert the single focused Slice 2 commit. No external rollback is applicable to this local checkpoint.

## P0 Production Bootstrap Diagnosis and Recovery — repository-only checkpoint

- Date: `2026-07-14` (`Asia/Manila`)
- Branch: `feat/live-sync-lending-search-catalog-controls`
- Approved starting commit: `2a9ac342ca584257e0bbf6ea09ffb9d4f892a7c7`
- Upstream: `origin/feat/live-sync-lending-search-catalog-controls`
- Ending commit: this focused P0 implementation commit; the exact SHA is recorded in the final handoff
- Scope: startup diagnosis, bootstrap-envelope validation, bounded recovery UI, safe client diagnostics, and local verification seams only

### Diagnosis and recovery

- The previous startup catch covered the remote request but left normalization, static-option preparation, runtime-extension installation, event binding, first render, and post-render work outside the same recoverable boundary. A failure after the response could therefore leave the loading overlay active without a Retry path.
- The P0 controller now emits named stages from shell readiness through ready, records safe client-side timings/counts, rejects malformed or unsupported JSON-safe envelopes before normalization, and keeps one active attempt at a time.
- An attempt token prevents an obsolete callback from completing a newer Retry attempt. The terminal UI finalizer is idempotent, clears the overlay on success, keeps it actionable on failure, reports a plain-language message with an opaque support code, and announces failure through an accessible live region with keyboard focus on Retry.
- Slow loading is reported locally after eight seconds without creating another request. The existing Apps Script adapter success/failure handling and 30-second timeout remain unchanged.
- Apps Script response sanitization now converts Date, non-finite, function, symbol, undefined, and bigint values into JSON-safe output before they reach the browser. No endpoint, payload, schema, or external data source was changed.

### Verification

- `npm ci`: passed; 139 packages installed and no vulnerabilities reported.
- `npm run lint`: passed.
- Focused P0 Vitest: 4 files / 29 tests passed.
- Full Vitest: 14 files / 116 tests passed.
- `npm run check`: passed, including lint, full Vitest, Vite build, Apps Script static/package checks, generated-file parity, and standalone verification.
- Focused P0 Vitest: 5 files / 30 tests passed during iteration; final full Vitest: 15 files / 118 tests passed.
- Focused packaged Apps Script Chromium suite at 390 px: 14 passed, including slow-state, finalizer, retry, and stage-failure coverage.
- Complete Playwright run across the six configured viewport projects: 138 cases, 48 passed, 90 intentionally scoped skips, 0 failed.
- Generated visual modules were regenerated from `legacy/HAU-USC_Logistics-Prototype.original.html`; generated standalone artifacts were rebuilt and verified at 252,036 bytes each with SHA-256 `40e211acf12a581436e2a28074a94fb60152eb9ad4d6667e2d46c6c6136080bd`. The generated Apps Script shell remained 615 bytes with SHA-256 `e31ed283e193703ec5a403e3b9d40ba504d17f57a3dc2eb02424741f1aa73495`.
- Synthetic local shell measurement at 390x844 rendered the loading surface in 81 ms; this is not a staging or production latency claim.

### External boundary and remaining unknowns

- No Slice 2, committee, roster, composite-request, catalog, restock, polling, hosting, database, deployment, staging, production, Google Sheets, Google Drive, Apps Script deployment, trigger, or external write work was performed.
- `clasp status` and `clasp push --dry-run` were not run because no authorized staging-script verification was in scope. No live Apps Script response, live timing, deployment behavior, or production bootstrap volume is claimed by this checkpoint.
- The local synthetic fixtures prove realistic-volume sequencing and failure recovery but do not establish staging latency, Apps Script HTML Service behavior, or production data correctness.

### Rollback

- Before any push or deployment, rollback is simply to retain the approved starting checkpoint; after integration, use a focused `git revert` of this implementation commit rather than resetting or discarding work.
- If a later separately authorized deployment uses this commit, rollback must move only the deployment pointer to the preceding immutable version. No Sheet/Drive data, ledger, schema, or external records were changed by this checkpoint.

### Next action

Manager review of this local evidence and the focused diff. Do not push, deploy, or start another milestone without separate explicit authorization.

## Version 0.5.0 working revision

- Successful Apps Script mutations are followed by an authoritative bootstrap reload before success is rendered. A failed follow-up read does not repeat the recorded command.
- Internal clients check `api_getDataRevision` every five seconds while visible and online. Focus, visibility restoration, reconnect, and the visible Refresh control request immediate checks. Polling requests do not overlap and back off after repeated errors.
- Revision state is stored in `17_CONFIG`. Each successful non-replay mutation advances it exactly once; bootstrap, search, health, diagnostics, and other read-only operations do not advance it.
- An installable operational spreadsheet edit trigger advances the revision for relevant direct human edits. Trigger setup is idempotent and is not performed by repository commands.
- Dirty forms, local request drafts, pending uploads, and active modal workflows defer automatic refresh and show an Updates available banner.
- The Lending Hub uses predictive text selection with a hidden authoritative Item ID, accessible keyboard behavior, and specific availability/restriction messages.
- Server lending validation covers item existence/status, VERIFY, handling, borrower audience, quantity, maximum quantity, available-to-promise, and due dates at creation and again during approval/handoff.
- Authorized catalog managers can create, edit, relocate, archive, and restore items through locked, idempotent, audited APIs. Quantity truth remains append-only; unit and archive protections preserve dependencies and history.
- `Can_Manage_Catalog` is appended to access rows. ADMIN and DOL_DIRECTOR retain backward-compatible access when the cell is blank; other roles require an explicit true value.
- The `01_ITEM_MASTER`, `14_USERS_ACCESS`, and `17_CONFIG` changes are additive and safe to prepare before the new web deployment becomes active.

### Repository verification

- `npm ci`: passed.
- ESLint: passed.
- Vitest: 12 files / 93 tests passed.
- Focused new Chromium suite at 390 px: 4 passed.
- `npm run check`: passed, including the 22-module Vite build, 24-file/27-entry-point Apps Script static and packaging checks, generated-file parity, and standalone verification.
- `npm run verify`: passed.
- Complete Playwright/browser matrix across all six configured viewport projects: 38 passed, 40 intentionally scoped skips, 0 failed.
- A second build reproduced the byte-identical 238,891-byte standalone artifacts with SHA-256 `8192ddff053f9776ba41f74be4eadf9c627b6db638db0cf7f8b6cf03d410ed8f` and the 615-byte Apps Script shell with SHA-256 `e31ed283e193703ec5a403e3b9d40ba504d17f57a3dc2eb02424741f1aa73495`.

### External-action record

- No `clasp push`, immutable Apps Script version, deployment update, Sheet/Drive write, live trigger change, production action, or PR #2 merge was performed for 0.5.0.
- Immutable staging Version 9 remains the live staging version. Production remains untouched.

## Launch-readiness foundation completed in 0.4.0

- Preserved the approved visual baseline and generated visual modules.
- Added strict browser adapters for mock, Apps Script, and future authenticated HTTP implementations.
- Added Apps Script repositories, setup, schema checks, authorization, collision-safe IDs, locks, idempotency, structured errors, audit/status history, append-only inventory, reservations, request routing, lending, release, restocking, procurement, canvass, evidence, migration, reconciliation, backup, and triggers.
- Added privacy-safe evidence labels and filenames, MIME/extension/size checks, digest deduplication, configured folder routing, and quarantine recovery.
- Request-only Apps Script payloads hide exact inventory balances and legacy trace fields; authoritative stock routing occurs during locked DOL review.
- Evidence upload entry points require receive, release, or admin permission according to evidence type.
- Runtime configuration accepts only `STAGING` or `PRODUCTION`, rejects missing/placeholder/malformed values, requires separate operational and backup IDs, and has no production fallback.
- Setup, migration/reconciliation access, launch backup creation, and admin health checks route through the resolved environment target.
- Removed the Apps Script packaging dependency on regular-expression extraction from the already-minified standalone HTML.
- Apps Script body, CSS, and JavaScript now come from deterministic separate build outputs.
- Dangerous raw-text closing sequences are escaped before JavaScript or CSS is embedded in HTML.
- Added parser-level assembled-document checks, a browser execution check, deterministic hash/size diagnostics, generated-file parity checks, and a literal `</script>` regression fixture.
- Added a staging-only minimal diagnostic shell and bounded admin template diagnostics that do not log the full application or any resource IDs.
- CI now retains concise failure diagnostics only when a job fails.

## Staging work already completed

The following staging operations were completed before the packaging repair and must not be repeated merely to validate rendering:

- Dedicated staging Apps Script project created and locally authenticated with untracked `clasp` configuration.
- Required `STAGING` Script Properties configured and runtime target validated.
- Staging database setup and schema validation completed.
- Dedicated staging Drive root and evidence folders configured and validated.
- Migration dry-run and reconciliation completed.
- Timestamped launch backup created.
- Daily overdue-lending and scheduled-backup triggers created and verified.
- Initial staging web app versions created during the incident investigation.
- Version 9 now serves the parser-safe request-only repair on the existing staging deployment. The isolated diagnostic, authorized internal `/exec`, and request-only `/exec?request=1` routes passed read-only acceptance.

No production migration was applied and no production resource was modified.

## Earlier read-only production validation

- Production spreadsheet title and timezone matched the supplied target during the earlier read-only validation.
- All four original legacy tabs and all 20 prepared backend tabs were present.
- The four legacy tabs matched the supplied backup value-for-value at validation time.
- `01_ITEM_MASTER` contained 397 records (`ITM-0001`–`ITM-0397`): 394 `ACTIVE`, 3 `VERIFY`, 2 zero-quantity, and no missing units.
- Known date-serial anomalies remain flagged `VERIFY`; no quantity was corrected.

See `docs/SCHEMA_VALIDATION_2026-07-12.md`.

## Verification status

### Latest runtime-truthfulness verification

- Focused Vitest verification: 2 files / 14 tests passed.
- `npm run check`: passed with exit code 0.
- ESLint passed.
- Vitest passed: 10 files / 69 tests.
- Vite build passed with 17 modules transformed.
- Apps Script static validation passed.
- Deterministic generated-package checks passed.
- Standalone artifact verification passed at 210,112 bytes each.
- `npm run test:e2e`: 29 passed, 25 intentionally skipped, 0 failed.
- Staging and production template assembly tests passed for both internal and request-only modes.
- GitHub Apps Script static check run 52: **passed**.
- GitHub CI run 52: **passed**.
- Runtime-truthfulness commit: `7156c256414b797f4b0f19431b399009f31feebd`.
- No Apps Script push or deployment was performed for this repository repair.

At packaging-repair code checkpoint `74f2f0f...`:

- GitHub Apps Script static check run 47: **passed**.
- GitHub CI run 47: **passed**.
- CI verify job: **passed**, including ESLint, 10 Vitest files / 67 tests, build, Apps Script validation, deterministic generated-file parity, and standalone artifact verification.
- CI browser-smoke job: **passed** across the configured 320, 390, 768, 1024, 1366, and 1440 px projects.
- Generated Apps Script package sizes at the verified build:
  - `Index.html`: 512 bytes
  - `AppBody.html`: 28,967 bytes
  - `AppStyles.html`: 26,850 bytes
  - `AppScript.html`: 153,161 bytes
- Apps Script static validation covered 23 `.gs` source files and 18 required functions.
- Standalone artifact verification reported 209,742 bytes for each reviewer-facing standalone file.
- Local browser execution of the packaging test also passed using installed Chromium.

During controlled staging verification, clasp 3.3.0 did not support `push --dry-run`. The first non-force push printed `Skipping push` because the changed manifest required an interactive overwrite confirmation; it did not update remote source. Version 7 therefore retained the old raw-partial package and reproduced `Exception: Malformed HTML content` on `/exec`.

After the mismatch was confirmed by a bounded remote pull, the existing remote `webapp` manifest settings were preserved exactly and one authorized `clasp push --force` replaced all 29 staging files. A fresh pull matched all 29 validated local files and confirmed exactly one application script and one application style element. Immutable version 8 was created and the existing deployment ID was updated to version 8.

Live version-8 evidence now confirms:

- `?diagnostic=1` passes body, style, inline-script, and harmless server-call checks;
- authorized internal `/exec` renders without raw JavaScript or malformed-HTML errors;
- the loading overlay clears and the Apps Script staging adapter reaches bootstrap successfully;
- no setup, migration, trigger, Sheet workflow, Drive workflow, production action, or PR merge occurred during recovery.

## Confirmed findings and limitation

The previous package design was structurally unsafe because it extracted executable assets from minified HTML with regular expressions and force-printed raw source inside an outer script/style context. A deterministic fixture reproduced the observed failure class: an unescaped raw-text closing sequence terminates the script element and moves the remaining JavaScript into visible body text.

The fixed real bundle contains one intended application script element, one intended application style element, no unexpected template delimiters, and no raw JavaScript body text. Version 8 confirms recovery in Apps Script HTML Service. The exact omitted Version 6 server exception remains unavailable, but the live Version 7 failure is confirmed to have used stale pre-repair remote files after a skipped clasp push.

Live Version 9 acceptance confirms:

- `?diagnostic=1` rendered the body and styles, executed inline JavaScript, and completed the harmless server call;
- authorized internal `/exec` rendered the complete workspace and cleared the loading overlay;
- `/exec?request=1` rendered only the requester portal;
- request-only mode exposed no internal sidebar, exact inventory balances, ledger, release desk, supplier internals, users, or administrative controls;
- no operational Sheet or Drive workflow was performed;
- production was untouched and PR #2 was not merged.

The runtime-truthfulness repair is included in this repository update. It resolves the trusted Script Property environment, renders it into `body[data-app-environment]`, shows accurate staging or production labels, and removes the local-only reset control from Apps Script interaction. It passed local checks and remains undeployed to Apps Script; Version 10 has not been created.

## Remaining launch blockers and limitations

- Obtain manager review of the exact 0.5.0 diff, pushed commit, and CI state.
- Review and seed the final institutional access rows in `14_USERS_ACCESS` before broader staging acceptance.
- Obtain explicit authorization before any staging schema migration, operational edit-trigger installation, code push, or deployment.
- Complete one controlled Sheet/Drive end-to-end workflow and verify audit, history, error, and evidence records.
- Obtain DOL owner approval before production promotion or merging PR #2.
- The compatibility runtime remains relatively large; Google Sheets remains suitable for a controlled v1 pilot, not high-volume transactional scale.

## Next recommended task

Review the pushed 0.5.0 handoff commit and CI evidence. Only after separate explicit authorization should an operator follow the staged backup, additive schema migration, edit-trigger setup, deployment, acceptance, and rollback sequence in `docs/LAUNCH_RUNBOOK.md`. Do not touch production or merge PR #2 as part of repository verification.
