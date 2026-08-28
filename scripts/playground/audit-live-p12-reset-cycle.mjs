import { readFile, realpath, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));

function inside(parent, candidate) {
  const relative = path.relative(path.resolve(parent), path.resolve(candidate));
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

async function privatePath(value, { existing }) {
  if (!path.isAbsolute(value ?? '')) throw new Error('P12 evidence paths must be absolute.');
  const resolved = existing
    ? await realpath(value)
    : path.join(await realpath(path.dirname(value)), path.basename(value));
  if (inside(repoRoot, resolved)) throw new Error('P12 evidence paths must remain outside the repository.');
  if (existing && !(await stat(resolved)).isFile()) throw new Error('P12 input evidence must be a file.');
  if (!existing) {
    try {
      await stat(resolved);
      throw new Error('P12 output evidence exists; refusing to overwrite it.');
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
    }
  }
  return resolved;
}

function requireCondition(condition, message) {
  if (!condition) throw new Error(`P12 reset-cycle verification failed: ${message}.`);
}

async function jsonRequest(url, options = {}) {
  const response = await fetch(url, options);
  return { response, payload: await response.json().catch(() => null) };
}

async function createSession(baseUrl) {
  const { response, payload } = await jsonRequest(`${baseUrl}/api/playground/session`, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      origin: baseUrl,
      referer: `${baseUrl}/`,
    },
    body: '{}',
  });
  const cookie = String(response.headers.get('set-cookie') ?? '').split(';', 1)[0];
  requireCondition(response.status === 200 && cookie, 'new Playground session was issued');
  requireCondition(payload?.state === 'AUTHENTICATED', 'new Playground session authenticated');
  requireCondition(payload?.user?.authorization?.roleId === 'SYSTEM_OWNER', 'new session is System Owner');
  return { cookie, csrfToken: String(payload.csrfToken ?? '') };
}

async function authenticatedJson(baseUrl, endpoint, session, { method = 'GET', body } = {}) {
  const headers = { accept: 'application/json', cookie: session.cookie };
  if (body !== undefined) {
    headers['content-type'] = 'application/json';
    headers['x-csrf-token'] = session.csrfToken;
  }
  return jsonRequest(`${baseUrl}${endpoint}`, {
    method,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });
}

async function assertOldSessionInvalid(baseUrl, canaryPath) {
  const canary = JSON.parse(await readFile(canaryPath, 'utf8'));
  const { response } = await authenticatedJson(baseUrl, '/api/bootstrap/overview', canary);
  requireCondition(response.status === 401, 'pre-reset session is invalid');
}

async function coreRouteSmoke(baseUrl, session) {
  const root = await fetch(baseUrl, { headers: { accept: 'text/html' } });
  requireCondition(root.status === 200, 'application root is available');
  const modules = ['overview', 'request', 'inventory', 'lending', 'release', 'restocking', 'procurement'];
  const moduleResults = await Promise.all(
    modules.map((module) =>
      authenticatedJson(baseUrl, `/api/bootstrap/${module}?page=1&pageSize=25`, session),
    ),
  );
  requireCondition(
    moduleResults.every(({ response }) => response.status === 200),
    'core modules load',
  );
  const events = await authenticatedJson(baseUrl, '/api/getEventManagement', session, {
    method: 'POST',
    body: {},
  });
  requireCondition(events.response.status === 200, 'Events loads');
  const accounts = await authenticatedJson(baseUrl, '/api/admin/accounts?page=1&pageSize=25', session);
  requireCondition(accounts.response.status === 200, 'Administration loads');
  const evidence = await authenticatedJson(baseUrl, '/api/owner/evidence/status', session, {
    method: 'POST',
    body: {},
  });
  requireCondition(evidence.response.status === 200, 'evidence status loads');
  requireCondition(
    evidence.payload?.storage?.googleDrive !== 'CONFIGURED' &&
      evidence.payload?.storage?.evidenceR2 === 'AVAILABLE',
    'Google remains disabled and evidence R2 remains available',
  );
  return { root: 200, moduleCount: modules.length, events: 200, administration: 200 };
}

const [mode, manifestArg, inputArg, outputArg, reportArg] = process.argv.slice(2);
if (!['stage', 'verify-and-stage', 'verify-final'].includes(mode)) {
  throw new Error('P12 mode must be stage, verify-and-stage, or verify-final.');
}
const manifestPath = await privatePath(manifestArg, { existing: true });
const reportPath = await privatePath(reportArg, { existing: false });
const inputPath = inputArg === '-' ? '' : await privatePath(inputArg, { existing: true });
const outputPath = outputArg === '-' ? '' : await privatePath(outputArg, { existing: false });
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
const hostname = String(manifest.playgroundHostname ?? '')
  .replace(/^https?:\/\//u, '')
  .replace(/\/$/u, '');
requireCondition(
  manifest.status === 'READY' && hostname && hostname !== 'logistics.hausc.org',
  'manifest identifies isolated Playground',
);
const baseUrl = `https://${hostname}`;
const report = {
  status: 'PASS',
  checkedAt: new Date().toISOString(),
  mode,
  target: 'PLAYGROUND',
  productionMutation: 'NONE',
  googleMutation: 'NONE',
  oldSessionInvalid: false,
  newEntry: false,
  coreRouteSmoke: null,
};

if (inputPath) {
  await assertOldSessionInvalid(baseUrl, inputPath);
  report.oldSessionInvalid = true;
  await rm(inputPath, { force: true });
}
if (outputPath) {
  const session = await createSession(baseUrl);
  report.newEntry = true;
  report.coreRouteSmoke = await coreRouteSmoke(baseUrl, session);
  await writeFile(outputPath, `${JSON.stringify(session)}\n`, { flag: 'wx', mode: 0o600 });
} else {
  const [root, health, readiness, version] = await Promise.all([
    fetch(baseUrl),
    jsonRequest(`${baseUrl}/api/health`),
    jsonRequest(`${baseUrl}/api/readiness`),
    jsonRequest(`${baseUrl}/api/version`),
  ]);
  requireCondition(root.status === 200, 'final application root is available');
  requireCondition(health.response.status === 200 && health.payload?.ok === true, 'final health passes');
  requireCondition(
    readiness.response.status === 200 && readiness.payload?.ready === true,
    'final readiness passes',
  );
  requireCondition(version.payload?.playground === true, 'final runtime remains Playground');
  report.coreRouteSmoke = { root: 200, health: 200, readiness: 200, playground: true };
}

await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
console.log(`P12 reset-cycle ${mode}: PASS`);
console.log('Private session material and provider identities were not printed.');
