# Changelog

## Unreleased - Slice 12 Bounded near-live active-module refresh

- Replaced five-second global polling with a 15-second, bounded-jitter,
  single-flight scoped controller that runs only for visible, online,
  focused/recently-active internal sessions and backs off after failures.
- Added one compact re-authorized `api_getScopedRevision` contract, per-module
  CONFIG tokens, conservative operation-to-scope invalidation, and exactly-once
  global mutation revision behavior. Unknown operations and direct Sheet edits
  invalidate all modules.
- An unchanged token performs no module fetch; a changed token invalidates only
  the active bounded module. Dirty forms, request drafts, uploads, and active
  modal workflows defer refresh without overwriting input; abandoned closed
  modal drafts no longer leave stale dirty markers.
- Added request-only revision-token isolation, stale/last-updated/manual-only
  status, fail-closed `HAU_NEAR_LIVE_REFRESH_ENABLED`, safe manual and
  post-mutation refresh, late-response rejection, request/read counters,
  adapters, documentation, and synthetic browser network evidence.
- Verification passes `npm run check` (36 Vitest files / 303 tests, 34-module
  build, 33 Apps Script sources / 55 functions, deterministic parity, two
  411,048-byte artifacts), full Playwright (67 passed / 119 intentional skips /
  0 failed), focused 390 px proof, privacy/diff review, and final implementation
  validation after baseline-token, request-only, and modal-lifecycle repairs.
- No deployment, migration/import, Script Property change, external Apps
  Script/Sheets/Drive write, PR merge, staging, production, Cloudflare,
  database, or hosting action occurred. Live p95/quota/concurrency acceptance
  remains Slice 13 and is not claimed by repository evidence.

## Unreleased - Slice 11 Restock Safety

- Replaced consequential queue-row controls with authoritative detail review,
  server-returned allowed actions and disabled reasons, explicit confirmation,
  required reasons, and bounded timeline/quote/receipt projections.
- Defined each restock as the stable `RRQ-<Request_Line_ID>` projection of one
  durable catalog-restock line. Added schema `1.6.0` optimistic
  `Workflow_Revision`, exact line/item/unit validation, preferred-quote gates,
  cumulative receipt-derived completion, and parent-status derivation without
  implicit sibling mutation.
- Added scoped capabilities, fail-closed `HAU_RESTOCK_WORKFLOW_ENABLED`, script
  locking, idempotent replay, stale-revision denial, reconciliation protection,
  immutable `08_RESTOCK` plus `PURCHASE_RECEIPT` ledger appends, history, audit,
  adapters, active desktop/mobile UI, and authoritative refresh.
- Verification passes `npm run check` (36 Vitest files / 296 tests, 34-module
  build, 33 Apps Script sources / 54 required functions, deterministic parity,
  standalone verification), full Playwright (67 passed / 119 intentional skips
  / 0 failed), focused mobile/desktop restock proof, sensitive-data review,
  `git diff --check`, and final implementation validation after exact-unit
  hardening.
- Remote verification is green at implementation commit
  `d5cf2247f1997b18d8d2b8ef9fb367b0e7214d51`: run `29474985205` passed
  `validate`, and run `29474985252` passed `verify` and `browser-smoke`.
- No deployment, migration/import, Script Property change, external Apps
  Script/Sheets/Drive write, PR merge, Cloudflare, database, staging, or
  production action occurred.

## Unreleased - Slice 10 Authorized reference-data administration

- Added a bounded Reference Administration workspace for organization,
  committees, venue/equipment, routing, lifecycle, permissions, roster-owned
  memberships, and synchronization health without exposing a raw-sheet grid.
- Added controlled add/update/archive/restore, effective dates and aliases,
  dependency protection, explicit before/after comparison, optimistic numeric
  revisions, script locking, idempotency, durable history/audit, and a
  fail-closed `HAU_REFERENCE_ADMIN_WRITES_ENABLED` control.
- Added distinct-review permission escalation and cross-office routing with an
  actionable reviewer comparison, required reason, stored-payload revalidation,
  stale-revision denial, requester/reviewer self-escalation denial, and
  revocation-only emergency access that rejects dormant role/scope grants.
- Hardened partial-write behavior by recording `APPLYING`, appending before
  superseding the exact expected revision, preserving the old record on append
  failure, detecting overlapping current revisions, and returning a visible
  reconciliation-required state instead of retrying or claiming success.
- Added schema v1.5 tables/columns, canonical operations/capabilities, adapters,
  active responsive UI, server-safe DTOs, synthetic unit/browser fixtures, and
  generated standalone/Apps Script parity. Closed an integration finding by
  deferring the admin workspace fetch until its view is opened.
- Verification passes governance/lint, 34 Vitest files / 284 tests, a 33-module
  build, 33 Apps Script sources / 54 required functions, deterministic parity,
  two 393,977-byte standalone artifacts, full Playwright 65 passed / 115
  intentional skips / 0 failures, sensitive scan, and `git diff --check`.
  Independent implementation validation is final PASS after targeted repairs.
- Remote verification is green at implementation commit
  `ece5bf846399c2793ab088214ba2a1693d3693ae`: run `29472954664` passed
  `validate`, and run `29472954676` passed `verify` and `browser-smoke`.
- No deployment, migration/import, Script Property change, external Apps
  Script/Sheets/Drive write, PR merge, Cloudflare, database, staging, or
  production action occurred.

## Unreleased - Slice 9 Venue and Equipment reference/request workflow

