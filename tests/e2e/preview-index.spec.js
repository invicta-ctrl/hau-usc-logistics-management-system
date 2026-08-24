import { expect, test } from '@playwright/test';

const VERSION = '**/api/version';
const exactInspectionPort = process.env.HAU_FRONTEND_E2E_PORT === '4173';

function installVersion(page, playground) {
  return page.route(VERSION, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, correlationId: 'e2e', playground }),
    }),
  );
}

function installDeniedVersion(page, payload) {
  return page.route(VERSION, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(payload),
    }),
  );
}

function installEmptyFeed(page) {
  return page.route('**/api/public/advertisements', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, items: [] }),
    }),
  );
}

test('allows the exact direct route and shows the launcher when playground is true', async ({ page }) => {
  await installVersion(page, true);
  await page.goto('/#/__preview/index');
  await expect(page.locator('[data-preview-index]')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Preview Module Index' })).toBeVisible();

  await page.goto('/');
  await expect(page.locator('[data-preview-index-launcher]')).toBeVisible();
});

test('fails closed on every spoofed version signal regardless of hash, query, or storage', async ({
  page,
}) => {
  await page.addInitScript(() => {
    try {
      window.localStorage.setItem('preview-allowed', 'true');
      window.sessionStorage.setItem('preview-allowed', 'true');
    } catch {
      /* storage may be unavailable; the gate must not depend on it */
    }
    window.__previewSpoof = 'true';
  });

  const scenarios = [
    { name: 'false', payload: { ok: true, playground: false } },
    { name: 'missing', payload: { ok: true, correlationId: 'e2e' } },
    { name: 'string true', payload: { ok: true, playground: 'true' } },
    { name: 'number', payload: { ok: true, playground: 1 } },
    { name: 'object', payload: { ok: true, playground: { valueOf: () => true } } },
  ];

  for (const scenario of scenarios) {
    await page.unroute(VERSION);
    await installDeniedVersion(page, scenario.payload);
    await page.goto('/?preview=1#/__preview/index');
    await expect(
      page.getByRole('heading', { name: 'Every request. Every handoff. On record.' }),
    ).toBeVisible();
    await expect(page.locator('[data-preview-index]')).toHaveCount(0);
    await expect(page.locator('[data-preview-index-launcher]')).toHaveCount(0);
    await expect(page.locator('[data-preview-surface]')).toHaveCount(0);
    await expect(page.getByText('Operations overview')).toHaveCount(0);
    await expect(page.getByText('Preview Module Index')).toHaveCount(0);
  }
});

test('fails closed when the version endpoint errors', async ({ page }) => {
  await page.route(VERSION, (route) =>
    route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: '{"message":"Unavailable"}',
    }),
  );
  await page.goto('/#/__preview/index');
  await expect(page.getByRole('heading', { name: 'Every request. Every handoff. On record.' })).toBeVisible();
  await expect(page.locator('[data-preview-index]')).toHaveCount(0);
  await expect(page.locator('[data-preview-index-launcher]')).toHaveCount(0);
  await expect(page.locator('[data-preview-surface]')).toHaveCount(0);
  await expect(page.getByText('Preview Module Index')).toHaveCount(0);
});

test('renders exactly 15 registry entries, groups, and drives search and all filters', async ({ page }) => {
  await installVersion(page, true);
  await installEmptyFeed(page);
  await page.goto('/#/__preview/index');
  await expect(page.locator('[data-preview-index]')).toBeVisible();

  await expect(page.locator('[data-preview-route]')).toHaveCount(15);
  // R3-A1-A2 added a fourth context: the authenticated External Request Center
  // is no longer filed under Public, because it is not public.
  await expect(page.locator('[data-preview-group]')).toHaveCount(4);
  await expect(page.locator('[data-preview-group="PUBLIC"] [data-preview-route]')).toHaveCount(4);
  await expect(page.locator('[data-preview-group="REQUESTER"] [data-preview-route]')).toHaveCount(1);
  await expect(page.locator('[data-preview-group="STAFF"] [data-preview-route]')).toHaveCount(8);
  await expect(page.locator('[data-preview-group="ADMINISTRATION"] [data-preview-route]')).toHaveCount(2);

  await expect(
    page.locator('[data-preview-route="landing"] [data-preview-entry-meta="status"] dd'),
  ).toHaveText('ACCEPTED');
  await expect(
    page.locator('[data-preview-route="landing"] [data-preview-entry-meta="backend"] dd'),
  ).toHaveText('REAL BACKEND');
  await expect(
    page.locator('[data-preview-route="overview"] [data-preview-entry-meta="status"] dd'),
  ).toHaveText('SURFACE PREVIEW');
  await expect(
    page.locator('[data-preview-route="overview"] [data-preview-entry-meta="backend"] dd'),
  ).toHaveText('VISUAL ONLY');

  await page.locator('[data-preview-search]').fill('release');
  await expect(page.locator('[data-preview-route]')).toHaveCount(1);
  await expect(page.locator('[data-preview-route="release"]')).toBeVisible();

  await page.locator('[data-preview-search]').fill('does-not-exist');
  await expect(page.locator('[data-preview-empty]')).toBeVisible();
  await page.locator('[data-preview-search]').fill('');

  await page.locator('[data-filter="PUBLIC"]').click();
  await expect(page.locator('[data-preview-route]')).toHaveCount(4);
  await page.locator('[data-filter="PREVIEW_ONLY"]').click();
  await expect(page.locator('[data-preview-route]')).toHaveCount(9);
  await page.locator('[data-filter="IN_PROGRESS"]').click();
  await expect(page.locator('[data-preview-empty]')).toBeVisible();
  await expect(page.locator('[data-preview-count]')).toHaveText('0 routes');
  await page.locator('[data-filter="ALL"]').click();
  await expect(page.locator('[data-preview-route]')).toHaveCount(15);

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
});

