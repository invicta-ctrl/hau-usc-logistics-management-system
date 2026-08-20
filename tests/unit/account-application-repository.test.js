import { describe, expect, it } from 'vitest';
import { createD1AccountApplicationRepository } from '../../src/server/d1/account-application-repository.js';

function applicationRow(overrides = {}) {
  return {
    id: 'APP-SYNTHETIC-001',
    application_code: 'AAP-SYNTHETIC-001',
    email_fingerprint: 'KEYED-EMAIL-FP',
    identity_class_id: 'SYNTHETIC_STAFF',
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

function d1Probe({ batchError = null, row = null, allRows = [], batchResults = [] } = {}) {
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
          return { results: allRows };
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
  fromState = 'PENDING_ADMIN_REVIEW',
  toState = 'PENDING_DIRECTOR_APPROVAL',
  expectedRevision = 2,
  resultingRevision = 3,
}) {
  return {
    id,
    applicationId: 'APP-SYNTHETIC-001',
    fromState,
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
    profileDepartmentId: 'USC-DEPT-DOL',
    usernameNormalized: 'synthetic.applicant',
    verifiedEmailFingerprint: 'KEYED-EMAIL-FP',
    profileCourseId: 'COURSE-SYNTHETIC',
    profileYearLevel: 2,
  };
}

function submittedApplication() {
  return {
    id: 'APP-SYNTHETIC-001',
    applicationCode: 'AAP-SYNTHETIC-001',
    emailFingerprint: 'KEYED-EMAIL-FP',
    identityClassId: 'SYNTHETIC_STAFF',
    protectedEmailEnvelope: 'v1.synthetic.email-envelope',
    protectedProfileEnvelope: 'v1.synthetic.profile-envelope',
    departmentId: 'USC-DEPT-DOL',
    courseId: 'COURSE-SYNTHETIC',
    yearLevel: 2,
    requestedUsernameNormalized: 'synthetic.applicant',
    pendingPasswordCredential: { hash: 'synthetic-hash' },
    requestedAccess: { requestedRoleId: 'REQUESTER' },
    state: 'PENDING_ADMIN_REVIEW',
    revision: 2,
    statusTokenDigest: 'STATUS-DIGEST',
    statusTokenExpiresAt: '2026-09-03T10:00:00.000Z',
    clientRequestId: 'submit-synthetic-repository-001',
    expiresAt: '2026-09-03T10:00:00.000Z',
    createdAt: timestamp,
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
        purpose: 'STAFF_ACCOUNT_APPLICATION',
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
      purpose: 'STAFF_ACCOUNT_APPLICATION',
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

  it('uses a deterministic, redacted projection for scoped Administrator and Director review reads', async () => {
    const reviewRow = applicationRow({
      state: 'PENDING_ADMIN_REVIEW',
      revision: 2,
      administrator_reviewer_id: null,
      administrator_reviewed_at: null,
    });
    const probe = d1Probe({ row: reviewRow, allRows: [reviewRow] });
    const repository = createD1AccountApplicationRepository(probe.db);

    const listed = await repository.listApplicationsForReview({
      states: ['PENDING_ADMIN_REVIEW'],
      limit: 2,
      offset: 0,
    });
    const detail = await repository.getApplicationForReview({
      applicationId: 'APP-SYNTHETIC-001',
      states: ['PENDING_ADMIN_REVIEW'],
    });

    expect(listed).toEqual([
      expect.objectContaining({
        id: 'APP-SYNTHETIC-001',
        state: 'PENDING_ADMIN_REVIEW',
        requestedUsernameNormalized: 'synthetic.applicant',
      }),
    ]);
    expect(detail).toMatchObject({ id: 'APP-SYNTHETIC-001', state: 'PENDING_ADMIN_REVIEW' });
    expect(JSON.stringify({ listed, detail })).not.toContain('KEYED-EMAIL-FP');
    expect(JSON.stringify({ listed, detail })).not.toContain('v1.synthetic');
    expect(JSON.stringify({ listed, detail })).not.toContain('STATUS-DIGEST');
    expect(JSON.stringify({ listed, detail })).not.toContain('submit-synthetic-repository-001');

    const listStatement = probe.prepared.find((statement) =>
      statement.sql.includes('ORDER BY application.created_at ASC, application.id ASC'),
    );
    expect(listStatement?.sql).toContain('LIMIT ?2 OFFSET ?3');
    expect(listStatement?.sql).not.toContain('email_fingerprint');
    expect(listStatement?.sql).not.toContain('pending_password_credential_json');
    expect(listStatement?.values).toEqual(['PENDING_ADMIN_REVIEW', 2, 0]);
  });

  it('places submission eligibility and duplicate identity checks in the first guarded batch statement', async () => {
    const probe = d1Probe({ batchError: new Error('ACCOUNT_APPLICATION_SUBMISSION_GUARD_FAILED') });
    const repository = createD1AccountApplicationRepository(probe.db);
    const application = submittedApplication();
    const draft = history({
      id: 'HISTORY-DRAFT-001',
      idempotencyKey: 'initial:APP-SYNTHETIC-001',
      fromState: 'EMAIL_UNVERIFIED',
      toState: 'DRAFT',
      expectedRevision: 0,
      resultingRevision: 1,
    });
    const submission = history({
      id: 'HISTORY-SUBMIT-001',
      idempotencyKey: application.clientRequestId,
      fromState: 'DRAFT',
      toState: 'PENDING_ADMIN_REVIEW',
      expectedRevision: 1,
      resultingRevision: 2,
    });

    await expect(
      repository.createSubmittedApplication({
        application,
        verificationReceiptDigest: 'VERIFICATION-RECEIPT-DIGEST',
        eligibilityApproved: false,
        history: { draft, submission },
        audit: audit({ id: 'AUDIT-SUBMIT-001', action: 'ACCOUNT_APPLICATION_SUBMITTED' }),
      }),
    ).rejects.toThrow('ACCOUNT_APPLICATION_SUBMISSION_GUARD_FAILED');

    expect(probe.batches).toHaveLength(1);
    const sql = probe.batches[0].map((statement) => statement.sql);
    expect(sql[0]).toContain("json_extract('ACCOUNT_APPLICATION_SUBMISSION_GUARD_FAILED'");
    expect(sql[0]).toContain('AND ?5 = 1');
    expect(sql[0]).toContain("account.status IN ('ACTIVE', 'STARTER')");
    expect(sql[0]).toContain('account.verified_email_fingerprint = ?6');
    expect(sql[0]).toContain('existing_application.email_fingerprint = ?6');
    expect(sql[0]).toContain('account.username_normalized = ?7');
    expect(sql[0]).toContain('existing_application.requested_username_normalized = ?7');
    expect(sql[1]).toContain("SET status = 'CONSUMED'");
    expect(sql[2]).toContain('INSERT INTO account_applications');
    expect(probe.batches[0][0].values).toEqual([
      'VERIFICATION-RECEIPT-DIGEST',
      timestamp,
      application.clientRequestId,
      application.clientRequestId,
      0,
      application.emailFingerprint,
      application.requestedUsernameNormalized,
      application.departmentId,
    ]);
    expect(probe.firstCalls).toEqual([]);
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
        conditionalAccountAudit: audit({
          id: 'AUDIT-ACTIVATE-ACCOUNT-001',
          action: 'ACCOUNT_APPLICATION_ACTIVATED',
          accountId: 'ACCOUNT-SYNTHETIC-001',
        }),
      }),
    ).rejects.toThrow('ACCOUNT_APPLICATION_TRANSITION_GUARD_FAILED');

    expect(probe.batches).toHaveLength(1);
    const sql = probe.batches[0].map((statement) => statement.sql);
    expect(sql[0]).toContain("json_extract('ACCOUNT_APPLICATION_TRANSITION_GUARD_FAILED'");
    expect(sql[1]).toContain('UPDATE account_applications');
    expect(sql[2]).toContain('INSERT INTO account_application_history');
    expect(sql[3]).toContain('INSERT INTO audit_log');
    expect(sql[4]).toContain('INSERT INTO staff_account_activity_audit_context');
    expect(sql[5]).toContain('INSERT INTO audit_log');
    expect(sql[5]).toContain('WHERE EXISTS');
    expect(probe.firstCalls).toEqual([]);
  });

  it('guards applicant resubmission, duplicate identities, and reviewer reset in one D1 batch', async () => {
    const probe = d1Probe({ batchError: new Error('ACCOUNT_APPLICATION_RESUBMISSION_GUARD_FAILED') });
    const repository = createD1AccountApplicationRepository(probe.db);
    const entry = history({
      id: 'HISTORY-RESUBMIT-001',
      idempotencyKey: 'applicant-resubmit-repository-001',
      fromState: 'CHANGES_REQUESTED',
      toState: 'PENDING_ADMIN_REVIEW',
      expectedRevision: 3,
      resultingRevision: 4,
    });

    await expect(
      repository.resubmitApplication({
        applicationId: 'APP-SYNTHETIC-001',
        expectedRevision: 3,
        idempotencyKey: entry.idempotencyKey,
        occurredAt: timestamp,
        eligibilityApproved: false,
        emailFingerprint: 'KEYED-EMAIL-FP',
        updates: {
          protectedProfileEnvelope: 'v1.synthetic.updated-profile-envelope',
          departmentId: 'USC-DEPT-DOL',
          courseId: 'COURSE-SYNTHETIC',
          yearLevel: 3,
          requestedUsernameNormalized: 'synthetic.updated',
          pendingPasswordCredential: { hash: 'synthetic-updated-hash' },
          requestedAccess: { requestedRoleId: 'REQUESTER' },
        },
        history: entry,
        audit: audit({ id: 'AUDIT-RESUBMIT-001', action: 'ACCOUNT_APPLICATION_RESUBMITTED' }),
      }),
    ).rejects.toThrow('ACCOUNT_APPLICATION_RESUBMISSION_GUARD_FAILED');

    expect(probe.batches).toHaveLength(1);
    const sql = probe.batches[0].map((statement) => statement.sql);
    expect(sql[0]).toContain("application.state = 'CHANGES_REQUESTED'");
    expect(sql[0]).toContain("json_extract('ACCOUNT_APPLICATION_RESUBMISSION_GUARD_FAILED'");
    expect(sql[0]).toContain('existing_application.id <> ?1');
    expect(sql[0]).toContain('account.verified_email_fingerprint = ?3');
    expect(sql[0]).toContain('account.username_normalized = ?6');
    expect(sql[0]).toContain('department.id = ?7');
    expect(sql[1]).toContain("state = 'PENDING_ADMIN_REVIEW'");
    expect(sql[1]).toContain('administrator_reviewer_id = NULL');
    expect(sql[1]).toContain('director_reviewer_id = NULL');
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
    expect(sql[1]).toContain('profile_department_id');
    expect(probe.batches[0][1].values).toHaveLength(13);
    expect(probe.batches[0][1].values[10]).toBe('USC-DEPT-DOL');
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
