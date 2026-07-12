# Project Status

## Current version

- Version: `0.4.0`
- Date: `2026-07-12`
- Branch: `feat/apps-script-backend-and-launch-readiness`
- Packaging-repair code checkpoint: `74f2f0f342bc9513681693be0fd542cf1f4d923a`
- Pull request: draft PR #2, open, mergeable, unmerged
- Local/demo backend: `mock`
- Apps Script bundle mode: `apps-script` with explicit Script Property environment
- Current staging deployment: immutable version 8 on the existing deployment ID
- Standalone artifact: `dist/index.html`
- Production deployment: **not performed**
- Full live demo readiness estimate: **approximately 90%**; request-only privacy verification, one UI-truthfulness correction, and a bounded end-to-end smoke remain

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
- Version 8 now serves the parser-safe package on the existing staging deployment. The isolated HTML diagnostic and authorized internal `/exec` bootstrap both render successfully.

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

The internal staging page still shows the legacy visible label `Preview mode · local data` and the `Reset Demo Data` button even though the sidebar correctly reports `Apps Script staging`. This is a UI-truthfulness defect, not a mock fallback: the non-mock reset handler refuses to modify demo state. It must be corrected before workflow acceptance.

## Remaining launch blockers and limitations

- Review and seed the final institutional access rows in `14_USERS_ACCESS` before broader staging acceptance.
- Verify `?request=1` with the appropriate account and confirm the sanitized request-only boundary.
- Correct the misleading preview badge and hide the local-only reset control in Apps Script mode.
- Confirm live bootstrap invocation count from bounded execution evidence if exact-once proof is required.
- Complete one controlled Sheet/Drive end-to-end workflow and verify audit/history/error/evidence records.
- Obtain DOL owner approval before production promotion or merging PR #2.
- The compatibility runtime remains relatively large; Google Sheets remains suitable for a controlled v1 pilot, not high-volume transactional scale.

## Next recommended task

Verify the version-8 request-only entry point without operational writes, then implement the bounded UI-truthfulness correction. Do not rerun setup, Drive provisioning, migration dry-run, reconciliation, backup, or trigger creation.
