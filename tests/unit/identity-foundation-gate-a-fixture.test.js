import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { afterEach, describe, expect, it } from 'vitest';
import { ROLES } from '../../src/domain/constants.js';
import { createD1IdentityFoundationRepository } from '../../src/server/d1/identity-foundation-repository.js';
import { createD1IdentityRosterRepository } from '../../src/server/d1/identity-roster-repository.js';
import {
  ACCOUNT_STAFF_LINK_STATE,
  createCanonicalPersonId,
  PERSON_EMAIL_STATE,
  PERSON_EMAIL_VERIFICATION_STATE,
} from '../../src/server/identity-foundation/contracts.js';
import {
  createIdentityFoundationReconciliationService,
  IDENTITY_FOUNDATION_RECONCILIATION_STATUS,
} from '../../src/server/identity-foundation/reconciliation.js';
import { createIdentityRosterCrypto } from '../../src/server/identity-roster/crypto.js';
import {
  createIdentityRosterService,
  IDENTITY_ROSTER_HEADERS,
} from '../../src/server/identity-roster/service.js';

const repositoryRoot = resolve(import.meta.dirname, '../..');
const time = '2026-08-16T12:00:00.000Z';
const owner = Object.freeze({
  id: 'ACTOR-SYNTHETIC-OWNER',
  roleId: ROLES.SYSTEM_OWNER,
});
const expectedSafety = Object.freeze({
  dataMutation: false,
  providerRead: false,
  privilegeMutation: false,
  assignmentMutation: false,
  effectiveDatesInvented: false,
});

let activeFixture = null;

