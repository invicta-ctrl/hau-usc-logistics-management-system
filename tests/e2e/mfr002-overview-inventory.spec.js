import { expect, test } from '@playwright/test';

const isDesktop = (testInfo) => testInfo.project.use.viewport.width >= 1024;
const isInventoryDesktop = (testInfo) => testInfo.project.use.viewport.width >= 960;

async function pageOverflow(page) {
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
}

async function installAuthenticatedOperations(page, requestedInventoryUrls) {
  await page.route('**/api/public/advertisements', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true,"items":[]}' }),
  );
  await page.route('**/api/auth/login', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        state: 'AUTHENTICATED',
        csrfToken: 'csrf-u05',
        user: {
          accountId: 'ACC-U05',
          displayName: 'U05 Operator',
          authorization: {
            active: true,
            mappingStatus: 'MAPPED',
            roleId: 'DOL_STAFF',
            capabilities: [
              'view.request',
              'view.internal',
              'view.inventory',
              'request.create',
              'request.review',
              'lending.create',
              'lending.approve',
              'fulfillment.release',
              'fulfillment.receive',
              'procurement.manage',
              'events.manage',
            ],
          },
        },
      }),
    }),
  );
  await page.route('**/api/me/appearance', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: '{"ok":true,"appearance":{"family":"HAU_INSTITUTIONAL","mode":"SYSTEM"}}',
    }),
  );
  await page.route('**/api/bootstrap/overview?**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        contract: 'bootstrap-module',
        contractVersion: 2,
        requestOnly: false,
        module: 'overview',
        scopeRevision: { token: 'overview-u05', updatedAt: '2026-08-31T09:00:00.000Z' },
        pagination: { page: 1, pageSize: 25, total: 2, hasMore: false },
        data: {
          eventSeries: [],
          eventDays: [],
          events: [
            {
              id: 'EVT-U05',
              name: 'Operations assembly',
              timeStatus: 'TBA',
              ownerReviewStatus: 'OWNER_REVIEW_REQUIRED',
              status: 'ACTIVE',
              updatedAt: '2026-08-31T08:30:00.000Z',
            },
          ],
          requests: [
            {
              id: 'REQ-U05',
              purpose: 'Urgent assembly support',
              department: 'DOL',
              priority: 'URGENT',
              status: 'FOR_REVIEW',
              updatedAt: '2026-08-31T08:00:00.000Z',
            },
          ],
          requestLines: [
            {
              id: 'LINE-U05',
              requestId: 'REQ-READY-U05',
              description: 'Folding chairs',
              quantity: 20,
              unit: 'piece',
              status: 'READY_TO_RELEASE',
              updatedAt: '2026-08-31T07:30:00.000Z',
            },
          ],
          inventoryItems: [
            {
              id: 'ITM-U05',
              name: 'Wireless microphone',
              availableToPromise: 0,
              lowStockState: 'LOW',
              classificationStatus: 'CLASSIFIED',
              updatedAt: '2026-08-31T07:00:00.000Z',
            },
          ],
          lendingTickets: [],
          restockRequests: [],
          deliverables: [],
        },
      }),
    }),
  );
  await page.route('**/api/bootstrap/inventory?**', (route) => {
    const url = new URL(route.request().url());
    requestedInventoryUrls.push(url);
    const query = url.searchParams.get('query') || '';
    const filter = url.searchParams.get('filter') || 'ALL';
    const matches = !query || 'wireless microphone itm-u05 equipment'.includes(query.toLowerCase());
    const filterMatches = filter === 'ALL' || filter === 'OUT' || filter === 'BELOW';
    const inventoryItems =
      matches && filterMatches
        ? [
            {
              id: 'ITM-U05',
              name: 'Wireless microphone',
              category: 'Equipment',
              unit: 'piece',
              onHand: 12,
              reserved: 12,
              availableToPromise: 0,
              reorderThreshold: 6,
              lowStockState: 'LOW',
              isLendable: true,
              lendingStatus: 'ACTIVE',
              inventoryKind: 'REUSABLE',
              classificationStatus: 'CLASSIFIED',
              conditionReviewState: 'ASSESSED',
              maintenanceReviewState: 'CURRENT',
              updatedAt: '2026-08-31T09:00:00.000Z',
              classificationHistory: [],
            },
          ]
        : [];
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        contract: 'bootstrap-module',
        contractVersion: 2,
        requestOnly: false,
        module: 'inventory',
        scopeRevision: { token: 'inventory-u05', updatedAt: '2026-08-31T09:00:00.000Z' },
        pagination: { page: 1, pageSize: 25, total: inventoryItems.length, hasMore: false },
        data: {
          inventoryItems,
          ledgerTransactions: inventoryItems.length
            ? [
                {
                  id: 'TXN-U05',
                  type: 'ISSUE',
                  direction: 'OUT',
                  itemId: 'ITM-U05',
                  quantity: 2,
                  signedQuantity: -2,
                  unit: 'piece',
                  relatedEntityType: 'REQUEST',
                  relatedId: 'REQ-U05',
                  status: 'POSTED',
                  notes: '',
                  createdAt: '2026-08-31T08:45:00.000Z',
                },
              ]
            : [],
          reservations: inventoryItems.length
            ? [
                {
                  id: 'RSV-U05',
                  itemId: 'ITM-U05',
                  quantity: 12,
                  unit: 'piece',
                  requestLineId: 'LINE-U05',
                  lendingTicketId: '',
                  status: 'ACTIVE',
                  clearedAt: '',
                  clearReason: '',
                  createdAt: '2026-08-31T08:00:00.000Z',
                  updatedAt: '2026-08-31T08:00:00.000Z',
                },
              ]
            : [],
          inventoryAssets: [],
          assetMaintenanceHistory: [],
          assetMovementHistory: [],
        },
      }),
    });
  });
}

