import { expect, test } from '@playwright/test';

const onePixel = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLJtwAAAABJRU5ErkJggg==', 'base64');

function installPublicFeed(page, mode = 'populated') {
  return page.route('**/api/public/advertisements', (route) => {
    if (mode === 'error') return route.fulfill({ status: 503, contentType: 'application/json', body: '{"message":"Unavailable"}' });
    const items = mode === 'empty' ? [] : [{
      id: 'ADV-FVR-001',
      title: 'Governed announcement',
      description: 'A published announcement from the public backend contract.',
      altText: 'Council announcement artwork.',
      callToAction: 'Read more',
      destinationUrl: 'https://example.test/announcement',
      imageUrl: '/media/advertisements/ADV-FVR-001',
    }];
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, items }) });
  });
}

function installPublicIntakeContracts(page) {
  page.route('**/api/public/lending/catalog', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      ok: true,
      uscDepartments: ['Department of Logistics'],
      items: [{
        id: 'ITM-CHAIR', productId: 'ITM-CHAIR', name: 'Folding chair', aliases: ['chair'],
        category: 'Furniture', type: 'REUSABLE', availability: 'AVAILABLE', unit: 'piece',
        maximumQuantity: 4, defaultLoanDays: 7, dueDateRequired: true,
        acknowledgmentRequired: false, eligibility: '', handlingNotes: '', description: 'Governed chair.',
        restrictions: '', imageUrl: '', conditionTracked: true,
      }],
    }),
  }));
  page.route('**/api/public/request/options', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      ok: true,
      requesterTypes: ['USC officer / committee'],
      categories: ['Inventory Item', 'Food', 'Materials', 'Venue / Facility', 'Logistics / Equipment', 'Other'],
      items: [{ id: 'ITM-CHAIR', name: 'Folding chair', category: 'Furniture', unit: 'piece' }],
      eventSeries: [{ id: 'SER-1', code: 'SER-1', name: 'General Assembly', status: 'ACTIVE' }],
      events: [{ id: 'EVT-1', seriesId: 'SER-1', name: 'Opening plenary', startAt: '2026-12-01T00:00:00.000Z', endAt: '2026-12-01T04:00:00.000Z', venue: 'Plenary Hall', status: 'ACTIVE' }],
      references: [],
      stockAreas: ['Council pantry'],
    }),
  }));
}

test('FVR-001 landing renders the governed Current feed responsively without overflow', async ({ page }) => {
  await installPublicFeed(page);
  await page.route('**/media/advertisements/**', (route) => route.fulfill({ status: 200, contentType: 'image/png', body: onePixel }));
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Every request. Every handoff. On record.' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'What the council is doing now' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Governed announcement' })).toBeVisible();
  await expect(page.getByAltText('Council announcement artwork.')).toBeVisible();
  await expect(page.getByText(/Local design simulation only/i)).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
});

test('FVR-001 Current preserves intentional empty and request-error states', async ({ page }) => {
  await installPublicFeed(page, 'empty');
  await page.goto('/');
  await expect(page.getByRole('article').getByText('There are no published announcements right now. Please check back for the next council update.')).toBeVisible();

  await page.unroute('**/api/public/advertisements');
  await installPublicFeed(page, 'error');
  await page.reload();
  await expect(page.getByRole('article').getByText('Current announcements are temporarily unavailable. Please try again shortly.')).toBeVisible();
});

test('FVR-001 uses the same-origin cookie session contract before opening a protected route', async ({ page }) => {
  await installPublicFeed(page, 'empty');
  await page.route('**/api/auth/session', (route) => route.fulfill({
    status: 401,
    contentType: 'application/json',
    body: JSON.stringify({ code: 'SESSION_REQUIRED', message: 'Sign in to continue.' }),
  }));
  await page.goto('/');
  await page.getByRole('button', { name: 'Start a logistics request in the Staff Request Center' }).click();
  await expect(page.getByRole('heading', { name: 'Sign in to continue' })).toBeVisible();
  await expect(page.getByText('Sign in required')).toBeVisible();
});

