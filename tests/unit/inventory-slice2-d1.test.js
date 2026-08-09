import { Miniflare } from 'miniflare';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { CAPABILITIES } from '../../src/domain/permissions.js';
import { createD1OperationalService } from '../../src/server/d1/operational-service.js';

const timestamp = '2026-08-09T00:00:00.000Z';

const owner = Object.freeze({
  id: 'TEST-OWNER',
  accessIdNormalized: 'TEST.OWNER',
  status: 'ACTIVE',
  roleId: 'SYSTEM_OWNER',
  committeeIds: [],
  defaultCommitteeId: '',
  profile: { fullName: 'Synthetic Test Owner' },
});

const requester = Object.freeze({
  id: 'TEST-REQUESTER',
  accessIdNormalized: 'TEST.REQUESTER',
  status: 'ACTIVE',
  roleId: 'REQUESTER',
  committeeIds: [],
  defaultCommitteeId: '',
  institutionId: 'SYNTHETIC-REQUESTER',
  profileDepartmentId: 'SYNTHETIC-DEPARTMENT',
  departmentDisplayName: 'Synthetic Department',
  profile: { fullName: 'Synthetic Requester' },
  requesterDepartment: { id: 'SYNTHETIC-DEPARTMENT' },
});

const borrower = Object.freeze({
  ...requester,
  id: 'TEST-BORROWER',
  accessIdNormalized: 'TEST.BORROWER',
  institutionId: 'SYNTHETIC-BORROWER',
  lendingEligible: true,
  profile: { fullName: 'Synthetic Borrower' },
});

let miniflare;
let db;
let service;

