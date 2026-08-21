import { expect, test } from '@playwright/test';
import { GROUPS, SURFACES } from '../../src/v5/src/registry.js';
import {
  createBootstrapModuleFixture,
  createEssentialBootstrapFixture,
  createRequestQueueFixture,
} from '../fixtures/essential-bootstrap-fixtures.js';
import {
  PRODUCTION,
  STAGING,
  installV5ApiFixture,
  integrationStatus,
  layoutMetrics,
  waitForV5,
} from './v5-current-application-fixtures.js';

async function expectNoHorizontalOverflow(page) {
  const metrics = await layoutMetrics(page);
  expect(metrics.documentWidth, `document overflow at ${metrics.viewportWidth}px`).toBeLessThanOrEqual(
    metrics.viewportWidth + 1,
  );
  expect(metrics.bodyWidth, `body overflow at ${metrics.viewportWidth}px`).toBeLessThanOrEqual(
    metrics.viewportWidth + 1,
  );
}

function deferred() {
  let resolve;
  const promise = new Promise((next) => {
    resolve = next;
  });
  return { promise, resolve };
}

async function settleBrowserTasks(page) {
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  );
}

test('verified STAGING exposes the complete searchable Playground Index with a server-owned owner session', async ({
  page,
}) => {
  const requests = await installV5ApiFixture(page, { environment: STAGING });
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await page.goto('/#/index');
  await waitForV5(page);

  await expect(page.getByRole('heading', { name: 'Isolated Staging Playground Index' })).toBeVisible();
  await expect(page.locator('.preview-bar')).toContainText('Isolated Staging Playground');
  const releaseIdentity = page.locator('[data-playground-release-identity]');
  await expect(releaseIdentity).toHaveText(
    `STAGING TEST ENV | v0.8.1-playground.test | SHA ${'b'.repeat(12)}`,
  );
  await expect(releaseIdentity).not.toContainText('b'.repeat(40));
  await expect(page.locator('[data-index-group]')).toHaveCount(GROUPS.length);
  await expect(page.locator('[data-index-item]')).toHaveCount(SURFACES.length);
  await expect(page.locator('#index-search-status')).toHaveText(`${SURFACES.length} routes available`);

  const search = page.locator('#index-search');
  await expect(search).toHaveAttribute('placeholder', 'Search routes, modules, or workspaces');
  await page.keyboard.press('/');
  await expect(search).toBeFocused();
  await search.fill('request.queue');
  await expect(page.locator('[data-index-item]:visible')).toHaveCount(1);
  await expect(page.locator('[data-index-item]:visible')).toHaveAttribute('href', '#/request.queue');
  await search.clear();
  await page.locator('[data-index-item][href="#/request.queue"]').click();

  await expect(page.getByRole('heading', { name: 'Request Center' })).toBeVisible();
  await expect(page).toHaveURL(/#\/request\.queue$/u);
  expect(requests.some(({ pathname }) => pathname === '/api/auth/session')).toBe(true);
  expect(requests.some(({ pathname }) => pathname === '/api/playground/session')).toBe(true);
  expect((await integrationStatus(page)).authenticated).toBe(true);
  await expectNoHorizontalOverflow(page);
  expect(pageErrors).toEqual([]);
});

test('production identity cannot activate playground chrome or the Index route', async ({ page }) => {
  const requests = await installV5ApiFixture(page, { environment: PRODUCTION });
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await page.goto('/#/index');
  await waitForV5(page);

  await expect(page.getByRole('heading', { name: 'Holy Angel University Student Council' })).toBeVisible();
  await expect(page.locator('.preview-bar')).toHaveCount(0);
  await expect(page.locator('[data-playground-release-identity]')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Isolated Staging Playground Index' })).toHaveCount(0);
  await expect(page.locator('[href="#/index"]')).toHaveCount(0);
  await expect(page).toHaveURL(/#\/public\.landing$/u);
  expect((await integrationStatus(page)).playgroundVerified).toBe(false);
  expect(requests.some(({ pathname }) => pathname === '/api/playground/session')).toBe(false);
  await expectNoHorizontalOverflow(page);
  expect(pageErrors).toEqual([]);
});

test('unauthenticated Staff sign in return to portals stays public without session reads', async ({
  page,
}) => {
  const requests = await installV5ApiFixture(page, { environment: STAGING, authenticated: false });
  await page.goto('/#/public.signin');
  await waitForV5(page);

  await page.getByRole('link', { name: 'Return to Portals' }).click();

  await expect(page).toHaveURL(/#\/public\.landing$/u);
  expect(requests.some(({ pathname }) => pathname === '/api/auth/session')).toBe(false);
  expect(requests.some(({ pathname }) => pathname === '/api/playground/session')).toBe(false);
});

test('invalid release identity cannot activate the Playground cue or owner session', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'v5-chromium-1440', 'The invalid identity guard runs once.');
  const requests = await installV5ApiFixture(page, { environment: STAGING });
  await page.route('**/api/version', async (route) => {
    if (new URL(route.request().url()).pathname !== '/api/version') return route.fallback();
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        environment: 'STAGING',
        playground: true,
        appVersion: '0.8.1-playground.test',
        releaseVersion: '0.8.1-playground.other',
        candidateSha: 'B'.repeat(40),
        database: { schemaVersion: '30' },
      }),
    });
  });

  await page.goto('/#/index');
  await waitForV5(page);

  await expect(page.getByRole('heading', { name: 'Holy Angel University Student Council' })).toBeVisible();
  await expect(page.locator('[data-playground-release-identity]')).toHaveCount(0);
  expect((await integrationStatus(page)).playgroundVerified).toBe(false);
  expect(requests.some(({ pathname }) => pathname === '/api/playground/session')).toBe(false);
});

test('published public announcement remains a truthful update without replacing the logistics landing intent', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'v5-chromium-1440', 'The governed projection contract runs once.');
  await installV5ApiFixture(page, {
    environment: STAGING,
    advertisements: [
      {
        id: 'EVENT-YDD-2026',
        title: 'Youth Development Day 2026',
        description: 'Sibulahi: Yabong ng Pamana brings the Angelite community together.',
        altText: 'Youth Development Day 2026 official event cover',
        callToAction: 'View event details',
        destinationUrl: 'https://www.facebook.com/holyangeluniversitysc/',
        imageUrl: '/brand/login-background',
      },
    ],
  });

  await page.goto('/#/public.landing');
  await waitForV5(page);
  await expect(page.locator('.landing-updates')).toHaveAttribute('data-advertisement-state', 'populated');
  await expect(page.locator('.landing-hero h1')).toHaveText('Every request. Every handoff. On record.');
  await expect(page.locator('.landing-hero__eyebrow')).toHaveText('HAU-USC · Institutional Logistics Ledger');
  await expect(page.locator('.landing-hero__actions .btn--primary')).toHaveText(/Start a logistics request/u);
  await expect(page.locator('.landing-link')).toHaveText(/Browse public lending/u);
  await expect(page.locator('.landing-updates h2')).toHaveText('Youth Development Day 2026');
  await expect(page.locator('.landing-updates__media')).toHaveAttribute(
    'alt',
    'Youth Development Day 2026 official event cover',
  );
});

