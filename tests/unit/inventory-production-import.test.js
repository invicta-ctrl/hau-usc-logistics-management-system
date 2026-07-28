import { spawnSync } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import { canonicalTabRows, readMapping, sha256 } from '../../scripts/migration/export-contract.mjs';

const root = resolve(import.meta.dirname, '../..');
const temporaryDirectories = [];

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })),
  );
});

async function sourceExport(rows) {
  const mapping = await readMapping();
  const tabHash = sha256(canonicalTabRows(rows));
  return {
    schemaVersion: mapping.schemaVersion,
    metadata: {
      exporterVersion: mapping.exporterVersion,
      snapshotAt: '2026-07-28T00:00:00.000Z',
      snapshotHash: sha256(`01_ITEM_MASTER:${tabHash}:${rows.length}`),
      sourceWorkbookLabel: 'Synthetic Phase 17 source',
      sourceOwnerLabel: 'Synthetic owner',
      permittedRowsLabel: 'Synthetic rows only',
      candidateSha: 'phase17-candidate',
      dataClassification: 'SYNTHETIC',
      requiredTabs: ['01_ITEM_MASTER'],
      excludedColumns: mapping.restrictedColumns,
      tabs: [{ label: '01_ITEM_MASTER', rowCount: rows.length, sha256: tabHash }],
    },
    tabs: { '01_ITEM_MASTER': rows },
  };
}

async function prepare(rows) {
  const directory = await mkdtemp(join(tmpdir(), 'hau-phase17-'));
  temporaryDirectories.push(directory);
  const paths = {
    input: join(directory, 'source.json'),
    sql: join(directory, 'import.sql'),
    rejections: join(directory, 'rejections.json'),
    review: join(directory, 'owner-review.json'),
    reconciliation: join(directory, 'reconciliation.sql'),
  };
  await writeFile(paths.input, `${JSON.stringify(await sourceExport(rows), null, 2)}\n`);
  const result = spawnSync(
    process.execPath,
    [
      resolve(root, 'scripts/migration/prepare-import.mjs'),
      '--input',
      paths.input,
      '--output-sql',
      paths.sql,
      '--rejections',
      paths.rejections,
      '--owner-review-queue',
      paths.review,
      '--reconciliation-sql',
      paths.reconciliation,
      '--candidate-sha',
      'phase17-candidate',
    ],
    { cwd: root, encoding: 'utf8' },
  );
  return {
    result,
    sql: await readFile(paths.sql, 'utf8'),
    rejections: JSON.parse(await readFile(paths.rejections, 'utf8')),
    review: JSON.parse(await readFile(paths.review, 'utf8')),
    reconciliation: await readFile(paths.reconciliation, 'utf8'),
  };
}

const item = (overrides = {}) => ({
  Item_ID: 'ITM-PHASE17',
  Item_Name: 'Synthetic Phase 17 item',
  Category: 'Synthetic',
  Stock_Area: 'Inventory',
  Handling: 'CONSUMABLE',
  Unit: 'piece',
  Opening_Qty: 5,
  Status: 'ACTIVE',
  Catalog_Type: 'OFFICE_INVENTORY',
  Lending_Audience: 'NOT_AVAILABLE_FOR_LENDING',
  Updated_At: '2026-07-28T00:00:00.000Z',
  ...overrides,
});

describe('Phase 17 production inventory import', () => {
  it('posts opening stock through an idempotent immutable ledger movement', async () => {
    const prepared = await prepare([item()]);
    const mapping = await readMapping();

    expect(prepared.result.status).toBe(0);
    expect(mapping.tabs['01_ITEM_MASTER'].fields.opening_quantity).toEqual({
      constant: 0,
      type: 'number',
    });
    expect(prepared.sql).toContain('INSERT INTO inventory_ledger');
    expect(prepared.sql).toContain("'OPENING_BALANCE'");
    expect(prepared.sql).toContain("'IMPORT:OPENING_BALANCE:ITM-PHASE17'");
    expect(prepared.sql).toContain('ON CONFLICT DO NOTHING;');
    expect(prepared.review).toMatchObject({ status: 'COMPLETE', ownerReviews: [] });
    expect(prepared.rejections.rejections).toEqual([]);
    expect(prepared.reconciliation).toContain('catalog_nonzero_opening_quantities');
    expect(prepared.reconciliation).toContain('opening_balance_quantity_difference');
  });

  it('quarantines every duplicate source identifier instead of overwriting', async () => {
    const prepared = await prepare([item(), item({ Item_Name: 'Conflicting duplicate' })]);

    expect(prepared.result.status).toBe(2);
    expect(prepared.rejections.rejections).toHaveLength(2);
    expect(prepared.rejections.rejections.every((entry) => entry.reasonCode === 'SOURCE_ID_DUPLICATE')).toBe(
      true,
    );
    expect(prepared.sql).not.toContain('INSERT INTO inventory_ledger');
  });

  it('does not stage a partial catalog insert for an invalid opening quantity', async () => {
    const prepared = await prepare([item({ Opening_Qty: -1 })]);

    expect(prepared.result.status).toBe(2);
    expect(prepared.rejections.rejections).toEqual([
      expect.objectContaining({ reasonCode: 'NEGATIVE_OPENING_QUANTITY' }),
    ]);
    expect(prepared.sql).not.toContain('INSERT INTO inventory_items');
    expect(prepared.sql).not.toContain('INSERT INTO inventory_ledger');
  });

  it('creates one private owner-review queue for unclassified inventory', async () => {
    const prepared = await prepare([item({ Handling: 'TO_CLASSIFY', Approval_Required: '✔' })]);

    expect(prepared.result.status).toBe(3);
    expect(prepared.rejections.rejections).toEqual([]);
    expect(prepared.review.status).toBe('OWNER_REVIEW_REQUIRED');
    expect(prepared.review.ownerReviews).toEqual([
      expect.objectContaining({
        sourceRecordId: 'ITM-PHASE17',
        reasonCode: 'INVENTORY_CLASSIFICATION_REQUIRED',
        requiredFields: expect.arrayContaining([
          'inventoryKind',
          'isLendable',
          'assetInstanceCountIfReusable',
        ]),
      }),
    ]);
    expect(prepared.sql).toContain('INSERT INTO inventory_ledger');
  });

  it('migrates existing opening metadata to one ledger row and prevents future direct stock', async () => {
    const migration = await readFile(resolve(root, 'migrations/0024_inventory_opening_ledger.sql'), 'utf8');

    expect(migration).toContain("'MIGRATION:OPENING_BALANCE:' || item.id");
    expect(migration).toContain('phase17_opening_balance_guard');
    expect(migration).toContain('SET opening_quantity = 0');
    expect(migration).toContain('inventory_items_opening_quantity_insert_guard');
    expect(migration).toContain('inventory_items_opening_quantity_update_guard');
    expect(migration).not.toContain('item.opening_quantity + COALESCE');
  });
});
