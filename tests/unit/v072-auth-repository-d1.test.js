import { Miniflare } from 'miniflare';
import { afterEach, describe, expect, it } from 'vitest';
import { createD1AuthRepository } from '../../src/server/d1/auth-repository.js';

const NOW = '2026-08-03T12:00:00.000Z';

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
      password_credential_json TEXT,
      temporary_credential_json TEXT,
      credential_version INTEGER NOT NULL,
      onboarding_completed_at TEXT,
      profile_email_verified_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      locked_at TEXT,
      last_access_id_changed_at TEXT,
      lending_eligible INTEGER NOT NULL DEFAULT 0,
      institution_id TEXT,
      department_id TEXT,
      password_changed_at TEXT,
      last_password_reset_at TEXT,
      username_normalized TEXT,
      verified_email_fingerprint TEXT,
      profile_department_id TEXT,
      profile_course_id TEXT,
      profile_year_level INTEGER,
      avatar_asset_key TEXT,
      avatar_updated_at TEXT
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
    'CREATE TABLE requester_departments (id TEXT PRIMARY KEY, display_name TEXT NOT NULL) STRICT',
    `CREATE TABLE account_applications (
      id TEXT PRIMARY KEY,
      approved_account_id TEXT,
      email_fingerprint TEXT NOT NULL,
      state TEXT NOT NULL
    ) STRICT`,
  ]) {
    await db.prepare(statement).run();
  }
  return { db, repository: createD1AuthRepository(db) };
}

async function insertAccount(db, overrides = {}) {
  const account = {
    id: 'ACCOUNT-SYNTHETIC',
    accessId: 'SYNTHETIC-001',
    status: 'ACTIVE',
    roleId: 'REQUESTER',
    email: 'synthetic@example.test',
    verifiedAt: NOW,
    username: 'synthetic.user',
    fingerprint: '',
    ...overrides,
  };
  await db
    .prepare(
      `INSERT INTO accounts (
         id, access_id_normalized, status, role_id, profile_email,
         credential_version, profile_email_verified_at, created_at, updated_at,
         username_normalized, verified_email_fingerprint
       ) VALUES (?1, ?2, ?3, ?4, ?5, 1, ?6, ?7, ?7, ?8, ?9)`,
    )
    .bind(
      account.id,
      account.accessId,
      account.status,
      account.roleId,
      account.email,
      account.verifiedAt,
      NOW,
      account.username,
      account.fingerprint,
    )
    .run();
  return account;
}

async function linkApplication(db, { id, accountId, fingerprint, state = 'ACTIVE' }) {
  await db
    .prepare(
      `INSERT INTO account_applications (
         id, approved_account_id, email_fingerprint, state
       ) VALUES (?1, ?2, ?3, ?4)`,
    )
    .bind(id, accountId, fingerprint, state)
    .run();
}

describe('v0.7.2 D1 authentication identity qualification', () => {
  it('rejects a legacy timestamp-only email while preserving account-code and username login', async () => {
    const { db, repository } = await context();
    await insertAccount(db, {
      id: 'ACCOUNT-LEGACY',
      accessId: 'LEGACY-001',
      email: 'legacy@example.test',
      username: 'legacy.user',
      fingerprint: '',
    });

    await expect(repository.getAccountByLoginIdentifier('legacy@example.test')).resolves.toBeUndefined();
    await expect(repository.getAccountByLoginIdentifier('legacy.user')).resolves.toMatchObject({
      id: 'ACCOUNT-LEGACY',
    });
    await expect(repository.getAccountByLoginIdentifier('legacy-001')).resolves.toMatchObject({
      id: 'ACCOUNT-LEGACY',
    });
  });

  it('accepts an email only when its fingerprint and approved application ownership link match', async () => {
    const { db, repository } = await context();
    await insertAccount(db, {
      id: 'ACCOUNT-APPROVED',
      accessId: 'APPROVED-001',
      email: 'approved@example.test',
      verifiedAt: null,
      fingerprint: 'EMAIL-FINGERPRINT-APPROVED',
    });
    await linkApplication(db, {
      id: 'APPLICATION-APPROVED',
      accountId: 'ACCOUNT-APPROVED',
      fingerprint: 'EMAIL-FINGERPRINT-APPROVED',
      state: 'ACTIVE',
    });

    await expect(repository.getAccountByLoginIdentifier('approved@example.test')).resolves.toMatchObject({
      id: 'ACCOUNT-APPROVED',
      verifiedEmailFingerprint: 'EMAIL-FINGERPRINT-APPROVED',
    });

    await insertAccount(db, {
      id: 'ACCOUNT-ORPHAN',
      accessId: 'ORPHAN-001',
      email: 'orphan@example.test',
      fingerprint: 'EMAIL-FINGERPRINT-ORPHAN',
    });
    await expect(repository.getAccountByLoginIdentifier('orphan@example.test')).resolves.toBeUndefined();
  });

  it('fails closed for duplicate approved emails, duplicate fingerprints, and mismatched ownership', async () => {
    const { db, repository } = await context();
    for (const account of [
      {
        id: 'ACCOUNT-DUPLICATE-A',
        accessId: 'DUPLICATE-001',
        email: 'duplicate@example.test',
        fingerprint: 'EMAIL-FINGERPRINT-A',
      },
      {
        id: 'ACCOUNT-DUPLICATE-B',
        accessId: 'DUPLICATE-002',
        email: 'duplicate@example.test',
        fingerprint: 'EMAIL-FINGERPRINT-B',
      },
    ]) {
      await insertAccount(db, account);
      await linkApplication(db, {
        id: `APPLICATION-${account.id}`,
        accountId: account.id,
        fingerprint: account.fingerprint,
      });
    }
    await expect(repository.getAccountByLoginIdentifier('duplicate@example.test')).resolves.toBeUndefined();

    await insertAccount(db, {
      id: 'ACCOUNT-FINGERPRINT-C',
      accessId: 'FINGERPRINT-001',
      email: 'fingerprint-a@example.test',
      fingerprint: 'EMAIL-FINGERPRINT-SHARED',
    });
    await linkApplication(db, {
      id: 'APPLICATION-FINGERPRINT-C',
      accountId: 'ACCOUNT-FINGERPRINT-C',
      fingerprint: 'EMAIL-FINGERPRINT-SHARED',
    });
    await insertAccount(db, {
      id: 'ACCOUNT-FINGERPRINT-D',
      accessId: 'FINGERPRINT-002',
      email: 'fingerprint-b@example.test',
      fingerprint: 'EMAIL-FINGERPRINT-SHARED',
    });
    await linkApplication(db, {
      id: 'APPLICATION-FINGERPRINT-D',
      accountId: 'ACCOUNT-FINGERPRINT-D',
      fingerprint: 'EMAIL-FINGERPRINT-SHARED',
    });
    await expect(
      repository.getAccountByLoginIdentifier('fingerprint-a@example.test'),
    ).resolves.toBeUndefined();

    await insertAccount(db, {
      id: 'ACCOUNT-MISMATCH',
      accessId: 'MISMATCH-001',
      email: 'mismatch@example.test',
      fingerprint: 'EMAIL-FINGERPRINT-ACTUAL',
    });
    await linkApplication(db, {
      id: 'APPLICATION-MISMATCH',
      accountId: 'ACCOUNT-MISMATCH',
      fingerprint: 'EMAIL-FINGERPRINT-OTHER',
    });
    await expect(repository.getAccountByLoginIdentifier('mismatch@example.test')).resolves.toBeUndefined();
  });
});
