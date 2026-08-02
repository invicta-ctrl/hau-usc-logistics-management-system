import { expect, request as apiRequest, test } from '@playwright/test';
import { navigateToAdminView } from '../e2e/navigation.js';

const PASSWORD = `LocalOnly${String.fromCharCode(33)}Pass2026`;
const TEMPORARY_PASSWORD = `Temporary${String.fromCharCode(33)}Local2026`;
const ACTIVATED_PASSWORD = `Activated${String.fromCharCode(33)}Local9472`;
const MANAGED_ACTIVATED_PASSWORD = `Managed${String.fromCharCode(33)}Activated9472`;
const roles = [
  ['LOCAL.OWNER', 'administrator', 'admin'],
  ['LOCAL.ADMIN', 'administrator', 'admin'],
  ['LOCAL.DIRECTOR', 'director', 'director'],
  ['LOCAL.FOOD', 'food', 'food'],
  ['LOCAL.INVENTORY', 'inventory-pantry', 'inventory'],
  ['LOCAL.MATERIALS', 'materials', 'materials'],
];

async function login(request, accessId, password = PASSWORD) {
  const response = await request.post('/api/auth/login', {
    data: { accessId, password },
  });
  expect(response.status()).toBe(200);
  const result = await response.json();
  expect(result.state).toBe('AUTHENTICATED');
  return result.csrfToken;
}

async function mutate(request, csrfToken, method, data) {
  return request.post(`/api/${method}`, {
    headers: { 'x-csrf-token': csrfToken },
    data,
  });
}

test('serves the SPA and exposes D1 readiness through workerd', async ({ page, request }) => {
  const readiness = await request.get('/api/readiness');
  expect(readiness.status()).toBe(200);
  await expect(readiness.json()).resolves.toMatchObject({
    ok: true,
    ready: true,
    database: { connected: true, schemaVersion: '28' },
  });

  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Staff sign in' })).toBeVisible();
  await expect(page.locator('body')).not.toHaveAttribute('data-bootstrap-failed', 'true');
});

test('request-only mode bypasses auth and exposes only sanitized reference data', async ({
  page,
  request,
}) => {
  const essential = await request.get('/api/getEssentialBootstrapData?requestOnly=true');
  expect(essential.status()).toBe(200);
  const essentialData = await essential.json();
  expect(essentialData).toMatchObject({
    ok: true,
    requestOnly: true,
    activeModule: 'request',
    currentUser: { role: 'REQUESTER' },
  });
  expect(essentialData.navigation.filter((item) => item.enabled).map((item) => item.id)).toEqual(['request']);

  const module = await request.post('/api/getBootstrapModule', {
    data: { requestOnly: true, module: 'request', page: 1, pageSize: 10 },
  });
  expect(module.status()).toBe(200);
  const moduleData = await module.json();
  expect(moduleData.data.inventoryItems.length).toBeGreaterThan(0);
  expect(moduleData.data.inventoryItems[0]).not.toHaveProperty('onHand');
  expect(moduleData.data.inventoryItems[0]).not.toHaveProperty('storageLocation');

  const protectedRoute = await request.get('/api/procurement');
  expect(protectedRoute.status()).toBe(401);
  await page.goto('/?request=1');
  await expect(page.locator('body')).toHaveClass(/request-mode/);
  await expect(page.getByLabel('Access ID')).toHaveCount(0);
  await expect(page.getByText('Request-only safe')).toBeVisible();
});

test('unknown credentials return the safe authentication error instead of a service failure', async ({
  request,
}) => {
  const response = await request.post('/api/auth/login', {
    data: { accessId: 'LOCAL.UNKNOWN', password: 'Synthetic!Invalid9472' },
  });
  expect(response.status()).toBe(401);
  const correlationId = response.headers()['x-correlation-id'];
  expect(correlationId).toMatch(/^REQ_[A-Za-z0-9_-]+$/u);
  expect(response.headers()['cache-control']).toBe('no-store');
  expect(response.headers()['x-content-type-options']).toBe('nosniff');
  expect(response.headers()['referrer-policy']).toBe('no-referrer');
  expect(response.headers()['permissions-policy']).toContain('camera=()');
  await expect(response.json()).resolves.toMatchObject({
    code: 'AUTHENTICATION_FAILED',
    message: 'The Access ID or password is incorrect.',
    correlationId,
  });
});

test('System Owner receives every module and a server-validated operational scope catalog', async ({
  baseURL,
}) => {
  const owner = await apiRequest.newContext({ baseURL });
  const admin = await apiRequest.newContext({ baseURL });
  const ownerCsrf = await login(owner, 'LOCAL.OWNER');
  await login(admin, 'LOCAL.ADMIN');

  const essential = await owner.post('/api/getEssentialBootstrapData', {
    data: { operationalScope: 'COMMITTEE:COM_FOOD' },
  });
  expect(essential.status()).toBe(200);
  await expect(essential.json()).resolves.toMatchObject({
    currentUser: {
      role: 'SYSTEM_OWNER',
      authorization: { roleId: 'SYSTEM_OWNER', scopeMode: 'ALL' },
    },
    navigation: expect.arrayContaining([expect.objectContaining({ id: 'release', enabled: true })]),
    operationalContext: {
      selected: { value: 'COMMITTEE:COM_FOOD', kind: 'COMMITTEE', id: 'COM_FOOD' },
    },
  });
  const invalid = await owner.post('/api/getEssentialBootstrapData', {
    data: { operationalScope: 'COMMITTEE:NOT_AUTHORIZED' },
  });
  expect(invalid.status()).toBe(403);
  await expect(invalid.json()).resolves.toMatchObject({ code: 'OPERATIONAL_SCOPE_INVALID' });

  expect(
    (
      await owner.post('/api/getBootstrapModule', {
        data: {
          module: 'release',
          operationalScope: 'COMMITTEE:COM_FOOD',
          page: 1,
          pageSize: 10,
        },
      })
    ).status(),
  ).toBe(200);
  expect(
    (
      await admin.post('/api/getBootstrapModule', {
        data: { module: 'release', page: 1, pageSize: 10 },
      })
    ).status(),
  ).toBe(403);
  const locationModule = await owner.post('/api/getBootstrapModule', {
    data: {
      module: 'inventory',
      operationalScope: 'LOCATION:SYNTHETIC_STORAGE',
      page: 1,
      pageSize: 10,
    },
  });
  expect(locationModule.status()).toBe(200);
  const locationData = await locationModule.json();
  expect(locationData.data.inventoryItems.length).toBeGreaterThan(0);
  expect(locationData.data.inventoryItems.every((item) => item.storageLocation === 'Synthetic Storage')).toBe(
    true,
  );
  const eventModule = await owner.post('/api/getBootstrapModule', {
    data: {
      module: 'request',
      operationalScope: 'EVENT:EVT-LOCAL',
      page: 1,
      pageSize: 10,
    },
  });
  expect(eventModule.status()).toBe(200);
  const eventData = await eventModule.json();
  expect(eventData.data.events).toEqual([expect.objectContaining({ id: 'EVT-LOCAL' })]);
  expect(eventData.data.requestLines.every((line) => line.eventId === 'EVT-LOCAL')).toBe(true);
  const contextualMutation = await mutate(owner, ownerCsrf, 'createLendingTicket', {
    clientRequestId: `owner-context-${crypto.randomUUID()}`,
    borrowerReference: '12345678',
    borrowerName: 'Synthetic Owner Context Borrower',
    borrowerType: 'STUDENT',
    itemId: 'ITM-LOCAL-001',
    quantity: 1,
    unit: 'piece',
    purpose: 'System Owner operational-context audit proof',
    dueAt: '2026-08-10T12:00:00+08:00',
    ticketType: 'LOAN',
    operationalScope: 'COMMITTEE:COM_FOOD',
    activeWorkspace: 'inventory',
  });
  expect(contextualMutation.status()).toBe(200);
  await Promise.all([owner.dispose(), admin.dispose()]);
});

test('System Owner governs immutable brand versions while Administrator mutations fail closed', async ({
  baseURL,
}) => {
  const owner = await apiRequest.newContext({ baseURL });
  const admin = await apiRequest.newContext({ baseURL });
  const ownerCsrf = await login(owner, 'LOCAL.OWNER');
  const adminCsrf = await login(admin, 'LOCAL.ADMIN');
  const encode = (fill) =>
    Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180"><rect width="320" height="180" fill="${fill}"/></svg>`,
    ).toString('base64');

  const denied = await admin.post('/api/owner/brand-assets/upload', {
    headers: { 'x-csrf-token': adminCsrf },
    data: {
      slot: 'default-item-image',
      base64: encode('#78151b'),
      altText: 'Denied synthetic brand asset',
      reason: 'Authorization boundary proof only.',
      clientRequestId: `brand-denied-${crypto.randomUUID()}`,
    },
  });
  expect(denied.status()).toBe(403);

  const upload = async (fill, suffix) => {
    const response = await owner.post('/api/owner/brand-assets/upload', {
      headers: { 'x-csrf-token': ownerCsrf },
      data: {
        slot: 'default-item-image',
        base64: encode(fill),
        altText: `Synthetic ${suffix} item placeholder`,
        reason: 'Local governed brand asset acceptance proof.',
        clientRequestId: `brand-upload-${suffix}-${crypto.randomUUID()}`,
      },
    });
    expect(response.status()).toBe(200);
    return response.json();
  };
  const publish = async (versionId, revision, suffix, rollback = false) => {
    const response = await owner.post(`/api/owner/brand-assets/${rollback ? 'rollback' : 'publish'}`, {
      headers: { 'x-csrf-token': ownerCsrf },
      data: {
        slot: 'default-item-image',
        versionId,
        expectedRevision: revision,
        reason: `Local ${suffix} publication acceptance proof.`,
        clientRequestId: `brand-${suffix}-${crypto.randomUUID()}`,
      },
    });
    expect(response.status()).toBe(200);
    return response.json();
  };

  const first = await upload('#78151b', 'first');
  const firstPublished = await publish(first.versionId, 1, 'first');
  const firstDelivery = await owner.get('/brand/default-item-image');
  expect(firstDelivery.status()).toBe(200);
  expect(firstDelivery.headers()['content-type']).toContain('image/svg+xml');
  expect(await firstDelivery.text()).toContain('#78151b');

  const second = await upload('#183153', 'second');
  const secondPublished = await publish(second.versionId, firstPublished.revision, 'second');
  const rollback = await publish(first.versionId, secondPublished.revision, 'rollback', true);
  expect(rollback.versionId).toBe(first.versionId);

  const directory = await owner.post('/api/owner/brand-assets/list', {
    headers: { 'x-csrf-token': ownerCsrf },
    data: {},
  });
  expect(directory.status()).toBe(200);
  const result = await directory.json();
  expect(result.slots).toContainEqual(
    expect.objectContaining({ id: 'default-item-image', published_version_id: first.versionId }),
  );
  expect(result.versions.filter((version) => version.slot_id === 'default-item-image')).toHaveLength(2);
  expect(result.history.map((entry) => entry.action)).toEqual(
    expect.arrayContaining(['UPLOADED', 'PUBLISHED', 'REPLACED', 'ROLLED_BACK']),
  );
});

test('inventory classification is protected, audited, idempotent, and fail-closed for lending', async ({
  baseURL,
}) => {
  const inventory = await apiRequest.newContext({ baseURL });
  const food = await apiRequest.newContext({ baseURL });
  try {
    const inventoryCsrf = await login(inventory, 'LOCAL.INVENTORY');
    const foodCsrf = await login(food, 'LOCAL.FOOD');
    const pendingResponse = await mutate(inventory, inventoryCsrf, 'listInventoryClassifications', {
      status: 'NEEDS_CLASSIFICATION',
      page: 1,
      pageSize: 10,
    });
    expect(pendingResponse.status()).toBe(200);
    const pending = await pendingResponse.json();
    const fixture = pending.items.find((item) => item.id === 'ITM-LOCAL-CLASSIFY');
    expect(fixture).toMatchObject({
      inventoryKind: 'UNVERIFIED',
      classificationStatus: 'NEEDS_CLASSIFICATION',
      isLendable: false,
      assetInstanceCount: 0,
    });

    const unrelatedCommittee = await mutate(food, foodCsrf, 'listInventoryClassifications', {
      status: 'ALL',
    });
    expect(unrelatedCommittee.status()).toBe(403);
    await expect(unrelatedCommittee.json()).resolves.toMatchObject({
      code: 'INVENTORY_CLASSIFICATION_FORBIDDEN',
    });

    const unsafeTicket = await mutate(inventory, inventoryCsrf, 'createLendingTicket', {
      clientRequestId: `classification-denial-${crypto.randomUUID()}`,
      borrowerReference: '12345678',
      borrowerName: 'Synthetic Classification Borrower',
      borrowerType: 'STUDENT',
      itemId: fixture.id,
      quantity: 1,
      unit: fixture.unit,
      purpose: 'Fail-closed classification proof',
      dueAt: '2026-08-10T12:00:00+08:00',
      ticketType: 'LOAN',
    });
    expect(unsafeTicket.status()).toBe(409);
    await expect(unsafeTicket.json()).resolves.toMatchObject({ code: 'LENDING_ITEM_UNAVAILABLE' });

    const command = {
      clientRequestId: `classification-${crypto.randomUUID()}`,
      itemId: fixture.id,
      expectedRevision: fixture.classificationRevision,
      classificationStatus: 'CLASSIFIED',
      inventoryKind: 'REUSABLE',
      stockArea: fixture.stockArea,
      storageLocation: fixture.storageLocation,
      unit: fixture.unit,
      reorderThreshold: fixture.reorderThreshold,
      conditionReviewState: 'GOOD',
      maintenanceReviewState: 'CLEARED',
      isLendable: true,
      lendingAudience: 'STUDENTS_AND_STAFF',
      enableLendingConfirmed: true,
      assetInstanceCountIfReusable: 1,
      assetTrackingConfirmed: true,
      assetTags: [`PHASE17-${crypto.randomUUID()}`],
      classificationNotes: 'Synthetic local physical classification proof',
    };
    const classifiedResponse = await mutate(inventory, inventoryCsrf, 'classifyInventoryItem', command);
    expect(classifiedResponse.status()).toBe(200);
    const classified = await classifiedResponse.json();
    expect(classified).toMatchObject({
      itemId: fixture.id,
      classificationStatus: 'CLASSIFIED',
      inventoryKind: 'REUSABLE',
      isLendable: true,
      assetInstanceCount: 1,
      classificationRevision: fixture.classificationRevision + 1,
    });
    const replay = await mutate(inventory, inventoryCsrf, 'classifyInventoryItem', command);
    expect(replay.status()).toBe(200);
    await expect(replay.json()).resolves.toMatchObject(classified);

    const completedResponse = await mutate(inventory, inventoryCsrf, 'listInventoryClassifications', {
      status: 'CLASSIFIED',
      search: fixture.id,
      page: 1,
      pageSize: 10,
    });
    expect(completedResponse.status()).toBe(200);
    const completed = await completedResponse.json();
    expect(completed.items[0]).toMatchObject({
      id: fixture.id,
      classificationStatus: 'CLASSIFIED',
      assetInstanceCount: 1,
      classificationHistory: [
        expect.objectContaining({
          previousStatus: 'NEEDS_CLASSIFICATION',
          newStatus: 'CLASSIFIED',
          isLendable: true,
        }),
      ],
    });
    const publicCatalog = await (await inventory.get('/api/public/lending/catalog')).json();
    expect(publicCatalog.items).toContainEqual(expect.objectContaining({ id: fixture.id }));
  } finally {
    await Promise.all([inventory.dispose(), food.dispose()]);
  }
});

