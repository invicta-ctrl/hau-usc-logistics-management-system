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
  await expect(page.locator('.app-shell')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Reset Demo Data' })).toHaveCount(0);
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
  await expect(page).toHaveURL(/\/app\/food$/);
  await expect(page.locator('#authGateway')).toHaveCount(0);
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

test('login errors preserve one stable form without autofocus or a focus loop', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'chromium-390',
    'One focused mobile browser proves stable password-manager semantics.',
  );
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
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 'AUTHENTICATION_FAILED',
        message: 'The Access ID or password is incorrect.',
      }),
    }),
  );

  await page.goto('/');
  const form = page.locator('#authLoginForm');
  const accessId = page.getByLabel('Access ID');
  const password = page.getByLabel('Password');
  await expect(form).toHaveAttribute('autocomplete', 'on');
  await expect(accessId).toHaveAttribute('name', 'username');
  await expect(accessId).toHaveAttribute('type', 'text');
  await expect(accessId).toHaveAttribute('inputmode', 'text');
  await expect(accessId).toHaveAttribute('autocomplete', 'username');
  await expect(accessId).toHaveAttribute('autocapitalize', 'characters');
  await expect(password).toHaveAttribute('autocomplete', 'current-password');
  await expect(accessId).not.toBeFocused();
  await accessId.evaluate((element) => {
    globalThis.__authAccessIdNode = element;
  });

  await accessId.fill('HAU.SYNTHETIC.001');
  await password.fill('Synthetic!Password9472');
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page.getByRole('alert')).toContainText('Access ID or password is incorrect');
  await expect(accessId).toHaveValue('HAU.SYNTHETIC.001');
  await expect(password).toHaveValue('Synthetic!Password9472');
  expect(await accessId.evaluate((element) => element === globalThis.__authAccessIdNode)).toBe(true);
  await expect(accessId).not.toBeFocused();

  await accessId.focus();
  await accessId.press('Tab');
  await expect(password).toBeFocused();
  await password.press('Tab');
  await expect(page.getByRole('button', { name: 'Sign in' })).toBeFocused();
});
