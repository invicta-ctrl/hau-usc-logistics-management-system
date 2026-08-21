import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseJsonConfig } from './cloudflare-environment-preflight.mjs';
import { restoreAndVerifyD1Export } from './d1/verify-d1-export.mjs';
import {
  SANDBOX_CLASSIFICATION_RULES,
  assertSandboxMutationReady,
  exactDatabaseIdFromInventory,
  parseWranglerJsonOutput,
  readPackageReleaseVersion,
  RELEASE_MIGRATION,
  RELEASE_SCHEMA_VERSION,
  safeSandboxErrorMessage,
  sandboxClassificationQuery,
  summarizeSandboxClassification,
  validateReleaseCandidateIdentity,
  validateStagingSandboxConfig,
  waitForSandboxLifecycleState,
} from './staging-sandbox-lib.mjs';
import {
  buildSandboxArchiveSql,
  buildSandboxSeedSql,
  createSandboxCredentials,
  sandboxSeedSummary,
} from './staging-sandbox-lifecycle.mjs';
import { parseAccountApplicationStagingIdentityFixture } from '../src/server/account-application/adapters.js';
import { parseExactRecipientAllowlist } from '../src/server/account-application/email-provider-registry.js';
import { resolvePrivatePath } from './private-path.mjs';

const repoRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
function argument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : '';
}

function runWrangler(configPath, sql) {
  const executable = path.join(repoRoot, 'node_modules', 'wrangler', 'bin', 'wrangler.js');
  const output = execFileSync(
    process.execPath,
    [executable, 'd1', 'execute', 'DB', '--remote', '--config', configPath, '--command', sql, '--json'],
    { cwd: repoRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true },
  );
  const parsed = parseWranglerJsonOutput(output);
  if (!parsed?.[0]?.success) throw new Error('Remote staging classification query failed.');
  return parsed[0].results ?? [];
}

function runWranglerFile(configPath, filePath, extra = []) {
  const executable = path.join(repoRoot, 'node_modules', 'wrangler', 'bin', 'wrangler.js');
  const output = execFileSync(
    process.execPath,
    [executable, 'd1', 'execute', 'DB', ...extra, '--config', configPath, '--file', filePath, '--json'],
    { cwd: repoRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true },
  );
  const parsed = parseWranglerJsonOutput(output);
  if (!Array.isArray(parsed) || parsed.some((entry) => entry?.success !== true)) {
    throw new Error('Staging sandbox lifecycle SQL failed.');
  }
  return parsed;
}

function sandboxMetadata(configPath) {
  const rows = runWrangler(
    configPath,
    "SELECT key, value FROM app_metadata WHERE key IN ('sandbox_seed_version', 'sandbox_generation', 'sandbox_scope')",
  );
  return Object.fromEntries(rows.map((row) => [String(row.key), String(row.value)]));
}

async function privateSecretPackage(packagePath) {
  const resolved = await resolvePrivatePath(packagePath, {
    repoRoot,
    label: 'Secret package',
  });
  const source = JSON.parse(await readFile(resolved, 'utf8'));
  const pepper = source?.secrets?.PASSWORD_PEPPER;
  const fixture = parseAccountApplicationStagingIdentityFixture(
    source?.secrets?.ACCOUNT_APPLICATION_STAGING_IDENTITY_FIXTURE_JSON,
  );
  const allowlist = parseExactRecipientAllowlist(
    source?.secrets?.ACCOUNT_APPLICATION_EMAIL_RECIPIENT_ALLOWLIST_JSON,
  );
  if (
    source?.environment !== 'STAGING' ||
    typeof pepper !== 'string' ||
    pepper.length < 16 ||
    fixture.length !== 1 ||
    allowlist?.length !== 1 ||
    allowlist[0] !== fixture[0].institutionalEmail
  ) {
    throw new Error('Private staging secret package is incomplete or mismatched.');
  }
  return { resolved, pepper, identityFixtureCount: fixture.length };
}

async function writeLifecycleFiles({ privateDirectory, generation, pepper, archiveGeneration = 0 }) {
  const directory = await resolvePrivatePath(privateDirectory, {
    repoRoot,
    label: 'Private lifecycle directory',
    kind: 'directory',
    allowMissing: true,
  });
  await mkdir(directory, { recursive: true });
  const now = new Date().toISOString();
  const credentials = await createSandboxCredentials({ generation, pepper });
  const label = `g${String(generation).padStart(4, '0')}`;
  const seedPath = path.join(directory, `sandbox-seed-${label}.sql`);
  const credentialsPath = path.join(directory, `sandbox-credentials-${label}.json`);
  const writes = [
    writeFile(seedPath, buildSandboxSeedSql({ generation, now, credentials }), {
      flag: 'wx',
      mode: 0o600,
    }),
    writeFile(
      credentialsPath,
      `${JSON.stringify(
        {
          schemaVersion: 1,
          environment: 'STAGING',
          generation,
          createdAt: now,
          accounts: Object.fromEntries(
            Object.entries(credentials).map(([key, entry]) => [
              key,
              { accountId: entry.accountId, accessId: entry.accessId, password: entry.password },
            ]),
          ),
        },
        null,
        2,
      )}\n`,
      { flag: 'wx', mode: 0o600 },
    ),
  ];
  let archivePath = '';
  if (archiveGeneration > 0) {
    archivePath = path.join(directory, `sandbox-archive-g${String(archiveGeneration).padStart(4, '0')}.sql`);
    writes.push(
      writeFile(archivePath, buildSandboxArchiveSql({ generation: archiveGeneration, now }), {
        flag: 'wx',
        mode: 0o600,
      }),
    );
  }
  await Promise.all(writes);
  return { seedPath, credentialsPath, archivePath, now };
}