- Added additive, initially empty live Venue and Equipment reference/route
  tables with stable IDs, revisions, effective dates, safe aliases/location,
  responsible office/authority, lead time, requestability, and return policy.
- Added bounded safe search, exact server validation, immutable reference/route
  snapshots, amendment provenance, constrained Other triage, and server-owned
  routing to exactly one of the three existing committees. Requestability is
  explicitly not a booking, reservation, approval, or stock guarantee.
- Added confirmation, blocker, Other disposition, return, linked evidence,
  revision/idempotency/locking, audit/history, scoped queue/update endpoints,
  adapters, feature flag, active predictive add/edit/remove UI, and workflow
  management UI. Stored specialized children remain actionable when new
  selection is disabled.
- Added synthetic-only fixtures and domain, Apps Script VM, adapter/package,
  and Playwright coverage. No institutional catalog was invented or imported.
- Local verification passes governance, lint, 32 Vitest files / 262 tests,
  32-module build, 32 Apps Script sources / 54 functions, deterministic parity,
  standalone verification, full Playwright 61 passed / 101 intentional skips /
  0 failed, sensitive scan, and `git diff --check`. Final independent review is
  PASS after targeted effective-revision, server-clock, preview-parity,
  replay-immutability, and exact evidence validation repairs.
- No deployment, migration/import, Script Property change, external Google
  write, PR merge, Cloudflare, database, staging, or production action occurred.

## Unreleased - Slice 8 Materials Committee workflow

- Added a versioned Materials specialization with controlled category,
  specification, required-by, usage, sourcing preference, exact quantity/unit,
  live catalog validation, and immutable legacy source provenance across
  amendments.
- Enforced exact `ACTIVE` status and controlled category, retained the dedicated
  `VERIFY` denial, prohibited automatic substitution/unit conversion, and
  required one stock-issue or procurement-receipt path.
- Added explicit substitution reference/reason with immutable before/after
  history and audit metadata, blocker controls, path-matching uploaded evidence,
  and full readiness rechecks at handoff and completion.
- Added the `COM_MATERIALS`-scoped server queue/update route, revision,
  idempotency, locking, authorization, parent projection, fail-closed
  `HAU_MATERIALS_REQUESTS_ENABLED` flag, active request/queue UI, and blank
  required operational inputs.
- Verification passes: `npm run check` (30 Vitest files / 244 tests, 31-module
  build, 31 Apps Script sources / 51 required functions, generated parity, and
  two 329,544-byte artifacts); full Playwright 61 passed / 101 intentional skips
  / 0 failures; changed-scope sensitive scan; `git diff --check`; and final
  independent review PASS with no findings.
- Implementation commit `1f05b526e457a946e0575b4aed2660c249105923` is
  pushed and matched draft PR #7. Runs `29390112932` and `29390112933` passed
  `validate`, `verify`, and `browser-smoke`.
- No deployment, migration, Script Property change, Apps Script/Sheets/Drive
  external write, private operational data access, PR merge, Cloudflare,
  database, staging, or production change was performed.

## Unreleased - Slice 7 Food Committee workflow

- Added a versioned, privacy-minimized Food specialization to composite Event
  Logistics requests with controlled service class, headcount/servings,
  service window/location, aggregate dietary status, sourcing mode/reference,
  server-owned lead-time state, and deterministic attention flags.
- Added server-scoped Food queue/detail and revision-safe Food mutation routes,
  canonical `COM_FOOD` authorization, public read denial, sibling-payload
  filtering, idempotency/locking, durable history/audit, and evidence validation
  before completion.
- Added the active rendered Food request fields and Food Committee queue/update
  workflow, including component-linked delivery-proof upload, plus mock and all
  adapter/service contracts. New submissions remain behind the fail-closed
  `HAU_FOOD_REQUESTS_ENABLED` flag while stored Food children remain readable.
- Preserved Food attention across generic reopen/amend paths and required Food
  revisions for transition/cancel/reopen/amend/add/assign/escalate operations.
- Hardened Apps Script template assembly so minified `$&` tokens in generated
  JavaScript are inserted literally rather than interpreted by string
  replacement.
- Verification passes: `npm run check` (28 Vitest files / 231 tests, 30-module
  build, 30 Apps Script sources / 49 required functions, deterministic generated
  parity, two 311,165-byte standalone artifacts); full Playwright 61 passed / 101
  intentional skips / 0 failures; focused rendered Food workflow; changed-file
  sensitive scan; `git diff --check`; and final independent review PASS.
- Implementation commit `e85e27558f02e6a1f8b3b51be514a0382df24a10` is
  pushed; PR #7 matched it. Actions runs `29388258079` and `29388258076`
  passed `validate`, `verify`, and `browser-smoke`.
- No deployment, migration, Apps Script/Sheets/Drive external write, private
  operational data access, PR merge, Cloudflare, database, staging, or
  production change was performed.

## Unreleased - Naming and visibility baseline

### Clear workspace and GitHub names

