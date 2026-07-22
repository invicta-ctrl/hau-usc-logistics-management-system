import { ROLES } from '../../domain/constants.js';
import { ACCOUNT_STATUS, normalizeAccessId, validateStarterAssignment } from '../auth/contracts.js';

const SAFE_MESSAGES = Object.freeze({
  ACCESS_ACCOUNT_NOT_FOUND: 'The selected account is no longer available.',
  ACCESS_CONFIRMATION_REQUIRED: 'Confirm the selected account and the requested action.',
  ACCESS_ID_COLLISION: 'The proposed Access ID conflicts with an existing or reserved Access ID.',
  ACCESS_ID_INVALID: 'Use 4–64 letters, numbers, periods, underscores, or hyphens.',
  ACCESS_ID_UNCHANGED: 'Enter a different Access ID.',
  ACCESS_IDEMPOTENCY_REQUIRED: 'A safe retry key is required.',
  ACCESS_REASON_REQUIRED: 'A reason is required for this account change.',
  ACCESS_WRITE_CONFLICT: 'The account changed before this request completed. Refresh and try again.',
  ACCOUNT_STATUS_INVALID: 'The requested account status is not supported.',
  ADMINISTRATOR_REQUIRED: 'Administrator access is required.',
  LAST_ACTIVE_ADMIN_PROTECTED: 'The last active Administrator cannot be disabled or reset.',
  SELF_ACCESS_CHANGE_BLOCKED: 'You cannot disable or reset your own account.',
  STARTER_ASSIGNMENT_INVALID: 'The starter account role or committee assignment is invalid.',
  TEMPORARY_PASSWORD_INVALID: 'The temporary password does not meet the password policy.',
});

const DIRECTORY_SORTS = new Set(['accessId', 'role', 'status', 'lastLogin']);
const DIRECTORY_DIRECTIONS = new Set(['asc', 'desc']);
const DIRECTORY_STATUSES = new Set([
  'ALL',
  ACCOUNT_STATUS.ACTIVE,
  ACCOUNT_STATUS.DISABLED,
  ACCOUNT_STATUS.REVOKED,
  'LOCKED',
  'PENDING_FIRST_LOGIN',
]);

export class AccessManagementError extends Error {
  constructor(code, { status = 422 } = {}) {
    super(SAFE_MESSAGES[code] ?? 'The account-management request could not be completed.');
    this.name = 'AccessManagementError';
    this.code = code;
    this.status = status;
  }
}

function fail(code, status) {
  throw new AccessManagementError(code, { status });
}

function requiredReason(value) {
  const reason = String(value ?? '').trim();
  if (reason.length < 8 || reason.length > 500) fail('ACCESS_REASON_REQUIRED');
  return reason;
}

function requiredIdempotencyKey(value) {
  const key = String(value ?? '').trim();
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{15,127}$/u.test(key)) fail('ACCESS_IDEMPOTENCY_REQUIRED');
  return key;
}

function assertAdministrator(actor) {
  if (actor?.roleId !== ROLES.ADMINISTRATOR || actor?.status !== ACCOUNT_STATUS.ACTIVE) {
    fail('ADMINISTRATOR_REQUIRED', 403);
  }
  return actor;
}

function safeAccount(account) {
  return {
    accessId: account.accessIdNormalized,
    displayName: account.profile?.fullName || account.accessIdNormalized,
    roleId: account.roleId,
    committeeIds: account.committeeIds ?? [],
    status: account.status,
    firstLoginPending: account.status === ACCOUNT_STATUS.STARTER || !account.onboardingCompletedAt,
    locked: Boolean(account.lockedAt),
    createdAt: account.createdAt,
    lastSuccessfulLogin: account.lastSuccessfulLogin ?? '',
    lastAccessIdChange: account.lastAccessIdChangedAt ?? '',
    lendingEligible: account.lendingEligible === true,
  };
}

export function accessIdCollisionKey(value) {
  const normalized = normalizeAccessId(value);
  return normalized ? normalized.replace(/[._-]/gu, '') : '';
}

