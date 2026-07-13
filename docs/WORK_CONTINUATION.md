# Work Continuation

## Current checkpoint - Slice 3 canonical roles, committee scopes, and authorization contract

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
