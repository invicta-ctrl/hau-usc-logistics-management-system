# Project Status

## Current version

- Version: `0.4.0`
- Date: 2026-07-12
- Branch: `feat/apps-script-backend-and-launch-readiness`
- Local/demo backend: `mock`
- Apps Script bundle mode: `apps-script` / `STAGING`
- Standalone artifact: `dist/index.html`
- Production deployment: **not performed**

## Completed in this branch

- Preserved the approved prototype and generated visual modules.
- Added strict browser adapters for mock, Apps Script, and future authenticated HTTP implementations.
- Added Apps Script repositories, setup, schema checks, authorization, collision-safe IDs, locks, idempotency, structured errors, audit/status history, append-only inventory, reservations, request routing, lending, release, restocking, procurement, canvass, evidence, migration, reconciliation, and backup functions.
- Added privacy-safe evidence labels and filenames, MIME/extension/size checks, digest deduplication, configured folder routing, and quarantine recovery.
- Added staging/production setup documentation, CI, static Apps Script checks, backend-focused unit tests, and generated `apps-script/Index.html`.
- Request-only Apps Script payloads now hide exact inventory balances and legacy trace fields; authoritative stock routing occurs during locked DOL review.
- Evidence upload entry points now require receive, release, or admin permission according to evidence type.
- Visual-baseline tests now remove only the exact generated-file notice across LF and CRLF checkouts while preserving strict visual markup comparison.

## Live schema validation (read-only, 2026-07-12)

- Production spreadsheet title and ID matched the supplied target; timezone is `Asia/Manila`.
- All four original legacy tabs and all 20 prepared backend tabs were present.
- The four legacy tabs matched the supplied backup value-for-value at validation time.
- `01_ITEM_MASTER` contained 397 records (`ITM-0001`–`ITM-0397`): 394 `ACTIVE`, 3 `VERIFY`, 2 zero-quantity, and no missing units.
- Known date-serial anomalies remain flagged `VERIFY`; no quantity was corrected.
- Drive root/receipts/canvass/release/deliverable IDs remain `TO_BE_ASSIGNED`; lending/archive keys were absent at inspection time. `setupDatabase()` adds missing keys without wiping rows.

See `docs/SCHEMA_VALIDATION_2026-07-12.md`.

## Verification status

- `npm install`: passed.
- `npm run lint`: passed.
- Focused visual-baseline test: 1 file / 4 tests passed on Windows with `core.autocrlf=true`.
- `npm test`: 9 files / 55 tests passed on the 2026-07-12 Windows continuation checkpoint.
- `npm run check`: passed, including lint, 55 Vitest tests, build, Apps Script static validation, and artifact verification.
- `npm run build`: passed; single-file output 210.17 kB (53.32 kB gzip).
- `npm run check:apps-script`: passed for 23 `.gs` files and 16 required entry points.
- `npm run verify:dist`: passed after removing build-only line-ending churn; committed standalone and shareable artifacts match at 209,953 bytes each with no generated-artifact diff.
- `npm run test:e2e`: local assertions could not run because Chromium is not installed in this environment. GitHub CI installed Chromium and completed the 30-case matrix: 25 passed and 5 intentional viewport-specific skips.
- GitHub Actions: `CI` and `Apps Script static check` both passed for commit `9fc9148`.
- `clasp status` / `clasp push --dry-run`: not run because `clasp` and a staging Script ID are not configured.

## Launch blockers and limitations

- All required Drive folder IDs must be assigned and validated.
- The users/access table must be reviewed and seeded with institutional accounts.
- A staging Apps Script project and `.clasp.json` must be configured locally (never committed).
- Live schema setup, migration dry-run, backup, and reconciliation functions have not been executed against production by this branch.
- No Apps Script web app has been deployed; no production smoke tests have run.
- Local Playwright cannot launch because Chromium is absent. The prior remote branch head passed the GitHub browser-smoke job; the continuation commit must pass CI after publication.
- The approved compatibility runtime remains generated and relatively large; several secondary edit/archive actions are still preview-only and should be migrated one slice at a time.
- Google Sheets is appropriate for the controlled v1 pilot, not high-volume or strongly transactional scale. See the future database plan.

## Next recommended full-stack task

Create the staging Apps Script project, set the seven Drive folder configuration values, run `setupDatabase()`, `validateDatabaseSchema()`, `validateDriveConfiguration()`, `runMigrationDryRun()`, and `healthCheck()` under an administrator account, then capture the returned reports without applying migration or deploying production.
