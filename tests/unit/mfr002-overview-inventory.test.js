import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { buildInventoryBootstrapPath } from '../../src/frontend/integration/backend.ts';
import { inventoryItemsFromBootstrap } from '../../src/frontend/app/inventory/inventoryData.ts';
import { projectOverview } from '../../src/frontend/app/overview/overviewData.ts';

const root = resolve(import.meta.dirname, '../..');
const readSource = (path) => readFileSync(resolve(root, path), 'utf8');

function inventoryItem(index) {
  return {
    id: `ITM-${String(index).padStart(4, '0')}`,
    name: `Operational item ${index}`,
    category: index % 2 ? 'Equipment' : 'Supplies',
    unit: 'piece',
    onHand: 12,
    reserved: 3,
    availableToPromise: 9,
    reorderThreshold: 4,
    lowStockState: 'NORMAL',
    isLendable: index % 2 === 1,
    lendingStatus: index % 2 === 1 ? 'ACTIVE' : 'NOT_LENDABLE',
    inventoryKind: index % 2 === 1 ? 'REUSABLE' : 'CONSUMABLE',
    classificationStatus: 'CLASSIFIED',
    conditionReviewState: 'ASSESSED',
    maintenanceReviewState: 'CURRENT',
    updatedAt: '2026-08-31T08:00:00.000Z',
    classificationHistory: [],
  };
}

