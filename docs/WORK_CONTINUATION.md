# Work Continuation

## Codex routing implementation checkpoint — local feature branch

- Date: `2026-07-13` (`Asia/Manila`)
- Branch: `feat/automated-codex-model-routing`
- Starting commit: `81efe82` (current synchronized launch-readiness head)
- Scope: project-local instruction refinement, deterministic routing, launcher,
  hooks, custom agents, schemas, examples, tests, and documentation.
- External actions: none. No Apps Script push, deployment, Sheet/Drive write,
  migration, access seeding, production action, merge, or PR update occurred.
- Runtime safety: `.codex/runtime/` is gitignored; no live prompt or route is
  intended for commit.
- Verification: `npm run codex:validate` passed; routing and repository tests
  passed (11 files / 82 tests); ESLint passed; `npm run check` passed including
  Vite build, Apps Script static validation, generated-package checks, and
  standalone artifact verification (210,313 bytes each); `npm run test:e2e`
  passed (29 passed, 25 intentionally skipped).
- Live refinement smoke: the installed Codex CLI (`0.144.0-alpha.4`) refined a
  rough inventory-search instruction through `gpt-5.6-terra` at medium effort;
  the result classified as `partial_task`, validated, and routed to exploration
  without editing the repository or performing external actions.
- Generated HTML artifacts were restored after the build check; no protected
  generated output is included in this routing change.

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
