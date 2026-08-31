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
  return page.route('**/api/public/advertisements', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, items: [] }),
    }),
  );
}

function installLendingCatalog(page) {
  return page.route('**/api/public/lending/catalog', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        uscDepartments: ['Department of Logistics'],
        items: [
          {
            id: 'ITM-CHAIR',
            productId: 'ITM-CHAIR',
            name: 'Folding chair',
            aliases: ['chair'],
            category: 'Furniture',
            type: 'REUSABLE',
            availability: 'AVAILABLE',
            unit: 'piece',
            maximumQuantity: 4,
            defaultLoanDays: 7,
            dueDateRequired: true,
            acknowledgmentRequired: false,
            eligibility: '',
            handlingNotes: '',
            description: 'Governed chair.',
            restrictions: '',
            imageUrl: '',
            conditionTracked: true,
          },
        ],
      }),
    }),
  );
}

function installSignedOutSession(page) {
  return page.route('**/api/auth/session', (route) =>
    route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ code: 'SESSION_REQUIRED', message: 'Sign in to continue.' }),
    }),
  );
}

/** Signs the browser in as a projected account. `capabilities` are the raw
 *  server-derived strings the Worker itself authorizes against. */
function installLogin(page, { accountId, displayName, roleId, capabilities }) {
  return Promise.all([
    page.route('**/api/auth/login', (route) =>
      route.fulfill({
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
      }),
    ),
    page.route('**/api/me/appearance', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ok: true,
          appearance: { family: 'HAU_INSTITUTIONAL', mode: 'SYSTEM' },
        }),
      }),
    ),
  ]);
}

function profileFixture() {
  return {
    ok: true,
    profile: {
      displayName: 'DOL Profile',
      legalName: 'Department of Logistics Profile',
      verifiedEmail: 'profile@example.test',
      username: 'dol.profile',
      contactNumber: '+63 917 000 0000',
      affiliation: {
        institutionId: 'USC',
        departmentId: 'DOL',
        departmentDisplayName: 'Department of Logistics',
        courseId: '',
        yearLevel: '',
      },
      roleId: 'DOL_STAFF',
      committeeIds: ['COM-1'],
      accountCode: 'ACC-DOL-1',
      accessSummary: {
        roleId: 'DOL_STAFF',
        roleLabel: 'DOL Staff',
        committeeIds: ['COM-1'],
        capabilities: ['view.internal', 'view.inventory', 'view.request'],
        workspaceIds: ['WORKSPACE-DOL'],
        defaultWorkspaceId: 'WORKSPACE-DOL',
        scopeMode: 'ASSIGNED',
      },
      revision: '2026-08-24T00:00:00.000Z',
      credentialVersion: 3,
      updatedAt: '2026-08-24T00:00:00.000Z',
      avatar: { available: false, initials: 'DP', fallback: 'INITIALS', url: '', updatedAt: '' },
      appearance: { family: 'HAU_INSTITUTIONAL', mode: 'SYSTEM' },
    },
  };
}

function installProfile(page, { delay = 0, status = 200, body = profileFixture() } = {}) {
  return page.route('**/api/me/profile', async (route) => {
    if (delay) await new Promise((resolve) => setTimeout(resolve, delay));
    return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
  });
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
        events: [
          {
            id: 'EVT-1',
            seriesId: 'SER-1',
            name: 'Opening plenary',
            activityType: 'PLENARY',
            startsAt: '',
            endsAt: '',
            venue: 'Plenary Hall',
          },
        ],
        choices: { Logistics: ['Monoblock Chairs', 'Rostrum'], Other: [] },
        units: ['piece', 'set'],
        requests: [],
      }),
    });
  });
}

function installInventoryBootstrap(page, { status = 200, body } = {}) {
  const payload = body ?? {
    ok: true,
    contract: 'bootstrap-module',
    contractVersion: 2,
    requestOnly: false,
    module: 'inventory',
    scopeRevision: { token: 'inventory-r1', updatedAt: '2026-08-24T00:00:00.000Z' },
    pagination: { page: 1, pageSize: 25, total: 1, hasMore: false },
    data: {
      inventoryItems: [
        {
          id: 'ITM-REAL-1',
          name: 'Authoritative folding chair',
          category: 'Venue',
          unit: 'piece',
          onHand: 24,
          reserved: 6,
          availableToPromise: 18,
          reorderThreshold: 4,
          lowStockState: 'NORMAL',
          isLendable: true,
          lendingStatus: 'ACTIVE',
          inventoryKind: 'REUSABLE',
          classificationStatus: 'CLASSIFIED',
          conditionReviewState: 'ASSESSED',
          maintenanceReviewState: 'CURRENT',
          updatedAt: '2026-08-24T00:00:00.000Z',
          classificationHistory: [],
        },
      ],
      ledgerTransactions: [
        {
          id: 'TXN-REAL-1',
          type: 'OPENING_BALANCE',
          direction: 'IN',
          itemId: 'ITM-REAL-1',
          quantity: 24,
          signedQuantity: 24,
          unit: 'piece',
          relatedEntityType: 'INVENTORY_ITEM',
          relatedId: 'ITM-REAL-1',
          status: 'POSTED',
          notes: '',
          createdAt: '2026-08-24T00:00:00.000Z',
        },
      ],
      reservations: [],
      inventoryAssets: [],
      assetMaintenanceHistory: [],
      assetMovementHistory: [],
    },
  };
  return page.route('**/api/bootstrap/inventory?**', (route) =>
    route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(payload) }),
  );
}

