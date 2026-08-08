import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  SANDBOX_CLASSIFICATION_RULES,
  assertSandboxMutationReady,
  parseWranglerJsonOutput,
  safeSandboxErrorMessage,
  sandboxClassificationQuery,
  summarizeSandboxClassification,
  validateStagingSandboxConfig,
  waitForSandboxLifecycleState,
} from '../../scripts/staging-sandbox-lib.mjs';

const repoRoot = path.resolve('D:/workspace/repo');
const configPath = path.resolve('D:/private/wrangler.staging.private.jsonc');
const head = 'a'.repeat(40);
const branch = 'feat/v0.7.3-synthetic';
const stagingDatabaseId = '11111111-1111-4111-8111-111111111111';

function config(overrides = {}) {
  const { vars = {}, ...rest } = overrides;
  return {
    name: 'hau-usc-logistics-staging',
    workers_dev: true,
    preview_urls: false,
    vars: {
      ENVIRONMENT: 'STAGING',
      CANDIDATE_SHA: head,
      CANDIDATE_BRANCH: branch,
      SANDBOX_BASE_URL: 'https://hau-usc-logistics-staging.example.workers.dev',
      SANDBOX_RESET_ALLOWED: true,
      ACCOUNT_APPLICATION_EMAIL_RECIPIENT_ALLOWLIST_COUNT: 1,
      ...vars,
    },
    d1_databases: [
      {
        binding: 'DB',
        database_name: 'hau-usc-logistics-staging-sandbox-v0721',
        database_id: stagingDatabaseId,
      },
    ],
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
    ...rest,
  };
}

function validate(value, command = 'status') {
  return validateStagingSandboxConfig(value, {
    configPath,
    repoRoot,
    head,
    branch,
    command,
    expectedDatabaseId: stagingDatabaseId,
  });
}

