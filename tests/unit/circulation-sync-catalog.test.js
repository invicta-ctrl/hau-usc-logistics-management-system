import { describe, expect, it, vi } from 'vitest';
import {
  evaluateLendingEligibility,
  rankLendingItems,
  validateLendingSelection,
} from '../../src/domain/circulation-policy.js';
import {
  BORROWER_IDENTITY_SOURCES,
  borrowerIdentityRequirement,
  studentIdInputValue,
  validateBorrowerIdentityApproval,
  validateStudentIdNumber,
} from '../../src/domain/borrower-identity.js';
import { buildCatalogUpdateCommand, canManageCatalog } from '../../src/domain/catalog-management.js';
import {
  backoffDelayMs,
  createRevisionPoller,
  jitterDelayMs,
  modelNearLiveLoad,
  normalizeRevisionPayload,
  normalizeScopedRevisionPayload,
  revisionChanged,
} from '../../src/app/revision-sync.js';
import { createMutationRequestTracker } from '../../src/services/legacy-runtime-adapter.js';

const items = [
  {
    id: 'ITM-0003',
    name: 'Extension Cord — 10 m',
    aliases: ['extension wire'],
    category: 'Equipment',
    stockArea: 'Inventory',
    catalogType: 'OFFICE_INVENTORY',
    handling: 'Loanable',
    unit: 'piece',
    status: 'ACTIVE',
    availableToPromise: 3,
    lendingAudience: 'USC_STAFF_ONLY',
    maximumLoanQuantity: 2,
  },
  {
    id: 'ITM-0001',
    name: 'Ballpen - Black',
    aliases: ['black pen', 'writing pen'],
    category: 'Office Supplies',
    stockArea: 'Inventory',
    catalogType: 'OFFICE_INVENTORY',
    handling: 'Consumable',
    unit: 'piece',
    status: 'ACTIVE',
    availableToPromise: 80,
    lendingAudience: 'STUDENTS_AND_STAFF',
    maximumLoanQuantity: 5,
  },
  {
    id: 'ITM-0005',
    name: 'Drinking Water',
    aliases: ['water bottle'],
    category: 'Pantry',
    stockArea: 'Pantry',
    handling: 'Consumable',
    unit: 'bottle',
    status: 'ACTIVE',
    availableToPromise: 0,
    lendingAudience: 'STUDENTS_AND_STAFF',
  },
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
    expect(evaluateLendingEligibility(items[2], { borrowerType: 'ANGELITE', quantity: 1 })).toMatchObject({
      selectable: false,
      state: 'out-of-stock',
    });
    expect(
      evaluateLendingEligibility(
        { ...items[0], status: 'VERIFY' },
        { borrowerType: 'USC_STAFF', quantity: 1 },
      ),
    ).toMatchObject({ selectable: false, state: 'verify' });
    expect(
      evaluateLendingEligibility(
        { ...items[0], handling: 'NON_CIRCULATING' },
        { borrowerType: 'USC_STAFF', quantity: 1 },
      ),
    ).toMatchObject({ selectable: false, state: 'not-circulating' });
    expect(evaluateLendingEligibility(items[0], { borrowerType: 'ANGELITE', quantity: 1 })).toMatchObject({
      selectable: false,
      state: 'staff-only',
    });
  });

  it('allows both borrower groups only for STUDENTS_AND_STAFF and enforces maximum quantity', () => {
    expect(evaluateLendingEligibility(items[1], { borrowerType: 'ANGELITE', quantity: 1 })).toMatchObject({
      selectable: true,
      validForSubmit: true,
    });
    expect(evaluateLendingEligibility(items[1], { borrowerType: 'USC_STAFF', quantity: 1 })).toMatchObject({
      selectable: true,
      validForSubmit: true,
    });
    expect(evaluateLendingEligibility(items[0], { borrowerType: 'USC_STAFF', quantity: 3 })).toMatchObject({
      selectable: true,
      validForSubmit: false,
      state: 'quantity-restricted',
    });
  });

  it('rejects free text and requires future due dates only for returnable handling', () => {
    expect(validateLendingSelection(null, {})).toMatchObject({ valid: false, code: 'ITEM_NOT_SELECTED' });
    expect(validateLendingSelection(items[0], { borrowerType: 'USC_STAFF', quantity: 1 })).toMatchObject({
      valid: false,
      code: 'DUE_DATE_REQUIRED',
    });
    expect(
      validateLendingSelection(items[0], {
        borrowerType: 'USC_STAFF',
        quantity: 1,
        dueAt: '2020-01-01',
        now: '2026-01-01',
      }),
    ).toMatchObject({ valid: false, code: 'INVALID_DUE_DATE' });
    expect(validateLendingSelection(items[1], { borrowerType: 'ANGELITE', quantity: 1 })).toMatchObject({
      valid: true,
    });
  });
});

