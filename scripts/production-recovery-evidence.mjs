import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import { parseJsonConfig, validateEnvironmentSeparation } from './cloudflare-environment-preflight.mjs';
import { restoreAndVerifyD1Export } from './d1/verify-d1-export.mjs';
import { reconcileInventoryDatabase } from './d1/reconcile-inventory-truth.mjs';
import {
  productionCandidateEvidence,
  validateProductionAuthorizationPackage,
} from './production-authorization.mjs';
import { resolvePrivatePath } from './private-path.mjs';
import {
  exactDatabaseIdFromInventory,
  parseWranglerJsonOutput,
  validateStagingSandboxConfig,
} from './staging-sandbox-lib.mjs';

const repoRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const expectedDatabase = 'hau-usc-logistics-production';
const expectedWorker = 'hau-usc-logistics-production';
const expectedBuckets = Object.freeze([
  'hau-usc-logistics-production-assets',
  'hau-usc-logistics-production-evidence',
]);
const expectedMigration = '0030_production_access_and_operations.sql';
const sha256 = (value) => createHash('sha256').update(value).digest('hex');

function argument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : '';
}

function runWrangler(configPath, args) {
  const executable = path.join(repoRoot, 'node_modules', 'wrangler', 'bin', 'wrangler.js');
  return execFileSync(process.execPath, [executable, ...args, '--config', configPath], {
    cwd: repoRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });
}

