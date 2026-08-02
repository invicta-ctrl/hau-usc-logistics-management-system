import { afterEach, describe, expect, it, vi } from 'vitest';
import { clearAuthSession, setAuthSession } from '../../src/auth/session-state.js';
import { HttpApiAdapter } from '../../src/services/http-api-adapter.js';

describe('HttpApiAdapter', () => {
  afterEach(() => {
    clearAuthSession();
    vi.unstubAllGlobals();
  });

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

  it('routes protected evidence status reads to the System Owner endpoint', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true, primaryR2Status: 'AVAILABLE' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await new HttpApiAdapter('').getEvidenceSystemStatus({});

    expect(result).toMatchObject({ ok: true, primaryR2Status: 'AVAILABLE' });
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/owner/evidence/status',
      expect.objectContaining({ method: 'POST', credentials: 'include' }),
    );
  });

  it('routes every protected access-policy and identity-roster method', async () => {
    const fetchMock = vi.fn().mockImplementation(() =>
      Promise.resolve(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      ),
    );
    vi.stubGlobal('fetch', fetchMock);
    setAuthSession({ csrfToken: 'csrf-contract', user: { id: 'USR-OWNER' } });
    const adapter = new HttpApiAdapter('');

    for (const [method, path] of [
      ['getAccessPolicyOptions', '/api/admin/access/options'],
      ['previewAccessPolicy', '/api/admin/access/preview-policy'],
      ['updateAccessPolicy', '/api/admin/access/update-policy'],
      ['getIdentityRosterStatus', '/api/owner/identity-roster/status'],
      ['listIdentityRoster', '/api/owner/identity-roster/directory'],
      ['previewIdentityRosterSync', '/api/owner/identity-roster/preview'],
      ['applyIdentityRosterSync', '/api/owner/identity-roster/apply'],
      ['rollbackIdentityRosterSync', '/api/owner/identity-roster/rollback'],
      ['getIdentityRosterSelfProfile', '/api/identity-roster/self'],
    ]) {
      await adapter[method]({ synthetic: true });
      expect(fetchMock).toHaveBeenLastCalledWith(
        path,
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
          headers: expect.objectContaining({ 'x-csrf-token': 'csrf-contract' }),
        }),
      );
    }
  });

  it('preserves safe server errors and correlation references', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            ok: false,
            code: 'ACCESS_POLICY_DENIED',
            message: 'You are not allowed to change this access policy.',
            correlationId: 'CORR-CONTRACT',
          }),
          { status: 403, headers: { 'content-type': 'application/json' } },
        ),
      ),
    );

    await expect(new HttpApiAdapter('').updateAccessPolicy({})).rejects.toMatchObject({
      code: 'ACCESS_POLICY_DENIED',
      message: 'You are not allowed to change this access policy.',
      correlationId: 'CORR-CONTRACT',
      retryable: false,
    });
  });
});
