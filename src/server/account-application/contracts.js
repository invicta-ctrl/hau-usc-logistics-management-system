const state = (value) => value;

export const ACCOUNT_APPLICATION_STATE = Object.freeze({
  EMAIL_UNVERIFIED: state('EMAIL_UNVERIFIED'),
  DRAFT: state('DRAFT'),
  PENDING_ADMIN_REVIEW: state('PENDING_ADMIN_REVIEW'),
  CHANGES_REQUESTED: state('CHANGES_REQUESTED'),
  PENDING_DIRECTOR_APPROVAL: state('PENDING_DIRECTOR_APPROVAL'),
  APPROVED_ACTIVATION_REQUIRED: state('APPROVED_ACTIVATION_REQUIRED'),
  ACTIVE: state('ACTIVE'),
  REJECTED: state('REJECTED'),
  WITHDRAWN: state('WITHDRAWN'),
  EXPIRED: state('EXPIRED'),
  ARCHIVED: state('ARCHIVED'),
});

export const EMAIL_VERIFICATION_CHALLENGE_STATE = Object.freeze({
  PENDING: 'PENDING',
  VERIFIED: 'VERIFIED',
  CONSUMED: 'CONSUMED',
  EXPIRED: 'EXPIRED',
  REVOKED: 'REVOKED',
});

export const EMAIL_VERIFICATION_PURPOSE = Object.freeze({
  ACCOUNT_APPLICATION: 'ACCOUNT_APPLICATION',
});

export const ACCOUNT_APPLICATION_CAPABILITY = Object.freeze({
  ADMIN_REVIEW: 'account_application.admin_review',
  DIRECTOR_DECIDE: 'account_application.director_decide',
  OWNER_OVERRIDE: 'account_application.owner_override',
});

export const ACCOUNT_APPLICATION_REVIEW_QUEUE = Object.freeze({
  ADMINISTRATOR: Object.freeze({
    capability: ACCOUNT_APPLICATION_CAPABILITY.ADMIN_REVIEW,
    state: ACCOUNT_APPLICATION_STATE.PENDING_ADMIN_REVIEW,
  }),
  DIRECTOR: Object.freeze({
    capability: ACCOUNT_APPLICATION_CAPABILITY.DIRECTOR_DECIDE,
    state: ACCOUNT_APPLICATION_STATE.PENDING_DIRECTOR_APPROVAL,
  }),
});

export const ACCOUNT_APPLICATION_ACTION = Object.freeze({
  SUBMIT: 'SUBMIT',
  WITHDRAW: 'WITHDRAW',
  ADMIN_REQUEST_CHANGES: 'ADMIN_REQUEST_CHANGES',
  ADMIN_REJECT: 'ADMIN_REJECT',
  ADMIN_FORWARD: 'ADMIN_FORWARD',
  DIRECTOR_REQUEST_CHANGES: 'DIRECTOR_REQUEST_CHANGES',
  DIRECTOR_REJECT: 'DIRECTOR_REJECT',
  DIRECTOR_APPROVE: 'DIRECTOR_APPROVE',
  OWNER_OVERRIDE: 'OWNER_OVERRIDE',
  ACTIVATE: 'ACTIVATE',
  EXPIRE: 'EXPIRE',
  ARCHIVE: 'ARCHIVE',
});

const FIXED_TRANSITIONS = Object.freeze({
  [ACCOUNT_APPLICATION_STATE.EMAIL_UNVERIFIED]: Object.freeze([ACCOUNT_APPLICATION_STATE.DRAFT]),
  [ACCOUNT_APPLICATION_STATE.DRAFT]: Object.freeze([ACCOUNT_APPLICATION_STATE.PENDING_ADMIN_REVIEW]),
  [ACCOUNT_APPLICATION_STATE.PENDING_ADMIN_REVIEW]: Object.freeze([
    ACCOUNT_APPLICATION_STATE.CHANGES_REQUESTED,
    ACCOUNT_APPLICATION_STATE.PENDING_DIRECTOR_APPROVAL,
    ACCOUNT_APPLICATION_STATE.REJECTED,
  ]),
  [ACCOUNT_APPLICATION_STATE.CHANGES_REQUESTED]: Object.freeze([
    ACCOUNT_APPLICATION_STATE.PENDING_ADMIN_REVIEW,
  ]),
  [ACCOUNT_APPLICATION_STATE.PENDING_DIRECTOR_APPROVAL]: Object.freeze([
    ACCOUNT_APPLICATION_STATE.CHANGES_REQUESTED,
    ACCOUNT_APPLICATION_STATE.APPROVED_ACTIVATION_REQUIRED,
    ACCOUNT_APPLICATION_STATE.REJECTED,
  ]),
  [ACCOUNT_APPLICATION_STATE.APPROVED_ACTIVATION_REQUIRED]: Object.freeze([ACCOUNT_APPLICATION_STATE.ACTIVE]),
});

