function mapRun(row) {
  if (!row) return null;
  return {
    id: row.id,
    sourceFingerprint: row.source_fingerprint,
    sourceRowCount: Number(row.source_row_count),
    acceptedCount: Number(row.accepted_count),
    rejectionCount: Number(row.rejection_count),
    addCount: Number(row.add_count),
    changeCount: Number(row.change_count),
    removalCount: Number(row.removal_count),
    unchangedCount: Number(row.unchanged_count),
    validationStatus: row.validation_status,
    applyStatus: row.apply_status,
    protectedSourceEnvelope: row.protected_source_envelope,
    protectedRejectionsEnvelope: row.protected_rejections_envelope,
    createdByAccountId: row.created_by_account_id,
    createdAt: row.created_at,
    appliedAt: row.applied_at ?? '',
    rolledBackAt: row.rolled_back_at ?? '',
    rollbackOfRunId: row.rollback_of_run_id ?? '',
    correlationId: row.correlation_id,
  };
}

function mapEntry(row) {
  return {
    identityKey: row.identity_key,
    protectedProfileEnvelope: row.protected_profile_envelope,
    active: row.active === 1,
    sourceFingerprint: row.source_fingerprint,
    sourceRunId: row.source_run_id,
    updatedAt: row.updated_at,
  };
}

function auditStatement(db, { id, createdAt, action, actorId, runId, before, after, correlationId, notes }) {
  return db
    .prepare(
      `INSERT INTO audit_log (
         id, created_at, action, entity_type, entity_id, actor_account_id,
         before_json, after_json, correlation_id, notes
       ) VALUES (?1, ?2, ?3, 'IDENTITY_ROSTER_SYNC', ?4, ?5, ?6, ?7, ?8, ?9)`,
    )
    .bind(
      id,
      createdAt,
      action,
      runId,
      actorId,
      JSON.stringify(before ?? {}),
      JSON.stringify(after ?? {}),
      correlationId,
      notes,
    );
}

function insertEntryStatement(db, entry) {
  return db
    .prepare(
      `INSERT INTO identity_roster_entries (
         identity_key, protected_profile_envelope, active, source_fingerprint,
         source_run_id, updated_at
       ) VALUES (?1, ?2, ?3, ?4, ?5, ?6)`,
    )
    .bind(
      entry.identityKey,
      entry.protectedProfileEnvelope,
      entry.active ? 1 : 0,
      entry.sourceFingerprint,
      entry.sourceRunId,
      entry.updatedAt,
    );
}

function idempotencyStatement(db, idempotency) {
  return db
    .prepare(
      `INSERT INTO idempotency_keys (
         scope, idempotency_key, actor_account_id, request_fingerprint, result_json, created_at
       ) VALUES (?1, ?2, ?3, ?4, ?5, ?6)`,
    )
    .bind(
      idempotency.scope,
      idempotency.key,
      idempotency.actorAccountId,
      idempotency.requestFingerprint,
      JSON.stringify(idempotency.result),
      idempotency.createdAt,
    );
}

