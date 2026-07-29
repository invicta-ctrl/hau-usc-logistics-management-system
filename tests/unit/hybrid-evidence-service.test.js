import { describe, expect, it, vi } from 'vitest';
import { ROLES } from '../../src/domain/constants.js';
import { sha256Hex } from '../../src/server/evidence/evidence-contract.js';
import {
  createHybridEvidenceService,
  EvidenceServiceError,
} from '../../src/server/evidence/hybrid-evidence-service.js';

function pngFixture() {
  return new Uint8Array([
    0x89,
    0x50,
    0x4e,
    0x47,
    0x0d,
    0x0a,
    0x1a,
    0x0a,
    ...new TextEncoder().encode('hybrid-evidence'),
  ]);
}

async function jobFixture(overrides = {}) {
  return {
    jobId: 'EBJ-SYNTHETIC',
    evidenceId: 'EVD-SYNTHETIC',
    evidenceType: 'RELEASE_CONFIRMATION_PHOTO',
    normalizedFileName: 'REL-PHOTO_SYNTHETIC.png',
    mimeType: 'image/png',
    sizeBytes: pngFixture().byteLength,
    sha256: await sha256Hex(pngFixture()),
    privateStorageReference: 'protected-r2-key',
    idempotencyKey: 'EVD-SYNTHETIC:checksum',
    status: 'PENDING',
    attemptCount: 0,
    maxAttempts: 8,
    driveFileId: '',
    ...overrides,
  };
}

function serviceFixture({ job, backupError, claim = true } = {}) {
  const repository = {
    listDue: vi.fn(async () => (job ? [job] : [])),
    listForReconciliation: vi.fn(async () => (job ? [job] : [])),
    claim: vi.fn(async () => claim),
    markReconciled: vi.fn(async () => {}),
    markSynced: vi.fn(async () => {}),
    markFailure: vi.fn(async () => {}),
    statusSummary: vi.fn(async () => ({
      counts: { PENDING: 1, FAILED: 0, RESTORE_REQUIRED: 0 },
      oldestPendingAt: '2026-07-26T08:00:00.000Z',
      lastSuccessfulBackupAt: '',
      lastReconciliationAt: '2026-07-26T08:05:00.000Z',
      filesRequiringRestoration: [],
      failures: [],
    })),
    get: vi.fn(async () => job ?? null),
    markArchived: vi.fn(async () => {}),
    recordRestore: vi.fn(async () => {}),
  };
  const primaryStore = {
    status: vi.fn(() => ({ configured: true })),
    prepare: vi.fn(),
    upload: vi.fn(),
    remove: vi.fn(),
    read: vi.fn(async () => ({ bytes: pngFixture() })),
    inspect: vi.fn(async () => ({ configured: true, valid: true, missing: false })),
    restore: vi.fn(async () => ({
      restoredObjectKey: 'protected-r2-key.restored-20260726100000',
      primaryEtag: 'restored-etag',
      primaryVersion: 'restored-version',
      priorObjectPreserved: true,
    })),
  };
  const backupStore = {
    status: vi.fn(() => ({ configured: true })),
    backup: vi.fn(async () => {
      if (backupError) throw backupError;
      return {
        driveFileId: 'protected-drive-file-id',
        sizeBytes: pngFixture().byteLength,
        providerChecksum: 'provider-checksum',
        providerChecksumType: 'SHA256',
      };
    }),
    download: vi.fn(async () => ({ bytes: pngFixture() })),
  };
  return {
    repository,
    primaryStore,
    backupStore,
    service: createHybridEvidenceService({
      repository,
      primaryStore,
      backupStore,
      clock: { now: () => Date.parse('2026-07-26T10:00:00.000Z') },
    }),
  };
}

