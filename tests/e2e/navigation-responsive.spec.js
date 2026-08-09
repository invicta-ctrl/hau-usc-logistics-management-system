import { test, expect } from '@playwright/test';
import { navigateToView } from './navigation.js';

test('navigates every approved module without page-level overflow', async ({ page }, testInfo) => {
  await page.goto('/');
  await expect(page.locator('#loading')).toHaveClass(/hidden/);
  await expect(page.locator('.app-header [data-runtime-status]')).toHaveText('Test site');
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
  await expect(page.locator('#lendingTickets')).toBeEmpty();
  await expect(page.locator('[data-inventory-advanced-controls]')).toHaveCount(0);
  await expect(page.locator('[data-inventory-classification-queue]')).toHaveCount(0);
  await expect(page.locator('[data-inventory-workspace-supplement]')).toHaveCount(0);
});

test('legacy preview state without Event Days still starts safely', async ({ page }, testInfo) => {
  test.skip(testInfo.project.use.viewport.width !== 390, 'One representative preview migration is sufficient.');
  await page.goto('/');
  await expect(page.locator('#loading')).toHaveClass(/hidden/);
  await page.evaluate(() => {
    const key = 'hau-usc-logistics-prototype:v1.0.0';
    const saved = JSON.parse(localStorage.getItem(key));
    delete saved.eventDays;
    localStorage.setItem(key, JSON.stringify(saved));
  });
  await page.reload();
  await expect(page.locator('#loading')).toHaveClass(/hidden/);
  await expect(page.getByRole('heading', { name: 'Operations Overview' })).toBeVisible();
});
