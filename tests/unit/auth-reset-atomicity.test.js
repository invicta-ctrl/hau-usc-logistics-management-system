import { timingSafeEqual, webcrypto } from 'node:crypto';
import { Miniflare } from 'miniflare';
import { afterEach, describe, expect, it } from 'vitest';
import { createPasswordKdf, createTokenCrypto } from '../../src/server/auth/crypto.js';
import { createInMemoryAuthRepository } from '../../src/server/auth/repository.js';
import { createAuthService } from '../../src/server/auth/service.js';
import { createD1AuthRepository } from '../../src/server/d1/auth-repository.js';

const CREATED_AT = '2026-08-12T00:00:00.000Z';
const NOW = '2026-08-12T00:10:00.000Z';
const EXPIRED_AT = '2026-08-12T00:09:59.999Z';
const EXPIRES_AT = '2026-08-12T00:30:00.000Z';
const TARGET_ACCOUNT_ID = 'ACCOUNT-RESET-TARGET';
const OTHER_ACCOUNT_ID = 'ACCOUNT-RESET-OTHER';
const RESET_TOKEN = 'synthetic-reset-token-not-for-production';
const RESET_PASSWORD = 'Reset!Password9472';

let miniflares = [];

afterEach(async () => {
  await Promise.all(miniflares.map((miniflare) => miniflare.dispose()));
  miniflares = [];
});

function account(overrides = {}) {
  return {
    id: TARGET_ACCOUNT_ID,
    accessIdNormalized: 'RESET-TARGET-001',
    status: 'ACTIVE',
    roleId: 'DOL_STAFF',
    committeeIds: ['MATERIALS'],
    defaultCommitteeId: 'MATERIALS',
    profile: null,
    passwordCredential: { algorithm: 'PBKDF2-SHA256', hash: 'before', salt: 'before' },
    temporaryCredential: null,
    credentialVersion: 3,
    onboardingCompletedAt: CREATED_AT,
    profileEmailVerifiedAt: CREATED_AT,
    createdAt: CREATED_AT,
    updatedAt: CREATED_AT,
    lockedAt: null,
    passwordChangedAt: '',
    lastPasswordResetAt: '',
    ...overrides,
  };
}

function otherAccount() {
  return account({
    id: OTHER_ACCOUNT_ID,
    accessIdNormalized: 'RESET-OTHER-001',
    committeeIds: ['INVENTORY_PANTRY'],
    defaultCommitteeId: 'INVENTORY_PANTRY',
  });
}

function session(id, accountId, tokenDigest) {
  return {
    id,
    accountId,
    tokenDigest,
    csrfDigest: `${tokenDigest}-csrf`,
    kind: 'AUTHENTICATED',
    credentialVersion: 3,
    issuedAt: CREATED_AT,
    expiresAt: EXPIRES_AT,
  };
}

function createService(repository) {
  let sequence = 0;
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
    rateLimiter: {
      async consume() {
        return { allowed: true, remaining: 1 };
      },
      async reset() {},
    },
    clock: { now: () => Date.parse(NOW) },
    createId: () => `SYNTHETIC-RESET-${String(++sequence).padStart(4, '0')}`,
  });
  return { service, passwordKdf, tokenCrypto };
}

async function seedRepository({ kind, repository, db, accountOverrides = {}, expiresAt = EXPIRES_AT }) {
  const target = account(accountOverrides);
  const other = otherAccount();
  if (kind === 'd1') {
    await insertD1Account(db, target);
    await insertD1Account(db, other);
  }
  const runtime = createService(repository);
  const tokenDigest = await runtime.tokenCrypto.digest(RESET_TOKEN);
  await repository.createResetToken({
    id: 'RESET-TOKEN-001',
    accountId: target.id,
    tokenDigest,
    issuedAt: CREATED_AT,
    expiresAt,
    consumedAt: null,
    issuedBy: 'ACCOUNT-RESET-ADMIN',
  });
  await repository.createSession(session('SESSION-TARGET-001', target.id, 'SESSION-TARGET-001'));
  await repository.createSession(session('SESSION-TARGET-002', target.id, 'SESSION-TARGET-002'));
  await repository.createSession(session('SESSION-OTHER-001', other.id, 'SESSION-OTHER-001'));
  await repository.appendAudit({
    id: 'AUDIT-BEFORE',
    event: 'PASSWORD_RESET_ISSUED',
    accountId: target.id,
    occurredAt: CREATED_AT,
    details: { issuedBy: 'ACCOUNT-RESET-ADMIN' },
  });
  return { ...runtime, kind, repository, db, target, tokenDigest };
}