test('public landing truthfully projects loading, empty, request-error, and media-failure states', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'v5-chromium-1440', 'The public advertisement lifecycle runs once.');
  const delayed = deferred();
  await installV5ApiFixture(page, { environment: STAGING });
  await page.route('**/api/public/advertisements', async (route) => {
    await delayed.promise;
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ items: [] }),
    });
  });

  await page.goto('/#/public.landing');
  await waitForV5(page);
  const updates = page.locator('.landing-updates');
  const institutionalMedia = page.locator('.landing-hero__institutional-media');
  await expect(updates).toHaveAttribute('data-advertisement-state', 'loading');
  await expect(updates).toHaveAttribute('aria-busy', 'true');
  await expect(updates.getByRole('heading')).toHaveText('Loading official updates');
  await expect(page.getByRole('link', { name: 'Start a logistics request', exact: true })).toBeVisible();
  await expect(institutionalMedia).toBeVisible();

  delayed.resolve();
  await expect(updates).toHaveAttribute('data-advertisement-state', 'empty');
  await expect(updates).toHaveAttribute('aria-busy', 'false');
  await expect(updates).toContainText('No published updates are currently available.');
  await expect(institutionalMedia).toBeVisible();
  await expect(page.locator('[data-v5-admin-parity="advertisement-projection"]')).toBeHidden();

  await page.unroute('**/api/public/advertisements');
  await page.route('**/api/public/advertisements', (route) =>
    route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ code: 'PUBLIC_ADVERTISEMENT_UNAVAILABLE' }),
    }),
  );
  await page.goto('/#/public.signin');
  await expect(page.locator('.auth-card--signin')).toBeVisible();
  await page.goto('/#/public.landing');
  await expect(updates).toHaveAttribute('data-advertisement-state', 'error');
  await expect(updates.getByRole('heading')).toHaveText('Updates are temporarily unavailable');
  await expect(page.getByRole('link', { name: 'Start a logistics request', exact: true })).toBeVisible();
  await expect(institutionalMedia).toBeVisible();

  await page.unroute('**/api/public/advertisements');
  await page.route('**/api/public/advertisements', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items: [
          {
            title: 'Published public update',
            description: 'Published content is supplied only through the public endpoint.',
            mediaUrl: '/media/advertisements/published-public-update',
          },
        ],
      }),
    }),
  );
  await page.route('**/media/advertisements/**', (route) => route.fulfill({ status: 503 }));
  await page.goto('/#/public.signin');
  await expect(page.locator('.auth-card--signin')).toBeVisible();
  await page.goto('/#/public.landing');
  await expect(updates).toHaveAttribute('data-advertisement-state', 'media-failure');
  await expect(updates).toContainText('The published media could not be loaded.');
  await expect(updates).toContainText('Core public destinations are unaffected.');
  await expect(page.getByRole('link', { name: 'Start a logistics request', exact: true })).toBeVisible();
  await expect(institutionalMedia).toBeVisible();
  await expect(page.locator('.landing-updates__media-slot')).toBeHidden();
  await expectNoHorizontalOverflow(page);
});

test('verification confirmation accepts only an eight-digit one-time code shape', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'v5-chromium-1440', 'The field contract runs once.');
  await installV5ApiFixture(page, { environment: STAGING });
  await page.goto('/#/public.verify');
  await waitForV5(page);

  const code = page.getByLabel('Verification code');
  await expect(code).toHaveAttribute('inputmode', 'numeric');
  await expect(code).toHaveAttribute('pattern', '\\d{8}');
  await expect(code).toHaveAttribute('minlength', '8');
  await expect(code).toHaveAttribute('maxlength', '8');
  await expect(code).toHaveAttribute('autocomplete', 'one-time-code');
});

test('FI-03 application status leaves protected-token presentation to its route-local controller', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'v5-chromium-1440', 'The FI-03 route contract runs once.');
  await installV5ApiFixture(page, { environment: STAGING });
  await page.goto('/#/public.application-status');
  await waitForV5(page);

  await expect(page.getByRole('heading', { name: 'Application status' })).toBeVisible();
  await expect(
    page.getByText('Use the private status token issued after submission. It is never placed in a URL.'),
  ).toBeVisible();
  await expect(page.getByText('Application not loaded')).toHaveCount(0);
  await expect(page.getByLabel('Status token')).toHaveAttribute('type', 'password');
});

test('FI-03 projects verification and protected-token results without rendering credentials', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'v5-chromium-1440', 'The FI-03 result projection runs once.');
  await installV5ApiFixture(page, { environment: STAGING });
  await page.route('**/api/account-applications/email/confirm', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, verificationReceipt: 'private-verification-receipt' }),
    }),
  );
  await page.route('**/api/account-applications/status', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        applicationCode: 'AAP-SYNTHETIC-004',
        state: 'CHANGES_REQUESTED',
        revision: 6,
        submittedAt: '2026-08-22T01:00:00.000Z',
        updatedAt: '2026-08-22T02:00:00.000Z',
        nextStep: 'COMPLETE_AND_SUBMIT_APPLICATION',
        changeRequestSummary: 'Correct the governed affiliation selection.',
      }),
    }),
  );

  await page.goto('/#/public.verify');
  await waitForV5(page);
  await page.getByLabel('Action').selectOption('CONFIRM');
  await page.getByLabel('Institutional email').fill('eligible@example.test');
  await page.getByLabel('Verification code').fill('01234567');
  await page.getByRole('button', { name: 'Continue verification' }).click();
  await expect(page.locator('[data-fi03-result]')).toContainText('Email verification complete');
  await expect(page.locator('[data-fi03-result]')).not.toContainText('private-verification-receipt');

  await page.goto('/#/public.application-status');
  await page.getByLabel('Status token').fill('private-status-token');
  await page.getByRole('button', { name: 'Run application action' }).click();
  const result = page.locator('[data-fi03-result]');
  await expect(result).toContainText('AAP-SYNTHETIC-004');
  await expect(result).toContainText('Changes Requested');
  await expect(result).toContainText('Correct the governed affiliation selection.');
  await expect(result).not.toContainText('private-status-token');
  await expectNoHorizontalOverflow(page);
});

test('public intake stays public while an internal route receives the guarded playground owner session', async ({
  page,
}) => {
  const requests = await installV5ApiFixture(page, { environment: STAGING });

  await page.goto('/#/public.request-intake');
  await waitForV5(page);
  await expect(page.getByRole('heading', { name: 'Request Center' })).toBeVisible();
  await expect(page.locator('#request-center-form')).toBeVisible();
  expect(requests.some(({ pathname }) => pathname === '/api/public/request/options')).toBe(true);
  expect(requests.some(({ pathname }) => pathname === '/api/auth/session')).toBe(false);

  await page.goto('/#/request.queue');
  await expect(page.getByRole('heading', { name: 'Request Center' })).toBeVisible();
  expect(requests.some(({ pathname }) => pathname === '/api/auth/session')).toBe(true);
  expect(requests.some(({ pathname }) => pathname === '/api/playground/session')).toBe(true);
  await expect
    .poll(async () => {
      const status = await integrationStatus(page);
      return { authenticated: status.authenticated, currentRoute: status.currentRoute };
    })
    .toEqual({ authenticated: true, currentRoute: 'request.queue' });
  await expectNoHorizontalOverflow(page);
});

test('public sign-in keeps reset collapsed and renders starter activation only after an activation-required login', async ({
  page,
}) => {
  await installV5ApiFixture(page, { environment: STAGING });
  await page.goto('/#/public.signin');
  await waitForV5(page);

  const reset = page.locator('details[data-v5-admin-parity="auth-reset"]');
  await expect(reset).toBeVisible();
  await expect(reset.locator('summary')).toHaveText('Complete password reset');
  await expect(reset.locator(':scope > .panel__body > p.muted')).toHaveText(
    'Paste the reset token from your approved password-recovery message.',
  );
  expect(await reset.evaluate((element) => element.open)).toBe(false);
  await expect(page.locator('[data-v5-admin-parity="auth-activate"]')).toHaveCount(0);

  await page.route('**/api/auth/login', async (route) => {
    const request = route.request();
    if (request.method() !== 'POST' || new URL(request.url()).pathname !== '/api/auth/login') {
      return route.fallback();
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ state: 'ACTIVATION_REQUIRED', csrfToken: 'csrf-activation-e2e' }),
    });
  });
  await page.getByLabel('Identifier').fill('synthetic.activation');
  await page
    .locator('.auth-card--signin form')
    .locator('input[name="p"]')
    .fill('synthetic-activation-password');
  await page.locator('.auth-card--signin form').getByRole('button', { name: 'Sign in' }).click();

  const activation = page.locator('[data-v5-admin-parity="auth-activate"]');
  await expect(activation).toBeVisible();
  await expect(activation.getByText('USC work email', { exact: true })).toBeVisible();
  await expect(activation.getByText('Use your approved USC work email.', { exact: true })).toBeVisible();
});

