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
// Production live deployments also require --staging-config and --secrets so
// the mandatory launch preflight cannot be skipped.
//
// Private identifiers are read but never printed.

import { execFileSync } from 'node:child_process';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseJsonConfig } from './cloudflare-environment-preflight.mjs';
import { validatePhase3AuthorizationPackage } from './phase3-staging-authorization.mjs';
import {
  productionCandidateEvidence,
  validateProductionAuthorizationPackage,
} from './production-authorization.mjs';
import { validateProductionLaunchPreflight } from './production-launch-preflight.mjs';
import { resolvePrivatePath } from './private-path.mjs';
import {
  exactDatabaseIdFromInventory,
  readPackageReleaseVersion,
  unexpectedStagingConfigKeys,
  validateReleaseCandidateIdentity,
} from './staging-sandbox-lib.mjs';

const repoRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const wranglerExecutable = path.join(repoRoot, 'node_modules', 'wrangler', 'bin', 'wrangler.js');

const TARGETS = Object.freeze({
  staging: {
    worker: 'hau-usc-logistics-staging',
    environment: 'STAGING',
    d1: 'hau-usc-logistics-staging-sandbox-v0721',
    buckets: [
      'hau-usc-logistics-staging-sandbox-v0721-assets',
      'hau-usc-logistics-staging-sandbox-v0721-evidence',
    ],
    build: 'build:cloudflare',
    artifactDirectory: '.wrangler/build/staging',
  },
  production: {
    worker: 'hau-usc-logistics-production',
    environment: 'PRODUCTION',
    d1: 'hau-usc-logistics-production',
    buckets: ['hau-usc-logistics-production-assets', 'hau-usc-logistics-production-evidence'],
    build: 'build:cloudflare:production',
    artifactDirectory: '.wrangler/build/production',
  },
});

const PLACEHOLDER_ID = '00000000-0000-0000-0000-000000000000';

function fail(message) {
  throw new Error(`Deployment refused: ${message}`);
}

function sameLocalPath(left, right) {
  const values = [left, right].map((value) => path.resolve(String(value ?? '')));
  return process.platform === 'win32'
    ? values[0].toLowerCase() === values[1].toLowerCase()
    : values[0] === values[1];
}

const [target, ...rest] = process.argv.slice(2);
const expected =
  TARGETS[
    String(target ?? '')
      .trim()
      .toLowerCase()
  ];
if (!expected) fail('the first argument must be "staging" or "production".');
const releaseVersion = await readPackageReleaseVersion(repoRoot).catch(() =>
  fail('package.json must declare a valid authoritative release version.'),
);

const configIndex = rest.indexOf('--config');
const rawConfigPath = configIndex === -1 ? '' : rest[configIndex + 1];
const authorizationIndex = rest.indexOf('--authorization');
const authorizationPath = authorizationIndex === -1 ? '' : rest[authorizationIndex + 1];
const dryRun = rest.includes('--dry-run');
if (!rawConfigPath || !path.isAbsolute(rawConfigPath)) {
  fail(
    'an absolute --config path to the private Wrangler config is required. ' +
      'The committed wrangler.jsonc holds placeholders and must never be used to deploy.',
  );
}
const configPath = await resolvePrivatePath(rawConfigPath, {
  repoRoot,
  label: 'Private config',
}).catch(() => fail('the private config must remain outside the repository.'));
const raw = await readFile(configPath, 'utf8').catch(() => fail('the private config could not be read.'));
const config = parseJsonConfig(raw);
if (!sameLocalPath(config.main, path.join(repoRoot, 'src', 'worker', 'index.js'))) {
  fail('the private config does not target the canonical repository Worker entrypoint.');
}
if (!sameLocalPath(config.assets?.directory, path.join(repoRoot, 'dist'))) {
  fail('the private config does not target the canonical repository asset directory.');
}

