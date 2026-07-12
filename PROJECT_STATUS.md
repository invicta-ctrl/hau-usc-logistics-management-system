# Project Status

## Current version

- Version: `0.4.0`
- Date: 2026-07-12
- Branch: `feat/apps-script-backend-and-launch-readiness`
- Local/demo backend: `mock`
- Apps Script bundle mode: `apps-script` / explicit Script Property environment
- Standalone artifact: `dist/index.html`
- Production deployment: **not performed**
- Full live demo readiness estimate: **approximately 75%**

## Completed in this branch

- Preserved the approved prototype and generated visual modules.
- Added strict browser adapters for mock, Apps Script, and future authenticated HTTP implementations.
- Added Apps Script repositories, setup, schema checks, authorization, collision-safe IDs, locks, idempotency, structured errors, audit/status history, append-only inventory, reservations, request routing, lending, release, restocking, procurement, canvass, evidence, migration, reconciliation, and backup functions.
- Added privacy-safe evidence labels and filenames, MIME/extension/size checks, digest deduplication, configured folder routing, and quarantine recovery.
- Added staging/production setup documentation, CI, static Apps Script checks, backend-focused unit tests, and generated `apps-script/Index.html`.
- Request-only Apps Script payloads hide exact inventory balances and legacy trace fields; authoritative stock routing occurs during locked DOL review.
- Evidence upload entry points require receive, release, or admin permission according to evidence type.
- Visual-baseline tests support LF and CRLF checkouts while preserving strict visual markup comparison.
- Removed hardcoded operational and backup spreadsheet IDs from Apps Script runtime code.
- Added required Script Properties: `HAU_ENVIRONMENT`, `HAU_SPREADSHEET_ID`, and `HAU_BACKUP_SPREADSHEET_ID`.
- Runtime configuration accepts only `STAGING` or `PRODUCTION`, rejects missing/placeholder/malformed values, requires separate operational and backup IDs, and has no production fallback.
- Setup, migration/reconciliation access, launch backup creation, and admin health checks now route through the resolved environment target.
- Admin health checks report the active environment and target IDs so operators can verify the destination before writes.

## Live schema validation (read-only, 2026-07-12)

- Production spreadsheet title and timezone matched the supplied target during the earlier read-only validation.
- All four original legacy tabs and all 20 prepared backend tabs were present.
- The four legacy tabs matched the supplied backup value-for-value at validation time.
- `01_ITEM_MASTER` contained 397 records (`ITM-0001`–`ITM-0397`): 394 `ACTIVE`, 3 `VERIFY`, 2 zero-quantity, and no missing units.
- Known date-serial anomalies remain flagged `VERIFY`; no quantity was corrected.
- Drive root/receipts/canvass/release/deliverable IDs remain `TO_BE_ASSIGNED`; lending/archive keys were absent at inspection time. `setupDatabase()` adds missing keys without wiping rows.

See `docs/SCHEMA_VALIDATION_2026-07-12.md`.

## Verification status

- Previous Windows checkpoint: focused visual-baseline test passed, and 9 files / 55 tests passed.
- GitHub `npm run check` passed after the staging-isolation implementation, including ESLint, Vitest, Vite build, Apps Script static validation, and artifact verification.
- GitHub Apps Script static check passed after the staging-isolation implementation.
- Remote Playwright browser smoke is run by GitHub CI; the latest result must be confirmed at the final handoff head.
- `clasp status` / `clasp push --dry-run`: not run because a staging Script ID and authenticated local clasp configuration are not yet available.

## Launch blockers and limitations

- A disposable staging spreadsheet and separate staging baseline/backup spreadsheet must be created.
- A staging Apps Script project must be created and its three required Script Properties assigned.
- All required Drive folder IDs must be assigned and validated.
- The users/access table must be reviewed and seeded with institutional accounts.
- An untracked `.clasp.json` must be configured locally and authenticated.
- Live staging schema setup, migration dry-run, backup, reconciliation, and health check have not been executed.
- No Apps Script web app has been deployed and no real Sheet/Drive workflow smoke test has run.
- The approved compatibility runtime remains generated and relatively large; several secondary edit/archive actions remain preview-only.
- Google Sheets is appropriate for the controlled v1 pilot, not high-volume or strongly transactional scale.

## Next recommended full-stack task

Create the disposable staging Google resources, configure the three required Script Properties, push the reviewed Apps Script bundle to the staging project, and stop after `setupDatabase()`, schema validation, Drive validation, migration dry-run, reconciliation, launch backup, and admin `healthCheck()` confirm the exact staging target. Do not apply migration or deploy production.
