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
        async executeBatchStatement() {
          if (/^\s*(?:SELECT|PRAGMA)\b/iu.test(sql)) {
            return { results: prepared.all(...bindings), meta: { changes: 0 } };
          }
          const result = prepared.run(...bindings);
          return { meta: { changes: Number(result.changes) } };
        },
      };
    },
    async batch(statements) {
      database.exec('BEGIN IMMEDIATE');
      try {
        const results = [];
        for (const statement of statements) results.push(await statement.executeBatchStatement());
        database.exec('COMMIT');
        return results;
      } catch (error) {
        database.exec('ROLLBACK');
        throw error;
      }
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
const thirdPersonId = 'PER-323E4567-E89B-42D3-A456-426614174000';

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

describe('schema-32 canonical identity foundation and staff account activity history', () => {
  it('declares additive schema-32 staff-account activity history with literal guards and projection triggers', async () => {
    const source = await readFile(
      resolve(repositoryRoot, 'migrations/0032_staff_account_activity_history.sql'),
      'utf8',
    );

    expect(source).toContain('CREATE TABLE staff_account_activity_history');
    expect(source).toContain('CREATE TABLE staff_account_activity_audit_context');
    expect(source).toContain('CREATE TABLE staff_account_activity_transition_context');
    expect(source).toContain("WHERE key = 'operational_schema_version' AND value = '31'");
    expect(source).toContain("substr(occurred_at, 20, 1) = '.'");
    expect(source).toContain("substr(prepared_at, 24, 1) = 'Z'");
    expect(source).toContain('staff_account_activity_history_no_update');
    expect(source).toContain('staff_account_activity_history_no_delete');
    expect(source).toContain('account_staff_links_identity_immutable');
    expect(source).toContain('staff_assignments_identity_immutable');
    expect(source).toContain('staff_account_activity_audit_context_project_consume');
    expect(source).toContain('account_staff_links_create_project_consume');
    expect(source).toContain('staff_assignments_window_project_consume');
  });

  it('is additive, empty by default, and advances the operational schema once', async () => {
    await migratedRepository();
    expect(sqlite.prepare('PRAGMA integrity_check').get()).toEqual({ integrity_check: 'ok' });
    expect(sqlite.prepare('PRAGMA foreign_key_check').all()).toEqual([]);
    expect(
      sqlite.prepare("SELECT value FROM app_metadata WHERE key = 'operational_schema_version'").get(),
    ).toEqual({ value: '32' });
    for (const table of [
      'canonical_people',
      'person_emails',
      'account_staff_links',
      'staff_assignments',
      'staff_account_activity_history',
      'staff_account_activity_audit_context',
      'staff_account_activity_transition_context',
    ]) {
      expect(
        sqlite
          .prepare("SELECT COUNT(*) AS count FROM sqlite_master WHERE type = 'table' AND name = ?")
          .get(table),
      ).toEqual({
        count: 1,
      });
      expect(sqlite.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get()).toEqual({ count: 0 });
    }
    expect(
      sqlite
        .prepare("SELECT value FROM app_metadata WHERE key = 'staff_account_activity_history_starts_at'")
        .get(),
    ).toMatchObject({ value: expect.any(String) });
    expect(() =>
      sqlite
        .prepare('INSERT INTO canonical_people (person_id, created_at) VALUES (?1, ?2)')
        .run('PER-123E4567-E89B-Z2D3-A456-426614174000', time),
    ).toThrow();
  });

  it('rejects malformed literal timestamps and incompatible action/null matrices before history can be retained', async () => {
    const repository = await migratedRepository();
    const linkId = 'LNK-SYNTHETIC-NEGATIVE-0001';
    const assignmentId = 'ASN-SYNTHETIC-NEGATIVE-0001';
    const windowFrom = '2026-08-14T01:00:00.000Z';
    const windowTo = '2026-08-14T02:00:00.000Z';
    await repository.createPerson(person(firstPersonId));
    await repository.createAccountStaffLink({
      id: linkId,
      accountId: 'ACCOUNT-SYNTHETIC-0001',
      personId: firstPersonId,
      state: ACCOUNT_STAFF_LINK_STATE.ACTIVE,
      sourceProvenanceEnvelope: null,
      createdAt: time,
      updatedAt: time,
    });
    await repository.createStaffAssignment({
      id: assignmentId,
      personId: firstPersonId,
      assignmentFingerprint: 'FP-SYNTHETIC-NEGATIVE-0001',
      protectedAssignmentEnvelope: 'v1.synthetic.assignment-negative',
      state: STAFF_ASSIGNMENT_STATE.ACTIVE,
      effectiveFrom: windowFrom,
      effectiveTo: windowTo,
      sourceProvenanceEnvelope: null,
      createdAt: time,
      updatedAt: time,
    });
    const rejects = (sql, ...values) => expect(() => sqlite.prepare(sql).run(...values)).toThrow();
    const insertAuditHistory = `INSERT INTO staff_account_activity_history (
      event_id, occurred_at, event_type, action_code, person_id,
      account_id, account_staff_link_id, staff_assignment_id,
      link_state, previous_link_state, assignment_state, previous_assignment_state,
      old_effective_from, old_effective_to, new_effective_from, new_effective_to,
      account_access_id_snapshot, correlation_id, source_kind, source_id, source_event_id, transition_id
    ) VALUES (?1, ?2, ?3, 'ACCESS_ID_CHANGED', ?4, 'ACCOUNT-SYNTHETIC-0001', ?5, NULL,
      'ACTIVE', NULL, NULL, NULL, NULL, NULL, NULL, NULL,
      'SYNTHETIC.0001', 'COR-NEGATIVE-AUDIT', 'ACCOUNT_AUDIT', 'AUDIT-NEGATIVE', 'AUDIT-NEGATIVE', NULL)`;
    rejects(
      insertAuditHistory,
      'HIS-000000000000000000000000000000b1',
      '2026-08-14X00:00:00.000Z',
      'ACCOUNT_AUDIT',
      firstPersonId,
      linkId,
    );
    rejects(
      insertAuditHistory,
      'HIS-000000000000000000000000000000b2',
      time,
      'ACCOUNT_STAFF_LINK',
      firstPersonId,
      linkId,
    );

    for (const [index, malformedPreparedAt] of [
      '2026-08-14T00:00:00.00Z',
      '2026-08-14T00;00:00.000Z',
    ].entries()) {
      const auditId = `AUDIT-NEGATIVE-PREPARED-${index}`;
      sqlite
        .prepare(
          `INSERT INTO audit_log (
             id, created_at, action, entity_type, entity_id, actor_account_id,
             before_json, after_json, correlation_id, notes
           ) VALUES (?1, ?2, 'ACCESS_ID_CHANGED', 'ACCOUNT', 'ACCOUNT-SYNTHETIC-0001', NULL, '{}', '{}', ?3, '')`,
        )
        .run(auditId, time, `COR-NEGATIVE-PREPARED-${index}`);
      rejects(
        `INSERT INTO staff_account_activity_audit_context (
           audit_id, person_id, account_id, account_staff_link_id, link_state,
           account_access_id_snapshot, action_code, correlation_id, prepared_at
         ) VALUES (?1, ?2, 'ACCOUNT-SYNTHETIC-0001', ?3, 'ACTIVE', 'SYNTHETIC.0001',
           'ACCESS_ID_CHANGED', ?4, ?5)`,
        auditId,
        firstPersonId,
        linkId,
        `COR-NEGATIVE-PREPARED-${index}`,
        malformedPreparedAt,
      );
    }
    rejects(
      `INSERT INTO staff_account_activity_transition_context (
         transition_id, source_kind, source_id, account_staff_link_id, staff_assignment_id,
         action_code, person_id, account_id, old_link_state, new_link_state,
         old_assignment_state, new_assignment_state, old_effective_from, old_effective_to,
         new_effective_from, new_effective_to, correlation_id, created_at
       ) VALUES (
         'TRN-000000000000000000000000000000b1', 'ACCOUNT_STAFF_LINK', ?1, ?1, NULL,
         'LINK_STATE_CHANGED', ?2, 'ACCOUNT-SYNTHETIC-0001', 'ACTIVE', 'REVOKED',
         NULL, NULL, NULL, NULL, NULL, NULL, 'COR-NEGATIVE-CREATED', ?3)`,
      linkId,
      firstPersonId,
      ' 2026-08-14T00:00:00.000Z',
    );
    for (const [index, field] of [
      'old_effective_from',
      'old_effective_to',
      'new_effective_from',
      'new_effective_to',
    ].entries()) {
      const windows = {
        oldEffectiveFrom: windowFrom,
        oldEffectiveTo: windowTo,
        newEffectiveFrom: '2026-08-14T03:00:00.000Z',
        newEffectiveTo: '2026-08-14T04:00:00.000Z',
      };
      const property = field.replace(/_([a-z])/gu, (_, letter) => letter.toUpperCase());
      windows[property] = '2026-08-14T00:00:00.00Z';
      rejects(
        `INSERT INTO staff_account_activity_transition_context (
           transition_id, source_kind, source_id, account_staff_link_id, staff_assignment_id,
           action_code, person_id, account_id, old_link_state, new_link_state,
           old_assignment_state, new_assignment_state, old_effective_from, old_effective_to,
           new_effective_from, new_effective_to, correlation_id, created_at
         ) VALUES (
           ?1, 'STAFF_ASSIGNMENT', ?2, NULL, ?2, 'ASSIGNMENT_EFFECTIVE_WINDOW_CHANGED',
           ?3, NULL, NULL, NULL, 'ACTIVE', 'ACTIVE', ?4, ?5, ?6, ?7, ?8, ?9)`,
        `TRN-000000000000000000000000000000c${index}`,
        assignmentId,
        firstPersonId,
        windows.oldEffectiveFrom,
        windows.oldEffectiveTo,
        windows.newEffectiveFrom,
        windows.newEffectiveTo,
        `COR-NEGATIVE-WINDOW-${index}`,
        time,
      );
    }
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

  it('reads only opaque canonical and verified-account matching fields for reconciliation planning', async () => {
    const repository = await migratedRepository();
    const fingerprint = 'FP-SYNTHETIC-RECONCILIATION-0001';
    await repository.createPerson(person(firstPersonId));
    await repository.createPersonEmail(
      email({
        id: 'EML-SYNTHETIC-RECONCILIATION-0001',
        personId: firstPersonId,
        fingerprint,
        primary: true,
      }),
    );
    sqlite
      .prepare(
        `UPDATE accounts
         SET verified_email_fingerprint = ?1, profile_email_verified_at = ?2
         WHERE id = ?3`,
      )
      .run(fingerprint, time, 'ACCOUNT-SYNTHETIC-0001');

    await expect(repository.listCanonicalEmailMatches(fingerprint)).resolves.toEqual([
      {
        id: 'EML-SYNTHETIC-RECONCILIATION-0001',
        personId: firstPersonId,
        state: PERSON_EMAIL_STATE.ACTIVE,
        verificationState: PERSON_EMAIL_VERIFICATION_STATE.VERIFIED,
      },
    ]);
    await expect(repository.listAccountsByVerifiedEmailFingerprint(fingerprint)).resolves.toEqual([
      {
        id: 'ACCOUNT-SYNTHETIC-0001',
        status: 'ACTIVE',
        profileEmailVerifiedAt: time,
      },
    ]);
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

  it('reads a bounded canonical directory projection without returning protected identity values', async () => {
    const repository = await migratedRepository();
    await repository.createPerson(person(firstPersonId));
    await repository.createPerson(person(secondPersonId));
    await repository.createPerson(person(thirdPersonId));
    sqlite.exec(
      "INSERT INTO accounts (id, access_id_normalized, status, role_id, credential_version, created_at, updated_at) VALUES ('ACCOUNT-SYNTHETIC-0002', 'REVOKED.0002', 'REVOKED', 'SYNTHETIC_ROLE', 1, '2026-08-14T00:00:00.000Z', '2026-08-14T00:00:00.000Z'), ('ACCOUNT-SYNTHETIC-0003', 'QUARANTINED.0003', 'REVOKED', 'SYNTHETIC_ROLE', 1, '2026-08-14T00:00:00.000Z', '2026-08-14T00:00:00.000Z')",
    );
    sqlite
      .prepare(
        `UPDATE accounts
         SET access_id_normalized = ?1, profile_full_name = ?2
         WHERE id = ?3`,
      )
      .run('STAFF.0001', 'Safe Staff Name', 'ACCOUNT-SYNTHETIC-0001');
    await repository.createAccountStaffLink({
      id: 'LNK-SYNTHETIC-DIRECTORY-0001',
      accountId: 'ACCOUNT-SYNTHETIC-0001',
      personId: firstPersonId,
      state: ACCOUNT_STAFF_LINK_STATE.ACTIVE,
      sourceProvenanceEnvelope: null,
      createdAt: time,
      updatedAt: time,
    });
    await repository.createAccountStaffLink({
      id: 'LNK-SYNTHETIC-DIRECTORY-0002',
      accountId: 'ACCOUNT-SYNTHETIC-0001',
      personId: firstPersonId,
      state: ACCOUNT_STAFF_LINK_STATE.REVOKED,
      sourceProvenanceEnvelope: null,
      createdAt: time,
      updatedAt: time,
    });
    await repository.createAccountStaffLink({
      id: 'LNK-SYNTHETIC-DIRECTORY-0003',
      accountId: 'ACCOUNT-SYNTHETIC-0002',
      personId: secondPersonId,
      state: ACCOUNT_STAFF_LINK_STATE.REVOKED,
      sourceProvenanceEnvelope: null,
      createdAt: time,
      updatedAt: time,
    });
    await repository.createAccountStaffLink({
      id: 'LNK-SYNTHETIC-DIRECTORY-0004',
      accountId: 'ACCOUNT-SYNTHETIC-0003',
      personId: thirdPersonId,
      state: ACCOUNT_STAFF_LINK_STATE.QUARANTINED,
      sourceProvenanceEnvelope: null,
      createdAt: time,
      updatedAt: time,
    });
    await repository.createPersonEmail(
      email({
        id: 'EML-SYNTHETIC-DIRECTORY-0001',
        personId: firstPersonId,
        fingerprint: 'FP-SYNTHETIC-DIRECTORY-0001',
        primary: true,
      }),
    );
    await repository.createStaffAssignment({
      id: 'ASN-SYNTHETIC-DIRECTORY-0001',
      personId: firstPersonId,
      assignmentFingerprint: 'FP-SYNTHETIC-DIRECTORY-0001',
      protectedAssignmentEnvelope: 'v1.synthetic.assignment-envelope',
      state: STAFF_ASSIGNMENT_STATE.ACTIVE,
      effectiveFrom: null,
      effectiveTo: null,
      sourceProvenanceEnvelope: 'v1.synthetic.provenance-envelope',
      createdAt: time,
      updatedAt: time,
    });

    await expect(
      repository.listCanonicalDirectory({ query: 'staff.0001', page: 1, pageSize: 5 }),
    ).resolves.toEqual({
      total: 1,
      items: [
        {
          personId: firstPersonId,
          linkedAccountCount: 1,
          activeLinkCount: 1,
          revokedLinkCount: 1,
          quarantinedLinkCount: 0,
          quarantinedEmailCount: 0,
          ambiguousEmailCount: 0,
          activeVerifiedEmailCount: 1,
          activeUnverifiedEmailCount: 0,
          activeAssignmentCount: 1,
          historicalAssignmentCount: 0,
          quarantinedAssignmentCount: 0,
          assignmentProvenanceCount: 1,
          activeAccessId: 'STAFF.0001',
          activeDisplayName: 'Safe Staff Name',
        },
      ],
    });
    await expect(
      repository.listCanonicalDirectory({ query: 'revoked.0002', page: 1, pageSize: 5 }),
    ).resolves.toMatchObject({
      total: 1,
      items: [
        {
          personId: secondPersonId,
          linkedAccountCount: 1,
          activeLinkCount: 0,
          revokedLinkCount: 1,
          activeAccessId: null,
          activeDisplayName: null,
        },
      ],
    });
    await expect(
      repository.listCanonicalDirectory({ query: 'quarantined.0003', page: 1, pageSize: 5 }),
    ).resolves.toMatchObject({
      total: 1,
      items: [
        {
          personId: thirdPersonId,
          linkedAccountCount: 1,
          activeLinkCount: 0,
          quarantinedLinkCount: 1,
          activeAccessId: null,
          activeDisplayName: null,
        },
      ],
    });
    await expect(repository.listCanonicalDirectory({ page: 1, pageSize: 1 })).resolves.toMatchObject({
      total: 3,
      items: [{ personId: firstPersonId }],
    });
    await expect(repository.listCanonicalDirectory({ page: 2, pageSize: 1 })).resolves.toMatchObject({
      total: 3,
      items: [{ personId: secondPersonId }],
    });
    await expect(repository.listCanonicalDirectory({ page: 3, pageSize: 1 })).resolves.toMatchObject({
      total: 3,
      items: [{ personId: thirdPersonId }],
    });
    await expect(
      repository.listCanonicalDirectory({ query: 'not-a-canonical-person', page: 1, pageSize: 5 }),
    ).resolves.toEqual({ total: 0, items: [] });
  });

  it('uses one exact predicate for count and page history reads with deterministic retained ordering', async () => {
    const repository = await migratedRepository();
    await repository.createPerson(person(firstPersonId));
    await repository.createAccountStaffLink({
      id: 'LNK-SYNTHETIC-HISTORY-0001',
      accountId: 'ACCOUNT-SYNTHETIC-0001',
      personId: firstPersonId,
      state: ACCOUNT_STAFF_LINK_STATE.ACTIVE,
      sourceProvenanceEnvelope: null,
      createdAt: time,
      updatedAt: time,
    });
    const insertAccountAudit = (eventId, sourceId) =>
      sqlite
        .prepare(
          `INSERT INTO staff_account_activity_history (
             event_id, occurred_at, event_type, action_code, person_id,
             account_id, account_staff_link_id, staff_assignment_id,
             link_state, previous_link_state, assignment_state, previous_assignment_state,
             old_effective_from, old_effective_to, new_effective_from, new_effective_to,
             account_access_id_snapshot, correlation_id, source_kind, source_id,
             source_event_id, transition_id
           ) VALUES (
             ?1, '2026-08-14T00:02:00.000Z', 'ACCOUNT_AUDIT', 'ACCESS_ID_CHANGED', ?2,
             'ACCOUNT-SYNTHETIC-0001', 'LNK-SYNTHETIC-HISTORY-0001', NULL,
             'ACTIVE', NULL, NULL, NULL, NULL, NULL, NULL, NULL,
             'SYNTHETIC.0001', ?3, 'ACCOUNT_AUDIT', ?4, ?4, NULL
           )`,
        )
        .run(eventId, firstPersonId, `COR-${sourceId}`, sourceId);
    insertAccountAudit('HIS-000000000000000000000000000000a1', 'AUDIT-HISTORY-0001');
    insertAccountAudit('HIS-000000000000000000000000000000a2', 'AUDIT-HISTORY-0002');

    const exactSnapshot = await repository.listStaffAccountActivityHistory({
      personId: firstPersonId,
      query: 'SYNTHETIC.0001',
      page: 1,
      pageSize: 1,
    });
    expect(exactSnapshot.total).toBe(2);
    expect(exactSnapshot.items).toEqual([
      expect.objectContaining({
        event_id: 'HIS-000000000000000000000000000000a2',
        account_access_id_snapshot: 'SYNTHETIC.0001',
      }),
    ]);
    await expect(
      repository.listStaffAccountActivityHistory({
        personId: firstPersonId,
        query: 'SYNTHETIC.0001',
        page: 2,
        pageSize: 1,
      }),
    ).resolves.toMatchObject({
      total: 2,
      items: [expect.objectContaining({ event_id: 'HIS-000000000000000000000000000000a1' })],
    });
    await expect(
      repository.listStaffAccountActivityHistory({
        personId: firstPersonId,
        query: 'ACCOUNT-SYNTHETIC-0001',
        page: 1,
        pageSize: 5,
      }),
    ).resolves.toMatchObject({ total: 3 });
    const linkOnly = await repository.listStaffAccountActivityHistory({
      personId: firstPersonId,
      eventType: 'ACCOUNT_STAFF_LINK',
      page: 1,
      pageSize: 5,
    });
    expect(linkOnly.total).toBe(1);
    expect(linkOnly.items).toEqual([expect.objectContaining({ action_code: 'LINK_CREATED' })]);
    expect(JSON.stringify(exactSnapshot)).not.toContain('protected_email_envelope');
    expect(JSON.stringify(exactSnapshot)).not.toContain('source_id');
  });
});
