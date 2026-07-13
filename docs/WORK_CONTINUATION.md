# Work Continuation

## CURRENT TASK RESUME BLOCK

- Date: `2026-07-13` (`Asia/Manila`)
- Authorized objective: complete the V1 one-shot implementation, verified demo deployment, release evidence, and future-platform documentation as far as verified credentials, rollback, and provider controls safely allow.
- Worktree: `D:\Documents\DOL Website GitHub - V1 Deployment`
- Branch: `feat/v1-one-shot-demo-and-deployment`
- Starting commit: `5a3b1248569b9a5f9148b95bcd4d2bc829639c9f`
- Integrated implementation HEAD before this checkpoint record: `57876f1` (`fix: align published content bootstrap contracts`).
- Upstream: intentionally absent until the first verified push of the new branch.
- Current phase: Phase 2 — frontend, backend, and documentation slices integrated; additive Sheets/schema work is in progress before Drive and independent QA.
- Protected pull request: PR #2 must not be modified, retargeted, closed, or merged.
- Live state at task start: committed records claim staging immutable Version 9, but the only ignored authenticated clasp target conflicts with that record; the deployed staging version is therefore unverified for this task. Production remains untouched.
- External backup: verified Git bundle `hau-usc-logistics-management-system-20260713-124624.bundle`, SHA-256 `255d9769398533c881fd9a6f43b776ef87c411d05d6a311bb7e299c1bd635c3c`.

### Verified baseline

- Original continuation checkout fetched successfully, was clean, and was `0` ahead / `0` behind its upstream at `5a3b1248569b9a5f9148b95bcd4d2bc829639c9f`.
- The isolated worktree started clean from that exact commit.
- `npm ci`: passed; 139 packages installed, 0 reported vulnerabilities.
- `npm test`: passed; 12 files / 93 tests.
- `npm run check`: passed, including lint, tests, deterministic build, Apps Script static/package validation, and standalone verification.
- `npm run verify`: passed.
- `npm run test:e2e`: passed; 38 passed, 40 intentionally scoped skips, 0 failed across 320, 390, 768, 1024, 1366, and 1440 px projects.
- No Sheet, Drive, Apps Script source, deployment, trigger, production, PR, tag, or release mutation has occurred in this task.

### Integrated implementation checkpoint

- Specialist 1 commit `971417e` was reviewed and integrated as `6cec509`: trusted request/internal/lending portal modes, strict public mock allowlists, lending receipt with no public history, request review, duplicate consolidation, restock compatibility, partial release/return controls, structured Roadmap and What Changed views, permission-gated admin UI, accessibility affordances, and focused browser coverage.
- Specialist 2 commit `eba02bb` was reviewed and integrated as `95423cd`: server-owned portal routing, lending-only bootstrap, admin/content/branding APIs, scoped command journal support, staff-borrower verification, VERIFY resolution, canvass lifecycle, partial release/full-return accounting, and one Apps Script browser gateway.
- Specialist 6 commit `561b53d` was reviewed and integrated as `cf06070`: governance validators, narrower CI diagnostics, canonical architecture/API/operations/security/onboarding guides, and an official-source future-platform matrix plus proposed ADR.
- Orchestrator integration commit `57876f1` aligns the content-revert alias and exposes safe published content/branding through live bootstraps; published structured bodies are normalized for the existing Roadmap and What Changed renderer.
- Integrated `npm run check:governance`: passed; 37-line AGENTS guardrail, continuation guardrail, 228 tracked paths sensitive-clean, and 44 Markdown documents/link-clean.
- Integrated `npm test`: passed; 13 files / 105 tests. Focused backend security: 12 / 12 passed. ESLint and diff checks passed.
- Specialist 1 evidence before integration: 93 unit tests passed; full Playwright run passed with 42 tests and 60 configured viewport/applicability skips.
- Specialist 2 evidence before integration: 104 unit tests, lint, Apps Script parsing, build, Apps Script package validation, and distribution verification passed.
- Specialist 6 evidence before integration: repository check passed; Playwright passed with 38 tests and 40 configured skips.
- No specialist pushed a branch or performed a live Google/GitHub mutation.

### Six-specialist ownership map

