import { expect, test } from '@playwright/test';
import { GROUPS, SURFACES } from '../../src/v5/src/registry.js';
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

test('verified STAGING exposes the complete searchable Playground Index without bypassing auth', async ({
  page,
}) => {
  const requests = await installV5ApiFixture(page, { environment: STAGING });
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await page.goto('/#/index');
  await waitForV5(page);

  await expect(page.getByRole('heading', { name: 'Isolated Staging Playground Index' })).toBeVisible();
  await expect(page.locator('.preview-bar')).toContainText('Isolated Staging Playground');
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

  await expect(page.getByRole('heading', { name: 'Staff sign in' })).toBeVisible();
  await expect(page).toHaveURL(/#\/public\.signin$/u);
  expect(requests.some(({ pathname }) => pathname === '/api/auth/session')).toBe(true);
  expect((await integrationStatus(page)).authenticated).toBe(false);
  await expectNoHorizontalOverflow(page);
  expect(pageErrors).toEqual([]);
});

test('production identity cannot activate playground chrome or the Index route', async ({ page }) => {
  await installV5ApiFixture(page, { environment: PRODUCTION });
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  await page.goto('/#/index');
  await waitForV5(page);

  await expect(page.getByRole('heading', { name: 'Holy Angel University Student Council' })).toBeVisible();
  await expect(page.locator('.preview-bar')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Isolated Staging Playground Index' })).toHaveCount(0);
  await expect(page.locator('[href="#/index"]')).toHaveCount(0);
  await expect(page).toHaveURL(/#\/public\.landing$/u);
  expect((await integrationStatus(page)).playgroundVerified).toBe(false);
  await expectNoHorizontalOverflow(page);
  expect(pageErrors).toEqual([]);
});

test('public intake stays public while a representative internal route requires a real session', async ({
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
  await expect(page.getByRole('heading', { name: 'Staff sign in' })).toBeVisible();
  expect(requests.some(({ pathname }) => pathname === '/api/auth/session')).toBe(true);
  expect((await integrationStatus(page)).authenticated).toBe(false);
  await expectNoHorizontalOverflow(page);
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
      await page.waitForFunction(
        (routeId) => {
          const status = globalThis.__HAU_V5_INTEGRATION__?.status?.();
          return status?.connectedRoutes?.includes(routeId) || Boolean(status?.failedRoutes?.[routeId]);
        },
        surface.id,
      );
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

test('light and dark V5 themes remain usable at the configured responsive width', async ({ page }) => {
  await installV5ApiFixture(page, { environment: STAGING });
  await page.goto('/#/public.landing');
  await waitForV5(page);

  const heroMedia = page.locator('.landing-hero__media');
  await expect(heroMedia).toBeVisible();
  await expect.poll(() => heroMedia.evaluate((image) => image.naturalWidth)).toBeGreaterThan(0);
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
