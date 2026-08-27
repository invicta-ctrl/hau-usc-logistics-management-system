import { describe, expect, it } from 'vitest';
import { validatePlaygroundConfig } from '../../scripts/playground/playground-config.mjs';

const sha = 'a'.repeat(40);
const tree = 'b'.repeat(40);
const artifact = 'c'.repeat(64);
const manifest = {
  status: 'READY',
  playgroundHostname: 'playground.example.workers.dev',
  playgroundRequiredVars: {
    ACCOUNT_APPLICATION_IDENTITY_CLASSES_JSON: '[{"id":"TEST","domains":["example.test"]}]',
  },
  d1: { databaseId: 'playground-d1-id' },
  rollback: {
    stagingVersionId: 'staging-version-id',
    stagingD1Id: 'playground-d1-id',
    stagingBrandBucket: 'playground-working-brand',
    stagingEvidenceBucket: 'playground-working-evidence',
  },
  resources: {
    names: {
      d1Working: 'playground-d1',
      r2BaselineBrand: 'playground-baseline-brand',
      r2BaselineEvidence: 'playground-baseline-evidence',
      r2WorkingBrand: 'playground-working-brand',
      r2WorkingEvidence: 'playground-working-evidence',
    },
  },
};

function config() {
  return {
    workers_dev: true,
    preview_urls: false,
    d1_databases: [{ binding: 'DB', database_name: 'playground-d1', database_id: 'playground-d1-id' }],
    r2_buckets: [
      { binding: 'BRAND_ASSETS', bucket_name: 'playground-working-brand' },
      { binding: 'EVIDENCE_ASSETS', bucket_name: 'playground-working-evidence' },
    ],
    vars: {
      ENVIRONMENT: 'STAGING',
      PLAYGROUND_MODE: true,
      PLAYGROUND_LABEL: 'ISOLATED_STAGING_PLAYGROUND',
      ACCOUNT_APPLICATION_EMAIL_PROVIDER: 'disabled',
      RECOVERY_HOSTNAME: 'playground.example.workers.dev',
      ACCOUNT_APPLICATION_IDENTITY_CLASSES_JSON: '[{"id":"TEST","domains":["example.test"]}]',
      CANDIDATE_BRANCH: 'release/v0.8.1-playground',
      CANDIDATE_SHA: sha,
      CANDIDATE_TREE_SHA: tree,
      APPLICATION_ARTIFACT_HASH: artifact,
    },
  };
}

function validate(candidate = config()) {
  return validatePlaygroundConfig({
    config: candidate,
    manifest,
    productionBindings: {
      d1Id: 'production-d1-id',
      brandBucket: 'production-brand',
      evidenceBucket: 'production-evidence',
    },
    rollbackBindings: {
      versionId: 'staging-version-id',
      d1Id: 'playground-d1-id',
      brandBucket: 'playground-working-brand',
      evidenceBucket: 'playground-working-evidence',
    },
    expectedSha: sha,
    expectedTree: tree,
    expectedBranch: 'release/v0.8.1-playground',
    expectedArtifactHash: artifact,
  });
}

describe('playground deployment configuration guards', () => {
  it('accepts only the fixed isolated working resources', () => {
    expect(validate()).toEqual({ valid: true, issues: [] });
  });

  it('denies production D1 and R2 targets', () => {
    const candidate = config();
    candidate.d1_databases[0].database_id = 'production-d1-id';
    candidate.r2_buckets[0].bucket_name = 'production-brand';
    const result = validate(candidate);
    expect(result.valid).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        'DB must target the fixed playground working D1',
        'BRAND_ASSETS must target the fixed playground working bucket',
        'Playground D1 cannot equal production D1',
        'Playground brand R2 cannot equal production R2',
      ]),
    );
  });

  it('denies a missing or Production-crossover rollback binding tuple', () => {
    const result = validatePlaygroundConfig({
      config: config(),
      manifest,
      productionBindings: {
        d1Id: 'production-d1-id',
        brandBucket: 'production-brand',
        evidenceBucket: 'production-evidence',
      },
      rollbackBindings: {
        versionId: 'different-staging-version',
        d1Id: 'production-d1-id',
        brandBucket: 'production-brand',
        evidenceBucket: 'production-evidence',
      },
      expectedSha: sha,
      expectedTree: tree,
      expectedBranch: 'release/v0.8.1-playground',
      expectedArtifactHash: artifact,
    });
    expect(result.valid).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        'Rollback staging version must match private playground manifest',
        'Rollback staging D1 must match private playground manifest',
        'Rollback staging brand R2 must match private playground manifest',
        'Rollback staging evidence R2 must match private playground manifest',
        'Rollback staging D1 cannot equal production D1',
        'Rollback staging brand R2 cannot equal production R2',
        'Rollback staging evidence R2 cannot equal production R2',
      ]),
    );
  });

  it('denies baseline write bindings, scheduled jobs, provider sends, and a permanent staging branch', () => {
    const candidate = config();
    candidate.r2_buckets[0].bucket_name = 'playground-baseline-brand';
    candidate.triggers = { crons: ['*/5 * * * *'] };
    candidate.vars.ACCOUNT_APPLICATION_EMAIL_PROVIDER = 'resend';
    const result = validatePlaygroundConfig({
      config: candidate,
      manifest,
      productionBindings: {},
      rollbackBindings: {
        versionId: 'staging-version-id',
        d1Id: 'playground-d1-id',
        brandBucket: 'playground-working-brand',
        evidenceBucket: 'playground-working-evidence',
      },
      expectedSha: sha,
      expectedTree: tree,
      expectedBranch: 'staging',
      expectedArtifactHash: artifact,
    });
    expect(result.valid).toBe(false);
    expect(result.issues).toEqual(
      expect.arrayContaining([
        'Candidate branch is not an allowed temporary branch',
        'Sealed baseline R2 resources must not be bound to ordinary playground runtime',
        'Playground scheduled triggers must remain disabled',
        'Playground provider/email delivery must be disabled',
      ]),
    );
  });
});
