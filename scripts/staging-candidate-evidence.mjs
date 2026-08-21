import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import { parseJsonConfig, validateEnvironmentSeparation } from './cloudflare-environment-preflight.mjs';
import { restoreAndVerifyD1Export } from './d1/verify-d1-export.mjs';
import { reconcileInventoryDatabase } from './d1/reconcile-inventory-truth.mjs';
import { validatePhase3AuthorizationPackage } from './phase3-staging-authorization.mjs';
import { resolvePrivatePath } from './private-path.mjs';
import {
  assertReleaseBackupTuple,
  exactDatabaseIdFromInventory,
  parseWranglerJsonOutput,
  readPackageReleaseVersion,
  validateStagingSandboxConfig,
  validateReleaseCandidateIdentity,
} from './staging-sandbox-lib.mjs';

const repoRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const expectedDatabase = 'hau-usc-logistics-staging-sandbox-v0721';

function argument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : '';
}

const sha256 = (value) => createHash('sha256').update(value).digest('hex');

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
    label: 'Authorization package',
  });
  const privateDirectory = await resolvePrivatePath(argument('--private-dir'), {
    repoRoot,
    label: 'Private evidence directory',
    kind: 'directory',
    allowMissing: true,
  });
  const head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repoRoot, encoding: 'utf8' }).trim();
  const branch = execFileSync('git', ['branch', '--show-current'], {
    cwd: repoRoot,
    encoding: 'utf8',
  }).trim();
  const releaseVersion = await readPackageReleaseVersion(repoRoot);
  const status = execFileSync('git', ['status', '--porcelain'], {
    cwd: repoRoot,
    encoding: 'utf8',
  }).trim();
  if (status) throw new Error('FROZEN_CANDIDATE_REQUIRED');

  const [stagingRaw, productionRaw, authorizationRaw] = await Promise.all([
    readFile(stagingConfigPath, 'utf8'),
    readFile(productionConfigPath, 'utf8'),
    readFile(authorizationPath, 'utf8'),
  ]);
  const staging = parseJsonConfig(stagingRaw);
  const production = parseJsonConfig(productionRaw);
  const separation = validateEnvironmentSeparation(staging, production, {
    expectedSha: head,
    allowStagingCandidate: true,
  });
  if (!separation.valid) throw new Error('ENVIRONMENT_SEPARATION_FAILED');
  const stagingIdentity = validateReleaseCandidateIdentity(staging, {
    releaseVersion,
    head,
    branch,
    mode: 'staging',
  });
  if (!stagingIdentity.valid) {
    throw new Error('STAGING_CANDIDATE_CONFIG_IDENTITY_FAILED');
  }
  const authorizationPackage = JSON.parse(authorizationRaw);
  const authorization = await validatePhase3AuthorizationPackage(authorizationPackage, {
    packagePath: authorizationPath,
  });
  const authorizedActions = authorizationPackage.authorization?.actions ?? {};
  if (
    !authorization.valid ||
    authorizedActions.cloudflareRead !== 'APPROVED' ||
    authorizedActions.d1Backup !== 'APPROVED' ||
    path.resolve(authorizationPackage.target?.privateWranglerConfigPath ?? '') !== stagingConfigPath
  ) {
    throw new Error('BACKUP_AUTHORIZATION_REQUIRED');
  }

  const inventory = parseWranglerJsonOutput(runWrangler(stagingConfigPath, ['d1', 'list', '--json']));
  const databaseId = exactDatabaseIdFromInventory(inventory, expectedDatabase);
  const configValidation = validateStagingSandboxConfig(staging, {
    configPath: stagingConfigPath,
    repoRoot,
    releaseVersion,
    head,
    branch,
    command: 'evidence',
    expectedDatabaseId: databaseId,
  });
  if (!configValidation.valid) throw new Error('ISOLATED_STAGING_TARGET_FAILED');

  const r2Metadata = [];
  for (const binding of staging.r2_buckets ?? []) {
    const info = parseWranglerJsonOutput(
      runWrangler(stagingConfigPath, ['r2', 'bucket', 'info', binding.bucket_name, '--json']),
    );
    if (info?.name !== binding.bucket_name) throw new Error('STAGING_R2_IDENTITY_FAILED');
    r2Metadata.push({ binding: binding.binding, info });
  }
  if (r2Metadata.length !== 2) throw new Error('STAGING_R2_IDENTITY_FAILED');

  await mkdir(privateDirectory, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/gu, '-');
  const releaseLabel = `v${releaseVersion}`;
  const exportPath = path.join(privateDirectory, `${releaseLabel}-staging-backup-${stamp}.sql`);
  const restorePath = path.join(privateDirectory, `${releaseLabel}-staging-restore-${stamp}.sqlite`);
  const manifestPath = path.join(privateDirectory, `${releaseLabel}-staging-recovery-${stamp}.json`);

  const deploymentsRaw = runWrangler(stagingConfigPath, ['deployments', 'list', '--json']);
  const deployments = parseWranglerJsonOutput(deploymentsRaw);
  if (!Array.isArray(deployments) || deployments.length < 1) {
    throw new Error('PRIOR_WORKER_ROLLBACK_TARGET_MISSING');
  }
  const timeTravel = parseWranglerJsonOutput(
    runWrangler(stagingConfigPath, ['d1', 'time-travel', 'info', 'DB', '--json']),
  );
  if (typeof timeTravel?.bookmark !== 'string' || !timeTravel.bookmark.trim()) {
    throw new Error('STAGING_TIME_TRAVEL_BOOKMARK_MISSING');
  }
  runWrangler(stagingConfigPath, ['d1', 'export', 'DB', '--remote', '--output', exportPath]);
  const isolatedRestore = await restoreAndVerifyD1Export(exportPath, restorePath, {
    expectedSchema: '30',
    expectedMigration: '0030_production_access_and_operations.sql',
    requireImmutableHistory: true,
  });
  const restored = new DatabaseSync(restorePath, { readOnly: true });
  let reconciliation;
  try {
    reconciliation = reconcileInventoryDatabase(restored, {
      environment: 'ISOLATED_STAGING',
      candidateSha: head,
    });
  } finally {
    restored.close();
  }
  if (reconciliation.summary.disposition !== 'RECONCILED') {
    throw new Error('STAGING_BACKUP_RECONCILIATION_FAILED');
  }

  const [exportBytes] = await Promise.all([readFile(exportPath)]);
  const fingerprints = {
    stagingConfigSha256: sha256(stagingRaw),
    productionConfigSha256: sha256(productionRaw),
    exportSha256: sha256(exportBytes),
    r2MetadataSha256: sha256(JSON.stringify(r2Metadata)),
  };
  assertReleaseBackupTuple({
    exportSha256: fingerprints.exportSha256,
    isolatedRestore,
    reconciliation,
    priorWorkerDeployment: deployments[0],
    deploymentsSnapshot: deployments,
    r2Metadata,
    fingerprints,
    timeTravelBookmark: timeTravel.bookmark,
  });
  await writeFile(
    manifestPath,
    `${JSON.stringify(
      {
        schemaVersion: 1,
        environment: 'STAGING',
        releaseVersion,
        candidateSha: head,
        candidateBranch: branch,
        createdAt: new Date().toISOString(),
        target: {
          worker: staging.name,
          database: expectedDatabase,
          databaseId,
          bucketBindings: staging.r2_buckets,
          baseUrl: configValidation.safe.baseUrl,
        },
        fingerprints,
        rollback: {
          priorWorkerDeployment: deployments[0],
          deploymentsSnapshot: deployments,
          d1TimeTravel: timeTravel,
          r2Metadata,
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
      environment: 'STAGING',
      releaseVersion,
      candidateSha: head,
      workerMatch: configValidation.safe.workerMatch,
      databaseMatch: configValidation.safe.databaseMatch,
      bucketMatch: configValidation.safe.bucketMatch,
      productionIsolation: separation.valid,
      backupCaptured: true,
      isolatedRestore,
      reconciliation: reconciliation.summary,
      priorWorkerRollbackCaptured: true,
      liveR2IdentityCaptured: true,
      configurationFingerprintsCaptured: true,
      timeTravelBookmarkCaptured: true,
      backupTupleVerified: true,
      privateEvidenceWritten: true,
    })}\n`,
  );
}

main().catch((error) => {
  const safe = /^[A-Z0-9_]+$/u.test(String(error?.message ?? '')) ? error.message : 'PRIVATE_OPERATION_ERROR';
  console.error(`Staging candidate evidence failed: ${safe}`);
  process.exitCode = 1;
});
