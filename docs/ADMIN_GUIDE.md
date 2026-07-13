# Administrator Guide

## Scope

Administrators configure and verify the system; they do not bypass workflow controls. Apps Script editor access, Google resource ownership, and application `Can_Admin` are separate privileges. Every action in this guide requires an approved environment, named owner, current backup, and recorded change window. It does not authorize a deployment or live write.

## Environment setup order

1. Confirm the reviewed commit, branch, CI/check results, generated artifact hashes, and preceding rollback version.
2. Configure private Script Properties for environment, operational spreadsheet, and distinct backup spreadsheet. Never use repository values or screenshots.
3. In a backed-up staging environment, run additive `setupDatabase()` and `validateDatabaseSchema()`.
4. Configure the reviewed Drive root and all six child-purpose/archive references; run `validateDriveConfiguration()`.
5. Seed explicit institutional users through `seedRolesAndPermissions(users)`; do not commit or paste the list into a public record.
6. Run idempotent `setupOperationalEditTrigger()` and `setupTimeTriggers()`; confirm exactly one intended trigger of each type.
7. Run `healthCheck()`, migration dry-run/reconciliation, request-only privacy checks, and the full staging acceptance matrix.
8. Only after acceptance, use the release process in [Operations and Deployment Runbook](OPERATIONS_AND_DEPLOYMENT_RUNBOOK.md).

The empty-database setup-owner bootstrap exists only to establish the first access table from an institutional account. Once access rows exist, setup functions require `Can_Admin`. Do not leave a personal account as the sole owner.

## User and access administration

For each user, privately review institutional email, display name, role, committee, active state, and the five explicit permission flags. Choose the least-privileged role first; add a capability only for a documented responsibility.

| Responsibility                                                 | Minimum typical capability |
| -------------------------------------------------------------- | -------------------------- |
| Review and reserve request lines                               | `Can_Review`               |
| Physical release and lending handoff/return                    | `Can_Release`              |
| Restock/deliverable receiving and procurement evidence         | `Can_Receive`              |
| Catalog metadata/storage/archive management                    | `Can_Manage_Catalog`       |
| Migration, backup, adjustment, transfer, setup, access, health | `Can_Admin`                |

On role change or departure, deactivate the row promptly, remove Drive/Sheet/Apps Script/group access separately, revoke active sessions where institutional tooling permits, and record the review. Deactivation does not erase historical actor attribution. Conduct quarterly access and sharing reviews.

## Catalog administration

- Create items with canonical metadata and conservative circulation settings. Initial quantity greater than zero must be an authorized append-only opening movement with a reason.
- Editing catalog metadata cannot change IDs, opening/posted ledger truth, or legacy provenance.
- Treat handling and lending audience as separate policies. Student eligibility is never inferred from `LOANABLE` or `REUSABLE_ASSET`.
- `VERIFY` items remain non-transactable until an approved reconciliation decision preserves source sheet/row/block/name/quantity/unit.
- Unit changes, archive, and restore may be blocked by reservations, open lending, or historical dependencies. Resolve the workflow; do not edit rows around the guard.
- Cycle-count differences use a documented adjustment, never a ledger-row edit.

## Migration and reconciliation

Run discovery/dry-run first and review counts, missing mappings, VERIFY, zero/invalid values, duplicate groups, conflicting units, and reference-list matches. Only mappings explicitly marked approved can be applied. `applyApprovedMigration()` is one-time/frozen and must run under a lock with a fresh backup. Keep its version, count, reconciliation report, and correlation/audit evidence privately.

An application rollback does not remove appended schema, migration mappings, catalog changes, or posted records. Corrections are forward, explicit, and audited. See [Migration and Reconciliation](MIGRATION_AND_RECONCILIATION.md).

## Drive and evidence administration

Validate all required folder references and inherited sharing. The application must never fall back to My Drive. Review quarantined archive files by correlation and metadata failure; do not silently attach or delete them. Any recovery attachment or deletion requires an approved, auditable action and retention/legal-hold check. See [Google Drive Evidence](GOOGLE_DRIVE_EVIDENCE.md).

## Backup and recovery administration

Before schema, migration, deployment activation, or production acceptance mutation, create and privately record a fresh backup. Evidence includes environment, time, actor, source revision/version, destination verification without exposing its ID, row/tab counts, and restore test status. Routine application services never write to the backup.

Periodically test restoring to an isolated non-production resource, then validate schema, balances, links, and access without moving the production pointer. Backup existence without a restore test is incomplete recovery evidence.

## Configuration and trigger review

| Control                    | Verify                                                                                         |
| -------------------------- | ---------------------------------------------------------------------------------------------- |
| Environment                | Exactly `STAGING` or `PRODUCTION`; expected by health result                                   |
| Operational/backup routing | Both valid, different, privately recorded, correct owner                                       |
| Drive                      | Seven valid reviewed folders; no broad/public sharing                                          |
| Revision                   | Config keys valid; edit trigger targets only operational spreadsheet                           |
| Time triggers              | One overdue update and one scheduled backup; expected owner/time zone                          |
| Access                     | Active rows reviewed; blanks do not create unintended capability                               |
| Deployment                 | Existing restricted deployment pointer, immutable version, owner and rollback version recorded |

## Monitoring and incident actions

Review health, schema, Drive validation, unresolved errors, overdue loans, evidence quarantine, data revision, reconciliation differences, failed triggers, backup age, and access changes. A correlation ID links user-visible failure to controlled error/audit records.

On inventory, authorization, privacy, evidence, or deployment-parity failure: stop writes, preserve evidence, return the existing deployment pointer to the preceding immutable version, verify both internal and requester modes, and reconcile every completed mutation. Never delete audit/history/ledger/evidence records to make counts match.

## Prohibited shortcuts

- Do not share or commit resource IDs, credentials, user lists, supplier tax records, student data, or evidence.
- Do not grant admin because a button is hidden or a user needs one unrelated workflow.
- Do not hand-edit generated HTML, posted ledger/history/audit rows, legacy sources, or backup data.
- Do not create a new deployment ID as an undocumented rollback.
- Do not claim a clasp push, Apps Script version, backup, test, or deployment without independent verification.
- Do not enable production while privacy retention, audience, owner, and Drive/access decisions remain unresolved.
