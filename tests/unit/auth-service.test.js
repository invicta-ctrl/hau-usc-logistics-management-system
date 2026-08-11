import { timingSafeEqual, webcrypto } from 'node:crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CAPABILITIES, COMMITTEES } from '../../src/domain/permissions.js';
import { ACCOUNT_STATUS } from '../../src/server/auth/contracts.js';
import { createPasswordKdf, createTokenCrypto } from '../../src/server/auth/crypto.js';
import {
  createInMemoryAuthRepository,
  createSlidingWindowRateLimiter,
} from '../../src/server/auth/repository.js';
import { createAuthService } from '../../src/server/auth/service.js';

const repositoryByService = new WeakMap();

function testContext({ loginLimit = 10, activationLifecycle, rateLimiter } = {}) {
  let timestamp = Date.parse('2026-07-21T08:00:00.000Z');
  let sequence = 0;
  const clock = {
    now: () => timestamp,
    advance: (durationMs) => {
      timestamp += durationMs;
    },
  };
  const repository = createInMemoryAuthRepository();
  const passwordKdf = createPasswordKdf({
    cryptoProvider: webcrypto,
    timingSafeEqual,
    defaultIterations: 1_000,
    minimumIterations: 1_000,
  });
  const tokenCrypto = createTokenCrypto({ cryptoProvider: webcrypto, timingSafeEqual });
  const service = createAuthService({
    repository,
    passwordKdf,
    tokenCrypto,
    rateLimiter: rateLimiter ?? createSlidingWindowRateLimiter({ limit: loginLimit, windowMs: 60_000 }),
    activationLifecycle,
    clock,
    createId: () => `SYNTHETIC-ID-${String(++sequence).padStart(4, '0')}`,
  });
  repositoryByService.set(service, repository);
  return { service, repository, clock };
}

async function activate(
  service,
  {
    accessId = 'HAU-ADMIN-001',
    temporaryPassword = 'Starter!Password9472',
    roleId = 'ADMINISTRATOR',
    committeeIds = [],
    defaultCommitteeId = '',
  } = {},
) {
  const repository = repositoryByService.get(service);
  const starter = await service.createStarterAccount({
    accessId,
    temporaryPassword,
    roleId,
    committeeIds,
    defaultCommitteeId,
  });
  const login = await service.login({
    accessId,
    password: temporaryPassword,
    networkKey: 'synthetic-network',
  });
  const activated = await service.activateStarter({
    activationToken: login.activationToken,
    csrfToken: login.csrfToken,
    profile: {
      fullName: 'Synthetic Test User',
      mobileNumber: '+63 917 000 0000',
      email: `${accessId.toLowerCase()}@example.test`,
    },
    password: 'Activated!Password9472',
    confirmPassword: 'Activated!Password9472',
    roleId: 'DIRECTOR',
    committeeIds: [COMMITTEES.MATERIALS],
  });
  const activatedAccount = repository.inspect().accounts.find((account) => account.id === starter.accountId);
  await repository.saveAccount({
    ...activatedAccount,
    verifiedEmailFingerprint: `synthetic:${accessId.toLowerCase()}`,
  });
  return { starter, login, activated };
}

