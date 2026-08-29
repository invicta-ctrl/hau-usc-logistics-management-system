import { spawnSync } from 'node:child_process';
import { readFile, realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { d1Rows } from './reset-workspace.mjs';

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
    maxBuffer: 16 * 1024 * 1024,
    windowsHide: true,
  });
  if (result.status !== 0) throw new Error(`Playground D1 inspection failed (${args[0]}).`);
  return json ? JSON.parse(result.stdout) : result.stdout;
}

function hasBookmark(value) {
  if (!value || typeof value !== 'object') return false;
  return Object.entries(value).some(
    ([key, child]) =>
      (/bookmark/iu.test(key) && typeof child === 'string' && child.length >= 8) || hasBookmark(child),
  );
}

const manifestArg = process.argv[2];
if (!path.isAbsolute(manifestArg ?? '')) throw new Error('Manifest path must be absolute.');
const manifestPath = await realpath(manifestArg);
if (inside(repoRoot, manifestPath) || !(await stat(manifestPath)).isFile()) {
  throw new Error('Manifest must be a private file outside the repository.');
}
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
const databaseId = manifest.d1?.databaseId;
const databaseName = manifest.resources?.names?.d1Working;
const sealedBookmark = manifest.d1?.cleanBaselineBookmark;
const sealedBookmarkCapturedAt = String(manifest.d1?.cleanBaselineBookmarkCapturedAt ?? '');
if (manifest.status !== 'READY' || !databaseId || !databaseName) {
  throw new Error('Private Playground manifest is not ready.');
}
const inventory = wrangler(['d1', 'list', '--json'], { json: true });
const exact = inventory.find((entry) => entry.name === databaseName);
if ((exact?.uuid ?? exact?.id) !== databaseId) {
  throw new Error('Fixed Playground D1 identity mismatch.');
}

const sql = `SELECT
  (SELECT value FROM app_metadata WHERE key='operational_schema_version') AS schema_version,
  (SELECT name FROM d1_migrations ORDER BY id DESC LIMIT 1) AS latest_migration,
  (SELECT value FROM app_metadata WHERE key='playground.baseline_id') AS baseline_id,
  (SELECT value FROM app_metadata WHERE key='playground.baseline_version') AS baseline_version,
  (SELECT value FROM app_metadata WHERE key='playground.working_state') AS working_state,
  (SELECT value FROM app_metadata WHERE key='playground.reset_generation') AS reset_generation,
  (SELECT COUNT(*) FROM sessions) AS sessions,
  (SELECT COUNT(*) FROM sessions) + (SELECT COUNT(*) FROM password_reset_tokens) +
    (SELECT COUNT(*) FROM auth_rate_limits) + (SELECT COUNT(*) FROM auth_rate_limit_events) +
    (SELECT COUNT(*) FROM email_verification_challenges) + (SELECT COUNT(*) FROM account_applications) +
    (SELECT COUNT(*) FROM account_application_history) + (SELECT COUNT(*) FROM public_request_rate_limit_events) +
    (SELECT COUNT(*) FROM public_lending_rate_limit_events) + (SELECT COUNT(*) FROM reporting_outbox) AS transient_total,
  (SELECT COUNT(*) FROM pragma_foreign_key_check) AS foreign_key_violations;`;
const row = d1Rows(
  wrangler(['d1', 'execute', databaseId, '--remote', '--command', sql, '--json'], { json: true }),
)[0];
if (!row) throw new Error('Playground D1 inspection returned no row.');
const timeTravel = wrangler(['d1', 'time-travel', 'info', databaseId, '--json'], { json: true });
let sealedTimestampResolvable = false;
if (sealedBookmarkCapturedAt) {
  const timestampInfo = spawnSync(
    process.execPath,
    [
      wranglerBin,
      'd1',
      'time-travel',
      'info',
      databaseId,
      '--timestamp',
      sealedBookmarkCapturedAt,
      '--json',
    ],
    {
      cwd: repoRoot,
      encoding: 'utf8',
      maxBuffer: 16 * 1024 * 1024,
      windowsHide: true,
    },
  );
  if (timestampInfo.status === 0) {
    sealedTimestampResolvable = hasBookmark(JSON.parse(timestampInfo.stdout));
  }
}

process.stdout.write(
  `${JSON.stringify({
    status: 'PASS',
    fixedIdentity: true,
    schemaVersion: String(row.schema_version ?? ''),
    latestMigration: String(row.latest_migration ?? ''),
    baselineId: String(row.baseline_id ?? ''),
    baselineVersion: Number(row.baseline_version ?? 0),
    workingState: JSON.parse(String(row.working_state ?? '{}')),
    resetGeneration: Number(row.reset_generation ?? 0),
    sessions: Number(row.sessions ?? 0),
    transientTotal: Number(row.transient_total ?? 0),
    foreignKeyViolations: Number(row.foreign_key_violations ?? 0),
    reversibleBookmarkAvailable: hasBookmark(timeTravel),
    sealedBookmarkPresent: typeof sealedBookmark === 'string' && sealedBookmark.length >= 8,
    sealedBookmarkType: typeof sealedBookmark,
    sealedBookmarkLength: typeof sealedBookmark === 'string' ? sealedBookmark.length : 0,
    sealedBookmarkCapturedAt,
    sealedTimestampResolvable,
  })}\n`,
);
