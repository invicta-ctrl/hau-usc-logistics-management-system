import { expect, request as apiRequest, test } from '@playwright/test';
import { navigateToAdminView } from '../e2e/navigation.js';

const PASSWORD = `LocalOnly${String.fromCharCode(33)}Pass2026`;
const TEMPORARY_PASSWORD = `Temporary${String.fromCharCode(33)}Local2026`;
const ACTIVATED_PASSWORD = `Activated${String.fromCharCode(33)}Local9472`;
const MANAGED_TEMPORARY_PASSWORD = `Managed${String.fromCharCode(33)}Temporary9472`;
const MANAGED_ACTIVATED_PASSWORD = `Managed${String.fromCharCode(33)}Activated9472`;
const MANAGED_RESET_PASSWORD = `Managed${String.fromCharCode(33)}Reset9472`;
const roles = [
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
    database: { connected: true, schemaVersion: '13' },
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
  await expect(response.json()).resolves.toMatchObject({
    code: 'AUTHENTICATION_FAILED',
    message: 'The Access ID or password is incorrect.',
  });
});

test('public Request Center submits and tracks one private request without staff credentials', async ({
  request,
  baseURL,
}) => {
  const admin = await apiRequest.newContext({ baseURL });
  await login(admin, 'LOCAL.ADMIN');
  const options = await request.get('/api/public/request/options');
  expect(options.status()).toBe(200);
  const optionData = await options.json();
  expect(optionData.categories).toEqual([
    'Inventory Item',
    'Food',
    'Materials',
    'Venue / Facility',
    'Logistics / Equipment',
    'Other',
  ]);
  expect(optionData.items[0]).not.toHaveProperty('availableToPromise');
  expect(optionData.items[0]).not.toHaveProperty('storageLocation');
  expect(optionData).not.toHaveProperty('requestReferences');
  const inventoryBefore = await (await admin.get('/api/inventory')).json();
  const balanceBefore = inventoryBefore.data.inventoryItems.find(
    (item) => item.id === optionData.items[0].id,
  ).onHand;

  const crossOrigin = await request.post('/api/public/request', {
    headers: { origin: 'https://cross-origin.example.invalid' },
    data: { clientRequestId: `cross-origin-${crypto.randomUUID()}` },
  });
  expect(crossOrigin.status()).toBe(403);

  const clientRequestId = `public-request-${crypto.randomUUID()}`;
  const command = {
    requestType: 'CATALOG_RESTOCK',
    requesterName: 'Synthetic Public Requester',
    requesterType: 'HAU office / department',
    organization: 'Synthetic Organization',
    contactNumber: '+63 917 000 0010',
    email: `public-${crypto.randomUUID()}@example.invalid`,
    stockArea: optionData.stockAreas[0],
    neededDate: '2026-08-02',
    purpose: 'Synthetic public request acceptance proof.',
    lines: [
      {
        category: 'Inventory Item',
        itemId: optionData.items[0].id,
        quantity: 2,
        specification: 'Synthetic request only; no stock movement.',
      },
      { category: 'Other', description: 'Synthetic custom support', quantity: 1, unit: 'service' },
    ],
    clientRequestId,
  };
  const submitted = await request.post('/api/public/request', {
    headers: { origin: 'http://127.0.0.1:8787' },
    data: command,
  });
  expect(submitted.status()).toBe(200);
  const receipt = await submitted.json();
  expect(receipt).toMatchObject({ status: 'FOR_REVIEW', replayed: false });
  expect(receipt.requestId).toMatch(/^REQ-/u);
  expect(receipt.trackingCode.length).toBeGreaterThan(32);

  const replay = await request.post('/api/public/request', {
    headers: { origin: 'http://127.0.0.1:8787' },
    data: command,
  });
  await expect(replay.json()).resolves.toMatchObject({
    requestId: receipt.requestId,
    trackingCode: receipt.trackingCode,
    replayed: true,
  });

  const tracked = await request.post('/api/public/request/track', {
    headers: { origin: 'http://127.0.0.1:8787' },
    data: { requestId: receipt.requestId, trackingCode: receipt.trackingCode },
  });
  expect(tracked.status()).toBe(200);
  const tracking = await tracked.json();
  expect(tracking.request).toMatchObject({ id: receipt.requestId, status: 'FOR_REVIEW' });
  expect(tracking.request.lines).toHaveLength(2);
  expect(tracking.request).not.toHaveProperty('requesterEmail');
  const related = await request.post('/api/public/request/related', {
    headers: { origin: 'http://127.0.0.1:8787' },
    data: { requestId: receipt.requestId, trackingCode: receipt.trackingCode },
  });
  expect(related.status()).toBe(200);
  await expect(related.json()).resolves.toMatchObject({
    reference: {
      id: receipt.requestId,
      requestType: 'CATALOG_RESTOCK',
      stockArea: command.stockArea,
      status: 'FOR_REVIEW',
    },
  });
  const inventoryAfter = await (await admin.get('/api/inventory')).json();
  expect(inventoryAfter.data.inventoryItems.find((item) => item.id === optionData.items[0].id).onHand).toBe(
    balanceBefore,
  );

  const denied = await request.post('/api/public/request/track', {
    headers: { origin: 'http://127.0.0.1:8787' },
    data: { requestId: receipt.requestId, trackingCode: 'invalid-private-code' },
  });
  expect(denied.status()).toBe(404);
  expect((await request.get('/api/requests')).status()).toBe(401);
  await admin.dispose();
});