function requestBootstrapFixture({
  requests,
  requestLines,
  eventSeries,
  eventDays,
  events,
  inventoryItems,
  pagination,
  scopeRevision,
} = {}) {
  const timestamp = '2026-08-24T00:00:00.000Z';
  return {
    ok: true,
    contract: 'bootstrap-module',
    module: 'request',
    contractVersion: 2,
    requestOnly: false,
    scopeRevision: scopeRevision ?? { token: 'request-r1', updatedAt: timestamp },
    pagination: pagination ?? { page: 1, pageSize: 25, total: 1, hasMore: false },
    data: {
      requests: requests ?? [
        {
          id: 'REQ-REAL-1',
          type: 'STANDARD',
          stage: 'REVIEW',
          parentRequestId: '',
          eventSeriesId: 'SERIES-REAL-1',
          eventDayId: 'DAY-REAL-1',
          eventId: 'EVENT-REAL-1',
          ownerCommitteeId: 'COM-1',
          catalogType: 'OFFICE_INVENTORY',
          department: 'DOL',
          requesterName: 'Authoritative requester',
          purpose: 'Authoritative event support',
          status: 'FOR_REVIEW',
          priority: 'URGENT',
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      ],
      requestLines: requestLines ?? [
        {
          id: 'LINE-REAL-1',
          requestId: 'REQ-REAL-1',
          eventId: 'EVENT-REAL-1',
          itemId: 'ITM-REAL-1',
          description: 'Authoritative chair',
          specification: 'Authoritative fixture only',
          category: 'Equipment',
          quantity: 4,
          unit: 'piece',
          fulfillmentSource: '',
          neededAt: '2026-08-30T09:00:00.000Z',
          returnDue: '',
          releasedQuantity: 0,
          receivedQuantity: 0,
          status: 'FOR_REVIEW',
          workflowRevision: 1,
          createdAt: timestamp,
          updatedAt: timestamp,
        },
      ],
      eventSeries: eventSeries ?? [
        { id: 'SERIES-REAL-1', code: 'REAL-1', name: 'Authoritative series', status: 'ACTIVE' },
      ],
      eventDays: eventDays ?? [
        {
          id: 'DAY-REAL-1',
          seriesId: 'SERIES-REAL-1',
          name: 'Authoritative event day',
          date: '2026-08-30',
          status: 'ACTIVE',
        },
      ],
      events: events ?? [
        {
          id: 'EVENT-REAL-1',
          seriesId: 'SERIES-REAL-1',
          name: 'Authoritative event',
          startAt: '2026-08-30T09:00:00.000Z',
          endAt: '2026-08-30T12:00:00.000Z',
          eventDayId: 'DAY-REAL-1',
          activityType: 'ASSEMBLY',
          timeStatus: 'SCHEDULED',
          venue: 'Authoritative venue',
          status: 'ACTIVE',
        },
      ],
      inventoryItems: inventoryItems ?? [
        {
          id: 'ITM-REAL-1',
          name: 'Authoritative folding chair',
          category: 'Equipment',
          unit: 'piece',
          status: 'ACTIVE',
          catalogType: 'OFFICE_INVENTORY',
        },
      ],
    },
  };
}

function installRequestBootstrap(page, { status = 200, body, onRequest } = {}) {
  return page.route('**/api/bootstrap/request**', (route) => {
    onRequest?.(route.request());
    return route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(body ?? requestBootstrapFixture()),
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
  capabilities: [
    'view.request',
    'view.internal',
    'view.inventory',
    'request.create',
    'request.review',
    'lending.create',
  ],
};

/** DOL may inspect the request queue without the review mutation capability. */
const DOL_READ_ONLY = {
  accountId: 'ACC-DOL-READ-ONLY',
  displayName: 'DOL Read Only',
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

const HERO_HEADING = 'Logistics services and records';

async function openPublicLending(page) {
  await page.goto('/');
  await page.getByRole('link', { name: /^Browse public lending/u }).click();
  await expect(page.getByRole('heading', { name: 'Lending Center', exact: true })).toBeVisible();
}

async function signIn(page, identifier) {
  await page.getByLabel('Identifier').fill(identifier);
  await page.getByLabel('Password', { exact: true }).fill('service-verified-password');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
}

function usesMobileShell(testInfo) {
  return ['frontend-320', 'frontend-390', 'frontend-768'].includes(testInfo.project.name);
}

function usesMobileInventoryLayout(testInfo) {
  return ['frontend-320', 'frontend-390', 'frontend-768'].includes(testInfo.project.name);
}

function usesMobileRequestLayout(testInfo) {
  return ['frontend-320', 'frontend-390', 'frontend-768'].includes(testInfo.project.name);
}

async function workspaceSurface(page, testInfo) {
  if (!usesMobileShell(testInfo)) return page;
  await page.getByRole('button', { name: 'Open navigation' }).click();
  const drawer = page.getByRole('dialog', { name: 'Workspace navigation' });
  await expect(drawer).toBeVisible();
  return drawer;
}

async function openInternalRequestHub(page, testInfo, { waitForQueue = true } = {}) {
  await page.goto('/');
  await page.getByRole('link', { name: 'Staff sign in' }).first().click();
  await signIn(page, 'dol.staff');
  await (await workspaceSurface(page, testInfo)).getByRole('link', { name: 'Internal Request Hub' }).click();
  if (waitForQueue) await expect(page.getByRole('heading', { name: 'Request review queue' })).toBeVisible();
}

function requestRecordButton(page, purpose) {
  return page.locator('[aria-label="Request queue"] button:visible').filter({ hasText: purpose });
}

async function openRequestRecord(page, purpose = 'Authoritative event support') {
  const requestRecord = requestRecordButton(page, purpose);
  await expect(requestRecord).toHaveCount(1);
  await requestRecord.click();
  const inspector = page.locator('[data-request-inspector]');
  await expect(inspector).toBeVisible();
  return inspector;
}

/* ---- LEND-01 / LEND-02 / LEND-03 ---------------------------------------- */

test('LEND-01 browsing public lending requires no sign-in and probes no session', async ({ page }) => {
  await installPublicFeed(page);
  await installLendingCatalog(page);
  let sessionProbes = 0;
  await page.route('**/api/auth/session', (route) => {
    sessionProbes += 1;
    return route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ code: 'SESSION_REQUIRED', message: 'Sign in to continue.' }),
    });
  });

  await openPublicLending(page);

  await expect(page.getByText('Public lending — no account and no sign-in needed')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Staff sign in' })).toHaveCount(0);
  expect(sessionProbes).toBe(0);
});

test('LEND-02 the Public Lending Hub keeps site exits in one public shell', async ({ page }, testInfo) => {
  await installPublicFeed(page);
  await installLendingCatalog(page);
  await openPublicLending(page);

  const nav = page.getByRole('navigation', { name: 'Public lending navigation' });
  await expect(nav).toBeVisible();
  await expect(nav.getByText('Request Center', { exact: true })).toHaveCount(0);
  for (const tab of ['Lending Center', 'Track lending', 'Lending policy']) {
    await expect(nav.getByRole('button', { name: tab, exact: true })).toBeVisible();
  }
  await expect(nav.getByRole('link')).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'HAU-USC home', exact: true })).toHaveCount(1);
  if (usesMobileShell(testInfo)) {
    await page.getByRole('button', { name: 'Open navigation menu' }).click();
    await expect(
      page.getByRole('dialog', { name: 'Navigation menu' }).getByRole('link', { name: 'Staff sign in' }),
    ).toBeVisible();
  } else {
    await expect(page.getByRole('link', { name: 'Staff sign in', exact: true })).toBeVisible();
  }
});

test('LEND-02A hash navigation remounts the correct public lending view', async ({ page }) => {
  await installPublicFeed(page);
  await installLendingCatalog(page);
  await openPublicLending(page);

  await page.evaluate(() => {
    window.location.hash = '#/route/tracking';
  });
  await expect(page.getByRole('heading', { name: 'Track lending', exact: true })).toBeVisible();
  await expect(page.getByLabel('Request or Submission ID')).toBeVisible();

  await page.evaluate(() => {
    window.location.hash = '#/route/borrow';
  });
  await expect(page.getByRole('heading', { name: 'Lending Center', exact: true })).toBeVisible();
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
  await page
    .getByRole('link', { name: /^Start a logistics request/u })
    .first()
    .click();

  await expect(page.getByRole('heading', { name: 'Sign in to continue' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'External Request Center', level: 1 })).toHaveCount(0);
});