if (!dryRun) {
  if (!authorizationPath || !path.isAbsolute(authorizationPath)) {
    fail('an absolute private --authorization package is required for a live deployment.');
  }
  const resolvedAuthorizationPath = await resolvePrivatePath(authorizationPath, {
    repoRoot,
    label: 'Deployment authorization package',
  }).catch(() => fail('the deployment authorization package must remain outside the repository.'));
  const authorization = JSON.parse(
    await readFile(resolvedAuthorizationPath, 'utf8').catch(() =>
      fail('the deployment authorization package could not be read.'),
    ),
  );
  if (target === 'staging') {
    const result = await validatePhase3AuthorizationPackage(authorization, {
      packagePath: resolvedAuthorizationPath,
    });
    if (
      !result.valid ||
      authorization.authorization?.actions?.workerDeploy !== 'APPROVED' ||
      path.resolve(authorization.target?.privateWranglerConfigPath ?? '') !== path.resolve(configPath)
    ) {
      fail('the private staging package does not approve the Worker deployment action.');
    }
  } else {
    const currentCandidate = await productionCandidateEvidence();
    const result = await validateProductionAuthorizationPackage(authorization, {
      packagePath: resolvedAuthorizationPath,
      currentCandidate,
    });
    if (
      !result.launchAuthorized ||
      path.resolve(authorization.target?.privateWranglerConfigPath ?? '') !== path.resolve(configPath)
    ) {
      fail('the private production package is not authorized for the active launch window.');
    }

    const stagingConfigIndex = rest.indexOf('--staging-config');
    const secretsIndex = rest.indexOf('--secrets');
    const rawStagingConfigPath = stagingConfigIndex === -1 ? '' : rest[stagingConfigIndex + 1];
    const rawSecretsPath = secretsIndex === -1 ? '' : rest[secretsIndex + 1];
    if (!rawStagingConfigPath || !rawSecretsPath) {
      fail('live production deployment requires private --staging-config and --secrets inputs.');
    }
    const [stagingConfigPath, secretsPath, googleConfigPath, backupManifestPath] = await Promise.all([
      resolvePrivatePath(rawStagingConfigPath, {
        repoRoot,
        label: 'Private staging config',
        kind: 'file',
      }),
      resolvePrivatePath(rawSecretsPath, {
        repoRoot,
        label: 'Private production secrets',
        kind: 'file',
      }),
      resolvePrivatePath(authorization.target?.privateGoogleConfigPath, {
        repoRoot,
        label: 'Private production Google config',
        kind: 'file',
      }),
      resolvePrivatePath(authorization.target?.privateBackupManifestPath, {
        repoRoot,
        label: 'Private production backup manifest',
        kind: 'file',
      }),
    ]).catch(() => fail('all production launch-preflight inputs must remain outside the repository.'));
    const [stagingRaw, productionSecrets, googleConfig, backupManifest] = await Promise.all([
      readFile(stagingConfigPath, 'utf8'),
      readFile(secretsPath, 'utf8').then(JSON.parse),
      readFile(googleConfigPath, 'utf8').then(JSON.parse),
      readFile(backupManifestPath, 'utf8').then(JSON.parse),
    ]).catch(() => fail('a production launch-preflight input could not be read.'));
    const launchPreflight = await validateProductionLaunchPreflight({
      authorization,
      authorizationPath: resolvedAuthorizationPath,
      currentCandidate,
      stagingConfig: parseJsonConfig(stagingRaw),
      stagingConfigRaw: stagingRaw,
      productionConfig: config,
      productionConfigRaw: raw,
      productionSecrets,
      googleConfig,
      backupManifest,
    });
    if (!launchPreflight.valid || !launchPreflight.launchAuthorized) {
      fail('the mandatory production launch preflight is not authorized for the active launch window.');
    }
  }
}

// 1. The private config must describe the intended environment.
if (config.name !== expected.worker)
  fail(`the config targets Worker "${config.name}", not the ${target} Worker.`);
const environment = config?.vars?.ENVIRONMENT;
if (environment !== expected.environment)
  fail(`the config declares ENVIRONMENT "${environment}", not ${expected.environment}.`);
