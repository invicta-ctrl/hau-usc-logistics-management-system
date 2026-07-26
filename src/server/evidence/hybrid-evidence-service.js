import { ROLES } from '../../domain/constants.js';
import { EVIDENCE_TYPES, evidenceBackupIdempotencyKey, validateEvidenceBytes } from './evidence-contract.js';
import { createD1EvidenceBackupRepository } from './evidence-backup-repository.js';

const RETRY_DELAYS_MINUTES = Object.freeze([1, 5, 15, 60, 360, 720, 1440, 1440]);
const SAFE_ERROR_CODE = /^[A-Z][A-Z0-9_]{2,79}$/u;

export class EvidenceServiceError extends Error {
  constructor(code, message, status = 400) {
    super(message);
    this.name = 'EvidenceServiceError';
    this.code = code;
    this.status = status;
  }
}

function serviceError(code, message, status = 400) {
  return new EvidenceServiceError(code, message, status);
}

function requireSystemOwner(account) {
  if (String(account?.roleId ?? '').toUpperCase() !== ROLES.SYSTEM_OWNER) {
    throw serviceError(
      'SYSTEM_OWNER_REQUIRED',
      'Only the System Owner may inspect or restore evidence backups.',
      403,
    );
  }
}

function boundedLimit(value, fallback = 5) {
  const number = Number(value);
  return Number.isInteger(number) && number >= 1 ? Math.min(number, 25) : fallback;
}

function sanitizedErrorCode(error) {
  const code = String(error?.code ?? '').toUpperCase();
  return SAFE_ERROR_CODE.test(code) ? code : 'EVIDENCE_BACKUP_PROVIDER_FAILED';
}

function retryAt(now, attemptCount) {
  const delayMinutes =
    RETRY_DELAYS_MINUTES[Math.min(Math.max(attemptCount - 1, 0), RETRY_DELAYS_MINUTES.length - 1)];
  return new Date(Date.parse(now) + delayMinutes * 60_000).toISOString();
}

function staleBefore(now) {
  return new Date(Date.parse(now) - 15 * 60_000).toISOString();
}

