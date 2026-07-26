import { describe, expect, it, vi } from 'vitest';
import { ROLES } from '../../src/domain/constants.js';
import { createIdentityRosterCrypto } from '../../src/server/identity-roster/crypto.js';
import {
  createIdentityRosterService,
  IDENTITY_ROSTER_HEADERS,
  validateIdentityRosterSource,
} from '../../src/server/identity-roster/service.js';

const owner = {
  id: 'OWNER-SYNTHETIC',
  roleId: ROLES.SYSTEM_OWNER,
  profile: { email: 'owner@example.invalid' },
};
const normalUser = {
  id: 'USER-SYNTHETIC',
  roleId: ROLES.DOL_STAFF,
  profile: { email: 'operator.one@example.invalid' },
};
const rows = [
  ['STUDENT-001', 'operator.one@example.invalid', 'Synthetic One', 'VERIFIED', true, 'Reviewed.'],
  ['STUDENT-002', 'operator.two@example.invalid', 'Synthetic Two', 'PENDING', false, ''],
];

function context(sourceRows = rows) {
  const runs = [];
  let entries = [];
  const snapshots = new Map();
  let sequence = 0;
  const repository = {
    latestRun: vi.fn(async () => runs.at(-1) ?? null),
    latestAppliedRun: vi.fn(async () => [...runs].reverse().find((run) => run.applyStatus === 'APPLIED') ?? null),
    getRun: vi.fn(async (runId) => runs.find((run) => run.id === runId) ?? null),
    listRuns: vi.fn(async () => [...runs].reverse()),
    listEntries: vi.fn(async () => structuredClone(entries)),
    getEntry: vi.fn(async (identityKey) => entries.find((entry) => entry.identityKey === identityKey) ?? null),
    createPreview: vi.fn(async (run) => runs.push({ ...run, applyStatus: 'PREVIEWED' })),
    applyRun: vi.fn(async ({ run, entries: next, snapshotEnvelope, appliedAt }) => {
      snapshots.set(run.id, snapshotEnvelope);
      entries = structuredClone(next);
      Object.assign(runs.find((entry) => entry.id === run.id), { applyStatus: 'APPLIED', appliedAt });
    }),
    getSnapshotEnvelope: vi.fn(async (runId) => snapshots.get(runId) ?? ''),
    rollbackRun: vi.fn(async ({ run, entries: restored, rolledBackAt }) => {
      entries = structuredClone(restored);
      Object.assign(runs.find((entry) => entry.id === run.id), {
        applyStatus: 'ROLLED_BACK',
        rolledBackAt,
      });
    }),
    reconcile: vi.fn(async (fingerprint, expectedCount) => ({
      entryCount: entries.length,
      matchingCount: entries.filter((entry) => entry.sourceFingerprint === fingerprint).length,
      reconciled:
        entries.length === expectedCount &&
        entries.every((entry) => entry.sourceFingerprint === fingerprint),
    })),
  };
  const source = {
    status: () => ({ configured: true, missingConfiguration: [] }),
    read: vi.fn(async () => ({ headers: [...IDENTITY_ROSTER_HEADERS], rows: sourceRows })),
  };
  const crypto = createIdentityRosterCrypto({ secret: 'synthetic-roster-secret-with-at-least-thirty-two-characters' });
  const service = createIdentityRosterService({
    repository,
    source,
    crypto,
    clock: { now: () => Date.parse(`2026-07-26T10:00:${String(sequence).padStart(2, '0')}.000Z`) },
    createId: () => `SYNTHETIC-${++sequence}`,
  });
  return { service, source, repository, runs, getEntries: () => entries, crypto };
}

describe('identity roster source validation', () => {
  it('requires the exact protected roster schema and rejects duplicates and invalid values', () => {
    expect(
      validateIdentityRosterSource({ headers: ['Institutional_Email'], rows }),
    ).toMatchObject({ valid: false, rejections: [{ codes: ['SOURCE_SCHEMA_INVALID'] }] });

    const result = validateIdentityRosterSource({
      headers: [...IDENTITY_ROSTER_HEADERS],
      rows: [
        rows[0],
        ['STUDENT-001', ' OPERATOR.ONE@example.invalid ', 'Other', 'UNKNOWN', 'MAYBE', ''],
      ],
    });
    expect(result.valid).toBe(false);
    expect(result.rejections[0].codes).toEqual(
      expect.arrayContaining([
        'VERIFICATION_RESULT_INVALID',
        'ACTIVE_VALUE_INVALID',
        'DUPLICATE_INSTITUTIONAL_EMAIL',
        'DUPLICATE_STUDENT_ID',
      ]),
    );
  });
});