test('identity roster is owner-only, metadata-safe, explicit-preview-only, and absent from login reads', async ({
  baseURL,
}) => {
  const ownerContext = await apiRequest.newContext({ baseURL });
  const adminContext = await apiRequest.newContext({ baseURL });
  const staffContext = await apiRequest.newContext({ baseURL });
  try {
    const ownerCsrf = await login(ownerContext, 'LOCAL.OWNER');
    const adminCsrf = await login(adminContext, 'LOCAL.ADMIN');
    await login(staffContext, 'LOCAL.FOOD');

    const status = await ownerContext.post('/api/owner/identity-roster/status', {
      headers: { 'x-csrf-token': ownerCsrf },
      data: {},
    });
    expect(status.status()).toBe(200);
    const statusResult = await status.json();
    expect(statusResult).toMatchObject({
      source: {
        configured: false,
        missingConfiguration: expect.arrayContaining([
          'GOOGLE_ROSTER_SPREADSHEET_ID',
          'GOOGLE_ROSTER_RANGE',
          'GOOGLE_ROSTER_SERVICE_ACCOUNT_EMAIL',
          'GOOGLE_ROSTER_PRIVATE_KEY',
        ]),
      },
      directory: { total: 0, active: 0 },
    });
    expect(JSON.stringify(statusResult)).not.toMatch(/spreadsheetId|privateKey|serviceAccountEmail/iu);

    const adminDenied = await adminContext.post('/api/owner/identity-roster/status', {
      headers: { 'x-csrf-token': adminCsrf },
      data: {},
    });
    expect(adminDenied.status()).toBe(403);
    await expect(adminDenied.json()).resolves.toMatchObject({ code: 'ROSTER_OWNER_REQUIRED' });

    const preview = await ownerContext.post('/api/owner/identity-roster/preview', {
      headers: { 'x-csrf-token': ownerCsrf },
      data: {},
    });
    expect(preview.status()).toBe(503);
    await expect(preview.json()).resolves.toMatchObject({ code: 'ROSTER_SOURCE_NOT_CONFIGURED' });

    const self = await staffContext.post('/api/identity-roster/self', { data: {} });
    expect(self.status()).toBe(200);
    await expect(self.json()).resolves.toMatchObject({ linked: false, profile: null });
  } finally {
    await Promise.all([ownerContext.dispose(), adminContext.dispose(), staffContext.dispose()]);
  }
});

test('shared shell exposes protected System Owner surfaces only to the System Owner', async ({
  browser,
  baseURL,
}) => {
  const ownerPage = await browser.newPage();
  await ownerPage.goto(`${baseURL}/app/admin`);
  await ownerPage.getByLabel('Access ID').fill('LOCAL.OWNER');
  await ownerPage.getByLabel('Password', { exact: true }).fill(PASSWORD);
  await ownerPage.getByRole('button', { name: 'Sign in' }).click();
  await navigateToAdminView(ownerPage, 'referenceAdmin');
  const rosterControl = ownerPage.getByRole('button', {
    name: /USC Officer and Staff Directory/iu,
  });
  await expect(rosterControl).toBeVisible();
  await rosterControl.click();
  await expect(ownerPage.locator('[data-identity-roster]')).toBeVisible();
  await expect(ownerPage.locator('[data-roster-source-state]')).toContainText('fail-closed');
  const systemStatusControl = ownerPage.locator('[data-admin-control-surface="system-status"]');
  await expect(systemStatusControl).toBeVisible();
  await systemStatusControl.click();
  const systemStatus = ownerPage.locator('[data-system-status]');
  await expect(systemStatus).toBeVisible();
  await expect(systemStatus.locator('[data-system-status-metrics] .metric')).toHaveCount(16);
  for (const label of [
    'Overall',
    'Worker / API',
    'Deployed release',
    'D1 schema',
    'Current bindings',
    'Authentication',
    'Email verification',
    'Identity roster sync',
    'Google Drive backup',
    'R2 storage',
    'Evidence failures',
    'Login / rate limits',
    'Inventory alerts',
    'Last successful backup',
    'Last reconciliation',
    'Last rollback rehearsal',
  ]) {
    await expect(systemStatus.locator('[data-system-status-metrics]')).toContainText(label);
  }
  await expect(systemStatus.locator('[data-system-status-technical-details]')).toContainText(
    'Identifier protection',
  );

  const adminPage = await browser.newPage();
  await adminPage.goto(`${baseURL}/app/admin`);
  await adminPage.getByLabel('Access ID').fill('LOCAL.ADMIN');
  await adminPage.getByLabel('Password', { exact: true }).fill(PASSWORD);
  await adminPage.getByRole('button', { name: 'Sign in' }).click();
  await navigateToAdminView(adminPage, 'referenceAdmin');
  await expect(adminPage.getByRole('button', { name: /USC Officer and Staff Directory/iu })).toBeHidden();
  await expect(adminPage.locator('[data-admin-control-surface="system-status"]')).toBeHidden();
  await expect(adminPage.locator('[data-system-status]')).toBeHidden();
  await expect(adminPage.locator('[data-identity-roster]')).toBeHidden();

  await Promise.all([ownerPage.close(), adminPage.close()]);
});

test('Request Center public APIs require an authenticated department session', async ({ request }) => {
  for (const [method, route] of [
    ['get', '/api/public/request/options'],
    ['post', '/api/public/request'],
    ['post', '/api/public/request/track'],
    ['post', '/api/public/request/related'],
  ]) {
    const response = await request[method](route, method === 'post' ? { data: {} } : undefined);
    expect(response.status()).toBe(401);
    await expect(response.json()).resolves.toMatchObject({ code: 'SESSION_REQUIRED' });
  }
  expect((await request.get('/api/portal/request')).status()).toBe(401);
});

test('public Lending Center submits both borrower types without exposing public tracking', async ({
  request,
  baseURL,
}) => {
  const admin = await apiRequest.newContext({ baseURL });
  await login(admin, 'LOCAL.ADMIN');
  const catalogResponse = await request.get('/api/public/lending/catalog');
  expect(catalogResponse.status()).toBe(200);
  const catalog = await catalogResponse.json();
  expect(catalog.uscDepartments).toEqual([
    'Department of Logistics',
    'Department of Finance',
    'Department of Public Communications',
    'Department of Events Management',
    'Department of Business Relations',
    'Office of the President',
    'Office of the Vice President',
    'Office of the Secretary General',
    'Department of Human Resources',
    'Department of Community Extensions Services',
  ]);
  const item = catalog.items.find((entry) =>
    ['AVAILABLE', 'LIMITED', 'ELIGIBILITY_REQUIRED'].includes(entry.availability),
  );
  expect(item).toBeTruthy();
  expect(item).toEqual(
    expect.objectContaining({
      productId: item.id,
      type: expect.stringMatching(/^(REUSABLE|CONSUMABLE)$/u),
      aliases: expect.any(Array),
      dueDateRequired: expect.any(Boolean),
      acknowledgmentRequired: expect.any(Boolean),
      conditionTracked: expect.any(Boolean),
    }),
  );
  expect(item).not.toHaveProperty('availableToPromise');
  expect(item).not.toHaveProperty('onHand');
  expect(item).not.toHaveProperty('reserved');
  expect(item).not.toHaveProperty('onLoan');
  expect(item).not.toHaveProperty('storageLocation');
  const inventoryBefore = await (await admin.get('/api/inventory')).json();
  const balanceBefore = inventoryBefore.data.inventoryItems.find((entry) => entry.id === item.id).onHand;

  const crossOrigin = await request.post('/api/public/lending', {
    headers: { origin: 'https://cross-origin.example.invalid' },
    data: { clientRequestId: `cross-origin-lending-${crypto.randomUUID()}` },
  });
  expect(crossOrigin.status()).toBe(403);

  const clientRequestId = `public-lending-${crypto.randomUUID()}`;
  const command = {
    borrowerType: 'ANGELITE',
    borrowerName: 'Synthetic Angelite Borrower',
    studentId: '12345678',
    courseYear: 'BSIT 2',
    academicDepartment: 'School of Computing',
    contactNumber: '+63 917 000 0010',
    email: `lending-${crypto.randomUUID()}@gmail.com`,
    purpose: 'Synthetic public lending acceptance proof.',
    pickupDate: '2026-08-03',
    dueDate: '2026-08-10',
    responsibilityAcknowledged: true,
    dataUseAcknowledged: true,
    acceptableUseAcknowledged: true,
    borrowerResponsibilityAcknowledged: true,
    evidenceConsentAcknowledged: true,
    lines: [{ itemId: item.id, quantity: 1 }],
    clientRequestId,
  };
  const submitted = await request.post('/api/public/lending', {
    headers: { origin: 'http://127.0.0.1:8787' },
    data: command,
  });
  expect(submitted.status()).toBe(200);
  const receipt = await submitted.json();
  expect(receipt).toMatchObject({ status: 'FOR_REVIEW', replayed: false });
  expect(receipt.submissionId).toMatch(/^LBR-/u);
  expect(receipt).not.toHaveProperty('trackingCode');
  expect(receipt).not.toHaveProperty('ticketId');

  const replay = await request.post('/api/public/lending', {
    headers: { origin: 'http://127.0.0.1:8787' },
    data: command,
  });
  await expect(replay.json()).resolves.toMatchObject({
    submissionId: receipt.submissionId,
    replayed: true,
  });

  const trackingRoute = await request.post('/api/public/lending/track', {
    headers: { origin: 'http://127.0.0.1:8787' },
    data: { submissionId: receipt.submissionId, trackingCode: 'not-issued' },
  });
  expect(trackingRoute.status()).toBe(404);

  const staffSubmitted = await request.post('/api/public/lending', {
    headers: { origin: 'http://127.0.0.1:8787' },
    data: {
      ...command,
      borrowerType: 'USC_STAFF',
      borrowerName: 'Synthetic USC Staff Borrower',
      courseYear: undefined,
      academicDepartment: undefined,
      uscDepartment: 'Department of Logistics',
      positionRole: 'Synthetic Committee Officer',
      email: `staff-lending-${crypto.randomUUID()}@example.invalid`,
      clientRequestId: `public-lending-staff-${crypto.randomUUID()}`,
    },
  });
  expect(staffSubmitted.status()).toBe(200);
  await expect(staffSubmitted.json()).resolves.toMatchObject({
    status: 'FOR_REVIEW',
    replayed: false,
  });

  const inventoryAfter = await (await admin.get('/api/inventory')).json();
  expect(inventoryAfter.data.inventoryItems.find((entry) => entry.id === item.id).onHand).toBe(balanceBefore);
  await admin.dispose();
});

