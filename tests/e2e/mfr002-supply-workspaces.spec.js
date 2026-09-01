import { expect, test } from '@playwright/test';
import { navigateAuthenticatedRoute } from './navigation.js';

function fulfill(route, body, status = 200) {
  return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
}

async function installSupplyWorkspace(page, state, { shrinkOnRecheck = false } = {}) {
  await page.route('**/api/auth/session', (route) =>
    fulfill(route, { code: 'SESSION_REQUIRED', message: 'Sign in to continue.' }, 401),
  );
  await page.route('**/api/public/advertisements', (route) => fulfill(route, { ok: true, items: [] }));
  await page.route('**/api/auth/login', (route) =>
    fulfill(route, {
      state: 'AUTHENTICATED',
      csrfToken: 'csrf-u08',
      user: {
        accountId: 'ACC-U08',
        displayName: 'U08 Supply Operator',
        authorization: {
          active: true,
          mappingStatus: 'MAPPED',
          roleId: 'DOL_STAFF',
          capabilities: ['view.internal', 'view.inventory', 'fulfillment.receive', 'evidence.upload'],
        },
      },
    }),
  );
  await page.route('**/api/me/appearance', (route) =>
    fulfill(route, { ok: true, appearance: { family: 'HAU_INSTITUTIONAL', mode: 'SYSTEM' } }),
  );
  await page.route('**/api/bootstrap/overview?**', (route) =>
    fulfill(route, {
      ok: true,
      contract: 'bootstrap-module',
      contractVersion: 2,
      requestOnly: false,
      module: 'overview',
      scopeRevision: { token: 'overview-u08', updatedAt: '2026-08-31T10:00:00.000Z' },
      pagination: { page: 1, pageSize: 25, total: 0, hasMore: false },
      data: {
        eventSeries: [],
        eventDays: [],
        events: [],
        requests: [],
        requestLines: [],
        inventoryItems: [],
        lendingTickets: [],
        restockRequests: [],
        deliverables: [],
      },
    }),
  );
  await page.route('**/api/bootstrap/restocking?**', (route) => {
    state.restockBootstrapCalls += 1;
    const changed = shrinkOnRecheck && state.restockBootstrapCalls >= 3;
    const received = state.recorded ? 8 : changed ? 11 : 6;
    return fulfill(route, {
      ok: true,
      contract: 'bootstrap-module',
      contractVersion: 2,
      requestOnly: false,
      module: 'restocking',
      scopeRevision: {
        token: `restocking-u08-${state.restockBootstrapCalls}`,
        updatedAt: '2026-08-31T10:00:00.000Z',
      },
      pagination: { page: 1, pageSize: 25, total: 1, hasMore: false },
      data: {
        inventoryItems: [{ id: 'ITM-U08', name: 'Folding chair', unit: 'piece' }],
        restockRequests: [
          {
            id: 'RST-U08',
            source_request_id: 'REQ-U08',
            source_request_line_id: 'LINE-U08',
            item_id: 'ITM-U08',
            requested_quantity: 12,
            received_quantity: received,
            unit: 'piece',
            status: received >= 12 ? 'RECEIVED' : 'PARTIALLY_RECEIVED',
            updated_at: changed ? '2026-08-31T10:03:00.000Z' : '2026-08-31T10:00:00.000Z',
          },
        ],
        restockRecords: [
          {
            id: 'RRC-U08-PRIOR',
            restock_request_id: 'RST-U08',
            quantity: 6,
            unit: 'piece',
            invoice_status: 'RECORDED',
            invoice_number: 'INV-PRIOR',
            evidence_id: 'EVD-PRIOR',
            received_at: '2026-08-30T10:00:00.000Z',
          },
          ...(state.recorded
            ? [
                {
                  id: 'RRC-U08',
                  restock_request_id: 'RST-U08',
                  quantity: 2,
                  unit: 'piece',
                  invoice_status: 'RECORDED',
                  invoice_number: 'INV-U08',
                  evidence_id: 'EVD-U08',
                  received_at: '2026-08-31T10:05:00.000Z',
                },
              ]
            : []),
        ],
        canvassReferences: [
          {
            id: 'CAN-U08',
            linkedRestockId: 'RST-U08',
            linkedLineIds: ['LINE-U08'],
            supplierName: 'Campus Supply',
            location: 'Angeles City',
            price: 450,
            unit: 'piece',
            receiptStatus: 'AVAILABLE',
            reliability: 'VERIFIED',
            preferred: true,
            status: 'ACTIVE',
          },
        ],
      },
    });
  });
  await page.route('**/api/bootstrap/procurement?**', (route) =>
    fulfill(route, {
      ok: true,
      contract: 'bootstrap-module',
      contractVersion: 2,
      requestOnly: false,
      module: 'procurement',
      scopeRevision: { token: 'procurement-u08', updatedAt: '2026-08-31T10:00:00.000Z' },
      pagination: { page: 1, pageSize: 25, total: 1, hasMore: false },
      data: {
        eventSeries: [],
        events: [],
        requests: [{ id: 'REQ-PROC-U08', purpose: 'Assembly seating', department: 'Operations' }],
        requestLines: [
          {
            id: 'LINE-PROC-U08',
            requestId: 'REQ-PROC-U08',
            description: 'Stacking chair',
            unit: 'piece',
          },
        ],
        deliverables: [
          {
            id: 'DEL-U08',
            requestId: 'REQ-PROC-U08',
            requestLineId: 'LINE-PROC-U08',
            itemSpec: 'Stacking chair · black',
            quantity: 12,
            quantityReceived: 6,
            unit: 'piece',
            status: 'PARTIALLY_RECEIVED',
            procurementStatus: 'PROCURED',
            receiptStatus: 'PARTIALLY_RECEIVED',
            preferredCanvassId: 'CAN-PROC-U08',
            linkedCanvassIds: ['CAN-PROC-U08', 'CAN-ALT-U08'],
            neededAt: '2026-09-02T09:00:00.000Z',
          },
        ],
        canvassReferences: [
          {
            id: 'CAN-PROC-U08',
            linkedDeliverableId: 'DEL-U08',
            supplierName: 'Campus Supply',
            location: 'Angeles City',
            price: 450,
            unit: 'piece',
            receiptStatus: 'AVAILABLE',
            reliability: 'VERIFIED',
            checkedAt: '2026-08-29T09:00:00.000Z',
            status: 'ACTIVE',
          },
          {
            id: 'CAN-ALT-U08',
            linkedDeliverableId: 'DEL-U08',
            supplierName: 'Alternate Supply',
            location: 'San Fernando',
            price: 480,
            unit: 'piece',
            receiptStatus: 'AVAILABLE',
            reliability: 'VERIFIED',
            checkedAt: '2026-08-29T10:00:00.000Z',
            status: 'ACTIVE',
          },
        ],
      },
    }),
  );
  await page.route('**/api/uploadEvidence', (route) => {
    state.uploads.push(JSON.parse(route.request().postData() || '{}'));
    return fulfill(route, {
      evidenceId: 'EVD-U08',
      uploadStatus: 'STORED',
      duplicate: false,
      correlationId: 'COR-U08-EVIDENCE',
    });
  });
  await page.route('**/api/receiveRestock', (route) => {
    state.receipts.push(JSON.parse(route.request().postData() || '{}'));
    state.recorded = true;
    return fulfill(route, {
      restockId: 'RST-U08',
      receiptId: 'RRC-U08',
      quantityReceived: 2,
      cumulativeReceived: 8,
      remaining: 4,
      status: 'PARTIALLY_RECEIVED',
      replayed: false,
      correlationId: 'COR-U08-RECEIPT',
    });
  });
}

