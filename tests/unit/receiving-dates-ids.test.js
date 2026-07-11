import { describe, expect, it } from 'vitest';
import { receiptTotals, validateReceipt, receivingStatus } from '../../src/domain/receiving.js';
import { addDays, businessDaysBetween, formatDateOnly, meetsLeadTime } from '../../src/domain/dates.js';
import { allocateId, yearFromDate } from '../../src/domain/ids.js';

describe('cumulative receiving', () => {
  it('derives totals from immutable receipt rows', () =>
    expect(
      receiptTotals(
        [
          { relatedId: 'D', quantityReceived: 5, quantityDamaged: 1 },
          { relatedId: 'D', quantityReceived: 5, quantityRejected: 2 },
        ],
        'D',
      ),
    ).toEqual({ received: 10, damaged: 1, rejected: 2 }));
  it('supports partial then final receiving', () => {
    const partial = validateReceipt({ requiredTotal: 10, alreadyReceived: 0, quantityReceivedNow: 4 });
    expect(
      receivingStatus({
        receivedTotal: partial.receivedTotal,
        requiredTotal: 10,
        finalStatus: 'READY_TO_RELEASE',
      }),
    ).toBe('PARTIALLY_RECEIVED');
    const final = validateReceipt({ requiredTotal: 10, alreadyReceived: 4, quantityReceivedNow: 6 });
    expect(
      receivingStatus({
        receivedTotal: final.receivedTotal,
        requiredTotal: 10,
        finalStatus: 'READY_TO_RELEASE',
      }),
    ).toBe('READY_TO_RELEASE');
  });
  it('rejects over-receiving without an amendment', () =>
    expect(() => validateReceipt({ requiredTotal: 10, alreadyReceived: 8, quantityReceivedNow: 3 })).toThrow(
      /exceeds/,
    ));
});

describe('Asia/Manila-safe date-only helpers', () => {
  it('keeps a date stable without browser-midnight parsing', () =>
    expect(formatDateOnly('2026-01-01')).toMatch(/Jan 1, 2026/));
  it('handles year boundaries explicitly', () => expect(addDays('2026-12-31', 1)).toBe('2027-01-01'));
  it('excludes weekends and configured exam weeks', () => {
    expect(
      businessDaysBetween('2026-07-10', '2026-07-20', [{ start: '2026-07-13', end: '2026-07-17' }]),
    ).toBe(1);
    expect(
      meetsLeadTime({
        submittedOn: '2026-07-10',
        neededOn: '2026-07-20',
        businessWeeks: 1,
        examWeeks: [{ start: '2026-07-13', end: '2026-07-17' }],
      }).compliant,
    ).toBe(false);
  });
  it('allocates display IDs using the supplied date year', () => {
    const state = { counters: {} };
    expect(allocateId(state, 'REQ', yearFromDate('2026-12-31'))).toMatch(/^REQ-2026-/);
    expect(allocateId(state, 'REQ', yearFromDate('2027-01-01'))).toMatch(/^REQ-2027-/);
  });
});
