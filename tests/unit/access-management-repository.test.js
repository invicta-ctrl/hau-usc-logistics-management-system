import { Miniflare } from 'miniflare';
import { afterEach, describe, expect, it } from 'vitest';
import { createD1AccessManagementRepository } from '../../src/server/d1/access-management-repository.js';

const BEFORE = '2026-08-03T00:00:00.000Z';
const AFTER = '2026-08-03T00:01:00.000Z';

let miniflare;

afterEach(async () => {
  await miniflare?.dispose();
  miniflare = null;
});

async function database({ roleId = 'DOL_STAFF', credentialVersion = 1, lockedAt = null } = {}) {
  miniflare = new Miniflare({
    modules: true,
    script: 'export default { fetch() { return new Response("ok"); } }',
    d1Databases: ['DB'],
  });
  const db = await miniflare.getD1Database('DB');
  for (const statement of [
    `CREATE TABLE data_revisions (
      scope TEXT PRIMARY KEY,
      revision INTEGER NOT NULL,
      updated_at TEXT NOT NULL
    ) STRICT`,
    "INSERT INTO data_revisions VALUES ('global', 0, '2026-08-03T00:00:00.000Z')",
    `CREATE TABLE accounts (
      id TEXT PRIMARY KEY,
      role_id TEXT NOT NULL,
      status TEXT NOT NULL,
      locked_at TEXT,
      default_committee_id TEXT,
      credential_version INTEGER NOT NULL,
      updated_at TEXT NOT NULL
    ) STRICT`,
    `CREATE TABLE account_committees (
      account_id TEXT NOT NULL,
      committee_id TEXT NOT NULL,
      membership_type TEXT NOT NULL,
      active INTEGER NOT NULL,
      source TEXT NOT NULL
    ) STRICT`,
    `CREATE TABLE account_access_profiles (
      account_id TEXT PRIMARY KEY,
      preset_id TEXT NOT NULL,
      workspace_ids_json TEXT NOT NULL,
      default_workspace_id TEXT NOT NULL,
      location_scope_ids_json TEXT NOT NULL,
      event_series_scope_ids_json TEXT NOT NULL,
      event_scope_ids_json TEXT NOT NULL,
      capability_grants_json TEXT NOT NULL,
      capability_denies_json TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      updated_by_account_id TEXT NOT NULL
    ) STRICT`,
    `CREATE TABLE sessions (account_id TEXT NOT NULL, id TEXT PRIMARY KEY) STRICT`,
    `CREATE TABLE access_policy_changes (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL,
      actor_account_id TEXT NOT NULL,
      idempotency_key TEXT NOT NULL UNIQUE,
      before_json TEXT NOT NULL,
      after_json TEXT NOT NULL,
      changed_at TEXT NOT NULL,
      reason TEXT NOT NULL,
      correlation_id TEXT NOT NULL
    ) STRICT`,
    `CREATE TABLE audit_log (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      actor_account_id TEXT,
      before_json TEXT NOT NULL,
      after_json TEXT NOT NULL,
      correlation_id TEXT NOT NULL,
      notes TEXT NOT NULL
    ) STRICT`,
    `CREATE TABLE idempotency_keys (
      scope TEXT NOT NULL,
      idempotency_key TEXT NOT NULL,
      actor_account_id TEXT NOT NULL,
      request_fingerprint TEXT NOT NULL,
      result_json TEXT NOT NULL,
      created_at TEXT NOT NULL,
      PRIMARY KEY (scope, idempotency_key)
    ) STRICT`,
    `CREATE TABLE auth_rate_limit_events (
      id TEXT PRIMARY KEY,
      limiter_key TEXT NOT NULL,
      attempted_at INTEGER NOT NULL
    ) STRICT`,
  ]) {
    await db.prepare(statement).run();
  }
  await db
    .prepare(
      `INSERT INTO accounts (
         id, role_id, status, locked_at, default_committee_id, credential_version, updated_at
       ) VALUES (?1, ?2, 'ACTIVE', ?3, 'COM_FOOD', ?4, ?5)`,
    )
    .bind(
      'ACCOUNT-1',
      roleId === 'ADMINISTRATOR' ? 'ADMINISTRATOR' : roleId,
      lockedAt,
      credentialVersion,
      BEFORE,
    )
    .run();
  await db
    .prepare(
      `INSERT INTO account_committees (account_id, committee_id, membership_type, active, source)
       VALUES ('ACCOUNT-1', 'COM_FOOD', 'ASSIGNED', 1, 'SERVER')`,
    )
    .run();
  await db
    .prepare(
      `INSERT INTO account_access_profiles (
         account_id, preset_id, workspace_ids_json, default_workspace_id,
         location_scope_ids_json, event_series_scope_ids_json, event_scope_ids_json,
         capability_grants_json, capability_denies_json, updated_at, updated_by_account_id
       ) VALUES ('ACCOUNT-1', 'FOOD_OPERATOR', '["food"]', 'food', '[]', '[]', '[]', '[]', '[]', ?1, 'OWNER-1')`,
    )
    .bind(BEFORE)
    .run();
  await db.prepare("INSERT INTO sessions VALUES ('ACCOUNT-1', 'SESSION-1')").run();
  return db;
}

function account(overrides = {}) {
  return {
    id: 'ACCOUNT-1',
    roleId: 'DOL_STAFF',
    status: 'ACTIVE',
    lockedAt: null,
    defaultCommitteeId: 'COM_FOOD',
    committeeIds: ['COM_FOOD'],
    accessProfile: {
      presetId: 'FOOD_OPERATOR',
      workspaceIds: ['food'],
      defaultWorkspaceId: 'food',
      locationScopeIds: [],
      eventSeriesScopeIds: [],
      eventScopeIds: [],
      capabilityGrants: [],
      capabilityDenies: [],
    },
    credentialVersion: 1,
    updatedAt: BEFORE,
    ...overrides,
  };
}

