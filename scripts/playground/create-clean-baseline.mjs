import { createHash } from 'node:crypto';
import { mkdir, readFile, realpath, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { restoreAndVerifyD1Export } from '../d1/verify-d1-export.mjs';
import {
  createSanitizedBaseline,
  dumpDatabase,
  PARITY_EXCEPTIONS,
} from './baseline-data.mjs';

const repoRoot = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));
const SHA = /^[0-9a-f]{40}$/u;

function argumentsFrom(argv) {
  const result = {};
  for (let index = 0; index < argv.length; index += 2) {
    const key = argv[index];
    const value = argv[index + 1];
    if (!key?.startsWith('--') || value === undefined) throw new Error('Invalid baseline argument list.');
    result[key.slice(2)] = value;
  }
  return result;
}

function inside(parent, candidate) {
  const relative = path.relative(path.resolve(parent), path.resolve(candidate));
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

async function requirePrivateAbsoluteFile(value, label) {
  if (!path.isAbsolute(value ?? '')) throw new Error(`${label} must be an absolute private path.`);
  const resolved = await realpath(value);
  if (inside(repoRoot, resolved)) throw new Error(`${label} must remain outside the repository.`);
  if (!(await stat(resolved)).isFile()) throw new Error(`${label} must be a file.`);
  return resolved;
}

async function requirePrivateNewFile(value, label) {
  if (!path.isAbsolute(value ?? '')) throw new Error(`${label} must be an absolute private path.`);
  const parent = await realpath(path.dirname(value));
  const resolved = path.join(parent, path.basename(value));
  if (inside(repoRoot, resolved)) throw new Error(`${label} must remain outside the repository.`);
  try {
    await stat(resolved);
    throw new Error(`${label} already exists; refusing to overwrite it.`);
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
  return resolved;
}

function digest(value) {
  return createHash('sha256').update(value).digest('hex');
}

async function run() {
  const args = argumentsFrom(process.argv.slice(2));
  if (!SHA.test(args['source-sha'] ?? '')) throw new Error('source-sha must be an exact commit SHA.');
  if (!/^v\d+\.\d+\.\d+$/u.test(args['source-version'] ?? '')) {
    throw new Error('source-version must be an exact released version.');
  }
  const productionExport = await requirePrivateAbsoluteFile(args['production-export'], 'production-export');
  const stagingExport = await requirePrivateAbsoluteFile(args['staging-export'], 'staging-export');
  const outputSql = await requirePrivateNewFile(args['output-sql'], 'output-sql');
  const outputDatabase = await requirePrivateNewFile(args['output-db'], 'output-db');
  const outputReport = await requirePrivateNewFile(args['output-report'], 'output-report');
  await mkdir(path.dirname(outputSql), { recursive: true });
  const productionRestore = `${outputDatabase}.production-source.sqlite`;
  const stagingRestore = `${outputDatabase}.staging-source.sqlite`;
  try {
    await restoreAndVerifyD1Export(productionExport, productionRestore, {
      expectedSchema: '32',
      expectedMigration: '0032_staff_account_activity_history.sql',
      requireImmutableHistory: true,
    });
    await restoreAndVerifyD1Export(stagingExport, stagingRestore, {
      expectedSchema: '32',
      expectedMigration: '0032_staff_account_activity_history.sql',
      requireImmutableHistory: true,
    });
    const capturedAt = new Date().toISOString();
    const baselineMetadata = {
      sourceProductionVersion: args['source-version'],
      sourceProductionSha: args['source-sha'],
      capturedAt,
      schemaVersion: '32',
      latestMigration: '0032_staff_account_activity_history.sql',
      d1BaselineParity: 'EXCEPTIONS',
      r2BaselineParity: 'EXCEPTIONS',
      parityExceptions: PARITY_EXCEPTIONS,
    };
    const result = createSanitizedBaseline({
      productionDatabasePath: productionRestore,
      stagingDatabasePath: stagingRestore,
      outputDatabasePath: outputDatabase,
      baselineMetadata,
    });
    const sql = dumpDatabase(outputDatabase);
    await writeFile(outputSql, sql, { flag: 'wx' });
    const verificationRestore = `${outputDatabase}.verification.sqlite`;
    const verification = await restoreAndVerifyD1Export(outputSql, verificationRestore, {
      expectedSchema: '32',
      expectedMigration: '0032_staff_account_activity_history.sql',
      requireImmutableHistory: true,
    });
    await rm(verificationRestore, { force: true });
    const report = {
      schemaVersion: 1,
      capturedAt,
      sourceProductionVersion: args['source-version'],
      sourceProductionSha: args['source-sha'],
      sourceExportSha256: digest(await readFile(productionExport)),
      sanitizedExportSha256: digest(sql),
      d1BaselineParity: 'EXCEPTIONS',
      parityExceptions: PARITY_EXCEPTIONS,
      syntheticStagingAccountCount: result.syntheticAccountCount,
      tableCounts: result.tableCounts,
      integrityOk: verification.integrityOk,
      foreignKeyViolations: verification.foreignKeyViolations,
      operationalSchema: verification.operationalSchema,
      latestMigration: verification.latestMigration,
    };
    await writeFile(outputReport, `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx' });
    console.log('Playground clean D1 baseline: CREATED');
    console.log('Privacy classification: EXCEPTIONS (production credentials and private identity/evidence excluded).');
    console.log(`Synthetic staging tester accounts overlaid: ${result.syntheticAccountCount}`);
  console.log('Integrity: PASS; foreign keys: PASS; schema: 32; latest migration: 0032_staff_account_activity_history.sql.');
    console.log('Private paths, resource identifiers, data values, and hashes were not printed.');
  } finally {
    await Promise.all([rm(productionRestore, { force: true }), rm(stagingRestore, { force: true })]);
  }
}

run().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
