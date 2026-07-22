import { test, expect } from '@playwright/test';
import { navigateToView } from './navigation.js';

test('navigates every approved module without page-level overflow', async ({ page }, testInfo) => {
  await page.goto('/');
  await expect(page.locator('#loading')).toHaveClass(/hidden/);
  await expect(page.locator('.app-header [data-runtime-status]')).toHaveText('Connecting securely…');
  await expect(page.locator('#resetDemo')).toHaveCount(0);
  if (testInfo.project.use.viewport.width <= 820) {
    await expect(page.locator('[data-shared-mobile-nav]')).toBeVisible();
  } else {
    await expect(page.locator('[data-shared-mobile-nav]')).toBeHidden();
  }

  for (const view of ['request', 'lending', 'release', 'restocking', 'procurement', 'inventory', 'overview']) {
    await navigateToView(page, view);
    await expect(page.locator(`section#${view}`)).toHaveClass(/active/);
  }
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test('request-only portal uses sanitized state and hides internal workspaces', async ({ page }) => {
  await page.goto('/?request=1');
  await expect(page.locator('#loading')).toHaveClass(/hidden/);
  await expect(page.locator('body')).toHaveClass(/request-mode/);
  await expect(page.locator('.portal-header')).toBeVisible();
  await expect(page.locator('#request')).toHaveClass(/active/);
  await expect(page.locator('.sidebar')).toBeHidden();
  await expect(page.locator('#inventoryTable')).toBeEmpty();
  await expect(page.locator('#releaseTickets')).toBeEmpty();
});
