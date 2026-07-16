import { describe, expect, it } from 'vitest';
import {
  restockActionDecisions,
  restockProjectionId,
  restockReceiptStatus,
  validateRestockTransition,
} from '../../src/domain/restock-workflow.js';

describe('restock workflow', () => {
  it('uses one stable request-line projection identity', () => {
    expect(restockProjectionId('RL-0004')).toBe('RRQ-RL-0004');
  });

  it('returns server-style allowed actions and safe disabled reasons', () => {
    const withoutQuote = restockActionDecisions({ status: 'FOR_CANVASSING' });
    expect(withoutQuote.find((row) => row.action === 'SEND_TO_BUDGET_REVIEW')).toMatchObject({
      allowed: false,
      disabledReason: 'Select one active preferred quote before this action.',
    });
    const withQuote = restockActionDecisions({ status: 'FOR_CANVASSING', hasPreferredQuote: true });
    expect(withQuote.find((row) => row.action === 'SEND_TO_BUDGET_REVIEW').allowed).toBe(true);
    expect(withQuote.find((row) => row.action === 'RECEIVE').allowed).toBe(false);
  });

  it('fails closed while retaining read-only decisions', () => {
    expect(
      restockActionDecisions({ status: 'TO_BE_PROCURED', featureEnabled: false }).every(
        (row) => !row.allowed && /read-only/i.test(row.disabledReason),
      ),
    ).toBe(true);
  });

  it('requires reason, preferred quote, and exact revision', () => {
    expect(
      validateRestockTransition({ status: 'FOR_CANVASSING', action: 'SEND_TO_BUDGET_REVIEW', expectedRevision: 2, currentRevision: 2 }),
    ).toMatchObject({ valid: false, code: 'TRANSITION_REASON_REQUIRED' });
    expect(
      validateRestockTransition({ status: 'FOR_CANVASSING', action: 'SEND_TO_BUDGET_REVIEW', reason: 'Quote reviewed', expectedRevision: 2, currentRevision: 2 }),
    ).toMatchObject({ valid: false, code: 'PREFERRED_QUOTE_REQUIRED' });
    expect(
      validateRestockTransition({ status: 'FOR_CANVASSING', action: 'SEND_TO_BUDGET_REVIEW', reason: 'Quote reviewed', hasPreferredQuote: true, expectedRevision: 1, currentRevision: 2 }),
    ).toMatchObject({ valid: false, code: 'REVISION_CONFLICT' });
  });

  it('derives partial and final receiving without over-receipt', () => {
    expect(restockReceiptStatus({ requestedQuantity: 10, receivedQuantity: 4, receivedNow: 2 })).toMatchObject({
      valid: true,
      total: 6,
      remaining: 4,
      status: 'PARTIALLY_RECEIVED',
    });
    expect(restockReceiptStatus({ requestedQuantity: 10, receivedQuantity: 4, receivedNow: 6 }).status).toBe('RESTOCKED');
    expect(restockReceiptStatus({ requestedQuantity: 10, receivedQuantity: 4, receivedNow: 7 }).code).toBe('OVER_RECEIPT');
  });
});
