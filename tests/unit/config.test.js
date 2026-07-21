import { describe, expect, it } from 'vitest';
import { booleanFlag } from '../../src/app/config.js';

describe('runtime feature flags', () => {
  it('parses explicit string booleans without treating false as truthy', () => {
    expect(booleanFlag('true', false)).toBe(true);
    expect(booleanFlag('false', true)).toBe(false);
  });

  it('uses the fail-closed fallback for unsupported values', () => {
    expect(booleanFlag('enabled', false)).toBe(false);
    expect(booleanFlag(undefined, false)).toBe(false);
  });
});
