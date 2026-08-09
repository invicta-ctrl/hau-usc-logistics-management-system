import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFile, realpath, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseJsonConfig } from '../cloudflare-environment-preflight.mjs';
import { TEMPORARY_BRANCH } from './playground-config.mjs';

const repoRoot = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));

function inside(parent, candidate) {
  const relative = path.relative(path.resolve(parent), path.resolve(candidate));
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

async function privateExisting(value, label) {
  if (!path.isAbsolute(value ?? '')) throw new Error(`${label} must be an absolute private path.`);
  const resolved = await realpath(value);
  if (inside(repoRoot, resolved) || !(await stat(resolved)).isFile()) {
    throw new Error(`${label} must be a private file outside the repository.`);
  }
  return resolved;
}

async function privateOutput(value) {
  if (!path.isAbsolute(value ?? '')) throw new Error('Output config must be an absolute private path.');
  const parent = await realpath(path.dirname(value));
  const resolved = path.join(parent, path.basename(value));
  if (inside(repoRoot, resolved)) throw new Error('Output config must remain outside the repository.');
  try {
    await stat(resolved);
    throw new Error('Output config exists; refusing to overwrite it.');
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
  return resolved;
}

async function run() {
  const [manifestArg, outputArg] = process.argv.slice(2);
  const manifestPath = await privateExisting(manifestArg, 'Resource manifest');
  const outputPath = await privateOutput(outputArg);
  const [manifest, source, artifact] = await Promise.all([
    readFile(manifestPath, 'utf8').then(JSON.parse),
    readFile(path.join(repoRoot, 'wrangler.jsonc'), 'utf8').then(parseJsonConfig),
    readFile(path.join(repoRoot, '.wrangler', 'build', 'staging', 'index.html')),
  ]);
  if (manifest.status !== 'READY') throw new Error('Resource manifest must be READY.');
  const candidateSha = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repoRoot, encoding: 'utf8' }).trim();
  const candidateTree = execFileSync('git', ['rev-parse', 'HEAD^{tree}'], {
    cwd: repoRoot,
    encoding: 'utf8',
  }).trim();
  const candidateBranch =
    String(process.env.CANDIDATE_BRANCH ?? '').trim() ||
    execFileSync('git', ['branch', '--show-current'], {
      cwd: repoRoot,
      encoding: 'utf8',
    }).trim();
  if (!TEMPORARY_BRANCH.test(candidateBranch)) throw new Error('Current branch is not an allowed temporary branch.');
  const staging = source.env?.staging;
  if (!staging?.name || !staging?.vars) throw new Error('Tracked staging configuration is incomplete.');
  const names = manifest.resources.names;
  const baselineReport = manifest.baseline;
  if (!baselineReport?.sourceProductionSha || !baselineReport?.sourceProductionVersion) {
    throw new Error('Resource manifest is missing the sealed production baseline identity.');
  }
  if (
    !/^(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z0-9-]+\.workers\.dev$/u.test(
      manifest.playgroundHostname ?? '',
    )
  ) {
    throw new Error('Resource manifest is missing the exact private playground hostname.');
  }
  const config = {
    name: staging.name,
    main: path.join(repoRoot, 'src', 'worker', 'index.js'),
    compatibility_date: source.compatibility_date,
    workers_dev: true,
    preview_urls: false,
    observability: {
      enabled: true,
      logs: { enabled: true, head_sampling_rate: 1, invocation_logs: true, persist: true },
      traces: { enabled: true, head_sampling_rate: 0.05, persist: true },
    },
    assets: {
      ...source.assets,
      directory: path.join(repoRoot, '.wrangler', 'build', 'staging'),
      not_found_handling: 'single-page-application',
      run_worker_first: [...new Set([...(source.assets?.run_worker_first ?? []), '/api/*', '/brand/*', '/media/*'])],
    },
    d1_databases: [
      {
        binding: 'DB',
        database_name: names.d1Working,
        database_id: manifest.d1.databaseId,
        migrations_dir: path.join(repoRoot, 'migrations'),
        migrations_table: 'd1_migrations',
      },
    ],
    r2_buckets: [
      { binding: 'BRAND_ASSETS', bucket_name: names.r2WorkingBrand },
      { binding: 'EVIDENCE_ASSETS', bucket_name: names.r2WorkingEvidence },
    ],
    vars: {
      ...staging.vars,
      ENVIRONMENT: 'STAGING',
      PLAYGROUND_MODE: true,
      PLAYGROUND_LABEL: 'ISOLATED_STAGING_PLAYGROUND',
      PLAYGROUND_RESOURCE_SET: 'PLAYGROUND_V1',
      APP_VERSION: '0.8.0-playground.1',
      CANDIDATE_SHA: candidateSha,
      CANDIDATE_TREE_SHA: candidateTree,
      CANDIDATE_BRANCH: candidateBranch,
      APPLICATION_ARTIFACT_HASH: createHash('sha256').update(artifact).digest('hex'),
      PRODUCTION_ACCEPTED_VERSION: baselineReport.sourceProductionVersion,
      PRODUCTION_ACCEPTED_SHA: baselineReport.sourceProductionSha,
      PRODUCTION_SCHEMA_VERSION: String(baselineReport.schemaVersion),
      PLAYGROUND_BASELINE_CAPTURED_AT: baselineReport.capturedAt,
      RECOVERY_HOSTNAME: manifest.playgroundHostname,
      ACCOUNT_APPLICATION_EMAIL_PROVIDER: 'disabled',
      SANDBOX_RESET_ALLOWED: false,
    },
  };
  await writeFile(outputPath, `${JSON.stringify(config, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
  console.log('Private Isolated Staging Playground config: CREATED');
  console.log('Candidate commit, tree, artifact, D1, and R2 identities were bound without printing them.');
  console.log('Scheduled jobs and provider/email delivery are disabled.');
}

run().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