async function captureAndVerifyBackup(configPath, privateDirectory, head, databaseId) {
  const directory = await resolvePrivatePath(privateDirectory, {
    repoRoot,
    label: 'Private lifecycle directory',
    kind: 'directory',
    allowMissing: true,
  });
  await mkdir(directory, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/gu, '-');
  const exportPath = path.join(directory, `sandbox-backup-${stamp}.sql`);
  const restoreDirectory = path.join(directory, `restore-proof-${stamp}`);
  const executable = path.join(repoRoot, 'node_modules', 'wrangler', 'bin', 'wrangler.js');
  execFileSync(
    process.execPath,
    [executable, 'd1', 'export', 'DB', '--remote', '--config', configPath, '--output', exportPath],
    { cwd: repoRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true },
  );
  await mkdir(restoreDirectory, { recursive: true });
  const exportBytes = await readFile(exportPath);
  const isolatedRestore = await restoreAndVerifyD1Export(
    exportPath,
    path.join(restoreDirectory, 'restored.sqlite'),
    {
      expectedSchema: RELEASE_SCHEMA_VERSION,
      expectedMigration: RELEASE_MIGRATION,
      requireImmutableHistory: true,
    },
  );
  await writeFile(
    path.join(directory, `sandbox-backup-manifest-${stamp}.json`),
    `${JSON.stringify(
      {
        schemaVersion: 1,
        environment: 'STAGING',
        candidateSha: head,
        databaseId,
        createdAt: new Date().toISOString(),
        exportSha256: createHash('sha256').update(exportBytes).digest('hex'),
        isolatedRestore,
      },
      null,
      2,
    )}\n`,
    { flag: 'wx', mode: 0o600 },
  );
  return isolatedRestore;
}

function expectedDatabaseId(configPath) {
  const executable = path.join(repoRoot, 'node_modules', 'wrangler', 'bin', 'wrangler.js');
  const output = execFileSync(
    process.execPath,
    [executable, 'd1', 'list', '--config', configPath, '--json'],
    { cwd: repoRoot, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true },
  );
  const identifier = exactDatabaseIdFromInventory(
    parseWranglerJsonOutput(output),
    'hau-usc-logistics-staging-sandbox-v0721',
  );
  if (!identifier) throw new Error('Exact staging D1 identity could not be verified.');
  return identifier;
}

function classify(configPath) {
  return summarizeSandboxClassification(
    SANDBOX_CLASSIFICATION_RULES.flatMap((rule) => {
      const [row] = runWrangler(configPath, sandboxClassificationQuery(rule));
      return row ? [row] : [];
    }),
  );
}

async function runtimeStatus(baseUrl) {
  const headers = { 'cache-control': 'no-cache, no-store', pragma: 'no-cache' };
  const [versionResponse, readinessResponse] = await Promise.all([
    fetch(`${baseUrl}/api/version?status=${Date.now()}`, { headers }),
    fetch(`${baseUrl}/api/readiness?status=${Date.now()}`, { headers }),
  ]);
  const [version, readiness] = await Promise.all([
    versionResponse.json().catch(() => null),
    readinessResponse.json().catch(() => null),
  ]);
  return {
    versionStatus: versionResponse.status,
    readinessStatus: readinessResponse.status,
    environment: version?.environment ?? '',
    appVersion: version?.appVersion ?? '',
    releaseVersion: version?.releaseVersion ?? '',
    candidateSha: version?.candidateSha ?? '',
    schemaVersion: version?.database?.schemaVersion ?? readiness?.database?.schemaVersion ?? '',
    latestMigration: version?.database?.latestMigration ?? readiness?.database?.latestMigration ?? '',
    ready: readiness?.ready === true,
    protectedConfiguration: readiness?.dependencies?.protectedConfiguration === true,
  };
}

