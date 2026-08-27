import { spawnSync } from 'node:child_process';
import { readFile, realpath, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));
const wranglerBin = path.join(repoRoot, 'node_modules', 'wrangler', 'bin', 'wrangler.js');

function inside(parent, candidate) {
  const relative = path.relative(path.resolve(parent), path.resolve(candidate));
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function wrangler(args, { json = false } = {}) {
  const result = spawnSync(process.execPath, [wranglerBin, ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
    maxBuffer: 8 * 1024 * 1024,
    windowsHide: true,
  });
  if (result.status !== 0) throw new Error('Playground reset-point provider command failed.');
  return json ? JSON.parse(result.stdout) : result.stdout;
}

function bookmarkFrom(value) {
  if (!value || typeof value !== 'object') return '';
  for (const [key, child] of Object.entries(value)) {
    if (/bookmark/iu.test(key) && typeof child === 'string' && child.length >= 8) return child;
    const nested = bookmarkFrom(child);
    if (nested) return nested;
  }
  return '';
}

function validWorkersDevHostname(value) {
  return (
    typeof value === 'string' &&
    /^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9-]+\.workers\.dev$/u.test(value) &&
    !/(?:replace|placeholder|unknown|tbd)/iu.test(value)
  );
}

function preservedPlaygroundHostname() {
  const deployments = wrangler(['deployments', 'list', '--env', 'staging', '--json'], { json: true });
  for (const deployment of deployments) {
    for (const version of deployment.versions ?? []) {
      const detail = wrangler(['versions', 'view', version.version_id, '--env', 'staging', '--json'], {
        json: true,
      });
      const hostname = detail?.resources?.bindings?.find(
        (entry) => entry.name === 'RECOVERY_HOSTNAME' && typeof entry.text === 'string',
      )?.text;
      if (validWorkersDevHostname(hostname)) return hostname;
      const fallback = detail?.resources?.bindings?.find(
        (entry) => entry.name === 'RECOVERY_HOSTNAME' && typeof entry.value === 'string',
      )?.value;
      if (validWorkersDevHostname(fallback)) return fallback;
    }
  }
  return '';
}

function preservedIdentityClasses() {
  const deployments = wrangler(['deployments', 'list', '--env', 'staging', '--json'], { json: true });
  for (const deployment of deployments) {
    for (const version of deployment.versions ?? []) {
      const detail = wrangler(['versions', 'view', version.version_id, '--env', 'staging', '--json'], {
        json: true,
      });
      const value = detail?.resources?.bindings?.find(
        (entry) => entry.name === 'ACCOUNT_APPLICATION_IDENTITY_CLASSES_JSON' && typeof entry.text === 'string',
      )?.text;
      try {
        const parsed = JSON.parse(value ?? '');
        if (Array.isArray(parsed) && parsed.length) return value;
      } catch {
        // Continue through preserved versions without printing private configuration.
      }
    }
  }
  return '';
}

async function run() {
  const input = process.argv[2];
  if (!path.isAbsolute(input ?? '')) throw new Error('Manifest path must be absolute.');
  const manifestPath = await realpath(input);
  if (inside(repoRoot, manifestPath) || !(await stat(manifestPath)).isFile()) {
    throw new Error('Manifest must be a private file outside the repository.');
  }
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  if (manifest.status !== 'READY' || !/^[0-9a-f-]{36}$/u.test(manifest.d1?.databaseId ?? '')) {
    throw new Error('Playground resource manifest is not ready.');
  }
  const verification = wrangler(
    [
      'd1',
      'execute',
      manifest.d1.databaseId,
      '--remote',
      '--command',
      "SELECT value FROM app_metadata WHERE key IN ('operational_schema_version','playground.clean_baseline','playground.working_state'); SELECT name FROM d1_migrations ORDER BY id DESC LIMIT 1; PRAGMA foreign_key_check;",
      '--json',
    ],
    { json: true },
  );
  const serialized = JSON.stringify(verification);
  if (
    !serialized.includes('0032_staff_account_activity_history.sql') ||
    !serialized.includes('sourceProductionVersion') ||
    !serialized.includes('CLEAN')
  ) {
    throw new Error('Playground D1 is not a verified clean baseline.');
  }
  const info = wrangler(['d1', 'time-travel', 'info', manifest.d1.databaseId, '--json'], { json: true });
  const bookmark = bookmarkFrom(info);
  if (!bookmark) throw new Error('Playground clean D1 bookmark was not returned.');
  manifest.d1.cleanBaselineBookmark = bookmark;
  manifest.d1.cleanBaselineBookmarkCapturedAt = new Date().toISOString();
  const baselineReportPath = path.join(path.dirname(manifestPath), 'playground-clean-baseline-report.json');
  const baselineReport = JSON.parse(await readFile(baselineReportPath, 'utf8'));
  manifest.baseline = {
    sourceProductionVersion: baselineReport.sourceProductionVersion,
    sourceProductionSha: baselineReport.sourceProductionSha,
    capturedAt: baselineReport.capturedAt,
    schemaVersion: String(baselineReport.operationalSchema),
    latestMigration: baselineReport.latestMigration,
    parityExceptions: baselineReport.parityExceptions,
  };
  const hostname = preservedPlaygroundHostname();
  if (!hostname) throw new Error('A preserved valid playground hostname was not found in Worker history.');
  manifest.playgroundHostname = hostname;
  const identityClasses = preservedIdentityClasses();
  if (!identityClasses) throw new Error('Preserved playground identity-class configuration was not found.');
  manifest.playgroundRequiredVars = {
    ACCOUNT_APPLICATION_IDENTITY_CLASSES_JSON: identityClasses,
  };
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, { mode: 0o600 });
  console.log('Playground D1 clean reset point: CAPTURED AND VERIFIED');
  console.log('The private bookmark, database identity, and resource names were not printed.');
}

run().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