async function createSchema30InventoryHarness(database) {
  const statements = [
    `CREATE TABLE committees (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1
    ) STRICT`,
    `CREATE TABLE accounts (
      id TEXT PRIMARY KEY, access_id_normalized TEXT NOT NULL UNIQUE, status TEXT NOT NULL,
      role_id TEXT NOT NULL, profile_full_name TEXT, credential_version INTEGER NOT NULL,
      onboarding_completed_at TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    ) STRICT`,
    `CREATE TABLE event_series (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, status TEXT NOT NULL
    ) STRICT`,
    `CREATE TABLE events (
      id TEXT PRIMARY KEY, event_series_id TEXT, name TEXT NOT NULL,
      owner_committee_id TEXT, starts_at TEXT, status TEXT NOT NULL, active INTEGER NOT NULL DEFAULT 1
    ) STRICT`,
    `CREATE TABLE inventory_items (
      id TEXT PRIMARY KEY, name TEXT NOT NULL, category TEXT NOT NULL DEFAULT '',
      stock_area TEXT NOT NULL DEFAULT '', handling TEXT NOT NULL, unit TEXT NOT NULL,
      opening_quantity REAL NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'ACTIVE',
      catalog_type TEXT NOT NULL DEFAULT '', storage_location TEXT NOT NULL DEFAULT '',
      reorder_threshold REAL NOT NULL DEFAULT 0,
      lending_audience TEXT NOT NULL DEFAULT 'NOT_AVAILABLE_FOR_LENDING',
      approval_required INTEGER NOT NULL DEFAULT 1,
      legacy_source_sheet TEXT, verification_note TEXT, notes TEXT,
      inventory_kind TEXT NOT NULL DEFAULT 'UNVERIFIED',
      classification_status TEXT NOT NULL DEFAULT 'NEEDS_CLASSIFICATION',
      condition_review_state TEXT NOT NULL DEFAULT 'NOT_ASSESSED',
      maintenance_review_state TEXT NOT NULL DEFAULT 'NOT_ASSESSED',
      classified_at TEXT, classified_by TEXT, created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL, updated_by TEXT NOT NULL DEFAULT ''
    ) STRICT`,
    `CREATE TABLE requests (
      id TEXT PRIMARY KEY, request_type TEXT NOT NULL, owner_committee_id TEXT,
      requester_account_id TEXT, requester_name TEXT NOT NULL DEFAULT '',
      purpose TEXT NOT NULL, status TEXT NOT NULL, client_request_id TEXT NOT NULL,
      event_series_id TEXT, event_id TEXT, created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL, created_by TEXT NOT NULL
    ) STRICT`,
    `CREATE TABLE request_lines (
      id TEXT PRIMARY KEY, request_id TEXT NOT NULL, item_id TEXT, event_item_id TEXT,
      description TEXT NOT NULL, specification TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL DEFAULT '', requested_quantity REAL NOT NULL,
      released_quantity REAL NOT NULL DEFAULT 0, unit TEXT NOT NULL,
      fulfillment_source TEXT NOT NULL, status TEXT NOT NULL, client_line_id TEXT NOT NULL,
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL, created_by TEXT NOT NULL
    ) STRICT`,
    `CREATE TABLE deliverables (
      id TEXT PRIMARY KEY, request_id TEXT NOT NULL, request_line_id TEXT NOT NULL,
      inventory_match_id TEXT, item_spec TEXT NOT NULL, quantity_requested REAL NOT NULL,
      quantity_received REAL NOT NULL DEFAULT 0, quantity_released REAL NOT NULL DEFAULT 0,
      unit TEXT NOT NULL, fulfillment_source TEXT NOT NULL, assigned_committee_id TEXT,
      event_series_id TEXT, event_id TEXT, status TEXT NOT NULL,
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL, created_by TEXT
    ) STRICT`,
    `CREATE TABLE restock_requests (
      id TEXT PRIMARY KEY, source_request_id TEXT, status TEXT NOT NULL
    ) STRICT`,
    `CREATE TABLE lending_tickets (
      id TEXT PRIMARY KEY, borrower_reference TEXT NOT NULL, borrower_name TEXT NOT NULL DEFAULT '',
      borrower_type TEXT NOT NULL, item_id TEXT NOT NULL, quantity REAL NOT NULL,
      unit TEXT NOT NULL, purpose TEXT NOT NULL, ticket_type TEXT NOT NULL,
      status TEXT NOT NULL, approved_by TEXT, approved_at TEXT, created_by TEXT NOT NULL,
      created_at TEXT NOT NULL, updated_at TEXT NOT NULL
    ) STRICT`,
    `CREATE TABLE lending_handoffs (
      id TEXT PRIMARY KEY, lending_ticket_id TEXT NOT NULL UNIQUE
    ) STRICT`,
    `CREATE TABLE inventory_asset_instances (
      id TEXT PRIMARY KEY, item_id TEXT NOT NULL, lifecycle_status TEXT NOT NULL,
      current_lending_ticket_id TEXT, expected_return_at TEXT, condition_label TEXT NOT NULL DEFAULT '',
      updated_at TEXT NOT NULL, updated_by TEXT
    ) STRICT`,
    `CREATE TABLE lending_ticket_assets (
      lending_ticket_id TEXT NOT NULL, asset_id TEXT NOT NULL UNIQUE,
      assigned_at TEXT NOT NULL, assigned_by TEXT NOT NULL, released_at TEXT,
      PRIMARY KEY (lending_ticket_id, asset_id)
    ) STRICT`,
    `CREATE TABLE inventory_asset_movements (
      id TEXT PRIMARY KEY, asset_id TEXT NOT NULL, movement_type TEXT NOT NULL,
      previous_status TEXT NOT NULL DEFAULT '', new_status TEXT NOT NULL,
      lending_ticket_id TEXT, condition_label TEXT NOT NULL DEFAULT '',
      occurred_at TEXT NOT NULL, recorded_by TEXT, notes TEXT NOT NULL DEFAULT ''
    ) STRICT`,
    `CREATE TABLE reservations (
      id TEXT PRIMARY KEY, item_id TEXT NOT NULL, quantity REAL NOT NULL,
      unit TEXT NOT NULL, request_line_id TEXT, lending_ticket_id TEXT,
      status TEXT NOT NULL, idempotency_key TEXT NOT NULL, cleared_at TEXT,
      clear_reason TEXT NOT NULL DEFAULT '', created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL, created_by TEXT NOT NULL
    ) STRICT`,
    `CREATE TABLE reservation_consumptions (
      id TEXT PRIMARY KEY, reservation_id TEXT NOT NULL, quantity REAL NOT NULL
    ) STRICT`,
    `CREATE TABLE inventory_ledger (
      id TEXT PRIMARY KEY, created_at TEXT NOT NULL, transaction_type TEXT NOT NULL,
      direction TEXT NOT NULL, item_id TEXT NOT NULL, event_item_id TEXT,
      quantity REAL NOT NULL, unit TEXT NOT NULL, signed_quantity REAL NOT NULL,
      related_entity_type TEXT NOT NULL, related_entity_id TEXT NOT NULL,
      request_id TEXT, event_id TEXT, actor_account_id TEXT NOT NULL,
      idempotency_key TEXT NOT NULL, reversal_of TEXT, status TEXT NOT NULL DEFAULT 'POSTED',
      notes TEXT NOT NULL DEFAULT '', UNIQUE (actor_account_id, idempotency_key)
    ) STRICT`,
    `CREATE VIEW inventory_balances AS
      SELECT item.id AS item_id,
        COALESCE((SELECT SUM(ledger.signed_quantity) FROM inventory_ledger ledger
          WHERE ledger.item_id = item.id AND ledger.status = 'POSTED'), 0) AS on_hand,
        COALESCE((SELECT SUM(MAX(reservation.quantity - COALESCE((
          SELECT SUM(consumption.quantity) FROM reservation_consumptions consumption
          WHERE consumption.reservation_id = reservation.id), 0), 0))
          FROM reservations reservation
          WHERE reservation.item_id = item.id AND reservation.status = 'ACTIVE'), 0) AS reserved,
        COALESCE((SELECT SUM(ledger.signed_quantity) FROM inventory_ledger ledger
          WHERE ledger.item_id = item.id AND ledger.status = 'POSTED'), 0) -
        COALESCE((SELECT SUM(MAX(reservation.quantity - COALESCE((
          SELECT SUM(consumption.quantity) FROM reservation_consumptions consumption
          WHERE consumption.reservation_id = reservation.id), 0), 0))
          FROM reservations reservation
          WHERE reservation.item_id = item.id AND reservation.status = 'ACTIVE'), 0)
          AS available_to_promise
      FROM inventory_items item`,
    `CREATE TABLE data_revisions (
      scope TEXT PRIMARY KEY, revision INTEGER NOT NULL, updated_at TEXT NOT NULL
    ) STRICT`,
    `CREATE TABLE audit_log (
      id TEXT PRIMARY KEY, created_at TEXT NOT NULL, action TEXT NOT NULL,
      entity_type TEXT NOT NULL, entity_id TEXT NOT NULL, actor_account_id TEXT NOT NULL,
      before_json TEXT NOT NULL, after_json TEXT NOT NULL, correlation_id TEXT NOT NULL,
      notes TEXT NOT NULL DEFAULT ''
    ) STRICT`,
    `CREATE TABLE status_history (
      id TEXT PRIMARY KEY, entity_type TEXT NOT NULL, entity_id TEXT NOT NULL,
      previous_status TEXT NOT NULL, new_status TEXT NOT NULL, changed_at TEXT NOT NULL,
      changed_by TEXT NOT NULL, reason TEXT NOT NULL, idempotency_key TEXT NOT NULL,
      metadata_json TEXT NOT NULL
    ) STRICT`,
    `CREATE TABLE idempotency_keys (
      scope TEXT NOT NULL, idempotency_key TEXT NOT NULL, actor_account_id TEXT NOT NULL,
      request_fingerprint TEXT NOT NULL, result_json TEXT NOT NULL, created_at TEXT NOT NULL,
      PRIMARY KEY (scope, idempotency_key)
    ) STRICT`,
  ];
  for (const statement of statements) await database.prepare(statement).run();
  for (const scope of ['global', 'overview', 'request', 'lending', 'inventory', 'procurement']) {
    await database.prepare('INSERT INTO data_revisions VALUES (?1, 0, ?2)').bind(scope, timestamp).run();
  }
}

