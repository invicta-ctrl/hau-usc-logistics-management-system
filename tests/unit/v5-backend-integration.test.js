import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFile } from 'node:fs/promises';
import {
  ACCOUNTS,
  ACTIVITY,
  EVENTS,
  HEALTH,
  INVENTORY,
  INVENTORY_COMPOSITION,
  LEDGER,
  LOANS,
  NOTIFICATIONS,
  PROCUREMENT,
  RELEASES,
  REQUEST_LINES,
  REQUESTS,
  RESTOCKING,
} from '../../src/v5/src/data/mock.js';
import { createV5Backend } from '../../src/v5/integration/backend.js';
import {
  applyOperationalState,
  clearBackendViewModels,
  viewModelCounts,
} from '../../src/v5/integration/view-models.js';
import {
  isIsolatedPlaygroundHealth,
  parsePlaygroundOrigin,
  verifyPlaygroundOrigin,
} from '../../scripts/playground-proxy-guard.mjs';

const targets = [
  REQUESTS,
  REQUEST_LINES,
  LOANS,
  RELEASES,
  INVENTORY,
  LEDGER,
  EVENTS,
  ACTIVITY,
  PROCUREMENT,
  RESTOCKING,
  ACCOUNTS,
  HEALTH,
  NOTIFICATIONS,
  INVENTORY_COMPOSITION,
];

afterEach(() => {
  clearBackendViewModels();
  vi.unstubAllGlobals();
});

describe('V5 backend integration', () => {
  it('removes every frozen prototype data collection before rendering real state', () => {
    expect(targets.some((target) => target.length > 0)).toBe(true);

    clearBackendViewModels();

    expect(targets.map((target) => target.length)).toEqual(targets.map(() => 0));
  });

  it('projects authoritative operational rows and scopes the item ledger', () => {
    clearBackendViewModels();
    applyOperationalState(
      {
        requests: [
          {
            id: 'REQ-REAL-1',
            purpose: 'Current D1 request',
            requesterName: 'Authorized requester',
            status: 'FOR_REVIEW',
          },
        ],
        requestLines: [
          {
            id: 'RL-REAL-1',
            requestId: 'REQ-REAL-1',
            itemId: 'INV-REAL-1',
            description: 'Current D1 item',
            quantity: 2,
            unit: 'piece',
            fulfillmentSource: 'INVENTORY',
          },
        ],
        inventoryItems: [
          { id: 'INV-REAL-1', name: 'Current D1 item', onHand: 7, reserved: 2, unit: 'piece' },
          { id: 'INV-REAL-2', name: 'Other D1 item', onHand: 3, reserved: 0, unit: 'piece' },
        ],
        ledgerTransactions: [
          { id: 'LED-REAL-1', itemId: 'INV-REAL-1', quantity: 7, balanceAfter: 7 },
          { id: 'LED-OTHER-1', itemId: 'INV-REAL-2', quantity: 3, balanceAfter: 3 },
        ],
        lendingTickets: [],
        releaseConfirmations: [],
        events: [],
        eventSeries: [],
        dashboardActivity: [],
        deliverables: [],
        canvassReferences: [],
        restockRequests: [],
        restockRecords: [],
      },
      { selectedRequestId: 'REQ-REAL-1', selectedInventoryId: 'INV-REAL-1' },
    );

    expect(REQUESTS).toEqual([expect.objectContaining({ ref: 'REQ-REAL-1', title: 'Current D1 request' })]);
    expect(REQUEST_LINES).toEqual([
      expect.objectContaining({ id: 'RL-REAL-1', requestId: 'REQ-REAL-1', route: 'INVENTORY' }),
    ]);
    expect(INVENTORY).toHaveLength(2);
    expect(LEDGER).toEqual([expect.objectContaining({ ref: 'LED-REAL-1', balance: 7 })]);
    expect(viewModelCounts()).toMatchObject({ requests: 1, requestLines: 1, inventory: 2, ledger: 1 });
    expect(JSON.stringify({ REQUESTS, REQUEST_LINES, INVENTORY, LEDGER })).not.toContain('DEMO');
  });

  it('uses same-origin public APIs and never selects bindings from browser input', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);
    const backend = createV5Backend();

    await backend.publicRequestOptions();
    await backend.publicLendingCatalog();

    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      '/api/public/request/options',
      '/api/public/lending/catalog',
    ]);
    for (const [, options] of fetchMock.mock.calls) {
      expect(options).toMatchObject({ method: 'GET', credentials: 'include' });
    }
  });

  it('hard-codes same-origin startup and contains only the owner-authorized public contract fields', async () => {
    const [entry, publicSurface, runtime] = await Promise.all([
      readFile(new URL('../../src/v5/integration/entry.js', import.meta.url), 'utf8'),
      readFile(new URL('../../src/v5/src/surfaces/public.js', import.meta.url), 'utf8'),
      readFile(new URL('../../src/v5/integration/runtime.js', import.meta.url), 'utf8'),
    ]);

    expect(entry).toContain('const backend = createV5Backend();');
    expect(entry).toContain("import * as app from '../src/app.js';");
    expect(entry).toContain('app.integrationBoot();');
    expect(entry).not.toContain("await import('../src/app.js')");
    expect(entry).not.toContain('__HAU_RUNTIME_CONFIG__');
    expect(entry).not.toContain('VITE_HTTP_API_BASE_URL');
    for (const field of [
      'requesterName',
      'requesterType',
      'organization',
      'contactNumber',
      'requestPurpose',
      'requestSearch',
      'trackingCode',
      'borrowerName',
      'studentId',
      'courseYear',
      'academicDepartment',
      'uscDepartment',
      'pickupDate',
      'quantity',
      'dataUseAcknowledged',
      'acceptableUseAcknowledged',
      'borrowerResponsibilityAcknowledged',
      'evidenceConsentAcknowledged',
    ]) {
      expect(publicSurface).toMatch(new RegExp(`name(?:=|:)\\s*["']${field}["']`, 'u'));
    }
    expect(runtime).not.toContain('startAccountApplicationEmail');
    expect(runtime).not.toContain('confirmAccountApplicationEmail');
    expect(runtime).toContain('remains non-destructive');
  });
});