test('REQ-02 external intent survives auth and REQ-03 an eligible non-DOL account lands in the External Request Center', async ({
  page,
}) => {
  await installPublicFeed(page);
  await installSignedOutSession(page);
  await installRequesterPortal(page);
  await installLogin(page, NON_DOL_REQUESTER);

  await page.goto('/');
  await page
    .getByRole('link', { name: /^Start a logistics request/u })
    .first()
    .click();
  // The gateway names the destination the user actually asked for.
  await expect(page.getByText('the External Request Center')).toBeVisible();

  await signIn(page, 'usc.officer');

  await expect(page.getByRole('heading', { name: 'External Request Center', level: 1 })).toBeVisible();
  // CTX-01: context B holds no DOL operational controls.
  await expect(page.getByRole('button', { name: 'Open Logistics Hub' })).toHaveCount(0);
  await expect(page.getByText('Requester view')).toHaveCount(0);
});

test('REQ-04 DOL staff entering through external intent stay in requester mode and are offered Open Logistics Hub', async ({
  page,
}) => {
  await installPublicFeed(page);
  await installSignedOutSession(page);
  await installRequesterPortal(page);
  await installLogin(page, DOL_STAFF);

  await page.goto('/');
  await page
    .getByRole('link', { name: /^Start a logistics request/u })
    .first()
    .click();
  await signIn(page, 'dol.staff');

  // Explicit intent wins over capability-based default routing.
  await expect(page.getByRole('heading', { name: 'External Request Center', level: 1 })).toBeVisible();
  await expect(page.getByText('Requester view')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Open Logistics Hub' })).toBeVisible();
});

test('REQ-05 an ineligible identity cannot reach the External Request Center and is offered a safe recovery', async ({
  page,
}) => {
  await installPublicFeed(page);
  await installSignedOutSession(page);
  await installLogin(page, INELIGIBLE);

  await page.goto('/');
  await page
    .getByRole('link', { name: /^Start a logistics request/u })
    .first()
    .click();
  await signIn(page, 'student.account');

  await expect(page.getByText('Not available for this account')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'External Request Center', level: 1 })).toHaveCount(0);
  // Truthful denial: no enumeration, and a way out.
  await expect(page.getByText(/Public Lending remains open to you/u)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Home', exact: true }).first()).toBeVisible();
});

test('REQ-06 submission goes to the authenticated portal contract and carries no browser-supplied requester identity', async ({
  page,
}) => {
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
        ok: true,
        requestId: 'REQ-PORTAL-1',
        requestType: 'NEW',
        parentRequestId: '',
        department: 'Office of the Secretary',
        event: 'General Assembly',
        subEvent: 'Opening plenary',
        status: 'FOR_REVIEW',
        submittedAt: '2026-08-23T00:00:00.000Z',
        replayed: false,
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
  await page
    .getByRole('link', { name: /^Start a logistics request/u })
    .first()
    .click();
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
  await expect(page.locator('[role="status"][aria-live="polite"]').first()).toContainText(
    'Request submitted. Record REQ-PORTAL-1.',
  );
  expect(submittedTo).toBe('/api/portal/request');
  expect(publicRequestCalls).toBe(0);

  // Requester identity is the server's business. The browser sends none of it —
  // this is what makes the boundary real rather than a login screen in front of
  // an anonymous endpoint.
  for (const forbidden of ['requesterName', 'requesterType', 'organization', 'contactNumber', 'email']) {
    expect(submitted).not.toHaveProperty(forbidden);
  }
  expect(submitted).toMatchObject({ requestType: 'NEW', eventSeriesId: 'SER-1', eventId: 'EVT-1' });
  expect(submitted.lines[0]).toMatchObject({
    category: 'Logistics',
    description: 'Monoblock Chairs',
    quantity: 24,
    unit: 'piece',
  });
  expect(String(submitted.clientRequestId)).toMatch(/^frontend-/u);
});

/* ---- AUTH-01 / AUTH-02 -------------------------------------------------- */

test('AUTH-01 generic staff sign-in sends a DOL account to its capability-appropriate Main Logistics Hub home', async ({
  page,
}, testInfo) => {
  await installPublicFeed(page);
  await installLogin(page, DOL_STAFF);
  await installInventoryBootstrap(page);

  await page.goto('/');
  await page.getByRole('link', { name: 'Staff sign in' }).first().click();
  await signIn(page, 'dol.staff');

  await expect(page.getByRole('banner', { name: 'Workspace command bar' })).toBeVisible();
  if (['frontend-1024', 'frontend-1440'].includes(testInfo.project.name)) {
    await expect(page.getByRole('button', { name: 'Open navigation' })).toBeVisible();
  }
  if (testInfo.project.name === 'frontend-1024') {
    const rail = page.getByRole('complementary', { name: 'Workspace navigation' });
    await expect(rail).toBeVisible();
    expect(await rail.evaluate((element) => Math.round(element.getBoundingClientRect().width))).toBe(76);
    await expect(page.locator('[data-command-search]')).toBeVisible();
    await expect(page.locator('[data-theme-control]')).toBeVisible();
    await expect(page.locator('[data-navigate-surface="light-oxblood"]')).toBeVisible();
  }
  if (testInfo.project.name === 'frontend-1440') {
    const rail = page.getByRole('complementary', { name: 'Workspace navigation' });
    await expect(rail).toBeVisible();
    expect(await rail.evaluate((element) => Math.round(element.getBoundingClientRect().width))).toBe(272);
    await expect(page.locator('[data-command-surface="light-paper"]')).toBeVisible();
  }
  const surface = await workspaceSurface(page, testInfo);
  const operations = surface.getByRole('navigation', { name: 'Operations' });
  await expect(operations.getByRole('link', { name: 'Overview' })).toBeVisible();
  // Only the server-projected capability routes appear. The older gateway must
  // not remain mounted once the FI-04 shell owns the resolved route.
  await expect(operations.getByRole('link', { name: 'Release' })).toHaveCount(0);
  const administration = surface.getByRole('navigation', { name: 'Administration' });
  // Profile is already part of the authenticated server projection; that alone
  // may keep the group visible. The privileged Administration route must not.
  await expect(administration.getByRole('link', { name: 'Profile' })).toBeVisible();
  await expect(administration.getByRole('link', { name: 'Administration' })).toHaveCount(0);
  await expect(page.getByText('Access authorized')).toHaveCount(0);
  await expect(page.getByText('Not available for this account')).toHaveCount(0);

  await operations.getByRole('link', { name: 'Inventory' }).click();
  await expect(page.getByRole('heading', { name: 'Inventory', exact: true })).toBeVisible();
  await expect(page.getByText('Inventory records')).toBeVisible();
  const inventoryRecord = usesMobileInventoryLayout(testInfo)
    ? page.getByRole('button', { name: 'Open item record' })
    : page.getByRole('button', { name: /Authoritative folding chair/u });
  await expect(inventoryRecord).toBeVisible();
  await expect(page.getByText('This workspace route is reserved and has not yet been built.')).toHaveCount(0);
});

