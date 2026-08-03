import { describe, expect, it } from 'vitest';
import { createProfileService } from '../../src/server/profile/service.js';

const NOW = '2026-08-03T12:00:00.000Z';
const NEXT = '2026-08-03T12:01:00.000Z';
const ACTOR = {
  id: 'ACCOUNT-SELF-1',
  status: 'ACTIVE',
  roleId: 'REQUESTER',
  committeeIds: [],
  accessProfile: null,
};

function profile(overrides = {}) {
  return {
    accountId: ACTOR.id,
    accessId: 'REQ-SELF-1',
    status: 'ACTIVE',
    roleId: 'REQUESTER',
    defaultCommitteeId: '',
    committeeIds: [],
    fullName: 'Synthetic Requester',
    mobileNumber: '+639171234567',
    email: 'requester@example.test',
    profileEmailVerifiedAt: NOW,
    username: 'synthetic.user',
    courseId: 'COURSE-1',
    yearLevel: 2,
    departmentId: 'DEPT-1',
    departmentDisplayName: 'Synthetic Department',
    institutionId: 'INST-1',
    avatarAssetKey: '',
    avatarUpdatedAt: null,
    passwordCredential: { secret: 'CurrentPassword!123' },
    credentialVersion: 3,
    updatedAt: NOW,
    ...overrides,
  };
}

class FakeProfileRepository {
  constructor(current = profile()) {
    this.current = { ...current };
    this.idempotency = new Map();
    this.history = [];
    this.corrections = [];
    this.audits = [];
    this.sessionsRevoked = 0;
    this.forceConflict = false;
  }

  async getProfile(accountId) {
    return accountId === this.current.accountId ? { ...this.current } : null;
  }

  async getIdempotency(scope, key) {
    return this.idempotency.get(`${scope}:${key}`) ?? null;
  }

  async findUsername(username, accountId) {
    return username === this.current.username && accountId !== this.current.accountId
      ? this.current.accountId
      : null;
  }

  remember(evidence) {
    this.audits.push(evidence.audit);
    this.idempotency.set(`${evidence.idempotency.scope}:${evidence.idempotency.key}`, {
      actorAccountId: evidence.idempotency.actorAccountId,
      requestFingerprint: evidence.idempotency.requestFingerprint,
      result: evidence.idempotency.result,
    });
  }

  guard(expectedUpdatedAt) {
    if (this.forceConflict || this.current.updatedAt !== expectedUpdatedAt) {
      const error = new Error('profile changed');
      error.code = 'REVISION_CONFLICT';
      error.status = 409;
      throw error;
    }
  }

  async updateContact({ expectedUpdatedAt, mobileNumber, changedAt, evidence }) {
    this.guard(expectedUpdatedAt);
    this.current.mobileNumber = mobileNumber;
    this.current.updatedAt = changedAt;
    this.remember(evidence);
    return this.getProfile(this.current.accountId);
  }

  async changeUsername({ expectedUpdatedAt, newUsername, changedAt, evidence }) {
    this.guard(expectedUpdatedAt);
    this.current.username = newUsername;
    this.current.updatedAt = changedAt;
    this.current.credentialVersion += 1;
    this.history.push({ old: 'synthetic.user', next: newUsername, key: evidence.idempotency.key });
    this.sessionsRevoked += 1;
    this.remember(evidence);
    return this.getProfile(this.current.accountId);
  }

  async changePassword({ expectedUpdatedAt, passwordCredential, changedAt, evidence }) {
    this.guard(expectedUpdatedAt);
    this.current.passwordCredential = passwordCredential;
    this.current.updatedAt = changedAt;
    this.current.credentialVersion += 1;
    this.sessionsRevoked += 1;
    this.remember(evidence);
    return this.getProfile(this.current.accountId);
  }

  async createIdentityCorrection({ id, state, revision, createdAt, updatedAt, clientRequestId, evidence }) {
    this.corrections.push({ id, state, revision, createdAt, updatedAt, clientRequestId });
    this.remember(evidence);
  }
}

function makeService(repository, overrides = {}) {
  const passwordKdf = {
    async verify(value, credential) {
      return value === credential?.secret;
    },
    async hash(value) {
      return { algorithm: 'TEST', hash: value, secret: value };
    },
  };
  return createProfileService({
    repository,
    passwordKdf,
    clock: { now: () => new Date(NEXT).getTime() },
    protectIdentityRequest: async (value) =>
      JSON.stringify({ protected: true, length: JSON.stringify(value).length }),
    ...overrides,
  });
}

function mutation(overrides = {}) {
  return { expectedRevision: NOW, clientRequestId: 'profile-request-0001', ...overrides };
}