| Specialist | Primary ownership | Shared-file rule |
|---|---|---|
| 1 — Frontend, UX, accessibility, PWA | `src/visual/`, frontend feature/view/component/state/style files, public route behavior, frontend-focused tests when assigned | Must not hand-edit generated HTML; adapter/API changes require orchestrator approval. |
| 2 — Apps Script backend, APIs, auth | Apps Script service/controller/auth/validation/router files and browser adapter contracts assigned by the orchestrator | Must not change schema headers, Drive storage implementation, deployment state, or generated artifacts independently. |
| 3 — Sheets schema, ledger, migration | `Config.gs`, `Setup.gs`, Sheet repositories, migration/reconciliation/ledger schema, data dictionary and schema-focused tests | Additive changes only; never rewrite posted ledger or legacy evidence and never transact `VERIFY`. |
| 4 — Drive, uploads, evidence, branding | Drive/evidence/branding storage services, upload validation/naming, Drive documentation, storage-focused tests | Folder resolution must fail closed; never expose IDs, private links, or evidence. |
| 5 — Security, privacy, QA | Test files, threat model, security/secret validators, adversarial/browser evidence and defect reports | May not weaken assertions or change product behavior except through an explicitly reassigned repair. |
| 6 — Integration, DevOps, docs, future platform | package/CI/build/deployment integration, canonical documentation, future-platform research, release evidence | Owns final integration only after specialist work is accepted; live writes remain orchestrator-gated. |

The orchestrator owns `README.md`, `CHANGELOG.md`, `PROJECT_STATUS.md`, this resume block, cross-cutting contract decisions, generated-artifact regeneration, Git integration, and every live-system go/no-go. No two specialists may edit the same shared file concurrently.

### Frozen cross-cutting contracts

- Visual authority remains `legacy/HAU-USC_Logistics-Prototype.original.html`; visual extraction and generated build scripts own derived markup/styles.
- Browser code uses service adapters; only `src/services/apps-script-adapter.js` may call `google.script.run`.
- Existing server-generated stable IDs and current sheet names remain authoritative. Schema changes are append-only and idempotent.
- Posted ledger, audit, status-history, and legacy provenance records are immutable. Corrections use documented reversals or adjustments.
- `VERIFY`, inactive, archived, and non-circulating items cannot transact.
- Current permissions remain `Can_Review`, `Can_Release`, `Can_Receive`, `Can_Admin`, and `Can_Manage_Catalog`. New admin surfaces use server-checked `Can_Admin` unless a narrower reviewed permission is added additively.
- Request-only and lending-only bootstraps are sanitized server-side. Student ID is never authorization; private requester history stays unavailable unless a scoped expiring-token contract is implemented and tested.
- Every state-changing Apps Script call requires validation, authorization, server IDs, idempotency, a lock where state may race, audit/history evidence, and exactly one aggregate revision increment for a successful non-replay mutation.
- Error responses retain stable codes, safe messages, correlation IDs, retryability, and bounded safe details; public responses never include stack traces or configured resource values.
- Uploads require permission checks before byte decoding/Drive access, MIME-extension-size validation, sanitized deterministic names, protected original-name metadata, checksums/deduplication where supported, and fail-closed configured folders.
- Live mutation remains blocked until the intended account, Script project, operational Sheet, backup Sheet, Drive mappings, current deployment/rollback version, and fresh backup are verified without exposing their identifiers.

### Immediate known gaps and next actions

- The current branch redacts a previously tracked spreadsheet identifier from `docs/BACKUP_AND_RECOVERY.md`. Commit history still contains the historical value; do not rewrite protected history automatically. The resource owner must verify access restrictions and rotate/replace the identifier if institutional policy requires it before the no-live-ID release gate can be accepted.
- Complete and integrate Specialist 3's additive schema, formula-safety, partial-repair, and backup-verification slice.
- Run Specialist 4 against that integrated schema for canonical Drive resolution, upload validation, quarantine, permission diagnostics, and branding storage contracts.
- Run Specialist 5 independently across the integrated branch, repair reproducible failures, regenerate owned artifacts, and rerun every required local check and browser viewport.
- Reconcile the frontend administrative forms with final backend/Drive metadata contracts and record unsupported live-only actions honestly.
- Keep all live Google and release actions paused until repository implementation, target verification, backup, and rollback gates pass.

