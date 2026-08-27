import { readFile } from 'node:fs/promises';
import path from 'node:path';

export const STAGING_SANDBOX_TARGET = Object.freeze({
  worker: 'hau-usc-logistics-staging',
  database: 'hau-usc-logistics-staging-sandbox-v0721',
  buckets: Object.freeze([
    'hau-usc-logistics-staging-sandbox-v0721-assets',
    'hau-usc-logistics-staging-sandbox-v0721-evidence',
  ]),
});

function classificationRule(entity, syntheticPredicate, activePredicate = '1 = 1') {
  return Object.freeze({ entity, syntheticPredicate, activePredicate });
}

export const SANDBOX_CLASSIFICATION_RULES = Object.freeze([
  classificationRule('accounts', "id LIKE 'SBX-%' OR id IN ('SYSTEM-IMPORT', 'SYSTEM-PUBLIC-REQUEST')"),
  classificationRule('sessions', "account_id LIKE 'SBX-%'"),
  classificationRule('password_reset_tokens', "account_id LIKE 'SBX-%'"),
  classificationRule(
    'account_committees',
    "account_id LIKE 'SBX-%' OR account_id IN ('SYSTEM-IMPORT', 'SYSTEM-PUBLIC-REQUEST')",
  ),
  classificationRule(
    'access_id_reservations',
    "account_id LIKE 'SBX-%' OR account_id IN ('SYSTEM-IMPORT', 'SYSTEM-PUBLIC-REQUEST')",
  ),
  classificationRule('requests', "id LIKE 'SBX-%'"),
  classificationRule('request_lines', "id LIKE 'SBX-%'"),
  classificationRule('deliverables', "id LIKE 'SBX-%'"),
  classificationRule('restock_requests', "id LIKE 'SBX-%'"),
  classificationRule('inventory_items', "id LIKE 'SBX-%'"),
  classificationRule('inventory_ledger', "id LIKE 'SBX-%'"),
  classificationRule('inventory_asset_instances', "id LIKE 'SBX-%'"),
  classificationRule('inventory_asset_movements', "id LIKE 'SBX-%'"),
  classificationRule('event_series', "id LIKE 'SBX-%'"),
  classificationRule('event_days', "id LIKE 'SBX-%'"),
  classificationRule('events', "id LIKE 'SBX-%'"),
  classificationRule('reservations', "id LIKE 'SBX-%'"),
  classificationRule('lending_tickets', "id LIKE 'SBX-%'"),
  classificationRule('lending_handoffs', "id LIKE 'SBX-%'"),
  classificationRule('lending_returns', "id LIKE 'SBX-%'"),
  classificationRule('release_confirmations', "id LIKE 'SBX-%'"),
  classificationRule('email_verification_challenges', '0', "status IN ('PENDING', 'VERIFIED')"),
  classificationRule(
    'account_applications',
    '0',
    "archived_at IS NULL AND state NOT IN ('REJECTED', 'WITHDRAWN', 'EXPIRED', 'ARCHIVED')",
  ),
]);

export function sandboxClassificationQuery(rule) {
  if (!SANDBOX_CLASSIFICATION_RULES.includes(rule)) {
    throw new Error('Unknown sandbox classification rule.');
  }
  return (
    `SELECT ${JSON.stringify(rule.entity)} AS entity, COUNT(*) AS total, ` +
    `COALESCE(SUM(CASE WHEN ${rule.syntheticPredicate} THEN 0 ELSE 1 END), 0) AS non_synthetic ` +
    `FROM ${rule.entity} WHERE ${rule.activePredicate}`
  );
}

