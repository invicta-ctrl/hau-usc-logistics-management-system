import { expect, test } from '@playwright/test';

const PASSWORD = `LocalOnly${String.fromCharCode(33)}Pass2026`;
const TEMPORARY_PASSWORD = `Temporary${String.fromCharCode(33)}Local2026`;
const ACTIVATED_PASSWORD = `Activated${String.fromCharCode(33)}Local9472`;
const roles = [
  ['LOCAL.ADMIN', 'administrator'],
  ['LOCAL.DIRECTOR', 'director'],
  ['LOCAL.FOOD', 'food'],
  ['LOCAL.INVENTORY', 'inventory-pantry'],
  ['LOCAL.MATERIALS', 'materials'],
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
    database: { connected: true, schemaVersion: '7' },
  });

  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Logistics Operations' })).toBeVisible();
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
  expect(essentialData.navigation.filter((item) => item.enabled).map((item) => item.id)).toEqual([
    'request',
  ]);

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

for (const [accessId, experience] of roles) {
  test(`${accessId} receives only the server-routed ${experience} experience`, async ({ page }) => {
    await page.goto('/');
    await page.getByLabel('Access ID').fill(accessId);
    await page.getByLabel('Password').fill(PASSWORD);
    await page.getByRole('button', { name: 'Sign in' }).click();
    await expect(page.locator('.app-shell')).toBeVisible();
    await expect(page.locator('body')).toHaveAttribute('data-experience', experience);
    await expect(page.locator('body')).not.toHaveAttribute('data-bootstrap-failed', 'true');
    await expect(page.locator('#loading')).not.toHaveAttribute('data-state', 'error');
    await expect(page.getByRole('button', { name: 'Sign out' })).toBeVisible();
  });
}

test('starter activation rotates into a normal session and logout revokes it', async ({ page }) => {
  await page.goto('/');
  await page.getByLabel('Access ID').fill('LOCAL.STARTER');
  await page.getByLabel('Password').fill(TEMPORARY_PASSWORD);
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
  expect(requestLines.map((line) => line.status).sort()).toEqual([
    'FOR_CANVASSING',
    'READY_TO_RESERVE',
  ]);
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

test('committee-scoped canvass, procurement, and cumulative receiving execute in D1', async ({
  request,
}) => {
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