describe('permanent staging sandbox guards', () => {
  it('accepts only the exact isolated staging resource set', () => {
    expect(validate(config()).valid).toBe(true);
    expect(validate(config({ name: 'hau-usc-logistics-production' })).issues).toContain(
      'STAGING_WORKER_MISMATCH',
    );
    expect(
      validate(
        config({
          d1_databases: [
            {
              binding: 'DB',
              database_name: 'hau-usc-logistics-production',
              database_id: '22222222-2222-4222-8222-222222222222',
            },
          ],
        }),
      ).issues,
    ).toEqual(expect.arrayContaining(['STAGING_D1_MISMATCH', 'PRODUCTION_RESOURCE_CROSSOVER']));
  });

  it('rejects spoofed D1 identity, routes, and every unapproved top-level config key', () => {
    expect(
      validate(
        config({
          d1_databases: [
            {
              binding: 'DB',
              database_name: 'hau-usc-logistics-staging-sandbox-v0721',
              database_id: '33333333-3333-4333-8333-333333333333',
            },
          ],
        }),
      ).issues,
    ).toContain('STAGING_D1_MISMATCH');
    expect(validate(config({ routes: [{ pattern: 'production.example.test/*' }] })).issues).toContain(
      'STAGING_ROUTE_NOT_ALLOWED',
    );
    expect(validate(config({ kv_namespaces: [{ binding: 'FOREIGN', id: 'private' }] })).issues).toContain(
      'UNEXPECTED_STAGING_CONFIG_KEY',
    );
    expect(validate(config({ send_email: [{ name: 'FOREIGN' }] })).issues).toContain(
      'UNEXPECTED_STAGING_CONFIG_KEY',
    );
    expect(validate(config({ analytics_engine_datasets: [{ binding: 'FOREIGN' }] })).issues).toContain(
      'UNEXPECTED_STAGING_CONFIG_KEY',
    );
  });

  it('rejects repository-relative config, SHA/branch drift, and missing recipient containment', () => {
    expect(
      validateStagingSandboxConfig(config(), {
        configPath: 'wrangler.staging.jsonc',
        repoRoot,
        head,
        branch,
        command: 'seed',
      }).issues,
    ).toContain('PRIVATE_CONFIG_ABSOLUTE_PATH_REQUIRED');
    expect(validate(config({ vars: { CANDIDATE_SHA: 'b'.repeat(40) } }), 'seed').issues).toContain(
      'CANDIDATE_SHA_HEAD_MISMATCH',
    );
    expect(
      validate(config({ vars: { ACCOUNT_APPLICATION_EMAIL_RECIPIENT_ALLOWLIST_COUNT: 0 } })).issues,
    ).toContain('STAGING_EMAIL_ALLOWLIST_INVALID');
  });

  it('requires the explicit reset flag before any reset mutation', () => {
    const result = validate(config({ vars: { SANDBOX_RESET_ALLOWED: false } }), 'reset');
    expect(result.issues).toContain('SANDBOX_RESET_NOT_ALLOWED');
  });

  it('classifies any unrecognized operational row as a mutation hard stop', () => {
    const classification = summarizeSandboxClassification([
      { entity: 'accounts', total: 4, non_synthetic: 0 },
      { entity: 'requests', total: 3, non_synthetic: 1 },
    ]);
    expect(classification).toMatchObject({ total: 7, nonSynthetic: 1, resetEligible: false });
    expect(() =>
      assertSandboxMutationReady({ configResult: validate(config()), classification, command: 'reset' }),
    ).toThrow('NON_SYNTHETIC_OR_UNCLASSIFIED_ROWS');
  });

  it('classifies every seeded lifecycle table and blocks live identity workflow state', () => {
    const entities = new Set(SANDBOX_CLASSIFICATION_RULES.map((rule) => rule.entity));
    for (const entity of [
      'request_lines',
      'restock_requests',
      'event_series',
      'event_days',
      'inventory_asset_instances',
      'inventory_asset_movements',
      'lending_handoffs',
      'lending_returns',
      'release_confirmations',
    ]) {
      expect(entities.has(entity)).toBe(true);
    }

    for (const entity of ['email_verification_challenges', 'account_applications']) {
      const rule = SANDBOX_CLASSIFICATION_RULES.find((candidate) => candidate.entity === entity);
      expect(rule?.syntheticPredicate).toBe('0');
      expect(rule?.activePredicate).not.toBe('1 = 1');
      expect(sandboxClassificationQuery(rule)).toContain(`FROM ${entity} WHERE`);
    }

    const liveIdentityState = summarizeSandboxClassification([
      { entity: 'email_verification_challenges', total: 1, non_synthetic: 1 },
    ]);
    expect(liveIdentityState.resetEligible).toBe(false);
    expect(() =>
      assertSandboxMutationReady({
        configResult: validate(config()),
        classification: liveIdentityState,
        command: 'reset',
      }),
    ).toThrow('NON_SYNTHETIC_OR_UNCLASSIFIED_ROWS');
  });

  it('redacts unexpected filesystem and tool errors', () => {
    expect(safeSandboxErrorMessage(new Error('ENOENT: missing D:\\private\\wrangler.staging.jsonc'))).toBe(
      'Sandbox command failed: PRIVATE_OPERATION_ERROR',
    );
    expect(safeSandboxErrorMessage(new Error('Sandbox reset refused: SANDBOX_RESET_NOT_ALLOWED'))).toBe(
      'Sandbox reset refused: SANDBOX_RESET_NOT_ALLOWED',
    );
  });

  it('parses Wrangler JSON after a provider status banner', () => {
    expect(parseWranglerJsonOutput('Checking D1 export...\n[{"success":true}]')).toEqual([
      { success: true },
    ]);
    expect(() => parseWranglerJsonOutput('Checking D1 export...')).toThrow(
      'Wrangler returned an invalid JSON response.',
    );
  });

  it('waits for the exact lifecycle generation after a remote write becomes consistent', async () => {
    let reads = 0;
    const state = await waitForSandboxLifecycleState(
      async () => {
        reads += 1;
        return {
          classification: { resetEligible: reads >= 2 },
          metadata: { sandbox_generation: reads >= 2 ? '2' : '1' },
        };
      },
      2,
      { attempts: 3, intervalMs: 0, delay: async () => {} },
    );
    expect(reads).toBe(2);
    expect(state.metadata.sandbox_generation).toBe('2');
  });
});