test('Lending Usage and advertisement management enforce role and media boundaries', async ({
  request,
  baseURL,
}) => {
  const admin = await apiRequest.newContext({ baseURL });
  const director = await apiRequest.newContext({ baseURL });
  const inventory = await apiRequest.newContext({ baseURL });
  const food = await apiRequest.newContext({ baseURL });
  const adminCsrf = await login(admin, 'LOCAL.ADMIN');
  await login(director, 'LOCAL.DIRECTOR');
  await login(inventory, 'LOCAL.INVENTORY');
  await login(food, 'LOCAL.FOOD');

  expect((await admin.post('/api/lending/usage', { data: {} })).status()).toBe(200);
  expect((await director.post('/api/lending/usage', { data: {} })).status()).toBe(200);
  expect((await inventory.post('/api/lending/usage', { data: {} })).status()).toBe(200);
  expect((await food.post('/api/lending/usage', { data: {} })).status()).toBe(403);
  expect((await director.post('/api/admin/advertisements/list', { data: {} })).status()).toBe(403);

  const advertisementId = `ADV-LOCAL-${crypto.randomUUID().replaceAll('-', '').slice(0, 12)}`.toUpperCase();
  const draft = await admin.post('/api/admin/advertisements/save', {
    headers: { 'x-csrf-token': adminCsrf },
    data: {
      id: advertisementId,
      title: 'Synthetic governed announcement',
      description: 'Local acceptance only.',
      altText: 'Synthetic governed announcement artwork.',
      callToAction: 'View announcement',
      destinationUrl: 'https://example.invalid/announcement',
      status: 'DRAFT',
      displayOrder: 99,
      clientRequestId: `advertisement-save-${crypto.randomUUID()}`,
    },
  });
  expect(draft.status()).toBe(200);

  const invalidMedia = await admin.post('/api/admin/advertisements/upload', {
    headers: { 'x-csrf-token': adminCsrf },
    data: {
      id: advertisementId,
      contentType: 'image/png',
      base64: Buffer.alloc(40, 1).toString('base64'),
      clientRequestId: `advertisement-invalid-media-${crypto.randomUUID()}`,
    },
  });
  expect(invalidMedia.status()).toBe(422);

  const pngBytes = Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    Buffer.alloc(40, 0),
  ]);
  const uploaded = await admin.post('/api/admin/advertisements/upload', {
    headers: { 'x-csrf-token': adminCsrf },
    data: {
      id: advertisementId,
      contentType: 'image/png',
      base64: pngBytes.toString('base64'),
      clientRequestId: `advertisement-media-${crypto.randomUUID()}`,
    },
  });
  expect(uploaded.status()).toBe(200);

  const activateCommand = {
    id: advertisementId,
    title: 'Synthetic governed announcement',
    description: 'Local acceptance only.',
    altText: 'Synthetic governed announcement artwork.',
    callToAction: 'View announcement',
    destinationUrl: 'https://example.invalid/announcement',
    status: 'ACTIVE',
    displayOrder: 99,
    clientRequestId: `advertisement-activate-${crypto.randomUUID()}`,
  };
  const activated = await admin.post('/api/admin/advertisements/save', {
    headers: { 'x-csrf-token': adminCsrf },
    data: activateCommand,
  });
  expect(activated.status()).toBe(200);
  const publicAdvertisements = await (await request.get('/api/public/advertisements')).json();
  expect(publicAdvertisements.items.find((item) => item.id === advertisementId)).toEqual(
    expect.objectContaining({
      title: activateCommand.title,
      imageUrl: `/media/advertisements/${advertisementId}`,
    }),
  );
  const publicMedia = await request.get(`/media/advertisements/${advertisementId}`);
  expect(publicMedia.status()).toBe(200);
  expect(publicMedia.headers()['content-type']).toBe('image/png');

  const archived = await admin.post('/api/admin/advertisements/archive', {
    headers: { 'x-csrf-token': adminCsrf },
    data: {
      id: advertisementId,
      clientRequestId: `advertisement-archive-${crypto.randomUUID()}`,
    },
  });
  expect(archived.status()).toBe(200);
  const publicAfterArchive = await (await request.get('/api/public/advertisements')).json();
  expect(publicAfterArchive.items.some((item) => item.id === advertisementId)).toBe(false);

  await Promise.all([admin.dispose(), director.dispose(), inventory.dispose(), food.dispose()]);
});

test('Admin and Director govern event hierarchy while unauthorized roles remain read-only', async ({
  baseURL,
  page,
}) => {
  const admin = await apiRequest.newContext({ baseURL });
  const director = await apiRequest.newContext({ baseURL });
  const food = await apiRequest.newContext({ baseURL });
  const adminCsrf = await login(admin, 'LOCAL.ADMIN');
  const directorCsrf = await login(director, 'LOCAL.DIRECTOR');
  const foodCsrf = await login(food, 'LOCAL.FOOD');
  const suffix = crypto.randomUUID();

  const createdSeries = await mutate(admin, adminCsrf, 'saveEventSeries', {
    clientRequestId: `event-series-${suffix}`,
    name: 'Local Event Management Acceptance 2099',
    year: 2099,
    status: 'ACTIVE',
    sourceReference: 'Synthetic local acceptance source',
    supersedesReference: 'Synthetic earlier planning schedule',
    reason: 'Synthetic local event management acceptance.',
  });
  expect(createdSeries.status()).toBe(200);
  const series = await createdSeries.json();
  expect(series.code).toMatch(/-2099(?:-|$)/u);

  const createdDay = await mutate(director, directorCsrf, 'saveEventDay', {
    clientRequestId: `event-day-${suffix}`,
    eventSeriesId: series.eventSeriesId,
    date: '2099-09-01',
    status: 'UPCOMING',
    reason: 'Synthetic local event day acceptance.',
  });
  expect(createdDay.status()).toBe(200);
  const day = await createdDay.json();

  const createdActivity = await mutate(admin, adminCsrf, 'saveEventActivity', {
    clientRequestId: `event-activity-${suffix}`,
    eventDayId: day.eventDayId,
    name: 'Synthetic TBA Workshop',
    activityType: 'Workshop',
    includedItems: ['Synthetic included activity'],
    timeStatus: 'TBA',
    venue: 'Synthetic Local Venue',
    status: 'UPCOMING',
    sourceReference: 'Synthetic local acceptance source',
    reason: 'Synthetic local activity acceptance.',
  });
  expect(createdActivity.status()).toBe(200);
  const activity = await createdActivity.json();
  expect(activity).toMatchObject({
    timeStatus: 'TBA',
    ownerReviewStatus: 'OWNER_REVIEW_REQUIRED',
  });

  const directoryResponse = await mutate(director, directorCsrf, 'getEventManagement', {});
  expect(directoryResponse.status()).toBe(200);
  const directory = await directoryResponse.json();
  expect(directory.eventSeries).toContainEqual(
    expect.objectContaining({ id: series.eventSeriesId, name: 'Local Event Management Acceptance 2099' }),
  );
  expect(directory.activities).toContainEqual(
    expect.objectContaining({
      id: activity.activityId,
      eventDayId: day.eventDayId,
      includedItems: ['Synthetic included activity'],
      timeStatus: 'TBA',
      startAt: null,
      endAt: null,
      responsibleCommitteeId: null,
      readinessPercentage: null,
      preparationProgress: null,
      ownerReviewStatus: 'OWNER_REVIEW_REQUIRED',
    }),
  );
  expect(directory.history).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ entityId: series.eventSeriesId, action: 'CREATED' }),
      expect.objectContaining({ entityId: activity.activityId, action: 'CREATED' }),
    ]),
  );

  await page.goto('/app/director');
  await page.getByLabel('Access ID').fill('LOCAL.DIRECTOR');
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByText('NaN% overall', { exact: true })).toHaveCount(0);
  const tbaOverview = page.locator('.subevent').filter({ hasText: 'Synthetic TBA Workshop' });
  await expect(tbaOverview).toBeVisible();
  await expect(tbaOverview).toContainText('TBA');
  await expect(tbaOverview.getByText('Not assessed', { exact: true })).toHaveCount(2);
  await expect(tbaOverview).toContainText('Not added yet');

  const submittedRequest = await mutate(admin, adminCsrf, 'submitRequest', {
    clientRequestId: `event-linked-request-${suffix}`,
    requestType: 'EVENT_LOGISTICS',
    eventSeriesId: series.eventSeriesId,
    eventId: activity.activityId,
    purpose: 'Synthetic event-link acceptance',
    lines: [
      {
        clientLineId: `event-link-line-${suffix}`,
        description: 'Synthetic linked material',
        quantity: 1,
        unit: 'piece',
        fulfillmentSource: 'FOR_CANVASSING',
      },
    ],
  });
  expect(submittedRequest.status()).toBe(200);
  const requestResult = await submittedRequest.json();
  const linked = await mutate(admin, adminCsrf, 'linkEventOperationalRecord', {
    clientRequestId: `event-operational-link-${suffix}`,
    activityId: activity.activityId,
    linkType: 'REQUEST',
    linkedEntityId: requestResult.requestId,
    reason: 'Synthetic event operational-link acceptance.',
  });
  expect(linked.status()).toBe(200);
  const linkedDirectory = await (await mutate(director, directorCsrf, 'getEventManagement', {})).json();
  expect(linkedDirectory.links).toContainEqual(
    expect.objectContaining({
      activityId: activity.activityId,
      linkType: 'REQUEST',
      linkedEntityId: requestResult.requestId,
    }),
  );
  expect(linkedDirectory.history).toContainEqual(
    expect.objectContaining({ entityId: (await linked.json()).linkId, action: 'LINKED' }),
  );

  const denied = await mutate(food, foodCsrf, 'saveEventActivity', {
    clientRequestId: `event-denied-${suffix}`,
    eventDayId: day.eventDayId,
    name: 'Unauthorized activity',
    activityType: 'Workshop',
    timeStatus: 'TBA',
    venue: 'Blocked',
    reason: 'Synthetic authorization denial coverage.',
  });
  expect(denied.status()).toBe(403);
  await expect(denied.json()).resolves.toMatchObject({ code: 'CAPABILITY_REQUIRED' });

  await Promise.all([admin.dispose(), director.dispose(), food.dispose()]);
});

test('event management renders truthful unknown fields on the protected mobile path', async ({ page }) => {
  await page.goto('/app/director');
  await page.getByLabel('Access ID').fill('LOCAL.DIRECTOR');
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await page.getByRole('button', { name: 'Manage Events' }).click();
  const management = page.locator('[data-event-management]');
  await expect(management).toBeVisible();
  await expect(management.getByRole('heading', { name: 'Event Management', exact: true })).toBeVisible();
  await expect(management.getByText('Synthetic TBA Workshop')).toBeVisible();
  await expect(management.getByText('TBA · Synthetic Local Venue')).toBeVisible();
  const tbaActivity = management
    .locator('.event-activity-card')
    .filter({ hasText: 'Synthetic TBA Workshop' });
  await expect(tbaActivity.getByText('Not assessed', { exact: true })).toHaveCount(2);
  await expect(tbaActivity.getByText('Not added yet', { exact: true }).first()).toBeVisible();
  await expect(management.getByRole('heading', { name: 'Activity History' })).toBeVisible();

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.reload();
  await page.getByRole('button', { name: 'Manage Events' }).click();
  await expect(page.locator('[data-event-management]').getByText('Synthetic TBA Workshop')).toBeVisible();
  await expect(
    page
      .locator('[data-event-management] .event-activity-card')
      .filter({ hasText: 'Synthetic TBA Workshop' })
      .locator('.event-truth-grid'),
  ).toHaveCSS('grid-template-columns', /\d+(?:\.\d+)?px \d+(?:\.\d+)?px/u);
});

for (const [accessId, experience, workspace] of roles) {
  test(`${accessId} receives only the server-routed ${experience} experience`, async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Access ID').fill(accessId);
    await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.locator('.app-shell')).toBeVisible();
    await expect(page.locator('body')).toHaveAttribute('data-experience', experience);
    await expect(page.locator('body')).not.toHaveAttribute('data-bootstrap-failed', 'true');
    await expect(page.locator('#loading')).not.toHaveAttribute('data-state', 'error');
    const shell = page.locator('[data-internal-shell-context]');
    await shell.locator('.shell-account > summary').click();
    await expect(shell.getByRole('button', { name: 'Sign out' })).toBeVisible();
    await page.goto(`/app/${workspace}/requests`);
    await expect(page.locator('#request')).toBeVisible();
    await expect(page.locator('body')).toHaveAttribute('data-experience', experience);
  });
}

test('System Owner changes governed operational scope without losing identity or workspace routing', async ({
  page,
}) => {
  await page.goto('/app/admin');
  await page.getByLabel('Access ID').fill('LOCAL.OWNER');
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();

  const shell = page.locator('[data-internal-shell-context]');
  const workspace = shell.getByLabel('Workspace');
  const scope = shell.getByLabel('Operational scope');
  await expect(shell.locator('[data-shell-account-role]')).toHaveText('System Owner');
  await expect(workspace.locator('option').first()).toContainText('Control Center');
  await expect(workspace.locator('option').nth(1)).toContainText('Department oversight');
  await expect(scope.locator('option')).not.toHaveCount(1);
  await scope.selectOption('COMMITTEE:COM_FOOD');
  await expect(scope).toHaveValue('COMMITTEE:COM_FOOD');
  await expect(scope).toBeFocused();
  await expect(page).toHaveURL(/scope=COMMITTEE%3ACOM_FOOD/u);
  await expect(shell.locator('[data-shell-context-announcement]')).toHaveText(
    'Operational scope changed to Food Committee.',
  );
  await expect(shell.locator('[data-shell-account-role]')).toHaveText('System Owner');

  await workspace.selectOption('materials');
  await expect(page).toHaveURL(/\/app\/materials\?scope=COMMITTEE%3ACOM_FOOD$/u);
  await expect(shell.locator('[data-shell-account-role]')).toHaveText('System Owner');
  await expect(shell.locator('[data-shell-account-viewing]')).toHaveText(
    'Viewing: Materials & Documentation',
  );
});

test('System Owner opens and refreshes every real workspace without impersonation', async ({ page }) => {
  await page.goto('/app/admin');
  await page.getByLabel('Access ID').fill('LOCAL.OWNER');
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();

  for (const [path, workspace, experience, label] of [
    ['/app/admin', 'administrator', 'administrator', 'Administrator'],
    ['/app/director', 'director', 'director', 'Director'],
    ['/app/food', 'food', 'food', 'Food Committee'],
    ['/app/inventory', 'inventory-pantry', 'inventory-pantry', 'Inventory & Pantry'],
    ['/app/materials', 'materials', 'materials', 'Materials & Documentation'],
  ]) {
    await page.goto(path);
    const shell = page.locator('[data-internal-shell-context]');
    await expect(shell.getByLabel('Workspace')).toHaveValue(workspace);
    await expect(shell.locator('[data-shell-account-role]')).toHaveText('System Owner');
    await expect(shell.locator('[data-shell-account-viewing]')).toHaveText(`Viewing: ${label}`);
    await expect(page.locator('body')).toHaveAttribute('data-experience', experience);
    await page.reload();
    await expect(shell.locator('[data-shell-account-role]')).toHaveText('System Owner');
    await expect(page.locator('body')).not.toHaveAttribute('data-bootstrap-failed', 'true');
  }
});

