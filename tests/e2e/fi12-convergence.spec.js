import { expect, test } from '@playwright/test';

const VERSION = '**/api/version';
const exactInspectionPort = process.env.HAU_FRONTEND_E2E_PORT === '4173';
const scopedRoutes = [
  { route: 'administration', root: '[data-fi11-administration="true"]' },
  { route: 'release', root: '.rel' },
  { route: 'restocking', root: '.sup' },
];

function computedHeaderStyle(locator) {
  return locator.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      alignItems: style.alignItems,
      display: style.display,
      gap: style.gap,
      marginTop: style.marginTop,
      maxWidth: style.maxWidth,
    };
  });
}

test('FI-12 keeps all scoped route header styles out of the authenticated shell', async ({ page }) => {
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
      const shellTopbar = page.locator('.auth-shell__topbar');
      await expect(shellTopbar).toBeVisible();
      const routeHeader = routeRoot.locator(':scope > header');
      await expect(routeHeader).toBeVisible();

      const shellAfter = await computedHeaderStyle(shellTopbar);
      const routeStyle = await computedHeaderStyle(routeHeader);
      expect(shellAfter).toEqual({
        alignItems: 'normal',
        display: 'block',
        gap: 'normal',
        marginTop: '0px',
        maxWidth: 'none',
      });
      expect(routeStyle.display).toBe('flex');
      expect(routeStyle.marginTop).toBe('22px');
      expect(routeStyle.maxWidth).toBe('1440px');
      expect(routeStyle).not.toEqual(shellAfter);
    });
  }
});
