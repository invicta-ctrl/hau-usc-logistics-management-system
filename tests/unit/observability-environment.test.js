import { describe, expect, it, vi } from 'vitest';
import { environmentReadinessIssues, safeReleaseIdentity } from '../../src/server/environment.js';
import { redactLogDetails, structuredLog } from '../../src/server/observability.js';
import { validateEnvironmentSeparation } from '../../scripts/cloudflare-environment-preflight.mjs';

const binding = (environment, name, databaseId, bucketName) => ({
  name,
  preview_urls: false,
  observability: {
    logs: { enabled: true, head_sampling_rate: environment === 'STAGING' ? 1 : 0.1 },
    traces: { enabled: true, head_sampling_rate: 0.05 },
  },
  d1_databases: [{ binding: 'DB', database_name: `${name}-db`, database_id: databaseId }],
  r2_buckets: [{ binding: 'BRAND_ASSETS', bucket_name: bucketName }],
  vars: { ENVIRONMENT: environment, APP_VERSION: '0.7.0', CANDIDATE_SHA: 'a'.repeat(40) },
});

describe('v0.7 environment and observability foundation', () => {
  it('redacts private values from structured logs', () => {
    expect(redactLogDetails({ email: 'person@example.com', note: 'Contact +63 917 123 4567 or person@example.com', nested: { password: 'never' } })).toEqual({
      email: '<redacted>', note: 'Contact <redacted-contact> or <redacted-email>', nested: { password: '<redacted>' },
    });
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const record = structuredLog({ event: 'TEST_EVENT', correlationId: 'REQ_TEST', env: { ENVIRONMENT: 'STAGING', APP_VERSION: '0.7.0', CANDIDATE_SHA: 'a'.repeat(40) }, details: { result: 'SUCCESS', email: 'person@example.com', latencyMs: 12 } });
    expect(record).toMatchObject({ event: 'TEST_EVENT', result: 'SUCCESS', environment: 'STAGING', releaseVersion: '0.7.0', releaseSha: 'aaaaaaaaaaaa', correlationId: 'REQ_TEST', email: '<redacted>', latencyMs: 12 });
    spy.mockRestore();
  });

  it('fails runtime readiness when a protected staging binding or secret is absent', () => {
    const issues = environmentReadinessIssues({ ENVIRONMENT: 'STAGING', APP_VERSION: '0.7.0', CANDIDATE_SHA: 'a'.repeat(40), DB: { prepare() {} }, ASSETS: { fetch() {} } });
    expect(issues).toEqual(expect.arrayContaining(['R2_BRAND_ASSETS_BINDING_MISSING', 'PASSWORD_PEPPER_MISSING', 'TRACKING_LINK_SECRET_MISSING', 'PROTECTED_PROFILE_ENCRYPTION_KEY_MISSING']));
    expect(safeReleaseIdentity({ ENVIRONMENT: 'production', APP_VERSION: '0.7.0', CANDIDATE_SHA: 'b' })).toMatchObject({ environment: 'PRODUCTION', releaseVersion: '0.7.0' });
  });

  it('proves staging and production Worker, D1, and R2 configuration separation', () => {
    const staging = binding('STAGING', 'hau-usc-logistics-staging', '1'.repeat(32), 'staging-assets');
    const production = binding('PRODUCTION', 'hau-usc-logistics-production', '2'.repeat(32), 'production-assets');
    expect(validateEnvironmentSeparation(staging, production, { expectedSha: 'a'.repeat(40) })).toEqual({ valid: true, issues: [] });
    production.d1_databases[0].database_id = staging.d1_databases[0].database_id;
    production.r2_buckets[0].bucket_name = staging.r2_buckets[0].bucket_name;
    const invalid = validateEnvironmentSeparation(staging, production, { expectedSha: 'a'.repeat(40) });
    expect(invalid.valid).toBe(false);
    expect(invalid.issues).toEqual(expect.arrayContaining(['Staging and production D1 database IDs must be distinct', 'Staging and production R2 buckets must be distinct']));
  });
});