test('Inventory operator receives authoritative D1 balances and bounded movement projections in the real workspace', async ({
  page,
  request,
}) => {
  await login(request, 'LOCAL.INVENTORY');
  const moduleResponse = await request.post('/api/getBootstrapModule', {
    data: { module: 'inventory', page: 1, pageSize: 10 },
  });
  expect(moduleResponse.status()).toBe(200);
  const moduleData = await moduleResponse.json();
  expect(moduleData).toMatchObject({
    ok: true,
    module: 'inventory',
    data: {
      inventoryItems: expect.any(Array),
      ledgerTransactions: expect.any(Array),
      inventoryAssets: expect.any(Array),
      assetMaintenanceHistory: expect.any(Array),
      assetMovementHistory: expect.any(Array),
    },
  });
  expect(moduleData.data.ledgerTransactions.length).toBeLessThanOrEqual(100);
  expect(moduleData.data.inventoryAssets.length).toBeLessThanOrEqual(100);
  expect(moduleData.data.assetMaintenanceHistory.length).toBeLessThanOrEqual(100);
  expect(moduleData.data.assetMovementHistory.length).toBeLessThanOrEqual(100);
  const authoritative = moduleData.data.inventoryItems.find((item) => item.id === 'ITM-LOCAL-001');
  expect(authoritative).toEqual(
    expect.objectContaining({
      onHand: expect.any(Number),
      reserved: expect.any(Number),
      availableToPromise: expect.any(Number),
    }),
  );

  await page.goto('/app/inventory');
  await page.getByLabel('Access ID').fill('LOCAL.INVENTORY');
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.locator('#loading')).toHaveClass(/hidden/u);
  await expect(page.locator('body')).toHaveAttribute('data-experience', 'inventory-pantry');
  const panel = page.locator('#roleExperiencePanel[data-role-experience="inventory-pantry"]');
  await expect(panel.getByRole('heading', { name: 'Inventory Overview' })).toBeVisible();
  await panel.locator('.role-experience-actions [data-inventory-destination="inventory-management"]').click();
  await expect(page.locator('#inventoryTable')).toContainText('ITM-LOCAL-001');
  await expect(page.locator('#inventoryTable')).toContainText(
    `On hand ${authoritative.onHand} · Reserved ${authoritative.reserved} · ATP ${authoritative.availableToPromise} ${authoritative.unit}`,
  );
  const classificationQueue = page.locator('[data-inventory-classification-queue]');
  await expect(classificationQueue.getByRole('heading', { name: 'Needs Classification' })).toBeVisible();
  await classificationQueue.locator('[data-classification-status]').selectOption('ALL');
  await classificationQueue.getByLabel('Search classification queue').fill('ITM-LOCAL-CLASSIFY');
  await expect(classificationQueue).toContainText('ITM-LOCAL-CLASSIFY');
  await classificationQueue.getByRole('button', { name: 'Review' }).first().click();
  await expect(page.getByRole('heading', { name: /Classify ITM-LOCAL-CLASSIFY/u })).toBeVisible();
  await expect(page.getByLabel('Review status')).toBeVisible();
  await expect(page.getByText('Opening quantity is never converted into asset instances.')).toBeVisible();
});

test('Materials queue projects canonical deliverables and fails closed across committee scope', async ({
  baseURL,
}) => {
  const materials = await apiRequest.newContext({ baseURL });
  const inventory = await apiRequest.newContext({ baseURL });
  try {
    const materialsCsrf = await login(materials, 'LOCAL.MATERIALS');
    const materialsQueue = await materials.post('/api/getMaterialsWorkQueue', {
      headers: { 'x-csrf-token': materialsCsrf },
      data: {},
    });
    expect(materialsQueue.status()).toBe(200);
    const materialsQueueBody = await materialsQueue.json();
    expect(materialsQueueBody).toMatchObject({
      ok: true,
      committeeId: 'COM_MATERIALS',
      items: expect.any(Array),
    });
    const projected = materialsQueueBody.items.find((item) => item.deliverableId === 'DEL-LOCAL-001');
    expect(projected).toMatchObject({
      deliverableId: 'DEL-LOCAL-001',
      requestId: 'REQ-LOCAL-RECEIVING',
      requestLineId: 'LIN-LOCAL-RECEIVING',
      eventId: 'EVT-LOCAL',
      status: 'PROCURED',
      quantityRequested: 10,
      quantityReceived: 0,
      quantityReleased: 0,
    });
    expect(typeof projected.quoteSummary.activeCount).toBe('number');
    expect(typeof projected.quoteSummary.distinctUnits).toBe('number');

    const inventoryCsrf = await login(inventory, 'LOCAL.INVENTORY');
    const inventoryQueue = await inventory.post('/api/getMaterialsWorkQueue', {
      headers: { 'x-csrf-token': inventoryCsrf },
      data: {},
    });
    expect(inventoryQueue.status()).toBe(200);
    await expect(inventoryQueue.json()).resolves.toMatchObject({ items: [] });
  } finally {
    await Promise.all([materials.dispose(), inventory.dispose()]);
  }
});

test('Administrator reaches Access Management when the legacy reference endpoint is unavailable', async ({
  page,
}) => {
  await page.goto('/app/admin');
  await page.getByLabel('Access ID').fill('LOCAL.ADMIN');
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.locator('.app-shell')).toBeVisible();

  await navigateToAdminView(page, 'referenceAdmin');
  await expect(page.locator('#referenceAdminWorkspace')).toBeVisible();
  await page.getByRole('button', { name: /Access Management/u }).click();
  await expect(page.locator('[data-access-management]')).toBeVisible();
  await expect(page.locator('[data-access-results] .access-account-row').first()).toBeVisible();
});

test('starter activation rotates into a normal session and logout revokes it', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Access ID').fill('LOCAL.STARTER');
  await page.getByLabel('Password', { exact: true }).fill(TEMPORARY_PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.getByRole('heading', { name: 'Secure your account' })).toBeVisible();

  const activation = page.locator('#authActivationForm');
  await activation.getByLabel('Full name').fill('Local Starter Operator');
  await activation.getByLabel('Mobile number').fill('+63 917 000 0000');
  await activation.getByLabel('Email address').fill('local-starter@example.invalid');
  await activation.getByLabel('New password').fill(ACTIVATED_PASSWORD);
  await activation.getByLabel('Confirm password').fill(ACTIVATED_PASSWORD);
  await activation.getByRole('button', { name: 'Activate account' }).click();

  await expect(page.locator('.app-shell')).toBeVisible();
  await expect(page.locator('body')).toHaveAttribute('data-experience', 'food');
  const shell = page.locator('[data-internal-shell-context]');
  await shell.locator('.shell-account > summary').click();
  await shell.getByRole('button', { name: 'Sign out' }).click();
  await expect(page.getByLabel('Access ID')).toBeVisible();
  const sessionAfterLogout = await page.evaluate(async () => {
    const response = await fetch('/api/session', { credentials: 'include' });
    return { status: response.status, body: await response.json() };
  });
  expect(sessionAfterLogout).toMatchObject({
    status: 401,
    body: { code: 'SESSION_REQUIRED' },
  });
  await page.goBack();
  await expect(page).not.toHaveURL(/\/app\//u);
  await page.goto('/');
  await expect(page.getByLabel('Access ID')).toBeVisible();
  await expect(page.locator('.app-shell')).toBeHidden();
});

test('Administrator Access Management renames an Access ID once and revokes prior sessions', async () => {
  const baseURL = process.env.HAU_CLOUDFLARE_BASE_URL || 'http://127.0.0.1:8787';
  const admin = await apiRequest.newContext({ baseURL });
  const target = await apiRequest.newContext({ baseURL });
  const fresh = await apiRequest.newContext({ baseURL });
  try {
    const adminCsrf = await login(admin, 'LOCAL.ADMIN');
    const targetCsrf = await login(target, 'LOCAL.FOOD');

    const denied = await target.post('/api/admin/access/directory', {
      headers: { 'x-csrf-token': targetCsrf },
      data: { query: '', page: 1, pageSize: 20 },
    });
    expect(denied.status()).toBe(403);

    const directory = await admin.post('/api/admin/access/directory', {
      headers: { 'x-csrf-token': adminCsrf },
      data: { query: 'LOCAL.FOOD', status: 'ALL', page: 1, pageSize: 20 },
    });
    expect(directory.status()).toBe(200);
    await expect(directory.json()).resolves.toMatchObject({
      ok: true,
      items: [
        {
          accessId: 'LOCAL.FOOD',
          roleId: 'DOL_STAFF',
          committeeIds: ['COM_FOOD'],
        },
      ],
    });

    const command = {
      currentAccessId: 'LOCAL.FOOD',
      confirmCurrentAccessId: 'LOCAL.FOOD',
      proposedAccessId: 'LOCAL.FOOD.RENAMED',
      reason: 'Synthetic Access ID rename regression coverage.',
      idempotencyKey: 'local-access-id-change-0001',
    };
    const preview = await admin.post('/api/admin/access/preview-access-id', {
      headers: { 'x-csrf-token': adminCsrf },
      data: command,
    });
    expect(preview.status()).toBe(200);
    await expect(preview.json()).resolves.toMatchObject({
      normalizationPreview: 'LOCAL.FOOD.RENAMED',
      immutableAccountIdPreserved: true,
      roleAndCapabilitiesUnchanged: true,
    });

    const changed = await admin.post('/api/admin/access/change-access-id', {
      headers: { 'x-csrf-token': adminCsrf },
      data: command,
    });
    expect(changed.status()).toBe(200);
    await expect(changed.json()).resolves.toMatchObject({
      changed: true,
      replayed: false,
      sessionsRevoked: true,
    });

    const revokedSession = await target.get('/api/requests');
    expect(revokedSession.status()).toBe(401);
    const oldLogin = await fresh.post('/api/auth/login', {
      data: { accessId: 'LOCAL.FOOD', password: PASSWORD },
    });
    expect(oldLogin.status()).toBe(401);
    const newLogin = await fresh.post('/api/auth/login', {
      data: { accessId: 'LOCAL.FOOD.RENAMED', password: PASSWORD },
    });
    expect(newLogin.status()).toBe(200);

    const replay = await admin.post('/api/admin/access/change-access-id', {
      headers: { 'x-csrf-token': adminCsrf },
      data: command,
    });
    expect(replay.status()).toBe(200);
    await expect(replay.json()).resolves.toMatchObject({ changed: true, replayed: true });

    const history = await admin.post('/api/admin/access/history', {
      headers: { 'x-csrf-token': adminCsrf },
      data: { currentAccessId: 'LOCAL.FOOD.RENAMED' },
    });
    expect(history.status()).toBe(200);
    const historyResult = await history.json();
    expect(historyResult.history).toHaveLength(1);
    expect(historyResult.auditHistory).toEqual(
      expect.arrayContaining([expect.objectContaining({ action: 'ACCESS_ID_CHANGED' })]),
    );
    expect(historyResult.history[0]).toMatchObject({
      oldAccessId: 'LOCAL.FOOD',
      newAccessId: 'LOCAL.FOOD.RENAMED',
      environment: 'DEVELOPMENT',
    });

    const collision = await admin.post('/api/admin/access/preview-access-id', {
      headers: { 'x-csrf-token': adminCsrf },
      data: {
        currentAccessId: 'LOCAL.FOOD.RENAMED',
        confirmCurrentAccessId: 'LOCAL.FOOD.RENAMED',
        proposedAccessId: 'LOCAL_ADMIN',
      },
    });
    expect(collision.status()).toBe(409);
    await expect(collision.json()).resolves.toMatchObject({ code: 'ACCESS_ID_COLLISION' });
  } finally {
    await Promise.all([admin.dispose(), target.dispose(), fresh.dispose()]);
  }
});