afterEach(() => {
  activeFixture?.close();
  activeFixture = null;
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

function profile({
  studentId,
  institutionalEmail,
  displayName = 'Synthetic Gate A Person',
  verificationResult = 'VERIFIED',
  active = true,
  reviewNotes = '',
}) {
  return {
    studentId,
    institutionalEmail,
    displayName,
    verificationResult,
    active,
    reviewNotes,
  };
}

function expectSafe(plan, fixture) {
  expect(plan.safety).toEqual(expectedSafety);
  expect(plan.source.providerRead).toBe(false);
  expect(fixture.count('staff_assignments')).toBe(0);
}

async function createFixture() {
  const database = new DatabaseSync(':memory:');
  const migrationDirectory = resolve(repositoryRoot, 'migrations');
  const migrations = (await readdir(migrationDirectory)).filter((name) => name.endsWith('.sql')).sort();
  for (const migration of migrations) {
    database.exec(await readFile(resolve(migrationDirectory, migration), 'utf8'));
  }
  database.exec(
    "INSERT INTO roles (id, label, scope_mode) VALUES ('SYNTHETIC_GATE_A_ROLE', 'Synthetic Gate A role', 'DENY')",
  );
  database.exec(
    "INSERT INTO accounts (id, access_id_normalized, status, role_id, credential_version, created_at, updated_at) VALUES ('ACTOR-SYNTHETIC-OWNER', 'synthetic.gate.a.owner', 'ACTIVE', 'SYNTHETIC_GATE_A_ROLE', 1, '2026-08-16T12:00:00.000Z', '2026-08-16T12:00:00.000Z')",
  );

  const db = d1Adapter(database);
  const foundationRepository = createD1IdentityFoundationRepository(db);
  const rosterRepository = createD1IdentityRosterRepository(db);
  const crypto = createIdentityRosterCrypto({
    secret: 'SYNTHETIC-GATE-A-SECRET-2026-08-16-NOT-PRODUCTION',
  });
  let sourceRows = [];
  let clockSequence = 0;
  let recordSequence = 0;
  let personSequence = 0;
  let runSequence = 0;
  let serviceSequence = 0;
  const nowIso = () => new Date(Date.parse(time) + ++clockSequence).toISOString();
  const nextRecordId = (prefix) => `${prefix}-GATE-A-${String(++recordSequence).padStart(4, '0')}`;
  const nextPersonId = () =>
    createCanonicalPersonId(() => `00000000-0000-4000-8000-${String(++personSequence).padStart(12, '0')}`);
  const source = {
    status: () => ({ configured: true, missingConfiguration: [] }),
    async read() {
      return {
        headers: [...IDENTITY_ROSTER_HEADERS],
        rows: sourceRows.map((row) => [...row]),
      };
    },
  };
  const rosterService = createIdentityRosterService({
    repository: rosterRepository,
    source,
    crypto,
    clock: { now: () => Date.parse(time) + ++clockSequence },
    createId: () => `GATE-A-${String(++serviceSequence).padStart(4, '0')}`,
  });
  const reconciliationService = createIdentityFoundationReconciliationService({
    legacyRosterRepository: rosterRepository,
    foundationRepository,
    crypto,
  });

  const createPerson = async (personId = nextPersonId()) => {
    await foundationRepository.createPerson({
      personId,
      sourceProvenanceEnvelope: null,
      createdAt: nowIso(),
    });
    return personId;
  };
  const createCanonicalEmail = async ({ id = nextRecordId('EML'), personId, fingerprint, primary = true }) =>
    foundationRepository.createPersonEmail({
      id,
      personId,
      protectedEmailEnvelope: await crypto.encrypt({ fixture: 'gate-a', fingerprint }),
      normalizedEmailFingerprint: fingerprint,
      state: PERSON_EMAIL_STATE.ACTIVE,
      verificationState: PERSON_EMAIL_VERIFICATION_STATE.VERIFIED,
      isPrimary: primary,
      sourceProvenanceEnvelope: null,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    });
  const seedCanonical = async ({ personId = nextPersonId(), fingerprint, primary = true } = {}) => {
    await createPerson(personId);
    await createCanonicalEmail({ personId, fingerprint, primary });
    return personId;
  };
  const seedAccount = ({ id, fingerprint = '', status = 'ACTIVE', verifiedAt = time }) => {
    database
      .prepare(
        `INSERT INTO accounts (
           id, access_id_normalized, status, role_id, credential_version,
           profile_email_verified_at, verified_email_fingerprint, created_at, updated_at
         ) VALUES (?1, ?2, ?3, 'SYNTHETIC_GATE_A_ROLE', 1, ?4, ?5, ?6, ?7)`,
      )
      .run(id, `synthetic.${id.toLowerCase()}`, status, verifiedAt, fingerprint, nowIso(), nowIso());
  };
  const seedAppliedProjection = async (entries, options = {}) => {
    const sequence = ++runSequence;
    const runId = options.runId ?? `RSY-GATE-A-DIRECT-${String(sequence).padStart(4, '0')}`;
    const sourceFingerprint =
      options.sourceFingerprint ?? `SRC-GATE-A-DIRECT-${String(sequence).padStart(4, '0')}`;
    const preparedEntries = await Promise.all(
      entries.map(async (entry) => {
        const entryProfile = entry.profile ?? entry;
        return {
          identityKey: entry.identityKey ?? (await crypto.identityKey(entryProfile.institutionalEmail)),
          protectedProfileEnvelope: entry.protectedProfileEnvelope ?? (await crypto.encrypt(entryProfile)),
          active: (entry.active ?? entryProfile.active) === true,
        };
      }),
    );
    const createdAt = nowIso();
    database
      .prepare(
        `INSERT INTO identity_roster_sync_runs (
           id, source_fingerprint, source_row_count, accepted_count, rejection_count,
           add_count, change_count, removal_count, unchanged_count, validation_status,
           apply_status, protected_source_envelope, protected_rejections_envelope,
           created_by_account_id, created_at, applied_at, correlation_id
         ) VALUES (?1, ?2, ?3, ?4, 0, ?4, 0, 0, 0, 'VALID', 'APPLIED', ?5, ?6, ?7, ?8, ?8, ?9)`,
      )
      .run(
        runId,
        sourceFingerprint,
        options.sourceRowCount ?? preparedEntries.length,
        options.acceptedCount ?? preparedEntries.length,
        await crypto.encrypt([]),
        await crypto.encrypt([]),
        owner.id,
        createdAt,
        `COR-GATE-A-DIRECT-${sequence}`,
      );
    for (const entry of preparedEntries) {
      database
        .prepare(
          `INSERT INTO identity_roster_entries (
             identity_key, protected_profile_envelope, active, source_fingerprint, source_run_id, updated_at
           ) VALUES (?1, ?2, ?3, ?4, ?5, ?6)`,
        )
        .run(
          entry.identityKey,
          entry.protectedProfileEnvelope,
          entry.active ? 1 : 0,
          sourceFingerprint,
          runId,
          createdAt,
        );
    }
    return { runId, sourceFingerprint, entries: preparedEntries };
  };
  const orchestrateFixtureOnly = async (profiles) => {
    let canonicalPersonCreates = 0;
    let canonicalEmailCreates = 0;
    let accountLinkCreates = 0;
    for (const entry of profiles) {
      const fingerprint = await crypto.identityKey(entry.institutionalEmail);
      const matches = await foundationRepository.listCanonicalEmailMatches(fingerprint);
      const activeMatches = matches.filter(
        (match) =>
          match.state === PERSON_EMAIL_STATE.ACTIVE &&
          match.verificationState === PERSON_EMAIL_VERIFICATION_STATE.VERIFIED,
      );
      if (activeMatches.length > 1 || (matches.length && activeMatches.length !== 1)) {
        throw new Error('The fixture cannot orchestrate an ambiguous canonical email.');
      }
      let personId = activeMatches[0]?.personId ?? null;
      if (!personId) {
        personId = await createPerson();
        await createCanonicalEmail({ personId, fingerprint });
        canonicalPersonCreates += 1;
        canonicalEmailCreates += 1;
      }
      const accounts = await foundationRepository.listAccountsByVerifiedEmailFingerprint(fingerprint);
      const eligibleAccounts = accounts.filter(
        (account) =>
          ['ACTIVE', 'STARTER'].includes(account.status) && Boolean(account.profileEmailVerifiedAt),
      );
      if (eligibleAccounts.length > 1) {
        throw new Error('The fixture cannot orchestrate ambiguous account candidates.');
      }
      const account = eligibleAccounts[0];
      if (!account) continue;
      const activeLink = await foundationRepository.getActiveAccountStaffLink(account.id);
      if (!activeLink) {
        await foundationRepository.createAccountStaffLink({
          id: nextRecordId('LNK'),
          accountId: account.id,
          personId,
          state: ACCOUNT_STAFF_LINK_STATE.ACTIVE,
          sourceProvenanceEnvelope: null,
          createdAt: nowIso(),
          updatedAt: nowIso(),
        });
        accountLinkCreates += 1;
      } else if (activeLink.personId !== personId) {
        throw new Error('The fixture cannot overwrite a conflicting account link.');
      }
    }
    return { canonicalPersonCreates, canonicalEmailCreates, accountLinkCreates };
  };

  return {
    database,
    foundationRepository,
    rosterRepository,
    crypto,
    rosterService,
    count(table) {
      return Number(database.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get().count);
    },
    close() {
      database.close();
    },
    createCanonicalEmail,
    createPerson,
    nextPersonId,
    orchestrateFixtureOnly,
    preview: () => reconciliationService.preview({ actor: owner }),
    reconciliationWithAmbiguousAccounts() {
      return createIdentityFoundationReconciliationService({
        legacyRosterRepository: rosterRepository,
        foundationRepository: {
          ...foundationRepository,
          async listAccountsByVerifiedEmailFingerprint() {
            return [
              {
                id: 'ACCT-GATE-A-AMBIGUOUS-01',
                status: 'ACTIVE',
                profileEmailVerifiedAt: time,
              },
              {
                id: 'ACCT-GATE-A-AMBIGUOUS-02',
                status: 'STARTER',
                profileEmailVerifiedAt: time,
              },
            ];
          },
        },
        crypto,
      });
    },
    seedAccount,
    seedAppliedProjection,
    seedCanonical,
    setSourceRows(rows) {
      sourceRows = rows.map((row) => [...row]);
    },
  };
}

async function fixture() {
  activeFixture = await createFixture();
  return activeFixture;
}

describe('v0.8.3 Gate A provider-free local identity foundation fixture', () => {
  it('S00 replays migrations 0031 and 0032 locally, rejects malformed identifiers, and resets to empty state', async () => {
    const first = await fixture();
    expect(first.database.prepare('PRAGMA integrity_check').get()).toEqual({ integrity_check: 'ok' });
    expect(first.database.prepare('PRAGMA foreign_key_check').all()).toEqual([]);
    expect(
      first.database.prepare("SELECT value FROM app_metadata WHERE key = 'operational_schema_version'").get(),
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
      expect(first.count(table)).toBe(0);
    }
    expect(() =>
      first.database
        .prepare('INSERT INTO canonical_people (person_id, created_at) VALUES (?1, ?2)')
        .run('PER-00000000-0000-Z000-8000-000000000000', time),
    ).toThrow();
    const blocked = await first.preview();
    expect(blocked.status).toBe(IDENTITY_FOUNDATION_RECONCILIATION_STATUS.BLOCKED_NO_APPLIED_PROJECTION);
    expectSafe(blocked, first);

    first.close();
    activeFixture = null;
    const replay = await fixture();
    for (const table of ['canonical_people', 'person_emails', 'account_staff_links', 'staff_assignments']) {
      expect(replay.count(table)).toBe(0);
    }
    const resetBlocked = await replay.preview();
    expect(resetBlocked.status).toBe(IDENTITY_FOUNDATION_RECONCILIATION_STATUS.BLOCKED_NO_APPLIED_PROJECTION);
    expectSafe(resetBlocked, replay);
  });

  it('S01, S03, and S04 create a clean person and deterministic link once, then replay with zero writes', async () => {
    const gate = await fixture();
    const clean = profile({
      studentId: 'STUDENT-GATE-A-001',
      institutionalEmail: 'gate.a.one@example.invalid',
      displayName: 'Synthetic Gate A One',
    });
    const fingerprint = await gate.crypto.identityKey(clean.institutionalEmail);
    gate.seedAccount({ id: 'ACCT-GATE-A-001', fingerprint });
    await gate.seedAppliedProjection([clean]);

    const plan = await gate.preview();
    expect(plan.status).toBe(IDENTITY_FOUNDATION_RECONCILIATION_STATUS.READY);
    expect(plan.candidates).toMatchObject({
      canonicalPersonCreateCount: 1,
      explicitAccountLinkCandidateCount: 1,
      quarantineCount: 0,
    });
    expectSafe(plan, gate);
    await expect(gate.orchestrateFixtureOnly([clean])).resolves.toEqual({
      canonicalPersonCreates: 1,
      canonicalEmailCreates: 1,
      accountLinkCreates: 1,
    });
    const [match] = await gate.foundationRepository.listCanonicalEmailMatches(fingerprint);
    await expect(
      gate.foundationRepository.getActiveAccountStaffLink('ACCT-GATE-A-001'),
    ).resolves.toMatchObject({
      accountId: 'ACCT-GATE-A-001',
      personId: match.personId,
      state: ACCOUNT_STAFF_LINK_STATE.ACTIVE,
    });
    expect(gate.count('canonical_people')).toBe(1);
    expect(gate.count('person_emails')).toBe(1);
    expect(gate.count('account_staff_links')).toBe(1);

    await expect(gate.orchestrateFixtureOnly([clean])).resolves.toEqual({
      canonicalPersonCreates: 0,
      canonicalEmailCreates: 0,
      accountLinkCreates: 0,
    });
    const replayPlan = await gate.preview();
    expect(replayPlan.candidates).toMatchObject({
      canonicalPersonExistingCount: 1,
      existingAccountLinkCount: 1,
      quarantineCount: 0,
    });
    expectSafe(replayPlan, gate);
  });

  it('S02 and S05 reject duplicate canonical fingerprints and active account links', async () => {
    const gate = await fixture();
    const fingerprint = await gate.crypto.identityKey('gate.a.duplicate@example.invalid');
    const firstPerson = await gate.seedCanonical({ fingerprint });
    const secondPerson = await gate.createPerson();
    await expect(
      gate.createCanonicalEmail({
        personId: secondPerson,
        fingerprint,
        primary: false,
      }),
    ).rejects.toThrow();
    gate.seedAccount({ id: 'ACCT-GATE-A-DUPLICATE', fingerprint });
    await gate.foundationRepository.createAccountStaffLink({
      id: 'LNK-GATE-A-ORIGINAL',
      accountId: 'ACCT-GATE-A-DUPLICATE',
      personId: firstPerson,
      state: ACCOUNT_STAFF_LINK_STATE.ACTIVE,
      sourceProvenanceEnvelope: null,
      createdAt: time,
      updatedAt: time,
    });
    await expect(
      gate.foundationRepository.createAccountStaffLink({
        id: 'LNK-GATE-A-DUPLICATE',
        accountId: 'ACCT-GATE-A-DUPLICATE',
        personId: secondPerson,
        state: ACCOUNT_STAFF_LINK_STATE.ACTIVE,
        sourceProvenanceEnvelope: null,
        createdAt: time,
        updatedAt: time,
      }),
    ).rejects.toThrow();
    expect(gate.count('person_emails')).toBe(1);
    expect(gate.count('account_staff_links')).toBe(1);
    const blocked = await gate.preview();
    expect(blocked.status).toBe(IDENTITY_FOUNDATION_RECONCILIATION_STATUS.BLOCKED_NO_APPLIED_PROJECTION);
    expectSafe(blocked, gate);
  });

  it('S06 quarantines an ambiguous local account read without weakening the unique account schema', async () => {
    const gate = await fixture();
    const rosterProfile = profile({
      studentId: 'STUDENT-GATE-A-006',
      institutionalEmail: 'gate.a.ambiguous@example.invalid',
    });
    const fingerprint = await gate.crypto.identityKey(rosterProfile.institutionalEmail);
    await gate.seedCanonical({ fingerprint });
    await gate.seedAppliedProjection([rosterProfile]);

    // Schema 0030 prohibits this duplicate in a normal table state. This local read facade models
    // contradictory legacy/read-model candidates so reconciliation still fails closed if encountered.
    const plan = await gate.reconciliationWithAmbiguousAccounts().preview({ actor: owner });
    expect(plan.status).toBe(IDENTITY_FOUNDATION_RECONCILIATION_STATUS.READY_WITH_QUARANTINE);
    expect(plan.candidates).toMatchObject({
      canonicalPersonCreateCount: 0,
      canonicalPersonExistingCount: 0,
      explicitAccountLinkCandidateCount: 0,
      quarantineCount: 1,
    });
    expectSafe(plan, gate);
    expect(gate.count('account_staff_links')).toBe(0);
  });

  it('S07, S08, and S09 quarantine empty email, identity-key mismatch, and decrypt failure entries', async () => {
    const gate = await fixture();
    const emptyEmail = profile({
      studentId: 'STUDENT-GATE-A-007',
      institutionalEmail: '',
      displayName: 'Synthetic Empty Email',
    });
    const keyMismatch = profile({
      studentId: 'STUDENT-GATE-A-008',
      institutionalEmail: 'gate.a.key-mismatch@example.invalid',
    });
    const decryptFailure = profile({
      studentId: 'STUDENT-GATE-A-009',
      institutionalEmail: 'gate.a.decrypt-failure@example.invalid',
    });
    await gate.seedAppliedProjection([
      { profile: emptyEmail, identityKey: await gate.crypto.identityKey('') },
      {
        profile: keyMismatch,
        identityKey: await gate.crypto.identityKey('not-the-same@example.invalid'),
      },
      {
        profile: decryptFailure,
        protectedProfileEnvelope: 'v1.synthetic-invalid-envelope',
      },
    ]);

    const plan = await gate.preview();
    expect(plan.status).toBe(IDENTITY_FOUNDATION_RECONCILIATION_STATUS.READY_WITH_QUARANTINE);
    expect(plan.candidates).toMatchObject({
      canonicalPersonCreateCount: 0,
      quarantineCount: 3,
      preservedInactiveOrUnverifiedCount: 0,
    });
    expectSafe(plan, gate);
    expect(gate.count('canonical_people')).toBe(0);
  });

  it('S10 and S11 preserve inactive or unverified state and exclude inactive or verification-null accounts', async () => {
    const gate = await fixture();
    const verified = profile({
      studentId: 'STUDENT-GATE-A-010',
      institutionalEmail: 'gate.a.account-excluded@example.invalid',
    });
    const unverified = profile({
      studentId: 'STUDENT-GATE-A-011',
      institutionalEmail: 'gate.a.unverified@example.invalid',
      verificationResult: 'NOT_VERIFIED',
    });
    const fingerprint = await gate.crypto.identityKey(verified.institutionalEmail);
    await gate.seedCanonical({ fingerprint });
    gate.seedAccount({
      id: 'ACCT-GATE-A-NULL-VERIFICATION',
      fingerprint,
      status: 'ACTIVE',
      verifiedAt: null,
    });
    gate.seedAccount({
      id: 'ACCT-GATE-A-INACTIVE',
      fingerprint,
      status: 'DISABLED',
      verifiedAt: time,
    });
    await gate.seedAppliedProjection([verified, unverified]);

    const plan = await gate.preview();
    expect(plan.status).toBe(IDENTITY_FOUNDATION_RECONCILIATION_STATUS.READY);
    expect(plan.candidates).toMatchObject({
      canonicalPersonExistingCount: 1,
      explicitAccountLinkCandidateCount: 0,
      preservedInactiveOrUnverifiedCount: 1,
      quarantineCount: 0,
    });
    expectSafe(plan, gate);
    expect(gate.count('account_staff_links')).toBe(0);
  });

  it('S12 and S13 count a correct link but quarantine a conflicting existing link untouched', async () => {
    const gate = await fixture();
    const correct = profile({
      studentId: 'STUDENT-GATE-A-012',
      institutionalEmail: 'gate.a.correct-link@example.invalid',
    });
    const conflict = profile({
      studentId: 'STUDENT-GATE-A-013',
      institutionalEmail: 'gate.a.conflicting-link@example.invalid',
    });
    const correctFingerprint = await gate.crypto.identityKey(correct.institutionalEmail);
    const conflictFingerprint = await gate.crypto.identityKey(conflict.institutionalEmail);
    const correctPerson = await gate.seedCanonical({ fingerprint: correctFingerprint });
    const conflictPerson = await gate.seedCanonical({ fingerprint: conflictFingerprint });
    const otherPerson = await gate.seedCanonical({
      fingerprint: await gate.crypto.identityKey('gate.a.other-person@example.invalid'),
    });
    gate.seedAccount({ id: 'ACCT-GATE-A-CORRECT', fingerprint: correctFingerprint });
    gate.seedAccount({ id: 'ACCT-GATE-A-CONFLICT', fingerprint: conflictFingerprint });
    await gate.foundationRepository.createAccountStaffLink({
      id: 'LNK-GATE-A-CORRECT',
      accountId: 'ACCT-GATE-A-CORRECT',
      personId: correctPerson,
      state: ACCOUNT_STAFF_LINK_STATE.ACTIVE,
      sourceProvenanceEnvelope: null,
      createdAt: time,
      updatedAt: time,
    });
    await gate.foundationRepository.createAccountStaffLink({
      id: 'LNK-GATE-A-CONFLICT',
      accountId: 'ACCT-GATE-A-CONFLICT',
      personId: otherPerson,
      state: ACCOUNT_STAFF_LINK_STATE.ACTIVE,
      sourceProvenanceEnvelope: null,
      createdAt: time,
      updatedAt: time,
    });
    await gate.seedAppliedProjection([correct, conflict]);

    const plan = await gate.preview();
    expect(plan.status).toBe(IDENTITY_FOUNDATION_RECONCILIATION_STATUS.READY_WITH_QUARANTINE);
    expect(plan.candidates).toMatchObject({
      canonicalPersonExistingCount: 2,
      existingAccountLinkCount: 1,
      explicitAccountLinkCandidateCount: 0,
      quarantineCount: 1,
    });
    expectSafe(plan, gate);
    await expect(
      gate.foundationRepository.getActiveAccountStaffLink('ACCT-GATE-A-CONFLICT'),
    ).resolves.toMatchObject({
      personId: otherPerson,
    });
    expect(conflictPerson).not.toBe(otherPerson);
  });

  it('S14 does not use similar display names to merge distinct canonical people', async () => {
    const gate = await fixture();
    const first = profile({
      studentId: 'STUDENT-GATE-A-014-A',
      institutionalEmail: 'gate.a.same-name.one@example.invalid',
      displayName: 'Synthetic Similar Name',
    });
    const second = profile({
      studentId: 'STUDENT-GATE-A-014-B',
      institutionalEmail: 'gate.a.same-name.two@example.invalid',
      displayName: 'Synthetic Similar Name',
    });
    await gate.seedAppliedProjection([first, second]);

    const plan = await gate.preview();
    expect(plan.candidates).toMatchObject({ canonicalPersonCreateCount: 2, quarantineCount: 0 });
    expectSafe(plan, gate);
    await expect(gate.orchestrateFixtureOnly([first, second])).resolves.toEqual({
      canonicalPersonCreates: 2,
      canonicalEmailCreates: 2,
      accountLinkCreates: 0,
    });
    expect(gate.count('canonical_people')).toBe(2);
    expect(gate.count('person_emails')).toBe(2);
  });

  it('S15 retains an existing fingerprint person and creates a distinct new fingerprint person', async () => {
    const gate = await fixture();
    const existing = profile({
      studentId: 'STUDENT-GATE-A-015-A',
      institutionalEmail: 'gate.a.existing@example.invalid',
      displayName: 'Synthetic Shared Name',
    });
    const newPerson = profile({
      studentId: 'STUDENT-GATE-A-015-B',
      institutionalEmail: 'gate.a.new@example.invalid',
      displayName: 'Synthetic Shared Name',
    });
    const existingFingerprint = await gate.crypto.identityKey(existing.institutionalEmail);
    await gate.seedCanonical({ fingerprint: existingFingerprint });
    await gate.seedAppliedProjection([existing, newPerson]);

    const plan = await gate.preview();
    expect(plan.candidates).toMatchObject({
      canonicalPersonExistingCount: 1,
      canonicalPersonCreateCount: 1,
      quarantineCount: 0,
    });
    expectSafe(plan, gate);
    await expect(gate.orchestrateFixtureOnly([existing, newPerson])).resolves.toEqual({
      canonicalPersonCreates: 1,
      canonicalEmailCreates: 1,
      accountLinkCreates: 0,
    });
    expect(gate.count('canonical_people')).toBe(2);
  });

  it('S16 allows a clean sibling through while quarantining one corrupt projection entry', async () => {
    const gate = await fixture();
    const corrupt = profile({
      studentId: 'STUDENT-GATE-A-016-A',
      institutionalEmail: 'gate.a.corrupt@example.invalid',
    });
    const clean = profile({
      studentId: 'STUDENT-GATE-A-016-B',
      institutionalEmail: 'gate.a.clean-sibling@example.invalid',
    });
    await gate.seedAppliedProjection([
      { profile: corrupt, protectedProfileEnvelope: 'v1.synthetic-corrupt-envelope' },
      clean,
    ]);

    const plan = await gate.preview();
    expect(plan.status).toBe(IDENTITY_FOUNDATION_RECONCILIATION_STATUS.READY_WITH_QUARANTINE);
    expect(plan.candidates).toMatchObject({
      canonicalPersonCreateCount: 1,
      quarantineCount: 1,
    });
    expectSafe(plan, gate);
    await expect(gate.orchestrateFixtureOnly([clean])).resolves.toEqual({
      canonicalPersonCreates: 1,
      canonicalEmailCreates: 1,
      accountLinkCreates: 0,
    });
    expect(gate.count('canonical_people')).toBe(1);
  });

  it('S17 runs the actual synthetic six-row roster preview, apply, reconcile, and replay locally', async () => {
    const gate = await fixture();
    gate.setSourceRows([
      ['STUDENT-GATE-A-017-01', 'gate.a.one@example.invalid', 'Synthetic One', 'VERIFIED', true, ''],
      ['STUDENT-GATE-A-017-02', 'gate.a.two@example.invalid', 'Synthetic Two', 'VERIFIED', true, ''],
      ['STUDENT-GATE-A-017-03', 'gate.a.three@example.invalid', 'Synthetic Three', 'VERIFIED', true, ''],
      ['STUDENT-GATE-A-017-04', 'gate.a.four@example.invalid', 'Synthetic Four', 'VERIFIED', true, ''],
      ['STUDENT-GATE-A-017-05', 'gate.a.duplicate@example.invalid', 'Synthetic Five', 'VERIFIED', true, ''],
      ['STUDENT-GATE-A-017-06', 'gate.a.duplicate@example.invalid', 'Synthetic Six', 'VERIFIED', true, ''],
    ]);

    const preview = await gate.rosterService.preview({ actor: owner, correlationId: 'COR-GATE-A-S17' });
    expect(preview).toMatchObject({
      sourceRowCount: 6,
      acceptedCount: 4,
      rejectionCount: 2,
      validationStatus: 'VALID_WITH_REJECTIONS',
      applyStatus: 'PREVIEWED',
    });
    const applied = await gate.rosterService.apply({
      actor: owner,
      command: {
        runId: preview.id,
        confirmSourceFingerprint: preview.sourceFingerprint,
        reason: 'Apply the reviewed synthetic Gate A roster locally.',
      },
      correlationId: 'COR-GATE-A-S17-APPLY',
    });
    expect(applied).toMatchObject({
      applied: true,
      replayed: false,
      reconciliation: { entryCount: 4, matchingCount: 4, reconciled: true },
    });
    await expect(
      gate.rosterService.apply({
        actor: owner,
        command: {
          runId: preview.id,
          confirmSourceFingerprint: preview.sourceFingerprint,
          reason: 'Replay the exact synthetic Gate A roster safely.',
        },
      }),
    ).resolves.toMatchObject({ applied: true, replayed: true });

    const plan = await gate.preview();
    expect(plan.status).toBe(IDENTITY_FOUNDATION_RECONCILIATION_STATUS.READY);
    expect(plan.source).toMatchObject({
      sourceRowCount: 6,
      acceptedProjectionCount: 4,
      currentProjectionEntryCount: 4,
      matchingProjectionEntryCount: 4,
      projectionDiscrepancy: 0,
    });
    expect(plan.candidates).toMatchObject({
      canonicalPersonCreateCount: 4,
      canonicalPersonExistingCount: 0,
      explicitAccountLinkCandidateCount: 0,
      quarantineCount: 0,
    });
    expectSafe(plan, gate);
    expect(gate.count('canonical_people')).toBe(0);
    expect(gate.count('person_emails')).toBe(0);
  });
});
