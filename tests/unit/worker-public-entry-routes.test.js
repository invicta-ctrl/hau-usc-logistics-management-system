import { describe, expect, it, vi } from 'vitest';
import { handlePublicEntryRoute } from '../../src/worker/public-entry-routes.js';

function request(path, method = 'GET', headers = {}) {
  return new Request(`https://playground.example${path}`, { method, headers });
}

function context(path, method = 'GET', overrides = {}) {
  const currentRequest = request(path, method, overrides.headers);
  return {
    request: currentRequest,
    url: new URL(currentRequest.url),
    requestId: 'MFR002-U10-PUBLIC',
    publicRequests: {
      options: vi.fn(async () => ({ ok: true, options: ['request'] })),
      submit: vi.fn(async (input) => ({ ok: true, input })),
      track: vi.fn(async (input) => ({ ok: true, input })),
      related: vi.fn(async (input) => ({ ok: true, input })),
    },
    publicLending: {
      catalog: vi.fn(async () => ({ ok: true, items: ['catalog'] })),
      submit: vi.fn(async (input) => ({ ok: true, input })),
      track: vi.fn(async (input) => ({ ok: true, input })),
    },
    publicAdvertisements: {
      list: vi.fn(async () => ({ ok: true, advertisements: ['published'] })),
    },
    json: vi.fn((value) => value),
    readBody: vi.fn(async () => ({ fixture: true })),
    assertMutationOrigin: vi.fn(),
    ...overrides,
  };
}

describe('MFR-002 U10 public Worker entry routes', () => {
  it('returns null without touching helpers when the route family does not match', async () => {
    const input = context('/api/session');

    await expect(handlePublicEntryRoute(input)).resolves.toBeNull();
    expect(input.json).not.toHaveBeenCalled();
    expect(input.readBody).not.toHaveBeenCalled();
    expect(input.assertMutationOrigin).not.toHaveBeenCalled();
  });

  it.each([
    ['/api/public/request/options', 'publicRequests', 'options', 'options'],
    ['/api/public/lending/catalog', 'publicLending', 'catalog', 'items'],
    ['/api/public/advertisements', 'publicAdvertisements', 'list', 'advertisements'],
  ])('dispatches safe public GET %s with the correlation ID', async (path, service, method, field) => {
    const input = context(path);

    const result = await handlePublicEntryRoute(input);

    expect(input[service][method]).toHaveBeenCalledOnce();
    expect(result).toMatchObject({ ok: true, correlationId: 'MFR002-U10-PUBLIC' });
    expect(result[field]).toBeDefined();
  });

  it.each([
    ['/api/public/request', 'publicRequests', 'submit'],
    ['/api/public/request/track', 'publicRequests', 'track'],
    ['/api/public/request/related', 'publicRequests', 'related'],
    ['/api/public/lending', 'publicLending', 'submit'],
    ['/api/public/lending/track', 'publicLending', 'track'],
  ])('guards and dispatches public mutation %s', async (path, service, method) => {
    const input = context(path, 'POST', { headers: { 'cf-connecting-ip': '203.0.113.10' } });

    await handlePublicEntryRoute(input);

    expect(input.assertMutationOrigin).toHaveBeenCalledWith(input.request);
    expect(input[service][method]).toHaveBeenCalledWith({
      command: { fixture: true },
      networkKey: '203.0.113.10',
      correlationId: 'MFR002-U10-PUBLIC',
    });
  });
});