describe('v0.6 authentication and onboarding service', () => {
  let context;

  beforeEach(() => {
    context = testContext();
  });

  it('activates a starter account without accepting client role or scope escalation', async () => {
    const { service, repository } = context;
    const result = await activate(service, {
      roleId: 'DOL_STAFF',
      committeeIds: [COMMITTEES.FOOD],
      defaultCommitteeId: COMMITTEES.FOOD,
    });

    expect(result.login.state).toBe('ACTIVATION_REQUIRED');
    expect(result.activated.user).toMatchObject({
      accountStatus: ACCOUNT_STATUS.ACTIVE,
      onboardingComplete: true,
      experienceId: 'food',
      authorization: {
        roleId: 'DOL_STAFF',
        committeeIds: [COMMITTEES.FOOD],
        mappingStatus: 'MAPPED',
      },
    });
    const account = repository.inspect().accounts[0];
    expect(account.passwordCredential).not.toHaveProperty('password');
    expect(account.temporaryCredential.consumedAt).toBeTruthy();
    expect(account.profileEmailVerifiedAt).toBeTruthy();
    expect(account.roleId).toBe('DOL_STAFF');
    expect(account.committeeIds).toEqual([COMMITTEES.FOOD]);
    await expect(
      service.login({
        accessId: 'hau-admin-001@example.test',
        password: 'Activated!Password9472',
        networkKey: 'verified-email-network',
      }),
    ).resolves.toMatchObject({ state: 'AUTHENTICATED' });
  });

  it('rejects timestamp-only email ownership and accepts a qualified fingerprint', async () => {
    const { service, repository } = context;
    const active = await activate(service, { accessId: 'HAU-EMAIL-001' });
    const account = repository
      .inspect()
      .accounts.find((entry) => entry.accessIdNormalized === 'HAU-EMAIL-001');
    const email = 'hau-email-001@example.test';

    await repository.saveAccount({ ...account, verifiedEmailFingerprint: '' });
    await expect(
      service.login({
        accessId: email,
        password: 'Activated!Password9472',
        networkKey: 'timestamp-only-email',
      }),
    ).rejects.toMatchObject({ code: 'AUTHENTICATION_FAILED' });

    await repository.saveAccount({ ...account, verifiedEmailFingerprint: 'approved-email-fingerprint' });
    await expect(
      service.login({
        accessId: email,
        password: 'Activated!Password9472',
        networkKey: 'approved-email',
      }),
    ).resolves.toMatchObject({ state: 'AUTHENTICATED' });
    expect(active.activated.state).toBe('AUTHENTICATED');
  });

  it('enforces an injected approved-email activation lifecycle and completes its follow-up', async () => {
    const activationLifecycle = {
      validateProfile: vi.fn(async ({ profile }) => profile.email === 'approved@example.test'),
      complete: vi.fn(async () => ({ linked: true, reconciled: true })),
      reconcile: vi.fn(async () => ({ linked: true, reconciled: false })),
    };
    const { service } = testContext({ activationLifecycle });
    await service.createStarterAccount({
      accessId: 'HAU-APPROVED-001',
      temporaryPassword: 'Starter!Password9472',
      roleId: 'ADMINISTRATOR',
    });
    const login = await service.login({
      accessId: 'HAU-APPROVED-001',
      password: 'Starter!Password9472',
    });
    await expect(
      service.activateStarter({
        activationToken: login.activationToken,
        csrfToken: login.csrfToken,
        profile: {
          fullName: 'Approved Applicant',
          mobileNumber: '+639170000001',
          email: 'different@example.test',
        },
        password: 'Activated!Password9472',
        confirmPassword: 'Activated!Password9472',
      }),
    ).rejects.toMatchObject({ code: 'ONBOARDING_INVALID' });

    const activated = await service.activateStarter({
      activationToken: login.activationToken,
      csrfToken: login.csrfToken,
      profile: {
        fullName: 'Approved Applicant',
        mobileNumber: '+639170000001',
        email: 'approved@example.test',
      },
      password: 'Activated!Password9472',
      confirmPassword: 'Activated!Password9472',
    });
    expect(activationLifecycle.complete).toHaveBeenCalledOnce();
    await expect(
      service.authorizeSession({ sessionToken: activated.sessionToken, mutation: false }),
    ).resolves.toMatchObject({ authorization: { active: true } });
  });

  it('does not issue an authenticated session when activation reconciliation fails', async () => {
    const activationLifecycle = {
      validateProfile: vi.fn(async () => true),
      complete: vi.fn(async () => {
        throw new Error('synthetic reconciliation failure');
      }),
      reconcile: vi.fn(async () => {
        throw new Error('synthetic reconciliation failure');
      }),
    };
    const { service, repository } = testContext({ activationLifecycle });
    await service.createStarterAccount({
      accessId: 'HAU-ACTIVATION-FAIL-001',
      temporaryPassword: 'Starter!Password9472',
      roleId: 'ADMINISTRATOR',
    });
    const login = await service.login({
      accessId: 'HAU-ACTIVATION-FAIL-001',
      password: 'Starter!Password9472',
    });

    await expect(
      service.activateStarter({
        activationToken: login.activationToken,
        csrfToken: login.csrfToken,
        profile: {
          fullName: 'Synthetic Activation Failure',
          mobileNumber: '+639170000001',
          email: 'approved@example.test',
        },
        password: 'Activated!Password9472',
        confirmPassword: 'Activated!Password9472',
      }),
    ).rejects.toMatchObject({ code: 'ACTIVATION_INVALID' });
    expect(repository.inspect().sessions).toEqual([]);

    await expect(
      service.login({
        accessId: 'HAU-ACTIVATION-FAIL-001',
        password: 'Activated!Password9472',
      }),
    ).rejects.toMatchObject({ code: 'ACTIVATION_INVALID' });
    expect(repository.inspect().sessions).toEqual([]);

    activationLifecycle.reconcile.mockResolvedValueOnce({ linked: true, reconciled: true });
    await expect(
      service.login({
        accessId: 'HAU-ACTIVATION-FAIL-001',
        password: 'Activated!Password9472',
      }),
    ).resolves.toMatchObject({ state: 'AUTHENTICATED' });
  });

  it('signs in with a mutable username while keeping limiter keys free of the raw identifier', async () => {
    const consume = vi.fn(async () => ({ allowed: true }));
    const reset = vi.fn(async () => undefined);
    const { service, repository } = testContext({ rateLimiter: { consume, reset } });
    const active = await activate(service, { accessId: 'HAU-USERNAME-001' });
    const account = repository.inspect().accounts[0];
    await repository.saveAccount({ ...account, usernameNormalized: 'approved.user' });

    await expect(
      service.login({
        accessId: 'approved.user',
        password: 'Activated!Password9472',
        networkKey: 'synthetic-network',
      }),
    ).resolves.toMatchObject({ state: 'AUTHENTICATED' });
    expect(consume.mock.calls.at(-1)[0]).not.toContain('approved.user');
    expect(active.activated.state).toBe('AUTHENTICATED');
  });

  it('does not allow ordinary starter-account creation to assign System Owner', async () => {
    await expect(
      context.service.createStarterAccount({
        accessId: 'HAU-OWNER-001',
        temporaryPassword: 'Starter!Password9472',
        roleId: 'SYSTEM_OWNER',
      }),
    ).rejects.toMatchObject({ code: 'STARTER_ASSIGNMENT_INVALID' });
  });

  it('issues a playground session only for an active, onboarded, unlocked System Owner', async () => {
    const { service, repository } = context;
    await activate(service, { accessId: 'HAU-PLAYGROUND-OWNER-001' });
    const account = repository.inspect().accounts[0];
    const owner = { ...account, roleId: 'SYSTEM_OWNER' };
    await repository.saveAccount(owner);

    const issued = await service.issuePlaygroundSession({ accountId: owner.id });
    expect(issued).toMatchObject({
      state: 'AUTHENTICATED',
      user: { authorization: { roleId: 'SYSTEM_OWNER' } },
    });
    expect(issued.sessionToken).toBeTruthy();
    expect(issued.csrfToken).toBeTruthy();
    expect(repository.inspect().auditEvents.at(-1)).toMatchObject({ event: 'PLAYGROUND_SESSION_ISSUED' });

    await repository.saveAccount({ ...owner, lockedAt: '2026-07-21T08:05:00.000Z' });
    await expect(service.issuePlaygroundSession({ accountId: owner.id })).rejects.toMatchObject({
      code: 'ACCOUNT_UNAVAILABLE',
    });
    await expect(service.issuePlaygroundSession({ accountId: 'browser-selected-id' })).rejects.toMatchObject({
      code: 'ACCOUNT_UNAVAILABLE',
    });
  });

  it('rejects wrong passwords, expired temporary passwords, and activation replay', async () => {
    const { service, clock } = context;
    await service.createStarterAccount({
      accessId: 'HAU-FOOD-001',
      temporaryPassword: 'Starter!Password9472',
      roleId: 'DOL_STAFF',
      committeeIds: [COMMITTEES.FOOD],
      temporaryPasswordExpiresAt: '2026-07-21T08:01:00.000Z',
    });
    await expect(
      service.login({ accessId: 'HAU-FOOD-001', password: 'Wrong!Password9472' }),
    ).rejects.toMatchObject({ code: 'AUTHENTICATION_FAILED' });
    clock.advance(61_000);
    await expect(
      service.login({ accessId: 'HAU-FOOD-001', password: 'Starter!Password9472' }),
    ).rejects.toMatchObject({ code: 'AUTHENTICATION_FAILED' });

    const active = await activate(service, { accessId: 'HAU-ADMIN-002' });
    await expect(
      service.activateStarter({
        activationToken: active.login.activationToken,
        csrfToken: active.login.csrfToken,
        profile: { fullName: 'Replay User', mobileNumber: '+639170000001', email: 'replay@example.test' },
        password: 'Another!Password9472',
        confirmPassword: 'Another!Password9472',
      }),
    ).rejects.toMatchObject({ code: 'ACTIVATION_INVALID' });
  });

  it('validates onboarding fields and password confirmation before mutation', async () => {
    const { service, repository } = context;
    await service.createStarterAccount({
      accessId: 'HAU-MAT-001',
      temporaryPassword: 'Starter!Password9472',
      roleId: 'COMMITTEE_HEAD',
      committeeIds: [COMMITTEES.MATERIALS],
    });
    const login = await service.login({ accessId: 'HAU-MAT-001', password: 'Starter!Password9472' });
    await expect(
      service.activateStarter({
        activationToken: login.activationToken,
        csrfToken: login.csrfToken,
        profile: { fullName: 'X', mobileNumber: 'no', email: 'bad' },
        password: 'Activated!Password9472',
        confirmPassword: 'different',
      }),
    ).rejects.toMatchObject({ code: 'ONBOARDING_INVALID' });
    expect(repository.inspect().accounts[0].status).toBe(ACCOUNT_STATUS.STARTER);
  });

  it('fails closed for disabled and revoked accounts and invalidates sessions', async () => {
    const { service, repository } = context;
    const active = await activate(service);
    const account = repository.inspect().accounts[0];
    await repository.saveAccount({
      ...account,
      status: ACCOUNT_STATUS.DISABLED,
      credentialVersion: account.credentialVersion + 1,
    });
    await expect(service.getSession({ sessionToken: active.activated.sessionToken })).rejects.toMatchObject({
      code: 'SESSION_INVALID',
    });
    await expect(
      service.login({ accessId: 'HAU-ADMIN-001', password: 'Activated!Password9472' }),
    ).rejects.toMatchObject({ code: 'ACCOUNT_UNAVAILABLE' });
    const disabled = repository.inspect().accounts[0];
    await repository.saveAccount({
      ...disabled,
      status: ACCOUNT_STATUS.REVOKED,
      credentialVersion: disabled.credentialVersion + 1,
    });
    await expect(
      service.login({ accessId: 'HAU-ADMIN-001', password: 'Activated!Password9472' }),
    ).rejects.toMatchObject({ code: 'ACCOUNT_UNAVAILABLE' });
  });

  it('fails closed for a locked account and invalidates its existing session', async () => {
    const { service, repository } = context;
    const active = await activate(service);
    const account = repository.inspect().accounts[0];
    await repository.saveAccount({
      ...account,
      lockedAt: '2026-07-21T08:05:00.000Z',
    });

    await expect(service.getSession({ sessionToken: active.activated.sessionToken })).rejects.toMatchObject({
      code: 'SESSION_INVALID',
    });
    await expect(
      service.login({ accessId: 'HAU-ADMIN-001', password: 'Activated!Password9472' }),
    ).rejects.toMatchObject({ code: 'ACCOUNT_UNAVAILABLE' });
  });

  it('requires a valid session, CSRF token, capability, and committee scope', async () => {
    const { service } = context;
    const food = await activate(service, {
      accessId: 'HAU-FOOD-002',
      roleId: 'DOL_STAFF',
      committeeIds: [COMMITTEES.FOOD],
      defaultCommitteeId: COMMITTEES.FOOD,
    });
    const auth = food.activated;

    await expect(service.authorize({ capability: CAPABILITIES.FULFILL_RECEIVE })).rejects.toMatchObject({
      code: 'SESSION_REQUIRED',
    });
    await expect(
      service.authorize({
        sessionToken: auth.sessionToken,
        csrfToken: 'wrong-token',
        capability: CAPABILITIES.FULFILL_RECEIVE,
        resource: { committeeId: COMMITTEES.FOOD },
      }),
    ).rejects.toMatchObject({ code: 'CSRF_INVALID' });
    await expect(
      service.authorize({
        sessionToken: auth.sessionToken,
        csrfToken: auth.csrfToken,
        capability: CAPABILITIES.SYSTEM_ADMIN,
        resource: { committeeId: COMMITTEES.FOOD },
      }),
    ).rejects.toMatchObject({ code: 'CAPABILITY_REQUIRED' });
    await expect(
      service.authorize({
        sessionToken: auth.sessionToken,
        csrfToken: auth.csrfToken,
        capability: CAPABILITIES.FULFILL_RECEIVE,
        resource: { committeeId: COMMITTEES.MATERIALS },
      }),
    ).rejects.toMatchObject({ code: 'OUT_OF_SCOPE' });
    await expect(
      service.authorize({
        sessionToken: auth.sessionToken,
        csrfToken: auth.csrfToken,
        capability: CAPABILITIES.FULFILL_RECEIVE,
        resource: { committeeId: COMMITTEES.FOOD },
      }),
    ).resolves.toMatchObject({ authorization: { roleId: 'DOL_STAFF' } });
  });

  it('throttles repeated login failures without exposing unknown accounts', async () => {
    const limited = testContext({ loginLimit: 2 });
    await expect(
      limited.service.login({ accessId: 'HAU-NONE-001', password: 'Wrong!Password9472', networkKey: 'one' }),
    ).rejects.toMatchObject({ code: 'AUTHENTICATION_FAILED' });
    await expect(
      limited.service.login({ accessId: 'HAU-NONE-001', password: 'Wrong!Password9472', networkKey: 'one' }),
    ).rejects.toMatchObject({ code: 'AUTHENTICATION_FAILED' });
    await expect(
      limited.service.login({ accessId: 'HAU-NONE-001', password: 'Wrong!Password9472', networkKey: 'one' }),
    ).rejects.toMatchObject({ code: 'AUTHENTICATION_THROTTLED' });
  });

  it('invalidates existing sessions after an administrator-issued password reset', async () => {
    const { service, repository } = context;
    const admin = await activate(service, { accessId: 'HAU-ADMIN-003' });
    const target = await activate(service, {
      accessId: 'HAU-INV-001',
      roleId: 'DOL_STAFF',
      committeeIds: [COMMITTEES.INVENTORY_PANTRY],
      defaultCommitteeId: COMMITTEES.INVENTORY_PANTRY,
    });
    const reset = await service.issuePasswordReset({
      sessionToken: admin.activated.sessionToken,
      csrfToken: admin.activated.csrfToken,
      targetAccountId: target.starter.accountId,
    });
    await service.completePasswordReset({
      resetToken: reset.deliveryToken,
      password: 'Reset!Password9472',
      confirmPassword: 'Reset!Password9472',
    });
    await expect(service.getSession({ sessionToken: target.activated.sessionToken })).rejects.toMatchObject({
      code: 'SESSION_REQUIRED',
    });
    await expect(
      service.completePasswordReset({
        resetToken: reset.deliveryToken,
        password: 'Another!Password9472',
        confirmPassword: 'Another!Password9472',
      }),
    ).rejects.toMatchObject({ code: 'RESET_INVALID' });
    await expect(
      service.login({ accessId: 'HAU-INV-001', password: 'Reset!Password9472' }),
    ).resolves.toMatchObject({ state: 'AUTHENTICATED' });
    const targetAccount = repository
      .inspect()
      .accounts.find((account) => account.id === target.starter.accountId);
    expect(targetAccount.committeeIds).toEqual([COMMITTEES.INVENTORY_PANTRY]);
    expect(
      repository.inspect().auditEvents.filter((event) => event.event === 'PASSWORD_RESET_COMPLETED'),
    ).toHaveLength(1);
  });
});