- Standardized the single active checkout as `D:\Documents\HAU-USC Logistics\active\hau-usc-logistics-management-system` and renamed the active branch to `integration/v0.5-baseline`.
- Consolidated the legacy deployment configuration, institutional source, and repository-backup folders under `private-config`, `source-material`, and `backups` without changing file counts or byte counts. Archived the older non-Git Context Vault snapshot separately under `D:\Documents\GitHub\archives`.
- Moved both ignored Apps Script `.clasp.json` files to named restricted locations under `private-config\apps-script`; no private values entered Git or command output.
- Created and pushed five dated archive tags for the exact deployment, SDD, QR, routing, and approved-prototype heads. Created a second verified 37-ref complete-history bundle (1,574,863 bytes; SHA-256 `EE76A23C590679F2E19B95B047FCB18B42F520B28C547A7799A4EA342E53C765`).
- Closed PRs #3-#5 without merge, deleted their archived remote branches plus the routing and snapshot branches, and verified the branch list contains only `integration/v0.5-baseline` and `main`.
- GitHub closed PR #6 automatically during the active-branch rename and would not reopen it. Created draft PR #7 at the unchanged head and linked #6 as the preserved audit trail.
- Retired the clean deployment linked worktree after preserving its exact private configuration and branch tip. No product behavior, generated application source, merge, deployment, migration, external operational data, or production state changed.

## Unreleased - Phase 3.5 repository/workspace reconciliation

### Preservation and structure

- Froze clean synchronized Phase 3 head `6abfb411...`, rebuilt the complete
  local-folder/Git/worktree/branch/tag/PR inventory, and wrote the execution plan
  before cleanup.
- Created and verified a current 34-ref complete-history bundle (1,559,241
  bytes; SHA-256
  `924E52E027E40EAFB141A73C4431E0FAF0DA35432D84F36AA531E090B10BE04F`).
- Preserved the superseded routing clone's six runtime files exactly outside Git
  before removal: 6,791 bytes, zero mismatches, aggregate metadata SHA-256
  `548C972D309A3DFADDFB7B0A76AC6DFC53CA6102516CAA6B3174E54D0AD49535`.
- Moved the clean deployment dependency through `git worktree move` into the
  structured consolidation root and removed the verified redundant routing
  clone. Unique remote commits remain preserved by the remote ref and bundle.

### GitHub and Codex reconciliation

- Closed PR #1 and PR #2 without merge after proving their heads fully contained
  in active and bundled. Deleted their remote head branches plus the fully
  contained runtime-truthfulness branch; verified all three absent after prune.
- Retained PR #3-#6, every unique dependency branch, `main`, the historical
  snapshot, and all eight existing tags.
- Confirmed the requested project `.codex/config.toml`, `repo-mapper.toml`, and
  `log-triage.toml` active set exists only in the authoritative local checkout;
  the incompatible legacy routing config was not copied.
- Added the complete Phase 3.5 plan, folder/branch/PR maps, preservation proof,
  final-structure target, stop conditions, and rollback procedure.
- Verification passes: governance 8 files / 14 continuation fields; full
  `npm run check` 25 test files / 216 tests, 28-module build, 29 Apps Script
  sources / 47 functions, generated parity, two 293,406-byte artifacts, Git
  integrity, bundle, external manifest, structure, ref/PR, Codex placement, and
  diff checks.
- Checkpoint `efee2dda0148c5a70bd9c681e729a75372622b8e` is pushed and Actions
  runs `29385021439` / `29385021514` are green. Verified tag:
  `hau-usc-phase3.5-consolidation-efee2dd`.
- Corrected PR #6 from stale Slice 1 metadata to cumulative title
  `feat: complete HAU-USC v0.5 repository baseline` and current scope,
  validation, preservation, and boundary evidence; the PR remains a draft.
- No product behavior, generated application source, PR merge, deployment,
  migration, external operational data, or private configuration changed.

## Unreleased - Phase 3 workspace consolidation

### Repository and local workspace

- Classified Git branches, remote branches, six open draft PRs, rollback tags,
  eight registered worktrees, the independent planning clone, related archives,
  Downloads exports, generated folders, and private configuration using the
  accepted Phase 3 preservation labels.
- Created and verified a 47-ref complete-history Git bundle (1,518,711 bytes;
  SHA-256
  `DBA723337646546AC841A417FFFC9B2BA54C6FBEA2536B61CC1CF1F86CB5C7C0`)
  before cleanup.
- Preserved exact Drive/QA dirty generated files and binary patches plus two
  distinct ignored private configurations outside Git before retiring anything.
- Removed six patch-equivalent specialist worktrees with normal Git worktree
  commands and deleted only their bundle-preserved local refs. Removed the fully
  contained local Apps Script launch-readiness ref normally.
- Retained the authoritative checkout, V1 Deployment dependency, unique planning
  clone, remote branches, all PRs, checkpoint tags, release backups, private
  institutional source, and unknown Downloads exports.
- Moved only classified historical prototype/analysis and pre-sync generated
  folders intact into dated archives with count/byte/aggregate-hash evidence.
- Added `docs/WORKSPACE_CONSOLIDATION.md` with classification, preservation,
  deliberate non-actions, and recovery instructions.
- Verification passes: governance 8 files / 14 continuation fields; full
  `npm run check` 25 test files / 216 tests, 28-module build, 29 Apps Script
  sources / 47 functions, generated parity, and two 293,406-byte artifacts; Git
  diff/integrity, bundle verification, and external manifest parsing.
- Independent read-only review passed after one targeted documentation repair
  round with no remaining actionable findings.
- Checkpoint `58168edd4eec5ea0a063558dfb8071c4a7fd6c99` is pushed and PR #6
  `validate`, `verify`, and `browser-smoke` checks are green. Verified baseline
  tag: `hau-usc-phase3-baseline-58168ed`.
- No product behavior, generated repository source, external operational system,
  deployment, migration, PR state, or remote ref changed.

## 0.5.0 - Unreleased

