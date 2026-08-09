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
      expect(body.indexOf("scope.mode === 'DENY'"), name).toBeLessThan(body.indexOf("scope.mode === 'ALL'"));
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
    // The parent transition must be the guarded statement, and it must be a
    // compare-and-swap against the snapshot that was read. A membership test
    // lets two reviewers holding different decision sets both commit, because
    // NEEDS_INFORMATION is both an accepted from-state and a producible state.
    expect(review).toMatch(/guardedStatement[\s\S]*?UPDATE requests SET status/u);
    expect(review).toMatch(/WHERE id = \?1 AND status = \?4 AND updated_at = \?5/u);
    expect(review).toMatch(
      /\.bind\(requestId, derivedStatus, timestamp, current\.status, current\.updated_at\)/u,
    );
  });

  it('atomically refuses a release after cancellation or another release changes its snapshot', () => {
    const release = between('async function confirmRelease', 'async function correctRelease');

    expect(release).toContain('runAtomicRevisionGuardedBatch(db');
    expect(release).toContain("conflictCode: 'RELEASE_STATE_CONFLICT'");
    expect(release).toContain("guarded_line.status IN ('READY_TO_RELEASE', 'PARTIALLY_RELEASED')");
    expect(release).toContain('guarded_line.released_quantity =');
    expect(release).toContain("reservation.status = 'ACTIVE'");
    expect(release).toMatch(/guardedReleaseStatement[\s\S]*?dependentStatements: statements/u);
    expect(release).not.toContain('await db.batch(statements)');
  });

  it('atomically refuses a correction after another correction changes its release-line snapshot', () => {
    const correction = between('async function correctRelease', 'async function receiveEntity');

    expect(correction).toContain('runAtomicRevisionGuardedBatch(db');
    expect(correction).toContain("conflictCode: 'CORRECTION_STATE_CONFLICT'");
    expect(correction).toContain('guardedCorrectionStatement');
    expect(correction).toContain('AND released_quantity = ?5');
    expect(correction).toContain('AND updated_at = ?9');
    expect(correction).toMatch(/guardedCorrectionStatement[\s\S]*?dependentStatements: statements/u);
    expect(correction).not.toContain('outcomes[3]?.meta?.changes');
    expect(correction).not.toContain('await db.batch(statements)');
  });

  it('atomically refuses a lending handoff after borrower cancellation changes its snapshot', () => {
    const handoff = between('async function confirmLendingHandoff', 'async function confirmReturn');

    expect(handoff).toContain('runAtomicRevisionGuardedBatch(db');
    expect(handoff).toContain("conflictCode: 'LENDING_HANDOFF_STATE_CONFLICT'");
    expect(handoff).toContain("status = 'READY_TO_CLAIM'");
    expect(handoff).toContain("reservation.status = 'ACTIVE'");
    expect(handoff).toContain("asset.lifecycle_status = 'RESERVED'");
    expect(handoff).toMatch(/guardedHandoffStatement[\s\S]*?dependentStatements: handoffStatements/u);
    const cancellation = between(
      'async function cancelBorrowerLendingRequest',
      'async function registerInventoryAsset',
    );
    expect(cancellation).toContain('SET released_at = ?3, returned_at = ?3');
  });

  it('atomically refuses stale lending review and asset maintenance snapshots', () => {
    const maintenance = between(
      'async function recordAssetMaintenance',
      'async function approveLendingTicket',
    );
    const approval = between('async function approveLendingTicket', 'async function confirmLendingHandoff');

    expect(maintenance).toContain('runAtomicRevisionGuardedBatch(db');
    expect(maintenance).toContain("conflictCode: 'ASSET_MAINTENANCE_STATE_CONFLICT'");
    expect(maintenance).toContain('AND current_lending_ticket_id IS NULL');
    expect(maintenance).toContain('AND updated_at = ?7');

    expect(approval.match(/runAtomicRevisionGuardedBatch\(db/gu)).toHaveLength(2);
    expect(approval).toContain('beforeGuardStatements');
    expect(approval).toContain('guardedApprovalStatement');
    expect(approval).toContain("conflictCode: 'LENDING_STATE_CONFLICT'");
    expect(approval).toContain('AND updated_at = ?13');
    expect(approval).toContain("item.classification_status = 'CLASSIFIED'");
    expect(approval).toContain("item.lending_status = 'ACTIVE'");
    expect(approval).toContain("item.lending_audience <> 'USC_STAFF_ONLY'");
    expect(approval).not.toContain('await db.batch(statements)');
  });

  it('atomically refuses receiving against cancelled or concurrently changed procurement records', () => {
    const receiving = between('async function receiveEntity', 'const catalogItemSnapshot');

    expect(receiving).toContain('runAtomicRevisionGuardedBatch(db');
    expect(receiving).toContain('guardedReceivingStatement');
    expect(receiving).toContain("status IN ('TO_BE_PROCURED', 'PROCURED', 'PARTIALLY_RECEIVED')");
    expect(receiving).toContain("status IN ('PROCURED', 'PARTIALLY_RECEIVED')");
    expect(receiving).toContain('quantity_received = ?6');
    expect(receiving).toContain('received_quantity = ?6');
    expect(receiving).toContain("throw new ApiError('UNIT_MISMATCH'");
    expect(receiving).not.toContain('await db.batch(statements)');
  });

  it('requires every direct stock reservation to belong to one accepted routed request line', () => {
    const reservation = between('async function reserveStock', 'async function createLendingTicket');

    expect(reservation).toContain("requiredText(command.requestLineId, 'requestLineId', 80)");
    expect(reservation).not.toContain("entityScope(account).mode !== 'ALL'");
    expect(reservation).toContain('runAtomicRevisionGuardedBatch(db');
  });

  it('refuses a whole-request reject once some lines are already routed', () => {
    const review = between('async function reviewRequest', 'async function confirmRelease');

    // RV-01.6: a mixed review can leave the parent NEEDS_INFORMATION with lines
    // already owning a Deliverables/Restocking item. A later whole-request
    // REJECT would strand those active owners under a rejected parent.
    expect(review).toContain('REQUEST_ALREADY_ROUTED');
    // The probe must test the owner tables, not line statuses. transitionDeliverable
    // and transitionRestock advance request_lines.status in lockstep with their
    // downstream item, so any status-literal test stops matching once procurement
    // moves the item on, and a reject would strand a live owner through to
    // physical release.
    expect(review).toMatch(/FROM deliverables[\s\S]*?NOT IN \('CANCELLED', 'COMPLETED'\)/u);
    expect(review).toMatch(/FROM restock_requests[\s\S]*?source_request_id/u);
    expect(review).toMatch(/FROM reservations[\s\S]*?status = 'ACTIVE'/u);
    expect(review).not.toMatch(
      /COUNT\(\*\) AS count FROM request_lines\s+WHERE request_id = \?1 AND status/u,
    );
    // A reject must close stock-ready lines on EVERY reject path, including a
    // derived-REJECTED accept, or stock stays reservable under a rejected parent.
    expect(review).toMatch(/sweepStockReadyOnReject/u);
    expect(review).toMatch(/derivedStatus !== 'REJECTED'\) return/u);
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
    // The key must cover every field the replay fingerprint compares, or a
    // second missing-information notice differing only by note locks out.
    expect(review).toMatch(/command\.clientRequestId \?\?[\s\S]*?fingerprint\(/u);
    expect(review).toMatch(/normalizedLineDecisions\}\|\$\{optionalText\(command\.note, 500\)/u);
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
