import { randomBytes } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { readFile, realpath, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));
const wranglerBin = path.join(repoRoot, 'node_modules', 'wrangler', 'bin', 'wrangler.js');

function inside(parent, candidate) {
  const relative = path.relative(path.resolve(parent), path.resolve(candidate));
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

async function privatePath(value, { existing }) {
  if (!path.isAbsolute(value ?? '')) throw new Error('Fingerprint paths must be absolute.');
  const parent = await realpath(existing ? value : path.dirname(value));
  const resolved = existing ? parent : path.join(parent, path.basename(value));
  if (inside(repoRoot, resolved)) throw new Error('Fingerprint paths must remain outside the repository.');
  if (existing && !(await stat(resolved)).isFile()) throw new Error('Fingerprint manifest must be a file.');
  if (!existing) {
    try {
      await stat(resolved);
      throw new Error('Fingerprint report exists; refusing to overwrite it.');
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
    }
  }
  return resolved;
}

function wrangler(args) {
  const result = spawnSync(process.execPath, [wranglerBin, ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
    windowsHide: true,
  });
  if (result.status !== 0) throw new Error(`R2 fingerprint provider command failed (${args[0]}).`);
  return result.stdout;
}

function binding(config, name) {
  return (config?.r2_buckets ?? []).find((entry) => entry.binding === name);
}

const [manifestArg, reportArg] = process.argv.slice(2);
const manifestPath = await privatePath(manifestArg, { existing: true });
const reportPath = await privatePath(reportArg, { existing: false });
const [manifest, rootConfig] = await Promise.all([
  readFile(manifestPath, 'utf8').then(JSON.parse),
  readFile(path.join(repoRoot, 'wrangler.jsonc'), 'utf8').then(JSON.parse),
]);
const production = rootConfig.env?.production;
const brand = binding(production, 'BRAND_ASSETS');
const evidence = binding(production, 'EVIDENCE_ASSETS');
const playgroundNames = new Set(Object.values(manifest.resources?.names ?? {}));
if (
  manifest.status !== 'READY' ||
  production?.vars?.ENVIRONMENT !== 'PRODUCTION' ||
  !brand?.bucket_name ||
  !evidence?.bucket_name ||
  playgroundNames.has(brand.bucket_name) ||
  playgroundNames.has(evidence.bucket_name)
) {
  throw new Error('Production R2 read-only fingerprint target failed environment separation.');
}

const token = randomBytes(32).toString('base64url');
const configPath = path.join(path.dirname(reportPath), `r2-readonly-${Date.now()}.private.jsonc`);
const config = {
  name: `hau-usc-logistics-pg-r2-readonly-${Date.now()}`,
  main: path.join(repoRoot, 'scripts', 'playground', 'r2-readonly-fingerprint-worker.js'),
  compatibility_date: '2026-03-17',
  workers_dev: true,
  preview_urls: false,
  r2_buckets: [
    { binding: 'PRODUCTION_BRAND', bucket_name: brand.bucket_name },
    { binding: 'PRODUCTION_EVIDENCE', bucket_name: evidence.bucket_name },
  ],
  vars: {
    READ_ONLY_LABEL: 'PLAYGROUND_PRODUCTION_SOURCE_READ_ONLY',
    READ_TOKEN: token,
  },
};
await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
let deployed = false;
let fingerprint;
let rejection = { http: 0, json: false, statusPass: false, mutationNone: false, hashesValid: false };
try {
  const deployment = wrangler(['deploy', '--config', configPath]);
  deployed = true;
  const workerUrl = deployment.match(/https:\/\/[^\s]+\.workers\.dev/iu)?.[0];
  if (!workerUrl) throw new Error('Temporary read-only Worker URL was not returned.');
  for (let attempt = 1; attempt <= 15; attempt += 1) {
    const response = await fetch(`${workerUrl}/fingerprint?attempt=${attempt}-${Date.now()}`, {
      headers: { authorization: `Bearer ${token}`, 'cache-control': 'no-cache' },
    });
    const candidate = await response.json().catch(() => null);
    rejection = {
      http: response.status,
      json: candidate !== null,
      statusPass: candidate?.status === 'PASS',
      mutationNone: candidate?.productionMutation === 'NONE',
      hashesValid:
        /^[0-9a-f]{64}$/u.test(candidate?.brand?.hash ?? '') &&
        /^[0-9a-f]{64}$/u.test(candidate?.evidence?.hash ?? ''),
    };
    if (
      response.ok &&
      candidate?.status === 'PASS' &&
      candidate?.productionMutation === 'NONE' &&
      /^[0-9a-f]{64}$/u.test(candidate?.brand?.hash ?? '') &&
      /^[0-9a-f]{64}$/u.test(candidate?.evidence?.hash ?? '')
    ) {
      fingerprint = candidate;
      break;
    }
    if (attempt < 15) await new Promise((resolve) => setTimeout(resolve, 2_000));
  }
  if (!fingerprint) {
    throw new Error(
      `Production R2 read-only fingerprint response failed validation (${JSON.stringify(rejection)}).`,
    );
  }
} finally {
  if (deployed) wrangler(['delete', '--config', configPath, '--force']);
  await rm(configPath, { force: true });
}

await writeFile(
  reportPath,
  `${JSON.stringify(
    {
      status: 'PASS',
      capturedAt: new Date().toISOString(),
      brand: fingerprint.brand,
      evidence: fingerprint.evidence,
      productionMutation: 'NONE',
      temporaryWorkerRemoved: true,
    },
    null,
    2,
  )}\n`,
  { encoding: 'utf8', flag: 'wx', mode: 0o600 },
);

console.log('Production R2 read-only fingerprint: PASS');
console.log(
  'Production mutation: NONE. Provider names, object keys, identifiers, and hashes were not printed.',
);