describe('borrower identity policy', () => {
  it('accepts only one to eight Student ID digits and bounds interactive input', () => {
    expect(validateStudentIdNumber('20260999')).toMatchObject({ valid: true, value: '20260999' });
    expect(validateStudentIdNumber('2026-0999')).toMatchObject({ valid: false, code: 'INVALID_STUDENT_ID' });
    expect(validateStudentIdNumber('202609999')).toMatchObject({ valid: false, code: 'INVALID_STUDENT_ID' });
    expect(validateStudentIdNumber('ABC')).toMatchObject({ valid: false, code: 'INVALID_STUDENT_ID' });
    expect(studentIdInputValue('12AB-34567890')).toBe('12345678');
  });

  it('requires the borrower-specific approved source instead of domain-only approval', () => {
    expect(borrowerIdentityRequirement('USC_STAFF')).toMatchObject({
      source: BORROWER_IDENTITY_SOURCES.USC_STAFF,
    });
    expect(
      validateBorrowerIdentityApproval({
        borrowerType: 'USC_STAFF',
        identityVerified: true,
        identityVerificationSource: BORROWER_IDENTITY_SOURCES.ANGELITE,
      }),
    ).toMatchObject({ valid: false, code: 'BORROWER_IDENTITY_NOT_VERIFIED' });
    expect(
      validateBorrowerIdentityApproval({
        borrowerType: 'ANGELITE',
        identityVerified: 'true',
        identityVerificationSource: BORROWER_IDENTITY_SOURCES.ANGELITE,
      }),
    ).toMatchObject({ valid: true });
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
      itemName: 'Paper',
      aliases: 'copy, a4',
      unit: 'ream',
      reorderThreshold: '2',
      openingOnHand: 100,
      availableToPromise: 90,
      legacy: { row: 3 },
      Item_ID: 'BAD',
    });
    expect(command).toMatchObject({
      itemId: 'ITM-1',
      itemName: 'Paper',
      aliases: ['copy', 'a4'],
      unit: 'ream',
      reorderThreshold: 2,
    });
    for (const field of ['openingOnHand', 'availableToPromise', 'legacy', 'Item_ID']) {
      expect(command).not.toHaveProperty(field);
    }
  });
});

