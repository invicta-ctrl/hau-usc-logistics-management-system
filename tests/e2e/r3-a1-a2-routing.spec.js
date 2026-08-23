/* R3-A1-A2 acceptance — owner-locked three-context model.
 *
 * SUPERSEDES the R3 public-access guards that used to live in
 * `frontend-cutover.spec.js`. R3 asserted that "Start a logistics request"
 * reaches a public, no-sign-in Request Center. That was faithful to the
 * then-current authority; the owner has since corrected the product policy.
 * Those assertions are inverted here on purpose — the same controls are
 * exercised, against the opposite rule — rather than quietly dropped.
 *
 *   A. PUBLIC              Public Lending Hub, no sign-in, ever.
 *   B. AUTHENTICATED       External Request Center, eligible USC requester.
 *   C. AUTHENTICATED DOL   Main Logistics Hub, internal capability gated.
 *
 * Test IDs map to the acceptance list in the accepted amendment and to
 * `docs/frontend/ROUTING.md`.
 */

import { expect, test } from '@playwright/test';

function installPublicFeed(page) {
  return page.route('**/api/public/advertisements', (route) => route.fulfill({
    status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, items: [] }),
  }));
}

function installLendingCatalog(page) {
  return page.route('**/api/public/lending/catalog', (route) => route.fulfill({
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
}

function installSignedOutSession(page) {
  return page.route('**/api/auth/session', (route) => route.fulfill({
    status: 401,
    contentType: 'application/json',
    body: JSON.stringify({ code: 'SESSION_REQUIRED', message: 'Sign in to continue.' }),
  }));
}

/** Signs the browser in as a projected account. `capabilities` are the raw
 *  server-derived strings the Worker itself authorizes against. */
function installLogin(page, { accountId, displayName, roleId, capabilities }) {
  return page.route('**/api/auth/login', (route) => route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({
      state: 'AUTHENTICATED',
      csrfToken: `csrf-${accountId}`,
      user: {
        accountId,
        displayName,
        authorization: { active: true, mappingStatus: 'MAPPED', roleId, capabilities },
      },
    }),
  }));
}

function installRequesterPortal(page) {
  return page.route('**/api/portal/request', (route) => {
    if (route.request().method() !== 'GET') return route.fallback();
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        profile: { displayName: 'Office of the Secretary', departmentId: 'DEP-SEC' },
        eventSeries: [{ id: 'SER-1', code: 'SER-1', name: 'General Assembly' }],
        events: [{ id: 'EVT-1', seriesId: 'SER-1', name: 'Opening plenary', activityType: 'PLENARY', startsAt: '', endsAt: '', venue: 'Plenary Hall' }],
        choices: { Logistics: ['Monoblock Chairs', 'Rostrum'], Other: [] },
        units: ['piece', 'set'],
        requests: [],
      }),
    });
  });
}

/** ROLES.REQUESTER — eligible USC requester, no view.internal. */
const NON_DOL_REQUESTER = {
  accountId: 'ACC-USC-OFFICER',
  displayName: 'USC Officer',
  roleId: 'REQUESTER',
  capabilities: ['view.request', 'request.create', 'lending.create'],
};

/** ROLES.DOL_STAFF — internal operator that is also request-capable. */
const DOL_STAFF = {
  accountId: 'ACC-DOL',
  displayName: 'DOL Staff',
  roleId: 'DOL_STAFF',
  capabilities: ['view.request', 'view.internal', 'view.inventory', 'request.create', 'lending.create'],
};

/** Signed in, but holds neither request.create nor view.internal. */
const INELIGIBLE = {
  accountId: 'ACC-STUDENT',
  displayName: 'Angelite Student',
  roleId: 'REQUESTER',
  capabilities: [],
};

const HERO_HEADING = 'Every request. Every handoff. On record.';

async function openPublicLending(page) {
  await page.goto('/');
  await page.getByRole('button', { name: /^Browse public lending/u }).click();
  await expect(page.getByRole('heading', { name: 'Lending Center', exact: true })).toBeVisible();
}

