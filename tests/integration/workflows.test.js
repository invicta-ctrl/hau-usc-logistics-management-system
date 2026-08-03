import { beforeEach, describe, expect, it } from 'vitest';
import { createStore } from '../../src/app/store.js';
import { MockService } from '../../src/services/mock-service.js';
import { memoryStorage } from '../fixtures/memory-storage.js';

let store;
let service;
beforeEach(() => {
  store = createStore({ storage: memoryStorage() });
  service = new MockService(store);
});

const requestCommand = (suffix, line) => ({
  type: 'EVENT_LOGISTICS',
  eventId: 'EVT-YDD-POTTERY',
  requesterName: 'Test Requester',
  requesterGroup: 'DOL',
  dateStart: '2026-07-25',
  dateEnd: '2026-07-25',
  purpose: `Integration ${suffix}`,
  lines: [line],
  idempotencyKey: `submit-${suffix}`,
  actor: 'Requester',
});

describe('guided workflows', () => {
  it('completes request-from-stock with one controlled ISSUE', async () => {
    const submitted = await service.submitRequest(
      requestCommand('stock', {
        itemId: 'ITM-0001',
        description: 'Ballpen - Black',
        category: 'OFFICE_SUPPLIES',
        unit: 'piece',
        quantity: 2,
      }),
    );
    await service.acceptRequest({
      requestId: submitted.requestId,
      idempotencyKey: 'accept-stock',
      actor: 'Staff',
    });
    const line = store.getState().requestLines.find((row) => row.requestId === submitted.requestId);
    expect(line.status).toBe('READY_TO_RELEASE');
    await service.confirmRelease({
      requestLineId: line.id,
      quantity: 2,
      recipientName: 'Recipient',
      recipientConfirmed: true,
      partialReason: '',
      idempotencyKey: 'release-stock',
      actor: 'Release Staff',
    });
    const state = store.getState();
    expect(state.requests.find((row) => row.id === submitted.requestId).status).toBe('COMPLETED');
    expect(
      state.ledgerTransactions.filter((row) => row.relatedEntityId === line.id && row.type === 'ISSUE'),
    ).toHaveLength(1);
  });

  it('splits partial stock into reserved and procurement lines', async () => {
    const submitted = await service.submitRequest(
      requestCommand('partial', {
        itemId: 'ITM-0005',
        description: 'Bottled Water - 350 ml',
        category: 'PANTRY_FOOD',
        unit: 'bottle',
        quantity: 60,
      }),
    );
    await service.acceptRequest({
      requestId: submitted.requestId,
      idempotencyKey: 'accept-partial',
      actor: 'Staff',
    });
    const lines = store.getState().requestLines.filter((row) => row.requestId === submitted.requestId);
    expect(lines).toHaveLength(2);
    expect(lines.map((line) => line.status).sort()).toEqual(['FOR_CANVASSING', 'READY_TO_RELEASE']);
    expect(lines.reduce((sum, line) => sum + line.quantity, 0)).toBe(60);
  });

  it('rejects a caller unit that does not match the selected catalog item', async () => {
    await expect(
      service.submitRequest(
        requestCommand('unit-mismatch', {
          itemId: 'ITM-0001',
          description: 'Ballpen - Black',
          category: 'OFFICE_SUPPLIES',
          unit: 'liter',
          quantity: 1.5,
        }),
      ),
    ).rejects.toMatchObject({ code: 'UNIT_MISMATCH' });
    expect(store.getState().requests).not.toContainEqual(
      expect.objectContaining({ purpose: 'Integration unit-mismatch' }),
    );
  });

  it('keeps sibling restock lines open after a line-level final receipt', async () => {
    const result = await service.receiveRestock({
      restockRequestId: 'RRQ-RL-0004',
      requestLineId: 'RL-0004',
      expectedRevision: 2,
      quantityReceivedNow: 6,
      quantityDamaged: 0,
      quantityRejected: 0,
      unitPrice: 200,
      idempotencyKey: 'restock-final-line-1',
      actor: 'Receiver',
    });
    expect(result.receivedTotal).toBe(10);
    const state = store.getState();
    expect(state.requestLines.find((row) => row.id === 'RL-0004').status).toBe('RESTOCKED');
    expect(state.requestLines.find((row) => row.id === 'RL-0005').status).toBe('TO_BE_PROCURED');
    expect(state.requests.find((row) => row.id === 'REQ-2026-00003').status).toBe('PARTIALLY_FULFILLED');
  });

  it('supports partial release, exact reservation consumption, and retry safety', async () => {
    const first = await service.confirmRelease({
      requestLineId: 'RL-0001',
      quantity: 5,
      recipientName: 'Recipient',
      recipientConfirmed: true,
      partialReason: 'Split pickup',
      idempotencyKey: 'partial-release',
      actor: 'Release',
    });
    const replay = await service.confirmRelease({
      requestLineId: 'RL-0001',
      quantity: 5,
      recipientName: 'Recipient',
      recipientConfirmed: true,
      partialReason: 'Split pickup',
      idempotencyKey: 'partial-release',
      actor: 'Release',
    });
    expect(first.transactionId).toBe(replay.transactionId);
    expect(store.getState().reservations.find((row) => row.id === 'RSV-2026-00001').quantity).toBe(5);
    await expect(
      service.confirmRelease({
        requestLineId: 'RL-0001',
        quantity: 6,
        recipientName: 'Recipient',
        recipientConfirmed: true,
        partialReason: '',
        idempotencyKey: 'over-release',
        actor: 'Release',
      }),
    ).rejects.toMatchObject({ code: 'OVER_RELEASE' });
  });

  it('allows only one of two competing allocations to reserve scarce stock', async () => {
    const a = await service.submitRequest(
      requestCommand('race-a', {
        itemId: 'ITM-0002',
        description: 'A4 Bond Paper',
        category: 'OFFICE_SUPPLIES',
        unit: 'ream',
        quantity: 4,
      }),
    );
    const b = await service.submitRequest({
      ...requestCommand('race-b', {
        itemId: 'ITM-0002',
        description: 'A4 Bond Paper',
        category: 'OFFICE_SUPPLIES',
        unit: 'ream',
        quantity: 4,
      }),
      idempotencyKey: 'submit-race-b',
    });
    await service.acceptRequest({
      requestId: a.requestId,
      idempotencyKey: 'accept-race-a',
      actor: 'Staff A',
    });
    await service.acceptRequest({
      requestId: b.requestId,
      idempotencyKey: 'accept-race-b',
      actor: 'Staff B',
    });
    const state = store.getState();
    const aLine = state.requestLines.find((row) => row.requestId === a.requestId);
    const bLine = state.requestLines.find((row) => row.requestId === b.requestId);
    expect([aLine.status, bLine.status].sort()).toEqual(['FOR_CANVASSING', 'READY_TO_RELEASE']);
    expect(
      state.reservations.filter(
        (row) => [aLine.id, bLine.id].includes(row.requestLineId) && row.status === 'ACTIVE',
      ),
    ).toHaveLength(1);
  });

  it('attaches safe evidence metadata only', async () => {
    const result = await service.finalizeEvidence({
      relatedEntityType: 'REQUEST',
      relatedEntityId: 'REQ-2026-00001',
      name: 'receipt-preview.pdf',
      mimeType: 'application/pdf',
      size: 1234,
      idempotencyKey: 'evidence-1',
      actor: 'Uploader',
    });
    expect(store.getState().evidenceFiles.find((row) => row.id === result.evidenceId)).toMatchObject({
      previewOnly: true,
      name: 'receipt-preview.pdf',
    });
  });

  it('creates a lending ticket for review without deducting stock', async () => {
    const before = store.getState().ledgerTransactions.length;
    const result = await service.createLendingTicket({
      itemId: 'ITM-0003',
      quantity: 1,
      studentId: 'TEST-2026',
      borrowerName: 'Test Borrower',
      borrowerGroup: 'Angelite',
      department: 'Engineering',
      contact: 'Preview',
      purpose: 'Integration test',
      dueDate: '2026-07-20',
      physicalIdVerified: true,
      idempotencyKey: 'create-lending-ticket',
      actor: 'Requester',
    });
    expect(store.getState().lendingTickets.find((row) => row.id === result.ticketId).status).toBe(
      'FOR_REVIEW',
    );
    expect(store.getState().ledgerTransactions).toHaveLength(before);
  });
});
