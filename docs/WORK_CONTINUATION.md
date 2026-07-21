# Work Continuation

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
