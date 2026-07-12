# Launch Runbook

## Staging

1. Confirm branch/commit and passing CI.
2. Build and run `clasp status` / `clasp push --dry-run` against staging.
3. Run schema setup/validation, configure and validate all Drive folders, seed reviewed users, and create triggers.
4. Run migration dry-run and reconciliation; resolve all launch-blocking `VERIFY` decisions without modifying legacy cells.
5. Create a launch backup; record backup ID privately.
6. Deploy staging web app. Test internal and `?request=1` entry points with separate authorized/unauthorized accounts.
7. Run the complete staging acceptance matrix and verify audit/history/error/evidence records.

## Production promotion

Obtain DOL owner sign-off, freeze config/mappings, create a fresh backup, push the reviewed commit to the production Apps Script project, create an immutable deployment version, restrict audience, run smoke tests, and record deployment owner/version/commit/time/result. Keep the previous deployment version available for application rollback.

## Immediate smoke tests

- health/schema/Drive checks succeed;
- authorized staff bootstrap loads; unauthorized account is denied internal bootstrap;
- request-only portal exposes no internal navigation/data;
- test request submit/review/reserve/release produces one movement;
- test evidence gets safe label/filename and metadata;
- duplicate retry returns the original result;
- logs contain correlation IDs and no public stack trace.

If any inventory, authorization, evidence, or privacy test fails, stop writes and follow the recovery runbook. Never repair by deleting ledger rows.

## Unresolved manual values

All seven Drive folder IDs, staging/production Script IDs, deployment owner, approved access list, backup retention, evidence retention, notification sender, and production audience must be assigned by HAU/DOL.
