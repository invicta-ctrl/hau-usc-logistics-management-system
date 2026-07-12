import { test, expect } from '@playwright/test';

test('navigates every approved module without page-level overflow', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#loading')).toHaveClass(/hidden/);
  for (const view of ['request', 'lending', 'release', 'restocking', 'procurement', 'inventory', 'overview']) {
    await page.locator(`#primaryNav [data-view="${view}"]`).click();
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