async function signIn(page) {
  await page.goto('/');
  await page.getByRole('link', { name: 'Staff sign in' }).first().click();
  await page.getByLabel('Identifier').fill('u08.operator');
  await page.getByLabel('Password', { exact: true }).fill('service-verified-password');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
}

async function openReceiving(page) {
  await signIn(page);
  await navigateAuthenticatedRoute(page, 'Restocking');
  await expect(page.getByRole('heading', { name: 'Receiving Desk', exact: true })).toBeVisible();
}

async function openProcurement(page) {
  await signIn(page);
  await navigateAuthenticatedRoute(page, 'Procurement');
  await expect(page.getByRole('heading', { name: 'Procurement Workspace', exact: true })).toBeVisible();
}

async function prepareReceipt(page, quantity = '2') {
  await page.getByLabel('Quantity received now').fill(quantity);
  await page.getByLabel('Invoice number (optional)').fill('INV-U08');
  await page.getByLabel('Governed receiving evidence').setInputFiles({
    name: 'receiving-proof.jpg',
    mimeType: 'image/jpeg',
    buffer: Buffer.from([0xff, 0xd8, 0xff, 0xe0]),
  });
  await page.getByRole('button', { name: 'Review receiving consequence' }).click();
}

test('MFR-002 U08 records a cumulative receipt only after exact review and authoritative recheck', async ({
  page,
}) => {
  const state = { restockBootstrapCalls: 0, uploads: [], receipts: [], recorded: false };
  await installSupplyWorkspace(page, state);
  await openReceiving(page);

  await expect(page.getByRole('heading', { name: 'Open receiving records' })).toBeVisible();
  await expect(page.getByText('6 of 12 piece received')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Restock requests', exact: true })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Canvass references', exact: true })).toHaveCount(0);

  await prepareReceipt(page);
  const confirmation = page.getByRole('dialog', { name: 'Recheck and record receipt' });
  await expect(confirmation).toBeVisible();
  await expect(confirmation.getByText('RST-U08', { exact: true })).toBeVisible();
  await expect(confirmation.getByText('2 piece', { exact: true })).toBeVisible();
  await expect(confirmation.getByText('6 of 12 piece', { exact: true })).toBeVisible();
  await expect(confirmation.getByText('8 of 12 piece', { exact: true })).toBeVisible();
  await expect(confirmation.getByText(/leaves 4 piece outstanding/u)).toBeVisible();
  const acknowledgment = confirmation.getByRole('checkbox', {
    name: /I verified the record, item, quantity, prior cumulative total/u,
  });
  await expect(acknowledgment).toBeFocused();
  await expect(page.locator('.auth-shell__sidebar')).toHaveAttribute('aria-hidden', 'true');
  expect(state.uploads).toHaveLength(0);
  expect(state.receipts).toHaveLength(0);

  await page.keyboard.press('Escape');
  await expect(confirmation).toHaveCount(0);
  const review = page.getByRole('button', { name: 'Review receiving consequence' });
  await expect(review).toBeFocused();
  await review.click();
  await acknowledgment.check();
  await confirmation.getByRole('button', { name: 'Recheck and record receipt' }).click();

  await expect(page.getByText(/Partial receipt RRC-U08 recorded/u)).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Recent receiving records' })).toBeVisible();
  await expect(page.getByText('INV-U08', { exact: true })).toBeVisible();
  expect(state.restockBootstrapCalls).toBeGreaterThanOrEqual(3);
  expect(state.uploads).toHaveLength(1);
  expect(state.receipts).toHaveLength(1);
  expect(state.uploads[0]).toMatchObject({
    evidenceType: 'RESTOCK_RECEIPT',
    relatedEntityType: 'RESTOCK',
    relatedEntityId: 'RST-U08',
    restockId: 'RST-U08',
    originalFileName: 'receiving-proof.jpg',
    mimeType: 'image/jpeg',
    clientRequestId: expect.stringMatching(/^p08-restock-evidence-/u),
  });
  expect(state.receipts[0]).toMatchObject({
    restockRequestId: 'RST-U08',
    quantity: 2,
    unit: 'piece',
    evidenceId: 'EVD-U08',
    invoiceStatus: 'RECORDED',
    invoiceNumber: 'INV-U08',
    clientRequestId: expect.stringMatching(/^p08-restock-/u),
  });
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth),
  ).toBeLessThanOrEqual(1);
});

