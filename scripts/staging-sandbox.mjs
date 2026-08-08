import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseJsonConfig } from './cloudflare-environment-preflight.mjs';
import {
  assertSandboxMutationReady,
  summarizeSandboxClassification,
  validateStagingSandboxConfig,
} from './staging-sandbox-lib.mjs';

const repoRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const TABLES = Object.freeze([
  ['accounts', "id LIKE 'SBX-%' OR id = 'SYSTEM-IMPORT'"],
  ['requests', "id LIKE 'SBX-%'"],
  ['inventory_items', "id LIKE 'SBX-%'"],
  ['events', "id LIKE 'SBX-%'"],
  ['reservations', "id LIKE 'SBX-%'"],
  ['lending_tickets', "id LIKE 'SBX-%'"],
  ['deliverables', "id LIKE 'SBX-%'"],
]);

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
  const parsed = JSON.parse(output);
  if (!parsed?.[0]?.success) throw new Error('Remote staging classification query failed.');
  return parsed[0].results ?? [];
}

function classify(configPath) {
  return summarizeSandboxClassification(
    TABLES.flatMap(([entity, syntheticPredicate]) => {
      const [row] = runWrangler(
        configPath,
        `SELECT ${JSON.stringify(entity)} AS entity, COUNT(*) AS total, ` +
          `COALESCE(SUM(CASE WHEN ${syntheticPredicate} THEN 0 ELSE 1 END), 0) AS non_synthetic ` +
          `FROM ${entity}`,
      );
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
  const configPath = argument('--config');
  if (!path.isAbsolute(configPath ?? '')) throw new Error('An absolute private --config path is required.');
  const config = parseJsonConfig(await readFile(configPath, 'utf8'));
  const head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repoRoot, encoding: 'utf8' }).trim();
  const branch = execFileSync('git', ['branch', '--show-current'], {
    cwd: repoRoot,
    encoding: 'utf8',
  }).trim();
  const configResult = validateStagingSandboxConfig(config, {
    configPath,
    repoRoot,
    head,
    branch,
    command,
  });
  if (!configResult.valid) {
    throw new Error(`Sandbox ${command} refused: ${configResult.issues.join(', ')}`);
  }
  const classification = classify(configPath);
  const runtime = await runtimeStatus(configResult.safe.baseUrl.replace(/\/$/u, ''));
  const runtimeMatch =
    runtime.versionStatus === 200 &&
    runtime.environment === 'STAGING' &&
    runtime.candidateSha === configResult.safe.candidateSha &&
    runtime.schemaVersion === '30' &&
    runtime.latestMigration === '0030_production_access_and_operations.sql';
  const status = {
    environment: runtime.environment,
    appVersion: runtime.appVersion,
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
  };
  process.stdout.write(`${JSON.stringify(status, null, 2)}\n`);
  if (command !== 'status') {
    if (!runtimeMatch) throw new Error(`Sandbox ${command} refused: RUNTIME_IDENTITY_MISMATCH`);
    assertSandboxMutationReady({ configResult, classification, command });
    throw new Error(
      `Sandbox ${command} stopped after guards: an owner-reviewed lifecycle manifest is required before mutation.`,
    );
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
