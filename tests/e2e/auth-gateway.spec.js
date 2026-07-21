import { expect, test } from '@playwright/test';
import { createEmptyBootstrapFixture } from '../fixtures/bootstrap-fixtures.js';

test('HTTP mode requires Access ID login and starter activation without role selection', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'chromium-390',
    'One focused browser proves the Phase 1 authentication gate.',
  );
  const bootstrap = createEmptyBootstrapFixture({ backendMode: 'rest' });
  const submitted = [];

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
  await page.route('**/api/auth/login', async (route) => {
    submitted.push(await route.request().postDataJSON());
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        state: 'ACTIVATION_REQUIRED',
        csrfToken: 'synthetic-csrf',
        expiresAt: '2026-07-21T09:00:00.000Z',
      }),
    });
  });
  await page.route('**/api/auth/activate', async (route) => {
    submitted.push(await route.request().postDataJSON());
    expect(route.request().headers()['x-csrf-token']).toBe('synthetic-csrf');
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        state: 'AUTHENTICATED',
        csrfToken: 'authenticated-csrf',
        user: {
          accountId: 'SYNTHETIC-USER-001',
          displayName: 'Synthetic Operator',
          experienceId: 'food',
          authorization: {
            roleId: 'DOL_STAFF',
            roleLabel: 'DOL Staff',
            committeeIds: ['COM_FOOD'],
            capabilities: [],
          },
        },
      }),
    });
  });
  await page.route('**/api/getBootstrapData', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, data: bootstrap }),
    }),
  );

  await page.goto('/');
  expect(await page.evaluate(() => globalThis.__HAU_RUNTIME_CONFIG__?.backendMode)).toBe('rest');
  await expect(page.getByRole('heading', { name: 'Logistics Operations' })).toBeVisible();
  await expect(page.getByLabel('Access ID')).toBeVisible();
  await expect(page.getByText(/roles and committee access are assigned by the server/i)).toBeVisible();
  await expect(page.locator('#authGateway select')).toHaveCount(0);

  await page.getByLabel('Access ID').fill('HAU-FOOD-001');
  await page.getByLabel('Password').fill('Temporary!Password9472');
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page.getByRole('heading', { name: 'Secure your account' })).toBeVisible();
  await expect(page.getByText(/assigned role and committee scope will not change/i)).toBeVisible();
  const activationForm = page.locator('#authActivationForm');
  await activationForm.getByLabel('Full name').fill('Synthetic Operator');
  await activationForm.getByLabel('Mobile number').fill('+63 917 000 0000');
  await activationForm.getByLabel('Email address').fill('synthetic@example.test');
  await activationForm.getByLabel('New password').fill('Activated!Password9472');
  await activationForm.getByLabel('Confirm password').fill('Activated!Password9472');
  await activationForm.getByRole('button', { name: 'Activate account' }).click();

  await expect(page.locator('.app-shell')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();
  await expect(page.locator('body')).toHaveAttribute('data-experience', 'food');
  expect(submitted[0]).toEqual({ accessId: 'HAU-FOOD-001', password: 'Temporary!Password9472' });
  expect(submitted[1]).not.toHaveProperty('roleId');
  expect(submitted[1]).not.toHaveProperty('committeeIds');
});

test('request-only HTTP mode remains outside the internal authentication gate', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'chromium-390',
    'One focused browser proves the request-only boundary.',
  );
  const bootstrap = createEmptyBootstrapFixture({ backendMode: 'rest' });
  let authCalls = 0;
  await page.addInitScript(() => {
    globalThis.__HAU_RUNTIME_CONFIG__ = { backendMode: 'rest', httpApiBaseUrl: '' };
  });
  await page.route('**/api/auth/**', (route) => {
    authCalls += 1;
    return route.abort();
  });
  await page.route('**/api/getBootstrapData', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, data: bootstrap }),
    }),
  );

  await page.goto('/?request=1');
  expect(
    await page.evaluate(() => ({
      backendMode: globalThis.__HAU_RUNTIME_CONFIG__?.backendMode,
      search: location.search,
    })),
  ).toEqual({ backendMode: 'rest', search: '?request=1' });
  await expect(page.getByRole('heading', { name: 'Logistics Operations' })).toHaveCount(0);
  expect(authCalls).toBe(0);
});