test('public Lending Center browses, submits, and privately tracks without stock movement', async ({
  request,
  baseURL,
}) => {
  const admin = await apiRequest.newContext({ baseURL });
  await login(admin, 'LOCAL.ADMIN');
  const catalogResponse = await request.get('/api/public/lending/catalog');
  expect(catalogResponse.status()).toBe(200);
  const catalog = await catalogResponse.json();
  expect(catalog.departments).toEqual(['SEA', 'SBA', 'CCJEF', 'SAS', 'SED', 'SOC', 'SNAMS']);
  const item = catalog.items.find((entry) => entry.availability === 'AVAILABLE');
  expect(item).toBeTruthy();
  expect(item).not.toHaveProperty('availableToPromise');
  expect(item).not.toHaveProperty('onHand');
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
    borrowerName: 'Synthetic Angelite Borrower',
    studentId: '12345678',
    courseYear: 'BSIT 2',
    department: 'SEA',
    contactNumber: '+63 917 000 0010',
    email: `lending-${crypto.randomUUID()}@gmail.com`,
    purpose: 'Synthetic public lending acceptance proof.',
    pickupDate: '2026-08-03',
    dueDate: '2026-08-10',
    responsibilityAcknowledged: true,
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
  expect(receipt.ticketId).toMatch(/^LBR-/u);
  expect(receipt.trackingCode.length).toBeGreaterThan(32);

  const replay = await request.post('/api/public/lending', {
    headers: { origin: 'http://127.0.0.1:8787' },
    data: command,
  });
  await expect(replay.json()).resolves.toMatchObject({
    ticketId: receipt.ticketId,
    trackingCode: receipt.trackingCode,
    replayed: true,
  });

  const tracked = await request.post('/api/public/lending/track', {
    headers: { origin: 'http://127.0.0.1:8787' },
    data: { ticketId: receipt.ticketId, trackingCode: receipt.trackingCode },
  });
  expect(tracked.status()).toBe(200);
  const tracking = await tracked.json();
  expect(tracking.request).toMatchObject({ id: receipt.ticketId, status: 'FOR_REVIEW' });
  expect(tracking.request.tickets).toHaveLength(1);
  expect(tracking.request).not.toHaveProperty('email');
  expect(tracking.request).not.toHaveProperty('contactNumber');
  expect(tracking.request).not.toHaveProperty('studentId');

  const inventoryAfter = await (await admin.get('/api/inventory')).json();
  expect(inventoryAfter.data.inventoryItems.find((entry) => entry.id === item.id).onHand).toBe(balanceBefore);
  const denied = await request.post('/api/public/lending/track', {
    headers: { origin: 'http://127.0.0.1:8787' },
    data: { ticketId: receipt.ticketId, trackingCode: 'invalid-private-code' },
  });
  expect(denied.status()).toBe(404);
  await admin.dispose();
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
    await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();
    await page.goto(`/app/${workspace}/requests`);
    await expect(page.locator('#request')).toBeVisible();
    await expect(page.locator('body')).toHaveAttribute('data-experience', experience);
  });
}

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
  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect(page.getByLabel('Access ID')).toBeVisible();
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
        temporaryPassword: MANAGED_TEMPORARY_PASSWORD,
        roleId: 'DOL_STAFF',
        committeeIds: ['COM_MATERIALS'],
        defaultCommitteeId: 'COM_MATERIALS',
        reason: 'Synthetic governed account lifecycle regression coverage.',
        confirmed: true,
      },
    });
    expect(created.status()).toBe(200);
    await expect(created.json()).resolves.toMatchObject({
      created: true,
      account: {
        accessId: 'LOCAL.ACCESS.ACTIONS',
        roleId: 'DOL_STAFF',
        committeeIds: ['COM_MATERIALS'],
        firstLoginPending: true,
      },
    });

    const starterLogin = await managed.post('/api/auth/login', {
      data: { accessId: 'LOCAL.ACCESS.ACTIONS', password: MANAGED_TEMPORARY_PASSWORD },
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
        temporaryPassword: MANAGED_RESET_PASSWORD,
        reason: 'Synthetic temporary password reset lifecycle proof.',
      },
    });
    expect(reset.status()).toBe(200);
    await expect(reset.json()).resolves.toMatchObject({
      reset: true,
      status: 'STARTER',
      sessionsRevoked: true,
    });

    for (let attempt = 0; attempt < 5; attempt += 1) {
      const wrong = await anonymous.post('/api/auth/login', {
        data: { accessId: 'LOCAL.ACCESS.ACTIONS', password: 'Wrong!Managed9472' },
      });
      expect(wrong.status()).toBe(401);
    }
    const throttled = await anonymous.post('/api/auth/login', {
      data: { accessId: 'LOCAL.ACCESS.ACTIONS', password: MANAGED_RESET_PASSWORD },
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
      data: { accessId: 'LOCAL.ACCESS.ACTIONS', password: MANAGED_RESET_PASSWORD },
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
        'ACCOUNT_SESSIONS_REVOKED',
        'TEMPORARY_PASSWORD_RESET',
        'ACCOUNT_UNLOCKED',
      ]),
    );
  } finally {
    await Promise.all([admin.dispose(), managed.dispose(), anonymous.dispose()]);
  }
});