test('FI-06 Internal Request Hub reads the scoped bootstrap, submits explicit routes, and refetches', async ({
  page,
}, testInfo) => {
  await installPublicFeed(page);
  await installLogin(page, DOL_STAFF);
  let bootstrapReads = 0;
  await installRequestBootstrap(page, { onRequest: () => (bootstrapReads += 1) });
  let reviews = 0;
  await page.route('**/api/reviewRequest', (route) => {
    reviews += 1;
    expect(route.request().headers()['x-csrf-token']).toContain('csrf-');
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ requestId: 'REQ-REAL-1', status: 'ACCEPTED' }),
    });
  });
  await openInternalRequestHub(page, testInfo);
  const dialog = await openRequestRecord(page);
  await dialog.getByLabel('Route Authoritative chair').selectOption('ISSUE_FROM_STOCK');
  await expect(dialog.getByRole('heading', { name: 'Review consequence' })).toBeVisible();
  await expect(dialog.getByText('Ready to reserve', { exact: true })).toBeVisible();
  await expect(dialog.getByText(/does not reserve or release stock/u)).toBeVisible();
  await dialog.getByRole('button', { name: 'Record request review' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Request review recorded' })).toBeVisible();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await expect.poll(() => bootstrapReads).toBeGreaterThanOrEqual(2);
  expect(reviews).toBe(1);
});

test('FI-06 prevents duplicate review writes and keys retries from the exact command', async ({
  page,
}, testInfo) => {
  await installPublicFeed(page);
  await installLogin(page, DOL_STAFF);
  await installRequestBootstrap(page);
  const commands = [];
  let attempt = 0;
  await page.route('**/api/reviewRequest', (route) => {
    commands.push(JSON.parse(route.request().postData() ?? '{}'));
    attempt += 1;
    if (attempt === 1) {
      return route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ code: 'SERVICE_UNAVAILABLE', message: 'Review service is unavailable.' }),
      });
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        requestId: 'REQ-REAL-1',
        status: 'ACCEPTED',
        correlationId: `review-${attempt}`,
      }),
    });
  });

  await openInternalRequestHub(page, testInfo);
  let dialog = await openRequestRecord(page);
  await dialog.getByLabel('Route Authoritative chair').selectOption('ISSUE_FROM_STOCK');
  const recordReview = dialog.getByRole('button', { name: 'Record request review' });
  await recordReview.evaluate((element) => {
    element.click();
    element.click();
  });
  await expect.poll(() => commands.length).toBe(1);
  await expect(page.getByRole('alert').filter({ hasText: 'Review was not recorded' })).toBeVisible();
  await expect(page.getByText('Request review recorded')).toHaveCount(0);

  await recordReview.click();
  await expect.poll(() => commands.length).toBe(2);
  expect(commands[1].clientRequestId).toBe(commands[0].clientRequestId);
  await expect(page.getByRole('status').filter({ hasText: 'Request review recorded' })).toBeVisible();
  await expect(page.locator('[data-fi06-state="ready"]')).toBeVisible();

  dialog = await openRequestRecord(page);
  await dialog.getByLabel('Route Authoritative chair').selectOption('PROCUREMENT');
  await dialog.getByRole('button', { name: 'Record request review' }).click();
  await expect.poll(() => commands.length).toBe(3);
  expect(commands[2].clientRequestId).not.toBe(commands[1].clientRequestId);
  await expect(page.locator('[data-fi06-state="ready"]')).toBeVisible();

  dialog = await openRequestRecord(page);
  await dialog.getByLabel('Route Authoritative chair').selectOption('PROCUREMENT');
  await dialog.getByLabel(/Review note/u).fill('A changed authoritative review note.');
  await dialog.getByRole('button', { name: 'Record request review' }).click();
  await expect.poll(() => commands.length).toBe(4);
  expect(commands[3].clientRequestId).not.toBe(commands[2].clientRequestId);
});

test('FI-06 reports conflict and denied review receipts without inventing local success', async ({
  page,
}, testInfo) => {
  await installPublicFeed(page);
  await installLogin(page, DOL_STAFF);
  let useFreshProjection = false;
  await page.route('**/api/bootstrap/request**', (route) => {
    const payload = requestBootstrapFixture();
    if (useFreshProjection) {
      payload.data.requests[0] = {
        ...payload.data.requests[0],
        purpose: 'Fresh server projection',
        updatedAt: '2026-08-25T00:00:00.000Z',
      };
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(payload) });
  });
  let attempt = 0;
  const commands = [];
  await page.route('**/api/reviewRequest', (route) => {
    commands.push(JSON.parse(route.request().postData() ?? '{}'));
    attempt += 1;
    return route.fulfill(
      attempt === 1
        ? {
            status: 409,
            contentType: 'application/json',
            body: JSON.stringify({
              code: 'REQUEST_STATE_CONFLICT',
              message: 'The request changed on the server.',
              correlationId: 'conflict-1',
            }),
          }
        : {
            status: 403,
            contentType: 'application/json',
            body: JSON.stringify({
              code: 'FORBIDDEN',
              message: 'Review authority is no longer granted.',
              correlationId: 'denied-1',
            }),
          },
    );
  });

  await openInternalRequestHub(page, testInfo);
  const dialog = await openRequestRecord(page);
  const routeSelect = dialog.getByLabel('Route Authoritative chair');
  await routeSelect.selectOption('ISSUE_FROM_STOCK');
  await dialog.getByRole('button', { name: 'Record request review' }).click();
  await expect(page.getByRole('alert').filter({ hasText: 'The request review changed' })).toBeVisible();
  await expect(page.getByText('Request review recorded')).toHaveCount(0);
  const recovery = dialog.getByRole('button', { name: 'Refresh request queue' });
  await expect(recovery).toBeVisible();
  useFreshProjection = true;
  await recovery.click();
  await expect(page.locator('[data-fi06-state="ready"]')).toBeVisible();
  await expect(dialog.getByRole('heading', { name: 'Fresh server projection' })).toBeVisible();
  await expect(routeSelect).toHaveValue('ISSUE_FROM_STOCK');

  await dialog.getByRole('button', { name: 'Record request review' }).click();
  await expect.poll(() => commands.length).toBe(2);
  expect(commands[1].clientRequestId).not.toBe(commands[0].clientRequestId);
  await expect(page.getByRole('alert').filter({ hasText: 'Review is not permitted' })).toBeVisible();
  await expect(page.getByText('Request review recorded')).toHaveCount(0);
  await expect(dialog.getByRole('button', { name: 'Refresh request queue' })).toBeVisible();
});

