import path from 'node:path';
import { parseExactRecipientAllowlist } from '../src/server/account-application/email-provider-registry.js';

export const STAGING_SANDBOX_TARGET = Object.freeze({
  worker: 'hau-usc-logistics-staging',
  database: 'hau-usc-logistics-staging',
  buckets: Object.freeze(['hau-usc-logistics-staging-assets', 'hau-usc-logistics-staging-evidence']),
});

const SHA = /^[0-9a-f]{40}$/u;
const BRANCH = /^[A-Za-z0-9][A-Za-z0-9._/-]{0,127}$/u;
const PLACEHOLDER = /(?:REPLACE|TBD|TODO|UNKNOWN|00000000-0000-0000-0000-000000000000)/iu;

export function isInside(parent, candidate) {
  const relative = path.relative(path.resolve(parent), path.resolve(candidate));
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function binding(config, collection, name) {
  return (config?.[collection] ?? []).find((entry) => entry.binding === name);
}

export function validateStagingSandboxConfig(
  config,
  { configPath, repoRoot, head = '', branch = '', command = 'status' } = {},
) {
  const issues = [];
  if (!path.isAbsolute(configPath ?? '')) issues.push('PRIVATE_CONFIG_ABSOLUTE_PATH_REQUIRED');
  else if (isInside(repoRoot, configPath)) issues.push('PRIVATE_CONFIG_OUTSIDE_REPOSITORY_REQUIRED');
  if (config?.name !== STAGING_SANDBOX_TARGET.worker) issues.push('STAGING_WORKER_MISMATCH');
  if (String(config?.vars?.ENVIRONMENT ?? '').toUpperCase() !== 'STAGING')
    issues.push('STAGING_ENVIRONMENT_REQUIRED');

  const database = binding(config, 'd1_databases', 'DB');
  if (
    !database ||
    database.database_name !== STAGING_SANDBOX_TARGET.database ||
    !database.database_id ||
    PLACEHOLDER.test(String(database.database_id))
  ) {
    issues.push('STAGING_D1_MISMATCH');
  }
  const buckets = (config?.r2_buckets ?? []).map((entry) => entry.bucket_name).sort();
  if (JSON.stringify(buckets) !== JSON.stringify([...STAGING_SANDBOX_TARGET.buckets].sort()))
    issues.push('STAGING_R2_MISMATCH');

  const resourceValues = [config?.name, database?.database_name, ...buckets];
  if (resourceValues.some((value) => /production/iu.test(String(value ?? ''))))
    issues.push('PRODUCTION_RESOURCE_CROSSOVER');

  const candidateSha = String(config?.vars?.CANDIDATE_SHA ?? '')
    .trim()
    .toLowerCase();
  if (!SHA.test(candidateSha)) issues.push('CANDIDATE_SHA_INVALID');
  const candidateBranch = String(config?.vars?.CANDIDATE_BRANCH ?? '').trim();
  if (!BRANCH.test(candidateBranch)) issues.push('CANDIDATE_BRANCH_INVALID');
  if (command !== 'status' && head && candidateSha !== head.toLowerCase())
    issues.push('CANDIDATE_SHA_HEAD_MISMATCH');
  if (command !== 'status' && branch && candidateBranch !== branch)
    issues.push('CANDIDATE_BRANCH_HEAD_MISMATCH');

  const baseUrl = String(config?.vars?.SANDBOX_BASE_URL ?? '').trim();
  try {
    const url = new URL(baseUrl);
    if (url.protocol !== 'https:' || url.pathname !== '/' || /production/iu.test(url.hostname))
      issues.push('STAGING_BASE_URL_INVALID');
  } catch {
    issues.push('STAGING_BASE_URL_INVALID');
  }

  const allowlist = parseExactRecipientAllowlist(
    config?.vars?.ACCOUNT_APPLICATION_EMAIL_RECIPIENT_ALLOWLIST_JSON,
  );
  if (!allowlist) issues.push('STAGING_EMAIL_ALLOWLIST_INVALID');
  if (command === 'reset' && config?.vars?.SANDBOX_RESET_ALLOWED !== true)
    issues.push('SANDBOX_RESET_NOT_ALLOWED');

  return Object.freeze({
    valid: issues.length === 0,
    issues: Object.freeze([...new Set(issues)]),
    safe: Object.freeze({
      environment: 'STAGING',
      workerMatch: config?.name === STAGING_SANDBOX_TARGET.worker,
      databaseMatch: database?.database_name === STAGING_SANDBOX_TARGET.database,
      bucketMatch: JSON.stringify(buckets) === JSON.stringify([...STAGING_SANDBOX_TARGET.buckets].sort()),
      candidateSha: SHA.test(candidateSha) ? candidateSha : '',
      candidateBranch: BRANCH.test(candidateBranch) ? candidateBranch : '',
      allowlistCount: allowlist?.length ?? 0,
      baseUrl,
    }),
  });
}

export function summarizeSandboxClassification(rows) {
  const summary = rows.map((row) => ({
    entity: String(row.entity),
    total: Number(row.total ?? 0),
    nonSynthetic: Number(row.non_synthetic ?? 0),
  }));
  return Object.freeze({
    rows: Object.freeze(summary),
    total: summary.reduce((sum, row) => sum + row.total, 0),
    nonSynthetic: summary.reduce((sum, row) => sum + row.nonSynthetic, 0),
    resetEligible: summary.every((row) => row.nonSynthetic === 0),
  });
}

export function assertSandboxMutationReady({ configResult, classification, command }) {
  if (!configResult?.valid) {
    throw new Error(`Sandbox ${command} refused: ${configResult?.issues?.join(', ') || 'INVALID_CONFIG'}`);
  }
  if (!classification?.resetEligible) {
    throw new Error(`Sandbox ${command} refused: NON_SYNTHETIC_OR_UNCLASSIFIED_ROWS`);
  }
}
