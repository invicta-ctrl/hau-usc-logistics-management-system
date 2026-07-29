# Apps Script Staging Web App Incident — 2026-07-12

## Current status

**Version 8 internal rendering recovered; request-only privacy failure confirmed and repository repair pending deployment.**

- Repository: `invicta-ctrl/hau-usc-logistics-management-system`
- Branch: `feat/apps-script-backend-and-launch-readiness`
- Pull request: draft PR #2
- Packaging-repair code checkpoint: `74f2f0f342bc9513681693be0fd542cf1f4d923a`
- Documentation checkpoint before live recovery: `09acfd63c854c3d1844f39a7bee080be5542ad7d`
- Current staging deployment: immutable version 8 on the existing deployment ID
- GitHub Apps Script static check run 47: passed
- GitHub CI run 47: passed
- Production resources: untouched

Always verify the current remote head because documentation commits may follow the code checkpoint.

## Purpose

This document records the staging HTML Service incident, the locally confirmed failure mechanism, the repair, the remaining uncertainty, and the exact boundary for one controlled staging deployment.

This was and remains a **staging** incident, not a production incident.

## Staging setup completed before the incident

The following work completed successfully before rendering failed:

- Dedicated staging Apps Script project and Apps Script API enablement
- Local `clasp` authentication and source push
- Required `STAGING` Script Properties
- Runtime target validation
- Database setup and schema validation
- Dedicated Drive root and evidence child folders
- Drive configuration validation
- Migration dry-run and reconciliation
- Timestamped launch backup
- Daily overdue-lending and scheduled-backup triggers
- Initial web app deployment versions

Exact IDs and deployment URLs are intentionally not committed. No production migration was applied and PR #2 was not merged.

## Observed incident timeline

### Stage 1 — blank page

The first staging web app deployment returned a blank white Apps Script page. The document title existed, but the body HTML length was zero.

### Stage 2 — shell rendered but bootstrap did not run

After the bundle was split into `Index.html`, `AppBody.html`, `AppStyles.html`, and `AppScript.html`, the interface shell appeared but remained on:

> Preparing the Logistics workspace...

Apps Script Executions showed `doGet` calls but no `api_getBootstrapData` execution.

### Stage 3 — Version 6 failed during template evaluation

After additional generator changes:

- `doGet` failed in roughly half a second;
- Apps Script reported only `The log entry was too large and was omitted.`;
- raw minified JavaScript appeared as visible page text;
- the dashboard did not initialize;
- no end-to-end workflow was run.

The original server exception remains unavailable because Apps Script omitted the oversized entry.

### Stage 4 — Version 7 repeated the old failure because clasp skipped the push

The approved non-force `clasp push` printed `Skipping push`. Clasp 3.3.0 had detected a changed `appsscript.json`, attempted to request manifest-overwrite confirmation, and declined automatically in the non-interactive session. Version 7 was created from unchanged remote source and `/exec` returned `Exception: Malformed HTML content` with minified JavaScript in the error page.

A bounded remote pull confirmed Version 7 still used the pre-repair structure: outer script/style wrappers in `Index.html` and raw wrapper-free source in the included `AppScript.html` and `AppStyles.html` files.

### Stage 5 — Corrective push and Version 8 recovered rendering

The existing remote `webapp` manifest settings were preserved exactly. One authorized `clasp push --force` pushed all 29 reviewed files. A fresh remote pull matched all 29 local files and confirmed exactly one application script and one application style element.

Immutable version 8 was created and the same staging deployment ID was updated. `?diagnostic=1` passed all four checks, and authorized internal `/exec` rendered normally with no raw JavaScript, no malformed-HTML error, and a cleared loading overlay.

### Stage 6 — Version 8 request-only route exposed the internal workspace

Opening `/exec?request=1` rendered the full internal sidebar, overview metrics, and staff workspaces. This failed the request-only privacy acceptance test. No operational action was performed.

The server correctly set `template.requestOnly` from `e.parameter.request`, but the generated template did not emit the value. Browser code read `location.search` inside the Apps Script sandbox iframe, which did not contain the outer `/exec?request=1` query. The bootstrap call therefore used `requestOnly: false`.

The repository repair injects the server boolean into `body[data-request-only]`, makes the compatibility runtime consume it, and adds internal/request-only unit, static, and Chromium packaging coverage. The live deployment remains Version 8 and does not contain this repair.

## Confirmed local failure mechanism

The former generator used regular expressions to extract script/style elements from the already-minified standalone HTML and then force-printed raw partial contents inside outer script/style elements in an Apps Script template.

A deterministic regression fixture containing a JavaScript literal `</script>` reproduced the visible-source failure class:

1. the browser closes the outer script element at the raw-text closing sequence;
2. the remaining minified JavaScript is parsed as body text;
3. bootstrap never reaches the Apps Script adapter.

This proves that the prior packaging design was structurally unsafe and that the observed raw-source symptom is consistent with script-boundary corruption.

## What is not proven

The fixed build diagnostics show exactly one intended application script opening/closing pair and no unexpected template delimiters. Repository evidence therefore does **not** prove that a literal `</script>` in the real Version 6 bundle was the sole live cause.

Other HTML Service/template-evaluation behavior may have contributed. The repair removes the unsafe extraction and embedding design regardless, but a controlled staging deployment is still required to confirm live recovery.

## Implemented repair

- Replaced regular-expression executable-asset extraction with separate Vite JavaScript and CSS outputs.
- Added a deterministic HTML tokenizer used only to preserve the expanded source shell/body and remove known build references.
- Generated complete `AppStyles.html` and `AppScript.html` elements rather than force-printing raw source inside outer container tags.
- Escaped case-insensitive raw-text closing sequences before embedding JavaScript or CSS.
- Added strict checks for exactly one body, one application style element, one application script element, no nested wrappers, and no unexpected template delimiters.
- Added SHA-256, byte-size, and marker-position diagnostics for generated files.
- Added deterministic generated-file parity checks.
- Added unit regressions for multiple script/style outputs, minified bootstrap identifiers, literal `</script>`, script-like text in template strings, visible-source leakage, deterministic output, and unchanged approved body markup.
- Added a Chromium test that executes the assembled page, mocks `google.script.run`, confirms one `api_getBootstrapData` call, and verifies the loading overlay clears.
- Added `DiagnosticShell.html`, harmless `api_htmlDiagnosticPing()`, and staging-only diagnostic routing.
- Added admin-only bounded `htmlTemplateDiagnostics()` using raw/generated template metadata without logging the complete application.

## CI false-positive correction

The first repaired CI run failed because the visible-source heuristic interpreted the normal UI phrase `Lead-time class` as JavaScript class syntax. That was a detector false positive, not application leakage. The detector now requires actual JavaScript-like punctuation and structure. The browser test was also changed to use `about:blank` and `page.setContent()` so it does not depend on an external test hostname.

## Verified results

At code checkpoint `74f2f0f...`:

- ESLint passed.
- Vitest passed: 10 files / 67 tests.
- Build passed: 17 modules transformed.
- Apps Script static validation passed: 23 `.gs` files / 18 required functions.
- Deterministic package parity passed.
- Standalone artifact verification passed: 209,742 bytes each.
- GitHub CI verify passed.
- GitHub browser smoke passed across 320, 390, 768, 1024, 1366, and 1440 px projects.
- Generated package sizes:
  - `Index.html`: 512 bytes
  - `AppBody.html`: 28,967 bytes
  - `AppStyles.html`: 26,850 bytes
  - `AppScript.html`: 153,161 bytes

The controlled recovery created versions 7 and 8 and updated the same existing staging deployment ID. One effective 29-file staging push occurred. No operational Sheet/Drive workflow, migration application, trigger change, production action, or PR merge occurred.

## Verified remaining work

- Review and deploy the repository request-only propagation repair, then retest the complete privacy boundary.
- Correct the misleading visible `Preview mode · local data` badge and hide `Reset Demo Data` in Apps Script mode. The current sidebar proves non-mock bootstrap succeeded and the reset handler refuses to act outside mock mode, but the wording is inaccurate.
- Confirm exact-once live bootstrap from bounded execution evidence if required.
- Run one bounded end-to-end staging workflow only after privacy and UI review.

## Safety boundary

Do not rerun the following merely to validate rendering:

- `setupDatabase()`
- `setupDriveFolders()`
- migration dry-run or application
- reconciliation
- launch backup
- trigger setup

Do not run `applyApprovedMigration()`. Do not touch production. Do not merge PR #2 yet.

## Remaining staging verification plan

1. Review the request-only repair commit and CI.
2. With explicit approval, push it to staging, verify remote parity, and update the existing deployment to one new immutable version.
3. Retest the diagnostic, internal, and request-only entry points without writes.
4. Correct and test the separate misleading preview/reset UI only after privacy passes.
5. Only then run one explicitly authorized bounded end-to-end staging workflow and verify audit/history/error/evidence records.
6. Stop immediately on any authorization, inventory, evidence, privacy, or audit failure.

## Evidence retained outside Git

The user retains screenshots of the blank-body stage, stuck loading overlay, `doGet`-only executions, Version 6 failures, the omitted oversized log message, raw minified JavaScript rendered as page text, and intermediate GitHub Actions notifications. These are operational evidence and are not committed as public repository assets.