describe('v0.7.2 self-profile service', () => {
  it('returns an authorized privacy-safe profile DTO and rejects inactive actors', async () => {
    const repository = new FakeProfileRepository();
    const service = makeService(repository);
    await expect(service.get({ actor: ACTOR })).resolves.toMatchObject({
      ok: true,
      profile: {
        accountCode: 'REQ-SELF-1',
        verifiedEmail: 'requester@example.test',
        username: 'synthetic.user',
        revision: NOW,
        avatar: { available: false, fallback: 'INITIALS' },
      },
    });
    const privateDto = (await service.get({ actor: ACTOR })).profile;
    expect(privateDto).not.toHaveProperty('accountId');
    await expect(service.get({ actor: { ...ACTOR, status: 'DISABLED' } })).rejects.toMatchObject({
      code: 'ACCOUNT_UNAVAILABLE',
      status: 403,
    });
  });

  it('guards contact changes, records safe audit, and replays idempotently', async () => {
    const repository = new FakeProfileRepository();
    const service = makeService(repository);
    const first = await service.updateContact({
      actor: ACTOR,
      command: mutation({ contactNumber: '+639189876543' }),
    });
    expect(first).toMatchObject({ changed: true, sessionsRevoked: false, replayed: false });
    expect(repository.audits[0].after).toEqual({ contactChanged: true, sessionsRevoked: false });
    expect(JSON.stringify(repository.audits[0])).not.toContain('+639189876543');
    await expect(
      service.updateContact({ actor: ACTOR, command: mutation({ contactNumber: '+639189876543' }) }),
    ).resolves.toMatchObject({ replayed: true, profile: { contactNumber: '+639189876543' } });
    await expect(
      service.updateContact({
        actor: ACTOR,
        command: mutation({ contactNumber: '+639100000000', clientRequestId: 'profile-request-0001' }),
      }),
    ).rejects.toMatchObject({ code: 'IDEMPOTENCY_CONFLICT', status: 409 });
  });

  it('normalizes usernames, requires current password, writes history, and revokes sessions', async () => {
    const repository = new FakeProfileRepository();
    const service = makeService(repository);
    await expect(
      service.changeUsername({
        actor: ACTOR,
        command: mutation({ username: 'New.User', currentPassword: 'wrong-password' }),
      }),
    ).rejects.toMatchObject({ code: 'CURRENT_PASSWORD_INVALID' });
    const changed = await service.changeUsername({
      actor: ACTOR,
      command: mutation({
        username: 'New.User',
        currentPassword: 'CurrentPassword!123',
        clientRequestId: 'username-0001',
      }),
    });
    expect(changed).toMatchObject({ username: 'new.user', sessionsRevoked: true });
    expect(repository.history).toHaveLength(1);
    expect(repository.sessionsRevoked).toBe(1);
    expect(JSON.stringify(repository.audits.at(-1))).not.toContain('new.user');
  });

  it('changes passwords only after policy and current-password checks, then revokes sessions', async () => {
    const repository = new FakeProfileRepository();
    const service = makeService(repository);
    await expect(
      service.changePassword({
        actor: ACTOR,
        command: mutation({
          currentPassword: 'CurrentPassword!123',
          newPassword: 'short',
          confirmPassword: 'short',
        }),
      }),
    ).rejects.toMatchObject({ code: 'PASSWORD_POLICY_FAILED' });
    const changed = await service.changePassword({
      actor: ACTOR,
      command: mutation({
        currentPassword: 'CurrentPassword!123',
        newPassword: 'NewStrongPassword!123',
        confirmPassword: 'NewStrongPassword!123',
        clientRequestId: 'password-0001',
      }),
    });
    expect(changed).toMatchObject({ credentialVersion: 4, sessionsRevoked: true });
    expect(JSON.stringify(repository.audits.at(-1))).not.toContain('NewStrongPassword!123');
    expect(repository.sessionsRevoked).toBe(1);
  });

  it('creates protected identity correction requests without changing canonical identity', async () => {
    const repository = new FakeProfileRepository();
    const service = makeService(repository);
    const before = { ...repository.current };
    const result = await service.requestIdentityCorrection({
      actor: ACTOR,
      command: {
        legalName: 'Corrected Synthetic Requester',
        contactNumber: '+639189876543',
        email: 'corrected@example.test',
        reason: 'Roster correction requested',
        clientRequestId: 'identity-correction-0001',
      },
    });
    expect(result).toMatchObject({
      created: true,
      canonicalIdentityChanged: false,
      correction: { state: 'PENDING' },
    });
    expect(repository.current).toEqual(before);
    expect(repository.corrections).toHaveLength(1);
    expect(JSON.stringify(repository.audits.at(-1))).not.toContain('corrected@example.test');
  });

  it('fails closed when protected identity storage is not configured', async () => {
    const service = makeService(new FakeProfileRepository(), { protectIdentityRequest: undefined });
    await expect(
      service.requestIdentityCorrection({
        actor: ACTOR,
        command: {
          legalName: 'Corrected Synthetic Requester',
          contactNumber: '+639189876543',
          email: 'corrected@example.test',
          reason: 'Roster correction requested',
          clientRequestId: 'identity-correction-unavailable',
        },
      }),
    ).rejects.toMatchObject({ code: 'IDENTITY_CORRECTION_UNAVAILABLE', status: 503 });
  });

  it('returns a truthful avatar-unavailable fallback', async () => {
    const service = makeService(new FakeProfileRepository());
    await expect(service.avatar({ actor: ACTOR })).resolves.toMatchObject({
      ok: false,
      available: false,
      code: 'PROFILE_AVATAR_UNAVAILABLE',
    });
  });
});