test('System Owner assigns effective workspace policy and direct routes fail closed', async ({
  page,
  baseURL,
}) => {
  const owner = await apiRequest.newContext({ baseURL });
  const admin = await apiRequest.newContext({ baseURL });
  const managed = page.context().request;
  try {
    const ownerCsrf = await login(owner, 'LOCAL.OWNER');
    const adminCsrf = await login(admin, 'LOCAL.ADMIN');
    const options = await owner.post('/api/admin/access/options', {
      headers: { 'x-csrf-token': ownerCsrf },
      data: {},
    });
    expect(options.status()).toBe(200);
    await expect(options.json()).resolves.toMatchObject({
      workspaces: expect.arrayContaining([
        expect.objectContaining({ id: 'administrator' }),
        expect.objectContaining({ id: 'materials' }),
      ]),
      presets: expect.arrayContaining([expect.objectContaining({ id: 'MATERIALS_OPERATOR' })]),
    });

    const created = await owner.post('/api/admin/access/create-account', {
      headers: { 'x-csrf-token': ownerCsrf },
      data: {
        generateAccessId: true,
        presetId: 'MATERIALS_OPERATOR',
        roleId: 'DOL_STAFF',
        committeeIds: ['COM_MATERIALS'],
        defaultCommitteeId: 'COM_MATERIALS',
        workspaceIds: ['materials'],
        defaultWorkspaceId: 'materials',
        status: 'STARTER',
        temporaryPasswordHours: 24,
        reason: 'Create the synthetic advanced access policy account.',
        confirmed: true,
      },
    });
    expect(created.status()).toBe(200);
    const createdResult = await created.json();
    expect(createdResult.account).toMatchObject({
      accessId: 'DOL-2026-0001',
      roleId: 'DOL_STAFF',
      committeeIds: ['COM_MATERIALS'],
      accessProfile: {
        presetId: 'MATERIALS_OPERATOR',
        workspaceIds: ['materials'],
        defaultWorkspaceId: 'materials',
      },
    });

    const starter = await managed.post('/api/auth/login', {
      data: {
        accessId: createdResult.account.accessId,
        password: createdResult.credential.temporaryPassword,
      },
    });
    expect(starter.status()).toBe(200);
    const starterResult = await starter.json();
    expect(starterResult.state).toBe('ACTIVATION_REQUIRED');
    const activated = await managed.post('/api/auth/activate', {
      headers: { 'x-csrf-token': starterResult.csrfToken },
      data: {
        profile: {
          fullName: 'Synthetic Advanced Access Operator',
          mobileNumber: '+63 917 000 0014',
          email: 'local-advanced-access@example.invalid',
        },
        password: MANAGED_ACTIVATED_PASSWORD,
        confirmPassword: MANAGED_ACTIVATED_PASSWORD,
      },
    });
    expect(activated.status()).toBe(200);

    const command = {
      currentAccessId: createdResult.account.accessId,
      confirmCurrentAccessId: createdResult.account.accessId,
      presetId: 'FOOD_OPERATOR',
      roleId: 'DOL_STAFF',
      committeeIds: ['COM_FOOD'],
      defaultCommitteeId: 'COM_FOOD',
      workspaceIds: ['food'],
      defaultWorkspaceId: 'food',
      locationScopeIds: [],
      eventSeriesScopeIds: [],
      eventScopeIds: [],
      capabilityGrants: [],
      capabilityDenies: ['lending.usage.view'],
      reason: 'Move the synthetic operator to the governed Food policy.',
    };
    const sensitiveDenied = await admin.post('/api/admin/access/preview-policy', {
      headers: { 'x-csrf-token': adminCsrf },
      data: { ...command, capabilityGrants: ['system.admin'] },
    });
    expect(sensitiveDenied.status()).toBe(403);
    await expect(sensitiveDenied.json()).resolves.toMatchObject({
      code: 'OWNER_APPROVAL_REQUIRED',
    });
    const preview = await owner.post('/api/admin/access/preview-policy', {
      headers: { 'x-csrf-token': ownerCsrf },
      data: command,
    });
    expect(preview.status()).toBe(200);
    await expect(preview.json()).resolves.toMatchObject({
      workspaceIds: ['food'],
      defaultWorkspaceId: 'food',
      committeeIds: ['COM_FOOD'],
      explicitDenies: ['lending.usage.view'],
      sessionImpact: 'ALL_ACTIVE_SESSIONS_REVOKED',
    });
    const updated = await owner.post('/api/admin/access/update-policy', {
      headers: { 'x-csrf-token': ownerCsrf },
      data: { ...command, idempotencyKey: 'local-access-policy-change-0001' },
    });
    expect(updated.status()).toBe(200);
    await expect(updated.json()).resolves.toMatchObject({
      changed: true,
      replayed: false,
      sessionsRevoked: true,
    });
    expect((await managed.get('/api/requests')).status()).toBe(401);

    const relogin = await managed.post('/api/auth/login', {
      data: { accessId: createdResult.account.accessId, password: MANAGED_ACTIVATED_PASSWORD },
    });
    expect(relogin.status()).toBe(200);
    await expect(relogin.json()).resolves.toMatchObject({
      user: {
        experienceId: 'food',
        authorization: {
          workspaceIds: ['food'],
          defaultWorkspaceId: 'food',
          committeeIds: ['COM_FOOD'],
          explicitDenies: ['lending.usage.view'],
        },
      },
    });

    await page.goto('/app/materials');
    await expect(page).toHaveURL(/\/app\/food$/u);
    await expect(page.locator('body')).toHaveAttribute('data-experience', 'food');
    const workspace = page.locator('[data-internal-shell-context]').getByLabel('Workspace');
    await expect(workspace).toHaveValue('food');
    await expect(workspace.locator('option[value="materials"]')).toHaveAttribute('disabled', '');
  } finally {
    await Promise.all([owner.dispose(), admin.dispose()]);
  }
});

test('Administrator Access Management governs the staging account lifecycle and safe audit history', async () => {
  const baseURL = process.env.HAU_CLOUDFLARE_BASE_URL || 'http://127.0.0.1:8787';
  const admin = await apiRequest.newContext({ baseURL });
  const managed = await apiRequest.newContext({ baseURL });
  const anonymous = await apiRequest.newContext({ baseURL });
  try {
    const adminCsrf = await login(admin, 'LOCAL.ADMIN');
    const unauthenticatedDirectory = await anonymous.post('/api/admin/access/directory', {
      data: { query: '', page: 1, pageSize: 20 },
    });
    expect(unauthenticatedDirectory.status()).toBe(401);

    const created = await admin.post('/api/admin/access/create-account', {
      headers: { 'x-csrf-token': adminCsrf },
      data: {
        accessId: 'LOCAL.ACCESS.ACTIONS',
        roleId: 'DOL_STAFF',
        committeeIds: ['COM_MATERIALS'],
        defaultCommitteeId: 'COM_MATERIALS',
        reason: 'Synthetic governed account lifecycle regression coverage.',
        confirmed: true,
      },
    });
    expect(created.status()).toBe(200);
    const createdResult = await created.json();
    expect(createdResult).toMatchObject({
      created: true,
      account: {
        accessId: 'LOCAL.ACCESS.ACTIONS',
        roleId: 'DOL_STAFF',
        committeeIds: ['COM_MATERIALS'],
        firstLoginPending: true,
      },
    });
    const generatedTemporaryPassword = createdResult.credential.temporaryPassword;

    const starterLogin = await managed.post('/api/auth/login', {
      data: { accessId: 'LOCAL.ACCESS.ACTIONS', password: generatedTemporaryPassword },
    });
    expect(starterLogin.status()).toBe(200);
    const starterResult = await starterLogin.json();
    expect(starterResult.state).toBe('ACTIVATION_REQUIRED');
    const activated = await managed.post('/api/auth/activate', {
      headers: { 'x-csrf-token': starterResult.csrfToken },
      data: {
        profile: {
          fullName: 'Synthetic Managed Operator',
          mobileNumber: '+63 917 000 0001',
          email: 'local-access-actions@example.invalid',
        },
        password: MANAGED_ACTIVATED_PASSWORD,
        confirmPassword: MANAGED_ACTIVATED_PASSWORD,
      },
    });
    expect(activated.status()).toBe(200);
    expect((await activated.json()).state).toBe('AUTHENTICATED');

    const filteredDirectory = await admin.post('/api/admin/access/directory', {
      headers: { 'x-csrf-token': adminCsrf },
      data: {
        query: 'Managed Operator',
        role: 'DOL_STAFF',
        committee: 'COM_MATERIALS',
        status: 'ACTIVE',
        sort: 'lastLogin',
        direction: 'desc',
        page: 1,
        pageSize: 5,
      },
    });
    expect(filteredDirectory.status()).toBe(200);
    await expect(filteredDirectory.json()).resolves.toMatchObject({
      items: [{ accessId: 'LOCAL.ACCESS.ACTIONS', status: 'ACTIVE' }],
      pagination: { page: 1, pageSize: 5, total: 1 },
    });

    const disable = await admin.post('/api/admin/access/status', {
      headers: { 'x-csrf-token': adminCsrf },
      data: {
        currentAccessId: 'LOCAL.ACCESS.ACTIONS',
        confirmCurrentAccessId: 'LOCAL.ACCESS.ACTIONS',
        status: 'DISABLED',
        reason: 'Synthetic disable account lifecycle proof.',
      },
    });
    expect(disable.status()).toBe(200);
    expect((await managed.get('/api/requests')).status()).toBe(401);
    const disabledLogin = await anonymous.post('/api/auth/login', {
      data: { accessId: 'LOCAL.ACCESS.ACTIONS', password: MANAGED_ACTIVATED_PASSWORD },
    });
    expect(disabledLogin.status()).toBe(403);

    const enable = await admin.post('/api/admin/access/status', {
      headers: { 'x-csrf-token': adminCsrf },
      data: {
        currentAccessId: 'LOCAL.ACCESS.ACTIONS',
        confirmCurrentAccessId: 'LOCAL.ACCESS.ACTIONS',
        status: 'ACTIVE',
        reason: 'Synthetic enable account lifecycle proof.',
      },
    });
    expect(enable.status()).toBe(200);

    const archived = await admin.post('/api/admin/access/status', {
      headers: { 'x-csrf-token': adminCsrf },
      data: {
        currentAccessId: 'LOCAL.ACCESS.ACTIONS',
        confirmCurrentAccessId: 'LOCAL.ACCESS.ACTIONS',
        status: 'REVOKED',
        lifecycleAction: 'ARCHIVE',
        reason: 'Synthetic archive preserves account and audit history.',
      },
    });
    expect(archived.status()).toBe(200);
    await expect(archived.json()).resolves.toMatchObject({
      archived: true,
      status: 'REVOKED',
      sessionsRevoked: true,
    });
    expect(
      (
        await anonymous.post('/api/auth/login', {
          data: { accessId: 'LOCAL.ACCESS.ACTIONS', password: MANAGED_ACTIVATED_PASSWORD },
        })
      ).status(),
    ).toBe(403);
    const restoreArchived = await admin.post('/api/admin/access/status', {
      headers: { 'x-csrf-token': adminCsrf },
      data: {
        currentAccessId: 'LOCAL.ACCESS.ACTIONS',
        confirmCurrentAccessId: 'LOCAL.ACCESS.ACTIONS',
        status: 'ACTIVE',
        reason: 'Synthetic restore after archive lifecycle proof.',
      },
    });
    expect(restoreArchived.status()).toBe(200);
    const managedCsrf = await login(managed, 'LOCAL.ACCESS.ACTIONS', MANAGED_ACTIVATED_PASSWORD);

    const revoked = await admin.post('/api/admin/access/revoke-sessions', {
      headers: { 'x-csrf-token': adminCsrf },
      data: {
        currentAccessId: 'LOCAL.ACCESS.ACTIONS',
        confirmCurrentAccessId: 'LOCAL.ACCESS.ACTIONS',
        reason: 'Synthetic revoke sessions lifecycle proof.',
      },
    });
    expect(revoked.status()).toBe(200);
    expect((await managed.get('/api/requests', { headers: { 'x-csrf-token': managedCsrf } })).status()).toBe(
      401,
    );

    const reset = await admin.post('/api/admin/access/reset-password', {
      headers: { 'x-csrf-token': adminCsrf },
      data: {
        currentAccessId: 'LOCAL.ACCESS.ACTIONS',
        confirmCurrentAccessId: 'LOCAL.ACCESS.ACTIONS',
        reason: 'Synthetic temporary password reset lifecycle proof.',
      },
    });
    expect(reset.status()).toBe(200);
    const resetResult = await reset.json();
    expect(resetResult).toMatchObject({
      reset: true,
      status: 'STARTER',
      sessionsRevoked: true,
    });
    const generatedResetPassword = resetResult.credential.temporaryPassword;

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const wrong = await anonymous.post('/api/auth/login', {
        data: { accessId: 'LOCAL.ACCESS.ACTIONS', password: 'Wrong!Managed9472' },
      });
      expect(wrong.status()).toBe(401);
    }
    const throttled = await anonymous.post('/api/auth/login', {
      data: { accessId: 'LOCAL.ACCESS.ACTIONS', password: generatedResetPassword },
    });
    expect(throttled.status()).toBe(429);

    const unlocked = await admin.post('/api/admin/access/unlock', {
      headers: { 'x-csrf-token': adminCsrf },
      data: {
        currentAccessId: 'LOCAL.ACCESS.ACTIONS',
        confirmCurrentAccessId: 'LOCAL.ACCESS.ACTIONS',
        reason: 'Synthetic unlock and rate-limit reset lifecycle proof.',
      },
    });
    expect(unlocked.status()).toBe(200);
    const resetLogin = await managed.post('/api/auth/login', {
      data: { accessId: 'LOCAL.ACCESS.ACTIONS', password: generatedResetPassword },
    });
    expect(resetLogin.status()).toBe(200);
    expect((await resetLogin.json()).state).toBe('ACTIVATION_REQUIRED');

    const audit = await admin.post('/api/admin/access/history', {
      headers: { 'x-csrf-token': adminCsrf },
      data: { currentAccessId: 'LOCAL.ACCESS.ACTIONS', limit: 20 },
    });
    expect(audit.status()).toBe(200);
    const auditActions = (await audit.json()).auditHistory.map((entry) => entry.action);
    expect(auditActions).toEqual(
      expect.arrayContaining([
        'STARTER_ACCOUNT_CREATED',
        'ACCOUNT_STATUS_CHANGED',
        'ACCOUNT_ARCHIVED',
        'ACCOUNT_SESSIONS_REVOKED',
        'TEMPORARY_PASSWORD_RESET',
        'ACCOUNT_UNLOCKED',
      ]),
    );
  } finally {
    await Promise.all([admin.dispose(), managed.dispose(), anonymous.dispose()]);
  }
});

