import { describe, expect, it } from 'vitest';
import {
  REQUEST_PURPOSES,
  normalizeRequestPurpose,
  validateRequestPurpose,
  validateRequestPurposeCommand,
} from '../../src/domain/request-purpose.js';

describe('locked Request purpose branches', () => {
  it('normalizes and validates the two approved purposes', () => {
    expect(normalizeRequestPurpose(' event_activity_support ')).toBe(REQUEST_PURPOSES.EVENT_ACTIVITY_SUPPORT);
    expect(validateRequestPurpose({ purpose: 'office_inventory_pantry', requesterName: 'A' })).toBe(
      REQUEST_PURPOSES.OFFICE_INVENTORY_PANTRY,
    );
    expect(() => normalizeRequestPurpose('EVENT')).toThrowError(
      expect.objectContaining({ code: 'VALIDATION_ERROR', fieldErrors: expect.any(Object) }),
    );
  });

  it('rejects non-empty hidden office fields on an event request', () => {
    expect(() =>
      validateRequestPurpose({
        purpose: REQUEST_PURPOSES.EVENT_ACTIVITY_SUPPORT,
        eventId: 'EVT-1',
        stockArea: 'PANTRY',
      }),
    ).toThrowError(
      expect.objectContaining({
        code: 'VALIDATION_ERROR',
        fieldErrors: { stockArea: expect.stringContaining('not used') },
      }),
    );
  });

  it('rejects non-empty hidden event fields on an office request', () => {
    expect(() =>
      validateRequestPurpose({
        requestPurpose: REQUEST_PURPOSES.OFFICE_INVENTORY_PANTRY,
        eventSeriesId: 'SER-1',
        neededDate: '2026-09-01',
      }),
    ).toThrowError(
      expect.objectContaining({
        code: 'VALIDATION_ERROR',
        fieldErrors: { eventSeriesId: expect.stringContaining('not used') },
      }),
    );
  });

  it('allows shared fields and omitted/blank hidden controls', () => {
    expect(
      validateRequestPurpose({
        purpose: REQUEST_PURPOSES.EVENT_ACTIVITY_SUPPORT,
        requesterName: 'A',
        lines: [{ itemId: 'ITM-1', quantity: 1 }],
        stockArea: '',
        relatedRequestId: null,
        catalog: {},
      }),
    ).toBe(REQUEST_PURPOSES.EVENT_ACTIVITY_SUPPORT);
    expect(
      validateRequestPurposeCommand({
        requestPurpose: REQUEST_PURPOSES.OFFICE_INVENTORY_PANTRY,
        purpose: 'Replenish office supplies',
        requesterName: 'A',
        neededDate: '2026-09-01',
      }),
    ).toMatchObject({ requestPurpose: REQUEST_PURPOSES.OFFICE_INVENTORY_PANTRY });
  });

  it('rejects a contradictory legacy request type discriminator', () => {
    expect(() =>
      validateRequestPurpose({
        purpose: REQUEST_PURPOSES.EVENT_ACTIVITY_SUPPORT,
        requestType: 'CATALOG_RESTOCK',
      }),
    ).toThrowError(expect.objectContaining({ code: 'VALIDATION_ERROR', fieldErrors: expect.any(Object) }));
  });
});