export const ACCOUNT_APPLICATION_TRANSITIONS = Object.freeze({
  ...FIXED_TRANSITIONS,
  [ACCOUNT_APPLICATION_STATE.ACTIVE]: Object.freeze([]),
  [ACCOUNT_APPLICATION_STATE.REJECTED]: Object.freeze([]),
  [ACCOUNT_APPLICATION_STATE.WITHDRAWN]: Object.freeze([]),
  [ACCOUNT_APPLICATION_STATE.EXPIRED]: Object.freeze([]),
  [ACCOUNT_APPLICATION_STATE.ARCHIVED]: Object.freeze([]),
});

export const ACCOUNT_APPLICATION_NONTERMINAL_STATES = Object.freeze([
  ACCOUNT_APPLICATION_STATE.EMAIL_UNVERIFIED,
  ACCOUNT_APPLICATION_STATE.DRAFT,
  ACCOUNT_APPLICATION_STATE.PENDING_ADMIN_REVIEW,
  ACCOUNT_APPLICATION_STATE.CHANGES_REQUESTED,
  ACCOUNT_APPLICATION_STATE.PENDING_DIRECTOR_APPROVAL,
  ACCOUNT_APPLICATION_STATE.APPROVED_ACTIVATION_REQUIRED,
]);

export const ACCOUNT_APPLICATION_EXPIRABLE_STATES = Object.freeze([
  ACCOUNT_APPLICATION_STATE.DRAFT,
  ACCOUNT_APPLICATION_STATE.PENDING_ADMIN_REVIEW,
  ACCOUNT_APPLICATION_STATE.CHANGES_REQUESTED,
  ACCOUNT_APPLICATION_STATE.PENDING_DIRECTOR_APPROVAL,
  ACCOUNT_APPLICATION_STATE.APPROVED_ACTIVATION_REQUIRED,
]);

export const ACCOUNT_APPLICATION_RETAINABLE_TERMINAL_STATES = Object.freeze([
  ACCOUNT_APPLICATION_STATE.ACTIVE,
  ACCOUNT_APPLICATION_STATE.REJECTED,
  ACCOUNT_APPLICATION_STATE.WITHDRAWN,
  ACCOUNT_APPLICATION_STATE.EXPIRED,
]);

export const ACCOUNT_APPLICATION_STATES = Object.freeze(Object.values(ACCOUNT_APPLICATION_STATE));

export function isAccountApplicationState(value) {
  return ACCOUNT_APPLICATION_STATES.includes(value);
}

export function isNonterminalAccountApplicationState(value) {
  return ACCOUNT_APPLICATION_NONTERMINAL_STATES.includes(value);
}

export function isExpirableAccountApplicationState(value) {
  return ACCOUNT_APPLICATION_EXPIRABLE_STATES.includes(value);
}

export function isRetainableTerminalAccountApplicationState(value) {
  return ACCOUNT_APPLICATION_RETAINABLE_TERMINAL_STATES.includes(value);
}

export function canTransitionAccountApplication(fromState, toState) {
  if (!isAccountApplicationState(fromState) || !isAccountApplicationState(toState)) return false;
  if (isNonterminalAccountApplicationState(fromState) && toState === ACCOUNT_APPLICATION_STATE.WITHDRAWN) {
    return true;
  }
  if (isExpirableAccountApplicationState(fromState) && toState === ACCOUNT_APPLICATION_STATE.EXPIRED) {
    return true;
  }
  if (
    isRetainableTerminalAccountApplicationState(fromState) &&
    toState === ACCOUNT_APPLICATION_STATE.ARCHIVED
  ) {
    return true;
  }
  return ACCOUNT_APPLICATION_TRANSITIONS[fromState].includes(toState);
}

export function assertAccountApplicationTransition(fromState, toState) {
  if (!canTransitionAccountApplication(fromState, toState)) {
    throw Object.assign(new Error('The requested account-application state transition is not allowed.'), {
      code: 'ACCOUNT_APPLICATION_TRANSITION_INVALID',
    });
  }
}

export function accountApplicationNextStep(stateValue) {
  switch (stateValue) {
    case ACCOUNT_APPLICATION_STATE.DRAFT:
    case ACCOUNT_APPLICATION_STATE.CHANGES_REQUESTED:
      return 'COMPLETE_AND_SUBMIT_APPLICATION';
    case ACCOUNT_APPLICATION_STATE.PENDING_ADMIN_REVIEW:
      return 'AWAIT_ADMINISTRATOR_REVIEW';
    case ACCOUNT_APPLICATION_STATE.PENDING_DIRECTOR_APPROVAL:
      return 'AWAIT_DIRECTOR_APPROVAL';
    case ACCOUNT_APPLICATION_STATE.APPROVED_ACTIVATION_REQUIRED:
      return 'COMPLETE_STARTER_ACCOUNT_ACTIVATION';
    case ACCOUNT_APPLICATION_STATE.ACTIVE:
      return 'ACCOUNT_ACTIVE';
    case ACCOUNT_APPLICATION_STATE.REJECTED:
      return 'APPLICATION_REJECTED';
    case ACCOUNT_APPLICATION_STATE.WITHDRAWN:
      return 'APPLICATION_WITHDRAWN';
    case ACCOUNT_APPLICATION_STATE.EXPIRED:
      return 'APPLICATION_EXPIRED';
    case ACCOUNT_APPLICATION_STATE.ARCHIVED:
      return 'APPLICATION_ARCHIVED';
    default:
      return 'VERIFY_APPROVED_EMAIL';
  }
}

