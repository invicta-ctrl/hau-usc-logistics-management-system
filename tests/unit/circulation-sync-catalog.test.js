import { describe, expect, it, vi } from 'vitest';
import {
  evaluateLendingEligibility,
  rankLendingItems,
  validateLendingSelection,
} from '../../src/domain/circulation-policy.js';
import {
  buildCatalogUpdateCommand,
  canManageCatalog,
} from '../../src/domain/catalog-management.js';
import {
  backoffDelayMs,
  createRevisionPoller,
  normalizeRevisionPayload,
  revisionChanged,
} from '../../src/app/revision-sync.js';
import { createMutationRequestTracker } from '../../src/services/legacy-runtime-adapter.js';

const items = [
  { id: 'ITM-0003', name: 'Extension Cord — 10 m', aliases: ['extension wire'], category: 'Equipment', stockArea: 'Inventory', catalogType: 'OFFICE_INVENTORY', handling: 'Loanable', unit: 'piece', status: 'ACTIVE', availableToPromise: 3, lendingAudience: 'USC_STAFF_ONLY', maximumLoanQuantity: 2 },
  { id: 'ITM-0001', name: 'Ballpen - Black', aliases: ['black pen', 'writing pen'], category: 'Office Supplies', stockArea: 'Inventory', catalogType: 'OFFICE_INVENTORY', handling: 'Consumable', unit: 'piece', status: 'ACTIVE', availableToPromise: 80, lendingAudience: 'STUDENTS_AND_STAFF', maximumLoanQuantity: 5 },
  { id: 'ITM-0005', name: 'Drinking Water', aliases: ['water bottle'], category: 'Pantry', stockArea: 'Pantry', handling: 'Consumable', unit: 'bottle', status: 'ACTIVE', availableToPromise: 0, lendingAudience: 'STUDENTS_AND_STAFF' },
];

describe('predictive lending policy', () => {
  it('ranks exact IDs/names, aliases, prefixes, tokens, and substrings in order', () => {
    expect(rankLendingItems(items, 'ITM-0003')[0].id).toBe('ITM-0003');
    expect(rankLendingItems(items, 'extension wire')[0].id).toBe('ITM-0003');
    expect(rankLendingItems(items, 'ball')[0].id).toBe('ITM-0001');
    expect(rankLendingItems(items, 'office black')[0].id).toBe('ITM-0001');
    expect(rankLendingItems(items, 'water')[0].id).toBe('ITM-0005');
  });

  it('distinguishes out-of-stock, verification, non-circulating, and staff-only states', () => {
    expect(evaluateLendingEligibility(items[2], { borrowerType: 'ANGELITE', quantity: 1 })).toMatchObject({ selectable: false, state: 'out-of-stock' });
    expect(evaluateLendingEligibility({ ...items[0], status: 'VERIFY' }, { borrowerType: 'USC_STAFF', quantity: 1 })).toMatchObject({ selectable: false, state: 'verify' });
    expect(evaluateLendingEligibility({ ...items[0], handling: 'NON_CIRCULATING' }, { borrowerType: 'USC_STAFF', quantity: 1 })).toMatchObject({ selectable: false, state: 'not-circulating' });
    expect(evaluateLendingEligibility(items[0], { borrowerType: 'ANGELITE', quantity: 1 })).toMatchObject({ selectable: false, state: 'staff-only' });
  });

  it('allows both borrower groups only for STUDENTS_AND_STAFF and enforces maximum quantity', () => {
    expect(evaluateLendingEligibility(items[1], { borrowerType: 'ANGELITE', quantity: 1 })).toMatchObject({ selectable: true, validForSubmit: true });
    expect(evaluateLendingEligibility(items[1], { borrowerType: 'USC_STAFF', quantity: 1 })).toMatchObject({ selectable: true, validForSubmit: true });
    expect(evaluateLendingEligibility(items[0], { borrowerType: 'USC_STAFF', quantity: 3 })).toMatchObject({ selectable: true, validForSubmit: false, state: 'quantity-restricted' });
  });

  it('rejects free text and requires future due dates only for returnable handling', () => {
    expect(validateLendingSelection(null, {})).toMatchObject({ valid: false, code: 'ITEM_NOT_SELECTED' });
    expect(validateLendingSelection(items[0], { borrowerType: 'USC_STAFF', quantity: 1 })).toMatchObject({ valid: false, code: 'DUE_DATE_REQUIRED' });
    expect(validateLendingSelection(items[0], { borrowerType: 'USC_STAFF', quantity: 1, dueAt: '2020-01-01', now: '2026-01-01' })).toMatchObject({ valid: false, code: 'INVALID_DUE_DATE' });
    expect(validateLendingSelection(items[1], { borrowerType: 'ANGELITE', quantity: 1 })).toMatchObject({ valid: true });
  });
});

