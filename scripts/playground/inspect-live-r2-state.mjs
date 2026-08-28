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
  if (result.status !== 0) throw new Error(`Playground R2 inspection failed (${args[0]}).`);
  return result.stdout;
}

function validFingerprint(value) {
  return (
    Number.isSafeInteger(Number(value?.count)) &&
    Number(value.count) >= 0 &&
    Number.isSafeInteger(Number(value?.bytes)) &&
    Number(value.bytes) >= 0 &&
    /^[0-9a-f]{64}$/u.test(value?.hash ?? '')
  );
}

const [manifestArg, reportArg] = process.argv.slice(2);
const manifestPath = await privatePath(manifestArg, { existing: true });
const reportPath = await privatePath(reportArg, { existing: false });
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
const names = manifest.resources?.names;
if (
  manifest.status !== 'READY' ||
  !names?.r2BaselineBrand ||
  !names?.r2WorkingBrand ||
  !names?.r2BaselineEvidence ||
  !names?.r2WorkingEvidence ||
  new Set([names.r2BaselineBrand, names.r2WorkingBrand, names.r2BaselineEvidence, names.r2WorkingEvidence])
    .size !== 4
) {
  throw new Error('Private Playground manifest lacks four isolated R2 identities.');
}

const token = randomBytes(32).toString('base64url');
const configPath = path.join(path.dirname(reportPath), `r2-inspect-${Date.now()}.private.jsonc`);
const config = {
  name: `hau-usc-logistics-pg-r2-inspect-${Date.now()}`,
  main: path.join(repoRoot, 'scripts', 'playground', 'r2-playground-readonly-fingerprint-worker.js'),
  compatibility_date: '2026-03-17',
  workers_dev: true,
  preview_urls: false,
  r2_buckets: [
    { binding: 'BASELINE_BRAND', bucket_name: names.r2BaselineBrand },
    { binding: 'WORKING_BRAND', bucket_name: names.r2WorkingBrand },
    { binding: 'BASELINE_EVIDENCE', bucket_name: names.r2BaselineEvidence },
    { binding: 'WORKING_EVIDENCE', bucket_name: names.r2WorkingEvidence },
  ],
  vars: { READ_ONLY_LABEL: 'ISOLATED_PLAYGROUND_R2_READ_ONLY', READ_TOKEN: token },
};
await writeFile(configPath, `${JSON.stringify(config, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
let deployed = false;
let fingerprint;
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
    if (
      response.ok &&
      candidate?.status === 'PASS' &&
      candidate?.playgroundMutation === 'NONE' &&
      candidate?.productionMutation === 'NONE' &&
      [
        candidate.baselineBrand,
        candidate.workingBrand,
        candidate.baselineEvidence,
        candidate.workingEvidence,
      ].every(validFingerprint)
    ) {
      fingerprint = candidate;
      break;
    }
    if (attempt < 15) await new Promise((resolve) => setTimeout(resolve, 2_000));
  }
  if (!fingerprint) throw new Error('Playground R2 read-only fingerprint response failed validation.');
} finally {
  if (deployed) wrangler(['delete', '--config', configPath, '--force']);
  await rm(configPath, { force: true });
}

const result = {
  status: 'PASS',
  capturedAt: new Date().toISOString(),
  brand: {
    baseline: fingerprint.baselineBrand,
    working: fingerprint.workingBrand,
    parity: fingerprint.baselineBrand.hash === fingerprint.workingBrand.hash ? 'PASS' : 'DIFFERENT',
  },
  evidence: {
    baseline: fingerprint.baselineEvidence,
    working: fingerprint.workingEvidence,
    parity: fingerprint.baselineEvidence.hash === fingerprint.workingEvidence.hash ? 'PASS' : 'DIFFERENT',
  },
  playgroundMutation: 'NONE',
  productionMutation: 'NONE',
  temporaryWorkerRemoved: true,
};
await writeFile(reportPath, `${JSON.stringify(result, null, 2)}\n`, {
  encoding: 'utf8',
  flag: 'wx',
  mode: 0o600,
});
console.log('Playground R2 read-only inspection: PASS');
console.log(
  'Provider names, object keys, identifiers, and hashes were not printed. Temporary Worker removed.',
);
