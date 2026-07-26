function rowList(result) {
  return Array.isArray(result?.results) ? result.results : [];
}

function evidenceDto(row) {
  return {
    evidenceId: row.evidence_id,
    evidenceType: row.evidence_type,
    normalizedFileName: row.normalized_file_name,
    mimeType: row.mime_type,
    sizeBytes: Number(row.size_bytes),
    sha256: row.sha256,
    privateStorageReference: row.private_storage_reference,
    primaryEtag: row.primary_etag,
    primaryVersion: row.primary_version,
    relatedEntityType: row.related_entity_type,
    relatedEntityId: row.related_entity_id,
    uploadedBy: row.uploaded_by,
  };
}

function jobDto(row) {
  return {
    jobId: row.job_id ?? row.id,
    evidenceId: row.evidence_id,
    idempotencyKey: row.idempotency_key,
    status: row.status,
    attemptCount: Number(row.attempt_count),
    maxAttempts: Number(row.max_attempts),
    nextAttemptAt: row.next_attempt_at,
    driveFileId: row.drive_file_id,
    lastErrorCode: row.last_error_code,
    ...evidenceDto(row),
  };
}

export function createD1EvidenceBackupRepository(db, { cryptoProvider = globalThis.crypto } = {}) {
  if (!db) throw new Error('D1 database binding is required.');
  const id = (prefix) =>
    `${prefix}-${cryptoProvider.randomUUID?.() ?? `${Date.now()}-${Math.random()}`}`.toUpperCase();

  return Object.freeze({
    async listDue({ now, staleBefore, limit, evidenceId = '' }) {
      const result = await db
        .prepare(
          `SELECT job.id AS job_id, job.evidence_id, job.idempotency_key, job.status,
                  job.attempt_count, job.max_attempts, job.next_attempt_at, job.drive_file_id,
                  job.last_error_code, evidence.evidence_type, evidence.normalized_file_name,
                  evidence.mime_type, evidence.size_bytes, evidence.sha256,
                  evidence.private_storage_reference, evidence.primary_etag,
                  evidence.primary_version, evidence.related_entity_type,
                  evidence.related_entity_id, evidence.uploaded_by
           FROM evidence_backup_jobs job
           JOIN evidence_metadata evidence ON evidence.id = job.evidence_id
           WHERE (?1 = '' OR job.evidence_id = ?1)
             AND job.next_attempt_at <= ?2
             AND (
               job.status IN ('PENDING', 'RETRYING')
               OR (job.status = 'IN_PROGRESS' AND job.locked_at <= ?3)
             )
           ORDER BY job.next_attempt_at, job.created_at
           LIMIT ?4`,
        )
        .bind(evidenceId, now, staleBefore, limit)
        .all();
      return rowList(result).map(jobDto);
    },

    async claim({ jobId, now, staleBefore }) {
      const result = await db
        .prepare(
          `UPDATE evidence_backup_jobs
           SET status = 'IN_PROGRESS',
               attempt_count = attempt_count + 1,
               locked_at = ?1,
               last_error_code = '',
               last_reconciled_at = ?1,
               updated_at = ?1
           WHERE id = ?2
             AND (
               status IN ('PENDING', 'RETRYING')
               OR (status = 'IN_PROGRESS' AND locked_at <= ?3)
             )`,
        )
        .bind(now, jobId, staleBefore)
        .run();
      return Number(result?.meta?.changes ?? 0) === 1;
    },

    async listForReconciliation({ limit }) {
      const result = await db
        .prepare(
          `SELECT job.id AS job_id, job.evidence_id, job.idempotency_key, job.status,
                  job.attempt_count, job.max_attempts, job.next_attempt_at, job.drive_file_id,
                  job.last_error_code, evidence.evidence_type, evidence.normalized_file_name,
                  evidence.mime_type, evidence.size_bytes, evidence.sha256,
                  evidence.private_storage_reference, evidence.primary_etag,
                  evidence.primary_version, evidence.related_entity_type,
                  evidence.related_entity_id, evidence.uploaded_by
           FROM evidence_backup_jobs job
           JOIN evidence_metadata evidence ON evidence.id = job.evidence_id
           WHERE job.status = 'SYNCED'
           ORDER BY CASE WHEN job.last_reconciled_at = '' THEN 0 ELSE 1 END,
                    job.last_reconciled_at, job.updated_at
           LIMIT ?1`,
        )
        .bind(limit)
        .all();
      return rowList(result).map(jobDto);
    },

    async markReconciled({ jobId, now }) {
      await db
        .prepare(
          `UPDATE evidence_backup_jobs
           SET last_reconciled_at = ?1, updated_at = ?1
           WHERE id = ?2 AND status = 'SYNCED'`,
        )
        .bind(now, jobId)
        .run();
    },

    async get(evidenceId) {
      const row = await db
        .prepare(
          `SELECT job.id AS job_id, job.evidence_id, job.idempotency_key, job.status,
                  job.attempt_count, job.max_attempts, job.next_attempt_at, job.drive_file_id,
                  job.last_error_code, evidence.evidence_type, evidence.normalized_file_name,
                  evidence.mime_type, evidence.size_bytes, evidence.sha256,
                  evidence.private_storage_reference, evidence.primary_etag,
                  evidence.primary_version, evidence.related_entity_type,
                  evidence.related_entity_id, evidence.uploaded_by
           FROM evidence_backup_jobs job
           JOIN evidence_metadata evidence ON evidence.id = job.evidence_id
           WHERE job.evidence_id = ?1`,
        )
        .bind(evidenceId)
        .first();
      return row ? jobDto(row) : null;
    },

    async markSynced({
      jobId,
      evidenceId,
      driveFileId,
      sizeBytes,
      providerChecksum,
      providerChecksumType,
      now,
      correlationId,
    }) {
      await db.batch([
        db
          .prepare(
            `UPDATE evidence_backup_jobs
             SET status = 'SYNCED', drive_file_id = ?1, verified_size_bytes = ?2,
                 provider_checksum = ?3, provider_checksum_type = ?4,
                 verified_at = ?5, locked_at = '', last_error_code = '',
                 last_reconciled_at = ?5, updated_at = ?5
             WHERE id = ?6`,
          )
          .bind(driveFileId, sizeBytes, providerChecksum, providerChecksumType, now, jobId),
        db
          .prepare(
            `INSERT INTO audit_log (
               id, created_at, action, entity_type, entity_id, actor_account_id,
               before_json, after_json, correlation_id, notes
             ) VALUES (?1, ?2, 'EVIDENCE_BACKUP_SYNCED', 'EVIDENCE', ?3, NULL,
                       '{}', ?4, ?5, '')`,
          )
          .bind(id('AUD'), now, evidenceId, JSON.stringify({ status: 'SYNCED', sizeBytes }), correlationId),
      ]);
    },

    async markFailure({ jobId, evidenceId, status, errorCode, nextAttemptAt, now, correlationId }) {
      await db.batch([
        db
          .prepare(
            `UPDATE evidence_backup_jobs
             SET status = ?1, next_attempt_at = ?2, locked_at = '',
                 last_error_code = ?3, last_reconciled_at = ?4, updated_at = ?4
             WHERE id = ?5`,
          )
          .bind(status, nextAttemptAt, errorCode, now, jobId),
        db
          .prepare(
            `INSERT INTO audit_log (
               id, created_at, action, entity_type, entity_id, actor_account_id,
               before_json, after_json, correlation_id, notes
             ) VALUES (?1, ?2, ?3, 'EVIDENCE', ?4, NULL,
                       '{}', ?5, ?6, '')`,
          )
          .bind(
            id('AUD'),
            now,
            status === 'RESTORE_REQUIRED'
              ? 'EVIDENCE_RESTORE_REQUIRED'
              : status === 'FAILED'
                ? 'EVIDENCE_BACKUP_FAILED'
                : 'EVIDENCE_BACKUP_RETRY_SCHEDULED',
            evidenceId,
            JSON.stringify({ status, errorCode }),
            correlationId,
          ),
      ]);
    },

    async statusSummary() {
      const [counts, oldest, successful, reconciled, restoration, failures] = await Promise.all([
        db
          .prepare(
            `SELECT status, COUNT(*) AS count
             FROM evidence_backup_jobs
             GROUP BY status`,
          )
          .all(),
        db
          .prepare(
            `SELECT MIN(created_at) AS value
             FROM evidence_backup_jobs
             WHERE status IN ('PENDING', 'IN_PROGRESS', 'RETRYING')`,
          )
          .first(),
        db
          .prepare(
            `SELECT MAX(verified_at) AS value
             FROM evidence_backup_jobs
             WHERE status = 'SYNCED'`,
          )
          .first(),
        db.prepare('SELECT MAX(last_reconciled_at) AS value FROM evidence_backup_jobs').first(),
        db
          .prepare(
            `SELECT job.evidence_id, evidence.evidence_type,
                    evidence.related_entity_type, evidence.related_entity_id
             FROM evidence_backup_jobs job
             JOIN evidence_metadata evidence ON evidence.id = job.evidence_id
             WHERE job.status = 'RESTORE_REQUIRED'
             ORDER BY job.updated_at
             LIMIT 100`,
          )
          .all(),
        db
          .prepare(
            `SELECT evidence_id, attempt_count, last_error_code, updated_at
             FROM evidence_backup_jobs
             WHERE status = 'FAILED'
             ORDER BY updated_at
             LIMIT 100`,
          )
          .all(),
      ]);
      return {
        counts: Object.fromEntries(rowList(counts).map((row) => [row.status, Number(row.count)])),
        oldestPendingAt: oldest?.value ?? '',
        lastSuccessfulBackupAt: successful?.value ?? '',
        lastReconciliationAt: reconciled?.value ?? '',
        filesRequiringRestoration: rowList(restoration).map((row) => ({
          evidenceId: row.evidence_id,
          evidenceType: row.evidence_type,
          relatedEntityType: row.related_entity_type,
          relatedEntityId: row.related_entity_id,
        })),
        failures: rowList(failures).map((row) => ({
          evidenceId: row.evidence_id,
          attemptCount: Number(row.attempt_count),
          errorCode: row.last_error_code,
          updatedAt: row.updated_at,
        })),
      };
    },

    async markArchived({ evidence, archivedBy, archivedAt, reason, correlationId }) {
      await db.batch([
        db
          .prepare(
            `UPDATE evidence_metadata
             SET primary_storage_status = 'ARCHIVED', archived_at = ?1
             WHERE id = ?2`,
          )
          .bind(archivedAt, evidence.evidenceId),
        db
          .prepare(
            `UPDATE evidence_backup_jobs
             SET status = 'ARCHIVED', locked_at = '', next_attempt_at = ?1,
                 last_error_code = '', last_reconciled_at = ?1, updated_at = ?1
             WHERE evidence_id = ?2`,
          )
          .bind(archivedAt, evidence.evidenceId),
        db
          .prepare(
            `INSERT OR IGNORE INTO status_history (
               id, entity_type, entity_id, previous_status, new_status,
               changed_at, changed_by, reason, idempotency_key, metadata_json
             ) VALUES (?1, 'EVIDENCE', ?2, ?3, 'ARCHIVED',
                       ?4, ?5, ?6, ?7, ?8)`,
          )
          .bind(
            id('HIS'),
            evidence.evidenceId,
            evidence.status,
            archivedAt,
            archivedBy,
            reason,
            `archive:${evidence.evidenceId}`,
            JSON.stringify({
              primaryCopyRetained: true,
              driveCopyRetained: Boolean(evidence.driveFileId),
            }),
          ),
        db
          .prepare(
            `INSERT INTO audit_log (
               id, created_at, action, entity_type, entity_id, actor_account_id,
               before_json, after_json, correlation_id, notes
             ) VALUES (?1, ?2, 'EVIDENCE_ARCHIVED', 'EVIDENCE', ?3, ?4,
                       ?5, ?6, ?7, ?8)`,
          )
          .bind(
            id('AUD'),
            archivedAt,
            evidence.evidenceId,
            archivedBy,
            JSON.stringify({ status: evidence.status }),
            JSON.stringify({
              status: 'ARCHIVED',
              primaryCopyRetained: true,
              driveCopyRetained: Boolean(evidence.driveFileId),
            }),
            correlationId,
            reason,
          ),
      ]);
    },

    async recordRestore({
      evidence,
      driveFileId,
      restoredObjectKey,
      primaryEtag,
      primaryVersion,
      restoredBy,
      restoredAt,
      reason,
      correlationId,
    }) {
      await db.batch([
        db
          .prepare(
            `UPDATE evidence_metadata
             SET private_storage_reference = ?1, primary_storage_status = 'VERIFIED',
                 primary_etag = ?2, primary_version = ?3, upload_status = 'VERIFIED'
             WHERE id = ?4`,
          )
          .bind(restoredObjectKey, primaryEtag, primaryVersion, evidence.evidenceId),
        db
          .prepare(
            `UPDATE evidence_backup_jobs
             SET status = 'SYNCED', locked_at = '', last_error_code = '',
                 last_reconciled_at = ?1, updated_at = ?1
             WHERE evidence_id = ?2`,
          )
          .bind(restoredAt, evidence.evidenceId),
        db
          .prepare(
            `INSERT INTO evidence_restore_history (
               id, evidence_id, source_drive_file_id, prior_r2_object_key,
               restored_r2_object_key, sha256, size_bytes, restored_by,
               restored_at, reason, correlation_id
             ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)`,
          )
          .bind(
            id('ERS'),
            evidence.evidenceId,
            driveFileId,
            evidence.privateStorageReference,
            restoredObjectKey,
            evidence.sha256,
            evidence.sizeBytes,
            restoredBy,
            restoredAt,
            reason,
            correlationId,
          ),
        db
          .prepare(
            `INSERT INTO status_history (
               id, entity_type, entity_id, previous_status, new_status,
               changed_at, changed_by, reason, idempotency_key, metadata_json
             ) VALUES (?1, 'EVIDENCE', ?2, 'RESTORE_REQUIRED', 'VERIFIED',
                       ?3, ?4, ?5, ?6, ?7)`,
          )
          .bind(
            id('HIS'),
            evidence.evidenceId,
            restoredAt,
            restoredBy,
            reason,
            `restore:${evidence.evidenceId}:${restoredAt}`,
            JSON.stringify({ priorObjectPreserved: restoredObjectKey !== evidence.privateStorageReference }),
          ),
        db
          .prepare(
            `INSERT INTO audit_log (
               id, created_at, action, entity_type, entity_id, actor_account_id,
               before_json, after_json, correlation_id, notes
             ) VALUES (?1, ?2, 'EVIDENCE_RESTORED', 'EVIDENCE', ?3, ?4,
                       ?5, ?6, ?7, ?8)`,
          )
          .bind(
            id('AUD'),
            restoredAt,
            evidence.evidenceId,
            restoredBy,
            JSON.stringify({ status: 'RESTORE_REQUIRED' }),
            JSON.stringify({ status: 'VERIFIED', priorObjectPreserved: true }),
            correlationId,
            reason,
          ),
      ]);
    },
  });
}
