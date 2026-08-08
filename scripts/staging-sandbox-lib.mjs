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
const ALLOWED_STAGING_CONFIG_KEYS = Object.freeze([
  'assets',
  'compatibility_date',
  'd1_databases',
  'main',
  'name',
  'observability',
  'preview_urls',
  'r2_buckets',
  'triggers',
  'vars',
  'workers_dev',
]);

export function isInside(parent, candidate) {
  const relative = path.relative(path.resolve(parent), path.resolve(candidate));
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function binding(config, collection, name) {
  return (config?.[collection] ?? []).find((entry) => entry.binding === name);
}

export function exactDatabaseIdFromInventory(inventory, databaseName) {
  const matches = (Array.isArray(inventory) ? inventory : []).filter(
    (database) => database?.name === databaseName,
  );
  if (matches.length !== 1) return '';
  const identifier = String(matches[0]?.uuid ?? matches[0]?.id ?? '').trim();
  return identifier && !PLACEHOLDER.test(identifier) ? identifier : '';
}

export function unexpectedStagingConfigKeys(config) {
  return Object.keys(config ?? {}).filter((key) => !ALLOWED_STAGING_CONFIG_KEYS.includes(key));
}

export function safeSandboxErrorMessage(error) {
  const message = String(error?.message ?? '');
  if (
    /^Sandbox (?:status|seed|reset) refused: [A-Z0-9_, -]+$/u.test(message) ||
    message === 'Usage: staging-sandbox.mjs <status|seed|reset> --config <absolute-private-config>' ||
    message === 'An absolute private --config path is required.'
  ) {
    return message;
  }
  return 'Sandbox command failed: PRIVATE_OPERATION_ERROR';
}

export function validateStagingSandboxConfig(
  config,
  { configPath, repoRoot, head = '', branch = '', command = 'status', expectedDatabaseId = '' } = {},
) {
  const issues = [];
  if (!path.isAbsolute(configPath ?? '')) issues.push('PRIVATE_CONFIG_ABSOLUTE_PATH_REQUIRED');
  else if (isInside(repoRoot, configPath)) issues.push('PRIVATE_CONFIG_OUTSIDE_REPOSITORY_REQUIRED');
  if (config?.name !== STAGING_SANDBOX_TARGET.worker) issues.push('STAGING_WORKER_MISMATCH');
  if (String(config?.vars?.ENVIRONMENT ?? '').toUpperCase() !== 'STAGING')
    issues.push('STAGING_ENVIRONMENT_REQUIRED');

  const databases = config?.d1_databases ?? [];
  const database = binding(config, 'd1_databases', 'DB');
  if (
    databases.length !== 1 ||
    !database ||
    database.database_name !== STAGING_SANDBOX_TARGET.database ||
    !database.database_id ||
    PLACEHOLDER.test(String(database.database_id)) ||
    !expectedDatabaseId ||
    database.database_id !== expectedDatabaseId
  ) {
    issues.push('STAGING_D1_MISMATCH');
  }
  const bucketBindings = (config?.r2_buckets ?? [])
    .map((entry) => `${entry.binding}:${entry.bucket_name}`)
    .sort();
  const expectedBucketBindings = [
    `BRAND_ASSETS:${STAGING_SANDBOX_TARGET.buckets[0]}`,
    `EVIDENCE_ASSETS:${STAGING_SANDBOX_TARGET.buckets[1]}`,
  ].sort();
  const buckets = (config?.r2_buckets ?? []).map((entry) => entry.bucket_name).sort();
  if (JSON.stringify(bucketBindings) !== JSON.stringify(expectedBucketBindings))
    issues.push('STAGING_R2_MISMATCH');

  if (config?.routes !== undefined || config?.route !== undefined)
    issues.push('STAGING_ROUTE_NOT_ALLOWED');
  if (config?.workers_dev !== true || config?.preview_urls !== false)
    issues.push('STAGING_PUBLICATION_MODE_INVALID');
  if (unexpectedStagingConfigKeys(config).length) issues.push('UNEXPECTED_STAGING_CONFIG_KEY');

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
      databaseMatch:
        databases.length === 1 &&
        database?.database_name === STAGING_SANDBOX_TARGET.database &&
        Boolean(expectedDatabaseId) &&
        database?.database_id === expectedDatabaseId,
      bucketMatch: JSON.stringify(bucketBindings) === JSON.stringify(expectedBucketBindings),
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
