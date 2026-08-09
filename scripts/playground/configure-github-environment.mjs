import { spawnSync } from 'node:child_process';
import { readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));
const wranglerBin = path.join(repoRoot, 'node_modules', 'wrangler', 'bin', 'wrangler.js');

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

function required(options, name) {
  const value = String(options[name] ?? '').trim();
  if (!value) throw new Error(`Missing --${name}.`);
  return value;
}

function outsideRepository(value, name) {
  const resolved = path.resolve(value);
  const relative = path.relative(repoRoot, resolved);
  if (relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative))) {
    throw new Error(`${name} must remain outside the repository.`);
  }
  return resolved;
}

function run(executable, commandArgs, { input, env = process.env } = {}) {
  const result = spawnSync(executable, commandArgs, {
    cwd: repoRoot,
    encoding: 'utf8',
    input,
    env,
    maxBuffer: 16 * 1024 * 1024,
    windowsHide: true,
  });
  if (result.status !== 0) {
    throw new Error(`${path.basename(executable)} ${commandArgs[0]} failed with exit code ${result.status}.`);
  }
  return result.stdout;
}

function wrangler(commandArgs, env = process.env) {
  return run(process.execPath, [wranglerBin, ...commandArgs], { env });
}

const options = parseArgs(process.argv.slice(2));
const repository = required(options, 'repository');
const environment = required(options, 'environment');
const manifestPath = outsideRepository(required(options, 'manifest'), 'Manifest');
const tokenPath = outsideRepository(required(options, 'token-file'), 'Token file');
const reportPath = outsideRepository(required(options, 'report'), 'Report');
if (!/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/u.test(repository)) {
  throw new Error('Repository must be an owner/name slug.');
}
if (!/^[a-z0-9][a-z0-9-]{1,80}$/u.test(environment)) {
  throw new Error('GitHub environment name is invalid.');
}

const [manifestText, tokenText] = await Promise.all([
  readFile(manifestPath, 'utf8'),
  readFile(tokenPath, 'utf8'),
]);
const manifest = JSON.parse(manifestText);
const token = tokenText.trim();
if (manifest.status !== 'READY' || !manifest.d1?.databaseId) {
  throw new Error('Private playground manifest is not READY.');
}
if (!/^[A-Za-z0-9_-]{30,}$/u.test(token)) throw new Error('Cloudflare token format is invalid.');
const whoami = wrangler(['whoami']);
const accountId = whoami.match(/\b[a-f0-9]{32}\b/iu)?.[0];
if (!accountId) throw new Error('Cloudflare account scope could not be resolved.');
async function providerCheck(apiPath, label) {
  const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/${apiPath}`, {
    headers: { authorization: `Bearer ${token}`, accept: 'application/json' },
  });
  const result = await response.json().catch(() => null);
  if (!response.ok || result?.success !== true) {
    throw new Error(`Cloudflare ${label} permission check failed with HTTP ${response.status}.`);
  }
}

await providerCheck('d1/database', 'D1');
await providerCheck('r2/buckets', 'R2');
await providerCheck('workers/scripts', 'Workers Scripts');

const gh = process.platform === 'win32' ? 'gh.exe' : 'gh';
run(gh, ['api', '--method', 'PUT', `repos/${repository}/environments/${environment}`, '--silent']);
run(gh, ['secret', 'set', 'CLOUDFLARE_API_TOKEN', '--env', environment], { input: `${token}\n` });
run(gh, ['secret', 'set', 'CLOUDFLARE_ACCOUNT_ID', '--env', environment], {
  input: `${accountId}\n`,
});
run(gh, ['secret', 'set', 'PLAYGROUND_RESOURCE_MANIFEST_B64', '--env', environment], {
  input: `${Buffer.from(manifestText, 'utf8').toString('base64')}\n`,
});

await writeFile(
  reportPath,
  `${JSON.stringify(
    {
      status: 'PASS',
      configuredAt: new Date().toISOString(),
      environment,
      providerPermissions: { workersScripts: 'PASS', d1: 'PASS', r2Storage: 'PASS' },
      secrets: ['CLOUDFLARE_API_TOKEN', 'CLOUDFLARE_ACCOUNT_ID', 'PLAYGROUND_RESOURCE_MANIFEST_B64'],
      secretValuesPrinted: false,
      tokenFileRemoved: true,
    },
    null,
    2,
  )}\n`,
  { encoding: 'utf8', flag: 'wx', mode: 0o600 },
);
await rm(tokenPath, { force: false });

console.log(
  JSON.stringify({
    status: 'PASS',
    providerPermissions: { workersScripts: 'PASS', d1: 'PASS', r2Storage: 'PASS' },
    githubEnvironment: environment,
    secretsConfigured: 3,
    secretValuesPrinted: false,
    tokenFileRemoved: true,
  }),
);
