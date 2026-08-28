import { Miniflare } from 'miniflare';
import { afterEach, describe, expect, it } from 'vitest';
import { createD1ProfileRepository } from '../../src/server/d1/profile-repository.js';

const ACCOUNT_ID = 'ACCOUNT-PROFILE-SYNTHETIC';
const NOW = '2026-08-03T12:00:00.000Z';
const NEXT = '2026-08-03T12:01:00.000Z';

let miniflare;

afterEach(async () => {
  await miniflare?.dispose();
  miniflare = null;
});

async function context() {
  miniflare = new Miniflare({
    modules: true,
    script: 'export default { fetch() { return new Response("ok"); } }',
    d1Databases: ['DB'],
  });
  const db = await miniflare.getD1Database('DB');
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
      profile_email_verified_at TEXT,
      username_normalized TEXT,
      profile_course_id TEXT,
      profile_year_level INTEGER,
      avatar_asset_key TEXT,
      avatar_updated_at TEXT,
      password_credential_json TEXT,
      temporary_credential_json TEXT,
      credential_version INTEGER NOT NULL,
      password_changed_at TEXT,
      updated_at TEXT NOT NULL,
      department_id TEXT,
      profile_department_id TEXT,
      institution_id TEXT
    ) STRICT`,
    'CREATE TABLE requester_departments (id TEXT PRIMARY KEY, display_name TEXT NOT NULL) STRICT',
    `CREATE TABLE account_committees (
      account_id TEXT NOT NULL,
      committee_id TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1
    ) STRICT`,
    `CREATE TABLE account_applications (
      id TEXT PRIMARY KEY,
      requested_username_normalized TEXT NOT NULL,
      state TEXT NOT NULL,
      approved_account_id TEXT
    ) STRICT`,
    `CREATE TABLE access_id_reservations (
      collision_key TEXT PRIMARY KEY,
      account_id TEXT NOT NULL
    ) STRICT`,
    `CREATE TABLE sessions (
      token_digest TEXT PRIMARY KEY,
      account_id TEXT NOT NULL
    ) STRICT`,
    `CREATE TABLE data_revisions (
      scope TEXT PRIMARY KEY,
      revision INTEGER NOT NULL,
      updated_at TEXT NOT NULL
     ) STRICT`,
    `CREATE TABLE app_metadata (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    ) STRICT`,
    `CREATE TABLE audit_log (
      id TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      action TEXT NOT NULL,
      entity_type TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      actor_account_id TEXT,
      before_json TEXT NOT NULL DEFAULT '{}',
      after_json TEXT NOT NULL DEFAULT '{}',
      correlation_id TEXT NOT NULL,
      notes TEXT NOT NULL DEFAULT ''
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
    `CREATE TABLE username_history (
      id TEXT PRIMARY KEY,
      account_id TEXT NOT NULL,
      old_username_normalized TEXT NOT NULL,
      new_username_normalized TEXT NOT NULL,
      changed_by_account_id TEXT NOT NULL,
      reason TEXT NOT NULL,
      idempotency_key TEXT NOT NULL UNIQUE,
      correlation_id TEXT NOT NULL,
      changed_at TEXT NOT NULL
    ) STRICT`,
    `INSERT INTO data_revisions (scope, revision, updated_at)
     VALUES ('global', 0, '${NOW}')`,
    `INSERT INTO accounts (
       id, access_id_normalized, status, role_id, profile_full_name,
       profile_mobile_number, profile_email, profile_email_verified_at,
       username_normalized, profile_course_id, profile_year_level,
       password_credential_json, credential_version, updated_at
     ) VALUES (
       '${ACCOUNT_ID}', 'REQ-PROFILE-SYNTHETIC', 'ACTIVE', 'REQUESTER',
       'Synthetic Profile', '+639171234567', 'profile@example.test', '${NOW}',
       'old.user', 'COURSE-1', 2, '{"algorithm":"TEST","hash":"before"}', 3, '${NOW}'
     )`,
    `INSERT INTO sessions (token_digest, account_id) VALUES ('SESSION-PROFILE-1', '${ACCOUNT_ID}')`,
  ]) {
    await db.prepare(statement).run();
  }
  return { db, repository: createD1ProfileRepository(db) };
}

