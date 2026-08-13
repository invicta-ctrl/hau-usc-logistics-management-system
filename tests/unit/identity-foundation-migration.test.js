import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { afterEach, describe, expect, it } from 'vitest';
import { createD1IdentityFoundationRepository } from '../../src/server/d1/identity-foundation-repository.js';
import {
  ACCOUNT_STAFF_LINK_STATE,
  PERSON_EMAIL_STATE,
  PERSON_EMAIL_VERIFICATION_STATE,
  STAFF_ASSIGNMENT_STATE,
} from '../../src/server/identity-foundation/contracts.js';

const repositoryRoot = resolve(import.meta.dirname, '../..');
let sqlite;

afterEach(() => {
  sqlite?.close();
  sqlite = null;
});

function d1Adapter(database) {
  return {
    prepare(sql) {
      const prepared = database.prepare(sql);
      let bindings = [];
      return {
        bind(...values) {
          bindings = values;
          return this;
        },
        async first() {
          return prepared.get(...bindings) ?? null;
        },
        async all() {
          return { results: prepared.all(...bindings) };
        },
        async run() {
          const result = prepared.run(...bindings);
          return { meta: { changes: Number(result.changes) } };
        },
      };
    },
  };
}

async function migratedRepository() {
  sqlite = new DatabaseSync(':memory:');
  const directory = resolve(repositoryRoot, 'migrations');
  const migrations = (await readdir(directory)).filter((name) => name.endsWith('.sql')).sort();
  for (const migration of migrations) sqlite.exec(await readFile(resolve(directory, migration), 'utf8'));
  sqlite.exec(
    "INSERT INTO roles (id, label, scope_mode) VALUES ('SYNTHETIC_ROLE', 'Synthetic role', 'DENY')",
  );
  sqlite.exec(
    "INSERT INTO accounts (id, access_id_normalized, status, role_id, credential_version, created_at, updated_at) VALUES ('ACCOUNT-SYNTHETIC-0001', 'SYNTHETIC.0001', 'ACTIVE', 'SYNTHETIC_ROLE', 1, '2026-08-14T00:00:00.000Z', '2026-08-14T00:00:00.000Z')",
  );
  return createD1IdentityFoundationRepository(d1Adapter(sqlite));
}

const time = '2026-08-14T00:00:00.000Z';
const firstPersonId = 'PER-123E4567-E89B-42D3-A456-426614174000';
const secondPersonId = 'PER-223E4567-E89B-42D3-A456-426614174000';

function person(personId) {
  return { personId, createdAt: time, sourceProvenanceEnvelope: null };
}

function email({ id, personId, fingerprint, primary = false }) {
  return {
    id,
    personId,
    protectedEmailEnvelope: `v1.synthetic.email.${id}`,
    normalizedEmailFingerprint: fingerprint,
    state: PERSON_EMAIL_STATE.ACTIVE,
    verificationState: PERSON_EMAIL_VERIFICATION_STATE.VERIFIED,
    isPrimary: primary,
    sourceProvenanceEnvelope: null,
    createdAt: time,
    updatedAt: time,
  };
}

