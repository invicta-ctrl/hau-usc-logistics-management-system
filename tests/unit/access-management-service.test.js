import { describe, expect, it, vi } from 'vitest';
import { ROLES } from '../../src/domain/constants.js';
import { USC_DEPARTMENT_REGISTRY } from '../../src/domain/usc-departments.js';
import { ACCOUNT_STATUS } from '../../src/server/auth/contracts.js';
import { accessIdCollisionKey, createAccessManagementService } from '../../src/server/access/service.js';

function account(overrides = {}) {
  return {
    id: 'ACCOUNT-001',
    accessIdNormalized: 'HAU.FOOD.001',
    status: ACCOUNT_STATUS.ACTIVE,
    roleId: ROLES.DOL_STAFF,
    committeeIds: ['COM_FOOD'],
    defaultCommitteeId: 'COM_FOOD',
    profile: { fullName: 'Synthetic Food Operator' },
    passwordCredential: { algorithm: 'PBKDF2-SHA-256' },
    temporaryCredential: null,
    credentialVersion: 1,
    onboardingCompletedAt: '2026-07-22T00:00:00.000Z',
    createdAt: '2026-07-22T00:00:00.000Z',
    updatedAt: '2026-07-22T00:00:00.000Z',
    lockedAt: null,
    lastAccessIdChangedAt: '',
    ...overrides,
  };
}

function context({ accounts = [], activeAdministrators = 1 } = {}) {
  const byAccessId = new Map(accounts.map((entry) => [entry.accessIdNormalized, entry]));
  const reservations = new Map(
    accounts.map((entry) => [accessIdCollisionKey(entry.accessIdNormalized), { accountId: entry.id }]),
  );
  const history = new Map();
  const idempotency = new Map();
  const changes = [];
  const repository = {
    getAccountByAccessId: vi.fn(async (accessId) => byAccessId.get(accessId)),
    getAccessIdReservation: vi.fn(async (key) => reservations.get(key)),
    nextGeneratedAccessId: vi.fn(async (year) => `DOL-${year}-0001`),
    countActiveAdministrators: vi.fn(async () => activeAdministrators),
    listAccessPolicyReferences: vi.fn(async () => ({
      committees: [
        { id: 'COM_FOOD', label: 'Food Committee' },
        { id: 'COM_INVENTORY_PANTRY', label: 'Inventory and Pantry Committee' },
        { id: 'COM_MATERIALS', label: 'Materials Committee' },
      ],
      locations: [{ id: 'MAIN_STORAGE', label: 'MAIN_STORAGE' }],
      eventSeries: [{ id: 'SER-001', label: 'Synthetic Series' }],
      events: [{ id: 'EVT-001', eventSeriesId: 'SER-001', label: 'Synthetic Event' }],
      capabilities: [],
      locationScopeIds: ['MAIN_STORAGE'],
      eventSeriesScopeIds: ['SER-001'],
      eventScopeIds: ['EVT-001'],
    })),
    getAccessPolicyChangeByIdempotency: vi.fn(async () => null),
    updateAccessPolicy: vi.fn(),
    listAccounts: vi.fn(async () => ({ items: [], pagination: { page: 1, totalPages: 1, total: 0 } })),
    listAccessIdHistory: vi.fn(async () => []),
    listAccountAuditHistory: vi.fn(async () => []),
    getIdempotency: vi.fn(async (scope, key) => idempotency.get(`${scope}:${key}`) ?? null),
    getAccessIdHistoryByIdempotency: vi.fn(async (key) => history.get(key)),
    changeAccessId: vi.fn(async (command) => {
      byAccessId.delete(command.account.accessIdNormalized);
      byAccessId.set(command.newAccessId, {
        ...command.account,
        accessIdNormalized: command.newAccessId,
        credentialVersion: command.account.credentialVersion + 1,
      });
      reservations.set(command.collisionKey, { accountId: command.account.id });
      history.set(command.idempotencyKey, {
        accountId: command.account.id,
        oldAccessId: command.account.accessIdNormalized,
        newAccessId: command.newAccessId,
      });
      changes.push(command);
    }),
    createStarterAccount: vi.fn(),
    listRequesterDepartments: vi.fn(async () =>
      USC_DEPARTMENT_REGISTRY.map((department) => ({
        id: department.id,
        code: department.code,
        displayName: department.displayName,
        recommendedAccessId: department.recommendedAccessId,
        active: true,
      })),
    ),
    listDepartmentAccountStates: vi.fn(async () =>
      USC_DEPARTMENT_REGISTRY.map((department) => ({
        departmentId: department.id,
        accountId: '',
        accessId: '',
        roleId: '',
        status: '',
      })),
    ),
    seedDepartmentAccounts: vi.fn(),
    resetTemporaryPassword: vi.fn(async ({ idempotency: replay }) => {
      idempotency.set(`${replay.scope}:${replay.key}`, {
        actorAccountId: replay.actorAccountId,
        requestFingerprint: replay.requestFingerprint,
        result: replay.result,
      });
    }),
    setAccountStatus: vi.fn(),
    revokeSessions: vi.fn(async ({ idempotency: replay }) => {
      idempotency.set(`${replay.scope}:${replay.key}`, {
        actorAccountId: replay.actorAccountId,
        requestFingerprint: replay.requestFingerprint,
        result: replay.result,
      });
    }),
    unlockAccount: vi.fn(async ({ idempotency: replay }) => {
      idempotency.set(`${replay.scope}:${replay.key}`, {
        actorAccountId: replay.actorAccountId,
        requestFingerprint: replay.requestFingerprint,
        result: replay.result,
      });
    }),
  };
  let id = 0;
  let password = 0;
  const service = createAccessManagementService({
    repository,
    passwordKdf: { hash: vi.fn(async () => ({ algorithm: 'PBKDF2-SHA-256', iterations: 100_000 })) },
    environment: 'STAGING',
    clock: { now: () => Date.parse('2026-07-22T08:00:00.000Z') },
    createId: () => `ID-${++id}`,
    createTemporaryPassword: () => `Generated!Password${++password}9472`,
  });
  return { service, repository, changes };
}

