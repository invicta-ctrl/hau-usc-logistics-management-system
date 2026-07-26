const parseJson = (value, fallback = null) => {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

async function committeeIds(db, accountId) {
  const result = await db
    .prepare(
      `SELECT committee_id
       FROM account_committees
       WHERE account_id = ?1 AND active = 1
       ORDER BY committee_id`,
    )
    .bind(accountId)
    .all();
  return result.results.map((row) => row.committee_id);
}

async function accessProfile(db, accountId) {
  const row = await db
    .prepare('SELECT * FROM account_access_profiles WHERE account_id = ?1')
    .bind(accountId)
    .first();
  return row
    ? {
        presetId: row.preset_id,
        workspaceIds: parseJson(row.workspace_ids_json, []),
        defaultWorkspaceId: row.default_workspace_id ?? '',
        locationScopeIds: parseJson(row.location_scope_ids_json, []),
        eventSeriesScopeIds: parseJson(row.event_series_scope_ids_json, []),
        eventScopeIds: parseJson(row.event_scope_ids_json, []),
        capabilityGrants: parseJson(row.capability_grants_json, []),
        capabilityDenies: parseJson(row.capability_denies_json, []),
      }
    : null;
}

async function accountFromRow(db, row) {
  if (!row) return undefined;
  const department = row.department_id
    ? await db
        .prepare('SELECT display_name FROM requester_departments WHERE id = ?1')
        .bind(row.department_id)
        .first()
    : null;
  return {
    id: row.id,
    accessIdNormalized: row.access_id_normalized,
    status: row.status,
    roleId: row.role_id,
    committeeIds: await committeeIds(db, row.id),
    accessProfile: await accessProfile(db, row.id),
    defaultCommitteeId: row.default_committee_id ?? '',
    profile: row.profile_full_name
      ? {
          fullName: row.profile_full_name,
          mobileNumber: row.profile_mobile_number ?? '',
          email: row.profile_email ?? '',
        }
      : null,
    passwordCredential: parseJson(row.password_credential_json),
    temporaryCredential: parseJson(row.temporary_credential_json),
    credentialVersion: row.credential_version,
    onboardingCompletedAt: row.onboarding_completed_at,
    profileEmailVerifiedAt: row.profile_email_verified_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lockedAt: row.locked_at ?? null,
    lastAccessIdChangedAt: row.last_access_id_changed_at ?? '',
    lendingEligible: row.lending_eligible === 1,
    institutionId: row.institution_id ?? '',
    departmentId: row.department_id ?? '',
    departmentDisplayName: department?.display_name ?? '',
    passwordChangedAt: row.password_changed_at ?? '',
    lastPasswordResetAt: row.last_password_reset_at ?? '',
  };
}

function accountStatement(db, account) {
  const values = [
    account.id,
    account.accessIdNormalized,
    account.status,
    account.roleId,
    account.defaultCommitteeId || null,
    account.profile?.fullName ?? null,
    account.profile?.mobileNumber ?? null,
    account.profile?.email ?? null,
    account.passwordCredential ? JSON.stringify(account.passwordCredential) : null,
    account.temporaryCredential ? JSON.stringify(account.temporaryCredential) : null,
    account.credentialVersion,
    account.onboardingCompletedAt ?? null,
    account.profileEmailVerifiedAt ?? null,
    account.createdAt,
    account.updatedAt,
    account.lendingEligible ? 1 : 0,
    account.institutionId ?? '',
    account.departmentId || null,
    account.passwordChangedAt || null,
    account.lastPasswordResetAt || null,
  ];
  return db
    .prepare(
      `INSERT INTO accounts (
         id, access_id_normalized, status, role_id, default_committee_id,
         profile_full_name, profile_mobile_number, profile_email,
         password_credential_json, temporary_credential_json, credential_version,
         onboarding_completed_at, profile_email_verified_at, created_at, updated_at,
         lending_eligible, institution_id, department_id, password_changed_at,
         last_password_reset_at
       ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13,
         ?14, ?15, ?16, ?17, ?18, ?19, ?20)
       ON CONFLICT(id) DO UPDATE SET
         access_id_normalized = excluded.access_id_normalized,
         status = excluded.status,
         role_id = excluded.role_id,
         default_committee_id = excluded.default_committee_id,
         profile_full_name = excluded.profile_full_name,
         profile_mobile_number = excluded.profile_mobile_number,
         profile_email = excluded.profile_email,
         password_credential_json = excluded.password_credential_json,
         temporary_credential_json = excluded.temporary_credential_json,
         credential_version = excluded.credential_version,
         onboarding_completed_at = excluded.onboarding_completed_at,
         profile_email_verified_at = excluded.profile_email_verified_at,
         updated_at = excluded.updated_at,
         lending_eligible = excluded.lending_eligible,
         institution_id = excluded.institution_id,
         department_id = excluded.department_id,
         password_changed_at = excluded.password_changed_at,
         last_password_reset_at = excluded.last_password_reset_at
       WHERE accounts.credential_version = excluded.credential_version - 1`,
    )
    .bind(...values);
}

export function createD1AuthRepository(db) {
  if (!db) throw new Error('D1 database binding is required.');
  const repository = {
    async runTransaction(callback) {
      // D1 serializes each statement. Version-guarded writes and unique constraints provide
      // the final race protection for the auth service's read-modify-write operations.
      return callback(repository);
    },
    async getAccountByAccessId(accessIdNormalized) {
      return accountFromRow(
        db,
        await db
          .prepare('SELECT * FROM accounts WHERE access_id_normalized = ?1')
          .bind(accessIdNormalized)
          .first(),
      );
    },
    async getAccountByLoginIdentifier(identifier) {
      return accountFromRow(
        db,
        await db
          .prepare(
            `SELECT * FROM accounts
             WHERE access_id_normalized = ?1
                OR (profile_email_verified_at IS NOT NULL AND lower(profile_email) = ?1)
             LIMIT 1`,
          )
          .bind(identifier)
          .first(),
      );
    },
    async getAccountById(accountId) {
      return accountFromRow(
        db,
        await db.prepare('SELECT * FROM accounts WHERE id = ?1').bind(accountId).first(),
      );
    },
    async saveAccount(account) {
      const existing = await db
        .prepare('SELECT credential_version FROM accounts WHERE id = ?1')
        .bind(account.id)
        .first();
      const statements = [accountStatement(db, account)];
      if (!existing) {
        for (const committeeId of account.committeeIds ?? []) {
          statements.push(
            db
              .prepare(
                `INSERT INTO account_committees (
                   account_id, committee_id, membership_type, active, source
                 ) VALUES (?1, ?2, 'ASSIGNED', 1, 'SERVER')`,
              )
              .bind(account.id, committeeId),
          );
        }
      } else {
        statements.push(db.prepare('DELETE FROM account_committees WHERE account_id = ?1').bind(account.id));
        for (const committeeId of account.committeeIds ?? []) {
          statements.push(
            db
              .prepare(
                `INSERT INTO account_committees (
                   account_id, committee_id, membership_type, active, source
                 ) VALUES (?1, ?2, 'ASSIGNED', 1, 'SERVER')`,
              )
              .bind(account.id, committeeId),
          );
        }
      }
      const results = await db.batch(statements);
      if (existing && Number(results[0]?.meta?.changes ?? 0) !== 1) {
        throw Object.assign(new Error('Concurrent account update rejected.'), {
          code: 'ACCOUNT_WRITE_CONFLICT',
        });
      }
      return repository.getAccountById(account.id);
    },
    async createSession(session) {
      await db
        .prepare(
          `INSERT INTO sessions (
             token_digest, id, kind, account_id, csrf_digest, credential_version, issued_at, expires_at
           ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)`,
        )
        .bind(
          session.tokenDigest,
          session.id,
          session.kind,
          session.accountId,
          session.csrfDigest,
          session.credentialVersion,
          session.issuedAt,
          session.expiresAt,
        )
        .run();
      return session;
    },
    async getSession(tokenDigest) {
      const row = await db
        .prepare('SELECT * FROM sessions WHERE token_digest = ?1')
        .bind(tokenDigest)
        .first();
      return row
        ? {
            id: row.id,
            kind: row.kind,
            accountId: row.account_id,
            tokenDigest: row.token_digest,
            csrfDigest: row.csrf_digest,
            credentialVersion: row.credential_version,
            issuedAt: row.issued_at,
            expiresAt: row.expires_at,
          }
        : undefined;
    },
    async saveSession(session) {
      await db
        .prepare(
          `UPDATE sessions
           SET csrf_digest = ?2, expires_at = ?3
           WHERE token_digest = ?1`,
        )
        .bind(session.tokenDigest, session.csrfDigest, session.expiresAt)
        .run();
      return session;
    },
    async deleteSession(tokenDigest) {
      await db.prepare('DELETE FROM sessions WHERE token_digest = ?1').bind(tokenDigest).run();
    },
    async deleteSessionsForAccount(accountId) {
      await db.prepare('DELETE FROM sessions WHERE account_id = ?1').bind(accountId).run();
    },
    async createResetToken(token) {
      await db
        .prepare(
          `INSERT INTO password_reset_tokens (
             token_digest, id, account_id, issued_at, expires_at, consumed_at, issued_by
           ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`,
        )
        .bind(
          token.tokenDigest,
          token.id,
          token.accountId,
          token.issuedAt,
          token.expiresAt,
          token.consumedAt,
          token.issuedBy,
        )
        .run();
      return token;
    },
    async getResetToken(tokenDigest) {
      const row = await db
        .prepare('SELECT * FROM password_reset_tokens WHERE token_digest = ?1')
        .bind(tokenDigest)
        .first();
      return row
        ? {
            id: row.id,
            accountId: row.account_id,
            tokenDigest: row.token_digest,
            issuedAt: row.issued_at,
            expiresAt: row.expires_at,
            consumedAt: row.consumed_at,
            issuedBy: row.issued_by,
          }
        : undefined;
    },
    async consumeResetToken(tokenDigest, consumedAt) {
      const result = await db
        .prepare(
          `UPDATE password_reset_tokens
           SET consumed_at = ?2
           WHERE token_digest = ?1 AND consumed_at IS NULL`,
        )
        .bind(tokenDigest, consumedAt)
        .run();
      return Number(result.meta?.changes ?? 0) === 1;
    },
    async appendAudit(event) {
      const entityId = event.accountId || 'AUTHENTICATION';
      await db
        .prepare(
          `INSERT INTO audit_log (
             id, created_at, action, entity_type, entity_id, actor_account_id,
             before_json, after_json, correlation_id, notes
           ) VALUES (?1, ?2, ?3, 'ACCOUNT', ?4, ?4, '{}', ?5, ?6, '')`,
        )
        .bind(
          event.id,
          event.occurredAt,
          event.event,
          entityId,
          JSON.stringify(event.details ?? {}),
          `AUTH_${String(event.id).replaceAll('-', '').slice(0, 24)}`,
        )
        .run();
    },
  };
  return repository;
}

export function createD1RateLimiter(db, { limit = 5, windowMs = 15 * 60 * 1000 } = {}) {
  return Object.freeze({
    async consume(key, nowMs) {
      const cutoff = nowMs - windowMs;
      const row = await db
        .prepare(
          `SELECT COUNT(*) AS attempts, MIN(attempted_at) AS first_attempt
           FROM auth_rate_limit_events
           WHERE limiter_key = ?1 AND attempted_at > ?2`,
        )
        .bind(key, cutoff)
        .first();
      const attempts = Number(row?.attempts ?? 0);
      if (attempts >= limit) {
        return {
          allowed: false,
          retryAfterMs: Math.max(1, Number(row.first_attempt) + windowMs - nowMs),
        };
      }
      await db.batch([
        db.prepare('DELETE FROM auth_rate_limit_events WHERE attempted_at <= ?1').bind(cutoff),
        db
          .prepare('INSERT INTO auth_rate_limit_events (id, limiter_key, attempted_at) VALUES (?1, ?2, ?3)')
          .bind(crypto.randomUUID(), key, nowMs),
      ]);
      return { allowed: true, remaining: Math.max(0, limit - attempts - 1) };
    },
    async reset(key) {
      await db.prepare('DELETE FROM auth_rate_limit_events WHERE limiter_key = ?1').bind(key).run();
    },
  });
}