function evidence(scope, key, action) {
  return {
    audit: {
      id: `AUD-${key}`,
      createdAt: NEXT,
      action,
      accountId: ACCOUNT_ID,
      actorId: ACCOUNT_ID,
      before: { changed: false },
      after: { changed: true },
      correlationId: `COR-${key}`,
    },
    idempotency: {
      scope,
      key,
      actorAccountId: ACCOUNT_ID,
      requestFingerprint: `FINGERPRINT-${key}`,
      result: { ok: true },
      createdAt: NEXT,
    },
  };
}

async function counts(db) {
  return db
    .prepare(
      `SELECT
         (SELECT COUNT(*) FROM username_history) AS history,
         (SELECT COUNT(*) FROM sessions) AS sessions,
         (SELECT COUNT(*) FROM audit_log) AS audits,
         (SELECT COUNT(*) FROM idempotency_keys) AS idempotency`,
    )
    .first();
}

describe('profile repository D1 atomicity', () => {
  it('reports a pending account-application username as a collision', async () => {
    const { db, repository } = await context();
    await db
      .prepare(
        `INSERT INTO account_applications (
           id, requested_username_normalized, state, approved_account_id
         ) VALUES (?1, ?2, 'PENDING_ADMIN_REVIEW', NULL)`,
      )
      .bind('APPLICATION-PENDING-USERNAME', 'pending.user')
      .run();

    await expect(repository.findUsername('pending.user', ACCOUNT_ID)).resolves.toBe(
      'APPLICATION-PENDING-USERNAME',
    );
    await expect(repository.findUsername('available.user', ACCOUNT_ID)).resolves.toBeNull();
  });

  it('rolls back a stale contact guard with no evidence or authoritative change', async () => {
    const { db, repository } = await context();

    await expect(
      repository.updateContact({
        accountId: ACCOUNT_ID,
        expectedUpdatedAt: '2026-08-03T11:59:00.000Z',
        mobileNumber: '+639189876543',
        changedAt: NEXT,
        evidence: evidence('PROFILE_CONTACT_UPDATE', 'CONTACT-STALE', 'PROFILE_CONTACT_UPDATED'),
      }),
    ).rejects.toMatchObject({ code: 'REVISION_CONFLICT', status: 409 });

    await expect(
      db
        .prepare('SELECT profile_mobile_number, updated_at FROM accounts WHERE id = ?1')
        .bind(ACCOUNT_ID)
        .first(),
    ).resolves.toEqual({ profile_mobile_number: '+639171234567', updated_at: NOW });
    await expect(counts(db)).resolves.toMatchObject({ history: 0, sessions: 1, audits: 0, idempotency: 0 });
    await expect(
      db.prepare("SELECT updated_at FROM data_revisions WHERE scope = 'global'").first(),
    ).resolves.toEqual({ updated_at: NOW });
  });

  it('rolls back a username mutation when its final idempotency write fails', async () => {
    const { db, repository } = await context();
    const failedEvidence = evidence(
      'PROFILE_USERNAME_CHANGE',
      'USERNAME-DUPLICATE',
      'PROFILE_USERNAME_CHANGED',
    );
    await db
      .prepare(
        `INSERT INTO idempotency_keys (
           scope, idempotency_key, actor_account_id, request_fingerprint, result_json, created_at
         ) VALUES (?1, ?2, ?3, ?4, ?5, ?6)`,
      )
      .bind(
        failedEvidence.idempotency.scope,
        failedEvidence.idempotency.key,
        ACCOUNT_ID,
        'ORIGINAL-FINGERPRINT',
        '{"ok":true}',
        NOW,
      )
      .run();

    await expect(
      repository.changeUsername({
        accountId: ACCOUNT_ID,
        expectedUpdatedAt: NOW,
        oldUsername: 'old.user',
        newUsername: 'new.user',
        changedAt: NEXT,
        reason: 'Synthetic duplicate idempotency failure.',
        historyId: 'USERNAME-HISTORY-DUPLICATE',
        evidence: failedEvidence,
      }),
    ).rejects.toThrow();

    await expect(
      db
        .prepare('SELECT username_normalized, credential_version, updated_at FROM accounts WHERE id = ?1')
        .bind(ACCOUNT_ID)
        .first(),
    ).resolves.toEqual({ username_normalized: 'old.user', credential_version: 3, updated_at: NOW });
    await expect(counts(db)).resolves.toMatchObject({ history: 0, sessions: 1, audits: 0, idempotency: 1 });
  });

  it('rolls back a password mutation when its final idempotency write fails', async () => {
    const { db, repository } = await context();
    const failedEvidence = evidence(
      'PROFILE_PASSWORD_CHANGE',
      'PASSWORD-DUPLICATE',
      'PROFILE_PASSWORD_CHANGED',
    );
    await db
      .prepare(
        `INSERT INTO idempotency_keys (
           scope, idempotency_key, actor_account_id, request_fingerprint, result_json, created_at
         ) VALUES (?1, ?2, ?3, ?4, ?5, ?6)`,
      )
      .bind(
        failedEvidence.idempotency.scope,
        failedEvidence.idempotency.key,
        ACCOUNT_ID,
        'ORIGINAL-FINGERPRINT',
        '{"ok":true}',
        NOW,
      )
      .run();

    await expect(
      repository.changePassword({
        accountId: ACCOUNT_ID,
        expectedCredentialVersion: 3,
        expectedUpdatedAt: NOW,
        passwordCredential: { algorithm: 'TEST', hash: 'after' },
        changedAt: NEXT,
        evidence: failedEvidence,
      }),
    ).rejects.toThrow();

    await expect(
      db
        .prepare(
          'SELECT password_credential_json, credential_version, updated_at FROM accounts WHERE id = ?1',
        )
        .bind(ACCOUNT_ID)
        .first(),
    ).resolves.toEqual({
      password_credential_json: '{"algorithm":"TEST","hash":"before"}',
      credential_version: 3,
      updated_at: NOW,
    });
    await expect(counts(db)).resolves.toMatchObject({ history: 0, sessions: 1, audits: 0, idempotency: 1 });
  });

  it('persists account appearance in reset-restored metadata with audit and idempotency evidence', async () => {
    const { db, repository } = await context();
    const next = await repository.updateAppearance({
      accountId: ACCOUNT_ID,
      theme: 'DARK',
      changedAt: NEXT,
      evidence: evidence('PROFILE_APPEARANCE_UPDATE', 'APPEARANCE-DARK', 'PROFILE_APPEARANCE_UPDATED'),
    });

    expect(next.appearanceTheme).toBe('DARK');
    await expect(
      db
        .prepare("SELECT value FROM app_metadata WHERE key = 'profile.appearance.' || ?1")
        .bind(ACCOUNT_ID)
        .first(),
    ).resolves.toEqual({ value: 'DARK' });
    await expect(counts(db)).resolves.toMatchObject({ audits: 1, idempotency: 1 });
  });

  it('updates avatar linkage atomically and rejects a stale profile revision without evidence', async () => {
    const { db, repository } = await context();
    const first = await repository.updateAvatar({
      accountId: ACCOUNT_ID,
      expectedUpdatedAt: NOW,
      avatarAssetKey: 'playground-redacted/profile-avatars/synthetic.png',
      changedAt: NEXT,
      evidence: evidence('PROFILE_AVATAR_UPLOAD', 'AVATAR-UPLOAD', 'PROFILE_AVATAR_REPLACED'),
    });
    expect(first).toMatchObject({
      avatarAssetKey: 'playground-redacted/profile-avatars/synthetic.png',
      avatarUpdatedAt: NEXT,
      updatedAt: NEXT,
    });
    await expect(
      repository.updateAvatar({
        accountId: ACCOUNT_ID,
        expectedUpdatedAt: NOW,
        avatarAssetKey: '',
        changedAt: '2026-08-03T12:02:00.000Z',
        evidence: evidence('PROFILE_AVATAR_DELETE', 'AVATAR-STALE', 'PROFILE_AVATAR_REMOVED'),
      }),
    ).rejects.toMatchObject({ code: 'REVISION_CONFLICT', status: 409 });
    await expect(counts(db)).resolves.toMatchObject({ audits: 1, idempotency: 1 });
  });
});
