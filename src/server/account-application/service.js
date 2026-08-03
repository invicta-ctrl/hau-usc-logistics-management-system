import {
  ACCOUNT_APPLICATION_CAPABILITY,
  ACCOUNT_APPLICATION_STATE,
  EMAIL_VERIFICATION_CHALLENGE_STATE,
  EMAIL_VERIFICATION_PURPOSE,
  accountApplicationNextStep,
  assertAccountApplicationTransition,
  isExpirableAccountApplicationState,
  isNonterminalAccountApplicationState,
  isRetainableTerminalAccountApplicationState,
  publicApplicationStatusDto,
} from './contracts.js';
import { isConfiguredEmailProvider } from './email-provider.js';

const SAFE_MESSAGES = Object.freeze({
  ACCOUNT_APPLICATION_INVALID: 'Review the account-application details and try again.',
  ACCOUNT_APPLICATION_AUTHORITY_REQUIRED: 'This account-application action is not authorized.',
  ACCOUNT_APPLICATION_NOT_FOUND: 'The account application is unavailable.',
  ACCOUNT_APPLICATION_STATUS_TOKEN_INVALID: 'The account application is unavailable.',
  ACCOUNT_APPLICATION_TRANSITION_INVALID: 'This account-application action is not available.',
  ACCOUNT_APPLICATION_REVISION_CONFLICT: 'This account application changed. Refresh and try again.',
  ACCOUNT_APPLICATION_IDEMPOTENCY_REQUIRED: 'A safe retry key is required.',
  ACCOUNT_APPLICATION_IDEMPOTENCY_CONFLICT: 'The retry key cannot be reused for this action.',
  ACCOUNT_APPLICATION_REASON_REQUIRED: 'A specific reason is required for this action.',
  ACCOUNT_APPLICATION_REVIEW_EVIDENCE_REQUIRED: 'Complete the required protected review evidence.',
  ACCOUNT_APPLICATION_SAME_REVIEWER: 'A different Director reviewer is required.',
  ACCOUNT_APPLICATION_OVERRIDE_INVALID: 'The owner override is incomplete.',
  ACCOUNT_APPLICATION_ACTIVATION_INVALID: 'The account activation handoff is invalid.',
  ACCOUNT_APPLICATION_WRITE_CONFLICT: 'The account application changed. Refresh and try again.',
  VERIFICATION_INVALID: 'The verification details are invalid or expired.',
});

const DEFAULTS = Object.freeze({
  verificationMs: 10 * 60 * 1000,
  verificationReceiptMs: 10 * 60 * 1000,
  resendMinMs: 60 * 1000,
  maxVerificationAttempts: 5,
  applicationMs: 30 * 24 * 60 * 60 * 1000,
  statusTokenMs: 30 * 24 * 60 * 60 * 1000,
});

export class AccountApplicationError extends Error {
  constructor(code, { status = 400 } = {}) {
    super(SAFE_MESSAGES[code] ?? 'The account application could not be completed.');
    this.name = 'AccountApplicationError';
    this.code = code;
    this.status = status;
  }
}

const fail = (code, options) => {
  throw new AccountApplicationError(code, options);
};

const nowIso = (clock) => new Date(clock.now()).toISOString();
const addMs = (iso, durationMs) => new Date(new Date(iso).getTime() + durationMs).toISOString();

function configuredDuration(value, fallback) {
  if (!Number.isSafeInteger(value ?? fallback) || (value ?? fallback) <= 0) {
    throw new Error('Account-application duration settings must be positive safe integers.');
  }
  return value ?? fallback;
}

function requiredIdempotencyKey(value) {
  const key = String(value ?? '').trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{15,127}$/u.test(key)) {
    fail('ACCOUNT_APPLICATION_IDEMPOTENCY_REQUIRED');
  }
  return key;
}

function expectedRevision(value) {
  if (!Number.isSafeInteger(value) || value < 1)
    fail('ACCOUNT_APPLICATION_REVISION_CONFLICT', { status: 409 });
  return value;
}

function requiredReason(value) {
  const reason = String(value ?? '')
    .trim()
    .replaceAll(/\s+/gu, ' ');
  if (
    reason.length < 8 ||
    reason.length > 500 ||
    /@|\b(?:password|credential|token|secret|verification\s+code)\b/iu.test(reason)
  ) {
    fail('ACCOUNT_APPLICATION_REASON_REQUIRED');
  }
  return reason;
}

function requiredActor(actor) {
  const id = String(actor?.id ?? '').trim();
  if (!id) fail('ACCOUNT_APPLICATION_AUTHORITY_REQUIRED', { status: 403 });
  return { ...actor, id };
}

function actorHasCapability(actor, capability) {
  return Array.isArray(actor?.capabilities) && actor.capabilities.includes(capability);
}

function requireCapability(actor, capability) {
  const resolved = requiredActor(actor);
  if (!actorHasCapability(resolved, capability)) {
    fail('ACCOUNT_APPLICATION_AUTHORITY_REQUIRED', { status: 403 });
  }
  return resolved;
}

function normalizedUsername(value) {
  const username = String(value ?? '')
    .trim()
    .toLocaleLowerCase('en-US');
  if (!/^[a-z0-9][a-z0-9._-]{2,63}$/u.test(username)) fail('ACCOUNT_APPLICATION_INVALID');
  return username;
}

function normalizedOptionalId(value, { max = 128 } = {}) {
  const normalized = String(value ?? '').trim();
  if (normalized.length > max) fail('ACCOUNT_APPLICATION_INVALID');
  return normalized;
}