async function signIn(page) {
  await page.goto('/');
  await page.getByRole('link', { name: 'Staff sign in' }).first().click();
  await page.getByLabel('Identifier').fill('u05.operator');
  await page.getByLabel('Password', { exact: true }).fill('service-verified-password');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
}

async function openInventory(page, testInfo) {
  if (isDesktop(testInfo)) {
    await page
      .getByRole('complementary', { name: 'Workspace navigation' })
      .getByRole('link', { name: 'Inventory' })
      .click();
    return;
  }
  await page.getByRole('button', { name: 'Open navigation' }).click();
  await page
    .getByRole('dialog', { name: 'Workspace navigation' })
    .getByRole('link', { name: 'Inventory' })
    .click();
}

test('MFR-002 U05 prioritizes real operational signals and a record-first Inventory journey', async ({
  page,
}, testInfo) => {
  const inventoryRequests = [];
  await installAuthenticatedOperations(page, inventoryRequests);
  await signIn(page);

  await expect(
    page.getByRole('heading', { name: 'Good work starts with the next clear action.' }),
  ).toBeVisible();
  const needsAttention = page.getByRole('region', { name: 'Needs attention' });
  const ready = page.getByRole('region', { name: 'Ready' });
  const blocked = page.getByRole('region', { name: 'Blocked' });
  const whatChanged = page.getByRole('region', { name: 'What changed' });
  await expect(needsAttention.getByRole('heading', { name: 'Urgent assembly support' })).toBeVisible();
  await expect(ready.getByRole('heading', { name: 'Folding chairs' })).toBeVisible();
  await expect(blocked).toBeVisible();
  await expect(whatChanged).toBeVisible();
  expect(await pageOverflow(page)).toBeLessThanOrEqual(1);

  await openInventory(page, testInfo);
  await expect(page.getByRole('heading', { name: 'Inventory', exact: true })).toBeVisible();
  await page.getByRole('searchbox', { name: 'Search inventory' }).fill('microphone');
  await expect
    .poll(() => inventoryRequests.some((url) => url.searchParams.get('query') === 'microphone'))
    .toBe(true);
  await page.getByRole('button', { name: 'Out of stock' }).click();
  await expect
    .poll(() => inventoryRequests.some((url) => url.searchParams.get('filter') === 'OUT'))
    .toBe(true);
  const opener = isInventoryDesktop(testInfo)
    ? page.getByRole('button', { name: /Wireless microphone, ITM-U05/u })
    : page.getByRole('button', { name: /Open item record Wireless microphone/u });
  await expect(opener).toBeVisible();
  await opener.click();
  const inspector = isInventoryDesktop(testInfo)
    ? page.getByRole('complementary', { name: 'Wireless microphone' })
    : page.getByRole('dialog', { name: 'Wireless microphone' });
  await expect(inspector).toContainText('Recent ledger movements');
  await expect(inspector).toContainText('RSV-U05');
  await expect(inspector).toContainText('Stock balances are read-only here.');
  expect(await pageOverflow(page)).toBeLessThanOrEqual(1);
});

test('MFR-002 U05 preserves 200 percent reflow for Overview and Inventory', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'frontend-1440', 'One exact 1440 to 720 CSS-pixel zoom simulation.');
  const inventoryRequests = [];
  await installAuthenticatedOperations(page, inventoryRequests);
  await page.setViewportSize({ width: 720, height: 500 });
  await signIn(page);

  await expect(page.getByRole('heading', { name: 'Needs attention' })).toBeVisible();
  expect(await pageOverflow(page)).toBeLessThanOrEqual(1);
  await openInventory(page, { project: { use: { viewport: { width: 720 } } } });
  await expect(page.getByRole('heading', { name: 'Inventory', exact: true })).toBeVisible();
  await page.getByRole('button', { name: /Open item record Wireless microphone/u }).click();
  await expect(page.getByRole('dialog', { name: 'Wireless microphone' })).toBeVisible();
  expect(await pageOverflow(page)).toBeLessThanOrEqual(1);
});