const defaultWorkspaceRouteCases = [
  {
    workspaceId: 'administrator',
    capabilities: ['view.internal'],
    expectedRoute: 'admin.overview',
  },
  {
    workspaceId: 'director',
    capabilities: ['view.all.summary'],
    expectedRoute: 'director.overview',
  },
  { workspaceId: 'food', capabilities: ['view.internal'], expectedRoute: 'food.overview' },
  {
    workspaceId: 'inventory-pantry',
    capabilities: ['view.inventory'],
    expectedRoute: 'inventory.overview',
  },
  {
    workspaceId: 'materials',
    capabilities: ['view.internal'],
    expectedRoute: 'materials.overview',
  },
  {
    workspaceId: 'director',
    capabilities: ['view.internal'],
    explicitDenies: ['view.all.summary'],
    expectedRoute: 'account.profile',
    deniedRoute: 'director.overview',
  },
];

for (const routeCase of defaultWorkspaceRouteCases) {
  test(`successful sign-in selects only the server-authorized default workspace route: ${routeCase.workspaceId} -> ${routeCase.expectedRoute}${routeCase.deniedRoute ? ' (mapped route denied)' : ''}`, async ({
    context,
  }, testInfo) => {
    test.skip(testInfo.project.name !== 'v5-chromium-1440', 'The default route matrix runs once.');
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));
    await installV5ApiFixture(page, { environment: STAGING, authenticated: true });

    const bootstrap = createEssentialBootstrapFixture({
      backendMode: 'rest',
      environment: STAGING,
    });
    bootstrap.currentUser = {
      ...bootstrap.currentUser,
      authorization: {
        ...bootstrap.currentUser.authorization,
        capabilities: routeCase.capabilities,
        workspaceIds: [routeCase.workspaceId],
        defaultWorkspaceId: routeCase.workspaceId,
        explicitDenies: routeCase.explicitDenies ?? [],
      },
    };

    await page.route('**/api/getEssentialBootstrapData', async (route) => {
      if (new URL(route.request().url()).pathname !== '/api/getEssentialBootstrapData') {
        return route.fallback();
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(bootstrap),
      });
    });
    await page.route('**/api/auth/login', async (route) => {
      if (
        route.request().method() !== 'POST' ||
        new URL(route.request().url()).pathname !== '/api/auth/login'
      ) {
        return route.fallback();
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          state: 'AUTHENTICATED',
          csrfToken: 'csrf-default-route-e2e',
          user: { accountId: 'SYNTHETIC-OWNER-001', displayName: 'Synthetic Owner' },
        }),
      });
    });

    try {
      await page.goto('/#/public.signin');
      await waitForV5(page);
      await page.getByLabel('Identifier').fill('synthetic.owner');
      await page
        .locator('.auth-card--signin form')
        .locator('input[name="p"]')
        .fill('synthetic-owner-password');
      await page.locator('.auth-card--signin form').getByRole('button', { name: 'Sign in' }).click();

      await expect.poll(() => new URL(page.url()).hash).toBe(`#/${routeCase.expectedRoute}`);
      await expect
        .poll(async () => (await integrationStatus(page)).currentRoute)
        .toBe(routeCase.expectedRoute);
      expect((await integrationStatus(page)).authenticated).toBe(true);
      if (routeCase.deniedRoute) {
        await expect(page.locator(`[data-act="go"][data-id="${routeCase.deniedRoute}"]`)).toHaveCount(0);
      }
      expect(pageErrors).toEqual([]);
    } finally {
      await page.close();
    }
  });
}

test('a Food session sees a data-free denial for the Materials overview before backend reads', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'v5-chromium-390', 'The denied overview contract runs once.');
  const requests = await installV5ApiFixture(page, { environment: STAGING, authenticated: true });
  const bootstrap = createEssentialBootstrapFixture({ backendMode: 'rest', environment: STAGING });
  bootstrap.currentUser = {
    ...bootstrap.currentUser,
    authorization: {
      ...bootstrap.currentUser.authorization,
      capabilities: ['view.internal'],
      workspaceIds: ['food'],
      defaultWorkspaceId: 'food',
      explicitDenies: [],
    },
  };
  await page.route('**/api/getEssentialBootstrapData', async (route) => {
    if (new URL(route.request().url()).pathname !== '/api/getEssentialBootstrapData') {
      return route.fallback();
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(bootstrap),
    });
  });

  await page.goto('/#/materials.overview');
  await waitForV5(page);

  await expect(page).toHaveURL(/#\/materials\.overview$/u);
  await expect(page.getByRole('heading', { name: 'You do not have access to this area' })).toBeVisible();
  await expect(
    page.locator('.overview-command, [data-v5-operations-parity], [data-v5-admin-parity], table'),
  ).toHaveCount(0);
  const protectedDataPaths = new Set([
    '/api/getBootstrapModule',
    '/api/getEventManagement',
    '/api/admin/access/directory',
    '/api/getReferenceAdminWorkspace',
    '/api/admin/reference-links/list',
    '/api/owner/brand-assets/list',
    '/api/me/profile',
    '/api/readiness',
    '/api/owner/evidence/status',
  ]);
  expect(requests.filter(({ pathname }) => protectedDataPaths.has(pathname))).toEqual([]);
});

test('Staff Directory loads the canonical safe projection only for ACCESS_ADMIN', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'v5-chromium-390', 'The Staff Directory contract runs once.');
  const requests = await installV5ApiFixture(page, { environment: STAGING, authenticated: true });

  await page.goto('/#/admin.directory');
  await waitForV5(page);

  await expect(page.getByRole('heading', { name: 'Staff Directory' })).toBeVisible();
  await expect.poll(async () => (await integrationStatus(page)).connectedRoutes).toContain('admin.directory');
  await expect(page.locator('[data-canonical-staff-directory]')).toContainText(
    'PER-123E4567-E89B-42D3-A456-426614174000',
  );
  await expect(page.locator('[data-canonical-staff-directory]')).toContainText(
    'Safe Staff Name · STAFF.0001',
  );
  expect(requests.filter(({ pathname }) => pathname === '/api/admin/staff-directory')).toHaveLength(1);
  expect(requests.filter(({ pathname }) => pathname === '/api/admin/access/directory')).toHaveLength(0);
  expect(requests.filter(({ pathname }) => pathname.startsWith('/api/owner/identity-roster/'))).toEqual([]);
  await expect(page.locator('[data-v5-admin-parity]')).toHaveCount(0);
});

test('Staff Directory renders retained activity through textContent without a roster or access fallback', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'v5-chromium-390',
    'The retained activity rendering contract runs once.',
  );
  const requests = await installV5ApiFixture(page, { environment: STAGING, authenticated: true });

  await page.goto('/#/admin.directory');
  await waitForV5(page);
  await page.getByRole('button', { name: 'View history', exact: true }).click();

  const panel = page.locator('[data-staff-account-activity-history]');
  await expect(panel).toContainText('Staff account activity history');
  await expect(panel).toContainText('<script>synthetic-account</script>');
  await expect(panel).toContainText('2026-08-20T00:00:00.000Z');
  await expect(panel.locator('script')).toHaveCount(0);
  await expect(panel.locator('img')).toHaveCount(0);
  expect(requests.filter(({ pathname }) => pathname === '/api/admin/staff-account-activity-history')).toEqual(
    [
      {
        method: 'POST',
        pathname: '/api/admin/staff-account-activity-history',
        body: {
          personId: 'PER-123E4567-E89B-42D3-A456-426614174000',
          page: 1,
          pageSize: 25,
        },
      },
    ],
  );
  expect(requests.filter(({ pathname }) => pathname === '/api/admin/access/directory')).toEqual([]);
  expect(requests.filter(({ pathname }) => pathname.startsWith('/api/owner/identity-roster/'))).toEqual([]);
});

test('Staff Directory gives retained-history empty and generic-error states without stale entries', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'v5-chromium-390', 'The retained activity state contract runs once.');
  const requests = await installV5ApiFixture(page, {
    environment: STAGING,
    authenticated: true,
    staffAccountActivityHistory: 'empty',
  });

  await page.goto('/#/admin.directory');
  await waitForV5(page);
  await page.getByRole('button', { name: 'View history', exact: true }).click();
  const panel = page.locator('[data-staff-account-activity-history]');
  await expect(panel).toContainText(
    'No retained activity is available. Retention begins 2026-08-20T00:00:00.000Z.',
  );
  await expect(panel.locator('tbody tr')).toHaveCount(0);

  await page.unroute('**/api/admin/staff-account-activity-history');
  await page.route('**/api/admin/staff-account-activity-history', (route) =>
    route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 'SYNTHETIC_PRIVATE_HISTORY_FAILURE',
        message: 'Synthetic protected source detail must never render.',
      }),
    }),
  );
  await page.getByRole('button', { name: 'View history', exact: true }).click();
  await expect(panel).toContainText('Activity history could not be loaded. Try again.');
  await expect(panel).not.toContainText('SYNTHETIC_PRIVATE_HISTORY_FAILURE');
  await expect(panel).not.toContainText('Synthetic protected source detail');
  await expect(panel.locator('tbody tr')).toHaveCount(0);
  expect(requests.filter(({ pathname }) => pathname === '/api/admin/access/directory')).toEqual([]);
  expect(requests.filter(({ pathname }) => pathname.startsWith('/api/owner/identity-roster/'))).toEqual([]);
});

