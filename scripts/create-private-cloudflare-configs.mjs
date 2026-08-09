import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { STAGING_SANDBOX_TARGET } from './staging-sandbox-lib.mjs';
import { parseExactRecipientAllowlist } from '../src/server/account-application/email-provider-registry.js';
import { resolvePrivatePath } from './private-path.mjs';

const repoRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)));
const releaseVersion = JSON.parse(readFileSync(path.join(repoRoot, 'package.json'), 'utf8')).version;
const REQUIRED_WORKER_FIRST_ROUTES = Object.freeze(['/api/*', '/brand/*', '/media/*']);
const PRIVATE_STAGING_VAR_NAMES = new Set([
  'ACCOUNT_APPLICATION_EMAIL_FROM',
  'ACCOUNT_APPLICATION_EMAIL_RECIPIENT_ALLOWLIST_JSON',
  'GOOGLE_ROSTER_SPREADSHEET_ID',
  'GOOGLE_ROSTER_RANGE',
  'GOOGLE_ROSTER_SERVICE_ACCOUNT_EMAIL',
]);

function publicStagingVars(source) {
  return Object.fromEntries(
    Object.entries(source.vars ?? {}).filter(([name]) => !PRIVATE_STAGING_VAR_NAMES.has(name)),
  );
}

export function decodeJsonBuffer(buffer) {
  if (buffer[0] === 0xff && buffer[1] === 0xfe) return buffer.subarray(2).toString('utf16le');
  if (buffer[0] === 0xfe && buffer[1] === 0xff) {
    const swapped = Buffer.from(buffer.subarray(2));
    swapped.swap16();
    return swapped.toString('utf16le');
  }
  return buffer.toString('utf8').replace(/^\uFEFF/u, '');
}

function baseConfig(
  source,
  { name, environment, candidateSha, candidateBranch, d1, brandR2Bucket, evidenceR2Bucket },
) {
  return {
    name,
    // Private Wrangler configs live outside the repository, so relative source
    // and asset paths would otherwise resolve against the private directory.
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
      directory: path.join(repoRoot, 'dist'),
      not_found_handling: 'single-page-application',
      run_worker_first: [
        ...new Set([
          ...(Array.isArray(source.assets?.run_worker_first) ? source.assets.run_worker_first : []),
          ...REQUIRED_WORKER_FIRST_ROUTES,
        ]),
      ],
    },
    d1_databases: [
      {
        binding: 'DB',
        database_name: d1.name,
        database_id: d1.uuid,
        migrations_dir: path.join(repoRoot, 'migrations'),
        migrations_table: 'd1_migrations',
      },
    ],
    r2_buckets: [
      { binding: 'BRAND_ASSETS', bucket_name: brandR2Bucket },
      { binding: 'EVIDENCE_ASSETS', bucket_name: evidenceR2Bucket },
    ],
    triggers: { crons: ['*/5 * * * *'] },
    vars: {
      ...(environment === 'STAGING' ? publicStagingVars(source) : {}),
      ENVIRONMENT: environment,
      APP_VERSION: releaseVersion,
      SCHEMA_VERSION: '1.0.0',
      BOOTSTRAP_CONTRACT_VERSION: '2',
      CANDIDATE_SHA: candidateSha,
      CANDIDATE_BRANCH: candidateBranch,
      RECOVERY_HOSTNAME:
        environment === 'STAGING'
          ? (source.vars?.RECOVERY_HOSTNAME ?? '<REPLACE_PRIVATELY_RECOVERY_HOSTNAME>')
          : '<REPLACE_PRIVATELY_RECOVERY_HOSTNAME>',
      ...(environment === 'PRODUCTION'
        ? {
            GOOGLE_ROSTER_SPREADSHEET_ID: '<REPLACE_PRIVATELY>',
            GOOGLE_ROSTER_RANGE: '<REPLACE_PRIVATELY>',
            GOOGLE_ROSTER_SERVICE_ACCOUNT_EMAIL: '<REPLACE_PRIVATELY>',
          }
        : {}),
      ...(environment === 'STAGING'
        ? {
            SANDBOX_RESET_ALLOWED: source.vars?.SANDBOX_RESET_ALLOWED === true,
            SANDBOX_BASE_URL:
              source.vars?.SANDBOX_BASE_URL ?? '<REPLACE_PRIVATELY_EXACT_STAGING_HTTPS_ORIGIN>',
            ACCOUNT_APPLICATION_EMAIL_RECIPIENT_ALLOWLIST_COUNT:
              parseExactRecipientAllowlist(source.vars?.ACCOUNT_APPLICATION_EMAIL_RECIPIENT_ALLOWLIST_JSON)
                ?.length ?? 0,
          }
        : {}),
    },
  };
}

