import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { afterEach, describe, expect, it } from 'vitest';
import { createD1OperationalService } from '../../src/server/d1/operational-service.js';

const repositoryRoot = resolve(import.meta.dirname, '../..');
const timestamp = '2026-08-09T00:00:00.000Z';
const owner = Object.freeze({
  id: 'SYN-OWNER',
  accessIdNormalized: 'SYN.OWNER',
  status: 'ACTIVE',
  roleId: 'SYSTEM_OWNER',
  committeeIds: [],
  defaultCommitteeId: '',
  profile: { fullName: 'Synthetic Owner' },
});
const requester = Object.freeze({
  id: 'SYN-REQUESTER',
  accessIdNormalized: 'SYN.REQUESTER',
  status: 'ACTIVE',
  roleId: 'REQUESTER',
  committeeIds: [],
  defaultCommitteeId: '',
  institutionId: 'SYNTHETIC-REQUESTER',
  profileDepartmentId: 'SYNTHETIC-DEPARTMENT',
  departmentDisplayName: 'Synthetic Department',
  lendingEligible: true,
  profile: { fullName: 'Synthetic Requester' },
  requesterDepartment: { id: 'SYNTHETIC-DEPARTMENT' },
});

let sqlite;

afterEach(() => {
  sqlite?.close();
  sqlite = null;
});

function d1Adapter(database, { pauseAfterAll, pauseAfterFirst } = {}) {
  return {
    prepare(sql) {
      const prepared = database.prepare(sql);
      let bindings = [];
      return {
        bind(...values) {
          bindings = values;
          return this;
        },
        async first() {
          const result = prepared.get(...bindings) ?? null;
          await pauseAfterFirst?.(String(sql), result);
          return result;
        },
        async all() {
          const result = { results: prepared.all(...bindings) };
          await pauseAfterAll?.(String(sql), result);
          return result;
        },
        async run() {
          const result = prepared.run(...bindings);
          return { meta: { changes: Number(result.changes) } };
        },
        async executeBatchStatement() {
          if (/^\s*(?:SELECT|PRAGMA)\b/iu.test(sql)) {
            return { results: prepared.all(...bindings), meta: { changes: 0 } };
          }
          const result = prepared.run(...bindings);
          return { meta: { changes: Number(result.changes) } };
        },
      };
    },
    async batch(statements) {
      database.exec('BEGIN IMMEDIATE');
      try {
        const results = [];
        for (const statement of statements) results.push(await statement.executeBatchStatement());
        database.exec('COMMIT');
        return results;
      } catch (error) {
        database.exec('ROLLBACK');
        throw error;
      }
    },
  };
}

