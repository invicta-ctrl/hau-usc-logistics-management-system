import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { AppsScriptAdapter } from '../../src/services/apps-script-adapter.js';
import { HttpApiAdapter } from '../../src/services/http-api-adapter.js';
import { createLegacyRuntimeAdapter } from '../../src/services/legacy-runtime-adapter.js';
import { LAUNCH_SERVICE_METHODS } from '../../src/services/launch-service-contract.js';
import { MockAdapter } from '../../src/services/mock-adapter.js';
import { RestService } from '../../src/services/rest-service.js';
import { applyMockBulkInventoryClassification } from '../../src/visual/runtime-extensions.js';

afterEach(() => {
  delete globalThis.google;
  vi.restoreAllMocks();
});

const runnerFor = (result, calls) => {
  let success;
  let proxy;
  const runner = {
    withSuccessHandler(handler) {
      success = handler;
      return proxy;
    },
    withFailureHandler() {
      return proxy;
    },
  };
  proxy = new Proxy(runner, {
    get(target, property) {
      if (property in target) return target[property];
      return (command) => {
        calls.push({ method: String(property), command });
        queueMicrotask(() => success(result));
      };
    },
  });
  return proxy;
};

const bulkPayload = (overrides = {}) => ({
  reason: 'Synthetic physical similarity review',
  similarityConfirmed: true,
  items: [
    {
      itemId: 'ITM-001',
      expectedRevision: 1,
      classificationStatus: 'CLASSIFIED',
      inventoryKind: 'CONSUMABLE',
      conditionReviewState: 'NOT_APPLICABLE',
      maintenanceReviewState: 'NOT_APPLICABLE',
      stockArea: 'Inventory',
      storageLocation: 'Synthetic shelf',
      unit: 'piece',
      reorderThreshold: 0,
      isLendable: false,
      lendingAudience: 'NOT_AVAILABLE_FOR_LENDING',
      enableLendingConfirmed: false,
      assetInstanceCountIfReusable: 0,
      assetTrackingConfirmed: false,
      assetTags: [],
      classificationNotes: 'Synthetic physical similarity review',
      reason: 'Synthetic physical similarity review',
      similarityConfirmed: true,
    },
    {
      itemId: 'ITM-002',
      expectedRevision: 1,
      classificationStatus: 'CLASSIFIED',
      inventoryKind: 'CONSUMABLE',
      conditionReviewState: 'NOT_APPLICABLE',
      maintenanceReviewState: 'NOT_APPLICABLE',
      stockArea: 'Inventory',
      storageLocation: 'Synthetic shelf',
      unit: 'piece',
      reorderThreshold: 0,
      isLendable: false,
      lendingAudience: 'NOT_AVAILABLE_FOR_LENDING',
      enableLendingConfirmed: false,
      assetInstanceCountIfReusable: 0,
      assetTrackingConfirmed: false,
      assetTags: [],
      classificationNotes: 'Synthetic physical similarity review',
      reason: 'Synthetic physical similarity review',
      similarityConfirmed: true,
    },
  ],
  ...overrides,
});