if (target === 'staging') {
  if ((config.routes ?? []).length || config.route)
    fail('custom routes are not allowed in the isolated staging deployment config.');
  if (config.workers_dev !== true || config.preview_urls !== false)
    fail('the staging config must use workers_dev with preview URLs disabled.');
  const extraConfigKeys = unexpectedStagingConfigKeys(config);
  if (extraConfigKeys.length)
    fail(`the staging config declares ${extraConfigKeys.length} unapproved top-level configuration key(s).`);
}

// 2. Refuse an unfrozen or incorrectly targeted candidate before any provider
// inventory call. The package version is the sole release identity authority.
const head = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repoRoot, encoding: 'utf8' }).trim();
const candidateSha = config?.vars?.CANDIDATE_SHA;
if (!candidateSha || candidateSha === 'REPLACE_AT_CANDIDATE_FREEZE')
  fail('the config still carries the placeholder CANDIDATE_SHA. Regenerate it at candidate freeze.');
if (candidateSha !== head)
  fail(`the config pins CANDIDATE_SHA ${candidateSha.slice(0, 12)}..., but HEAD is ${head.slice(0, 12)}...`);
const branch = execFileSync('git', ['branch', '--show-current'], {
  cwd: repoRoot,
  encoding: 'utf8',
}).trim();
const releaseIdentity = validateReleaseCandidateIdentity(config, {
  releaseVersion,
  head,
  branch,
  mode: target === 'production' ? 'production' : 'staging',
});
if (!releaseIdentity.valid) {
  fail(`the ${target} deployment release identity is invalid: ${releaseIdentity.issues.join(', ')}.`);
}
const status = execFileSync('git', ['status', '--porcelain'], { cwd: repoRoot, encoding: 'utf8' }).trim();
if (status) fail('the working tree is dirty. Deploy only a committed, frozen candidate.');

// 3. It must carry exactly one real, resolved D1 binding, and it must be the
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
let inventory;
try {
  inventory = JSON.parse(
    execFileSync(process.execPath, [wranglerExecutable, 'd1', 'list', '--config', configPath, '--json'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    }),
  );
} catch {
  fail('the exact D1 identity could not be read from the authenticated account inventory.');
}
const exactDatabaseId = exactDatabaseIdFromInventory(inventory, expected.d1);
if (!exactDatabaseId || database.database_id !== exactDatabaseId)
  fail('the configured D1 identifier does not match the exact named database in the account inventory.');

// 4. R2 bindings must match the environment, so staging can never write production objects.
const buckets = (config.r2_buckets ?? []).map((entry) => entry.bucket_name);
for (const bucket of expected.buckets)
  if (!buckets.includes(bucket)) fail(`the config is missing the ${target} R2 bucket ${bucket}.`);
const foreign = buckets.filter((bucket) => !expected.buckets.includes(bucket));
if (foreign.length)
  fail(`the config binds ${foreign.length} R2 bucket(s) outside the ${target} environment.`);

// 5. Rebuild deterministically, so a stale or tracked dist can never be the
//    deployment authority, then assert the artifact is the right build mode.
const artifactDirectory = path.join(repoRoot, expected.artifactDirectory);
execFileSync('npm', ['run', expected.build], {
  cwd: repoRoot,
  stdio: 'inherit',
  shell: process.platform === 'win32',
});
execFileSync(
  process.execPath,
  [path.join(repoRoot, 'scripts', 'verify-deploy-artifact.mjs'), target, artifactDirectory],
  {
    cwd: repoRoot,
    stdio: 'inherit',
  },
);

const artifact = await readFile(path.join(artifactDirectory, 'index.html'), 'utf8');
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
  execFileSync(
    process.execPath,
    [wranglerExecutable, 'deploy', '-c', configPath, '--assets', artifactDirectory],
    {
      cwd: repoRoot,
      stdio: 'inherit',
    },
  );
}