const actor = account({
  id: 'ADMIN-001',
  accessIdNormalized: 'HAU.ADMIN.001',
  roleId: ROLES.ADMINISTRATOR,
  committeeIds: [],
  defaultCommitteeId: '',
  profile: { fullName: 'Synthetic Administrator' },
});

const ownerActor = account({
  id: 'OWNER-001',
  accessIdNormalized: 'HAU.OWNER.001',
  roleId: ROLES.SYSTEM_OWNER,
  committeeIds: [],
  defaultCommitteeId: '',
  profile: { fullName: 'Synthetic System Owner' },
});

describe('access management service', () => {
  it('allows the System Owner to administer ordinary accounts but protects the owner account', async () => {
    const ownerTarget = account({
      id: ownerActor.id,
      accessIdNormalized: ownerActor.accessIdNormalized,
      roleId: ROLES.SYSTEM_OWNER,
    });
    const { service, repository } = context({ accounts: [ownerTarget] });

    await expect(service.listAccounts({ actor: ownerActor })).resolves.toMatchObject({
      items: [],
    });
    await expect(
      service.previewAccessIdChange({
        actor: ownerActor,
        command: {
          currentAccessId: ownerTarget.accessIdNormalized,
          confirmCurrentAccessId: ownerTarget.accessIdNormalized,
          proposedAccessId: 'HAU.OWNER.002',
        },
      }),
    ).rejects.toMatchObject({ code: 'SYSTEM_ACCOUNT_PROTECTED' });
    expect(repository.listAccounts).toHaveBeenCalledOnce();
  });

  it('uses a punctuation-insensitive collision key for login aliases', () => {
    expect(accessIdCollisionKey(' hau.food-001 ')).toBe('HAUFOOD001');
    expect(accessIdCollisionKey('HAU_FOOD.001')).toBe('HAUFOOD001');
  });

  it('changes only the mutable Access ID, revokes sessions, and safely replays one history event', async () => {
    const target = account();
    const { service, repository, changes } = context({ accounts: [target] });
    const command = {
      currentAccessId: target.accessIdNormalized,
      confirmCurrentAccessId: target.accessIdNormalized,
      proposedAccessId: 'HAU.FOOD.009',
      reason: 'Correct the synthetic operator login identifier.',
      idempotencyKey: 'access-id-change-00000001',
    };

    const first = await service.changeAccessId({ actor, command, correlationId: 'REQ-SYNTHETIC' });
    const replay = await service.changeAccessId({ actor, command, correlationId: 'REQ-SYNTHETIC' });

    expect(first).toMatchObject({ changed: true, replayed: false, sessionsRevoked: true });
    expect(replay).toMatchObject({ changed: true, replayed: true, sessionsRevoked: true });
    expect(repository.changeAccessId).toHaveBeenCalledTimes(1);
    expect(changes[0]).toMatchObject({
      account: { id: target.id, roleId: target.roleId },
      actor: { id: actor.id },
      newAccessId: 'HAU.FOOD.009',
      environment: 'STAGING',
    });
  });

  it('rejects normalization collisions without disclosing the conflicting account', async () => {
    const target = account();
    const other = account({ id: 'ACCOUNT-002', accessIdNormalized: 'HAU-OTHER-001' });
    const { service } = context({ accounts: [target, other] });

    await expect(
      service.previewAccessIdChange({
        actor,
        command: {
          currentAccessId: other.accessIdNormalized,
          confirmCurrentAccessId: other.accessIdNormalized,
          proposedAccessId: 'HAU_FOOD-001',
        },
      }),
    ).rejects.toMatchObject({ code: 'ACCESS_ID_COLLISION', status: 409 });
  });

  it('protects the last active Administrator from a consequential status change', async () => {
    const target = account({
      id: 'ADMIN-LAST',
      accessIdNormalized: 'HAU.ADMIN.LAST',
      roleId: ROLES.ADMINISTRATOR,
      committeeIds: [],
    });
    const { service, repository } = context({ accounts: [target], activeAdministrators: 1 });

    await expect(
      service.setAccountStatus({
        actor,
        command: {
          currentAccessId: target.accessIdNormalized,
          confirmCurrentAccessId: target.accessIdNormalized,
          status: ACCOUNT_STATUS.DISABLED,
          reason: 'Synthetic last administrator protection test.',
        },
      }),
    ).rejects.toMatchObject({ code: 'LAST_ACTIVE_ADMIN_PROTECTED', status: 409 });
    expect(repository.setAccountStatus).not.toHaveBeenCalled();
  });

  it('archives an account without deleting history and records the distinct audit action', async () => {
    const target = account({ id: 'ACCOUNT-ARCHIVE', accessIdNormalized: 'HAU.FOOD.ARCHIVE' });
    const { service, repository } = context({ accounts: [target] });

    await expect(
      service.setAccountStatus({
        actor,
        command: {
          currentAccessId: target.accessIdNormalized,
          confirmCurrentAccessId: target.accessIdNormalized,
          status: ACCOUNT_STATUS.REVOKED,
          lifecycleAction: 'ARCHIVE',
          reason: 'Archive this departed operator while retaining history.',
        },
      }),
    ).resolves.toMatchObject({
      changed: true,
      status: ACCOUNT_STATUS.REVOKED,
      archived: true,
      sessionsRevoked: true,
    });
    expect(repository.setAccountStatus).toHaveBeenCalledWith(
      expect.objectContaining({
        nextStatus: ACCOUNT_STATUS.REVOKED,
        auditAction: 'ACCOUNT_ARCHIVED',
      }),
    );
  });

  it('restores an unactivated revoked department account to STARTER', async () => {
    const target = account({
      id: 'ACCOUNT-DEPT-DOL',
      accessIdNormalized: 'HAU.USC.DOL',
      status: ACCOUNT_STATUS.REVOKED,
      roleId: ROLES.REQUESTER,
      committeeIds: [],
      defaultCommitteeId: '',
      passwordCredential: null,
      temporaryCredential: { algorithm: 'PBKDF2-SHA-256' },
      onboardingCompletedAt: null,
      departmentId: 'DEPT_DOL',
    });
    const { service, repository } = context({ accounts: [target] });

    await expect(
      service.setAccountStatus({
        actor,
        command: {
          currentAccessId: target.accessIdNormalized,
          confirmCurrentAccessId: target.accessIdNormalized,
          status: ACCOUNT_STATUS.ACTIVE,
          reason: 'Restore the unactivated department account.',
        },
      }),
    ).resolves.toMatchObject({
      changed: true,
      status: ACCOUNT_STATUS.STARTER,
      sessionsRevoked: true,
    });
    expect(repository.setAccountStatus).toHaveBeenCalledWith(
      expect.objectContaining({ nextStatus: ACCOUNT_STATUS.STARTER }),
    );
  });

  it('requires an active Administrator for account enumeration', async () => {
    const { service, repository } = context();
    await expect(service.listAccounts({ actor: account({ roleId: ROLES.DIRECTOR }) })).rejects.toMatchObject({
      code: 'ADMINISTRATOR_REQUIRED',
      status: 403,
    });
    expect(repository.listAccounts).not.toHaveBeenCalled();
  });

  it('blocks changes to system-managed accounts', async () => {
    const target = account({
      id: 'SYSTEM-PUBLIC-REQUEST',
      accessIdNormalized: 'SYSTEM.PUBLIC.REQUEST',
      status: ACCOUNT_STATUS.REVOKED,
    });
    const { service, repository } = context({ accounts: [target] });

    await expect(
      service.setAccountStatus({
        actor,
        command: {
          currentAccessId: target.accessIdNormalized,
          confirmCurrentAccessId: target.accessIdNormalized,
          status: ACCOUNT_STATUS.ACTIVE,
          reason: 'Synthetic attempt to activate a protected system account.',
        },
      }),
    ).rejects.toMatchObject({ code: 'SYSTEM_ACCOUNT_PROTECTED', status: 403 });
    expect(repository.setAccountStatus).not.toHaveBeenCalled();
  });

  it('atomically prepares the ten governed department starter accounts and returns one-time credentials', async () => {
    const { service, repository } = context();
    const result = await service.seedDepartmentAccounts({
      actor,
      command: {
        confirmed: true,
        reason: 'Initialize the owner-approved department requester accounts.',
      },
      correlationId: 'REQ-DEPARTMENT-SEED',
    });

    expect(result).toMatchObject({ seeded: true, accounts: 10 });
    expect(result.credentials).toHaveLength(10);
    expect(result.credentials.map((entry) => entry.accessId)).toEqual(
      USC_DEPARTMENT_REGISTRY.map((department) => department.recommendedAccessId),
    );
    expect(new Set(result.credentials.map((entry) => entry.temporaryPassword)).size).toBe(10);
    expect(repository.seedDepartmentAccounts).toHaveBeenCalledOnce();
    expect(repository.seedDepartmentAccounts.mock.calls[0][0].accounts).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: 'ACC-USC-DEPT-DOL',
          departmentId: 'USC-DEPT-DOL',
          roleId: ROLES.REQUESTER,
          status: ACCOUNT_STATUS.STARTER,
        }),
      ]),
    );
    expect(JSON.stringify(repository.seedDepartmentAccounts.mock.calls[0][0])).not.toContain(
      result.credentials[0].temporaryPassword,
    );
  });

  it('generates a one-time reset credential server-side and never requires plaintext input', async () => {
    const target = account();
    const { service, repository } = context({ accounts: [target] });
    const result = await service.resetTemporaryPassword({
      actor,
      command: {
        currentAccessId: target.accessIdNormalized,
        confirmCurrentAccessId: target.accessIdNormalized,
        reason: 'Authorized synthetic credential reset for acceptance.',
        clientRequestId: 'access-reset-synthetic-00000001',
      },
    });

    expect(result).toMatchObject({
      reset: true,
      status: ACCOUNT_STATUS.STARTER,
      sessionsRevoked: true,
      credential: {
        accessId: target.accessIdNormalized,
        temporaryPassword: 'Generated!Password19472',
      },
    });
    expect(repository.resetTemporaryPassword).toHaveBeenCalledOnce();
    expect(JSON.stringify(repository.resetTemporaryPassword.mock.calls[0][0])).not.toContain(
      result.credential.temporaryPassword,
    );
    const replay = await service.resetTemporaryPassword({
      actor,
      command: {
        currentAccessId: target.accessIdNormalized,
        confirmCurrentAccessId: target.accessIdNormalized,
        reason: 'Authorized synthetic credential reset for acceptance.',
        clientRequestId: 'access-reset-synthetic-00000001',
      },
    });
    expect(replay).toMatchObject({
      reset: true,
      replayed: true,
      credentialUnavailable: true,
    });
    expect(replay).not.toHaveProperty('credential');
    expect(repository.resetTemporaryPassword).toHaveBeenCalledOnce();
  });

  it('previews and applies a governed access policy with session revocation and audit input', async () => {
    const target = account();
    const { service, repository } = context({ accounts: [target] });
    const command = {
      currentAccessId: target.accessIdNormalized,
      confirmCurrentAccessId: target.accessIdNormalized,
      presetId: 'MATERIALS_OPERATOR',
      roleId: 'DOL_STAFF',
      committeeIds: ['COM_MATERIALS'],
      defaultCommitteeId: 'COM_MATERIALS',
      workspaceIds: ['materials'],
      defaultWorkspaceId: 'materials',
      locationScopeIds: ['MAIN_STORAGE'],
      eventSeriesScopeIds: ['SER-001'],
      eventScopeIds: ['EVT-001'],
      capabilityDenies: ['lending.usage.view'],
      reason: 'Assign the synthetic Materials operating policy.',
      idempotencyKey: 'access-policy-change-00000001',
    };

    await expect(service.previewAccessPolicy({ actor: ownerActor, command })).resolves.toMatchObject({
      roleId: 'DOL_STAFF',
      workspaceIds: ['materials'],
      defaultWorkspaceId: 'materials',
      explicitDenies: ['lending.usage.view'],
      sessionImpact: 'ALL_ACTIVE_SESSIONS_REVOKED',
    });
    await expect(
      service.updateAccessPolicy({ actor: ownerActor, command, correlationId: 'REQ-POLICY' }),
    ).resolves.toMatchObject({ changed: true, replayed: false, sessionsRevoked: true });
    expect(repository.updateAccessPolicy).toHaveBeenCalledWith(
      expect.objectContaining({
        account: expect.objectContaining({ accessIdNormalized: target.accessIdNormalized }),
        nextAccount: expect.objectContaining({
          roleId: 'DOL_STAFF',
          committeeIds: ['COM_MATERIALS'],
          accessProfile: expect.objectContaining({ workspaceIds: ['materials'] }),
        }),
        reason: command.reason,
        correlationId: 'REQ-POLICY',
      }),
    );
  });

  it('blocks an ordinary Administrator from assigning the Administrator preset', async () => {
    const target = account();
    const { service, repository } = context({ accounts: [target] });
    await expect(
      service.previewAccessPolicy({
        actor,
        command: {
          currentAccessId: target.accessIdNormalized,
          confirmCurrentAccessId: target.accessIdNormalized,
          presetId: 'ADMINISTRATOR',
          roleId: 'ADMINISTRATOR',
        },
      }),
    ).rejects.toMatchObject({ code: 'OWNER_APPROVAL_REQUIRED', status: 403 });
    expect(repository.updateAccessPolicy).not.toHaveBeenCalled();
  });
});