describe('MFR-002 U05 Overview and Inventory transformation', () => {
  it('derives attention, ready, blocked, and changed lanes only from returned records', () => {
    const projection = projectOverview({
      requests: [
        {
          id: 'REQ-ATTN',
          purpose: 'Review event materials',
          department: 'DOL',
          priority: 'URGENT',
          status: 'FOR_REVIEW',
          updatedAt: '2026-08-31T07:00:00.000Z',
        },
        {
          id: 'REQ-BLOCKED',
          purpose: 'Confirm incomplete request',
          status: 'NEEDS_INFORMATION',
          updatedAt: '2026-08-31T06:00:00.000Z',
        },
      ],
      requestLines: [
        {
          id: 'LINE-READY',
          requestId: 'REQ-READY',
          description: 'Folding chairs',
          quantity: 20,
          unit: 'piece',
          status: 'READY_TO_RELEASE',
          updatedAt: '2026-08-31T05:00:00.000Z',
        },
      ],
      inventoryItems: [
        {
          id: 'ITM-OUT',
          name: 'Wireless microphone',
          availableToPromise: 0,
          lowStockState: 'LOW',
          classificationStatus: 'CLASSIFIED',
          updatedAt: '2026-08-31T04:00:00.000Z',
        },
      ],
      events: [],
      lendingTickets: [],
      restockRequests: [],
      deliverables: [],
    });

    expect(projection.attention.map((entry) => entry.key)).toEqual(
      expect.arrayContaining(['request:REQ-ATTN', 'request:REQ-BLOCKED', 'inventory:ITM-OUT']),
    );
    expect(projection.ready).toContainEqual(
      expect.objectContaining({ key: 'request-line:LINE-READY', route: 'release' }),
    );
    expect(projection.blocked.map((entry) => entry.key)).toEqual(
      expect.arrayContaining(['request:REQ-BLOCKED', 'inventory:ITM-OUT']),
    );
    expect(projection.changed[0]).toMatchObject({ key: 'request:REQ-ATTN' });
    expect(projection.sourceRecordCount).toBe(4);
  });

  it('builds a bounded, encoded server search/filter URL', () => {
    expect(
      buildInventoryBootstrapPath({
        page: 3,
        pageSize: 25,
        query: 'chair & table',
        filter: 'BELOW',
      }),
    ).toBe('/api/bootstrap/inventory?page=3&pageSize=25&query=chair+%26+table&filter=BELOW');
    expect(buildInventoryBootstrapPath({ pageSize: 500 })).toBe(
      '/api/bootstrap/inventory?page=1&pageSize=50',
    );
  });

  it('joins only page-scoped history and keeps all three server balances unchanged', () => {
    const result = inventoryItemsFromBootstrap({
      inventoryItems: [inventoryItem(1)],
      ledgerTransactions: [
        {
          id: 'TXN-1',
          type: 'ISSUE',
          direction: 'OUT',
          itemId: 'ITM-0001',
          quantity: 2,
          signedQuantity: -2,
          unit: 'piece',
          relatedEntityType: 'REQUEST',
          relatedId: 'REQ-1',
          status: 'POSTED',
          notes: '',
          createdAt: '2026-08-31T08:00:00.000Z',
        },
      ],
      reservations: [
        {
          id: 'RSV-1',
          itemId: 'ITM-0001',
          quantity: 3,
          unit: 'piece',
          requestLineId: 'LINE-1',
          lendingTicketId: '',
          status: 'ACTIVE',
          clearedAt: '',
          clearReason: '',
          createdAt: '2026-08-31T07:00:00.000Z',
          updatedAt: '2026-08-31T07:00:00.000Z',
        },
      ],
      inventoryAssets: [],
      assetMaintenanceHistory: [],
      assetMovementHistory: [],
      pagination: { page: 1, pageSize: 25, total: 1, hasMore: false },
      scopeRevision: { token: '1', updatedAt: '2026-08-31T08:00:00.000Z' },
    });

    expect(result[0]).toMatchObject({ onHand: 12, reserved: 3, available: 9 });
    expect(result[0].recentLedger).toHaveLength(1);
    expect(result[0].reservations).toHaveLength(1);
  });

  it('keeps Inventory query paging and related-history bounds at the service boundary', () => {
    const service = readSource('src/server/d1/operational-service.js');
    const branch = service.slice(
      service.indexOf("} else if (module === 'inventory')"),
      service.indexOf("} else if (module === 'lending')"),
    );
    expect(service).toMatch(
      /module === 'inventory' \|\| module === 'procurement'[\s\S]*?\? \[\][\s\S]*?: await rows\(db, itemSql/u,
    );
    expect(branch).toContain('LIMIT ?${inventoryLimitIndex} OFFSET ?${inventoryLimitIndex + 1}');
    expect(branch).toContain('const relatedLimit = Math.min(100, Math.max(4, page.pageSize * 4))');
    for (const table of ['inventory_classification_history', 'inventory_ledger', 'reservations']) {
      expect(branch).toMatch(new RegExp(`FROM ${table}[\\s\\S]*?WHERE .*item_id IN`, 'u'));
    }
    expect(branch).not.toMatch(/FROM inventory_ledger[\s\S]*?LIMIT 500/u);
  });

  it('uses a modal focus trap only on mobile and a persistent complementary inspector on desktop', () => {
    const inspector = readSource('src/frontend/app/inventory/InventoryInspector.tsx');
    const route = readSource('src/frontend/app/inventory/InventoryRoute.tsx');
    expect(inspector).toMatch(/useDialogFocusTrap\(\{[\s\S]*?open: isMobile/u);
    expect(inspector).toContain("inertSelector: isMobile ? '[data-inventory-modal-background]'");
    expect(inspector).toContain("role={isMobile ? 'dialog' : 'complementary'}");
    expect(inspector).toContain('Stock balances are read-only here.');
    expect(route).toContain("window.matchMedia('(max-width: 59.99rem)')");
    expect(route).toContain('window.setTimeout(() =>');
    expect(route).toContain('pageSize: PAGE_SIZE, query, filter');
  });

  it('projects a realistic 399-record baseline within the route-ready interaction budget', () => {
    const inventoryItems = Array.from({ length: 399 }, (_, index) => inventoryItem(index + 1));
    const bootstrap = {
      inventoryItems,
      ledgerTransactions: [],
      reservations: [],
      inventoryAssets: [],
      assetMaintenanceHistory: [],
      assetMovementHistory: [],
      pagination: { page: 1, pageSize: 25, total: 399, hasMore: true },
      scopeRevision: { token: 'baseline', updatedAt: '2026-08-31T08:00:00.000Z' },
    };
    const startedAt = performance.now();
    const projected = inventoryItemsFromBootstrap(bootstrap);
    const elapsedMs = performance.now() - startedAt;

    expect(projected).toHaveLength(399);
    // Deliberately generous for shared CI: this guards accidental quadratic joins,
    // while the real route asks the server for only 25 of these records at once.
    expect(elapsedMs).toBeLessThan(250);
  });
});
