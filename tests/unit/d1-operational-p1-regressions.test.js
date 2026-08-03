import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

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

describe('D1 operational P1 invariants', () => {
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
