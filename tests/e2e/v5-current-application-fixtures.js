import { CAPABILITIES } from '../../src/domain/permissions.js';
import {
  createBootstrapModuleFixture,
  createEssentialBootstrapFixture,
} from '../fixtures/essential-bootstrap-fixtures.js';

export const STAGING = 'STAGING';
export const PRODUCTION = 'PRODUCTION';

function json(route, body, status = 200) {
  return route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(body),
  });
}

function releaseIdentity(environment) {
  return {
    ok: true,
    environment,
    playground: environment === STAGING,
    appVersion: environment === STAGING ? '0.8.1-playground.test' : '0.8.0',
    releaseVersion: environment === STAGING ? '0.8.1-playground.test' : '0.8.0',
    candidateSha: environment === STAGING ? 'b'.repeat(40) : 'a'.repeat(40),
    database: {
      schemaVersion: '30',
      latestMigration: '0030_production_access_and_operations.sql',
    },
  };
}

function health(environment) {
  return {
    ok: true,
    environment,
    database: { connected: true, schemaVersion: '30' },
    dependencies: {
      d1: true,
      brandAssets: true,
      evidenceAssets: true,
    },
  };
}

function authenticatedSession() {
  return {
    state: 'AUTHENTICATED',
    csrfToken: 'csrf-v5-browser-fixture',
    user: { accountId: 'SYNTHETIC-OWNER-001', displayName: 'Synthetic Owner' },
  };
}

function essential(environment, currentUser = {}) {
  const result = createEssentialBootstrapFixture({ backendMode: 'rest', environment });
  result.currentUser = {
    ...result.currentUser,
    ...currentUser,
    id: 'SYNTHETIC-OWNER-001',
    displayName: 'Synthetic Owner',
    role: 'SYSTEM_OWNER',
    authorization: {
      ...result.currentUser.authorization,
      roleId: 'SYSTEM_OWNER',
      roleLabel: 'System Owner',
      capabilities: Object.values(CAPABILITIES),
      workspaceIds: ['administrator', 'director', 'food', 'inventory-pantry', 'materials'],
      defaultWorkspaceId: 'administrator',
      ...(currentUser.authorization ?? {}),
    },
  };
  return result;
}

function playgroundStatus() {
  return {
    ok: true,
    playground: true,
    candidate: { version: '0.8.1-playground.test', commit: 'bbbbbbbbbbbb', artifact: 'fixture' },
    production: { version: '0.8.0', identity: 'aaaaaaaaaaaa', schema: '30' },
    cleanBaseline: {
      sourceProductionVersion: '0.8.0',
      sourceProductionIdentity: 'aaaaaaaaaaaa',
      capturedAt: '2026-08-09T00:00:00.000Z',
      schema: '30',
    },
    workingSchema: { version: '30' },
    d1BaselineParity: 'PASS',
    r2BaselineParity: 'PASS',
    workingState: 'CLEAN',
    activeTestSession: false,
    lastReset: '2026-08-09T00:00:00.000Z',
  };
}

