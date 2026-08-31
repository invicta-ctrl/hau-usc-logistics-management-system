import { Miniflare } from 'miniflare';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { createD1AccountApplicationRepository } from '../../src/server/d1/account-application-repository.js';
import { createD1AccessManagementRepository } from '../../src/server/d1/access-management-repository.js';
import { createD1IdentityFoundationRepository } from '../../src/server/d1/identity-foundation-repository.js';

const BEFORE = '2026-08-03T00:00:00.000Z';
const AFTER = '2026-08-03T00:01:00.000Z';
const repositoryRoot = resolve(import.meta.dirname, '../..');

let miniflare;

afterEach(async () => {
  await miniflare?.dispose();
  miniflare = null;
});

function migrationStatements(source) {
  const statements = [];
  let current = [];
  let trigger = false;
  for (const line of String(source).split(/\r?\n/u)) {
    if (!current.length && /^\s*PRAGMA foreign_keys = ON;\s*$/u.test(line)) continue;
    if (/^\s*CREATE TRIGGER\b/iu.test(line)) trigger = true;
    current.push(line);
    if ((trigger && /^END;\s*$/u.test(line)) || (!trigger && /;\s*$/u.test(line))) {
      statements.push(current.join('\n'));
      current = [];
      trigger = false;
    }
  }
  if (current.join('').trim()) throw new Error('The synthetic migration statement parser was incomplete.');
  return statements;
}

