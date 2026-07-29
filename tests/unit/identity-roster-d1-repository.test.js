import { Miniflare } from 'miniflare';
import { afterEach, describe, expect, it } from 'vitest';
import { createD1IdentityRosterRepository } from '../../src/server/d1/identity-roster-repository.js';

let miniflare;

afterEach(async () => {
  await miniflare?.dispose();
  miniflare = null;
});

async function context() {
  miniflare = new Miniflare({
    modules: true,
    script: 'export default { fetch() { return new Response("ok"); } }',
    d1Databases: ['DB'],
  });
  const db = await miniflare.getD1Database('DB');
  for (const statement of [
    'CREATE TABLE accounts (id TEXT PRIMARY KEY) STRICT',
    'CREATE TABLE app_metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT NOT NULL) STRICT',
    "INSERT INTO app_metadata VALUES ('operational_schema_version', '20', '2026-07-26T00:00:00.000Z')",
    `CREATE TABLE audit_log (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      actor_account_id TEXT,
      before_json TEXT NOT NULL,
      after_json TEXT NOT NULL,
      correlation_id TEXT NOT NULL,
      notes TEXT NOT NULL
    ) STRICT`,
    "INSERT INTO accounts VALUES ('OWNER-SYNTHETIC')",
    `CREATE TABLE identity_roster_sync_runs (
      id TEXT PRIMARY KEY, source_fingerprint TEXT NOT NULL, source_row_count INTEGER NOT NULL,
      accepted_count INTEGER NOT NULL, rejection_count INTEGER NOT NULL, add_count INTEGER NOT NULL,
      change_count INTEGER NOT NULL, removal_count INTEGER NOT NULL, unchanged_count INTEGER NOT NULL,
      validation_status TEXT NOT NULL, apply_status TEXT NOT NULL, protected_source_envelope TEXT NOT NULL,
      protected_rejections_envelope TEXT NOT NULL, created_by_account_id TEXT NOT NULL REFERENCES accounts(id),
      created_at TEXT NOT NULL, applied_at TEXT, rolled_back_at TEXT, rollback_of_run_id TEXT,
      correlation_id TEXT NOT NULL
    ) STRICT`,
    `CREATE TABLE identity_roster_entries (
      identity_key TEXT PRIMARY KEY, protected_profile_envelope TEXT NOT NULL, active INTEGER NOT NULL,
      source_fingerprint TEXT NOT NULL, source_run_id TEXT NOT NULL REFERENCES identity_roster_sync_runs(id),
      updated_at TEXT NOT NULL
    ) STRICT`,
    `CREATE TABLE identity_roster_rollback_snapshots (
      run_id TEXT PRIMARY KEY REFERENCES identity_roster_sync_runs(id),
      protected_snapshot_envelope TEXT NOT NULL, entry_count INTEGER NOT NULL,
      created_at TEXT NOT NULL, created_by_account_id TEXT NOT NULL REFERENCES accounts(id)
    ) STRICT`,
    `CREATE TRIGGER identity_roster_snapshots_no_delete
     BEFORE DELETE ON identity_roster_rollback_snapshots
     BEGIN SELECT RAISE(ABORT, 'identity roster rollback snapshots are append-only'); END`,
  ])
    await db.prepare(statement).run();
  return { db, repository: createD1IdentityRosterRepository(db) };
}

const run = {
  id: 'RSY-SYNTHETIC-001',
  sourceFingerprint: 'SHA256-SYNTHETIC-001',
  sourceRowCount: 1,
  acceptedCount: 1,
  rejectionCount: 1,
  addCount: 1,
  changeCount: 0,
  removalCount: 0,
  unchangedCount: 0,
  validationStatus: 'VALID_WITH_REJECTIONS',
  protectedSourceEnvelope: 'v1.synthetic.source',
  protectedRejectionsEnvelope: 'v1.synthetic.rejections',
  createdByAccountId: 'OWNER-SYNTHETIC',
  createdAt: '2026-07-26T10:00:00.000Z',
  correlationId: 'COR-SYNTHETIC-PREVIEW',
};