test('Staff Directory discards a delayed activity-history response after navigation away and return', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'v5-chromium-390',
    'The retained activity navigation-race contract runs once.',
  );
  await installV5ApiFixture(page, { environment: STAGING, authenticated: true });

  await page.goto('/#/admin.directory');
  await waitForV5(page);
  await page.unroute('**/api/admin/staff-account-activity-history');
  let releaseHistoryResponse;
  const historyRequest = page.waitForRequest('**/api/admin/staff-account-activity-history');
  await page.route('**/api/admin/staff-account-activity-history', async (route) => {
    await new Promise((resolve, reject) => {
      releaseHistoryResponse = async () => {
        try {
          await route.fulfill({
            contentType: 'application/json',
            body: JSON.stringify({
              ok: true,
              personId: 'PER-123E4567-E89B-42D3-A456-426614174000',
              historyStartsAt: '2026-08-20T00:00:00.000Z',
              page: 1,
              pageSize: 25,
              total: 1,
              totalPages: 1,
              items: [
                {
                  id: 'HIS-DELAYED-0001',
                  occurredAt: '2026-08-20T00:01:00.000Z',
                  eventType: 'ACCOUNT_AUDIT',
                  actionCode: 'ACCESS_ID_CHANGED',
                  accountId: 'STALE.ACCOUNT.001',
                  accountAccessIdSnapshot: 'STALE.ACCOUNT.001',
                  correlationId: 'COR-DELAYED-0001',
                  linkState: 'ACTIVE',
                  previousLinkState: null,
                  assignmentState: null,
                  previousAssignmentState: null,
                  oldEffectiveFrom: null,
                  oldEffectiveTo: null,
                  newEffectiveFrom: null,
                  newEffectiveTo: null,
                },
              ],
            }),
          });
          resolve();
        } catch (error) {
          reject(error);
        }
      };
    });
  });

  await page.getByRole('button', { name: 'View history', exact: true }).click();
  await historyRequest;
  expect(releaseHistoryResponse).toEqual(expect.any(Function));
  await page.goto('/#/admin.overview');
  await waitForV5(page);
  await page.goto('/#/admin.directory');
  await waitForV5(page);
  const panel = page.locator('[data-staff-account-activity-history]');
  await expect(panel).toContainText('Select a canonical person to load their retained activity history.');
  await expect(panel.locator('tbody tr')).toHaveCount(0);

  await releaseHistoryResponse();
  await page.waitForTimeout(50);
  await expect(panel).not.toContainText('STALE.ACCOUNT.001');
  await expect(panel).toContainText('Select a canonical person to load their retained activity history.');
  await expect(panel.locator('tbody tr')).toHaveCount(0);
});

test('Staff Directory denies users without ACCESS_ADMIN before any directory read', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'v5-chromium-390', 'The Staff Directory denial contract runs once.');
  const requests = await installV5ApiFixture(page, {
    environment: STAGING,
    authenticated: true,
    currentUser: {
      authorization: {
        capabilities: ['view.internal'],
        workspaceIds: ['food'],
        defaultWorkspaceId: 'food',
        explicitDenies: [],
      },
    },
  });
  await page.goto('/#/admin.directory');
  await waitForV5(page);

  await expect(page.getByRole('heading', { name: 'You do not have access to this area' })).toBeVisible();
  expect(requests.filter(({ pathname }) => pathname === '/api/admin/staff-directory')).toEqual([]);
  expect(requests.filter(({ pathname }) => pathname === '/api/admin/staff-account-activity-history')).toEqual(
    [],
  );
  expect(requests.filter(({ pathname }) => pathname === '/api/admin/access/directory')).toEqual([]);
  expect(requests.filter(({ pathname }) => pathname.startsWith('/api/owner/identity-roster/'))).toEqual([]);
});

test('authenticated R1 lending and release forms preserve labels and release identity separation', async ({
  page,
}) => {
  await installV5ApiFixture(page, { environment: STAGING, authenticated: true });
  await page.route('**/api/getBootstrapModule', async (route) => {
    const request = route.request();
    const body = request.postDataJSON?.() ?? {};
    if (new URL(request.url()).pathname !== '/api/getBootstrapModule' || body.module !== 'release') {
      return route.fallback();
    }
    const fixture = createBootstrapModuleFixture({
      backendMode: 'rest',
      environment: STAGING,
      module: 'release',
      rows: 2,
    });
    fixture.data = {
      ...fixture.data,
      requests: [{ id: 'REQ-S06-RELEASE-001', status: 'READY_FOR_RELEASE' }],
      requestLines: [
        {
          id: 'RQL-S06-RELEASE-001',
          requestId: 'REQ-S06-RELEASE-001',
          description: 'Synthetic authorized release item',
          requestedQuantity: 1,
          releasedQuantity: 0,
          unit: 'piece',
        },
      ],
    };
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(fixture),
    });
  });

  await page.goto('/#/lending.queue');
  await waitForV5(page);
  await page.waitForFunction(() =>
    globalThis.__HAU_V5_INTEGRATION__?.status?.().connectedRoutes?.includes('lending.queue'),
  );
  const lending = page.locator('[data-v5-command="lending-create"]');
  await expect(lending).toBeVisible();
  await expect(lending.locator('option[value="USC_STAFF"]')).toHaveText('USC Staff/Officer');
  await expect(lending.getByText('Student ID No.', { exact: true })).toBeVisible();
  await expect(lending.getByText('Contact Number', { exact: true })).toBeVisible();
  await expect(lending.locator('[name="notes"]')).toHaveCount(0);

  await page.goto('/#/release.desk');
  await waitForV5(page);
  await page.waitForFunction(() =>
    globalThis.__HAU_V5_INTEGRATION__?.status?.().connectedRoutes?.includes('release.desk'),
  );
  const release = page.locator('[data-v5-command="release-confirm"]');
  await expect(release).toBeVisible();
  await expect(release.getByText('Request Ticket ID', { exact: true })).toBeVisible();
  await expect(release.getByText('Release item', { exact: true })).toBeVisible();
  expect(await release.locator('input[name="recipientConfirmed"]').evaluate((input) => input.required)).toBe(
    true,
  );
});

async function installR2QueueFixture(page) {
  const requests = await installV5ApiFixture(page, { environment: STAGING, authenticated: true });
  await page.route('**/api/getBootstrapModule', async (route) => {
    const request = route.request();
    const body = request.postDataJSON?.() ?? {};
    if (
      new URL(request.url()).pathname !== '/api/getBootstrapModule' ||
      !['lending', 'release', 'request'].includes(body.module)
    ) {
      return route.fallback();
    }
    const fixture = createBootstrapModuleFixture({
      backendMode: 'rest',
      environment: STAGING,
      module: body.module,
      rows: 2,
    });
    fixture.data =
      body.module === 'release'
        ? {
            ...fixture.data,
            requests: [
              { id: 'REQ-DEMO-421', status: 'READY_FOR_RELEASE' },
              { id: 'REQ-DEMO-417', status: 'READY_FOR_RELEASE' },
            ],
            requestLines: [
              {
                id: 'RQL-S07-RELEASE-A',
                requestId: 'REQ-DEMO-421',
                description: 'Synthetic authorized release A',
                requestedQuantity: 1,
                releasedQuantity: 0,
                unit: 'piece',
              },
              {
                id: 'RQL-S07-RELEASE-B',
                requestId: 'REQ-DEMO-417',
                description: 'Synthetic authorized release B',
                requestedQuantity: 1,
                releasedQuantity: 0,
                unit: 'piece',
              },
            ],
          }
        : body.module === 'lending'
          ? {
              ...fixture.data,
              lendingTickets: [
                {
                  id: 'LOAN-DEMO-221',
                  itemId: 'SYNTHETIC-ITEM-001',
                  borrowerName: 'Synthetic authorized borrower',
                  borrowerType: 'USC_STAFF',
                  quantity: 1,
                  status: 'ACTIVE',
                  returnBy: '2026-08-15',
                },
              ],
            }
          : (() => {
              const requestFixture = createRequestQueueFixture();
              return {
                ...fixture.data,
                requests: requestFixture.requests.map((entry) => ({ ...entry, id: 'REQ-DEMO-431' })),
                requestLines: requestFixture.requestLines.map((line, index) => ({
                  ...line,
                  id: `RQL-DEMO-431-${index + 1}`,
                  requestId: 'REQ-DEMO-431',
                })),
              };
            })();
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(fixture),
    });
  });
  return requests;
}

