import { describe, expect, it, vi } from 'vitest';
import { ROLES } from '../../src/domain/constants.js';
import {
  IDENTITY_FOUNDATION_RECONCILIATION_STATUS,
  createIdentityFoundationReconciliationService,
} from '../../src/server/identity-foundation/reconciliation.js';

const owner = { id: 'OWNER-SYNTHETIC', roleId: ROLES.SYSTEM_OWNER };
const time = '2026-08-14T00:00:00.000Z';

function context({
  run = {
    id: 'RUN-SYNTHETIC-001',
    applyStatus: 'APPLIED',
    sourceFingerprint: 'SHA256-SYNTHETIC-SOURCE',
    sourceRowCount: 3,
    acceptedCount: 2,
    rejectionCount: 1,
  },
  entries = [
    {
      identityKey: 'IDN-SYNTHETIC-ONE',
      protectedProfileEnvelope: 'v1.synthetic.one',
      active: true,
      sourceFingerprint: 'SHA256-SYNTHETIC-SOURCE',
      sourceRunId: 'RUN-SYNTHETIC-001',
      updatedAt: time,
    },
    {
      identityKey: 'IDN-SYNTHETIC-TWO',
      protectedProfileEnvelope: 'v1.synthetic.two',
      active: true,
      sourceFingerprint: 'SHA256-SYNTHETIC-SOURCE',
      sourceRunId: 'RUN-SYNTHETIC-001',
      updatedAt: time,
    },
  ],
  canonicalMatches = new Map(),
  accountCandidates = new Map(),
  activeLinks = new Map(),
} = {}) {
  const profiles = new Map([
    [
      'v1.synthetic.one',
      {
        institutionalEmail: 'operator.one@example.invalid',
        verificationResult: 'VERIFIED',
        active: true,
      },
    ],
    [
      'v1.synthetic.two',
      {
        institutionalEmail: 'operator.two@example.invalid',
        verificationResult: 'VERIFIED',
        active: true,
      },
    ],
  ]);
  const crypto = {
    decrypt: vi.fn(async (envelope) => profiles.get(envelope)),
    identityKey: vi.fn(async (email) => {
      const normalized = String(email).trim().toLowerCase();
      return normalized.includes('one') ? 'IDN-SYNTHETIC-ONE' : 'IDN-SYNTHETIC-TWO';
    }),
    fingerprint: vi.fn(async () => 'SHA256-SYNTHETIC-PLAN'),
  };
  const legacyRosterRepository = {
    latestAppliedRun: vi.fn(async () => run),
    listEntries: vi.fn(async () => structuredClone(entries)),
  };
  const foundationRepository = {
    listCanonicalEmailMatches: vi.fn(async (fingerprint) => canonicalMatches.get(fingerprint) ?? []),
    listAccountsByVerifiedEmailFingerprint: vi.fn(
      async (fingerprint) => accountCandidates.get(fingerprint) ?? [],
    ),
    getActiveAccountStaffLink: vi.fn(async (accountId) => activeLinks.get(accountId) ?? null),
  };
  return {
    service: createIdentityFoundationReconciliationService({
      legacyRosterRepository,
      foundationRepository,
      crypto,
    }),
    legacyRosterRepository,
    foundationRepository,
    crypto,
  };
}