async function schema30Fixture() {
  sqlite = new DatabaseSync(':memory:');
  const migrationDirectory = resolve(repositoryRoot, 'migrations');
  const migrations = (await readdir(migrationDirectory)).filter((name) => name.endsWith('.sql')).sort();
  for (const migration of migrations)
    sqlite.exec(await readFile(resolve(migrationDirectory, migration), 'utf8'));
  sqlite.exec(`
    INSERT INTO accounts (
      id, access_id_normalized, status, role_id, profile_full_name,
      credential_version, onboarding_completed_at, created_at, updated_at
    ) VALUES
      ('SYN-OWNER', 'SYN.OWNER', 'ACTIVE', 'SYSTEM_OWNER', 'Synthetic Owner', 1, '${timestamp}', '${timestamp}', '${timestamp}'),
      ('SYN-REQUESTER', 'SYN.REQUESTER', 'ACTIVE', 'REQUESTER', 'Synthetic Requester', 1, '${timestamp}', '${timestamp}', '${timestamp}');

    INSERT INTO inventory_items (
      id, name, category, stock_area, handling, unit, opening_quantity, status,
      catalog_type, storage_location, reorder_threshold, lending_audience,
      approval_required, legacy_source_sheet, verification_note, notes,
      created_at, updated_at, updated_by, is_lendable, lending_kind,
      lending_status, lending_unit, inventory_kind, classification_status
    ) VALUES (
      'SYN-ITEM', 'Synthetic Item', 'OFFICE_SUPPLIES', 'Inventory', 'CONSUMABLE',
      'piece', 0, 'ACTIVE', 'OFFICE_INVENTORY', 'Synthetic Shelf', 0,
      'STUDENTS_AND_STAFF', 1, '', '', '', '${timestamp}', '${timestamp}',
      'SYN-OWNER', 1, 'CONSUMABLE', 'ACTIVE', 'piece', 'CONSUMABLE', 'CLASSIFIED'
    );

    INSERT INTO inventory_ledger (
      id, created_at, transaction_type, direction, item_id, quantity, unit,
      signed_quantity, related_entity_type, related_entity_id, actor_account_id,
      idempotency_key, status, notes
    ) VALUES (
      'SYN-OPENING', '${timestamp}', 'OPENING_BALANCE', 'IN', 'SYN-ITEM', 20,
      'piece', 20, 'INVENTORY_ITEM', 'SYN-ITEM', 'SYN-OWNER', 'syn-opening',
      'POSTED', 'Synthetic opening balance'
    );
  `);
  return d1Adapter(sqlite);
}

function oneShotBarrier(match) {
  let reached;
  let release;
  const reachedPromise = new Promise((resolveReached) => {
    reached = resolveReached;
  });
  const releasePromise = new Promise((resolveRelease) => {
    release = resolveRelease;
  });
  let paused = false;
  return {
    reached: reachedPromise,
    release,
    async pauseAfterAll(sql) {
      if (paused || !match(sql)) return;
      paused = true;
      reached();
      await releasePromise;
    },
  };
}