### Phase 2 - Caveman Light and efficiency layer

- Added concise project intent/skill routing, Caveman Light short-command handling, current-task/history/resume packets, and token/context discipline without changing product behavior.
- Added supported project-scoped Codex configuration with two-thread/one-level delegation limits and two `gpt-5.6-terra`, low-reasoning, read-only profiles for bounded repository mapping and captured-log triage.
- Added deterministic agent and continuation validators to `npm run check`, plus compact repo/context helpers and a capped command runner that preserves full ignored logs and true exit codes while limiting displayed output.
- Added focused governance tests for required triggers, strict custom-agent/config safety (including rejected non-TOML escapes), fail-closed Git status, marked UTF-8-bounded context, resume fields, output tails, true exit codes, Windows command shims, and full-log preservation. After two bounded independent-review repair rounds, local gates pass 25 Vitest files / 216 tests, build, Apps Script/generated parity, standalone verification, lint, formatting, and diff checks.
- Independent final review is PASS with no actionable findings; the reviewer directly rechecked restricted escape behavior and all original repaired findings.
- Phase 2 implementation commit `8e82a8601e930ecf223a6e9170dc3d4dd9954bb1` is pushed to PR #6. Actions runs `29379450091` and `29379450069` passed `validate` (14s), `verify` (16s), and `browser-smoke` (1m53s); local, upstream, and PR heads matched.
- No Slice 7 behavior, generated application source, consolidation/deletion, deployment, migration, Apps Script action, external configuration, or Google Sheets/Drive write was performed.

### Slice 6 - Composite Event Logistics request foundation

- Added a feature-flagged composite Event Logistics foundation with one server-owned parent and one independently trackable child per non-empty Food, Materials, and Venue & Equipment section; blank sections create no child.
- Added canonical validation, exact duplicate-line consolidation, server-generated IDs, one-append Apps Script creation, idempotent replay, locked mutation paths, versioned parent/child relationships, derived parent status/attention flags, lifecycle transitions, cancellation/reopen/amend/add-section rules, assignment/escalation boundaries, history, audit, and requester-scoped reads.
- Added service/adaptor contracts, serialized mock mutations for concurrent-submit safety, source UI hierarchy/review flow, generated visual/standalone/Apps Script parity, and focused unit, Apps Script VM, and Chromium coverage.
- Local gates pass: lint; Vitest 24 files / 203 tests; `npm run verify` with 29 Apps Script sources / 47 required functions; full Playwright 61 passed / 101 intentional skips / 0 failed across 162 cases; focused composite browser smoke; and `git diff --check`. Independent implementation review is PASS. Commit `813f6b8f01b975e0952f553dc1bde4e3bc90fe0a` is pushed and PR #6 `validate`, `verify`, and `browser-smoke` are green.
- No specialization, catalog, restock, polling/live-update, hosting, database, migration, deployment, staging/production change, Script Property change, Google Sheets/Drive write, or private operational-data access was performed. `HAU_COMPOSITE_REQUESTS_ENABLED` remains an external opt-in flag and was not changed here.

### Slice 5 - Committee Main Hub and Inventory and Pantry vertical slice

- Added one capability-aware Committee Main Hub with active Food, Inventory and Pantry, Materials, and Director contexts, safe quick links, freshness/manual refresh state, bounded queue counts, and bounded record identifiers for detail reconciliation.
- Added server-side queues for new/unassigned, review, needs-information, due-soon, overdue, blocked, missing-evidence, escalated, inventory attention, lending review/overdue, upcoming needs, and recent completions; activity is a safe projection of immutable status history and audit rows.
- Propagated the validated committee context into existing inventory, lending, and restocking module reads without granting action authority from membership alone; reused the resolved authorization context to avoid repeated membership reads.
- Added additive bootstrap schema 1.3.0 dashboard collections, synthetic Apps Script scope/read/privacy tests, keyboard/browser coverage across the configured viewports, and rollback-safe hiding when the server dashboard projection is unavailable.
- Regenerated visual, standalone, and Apps Script outputs only through `npm run extract:visual` and the build/check pipeline. Local gates pass: 22 Vitest files / 183 tests, full Playwright 56 passed / 100 skipped / 0 failed across 156 cases, Apps Script/generated parity, and sensitive-value scan. Commit `a1784f15bc6a160ebf3c2405e9776b6517ce52e5` is pushed and PR #6 CI is green.
- No deployment, external configuration, Google Sheets/Drive write, private operational-data access, migration, or Slice 6 work was performed. Owner queue/timezone/staff-display policy confirmation and real-volume staging timing remain deferred to the later acceptance slice.

### Slice 4 - Private roster synchronization and access freshness

- Added a fail-closed Apps Script roster boundary that reads a private source only during an explicit admin/scheduled sync and validates the exact five-column source schema, strict types, canonical roles/committees, duplicate normalized identities, and committee scope.
- Added additive `14_USERS_ACCESS` freshness fields, `21_ACCESS_SYNC_RUNS`, `22_ACCESS_SYNC_SNAPSHOT`, and `23_ACCESS_SYNC_MEMBERSHIP_SNAPSHOT`; activation updates only roster-managed access/membership rows and preserves a local last-known-good rollback snapshot.
- Added explicit approval/disable/freshness Script Property controls, idempotent locked admin sync and emergency-deny endpoints, an at-most-once idempotent trigger installer, safe admin health metadata, and stale/emergency fail-closed access without source reads during ordinary startup.
- Added synthetic coverage for source configuration, schema/type/identity/scope failures, timeout/partial reads, conflict and revocation planning, membership activation, stale/emergency denial, non-disclosure, locking, and source-read isolation. No external configuration, Sheet/Drive write, deployment, or trigger activation was performed.
- Local gates pass: `npm run check` with 21 Vitest files / 177 tests, build, Apps Script validation, generated parity, and standalone verification; `npm run verify`; full Playwright with 50 passed / 100 intentional skips / 0 failed across 150 cases; `npm run lint`; `git diff --check`; and the changed-scope sensitive scan. Independent implementation review found no blocking issue. Commit `113b6002eb7b4e713b518c4e4fd5afa6c2aca1df` is pushed; PR #6 `validate`, `verify`, and `browser-smoke` are green. Manager review is pending before Slice 5.