test('FI-06 keeps DOL read-only capability presentation separate from server mutation authority', async ({
  page,
}, testInfo) => {
  await installPublicFeed(page);
  await installLogin(page, DOL_READ_ONLY);
  await installRequestBootstrap(page);
  let reviewRequests = 0;
  await page.route('**/api/reviewRequest', (route) => {
    reviewRequests += 1;
    return route.fulfill({ status: 500, body: '{}' });
  });

  await openInternalRequestHub(page, testInfo);
  await expect(page.getByText(/Read-only queue: this account can view requests/u)).toBeVisible();
  const dialog = await openRequestRecord(page);
  await expect(dialog.getByLabel(/Route /u)).toHaveCount(0);
  await expect(dialog.getByLabel(/Review note/u)).toHaveCount(0);
  await expect(dialog.getByRole('button', { name: /Record request review/u })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Release', exact: true })).toHaveCount(0);
  await expect(dialog).not.toContainText(/On hand|Available to promise|Reserved/u);
  expect(reviewRequests).toBe(0);
});

test('FI-06 renders a reduced-motion initial loading state before the first authoritative page', async ({
  page,
}, testInfo) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await installPublicFeed(page);
  await installLogin(page, DOL_STAFF);
  let requestStarted = false;
  let releaseBootstrap;
  await page.route('**/api/bootstrap/request**', async (route) => {
    requestStarted = true;
    await new Promise((resolve) => {
      releaseBootstrap = resolve;
    });
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(requestBootstrapFixture()),
    });
  });

  await openInternalRequestHub(page, testInfo);
  await expect.poll(() => requestStarted).toBe(true);
  await expect(page.locator('[data-fi06-state="loading"]')).toBeVisible();
  const skeleton = page.locator('[aria-label="Loading request queue"] .animate-pulse').first();
  await expect(skeleton).toBeVisible();
  const motion = await skeleton.evaluate((element) => getComputedStyle(element).animationDuration);
  expect(motion).toMatch(/0\.01ms|0\.00001s|1e-05s/u);
  releaseBootstrap();
  await expect(page.locator('[data-fi06-state="ready"]')).toBeVisible();
});

test('FI-06 distinguishes a true empty authorized queue from client filter mismatch', async ({
  page,
}, testInfo) => {
  await installPublicFeed(page);
  await installLogin(page, DOL_STAFF);
  await installRequestBootstrap(page, {
    body: requestBootstrapFixture({
      requests: [],
      requestLines: [],
      eventSeries: [],
      eventDays: [],
      events: [],
      inventoryItems: [],
      pagination: { page: 1, pageSize: 25, total: 0, hasMore: false },
      scopeRevision: { token: 'request-empty', updatedAt: '2026-08-24T00:00:00.000Z' },
    }),
  });

  await openInternalRequestHub(page, testInfo);
  await expect(page.getByText('No requests are in this authorized scope')).toBeVisible();
  await expect(page.getByText('No loaded request matches these status filters')).toHaveCount(0);
});

for (const scenario of [
  {
    label: 'bootstrap error',
    status: 503,
    body: { code: 'SERVICE_UNAVAILABLE', message: 'Request service is unavailable.' },
    title: 'Request queue unavailable',
  },
  {
    label: 'bootstrap denial',
    status: 403,
    body: { code: 'FORBIDDEN', message: 'Request scope is denied.' },
    title: 'Access limited',
  },
]) {
  test(`FI-06 presents a truthful ${scenario.label}`, async ({ page }, testInfo) => {
    await installPublicFeed(page);
    await installLogin(page, DOL_STAFF);
    await installRequestBootstrap(page, { status: scenario.status, body: scenario.body });

    await openInternalRequestHub(page, testInfo, { waitForQueue: false });
    await expect(page.getByRole('heading', { name: scenario.title })).toBeVisible();
    await expect(page.getByText('Authoritative event support')).toHaveCount(0);
  });
}

test('FI-06 labels retained data refreshing before success and stale only after failure', async ({
  page,
}, testInfo) => {
  await installPublicFeed(page);
  await installLogin(page, DOL_STAFF);
  let mode = 'initial';
  let releaseRefreshing;
  await page.route('**/api/bootstrap/request**', async (route) => {
    if (mode === 'hold') {
      mode = 'resolving';
      await new Promise((resolve) => {
        releaseRefreshing = resolve;
      });
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(requestBootstrapFixture()),
      });
    }
    if (mode === 'reject') {
      return route.fulfill({
        status: 503,
        contentType: 'application/json',
        body: JSON.stringify({ code: 'SERVICE_UNAVAILABLE', message: 'Refresh unavailable.' }),
      });
    }
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(requestBootstrapFixture()),
    });
  });

  await openInternalRequestHub(page, testInfo);
  await expect(page.locator('[data-fi06-state="ready"]')).toBeVisible();
  mode = 'hold';
  await page.getByRole('button', { name: 'Refresh queue' }).click();
  await expect(page.locator('[data-fi06-state="refreshing"]')).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: 'Updating the request queue' })).toBeVisible();
  const dialog = await openRequestRecord(page);
  await expect(dialog.getByRole('button', { name: /Record request review/u })).toHaveCount(0);
  releaseRefreshing();
  await expect(page.locator('[data-fi06-state="ready"]')).toBeVisible();
  await page.keyboard.press('Escape');

  mode = 'reject';
  await page.getByRole('button', { name: 'Refresh queue' }).click();
  await expect(page.locator('[data-fi06-state="stale"]')).toBeVisible();
  await expect(page.getByRole('alert').filter({ hasText: 'Last known queue shown' })).toBeVisible();
  await expect(requestRecordButton(page, 'Authoritative event support')).toHaveCount(1);
});

test('FI-06 gives server ownership to request search, archive filter, and pagination', async ({
  page,
}, testInfo) => {
  await installPublicFeed(page);
  await installLogin(page, DOL_STAFF);
  const requestedUrls = [];
  await page.route('**/api/bootstrap/request**', (route) => {
    const url = new URL(route.request().url());
    requestedUrls.push(url);
    const pageNumber = Number(url.searchParams.get('page')) || 1;
    const requestId = pageNumber === 2 ? 'REQ-REAL-2' : 'REQ-REAL-1';
    const payload = requestBootstrapFixture({
      pagination: { page: pageNumber, pageSize: 25, total: 50, hasMore: pageNumber === 1 },
    });
    payload.data.requests[0] = {
      ...payload.data.requests[0],
      id: requestId,
      purpose: pageNumber === 2 ? 'Second authoritative server page' : 'Authoritative event support',
    };
    payload.data.requestLines[0] = {
      ...payload.data.requestLines[0],
      id: pageNumber === 2 ? 'LINE-REAL-2' : 'LINE-REAL-1',
      requestId,
    };
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(payload) });
  });

  await openInternalRequestHub(page, testInfo);
  await expect
    .poll(() =>
      requestedUrls.some(
        (url) =>
          url.searchParams.get('page') === '1' &&
          url.searchParams.get('pageSize') === '25' &&
          url.searchParams.get('filter') === 'ACTIVE',
      ),
    )
    .toBe(true);

  await page.getByPlaceholder('Search request ID, purpose, or requester…').fill('authoritative chair');
  await expect
    .poll(() => requestedUrls.some((url) => url.searchParams.get('query') === 'authoritative chair'))
    .toBe(true);
  await page.getByRole('button', { name: 'Archive' }).click();
  await expect
    .poll(() =>
      requestedUrls.some(
        (url) =>
          url.searchParams.get('page') === '1' &&
          url.searchParams.get('filter') === 'ARCHIVED' &&
          url.searchParams.get('query') === 'authoritative chair',
      ),
    )
    .toBe(true);
  await page.getByRole('button', { name: 'Next' }).click();
  await expect
    .poll(() =>
      requestedUrls.some(
        (url) =>
          url.searchParams.get('page') === '2' &&
          url.searchParams.get('filter') === 'ARCHIVED' &&
          url.searchParams.get('query') === 'authoritative chair',
      ),
    )
    .toBe(true);
  const finalRequest = requestedUrls.find(
    (url) =>
      url.searchParams.get('page') === '2' &&
      url.searchParams.get('filter') === 'ARCHIVED' &&
      url.searchParams.get('query') === 'authoritative chair',
  )?.searchParams;
  expect(finalRequest?.get('page')).toBe('2');
  expect(finalRequest?.get('pageSize')).toBe('25');
  expect(finalRequest?.get('filter')).toBe('ARCHIVED');
  expect(finalRequest?.get('query')).toBe('authoritative chair');
  await expect(requestRecordButton(page, 'Second authoritative server page')).toHaveCount(1);
});

