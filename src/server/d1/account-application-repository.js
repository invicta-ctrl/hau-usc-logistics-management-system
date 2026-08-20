const parseJson = (value, fallback = null) => {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

function applicationFromRow(row) {
  if (!row) return undefined;
  return {
    id: row.id,
    applicationCode: row.application_code,
    emailFingerprint: row.email_fingerprint,
    identityClassId: row.identity_class_id,
    protectedEmailEnvelope: row.protected_email_envelope,
    protectedProfileEnvelope: row.protected_profile_envelope,
    departmentId: row.department_id ?? '',
    courseId: row.course_id ?? '',
    yearLevel: row.year_level ?? null,
    requestedUsernameNormalized: row.requested_username_normalized ?? '',
    pendingPasswordCredential: parseJson(row.pending_password_credential_json),
    requestedAccess: parseJson(row.requested_access_json, {}),
    state: row.state,
    revision: Number(row.revision),
    statusTokenDigest: row.status_token_digest,
    statusTokenExpiresAt: row.status_token_expires_at,
    clientRequestId: row.client_request_id,
    administratorReviewerId: row.administrator_reviewer_id ?? '',
    administratorReviewedAt: row.administrator_reviewed_at ?? '',
    directorReviewerId: row.director_reviewer_id ?? '',
    directorReviewedAt: row.director_reviewed_at ?? '',
    approvedAccountId: row.approved_account_id ?? '',
    accountCode: row.approved_account_code ?? '',
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at ?? '',
    changeRequestSummary: row.state === 'CHANGES_REQUESTED' ? (row.change_request_summary ?? '') : '',
  };
}

function reviewApplicationFromRow(row) {
  if (!row) return undefined;
  return {
    id: row.id,
    applicationCode: row.application_code,
    departmentId: row.department_id ?? '',
    courseId: row.course_id ?? '',
    yearLevel: row.year_level === null || row.year_level === undefined ? null : Number(row.year_level),
    requestedUsernameNormalized: row.requested_username_normalized ?? '',
    requestedAccess: parseJson(row.requested_access_json, {}),
    state: row.state,
    revision: Number(row.revision),
    administratorReviewedAt: row.administrator_reviewed_at ?? '',
    directorReviewedAt: row.director_reviewed_at ?? '',
    accountCode: row.approved_account_code ?? '',
    expiresAt: row.expires_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function challengeFromRow(row) {
  if (!row) return undefined;
  return {
    id: row.id,
    emailFingerprint: row.email_fingerprint,
    protectedEmailEnvelope: row.protected_email_envelope,
    identityClassId: row.identity_class_id,
    secretDigest: row.secret_digest,
    verificationReceiptDigest: row.verification_receipt_digest ?? '',
    purpose: row.purpose,
    state: row.status,
    expiresAt: row.expires_at,
    attemptCount: Number(row.attempt_count),
    resendCount: Number(row.resend_count),
    createdAt: row.created_at,
    lastSentAt: row.last_sent_at ?? '',
    verifiedAt: row.verified_at ?? '',
    consumedAt: row.consumed_at ?? '',
  };
}

function historyFromRow(row) {
  if (!row) return undefined;
  return {
    id: row.history_id ?? row.id,
    applicationId: row.application_id,
    fromState: row.from_state,
    toState: row.to_state,
    actorAccountId: row.actor_account_id ?? '',
    applicantAuthorityFingerprint: row.applicant_authority_fingerprint ?? '',
    reason: row.reason ?? '',
    before: parseJson(row.before_json, {}),
    after: parseJson(row.after_json, {}),
    expectedRevision: Number(row.expected_revision),
    resultingRevision: Number(row.resulting_revision),
    idempotencyKey: row.idempotency_key,
    correlationId: row.correlation_id,
    createdAt: row.created_at,
  };
}

function auditStatement(db, audit) {
  return db
    .prepare(
      `INSERT INTO audit_log (
         id, created_at, action, entity_type, entity_id, actor_account_id,
         before_json, after_json, correlation_id, notes
       ) VALUES (?1, ?2, ?3, 'ACCOUNT_APPLICATION', ?4, ?5, ?6, ?7, ?8, ?9)`,
    )
    .bind(
      audit.id,
      audit.createdAt,
      audit.action,
      audit.applicationId,
      audit.actorAccountId || null,
      JSON.stringify(audit.before ?? {}),
      JSON.stringify(audit.after ?? {}),
      audit.correlationId,
      audit.reason ?? '',
    );
}

function accountAuditStatement(db, audit) {
  return db
    .prepare(
      `INSERT INTO audit_log (
         id, created_at, action, entity_type, entity_id, actor_account_id,
         before_json, after_json, correlation_id, notes
       ) VALUES (?1, ?2, ?3, 'ACCOUNT', ?4, ?5, ?6, ?7, ?8, ?9)`,
    )
    .bind(
      audit.id,
      audit.createdAt,
      audit.action,
      audit.accountId,
      audit.actorAccountId || null,
      JSON.stringify(audit.before ?? {}),
      JSON.stringify(audit.after ?? {}),
      audit.correlationId,
      audit.reason ?? '',
    );
}

function historyStatement(db, history) {
  return db
    .prepare(
      `INSERT INTO account_application_history (
         id, application_id, from_state, to_state, actor_account_id,
         applicant_authority_fingerprint, reason, before_json, after_json,
         expected_revision, resulting_revision, idempotency_key, correlation_id, created_at
       ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)`,
    )
    .bind(
      history.id,
      history.applicationId,
      history.fromState,
      history.toState,
      history.actorAccountId || null,
      history.applicantAuthorityFingerprint || null,
      history.reason ?? '',
      JSON.stringify(history.before ?? {}),
      JSON.stringify(history.after ?? {}),
      history.expectedRevision,
      history.resultingRevision,
      history.idempotencyKey,
      history.correlationId,
      history.createdAt,
    );
}

function applicationInsertStatement(db, application) {
  return db
    .prepare(
      `INSERT INTO account_applications (
         id, application_code, email_fingerprint, identity_class_id, protected_email_envelope,
         protected_profile_envelope, department_id, course_id, year_level,
         requested_username_normalized, pending_password_credential_json,
         requested_access_json, state, revision, status_token_digest,
         status_token_expires_at, client_request_id, administrator_reviewer_id,
         administrator_reviewed_at, director_reviewer_id, director_reviewed_at,
         approved_account_id, expires_at, created_at, updated_at, archived_at
       ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14,
                 ?15, ?16, ?17, NULL, NULL, NULL, NULL, NULL, ?18, ?19, ?19, NULL)`,
    )
    .bind(
      application.id,
      application.applicationCode,
      application.emailFingerprint,
      application.identityClassId,
      application.protectedEmailEnvelope,
      application.protectedProfileEnvelope,
      application.departmentId || null,
      application.courseId || null,
      application.yearLevel ?? null,
      application.requestedUsernameNormalized || null,
      JSON.stringify(application.pendingPasswordCredential),
      JSON.stringify(application.requestedAccess),
      application.state,
      application.revision,
      application.statusTokenDigest,
      application.statusTokenExpiresAt,
      application.clientRequestId,
      application.expiresAt,
      application.createdAt,
    );
}

function starterAccountStatement(db, account) {
  return db
    .prepare(
      `INSERT INTO accounts (
         id, access_id_normalized, status, role_id, default_committee_id,
         profile_full_name, profile_mobile_number, profile_email,
         password_credential_json, temporary_credential_json, credential_version,
         onboarding_completed_at, profile_email_verified_at, created_at, updated_at,
         locked_at, last_access_id_changed_at, lending_eligible, institution_id,
         department_id, password_changed_at, last_password_reset_at,
         username_normalized, verified_email_fingerprint, profile_department_id,
         profile_course_id, profile_year_level, avatar_asset_key, avatar_updated_at
       ) VALUES (?1, ?2, 'STARTER', ?3, ?4, NULL, NULL, NULL, NULL, ?5, 1,
                 NULL, NULL, ?6, ?6, NULL, NULL, ?7, ?8, NULL, NULL, NULL,
                 ?9, ?10, ?11, ?12, ?13, NULL, NULL)`,
    )
    .bind(
      account.id,
      account.accessIdNormalized,
      account.roleId,
      account.defaultCommitteeId || null,
      JSON.stringify(account.temporaryCredential),
      account.createdAt,
      account.lendingEligible ? 1 : 0,
      account.institutionId ?? '',
      account.usernameNormalized || null,
      account.verifiedEmailFingerprint || null,
      account.profileDepartmentId || null,
      account.profileCourseId || null,
      account.profileYearLevel ?? null,
    );
}

function starterAccountStatements(db, account, actorAccountId) {
  const statements = [
    starterAccountStatement(db, account),
    db
      .prepare(
        `INSERT INTO access_id_reservations (
           collision_key, account_id, access_id_snapshot, reserved_at, reservation_reason
         ) VALUES (?1, ?2, ?3, ?4, 'ACCOUNT_APPLICATION_APPROVAL')`,
      )
      .bind(account.collisionKey, account.id, account.accessIdNormalized, account.createdAt),
  ];
  for (const committeeId of account.committeeIds ?? []) {
    statements.push(
      db
        .prepare(
          `INSERT INTO account_committees (
             account_id, committee_id, membership_type, active, source
           ) VALUES (?1, ?2, 'ASSIGNED', 1, 'ACCOUNT_APPLICATION')`,
        )
        .bind(account.id, committeeId),
    );
  }
  if (account.accessProfile) {
    statements.push(
      db
        .prepare(
          `INSERT INTO account_access_profiles (
             account_id, preset_id, workspace_ids_json, default_workspace_id,
             location_scope_ids_json, event_series_scope_ids_json, event_scope_ids_json,
             capability_grants_json, capability_denies_json, updated_at, updated_by_account_id
           ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)`,
        )
        .bind(
          account.id,
          account.accessProfile.presetId,
          JSON.stringify(account.accessProfile.workspaceIds),
          account.accessProfile.defaultWorkspaceId,
          JSON.stringify(account.accessProfile.locationScopeIds),
          JSON.stringify(account.accessProfile.eventSeriesScopeIds),
          JSON.stringify(account.accessProfile.eventScopeIds),
          JSON.stringify(account.accessProfile.capabilityGrants),
          JSON.stringify(account.accessProfile.capabilityDenies),
          account.createdAt,
          actorAccountId,
        ),
    );
  }
  return statements;
}

function applicationSelect(whereClause) {
  return `SELECT application.*, approved_account.access_id_normalized AS approved_account_code,
                 (
                   SELECT history.reason
                   FROM account_application_history history
                   WHERE history.application_id = application.id
                     AND history.to_state = 'CHANGES_REQUESTED'
                   ORDER BY history.created_at DESC, history.id DESC
                   LIMIT 1
                 ) AS change_request_summary
          FROM account_applications application
          LEFT JOIN accounts approved_account ON approved_account.id = application.approved_account_id
          WHERE ${whereClause}`;
}

function reviewApplicationSelect(whereClause) {
  return `SELECT application.id, application.application_code, application.department_id,
                 application.course_id, application.year_level, application.requested_username_normalized,
                 application.requested_access_json, application.state, application.revision,
                 application.administrator_reviewed_at, application.director_reviewed_at,
                 application.expires_at, application.created_at, application.updated_at,
                 approved_account.access_id_normalized AS approved_account_code
          FROM account_applications application
          LEFT JOIN accounts approved_account ON approved_account.id = application.approved_account_id
          WHERE ${whereClause}`;
}

function reviewQueueQuery({ states, limit, offset }) {
  const normalizedStates = Array.isArray(states)
    ? [...new Set(states.map((stateValue) => String(stateValue ?? '').trim()).filter(Boolean))]
    : [];
  if (!normalizedStates.length) throw new Error('At least one account-application review state is required.');
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 101) {
    throw new Error('Account-application review limit is invalid.');
  }
  if (!Number.isSafeInteger(offset) || offset < 0) {
    throw new Error('Account-application review offset is invalid.');
  }
  return { states: normalizedStates, limit, offset };
}

function reviewQueuePlaceholders(states, start = 1) {
  return states.map((_, index) => `?${start + index}`).join(', ');
}

function transitionUpdateStatement(
  db,
  { applicationId, fromState, expectedRevision, toState, occurredAt, updates },
) {
  const assignments = ['state = ?', 'revision = revision + 1', 'updated_at = ?'];
  const values = [toState, occurredAt];
  const append = (column, value) => {
    if (value === undefined) return;
    assignments.push(`${column} = ?`);
    values.push(value);
  };
  append('administrator_reviewer_id', updates?.administratorReviewerId);
  append('administrator_reviewed_at', updates?.administratorReviewedAt);
  append('director_reviewer_id', updates?.directorReviewerId);
  append('director_reviewed_at', updates?.directorReviewedAt);
  append('archived_at', updates?.archivedAt);
  values.push(applicationId, fromState, expectedRevision);
  return db
    .prepare(
      `UPDATE account_applications
       SET ${assignments.join(', ')}
       WHERE id = ? AND state = ? AND revision = ?`,
    )
    .bind(...values);
}

function transitionGuardStatement(
  db,
  {
    applicationId,
    fromState,
    expectedRevision,
    idempotencyKey,
    requireDistinctFromAdministrator,
    actorAccountId,
    revokeApprovedStarter,
  },
) {
  const clauses = [
    'application.id = ?1',
    'application.state = ?2',
    'application.revision = ?3',
    'NOT EXISTS (SELECT 1 FROM account_application_history WHERE idempotency_key = ?4)',
  ];
  clauses.push(
    '(?5 = 0 OR (application.administrator_reviewer_id IS NOT NULL AND application.administrator_reviewer_id <> ?6))',
  );
  if (revokeApprovedStarter) {
    clauses.push(
      "EXISTS (SELECT 1 FROM accounts approved_account WHERE approved_account.id = application.approved_account_id AND approved_account.status = 'STARTER')",
    );
  }
  return db
    .prepare(
      `SELECT CASE
         WHEN EXISTS (SELECT 1 FROM account_applications application WHERE ${clauses.join(' AND ')})
         THEN 1
         ELSE json_extract('ACCOUNT_APPLICATION_TRANSITION_GUARD_FAILED', '$')
       END AS allowed`,
    )
    .bind(
      applicationId,
      fromState,
      expectedRevision,
      idempotencyKey,
      requireDistinctFromAdministrator ? 1 : 0,
      actorAccountId || '',
    );
}

export function createD1AccountApplicationRepository(db) {
  if (!db) throw new Error('D1 database binding is required.');

  const repository = {
    async getVerificationChallengeById(challengeId) {
      return challengeFromRow(
        await db
          .prepare('SELECT * FROM email_verification_challenges WHERE id = ?1')
          .bind(challengeId)
          .first(),
      );
    },

    async getVerificationChallengeByReceiptDigest(verificationReceiptDigest) {
      return challengeFromRow(
        await db
          .prepare('SELECT * FROM email_verification_challenges WHERE verification_receipt_digest = ?1')
          .bind(verificationReceiptDigest)
          .first(),
      );
    },

    async createVerificationChallenge(challenge) {
      await db.batch([
        db
          .prepare(
            `SELECT CASE
               WHEN NOT EXISTS (SELECT 1 FROM email_verification_challenges WHERE id = ?1)
               THEN 1
               ELSE json_extract('ACCOUNT_APPLICATION_CHALLENGE_ID_CONFLICT', '$')
             END AS allowed`,
          )
          .bind(challenge.id),
        db
          .prepare(
            `UPDATE email_verification_challenges
             SET status = 'REVOKED'
             WHERE email_fingerprint = ?1
               AND purpose = ?2
               AND status = 'PENDING'`,
          )
          .bind(challenge.emailFingerprint, challenge.purpose),
        db
          .prepare(
            `INSERT INTO email_verification_challenges (
               id, email_fingerprint, protected_email_envelope, identity_class_id,
               secret_digest, verification_receipt_digest, purpose, status, expires_at,
               attempt_count, resend_count, created_at, last_sent_at, verified_at, consumed_at
             ) VALUES (?1, ?2, ?3, ?4, ?5, NULL, ?6, 'PENDING', ?7, 0, ?8, ?9, NULL, NULL, NULL)`,
          )
          .bind(
            challenge.id,
            challenge.emailFingerprint,
            challenge.protectedEmailEnvelope,
            challenge.identityClassId,
            challenge.secretDigest,
            challenge.purpose,
            challenge.expiresAt,
            challenge.resendCount,
            challenge.createdAt,
          ),
      ]);
      return repository.getVerificationChallengeById(challenge.id);
    },

    async markVerificationChallengeSent({ challengeId, emailFingerprint, sentAt, providerMessageRef = '' }) {
      await db.batch([
        db
          .prepare(
            `SELECT CASE
               WHEN EXISTS (
                 SELECT 1 FROM email_verification_challenges
                 WHERE id = ?1 AND email_fingerprint = ?2 AND status = 'PENDING'
               ) THEN 1
               ELSE json_extract('ACCOUNT_APPLICATION_CHALLENGE_SEND_GUARD_FAILED', '$')
             END AS allowed`,
          )
          .bind(challengeId, emailFingerprint),
        db
          .prepare(
            `UPDATE email_verification_challenges
             SET last_sent_at = ?1, provider_message_ref = ?4
             WHERE id = ?2 AND email_fingerprint = ?3 AND status = 'PENDING'`,
          )
          .bind(sentAt, challengeId, emailFingerprint, String(providerMessageRef ?? '') || null),
      ]);
    },

    async confirmVerificationChallenge({
      emailFingerprint,
      identityClassId,
      purpose,
      secretDigest,
      verificationReceiptDigest,
      confirmedAt,
      receiptExpiresAt,
      maxAttempts,
    }) {
      const results = await db.batch([
        db
          .prepare(
            `UPDATE email_verification_challenges
             SET status = 'EXPIRED'
             WHERE email_fingerprint = ?1
               AND identity_class_id = ?2
               AND purpose = ?3
               AND status = 'PENDING'
               AND expires_at <= ?4`,
          )
          .bind(emailFingerprint, identityClassId, purpose, confirmedAt),
        db
          .prepare(
            `UPDATE email_verification_challenges
             SET attempt_count = attempt_count + 1,
                 status = CASE WHEN attempt_count + 1 >= ?1 THEN 'REVOKED' ELSE 'PENDING' END
             WHERE id = (
               SELECT id
               FROM email_verification_challenges
               WHERE email_fingerprint = ?2
                 AND identity_class_id = ?3
                 AND purpose = ?4
                 AND status = 'PENDING'
                 AND expires_at > ?5
                 AND attempt_count < ?1
                 AND secret_digest <> ?6
               ORDER BY created_at DESC
               LIMIT 1
             )`,
          )
          .bind(maxAttempts, emailFingerprint, identityClassId, purpose, confirmedAt, secretDigest),
        db
          .prepare(
            `UPDATE email_verification_challenges
             SET status = 'VERIFIED', verification_receipt_digest = ?1,
                 verified_at = ?2, expires_at = ?3
             WHERE id = (
               SELECT id
               FROM email_verification_challenges
               WHERE email_fingerprint = ?4
                 AND identity_class_id = ?5
                 AND purpose = ?6
                 AND status = 'PENDING'
                 AND expires_at > ?2
                 AND attempt_count < ?7
                 AND secret_digest = ?8
               ORDER BY created_at DESC
               LIMIT 1
             )`,
          )
          .bind(
            verificationReceiptDigest,
            confirmedAt,
            receiptExpiresAt,
            emailFingerprint,
            identityClassId,
            purpose,
            maxAttempts,
            secretDigest,
          ),
      ]);
      const verified = Number(results[2]?.meta?.changes ?? 0) === 1;
      if (!verified) return { verified: false };
      return {
        verified: true,
        challenge: await repository.getVerificationChallengeByReceiptDigest(verificationReceiptDigest),
      };
    },

    async getApplicationById(applicationId) {
      return applicationFromRow(
        await db.prepare(applicationSelect('application.id = ?1')).bind(applicationId).first(),
      );
    },

    async listApplicationsForReview({ states, limit, offset }) {
      const query = reviewQueueQuery({ states, limit, offset });
      const placeholders = reviewQueuePlaceholders(query.states);
      const limitParameter = query.states.length + 1;
      const offsetParameter = query.states.length + 2;
      const result = await db
        .prepare(
          `${reviewApplicationSelect(`application.state IN (${placeholders})`)}
           ORDER BY application.created_at ASC, application.id ASC
           LIMIT ?${limitParameter} OFFSET ?${offsetParameter}`,
        )
        .bind(...query.states, query.limit, query.offset)
        .all();
      return (result?.results ?? []).map(reviewApplicationFromRow);
    },

    async getApplicationForReview({ applicationId, states }) {
      const query = reviewQueueQuery({ states, limit: 1, offset: 0 });
      const placeholders = reviewQueuePlaceholders(query.states, 2);
      return reviewApplicationFromRow(
        await db
          .prepare(reviewApplicationSelect(`application.id = ?1 AND application.state IN (${placeholders})`))
          .bind(applicationId, ...query.states)
          .first(),
      );
    },

    async getApplicationByStatusTokenDigest(statusTokenDigest, now) {
      return applicationFromRow(
        await db
          .prepare(
            applicationSelect(
              'application.status_token_digest = ?1 AND application.status_token_expires_at > ?2',
            ),
          )
          .bind(statusTokenDigest, now)
          .first(),
      );
    },

    async getApplicationByApprovedAccountId(accountId) {
      return applicationFromRow(
        await db.prepare(applicationSelect('application.approved_account_id = ?1')).bind(accountId).first(),
      );
    },

    async getApplicationByClientRequestId(clientRequestId) {
      return applicationFromRow(
        await db
          .prepare(applicationSelect('application.client_request_id = ?1'))
          .bind(clientRequestId)
          .first(),
      );
    },

    async listHistoryByApplicationId(applicationId) {
      const result = await db
        .prepare(
          `SELECT *
           FROM account_application_history
           WHERE application_id = ?1
           ORDER BY created_at, id
           LIMIT 100`,
        )
        .bind(applicationId)
        .all();
      return result.results.map(historyFromRow);
    },

    async usernameCollides(username, excludeApplicationId = '') {
      const collisionKey = String(username ?? '').replaceAll(/[._-]/gu, '');
      const row = await db
        .prepare(
          `SELECT CASE
             WHEN EXISTS (
               SELECT 1 FROM accounts account
               WHERE account.username_normalized = ?1
                  OR lower(account.access_id_normalized) = ?1
             )
             OR EXISTS (
               SELECT 1 FROM access_id_reservations reservation
               WHERE lower(reservation.collision_key) = lower(?2)
             )
             OR EXISTS (
               SELECT 1 FROM account_applications application
               WHERE application.id <> ?3
                 AND application.requested_username_normalized = ?1
                 AND application.state IN (
                   'EMAIL_UNVERIFIED', 'DRAFT', 'PENDING_ADMIN_REVIEW', 'CHANGES_REQUESTED',
                   'PENDING_DIRECTOR_APPROVAL', 'APPROVED_ACTIVATION_REQUIRED'
                 )
             )
             THEN 1 ELSE 0
           END AS collides`,
        )
        .bind(username, collisionKey, excludeApplicationId)
        .first();
      return Number(row?.collides ?? 0) === 1;
    },

    async identityCollides(emailFingerprint, excludeApplicationId = '') {
      const row = await db
        .prepare(
          `SELECT CASE
             WHEN EXISTS (
               SELECT 1 FROM accounts account
               WHERE account.verified_email_fingerprint = ?1
                 AND account.status IN ('ACTIVE', 'STARTER')
             )
             OR EXISTS (
               SELECT 1 FROM account_applications application
               WHERE application.id <> ?2
                 AND application.email_fingerprint = ?1
                 AND application.state IN (
                   'EMAIL_UNVERIFIED', 'DRAFT', 'PENDING_ADMIN_REVIEW', 'CHANGES_REQUESTED',
                   'PENDING_DIRECTOR_APPROVAL', 'APPROVED_ACTIVATION_REQUIRED'
                 )
             )
             THEN 1 ELSE 0
           END AS collides`,
        )
        .bind(emailFingerprint, excludeApplicationId)
        .first();
      return Number(row?.collides ?? 0) === 1;
    },

    async getApplicationReplayByIdempotencyKey(idempotencyKey) {
      const row = await db
        .prepare(
          `SELECT application.*, approved_account.access_id_normalized AS approved_account_code,
                  history.id AS history_id, history.application_id, history.from_state,
                  history.to_state, history.actor_account_id, history.applicant_authority_fingerprint,
                  history.reason, history.before_json, history.after_json, history.expected_revision,
                  history.resulting_revision, history.idempotency_key, history.correlation_id,
                  history.created_at AS history_created_at
           FROM account_application_history history
           JOIN account_applications application ON application.id = history.application_id
           LEFT JOIN accounts approved_account ON approved_account.id = application.approved_account_id
           WHERE history.idempotency_key = ?1`,
        )
        .bind(idempotencyKey)
        .first();
      if (!row) return undefined;
      return {
        application: applicationFromRow(row),
        history: historyFromRow({ ...row, created_at: row.history_created_at }),
      };
    },

    async createSubmittedApplication({
      application,
      verificationReceiptDigest,
      eligibilityApproved,
      history,
      audit,
    }) {
      await db.batch([
        db
          .prepare(
            `SELECT CASE
               WHEN EXISTS (
                 SELECT 1 FROM email_verification_challenges
                 WHERE status = 'VERIFIED'
                   AND verification_receipt_digest = ?1
                   AND expires_at > ?2
               )
               AND NOT EXISTS (
                 SELECT 1 FROM account_applications WHERE client_request_id = ?3
               )
               AND NOT EXISTS (
                 SELECT 1 FROM account_application_history WHERE idempotency_key = ?4
               )
               AND ?5 = 1
               AND NOT EXISTS (
                 SELECT 1
                 FROM accounts account
                 WHERE account.verified_email_fingerprint = ?6
                   AND account.status IN ('ACTIVE', 'STARTER')
               )
               AND NOT EXISTS (
                 SELECT 1
                 FROM account_applications existing_application
                 WHERE existing_application.email_fingerprint = ?6
                   AND existing_application.state IN (
                     'EMAIL_UNVERIFIED', 'DRAFT', 'PENDING_ADMIN_REVIEW', 'CHANGES_REQUESTED',
                     'PENDING_DIRECTOR_APPROVAL', 'APPROVED_ACTIVATION_REQUIRED'
                   )
               )
                AND NOT EXISTS (
                  SELECT 1 FROM accounts account
                  WHERE account.username_normalized = ?7
                     OR lower(account.access_id_normalized) = ?7
                )
                AND NOT EXISTS (
                  SELECT 1 FROM access_id_reservations reservation
                  WHERE lower(reservation.collision_key) =
                    lower(replace(replace(replace(?7, '.', ''), '_', ''), '-', ''))
                )
               AND NOT EXISTS (
                 SELECT 1
                 FROM account_applications existing_application
                 WHERE existing_application.requested_username_normalized = ?7
                   AND existing_application.state IN (
                     'EMAIL_UNVERIFIED', 'DRAFT', 'PENDING_ADMIN_REVIEW', 'CHANGES_REQUESTED',
                     'PENDING_DIRECTOR_APPROVAL', 'APPROVED_ACTIVATION_REQUIRED'
                   )
               )
               AND EXISTS (
                 SELECT 1 FROM requester_departments department
                 WHERE department.id = ?8 AND department.active = 1
               )
               THEN 1
               ELSE json_extract('ACCOUNT_APPLICATION_SUBMISSION_GUARD_FAILED', '$')
             END AS allowed`,
          )
          .bind(
            verificationReceiptDigest,
            application.createdAt,
            application.clientRequestId,
            history.submission.idempotencyKey,
            eligibilityApproved ? 1 : 0,
            application.emailFingerprint,
            application.requestedUsernameNormalized,
            application.departmentId,
          ),
        db
          .prepare(
            `UPDATE email_verification_challenges
             SET status = 'CONSUMED', consumed_at = ?1
             WHERE status = 'VERIFIED'
               AND verification_receipt_digest = ?2
               AND expires_at > ?1`,
          )
          .bind(application.createdAt, verificationReceiptDigest),
        applicationInsertStatement(db, application),
        historyStatement(db, history.draft),
        historyStatement(db, history.submission),
        auditStatement(db, audit),
      ]);
      return repository.getApplicationById(application.id);
    },

    async resubmitApplication({
      applicationId,
      expectedRevision,
      idempotencyKey,
      occurredAt,
      eligibilityApproved,
      emailFingerprint,
      updates,
      history,
      audit,
    }) {
      await db.batch([
        db
          .prepare(
            `SELECT CASE
               WHEN EXISTS (
                 SELECT 1 FROM account_applications application
                 WHERE application.id = ?1
                   AND application.state = 'CHANGES_REQUESTED'
                   AND application.revision = ?2
                   AND application.email_fingerprint = ?3
               )
               AND NOT EXISTS (
                 SELECT 1 FROM account_application_history WHERE idempotency_key = ?4
               )
               AND ?5 = 1
               AND NOT EXISTS (
                 SELECT 1 FROM accounts account
                 WHERE account.verified_email_fingerprint = ?3
                   AND account.status IN ('ACTIVE', 'STARTER')
               )
               AND NOT EXISTS (
                 SELECT 1 FROM account_applications existing_application
                 WHERE existing_application.id <> ?1
                   AND existing_application.email_fingerprint = ?3
                   AND existing_application.state IN (
                     'EMAIL_UNVERIFIED', 'DRAFT', 'PENDING_ADMIN_REVIEW', 'CHANGES_REQUESTED',
                     'PENDING_DIRECTOR_APPROVAL', 'APPROVED_ACTIVATION_REQUIRED'
                   )
               )
               AND NOT EXISTS (
                 SELECT 1 FROM accounts account
                 WHERE account.username_normalized = ?6
                    OR lower(account.access_id_normalized) = ?6
               )
               AND NOT EXISTS (
                 SELECT 1 FROM access_id_reservations reservation
                 WHERE lower(reservation.collision_key) =
                   lower(replace(replace(replace(?6, '.', ''), '_', ''), '-', ''))
               )
               AND NOT EXISTS (
                 SELECT 1 FROM account_applications existing_application
                 WHERE existing_application.id <> ?1
                   AND existing_application.requested_username_normalized = ?6
                   AND existing_application.state IN (
                     'EMAIL_UNVERIFIED', 'DRAFT', 'PENDING_ADMIN_REVIEW', 'CHANGES_REQUESTED',
                     'PENDING_DIRECTOR_APPROVAL', 'APPROVED_ACTIVATION_REQUIRED'
                   )
               )
               AND EXISTS (
                 SELECT 1 FROM requester_departments department
                 WHERE department.id = ?7 AND department.active = 1
               )
               THEN 1
               ELSE json_extract('ACCOUNT_APPLICATION_RESUBMISSION_GUARD_FAILED', '$')
             END AS allowed`,
          )
          .bind(
            applicationId,
            expectedRevision,
            emailFingerprint,
            idempotencyKey,
            eligibilityApproved ? 1 : 0,
            updates.requestedUsernameNormalized,
            updates.departmentId,
          ),
        db
          .prepare(
            `UPDATE account_applications
             SET protected_profile_envelope = ?1, department_id = ?2, course_id = ?3,
                 year_level = ?4, requested_username_normalized = ?5,
                 pending_password_credential_json = ?6, requested_access_json = ?7,
                 state = 'PENDING_ADMIN_REVIEW', revision = revision + 1,
                 administrator_reviewer_id = NULL, administrator_reviewed_at = NULL,
                 director_reviewer_id = NULL, director_reviewed_at = NULL,
                 updated_at = ?8
             WHERE id = ?9 AND state = 'CHANGES_REQUESTED' AND revision = ?10`,
          )
          .bind(
            updates.protectedProfileEnvelope,
            updates.departmentId || null,
            updates.courseId || null,
            updates.yearLevel ?? null,
            updates.requestedUsernameNormalized,
            JSON.stringify(updates.pendingPasswordCredential),
            JSON.stringify(updates.requestedAccess),
            occurredAt,
            applicationId,
            expectedRevision,
          ),
        historyStatement(db, history),
        auditStatement(db, audit),
      ]);
      return repository.getApplicationById(applicationId);
    },

    async transitionApplication({
      applicationId,
      fromState,
      toState,
      expectedRevision,
      actorAccountId,
      idempotencyKey,
      occurredAt,
      updates = {},
      history,
      audit,
      requireDistinctFromAdministrator = false,
      revokeApprovedStarter = false,
    }) {
      const statements = [
        transitionGuardStatement(db, {
          applicationId,
          fromState,
          expectedRevision,
          idempotencyKey,
          requireDistinctFromAdministrator,
          actorAccountId,
          revokeApprovedStarter,
        }),
      ];
      if (revokeApprovedStarter) {
        statements.push(
          db
            .prepare(
              `UPDATE accounts
               SET status = 'REVOKED', credential_version = credential_version + 1, updated_at = ?1
               WHERE id = (SELECT approved_account_id FROM account_applications WHERE id = ?2)
                 AND status = 'STARTER'`,
            )
            .bind(occurredAt, applicationId),
          db
            .prepare(
              'DELETE FROM sessions WHERE account_id = (SELECT approved_account_id FROM account_applications WHERE id = ?1)',
            )
            .bind(applicationId),
        );
      }
      statements.push(
        transitionUpdateStatement(db, {
          applicationId,
          fromState,
          expectedRevision,
          toState,
          occurredAt,
          updates,
        }),
        historyStatement(db, history),
        auditStatement(db, audit),
      );
      await db.batch(statements);
      return repository.getApplicationById(applicationId);
    },

    async approveApplication({
      applicationId,
      expectedRevision,
      actorAccountId,
      idempotencyKey,
      approvedAt,
      starterAccount,
      history,
      accountAudit,
      applicationAudit,
      allowSameReviewer = false,
    }) {
      const guard = db
        .prepare(
          `SELECT CASE
             WHEN EXISTS (
               SELECT 1
               FROM account_applications application
               WHERE application.id = ?1
                 AND application.state = 'PENDING_DIRECTOR_APPROVAL'
                 AND application.revision = ?2
                 AND application.administrator_reviewer_id IS NOT NULL
                 AND (?3 = 1 OR application.administrator_reviewer_id <> ?4)
             )
             AND NOT EXISTS (SELECT 1 FROM account_application_history WHERE idempotency_key = ?5)
             AND NOT EXISTS (SELECT 1 FROM accounts WHERE id = ?6 OR access_id_normalized = ?7)
             AND NOT EXISTS (SELECT 1 FROM access_id_reservations WHERE collision_key = ?8)
             THEN 1
             ELSE json_extract('ACCOUNT_APPLICATION_APPROVAL_GUARD_FAILED', '$')
           END AS allowed`,
        )
        .bind(
          applicationId,
          expectedRevision,
          allowSameReviewer ? 1 : 0,
          actorAccountId,
          idempotencyKey,
          starterAccount.id,
          starterAccount.accessIdNormalized,
          starterAccount.collisionKey,
        );
      const statements = [guard, ...starterAccountStatements(db, starterAccount, actorAccountId)];
      statements.push(
        db
          .prepare(
            `UPDATE account_applications
             SET state = 'APPROVED_ACTIVATION_REQUIRED', revision = revision + 1,
                 director_reviewer_id = ?1, director_reviewed_at = ?2,
                 approved_account_id = ?3, updated_at = ?2
             WHERE id = ?4 AND state = 'PENDING_DIRECTOR_APPROVAL' AND revision = ?5`,
          )
          .bind(actorAccountId, approvedAt, starterAccount.id, applicationId, expectedRevision),
        historyStatement(db, history),
        accountAuditStatement(db, accountAudit),
        auditStatement(db, applicationAudit),
      );
      await db.batch(statements);
      return repository.getApplicationById(applicationId);
    },
  };
  return Object.freeze(repository);
}

export const __private__ = Object.freeze({
  applicationFromRow,
  challengeFromRow,
  historyFromRow,
});
