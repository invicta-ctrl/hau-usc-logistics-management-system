import { expect, test } from '@playwright/test';

test.beforeEach(({ page }, testInfo) => {
  void page;
  test.skip(testInfo.project.name !== 'chromium-390', 'Focused V4.1 behavior runs once; responsive coverage runs separately.');
});

test('landing uses real routes, persistent theme, and a static mobile map fallback', async ({ page }) => {
  const protectedRequests = [];
  page.on('request', (request) => {
    if (request.url().includes('/api/')) protectedRequests.push(request.url());
  });

  await page.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'light' });
  await page.goto('/portals');

  await expect(page.getByRole('heading', { name: 'Request. Prepare. Release.' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Open Request Center' })).toHaveAttribute('href', '/request');
  await expect(page.getByRole('link', { name: 'Open Lending Center' })).toHaveAttribute('href', '/lending');
  await expect(page.locator('.portal-landing__quiet-actions').getByRole('link', { name: 'Staff sign in' })).toHaveAttribute('href', '/login');
  await expect(page.getByRole('link', { name: 'Track a request' })).toHaveAttribute('href', '/request#request-tracking');
  await expect(page.getByRole('link', { name: 'Track a loan' })).toHaveAttribute('href', '/lending#lending-tracking');
  await expect(page.locator('[data-landing-network]')).toHaveAttribute('data-motion', 'static');
  await expect(page.locator('.landing-network__fallback')).toBeVisible();

  const theme = page.getByRole('button', { name: 'Switch to dark mode' });
  await theme.click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  const darkTheme = page.getByRole('button', { name: 'Switch to light mode' });
  await expect(darkTheme).toBeVisible();
  await expect(darkTheme).toHaveAttribute('data-theme', 'dark');
  await expect
    .poll(() => darkTheme.locator('.celestial-control__plate').evaluate((plate) => getComputedStyle(plate).transform))
    .toContain('30');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(protectedRequests).toEqual([]);
});

test('landing map enhances once, settles, and keeps calls to action independent', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 768 });
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.goto('/portals');

  const network = page.locator('[data-landing-network]');
  await expect(network).toHaveAttribute('data-motion', /active|settled/u);
  await expect(network).toHaveAttribute('data-motion', 'settled', { timeout: 4000 });
  await expect(page.getByRole('link', { name: 'Open Request Center' })).toBeEnabled();
  await expect(page.getByRole('link', { name: 'Open Lending Center' })).toBeEnabled();
});

test('sanitized preview opens public request tracking without a protected service', async ({ page }) => {
  const protectedRequests = [];
  page.on('request', (request) => {
    if (request.url().includes('/api/')) protectedRequests.push(request.url());
  });

  await page.goto('/request#request-tracking');
  await expect(page.getByRole('heading', { name: 'Request Center' })).toBeVisible();
  await expect(page.locator('#request-tracking')).toBeVisible();
  await expect(page.locator('#request-tracking input[name="requestId"]')).toBeVisible();
  await expect(page.locator('#request-tracking input[name="trackingCode"]')).toBeVisible();
  expect(protectedRequests).toEqual([]);
});

test('menu is keyboard operable and closes with Escape on mobile', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.app-header .brand-media-link[data-brand-fallback]')).toBeVisible();
  await expect(page.locator('.app-header .brand-media[hidden]')).toHaveCount(1);
  const menu = page.locator('[data-signature-menu]');
  await expect(menu).toBeVisible();
  await menu.click();
  await expect(menu).toHaveAttribute('aria-expanded', 'true');
  await expect(page.locator('.sidebar')).toBeInViewport();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: 'Open navigation' })).toHaveAttribute('aria-expanded', 'false');
});

test('lending return remains an accountable browser workflow', async ({ page }) => {
  await page.goto('/');
  await page.locator('[data-shared-mobile-view="lending"]').click();
  await page.locator('[data-loan-tab="ON_LOAN"]').click();
  const ticket = page.locator('.ticket').filter({ hasText: 'LND-2026-0003' });
  await expect(ticket).toContainText('On Loan');
  await ticket.getByRole('button', { name: 'Inspect Return' }).click();
  await expect(page.getByRole('dialog')).toContainText('Return LND-2026-0003');
  page.once('dialog', (dialog) => dialog.accept());
  await page.getByRole('dialog').getByRole('button', { name: 'Confirm return' }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await page.locator('[data-loan-tab="HISTORY"]').click();
  await expect(page.locator('.ticket').filter({ hasText: 'LND-2026-0003' })).toContainText('Returned');
});
