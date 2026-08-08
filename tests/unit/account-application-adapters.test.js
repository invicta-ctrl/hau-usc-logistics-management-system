import { describe, expect, it, vi } from 'vitest';
import {
  createAccountApplicationActivationHandoff,
  createAccountApplicationActivationLifecycle,
  createAccountApplicationIdentityAdapters,
  parseAccountApplicationIdentityClasses,
} from '../../src/server/account-application/adapters.js';

function rosterFixture() {
  const profiles = new Map();
  const crypto = {
    identityKey: async (email) => `identity:${String(email).toLowerCase()}`,
    encrypt: async (value) => ({ protected: value }),
    decrypt: async (envelope) => envelope.protected,
    fingerprint: async (value) =>
      `SHA256-${Buffer.from(JSON.stringify(value)).toString('base64url').slice(0, 64)}`,
  };
  const repository = {
    getEntry: async (key) => profiles.get(key),
  };
  const add = async (profile, overrides = {}) => {
    const identityKey = await crypto.identityKey(profile.institutionalEmail);
    profiles.set(identityKey, {
      identityKey,
      protectedProfileEnvelope: await crypto.encrypt(profile),
      active: true,
      sourceFingerprint: 'roster-source-1',
      ...overrides,
    });
    return identityKey;
  };
  return { crypto, repository, add };
}

