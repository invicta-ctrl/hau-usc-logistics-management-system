import { describe, expect, it } from 'vitest';
import { can, permissionsFor } from '../../src/domain/permissions.js';
import { createSeedState } from '../../src/data/seed.js';
import { migrateState } from '../../src/app/migrations.js';
import { createSelectors } from '../../src/app/selectors.js';

describe('permissions and sanitized requester payload', () => {
  it('centralizes role decisions', () => {
    expect(can('REQUESTER', 'release')).toBe(false);
    expect(can('DOL_STAFF', 'release')).toBe(true);
    expect(can('COMMITTEE_HEAD', 'merge_event_item')).toBe(true);
    expect(permissionsFor('ADMINISTRATOR').diagnostics).toBe(true);
  });
  it('excludes internal collections from requester bootstrap', () => {
    const safe = createSelectors().sanitizedBootstrap(createSeedState());
    expect(safe).toHaveProperty('events');
    expect(safe).toHaveProperty('catalogSuggestions');
    expect(safe).not.toHaveProperty('ledgerTransactions');
    expect(safe).not.toHaveProperty('suppliers');
    expect(safe).not.toHaveProperty('lendingTickets');
    expect(safe).not.toHaveProperty('auditLog');
  });
});

describe('preview state migrations', () => {
  it('converts legacy opening quantities into explicit ledger rows', () => {
    const result = migrateState({
      schemaVersion: 1,
      inventoryItems: [{ id: 'ITM-X', openingOnHand: 5 }],
      ledgerTransactions: [],
      requests: [],
      requestLines: [],
      reservations: [],
      lendingTickets: [],
      restockRequests: [],
      deliverables: [],
      suppliers: [],
      quotes: [],
      auditLog: [],
    });
    expect(result.state.schemaVersion).toBe(3);
    expect(result.state.inventoryItems[0]).not.toHaveProperty('openingOnHand');
    expect(result.state.ledgerTransactions).toContainEqual(
      expect.objectContaining({ itemId: 'ITM-X', type: 'OPENING_BALANCE', quantity: 5 }),
    );
  });
});
