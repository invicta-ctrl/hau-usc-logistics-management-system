import { describe, expect, it } from 'vitest';
import { createD1AccountApplicationRepository } from '../../src/server/d1/account-application-repository.js';

function applicationRow(overrides = {}) {
  return {
    id: 'APP-SYNTHETIC-001',
    application_code: 'AAP-SYNTHETIC-001',
    email_fingerprint: 'KEYED-EMAIL-FP',
    protected_email_envelope: 'v1.synthetic.email-envelope',
    protected_profile_envelope: 'v1.synthetic.profile-envelope',
    department_id: 'USC-DEPT-DOL',
    course_id: 'COURSE-SYNTHETIC',
    year_level: 2,
    requested_username_normalized: 'synthetic.applicant',
    pending_password_credential_json: '{"hash":"synthetic"}',
    requested_access_json: '{"requestedRoleId":"REQUESTER"}',
    state: 'PENDING_DIRECTOR_APPROVAL',
    revision: 3,
    status_token_digest: 'STATUS-DIGEST',
    status_token_expires_at: '2026-09-03T10:00:00.000Z',
    client_request_id: 'submit-synthetic-repository-001',
    administrator_reviewer_id: 'ADMIN-SYNTHETIC-001',
    administrator_reviewed_at: '2026-08-03T10:00:00.000Z',
    director_reviewer_id: null,
    director_reviewed_at: null,
    approved_account_id: null,
    approved_account_code: null,
    expires_at: '2026-09-03T10:00:00.000Z',
    created_at: '2026-08-03T10:00:00.000Z',
    updated_at: '2026-08-03T10:00:00.000Z',
    archived_at: null,
    ...overrides,
  };
}

function d1Probe({ batchError = null, row = null, batchResults = [] } = {}) {
  const prepared = [];
  const batches = [];
  const firstCalls = [];
  const db = {
    prepare(sql) {
      const statement = {
        sql,
        values: [],
        bind(...values) {
          this.values = values;
          return this;
        },
        async first() {
          firstCalls.push(this);
          return row;
        },
        async all() {
          return { results: [] };
        },
        async run() {
          throw new Error('Repository writes must remain in a guarded D1 batch.');
        },
      };
      prepared.push(statement);
      return statement;
    },
    async batch(statements) {
      batches.push(statements);
      if (batchError) throw batchError;
      return batchResults.length ? batchResults : statements.map(() => ({ meta: { changes: 1 } }));
    },
  };
  return { db, prepared, batches, firstCalls };
}

const timestamp = '2026-08-03T10:00:00.000Z';

function history({
  id,
  idempotencyKey,
  toState = 'PENDING_DIRECTOR_APPROVAL',
  expectedRevision = 2,
  resultingRevision = 3,
}) {
  return {
    id,
    applicationId: 'APP-SYNTHETIC-001',
    fromState: 'PENDING_ADMIN_REVIEW',
    toState,
    actorAccountId: 'ADMIN-SYNTHETIC-001',
    applicantAuthorityFingerprint: '',
    reason: 'Synthetic repository contract verification.',
    before: { state: 'PENDING_ADMIN_REVIEW', revision: expectedRevision },
    after: { state: toState },
    expectedRevision,
    resultingRevision,
    idempotencyKey,
    correlationId: `COR-${id}`,
    createdAt: timestamp,
  };
}

function audit({ id, action, accountId = '' }) {
  return {
    id,
    applicationId: 'APP-SYNTHETIC-001',
    accountId,
    actorAccountId: 'DIRECTOR-SYNTHETIC-001',
    action,
    before: {},
    after: { state: action },
    correlationId: `COR-${id}`,
    reason: 'Synthetic repository contract verification.',
    createdAt: timestamp,
  };
}