async function database({
  roleId = 'DOL_STAFF',
  credentialVersion = 1,
  lockedAt = null,
  activityHistory = false,
  accountApplications = false,
} = {}) {
  miniflare = new Miniflare({
    modules: true,
    script: 'export default { fetch() { return new Response("ok"); } }',
    d1Databases: ['DB'],
  });
  const db = await miniflare.getD1Database('DB');
  for (const statement of [
    `CREATE TABLE app_metadata (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    ) STRICT`,
    "INSERT INTO app_metadata (key, value, updated_at) VALUES ('operational_schema_version', '31', '2026-08-03T00:00:00.000Z')",
    `CREATE TABLE data_revisions (
      scope TEXT PRIMARY KEY,
      revision INTEGER NOT NULL,
      updated_at TEXT NOT NULL
    ) STRICT`,
    "INSERT INTO data_revisions VALUES ('global', 0, '2026-08-03T00:00:00.000Z')",
    `CREATE TABLE accounts (
      id TEXT PRIMARY KEY,
      access_id_normalized TEXT NOT NULL UNIQUE,
      role_id TEXT NOT NULL,
      status TEXT NOT NULL,
      locked_at TEXT,
      default_committee_id TEXT,
      profile_full_name TEXT,
      profile_mobile_number TEXT,
      profile_email TEXT,
      password_credential_json TEXT,
      temporary_credential_json TEXT,
      credential_version INTEGER NOT NULL,
      onboarding_completed_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      last_access_id_changed_at TEXT,
      lending_eligible INTEGER NOT NULL DEFAULT 0,
      institution_id TEXT NOT NULL DEFAULT '',
      department_id TEXT,
      password_changed_at TEXT,
      last_password_reset_at TEXT,
      username_normalized TEXT,
      profile_email_verified_at TEXT,
      verified_email_fingerprint TEXT,
      profile_department_id TEXT,
      profile_course_id TEXT,
      profile_year_level INTEGER,
      avatar_asset_key TEXT,
      avatar_updated_at TEXT
    ) STRICT`,
    `CREATE TABLE requester_departments (
      id TEXT PRIMARY KEY,
      display_name TEXT NOT NULL
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
    `CREATE TABLE access_id_reservations (
      collision_key TEXT PRIMARY KEY,
      account_id TEXT NOT NULL,
      access_id_snapshot TEXT NOT NULL,
      reserved_at TEXT NOT NULL,
      reservation_reason TEXT NOT NULL
    ) STRICT`,
    `CREATE TABLE access_id_history (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL,
      old_access_id_normalized TEXT NOT NULL,
      new_access_id_normalized TEXT NOT NULL,
      changed_by_account_id TEXT NOT NULL,
      actor_access_id_snapshot TEXT NOT NULL,
      changed_at TEXT NOT NULL,
      reason TEXT NOT NULL,
      correlation_id TEXT NOT NULL,
      environment TEXT NOT NULL,
      idempotency_key TEXT NOT NULL UNIQUE
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
    `CREATE TRIGGER audit_log_no_update
       BEFORE UPDATE ON audit_log
       BEGIN
         SELECT RAISE(ABORT, 'audit log is append-only');
       END`,
    `CREATE TRIGGER audit_log_no_delete
       BEFORE DELETE ON audit_log
       BEGIN
         SELECT RAISE(ABORT, 'audit log is append-only');
       END`,
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
  if (activityHistory) {
    for (const migration of [
      '0031_canonical_identity_foundation.sql',
      '0032_staff_account_activity_history.sql',
    ]) {
      const source = await readFile(resolve(repositoryRoot, 'migrations', migration), 'utf8');
      const statements = migrationStatements(source);
      for (const [index, statement] of statements.entries()) {
        try {
          await db.prepare(statement.replace(/;\s*$/u, '')).run();
        } catch (error) {
          throw new Error(`Synthetic D1 migration failed at ${migration} statement ${index + 1}.`, {
            cause: error,
          });
        }
      }
    }
  } else {
    for (const statement of [
      `CREATE TABLE account_staff_links (
        id TEXT PRIMARY KEY,
        account_id TEXT NOT NULL,
        person_id TEXT NOT NULL,
        state TEXT NOT NULL
      ) STRICT`,
      `CREATE TABLE staff_account_activity_audit_context (
        audit_id TEXT PRIMARY KEY,
        person_id TEXT NOT NULL,
        account_id TEXT NOT NULL,
        account_staff_link_id TEXT NOT NULL,
        link_state TEXT NOT NULL,
        account_access_id_snapshot TEXT NOT NULL,
        action_code TEXT NOT NULL,
        correlation_id TEXT NOT NULL,
        prepared_at TEXT NOT NULL
      ) STRICT`,
    ]) {
      await db.prepare(statement).run();
    }
  }
  if (accountApplications) {
    for (const statement of [
      `CREATE TABLE account_applications (
        id TEXT PRIMARY KEY,
        application_code TEXT NOT NULL UNIQUE,
        email_fingerprint TEXT NOT NULL,
        identity_class_id TEXT NOT NULL,
        protected_email_envelope TEXT NOT NULL,
        protected_profile_envelope TEXT NOT NULL,
        department_id TEXT NOT NULL,
        course_id TEXT NOT NULL DEFAULT '',
        year_level INTEGER,
        requested_username_normalized TEXT NOT NULL,
        pending_password_credential_json TEXT,
        requested_access_json TEXT NOT NULL,
        state TEXT NOT NULL,
        revision INTEGER NOT NULL,
        status_token_digest TEXT NOT NULL UNIQUE,
        status_token_expires_at TEXT NOT NULL,
        client_request_id TEXT NOT NULL UNIQUE,
        administrator_reviewer_id TEXT REFERENCES accounts(id),
        administrator_reviewed_at TEXT,
        director_reviewer_id TEXT REFERENCES accounts(id),
        director_reviewed_at TEXT,
        approved_account_id TEXT UNIQUE REFERENCES accounts(id),
        expires_at TEXT NOT NULL,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        archived_at TEXT
      ) STRICT`,
      `CREATE TABLE account_application_history (
        id TEXT PRIMARY KEY,
        application_id TEXT NOT NULL REFERENCES account_applications(id),
        from_state TEXT NOT NULL,
        to_state TEXT NOT NULL,
        actor_account_id TEXT REFERENCES accounts(id),
        applicant_authority_fingerprint TEXT NOT NULL DEFAULT '',
        reason TEXT NOT NULL DEFAULT '',
        before_json TEXT NOT NULL,
        after_json TEXT NOT NULL,
        expected_revision INTEGER NOT NULL,
        resulting_revision INTEGER NOT NULL,
        idempotency_key TEXT NOT NULL UNIQUE,
        correlation_id TEXT NOT NULL,
        created_at TEXT NOT NULL
      ) STRICT`,
    ]) {
      await db.prepare(statement).run();
    }
  }
  await db
    .prepare(
      `INSERT INTO accounts (
         id, access_id_normalized, role_id, status, locked_at, default_committee_id,
         credential_version, created_at, updated_at
       ) VALUES (?1, ?2, ?3, 'ACTIVE', ?4, 'COM_FOOD', ?5, ?6, ?6)`,
    )
    .bind(
      'ACCOUNT-1',
      'HAU.FOOD.001',
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

async function insertAccount(
  db,
  {
    id,
    accessId,
    roleId = 'DOL_STAFF',
    status = 'ACTIVE',
    lockedAt = null,
    credentialVersion = 1,
    updatedAt = BEFORE,
    username = null,
  },
) {
  await db
    .prepare(
      `INSERT INTO accounts (
         id, access_id_normalized, role_id, status, locked_at, default_committee_id,
         credential_version, created_at, updated_at, username_normalized
       ) VALUES (?1, ?2, ?3, ?4, ?5, 'COM_FOOD', ?6, ?7, ?7, ?8)`,
    )
    .bind(id, accessId, roleId, status, lockedAt, credentialVersion, updatedAt, username)
    .run();
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

function recordingPreparedReads(database) {
  const statements = [];
  return {
    statements,
    binding: {
      prepare(sql) {
        statements.push(String(sql));
        return database.prepare(sql);
      },
    },
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

function statusIdempotency(key, createdAt) {
  return {
    scope: 'access-set-account-status',
    key,
    actorAccountId: 'OWNER-1',
    requestFingerprint: `FP-${key}`,
    result: { changed: true },
    createdAt,
  };
}

function activityPersonId(suffix) {
  return `PER-423E4567-E89B-42D3-A456-426614174${suffix}`;
}

async function createActivityLink(foundation, { accountId, suffix, state = 'ACTIVE' }) {
  const personId = activityPersonId(suffix);
  const linkId = `LNK-ACTIVITY-${suffix}`;
  await foundation.createPerson({ personId, sourceProvenanceEnvelope: null, createdAt: BEFORE });
  await foundation.createAccountStaffLink(
    {
      id: linkId,
      accountId,
      personId,
      state,
      sourceProvenanceEnvelope: null,
      createdAt: BEFORE,
      updatedAt: BEFORE,
    },
    { correlationId: `COR-LINK-${suffix}` },
  );
  return { personId, linkId };
}

async function insertApplication(
  db,
  {
    id,
    state,
    revision,
    approvedAccountId = null,
    administratorReviewerId = null,
    applicationCode = `AAP-${id}`,
  },
) {
  await db
    .prepare(
      `INSERT INTO account_applications (
         id, application_code, email_fingerprint, identity_class_id, protected_email_envelope,
         protected_profile_envelope, department_id, course_id, year_level,
         requested_username_normalized, pending_password_credential_json, requested_access_json,
         state, revision, status_token_digest, status_token_expires_at, client_request_id,
         administrator_reviewer_id, administrator_reviewed_at, director_reviewer_id,
         director_reviewed_at, approved_account_id, expires_at, created_at, updated_at, archived_at
       ) VALUES (?1, ?2, 'KEYED-EMAIL-FP', 'SYNTHETIC_STAFF', 'v1.synthetic.email',
         'v1.synthetic.profile', 'USC-DEPT-DOL', '', NULL, 'synthetic.applicant',
         '{"hash":"synthetic"}', '{"requestedRoleId":"REQUESTER"}', ?3, ?4,
         ?5, '2026-09-03T00:00:00.000Z', ?6, ?7, ?8, NULL, NULL, ?9,
         '2026-09-03T00:00:00.000Z', ?10, ?10, NULL)`,
    )
    .bind(
      id,
      applicationCode,
      state,
      revision,
      `STATUS-${id}`,
      `REQUEST-${id}`,
      administratorReviewerId,
      administratorReviewerId ? BEFORE : null,
      approvedAccountId,
      BEFORE,
    )
    .run();
}

function applicationHistory({ id, applicationId, fromState, toState, expectedRevision, createdAt }) {
  return {
    id,
    applicationId,
    fromState,
    toState,
    actorAccountId: 'ACCOUNT-1',
    applicantAuthorityFingerprint: 'SYNTHETIC-APPLICANT-AUTHORITY-FP',
    reason: 'Synthetic real D1 activity-history producer coverage.',
    before: { state: fromState, revision: expectedRevision },
    after: { state: toState },
    expectedRevision,
    resultingRevision: expectedRevision + 1,
    idempotencyKey: `IDEMPOTENCY-${id}`,
    correlationId: `COR-${id}`,
    createdAt,
  };
}

function applicationAudit({
  id,
  action,
  applicationId,
  accountId = '',
  actorAccountId = 'ACCOUNT-1',
  createdAt,
}) {
  return {
    id,
    applicationId,
    accountId,
    actorAccountId,
    action,
    before: {},
    after: { state: action },
    correlationId: `COR-${id}`,
    reason: 'Synthetic real D1 activity-history producer coverage.',
    createdAt,
  };
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
  it('hydrates a 25-account Administration page in four reads and at most one department expansion', async () => {
    const db = await database();
    const accountStatement = db.prepare(
      `INSERT INTO accounts (
         id, access_id_normalized, role_id, status, locked_at, default_committee_id,
         profile_full_name, credential_version, onboarding_completed_at, created_at, updated_at
       ) VALUES (?1, ?2, 'DOL_STAFF', 'ACTIVE', NULL, 'COM_FOOD', ?3, 1, ?4, ?4, ?4)`,
    );
    const committeeStatement = db.prepare(
      `INSERT INTO account_committees (account_id, committee_id, membership_type, active, source)
       VALUES (?1, 'COM_FOOD', 'ASSIGNED', 1, 'SERVER')`,
    );
    const profileStatement = db.prepare(
      `INSERT INTO account_access_profiles (
         account_id, preset_id, workspace_ids_json, default_workspace_id,
         location_scope_ids_json, event_series_scope_ids_json, event_scope_ids_json,
         capability_grants_json, capability_denies_json, updated_at, updated_by_account_id
       ) VALUES (?1, 'FOOD_OPERATOR', '["food"]', 'food', '[]', '[]', '[]', '[]', '[]', ?2, 'OWNER-1')`,
    );
    const seedStatements = [];
    for (let index = 2; index <= 25; index += 1) {
      const suffix = String(index).padStart(3, '0');
      const accountId = `ACCOUNT-${index}`;
      seedStatements.push(
        accountStatement.bind(accountId, `HAU.STAFF.${suffix}`, `Staff ${suffix}`, BEFORE),
        committeeStatement.bind(accountId),
        profileStatement.bind(accountId, BEFORE),
      );
    }
    await db.batch(seedStatements);

    const input = {
      query: '',
      role: '',
      committee: '',
      status: 'ALL',
      sort: 'accessId',
      direction: 'asc',
      page: 1,
      pageSize: 25,
    };
    const flatRecorder = recordingPreparedReads(db);
    const flatPage = await createD1AccessManagementRepository(flatRecorder.binding).listAccounts(input);
    expect(flatPage.items).toHaveLength(25);
    expect(flatRecorder.statements).toHaveLength(4);
    expect(flatRecorder.statements.join('\n')).not.toMatch(/SELECT a\.\*/u);
    expect(flatRecorder.statements.join('\n')).not.toMatch(/credential_json/u);

    await db.prepare("INSERT INTO requester_departments VALUES ('DEPT-ENG', 'Engineering')").run();
    await db.prepare("UPDATE accounts SET profile_department_id = 'DEPT-ENG' WHERE id = 'ACCOUNT-2'").run();
    const departmentRecorder = recordingPreparedReads(db);
    const departmentPage = await createD1AccessManagementRepository(departmentRecorder.binding).listAccounts(
      input,
    );
    expect(departmentRecorder.statements).toHaveLength(5);
    expect(departmentPage.items.find((item) => item.accountId === 'ACCOUNT-2')).toMatchObject({
      departmentId: '',
      departmentDisplayName: 'Engineering',
    });
  });

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

  it('rolls back a stale password reset before changing an Administrator or its sessions', async () => {
    const db = await database({ roleId: 'ADMINISTRATOR', credentialVersion: 2 });
    const repository = createD1AccessManagementRepository(db);

    await expect(
      repository.resetTemporaryPassword({
        account: account({ roleId: 'ADMINISTRATOR', credentialVersion: 1 }),
        actor: { id: 'OWNER-1' },
        temporaryCredential: { algorithm: 'PBKDF2-SHA-256' },
        resetAt: AFTER,
        reason: 'Synthetic stale Administrator password reset.',
        correlationId: 'COR-RESET-STALE',
        auditId: 'AUDIT-RESET-STALE',
        idempotency: {
          scope: 'access-reset-temporary-password',
          key: 'reset-stale-00000001',
          actorAccountId: 'OWNER-1',
          requestFingerprint: 'FP-RESET-STALE',
          result: { reset: true },
          createdAt: AFTER,
        },
      }),
    ).rejects.toMatchObject({ code: 'ACCESS_WRITE_CONFLICT', status: 409 });
    await expect(db.prepare('SELECT status, credential_version FROM accounts').first()).resolves.toEqual({
      status: 'ACTIVE',
      credential_version: 2,
    });
    await expect(db.prepare('SELECT COUNT(*) AS count FROM sessions').first()).resolves.toEqual({ count: 1 });
    await expect(db.prepare('SELECT COUNT(*) AS count FROM idempotency_keys').first()).resolves.toEqual({
      count: 0,
    });
  });

  it('blocks a current last Administrator password reset atomically', async () => {
    const db = await database({ roleId: 'ADMINISTRATOR' });
    const repository = createD1AccessManagementRepository(db);

    await expect(
      repository.resetTemporaryPassword({
        account: account({ roleId: 'ADMINISTRATOR' }),
        actor: { id: 'OWNER-1' },
        temporaryCredential: { algorithm: 'PBKDF2-SHA-256' },
        resetAt: AFTER,
        reason: 'Synthetic last Administrator password reset.',
        correlationId: 'COR-RESET-LAST',
        auditId: 'AUDIT-RESET-LAST',
        idempotency: {
          scope: 'access-reset-temporary-password',
          key: 'reset-last-00000001',
          actorAccountId: 'OWNER-1',
          requestFingerprint: 'FP-RESET-LAST',
          result: { reset: true },
          createdAt: AFTER,
        },
      }),
    ).rejects.toMatchObject({ code: 'ACCESS_WRITE_CONFLICT', status: 409 });
    await expect(db.prepare('SELECT status, credential_version FROM accounts').first()).resolves.toEqual({
      status: 'ACTIVE',
      credential_version: 1,
    });
  });

  it('blocks a current last Administrator status demotion inside the write guard', async () => {
    const db = await database({ roleId: 'ADMINISTRATOR' });
    const repository = createD1AccessManagementRepository(db);

    await expect(
      repository.setAccountStatus({
        account: account({ roleId: 'ADMINISTRATOR' }),
        actor: { id: 'OWNER-1' },
        nextStatus: 'DISABLED',
        changedAt: AFTER,
        reason: 'Synthetic last Administrator status demotion.',
        correlationId: 'COR-STATUS-LAST',
        auditId: 'AUDIT-STATUS-LAST',
        idempotency: {
          scope: 'access-set-account-status',
          key: 'status-last-00000001',
          actorAccountId: 'OWNER-1',
          requestFingerprint: 'FP-STATUS-LAST',
          result: { changed: true },
          createdAt: AFTER,
        },
      }),
    ).rejects.toMatchObject({ code: 'ACCESS_WRITE_CONFLICT', status: 409 });
    await expect(db.prepare('SELECT status, credential_version FROM accounts').first()).resolves.toEqual({
      status: 'ACTIVE',
      credential_version: 1,
    });
  });

  it('atomically records a revision-guarded no-op account status receipt', async () => {
    const db = await database();
    const repository = createD1AccessManagementRepository(db);

    await repository.recordAccountStatusNoop({
      account: account(),
      status: 'ACTIVE',
      idempotency: {
        scope: 'access-set-account-status',
        key: 'status-noop-00000001',
        actorAccountId: 'OWNER-1',
        requestFingerprint: 'FP-STATUS-NOOP',
        result: { changed: false, status: 'ACTIVE' },
        createdAt: AFTER,
      },
    });

    await expect(
      db.prepare('SELECT status, credential_version, updated_at FROM accounts').first(),
    ).resolves.toEqual({ status: 'ACTIVE', credential_version: 1, updated_at: BEFORE });
    await expect(db.prepare('SELECT COUNT(*) AS count FROM sessions').first()).resolves.toEqual({ count: 1 });
    await expect(db.prepare('SELECT COUNT(*) AS count FROM audit_log').first()).resolves.toEqual({
      count: 0,
    });
    await expect(
      db
        .prepare(
          `SELECT actor_account_id, request_fingerprint, result_json
           FROM idempotency_keys
           WHERE scope = 'access-set-account-status' AND idempotency_key = 'status-noop-00000001'`,
        )
        .first(),
    ).resolves.toEqual({
      actor_account_id: 'OWNER-1',
      request_fingerprint: 'FP-STATUS-NOOP',
      result_json: JSON.stringify({ changed: false, status: 'ACTIVE' }),
    });
  });

  it('rolls back a no-op receipt when the account revision changed', async () => {
    const db = await database({ credentialVersion: 2 });
    const repository = createD1AccessManagementRepository(db);

    await expect(
      repository.recordAccountStatusNoop({
        account: account(),
        status: 'ACTIVE',
        idempotency: {
          scope: 'access-set-account-status',
          key: 'status-noop-stale-0001',
          actorAccountId: 'OWNER-1',
          requestFingerprint: 'FP-STATUS-NOOP-STALE',
          result: { changed: false, status: 'ACTIVE' },
          createdAt: AFTER,
        },
      }),
    ).rejects.toMatchObject({ code: 'ACCESS_WRITE_CONFLICT', status: 409 });
    await expect(db.prepare('SELECT COUNT(*) AS count FROM idempotency_keys').first()).resolves.toEqual({
      count: 0,
    });
  });

  it('allows only one of two concurrent Administrator demotions to commit', async () => {
    const db = await database({ roleId: 'ADMINISTRATOR' });
    await insertAccount(db, { id: 'ACCOUNT-2', accessId: 'HAU.ADMIN.002', roleId: 'ADMINISTRATOR' });
    const repository = createD1AccessManagementRepository(db);
    const demote = (id, accessId, auditId) =>
      repository.setAccountStatus({
        account: account({ id, accessIdNormalized: accessId, roleId: 'ADMINISTRATOR' }),
        actor: { id: 'OWNER-1' },
        nextStatus: 'DISABLED',
        changedAt: AFTER,
        reason: 'Synthetic concurrent Administrator demotion.',
        correlationId: `COR-${id}`,
        auditId,
        idempotency: {
          scope: 'access-set-account-status',
          key: `status-${id}-00000001`,
          actorAccountId: 'OWNER-1',
          requestFingerprint: `FP-STATUS-${id}`,
          result: { changed: true },
          createdAt: AFTER,
        },
      });

    const results = await Promise.allSettled([
      demote('ACCOUNT-1', 'HAU.FOOD.001', 'AUDIT-CONCURRENT-1'),
      demote('ACCOUNT-2', 'HAU.ADMIN.002', 'AUDIT-CONCURRENT-2'),
    ]);
    expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
    expect(results.filter((result) => result.status === 'rejected')).toHaveLength(1);
    const rows = await db.prepare('SELECT id, role_id, status, locked_at FROM accounts ORDER BY id').all();
    expect(
      rows.results.filter(
        (row) => row.role_id === 'ADMINISTRATOR' && row.status === 'ACTIVE' && row.locked_at == null,
      ),
    ).toHaveLength(1);
  });

  it('rolls back stale Access-ID changes and preserves the reservation/history set', async () => {
    const db = await database();
    await db
      .prepare(
        `INSERT INTO access_id_reservations
         (collision_key, account_id, access_id_snapshot, reserved_at, reservation_reason)
         VALUES ('HAUFOOD001', 'ACCOUNT-1', 'HAU.FOOD.001', ?1, 'ACCOUNT_BASELINE')`,
      )
      .bind(BEFORE)
      .run();
    const repository = createD1AccessManagementRepository(db);

    await expect(
      repository.changeAccessId({
        account: account({ accessIdNormalized: 'HAU.FOOD.001', updatedAt: '2026-08-02T00:00:00.000Z' }),
        actor: { id: 'OWNER-1', accessIdNormalized: 'HAU.OWNER.001' },
        newAccessId: 'HAU.FOOD.009',
        collisionKey: 'HAUFOOD009',
        changedAt: AFTER,
        reason: 'Synthetic stale Access-ID change.',
        correlationId: 'COR-ID-STALE',
        environment: 'TEST',
        idempotencyKey: 'access-id-stale-0000001',
        historyId: 'HISTORY-ID-STALE',
        auditId: 'AUDIT-ID-STALE',
      }),
    ).rejects.toMatchObject({ code: 'ACCESS_WRITE_CONFLICT', status: 409 });
    await expect(db.prepare('SELECT access_id_normalized FROM accounts').first()).resolves.toEqual({
      access_id_normalized: 'HAU.FOOD.001',
    });
    await expect(db.prepare('SELECT COUNT(*) AS count FROM access_id_reservations').first()).resolves.toEqual(
      {
        count: 1,
      },
    );
    await expect(db.prepare('SELECT COUNT(*) AS count FROM access_id_history').first()).resolves.toEqual({
      count: 0,
    });
  });

  it('rejects Access-ID changes that collide with a username inside the guarded write', async () => {
    const db = await database();
    await insertAccount(db, {
      id: 'ACCOUNT-2',
      accessId: 'HAU.OTHER.001',
      username: 'HAU.USER.009',
    });
    await db
      .prepare(
        `INSERT INTO access_id_reservations
         (collision_key, account_id, access_id_snapshot, reserved_at, reservation_reason)
         VALUES ('HAUFOOD001', 'ACCOUNT-1', 'HAU.FOOD.001', ?1, 'ACCOUNT_BASELINE')`,
      )
      .bind(BEFORE)
      .run();
    const repository = createD1AccessManagementRepository(db);

    await expect(
      repository.changeAccessId({
        account: account({ accessIdNormalized: 'HAU.FOOD.001' }),
        actor: { id: 'OWNER-1', accessIdNormalized: 'HAU.OWNER.001' },
        newAccessId: 'HAU-USER-009',
        collisionKey: 'HAUUSER009',
        changedAt: AFTER,
        reason: 'Synthetic username collision.',
        correlationId: 'COR-ID-USERNAME',
        environment: 'TEST',
        idempotencyKey: 'access-id-username-0001',
        historyId: 'HISTORY-ID-USERNAME',
        auditId: 'AUDIT-ID-USERNAME',
      }),
    ).rejects.toMatchObject({ code: 'ACCESS_WRITE_CONFLICT', status: 409 });
    await expect(
      db.prepare("SELECT access_id_normalized FROM accounts WHERE id = 'ACCOUNT-1'").first(),
    ).resolves.toEqual({
      access_id_normalized: 'HAU.FOOD.001',
    });
    await expect(db.prepare('SELECT COUNT(*) AS count FROM access_id_history').first()).resolves.toEqual({
      count: 0,
    });
  });

  it('persists access-policy replay identity, target, and fingerprint in the D1 idempotency record', async () => {
    const db = await database();
    const repository = createD1AccessManagementRepository(db);
    const idempotency = {
      scope: 'access-update-policy',
      key: 'access-policy-replay-0001',
      actorAccountId: 'OWNER-1',
      requestFingerprint: 'FP-POLICY-ONE',
      result: { changed: true, accountId: 'ACCOUNT-1', revision: '2:2026-08-03T00:01:00.000Z' },
      createdAt: AFTER,
    };
    await repository.updateAccessPolicy({
      account: account(),
      nextAccount: nextAccount(),
      actor: { id: 'OWNER-1' },
      changedAt: AFTER,
      reason: 'Synthetic policy replay binding.',
      correlationId: 'COR-POLICY-REPLAY',
      idempotencyKey: idempotency.key,
      changeId: 'CHANGE-POLICY-REPLAY',
      auditId: 'AUDIT-POLICY-REPLAY',
      idempotency,
    });
    await expect(repository.getIdempotency(idempotency.scope, idempotency.key)).resolves.toEqual({
      actorAccountId: 'OWNER-1',
      requestFingerprint: 'FP-POLICY-ONE',
      result: idempotency.result,
    });
  });

  it('projects and consumes real 0031/0032 link and account-audit contexts in Miniflare D1', async () => {
    const db = await database({ activityHistory: true });
    const foundation = createD1IdentityFoundationRepository(db);
    const repository = createD1AccessManagementRepository(db);
    const personId = 'PER-423E4567-E89B-42D3-A456-426614174000';
    await foundation.createPerson({ personId, sourceProvenanceEnvelope: null, createdAt: BEFORE });
    await foundation.createAccountStaffLink(
      {
        id: 'LNK-ACTIVITY-0001',
        accountId: 'ACCOUNT-1',
        personId,
        state: 'ACTIVE',
        sourceProvenanceEnvelope: null,
        createdAt: BEFORE,
        updatedAt: BEFORE,
      },
      { correlationId: 'COR-LINK-CREATE-0001' },
    );

    await repository.changeAccessId({
      account: account({ accessIdNormalized: 'HAU.FOOD.001' }),
      actor: { id: 'OWNER-1', accessIdNormalized: 'HAU.OWNER.001' },
      newAccessId: 'HAU.FOOD.009',
      collisionKey: 'HAUFOOD009',
      changedAt: AFTER,
      reason: 'Synthetic activity projection verification.',
      correlationId: 'COR-ACCESS-ID-0001',
      environment: 'TEST',
      idempotencyKey: 'access-id-activity-0001',
      historyId: 'ACCESS-HISTORY-0001',
      auditId: 'AUDIT-ACTIVITY-0001',
    });
    await foundation.updateAccountStaffLinkState({
      id: 'LNK-ACTIVITY-0001',
      state: 'REVOKED',
      updatedAt: '2026-08-03T00:02:00.000Z',
      correlationId: 'COR-LINK-STATE-0001',
    });
    await foundation.createStaffAssignment(
      {
        id: 'ASN-ACTIVITY-0001',
        personId,
        assignmentFingerprint: 'FP-ACTIVITY-ASSIGNMENT-0001',
        protectedAssignmentEnvelope: 'v1.synthetic.assignment.activity',
        state: 'ACTIVE',
        effectiveFrom: '2026-08-03T01:00:00.000Z',
        effectiveTo: '2026-08-03T02:00:00.000Z',
        sourceProvenanceEnvelope: null,
        createdAt: '2026-08-03T00:03:00.000Z',
        updatedAt: '2026-08-03T00:03:00.000Z',
      },
      { correlationId: 'COR-ASSIGNMENT-CREATE-0001' },
    );
    await foundation.updateStaffAssignmentState({
      id: 'ASN-ACTIVITY-0001',
      state: 'HISTORICAL',
      updatedAt: '2026-08-03T00:04:00.000Z',
      correlationId: 'COR-ASSIGNMENT-STATE-0001',
    });
    await foundation.updateStaffAssignmentEffectiveWindow({
      id: 'ASN-ACTIVITY-0001',
      effectiveFrom: '2026-08-03T01:30:00.000Z',
      effectiveTo: '2026-08-03T02:30:00.000Z',
      updatedAt: '2026-08-03T00:05:00.000Z',
      correlationId: 'COR-ASSIGNMENT-WINDOW-0001',
    });

    await expect(
      db
        .prepare(
          `SELECT event_type, action_code, person_id, account_id, account_staff_link_id,
                  account_access_id_snapshot, correlation_id
           FROM staff_account_activity_history
           ORDER BY occurred_at, event_id`,
        )
        .all(),
    ).resolves.toMatchObject({
      results: [
        {
          event_type: 'ACCOUNT_STAFF_LINK',
          action_code: 'LINK_CREATED',
          person_id: personId,
          account_id: 'ACCOUNT-1',
          account_staff_link_id: 'LNK-ACTIVITY-0001',
          account_access_id_snapshot: null,
          correlation_id: 'COR-LINK-CREATE-0001',
        },
        {
          event_type: 'ACCOUNT_AUDIT',
          action_code: 'ACCESS_ID_CHANGED',
          person_id: personId,
          account_id: 'ACCOUNT-1',
          account_staff_link_id: 'LNK-ACTIVITY-0001',
          account_access_id_snapshot: 'HAU.FOOD.009',
          correlation_id: 'COR-ACCESS-ID-0001',
        },
        {
          event_type: 'ACCOUNT_STAFF_LINK',
          action_code: 'LINK_STATE_CHANGED',
          person_id: personId,
          account_id: 'ACCOUNT-1',
          account_staff_link_id: 'LNK-ACTIVITY-0001',
          account_access_id_snapshot: null,
          correlation_id: 'COR-LINK-STATE-0001',
        },
        {
          event_type: 'STAFF_ASSIGNMENT',
          action_code: 'ASSIGNMENT_CREATED',
          person_id: personId,
          account_id: null,
          account_staff_link_id: null,
          account_access_id_snapshot: null,
          correlation_id: 'COR-ASSIGNMENT-CREATE-0001',
        },
        {
          event_type: 'STAFF_ASSIGNMENT',
          action_code: 'ASSIGNMENT_STATE_CHANGED',
          person_id: personId,
          account_id: null,
          account_staff_link_id: null,
          account_access_id_snapshot: null,
          correlation_id: 'COR-ASSIGNMENT-STATE-0001',
        },
        {
          event_type: 'STAFF_ASSIGNMENT',
          action_code: 'ASSIGNMENT_EFFECTIVE_WINDOW_CHANGED',
          person_id: personId,
          account_id: null,
          account_staff_link_id: null,
          account_access_id_snapshot: null,
          correlation_id: 'COR-ASSIGNMENT-WINDOW-0001',
        },
      ],
    });
    await expect(
      db.prepare('SELECT COUNT(*) AS count FROM staff_account_activity_audit_context').first(),
    ).resolves.toEqual({ count: 0 });
    await expect(
      db.prepare('SELECT COUNT(*) AS count FROM staff_account_activity_transition_context').first(),
    ).resolves.toEqual({ count: 0 });
    await expect(
      db.prepare("UPDATE staff_account_activity_history SET action_code = 'LINK_CREATED'").run(),
    ).rejects.toThrow(/append-only/u);
    await expect(
      db
        .prepare(
          "UPDATE account_staff_links SET state = 'QUARANTINED', updated_at = '2026-08-03T00:06:00.000Z' WHERE id = 'LNK-ACTIVITY-0001'",
        )
        .run(),
    ).rejects.toThrow(/context/u);
    await expect(
      db
        .prepare(
          "UPDATE staff_assignments SET assignment_fingerprint = 'FP-ACTIVITY-ASSIGNMENT-OTHER' WHERE id = 'ASN-ACTIVITY-0001'",
        )
        .run(),
    ).rejects.toThrow(/immutable/u);
    await expect(db.prepare("DELETE FROM audit_log WHERE id = 'AUDIT-ACTIVITY-0001'").run()).rejects.toThrow(
      /append-only/u,
    );
  });

  it('executes every account-audit producer and unprojected safety branch through real Miniflare D1', async () => {
    const db = await database({ activityHistory: true, accountApplications: true });
    const foundation = createD1IdentityFoundationRepository(db);
    const access = createD1AccessManagementRepository(db);
    const applications = createD1AccountApplicationRepository(db);
    const accessChangedAt = '2026-08-03T00:01:00.000Z';
    const statusChangedAt = '2026-08-03T00:02:00.000Z';
    const activationAt = '2026-08-03T00:03:00.000Z';
    const noLinkActivationAt = '2026-08-03T00:04:00.000Z';
    const accessStarterAt = '2026-08-03T00:05:00.000Z';
    const applicationStarterAt = '2026-08-03T00:06:00.000Z';
    const active = await createActivityLink(foundation, { accountId: 'ACCOUNT-1', suffix: '101' });

    await access.changeAccessId({
      account: account({ accessIdNormalized: 'HAU.FOOD.001' }),
      actor: { id: 'OWNER-1', accessIdNormalized: 'HAU.OWNER.001' },
      newAccessId: 'HAU.FOOD.009',
      collisionKey: 'HAUFOOD009',
      changedAt: accessChangedAt,
      reason: 'Synthetic real D1 access-ID producer coverage.',
      correlationId: 'COR-ACCESS-ID-REAL',
      environment: 'TEST',
      idempotencyKey: 'access-id-real-0001',
      historyId: 'ACCESS-HISTORY-REAL-0001',
      auditId: 'AUDIT-ACCESS-ID-REAL-0001',
    });
    await access.setAccountStatus({
      account: account({
        accessIdNormalized: 'HAU.FOOD.009',
        credentialVersion: 2,
        updatedAt: accessChangedAt,
      }),
      actor: { id: 'OWNER-1' },
      nextStatus: 'LOCKED',
      changedAt: statusChangedAt,
      reason: 'Synthetic real D1 status producer coverage.',
      correlationId: 'COR-STATUS-REAL',
      auditId: 'AUDIT-STATUS-REAL-0001',
      idempotency: statusIdempotency('status-real-0001', statusChangedAt),
    });

    await insertAccount(db, {
      id: 'ACCOUNT-ACTIVATION-REAL',
      accessId: 'HAU.ACTIVATION.001',
    });
    const activation = await createActivityLink(foundation, {
      accountId: 'ACCOUNT-ACTIVATION-REAL',
      suffix: '102',
    });
    await insertApplication(db, {
      id: 'APP-ACTIVATION-REAL',
      state: 'APPROVED_ACTIVATION_REQUIRED',
      revision: 4,
      approvedAccountId: 'ACCOUNT-ACTIVATION-REAL',
      administratorReviewerId: 'ACCOUNT-1',
    });
    await applications.transitionApplication({
      applicationId: 'APP-ACTIVATION-REAL',
      fromState: 'APPROVED_ACTIVATION_REQUIRED',
      toState: 'ACTIVE',
      expectedRevision: 4,
      actorAccountId: 'ACCOUNT-ACTIVATION-REAL',
      idempotencyKey: 'application-activation-real-0001',
      occurredAt: activationAt,
      history: applicationHistory({
        id: 'HISTORY-ACTIVATION-REAL-0001',
        applicationId: 'APP-ACTIVATION-REAL',
        fromState: 'APPROVED_ACTIVATION_REQUIRED',
        toState: 'ACTIVE',
        expectedRevision: 4,
        createdAt: activationAt,
      }),
      audit: applicationAudit({
        id: 'AUDIT-APPLICATION-ACTIVATION-REAL-0001',
        action: 'ACCOUNT_APPLICATION_ACTIVATED',
        applicationId: 'APP-ACTIVATION-REAL',
        actorAccountId: 'ACCOUNT-ACTIVATION-REAL',
        createdAt: activationAt,
      }),
      conditionalAccountAudit: applicationAudit({
        id: 'AUDIT-ACCOUNT-ACTIVATION-REAL-0001',
        action: 'ACCOUNT_APPLICATION_ACTIVATED',
        applicationId: 'APP-ACTIVATION-REAL',
        accountId: 'ACCOUNT-ACTIVATION-REAL',
        actorAccountId: 'ACCOUNT-ACTIVATION-REAL',
        createdAt: activationAt,
      }),
    });

    await insertAccount(db, { id: 'ACCOUNT-ACTIVATION-NO-LINK', accessId: 'HAU.ACTIVATION.002' });
    await insertApplication(db, {
      id: 'APP-ACTIVATION-NO-LINK',
      state: 'APPROVED_ACTIVATION_REQUIRED',
      revision: 4,
      approvedAccountId: 'ACCOUNT-ACTIVATION-NO-LINK',
      administratorReviewerId: 'ACCOUNT-1',
    });
    await applications.transitionApplication({
      applicationId: 'APP-ACTIVATION-NO-LINK',
      fromState: 'APPROVED_ACTIVATION_REQUIRED',
      toState: 'ACTIVE',
      expectedRevision: 4,
      actorAccountId: 'ACCOUNT-ACTIVATION-NO-LINK',
      idempotencyKey: 'application-activation-no-link-0001',
      occurredAt: noLinkActivationAt,
      history: applicationHistory({
        id: 'HISTORY-ACTIVATION-NO-LINK-0001',
        applicationId: 'APP-ACTIVATION-NO-LINK',
        fromState: 'APPROVED_ACTIVATION_REQUIRED',
        toState: 'ACTIVE',
        expectedRevision: 4,
        createdAt: noLinkActivationAt,
      }),
      audit: applicationAudit({
        id: 'AUDIT-APPLICATION-ACTIVATION-NO-LINK-0001',
        action: 'ACCOUNT_APPLICATION_ACTIVATED',
        applicationId: 'APP-ACTIVATION-NO-LINK',
        actorAccountId: 'ACCOUNT-ACTIVATION-NO-LINK',
        createdAt: noLinkActivationAt,
      }),
      conditionalAccountAudit: applicationAudit({
        id: 'AUDIT-ACCOUNT-ACTIVATION-NO-LINK-0001',
        action: 'ACCOUNT_APPLICATION_ACTIVATED',
        applicationId: 'APP-ACTIVATION-NO-LINK',
        accountId: 'ACCOUNT-ACTIVATION-NO-LINK',
        createdAt: noLinkActivationAt,
      }),
    });

    await access.createStarterAccount({
      account: {
        id: 'ACCOUNT-STARTER-ACCESS',
        accessIdNormalized: 'HAU.STARTER.ACCESS',
        status: 'STARTER',
        roleId: 'DOL_STAFF',
        defaultCommitteeId: '',
        committeeIds: [],
        accessProfile: null,
        temporaryCredential: { hash: 'synthetic-access-starter' },
        createdAt: accessStarterAt,
        lendingEligible: false,
        institutionId: '',
        departmentId: '',
      },
      actor: { id: 'OWNER-1' },
      collisionKey: 'HAUSTARTERACCESS',
      reason: 'Synthetic real D1 access starter producer coverage.',
      correlationId: 'COR-STARTER-ACCESS-REAL',
      auditId: 'AUDIT-STARTER-ACCESS-REAL-0001',
    });

    await insertApplication(db, {
      id: 'APP-STARTER-APPLICATION',
      state: 'PENDING_DIRECTOR_APPROVAL',
      revision: 3,
      administratorReviewerId: 'ACCOUNT-1',
    });
    await applications.approveApplication({
      applicationId: 'APP-STARTER-APPLICATION',
      expectedRevision: 3,
      actorAccountId: 'ACCOUNT-1',
      idempotencyKey: 'application-starter-real-0001',
      approvedAt: applicationStarterAt,
      starterAccount: {
        id: 'ACCOUNT-STARTER-APPLICATION',
        accessIdNormalized: 'HAU.STARTER.APPLICATION',
        collisionKey: 'HAUSTARTERAPPLICATION',
        roleId: 'DOL_STAFF',
        defaultCommitteeId: '',
        committeeIds: [],
        accessProfile: null,
        temporaryCredential: { hash: 'synthetic-application-starter' },
        createdAt: applicationStarterAt,
        lendingEligible: false,
        institutionId: '',
        departmentId: '',
        usernameNormalized: 'synthetic.application.starter',
        verifiedEmailFingerprint: 'KEYED-EMAIL-FP',
        profileDepartmentId: 'USC-DEPT-DOL',
        profileCourseId: '',
        profileYearLevel: null,
      },
      history: applicationHistory({
        id: 'HISTORY-STARTER-APPLICATION-REAL-0001',
        applicationId: 'APP-STARTER-APPLICATION',
        fromState: 'PENDING_DIRECTOR_APPROVAL',
        toState: 'APPROVED_ACTIVATION_REQUIRED',
        expectedRevision: 3,
        createdAt: applicationStarterAt,
      }),
      accountAudit: applicationAudit({
        id: 'AUDIT-STARTER-APPLICATION-REAL-0001',
        action: 'STARTER_ACCOUNT_CREATED',
        applicationId: 'APP-STARTER-APPLICATION',
        accountId: 'ACCOUNT-STARTER-APPLICATION',
        createdAt: applicationStarterAt,
      }),
      applicationAudit: applicationAudit({
        id: 'AUDIT-APPLICATION-APPROVAL-REAL-0001',
        action: 'ACCOUNT_APPLICATION_DIRECTOR_APPROVED',
        applicationId: 'APP-STARTER-APPLICATION',
        createdAt: applicationStarterAt,
      }),
      allowSameReviewer: true,
    });

    const safetyAccounts = [
      { id: 'ACCOUNT-NO-LINK', accessId: 'HAU.SAFETY.001' },
      { id: 'ACCOUNT-AMBIGUOUS', accessId: 'HAU.SAFETY.002' },
      { id: 'ACCOUNT-REVOKED', accessId: 'HAU.SAFETY.003' },
      { id: 'ACCOUNT-QUARANTINED', accessId: 'HAU.SAFETY.004' },
      { id: 'ACCOUNT-MALFORMED-CORRELATION', accessId: 'HAU.SAFETY.005' },
      { id: 'ACCOUNT-MALFORMED-TIMESTAMP', accessId: 'HAU.SAFETY.006' },
    ];
    for (const safetyAccount of safetyAccounts) await insertAccount(db, safetyAccount);
    await createActivityLink(foundation, { accountId: 'ACCOUNT-AMBIGUOUS', suffix: '103' });
    // The production partial-unique index prevents this state. Remove it only in
    // this ephemeral D1 fixture to prove that a pre-existing corrupt/legacy
    // ambiguous source has no canonical projection; the producer still uses the
    // real repository statement against the migrated table and triggers.
    await db.prepare('DROP INDEX uq_account_staff_links_active_account').run();
    await createActivityLink(foundation, { accountId: 'ACCOUNT-AMBIGUOUS', suffix: '104' });
    await createActivityLink(foundation, { accountId: 'ACCOUNT-REVOKED', suffix: '105', state: 'REVOKED' });
    await createActivityLink(foundation, {
      accountId: 'ACCOUNT-QUARANTINED',
      suffix: '106',
      state: 'QUARANTINED',
    });
    await createActivityLink(foundation, { accountId: 'ACCOUNT-MALFORMED-CORRELATION', suffix: '107' });
    await createActivityLink(foundation, { accountId: 'ACCOUNT-MALFORMED-TIMESTAMP', suffix: '108' });

    const statusSafetyCases = [
      {
        id: 'ACCOUNT-NO-LINK',
        accessId: 'HAU.SAFETY.001',
        auditId: 'AUDIT-NO-LINK-REAL-0001',
        correlationId: 'COR-NO-LINK-REAL',
        changedAt: '2026-08-03T00:07:00.000Z',
      },
      {
        id: 'ACCOUNT-AMBIGUOUS',
        accessId: 'HAU.SAFETY.002',
        auditId: 'AUDIT-AMBIGUOUS-REAL-0001',
        correlationId: 'COR-AMBIGUOUS-REAL',
        changedAt: '2026-08-03T00:08:00.000Z',
      },
      {
        id: 'ACCOUNT-REVOKED',
        accessId: 'HAU.SAFETY.003',
        auditId: 'AUDIT-REVOKED-REAL-0001',
        correlationId: 'COR-REVOKED-REAL',
        changedAt: '2026-08-03T00:09:00.000Z',
      },
      {
        id: 'ACCOUNT-QUARANTINED',
        accessId: 'HAU.SAFETY.004',
        auditId: 'AUDIT-QUARANTINED-REAL-0001',
        correlationId: 'COR-QUARANTINED-REAL',
        changedAt: '2026-08-03T00:10:00.000Z',
      },
      {
        id: 'ACCOUNT-MALFORMED-CORRELATION',
        accessId: 'HAU.SAFETY.005',
        auditId: 'AUDIT-MALFORMED-CORRELATION-REAL-0001',
        correlationId: ' ',
        changedAt: '2026-08-03T00:11:00.000Z',
      },
      {
        id: 'ACCOUNT-MALFORMED-TIMESTAMP',
        accessId: 'HAU.SAFETY.006',
        auditId: 'AUDIT-MALFORMED-TIMESTAMP-REAL-0001',
        correlationId: 'COR-MALFORMED-TIMESTAMP-REAL',
        changedAt: '2026-08-03T00:12:00.00Z',
      },
    ];
    for (const safetyCase of statusSafetyCases) {
      await access.setAccountStatus({
        account: account({ id: safetyCase.id, accessIdNormalized: safetyCase.accessId }),
        actor: { id: 'OWNER-1' },
        nextStatus: 'LOCKED',
        changedAt: safetyCase.changedAt,
        reason: 'Synthetic real D1 unprojected safety coverage.',
        correlationId: safetyCase.correlationId,
        auditId: safetyCase.auditId,
        idempotency: statusIdempotency(`status-${safetyCase.id}`, safetyCase.changedAt),
      });
    }

    const insertLegacyAudit = ({ id, createdAt, action, entityType, entityId, correlationId }) =>
      db
        .prepare(
          `INSERT INTO audit_log (
             id, created_at, action, entity_type, entity_id, actor_account_id,
             before_json, after_json, correlation_id, notes
           ) VALUES (?1, ?2, ?3, ?4, ?5, 'OWNER-1', '{}', '{}', ?6, '')`,
        )
        .bind(id, createdAt, action, entityType, entityId, correlationId)
        .run();
    await insertLegacyAudit({
      id: 'AUDIT-AUTHENTICATION-SENTINEL-REAL-0001',
      createdAt: '2026-08-03T00:13:00.000Z',
      action: 'AUTHENTICATION',
      entityType: 'AUTHENTICATION',
      entityId: 'AUTHENTICATION',
      correlationId: 'COR-AUTHENTICATION-SENTINEL',
    });
    await insertLegacyAudit({
      id: 'AUDIT-NON-ACCOUNT-REAL-0001',
      createdAt: '2026-08-03T00:14:00.000Z',
      action: 'ACCOUNT_STATUS_CHANGED',
      entityType: 'REQUEST',
      entityId: 'REQUEST-SYNTHETIC-0001',
      correlationId: 'COR-NON-ACCOUNT-REAL',
    });
    await insertLegacyAudit({
      id: 'AUDIT-NONEXISTENT-ACCOUNT-REAL-0001',
      createdAt: '2026-08-03T00:15:00.000Z',
      action: 'ACCOUNT_STATUS_CHANGED',
      entityType: 'ACCOUNT',
      entityId: 'ACCOUNT-NONEXISTENT',
      correlationId: 'COR-NONEXISTENT-ACCOUNT-REAL',
    });
    await insertLegacyAudit({
      id: 'AUDIT-DELAYED-REAL-0001',
      createdAt: '2026-08-03T00:16:00.000Z',
      action: 'ACCOUNT_STATUS_CHANGED',
      entityType: 'ACCOUNT',
      entityId: 'ACCOUNT-1',
      correlationId: 'COR-DELAYED-REAL',
    });
    await db
      .prepare(
        `INSERT INTO staff_account_activity_audit_context (
           audit_id, person_id, account_id, account_staff_link_id, link_state,
           account_access_id_snapshot, action_code, correlation_id, prepared_at
         ) VALUES (?1, ?2, 'ACCOUNT-1', ?3, 'ACTIVE', 'HAU.FOOD.009',
           'ACCOUNT_STATUS_CHANGED', ?4, ?5)`,
      )
      .bind(
        'AUDIT-DELAYED-REAL-0001',
        active.personId,
        active.linkId,
        'COR-DELAYED-REAL',
        '2026-08-03T00:17:00.000Z',
      )
      .run();
    await expect(
      insertLegacyAudit({
        id: 'AUDIT-DELAYED-REAL-0001',
        createdAt: '2026-08-03T00:18:00.000Z',
        action: 'ACCOUNT_STATUS_CHANGED',
        entityType: 'ACCOUNT',
        entityId: 'ACCOUNT-1',
        correlationId: 'COR-DELAYED-REAL',
      }),
    ).rejects.toThrow();

    const conflictContext = db
      .prepare(
        `INSERT INTO staff_account_activity_audit_context (
           audit_id, person_id, account_id, account_staff_link_id, link_state,
           account_access_id_snapshot, action_code, correlation_id, prepared_at
         ) VALUES (?1, ?2, 'ACCOUNT-1', ?3, 'ACTIVE', 'HAU.FOOD.009',
           'ACCOUNT_STATUS_CHANGED', ?4, ?5)`,
      )
      .bind(
        'AUDIT-CONTEXT-CONFLICT-REAL-0001',
        active.personId,
        active.linkId,
        'COR-CONTEXT-EXPECTED',
        '2026-08-03T00:19:00.000Z',
      );
    const conflictAudit = db
      .prepare(
        `INSERT INTO audit_log (
           id, created_at, action, entity_type, entity_id, actor_account_id,
           before_json, after_json, correlation_id, notes
         ) VALUES (?1, '2026-08-03T00:19:00.000Z', 'ACCOUNT_STATUS_CHANGED', 'ACCOUNT',
           'ACCOUNT-1', 'OWNER-1', '{}', '{}', 'COR-CONTEXT-WRONG', '')`,
      )
      .bind('AUDIT-CONTEXT-CONFLICT-REAL-0001');
    await expect(db.batch([conflictContext, conflictAudit])).rejects.toThrow(/context mismatch/u);

    const accountAuditHistory = await db
      .prepare(
        `SELECT action_code, account_id, person_id, account_access_id_snapshot
         FROM staff_account_activity_history
         WHERE event_type = 'ACCOUNT_AUDIT'
         ORDER BY occurred_at, event_id`,
      )
      .all();
    expect(accountAuditHistory.results).toEqual([
      {
        action_code: 'ACCESS_ID_CHANGED',
        account_id: 'ACCOUNT-1',
        person_id: active.personId,
        account_access_id_snapshot: 'HAU.FOOD.009',
      },
      {
        action_code: 'ACCOUNT_STATUS_CHANGED',
        account_id: 'ACCOUNT-1',
        person_id: active.personId,
        account_access_id_snapshot: 'HAU.FOOD.009',
      },
      {
        action_code: 'ACCOUNT_APPLICATION_ACTIVATED',
        account_id: 'ACCOUNT-ACTIVATION-REAL',
        person_id: activation.personId,
        account_access_id_snapshot: 'HAU.ACTIVATION.001',
      },
    ]);
    await expect(
      db
        .prepare(
          `SELECT id, entity_type, entity_id
           FROM audit_log
           WHERE id IN (
             'AUDIT-ACCOUNT-ACTIVATION-REAL-0001',
             'AUDIT-AMBIGUOUS-REAL-0001',
             'AUDIT-APPLICATION-ACTIVATION-REAL-0001',
             'AUDIT-APPLICATION-APPROVAL-REAL-0001',
             'AUDIT-MALFORMED-CORRELATION-REAL-0001',
             'AUDIT-MALFORMED-TIMESTAMP-REAL-0001',
             'AUDIT-NO-LINK-REAL-0001',
             'AUDIT-QUARANTINED-REAL-0001',
             'AUDIT-REVOKED-REAL-0001'
           )
           ORDER BY id`,
        )
        .all(),
    ).resolves.toMatchObject({
      results: [
        {
          id: 'AUDIT-ACCOUNT-ACTIVATION-REAL-0001',
          entity_type: 'ACCOUNT',
          entity_id: 'ACCOUNT-ACTIVATION-REAL',
        },
        {
          id: 'AUDIT-AMBIGUOUS-REAL-0001',
          entity_type: 'ACCOUNT',
          entity_id: 'ACCOUNT-AMBIGUOUS',
        },
        {
          id: 'AUDIT-APPLICATION-ACTIVATION-REAL-0001',
          entity_type: 'ACCOUNT_APPLICATION',
          entity_id: 'APP-ACTIVATION-REAL',
        },
        {
          id: 'AUDIT-APPLICATION-APPROVAL-REAL-0001',
          entity_type: 'ACCOUNT_APPLICATION',
          entity_id: 'APP-STARTER-APPLICATION',
        },
        {
          id: 'AUDIT-MALFORMED-CORRELATION-REAL-0001',
          entity_type: 'ACCOUNT',
          entity_id: 'ACCOUNT-MALFORMED-CORRELATION',
        },
        {
          id: 'AUDIT-MALFORMED-TIMESTAMP-REAL-0001',
          entity_type: 'ACCOUNT',
          entity_id: 'ACCOUNT-MALFORMED-TIMESTAMP',
        },
        {
          id: 'AUDIT-NO-LINK-REAL-0001',
          entity_type: 'ACCOUNT',
          entity_id: 'ACCOUNT-NO-LINK',
        },
        {
          id: 'AUDIT-QUARANTINED-REAL-0001',
          entity_type: 'ACCOUNT',
          entity_id: 'ACCOUNT-QUARANTINED',
        },
        {
          id: 'AUDIT-REVOKED-REAL-0001',
          entity_type: 'ACCOUNT',
          entity_id: 'ACCOUNT-REVOKED',
        },
      ],
    });
    await expect(
      db
        .prepare(
          `SELECT id, entity_type, entity_id
           FROM audit_log
           WHERE id IN (
             'AUDIT-STARTER-ACCESS-REAL-0001',
             'AUDIT-STARTER-APPLICATION-REAL-0001',
             'AUDIT-APPLICATION-ACTIVATION-NO-LINK-0001',
             'AUDIT-AUTHENTICATION-SENTINEL-REAL-0001',
             'AUDIT-NON-ACCOUNT-REAL-0001',
             'AUDIT-NONEXISTENT-ACCOUNT-REAL-0001',
             'AUDIT-DELAYED-REAL-0001'
           )
           ORDER BY id`,
        )
        .all(),
    ).resolves.toMatchObject({
      results: [
        {
          id: 'AUDIT-APPLICATION-ACTIVATION-NO-LINK-0001',
          entity_type: 'ACCOUNT_APPLICATION',
          entity_id: 'APP-ACTIVATION-NO-LINK',
        },
        {
          id: 'AUDIT-AUTHENTICATION-SENTINEL-REAL-0001',
          entity_type: 'AUTHENTICATION',
          entity_id: 'AUTHENTICATION',
        },
        { id: 'AUDIT-DELAYED-REAL-0001', entity_type: 'ACCOUNT', entity_id: 'ACCOUNT-1' },
        {
          id: 'AUDIT-NON-ACCOUNT-REAL-0001',
          entity_type: 'REQUEST',
          entity_id: 'REQUEST-SYNTHETIC-0001',
        },
        {
          id: 'AUDIT-NONEXISTENT-ACCOUNT-REAL-0001',
          entity_type: 'ACCOUNT',
          entity_id: 'ACCOUNT-NONEXISTENT',
        },
        {
          id: 'AUDIT-STARTER-ACCESS-REAL-0001',
          entity_type: 'ACCOUNT',
          entity_id: 'ACCOUNT-STARTER-ACCESS',
        },
        {
          id: 'AUDIT-STARTER-APPLICATION-REAL-0001',
          entity_type: 'ACCOUNT',
          entity_id: 'ACCOUNT-STARTER-APPLICATION',
        },
      ],
    });
    await expect(
      db
        .prepare(
          `SELECT COUNT(*) AS count
           FROM audit_log
           WHERE id = 'AUDIT-ACCOUNT-ACTIVATION-NO-LINK-0001'`,
        )
        .first(),
    ).resolves.toEqual({ count: 0 });
    await expect(
      db
        .prepare(
          `SELECT COUNT(*) AS count
           FROM staff_account_activity_history
           WHERE source_event_id IN (
             'AUDIT-STARTER-ACCESS-REAL-0001',
             'AUDIT-STARTER-APPLICATION-REAL-0001',
             'AUDIT-APPLICATION-APPROVAL-REAL-0001',
             'AUDIT-APPLICATION-ACTIVATION-NO-LINK-0001',
             'AUDIT-AUTHENTICATION-SENTINEL-REAL-0001',
             'AUDIT-NON-ACCOUNT-REAL-0001',
             'AUDIT-NONEXISTENT-ACCOUNT-REAL-0001',
             'AUDIT-DELAYED-REAL-0001',
             'AUDIT-NO-LINK-REAL-0001',
             'AUDIT-AMBIGUOUS-REAL-0001',
             'AUDIT-REVOKED-REAL-0001',
             'AUDIT-QUARANTINED-REAL-0001',
             'AUDIT-MALFORMED-CORRELATION-REAL-0001',
             'AUDIT-MALFORMED-TIMESTAMP-REAL-0001'
           )`,
        )
        .first(),
    ).resolves.toEqual({ count: 0 });
    await expect(
      db
        .prepare(
          `SELECT audit_id
           FROM staff_account_activity_audit_context
           ORDER BY audit_id`,
        )
        .all(),
    ).resolves.toMatchObject({
      results: [{ audit_id: 'AUDIT-DELAYED-REAL-0001' }],
    });
    await expect(
      db
        .prepare(
          `SELECT COUNT(*) AS count
           FROM staff_account_activity_audit_context
           WHERE audit_id = 'AUDIT-CONTEXT-CONFLICT-REAL-0001'`,
        )
        .first(),
    ).resolves.toEqual({ count: 0 });
  }, 30_000);
});
