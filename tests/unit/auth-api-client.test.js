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
});