export function publicApplicationStatusDto(application) {
  if (!application) return null;
  const dto = {
    ok: true,
    applicationCode: application.applicationCode,
    state: application.state,
    revision: application.revision,
    submittedAt: application.submittedAt ?? application.createdAt,
    updatedAt: application.updatedAt,
    nextStep: accountApplicationNextStep(application.state),
  };
  if (application.changeRequestSummary) dto.changeRequestSummary = application.changeRequestSummary;
  if (application.accountCode) dto.accountCode = application.accountCode;
  if (application.state === ACCOUNT_APPLICATION_STATE.APPROVED_ACTIVATION_REQUIRED) {
    dto.activationReady = true;
  }
  return dto;
}

function safeReviewText(value, { max = 200 } = {}) {
  const text = typeof value === 'string' ? value.trim() : '';
  return text.length <= max ? text : '';
}

function safeReviewIdList(values) {
  if (!Array.isArray(values)) return [];
  return [...new Set(values.map((value) => safeReviewText(value, { max: 128 })).filter(Boolean))].sort();
}

function redactedRequestedAccessDto(requestedAccess) {
  const source = requestedAccess && typeof requestedAccess === 'object' ? requestedAccess : {};
  return {
    requestedAccountType: safeReviewText(source.requestedAccountType, { max: 64 }),
    requestedRoleId: safeReviewText(source.requestedRoleId, { max: 128 }),
    requestedCommitteeIds: safeReviewIdList(source.requestedCommitteeIds),
    requestedWorkspaceIds: safeReviewIdList(source.requestedWorkspaceIds),
    lendingSelfService: source.lendingSelfService === true,
    internalLendingOperations: source.internalLendingOperations === true,
    requestCenterAccess: source.requestCenterAccess === true,
  };
}

function reviewProgressDto(application) {
  const administrator = { completed: Boolean(application.administratorReviewedAt) };
  const director = { completed: Boolean(application.directorReviewedAt) };
  if (administrator.completed) administrator.reviewedAt = application.administratorReviewedAt;
  if (director.completed) director.reviewedAt = application.directorReviewedAt;
  return { administrator, director };
}

function reviewHistoryDto(entries) {
  if (!Array.isArray(entries)) return [];
  return entries.slice(0, 100).map((entry) => ({
    fromState: safeReviewText(entry.fromState, { max: 64 }),
    toState: safeReviewText(entry.toState, { max: 64 }),
    reason: safeReviewText(entry.reason, { max: 500 }),
    resultingRevision: Number.isSafeInteger(entry.resultingRevision) ? entry.resultingRevision : null,
    createdAt: safeReviewText(entry.createdAt, { max: 64 }),
  }));
}

export function redactedReviewApplicationListDto(application) {
  if (!application) return null;
  const requestedAccess = redactedRequestedAccessDto(application.requestedAccess);
  return {
    id: safeReviewText(application.id, { max: 128 }),
    applicationCode: safeReviewText(application.applicationCode, { max: 128 }),
    state: application.state,
    revision: Number(application.revision),
    departmentId: safeReviewText(application.departmentId, { max: 128 }),
    courseId: safeReviewText(application.courseId, { max: 128 }),
    yearLevel: Number.isSafeInteger(application.yearLevel) ? application.yearLevel : null,
    requestedAccountType: requestedAccess.requestedAccountType,
    requestedRoleId: requestedAccess.requestedRoleId,
    submittedAt: application.createdAt,
    updatedAt: application.updatedAt,
    expiresAt: application.expiresAt,
  };
}

export function redactedReviewApplicationDetailDto(application) {
  const summary = redactedReviewApplicationListDto(application);
  if (!summary) return null;
  const dto = {
    ...summary,
    requestedUsername: safeReviewText(application.requestedUsernameNormalized, { max: 64 }),
    requestedAccess: redactedRequestedAccessDto(application.requestedAccess),
    review: reviewProgressDto(application),
    history: reviewHistoryDto(application.history),
    verifiedEmail: safeReviewText(application.verifiedEmail, { max: 254 }),
    legalName: safeReviewText(application.legalName, { max: 200 }),
    contactNumber: safeReviewText(application.contactNumber, { max: 64 }),
    identityVerification: {
      rosterMatched: application.identityVerification?.rosterMatched === true,
      legalNameMatched: application.identityVerification?.legalNameMatched === true,
    },
  };
  if (application.accountCode) dto.accountCode = safeReviewText(application.accountCode, { max: 128 });
  return dto;
}
