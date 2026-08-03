import { describe, expect, it, vi } from 'vitest';
import { createOperationalHealthService } from '../../src/server/operational-health-service.js';

const owner = { id: 'SYN-OWNER', roleId: 'SYSTEM_OWNER' };

function database() {
  const resultFor = (sql) => {
    if (sql.includes('app_metadata')) return { value: '28', updated_at: '2026-07-28T00:00:00.000Z' };
    if (sql.includes('d1_migrations')) {
      return { name: '0028_event_management.sql', applied_at: '2026-07-28T00:00:00.000Z' };
    }
    if (sql.includes('FROM accounts')) return { total: 5, active: 3, starter: 1, inactive: 1 };
    if (sql.includes('FROM sessions')) return { active: 2 };
    if (sql.includes('LOGIN_FAILED')) return { count: 4 };
    if (sql.includes('auth_rate_limit_events')) return { count: 1 };
    if (sql.includes('public_request_rate_limit_events')) return { count: 2 };
    if (sql.includes('public_lending_rate_limit_events')) return { count: 3 };
    if (sql.includes('inventory_ledger')) {
      return { negative: 0, low_stock: 2, classification_pending: 1 };
    }
    if (sql.includes('ROLLBACK_REHEARSAL_COMPLETED')) return { completed_at: null };
    throw new Error(`Unexpected synthetic query: ${sql}`);
  };
  return {
    prepare: vi.fn((sql) => ({
      bind: vi.fn(() => ({ first: vi.fn(async () => resultFor(sql)) })),
      first: vi.fn(async () => resultFor(sql)),
    })),
  };
}

function context() {
  const db = database();
  const evidence = {
    systemStatus: vi.fn(async () => ({
      primaryR2Status: 'AVAILABLE',
      pendingDriveBackups: 1,
      failedDriveBackups: 0,
      filesRequiringRestoration: 0,
      oldestPendingBackupAt: '2026-07-27T00:00:00.000Z',
      lastSuccessfulBackupAt: '2026-07-27T02:00:00.000Z',
      lastReconciliationAt: '2026-07-27T03:00:00.000Z',
      technicalDetails: {
        driveBackupConfigured: false,
        providerIdentifiersProtected: true,
        statusCounts: { PENDING: 1 },
      },
    })),
  };
  const identityRoster = {
    status: vi.fn(async () => ({
      source: { configured: false, privateProviderId: 'must-not-leak' },
      latestRun: { id: 'must-not-leak', applyStatus: 'NOT_RECORDED', appliedAt: null },
      directory: { total: 7, active: 6, rows: ['must-not-leak'] },
    })),
  };
  const env = {
    ENVIRONMENT: 'STAGING',
    APP_VERSION: '0.7.0',
    CANDIDATE_SHA: 'a'.repeat(40),
    RECOVERY_HOSTNAME: 'hau-usc-logistics-staging-recovery.workers.dev',
    DB: db,
    ASSETS: { fetch() {} },
    BRAND_ASSETS: { get() {} },
    EVIDENCE_ASSETS: { put() {} },
    PASSWORD_PEPPER: 'synthetic-pepper-that-is-long-enough',
    TRACKING_LINK_SECRET: 'synthetic-tracking-secret-that-is-long-enough',
    PROTECTED_PROFILE_ENCRYPTION_KEY: 'synthetic-profile-key-that-is-long-enough',
    ROSTER_DATA_ENCRYPTION_KEY: 'synthetic-roster-key-that-is-long-enough',
    GOOGLE_ROSTER_SPREADSHEET_ID: 'REPLACE_WITH_PRIVATE_SPREADSHEET_ID',
    EMAIL_VERIFICATION_PROVIDER: '',
  };
  return {
    service: createOperationalHealthService({
      db,
      env,
      evidence,
      identityRoster,
      clock: { now: () => Date.parse('2026-07-28T12:00:00.000Z') },
    }),
    evidence,
    identityRoster,
  };
}

describe('System Owner operational health', () => {
  it('rejects unauthorized roles before querying protected services', async () => {
    const { service, evidence, identityRoster } = context();
    await expect(service.status({ account: { id: 'SYN-ADMIN', roleId: 'ADMIN' } })).rejects.toMatchObject({
      code: 'SYSTEM_OWNER_REQUIRED',
      status: 403,
    });
    expect(evidence.systemStatus).not.toHaveBeenCalled();
    expect(identityRoster.status).not.toHaveBeenCalled();
  });

  it('returns truthful safe aggregates without protected details', async () => {
    const { service } = context();
    const status = await service.status({ account: owner });
    expect(status).toMatchObject({
      generatedAt: '2026-07-28T12:00:00.000Z',
      overallStatus: 'ATTENTION',
      release: { environment: 'STAGING', releaseVersion: '0.7.0', candidateSha: 'a'.repeat(40) },
      workerApi: { status: 'AVAILABLE', readinessIssueCount: 0 },
      database: {
        status: 'AVAILABLE',
        schemaVersion: '28',
        latestMigration: '0028_event_management.sql',
      },
      bindings: { d1: 'BOUND', brandR2: 'BOUND', evidenceR2: 'BOUND', staticAssets: 'BOUND' },
      authentication: {
        totalAccounts: 5,
        activeAccounts: 3,
        activeSessions: 2,
        failedLoginEvents24h: 4,
        authRateLimitEvents24h: 1,
        publicRequestRateLimitEvents24h: 2,
        publicLendingRateLimitEvents24h: 3,
      },
      emailVerification: { status: 'NOT_CONFIGURED' },
      identityRoster: { status: 'NOT_CONFIGURED', totalIdentities: 7, activeIdentities: 6 },
      storage: { googleDrive: 'NOT_CONFIGURED', brandR2: 'AVAILABLE', evidenceR2: 'AVAILABLE' },
      inventory: { negativeBalanceAlerts: 0, lowStockAlerts: 2, classificationPending: 1 },
      recovery: { rollbackRehearsalStatus: 'NOT_RECORDED', lastRollbackRehearsalAt: null },
      protection: {
        providerIdentifiersProtected: true,
        secretValuesExcluded: true,
        accountIdentifiersExcluded: true,
        rawErrorsExcluded: true,
        objectKeysExcluded: true,
        oauthValuesExcluded: true,
        personalDataExcluded: true,
      },
    });
    expect(JSON.stringify(status)).not.toMatch(/must-not-leak|privateProviderId|spreadsheetId/iu);
  });
});
