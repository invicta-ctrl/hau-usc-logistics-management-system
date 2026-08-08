import { createPasswordKdf } from '../src/server/auth/crypto.js';
import { randomBytes, webcrypto } from 'node:crypto';

const SEED_VERSION = 'V0721_SYNTHETIC_1';

function q(value) {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number') return String(value);
  return `'${String(value).replaceAll("'", "''")}'`;
}

function generationLabel(generation) {
  if (!Number.isSafeInteger(generation) || generation < 1 || generation > 9999) {
    throw new Error('Sandbox generation must be an integer from 1 through 9999.');
  }
  return `G${String(generation).padStart(4, '0')}`;
}

export const SANDBOX_ACTORS = Object.freeze([
  ['OWNER', 'SYSTEM_OWNER', null, 'Synthetic System Owner', 'ACTIVE'],
  ['ADMIN', 'ADMINISTRATOR', null, 'Synthetic Administrator', 'ACTIVE'],
  ['DIRECTOR', 'DIRECTOR', null, 'Synthetic Director Reviewer', 'ACTIVE'],
  ['FOOD-HEAD', 'COMMITTEE_HEAD', 'COM_FOOD', 'Synthetic Food Committee Head', 'ACTIVE'],
  ['FOOD-MEMBER', 'DOL_STAFF', 'COM_FOOD', 'Synthetic Food Committee Member', 'ACTIVE'],
  ['INVENTORY', 'DOL_STAFF', 'COM_INVENTORY_PANTRY', 'Synthetic Inventory Staff', 'ACTIVE'],
  ['MATERIALS', 'DOL_STAFF', 'COM_MATERIALS', 'Synthetic Materials Staff', 'ACTIVE'],
  ['REQUESTER', 'REQUESTER', null, 'Synthetic Department Requester', 'ACTIVE'],
  ['LENDING', 'REQUESTER', null, 'Synthetic Lending-only User', 'ACTIVE'],
  ['DISABLED', 'REQUESTER', null, 'Synthetic Disabled User', 'DISABLED'],
  ['DENIED', 'READ_ONLY_AUDITOR', null, 'Synthetic Denied Actor', 'ACTIVE'],
]);

export function createSandboxPasswords(random = randomBytes) {
  return Object.fromEntries(
    SANDBOX_ACTORS.map(([key]) => [key, `Sbx!${random(18).toString('base64url')}9a`]),
  );
}

export async function createSandboxCredentials({ generation, pepper, passwords }) {
  if (typeof pepper !== 'string' || pepper.length < 16)
    throw new Error('Private staging pepper is required.');
  const label = generationLabel(generation);
  const source = passwords ?? createSandboxPasswords();
  const kdf = createPasswordKdf({
    cryptoProvider: webcrypto,
    pepper,
    timingSafeEqual: () => false,
  });
  const credentials = {};
  for (const [key] of SANDBOX_ACTORS) {
    const password = source[key];
    credentials[key] = {
      accountId: `SBX-${label}-ACC-${key}`,
      accessId: `SBX.${label}.${key}`,
      password,
      credential: await kdf.hash(password),
    };
  }
  return credentials;
}

function inventoryDefinition(index) {
  const number = String(index).padStart(2, '0');
  const reusable = index % 4 === 0;
  const outOfStock = index % 11 === 0;
  const lowStock = !outOfStock && index % 7 === 0;
  const quantity = outOfStock ? 0 : lowStock ? 2 : 20 + index;
  return {
    idSuffix: number,
    name: `Synthetic ${reusable ? 'Reusable Asset' : 'Consumable Supply'} ${number}`,
    category: reusable ? 'Equipment' : index % 3 === 0 ? 'Pantry' : 'Event Materials',
    handling: reusable ? 'LOANABLE' : 'CONSUMABLE',
    catalogType: reusable ? 'OFFICE_INVENTORY' : index % 3 === 0 ? 'PANTRY' : 'EVENT_SPECIFIC',
    quantity,
    reorderThreshold: lowStock || outOfStock ? 5 : 3,
    reusable,
  };
}

