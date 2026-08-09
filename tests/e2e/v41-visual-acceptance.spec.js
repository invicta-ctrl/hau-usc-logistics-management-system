import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';

const evidenceRoot = resolve(import.meta.dirname, '../../output/design/acceptance');
const widths = [320, 375, 414, 768, 1024, 1440];

test.beforeEach(({ page }, testInfo) => {
  void page;
  test.skip(testInfo.project.name !== 'chromium-390', 'One Chromium worker captures the full acceptance matrix.');
});

test('landing is responsive at every required width in light and dark modes', async ({ page }) => {
  await mkdir(evidenceRoot, { recursive: true });
  await page.emulateMedia({ reducedMotion: 'no-preference', colorScheme: 'light' });

  for (const width of widths) {
    const height = width <= 414 ? 844 : width <= 768 ? 900 : 960;
    await page.setViewportSize({ width, height });
    await page.goto('/portals');
    await expect(page.getByRole('heading', { name: 'Request. Prepare. Release.' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Open Request Center' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Open Lending Center' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(
      await page.locator('.portal-landing__actions a').evaluateAll((links) =>
        links.every((link) => link.getBoundingClientRect().height <= 56 && getComputedStyle(link).whiteSpace === 'nowrap'),
      ),
    ).toBe(true);
    await page.screenshot({ path: resolve(evidenceRoot, `v41-landing-${width}-light.png`), fullPage: true });
  }

  for (const width of [375, 1440]) {
    await page.setViewportSize({ width, height: width === 375 ? 844 : 960 });
    await page.goto('/portals');
    const toggle = page.getByRole('button', { name: 'Switch to dark mode' });
    await toggle.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await page.screenshot({ path: resolve(evidenceRoot, `v41-landing-${width}-dark.png`), fullPage: true });
    await page.getByRole('button', { name: 'Switch to light mode' }).click();
  }
});

test('landing remains operable at 200 percent zoom', async ({ page, context }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('/portals');
  const cdp = await context.newCDPSession(page);
  await cdp.send('Emulation.setPageScaleFactor', { pageScaleFactor: 2 });

  await expect(page.getByRole('heading', { name: 'Request. Prepare. Release.' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Open Request Center' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Open Lending Center' })).toBeVisible();
  await page.keyboard.press('Tab');
  expect(await page.evaluate(() => document.activeElement !== document.body)).toBe(true);
  await page.screenshot({ path: resolve(evidenceRoot, 'v41-landing-200-percent-zoom.png'), fullPage: true });
});

test('reduced motion keeps the landing map static', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/portals');

  await expect(page.locator('[data-landing-network]')).toHaveAttribute('data-motion', 'static');
  expect(
    await page.locator('[data-landing-network]').evaluate((network) =>
      [...network.querySelectorAll('*')].every((element) => getComputedStyle(element).animationName === 'none'),
    ),
  ).toBe(true);
});
