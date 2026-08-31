import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Miniflare } from 'miniflare';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { unstable_splitSqlQuery } from 'wrangler';
import { createD1OperationalService } from '../../src/server/d1/operational-service.js';

const repositoryRoot = resolve(fileURLToPath(new URL('../..', import.meta.url)));
const timestamp = '2026-08-31T00:00:00.000Z';
const owner = Object.freeze({
  id: 'MFR002-OWNER',
  accessIdNormalized: 'MFR002.OWNER',
  status: 'ACTIVE',
  roleId: 'SYSTEM_OWNER',
  committeeIds: [],
  defaultCommitteeId: '',
  profile: { fullName: 'MFR-002 test owner' },
});

let miniflare;
let db;
let service;

async function applyMigrations(database) {
  const directory = resolve(repositoryRoot, 'migrations');
  const names = (await readdir(directory)).filter((name) => /^\d{4}_.+\.sql$/u.test(name)).sort();
  for (const name of names) {
    const source = await readFile(resolve(directory, name), 'utf8');
    for (const statement of unstable_splitSqlQuery(source)) await database.prepare(statement).run();
  }
}

async function seedInventory(database) {
  await database
    .prepare(
      `INSERT INTO accounts (
         id, access_id_normalized, status, role_id, profile_full_name,
         credential_version, onboarding_completed_at, created_at, updated_at
       ) VALUES (?1, ?2, 'ACTIVE', 'SYSTEM_OWNER', ?3, 1, ?4, ?4, ?4)`,
    )
    .bind(owner.id, owner.accessIdNormalized, owner.profile.fullName, timestamp)
    .run();

  const itemStatement = database.prepare(
    `INSERT INTO inventory_items (
       id, name, category, stock_area, handling, unit, status, catalog_type,
       storage_location, reorder_threshold, low_stock_alert_enabled, low_stock_threshold,
       created_at, updated_at, updated_by
     ) VALUES (?1, ?2, 'Operations', 'Office Inventory', 'TO_CLASSIFY', 'piece',
       'ACTIVE', 'OFFICE_INVENTORY', ?3, 1, 1, 1, ?4, ?4, ?5)`,
  );
  const aliasStatement = database.prepare(
    'INSERT INTO item_aliases (item_id, normalized_alias, display_alias) VALUES (?1, ?2, ?3)',
  );
  const ledgerStatement = database.prepare(
    `INSERT INTO inventory_ledger (
       id, created_at, transaction_type, direction, item_id, quantity, unit,
       signed_quantity, related_entity_type, related_entity_id, actor_account_id,
       idempotency_key, status, notes
     ) VALUES (?1, ?2, 'OPENING_BALANCE', 'IN', ?3, 5, 'piece', 5,
       'INVENTORY_ITEM', ?3, ?4, ?5, 'POSTED', 'MFR-002 pagination fixture')`,
  );
  const reservationStatement = database.prepare(
    `INSERT INTO reservations (
       id, item_id, quantity, unit, status, idempotency_key, notes,
       created_at, updated_at, created_by
     ) VALUES (?1, ?2, 1, 'piece', 'ACTIVE', ?3, 'MFR-002 pagination fixture', ?4, ?4, ?5)`,
  );
  const classificationStatement = database.prepare(
    `INSERT INTO inventory_classification_history (
       id, item_id, revision, previous_status, new_status, previous_kind, new_kind,
       lendable_enabled, lending_audience, condition_review_state,
       maintenance_review_state, asset_instance_count, classification_notes,
       occurred_at, actor_account_id, correlation_id
     ) VALUES (?1, ?2, 1, 'NEEDS_CLASSIFICATION', 'NEEDS_CLASSIFICATION',
       'UNVERIFIED', 'UNVERIFIED', 0, 'NOT_AVAILABLE_FOR_LENDING', 'NOT_ASSESSED',
       'NOT_ASSESSED', 1, 'MFR-002 pagination fixture', ?3, ?4, ?5)`,
  );
  const assetStatement = database.prepare(
    `INSERT INTO inventory_asset_instances (
       id, item_id, asset_tag, condition_label, lifecycle_status,
       created_at, updated_at, created_by, updated_by
     ) VALUES (?1, ?2, ?3, 'GOOD', 'AVAILABLE', ?4, ?4, ?5, ?5)`,
  );
  const maintenanceStatement = database.prepare(
    `INSERT INTO inventory_asset_maintenance (
       id, asset_id, event_type, condition_label, occurred_at, recorded_by, notes
     ) VALUES (?1, ?2, 'INSPECTED', 'GOOD', ?3, ?4, 'MFR-002 pagination fixture')`,
  );
  const movementStatement = database.prepare(
    `INSERT INTO inventory_asset_movements (
       id, asset_id, movement_type, previous_status, new_status,
       condition_label, occurred_at, recorded_by, notes
     ) VALUES (?1, ?2, 'REGISTERED', '', 'AVAILABLE', 'GOOD', ?3, ?4,
       'MFR-002 pagination fixture')`,
  );

  for (let index = 1; index <= 60; index += 1) {
    const suffix = String(index).padStart(3, '0');
    const itemId = `MFR-ITEM-${suffix}`;
    const assetId = `MFR-ASSET-${suffix}`;
    const name = index <= 30 ? `Needle supply ${suffix}` : `Other supply ${suffix}`;
    await itemStatement
      .bind(itemId, name, index % 2 ? 'North room' : 'South room', timestamp, owner.id)
      .run();
    await aliasStatement
      .bind(itemId, `ALIAS-${suffix}`, index === 60 ? 'Lookup wrench' : `Alias ${suffix}`)
      .run();
    if (index % 3 !== 0) {
      await ledgerStatement
        .bind(`MFR-LEDGER-${suffix}`, timestamp, itemId, owner.id, `MFR-LEDGER-${suffix}`)
        .run();
      await reservationStatement
        .bind(`MFR-RESERVATION-${suffix}`, itemId, `MFR-RESERVATION-${suffix}`, timestamp, owner.id)
        .run();
    }
    await classificationStatement
      .bind(`MFR-CLASSIFICATION-${suffix}`, itemId, timestamp, owner.id, `MFR-CORRELATION-${suffix}`)
      .run();
    await assetStatement.bind(assetId, itemId, `MFR-TAG-${suffix}`, timestamp, owner.id).run();
    await maintenanceStatement.bind(`MFR-MAINTENANCE-${suffix}`, assetId, timestamp, owner.id).run();
    await movementStatement.bind(`MFR-MOVEMENT-${suffix}`, assetId, timestamp, owner.id).run();
  }

  await database
    .prepare(
      `INSERT INTO lending_tickets (
         id, borrower_reference, borrower_name, borrower_type, department_organization,
         contact, item_id, quantity, unit, purpose, due_at, ticket_type, status,
         created_by, created_at, updated_at, requested_item_id, requested_quantity
       ) VALUES (
         'MFR-LENDING-001', 'MFR-002-BORROWER', 'Synthetic borrower', 'ANGELITE',
         'Engineering', '09170000000', 'MFR-ITEM-060', 1, 'piece',
         'MFR-002 bounded Lending fixture', ?1, 'LOAN', 'FOR_REVIEW', ?2, ?1, ?1,
         'MFR-ITEM-060', 1
       )`,
    )
    .bind(timestamp, owner.id)
    .run();

  const historyStatement = database.prepare(
    `INSERT INTO status_history (
       id, entity_type, entity_id, previous_status, new_status, changed_at,
       changed_by, reason, idempotency_key, metadata_json
     ) VALUES (?1, 'LENDING', 'MFR-LENDING-001', 'FOR_REVIEW', 'FOR_REVIEW', ?2,
      ?3, ?4, ?5, '{}')`,
  );
  const historyStatements = [];
  for (let index = 0; index <= 21; index += 1) {
    const suffix = String(index).padStart(2, '0');
    historyStatements.push(
      historyStatement.bind(
        `MFR-HISTORY-${suffix}`,
        timestamp,
        owner.id,
        `MFR-002 bounded history ${suffix}`,
        `MFR-HISTORY-${suffix}`,
      ),
    );
  }
  await database.batch(historyStatements);
}