export function createHybridEvidenceService({
  db,
  primaryStore,
  backupStore,
  repository = db ? createD1EvidenceBackupRepository(db) : null,
  cryptoProvider = globalThis.crypto,
  clock = { now: () => Date.now() },
} = {}) {
  if (!primaryStore) throw new Error('Primary evidence store is required.');
  if (!backupStore) throw new Error('Evidence backup store is required.');
  if (!repository) throw new Error('Evidence backup repository is required.');

  async function processOne(job, { now, correlationId }) {
    if (!(await repository.claim({ jobId: job.jobId, now, staleBefore: staleBefore(now) }))) {
      return { outcome: 'SKIPPED', evidenceId: job.evidenceId };
    }
    const attemptCount = job.attemptCount + 1;
    try {
      const primary = await primaryStore.read(job.privateStorageReference, job);
      const backup = await backupStore.backup({
        ...job,
        bytes: primary.bytes,
        idempotencyKey: job.idempotencyKey || evidenceBackupIdempotencyKey(job.evidenceId, job.sha256),
        existingDriveFileId: job.driveFileId,
      });
      await repository.markSynced({
        jobId: job.jobId,
        evidenceId: job.evidenceId,
        driveFileId: backup.driveFileId,
        sizeBytes: backup.sizeBytes,
        providerChecksum: backup.providerChecksum,
        providerChecksumType: backup.providerChecksumType,
        now,
        correlationId,
      });
      return { outcome: 'SYNCED', evidenceId: job.evidenceId };
    } catch (error) {
      const errorCode = sanitizedErrorCode(error);
      const primaryMissing = [
        'EVIDENCE_PRIMARY_NOT_FOUND',
        'EVIDENCE_PRIMARY_METADATA_MISMATCH',
        'EVIDENCE_CHECKSUM_MISMATCH',
        'EVIDENCE_SIZE_MISMATCH',
      ].includes(errorCode);
      const retrying = !primaryMissing && error?.retryable === true && attemptCount < job.maxAttempts;
      const status = primaryMissing ? 'RESTORE_REQUIRED' : retrying ? 'RETRYING' : 'FAILED';
      await repository.markFailure({
        jobId: job.jobId,
        evidenceId: job.evidenceId,
        status,
        errorCode,
        nextAttemptAt: retrying ? retryAt(now, attemptCount) : now,
        now,
        correlationId,
      });
      return { outcome: status, evidenceId: job.evidenceId, errorCode };
    }
  }

  return Object.freeze({
    status: (evidenceType) => primaryStore.status(evidenceType),
    prepare: (context) => primaryStore.prepare(context),
    upload: (prepared) => primaryStore.upload(prepared),
    remove: (privateStorageReference, evidenceId) => primaryStore.remove(privateStorageReference, evidenceId),

    async processBackups({ limit, evidenceId = '', correlationId = 'scheduled-evidence-backup' } = {}) {
      const now = new Date(clock.now()).toISOString();
      const jobs = await repository.listDue({
        now,
        staleBefore: staleBefore(now),
        limit: boundedLimit(limit),
        evidenceId: String(evidenceId ?? '').trim(),
      });
      const results = [];
      for (const job of jobs) results.push(await processOne(job, { now, correlationId }));
      return {
        processed: results.length,
        synced: results.filter((entry) => entry.outcome === 'SYNCED').length,
        retrying: results.filter((entry) => entry.outcome === 'RETRYING').length,
        failed: results.filter((entry) => entry.outcome === 'FAILED').length,
        restoreRequired: results.filter((entry) => entry.outcome === 'RESTORE_REQUIRED').length,
      };
    },

    async reconcilePrimary({ limit, correlationId = 'scheduled-evidence-reconciliation' } = {}) {
      const now = new Date(clock.now()).toISOString();
      const jobs = await repository.listForReconciliation({
        limit: boundedLimit(limit, 10),
      });
      let verified = 0;
      let restoreRequired = 0;
      for (const job of jobs) {
        const primary = await primaryStore.inspect(job.privateStorageReference, job);
        if (primary.valid) {
          await repository.markReconciled({ jobId: job.jobId, now });
          verified += 1;
          continue;
        }
        await repository.markFailure({
          jobId: job.jobId,
          evidenceId: job.evidenceId,
          status: 'RESTORE_REQUIRED',
          errorCode: primary.missing ? 'EVIDENCE_PRIMARY_NOT_FOUND' : 'EVIDENCE_PRIMARY_METADATA_MISMATCH',
          nextAttemptAt: now,
          now,
          correlationId,
        });
        restoreRequired += 1;
      }
      return { processed: jobs.length, verified, restoreRequired };
    },

    async systemStatus({ account }) {
      requireSystemOwner(account);
      const summary = await repository.statusSummary();
      return {
        primaryR2Status: primaryStore.status('OTHER_SUPPORTING_DOCUMENT').configured
          ? 'AVAILABLE'
          : 'UNAVAILABLE',
        pendingDriveBackups:
          (summary.counts.PENDING ?? 0) + (summary.counts.IN_PROGRESS ?? 0) + (summary.counts.RETRYING ?? 0),
        failedDriveBackups: summary.counts.FAILED ?? 0,
        oldestPendingBackupAt: summary.oldestPendingAt,
        lastSuccessfulBackupAt: summary.lastSuccessfulBackupAt,
        lastReconciliationAt: summary.lastReconciliationAt,
        filesRequiringRestoration: summary.filesRequiringRestoration,
        backupMessage:
          (summary.counts.PENDING ?? 0) +
            (summary.counts.IN_PROGRESS ?? 0) +
            (summary.counts.RETRYING ?? 0) +
            (summary.counts.FAILED ?? 0) >
          0
            ? '! The file was saved, but its backup is still pending. The system will try again automatically.'
            : '',
        technicalDetails: {
          driveBackupConfigured: Object.keys(EVIDENCE_TYPES).every(
            (evidenceType) => backupStore.status(evidenceType).configured,
          ),
          statusCounts: summary.counts,
          failedJobs: summary.failures,
          providerIdentifiersProtected: true,
        },
      };
    },

    async archive({ account, evidenceId, reason, correlationId }) {
      requireSystemOwner(account);
      const normalizedEvidenceId = String(evidenceId ?? '').trim();
      const normalizedReason = String(reason ?? '')
        .trim()
        .slice(0, 500);
      if (!normalizedEvidenceId) {
        throw serviceError('EVIDENCE_ID_REQUIRED', 'Select an evidence record to archive.');
      }
      if (!normalizedReason) {
        throw serviceError('ARCHIVE_REASON_REQUIRED', 'Record the reason for this archive.');
      }
      const job = await repository.get(normalizedEvidenceId);
      if (!job) {
        throw serviceError('EVIDENCE_BACKUP_NOT_FOUND', 'The selected evidence record was not found.', 404);
      }
      if (job.status === 'ARCHIVED') {
        return {
          evidenceId: job.evidenceId,
          status: 'ARCHIVED',
          duplicate: true,
          primaryCopyRetained: true,
          driveCopyRetained: Boolean(job.driveFileId),
        };
      }
      const archivedAt = new Date(clock.now()).toISOString();
      await repository.markArchived({
        evidence: job,
        archivedBy: account.id,
        archivedAt,
        reason: normalizedReason,
        correlationId,
      });
      return {
        evidenceId: job.evidenceId,
        status: 'ARCHIVED',
        archivedAt,
        duplicate: false,
        primaryCopyRetained: true,
        driveCopyRetained: Boolean(job.driveFileId),
      };
    },

    async restore({ account, evidenceId, reason, correlationId }) {
      requireSystemOwner(account);
      const normalizedEvidenceId = String(evidenceId ?? '').trim();
      const normalizedReason = String(reason ?? '')
        .trim()
        .slice(0, 500);
      if (!normalizedEvidenceId) {
        throw serviceError('EVIDENCE_ID_REQUIRED', 'Select an evidence record to restore.');
      }
      if (!normalizedReason) {
        throw serviceError('RESTORE_REASON_REQUIRED', 'Record the reason for this restore.');
      }
      const job = await repository.get(normalizedEvidenceId);
      if (!job) {
        throw serviceError('EVIDENCE_BACKUP_NOT_FOUND', 'The selected evidence backup was not found.', 404);
      }
      if (!job.driveFileId) {
        throw serviceError(
          'EVIDENCE_BACKUP_NOT_AVAILABLE',
          'A verified private recovery copy is not available.',
          409,
        );
      }
      if (job.status !== 'RESTORE_REQUIRED') {
        throw serviceError(
          'EVIDENCE_RESTORE_NOT_REQUIRED',
          'The primary evidence object is valid; restore is not required.',
          409,
        );
      }
      const restoredAt = new Date(clock.now()).toISOString();
      let restored;
      try {
        const recovered = await backupStore.download({
          ...job,
          idempotencyKey: job.idempotencyKey || evidenceBackupIdempotencyKey(job.evidenceId, job.sha256),
        });
        const validated = await validateEvidenceBytes(
          {
            bytes: recovered.bytes,
            mimeType: job.mimeType,
            expectedSize: job.sizeBytes,
            expectedSha256: job.sha256,
          },
          cryptoProvider,
        );
        restored = await primaryStore.restore({
          privateStorageReference: job.privateStorageReference,
          restoredAt,
          prepared: {
            ...job,
            timestamp: restoredAt,
            bytes: validated.bytes,
            sizeBytes: validated.bytes.byteLength,
            sha256: validated.sha256,
          },
        });
      } catch (error) {
        throw serviceError(
          sanitizedErrorCode(error),
          'The private recovery copy could not be verified and restored.',
          error?.retryable === true ? 503 : 409,
        );
      }
      await repository.recordRestore({
        evidence: job,
        driveFileId: job.driveFileId,
        restoredObjectKey: restored.restoredObjectKey,
        primaryEtag: restored.primaryEtag,
        primaryVersion: restored.primaryVersion,
        restoredBy: account.id,
        restoredAt,
        reason: normalizedReason,
        correlationId,
      });
      return {
        evidenceId: job.evidenceId,
        status: 'VERIFIED',
        restoredAt,
        priorObjectPreserved: restored.priorObjectPreserved,
      };
    },
  });
}