export function createConfigPair(source, databases, candidateSha, candidateBranch = 'UNKNOWN') {
  const stagingD1 = databases.find((database) => database.name === STAGING_SANDBOX_TARGET.database);
  const productionD1 = databases.find((database) => database.name === 'hau-usc-logistics-production');
  if (!stagingD1 || !productionD1)
    throw new Error('Required staging and production D1 resources were not found.');
  return {
    staging: baseConfig(source, {
      name: 'hau-usc-logistics-staging',
      environment: 'STAGING',
      candidateSha,
      candidateBranch,
      d1: stagingD1,
      brandR2Bucket: STAGING_SANDBOX_TARGET.buckets[0],
      evidenceR2Bucket: STAGING_SANDBOX_TARGET.buckets[1],
    }),
    production: baseConfig(source, {
      name: 'hau-usc-logistics-production',
      environment: 'PRODUCTION',
      candidateSha,
      candidateBranch,
      d1: productionD1,
      brandR2Bucket: 'hau-usc-logistics-production-assets',
      evidenceR2Bucket: 'hau-usc-logistics-production-evidence',
    }),
  };
}

async function run() {
  const [stagingBasePath, d1InventoryPath, outputDirectory] = process.argv.slice(2);
  if (![stagingBasePath, d1InventoryPath, outputDirectory].every((value) => path.isAbsolute(value ?? ''))) {
    throw new Error(
      'Usage: node scripts/create-private-cloudflare-configs.mjs <absolute-staging-base> <absolute-d1-inventory-json> <absolute-output-directory>',
    );
  }
  const [resolvedStagingBase, resolvedD1Inventory, resolvedOutputDirectory] = await Promise.all([
    resolvePrivatePath(stagingBasePath, { repoRoot, label: 'Staging base config' }),
    resolvePrivatePath(d1InventoryPath, { repoRoot, label: 'D1 inventory' }),
    resolvePrivatePath(outputDirectory, {
      repoRoot,
      label: 'Output directory',
      kind: 'directory',
      allowMissing: true,
    }),
  ]);
  const [source, databases] = await Promise.all([
    readFile(resolvedStagingBase).then(decodeJsonBuffer).then(JSON.parse),
    readFile(resolvedD1Inventory).then(decodeJsonBuffer).then(JSON.parse),
  ]);
  const candidateSha = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repoRoot, encoding: 'utf8' }).trim();
  const candidateBranch = execFileSync('git', ['branch', '--show-current'], {
    cwd: repoRoot,
    encoding: 'utf8',
  }).trim();
  const pair = createConfigPair(source, databases, candidateSha, candidateBranch);
  await mkdir(resolvedOutputDirectory, { recursive: true });
  await Promise.all([
    writeFile(
      path.join(resolvedOutputDirectory, 'wrangler.staging.private.jsonc'),
      `${JSON.stringify(pair.staging, null, 2)}\n`,
      { flag: 'wx', mode: 0o600 },
    ),
    writeFile(
      path.join(resolvedOutputDirectory, 'wrangler.production.private.jsonc'),
      `${JSON.stringify(pair.production, null, 2)}\n`,
      { flag: 'wx', mode: 0o600 },
    ),
  ]);
  console.log(`Distinct v${releaseVersion} staging and production Wrangler configs created outside Git.`);
  console.log('No private provider identifiers were printed.');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run().catch((error) => {
    console.error(
      error?.code === 'EEXIST' ? 'Refusing to overwrite an existing private Wrangler config.' : error.message,
    );
    process.exitCode = 1;
  });
}
