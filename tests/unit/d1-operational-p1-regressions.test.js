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

  it('short-circuits an explicit DENY scope before any committee comparison', () => {
    // RV-01.3: scopeMode and committeeIds are independent fields, so a revoked
    // account can still carry committee grants. Without an explicit DENY branch
    // these helpers fall through to the committee logic and hand a denied actor
    // committee-scoped read and command access.
    const scoped = between('function scopedWhere', 'function multiScopeWhere');
    const multi = between('function multiScopeWhere', 'const operationalAuditContexts');
    const assertScope = between('function assertEntityScope', 'function ownerCommitteeId');

    for (const [name, body] of [
      ['scopedWhere', scoped],
      ['multiScopeWhere', multi],
    ]) {
      expect(body, name).toContain("scope.mode === 'DENY'");
      // The DENY branch must precede the ALL branch and the committee fallback.
      expect(body.indexOf("scope.mode === 'DENY'"), name).toBeLessThan(
        body.indexOf("scope.mode === 'ALL'"),
      );
      expect(body, name).toMatch(/scope\.mode === 'DENY'\)[\s\S]{0,80}sql: '1 = 0'/u);
    }

    expect(assertScope).toContain("scope.mode === 'DENY'");
    expect(assertScope.indexOf("scope.mode === 'DENY'")).toBeLessThan(
      assertScope.indexOf("scope.mode === 'ALL'"),
    );
    expect(assertScope).toMatch(/scope\.mode === 'DENY'\)[\s\S]{0,160}OUT_OF_SCOPE/u);
  });

  it('routes request review through the in-batch atomic guard, not a post-batch check', () => {
    const review = between('async function reviewRequest', 'async function confirmRelease');

    // RV-01.6: D1 runs every batch statement before returning results, so a
    // post-batch changes() check cannot stop the deliverable/restock inserts
    // from committing when a concurrent reviewer already moved the request.
    expect(review).toContain('runAtomicRevisionGuardedBatch(db');
    expect(review).toContain("conflictCode: 'REQUEST_STATE_CONFLICT'");
    expect(review).not.toContain('outcomes[0]?.meta?.changes');
    expect(review).not.toMatch(/const outcomes = await db\.batch\(/u);
    // The parent transition must be the guarded statement.
    expect(review).toMatch(/guardedStatement[\s\S]*?UPDATE requests SET status/u);
  });

  it('refuses a whole-request reject once some lines are already routed', () => {
    const review = between('async function reviewRequest', 'async function confirmRelease');

    // RV-01.6: a mixed review can leave the parent NEEDS_INFORMATION with lines
    // already owning a Deliverables/Restocking item. A later whole-request
    // REJECT would strand those active owners under a rejected parent.
    expect(review).toContain('REQUEST_ALREADY_ROUTED');
    // The probe counts only lines that own a live downstream item, so a merely
    // REJECTED line does not make the parent permanently un-rejectable.
    expect(review).toMatch(/status IN \('FOR_CANVASSING', 'READY_TO_RESERVE'\)/u);
    // The guard must key off the DERIVED outcome as well as the submitted
    // decision: an ACCEPT whose remaining decisions are all REJECT derives a
    // REJECTED parent and strands routed lines exactly like a whole-request
    // REJECT would.
    expect(review).toMatch(/derivedStatus === 'REJECTED'\) rejectStrandsRoutes\(\)/u);
    expect(review).toMatch(/nextStatus !== 'ACCEPTED'\) rejectStrandsRoutes\(\)/u);
  });

  it('binds the fallback review idempotency key to the normalized line decisions', () => {
    const review = between('async function reviewRequest', 'async function confirmRelease');

    // RV-01.6: without this, two different decision sets for the same request
    // collide on one key and the second legitimate review is locked out by a
    // permanent IDEMPOTENCY_CONFLICT. Sorting makes order insignificant.
    expect(review).toContain('normalizedLineDecisions');
    expect(review).toMatch(/normalizedLineDecisions[\s\S]*?\.sort\(\)/u);
    expect(review).toMatch(/command\.clientRequestId \?\?[\s\S]*?fingerprint\(normalizedLineDecisions\)/u);
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
