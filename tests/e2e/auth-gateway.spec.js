import { expect, test } from '@playwright/test';
import { createEmptyBootstrapFixture } from '../fixtures/bootstrap-fixtures.js';
import { navigateToView } from './navigation.js';

test('HTTP mode requires Access ID login and starter activation without role selection', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'chromium-390',
    'One focused browser proves the Phase 1 authentication gate.',
  );
  const bootstrap = createEmptyBootstrapFixture({ backendMode: 'rest' });
  bootstrap.currentUser = {
    id: 'SYNTHETIC-USER-001',
    displayName: 'Synthetic Operator',
    role: 'DOL_STAFF',
    committee: 'Food Committee',
    permissions: {},
    scopes: { committee: ['COM_FOOD'], organization: [] },
    authorization: {
      roleId: 'DOL_STAFF',
      roleLabel: 'DOL Staff',
      scopeMode: 'COMMITTEE',
      committeeIds: ['COM_FOOD'],
      committees: [{ id: 'COM_FOOD', name: 'Food Committee' }],
      capabilities: [],
      workspaceIds: ['food'],
      defaultWorkspaceId: 'food',
      active: true,
    },
  };
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
            workspaceIds: ['food'],
            defaultWorkspaceId: 'food',
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

  await page.goto('/app/admin');
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
  await expect(page.locator('[data-auth-logout]')).toHaveCount(1);
  await expect(page.locator('body')).toHaveAttribute('data-experience', 'food');
  await expect(page).toHaveURL(/\/app\/food$/);
  await expect(page.locator('#authGateway')).toHaveCount(0);
  const shell = page.locator('[data-internal-shell-context]');
  await expect(shell).toBeVisible();
  await expect(shell.getByLabel('Workspace')).toHaveValue('food');
  await expect(page).toHaveTitle(/Food Committee.*HAU-USC Logistics/u);
  await expect(shell.getByLabel('Workspace').locator('option:disabled')).toHaveCount(4);
  await expect(shell.getByLabel('Operational scope')).toHaveValue('current');
  await expect(shell.locator('[data-shell-release]')).toHaveText(/STAGING.*v0\.7\.0/u);
  await expect(shell.getByRole('navigation', { name: 'Breadcrumb' })).toContainText(
    'Food Committee',
  );
  await shell.locator('.shell-account > summary').click();
  await expect(shell.getByRole('button', { name: 'Sign out' })).toBeVisible();
  await expect(shell).not.toContainText(
    /Role-resolved preview account|No writes|Synthetic data|Suite preview/u,
  );
  await expect(page.locator('.app-shell')).not.toContainText(
    /Mock Drive metadata retained|No upcoming events in demo data|Role-resolved preview account|No writes|Synthetic data|Suite preview|role-preview/iu,
  );
  expect(submitted[0]).toEqual({ accessId: 'HAU-FOOD-001', password: 'Temporary!Password9472' });
  expect(submitted[1]).not.toHaveProperty('roleId');
  expect(submitted[1]).not.toHaveProperty('committeeIds');
});