describe('D1 identity roster repository', () => {
  it('atomically applies and reconciles a preview, then restores its append-only snapshot', async () => {
    const { db, repository } = await context();
    await repository.createPreview(run);
    await repository.applyRun({
      run: { ...run, currentEntryCount: 0 },
      entries: [
        {
          identityKey: 'IDN-SYNTHETIC-001',
          protectedProfileEnvelope: 'v1.synthetic.profile',
          active: true,
          sourceFingerprint: run.sourceFingerprint,
          sourceRunId: run.id,
          updatedAt: '2026-07-26T10:01:00.000Z',
        },
      ],
      snapshotEnvelope: 'v1.synthetic.empty-snapshot',
      actor: { id: 'OWNER-SYNTHETIC' },
      appliedAt: '2026-07-26T10:01:00.000Z',
      correlationId: 'COR-SYNTHETIC-APPLY',
      auditId: 'AUD-SYNTHETIC-APPLY',
      reason: 'Apply synthetic D1 repository proof.',
    });
    await expect(repository.reconcile(run.sourceFingerprint, 1)).resolves.toEqual({
      entryCount: 1,
      matchingCount: 1,
      reconciled: true,
    });
    await expect(repository.latestAppliedRun()).resolves.toMatchObject({
      id: run.id,
      applyStatus: 'APPLIED',
    });
    await expect(repository.getSnapshotEnvelope(run.id)).resolves.toBe(
      'v1.synthetic.empty-snapshot',
    );

    await repository.rollbackRun({
      run: { ...run, applyStatus: 'APPLIED' },
      entries: [],
      actor: { id: 'OWNER-SYNTHETIC' },
      rolledBackAt: '2026-07-26T10:02:00.000Z',
      correlationId: 'COR-SYNTHETIC-ROLLBACK',
      auditId: 'AUD-SYNTHETIC-ROLLBACK',
      reason: 'Restore synthetic pre-apply state.',
    });
    await expect(repository.listEntries()).resolves.toEqual([]);
    await expect(repository.getRun(run.id)).resolves.toMatchObject({ applyStatus: 'ROLLED_BACK' });
    const audits = await db.prepare('SELECT action FROM audit_log ORDER BY created_at').all();
    expect(audits.results.map((entry) => entry.action)).toEqual([
      'IDENTITY_ROSTER_SYNC_APPLIED',
      'IDENTITY_ROSTER_SYNC_ROLLED_BACK',
    ]);
    await expect(
      db
        .prepare('DELETE FROM identity_roster_rollback_snapshots WHERE run_id = ?1')
        .bind(run.id)
        .run(),
    ).rejects.toThrow(/append-only/iu);
  });

  it('rejects a stale apply before changing entries, snapshots, or audit history', async () => {
    const { db, repository } = await context();
    await repository.createPreview(run);
    await db
      .prepare("UPDATE identity_roster_sync_runs SET apply_status = 'APPLIED' WHERE id = ?1")
      .bind(run.id)
      .run();
    await db
      .prepare(
        `INSERT INTO identity_roster_entries (
           identity_key, protected_profile_envelope, active, source_fingerprint,
           source_run_id, updated_at
         ) VALUES (?1, ?2, 1, ?3, ?4, ?5)`,
      )
      .bind(
        'IDN-SYNTHETIC-BASELINE',
        'v1.synthetic.baseline',
        run.sourceFingerprint,
        run.id,
        '2026-07-26T10:00:30.000Z',
      )
      .run();

    await expect(
      repository.applyRun({
        run: { ...run, currentEntryCount: 1 },
        entries: [
          {
            identityKey: 'IDN-SYNTHETIC-REPLACEMENT',
            protectedProfileEnvelope: 'v1.synthetic.replacement',
            active: true,
            sourceFingerprint: run.sourceFingerprint,
            sourceRunId: run.id,
            updatedAt: '2026-07-26T10:01:00.000Z',
          },
        ],
        snapshotEnvelope: 'v1.synthetic.snapshot',
        actor: { id: 'OWNER-SYNTHETIC' },
        appliedAt: '2026-07-26T10:01:00.000Z',
        correlationId: 'COR-SYNTHETIC-STALE',
        auditId: 'AUD-SYNTHETIC-STALE',
        reason: 'Reject the stale synthetic D1 write.',
      }),
    ).rejects.toThrow();
    await expect(repository.listEntries()).resolves.toMatchObject([
      { identityKey: 'IDN-SYNTHETIC-BASELINE' },
    ]);
    await expect(repository.getSnapshotEnvelope(run.id)).resolves.toBe('');
    const audits = await db.prepare('SELECT COUNT(*) AS total FROM audit_log').first();
    expect(Number(audits.total)).toBe(0);
  });
});