function normalizedIdList(values, { maxItems = 32, maxLength = 128 } = {}) {
  if (!Array.isArray(values) || values.length > maxItems) fail('ACCOUNT_APPLICATION_INVALID');
  const unique = [
    ...new Set(values.map((value) => normalizedOptionalId(value, { max: maxLength }).toUpperCase())),
  ].filter(Boolean);
  if (unique.length !== values.length) fail('ACCOUNT_APPLICATION_INVALID');
  return unique.sort();
}

function normalizedYearLevel(value) {
  if (!Number.isSafeInteger(value) || value < 1 || value > 10) fail('ACCOUNT_APPLICATION_INVALID');
  return value;
}

function requestedAccessFromCommand(command) {
  const requestedAccountType = normalizedOptionalId(command.requestedAccountType, { max: 64 }).toUpperCase();
  const requestedRoleId = normalizedOptionalId(command.requestedRoleId, { max: 128 }).toUpperCase();
  if (!requestedAccountType || !requestedRoleId) fail('ACCOUNT_APPLICATION_INVALID');
  return Object.freeze({
    requestedAccountType,
    requestedRoleId,
    requestedCommitteeIds: normalizedIdList(command.requestedCommitteeIds ?? []),
    requestedWorkspaceIds: normalizedIdList(command.requestedWorkspaceIds ?? []),
    lendingSelfService: command.lendingSelfService === true,
    internalLendingOperations: command.internalLendingOperations === true,
    requestCenterAccess: command.requestCenterAccess === true,
  });
}

function applicationProfileCommand(command) {
  const legalName = String(command.legalName ?? '')
    .trim()
    .replaceAll(/\s+/gu, ' ');
  const contactNumber = String(command.contactNumber ?? '').trim();
  if (!legalName || legalName.length > 200 || !contactNumber || contactNumber.length > 64) {
    fail('ACCOUNT_APPLICATION_INVALID');
  }
  return Object.freeze({ legalName, contactNumber });
}

function safeReviewEvidence(value) {
  const evidenceFingerprint = String(value?.evidenceFingerprint ?? '').trim();
  const protectedReviewEnvelope = String(value?.protectedReviewEnvelope ?? '').trim();
  if (!evidenceFingerprint || !protectedReviewEnvelope) fail('ACCOUNT_APPLICATION_REVIEW_EVIDENCE_REQUIRED');
  return Object.freeze({ evidenceFingerprint, protectedReviewEnvelope });
}

function safeOverrideCapture(value) {
  const effectiveAccessFingerprint = String(value?.effectiveAccessFingerprint ?? '').trim();
  const sessionImpactFingerprint = String(value?.sessionImpactFingerprint ?? '').trim();
  const followUpReviewReference = String(value?.followUpReviewReference ?? '').trim();
  if (!effectiveAccessFingerprint || !sessionImpactFingerprint || !followUpReviewReference) {
    fail('ACCOUNT_APPLICATION_OVERRIDE_INVALID');
  }
  return Object.freeze({ effectiveAccessFingerprint, sessionImpactFingerprint, followUpReviewReference });
}

function applicationCodeFrom(id) {
  return `AAP-${String(id)
    .replaceAll(/[^A-Za-z0-9]/gu, '')
    .toUpperCase()}`;
}

function safeHistory({
  id,
  applicationId,
  fromState,
  toState,
  actorAccountId = '',
  applicantAuthorityFingerprint = '',
  reason = '',
  before = {},
  after = {},
  expectedRevision: historyExpectedRevision,
  resultingRevision,
  idempotencyKey,
  correlationId,
  createdAt,
}) {
  return Object.freeze({
    id,
    applicationId,
    fromState,
    toState,
    actorAccountId,
    applicantAuthorityFingerprint,
    reason,
    before,
    after,
    expectedRevision: historyExpectedRevision,
    resultingRevision,
    idempotencyKey,
    correlationId,
    createdAt,
  });
}

function safeAudit({
  id,
  applicationId,
  actorAccountId = '',
  action,
  before = {},
  after = {},
  correlationId,
  reason,
  createdAt,
}) {
  return Object.freeze({
    id,
    applicationId,
    actorAccountId,
    action,
    before,
    after,
    correlationId,
    reason,
    createdAt,
  });
}

function safeAccountAudit({
  id,
  accountId,
  actorAccountId,
  action,
  before = {},
  after = {},
  correlationId,
  reason,
  createdAt,
}) {
  return Object.freeze({
    id,
    accountId,
    actorAccountId,
    action,
    before,
    after,
    correlationId,
    reason,
    createdAt,
  });
}

function assertTemporaryCredential(credential) {
  const allowedKeys = new Set([
    'algorithm',
    'iterations',
    'salt',
    'hash',
    'peppered',
    'expiresAt',
    'consumedAt',
  ]);
  if (!credential || typeof credential !== 'object') fail('ACCOUNT_APPLICATION_ACTIVATION_INVALID');
  const keys = Object.keys(credential);
  if (
    keys.some((key) => !allowedKeys.has(key)) ||
    !credential.algorithm ||
    !Number.isSafeInteger(credential.iterations) ||
    !credential.salt ||
    !credential.hash ||
    credential.consumedAt !== null
  ) {
    fail('ACCOUNT_APPLICATION_ACTIVATION_INVALID');
  }
}

