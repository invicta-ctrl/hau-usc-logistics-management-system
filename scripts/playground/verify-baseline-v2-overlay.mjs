import { copyFile, readFile, realpath, stat } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { reconcileInventoryDatabase } from '../d1/reconcile-inventory-truth.mjs';

const repoRoot = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));

function argument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : '';
}

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

async function privateNew(value, label) {
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

const sourcePath = await privateExisting(argument('--source-database'), 'Source baseline database');
const overlayPath = await privateExisting(argument('--overlay'), 'Coverage overlay SQL');
const outputPath = await privateNew(argument('--output-database'), 'Verification database');
const overlay = await readFile(overlayPath, 'utf8');
for (const forbidden of [/\bDROP\b/iu, /\bDELETE\b/iu, /\bALTER\b/iu, /\bCREATE\s+TABLE\b/iu]) {
  if (forbidden.test(overlay))
    throw new Error('Overlay contains a destructive or schema-changing statement.');
}

await copyFile(sourcePath, outputPath, 0);
const database = new DatabaseSync(outputPath);
let transactionOpen = false;
try {
  database.exec('PRAGMA foreign_keys = ON; BEGIN IMMEDIATE;');
  transactionOpen = true;
  database.exec(overlay);
  database.exec('COMMIT;');
  transactionOpen = false;
  const integrity = String(
    database.prepare('PRAGMA integrity_check').get()?.integrity_check ?? '',
  ).toLowerCase();
  const foreignKeyViolations = database.prepare('PRAGMA foreign_key_check').all().length;
  const baselineId = String(
    database.prepare("SELECT value FROM app_metadata WHERE key = 'playground.baseline_id'").get()?.value ??
      '',
  );
  const reconciliation = reconcileInventoryDatabase(database, { environment: 'LOCAL_TEST' });
  const counts = Object.fromEntries(
    [
      ['lendableItems', 'SELECT COUNT(*) AS count FROM inventory_items WHERE is_lendable = 1'],
      ['activeReservations', "SELECT COUNT(*) AS count FROM reservations WHERE status = 'ACTIVE'"],
      [
        'activeLending',
        "SELECT COUNT(*) AS count FROM lending_tickets WHERE status IN ('FOR_REVIEW', 'READY_TO_CLAIM', 'ON_LOAN')",
      ],
      ['eventOperationalLinks', 'SELECT COUNT(*) AS count FROM event_operational_links'],
      ['canonicalPeople', 'SELECT COUNT(*) AS count FROM canonical_people'],
      ['accountPersonLinks', 'SELECT COUNT(*) AS count FROM account_staff_links'],
      ['staffActivityRows', 'SELECT COUNT(*) AS count FROM staff_account_activity_history'],
      ['referenceRecords', 'SELECT COUNT(*) AS count FROM reference_records'],
      ['referenceLinks', 'SELECT COUNT(*) AS count FROM reference_links'],
    ].map(([label, sql]) => [label, Number(database.prepare(sql).get()?.count ?? 0)]),
  );
  if (
    integrity !== 'ok' ||
    foreignKeyViolations !== 0 ||
    baselineId !== 'PGBL-20260828-COVERAGE-V2' ||
    reconciliation.summary.disposition !== 'RECONCILED' ||
    Object.values(counts).some((value) => value < 1)
  ) {
    throw new Error('Coverage overlay verification failed.');
  }
  process.stdout.write(
    `${JSON.stringify({
      status: 'PASS',
      baselineId,
      integrityOk: true,
      foreignKeyViolations: 0,
      inventoryReconciliation: reconciliation.summary.disposition,
      counts,
    })}\n`,
  );
} finally {
  if (transactionOpen) database.exec('ROLLBACK;');
  database.close();
}
