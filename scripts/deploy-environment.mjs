// Canonical guarded deployment path.
//
// The committed wrangler.jsonc carries REPLACE_PRIVATELY_* placeholders, so a
// bare `wrangler deploy --env <env>` cannot reach a real target. The only
// command that could reach one used a private config and skipped the artifact
// preflight, leaving the guarded path and the real-target path disjoint. This
// joins them: it verifies the private config, verifies the built artifact, and
// only then hands that exact config to Wrangler.
//
// Usage:
//   node scripts/deploy-environment.mjs <staging|production> --config <absolute-private-config> [--dry-run]
//
// Private identifiers are read but never printed.

import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { parseJsonConfig } from './cloudflare-environment-preflight.mjs';

const TARGETS = Object.freeze({
  staging: {
    worker: 'hau-usc-logistics-staging',
    environment: 'STAGING',
    d1: 'hau-usc-logistics-staging',
    buckets: ['hau-usc-logistics-staging-assets', 'hau-usc-logistics-staging-evidence'],
    build: 'build:cloudflare',
  },
  production: {
    worker: 'hau-usc-logistics-production',
    environment: 'PRODUCTION',
    d1: 'hau-usc-logistics-production',
    buckets: ['hau-usc-logistics-production-assets', 'hau-usc-logistics-production-evidence'],
    build: 'build:cloudflare:production',
  },
});

const PLACEHOLDER_ID = '00000000-0000-0000-0000-000000000000';

function fail(message) {
  throw new Error(`Deployment refused: ${message}`);
}

const [target, ...rest] = process.argv.slice(2);
const expected = TARGETS[String(target ?? '').trim().toLowerCase()];
if (!expected) fail('the first argument must be "staging" or "production".');

const configIndex = rest.indexOf('--config');
const configPath = configIndex === -1 ? '' : rest[configIndex + 1];
const dryRun = rest.includes('--dry-run');
if (!configPath || !path.isAbsolute(configPath)) {
  fail(
    'an absolute --config path to the private Wrangler config is required. ' +
      'The committed wrangler.jsonc holds placeholders and must never be used to deploy.',
  );
}

const raw = await readFile(configPath, 'utf8').catch(() => fail(`the private config at ${configPath} could not be read.`));
const config = parseJsonConfig(raw);

// 1. The private config must describe the intended environment.
if (config.name !== expected.worker) fail(`the config targets Worker "${config.name}", not the ${target} Worker.`);
const environment = config?.vars?.ENVIRONMENT;
if (environment !== expected.environment)
  fail(`the config declares ENVIRONMENT "${environment}", not ${expected.environment}.`);

// 2. It must carry exactly one real, resolved D1 binding, and it must be the
//    binding the Worker actually reads. Checking only d1_databases[0] would let
//    a config whose first entry looks right bind `DB` to the other
//    environment's database on a later entry — the exact target confusion this
//    script exists to prevent, and the same rule R2 already enforces below.
const databases = config.d1_databases ?? [];
if (!databases.length) fail('the config declares no D1 binding.');
if (databases.length !== 1)
  fail(`the config declares ${databases.length} D1 bindings; exactly one (DB) is allowed.`);
const [database] = databases;
if (database.binding !== 'DB')
  fail(`the config binds D1 as "${database.binding}", but the Worker reads env.DB.`);
if (database.database_name !== expected.d1)
  fail(`the config binds D1 "${database.database_name}", not the ${target} database.`);
if (!database.database_id || database.database_id === PLACEHOLDER_ID)
  fail('the config still carries the placeholder database_id. Regenerate the private config.');
if (String(database.database_name).startsWith('REPLACE_PRIVATELY'))
  fail('the config still carries a REPLACE_PRIVATELY placeholder.');

// 3. R2 bindings must match the environment, so staging can never write production objects.
const buckets = (config.r2_buckets ?? []).map((entry) => entry.bucket_name);
for (const bucket of expected.buckets)
  if (!buckets.includes(bucket)) fail(`the config is missing the ${target} R2 bucket ${bucket}.`);
const foreign = buckets.filter((bucket) => !expected.buckets.includes(bucket));
if (foreign.length) fail(`the config binds ${foreign.length} R2 bucket(s) outside the ${target} environment.`);

// 4. The candidate SHA must be resolved and match the tree being deployed.
const head = execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
const candidateSha = config?.vars?.CANDIDATE_SHA;
if (!candidateSha || candidateSha === 'REPLACE_AT_CANDIDATE_FREEZE')
  fail('the config still carries the placeholder CANDIDATE_SHA. Regenerate it at candidate freeze.');
if (candidateSha !== head)
  fail(`the config pins CANDIDATE_SHA ${candidateSha.slice(0, 12)}..., but HEAD is ${head.slice(0, 12)}...`);

const status = execFileSync('git', ['status', '--porcelain'], { encoding: 'utf8' }).trim();
if (status) fail('the working tree is dirty. Deploy only a committed, frozen candidate.');

// 5. Rebuild deterministically, so a stale or tracked dist can never be the
//    deployment authority, then assert the artifact is the right build mode.
execFileSync('npm', ['run', expected.build], { stdio: 'inherit', shell: process.platform === 'win32' });
execFileSync('node', ['scripts/verify-deploy-artifact.mjs', target], { stdio: 'inherit' });

const artifact = await readFile('dist/index.html', 'utf8');
const digest = createHash('sha256').update(artifact).digest('hex');

process.stdout.write(
  `Deployment preflight passed for ${target}.\n` +
    `  Worker:      ${expected.worker}\n` +
    `  Environment: ${expected.environment}\n` +
    `  D1:          ${expected.d1} (id redacted)\n` +
    `  Candidate:   ${head}\n` +
    `  Artifact:    ${artifact.length} bytes, sha256 ${digest.slice(0, 16)}...\n`,
);

if (dryRun) {
  process.stdout.write('Dry run requested; no upload performed.\n');
} else {
  execFileSync('npx', ['wrangler', 'deploy', '-c', configPath], {
    stdio: 'inherit',
    shell: process.platform === 'win32',
  });
}
