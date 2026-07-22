import { describe, expect, it } from 'vitest';
import {
  AUTH_COOKIE,
  DEVELOPMENT_AUTH_COOKIE,
  authCookieNames,
  serializeAuthCookie,
} from '../../src/server/auth/cookies.js';

describe('authentication cookie contract', () => {
  it('uses host-only secure HttpOnly session cookies', () => {
    expect(serializeAuthCookie(AUTH_COOKIE.session, 'opaque-token', { maxAgeSeconds: 3600 })).toBe(
      '__Host-hau_session=opaque-token; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=3600',
    );
  });

  it('clears cookies without retaining a token', () => {
    expect(serializeAuthCookie(AUTH_COOKIE.activation, 'ignored', { clear: true })).toContain(
      '__Host-hau_activation=; Path=/; HttpOnly; SameSite=Lax; Secure; Max-Age=0',
    );
  });

  it('uses a non-Host-prefixed cookie only for explicit local HTTP development', () => {
    expect(authCookieNames({ secure: true })).toBe(AUTH_COOKIE);
    expect(authCookieNames({ secure: false })).toBe(DEVELOPMENT_AUTH_COOKIE);
    expect(serializeAuthCookie(DEVELOPMENT_AUTH_COOKIE.session, 'local-token', { secure: false }))
      .toBe('hau_local_session=local-token; Path=/; HttpOnly; SameSite=Lax');
  });
});
