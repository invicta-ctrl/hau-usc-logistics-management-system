import { describe, expect, it, vi } from 'vitest';
import { resolveHostRoute, responseForHostRoute } from '../../src/worker/host-routing.js';
import worker from '../../src/worker/index.js';

const RECOVERY_HOSTNAME = 'recovery.workers.dev';

describe('production host routing', () => {
  it.each(['PRODUCTION', 'STAGING'])(
    'redirects dedicated public roots in %s without changing host or query',
    (environment) => {
      const requestRoute = resolveHostRoute(
        'https://request.hausc.org/?source=directory',
        environment,
        RECOVERY_HOSTNAME,
      );
      const lendingRoute = resolveHostRoute(
        'https://lending.hausc.org/?source=directory',
        environment,
        RECOVERY_HOSTNAME,
      );

      expect(requestRoute).toEqual({
        action: 'redirect',
        location: 'https://request.hausc.org/request?source=directory',
      });
      expect(lendingRoute).toEqual({
        action: 'redirect',
        location: 'https://lending.hausc.org/lending?source=directory',
      });
    },
  );

  it('allows accepted canonical and deep paths, including the workers.dev recovery host', () => {
    for (const url of [
      'https://logistics.hausc.org/login',
      'https://logistics.hausc.org/request',
      'https://logistics.hausc.org/lending',
      'https://request.hausc.org/request/track/REQ-123?view=history',
      'https://lending.hausc.org/lending/track/LEND-123',
      'https://recovery.workers.dev/request',
    ]) {
      expect(resolveHostRoute(url, 'PRODUCTION', RECOVERY_HOSTNAME)).toEqual({ action: 'allow' });
    }
  });

  it('retains local and development host acceptance', () => {
    expect(resolveHostRoute('https://unknown.example/api/health', 'DEVELOPMENT', RECOVERY_HOSTNAME)).toEqual({
      action: 'allow',
    });
    expect(resolveHostRoute('https://localhost:8787/', 'DEVELOPMENT', RECOVERY_HOSTNAME)).toEqual({
      action: 'allow',
    });
  });

  it('passes Wrangler local development requests to static dispatch', async () => {
    const assetsFetch = vi.fn().mockResolvedValue(new Response('local asset'));
    const response = await worker.fetch(new Request('http://127.0.0.1:8787/'), {
      ENVIRONMENT: 'DEVELOPMENT',
      ASSETS: { fetch: assetsFetch },
    });

    expect(response.status).toBe(200);
    expect(await response.text()).toBe('local asset');
    expect(assetsFetch).toHaveBeenCalledTimes(1);
  });

  it('rejects accepted and recovery hosts when the environment is missing or unknown', () => {
    for (const environment of [undefined, 'UNRECOGNIZED']) {
      for (const hostname of [
        'logistics.hausc.org',
        'request.hausc.org',
        'lending.hausc.org',
        RECOVERY_HOSTNAME,
      ]) {
        expect(resolveHostRoute(`https://${hostname}/request`, environment, RECOVERY_HOSTNAME)).toEqual({
          action: 'reject',
        });
      }
    }
  });

  it.each([undefined, '', 'recovery.example.test', '*.workers.dev', 'RECOVERY.WORKERS.DEV'])(
    'rejects an invalid configured recovery hostname: %s',
    (recoveryHostname) => {
      expect(
        resolveHostRoute(`https://${RECOVERY_HOSTNAME}/request`, 'STAGING', recoveryHostname),
      ).toEqual({ action: 'reject' });
    },
  );

  it.each(['PRODUCTION', 'STAGING'])(
    'returns a bounded no-store response for an unknown %s host',
    async (environment) => {
      const response = responseForHostRoute(
        resolveHostRoute('https://unknown.hausc.org/api/health', environment, RECOVERY_HOSTNAME),
      );

      expect(response.status).toBe(404);
      expect(response.headers.get('cache-control')).toBe('no-store');
      expect(response.headers.get('content-type')).toBe('text/plain; charset=utf-8');
      expect(response.headers.get('set-cookie')).toBeNull();
      expect(await response.text()).toBe('This host is not available.');
    },
  );

  it('stops unknown and wrong recovery hosts before API or static-asset dispatch', async () => {
    const assetsFetch = vi.fn().mockResolvedValue(new Response('static asset'));
    const env = {
      ENVIRONMENT: 'PRODUCTION',
      RECOVERY_HOSTNAME,
      ASSETS: { fetch: assetsFetch },
    };

    const apiResponse = await worker.fetch(
      new Request('https://unknown.hausc.org/api/health'),
      env,
    );
    const wrongRecoveryResponse = await worker.fetch(
      new Request('https://wrong-recovery.workers.dev/api/health'),
      env,
    );
    const assetResponse = await worker.fetch(new Request('https://unknown.hausc.org/'), env);

    expect(apiResponse.status).toBe(404);
    expect(wrongRecoveryResponse.status).toBe(404);
    expect(assetResponse.status).toBe(404);
    expect(assetsFetch).not.toHaveBeenCalled();
  });

  it('uses a temporary method-preserving redirect for a dedicated root before static dispatch', async () => {
    const assetsFetch = vi.fn().mockResolvedValue(new Response('static asset'));
    const response = await worker.fetch(
      new Request('https://request.hausc.org/?source=directory', {
        method: 'POST',
        body: 'preserve-method',
      }),
      { ENVIRONMENT: 'PRODUCTION', RECOVERY_HOSTNAME, ASSETS: { fetch: assetsFetch } },
    );

    expect(response.status).toBe(307);
    expect(response.headers.get('location')).toBe(
      'https://request.hausc.org/request?source=directory',
    );
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(assetsFetch).not.toHaveBeenCalled();
  });

  it('passes accepted deep links through to the static asset handler unchanged', async () => {
    const assetsFetch = vi.fn().mockResolvedValue(new Response('deep link'));
    const response = await worker.fetch(
      new Request('https://request.hausc.org/request/track/REQ-123?view=history'),
      { ENVIRONMENT: 'STAGING', RECOVERY_HOSTNAME, ASSETS: { fetch: assetsFetch } },
    );

    expect(response.status).toBe(200);
    expect(new URL(assetsFetch.mock.calls[0][0].url).pathname).toBe('/request/track/REQ-123');
    expect(new URL(assetsFetch.mock.calls[0][0].url).search).toBe('?view=history');
  });
});
