import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';

function validationContext() {
  const context = vm.createContext({
    Date,
    Error,
    Object,
    Array,
    JSON,
    Math,
    isFinite,
    isNaN,
  });
  vm.runInContext(readFileSync(resolve(import.meta.dirname, '../../apps-script/Validation.gs'), 'utf8') + '\nthis.clientSafeValue_ = clientSafeValue_;', context);
  return context;
}

describe('Apps Script bootstrap serialization boundary', () => {
  it('normalizes dates and unsupported values into JSON-safe output', () => {
    const ctx = validationContext();
    const sanitized = ctx.clientSafeValue_({
      validDate: new Date('2026-07-14T00:00:00.000Z'),
      invalidDate: new Date('not-a-date'),
      infinity: Number.POSITIVE_INFINITY,
      nan: Number.NaN,
      omitted: undefined,
      functionValue: () => {},
      nested: [undefined, () => {}, Symbol('synthetic'), 1n],
    });

    expect(sanitized).toEqual({
      validDate: '2026-07-14T00:00:00.000Z',
      invalidDate: '',
      infinity: null,
      nan: null,
      nested: [null, null, null, null],
    });
    expect(() => JSON.stringify(sanitized)).not.toThrow();
  });
});
