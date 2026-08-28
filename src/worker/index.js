import { CAPABILITIES } from '../domain/permissions.js';
import { AccessManagementError, createAccessManagementService } from '../server/access/service.js';
import { createPasswordKdf, createTokenCrypto } from '../server/auth/crypto.js';
import { AUTH_COOKIE, DEVELOPMENT_AUTH_COOKIE, serializeAuthCookie } from '../server/auth/cookies.js';
import { createAuthHttpHandler, statusForAuthError } from '../server/auth/http-handler.js';
import { AuthError, createAuthService } from '../server/auth/service.js';
import { createD1AuthRepository, createD1RateLimiter } from '../server/d1/auth-repository.js';
import { createD1AccessManagementRepository } from '../server/d1/access-management-repository.js';
import { createD1AccountApplicationRepository } from '../server/d1/account-application-repository.js';
import { createD1IdentityFoundationRepository } from '../server/d1/identity-foundation-repository.js';
import { createD1IdentityRosterRepository } from '../server/d1/identity-roster-repository.js';
import { createD1IdentitySourceProjectionRepository } from '../server/d1/identity-source-projection-repository.js';
import { createD1ProfileRepository } from '../server/d1/profile-repository.js';
import { createD1ReferenceLinkRepository } from '../server/d1/reference-link-repository.js';
import { ApiError, createD1OperationalService } from '../server/d1/operational-service.js';
import { createGoogleDriveEvidenceStore } from '../server/evidence/google-drive-store.js';
import {
  createHybridEvidenceService,
  EvidenceServiceError,
} from '../server/evidence/hybrid-evidence-service.js';
import { createR2EvidenceStore } from '../server/evidence/r2-evidence-store.js';
import { environmentReadinessIssues, safeReleaseIdentity } from '../server/environment.js';
import { createCorrelationId, structuredLog } from '../server/observability.js';
import { createPublicAdvertisementService } from '../server/public-advertisement-service.js';
import { createAdvertisementAdminService } from '../server/advertisement-admin-service.js';
import { createBrandAssetService } from '../server/brand-asset-service.js';
import { createLendingUsageService } from '../server/lending-usage-service.js';
import { createPublicLendingService } from '../server/public-lending-service.js';
import { createPublicRequestService } from '../server/public-request-service.js';
import { createReferenceLinkService } from '../server/reference-link-service.js';
import {
  createPlaygroundService,
  isPlaygroundRuntime,
  markPlaygroundModified,
} from '../server/playground-service.js';
import { createIdentityRosterCrypto } from '../server/identity-roster/crypto.js';
import { createGoogleSheetsRosterSource } from '../server/identity-roster/google-source.js';
import { createIdentityRosterService, IdentityRosterError } from '../server/identity-roster/service.js';
import {
  createIdentityFoundationReconciliationService,
  IdentityFoundationReconciliationError,
} from '../server/identity-foundation/reconciliation.js';
import {
  createStaffAccountActivityHistoryService,
  StaffAccountActivityHistoryError,
} from '../server/identity-foundation/staff-account-activity-history-service.js';
import { createStaffDirectoryService } from '../server/identity-foundation/staff-directory-service.js';
import {
  createIdentitySourceProjectionProbeService,
  IdentitySourceProjectionProbeError,
  isIdentitySourceProjectionProbeExecutionAuthorized,
} from '../server/identity-foundation/source-projection-probe.js';
import { createOperationalHealthService } from '../server/operational-health-service.js';
import {
  createAccountApplicationActivationHandoff,
  createAccountApplicationActivationLifecycle,
  createAccountApplicationIdentityAdapters,
} from '../server/account-application/adapters.js';
import { createAccountApplicationEmailProvider } from '../server/account-application/email-provider-registry.js';
import {
  AccountApplicationError,
  createAccountApplicationService,
} from '../server/account-application/service.js';
import { createProfileService } from '../server/profile/service.js';
import { resolveHostRoute, responseForHostRoute } from './host-routing.js';

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

const APPROVED_REFERENCE_LINK_ROUTES = Object.freeze([
  'PORTAL_REQUEST',
  'PORTAL_LENDING',
  'STAFF_SIGN_IN',
  'APP_ADMINISTRATOR',
  'APP_DIRECTOR',
  'APP_INVENTORY',
  'APP_FOOD',
  'APP_MATERIALS',
]);

async function brandAsset(request, env, key, { governedSlot = false } = {}) {
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response(null, { status: 405, headers: { allow: 'GET, HEAD' } });
  }
  let objectKey = key;
  if (governedSlot && env.DB) {
    const published = await env.DB.prepare(
      `SELECT version.object_key
       FROM brand_asset_slots slot
       JOIN brand_asset_versions version ON version.id = slot.published_version_id
       WHERE slot.id = ?1 AND version.status = 'PUBLISHED'`,
    )
      .bind(key.slice('brand/'.length))
      .first();
    objectKey = published?.object_key ?? key;
  }
  const asset = await env.BRAND_ASSETS?.get(objectKey);
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