async function signIn(page, identifier) {
  await page.getByLabel('Identifier').fill(identifier);
  await page.getByLabel('Password', { exact: true }).fill('service-verified-password');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
}

/* ---- LEND-01 / LEND-02 / LEND-03 ---------------------------------------- */

test('LEND-01 browsing public lending requires no sign-in and probes no session', async ({ page }) => {
  await installPublicFeed(page);
  await installLendingCatalog(page);
  let sessionProbes = 0;
  await page.route('**/api/auth/session', (route) => {
    sessionProbes += 1;
    return route.fulfill({ status: 401, contentType: 'application/json', body: JSON.stringify({ code: 'SESSION_REQUIRED', message: 'Sign in to continue.' }) });
  });

  await openPublicLending(page);

  await expect(page.getByText('Public lending — no account and no sign-in needed')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Staff sign in' })).toHaveCount(0);
  expect(sessionProbes).toBe(0);
});

test('LEND-02 the Public Lending Hub exposes no Request Center tab', async ({ page }) => {
  await installPublicFeed(page);
  await installLendingCatalog(page);
  await openPublicLending(page);

  const nav = page.getByRole('navigation', { name: 'Public lending navigation' });
  await expect(nav).toBeVisible();
  await expect(nav.getByRole('button', { name: 'Request Center' })).toHaveCount(0);
  for (const tab of ['Home', 'Lending Center', 'Track lending', 'Lending policy', 'Staff sign in']) {
    await expect(nav.getByRole('button', { name: tab, exact: true })).toBeVisible();
  }
});

test('LEND-03 no public-request or public-front-door copy survives on the lending hub', async ({ page }) => {
  await installPublicFeed(page);
  await installLendingCatalog(page);
  await openPublicLending(page);

  const body = await page.locator('body').innerText();
  expect(body).not.toMatch(/PUBLIC REQUEST/iu);
  expect(body).not.toMatch(/public front door/iu);
  // The no-sign-in promise may remain, but only where it is true: lending.
  expect(body).toMatch(/Public lending — no account and no sign-in needed/u);
});

/* ---- REQ-01 .. REQ-05 --------------------------------------------------- */

test('REQ-01 starting a logistics request while signed out reaches Staff Sign In', async ({ page }) => {
  await installPublicFeed(page);
  await installSignedOutSession(page);

  await page.goto('/');
  await page.getByRole('button', { name: /^Start a logistics request/u }).first().click();

  await expect(page.getByRole('heading', { name: 'Sign in to continue' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'External Request Center', level: 1 })).toHaveCount(0);
});

test('REQ-02 external intent survives auth and REQ-03 an eligible non-DOL account lands in the External Request Center', async ({ page }) => {
  await installPublicFeed(page);
  await installSignedOutSession(page);
  await installRequesterPortal(page);
  await installLogin(page, NON_DOL_REQUESTER);

  await page.goto('/');
  await page.getByRole('button', { name: /^Start a logistics request/u }).first().click();
  // The gateway names the destination the user actually asked for.
  await expect(page.getByText('the External Request Center')).toBeVisible();

  await signIn(page, 'usc.officer');

  await expect(page.getByRole('heading', { name: 'External Request Center', level: 1 })).toBeVisible();
  // CTX-01: context B holds no DOL operational controls.
  await expect(page.getByRole('button', { name: 'Open Logistics Hub' })).toHaveCount(0);
  await expect(page.getByText('Requester view')).toHaveCount(0);
});

test('REQ-04 DOL staff entering through external intent stay in requester mode and are offered Open Logistics Hub', async ({ page }) => {
  await installPublicFeed(page);
  await installSignedOutSession(page);
  await installRequesterPortal(page);
  await installLogin(page, DOL_STAFF);

  await page.goto('/');
  await page.getByRole('button', { name: /^Start a logistics request/u }).first().click();
  await signIn(page, 'dol.staff');

  // Explicit intent wins over capability-based default routing.
  await expect(page.getByRole('heading', { name: 'External Request Center', level: 1 })).toBeVisible();
  await expect(page.getByText('Requester view')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Open Logistics Hub' })).toBeVisible();
});

test('REQ-05 an ineligible identity cannot reach the External Request Center and is offered a safe recovery', async ({ page }) => {
  await installPublicFeed(page);
  await installSignedOutSession(page);
  await installLogin(page, INELIGIBLE);

  await page.goto('/');
  await page.getByRole('button', { name: /^Start a logistics request/u }).first().click();
  await signIn(page, 'student.account');

  await expect(page.getByText('Not available for this account')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'External Request Center', level: 1 })).toHaveCount(0);
  // Truthful denial: no enumeration, and a way out.
  await expect(page.getByText(/Public Lending remains open to you/u)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Home', exact: true }).first()).toBeVisible();
});

test('REQ-06 submission goes to the authenticated portal contract and carries no browser-supplied requester identity', async ({ page }) => {
  await installPublicFeed(page);
  await installSignedOutSession(page);
  await installRequesterPortal(page);
  await installLogin(page, NON_DOL_REQUESTER);

  let submitted = null;
  let submittedTo = '';
  await page.route('**/api/portal/request', async (route) => {
    if (route.request().method() !== 'POST') return route.fallback();
    submitted = route.request().postDataJSON();
    submittedTo = new URL(route.request().url()).pathname;
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true, requestId: 'REQ-PORTAL-1', requestType: 'NEW', parentRequestId: '',
        department: 'Office of the Secretary', event: 'General Assembly', subEvent: 'Opening plenary',
        status: 'FOR_REVIEW', submittedAt: '2026-08-23T00:00:00.000Z', replayed: false,
      }),
    });
  });

  // The superseded public endpoint must not be touched at all.
  let publicRequestCalls = 0;
  await page.route('**/api/public/request', (route) => {
    publicRequestCalls += 1;
    return route.fulfill({ status: 410, contentType: 'application/json', body: '{"code":"GONE"}' });
  });

  await page.goto('/');
  await page.getByRole('button', { name: /^Start a logistics request/u }).first().click();
  await signIn(page, 'usc.officer');
  await expect(page.getByRole('heading', { name: 'External Request Center', level: 1 })).toBeVisible();

  await page.getByRole('button', { name: 'New request' }).click();
  // Targeted by computed accessible name, which is what a screen reader hears.
  await page.getByRole('combobox', { name: 'Event series' }).selectOption('SER-1');
  await page.getByRole('combobox', { name: 'Event or sub-event' }).selectOption('EVT-1');
  await page.getByRole('textbox', { name: 'Purpose' }).fill('Chairs and a rostrum for the opening plenary.');
  await page.getByRole('combobox', { name: 'Category' }).selectOption('Logistics');
  await page.getByRole('combobox', { name: 'Item', exact: true }).selectOption('Monoblock Chairs');
  await page.getByRole('spinbutton', { name: 'Quantity' }).fill('24');

  for (const checkbox of await page.locator('input[type="checkbox"]').all()) await checkbox.check();
  await page.getByRole('button', { name: 'Submit request' }).click();

  await expect(page.getByText('REQ-PORTAL-1', { exact: true })).toBeVisible();
  // The outcome is announced, not only drawn.
  await expect(page.locator('[role="status"][aria-live="polite"]').first())
    .toContainText('Request submitted. Record REQ-PORTAL-1.');
  expect(submittedTo).toBe('/api/portal/request');
  expect(publicRequestCalls).toBe(0);

  // Requester identity is the server's business. The browser sends none of it —
  // this is what makes the boundary real rather than a login screen in front of
  // an anonymous endpoint.
  for (const forbidden of ['requesterName', 'requesterType', 'organization', 'contactNumber', 'email']) {
    expect(submitted).not.toHaveProperty(forbidden);
  }
  expect(submitted).toMatchObject({ requestType: 'NEW', eventSeriesId: 'SER-1', eventId: 'EVT-1' });
  expect(submitted.lines[0]).toMatchObject({ category: 'Logistics', description: 'Monoblock Chairs', quantity: 24, unit: 'piece' });
  expect(String(submitted.clientRequestId)).toMatch(/^frontend-/u);
});

