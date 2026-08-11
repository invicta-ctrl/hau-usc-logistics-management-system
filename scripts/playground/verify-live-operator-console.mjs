import { createHash, randomBytes, randomUUID } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFile, writeFile } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import process from 'node:process';

function parseArgs(values) {
  const result = {};
  for (let index = 0; index < values.length; index += 2) {
    const key = String(values[index] ?? '').replace(/^--/u, '');
    const value = values[index + 1];
    if (!key || value === undefined) throw new Error('Every option requires a value.');
    result[key] = value;
  }
  return result;
}

function requireOption(options, name) {
  const value = String(options[name] ?? '').trim();
  if (!value) throw new Error(`Missing --${name}.`);
  return value;
}

const args = parseArgs(process.argv.slice(2));
const manifestPath = path.resolve(requireOption(args, 'manifest'));
const baselineDatabasePath = path.resolve(requireOption(args, 'baseline-database'));
const reportPath = path.resolve(requireOption(args, 'report'));
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));

function sql(value) {
  return `'${String(value).replaceAll("'", "''")}'`;
}

function digest(value) {
  return createHash('sha256').update(String(value)).digest('base64url');
}

function wranglerD1(command) {
  const executable = process.execPath;
  const wrangler = path.resolve('node_modules/wrangler/bin/wrangler.js');
  try {
    execFileSync(
      executable,
      [wrangler, 'd1', 'execute', manifest.resources.names.d1Working, '--remote', '--command', command],
      { cwd: process.cwd(), encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
    );
  } catch (error) {
    throw new Error(`Playground D1 command failed with exit code ${error.status ?? 'unknown'}.`);
  }
}

const source = new DatabaseSync(baselineDatabasePath, { readOnly: true });
const owner = source
  .prepare(
    `SELECT id, credential_version
       FROM accounts
      WHERE role_id = 'SYSTEM_OWNER'
        AND status = 'ACTIVE'
        AND onboarding_completed_at IS NOT NULL
        AND locked_at IS NULL
      ORDER BY id
      LIMIT 1`,
  )
  .get();
source.close();

if (!owner) throw new Error('No active synthetic system-owner account is available in the clean baseline.');

const sessionToken = randomBytes(32).toString('base64url');
const csrfToken = randomBytes(32).toString('base64url');
const issuedAt = new Date().toISOString();
const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
const tokenDigest = digest(sessionToken);
const sessionInsert = `INSERT INTO sessions (
  token_digest, id, kind, account_id, csrf_digest, credential_version, issued_at, expires_at
) VALUES (
  ${sql(tokenDigest)}, ${sql(`pg-live-${randomUUID()}`)}, 'AUTHENTICATED', ${sql(owner.id)},
  ${sql(digest(csrfToken))}, ${Number(owner.credential_version)}, ${sql(issuedAt)}, ${sql(expiresAt)}
);`;

const baseUrl = String(manifest.playgroundHostname).startsWith('http')
  ? String(manifest.playgroundHostname).replace(/\/$/u, '')
  : `https://${String(manifest.playgroundHostname).replace(/\/$/u, '')}`;
const headers = {
  accept: 'application/json',
  cookie: `__Host-hau_session=${encodeURIComponent(sessionToken)}`,
};
const report = {
  checkedAt: new Date().toISOString(),
  statusRoute: 'FAIL',
  safeStatusContract: 'FAIL',
  moduleSwitcher: 'FAIL',
  realLoginPath: 'FAIL',
  activeSessionRefreshGuard: 'FAIL',
  resetRequest: 'FAIL',
  productionTargetSelectorAccepted: false,
};

wranglerD1(sessionInsert);
try {
  const statusResponse = await fetch(`${baseUrl}/api/playground/status`, { headers });
  const status = await statusResponse.json().catch(() => null);
  if (!statusResponse.ok || status?.playground !== true) {
    throw new Error(`Playground status returned HTTP ${statusResponse.status}.`);
  }
  report.statusRoute = 'PASS';

  const serialized = JSON.stringify(status).toLowerCase();
  const forbidden = ['databaseid', 'database_id', 'bucketname', 'bookmark', 'account_application_identity'];
  if (forbidden.some((key) => serialized.includes(key))) {
    throw new Error('Playground status exposed a private provider identifier.');
  }
  if (
    !['PASS', 'EXCEPTIONS'].includes(status.d1BaselineParity) ||
    !['PASS', 'EXCEPTIONS'].includes(status.r2BaselineParity) ||
    status.workingSchema?.version !== manifest.baseline.schemaVersion
  ) {
    throw new Error('Playground status did not match the sealed baseline contract.');
  }
  report.safeStatusContract = 'PASS';

  if (status.moduleSwitcher?.enabled !== true || status.moduleSwitcher.modules?.length < 8) {
    throw new Error('Playground module switcher is not enabled with the expected module set.');
  }
  report.moduleSwitcher = 'PASS';
  if (status.moduleSwitcher.realLoginPath !== '/') {
    throw new Error('The real-login test path is missing.');
  }
  report.realLoginPath = 'PASS';

  const dirtyAt = new Date().toISOString();
  const dirtyState = JSON.stringify({ state: 'DIRTY', activeTestSession: true, updatedAt: dirtyAt });
  wranglerD1(
    `INSERT INTO app_metadata (key, value, updated_at) VALUES (
       'playground.working_state', ${sql(dirtyState)}, ${sql(dirtyAt)}
     ) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at;`,
  );

  const refreshResponse = await fetch(`${baseUrl}/api/playground/operation`, {
    method: 'POST',
    headers: { ...headers, 'content-type': 'application/json', 'x-csrf-token': csrfToken },
    body: JSON.stringify({
      kind: 'REFRESH_BASELINE',
      confirmation: 'REFRESH BASELINE FROM PRODUCTION',
      databaseId: 'browser-supplied-production-target-must-be-ignored',
    }),
  });
  const refresh = await refreshResponse.json().catch(() => null);
  if (refreshResponse.status !== 409 || refresh?.code !== 'PLAYGROUND_ACTIVE_SESSION_PROTECTED') {
    throw new Error('An active test session was not protected from baseline refresh.');
  }
  report.activeSessionRefreshGuard = 'PASS';

  const resetResponse = await fetch(`${baseUrl}/api/playground/operation`, {
    method: 'POST',
    headers: { ...headers, 'content-type': 'application/json', 'x-csrf-token': csrfToken },
    body: JSON.stringify({
      kind: 'RESET',
      confirmation: 'RESET PLAYGROUND',
      databaseId: 'browser-supplied-production-target-must-be-ignored',
    }),
  });
  const reset = await resetResponse.json().catch(() => null);
  if (!resetResponse.ok || reset?.accepted !== true || reset?.state !== 'RESETTING') {
    throw new Error(`Playground reset request returned HTTP ${resetResponse.status}.`);
  }
  report.resetRequest = 'PASS';
  report.productionTargetSelectorAccepted = false;
} finally {
  wranglerD1(`DELETE FROM sessions WHERE token_digest = ${sql(tokenDigest)};`);
  await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
}

if (Object.values(report).includes('FAIL')) {
  throw new Error('Live playground operator-console verification did not pass.');
}

console.log(
  JSON.stringify({
    status: 'PASS',
    statusRoute: report.statusRoute,
    safeStatusContract: report.safeStatusContract,
    moduleSwitcher: report.moduleSwitcher,
    realLoginPath: report.realLoginPath,
    activeSessionRefreshGuard: report.activeSessionRefreshGuard,
    resetRequest: report.resetRequest,
    productionTargetSelectorAccepted: report.productionTargetSelectorAccepted,
  }),
);
