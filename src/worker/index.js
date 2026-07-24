import { CAPABILITIES } from '../domain/permissions.js';
import { AccessManagementError, createAccessManagementService } from '../server/access/service.js';
import { createPasswordKdf, createTokenCrypto } from '../server/auth/crypto.js';
import { AUTH_COOKIE, DEVELOPMENT_AUTH_COOKIE } from '../server/auth/cookies.js';
import { createAuthHttpHandler, statusForAuthError } from '../server/auth/http-handler.js';
import { AuthError, createAuthService } from '../server/auth/service.js';
import { createD1AuthRepository, createD1RateLimiter } from '../server/d1/auth-repository.js';
import { createD1AccessManagementRepository } from '../server/d1/access-management-repository.js';
import { ApiError, createD1OperationalService } from '../server/d1/operational-service.js';
import { environmentReadinessIssues, safeReleaseIdentity } from '../server/environment.js';
import { createCorrelationId, structuredLog } from '../server/observability.js';
import { createPublicAdvertisementService } from '../server/public-advertisement-service.js';
import { createAdvertisementAdminService } from '../server/advertisement-admin-service.js';
import { createLendingUsageService } from '../server/lending-usage-service.js';
import { createPublicLendingService } from '../server/public-lending-service.js';
import { createPublicRequestService } from '../server/public-request-service.js';

const API_SECURITY_HEADERS = Object.freeze({
  'cache-control': 'no-store',
  'content-type': 'application/json; charset=utf-8',
  'x-content-type-options': 'nosniff',
  'referrer-policy': 'no-referrer',
  'permissions-policy': 'camera=(), geolocation=(), microphone=()',
  'cross-origin-opener-policy': 'same-origin',
  'cross-origin-resource-policy': 'same-origin',
});

const BRAND_ASSET_KEYS = Object.freeze({
  '/brand/login-background': 'brand/login-background',
  '/brand/usc-logo': 'brand/usc-logo',
  '/brand/dol-logo': 'brand/dol-logo',
  '/brand/combined-lockup': 'brand/combined-lockup',
  '/brand/favicon': 'brand/favicon',
  '/brand/default-item-image': 'brand/default-item-image',
});

async function brandAsset(request, env, key) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response(null, { status: 405, headers: { allow: 'GET, HEAD' } });
  }
  const asset = await env.BRAND_ASSETS?.get(key);
  if (!asset) {
    return new Response(null, {
      status: 404,
      headers: { 'cache-control': 'public, max-age=60', 'x-content-type-options': 'nosniff' },
    });
  }
  const headers = new Headers({
    'cache-control': 'public, max-age=300, stale-while-revalidate=86400',
    'content-type': asset.httpMetadata?.contentType ?? 'application/octet-stream',
    'x-content-type-options': 'nosniff',
    'content-security-policy': "default-src 'none'",
  });
  if (asset.httpEtag) headers.set('etag', asset.httpEtag);
  return new Response(request.method === 'HEAD' ? null : asset.body, { headers });
}

const GROUP_MODULE = Object.freeze({
  requests: 'request',
  lending: 'lending',
  releases: 'release',
  inventory: 'inventory',
  restocking: 'restocking',
  procurement: 'procurement',
  receiving: 'procurement',
  reference: 'overview',
  admin: 'overview',
});

const GROUP_CAPABILITY = Object.freeze({
  requests: CAPABILITIES.VIEW_REQUEST,
  lending: CAPABILITIES.VIEW_INTERNAL,
  releases: CAPABILITIES.FULFILL_RELEASE,
  inventory: CAPABILITIES.VIEW_INVENTORY,
  restocking: CAPABILITIES.VIEW_INVENTORY,
  procurement: CAPABILITIES.VIEW_INTERNAL,
  receiving: CAPABILITIES.FULFILL_RECEIVE,
  reference: CAPABILITIES.REFERENCE_MANAGE,
  admin: CAPABILITIES.SYSTEM_ADMIN,
});

function constantTimeEqual(left, right) {
  if (!(left instanceof Uint8Array) || !(right instanceof Uint8Array)) return false;
  let difference = left.length ^ right.length;
  const length = Math.max(left.length, right.length);
  for (let index = 0; index < length; index += 1) {
    difference |= (left[index % left.length] ?? 0) ^ (right[index % right.length] ?? 0);
  }
  return difference === 0;
}

