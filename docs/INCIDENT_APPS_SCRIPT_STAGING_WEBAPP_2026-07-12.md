# Apps Script Staging Web App Incident — 2026-07-12

## Current status

**Local packaging repair complete; controlled staging verification pending.**

- Repository: `invicta-ctrl/hau-usc-logistics-management-system`
- Branch: `feat/apps-script-backend-and-launch-readiness`
- Pull request: draft PR #2
- Packaging-repair code checkpoint: `74f2f0f342bc9513681693be0fd542cf1f4d923a`
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

No `clasp push`, deployment version, Sheet/Drive write, migration application, trigger change, or production action occurred during the repair.

## Safety boundary

Do not rerun the following merely to validate rendering:

- `setupDatabase()`
- `setupDriveFolders()`
- migration dry-run or application
- reconciliation
- launch backup
- trigger setup

Do not run `applyApprovedMigration()`. Do not touch production. Do not merge PR #2 yet.

## Controlled staging verification plan

After explicit approval:

1. Fast-forward the clean local checkout to the reviewed branch head.
2. Run `npm ci`, `npm run check`, `clasp status`, and `clasp push --dry-run`.
3. Confirm the existing staging Script ID and exact file list.
4. Push once and create one new version of the existing staging deployment.
5. Test `?diagnostic=1` first.
6. Test the full internal entry point and `?request=1`.
7. Confirm no raw source is visible, the loading overlay clears, and `api_getBootstrapData` executes exactly once.
8. Only then run one bounded end-to-end staging workflow and verify audit/history/error/evidence records.
9. Stop immediately on any rendering, authorization, inventory, evidence, privacy, or audit failure.

## Evidence retained outside Git

The user retains screenshots of the blank-body stage, stuck loading overlay, `doGet`-only executions, Version 6 failures, the omitted oversized log message, raw minified JavaScript rendered as page text, and intermediate GitHub Actions notifications. These are operational evidence and are not committed as public repository assets.