test('FI-06 presents one responsive queue, restores exact request focus, and supports dark presentation', async ({
  page,
}, testInfo) => {
  await installPublicFeed(page);
  await installLogin(page, DOL_STAFF);
  await installRequestBootstrap(page);

  await openInternalRequestHub(page, testInfo);
  const queue = page.locator('[aria-label="Request queue"]');
  const opener = requestRecordButton(page, 'Authoritative event support');
  await expect(opener).toHaveCount(1);
  if (usesMobileRequestLayout(testInfo)) {
    await expect(queue.locator('table')).toBeHidden();
  } else {
    await expect(queue.locator('table')).toBeVisible();
  }

  await page.keyboard.press('/');
  await expect(page.getByPlaceholder('Search request ID, purpose, or requester…')).toBeFocused();

  await opener.focus();
  await opener.click();
  const inspector = page.locator('[data-request-inspector]');
  const record = inspector.getByRole('button', { name: 'Record request review' });
  if (usesMobileRequestLayout(testInfo)) {
    await expect(inspector).toHaveAttribute('role', 'dialog');
    await expect(inspector).toHaveAttribute('aria-modal', 'true');
    const close = inspector.getByRole('button', { name: 'Back to requests' });
    await expect(close).toBeFocused();
    await expect(queue).toHaveAttribute('aria-hidden', 'true');
    await page.keyboard.press('Shift+Tab');
    await expect(record).toBeFocused();
    await page.keyboard.press('Tab');
    await expect(close).toBeFocused();
  } else {
    await expect(inspector).toHaveAttribute('role', 'complementary');
    await expect(inspector).not.toHaveAttribute('aria-modal', 'true');
    await expect(opener).toBeFocused();
    await expect(inspector.getByRole('button', { name: 'Close inspector' })).toBeVisible();
  }
  await page.keyboard.press('Escape');
  await expect(inspector).toHaveCount(0);
  await expect(queue).not.toHaveAttribute('aria-hidden', 'true');
  await expect(opener).toBeFocused();

  if (usesMobileShell(testInfo)) {
    const drawer = await workspaceSurface(page, testInfo);
    await drawer.getByRole('button', { name: 'Switch to dark theme' }).click();
    await drawer.getByRole('button', { name: 'Close navigation' }).click();
  } else {
    await page.getByRole('button', { name: 'Switch to dark theme' }).click();
  }
  await expect(page.locator('html')).toHaveClass(/dark/u);
  await expect(page.getByRole('heading', { name: 'Request review queue' })).toBeVisible();
});

test('FI-06 preview inspection records only a local action and never contacts request services', async ({
  page,
}) => {
  test.skip(
    process.env.HAU_FRONTEND_E2E_PORT !== '4173',
    'Requires the accepted exact-4173 local inspector.',
  );
  await page.route('**/api/version', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, playground: true }),
    }),
  );
  await installPublicFeed(page);
  const protectedRequests = [];
  page.on('request', (request) => {
    const pathname = new URL(request.url()).pathname;
    if (pathname === '/api/bootstrap/request' || pathname === '/api/reviewRequest') {
      protectedRequests.push({ method: request.method(), pathname });
    }
  });

  await page.goto('/#/__preview/index');
  await page.locator('[data-preview-route="request-center"] [data-action="open-preview"]').click();
  await expect(
    page.locator('[data-preview-inspection="true"][data-preview-route="request-center"]'),
  ).toBeVisible();
  const dialog = await openRequestRecord(page, 'Sample logistics request');
  await dialog.getByLabel('Route Preview folding chair').selectOption('ISSUE_FROM_STOCK');
  await dialog.getByRole('button', { name: 'Check review action' }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Review action checked' })).toBeVisible();
  expect(protectedRequests).toEqual([]);
});

test('FI-05 Inventory uses the authenticated bootstrap, restores inspector focus, and reports a denied read truthfully', async ({
  page,
}, testInfo) => {
  await installPublicFeed(page);
  await installLogin(page, DOL_STAFF);
  await installInventoryBootstrap(page);

  await page.goto('/');
  await page.getByRole('link', { name: 'Staff sign in' }).first().click();
  await signIn(page, 'dol.staff');
  await (await workspaceSurface(page, testInfo)).getByRole('link', { name: 'Inventory' }).click();
  const opener = usesMobileInventoryLayout(testInfo)
    ? page.getByRole('button', { name: 'Open item record' })
    : page.getByRole('button', { name: /Authoritative folding chair/u });
  await expect(opener).toBeVisible();
  await opener.click();
  if (usesMobileInventoryLayout(testInfo)) {
    await expect(page.getByRole('dialog')).toContainText('Current authorized inventory records');
    const closeInspector = page.getByRole('button', { name: 'Back to inventory' });
    await expect(closeInspector).toBeFocused();
    await page.keyboard.press('Tab');
    expect(
      await page.getByRole('dialog').evaluate((element) => element.contains(document.activeElement)),
    ).toBe(true);
    await page.keyboard.press('Shift+Tab');
    expect(
      await page.getByRole('dialog').evaluate((element) => element.contains(document.activeElement)),
    ).toBe(true);
  } else {
    await expect(page.getByRole('complementary', { name: 'Authoritative folding chair' })).toContainText(
      'Current authorized inventory records',
    );
    await expect(page.getByRole('button', { name: 'Close inspector' })).toBeVisible();
  }
  await page.keyboard.press('Escape');
  await expect(opener).toBeFocused();
});

test('FI-05 Inventory fails closed to the access-limited state when the bootstrap denies the read', async ({
  page,
}, testInfo) => {
  await installPublicFeed(page);
  await installLogin(page, DOL_STAFF);
  await installInventoryBootstrap(page, {
    status: 403,
    body: { code: 'FORBIDDEN', message: 'Access denied.' },
  });

  await page.goto('/');
  await page.getByRole('link', { name: 'Staff sign in' }).first().click();
  await signIn(page, 'dol.staff');
  await (await workspaceSurface(page, testInfo)).getByRole('link', { name: 'Inventory' }).click();
  await expect(page.getByText('Access limited')).toBeVisible();
  await expect(page.getByText('This view is not available for your current session.')).toBeVisible();
});

