import { describe, expect, it } from 'vitest';
import { optionalOperationalInteger, operationalInteger } from '../../src/domain/operational-integers.js';

describe('strict operational integer validation', () => {
  it('accepts primitive integer values and canonical decimal strings', () => {
    expect(operationalInteger(1, { field: 'quantity', min: 1 })).toBe(1);
    expect(operationalInteger('1', { field: 'quantity', min: 1 })).toBe(1);
    expect(operationalInteger('0', { field: 'threshold', min: 0 })).toBe(0);
    expect(operationalInteger(0, { field: 'threshold', min: 0 })).toBe(0);
  });

  it('enforces configured minimums and maximums with field-safe errors', () => {
    expect(() => operationalInteger(0, { field: 'quantity', min: 1 })).toThrowError(
      expect.objectContaining({
        code: 'VALIDATION_ERROR',
        fieldErrors: { quantity: 'quantity must be at least 1.' },
      }),
    );
    expect(() => operationalInteger('11', { field: 'quantity', min: 1, max: 10 })).toThrowError(
      expect.objectContaining({
        code: 'VALIDATION_ERROR',
        fieldErrors: { quantity: 'quantity must be at most 10.' },
      }),
    );
  });

  it.each(['2.02', '2.03', '0.06', '1e2', '1E2', '+1', '01', '-0', '', ' ', '\t1'])(
    '%s is rejected as non-canonical input',
    (value) => {
      expect(() => operationalInteger(value, { field: 'quantity' })).toThrowError(
        expect.objectContaining({ code: 'VALIDATION_ERROR', fieldErrors: expect.any(Object) }),
      );
    },
  );

  it.each([2.02, 2.03, 0.06, Infinity, -Infinity, NaN, -0, true, false, null, {}, [], 9007199254740992])(
    'rejects ambiguous or unsafe value %s',
    (value) => {
      expect(() => operationalInteger(value, { field: 'quantity' })).toThrowError(
        expect.objectContaining({ code: 'VALIDATION_ERROR' }),
      );
    },
  );

  it('accepts only omitted values for the optional validator', () => {
    expect(optionalOperationalInteger(undefined, { field: 'threshold', min: 0 })).toBeUndefined();
    expect(optionalOperationalInteger(null, { field: 'threshold', min: 0 })).toBeUndefined();
    expect(optionalOperationalInteger('0', { field: 'threshold', min: 0 })).toBe(0);
    expect(() => optionalOperationalInteger(' ', { field: 'threshold', min: 0 })).toThrowError(
      expect.objectContaining({ code: 'VALIDATION_ERROR' }),
    );
  });
});
