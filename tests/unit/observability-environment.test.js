import { describe, expect, it, vi } from 'vitest';
import { environmentReadinessIssues, safeReleaseIdentity } from '../../src/server/environment.js';
import { redactLogDetails, structuredLog } from '../../src/server/observability.js';
import {
  parseJsonConfig,
  validateEnvironmentSeparation,
} from '../../scripts/cloudflare-environment-preflight.mjs';
import { createConfigPair, decodeJsonBuffer } from '../../scripts/create-private-cloudflare-configs.mjs';
import { createSecretPackage } from '../../scripts/cloudflare-secret-package.mjs';
import { buildPrivateStagingIdentityPackage } from '../../scripts/configure-staging-identity-fixture.mjs';

const binding = (environment, name, databaseId, bucketName) => ({
  name,
  preview_urls: false,
  assets: { run_worker_first: ['/api/*', '/brand/*', '/media/*'] },
  observability: {
    logs: { enabled: true, head_sampling_rate: environment === 'STAGING' ? 1 : 0.1 },
    traces: { enabled: true, head_sampling_rate: 0.05 },
  },
  d1_databases: [{ binding: 'DB', database_name: `${name}-db`, database_id: databaseId }],
  r2_buckets: [
    { binding: 'BRAND_ASSETS', bucket_name: bucketName },
    { binding: 'EVIDENCE_ASSETS', bucket_name: `${bucketName}-evidence` },
  ],
  vars: {
    ENVIRONMENT: environment,
    APP_VERSION: '0.7.0',
    CANDIDATE_SHA: 'a'.repeat(40),
    RECOVERY_HOSTNAME: `${environment.toLowerCase()}-recovery.workers.dev`,
  },
});