test('FI-05 Inventory reports a genuinely empty authorized bootstrap without implying a local filter mismatch', async ({
  page,
}, testInfo) => {
  await installPublicFeed(page);
  await installLogin(page, DOL_STAFF);
  await installInventoryBootstrap(page, {
    body: {
      ok: true,
      contract: 'bootstrap-module',
      contractVersion: 2,
      requestOnly: false,
      module: 'inventory',
      scopeRevision: { token: 'inventory-empty', updatedAt: '2026-08-24T00:00:00.000Z' },
      pagination: { page: 1, pageSize: 25, total: 0, hasMore: false },
      data: {
        inventoryItems: [],
        ledgerTransactions: [],
        reservations: [],
        inventoryAssets: [],
        assetMaintenanceHistory: [],
        assetMovementHistory: [],
      },
    },
  });

  await page.goto('/');
  await page.getByRole('link', { name: 'Staff sign in' }).first().click();
  await signIn(page, 'dol.staff');
  await (await workspaceSurface(page, testInfo)).getByRole('link', { name: 'Inventory' }).click();
  await expect(page.getByText('No inventory records are available in this authorized scope')).toBeVisible();
  await expect(page.getByText('No records match this filter')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Clear filter' })).toHaveCount(0);
});

test('FI-05 Inventory retains the last authoritative projection and labels it stale after a failed refresh', async ({
  page,
}, testInfo) => {
  await installPublicFeed(page);
  await installLogin(page, DOL_STAFF);
  await installInventoryBootstrap(page);

  await page.goto('/');
  await page.getByRole('link', { name: 'Staff sign in' }).first().click();
  await signIn(page, 'dol.staff');
  await (await workspaceSurface(page, testInfo)).getByRole('link', { name: 'Inventory' }).click();
  const inventoryRecord = usesMobileInventoryLayout(testInfo)
    ? page.getByRole('button', { name: 'Open item record' })
    : page.getByRole('button', { name: /Authoritative folding chair/u });
  await expect(inventoryRecord).toBeVisible();
  await page.unroute('**/api/bootstrap/inventory?**');
  await page.route('**/api/bootstrap/inventory?**', (route) =>
    route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: JSON.stringify({ code: 'SERVICE_UNAVAILABLE', message: 'Inventory is temporarily unavailable.' }),
    }),
  );
  await page.getByRole('button', { name: 'Refresh inventory' }).click();
  await expect(page.getByText('Data may be out of date')).toBeVisible();
  await expect(inventoryRecord).toBeVisible();
});

test('AUTH-01 generic zero-capability sign-in remains denied even though Profile is projected for an authenticated account', async ({
  page,
}) => {
  await installPublicFeed(page);
  await installLogin(page, INELIGIBLE);

  await page.goto('/');
  await page.getByRole('link', { name: 'Staff sign in' }).first().click();
  await signIn(page, 'student.account');

  // This uses the real `projectSession()` path: Profile remains a direct
  // authenticated account route, but never becomes a generic workspace home.
  await expect(page.getByText('Not available for this account')).toBeVisible();
  await expect(page.getByText(/no logistics workspace or requester access assigned/u)).toBeVisible();
  await expect(page.getByRole('banner', { name: 'Workspace command bar' })).toHaveCount(0);
});

test('P14 profile uses authenticated identity data and exposes the accepted self-service controls', async ({
  page,
}) => {
  await installPublicFeed(page);
  await installLogin(page, DOL_STAFF);
  await installProfile(page, { delay: 200 });

  await page.goto('/');
  await page.getByRole('link', { name: 'Staff sign in' }).first().click();
  await signIn(page, 'dol.staff');
  await expect(page.getByRole('banner', { name: 'Workspace command bar' })).toBeVisible();
  await page.evaluate(() => {
    window.location.hash = '#/route/profile';
  });

  await expect(page.getByRole('status')).toContainText('Loading your profile');
  await expect(page.getByRole('heading', { name: 'DOL Profile' })).toBeVisible();
  await expect(page.getByText('Department of Logistics Profile')).toBeVisible();
  for (const heading of ['Identity', 'Account', 'Contact', 'Appearance', 'Security & Activity']) {
    await expect(page.getByRole('heading', { name: heading })).toBeVisible();
  }
  await expect(page.getByRole('button', { name: 'Save contact number' })).toBeVisible();
});

test('P18 Profile persists theme family separately from Light, Dark, and System mode', async ({ page }) => {
  await installPublicFeed(page);
  await installLogin(page, DOL_STAFF);
  await installProfile(page);
  const appearanceCommands = [];
  await page.route('**/api/me/appearance', (route) => {
    if (route.request().method() !== 'PATCH') return route.fallback();
    const command = JSON.parse(route.request().postData() ?? '{}');
    appearanceCommands.push(command);
    const response = profileFixture();
    response.profile.appearance = { family: command.family, mode: command.mode };
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(response) });
  });

  await page.goto('/');
  await page.getByRole('link', { name: 'Staff sign in' }).first().click();
  await signIn(page, 'dol.staff');
  await expect(page.getByRole('banner', { name: 'Workspace command bar' })).toBeVisible();
  await page.evaluate(() => {
    window.location.hash = '#/route/profile';
  });

  await expect(page.getByRole('heading', { name: 'DOL Profile' })).toBeVisible();
  const families = page.getByRole('radiogroup', { name: 'Theme family' });
  const modes = page.getByRole('radiogroup', { name: 'Display mode' });
  await expect(families.getByRole('radio')).toHaveCount(6);
  await expect(modes.getByRole('radio')).toHaveCount(3);

  const beforeThemeChange = await page.evaluate(() => {
    window.__p25ThemeSentinel = 'theme-state-survived';
    return performance.getEntriesByType('navigation').length;
  });
  await families.getByRole('radio', { name: 'Emerald Operations' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme-family', 'EMERALD_OPERATIONS');
  await modes.getByRole('radio', { name: 'Dark' }).click();
  await expect(page.locator('html')).toHaveClass(/\bdark\b/u);
  await expect(page.locator('html')).toHaveAttribute('data-theme-family', 'EMERALD_OPERATIONS');
  await expect.poll(() => appearanceCommands.length).toBe(2);
  expect(appearanceCommands.map(({ family, mode }) => ({ family, mode }))).toEqual([
    { family: 'EMERALD_OPERATIONS', mode: 'SYSTEM' },
    { family: 'EMERALD_OPERATIONS', mode: 'DARK' },
  ]);
  await expect
    .poll(() =>
      page.evaluate(() => ({
        family: localStorage.getItem('hau-usc-theme-family'),
        mode: localStorage.getItem('hau-usc-theme'),
      })),
    )
    .toEqual({ family: 'EMERALD_OPERATIONS', mode: 'dark' });
  await expect
    .poll(() =>
      page.evaluate(() => ({
        navigationCount: performance.getEntriesByType('navigation').length,
        sentinel: window.__p25ThemeSentinel,
      })),
    )
    .toEqual({ navigationCount: beforeThemeChange, sentinel: 'theme-state-survived' });
});