describe('canonical identity reconciliation preview', () => {
  it('requires the System Owner before reading the protected projection', async () => {
    const { service, legacyRosterRepository } = context();

    await expect(
      service.preview({ actor: { id: 'USER-SYNTHETIC', roleId: ROLES.DOL_STAFF } }),
    ).rejects.toMatchObject({
      code: 'IDENTITY_FOUNDATION_OWNER_REQUIRED',
      status: 403,
    });
    expect(legacyRosterRepository.listEntries).not.toHaveBeenCalled();
  });

  it('reports the exact persisted projection count and only redacted candidate counts', async () => {
    const { service, crypto } = context({
      canonicalMatches: new Map([
        [
          'IDN-SYNTHETIC-TWO',
          [
            {
              personId: 'PER-123E4567-E89B-42D3-A456-426614174000',
              state: 'ACTIVE',
              verificationState: 'VERIFIED',
            },
          ],
        ],
      ]),
      accountCandidates: new Map([
        [
          'IDN-SYNTHETIC-ONE',
          [
            {
              id: 'ACCOUNT-SYNTHETIC-001',
              status: 'ACTIVE',
              profileEmailVerifiedAt: time,
            },
          ],
        ],
      ]),
    });

    const plan = await service.preview({ actor: owner });

    expect(plan).toMatchObject({
      status: IDENTITY_FOUNDATION_RECONCILIATION_STATUS.READY,
      source: {
        sourceRowCount: 3,
        acceptedProjectionCount: 2,
        rejectedSourceRowCount: 1,
        currentProjectionEntryCount: 2,
        projectionDiscrepancy: 0,
        providerRead: false,
      },
      candidates: {
        canonicalPersonCreateCount: 1,
        canonicalPersonExistingCount: 1,
        explicitAccountLinkCandidateCount: 1,
        quarantineCount: 0,
        assignmentCreateCount: 0,
      },
      safety: {
        dataMutation: false,
        privilegeMutation: false,
        effectiveDatesInvented: false,
      },
      planFingerprint: 'SHA256-SYNTHETIC-PLAN',
    });
    const serialized = JSON.stringify(plan);
    expect(serialized).not.toContain('operator.one@example.invalid');
    expect(serialized).not.toContain('IDN-SYNTHETIC-ONE');
    expect(crypto.decrypt).toHaveBeenCalledTimes(2);
  });

  it('fails closed on a persisted source-projection count mismatch before decrypting profiles', async () => {
    const { service, crypto } = context({
      entries: [
        {
          identityKey: 'IDN-SYNTHETIC-ONE',
          protectedProfileEnvelope: 'v1.synthetic.one',
          active: true,
          sourceFingerprint: 'SHA256-SYNTHETIC-SOURCE',
          sourceRunId: 'RUN-SYNTHETIC-001',
          updatedAt: time,
        },
      ],
    });

    const plan = await service.preview({ actor: owner });

    expect(plan).toMatchObject({
      status: IDENTITY_FOUNDATION_RECONCILIATION_STATUS.BLOCKED_SOURCE_PROJECTION_MISMATCH,
      source: { acceptedProjectionCount: 2, currentProjectionEntryCount: 1, projectionDiscrepancy: 1 },
      candidates: { canonicalPersonCreateCount: 0, quarantineCount: 0 },
    });
    expect(crypto.decrypt).not.toHaveBeenCalled();
  });

  it('fails closed when a stale persisted projection row would otherwise hide behind the source count', async () => {
    const { service, crypto } = context({
      entries: [
        {
          identityKey: 'IDN-SYNTHETIC-ONE',
          protectedProfileEnvelope: 'v1.synthetic.one',
          active: true,
          sourceFingerprint: 'SHA256-SYNTHETIC-SOURCE',
          sourceRunId: 'RUN-SYNTHETIC-001',
          updatedAt: time,
        },
        {
          identityKey: 'IDN-SYNTHETIC-TWO',
          protectedProfileEnvelope: 'v1.synthetic.two',
          active: true,
          sourceFingerprint: 'SHA256-SYNTHETIC-SOURCE',
          sourceRunId: 'RUN-SYNTHETIC-001',
          updatedAt: time,
        },
        {
          identityKey: 'IDN-SYNTHETIC-STALE',
          protectedProfileEnvelope: 'v1.synthetic.two',
          active: false,
          sourceFingerprint: 'SHA256-SYNTHETIC-OLDER',
          sourceRunId: 'RUN-SYNTHETIC-OLDER',
          updatedAt: time,
        },
      ],
    });

    const plan = await service.preview({ actor: owner });

    expect(plan).toMatchObject({
      status: IDENTITY_FOUNDATION_RECONCILIATION_STATUS.BLOCKED_SOURCE_PROJECTION_MISMATCH,
      source: { acceptedProjectionCount: 2, currentProjectionEntryCount: 3, matchingProjectionEntryCount: 2 },
    });
    expect(crypto.decrypt).not.toHaveBeenCalled();
  });

  it('quarantines ambiguous canonical or account matches without inferring access', async () => {
    const { service } = context({
      canonicalMatches: new Map([
        [
          'IDN-SYNTHETIC-ONE',
          [
            {
              personId: 'PER-123E4567-E89B-42D3-A456-426614174000',
              state: 'ACTIVE',
              verificationState: 'VERIFIED',
            },
            {
              personId: 'PER-223E4567-E89B-42D3-A456-426614174000',
              state: 'ACTIVE',
              verificationState: 'VERIFIED',
            },
          ],
        ],
      ]),
      accountCandidates: new Map([
        [
          'IDN-SYNTHETIC-TWO',
          [
            { id: 'ACCOUNT-SYNTHETIC-001', status: 'ACTIVE', profileEmailVerifiedAt: time },
            { id: 'ACCOUNT-SYNTHETIC-002', status: 'STARTER', profileEmailVerifiedAt: time },
          ],
        ],
      ]),
    });

    const plan = await service.preview({ actor: owner });

    expect(plan).toMatchObject({
      status: IDENTITY_FOUNDATION_RECONCILIATION_STATUS.READY_WITH_QUARANTINE,
      candidates: {
        canonicalPersonCreateCount: 0,
        explicitAccountLinkCandidateCount: 0,
        quarantineCount: 2,
        assignmentCreateCount: 0,
      },
      safety: { dataMutation: false, privilegeMutation: false },
    });
  });
});
