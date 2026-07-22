import { afterEach, describe, expect, it, vi } from 'vitest';
import { HttpApiAdapter } from '../../src/services/http-api-adapter.js';

describe('HttpApiAdapter', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('uses same-origin API paths when no explicit base URL is configured', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true, requestId: 'REQ-SYNTHETIC' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await new HttpApiAdapter('').submitRequest({ purpose: 'Synthetic request' });

    expect(result).toMatchObject({ ok: true, requestId: 'REQ-SYNTHETIC' });
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/submitRequest',
      expect.objectContaining({ method: 'POST', credentials: 'include' }),
    );
  });

  it('exposes the staged essential and module bootstrap endpoints', async () => {
    const fetchMock = vi.fn().mockImplementation(() =>
      Promise.resolve(
        new Response(JSON.stringify({ ok: true, requestOnly: true }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      ),
    );
    vi.stubGlobal('fetch', fetchMock);
    const adapter = new HttpApiAdapter('');

    await adapter.getEssentialBootstrapData({ requestOnly: true });
    await adapter.getBootstrapModule({ requestOnly: true, module: 'request' });

    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      '/api/getEssentialBootstrapData',
      '/api/getBootstrapModule',
    ]);
  });
});