### Phase E staging acceptance completed

STAGING ACCEPTANCE: SLICES 1-3 PASSED

- Accepted the staging handoff for immutable Version 18 with `HAU_BOOTSTRAP_CONTRACT_VERSION=2` and authorization contract v1/absent; Version 13 remains the rollback target.
- Confirmed staging root cause and repair: the read-only bootstrap-module callback completed at approximately 40 seconds, beyond the former 30-second browser deadline. `api_getBootstrapModule` now has a bounded 60-second client deadline; mutations and all other adapter calls remain at 30 seconds.
- The handoff reports 32-file pull-back parity, the owner-only web-app manifest preserved, the live v2 internal workspace reaching ready, and diagnostic/request-only privacy checks passing. Production and operational records were untouched.
- Local gates passed after the fix: `npm run check` with 20 Vitest files / 164 tests, `npm run verify`, full Playwright with 50 passed / 100 intentional skips / 0 failed across 150 cases, `git diff --check`, and the sensitive-value scan. Independent review was reported as PASS.
- Generated output was refreshed by the build path and verified; no generated file was hand-edited. Implementation commit: `fcb004e8be78d3d431164c95c7f847ab1033d927`.
- The staging handoff was accepted from supplied evidence; the local Chrome bridge was unavailable for a second live fetch. No push or production promotion was performed, and Slice 4 remains out of scope.

### Controlled staging acceptance checkpoint (Phase E previously blocked)

- Phase D compatibility acceptance passed on immutable staging Version 17 with bootstrap contract v1 and authorization contract v1/absent.
- Phase E v2 direct read-only endpoint checks passed, but the live v2 workspace remained in slow startup and reached the retryable read-only-service timeout instead of ready.
- Applied the authorized rollback by restoring the existing staging deployment pointer to immutable Version 13; the staging owner reports the bootstrap property is restored to `1`, and authorization contract v1/absent remains in force.
- A local synthetic end-to-end diagnosis covering the checked-in Apps Script DTO, JSON-safe callback normalization, and browser v2 validator passed; no local contract-shape defect or reproducible timeout was found.
- The staging acceptance marker remains intentionally absent. No production deployment, push, Slice 4 work, or private operational-data change was performed.

### Slice 3 - Canonical roles, committee scopes, and authorization contract

- Added a server-owned canonical authorization registry with six roles, immutable role IDs, exactly three committee IDs, separate capability and scope decisions, safe denial reasons, and fail-closed inactive, unknown, ambiguous, and unreconciled mappings.
- Added sanitized authorization metadata to the essential bootstrap/current-user contract and a client projection that consumes server capabilities instead of granting access from visible UI roles.
- Added additive authorization fields to `14_USERS_ACCESS`, the `20_USER_COMMITTEE_SCOPE` membership schema, the `HAU_AUTHORIZATION_CONTRACT_VERSION` rollout property, and an approval-gated mapping dry run/apply path that preserves legacy labels and immutable history.
- Recorded the owner-auto-accepted role/committee defaults and migration controls in `docs/AUTHORIZATION_CONTRACT.md`.
- Regenerated visual and standalone artifacts through `npm run extract:visual` and `npm run build`; no generated file was hand-edited.
- Final local verification passes: `npm run check` with ESLint, 20 Vitest files / 161 tests, production build, Apps Script validation (26 source files / 32 required functions), generated parity, and standalone verification; `npm run verify`; full Chromium 49 passed / 95 intentionally skipped / 0 failed across 144 cases; and `git diff --check`.
- Sensitive-value scan passes over the changed scope with no `.clasp` files, credentials, private identifiers, contacts, roster rows, private supplier-TIN values, evidence links, or operational records; only schema references and synthetic/mock placeholders are present. Regenerated standalone files retain only the pre-existing fictional preview baseline. Initial review findings were repaired; the implementation-validator found no blocking issue; no re-review PASS is claimed because the second reviewer did not return before handoff.
- Implementation commit `5107afc57904dccc5214fcafc20aba65c0622632` is pushed to the feature branch; PR #6 `validate`, `verify`, and `browser-smoke` are green. Manager review is required before Slice 4.
- No roster import, external authorization activation, migration, deployment, staging/production write, or private operational-data change was performed.

### Slice 2 - Essential bootstrap and lazy module contracts

