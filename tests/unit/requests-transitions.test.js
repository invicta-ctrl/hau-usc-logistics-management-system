import { describe, expect, it } from 'vitest';
import { routingDecision, deriveRequestStatus, consolidateDraftLines } from '../../src/domain/requests.js';
import { canTransition, assertTransition, TRANSITIONS } from '../../src/domain/transitions.js';

describe('request routing and parent derivation', () => {
  it.each([
    [{ selectedItemId: 'ITM', requestedQuantity: 5, availableQuantity: 9 }, 'FULL'],
    [{ selectedItemId: 'ITM', requestedQuantity: 5, availableQuantity: 2 }, 'PARTIAL'],
    [{ selectedItemId: 'ITM', requestedQuantity: 5, availableQuantity: 0 }, 'NONE'],
    [{ selectedItemId: null, requestedQuantity: 5, availableQuantity: 99 }, 'NEW'],
  ])('returns full, partial, none, and new decisions', (input, kind) =>
    expect(routingDecision(input).kind).toBe(kind),
  );

  it.each([
    [[{ status: 'FOR_REVIEW' }], 'FOR_REVIEW'],
    [[{ status: 'READY_TO_RELEASE' }, { status: 'FOR_CANVASSING' }], 'ACCEPTED'],
    [[{ status: 'PARTIALLY_RELEASED' }, { status: 'FOR_CANVASSING' }], 'PARTIALLY_FULFILLED'],
    [[{ status: 'COMPLETED' }, { status: 'RESTOCKED' }], 'COMPLETED'],
    [[{ status: 'REJECTED' }, { status: 'CANCELLED' }], 'CANCELLED'],
  ])('derives parent status deterministically', (lines, expected) =>
    expect(deriveRequestStatus(lines)).toBe(expected),
  );

  it('consolidates duplicate draft lines', () => {
    const result = consolidateDraftLines([
      { itemId: 'I', description: 'Pen', unit: 'piece', fulfillmentSource: 'STOCK', quantity: 2 },
      { itemId: 'I', description: 'Pen', unit: 'piece', fulfillmentSource: 'STOCK', quantity: 3 },
    ]);
    expect(result).toHaveLength(1);
    expect(result[0].quantity).toBe(5);
  });
});

describe('explicit state transitions', () => {
  it('contains guarded maps for every required entity', () =>
    expect(Object.keys(TRANSITIONS).sort()).toEqual([
      'lending',
      'procurement',
      'request',
      'requestLine',
      'restock',
    ]));
  it('accepts allowed transitions and rejects invalid jumps', () => {
    expect(canTransition('lending', 'READY_TO_CLAIM', 'ON_LOAN')).toBe(true);
    expect(() => assertTransition('lending', 'FOR_REVIEW', 'RETURNED')).toThrow(/cannot move/);
    expect(() => assertTransition('procurement', 'FOR_CANVASSING', 'COMPLETED')).toThrow(/cannot move/);
  });
});
