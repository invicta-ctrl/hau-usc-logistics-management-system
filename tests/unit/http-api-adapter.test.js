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
      ['previewCanonicalIdentityReconciliation', '/api/owner/identity-foundation/reconciliation-preview'],
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

  it('routes every governed announcement and Link Registry operation', async () => {
    const fetchMock = vi.fn().mockImplementation(() =>
      Promise.resolve(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        }),
      ),
    );
    vi.stubGlobal('fetch', fetchMock);
    setAuthSession({ csrfToken: 'csrf-reference-contract', user: { id: 'USR-ADMIN' } });
    const adapter = new HttpApiAdapter('');

    for (const [method, path] of [
      ['listAdvertisements', '/api/admin/advertisements/list'],
      ['previewAdvertisement', '/api/admin/advertisements/preview'],
      ['saveAdvertisement', '/api/admin/advertisements/save'],
      ['uploadAdvertisementMedia', '/api/admin/advertisements/upload'],
      ['publishAdvertisement', '/api/admin/advertisements/publish'],
      ['scheduleAdvertisement', '/api/admin/advertisements/schedule'],
      ['pauseAdvertisement', '/api/admin/advertisements/pause'],
      ['resumeAdvertisement', '/api/admin/advertisements/resume'],
      ['archiveAdvertisement', '/api/admin/advertisements/archive'],
      ['listReferenceLinks', '/api/admin/reference-links/list'],
      ['getReferenceLink', '/api/admin/reference-links/get'],
      ['getReferenceLinkHistory', '/api/admin/reference-links/history'],
      ['createReferenceLink', '/api/admin/reference-links/create'],
      ['updateReferenceLink', '/api/admin/reference-links/update'],
      ['transitionReferenceLink', '/api/admin/reference-links/transition'],
    ]) {
      await adapter[method]({ synthetic: true });
      expect(fetchMock).toHaveBeenLastCalledWith(
        path,
        expect.objectContaining({
          method: 'POST',
          credentials: 'include',
          headers: expect.objectContaining({ 'x-csrf-token': 'csrf-reference-contract' }),
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

  it('propagates the response correlation header on success and normalizes transport failure', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ok: true, changed: true }), {
          status: 200,
          headers: {
            'content-type': 'application/json',
            'x-correlation-id': 'REQ_ACCESSRESULT123',
          },
        }),
      )
      .mockRejectedValueOnce(new Error('private transport detail'));
    vi.stubGlobal('fetch', fetchMock);
    const adapter = new HttpApiAdapter('');

    await expect(adapter.updateAccessPolicy({})).resolves.toMatchObject({
      changed: true,
      correlationId: 'REQ_ACCESSRESULT123',
    });
    await expect(adapter.listAccessAccounts({})).rejects.toMatchObject({
      code: 'HTTP_SERVICE_UNAVAILABLE',
      message: 'The service is temporarily unavailable.',
      retryable: true,
    });
  });
});
