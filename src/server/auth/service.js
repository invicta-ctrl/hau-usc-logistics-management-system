import { CAPABILITIES } from '../../domain/permissions.js';
import {
  ACCOUNT_STATUS,
  accountAuthorization,
  normalizeAccessId,
  normalizeCommitteeIds,
  normalizeVerifiedEmail,
  SESSION_KIND,
  sessionUserDto,
  validateOnboardingProfile,
  validateStarterAssignment,
} from './contracts.js';
import { validateNewPassword } from './crypto.js';

const SAFE_MESSAGES = Object.freeze({
  AUTHENTICATION_FAILED: 'The Access ID or password is incorrect.',
  AUTHENTICATION_THROTTLED: 'Too many sign-in attempts. Try again later.',
  ACCOUNT_UNAVAILABLE: 'This account is not available. Contact an administrator.',
  ACTIVATION_REQUIRED: 'Complete first-login activation to continue.',
  ACTIVATION_INVALID: 'The activation session is invalid or expired.',
  ACTIVATION_REPLAYED: 'This starter account has already been activated.',
  ONBOARDING_INVALID: 'Review the highlighted onboarding fields.',
  PASSWORD_POLICY_FAILED: 'The new password does not meet the security requirements.',
  SESSION_REQUIRED: 'Sign in to continue.',
  SESSION_INVALID: 'Your session is invalid or expired. Sign in again.',
  CSRF_INVALID: 'The security token is invalid. Refresh and try again.',
  CAPABILITY_REQUIRED: 'This action is not authorized.',
  ENTITY_SCOPE_REQUIRED: 'This action requires a verified committee scope.',
  OUT_OF_SCOPE: 'This record is outside your authorized committee scope.',
  RESET_INVALID: 'The password reset link is invalid or expired.',
  ACCOUNT_EXISTS: 'The Access ID is already assigned.',
  STARTER_ASSIGNMENT_INVALID: 'The starter account role or committee assignment is invalid.',
  SELF_ACCESS_CHANGE_BLOCKED: 'You cannot change your own account status.',
});

export class AuthError extends Error {
  constructor(code, { fieldErrors, retryAfterMs } = {}) {
    super(SAFE_MESSAGES[code] ?? 'The authentication request could not be completed.');
    this.name = 'AuthError';
    this.code = code;
    this.fieldErrors = fieldErrors;
    this.retryAfterMs = retryAfterMs;
  }
}

function assert(condition, code, details) {
  if (!condition) throw new AuthError(code, details);
}

function nowIso(clock) {
  return new Date(clock.now()).toISOString();
}

function addMs(iso, durationMs) {
  return new Date(new Date(iso).getTime() + durationMs).toISOString();
}

function safeNetworkKey(value) {
  return (
    String(value ?? 'unknown')
      .trim()
      .slice(0, 128) || 'unknown'
  );
}

