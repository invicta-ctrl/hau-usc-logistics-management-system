# Google Apps Script Handoff

The Apps Script implementation is under `apps-script/`; `npm run build` generates its `Index.html`. The corrected package is deployed through the existing staging Version 13 and production Version 3 pointers, with exact 33-file source/manifest parity verified after pullback.

Each write entry point uses the server pattern: resolve identity/permission, validate command, acquire lock, check idempotency, load current state, validate transition/reservation/balance, allocate server IDs, append/update records, write status and audit with correlation ID, release lock, and return a normalized safe result. Paired transfer ledger rows use one batch range write.

The database uses the prepared tabs for users/access, events, requests/lines, items, ledger, reservations, lending, releases, restock receipts, deliverables, suppliers, canvass, evidence, status, audit, config, errors, and migration mapping. Opening quantities remain preserved in the item master for the launch baseline; all later physical changes are immutable ledger movements.

Drive evidence is routed only through configured folders. Missing folder configuration fails closed. Server code validates type/extension/size, generates privacy-safe labels and filenames, computes a digest, prevents same-entity duplicates, records `12_EVIDENCE`, and quarantines orphan uploads.

Next operator step: follow `TESTING_AND_ACCEPTANCE.md` and `LAUNCH_RUNBOOK.md` for the remaining two-account, mutation, evidence, accessibility, storage, rollback, and release gates. Do not run `applyApprovedMigration()`, seed fictional records, or transact legacy TO_CLASSIFY/VERIFY items without an approved source reconciliation.
