import { ROLES } from '../../domain/constants.js';
import { USC_DEPARTMENT_REGISTRY, uscDepartmentById } from '../../domain/usc-departments.js';
import { ACCOUNT_STATUS, normalizeAccessId, validateStarterAssignment } from '../auth/contracts.js';
import { ACCESS_PRESETS, ACCESS_WORKSPACES, accountAccessPolicy, normalizeAccessPolicy } from './policy.js';

const SAFE_MESSAGES = Object.freeze({
  ACCESS_ACCOUNT_NOT_FOUND: 'The selected account is no longer available.',
  ACCESS_CONFIRMATION_REQUIRED: 'Confirm the selected account and the requested action.',
  ACCESS_ID_COLLISION: 'The proposed Access ID conflicts with an existing or reserved Access ID.',
  ACCESS_ID_INVALID: 'Use 4–64 letters, numbers, periods, underscores, or hyphens.',
  ACCESS_ID_UNCHANGED: 'Enter a different Access ID.',
  ACCESS_IDEMPOTENCY_REQUIRED: 'A safe retry key is required.',
  ACCESS_IDEMPOTENCY_CONFLICT: 'The retry key was already used for another account action.',
  ACCESS_REASON_REQUIRED: 'A reason is required for this account change.',
  ACCESS_PRESET_INVALID: 'The selected access preset is not supported.',
  ACCESS_ROLE_INVALID: 'The selected role cannot be assigned through Access Management.',
  CAPABILITY_OVERRIDE_CONFLICT: 'A capability cannot be both granted and denied.',
  CAPABILITY_OVERRIDE_INVALID: 'One or more selected capability overrides are unavailable.',
  DEFAULT_COMMITTEE_OUT_OF_SCOPE: 'The primary committee must be in the assigned committee scopes.',
  DEFAULT_WORKSPACE_OUT_OF_SCOPE: 'The default workspace must be in the authorized workspace set.',
  GOVERNED_SCOPE_INVALID: 'One or more selected governed scopes are unavailable.',
  OWNER_APPROVAL_REQUIRED: 'A System Owner must approve this sensitive access assignment.',
  WORKSPACE_ASSIGNMENT_INVALID: 'The selected workspace assignment is invalid for this role.',
  ACCESS_WRITE_CONFLICT: 'The account changed before this request completed. Refresh and try again.',
  ACCOUNT_STATUS_INVALID: 'The requested account status is not supported.',
  ADMINISTRATOR_REQUIRED: 'Administrator access is required.',
  DEPARTMENT_ACCOUNT_SEED_CONFLICT:
    'Department accounts are partially initialized or conflict with governed identifiers.',
  DEPARTMENT_REGISTRY_INVALID: 'The governed department registry is unavailable or inconsistent.',
  LAST_ACTIVE_ADMIN_PROTECTED: 'The last active Administrator cannot be disabled or reset.',
  SELF_ACCESS_CHANGE_BLOCKED: 'You cannot disable or reset your own account.',
  SYSTEM_ACCOUNT_PROTECTED: 'System-managed accounts cannot be changed through Access Management.',
  STARTER_ASSIGNMENT_INVALID: 'The starter account role or committee assignment is invalid.',
  TEMPORARY_PASSWORD_INVALID: 'The temporary password does not meet the password policy.',
});

const DIRECTORY_SORTS = new Set(['accessId', 'department', 'role', 'status', 'lastLogin']);
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

const stableValue = (value) => {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === 'object') {
    return Object.keys(value)
      .sort()
      .reduce((result, key) => {
        result[key] = stableValue(value[key]);
        return result;
      }, {});
  }
  return value;
};

async function requestFingerprint(value) {
  const digest = await globalThis.crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(JSON.stringify(stableValue(value))),
  );
  let binary = '';
  for (const byte of new Uint8Array(digest)) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/u, '');
}

function assertAdministrator(actor) {
  if (
    ![ROLES.ADMINISTRATOR, ROLES.SYSTEM_OWNER].includes(actor?.roleId) ||
    actor?.status !== ACCOUNT_STATUS.ACTIVE
  ) {
    fail('ADMINISTRATOR_REQUIRED', 403);
  }
  return actor;
}

function secureTemporaryPassword() {
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(24));
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  const random = btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/u, '');
  return `Hau!9${random}`;
}