test('authenticated Administrator switches real workspace routes without changing identity', async ({
  page,
}, testInfo) => {
  test.skip(
    !['chromium-390', 'chromium-1366'].includes(testInfo.project.name),
    'One mobile and one desktop route-recovery proof are sufficient.',
  );
  const bootstrap = createEmptyBootstrapFixture({ backendMode: 'rest' });
  let sessionCalls = 0;
  await page.addInitScript(() => {
    globalThis.__HAU_RUNTIME_CONFIG__ = {
      backendMode: 'rest',
      httpApiBaseUrl: '',
      appEnvironment: 'staging',
    };
  });
  await page.route('**/api/auth/session', (route) => {
    sessionCalls += 1;
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        state: 'AUTHENTICATED',
        csrfToken: 'administrator-csrf',
        user: {
          accountId: 'SYNTHETIC-ADMINISTRATOR',
          displayName: 'Authorized Administrator',
          experienceId: 'administrator',
          authorization: {
            roleId: 'ADMINISTRATOR',
            roleLabel: 'Administrator',
            scopeMode: 'ALL',
            committeeIds: [],
            capabilities: ['admin_access'],
            workspaceIds: ['administrator', 'director', 'food', 'inventory-pantry', 'materials'],
            defaultWorkspaceId: 'administrator',
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

  await page.goto('/app/food');
  await expect(page.locator('.app-shell')).toBeVisible();
  await expect(page).toHaveURL(/\/app\/food$/u);
  await expect(page.locator('body')).toHaveAttribute('data-experience', 'food');
  const shell = page.locator('[data-internal-shell-context]');
  await expect(shell.getByLabel('Workspace')).toHaveValue('food');
  await expect(shell.getByLabel('Workspace').locator('option:disabled')).toHaveCount(0);
  await expect(shell.locator('[data-shell-account-role]')).toHaveText(/ADMINISTRATOR|Administrator/u);
  await expect(page.locator('#roleExperiencePanel')).toHaveAttribute('data-role-experience', 'food');

  await shell.getByLabel('Workspace').selectOption('materials');
  await expect(page).toHaveURL(/\/app\/materials$/u);
  await expect(shell.getByLabel('Workspace')).toHaveValue('materials');
  await expect(page).toHaveTitle(/Materials & Documentation.*HAU-USC Logistics/u);
  await expect(shell.locator('[data-shell-workspace-crumb]')).toHaveText(
    'Materials & Documentation',
  );
  await expect(page.locator('#roleExperiencePanel')).toHaveAttribute(
    'data-role-experience',
    'materials',
  );
  await expect(page.locator('.app-shell')).not.toContainText(
    /Role-resolved preview account|No writes|Synthetic data|Suite preview|role-preview/iu,
  );
  expect(sessionCalls).toBe(1);

  for (const [path, workspace, experience] of [
    ['/app/admin', 'administrator', 'administrator'],
    ['/app/director', 'director', 'director'],
    ['/app/inventory', 'inventory-pantry', 'inventory-pantry'],
  ]) {
    await page.goto(path);
    await expect(page.locator('.app-shell')).toBeVisible();
    await expect(page).toHaveURL(new RegExp(`${path}$`, 'u'));
    await expect(page.locator('body')).toHaveAttribute('data-experience', experience);
    await expect(page.locator('#shellWorkspaceSelect')).toHaveValue(workspace);
  }
});

test('authenticated System Owner keeps owner identity across every workspace and Release Desk', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'chromium-390',
    'One mobile System Owner route and module proof is sufficient.',
  );
  const bootstrap = createEmptyBootstrapFixture({ backendMode: 'rest' });
  bootstrap.currentUser = {
    ...bootstrap.currentUser,
    id: 'SYNTHETIC-SYSTEM-OWNER',
    displayName: 'Authorized System Owner',
    role: 'SYSTEM_OWNER',
    permissions: { review: true, release: true, receive: true, admin: true, manageCatalog: true },
    authorization: {
      ...bootstrap.currentUser.authorization,
      roleId: 'SYSTEM_OWNER',
      roleLabel: 'System Owner',
      scopeMode: 'ALL',
      committeeIds: [],
      committees: [],
      capabilities: [
        'view.request',
        'view.internal',
        'fulfillment.release',
        'lending.usage.view',
        'system.admin',
      ],
      workspaceIds: ['administrator', 'director', 'food', 'inventory-pantry', 'materials'],
      defaultWorkspaceId: 'administrator',
      mappingStatus: 'MAPPED',
      active: true,
    },
  };
  await page.addInitScript(() => {
    globalThis.__HAU_RUNTIME_CONFIG__ = {
      backendMode: 'rest',
      httpApiBaseUrl: '',
      appEnvironment: 'staging',
    };
  });
  await page.route('**/api/auth/session', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        state: 'AUTHENTICATED',
        csrfToken: 'owner-csrf',
        user: {
          accountId: 'SYNTHETIC-SYSTEM-OWNER',
          displayName: 'Authorized System Owner',
          experienceId: 'administrator',
          authorization: bootstrap.currentUser.authorization,
        },
      }),
    }),
  );
  await page.route('**/api/getBootstrapData', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, data: bootstrap }),
    }),
  );

  await page.goto('/app/materials');
  const shell = page.locator('[data-internal-shell-context]');
  await expect(shell).toBeVisible();
  await expect(shell.locator('[data-shell-account-role]')).toHaveText('System Owner');
  await expect(shell.getByLabel('Workspace')).toHaveValue('materials');
  await expect(shell.getByLabel('Workspace').locator('option:disabled')).toHaveCount(0);

  for (const workspace of ['administrator', 'director', 'food', 'inventory-pantry', 'materials']) {
    await shell.getByLabel('Workspace').selectOption(workspace);
    await expect(shell.getByLabel('Workspace')).toHaveValue(workspace);
    await expect(shell.locator('[data-shell-account-role]')).toHaveText('System Owner');
  }

  await navigateToView(page, 'release');
  await expect(page.locator('#release')).toHaveClass(/active/u);
  await expect(page).toHaveURL(/\/app\/materials\/release$/u);
  await expect(shell.locator('[data-shell-account-role]')).toHaveText('System Owner');
  await page.reload();
  await expect(page.locator('#release')).toHaveClass(/active/u);
  await expect(page).toHaveURL(/\/app\/materials\/release$/u);
  await expect(shell.locator('[data-shell-account-role]')).toHaveText('System Owner');
  await shell.getByLabel('Workspace').selectOption('food');
  await expect(page).toHaveURL(/\/app\/food\/release\?scope=COMMITTEE%3ACOM_FOOD$/u);
  await expect(page.locator('#release')).toHaveClass(/active/u);
  await expect(shell.locator('[data-shell-account-role]')).toHaveText('System Owner');
  await navigateToView(page, 'lending');
  await expect(page.locator('[data-lending-usage]')).toBeVisible();
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

