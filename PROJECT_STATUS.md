# Project Status

## Current version

- Version: `0.4.0`
- Date: `2026-07-12`
- Branch: `feat/apps-script-backend-and-launch-readiness`
- Packaging-repair code checkpoint: `74f2f0f342bc9513681693be0fd542cf1f4d923a`
- Pull request: draft PR #2, open, mergeable, unmerged
- Local/demo backend: `mock`
- Apps Script bundle mode: `apps-script` with explicit Script Property environment
- Standalone artifact: `dist/index.html`
- Production deployment: **not performed**
- Full live demo readiness estimate: **approximately 85%**; one controlled staging deployment and end-to-end smoke remain

Always verify the current remote head and CI because documentation commits may follow the code checkpoint.

## Completed in this branch

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

No production migration was applied and no production resource was modified.

## Earlier read-only production validation

- Production spreadsheet title and timezone matched the supplied target during the earlier read-only validation.
- All four original legacy tabs and all 20 prepared backend tabs were present.
- The four legacy tabs matched the supplied backup value-for-value at validation time.
- `01_ITEM_MASTER` contained 397 records (`ITM-0001`–`ITM-0397`): 394 `ACTIVE`, 3 `VERIFY`, 2 zero-quantity, and no missing units.
- Known date-serial anomalies remain flagged `VERIFY`; no quantity was corrected.

See `docs/SCHEMA_VALIDATION_2026-07-12.md`.

## Verification status

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

No `clasp push`, Apps Script deployment, Sheet/Drive write, migration application, trigger change, or production action was performed during this repair.

## Confirmed findings and limitation

The previous package design was structurally unsafe because it extracted executable assets from minified HTML with regular expressions and force-printed raw source inside an outer script/style context. A deterministic fixture reproduced the observed failure class: an unescaped raw-text closing sequence terminates the script element and moves the remaining JavaScript into visible body text.

The fixed real bundle contains one intended application script element, one intended application style element, no unexpected template delimiters, and no raw JavaScript body text. However, the repository evidence does **not** prove that a literal `</script>` in the real Version 6 bundle was the sole live cause. A single controlled staging deployment is still required to confirm recovery in Apps Script HTML Service.

## Remaining launch blockers and limitations

- Review and seed the final institutional access rows in `14_USERS_ACCESS` before broader staging acceptance.
- Push the reviewed packaging-repair head to the existing staging Apps Script project only after `clasp status` and `clasp push --dry-run` show the intended target and file set.
- Create only one new staging deployment version for this repair.
- Run the minimal diagnostic shell first, then the full internal and `?request=1` entry points.
- Complete one controlled Sheet/Drive end-to-end workflow and verify audit/history/error/evidence records.
- Obtain DOL owner approval before production promotion or merging PR #2.
- The compatibility runtime remains relatively large; Google Sheets remains suitable for a controlled v1 pilot, not high-volume transactional scale.

## Next recommended task

Perform one controlled staging packaging verification from the reviewed GitHub head. Do not rerun setup, Drive provisioning, migration dry-run, reconciliation, backup, or trigger creation. Stop immediately if `doGet` fails, raw source appears as body text, bootstrap does not reach `api_getBootstrapData`, or the deployment target differs from the approved staging project.