test('authenticated R2 lending queue searches loaded rows', async ({ page }) => {
  await installR2QueueFixture(page);
  await page.goto('/#/lending.queue');
  await waitForV5(page);
  await page.waitForFunction(() =>
    globalThis.__HAU_V5_INTEGRATION__?.status?.().connectedRoutes?.includes('lending.queue'),
  );
  const lendingSearch = page.getByRole('searchbox', { name: 'Search loans' });
  await lendingSearch.fill('no authorized lending result');
  await expect(page.locator('[data-v5-route-search-status="lending.queue"]')).toHaveText(
    'No authorized loans match the current search.',
  );
  await expect(page.locator('table.q tbody tr:visible')).toHaveCount(0);
  await page.getByRole('button', { name: 'Reset loan search' }).click();
  await expect(page.locator('[data-v5-route-search-status="lending.queue"]')).toContainText(
    'authorized loans shown',
  );
});

test('authenticated R2 release desk searches loaded rows and keeps contextual operations selected and fail closed', async ({
  page,
}, testInfo) => {
  const requests = await installR2QueueFixture(page);
  await page.goto('/#/release.desk');
  await waitForV5(page);
  await page.waitForFunction(() =>
    globalThis.__HAU_V5_INTEGRATION__?.status?.().connectedRoutes?.includes('release.desk'),
  );
  const releaseSearch = page.getByRole('searchbox', { name: 'Search releases' });
  await releaseSearch.fill('no authorized release result');
  await expect(page.locator('[data-v5-route-search-status="release.desk"]')).toHaveText(
    'No authorized releases match the current search.',
  );
  await expect(page.locator('table.q tbody tr:visible')).toHaveCount(0);
  await page.getByRole('button', { name: 'Reset release search' }).click();
  await expect(page.locator('[data-v5-contextual-mount="release.desk"] h2')).toHaveText(
    'Release review actions',
  );
  await expect(
    page.locator('[data-v5-contextual-mount="release.desk"] [data-v5-command="release-confirm"]'),
  ).toBeVisible();
  const mobileViewport = (testInfo.project.use.viewport?.width ?? page.viewportSize()?.width ?? 1440) < 1181;
  const visibleDrawer = page.locator('.drawer:visible');
  await page.locator('[data-act="select:release"]').first().click();
  await expect(
    page.locator('[data-v5-contextual-mount="release.desk"] [data-v5-command="release-confirm"]'),
  ).toBeVisible();
  if (mobileViewport) await expect(visibleDrawer).toHaveCount(0);
  const requestsBeforeMismatch = requests.length;
  await page.locator('[data-act="select:release"]').nth(1).click();
  await expect(page.locator('[data-v5-command="release-confirm"]')).toHaveCount(0);
  expect(requests).toHaveLength(requestsBeforeMismatch);
  if (mobileViewport) await expect(visibleDrawer).toHaveCount(0);
});

test('authenticated R2 request queue keeps contextual operations selected and fail closed', async ({
  page,
}, testInfo) => {
  await installR2QueueFixture(page);
  const mobileViewport = (testInfo.project.use.viewport?.width ?? page.viewportSize()?.width ?? 1440) < 1181;
  await page.goto('/#/request.queue');
  await page.reload();
  await waitForV5(page);
  await page.waitForFunction(() =>
    globalThis.__HAU_V5_INTEGRATION__?.status?.().connectedRoutes?.includes('request.queue'),
  );
  const requestRow = page.locator('[data-act="select:request"]').first();
  await expect(requestRow).toBeVisible();
  let activeRequestMount;
  if (mobileViewport) {
    await requestRow.click();
    activeRequestMount = page.locator('.drawer:visible [data-v5-contextual-mount="request.queue"]');
    await expect(activeRequestMount).toHaveCount(1);
    expect(
      await page.locator('#surface-main [data-v5-command="request-review"]').evaluateAll(
        (forms) =>
          forms.filter((form) => {
            for (let node = form; node; node = node.parentElement) {
              if (node.inert || node.getAttribute('aria-hidden') === 'true') return true;
            }
            return false;
          }).length,
      ),
    ).toBe(0);
  } else {
    activeRequestMount = page.locator('.split__detail:visible [data-v5-contextual-mount="request.queue"]');
  }
  for (const command of ['request-review', 'request-information', 'request-reject', 'request-reserve']) {
    const form = activeRequestMount.locator(`[data-v5-command="${command}"]`);
    await expect(form).toBeVisible();
    await expect(form.locator('input[name="requestId"]')).toHaveValue('REQ-DEMO-431');
  }
  await expect(
    activeRequestMount.locator('[data-v5-command="request-reserve"] option[value^="RQL-DEMO-431-"]'),
  ).toHaveCount(1);
  expect(
    await activeRequestMount
      .locator('input[name="requestId"]')
      .evaluateAll((inputs) => inputs.map((input) => input.value)),
  ).toEqual(Array(4).fill('REQ-DEMO-431'));
  await expect(page.locator('[data-v5-parity-mount="fallback"]')).toHaveCount(0);
});

test('authenticated R2 events series focuses the new-event form', async ({ page }) => {
  await installR2QueueFixture(page);
  await page.goto('/#/events.series');
  await waitForV5(page);
  const newEvent = page.locator('[data-v5-new-event]');
  await expect(newEvent).toBeVisible();
  await expect(newEvent).toBeEnabled();
  await newEvent.click();
  const eventForm = page.locator(
    '[data-v5-contextual-mount="events.series"] [data-v5-command="event-series-save"]',
  );
  await expect(eventForm).toBeVisible();
  await expect(eventForm.locator('input, select, textarea').first()).toBeFocused();
});