### External blocker — staging target conflict

- The only ignored authenticated `.clasp.json` is in the original checkout, not this worktree.
- A bounded read-only remote inventory found that its project/deployment/version state does not match the committed record for staging immutable Version 9 and includes a production-labeled immutable version.
- This is a conflicting-authoritative-target condition. Do not copy that configuration into the V1 worktree and do not run `clasp push`, create a version, update a deployment, inspect or change live properties/triggers, or mutate a Sheet/Drive target through it.
- Smallest human action: the deployment owner must supply or confirm the ignored `.clasp.json` for the documented Version 9 staging project, with the intended account and environment, without posting its Script ID in chat or git.
- Repository implementation, tests, documentation, GitHub branch/PR preparation, and other non-live work continue independently.

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

## Latest checkpoint — Version 9 live privacy acceptance and runtime-truthfulness repair

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

### Next action

The repository review and CI gate are complete. The next bounded milestone is one explicitly authorized Version 10 staging deployment of commit `7156c256414b797f4b0f19431b399009f31feebd`, preserving the current deployment ID and performing no operational Sheet or Drive writes. After deployment, retest the diagnostic route, authorized internal route, request-only privacy boundary, accurate Apps Script environment label, and absence of the local-only reset control.

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

The exact live Version 6 exception remains partly unobservable because Apps Script omitted the oversized log. The repository does not prove that a literal `</script>` in the real Version 6 application bundle was the sole live cause. One controlled staging deployment is therefore required to confirm the HTML Service result.

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

Remaining verified defect: the visible internal header still says `Preview mode · local data` and shows `Reset Demo Data`. This is stale UI wording, not a mock fallback; the sidebar changes to `Apps Script staging` only after non-mock bootstrap and the reset handler refuses to act outside mock mode.

## Request-only privacy incident and repository repair

Live Version 8 `/exec?request=1` rendered the full internal workspace. Stop all staging workflow testing and do not broaden access.

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

The repair is committed only after focused/full checks pass. It has not been pushed to Apps Script or deployed; live Version 8 remains unsuitable for request-only access.

Local verification passed `npm run check` (68 unit tests) and `npm run test:e2e` (27 passed, 15 intentionally skipped across 42 browser cases).

## Staging work already completed — do not repeat

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

Do not run `applyApprovedMigration()`. Do not touch production. Do not merge PR #2 yet.

## Next bounded milestone — review and deploy request-only privacy repair

1. Review the request-only code/test diff and pushed CI evidence.
2. With new explicit authorization, preserve the remote web-app manifest, push the reviewed package, verify a remote pull, create one immutable version, and update the existing deployment ID.
3. Retest `?diagnostic=1`, authorized internal `/exec`, and `?request=1` without operational writes.
4. Confirm request-only mode has no internal navigation and no exact inventory, user, ledger, reservation, supplier, borrower, evidence-internal, audit, error, health, or configuration data.
5. Only after privacy passes, implement the separate preview badge/reset-control UI correction.
6. Do not run an operational workflow until both privacy and UI truthfulness are reviewed.

## External-write boundary

The authorized Version 8 recovery push/deployment is complete. The request-only repair was later accepted live in Version 9. This historical checkpoint authorizes no further `clasp push`, deployment version, access seeding, staging workflow write, production work, migration application, or PR merge without a new explicit approval.

## Fresh-chat recovery prompt

> Continue after the confirmed Version 8 request-only privacy failure. Verify repository `invicta-ctrl/hau-usc-logistics-management-system`, branch `feat/apps-script-backend-and-launch-readiness`, draft PR #2, and the latest GitHub CI. Read `AGENTS.md`, `PROJECT_STATUS.md`, `docs/WORK_CONTINUATION.md`, and `docs/INCIDENT_APPS_SCRIPT_STAGING_WEBAPP_2026-07-12.md`. The repository repair injects the server request flag into `body[data-request-only]`; review its tests and CI. Do not deploy without new explicit authorization, do not run workflows, and do not repeat setup, Drive, migration, reconciliation, backup, or triggers.
