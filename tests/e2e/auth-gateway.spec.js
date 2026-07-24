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
  await expect(page.getByRole('heading', { name: 'Staff sign in' })).toBeVisible();
  await expect(page.getByLabel('Access ID or verified HAU-USC email')).toBeVisible();
  await expect(page.locator('.app-shell')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Reset Demo Data' })).toHaveCount(0);
  await expect(page.getByText(/roles and committee access are assigned by the server/i)).toBeVisible();
  await expect(page.locator('#authGateway select')).toHaveCount(0);

  await page.getByLabel('Access ID').fill('HAU-FOOD-001');
  await page.getByLabel('Password', { exact: true }).fill('Temporary!Password9472');
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
  const password = page.getByLabel('Password', { exact: true });
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
  await expect(page.getByRole('button', { name: 'Show password' })).toBeFocused();
  await page.getByRole('button', { name: 'Show password' }).press('Tab');
  await expect(page.getByRole('button', { name: 'Forgot password?' })).toBeFocused();
  await page.getByRole('button', { name: 'Forgot password?' }).press('Tab');
  await expect(page.getByRole('button', { name: 'Sign in' })).toBeFocused();
});

test('staff login provides accessible password visibility and recovery controls', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-390', 'One focused browser proves the Phase 2 controls.');
  await page.addInitScript(() => {
    globalThis.__HAU_RUNTIME_CONFIG__ = { backendMode: 'rest', httpApiBaseUrl: '' };
  });
  await page.route('**/api/auth/session', (route) =>
    route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({
        code: 'SESSION_INVALID',
        message: 'Your session is invalid or expired. Sign in again.',
      }),
    }),
  );

  await page.goto('/login');
  await expect(page.getByRole('alert')).toContainText('session is invalid or expired');
  const password = page.getByLabel('Password', { exact: true });
  const toggle = page.getByRole('button', { name: 'Show password' });
  await password.fill('Retain!Cursor9472');
  await password.evaluate((element) => element.setSelectionRange(3, 9));
  await toggle.click();
  await expect(password).toHaveAttribute('type', 'text');
  await expect(password).toHaveValue('Retain!Cursor9472');
  await expect(page.getByRole('button', { name: 'Hide password' })).toHaveAttribute('aria-pressed', 'true');
  expect(await password.evaluate((element) => [element.selectionStart, element.selectionEnd])).toEqual([
    3, 9,
  ]);

  await page.getByRole('button', { name: 'Forgot password?' }).click();
  await expect(page.getByText('Recover staff access')).toBeVisible();
  await expect(page.getByText(/authorized Administrator.*one-time temporary password/i)).toBeVisible();
  await expect(page.getByRole('link', { name: 'Request Center' })).toHaveAttribute('href', '/request');
  await expect(page.getByRole('link', { name: 'Lending Center' })).toHaveAttribute('href', '/lending');
});

test('public Request Center opens without login and returns private tracking details', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'chromium-390',
    'One mobile browser proves the Phase 3 public boundary.',
  );
  let authCalls = 0;
  await page.addInitScript(() => {
    globalThis.__HAU_RUNTIME_CONFIG__ = { backendMode: 'rest', httpApiBaseUrl: '' };
  });
  await page.route('**/api/auth/**', (route) => {
    authCalls += 1;
    return route.abort();
  });
  await page.route('**/api/public/request/options', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        categories: [
          'Inventory Item',
          'Food',
          'Materials',
          'Venue / Facility',
          'Logistics / Equipment',
          'Other',
        ],
        requesterTypes: ['HAU student / Angelite', 'HAU office / department'],
        items: [{ id: 'ITM-SYNTHETIC', name: 'Synthetic Supply', category: 'Office', unit: 'piece' }],
        eventSeries: [{ id: 'SER-SYNTHETIC', name: 'Synthetic Approved Series', status: 'ACTIVE' }],
        events: [
          {
            id: 'EVT-SYNTHETIC',
            seriesId: 'SER-SYNTHETIC',
            name: 'Synthetic Approved Event',
            venue: 'Synthetic Venue',
            startAt: '2026-08-01T08:00:00.000Z',
            endAt: '2026-08-01T12:00:00.000Z',
          },
        ],
        requestReferences: [],
        stockAreas: ['Inventory'],
        references: [],
      }),
    }),
  );
  await page.route('**/api/public/request', async (route) => {
    const command = await route.request().postDataJSON();
    expect(command.lines).toHaveLength(1);
    expect(command.lines[0]).toMatchObject({ itemId: 'ITM-SYNTHETIC', quantity: 2 });
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        requestId: 'REQ-SYNTHETIC-PUBLIC',
        trackingCode: 'synthetic-private-tracking-code-9472',
        status: 'FOR_REVIEW',
      }),
    });
  });

  await page.goto('/request');
  await expect(page.getByRole('heading', { name: 'Request Center' })).toBeVisible();
  await expect(page.getByLabel('Access ID')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Track Existing Request' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Track Existing Request' })).toBeHidden();
  expect(authCalls).toBe(0);
  const requestForm = page.locator('#publicRequestForm');
  await requestForm.getByRole('button', { name: 'Continue' }).click();
  await requestForm.getByLabel('Full name').fill('Synthetic Public Requester');
  await requestForm.getByLabel('Requester type').selectOption('HAU student / Angelite');
  await requestForm.getByLabel('Organization / department / office').fill('Synthetic Organization');
  await requestForm.getByLabel('Contact number').fill('+63 917 000 0010');
  await requestForm.getByLabel('Email address').fill('public@example.invalid');
  await requestForm.getByRole('button', { name: 'Continue' }).click();
  await requestForm.locator('[name="eventSeriesId"]').selectOption('SER-SYNTHETIC');
  await requestForm.locator('[name="eventId"]').selectOption('EVT-SYNTHETIC');
  await requestForm.locator('[name="eventPurpose"]').fill('Synthetic browser submission proof.');
  await requestForm.getByRole('button', { name: 'Continue' }).click();
  await requestForm.getByLabel('Approved inventory item').selectOption('ITM-SYNTHETIC');
  await requestForm.getByLabel('Quantity').fill('2');
  await requestForm.getByRole('button', { name: 'Add to requested items' }).click();
  await expect(requestForm.locator('.public-request-line')).toContainText('Synthetic Supply');
  await expect(requestForm.locator('.public-request-line')).toContainText('2 piece');
  await requestForm.getByRole('button', { name: 'Continue' }).click();
  await requestForm.getByLabel('Review acknowledgment').check();
  await requestForm.getByRole('button', { name: 'Submit request for review' }).click();
  await expect(page.getByRole('heading', { name: 'Save your private tracking details' })).toBeVisible();
  await expect(page.getByText('REQ-SYNTHETIC-PUBLIC')).toBeVisible();
  await expect(page.getByText('synthetic-private-tracking-code-9472')).toBeVisible();
});