- Added versioned allowlisted essential/module read contracts with request-only privacy enforcement, bounded pagination/filtering, fail-closed entity scope checks, JSON-safety validation, and compatibility-preserving runtime selection.
- Added Apps Script module APIs beside the existing bootstrap endpoint, request-scoped repository read deduplication, exact UTF-8 payload metrics with a 100 KiB response bound, bounded public-reference caching, in-flight deduplication, stale-response cancellation, and active-module rendering.
- Made the rollout flag server-controlled through `HAU_BOOTSTRAP_CONTRACT_VERSION`; the safe default is v1 and explicit v2 enables the new path.
- Added synthetic contract/controller/Apps Script VM/adapter/packaging coverage and regenerated visual/standalone/Apps Script artifacts through the repository build path.
- Verification passes: 18 Vitest files / 143 tests, focused packaged Chromium 15/15, and full Playwright 49 passed / 95 intentionally skipped / 0 failed across 144 cases. Initial independent-review FAIL findings were repaired; current-snapshot re-review returned WARN/incomplete, so no re-review PASS is claimed.
- No deployment, external-system write, private operational-data change, or Slice 3+ feature work was performed.

- Working branch: `feat/live-sync-lending-search-catalog-controls`
- Starting commit: `8b40f60a48323065ad69517e37915a33f32a51d2`
- Ending commit: `576393f1be28687d984ea7632a2501aa8d3fc30d`; pushed to the feature branch with local/upstream parity `0 0`
- Draft PR #6 is open and its `validate`, `verify`, and `browser-smoke` checks pass; manager review remains pending.

### P0 Production Bootstrap Diagnosis and Recovery

- Diagnosed the unhandled post-response startup failure boundary and added named bootstrap stages from request through first render and ready.
- Added contract validation before normalization, JSON-safety checks, one-active-attempt recovery, obsolete-callback protection, eight-second slow-state messaging, safe stage diagnostics, and an accessible Retry surface with an idempotent terminal finalizer.
- Added synthetic empty/realistic-volume fixtures and failure seams for transport, malformed responses, every post-response startup stage, timeout/late success, Retry, focus/live-region behavior, and packaged Apps Script execution.
- Preserved the existing Apps Script adapter timeout/callback behavior and made no endpoint, payload, schema, deployment, or external-system change.
- Verification: `npm ci`, `npm run check`, full Vitest (15 files / 118 tests), focused packaged Chromium (14 tests), and the six-project Playwright run (48 passed, 90 scoped skips, 0 failed across 138 cases). A synthetic 390x844 shell measurement rendered in 81 ms; staging p95 remains unrun.
- No staging/production deployment, Apps Script push, Google Sheets/Drive write, or other external action was performed.

### Added

- A compact `api_getDataRevision` read endpoint backed by `DATA_REVISION` and `DATA_REVISION_UPDATED_AT` rows in `17_CONFIG`.
- Five-second internal polling while the document is visible and online, with focus, visibility, reconnect, and manual-refresh checks, non-overlapping requests, and bounded error backoff. This is polling, not WebSockets.
- An idempotent `setupOperationalEditTrigger()` installer and `handleOperationalSheetEdit(e)` handler so direct human edits to the configured operational spreadsheet advance the shared revision.
- Dirty-form and active-modal protection. Background changes show a non-blocking update banner with Refresh now and Continue editing choices instead of silently discarding input.
- Accessible predictive Lending Hub search with exact/prefix/token/substring ranking, keyboard navigation, an authoritative hidden Item ID, selected-item summary, and distinct out-of-stock, verification, audience, circulation, quantity, and no-match explanations.
- Website catalog APIs and controls for item lookup, creation, metadata editing, storage-context changes, archive, and restore.
- Dedicated `Can_Manage_Catalog` authorization with ADMIN and DOL_DIRECTOR fallback when the new cell is blank; no general grant to other existing users.
- Handling values `CONSUMABLE`, `LOANABLE`, `REUSABLE_ASSET`, and `NON_CIRCULATING`, plus lending audiences `NOT_AVAILABLE_FOR_LENDING`, `USC_STAFF_ONLY`, `STUDENTS_AND_STAFF`, and the future-ready `DOL_INTERNAL_ONLY` value.

### Changed

- Apps Script mutations reload and normalize authoritative bootstrap state before rendering success. If the write succeeds and reload fails, the UI reports that the action was recorded, exposes a safe Refresh action, and never automatically resubmits the mutation.
- Retryable transport failures retain the same client request ID for an identical mutation attempt, so a response lost after a server commit replays idempotently instead of creating a duplicate. Mutation forms and release controls disable while in flight.
- Lending creation, approval, handoff, and return now revalidate item status, verification state, handling, borrower audience, available-to-promise quantity, maximum per-ticket quantity, and due-date rules on the server.
- Inventory creation, editing, storage updates, archive, and restore now use locked, idempotent, permission-checked Apps Script services with server IDs, before/after audit data, status history where applicable, and exactly one data-revision advance.
- Item creation records initial quantity through an append-only ledger movement only when the catalog manager also has receive or admin permission; catalog-only users must create at zero and use an approved receiving workflow. VERIFY and inactive items can never receive opening stock. Metadata edits cannot overwrite current stock, reservations, opening quantity, provenance, or posted history.
- Request-only bootstrap sanitization is determined server-side from the resolved identity as well as the trusted page mode; a public or REQUESTER caller cannot obtain internal bootstrap fields by sending `requestOnly: false`.
- Unit changes are blocked when ledger, reservation, lending, request-line, restock, or release history depends on the item. Archive is blocked unless quantity and active dependencies are clear; restore preserves historical records and returns verification-marked items to `VERIFY`.

### Schema

