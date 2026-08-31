import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  procurementConsequence,
  procurementRecordsFromBootstrap,
  receivingCandidatesFromBootstrap,
  receivingConsequence,
  receivingHistoryFromBootstrap,
  receivingRecheckIssue,
} from '../../src/frontend/app/operations/supplyModel';

const root = resolve(import.meta.dirname, '../..');
const readSource = (relativePath) => readFileSync(resolve(root, relativePath), 'utf8');

const restockingBootstrap = {
  module: 'restocking',
  scopeRevision: { token: '12', updatedAt: '2026-08-31T00:00:00.000Z' },
  pagination: { page: 1, pageSize: 25, total: 1, hasMore: false },
  data: {
    inventoryItems: [{ id: 'ITM-1', name: 'Folding chair', unit: 'piece' }],
    restockRequests: [
      {
        id: 'RST-1',
        source_request_id: 'REQ-1',
        source_request_line_id: 'LINE-1',
        item_id: 'ITM-1',
        requested_quantity: 12,
        received_quantity: 6,
        unit: 'piece',
        status: 'PARTIALLY_RECEIVED',
        updated_at: '2026-08-31T00:00:00.000Z',
      },
      {
        id: 'RST-CLOSED',
        item_id: 'ITM-1',
        requested_quantity: 2,
        received_quantity: 2,
        unit: 'piece',
        status: 'RECEIVED',
      },
    ],
    restockRecords: [
      {
        id: 'RRC-1',
        restock_request_id: 'RST-1',
        quantity: 6,
        unit: 'piece',
        invoice_status: 'RECORDED',
        invoice_number: 'INV-1',
        evidence_id: 'EVD-1',
        received_at: '2026-08-30T00:00:00.000Z',
      },
    ],
    canvassReferences: [
      {
        id: 'CAN-1',
        linkedRestockId: 'RST-1',
        supplierName: 'Campus Supply',
        price: 450,
        unit: 'piece',
        preferred: true,
        status: 'ACTIVE',
      },
    ],
  },
};

const procurementBootstrap = {
  module: 'procurement',
  scopeRevision: { token: '9', updatedAt: '2026-08-31T00:00:00.000Z' },
  pagination: { page: 1, pageSize: 25, total: 1, hasMore: false },
  data: {
    requests: [{ id: 'REQ-2', purpose: 'Assembly seating', department: 'Operations' }],
    requestLines: [{ id: 'LINE-2', requestId: 'REQ-2', description: 'Stacking chairs' }],
    deliverables: [
      {
        id: 'DEL-2',
        requestId: 'REQ-2',
        requestLineId: 'LINE-2',
        itemSpec: 'Stacking chair · black',
        quantity: 12,
        quantityReceived: 6,
        unit: 'piece',
        status: 'PARTIALLY_RECEIVED',
        procurementStatus: 'PROCURED',
        receiptStatus: 'PARTIALLY_RECEIVED',
        preferredCanvassId: 'CAN-2',
        linkedCanvassIds: ['CAN-2', 'CAN-3'],
        neededAt: '2026-09-02T09:00:00.000Z',
      },
    ],
    canvassReferences: [
      {
        id: 'CAN-3',
        linkedDeliverableId: 'DEL-2',
        supplierName: 'Alternate Supply',
        price: 480,
        unit: 'piece',
        receiptStatus: 'AVAILABLE',
        reliability: 'VERIFIED',
        status: 'ACTIVE',
      },
      {
        id: 'CAN-2',
        linkedDeliverableId: 'DEL-2',
        supplierName: 'Campus Supply',
        price: 450,
        unit: 'piece',
        receiptStatus: 'AVAILABLE',
        reliability: 'VERIFIED',
        status: 'ACTIVE',
      },
    ],
  },
};

describe('MFR-002 U08 focused supply workspaces', () => {
  it('derives one cumulative receiving candidate, its supplier truth, history, and exact consequence', () => {
    const candidates = receivingCandidatesFromBootstrap(restockingBootstrap);

    expect(candidates).toEqual([
      expect.objectContaining({
        id: 'RST-1',
        itemName: 'Folding chair',
        requested: 12,
        received: 6,
        remaining: 6,
        supplierName: 'Campus Supply',
        preferredQuoteId: 'CAN-1',
      }),
    ]);
    expect(receivingConsequence(candidates[0], 4)).toContain('leaves 2 piece outstanding');
    expect(receivingConsequence(candidates[0], 4)).toContain('linked inventory ledger');
    expect(receivingConsequence(candidates[0], 6)).toContain('completes cumulative receiving at 12 of 12');
    expect(receivingConsequence(candidates[0], 7)).toContain('Only 6 piece remain approved');
    expect(receivingConsequence(candidates[0], 1.5)).toContain('positive whole-number');
    expect(receivingHistoryFromBootstrap(restockingBootstrap)).toEqual([
      expect.objectContaining({
        id: 'RRC-1',
        restockId: 'RST-1',
        itemName: 'Folding chair',
        quantity: 6,
        invoiceNumber: 'INV-1',
        hasEvidence: true,
      }),
    ]);
  });

  it('stops identity, revision, and cumulative drift before evidence upload', () => {
    const before = receivingCandidatesFromBootstrap(restockingBootstrap)[0];

    expect(receivingRecheckIssue({ before, after: before, quantity: 6 })).toBe('');
    expect(receivingRecheckIssue({ before, after: null, quantity: 6 })).toMatch(/no longer open/i);
    expect(receivingRecheckIssue({ before, after: { ...before, revision: 'changed' }, quantity: 6 })).toMatch(
      /revision changed/i,
    );
    expect(
      receivingRecheckIssue({
        before,
        after: { ...before, received: 10, remaining: 2 },
        quantity: 6,
      }),
    ).toMatch(/Only 2 piece remain receivable/i);
  });

  it('links deliverables to preferred and alternate supplier references without inventing a write', () => {
    const [record] = procurementRecordsFromBootstrap(procurementBootstrap);

    expect(record).toMatchObject({
      id: 'DEL-2',
      requestPurpose: 'Assembly seating',
      requestDepartment: 'Operations',
      requested: 12,
      received: 6,
      outstanding: 6,
    });
    expect(record.quotes.map((quote) => [quote.id, quote.preferred])).toEqual([
      ['CAN-2', true],
      ['CAN-3', false],
    ]);
    expect(procurementConsequence(record)).toContain('6 piece remain for governed receiving');

    const source = readSource('src/frontend/app/operations/ProcurementWorkspace.tsx');
    expect(source).toContain('This workspace does not');
    expect(source).not.toContain('frontendBackend.');
    expect(source).not.toContain('<form');
  });

  it('mounts purpose-built workspaces and suppresses generic collection grids on supply routes', () => {
    const route = readSource('src/frontend/app/operations/OperationalModuleRoute.tsx');
    const receiving = readSource('src/frontend/app/operations/ReceivingStation.tsx');

    expect(route).toContain('<ReceivingStation');
    expect(route).toContain('<ReceivingHistory');
    expect(route).toContain('<ProcurementWorkspace');
    expect(route).toContain("module === 'procurement' ? null");
    expect(receiving).toContain('Recheck and record receipt');
    expect(receiving).toContain('contentDigest');
    expect(receiving.indexOf("operationalModuleBootstrap('restocking')")).toBeLessThan(
      receiving.indexOf('uploadOperationalEvidence'),
    );
  });
});