describe('catalog client boundary', () => {
  it('honors permission fallback without granting ordinary staff access', () => {
    expect(canManageCatalog({ role: 'ADMIN', permissions: {} })).toBe(true);
    expect(canManageCatalog({ role: 'DOL_DIRECTOR' })).toBe(true);
    expect(canManageCatalog({ role: 'DOL_STAFF', permissions: { manageCatalog: true } })).toBe(true);
    expect(canManageCatalog({ role: 'DOL_STAFF', permissions: {} })).toBe(false);
  });

  it('whitelists catalog fields and excludes quantities, IDs, and provenance', () => {
    const command = buildCatalogUpdateCommand('ITM-1', {
      itemName: 'Paper', aliases: 'copy, a4', unit: 'ream', reorderThreshold: '2',
      openingOnHand: 100, availableToPromise: 90, legacy: { row: 3 }, Item_ID: 'BAD',
    });
    expect(command).toMatchObject({ itemId: 'ITM-1', itemName: 'Paper', aliases: ['copy', 'a4'], unit: 'ream', reorderThreshold: 2 });
    for (const field of ['openingOnHand', 'availableToPromise', 'legacy', 'Item_ID']) {
      expect(command).not.toHaveProperty(field);
    }
  });
});

describe('revision polling controller', () => {
  it('normalizes revisions and uses bounded exponential backoff', () => {
    expect(normalizeRevisionPayload({ revision: '4', updatedAt: 'now' })).toMatchObject({ revision: 4, updatedAt: 'now' });
    expect(revisionChanged({ revision: 3 }, { revision: 4 })).toBe(true);
    expect(revisionChanged({ revision: 4 }, { revision: 4 })).toBe(false);
    expect([backoffDelayMs(0), backoffDelayMs(1), backoffDelayMs(2), backoffDelayMs(8)]).toEqual([5000, 10000, 20000, 30000]);
  });

  it('prevents overlapping calls and pauses while hidden or offline', async () => {
    let visible = true;
    let online = true;
    let resolveRead;
    const readRevision = vi.fn(() => new Promise((resolve) => { resolveRead = resolve; }));
    const statuses = [];
    const poller = createRevisionPoller({
      readRevision,
      onRevision: vi.fn(),
      onStatus: (status) => statuses.push(status),
      isVisible: () => visible,
      isOnline: () => online,
      schedule: () => 1,
      cancel: () => {},
    });
    poller.start();
    const first = poller.check('focus');
    expect(poller.inFlight).toBe(true);
    await expect(poller.check('online')).resolves.toBe(false);
    expect(readRevision).toHaveBeenCalledTimes(1);
    resolveRead({ revision: 2 });
    await expect(first).resolves.toBe(true);
    visible = false;
    await expect(poller.check('hidden')).resolves.toBe(false);
    online = false;
    visible = true;
    await expect(poller.check('offline')).resolves.toBe(false);
    expect(statuses).toContain('checking');
  });

  it('backs off and reports delayed status after errors', async () => {
    let scheduledDelay;
    const statuses = [];
    const poller = createRevisionPoller({
      readRevision: vi.fn().mockRejectedValue(new Error('network')),
      onRevision: vi.fn(),
      onStatus: (status) => statuses.push(status),
      schedule: (_callback, delay) => { scheduledDelay = delay; return 1; },
      cancel: () => {},
    });
    poller.start();
    await expect(poller.check('poll')).resolves.toBe(false);
    expect(statuses).toContain('delayed');
    expect(scheduledDelay).toBe(5000);
  });
});

describe('mutation request tracking', () => {
  it('reuses one id after an ambiguous retryable failure and rotates it after success', async () => {
    let sequence = 0;
    const tracker = createMutationRequestTracker({ createId: (prefix) => `${prefix}-${++sequence}` });
    const observed = [];
    const payload = { itemId: 'ITM-1', quantity: 1 };

    await expect(tracker.run('lending', payload, async (command) => {
      observed.push(command.clientRequestId);
      throw Object.assign(new Error('response lost'), { retryable: true });
    })).rejects.toThrow('response lost');

    await expect(tracker.run('lending', { quantity: 1, itemId: 'ITM-1' }, async (command) => {
      observed.push(command.clientRequestId);
      return { ticketId: 'LND-1' };
    })).resolves.toMatchObject({ ticketId: 'LND-1' });

    await tracker.run('lending', payload, async (command) => {
      observed.push(command.clientRequestId);
      return { ticketId: 'LND-2' };
    });
    expect(observed).toEqual(['lending-1', 'lending-1', 'lending-2']);
  });
});
