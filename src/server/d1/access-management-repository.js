const parseJson = (value, fallback = null) => {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
};

const escapeLike = (value) =>
  String(value).replaceAll('\\', '\\\\').replaceAll('%', '\\%').replaceAll('_', '\\_');

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
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    lockedAt: row.locked_at ?? null,
    lastAccessIdChangedAt: row.last_access_id_changed_at ?? '',
    lastSuccessfulLogin: row.last_successful_login ?? '',
    lendingEligible: row.lending_eligible === 1,
    institutionId: row.institution_id ?? '',
    departmentId: row.department_id ?? '',
    departmentDisplayName: department?.display_name ?? '',
    passwordChangedAt: row.password_changed_at ?? '',
    lastPasswordResetAt: row.last_password_reset_at ?? '',
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
      notes,
    );
}

function limiterPattern(accessId) {
  return `${escapeLike(accessId)}:%`;
}

export function createD1AccessManagementRepository(db) {
  if (!db) throw new Error('D1 database binding is required.');

  return Object.freeze({
    async getAccountByAccessId(accessIdNormalized) {
      return accountFromRow(
        db,
        await db
          .prepare(
            `SELECT a.*,
              COALESCE((
                SELECT MAX(log.created_at)
                FROM audit_log log
                WHERE log.action = 'LOGIN_SUCCEEDED' AND log.entity_id = a.id
              ), '') AS last_successful_login
             FROM accounts a
             WHERE a.access_id_normalized = ?1`,
          )
          .bind(accessIdNormalized)
          .first(),
      );
    },

    async getAccessIdReservation(collisionKey) {
      return db
        .prepare('SELECT collision_key FROM access_id_reservations WHERE collision_key = ?1')
        .bind(collisionKey)
        .first();
    },

    async nextGeneratedAccessId(year) {
      const prefix = `DOL-${year}-`;
      const result = await db
        .prepare(
          `SELECT access_id_normalized FROM accounts
           WHERE access_id_normalized LIKE ?1
           ORDER BY access_id_normalized DESC LIMIT 200`,
        )
        .bind(`${prefix}%`)
        .all();
      const maximum = result.results.reduce((current, row) => {
        const match = String(row.access_id_normalized).match(/^DOL-\d{4}-(\d{4})$/u);
        return Math.max(current, Number(match?.[1] ?? 0));
      }, 0);
      if (maximum >= 9999) throw new Error('Generated Access ID sequence is exhausted.');
      return `${prefix}${String(maximum + 1).padStart(4, '0')}`;
    },

    async countActiveAdministrators() {
      const row = await db
        .prepare(
          "SELECT COUNT(*) AS count FROM accounts WHERE role_id = 'ADMINISTRATOR' AND status = 'ACTIVE' AND locked_at IS NULL",
        )
        .first();
      return Number(row?.count ?? 0);
    },

    async listAccessPolicyReferences() {
      const [committees, locations, eventSeries, events, capabilities] = await Promise.all([
        db.prepare('SELECT id, name FROM committees WHERE active = 1 ORDER BY name').all(),
        db
          .prepare(
            "SELECT DISTINCT storage_location AS id FROM inventory_items WHERE status = 'ACTIVE' AND trim(storage_location) <> '' ORDER BY storage_location LIMIT 100",
          )
          .all(),
        db.prepare("SELECT id, name FROM event_series WHERE status = 'ACTIVE' ORDER BY name LIMIT 100").all(),
        db
          .prepare(
            'SELECT id, event_series_id, name FROM events WHERE active = 1 ORDER BY starts_at, name LIMIT 200',
          )
          .all(),
        db.prepare('SELECT id, description FROM capabilities ORDER BY id').all(),
      ]);
      return {
        committees: committees.results.map((row) => ({ id: row.id, label: row.name })),
        locations: locations.results.map((row) => ({ id: row.id, label: row.id })),
        eventSeries: eventSeries.results.map((row) => ({ id: row.id, label: row.name })),
        events: events.results.map((row) => ({
          id: row.id,
          eventSeriesId: row.event_series_id,
          label: row.name,
        })),
        capabilities: capabilities.results.map((row) => ({ id: row.id, label: row.description })),
        locationScopeIds: locations.results.map((row) => row.id),
        eventSeriesScopeIds: eventSeries.results.map((row) => row.id),
        eventScopeIds: events.results.map((row) => row.id),
      };
    },

    async getAccessPolicyChangeByIdempotency(idempotencyKey) {
      const row = await db
        .prepare('SELECT after_json FROM access_policy_changes WHERE idempotency_key = ?1')
        .bind(idempotencyKey)
        .first();
      return row ? { after: parseJson(row.after_json, {}) } : null;
    },

    async updateAccessPolicy({
      account,
      nextAccount,
      actor,
      changedAt,
      reason,
      correlationId,
      idempotencyKey,
      changeId,
      auditId,
    }) {
      const profile = nextAccount.accessProfile;
      const before = {
        roleId: account.roleId,
        committeeIds: account.committeeIds,
        defaultCommitteeId: account.defaultCommitteeId,
        accessProfile: account.accessProfile ?? null,
      };
      const after = {
        roleId: nextAccount.roleId,
        committeeIds: nextAccount.committeeIds,
        defaultCommitteeId: nextAccount.defaultCommitteeId,
        accessProfile: profile,
        sessionsRevoked: true,
      };
      const statements = [
        db
          .prepare(
            `UPDATE accounts
             SET role_id = ?1, default_committee_id = ?2,
                 credential_version = credential_version + 1, updated_at = ?3
             WHERE id = ?4 AND credential_version = ?5`,
          )
          .bind(
            nextAccount.roleId,
            nextAccount.defaultCommitteeId || null,
            changedAt,
            account.id,
            account.credentialVersion,
          ),
        db.prepare('DELETE FROM account_committees WHERE account_id = ?1').bind(account.id),
      ];
      for (const committeeId of nextAccount.committeeIds) {
        statements.push(
          db
            .prepare(
              `INSERT INTO account_committees (
                 account_id, committee_id, membership_type, active, source
               ) VALUES (?1, ?2, 'ASSIGNED', 1, 'ACCESS_MANAGEMENT')`,
            )
            .bind(account.id, committeeId),
        );
      }
      statements.push(
        db
          .prepare(
            `INSERT INTO account_access_profiles (
               account_id, preset_id, workspace_ids_json, default_workspace_id,
               location_scope_ids_json, event_series_scope_ids_json, event_scope_ids_json,
               capability_grants_json, capability_denies_json, updated_at, updated_by_account_id
             ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)
             ON CONFLICT(account_id) DO UPDATE SET
               preset_id = excluded.preset_id,
               workspace_ids_json = excluded.workspace_ids_json,
               default_workspace_id = excluded.default_workspace_id,
               location_scope_ids_json = excluded.location_scope_ids_json,
               event_series_scope_ids_json = excluded.event_series_scope_ids_json,
               event_scope_ids_json = excluded.event_scope_ids_json,
               capability_grants_json = excluded.capability_grants_json,
               capability_denies_json = excluded.capability_denies_json,
               updated_at = excluded.updated_at,
               updated_by_account_id = excluded.updated_by_account_id`,
          )
          .bind(
            account.id,
            profile.presetId,
            JSON.stringify(profile.workspaceIds),
            profile.defaultWorkspaceId,
            JSON.stringify(profile.locationScopeIds),
            JSON.stringify(profile.eventSeriesScopeIds),
            JSON.stringify(profile.eventScopeIds),
            JSON.stringify(profile.capabilityGrants),
            JSON.stringify(profile.capabilityDenies),
            changedAt,
            actor.id,
          ),
        db.prepare('DELETE FROM sessions WHERE account_id = ?1').bind(account.id),
        db
          .prepare(
            `INSERT INTO access_policy_changes (
               id, account_id, actor_account_id, idempotency_key, before_json,
               after_json, changed_at, reason, correlation_id
             ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)`,
          )
          .bind(
            changeId,
            account.id,
            actor.id,
            idempotencyKey,
            JSON.stringify(before),
            JSON.stringify(after),
            changedAt,
            reason,
            correlationId,
          ),
        auditStatement(db, {
          id: auditId,
          createdAt: changedAt,
          action: 'ACCESS_POLICY_CHANGED',
          accountId: account.id,
          actorId: actor.id,
          before,
          after,
          correlationId,
          notes: reason,
        }),
      );
      const results = await db.batch(statements);
      if (Number(results[0]?.meta?.changes ?? 0) !== 1) throw new Error('Account write conflict.');
    },

    async listAccounts({ query, role, committee, status, sort, direction, page, pageSize }) {
      const conditions = ["a.id NOT LIKE 'SYSTEM-%'"];
      const bindings = [];
      const bind = (value) => {
        bindings.push(value);
        return `?${bindings.length}`;
      };
      if (query) {
        const parameter = bind(`%${escapeLike(query)}%`);
        conditions.push(
          `(a.access_id_normalized LIKE ${parameter} ESCAPE '\\'
            OR COALESCE(a.profile_full_name, '') LIKE ${parameter} ESCAPE '\\'
            OR EXISTS (
              SELECT 1 FROM requester_departments department
              WHERE department.id = a.department_id
                AND department.display_name LIKE ${parameter} ESCAPE '\\'
            ))`,
        );
      }
      if (role) conditions.push(`a.role_id = ${bind(role)}`);
      if (committee) {
        conditions.push(
          `EXISTS (
             SELECT 1 FROM account_committees scope
             WHERE scope.account_id = a.id AND scope.active = 1 AND scope.committee_id = ${bind(committee)}
           )`,
        );
      }
      if (status === 'LOCKED') conditions.push('a.locked_at IS NOT NULL');
      else if (status === 'PENDING_FIRST_LOGIN') {
        conditions.push("(a.status = 'STARTER' OR a.onboarding_completed_at IS NULL)");
      } else if (status !== 'ALL') conditions.push(`a.status = ${bind(status)}`);

      const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
      const sortColumns = {
        accessId: 'a.access_id_normalized',
        department:
          "(SELECT department.display_name FROM requester_departments department WHERE department.id = a.department_id)",
        role: 'a.role_id',
        status: 'a.status',
        lastLogin: 'last_successful_login',
      };
      const order = `${sortColumns[sort] ?? sortColumns.accessId} ${direction === 'desc' ? 'DESC' : 'ASC'}, a.access_id_normalized ASC`;
      const countRow = await db
        .prepare(`SELECT COUNT(*) AS count FROM accounts a ${where}`)
        .bind(...bindings)
        .first();
      const total = Number(countRow?.count ?? 0);
      const offset = (page - 1) * pageSize;
      const pageBindings = [...bindings, pageSize, offset];
      const result = await db
        .prepare(
          `SELECT a.*,
             COALESCE((
               SELECT MAX(log.created_at)
               FROM audit_log log
               WHERE log.action = 'LOGIN_SUCCEEDED' AND log.entity_id = a.id
             ), '') AS last_successful_login
           FROM accounts a
           ${where}
           ORDER BY ${order}
           LIMIT ?${bindings.length + 1} OFFSET ?${bindings.length + 2}`,
        )
        .bind(...pageBindings)
        .all();
      const items = [];
      for (const row of result.results) {
        const account = await accountFromRow(db, row);
        items.push({
          accessId: account.accessIdNormalized,
          displayName: account.profile?.fullName || account.accessIdNormalized,
          roleId: account.roleId,
          committeeIds: account.committeeIds,
          defaultCommitteeId: account.defaultCommitteeId,
          accessProfile: account.accessProfile,
          status: account.status,
          firstLoginPending: account.status === 'STARTER' || !account.onboardingCompletedAt,
          locked: Boolean(account.lockedAt),
          createdAt: account.createdAt,
          lastSuccessfulLogin: account.lastSuccessfulLogin,
          lastAccessIdChange: account.lastAccessIdChangedAt,
          passwordChangedAt: account.passwordChangedAt,
          lastPasswordResetAt: account.lastPasswordResetAt,
          departmentId: account.departmentId,
          departmentDisplayName: account.departmentDisplayName,
          lendingEligible: account.lendingEligible,
        });
      }
      return {
        items,
        pagination: {
          page,
          pageSize,
          total,
          totalPages: Math.max(1, Math.ceil(total / pageSize)),
        },
      };
    },

    async listAccessIdHistory(accountId, limit) {
      const result = await db
        .prepare(
          `SELECT old_access_id_normalized, new_access_id_normalized,
                  actor_access_id_snapshot, changed_at, reason, correlation_id, environment
           FROM access_id_history
           WHERE account_id = ?1
           ORDER BY changed_at DESC
           LIMIT ?2`,
        )
        .bind(accountId, limit)
        .all();
      return result.results.map((row) => ({
        oldAccessId: row.old_access_id_normalized,
        newAccessId: row.new_access_id_normalized,
        actorAccessId: row.actor_access_id_snapshot,
        changedAt: row.changed_at,
        reason: row.reason,
        correlationId: row.correlation_id,
        environment: row.environment,
      }));
    },

    async listAccountAuditHistory(accountId, limit) {
      const result = await db
        .prepare(
          `SELECT created_at, action, correlation_id, notes
           FROM audit_log
           WHERE entity_type = 'ACCOUNT' AND entity_id = ?1
           ORDER BY created_at DESC
           LIMIT ?2`,
        )
        .bind(accountId, limit)
        .all();
      return result.results.map((row) => ({
        action: row.action,
        changedAt: row.created_at,
        correlationId: row.correlation_id,
        reason: row.notes,
      }));
    },

    async getAccessIdHistoryByIdempotency(idempotencyKey) {
      const row = await db
        .prepare(
          `SELECT account_id, old_access_id_normalized, new_access_id_normalized
           FROM access_id_history
           WHERE idempotency_key = ?1`,
        )
        .bind(idempotencyKey)
        .first();
      return row
        ? {
            accountId: row.account_id,
            oldAccessId: row.old_access_id_normalized,
            newAccessId: row.new_access_id_normalized,
          }
        : undefined;
    },

    async changeAccessId({
      account,
      actor,
      newAccessId,
      collisionKey,
      changedAt,
      reason,
      correlationId,
      environment,
      idempotencyKey,
      historyId,
      auditId,
    }) {
      const results = await db.batch([
        db
          .prepare(
            `INSERT INTO access_id_reservations (
               collision_key, account_id, access_id_snapshot, reserved_at, reservation_reason
             ) VALUES (?1, ?2, ?3, ?4, 'ACCESS_ID_CHANGE')`,
          )
          .bind(collisionKey, account.id, newAccessId, changedAt),
        db
          .prepare(
            `UPDATE accounts
             SET access_id_normalized = CASE
                   WHEN access_id_normalized = ?4 AND credential_version = ?5 THEN ?1
                   ELSE NULL
                 END,
                 credential_version = credential_version + 1,
                 last_access_id_changed_at = ?2,
                 updated_at = ?2
             WHERE id = ?3`,
          )
          .bind(newAccessId, changedAt, account.id, account.accessIdNormalized, account.credentialVersion),
        db
          .prepare(
            `INSERT INTO access_id_history (
               id, account_id, old_access_id_normalized, new_access_id_normalized,
               changed_by_account_id, actor_access_id_snapshot, changed_at, reason,
               correlation_id, environment, idempotency_key
             ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)`,
          )
          .bind(
            historyId,
            account.id,
            account.accessIdNormalized,
            newAccessId,
            actor.id,
            actor.accessIdNormalized,
            changedAt,
            reason,
            correlationId,
            environment,
            idempotencyKey,
          ),
        db.prepare('DELETE FROM sessions WHERE account_id = ?1').bind(account.id),
        auditStatement(db, {
          id: auditId,
          createdAt: changedAt,
          action: 'ACCESS_ID_CHANGED',
          accountId: account.id,
          actorId: actor.id,
          before: { accessId: account.accessIdNormalized, roleId: account.roleId },
          after: { accessId: newAccessId, roleId: account.roleId, sessionsRevoked: true },
          correlationId,
          notes: reason,
        }),
      ]);
      if (Number(results[1]?.meta?.changes ?? 0) !== 1) {
        throw new Error('Account write conflict.');
      }
    },

    async createStarterAccount({ account, actor, collisionKey, reason, correlationId, auditId }) {
      const statements = [
        db
          .prepare(
            `INSERT INTO accounts (
               id, access_id_normalized, status, role_id, default_committee_id,
               profile_full_name, profile_mobile_number, profile_email,
               password_credential_json, temporary_credential_json, credential_version,
               onboarding_completed_at, created_at, updated_at, locked_at,
               last_access_id_changed_at, lending_eligible, institution_id,
               department_id, password_changed_at, last_password_reset_at
             ) VALUES (?1, ?2, ?3, ?4, ?5, NULL, NULL, NULL, NULL, ?6, 1, NULL,
               ?7, ?7, NULL, NULL, ?8, ?9, ?10, NULL, NULL)`,
          )
          .bind(
            account.id,
            account.accessIdNormalized,
            account.status,
            account.roleId,
            account.defaultCommitteeId || null,
            JSON.stringify(account.temporaryCredential),
            account.createdAt,
            account.lendingEligible ? 1 : 0,
            account.institutionId ?? '',
            account.departmentId || null,
          ),
        db
          .prepare(
            `INSERT INTO access_id_reservations (
               collision_key, account_id, access_id_snapshot, reserved_at, reservation_reason
             ) VALUES (?1, ?2, ?3, ?4, 'ACCOUNT_CREATED')`,
          )
          .bind(collisionKey, account.id, account.accessIdNormalized, account.createdAt),
      ];
      for (const committeeId of account.committeeIds) {
        statements.push(
          db
            .prepare(
              `INSERT INTO account_committees (
                 account_id, committee_id, membership_type, active, source
               ) VALUES (?1, ?2, 'ASSIGNED', 1, 'ACCESS_MANAGEMENT')`,
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
              actor.id,
            ),
        );
      }
      statements.push(
        auditStatement(db, {
          id: auditId,
          createdAt: account.createdAt,
          action: 'STARTER_ACCOUNT_CREATED',
          accountId: account.id,
          actorId: actor.id,
          before: {},
          after: {
            accessId: account.accessIdNormalized,
            roleId: account.roleId,
            committeeIds: account.committeeIds,
            departmentId: account.departmentId || '',
            status: account.status,
          },
          correlationId,
          notes: reason,
        }),
      );
      await db.batch(statements);
    },

    async listRequesterDepartments() {
      const result = await db
        .prepare(
          `SELECT id, code, display_name, recommended_access_id, active
           FROM requester_departments
           ORDER BY id`,
        )
        .all();
      return result.results.map((row) => ({
        id: row.id,
        code: row.code,
        displayName: row.display_name,
        recommendedAccessId: row.recommended_access_id,
        active: row.active === 1,
      }));
    },

    async listDepartmentAccountStates() {
      const result = await db
        .prepare(
          `SELECT department.id AS department_id, account.id AS account_id,
                  account.access_id_normalized, account.role_id, account.status
           FROM requester_departments department
           LEFT JOIN accounts account ON account.department_id = department.id
           WHERE department.active = 1
           ORDER BY department.id`,
        )
        .all();
      return result.results.map((row) => ({
        departmentId: row.department_id,
        accountId: row.account_id ?? '',
        accessId: row.access_id_normalized ?? '',
        roleId: row.role_id ?? '',
        status: row.status ?? '',
      }));
    },

    async seedDepartmentAccounts({ accounts, actor, reason, correlationId, auditIds }) {
      const statements = [];
      accounts.forEach((account, index) => {
        statements.push(
          db
            .prepare(
              `INSERT INTO accounts (
                 id, access_id_normalized, status, role_id, default_committee_id,
                 profile_full_name, profile_mobile_number, profile_email,
                 password_credential_json, temporary_credential_json, credential_version,
                 onboarding_completed_at, created_at, updated_at, locked_at,
                 last_access_id_changed_at, lending_eligible, institution_id,
                 department_id, password_changed_at, last_password_reset_at
               ) VALUES (?1, ?2, 'STARTER', 'REQUESTER', NULL, NULL, NULL, NULL,
                 NULL, ?3, 1, NULL, ?4, ?4, NULL, NULL, 0, '', ?5, NULL, NULL)`,
            )
            .bind(
              account.id,
              account.accessIdNormalized,
              JSON.stringify(account.temporaryCredential),
              account.createdAt,
              account.departmentId,
            ),
          db
            .prepare(
              `INSERT INTO access_id_reservations (
                 collision_key, account_id, access_id_snapshot, reserved_at, reservation_reason
               ) VALUES (?1, ?2, ?3, ?4, 'DEPARTMENT_ACCOUNT_CREATED')`,
            )
            .bind(
              account.accessIdNormalized.replace(/[._-]/gu, ''),
              account.id,
              account.accessIdNormalized,
              account.createdAt,
            ),
          auditStatement(db, {
            id: auditIds[index],
            createdAt: account.createdAt,
            action: 'DEPARTMENT_ACCOUNT_CREATED',
            accountId: account.id,
            actorId: actor.id,
            before: {},
            after: {
              accessId: account.accessIdNormalized,
              roleId: account.roleId,
              departmentId: account.departmentId,
              status: account.status,
            },
            correlationId,
            notes: reason,
          }),
        );
      });
      await db.batch(statements);
    },

    async resetTemporaryPassword({
      account,
      actor,
      temporaryCredential,
      resetAt,
      reason,
      correlationId,
      auditId,
    }) {
      const results = await db.batch([
        db
          .prepare(
            `UPDATE accounts
             SET status = CASE WHEN credential_version = ?4 THEN 'STARTER' ELSE NULL END,
                 temporary_credential_json = ?1,
                 credential_version = credential_version + 1,
                 onboarding_completed_at = NULL, locked_at = NULL,
                 last_password_reset_at = ?2, updated_at = ?2
             WHERE id = ?3`,
          )
          .bind(JSON.stringify(temporaryCredential), resetAt, account.id, account.credentialVersion),
        db.prepare('DELETE FROM sessions WHERE account_id = ?1').bind(account.id),
        db
          .prepare("DELETE FROM auth_rate_limit_events WHERE limiter_key LIKE ?1 ESCAPE '\\'")
          .bind(limiterPattern(account.accessIdNormalized)),
        auditStatement(db, {
          id: auditId,
          createdAt: resetAt,
          action: 'TEMPORARY_PASSWORD_RESET',
          accountId: account.id,
          actorId: actor.id,
          before: { status: account.status },
          after: { status: 'STARTER', sessionsRevoked: true },
          correlationId,
          notes: reason,
        }),
      ]);
      if (Number(results[0]?.meta?.changes ?? 0) !== 1) throw new Error('Account write conflict.');
    },

    async setAccountStatus({
      account,
      actor,
      nextStatus,
      changedAt,
      reason,
      correlationId,
      auditId,
      auditAction = 'ACCOUNT_STATUS_CHANGED',
    }) {
      const results = await db.batch([
        db
          .prepare(
            `UPDATE accounts
             SET status = CASE WHEN credential_version = ?4 THEN ?1 ELSE NULL END,
                 credential_version = credential_version + 1, updated_at = ?2
             WHERE id = ?3`,
          )
          .bind(nextStatus, changedAt, account.id, account.credentialVersion),
        db.prepare('DELETE FROM sessions WHERE account_id = ?1').bind(account.id),
        auditStatement(db, {
          id: auditId,
          createdAt: changedAt,
          action: auditAction,
          accountId: account.id,
          actorId: actor.id,
          before: { status: account.status },
          after: { status: nextStatus, sessionsRevoked: true },
          correlationId,
          notes: reason,
        }),
      ]);
      if (Number(results[0]?.meta?.changes ?? 0) !== 1) throw new Error('Account write conflict.');
    },

    async revokeSessions({ account, actor, changedAt, reason, correlationId, auditId }) {
      await db.batch([
        db.prepare('DELETE FROM sessions WHERE account_id = ?1').bind(account.id),
        auditStatement(db, {
          id: auditId,
          createdAt: changedAt,
          action: 'ACCOUNT_SESSIONS_REVOKED',
          accountId: account.id,
          actorId: actor.id,
          before: {},
          after: { sessionsRevoked: true },
          correlationId,
          notes: reason,
        }),
      ]);
    },

    async unlockAccount({ account, actor, changedAt, reason, correlationId, auditId }) {
      await db.batch([
        db
          .prepare('UPDATE accounts SET locked_at = NULL, updated_at = ?1 WHERE id = ?2')
          .bind(changedAt, account.id),
        db
          .prepare("DELETE FROM auth_rate_limit_events WHERE limiter_key LIKE ?1 ESCAPE '\\'")
          .bind(limiterPattern(account.accessIdNormalized)),
        auditStatement(db, {
          id: auditId,
          createdAt: changedAt,
          action: 'ACCOUNT_UNLOCKED',
          accountId: account.id,
          actorId: actor.id,
          before: { locked: Boolean(account.lockedAt) },
          after: { locked: false },
          correlationId,
          notes: reason,
        }),
      ]);
    },
  });
}
