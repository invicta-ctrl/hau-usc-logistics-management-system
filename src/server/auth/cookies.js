export const AUTH_COOKIE = Object.freeze({
  session: '__Host-hau_session',
  activation: '__Host-hau_activation',
});

export function serializeAuthCookie(name, value, { maxAgeSeconds, secure = true, clear = false } = {}) {
  if (!Object.values(AUTH_COOKIE).includes(name)) throw new Error('Unsupported authentication cookie.');
  const parts = [
    `${name}=${clear ? '' : encodeURIComponent(String(value ?? ''))}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
  ];
  if (secure) parts.push('Secure');
  if (clear) {
    parts.push('Max-Age=0', 'Expires=Thu, 01 Jan 1970 00:00:00 GMT');
  } else if (Number.isFinite(maxAgeSeconds)) {
    parts.push(`Max-Age=${Math.max(0, Math.floor(maxAgeSeconds))}`);
  }
  return parts.join('; ');
}
