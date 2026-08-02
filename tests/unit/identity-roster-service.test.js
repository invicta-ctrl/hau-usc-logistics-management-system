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
  const idempotency = new Map();
  let sequence = 0;
  const repository = {
    latestRun: vi.fn(async () => runs.at(-1) ?? null),
    latestAppliedRun: vi.fn(
      async () => [...runs].reverse().find((run) => run.applyStatus === 'APPLIED') ?? null,
    ),
    getRun: vi.fn(async (runId) => runs.find((run) => run.id === runId) ?? null),
    listRuns: vi.fn(async () => [...runs].reverse()),
    listEntries: vi.fn(async () => structuredClone(entries)),
    getEntry: vi.fn(
      async (identityKey) => entries.find((entry) => entry.identityKey === identityKey) ?? null,
    ),
    getIdempotency: vi.fn(async (scope, key) => idempotency.get(`${scope}:${key}`) ?? null),
    createPreview: vi.fn(async (run) => runs.push({ ...run, applyStatus: 'PREVIEWED' })),
    applyRun: vi.fn(async ({ run, entries: next, snapshotEnvelope, appliedAt }) => {
      snapshots.set(run.id, snapshotEnvelope);
      entries = structuredClone(next);
      Object.assign(
        runs.find((entry) => entry.id === run.id),
        { applyStatus: 'APPLIED', appliedAt },
      );
    }),
    getSnapshotEnvelope: vi.fn(async (runId) => snapshots.get(runId) ?? ''),
    rollbackRun: vi.fn(async ({ run, entries: restored, rolledBackAt, idempotency: replay }) => {
      entries = structuredClone(restored);
      Object.assign(
        runs.find((entry) => entry.id === run.id),
        {
          applyStatus: 'ROLLED_BACK',
          rolledBackAt,
        },
      );
      idempotency.set(`${replay.scope}:${replay.key}`, {
        actorAccountId: replay.actorAccountId,
        requestFingerprint: replay.requestFingerprint,
        result: replay.result,
      });
    }),
    reconcile: vi.fn(async (fingerprint, expectedCount) => ({
      entryCount: entries.length,
      matchingCount: entries.filter((entry) => entry.sourceFingerprint === fingerprint).length,
      reconciled:
        entries.length === expectedCount && entries.every((entry) => entry.sourceFingerprint === fingerprint),
    })),
  };
  const source = {
    status: () => ({ configured: true, missingConfiguration: [] }),
    read: vi.fn(async () => ({ headers: [...IDENTITY_ROSTER_HEADERS], rows: sourceRows })),
  };
  const crypto = createIdentityRosterCrypto({
    secret: 'synthetic-roster-secret-with-at-least-thirty-two-characters',
  });
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
  it('requires the exact protected roster schema and quarantines every duplicate occurrence', () => {
    expect(validateIdentityRosterSource({ headers: ['Institutional_Email'], rows })).toMatchObject({
      valid: false,
      rejections: [{ codes: ['SOURCE_SCHEMA_INVALID'] }],
    });

    const result = validateIdentityRosterSource({
      headers: [...IDENTITY_ROSTER_HEADERS],
      rows: [rows[0], ['STUDENT-001', ' OPERATOR.ONE@example.invalid ', 'Other', 'UNKNOWN', 'MAYBE', '']],
    });
    expect(result.valid).toBe(false);
    expect(result.rows).toHaveLength(0);
    expect(result.rejections).toHaveLength(2);
    expect(result.rejections[0].codes).toEqual(
      expect.arrayContaining(['DUPLICATE_INSTITUTIONAL_EMAIL', 'DUPLICATE_STUDENT_ID']),
    );
    expect(result.rejections[1].codes).toEqual(
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
    await expect(
      service.apply({
        actor: owner,
        command: {
          runId: preview.id,
          confirmSourceFingerprint: preview.sourceFingerprint,
          reason: 'Replay the exact accepted update safely.',
        },
      }),
    ).resolves.toMatchObject({ applied: true, replayed: true });

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
        clientRequestId: 'roster-rollback-synthetic-0001',
      },
    });
    await expect(first.service.selfProfile({ actor: normalUser })).resolves.toMatchObject({
      linked: true,
      profile: { studentId: 'STUDENT-001' },
    });

    const rejected = context([['STUDENT-001', 'not-an-email', 'Synthetic', 'VERIFIED', true, '']]);
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

  it('filters and clamps the owner directory while reporting the latest applied run', async () => {
    const scenario = context();
    const preview = await scenario.service.preview({ actor: owner });
    await scenario.service.apply({
      actor: owner,
      command: {
        runId: preview.id,
        confirmSourceFingerprint: preview.sourceFingerprint,
        reason: 'Apply directory filters acceptance data.',
      },
    });
    await scenario.service.preview({ actor: owner });

    await expect(scenario.service.status({ actor: owner })).resolves.toMatchObject({
      latestRun: { applyStatus: 'PREVIEWED' },
      latestAppliedRun: { id: preview.id, applyStatus: 'APPLIED' },
    });
    await expect(
      scenario.service.directory({
        actor: owner,
        command: { active: 'INACTIVE', verificationResult: 'PENDING', page: 99.8, pageSize: 1.9 },
      }),
    ).resolves.toMatchObject({
      items: [{ studentId: 'STUDENT-002', active: false, verificationResult: 'PENDING' }],
      pagination: { page: 1, pageSize: 1, total: 1, totalPages: 1 },
    });
  });

  it('replays an exact rollback without another protected write and rejects retry-key reuse', async () => {
    const scenario = context([rows[0]]);
    const preview = await scenario.service.preview({ actor: owner });
    await scenario.service.apply({
      actor: owner,
      command: {
        runId: preview.id,
        confirmSourceFingerprint: preview.sourceFingerprint,
        reason: 'Apply rollback idempotency acceptance data.',
      },
    });
    const command = {
      runId: preview.id,
      confirmSourceFingerprint: preview.sourceFingerprint,
      reason: 'Restore rollback idempotency acceptance data.',
      clientRequestId: 'roster-rollback-idempotency-0001',
    };
    await expect(scenario.service.rollback({ actor: owner, command })).resolves.toMatchObject({
      rolledBack: true,
      replayed: false,
    });
    await expect(scenario.service.rollback({ actor: owner, command })).resolves.toMatchObject({
      rolledBack: true,
      replayed: true,
    });
    expect(scenario.repository.rollbackRun).toHaveBeenCalledOnce();
    await expect(
      scenario.service.rollback({
        actor: owner,
        command: { ...command, reason: 'A different retry payload is blocked.' },
      }),
    ).rejects.toMatchObject({ code: 'ROSTER_IDEMPOTENCY_CONFLICT', status: 409 });
  });

  it('applies valid rows while quarantining incomplete rows and preserving their current match', async () => {
    const scenario = context([rows[0]]);
    const original = await scenario.service.preview({ actor: owner });
    await scenario.service.apply({
      actor: owner,
      command: {
        runId: original.id,
        confirmSourceFingerprint: original.sourceFingerprint,
        reason: 'Apply the initial reviewed directory.',
      },
    });

    scenario.source.read.mockResolvedValue({
      headers: [...IDENTITY_ROSTER_HEADERS],
      fingerprintSource: {
        headers: ['Synthetic source headers'],
        rows: [['Synthetic exact source state']],
      },
      rows: [['STUDENT-001', 'operator.one@example.invalid', '', 'VERIFIED', true, ''], rows[1]],
    });
    const preview = await scenario.service.preview({ actor: owner });
    expect(preview).toMatchObject({
      acceptedCount: 1,
      rejectionCount: 1,
      addCount: 1,
      removalCount: 0,
      validationStatus: 'VALID_WITH_REJECTIONS',
    });
    expect(preview.rejections).toEqual([{ rowNumber: 2, codes: ['DISPLAY_NAME_INVALID'] }]);
    expect(JSON.stringify(preview)).not.toMatch(/operator\.one|STUDENT-001/iu);

    await expect(
      scenario.service.apply({
        actor: owner,
        command: {
          runId: preview.id,
          confirmSourceFingerprint: preview.sourceFingerprint,
          reason: 'Apply accepted rows and retain quarantined matches.',
        },
      }),
    ).resolves.toMatchObject({ applied: true, reconciliation: { reconciled: true } });
    await expect(scenario.service.selfProfile({ actor: normalUser })).resolves.toMatchObject({
      linked: true,
      profile: { studentId: 'STUDENT-001' },
    });
  });

  it('rejects superseded, source-changed, and no-op previews', async () => {
    const scenario = context([rows[0]]);
    const superseded = await scenario.service.preview({ actor: owner });
    scenario.source.read.mockResolvedValue({
      headers: [...IDENTITY_ROSTER_HEADERS],
      rows: [rows[1]],
    });
    const latest = await scenario.service.preview({ actor: owner });
    await expect(
      scenario.service.apply({
        actor: owner,
        command: {
          runId: superseded.id,
          confirmSourceFingerprint: superseded.sourceFingerprint,
          reason: 'Reject the superseded directory preview.',
        },
      }),
    ).rejects.toMatchObject({ code: 'ROSTER_PREVIEW_STALE' });

    scenario.source.read.mockResolvedValue({
      headers: [...IDENTITY_ROSTER_HEADERS],
      rows: [rows[0]],
    });
    await expect(
      scenario.service.apply({
        actor: owner,
        command: {
          runId: latest.id,
          confirmSourceFingerprint: latest.sourceFingerprint,
          reason: 'Reject the changed private source safely.',
        },
      }),
    ).rejects.toMatchObject({ code: 'ROSTER_PREVIEW_STALE' });

    const accepted = await scenario.service.preview({ actor: owner });
    await scenario.service.apply({
      actor: owner,
      command: {
        runId: accepted.id,
        confirmSourceFingerprint: accepted.sourceFingerprint,
        reason: 'Apply the current reviewed directory.',
      },
    });
    const noOp = await scenario.service.preview({ actor: owner });
    await expect(
      scenario.service.apply({
        actor: owner,
        command: {
          runId: noOp.id,
          confirmSourceFingerprint: noOp.sourceFingerprint,
          reason: 'Prevent a duplicate directory application.',
        },
      }),
    ).rejects.toMatchObject({ code: 'ROSTER_SOURCE_ALREADY_APPLIED' });
  });
});