describe('v0.7 environment and observability foundation', () => {
  it('redacts private values from structured logs', () => {
    expect(
      redactLogDetails({
        email: 'person@example.com',
        note: 'Contact +63 917 123 4567 or person@example.com',
        objectKey: 'evidence/private/key',
        driveFileId: 'private-provider-id',
        oauthClientId: 'private-oauth-id',
        nested: { password: 'never' },
      }),
    ).toEqual({
      email: '<redacted>',
      note: 'Contact <redacted-contact> or <redacted-email>',
      objectKey: '<redacted>',
      driveFileId: '<redacted>',
      oauthClientId: '<redacted>',
      nested: { password: '<redacted>' },
    });
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const record = structuredLog({
      event: 'TEST_EVENT',
      correlationId: 'REQ_TEST',
      env: { ENVIRONMENT: 'STAGING', APP_VERSION: '0.7.0', CANDIDATE_SHA: 'a'.repeat(40) },
      details: { result: 'SUCCESS', email: 'person@example.com', latencyMs: 12 },
    });
    expect(record).toMatchObject({
      event: 'TEST_EVENT',
      result: 'SUCCESS',
      environment: 'STAGING',
      releaseVersion: '0.7.0',
      releaseSha: 'aaaaaaaaaaaa',
      correlationId: 'REQ_TEST',
      email: '<redacted>',
      latencyMs: 12,
    });
    spy.mockRestore();
  });

  it('fails runtime readiness when a protected staging binding or secret is absent', () => {
    const issues = environmentReadinessIssues({
      ENVIRONMENT: 'STAGING',
      APP_VERSION: '0.7.0',
      CANDIDATE_SHA: 'a'.repeat(40),
      RECOVERY_HOSTNAME: 'staging-recovery.workers.dev',
      DB: { prepare() {} },
      ASSETS: { fetch() {} },
    });
    expect(issues).toEqual(
      expect.arrayContaining([
        'R2_BRAND_ASSETS_BINDING_MISSING',
        'R2_EVIDENCE_ASSETS_BINDING_MISSING',
        'PASSWORD_PEPPER_MISSING',
        'TRACKING_LINK_SECRET_MISSING',
        'PROTECTED_PROFILE_ENCRYPTION_KEY_MISSING',
        'ROSTER_DATA_ENCRYPTION_KEY_MISSING',
        'ACCOUNT_APPLICATION_IDENTITY_CLASSES_MISSING',
        'ACCOUNT_APPLICATION_STAGING_IDENTITY_FIXTURE_MISSING',
        'ACCOUNT_APPLICATION_EMAIL_PROVIDER_NOT_SELECTED',
      ]),
    );
    expect(
      safeReleaseIdentity({ ENVIRONMENT: 'production', APP_VERSION: '0.7.0', CANDIDATE_SHA: 'b' }),
    ).toMatchObject({ environment: 'PRODUCTION', releaseVersion: '0.7.0' });
  });

  it('fails closed for missing or invalid runtime environment and recovery hostname', () => {
    expect(safeReleaseIdentity({}).environment).toBe('UNKNOWN');
    expect(environmentReadinessIssues({})).toEqual(
      expect.arrayContaining(['ENVIRONMENT_INVALID', 'RECOVERY_HOSTNAME_INVALID']),
    );
    expect(
      environmentReadinessIssues({
        ENVIRONMENT: 'UNRECOGNIZED',
        RECOVERY_HOSTNAME: 'wrong-recovery.example.test',
      }),
    ).toEqual(expect.arrayContaining(['ENVIRONMENT_INVALID', 'RECOVERY_HOSTNAME_INVALID']));
  });

  it('proves staging and production Worker, D1, and R2 configuration separation', () => {
    const staging = binding('STAGING', 'hau-usc-logistics-staging', '1'.repeat(32), 'staging-assets');
    const production = binding(
      'PRODUCTION',
      'hau-usc-logistics-production',
      '2'.repeat(32),
      'production-assets',
    );
    expect(validateEnvironmentSeparation(staging, production, { expectedSha: 'a'.repeat(40) })).toEqual({
      valid: true,
      issues: [],
    });
    production.d1_databases[0].database_id = staging.d1_databases[0].database_id;
    production.r2_buckets[0].bucket_name = staging.r2_buckets[0].bucket_name;
    production.r2_buckets[1].bucket_name = staging.r2_buckets[1].bucket_name;
    const invalid = validateEnvironmentSeparation(staging, production, { expectedSha: 'a'.repeat(40) });
    expect(invalid.valid).toBe(false);
    expect(invalid.issues).toEqual(
      expect.arrayContaining([
        'Staging and production D1 database IDs must be distinct',
        'Staging and production brand R2 buckets must be distinct',
        'Staging and production evidence R2 buckets must be distinct',
      ]),
    );
  });

  it('fails closed for preview mode, plaintext secrets, and candidate drift', () => {
    const staging = binding('STAGING', 'hau-usc-logistics-staging', '1'.repeat(32), 'staging-assets');
    const production = binding(
      'PRODUCTION',
      'hau-usc-logistics-production',
      '2'.repeat(32),
      'production-assets',
    );
    production.preview_urls = true;
    production.vars.PASSWORD_PEPPER = 'must-not-be-plaintext';
    production.vars.CANDIDATE_SHA = 'b'.repeat(40);
    production.vars.RECOVERY_HOSTNAME = 'wrong-recovery.example.test';
    const invalid = validateEnvironmentSeparation(staging, production, { expectedSha: 'a'.repeat(40) });
    expect(invalid.valid).toBe(false);
    expect(invalid.issues).toEqual(
      expect.arrayContaining([
        'PRODUCTION: preview_urls must not be enabled',
        'PRODUCTION: PASSWORD_PEPPER must be a protected secret, not a plaintext var',
        'PRODUCTION: vars.RECOVERY_HOSTNAME must be an exact .workers.dev hostname',
        'Staging and production configs must bind the same frozen candidate SHA',
      ]),
    );
  });

  it('fails closed when a private config would route governed assets through the SPA', () => {
    const staging = binding('STAGING', 'hau-usc-logistics-staging', '1'.repeat(32), 'staging-assets');
    const production = binding(
      'PRODUCTION',
      'hau-usc-logistics-production',
      '2'.repeat(32),
      'production-assets',
    );
    staging.assets.run_worker_first = ['/api/*'];

    const invalid = validateEnvironmentSeparation(staging, production, {
      expectedSha: 'a'.repeat(40),
    });

    expect(invalid.valid).toBe(false);
    expect(invalid.issues).toEqual(
      expect.arrayContaining([
        'STAGING: assets.run_worker_first must include /brand/*',
        'STAGING: assets.run_worker_first must include /media/*',
      ]),
    );
  });

  it('preserves route glob strings while parsing private JSONC comments', () => {
    const config = parseJsonConfig(
      `{
        // Worker-first route globs are string values, not block comments.
        "assets": { "run_worker_first": ["/api/*", "/brand/*", "/media/*"] },
        "vars": { "ENVIRONMENT": "STAGING", "CANDIDATE_SHA": "${'a'.repeat(40)}" },
        /* Provider bindings remain available after comment stripping. */
        "r2_buckets": [
          { "binding": "BRAND_ASSETS", "bucket_name": "staging-assets" },
          { "binding": "EVIDENCE_ASSETS", "bucket_name": "staging-evidence" }
        ]
      }`,
    );

    expect(config.assets.run_worker_first).toEqual(['/api/*', '/brand/*', '/media/*']);
    expect(config.vars.ENVIRONMENT).toBe('STAGING');
    expect(config.r2_buckets).toHaveLength(2);
  });

  it('creates distinct private configuration objects without exposing provider values to Git', () => {
    const pair = createConfigPair(
      {
        main: 'C:/repo/src/worker/index.js',
        compatibility_date: '2026-07-22',
        assets: { directory: 'C:/repo/dist', binding: 'ASSETS' },
      },
      [
        { name: 'hau-usc-logistics-staging-sandbox-v0721', uuid: 'staging-private-id' },
        { name: 'hau-usc-logistics-production', uuid: 'production-private-id' },
      ],
      'a'.repeat(40),
    );
    expect(pair.staging).toMatchObject({
      name: 'hau-usc-logistics-staging',
      vars: { ENVIRONMENT: 'STAGING', APP_VERSION: '0.8.1' },
      r2_buckets: [
        {
          binding: 'BRAND_ASSETS',
          bucket_name: 'hau-usc-logistics-staging-sandbox-v0721-assets',
        },
        {
          binding: 'EVIDENCE_ASSETS',
          bucket_name: 'hau-usc-logistics-staging-sandbox-v0721-evidence',
        },
      ],
    });
    expect(pair.staging.assets.not_found_handling).toBe('single-page-application');
    expect(pair.production.assets.not_found_handling).toBe('single-page-application');
    expect(pair.staging.assets.run_worker_first).toEqual(['/api/*', '/brand/*', '/media/*']);
    expect(pair.production.assets.run_worker_first).toEqual(['/api/*', '/brand/*', '/media/*']);
    expect(pair.production).toMatchObject({
      name: 'hau-usc-logistics-production',
      vars: { ENVIRONMENT: 'PRODUCTION', APP_VERSION: '0.8.1' },
      r2_buckets: [
        { binding: 'BRAND_ASSETS', bucket_name: 'hau-usc-logistics-production-assets' },
        { binding: 'EVIDENCE_ASSETS', bucket_name: 'hau-usc-logistics-production-evidence' },
      ],
    });
    expect(pair.staging.vars.RECOVERY_HOSTNAME).toBe('<REPLACE_PRIVATELY_RECOVERY_HOSTNAME>');
    expect(pair.staging.vars.ACCOUNT_APPLICATION_EMAIL_RECIPIENT_ALLOWLIST_JSON).toBeUndefined();
    expect(pair.staging.vars.ACCOUNT_APPLICATION_EMAIL_RECIPIENT_ALLOWLIST_COUNT).toBe(0);
    expect(pair.staging.vars.GOOGLE_ROSTER_SPREADSHEET_ID).toBeUndefined();
    expect(pair.staging.vars.GOOGLE_ROSTER_SERVICE_ACCOUNT_EMAIL).toBeUndefined();
    expect(pair.production.vars.RECOVERY_HOSTNAME).toBe('<REPLACE_PRIVATELY_RECOVERY_HOSTNAME>');
    expect(pair.staging.d1_databases[0].database_id).not.toBe(pair.production.d1_databases[0].database_id);
  });

  it('decodes UTF-8 and PowerShell UTF-16 provider inventory JSON', () => {
    const value = JSON.stringify([{ name: 'safe-resource-label' }]);
    expect(JSON.parse(decodeJsonBuffer(Buffer.from(value, 'utf8')))).toEqual([
      { name: 'safe-resource-label' },
    ]);
    expect(
      JSON.parse(decodeJsonBuffer(Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(value, 'utf16le')]))),
    ).toEqual([{ name: 'safe-resource-label' }]);
  });

  it('creates complete distinct protected secret packages without repository values', () => {
    let marker = 0;
    const fakeRandom = () => Buffer.alloc(48, (marker += 1));
    const staging = createSecretPackage('staging', fakeRandom);
    const production = createSecretPackage('production', fakeRandom);
    expect(staging.environment).toBe('STAGING');
    expect(production.environment).toBe('PRODUCTION');
    expect(Object.keys(staging.secrets).sort()).toEqual([
      'PASSWORD_PEPPER',
      'PROTECTED_PROFILE_ENCRYPTION_KEY',
      'ROSTER_DATA_ENCRYPTION_KEY',
      'TRACKING_LINK_SECRET',
    ]);
    expect(Object.values(staging.secrets).every((value) => value.length >= 64)).toBe(true);
    expect(staging.secrets.PASSWORD_PEPPER).not.toBe(production.secrets.PASSWORD_PEPPER);
  });

  it('builds a one-recipient private staging identity package without changing production', () => {
    const source = createSecretPackage('staging', () => Buffer.alloc(48, 7));
    const configured = buildPrivateStagingIdentityPackage(
      {
        vars: {
          ENVIRONMENT: 'STAGING',
          ACCOUNT_APPLICATION_EMAIL_FROM: 'Staging Sender <sender@example.test>',
          ACCOUNT_APPLICATION_EMAIL_RECIPIENT_ALLOWLIST_JSON: '["owner.fixture@example.test"]',
        },
      },
      source,
    );
    expect(configured.secrets.ACCOUNT_APPLICATION_STAGING_IDENTITY_FIXTURE_JSON).toBeTypeOf('string');
    expect(JSON.parse(configured.secrets.ACCOUNT_APPLICATION_STAGING_IDENTITY_FIXTURE_JSON)).toEqual([
      expect.objectContaining({
        institutionalEmail: 'owner.fixture@example.test',
        verificationResult: 'VERIFIED',
        active: true,
      }),
    ]);
    expect(source.secrets).not.toHaveProperty('ACCOUNT_APPLICATION_STAGING_IDENTITY_FIXTURE_JSON');
    expect(() =>
      buildPrivateStagingIdentityPackage(
        {
          vars: {
            ENVIRONMENT: 'PRODUCTION',
            ACCOUNT_APPLICATION_EMAIL_RECIPIENT_ALLOWLIST_JSON: '["owner.fixture@example.test"]',
          },
        },
        { ...source, environment: 'PRODUCTION' },
      ),
    ).toThrow(/staging/iu);
  });
});