test('Administrator atomically initializes, revokes, restores, and resets department requester accounts', async () => {
  const baseURL = process.env.HAU_CLOUDFLARE_BASE_URL || 'http://127.0.0.1:8787';
  const admin = await apiRequest.newContext({ baseURL });
  const requester = await apiRequest.newContext({ baseURL });
  const anonymous = await apiRequest.newContext({ baseURL });
  try {
    const adminCsrf = await login(admin, 'LOCAL.ADMIN');
    const denied = await anonymous.post('/api/admin/access/seed-departments', {
      data: {
        confirmed: true,
        reason: 'Unauthorized synthetic department seed attempt.',
      },
    });
    expect(denied.status()).toBe(401);

    const seeded = await admin.post('/api/admin/access/seed-departments', {
      headers: { 'x-csrf-token': adminCsrf },
      data: {
        confirmed: true,
        reason: 'Initialize the exact owner-approved department requester accounts.',
      },
    });
    expect(seeded.status()).toBe(200);
    const seedResult = await seeded.json();
    expect(seedResult).toMatchObject({ seeded: true, accounts: 10 });
    expect(seedResult.credentials).toHaveLength(10);
    expect(new Set(seedResult.credentials.map((entry) => entry.temporaryPassword)).size).toBe(10);
    expect(seedResult.credentials.map((entry) => entry.accessId)).toEqual([
      'DOL_2026',
      'DOF_2026',
      'DPC_2026',
      'DEM_2026',
      'DBR_2026',
      'OP_2026',
      'OVP_2026',
      'OSG_2026',
      'DHR_2026',
      'DCES_2026',
    ]);
    expect(JSON.stringify(seedResult)).not.toContain('passwordCredential');

    const replay = await admin.post('/api/admin/access/seed-departments', {
      headers: { 'x-csrf-token': adminCsrf },
      data: {
        confirmed: true,
        reason: 'Verify the completed department initialization is not duplicated.',
      },
    });
    expect(replay.status()).toBe(200);
    await expect(replay.json()).resolves.toMatchObject({
      seeded: false,
      accounts: 10,
      credentials: [],
    });

    const dolCredential = seedResult.credentials[0];
    const starter = await requester.post('/api/auth/login', {
      data: {
        accessId: dolCredential.accessId,
        password: dolCredential.temporaryPassword,
      },
    });
    expect(starter.status()).toBe(200);
    const starterResult = await starter.json();
    expect(starterResult.state).toBe('ACTIVATION_REQUIRED');
    const departmentPassword = 'Department!Activated9472';
    const activated = await requester.post('/api/auth/activate', {
      headers: { 'x-csrf-token': starterResult.csrfToken },
      data: {
        profile: {
          fullName: 'Authorized Department Logistics Requester',
          mobileNumber: '+63 917 000 0020',
          email: 'department-logistics@example.invalid',
        },
        password: departmentPassword,
        confirmPassword: departmentPassword,
      },
    });
    expect(activated.status()).toBe(200);
    const activatedResult = await activated.json();
    expect(activatedResult.user).toMatchObject({
      displayName: 'Department of Logistics',
      authorization: { roleId: 'REQUESTER', scopeMode: 'SELF' },
      requesterDepartment: {
        id: 'USC-DEPT-DOL',
        displayName: 'Department of Logistics',
      },
    });

    const directory = await admin.post('/api/admin/access/directory', {
      headers: { 'x-csrf-token': adminCsrf },
      data: { query: 'Department of Logistics', role: 'REQUESTER', page: 1, pageSize: 20 },
    });
    expect(directory.status()).toBe(200);
    const directoryResult = await directory.json();
    expect(directoryResult.items).toEqual([
      expect.objectContaining({
        accessId: 'DOL_2026',
        departmentId: 'USC-DEPT-DOL',
        departmentDisplayName: 'Department of Logistics',
        passwordChangedAt: expect.any(String),
      }),
    ]);
    expect(JSON.stringify(directoryResult)).not.toContain(dolCredential.temporaryPassword);

    const revoked = await admin.post('/api/admin/access/status', {
      headers: { 'x-csrf-token': adminCsrf },
      data: {
        currentAccessId: 'DOL_2026',
        confirmCurrentAccessId: 'DOL_2026',
        status: 'REVOKED',
        reason: 'Verify immediate department account revocation.',
      },
    });
    expect(revoked.status()).toBe(200);
    expect((await requester.get('/api/requests')).status()).toBe(401);
    expect(
      (
        await anonymous.post('/api/auth/login', {
          data: { accessId: 'DOL_2026', password: departmentPassword },
        })
      ).status(),
    ).toBe(403);

    const restored = await admin.post('/api/admin/access/status', {
      headers: { 'x-cs-token': adminCsrf },
      data: {
        currentAccessId: 'DOL_2026',
        confirmCurrentAccessId: 'DOL_2026',
        status: 'ACTIVE',
        reason: 'Verify governed department account restoration.',
      },
    });
    expect(restored.status()).toBe(403);
    const restoredWithCsrf = await admin.post('/api/admin/access/status', {
      headers: { 'x-csrf-token': adminCsrf },
      data: {
        currentAccessId: 'DOL_2026',
        confirmCurrentAccessId: 'DOL_2026',
        status: 'ACTIVE',
        reason: 'Verify governed department account restoration.',
      },
    });
    expect(restoredWithCsrf.status()).toBe(200);
    await expect(login(requester, 'DOL_2026', departmentPassword)).resolves.toBeTruthy();

    const reset = await admin.post('/api/admin/access/reset-password', {
      headers: { 'x-csrf-token': adminCsrf },
      data: {
        currentAccessId: 'DOL_2026',
        confirmCurrentAccessId: 'DOL_2026',
        reason: 'Generate one governed replacement department credential.',
      },
    });
    expect(reset.status()).toBe(200);
    const resetResult = await reset.json();
    expect(resetResult.credential.temporaryPassword).toMatch(/^Hau!9/u);
    expect(
      (
        await anonymous.post('/api/auth/login', {
          data: { accessId: 'DOL_2026', password: departmentPassword },
        })
      ).status(),
    ).toBe(401);
    const resetLogin = await requester.post('/api/auth/login', {
      data: {
        accessId: 'DOL_2026',
        password: resetResult.credential.temporaryPassword,
      },
    });
    expect(resetLogin.status()).toBe(200);
    expect((await resetLogin.json()).state).toBe('ACTIVATION_REQUIRED');
  } finally {
    await Promise.all([admin.dispose(), requester.dispose(), anonymous.dispose()]);
  }
});

test('Administrator UI shows department identity and a one-time server-generated reset export', async ({
  page,
}) => {
  await page.goto('/app/admin');
  await page.getByLabel('Access ID').fill('LOCAL.ADMIN');
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.locator('.app-shell')).toBeVisible();

  await navigateToAdminView(page, 'referenceAdmin');
  await page.getByRole('button', { name: /Access Management/u }).click();
  const access = page.locator('[data-access-management]');
  await expect(access).toBeVisible();
  await access.getByLabel('Search').fill('DOL_2026');
  const row = access.locator('[data-access-results] .access-account-row');
  await expect(row).toHaveCount(1);
  await expect(row).toContainText('Department of Logistics');
  await expect(row).toContainText('USC-DEPT-DOL');

  await row.getByRole('button', { name: 'Reset password' }).click();
  const resetForm = page.locator('#accessPasswordResetForm');
  await expect(resetForm.getByLabel('Temporary password')).toHaveCount(0);
  await resetForm.getByLabel('Confirm current Access ID').fill('DOL_2026');
  await resetForm
    .getByLabel('Reason')
    .fill('Verify the one-time server-generated credential handoff interface.');
  await resetForm.getByRole('button', { name: 'Generate reset credential and revoke sessions' }).click();
  await expect(page.getByRole('heading', { name: 'Temporary password generated' })).toBeVisible();
  await expect(page.locator('.credential-handoff')).toContainText('Access ID: DOL_2026');
  await expect(page.locator('.credential-handoff')).toContainText('Initial password: Hau!9');
  await expect(page.getByRole('button', { name: 'Download access codes' })).toBeVisible();
});

test('requester portals keep request and lending records self-scoped', async () => {
  const baseURL = process.env.HAU_CLOUDFLARE_BASE_URL || 'http://127.0.0.1:8787';
  const admin = await apiRequest.newContext({ baseURL });
  const departmentRequester = await apiRequest.newContext({ baseURL });
  const lendingRequester = await apiRequest.newContext({ baseURL });
  const suffix = String(Date.now()).slice(-8);
  const requesterAccessId = `LOCAL.REQUESTER.${suffix}`;
  try {
    const adminCsrf = await login(admin, 'LOCAL.ADMIN');
    const departmentReset = await admin.post('/api/admin/access/reset-password', {
      headers: { 'x-csrf-token': adminCsrf },
      data: {
        currentAccessId: 'DOL_2026',
        confirmCurrentAccessId: 'DOL_2026',
        reason: 'Prepare the governed department account for authenticated Request Center coverage.',
      },
    });
    expect(departmentReset.status()).toBe(200);
    const departmentCredential = (await departmentReset.json()).credential;
    const departmentStarter = await departmentRequester.post('/api/auth/login', {
      data: {
        accessId: departmentCredential.accessId,
        password: departmentCredential.temporaryPassword,
      },
    });
    expect(departmentStarter.status()).toBe(200);
    const departmentActivation = await departmentStarter.json();
    const departmentActivated = await departmentRequester.post('/api/auth/activate', {
      headers: { 'x-csrf-token': departmentActivation.csrfToken },
      data: {
        profile: {
          fullName: 'Synthetic Department Logistics Requester',
          mobileNumber: '+63 917 000 0002',
          email: `local-department-requester-${suffix}@example.invalid`,
        },
        password: 'Department!Activated9472',
        confirmPassword: 'Department!Activated9472',
      },
    });
    expect(departmentActivated.status()).toBe(200);
    const departmentSession = await departmentActivated.json();
    expect(departmentSession.user).toMatchObject({
      displayName: 'Department of Logistics',
      authorization: { roleId: 'REQUESTER', scopeMode: 'SELF' },
      requesterDepartment: {
        id: 'USC-DEPT-DOL',
        displayName: 'Department of Logistics',
      },
    });
    const departmentCsrf = departmentSession.csrfToken;

    const requestPortal = await departmentRequester.get('/api/portal/request');
    expect(requestPortal.status()).toBe(200);
    await expect(requestPortal.json()).resolves.toMatchObject({
      ok: true,
      profile: {
        departmentId: 'USC-DEPT-DOL',
        displayName: 'Department of Logistics',
      },
      requests: [],
      choices: {
        'Venue / Facility': expect.arrayContaining(['University Theater']),
        Logistics: expect.arrayContaining(['Monoblock Chairs']),
        Equipment: expect.arrayContaining(['Projector']),
      },
    });
    const newCommand = {
      requestType: 'NEW',
      eventSeriesId: 'SER-LOCAL',
      eventId: 'EVT-LOCAL',
      purpose: 'Synthetic authenticated department request',
      lines: [
        {
          category: 'Venue / Facility',
          description: 'University Theater',
          quantity: 1,
          unit: 'facility',
          specification: 'Accessible seating arrangement requested.',
        },
        {
          category: 'Other',
          description: 'Synthetic custom marshal sign',
          custom: true,
          quantity: 2,
          unit: 'piece',
          specification: 'Custom request only; do not create a catalog record.',
        },
      ],
      clientRequestId: `local-department-request-${suffix}`,
    };
    const submittedRequest = await departmentRequester.post('/api/portal/request', {
      headers: { 'x-csrf-token': departmentCsrf },
      data: newCommand,
    });
    expect(submittedRequest.status()).toBe(200);
    const requestResult = await submittedRequest.json();
    expect(requestResult).toMatchObject({
      requestType: 'NEW',
      department: 'Department of Logistics',
      event: 'Local Synthetic Series',
      subEvent: 'Local Synthetic Event',
      status: 'FOR_REVIEW',
      lines: expect.arrayContaining([
        expect.objectContaining({ description: 'University Theater', category: 'Venue / Facility' }),
      ]),
    });
    expect(requestResult).not.toHaveProperty('trackingCode');

    const replay = await departmentRequester.post('/api/portal/request', {
      headers: { 'x-csrf-token': departmentCsrf },
      data: newCommand,
    });
    expect(replay.status()).toBe(200);
    await expect(replay.json()).resolves.toMatchObject({
      requestId: requestResult.requestId,
      replayed: true,
    });

    const duplicate = await departmentRequester.post('/api/portal/request', {
      headers: { 'x-csrf-token': departmentCsrf },
      data: { ...newCommand, clientRequestId: `local-department-duplicate-${suffix}` },
    });
    expect(duplicate.status()).toBe(409);
    await expect(duplicate.json()).resolves.toMatchObject({ code: 'REQUEST_ALREADY_EXISTS' });

    const additional = await departmentRequester.post('/api/portal/request', {
      headers: { 'x-csrf-token': departmentCsrf },
      data: {
        ...newCommand,
        requestType: 'ADDITIONAL',
        parentRequestId: requestResult.requestId,
        lines: [
          {
            category: 'Equipment',
            description: 'Projector',
            quantity: 1,
            unit: 'unit',
            specification: '',
          },
        ],
        clientRequestId: `local-department-additional-${suffix}`,
      },
    });
    expect(additional.status()).toBe(200);
    await expect(additional.json()).resolves.toMatchObject({
      requestType: 'ADDITIONAL',
      parentRequestId: requestResult.requestId,
      status: 'FOR_REVIEW',
    });

    const requestHistory = await departmentRequester.get('/api/portal/request');
    const scopedPortal = await requestHistory.json();
    expect(scopedPortal.requests).toHaveLength(2);
    expect(scopedPortal.requests).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: requestResult.requestId,
          department: 'Department of Logistics',
          lines: expect.arrayContaining([
            expect.objectContaining({ description: 'University Theater', status: 'FOR_REVIEW' }),
          ]),
          history: [expect.objectContaining({ status: 'FOR_REVIEW' })],
        }),
        expect.objectContaining({
          requestType: 'ADDITIONAL',
          parentRequestId: requestResult.requestId,
        }),
      ]),
    );
    expect(JSON.stringify(scopedPortal)).not.toContain('tracking');
    expect(JSON.stringify(scopedPortal)).not.toContain('storage_location');
    expect(JSON.stringify(scopedPortal)).not.toContain('audit');

    const created = await admin.post('/api/admin/access/create-account', {
      headers: { 'x-csrf-token': adminCsrf },
      data: {
        accessId: requesterAccessId,
        roleId: 'REQUESTER',
        committeeIds: [],
        defaultCommitteeId: '',
        lendingEligible: true,
        institutionId: suffix,
        reason: 'Synthetic requester portal regression coverage.',
        confirmed: true,
      },
    });
    expect(created.status()).toBe(200);
    const requesterCreated = await created.json();
    expect(requesterCreated).toMatchObject({
      account: { accessId: requesterAccessId, roleId: 'REQUESTER', lendingEligible: true },
    });
    const starter = await lendingRequester.post('/api/auth/login', {
      data: {
        accessId: requesterAccessId,
        password: requesterCreated.credential.temporaryPassword,
      },
    });
    expect(starter.status()).toBe(200);
    const activation = await starter.json();
    const activated = await lendingRequester.post('/api/auth/activate', {
      headers: { 'x-csrf-token': activation.csrfToken },
      data: {
        profile: {
          fullName: 'Synthetic Portal Requester',
          mobileNumber: '+63 917 000 0002',
          email: 'local-requester-portal@example.invalid',
        },
        password: 'Requester!Activated9472',
        confirmPassword: 'Requester!Activated9472',
      },
    });
    expect(activated.status()).toBe(200);
    const authenticated = await activated.json();
    expect(authenticated.user).toMatchObject({
      lendingEligible: true,
      authorization: { roleId: 'REQUESTER' },
    });
    const csrfToken = authenticated.csrfToken;
    expect((await lendingRequester.get('/api/portal/request')).status()).toBe(403);
    const lendingPortal = await lendingRequester.get('/api/portal/lending');
    expect(lendingPortal.status()).toBe(200);
    const submittedLending = await lendingRequester.post('/api/portal/lending', {
      headers: { 'x-csrf-token': csrfToken },
      data: {
        itemId: 'ITM-LOCAL-001',
        quantity: 1,
        department: 'Synthetic Department',
        purpose: 'Synthetic borrower portal loan',
        dueAt: '2027-07-30',
        ticketType: 'LOAN',
        clientRequestId: `local-requester-portal-lending-${suffix}`,
      },
    });
    expect(submittedLending.status()).toBe(200);
    const lendingResult = await submittedLending.json();
    expect(
      (
        await lendingRequester.post('/api/portal/lending/cancel', {
          headers: { 'x-csrf-token': csrfToken },
          data: {
            ticketId: lendingResult.ticketId,
            clientRequestId: `local-requester-portal-lending-cancel-${suffix}`,
          },
        })
      ).status(),
    ).toBe(200);
  } finally {
    await Promise.all([admin.dispose(), departmentRequester.dispose(), lendingRequester.dispose()]);
  }
});

