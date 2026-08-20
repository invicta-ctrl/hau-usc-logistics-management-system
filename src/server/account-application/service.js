import {
  ACCOUNT_APPLICATION_CAPABILITY,
  ACCOUNT_APPLICATION_REVIEW_QUEUE,
  ACCOUNT_APPLICATION_STATE,
  EMAIL_VERIFICATION_CHALLENGE_STATE,
  EMAIL_VERIFICATION_PURPOSE,
  accountApplicationNextStep,
  assertAccountApplicationTransition,
  isExpirableAccountApplicationState,
  isNonterminalAccountApplicationState,
  isRetainableTerminalAccountApplicationState,
  publicApplicationStatusDto,
  redactedReviewApplicationDetailDto,
  redactedReviewApplicationListDto,
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
  ACCOUNT_APPLICATION_REVIEW_UNAVAILABLE: 'The protected application review is temporarily unavailable.',
  ACCOUNT_APPLICATION_USERNAME_TAKEN: 'That username is already in use. Choose an available suggestion.',
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

const REVIEW_LIST_DEFAULT_LIMIT = 25;
const REVIEW_LIST_MAX_LIMIT = 100;

export class AccountApplicationError extends Error {
  constructor(code, { status = 400, details } = {}) {
    super(SAFE_MESSAGES[code] ?? 'The account application could not be completed.');
    this.name = 'AccountApplicationError';
    this.code = code;
    this.status = status;
    this.details = details;
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
  const username = canonicalUsername(value);
  if (!isGovernedUsername(username)) fail('ACCOUNT_APPLICATION_INVALID');
  return username;
}

async function assertUsernameAvailable(repository, username, excludeApplicationId = '') {
  if (typeof repository.usernameCollides !== 'function') return;
  if (!(await repository.usernameCollides(username, excludeApplicationId))) return;
  const suggestions = [];
  const stem = username.slice(0, 29);
  for (let index = 1; index <= 20 && suggestions.length < 3; index += 1) {
    const candidate = `${stem}.${String(index).padStart(2, '0')}`;
    if (!(await repository.usernameCollides(candidate, excludeApplicationId))) suggestions.push(candidate);
  }
  fail('ACCOUNT_APPLICATION_USERNAME_TAKEN', {
    status: 409,
    details: { field: 'requestedUsername', usernameSuggestions: suggestions },
  });
}

async function assertIdentityAvailable(repository, emailFingerprint, excludeApplicationId = '') {
  if (typeof repository.identityCollides !== 'function') return;
  if (await repository.identityCollides(emailFingerprint, excludeApplicationId)) {
    fail('ACCOUNT_APPLICATION_INVALID');
  }
}

function normalizedOptionalId(value, { max = 128 } = {}) {
  const normalized = String(value ?? '').trim();
  if (normalized.length > max) fail('ACCOUNT_APPLICATION_INVALID');
  return normalized;
}

function requiredGovernedId(value) {
  const normalized = normalizedOptionalId(value);
  if (!normalized) fail('ACCOUNT_APPLICATION_INVALID');
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
  if (legalName.length < 3 || legalName.length > 200 || !/^\+?[0-9][0-9 ()-]{7,19}$/u.test(contactNumber)) {
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

function reviewListQuery(query, queue) {
  const filter = query?.filter;
  if (filter !== undefined && (!filter || typeof filter !== 'object' || Array.isArray(filter))) {
    fail('ACCOUNT_APPLICATION_INVALID');
  }
  if (filter && Object.keys(filter).some((key) => key !== 'state')) {
    fail('ACCOUNT_APPLICATION_INVALID');
  }
  if (query?.state !== undefined && filter?.state !== undefined) {
    fail('ACCOUNT_APPLICATION_INVALID');
  }
  const providedState = query?.state ?? filter?.state;
  const states =
    providedState === undefined
      ? [queue.state]
      : Array.isArray(providedState)
        ? providedState
        : [providedState];
  if (
    states.length !== 1 ||
    String(states[0] ?? '').trim() !== queue.state ||
    states.some((stateValue) => typeof stateValue !== 'string')
  ) {
    fail('ACCOUNT_APPLICATION_INVALID');
  }
  const limit = query?.limit ?? REVIEW_LIST_DEFAULT_LIMIT;
  const offset = query?.offset ?? 0;
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > REVIEW_LIST_MAX_LIMIT) {
    fail('ACCOUNT_APPLICATION_INVALID');
  }
  if (!Number.isSafeInteger(offset) || offset < 0) fail('ACCOUNT_APPLICATION_INVALID');
  return Object.freeze({ states: [queue.state], limit, offset });
}

function submissionEligibilityClaim(decision) {
  const claimFingerprint = String(decision?.claimFingerprint ?? '').trim();
  if (decision?.allowed !== true || !/^[A-Za-z0-9][A-Za-z0-9._:-]{7,255}$/u.test(claimFingerprint)) {
    return null;
  }
  return Object.freeze({ claimFingerprint });
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
  submissionEligibility,
  reviewDisclosure,
  activationHandoff,
  clock = { now: () => Date.now() },
  createId = () => globalThis.crypto.randomUUID(),
  createApplicationCode = applicationCodeFrom,
  config = {},
} = {}) {
  if (
    !repository ||
    !identityProtection ||
    !passwordKdf ||
    !tokenCrypto ||
    !rateLimiter ||
    !submissionEligibility ||
    !reviewDisclosure
  ) {
    throw new Error(
      'Account-application repository, identity protection, crypto, rate limiter, and submission eligibility adapters are required.',
    );
  }
  if (
    typeof identityProtection.prepareEmail !== 'function' ||
    typeof identityProtection.protectApplicationProfile !== 'function' ||
    typeof identityProtection.fingerprintRequestedAccess !== 'function' ||
    typeof passwordKdf.hash !== 'function' ||
    typeof passwordKdf.verify !== 'function' ||
    typeof tokenCrypto.createToken !== 'function' ||
    typeof tokenCrypto.digest !== 'function' ||
    typeof rateLimiter.consume !== 'function' ||
    typeof submissionEligibility.evaluate !== 'function' ||
    typeof reviewDisclosure.reveal !== 'function'
  ) {
    throw new Error('Account-application adapter contract is incomplete.');
  }
  if (
    typeof repository.listApplicationsForReview !== 'function' ||
    typeof repository.getApplicationForReview !== 'function'
  ) {
    throw new Error('Account-application repository review-read contract is incomplete.');
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

  async function approvedSubmissionEligibility(input) {
    try {
      return submissionEligibilityClaim(await submissionEligibility.evaluate(Object.freeze({ ...input })));
    } catch {
      return null;
    }
  }

  async function mutationFingerprint(value) {
    const fingerprint = await identityProtection.fingerprintRequestedAccess({
      accountApplicationMutation: value,
    });
    if (!String(fingerprint ?? '').trim()) fail('ACCOUNT_APPLICATION_INVALID');
    return String(fingerprint).trim();
  }

  async function replayFor(
    applicationId,
    idempotencyKey,
    expectedToState,
    { actorAccountId = '', applicantAuthorityFingerprint = '', requestFingerprint = '' } = {},
  ) {
    const replay = await repository.getApplicationReplayByIdempotencyKey?.(idempotencyKey);
    if (!replay) return null;
    if (
      replay.application?.id !== applicationId ||
      replay.history?.toState !== expectedToState ||
      String(replay.history?.actorAccountId ?? '') !== actorAccountId ||
      String(replay.history?.applicantAuthorityFingerprint ?? '') !== applicantAuthorityFingerprint ||
      String(replay.history?.after?.requestFingerprint ?? '') !== requestFingerprint
    ) {
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
    requestFingerprint,
    requireDistinctFromAdministrator = false,
    revokeApprovedStarter = false,
  }) {
    const replayBinding = { actorAccountId, applicantAuthorityFingerprint, requestFingerprint };
    const replayed = await replayFor(application.id, idempotencyKey, toState, replayBinding);
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
      after: { ...after, requestFingerprint },
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
    const conditionalAccountAudit =
      action === 'ACCOUNT_APPLICATION_ACTIVATED'
        ? safeAccountAudit({
            id: createId(),
            accountId: actorAccountId,
            actorAccountId,
            action: 'ACCOUNT_APPLICATION_ACTIVATED',
            before: history.before,
            after: auditAfter,
            correlationId,
            reason,
            createdAt: occurredAt,
          })
        : null;
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
          conditionalAccountAudit,
          requireDistinctFromAdministrator,
          revokeApprovedStarter,
        }),
        replayed: false,
      };
    } catch {
      const racedReplay = await replayFor(application.id, idempotencyKey, toState, replayBinding);
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
    const requestFingerprint = await mutationFingerprint({
      operation: action,
      applicationId,
      actorAccountId: reviewer.id,
      expectedRevision: revision,
      toState,
      reason,
      reviewEvidence: evidence,
    });
    const application = await repository.getApplicationById(applicationId);
    if (!application) fail('ACCOUNT_APPLICATION_NOT_FOUND', { status: 404 });
    const replayed = await replayFor(application.id, idempotencyKey, toState, {
      actorAccountId: reviewer.id,
      requestFingerprint,
    });
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
      requestFingerprint,
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

  async function listReviewApplications({ actor, queue, query }) {
    requireCapability(actor, queue.capability);
    const pagination = reviewListQuery(query, queue);
    const rows = await repository.listApplicationsForReview({
      states: pagination.states,
      limit: pagination.limit + 1,
      offset: pagination.offset,
    });
    if (!Array.isArray(rows))
      throw new Error('Account-application review repository returned an invalid list.');
    const hasMore = rows.length > pagination.limit;
    return {
      ok: true,
      applications: rows.slice(0, pagination.limit).map(redactedReviewApplicationListDto),
      pagination: {
        limit: pagination.limit,
        offset: pagination.offset,
        hasMore,
        nextOffset: hasMore ? pagination.offset + pagination.limit : null,
      },
      correlationId: correlation(),
    };
  }

  async function getReviewApplication({ actor, applicationId, queue }) {
    requireCapability(actor, queue.capability);
    const id = String(applicationId ?? '').trim();
    if (!id) fail('ACCOUNT_APPLICATION_NOT_FOUND', { status: 404 });
    const application = await repository.getApplicationForReview({
      applicationId: id,
      states: [queue.state],
    });
    if (!application) fail('ACCOUNT_APPLICATION_NOT_FOUND', { status: 404 });
    let disclosure;
    try {
      const protectedApplication = await repository.getApplicationById(application.id);
      const [revealed, history] = await Promise.all([
        reviewDisclosure.reveal(protectedApplication),
        repository.listHistoryByApplicationId?.(application.id) ?? [],
      ]);
      disclosure = { ...revealed, history };
    } catch {
      fail('ACCOUNT_APPLICATION_REVIEW_UNAVAILABLE', { status: 503 });
    }
    return {
      ok: true,
      application: redactedReviewApplicationDetailDto({ ...application, ...disclosure }),
      correlationId: correlation(),
    };
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
    const requestFingerprint = await mutationFingerprint({
      operation: ownerOverride
        ? 'ACCOUNT_APPLICATION_OWNER_OVERRIDE_APPROVE'
        : 'ACCOUNT_APPLICATION_DIRECTOR_APPROVED',
      applicationId,
      actorAccountId: approver.id,
      expectedRevision: revision,
      toState: ACCOUNT_APPLICATION_STATE.APPROVED_ACTIVATION_REQUIRED,
      reason,
      reviewEvidence: evidence,
      ownerOverride: ownerOverride ?? null,
    });
    const application = await repository.getApplicationById(applicationId);
    if (!application) fail('ACCOUNT_APPLICATION_NOT_FOUND', { status: 404 });
    const replayed = await replayFor(
      application.id,
      idempotencyKey,
      ACCOUNT_APPLICATION_STATE.APPROVED_ACTIVATION_REQUIRED,
      { actorAccountId: approver.id, requestFingerprint },
    );
    if (replayed) return reviewResult(replayed, { replayed: true });
    if (ownerOverride && ownerOverride.currentState !== application.state) {
      fail('ACCOUNT_APPLICATION_OVERRIDE_INVALID', { status: 409 });
    }
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
        requestFingerprint,
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
        { actorAccountId: approver.id, requestFingerprint },
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
        const verificationCode = tokenCrypto.createNumericCode(8);
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
        // The challenge is marked sent only after the provider accepts. A
        // timeout, network fault, or 5xx throws, so a message that was never
        // delivered can never be recorded as sent.
        const delivered = await emailProvider.sendVerification({
          delivery: identity.providerDelivery,
          verificationCode,
          expiresAt: challenge.expiresAt,
          correlationId: correlation(),
        });
        await repository.markVerificationChallengeSent({
          challengeId: challenge.id,
          emailFingerprint: challenge.emailFingerprint,
          sentAt: issuedAt,
          providerMessageRef: delivered?.providerMessageRef ?? '',
        });
      } catch {
        // Public verification start remains generic. No delivery or identity detail is logged or audited here.
      }
      return generic;
    },

    async confirmEmailVerification({ email, code } = {}) {
      const identity = await preparedEmail(email);
      const verificationCode = String(code ?? '').trim();
      if (!identity || !/^\d{8}$/u.test(verificationCode)) fail('VERIFICATION_INVALID');
      const confirmedAt = nowIso(clock);
      const verificationReceipt = tokenCrypto.createToken();
      let confirmed;
      try {
        confirmed = await repository.confirmVerificationChallenge({
          emailFingerprint: identity.emailFingerprint,
          identityClassId: identity.identityClassId,
          purpose: EMAIL_VERIFICATION_PURPOSE.ACCOUNT_APPLICATION,
          secretDigest: await tokenCrypto.digest(verificationCode),
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
      const verifiedChallenge =
        await repository.getVerificationChallengeByReceiptDigest?.(verificationReceiptDigest);
      if (
        existing &&
        (verifiedChallenge?.state !== EMAIL_VERIFICATION_CHALLENGE_STATE.CONSUMED ||
          verifiedChallenge.emailFingerprint !== existing.emailFingerprint)
      ) {
        fail('ACCOUNT_APPLICATION_IDEMPOTENCY_CONFLICT', { status: 409 });
      }
      if (!existing && verifiedChallenge?.state !== EMAIL_VERIFICATION_CHALLENGE_STATE.VERIFIED) {
        fail('VERIFICATION_INVALID');
      }
      if (String(command.password ?? '') !== String(command.confirmPassword ?? '')) {
        fail('ACCOUNT_APPLICATION_INVALID');
      }
      const profile = applicationProfileCommand(command);
      const requestedAccess = requestedAccessFromCommand(command);
      const departmentId = requiredGovernedId(command.departmentId);
      const courseId = requiredGovernedId(command.courseId);
      const yearLevel = normalizedYearLevel(command.yearLevel);
      const requestedUsernameNormalized = normalizedUsername(command.requestedUsername);
      const emailFingerprint = String(verifiedChallenge.emailFingerprint ?? '').trim();
      const identityClassId = String(verifiedChallenge.identityClassId ?? '').trim();
      if (!emailFingerprint || !identityClassId) fail('VERIFICATION_INVALID');
      let protectedProfile;
      let requestedAccessFingerprint;
      try {
        protectedProfile = await identityProtection.protectApplicationProfile(profile);
        requestedAccessFingerprint = await identityProtection.fingerprintRequestedAccess(requestedAccess);
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
      const requestFingerprint = await mutationFingerprint({
        operation: 'ACCOUNT_APPLICATION_SUBMITTED',
        applicantAuthorityFingerprint: verificationReceiptDigest,
        expectedRevision: 1,
        profileFingerprint: protectedProfile.profileFingerprint,
        requestedAccessFingerprint,
        departmentId,
        courseId,
        yearLevel,
        requestedUsernameNormalized,
      });
      if (existing) {
        const replayed = await replayFor(
          existing.id,
          clientRequestId,
          ACCOUNT_APPLICATION_STATE.PENDING_ADMIN_REVIEW,
          { applicantAuthorityFingerprint: verificationReceiptDigest, requestFingerprint },
        );
        let passwordMatches = false;
        try {
          passwordMatches = Boolean(
            replayed && (await passwordKdf.verify(command.password, replayed.pendingPasswordCredential)),
          );
        } catch {
          passwordMatches = false;
        }
        if (!passwordMatches) fail('ACCOUNT_APPLICATION_IDEMPOTENCY_CONFLICT', { status: 409 });
        return publicSubmissionDto(replayed, '', { replayed: true });
      }
      const eligibility = await approvedSubmissionEligibility({
        emailFingerprint,
        identityClassId,
        requestedUsernameNormalized,
        requestedAccessFingerprint: String(requestedAccessFingerprint),
      });
      if (!eligibility) fail('ACCOUNT_APPLICATION_INVALID');
      await assertIdentityAvailable(repository, emailFingerprint);
      await assertUsernameAvailable(repository, requestedUsernameNormalized);
      let pendingPasswordCredential;
      try {
        pendingPasswordCredential = await passwordKdf.hash(command.password);
      } catch {
        fail('ACCOUNT_APPLICATION_INVALID');
      }
      const createdAt = nowIso(clock);
      const applicationId = createId();
      const statusToken = tokenCrypto.createToken();
      const correlationId = correlation();
      const application = {
        id: applicationId,
        applicationCode: createApplicationCode(applicationId),
        emailFingerprint,
        identityClassId,
        protectedEmailEnvelope: verifiedChallenge.protectedEmailEnvelope,
        protectedProfileEnvelope: String(protectedProfile.protectedProfileEnvelope),
        departmentId,
        courseId,
        yearLevel,
        requestedUsernameNormalized,
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
        after: {
          state: ACCOUNT_APPLICATION_STATE.PENDING_ADMIN_REVIEW,
          requestedAccessFingerprint,
          submissionEligibilityClaim: eligibility.claimFingerprint,
          requestFingerprint,
        },
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
          eligibilityApproved: true,
          history: { draft: draftHistory, submission: submissionHistory },
          audit,
        });
      } catch (error) {
        if (error instanceof AccountApplicationError) throw error;
        const raced = await repository.getApplicationByClientRequestId?.(clientRequestId);
        const receipt = await repository.getVerificationChallengeByReceiptDigest?.(verificationReceiptDigest);
        if (raced && receipt?.emailFingerprint === raced.emailFingerprint) {
          const replayed = await replayFor(
            raced.id,
            clientRequestId,
            ACCOUNT_APPLICATION_STATE.PENDING_ADMIN_REVIEW,
            { applicantAuthorityFingerprint: verificationReceiptDigest, requestFingerprint },
          );
          let passwordMatches = false;
          try {
            passwordMatches = Boolean(
              replayed && (await passwordKdf.verify(command.password, replayed.pendingPasswordCredential)),
            );
          } catch {
            passwordMatches = false;
          }
          if (passwordMatches) return publicSubmissionDto(replayed, '', { replayed: true });
          fail('ACCOUNT_APPLICATION_IDEMPOTENCY_CONFLICT', { status: 409 });
        }
        await assertIdentityAvailable(repository, emailFingerprint);
        await assertUsernameAvailable(repository, requestedUsernameNormalized);
        fail('ACCOUNT_APPLICATION_INVALID');
      }
      return publicSubmissionDto(created, statusToken);
    },

    async resubmitApplication({ statusToken, ...command } = {}) {
      const digest = await tokenCrypto.digest(statusToken);
      const application = await repository.getApplicationByStatusTokenDigest?.(digest, nowIso(clock));
      if (!application) fail('ACCOUNT_APPLICATION_STATUS_TOKEN_INVALID', { status: 404 });
      const revision = expectedRevision(command.expectedRevision);
      const idempotencyKey = requiredIdempotencyKey(command.clientRequestId);
      if (String(command.password ?? '') !== String(command.confirmPassword ?? '')) {
        fail('ACCOUNT_APPLICATION_INVALID');
      }
      const profile = applicationProfileCommand(command);
      const requestedAccess = requestedAccessFromCommand(command);
      const departmentId = requiredGovernedId(command.departmentId);
      const courseId = requiredGovernedId(command.courseId);
      const yearLevel = normalizedYearLevel(command.yearLevel);
      const requestedUsernameNormalized = normalizedUsername(command.requestedUsername);
      const identityClassId = String(application.identityClassId ?? '').trim();
      if (!application.emailFingerprint || !identityClassId) fail('ACCOUNT_APPLICATION_INVALID');

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
      const requestFingerprint = await mutationFingerprint({
        operation: 'ACCOUNT_APPLICATION_RESUBMITTED',
        applicationId: application.id,
        applicantAuthorityFingerprint: application.statusTokenDigest,
        expectedRevision: revision,
        profileFingerprint: protectedProfile.profileFingerprint,
        requestedAccessFingerprint,
        departmentId,
        courseId,
        yearLevel,
        requestedUsernameNormalized,
      });
      const replayed = await replayFor(
        application.id,
        idempotencyKey,
        ACCOUNT_APPLICATION_STATE.PENDING_ADMIN_REVIEW,
        {
          applicantAuthorityFingerprint: application.statusTokenDigest,
          requestFingerprint,
        },
      );
      if (replayed) {
        let passwordMatches = false;
        try {
          passwordMatches = await passwordKdf.verify(command.password, replayed.pendingPasswordCredential);
        } catch {
          passwordMatches = false;
        }
        if (!passwordMatches) fail('ACCOUNT_APPLICATION_IDEMPOTENCY_CONFLICT', { status: 409 });
        return publicApplicationStatusDto(replayed);
      }
      if (application.revision !== revision) {
        fail('ACCOUNT_APPLICATION_REVISION_CONFLICT', { status: 409 });
      }
      if (application.state !== ACCOUNT_APPLICATION_STATE.CHANGES_REQUESTED) {
        fail('ACCOUNT_APPLICATION_TRANSITION_INVALID', { status: 409 });
      }
      assertAccountApplicationTransition(application.state, ACCOUNT_APPLICATION_STATE.PENDING_ADMIN_REVIEW);
      const eligibility = await approvedSubmissionEligibility({
        emailFingerprint: application.emailFingerprint,
        identityClassId,
        requestedUsernameNormalized,
        requestedAccessFingerprint: String(requestedAccessFingerprint),
      });
      if (!eligibility) fail('ACCOUNT_APPLICATION_INVALID');
      await assertIdentityAvailable(repository, application.emailFingerprint, application.id);
      await assertUsernameAvailable(repository, requestedUsernameNormalized, application.id);

      const occurredAt = nowIso(clock);
      const correlationId = correlation();
      const history = safeHistory({
        id: createId(),
        applicationId: application.id,
        fromState: application.state,
        toState: ACCOUNT_APPLICATION_STATE.PENDING_ADMIN_REVIEW,
        applicantAuthorityFingerprint: application.statusTokenDigest,
        before: { state: application.state, revision: application.revision },
        after: {
          state: ACCOUNT_APPLICATION_STATE.PENDING_ADMIN_REVIEW,
          profileFingerprint: protectedProfile.profileFingerprint,
          requestedAccessFingerprint,
          submissionEligibilityClaim: eligibility.claimFingerprint,
          requestFingerprint,
        },
        expectedRevision: application.revision,
        resultingRevision: application.revision + 1,
        idempotencyKey,
        correlationId,
        createdAt: occurredAt,
      });
      const audit = safeAudit({
        id: createId(),
        applicationId: application.id,
        action: 'ACCOUNT_APPLICATION_RESUBMITTED',
        before: history.before,
        after: {
          state: ACCOUNT_APPLICATION_STATE.PENDING_ADMIN_REVIEW,
          profileFingerprint: protectedProfile.profileFingerprint,
          requestedAccessFingerprint,
          submissionEligibilityClaim: eligibility.claimFingerprint,
        },
        correlationId,
        reason: '',
        createdAt: occurredAt,
      });
      try {
        const resubmitted = await repository.resubmitApplication({
          applicationId: application.id,
          expectedRevision: application.revision,
          idempotencyKey,
          occurredAt,
          eligibilityApproved: true,
          emailFingerprint: application.emailFingerprint,
          updates: {
            protectedProfileEnvelope: String(protectedProfile.protectedProfileEnvelope),
            departmentId,
            courseId,
            yearLevel,
            requestedUsernameNormalized,
            pendingPasswordCredential,
            requestedAccess,
          },
          history,
          audit,
        });
        return publicApplicationStatusDto(resubmitted);
      } catch (error) {
        if (error instanceof AccountApplicationError) throw error;
        const racedReplay = await replayFor(
          application.id,
          idempotencyKey,
          ACCOUNT_APPLICATION_STATE.PENDING_ADMIN_REVIEW,
          {
            applicantAuthorityFingerprint: application.statusTokenDigest,
            requestFingerprint,
          },
        );
        if (racedReplay) {
          let passwordMatches = false;
          try {
            passwordMatches = await passwordKdf.verify(
              command.password,
              racedReplay.pendingPasswordCredential,
            );
          } catch {
            passwordMatches = false;
          }
          if (passwordMatches) return publicApplicationStatusDto(racedReplay);
          fail('ACCOUNT_APPLICATION_IDEMPOTENCY_CONFLICT', { status: 409 });
        }
        await assertIdentityAvailable(repository, application.emailFingerprint, application.id);
        await assertUsernameAvailable(repository, requestedUsernameNormalized, application.id);
        fail('ACCOUNT_APPLICATION_INVALID');
      }
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
      const normalizedReason = requiredReason(reason);
      const requestFingerprint = await mutationFingerprint({
        operation: 'ACCOUNT_APPLICATION_WITHDRAWN',
        applicationId: application.id,
        applicantAuthorityFingerprint: application.statusTokenDigest,
        expectedRevision: revision,
        reason: normalizedReason,
      });
      const replayed = await replayFor(application.id, idempotencyKey, ACCOUNT_APPLICATION_STATE.WITHDRAWN, {
        applicantAuthorityFingerprint: application.statusTokenDigest,
        requestFingerprint,
      });
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
        reason: normalizedReason,
        action: 'ACCOUNT_APPLICATION_WITHDRAWN',
        requestFingerprint,
        after: { state: ACCOUNT_APPLICATION_STATE.WITHDRAWN },
        revokeApprovedStarter: application.state === ACCOUNT_APPLICATION_STATE.APPROVED_ACTIVATION_REQUIRED,
      });
      return publicApplicationStatusDto(result.application);
    },

    async adminList({ actor, ...query } = {}) {
      return listReviewApplications({
        actor,
        queue: ACCOUNT_APPLICATION_REVIEW_QUEUE.ADMINISTRATOR,
        query,
      });
    },

    async adminGet({ actor, applicationId } = {}) {
      return getReviewApplication({
        actor,
        applicationId,
        queue: ACCOUNT_APPLICATION_REVIEW_QUEUE.ADMINISTRATOR,
      });
    },

    async directorList({ actor, ...query } = {}) {
      return listReviewApplications({
        actor,
        queue: ACCOUNT_APPLICATION_REVIEW_QUEUE.DIRECTOR,
        query,
      });
    },

    async directorGet({ actor, applicationId } = {}) {
      return getReviewApplication({
        actor,
        applicationId,
        queue: ACCOUNT_APPLICATION_REVIEW_QUEUE.DIRECTOR,
      });
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
      const currentState = String(override?.currentState ?? '');
      const action = String(override?.action ?? '').toUpperCase();
      const overrideRequest = Object.freeze({ action, currentState, ...capture });
      if (action === 'APPROVE') {
        return approve({ actor: owner, applicationId, command, ownerOverride: overrideRequest });
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
      const normalizedReason = requiredReason(command.reason);
      const requestFingerprint = await mutationFingerprint({
        operation: 'ACCOUNT_APPLICATION_OWNER_OVERRIDE',
        applicationId: application.id,
        actorAccountId: owner.id,
        expectedRevision: revision,
        toState,
        reason: normalizedReason,
        ownerOverride: overrideRequest,
      });
      const replayed = await replayFor(application.id, idempotencyKey, toState, {
        actorAccountId: owner.id,
        requestFingerprint,
      });
      if (replayed) return reviewResult(replayed, { replayed: true });
      if (currentState !== application.state) {
        fail('ACCOUNT_APPLICATION_OVERRIDE_INVALID', { status: 409 });
      }
      if (application.revision !== revision) fail('ACCOUNT_APPLICATION_REVISION_CONFLICT', { status: 409 });
      const result = await transition({
        application,
        toState,
        actorAccountId: owner.id,
        idempotencyKey,
        reason: normalizedReason,
        action: 'ACCOUNT_APPLICATION_OWNER_OVERRIDE',
        requestFingerprint,
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
      const revision = expectedRevision(commandRevision);
      const requestFingerprint = await mutationFingerprint({
        operation: 'ACCOUNT_APPLICATION_ACTIVATED',
        applicationId: application.id,
        actorAccountId: activationActor.id,
      });
      const replayed = await replayFor(application.id, idempotencyKey, ACCOUNT_APPLICATION_STATE.ACTIVE, {
        actorAccountId: activationActor.id,
        requestFingerprint,
      });
      if (replayed) return reviewResult(replayed, { replayed: true });
      if (application.revision !== revision) fail('ACCOUNT_APPLICATION_REVISION_CONFLICT', { status: 409 });
      const result = await transition({
        application,
        toState: ACCOUNT_APPLICATION_STATE.ACTIVE,
        actorAccountId: activationActor.id,
        idempotencyKey,
        action: 'ACCOUNT_APPLICATION_ACTIVATED',
        requestFingerprint,
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
      const revision = expectedRevision(commandRevision);
      const normalizedReason = requiredReason(reason);
      const requestFingerprint = await mutationFingerprint({
        operation: 'ACCOUNT_APPLICATION_EXPIRED',
        applicationId: application.id,
        actorAccountId: maintenanceActor.id,
        expectedRevision: revision,
        reason: normalizedReason,
      });
      const replayed = await replayFor(application.id, idempotencyKey, ACCOUNT_APPLICATION_STATE.EXPIRED, {
        actorAccountId: maintenanceActor.id,
        requestFingerprint,
      });
      if (replayed) return reviewResult(replayed, { replayed: true });
      if (!isExpirableAccountApplicationState(application.state)) {
        fail('ACCOUNT_APPLICATION_TRANSITION_INVALID', { status: 409 });
      }
      if (application.expiresAt > nowIso(clock))
        fail('ACCOUNT_APPLICATION_TRANSITION_INVALID', { status: 409 });
      if (application.revision !== revision) fail('ACCOUNT_APPLICATION_REVISION_CONFLICT', { status: 409 });
      const result = await transition({
        application,
        toState: ACCOUNT_APPLICATION_STATE.EXPIRED,
        actorAccountId: maintenanceActor.id,
        idempotencyKey,
        reason: normalizedReason,
        action: 'ACCOUNT_APPLICATION_EXPIRED',
        requestFingerprint,
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
      const revision = expectedRevision(commandRevision);
      const normalizedReason = requiredReason(reason);
      const requestFingerprint = await mutationFingerprint({
        operation: 'ACCOUNT_APPLICATION_ARCHIVED',
        applicationId: application.id,
        actorAccountId: owner.id,
        expectedRevision: revision,
        reason: normalizedReason,
      });
      const replayed = await replayFor(application.id, idempotencyKey, ACCOUNT_APPLICATION_STATE.ARCHIVED, {
        actorAccountId: owner.id,
        requestFingerprint,
      });
      if (replayed) return reviewResult(replayed, { replayed: true });
      if (!isRetainableTerminalAccountApplicationState(application.state)) {
        fail('ACCOUNT_APPLICATION_TRANSITION_INVALID', { status: 409 });
      }
      if (application.revision !== revision) fail('ACCOUNT_APPLICATION_REVISION_CONFLICT', { status: 409 });
      const archivedAt = nowIso(clock);
      const result = await transition({
        application,
        toState: ACCOUNT_APPLICATION_STATE.ARCHIVED,
        actorAccountId: owner.id,
        idempotencyKey,
        reason: normalizedReason,
        action: 'ACCOUNT_APPLICATION_ARCHIVED',
        requestFingerprint,
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
import { canonicalUsername, isGovernedUsername } from '../../domain/username.js';
