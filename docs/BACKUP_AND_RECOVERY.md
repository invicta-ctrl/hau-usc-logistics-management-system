# Backup and Recovery

## Verified V1 backup record

Fresh private predeployment spreadsheet backups were created and verified for both staging and production on 2026-07-13. The corrected package serves staging Version 13 and production Version 3; prior deployment versions and predeployment Apps Script source pulls are retained in the restricted external handoff backup. Backup references and resource IDs are intentionally omitted from git.

The current release gate still requires an approved restore drill before release sign-off. No operational transaction or evidence upload was run against the live targets, and the Google account showed an Almost out of storage warning at approximately 14.03 GB of 15 GB.

## Backup layers

- Pre-rework reference: the operator-held private spreadsheet identifier is intentionally absent from git; application writes are prohibited.
- Pre-migration launch backup: create with `createLaunchBackup()` into the configured archive folder.
- Scheduled spreadsheet backup: daily trigger after launch, with retention reviewed by the owner.
- Evidence: retain original Drive folder structure and metadata export; consider a controlled secondary Workspace/Cloud backup based on HAU policy.
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
