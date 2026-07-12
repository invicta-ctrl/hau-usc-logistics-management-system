# Work Continuation

## Latest verified checkpoint — Version 8 rendering recovered; request-only and workflow acceptance pending

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

## Next bounded milestone — request-only privacy and UI truthfulness

1. Test the existing version-8 `?request=1` entry point with the appropriate account and no operational writes.
2. Confirm there is no internal navigation and no exact inventory, user, ledger, reservation, supplier, borrower, evidence-internal, audit, error, health, or configuration data.
3. Implement a small browser-only correction so Apps Script mode replaces every visible preview badge and hides the local-only reset control.
4. Add focused browser coverage for those labels/controls without changing the approved visual layout or backend behavior.
5. Run the focused packaging/browser tests, `npm run check`, and the full browser matrix once at milestone end.
6. Do not run an operational workflow until request-only privacy and the UI correction are reviewed.

## External-write boundary

The authorized version-8 recovery push/deployment is complete. This checkpoint authorizes no further `clasp push`, deployment version, access seeding, staging workflow write, production work, migration application, or PR merge without a new explicit approval.

## Fresh-chat recovery prompt

> Continue after the verified Version 8 staging rendering recovery. Verify repository `invicta-ctrl/hau-usc-logistics-management-system`, branch `feat/apps-script-backend-and-launch-readiness`, draft PR #2, and the latest GitHub CI. Read `AGENTS.md`, `PROJECT_STATUS.md`, `docs/WORK_CONTINUATION.md`, and `docs/INCIDENT_APPS_SCRIPT_STAGING_WEBAPP_2026-07-12.md`. Do not repeat setup, Drive provisioning, migration, reconciliation, backup, triggers, or deployment. First verify `?request=1` privacy without writes, then correct the misleading preview badge/reset control in Apps Script mode. Do not touch production or merge PR #2.