/* ---- AUTH-01 / AUTH-02 -------------------------------------------------- */

test('AUTH-01 generic staff sign-in sends a DOL account to its capability-appropriate Main Logistics Hub home', async ({ page }) => {
  await installPublicFeed(page);
  await installLogin(page, DOL_STAFF);

  await page.goto('/');
  await page.getByRole('button', { name: 'Staff sign in' }).first().click();
  await signIn(page, 'dol.staff');

  await expect(page.getByText('Access authorized')).toBeVisible();
  // Named honestly: FI-04 is not implemented, so the workspace does not render.
  await expect(page.getByText(/Operations overview/u)).toBeVisible();
  await expect(page.getByText('Not available for this account')).toHaveCount(0);
});

test('AUTH-02 generic staff sign-in sends an eligible non-DOL account to the External Request Center', async ({ page }) => {
  await installPublicFeed(page);
  await installRequesterPortal(page);
  await installLogin(page, NON_DOL_REQUESTER);

  await page.goto('/');
  await page.getByRole('button', { name: 'Staff sign in' }).first().click();
  await signIn(page, 'usc.officer');

  await expect(page.getByRole('heading', { name: 'External Request Center', level: 1 })).toBeVisible();
});

/* ---- AUTH-03 / AUTH-04 / AUTH-05 ---------------------------------------- */