function starterAccount() {
  return {
    id: 'ACCOUNT-SYNTHETIC-001',
    accessIdNormalized: 'HAU-STAFF-001',
    collisionKey: 'HAUSTAFF001',
    roleId: 'REQUESTER',
    defaultCommitteeId: '',
    committeeIds: [],
    accessProfile: {
      presetId: 'REQUESTER',
      workspaceIds: [],
      defaultWorkspaceId: '',
      locationScopeIds: [],
      eventSeriesScopeIds: [],
      eventScopeIds: [],
      capabilityGrants: [],
      capabilityDenies: [],
    },
    temporaryCredential: { hash: 'synthetic-hash' },
    createdAt: timestamp,
    lendingEligible: false,
    institutionId: '',
    departmentId: '',
    usernameNormalized: 'synthetic.applicant',
    verifiedEmailFingerprint: 'KEYED-EMAIL-FP',
    profileCourseId: 'COURSE-SYNTHETIC',
    profileYearLevel: 2,
  };
}

describe('D1 account-application repository contract', () => {
  it('targets the migration 0030 challenge receipt and identity-class columns in one guarded batch', async () => {
    const probe = d1Probe({
      row: {
        id: 'CHALLENGE-SYNTHETIC-001',
        email_fingerprint: 'KEYED-EMAIL-FP',
        protected_email_envelope: 'v1.synthetic.email-envelope',
        identity_class_id: 'SYNTHETIC_STAFF',
        secret_digest: 'CODE-DIGEST',
        verification_receipt_digest: null,
        purpose: 'ACCOUNT_APPLICATION',
        status: 'PENDING',
        expires_at: '2026-08-03T10:10:00.000Z',
        attempt_count: 0,
        resend_count: 1,
        created_at: timestamp,
        last_sent_at: null,
        verified_at: null,
        consumed_at: null,
      },
    });
    const repository = createD1AccountApplicationRepository(probe.db);

    await repository.createVerificationChallenge({
      id: 'CHALLENGE-SYNTHETIC-001',
      emailFingerprint: 'KEYED-EMAIL-FP',
      protectedEmailEnvelope: 'v1.synthetic.email-envelope',
      identityClassId: 'SYNTHETIC_STAFF',
      secretDigest: 'CODE-DIGEST',
      purpose: 'ACCOUNT_APPLICATION',
      expiresAt: '2026-08-03T10:10:00.000Z',
      resendCount: 1,
      createdAt: timestamp,
    });

    expect(probe.batches).toHaveLength(1);
    const sql = probe.batches[0].map((statement) => statement.sql);
    expect(sql[0]).toContain("json_extract('ACCOUNT_APPLICATION_CHALLENGE_ID_CONFLICT'");
    expect(sql[1]).toContain("SET status = 'REVOKED'");
    expect(sql[2]).toContain('identity_class_id');
    expect(sql[2]).toContain('verification_receipt_digest');
    expect(sql[2]).toContain('secret_digest');
  });

  it('places the transition guard before every mutable statement so a failed guard leaves no follow-up call', async () => {
    const probe = d1Probe({ batchError: new Error('ACCOUNT_APPLICATION_TRANSITION_GUARD_FAILED') });
    const repository = createD1AccountApplicationRepository(probe.db);

    await expect(
      repository.transitionApplication({
        applicationId: 'APP-SYNTHETIC-001',
        fromState: 'PENDING_ADMIN_REVIEW',
        toState: 'PENDING_DIRECTOR_APPROVAL',
        expectedRevision: 2,
        actorAccountId: 'ADMIN-SYNTHETIC-001',
        idempotencyKey: 'admin-forward-repository-001',
        occurredAt: timestamp,
        updates: { administratorReviewerId: 'ADMIN-SYNTHETIC-001', administratorReviewedAt: timestamp },
        history: history({ id: 'HISTORY-FORWARD-001', idempotencyKey: 'admin-forward-repository-001' }),
        audit: audit({ id: 'AUDIT-FORWARD-001', action: 'ACCOUNT_APPLICATION_ADMIN_FORWARDED' }),
      }),
    ).rejects.toThrow('ACCOUNT_APPLICATION_TRANSITION_GUARD_FAILED');

    expect(probe.batches).toHaveLength(1);
    const sql = probe.batches[0].map((statement) => statement.sql);
    expect(sql[0]).toContain("json_extract('ACCOUNT_APPLICATION_TRANSITION_GUARD_FAILED'");
    expect(sql[1]).toContain('UPDATE account_applications');
    expect(sql[2]).toContain('INSERT INTO account_application_history');
    expect(sql[3]).toContain('INSERT INTO audit_log');
    expect(probe.firstCalls).toEqual([]);
  });

  it('guards distinct approval and canonical starter-account creation in one D1 batch', async () => {
    const probe = d1Probe({ batchError: new Error('ACCOUNT_APPLICATION_APPROVAL_GUARD_FAILED') });
    const repository = createD1AccountApplicationRepository(probe.db);
    const approvalHistory = history({
      id: 'HISTORY-APPROVE-001',
      idempotencyKey: 'director-approve-repository-001',
      toState: 'APPROVED_ACTIVATION_REQUIRED',
      expectedRevision: 3,
      resultingRevision: 4,
    });

    await expect(
      repository.approveApplication({
        applicationId: 'APP-SYNTHETIC-001',
        expectedRevision: 3,
        actorAccountId: 'ADMIN-SYNTHETIC-001',
        idempotencyKey: 'director-approve-repository-001',
        approvedAt: timestamp,
        starterAccount: starterAccount(),
        history: approvalHistory,
        accountAudit: audit({
          id: 'AUDIT-ACCOUNT-001',
          action: 'STARTER_ACCOUNT_CREATED',
          accountId: 'ACCOUNT-SYNTHETIC-001',
        }),
        applicationAudit: audit({ id: 'AUDIT-APPROVE-001', action: 'ACCOUNT_APPLICATION_DIRECTOR_APPROVED' }),
      }),
    ).rejects.toThrow('ACCOUNT_APPLICATION_APPROVAL_GUARD_FAILED');

    expect(probe.batches).toHaveLength(1);
    const sql = probe.batches[0].map((statement) => statement.sql);
    expect(sql[0]).toContain('application.administrator_reviewer_id <> ?4');
    expect(sql[0]).toContain("json_extract('ACCOUNT_APPLICATION_APPROVAL_GUARD_FAILED'");
    expect(sql[1]).toContain('INSERT INTO accounts');
    expect(sql[2]).toContain('INSERT INTO access_id_reservations');
    expect(
      sql.some(
        (statement) =>
          statement.includes('UPDATE account_applications') &&
          statement.includes('APPROVED_ACTIVATION_REQUIRED'),
      ),
    ).toBe(true);
    expect(probe.firstCalls).toEqual([]);
  });

  it('maps a successful guarded approval to an application without exposing a credential', async () => {
    const approvedRow = applicationRow({
      state: 'APPROVED_ACTIVATION_REQUIRED',
      revision: 4,
      director_reviewer_id: 'DIRECTOR-SYNTHETIC-001',
      director_reviewed_at: timestamp,
      approved_account_id: 'ACCOUNT-SYNTHETIC-001',
      approved_account_code: 'HAU-STAFF-001',
    });
    const probe = d1Probe({ row: approvedRow });
    const repository = createD1AccountApplicationRepository(probe.db);

    const approved = await repository.approveApplication({
      applicationId: 'APP-SYNTHETIC-001',
      expectedRevision: 3,
      actorAccountId: 'DIRECTOR-SYNTHETIC-001',
      idempotencyKey: 'director-approve-repository-002',
      approvedAt: timestamp,
      starterAccount: starterAccount(),
      history: history({
        id: 'HISTORY-APPROVE-002',
        idempotencyKey: 'director-approve-repository-002',
        toState: 'APPROVED_ACTIVATION_REQUIRED',
        expectedRevision: 3,
        resultingRevision: 4,
      }),
      accountAudit: audit({
        id: 'AUDIT-ACCOUNT-002',
        action: 'STARTER_ACCOUNT_CREATED',
        accountId: 'ACCOUNT-SYNTHETIC-001',
      }),
      applicationAudit: audit({ id: 'AUDIT-APPROVE-002', action: 'ACCOUNT_APPLICATION_DIRECTOR_APPROVED' }),
    });

    expect(approved).toMatchObject({
      state: 'APPROVED_ACTIVATION_REQUIRED',
      revision: 4,
      approvedAccountId: 'ACCOUNT-SYNTHETIC-001',
      accountCode: 'HAU-STAFF-001',
    });
    expect(JSON.stringify(probe.batches)).not.toContain('ONE-TIME-PRIVATE-CREDENTIAL');
  });
});