describe('revision polling controller', () => {
  const scoped = (overrides = {}) => ({
    contract: 'scoped-revision',
    contractVersion: 1,
    enabled: true,
    scope: 'overview',
    token: 2,
    globalRevision: 2,
    updatedAt: '2026-07-16T12:00:00+08:00',
    environment: 'STAGING',
    metrics: { revisionReads: 1, moduleReads: 0, requestCount: 1 },
    ...overrides,
  });

  it('normalizes revisions and uses bounded exponential backoff', () => {
    expect(normalizeRevisionPayload({ revision: '4', updatedAt: 'now' })).toMatchObject({
      revision: 4,
      updatedAt: 'now',
    });
    expect(normalizeScopedRevisionPayload(scoped({ token: '4' }), 'overview')).toMatchObject({
      enabled: true,
      scope: 'overview',
      token: 4,
      globalRevision: 2,
    });
    expect(revisionChanged({ revision: 3 }, { revision: 4 })).toBe(true);
    expect(revisionChanged({ revision: 4 }, { revision: 4 })).toBe(false);
    expect(revisionChanged({ token: 3 }, { token: 4 })).toBe(true);
    expect([backoffDelayMs(0), backoffDelayMs(1), backoffDelayMs(2), backoffDelayMs(8)]).toEqual([
      15000, 30000, 60000, 120000,
    ]);
    expect([
      jitterDelayMs(15000, { random: () => 0 }),
      jitterDelayMs(15000, { random: () => 0.5 }),
      jitterDelayMs(15000, { random: () => 1 }),
    ]).toEqual([13500, 15000, 16500]);
    expect(modelNearLiveLoad({ sessions: 10 })).toMatchObject({
      revisionRequests: 2400,
      revisionReads: 2400,
      moduleRequests: 0,
      unchangedModuleRequests: 0,
    });
    expect(modelNearLiveLoad({ sessions: 30, changedTicks: 2 })).toMatchObject({
      revisionRequests: 7200,
      moduleRequests: 60,
      totalRequests: 7260,
    });
  });

  it('prevents overlapping calls and pauses while hidden or offline', async () => {
    let visible = true;
    let online = true;
    let resolveRead;
    const readRevision = vi.fn(
      () =>
        new Promise((resolve) => {
          resolveRead = resolve;
        }),
    );
    const statuses = [];
    const poller = createRevisionPoller({
      readRevision,
      onRevision: vi.fn(),
      onStatus: (status) => statuses.push(status),
      isVisible: () => visible,
      isOnline: () => online,
      schedule: () => 1,
      cancel: () => {},
      random: () => 0.5,
    });
    poller.start();
    const first = poller.check('focus');
    expect(poller.inFlight).toBe(true);
    await expect(poller.check('online')).resolves.toBe(false);
    expect(readRevision).toHaveBeenCalledTimes(1);
    resolveRead(scoped());
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
      schedule: (_callback, delay) => {
        scheduledDelay = delay;
        return 1;
      },
      cancel: () => {},
      random: () => 0.5,
    });
    poller.start();
    await expect(poller.check('poll')).resolves.toBe(false);
    expect(statuses).toContain('delayed');
    expect(scheduledDelay).toBe(15000);
  });

  it('fails closed when scheduled refresh is remotely disabled while retaining manual recheck', async () => {
    const scheduled = [];
    const readRevision = vi
      .fn()
      .mockResolvedValueOnce(scoped({ enabled: false }))
      .mockResolvedValueOnce(scoped({ enabled: true, token: 3 }));
    const statuses = [];
    const poller = createRevisionPoller({
      readRevision,
      onRevision: vi.fn(),
      onStatus: (status) => statuses.push(status),
      schedule: (_callback, delay) => {
        scheduled.push(delay);
        return scheduled.length;
      },
      cancel: () => {},
      random: () => 0.5,
    });
    poller.start();
    await expect(poller.check('focus')).resolves.toBe(true);
    expect(poller.automaticEnabled).toBe(false);
    await expect(poller.resume('focus')).resolves.toBe(false);
    await expect(poller.check('manual')).resolves.toBe(true);
    expect(poller.automaticEnabled).toBe(true);
    expect(statuses).toContain('manual-only');
  });

  it('ignores a response when the active scope changes before it settles', async () => {
    let scope = 'overview';
    let resolveRead;
    const onRevision = vi.fn();
    const poller = createRevisionPoller({
      readRevision: () =>
        new Promise((resolve) => {
          resolveRead = resolve;
        }),
      onRevision,
      getScope: () => scope,
      schedule: () => 1,
      cancel: () => {},
      random: () => 0.5,
    });
    poller.start();
    const pending = poller.check('focus');
    scope = 'inventory';
    resolveRead(scoped());
    await expect(pending).resolves.toBe(false);
    expect(onRevision).not.toHaveBeenCalled();
  });
});

describe('mutation request tracking', () => {
  it('attaches the current server-validated workspace and operational scope to mutations', async () => {
    const originalLocation = Object.getOwnPropertyDescriptor(globalThis, 'location');
    Object.defineProperty(globalThis, 'location', {
      configurable: true,
      value: new URL('https://example.test/app/inventory?scope=LOCATION%3AMain.Cabinet'),
    });
    const tracker = createMutationRequestTracker({ createId: () => 'mutation-1' });
    let observed;

    await tracker.run('inventory-adjustment', { reason: 'Verified count' }, async (command) => {
      observed = command;
      return { ok: true };
    });

    expect(observed).toMatchObject({
      activeWorkspace: 'inventory',
      operationalScope: 'LOCATION:Main.Cabinet',
      clientRequestId: 'mutation-1',
    });
    if (originalLocation) Object.defineProperty(globalThis, 'location', originalLocation);
    else delete globalThis.location;
  });

  it('reuses one id after an ambiguous retryable failure and rotates it after success', async () => {
    let sequence = 0;
    const tracker = createMutationRequestTracker({ createId: (prefix) => `${prefix}-${++sequence}` });
    const observed = [];
    const payload = { itemId: 'ITM-1', quantity: 1 };

    await expect(
      tracker.run('lending', payload, async (command) => {
        observed.push(command.clientRequestId);
        throw Object.assign(new Error('response lost'), { retryable: true });
      }),
    ).rejects.toThrow('response lost');

    await expect(
      tracker.run('lending', { quantity: 1, itemId: 'ITM-1' }, async (command) => {
        observed.push(command.clientRequestId);
        return { ticketId: 'LND-1' };
      }),
    ).resolves.toMatchObject({ ticketId: 'LND-1' });

    await tracker.run('lending', payload, async (command) => {
      observed.push(command.clientRequestId);
      return { ticketId: 'LND-2' };
    });
    expect(observed).toEqual(['lending-1', 'lending-1', 'lending-2']);
  });
});