test('FVR-001 confirms sign-in without exposing future authenticated fixture routes', async ({ page }) => {
  await installPublicFeed(page, 'empty');
  let logoutCsrf;
  await page.route('**/api/auth/login', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      state: 'AUTHENTICATED',
      csrfToken: 'csrf-confirmed-session',
      user: {
        accountId: 'ACC-CONFIRMED',
        displayName: 'Confirmed Staff Member',
        authorization: {
          active: true,
          mappingStatus: 'MAPPED',
          roleId: 'STAFF',
          capabilities: ['view.internal', 'view.request'],
        },
      },
    }),
  }));
  await page.route('**/api/auth/logout', (route) => {
    logoutCsrf = route.request().headers()['x-csrf-token'];
    return route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
  });

  await page.goto('/');
  await page.getByRole('button', { name: 'Staff sign in' }).first().click();
  await page.getByLabel('Identifier').fill('confirmed.staff');
  await page.getByLabel('Password', { exact: true }).fill('service-verified-password');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();

  await expect(page.getByText('Access authorized')).toBeVisible();
  await expect(page.getByText('The staff workspace is not yet available from this public release.')).toBeVisible();
  await expect(page.getByText(/Design fixture|Synthetic prototype|Simulated save/u)).toHaveCount(0);
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page.getByRole('heading', { name: 'Every request. Every handoff. On record.' })).toBeVisible();
  expect(logoutCsrf).toBe('csrf-confirmed-session');
});

test('FVR-001 completes the server-owned starter activation lifecycle', async ({ page }) => {
  await installPublicFeed(page, 'empty');
  let activationRequest;
  let activationCsrf;
  await page.route('**/api/auth/login', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ state: 'ACTIVATION_REQUIRED', csrfToken: 'activation-csrf-token', expiresAt: '2026-08-22T01:00:00.000Z' }),
  }));
  await page.route('**/api/auth/activate', (route) => {
    activationRequest = route.request().postDataJSON();
    activationCsrf = route.request().headers()['x-csrf-token'];
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        state: 'AUTHENTICATED',
        csrfToken: 'authenticated-csrf-token',
        user: {
          accountId: 'ACC-ACTIVATED',
          displayName: 'Activated Staff Member',
          authorization: {
            active: true,
            mappingStatus: 'MAPPED',
            roleId: 'STAFF',
            capabilities: ['view.internal'],
          },
        },
      }),
    });
  });

  await page.goto('/');
  await page.getByRole('button', { name: 'Staff sign in' }).first().click();
  await page.getByLabel('Identifier').fill('starter.staff');
  await page.getByLabel('Password', { exact: true }).fill('temporary-password');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByText('Account activation required')).toBeVisible();
  await page.getByLabel('Full name').fill('Activated Staff Member');
  await page.getByLabel('Mobile number').fill('+63 917 000 0000');
  await page.getByLabel('Email address', { exact: true }).fill('activated@example.edu.ph');
  await page.getByLabel('New password').fill('ActivatedPassword1!');
  await page.getByLabel('Confirm password').fill('ActivatedPassword1!');
  await page.getByRole('button', { name: 'Activate account' }).click();

  await expect(page.getByText('Access authorized')).toBeVisible();
  expect(activationCsrf).toBe('activation-csrf-token');
  expect(activationRequest).toEqual({
    profile: { fullName: 'Activated Staff Member', mobileNumber: '+63 917 000 0000', email: 'activated@example.edu.ph' },
    password: 'ActivatedPassword1!',
    confirmPassword: 'ActivatedPassword1!',
  });
  expect(activationRequest).not.toHaveProperty('roleId');
  expect(activationRequest).not.toHaveProperty('committeeIds');
});

test('FVR-001 retains the Make landing motion and honors reduced motion', async ({ page }) => {
  await installPublicFeed(page, 'empty');
  await page.goto('/');
  await expect.poll(() => page.locator('.atrium__copy').evaluate((node) => getComputedStyle(node).animationName)).toBe('atrium-in');

  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.reload();
  await expect.poll(() => page.locator('.atrium__copy').evaluate((node) => getComputedStyle(node).animationDuration)).toBe('0.001s');
});

