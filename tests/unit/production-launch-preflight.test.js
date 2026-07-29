import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  createProductionAuthorizationTemplate,
  PRODUCTION_ACTIONS,
} from '../../scripts/production-authorization.mjs';
import { validateProductionLaunchPreflight } from '../../scripts/production-launch-preflight.mjs';

const sha = 'a'.repeat(40);
const candidate = Object.freeze({
  branch: 'release/test',
  releaseSha: sha,
  distSha256: 'b'.repeat(64),
  workerSourceSha256: 'c'.repeat(64),
  googleMappingSha256: 'd'.repeat(64),
  migrationHashes: { '0001.sql': 'e'.repeat(64) },
});
let directory;
let paths;

const config = (environment, marker) => ({
  name: `worker-${environment.toLowerCase()}`,
  preview_urls: false,
  observability: {
    logs: { enabled: true, head_sampling_rate: environment === 'STAGING' ? 1 : 0.1 },
    traces: { enabled: true, head_sampling_rate: 0.05 },
  },
  d1_databases: [{ binding: 'DB', database_name: `db-${marker}`, database_id: marker.repeat(32) }],
  r2_buckets: [
    { binding: 'BRAND_ASSETS', bucket_name: `brand-${marker}` },
    { binding: 'EVIDENCE_ASSETS', bucket_name: `evidence-${marker}` },
  ],
  vars: { ENVIRONMENT: environment, CANDIDATE_SHA: sha },
});

beforeAll(() => {
  directory = fs.mkdtempSync(path.join(os.tmpdir(), 'hau-production-preflight-'));
  paths = Object.fromEntries(
    ['authorization', 'staging', 'production', 'secrets', 'google', 'backup'].map((name) => {
      const file = path.join(directory, `${name}.json`);
      fs.writeFileSync(file, '{}', { mode: 0o600 });
      return [name, file];
    }),
  );
});

afterAll(() => fs.rmSync(directory, { recursive: true, force: true }));

async function fixture() {
  const authorization = await createProductionAuthorizationTemplate(candidate);
  Object.assign(authorization.authorization, {
    ownerLabel: 'Owner approval',
    operatorLabel: 'Release operator',
    approvalReferenceLabel: 'Approval reference',
    approvedAt: '2026-07-29T10:00:00.000Z',
    actions: Object.fromEntries(PRODUCTION_ACTIONS.map((action) => [action, 'APPROVED'])),
  });
  Object.assign(authorization.target, {
    confirmsProductionResourcesDistinctFromStaging: true,
    privateWranglerConfigPath: paths.production,
    privateGoogleConfigPath: paths.google,
    privateBackupManifestPath: paths.backup,
    cloudflareAccountLabel: 'Production account',
    workerLabel: 'Production Worker',
    d1Label: 'Production D1',
    routeLabel: 'Approved production hostname',
    workbookLabel: 'Approved source',
    driveMappingsLabel: 'Production mappings',
    productionBackupLabel: 'Fresh export and bookmark',
    rollbackTargetLabel: 'Exact rollback target',
  });
  Object.assign(authorization.acceptance, {
    finalStagingEvidenceLabel: 'Final staging evidence',
    authenticationAcceptanceLabel: 'Authentication acceptance',
    accessManagementAcceptanceLabel: 'Access acceptance',
    rollbackRehearsalLabel: 'Rollback rehearsal',
    migrationReconciliationLabel: 'Migration reconciliation',
    securityPrivacyReview: 'PASS',
    migrationRecoveryReview: 'PASS',
    zeroOpenP0P1: true,
    artifactHashesConfirmed: true,
  });
  Object.assign(authorization.launch, {
    approvedSeedAccountsLabel: 'Approved seed labels',
    approvedSmokeMutationsLabel: 'Approved synthetic smoke',
    rollbackTriggersLabel: 'Rollback triggers',
    incidentTriggersLabel: 'Incident triggers',
    evidenceRetentionLabel: 'Retention contract',
  });
  Object.assign(authorization.window, {
    startsAt: '2026-07-29T11:00:00.000Z',
    endsAt: '2026-07-29T13:00:00.000Z',
    stopAuthorityLabel: 'Stop authority',
    incidentContactLabel: 'Incident contact',
  });
  Object.assign(authorization.privacy, {
    privateEvidenceLocationLabel: 'Private evidence',
    redactionRuleLabel: 'Redaction rules',
    privateValuesExcludedFromRepositoryEvidence: true,
    credentialAndIdentifierHandlingConfirmed: true,
  });
  return {
    authorization,
    authorizationPath: paths.authorization,
    currentCandidate: candidate,
    stagingConfig: config('STAGING', '1'),
    productionConfig: config('PRODUCTION', '2'),
    productionSecrets: {
      schemaVersion: 1,
      environment: 'PRODUCTION',
      secrets: Object.fromEntries(
        [
          'PASSWORD_PEPPER',
          'TRACKING_LINK_SECRET',
          'PROTECTED_PROFILE_ENCRYPTION_KEY',
          'ROSTER_DATA_ENCRYPTION_KEY',
        ].map((name, index) => [name, String(index + 1).repeat(48)]),
      ),
    },
    googleConfig: {
      schemaVersion: 1,
      environment: 'PRODUCTION',
      confirmsDistinctFromStaging: true,
      roster: {
        status: 'PREPARED',
        sourceAccess: 'READ_ONLY',
        privateKeySecretName: 'GOOGLE_ROSTER_PRIVATE_KEY',
      },
      emailVerification: { status: 'NOT_CONFIGURED', operational: false },
    },
    backupManifest: {
      capturedAt: '2026-07-29T11:30:00.000Z',
      environment: 'PRODUCTION',
      exportSha256: 'f'.repeat(64),
      integrity: ['ok'],
      foreignKeyViolations: 0,
      bookmarkPresent: true,
      testDataPromotionConfirmed: false,
      syntheticActiveAccounts: 0,
    },
    now: Date.parse('2026-07-29T12:00:00.000Z'),
  };
}

describe('production launch preflight', () => {
  it('authorizes only a fresh exact-candidate separated package', async () => {
    expect(await validateProductionLaunchPreflight(await fixture())).toMatchObject({
      valid: true,
      launchAuthorized: true,
      issues: [],
    });
  });

  it.each([
    [
      'staging D1 binding',
      (value) => (value.productionConfig.d1_databases[0].database_id = '1'.repeat(32)),
      'D1 database IDs',
    ],
    ['preview mode', (value) => (value.productionConfig.preview_urls = true), 'preview_urls'],
    ['missing secret', (value) => delete value.productionSecrets.secrets.PASSWORD_PEPPER, 'PASSWORD_PEPPER'],
    [
      'test data promotion',
      (value) => (value.backupManifest.testDataPromotionConfirmed = true),
      'test-only data',
    ],
    [
      'false email health',
      (value) => (value.googleConfig.emailVerification.operational = true),
      'must not be marked operational',
    ],
    [
      'stale recovery',
      (value) => (value.backupManifest.capturedAt = '2026-07-20T00:00:00.000Z'),
      'less than 24 hours',
    ],
    ['unverified target', (value) => (value.authorization.target.routeLabel = 'TBD'), 'routeLabel'],
  ])('fails closed for %s', async (_label, mutate, expected) => {
    const value = await fixture();
    mutate(value);
    const result = await validateProductionLaunchPreflight(value);
    expect(result.valid).toBe(false);
    expect(result.launchAuthorized).toBe(false);
    expect(result.issues.join('\n')).toContain(expected);
  });
});
