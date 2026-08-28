import { createHash } from 'node:crypto';
import { copyFile, readFile, realpath, stat, writeFile } from 'node:fs/promises';
import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { dumpDatabase } from './baseline-data.mjs';

const repoRoot = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));
const CAPTURED_AT = '2026-08-28T10:00:00.000Z';
const OVERLAY_VERSION = 'PLAYGROUND_BASELINE_COVERAGE_V2';

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

function digest(value) {
  return createHash('sha256').update(value).digest('hex');
}

const sourcePath = await privateExisting(argument('--source-database'), 'Source baseline database');
const outputPath = await privateNew(argument('--output-database'), 'Output baseline database');
const sqlPath = await privateNew(argument('--output-sql'), 'Output baseline SQL');
const reportPath = await privateNew(argument('--output-report'), 'Output baseline report');
await copyFile(sourcePath, outputPath, 0);

const database = new DatabaseSync(outputPath);
let transactionOpen = false;
try {
  database.exec('PRAGMA foreign_keys = ON; BEGIN IMMEDIATE;');
  transactionOpen = true;
  const operator = database
    .prepare(
      `SELECT id, access_id_normalized
         FROM accounts
        WHERE role_id = 'SYSTEM_OWNER' AND status = 'ACTIVE'
        ORDER BY id
        LIMIT 1`,
    )
    .get();
  if (!operator) throw new Error('No active synthetic System Owner exists in the sanitized baseline.');
  const items = database
    .prepare(
      `SELECT item.id, item.unit, item.classification_status, item.inventory_kind,
              item.classification_revision
         FROM inventory_items item
         JOIN inventory_balances balance ON balance.item_id = item.id
        WHERE item.status = 'ACTIVE' AND balance.available_to_promise >= 10
        ORDER BY item.id
        LIMIT 3`,
    )
    .all();
  if (items.length < 3)
    throw new Error('Sanitized baseline lacks three positive-balance staging-safe items.');
  const [reusableItem, consumableItem, receivingItem] = items;
  const hierarchy = database
    .prepare(
      `SELECT series.id AS series_id, day.id AS day_id, event.id AS event_id
         FROM event_series series
         JOIN event_days day ON day.event_series_id = series.id
         JOIN events event ON event.event_day_id = day.id
        ORDER BY series.id, day.id, event.id
        LIMIT 1`,
    )
    .get();
  if (!hierarchy) throw new Error('Sanitized baseline lacks an event hierarchy.');

  const classify = database.prepare(
    `UPDATE inventory_items
        SET handling = ?2,
            is_lendable = 1,
            lending_kind = ?3,
            lending_status = 'ACTIVE',
            lending_unit = unit,
            lending_audience = 'STUDENTS_AND_STAFF',
            default_loan_days = ?4,
            maximum_loan_quantity = 2,
            due_date_required = ?5,
            condition_tracking = ?5,
            inventory_kind = ?3,
            classification_status = 'CLASSIFIED',
            condition_review_state = ?6,
            maintenance_review_state = 'CLEARED',
            classification_notes = ?7,
            classification_revision = classification_revision + 1,
            classified_at = ?8,
            classified_by = ?9,
            updated_at = ?8,
            updated_by = ?9
      WHERE id = ?1`,
  );
  const history = database.prepare(
    `INSERT INTO inventory_classification_history (
       id, item_id, revision, previous_status, new_status, previous_kind, new_kind,
       lendable_enabled, lending_audience, condition_review_state, maintenance_review_state,
       asset_instance_count, classification_notes, evidence_id, bulk_group_id,
       occurred_at, actor_account_id, correlation_id
     ) VALUES (?1, ?2, ?3, ?4, 'CLASSIFIED', ?5, ?6, 1, 'STUDENTS_AND_STAFF', ?7, 'CLEARED',
       0, ?8, '', 'PGBL-V2', ?9, ?10, ?11)`,
  );
  for (const [index, item] of [reusableItem, consumableItem].entries()) {
    const reusable = index === 0;
    const kind = reusable ? 'REUSABLE' : 'CONSUMABLE';
    const note = `${OVERLAY_VERSION}:${kind}`;
    classify.run(
      item.id,
      reusable ? 'REUSABLE_ASSET' : 'CONSUMABLE',
      kind,
      reusable ? 7 : null,
      reusable ? 1 : 0,
      reusable ? 'GOOD' : 'NOT_APPLICABLE',
      note,
      CAPTURED_AT,
      operator.id,
    );
    history.run(
      `PGBL-V2-CLS-${index + 1}`,
      item.id,
      Number(item.classification_revision) + 1,
      item.classification_status,
      item.inventory_kind,
      kind,
      reusable ? 'GOOD' : 'NOT_APPLICABLE',
      note,
      CAPTURED_AT,
      operator.id,
      `PGBL-V2-CLS-${index + 1}`,
    );
  }

  const request = database.prepare(
    `INSERT INTO requests (
       id, request_type, request_stage, event_series_id, event_id, catalog_type,
       requester_account_id, requester_name, requester_email, department, priority,
       purpose, status, client_request_id, notes, created_at, updated_at, created_by
     ) VALUES (?1, 'MATERIALS', 'REVIEW', ?2, ?3, 'INVENTORY', ?4,
       'Playground workflow requester', 'playground-workflow@example.test', 'Department of Logistics',
       'NORMAL', ?5, ?6, ?7, ?8, ?9, ?9, ?4)`,
  );
  request.run(
    'PGBL-V2-REQ-ACCEPTED',
    hierarchy.series_id,
    hierarchy.event_id,
    operator.id,
    'Staging-safe accepted stock workflow',
    'ACCEPTED',
    'PGBL-V2-REQ-ACCEPTED',
    OVERLAY_VERSION,
    CAPTURED_AT,
  );
  request.run(
    'PGBL-V2-REQ-SPLIT',
    hierarchy.series_id,
    hierarchy.event_id,
    operator.id,
    'Staging-safe split workflow',
    'PARTIALLY_FULFILLED',
    'PGBL-V2-REQ-SPLIT',
    OVERLAY_VERSION,
    CAPTURED_AT,
  );
  const line = database.prepare(
    `INSERT INTO request_lines (
       id, request_id, event_id, item_id, description, specification, category,
       requested_quantity, unit, fulfillment_source, split_group_id, released_quantity,
       received_quantity, status, client_line_id, notes, created_at, updated_at, created_by
     ) VALUES (?1, ?2, ?3, ?4, ?5, 'Staging-safe deterministic coverage', 'PLAYGROUND',
       ?6, ?7, ?8, ?9, 0, 0, ?10, ?11, ?12, ?13, ?13, ?14)`,
  );
  line.run(
    'PGBL-V2-LINE-ACCEPTED',
    'PGBL-V2-REQ-ACCEPTED',
    hierarchy.event_id,
    reusableItem.id,
    'Accepted stock line',
    1,
    reusableItem.unit,
    'ISSUE_FROM_STOCK',
    null,
    'ACCEPTED',
    'PGBL-V2-LINE-ACCEPTED',
    OVERLAY_VERSION,
    CAPTURED_AT,
    operator.id,
  );
  line.run(
    'PGBL-V2-LINE-SPLIT-A',
    'PGBL-V2-REQ-SPLIT',
    hierarchy.event_id,
    consumableItem.id,
    'Completed split stock line',
    1,
    consumableItem.unit,
    'ISSUE_FROM_STOCK',
    'PGBL-V2-SPLIT-1',
    'COMPLETED',
    'PGBL-V2-LINE-SPLIT-A',
    OVERLAY_VERSION,
    CAPTURED_AT,
    operator.id,
  );
  line.run(
    'PGBL-V2-LINE-SPLIT-B',
    'PGBL-V2-REQ-SPLIT',
    hierarchy.event_id,
    null,
    'Accepted split procurement line',
    2,
    consumableItem.unit,
    'PROCUREMENT',
    'PGBL-V2-SPLIT-1',
    'ACCEPTED',
    'PGBL-V2-LINE-SPLIT-B',
    OVERLAY_VERSION,
    CAPTURED_AT,
    operator.id,
  );
  database
    .prepare(
      `INSERT INTO reservations (
         id, item_id, quantity, unit, request_line_id, status, idempotency_key,
         notes, created_at, updated_at, created_by
       ) VALUES ('PGBL-V2-RES-ACTIVE', ?1, 1, ?2, 'PGBL-V2-LINE-ACCEPTED', 'ACTIVE',
         'PGBL-V2-RES-ACTIVE', ?3, ?4, ?4, ?5)`,
    )
    .run(reusableItem.id, reusableItem.unit, OVERLAY_VERSION, CAPTURED_AT, operator.id);

  const lending = database.prepare(
    `INSERT INTO lending_tickets (
       id, borrower_reference, borrower_name, borrower_type, department_organization,
       contact, item_id, quantity, unit, purpose, due_at, ticket_type, status,
       approved_by, approved_at, created_by, notes, created_at, updated_at,
       requested_start_at, requested_end_at
     ) VALUES (?1, ?2, 'Playground borrower', 'STAFF', 'Department of Logistics',
       '', ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?14, ?14, ?7)`,
  );
  const lendingRows = [
    [
      'PGBL-V2-LND-REVIEW',
      'playground-review',
      reusableItem.id,
      1,
      reusableItem.unit,
      'Review coverage',
      null,
      'LOAN',
      'FOR_REVIEW',
      null,
      null,
    ],
    [
      'PGBL-V2-LND-READY',
      'playground-ready',
      reusableItem.id,
      1,
      reusableItem.unit,
      'Ready-to-claim coverage',
      '2026-09-05T10:00:00.000Z',
      'LOAN',
      'READY_TO_CLAIM',
      operator.id,
      CAPTURED_AT,
    ],
    [
      'PGBL-V2-LND-OVERDUE',
      'playground-overdue',
      reusableItem.id,
      1,
      reusableItem.unit,
      'Active overdue reusable coverage',
      '2026-08-20T10:00:00.000Z',
      'LOAN',
      'ON_LOAN',
      operator.id,
      CAPTURED_AT,
    ],
    [
      'PGBL-V2-LND-CONSUMED',
      'playground-consumed',
      consumableItem.id,
      1,
      consumableItem.unit,
      'Consumable completion coverage',
      null,
      'CONSUMABLE',
      'COMPLETED',
      operator.id,
      CAPTURED_AT,
    ],
  ];
  for (const [
    id,
    reference,
    itemId,
    quantity,
    unit,
    purpose,
    dueAt,
    type,
    status,
    approvedBy,
    approvedAt,
  ] of lendingRows) {
    lending.run(
      id,
      reference,
      itemId,
      quantity,
      unit,
      purpose,
      dueAt,
      type,
      status,
      approvedBy,
      approvedAt,
      operator.id,
      OVERLAY_VERSION,
      CAPTURED_AT,
    );
  }
  const handoff = database.prepare(
    `INSERT INTO lending_handoffs (id, lending_ticket_id, released_by, released_at, idempotency_key, notes)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6)`,
  );
  const ledger = database.prepare(
    `INSERT INTO inventory_ledger (
       id, created_at, transaction_type, direction, item_id, quantity, unit, signed_quantity,
       related_entity_type, related_entity_id, actor_account_id, idempotency_key, status, notes
     ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, 'POSTED', ?13)`,
  );
  const statusHistory = database.prepare(
    `INSERT INTO status_history (
       id, entity_type, entity_id, previous_status, new_status, changed_at,
       changed_by, reason, idempotency_key, metadata_json
     ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, '{}')`,
  );
  const audit = database.prepare(
    `INSERT INTO audit_log (
       id, created_at, action, entity_type, entity_id, actor_account_id,
       before_json, after_json, correlation_id, notes
     ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, '{}', '{}', ?7, ?8)`,
  );
  for (const [suffix, ticketId, item, transactionType, quantity] of [
    ['OVERDUE', 'PGBL-V2-LND-OVERDUE', reusableItem, 'LOAN_OUT', 1],
    ['CONSUMED', 'PGBL-V2-LND-CONSUMED', consumableItem, 'ISSUE', 1],
  ]) {
    const idempotencyKey = `PGBL-V2-HANDOFF-${suffix}`;
    handoff.run(`PGBL-V2-HND-${suffix}`, ticketId, operator.id, CAPTURED_AT, idempotencyKey, OVERLAY_VERSION);
    ledger.run(
      `PGBL-V2-LEDGER-${suffix}`,
      CAPTURED_AT,
      transactionType,
      'OUT',
      item.id,
      quantity,
      item.unit,
      -quantity,
      'LENDING',
      ticketId,
      operator.id,
      idempotencyKey,
      OVERLAY_VERSION,
    );
    const nextStatus = suffix === 'CONSUMED' ? 'COMPLETED' : 'ON_LOAN';
    statusHistory.run(
      `PGBL-V2-HIST-HANDOFF-${suffix}`,
      'LENDING',
      ticketId,
      'READY_TO_CLAIM',
      nextStatus,
      CAPTURED_AT,
      operator.id,
      OVERLAY_VERSION,
      idempotencyKey,
    );
    audit.run(
      `PGBL-V2-AUDIT-HANDOFF-${suffix}`,
      CAPTURED_AT,
      suffix === 'CONSUMED' ? 'CONSUMABLE_ISSUE_CONFIRMED' : 'LENDING_HANDOFF_CONFIRMED',
      'LENDING',
      ticketId,
      operator.id,
      idempotencyKey,
      OVERLAY_VERSION,
    );
  }

  const restock = database.prepare(
    `INSERT INTO restock_requests (
       id, item_id, requested_quantity, received_quantity, unit, supplier_name,
       status, notes, created_at, updated_at, created_by
     ) VALUES (?1, ?2, ?3, ?4, ?5, 'Playground supplier', ?6, ?7, ?8, ?8, ?9)`,
  );
  restock.run(
    'PGBL-V2-RST-OPEN',
    receivingItem.id,
    5,
    0,
    receivingItem.unit,
    'OPEN',
    OVERLAY_VERSION,
    CAPTURED_AT,
    operator.id,
  );
  restock.run(
    'PGBL-V2-RST-PARTIAL',
    receivingItem.id,
    10,
    3,
    receivingItem.unit,
    'PARTIALLY_RECEIVED',
    OVERLAY_VERSION,
    CAPTURED_AT,
    operator.id,
  );
  const receiveId = 'PGBL-V2-RCV-PARTIAL';
  const receiveKey = 'PGBL-V2-RECEIVE-PARTIAL';
  database
    .prepare(
      `INSERT INTO restock_receipts (
         id, restock_request_id, quantity, unit, invoice_status, invoice_number,
         idempotency_key, received_at, received_by, notes
       ) VALUES (?1, 'PGBL-V2-RST-PARTIAL', 3, ?2, 'STAGING_SAFE', '', ?3, ?4, ?5, ?6)`,
    )
    .run(receiveId, receivingItem.unit, receiveKey, CAPTURED_AT, operator.id, OVERLAY_VERSION);
  database
    .prepare(
      `INSERT INTO receiving_records (
         id, entity_type, entity_id, item_id, quantity, unit, received_by,
         received_at, idempotency_key, notes
       ) VALUES (?1, 'RESTOCK', 'PGBL-V2-RST-PARTIAL', ?2, 3, ?3, ?4, ?5, ?6, ?7)`,
    )
    .run(
      receiveId,
      receivingItem.id,
      receivingItem.unit,
      operator.id,
      CAPTURED_AT,
      receiveKey,
      OVERLAY_VERSION,
    );
  ledger.run(
    'PGBL-V2-LEDGER-RECEIVE',
    CAPTURED_AT,
    'RECEIVE',
    'IN',
    receivingItem.id,
    3,
    receivingItem.unit,
    3,
    'RESTOCK',
    'PGBL-V2-RST-PARTIAL',
    operator.id,
    receiveKey,
    OVERLAY_VERSION,
  );
  statusHistory.run(
    'PGBL-V2-HIST-RECEIVE',
    'RESTOCK',
    'PGBL-V2-RST-PARTIAL',
    'OPEN',
    'PARTIALLY_RECEIVED',
    CAPTURED_AT,
    operator.id,
    OVERLAY_VERSION,
    receiveKey,
  );
  audit.run(
    'PGBL-V2-AUDIT-RECEIVE',
    CAPTURED_AT,
    'RESTOCK_RECEIVED',
    'RESTOCK',
    'PGBL-V2-RST-PARTIAL',
    operator.id,
    receiveKey,
    OVERLAY_VERSION,
  );

  const eventLink = database.prepare(
    `INSERT INTO event_operational_links (
       id, event_series_id, event_day_id, event_id, link_type,
       linked_entity_type, linked_entity_id, notes, linked_by, linked_at
     ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)`,
  );
  eventLink.run(
    'PGBL-V2-EOL-REQUEST',
    hierarchy.series_id,
    hierarchy.day_id,
    hierarchy.event_id,
    'REQUEST',
    'REQUEST',
    'PGBL-V2-REQ-ACCEPTED',
    OVERLAY_VERSION,
    operator.id,
    CAPTURED_AT,
  );
  eventLink.run(
    'PGBL-V2-EOL-INVENTORY',
    hierarchy.series_id,
    hierarchy.day_id,
    hierarchy.event_id,
    'INVENTORY_REQUIREMENT',
    'INVENTORY_ITEM',
    reusableItem.id,
    OVERLAY_VERSION,
    operator.id,
    CAPTURED_AT,
  );

  const personId = 'PER-00000000-0000-4000-8000-000000000001';
  database
    .prepare(
      `INSERT INTO canonical_people (person_id, source_provenance_envelope, created_at)
       VALUES (?1, NULL, ?2)`,
    )
    .run(personId, CAPTURED_AT);
  database
    .prepare(
      `INSERT INTO staff_account_activity_transition_context (
         transition_id, source_kind, source_id, account_staff_link_id, staff_assignment_id,
         action_code, person_id, account_id, old_link_state, new_link_state,
         old_assignment_state, new_assignment_state, old_effective_from, old_effective_to,
         new_effective_from, new_effective_to, correlation_id, created_at
       ) VALUES (
         'TRN-00000000000000000000000000000001', 'ACCOUNT_STAFF_LINK',
         'PGBL-V2-STAFF-LINK', 'PGBL-V2-STAFF-LINK', NULL,
         'LINK_CREATED', ?1, ?2, NULL, 'ACTIVE', NULL, NULL, NULL, NULL, NULL, NULL,
         'PGBL-V2-STAFF-LINK', ?3
       )`,
    )
    .run(personId, operator.id, CAPTURED_AT);
  database
    .prepare(
      `INSERT INTO account_staff_links (
         id, account_id, person_id, state, source_provenance_envelope, created_at, updated_at
       ) VALUES ('PGBL-V2-STAFF-LINK', ?1, ?2, 'ACTIVE', NULL, ?3, ?3)`,
    )
    .run(operator.id, personId, CAPTURED_AT);
  database
    .prepare(
      `INSERT INTO staff_account_activity_transition_context (
         transition_id, source_kind, source_id, account_staff_link_id, staff_assignment_id,
         action_code, person_id, account_id, old_link_state, new_link_state,
         old_assignment_state, new_assignment_state, old_effective_from, old_effective_to,
         new_effective_from, new_effective_to, correlation_id, created_at
       ) VALUES (
         'TRN-00000000000000000000000000000002', 'STAFF_ASSIGNMENT',
         'PGBL-V2-ASSIGNMENT', NULL, 'PGBL-V2-ASSIGNMENT',
         'ASSIGNMENT_CREATED', ?1, NULL, NULL, NULL, NULL, 'ACTIVE', NULL, NULL, ?2, NULL,
         'PGBL-V2-ASSIGNMENT', ?2
       )`,
    )
    .run(personId, CAPTURED_AT);
  database
    .prepare(
      `INSERT INTO staff_assignments (
         id, person_id, assignment_fingerprint, protected_assignment_envelope,
         state, effective_from, source_provenance_envelope, created_at, updated_at
       ) VALUES ('PGBL-V2-ASSIGNMENT', ?1, 'playground-assignment-fingerprint-v2',
         '{"playgroundSynthetic":true}', 'ACTIVE', ?2, NULL, ?2, ?2)`,
    )
    .run(personId, CAPTURED_AT);
  database
    .prepare(
      `INSERT INTO reference_records (
         id, domain, stable_id, revision, status, payload_json,
         effective_from, created_at, updated_at, created_by
       ) VALUES ('PGBL-V2-REFERENCE', 'PLAYGROUND', 'WORKFLOW-COVERAGE', 1, 'ACTIVE',
         '{"playgroundSynthetic":true,"purpose":"workflow coverage"}', ?1, ?1, ?1, ?2)`,
    )
    .run(CAPTURED_AT, operator.id);
  database
    .prepare(
      `INSERT INTO reference_links (
         id, label, url, route_id, link_type, audience, status, revision,
         sync_state, created_by_account_id, updated_by_account_id, created_at, updated_at
       ) VALUES ('PGBL-V2-REFERENCE-LINK', 'Playground Administration', '', 'administration',
         'INTERNAL_ROUTE', 'STAFF', 'ACTIVE', 1, 'NOT_CONFIGURED', ?1, ?1, ?2, ?2)`,
    )
    .run(operator.id, CAPTURED_AT);

  const sourceMetadata = JSON.parse(
    String(
      database.prepare("SELECT value FROM app_metadata WHERE key = 'playground.clean_baseline'").get()
        ?.value ?? '{}',
    ),
  );
  const baselineMetadata = {
    ...sourceMetadata,
    baselineId: 'PGBL-20260828-COVERAGE-V2',
    baselineVersion: 2,
    sourceBaselineId: 'PGBL-20260827-59beb9c28963',
    sourceClassification: 'DERIVED_FROM_PRIVACY_FILTERED_BASELINE_NO_NEW_PRODUCTION_READ',
    coverageOverlayVersion: OVERLAY_VERSION,
    capturedAt: CAPTURED_AT,
  };
  const metadata = database.prepare(
    `INSERT INTO app_metadata (key, value, updated_at) VALUES (?1, ?2, ?3)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`,
  );
  metadata.run('playground.clean_baseline', JSON.stringify(baselineMetadata), CAPTURED_AT);
  metadata.run('playground.baseline_id', baselineMetadata.baselineId, CAPTURED_AT);
  metadata.run('playground.baseline_version', String(baselineMetadata.baselineVersion), CAPTURED_AT);
  metadata.run(
    'playground.working_state',
    JSON.stringify({ state: 'CLEAN', activeTestSession: false, updatedAt: CAPTURED_AT }),
    CAPTURED_AT,
  );

  database.exec('COMMIT;');
  transactionOpen = false;
  database.exec('PRAGMA foreign_keys = ON;');
  const integrity = String(
    database.prepare('PRAGMA integrity_check').get()?.integrity_check ?? '',
  ).toLowerCase();
  const foreignKeyViolations = database.prepare('PRAGMA foreign_key_check').all().length;
  if (integrity !== 'ok' || foreignKeyViolations !== 0) {
    throw new Error('Derived Playground baseline failed integrity or foreign-key checks.');
  }
} finally {
  if (transactionOpen) database.exec('ROLLBACK;');
  database.close();
}

const sql = dumpDatabase(outputPath);
await writeFile(sqlPath, sql, { flag: 'wx', mode: 0o600 });
const databaseBytes = await readFile(outputPath);
const report = {
  status: 'PASS',
  baselineId: 'PGBL-20260828-COVERAGE-V2',
  baselineVersion: 2,
  sourceBaselineId: 'PGBL-20260827-59beb9c28963',
  sourceClassification: 'DERIVED_FROM_PRIVACY_FILTERED_BASELINE_NO_NEW_PRODUCTION_READ',
  coverageOverlayVersion: OVERLAY_VERSION,
  capturedAt: CAPTURED_AT,
  databaseSha256: digest(databaseBytes),
  sqlSha256: digest(sql),
  productionMutation: 'ZERO',
};
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
console.log('Playground baseline coverage v2: CREATED AND LOCALLY VERIFIED');
console.log('Private database, SQL, and report paths and row identities were not printed.');