test('MFR-002 U08 stops a stale receipt before evidence upload', async ({ page }, testInfo) => {
  test.skip(
    !['frontend-390', 'frontend-1440'].includes(testInfo.project.name),
    'One mobile and one desktop authoritative-change proof are sufficient.',
  );
  const state = { restockBootstrapCalls: 0, uploads: [], receipts: [], recorded: false };
  await installSupplyWorkspace(page, state, { shrinkOnRecheck: true });
  await openReceiving(page);
  await prepareReceipt(page, '2');

  const confirmation = page.getByRole('dialog', { name: 'Recheck and record receipt' });
  await confirmation
    .getByRole('checkbox', { name: /I verified the record, item, quantity, prior cumulative total/u })
    .check();
  await confirmation.getByRole('button', { name: 'Recheck and record receipt' }).click();

  await expect(page.getByText(/Authoritative recheck stopped this receipt/u)).toBeVisible();
  await expect(page.getByText(/Only 1 piece remains receivable/u)).toBeVisible();
  expect(state.uploads).toHaveLength(0);
  expect(state.receipts).toHaveLength(0);
});

test('MFR-002 U08 keeps procurement read-only and leads with supplier and deliverable consequence', async ({
  page,
}) => {
  const state = { restockBootstrapCalls: 0, uploads: [], receipts: [], recorded: false };
  await installSupplyWorkspace(page, state);
  await openProcurement(page);

  await expect(page.getByRole('heading', { name: 'Deliverables', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Stacking chair · black' })).toBeVisible();
  await expect(page.getByText('6 of 12 piece received')).toBeVisible();
  await expect(page.getByText('Campus Supply', { exact: true })).toBeVisible();
  await expect(page.getByText('Alternate Supply', { exact: true })).toBeVisible();
  await expect(page.getByText('Preferred', { exact: true })).toHaveCount(1);
  await expect(page.getByText(/6 piece remain for governed receiving/u)).toBeVisible();
  await expect(page.locator('[data-operational-module="procurement"] form')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Canvass references', exact: true })).toHaveCount(0);
  expect(state.uploads).toHaveLength(0);
  expect(state.receipts).toHaveLength(0);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth),
  ).toBeLessThanOrEqual(1);
});