function nextAccount(overrides = {}) {
  return account({
    roleId: 'DOL_STAFF',
    committeeIds: ['COM_MATERIALS'],
    defaultCommitteeId: 'COM_MATERIALS',
    accessProfile: {
      presetId: 'MATERIALS_OPERATOR',
      workspaceIds: ['materials'],
      defaultWorkspaceId: 'materials',
      locationScopeIds: [],
      eventSeriesScopeIds: [],
      eventScopeIds: [],
      capabilityGrants: [],
      capabilityDenies: [],
    },
    ...overrides,
  });
}

async function update(repository, current, proposed = nextAccount()) {
  return repository.updateAccessPolicy({
    account: current,
    nextAccount: proposed,
    actor: { id: 'OWNER-1' },
    changedAt: AFTER,
    reason: 'Synthetic guarded access policy test.',
    correlationId: 'COR-ACCESS-1',
    idempotencyKey: 'access-policy-test-0001',
    changeId: 'CHANGE-1',
    auditId: 'AUDIT-1',
  });
}

describe('D1 access-management repository guards', () => {
  it('rolls back all policy dependents when the credential/update guard is stale', async () => {
    const db = await database({ credentialVersion: 2 });
    const repository = createD1AccessManagementRepository(db);

    await expect(update(repository, account({ credentialVersion: 1 }))).rejects.toMatchObject({
      code: 'ACCESS_WRITE_CONFLICT',
      status: 409,
    });
    await expect(
      db.prepare('SELECT role_id, credential_version, updated_at FROM accounts').first(),
    ).resolves.toEqual({
      role_id: 'DOL_STAFF',
      credential_version: 2,
      updated_at: BEFORE,
    });
    await expect(db.prepare('SELECT COUNT(*) AS count FROM account_committees').first()).resolves.toEqual({
      count: 1,
    });
    await expect(db.prepare('SELECT committee_id FROM account_committees').first()).resolves.toEqual({
      committee_id: 'COM_FOOD',
    });
    await expect(
      db.prepare('SELECT COUNT(*) AS count FROM account_access_profiles').first(),
    ).resolves.toEqual({
      count: 1,
    });
    await expect(db.prepare('SELECT COUNT(*) AS count FROM sessions').first()).resolves.toEqual({ count: 1 });
    await expect(db.prepare('SELECT COUNT(*) AS count FROM access_policy_changes').first()).resolves.toEqual({
      count: 0,
    });
    await expect(db.prepare('SELECT COUNT(*) AS count FROM audit_log').first()).resolves.toEqual({
      count: 0,
    });
  });

  it('enforces the last-active-Administrator invariant inside the guarded update', async () => {
    const db = await database({ roleId: 'ADMINISTRATOR' });
    const repository = createD1AccessManagementRepository(db);

    await expect(
      update(repository, account({ roleId: 'ADMINISTRATOR' }), nextAccount({ roleId: 'DOL_STAFF' })),
    ).rejects.toMatchObject({ code: 'ACCESS_WRITE_CONFLICT', status: 409 });
    await expect(db.prepare('SELECT role_id, credential_version FROM accounts').first()).resolves.toEqual({
      role_id: 'ADMINISTRATOR',
      credential_version: 1,
    });
    await expect(db.prepare('SELECT COUNT(*) AS count FROM account_committees').first()).resolves.toEqual({
      count: 1,
    });
    await expect(db.prepare('SELECT COUNT(*) AS count FROM access_policy_changes').first()).resolves.toEqual({
      count: 0,
    });
  });

  it('clears all supplied alias digests while preserving unrelated limiter events', async () => {
    const db = await database({ lockedAt: '2026-08-03T00:00:00.000Z' });
    const repository = createD1AccessManagementRepository(db);
    for (const [id, key] of [
      ['RATE-CODE', 'DIGEST:hau.food.001:network'],
      ['RATE-USERNAME', 'DIGEST:food.operator:network'],
      ['RATE-EMAIL', 'DIGEST:food.operator@example.test:network'],
      ['RATE-OTHER', 'DIGEST:other:network'],
    ]) {
      await db.prepare('INSERT INTO auth_rate_limit_events VALUES (?1, ?2, 1)').bind(id, key).run();
    }

    await repository.unlockAccount({
      account: account({ lockedAt: '2026-08-03T00:00:00.000Z' }),
      limiterIdentities: ['DIGEST:hau.food.001', 'DIGEST:food.operator', 'DIGEST:food.operator@example.test'],
      actor: { id: 'OWNER-1' },
      changedAt: AFTER,
      reason: 'Synthetic limiter alias reset.',
      correlationId: 'COR-UNLOCK-1',
      auditId: 'AUDIT-UNLOCK-1',
      idempotency: {
        scope: 'access-unlock-account',
        key: 'access-unlock-test-0001',
        actorAccountId: 'OWNER-1',
        requestFingerprint: 'FINGERPRINT-1',
        result: { unlocked: true },
        createdAt: AFTER,
      },
    });

    await expect(db.prepare('SELECT locked_at FROM accounts').first()).resolves.toEqual({ locked_at: null });
    await expect(
      db.prepare('SELECT id FROM auth_rate_limit_events ORDER BY id').all(),
    ).resolves.toMatchObject({
      results: [{ id: 'RATE-OTHER' }],
    });
  });
});