test('requester portals keep request and lending records self-scoped', async () => {
  const baseURL = process.env.HAU_CLOUDFLARE_BASE_URL || 'http://127.0.0.1:8787';
  const admin = await apiRequest.newContext({ baseURL });
  const requester = await apiRequest.newContext({ baseURL });
  const suffix = String(Date.now()).slice(-8);
  const requesterAccessId = `LOCAL.REQUESTER.${suffix}`;
  try {
    const adminCsrf = await login(admin, 'LOCAL.ADMIN');
    const created = await admin.post('/api/admin/access/create-account', {
      headers: { 'x-csrf-token': adminCsrf },
      data: {
        accessId: requesterAccessId,
        temporaryPassword: 'Requester!Portal9472',
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
    await expect(created.json()).resolves.toMatchObject({
      account: { accessId: requesterAccessId, roleId: 'REQUESTER', lendingEligible: true },
    });
    const starter = await requester.post('/api/auth/login', {
      data: { accessId: requesterAccessId, password: 'Requester!Portal9472' },
    });
    expect(starter.status()).toBe(200);
    const activation = await starter.json();
    const activated = await requester.post('/api/auth/activate', {
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

    const requestPortal = await requester.get('/api/portal/request');
    expect(requestPortal.status()).toBe(200);
    await expect(requestPortal.json()).resolves.toMatchObject({ ok: true, requests: [] });
    const submittedRequest = await requester.post('/api/portal/request', {
      headers: { 'x-csrf-token': csrfToken },
      data: {
        itemId: 'ITM-LOCAL-001',
        quantity: 1,
        department: 'Synthetic Department',
        purpose: 'Synthetic requester portal request',
        clientRequestId: `local-requester-portal-request-${suffix}`,
      },
    });
    expect(submittedRequest.status()).toBe(200);
    const requestResult = await submittedRequest.json();
    const requestHistory = await requester.get('/api/portal/request');
    await expect(requestHistory.json()).resolves.toMatchObject({
      requests: [expect.objectContaining({ id: requestResult.requestId, status: 'FOR_REVIEW' })],
    });
    expect(
      (
        await requester.post('/api/portal/request/cancel', {
          headers: { 'x-csrf-token': csrfToken },
          data: {
            requestId: requestResult.requestId,
            clientRequestId: `local-requester-portal-cancel-${suffix}`,
          },
        })
      ).status(),
    ).toBe(200);

    const lendingPortal = await requester.get('/api/portal/lending');
    expect(lendingPortal.status()).toBe(200);
    const submittedLending = await requester.post('/api/portal/lending', {
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
        await requester.post('/api/portal/lending/cancel', {
          headers: { 'x-csrf-token': csrfToken },
          data: {
            ticketId: lendingResult.ticketId,
            clientRequestId: `local-requester-portal-lending-cancel-${suffix}`,
          },
        })
      ).status(),
    ).toBe(200);
  } finally {
    await Promise.all([admin.dispose(), requester.dispose()]);
  }
});

test('D1 request split, allocation, release, and lending lifecycle preserve retry safety', async ({
  request,
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

  const releaseCommand = {
    requestId,
    recipientConfirmed: true,
    recipientName: 'Synthetic Recipient',
    recipientRole: 'Synthetic Tester',
    department: 'Synthetic Department',
    lines: [{ requestLineId: stockLine.id, quantity: 2 }],
    clientRequestId: 'local-e2e-release',
  };
  const released = await mutate(request, csrfToken, 'confirmRelease', releaseCommand);
  expect(released.status()).toBe(200);
  const releaseReplay = await mutate(request, csrfToken, 'confirmRelease', releaseCommand);
  expect(releaseReplay.status()).toBe(200);
  expect((await releaseReplay.json()).releaseId).toBe((await released.json()).releaseId);
  const duplicateRelease = await mutate(request, csrfToken, 'confirmRelease', {
    ...releaseCommand,
    clientRequestId: 'local-e2e-release-duplicate',
  });
  expect(duplicateRelease.status()).toBe(409);

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