const SHA = /^[0-9a-f]{40}$/u;
const SHA256 = /^[0-9a-f]{64}$/u;
const PACKAGE_VERSION =
  /^(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/u;
const PLACEHOLDER = /(?:REPLACE|TBD|TODO|UNKNOWN|00000000-0000-0000-0000-000000000000)/iu;
export const RELEASE_SCHEMA_VERSION = '32';
export const RELEASE_MIGRATION = '0032_staff_account_activity_history.sql';
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

function escapeRegExp(value) {
  return String(value).replace(/[|\\{}()[\]^$+*?.]/gu, '\\$&');
}

export async function readPackageReleaseVersion(repoRoot) {
  const packagePath = path.join(repoRoot, 'package.json');
  const packageJson = JSON.parse(await readFile(packagePath, 'utf8'));
  const releaseVersion = String(packageJson?.version ?? '').trim();
  if (!PACKAGE_VERSION.test(releaseVersion)) throw new Error('PACKAGE_RELEASE_VERSION_INVALID');
  return releaseVersion;
}

export function temporaryReleaseBranchPattern(releaseVersion) {
  const version = String(releaseVersion ?? '').trim();
  if (!PACKAGE_VERSION.test(version)) return null;
  return new RegExp(`^(?:release|fix|hotfix)\\/v${escapeRegExp(version)}-[A-Za-z0-9][A-Za-z0-9._-]*$`, 'u');
}

export function releaseIdentityModeForRecovery(branch) {
  return String(branch ?? '').trim() === 'main' ? 'production' : 'recovery';
}

export function validateReleaseCandidateIdentity(
  config,
  { releaseVersion = '', head = '', branch = '', mode = 'staging' } = {},
) {
  const issues = [];
  const packageVersion = String(releaseVersion ?? '').trim();
  const currentHead = String(head ?? '').trim();
  const currentBranch = String(branch ?? '').trim();
  const candidateSha = String(config?.vars?.CANDIDATE_SHA ?? '').trim();
  const candidateBranch = String(config?.vars?.CANDIDATE_BRANCH ?? '').trim();
  const appVersion = String(config?.vars?.APP_VERSION ?? '').trim();
  const temporaryBranch = temporaryReleaseBranchPattern(packageVersion);

  if (!temporaryBranch) issues.push('PACKAGE_RELEASE_VERSION_INVALID');
  if (!SHA.test(currentHead)) issues.push('GIT_HEAD_INVALID');
  if (!SHA.test(candidateSha) || candidateSha !== currentHead) issues.push('CANDIDATE_SHA_HEAD_MISMATCH');
  if (appVersion !== packageVersion) issues.push('APP_VERSION_PACKAGE_MISMATCH');

  if (mode === 'production') {
    if (currentBranch !== 'main' || candidateBranch !== 'main') {
      issues.push('PRODUCTION_MAIN_BRANCH_REQUIRED');
    }
  } else if (mode === 'staging' || mode === 'recovery') {
    if (!temporaryBranch?.test(currentBranch) || !temporaryBranch.test(candidateBranch)) {
      issues.push('CANDIDATE_BRANCH_RELEASE_VERSION_MISMATCH');
    }
    if (candidateBranch !== currentBranch) issues.push('CANDIDATE_BRANCH_HEAD_MISMATCH');
  } else {
    issues.push('RELEASE_IDENTITY_MODE_INVALID');
  }

  return Object.freeze({
    valid: issues.length === 0,
    issues: Object.freeze([...new Set(issues)]),
    safe: Object.freeze({
      releaseVersion: PACKAGE_VERSION.test(packageVersion) ? packageVersion : '',
      appVersion: appVersion === packageVersion ? appVersion : '',
      candidateSha: SHA.test(candidateSha) ? candidateSha : '',
      candidateBranch,
    }),
  });
}

export function validateReleaseBackupTuple({
  exportSha256,
  isolatedRestore,
  reconciliation,
  priorWorkerDeployment,
  deploymentsSnapshot,
  r2Metadata,
  fingerprints,
  timeTravelBookmark,
  syntheticActiveAccounts,
  requireNoSyntheticActiveAccounts = false,
} = {}) {
  const issues = [];
  if (!SHA256.test(String(exportSha256 ?? ''))) issues.push('BACKUP_EXPORT_SHA_MISSING');
  if (isolatedRestore?.integrityOk !== true) issues.push('BACKUP_RESTORE_INTEGRITY_FAILED');
  if (Number(isolatedRestore?.foreignKeyViolations) !== 0) issues.push('BACKUP_RESTORE_FOREIGN_KEYS_FAILED');
  if (String(isolatedRestore?.operationalSchema ?? '') !== RELEASE_SCHEMA_VERSION)
    issues.push('BACKUP_RESTORE_SCHEMA_MISMATCH');
  if (String(isolatedRestore?.latestMigration ?? '') !== RELEASE_MIGRATION)
    issues.push('BACKUP_RESTORE_MIGRATION_MISMATCH');
  if (reconciliation?.summary?.disposition !== 'RECONCILED') issues.push('BACKUP_RECONCILIATION_FAILED');
  if (!priorWorkerDeployment || !Array.isArray(deploymentsSnapshot) || deploymentsSnapshot.length < 1)
    issues.push('BACKUP_PRIOR_WORKER_SNAPSHOT_MISSING');
  if (!Array.isArray(r2Metadata) || r2Metadata.length !== 2) issues.push('BACKUP_R2_METADATA_MISSING');
  for (const key of ['stagingConfigSha256', 'productionConfigSha256', 'r2MetadataSha256']) {
    if (!SHA256.test(String(fingerprints?.[key] ?? ''))) {
      issues.push('BACKUP_FINGERPRINTS_INVALID');
      break;
    }
  }
  if (typeof timeTravelBookmark !== 'string' || !timeTravelBookmark.trim())
    issues.push('TIME_TRAVEL_BOOKMARK_MISSING');
  if (
    requireNoSyntheticActiveAccounts &&
    (!Number.isSafeInteger(syntheticActiveAccounts) || syntheticActiveAccounts !== 0)
  ) {
    issues.push('PRODUCTION_SYNTHETIC_ACTIVE_ACCOUNTS_FOUND');
  }

  return Object.freeze({
    valid: issues.length === 0,
    issues: Object.freeze([...new Set(issues)]),
  });
}

export function assertReleaseBackupTuple(tuple) {
  const result = validateReleaseBackupTuple(tuple);
  if (!result.valid) throw new Error('BACKUP_TUPLE_INVALID');
  return result;
}

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

export function parseWranglerJsonOutput(output) {
  const source = String(output ?? '').trim();
  for (let index = 0; index < source.length; index += 1) {
    if (source[index] !== '[' && source[index] !== '{') continue;
    try {
      return JSON.parse(source.slice(index));
    } catch {
      // Wrangler may emit a status banner before otherwise valid JSON.
    }
  }
  throw new Error('Wrangler returned an invalid JSON response.');
}

export function validateStagingSandboxConfig(
  config,
  {
    configPath,
    repoRoot,
    releaseVersion = '',
    head = '',
    branch = '',
    identityMode = 'staging',
    command = 'status',
    expectedDatabaseId = '',
  } = {},
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

  if (config?.routes !== undefined || config?.route !== undefined) issues.push('STAGING_ROUTE_NOT_ALLOWED');
  if (config?.workers_dev !== true || config?.preview_urls !== false)
    issues.push('STAGING_PUBLICATION_MODE_INVALID');
  if (unexpectedStagingConfigKeys(config).length) issues.push('UNEXPECTED_STAGING_CONFIG_KEY');

  const resourceValues = [config?.name, database?.database_name, ...buckets];
  if (resourceValues.some((value) => /production/iu.test(String(value ?? ''))))
    issues.push('PRODUCTION_RESOURCE_CROSSOVER');

  const releaseIdentity = validateReleaseCandidateIdentity(config, {
    releaseVersion,
    head,
    branch,
    mode: identityMode,
  });
  issues.push(...releaseIdentity.issues);

  const baseUrl = String(config?.vars?.SANDBOX_BASE_URL ?? '').trim();
  try {
    const url = new URL(baseUrl);
    if (url.protocol !== 'https:' || url.pathname !== '/' || /production/iu.test(url.hostname))
      issues.push('STAGING_BASE_URL_INVALID');
  } catch {
    issues.push('STAGING_BASE_URL_INVALID');
  }

  const allowlistCount = Number(config?.vars?.ACCOUNT_APPLICATION_EMAIL_RECIPIENT_ALLOWLIST_COUNT);
  if (!Number.isSafeInteger(allowlistCount) || allowlistCount !== 1) {
    issues.push('STAGING_EMAIL_ALLOWLIST_INVALID');
  }
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
      releaseVersion: releaseIdentity.safe.releaseVersion,
      appVersion: releaseIdentity.safe.appVersion,
      candidateSha: releaseIdentity.safe.candidateSha,
      candidateBranch: releaseIdentity.safe.candidateBranch,
      allowlistCount: Number.isSafeInteger(allowlistCount) ? allowlistCount : 0,
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

export async function waitForSandboxLifecycleState(
  readState,
  expectedGeneration,
  {
    attempts = 10,
    intervalMs = 1_000,
    delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)),
  } = {},
) {
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const state = await readState();
    if (
      state.classification?.resetEligible &&
      Number(state.metadata?.sandbox_generation) === expectedGeneration
    ) {
      return state;
    }
    if (attempt < attempts) await delay(intervalMs);
  }
  throw new Error('Sandbox lifecycle postcondition failed.');
}