test('authenticated department Request Center submits, tracks, and saves a PDF receipt', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'chromium-390',
    'One mobile browser proves the authenticated Request Center boundary.',
  );
  let authenticated = false;
  let submitted = false;
  await page.addInitScript(() => {
    globalThis.__HAU_RUNTIME_CONFIG__ = { backendMode: 'rest', httpApiBaseUrl: '' };
  });
  await page.route('**/api/auth/**', async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    if (pathname === '/api/auth/session' && !authenticated) {
      return route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ code: 'SESSION_REQUIRED', message: 'Sign in.' }),
      });
    }
    if (pathname === '/api/auth/login') authenticated = true;
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        state: 'AUTHENTICATED',
        csrfToken: 'csrf-requester',
        user: {
          displayName: 'Department of Logistics',
          authorization: { roleId: 'REQUESTER', roleLabel: 'Requester', scopeMode: 'SELF' },
          requesterDepartment: {
            id: 'USC-DEPT-DOL',
            displayName: 'Department of Logistics',
          },
        },
      }),
    });
  });
  const portalPayload = () => ({
    ok: true,
    profile: {
      departmentId: 'USC-DEPT-DOL',
      displayName: 'Department of Logistics',
    },
    eventSeries: [
      { id: 'SER-SYNTHETIC', code: 'SYN', name: 'Synthetic Approved Event' },
      ...Array.from({ length: 8 }, (_, index) => ({
        id: `SER-AUTOCOMPLETE-${index + 1}`,
        code: `AC${index + 1}`,
        name: `Approved Event ${index + 1}`,
      })),
    ],
    events: [
      {
        id: 'EVT-SYNTHETIC',
        seriesId: 'SER-SYNTHETIC',
        name: 'Synthetic Approved Sub-event',
        startsAt: '2026-08-01T08:00:00.000Z',
        endsAt: '2026-08-01T12:00:00.000Z',
        venue: 'University Theater',
      },
      ...Array.from({ length: 8 }, (_, index) => ({
        id: `EVT-AUTOCOMPLETE-${index + 1}`,
        seriesId: 'SER-SYNTHETIC',
        name: `Approved Sub-event ${index + 1}`,
        startsAt: '2026-08-01T08:00:00.000Z',
        endsAt: '2026-08-01T12:00:00.000Z',
        venue: 'University Theater',
      })),
    ],
    choices: {
      'Venue / Facility': ['University Theater'],
      Logistics: ['Monoblock Chairs'],
      Equipment: ['Projector'],
    },
    units: ['piece', 'unit', 'chair', 'facility'],
    requests: submitted
      ? [
          {
            id: 'REQ-SYNTHETIC-DEPARTMENT',
            requestType: 'NEW',
            parentRequestId: '',
            eventSeriesId: 'SER-SYNTHETIC',
            eventId: 'EVT-SYNTHETIC',
            event: 'Synthetic Approved Event',
            subEvent: 'Synthetic Approved Sub-event',
            department: 'Department of Logistics',
            purpose: 'Synthetic authenticated request proof.',
            status: 'FOR_REVIEW',
            createdAt: '2026-07-24T06:45:00.000Z',
            updatedAt: '2026-07-24T06:45:00.000Z',
            lines: [
              {
                description: 'University Theater',
                specification: 'Accessible seating',
                category: 'Venue / Facility',
                quantity: 1,
                unit: 'facility',
                status: 'FOR_REVIEW',
              },
            ],
            history: [{ status: 'FOR_REVIEW', at: '2026-07-24T06:45:00.000Z' }],
          },
        ]
      : [],
  });
  await page.route('**/api/portal/request', async (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(portalPayload()),
      });
    }
    const command = await route.request().postDataJSON();
    expect(command).toMatchObject({
      requestType: 'NEW',
      eventSeriesId: 'SER-SYNTHETIC',
      eventId: 'EVT-SYNTHETIC',
      purpose: 'Synthetic authenticated request proof.',
    });
    expect(command).not.toHaveProperty('department');
    expect(command.lines).toEqual([
      expect.objectContaining({
        category: 'Venue / Facility',
        description: 'University Theater',
        quantity: 1,
        unit: 'facility',
      }),
    ]);
    submitted = true;
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        requestId: 'REQ-SYNTHETIC-DEPARTMENT',
        requestType: 'NEW',
        parentRequestId: '',
        department: 'Department of Logistics',
        event: 'Synthetic Approved Event',
        subEvent: 'Synthetic Approved Sub-event',
        submittedAt: '2026-07-24T06:45:00.000Z',
        status: 'FOR_REVIEW',
        lines: command.lines,
      }),
    });
  });

  await page.goto('/request');
  await expect(page.getByRole('heading', { name: 'Request Center' })).toBeVisible();
  await expect(page.getByLabel('Access ID')).toBeVisible();
  await page.getByLabel('Access ID').fill('DOL_2026');
  await page.getByLabel('Password', { exact: true }).fill('Synthetic!Password9472');
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByText('Department of Logistics').first()).toBeVisible();
  await expect(page.getByRole('button', { name: 'Track Existing Request' })).toBeVisible();
  const requestForm = page.locator('#requesterRequestForm');
  await expect(requestForm.getByLabel('Department')).toHaveValue('Department of Logistics');
  await expect(requestForm.getByLabel('Department')).toHaveAttribute('readonly', '');
  const eventAutocomplete = requestForm.locator('[data-event-series-autocomplete]');
  await expect(eventAutocomplete).toBeVisible();
  await eventAutocomplete.fill('Synthetic Approved Event');
  await expect(requestForm.locator('[name="eventSeriesId"]')).toHaveValue('SER-SYNTHETIC');
  const subEventAutocomplete = requestForm.locator('[data-event-autocomplete]');
  await expect(subEventAutocomplete).toBeVisible();
  await subEventAutocomplete.fill('Synthetic Approved Sub-event');
  await expect(requestForm.locator('[name="eventId"]')).toHaveValue('EVT-SYNTHETIC');
  await requestForm.locator('[name="purpose"]').fill('Synthetic authenticated request proof.');
  await requestForm.locator('[name="lineCategory"]').selectOption('Venue / Facility');
  await requestForm.locator('[name="lineChoice"]').selectOption('University Theater');
  await requestForm.locator('[name="lineQuantity"]').fill('1');
  await requestForm.locator('[name="lineUnit"]').selectOption('facility');
  await requestForm.locator('[name="lineSpecification"]').fill('Accessible seating');
  await requestForm.getByRole('button', { name: 'Add requested item' }).click();
  await expect(requestForm.locator('.request-center-draft')).toContainText('University Theater');
  await requestForm.getByRole('button', { name: 'Submit request' }).click();
  await expect(page.getByRole('heading', { name: 'Submitted successfully' })).toBeVisible();
  await expect(page.getByText('REQ-SYNTHETIC-DEPARTMENT', { exact: true })).toBeVisible();
  await expect(page.locator('[name="trackingCode"]')).toHaveCount(0);
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Save PDF Receipt' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('REQ-SYNTHETIC-DEPARTMENT-request-receipt.pdf');
  await page.getByRole('button', { name: 'View Request Status' }).click();
  await expect(page.getByRole('heading', { name: 'Track Existing Request' })).toBeVisible();
  await expect(page.locator('[data-tracking-results]')).toContainText('University Theater');
  await expect(page.locator('body')).not.toHaveCSS('overflow-x', 'scroll');
});