test('opens a public real route from the index', async ({ page }) => {
  await installVersion(page, true);
  await installEmptyFeed(page);
  await page.goto('/#/__preview/index');
  await page.locator('[data-preview-route="landing"] [data-action="open"]').click();
  await expect(page.getByRole('heading', { name: 'Every request. Every handoff. On record.' })).toBeVisible();
  await expect(page.locator('[data-preview-index]')).toHaveCount(0);
});

test('routes protected Test Real Access through the unchanged real session check', async ({ page }) => {
  await installVersion(page, true);
  await installEmptyFeed(page);
  await page.route('**/api/auth/session', (route) =>
    route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ code: 'SESSION_REQUIRED', message: 'Sign in to continue.' }),
    }),
  );
  await page.goto('/#/__preview/index');
  await page.locator('[data-preview-route="inventory"] [data-action="test-real-access"]').click();
  await expect(page.getByRole('heading', { name: 'Sign in to continue' })).toBeVisible();
  await expect(page.locator('[data-preview-index]')).toHaveCount(0);
});

test('INDEX-GATE fails closed outside the exact local 4173 inspection origin', async ({ page }) => {
  test.skip(exactInspectionPort, 'The exact-4173 invocation asserts positive local inspection instead.');
  await installVersion(page, true);
  await installEmptyFeed(page);
  const protectedRequests = [];
  page.on('request', (request) => {
    const pathname = new URL(request.url()).pathname;
    if (
      pathname.startsWith('/api/') &&
      pathname !== '/api/version' &&
      pathname !== '/api/public/advertisements'
    ) {
      protectedRequests.push({ method: request.method(), pathname });
    }
  });

  await page.goto('/#/__preview/index');
  await page.locator('[data-preview-route="inventory"] [data-action="open-preview"]').click();
  await expect(page.locator('[data-preview-index]')).toBeVisible();
  await expect(page.locator('[data-preview-inspection="true"]')).toHaveCount(0);
  expect(protectedRequests).toEqual([]);
});

