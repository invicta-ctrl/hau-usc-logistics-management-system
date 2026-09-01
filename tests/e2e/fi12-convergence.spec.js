import { expect, test } from '@playwright/test';

const VERSION = '**/api/version';
const exactInspectionPort = process.env.HAU_FRONTEND_E2E_PORT === '4173';
const scopedRoutes = [
  { route: 'administration', root: '[data-fi11-administration="true"]' },
  { route: 'release', root: '.rel' },
  { route: 'restocking', root: '.sup' },
];

test('FI-12 keeps restored route headers visible, non-overlapping, and horizontally safe', async ({ page }) => {
  test.skip(!exactInspectionPort, 'Run explicitly against the accepted 4173 supervisor.');
  test.setTimeout(120_000);
  await page.route(VERSION, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, correlationId: 'fi12-convergence', playground: true }),
    }),
  );

  for (const target of scopedRoutes) {
    await test.step(target.route, async () => {
      await page.goto('/#/__preview/index', { waitUntil: 'domcontentloaded' });
      await page.locator(`[data-preview-route="${target.route}"] [data-action="open-preview"]`).click();
      const routeRoot = page.locator(target.root);
      await expect(routeRoot).toBeVisible();
      const shellTopbar = page.getByRole('banner', { name: 'Workspace command bar' });
      await expect(shellTopbar).toBeVisible();
      const routeHeader = routeRoot.locator(':scope > header');
      await expect(routeHeader).toBeVisible();

      const [topbarBox, routeHeaderBox] = await Promise.all([shellTopbar.boundingBox(), routeHeader.boundingBox()]);
      expect(topbarBox).not.toBeNull();
      expect(routeHeaderBox).not.toBeNull();
      expect(routeHeaderBox.y).toBeGreaterThanOrEqual(topbarBox.y + topbarBox.height);
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth),
      ).toBeLessThanOrEqual(1);
    });
  }
});