function assertStarterAccount(account) {
  if (!account || typeof account !== 'object') fail('ACCOUNT_APPLICATION_ACTIVATION_INVALID');
  const id = String(account.id ?? '').trim();
  const accessIdNormalized = String(account.accessIdNormalized ?? '').trim();
  const roleId = String(account.roleId ?? '')
    .trim()
    .toUpperCase();
  const collisionKey = String(account.collisionKey ?? '').trim();
  if (!id || !accessIdNormalized || !collisionKey || !roleId || roleId === 'SYSTEM_OWNER') {
    fail('ACCOUNT_APPLICATION_ACTIVATION_INVALID');
  }
  assertTemporaryCredential(account.temporaryCredential);
  if (!Array.isArray(account.committeeIds) || !account.accessProfile || account.temporaryPassword) {
    fail('ACCOUNT_APPLICATION_ACTIVATION_INVALID');
  }
  return Object.freeze({
    ...account,
    id,
    accessIdNormalized,
    roleId,
    collisionKey,
    committeeIds: [...account.committeeIds],
  });
}

function publicSubmissionDto(application, statusToken, { replayed = false } = {}) {
  const result = {
    ok: true,
    applicationCode: application.applicationCode,
    state: application.state,
    revision: application.revision,
    nextStep: accountApplicationNextStep(application.state),
  };
  if (statusToken) result.statusToken = statusToken;
  if (replayed) result.replayed = true;
  return result;
}

function reviewResult(application, { replayed = false, activationHandoff } = {}) {
  const result = {
    ok: true,
    applicationCode: application.applicationCode,
    state: application.state,
    revision: application.revision,
    nextStep: accountApplicationNextStep(application.state),
  };
  if (application.accountCode) result.accountCode = application.accountCode;
  if (application.state === ACCOUNT_APPLICATION_STATE.APPROVED_ACTIVATION_REQUIRED) {
    result.activationReady = true;
  }
  if (activationHandoff) result.activationHandoff = activationHandoff;
  if (replayed) result.replayed = true;
  return result;
}