async function insertAccount(account) {
  await db
    .prepare(
      `INSERT INTO accounts (
         id, access_id_normalized, status, role_id, profile_full_name,
         credential_version, onboarding_completed_at, created_at, updated_at
       ) VALUES (?1, ?2, 'ACTIVE', ?3, ?4, 1, ?5, ?5, ?5)`,
    )
    .bind(account.id, account.accessIdNormalized, account.roleId, account.profile.fullName, timestamp)
    .run();
}

async function insertItem(id, onHand, { category = 'Event Materials', handling = 'CONSUMABLE' } = {}) {
  await db
    .prepare(
      `INSERT INTO inventory_items (
         id, name, category, stock_area, handling, unit, opening_quantity, status,
         catalog_type, storage_location, inventory_kind, classification_status,
         condition_review_state, maintenance_review_state, classified_at, classified_by,
         created_at, updated_at, updated_by
       ) VALUES (?1, ?2, ?3, 'Inventory', ?4, 'piece', 0, 'ACTIVE',
         'OFFICE_INVENTORY', 'Synthetic Storage', 'CONSUMABLE', 'CLASSIFIED',
         'GOOD', 'CLEARED', ?5, ?6, ?5, ?5, ?6)`,
    )
    .bind(id, `Synthetic ${id}`, category, handling, timestamp, owner.id)
    .run();
  if (onHand > 0) {
    await db
      .prepare(
        `INSERT INTO inventory_ledger (
           id, created_at, transaction_type, direction, item_id, quantity, unit,
           signed_quantity, related_entity_type, related_entity_id, actor_account_id,
           idempotency_key, status, notes
         ) VALUES (?1, ?2, 'OPENING_BALANCE', 'IN', ?3, ?4, 'piece', ?4,
           'INVENTORY_ITEM', ?3, ?5, ?6, 'POSTED', 'Synthetic Slice 2 opening balance')`,
      )
      .bind(`LED-OPEN-${id}`, timestamp, id, onHand, owner.id, `opening:${id}`)
      .run();
  }
}