function recordingDatabase(database) {
  const statements = [];
  return {
    statements,
    binding: {
      prepare(sql) {
        statements.push(String(sql));
        return database.prepare(sql);
      },
      batch(preparedStatements) {
        return database.batch(preparedStatements);
      },
    },
  };
}

describe('MFR-002 Inventory D1 pagination', () => {
  beforeAll(async () => {
    miniflare = new Miniflare({
      modules: true,
      script: 'export default { fetch() { return new Response("ok"); } }',
      d1Databases: ['DB'],
    });
    db = await miniflare.getD1Database('DB');
    await applyMigrations(db);
    await seedInventory(db);
    service = createD1OperationalService({ db, schemaVersion: '32' });
  }, 60_000);

  afterAll(async () => {
    await miniflare?.dispose();
  });

  it('uses one searched page and limits every related collection to its visible parents', async () => {
    const result = await service.bootstrapModule({
      account: owner,
      command: { module: 'inventory', page: 2, pageSize: 10, query: 'needle' },
      correlationId: 'MFR002-D1-PAGE',
    });

    expect(result.pagination).toEqual({ page: 2, pageSize: 10, total: 30, hasMore: true });
    expect(result.data.inventoryItems).toHaveLength(10);
    const itemIds = new Set(result.data.inventoryItems.map((item) => item.id));
    const assetIds = new Set(result.data.inventoryAssets.map((asset) => asset.id));
    expect([...itemIds]).toEqual([
      'MFR-ITEM-011',
      'MFR-ITEM-012',
      'MFR-ITEM-013',
      'MFR-ITEM-014',
      'MFR-ITEM-015',
      'MFR-ITEM-016',
      'MFR-ITEM-017',
      'MFR-ITEM-018',
      'MFR-ITEM-019',
      'MFR-ITEM-020',
    ]);
    expect(result.data.inventoryItems.every((item) => item.classificationHistory.length === 1)).toBe(true);
    expect(result.data.inventoryAssets.every((asset) => itemIds.has(asset.item_id))).toBe(true);
    expect(result.data.ledgerTransactions.every((entry) => itemIds.has(entry.itemId))).toBe(true);
    expect(result.data.reservations.every((entry) => itemIds.has(entry.itemId))).toBe(true);
    expect(result.data.assetMaintenanceHistory.every((entry) => assetIds.has(entry.asset_id))).toBe(true);
    expect(result.data.assetMovementHistory.every((entry) => assetIds.has(entry.asset_id))).toBe(true);
    for (const collection of [
      result.data.inventoryAssets,
      result.data.ledgerTransactions,
      result.data.reservations,
      result.data.assetMaintenanceHistory,
      result.data.assetMovementHistory,
    ]) {
      expect(collection.length).toBeLessThanOrEqual(40);
    }
  });

  it('applies filter totals and alias search in D1 rather than after pagination', async () => {
    const below = await service.bootstrapModule({
      account: owner,
      command: { module: 'inventory', page: 1, pageSize: 10, filter: 'BELOW' },
      correlationId: 'MFR002-D1-BELOW',
    });
    const alias = await service.bootstrapModule({
      account: owner,
      command: { module: 'inventory', page: 1, pageSize: 10, query: 'lookup wrench' },
      correlationId: 'MFR002-D1-ALIAS',
    });

    expect(below.pagination).toEqual({ page: 1, pageSize: 10, total: 20, hasMore: true });
    expect(below.data.inventoryItems.every((item) => item.onHand === 0)).toBe(true);
    expect(alias.pagination).toEqual({ page: 1, pageSize: 10, total: 1, hasMore: false });
    expect(alias.data.inventoryItems.map((item) => item.id)).toEqual(['MFR-ITEM-060']);
  });

  it('omits generic reads that Restocking and Procurement do not return', async () => {
    const restockingRecorder = recordingDatabase(db);
    const restockingService = createD1OperationalService({
      db: restockingRecorder.binding,
      schemaVersion: '32',
    });
    await restockingService.bootstrapModule({
      account: owner,
      command: { module: 'restocking', page: 1, pageSize: 10 },
      correlationId: 'MFR002-D1-RESTOCKING',
    });
    const restockingSql = restockingRecorder.statements.join('\n');
    expect(restockingSql).not.toMatch(/SELECT request\.\* FROM requests request WHERE/u);
    expect(restockingSql).not.toMatch(/SELECT line\.\* FROM request_lines line\s+JOIN requests request/u);

    const procurementRecorder = recordingDatabase(db);
    const procurementService = createD1OperationalService({
      db: procurementRecorder.binding,
      schemaVersion: '32',
    });
    await procurementService.bootstrapModule({
      account: owner,
      command: { module: 'procurement', page: 1, pageSize: 10 },
      correlationId: 'MFR002-D1-PROCUREMENT',
    });
    const procurementSql = procurementRecorder.statements.join('\n');
    expect(procurementSql).not.toMatch(
      /FROM inventory_items item\s+JOIN lending_catalog_availability availability[\s\S]*LIMIT \?1 OFFSET \?2/u,
    );
  });

  it('bounds visible Lending item, asset, and history collections and discloses truncation', async () => {
    const result = await service.bootstrapModule({
      account: owner,
      command: { module: 'lending', page: 1, pageSize: 1 },
      correlationId: 'MFR002-D1-LENDING',
    });

    expect(result.data.inventoryItems.map((item) => item.id)).toEqual(['MFR-ITEM-001', 'MFR-ITEM-060']);
    expect(result.data.lendingTickets).toHaveLength(1);
    expect(result.data.lendingTickets[0]).toMatchObject({
      id: 'MFR-LENDING-001',
      historyHasMore: true,
    });
    expect(result.data.lendingTickets[0].assetOptions.map((asset) => asset.itemId)).toEqual([
      'MFR-ITEM-001',
      'MFR-ITEM-060',
    ]);
    expect(result.data.lendingTickets[0].history).toHaveLength(20);
    expect(result.data.lendingTickets[0].history[0].reason).toBe('MFR-002 bounded history 02');
    expect(result.data.lendingTickets[0].history.at(-1).reason).toBe('MFR-002 bounded history 21');
  });
});
