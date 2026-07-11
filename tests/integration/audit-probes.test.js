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

describe('six reproduced audit probes now pass', () => {
  it('allocates different transaction IDs for paired transfers', async () => {
    store.update(
      (state) => {
        state.role = 'COMMITTEE_HEAD';
      },
      { views: [], shared: false },
    );
    const result = await service.transferEventItem({
      deliverableId: 'DEL-0002',
      destinationItemId: 'ITM-0007',
      quantity: 3,
      unit: 'meter',
      handling: 'Loanable',
      category: 'EVENT_MATERIALS',
      semanticConfirmed: true,
      mergeReason: 'Compatible reusable material',
      idempotencyKey: 'probe-transfer',
      actor: 'Head',
    });
    expect(result.outTransactionId).not.toBe(result.inTransactionId);
    expect(new Set([result.outTransactionId, result.inTransactionId]).size).toBe(2);
  });

  it('makes repeated receiving cumulative and ledger-consistent', async () => {
    store.update(
      (state) => {
        const d = state.deliverables.find((row) => row.id === 'DEL-0001');
        d.status = 'PROCURED';
      },
      { views: [], shared: false },
    );
    await service.receiveDeliverable({
      deliverableId: 'DEL-0001',
      quantityReceivedNow: 2,
      idempotencyKey: 'probe-receive-1',
      actor: 'Receiver',
    });
    const result = await service.receiveDeliverable({
      deliverableId: 'DEL-0001',
      quantityReceivedNow: 4,
      idempotencyKey: 'probe-receive-2',
      actor: 'Receiver',
    });
    const state = store.getState();
    const receipts = state.deliverableReceipts
      .filter((row) => row.relatedId === 'DEL-0001')
      .reduce((sum, row) => sum + row.quantityReceived, 0);
    const eventItem = state.deliverables.find((row) => row.id === 'DEL-0001').eventItemId;
    const ledger = state.ledgerTransactions
      .filter((row) => row.eventItemId === eventItem && row.type === 'RECEIPT')
      .reduce((sum, row) => sum + row.quantity, 0);
    expect(result.receivedTotal).toBe(6);
    expect(receipts).toBe(6);
    expect(ledger).toBe(6);
  });

  it('posts no second movement for a duplicate return', async () => {
    const command = {
      ticketId: 'LND-2026-00001',
      returnedQuantity: 1,
      lostQuantity: 0,
      damagedBeyondUse: 0,
      conditionReturn: 'GOOD',
      idempotencyKey: 'probe-return',
      actor: 'Receiver',
    };
    await service.confirmLendingReturn(command);
    const replay = await service.confirmLendingReturn(command);
    expect(replay.idempotentReplay).toBe(true);
    expect(
      store
        .getState()
        .ledgerTransactions.filter(
          (row) => row.relatedEntityId === command.ticketId && row.type === 'LOAN_RETURN',
        ),
    ).toHaveLength(1);
    await expect(
      service.confirmLendingReturn({ ...command, idempotencyKey: 'probe-return-new' }),
    ).rejects.toMatchObject({ code: 'INVALID_TRANSITION' });
  });

  it('posts no second movement for a duplicate handoff', async () => {
    const command = {
      ticketId: 'LND-2026-00002',
      conditionOut: 'GOOD',
      idempotencyKey: 'probe-handoff',
      actor: 'Release',
    };
    await service.confirmLendingHandoff(command);
    await service.confirmLendingHandoff(command);
    expect(
      store
        .getState()
        .ledgerTransactions.filter(
          (row) => row.relatedEntityId === command.ticketId && row.type === 'LOAN_OUT',
        ),
    ).toHaveLength(1);
    await expect(
      service.confirmLendingHandoff({ ...command, idempotencyKey: 'probe-handoff-new' }),
    ).rejects.toMatchObject({ code: 'INVALID_TRANSITION' });
  });

  it('rejects over-transfer in the service layer', async () => {
    store.update(
      (state) => {
        state.role = 'COMMITTEE_HEAD';
      },
      { views: [], shared: false },
    );
    await expect(
      service.transferEventItem({
        deliverableId: 'DEL-0002',
        destinationItemId: 'ITM-0007',
        quantity: 999,
        unit: 'meter',
        handling: 'Loanable',
        semanticConfirmed: true,
        mergeReason: 'Compatible',
        idempotencyKey: 'probe-over-transfer',
        actor: 'Head',
      }),
    ).rejects.toMatchObject({ code: 'INSUFFICIENT_EVENT_BALANCE' });
    expect(
      store.getState().ledgerTransactions.some((row) => row.idempotencyKey === 'probe-over-transfer:out'),
    ).toBe(false);
  });

  it('rolls back request and lines when reservation fails', async () => {
    const beforeReservations = store.getState().reservations.length;
    await expect(
      service.acceptRequest({
        requestId: 'REQ-2026-00002',
        simulateReservationFailureAtLineId: 'RL-0002',
        idempotencyKey: 'probe-reservation-failure',
        actor: 'Staff',
      }),
    ).rejects.toMatchObject({ code: 'RESERVATION_CONFLICT' });
    const state = store.getState();
    expect(state.requests.find((row) => row.id === 'REQ-2026-00002').status).toBe('FOR_REVIEW');
    expect(state.requestLines.find((row) => row.id === 'RL-0002').status).toBe('FOR_REVIEW');
    expect(state.reservations).toHaveLength(beforeReservations);
  });
});
