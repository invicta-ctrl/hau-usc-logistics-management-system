import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { afterEach, describe, expect, it } from 'vitest';
import { reconcileInventoryDatabase } from '../../scripts/d1/reconcile-inventory-truth.mjs';

const repositoryRoot = resolve(import.meta.dirname, '../..');
let database;

afterEach(() => {
  database?.close();
  database = null;
});

async function schema32() {
  database = new DatabaseSync(':memory:');
  const migrationDirectory = resolve(repositoryRoot, 'migrations');
  const migrations = (await readdir(migrationDirectory)).filter((name) => name.endsWith('.sql')).sort();
  database.exec(
    'CREATE TABLE d1_migrations (id INTEGER PRIMARY KEY, name TEXT NOT NULL, applied_at TEXT NOT NULL)',
  );
  for (const [index, migration] of migrations.entries()) {
    database.exec(await readFile(resolve(migrationDirectory, migration), 'utf8'));
    database
      .prepare('INSERT INTO d1_migrations (id, name, applied_at) VALUES (?, ?, ?)')
      .run(index + 1, migration, '2026-08-09T00:00:00.000Z');
  }
  return database;
}

function addInventoryFixture(sqlite) {
  sqlite.exec(`
    INSERT INTO inventory_items (
      id, name, category, stock_area, handling, unit, opening_quantity, status,
      catalog_type, storage_location, reorder_threshold, lending_audience,
      approval_required, legacy_source_sheet, verification_note, notes,
      created_at, updated_at, updated_by
    ) VALUES (
      'SYN-ITEM-1', 'Synthetic paper', 'OFFICE_SUPPLIES', 'Inventory', 'CONSUMABLE',
      'piece', 0, 'ACTIVE', 'OFFICE_INVENTORY', 'Synthetic shelf', 0,
      'NOT_AVAILABLE_FOR_LENDING', 1, '', '', '',
      '2026-08-09T00:00:00.000Z', '2026-08-09T00:00:00.000Z', 'SYSTEM-IMPORT'
    );
    INSERT INTO inventory_ledger (
      id, created_at, transaction_type, direction, item_id, quantity, unit,
      signed_quantity, related_entity_type, related_entity_id, actor_account_id,
      idempotency_key, status, notes
    ) VALUES (
      'SYN-OPEN-1', '2026-08-09T00:00:00.000Z', 'OPENING_BALANCE', 'IN',
      'SYN-ITEM-1', 10, 'piece', 10, 'INVENTORY_ITEM', 'SYN-ITEM-1',
      'SYSTEM-IMPORT', 'syn-opening-1', 'POSTED', 'Synthetic fixture'
    );
  `);
}

