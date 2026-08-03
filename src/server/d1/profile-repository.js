const parseJson = (value, fallback = null) => {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

function requiredAccountId(value) {
  const accountId = String(value ?? '').trim();
  if (!accountId || accountId.length > 160) throw new Error('Account identity is required.');
  return accountId;
}

function mapProfile(row, committeeIds = []) {
  if (!row) return null;
  return {
    accountId: row.id,
    accessId: row.access_id_normalized ?? '',
    status: row.status ?? '',
    roleId: row.role_id ?? '',
    defaultCommitteeId: row.default_committee_id ?? '',
    committeeIds,
    fullName: row.profile_full_name ?? '',
    mobileNumber: row.profile_mobile_number ?? '',
    email: row.profile_email ?? '',
    profileEmailVerifiedAt: row.profile_email_verified_at ?? null,
    username: row.username_normalized ?? '',
    courseId: row.profile_course_id ?? '',
    yearLevel: row.profile_year_level ?? null,
    departmentId: row.profile_department_id ?? row.department_id ?? '',
    departmentDisplayName: row.department_display_name ?? '',
    institutionId: row.institution_id ?? '',
    avatarAssetKey: row.avatar_asset_key ?? '',
    avatarUpdatedAt: row.avatar_updated_at ?? null,
    passwordCredential: parseJson(row.password_credential_json),
    credentialVersion: Number(row.credential_version ?? 1),
    updatedAt: row.updated_at ?? '',
  };
}

function auditStatement(
  db,
  { id, createdAt, action, accountId, actorId, before, after, correlationId, notes },
) {
  return db
    .prepare(
      `INSERT INTO audit_log (
         id, created_at, action, entity_type, entity_id, actor_account_id,
         before_json, after_json, correlation_id, notes
       ) VALUES (?1, ?2, ?3, 'ACCOUNT', ?4, ?5, ?6, ?7, ?8, ?9)`,
    )
    .bind(
      id,
      createdAt,
      action,
      accountId,
      actorId,
      JSON.stringify(before ?? {}),
      JSON.stringify(after ?? {}),
      correlationId,
      notes ?? '',
    );
}

function idempotencyStatement(db, { scope, key, actorAccountId, requestFingerprint, result, createdAt }) {
  return db
    .prepare(
      `INSERT INTO idempotency_keys (
         scope, idempotency_key, actor_account_id, request_fingerprint, result_json, created_at
       ) VALUES (?1, ?2, ?3, ?4, ?5, ?6)`,
    )
    .bind(scope, key, actorAccountId, requestFingerprint, JSON.stringify(result), createdAt);
}

function assertChanged(results) {
  const first = Array.isArray(results) ? results[0] : results;
  const changes = Number(first?.meta?.changes ?? first?.changes ?? 0);
  if (changes !== 1) {
    throw revisionConflictError();
  }
}

function revisionConflictError() {
  const error = new Error('The account changed before this request completed.');
  error.code = 'REVISION_CONFLICT';
  error.status = 409;
  return error;
}

function revisionGuardAbortStatement(db) {
  return db.prepare(
    `UPDATE data_revisions
     SET updated_at = CASE WHEN changes() = 1 THEN updated_at ELSE NULL END
     WHERE scope = 'global'`,
  );
}

async function runAtomicProfileMutation(db, guardedStatement, dependentStatements) {
  try {
    const results = await db.batch([
      guardedStatement,
      // D1 only returns batch results after every statement has run. Force a
      // NOT NULL failure when the optimistic update changed zero rows so the
      // complete transaction rolls back before evidence or session writes can
      // commit.
      revisionGuardAbortStatement(db),
      ...dependentStatements,
    ]);
    assertChanged(results);
  } catch (error) {
    if (error?.code === 'REVISION_CONFLICT') throw error;
    if (String(error?.message ?? '').includes('NOT NULL constraint failed: data_revisions.updated_at')) {
      throw revisionConflictError();
    }
    throw error;
  }
}

function profileSelect() {
  return `SELECT a.id, a.access_id_normalized, a.status, a.role_id, a.default_committee_id,
    a.profile_full_name, a.profile_mobile_number, a.profile_email,
    a.profile_email_verified_at, a.username_normalized, a.profile_course_id,
    a.profile_year_level, a.avatar_asset_key, a.avatar_updated_at,
    a.password_credential_json, a.credential_version, a.updated_at,
    a.department_id, a.profile_department_id, a.institution_id,
    department.display_name AS department_display_name
    FROM accounts a
    LEFT JOIN requester_departments department
      ON department.id = COALESCE(a.profile_department_id, a.department_id)
    WHERE a.id = ?1`;
}

export function createD1ProfileRepository(db) {
  if (!db) throw new Error('D1 database binding is required.');

  const repository = {
    async getProfile(accountId) {
      const id = requiredAccountId(accountId);
      const row = await db.prepare(profileSelect()).bind(id).first();
      if (!row) return null;
      const committees = await db
        .prepare(
          `SELECT committee_id
           FROM account_committees
           WHERE account_id = ?1 AND active = 1
           ORDER BY committee_id`,
        )
        .bind(id)
        .all();
      return mapProfile(
        row,
        (committees.results ?? []).map((entry) => entry.committee_id),
      );
    },

    async getIdempotency(scope, key) {
      const row = await db
        .prepare(
          `SELECT actor_account_id, request_fingerprint, result_json
           FROM idempotency_keys
           WHERE scope = ?1 AND idempotency_key = ?2`,
        )
        .bind(scope, key)
        .first();
      if (!row) return null;
      return {
        actorAccountId: row.actor_account_id,
        requestFingerprint: row.request_fingerprint,
        result: parseJson(row.result_json, null),
      };
    },

    async findUsername(username, excludeAccountId) {
      const accountId = requiredAccountId(excludeAccountId);
      const collisionKey = String(username ?? '').replaceAll(/[._-]/gu, '');
      const [account, reservation, application] = await Promise.all([
        db
          .prepare(
            `SELECT id
             FROM accounts
             WHERE (username_normalized = ?1 OR lower(access_id_normalized) = ?1)
               AND id <> ?2
             LIMIT 1`,
          )
          .bind(username, accountId)
          .first(),
        db
          .prepare(
            `SELECT account_id
             FROM access_id_reservations
             WHERE lower(collision_key) = lower(?1)
             LIMIT 1`,
          )
          .bind(collisionKey)
          .first(),
        db
          .prepare(
            `SELECT id
             FROM account_applications
             WHERE requested_username_normalized = ?1
               AND state IN (
                 'EMAIL_UNVERIFIED', 'DRAFT', 'PENDING_ADMIN_REVIEW', 'CHANGES_REQUESTED',
                 'PENDING_DIRECTOR_APPROVAL', 'APPROVED_ACTIVATION_REQUIRED'
               )
             LIMIT 1`,
          )
          .bind(username)
          .first(),
      ]);
      return account?.id ?? reservation?.account_id ?? application?.id ?? null;
    },

    async getIdentityCorrectionByClientRequest(clientRequestId) {
      const row = await db
        .prepare(
          `SELECT id, account_id, protected_request_envelope, state, revision, client_request_id,
             created_at, updated_at, correlation_id
           FROM identity_correction_requests
           WHERE client_request_id = ?1`,
        )
        .bind(String(clientRequestId ?? '').trim())
        .first();
      return row
        ? {
            id: row.id,
            accountId: row.account_id,
            state: row.state,
            revision: Number(row.revision ?? 1),
            clientRequestId: row.client_request_id,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            correlationId: row.correlation_id,
          }
        : null;
    },

    async updateContact({ accountId, expectedUpdatedAt, mobileNumber, changedAt, evidence }) {
      const id = requiredAccountId(accountId);
      await runAtomicProfileMutation(
        db,
        db
          .prepare(
            `UPDATE accounts
             SET profile_mobile_number = ?1, updated_at = ?2
             WHERE id = ?3 AND status = 'ACTIVE' AND updated_at = ?4`,
          )
          .bind(mobileNumber, changedAt, id, expectedUpdatedAt),
        [auditStatement(db, evidence.audit), idempotencyStatement(db, evidence.idempotency)],
      );
      return repository.getProfile(id);
    },

    async changeUsername({
      accountId,
      expectedUpdatedAt,
      oldUsername,
      newUsername,
      changedAt,
      reason,
      historyId,
      evidence,
    }) {
      const id = requiredAccountId(accountId);
      await runAtomicProfileMutation(
        db,
        db
          .prepare(
            `UPDATE accounts
             SET username_normalized = ?1, updated_at = ?2,
                 credential_version = credential_version + 1
             WHERE id = ?3 AND status = 'ACTIVE' AND updated_at = ?4`,
          )
          .bind(newUsername, changedAt, id, expectedUpdatedAt),
        [
          db
            .prepare(
              `INSERT INTO username_history (
                 id, account_id, old_username_normalized, new_username_normalized,
                 changed_by_account_id, reason, idempotency_key, correlation_id, changed_at
               ) VALUES (?1, ?2, ?3, ?4, ?2, ?5, ?6, ?7, ?8)`,
            )
            .bind(
              historyId,
              id,
              oldUsername,
              newUsername,
              reason,
              evidence.idempotency.key,
              evidence.audit.correlationId,
              changedAt,
            ),
          db.prepare('DELETE FROM sessions WHERE account_id = ?1').bind(id),
          auditStatement(db, evidence.audit),
          idempotencyStatement(db, evidence.idempotency),
        ],
      );
      return repository.getProfile(id);
    },

    async changePassword({
      accountId,
      expectedCredentialVersion,
      expectedUpdatedAt,
      passwordCredential,
      changedAt,
      evidence,
    }) {
      const id = requiredAccountId(accountId);
      await runAtomicProfileMutation(
        db,
        db
          .prepare(
            `UPDATE accounts
             SET password_credential_json = ?1, temporary_credential_json = NULL,
                 credential_version = credential_version + 1,
                 password_changed_at = ?2, updated_at = ?2
             WHERE id = ?3 AND status = 'ACTIVE'
               AND credential_version = ?4 AND updated_at = ?5`,
          )
          .bind(
            JSON.stringify(passwordCredential),
            changedAt,
            id,
            expectedCredentialVersion,
            expectedUpdatedAt,
          ),
        [
          db.prepare('DELETE FROM sessions WHERE account_id = ?1').bind(id),
          auditStatement(db, evidence.audit),
          idempotencyStatement(db, evidence.idempotency),
        ],
      );
      return repository.getProfile(id);
    },

    async createIdentityCorrection({
      id,
      accountId,
      protectedRequestEnvelope,
      clientRequestId,
      createdAt,
      correlationId,
      evidence,
    }) {
      const account = requiredAccountId(accountId);
      await db.batch([
        db
          .prepare(
            `INSERT INTO identity_correction_requests (
               id, account_id, protected_request_envelope, state, revision,
               client_request_id, created_at, updated_at, resolved_at,
               resolved_by_account_id, correlation_id
             ) VALUES (?1, ?2, ?3, 'PENDING', 1, ?4, ?5, ?5, NULL, NULL, ?6)`,
          )
          .bind(id, account, protectedRequestEnvelope, clientRequestId, createdAt, correlationId),
        auditStatement(db, evidence.audit),
        idempotencyStatement(db, evidence.idempotency),
      ]);
      return {
        id,
        state: 'PENDING',
        revision: 1,
        createdAt,
        updatedAt: createdAt,
        correlationId,
      };
    },
  };

  return Object.freeze(repository);
}
