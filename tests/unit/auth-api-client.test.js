import { afterEach, describe, expect, it, vi } from 'vitest';
import { AuthApiClient } from '../../src/services/auth-api-client.js';

describe('authentication API client', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('uses credentialed requests and sends CSRF only for the supplied session', async () => {
    const fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ state: 'AUTHENTICATED' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetch);
    const client = new AuthApiClient('https://api.example.test/');

    await client.activate({ profile: {}, password: 'new', confirmPassword: 'new', csrfToken: 'csrf-token' });

    expect(fetch).toHaveBeenCalledWith(
      'https://api.example.test/api/auth/activate',
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        headers: expect.objectContaining({ 'x-csrf-token': 'csrf-token' }),
      }),
    );
  });

  it('treats missing sessions as signed out without swallowing server failures', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            code: 'SESSION_REQUIRED',
            message: 'Sign in to continue.',
          }),
          { status: 401, headers: { 'content-type': 'application/json' } },
        ),
      ),
    );
    await expect(new AuthApiClient().getSession()).resolves.toBeNull();
  });

  it('preserves the expired-session state so the login can explain why reauthentication is required', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            code: 'SESSION_INVALID',
            message: 'Your session is invalid or expired. Sign in again.',
          }),
          { status: 401, headers: { 'content-type': 'application/json' } },
        ),
      ),
    );
    await expect(new AuthApiClient().getSession()).rejects.toMatchObject({ code: 'SESSION_INVALID' });
  });

  it('prefers the response correlation header and safely normalizes transport failure', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            code: 'AUTHENTICATION_FAILED',
            message: 'The Access ID or password is incorrect.',
            correlationId: 'REQ_BODY_REFERENCE',
          }),
          {
            status: 401,
            headers: {
              'content-type': 'application/json',
              'x-correlation-id': 'REQ_HEADER_REFERENCE',
            },
          },
        ),
      )
      .mockRejectedValueOnce(new Error('private network diagnostics'));
    vi.stubGlobal('fetch', fetch);
    const client = new AuthApiClient();

    await expect(client.login('SYNTHETIC', 'not-logged')).rejects.toMatchObject({
      correlationId: 'REQ_HEADER_REFERENCE',
    });
    await expect(client.login('SYNTHETIC', 'not-logged')).rejects.toMatchObject({
      code: 'AUTH_SERVICE_UNAVAILABLE',
      message: 'The authentication service is temporarily unavailable.',
      retryable: true,
    });
  });

  it('reads the authoritative same-origin Worker release identity', async () => {
    const fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          ok: true,
          environment: 'PRODUCTION',
          appVersion: '0.7.1',
          candidateSha: 'a'.repeat(40),
        }),
        { status: 200, headers: { 'content-type': 'application/json' } },
      ),
    );
    vi.stubGlobal('fetch', fetch);

    await expect(new AuthApiClient().getReleaseIdentity()).resolves.toMatchObject({
      environment: 'PRODUCTION',
      appVersion: '0.7.1',
    });
    expect(fetch).toHaveBeenCalledWith(
      '/api/version',
      expect.objectContaining({ method: 'GET', credentials: 'include' }),
    );
  });

  it('keeps applicant status authority in a bearer header and out of the URL', async () => {
    const fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true, state: 'PENDING_ADMIN_REVIEW' }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetch);
    const client = new AuthApiClient('https://api.example.test');

    await client.getAccountApplicationStatus('opaque-private-status-token');

    expect(fetch).toHaveBeenCalledWith(
      'https://api.example.test/api/account-applications/status',
      expect.objectContaining({
        method: 'GET',
        headers: expect.objectContaining({ authorization: 'Bearer opaque-private-status-token' }),
      }),
    );
    expect(fetch.mock.calls[0][0]).not.toContain('opaque-private-status-token');
  });

  it('encodes review identifiers and sends governed mutations with CSRF', async () => {
    const fetch = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      }),
    );
    vi.stubGlobal('fetch', fetch);
    const client = new AuthApiClient('https://api.example.test');

    await client.decideAccountApplication(
      'director',
      'APP / synthetic',
      'approve',
      { expectedRevision: 3 },
      'csrf-review',
    );

    expect(fetch).toHaveBeenCalledWith(
      'https://api.example.test/api/director/account-applications/APP%20%2F%20synthetic/approve',
      expect.objectContaining({
        method: 'POST',
        headers: expect.objectContaining({ 'x-csrf-token': 'csrf-review' }),
      }),
    );
  });
});
