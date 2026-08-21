import { expect, test } from '@playwright/test';
import {
  STAGING,
  installV5ApiFixture,
  waitForV5,
} from './v5-current-application-fixtures.js';

const routes = ['public.landing', 'index', 'request.queue', 'admin.access'];

async function setTheme(page, theme) {
  if ((await page.locator('html').getAttribute('data-theme')) === theme) return;
  await page.locator('[data-act="toggle-theme"]').first().click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
}

test('capture current-source V5 acceptance matrix', async ({ page }, testInfo) => {
  await installV5ApiFixture(page, { environment: STAGING, authenticated: true });

  for (const route of routes) {
    await page.goto(`/#/${route}`);
    await waitForV5(page);
    await page.waitForFunction(
      (routeId) => globalThis.__HAU_V5_INTEGRATION__?.status?.().currentRoute === routeId,
      route,
    );
    if (['request.queue', 'admin.access'].includes(route)) {
      await page.waitForFunction((routeId) =>
        globalThis.__HAU_V5_INTEGRATION__?.status?.().connectedRoutes?.includes(routeId), route);
    }
    if (route === 'index') await expect(page.locator('[data-v5-playground-status]')).toBeVisible();
    if (route === 'admin.access') {
      await expect(page.locator('[data-v5-admin-parity]').first()).toBeVisible();
    }
    await expect(page.locator('#surface-main h1').first()).toBeVisible();
    for (const theme of ['light', 'dark']) {
      await setTheme(page, theme);
      if (route === 'admin.access') {
        await expect(page.locator('[data-v5-admin-parity]').first()).toBeVisible();
      }
      await page.screenshot({
        path: testInfo.outputPath(`${route}-${theme}.png`),
        fullPage: true,
        animations: 'disabled',
      });
    }
  }
});