describe('V5 isolated-playground proxy guard', () => {
  const healthy = {
    environment: 'STAGING',
    database: { connected: true },
    dependencies: { d1: true, brandAssets: true, evidenceAssets: true },
  };

  it('accepts only an HTTPS staging hostname without credentials, path, query, or fragment', () => {
    expect(parsePlaygroundOrigin('https://v5-staging.example.test').origin).toBe(
      'https://v5-staging.example.test',
    );
    for (const value of [
      'http://v5-staging.example.test',
      'https://v5-production.example.test',
      'https://prod-staging.example.test',
      'https://v5-staging.example.test/path',
      'https://user:pass@v5-staging.example.test',
    ]) {
      expect(() => parsePlaygroundOrigin(value)).toThrow();
    }
  });

  it('fails closed unless the Worker reports STAGING with its distinct D1 and R2 dependencies', async () => {
    expect(isIsolatedPlaygroundHealth(healthy)).toBe(true);
    expect(isIsolatedPlaygroundHealth({ ...healthy, environment: 'PRODUCTION' })).toBe(false);
    expect(
      isIsolatedPlaygroundHealth({ ...healthy, dependencies: { ...healthy.dependencies, d1: false } }),
    ).toBe(false);

    await expect(
      verifyPlaygroundOrigin(
        new URL('https://v5-staging.example.test'),
        vi.fn().mockResolvedValue(
          new Response(JSON.stringify({ ...healthy, environment: 'PRODUCTION' }), {
            status: 200,
            headers: { 'content-type': 'application/json' },
          }),
        ),
      ),
    ).rejects.toThrow('isolated playground');
  });
});