export function buildSandboxSeedSql({ generation, now, credentials }) {
  const label = generationLabel(generation);
  const prefix = `SBX-${label}`;
  if (!credentials || SANDBOX_ACTORS.some(([key]) => !credentials[key]?.credential)) {
    throw new Error('Complete private sandbox credentials are required.');
  }
  const statements = ['PRAGMA foreign_keys = ON;'];
  for (const [key, roleId, committeeId, displayName, status] of SANDBOX_ACTORS) {
    const entry = credentials[key];
    statements.push(
      `INSERT INTO accounts (` +
        `id, access_id_normalized, status, role_id, default_committee_id, profile_full_name, ` +
        `profile_mobile_number, profile_email, password_credential_json, credential_version, ` +
        `onboarding_completed_at, profile_email_verified_at, lending_eligible, institution_id, ` +
        `created_at, updated_at) VALUES (` +
        [
          entry.accountId,
          entry.accessId,
          status,
          roleId,
          committeeId,
          displayName,
          '+639000000000',
          `${key.toLowerCase()}-${label.toLowerCase()}@example.invalid`,
          JSON.stringify(entry.credential),
          1,
          now,
          now,
          key === 'LENDING' ? 1 : 0,
          key === 'LENDING' ? `${prefix}-INSTITUTION` : '',
          now,
          now,
        ]
          .map(q)
          .join(', ') +
        `);`,
      `INSERT INTO access_id_reservations (` +
        `collision_key, account_id, access_id_snapshot, reserved_at, reservation_reason) VALUES (` +
        `${q(entry.accessId.replace(/[._-]/gu, ''))}, ${q(entry.accountId)}, ${q(entry.accessId)}, ${q(now)}, ` +
        `${q(`${SEED_VERSION}:${label}`)});`,
    );
    if (committeeId) {
      statements.push(
        `INSERT INTO account_committees (account_id, committee_id, membership_type, active, source) ` +
          `VALUES (${q(entry.accountId)}, ${q(committeeId)}, 'ASSIGNED', 1, ${q(SEED_VERSION)});`,
      );
    }
  }

  const owner = credentials.OWNER.accountId;
  const inventoryActor = credentials.INVENTORY.accountId;
  const requester = credentials.REQUESTER.accountId;
  const lendingActor = credentials.LENDING.accountId;
  statements.push(
    `INSERT INTO event_series (` +
      `id, code, name, status, owner_review_status, notes, created_at, updated_at, created_by, updated_by) ` +
      `VALUES (${q(`${prefix}-SER-01`)}, ${q(`SBX${label}`)}, 'Synthetic Sandbox Series', 'ACTIVE', ` +
      `'REVIEW_COMPLETE', ${q(SEED_VERSION)}, ${q(now)}, ${q(now)}, ${q(owner)}, ${q(owner)});`,
    `INSERT INTO event_days (` +
      `id, event_series_id, name, event_date, status, owner_review_status, notes, active, ` +
      `created_at, updated_at, created_by, updated_by) VALUES (` +
      `${q(`${prefix}-DAY-01`)}, ${q(`${prefix}-SER-01`)}, 'Synthetic Sandbox Day', '2026-09-01', ` +
      `'UPCOMING', 'REVIEW_COMPLETE', ${q(SEED_VERSION)}, 1, ${q(now)}, ${q(now)}, ${q(owner)}, ${q(owner)});`,
    `INSERT INTO events (` +
      `id, event_series_id, event_day_id, name, code, activity_type, included_items_json, ` +
      `starts_at, ends_at, venue, owner_committee_id, department, status, owner_review_status, ` +
      `active, created_at, updated_at, created_by, updated_by) VALUES (` +
      `${q(`${prefix}-EVT-01`)}, ${q(`${prefix}-SER-01`)}, ${q(`${prefix}-DAY-01`)}, ` +
      `'Synthetic Logistics Exercise', 'SBX-ACT-01', 'LOGISTICS', '[]', ` +
      `'2026-09-01T08:00:00+08:00', '2026-09-01T17:00:00+08:00', 'Synthetic Test Venue', ` +
      `'COM_INVENTORY_PANTRY', 'Department of Logistics', 'ACTIVE', 'REVIEW_COMPLETE', 1, ` +
      `${q(now)}, ${q(now)}, ${q(owner)}, ${q(owner)});`,
  );

  for (let index = 1; index <= 36; index += 1) {
    const item = inventoryDefinition(index);
    const itemId = `${prefix}-ITM-${item.idSuffix}`;
    statements.push(
      `INSERT INTO inventory_items (` +
        `id, name, category, stock_area, handling, unit, opening_quantity, status, catalog_type, ` +
        `storage_location, reorder_threshold, lending_audience, default_loan_days, maximum_loan_quantity, ` +
        `approval_required, is_lendable, lending_kind, lending_status, lending_unit, due_date_required, ` +
        `acknowledgment_required, eligibility_rule, lending_handling_notes, borrower_safe_description, ` +
        `borrower_safe_restrictions, condition_tracking, inventory_kind, classification_status, ` +
        `condition_review_state, maintenance_review_state, classification_notes, classification_revision, ` +
        `classified_at, classified_by, low_stock_alert_enabled, low_stock_threshold, created_at, updated_at, updated_by` +
        `) VALUES (` +
        [
          itemId,
          item.name,
          item.category,
          'Synthetic Storage',
          item.handling,
          'piece',
          0,
          'ACTIVE',
          item.catalogType,
          `Sandbox Bin ${item.idSuffix}`,
          item.reorderThreshold,
          item.reusable ? 'STUDENTS_AND_STAFF' : 'NOT_AVAILABLE_FOR_LENDING',
          item.reusable ? 3 : null,
          item.reusable ? 2 : null,
          1,
          item.reusable ? 1 : 0,
          item.reusable ? 'REUSABLE' : 'CONSUMABLE',
          item.reusable ? 'ACTIVE' : 'NOT_LENDABLE',
          'piece',
          item.reusable ? 1 : 0,
          1,
          item.reusable ? 'Synthetic students and staff only' : '',
          item.reusable ? 'Synthetic return required' : '',
          'Synthetic-only sandbox catalog item',
          'No real-world fulfillment',
          item.reusable ? 1 : 0,
          item.reusable ? 'REUSABLE' : 'CONSUMABLE',
          'CLASSIFIED',
          item.reusable ? 'GOOD' : 'NOT_APPLICABLE',
          item.reusable ? 'CLEARED' : 'NOT_APPLICABLE',
          SEED_VERSION,
          1,
          now,
          inventoryActor,
          1,
          item.reorderThreshold,
          now,
          now,
          inventoryActor,
        ]
          .map(q)
          .join(', ') +
        `);`,
    );
    if (item.quantity > 0) {
      statements.push(
        `INSERT INTO inventory_ledger (` +
          `id, created_at, transaction_type, direction, item_id, quantity, unit, signed_quantity, ` +
          `related_entity_type, related_entity_id, actor_account_id, idempotency_key, status, notes) VALUES (` +
          `${q(`${prefix}-LED-OPEN-${item.idSuffix}`)}, ${q(now)}, 'OPENING_BALANCE', 'IN', ${q(itemId)}, ` +
          `${item.quantity}, 'piece', ${item.quantity}, 'INVENTORY_ITEM', ${q(itemId)}, 'SYSTEM-IMPORT', ` +
          `${q(`${prefix}:OPEN:${item.idSuffix}`)}, 'POSTED', ${q(SEED_VERSION)});`,
      );
    }
    if (item.reusable) {
      statements.push(
        `INSERT INTO inventory_asset_instances (` +
          `id, item_id, asset_tag, condition_label, lifecycle_status, created_at, updated_at, created_by, updated_by) ` +
          `VALUES (${q(`${prefix}-AST-${item.idSuffix}`)}, ${q(itemId)}, ${q(`${prefix}-TAG-${item.idSuffix}`)}, ` +
          `'GOOD', 'AVAILABLE', ${q(now)}, ${q(now)}, ${q(inventoryActor)}, ${q(inventoryActor)});`,
        `INSERT INTO inventory_asset_movements (` +
          `id, asset_id, movement_type, previous_status, new_status, condition_label, occurred_at, recorded_by, notes) ` +
          `VALUES (${q(`${prefix}-MOV-${item.idSuffix}`)}, ${q(`${prefix}-AST-${item.idSuffix}`)}, 'REGISTERED', '', ` +
          `'AVAILABLE', 'GOOD', ${q(now)}, ${q(inventoryActor)}, ${q(SEED_VERSION)});`,
      );
    }
  }

  const requestStates = ['FOR_REVIEW', 'ACCEPTED', 'COMPLETED'];
  requestStates.forEach((status, index) => {
    const n = String(index + 1).padStart(2, '0');
    statements.push(
      `INSERT INTO requests (` +
        `id, request_type, request_stage, event_series_id, event_day_id, event_id, owner_committee_id, ` +
        `requester_account_id, requester_name, requester_email, department, priority, purpose, status, ` +
        `client_request_id, notes, created_at, updated_at, created_by) VALUES (` +
        `${q(`${prefix}-REQ-${n}`)}, 'CATALOG_REQUEST', 'REVIEW', ${q(`${prefix}-SER-01`)}, ` +
        `${q(`${prefix}-DAY-01`)}, ${q(`${prefix}-EVT-01`)}, 'COM_MATERIALS', ${q(requester)}, ` +
        `'Synthetic Requester', ${q(`requester-${label.toLowerCase()}@example.invalid`)}, ` +
        `'Department of Logistics', 'NORMAL', ${q(`Synthetic ${status} request`)}, ${q(status)}, ` +
        `${q(`${prefix}-CLIENT-REQ-${n}`)}, ${q(SEED_VERSION)}, ${q(now)}, ${q(now)}, ${q(requester)});`,
      `INSERT INTO request_lines (` +
        `id, request_id, event_id, item_id, description, specification, category, requested_quantity, unit, ` +
        `fulfillment_source, released_quantity, received_quantity, status, client_line_id, workflow_revision, ` +
        `notes, created_at, updated_at, created_by) VALUES (` +
        `${q(`${prefix}-LIN-${n}`)}, ${q(`${prefix}-REQ-${n}`)}, ${q(`${prefix}-EVT-01`)}, ` +
        `${q(`${prefix}-ITM-${String(index + 1).padStart(2, '0')}`)}, 'Synthetic request line', ` +
        `'Synthetic scenario', 'Event Materials', 2, 'piece', ${q(index === 0 ? 'REVIEW' : 'ISSUE_FROM_STOCK')}, ` +
        `${index === 2 ? 2 : 0}, 0, ${q(status)}, ${q(`${prefix}-CLIENT-LIN-${n}`)}, 1, ${q(SEED_VERSION)}, ` +
        `${q(now)}, ${q(now)}, ${q(requester)});`,
      `INSERT INTO deliverables (` +
        `id, request_id, request_line_id, event_series_id, event_id, inventory_match_id, item_spec, ` +
        `quantity_requested, quantity_received, quantity_released, unit, fulfillment_source, ` +
        `assigned_committee_id, status, notes, created_at, updated_at, created_by) VALUES (` +
        `${q(`${prefix}-DEL-${n}`)}, ${q(`${prefix}-REQ-${n}`)}, ${q(`${prefix}-LIN-${n}`)}, ` +
        `${q(`${prefix}-SER-01`)}, ${q(`${prefix}-EVT-01`)}, ` +
        `${q(`${prefix}-ITM-${String(index + 1).padStart(2, '0')}`)}, 'Synthetic deliverable', 2, ` +
        `${index === 2 ? 2 : 0}, ${index === 2 ? 2 : 0}, 'piece', 'ISSUE_FROM_STOCK', ` +
        `'COM_MATERIALS', ${q(status)}, ${q(SEED_VERSION)}, ${q(now)}, ${q(now)}, ${q(owner)});`,
    );
  });

  statements.push(
    `INSERT INTO restock_requests (` +
      `id, source_request_id, source_request_line_id, item_id, requested_quantity, received_quantity, unit, ` +
      `supplier_name, status, notes, assigned_committee_id, created_at, updated_at, created_by) VALUES (` +
      `${q(`${prefix}-RST-01`)}, ${q(`${prefix}-REQ-02`)}, ${q(`${prefix}-LIN-02`)}, ${q(`${prefix}-ITM-07`)}, ` +
      `12, 0, 'piece', 'Synthetic Supplier', 'PROCURED', ${q(SEED_VERSION)}, ` +
      `'COM_INVENTORY_PANTRY', ${q(now)}, ${q(now)}, ${q(inventoryActor)});`,
    `INSERT INTO reservations (` +
      `id, item_id, quantity, unit, request_line_id, status, idempotency_key, notes, created_at, updated_at, created_by) ` +
      `VALUES (${q(`${prefix}-RSV-01`)}, ${q(`${prefix}-ITM-02`)}, 2, 'piece', ${q(`${prefix}-LIN-02`)}, ` +
      `'ACTIVE', ${q(`${prefix}:RESERVE:01`)}, ${q(SEED_VERSION)}, ${q(now)}, ${q(now)}, ${q(inventoryActor)});`,
    `INSERT INTO lending_tickets (` +
      `id, borrower_reference, borrower_name, borrower_type, department_organization, contact, item_id, ` +
      `quantity, unit, purpose, due_at, ticket_type, status, created_by, notes, created_at, updated_at, ` +
      `owner_committee_id, requested_item_id, requested_quantity, review_decision, eligibility_source) VALUES (` +
      `${q(`${prefix}-LND-01`)}, ${q(`${prefix}-BORROWER`)}, 'Synthetic Borrower', 'ANGELITE', ` +
      `'Synthetic Organization', ${q(`lending-${label.toLowerCase()}@example.invalid`)}, ${q(`${prefix}-ITM-04`)}, ` +
      `1, 'piece', 'Synthetic lending exercise', '2026-09-05T17:00:00+08:00', 'LOAN', 'FOR_REVIEW', ` +
      `${q(lendingActor)}, ${q(SEED_VERSION)}, ${q(now)}, ${q(now)}, 'COM_INVENTORY_PANTRY', ` +
      `${q(`${prefix}-ITM-04`)}, 1, '', 'SYNTHETIC_SANDBOX');`,
    `INSERT INTO lending_tickets (` +
      `id, borrower_reference, borrower_name, borrower_type, department_organization, contact, item_id, ` +
      `quantity, unit, purpose, due_at, ticket_type, status, approved_by, approved_at, created_by, notes, ` +
      `created_at, updated_at, owner_committee_id, requested_item_id, requested_quantity, review_decision, ` +
      `eligibility_source) VALUES (` +
      `${q(`${prefix}-LND-02`)}, ${q(`${prefix}-BORROWER-RETURN`)}, 'Synthetic Returned Borrower', 'ANGELITE', ` +
      `'Synthetic Organization', ${q(`returned-${label.toLowerCase()}@example.invalid`)}, ${q(`${prefix}-ITM-08`)}, ` +
      `1, 'piece', 'Synthetic completed return', '2026-08-31T17:00:00+08:00', 'LOAN', 'RETURNED', ` +
      `${q(inventoryActor)}, ${q(now)}, ${q(lendingActor)}, ${q(SEED_VERSION)}, ${q(now)}, ${q(now)}, ` +
      `'COM_INVENTORY_PANTRY', ${q(`${prefix}-ITM-08`)}, 1, 'APPROVE', 'SYNTHETIC_SANDBOX');`,
    `INSERT INTO lending_handoffs (` +
      `id, lending_ticket_id, released_by, released_at, idempotency_key, notes) VALUES (` +
      `${q(`${prefix}-HND-02`)}, ${q(`${prefix}-LND-02`)}, ${q(inventoryActor)}, ${q(now)}, ` +
      `${q(`${prefix}:HANDOFF:02`)}, ${q(SEED_VERSION)});`,
    `INSERT INTO lending_returns (` +
      `id, lending_ticket_id, returned_by, returned_at, condition_label, idempotency_key, notes) VALUES (` +
      `${q(`${prefix}-RTN-02`)}, ${q(`${prefix}-LND-02`)}, ${q(inventoryActor)}, ${q(now)}, 'GOOD', ` +
      `${q(`${prefix}:RETURN:02`)}, ${q(SEED_VERSION)});`,
    `INSERT INTO inventory_ledger (` +
      `id, created_at, transaction_type, direction, item_id, quantity, unit, signed_quantity, ` +
      `related_entity_type, related_entity_id, request_id, event_id, actor_account_id, idempotency_key, status, notes) ` +
      `VALUES (${q(`${prefix}-LED-REL-01`)}, ${q(now)}, 'RELEASE', 'OUT', ${q(`${prefix}-ITM-03`)}, ` +
      `2, 'piece', -2, 'RELEASE_CONFIRMATION', ${q(`${prefix}-REL-01`)}, ${q(`${prefix}-REQ-03`)}, ` +
      `${q(`${prefix}-EVT-01`)}, ${q(inventoryActor)}, ${q(`${prefix}:RELEASE:01`)}, 'POSTED', ${q(SEED_VERSION)});`,
    `INSERT INTO release_confirmations (` +
      `id, release_group_id, request_id, request_line_id, event_id, recipient_name, recipient_role, department, item_id, ` +
      `quantity, unit, released_by, released_at, confirmation_label, idempotency_key, status, notes) VALUES (` +
      `${q(`${prefix}-REL-01`)}, ${q(`${prefix}-REL-GRP-01`)}, ${q(`${prefix}-REQ-03`)}, ${q(`${prefix}-LIN-03`)}, ${q(`${prefix}-EVT-01`)}, ` +
      `'Synthetic Recipient', 'Requester', 'Department of Logistics', ${q(`${prefix}-ITM-03`)}, ` +
      `2, 'piece', ${q(inventoryActor)}, ${q(now)}, 'Synthetic release', ${q(`${prefix}:RELEASE:01`)}, ` +
      `'CONFIRMED', ${q(SEED_VERSION)});`,
    `INSERT INTO app_metadata (key, value, updated_at) VALUES ('sandbox_seed_version', ${q(SEED_VERSION)}, ${q(now)}) ` +
      `ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at;`,
    `INSERT INTO app_metadata (key, value, updated_at) VALUES ('sandbox_generation', ${q(String(generation))}, ${q(now)}) ` +
      `ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at;`,
    `INSERT INTO app_metadata (key, value, updated_at) VALUES ('sandbox_scope', 'SYNTHETIC_ONLY', ${q(now)}) ` +
      `ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at;`,
  );
  return `${statements.join('\n')}\n`;
}

