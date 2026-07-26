import { execFileSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)));

export function decodeJsonBuffer(buffer) {
  if (buffer[0] === 0xff && buffer[1] === 0xfe) return buffer.subarray(2).toString('utf16le');
  if (buffer[0] === 0xfe && buffer[1] === 0xff) {
    const swapped = Buffer.from(buffer.subarray(2));
    swapped.swap16();
    return swapped.toString('utf16le');
  }
  return buffer.toString('utf8').replace(/^\uFEFF/u, '');
}

function baseConfig(source, { name, environment, candidateSha, d1, r2Bucket }) {
  return {
    name,
    main: source.main,
    compatibility_date: source.compatibility_date,
    workers_dev: true,
    preview_urls: false,
    observability: {
      enabled: true,
      logs: { enabled: true, head_sampling_rate: 1, invocation_logs: true, persist: true },
      traces: { enabled: true, head_sampling_rate: 0.05, persist: true },
    },
    assets: source.assets,
    d1_databases: [
      {
        binding: 'DB',
        database_name: d1.name,
        database_id: d1.uuid,
        migrations_dir: path.join(repoRoot, 'migrations'),
        migrations_table: 'd1_migrations',
      },
    ],
    r2_buckets: [{ binding: 'BRAND_ASSETS', bucket_name: r2Bucket }],
    vars: {
      ENVIRONMENT: environment,
      APP_VERSION: '0.7.0',
      SCHEMA_VERSION: '1.0.0',
      BOOTSTRAP_CONTRACT_VERSION: '2',
      CANDIDATE_SHA: candidateSha,
      GOOGLE_ROSTER_SPREADSHEET_ID: '<REPLACE_PRIVATELY>',
      GOOGLE_ROSTER_RANGE: '<REPLACE_PRIVATELY>',
      GOOGLE_ROSTER_SERVICE_ACCOUNT_EMAIL: '<REPLACE_PRIVATELY>',
    },
  };
}

export function createConfigPair(source, databases, candidateSha) {
  const stagingD1 = databases.find((database) => database.name === 'hau-usc-logistics-staging');
  const productionD1 = databases.find((database) => database.name === 'hau-usc-logistics-production');
  if (!stagingD1 || !productionD1) throw new Error('Required staging and production D1 resources were not found.');
  return {
    staging: baseConfig(source, {
      name: 'hau-usc-logistics-staging',
      environment: 'STAGING',
      candidateSha,
      d1: stagingD1,
      r2Bucket: 'hau-usc-logistics-staging-assets',
    }),
    production: baseConfig(source, {
      name: 'hau-usc-logistics-production',
      environment: 'PRODUCTION',
      candidateSha,
      d1: productionD1,
      r2Bucket: 'hau-usc-logistics-production-assets',
    }),
  };
}

async function run() {
  const [stagingBasePath, d1InventoryPath, outputDirectory] = process.argv.slice(2);
  if (![stagingBasePath, d1InventoryPath, outputDirectory].every((value) => path.isAbsolute(value ?? ''))) {
    throw new Error('Usage: node scripts/create-private-cloudflare-configs.mjs <absolute-staging-base> <absolute-d1-inventory-json> <absolute-output-directory>');
  }
  const [source, databases] = await Promise.all([
    readFile(stagingBasePath).then(decodeJsonBuffer).then(JSON.parse),
    readFile(d1InventoryPath).then(decodeJsonBuffer).then(JSON.parse),
  ]);
  const candidateSha = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repoRoot, encoding: 'utf8' }).trim();
  const pair = createConfigPair(source, databases, candidateSha);
  await mkdir(outputDirectory, { recursive: true });
  await Promise.all([
    writeFile(path.join(outputDirectory, 'wrangler.staging.private.jsonc'), `${JSON.stringify(pair.staging, null, 2)}\n`, { flag: 'wx', mode: 0o600 }),
    writeFile(path.join(outputDirectory, 'wrangler.production.private.jsonc'), `${JSON.stringify(pair.production, null, 2)}\n`, { flag: 'wx', mode: 0o600 }),
  ]);
  console.log('Distinct v0.7.0 staging and production Wrangler configs created outside Git.');
  console.log('No private provider identifiers were printed.');
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  run().catch((error) => {
    console.error(error?.code === 'EEXIST' ? 'Refusing to overwrite an existing private Wrangler config.' : error.message);
    process.exitCode = 1;
  });
}
