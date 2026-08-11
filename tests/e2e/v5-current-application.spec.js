import { expect, test } from '@playwright/test';
import { GROUPS, SURFACES } from '../../src/v5/src/registry.js';
import {
  createBootstrapModuleFixture,
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

test('published public announcement drives the major-event landing content without arbitrary markup', async ({
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
  await expect(page.locator('.landing-hero')).toHaveAttribute('data-event-active', 'true');
  await expect(page.locator('.landing-hero h1')).toHaveText('Youth Development Day 2026');
  await expect(page.locator('.landing-hero__content > p')).toContainText('Sibulahi');
  await expect(page.locator('.landing-link')).toHaveText(/View event details/u);
  await expect(page.locator('.landing-link')).toHaveAttribute(
    'href',
    'https://www.facebook.com/holyangeluniversitysc/',
  );
  await expect(page.locator('.landing-updates h2')).toHaveText('Youth Development Day 2026');
  await expect(page.locator('.landing-hero__media')).toHaveAttribute(
    'alt',
    'Youth Development Day 2026 official event cover',
  );
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
  expect((await integrationStatus(page)).authenticated).toBe(true);
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
  await page.getByLabel('Username').fill('synthetic.activation');
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

test('authenticated R2 queues search loaded rows and keep contextual operations selected and fail closed', async ({
  page,
}, testInfo) => {
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

  await expect(page.locator('.landing-hero__content > p')).toHaveText(
    "As the University's highest student governing body, the Council represents the tertiary student community through leadership, service, and shared responsibility.",
  );
  const heroMedia = page.locator('.landing-hero__media');
  await expect(heroMedia).toBeVisible();
  await expect.poll(() => heroMedia.evaluate((image) => image.naturalWidth)).toBeGreaterThan(0);
  await expect(page.locator('.landing-hero__actions .btn--primary')).toHaveText(/Staff sign in/u);
  await expect(page.locator('.landing-hero__monogram img')).toHaveAttribute('alt', 'USC');
  await expect(page.locator('.public__marks img')).toHaveCount(2);
  await expect(page.locator('.public__wordmark b')).toHaveText('Holy Angel University Student Council');
  await expect(page.locator('.public__foot-meta')).toContainText('HAU-USC · 2026-2027');
  if (testInfo.project.name === 'v5-chromium-1280') {
    for (const selector of [
      '.landing-hero h1',
      '.landing-hero__content > p',
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
  await themeToggle.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(page.locator('body')).toHaveAttribute('data-theme', 'dark');
  await expectNoHorizontalOverflow(page);

  await expect(themeToggle).toHaveAttribute('aria-label', 'Switch to light mode');
  await themeToggle.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expectNoHorizontalOverflow(page);
});
