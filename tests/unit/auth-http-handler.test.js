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

  it('keeps correlation and security headers aligned without dropping cookies', async () => {
    const service = {
      login: vi.fn().mockResolvedValue({
        state: 'AUTHENTICATED',
        sessionToken: 'raw-session-token',
        csrfToken: 'csrf-token',
        user: { accountId: 'SYNTHETIC-001' },
      }),
    };
    const handle = createAuthHttpHandler({
      service,
      correlationId: 'REQ_AUTHBOUNDARY123',
      apiHeaders: {
        'x-content-type-options': 'nosniff',
        'referrer-policy': 'no-referrer',
        'permissions-policy': 'camera=(), geolocation=(), microphone=()',
      },
    });
    const success = await handle(
      new Request('https://logistics.example.test/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ accessId: 'SYNTHETIC', password: 'not-logged' }),
      }),
    );

    expect(success.headers.get('x-correlation-id')).toBe('REQ_AUTHBOUNDARY123');
    expect(success.headers.get('cache-control')).toBe('no-store');
    expect(success.headers.get('x-content-type-options')).toBe('nosniff');
    expect(success.headers.get('referrer-policy')).toBe('no-referrer');
    expect(success.headers.get('permissions-policy')).toContain('camera=()');
    expect(success.headers.get('set-cookie')).toContain('__Host-hau_session=raw-session-token');

    const denied = createAuthHttpHandler({
      service: { login: vi.fn().mockRejectedValue(new AuthError('AUTHENTICATION_FAILED')) },
      correlationId: 'REQ_AUTHBOUNDARY456',
      apiHeaders: { 'x-content-type-options': 'nosniff' },
    });
    const failure = await denied(
      new Request('https://logistics.example.test/api/auth/login', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ accessId: 'SYNTHETIC', password: 'not-logged' }),
      }),
    );

    expect(failure.headers.get('x-correlation-id')).toBe('REQ_AUTHBOUNDARY456');
    await expect(failure.json()).resolves.toMatchObject({
      code: 'AUTHENTICATION_FAILED',
      correlationId: 'REQ_AUTHBOUNDARY456',
    });
  });

  it('fails closed with a safe correlated response for malformed cookies', async () => {
    const service = { getSession: vi.fn() };
    const handle = createAuthHttpHandler({
      service,
      correlationId: 'REQ_BADCOOKIE123',
      apiHeaders: { 'x-content-type-options': 'nosniff' },
    });
    const response = await handle(
      new Request('https://logistics.example.test/api/auth/session', {
        headers: { cookie: '__Host-hau_session=%' },
      }),
    );

    expect(response.status).toBe(401);
    expect(response.headers.get('x-correlation-id')).toBe('REQ_BADCOOKIE123');
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('x-content-type-options')).toBe('nosniff');
    await expect(response.json()).resolves.toMatchObject({
      code: 'SESSION_INVALID',
      correlationId: 'REQ_BADCOOKIE123',
    });
    expect(service.getSession).not.toHaveBeenCalled();
  });

  it('keeps password-reset completion inside the safe correlated HTTP boundary', async () => {
    const service = {
      completePasswordReset: vi.fn().mockResolvedValue({ ok: true, sessionsRevoked: 2 }),
    };
    const handle = createAuthHttpHandler({ service, correlationId: 'REQ_RESETBOUNDARY123' });
    const response = await handle(
      new Request('https://logistics.example.test/api/auth/reset/complete', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          resetToken: 'not-returned',
          password: 'Good!Pass123',
          confirmPassword: 'Good!Pass123',
        }),
      }),
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('x-correlation-id')).toBe('REQ_RESETBOUNDARY123');
    await expect(response.json()).resolves.toEqual({ ok: true, sessionsRevoked: 2 });
    expect(service.completePasswordReset).toHaveBeenCalledWith(
      expect.objectContaining({ resetToken: 'not-returned' }),
    );
  });

  it('maps reset conflicts and unexpected reset failures without exposing request secrets', async () => {
    const resetToken = 'raw-reset-token-should-not-leak';
    const password = 'Raw!Password9472';
    const accountId = 'ACCOUNT-PRIVATE-001';
    const cause = `raw database cause for ${accountId}`;
    const request = () =>
      new Request('https://logistics.example.test/api/auth/reset/complete', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ resetToken, password, confirmPassword: password }),
      });
    const conflict = createAuthHttpHandler({
      service: { completePasswordReset: vi.fn().mockRejectedValue(new AuthError('RESET_CONFLICT')) },
      correlationId: 'REQ_RESET_CONFLICT_001',
    });

    const conflictResponse = await conflict(request());
    const conflictBody = await conflictResponse.text();
    expect(conflictResponse.status).toBe(409);
    expect(conflictResponse.headers.get('x-correlation-id')).toBe('REQ_RESET_CONFLICT_001');
    expect(conflictBody).toContain('RESET_CONFLICT');
    expect(conflictBody).not.toContain(resetToken);
    expect(conflictBody).not.toContain(password);
    expect(conflictBody).not.toContain(accountId);

    const failed = createAuthHttpHandler({
      service: { completePasswordReset: vi.fn().mockRejectedValue(new Error(cause)) },
      correlationId: 'REQ_RESET_FAILURE_001',
    });
    const failedResponse = await failed(request());
    const failedBody = await failedResponse.text();
    expect(failedResponse.status).toBe(500);
    expect(failedResponse.headers.get('x-correlation-id')).toBe('REQ_RESET_FAILURE_001');
    expect(failedBody).toContain('AUTH_INTERNAL_ERROR');
    expect(failedBody).not.toContain(resetToken);
    expect(failedBody).not.toContain(password);
    expect(failedBody).not.toContain(accountId);
    expect(failedBody).not.toContain(cause);
  });
});
