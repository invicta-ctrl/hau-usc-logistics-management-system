import { ROLES } from '../domain/constants.js';
import { ApiError } from './d1/operational-service.js';
import { environmentReadinessIssues, safeReleaseIdentity } from './environment.js';

const PLACEHOLDER = /(?:REPLACE|TBD|TODO|UNKNOWN|<[^>]+>)/iu;

function requireSystemOwner(account) {
  if (String(account?.roleId ?? '').toUpperCase() !== ROLES.SYSTEM_OWNER) {
    throw new ApiError('SYSTEM_OWNER_REQUIRED', 'Only the System Owner may inspect operational health.', {
      status: 403,
    });
  }
}

const configured = (value) => Boolean(String(value ?? '').trim()) && !PLACEHOLDER.test(String(value));

async function first(db, sql, values = []) {
  let statement = db.prepare(sql);
  if (values.length) statement = statement.bind(...values);
  return (await statement.first()) ?? {};
}

export function createOperationalHealthService({ db, env, evidence, identityRoster, clock = Date } = {}) {
  if (!db) throw new Error('D1 database binding is required.');
  if (!evidence) throw new Error('Evidence service is required.');
  if (!identityRoster) throw new Error('Identity roster service is required.');

  return Object.freeze({
    async status({ account, evidenceId = '' } = {}) {
      requireSystemOwner(account);
      const now = new Date(clock.now()).toISOString();
      const nowMs = Date.parse(now);
      const since = new Date(nowMs - 24 * 60 * 60 * 1000).toISOString();
      const sinceMs = nowMs - 24 * 60 * 60 * 1000;
      const [
        evidenceStatus,
        roster,
        schema,
        migration,
        authCounts,
        sessionCounts,
        failedLoginCounts,
        rateLimitCounts,
        publicRequestRateLimits,
        publicLendingRateLimits,
        inventoryCounts,
        rollback,
      ] = await Promise.all([
        evidence.systemStatus({ account, evidenceId }),
        identityRoster.status({ actor: account }),
        first(db, "SELECT value, updated_at FROM app_metadata WHERE key = 'operational_schema_version'"),
        first(db, 'SELECT name, applied_at FROM d1_migrations ORDER BY id DESC LIMIT 1'),
        first(
          db,
          `SELECT COUNT(*) AS total,
             SUM(CASE WHEN status = 'ACTIVE' THEN 1 ELSE 0 END) AS active,
             SUM(CASE WHEN status = 'STARTER' THEN 1 ELSE 0 END) AS starter,
             SUM(CASE WHEN status IN ('DISABLED', 'REVOKED') THEN 1 ELSE 0 END) AS inactive
           FROM accounts`,
        ),
        first(db, 'SELECT COUNT(*) AS active FROM sessions WHERE expires_at > ?1', [now]),
        first(
          db,
          `SELECT COUNT(*) AS count FROM audit_log
           WHERE action IN ('LOGIN_FAILED', 'LOGIN_BLOCKED', 'STARTER_LOGIN_BLOCKED')
             AND created_at >= ?1`,
          [since],
        ),
        first(db, 'SELECT COUNT(*) AS count FROM auth_rate_limit_events WHERE attempted_at >= ?1', [sinceMs]),
        first(db, 'SELECT COUNT(*) AS count FROM public_request_rate_limit_events WHERE attempted_at >= ?1', [
          sinceMs,
        ]),
        first(db, 'SELECT COUNT(*) AS count FROM public_lending_rate_limit_events WHERE attempted_at >= ?1', [
          sinceMs,
        ]),
        first(
          db,
          `WITH balances AS (
             SELECT item_id, COALESCE(SUM(signed_quantity), 0) AS balance
             FROM inventory_ledger WHERE status = 'POSTED' GROUP BY item_id
           )
           SELECT
             SUM(CASE WHEN COALESCE(balance, 0) < 0 THEN 1 ELSE 0 END) AS negative,
             SUM(CASE WHEN item.status = 'ACTIVE' AND COALESCE(balance, 0) <= item.reorder_threshold THEN 1 ELSE 0 END) AS low_stock,
             SUM(CASE WHEN item.status = 'ACTIVE' AND item.classification_status = 'NEEDS_CLASSIFICATION' THEN 1 ELSE 0 END) AS classification_pending
           FROM inventory_items item LEFT JOIN balances ON balances.item_id = item.id`,
        ),
        first(
          db,
          "SELECT MAX(created_at) AS completed_at FROM audit_log WHERE action = 'ROLLBACK_REHEARSAL_COMPLETED'",
        ),
      ]);

      const release = safeReleaseIdentity(env);
      const readinessIssues = environmentReadinessIssues(env);
      const technical = evidenceStatus.technicalDetails ?? {};
      const rosterSourceConfigured = roster.source?.configured === true;
      const driveConfigured = technical.driveBackupConfigured === true;
      const negativeInventory = Number(inventoryCounts.negative ?? 0);
      const evidenceExceptions =
        Number(evidenceStatus.pendingDriveBackups ?? 0) +
        Number(evidenceStatus.failedDriveBackups ?? 0) +
        Number(evidenceStatus.filesRequiringRestoration ?? 0);
      const attention =
        readinessIssues.length > 0 ||
        !rosterSourceConfigured ||
        !driveConfigured ||
        negativeInventory > 0 ||
        evidenceExceptions > 0 ||
        !rollback.completed_at;

      return {
        ...evidenceStatus,
        generatedAt: now,
        overallStatus: attention ? 'ATTENTION' : 'HEALTHY',
        release,
        workerApi: {
          status: readinessIssues.length ? 'DEGRADED' : 'AVAILABLE',
          readinessIssueCount: readinessIssues.length,
        },
        database: {
          status: schema.value ? 'AVAILABLE' : 'UNAVAILABLE',
          schemaVersion: schema.value ?? 'Not reported',
          schemaUpdatedAt: schema.updated_at ?? null,
          latestMigration: migration.name ?? 'Not reported',
          latestMigrationAt: migration.applied_at ?? null,
        },
        bindings: {
          currentEnvironment: release.environment,
          d1: env?.DB?.prepare ? 'BOUND' : 'MISSING',
          brandR2: env?.BRAND_ASSETS?.get ? 'BOUND' : 'MISSING',
          evidenceR2: env?.EVIDENCE_ASSETS?.put ? 'BOUND' : 'MISSING',
          staticAssets: env?.ASSETS?.fetch ? 'BOUND' : 'MISSING',
          otherEnvironment:
            release.environment === 'PRODUCTION'
              ? 'STAGING_NOT_LOADED_IN_PRODUCTION_WORKER'
              : 'PRODUCTION_NOT_LOADED_IN_CURRENT_WORKER',
        },
        authentication: {
          status: Number(authCounts.total ?? 0) > 0 ? 'AVAILABLE' : 'NO_ACCOUNTS',
          totalAccounts: Number(authCounts.total ?? 0),
          activeAccounts: Number(authCounts.active ?? 0),
          starterAccounts: Number(authCounts.starter ?? 0),
          inactiveAccounts: Number(authCounts.inactive ?? 0),
          activeSessions: Number(sessionCounts.active ?? 0),
          failedLoginEvents24h: Number(failedLoginCounts.count ?? 0),
          authRateLimitEvents24h: Number(rateLimitCounts.count ?? 0),
          publicRequestRateLimitEvents24h: Number(publicRequestRateLimits.count ?? 0),
          publicLendingRateLimitEvents24h: Number(publicLendingRateLimits.count ?? 0),
        },
        emailVerification: {
          status: configured(env?.EMAIL_VERIFICATION_PROVIDER) ? 'CONFIGURED' : 'NOT_CONFIGURED',
          mode: 'VERIFIED_EMAIL_IDENTITY_ONLY',
          note: configured(env?.EMAIL_VERIFICATION_PROVIDER)
            ? 'External delivery provider configuration is present; identifiers are protected.'
            : 'No external email delivery provider is configured in this release.',
        },
        identityRoster: {
          status: rosterSourceConfigured ? 'CONFIGURED' : 'NOT_CONFIGURED',
          latestApplyStatus: roster.latestRun?.applyStatus ?? 'NOT_RECORDED',
          latestAppliedAt: roster.latestRun?.appliedAt ?? null,
          totalIdentities: Number(roster.directory?.total ?? 0),
          activeIdentities: Number(roster.directory?.active ?? 0),
        },
        storage: {
          googleDrive: driveConfigured ? 'CONFIGURED' : 'NOT_CONFIGURED',
          brandR2: env?.BRAND_ASSETS?.get ? 'AVAILABLE' : 'UNAVAILABLE',
          evidenceR2:
            String(evidenceStatus.primaryR2Status).toUpperCase() === 'AVAILABLE'
              ? 'AVAILABLE'
              : 'UNAVAILABLE',
        },
        inventory: {
          negativeBalanceAlerts: negativeInventory,
          lowStockAlerts: Number(inventoryCounts.low_stock ?? 0),
          classificationPending: Number(inventoryCounts.classification_pending ?? 0),
        },
        recovery: {
          lastSuccessfulBackupAt: evidenceStatus.lastSuccessfulBackupAt ?? null,
          lastSuccessfulReconciliationAt: evidenceStatus.lastReconciliationAt ?? null,
          lastRollbackRehearsalAt: rollback.completed_at ?? null,
          rollbackRehearsalStatus: rollback.completed_at ? 'RECORDED' : 'NOT_RECORDED',
        },
        protection: {
          providerIdentifiersProtected: true,
          secretValuesExcluded: true,
          accountIdentifiersExcluded: true,
          rawErrorsExcluded: true,
          objectKeysExcluded: true,
          oauthValuesExcluded: true,
          personalDataExcluded: true,
        },
      };
    },
  });
}