async function createInMemoryContext(options = {}) {
  const target = account(options.accountOverrides);
  const repository = createInMemoryAuthRepository([target, otherAccount()]);
  return seedRepository({ kind: 'memory', repository, ...options });
}

async function createD1Context(options = {}) {
  const miniflare = new Miniflare({
    modules: true,
    script: 'export default { fetch() { return new Response("ok"); } }',
    d1Databases: ['DB'],
  });
  miniflares.push(miniflare);
  const db = await miniflare.getD1Database('DB');
  await createD1Schema(db);
  return seedRepository({ kind: 'd1', repository: createD1AuthRepository(db), db, ...options });
}

async function createD1Schema(db) {
  for (const statement of [
    `CREATE TABLE accounts (
      id TEXT PRIMARY KEY,
      access_id_normalized TEXT NOT NULL,
      status TEXT NOT NULL,
      role_id TEXT NOT NULL,
      default_committee_id TEXT,
      profile_full_name TEXT,
      profile_mobile_number TEXT,
      profile_email TEXT,
      password_credential_json TEXT,
      temporary_credential_json TEXT,
      credential_version INTEGER NOT NULL,
      onboarding_completed_at TEXT,
      profile_email_verified_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      locked_at TEXT,
      password_changed_at TEXT,
      last_password_reset_at TEXT
    ) STRICT`,
    `CREATE TABLE account_committees (
      account_id TEXT NOT NULL,
      committee_id TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1
    ) STRICT`,
    `CREATE TABLE account_access_profiles (
      account_id TEXT PRIMARY KEY,
      preset_id TEXT,
      workspace_ids_json TEXT,
      default_workspace_id TEXT,
      location_scope_ids_json TEXT,
      event_series_scope_ids_json TEXT,
      event_scope_ids_json TEXT,
      capability_grants_json TEXT,
      capability_denies_json TEXT
    ) STRICT`,
    `CREATE TABLE password_reset_tokens (
      token_digest TEXT PRIMARY KEY,
      id TEXT NOT NULL,
      account_id TEXT NOT NULL,
      issued_at TEXT NOT NULL,
      expires_at TEXT NOT NULL,
      consumed_at TEXT,
      issued_by TEXT NOT NULL
    ) STRICT`,
    `CREATE TABLE sessions (
      token_digest TEXT PRIMARY KEY,
      id TEXT NOT NULL,
      kind TEXT NOT NULL,
      account_id TEXT NOT NULL,
      csrf_digest TEXT NOT NULL,
      credential_version INTEGER NOT NULL,
      issued_at TEXT NOT NULL,
      expires_at TEXT NOT NULL
    ) STRICT`,
    `CREATE TABLE audit_log (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      actor_account_id TEXT NOT NULL,
      before_json TEXT NOT NULL DEFAULT '{}',
      after_json TEXT NOT NULL DEFAULT '{}',
      correlation_id TEXT NOT NULL,
      notes TEXT NOT NULL DEFAULT ''
    ) STRICT`,
    `CREATE TABLE data_revisions (
      scope TEXT PRIMARY KEY,
      revision INTEGER NOT NULL,
      updated_at TEXT NOT NULL
    ) STRICT`,
    `INSERT INTO data_revisions (scope, revision, updated_at) VALUES ('global', 0, '${CREATED_AT}')`,
  ]) {
    await db.prepare(statement).run();
  }
}

