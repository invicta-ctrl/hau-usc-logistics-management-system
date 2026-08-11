import { AUTH_API_ROUTES } from '../../auth/http-contract.js';
import { authCookieNames, serializeAuthCookie } from './cookies.js';
import { AuthError } from './service.js';

function cookies(request) {
  return Object.fromEntries(
    String(request.headers.get('cookie') ?? '')
      .split(';')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const separator = part.indexOf('=');
        if (separator < 0) return [part, ''];
        try {
          return [part.slice(0, separator), decodeURIComponent(part.slice(separator + 1))];
        } catch {
          throw new AuthError('SESSION_INVALID');
        }
      }),
  );
}

async function jsonBody(request) {
  try {
    return await request.json();
  } catch {
    throw new AuthError('ONBOARDING_INVALID');
  }
}

function json(value, { status = 200, cookieHeaders = [], correlationId = '', apiHeaders = {} } = {}) {
  const headers = new Headers(apiHeaders);
  headers.set('content-type', 'application/json; charset=utf-8');
  headers.set('cache-control', 'no-store');
  if (correlationId) headers.set('x-correlation-id', correlationId);
  for (const cookie of cookieHeaders) headers.append('set-cookie', cookie);
  return new Response(JSON.stringify(value), { status, headers });
}

export function statusForAuthError(error) {
  if (error.code === 'AUTHENTICATION_THROTTLED') return 429;
  if (
    [
      'SESSION_REQUIRED',
      'SESSION_INVALID',
      'AUTHENTICATION_FAILED',
      'ACTIVATION_INVALID',
      'RESET_INVALID',
    ].includes(error.code)
  )
    return 401;
  if (
    [
      'CAPABILITY_REQUIRED',
      'OUT_OF_SCOPE',
      'ENTITY_SCOPE_REQUIRED',
      'CSRF_INVALID',
      'ACCOUNT_UNAVAILABLE',
    ].includes(error.code)
  )
    return 403;
  if (
    ['ACCOUNT_EXISTS', 'ACTIVATION_REPLAYED', 'RESET_CONFLICT', 'SELF_ACCESS_CHANGE_BLOCKED'].includes(
      error.code,
    )
  )
    return 409;
  return 422;
}

function publicResult(result, tokenField) {
  const safe = { ...result };
  delete safe[tokenField];
  return safe;
}

export function createAuthHttpHandler({
  service,
  secureCookies = true,
  correlationId = '',
  apiHeaders = {},
} = {}) {
  if (!service) throw new Error('Authentication service is required.');
  const cookieNames = authCookieNames({ secure: secureCookies });
  const respond = (value, options = {}) => json(value, { ...options, correlationId, apiHeaders });
  const errorResult = (value) => ({ ...value, ...(correlationId ? { correlationId } : {}) });
  return async function handleAuthRequest(request) {
    try {
      const url = new URL(request.url);
      const cookieValues = cookies(request);
      const csrfToken = request.headers.get('x-csrf-token') ?? '';
      if (url.pathname === AUTH_API_ROUTES.session && request.method === 'GET') {
        return respond(await service.getSession({ sessionToken: cookieValues[cookieNames.session] }));
      }
      if (url.pathname === AUTH_API_ROUTES.login && request.method === 'POST') {
        const body = await jsonBody(request);
        const result = await service.login({
          accessId: body.accessId,
          password: body.password,
          networkKey: request.headers.get('cf-connecting-ip') ?? 'untrusted-local',
        });
        if (result.state === 'ACTIVATION_REQUIRED') {
          return respond(publicResult(result, 'activationToken'), {
            cookieHeaders: [
              serializeAuthCookie(cookieNames.activation, result.activationToken, {
                secure: secureCookies,
                maxAgeSeconds: Math.max(
                  1,
                  Math.floor((new Date(result.expiresAt).getTime() - Date.now()) / 1000),
                ),
              }),
            ],
          });
        }
        return respond(publicResult(result, 'sessionToken'), {
          cookieHeaders: [
            serializeAuthCookie(cookieNames.session, result.sessionToken, { secure: secureCookies }),
          ],
        });
      }
      if (url.pathname === AUTH_API_ROUTES.activate && request.method === 'POST') {
        const body = await jsonBody(request);
        const result = await service.activateStarter({
          activationToken: cookieValues[cookieNames.activation],
          csrfToken,
          profile: body.profile,
          password: body.password,
          confirmPassword: body.confirmPassword,
        });
        return respond(publicResult(result, 'sessionToken'), {
          cookieHeaders: [
            serializeAuthCookie(cookieNames.activation, '', { secure: secureCookies, clear: true }),
            serializeAuthCookie(cookieNames.session, result.sessionToken, { secure: secureCookies }),
          ],
        });
      }
      if (url.pathname === AUTH_API_ROUTES.logout && request.method === 'POST') {
        const result = await service.logout({ sessionToken: cookieValues[cookieNames.session], csrfToken });
        return respond(result, {
          cookieHeaders: [
            serializeAuthCookie(cookieNames.session, '', { secure: secureCookies, clear: true }),
          ],
        });
      }
      if (url.pathname === AUTH_API_ROUTES.resetComplete && request.method === 'POST') {
        const body = await jsonBody(request);
        return respond(await service.completePasswordReset(body));
      }
      return respond(errorResult({ code: 'NOT_FOUND', message: 'The authentication route was not found.' }), {
        status: 404,
      });
    } catch (error) {
      if (error instanceof AuthError) {
        return respond(
          errorResult({
            code: error.code,
            message: error.message,
            ...(error.fieldErrors ? { fieldErrors: error.fieldErrors } : {}),
            ...(error.retryAfterMs ? { retryAfterMs: error.retryAfterMs } : {}),
          }),
          { status: statusForAuthError(error) },
        );
      }
      return respond(
        errorResult({
          code: 'AUTH_INTERNAL_ERROR',
          message: 'The authentication service is temporarily unavailable.',
        }),
        { status: 500 },
      );
    }
  };
}
