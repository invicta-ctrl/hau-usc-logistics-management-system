import { randomBytes, createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { mkdir, readFile, realpath, rm, stat, writeFile } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { latestDeploymentVersionId } from './deployment-history.mjs';
import { createEvidencePlaceholder } from './evidence-placeholders.mjs';

const repoRoot = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));
const wranglerBin = path.join(repoRoot, 'node_modules', 'wrangler', 'bin', 'wrangler.js');
const DEFAULT_RESOURCE_SUFFIX = '20260809-c4ebcee-v2';
const RESOURCE_SUFFIX = /^\d{8}-[0-9a-f]{7}-v\d+$/u;

function inside(parent, candidate) {
  const relative = path.relative(path.resolve(parent), path.resolve(candidate));
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

async function privateExistingFile(value, label) {
  if (!path.isAbsolute(value ?? '')) throw new Error(`${label} must be an absolute private path.`);
  const resolved = await realpath(value);
  if (inside(repoRoot, resolved)) throw new Error(`${label} must remain outside the repository.`);
  if (!(await stat(resolved)).isFile()) throw new Error(`${label} must be a file.`);
  return resolved;
}

async function privateNewFile(value, label) {
  if (!path.isAbsolute(value ?? '')) throw new Error(`${label} must be an absolute private path.`);
  const parent = await realpath(path.dirname(value));
  const resolved = path.join(parent, path.basename(value));
  if (inside(repoRoot, resolved)) throw new Error(`${label} must remain outside the repository.`);
  try {
    await stat(resolved);
    throw new Error(`${label} exists; refusing to overwrite it.`);
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
  return resolved;
}

function safeFailure(output, operation) {
  const codes = String(output ?? '').match(/(?:SQLITE_[A-Z_]+|code:\s*\d+)/gu) ?? [];
  throw new Error(`${operation} failed${codes.length ? ` (${[...new Set(codes)].join(', ')})` : ''}.`);
}

function wrangler(args, { input, json = false } = {}) {
  const result = spawnSync(process.execPath, [wranglerBin, ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
    input,
    maxBuffer: 16 * 1024 * 1024,
    windowsHide: true,
  });
  if (result.status !== 0) safeFailure(`${result.stdout}\n${result.stderr}`, `wrangler ${args[0]}`);
  return json ? JSON.parse(result.stdout) : result.stdout;
}

function currentVersion(environment) {
  const deployments = wrangler(['deployments', 'list', '--env', environment, '--json'], { json: true });
  const versionId = latestDeploymentVersionId(deployments);
  if (!versionId) throw new Error(`Current ${environment} Worker version was not found.`);
  return wrangler(['versions', 'view', versionId, '--env', environment, '--json'], { json: true });
}

function binding(version, name, type) {
  const entry = version?.resources?.bindings?.find(
    (candidate) => candidate.name === name && candidate.type === type,
  );
  if (!entry) throw new Error(`Required ${name} binding was not found.`);
  return entry;
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function findD1(databaseName) {
  const databases = wrangler(['d1', 'list', '--json'], { json: true });
  const database = databases.find((entry) => entry.name === databaseName);
  const id = database?.uuid ?? database?.id;
  return id && /^[0-9a-f-]{36}$/u.test(id) ? id : '';
}

function d1Rows(result) {
  const candidate = Array.isArray(result) ? result : [result];
  return candidate.flatMap((entry) => entry?.results ?? entry?.result?.[0]?.results ?? []);
}

function bucketInventoryText() {
  return wrangler(['r2', 'bucket', 'list']);
}

function bucketExists(inventory, bucketName) {
  return String(inventory).includes(bucketName);
}

async function run() {
  const [baselineSqlArg, baselineReportArg, manifestArg, ...options] = process.argv.slice(2);
  const suffixIndex = options.indexOf('--resource-suffix');
  const databaseIndex = options.indexOf('--baseline-db');
  const resourceSuffix = suffixIndex >= 0 ? options[suffixIndex + 1] : DEFAULT_RESOURCE_SUFFIX;
  if (!RESOURCE_SUFFIX.test(resourceSuffix ?? '')) throw new Error('Invalid playground resource suffix.');
  const baselineSql = await privateExistingFile(baselineSqlArg, 'baseline SQL');
  const baselineReport = await privateExistingFile(baselineReportArg, 'baseline report');
  const baselineDatabase =
    databaseIndex >= 0
      ? await privateExistingFile(options[databaseIndex + 1], 'baseline database')
      : '';
  const baselineReportData = JSON.parse(await readFile(baselineReport, 'utf8'));
  const manifestPath = await privateNewFile(manifestArg, 'resource manifest');
  await mkdir(path.dirname(manifestPath), { recursive: true });

  const names = {
    d1Working: `hau-usc-logistics-playground-working-${resourceSuffix}`,
    r2BaselineBrand: `hau-usc-logistics-playground-baseline-brand-${resourceSuffix}`,
    r2BaselineEvidence: `hau-usc-logistics-pg-baseline-evidence-${resourceSuffix}`,
    r2WorkingBrand: `hau-usc-logistics-playground-working-brand-${resourceSuffix}`,
    r2WorkingEvidence: `hau-usc-logistics-pg-working-evidence-${resourceSuffix}`,
    copyWorker: `hau-usc-logistics-playground-copy-${resourceSuffix}`,
  };
  const manifest = {
    schemaVersion: 1,
    status: 'STARTED',
    createdAt: new Date().toISOString(),
    resources: { names },
    d1: {},
    r2: {},
    baseline: {
      sourceProductionVersion: baselineReportData.sourceProductionVersion,
      sourceProductionSha: baselineReportData.sourceProductionSha,
      capturedAt: baselineReportData.capturedAt,
      schemaVersion: String(baselineReportData.operationalSchema),
      latestMigration: baselineReportData.latestMigration,
      parityExceptions: baselineReportData.parityExceptions,
    },
    productionMutation: 'NONE',
  };
  const save = () => writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, { mode: 0o600 });
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, { flag: 'wx', mode: 0o600 });

  const productionVersion = currentVersion('production');
  const stagingVersion = currentVersion('staging');
  const sourceBrand = binding(productionVersion, 'BRAND_ASSETS', 'r2_bucket').bucket_name;
  manifest.rollback = {
    stagingVersionId: stagingVersion.id,
    stagingD1Id: binding(stagingVersion, 'DB', 'd1').database_id,
    stagingBrandBucket: binding(stagingVersion, 'BRAND_ASSETS', 'r2_bucket').bucket_name,
    stagingEvidenceBucket: binding(stagingVersion, 'EVIDENCE_ASSETS', 'r2_bucket').bucket_name,
  };
  await save();

  let databaseId = findD1(names.d1Working);
  const databaseCreatedNow = !databaseId;
  if (!databaseId) {
    wrangler(['d1', 'create', names.d1Working, '--location', 'apac']);
    databaseId = findD1(names.d1Working);
  }
  if (!databaseId) throw new Error('New playground D1 was not present in the provider inventory.');
  manifest.d1.databaseId = databaseId;
  manifest.d1.created = databaseCreatedNow;
  await save();
  let baselinePresent = false;
  if (!databaseCreatedNow) {
    try {
      const existingBaseline = wrangler(
        [
          'd1',
          'execute',
          manifest.d1.databaseId,
          '--remote',
          '--command',
          "SELECT value FROM app_metadata WHERE key='playground.clean_baseline';",
          '--json',
        ],
        { json: true },
      );
      baselinePresent = JSON.stringify(d1Rows(existingBaseline)).includes('sourceProductionVersion');
    } catch {
      baselinePresent = false;
    }
  }
  if (!baselinePresent) {
    wrangler([
      'd1',
      'execute',
      manifest.d1.databaseId,
      '--remote',
      '--file',
      baselineSql,
      '--yes',
    ]);
  }
  const d1Verification = wrangler(
    [
      'd1',
      'execute',
      manifest.d1.databaseId,
      '--remote',
      '--command',
      "SELECT value FROM app_metadata WHERE key='operational_schema_version'; SELECT name FROM d1_migrations ORDER BY id DESC LIMIT 1; PRAGMA foreign_key_check;",
      '--json',
    ],
    { json: true },
  );
  const verificationRows = d1Rows(d1Verification);
  const serialized = JSON.stringify(verificationRows);
  if (!serialized.includes('0032_staff_account_activity_history.sql') || !serialized.includes('32')) {
    throw new Error('New playground D1 failed schema or migration verification.');
  }
  manifest.d1.imported = true;
  manifest.d1.schemaVersion = '32';
  manifest.d1.latestMigration = '0032_staff_account_activity_history.sql';
  manifest.d1.foreignKeyCommandCompleted = true;
  manifest.d1.baselineSqlSha256 = sha256(await readFile(baselineSql));
  await save();

  let bucketInventory = bucketInventoryText();
  for (const bucket of [
    names.r2BaselineBrand,
    names.r2BaselineEvidence,
    names.r2WorkingBrand,
    names.r2WorkingEvidence,
  ]) {
    if (!bucketExists(bucketInventory, bucket)) {
      wrangler(['r2', 'bucket', 'create', bucket, '--location', 'apac']);
      bucketInventory += `\n${bucket}`;
    }
  }
  manifest.r2.bucketsCreated = true;
  await save();

  const sqlObjectPath = `${names.r2BaselineEvidence}/control/d1-clean-baseline.sql`;
  const reportObjectPath = `${names.r2BaselineEvidence}/control/d1-clean-baseline-report.json`;
  wrangler(['r2', 'object', 'put', sqlObjectPath, '--remote', '--file', baselineSql]);
  wrangler(['r2', 'object', 'put', reportObjectPath, '--remote', '--file', baselineReport, '--content-type', 'application/json']);
  manifest.r2.controlObjectsUploaded = 2;
  await save();

  let evidencePlaceholders = 0;
  if (baselineDatabase) {
    const database = new DatabaseSync(baselineDatabase, { readOnly: true });
    try {
      const rows = database
        .prepare('SELECT private_storage_reference FROM evidence_metadata ORDER BY id')
        .all();
      for (const row of rows) {
        const placeholder = createEvidencePlaceholder(row.private_storage_reference);
        for (const bucket of [names.r2BaselineEvidence, names.r2WorkingEvidence]) {
          wrangler(
            [
              'r2',
              'object',
              'put',
              `${bucket}/${placeholder.key}`,
              '--remote',
              '--pipe',
              '--content-type',
              'application/json',
            ],
            { input: placeholder.body },
          );
        }
        evidencePlaceholders += 1;
      }
    } finally {
      database.close();
    }
  }
  manifest.r2.evidencePlaceholdersUploaded = evidencePlaceholders;
  await save();

  const copyConfigPath = path.join(path.dirname(manifestPath), 'r2-copy-worker.private.jsonc');
  const copyToken = randomBytes(32).toString('base64url');
  const copyConfig = {
    name: names.copyWorker,
    main: path.join(repoRoot, 'scripts', 'playground', 'r2-copy-worker.js'),
    compatibility_date: '2026-03-17',
    workers_dev: true,
    preview_urls: false,
    r2_buckets: [
      { binding: 'SOURCE_BRAND', bucket_name: sourceBrand },
      { binding: 'BASELINE_BRAND', bucket_name: names.r2BaselineBrand },
      { binding: 'WORKING_BRAND', bucket_name: names.r2WorkingBrand },
    ],
    vars: { COPY_TOKEN: copyToken },
  };
  await writeFile(copyConfigPath, `${JSON.stringify(copyConfig, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
  let copyWorkerDeployed = false;
  try {
    const deployOutput = wrangler(['deploy', '--config', copyConfigPath]);
    copyWorkerDeployed = true;
    const workerUrl = deployOutput.match(/https:\/\/[^\s]+\.workers\.dev/iu)?.[0];
    if (!workerUrl) throw new Error('Temporary R2 copy Worker URL was not returned.');
    let result;
    let responseStatus = 0;
    for (let attempt = 0; attempt < 12; attempt += 1) {
      const response = await fetch(`${workerUrl}/copy`, {
        method: 'POST',
        headers: { authorization: `Bearer ${copyToken}` },
      });
      responseStatus = response.status;
      if (String(response.headers.get('content-type') ?? '').includes('application/json')) {
        result = await response.json();
        if (response.ok && result.ok) break;
      } else {
        await response.arrayBuffer();
      }
      await new Promise((resolve) => setTimeout(resolve, 2500));
    }
    if (!result?.ok) {
      throw new Error(`R2 public-brand baseline reconciliation failed (HTTP ${responseStatus || 'unavailable'}).`);
    }
    manifest.r2.brand = {
      source: result.source,
      baseline: result.baseline,
      working: result.working,
      parity: 'PASS',
    };
  } finally {
    if (copyWorkerDeployed) {
      wrangler(['delete', '--name', names.copyWorker, '--force']);
    }
    await rm(copyConfigPath, { force: true });
  }
  manifest.status = 'READY';
  manifest.completedAt = new Date().toISOString();
  manifest.r2.evidence = {
    productionPrivateObjectsCopied: 0,
    baselineApplicationObjects: evidencePlaceholders,
    workingApplicationObjects: evidencePlaceholders,
    baselineControlObjects: 2,
    parity: 'EXCEPTIONS',
  };
  await save();
  console.log('Playground provider resources: CREATED AND VERIFIED');
  console.log('D1: isolated import complete; schema 32; migration 0032_staff_account_activity_history.sql; foreign-key command complete.');
  console.log('R2 brand: production source copied one way to sealed baseline and isolated working bucket.');
  console.log(`R2 evidence: production private objects excluded; safe linked placeholders uploaded: ${evidencePlaceholders}.`);
  console.log('Temporary copy Worker: REMOVED. Production mutation: NONE.');
  console.log('Private resource names, identifiers, object keys, hashes, and token were not printed.');
}

run().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