async function insertD1Account(db, value) {
  await db
    .prepare(
      `INSERT INTO accounts (
        id, access_id_normalized, status, role_id, default_committee_id,
        profile_full_name, profile_mobile_number, profile_email,
        password_credential_json, temporary_credential_json, credential_version,
        onboarding_completed_at, profile_email_verified_at, created_at, updated_at,
        locked_at, password_changed_at, last_password_reset_at
      ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18)`,
    )
    .bind(
      value.id,
      value.accessIdNormalized,
      value.status,
      value.roleId,
      value.defaultCommitteeId,
      value.profile?.fullName ?? null,
      value.profile?.mobileNumber ?? null,
      value.profile?.email ?? null,
      JSON.stringify(value.passwordCredential),
      value.temporaryCredential ? JSON.stringify(value.temporaryCredential) : null,
      value.credentialVersion,
      value.onboardingCompletedAt,
      value.profileEmailVerifiedAt,
      value.createdAt,
      value.updatedAt,
      value.lockedAt,
      value.passwordChangedAt || null,
      value.lastPasswordResetAt || null,
    )
    .run();
  for (const committeeId of value.committeeIds) {
    await db
      .prepare('INSERT INTO account_committees (account_id, committee_id, active) VALUES (?1, ?2, 1)')
      .bind(value.id, committeeId)
      .run();
  }
}

function resetRequest(context, overrides = {}) {
  return {
    tokenDigest: context.tokenDigest,
    accountId: TARGET_ACCOUNT_ID,
    expectedCredentialVersion: 3,
    passwordCredential: { algorithm: 'TEST', hash: 'after', salt: 'after' },
    resetAt: NOW,
    audit: {
      id: 'AUDIT-COMPLETED',
      event: 'PASSWORD_RESET_COMPLETED',
      accountId: TARGET_ACCOUNT_ID,
      occurredAt: NOW,
      details: {},
    },
    ...overrides,
  };
}

function completion(context, password = RESET_PASSWORD) {
  return {
    resetToken: RESET_TOKEN,
    password,
    confirmPassword: password,
  };
}

function comparableAccount(value) {
  return {
    id: value?.id ?? null,
    status: value?.status ?? null,
    credentialVersion: value?.credentialVersion ?? null,
    passwordCredential: value?.passwordCredential ?? null,
    passwordChangedAt: value?.passwordChangedAt ?? '',
    updatedAt: value?.updatedAt ?? '',
    lockedAt: value?.lockedAt ?? null,
  };
}

async function inspect(context) {
  const target = await context.repository.getAccountById(TARGET_ACCOUNT_ID);
  const token = await context.repository.getResetToken(context.tokenDigest);
  if (context.kind === 'memory') {
    const state = context.repository.inspect();
    return {
      account: comparableAccount(target),
      token,
      sessions: state.sessions
        .map((value) => ({ accountId: value.accountId, tokenDigest: value.tokenDigest }))
        .sort((left, right) => left.tokenDigest.localeCompare(right.tokenDigest)),
      memberships: target?.committeeIds ?? [],
      audits: state.auditEvents.map((value) => ({
        id: value.id,
        event: value.event,
        accountId: value.accountId,
        details: value.details,
      })),
    };
  }
  const sessions = await context.db
    .prepare('SELECT account_id, token_digest FROM sessions ORDER BY token_digest')
    .all();
  const audits = await context.db
    .prepare('SELECT id, action, entity_id, after_json FROM audit_log ORDER BY id')
    .all();
  return {
    account: comparableAccount(target),
    token,
    sessions: sessions.results.map((value) => ({
      accountId: value.account_id,
      tokenDigest: value.token_digest,
    })),
    memberships: target?.committeeIds ?? [],
    audits: audits.results.map((value) => ({
      id: value.id,
      event: value.action,
      accountId: value.entity_id,
      details: JSON.parse(value.after_json),
    })),
  };
}

async function forceSessionFailure(context) {
  if (context.kind === 'memory') {
    const original = context.repository.deleteSessionsForAccount;
    context.repository.deleteSessionsForAccount = async () => {
      throw new Error('Synthetic session failure.');
    };
    return () => {
      context.repository.deleteSessionsForAccount = original;
    };
  }
  await context.db
    .prepare(
      `CREATE TRIGGER fail_password_reset_session_revoke
       BEFORE DELETE ON sessions
       WHEN OLD.account_id = '${TARGET_ACCOUNT_ID}'
       BEGIN
         SELECT RAISE(ABORT, 'Synthetic session failure.');
       END`,
    )
    .run();
  return () => {};
}

async function forceAuditFailure(context) {
  if (context.kind === 'memory') {
    const original = context.repository.appendAudit;
    context.repository.appendAudit = async () => {
      throw new Error('Synthetic audit failure.');
    };
    return () => {
      context.repository.appendAudit = original;
    };
  }
  await context.repository.appendAudit({
    id: 'AUDIT-COMPLETED',
    event: 'PREEXISTING_AUDIT',
    accountId: TARGET_ACCOUNT_ID,
    occurredAt: CREATED_AT,
    details: {},
  });
  return () => {};
}