describe('schema-32 Inventory reconciliation', () => {
  it('accepts independently derived Inventory truth on a clean schema-32 fixture', async () => {
    const sqlite = await schema32();
    addInventoryFixture(sqlite);

    const result = reconcileInventoryDatabase(sqlite, {
      environment: 'LOCAL_TEST',
      candidateSha: 'a'.repeat(40),
    });

    expect(result.database).toEqual({
      operationalSchema: '32',
      latestMigration: '0032_staff_account_activity_history.sql',
      integrityOk: true,
      foreignKeyViolations: 0,
    });
    expect(result.safeCounts).toMatchObject({ inventoryItems: 1, postedLedgerRows: 1 });
    expect(result.summary).toMatchObject({
      discrepantChecks: 0,
      discrepancyCount: 0,
      quarantineRequired: 0,
      disposition: 'RECONCILED',
    });
  });

  it('requires a candidate-bound result for Production read-only reconciliation', async () => {
    const sqlite = await schema32();
    addInventoryFixture(sqlite);

    expect(() => reconcileInventoryDatabase(sqlite, { environment: 'PRODUCTION_READ_ONLY' })).toThrow(
      'Production read-only reconciliation requires an exact lowercase candidate SHA.',
    );

    const result = reconcileInventoryDatabase(sqlite, {
      environment: 'PRODUCTION_READ_ONLY',
      candidateSha: 'b'.repeat(40),
    });

    expect(result).toMatchObject({
      environment: 'PRODUCTION_READ_ONLY',
      candidateSha: 'b'.repeat(40),
      database: {
        operationalSchema: '32',
        latestMigration: '0032_staff_account_activity_history.sql',
      },
      summary: {
        checksExecuted: expect.any(Number),
        disposition: 'RECONCILED',
      },
    });
  });

  it('blocks a fixture with overconsumption, direct opening stock, and an orphan transfer effect', async () => {
    const sqlite = await schema32();
    addInventoryFixture(sqlite);
    sqlite.exec(`
      DROP TRIGGER inventory_items_opening_quantity_update_guard;
      DROP TRIGGER reservation_consumption_guard;
      UPDATE inventory_items SET opening_quantity = 2 WHERE id = 'SYN-ITEM-1';
      INSERT INTO reservations (
        id, item_id, quantity, unit, status, idempotency_key, created_at, updated_at, created_by
      ) VALUES (
        'SYN-RSV-1', 'SYN-ITEM-1', 2, 'piece', 'ACTIVE', 'syn-reservation-1',
        '2026-08-09T00:00:00.000Z', '2026-08-09T00:00:00.000Z', 'SYSTEM-IMPORT'
      );
      INSERT INTO reservation_consumptions (
        id, reservation_id, related_entity_type, related_entity_id, quantity,
        idempotency_key, consumed_at, consumed_by
      ) VALUES (
        'SYN-RSC-1', 'SYN-RSV-1', 'RELEASE', 'SYN-REL-1', 3,
        'syn-consumption-1', '2026-08-09T00:00:00.000Z', 'SYSTEM-IMPORT'
      );
      INSERT INTO inventory_ledger (
        id, created_at, transaction_type, direction, item_id, event_item_id,
        quantity, unit, signed_quantity, related_entity_type, related_entity_id,
        actor_account_id, idempotency_key, status, notes
      ) VALUES (
        'SYN-TRANSFER-OUT', '2026-08-09T00:00:00.000Z', 'TRANSFER_OUT_EVENT', 'OUT',
        'SYN-ITEM-1', 'SYN-EVENT-ITEM', 1, 'piece', -1, 'TRANSFER_MAP', 'SYN-MAP-1',
        'SYSTEM-IMPORT', 'syn-transfer:out', 'POSTED', 'Synthetic orphan'
      );
    `);

    const result = reconcileInventoryDatabase(sqlite);
    const discrepancies = Object.fromEntries(
      result.checks.map((check) => [check.id, check.discrepancyCount]),
    );

    expect(discrepancies.DIRECT_OPENING_QUANTITY).toBe(1);
    expect(discrepancies.RESERVATION_OVERCONSUMED).toBe(1);
    expect(discrepancies.TRANSFER_PAIR_MISMATCH).toBe(1);
    expect(result.summary.disposition).toBe('BLOCKS_CANDIDATE');
  });

  it('blocks a receipt recorded after its procurement parent became terminal', async () => {
    const sqlite = await schema32();
    addInventoryFixture(sqlite);
    sqlite.exec(`
      INSERT INTO restock_requests (
        id, item_id, requested_quantity, received_quantity, unit, status,
        created_at, updated_at, created_by
      ) VALUES (
        'SYN-RESTOCK-TERMINAL', 'SYN-ITEM-1', 2, 1, 'piece', 'CANCELLED',
        '2026-08-09T00:00:00.000Z', '2026-08-09T00:01:00.000Z', 'SYSTEM-IMPORT'
      );
      INSERT INTO status_history (
        id, entity_type, entity_id, previous_status, new_status, changed_at,
        changed_by, reason, idempotency_key, metadata_json
      ) VALUES (
        'SYN-HISTORY-CANCEL', 'RESTOCK', 'SYN-RESTOCK-TERMINAL', 'PROCURED', 'CANCELLED',
        '2026-08-09T00:01:00.000Z', 'SYSTEM-IMPORT', 'Synthetic cancellation',
        'syn-restock-cancel', '{}'
      );
      INSERT INTO receiving_records (
        id, entity_type, entity_id, item_id, quantity, unit, received_by,
        received_at, idempotency_key, notes
      ) VALUES (
        'SYN-RECEIVING-AFTER-CANCEL', 'RESTOCK', 'SYN-RESTOCK-TERMINAL', 'SYN-ITEM-1',
        1, 'piece', 'SYSTEM-IMPORT', '2026-08-09T00:02:00.000Z',
        'syn-receiving-after-cancel', 'Synthetic impossible receipt'
      );
      INSERT INTO restock_receipts (
        id, restock_request_id, quantity, unit, idempotency_key, received_at, received_by
      ) VALUES (
        'SYN-RECEIVING-AFTER-CANCEL', 'SYN-RESTOCK-TERMINAL', 1, 'piece',
        'syn-receiving-after-cancel', '2026-08-09T00:02:00.000Z', 'SYSTEM-IMPORT'
      );
      INSERT INTO inventory_ledger (
        id, created_at, transaction_type, direction, item_id, quantity, unit,
        signed_quantity, related_entity_type, related_entity_id, actor_account_id,
        idempotency_key, status, notes
      ) VALUES (
        'SYN-RECEIVE-AFTER-CANCEL', '2026-08-09T00:02:00.000Z', 'RECEIVE', 'IN',
        'SYN-ITEM-1', 1, 'piece', 1, 'RESTOCK', 'SYN-RESTOCK-TERMINAL',
        'SYSTEM-IMPORT', 'syn-receiving-after-cancel', 'POSTED', 'Synthetic impossible receipt'
      );
    `);

    const result = reconcileInventoryDatabase(sqlite);
    const receiving = result.checks.find((check) => check.id === 'RECEIVING_EFFECT_MISMATCH');
    expect(receiving.discrepancyCount).toBe(1);
    expect(result.summary.disposition).toBe('BLOCKS_CANDIDATE');
  });

  it('blocks missing replay fields and a correction without the exact reversal link', async () => {
    const sqlite = await schema32();
    addInventoryFixture(sqlite);
    sqlite.exec(`
      DROP TRIGGER release_correction_state_guard;
      INSERT INTO inventory_ledger (
        id, created_at, transaction_type, direction, item_id, quantity, unit,
        signed_quantity, related_entity_type, related_entity_id, actor_account_id,
        idempotency_key, status, notes
      ) VALUES
        ('SYN-CYCLE-MALFORMED', '2026-08-09T00:01:00.000Z', 'CYCLE_COUNT_ADJUSTMENT',
         'ADJUSTMENT', 'SYN-ITEM-1', 1, 'piece', 1, 'INVENTORY_ITEM', 'SYN-ITEM-1',
         'SYSTEM-IMPORT', 'syn-cycle-malformed', 'POSTED', 'Synthetic malformed replay'),
        ('SYN-RELEASE-ORIGINAL', '2026-08-09T00:02:00.000Z', 'ISSUE', 'OUT',
         'SYN-ITEM-1', 1, 'piece', -1, 'RELEASE', 'SYN-RELEASE-GROUP',
         'SYSTEM-IMPORT', 'syn-release-original', 'POSTED', 'Synthetic release'),
        ('SYN-CORRECTION-LEDGER', '2026-08-09T00:03:00.000Z', 'RELEASE_CORRECTION', 'IN',
         'SYN-ITEM-1', 1, 'piece', 1, 'RELEASE_CORRECTION', 'SYN-CORRECTION',
         'SYSTEM-IMPORT', 'syn-correction', 'POSTED', 'Synthetic malformed correction');
      INSERT INTO idempotency_keys (
        scope, idempotency_key, actor_account_id, request_fingerprint, result_json, created_at
      ) VALUES (
        'postCycleCountAdjustment', 'syn-cycle-malformed', 'SYSTEM-IMPORT',
        'synthetic-fingerprint', '{}', '2026-08-09T00:01:00.000Z'
      );
      INSERT INTO release_confirmations (
        id, release_group_id, recipient_name, recipient_role, department, item_id,
        quantity, unit, released_by, released_at, confirmation_label,
        idempotency_key, status, notes
      ) VALUES (
        'SYN-CONFIRMATION', 'SYN-RELEASE-GROUP', 'Synthetic recipient', 'Synthetic role',
        '', 'SYN-ITEM-1', 1, 'piece', 'SYSTEM-IMPORT', '2026-08-09T00:02:00.000Z',
        'Synthetic confirmation', 'syn-release-original', 'CONFIRMED', 'Synthetic fixture'
      );
      INSERT INTO release_corrections (
        id, release_group_id, release_confirmation_id, quantity, reason,
        ledger_transaction_id, corrected_by, corrected_at, idempotency_key, status
      ) VALUES (
        'SYN-CORRECTION', 'SYN-RELEASE-GROUP', 'SYN-CONFIRMATION', 1,
        'Synthetic malformed reversal link', 'SYN-CORRECTION-LEDGER', 'SYSTEM-IMPORT',
        '2026-08-09T00:03:00.000Z', 'syn-correction', 'POSTED'
      );
    `);

    const result = reconcileInventoryDatabase(sqlite);
    const discrepancies = Object.fromEntries(
      result.checks.map((check) => [check.id, check.discrepancyCount]),
    );

    expect(discrepancies.CYCLE_COUNT_EFFECT_MISMATCH).toBe(1);
    expect(discrepancies.KNOWN_IDEMPOTENCY_ORPHAN).toBe(1);
    expect(discrepancies.RELEASE_CORRECTION_EFFECT_MISMATCH).toBe(1);
    expect(result.summary.disposition).toBe('BLOCKS_CANDIDATE');
  });
});
