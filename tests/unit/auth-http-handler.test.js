import { describe, expect, it, vi } from 'vitest';
import { createAuthHttpHandler } from '../../src/server/auth/http-handler.js';
import { AuthError } from '../../src/server/auth/service.js';

describe('authentication HTTP boundary', () => {
  it('keeps activation tokens in an HttpOnly cookie and out of JSON', async () => {
    const service = {
      login: vi.fn().mockResolvedValue({
        state: 'ACTIVATION_REQUIRED',
        activationToken: 'raw-activation-token',
        csrfToken: 'csrf-token',
        expiresAt: new Date(Date.now() + 600_000).toISOString(),
      }),
    };
    const handle = createAuthHttpHandler({ service });
    const response = await handle(
      new Request('https://logistics.example.test/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'cf-connecting-ip': '192.0.2.1' },
        body: JSON.stringify({ accessId: 'HAU-ADMIN-001', password: 'not-logged' }),
      }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('set-cookie')).toContain('__Host-hau_activation=raw-activation-token');
    expect(response.headers.get('set-cookie')).toContain('HttpOnly');
    expect(await response.json()).toEqual({
      state: 'ACTIVATION_REQUIRED',
      csrfToken: 'csrf-token',
      expiresAt: expect.any(String),
    });
    expect(service.login).toHaveBeenCalledWith(expect.objectContaining({ networkKey: '192.0.2.1' }));
  });

  it('rotates activation into a normal session cookie without exposing the raw session token', async () => {
    const service = {
      activateStarter: vi.fn().mockResolvedValue({
        state: 'AUTHENTICATED',
        sessionToken: 'raw-session-token',
        csrfToken: 'next-csrf-token',
        user: { accountId: 'SYNTHETIC-001' },
      }),
    };
    const handle = createAuthHttpHandler({ service });
    const response = await handle(
      new Request('https://logistics.example.test/api/auth/activate', {
        method: 'POST',
        headers: {
          cookie: '__Host-hau_activation=raw-activation-token',
          'content-type': 'application/json',
          'x-csrf-token': 'csrf-token',
        },
        body: JSON.stringify({ profile: {}, password: 'new', confirmPassword: 'new' }),
      }),
    );

    expect(response.headers.get('set-cookie')).toContain('__Host-hau_activation=');
    expect(response.headers.get('set-cookie')).toContain('__Host-hau_session=raw-session-token');
    expect(await response.json()).toEqual({
      state: 'AUTHENTICATED',
      csrfToken: 'next-csrf-token',
      user: { accountId: 'SYNTHETIC-001' },
    });
    expect(service.activateStarter).toHaveBeenCalledWith(
      expect.objectContaining({
        activationToken: 'raw-activation-token',
        csrfToken: 'csrf-token',
      }),
    );
  });

  it('returns fixed safe errors and no secret-bearing details', async () => {
    const handle = createAuthHttpHandler({
      service: { login: vi.fn().mockRejectedValue(new AuthError('AUTHENTICATION_FAILED')) },
    });
    const response = await handle(
      new Request('https://logistics.example.test/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ accessId: 'HAU-ADMIN-001', password: 'secret-value' }),
      }),
    );
    const body = await response.text();

    expect(response.status).toBe(401);
    expect(body).toContain('AUTHENTICATION_FAILED');
    expect(body).not.toContain('secret-value');
    expect(body).not.toContain('HAU-ADMIN-001');
  });
});
