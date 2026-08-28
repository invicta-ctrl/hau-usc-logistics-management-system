import { readFile, realpath, stat, writeFile } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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

function sql(value) {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : 'NULL';
  if (value instanceof Uint8Array) return `X'${Buffer.from(value).toString('hex')}'`;
  return `'${String(value).replaceAll("'", "''")}'`;
}

function insertRows(database, table, predicate, parameters = []) {
  const columns = database
    .prepare(`PRAGMA table_info(${table})`)
    .all()
    .map((entry) => String(entry.name));
  const rows = database.prepare(`SELECT * FROM ${table} WHERE ${predicate} ORDER BY 1`).all(...parameters);
  return rows.map(
    (row) =>
      `INSERT INTO ${table} (${columns.join(', ')}) VALUES (${columns.map((column) => sql(row[column])).join(', ')});`,
  );
}

const databasePath = await privateExisting(argument('--database'), 'Coverage baseline database');
const outputPath = await privateNew(argument('--output'), 'Coverage overlay SQL');
const database = new DatabaseSync(databasePath, { readOnly: true });
const statements = [
  '-- Additive-only PLAYGROUND_BASELINE_COVERAGE_V2 overlay.',
  '-- Generated from an already privacy-filtered local baseline; contains no Production credentials or private evidence.',
  'PRAGMA defer_foreign_keys = ON;',
];

try {
  const classifications = database
    .prepare("SELECT item_id FROM inventory_classification_history WHERE id LIKE 'PGBL-V2-CLS-%' ORDER BY id")
    .all();
  if (classifications.length !== 2)
    throw new Error('Coverage baseline must contain two classified fixture-safe items.');
  const inventoryColumns = [
    'handling',
    'is_lendable',
    'lending_kind',
    'lending_status',
    'lending_unit',
    'lending_audience',
    'default_loan_days',
    'maximum_loan_quantity',
    'due_date_required',
    'condition_tracking',
    'inventory_kind',
    'classification_status',
    'condition_review_state',
    'maintenance_review_state',
    'classification_notes',
    'classification_revision',
    'classified_at',
    'classified_by',
    'updated_at',
    'updated_by',
  ];
  for (const { item_id: itemId } of classifications) {
    const row = database.prepare('SELECT * FROM inventory_items WHERE id = ?').get(itemId);
    statements.push(
      `UPDATE inventory_items SET ${inventoryColumns.map((column) => `${column} = ${sql(row[column])}`).join(', ')} WHERE id = ${sql(itemId)};`,
    );
  }

  const tables = [
    'inventory_classification_history',
    'requests',
    'request_lines',
    'reservations',
    'lending_tickets',
    'lending_handoffs',
    'inventory_ledger',
    'status_history',
    'audit_log',
    'restock_requests',
    'restock_receipts',
    'receiving_records',
    'event_operational_links',
  ];
  for (const table of tables) statements.push(...insertRows(database, table, "id LIKE 'PGBL-V2-%'"));
  statements.push(
    ...insertRows(database, 'canonical_people', "person_id = 'PER-00000000-0000-4000-8000-000000000001'"),
  );

  const link = database.prepare("SELECT * FROM account_staff_links WHERE id = 'PGBL-V2-STAFF-LINK'").get();
  const assignment = database
    .prepare("SELECT * FROM staff_assignments WHERE id = 'PGBL-V2-ASSIGNMENT'")
    .get();
  if (!link || !assignment) throw new Error('Coverage baseline lacks staging-safe identity rows.');
  statements.push(
    `INSERT INTO staff_account_activity_transition_context (
       transition_id, source_kind, source_id, account_staff_link_id, staff_assignment_id,
       action_code, person_id, account_id, old_link_state, new_link_state,
       old_assignment_state, new_assignment_state, old_effective_from, old_effective_to,
       new_effective_from, new_effective_to, correlation_id, created_at
     ) VALUES (
       'TRN-00000000000000000000000000000001', 'ACCOUNT_STAFF_LINK', ${sql(link.id)}, ${sql(link.id)}, NULL,
       'LINK_CREATED', ${sql(link.person_id)}, ${sql(link.account_id)}, NULL, ${sql(link.state)},
       NULL, NULL, NULL, NULL, NULL, NULL, 'PGBL-V2-STAFF-LINK', ${sql(link.created_at)}
     );`,
    ...insertRows(database, 'account_staff_links', "id = 'PGBL-V2-STAFF-LINK'"),
    `INSERT INTO staff_account_activity_transition_context (
       transition_id, source_kind, source_id, account_staff_link_id, staff_assignment_id,
       action_code, person_id, account_id, old_link_state, new_link_state,
       old_assignment_state, new_assignment_state, old_effective_from, old_effective_to,
       new_effective_from, new_effective_to, correlation_id, created_at
     ) VALUES (
       'TRN-00000000000000000000000000000002', 'STAFF_ASSIGNMENT', ${sql(assignment.id)}, NULL, ${sql(assignment.id)},
       'ASSIGNMENT_CREATED', ${sql(assignment.person_id)}, NULL, NULL, NULL,
       NULL, ${sql(assignment.state)}, NULL, NULL, ${sql(assignment.effective_from)}, ${sql(assignment.effective_to)},
       'PGBL-V2-ASSIGNMENT', ${sql(assignment.created_at)}
     );`,
    ...insertRows(database, 'staff_assignments', "id = 'PGBL-V2-ASSIGNMENT'"),
    ...insertRows(database, 'reference_records', "id = 'PGBL-V2-REFERENCE'"),
    ...insertRows(database, 'reference_links', "id = 'PGBL-V2-REFERENCE-LINK'"),
  );

  for (const key of ['playground.clean_baseline', 'playground.baseline_id', 'playground.baseline_version']) {
    const row = database.prepare('SELECT * FROM app_metadata WHERE key = ?').get(key);
    statements.push(
      `INSERT INTO app_metadata (key, value, updated_at) VALUES (${sql(row.key)}, ${sql(row.value)}, ${sql(row.updated_at)}) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at;`,
    );
  }
} finally {
  database.close();
}

statements.push('PRAGMA foreign_key_check;');
const output = `${statements.join('\n')}\n`;
for (const forbidden of [/\bDROP\b/iu, /\bDELETE\b/iu, /\bALTER\b/iu, /\bCREATE\s+TABLE\b/iu]) {
  if (forbidden.test(output))
    throw new Error('Generated overlay contains a destructive or schema-changing statement.');
}
if (!output.includes('PGBL-20260828-COVERAGE-V2'))
  throw new Error('Generated overlay lacks the v2 baseline identity.');
await writeFile(outputPath, output, { flag: 'wx', mode: 0o600 });
await readFile(outputPath);
console.log('Playground baseline v2 additive overlay: GENERATED');
console.log(
  'No drop, delete, alter, create-table, Production read, provider identifier, or private evidence was emitted.',
);
