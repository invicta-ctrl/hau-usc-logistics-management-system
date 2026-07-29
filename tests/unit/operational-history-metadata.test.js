import { describe, expect, it } from 'vitest';

import { parseHistoryMetadata } from '../../src/server/d1/operational-service.js';

describe('operational history metadata projection', () => {
  it('preserves valid objects and fails closed for malformed or non-object legacy values', () => {
    expect(parseHistoryMetadata('{"source":"synthetic"}')).toEqual({ source: 'synthetic' });
    expect(parseHistoryMetadata('{malformed')).toEqual({});
    expect(parseHistoryMetadata('["not-an-object"]')).toEqual({});
    expect(parseHistoryMetadata('')).toEqual({});
  });
});
