import { isValidRecoveryHostname, normalizeEnvironment } from '../server/environment.js';

const ENTRY_PATH_BY_HOST = Object.freeze({
  'logistics.hausc.org': null,
  'request.hausc.org': '/request',
  'lending.hausc.org': '/lending',
});

const UNKNOWN_HOST_HEADERS = Object.freeze({
  'cache-control': 'no-store',
  'content-type': 'text/plain; charset=utf-8',
  'referrer-policy': 'no-referrer',
  'x-content-type-options': 'nosniff',
});

function redirectLocation(url, pathname) {
  const target = new URL(url);
  target.pathname = pathname;
  return target.href;
}

export function resolveHostRoute(input, environment, recoveryHostname) {
  const url = input instanceof URL ? input : new URL(input);
  const runtimeEnvironment = normalizeEnvironment(environment);
  if (runtimeEnvironment === 'DEVELOPMENT') return { action: 'allow' };
  if (runtimeEnvironment !== 'STAGING' && runtimeEnvironment !== 'PRODUCTION') {
    return { action: 'reject' };
  }

  const hostname = url.hostname.toLowerCase();
  if (isValidRecoveryHostname(recoveryHostname) && hostname === recoveryHostname) {
    return { action: 'allow' };
  }

  if (!Object.hasOwn(ENTRY_PATH_BY_HOST, hostname)) return { action: 'reject' };
  const entryPath = ENTRY_PATH_BY_HOST[hostname];
  if (entryPath && url.pathname === '/') {
    return { action: 'redirect', location: redirectLocation(url, entryPath) };
  }
  return { action: 'allow' };
}

export function responseForHostRoute(route) {
  if (route.action === 'redirect') {
    return new Response(null, {
      status: 307,
      headers: { 'cache-control': 'no-store', location: route.location },
    });
  }
  if (route.action === 'reject') {
    return new Response('This host is not available.', {
      status: 404,
      headers: UNKNOWN_HOST_HEADERS,
    });
  }
  return null;
}