test('public Lending Center opens catalog-first without login and returns private tracking details', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'chromium-390',
    'One mobile browser proves the Phase 4 public boundary.',
  );
  let authCalls = 0;
  await page.addInitScript(() => {
    globalThis.__HAU_RUNTIME_CONFIG__ = { backendMode: 'rest', httpApiBaseUrl: '' };
  });
  await page.route('**/api/auth/**', (route) => {
    authCalls += 1;
    return route.abort();
  });
  await page.route('**/api/public/lending/catalog', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        departments: ['SEA', 'SBA', 'CCJEF', 'SAS', 'SED', 'SOC', 'SNAMS'],
        items: [
          {
            id: 'ITM-LEND-SYNTHETIC',
            name: 'Synthetic Projector',
            category: 'Equipment',
            unit: 'piece',
            type: 'REUSABLE',
            availability: 'AVAILABLE',
            maximumQuantity: 2,
            defaultLoanDays: 7,
            productId: 'ITM-LEND-SYNTHETIC',
            dueDateRequired: true,
            acknowledgmentRequired: true,
            eligibility: 'HAU students and authorized USC staff',
            description: 'Borrower-safe synthetic projector.',
            restrictions: 'Return after use.',
            handlingNotes: 'Keep dry.',
            imageUrl: '',
            conditionTracked: true,
          },
        ],
        process: ['Submit for review.', 'Wait for pickup instructions.'],
      }),
    }),
  );
  await page.route('**/api/public/lending', async (route) => {
    const command = await route.request().postDataJSON();
    expect(command).toMatchObject({
      studentId: '12345678',
      department: 'SEA',
      responsibilityAcknowledged: true,
      lines: [{ itemId: 'ITM-LEND-SYNTHETIC', quantity: 1 }],
    });
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ticketId: 'LBR-SYNTHETIC-PUBLIC',
        trackingCode: 'synthetic-private-lending-code-9472',
        status: 'FOR_REVIEW',
      }),
    });
  });

  await page.goto('/lending');
  await expect(page.getByRole('heading', { name: 'Lending Center' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Browse Items Available for Lending' })).toBeVisible();
  await expect(page.getByLabel('Access ID')).toHaveCount(0);
  expect(authCalls).toBe(0);
  await page.getByRole('button', { name: 'Request item' }).click();
  const form = page.locator('#publicLendingForm');
  await form.getByLabel('Full name').fill('Synthetic Angelite Borrower');
  await form.getByLabel('Student ID').fill('12345678');
  await form.getByLabel('Course and Year').fill('BSIT 2');
  await form.getByLabel('Department').selectOption('SEA');
  await form.getByLabel('Contact number').fill('+63 917 000 0010');
  await form.getByLabel('Email address').fill('synthetic@gmail.com');
  await form.getByLabel('Requested pickup date').fill('2026-08-03');
  await form.getByLabel('Requested due date').fill('2026-08-10');
  await form.getByLabel('Purpose').fill('Synthetic public lending browser proof.');
  await form.getByLabel('Responsibility acknowledgment').check();
  await form.getByRole('button', { name: 'Submit borrowing request for review' }).click();
  await expect(page.getByRole('heading', { name: 'Save your private tracking details' })).toBeVisible();
  await expect(page.getByText('LBR-SYNTHETIC-PUBLIC')).toBeVisible();
  await expect(page.getByText('synthetic-private-lending-code-9472')).toBeVisible();
});