describe('hybrid evidence service', () => {
  it('keeps the accepted R2 object and schedules a retry while Drive is unavailable', async () => {
    const job = await jobFixture();
    const unavailable = Object.assign(new Error('provider unavailable'), {
      code: 'EVIDENCE_BACKUP_UPLOAD_FAILED',
      retryable: true,
    });
    const fixture = serviceFixture({ job, backupError: unavailable });

    await expect(
      fixture.service.processBackups({ evidenceId: job.evidenceId, correlationId: 'COR-1' }),
    ).resolves.toEqual({
      processed: 1,
      synced: 0,
      retrying: 1,
      failed: 0,
      restoreRequired: 0,
    });
    expect(fixture.primaryStore.remove).not.toHaveBeenCalled();
    expect(fixture.repository.markFailure).toHaveBeenCalledWith(
      expect.objectContaining({
        evidenceId: job.evidenceId,
        status: 'RETRYING',
        errorCode: 'EVIDENCE_BACKUP_UPLOAD_FAILED',
        nextAttemptAt: '2026-07-26T10:01:00.000Z',
      }),
    );
  });

  it('does not call Drive when a duplicate delivery loses the D1 claim', async () => {
    const job = await jobFixture();
    const fixture = serviceFixture({ job, claim: false });

    await expect(fixture.service.processBackups()).resolves.toMatchObject({ processed: 1 });
    expect(fixture.backupStore.backup).not.toHaveBeenCalled();
    expect(fixture.repository.markSynced).not.toHaveBeenCalled();
  });

  it('requires the System Owner for status and restore', async () => {
    const job = await jobFixture({ driveFileId: 'protected-drive-file-id' });
    const fixture = serviceFixture({ job });
    const unauthorized = { id: 'ACC-ADMIN', roleId: 'ADMINISTRATOR' };

    await expect(fixture.service.systemStatus({ account: unauthorized })).rejects.toEqual(
      expect.objectContaining({
        code: 'SYSTEM_OWNER_REQUIRED',
        status: 403,
      }),
    );
    await expect(
      fixture.service.archive({
        account: unauthorized,
        evidenceId: job.evidenceId,
        reason: 'Synthetic denial',
      }),
    ).rejects.toBeInstanceOf(EvidenceServiceError);
    await expect(
      fixture.service.restore({
        account: unauthorized,
        evidenceId: job.evidenceId,
        reason: 'Synthetic denial',
      }),
    ).rejects.toBeInstanceOf(EvidenceServiceError);
  });

  it('archives evidence while retaining both private copies and appending protected history', async () => {
    const job = await jobFixture({ status: 'SYNCED', driveFileId: 'protected-drive-file-id' });
    const fixture = serviceFixture({ job });
    const owner = { id: 'ACC-OWNER', roleId: ROLES.SYSTEM_OWNER };

    await expect(
      fixture.service.archive({
        account: owner,
        evidenceId: job.evidenceId,
        reason: 'Synthetic acceptance cleanup',
        correlationId: 'COR-ARCHIVE',
      }),
    ).resolves.toEqual({
      evidenceId: job.evidenceId,
      status: 'ARCHIVED',
      archivedAt: '2026-07-26T10:00:00.000Z',
      duplicate: false,
      primaryCopyRetained: true,
      driveCopyRetained: true,
    });
    expect(fixture.repository.markArchived).toHaveBeenCalledWith(
      expect.objectContaining({
        archivedBy: owner.id,
        reason: 'Synthetic acceptance cleanup',
      }),
    );
    expect(fixture.primaryStore.remove).not.toHaveBeenCalled();
  });

  it('refuses to restore a valid primary object', async () => {
    const job = await jobFixture({ status: 'SYNCED', driveFileId: 'protected-drive-file-id' });
    const fixture = serviceFixture({ job });

    await expect(
      fixture.service.restore({
        account: { id: 'ACC-OWNER', roleId: ROLES.SYSTEM_OWNER },
        evidenceId: job.evidenceId,
        reason: 'Unnecessary restore',
        correlationId: 'COR-NO-RESTORE',
      }),
    ).rejects.toMatchObject({
      code: 'EVIDENCE_RESTORE_NOT_REQUIRED',
      status: 409,
    });
    expect(fixture.backupStore.download).not.toHaveBeenCalled();
    expect(fixture.primaryStore.restore).not.toHaveBeenCalled();
  });

  it('marks a synced backup for restore when R2 reconciliation finds its primary missing', async () => {
    const job = await jobFixture({ status: 'SYNCED', driveFileId: 'protected-drive-file-id' });
    const fixture = serviceFixture({ job });
    fixture.primaryStore.inspect.mockResolvedValue({
      configured: true,
      valid: false,
      missing: true,
    });

    await expect(fixture.service.reconcilePrimary({ correlationId: 'COR-RECONCILE' })).resolves.toEqual({
      processed: 1,
      verified: 0,
      restoreRequired: 1,
    });
    expect(fixture.repository.markFailure).toHaveBeenCalledWith(
      expect.objectContaining({
        evidenceId: job.evidenceId,
        status: 'RESTORE_REQUIRED',
        errorCode: 'EVIDENCE_PRIMARY_NOT_FOUND',
      }),
    );
  });

  it('restores a verified Drive copy to a versioned R2 key and appends protected history', async () => {
    const job = await jobFixture({
      status: 'RESTORE_REQUIRED',
      driveFileId: 'protected-drive-file-id',
    });
    const fixture = serviceFixture({ job });
    const owner = { id: 'ACC-OWNER', roleId: ROLES.SYSTEM_OWNER };

    await expect(
      fixture.service.restore({
        account: owner,
        evidenceId: job.evidenceId,
        reason: 'Primary object reconciliation',
        correlationId: 'COR-RESTORE',
      }),
    ).resolves.toEqual({
      evidenceId: job.evidenceId,
      status: 'VERIFIED',
      restoredAt: '2026-07-26T10:00:00.000Z',
      priorObjectPreserved: true,
    });
    expect(fixture.backupStore.download).toHaveBeenCalledWith(
      expect.objectContaining({
        driveFileId: 'protected-drive-file-id',
        evidenceId: job.evidenceId,
      }),
    );
    expect(fixture.primaryStore.restore).toHaveBeenCalledWith(
      expect.objectContaining({
        privateStorageReference: 'protected-r2-key',
        prepared: expect.objectContaining({ sha256: job.sha256 }),
      }),
    );
    expect(fixture.repository.recordRestore).toHaveBeenCalledWith(
      expect.objectContaining({
        restoredBy: owner.id,
        reason: 'Primary object reconciliation',
        restoredObjectKey: 'protected-r2-key.restored-20260726100000',
      }),
    );
  });

  it('returns owner status without exposing bucket, object, Drive, OAuth, or provider error data', async () => {
    const job = await jobFixture();
    const fixture = serviceFixture({ job });
    const status = await fixture.service.systemStatus({
      account: { id: 'ACC-OWNER', roleId: ROLES.SYSTEM_OWNER },
    });
    const ordinary = JSON.stringify(status);

    expect(status).toMatchObject({
      primaryR2Status: 'AVAILABLE',
      pendingDriveBackups: 1,
      failedDriveBackups: 0,
      backupMessage:
        '! The file was saved, but its backup is still pending. The system will try again automatically.',
      technicalDetails: { providerIdentifiersProtected: true },
    });
    expect(ordinary).not.toContain('protected-r2-key');
    expect(ordinary).not.toContain('protected-drive-file-id');
    expect(ordinary).not.toContain('oauth');
    expect(ordinary).not.toContain('provider unavailable');
  });

  it('returns only safe selected-evidence backup state to the System Owner', async () => {
    const job = await jobFixture({ status: 'SYNCED', driveFileId: 'protected-drive-file-id' });
    const fixture = serviceFixture({ job });

    const status = await fixture.service.systemStatus({
      account: { id: 'ACC-OWNER', roleId: ROLES.SYSTEM_OWNER },
      evidenceId: job.evidenceId,
    });

    expect(status.selectedEvidence).toEqual({
      evidenceId: job.evidenceId,
      status: 'SYNCED',
      attemptCount: 0,
      hasVerifiedDriveCopy: true,
    });
    expect(JSON.stringify(status.selectedEvidence)).not.toContain('protected-drive-file-id');
  });
});
