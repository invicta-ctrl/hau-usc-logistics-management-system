import { createHash } from 'node:crypto';
import { readFile, readdir, realpath, stat } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));

function inside(parent, candidate) {
  const relative = path.relative(path.resolve(parent), path.resolve(candidate));
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

async function privatePath(value, type) {
  if (!path.isAbsolute(value ?? '')) throw new Error('Baseline search paths must be absolute.');
  const resolved = await realpath(value);
  if (inside(repoRoot, resolved) || !(await stat(resolved))[`is${type}`]()) {
    throw new Error(`Baseline search ${type.toLowerCase()} must remain private and exist.`);
  }
  return resolved;
}

function digest(value) {
  return createHash('sha256').update(value).digest('hex');
}

const [manifestArg, directoryArg] = process.argv.slice(2);
const manifestPath = await privatePath(manifestArg, 'File');
const directoryPath = await privatePath(directoryArg, 'Directory');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
const expectedDatabase = String(manifest.baseline?.databaseSha256 ?? '').toLowerCase();
const expectedSql = String(manifest.baseline?.sqlSha256 ?? manifest.d1?.baselineSqlSha256 ?? '').toLowerCase();
const databaseDigestAvailable = /^[0-9a-f]{64}$/u.test(expectedDatabase);
const sqlDigestAvailable = /^[0-9a-f]{64}$/u.test(expectedSql);

const matches = [];
async function candidates(directory) {
  const result = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const candidate = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...(await candidates(candidate)));
    else if (entry.isFile() && /\.(?:sqlite|sql)$/u.test(entry.name)) result.push(candidate);
  }
  return result;
}

for (const candidatePath of await candidates(directoryPath)) {
  const fileName = path.relative(directoryPath, candidatePath).replaceAll('\\', '/');
  const bytes = await readFile(candidatePath);
  const candidateDigest = digest(bytes);
  const digestKind =
    databaseDigestAvailable && candidateDigest === expectedDatabase
      ? 'DATABASE'
      : sqlDigestAvailable && candidateDigest === expectedSql
        ? 'SQL'
        : '';
  if (fileName.endsWith('.sql') && !digestKind) continue;
  const match = {
    fileName,
    kind: digestKind || 'DATABASE',
    digestMatch: Boolean(digestKind),
  };
  if (match.kind === 'DATABASE') {
    const database = new DatabaseSync(candidatePath, { readOnly: true });
    try {
      match.integrityOk =
        String(database.prepare('PRAGMA integrity_check').get()?.integrity_check ?? '').toLowerCase() === 'ok';
      match.foreignKeyViolations = database.prepare('PRAGMA foreign_key_check').all().length;
      match.schemaVersion = String(
        database.prepare("SELECT value FROM app_metadata WHERE key='operational_schema_version'").get()?.value ??
          '',
      );
      match.latestMigration = String(
        database.prepare('SELECT name FROM d1_migrations ORDER BY id DESC LIMIT 1').get()?.name ?? '',
      );
      match.baselineId = String(
        database.prepare("SELECT value FROM app_metadata WHERE key='playground.baseline_id'").get()?.value ?? '',
      );
      match.baselineVersion = Number(
        database.prepare("SELECT value FROM app_metadata WHERE key='playground.baseline_version'").get()?.value ??
          0,
      );
      if (
        !match.digestMatch &&
        !(
          match.integrityOk &&
          match.foreignKeyViolations === 0 &&
          match.schemaVersion === '32' &&
          match.latestMigration === '0032_staff_account_activity_history.sql' &&
          ((match.baselineId === 'PGBL-20260828-COVERAGE-V2' && match.baselineVersion === 2) ||
            match.baselineId === 'PGBL-20260827-59beb9c28963')
        )
      ) {
        continue;
      }
    } finally {
      database.close();
    }
  }
  matches.push(match);
}

process.stdout.write(
  `${JSON.stringify({
    status: matches.length ? 'MATCHED' : 'NO_MATCH',
    target: 'PRIVATE_LOCAL_ARTIFACTS',
    productionRead: 'NONE',
    matches,
  })}\n`,
);