export function createAccountApplicationService({
  repository,
  emailProvider,
  identityProtection,
  passwordKdf,
  tokenCrypto,
  rateLimiter,
  activationHandoff,
  clock = { now: () => Date.now() },
  createId = () => globalThis.crypto.randomUUID(),
  createApplicationCode = applicationCodeFrom,
  config = {},
} = {}) {
  if (!repository || !identityProtection || !passwordKdf || !tokenCrypto || !rateLimiter) {
    throw new Error(
      'Account-application repository, identity protection, crypto, and rate limiter adapters are required.',
    );
  }
  if (
    typeof identityProtection.prepareEmail !== 'function' ||
    typeof identityProtection.protectApplicationProfile !== 'function' ||
    typeof identityProtection.fingerprintRequestedAccess !== 'function' ||
    typeof passwordKdf.hash !== 'function' ||
    typeof tokenCrypto.createToken !== 'function' ||
    typeof tokenCrypto.digest !== 'function' ||
    typeof rateLimiter.consume !== 'function'
  ) {
    throw new Error('Account-application adapter contract is incomplete.');
  }

  const settings = Object.freeze({
    verificationMs: configuredDuration(config.verificationMs, DEFAULTS.verificationMs),
    verificationReceiptMs: configuredDuration(config.verificationReceiptMs, DEFAULTS.verificationReceiptMs),
    resendMinMs: configuredDuration(config.resendMinMs, DEFAULTS.resendMinMs),
    applicationMs: configuredDuration(config.applicationMs, DEFAULTS.applicationMs),
    statusTokenMs: configuredDuration(config.statusTokenMs, DEFAULTS.statusTokenMs),
    maxVerificationAttempts: config.maxVerificationAttempts ?? DEFAULTS.maxVerificationAttempts,
  });
  if (!Number.isSafeInteger(settings.maxVerificationAttempts) || settings.maxVerificationAttempts < 1) {
    throw new Error('The account-application verification attempt limit is invalid.');
  }

  const correlation = () => `AAP-${String(createId())}`;

  async function preparedEmail(email) {
    try {
      const prepared = await identityProtection.prepareEmail(email);
      if (
        !prepared?.approved ||
        !String(prepared.emailFingerprint ?? '').trim() ||
        !String(prepared.protectedEmailEnvelope ?? '').trim() ||
        !String(prepared.identityClassId ?? '').trim() ||
        !prepared.providerDelivery
      ) {
        return null;
      }
      return Object.freeze({
        emailFingerprint: String(prepared.emailFingerprint).trim(),
        protectedEmailEnvelope: String(prepared.protectedEmailEnvelope).trim(),
        identityClassId: String(prepared.identityClassId).trim(),
        providerDelivery: prepared.providerDelivery,
      });
    } catch {
      return null;
    }
  }

  async function replayFor(applicationId, idempotencyKey, expectedToState) {
    const replay = await repository.getApplicationReplayByIdempotencyKey?.(idempotencyKey);
    if (!replay) return null;
    if (replay.application?.id !== applicationId || replay.history?.toState !== expectedToState) {
      fail('ACCOUNT_APPLICATION_IDEMPOTENCY_CONFLICT', { status: 409 });
    }
    return replay.application;
  }

  async function transition({
    application,
    toState,
    actorAccountId = '',
    applicantAuthorityFingerprint = '',
    idempotencyKey,
    reason = '',
    action,
    updates = {},
    after = {},
    auditAfter = after,
    requireDistinctFromAdministrator = false,
    revokeApprovedStarter = false,
  }) {
    const replayed = await replayFor(application.id, idempotencyKey, toState);
    if (replayed) return { application: replayed, replayed: true };
    assertAccountApplicationTransition(application.state, toState);
    const occurredAt = nowIso(clock);
    const correlationId = correlation();
    const history = safeHistory({
      id: createId(),
      applicationId: application.id,
      fromState: application.state,
      toState,
      actorAccountId,
      applicantAuthorityFingerprint,
      reason,
      before: { state: application.state, revision: application.revision },
      after,
      expectedRevision: application.revision,
      resultingRevision: application.revision + 1,
      idempotencyKey,
      correlationId,
      createdAt: occurredAt,
    });
    const audit = safeAudit({
      id: createId(),
      applicationId: application.id,
      actorAccountId,
      action,
      before: history.before,
      after: auditAfter,
      correlationId,
      reason,
      createdAt: occurredAt,
    });
    try {
      return {
        application: await repository.transitionApplication({
          applicationId: application.id,
          fromState: application.state,
          toState,
          expectedRevision: application.revision,
          actorAccountId,
          idempotencyKey,
          occurredAt,
          updates,
          history,
          audit,
          requireDistinctFromAdministrator,
          revokeApprovedStarter,
        }),
        replayed: false,
      };
    } catch {
      const racedReplay = await replayFor(application.id, idempotencyKey, toState);
      if (racedReplay) return { application: racedReplay, replayed: true };
      fail('ACCOUNT_APPLICATION_WRITE_CONFLICT', { status: 409 });
    }
  }

  async function reviewTransition({ actor, applicationId, command, toState, action, reviewerKind }) {
    const capability =
      reviewerKind === 'ADMINISTRATOR'
        ? ACCOUNT_APPLICATION_CAPABILITY.ADMIN_REVIEW
        : ACCOUNT_APPLICATION_CAPABILITY.DIRECTOR_DECIDE;
    const reviewer = requireCapability(actor, capability);
    const revision = expectedRevision(command.expectedRevision);
    const idempotencyKey = requiredIdempotencyKey(command.clientRequestId);
    const reason = requiredReason(command.reason);
    const evidence = safeReviewEvidence(command.reviewEvidence);
    const application = await repository.getApplicationById(applicationId);
    if (!application) fail('ACCOUNT_APPLICATION_NOT_FOUND', { status: 404 });
    const replayed = await replayFor(application.id, idempotencyKey, toState);
    if (replayed) return reviewResult(replayed, { replayed: true });
    if (application.revision !== revision) fail('ACCOUNT_APPLICATION_REVISION_CONFLICT', { status: 409 });
    if (reviewerKind === 'DIRECTOR' && application.administratorReviewerId === reviewer.id) {
      fail('ACCOUNT_APPLICATION_SAME_REVIEWER', { status: 403 });
    }
    const reviewerUpdates =
      reviewerKind === 'ADMINISTRATOR'
        ? { administratorReviewerId: reviewer.id, administratorReviewedAt: nowIso(clock) }
        : { directorReviewerId: reviewer.id, directorReviewedAt: nowIso(clock) };
    const result = await transition({
      application,
      toState,
      actorAccountId: reviewer.id,
      idempotencyKey,
      reason,
      action,
      updates: reviewerUpdates,
      after: {
        state: toState,
        reviewerKind,
        reviewEvidenceFingerprint: evidence.evidenceFingerprint,
        protectedReviewEnvelope: evidence.protectedReviewEnvelope,
      },
      auditAfter: {
        state: toState,
        reviewerKind,
        reviewEvidenceFingerprint: evidence.evidenceFingerprint,
      },
      requireDistinctFromAdministrator: reviewerKind === 'DIRECTOR',
    });
    return reviewResult(result.application, { replayed: result.replayed });
  }

  async function approve({ actor, applicationId, command, ownerOverride = null }) {
    const capability = ownerOverride
      ? ACCOUNT_APPLICATION_CAPABILITY.OWNER_OVERRIDE
      : ACCOUNT_APPLICATION_CAPABILITY.DIRECTOR_DECIDE;
    const approver = requireCapability(actor, capability);
    const revision = expectedRevision(command.expectedRevision);
    const idempotencyKey = requiredIdempotencyKey(command.clientRequestId);
    const reason = requiredReason(command.reason);
    const evidence = safeReviewEvidence(command.reviewEvidence);
    const application = await repository.getApplicationById(applicationId);
    if (!application) fail('ACCOUNT_APPLICATION_NOT_FOUND', { status: 404 });
    const replayed = await replayFor(
      application.id,
      idempotencyKey,
      ACCOUNT_APPLICATION_STATE.APPROVED_ACTIVATION_REQUIRED,
    );
    if (replayed) return reviewResult(replayed, { replayed: true });
    if (application.revision !== revision) fail('ACCOUNT_APPLICATION_REVISION_CONFLICT', { status: 409 });
    if (!ownerOverride && application.administratorReviewerId === approver.id) {
      fail('ACCOUNT_APPLICATION_SAME_REVIEWER', { status: 403 });
    }
    assertAccountApplicationTransition(
      application.state,
      ACCOUNT_APPLICATION_STATE.APPROVED_ACTIVATION_REQUIRED,
    );
    if (!activationHandoff || typeof activationHandoff.prepare !== 'function') {
      fail('ACCOUNT_APPLICATION_ACTIVATION_INVALID', { status: 503 });
    }
    const approvedAt = nowIso(clock);
    const correlationId = correlation();
    let handoff;
    try {
      handoff = await activationHandoff.prepare({
        application,
        actor: approver,
        approvedAt,
        correlationId,
      });
    } catch {
      fail('ACCOUNT_APPLICATION_ACTIVATION_INVALID', { status: 503 });
    }
    const starterAccount = assertStarterAccount(handoff?.starterAccount);
    const overrideAfter = ownerOverride
      ? {
          ownerOverride: true,
          effectiveAccessFingerprint: ownerOverride.effectiveAccessFingerprint,
          sessionImpactFingerprint: ownerOverride.sessionImpactFingerprint,
          followUpReviewReference: ownerOverride.followUpReviewReference,
        }
      : {};
    const history = safeHistory({
      id: createId(),
      applicationId: application.id,
      fromState: application.state,
      toState: ACCOUNT_APPLICATION_STATE.APPROVED_ACTIVATION_REQUIRED,
      actorAccountId: approver.id,
      reason,
      before: { state: application.state, revision: application.revision },
      after: {
        state: ACCOUNT_APPLICATION_STATE.APPROVED_ACTIVATION_REQUIRED,
        accountId: starterAccount.id,
        accountCode: starterAccount.accessIdNormalized,
        reviewEvidenceFingerprint: evidence.evidenceFingerprint,
        protectedReviewEnvelope: evidence.protectedReviewEnvelope,
        ...overrideAfter,
      },
      expectedRevision: application.revision,
      resultingRevision: application.revision + 1,
      idempotencyKey,
      correlationId,
      createdAt: approvedAt,
    });
    const accountAudit = safeAccountAudit({
      id: createId(),
      accountId: starterAccount.id,
      actorAccountId: approver.id,
      action: 'STARTER_ACCOUNT_CREATED',
      after: {
        accountCode: starterAccount.accessIdNormalized,
        roleId: starterAccount.roleId,
        status: 'STARTER',
      },
      correlationId,
      reason,
      createdAt: approvedAt,
    });
    const applicationAudit = safeAudit({
      id: createId(),
      applicationId: application.id,
      actorAccountId: approver.id,
      action: ownerOverride ? 'ACCOUNT_APPLICATION_OWNER_OVERRIDE' : 'ACCOUNT_APPLICATION_DIRECTOR_APPROVED',
      before: history.before,
      after: {
        state: ACCOUNT_APPLICATION_STATE.APPROVED_ACTIVATION_REQUIRED,
        accountId: starterAccount.id,
        accountCode: starterAccount.accessIdNormalized,
        reviewEvidenceFingerprint: evidence.evidenceFingerprint,
        ...overrideAfter,
      },
      correlationId,
      reason,
      createdAt: approvedAt,
    });
    try {
      const approved = await repository.approveApplication({
        applicationId: application.id,
        expectedRevision: application.revision,
        actorAccountId: approver.id,
        idempotencyKey,
        approvedAt,
        starterAccount,
        history,
        accountAudit,
        applicationAudit,
        allowSameReviewer: Boolean(ownerOverride),
      });
      return reviewResult(approved, { activationHandoff: handoff.privateHandoff });
    } catch {
      const racedReplay = await replayFor(
        application.id,
        idempotencyKey,
        ACCOUNT_APPLICATION_STATE.APPROVED_ACTIVATION_REQUIRED,
      );
      if (racedReplay) return reviewResult(racedReplay, { replayed: true });
      fail('ACCOUNT_APPLICATION_WRITE_CONFLICT', { status: 409 });
    }
  }

  return Object.freeze({
    async startEmailVerification({ email } = {}) {
      const issuedAt = nowIso(clock);
      const generic = Object.freeze({
        ok: true,
        accepted: true,
        nextAttemptAt: addMs(issuedAt, settings.resendMinMs),
      });
      const identity = await preparedEmail(email);
      if (!identity || !isConfiguredEmailProvider(emailProvider)) return generic;
      try {
        const limiter = await rateLimiter.consume(
          `account-application-verification:${identity.emailFingerprint}`,
          clock.now(),
        );
        if (!limiter?.allowed) return generic;
        const verificationCode = tokenCrypto.createToken();
        const challenge = {
          id: createId(),
          emailFingerprint: identity.emailFingerprint,
          protectedEmailEnvelope: identity.protectedEmailEnvelope,
          identityClassId: identity.identityClassId,
          secretDigest: await tokenCrypto.digest(verificationCode),
          purpose: EMAIL_VERIFICATION_PURPOSE.ACCOUNT_APPLICATION,
          expiresAt: addMs(issuedAt, settings.verificationMs),
          resendCount: 1,
          createdAt: issuedAt,
        };
        await repository.createVerificationChallenge(challenge);
        await emailProvider.sendVerification({
          delivery: identity.providerDelivery,
          verificationCode,
          expiresAt: challenge.expiresAt,
          correlationId: correlation(),
        });
        await repository.markVerificationChallengeSent({
          challengeId: challenge.id,
          emailFingerprint: challenge.emailFingerprint,
          sentAt: issuedAt,
        });
      } catch {
        // Public verification start remains generic. No delivery or identity detail is logged or audited here.
      }
      return generic;
    },

    async confirmEmailVerification({ email, code } = {}) {
      const identity = await preparedEmail(email);
      if (!identity || !String(code ?? '').trim()) fail('VERIFICATION_INVALID');
      const confirmedAt = nowIso(clock);
      const verificationReceipt = tokenCrypto.createToken();
      let confirmed;
      try {
        confirmed = await repository.confirmVerificationChallenge({
          emailFingerprint: identity.emailFingerprint,
          identityClassId: identity.identityClassId,
          purpose: EMAIL_VERIFICATION_PURPOSE.ACCOUNT_APPLICATION,
          secretDigest: await tokenCrypto.digest(code),
          verificationReceiptDigest: await tokenCrypto.digest(verificationReceipt),
          confirmedAt,
          receiptExpiresAt: addMs(confirmedAt, settings.verificationReceiptMs),
          maxAttempts: settings.maxVerificationAttempts,
        });
      } catch {
        fail('VERIFICATION_INVALID');
      }
      if (!confirmed?.verified) fail('VERIFICATION_INVALID');
      return {
        ok: true,
        verificationReceipt,
        expiresAt: confirmed.challenge?.expiresAt ?? addMs(confirmedAt, settings.verificationReceiptMs),
      };
    },

    async submitApplication(command = {}) {
      const clientRequestId = requiredIdempotencyKey(command.clientRequestId);
      const verificationReceipt = String(command.verificationReceipt ?? '').trim();
      if (!verificationReceipt) fail('VERIFICATION_INVALID');
      const verificationReceiptDigest = await tokenCrypto.digest(verificationReceipt);
      const existing = await repository.getApplicationByClientRequestId?.(clientRequestId);
      if (existing) {
        const receipt = await repository.getVerificationChallengeByReceiptDigest?.(verificationReceiptDigest);
        if (
          receipt?.state !== EMAIL_VERIFICATION_CHALLENGE_STATE.CONSUMED ||
          receipt.emailFingerprint !== existing.emailFingerprint
        ) {
          fail('ACCOUNT_APPLICATION_IDEMPOTENCY_CONFLICT', { status: 409 });
        }
        return publicSubmissionDto(existing, '', { replayed: true });
      }
      const verifiedChallenge =
        await repository.getVerificationChallengeByReceiptDigest?.(verificationReceiptDigest);
      if (verifiedChallenge?.state !== EMAIL_VERIFICATION_CHALLENGE_STATE.VERIFIED) {
        fail('VERIFICATION_INVALID');
      }
      if (String(command.password ?? '') !== String(command.confirmPassword ?? '')) {
        fail('ACCOUNT_APPLICATION_INVALID');
      }
      const profile = applicationProfileCommand(command);
      const requestedAccess = requestedAccessFromCommand(command);
      let protectedProfile;
      let requestedAccessFingerprint;
      let pendingPasswordCredential;
      try {
        protectedProfile = await identityProtection.protectApplicationProfile(profile);
        requestedAccessFingerprint = await identityProtection.fingerprintRequestedAccess(requestedAccess);
        pendingPasswordCredential = await passwordKdf.hash(command.password);
      } catch {
        fail('ACCOUNT_APPLICATION_INVALID');
      }
      if (
        !String(protectedProfile?.protectedProfileEnvelope ?? '').trim() ||
        !String(protectedProfile?.profileFingerprint ?? '').trim() ||
        !String(requestedAccessFingerprint ?? '').trim()
      ) {
        fail('ACCOUNT_APPLICATION_INVALID');
      }
      const createdAt = nowIso(clock);
      const applicationId = createId();
      const statusToken = tokenCrypto.createToken();
      const correlationId = correlation();
      const application = {
        id: applicationId,
        applicationCode: createApplicationCode(applicationId),
        emailFingerprint: verifiedChallenge.emailFingerprint,
        protectedEmailEnvelope: verifiedChallenge.protectedEmailEnvelope,
        protectedProfileEnvelope: String(protectedProfile.protectedProfileEnvelope),
        departmentId: normalizedOptionalId(command.departmentId),
        courseId: normalizedOptionalId(command.courseId),
        yearLevel: normalizedYearLevel(command.yearLevel),
        requestedUsernameNormalized: normalizedUsername(command.requestedUsername),
        pendingPasswordCredential,
        requestedAccess,
        state: ACCOUNT_APPLICATION_STATE.PENDING_ADMIN_REVIEW,
        revision: 2,
        statusTokenDigest: await tokenCrypto.digest(statusToken),
        statusTokenExpiresAt: addMs(createdAt, settings.statusTokenMs),
        clientRequestId,
        expiresAt: addMs(createdAt, settings.applicationMs),
        createdAt,
      };
      const draftHistory = safeHistory({
        id: createId(),
        applicationId,
        fromState: ACCOUNT_APPLICATION_STATE.EMAIL_UNVERIFIED,
        toState: ACCOUNT_APPLICATION_STATE.DRAFT,
        applicantAuthorityFingerprint: verificationReceiptDigest,
        before: {},
        after: { profileFingerprint: protectedProfile.profileFingerprint },
        expectedRevision: 0,
        resultingRevision: 1,
        idempotencyKey: `initial:${applicationId}`,
        correlationId,
        createdAt,
      });
      const submissionHistory = safeHistory({
        id: createId(),
        applicationId,
        fromState: ACCOUNT_APPLICATION_STATE.DRAFT,
        toState: ACCOUNT_APPLICATION_STATE.PENDING_ADMIN_REVIEW,
        applicantAuthorityFingerprint: verificationReceiptDigest,
        before: { state: ACCOUNT_APPLICATION_STATE.DRAFT, revision: 1 },
        after: { state: ACCOUNT_APPLICATION_STATE.PENDING_ADMIN_REVIEW, requestedAccessFingerprint },
        expectedRevision: 1,
        resultingRevision: 2,
        idempotencyKey: clientRequestId,
        correlationId,
        createdAt,
      });
      const audit = safeAudit({
        id: createId(),
        applicationId,
        action: 'ACCOUNT_APPLICATION_SUBMITTED',
        before: draftHistory.before,
        after: submissionHistory.after,
        correlationId,
        reason: '',
        createdAt,
      });
      let created;
      try {
        created = await repository.createSubmittedApplication({
          application,
          verificationReceiptDigest,
          history: { draft: draftHistory, submission: submissionHistory },
          audit,
        });
      } catch {
        const raced = await repository.getApplicationByClientRequestId?.(clientRequestId);
        const receipt = await repository.getVerificationChallengeByReceiptDigest?.(verificationReceiptDigest);
        if (raced && receipt?.emailFingerprint === raced.emailFingerprint) {
          return publicSubmissionDto(raced, '', { replayed: true });
        }
        fail('ACCOUNT_APPLICATION_WRITE_CONFLICT', { status: 409 });
      }
      return publicSubmissionDto(created, statusToken);
    },

    async getStatus({ statusToken } = {}) {
      const digest = await tokenCrypto.digest(statusToken);
      const application = await repository.getApplicationByStatusTokenDigest?.(digest, nowIso(clock));
      if (!application) fail('ACCOUNT_APPLICATION_STATUS_TOKEN_INVALID', { status: 404 });
      return publicApplicationStatusDto(application);
    },

    async withdraw({ statusToken, expectedRevision: commandRevision, reason, clientRequestId } = {}) {
      const digest = await tokenCrypto.digest(statusToken);
      const application = await repository.getApplicationByStatusTokenDigest?.(digest, nowIso(clock));
      if (!application) fail('ACCOUNT_APPLICATION_STATUS_TOKEN_INVALID', { status: 404 });
      const revision = expectedRevision(commandRevision);
      const idempotencyKey = requiredIdempotencyKey(clientRequestId);
      const replayed = await replayFor(application.id, idempotencyKey, ACCOUNT_APPLICATION_STATE.WITHDRAWN);
      if (replayed) return publicApplicationStatusDto(replayed);
      if (application.revision !== revision) fail('ACCOUNT_APPLICATION_REVISION_CONFLICT', { status: 409 });
      if (!isNonterminalAccountApplicationState(application.state)) {
        fail('ACCOUNT_APPLICATION_TRANSITION_INVALID', { status: 409 });
      }
      const result = await transition({
        application,
        toState: ACCOUNT_APPLICATION_STATE.WITHDRAWN,
        applicantAuthorityFingerprint: application.statusTokenDigest,
        idempotencyKey,
        reason: requiredReason(reason),
        action: 'ACCOUNT_APPLICATION_WITHDRAWN',
        after: { state: ACCOUNT_APPLICATION_STATE.WITHDRAWN },
        revokeApprovedStarter: application.state === ACCOUNT_APPLICATION_STATE.APPROVED_ACTIVATION_REQUIRED,
      });
      return publicApplicationStatusDto(result.application);
    },

    async adminRequestChanges({ actor, applicationId, ...command } = {}) {
      return reviewTransition({
        actor,
        applicationId,
        command,
        toState: ACCOUNT_APPLICATION_STATE.CHANGES_REQUESTED,
        action: 'ACCOUNT_APPLICATION_ADMIN_CHANGES_REQUESTED',
        reviewerKind: 'ADMINISTRATOR',
      });
    },

    async adminReject({ actor, applicationId, ...command } = {}) {
      return reviewTransition({
        actor,
        applicationId,
        command,
        toState: ACCOUNT_APPLICATION_STATE.REJECTED,
        action: 'ACCOUNT_APPLICATION_ADMIN_REJECTED',
        reviewerKind: 'ADMINISTRATOR',
      });
    },

    async adminForward({ actor, applicationId, ...command } = {}) {
      return reviewTransition({
        actor,
        applicationId,
        command,
        toState: ACCOUNT_APPLICATION_STATE.PENDING_DIRECTOR_APPROVAL,
        action: 'ACCOUNT_APPLICATION_ADMIN_FORWARDED',
        reviewerKind: 'ADMINISTRATOR',
      });
    },

    async directorRequestChanges({ actor, applicationId, ...command } = {}) {
      return reviewTransition({
        actor,
        applicationId,
        command,
        toState: ACCOUNT_APPLICATION_STATE.CHANGES_REQUESTED,
        action: 'ACCOUNT_APPLICATION_DIRECTOR_CHANGES_REQUESTED',
        reviewerKind: 'DIRECTOR',
      });
    },

    async directorReject({ actor, applicationId, ...command } = {}) {
      return reviewTransition({
        actor,
        applicationId,
        command,
        toState: ACCOUNT_APPLICATION_STATE.REJECTED,
        action: 'ACCOUNT_APPLICATION_DIRECTOR_REJECTED',
        reviewerKind: 'DIRECTOR',
      });
    },

    async directorApprove({ actor, applicationId, ...command } = {}) {
      return approve({ actor, applicationId, command });
    },

    async ownerOverride({ actor, applicationId, override, ...command } = {}) {
      const owner = requireCapability(actor, ACCOUNT_APPLICATION_CAPABILITY.OWNER_OVERRIDE);
      const application = await repository.getApplicationById(applicationId);
      if (!application) fail('ACCOUNT_APPLICATION_NOT_FOUND', { status: 404 });
      const capture = safeOverrideCapture(override);
      if (String(override?.currentState ?? '') !== application.state) {
        fail('ACCOUNT_APPLICATION_OVERRIDE_INVALID', { status: 409 });
      }
      const action = String(override?.action ?? '').toUpperCase();
      if (action === 'APPROVE') {
        return approve({ actor: owner, applicationId, command, ownerOverride: capture });
      }
      const targetByAction = Object.freeze({
        REQUEST_CHANGES: ACCOUNT_APPLICATION_STATE.CHANGES_REQUESTED,
        REJECT: ACCOUNT_APPLICATION_STATE.REJECTED,
        FORWARD: ACCOUNT_APPLICATION_STATE.PENDING_DIRECTOR_APPROVAL,
      });
      const toState = targetByAction[action];
      if (!toState) fail('ACCOUNT_APPLICATION_OVERRIDE_INVALID');
      const revision = expectedRevision(command.expectedRevision);
      const idempotencyKey = requiredIdempotencyKey(command.clientRequestId);
      const replayed = await replayFor(application.id, idempotencyKey, toState);
      if (replayed) return reviewResult(replayed, { replayed: true });
      if (application.revision !== revision) fail('ACCOUNT_APPLICATION_REVISION_CONFLICT', { status: 409 });
      const result = await transition({
        application,
        toState,
        actorAccountId: owner.id,
        idempotencyKey,
        reason: requiredReason(command.reason),
        action: 'ACCOUNT_APPLICATION_OWNER_OVERRIDE',
        updates:
          toState === ACCOUNT_APPLICATION_STATE.PENDING_DIRECTOR_APPROVAL
            ? { administratorReviewerId: owner.id, administratorReviewedAt: nowIso(clock) }
            : {},
        after: { state: toState, ownerOverride: true, ...capture },
      });
      return reviewResult(result.application, { replayed: result.replayed });
    },

    async activateApprovedApplication({
      actor,
      applicationId,
      expectedRevision: commandRevision,
      clientRequestId,
    } = {}) {
      const activationActor = requiredActor(actor);
      if (activationActor.activationCompleted !== true)
        fail('ACCOUNT_APPLICATION_ACTIVATION_INVALID', { status: 403 });
      const idempotencyKey = requiredIdempotencyKey(clientRequestId);
      const application = await repository.getApplicationById(applicationId);
      if (!application || application.approvedAccountId !== activationActor.id) {
        fail('ACCOUNT_APPLICATION_ACTIVATION_INVALID', { status: 403 });
      }
      const replayed = await replayFor(application.id, idempotencyKey, ACCOUNT_APPLICATION_STATE.ACTIVE);
      if (replayed) return reviewResult(replayed, { replayed: true });
      const revision = expectedRevision(commandRevision);
      if (application.revision !== revision) fail('ACCOUNT_APPLICATION_REVISION_CONFLICT', { status: 409 });
      const result = await transition({
        application,
        toState: ACCOUNT_APPLICATION_STATE.ACTIVE,
        actorAccountId: activationActor.id,
        idempotencyKey,
        action: 'ACCOUNT_APPLICATION_ACTIVATED',
        after: { state: ACCOUNT_APPLICATION_STATE.ACTIVE, accountId: activationActor.id },
      });
      return reviewResult(result.application, { replayed: result.replayed });
    },

    async expireEligibleApplication({
      actor,
      applicationId,
      expectedRevision: commandRevision,
      reason,
      clientRequestId,
    } = {}) {
      const maintenanceActor = requiredActor(actor);
      if (maintenanceActor.systemMaintenance !== true)
        fail('ACCOUNT_APPLICATION_AUTHORITY_REQUIRED', { status: 403 });
      const idempotencyKey = requiredIdempotencyKey(clientRequestId);
      const application = await repository.getApplicationById(applicationId);
      if (!application) {
        fail('ACCOUNT_APPLICATION_TRANSITION_INVALID', { status: 409 });
      }
      const replayed = await replayFor(application.id, idempotencyKey, ACCOUNT_APPLICATION_STATE.EXPIRED);
      if (replayed) return reviewResult(replayed, { replayed: true });
      if (!isExpirableAccountApplicationState(application.state)) {
        fail('ACCOUNT_APPLICATION_TRANSITION_INVALID', { status: 409 });
      }
      if (application.expiresAt > nowIso(clock))
        fail('ACCOUNT_APPLICATION_TRANSITION_INVALID', { status: 409 });
      const revision = expectedRevision(commandRevision);
      if (application.revision !== revision) fail('ACCOUNT_APPLICATION_REVISION_CONFLICT', { status: 409 });
      const result = await transition({
        application,
        toState: ACCOUNT_APPLICATION_STATE.EXPIRED,
        actorAccountId: maintenanceActor.id,
        idempotencyKey,
        reason: requiredReason(reason),
        action: 'ACCOUNT_APPLICATION_EXPIRED',
        after: { state: ACCOUNT_APPLICATION_STATE.EXPIRED },
        revokeApprovedStarter: application.state === ACCOUNT_APPLICATION_STATE.APPROVED_ACTIVATION_REQUIRED,
      });
      return reviewResult(result.application, { replayed: result.replayed });
    },

    async archiveTerminalApplication({
      actor,
      applicationId,
      expectedRevision: commandRevision,
      reason,
      clientRequestId,
    } = {}) {
      const owner = requireCapability(actor, ACCOUNT_APPLICATION_CAPABILITY.OWNER_OVERRIDE);
      const idempotencyKey = requiredIdempotencyKey(clientRequestId);
      const application = await repository.getApplicationById(applicationId);
      if (!application) {
        fail('ACCOUNT_APPLICATION_TRANSITION_INVALID', { status: 409 });
      }
      const replayed = await replayFor(application.id, idempotencyKey, ACCOUNT_APPLICATION_STATE.ARCHIVED);
      if (replayed) return reviewResult(replayed, { replayed: true });
      if (!isRetainableTerminalAccountApplicationState(application.state)) {
        fail('ACCOUNT_APPLICATION_TRANSITION_INVALID', { status: 409 });
      }
      const revision = expectedRevision(commandRevision);
      if (application.revision !== revision) fail('ACCOUNT_APPLICATION_REVISION_CONFLICT', { status: 409 });
      const archivedAt = nowIso(clock);
      const result = await transition({
        application,
        toState: ACCOUNT_APPLICATION_STATE.ARCHIVED,
        actorAccountId: owner.id,
        idempotencyKey,
        reason: requiredReason(reason),
        action: 'ACCOUNT_APPLICATION_ARCHIVED',
        updates: { archivedAt },
        after: { state: ACCOUNT_APPLICATION_STATE.ARCHIVED },
      });
      return reviewResult(result.application, { replayed: result.replayed });
    },
  });
}

export const __private__ = Object.freeze({
  applicationProfileCommand,
  normalizedUsername,
  requestedAccessFromCommand,
  safeOverrideCapture,
  safeReviewEvidence,
});