test('public Lending Center classifies borrowers and submits without public tracking', async ({
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
        uscDepartments: ['Department of Logistics', 'Office of the President'],
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
            aliases: ['presentation projector', 'av display'],
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
  await page.route('**/api/public/advertisements', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        items: [
          {
            id: 'ADV-SYNTHETIC-ONE',
            title: 'Synthetic announcement one',
            description: 'First governed announcement.',
            altText: 'Synthetic announcement artwork one.',
            callToAction: 'View announcement',
            destinationUrl: 'https://example.invalid/one',
            imageUrl: '/media/advertisements/ADV-SYNTHETIC-ONE',
          },
          {
            id: 'ADV-SYNTHETIC-TWO',
            title: 'Synthetic announcement two',
            description: 'Second governed announcement.',
            altText: 'Synthetic announcement artwork two.',
            callToAction: 'View announcement',
            destinationUrl: 'https://example.invalid/two',
            imageUrl: '/media/advertisements/ADV-SYNTHETIC-TWO',
          },
        ],
      }),
    }),
  );
  await page.route('**/media/advertisements/**', (route) =>
    route.fulfill({ status: 200, contentType: 'image/png', body: '' }),
  );
  await page.route('**/api/public/lending', async (route) => {
    const command = await route.request().postDataJSON();
    expect(command).toMatchObject({
      borrowerType: 'ANGELITE',
      studentId: '12345678',
      courseYear: 'BSIT 2',
      academicDepartment: 'School of Computing',
      responsibilityAcknowledged: true,
      lines: [{ itemId: 'ITM-LEND-SYNTHETIC', quantity: 1 }],
    });
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        submissionId: 'LBR-SYNTHETIC-PUBLIC',
        status: 'FOR_REVIEW',
      }),
    });
  });

  await page.goto('/lending');
  await expect(page.getByRole('heading', { name: 'Lending Center' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Browse Items Available for Lending' })).toBeVisible();
  await expect(page.getByLabel('Access ID')).toHaveCount(0);
  expect(authCalls).toBe(0);
  const portal = page.locator('.public-lending-portal');
  await portal.getByRole('searchbox', { name: 'Search' }).fill('presentation');
  await expect(portal.getByRole('option', { name: /Synthetic Projector/u })).toBeVisible();
  await portal.getByRole('option', { name: /Synthetic Projector/u }).click();
  await portal.getByRole('button', { name: 'Request item' }).click();
  const form = page.locator('#publicLendingForm');
  await form.getByLabel('Angelite Student').check();
  await form.getByLabel('Full name').fill('Synthetic Angelite Borrower');
  await form.getByLabel('Student ID').fill('12345678');
  await form.getByLabel('Course and year').fill('BSIT 2');
  await form.getByLabel('College, school, or academic department').fill('School of Computing');
  await form.getByLabel('Contact number').fill('+63 917 000 0010');
  await form.getByLabel('Email address').fill('synthetic@gmail.com');
  await form.getByLabel('Requested pickup date').fill('2026-08-03');
  await form.getByLabel('Requested due date').fill('2026-08-10');
  await form.getByLabel('Purpose').fill('Synthetic public lending browser proof.');
  await form.getByLabel('Responsibility acknowledgment').check();
  await expect(page.getByRole('heading', { name: 'USC Announcements' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Synthetic announcement one' })).toBeVisible();
  await page.getByRole('button', { name: 'Next announcement' }).click();
  await expect(page.getByRole('heading', { name: 'Synthetic announcement two' })).toBeVisible();
  await form.getByRole('button', { name: 'Submit borrowing request for review' }).click();
  await expect(page.getByRole('heading', { name: 'Submitted successfully' })).toBeVisible();
  await expect(page.getByText('LBR-SYNTHETIC-PUBLIC')).toBeVisible();
  await expect(page.getByText('private tracking', { exact: false })).toHaveCount(0);
});

test('public Lending Center distinguishes service failure from true-empty and clears inactive borrower fields', async ({
  page,
}, testInfo) => {
  test.skip(
    testInfo.project.name !== 'chromium-390',
    'One mobile browser proves the public catalog state and borrower-field boundaries.',
  );
  let catalogMode = 'error';
  await page.addInitScript(() => {
    globalThis.__HAU_RUNTIME_CONFIG__ = { backendMode: 'rest', httpApiBaseUrl: '' };
  });
  await page.route('**/api/public/advertisements', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{"items":[]}' }),
  );
  await page.route('**/api/public/lending/catalog', (route) => {
    if (catalogMode === 'error') {
      return route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: '{"message":"Synthetic catalog outage."}',
      });
    }
    const items =
      catalogMode === 'empty'
        ? []
        : [
            {
              id: 'ITM-LEND-STATE',
              name: 'Synthetic Projector',
              category: 'Equipment',
              unit: 'piece',
              type: 'REUSABLE',
              availability: 'AVAILABLE',
              maximumQuantity: 2,
              productId: 'ITM-LEND-STATE',
              aliases: ['presentation projector'],
              dueDateRequired: true,
              acknowledgmentRequired: true,
              conditionTracked: true,
            },
          ];
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        uscDepartments: ['Department of Logistics', 'Office of the President'],
        items,
        process: ['Submit for review.'],
      }),
    });
  });

  await page.goto('/lending');
  await expect(page.getByRole('heading', { name: 'Catalog service unavailable' })).toBeVisible();
  await expect(page.getByText('This is a service error, not an empty catalog.')).toBeVisible();

  catalogMode = 'empty';
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByText('No approved lending items are published.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Catalog service unavailable' })).toHaveCount(0);

  catalogMode = 'items';
  await page.reload();
  const portal = page.locator('.public-lending-portal');
  await portal.getByRole('searchbox', { name: 'Search' }).fill('presentation');
  await expect(portal.getByRole('option', { name: /Synthetic Projector/u })).toBeVisible();
  await portal.getByRole('option', { name: /Synthetic Projector/u }).click();
  await portal.getByRole('button', { name: 'Request item' }).click();

  const form = page.locator('#publicLendingForm');
  await form.getByLabel('Angelite Student').check();
  await form.getByLabel('Course and year').fill('BSIT 2');
  await form.getByLabel('College, school, or academic department').fill('School of Computing');
  await form.getByLabel('USC Staff/Officer').check();
  await expect(form.getByLabel('Course and year')).toBeDisabled();
  await expect(form.getByLabel('Course and year')).toHaveValue('');
  await expect(form.getByLabel('College, school, or academic department')).toHaveValue('');
  await form.getByLabel('USC department').selectOption('Department of Logistics');
  await form.getByLabel('Position or role').fill('Committee Officer');
  await form.getByLabel('Angelite Student').check();
  await expect(form.getByLabel('USC department')).toBeDisabled();
  await expect(form.getByLabel('USC department')).toHaveValue('');
  await expect(form.getByLabel('Position or role')).toHaveValue('');
  await expect(page.locator('body')).not.toHaveCSS('overflow-x', 'scroll');
});