function cookies(request) {
  return Object.fromEntries(
    String(request.headers.get('cookie') ?? '')
      .split(';')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const separator = part.indexOf('=');
        return separator < 0
          ? [part, '']
          : [part.slice(0, separator), decodeURIComponent(part.slice(separator + 1))];
      }),
  );
}

async function body(request) {
  const length = Number(request.headers.get('content-length') ?? 0);
  if (length > 1_100_000) {
    throw new ApiError('PAYLOAD_TOO_LARGE', 'The request body is too large.', { status: 413 });
  }
  try {
    return await request.json();
  } catch {
    throw new ApiError('INVALID_JSON', 'The request body must be valid JSON.', { status: 400 });
  }
}

function assertPublicMutationOrigin(request) {
  const url = new URL(request.url);
  const origin = request.headers.get('origin');
  const fetchSite = request.headers.get('sec-fetch-site');
  if ((origin && origin !== url.origin) || fetchSite === 'cross-site') {
    throw new ApiError('PUBLIC_ORIGIN_REJECTED', 'The public request origin is not allowed.', {
      status: 403,
    });
  }
  if (
    !String(request.headers.get('content-type') ?? '')
      .toLowerCase()
      .startsWith('application/json')
  ) {
    throw new ApiError('INVALID_CONTENT_TYPE', 'Public requests require JSON.', { status: 415 });
  }
}

function json(value, status = 200, additionalHeaders = {}) {
  return new Response(JSON.stringify(value), {
    status,
    headers: { ...API_SECURITY_HEADERS, ...additionalHeaders },
  });
}

function services(env) {
  const repository = createD1AuthRepository(env.DB);
  const passwordKdf = createPasswordKdf({
    timingSafeEqual: constantTimeEqual,
    pepper: env.PASSWORD_PEPPER ?? '',
  });
  const tokenCrypto = createTokenCrypto({ timingSafeEqual: constantTimeEqual });
  const auth = createAuthService({
    repository,
    passwordKdf,
    tokenCrypto,
    rateLimiter: createD1RateLimiter(env.DB),
  });
  const access = createAccessManagementService({
    repository: createD1AccessManagementRepository(env.DB),
    passwordKdf,
    environment: String(env.ENVIRONMENT ?? 'DEVELOPMENT').toUpperCase(),
  });
  const operations = createD1OperationalService({
    db: env.DB,
    environment: String(env.ENVIRONMENT ?? 'DEVELOPMENT').toUpperCase(),
    appVersion: env.APP_VERSION ?? '0.7.0',
    schemaVersion: env.SCHEMA_VERSION ?? '1.0.0',
  });
  const publicRequests = createPublicRequestService({
    db: env.DB,
    trackingSecret:
      env.TRACKING_LINK_SECRET ??
      (String(env.ENVIRONMENT ?? 'DEVELOPMENT').toUpperCase() === 'DEVELOPMENT'
        ? 'development-only-public-tracking-secret-9472'
        : ''),
  });
  const publicLending = createPublicLendingService({
    db: env.DB,
    trackingSecret:
      env.TRACKING_LINK_SECRET ??
      (String(env.ENVIRONMENT ?? 'DEVELOPMENT').toUpperCase() === 'DEVELOPMENT'
        ? 'development-only-public-tracking-secret-9472'
        : ''),
  });
  const publicAdvertisements = createPublicAdvertisementService({
    db: env.DB,
    bucket: env.BRAND_ASSETS,
  });
  const advertisementAdmin = createAdvertisementAdminService({
    db: env.DB,
    bucket: env.BRAND_ASSETS,
  });
  const lendingUsage = createLendingUsageService({ db: env.DB });
  return {
    access,
    advertisementAdmin,
    auth,
    lendingUsage,
    operations,
    publicAdvertisements,
    publicLending,
    publicRequests,
  };
}

