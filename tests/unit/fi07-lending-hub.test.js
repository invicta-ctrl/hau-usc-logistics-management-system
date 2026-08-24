import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildLendingBootstrapPath, FrontendBackend } from '../../src/frontend/integration/backend.ts';
import {
  canApproveInternalLending,
  canHandoffInternalLending,
  canReturnInternalLending,
  canUploadLendingEvidence,
} from '../../src/frontend/integration/routeAccess.ts';
import {
  borrowerLabel,
  canAdvanceLendingPage,
  derivedLendingStatus,
  evidenceByteDigest,
  lendingClientRequestId,
  lendingCommandSignature,
  returnReconciliationError,
  traceableReviewError,
} from '../../src/frontend/app/lending/InternalLendingHub.tsx';

afterEach(() => vi.unstubAllGlobals());

function response(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

function lendingBootstrapPayload() {
  return {
    ok: true,
    contract: 'bootstrap-module',
    contractVersion: 2,
    module: 'lending',
    requestOnly: false,
    scopeRevision: { scope: 'lending', token: 'lending-r7', updatedAt: '2026-08-24T00:00:00.000Z' },
    pagination: { page: 2, pageSize: 25, total: 51, hasMore: true },
    data: {
      lendingTickets: [
        {
          id: 'LEND-1',
          itemId: 'ITM-1',
          requestedItemId: 'ITM-1',
          quantity: 2,
          requestedQuantity: 2,
          unit: 'piece',
          studentIdNumber: '20260041',
          borrowerName: '',
          borrowerType: 'ANGELITE',
          department: 'Engineering',
          contact: '09170000000',
          email: 'borrower@example.test',
          courseYear: 'BSIE 3',
          positionRole: '',
          purpose: 'Fixture loan',
          dueAt: '2020-08-24T09:00:00.000Z',
          requestedStartAt: '2020-08-20T09:00:00.000Z',
          requestedEndAt: '2020-08-24T09:00:00.000Z',
          ticketType: 'LOAN',
          status: 'ON_LOAN',
          reviewDecision: 'APPROVE',
          reviewNotes: 'Authoritative fixture',
          rejectionReason: '',
          substitutionNote: '',
          eligibilitySource: 'APPROVED_ANGELITE_IDENTITY_RULE',
          eligibilityReviewedBy: 'DOL',
          eligibilityReviewedAt: '2026-08-24T00:00:00.000Z',
          assetOptions: [],
          history: [
            {
              previousStatus: 'READY_TO_CLAIM',
              newStatus: 'ON_LOAN',
              changedAt: '2020-08-20T09:00:00.000Z',
              changedBy: 'DOL',
              reason: 'Handoff',
              metadata: {},
            },
          ],
          createdAt: '2020-08-19T09:00:00.000Z',
          updatedAt: '2020-08-20T09:00:00.000Z',
        },
      ],
      inventoryItems: [
        {
          id: 'ITM-1',
          name: 'Folding chair',
          category: 'Furniture',
          unit: 'piece',
          status: 'ACTIVE',
          catalogType: 'OFFICE_INVENTORY',
          stockArea: 'DOL storage',
          isLendable: true,
          lendingKind: 'REUSABLE',
          lendingStatus: 'ACTIVE',
          lendingAudience: 'ANGELITE_AND_USC_STAFF',
          eligibilityRule: 'Institutional identity required',
          conditionTracked: true,
          conditionReviewState: 'ASSESSED',
          maintenanceReviewState: 'CURRENT',
          traceableAssets: 2,
          availableAssets: 1,
          maximumLoanQuantity: 2,
        },
      ],
    },
  };
}

describe('FI-07 internal lending frontend contract', () => {
  it('strictly projects lending bootstrap v2 and never invents an omitted availability value', async () => {
    const valid = lendingBootstrapPayload();
    const wrongModule = structuredClone(valid);
    wrongModule.module = 'request';
    const wrongVersion = structuredClone(valid);
    wrongVersion.contractVersion = 1;
    const partial = structuredClone(valid);
    delete partial.data.lendingTickets[0].history;
    const requestOnly = structuredClone(valid);
    requestOnly.requestOnly = true;
    const malformedAvailability = structuredClone(valid);
    malformedAvailability.data.inventoryItems[0].lendableAvailable = 'not-a-number';
    const nonAvailableCandidate = structuredClone(valid);
    nonAvailableCandidate.data.lendingTickets[0].assetOptions = [
      {
        id: 'AST-NOT-AVAILABLE',
        itemId: 'ITM-1',
        assetTag: 'Incorrect candidate',
        serialNumber: '',
        condition: 'GOOD',
        status: 'ON_LOAN',
      },
    ];
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(response(valid))
      .mockResolvedValueOnce(response(wrongModule))
      .mockResolvedValueOnce(response(wrongVersion))
      .mockResolvedValueOnce(response(partial))
      .mockResolvedValueOnce(response(requestOnly))
      .mockResolvedValueOnce(response(malformedAvailability))
      .mockResolvedValueOnce(response(nonAvailableCandidate));
    vi.stubGlobal('fetch', fetchMock);
    const backend = new FrontendBackend();

    const projected = await backend.lendingBootstrap({ page: 2, pageSize: 25 });
    expect(projected).toMatchObject({
      lendingTickets: [{ id: 'LEND-1', requestedItemId: 'ITM-1', borrowerName: '', assetOptions: [] }],
      pagination: { page: 2, pageSize: 25, total: 51, hasMore: true },
      scopeRevision: { token: 'lending-r7', updatedAt: '2026-08-24T00:00:00.000Z' },
    });
    expect(projected.inventoryItems[0].lendableAvailable).toBeUndefined();
    expect(Object.hasOwn(projected.inventoryItems[0], 'lendableAvailable')).toBe(false);
    await expect(backend.lendingBootstrap()).rejects.toMatchObject({
      code: 'INCOMPLETE_RESPONSE',
      status: 502,
    });
    await expect(backend.lendingBootstrap()).rejects.toMatchObject({
      code: 'INCOMPLETE_RESPONSE',
      status: 502,
    });
    await expect(backend.lendingBootstrap()).rejects.toMatchObject({
      code: 'INCOMPLETE_RESPONSE',
      status: 502,
    });
    await expect(backend.lendingBootstrap()).rejects.toMatchObject({
      code: 'INCOMPLETE_RESPONSE',
      status: 502,
    });
    await expect(backend.lendingBootstrap()).rejects.toMatchObject({
      code: 'INCOMPLETE_RESPONSE',
      status: 502,
    });
    await expect(backend.lendingBootstrap()).rejects.toMatchObject({
      code: 'INCOMPLETE_RESPONSE',
      status: 502,
    });
    expect(fetchMock.mock.calls[0]).toEqual([
      '/api/bootstrap/lending?page=2&pageSize=25',
      expect.objectContaining({ method: 'GET', credentials: 'include' }),
    ]);
    expect(buildLendingBootstrapPath({ page: -2, pageSize: 0 })).toBe(
      '/api/bootstrap/lending?page=1&pageSize=25',
    );
    expect(buildLendingBootstrapPath({ page: 3, pageSize: 99 })).toBe(
      '/api/bootstrap/lending?page=3&pageSize=50',
    );
  });

  it('fails closed on malformed lending pagination values', async () => {
    const invalidPayloads = [
      { page: 0, pageSize: 25, total: 0, hasMore: false },
      { page: 1.5, pageSize: 25, total: 0, hasMore: false },
      { page: 1, pageSize: 0, total: 0, hasMore: false },
      { page: 1, pageSize: 51, total: 0, hasMore: false },
      { page: 1, pageSize: 25.5, total: 0, hasMore: false },
      { page: 1, pageSize: 25, total: -1, hasMore: false },
      { page: 1, pageSize: 25, total: 0, hasMore: 'true' },
    ];
    const fetchMock = vi.fn();
    for (const pagination of invalidPayloads) {
      const payload = lendingBootstrapPayload();
      payload.pagination = pagination;
      fetchMock.mockResolvedValueOnce(response(payload));
    }
    vi.stubGlobal('fetch', fetchMock);
    const backend = new FrontendBackend();
    for (const _pagination of invalidPayloads) {
      await expect(backend.lendingBootstrap()).rejects.toMatchObject({
        code: 'INCOMPLETE_RESPONSE',
        status: 502,
      });
    }
  });

  it('keeps derived status, exact command identities, return reconciliation, and presentation gates deterministic', () => {
    expect(
      derivedLendingStatus({ status: 'ON_LOAN', dueAt: '2020-08-24T09:00:00.000Z' }, Date.UTC(2026, 7, 24)),
    ).toBe('OVERDUE');
    expect(
      derivedLendingStatus(
        { status: 'READY_TO_CLAIM', dueAt: '2020-08-24T09:00:00.000Z' },
        Date.UTC(2026, 7, 24),
      ),
    ).toBe('READY_TO_CLAIM');
    const command = {
      verb: 'review',
      ticketId: 'LEND-1',
      revision: '2026-08-24T00:00:00.000Z',
      values: { assetIds: ['AST-2', 'AST-1'], decision: 'APPROVE', quantity: 2 },
    };
    expect(lendingCommandSignature(command)).toBe(
      'review|LEND-1|2026-08-24T00:00:00.000Z|assetIds=AST-1,AST-2|decision=APPROVE|quantity=2',
    );
    expect(lendingClientRequestId(command)).toBe(
      lendingClientRequestId({
        ...command,
        values: { quantity: 2, decision: 'APPROVE', assetIds: ['AST-1', 'AST-2'] },
      }),
    );
    expect(
      returnReconciliationError({
        quantity: 2,
        returned: 1,
        lost: 1,
        damaged: 0,
        condition: 'LOST',
        note: '',
        item: { lendingKind: 'REUSABLE', traceableAssets: 0 },
      }),
    ).toMatch(/inspection note/i);
    expect(
      returnReconciliationError({
        quantity: 2,
        returned: 1,
        lost: 0,
        damaged: 0,
        condition: 'GOOD',
        note: '',
        item: { lendingKind: 'REUSABLE', traceableAssets: 0 },
      }),
    ).toMatch(/exactly equal/i);
    expect(
      returnReconciliationError({
        quantity: 2,
        returned: 2,
        lost: 0,
        damaged: 0,
        condition: 'GOOD',
        note: '',
        item: { lendingKind: 'REUSABLE', traceableAssets: 2 },
      }),
    ).toBe('');

    const user = {
      accountId: 'DOL',
      displayName: 'DOL',
      roleId: 'DOL_STAFF',
      capabilities: ['view.internal', 'lending.approve', 'lending.return'],
    };
    expect(canApproveInternalLending(user)).toBe(true);
    expect(canHandoffInternalLending(user)).toBe(false);
    expect(canReturnInternalLending(user)).toBe(true);
    expect(canUploadLendingEvidence(user)).toBe(false);
  });

  it('keeps blank borrower truth, ticket-page reachability, traceable assignments, and condition outcomes explicit', () => {
    expect(borrowerLabel({ borrowerName: '' })).toBe('Borrower not reported');
    expect(
      canAdvanceLendingPage({ lendingTickets: Array.from({ length: 25 }), pagination: { pageSize: 25 } }),
    ).toBe(true);
    expect(
      canAdvanceLendingPage({ lendingTickets: Array.from({ length: 24 }), pagination: { pageSize: 25 } }),
    ).toBe(false);

    const candidates = [
      {
        id: 'AST-1',
        itemId: 'ITM-REUSABLE',
        assetTag: '',
        serialNumber: '',
        condition: 'GOOD',
        status: 'AVAILABLE',
      },
      {
        id: 'AST-2',
        itemId: 'ITM-REUSABLE',
        assetTag: '',
        serialNumber: '',
        condition: 'GOOD',
        status: 'AVAILABLE',
      },
    ];
    const reusable = { lendingKind: 'REUSABLE', traceableAssets: 2 };
    expect(
      traceableReviewError({
        item: reusable,
        targetItemId: 'ITM-REUSABLE',
        candidates,
        quantity: 2,
        assetIds: ['AST-1', 'AST-2'],
      }),
    ).toBe('');
    expect(
      traceableReviewError({
        item: reusable,
        targetItemId: 'ITM-REUSABLE',
        candidates: [],
        quantity: 1,
        assetIds: [],
      }),
    ).toMatch(/not enough matching available/u);
    expect(
      traceableReviewError({
        item: { lendingKind: 'REUSABLE', traceableAssets: undefined },
        targetItemId: 'ITM-REUSABLE',
        candidates,
        quantity: 1,
        assetIds: ['AST-1'],
      }),
    ).toMatch(/redacted/u);
    expect(
      traceableReviewError({
        item: { lendingKind: 'REUSABLE', traceableAssets: 0 },
        targetItemId: 'ITM-REUSABLE',
        candidates: [],
        quantity: 1,
        assetIds: [],
      }),
    ).toBe('');
    expect(
      returnReconciliationError({
        quantity: 1,
        returned: 1,
        lost: 0,
        damaged: 0,
        condition: 'LOST',
        note: '',
        item: { lendingKind: 'CONSUMABLE', traceableAssets: undefined },
      }),
    ).toMatch(/positive lost/u);
    expect(
      returnReconciliationError({
        quantity: 1,
        returned: 1,
        lost: 0,
        damaged: 0,
        condition: 'DAMAGED_BEYOND_USE',
        note: '',
        item: { lendingKind: 'CONSUMABLE', traceableAssets: undefined },
      }),
    ).toMatch(/positive damaged/u);
    expect(
      returnReconciliationError({
        quantity: 1,
        returned: 0,
        lost: 1,
        damaged: 0,
        condition: 'GOOD',
        note: 'Observed',
        item: { lendingKind: 'CONSUMABLE', traceableAssets: undefined },
      }),
    ).toMatch(/matching return condition/u);
    expect(
      returnReconciliationError({
        quantity: 2,
        returned: 0,
        lost: 1,
        damaged: 1,
        condition: 'LOST',
        note: 'Observed',
        item: { lendingKind: 'REUSABLE', traceableAssets: 0 },
      }),
    ).toMatch(/single return condition/u);
  });

  it('fails closed on mixed traceable reusable return outcomes while preserving verified aggregate outcomes', () => {
    const traceableReusable = { lendingKind: 'REUSABLE', traceableAssets: 2 };
    const aggregateReusable = { lendingKind: 'REUSABLE', traceableAssets: 0 };
    const consumable = { lendingKind: 'CONSUMABLE', traceableAssets: undefined };

    expect(
      returnReconciliationError({
        quantity: 2,
        returned: 1,
        lost: 1,
        damaged: 0,
        condition: 'LOST',
        note: 'One unit lost during inspection.',
        item: traceableReusable,
      }),
    ).toMatch(/exactly one nonzero outcome bucket/u);
    expect(
      returnReconciliationError({
        quantity: 2,
        returned: 1,
        lost: 0,
        damaged: 1,
        condition: 'DAMAGED_BEYOND_USE',
        note: 'One unit damaged beyond use during inspection.',
        item: traceableReusable,
      }),
    ).toMatch(/exactly one nonzero outcome bucket/u);
    expect(
      returnReconciliationError({
        quantity: 2,
        returned: 0,
        lost: 2,
        damaged: 0,
        condition: 'LOST',
        note: 'Both units were lost.',
        item: traceableReusable,
      }),
    ).toBe('');
    expect(
      returnReconciliationError({
        quantity: 2,
        returned: 0,
        lost: 0,
        damaged: 2,
        condition: 'DAMAGED_BEYOND_USE',
        note: 'Both units were damaged beyond use.',
        item: traceableReusable,
      }),
    ).toBe('');
    expect(
      returnReconciliationError({
        quantity: 2,
        returned: 2,
        lost: 0,
        damaged: 0,
        condition: 'GOOD',
        note: '',
        item: traceableReusable,
      }),
    ).toBe('');
    expect(
      returnReconciliationError({
        quantity: 2,
        returned: 1,
        lost: 1,
        damaged: 0,
        condition: 'LOST',
        note: 'Aggregate inventory reconciliation.',
        item: aggregateReusable,
      }),
    ).toBe('');
    expect(
      returnReconciliationError({
        quantity: 2,
        returned: 1,
        lost: 1,
        damaged: 0,
        condition: 'LOST',
        note: 'Consumable inventory reconciliation.',
        item: consumable,
      }),
    ).toBe('');
    expect(
      returnReconciliationError({
        quantity: 2,
        returned: 1,
        lost: 1,
        damaged: 0,
        condition: 'LOST',
        note: 'Traceability is unavailable.',
        item: { lendingKind: 'REUSABLE', traceableAssets: undefined },
      }),
    ).toMatch(/exactly one nonzero outcome bucket/u);
    expect(
      returnReconciliationError({
        quantity: 2,
        returned: 2,
        lost: 0,
        damaged: 0,
        condition: 'GOOD',
        note: '',
        item: null,
      }),
    ).toMatch(/canonical return inventory item is not projected/u);
  });

  it('makes evidence idempotency content-aware without persisting selected file bytes', async () => {
    vi.stubGlobal('crypto', {
      subtle: {
        digest: vi.fn(async (_algorithm, bytes) => {
          const source = new Uint8Array(bytes);
          return Uint8Array.from({ length: 32 }, (_value, index) => (source[index] ?? source[0] ?? 0) + index)
            .buffer;
        }),
      },
    });
    const sameMetadata = { name: 'return.jpg', size: 4, modified: 1724457600000, type: 'image/jpeg' };
    const firstDigest = await evidenceByteDigest({
      arrayBuffer: async () => Uint8Array.from([1, 2, 3, 4]).buffer,
    });
    const secondDigest = await evidenceByteDigest({
      arrayBuffer: async () => Uint8Array.from([4, 3, 2, 1]).buffer,
    });
    expect(firstDigest).not.toBe(secondDigest);
    const firstId = lendingClientRequestId({
      verb: 'evidence',
      ticketId: 'LEND-1',
      revision: '2026-08-24T00:00:00.000Z',
      values: { ...sameMetadata, sha256: firstDigest },
    });
    const secondId = lendingClientRequestId({
      verb: 'evidence',
      ticketId: 'LEND-1',
      revision: '2026-08-24T00:00:00.000Z',
      values: { ...sameMetadata, sha256: secondDigest },
    });
    expect(firstId).not.toBe(secondId);
  });
});
