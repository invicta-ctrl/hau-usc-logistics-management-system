import { describe, expect, it } from 'vitest';
import { inventoryItemFromBootstrap } from '../../src/frontend/app/inventory/inventoryData.ts';

describe('FI-05 inventory bootstrap projection', () => {
  it('preserves server-derived quantities and classifies presentation without computing stock', () => {
    const item = inventoryItemFromBootstrap({
      id: 'ITM-LOW',
      name: 'Authoritative microphone',
      category: 'Equipment',
      unit: 'piece',
      onHand: 12,
      reserved: 9,
      availableToPromise: 3,
      reorderThreshold: 6,
      lowStockState: 'LOW',
      isLendable: true,
      lendingStatus: 'ACTIVE',
      inventoryKind: 'REUSABLE',
      classificationStatus: 'CLASSIFIED',
      conditionReviewState: 'ASSESSED',
      maintenanceReviewState: 'CURRENT',
      updatedAt: '2026-08-24T00:00:00.000Z',
    });

    expect(item).toMatchObject({
      onHand: 12,
      reserved: 9,
      available: 3,
      threshold: 6,
      belowThreshold: true,
      outOfStock: false,
      lending: 'lendable',
      dataOrigin: 'REAL_BOOTSTRAP',
    });
  });

  it('keeps an unclassified or unavailable server record visibly guarded', () => {
    const item = inventoryItemFromBootstrap({
      id: 'ITM-GUARDED',
      name: 'Guarded item',
      category: 'Supplies',
      unit: 'piece',
      onHand: 0,
      reserved: 0,
      availableToPromise: 0,
      reorderThreshold: 1,
      lowStockState: 'LOW',
      isLendable: false,
      lendingStatus: 'DISABLED',
      inventoryKind: 'UNVERIFIED',
      classificationStatus: 'NEEDS_CLASSIFICATION',
      conditionReviewState: 'NOT_ASSESSED',
      maintenanceReviewState: 'NOT_ASSESSED',
      updatedAt: '2026-08-24T00:00:00.000Z',
    });

    expect(item).toMatchObject({ outOfStock: true, unconfirmed: true, lending: 'not-lendable' });
  });
});