describe('schema-30 irreversible command cancellation races', () => {
  it('refuses an owner-scoped orphan reservation with no governed request line', async () => {
    const db = await schema30Fixture();
    const reservationService = createD1OperationalService({ db, schemaVersion: '30' });

    await expect(
      reservationService.call('reserveStock', {
        account: owner,
        command: {
          itemId: 'SYN-ITEM',
          quantity: 1,
          unit: 'piece',
          clientRequestId: 'syn-orphan-reservation',
        },
        correlationId: 'SYN-COR-ORPHAN-RESERVATION',
      }),
    ).rejects.toMatchObject({ code: 'VALIDATION_FAILED' });
    expect(sqlite.prepare('SELECT COUNT(*) AS total FROM reservations').get()).toEqual({ total: 0 });
  });

  it('refuses a direct stock reservation that tries to claim a Lending owner', async () => {
    const db = await schema30Fixture();
    sqlite.exec(`
      INSERT INTO requests (
        id, request_type, requester_account_id, requester_name, purpose, status,
        client_request_id, created_at, updated_at, created_by
      ) VALUES (
        'SYN-REQUEST', 'GENERAL_REQUEST', 'SYN-REQUESTER', 'Synthetic Requester',
        'Reservation ownership proof', 'ACCEPTED', 'syn-request', '${timestamp}', '${timestamp}', 'SYN-REQUESTER'
      );
      INSERT INTO request_lines (
        id, request_id, item_id, description, requested_quantity, unit,
        fulfillment_source, status, client_line_id, created_at, updated_at, created_by
      ) VALUES (
        'SYN-LINE', 'SYN-REQUEST', 'SYN-ITEM', 'Synthetic Item', 2, 'piece',
        'ISSUE_FROM_STOCK', 'READY_TO_RESERVE', 'syn-line', '${timestamp}', '${timestamp}', 'SYN-REQUESTER'
      );
    `);
    const reservationService = createD1OperationalService({ db, schemaVersion: '30' });

    await expect(
      reservationService.call('reserveStock', {
        account: owner,
        command: {
          itemId: 'SYN-ITEM',
          requestLineId: 'SYN-LINE',
          lendingTicketId: 'SYN-FOREIGN-LENDING-TICKET',
          quantity: 1,
          unit: 'piece',
          clientRequestId: 'syn-cross-domain-reservation',
        },
        correlationId: 'SYN-COR-CROSS-DOMAIN-RESERVATION',
      }),
    ).rejects.toMatchObject({ code: 'RESERVATION_OWNER_CONFLICT', status: 409 });
    expect(sqlite.prepare('SELECT COUNT(*) AS total FROM reservations').get()).toEqual({ total: 0 });
  });

  it('rolls back every release effect when requester cancellation wins after the release snapshot', async () => {
    const baseDb = await schema30Fixture();
    sqlite.exec(`
      INSERT INTO requests (
        id, request_type, requester_account_id, requester_name, purpose, status,
        client_request_id, created_at, updated_at, created_by
      ) VALUES (
        'SYN-REQUEST', 'GENERAL_REQUEST', 'SYN-REQUESTER', 'Synthetic Requester',
        'Cancellation race proof', 'ACCEPTED', 'syn-request', '${timestamp}', '${timestamp}', 'SYN-REQUESTER'
      );
      INSERT INTO request_lines (
        id, request_id, item_id, description, requested_quantity, unit,
        fulfillment_source, status, client_line_id, created_at, updated_at, created_by
      ) VALUES (
        'SYN-LINE', 'SYN-REQUEST', 'SYN-ITEM', 'Synthetic Item', 2, 'piece',
        'ISSUE_FROM_STOCK', 'READY_TO_RELEASE', 'syn-line', '${timestamp}', '${timestamp}', 'SYN-REQUESTER'
      );
      INSERT INTO reservations (
        id, item_id, quantity, unit, request_line_id, status, idempotency_key,
        created_at, updated_at, created_by
      ) VALUES (
        'SYN-REQUEST-RESERVATION', 'SYN-ITEM', 2, 'piece', 'SYN-LINE', 'ACTIVE',
        'syn-request-reservation', '${timestamp}', '${timestamp}', 'SYN-OWNER'
      );
    `);
    const barrier = oneShotBarrier(
      (sql) => sql.includes('FROM reservations reservation') && sql.includes('reservation.request_line_id'),
    );
    const releaseService = createD1OperationalService({
      db: d1Adapter(sqlite, { pauseAfterAll: barrier.pauseAfterAll }),
      schemaVersion: '30',
    });
    const cancellationService = createD1OperationalService({ db: baseDb, schemaVersion: '30' });
    const releasePromise = releaseService.call('confirmRelease', {
      account: owner,
      command: {
        requestId: 'SYN-REQUEST',
        lines: [{ requestLineId: 'SYN-LINE', quantity: 2 }],
        recipientConfirmed: true,
        recipientName: 'Synthetic Recipient',
        recipientRole: 'Synthetic Role',
        department: 'Synthetic Department',
        clientRequestId: 'syn-release-race',
      },
      correlationId: 'SYN-COR-RELEASE',
    });

    await barrier.reached;
    await cancellationService.cancelRequesterRequest({
      account: requester,
      command: { requestId: 'SYN-REQUEST', clientRequestId: 'syn-request-cancel' },
      correlationId: 'SYN-COR-CANCEL',
    });
    barrier.release();

    await expect(releasePromise).rejects.toMatchObject({ code: 'RELEASE_STATE_CONFLICT', status: 409 });
    expect(sqlite.prepare("SELECT status FROM requests WHERE id = 'SYN-REQUEST'").get()).toEqual({
      status: 'CANCELLED',
    });
    expect(sqlite.prepare("SELECT status FROM request_lines WHERE id = 'SYN-LINE'").get()).toEqual({
      status: 'CANCELLED',
    });
    expect(
      sqlite.prepare("SELECT status FROM reservations WHERE id = 'SYN-REQUEST-RESERVATION'").get(),
    ).toEqual({ status: 'CANCELLED' });
    expect(sqlite.prepare('SELECT COUNT(*) AS total FROM reservation_consumptions').get()).toEqual({
      total: 0,
    });
    expect(sqlite.prepare('SELECT COUNT(*) AS total FROM release_confirmations').get()).toEqual({ total: 0 });
    expect(
      sqlite.prepare("SELECT COUNT(*) AS total FROM inventory_ledger WHERE transaction_type = 'ISSUE'").get(),
    ).toEqual({ total: 0 });
  });

  it('rolls back every handoff effect when borrower cancellation wins after the handoff snapshot', async () => {
    const baseDb = await schema30Fixture();
    sqlite.exec(`
      INSERT INTO lending_tickets (
        id, borrower_reference, borrower_name, borrower_type, item_id, quantity,
        unit, purpose, ticket_type, status, approved_by, approved_at,
        created_by, created_at, updated_at
      ) VALUES (
        'SYN-LENDING', 'SYNTHETIC-REQUESTER', 'Synthetic Requester', 'INSTITUTION_APPROVED',
        'SYN-ITEM', 2, 'piece', 'Cancellation race proof', 'CONSUMABLE', 'READY_TO_CLAIM',
        'SYN-OWNER', '${timestamp}', 'SYN-REQUESTER', '${timestamp}', '${timestamp}'
      );
      INSERT INTO reservations (
        id, item_id, quantity, unit, lending_ticket_id, status, idempotency_key,
        created_at, updated_at, created_by
      ) VALUES (
        'SYN-LENDING-RESERVATION', 'SYN-ITEM', 2, 'piece', 'SYN-LENDING', 'ACTIVE',
        'syn-lending-reservation', '${timestamp}', '${timestamp}', 'SYN-OWNER'
      );
    `);
    const barrier = oneShotBarrier((sql) => sql.includes('SELECT asset_id FROM lending_ticket_assets'));
    const handoffService = createD1OperationalService({
      db: d1Adapter(sqlite, { pauseAfterAll: barrier.pauseAfterAll }),
      schemaVersion: '30',
    });
    const cancellationService = createD1OperationalService({ db: baseDb, schemaVersion: '30' });
    const handoffPromise = handoffService.call('confirmLendingHandoff', {
      account: owner,
      command: { ticketId: 'SYN-LENDING', clientRequestId: 'syn-handoff-race' },
      correlationId: 'SYN-COR-HANDOFF',
    });

    await barrier.reached;
    await cancellationService.cancelBorrowerLendingRequest({
      account: requester,
      command: { ticketId: 'SYN-LENDING', clientRequestId: 'syn-lending-cancel' },
      correlationId: 'SYN-COR-LENDING-CANCEL',
    });
    barrier.release();

    await expect(handoffPromise).rejects.toMatchObject({
      code: 'LENDING_HANDOFF_STATE_CONFLICT',
      status: 409,
    });
    expect(sqlite.prepare("SELECT status FROM lending_tickets WHERE id = 'SYN-LENDING'").get()).toEqual({
      status: 'CANCELLED',
    });
    expect(
      sqlite.prepare("SELECT status FROM reservations WHERE id = 'SYN-LENDING-RESERVATION'").get(),
    ).toEqual({ status: 'CANCELLED' });
    expect(sqlite.prepare('SELECT COUNT(*) AS total FROM lending_handoffs').get()).toEqual({ total: 0 });
    expect(
      sqlite
        .prepare("SELECT COUNT(*) AS total FROM inventory_ledger WHERE related_entity_type = 'LENDING'")
        .get(),
    ).toEqual({ total: 0 });
  });

  it('rolls back a lending approval when borrower cancellation wins after the review snapshot', async () => {
    const baseDb = await schema30Fixture();
    sqlite.exec(`
      INSERT INTO lending_tickets (
        id, borrower_reference, borrower_name, borrower_type, item_id, quantity,
        unit, purpose, ticket_type, status, created_by, created_at, updated_at
      ) VALUES (
        'SYN-APPROVAL', 'SYNTHETIC-REQUESTER', 'Synthetic Requester', 'INSTITUTION_APPROVED',
        'SYN-ITEM', 2, 'piece', 'Approval cancellation race proof', 'CONSUMABLE', 'FOR_REVIEW',
        'SYN-REQUESTER', '${timestamp}', '${timestamp}'
      );
    `);
    const barrier = oneShotBarrier(
      (sql) => sql.includes('SELECT COUNT(*) AS count') && sql.includes('inventory_asset_instances'),
    );
    const approvalService = createD1OperationalService({
      db: d1Adapter(sqlite, { pauseAfterFirst: barrier.pauseAfterAll }),
      schemaVersion: '30',
    });
    const cancellationService = createD1OperationalService({ db: baseDb, schemaVersion: '30' });
    const approvalPromise = approvalService.call('approveLendingTicket', {
      account: owner,
      command: {
        ticketId: 'SYN-APPROVAL',
        decision: 'APPROVE',
        identityVerified: true,
        identityVerificationSource: 'APPROVED_ANGELITE_IDENTITY_RULE',
        clientRequestId: 'syn-approval-race',
      },
      correlationId: 'SYN-COR-APPROVAL',
    });

    await barrier.reached;
    await cancellationService.cancelBorrowerLendingRequest({
      account: requester,
      command: { ticketId: 'SYN-APPROVAL', clientRequestId: 'syn-approval-cancel' },
      correlationId: 'SYN-COR-APPROVAL-CANCEL',
    });
    barrier.release();

    await expect(approvalPromise).rejects.toMatchObject({ code: 'LENDING_STATE_CONFLICT', status: 409 });
    expect(sqlite.prepare("SELECT status FROM lending_tickets WHERE id = 'SYN-APPROVAL'").get()).toEqual({
      status: 'CANCELLED',
    });
    expect(
      sqlite.prepare("SELECT COUNT(*) AS total FROM reservations WHERE lending_ticket_id = 'SYN-APPROVAL'").get(),
    ).toEqual({ total: 0 });
    expect(
      sqlite
        .prepare(
          "SELECT COUNT(*) AS total FROM idempotency_keys WHERE scope = 'approveLendingTicket' AND idempotency_key = 'syn-approval-race'",
        )
        .get(),
    ).toEqual({ total: 0 });
  });

  it('rolls back stale maintenance when lending approval reserves the asset first', async () => {
    const baseDb = await schema30Fixture();
    sqlite.exec(`
      UPDATE inventory_items
      SET handling = 'REUSABLE_ASSET', inventory_kind = 'REUSABLE', lending_kind = 'REUSABLE',
          condition_review_state = 'GOOD', maintenance_review_state = 'CLEARED'
      WHERE id = 'SYN-ITEM';
      INSERT INTO inventory_asset_instances (
        id, item_id, asset_tag, condition_label, lifecycle_status,
        created_at, updated_at, created_by, updated_by
      ) VALUES (
        'SYN-ASSET', 'SYN-ITEM', 'SYN-ASSET-TAG', 'GOOD', 'AVAILABLE',
        '${timestamp}', '${timestamp}', 'SYN-OWNER', 'SYN-OWNER'
      );
      INSERT INTO lending_tickets (
        id, borrower_reference, borrower_name, borrower_type, item_id, quantity,
        unit, purpose, ticket_type, status, created_by, created_at, updated_at
      ) VALUES (
        'SYN-ASSET-TICKET', 'SYNTHETIC-REQUESTER', 'Synthetic Requester', 'INSTITUTION_APPROVED',
        'SYN-ITEM', 1, 'piece', 'Maintenance approval race proof', 'LOAN', 'FOR_REVIEW',
        'SYN-REQUESTER', '${timestamp}', '${timestamp}'
      );
    `);
    const barrier = oneShotBarrier(
      (sql) => sql.includes('SELECT id, lifecycle_status, current_lending_ticket_id, updated_at'),
    );
    const maintenanceService = createD1OperationalService({
      db: d1Adapter(sqlite, { pauseAfterFirst: barrier.pauseAfterAll }),
      schemaVersion: '30',
    });
    const approvalService = createD1OperationalService({ db: baseDb, schemaVersion: '30' });
    const maintenancePromise = maintenanceService.call('recordAssetMaintenance', {
      account: owner,
      command: {
        assetId: 'SYN-ASSET',
        eventType: 'OPENED',
        clientRequestId: 'syn-maintenance-race',
      },
      correlationId: 'SYN-COR-MAINTENANCE',
    });

    await barrier.reached;
    await approvalService.call('approveLendingTicket', {
      account: owner,
      command: {
        ticketId: 'SYN-ASSET-TICKET',
        decision: 'APPROVE',
        identityVerified: true,
        identityVerificationSource: 'APPROVED_ANGELITE_IDENTITY_RULE',
        assetIds: ['SYN-ASSET'],
        clientRequestId: 'syn-asset-approval',
      },
      correlationId: 'SYN-COR-ASSET-APPROVAL',
    });
    barrier.release();

    await expect(maintenancePromise).rejects.toMatchObject({
      code: 'ASSET_MAINTENANCE_STATE_CONFLICT',
      status: 409,
    });
    expect(
      sqlite
        .prepare(
          "SELECT lifecycle_status, current_lending_ticket_id FROM inventory_asset_instances WHERE id = 'SYN-ASSET'",
        )
        .get(),
    ).toEqual({ lifecycle_status: 'RESERVED', current_lending_ticket_id: 'SYN-ASSET-TICKET' });
    expect(sqlite.prepare('SELECT COUNT(*) AS total FROM inventory_asset_maintenance').get()).toEqual({ total: 0 });

    await approvalService.cancelBorrowerLendingRequest({
      account: requester,
      command: { ticketId: 'SYN-ASSET-TICKET', clientRequestId: 'syn-asset-ticket-cancel' },
      correlationId: 'SYN-COR-ASSET-CANCEL',
    });
    expect(
      sqlite
        .prepare(
          "SELECT released_at IS NOT NULL AS released, returned_at IS NOT NULL AS returned FROM lending_ticket_assets WHERE lending_ticket_id = 'SYN-ASSET-TICKET'",
        )
        .get(),
    ).toEqual({ released: 1, returned: 1 });
    sqlite.exec(`
      INSERT INTO lending_tickets (
        id, borrower_reference, borrower_name, borrower_type, item_id, quantity,
        unit, purpose, ticket_type, status, created_by, created_at, updated_at
      ) VALUES (
        'SYN-ASSET-TICKET-2', 'SYNTHETIC-REQUESTER', 'Synthetic Requester', 'INSTITUTION_APPROVED',
        'SYN-ITEM', 1, 'piece', 'Reassignment after cancellation proof', 'LOAN', 'FOR_REVIEW',
        'SYN-REQUESTER', '${timestamp}', '${timestamp}'
      );
    `);
    await expect(
      approvalService.call('approveLendingTicket', {
        account: owner,
        command: {
          ticketId: 'SYN-ASSET-TICKET-2',
          decision: 'APPROVE',
          identityVerified: true,
          identityVerificationSource: 'APPROVED_ANGELITE_IDENTITY_RULE',
          assetIds: ['SYN-ASSET'],
          clientRequestId: 'syn-asset-reassignment',
        },
        correlationId: 'SYN-COR-ASSET-REASSIGNMENT',
      }),
    ).resolves.toMatchObject({ status: 'READY_TO_CLAIM', assetIds: ['SYN-ASSET'] });
    expect(
      sqlite
        .prepare(
          "SELECT lifecycle_status, current_lending_ticket_id FROM inventory_asset_instances WHERE id = 'SYN-ASSET'",
        )
        .get(),
    ).toEqual({ lifecycle_status: 'RESERVED', current_lending_ticket_id: 'SYN-ASSET-TICKET-2' });
  });

  it('rolls back every receipt effect when deliverable cancellation wins after the receiving snapshot', async () => {
    const baseDb = await schema30Fixture();
    sqlite.exec(`
      INSERT INTO requests (
        id, request_type, requester_account_id, requester_name, purpose, status,
        client_request_id, created_at, updated_at, created_by
      ) VALUES (
        'SYN-RECEIVING-REQUEST', 'GENERAL_REQUEST', 'SYN-REQUESTER', 'Synthetic Requester',
        'Receiving cancellation race proof', 'ACCEPTED', 'syn-receiving-request',
        '${timestamp}', '${timestamp}', 'SYN-REQUESTER'
      );
      INSERT INTO request_lines (
        id, request_id, item_id, description, requested_quantity, unit,
        fulfillment_source, status, client_line_id, created_at, updated_at, created_by
      ) VALUES (
        'SYN-RECEIVING-LINE', 'SYN-RECEIVING-REQUEST', 'SYN-ITEM', 'Synthetic Item',
        2, 'piece', 'PROCUREMENT', 'PROCURED', 'syn-receiving-line',
        '${timestamp}', '${timestamp}', 'SYN-REQUESTER'
      );
      INSERT INTO deliverables (
        id, request_id, request_line_id, inventory_match_id, item_spec,
        quantity_requested, quantity_received, quantity_released, unit,
        fulfillment_source, status, created_at, updated_at, created_by
      ) VALUES (
        'SYN-DELIVERABLE', 'SYN-RECEIVING-REQUEST', 'SYN-RECEIVING-LINE', 'SYN-ITEM',
        'Synthetic Item', 2, 0, 0, 'piece', 'PROCUREMENT', 'PROCURED',
        '${timestamp}', '${timestamp}', 'SYN-OWNER'
      );
    `);
    const barrier = oneShotBarrier((sql) => sql.includes('SELECT * FROM deliverables WHERE id = ?1'));
    const receivingService = createD1OperationalService({
      db: d1Adapter(sqlite, { pauseAfterFirst: barrier.pauseAfterAll }),
      schemaVersion: '30',
    });
    const transitionService = createD1OperationalService({ db: baseDb, schemaVersion: '30' });
    const receivingPromise = receivingService.call('receiveDeliverable', {
      account: owner,
      command: {
        deliverableId: 'SYN-DELIVERABLE',
        quantity: 1,
        unit: 'piece',
        clientRequestId: 'syn-receiving-race',
      },
      correlationId: 'SYN-COR-RECEIVING',
    });

    await barrier.reached;
    await transitionService.call('transitionDeliverable', {
      account: owner,
      command: {
        deliverableId: 'SYN-DELIVERABLE',
        status: 'CANCELLED',
        note: 'Synthetic cancellation wins the race.',
        clientRequestId: 'syn-deliverable-cancel',
      },
      correlationId: 'SYN-COR-DELIVERABLE-CANCEL',
    });
    barrier.release();

    await expect(receivingPromise).rejects.toMatchObject({
      code: 'DELIVERABLE_STATE_CONFLICT',
      status: 409,
    });
    expect(sqlite.prepare("SELECT status FROM deliverables WHERE id = 'SYN-DELIVERABLE'").get()).toEqual({
      status: 'CANCELLED',
    });
    expect(sqlite.prepare('SELECT COUNT(*) AS total FROM receiving_records').get()).toEqual({ total: 0 });
    expect(
      sqlite.prepare("SELECT COUNT(*) AS total FROM inventory_ledger WHERE transaction_type = 'RECEIVE'").get(),
    ).toEqual({ total: 0 });
  });
});