async function authorize(request, auth, capability, { mutation = false } = {}) {
  const values = cookies(request);
  const sessionToken = values[AUTH_COOKIE.session] ?? values[DEVELOPMENT_AUTH_COOKIE.session];
  const current = await auth.authenticate({ sessionToken });
  return auth.authorize({
    sessionToken,
    csrfToken: request.headers.get('x-csrf-token') ?? '',
    capability,
    resource: { committeeIds: current.account.committeeIds },
    mutation,
  });
}

async function health(env, requestId, readiness = false) {
  const schema = await env.DB.prepare(
    "SELECT value, updated_at FROM app_metadata WHERE key = 'operational_schema_version'",
  ).first();
  const migration = await env.DB.prepare(
    'SELECT name, applied_at FROM d1_migrations ORDER BY id DESC LIMIT 1',
  ).first();
  const runtimeIssues = environmentReadinessIssues(env);
  const unresolved =
    !schema ||
    !migration ||
    runtimeIssues.length > 0 ||
    (String(env.ENVIRONMENT).toUpperCase() === 'STAGING' &&
      String(env.CANDIDATE_SHA ?? '').startsWith('REPLACE_'));
  return json(
    {
      ok: readiness ? !unresolved : true,
      correlationId: requestId,
      ...safeReleaseIdentity(env),
      database: {
        connected: Boolean(schema),
        schemaVersion: schema?.value ?? '0',
        latestMigration: migration?.name ?? '',
      },
      dependencies: {
        d1: Boolean(schema),
        staticAssets: Boolean(env.ASSETS),
        brandAssets: Boolean(env.BRAND_ASSETS),
        protectedConfiguration: !runtimeIssues.some((issue) => issue.endsWith('_MISSING')),
      },
      ...(readiness
        ? { ready: !unresolved, checks: runtimeIssues.length ? ['CONFIGURATION_INCOMPLETE'] : [] }
        : {}),
    },
    readiness && unresolved ? 503 : 200,
  );
}