test('AUTH-03 and AUTH-04 the activation and password-reset paths are reachable from Staff Sign In', async ({ page }) => {
  await installPublicFeed(page);
  await page.goto('/');
  await page.getByRole('button', { name: 'Staff sign in' }).first().click();

  await expect(page.getByRole('button', { name: 'No password yet? Activate account' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Forgot password?' })).toBeVisible();
  // Activation and application are distinct operations; both stay visible.
  await expect(page.getByRole('button', { name: 'Apply for staff access' })).toBeVisible();

  await page.getByRole('button', { name: 'No password yet? Activate account' }).click();
  await expect(page.getByRole('heading', { name: 'Activate your account' })).toBeVisible();
  await page.getByRole('button', { name: 'Back to sign in' }).click();

  await page.getByRole('button', { name: 'Forgot password?' }).click();
  await expect(page.getByRole('heading', { name: 'Reset your password' })).toBeVisible();
});

test('AUTH-05 the verification step enforces 8 digits and never enumerates accounts', async ({ page }) => {
  await installPublicFeed(page);
  await page.route('**/api/auth/reset/start', (route) => route.fulfill({
    status: 200, contentType: 'application/json',
    body: JSON.stringify({ ok: true, accepted: true, resendAvailableInSeconds: 60 }),
  }));
  await page.route('**/api/auth/reset/verify', (route) => route.fulfill({
    status: 422, contentType: 'application/json',
    body: JSON.stringify({ code: 'VERIFICATION_INVALID', message: 'That code is not correct.' }),
  }));

  await page.goto('/');
  await page.getByRole('button', { name: 'Staff sign in' }).first().click();
  await page.getByRole('button', { name: 'Forgot password?' }).click();
  await page.getByLabel('Registered identifier or email').fill('someone@example.test');
  await page.getByRole('button', { name: 'Send verification code' }).click();

  // Generic confirmation: identical whether or not the account exists.
  await expect(page.getByText('If this account exists, a verification code has been sent to its registered email.')).toBeVisible();

  const codeField = page.getByLabel('8-digit verification code');
  await expect(codeField).toHaveAttribute('inputmode', 'numeric');
  await expect(codeField).toHaveAttribute('maxlength', '8');
  await expect(codeField).toHaveAttribute('autocomplete', 'one-time-code');

  // Two layers, in this order: `maxlength` caps the raw input at 8 characters,
  // then the change handler strips everything that is not a digit. So a mixed
  // 10-character paste lands as the digits within its first 8 characters.
  await codeField.fill('12ab34cd56');
  await expect(codeField).toHaveValue('1234');
  await expect(page.getByRole('button', { name: 'Verify code' })).toBeDisabled();

  // A leading zero is preserved rather than eaten.
  await codeField.fill('00000001');
  await expect(codeField).toHaveValue('00000001');

  await codeField.fill('01234567');
  await expect(page.getByRole('button', { name: 'Verify code' })).toBeEnabled();
  await page.getByRole('button', { name: 'Verify code' }).click();

  // Failure is announced in words, not by colour alone, and focus returns to the field.
  await expect(page.getByRole('alert')).toContainText('That code is not correct.');
  await expect(codeField).toHaveAttribute('aria-invalid', 'true');
  await expect(codeField).toBeFocused();
});

/* ---- HOME-01 .. HOME-03 / AUTH-06 --------------------------------------- */

test('HOME-01 and HOME-02 Home returns to the landing surface from Public Lending', async ({ page }) => {
  await installPublicFeed(page);
  await installLendingCatalog(page);
  await openPublicLending(page);

  await page.locator('.mast').getByRole('button', { name: 'Home', exact: true }).click();
  await expect(page.getByRole('heading', { name: HERO_HEADING })).toBeVisible();

  await page.getByRole('button', { name: /^Browse public lending/u }).click();
  await page.getByRole('navigation', { name: 'Public lending navigation' })
    .getByRole('button', { name: 'Home', exact: true }).click();
  await expect(page.getByRole('heading', { name: HERO_HEADING })).toBeVisible();
});

test('HOME-03 and AUTH-06 Home preserves the session — Home is not sign-out', async ({ page }) => {
  await installPublicFeed(page);
  await installRequesterPortal(page);
  await installLogin(page, NON_DOL_REQUESTER);
  let logouts = 0;
  await page.route('**/api/auth/logout', (route) => {
    logouts += 1;
    return route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
  });

  await page.goto('/');
  await page.getByRole('button', { name: 'Staff sign in' }).first().click();
  await signIn(page, 'usc.officer');
  await expect(page.getByRole('heading', { name: 'External Request Center', level: 1 })).toBeVisible();

  await page.getByRole('button', { name: 'Home', exact: true }).first().click();
  await expect(page.getByRole('heading', { name: HERO_HEADING })).toBeVisible();
  expect(logouts).toBe(0);

  // Still authenticated: re-entering the request intent does not re-prompt for credentials.
  await page.getByRole('button', { name: /^Start a logistics request/u }).first().click();
  await expect(page.getByRole('heading', { name: 'External Request Center', level: 1 })).toBeVisible();
  await expect(page.getByLabel('Identifier')).toHaveCount(0);
});

/* ---- CTX-02 ------------------------------------------------------------- */

test('CTX-02 every public surface states the staff gate before the user commits', async ({ page }, testInfo) => {
  await installPublicFeed(page);
  await installSignedOutSession(page);
  await page.goto('/');

  await expect(page.getByText('USC staff sign-in required').first()).toBeVisible();
  const hubTile = page.getByRole('button', { name: /^Start a request/u }).first();
  await expect(hubTile).toContainText('Staff sign-in required');

  if (testInfo.project.name === 'frontend-320' || testInfo.project.name === 'frontend-390') {
    await page.getByRole('button', { name: 'Open navigation menu' }).click();
    const drawer = page.getByRole('dialog', { name: 'Navigation menu' });
    await drawer.getByRole('button', { name: 'Start a logistics request', exact: true }).click();
    await expect(page.getByRole('heading', { name: /Sign in/u }).first()).toBeVisible();
  }
});
