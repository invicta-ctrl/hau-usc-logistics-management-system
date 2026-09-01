import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { canCancelRequesterRequest } from '../../src/frontend/app/request/ExternalRequestCenter.tsx';
import { FrontendBackend } from '../../src/frontend/integration/backend.ts';

const root = resolve(fileURLToPath(new URL('../..', import.meta.url)));

async function source(relativePath) {
  return readFile(resolve(root, relativePath), 'utf8');
}

function response(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

afterEach(() => vi.unstubAllGlobals());

describe('FBR-001 Phase E requester cancellation', () => {
  it('offers cancellation only for the server-accepted requester states', () => {
    expect(canCancelRequesterRequest('FOR_REVIEW')).toBe(true);
    expect(canCancelRequesterRequest('ACCEPTED')).toBe(true);
    for (const status of ['CANCELLED', 'REJECTED', 'COMPLETED', 'READY_TO_RELEASE']) {
      expect(canCancelRequesterRequest(status)).toBe(false);
    }
  });

  it('uses the canonical adapter and preserves pending, conflict, denial, and authoritative refresh behavior', async () => {
    const component = await source('src/frontend/app/request/ExternalRequestCenter.tsx');
    const adapter = await source('src/frontend/integration/backend.ts');

    expect(component).toContain('frontendBackend.cancelRequesterRequest');
    expect(component).toContain('!inspection && canCancelRequesterRequest(request.status)');
    expect(component).toContain('setCancellingRequestId(requestId)');
    expect(component).toContain('disabled={cancellingRequestId === request.id}');
    expect(component).toContain("[403, 409].includes(api?.status ?? 0)");
    expect(component).toContain('setReload((current) => current + 1)');
    expect(component).toContain('clientRequestId: newClientRequestId()');
    expect(adapter).toContain("'/api/portal/request/cancel'");
    expect(adapter).toContain('csrf: true');
  });

  it('sends the requester cancellation through same-origin CSRF with the caller-provided idempotency key', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        response({
          state: 'AUTHENTICATED',
          csrfToken: 'csrf-requester-cancel',
          user: {
            accountId: 'REQUESTER-1',
            displayName: 'Requester',
            authorization: {
              active: true,
              mappingStatus: 'MAPPED',
              roleId: 'REQUESTER',
              capabilities: ['request.create'],
            },
          },
        }),
      )
      .mockResolvedValueOnce(response({ requestId: 'REQ-1', status: 'CANCELLED' }));
    vi.stubGlobal('fetch', fetchMock);
    const backend = new FrontendBackend();

    await backend.session();
    await expect(
      backend.cancelRequesterRequest({ requestId: 'REQ-1', clientRequestId: 'cancel-request-0001' }),
    ).resolves.toEqual({ id: 'REQ-1', status: 'CANCELLED' });
    expect(fetchMock).toHaveBeenLastCalledWith(
      '/api/portal/request/cancel',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        headers: expect.objectContaining({ 'x-csrf-token': 'csrf-requester-cancel' }),
        body: JSON.stringify({ requestId: 'REQ-1', clientRequestId: 'cancel-request-0001' }),
      }),
    );
  });
});