- Appended `Catalog_Type`, `Storage_Location`, `Reorder_Threshold`, `Lending_Audience`, `Default_Loan_Days`, `Maximum_Loan_Qty`, `Approval_Required`, `Updated_At`, `Updated_By`, and `Notes` to `01_ITEM_MASTER` without reordering existing columns.
- Appended `Can_Manage_Catalog` to `14_USERS_ACCESS`.
- Added `DATA_REVISION` and `DATA_REVISION_UPDATED_AT` configuration rows to `17_CONFIG`.
- `setupDatabase()` remains additive and repeatable. Blank legacy metadata defaults fail closed: active circulating items default to `USC_STAFF_ONLY`; VERIFY, inactive, archived, and non-circulating items default to `NOT_AVAILABLE_FOR_LENDING`; returnable items default to three loan days; maximum quantity defaults conservatively to one; approval defaults to true.

### Verification to date

- `npm ci`: passed.
- ESLint: passed.
- Vitest: 12 files / 93 tests passed.
- Focused Chromium 390 px 0.5.0 suite: 4 passed.
- `npm run check`: passed, including a 22-module Vite build, Apps Script validation across 24 source files and 27 required entry points, generated-file parity, and standalone verification.
- `npm run verify`: passed.
- Complete Playwright matrix at 320, 390, 768, 1024, 1366, and 1440 px: 38 passed, 40 intentionally scoped skips, 0 failed.
- Deterministic rebuild: passed; the 238,891-byte `dist/index.html` and shareable copy remained byte-identical with SHA-256 `8192ddff053f9776ba41f74be4eadf9c627b6db638db0cf7f8b6cf03d410ed8f`, and the 615-byte `apps-script/Index.html` remained `e31ed283e193703ec5a403e3b9d40ba504d17f57a3dc2eb02424741f1aa73495`.

### External actions

- No `clasp push`, Apps Script version creation, deployment update, Sheet/Drive write, trigger modification, production action, or PR #2 merge was performed.
- Immutable staging Version 9 and production remain untouched.

## 0.4.0 - 2026-07-12

### Added

- Production-oriented Google Apps Script backend with Sheet repositories, authorization, locking, idempotency, structured errors, append-only inventory, workflow services, evidence uploads, migration, reconciliation, setup, backup, and triggers.
- Strict Apps Script and future HTTP browser adapters while preserving mock development.
- Privacy-safe evidence labels/filenames, digest duplicate detection, configured Drive routing, and quarantine recovery.
- Apps Script staging bundle, manifest, clasp example, CI workflows, schema validation record, deployment/security/backup/migration/launch runbooks, and PostgreSQL/Supabase mapping.
- Repository-level ChatGPT web/Codex collaboration protocol, start-of-task Git handshake, one-writer rule, manager task packet, and Codex handoff packet.
- Regression coverage for missing runtime properties, explicit staging and production selection, and no hardcoded spreadsheet fallback.
- Parser-safe Apps Script packaging library, deterministic assembled-document validation, generated-file diagnostics/parity checks, and a staging-only diagnostic shell.
- Unit and Chromium regressions for literal `</script>` sequences, multiple script/style outputs, minified bootstrap identifiers, visible-source leakage, and mocked `api_getBootstrapData` execution.
- Failure-only CI diagnostic artifacts for concise verification and browser logs.

### Changed

- Wired approved visual actions to server adapters for request review, quote selection, receiving, release, lending, and event-item transfer.
- Request acceptance now preflights all stock decisions before applying reservations and line transitions.
- Restock and deliverable receipts accumulate by line and reject over-receipt before operational writes.
- Lending partial returns account for lost/damaged quantities without falsely restoring stock.
- Requester catalog/bootstrap payloads no longer expose exact stock balances, reservations, verification notes, or legacy trace fields; the UI defers authoritative stock routing to DOL review.
- Evidence uploads now require a server-side receive, release, or admin permission before file processing.
- Apps Script now resolves environment, operational spreadsheet ID, and backup spreadsheet ID only from required Script Properties.
- Setup, Drive configuration rows, migration/reconciliation access, launch backups, schema reports, and health checks now use the explicitly resolved environment target.
- Admin health checks report the active environment and target spreadsheet IDs for operator verification.
- Apps Script body, CSS, and JavaScript are now generated from separate Vite outputs instead of being extracted from the minified standalone HTML.
- Apps Script generated style/script partials now contain their complete executable elements, avoiding contextual force-printing inside outer container tags.

### Fixed

- Visual-baseline generated-notice removal now supports LF, CRLF, and no trailing newline while retaining strict comparison of all visual markup and unrelated comments.
- Removed hardcoded operational and backup spreadsheet IDs from runtime code, preventing staging from silently falling back to production.
- Initial setup can bootstrap the administrator when `14_USERS_ACCESS` has not yet been created or seeded.
- Health-check configuration details are now restricted to administrators.
- Raw-text closing sequences are escaped before JavaScript or CSS is embedded in Apps Script HTML.
- Visible-JavaScript detection no longer misclassifies ordinary UI text such as `Lead-time class`.
- Apps Script browser packaging verification is network-independent and executes from an assembled in-memory document.
- Corrected the controlled staging deployment after clasp 3.3.0 skipped a manifest-confirmation push, leaving Version 7 on stale raw script/style partials and causing `Exception: Malformed HTML content`.
- Preserved the existing staging `webapp` manifest settings while force-pushing the reviewed 29-file package, then updated the existing deployment ID to immutable Version 8.
- Propagated the server-trusted Apps Script request-only flag through `body[data-request-only]` so the sandboxed browser does not depend on the outer `/exec` query string.
- Added internal/request-only package assembly tests that assert one bootstrap call with the correct `requestOnly` payload and verify the request-only shell hides internal navigation.
- Apps Script runtime controls now use the trusted server-rendered environment instead of assuming staging.
- Generated body markup now carries both `data-request-only` and `data-app-environment`.
- Apps Script pages display `Apps Script · staging` or `Apps Script · production` according to the resolved Script Property environment.
- `Reset Demo Data` remains available in local mock mode but is hidden, disabled, removed from keyboard focus, and left without a click handler in Apps Script mode.
- The visual extractor now normalizes CRLF input before applying compatibility-runtime bridges, preventing Windows extraction from silently dropping the request-only privacy and accessibility repairs.

