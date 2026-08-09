import { expect, test } from '@playwright/test';

test('v5 landing and module index stay usable without protected requests', async ({ page }) => {
  const protectedRequests = [];
  page.on('request', (request) => {
    if (request.url().includes('/api/')) protectedRequests.push(request.url());
  });

  await page.goto('/portals');
  await expect(page.locator('html')).toHaveAttribute('data-frontend-baseline', 'v5');
  await expect(page.locator('.public--landing')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Request. Prepare. Release.' })).toBeVisible();
  await expect(page.locator('body')).not.toHaveCSS('overflow-x', 'scroll');

  await page.getByRole('link', { name: 'Module index' }).first().click();
  const moduleIndex = page.getByRole('dialog', { name: 'Find a logistics module' });
  await expect(moduleIndex).toBeVisible();
  await expect(moduleIndex.getByRole('link', { name: /Request Center/u })).toHaveAttribute(
    'href',
    '/request',
  );
  await expect(moduleIndex.getByRole('link', { name: /Lending Center/u })).toHaveAttribute(
    'href',
    '/lending',
  );
  await expect(moduleIndex.getByRole('link', { name: /Staff sign in/u })).toHaveAttribute('href', '/login');
  await moduleIndex.getByLabel('Search modules').fill('inventory');
  await expect(moduleIndex.locator('[data-module-index-status]')).toContainText('0 destinations');
  await moduleIndex.getByRole('button', { name: 'Close module index' }).click();
  await expect(moduleIndex).toHaveCount(0);
  expect(protectedRequests).toEqual([]);
});

test('v5 shell connects to the real enabled production navigation', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-390', 'The production-shell wiring is viewport independent.');

  await page.goto('/admin');
  await expect(page.locator('.app-shell.shell')).toBeVisible();
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await expect(page.locator('.sidebar.rail')).toBeVisible();
  await expect(page.locator('.main.workspace.production-workspace')).toBeVisible();
  await expect(page.locator('[data-v5-stage] .main__inner')).toBeVisible();
  await page.keyboard.press('/');
  const moduleIndex = page.getByRole('dialog', { name: 'Find a logistics module' });
  await expect(moduleIndex).toBeVisible();
  await expect(moduleIndex.getByRole('button', { name: /Request Center/u })).toBeVisible();
  await expect(moduleIndex.getByRole('button', { name: /Inventory/u })).toBeVisible();
  await expect(moduleIndex.getByText('Reports', { exact: true })).toHaveCount(0);
});
