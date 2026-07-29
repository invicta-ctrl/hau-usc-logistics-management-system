import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, test } from '@playwright/test';
import { navigateToAdminView, navigateToView } from './navigation.js';

const previewRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../docs/previews/v0.6-phase-2');
const generatePreviews = process.env.HAU_GENERATE_PHASE2_PREVIEWS === '1';

const capture = async (page, filename, focus) => {
  if (focus) {
    await focus.scrollIntoViewIfNeeded();
    await expect(focus).toBeVisible();
  }
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: resolve(previewRoot, filename),
    animations: 'disabled',
    fullPage: false,
  });
};

const openFixedPreview = async (page) => {
  await page.clock.setFixedTime(new Date('2026-07-22T03:00:00.000Z'));
  await page.goto('/');
  await expect(page.locator('#loading')).toHaveClass(/hidden/);
};

test.beforeAll(() => {
  mkdirSync(previewRoot, { recursive: true });
});

test('generates inherited login and onboarding previews', async ({ page }, testInfo) => {
  test.skip(!generatePreviews, 'Set HAU_GENERATE_PHASE2_PREVIEWS=1 to write tracked previews.');
  test.skip(testInfo.project.name !== 'chromium-1366', 'Desktop preview generation is sufficient.');

  await page.addInitScript(() => {
    globalThis.__HAU_RUNTIME_CONFIG__ = {
      backendMode: 'rest',
      httpApiBaseUrl: '',
      appEnvironment: 'development',
    };
  });
  await page.route('**/api/auth/session', (route) =>
    route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ code: 'SESSION_REQUIRED', message: 'Sign in to continue.' }),
    }),
  );
  await page.route('**/api/auth/login', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        state: 'ACTIVATION_REQUIRED',
        csrfToken: 'synthetic-preview-csrf',
        expiresAt: '2026-07-22T04:00:00.000Z',
      }),
    }),
  );

  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Staff sign in' })).toBeVisible();
  await capture(page, '01-login-desktop-1366.png', page.locator('#authGateway'));

  await page.getByLabel('Access ID').fill('SYNTHETIC-PREVIEW-001');
  await page.getByLabel('Password', { exact: true }).fill('Synthetic!Preview9472');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('heading', { name: 'Secure your account' })).toBeVisible();
  await capture(page, '02-onboarding-desktop-1366.png', page.locator('#authGateway'));
});

test('generates the seven required desktop experience previews and Release Desk', async ({
  page,
}, testInfo) => {
  test.skip(!generatePreviews, 'Set HAU_GENERATE_PHASE2_PREVIEWS=1 to write tracked previews.');
  test.skip(testInfo.project.name !== 'chromium-1366', 'Desktop preview generation is sufficient.');
  await openFixedPreview(page);

  await navigateToAdminView(page, 'referenceAdmin');
  await capture(page, '03-administrator-desktop-1366.png', page.locator('#referenceAdminWorkspace'));

  for (const [experience, filename] of [
    ['director', '04-director-desktop-1366.png'],
    ['food', '05-food-desktop-1366.png'],
    ['inventory-pantry', '06-inventory-pantry-desktop-1366.png'],
    ['materials', '07-materials-desktop-1366.png'],
  ]) {
    await navigateToView(page, 'overview');
    await page.evaluate((value) => {
      document.body.dataset.experience = value;
    }, experience);
    const panel = page.locator('#roleExperiencePanel');
    await expect(panel).toHaveAttribute('data-role-experience', experience);
    await capture(page, filename, panel);
  }

  await navigateToView(page, 'request');
  await capture(page, '08-request-center-desktop-1366.png', page.locator('#request'));
  await navigateToView(page, 'lending');
  await capture(page, '09-lending-hub-desktop-1366.png', page.locator('#lending'));
  await navigateToView(page, 'release');
  await capture(page, '10-release-desk-desktop-1366.png', page.locator('#release'));
});

test('generates representative mobile workflow previews', async ({ page }, testInfo) => {
  test.skip(!generatePreviews, 'Set HAU_GENERATE_PHASE2_PREVIEWS=1 to write tracked previews.');
  test.skip(testInfo.project.name !== 'chromium-390', 'The required mobile preview width is 390 px.');
  await openFixedPreview(page);

  for (const [view, filename] of [
    ['request', '11-request-center-mobile-390.png'],
    ['lending', '12-lending-hub-mobile-390.png'],
    ['release', '13-release-desk-mobile-390.png'],
  ]) {
    await navigateToView(page, view);
    await capture(page, filename, page.locator(`#${view}`));
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  }
});