function safeAccount(account) {
  return {
    accessId: account.accessIdNormalized,
    displayName: account.profile?.fullName || account.accessIdNormalized,
    roleId: account.roleId,
    committeeIds: account.committeeIds ?? [],
    defaultCommitteeId: account.defaultCommitteeId ?? '',
    accessProfile: accountAccessPolicy(account),
    status: account.status,
    firstLoginPending: account.status === ACCOUNT_STATUS.STARTER || !account.onboardingCompletedAt,
    locked: Boolean(account.lockedAt),
    createdAt: account.createdAt,
    lastSuccessfulLogin: account.lastSuccessfulLogin ?? '',
    lastAccessIdChange: account.lastAccessIdChangedAt ?? '',
    passwordChangedAt: account.passwordChangedAt ?? '',
    lastPasswordResetAt: account.lastPasswordResetAt ?? '',
    departmentId: account.departmentId ?? '',
    departmentDisplayName: account.departmentDisplayName ?? '',
    lendingEligible: account.lendingEligible === true,
  };
}

function oneTimeCredential(account, temporaryPassword, generatedAt) {
  return {
    departmentId: account.departmentId ?? '',
    department: account.departmentDisplayName ?? '',
    accessId: account.accessIdNormalized,
    temporaryPassword,
    generatedAt,
    status: account.status,
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
  createTemporaryPassword = secureTemporaryPassword,
} = {}) {
  if (!repository || !passwordKdf) {
    throw new Error('Access-management repository and password KDF are required.');
  }

  const nowIso = () => new Date(clock.now()).toISOString();

  async function mutationReplay(scope, actor, command) {
    const key = requiredIdempotencyKey(command.clientRequestId);
    const fingerprint = await requestFingerprint(command);
    const prior = await repository.getIdempotency(scope, key);
    if (prior) {
      if (prior.actorAccountId !== actor.id || prior.requestFingerprint !== fingerprint) {
        fail('ACCESS_IDEMPOTENCY_CONFLICT', 409);
      }
      return { replayed: true, result: prior.result, key, fingerprint };
    }
    return { replayed: false, key, fingerprint };
  }

  async function accountByAccessId(value) {
    const accessId = normalizeAccessId(value);
    const account = accessId ? await repository.getAccountByAccessId(accessId) : null;
    if (!account) fail('ACCESS_ACCOUNT_NOT_FOUND', 404);
    if (String(account.id).startsWith('SYSTEM-') || account.roleId === ROLES.SYSTEM_OWNER) {
      fail('SYSTEM_ACCOUNT_PROTECTED', 403);
    }
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
    async getAccessPolicyOptions({ actor } = {}) {
      assertAdministrator(actor);
      const reference = await repository.listAccessPolicyReferences();
      return {
        workspaces: ACCESS_WORKSPACES,
        presets: ACCESS_PRESETS,
        ...reference,
      };
    },

    async previewAccessPolicy({ actor, command = {} } = {}) {
      assertAdministrator(actor);
      const account = await accountByAccessId(command.currentAccessId);
      if (normalizeAccessId(command.confirmCurrentAccessId) !== account.accessIdNormalized) {
        fail('ACCESS_CONFIRMATION_REQUIRED');
      }
      const reference = await repository.listAccessPolicyReferences();
      const normalized = normalizeAccessPolicy(command, {
        actorRoleId: actor.roleId,
        reference,
        existingAccount: account,
      });
      if (!normalized.valid) fail(normalized.code, normalized.code === 'OWNER_APPROVAL_REQUIRED' ? 403 : 422);
      return {
        account: safeAccount(account),
        proposedAccount: safeAccount(normalized.account),
        ...normalized.preview,
      };
    },

    async updateAccessPolicy({ actor, command = {}, correlationId = '' } = {}) {
      assertAdministrator(actor);
      const idempotencyKey = requiredIdempotencyKey(command.idempotencyKey);
      const existing = await repository.getAccessPolicyChangeByIdempotency(idempotencyKey);
      if (existing)
        return {
          changed: true,
          replayed: true,
          sessionsRevoked: true,
          preview: existing.after,
          correlationId: existing.correlationId,
        };
      const account = await accountByAccessId(command.currentAccessId);
      if (normalizeAccessId(command.confirmCurrentAccessId) !== account.accessIdNormalized) {
        fail('ACCESS_CONFIRMATION_REQUIRED');
      }
      const reason = requiredReason(command.reason);
      const reference = await repository.listAccessPolicyReferences();
      const normalized = normalizeAccessPolicy(command, {
        actorRoleId: actor.roleId,
        reference,
        existingAccount: account,
      });
      if (!normalized.valid) fail(normalized.code, normalized.code === 'OWNER_APPROVAL_REQUIRED' ? 403 : 422);
      if (account.roleId === ROLES.ADMINISTRATOR && normalized.account.roleId !== ROLES.ADMINISTRATOR) {
        await protectAdministrator(actor, account);
      }
      const changedAt = nowIso();
      await repository.updateAccessPolicy({
        account,
        nextAccount: normalized.account,
        actor,
        changedAt,
        reason,
        correlationId: String(correlationId || `ACCESS_${createId()}`),
        idempotencyKey,
        changeId: createId(),
        auditId: createId(),
      });
      return { changed: true, replayed: false, sessionsRevoked: true, preview: normalized.preview };
    },

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
        return {
          changed: true,
          replayed: true,
          accessId: existing.newAccessId,
          sessionsRevoked: true,
          correlationId: existing.correlationId,
        };
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
      const requestedAccessId =
        command.generateAccessId === true
          ? await repository.nextGeneratedAccessId(new Date(clock.now()).getUTCFullYear())
          : command.accessId;
      const available = await ensureAvailableAccessId(requestedAccessId);
      const assignment = validateStarterAssignment(command);
      if (!assignment.valid) fail('STARTER_ASSIGNMENT_INVALID');
      const lendingEligible = command.lendingEligible === true;
      const institutionId = String(command.institutionId ?? '').trim();
      const department = command.departmentId ? uscDepartmentById(command.departmentId) : null;
      if (assignment.roleId !== ROLES.REQUESTER && (lendingEligible || institutionId)) {
        fail('STARTER_ASSIGNMENT_INVALID');
      }
      if (command.departmentId && (!department || assignment.roleId !== ROLES.REQUESTER)) {
        fail('STARTER_ASSIGNMENT_INVALID');
      }
      if (lendingEligible && !/^\d{1,8}$/u.test(institutionId)) fail('STARTER_ASSIGNMENT_INVALID');
      const temporaryPassword = createTemporaryPassword();
      const initialStatus =
        String(command.status ?? ACCOUNT_STATUS.STARTER).toUpperCase() === ACCOUNT_STATUS.DISABLED
          ? ACCOUNT_STATUS.DISABLED
          : ACCOUNT_STATUS.STARTER;
      const temporaryPasswordHours = Math.min(
        168,
        Math.max(1, Math.floor(Number(command.temporaryPasswordHours) || 72)),
      );
      let credential;
      try {
        credential = await passwordKdf.hash(temporaryPassword);
      } catch {
        fail('TEMPORARY_PASSWORD_INVALID');
      }
      const createdAt = nowIso();
      const account = {
        id: createId(),
        accessIdNormalized: available.normalized,
        status: initialStatus,
        roleId: assignment.roleId,
        committeeIds: assignment.committeeIds,
        defaultCommitteeId: assignment.defaultCommitteeId,
        profile: null,
        passwordCredential: null,
        temporaryCredential: {
          ...credential,
          expiresAt: new Date(clock.now() + temporaryPasswordHours * 60 * 60 * 1000).toISOString(),
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
        departmentId: department?.id ?? '',
        departmentDisplayName: department?.displayName ?? '',
        passwordChangedAt: null,
        lastPasswordResetAt: null,
      };
      const reference = await repository.listAccessPolicyReferences();
      const normalizedPolicy = normalizeAccessPolicy(command, {
        actorRoleId: actor.roleId,
        reference,
        existingAccount: account,
      });
      if (!normalizedPolicy.valid) {
        fail(normalizedPolicy.code, normalizedPolicy.code === 'OWNER_APPROVAL_REQUIRED' ? 403 : 422);
      }
      account.roleId = normalizedPolicy.account.roleId;
      account.committeeIds = normalizedPolicy.account.committeeIds;
      account.defaultCommitteeId = normalizedPolicy.account.defaultCommitteeId;
      account.accessProfile = normalizedPolicy.account.accessProfile;
      await repository.createStarterAccount({
        account,
        actor,
        collisionKey: available.collisionKey,
        reason,
        correlationId: String(correlationId || `ACCESS_${createId()}`),
        auditId: createId(),
      });
      return {
        created: true,
        account: safeAccount(account),
        credential: oneTimeCredential(account, temporaryPassword, createdAt),
      };
    },

    async seedDepartmentAccounts({ actor, command = {}, correlationId = '' } = {}) {
      assertAdministrator(actor);
      const reason = requiredReason(command.reason);
      if (command.confirmed !== true) fail('ACCESS_CONFIRMATION_REQUIRED');
      const registry = await repository.listRequesterDepartments();
      const registryMatches =
        registry.length === USC_DEPARTMENT_REGISTRY.length &&
        USC_DEPARTMENT_REGISTRY.every((expected) => {
          const actual = registry.find((entry) => entry.id === expected.id);
          return (
            actual?.code === expected.code &&
            actual?.displayName === expected.displayName &&
            actual?.recommendedAccessId === expected.recommendedAccessId &&
            actual?.active === true
          );
        });
      if (!registryMatches) fail('DEPARTMENT_REGISTRY_INVALID', 409);

      const states = await repository.listDepartmentAccountStates();
      const existing = states.filter((state) => state.accountId);
      if (existing.length === USC_DEPARTMENT_REGISTRY.length) {
        const complete = USC_DEPARTMENT_REGISTRY.every((expected) => {
          const state = states.find((entry) => entry.departmentId === expected.id);
          return (
            state?.accountId === expected.accountId &&
            state?.accessId === expected.recommendedAccessId &&
            state?.roleId === ROLES.REQUESTER
          );
        });
        if (!complete) fail('DEPARTMENT_ACCOUNT_SEED_CONFLICT', 409);
        return { seeded: false, accounts: existing.length, credentials: [] };
      }
      if (existing.length) fail('DEPARTMENT_ACCOUNT_SEED_CONFLICT', 409);

      for (const department of USC_DEPARTMENT_REGISTRY) {
        await ensureAvailableAccessId(department.recommendedAccessId);
      }

      const createdAt = nowIso();
      const accounts = [];
      const credentials = [];
      for (const department of USC_DEPARTMENT_REGISTRY) {
        const temporaryPassword = createTemporaryPassword();
        let temporaryCredential;
        try {
          temporaryCredential = await passwordKdf.hash(temporaryPassword);
        } catch {
          fail('TEMPORARY_PASSWORD_INVALID');
        }
        const account = {
          id: department.accountId,
          accessIdNormalized: department.recommendedAccessId,
          status: ACCOUNT_STATUS.STARTER,
          roleId: ROLES.REQUESTER,
          committeeIds: [],
          defaultCommitteeId: '',
          profile: null,
          passwordCredential: null,
          temporaryCredential: {
            ...temporaryCredential,
            expiresAt: new Date(clock.now() + 72 * 60 * 60 * 1000).toISOString(),
            consumedAt: null,
          },
          credentialVersion: 1,
          onboardingCompletedAt: null,
          createdAt,
          updatedAt: createdAt,
          lockedAt: null,
          lastAccessIdChangedAt: null,
          lendingEligible: false,
          institutionId: '',
          departmentId: department.id,
          departmentDisplayName: department.displayName,
          passwordChangedAt: null,
          lastPasswordResetAt: null,
        };
        accounts.push(account);
        credentials.push(oneTimeCredential(account, temporaryPassword, createdAt));
      }

      await repository.seedDepartmentAccounts({
        accounts,
        actor,
        reason,
        correlationId: String(correlationId || `ACCESS_${createId()}`),
        auditIds: accounts.map(() => createId()),
      });
      return { seeded: true, accounts: accounts.length, credentials };
    },

    async resetTemporaryPassword({ actor, command = {}, correlationId = '' } = {}) {
      assertAdministrator(actor);
      const replay = await mutationReplay('access-reset-temporary-password', actor, command);
      if (replay.replayed) return { ...replay.result, replayed: true };
      const account = await accountByAccessId(command.currentAccessId);
      await protectAdministrator(actor, account);
      const reason = requiredReason(command.reason);
      if (normalizeAccessId(command.confirmCurrentAccessId) !== account.accessIdNormalized) {
        fail('ACCESS_CONFIRMATION_REQUIRED');
      }
      const temporaryPassword = createTemporaryPassword();
      let credential;
      try {
        credential = await passwordKdf.hash(temporaryPassword);
      } catch {
        fail('TEMPORARY_PASSWORD_INVALID');
      }
      const resetAt = nowIso();
      const mutationCorrelationId = String(correlationId || `ACCESS_${createId()}`);
      const replayResult = {
        reset: true,
        status: ACCOUNT_STATUS.STARTER,
        sessionsRevoked: true,
        credentialUnavailable: true,
        correlationId: mutationCorrelationId,
      };
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
        correlationId: mutationCorrelationId,
        auditId: createId(),
        idempotency: {
          scope: 'access-reset-temporary-password',
          key: replay.key,
          actorAccountId: actor.id,
          requestFingerprint: replay.fingerprint,
          result: replayResult,
          createdAt: resetAt,
        },
      });
      const resetAccount = {
        ...account,
        status: ACCOUNT_STATUS.STARTER,
        lastPasswordResetAt: resetAt,
      };
      return {
        reset: true,
        status: ACCOUNT_STATUS.STARTER,
        sessionsRevoked: true,
        replayed: false,
        correlationId: mutationCorrelationId,
        credential: oneTimeCredential(resetAccount, temporaryPassword, resetAt),
      };
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
      const lifecycleAction = String(command.lifecycleAction ?? '').toUpperCase();
      if (lifecycleAction && !(nextStatus === ACCOUNT_STATUS.REVOKED && lifecycleAction === 'ARCHIVE')) {
        fail('ACCOUNT_STATUS_INVALID');
      }
      if (nextStatus !== ACCOUNT_STATUS.ACTIVE) await protectAdministrator(actor, account);
      const restoredStatus =
        nextStatus === ACCOUNT_STATUS.ACTIVE &&
        (!account.passwordCredential || !account.onboardingCompletedAt) &&
        account.temporaryCredential
          ? ACCOUNT_STATUS.STARTER
          : nextStatus;
      if (
        restoredStatus === ACCOUNT_STATUS.ACTIVE &&
        (!account.passwordCredential || !account.onboardingCompletedAt)
      ) {
        fail('ACCOUNT_STATUS_INVALID');
      }
      if (restoredStatus === account.status)
        return { changed: false, status: restoredStatus, sessionsRevoked: false };
      await repository.setAccountStatus({
        account,
        actor,
        nextStatus: restoredStatus,
        changedAt: nowIso(),
        reason,
        auditAction: lifecycleAction === 'ARCHIVE' ? 'ACCOUNT_ARCHIVED' : 'ACCOUNT_STATUS_CHANGED',
        correlationId: String(correlationId || `ACCESS_${createId()}`),
        auditId: createId(),
      });
      return {
        changed: true,
        status: restoredStatus,
        archived: lifecycleAction === 'ARCHIVE',
        sessionsRevoked: true,
      };
    },

    async revokeSessions({ actor, command = {}, correlationId = '' } = {}) {
      assertAdministrator(actor);
      const replay = await mutationReplay('access-revoke-sessions', actor, command);
      if (replay.replayed) return { ...replay.result, replayed: true };
      const account = await accountByAccessId(command.currentAccessId);
      if (normalizeAccessId(command.confirmCurrentAccessId) !== account.accessIdNormalized) {
        fail('ACCESS_CONFIRMATION_REQUIRED');
      }
      const reason = requiredReason(command.reason);
      const changedAt = nowIso();
      const mutationCorrelationId = String(correlationId || `ACCESS_${createId()}`);
      const replayResult = { revoked: true, correlationId: mutationCorrelationId };
      await repository.revokeSessions({
        account,
        actor,
        changedAt,
        reason,
        correlationId: mutationCorrelationId,
        auditId: createId(),
        idempotency: {
          scope: 'access-revoke-sessions',
          key: replay.key,
          actorAccountId: actor.id,
          requestFingerprint: replay.fingerprint,
          result: replayResult,
          createdAt: changedAt,
        },
      });
      return { ...replayResult, replayed: false };
    },

    async unlockAccount({ actor, command = {}, correlationId = '' } = {}) {
      assertAdministrator(actor);
      const replay = await mutationReplay('access-unlock-account', actor, command);
      if (replay.replayed) return { ...replay.result, replayed: true };
      const account = await accountByAccessId(command.currentAccessId);
      if (normalizeAccessId(command.confirmCurrentAccessId) !== account.accessIdNormalized) {
        fail('ACCESS_CONFIRMATION_REQUIRED');
      }
      const reason = requiredReason(command.reason);
      const changedAt = nowIso();
      const mutationCorrelationId = String(correlationId || `ACCESS_${createId()}`);
      const replayResult = { unlocked: true, correlationId: mutationCorrelationId };
      await repository.unlockAccount({
        account,
        actor,
        changedAt,
        reason,
        correlationId: mutationCorrelationId,
        auditId: createId(),
        idempotency: {
          scope: 'access-unlock-account',
          key: replay.key,
          actorAccountId: actor.id,
          requestFingerprint: replay.fingerprint,
          result: replayResult,
          createdAt: changedAt,
        },
      });
      return { ...replayResult, replayed: false };
    },
  });
}