### Verified

- Live production/backup comparison was read-only and found the four legacy tabs unchanged.
- On Windows with `core.autocrlf=true`, the focused visual-baseline suite passed 4 tests and the full Vitest suite passed 55 tests across 9 files before staging isolation.
- GitHub `npm run check` passed after staging-isolation implementation, including lint, Vitest, build, Apps Script static validation, and artifact verification.
- GitHub Apps Script static validation passed after staging-isolation implementation.
- GitHub CI completed the earlier Playwright matrix at six viewport widths before the packaging incident.
- Packaging-repair code checkpoint `74f2f0f...` passed GitHub CI and Apps Script static validation.
- The repaired checkpoint passed 10 Vitest files / 67 tests, 23 Apps Script source files / 18 required functions, deterministic package parity, standalone artifact verification, and the six-viewport browser-smoke matrix.
- Generated Apps Script package sizes were 512 bytes (`Index.html`), 28,967 bytes (`AppBody.html`), 26,850 bytes (`AppStyles.html`), and 153,161 bytes (`AppScript.html`).
- A post-push remote pull matched all 29 reviewed staging files and confirmed one application script and one application style element.
- Version 8 `?diagnostic=1` passed body, style, inline-script, and harmless server-call checks.
- Version 8 internal `/exec` rendered the Apps Script staging workspace, cleared the loading overlay, and exposed no raw JavaScript.
- No operational Sheet/Drive workflow, migration application, trigger change, production action, or PR merge was performed during staging recovery.
- `npm run check` passed: ESLint, 10 Vitest files / 69 tests, Vite build, Apps Script static validation, deterministic package checks, and standalone artifact verification.
- `npm run test:e2e` passed with 29 tests and 25 intentional viewport-specific skips.
- Both standalone HTML artifacts verified at 210,112 bytes each.

### Known issues

- The internal Apps Script staging UI still displays the legacy `Preview mode · local data` badge and `Reset Demo Data` control. The adapter is live and the reset handler is blocked outside mock mode, but the visible wording must be corrected before workflow acceptance.
- Live Version 8 `?request=1` currently renders the internal workspace because the deployed runtime loses the outer query string inside the Apps Script iframe. The repository repair is verified locally but not yet deployed.
- Repository verification for the request-only repair passed `npm run check` (68 unit tests) and the full Playwright matrix (27 passed, 15 intentionally skipped across 42 cases).
- A bounded end-to-end staging workflow remains pending.

## 0.3.2 - 2026-07-12

### Prepared

- Locked the shareable Final prototype as the approved visual direction for the upcoming demo.
- Added `docs/FINAL_DEMO_BASELINE.md` with launch instructions, guided demo order, safety boundary, and presentation acceptance checklist.
- Documented the earlier Revision 02 file as historical reference rather than the active visual baseline.

## 0.3.1 - 2026-07-12

### Restored

- Reinstated the exact archived Final prototype markup, palette, typography, spacing, navigation, panels, forms, tables, and responsive rules as the active visual layer.
- Restored the original preview interaction runtime so navigation and operational controls execute when the artifact is opened in a real browser.

### Added

- Reproducible extraction into shell fragments, seven view HTML modules, and eight ordered CSS modules.
- Visual-equivalence tests for markup, CSS cascade, and interaction hooks.
- Standalone artifact verification and classic inline-script output for direct `dist/index.html` use.
- Root-level `HAU-USC_Logistics-Prototype-Shareable.html`, regenerated from and hash-verified against the deployment bundle.

### Documented

- The compatibility-runtime boundary and the recommended view-by-view migration into the hardened modular service contract.

## 0.3.0 - 2026-07-11

### Added

- Vite + vanilla JavaScript ES-module repository with single-file output.
- Vitest domain/integration coverage and Playwright responsive smoke suite.
- Ledger-only quantity truth, revision-based indexes, state migrations, structured errors, correlation IDs, and idempotency records.
- Sanitized request-only bootstrap, centralized preview permissions, mobile bottom navigation, accessible modal/drawer infrastructure, reports, diagnostics, cycle-count and emergency-issue previews.
- Architecture, domain, data-model, Apps Script, accessibility, test-plan, roadmap, and limitation documentation.

### Fixed

- Duplicate transfer transaction IDs.
- Non-cumulative deliverable/restock receiving.
- Duplicate lending handoff and return postings.
- Service-level over-transfer acceptance.
- Unawaited reservation failure and partial mutation during acceptance.
- Restock receipt sibling auto-completion.
- Release validation against request remainder, reservation, and physical/event balance.
- Parent request statuses now derive from child lines.

### Preserved

- HAU-USC visual identity, request/stock routing, Release Desk, lending, restocking, procurement, canvass, inventory, request-only mode, status chips, cards, tables, mobile cards, and preview safeguards.