test('an already-open V5 queue refetches once for a strictly newer scoped revision', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'v5-chromium-390', 'The revision-sync browser contract runs once.');
  const requests = await installV5ApiFixture(page, {
    environment: STAGING,
    authenticated: true,
  });
  const baseline = createRequestQueueFixture();
  let queue = baseline;
  let scopeToken = 7;
  let moduleScopeToken = 7;
  let moduleReads = 0;
  let revisionReads = 0;

  await page.route('**/api/getBootstrapModule', async (route) => {
    const request = route.request();
    const body = request.postDataJSON?.() ?? {};
    if (new URL(request.url()).pathname !== '/api/getBootstrapModule' || body.module !== 'request') {
      return route.fallback();
    }
    moduleReads += 1;
    const fixture = createBootstrapModuleFixture({
      backendMode: 'rest',
      environment: STAGING,
      module: 'request',
      rows: 2,
    });
    fixture.data = {
      ...fixture.data,
      requests: queue.requests,
      requestLines: queue.requestLines,
    };
    fixture.pagination.total = queue.requests.length;
    fixture.scopeRevision = {
      scope: 'request',
      token: moduleScopeToken,
      updatedAt: '2026-08-12T00:00:00.000Z',
    };
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(fixture),
    });
  });
  await page.route('**/api/getScopedRevision', async (route) => {
    const request = route.request();
    const body = request.postDataJSON?.() ?? {};
    if (new URL(request.url()).pathname !== '/api/getScopedRevision' || body.scope !== 'request') {
      return route.fallback();
    }
    revisionReads += 1;
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        correlationId: `COR-REVISION-${revisionReads}`,
        data: {
          contract: 'scoped-revision',
          contractVersion: 1,
          enabled: true,
          scope: 'request',
          token: scopeToken,
          globalRevision: scopeToken,
          updatedAt: '2026-08-12T00:00:00.000Z',
          environment: STAGING,
          metrics: { revisionReads: 1, moduleReads: 0, requestCount: 1 },
        },
      }),
    });
  });

  await page.goto('/#/request.queue');
  await waitForV5(page);
  await page.waitForFunction(() =>
    globalThis.__HAU_V5_INTEGRATION__?.status?.().connectedRoutes?.includes('request.queue'),
  );
  await expect(page.locator('[data-act="select:request"][data-ref="REQ-RV01-001"]')).toBeVisible();
  expect(moduleReads).toBe(1);
  const authenticatedSessionReads = requests.filter((entry) => entry.pathname === '/api/auth/session').length;
  await page.evaluate(() => {
    globalThis.__HAU_V5_REVISION_RENDER_COUNT__ = 0;
    document.addEventListener('hau:v5-rendered', () => {
      globalThis.__HAU_V5_REVISION_RENDER_COUNT__ += 1;
    });
  });

  const addedId = 'REQ-RV01-002';
  queue = {
    requests: [
      ...baseline.requests,
      {
        ...baseline.requests[0],
        id: addedId,
        purpose: 'Synthetic request delivered by scoped revision refresh',
      },
    ],
    requestLines: [
      ...baseline.requestLines,
      ...baseline.requestLines.map((line, index) => ({
        ...line,
        id: `RL-RV01-10${index + 1}`,
        requestId: addedId,
      })),
    ],
  };
  scopeToken = 8;
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));

  await expect.poll(() => moduleReads).toBe(2);
  await expect.poll(() => revisionReads).toBe(1);
  await expect(page.locator(`[data-act="select:request"][data-ref="${addedId}"]`)).toHaveCount(0);
  expect((await integrationStatus(page)).counts.requests).toBe(1);
  expect(await page.evaluate(() => globalThis.__HAU_V5_REVISION_RENDER_COUNT__)).toBe(0);

  moduleScopeToken = 8;
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));

  await expect(page.locator(`[data-act="select:request"][data-ref="${addedId}"]`)).toBeVisible();
  await expect.poll(() => moduleReads).toBe(3);
  expect(revisionReads).toBe(2);
  expect(await page.evaluate(() => globalThis.__HAU_V5_REVISION_RENDER_COUNT__)).toBe(1);

  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect.poll(() => revisionReads).toBe(3);
  expect(moduleReads).toBe(3);
  expect(await page.evaluate(() => globalThis.__HAU_V5_REVISION_RENDER_COUNT__)).toBe(1);
  expect(requests.filter((entry) => entry.pathname === '/api/auth/session')).toHaveLength(
    authenticatedSessionReads,
  );
  await page.evaluate(() => globalThis.__HAU_V5_INTEGRATION__.stop());
});

test('revision authentication failure ends the session without retrying or retaining private projection', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'v5-chromium-1440', 'The revision auth boundary runs once.');
  await installV5ApiFixture(page, { environment: STAGING, authenticated: true });
  const marker = 'PRIVATE_REVISION_FAILURE_DETAIL_MUST_NOT_RENDER';
  let revisionReads = 0;
  await page.route('**/api/getScopedRevision', async (route) => {
    if (new URL(route.request().url()).pathname !== '/api/getScopedRevision') {
      return route.fallback();
    }
    revisionReads += 1;
    return route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ code: 'SESSION_INVALID', message: marker }),
    });
  });

  await page.goto('/#/request.queue');
  await waitForV5(page);
  await page.waitForFunction(() =>
    globalThis.__HAU_V5_INTEGRATION__?.status?.().connectedRoutes?.includes('request.queue'),
  );
  expect(Object.values((await integrationStatus(page)).counts).some((count) => count > 0)).toBe(true);

  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect.poll(() => new URL(page.url()).hash).toBe('#/public.signin');
  await expect(page.getByRole('heading', { name: 'Staff sign in' })).toBeVisible();
  const status = await integrationStatus(page);
  expect(status.authenticated).toBe(false);
  expect(status.connectedRoutes).toEqual([]);
  expect(Object.values(status.counts).every((count) => count === 0)).toBe(true);
  await expect(page.locator('body')).not.toContainText(marker);
  expect(revisionReads).toBe(1);

  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await settleBrowserTasks(page);
  expect(revisionReads).toBe(1);
});

test('ordinary module loads cannot commit after navigation, same-account reauthentication, or stop', async ({
  context,
}, testInfo) => {
  test.setTimeout(60_000);
  test.skip(testInfo.project.name !== 'v5-chromium-1440', 'The async boundary contract runs once.');

  const openDeferredRequestPage = async ({ logoutRelease } = {}) => {
    const page = await context.newPage();
    const requests = await installV5ApiFixture(page, {
      environment: STAGING,
      authenticated: true,
    });
    const started = deferred();
    const release = deferred();
    if (logoutRelease) {
      await page.route('**/api/auth/logout', async (route) => {
        await logoutRelease.promise;
        return route.fallback();
      });
    }
    await page.route('**/api/getBootstrapModule', async (route) => {
      const request = route.request();
      const body = request.postDataJSON?.() ?? {};
      if (new URL(request.url()).pathname !== '/api/getBootstrapModule' || body.module !== 'request') {
        return route.fallback();
      }
      started.resolve();
      await release.promise;
      const fixture = createBootstrapModuleFixture({
        backendMode: 'rest',
        environment: STAGING,
        module: 'request',
        rows: 2,
      });
      fixture.data = { ...fixture.data, ...createRequestQueueFixture() };
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(fixture),
      });
    });
    await page.goto('/#/request.queue');
    await started.promise;
    return { page, release, requests };
  };

  await test.step('rapid route replacement', async () => {
    const { page, release } = await openDeferredRequestPage();
    try {
      await page.evaluate(() => {
        location.hash = '#/inventory.catalog';
      });
      await expect
        .poll(async () => (await integrationStatus(page)).connectedRoutes)
        .toContain('inventory.catalog');
      const staleResponse = page.waitForResponse((response) => {
        const request = response.request();
        return (
          new URL(response.url()).pathname === '/api/getBootstrapModule' &&
          request.postDataJSON?.()?.module === 'request'
        );
      });
      release.resolve();
      await staleResponse;
      await settleBrowserTasks(page);

      const status = await integrationStatus(page);
      expect(status.currentRoute).toBe('inventory.catalog');
      expect(status.connectedRoutes).toContain('inventory.catalog');
      expect(status.connectedRoutes).not.toContain('request.queue');
      expect(status.counts).toMatchObject({ requests: 0, inventory: 2 });
    } finally {
      release.resolve();
      await page.close();
    }
  });

  await test.step('sign-out and same-account playground reauthentication', async () => {
    const logoutRelease = deferred();
    const { page, release, requests } = await openDeferredRequestPage({ logoutRelease });
    try {
      await page.locator('[data-act="open-menu"]').click();
      await page.getByRole('menuitem', { name: 'Sign out' }).click();
      await expect(page.getByRole('heading', { name: 'Staff sign in' })).toBeVisible();
      const sessionReadsBefore = requests.filter(({ pathname }) => pathname === '/api/auth/session').length;
      const playgroundReadsBefore = requests.filter(
        ({ pathname }) => pathname === '/api/playground/session',
      ).length;
      await page.evaluate(() => {
        location.hash = '#/index';
      });
      await settleBrowserTasks(page);
      expect(requests.filter(({ pathname }) => pathname === '/api/auth/session')).toHaveLength(
        sessionReadsBefore,
      );
      expect(requests.filter(({ pathname }) => pathname === '/api/playground/session')).toHaveLength(
        playgroundReadsBefore,
      );
      logoutRelease.resolve();
      await expect(page.getByRole('heading', { name: 'Isolated Staging Playground Index' })).toBeVisible();
      await expect.poll(async () => (await integrationStatus(page)).authenticated).toBe(true);

      const staleResponse = page.waitForResponse((response) => {
        const request = response.request();
        return (
          new URL(response.url()).pathname === '/api/getBootstrapModule' &&
          request.postDataJSON?.()?.module === 'request'
        );
      });
      release.resolve();
      await staleResponse;
      await settleBrowserTasks(page);

      const status = await integrationStatus(page);
      expect(status.currentRoute).toBe('index');
      expect(status.authenticated).toBe(true);
      expect(status.connectedRoutes).not.toContain('request.queue');
      expect(status.counts.requests).toBe(0);
    } finally {
      logoutRelease.resolve();
      release.resolve();
      await page.close();
    }
  });

  await test.step('runtime stop', async () => {
    const { page, release } = await openDeferredRequestPage();
    try {
      await page.evaluate(() => globalThis.__HAU_V5_INTEGRATION__.stop());
      const staleResponse = page.waitForResponse((response) => {
        const request = response.request();
        return (
          new URL(response.url()).pathname === '/api/getBootstrapModule' &&
          request.postDataJSON?.()?.module === 'request'
        );
      });
      release.resolve();
      await staleResponse;
      await settleBrowserTasks(page);

      const status = await integrationStatus(page);
      expect(status.currentRoute).toBe('request.queue');
      expect(status.connectedRoutes).not.toContain('request.queue');
      expect(status.counts.requests).toBe(0);
    } finally {
      release.resolve();
      await page.close();
    }
  });
});