test('INDEX-INSPECT opens exact-4173 protected modules without real auth or protected network traffic', async ({
  page,
}) => {
  test.skip(!exactInspectionPort, 'Run explicitly against the accepted 4173 supervisor.');
  await installVersion(page, true);
  await installEmptyFeed(page);
  const protectedRequests = [];
  page.on('request', (request) => {
    const pathname = new URL(request.url()).pathname;
    if (
      pathname.startsWith('/api/') &&
      pathname !== '/api/version' &&
      pathname !== '/api/public/advertisements'
    ) {
      protectedRequests.push({ method: request.method(), pathname });
    }
  });

  await page.goto('/#/__preview/index');
  await page.locator('[data-preview-search]').fill('inventory');
  await page.locator('[data-preview-route="inventory"] [data-action="open-preview"]').click();
  await expect(
    page.locator('[data-preview-inspection="true"][data-preview-route="inventory"]'),
  ).toBeVisible();
  await expect(page.getByText('PREVIEW INSPECTION', { exact: false })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Sign in to continue' })).toHaveCount(0);

  await page.getByRole('button', { name: 'Back to Preview Index' }).first().click();
  await expect(page.locator('[data-preview-index]')).toBeVisible();
  await expect(page.locator('[data-preview-search]')).toHaveValue('inventory');
  await page.locator('[data-preview-search]').fill('');
  await page.locator('[data-preview-route="profile"] [data-action="open-preview"]').click();
  await expect(page.locator('[data-preview-inspection="true"][data-preview-route="profile"]')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Preview Operator' })).toBeVisible();

  await page.getByRole('button', { name: 'Back to Preview Index' }).first().click();
  await page.locator('[data-preview-route="external-request"] [data-action="open-preview"]').click();
  await expect(
    page.locator('[data-preview-inspection="true"][data-preview-route="external-request"]'),
  ).toBeVisible();
  await page.getByRole('button', { name: 'New request' }).click();
  await expect(page.getByRole('button', { name: 'Submission disabled in preview' })).toBeDisabled();
  expect(protectedRequests).toEqual([]);
});

test('reaches the real staff sign-in page through Test Real Login Flow', async ({ page }) => {
  await installVersion(page, true);
  await installEmptyFeed(page);
  await page.goto('/#/__preview/index');
  await page.locator('[data-action="test-login"]').click();
  await expect(page.getByRole('heading', { name: 'Staff sign in' })).toBeVisible();
  await expect(page.locator('[data-preview-index]')).toHaveCount(0);
});

test('shows a labeled, sanitized, read-only surface preview with no additional API traffic', async ({
  page,
}) => {
  await installVersion(page, true);
  await installEmptyFeed(page);

  const requests = [];
  page.on('request', (request) => {
    if (request.url().includes('/api/')) {
      requests.push({ method: request.method(), pathname: new URL(request.url()).pathname });
    }
  });

  await page.goto('/#/__preview/index');
  await expect(page.locator('[data-preview-index]')).toBeVisible();
  requests.length = 0;

  await page.locator('[data-preview-route="overview"] [data-action="surface"]').click();
  await expect(page.locator('[data-preview-surface]')).toBeVisible();
  await expect(page.getByRole('note').getByText(/Visual reference only/)).toBeVisible();
  await expect(page.locator('[data-preview-surface] input')).toHaveCount(0);
  await expect(page.locator('[data-preview-surface] form')).toHaveCount(0);

  await page.locator('[data-action="surface-back"]').click();
  await expect(page.locator('[data-preview-surface]')).toHaveCount(0);

  expect(requests.filter((request) => request.pathname !== '/api/version')).toEqual([]);
  expect(requests.filter((request) => request.method !== 'GET')).toEqual([]);
});

test('focuses the heading on entry and restores launcher focus only on Back', async ({ page }) => {
  await installVersion(page, true);
  await installEmptyFeed(page);

  await page.goto('/#/__preview/index');
  await expect(page.locator('[data-preview-index]')).toBeVisible();
  await expect(page.locator('[data-preview-index] h1')).toBeFocused();

  await page.goto('/');
  const launcher = page.locator('[data-preview-index-launcher]');
  await expect(launcher).toBeVisible();
  await launcher.click();
  await expect(page.locator('[data-preview-index]')).toBeVisible();
  await expect(page.locator('[data-preview-index] h1')).toBeFocused();
  await page.locator('[data-action="back"]').click();
  await expect(launcher).toBeFocused();

  const launcherHeight = await launcher.evaluate((element) => element.getBoundingClientRect().height);
  expect(launcherHeight).toBeGreaterThanOrEqual(44);
});

test('does not focus the reappearing launcher after Open or Test Real Login', async ({ page }) => {
  await installVersion(page, true);
  await installEmptyFeed(page);

  await page.goto('/');
  await page.locator('[data-preview-index-launcher]').click();
  await expect(page.locator('[data-preview-index]')).toBeVisible();
  await page.locator('[data-preview-route="landing"] [data-action="open"]').click();
  await expect(page.getByRole('heading', { name: 'Every request. Every handoff. On record.' })).toBeVisible();
  const launcher = page.locator('[data-preview-index-launcher]');
  await expect(launcher).toBeVisible();
  await expect(launcher).not.toBeFocused();

  await launcher.click();
  await expect(page.locator('[data-preview-index]')).toBeVisible();
  await page.locator('[data-action="test-login"]').click();
  await expect(page.getByRole('heading', { name: 'Staff sign in' })).toBeVisible();
  await expect(launcher).toBeVisible();
  await expect(launcher).not.toBeFocused();
});

test('honors reduced motion on the preview index surface', async ({ page }) => {
  await installVersion(page, true);
  await installEmptyFeed(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#/__preview/index');
  await expect(page.locator('[data-preview-index]')).toBeVisible();

  const duration = await page
    .locator('[data-preview-index]')
    .evaluate((element) => getComputedStyle(element).animationDuration);
  expect(parseFloat(duration)).toBeGreaterThan(0);
  expect(parseFloat(duration)).toBeLessThan(0.001);
});

test('keeps skip link on the Index and focuses the heading without changing the hash', async ({ page }) => {
  await installVersion(page, true);
  await installEmptyFeed(page);
  await page.goto('/#/__preview/index');
  await expect(page.locator('[data-preview-index]')).toBeVisible();

  const skipLink = page.getByRole('link', { name: 'Skip to main content' });

  // Starts off-canvas.
  const offscreenTop = await skipLink.evaluate((element) => element.getBoundingClientRect().top);
  expect(offscreenTop).toBeLessThan(0);

  // Reset focus to the document start so Tab reaches the skip link first.
  await page.evaluate(() => {
    document.body.setAttribute('tabindex', '-1');
    document.body.focus();
  });

  // Tab focuses and brings it into the viewport.
  await page.keyboard.press('Tab');
  await expect(skipLink).toBeFocused();
  await expect
    .poll(() => skipLink.evaluate((element) => element.getBoundingClientRect().top))
    .toBeGreaterThanOrEqual(0);

  // Enter keeps the exact Index hash, keeps Index rendered, and focuses the heading.
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#\/__preview\/index$/u);
  await expect(page.locator('[data-preview-index]')).toBeVisible();
  await expect(page.locator('[data-preview-index] h1')).toBeFocused();
});