async function balance(itemId) {
  const row = await db
    .prepare(
      `SELECT on_hand, reserved, available_to_promise
       FROM inventory_balances WHERE item_id = ?1`,
    )
    .bind(itemId)
    .first();
  return {
    onHand: Number(row.on_hand),
    reserved: Number(row.reserved),
    availableToPromise: Number(row.available_to_promise),
  };
}

beforeAll(async () => {
  miniflare = new Miniflare({
    modules: true,
    script: 'export default { fetch() { return new Response("ok"); } }',
    d1Databases: ['DB'],
  });
  db = await miniflare.getD1Database('DB');
  await createSchema30InventoryHarness(db);
  await insertAccount(owner);
  await insertAccount(requester);
  await insertAccount(borrower);
  service = createD1OperationalService({ db, schemaVersion: '30' });
});

afterAll(async () => {
  await miniflare?.dispose();
});

describe('v0.8.0 Slice 2 schema-30 Inventory repairs', () => {
  it('V080-S1-INV-01 posts one authorized, paired, retry-safe event-item transfer', async () => {
    await insertItem('ITM-TRANSFER-SOURCE', 5);
    await insertItem('ITM-TRANSFER-TARGET', 1);
    await db
      .prepare(
        `INSERT INTO requests (
           id, request_type, requester_name, purpose, status, client_request_id,
           created_at, updated_at, created_by
         ) VALUES ('REQ-TRANSFER', 'EVENT_LOGISTICS', 'Synthetic requester',
           'Synthetic transfer proof', 'ACCEPTED', 'transfer-request', ?1, ?1, ?2)`,
      )
      .bind(timestamp, owner.id)
      .run();
    await db
      .prepare(
        `INSERT INTO request_lines (
           id, request_id, item_id, event_item_id, description, specification, category,
           requested_quantity, unit, fulfillment_source, status, client_line_id,
           created_at, updated_at, created_by
         ) VALUES ('LIN-TRANSFER', 'REQ-TRANSFER', 'ITM-TRANSFER-SOURCE', 'EIT-TRANSFER',
           'Synthetic material', 'Synthetic material', 'Event Materials', 5, 'piece',
           'PROCUREMENT', 'READY_TO_RELEASE', 'transfer-line', ?1, ?1, ?2)`,
      )
      .bind(timestamp, owner.id)
      .run();
    await db
      .prepare(
        `INSERT INTO deliverables (
           id, request_id, request_line_id, inventory_match_id, item_spec,
           quantity_requested, quantity_received, quantity_released, unit,
           fulfillment_source, status, created_at, updated_at, created_by
         ) VALUES ('DEL-TRANSFER', 'REQ-TRANSFER', 'LIN-TRANSFER', 'ITM-TRANSFER-SOURCE',
           'Synthetic material', 5, 5, 0, 'piece', 'PROCUREMENT', 'RECEIVED', ?1, ?1, ?2)`,
      )
      .bind(timestamp, owner.id)
      .run();

    expect(service.capabilityForMethod('transferEventItemToInventory')).toBe(CAPABILITIES.INVENTORY_MERGE);
    const command = {
      deliverableId: 'DEL-TRANSFER',
      destinationItemId: 'ITM-TRANSFER-TARGET',
      quantity: 2,
      unit: 'piece',
      category: 'Event Materials',
      handling: 'CONSUMABLE',
      semanticConfirmed: true,
      mergeReason: 'Synthetic semantic match',
      clientRequestId: 'transfer-once',
    };
    await expect(
      service.call('transferEventItemToInventory', {
        account: requester,
        command: { ...command, clientRequestId: 'transfer-denied' },
        correlationId: 'COR-TRANSFER-DENIED',
      }),
    ).rejects.toMatchObject({ code: 'CAPABILITY_REQUIRED', status: 403 });
    const first = await service.call('transferEventItemToInventory', {
      account: owner,
      command,
      correlationId: 'COR-TRANSFER-1',
    });
    const replayed = await service.call('transferEventItemToInventory', {
      account: owner,
      command,
      correlationId: 'COR-TRANSFER-2',
    });

    expect(replayed).toMatchObject({
      mappingId: first.mappingId,
      outTransactionId: first.outTransactionId,
      inTransactionId: first.inTransactionId,
      destinationItemId: 'ITM-TRANSFER-TARGET',
    });
    expect(first.outTransactionId).not.toBe(first.inTransactionId);
    const rows = await db
      .prepare(
        `SELECT id, transaction_type, direction, item_id, event_item_id, signed_quantity,
                related_entity_type, related_entity_id
         FROM inventory_ledger WHERE related_entity_id = ?1 ORDER BY direction DESC`,
      )
      .bind(first.mappingId)
      .all();
    expect(rows.results).toEqual([
      expect.objectContaining({
        id: first.outTransactionId,
        transaction_type: 'TRANSFER_OUT_EVENT',
        direction: 'OUT',
        item_id: 'ITM-TRANSFER-SOURCE',
        event_item_id: 'EIT-TRANSFER',
        signed_quantity: -2,
        related_entity_type: 'TRANSFER_MAP',
        related_entity_id: first.mappingId,
      }),
      expect.objectContaining({
        id: first.inTransactionId,
        transaction_type: 'TRANSFER_IN_INVENTORY',
        direction: 'IN',
        item_id: 'ITM-TRANSFER-TARGET',
        event_item_id: 'EIT-TRANSFER',
        signed_quantity: 2,
        related_entity_type: 'TRANSFER_MAP',
        related_entity_id: first.mappingId,
      }),
    ]);
    await expect(balance('ITM-TRANSFER-SOURCE')).resolves.toMatchObject({ onHand: 3 });
    await expect(balance('ITM-TRANSFER-TARGET')).resolves.toMatchObject({ onHand: 3 });

    await expect(
      service.call('transferEventItemToInventory', {
        account: owner,
        command: { ...command, quantity: 1 },
        correlationId: 'COR-TRANSFER-CONFLICT',
      }),
    ).rejects.toMatchObject({ code: 'IDEMPOTENCY_CONFLICT', status: 409 });

    await expect(
      service.call('transferEventItemToInventory', {
        account: owner,
        command: { ...command, quantity: 4, clientRequestId: 'transfer-overdraw' },
        correlationId: 'COR-TRANSFER-OVERDRAW',
      }),
    ).rejects.toMatchObject({ code: 'INSUFFICIENT_EVENT_BALANCE', status: 409 });

    let waiting = 0;
    let releaseReaders;
    const bothRead = new Promise((resolve) => {
      releaseReaders = resolve;
    });
    const barrierDb = {
      prepare(sql) {
        const statement = db.prepare(sql);
        if (!String(sql).includes('SELECT deliverable.id, deliverable.request_line_id')) {
          return statement;
        }
        return {
          bind(...values) {
            const bound = statement.bind(...values);
            return {
              async first() {
                const snapshot = await bound.first();
                waiting += 1;
                if (waiting === 2) releaseReaders();
                await bothRead;
                return snapshot;
              },
            };
          },
        };
      },
      batch(statements) {
        return db.batch(statements);
      },
    };
    const concurrentService = createD1OperationalService({ db: barrierDb, schemaVersion: '30' });
    const raceOutcomes = await Promise.allSettled(
      ['transfer-race-a', 'transfer-race-b'].map((clientRequestId, index) =>
        concurrentService.call('transferEventItemToInventory', {
          account: owner,
          command: { ...command, clientRequestId },
          correlationId: `COR-TRANSFER-RACE-${index + 1}`,
        }),
      ),
    );
    expect(raceOutcomes.filter((entry) => entry.status === 'fulfilled')).toHaveLength(1);
    expect(raceOutcomes.filter((entry) => entry.status === 'rejected')).toHaveLength(1);
    expect(raceOutcomes.find((entry) => entry.status === 'rejected').reason).toMatchObject({
      code: 'TRANSFER_STATE_CONFLICT',
      status: 409,
    });
    await expect(balance('ITM-TRANSFER-SOURCE')).resolves.toMatchObject({ onHand: 1 });
    await expect(balance('ITM-TRANSFER-TARGET')).resolves.toMatchObject({ onHand: 5 });
    const transferLedgerCount = await db
      .prepare(
        `SELECT COUNT(*) AS total FROM inventory_ledger
         WHERE transaction_type IN ('TRANSFER_OUT_EVENT', 'TRANSFER_IN_INVENTORY')`,
      )
      .first();
    expect(Number(transferLedgerCount.total)).toBe(4);

    const createdDestination = await service.call('transferEventItemToInventory', {
      account: owner,
      command: {
        ...command,
        destinationItemId: undefined,
        createNew: true,
        newItemName: 'Synthetic transferred material',
        destinationArea: 'Inventory',
        category: 'Client display label is not authoritative',
        quantity: 1,
        clientRequestId: 'transfer-create-destination',
      },
      correlationId: 'COR-TRANSFER-CREATE',
    });
    await expect(balance('ITM-TRANSFER-SOURCE')).resolves.toMatchObject({ onHand: 0 });
    await expect(balance(createdDestination.destinationItemId)).resolves.toMatchObject({ onHand: 1 });
    await expect(
      db
        .prepare('SELECT category, handling, unit FROM inventory_items WHERE id = ?1')
        .bind(createdDestination.destinationItemId)
        .first(),
    ).resolves.toEqual({ category: 'Event Materials', handling: 'CONSUMABLE', unit: 'piece' });
  }, 15_000);

  it('V080-S1-INV-02 cancels an accepted request reservation without changing on-hand', async () => {
    await insertItem('ITM-REQUEST-CANCEL', 5);
    await db
      .prepare(
        `INSERT INTO requests (
           id, request_type, requester_account_id, requester_name, purpose, status,
           client_request_id, created_at, updated_at, created_by
         ) VALUES ('REQ-CANCEL-ACTIVE', 'GENERAL_REQUEST', ?1, 'Synthetic requester',
           'Synthetic cancellation proof', 'ACCEPTED', 'request-cancel-active', ?2, ?2, ?1)`,
      )
      .bind(requester.id, timestamp)
      .run();
    await db
      .prepare(
        `INSERT INTO request_lines (
           id, request_id, item_id, description, requested_quantity, unit,
           fulfillment_source, status, client_line_id, created_at, updated_at, created_by
         ) VALUES ('LIN-CANCEL-ACTIVE', 'REQ-CANCEL-ACTIVE', 'ITM-REQUEST-CANCEL',
           'Synthetic item', 2, 'piece', 'ISSUE_FROM_STOCK', 'READY_TO_RELEASE',
           'cancel-active-line', ?1, ?1, ?2)`,
      )
      .bind(timestamp, requester.id)
      .run();
    await db
      .prepare(
        `INSERT INTO reservations (
           id, item_id, quantity, unit, request_line_id, status, idempotency_key,
           created_at, updated_at, created_by
         ) VALUES ('RSV-REQUEST-CANCEL', 'ITM-REQUEST-CANCEL', 2, 'piece',
           'LIN-CANCEL-ACTIVE', 'ACTIVE', 'reserve-request-cancel', ?1, ?1, ?2)`,
      )
      .bind(timestamp, owner.id)
      .run();
    await expect(balance('ITM-REQUEST-CANCEL')).resolves.toEqual({
      onHand: 5,
      reserved: 2,
      availableToPromise: 3,
    });

    const command = {
      requestId: 'REQ-CANCEL-ACTIVE',
      clientRequestId: 'cancel-request-once',
    };
    const first = await service.cancelRequesterRequest({
      account: requester,
      command,
      correlationId: 'COR-REQUEST-CANCEL-1',
    });
    const replayed = await service.cancelRequesterRequest({
      account: requester,
      command,
      correlationId: 'COR-REQUEST-CANCEL-2',
    });
    expect(replayed).toEqual(first);
    await expect(balance('ITM-REQUEST-CANCEL')).resolves.toEqual({
      onHand: 5,
      reserved: 0,
      availableToPromise: 5,
    });
    await expect(
      db.prepare('SELECT status FROM requests WHERE id = ?1').bind('REQ-CANCEL-ACTIVE').first(),
    ).resolves.toEqual({ status: 'CANCELLED' });
    await expect(
      db.prepare('SELECT status FROM request_lines WHERE id = ?1').bind('LIN-CANCEL-ACTIVE').first(),
    ).resolves.toEqual({ status: 'CANCELLED' });
    await expect(
      db
        .prepare('SELECT status, clear_reason FROM reservations WHERE id = ?1')
        .bind('RSV-REQUEST-CANCEL')
        .first(),
    ).resolves.toEqual({ status: 'CANCELLED', clear_reason: 'REQUEST_CANCELLED' });
  });

  it('V080-S1-INV-02 cancels a ready lending reservation exactly once', async () => {
    await insertItem('ITM-LENDING-CANCEL', 4);
    await db
      .prepare(
        `INSERT INTO lending_tickets (
           id, borrower_reference, borrower_name, borrower_type, item_id, quantity,
           unit, purpose, ticket_type, status, approved_by, approved_at, created_by,
           created_at, updated_at
         ) VALUES ('LND-CANCEL-ACTIVE', 'SYNTHETIC-BORROWER', 'Synthetic Borrower',
           'INSTITUTION_APPROVED', 'ITM-LENDING-CANCEL', 1, 'piece',
           'Synthetic lending cancellation proof', 'CONSUMABLE', 'READY_TO_CLAIM',
           ?1, ?2, ?3, ?2, ?2)`,
      )
      .bind(owner.id, timestamp, borrower.id)
      .run();
    await db
      .prepare(
        `INSERT INTO reservations (
           id, item_id, quantity, unit, lending_ticket_id, status, idempotency_key,
           created_at, updated_at, created_by
         ) VALUES ('RSV-LENDING-CANCEL', 'ITM-LENDING-CANCEL', 1, 'piece',
           'LND-CANCEL-ACTIVE', 'ACTIVE', 'reserve-lending-cancel', ?1, ?1, ?2)`,
      )
      .bind(timestamp, owner.id)
      .run();
    await db
      .prepare(
        `INSERT INTO inventory_asset_instances (
           id, item_id, lifecycle_status, current_lending_ticket_id, expected_return_at,
           condition_label, updated_at, updated_by
         ) VALUES ('AST-LENDING-CANCEL', 'ITM-LENDING-CANCEL', 'RESERVED',
           'LND-CANCEL-ACTIVE', ?1, 'GOOD', ?2, ?3)`,
      )
      .bind('2026-08-12T00:00:00.000Z', timestamp, owner.id)
      .run();
    await db
      .prepare(
        `INSERT INTO lending_ticket_assets (
           lending_ticket_id, asset_id, assigned_at, assigned_by
         ) VALUES ('LND-CANCEL-ACTIVE', 'AST-LENDING-CANCEL', ?1, ?2)`,
      )
      .bind(timestamp, owner.id)
      .run();

    const command = {
      ticketId: 'LND-CANCEL-ACTIVE',
      clientRequestId: 'cancel-lending-once',
    };
    const first = await service.cancelBorrowerLendingRequest({
      account: borrower,
      command,
      correlationId: 'COR-LENDING-CANCEL-1',
    });
    const replayed = await service.cancelBorrowerLendingRequest({
      account: borrower,
      command,
      correlationId: 'COR-LENDING-CANCEL-2',
    });
    expect(replayed).toEqual(first);
    await expect(balance('ITM-LENDING-CANCEL')).resolves.toEqual({
      onHand: 4,
      reserved: 0,
      availableToPromise: 4,
    });
    await expect(
      db.prepare('SELECT status FROM lending_tickets WHERE id = ?1').bind('LND-CANCEL-ACTIVE').first(),
    ).resolves.toEqual({ status: 'CANCELLED' });
    await expect(
      db
        .prepare('SELECT status, clear_reason FROM reservations WHERE id = ?1')
        .bind('RSV-LENDING-CANCEL')
        .first(),
    ).resolves.toEqual({ status: 'CANCELLED', clear_reason: 'LENDING_CANCELLED' });
    await expect(
      db
        .prepare(
          `SELECT lifecycle_status, current_lending_ticket_id, expected_return_at
           FROM inventory_asset_instances WHERE id = 'AST-LENDING-CANCEL'`,
        )
        .first(),
    ).resolves.toEqual({
      lifecycle_status: 'AVAILABLE',
      current_lending_ticket_id: null,
      expected_return_at: null,
    });
    await expect(
      db
        .prepare(
          `SELECT movement_type, previous_status, new_status
           FROM inventory_asset_movements WHERE asset_id = 'AST-LENDING-CANCEL'`,
        )
        .first(),
    ).resolves.toEqual({
      movement_type: 'RESTORED',
      previous_status: 'RESERVED',
      new_status: 'AVAILABLE',
    });
  });

  it('V080-S1-INV-02 rejects a stale request cancellation without partial effects', async () => {
    await insertItem('ITM-REQUEST-STALE', 3);
    await db
      .prepare(
        `INSERT INTO requests (
           id, request_type, requester_account_id, requester_name, purpose, status,
           client_request_id, created_at, updated_at, created_by
         ) VALUES ('REQ-CANCEL-STALE', 'GENERAL_REQUEST', ?1, 'Synthetic requester',
           'Synthetic stale cancellation proof', 'ACCEPTED', 'request-cancel-stale', ?2, ?2, ?1)`,
      )
      .bind(requester.id, timestamp)
      .run();
    await db
      .prepare(
        `INSERT INTO request_lines (
           id, request_id, item_id, description, requested_quantity, unit,
           fulfillment_source, status, client_line_id, created_at, updated_at, created_by
         ) VALUES ('LIN-CANCEL-STALE', 'REQ-CANCEL-STALE', 'ITM-REQUEST-STALE',
           'Synthetic item', 1, 'piece', 'ISSUE_FROM_STOCK', 'READY_TO_RELEASE',
           'cancel-stale-line', ?1, ?1, ?2)`,
      )
      .bind(timestamp, requester.id)
      .run();
    await db
      .prepare(
        `INSERT INTO reservations (
           id, item_id, quantity, unit, request_line_id, status, idempotency_key,
           created_at, updated_at, created_by
         ) VALUES ('RSV-REQUEST-STALE', 'ITM-REQUEST-STALE', 1, 'piece',
           'LIN-CANCEL-STALE', 'ACTIVE', 'reserve-request-stale', ?1, ?1, ?2)`,
      )
      .bind(timestamp, owner.id)
      .run();
    const staleDb = {
      prepare(sql) {
        const statement = db.prepare(sql);
        if (!String(sql).startsWith('SELECT status, requester_account_id, updated_at FROM requests')) {
          return statement;
        }
        return {
          bind(...values) {
            const bound = statement.bind(...values);
            return {
              async first() {
                const snapshot = await bound.first();
                await db
                  .prepare("UPDATE requests SET updated_at = '2026-08-09T00:01:00.000Z' WHERE id = ?1")
                  .bind(values[0])
                  .run();
                return snapshot;
              },
            };
          },
        };
      },
      batch(statements) {
        return db.batch(statements);
      },
    };
    const staleService = createD1OperationalService({ db: staleDb, schemaVersion: '30' });
    await expect(
      staleService.cancelRequesterRequest({
        account: requester,
        command: { requestId: 'REQ-CANCEL-STALE', clientRequestId: 'cancel-request-stale' },
        correlationId: 'COR-REQUEST-CANCEL-STALE',
      }),
    ).rejects.toMatchObject({ code: 'REQUEST_STATE_CONFLICT', status: 409 });
    await expect(
      db.prepare("SELECT status FROM requests WHERE id = 'REQ-CANCEL-STALE'").first(),
    ).resolves.toEqual({ status: 'ACCEPTED' });
    await expect(
      db.prepare("SELECT status FROM reservations WHERE id = 'RSV-REQUEST-STALE'").first(),
    ).resolves.toEqual({ status: 'ACTIVE' });
    await expect(
      db
        .prepare(
          `SELECT COUNT(*) AS total FROM audit_log
           WHERE entity_id = 'REQ-CANCEL-STALE' AND action = 'REQUEST_CANCELLED_BY_REQUESTER'`,
        )
        .first(),
    ).resolves.toEqual({ total: 0 });
  });

  it('V080-S1-INV-03 serializes same-snapshot cycle counts and replays the winner', async () => {
    await insertItem('ITM-CYCLE-COUNT', 10);
    let waiting = 0;
    let releaseReaders;
    const bothRead = new Promise((resolve) => {
      releaseReaders = resolve;
    });
    const barrierDb = {
      prepare(sql) {
        const statement = db.prepare(sql);
        if (!String(sql).includes('SELECT balance.on_hand')) return statement;
        return {
          bind(...values) {
            const bound = statement.bind(...values);
            return {
              async first() {
                const snapshot = await bound.first();
                waiting += 1;
                if (waiting === 2) releaseReaders();
                await bothRead;
                return snapshot;
              },
            };
          },
        };
      },
      batch(statements) {
        return db.batch(statements);
      },
    };
    const concurrentService = createD1OperationalService({ db: barrierDb, schemaVersion: '30' });
    const commands = ['cycle-a', 'cycle-b'].map((clientRequestId) => ({
      itemId: 'ITM-CYCLE-COUNT',
      countedQuantity: 11,
      reason: 'Synthetic concurrent physical count',
      clientRequestId,
    }));
    const outcomes = await Promise.allSettled(
      commands.map((command, index) =>
        concurrentService.call('postCycleCountAdjustment', {
          account: owner,
          command,
          correlationId: `COR-CYCLE-${index + 1}`,
        }),
      ),
    );
    expect(
      outcomes.map((entry) =>
        entry.status === 'fulfilled'
          ? { status: entry.status, transactionId: entry.value.transactionId }
          : { status: entry.status, code: entry.reason?.code, message: entry.reason?.message },
      ),
    ).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ status: 'fulfilled' }),
        expect.objectContaining({ status: 'rejected', code: 'INVENTORY_COUNT_STALE' }),
      ]),
    );
    expect(outcomes.filter((entry) => entry.status === 'fulfilled')).toHaveLength(1);
    expect(outcomes.filter((entry) => entry.status === 'rejected')).toHaveLength(1);
    expect(outcomes.find((entry) => entry.status === 'rejected').reason).toMatchObject({
      code: 'INVENTORY_COUNT_STALE',
      status: 409,
    });
    await expect(balance('ITM-CYCLE-COUNT')).resolves.toMatchObject({ onHand: 11 });

    const winnerIndex = outcomes.findIndex((entry) => entry.status === 'fulfilled');
    const replayed = await service.call('postCycleCountAdjustment', {
      account: owner,
      command: commands[winnerIndex],
      correlationId: 'COR-CYCLE-REPLAY',
    });
    expect(replayed).toMatchObject({
      transactionId: outcomes[winnerIndex].value.transactionId,
      countedQuantity: 11,
      delta: 1,
    });
    await expect(balance('ITM-CYCLE-COUNT')).resolves.toMatchObject({ onHand: 11 });
  });
});