test('session boundary failures clear authenticated projections and render only safe sign-in state', async ({
  context,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'v5-chromium-1440', 'The session boundary matrix runs once.');
  const marker = 'PRIVATE_BACKEND_DETAIL_MUST_NOT_RENDER';
  const cases = [
    {
      routeId: 'request.queue',
      pathname: '/api/getBootstrapModule',
      module: 'request',
      code: 'SESSION_INVALID',
    },
    { routeId: 'account.profile', pathname: '/api/me/profile', code: 'SESSION_REQUIRED' },
    {
      routeId: 'public.request-intake',
      pathname: '/api/public/request/options',
      code: 'SESSION_INVALID',
    },
  ];

  for (const failure of cases) {
    await test.step(`${failure.routeId} -> ${failure.code}`, async () => {
      const page = await context.newPage();
      const pageErrors = [];
      page.on('pageerror', (error) => pageErrors.push(error.message));
      await installV5ApiFixture(page, { environment: STAGING, authenticated: true });
      await page.route('**/api/**', async (route) => {
        const request = route.request();
        const body = request.postDataJSON?.() ?? {};
        if (
          new URL(request.url()).pathname !== failure.pathname ||
          (failure.module && body.module !== failure.module)
        ) {
          return route.fallback();
        }
        return route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ code: failure.code, message: marker }),
        });
      });

      try {
        if (failure.routeId === 'request.queue') {
          await page.goto('/#/inventory.catalog');
          await waitForV5(page);
          await expect.poll(async () => (await integrationStatus(page)).counts.inventory).toBe(2);
          await page.evaluate(() => {
            location.hash = '#/request.queue';
          });
        } else {
          await page.goto(`/#/${failure.routeId}`);
          await waitForV5(page);
        }
        await expect.poll(() => new URL(page.url()).hash).toBe('#/public.signin');
        await expect(page.getByRole('heading', { name: 'Staff sign in' })).toBeVisible();
        const status = await integrationStatus(page);
        expect(status.authenticated).toBe(false);
        expect(status.connectedRoutes).not.toContain(failure.routeId);
        expect(status.failedRoutes).not.toHaveProperty(failure.routeId);
        expect(Object.values(status.counts).every((count) => count === 0)).toBe(true);
        await expect(page.locator('body')).not.toContainText(marker);
        expect(pageErrors).toEqual([]);
      } finally {
        await page.close();
      }
    });
  }
});

test('off-canvas navigation is inert when closed and preserves deterministic focus', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'v5-chromium-1440', 'The exact 1023/1024 boundary runs once.');
  await installV5ApiFixture(page, { environment: STAGING, authenticated: true });
  await page.setViewportSize({ width: 1023, height: 800 });
  await page.goto('/#/request.queue');
  await waitForV5(page);

  const rail = page.locator('#primary-navigation');
  const toggle = page.locator('[data-act="toggle-rail"]');
  await expect(rail).toHaveAttribute('inert', '');
  await expect(rail).toHaveAttribute('aria-hidden', 'true');
  await expect(toggle).toHaveAttribute('aria-expanded', 'false');
  expect(await rail.locator(':focus').count()).toBe(0);

  await toggle.click();
  await expect(rail).not.toHaveAttribute('inert', '');
  await expect(rail).not.toHaveAttribute('aria-hidden', 'true');
  await expect(rail.locator('.nav-item:visible').first()).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(rail).toHaveAttribute('inert', '');
  await expect(toggle).toBeFocused();

  await toggle.click();
  await page.locator('.rail__scrim').click();
  await expect(rail).toHaveAttribute('inert', '');
  await expect(toggle).toBeFocused();

  await toggle.click();
  await rail.locator('[data-act="go"][data-id="admin.overview"]').click();
  await expect(page).toHaveURL(/#\/admin\.overview$/u);
  await expect(page.locator('#surface-main')).toBeFocused();
  await expect(rail).toHaveAttribute('inert', '');
  await expectNoHorizontalOverflow(page);

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await toggle.click();
  await expect(rail).not.toHaveAttribute('inert', '');
  await page.keyboard.press('Escape');
  await expect(toggle).toBeFocused();

  await page.setViewportSize({ width: 1024, height: 800 });
  await expect(rail).not.toHaveAttribute('inert', '');
  await expect(rail).not.toHaveAttribute('aria-hidden', 'true');
  await page.locator('[data-act="open-menu"]').click();
  await expect(rail).toHaveAttribute('inert', '');
  await page.getByRole('menuitem', { name: 'Session details' }).click();
  await expect(rail).not.toHaveAttribute('inert', '');
  await expectNoHorizontalOverflow(page);
});

test('admin overview remains visible and unclipped at the governed responsive widths', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'v5-chromium-1440', 'The responsive evidence matrix runs once.');
  await installV5ApiFixture(page, { environment: STAGING, authenticated: true });

  for (const width of [320, 390, 1024, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/#/admin.overview');
    await waitForV5(page);
    await page.waitForFunction(() =>
      globalThis.__HAU_V5_INTEGRATION__?.status?.().connectedRoutes?.includes('admin.overview'),
    );
    for (const selector of [
      '.overview-briefing',
      '.overview-workbench',
      '.overview-workbench__primary',
      '.overview-workbench__support',
    ]) {
      const box = await page.locator(selector).boundingBox();
      expect(box, `${selector} must render at ${width}px`).not.toBeNull();
      expect(box.x, `${selector} left edge at ${width}px`).toBeGreaterThanOrEqual(-1);
      expect(box.x + box.width, `${selector} right edge at ${width}px`).toBeLessThanOrEqual(width + 1);
    }
    await expect(
      page.getByRole('heading', { name: 'Decisions, custody, and release in one line of sight.' }),
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);
  }
});

test('sticky public masthead never overlaps the hero heading at governed scroll positions', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'v5-chromium-1440', 'The sticky geometry matrix runs once.');
  await installV5ApiFixture(page, { environment: STAGING });

  const expectNoStickyOverlap = async (width, label) => {
    const geometry = await page.evaluate(() => {
      const masthead = document.querySelector('.public__bar')?.getBoundingClientRect();
      const heading = document.querySelector('.landing-hero h1')?.getBoundingClientRect();
      if (!masthead || !heading) return null;
      const overlapX = Math.max(
        0,
        Math.min(masthead.right, heading.right) - Math.max(masthead.left, heading.left),
      );
      const overlapY = Math.max(
        0,
        Math.min(masthead.bottom, heading.bottom) - Math.max(masthead.top, heading.top),
      );
      const pointX = Math.min(window.innerWidth - 1, Math.max(0, heading.left + heading.width / 2));
      const pointY = Math.min(window.innerHeight - 1, Math.max(0, heading.top + heading.height / 2));
      const headingVisible = heading.bottom > 0 && heading.top < window.innerHeight;
      const pointOwner = headingVisible ? document.elementFromPoint(pointX, pointY) : null;
      return {
        overlapArea: overlapX * overlapY,
        headingVisible,
        headingOwnsCenter: !headingVisible || Boolean(pointOwner?.closest('.landing-hero h1')),
      };
    });
    expect(geometry, `geometry exists at ${width}px ${label}`).not.toBeNull();
    expect(geometry.overlapArea, `no overlap at ${width}px ${label}`).toBe(0);
    expect(geometry.headingOwnsCenter, `hero heading is unobscured at ${width}px ${label}`).toBe(true);
  };

  for (const width of [320, 390, 1024, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto('/#/public.landing');
    await waitForV5(page);
    await expectNoStickyOverlap(width, 'initial');
    await page
      .locator('.landing-hero h1')
      .evaluate((heading) => heading.scrollIntoView({ block: 'center', behavior: 'auto' }));
    await expectNoStickyOverlap(width, 'scrollIntoView');
    await page.evaluate(() => window.scrollBy({ top: 240, behavior: 'auto' }));
    await expectNoStickyOverlap(width, 'representative scroll');
    await expectNoHorizontalOverflow(page);
  }
});

