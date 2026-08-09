import { describe, expect, it } from 'vitest';
import { createSeedState } from '../../src/data/seed.js';
import {
  buildInventoryIndexes,
  availableToPromise,
  allocationBalance,
  qualityWarnings,
} from '../../src/domain/inventory.js';

describe('inventory ledger truth and available-to-promise', () => {
  it('reconciles opening, receipt, issue, loan, return, active and cleared reservations', () => {
    const state = createSeedState();
    state.ledgerTransactions.push(
      { id: 'T-A', itemId: 'ITM-0001', direction: 'OUT', quantity: 5, type: 'ISSUE' },
      { id: 'T-B', itemId: 'ITM-0001', direction: 'OUT', quantity: 2, type: 'LOAN_OUT' },
      { id: 'T-C', itemId: 'ITM-0001', direction: 'IN', quantity: 1, type: 'LOAN_RETURN' },
    );
    state.reservations.push(
      { id: 'R-A', itemId: 'ITM-0001', quantity: 7, status: 'ACTIVE' },
      { id: 'R-B', itemId: 'ITM-0001', quantity: 99, status: 'CLEARED' },
    );
    const indexes = buildInventoryIndexes(state);
    expect(indexes.onHand.get('ITM-0001')).toBe(94);
    expect(indexes.reserved.get('ITM-0001')).toBe(17);
    expect(availableToPromise('ITM-0001', indexes)).toBe(77);
  });

  it('preserves raw negative balance but clamps allocation only', () => {
    const state = createSeedState();
    state.ledgerTransactions.push({
      id: 'T-NEG',
      itemId: 'ITM-0002',
      direction: 'OUT',
      quantity: 20,
      type: 'ADJUSTMENT_OUT',
    });
    const indexes = buildInventoryIndexes(state);
    expect(availableToPromise('ITM-0002', indexes)).toBe(-16);
    expect(allocationBalance('ITM-0002', indexes)).toBe(0);
    expect(qualityWarnings(state, indexes)).toContainEqual(
      expect.objectContaining({ code: 'NEGATIVE_STOCK', entityId: 'ITM-0002', value: -16 }),
    );
  });

  it('detects duplicate transaction IDs', () => {
    const state = createSeedState();
    state.ledgerTransactions.push({ ...state.ledgerTransactions[0] });
    expect(qualityWarnings(state).some((warning) => warning.code === 'DUPLICATE_LEDGER_ID')).toBe(true);
  });

  it('uses explicit signed quantities for adjustments and reversals in fallback projections', () => {
    const state = createSeedState();
    state.inventoryItems.push({ id: 'ITM-SIGNED', name: 'Signed movement fixture' });
    state.ledgerTransactions.push(
      {
        id: 'T-SIGNED-IN',
        itemId: 'ITM-SIGNED',
        direction: 'IN',
        quantity: 10,
        signedQuantity: 10,
      },
      {
        id: 'T-SIGNED-OUT',
        itemId: 'ITM-SIGNED',
        direction: 'OUT',
        quantity: 3,
        signedQuantity: -3,
      },
      {
        id: 'T-SIGNED-ADJUST-UP',
        itemId: 'ITM-SIGNED',
        direction: 'ADJUSTMENT',
        quantity: 2,
        signedQuantity: 2,
      },
      {
        id: 'T-SIGNED-ADJUST-DOWN',
        itemId: 'ITM-SIGNED',
        direction: 'ADJUSTMENT',
        quantity: 1,
        signedQuantity: -1,
      },
      {
        id: 'T-SIGNED-REVERSAL',
        itemId: 'ITM-SIGNED',
        direction: 'REVERSAL',
        quantity: 3,
        signedQuantity: 3,
      },
    );

    expect(buildInventoryIndexes(state).onHand.get('ITM-SIGNED')).toBe(11);
  });
});