test('FI-04 profile surfaces a failed profile response and retries only after the user asks', async ({
  page,
}) => {
  await installPublicFeed(page);
  await installLogin(page, DOL_STAFF);
  let attempts = 0;
  await page.route('**/api/me/profile', (route) => {
    attempts += 1;
    return route.fulfill(
      attempts === 1
        ? {
            status: 503,
            contentType: 'application/json',
            body: JSON.stringify({
              code: 'PROFILE_UNAVAILABLE',
              message: 'Profile temporarily unavailable.',
            }),
          }
        : { status: 200, contentType: 'application/json', body: JSON.stringify(profileFixture()) },
    );
  });

  await page.goto('/');
  await page.getByRole('link', { name: 'Staff sign in' }).first().click();
  await signIn(page, 'dol.staff');
  await expect(page.getByRole('banner', { name: 'Workspace command bar' })).toBeVisible();
  await page.evaluate(() => {
    window.location.hash = '#/route/profile';
  });
  await expect(page.getByRole('alert')).toContainText('Profile temporarily unavailable.');
  await page.getByRole('button', { name: 'Retry profile' }).click();
  await expect(page.getByRole('heading', { name: 'DOL Profile' })).toBeVisible();
});

test('FI-04 Home preserves the DOL session while Sign out is the only shell action that destroys it', async ({
  page,
}, testInfo) => {
  await installPublicFeed(page);
  await installRequesterPortal(page);
  await installLogin(page, DOL_STAFF);
  let logouts = 0;
  await page.route('**/api/auth/logout', (route) => {
    logouts += 1;
    return route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' });
  });

  await page.goto('/');
  await page.getByRole('link', { name: 'Staff sign in' }).first().click();
  await signIn(page, 'dol.staff');
  await (await workspaceSurface(page, testInfo)).getByRole('link', { name: 'Home', exact: true }).click();
  await expect(page.getByRole('heading', { name: HERO_HEADING })).toBeVisible();
  expect(logouts).toBe(0);

  await page
    .getByRole('link', { name: /^Start a logistics request/u })
    .first()
    .click();
  await expect(page.getByRole('heading', { name: 'External Request Center', level: 1 })).toBeVisible();
  await expect(page.getByLabel('Identifier')).toHaveCount(0);

  await page.getByRole('button', { name: 'Open Logistics Hub' }).click();
  await expect(page.getByRole('banner', { name: 'Workspace command bar' })).toBeVisible();
  await (
    await workspaceSurface(page, testInfo)
  )
    .getByRole('button', { name: 'Sign out', exact: true })
    .click();
  await expect(page.getByRole('heading', { name: HERO_HEADING })).toBeVisible();
  expect(logouts).toBe(1);
});

test('FI-04 mobile workspace drawer traps focus and restores its opener', async ({ page }, testInfo) => {
  test.skip(!['frontend-320', 'frontend-390'].includes(testInfo.project.name), 'mobile drawer assertion');
  await installPublicFeed(page);
  await installLogin(page, DOL_STAFF);

  await page.goto('/');
  await page.getByRole('link', { name: 'Staff sign in' }).first().click();
  await signIn(page, 'dol.staff');

  const opener = page.getByRole('button', { name: 'Open navigation' });
  await opener.focus();
  await opener.click();
  const drawer = page.getByRole('dialog', { name: 'Workspace navigation' });
  const close = drawer.getByRole('button', { name: 'Close navigation' });
  await expect(close).toBeFocused();

  await page.keyboard.press('Shift+Tab');
  await expect(drawer.getByRole('button', { name: 'Sign out', exact: true })).toBeFocused();
  await page.keyboard.press('Tab');
  await expect(close).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(drawer).toHaveCount(0);
  await expect(opener).toBeFocused();
});

test('AUTH-02 generic staff sign-in sends an eligible non-DOL account to the External Request Center', async ({
  page,
}) => {
  await installPublicFeed(page);
  await installRequesterPortal(page);
  await installLogin(page, NON_DOL_REQUESTER);

  await page.goto('/');
  await page.getByRole('link', { name: 'Staff sign in' }).first().click();
  await signIn(page, 'usc.officer');

  await expect(page.getByRole('heading', { name: 'External Request Center', level: 1 })).toBeVisible();
});

/* ---- AUTH-03 / AUTH-04 / AUTH-05 ---------------------------------------- */

test('AUTH-03 and AUTH-04 the activation and password-reset paths are reachable from Staff Sign In', async ({
  page,
}) => {
  await installPublicFeed(page);
  await page.goto('/');
  await page.getByRole('link', { name: 'Staff sign in' }).first().click();

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
  await page.route('**/api/auth/reset/start', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, accepted: true, resendAvailableInSeconds: 60 }),
    }),
  );
  await page.route('**/api/auth/reset/verify', (route) =>
    route.fulfill({
      status: 422,
      contentType: 'application/json',
      body: JSON.stringify({ code: 'VERIFICATION_INVALID', message: 'That code is not correct.' }),
    }),
  );

  await page.goto('/');
  await page.getByRole('link', { name: 'Staff sign in' }).first().click();
  await page.getByRole('button', { name: 'Forgot password?' }).click();
  await page.getByLabel('Registered identifier or email').fill('someone@example.test');
  await page.getByRole('button', { name: 'Send verification code' }).click();

  // Generic confirmation: identical whether or not the account exists.
  await expect(
    page.getByText('If this account exists, a verification code has been sent to its registered email.'),
  ).toBeVisible();

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

test('HOME-01 and HOME-02 the single public-shell Home returns from Public Lending', async ({ page }) => {
  await installPublicFeed(page);
  await installLendingCatalog(page);
  await openPublicLending(page);

  const home = page.getByRole('link', { name: 'HAU-USC home', exact: true });
  await expect(home).toHaveCount(1);
  await home.click();
  await expect(page.getByRole('heading', { name: HERO_HEADING })).toBeVisible();

  await page.getByRole('link', { name: /^Browse public lending/u }).click();
  await page.getByRole('link', { name: 'HAU-USC home', exact: true }).click();
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
  await page.getByRole('link', { name: 'Staff sign in' }).first().click();
  await signIn(page, 'usc.officer');
  await expect(page.getByRole('heading', { name: 'External Request Center', level: 1 })).toBeVisible();

  await page.getByRole('button', { name: 'Home', exact: true }).first().click();
  await expect(page.getByRole('heading', { name: HERO_HEADING })).toBeVisible();
  expect(logouts).toBe(0);

  // Still authenticated: re-entering the request intent does not re-prompt for credentials.
  await page
    .getByRole('link', { name: /^Start a logistics request/u })
    .first()
    .click();
  await expect(page.getByRole('heading', { name: 'External Request Center', level: 1 })).toBeVisible();
  await expect(page.getByLabel('Identifier')).toHaveCount(0);
});

/* ---- CTX-02 ------------------------------------------------------------- */

test('CTX-02 every public surface states the staff gate before the user commits', async ({
  page,
}, testInfo) => {
  await installPublicFeed(page);
  await installSignedOutSession(page);
  await page.goto('/');

  await expect(page.getByText('USC staff sign-in required').first()).toBeVisible();
  const hubTile = page.getByRole('link', { name: /^Start a logistics request/u }).first();
  await expect(hubTile).toContainText('USC staff sign-in required');

  if (testInfo.project.name === 'frontend-320' || testInfo.project.name === 'frontend-390') {
    await page.getByRole('button', { name: 'Open navigation menu' }).click();
    const drawer = page.getByRole('dialog', { name: 'Navigation menu' });
    await drawer.getByRole('link', { name: 'Start a logistics request', exact: true }).click();
    await expect(page.getByRole('heading', { name: /Sign in/u }).first()).toBeVisible();
  }
});