export function createAuthService({
  repository,
  passwordKdf,
  tokenCrypto,
  rateLimiter,
  activationLifecycle,
  clock = Date,
  createId = () => globalThis.crypto.randomUUID(),
  config = {},
} = {}) {
  if (!repository || !passwordKdf || !tokenCrypto || !rateLimiter) {
    throw new Error('Authentication repository, crypto, and rate limiter adapters are required.');
  }
  const settings = Object.freeze({
    activationSessionMs: config.activationSessionMs ?? 10 * 60 * 1000,
    sessionMs: config.sessionMs ?? 8 * 60 * 60 * 1000,
    resetMs: config.resetMs ?? 20 * 60 * 1000,
    temporaryPasswordMs: config.temporaryPasswordMs ?? 72 * 60 * 60 * 1000,
  });
  let dummyCredentialPromise;

  const audit = (event, accountId, details = {}) =>
    repository.appendAudit({
      id: createId(),
      event,
      accountId: accountId || '',
      occurredAt: nowIso(clock),
      details,
    });

  const dummyCredential = () => {
    dummyCredentialPromise ??= passwordKdf.hash('Dummy-only!Password-9472');
    return dummyCredentialPromise;
  };

  async function issueSession(account, kind, durationMs) {
    const token = tokenCrypto.createToken();
    const csrfToken = tokenCrypto.createToken();
    const issuedAt = nowIso(clock);
    const session = {
      id: createId(),
      kind,
      accountId: account.id,
      tokenDigest: await tokenCrypto.digest(token),
      csrfDigest: await tokenCrypto.digest(csrfToken),
      credentialVersion: account.credentialVersion,
      issuedAt,
      expiresAt: addMs(issuedAt, durationMs),
    };
    await repository.createSession(session);
    return { token, csrfToken, session };
  }

  async function readSession(sessionToken, expectedKind = SESSION_KIND.AUTHENTICATED) {
    const tokenDigest = await tokenCrypto.digest(sessionToken);
    const session = tokenDigest ? await repository.getSession(tokenDigest) : null;
    assert(
      session && session.kind === expectedKind,
      expectedKind === SESSION_KIND.ACTIVATION ? 'ACTIVATION_INVALID' : 'SESSION_REQUIRED',
    );
    if (new Date(session.expiresAt).getTime() <= clock.now()) {
      await repository.deleteSession(session.tokenDigest);
      throw new AuthError(
        expectedKind === SESSION_KIND.ACTIVATION ? 'ACTIVATION_INVALID' : 'SESSION_INVALID',
      );
    }
    const account = await repository.getAccountById(session.accountId);
    const allowedStatus =
      expectedKind === SESSION_KIND.ACTIVATION ? ACCOUNT_STATUS.STARTER : ACCOUNT_STATUS.ACTIVE;
    if (
      !account ||
      account.status !== allowedStatus ||
      account.credentialVersion !== session.credentialVersion ||
      account.lockedAt
    ) {
      await repository.deleteSession(session.tokenDigest);
      throw new AuthError(
        expectedKind === SESSION_KIND.ACTIVATION ? 'ACTIVATION_INVALID' : 'SESSION_INVALID',
      );
    }
    return { account, session };
  }

  async function requireCsrf(session, csrfToken) {
    assert(await tokenCrypto.matches(csrfToken, session.csrfDigest), 'CSRF_INVALID');
  }

  async function createStarterAccount({
    accessId,
    temporaryPassword,
    roleId,
    committeeIds = [],
    defaultCommitteeId = '',
    temporaryPasswordExpiresAt,
    createdBy = 'SYSTEM',
  } = {}) {
    const accessIdNormalized = normalizeAccessId(accessId);
    assert(accessIdNormalized, 'STARTER_ASSIGNMENT_INVALID');
    const assignment = validateStarterAssignment({ roleId, committeeIds, defaultCommitteeId });
    assert(assignment.valid, 'STARTER_ASSIGNMENT_INVALID');
    assert(!(await repository.getAccountByAccessId(accessIdNormalized)), 'ACCOUNT_EXISTS');
    const temporaryCredential = await passwordKdf.hash(temporaryPassword);
    const createdAt = nowIso(clock);
    const account = {
      id: createId(),
      accessIdNormalized,
      status: ACCOUNT_STATUS.STARTER,
      roleId: assignment.roleId,
      committeeIds: assignment.committeeIds,
      defaultCommitteeId: assignment.defaultCommitteeId,
      profile: null,
      passwordCredential: null,
      temporaryCredential: {
        ...temporaryCredential,
        expiresAt: temporaryPasswordExpiresAt ?? addMs(createdAt, settings.temporaryPasswordMs),
        consumedAt: null,
      },
      credentialVersion: 1,
      onboardingCompletedAt: null,
      createdAt,
      updatedAt: createdAt,
    };
    await repository.saveAccount(account);
    await audit('STARTER_ACCOUNT_CREATED', account.id, {
      createdBy,
      roleId: account.roleId,
      committeeIds: account.committeeIds,
    });
    return {
      accountId: account.id,
      accessId: accessIdNormalized,
      expiresAt: account.temporaryCredential.expiresAt,
    };
  }

  async function login({ accessId, password, networkKey } = {}) {
    const candidate = String(accessId ?? '').trim();
    const loginIdentifier =
      normalizeVerifiedEmail(candidate) ||
      (/^[A-Za-z0-9][A-Za-z0-9._-]{3,63}$/u.test(candidate) ? candidate.toLowerCase() : '');
    const limiterIdentity = loginIdentifier ? await tokenCrypto.digest(loginIdentifier) : 'invalid';
    const limiterKey = `${limiterIdentity}:${safeNetworkKey(networkKey)}`;
    const limit = await rateLimiter.consume(limiterKey, clock.now());
    assert(limit.allowed, 'AUTHENTICATION_THROTTLED', { retryAfterMs: limit.retryAfterMs });
    const account = loginIdentifier
      ? await (repository.getAccountByLoginIdentifier?.(loginIdentifier) ??
          repository.getAccountByAccessId(loginIdentifier))
      : null;
    const credential =
      account?.status === ACCOUNT_STATUS.STARTER ? account.temporaryCredential : account?.passwordCredential;
    const verified = await passwordKdf.verify(password, credential ?? (await dummyCredential()));
    if (!account || !verified) {
      await audit('LOGIN_FAILED', account?.id, { reason: 'INVALID_CREDENTIAL' });
      throw new AuthError('AUTHENTICATION_FAILED');
    }
    if ([ACCOUNT_STATUS.DISABLED, ACCOUNT_STATUS.REVOKED].includes(account.status) || account.lockedAt) {
      await audit('LOGIN_BLOCKED', account.id, { reason: account.lockedAt ? 'LOCKED' : account.status });
      throw new AuthError('ACCOUNT_UNAVAILABLE');
    }
    if (account.status === ACCOUNT_STATUS.STARTER) {
      const temporary = account.temporaryCredential;
      if (temporary?.consumedAt) throw new AuthError('ACTIVATION_REPLAYED');
      if (!temporary?.expiresAt || new Date(temporary.expiresAt).getTime() <= clock.now()) {
        await audit('STARTER_LOGIN_BLOCKED', account.id, { reason: 'TEMPORARY_PASSWORD_EXPIRED' });
        throw new AuthError('AUTHENTICATION_FAILED');
      }
      const issued = await issueSession(account, SESSION_KIND.ACTIVATION, settings.activationSessionMs);
      await rateLimiter.reset(limiterKey);
      await audit('STARTER_LOGIN_VERIFIED', account.id);
      return {
        state: 'ACTIVATION_REQUIRED',
        activationToken: issued.token,
        csrfToken: issued.csrfToken,
        expiresAt: issued.session.expiresAt,
      };
    }
    assert(account.status === ACCOUNT_STATUS.ACTIVE && account.onboardingCompletedAt, 'ACCOUNT_UNAVAILABLE');
    if (typeof activationLifecycle?.reconcile === 'function') {
      try {
        await activationLifecycle.reconcile({ account });
      } catch {
        await audit('ACCOUNT_APPLICATION_ACTIVATION_RECONCILIATION_FAILED', account.id);
        throw new AuthError('ACTIVATION_INVALID');
      }
    }
    const issued = await issueSession(account, SESSION_KIND.AUTHENTICATED, settings.sessionMs);
    await rateLimiter.reset(limiterKey);
    await audit('LOGIN_SUCCEEDED', account.id);
    return {
      state: 'AUTHENTICATED',
      sessionToken: issued.token,
      csrfToken: issued.csrfToken,
      user: sessionUserDto(account, issued.session),
    };
  }

  async function activateStarter({ activationToken, csrfToken, profile, password, confirmPassword } = {}) {
    const current = await readSession(activationToken, SESSION_KIND.ACTIVATION);
    await requireCsrf(current.session, csrfToken);
    const validatedProfile = validateOnboardingProfile(profile);
    assert(validatedProfile.valid, 'ONBOARDING_INVALID', { fieldErrors: validatedProfile.fieldErrors });
    if (typeof activationLifecycle?.validateProfile === 'function') {
      let approved = false;
      try {
        approved = await activationLifecycle.validateProfile({
          account: current.account,
          profile: validatedProfile.profile,
        });
      } catch {
        approved = false;
      }
      assert(approved, 'ONBOARDING_INVALID', {
        fieldErrors: { email: 'Use the verified email approved for this account.' },
      });
    }
    assert(password === confirmPassword, 'ONBOARDING_INVALID', {
      fieldErrors: { confirmPassword: 'Passwords must match.' },
    });
    const passwordPolicy = validateNewPassword(password);
    assert(passwordPolicy.valid, 'PASSWORD_POLICY_FAILED');
    const passwordCredential = await passwordKdf.hash(password);
    const activatedAt = nowIso(clock);
    const account = await repository.runTransaction(async (transaction) => {
      const fresh = await transaction.getAccountById(current.account.id);
      assert(
        fresh?.status === ACCOUNT_STATUS.STARTER && !fresh.temporaryCredential?.consumedAt,
        'ACTIVATION_REPLAYED',
      );
      const next = {
        ...fresh,
        status: ACCOUNT_STATUS.ACTIVE,
        profile: validatedProfile.profile,
        passwordCredential,
        temporaryCredential: { ...fresh.temporaryCredential, consumedAt: activatedAt },
        credentialVersion: fresh.credentialVersion + 1,
        onboardingCompletedAt: activatedAt,
        profileEmailVerifiedAt: activatedAt,
        passwordChangedAt: activatedAt,
        updatedAt: activatedAt,
      };
      await transaction.saveAccount(next);
      await transaction.deleteSessionsForAccount(next.id);
      return next;
    });
    await audit('STARTER_ACCOUNT_ACTIVATED', account.id, {
      roleId: account.roleId,
      committeeIds: account.committeeIds,
    });
    if (typeof activationLifecycle?.complete === 'function') {
      try {
        await activationLifecycle.complete({ account, activatedAt });
      } catch {
        await audit('ACCOUNT_APPLICATION_ACTIVATION_RECONCILIATION_FAILED', account.id);
        throw new AuthError('ACTIVATION_INVALID');
      }
    }
    const issued = await issueSession(account, SESSION_KIND.AUTHENTICATED, settings.sessionMs);
    return {
      state: 'AUTHENTICATED',
      sessionToken: issued.token,
      csrfToken: issued.csrfToken,
      user: sessionUserDto(account, issued.session),
    };
  }

  async function getSession({ sessionToken } = {}) {
    const current = await readSession(sessionToken);
    const csrfToken = tokenCrypto.createToken();
    const session = { ...current.session, csrfDigest: await tokenCrypto.digest(csrfToken) };
    await repository.saveSession(session);
    return { state: 'AUTHENTICATED', csrfToken, user: sessionUserDto(current.account, session) };
  }

  async function authenticate({ sessionToken } = {}) {
    const current = await readSession(sessionToken);
    return {
      account: current.account,
      session: current.session,
      authorization: accountAuthorization(current.account),
    };
  }

  async function authorizeSession({ sessionToken, csrfToken, mutation = true } = {}) {
    const current = await readSession(sessionToken);
    if (mutation) await requireCsrf(current.session, csrfToken);
    const authorization = accountAuthorization(current.account);
    assert(authorization.active && authorization.mappingStatus === 'MAPPED', 'CAPABILITY_REQUIRED');
    return { account: current.account, session: current.session, authorization };
  }

  async function authorize({ sessionToken, csrfToken, capability, resource = {}, mutation = true } = {}) {
    const current = await authorizeSession({ sessionToken, csrfToken, mutation });
    const { authorization } = current;
    assert(authorization.capabilities.includes(capability), 'CAPABILITY_REQUIRED');
    const resourceCommitteeIds = normalizeCommitteeIds(
      resource.committeeIds ?? (resource.committeeId ? [resource.committeeId] : []),
    );
    if (authorization.scopeMode === 'COMMITTEE') {
      assert(resourceCommitteeIds.length, 'ENTITY_SCOPE_REQUIRED');
      assert(
        resourceCommitteeIds.every((id) => authorization.committeeIds.includes(id)),
        'OUT_OF_SCOPE',
      );
    }
    return { account: current.account, session: current.session, authorization };
  }

  async function logout({ sessionToken, csrfToken } = {}) {
    const current = await readSession(sessionToken);
    await requireCsrf(current.session, csrfToken);
    await repository.deleteSession(current.session.tokenDigest);
    await audit('LOGOUT', current.account.id);
    return { state: 'SIGNED_OUT' };
  }

  async function issuePasswordReset({ sessionToken, csrfToken, targetAccountId } = {}) {
    const actor = await authorize({
      sessionToken,
      csrfToken,
      capability: CAPABILITIES.ACCESS_ADMIN,
      mutation: true,
    });
    assert(actor.account.id !== targetAccountId, 'SELF_ACCESS_CHANGE_BLOCKED');
    const target = await repository.getAccountById(targetAccountId);
    assert(target?.status === ACCOUNT_STATUS.ACTIVE && target.onboardingCompletedAt, 'ACCOUNT_UNAVAILABLE');
    const resetToken = tokenCrypto.createToken();
    const issuedAt = nowIso(clock);
    await repository.createResetToken({
      id: createId(),
      accountId: target.id,
      tokenDigest: await tokenCrypto.digest(resetToken),
      issuedAt,
      expiresAt: addMs(issuedAt, settings.resetMs),
      consumedAt: null,
      issuedBy: actor.account.id,
    });
    await audit('PASSWORD_RESET_ISSUED', target.id, { issuedBy: actor.account.id });
    return { deliveryToken: resetToken, expiresAt: addMs(issuedAt, settings.resetMs) };
  }

  async function completePasswordReset({ resetToken, password, confirmPassword } = {}) {
    assert(password === confirmPassword, 'ONBOARDING_INVALID', {
      fieldErrors: { confirmPassword: 'Passwords must match.' },
    });
    const passwordPolicy = validateNewPassword(password);
    assert(passwordPolicy.valid, 'PASSWORD_POLICY_FAILED');
    const tokenDigest = await tokenCrypto.digest(resetToken);
    const record = tokenDigest ? await repository.getResetToken(tokenDigest) : null;
    assert(
      record && !record.consumedAt && new Date(record.expiresAt).getTime() > clock.now(),
      'RESET_INVALID',
    );
    const passwordCredential = await passwordKdf.hash(password);
    const resetAt = nowIso(clock);
    const account = await repository.runTransaction(async (transaction) => {
      const freshToken = await transaction.getResetToken(tokenDigest);
      assert(freshToken && !freshToken.consumedAt, 'RESET_INVALID');
      const fresh = await transaction.getAccountById(record.accountId);
      assert(fresh?.status === ACCOUNT_STATUS.ACTIVE, 'ACCOUNT_UNAVAILABLE');
      const consumed = await transaction.consumeResetToken(tokenDigest, resetAt);
      assert(consumed, 'RESET_INVALID');
      const next = {
        ...fresh,
        passwordCredential,
        credentialVersion: fresh.credentialVersion + 1,
        passwordChangedAt: resetAt,
        updatedAt: resetAt,
      };
      await transaction.saveAccount(next);
      await transaction.deleteSessionsForAccount(next.id);
      return next;
    });
    await audit('PASSWORD_RESET_COMPLETED', account.id);
    return { state: 'PASSWORD_RESET' };
  }

  async function setAccountStatus({ sessionToken, csrfToken, targetAccountId, status } = {}) {
    const actor = await authorize({
      sessionToken,
      csrfToken,
      capability: CAPABILITIES.ACCESS_ADMIN,
      mutation: true,
    });
    assert(actor.account.id !== targetAccountId, 'SELF_ACCESS_CHANGE_BLOCKED');
    assert([ACCOUNT_STATUS.DISABLED, ACCOUNT_STATUS.REVOKED].includes(status), 'ACCOUNT_UNAVAILABLE');
    const updatedAt = nowIso(clock);
    const target = await repository.runTransaction(async (transaction) => {
      const fresh = await transaction.getAccountById(targetAccountId);
      assert(fresh, 'ACCOUNT_UNAVAILABLE');
      const next = { ...fresh, status, credentialVersion: fresh.credentialVersion + 1, updatedAt };
      await transaction.saveAccount(next);
      await transaction.deleteSessionsForAccount(next.id);
      return next;
    });
    await audit('ACCOUNT_STATUS_CHANGED', target.id, { status, changedBy: actor.account.id });
    return { accountId: target.id, status };
  }

  return Object.freeze({
    createStarterAccount,
    login,
    activateStarter,
    authenticate,
    authorizeSession,
    getSession,
    authorize,
    logout,
    issuePasswordReset,
    completePasswordReset,
    setAccountStatus,
  });
}
