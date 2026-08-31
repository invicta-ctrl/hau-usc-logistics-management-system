import { runAtomicRevisionGuardedBatch } from './operational-service.js';

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

function accountRevisionToken(account) {
  const explicit = String(account?.revision ?? '').trim();
  if (explicit) return explicit;
  return `${Number(account?.credentialVersion ?? 1)}:${String(account?.updatedAt ?? '')}`;
}

function collisionKey(value) {
  return String(value ?? '')
    .trim()
    .toUpperCase()
    .replace(/[._-]/gu, '');
}

function accountSelect(whereClause) {
  return `SELECT a.*,
            COALESCE((
              SELECT MAX(log.created_at)
              FROM audit_log log
              WHERE log.action = 'LOGIN_SUCCEEDED' AND log.entity_id = a.id
            ), '') AS last_successful_login
          FROM accounts a
          WHERE ${whereClause}`;
}

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
  return accessProfileFromRow(row);
}

function accessProfileFromRow(row) {
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

function accountFromHydratedRow(
  row,
  { committeeIds: hydratedCommitteeIds = [], hydratedAccessProfile = null, departmentDisplayName = '' } = {},
) {
  if (!row) return undefined;
  return {
    id: row.id,
    accessIdNormalized: row.access_id_normalized,
    status: row.status,
    roleId: row.role_id,
    committeeIds: hydratedCommitteeIds,
    accessProfile: hydratedAccessProfile,
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
    profileDepartmentId: row.profile_department_id ?? '',
    departmentDisplayName,
    passwordChangedAt: row.password_changed_at ?? '',
    lastPasswordResetAt: row.last_password_reset_at ?? '',
    usernameNormalized: row.username_normalized ?? '',
    profileEmailVerifiedAt: row.profile_email_verified_at ?? null,
    profileEmail: row.profile_email ?? '',
    revision: `${Number(row.credential_version ?? 1)}:${String(row.updated_at ?? '')}`,
  };
}

async function accountFromRow(db, row) {
  if (!row) return undefined;
  const profileDepartmentId = row.profile_department_id ?? row.department_id ?? '';
  const [hydratedCommitteeIds, hydratedAccessProfile, department] = await Promise.all([
    committeeIds(db, row.id),
    accessProfile(db, row.id),
    profileDepartmentId
      ? db
          .prepare('SELECT display_name FROM requester_departments WHERE id = ?1')
          .bind(profileDepartmentId)
          .first()
      : null,
  ]);
  return accountFromHydratedRow(row, {
    committeeIds: hydratedCommitteeIds,
    hydratedAccessProfile,
    departmentDisplayName: department?.display_name ?? '',
  });
}

async function hydrateAccountPage(db, accountRows) {
  const accountIds = [...new Set(accountRows.map((row) => row.id).filter(Boolean))];
  if (!accountIds.length) {
    return {
      committeeIdsByAccount: new Map(),
      accessProfilesByAccount: new Map(),
      departmentNamesById: new Map(),
    };
  }
  const accountPlaceholders = accountIds.map((_, index) => `?${index + 1}`).join(', ');
  const [committeeResult, profileResult] = await Promise.all([
    db
      .prepare(
        `SELECT account_id, committee_id
         FROM account_committees
         WHERE active = 1 AND account_id IN (${accountPlaceholders})
         ORDER BY account_id, committee_id`,
      )
      .bind(...accountIds)
      .all(),
    db
      .prepare(
        `SELECT account_id, preset_id, workspace_ids_json, default_workspace_id,
                location_scope_ids_json, event_series_scope_ids_json, event_scope_ids_json,
                capability_grants_json, capability_denies_json
         FROM account_access_profiles
         WHERE account_id IN (${accountPlaceholders})`,
      )
      .bind(...accountIds)
      .all(),
  ]);
  const committeeIdsByAccount = new Map(accountIds.map((accountId) => [accountId, []]));
  for (const row of committeeResult.results)
    committeeIdsByAccount.get(row.account_id)?.push(row.committee_id);
  const accessProfilesByAccount = new Map(
    profileResult.results.map((row) => [row.account_id, accessProfileFromRow(row)]),
  );
  const departmentIds = [
    ...new Set(
      accountRows.map((row) => row.profile_department_id ?? row.department_id ?? '').filter(Boolean),
    ),
  ];
  const departmentNamesById = new Map();
  if (departmentIds.length) {
    const departmentPlaceholders = departmentIds.map((_, index) => `?${index + 1}`).join(', ');
    const departmentResult = await db
      .prepare(
        `SELECT id, display_name
         FROM requester_departments
         WHERE id IN (${departmentPlaceholders})`,
      )
      .bind(...departmentIds)
      .all();
    for (const row of departmentResult.results) departmentNamesById.set(row.id, row.display_name);
  }
  return { committeeIdsByAccount, accessProfilesByAccount, departmentNamesById };
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

const STAFF_ACTIVITY_AUDIT_ACTIONS = new Set([
  'ACCESS_ID_CHANGED',
  'STARTER_ACCOUNT_CREATED',
  'ACCOUNT_STATUS_CHANGED',
]);
const CANONICAL_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u;

function canonicalActivityTimestamp(value) {
  const timestamp = String(value ?? '').trim();
  if (!CANONICAL_UTC.test(timestamp) || Number.isNaN(Date.parse(timestamp))) {
    return null;
  }
  if (new Date(timestamp).toISOString() !== timestamp) {
    return null;
  }
  return timestamp;
}

function staffActivityAuditContextStatement(db, { auditId, accountId, action, correlationId, preparedAt }) {
  if (!STAFF_ACTIVITY_AUDIT_ACTIONS.has(action)) return null;
  const timestamp = canonicalActivityTimestamp(preparedAt);
  const correlation = String(correlationId ?? '').trim();
  if (!timestamp || !correlation || correlation.length > 128) return null;
  return db
    .prepare(
      `INSERT INTO staff_account_activity_audit_context (
         audit_id, person_id, account_id, account_staff_link_id, link_state,
         account_access_id_snapshot, action_code, correlation_id, prepared_at
       )
       SELECT ?1, link.person_id, account.id, link.id, 'ACTIVE',
              account.access_id_normalized, ?3, ?4, ?5
       FROM accounts AS account
       JOIN account_staff_links AS link ON link.account_id = account.id
       WHERE account.id = ?2
         AND link.state = 'ACTIVE'
         AND (
           SELECT COUNT(*)
           FROM account_staff_links AS active_link
           WHERE active_link.account_id = ?2 AND active_link.state = 'ACTIVE'
         ) = 1`,
    )
    .bind(auditId, accountId, action, correlation, timestamp);
}

function idempotencyStatement(db, idempotency) {
  return db
    .prepare(
      `INSERT INTO idempotency_keys (
         scope, idempotency_key, actor_account_id, request_fingerprint, result_json, created_at
       ) VALUES (?1, ?2, ?3, ?4, ?5, ?6)`,
    )
    .bind(
      idempotency.scope,
      idempotency.key,
      idempotency.actorAccountId,
      idempotency.requestFingerprint,
      JSON.stringify(idempotency.result),
      idempotency.createdAt,
    );
}

function safeAuditState(value) {
  let parsed;
  try {
    parsed = value ? JSON.parse(value) : {};
  } catch {
    return {};
  }
  return ['accessId', 'roleId', 'status', 'locked', 'sessionsRevoked'].reduce((safe, key) => {
    if (Object.hasOwn(parsed, key)) safe[key] = parsed[key];
    return safe;
  }, {});
}

function limiterPattern(limiterIdentity) {
  return `${escapeLike(limiterIdentity)}:%`;
}

export function createD1AccessManagementRepository(db) {
  if (!db) throw new Error('D1 database binding is required.');

  return Object.freeze({
    async getAccountByAccessId(accessIdNormalized) {
      return accountFromRow(
        db,
        await db.prepare(accountSelect('a.access_id_normalized = ?1')).bind(accessIdNormalized).first(),
      );
    },

    async getAccountById(accountId) {
      return accountFromRow(db, await db.prepare(accountSelect('a.id = ?1')).bind(accountId).first());
    },

    async getAccountByUsername(accessIdNormalized) {
      return db
        .prepare(
          `SELECT id
           FROM accounts
           WHERE UPPER(REPLACE(REPLACE(REPLACE(COALESCE(username_normalized, ''), '.', ''), '-', ''), '_', '')) = ?1
           LIMIT 1`,
        )
        .bind(collisionKey(accessIdNormalized))
        .first();
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
        .prepare(
          `SELECT after_json, correlation_id, actor_account_id, account_id
           FROM access_policy_changes
           WHERE idempotency_key = ?1`,
        )
        .bind(idempotencyKey)
        .first();
      return row
        ? {
            after: parseJson(row.after_json, {}),
            correlationId: row.correlation_id,
            actorAccountId: row.actor_account_id,
            accountId: row.account_id,
          }
        : null;
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
      idempotency,
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
      const guardedStatement = db
        .prepare(
          `UPDATE accounts
           SET role_id = ?1, default_committee_id = ?2,
               credential_version = credential_version + 1, updated_at = ?3
           WHERE id = ?4
             AND credential_version = ?5
             AND updated_at = ?6
             AND NOT (
               role_id = 'ADMINISTRATOR'
               AND status = 'ACTIVE'
               AND locked_at IS NULL
               AND ?7 <> 'ADMINISTRATOR'
               AND (
                 SELECT COUNT(*)
                 FROM accounts
                 WHERE role_id = 'ADMINISTRATOR'
                   AND status = 'ACTIVE'
                   AND locked_at IS NULL
               ) <= 1
             )`,
        )
        .bind(
          nextAccount.roleId,
          nextAccount.defaultCommitteeId || null,
          changedAt,
          account.id,
          account.credentialVersion,
          account.updatedAt,
          nextAccount.roleId,
        );
      const dependentStatements = [
        db.prepare('DELETE FROM account_committees WHERE account_id = ?1').bind(account.id),
      ];
      for (const committeeId of nextAccount.committeeIds) {
        dependentStatements.push(
          db
            .prepare(
              `INSERT INTO account_committees (
                 account_id, committee_id, membership_type, active, source
               ) VALUES (?1, ?2, 'ASSIGNED', 1, 'ACCESS_MANAGEMENT')`,
            )
            .bind(account.id, committeeId),
        );
      }
      dependentStatements.push(
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
        ...(idempotency ? [idempotencyStatement(db, idempotency)] : []),
      );
      await runAtomicRevisionGuardedBatch(db, {
        guardedStatement,
        dependentStatements,
        conflictCode: 'ACCESS_WRITE_CONFLICT',
        conflictMessage: 'The account changed before this request completed. Refresh and try again.',
      });
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
          '(SELECT department.display_name FROM requester_departments department WHERE department.id = a.department_id)',
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
          `SELECT a.id, a.access_id_normalized, a.status, a.role_id,
                  a.default_committee_id, a.profile_full_name, a.credential_version,
                  a.onboarding_completed_at, a.created_at, a.updated_at, a.locked_at,
                  a.last_access_id_changed_at, a.lending_eligible, a.department_id,
                  a.profile_department_id, a.password_changed_at, a.last_password_reset_at,
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
      const { committeeIdsByAccount, accessProfilesByAccount, departmentNamesById } =
        await hydrateAccountPage(db, result.results);
      const items = result.results.map((row) => {
        const departmentId = row.profile_department_id ?? row.department_id ?? '';
        const account = accountFromHydratedRow(row, {
          committeeIds: committeeIdsByAccount.get(row.id) ?? [],
          hydratedAccessProfile: accessProfilesByAccount.get(row.id) ?? null,
          departmentDisplayName: departmentNamesById.get(departmentId) ?? '',
        });
        return {
          accountId: account.id,
          revision: accountRevisionToken(account),
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
        };
      });
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
          `SELECT created_at, action, correlation_id, notes, before_json, after_json
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
        before: safeAuditState(row.before_json),
        after: safeAuditState(row.after_json),
      }));
    },

    async getIdempotency(scope, key) {
      const row = await db
        .prepare(
          `SELECT actor_account_id, request_fingerprint, result_json
           FROM idempotency_keys WHERE scope = ?1 AND idempotency_key = ?2`,
        )
        .bind(scope, key)
        .first();
      return row
        ? {
            actorAccountId: row.actor_account_id,
            requestFingerprint: row.request_fingerprint,
            result: JSON.parse(row.result_json),
          }
        : null;
    },

    async getAccessIdHistoryByIdempotency(idempotencyKey) {
      const row = await db
        .prepare(
          `SELECT account_id, old_access_id_normalized, new_access_id_normalized, correlation_id
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
            correlationId: row.correlation_id,
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
      const guardedStatement = db
        .prepare(
          `UPDATE accounts
           SET access_id_normalized = ?1,
               credential_version = credential_version + 1,
               last_access_id_changed_at = ?2,
               updated_at = ?2
           WHERE id = ?3
             AND access_id_normalized = ?4
             AND credential_version = ?5
             AND updated_at = ?6
             AND NOT EXISTS (
               SELECT 1
               FROM accounts username_account
               WHERE UPPER(REPLACE(REPLACE(REPLACE(COALESCE(username_account.username_normalized, ''), '.', ''), '-', ''), '_', '')) = ?7
             )`,
        )
        .bind(
          newAccessId,
          changedAt,
          account.id,
          account.accessIdNormalized,
          account.credentialVersion,
          account.updatedAt,
          collisionKey,
        );
      const activityContext = staffActivityAuditContextStatement(db, {
        auditId,
        accountId: account.id,
        action: 'ACCESS_ID_CHANGED',
        correlationId,
        preparedAt: changedAt,
      });
      const dependentStatements = [
        db
          .prepare(
            `INSERT INTO access_id_reservations (
               collision_key, account_id, access_id_snapshot, reserved_at, reservation_reason
             ) VALUES (?1, ?2, ?3, ?4, 'ACCESS_ID_CHANGE')`,
          )
          .bind(collisionKey, account.id, newAccessId, changedAt),
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
        ...(activityContext ? [activityContext] : []),
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
      ];
      await runAtomicRevisionGuardedBatch(db, {
        guardedStatement,
        dependentStatements,
        conflictCode: 'ACCESS_WRITE_CONFLICT',
        conflictMessage: 'The account changed before this request completed. Refresh and try again.',
      });
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
      const activityContext = staffActivityAuditContextStatement(db, {
        auditId,
        accountId: account.id,
        action: 'STARTER_ACCOUNT_CREATED',
        correlationId,
        preparedAt: account.createdAt,
      });
      statements.push(
        ...(activityContext ? [activityContext] : []),
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
      idempotency,
    }) {
      const guardedStatement = db
        .prepare(
          `UPDATE accounts
           SET status = 'STARTER',
               temporary_credential_json = ?1,
               credential_version = credential_version + 1,
               onboarding_completed_at = NULL, locked_at = NULL,
               last_password_reset_at = ?2, updated_at = ?2
           WHERE id = ?3
             AND credential_version = ?4
             AND updated_at = ?5
             AND NOT (
               role_id = 'ADMINISTRATOR'
               AND status = 'ACTIVE'
               AND locked_at IS NULL
               AND (
                 SELECT COUNT(*)
                 FROM accounts
                 WHERE role_id = 'ADMINISTRATOR'
                   AND status = 'ACTIVE'
                   AND locked_at IS NULL
               ) <= 1
             )`,
        )
        .bind(
          JSON.stringify(temporaryCredential),
          resetAt,
          account.id,
          account.credentialVersion,
          account.updatedAt,
        );
      const dependentStatements = [
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
        idempotencyStatement(db, idempotency),
      ];
      await runAtomicRevisionGuardedBatch(db, {
        guardedStatement,
        dependentStatements,
        conflictCode: 'ACCESS_WRITE_CONFLICT',
        conflictMessage: 'The account changed before this request completed. Refresh and try again.',
      });
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
      idempotency,
    }) {
      const guardedStatement = db
        .prepare(
          `UPDATE accounts
           SET status = ?1, credential_version = credential_version + 1, updated_at = ?2
           WHERE id = ?3
             AND credential_version = ?4
             AND updated_at = ?5
             AND NOT (
               role_id = 'ADMINISTRATOR'
               AND status = 'ACTIVE'
               AND locked_at IS NULL
               AND ?1 <> 'ACTIVE'
               AND (
                 SELECT COUNT(*)
                 FROM accounts
                 WHERE role_id = 'ADMINISTRATOR'
                   AND status = 'ACTIVE'
                   AND locked_at IS NULL
               ) <= 1
             )`,
        )
        .bind(nextStatus, changedAt, account.id, account.credentialVersion, account.updatedAt);
      const activityContext = staffActivityAuditContextStatement(db, {
        auditId,
        accountId: account.id,
        action: auditAction,
        correlationId,
        preparedAt: changedAt,
      });
      const dependentStatements = [
        db.prepare('DELETE FROM sessions WHERE account_id = ?1').bind(account.id),
        ...(activityContext ? [activityContext] : []),
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
        idempotencyStatement(db, idempotency),
      ];
      await runAtomicRevisionGuardedBatch(db, {
        guardedStatement,
        dependentStatements,
        conflictCode: 'ACCESS_WRITE_CONFLICT',
        conflictMessage: 'The account changed before this request completed. Refresh and try again.',
      });
    },

    async recordAccountStatusNoop({ account, status, idempotency }) {
      const guardedStatement = db
        .prepare(
          `UPDATE accounts
           SET status = status
           WHERE id = ?1
             AND credential_version = ?2
             AND updated_at = ?3
             AND status = ?4`,
        )
        .bind(account.id, account.credentialVersion, account.updatedAt, status);
      await runAtomicRevisionGuardedBatch(db, {
        guardedStatement,
        dependentStatements: [idempotencyStatement(db, idempotency)],
        conflictCode: 'ACCESS_WRITE_CONFLICT',
        conflictMessage: 'The account changed before this request completed. Refresh and try again.',
      });
    },

    async revokeSessions({ account, actor, changedAt, reason, correlationId, auditId, idempotency }) {
      const guardedStatement = db
        .prepare(
          `UPDATE accounts
           SET credential_version = credential_version + 1, updated_at = ?1
           WHERE id = ?2 AND credential_version = ?3 AND updated_at = ?4`,
        )
        .bind(changedAt, account.id, account.credentialVersion, account.updatedAt);
      const dependentStatements = [
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
        idempotencyStatement(db, idempotency),
      ];
      await runAtomicRevisionGuardedBatch(db, {
        guardedStatement,
        dependentStatements,
        conflictCode: 'ACCESS_WRITE_CONFLICT',
        conflictMessage: 'The account changed before this request completed. Refresh and try again.',
      });
    },

    async unlockAccount({
      account,
      limiterIdentities = [],
      actor,
      changedAt,
      reason,
      correlationId,
      auditId,
      idempotency,
    }) {
      const identities = (Array.isArray(limiterIdentities) ? limiterIdentities : [])
        .map((value) => String(value ?? '').trim())
        .filter(Boolean)
        .filter((value, index, values) => values.indexOf(value) === index);
      const guardedStatement = db
        .prepare(
          `UPDATE accounts
           SET locked_at = NULL, credential_version = credential_version + 1, updated_at = ?1
           WHERE id = ?2 AND credential_version = ?3 AND updated_at = ?4`,
        )
        .bind(changedAt, account.id, account.credentialVersion, account.updatedAt);
      const dependentStatements = [
        ...identities.map((identity) =>
          db
            .prepare("DELETE FROM auth_rate_limit_events WHERE limiter_key LIKE ?1 ESCAPE '\\'")
            .bind(limiterPattern(identity)),
        ),
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
        idempotencyStatement(db, idempotency),
      ];
      await runAtomicRevisionGuardedBatch(db, {
        guardedStatement,
        dependentStatements,
        conflictCode: 'ACCESS_WRITE_CONFLICT',
        conflictMessage: 'The account changed before this request completed. Refresh and try again.',
      });
    },
  });
}