export function buildSandboxArchiveSql({ generation, now }) {
  const label = generationLabel(generation);
  const prefix = `SBX-${label}`;
  const like = `${prefix}-%`;
  return (
    [
      'PRAGMA foreign_keys = ON;',
      `DELETE FROM sessions WHERE account_id LIKE ${q(like)};`,
      `UPDATE account_committees SET active = 0, ends_at = ${q(now)} WHERE account_id LIKE ${q(like)} AND active = 1;`,
      `UPDATE accounts SET status = 'DISABLED', credential_version = credential_version + 1, updated_at = ${q(now)} ` +
        `WHERE id LIKE ${q(like)} AND status <> 'DISABLED';`,
      `UPDATE reservations SET status = 'CANCELLED', cleared_at = ${q(now)}, clear_reason = 'SANDBOX_RESET', ` +
        `updated_at = ${q(now)} WHERE id LIKE ${q(like)} AND status = 'ACTIVE';`,
      `UPDATE lending_tickets SET status = 'CANCELLED', updated_at = ${q(now)} WHERE id LIKE ${q(like)} ` +
        `AND status NOT IN ('RETURNED', 'COMPLETED', 'REJECTED', 'CANCELLED');`,
      `UPDATE request_lines SET status = 'CANCELLED', updated_at = ${q(now)} WHERE id LIKE ${q(like)} ` +
        `AND status NOT IN ('COMPLETED', 'REJECTED', 'CANCELLED');`,
      `UPDATE requests SET status = 'CANCELLED', archived_at = ${q(now)}, updated_at = ${q(now)} ` +
        `WHERE id LIKE ${q(like)} AND archived_at IS NULL;`,
      `UPDATE restock_requests SET status = 'CANCELLED', updated_at = ${q(now)} WHERE id LIKE ${q(like)} ` +
        `AND status NOT IN ('RESTOCKED', 'COMPLETED', 'REJECTED', 'CANCELLED');`,
      `UPDATE deliverables SET status = 'CANCELLED', updated_at = ${q(now)} WHERE id LIKE ${q(like)} ` +
        `AND status NOT IN ('COMPLETED', 'CANCELLED');`,
      `INSERT INTO inventory_ledger (` +
        `id, created_at, transaction_type, direction, item_id, quantity, unit, signed_quantity, ` +
        `related_entity_type, related_entity_id, actor_account_id, idempotency_key, reversal_of, status, notes) ` +
        `SELECT ${q(`${prefix}-LED-RESET-`)} || replace(id, ${q(`${prefix}-LED-`)}, ''), ${q(now)}, 'SANDBOX_RESET', ` +
        `'REVERSAL', item_id, quantity, unit, -signed_quantity, 'SANDBOX_RESET', ${q(prefix)}, ` +
        `'SYSTEM-IMPORT', ${q(`${prefix}:RESET:`)} || id, id, 'POSTED', 'Synthetic sandbox reset reversal' ` +
        `FROM inventory_ledger WHERE id LIKE ${q(`${prefix}-LED-%`)} AND reversal_of IS NULL ` +
        `AND NOT EXISTS (SELECT 1 FROM inventory_ledger reversal WHERE reversal.reversal_of = inventory_ledger.id) ` +
        `ORDER BY signed_quantity ASC;`,
      `UPDATE inventory_asset_instances SET lifecycle_status = 'ARCHIVED', current_lending_ticket_id = NULL, ` +
        `updated_at = ${q(now)} WHERE id LIKE ${q(like)} AND lifecycle_status <> 'ARCHIVED';`,
      `UPDATE inventory_items SET status = 'ARCHIVED', is_lendable = 0, lending_status = 'NOT_LENDABLE', ` +
        `updated_at = ${q(now)} WHERE id LIKE ${q(like)} AND status <> 'ARCHIVED';`,
      `UPDATE events SET status = 'ARCHIVED', active = 0, archived_at = ${q(now)}, updated_at = ${q(now)} ` +
        `WHERE id LIKE ${q(like)} AND status <> 'ARCHIVED';`,
      `UPDATE event_days SET status = 'ARCHIVED', active = 0, archived_at = ${q(now)}, updated_at = ${q(now)} ` +
        `WHERE id LIKE ${q(like)} AND status <> 'ARCHIVED';`,
      `UPDATE event_series SET status = 'ARCHIVED', archived_at = ${q(now)}, updated_at = ${q(now)} ` +
        `WHERE id LIKE ${q(like)} AND status <> 'ARCHIVED';`,
    ].join('\n') + '\n'
  );
}

export function sandboxSeedSummary(generation) {
  return Object.freeze({
    seedVersion: SEED_VERSION,
    generation,
    accounts: SANDBOX_ACTORS.length,
    inventoryItems: 36,
    requests: 3,
    deliverables: 3,
    lendingTickets: 2,
    events: 1,
  });
}