describe('schema-31 canonical identity foundation', () => {
  it('is additive, empty by default, and advances the operational schema once', async () => {
    await migratedRepository();
    expect(sqlite.prepare('PRAGMA integrity_check').get()).toEqual({ integrity_check: 'ok' });
    expect(sqlite.prepare('PRAGMA foreign_key_check').all()).toEqual([]);
    expect(
      sqlite.prepare("SELECT value FROM app_metadata WHERE key = 'operational_schema_version'").get(),
    ).toEqual({ value: '31' });
    for (const table of ['canonical_people', 'person_emails', 'account_staff_links', 'staff_assignments']) {
      expect(
        sqlite
          .prepare("SELECT COUNT(*) AS count FROM sqlite_master WHERE type = 'table' AND name = ?")
          .get(table),
      ).toEqual({
        count: 1,
      });
      expect(sqlite.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get()).toEqual({ count: 0 });
    }
    expect(() =>
      sqlite
        .prepare('INSERT INTO canonical_people (person_id, created_at) VALUES (?1, ?2)')
        .run('PER-123E4567-E89B-Z2D3-A456-426614174000', time),
    ).toThrow();
  });

  it('enforces verified-primary email and explicit account-link invariants without deriving privileges', async () => {
    const repository = await migratedRepository();
    await repository.createPerson(person(firstPersonId));
    await repository.createPerson(person(secondPersonId));
    await repository.createPersonEmail(
      email({
        id: 'EML-SYNTHETIC-0001',
        personId: firstPersonId,
        fingerprint: 'FP-SYNTHETIC-EMAIL-0001',
        primary: true,
      }),
    );

    await expect(
      repository.createPersonEmail(
        email({
          id: 'EML-SYNTHETIC-0002',
          personId: secondPersonId,
          fingerprint: 'FP-SYNTHETIC-EMAIL-0001',
        }),
      ),
    ).rejects.toThrow();

    await repository.createAccountStaffLink({
      id: 'LNK-SYNTHETIC-0001',
      accountId: 'ACCOUNT-SYNTHETIC-0001',
      personId: firstPersonId,
      state: ACCOUNT_STAFF_LINK_STATE.ACTIVE,
      sourceProvenanceEnvelope: null,
      createdAt: time,
      updatedAt: time,
    });
    await expect(
      repository.createAccountStaffLink({
        id: 'LNK-SYNTHETIC-0002',
        accountId: 'ACCOUNT-SYNTHETIC-0001',
        personId: secondPersonId,
        state: ACCOUNT_STAFF_LINK_STATE.ACTIVE,
        sourceProvenanceEnvelope: null,
        createdAt: time,
        updatedAt: time,
      }),
    ).rejects.toThrow();

    const link = await repository.getActiveAccountStaffLink('ACCOUNT-SYNTHETIC-0001');
    expect(link).toEqual({
      id: 'LNK-SYNTHETIC-0001',
      accountId: 'ACCOUNT-SYNTHETIC-0001',
      personId: firstPersonId,
      state: ACCOUNT_STAFF_LINK_STATE.ACTIVE,
      sourceProvenanceEnvelope: null,
      createdAt: time,
      updatedAt: time,
    });
    expect(link).not.toHaveProperty('roleId');
    expect(link).not.toHaveProperty('capabilities');

    const revokedLink = await repository.createAccountStaffLink({
      id: 'LNK-SYNTHETIC-0003',
      accountId: 'ACCOUNT-SYNTHETIC-0001',
      personId: firstPersonId,
      state: ACCOUNT_STAFF_LINK_STATE.REVOKED,
      sourceProvenanceEnvelope: null,
      createdAt: time,
      updatedAt: time,
    });
    expect(revokedLink).toEqual({
      id: 'LNK-SYNTHETIC-0003',
      accountId: 'ACCOUNT-SYNTHETIC-0001',
      personId: firstPersonId,
      state: ACCOUNT_STAFF_LINK_STATE.REVOKED,
      sourceProvenanceEnvelope: null,
      createdAt: time,
      updatedAt: time,
    });
    await expect(repository.getAccountStaffLink(revokedLink.id)).resolves.toEqual(revokedLink);
    await expect(repository.getActiveAccountStaffLink('ACCOUNT-SYNTHETIC-0001')).resolves.toEqual(link);
  });

  it('retains assignment provenance with nullable unproven dates and only collapses exact fingerprints', async () => {
    const repository = await migratedRepository();
    await repository.createPerson(person(firstPersonId));
    const assignment = {
      id: 'ASN-SYNTHETIC-0001',
      personId: firstPersonId,
      assignmentFingerprint: 'FP-SYNTHETIC-ASSIGNMENT-0001',
      protectedAssignmentEnvelope: 'v1.synthetic.assignment-envelope',
      state: STAFF_ASSIGNMENT_STATE.QUARANTINED,
      effectiveFrom: null,
      effectiveTo: null,
      sourceProvenanceEnvelope: 'v1.synthetic.provenance-envelope',
      createdAt: time,
      updatedAt: time,
    };
    await expect(repository.createStaffAssignment(assignment)).resolves.toMatchObject({
      effectiveFrom: null,
      effectiveTo: null,
      state: STAFF_ASSIGNMENT_STATE.QUARANTINED,
    });
    await expect(
      repository.createStaffAssignment({ ...assignment, id: 'ASN-SYNTHETIC-0002' }),
    ).rejects.toThrow();
    await expect(repository.listStaffAssignments(firstPersonId)).resolves.toHaveLength(1);
  });
});