describe('v0.7.2 account-application production adapters', () => {
  it('parses only complete, non-overlapping private identity-class registries', () => {
    expect(
      parseAccountApplicationIdentityClasses(
        JSON.stringify([{ id: 'STUDENT', domains: ['students.example.test'] }]),
      ),
    ).toEqual([{ id: 'STUDENT', domains: ['students.example.test'] }]);
    expect(parseAccountApplicationIdentityClasses('not-json')).toEqual([]);
    expect(
      parseAccountApplicationIdentityClasses([
        { id: 'A', domains: ['same.example.test'] },
        { id: 'B', domains: ['same.example.test'] },
      ]),
    ).toEqual([]);
  });

  it('anchors verification and submission eligibility to the protected active roster', async () => {
    const roster = rosterFixture();
    await roster.add({
      institutionalEmail: 'student@students.example.test',
      studentId: '20260001',
      displayName: 'Student User',
      verificationResult: 'VERIFIED',
      active: true,
    });
    const adapters = createAccountApplicationIdentityAdapters({
      rosterRepository: roster.repository,
      rosterCrypto: roster.crypto,
      identityClasses: [{ id: 'STUDENT', domains: ['students.example.test'] }],
    });

    const prepared = await adapters.identityProtection.prepareEmail(' Student@Students.Example.Test ');
    expect(prepared).toMatchObject({
      approved: true,
      emailFingerprint: 'identity:student@students.example.test',
      identityClassId: 'STUDENT',
      providerDelivery: { institutionalEmail: 'student@students.example.test' },
    });
    await expect(
      adapters.submissionEligibility.evaluate({
        emailFingerprint: prepared.emailFingerprint,
        identityClassId: 'STUDENT',
        requestedUsernameNormalized: 'student.user',
        requestedAccessFingerprint: 'SHA256-access',
      }),
    ).resolves.toMatchObject({ allowed: true, claimFingerprint: expect.stringMatching(/^SHA256-/u) });
    await expect(adapters.identityProtection.prepareEmail('student@other.example.test')).resolves.toBeNull();

    const protectedProfile = await adapters.identityProtection.protectApplicationProfile({
      legalName: 'Student User',
      contactNumber: '+63 917 000 0000',
    });
    await expect(
      adapters.reviewDisclosure.reveal({
        emailFingerprint: prepared.emailFingerprint,
        identityClassId: prepared.identityClassId,
        protectedEmailEnvelope: prepared.protectedEmailEnvelope,
        protectedProfileEnvelope: protectedProfile.protectedProfileEnvelope,
      }),
    ).resolves.toMatchObject({
      verifiedEmail: 'student@students.example.test',
      legalName: 'Student User',
      contactNumber: '+63 917 000 0000',
      identityVerification: { rosterMatched: true, legalNameMatched: true },
    });
  });

  it('builds a canonical starter account and keeps the temporary password in the one-time handoff only', async () => {
    const roster = rosterFixture();
    const emailFingerprint = await roster.add({
      institutionalEmail: 'student@students.example.test',
      studentId: '20260001',
      verificationResult: 'VERIFIED',
      active: true,
    });
    const handoff = createAccountApplicationActivationHandoff({
      accessRepository: {
        nextGeneratedAccessId: vi.fn(async () => 'DOL-2026-0001'),
        listAccessPolicyReferences: vi.fn(async () => ({
          capabilities: [],
          locationScopeIds: [],
          eventSeriesScopeIds: [],
          eventScopeIds: [],
        })),
      },
      rosterRepository: roster.repository,
      rosterCrypto: roster.crypto,
      passwordKdf: {
        hash: vi.fn(async () => ({
          algorithm: 'PBKDF2-SHA-256',
          iterations: 100_000,
          salt: 'synthetic-salt',
          hash: 'synthetic-hash',
          peppered: true,
        })),
      },
      createId: () => 'ACCOUNT-APPLICATION-STARTER-1',
      createTemporaryPassword: () => 'Generated!Temporary9472',
    });
    const result = await handoff.prepare({
      actor: { roleId: 'DIRECTOR' },
      approvedAt: '2026-08-03T00:00:00.000Z',
      application: {
        emailFingerprint,
        departmentId: 'DEPT-1',
        courseId: 'COURSE-1',
        yearLevel: 2,
        requestedUsernameNormalized: 'student.user',
        requestedAccess: {
          requestedAccountType: 'REQUESTER_ONLY',
          requestedRoleId: 'REQUESTER',
          requestedCommitteeIds: [],
          requestedWorkspaceIds: [],
          lendingSelfService: true,
          internalLendingOperations: false,
          requestCenterAccess: true,
        },
      },
    });

    expect(result.starterAccount).toMatchObject({
      accessIdNormalized: 'DOL-2026-0001',
      collisionKey: 'DOL20260001',
      roleId: 'REQUESTER',
      usernameNormalized: 'student.user',
      verifiedEmailFingerprint: emailFingerprint,
      lendingEligible: true,
      institutionId: '20260001',
      departmentId: '',
      profileDepartmentId: 'DEPT-1',
      temporaryCredential: { consumedAt: null },
    });
    expect(result.starterAccount).not.toHaveProperty('temporaryPassword');
    expect(result.privateHandoff).toMatchObject({
      accountCode: 'DOL-2026-0001',
      temporaryPassword: 'Generated!Temporary9472',
      delivery: 'APPROVED_PRIVATE_HANDOFF_REQUIRED',
    });
  });

  it('validates the activation email fingerprint and idempotently advances the linked application', async () => {
    const activateApprovedApplication = vi.fn(async () => ({ ok: true }));
    const lifecycle = createAccountApplicationActivationLifecycle({
      applicationService: { activateApprovedApplication },
      applicationRepository: {
        getApplicationByApprovedAccountId: vi.fn(async () => ({
          id: 'APPLICATION-1',
          state: 'APPROVED_ACTIVATION_REQUIRED',
          revision: 7,
        })),
      },
      rosterCrypto: { identityKey: async (email) => `identity:${email}` },
    });
    const account = {
      id: 'ACCOUNT-1',
      verifiedEmailFingerprint: 'identity:student@students.example.test',
    };

    await expect(
      lifecycle.validateProfile({ account, profile: { email: 'student@students.example.test' } }),
    ).resolves.toBe(true);
    await expect(
      lifecycle.validateProfile({ account, profile: { email: 'different@students.example.test' } }),
    ).resolves.toBe(false);
    await lifecycle.complete({ account });
    expect(activateApprovedApplication).toHaveBeenCalledWith({
      actor: { id: 'ACCOUNT-1', activationCompleted: true },
      applicationId: 'APPLICATION-1',
      expectedRevision: 7,
      clientRequestId: 'account-activation:ACCOUNT-1',
    });
  });
});
