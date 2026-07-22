import { mkdir, realpath, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { webcrypto } from 'node:crypto';
import { createPasswordKdf } from '../../src/server/auth/crypto.js';

const repoRoot = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));
const DEFAULT_PASSWORD = 'LocalOnly!Pass2026';
const TEMPORARY_PASSWORD = 'Temporary!Local2026';

function isInside(parent, candidate) {
  const relative = path.relative(path.resolve(parent), path.resolve(candidate));
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function sql(value) {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number') return String(value);
  return `'${String(value).replaceAll("'", "''")}'`;
}

function argument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : '';
}

async function main() {
  const requestedOutput = argument('--output');
  if (!requestedOutput || !path.isAbsolute(requestedOutput)) {
    throw new Error('Use --output with an absolute path outside the repository.');
  }
  const destination = path.resolve(requestedOutput);
  const starterOnly = process.argv.includes('--starter-only');
  if (isInside(repoRoot, destination)) {
    throw new Error('Refusing to create a local credential seed inside the repository.');
  }
  await mkdir(path.dirname(destination), { recursive: true });
  const parent = await realpath(path.dirname(destination));
  const resolved = path.join(parent, path.basename(destination));
  const kdf = createPasswordKdf({
    cryptoProvider: webcrypto,
    timingSafeEqual: () => false,
  });
  const definitions = [
    ['LOCAL-ADMIN', 'LOCAL.ADMIN', 'Local Administrator', 'ADMINISTRATOR', null],
    ['LOCAL-DIRECTOR', 'LOCAL.DIRECTOR', 'Local Director', 'DIRECTOR', null],
    ['LOCAL-FOOD', 'LOCAL.FOOD', 'Local Food Operator', 'DOL_STAFF', 'COM_FOOD'],
    ['LOCAL-INVENTORY', 'LOCAL.INVENTORY', 'Local Inventory Operator', 'DOL_STAFF', 'COM_INVENTORY_PANTRY'],
    ['LOCAL-MATERIALS', 'LOCAL.MATERIALS', 'Local Materials Operator', 'DOL_STAFF', 'COM_MATERIALS'],
  ];
  const createdAt = '2026-07-22T00:00:00.000Z';
  const statements = ['PRAGMA foreign_keys = ON;', 'BEGIN TRANSACTION;'];
  if (!starterOnly) {
    for (const [id, accessId, displayName, roleId, committeeId] of definitions) {
      const credential = await kdf.hash(DEFAULT_PASSWORD);
      statements.push(
        `INSERT OR REPLACE INTO accounts (` +
          `id, access_id_normalized, status, role_id, default_committee_id, profile_full_name, ` +
          `profile_mobile_number, profile_email, password_credential_json, temporary_credential_json, ` +
          `credential_version, onboarding_completed_at, created_at, updated_at` +
          `) VALUES (` +
          [
            id,
            accessId,
            'ACTIVE',
            roleId,
            committeeId,
            displayName,
            '+639000000000',
            `${accessId.toLowerCase().replace('.', '-')}@example.invalid`,
            JSON.stringify(credential),
            null,
            1,
            createdAt,
            createdAt,
            createdAt,
          ]
            .map(sql)
            .join(', ') +
          `);`,
      );
      statements.push(`DELETE FROM account_committees WHERE account_id = ${sql(id)};`);
      if (committeeId) {
        statements.push(
          `INSERT INTO account_committees (` +
            `account_id, committee_id, membership_type, active, source` +
            `) VALUES (${sql(id)}, ${sql(committeeId)}, 'ASSIGNED', 1, 'LOCAL_SYNTHETIC');`,
        );
      }
    }
  }
  const temporaryCredential = await kdf.hash(TEMPORARY_PASSWORD);
  statements.push(
    `INSERT OR REPLACE INTO accounts (` +
      `id, access_id_normalized, status, role_id, default_committee_id, profile_full_name, ` +
      `profile_mobile_number, profile_email, password_credential_json, temporary_credential_json, ` +
      `credential_version, onboarding_completed_at, created_at, updated_at` +
      `) VALUES (` +
      [
        'LOCAL-STARTER',
        'LOCAL.STARTER',
        'STARTER',
        'DOL_STAFF',
        'COM_FOOD',
        null,
        null,
        null,
        null,
        JSON.stringify({
          ...temporaryCredential,
          expiresAt: '2027-07-22T00:00:00.000Z',
          consumedAt: null,
        }),
        1,
        null,
        createdAt,
        createdAt,
      ]
        .map(sql)
        .join(', ') +
      `);`,
    `DELETE FROM account_committees WHERE account_id = 'LOCAL-STARTER';`,
    `INSERT INTO account_committees (` +
      `account_id, committee_id, membership_type, active, source` +
      `) VALUES ('LOCAL-STARTER', 'COM_FOOD', 'ASSIGNED', 1, 'LOCAL_SYNTHETIC');`,
  );
  if (!starterOnly) {
  statements.push(
    `INSERT OR REPLACE INTO event_series (id, code, name, status, created_at, updated_at) VALUES (` +
      `'SER-LOCAL', 'LOCAL', 'Local Synthetic Series', 'ACTIVE', ${sql(createdAt)}, ${sql(createdAt)});`,
    `INSERT OR REPLACE INTO events (` +
      `id, event_series_id, name, starts_at, ends_at, venue, owner_committee_id, department, status, active, created_at, updated_at` +
      `) VALUES (` +
      `'EVT-LOCAL', 'SER-LOCAL', 'Local Synthetic Event', '2026-08-01T08:00:00+08:00', ` +
      `'2026-08-01T17:00:00+08:00', 'Synthetic Venue', 'COM_INVENTORY_PANTRY', ` +
      `'Department of Logistics', 'ACTIVE', 1, ${sql(createdAt)}, ${sql(createdAt)});`,
    `INSERT OR REPLACE INTO inventory_items (` +
      `id, name, category, stock_area, handling, unit, opening_quantity, status, catalog_type, ` +
      `storage_location, reorder_threshold, lending_audience, default_loan_days, maximum_loan_quantity, ` +
      `approval_required, created_at, updated_at, updated_by` +
      `) VALUES (` +
      `'ITM-LOCAL-001', 'Synthetic Folding Chair', 'Equipment', 'Office Inventory', 'LOANABLE', ` +
      `'piece', 20, 'ACTIVE', 'OFFICE_INVENTORY', 'Synthetic Storage', 5, ` +
      `'STUDENTS_AND_STAFF', 3, 5, 1, ${sql(createdAt)}, ${sql(createdAt)}, 'LOCAL-SEED');`,
    `INSERT OR REPLACE INTO item_aliases (item_id, normalized_alias, display_alias) VALUES (` +
      `'ITM-LOCAL-001', 'CHAIR', 'Chair');`,
    `INSERT OR IGNORE INTO requests (` +
      `id, request_type, request_stage, event_series_id, event_id, requester_name, requester_email, ` +
      `department, priority, purpose, status, client_request_id, created_at, updated_at, created_by` +
      `) VALUES (` +
      `'REQ-LOCAL-RECEIVING', 'CATALOG_RESTOCK', 'PROCUREMENT', 'SER-LOCAL', 'EVT-LOCAL', ` +
      `'Synthetic Requester', '', 'Department of Logistics', 'NORMAL', 'Synthetic receiving seed', ` +
      `'ACCEPTED', 'LOCAL-RECEIVING-SEED', ${sql(createdAt)}, ${sql(createdAt)}, 'SYSTEM-IMPORT');`,
    `INSERT OR IGNORE INTO request_lines (` +
      `id, request_id, event_id, item_id, description, specification, category, requested_quantity, ` +
      `unit, fulfillment_source, released_quantity, received_quantity, status, client_line_id, ` +
      `workflow_revision, created_at, updated_at, created_by` +
      `) VALUES (` +
      `'LIN-LOCAL-RECEIVING', 'REQ-LOCAL-RECEIVING', 'EVT-LOCAL', 'ITM-LOCAL-001', ` +
      `'Synthetic Folding Chair', 'Synthetic receiving fixture', 'Equipment', 10, 'piece', ` +
      `'FOR_CANVASSING', 0, 0, 'PROCURED', 'LOCAL-RECEIVING-LINE', 1, ` +
      `${sql(createdAt)}, ${sql(createdAt)}, 'SYSTEM-IMPORT');`,
    `INSERT OR IGNORE INTO restock_requests (` +
      `id, source_request_id, source_request_line_id, item_id, requested_quantity, received_quantity, ` +
      `unit, supplier_name, status, assigned_committee_id, created_at, updated_at, created_by` +
      `) VALUES (` +
      `'RST-LOCAL-001', 'REQ-LOCAL-RECEIVING', 'LIN-LOCAL-RECEIVING', 'ITM-LOCAL-001', ` +
      `10, 0, 'piece', 'Synthetic Supplier', 'PROCURED', 'COM_INVENTORY_PANTRY', ` +
      `${sql(createdAt)}, ${sql(createdAt)}, 'SYSTEM-IMPORT');`,
    `INSERT OR IGNORE INTO deliverables (` +
      `id, request_id, request_line_id, event_series_id, event_id, inventory_match_id, item_spec, ` +
      `quantity_requested, quantity_received, quantity_released, unit, fulfillment_source, ` +
      `assigned_committee_id, status, created_at, updated_at, created_by` +
      `) VALUES (` +
      `'DEL-LOCAL-001', 'REQ-LOCAL-RECEIVING', 'LIN-LOCAL-RECEIVING', 'SER-LOCAL', 'EVT-LOCAL', ` +
      `'ITM-LOCAL-001', 'Synthetic Folding Chair', 10, 0, 0, 'piece', 'FOR_CANVASSING', ` +
      `'COM_MATERIALS', 'PROCURED', ${sql(createdAt)}, ${sql(createdAt)}, 'SYSTEM-IMPORT');`,
    `INSERT OR IGNORE INTO request_lines (` +
      `id, request_id, event_id, description, specification, category, requested_quantity, ` +
      `unit, fulfillment_source, released_quantity, received_quantity, status, client_line_id, ` +
      `workflow_revision, created_at, updated_at, created_by` +
      `) VALUES (` +
      `'LIN-LOCAL-CANVASS', 'REQ-LOCAL-RECEIVING', 'EVT-LOCAL', 'Synthetic Procurement Item', ` +
      `'Synthetic canvass fixture', 'Event Materials', 4, 'set', 'PROCUREMENT', 0, 0, ` +
      `'FOR_CANVASSING', 'LOCAL-CANVASS-LINE', 1, ${sql(createdAt)}, ${sql(createdAt)}, ` +
      `'SYSTEM-IMPORT');`,
    `INSERT OR IGNORE INTO deliverables (` +
      `id, request_id, request_line_id, event_series_id, event_id, item_spec, quantity_requested, ` +
      `quantity_received, quantity_released, unit, fulfillment_source, assigned_committee_id, ` +
      `budget_status, procurement_status, receipt_status, status, created_at, updated_at, created_by` +
      `) VALUES (` +
      `'DEL-LOCAL-CANVASS', 'REQ-LOCAL-RECEIVING', 'LIN-LOCAL-CANVASS', 'SER-LOCAL', ` +
      `'EVT-LOCAL', 'Synthetic Procurement Item', 4, 0, 0, 'set', 'PROCUREMENT', ` +
      `'COM_MATERIALS', 'NOT_STARTED', 'FOR_CANVASSING', 'MISSING', 'FOR_CANVASSING', ` +
      `${sql(createdAt)}, ${sql(createdAt)}, 'SYSTEM-IMPORT');`,
    `INSERT OR REPLACE INTO app_metadata (key, value, updated_at) VALUES (` +
      `'local_seed', 'SYNTHETIC_V1', ${sql(createdAt)});`,
    'COMMIT;',
  );
  } else {
    statements.push('COMMIT;');
  }
  await writeFile(resolved, `${statements.join('\n')}\n`, { flag: 'wx', mode: 0o600 });
  console.log('Synthetic local-only D1 seed created outside the repository.');
  if (!starterOnly) {
    console.log('Access IDs: LOCAL.ADMIN, LOCAL.DIRECTOR, LOCAL.FOOD, LOCAL.INVENTORY, LOCAL.MATERIALS');
    console.log('Active-account password label: repository-documented synthetic local credential only.');
  }
  console.log('Starter Access ID: LOCAL.STARTER');
  console.log('Starter-password label: repository-documented synthetic local temporary credential only.');
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