async function body(request, maxBytes = 1_100_000) {
  const length = Number(request.headers.get('content-length') ?? 0);
  if (length > maxBytes) {
    throw new ApiError('PAYLOAD_TOO_LARGE', 'The request body is too large.', { status: 413 });
  }
  try {
    const value = await request.text();
    if (new TextEncoder().encode(value).byteLength > maxBytes) {
      throw new ApiError('PAYLOAD_TOO_LARGE', 'The request body is too large.', { status: 413 });
    }
    return JSON.parse(value);
  } catch (error) {
    if (error instanceof ApiError) throw error;
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
  const accessRepository = createD1AccessManagementRepository(env.DB);
  const identityFoundationRepository = createD1IdentityFoundationRepository(env.DB);
  const rosterRepository = createD1IdentityRosterRepository(env.DB);
  const sourceProjectionRepository = createD1IdentitySourceProjectionRepository(env.DB);
  const accountApplicationRepository = createD1AccountApplicationRepository(env.DB);
  const passwordKdf = createPasswordKdf({
    timingSafeEqual: constantTimeEqual,
    pepper: env.PASSWORD_PEPPER ?? '',
  });
  const tokenCrypto = createTokenCrypto({ timingSafeEqual: constantTimeEqual });
  const rosterCrypto = createIdentityRosterCrypto({
    secret:
      env.ROSTER_DATA_ENCRYPTION_KEY ??
      (String(env.ENVIRONMENT ?? 'DEVELOPMENT').toUpperCase() === 'DEVELOPMENT'
        ? 'development-only-roster-data-encryption-key-9472'
        : ''),
  });
  const identityAdapters = createAccountApplicationIdentityAdapters({
    rosterRepository,
    rosterCrypto,
    identityClasses: env.ACCOUNT_APPLICATION_IDENTITY_CLASSES_JSON,
    environment: env.ENVIRONMENT,
    recipientAllowlist: env.ACCOUNT_APPLICATION_EMAIL_RECIPIENT_ALLOWLIST_JSON,
    stagingIdentityFixture: env.ACCOUNT_APPLICATION_STAGING_IDENTITY_FIXTURE_JSON,
  });
  const accountApplications = createAccountApplicationService({
    repository: accountApplicationRepository,
    // Selection is environment-driven and fails closed: an unset provider, an
    // unsupported one, an absent secret, or a malformed sender all yield the
    // fail-closed provider, which is the same object this line used to hardcode.
    emailProvider: createAccountApplicationEmailProvider(env),
    identityProtection: identityAdapters.identityProtection,
    passwordKdf,
    tokenCrypto,
    rateLimiter: createD1RateLimiter(env.DB),
    submissionEligibility: identityAdapters.submissionEligibility,
    reviewDisclosure: identityAdapters.reviewDisclosure,
    activationHandoff: createAccountApplicationActivationHandoff({
      accessRepository,
      rosterRepository,
      rosterCrypto,
      passwordKdf,
      environment: env.ENVIRONMENT,
      stagingIdentityFixture: env.ACCOUNT_APPLICATION_STAGING_IDENTITY_FIXTURE_JSON,
    }),
  });
  const activationLifecycle = createAccountApplicationActivationLifecycle({
    applicationService: accountApplications,
    applicationRepository: accountApplicationRepository,
    rosterCrypto,
  });
  const auth = createAuthService({
    repository,
    passwordKdf,
    tokenCrypto,
    rateLimiter: createD1RateLimiter(env.DB),
    activationLifecycle,
  });
  const access = createAccessManagementService({
    repository: accessRepository,
    passwordKdf,
    tokenCrypto,
    environment: String(env.ENVIRONMENT ?? 'DEVELOPMENT').toUpperCase(),
  });
  const evidenceBackup = createGoogleDriveEvidenceStore({
    folderIds: {
      ROOT: env.GOOGLE_DRIVE_ROOT_FOLDER_ID,
      RESTOCK_RECEIPT: env.GOOGLE_DRIVE_RECEIPTS_FOLDER_ID,
      CANVASS: env.GOOGLE_DRIVE_CANVASS_FOLDER_ID,
      DELIVERABLE: env.GOOGLE_DRIVE_DELIVERABLE_FOLDER_ID,
      RELEASE: env.GOOGLE_EVIDENCE_RELEASE_FOLDER_ID,
      LENDING: env.GOOGLE_DRIVE_LENDING_FOLDER_ID,
    },
    oauthClientId: env.GOOGLE_EVIDENCE_OAUTH_CLIENT_ID,
    oauthClientSecret: env.GOOGLE_EVIDENCE_OAUTH_CLIENT_SECRET,
    oauthRefreshToken: env.GOOGLE_EVIDENCE_OAUTH_REFRESH_TOKEN,
    serviceAccountEmail: env.GOOGLE_EVIDENCE_SERVICE_ACCOUNT_EMAIL ?? env.GOOGLE_ROSTER_SERVICE_ACCOUNT_EMAIL,
    serviceAccountPrivateKey: env.GOOGLE_EVIDENCE_PRIVATE_KEY ?? env.GOOGLE_ROSTER_PRIVATE_KEY,
  });
  const evidence = createHybridEvidenceService({
    db: env.DB,
    primaryStore: createR2EvidenceStore({ bucket: env.EVIDENCE_ASSETS }),
    backupStore: evidenceBackup,
  });
  const operations = createD1OperationalService({
    db: env.DB,
    environment: String(env.ENVIRONMENT ?? 'DEVELOPMENT').toUpperCase(),
    appVersion: env.APP_VERSION ?? '0.8.0',
    schemaVersion: env.SCHEMA_VERSION ?? '1.0.0',
    evidenceStore: evidence,
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
  const referenceLinks = createReferenceLinkService({
    repository: createD1ReferenceLinkRepository(env.DB),
    approvedInternalRoutes: APPROVED_REFERENCE_LINK_ROUTES,
    syncConfigured: false,
  });
  const brandAssets = createBrandAssetService({ db: env.DB, bucket: env.BRAND_ASSETS });
  const lendingUsage = createLendingUsageService({ db: env.DB });
  const googleRosterSource = createGoogleSheetsRosterSource({
    spreadsheetId: env.GOOGLE_ROSTER_SPREADSHEET_ID,
    range: env.GOOGLE_ROSTER_RANGE,
    serviceAccountEmail: env.GOOGLE_ROSTER_SERVICE_ACCOUNT_EMAIL,
    serviceAccountPrivateKey: env.GOOGLE_ROSTER_PRIVATE_KEY,
    fingerprint: rosterCrypto.fingerprint,
  });
  const identityRoster = createIdentityRosterService({
    repository: rosterRepository,
    source: googleRosterSource,
    crypto: rosterCrypto,
  });
  const identityFoundationReconciliation = createIdentityFoundationReconciliationService({
    legacyRosterRepository: rosterRepository,
    foundationRepository: identityFoundationRepository,
    crypto: rosterCrypto,
  });
  const staffDirectory = createStaffDirectoryService({ repository: identityFoundationRepository });
  const staffAccountActivityHistory = () =>
    createStaffAccountActivityHistoryService({ repository: identityFoundationRepository });
  const sourceProjectionProbe = createIdentitySourceProjectionProbeService({
    source: googleRosterSource,
    repository: sourceProjectionRepository,
    reconciliation: identityFoundationReconciliation,
    executionAuthorized: isIdentitySourceProjectionProbeExecutionAuthorized(env),
  });
  const profile = createProfileService({
    repository: createD1ProfileRepository(env.DB),
    passwordKdf,
    protectIdentityRequest: (value, context) => rosterCrypto.encrypt({ context, request: value }),
    avatarBucket: isPlaygroundRuntime(env) ? env.EVIDENCE_ASSETS : null,
  });
  const operationalHealth = createOperationalHealthService({
    db: env.DB,
    env,
    evidence,
    identityRoster,
  });
  return {
    access,
    accountApplications,
    advertisementAdmin,
    brandAssets,
    auth,
    evidence,
    identityFoundationReconciliation,
    lendingUsage,
    identityRoster,
    sourceProjectionProbe,
    staffAccountActivityHistory,
    staffDirectory,
    operationalHealth,
    operations,
    profile,
    publicAdvertisements,
    publicLending,
    publicRequests,
    referenceLinks,
    rosterCrypto,
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

async function authorizeSession(request, auth, { mutation = false } = {}) {
  const values = cookies(request);
  const sessionToken = values[AUTH_COOKIE.session] ?? values[DEVELOPMENT_AUTH_COOKIE.session];
  return auth.authorizeSession({
    sessionToken,
    csrfToken: request.headers.get('x-csrf-token') ?? '',
    mutation,
  });
}

function bearerToken(request) {
  const match = String(request.headers.get('authorization') ?? '').match(/^Bearer\s+([^\s]+)$/iu);
  return match?.[1] ?? '';
}

function applicationActor(authorized) {
  return Object.freeze({
    ...authorized.account,
    capabilities: authorized.authorization.capabilities,
  });
}

function accountApplicationQuery(url) {
  const optionalInteger = (name, fallback) => {
    const value = url.searchParams.get(name);
    return value === null ? fallback : Number(value);
  };
  return {
    ...(url.searchParams.has('state') ? { state: url.searchParams.get('state') } : {}),
    limit: optionalInteger('limit', 25),
    offset: optionalInteger('offset', 0),
  };
}

async function protectReviewCommand(command, rosterCrypto) {
  const evidence = command?.reviewEvidence;
  if (!evidence || typeof evidence !== 'object' || Array.isArray(evidence) || !Object.keys(evidence).length) {
    throw new AccountApplicationError('ACCOUNT_APPLICATION_REVIEW_EVIDENCE_REQUIRED');
  }
  return {
    ...command,
    reviewEvidence: {
      evidenceFingerprint: await rosterCrypto.fingerprint(evidence),
      protectedReviewEnvelope: await rosterCrypto.encrypt(evidence),
    },
  };
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
        evidenceAssets: Boolean(env.EVIDENCE_ASSETS),
        protectedConfiguration: !runtimeIssues.some((issue) => issue.endsWith('_MISSING')),
      },
      ...(readiness
        ? { ready: !unresolved, checks: runtimeIssues.length ? ['CONFIGURATION_INCOMPLETE'] : [] }
        : {}),
    },
    readiness && unresolved ? 503 : 200,
  );
}

async function version(env, requestId) {
  const schema = await env.DB.prepare(
    "SELECT value FROM app_metadata WHERE key = 'operational_schema_version'",
  ).first();
  const migration = await env.DB.prepare('SELECT name FROM d1_migrations ORDER BY id DESC LIMIT 1').first();
  return json({
    ok: true,
    correlationId: requestId,
    ...safeReleaseIdentity(env),
    playground: isPlaygroundRuntime(env),
    database: {
      schemaVersion: schema?.value ?? '0',
      latestMigration: migration?.name ?? '',
    },
  });
}

async function handleApi(request, env, requestId, executionContext) {
  const url = new URL(request.url);
  const guardedPlaygroundRequest =
    (url.pathname === '/api/playground/session' && request.method === 'POST') ||
    (url.pathname === '/api/playground/status' && request.method === 'GET') ||
    (url.pathname === '/api/playground/operation' && request.method === 'POST');
  if (guardedPlaygroundRequest && !isPlaygroundRuntime(env)) {
    return json(
      {
        error: { code: 'PLAYGROUND_ENVIRONMENT_REFUSED', message: 'The requested resource was not found.' },
        correlationId: requestId,
      },
      404,
    );
  }
  const {
    access,
    accountApplications,
    advertisementAdmin,
    brandAssets,
    auth,
    evidence,
    identityFoundationReconciliation,
    staffAccountActivityHistory,
    staffDirectory,
    lendingUsage,
    identityRoster,
    sourceProjectionProbe,
    operationalHealth,
    operations,
    profile,
    publicAdvertisements,
    publicLending,
    publicRequests,
    referenceLinks,
    rosterCrypto,
  } = services(env);
  try {
    if (url.pathname === '/api/health' && request.method === 'GET') return health(env, requestId);
    if (url.pathname === '/api/readiness' && request.method === 'GET') {
      return health(env, requestId, true);
    }
    if (url.pathname === '/api/version' && request.method === 'GET') {
      return version(env, requestId);
    }
    if (url.pathname === '/api/playground/session' && request.method === 'POST') {
      assertPublicMutationOrigin(request);
      await body(request);
      const owner = await env.DB.prepare(
        `SELECT id FROM accounts
         WHERE status = 'ACTIVE'
           AND role_id = 'SYSTEM_OWNER'
           AND onboarding_completed_at IS NOT NULL
           AND locked_at IS NULL
         ORDER BY created_at, id
         LIMIT 1`,
      ).first();
      if (!owner?.id) {
        throw new ApiError('PLAYGROUND_OWNER_UNAVAILABLE', 'The playground owner session is unavailable.', {
          status: 503,
        });
      }
      const issued = await auth.issuePlaygroundSession({ accountId: owner.id });
      return json(
        {
          state: issued.state,
          csrfToken: issued.csrfToken,
          user: issued.user,
          expiresAt: issued.expiresAt,
          correlationId: requestId,
        },
        200,
        { 'set-cookie': serializeAuthCookie(AUTH_COOKIE.session, issued.sessionToken) },
      );
    }
    if (url.pathname === '/api/playground/status' && request.method === 'GET') {
      if (!isPlaygroundRuntime(env)) {
        throw new ApiError(
          'PLAYGROUND_ENVIRONMENT_REFUSED',
          'The playground environment guard refused this action.',
          {
            status: 404,
          },
        );
      }
      await authorize(request, auth, CAPABILITIES.SYSTEM_ADMIN);
      return json({
        ...(await createPlaygroundService(env).status()),
        correlationId: requestId,
      });
    }
    if (url.pathname === '/api/playground/operation' && request.method === 'POST') {
      if (!isPlaygroundRuntime(env)) {
        throw new ApiError(
          'PLAYGROUND_ENVIRONMENT_REFUSED',
          'The playground environment guard refused this action.',
          {
            status: 404,
          },
        );
      }
      const authorized = await authorize(request, auth, CAPABILITIES.SYSTEM_ADMIN, { mutation: true });
      return json({
        ...(await createPlaygroundService(env).requestOperation({
          ...(await body(request)),
          actorAccountId: authorized.account.id,
        })),
        correlationId: requestId,
      });
    }
    if (url.pathname === '/api/account-applications/email/start' && request.method === 'POST') {
      assertPublicMutationOrigin(request);
      return json({
        ...(await accountApplications.startEmailVerification(await body(request))),
        correlationId: requestId,
      });
    }
    if (url.pathname === '/api/account-applications/email/confirm' && request.method === 'POST') {
      assertPublicMutationOrigin(request);
      return json({
        ...(await accountApplications.confirmEmailVerification(await body(request))),
        correlationId: requestId,
      });
    }
    if (url.pathname === '/api/account-applications' && request.method === 'POST') {
      assertPublicMutationOrigin(request);
      const command = await body(request);
      const statusToken = bearerToken(request);
      return json({
        ...(statusToken
          ? await accountApplications.resubmitApplication({ statusToken, ...command })
          : await accountApplications.submitApplication(command)),
        correlationId: requestId,
      });
    }
    if (url.pathname === '/api/account-applications/status' && request.method === 'GET') {
      return json({
        ...(await accountApplications.getStatus({ statusToken: bearerToken(request) })),
        correlationId: requestId,
      });
    }
    if (url.pathname === '/api/account-applications/withdraw' && request.method === 'POST') {
      assertPublicMutationOrigin(request);
      return json({
        ...(await accountApplications.withdraw({
          statusToken: bearerToken(request),
          ...(await body(request)),
        })),
        correlationId: requestId,
      });
    }

    const administratorApplication = url.pathname.match(
      /^\/api\/admin\/account-applications(?:\/([^/]+)(?:\/(request-changes|reject|forward))?)?$/u,
    );
    if (administratorApplication) {
      const authorized = await authorize(request, auth, CAPABILITIES.ACCOUNT_APPLICATION_ADMIN_REVIEW, {
        mutation: request.method !== 'GET',
      });
      const actor = applicationActor(authorized);
      const applicationId = administratorApplication[1]
        ? decodeURIComponent(administratorApplication[1])
        : '';
      const action = administratorApplication[2] ?? '';
      if (request.method === 'GET' && !applicationId) {
        return json({
          ...(await accountApplications.adminList({ actor, ...accountApplicationQuery(url) })),
          correlationId: requestId,
        });
      }
      if (request.method === 'GET' && applicationId && !action) {
        return json({
          ...(await accountApplications.adminGet({ actor, applicationId })),
          correlationId: requestId,
        });
      }
      if (request.method === 'POST' && applicationId && action) {
        const command = await protectReviewCommand(await body(request), rosterCrypto);
        const method = {
          'request-changes': 'adminRequestChanges',
          reject: 'adminReject',
          forward: 'adminForward',
        }[action];
        return json({
          ...(await accountApplications[method]({ actor, applicationId, ...command })),
          correlationId: requestId,
        });
      }
    }

    const directorApplication = url.pathname.match(
      /^\/api\/director\/account-applications(?:\/([^/]+)(?:\/(approve|request-changes|reject))?)?$/u,
    );
    if (directorApplication) {
      const authorized = await authorize(request, auth, CAPABILITIES.ACCOUNT_APPLICATION_DIRECTOR_DECIDE, {
        mutation: request.method !== 'GET',
      });
      const actor = applicationActor(authorized);
      const applicationId = directorApplication[1] ? decodeURIComponent(directorApplication[1]) : '';
      const action = directorApplication[2] ?? '';
      if (request.method === 'GET' && !applicationId) {
        return json({
          ...(await accountApplications.directorList({ actor, ...accountApplicationQuery(url) })),
          correlationId: requestId,
        });
      }
      if (request.method === 'GET' && applicationId && !action) {
        return json({
          ...(await accountApplications.directorGet({ actor, applicationId })),
          correlationId: requestId,
        });
      }
      if (request.method === 'POST' && applicationId && action) {
        const command = await protectReviewCommand(await body(request), rosterCrypto);
        const method = {
          approve: 'directorApprove',
          'request-changes': 'directorRequestChanges',
          reject: 'directorReject',
        }[action];
        return json({
          ...(await accountApplications[method]({ actor, applicationId, ...command })),
          correlationId: requestId,
        });
      }
    }

    const ownerApplication = url.pathname.match(/^\/api\/owner\/account-applications\/([^/]+)\/override$/u);
    if (ownerApplication && request.method === 'POST') {
      const authorized = await authorize(request, auth, CAPABILITIES.ACCOUNT_APPLICATION_OWNER_OVERRIDE, {
        mutation: true,
      });
      const command = await protectReviewCommand(await body(request), rosterCrypto);
      return json({
        ...(await accountApplications.ownerOverride({
          actor: applicationActor(authorized),
          applicationId: decodeURIComponent(ownerApplication[1]),
          ...command,
        })),
        correlationId: requestId,
      });
    }

    if (url.pathname === '/api/me/profile' && ['GET', 'PATCH'].includes(request.method)) {
      const authorized = await authorizeSession(request, auth, { mutation: request.method === 'PATCH' });
      const context = { account: authorized.account, correlationId: requestId };
      const result =
        request.method === 'GET'
          ? await profile.get(context)
          : await profile.updateContact({ ...context, command: await body(request) });
      return json({ ...result, correlationId: requestId });
    }
    if (url.pathname === '/api/me/appearance' && ['GET', 'PATCH'].includes(request.method)) {
      const authorized = await authorizeSession(request, auth, { mutation: request.method === 'PATCH' });
      if (request.method === 'GET') {
        return json({
          ...(await profile.getAppearance({ account: authorized.account })),
          correlationId: requestId,
        });
      }
      return json({
        ...(await profile.updateAppearance({
          account: authorized.account,
          command: await body(request),
          correlationId: requestId,
        })),
        correlationId: requestId,
      });
    }
    if (url.pathname === '/api/me/username/change' && request.method === 'POST') {
      const authorized = await authorizeSession(request, auth, { mutation: true });
      return json({
        ...(await profile.changeUsername({
          account: authorized.account,
          command: await body(request),
          correlationId: requestId,
        })),
        correlationId: requestId,
      });
    }
    if (url.pathname === '/api/me/password/change' && request.method === 'POST') {
      const authorized = await authorizeSession(request, auth, { mutation: true });
      return json({
        ...(await profile.changePassword({
          account: authorized.account,
          command: await body(request),
          correlationId: requestId,
        })),
        correlationId: requestId,
      });
    }
    if (url.pathname === '/api/me/identity-correction-request' && request.method === 'POST') {
      const authorized = await authorizeSession(request, auth, { mutation: true });
      return json({
        ...(await profile.requestIdentityCorrection({
          account: authorized.account,
          command: await body(request),
          correlationId: requestId,
        })),
        correlationId: requestId,
      });
    }
    if (url.pathname === '/api/me/avatar' && ['GET', 'POST', 'DELETE'].includes(request.method)) {
      const authorized = await authorizeSession(request, auth, { mutation: request.method !== 'GET' });
      if (request.method === 'GET') return profile.avatar({ account: authorized.account });
      const context = {
        account: authorized.account,
        command: await body(request),
        correlationId: requestId,
      };
      return json({
        ...(request.method === 'POST'
          ? await profile.uploadAvatar(context)
          : await profile.deleteAvatar(context)),
        correlationId: requestId,
      });
    }
    if (url.pathname === '/api/public/request/options' && request.method === 'GET') {
      return json({ ...(await publicRequests.options()), correlationId: requestId });
    }
    if (url.pathname === '/api/public/request' && request.method === 'POST') {
      assertPublicMutationOrigin(request);
      return json(
        await publicRequests.submit({
          command: await body(request),
          networkKey: request.headers.get('cf-connecting-ip') ?? 'untrusted-local',
          correlationId: requestId,
        }),
      );
    }
    if (url.pathname === '/api/public/request/track' && request.method === 'POST') {
      assertPublicMutationOrigin(request);
      return json(
        await publicRequests.track({
          command: await body(request),
          networkKey: request.headers.get('cf-connecting-ip') ?? 'untrusted-local',
          correlationId: requestId,
        }),
      );
    }
    if (url.pathname === '/api/public/request/related' && request.method === 'POST') {
      assertPublicMutationOrigin(request);
      return json(
        await publicRequests.related({
          command: await body(request),
          networkKey: request.headers.get('cf-connecting-ip') ?? 'untrusted-local',
          correlationId: requestId,
        }),
      );
    }
    if (url.pathname === '/api/public/lending/catalog' && request.method === 'GET') {
      return json({ ...(await publicLending.catalog()), correlationId: requestId });
    }
    if (url.pathname === '/api/public/advertisements' && request.method === 'GET') {
      return json({ ...(await publicAdvertisements.list()), correlationId: requestId });
    }
    if (url.pathname === '/api/public/lending/track' && request.method === 'POST') {
      assertPublicMutationOrigin(request);
      return json(
        await publicLending.track({
          command: await body(request),
          networkKey: request.headers.get('cf-connecting-ip') ?? 'untrusted-local',
          correlationId: requestId,
        }),
      );
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
      const mutation = !new Set(['/api/admin/advertisements/list', '/api/admin/advertisements/preview']).has(
        url.pathname,
      );
      const actor = await authorize(request, auth, CAPABILITIES.ADVERTISEMENT_MANAGE, { mutation });
      const context = {
        account: actor.account,
        command: await body(request),
        correlationId: requestId,
      };
      if (url.pathname === '/api/admin/advertisements/list') {
        return json(await advertisementAdmin.list(context));
      }
      if (url.pathname === '/api/admin/advertisements/preview') {
        return json(await advertisementAdmin.preview(context));
      }
      if (url.pathname === '/api/admin/advertisements/save') {
        return json(await advertisementAdmin.save(context));
      }
      if (url.pathname === '/api/admin/advertisements/upload') {
        return json(await advertisementAdmin.upload(context));
      }
      if (url.pathname === '/api/admin/advertisements/publish') {
        return json(await advertisementAdmin.publish(context));
      }
      if (url.pathname === '/api/admin/advertisements/schedule') {
        return json(await advertisementAdmin.schedule(context));
      }
      if (url.pathname === '/api/admin/advertisements/pause') {
        return json(await advertisementAdmin.pause(context));
      }
      if (url.pathname === '/api/admin/advertisements/resume') {
        return json(await advertisementAdmin.resume(context));
      }
      if (url.pathname === '/api/admin/advertisements/archive') {
        return json(await advertisementAdmin.archive(context));
      }
      throw new ApiError('ADVERTISEMENT_ROUTE_NOT_FOUND', 'The announcement route was not found.', {
        status: 404,
      });
    }
    if (url.pathname.startsWith('/api/admin/reference-links/') && request.method === 'POST') {
      const readOnlyRoutes = new Set([
        '/api/admin/reference-links/list',
        '/api/admin/reference-links/get',
        '/api/admin/reference-links/history',
      ]);
      const mutation = !readOnlyRoutes.has(url.pathname);
      const actor = await authorize(request, auth, CAPABILITIES.REFERENCE_MANAGE, { mutation });
      const command = await body(request);
      const context = { actor: actor.account, command, correlationId: requestId };
      if (url.pathname === '/api/admin/reference-links/list') {
        return json(await referenceLinks.list(context));
      }
      if (url.pathname === '/api/admin/reference-links/get') {
        return json(await referenceLinks.get({ actor: actor.account, id: command.id }));
      }
      if (url.pathname === '/api/admin/reference-links/history') {
        return json(await referenceLinks.history({ actor: actor.account, id: command.id, command }));
      }
      if (url.pathname === '/api/admin/reference-links/create') {
        return json(await referenceLinks.create(context));
      }
      if (url.pathname === '/api/admin/reference-links/update') {
        return json(await referenceLinks.update(context));
      }
      if (url.pathname === '/api/admin/reference-links/transition') {
        return json(await referenceLinks.transition(context));
      }
      throw new ApiError('REFERENCE_LINK_ROUTE_NOT_FOUND', 'The Link Registry route was not found.', {
        status: 404,
      });
    }
    if (url.pathname.startsWith('/api/owner/brand-assets/') && request.method === 'POST') {
      const mutation = url.pathname !== '/api/owner/brand-assets/list';
      const actor = await authorize(request, auth, CAPABILITIES.BRAND_MANAGE, { mutation });
      const context = {
        account: actor.account,
        command: await body(request, mutation ? 7_500_000 : 1_100_000),
        correlationId: requestId,
      };
      if (url.pathname === '/api/owner/brand-assets/list') return json(await brandAssets.list(context));
      if (url.pathname === '/api/owner/brand-assets/upload') return json(await brandAssets.upload(context));
      if (url.pathname === '/api/owner/brand-assets/publish') return json(await brandAssets.publish(context));
      if (url.pathname === '/api/owner/brand-assets/rollback')
        return json(await brandAssets.rollback(context));
      throw new ApiError('BRAND_ASSET_ROUTE_NOT_FOUND', 'The brand asset owner route was not found.', {
        status: 404,
      });
    }
    if (url.pathname === '/api/session') {
      const alias = new Request(new URL('/api/auth/session', url), {
        method: request.method,
        headers: request.headers,
      });
      return createAuthHttpHandler({
        service: auth,
        secureCookies: String(env.ENVIRONMENT).toUpperCase() !== 'DEVELOPMENT',
        correlationId: requestId,
        apiHeaders: API_SECURITY_HEADERS,
      })(alias);
    }
    if (url.pathname.startsWith('/api/auth/')) {
      return createAuthHttpHandler({
        service: auth,
        secureCookies: String(env.ENVIRONMENT).toUpperCase() !== 'DEVELOPMENT',
        correlationId: requestId,
        apiHeaders: API_SECURITY_HEADERS,
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
      if (url.pathname === '/api/admin/access/options') {
        return json({ ok: true, ...(await access.getAccessPolicyOptions(context)) });
      }
      if (url.pathname === '/api/admin/access/directory') {
        return json({ ok: true, ...(await access.listAccounts(context)) });
      }
      if (url.pathname === '/api/admin/access/history') {
        return json({
          ok: true,
          ...(await access.getAccessIdHistory({
            actor,
            accountId: command.accountId,
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
      if (url.pathname === '/api/admin/access/preview-policy') {
        return json({ ok: true, ...(await access.previewAccessPolicy(context)) });
      }
      if (url.pathname === '/api/admin/access/update-policy') {
        return json({ ok: true, ...(await access.updateAccessPolicy(context)) });
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

    if (url.pathname === '/api/admin/staff-directory' && request.method === 'POST') {
      await authorize(request, auth, CAPABILITIES.ACCESS_ADMIN, { mutation: false });
      return json({ ok: true, ...(await staffDirectory.list(await body(request))) });
    }

    if (url.pathname === '/api/admin/staff-account-activity-history' && request.method === 'POST') {
      await authorize(request, auth, CAPABILITIES.ACCESS_ADMIN, { mutation: false });
      return json({ ok: true, ...(await staffAccountActivityHistory().list(await body(request))) });
    }

    if (url.pathname.startsWith('/api/owner/identity-roster/') && request.method === 'POST') {
      const actor = (await authorize(request, auth, CAPABILITIES.SYSTEM_ADMIN, { mutation: true })).account;
      const command = await body(request);
      const context = { actor, command, correlationId: requestId };
      if (url.pathname === '/api/owner/identity-roster/status') {
        return json({ ok: true, ...(await identityRoster.status(context)) });
      }
      if (url.pathname === '/api/owner/identity-roster/preview') {
        return json({ ok: true, ...(await identityRoster.preview(context)) });
      }
      if (url.pathname === '/api/owner/identity-roster/directory') {
        return json({ ok: true, ...(await identityRoster.directory(context)) });
      }
      if (url.pathname === '/api/owner/identity-roster/apply') {
        return json({ ok: true, ...(await identityRoster.apply(context)) });
      }
      if (url.pathname === '/api/owner/identity-roster/rollback') {
        return json({ ok: true, ...(await identityRoster.rollback(context)) });
      }
      throw new IdentityRosterError('ROSTER_PREVIEW_NOT_FOUND', { status: 404 });
    }

    if (
      url.pathname === '/api/owner/identity-foundation/reconciliation-preview' &&
      request.method === 'POST'
    ) {
      const actor = (await authorize(request, auth, CAPABILITIES.SYSTEM_ADMIN, { mutation: false })).account;
      return json({ ok: true, ...(await identityFoundationReconciliation.preview({ actor })) });
    }

    if (
      url.pathname === '/api/owner/identity-foundation/source-projection-probe' &&
      request.method === 'POST'
    ) {
      const actor = (await authorize(request, auth, CAPABILITIES.SYSTEM_ADMIN, { mutation: false })).account;
      return json({ ok: true, ...(await sourceProjectionProbe.probe({ actor })) });
    }

    if (url.pathname.startsWith('/api/owner/evidence/') && request.method === 'POST') {
      const mutation = url.pathname !== '/api/owner/evidence/status';
      const actor = (await authorize(request, auth, CAPABILITIES.SYSTEM_ADMIN, { mutation })).account;
      const command = await body(request);
      if (url.pathname === '/api/owner/evidence/status') {
        return json({
          ok: true,
          ...(await operationalHealth.status({
            account: actor,
            evidenceId: command.evidenceId,
          })),
        });
      }
      if (url.pathname === '/api/owner/evidence/process') {
        const backup = await evidence.processBackups({
          limit: command.limit,
          evidenceId: command.evidenceId,
          correlationId: requestId,
        });
        const reconciliation = await evidence.reconcilePrimary({
          limit: command.limit,
          correlationId: requestId,
        });
        return json({
          ok: true,
          backup,
          reconciliation,
        });
      }
      if (url.pathname === '/api/owner/evidence/restore') {
        return json({
          ok: true,
          ...(await evidence.restore({
            account: actor,
            evidenceId: command.evidenceId,
            reason: command.reason,
            correlationId: requestId,
          })),
        });
      }
      if (url.pathname === '/api/owner/evidence/archive') {
        return json({
          ok: true,
          ...(await evidence.archive({
            account: actor,
            evidenceId: command.evidenceId,
            reason: command.reason,
            correlationId: requestId,
          })),
        });
      }
      throw new ApiError('EVIDENCE_OWNER_ROUTE_NOT_FOUND', 'The evidence owner route was not found.', {
        status: 404,
      });
    }

    if (url.pathname === '/api/identity-roster/self' && request.method === 'POST') {
      const actor = (await authorize(request, auth, CAPABILITIES.VIEW_REQUEST)).account;
      return json({ ok: true, ...(await identityRoster.selfProfile({ actor })) });
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
        const essential = await operations.essential({
          account,
          requestOnly,
          command,
          correlationId: requestId,
        });
        const module = await operations.bootstrapModule({
          account,
          requestOnly,
          command: { ...command, module: command.module ?? essential.activeModule },
          correlationId: requestId,
        });
        return json({ ...essential, ...module.data });
      }
      return json(await operations.essential({ account, requestOnly, command, correlationId: requestId }));
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
          // RV-01.4: the poller disables itself permanently when this is false,
          // after which route return, focus, and reconnect are all refused, and
          // an already-open Main Hub never notices a public submission. Near-
          // live refresh is a v0.7.2 requirement, so REST reports it enabled.
          enabled: true,
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
      const capability = operations.capabilityForMethod(method);
      if (!capability) {
        throw new ApiError('OPERATION_NOT_FOUND', 'The requested API operation was not found.', {
          status: 404,
        });
      }
      const actor = await authorize(request, auth, capability, { mutation: true });
      const command = await body(request, method === 'uploadEvidence' ? 14_100_000 : 1_100_000);
      const result = await operations.call(method, {
        account: actor.account,
        command,
        correlationId: requestId,
      });
      if (method === 'uploadEvidence' && !result.duplicate) {
        executionContext?.waitUntil(
          evidence
            .processBackups({
              limit: 1,
              evidenceId: result.evidenceId,
              correlationId: requestId,
            })
            .catch((error) => {
              structuredLog({
                level: 'error',
                event: 'EVIDENCE_BACKUP_BACKGROUND_FAILED',
                correlationId: requestId,
                env,
                details: {
                  result: 'FAILED',
                  errorCode: String(error?.code ?? 'EVIDENCE_BACKUP_BACKGROUND_FAILED')
                    .replace(/[^A-Z0-9_]/giu, '_')
                    .slice(0, 80),
                },
              });
            }),
        );
      }
      return json({ ok: true, ...result });
    }

    return json(
      { ok: false, code: 'NOT_FOUND', message: 'The API route was not found.', correlationId: requestId },
      404,
    );
  } catch (error) {
    const known =
      error instanceof ApiError ||
      error instanceof AuthError ||
      error instanceof AccessManagementError ||
      error instanceof EvidenceServiceError ||
      error instanceof IdentityRosterError ||
      error instanceof IdentityFoundationReconciliationError ||
      error instanceof IdentitySourceProjectionProbeError ||
      error instanceof StaffAccountActivityHistoryError ||
      error instanceof AccountApplicationError;
    const status =
      error instanceof ApiError ||
      error instanceof AccessManagementError ||
      error instanceof EvidenceServiceError ||
      error instanceof IdentityRosterError ||
      error instanceof IdentityFoundationReconciliationError ||
      error instanceof IdentitySourceProjectionProbeError ||
      error instanceof StaffAccountActivityHistoryError ||
      error instanceof AccountApplicationError
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
        ...((error instanceof ApiError || error instanceof AccountApplicationError) && error.details
          ? { details: error.details }
          : {}),
      },
      status,
    );
  }
}

export default {
  async fetch(request, env, executionContext) {
    const url = new URL(request.url);
    const hostRouteResponse = responseForHostRoute(
      resolveHostRoute(url, env.ENVIRONMENT, env.RECOVERY_HOSTNAME),
    );
    if (hostRouteResponse) return hostRouteResponse;
    const brandKey = BRAND_ASSET_KEYS[url.pathname];
    if (brandKey) return brandAsset(request, env, brandKey, { governedSlot: true });
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
      const response = await handleApi(request, env, requestId, executionContext);
      if (
        response.ok &&
        isPlaygroundRuntime(env) &&
        !['GET', 'HEAD', 'OPTIONS'].includes(request.method) &&
        !url.pathname.startsWith('/api/playground/')
      ) {
        executionContext.waitUntil(markPlaygroundModified(env.DB));
      }
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
  async scheduled(_event, env, executionContext) {
    const evidence = services(env).evidence;
    executionContext.waitUntil(
      Promise.all([
        evidence.processBackups({ limit: 10, correlationId: 'scheduled-evidence-backup' }),
        evidence.reconcilePrimary({
          limit: 10,
          correlationId: 'scheduled-evidence-reconciliation',
        }),
      ]).catch((error) => {
        structuredLog({
          level: 'error',
          event: 'EVIDENCE_BACKUP_SCHEDULE_FAILED',
          correlationId: 'scheduled-evidence-backup',
          env,
          details: {
            result: 'FAILED',
            errorCode: String(error?.code ?? 'EVIDENCE_BACKUP_SCHEDULE_FAILED')
              .replace(/[^A-Z0-9_]/giu, '_')
              .slice(0, 80),
          },
        });
      }),
    );
  },
};