describe('owner-protected identity roster service', () => {
  it('denies the full workflow to non-owners and never queries Google for self-profile lookup', async () => {
    const { service, source } = context();
    await expect(service.status({ actor: normalUser })).rejects.toMatchObject({
      code: 'ROSTER_OWNER_REQUIRED',
      status: 403,
    });
    await expect(service.preview({ actor: normalUser })).rejects.toMatchObject({
      code: 'ROSTER_OWNER_REQUIRED',
    });
    await expect(service.directory({ actor: normalUser })).rejects.toMatchObject({
      code: 'ROSTER_OWNER_REQUIRED',
    });
    await expect(service.selfProfile({ actor: normalUser })).resolves.toEqual({
      linked: false,
      profile: null,
    });
    expect(source.read).not.toHaveBeenCalled();
  });

  it('previews metadata, stores protected source rows, applies atomically, and returns allowed self data', async () => {
    const { service, repository, runs, getEntries } = context();
    const preview = await service.preview({ actor: owner, correlationId: 'COR-PREVIEW' });
    expect(preview).toMatchObject({
      acceptedCount: 2,
      rejectionCount: 0,
      addCount: 2,
      changeCount: 0,
      removalCount: 0,
      validationStatus: 'VALID',
      applyStatus: 'PREVIEWED',
    });
    expect(JSON.stringify(preview)).not.toMatch(/operator\.one|STUDENT-001|Reviewed\./iu);
    expect(runs[0].protectedSourceEnvelope).not.toMatch(/operator\.one|STUDENT-001|Reviewed\./iu);

    const applied = await service.apply({
      actor: owner,
      command: {
        runId: preview.id,
        confirmSourceFingerprint: preview.sourceFingerprint,
        reason: 'Approve the reviewed synthetic roster source.',
      },
      correlationId: 'COR-APPLY',
    });
    expect(applied).toMatchObject({ applied: true, replayed: false, reconciliation: { reconciled: true } });
    expect(repository.applyRun).toHaveBeenCalledOnce();
    expect(getEntries()).toHaveLength(2);
    expect(JSON.stringify(getEntries())).not.toMatch(/operator\.one|STUDENT-001|Reviewed\./iu);

    const self = await service.selfProfile({ actor: normalUser });
    expect(self).toMatchObject({
      linked: true,
      profile: {
        studentId: 'STUDENT-001',
        institutionalEmail: 'operator.one@example.invalid',
        verificationResult: 'VERIFIED',
        active: true,
      },
    });
    expect(self.profile).not.toHaveProperty('reviewNotes');
    expect(self.profile).not.toHaveProperty('sourceFingerprint');
  });

  it('blocks rejected previews and restores the exact protected pre-apply snapshot', async () => {
    const first = context([rows[0]]);
    const originalPreview = await first.service.preview({ actor: owner });
    await first.service.apply({
      actor: owner,
      command: {
        runId: originalPreview.id,
        confirmSourceFingerprint: originalPreview.sourceFingerprint,
        reason: 'Apply the first reviewed synthetic snapshot.',
      },
    });

    first.source.read.mockResolvedValue({
      headers: [...IDENTITY_ROSTER_HEADERS],
      rows: [rows[1]],
    });
    const replacement = await first.service.preview({ actor: owner });
    expect(replacement).toMatchObject({ addCount: 1, removalCount: 1 });
    await first.service.apply({
      actor: owner,
      command: {
        runId: replacement.id,
        confirmSourceFingerprint: replacement.sourceFingerprint,
        reason: 'Apply the replacement synthetic snapshot.',
      },
    });
    await first.service.rollback({
      actor: owner,
      command: {
        runId: replacement.id,
        confirmSourceFingerprint: replacement.sourceFingerprint,
        reason: 'Restore the prior reviewed synthetic snapshot.',
      },
    });
    await expect(first.service.selfProfile({ actor: normalUser })).resolves.toMatchObject({
      linked: true,
      profile: { studentId: 'STUDENT-001' },
    });

    const rejected = context([
      ['STUDENT-001', 'not-an-email', 'Synthetic', 'VERIFIED', true, ''],
    ]);
    const rejectedPreview = await rejected.service.preview({ actor: owner });
    await expect(
      rejected.service.apply({
        actor: owner,
        command: {
          runId: rejectedPreview.id,
          confirmSourceFingerprint: rejectedPreview.sourceFingerprint,
          reason: 'This invalid source must remain unapplied.',
        },
      }),
    ).rejects.toMatchObject({ code: 'ROSTER_PREVIEW_REJECTED' });
  });
});
