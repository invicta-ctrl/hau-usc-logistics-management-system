import { readFile, realpath, stat, writeFile } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { restoreAndVerifyD1Export } from '../d1/verify-d1-export.mjs';

const repoRoot = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));

function argument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : '';
}

function inside(parent, candidate) {
  const relative = path.relative(path.resolve(parent), path.resolve(candidate));
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

async function privatePath(value, { existing }) {
  if (!path.isAbsolute(value ?? '')) throw new Error('Baseline upgrade paths must be absolute.');
  const resolved = existing
    ? await realpath(value)
    : path.join(await realpath(path.dirname(value)), path.basename(value));
  if (inside(repoRoot, resolved)) throw new Error('Baseline upgrade paths must remain outside the repository.');
  if (existing && !(await stat(resolved)).isFile()) throw new Error('Baseline upgrade input must be a file.');
  if (!existing) {
    try {
      await stat(resolved);
      throw new Error('Baseline upgrade output exists; refusing to overwrite it.');
    } catch (error) {
      if (error?.code !== 'ENOENT') throw error;
    }
  }
  return resolved;
}

const sourcePath = await privatePath(argument('--source-sql'), { existing: true });
const outputPath = await privatePath(argument('--output-database'), { existing: false });
const reportPath = await privatePath(argument('--output-report'), { existing: false });
await restoreAndVerifyD1Export(sourcePath, outputPath);

const database = new DatabaseSync(outputPath);
try {
  const sourceVersion = String(
    database.prepare("SELECT value FROM app_metadata WHERE key='operational_schema_version'").get()?.value ?? '',
  );
  if (sourceVersion !== '30') throw new Error('Baseline schema upgrade requires the sealed schema-30 source.');
  const migrations = [
    ['0031_canonical_identity_foundation.sql', '2026-08-28 09:31:00'],
    ['0032_staff_account_activity_history.sql', '2026-08-28 09:32:00'],
  ];
  for (const [name, appliedAt] of migrations) {
    const sql = await readFile(path.join(repoRoot, 'migrations', name), 'utf8');
    database.exec(sql);
    database
      .prepare('INSERT INTO d1_migrations (name, applied_at) VALUES (?1, ?2)')
      .run(name, appliedAt);
  }
  const schemaVersion = String(
    database.prepare("SELECT value FROM app_metadata WHERE key='operational_schema_version'").get()?.value ?? '',
  );
  const latestMigration = String(
    database.prepare('SELECT name FROM d1_migrations ORDER BY id DESC LIMIT 1').get()?.name ?? '',
  );
  const integrityOk =
    String(database.prepare('PRAGMA integrity_check').get()?.integrity_check ?? '').toLowerCase() === 'ok';
  const foreignKeyViolations = database.prepare('PRAGMA foreign_key_check').all().length;
  if (
    schemaVersion !== '32' ||
    latestMigration !== '0032_staff_account_activity_history.sql' ||
    !integrityOk ||
    foreignKeyViolations !== 0
  ) {
    throw new Error('Baseline schema-32 upgrade verification failed.');
  }
  await writeFile(
    reportPath,
    `${JSON.stringify(
      {
        status: 'PASS',
        source: 'SEALED_PRIVACY_FILTERED_BASELINE',
        productionRead: 'NONE',
        productionMutation: 'NONE',
        sourceSchemaVersion: sourceVersion,
        schemaVersion,
        latestMigration,
        integrityOk,
        foreignKeyViolations,
      },
      null,
      2,
    )}\n`,
    { flag: 'wx', mode: 0o600 },
  );
} finally {
  database.close();
}

console.log('Private privacy-filtered baseline schema upgrade: PASS (30 -> 32).');
console.log('No Production read/mutation, private values, provider identities, or hashes were printed.');