async function main() {
  const command = String(process.argv[2] ?? '')
    .trim()
    .toLowerCase();
  if (!['status', 'seed', 'reset'].includes(command)) {
    throw new Error('Usage: staging-sandbox.mjs <status|seed|reset> --config <absolute-private-config>');
  }
  const configPath = await resolvePrivatePath(argument('--config'), {
    repoRoot,
    label: 'Staging config',
  });
  const config = parseJsonConfig(await readFile(configPath, 'utf8'));
  const head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repoRoot, encoding: 'utf8' }).trim();
  const branch = execFileSync('git', ['branch', '--show-current'], {
    cwd: repoRoot,
    encoding: 'utf8',
  }).trim();
  const releaseVersion = await readPackageReleaseVersion(repoRoot);
  const releaseIdentity = validateReleaseCandidateIdentity(config, {
    releaseVersion,
    head,
    branch,
    mode: 'staging',
  });
  if (!releaseIdentity.valid) {
    throw new Error(`Sandbox ${command} refused: ${releaseIdentity.issues.join(', ')}`);
  }
  const stagingDatabaseId = expectedDatabaseId(configPath);
  const configResult = validateStagingSandboxConfig(config, {
    configPath,
    repoRoot,
    releaseVersion,
    head,
    branch,
    command,
    expectedDatabaseId: stagingDatabaseId,
  });
  if (!configResult.valid) {
    throw new Error(`Sandbox ${command} refused: ${configResult.issues.join(', ')}`);
  }
  const classification = classify(configPath);
  const metadata = sandboxMetadata(configPath);
  const runtime = await runtimeStatus(configResult.safe.baseUrl.replace(/\/$/u, ''));
  const runtimeMatch =
    runtime.versionStatus === 200 &&
    runtime.environment === 'STAGING' &&
    runtime.appVersion === releaseVersion &&
    runtime.releaseVersion === releaseVersion &&
    runtime.candidateSha === configResult.safe.candidateSha &&
    runtime.schemaVersion === RELEASE_SCHEMA_VERSION &&
    runtime.latestMigration === RELEASE_MIGRATION;
  const status = {
    environment: runtime.environment,
    appVersion: runtime.appVersion,
    releaseVersion: runtime.releaseVersion,
    candidateSha: runtime.candidateSha,
    candidateBranch: configResult.safe.candidateBranch,
    schemaVersion: runtime.schemaVersion,
    latestMigration: runtime.latestMigration,
    ready: runtime.ready,
    protectedConfiguration: runtime.protectedConfiguration,
    runtimeMatch,
    workerMatch: configResult.safe.workerMatch,
    databaseMatch: configResult.safe.databaseMatch,
    bucketMatch: configResult.safe.bucketMatch,
    allowlistConfigured: configResult.safe.allowlistCount > 0,
    allowlistCount: configResult.safe.allowlistCount,
    syntheticClassification: classification.rows,
    resetEligible: classification.resetEligible,
    seedVersion: metadata.sandbox_seed_version ?? '',
    sandboxGeneration: Number(metadata.sandbox_generation ?? 0),
    syntheticOnly: metadata.sandbox_scope === 'SYNTHETIC_ONLY',
  };
  process.stdout.write(`${JSON.stringify(status, null, 2)}\n`);
  if (command !== 'status') {
    if (!runtimeMatch) throw new Error(`Sandbox ${command} refused: RUNTIME_IDENTITY_MISMATCH`);
    assertSandboxMutationReady({ configResult, classification, command });
    const privateDirectory = argument('--private-dir');
    const { pepper } = await privateSecretPackage(argument('--secret-package'));
    const currentGeneration = Number(metadata.sandbox_generation ?? 0);
    if (command === 'seed' && currentGeneration !== 0) {
      throw new Error('Sandbox seed refused: SANDBOX_ALREADY_SEEDED');
    }
    const nextGeneration = command === 'reset' ? currentGeneration + 1 : 1;
    if (command === 'reset' && currentGeneration < 1) {
      throw new Error('Sandbox reset refused: SANDBOX_NOT_SEEDED');
    }
    const lifecycle = await writeLifecycleFiles({
      privateDirectory,
      generation: nextGeneration,
      pepper,
      archiveGeneration: command === 'reset' ? currentGeneration : 0,
    });
    let recovery = null;
    if (command === 'reset') {
      recovery = await captureAndVerifyBackup(
        configPath,
        privateDirectory,
        head,
        expectedDatabaseId(configPath),
      );
      runWranglerFile(configPath, lifecycle.archivePath, ['--remote']);
    }
    runWranglerFile(configPath, lifecycle.seedPath, ['--remote']);
    const { classification: after, metadata: afterMetadata } = await waitForSandboxLifecycleState(
      () => ({ classification: classify(configPath), metadata: sandboxMetadata(configPath) }),
      nextGeneration,
    );
    process.stdout.write(
      `${JSON.stringify(
        {
          command,
          environment: 'STAGING',
          candidateSha: head,
          candidateBranch: branch,
          schemaVersion: runtime.schemaVersion,
          latestMigration: runtime.latestMigration,
          ...sandboxSeedSummary(nextGeneration),
          syntheticOnly: afterMetadata.sandbox_scope === 'SYNTHETIC_ONLY',
          resetEligible: after.resetEligible,
          isolatedRestore: recovery,
          credentialsWrittenPrivately: true,
        },
        null,
        2,
      )}\n`,
    );
  }
}

main().catch((error) => {
  console.error(safeSandboxErrorMessage(error));
  process.exitCode = 1;
});