export function createD1IdentityRosterRepository(db) {
  if (!db) throw new Error('D1 database binding is required.');

  return Object.freeze({
    async latestRun() {
      return mapRun(
        await db.prepare('SELECT * FROM identity_roster_sync_runs ORDER BY created_at DESC LIMIT 1').first(),
      );
    },

    async latestAppliedRun() {
      return mapRun(
        await db
          .prepare(
            "SELECT * FROM identity_roster_sync_runs WHERE apply_status = 'APPLIED' ORDER BY applied_at DESC LIMIT 1",
          )
          .first(),
      );
    },

    async getRun(runId) {
      return mapRun(
        await db.prepare('SELECT * FROM identity_roster_sync_runs WHERE id = ?1').bind(runId).first(),
      );
    },

    async listRuns(limit = 20) {
      const result = await db
        .prepare('SELECT * FROM identity_roster_sync_runs ORDER BY created_at DESC LIMIT ?1')
        .bind(Math.max(1, Math.min(100, Number(limit) || 20)))
        .all();
      return result.results.map(mapRun);
    },

    async listEntries() {
      const result = await db.prepare('SELECT * FROM identity_roster_entries ORDER BY identity_key').all();
      return result.results.map(mapEntry);
    },

    async getEntry(identityKey) {
      const row = await db
        .prepare('SELECT * FROM identity_roster_entries WHERE identity_key = ?1')
        .bind(identityKey)
        .first();
      return row ? mapEntry(row) : null;
    },

    async getIdempotency(scope, key) {
      const row = await db
        .prepare(
          `SELECT actor_account_id, request_fingerprint, result_json
           FROM idempotency_keys WHERE scope = ?1 AND idempotency_key = ?2`,
        )
        .bind(scope, key)
        .first();
      return row
        ? {
            actorAccountId: row.actor_account_id,
            requestFingerprint: row.request_fingerprint,
            result: JSON.parse(row.result_json),
          }
        : null;
    },

    async createPreview(run) {
      await db
        .prepare(
          `INSERT INTO identity_roster_sync_runs (
             id, source_fingerprint, source_row_count, accepted_count, rejection_count,
             add_count, change_count, removal_count, unchanged_count, validation_status,
             apply_status, protected_source_envelope, protected_rejections_envelope,
             created_by_account_id, created_at, correlation_id
           ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, 'PREVIEWED', ?11, ?12, ?13, ?14, ?15)`,
        )
        .bind(
          run.id,
          run.sourceFingerprint,
          run.sourceRowCount,
          run.acceptedCount,
          run.rejectionCount,
          run.addCount,
          run.changeCount,
          run.removalCount,
          run.unchangedCount,
          run.validationStatus,
          run.protectedSourceEnvelope,
          run.protectedRejectionsEnvelope,
          run.createdByAccountId,
          run.createdAt,
          run.correlationId,
        )
        .run();
    },

    async applyRun({ run, entries, snapshotEnvelope, actor, appliedAt, correlationId, auditId, reason }) {
      const statements = [
        db
          .prepare(
            `SELECT CASE
               WHEN EXISTS (
                 SELECT 1
                 FROM identity_roster_sync_runs
                 WHERE id = ?1
                   AND apply_status = 'PREVIEWED'
                   AND validation_status IN ('VALID', 'VALID_WITH_REJECTIONS')
               ) THEN 1
               ELSE json_extract('INVALID_IDENTITY_ROSTER_APPLY_STATE', '$')
             END AS allowed`,
          )
          .bind(run.id),
        db
          .prepare(
            `INSERT INTO identity_roster_rollback_snapshots (
               run_id, protected_snapshot_envelope, entry_count, created_at, created_by_account_id
             ) VALUES (?1, ?2, ?3, ?4, ?5)`,
          )
          .bind(run.id, snapshotEnvelope, run.currentEntryCount, appliedAt, actor.id),
        db.prepare('DELETE FROM identity_roster_entries'),
        ...entries.map((entry) => insertEntryStatement(db, entry)),
        db
          .prepare(
            `UPDATE identity_roster_sync_runs
             SET apply_status = 'APPLIED', applied_at = ?1
             WHERE id = ?2
               AND apply_status = 'PREVIEWED'
               AND validation_status IN ('VALID', 'VALID_WITH_REJECTIONS')`,
          )
          .bind(appliedAt, run.id),
        auditStatement(db, {
          id: auditId,
          createdAt: appliedAt,
          action: 'IDENTITY_ROSTER_SYNC_APPLIED',
          actorId: actor.id,
          runId: run.id,
          before: { entryCount: run.currentEntryCount },
          after: {
            entryCount: entries.length,
            sourceFingerprint: run.sourceFingerprint,
            addCount: run.addCount,
            changeCount: run.changeCount,
            removalCount: run.removalCount,
          },
          correlationId,
          notes: reason,
        }),
      ];
      const results = await db.batch(statements);
      const updateResult = results[3 + entries.length];
      if (Number(updateResult?.meta?.changes ?? 0) !== 1) {
        throw new Error('Identity roster sync write conflict.');
      }
    },

    async rollbackRun({ run, entries, actor, rolledBackAt, correlationId, auditId, reason, idempotency }) {
      const snapshot = await db
        .prepare(
          'SELECT protected_snapshot_envelope FROM identity_roster_rollback_snapshots WHERE run_id = ?1',
        )
        .bind(run.id)
        .first();
      if (!snapshot) return { snapshotEnvelope: '' };
      const statements = [
        db
          .prepare(
            `SELECT CASE
               WHEN EXISTS (
                 SELECT 1
                 FROM identity_roster_sync_runs
                 WHERE id = ?1 AND apply_status = 'APPLIED'
               ) AND EXISTS (
                 SELECT 1
                 FROM identity_roster_rollback_snapshots
                 WHERE run_id = ?1
               ) THEN 1
               ELSE json_extract('INVALID_IDENTITY_ROSTER_ROLLBACK_STATE', '$')
             END AS allowed`,
          )
          .bind(run.id),
        db.prepare('DELETE FROM identity_roster_entries'),
        ...entries.map((entry) => insertEntryStatement(db, entry)),
        db
          .prepare(
            `UPDATE identity_roster_sync_runs
             SET apply_status = 'ROLLED_BACK', rolled_back_at = ?1
             WHERE id = ?2 AND apply_status = 'APPLIED'`,
          )
          .bind(rolledBackAt, run.id),
        auditStatement(db, {
          id: auditId,
          createdAt: rolledBackAt,
          action: 'IDENTITY_ROSTER_SYNC_ROLLED_BACK',
          actorId: actor.id,
          runId: run.id,
          before: { entryCount: run.acceptedCount, sourceFingerprint: run.sourceFingerprint },
          after: { entryCount: entries.length },
          correlationId,
          notes: reason,
        }),
        idempotencyStatement(db, idempotency),
      ];
      const results = await db.batch(statements);
      const updateResult = results[2 + entries.length];
      if (Number(updateResult?.meta?.changes ?? 0) !== 1) {
        throw new Error('Identity roster rollback write conflict.');
      }
      return { snapshotEnvelope: snapshot.protected_snapshot_envelope };
    },

    async getSnapshotEnvelope(runId) {
      const row = await db
        .prepare(
          'SELECT protected_snapshot_envelope FROM identity_roster_rollback_snapshots WHERE run_id = ?1',
        )
        .bind(runId)
        .first();
      return row?.protected_snapshot_envelope ?? '';
    },

    async reconcile(sourceFingerprint, expectedCount) {
      const row = await db
        .prepare(
          `SELECT COUNT(*) AS entry_count,
                  SUM(CASE WHEN source_fingerprint = ?1 THEN 1 ELSE 0 END) AS matching_count
           FROM identity_roster_entries`,
        )
        .bind(sourceFingerprint)
        .first();
      return {
        entryCount: Number(row?.entry_count ?? 0),
        matchingCount: Number(row?.matching_count ?? 0),
        reconciled:
          Number(row?.entry_count ?? 0) === expectedCount &&
          Number(row?.matching_count ?? 0) === expectedCount,
      };
    },
  });
}
