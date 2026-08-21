# Backup and Recovery

## v0.7.2 verified production recovery baseline

The v0.7.2 production release is schema 30 / migration 0030. Its fresh private
export, recovery bookmark, prior Worker version, isolated restore proof, and
reconciliation evidence remain outside Git. The older v0.7.0 evidence below is
retained as historical recovery provenance, not current runtime identity.

- Final zero-session production export: 1,235,351 bytes; SHA-256
  `1018c5e6e19c2e2da50c0910950ca40c6cbc54a77a47537951622c40621e8452`.
- Independent restore: 76 application tables, integrity `ok`, zero foreign-key
  violations.
- The final D1 Time Travel bookmark, exact Worker version, prelaunch empty
  export, staging rollback evidence, Google recovery mapping, and R2 metadata
  remain in the private launch package outside Git.
- The provider export orders some table data before referenced table creation.
  The verified isolated-restore procedure first creates all exported tables,
  then replays the retained statements with foreign keys disabled only for the
  isolated import, reenables them, and requires both integrity and foreign-key
  checks to pass before any recovery promotion.
- Do not exercise a destructive rollback against a healthy production system.
  Restore to an isolated target, reconcile, validate through staging, and then
  use the production change window.

## Backup layers

The governed v0.8.0 production capture command is
`npm run production:recovery:evidence`. It requires clean upstream-matched source,
an exact-SHA staging/production config pair outside Git, and a private production
authorization package whose `productionBackup` action is approved. It privately
captures D1 export and Time Travel evidence, prior Worker deployments, live R2 bucket
metadata, configuration fingerprints, isolated schema-30 restore proof, aggregate
Inventory reconciliation, and the production preflight backup manifest. The manifest
path must match the authorization package and must not already exist.

- Pre-rework reference: spreadsheet `17nyUqDACyc4ZpWL_mZ1S-QAmIGECKtbXFci9rWtqTBg`; application writes are prohibited.
- Pre-migration launch backup: create with `createLaunchBackup()` into the configured archive folder.
- Scheduled spreadsheet backup: daily trigger after launch, with retention reviewed by the owner.
- Evidence: retain original Drive folder structure and metadata export; consider a controlled secondary Workspace/Cloud backup based on HAU policy.

## v0.7.0 launch retention contract

- Keep the private D1 SQL export, Time Travel bookmark, encrypted Google roster
  source snapshot, R2 metadata snapshot, Worker-version mapping, and rollback
  evidence outside Git through production launch and post-launch owner sign-off.
- Keep audit, status, ledger, release, evidence, event, access, and other
  append-only histories. Correct them through linked append-only records; never
  update or delete the original history.
- Keep synthetic accounts disabled or revoked rather than deleting their audit
  identity. Remove only exact ephemeral test effects whose identifiers were
  captured before execution.
- Continue the implemented sliding-window cleanup for rate-limit rows.
- Preserve evidence and Drive/R2 metadata until HAU approves numeric retention,
  legal-hold, and deletion rules. No automated purge is authorized before that
  owner decision; do not invent a duration.
- Deleting a launch backup requires explicit owner approval and a verified
  successor backup plus recovery evidence.
- Schema/version record: preserve git commit, Apps Script version, schema version, migration version, counts, and health-check report together.

## Recovery

1. Stop writes by disabling/withdrawing the web-app deployment and triggers.
2. Preserve the failing database and logs; do not delete ledger rows.
3. Copy the selected known-good spreadsheet backup to a new recovery database.
4. Reconcile evidence metadata against existing Drive files; do not duplicate or expose files.
5. Apply post-backup business corrections as explicit reversal/adjustment transactions, not ledger edits.
6. Validate schema, IDs, ledger totals, reservations, VERIFY count, access rows, and Drive configuration.
7. Deploy staging against recovery, run smoke tests, obtain approval, then promote.

Restoring the old pre-rework backup requires rerunning non-destructive discovery and approved mappings while separately preserving evidence created after that backup. Never point the application directly at the read-only reference.

Quarterly: test restore into staging, verify representative evidence, reconcile counts/checksums, exercise access revocation, and document recovery time and gaps.
