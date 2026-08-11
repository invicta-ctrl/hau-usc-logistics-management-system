import { createHash } from 'node:crypto';
import { execFileSync, spawnSync } from 'node:child_process';
import { readFile, realpath, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseJsonConfig } from '../cloudflare-environment-preflight.mjs';
import { validatePlaygroundConfig } from './playground-config.mjs';

const repoRoot = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));
const wranglerBin = path.join(repoRoot, 'node_modules', 'wrangler', 'bin', 'wrangler.js');

function inside(parent, candidate) {
  const relative = path.relative(path.resolve(parent), path.resolve(candidate));
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

async function privateFile(value, label) {
  if (!path.isAbsolute(value ?? '')) throw new Error(`${label} must be an absolute private path.`);
  const resolved = await realpath(value);
  if (inside(repoRoot, resolved) || !(await stat(resolved)).isFile()) {
    throw new Error(`${label} must be a private file outside the repository.`);
  }
  return resolved;
}

function wranglerJson(args) {
  const result = spawnSync(process.execPath, [wranglerBin, ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
    windowsHide: true,
  });
  if (result.status !== 0) throw new Error('Playground deployment provider preflight failed.');
  return JSON.parse(result.stdout);
}

function currentProductionBindings() {
  const deployments = wranglerJson(['deployments', 'list', '--env', 'production', '--json']);
  const versionId = deployments?.[0]?.versions?.[0]?.version_id;
  const version = wranglerJson(['versions', 'view', versionId, '--env', 'production', '--json']);
  const bindings = version.resources.bindings;
  return {
    d1Id: bindings.find((entry) => entry.name === 'DB' && entry.type === 'd1')?.database_id,
    brandBucket: bindings.find((entry) => entry.name === 'BRAND_ASSETS' && entry.type === 'r2_bucket')
      ?.bucket_name,
    evidenceBucket: bindings.find(
      (entry) => entry.name === 'EVIDENCE_ASSETS' && entry.type === 'r2_bucket',
    )?.bucket_name,
  };
}

async function run() {
  const [configArg, manifestArg, ...flags] = process.argv.slice(2);
  const dryRun = flags.includes('--dry-run');
  const [configPath, manifestPath] = await Promise.all([
    privateFile(configArg, 'Playground config'),
    privateFile(manifestArg, 'Playground manifest'),
  ]);
  const [config, manifest] = await Promise.all([
    readFile(configPath, 'utf8').then(parseJsonConfig),
    readFile(manifestPath, 'utf8').then(JSON.parse),
  ]);
  const status = execFileSync('git', ['status', '--porcelain'], { cwd: repoRoot, encoding: 'utf8' }).trim();
  if (status) throw new Error('Playground deployment requires a clean frozen candidate.');
  const expectedSha = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repoRoot, encoding: 'utf8' }).trim();
  const expectedTree = execFileSync('git', ['rev-parse', 'HEAD^{tree}'], {
    cwd: repoRoot,
    encoding: 'utf8',
  }).trim();
  const expectedBranch =
    String(process.env.CANDIDATE_BRANCH ?? '').trim() ||
    execFileSync('git', ['branch', '--show-current'], {
      cwd: repoRoot,
      encoding: 'utf8',
    }).trim();
  execFileSync('npm', ['run', 'build:cloudflare'], {
    cwd: repoRoot,
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
  const artifactPath = path.join(repoRoot, '.wrangler', 'build', 'staging', 'index.html');
  execFileSync(process.execPath, [path.join(repoRoot, 'scripts', 'verify-deploy-artifact.mjs'), 'staging', path.dirname(artifactPath)], {
    cwd: repoRoot,
    stdio: 'inherit',
  });
  const expectedArtifactHash = createHash('sha256').update(await readFile(artifactPath)).digest('hex');
  const validation = validatePlaygroundConfig({
    config,
    manifest,
    productionBindings: currentProductionBindings(),
    expectedSha,
    expectedTree,
    expectedBranch,
    expectedArtifactHash,
    repoRoot,
  });
  if (!validation.valid) {
    throw new Error(`Playground deployment refused by ${validation.issues.length} configuration guard(s).`);
  }
  console.log('Playground deployment preflight: PASS');
  console.log('Worker, D1, R2, branch, commit, tree, artifact, and production-denial guards passed.');
  if (dryRun) {
    console.log('Dry run requested; no provider upload performed.');
    return;
  }
  const deployment = spawnSync(
    process.execPath,
    [wranglerBin, 'deploy', '--config', configPath, '--assets', path.dirname(artifactPath)],
    { cwd: repoRoot, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024, windowsHide: true },
  );
  if (deployment.status !== 0) throw new Error('Playground Worker deployment failed.');
  console.log('Isolated Staging Playground Worker: DEPLOYED');
  console.log('No private provider identifier, hostname, resource name, or hash was printed.');
}

run().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