test('Test Real Login Flow disables convenience unlock until the tester resumes it', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'v5-chromium-1440', 'The login escape-hatch flow runs once.');
  const requests = await installV5ApiFixture(page, { environment: STAGING });
  await page.goto('/#/index');
  await waitForV5(page);
  await expect(page.locator('[data-v5-playground-status]')).toBeVisible();

  await page.getByRole('button', { name: 'Test Real Login Flow' }).click();
  await expect(page.getByRole('heading', { name: 'Staff sign in' })).toBeVisible();
  await page.goto('/#/request.queue');
  await expect(page.getByRole('heading', { name: 'Staff sign in' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Resume unlocked playground' })).toBeVisible();

  const callsBeforeResume = requests.filter(({ pathname }) => pathname === '/api/playground/session').length;
  await page.getByRole('button', { name: 'Resume unlocked playground' }).click();
  await expect(page.getByRole('heading', { name: 'Isolated Staging Playground Index' })).toBeVisible();
  await expect
    .poll(() => requests.filter(({ pathname }) => pathname === '/api/playground/session').length)
    .toBeGreaterThan(callsBeforeResume);
  await expect.poll(async () => (await integrationStatus(page)).authenticated).toBe(true);
});

test('authenticated owner renders every registered V5 route without prototype records', async ({
  page,
}, testInfo) => {
  test.setTimeout(120_000);
  test.skip(testInfo.project.name !== 'v5-chromium-1440', 'The exhaustive route pass runs once.');
  await installV5ApiFixture(page, { environment: STAGING, authenticated: true });
  const pageErrors = [];
  let activeRoute = 'startup';
  page.on('pageerror', (error) => pageErrors.push(`${activeRoute}: ${error.message}`));

  for (const surface of SURFACES) {
    activeRoute = surface.id;
    await page.goto(`/#/${surface.id}`);
    await waitForV5(page);
    await page.waitForFunction(
      (routeId) => globalThis.__HAU_V5_INTEGRATION__?.status?.().currentRoute === routeId,
      surface.id,
    );
    if (surface.kind === 'internal') {
      await page.waitForFunction((routeId) => {
        const status = globalThis.__HAU_V5_INTEGRATION__?.status?.();
        return status?.connectedRoutes?.includes(routeId) || Boolean(status?.failedRoutes?.[routeId]);
      }, surface.id);
    }
    const main = page.locator('#surface-main');
    await expect(main, surface.id).toBeVisible();
    await expect(main.locator('h1').first(), surface.id).toBeVisible();
    expect(await main.textContent(), surface.id).not.toMatch(
      /(?:REQ|LOAN|ITM|RST|CNV|APP)-DEMO|Illustrative/iu,
    );
    await expect(page.locator('[data-act="noop"]'), surface.id).toHaveCount(0);
    if (surface.id === 'admin.access') {
      const governedActions = page.locator('[data-v5-admin-parity]');
      await expect(governedActions.first()).toBeVisible();
      await page.locator('[data-act="toggle-theme"]').first().click();
      await expect(governedActions.first()).toBeVisible();
    }
    const status = await integrationStatus(page);
    expect(status.failedRoutes, surface.id).not.toHaveProperty(surface.id);
    await expectNoHorizontalOverflow(page);
  }

  expect(pageErrors).toEqual([]);
});

test('authenticated operational surface remains usable in both themes at the configured width', async ({
  page,
}) => {
  await installV5ApiFixture(page, { environment: STAGING, authenticated: true });
  await page.goto('/#/request.queue');
  await waitForV5(page);
  await page.waitForFunction(() =>
    globalThis.__HAU_V5_INTEGRATION__?.status?.().connectedRoutes?.includes('request.queue'),
  );
  await expect(page.getByRole('heading', { name: 'Request Center' })).toBeVisible();
  await expect(page.locator('[href="#/index"]')).toBeVisible();
  await expectNoHorizontalOverflow(page);

  const themeToggle = page.locator('[data-act="toggle-theme"]').first();
  await themeToggle.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expectNoHorizontalOverflow(page);
});

test('light and dark V5 themes remain usable at the configured responsive width', async ({
  page,
}, testInfo) => {
  await installV5ApiFixture(page, { environment: STAGING });
  await page.goto('/#/public.landing');
  await waitForV5(page);

  await expect(page.locator('.landing-hero h1')).toHaveText('Every request. Every handoff. On record.');
  await expect(
    page.locator('.landing-hero__content > p:not(.landing-hero__eyebrow):not(.landing-hero__utility)'),
  ).toHaveText(
    'Start a service-backed logistics request, follow it with its private reference, and keep each operational handoff accountable.',
  );
  const heroMedia = page.locator('.landing-hero__institutional-media');
  await expect(page.locator('.landing-updates')).toHaveAttribute('data-advertisement-state', 'empty');
  await expect(heroMedia).toBeVisible();
  await expect(page.locator('.landing-hero__actions .btn--primary')).toHaveText(/Start a logistics request/u);
  await expect(page.getByRole('link', { name: 'Track request', exact: true })).toHaveAttribute(
    'href',
    '#/public.request-tracking',
  );
  await expect(page.getByRole('link', { name: 'Staff sign in' }).first()).toHaveAttribute(
    'href',
    '#/public.signin',
  );
  await expect(page.locator('.landing-hero__monogram img')).toHaveAttribute('alt', 'USC');
  await expect(page.locator('.public__marks img')).toHaveCount(2);
  await expect(page.locator('.public__wordmark b')).toHaveText('Holy Angel University Student Council');
  await expect(page.locator('.public__foot-meta')).toContainText('HAU-USC · © 2026–2027');
  if (testInfo.project.name === 'v5-chromium-1280') {
    for (const selector of [
      '.landing-hero h1',
      '.landing-hero__content > p:not(.landing-hero__eyebrow):not(.landing-hero__utility)',
      '.landing-hero__actions .btn--primary',
    ]) {
      const box = await page.locator(selector).boundingBox();
      expect(box, `${selector} must render in the 1280×800 first fold`).not.toBeNull();
      expect(box.y + box.height, `${selector} must fit in the 1280×800 first fold`).toBeLessThanOrEqual(800);
    }
  }
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.locator('body')).toHaveAttribute('data-theme', 'light');
  await expectNoHorizontalOverflow(page);

  const themeToggle = page.locator('[data-act="toggle-theme"]').first();
  await expect(themeToggle).toHaveAttribute('aria-label', 'Switch to dark mode');
  const themeToggleBox = await themeToggle.boundingBox();
  expect(themeToggleBox).not.toBeNull();
  expect(themeToggleBox.width).toBeGreaterThanOrEqual(44);
  expect(themeToggleBox.height).toBeGreaterThanOrEqual(44);
  if ((await page.evaluate(() => window.innerWidth)) <= 720) {
    const compactMenuBox = await page.locator('.public__compact-nav summary').boundingBox();
    expect(compactMenuBox).not.toBeNull();
    expect(compactMenuBox.width).toBeGreaterThanOrEqual(44);
    expect(compactMenuBox.height).toBeGreaterThanOrEqual(44);
  }
  await themeToggle.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('body')).toHaveAttribute('data-theme', 'dark');
  await expectNoHorizontalOverflow(page);

  await expect(themeToggle).toHaveAttribute('aria-label', 'Switch to light mode');
  await themeToggle.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expectNoHorizontalOverflow(page);
});