export async function installV5ApiFixture(
  page,
  {
    environment = STAGING,
    authenticated = false,
    advertisements = [],
    currentUser = {},
    staffAccountActivityHistory = 'item',
  } = {},
) {
  const requests = [];
  let sessionAuthenticated = authenticated;
  await page.route('**/brand/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'image/png',
      body: Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=',
        'base64',
      ),
    }),
  );
  await page.route('**/api/**', async (route) => {
    const request = route.request();
    const pathname = new URL(request.url()).pathname;
    const body = request.postDataJSON?.() ?? {};
    requests.push({ method: request.method(), pathname, body });

    if (pathname === '/api/version') return json(route, releaseIdentity(environment));
    if (pathname === '/api/health') return json(route, health(environment));
    if (pathname === '/api/public/advertisements') return json(route, { items: advertisements });
    if (pathname === '/api/public/request/options') {
      return json(route, {
        eventSeries: [],
        events: [],
        items: [],
        references: [],
        stockAreas: [],
      });
    }
    if (pathname === '/api/public/lending/catalog') {
      return json(route, { uscDepartments: [], items: [], process: [] });
    }
    if (pathname === '/api/auth/session') {
      if (sessionAuthenticated) return json(route, authenticatedSession());
      return json(route, { code: 'SESSION_REQUIRED', message: 'Sign in to continue.' }, 401);
    }
    if (pathname === '/api/playground/session') {
      if (environment !== STAGING) {
        return json(route, { error: { code: 'PLAYGROUND_ENVIRONMENT_REFUSED' } }, 404);
      }
      sessionAuthenticated = true;
      return json(route, authenticatedSession());
    }
    if (pathname === '/api/auth/logout') {
      sessionAuthenticated = false;
      return json(route, { state: 'SIGNED_OUT' });
    }

    if (sessionAuthenticated && pathname === '/api/getEssentialBootstrapData') {
      return json(route, essential(environment, currentUser));
    }
    if (sessionAuthenticated && pathname === '/api/getBootstrapModule') {
      return json(
        route,
        createBootstrapModuleFixture({
          backendMode: 'rest',
          environment,
          module: body.module,
          rows: 2,
        }),
      );
    }
    if (sessionAuthenticated && pathname === '/api/getInventoryItem') {
      return json(route, {
        ok: true,
        item: {
          id: body.itemId,
          name: 'Synthetic authorized item',
          category: 'Office Supplies',
          handling: 'Consumable',
          unit: 'piece',
          onHand: 7,
          reserved: 2,
          availableToPromise: 5,
          status: 'ACTIVE',
        },
        ledgerTransactions: [],
      });
    }
    if (sessionAuthenticated && pathname === '/api/me/profile') {
      return json(route, {
        ok: true,
        profile: {
          roleLabel: 'System Owner',
          scopeLabel: 'All authorized operations',
          status: 'ACTIVE',
        },
      });
    }
    if (sessionAuthenticated && pathname === '/api/playground/status') {
      return json(route, playgroundStatus());
    }
    if (sessionAuthenticated && pathname === '/api/readiness') {
      return json(route, { ...health(environment), ready: true });
    }
    if (sessionAuthenticated && pathname === '/api/admin/access/directory') {
      return json(route, { ok: true, accounts: [], updatedAt: '2026-08-09T00:00:00.000Z' });
    }
    if (sessionAuthenticated && pathname === '/api/admin/staff-directory') {
      return json(route, {
        ok: true,
        page: 1,
        pageSize: 25,
        query: '',
        total: 1,
        items: [
          {
            personId: 'PER-123E4567-E89B-42D3-A456-426614174000',
            displayName: 'Safe Staff Name',
            accessId: 'STAFF.0001',
            linkState: 'ACTIVE',
            linkedAccountCount: 1,
            emailState: 'ACTIVE_VERIFIED',
            assignmentSummary: {
              activeCount: 1,
              historicalCount: 0,
              quarantinedCount: 0,
              provenanceState: 'PRESENT',
            },
          },
        ],
      });
    }
    if (sessionAuthenticated && pathname === '/api/admin/staff-account-activity-history') {
      if (staffAccountActivityHistory === 'error') {
        return json(
          route,
          {
            code: 'SYNTHETIC_PRIVATE_HISTORY_FAILURE',
            message: 'Synthetic protected source detail must never render.',
          },
          500,
        );
      }
      const empty = staffAccountActivityHistory === 'empty';
      return json(route, {
        ok: true,
        personId: body.personId,
        historyStartsAt: '2026-08-20T00:00:00.000Z',
        page: 1,
        pageSize: 25,
        total: empty ? 0 : 1,
        totalPages: empty ? 0 : 1,
        items: empty
          ? []
          : [
              {
                id: 'HIS-SYNTHETIC-0001',
                occurredAt: '2026-08-20T00:01:00.000Z',
                eventType: 'ACCOUNT_AUDIT',
                actionCode: 'ACCESS_ID_CHANGED',
                accountId: '<script>synthetic-account</script>',
                accountAccessIdSnapshot: 'STAFF.&lt;001&gt;',
                correlationId: 'COR-SYNTHETIC-ACTIVITY-0001',
                linkState: 'ACTIVE',
                previousLinkState: 'REVOKED',
                assignmentState: 'HISTORICAL',
                previousAssignmentState: 'ACTIVE',
                oldEffectiveFrom: '2026-08-01T00:00:00.000Z',
                oldEffectiveTo: '2026-08-02T00:00:00.000Z',
                newEffectiveFrom: '2026-08-03T00:00:00.000Z',
                newEffectiveTo: '2026-08-04T00:00:00.000Z',
              },
            ],
      });
    }
    if (sessionAuthenticated && pathname === '/api/getEventManagement') {
      return json(route, { ok: true, eventSeries: [], eventDays: [], events: [] });
    }
    if (sessionAuthenticated && pathname === '/api/getReferenceAdminWorkspace') {
      return json(route, { ok: true, items: [] });
    }
    if (
      sessionAuthenticated &&
      ['/api/admin/reference-links/list', '/api/owner/brand-assets/list'].includes(pathname)
    ) {
      return json(route, { ok: true, items: [] });
    }
    if (sessionAuthenticated && pathname === '/api/owner/evidence/status') {
      return json(route, { ok: true, status: 'READY' });
    }
    if (sessionAuthenticated) return json(route, { ok: true, items: [] });

    return json(route, { code: 'UNEXPECTED_V5_SMOKE_REQUEST', message: `No fixture for ${pathname}.` }, 500);
  });
  return requests;
}

export async function waitForV5(page) {
  await page.waitForFunction(() => {
    const runtime = globalThis.__HAU_V5_INTEGRATION__;
    return Boolean(runtime?.status && !document.documentElement.classList.contains('v4-boot'));
  });
}

export async function integrationStatus(page) {
  return page.evaluate(() => globalThis.__HAU_V5_INTEGRATION__.status());
}

export async function layoutMetrics(page) {
  return page.evaluate(() => ({
    viewportWidth: window.innerWidth,
    documentWidth: document.documentElement.scrollWidth,
    bodyWidth: document.body.scrollWidth,
  }));
}