describe('atomic inventory bulk classification service contract', () => {
  it('exposes the method through every launch adapter surface', () => {
    expect(LAUNCH_SERVICE_METHODS).toContain('bulkClassifyInventoryItems');
    expect(typeof AppsScriptAdapter.prototype.bulkClassifyInventoryItems).toBe('function');
    expect(typeof HttpApiAdapter.prototype.bulkClassifyInventoryItems).toBe('function');
    expect(typeof RestService.prototype.bulkClassifyInventoryItems).toBe('function');
    expect(typeof MockAdapter.prototype.bulkClassifyInventoryItems).toBe('function');
  });

  it('routes Apps Script bulk classification through its explicit server function', async () => {
    const calls = [];
    globalThis.google = { script: { run: runnerFor({ ok: true, count: 2 }, calls) } };
    const command = bulkPayload();

    await expect(new AppsScriptAdapter().bulkClassifyInventoryItems(command)).resolves.toMatchObject({
      count: 2,
    });
    expect(calls).toEqual([{ method: 'api_bulkClassifyInventoryItems', command }]);
  });

  it('keeps the Apps Script runtime explicit and fail-closed until its canonical backend exists', () => {
    const router = readFileSync(resolve(import.meta.dirname, '../../apps-script/Router.gs'), 'utf8');
    expect(router).toContain('function api_bulkClassifyInventoryItems(command)');
    expect(router).toContain('FEATURE_NOT_CONFIGURED');
  });

  it('uses a distinct retry-stable idempotency scope for the bulk mutation', async () => {
    const remote = {
      bulkClassifyInventoryItems: vi
        .fn()
        .mockRejectedValueOnce(Object.assign(new Error('Retry safely.'), { retryable: true }))
        .mockResolvedValueOnce({ ok: true, count: 2 }),
    };
    const services = createLegacyRuntimeAdapter({}, { mode: 'apps-script', remote });
    const command = bulkPayload();

    await expect(services.bulkClassifyInventoryItems(command)).rejects.toMatchObject({ retryable: true });
    await expect(services.bulkClassifyInventoryItems(command)).resolves.toMatchObject({ count: 2 });

    const calls = remote.bulkClassifyInventoryItems.mock.calls.map(([value]) => value);
    expect(calls[0]).toEqual(expect.objectContaining(command));
    expect(calls[0].clientRequestId).toMatch(/^bulk-classify-inventory-/u);
    expect(calls[1].clientRequestId).toBe(calls[0].clientRequestId);
  });

  it('keeps bulk writes fail-closed in the adapter mock', async () => {
    const adapter = new MockAdapter({});
    await expect(adapter.bulkClassifyInventoryItems(bulkPayload())).rejects.toThrow(
      'Use the local preview bulk classification workflow.',
    );
  });
});

describe('local preview bulk classification', () => {
  const item = (id) => ({
    id,
    name: `Synthetic ${id}`,
    classificationStatus: 'NEEDS_CLASSIFICATION',
    inventoryKind: 'UNVERIFIED',
    classificationRevision: 1,
    stockArea: 'Inventory',
    storageLocation: 'Synthetic shelf',
    unit: 'piece',
    reorderThreshold: 0,
    isLendable: false,
    lendingAudience: 'NOT_AVAILABLE_FOR_LENDING',
    assetInstanceCount: 0,
  });

  it('applies all items atomically and forces non-lendable state', () => {
    const items = [item('ITM-001'), item('ITM-002')];
    const result = applyMockBulkInventoryClassification(items, bulkPayload(), {
      now: '2026-08-03T00:00:00.000Z',
    });

    expect(result).toMatchObject({
      count: 2,
      itemIds: ['ITM-001', 'ITM-002'],
      correlationId: 'LOCAL-PREVIEW',
    });
    expect(items).toEqual([
      expect.objectContaining({
        classificationStatus: 'CLASSIFIED',
        inventoryKind: 'CONSUMABLE',
        isLendable: false,
        lendingAudience: 'NOT_AVAILABLE_FOR_LENDING',
        classificationRevision: 2,
      }),
      expect.objectContaining({ classificationStatus: 'CLASSIFIED', classificationRevision: 2 }),
    ]);
  });

  it('does not mutate an earlier item when a later revision is stale', () => {
    const items = [item('ITM-001'), item('ITM-002')];
    const stalePayload = bulkPayload({
      items: bulkPayload().items.map((entry, index) => ({ ...entry, expectedRevision: index ? 99 : 1 })),
    });

    expect(() => applyMockBulkInventoryClassification(items, stalePayload)).toThrow(
      'This classification changed. Refresh the queue before saving.',
    );
    expect(items.every((entry) => entry.classificationStatus === 'NEEDS_CLASSIFICATION')).toBe(true);
    expect(items.every((entry) => entry.classificationRevision === 1)).toBe(true);
  });
});
