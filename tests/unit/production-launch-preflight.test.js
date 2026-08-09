import { createHash } from 'node:crypto';
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
const sha256 = (value) => createHash('sha256').update(value).digest('hex');
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
  assets: { run_worker_first: ['/api/*', '/brand/*', '/media/*'] },
  observability: {
    logs: { enabled: true, head_sampling_rate: environment === 'STAGING' ? 1 : 0.1 },
    traces: { enabled: true, head_sampling_rate: 0.05 },
  },
  d1_databases: [{ binding: 'DB', database_name: `db-${marker}`, database_id: marker.repeat(32) }],
  r2_buckets: [
    { binding: 'BRAND_ASSETS', bucket_name: `brand-${marker}` },
    { binding: 'EVIDENCE_ASSETS', bucket_name: `evidence-${marker}` },
  ],
  vars: {
    ENVIRONMENT: environment,
    CANDIDATE_SHA: sha,
    RECOVERY_HOSTNAME: `hau-usc-logistics-${environment.toLowerCase()}-recovery.workers.dev`,
    GOOGLE_ROSTER_SPREADSHEET_ID: 'approved-private-roster-source',
    GOOGLE_ROSTER_RANGE: 'Official!A1:AA128',
    GOOGLE_ROSTER_SERVICE_ACCOUNT_EMAIL: `reader-${environment.toLowerCase()}@example.invalid`,
  },
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
  const stagingConfig = config('STAGING', '1');
  const productionConfig = config('PRODUCTION', '2');
  const stagingConfigRaw = `${JSON.stringify(stagingConfig, null, 2)}\n`;
  const productionConfigRaw = `${JSON.stringify(productionConfig, null, 2)}\n`;
  return {
    authorization,
    authorizationPath: paths.authorization,
    currentCandidate: candidate,
    stagingConfig,
    stagingConfigRaw,
    productionConfig,
    productionConfigRaw,
    productionSecrets: {
      schemaVersion: 1,
      environment: 'PRODUCTION',
      secrets: Object.fromEntries(
        [
          'PASSWORD_PEPPER',
          'TRACKING_LINK_SECRET',
          'PROTECTED_PROFILE_ENCRYPTION_KEY',
          'ROSTER_DATA_ENCRYPTION_KEY',
          'GOOGLE_ROSTER_PRIVATE_KEY',
          'GOOGLE_EVIDENCE_OAUTH_CLIENT_SECRET',
          'GOOGLE_EVIDENCE_OAUTH_REFRESH_TOKEN',
          'GOOGLE_EVIDENCE_OAUTH_CLIENT_ID',
          'GOOGLE_DRIVE_ROOT_FOLDER_ID',
          'GOOGLE_DRIVE_RECEIPTS_FOLDER_ID',
          'GOOGLE_DRIVE_CANVASS_FOLDER_ID',
          'GOOGLE_DRIVE_DELIVERABLE_FOLDER_ID',
          'GOOGLE_EVIDENCE_RELEASE_FOLDER_ID',
          'GOOGLE_DRIVE_LENDING_FOLDER_ID',
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
        spreadsheetId: 'approved-private-roster-source',
        range: 'Official!A1:AA128',
        serviceAccountEmail: 'reader-production@example.invalid',
        privateKeySecretName: 'GOOGLE_ROSTER_PRIVATE_KEY',
      },
      evidenceDrive: {
        status: 'PREPARED',
        operational: false,
        credentialMode: 'OAUTH_REFRESH_TOKEN',
        folderMapLabel: 'Dedicated production evidence folder map',
      },
      emailVerification: { status: 'NOT_CONFIGURED', operational: false },
    },
    backupManifest: {
      capturedAt: '2026-07-29T11:30:00.000Z',
      environment: 'PRODUCTION',
      candidateSha: candidate.releaseSha,
      candidateBranch: candidate.branch,
      exportSha256: 'f'.repeat(64),
      integrity: ['ok'],
      foreignKeyViolations: 0,
      bookmarkPresent: true,
      testDataPromotionConfirmed: false,
      syntheticActiveAccounts: 0,
      fingerprints: {
        stagingConfigSha256: sha256(stagingConfigRaw),
        productionConfigSha256: sha256(productionConfigRaw),
      },
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

  it('allows explicitly denied non-applicable mutation actions while requiring deploy and recovery', async () => {
    const value = await fixture();
    for (const action of [
      'productionD1Migration',
      'productionSheetCutover',
      'productionSeedAccounts',
      'productionSmokeMutations',
    ]) {
      value.authorization.authorization.actions[action] = 'DENIED';
    }
    expect(await validateProductionLaunchPreflight(value)).toMatchObject({
      valid: true,
      launchAuthorized: true,
      issues: [],
    });

    value.authorization.authorization.actions.productionWorkerDeploy = 'DENIED';
    expect(await validateProductionLaunchPreflight(value)).toMatchObject({
      valid: true,
      launchAuthorized: false,
    });
  });

  it.each([
    [
      'staging D1 binding',
      (value) => (value.productionConfig.d1_databases[0].database_id = '1'.repeat(32)),
      'D1 database IDs',
    ],
    ['preview mode', (value) => (value.productionConfig.preview_urls = true), 'preview_urls'],
    [
      'placeholder roster binding',
      (value) => (value.productionConfig.vars.GOOGLE_ROSTER_SPREADSHEET_ID = '<REPLACE_PRIVATELY>'),
      'production roster spreadsheetId',
    ],
    [
      'unprepared Drive sidecar',
      (value) => (value.googleConfig.evidenceDrive.status = 'NOT_CONFIGURED'),
      'evidence Drive status',
    ],
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
    [
      'wrong recovery candidate',
      (value) => (value.backupManifest.candidateSha = 'b'.repeat(40)),
      'candidate SHA',
    ],
    [
      'wrong production config fingerprint',
      (value) => (value.backupManifest.fingerprints.productionConfigSha256 = '0'.repeat(64)),
      'production config fingerprint',
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