test('D1 request split, allocation, release, correction, and lending lifecycle preserve retry safety', async ({
  request,
  baseURL,
}) => {
  const csrfToken = await login(request, 'LOCAL.DIRECTOR');
  const splitGroupId = 'SPLIT-LOCAL-E2E';
  const submitCommand = {
    clientRequestId: 'local-e2e-request-submit',
    requestType: 'EVENT_LOGISTICS',
    eventSeriesId: 'SER-LOCAL',
    eventId: 'EVT-LOCAL',
    purpose: 'Synthetic split allocation acceptance',
    department: 'Synthetic Department',
    lines: [
      {
        clientLineId: 'local-stock-line',
        itemId: 'ITM-LOCAL-001',
        description: 'Synthetic stock portion',
        quantity: 2,
        unit: 'piece',
        fulfillmentSource: 'ISSUE_FROM_STOCK',
        splitGroupId,
      },
      {
        clientLineId: 'local-procurement-line',
        description: 'Synthetic procurement portion',
        specification: 'Synthetic procurement portion',
        quantity: 3,
        unit: 'piece',
        fulfillmentSource: 'PROCUREMENT',
        splitGroupId,
      },
    ],
  };
  const submitted = await mutate(request, csrfToken, 'submitRequest', submitCommand);
  expect(submitted.status()).toBe(200);
  const requestId = (await submitted.json()).requestId;

  const review = await mutate(request, csrfToken, 'reviewRequest', {
    requestId,
    decision: 'ACCEPT',
    note: 'Synthetic acceptance',
    clientRequestId: 'local-e2e-request-review',
  });
  expect(review.status()).toBe(200);

  const procurement = await request.get('/api/procurement');
  expect(procurement.status()).toBe(200);
  const procurementData = await procurement.json();
  const requestLines = procurementData.data.requestLines.filter((line) => line.requestId === requestId);
  expect(requestLines.map((line) => line.status).sort()).toEqual(['FOR_CANVASSING', 'READY_TO_RESERVE']);
  expect(
    procurementData.data.deliverables.some(
      (deliverable) => deliverable.request_id === requestId && deliverable.status === 'FOR_CANVASSING',
    ),
  ).toBe(true);
  const stockLine = requestLines.find((line) => line.status === 'READY_TO_RESERVE');

  const reserveCommand = {
    itemId: 'ITM-LOCAL-001',
    requestLineId: stockLine.id,
    quantity: 2,
    clientRequestId: 'local-e2e-reserve',
  };
  const reserved = await mutate(request, csrfToken, 'reserveStock', reserveCommand);
  expect(reserved.status()).toBe(200);
  const reserveReplay = await mutate(request, csrfToken, 'reserveStock', reserveCommand);
  expect(reserveReplay.status()).toBe(200);
  expect((await reserveReplay.json()).reservationId).toBe((await reserved.json()).reservationId);

  const evidenceBytes = new Uint8Array([
    0x89,
    0x50,
    0x4e,
    0x47,
    0x0d,
    0x0a,
    0x1a,
    0x0a,
    ...new TextEncoder().encode('synthetic-release-evidence'),
  ]);
  const acceptedEvidence = await mutate(request, csrfToken, 'uploadEvidence', {
    evidenceType: 'RELEASE_CONFIRMATION_PHOTO',
    originalFileName: 'synthetic-release.png',
    mimeType: 'image/png',
    base64: btoa(String.fromCharCode(...evidenceBytes)),
    relatedEntityType: 'RELEASE_REQUEST',
    relatedEntityId: requestId,
    requestId,
    clientRequestId: 'local-e2e-release-evidence-r2-primary',
  });
  expect(acceptedEvidence.status()).toBe(200);
  const evidenceResult = await acceptedEvidence.json();
  expect(evidenceResult).toMatchObject({
    uploadStatus: 'VERIFIED',
    backupStatus: 'PENDING',
    message: '✓ Your photo or document is saved securely. A backup copy will be created automatically.',
  });

  const partialReleaseCommand = {
    requestId,
    recipientConfirmed: true,
    recipientName: 'Synthetic Recipient',
    recipientRole: 'Synthetic Tester',
    department: 'Synthetic Department',
    evidenceId: evidenceResult.evidenceId,
    lines: [{ requestLineId: stockLine.id, quantity: 1 }],
    clientRequestId: 'local-e2e-release-partial',
  };
  const partialRelease = await mutate(request, csrfToken, 'confirmRelease', partialReleaseCommand);
  expect(partialRelease.status()).toBe(200);
  const partialReleaseResult = await partialRelease.json();
  expect(partialReleaseResult).toMatchObject({ status: 'PARTIAL', recipientConfirmed: true });
  const partialReplay = await mutate(request, csrfToken, 'confirmRelease', partialReleaseCommand);
  expect(partialReplay.status()).toBe(200);
  expect((await partialReplay.json()).releaseId).toBe(partialReleaseResult.releaseId);
  const partialProjection = await request.get('/api/releases?operationalScope=EVENT%3AEVT-LOCAL&pageSize=50');
  expect(partialProjection.status()).toBe(200);
  expect((await partialProjection.json()).data.releaseConfirmations).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        id: partialReleaseResult.releaseId,
        requestId,
        eventId: 'EVT-LOCAL',
        recipientName: 'Synthetic Recipient',
        recipientRole: 'Synthetic Tester',
        department: 'Synthetic Department',
        evidenceId: evidenceResult.evidenceId,
        status: 'PARTIAL',
        lineReleases: [
          expect.objectContaining({
            requestLineId: stockLine.id,
            quantity: 1,
            status: 'PARTIAL',
          }),
        ],
      }),
    ]),
  );

  const fullReleaseCommand = {
    ...partialReleaseCommand,
    clientRequestId: 'local-e2e-release-complete',
  };
  const fullRelease = await mutate(request, csrfToken, 'confirmRelease', fullReleaseCommand);
  expect(fullRelease.status()).toBe(200);
  const fullReleaseResult = await fullRelease.json();
  expect(fullReleaseResult).toMatchObject({ status: 'COMPLETED', recipientConfirmed: true });
  const fullReleaseReplay = await mutate(request, csrfToken, 'confirmRelease', fullReleaseCommand);
  expect(fullReleaseReplay.status()).toBe(200);
  expect((await fullReleaseReplay.json()).releaseId).toBe(fullReleaseResult.releaseId);
  const duplicateRelease = await mutate(request, csrfToken, 'confirmRelease', {
    ...fullReleaseCommand,
    clientRequestId: 'local-e2e-release-duplicate',
  });
  expect(duplicateRelease.status()).toBe(409);
  const deniedCorrection = await mutate(request, csrfToken, 'correctRelease', {
    releaseConfirmationId: fullReleaseResult.releaseId,
    quantity: 1,
    reason: 'Synthetic owner-only correction denial.',
    evidenceId: evidenceResult.evidenceId,
    correctionConfirmed: true,
    clientRequestId: 'local-e2e-release-correction-denied',
  });
  expect(deniedCorrection.status()).toBe(403);
  await expect(deniedCorrection.json()).resolves.toMatchObject({ code: 'SYSTEM_OWNER_REQUIRED' });

  const owner = await apiRequest.newContext({ baseURL });
  const ownerCsrf = await login(owner, 'LOCAL.OWNER');
  const ownerEvidenceStatus = await owner.post('/api/owner/evidence/status', {
    headers: { 'x-csrf-token': ownerCsrf },
    data: {},
  });
  expect(ownerEvidenceStatus.status()).toBe(200);
  await expect(ownerEvidenceStatus.json()).resolves.toMatchObject({
    overallStatus: expect.stringMatching(/^(?:HEALTHY|ATTENTION)$/u),
    release: { environment: 'DEVELOPMENT', candidateSha: expect.any(String) },
    database: { schemaVersion: expect.any(String), latestMigration: expect.any(String) },
    authentication: { totalAccounts: expect.any(Number), failedLoginEvents24h: expect.any(Number) },
    emailVerification: { status: expect.any(String) },
    identityRoster: { status: expect.any(String) },
    storage: { brandR2: 'AVAILABLE', evidenceR2: 'AVAILABLE' },
    inventory: { negativeBalanceAlerts: expect.any(Number) },
    recovery: { rollbackRehearsalStatus: expect.any(String) },
    protection: { personalDataExcluded: true, rawErrorsExcluded: true },
    primaryR2Status: 'AVAILABLE',
    pendingDriveBackups: expect.any(Number),
    failedDriveBackups: expect.any(Number),
    technicalDetails: { providerIdentifiersProtected: true },
  });
  const unauthorizedEvidenceStatus = await request.post('/api/owner/evidence/status', {
    data: {},
  });
  expect(unauthorizedEvidenceStatus.status()).toBe(403);
  const correctionCommand = {
    releaseConfirmationId: fullReleaseResult.releaseId,
    quantity: 1,
    reason: 'Synthetic physical handoff correction.',
    evidenceId: evidenceResult.evidenceId,
    correctionConfirmed: true,
    operationalScope: 'EVENT:EVT-LOCAL',
    activeWorkspace: 'inventory',
    clientRequestId: 'local-e2e-release-correction',
  };
  const corrected = await mutate(owner, ownerCsrf, 'correctRelease', correctionCommand);
  expect(corrected.status()).toBe(200);
  const correctionResult = await corrected.json();
  expect(correctionResult).toMatchObject({
    releaseId: fullReleaseResult.releaseId,
    releaseConfirmationId: fullReleaseResult.releaseId,
    quantity: 1,
    status: 'POSTED',
    lineStatus: 'PARTIALLY_RELEASED',
  });
  const correctionReplay = await mutate(owner, ownerCsrf, 'correctRelease', correctionCommand);
  expect(correctionReplay.status()).toBe(200);
  expect((await correctionReplay.json()).correctionId).toBe(correctionResult.correctionId);
  const overCorrection = await mutate(owner, ownerCsrf, 'correctRelease', {
    ...correctionCommand,
    quantity: 2,
    clientRequestId: 'local-e2e-release-correction-over',
  });
  expect(overCorrection.status()).toBe(409);
  await expect(overCorrection.json()).resolves.toMatchObject({ code: 'CORRECTION_QUANTITY_CONFLICT' });
  const releaseProjection = await owner.get('/api/releases?operationalScope=EVENT%3AEVT-LOCAL&pageSize=50');
  expect(releaseProjection.status()).toBe(200);
  const releaseData = (await releaseProjection.json()).data;
  expect(releaseData.events).toEqual([expect.objectContaining({ id: 'EVT-LOCAL', seriesId: 'SER-LOCAL' })]);
  expect(releaseData.releaseConfirmations).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        id: partialReleaseResult.releaseId,
        requestId,
        recipientName: 'Synthetic Recipient',
        recipientRole: 'Synthetic Tester',
        department: 'Synthetic Department',
        evidenceId: evidenceResult.evidenceId,
        status: 'PARTIAL',
        lineReleases: [
          expect.objectContaining({
            confirmationId: partialReleaseResult.releaseId,
            requestLineId: stockLine.id,
            quantity: 1,
            correctedQuantity: 0,
            correctableQuantity: 1,
          }),
        ],
      }),
      expect.objectContaining({
        id: fullReleaseResult.releaseId,
        requestId,
        recipientName: 'Synthetic Recipient',
        recipientRole: 'Synthetic Tester',
        department: 'Synthetic Department',
        evidenceId: evidenceResult.evidenceId,
        status: 'COMPLETED',
        correctedQuantity: 1,
        correctableQuantity: 0,
        lineReleases: [
          expect.objectContaining({
            confirmationId: fullReleaseResult.releaseId,
            requestLineId: stockLine.id,
            quantity: 1,
            correctedQuantity: 1,
            correctableQuantity: 0,
          }),
        ],
        corrections: [
          expect.objectContaining({
            id: correctionResult.correctionId,
            evidenceId: evidenceResult.evidenceId,
            quantity: 1,
            status: 'POSTED',
          }),
        ],
      }),
    ]),
  );
  const inventoryProjection = await owner.get(
    '/api/inventory?operationalScope=EVENT%3AEVT-LOCAL&pageSize=50',
  );
  expect(inventoryProjection.status()).toBe(200);
  const releaseLedger = (await inventoryProjection.json()).data.ledgerTransactions;
  const issueTransactions = releaseLedger.filter(
    (entry) =>
      entry.relatedId === partialReleaseResult.releaseId || entry.relatedId === fullReleaseResult.releaseId,
  );
  expect(issueTransactions).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        type: 'ISSUE',
        direction: 'OUT',
        relatedId: partialReleaseResult.releaseId,
        quantity: 1,
      }),
      expect.objectContaining({
        type: 'ISSUE',
        direction: 'OUT',
        relatedId: fullReleaseResult.releaseId,
        quantity: 1,
      }),
    ]),
  );
  const correctedIssue = issueTransactions.find((entry) => entry.relatedId === fullReleaseResult.releaseId);
  expect(releaseLedger).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        type: 'RELEASE_CORRECTION',
        direction: 'REVERSAL',
        relatedId: correctionResult.correctionId,
        quantity: 1,
        reversalOf: correctedIssue.id,
      }),
    ]),
  );
  await owner.dispose();

  const lending = await mutate(request, csrfToken, 'createLendingTicket', {
    clientRequestId: 'local-e2e-lending-create',
    borrowerReference: '12345678',
    borrowerName: 'Synthetic Borrower',
    borrowerType: 'STUDENT',
    itemId: 'ITM-LOCAL-001',
    quantity: 1,
    unit: 'piece',
    purpose: 'Synthetic lending lifecycle',
    dueAt: '2026-08-05T12:00:00+08:00',
    ticketType: 'LOAN',
  });
  expect(lending.status()).toBe(200);
  const ticketId = (await lending.json()).ticketId;
  expect(
    (
      await mutate(request, csrfToken, 'approveLendingTicket', {
        ticketId,
        identityVerified: true,
        identityVerificationSource: 'APPROVED_ANGELITE_IDENTITY_RULE',
        clientRequestId: 'local-e2e-lending-approve',
      })
    ).status(),
  ).toBe(200);
  expect(
    (
      await mutate(request, csrfToken, 'confirmLendingHandoff', {
        ticketId,
        clientRequestId: 'local-e2e-lending-handoff',
      })
    ).status(),
  ).toBe(200);
  const duplicateHandoff = await mutate(request, csrfToken, 'confirmLendingHandoff', {
    ticketId,
    clientRequestId: 'local-e2e-lending-handoff-duplicate',
  });
  expect(duplicateHandoff.status()).toBe(409);
  expect(
    (
      await mutate(request, csrfToken, 'confirmReturn', {
        ticketId,
        conditionLabel: 'GOOD',
        clientRequestId: 'local-e2e-lending-return',
      })
    ).status(),
  ).toBe(200);
  const duplicateReturn = await mutate(request, csrfToken, 'confirmReturn', {
    ticketId,
    conditionLabel: 'GOOD',
    clientRequestId: 'local-e2e-lending-return-duplicate',
  });
  expect(duplicateReturn.status()).toBe(409);
});