for (const factory of [
  { name: 'in-memory repository', create: createInMemoryContext },
  { name: 'Miniflare D1 repository', create: createD1Context },
]) {
  describe(`${factory.name} password-reset atomicity`, () => {
    it('commits credential change, target-session revocation, and completion audit together', async () => {
      const context = await factory.create();
      const before = await inspect(context);

      await expect(context.service.completePasswordReset(completion(context))).resolves.toEqual({
        state: 'PASSWORD_RESET',
      });

      const after = await inspect(context);
      expect(after.account).toMatchObject({
        status: 'ACTIVE',
        credentialVersion: before.account.credentialVersion + 1,
        passwordChangedAt: NOW,
        updatedAt: NOW,
      });
      await expect(
        context.passwordKdf.verify(RESET_PASSWORD, after.account.passwordCredential),
      ).resolves.toBe(true);
      expect(after.token).toMatchObject({ consumedAt: NOW });
      expect(after.sessions).toEqual([{ accountId: OTHER_ACCOUNT_ID, tokenDigest: 'SESSION-OTHER-001' }]);
      expect(after.memberships).toEqual(before.memberships);
      expect(after.audits).toEqual([
        ...before.audits,
        {
          id: expect.any(String),
          event: 'PASSWORD_RESET_COMPLETED',
          accountId: TARGET_ACCOUNT_ID,
          details: {},
        },
      ]);

      const afterReplay = await inspect(context);
      await expect(
        context.service.completePasswordReset(completion(context, 'Replay!Password9472')),
      ).rejects.toMatchObject({
        code: 'RESET_INVALID',
      });
      await expect(inspect(context)).resolves.toEqual(afterReplay);
    });

    it('rejects expired, disabled, revoked, and locked accounts without writing', async () => {
      for (const scenario of [
        { name: 'expired', expiresAt: EXPIRED_AT, code: 'RESET_INVALID' },
        { name: 'disabled', accountOverrides: { status: 'DISABLED' }, code: 'ACCOUNT_UNAVAILABLE' },
        { name: 'revoked', accountOverrides: { status: 'REVOKED' }, code: 'ACCOUNT_UNAVAILABLE' },
        { name: 'locked', accountOverrides: { lockedAt: NOW }, code: 'ACCOUNT_UNAVAILABLE' },
      ]) {
        const context = await factory.create(scenario);
        const before = await inspect(context);

        await expect(context.service.completePasswordReset(completion(context))).rejects.toMatchObject({
          code: scenario.code,
        });
        await expect(inspect(context)).resolves.toEqual(before);
      }
    }, 20_000);

    it('rolls back stale token and account guards with no cross-resource writes', async () => {
      const staleToken = await factory.create();
      const staleTokenBefore = await inspect(staleToken);
      await expect(
        staleToken.repository.commitPasswordReset(resetRequest(staleToken, { accountId: OTHER_ACCOUNT_ID })),
      ).rejects.toMatchObject({ code: 'RESET_CONFLICT' });
      await expect(inspect(staleToken)).resolves.toEqual(staleTokenBefore);

      const staleAccount = await factory.create();
      const staleAccountBefore = await inspect(staleAccount);
      await expect(
        staleAccount.repository.commitPasswordReset(
          resetRequest(staleAccount, { expectedCredentialVersion: 2 }),
        ),
      ).rejects.toMatchObject({ code: 'RESET_CONFLICT' });
      await expect(inspect(staleAccount)).resolves.toEqual(staleAccountBefore);
    }, 20_000);

    it('restores account, token, session, membership, and audit state after a session failure', async () => {
      const context = await factory.create();
      const restore = await forceSessionFailure(context);
      const before = await inspect(context);
      try {
        await expect(context.repository.commitPasswordReset(resetRequest(context))).rejects.toThrow();
      } finally {
        restore();
      }
      await expect(inspect(context)).resolves.toEqual(before);
    });

    it('restores account, token, session, membership, and audit state after an audit failure', async () => {
      const context = await factory.create();
      const restore = await forceAuditFailure(context);
      const before = await inspect(context);
      try {
        await expect(context.repository.commitPasswordReset(resetRequest(context))).rejects.toThrow();
      } finally {
        restore();
      }
      await expect(inspect(context)).resolves.toEqual(before);
    });

    it('allows one same-token concurrent reset winner and one safe loser', async () => {
      const context = await factory.create();
      const outcomes = await Promise.allSettled([
        context.service.completePasswordReset(completion(context, 'Winner!Password9472')),
        context.service.completePasswordReset(completion(context, 'Loser!Password9472')),
      ]);

      expect(outcomes.filter((outcome) => outcome.status === 'fulfilled')).toHaveLength(1);
      const failure = outcomes.find((outcome) => outcome.status === 'rejected');
      expect(failure?.reason).toMatchObject({ code: expect.stringMatching(/RESET_(?:INVALID|CONFLICT)/) });
      const after = await inspect(context);
      expect(after.account.credentialVersion).toBe(4);
      expect(after.token).toMatchObject({ consumedAt: NOW });
      expect(after.sessions).toEqual([{ accountId: OTHER_ACCOUNT_ID, tokenDigest: 'SESSION-OTHER-001' }]);
      expect(after.memberships).toEqual(['MATERIALS']);
      expect(after.audits.filter((event) => event.event === 'PASSWORD_RESET_COMPLETED')).toHaveLength(1);
    });
  });
}