test('FVR-001 preserves keyboard focus, theme behavior, and 200 percent reflow', async ({ page }, testInfo) => {
  await installPublicFeed(page, 'empty');
  await page.goto('/');

  await page.keyboard.press('Tab');
  await expect(page.getByRole('link', { name: 'Skip to main content' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#main-content$/u);

  const themeToggle = page.locator('button[aria-label="Switch to dark theme"]:visible');
  await themeToggle.click();
  await expect(page.locator('html')).toHaveClass(/dark/u);
  await expect(page.locator('button[aria-label="Switch to light theme"]:visible')).toBeVisible();

  if (testInfo.project.name === 'frontend-1440') {
    await page.setViewportSize({ width: 720, height: 500 });
    await expect(page.getByRole('heading', { name: 'Every request. Every handoff. On record.' })).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  }

  await page.getByRole('button', { name: 'Staff sign in' }).first().click();
  const password = page.getByLabel('Password', { exact: true });
  const passwordToggle = page.locator('button[aria-controls="signin-pw"]');
  await password.fill('PreservedPassword1!');
  await passwordToggle.focus();
  await passwordToggle.press('Enter');
  await expect(password).toHaveAttribute('type', 'text');
  await expect(password).toHaveValue('PreservedPassword1!');
  await expect(passwordToggle).toHaveAccessibleName('Hide password');
  await expect(passwordToggle).toHaveAttribute('aria-controls', 'signin-pw');
  await expect(passwordToggle).toHaveAttribute('aria-pressed', 'true');
  await passwordToggle.press('Space');
  await expect(password).toHaveAttribute('type', 'password');
  await expect(password).toHaveValue('PreservedPassword1!');

});

test('FVR-001 public lending submits only through the real adapter and shows the confirmed receipt', async ({ page }) => {
  await installPublicFeed(page, 'empty');
  installPublicIntakeContracts(page);
  let submitted;
  await page.route('**/api/public/lending', async (route) => {
    submitted = route.request().postDataJSON();
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, submissionId: 'LBR-CONFIRMED', status: 'FOR_REVIEW', trackingCode: 'private-lending-code', submittedAt: '2026-08-22T00:00:00.000Z' }),
    });
  });
  await page.goto('/');
  await page.getByRole('button', { name: 'Browse equipment' }).click();
  await page.getByLabel('Search').fill('chair');
  await page.getByRole('button', { name: 'Request item' }).click();
  await page.getByLabel('Angelite Student').check();
  await page.getByLabel('Full name *').fill('Test Borrower');
  await page.getByLabel('Student ID *').fill('00123456');
  await page.getByLabel('Course and year *').fill('BSCE 4');
  await page.getByLabel('College, school, or academic department *').fill('School of Engineering');
  await page.getByLabel('Contact number *').fill('09171234567');
  await page.getByLabel('Email address *').fill('borrower@example.edu.ph');
  await page.getByLabel('Requested pickup date *').fill('2026-12-01');
  await page.getByLabel('Borrowing until Conditional').fill('2026-12-08');
  await page.getByLabel('Purpose *').fill('Council activity seating');
  for (const checkbox of await page.locator('form input[type="checkbox"]').all()) await checkbox.check();
  await page.getByRole('button', { name: 'Submit borrowing request for review' }).click();

  await expect(page.getByText('LBR-CONFIRMED', { exact: true })).toBeVisible();
  await expect(page.getByText('private-lending-code')).toBeVisible();
  expect(submitted.lines).toEqual([{ itemId: 'ITM-CHAIR', quantity: 1 }]);
  expect(submitted.clientRequestId).toMatch(/^frontend-/u);
});

test('FVR-001 public request and tracking project only server-confirmed state', async ({ page }) => {
  await installPublicFeed(page, 'empty');
  installPublicIntakeContracts(page);
  let submitted;
  await page.route('**/api/public/request', async (route) => {
    submitted = route.request().postDataJSON();
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, requestId: 'REQ-CONFIRMED', status: 'FOR_REVIEW', trackingCode: 'private-request-code' }) });
  });
  await page.route('**/api/public/request/track', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ ok: true, request: { id: 'REQ-CONFIRMED', status: 'FOR_REVIEW', createdAt: '2026-08-22T00:00:00.000Z', updatedAt: '2026-08-22T00:00:00.000Z', lines: [{ description: 'Printed materials', category: 'Other', quantity: 2, unit: 'set', status: 'FOR_REVIEW' }], history: [{ status: 'FOR_REVIEW', at: '2026-08-22T00:00:00.000Z' }] } }),
  }));

  await page.goto('/');
  await page.getByRole('button', { name: 'Browse equipment' }).click();
  await page.getByRole('button', { name: 'Request Center' }).click();
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Requester name *').fill('Test Requester');
  await page.getByLabel('Organization, department or office *').fill('Committee on Activities');
  await page.getByLabel('Contact number *').fill('09171234567');
  await page.getByLabel('Email address *').fill('requester@example.edu.ph');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Event purpose *').fill('Assembly materials');
  await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByLabel('Description').fill('Printed materials');
  await page.getByRole('button', { name: 'Continue' }).click();
  for (const checkbox of await page.locator('input[type="checkbox"]').all()) await checkbox.check();
  await page.getByRole('button', { name: 'Submit request for review' }).click();
  await expect(page.getByText('REQ-CONFIRMED', { exact: true })).toBeVisible();
  expect(submitted.requestPurpose).toBe('EVENT_ACTIVITY_SUPPORT');
  expect(submitted.lines[0]).toMatchObject({ category: 'Other', description: 'Printed materials', quantity: 1, unit: 'piece' });

  await page.getByRole('button', { name: 'Track a record' }).click();
  await page.getByLabel('Request or Submission ID').fill('REQ-CONFIRMED');
  await page.getByLabel('Private tracking code').fill('private-request-code');
  await page.getByRole('button', { name: 'Check status' }).click();
  await expect(page.getByText('REQ-CONFIRMED · FOR REVIEW')).toBeVisible();
  await expect(page.getByText('Printed materials')).toBeVisible();
});