export function createAccessManagementService({
  repository,
  passwordKdf,
  environment = 'DEVELOPMENT',
  clock = Date,
  createId = () => globalThis.crypto.randomUUID(),
} = {}) {
  if (!repository || !passwordKdf) {
    throw new Error('Access-management repository and password KDF are required.');
  }

  const nowIso = () => new Date(clock.now()).toISOString();

  async function accountByAccessId(value) {
    const accessId = normalizeAccessId(value);
    const account = accessId ? await repository.getAccountByAccessId(accessId) : null;
    if (!account) fail('ACCESS_ACCOUNT_NOT_FOUND', 404);
    return account;
  }

  async function ensureAvailableAccessId(proposedAccessId) {
    const normalized = normalizeAccessId(proposedAccessId);
    if (!normalized) fail('ACCESS_ID_INVALID');
    const collisionKey = accessIdCollisionKey(normalized);
    const [reservation, current] = await Promise.all([
      repository.getAccessIdReservation(collisionKey),
      repository.getAccountByAccessId(normalized),
    ]);
    if (reservation || current) fail('ACCESS_ID_COLLISION', 409);
    return { normalized, collisionKey };
  }

  async function protectAdministrator(actor, target) {
    if (actor.id === target.id) fail('SELF_ACCESS_CHANGE_BLOCKED', 409);
    if (
      target.roleId === ROLES.ADMINISTRATOR &&
      target.status === ACCOUNT_STATUS.ACTIVE &&
      (await repository.countActiveAdministrators()) <= 1
    ) {
      fail('LAST_ACTIVE_ADMIN_PROTECTED', 409);
    }
  }

  async function previewAccessIdChange({ actor, command = {} } = {}) {
    assertAdministrator(actor);
    const account = await accountByAccessId(command.currentAccessId);
    if (normalizeAccessId(command.confirmCurrentAccessId) !== account.accessIdNormalized) {
      fail('ACCESS_CONFIRMATION_REQUIRED');
    }
    const proposed = normalizeAccessId(command.proposedAccessId);
    if (!proposed) fail('ACCESS_ID_INVALID');
    if (proposed === account.accessIdNormalized) fail('ACCESS_ID_UNCHANGED', 409);
    const available = await ensureAvailableAccessId(proposed);
    return {
      account: safeAccount(account),
      proposedAccessId: available.normalized,
      normalizationPreview: available.normalized,
      immutableAccountIdPreserved: true,
      roleAndCapabilitiesUnchanged: true,
      sessionImpact: 'ALL_ACTIVE_SESSIONS_REVOKED',
      previousAccessIdRetention: 'RESERVED_APPEND_ONLY',
    };
  }

  return Object.freeze({
    async listAccounts({ actor, command = {} } = {}) {
      assertAdministrator(actor);
      const status = String(command.status ?? 'ALL').toUpperCase();
      const sort = String(command.sort ?? 'accessId');
      const direction = String(command.direction ?? 'asc').toLowerCase();
      return repository.listAccounts({
        query: String(command.query ?? '')
          .trim()
          .slice(0, 120),
        role: String(command.role ?? '')
          .trim()
          .toUpperCase(),
        committee: String(command.committee ?? '')
          .trim()
          .toUpperCase(),
        status: DIRECTORY_STATUSES.has(status) ? status : 'ALL',
        sort: DIRECTORY_SORTS.has(sort) ? sort : 'accessId',
        direction: DIRECTORY_DIRECTIONS.has(direction) ? direction : 'asc',
        page: Math.max(1, Math.floor(Number(command.page) || 1)),
        pageSize: Math.min(50, Math.max(5, Math.floor(Number(command.pageSize) || 20))),
      });
    },

    async getAccessIdHistory({ actor, currentAccessId, limit = 50 } = {}) {
      assertAdministrator(actor);
      const account = await accountByAccessId(currentAccessId);
      const safeLimit = Math.min(100, Math.max(1, Number(limit) || 50));
      const [history, auditHistory] = await Promise.all([
        repository.listAccessIdHistory(account.id, safeLimit),
        repository.listAccountAuditHistory(account.id, safeLimit),
      ]);
      return {
        account: safeAccount(account),
        history,
        auditHistory,
      };
    },

    previewAccessIdChange,

    async changeAccessId({ actor, command = {}, correlationId = '' } = {}) {
      assertAdministrator(actor);
      const idempotencyKey = requiredIdempotencyKey(command.idempotencyKey);
      const proposed = normalizeAccessId(command.proposedAccessId);
      const existing = await repository.getAccessIdHistoryByIdempotency(idempotencyKey);
      if (existing) {
        if (
          existing.oldAccessId !== normalizeAccessId(command.currentAccessId) ||
          existing.newAccessId !== proposed
        ) {
          fail('ACCESS_WRITE_CONFLICT', 409);
        }
        return { changed: true, replayed: true, accessId: existing.newAccessId, sessionsRevoked: true };
      }
      const reason = requiredReason(command.reason);
      const preview = await previewAccessIdChange({ actor, command });
      const account = await accountByAccessId(command.currentAccessId);
      const changedAt = nowIso();
      try {
        await repository.changeAccessId({
          account,
          actor,
          newAccessId: preview.proposedAccessId,
          collisionKey: accessIdCollisionKey(preview.proposedAccessId),
          changedAt,
          reason,
          correlationId: String(correlationId || `ACCESS_${createId()}`),
          environment: String(environment).toUpperCase(),
          idempotencyKey,
          historyId: createId(),
          auditId: createId(),
        });
      } catch (error) {
        if (/UNIQUE|CONSTRAINT|conflict/iu.test(String(error?.message ?? error))) {
          fail('ACCESS_WRITE_CONFLICT', 409);
        }
        throw error;
      }
      return { changed: true, replayed: false, accessId: preview.proposedAccessId, sessionsRevoked: true };
    },

    async createStarterAccount({ actor, command = {}, correlationId = '' } = {}) {
      assertAdministrator(actor);
      const reason = requiredReason(command.reason);
      if (command.confirmed !== true) fail('ACCESS_CONFIRMATION_REQUIRED');
      const available = await ensureAvailableAccessId(command.accessId);
      const assignment = validateStarterAssignment(command);
      if (!assignment.valid) fail('STARTER_ASSIGNMENT_INVALID');
      const lendingEligible = command.lendingEligible === true;
      const institutionId = String(command.institutionId ?? '').trim();
      if (assignment.roleId !== ROLES.REQUESTER && (lendingEligible || institutionId)) {
        fail('STARTER_ASSIGNMENT_INVALID');
      }
      if (lendingEligible && !/^\d{1,8}$/u.test(institutionId)) fail('STARTER_ASSIGNMENT_INVALID');
      let credential;
      try {
        credential = await passwordKdf.hash(command.temporaryPassword);
      } catch {
        fail('TEMPORARY_PASSWORD_INVALID');
      }
      const createdAt = nowIso();
      const account = {
        id: createId(),
        accessIdNormalized: available.normalized,
        status: ACCOUNT_STATUS.STARTER,
        roleId: assignment.roleId,
        committeeIds: assignment.committeeIds,
        defaultCommitteeId: assignment.defaultCommitteeId,
        profile: null,
        passwordCredential: null,
        temporaryCredential: {
          ...credential,
          expiresAt: new Date(clock.now() + 72 * 60 * 60 * 1000).toISOString(),
          consumedAt: null,
        },
        credentialVersion: 1,
        onboardingCompletedAt: null,
        createdAt,
        updatedAt: createdAt,
        lockedAt: null,
        lastAccessIdChangedAt: null,
        lendingEligible,
        institutionId,
      };
      await repository.createStarterAccount({
        account,
        actor,
        collisionKey: available.collisionKey,
        reason,
        correlationId: String(correlationId || `ACCESS_${createId()}`),
        auditId: createId(),
      });
      return { created: true, account: safeAccount(account) };
    },

    async resetTemporaryPassword({ actor, command = {}, correlationId = '' } = {}) {
      assertAdministrator(actor);
      const account = await accountByAccessId(command.currentAccessId);
      await protectAdministrator(actor, account);
      const reason = requiredReason(command.reason);
      if (normalizeAccessId(command.confirmCurrentAccessId) !== account.accessIdNormalized) {
        fail('ACCESS_CONFIRMATION_REQUIRED');
      }
      let credential;
      try {
        credential = await passwordKdf.hash(command.temporaryPassword);
      } catch {
        fail('TEMPORARY_PASSWORD_INVALID');
      }
      const resetAt = nowIso();
      await repository.resetTemporaryPassword({
        account,
        actor,
        temporaryCredential: {
          ...credential,
          expiresAt: new Date(clock.now() + 72 * 60 * 60 * 1000).toISOString(),
          consumedAt: null,
        },
        resetAt,
        reason,
        correlationId: String(correlationId || `ACCESS_${createId()}`),
        auditId: createId(),
      });
      return { reset: true, status: ACCOUNT_STATUS.STARTER, sessionsRevoked: true };
    },

    async setAccountStatus({ actor, command = {}, correlationId = '' } = {}) {
      assertAdministrator(actor);
      const account = await accountByAccessId(command.currentAccessId);
      const nextStatus = String(command.status ?? '').toUpperCase();
      if (![ACCOUNT_STATUS.ACTIVE, ACCOUNT_STATUS.DISABLED, ACCOUNT_STATUS.REVOKED].includes(nextStatus)) {
        fail('ACCOUNT_STATUS_INVALID');
      }
      if (normalizeAccessId(command.confirmCurrentAccessId) !== account.accessIdNormalized) {
        fail('ACCESS_CONFIRMATION_REQUIRED');
      }
      const reason = requiredReason(command.reason);
      if (nextStatus !== ACCOUNT_STATUS.ACTIVE) await protectAdministrator(actor, account);
      if (
        nextStatus === ACCOUNT_STATUS.ACTIVE &&
        (!account.passwordCredential || !account.onboardingCompletedAt)
      ) {
        fail('ACCOUNT_STATUS_INVALID');
      }
      if (nextStatus === account.status)
        return { changed: false, status: nextStatus, sessionsRevoked: false };
      await repository.setAccountStatus({
        account,
        actor,
        nextStatus,
        changedAt: nowIso(),
        reason,
        correlationId: String(correlationId || `ACCESS_${createId()}`),
        auditId: createId(),
      });
      return { changed: true, status: nextStatus, sessionsRevoked: true };
    },

    async revokeSessions({ actor, command = {}, correlationId = '' } = {}) {
      assertAdministrator(actor);
      const account = await accountByAccessId(command.currentAccessId);
      if (normalizeAccessId(command.confirmCurrentAccessId) !== account.accessIdNormalized) {
        fail('ACCESS_CONFIRMATION_REQUIRED');
      }
      const reason = requiredReason(command.reason);
      await repository.revokeSessions({
        account,
        actor,
        changedAt: nowIso(),
        reason,
        correlationId: String(correlationId || `ACCESS_${createId()}`),
        auditId: createId(),
      });
      return { revoked: true };
    },

    async unlockAccount({ actor, command = {}, correlationId = '' } = {}) {
      assertAdministrator(actor);
      const account = await accountByAccessId(command.currentAccessId);
      if (normalizeAccessId(command.confirmCurrentAccessId) !== account.accessIdNormalized) {
        fail('ACCESS_CONFIRMATION_REQUIRED');
      }
      const reason = requiredReason(command.reason);
      await repository.unlockAccount({
        account,
        actor,
        changedAt: nowIso(),
        reason,
        correlationId: String(correlationId || `ACCESS_${createId()}`),
        auditId: createId(),
      });
      return { unlocked: true };
    },
  });
}
