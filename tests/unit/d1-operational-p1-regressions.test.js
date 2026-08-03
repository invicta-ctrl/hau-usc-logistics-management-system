import { readFileSync } from 'node:fs';
import { Miniflare } from 'miniflare';
import { afterEach, describe, expect, it } from 'vitest';
import { runAtomicRevisionGuardedBatch } from '../../src/server/d1/operational-service.js';

const operationalSource = readFileSync(
  new URL('../../src/server/d1/operational-service.js', import.meta.url),
  'utf8',
);

const between = (start, end) => {
  const startIndex = operationalSource.indexOf(start);
  const endIndex = operationalSource.indexOf(end, startIndex);
  expect(startIndex).toBeGreaterThanOrEqual(0);
  expect(endIndex).toBeGreaterThan(startIndex);
  return operationalSource.slice(startIndex, endIndex);
};

let miniflare;

afterEach(async () => {
  await miniflare?.dispose();
  miniflare = null;
});

async function atomicGuardContext() {
  miniflare = new Miniflare({
    modules: true,
    script: 'export default { fetch() { return new Response("ok"); } }',
    d1Databases: ['DB'],
  });
  const db = await miniflare.getD1Database('DB');
  for (const statement of [
    `CREATE TABLE data_revisions (
      scope TEXT PRIMARY KEY,
      revision INTEGER NOT NULL CHECK (revision >= 0),
      updated_at TEXT NOT NULL
    ) STRICT`,
    "INSERT INTO data_revisions VALUES ('global', 0, '2026-08-03T00:00:00.000Z')",
    `CREATE TABLE optimistic_targets (
      id TEXT PRIMARY KEY,
      revision INTEGER NOT NULL,
      value TEXT NOT NULL
    ) STRICT`,
    "INSERT INTO optimistic_targets VALUES ('TARGET-1', 2, 'before')",
    'CREATE TABLE provenance (id TEXT PRIMARY KEY) STRICT',
    'CREATE TABLE history (id TEXT PRIMARY KEY) STRICT',
    'CREATE TABLE audit (id TEXT PRIMARY KEY) STRICT',
    'CREATE TABLE idempotency (id TEXT PRIMARY KEY) STRICT',
  ])
    await db.prepare(statement).run();
  return db;
}

async function tableCount(db, table) {
  const row = await db.prepare(`SELECT COUNT(*) AS total FROM ${table}`).first();
  return Number(row.total);
}

describe('D1 operational P1 invariants', () => {
  for (const [name, conflictCode] of [
    ['canvass', 'REVISION_CONFLICT'],
    ['catalog', 'CATALOG_REVISION_CONFLICT'],
  ]) {
    it(`atomically rolls back ${name} dependent writes after a zero-row revision guard`, async () => {
      const db = await atomicGuardContext();

      await expect(
        runAtomicRevisionGuardedBatch(db, {
          beforeGuardStatements: [db.prepare("INSERT INTO provenance VALUES ('PROV-1')")],
          guardedStatement: db
            .prepare('UPDATE optimistic_targets SET value = ?1 WHERE id = ?2 AND revision = ?3')
            .bind('after', 'TARGET-1', 1),
          dependentStatements: [
            db.prepare("INSERT INTO history VALUES ('HIS-1')"),
            db.prepare("INSERT INTO audit VALUES ('AUD-1')"),
            db.prepare("INSERT INTO idempotency VALUES ('IDM-1')"),
          ],
          conflictCode,
          conflictMessage: 'The record changed before the update could be applied.',
        }),
      ).rejects.toMatchObject({ code: conflictCode, status: 409 });

      await expect(
        db.prepare('SELECT value FROM optimistic_targets WHERE id = ?1').bind('TARGET-1').first(),
      ).resolves.toEqual({ value: 'before' });
      await expect(
        Promise.all(['provenance', 'history', 'audit', 'idempotency'].map((table) => tableCount(db, table))),
      ).resolves.toEqual([0, 0, 0, 0]);
      await expect(
        db.prepare("SELECT updated_at FROM data_revisions WHERE scope = 'global'").first(),
      ).resolves.toEqual({ updated_at: '2026-08-03T00:00:00.000Z' });
    });
  }

  it('uses the atomic revision guard for both affected optimistic updates', () => {
    const canvass = between(
      'async function updateCanvassReference',
      'async function archiveCanvassReference',
    );
    const catalog = between(
      'async function updateInventoryItem',
      'async function updateInventoryStorageContext',
    );

    expect(canvass).toContain('runAtomicRevisionGuardedBatch(db');
    expect(canvass).toContain("conflictCode: 'REVISION_CONFLICT'");
    expect(catalog).toContain('runAtomicRevisionGuardedBatch(db');
    expect(catalog).toContain("conflictCode: 'CATALOG_REVISION_CONFLICT'");
  });

  it('replaces the preferred canvass with one set-based active-group update', () => {
    const method = between('async function selectPreferredCanvass', 'async function transitionDeliverable');

    expect(method).toContain('SET preferred = CASE WHEN id = ?1 THEN 1 ELSE 0 END');
    expect(method).toContain("WHERE status = 'ACTIVE' AND (");
    expect(method).not.toContain('UPDATE canvass_references SET preferred = ?1');
    expect(method).toContain('groupDecision');
    expect(method).toContain('historyStatement(db');
    expect(method).toContain('auditStatement(db');
  });

  it('bounds every growing Inventory history projection to the contract maximum', () => {
    const branch = between("} else if (module === 'inventory')", "} else if (module === 'lending')");
    const catalogQuery = branch.slice(0, branch.indexOf('const classificationHistoryRows'));

    expect(branch).toMatch(
      /FROM inventory_classification_history[\s\S]*?ORDER BY history\.occurred_at DESC, history\.id DESC\s+LIMIT 500/u,
    );
    expect(branch).toMatch(/FROM inventory_ledger[\s\S]*?ORDER BY created_at DESC, id DESC\s+LIMIT 500/u);
    expect(branch).toMatch(/FROM reservations[\s\S]*?ORDER BY created_at DESC, id DESC\s+LIMIT 500/u);
    expect(catalogQuery).toContain('FROM inventory_items item');
    expect(catalogQuery).not.toContain('LIMIT 500');
  });
});