async function main() {
  const stagingConfigPath = await resolvePrivatePath(argument('--staging-config'), {
    repoRoot,
    label: 'Staging config',
  });
  const productionConfigPath = await resolvePrivatePath(argument('--production-config'), {
    repoRoot,
    label: 'Production config',
  });
  const authorizationPath = await resolvePrivatePath(argument('--authorization'), {
    repoRoot,
    label: 'Production authorization',
  });
  const privateDirectory = await resolvePrivatePath(argument('--private-dir'), {
    repoRoot,
    label: 'Private evidence directory',
    kind: 'directory',
    allowMissing: true,
  });
  const manifestPath = await resolvePrivatePath(argument('--manifest'), {
    repoRoot,
    label: 'Production backup manifest',
    allowMissing: true,
  });
  const currentCandidate = await productionCandidateEvidence();
  if (!['main', 'release/v0.8.0-inventory-truth-ledger-lock'].includes(currentCandidate.branch)) {
    throw new Error('PRODUCTION_RECOVERY_SOURCE_BRANCH_INVALID');
  }
  const [stagingRaw, productionRaw, authorizationRaw] = await Promise.all([
    readFile(stagingConfigPath, 'utf8'),
    readFile(productionConfigPath, 'utf8'),
    readFile(authorizationPath, 'utf8'),
  ]);
  const staging = parseJsonConfig(stagingRaw);
  const production = parseJsonConfig(productionRaw);
  const authorization = JSON.parse(authorizationRaw);
  const authorizationResult = await validateProductionAuthorizationPackage(authorization, {
    packagePath: authorizationPath,
    currentCandidate,
    allowMissingBackupManifest: true,
  });
  if (
    !authorizationResult.valid ||
    authorization.authorization?.actions?.productionBackup !== 'APPROVED' ||
    path.resolve(authorization.target?.privateWranglerConfigPath ?? '') !== productionConfigPath ||
    path.resolve(authorization.target?.privateBackupManifestPath ?? '') !== manifestPath
  ) {
    throw new Error('PRODUCTION_BACKUP_AUTHORIZATION_REQUIRED');
  }
  const separation = validateEnvironmentSeparation(staging, production, {
    expectedSha: currentCandidate.releaseSha,
  });
  if (!separation.valid) throw new Error('ENVIRONMENT_SEPARATION_FAILED');
  const stagingInventory = parseWranglerJsonOutput(runWrangler(stagingConfigPath, ['d1', 'list', '--json']));
  const stagingDatabaseId = exactDatabaseIdFromInventory(
    stagingInventory,
    'hau-usc-logistics-staging-sandbox-v0721',
  );
  const stagingValidation = validateStagingSandboxConfig(staging, {
    configPath: stagingConfigPath,
    repoRoot,
    command: 'status',
    expectedDatabaseId: stagingDatabaseId,
  });
  if (!stagingValidation.valid) throw new Error('ISOLATED_STAGING_TARGET_FAILED');
  const stagingR2Metadata = [];
  for (const binding of staging.r2_buckets ?? []) {
    const info = parseWranglerJsonOutput(
      runWrangler(stagingConfigPath, ['r2', 'bucket', 'info', binding.bucket_name, '--json']),
    );
    if (info?.name !== binding.bucket_name) throw new Error('STAGING_R2_IDENTITY_FAILED');
    stagingR2Metadata.push({ binding: binding.binding, info });
  }
  if (stagingR2Metadata.length !== 2) throw new Error('STAGING_R2_IDENTITY_FAILED');
  if (
    production.name !== expectedWorker ||
    production.vars?.ENVIRONMENT !== 'PRODUCTION' ||
    production.vars?.APP_VERSION !== '0.8.0' ||
    production.vars?.CANDIDATE_SHA !== currentCandidate.releaseSha
  ) {
    throw new Error('PRODUCTION_CONFIG_IDENTITY_FAILED');
  }

  const inventory = parseWranglerJsonOutput(runWrangler(productionConfigPath, ['d1', 'list', '--json']));
  const databaseId = exactDatabaseIdFromInventory(inventory, expectedDatabase);
  if (production.d1_databases?.length !== 1 || production.d1_databases[0]?.database_id !== databaseId) {
    throw new Error('PRODUCTION_D1_IDENTITY_FAILED');
  }
  const configuredBuckets = (production.r2_buckets ?? []).map((entry) => entry.bucket_name).sort();
  if (JSON.stringify(configuredBuckets) !== JSON.stringify([...expectedBuckets].sort())) {
    throw new Error('PRODUCTION_R2_CONFIG_IDENTITY_FAILED');
  }
  const r2Metadata = [];
  for (const binding of production.r2_buckets) {
    const info = parseWranglerJsonOutput(
      runWrangler(productionConfigPath, ['r2', 'bucket', 'info', binding.bucket_name, '--json']),
    );
    if (info?.name !== binding.bucket_name) throw new Error('PRODUCTION_R2_IDENTITY_FAILED');
    r2Metadata.push({ binding: binding.binding, info });
  }

  const deployments = parseWranglerJsonOutput(
    runWrangler(productionConfigPath, ['deployments', 'list', '--json']),
  );
  if (!Array.isArray(deployments) || deployments.length < 1) {
    throw new Error('PRODUCTION_WORKER_ROLLBACK_TARGET_MISSING');
  }
  const timeTravel = parseWranglerJsonOutput(
    runWrangler(productionConfigPath, ['d1', 'time-travel', 'info', 'DB', '--json']),
  );
  if (typeof timeTravel?.bookmark !== 'string' || !timeTravel.bookmark) {
    throw new Error('PRODUCTION_TIME_TRAVEL_BOOKMARK_MISSING');
  }

  await mkdir(privateDirectory, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/gu, '-');
  const exportPath = path.join(privateDirectory, `v080-production-backup-${stamp}.sql`);
  const restorePath = path.join(privateDirectory, `v080-production-restore-${stamp}.sqlite`);
  runWrangler(productionConfigPath, ['d1', 'export', 'DB', '--remote', '--output', exportPath]);
  const isolatedRestore = await restoreAndVerifyD1Export(exportPath, restorePath, {
    expectedSchema: '30',
    expectedMigration,
    requireImmutableHistory: true,
  });
  const restored = new DatabaseSync(restorePath, { readOnly: true });
  let reconciliation;
  let syntheticActiveAccounts;
  try {
    reconciliation = reconcileInventoryDatabase(restored, {
      environment: 'PRODUCTION_READ_ONLY',
      candidateSha: currentCandidate.releaseSha,
    });
    syntheticActiveAccounts = Number(
      restored
        .prepare(
          `SELECT COUNT(*) AS count FROM accounts
           WHERE status IN ('STARTER', 'ACTIVE')
             AND (
               id LIKE 'SBX-%'
               OR access_id_normalized LIKE 'SBX.%'
               OR lower(COALESCE(profile_email, '')) LIKE '%@example.invalid'
             )`,
        )
        .get()?.count ?? 0,
    );
  } finally {
    restored.close();
  }
  if (reconciliation.summary.disposition !== 'RECONCILED') {
    throw new Error('PRODUCTION_BACKUP_RECONCILIATION_FAILED');
  }
  const exportBytes = await readFile(exportPath);
  const capturedAt = new Date().toISOString();
  await writeFile(
    manifestPath,
    `${JSON.stringify(
      {
        schemaVersion: 1,
        environment: 'PRODUCTION',
        candidateSha: currentCandidate.releaseSha,
        candidateBranch: currentCandidate.branch,
        evidencePhase: currentCandidate.branch === 'main' ? 'POST_MERGE_FINAL' : 'PRE_MERGE_READ_ONLY',
        capturedAt,
        exportSha256: sha256(exportBytes),
        integrity: ['ok'],
        foreignKeyViolations: 0,
        bookmarkPresent: true,
        testDataPromotionConfirmed: false,
        syntheticActiveAccounts,
        target: {
          worker: production.name,
          database: expectedDatabase,
          databaseId,
          bucketBindings: production.r2_buckets,
        },
        fingerprints: {
          stagingConfigSha256: sha256(stagingRaw),
          productionConfigSha256: sha256(productionRaw),
          stagingR2MetadataSha256: sha256(JSON.stringify(stagingR2Metadata)),
          r2MetadataSha256: sha256(JSON.stringify(r2Metadata)),
        },
        rollback: {
          priorWorkerDeployment: deployments[0],
          deploymentsSnapshot: deployments,
          d1TimeTravel: timeTravel,
          r2Metadata,
          stagingR2Metadata,
        },
        isolatedRestore,
        reconciliation,
      },
      null,
      2,
    )}\n`,
    { flag: 'wx', mode: 0o600 },
  );
  process.stdout.write(
    `${JSON.stringify({
      environment: 'PRODUCTION',
      candidateSha: currentCandidate.releaseSha,
      evidencePhase: currentCandidate.branch === 'main' ? 'POST_MERGE_FINAL' : 'PRE_MERGE_READ_ONLY',
      backupCaptured: true,
      isolatedRestore,
      reconciliation: reconciliation.summary,
      syntheticActiveAccounts,
      priorWorkerRollbackCaptured: true,
      liveR2IdentityCaptured: true,
      timeTravelBookmarkCaptured: true,
      privateEvidenceWritten: true,
    })}\n`,
  );
  if (syntheticActiveAccounts !== 0) throw new Error('PRODUCTION_SYNTHETIC_ACTIVE_ACCOUNTS_FOUND');
}

main().catch((error) => {
  const safe = /^[A-Z0-9_]+$/u.test(String(error?.message ?? '')) ? error.message : 'PRIVATE_OPERATION_ERROR';
  console.error(`Production recovery evidence failed: ${safe}`);
  process.exitCode = 1;
});