async function handleApi(request, env, requestId) {
  const url = new URL(request.url);
  const {
    access,
    advertisementAdmin,
    auth,
    lendingUsage,
    operations,
    publicAdvertisements,
    publicLending,
  } = services(env);
  try {
    if (url.pathname === '/api/health' && request.method === 'GET') return health(env, requestId);
    if (url.pathname === '/api/readiness' && request.method === 'GET') {
      return health(env, requestId, true);
    }
    if (url.pathname === '/api/version' && request.method === 'GET') {
      return json({ ok: true, correlationId: requestId, ...safeReleaseIdentity(env) });
    }
    if (url.pathname.startsWith('/api/public/request')) {
      return json(
        {
          code: 'SESSION_REQUIRED',
          message: 'Sign in with a department requester account to use the Request Center.',
          correlationId: requestId,
        },
        401,
      );
    }
    if (url.pathname === '/api/public/lending/catalog' && request.method === 'GET') {
      return json({ ...(await publicLending.catalog()), correlationId: requestId });
    }
    if (url.pathname === '/api/public/advertisements' && request.method === 'GET') {
      return json({ ...(await publicAdvertisements.list()), correlationId: requestId });
    }
    if (url.pathname === '/api/public/lending' && request.method === 'POST') {
      assertPublicMutationOrigin(request);
      return json(
        await publicLending.submit({
          command: await body(request),
          networkKey: request.headers.get('cf-connecting-ip') ?? 'untrusted-local',
          correlationId: requestId,
        }),
      );
    }
    if (url.pathname === '/api/lending/usage' && request.method === 'POST') {
      const actor = await authorize(request, auth, CAPABILITIES.LENDING_USAGE_VIEW);
      return json(
        await lendingUsage.report({
          account: actor.account,
          command: await body(request),
          correlationId: requestId,
        }),
      );
    }
    if (url.pathname === '/api/lending/usage.csv' && request.method === 'GET') {
      const actor = await authorize(request, auth, CAPABILITIES.LENDING_USAGE_VIEW);
      const csv = await lendingUsage.csv({
        account: actor.account,
        command: Object.fromEntries(url.searchParams),
        correlationId: requestId,
      });
      return new Response(csv, {
        headers: {
          'cache-control': 'no-store',
          'content-disposition': 'attachment; filename="hau-usc-lending-usage.csv"',
          'content-type': 'text/csv; charset=utf-8',
          'x-content-type-options': 'nosniff',
        },
      });
    }
    if (url.pathname.startsWith('/api/admin/advertisements/') && request.method === 'POST') {
      const mutation = url.pathname !== '/api/admin/advertisements/list';
      const actor = await authorize(request, auth, CAPABILITIES.ADVERTISEMENT_MANAGE, { mutation });
      const context = {
        account: actor.account,
        command: await body(request),
        correlationId: requestId,
      };
      if (url.pathname === '/api/admin/advertisements/list') {
        return json(await advertisementAdmin.list(context));
      }
      if (url.pathname === '/api/admin/advertisements/save') {
        return json(await advertisementAdmin.save(context));
      }
      if (url.pathname === '/api/admin/advertisements/upload') {
        return json(await advertisementAdmin.upload(context));
      }
      if (url.pathname === '/api/admin/advertisements/archive') {
        return json(await advertisementAdmin.archive(context));
      }
    }
    if (url.pathname === '/api/session') {
      const alias = new Request(new URL('/api/auth/session', url), {
        method: request.method,
        headers: request.headers,
      });
      return createAuthHttpHandler({
        service: auth,
        secureCookies: String(env.ENVIRONMENT).toUpperCase() !== 'DEVELOPMENT',
      })(alias);
    }
    if (url.pathname.startsWith('/api/auth/')) {
      return createAuthHttpHandler({
        service: auth,
        secureCookies: String(env.ENVIRONMENT).toUpperCase() !== 'DEVELOPMENT',
      })(request);
    }

    if (url.pathname === '/api/portal/request' && request.method === 'GET') {
      const actor = await authorize(request, auth, CAPABILITIES.REQUEST_CREATE, { mutation: false });
      return json(
        await operations.requesterRequestPortal({ account: actor.account, correlationId: requestId }),
      );
    }
    if (url.pathname === '/api/portal/request' && request.method === 'POST') {
      const actor = await authorize(request, auth, CAPABILITIES.REQUEST_CREATE, { mutation: true });
      return json(
        await operations.submitRequesterRequest({
          account: actor.account,
          command: await body(request),
          correlationId: requestId,
        }),
      );
    }
    if (url.pathname === '/api/portal/request/cancel' && request.method === 'POST') {
      const actor = await authorize(request, auth, CAPABILITIES.REQUEST_CREATE, { mutation: true });
      return json(
        await operations.cancelRequesterRequest({
          account: actor.account,
          command: await body(request),
          correlationId: requestId,
        }),
      );
    }

    if (url.pathname === '/api/portal/lending' && request.method === 'GET') {
      const actor = await authorize(request, auth, CAPABILITIES.LENDING_CREATE, { mutation: false });
      return json(
        await operations.borrowerLendingPortal({ account: actor.account, correlationId: requestId }),
      );
    }
    if (url.pathname === '/api/portal/lending' && request.method === 'POST') {
      const actor = await authorize(request, auth, CAPABILITIES.LENDING_CREATE, { mutation: true });
      return json(
        await operations.submitBorrowerLendingRequest({
          account: actor.account,
          command: await body(request),
          correlationId: requestId,
        }),
      );
    }
    if (url.pathname === '/api/portal/lending/cancel' && request.method === 'POST') {
      const actor = await authorize(request, auth, CAPABILITIES.LENDING_CREATE, { mutation: true });
      return json(
        await operations.cancelBorrowerLendingRequest({
          account: actor.account,
          command: await body(request),
          correlationId: requestId,
        }),
      );
    }

    if (url.pathname.startsWith('/api/admin/access/') && request.method === 'POST') {
      const actor = (await authorize(request, auth, CAPABILITIES.ACCESS_ADMIN, { mutation: true })).account;
      const command = await body(request);
      const context = { actor, command, correlationId: requestId };
      if (url.pathname === '/api/admin/access/directory') {
        return json({ ok: true, ...(await access.listAccounts(context)) });
      }
      if (url.pathname === '/api/admin/access/history') {
        return json({
          ok: true,
          ...(await access.getAccessIdHistory({
            actor,
            currentAccessId: command.currentAccessId,
            limit: command.limit,
          })),
        });
      }
      if (url.pathname === '/api/admin/access/preview-access-id') {
        return json({ ok: true, ...(await access.previewAccessIdChange(context)) });
      }
      if (url.pathname === '/api/admin/access/change-access-id') {
        return json({ ok: true, ...(await access.changeAccessId(context)) });
      }
      if (url.pathname === '/api/admin/access/create-account') {
        return json({ ok: true, ...(await access.createStarterAccount(context)) });
      }
      if (url.pathname === '/api/admin/access/seed-departments') {
        return json({ ok: true, ...(await access.seedDepartmentAccounts(context)) });
      }
      if (url.pathname === '/api/admin/access/reset-password') {
        return json({ ok: true, ...(await access.resetTemporaryPassword(context)) });
      }
      if (url.pathname === '/api/admin/access/status') {
        return json({ ok: true, ...(await access.setAccountStatus(context)) });
      }
      if (url.pathname === '/api/admin/access/revoke-sessions') {
        return json({ ok: true, ...(await access.revokeSessions(context)) });
      }
      if (url.pathname === '/api/admin/access/unlock') {
        return json({ ok: true, ...(await access.unlockAccount(context)) });
      }
      throw new AccessManagementError('ACCESS_ACCOUNT_NOT_FOUND', { status: 404 });
    }

    if (
      ['/api/bootstrap', '/api/getEssentialBootstrapData', '/api/getBootstrapData'].includes(url.pathname)
    ) {
      const command = request.method === 'GET' ? Object.fromEntries(url.searchParams) : await body(request);
      const requestOnly = command.requestOnly === true || command.requestOnly === 'true';
      const account = requestOnly
        ? null
        : (await authorize(request, auth, CAPABILITIES.VIEW_REQUEST)).account;
      if (url.pathname === '/api/getBootstrapData') {
        const essential = await operations.essential({ account, requestOnly, correlationId: requestId });
        const module = await operations.bootstrapModule({
          account,
          requestOnly,
          command: { ...command, module: command.module ?? essential.activeModule },
          correlationId: requestId,
        });
        return json({ ...essential, ...module.data });
      }
      return json(await operations.essential({ account, requestOnly, correlationId: requestId }));
    }

    if (url.pathname === '/api/getBootstrapModule' || url.pathname.startsWith('/api/bootstrap/')) {
      const command = request.method === 'GET' ? Object.fromEntries(url.searchParams) : await body(request);
      command.module ||= url.pathname.split('/')[3];
      const requestOnly = command.requestOnly === true || command.requestOnly === 'true';
      const account = requestOnly
        ? null
        : (await authorize(request, auth, CAPABILITIES.VIEW_REQUEST)).account;
      return json(
        await operations.bootstrapModule({ account, requestOnly, command, correlationId: requestId }),
      );
    }

    if (url.pathname === '/api/getDataRevision' && request.method === 'POST') {
      await authorize(request, auth, CAPABILITIES.VIEW_REQUEST);
      const value = await operations.revision('global');
      return json({ ok: true, correlationId: requestId, data: value });
    }

    if (url.pathname === '/api/getScopedRevision' && request.method === 'POST') {
      await authorize(request, auth, CAPABILITIES.VIEW_REQUEST);
      const command = await body(request);
      const scope = String(command.scope ?? '').toLowerCase();
      const value = await operations.revision(scope);
      return json({
        ok: true,
        correlationId: requestId,
        data: {
          contract: 'scoped-revision',
          contractVersion: 1,
          enabled: false,
          scope,
          token: value.revision,
          globalRevision: (await operations.revision('global')).revision,
          updatedAt: value.updatedAt,
          environment: String(env.ENVIRONMENT ?? 'DEVELOPMENT').toUpperCase(),
          metrics: { revisionReads: 1, moduleReads: 0, requestCount: 1 },
        },
      });
    }

    if (url.pathname === '/api/admin/migrations' && request.method === 'GET') {
      const actor = await authorize(request, auth, CAPABILITIES.SYSTEM_DIAGNOSTICS);
      return json(await operations.migrationStatus({ account: actor.account, correlationId: requestId }));
    }

    const group = url.pathname.split('/')[2];
    if (GROUP_MODULE[group] && request.method === 'GET') {
      const actor = await authorize(request, auth, GROUP_CAPABILITY[group]);
      return json(
        await operations.bootstrapModule({
          account: actor.account,
          command: { ...Object.fromEntries(url.searchParams), module: GROUP_MODULE[group] },
          correlationId: requestId,
        }),
      );
    }

    const method = url.pathname.slice('/api/'.length);
    if (method && !method.includes('/') && request.method === 'POST') {
      const command = await body(request);
      const capability = operations.capabilityForMethod(method);
      if (!capability) {
        throw new ApiError('OPERATION_NOT_FOUND', 'The requested API operation was not found.', {
          status: 404,
        });
      }
      const actor = await authorize(request, auth, capability, { mutation: true });
      const result = await operations.call(method, {
        account: actor.account,
        command,
        correlationId: requestId,
      });
      return json({ ok: true, ...result });
    }

    return json(
      { ok: false, code: 'NOT_FOUND', message: 'The API route was not found.', correlationId: requestId },
      404,
    );
  } catch (error) {
    const known =
      error instanceof ApiError || error instanceof AuthError || error instanceof AccessManagementError;
    const status =
      error instanceof ApiError || error instanceof AccessManagementError
        ? error.status
        : error instanceof AuthError
          ? statusForAuthError(error)
          : 500;
    structuredLog({
      level: known ? 'info' : 'error',
      event: 'API_REQUEST_FAILED',
      correlationId: requestId,
      env,
      details: {
        result: 'FAILED',
        errorCode: known ? error.code : 'UNHANDLED_API_ERROR',
        path: url.pathname,
        method: request.method,
        ...(String(env.ENVIRONMENT).toUpperCase() === 'DEVELOPMENT'
          ? { exception: String(error?.message ?? '') }
          : {}),
      },
    });
    return json(
      {
        ok: false,
        code: known ? error.code : 'INTERNAL_ERROR',
        message: known ? error.message : 'The service is temporarily unavailable.',
        correlationId: requestId,
        ...(error instanceof ApiError && error.details ? { details: error.details } : {}),
      },
      status,
    );
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const brandKey = BRAND_ASSET_KEYS[url.pathname];
    if (brandKey) return brandAsset(request, env, brandKey);
    if (url.pathname.startsWith('/brand/catalog/')) {
      let assetKey = '';
      try {
        assetKey = decodeURIComponent(url.pathname.slice('/brand/catalog/'.length));
      } catch {
        return new Response(null, { status: 404 });
      }
      if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,159}$/u.test(assetKey)) {
        return new Response(null, { status: 404 });
      }
      return brandAsset(request, env, `catalog/${assetKey}`);
    }
    if (url.pathname.startsWith('/media/advertisements/')) {
      if (request.method !== 'GET' && request.method !== 'HEAD') {
        return new Response(null, { status: 405, headers: { allow: 'GET, HEAD' } });
      }
      let advertisementId = '';
      try {
        advertisementId = decodeURIComponent(url.pathname.slice('/media/advertisements/'.length));
        const response = await services(env).publicAdvertisements.image(advertisementId);
        return request.method === 'HEAD'
          ? new Response(null, { status: response.status, headers: response.headers })
          : response;
      } catch {
        return new Response(null, {
          status: 404,
          headers: { 'cache-control': 'public, max-age=60', 'x-content-type-options': 'nosniff' },
        });
      }
    }
    if (url.pathname.startsWith('/api/')) {
      const requestId = createCorrelationId(request);
      const startedAt = Date.now();
      const response = await handleApi(request, env, requestId);
      response.headers.set('x-correlation-id', requestId);
      structuredLog({
        event: 'API_REQUEST_COMPLETED',
        correlationId: requestId,
        env,
        details: {
          result: response.ok ? 'SUCCESS' : 'FAILED',
          status: response.status,
          method: request.method,
          path: url.pathname,
          latencyMs: Date.now() - startedAt,
        },
      });
      return response;
    }
    return env.ASSETS.fetch(request);
  },
};