describe('in-memory password-reset overlap regression', () => {
  it('preserves the durable winner when two distinct tokens overlap for one account', async () => {
    const context = await createInMemoryContext();
    const losingTokenDigest = await context.tokenCrypto.digest('synthetic-distinct-losing-reset-token');
    await context.repository.createResetToken({
      id: 'RESET-TOKEN-002',
      accountId: TARGET_ACCOUNT_ID,
      tokenDigest: losingTokenDigest,
      issuedAt: CREATED_AT,
      expiresAt: EXPIRES_AT,
      consumedAt: null,
      issuedBy: 'ACCOUNT-RESET-ADMIN',
    });
    const before = await inspect(context);
    const winnerCredential = { algorithm: 'TEST', hash: 'winner', salt: 'winner' };
    let releaseLoser;
    const loserGate = new Promise((resolve) => {
      releaseLoser = resolve;
    });
    const originalConsumeResetToken = context.repository.consumeResetToken;
    context.repository.consumeResetToken = async (tokenDigest, consumedAt) => {
      const consumed = await originalConsumeResetToken(tokenDigest, consumedAt);
      if (tokenDigest === losingTokenDigest) await loserGate;
      return consumed;
    };

    const winner = context.repository.commitPasswordReset(
      resetRequest(context, { passwordCredential: winnerCredential }),
    );
    const loser = context.repository.commitPasswordReset(
      resetRequest(context, {
        tokenDigest: losingTokenDigest,
        passwordCredential: { algorithm: 'TEST', hash: 'loser', salt: 'loser' },
        audit: {
          id: 'AUDIT-LOSER',
          event: 'PASSWORD_RESET_COMPLETED',
          accountId: TARGET_ACCOUNT_ID,
          occurredAt: NOW,
          details: {},
        },
      }),
    );

    try {
      await expect(winner).resolves.toMatchObject({
        credentialVersion: before.account.credentialVersion + 1,
        passwordCredential: winnerCredential,
      });
      releaseLoser();
      await expect(loser).rejects.toMatchObject({ code: 'RESET_CONFLICT' });
    } finally {
      releaseLoser();
      context.repository.consumeResetToken = originalConsumeResetToken;
    }

    const after = await inspect(context);
    const losingToken = await context.repository.getResetToken(losingTokenDigest);
    expect(after.account).toMatchObject({
      credentialVersion: before.account.credentialVersion + 1,
      passwordCredential: winnerCredential,
    });
    expect(after.token).toMatchObject({ consumedAt: NOW });
    expect(losingToken).toMatchObject({ consumedAt: null });
    expect(after.sessions).toEqual([{ accountId: OTHER_ACCOUNT_ID, tokenDigest: 'SESSION-OTHER-001' }]);
    expect(after.memberships).toEqual(before.memberships);
    expect(after.audits.filter((event) => event.event === 'PASSWORD_RESET_COMPLETED')).toEqual([
      expect.objectContaining({ id: 'AUDIT-COMPLETED', accountId: TARGET_ACCOUNT_ID }),
    ]);
  });
});