test('committee-scoped canvass, procurement, and cumulative receiving execute in D1', async ({ request }) => {
  const materialsCsrf = await login(request, 'LOCAL.MATERIALS');
  const rejectedEvidence = await mutate(request, materialsCsrf, 'saveCanvassReference', {
    clientRequestId: 'local-e2e-canvass-evidence-rejected',
    linkedDeliverableId: 'DEL-LOCAL-CANVASS',
    supplierName: 'Synthetic Supplier',
    itemSpec: 'Synthetic Procurement Item',
    price: 125,
    unit: 'set',
    evidence: { fileName: 'must-not-be-stored.txt', base64: 'c3ludGhldGlj' },
  });
  expect(rejectedEvidence.status()).toBe(503);
  await expect(rejectedEvidence.json()).resolves.toMatchObject({
    code: 'EVIDENCE_BRIDGE_NOT_CONFIGURED',
  });

  const saveCommand = {
    clientRequestId: 'local-e2e-canvass-save',
    linkedDeliverableId: 'DEL-LOCAL-CANVASS',
    supplierName: 'Synthetic Supplier',
    itemSpec: 'Synthetic Procurement Item',
    price: 125,
    unit: 'set',
    receiptStatus: 'VERIFIED',
    reliability: 'SYNTHETIC',
    checkedAt: '2026-07-22T00:00:00.000Z',
  };
  const saved = await mutate(request, materialsCsrf, 'saveCanvassReference', saveCommand);
  expect(saved.status()).toBe(200);
  const canvassId = (await saved.json()).canvassId;
  const savedReplay = await mutate(request, materialsCsrf, 'saveCanvassReference', saveCommand);
  expect(savedReplay.status()).toBe(200);
  expect((await savedReplay.json()).canvassId).toBe(canvassId);

  const preferred = await mutate(request, materialsCsrf, 'selectPreferredCanvass', {
    canvassId,
    rationale: 'Synthetic quote comparison',
    clientRequestId: 'local-e2e-canvass-preferred',
  });
  expect(preferred.status()).toBe(200);
  for (const [status, clientRequestId] of [
    ['WAITING_FOR_BUDGET', 'local-e2e-deliverable-budget'],
    ['TO_BE_PROCURED', 'local-e2e-deliverable-authorized'],
    ['PROCURED', 'local-e2e-deliverable-procured'],
  ]) {
    const transition = await mutate(request, materialsCsrf, 'transitionDeliverable', {
      deliverableId: 'DEL-LOCAL-CANVASS',
      status,
      note: `Synthetic transition to ${status}`,
      clientRequestId,
    });
    expect(transition.status()).toBe(200);
  }

  const firstReceipt = await mutate(request, materialsCsrf, 'receiveDeliverable', {
    deliverableId: 'DEL-LOCAL-CANVASS',
    quantity: 1,
    unit: 'set',
    clientRequestId: 'local-e2e-deliverable-receive-1',
  });
  expect(firstReceipt.status()).toBe(200);
  await expect(firstReceipt.json()).resolves.toMatchObject({
    cumulativeReceived: 1,
    remaining: 3,
    status: 'PARTIALLY_RECEIVED',
  });
  const finalReceipt = await mutate(request, materialsCsrf, 'receiveDeliverable', {
    deliverableId: 'DEL-LOCAL-CANVASS',
    quantity: 3,
    unit: 'set',
    clientRequestId: 'local-e2e-deliverable-receive-2',
  });
  expect(finalReceipt.status()).toBe(200);
  await expect(finalReceipt.json()).resolves.toMatchObject({
    cumulativeReceived: 4,
    remaining: 0,
    status: 'RECEIVED',
  });
  const overReceipt = await mutate(request, materialsCsrf, 'receiveDeliverable', {
    deliverableId: 'DEL-LOCAL-CANVASS',
    quantity: 1,
    unit: 'set',
    clientRequestId: 'local-e2e-deliverable-over-receive',
  });
  expect(overReceipt.status()).toBe(409);

  const inventoryCsrf = await login(request, 'LOCAL.INVENTORY');
  const restockReceipt = await mutate(request, inventoryCsrf, 'receiveRestock', {
    restockRequestId: 'RST-LOCAL-001',
    quantity: 10,
    unit: 'piece',
    invoiceStatus: 'SYNTHETIC',
    clientRequestId: 'local-e2e-restock-receive',
  });
  expect(restockReceipt.status()).toBe(200);
  await expect(restockReceipt.json()).resolves.toMatchObject({
    cumulativeReceived: 10,
    remaining: 0,
    status: 'RECEIVED',
  });
});

test('traceable reusable assets preserve assignment, condition, and maintenance history', async ({
  request,
}) => {
  const csrfToken = await login(request, 'LOCAL.DIRECTOR');
  const registered = await mutate(request, csrfToken, 'registerInventoryAsset', {
    itemId: 'ITM-LOCAL-001',
    assetTag: 'LOCAL-CHAIR-0001',
    serialNumber: 'SYNTHETIC-SERIAL-0001',
    conditionLabel: 'GOOD',
    notes: 'Synthetic Phase 5 asset lifecycle proof.',
    clientRequestId: 'local-phase5-asset-register',
  });
  expect(registered.status()).toBe(200);
  const assetId = (await registered.json()).assetId;

  const lending = await mutate(request, csrfToken, 'createLendingTicket', {
    clientRequestId: 'local-phase5-lending-create',
    borrowerReference: '12345678',
    borrowerName: 'Synthetic Asset Borrower',
    borrowerType: 'STUDENT',
    itemId: 'ITM-LOCAL-001',
    quantity: 1,
    unit: 'piece',
    purpose: 'Synthetic traceable asset lifecycle',
    pickupDate: '2026-08-03',
    dueAt: '2026-08-10T12:00:00+08:00',
    ticketType: 'LOAN',
  });
  expect(lending.status()).toBe(200);
  const ticketId = (await lending.json()).ticketId;

  const missingAssignment = await mutate(request, csrfToken, 'approveLendingTicket', {
    ticketId,
    identityVerified: true,
    identityVerificationSource: 'APPROVED_ANGELITE_IDENTITY_RULE',
    clientRequestId: 'local-phase5-lending-approve-missing-asset',
  });
  expect(missingAssignment.status()).toBe(409);
  await expect(missingAssignment.json()).resolves.toMatchObject({ code: 'ASSET_ASSIGNMENT_REQUIRED' });

  const approved = await mutate(request, csrfToken, 'approveLendingTicket', {
    ticketId,
    assetIds: [assetId],
    identityVerified: true,
    identityVerificationSource: 'APPROVED_ANGELITE_IDENTITY_RULE',
    clientRequestId: 'local-phase5-lending-approve',
  });
  expect(approved.status()).toBe(200);
  await expect(approved.json()).resolves.toMatchObject({
    status: 'READY_TO_CLAIM',
    assetIds: [assetId],
  });

  const handedOff = await mutate(request, csrfToken, 'confirmLendingHandoff', {
    ticketId,
    conditionLabel: 'GOOD',
    notes: 'Synthetic handoff condition.',
    clientRequestId: 'local-phase5-lending-handoff',
  });
  expect(handedOff.status()).toBe(200);
  await expect(handedOff.json()).resolves.toMatchObject({ status: 'ON_LOAN', assetIds: [assetId] });

  const returned = await mutate(request, csrfToken, 'confirmReturn', {
    ticketId,
    conditionLabel: 'DAMAGED',
    notes: 'Synthetic damaged return requiring maintenance.',
    clientRequestId: 'local-phase5-lending-return',
  });
  expect(returned.status()).toBe(200);
  await expect(returned.json()).resolves.toMatchObject({ status: 'RETURNED', assetIds: [assetId] });

  const damagedInventory = await (await request.get('/api/inventory')).json();
  expect(damagedInventory.data.inventoryAssets.find((asset) => asset.id === assetId)).toMatchObject({
    asset_tag: 'LOCAL-CHAIR-0001',
    lifecycle_status: 'DAMAGED',
    return_condition: 'DAMAGED',
  });
  expect(
    damagedInventory.data.assetMovementHistory.some(
      (movement) =>
        movement.asset_id === assetId &&
        movement.movement_type === 'RETURN' &&
        movement.new_status === 'DAMAGED',
    ),
  ).toBe(true);
  expect(
    damagedInventory.data.assetMaintenanceHistory.some(
      (event) => event.asset_id === assetId && event.event_type === 'DECLARED_DAMAGED',
    ),
  ).toBe(true);

  const restored = await mutate(request, csrfToken, 'recordAssetMaintenance', {
    assetId,
    eventType: 'COMPLETED',
    conditionLabel: 'FAIR',
    notes: 'Synthetic repair completed.',
    clientRequestId: 'local-phase5-asset-maintenance-complete',
  });
  expect(restored.status()).toBe(200);
  await expect(restored.json()).resolves.toMatchObject({ status: 'AVAILABLE' });
});

test('a returned reusable asset can be assigned to a later lending ticket without losing history', async ({
  request,
}) => {
  const csrfToken = await login(request, 'LOCAL.DIRECTOR');
  const registered = await mutate(request, csrfToken, 'registerInventoryAsset', {
    itemId: 'ITM-LOCAL-001',
    assetTag: 'LOCAL-REUSE-0001',
    serialNumber: 'SYNTHETIC-REUSE-0001',
    conditionLabel: 'GOOD',
    notes: 'Reusable assignment regression fixture.',
    clientRequestId: 'local-reuse-asset-register',
  });
  expect(registered.status()).toBe(200);
  const assetId = (await registered.json()).assetId;

  async function completeLoan(suffix) {
    const created = await mutate(request, csrfToken, 'createLendingTicket', {
      borrowerReference: suffix === 'first' ? '12345671' : '12345672',
      borrowerName: `Synthetic ${suffix} reuse borrower`,
      borrowerType: 'STUDENT',
      itemId: 'ITM-LOCAL-001',
      quantity: 1,
      unit: 'piece',
      purpose: `Synthetic ${suffix} reusable assignment`,
      dueAt: '2026-08-10T12:00:00+08:00',
      ticketType: 'LOAN',
      clientRequestId: `local-reuse-ticket-${suffix}`,
    });
    expect(created.status()).toBe(200);
    const ticketId = (await created.json()).ticketId;
    const approved = await mutate(request, csrfToken, 'approveLendingTicket', {
      ticketId,
      assetIds: [assetId],
      identityVerified: true,
      identityVerificationSource: 'APPROVED_ANGELITE_IDENTITY_RULE',
      clientRequestId: `local-reuse-approve-${suffix}`,
    });
    expect(approved.status()).toBe(200);
    const handedOff = await mutate(request, csrfToken, 'confirmLendingHandoff', {
      ticketId,
      conditionLabel: 'GOOD',
      clientRequestId: `local-reuse-handoff-${suffix}`,
    });
    expect(handedOff.status()).toBe(200);
    const returned = await mutate(request, csrfToken, 'confirmReturn', {
      ticketId,
      conditionLabel: 'GOOD',
      clientRequestId: `local-reuse-return-${suffix}`,
    });
    expect(returned.status()).toBe(200);
    return ticketId;
  }

  const firstTicketId = await completeLoan('first');
  const secondTicketId = await completeLoan('second');
  const inventory = await (await request.get('/api/inventory')).json();
  const assignments = inventory.data.assetMovementHistory.filter(
    (entry) => entry.asset_id === assetId && entry.movement_type === 'HANDOFF',
  );
  expect(assignments.map((entry) => entry.lending_ticket_id)).toEqual(
    expect.arrayContaining([firstTicketId, secondTicketId]),
  );
});