test('FVR-001 account application preserves 8-digit verification and private status-token behavior', async ({ page }) => {
  await installPublicFeed(page, 'empty');
  let confirmedCode;
  let statusAuthorization;
  let withdrawalAuthorization;
  await page.route('**/api/account-applications/email/start', (route) => route.fulfill({
    status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, accepted: true, nextAttemptAt: '2026-08-22T00:01:00.000Z' }),
  }));
  await page.route('**/api/account-applications/email/confirm', (route) => {
    confirmedCode = route.request().postDataJSON().code;
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, verificationReceipt: 'verification-receipt', expiresAt: '2026-08-22T00:10:00.000Z' }) });
  });
  await page.route('**/api/account-applications', (route) => route.fulfill({
    status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, applicationCode: 'APP-CONFIRMED', state: 'PENDING_ADMIN_REVIEW', revision: 2, nextStep: 'Wait for Administrator review.', statusToken: 'private-status-token-1234567890' }),
  }));
  await page.route('**/api/account-applications/status', (route) => {
    statusAuthorization = route.request().headers().authorization;
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, applicationCode: 'APP-CONFIRMED', state: 'PENDING_ADMIN_REVIEW', revision: 2, nextStep: 'Wait for Administrator review.' }) });
  });
  await page.route('**/api/account-applications/withdraw', (route) => {
    withdrawalAuthorization = route.request().headers().authorization;
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, applicationCode: 'APP-CONFIRMED', state: 'WITHDRAWN', revision: 3, nextStep: 'No further action.' }) });
  });

  await page.goto('/');
  await page.getByRole('button', { name: 'Staff sign in' }).first().click();
  await page.getByRole('button', { name: 'Apply for staff access' }).click();
  await page.getByLabel('Approved email address').fill('applicant@example.edu.ph');
  await page.getByRole('button', { name: 'Send verification code' }).click();
  await page.getByLabel('8-digit verification code').fill('00123456');
  await page.getByRole('button', { name: 'Confirm email' }).click();
  expect(confirmedCode).toBe('00123456');
  await page.getByLabel('Full legal name').fill('Test Applicant');
  await page.getByLabel('Contact number').fill('09171234567');
  await page.getByLabel('USC department ID').fill('DEP-LOGISTICS');
  await page.getByLabel('Course ID').fill('COURSE-BSCE');
  await page.getByLabel('Year level').selectOption('4');
  await page.getByLabel('Requested username').fill('test.applicant');
  await page.getByLabel('Password', { exact: true }).fill('StrongPassword1!');
  await page.getByLabel('Confirm password').fill('StrongPassword1!');
  await page.getByText('I confirm these details').locator('input').check();
  await page.getByRole('button', { name: 'Submit application for review' }).click();
  await expect(page.getByText('APP-CONFIRMED')).toBeVisible();
  await expect(page.getByText('private-status-token-1234567890')).toBeVisible();

  await page.getByRole('tab', { name: 'Application status' }).click();
  await page.getByLabel('Private status token').fill('private-status-token-1234567890');
  await page.getByRole('button', { name: 'Check status' }).click();
  await expect(page.getByText('Wait for Administrator review.')).toBeVisible();
  expect(statusAuthorization).toBe('Bearer private-status-token-1234567890');
  await page.getByLabel('Withdrawal reason').fill('No longer required');
  await page.getByRole('button', { name: 'Withdraw application' }).click();
  await expect(page.getByText('WITHDRAWN')).toBeVisible();
  expect(withdrawalAuthorization).toBe('Bearer private-status-token-1234567890');
});

test('FVR-001 Current falls back to media-error when the image request fails', async ({ page }) => {
  await installPublicFeed(page);
  await page.route('**/media/advertisements/**', (route) => route.fulfill({
    status: 404,
    contentType: 'image/png',
    body: '',
  }));
  await page.goto('/');
  await expect(page.getByRole('article').getByText(
    'This announcement image is temporarily unavailable. You can still read the published announcement details.',
  )).toBeVisible();
});

test('FVR-001 renders the poster-only hero with no autoplay video element', async ({ page }) => {
  await installPublicFeed(page, 'empty');
  await page.goto('/');
  await expect(page.locator('.atrium__poster')).toHaveCount(1);
  await expect(page.locator('.atrium__video')).toHaveCount(0);
});
