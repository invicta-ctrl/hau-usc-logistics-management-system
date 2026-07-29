import { expect, test } from '@playwright/test';
import { createEmptyBootstrapFixture } from '../fixtures/bootstrap-fixtures.js';

const MATERIALS_CAPABILITIES = [
  'view.request',
  'view.internal',
  'view.committee.summary',
  'view.inventory',
  'request.review',
  'fulfillment.canvass',
  'fulfillment.procure',
  'fulfillment.receive',
  'fulfillment.release',
  'evidence.upload',
];

const materialsItems = [
  {
    deliverableId: 'SYNTHETIC-DEL-MAT-1',
    componentId: 'SYNTHETIC-DEL-MAT-1',
    requestId: 'SYNTHETIC-REQ-MAT-1',
    requestLineId: 'SYNTHETIC-LINE-MAT-1',
    eventSeriesId: 'SYNTHETIC-SERIES-1',
    eventId: 'SYNTHETIC-EVENT-MAT-1',
    status: 'FOR_CANVASSING',
    ownerCommitteeId: 'COM_MATERIALS',
    quantityRequested: 120,
    quantityReceived: 0,
    quantityReleased: 0,
    unit: 'piece',
    neededAt: '2026-08-15T01:00:00.000Z',
    parent: {
      eventId: 'SYNTHETIC-EVENT-MAT-1',
      eventName: 'Synthetic University Assembly',
      eventStartAt: '2026-08-15T01:00:00.000Z',
      priority: 'HIGH',
      purpose: 'Wayfinding and program documentation',
      department: 'Synthetic Events Office',
    },
    materials: {
      materialCategory: 'PRINTING_SIGNAGE',
      specification: 'A3 directional signs on 220 gsm board',
      requiredBy: '2026-08-15T01:00:00.000Z',
      usagePurpose: 'Wayfinding and program documentation',
      fulfillmentPath: 'PROCUREMENT',
      budgetStatus: 'NOT_STARTED',
      procurementStatus: 'FOR_CANVASSING',
      preferredCanvassId: null,
      preferredSupplierName: null,
    },
    lines: [
      {
        id: 'SYNTHETIC-LINE-MAT-1',
        description: 'Directional signs',
        specification: 'A3 directional signs on 220 gsm board',
        category: 'PRINTING_SIGNAGE',
        quantity: 120,
        receivedQuantity: 0,
        releasedQuantity: 0,
        unit: 'piece',
      },
    ],
    quoteSummary: { activeCount: 1, distinctUnits: 1, latestCheckedAt: '2026-07-25T08:00:00.000Z' },
  },
  {
    deliverableId: 'SYNTHETIC-DEL-MAT-2',
    componentId: 'SYNTHETIC-DEL-MAT-2',
    requestId: 'SYNTHETIC-REQ-MAT-1',
    requestLineId: 'SYNTHETIC-LINE-MAT-2',
    eventSeriesId: 'SYNTHETIC-SERIES-1',
    eventId: 'SYNTHETIC-EVENT-MAT-1',
    status: 'PARTIALLY_RECEIVED',
    ownerCommitteeId: 'COM_MATERIALS',
    quantityRequested: 40,
    quantityReceived: 25,
    quantityReleased: 0,
    unit: 'set',
    neededAt: '2026-08-15T01:00:00.000Z',
    parent: {
      eventId: 'SYNTHETIC-EVENT-MAT-1',
      eventName: 'Synthetic University Assembly',
      eventStartAt: '2026-08-15T01:00:00.000Z',
      priority: 'HIGH',
      purpose: 'Delegate documentation kits',
      department: 'Synthetic Events Office',
    },
    materials: {
      materialCategory: 'EVENT_MATERIALS',
      specification: 'Delegate documentation kit with numbered folder',
      requiredBy: '2026-08-15T01:00:00.000Z',
      usagePurpose: 'Delegate documentation kits',
      fulfillmentPath: 'PROCUREMENT',
      budgetStatus: 'CLEARED',
      procurementStatus: 'PROCURED',
      receiptStatus: 'PARTIALLY_RECEIVED',
      preferredCanvassId: 'SYNTHETIC-CAN-1',
      preferredSupplierId: 'SYNTHETIC-SUP-1',
      preferredSupplierName: 'Synthetic Print House',
      preferredPrice: 185,
      preferredUnit: 'set',
    },
    lines: [
      {
        id: 'SYNTHETIC-LINE-MAT-2',
        description: 'Documentation kits',
        specification: 'Delegate documentation kit with numbered folder',
        category: 'EVENT_MATERIALS',
        quantity: 40,
        receivedQuantity: 25,
        releasedQuantity: 0,
        unit: 'set',
      },
    ],
    quoteSummary: { activeCount: 3, distinctUnits: 1, latestCheckedAt: '2026-07-25T09:00:00.000Z' },
  },
];

async function openMaterials(
  page,
  { capabilities = MATERIALS_CAPABILITIES, scopeSensitive = false } = {},
) {
  const bootstrap = createEmptyBootstrapFixture({ backendMode: 'rest' });
  bootstrap.currentUser = {
    ...bootstrap.currentUser,
    id: 'SYNTHETIC-MATERIALS-OPERATOR',
    displayName: 'Authorized Materials Operator',
    role: 'DOL_STAFF',
    permissions: { review: true, release: true, receive: true, admin: false, manageCatalog: false },
    authorization: {
      contract: 'canonical-authorization',
      contractVersion: 2,
      modelVersion: 2,
      roleId: 'DOL_STAFF',
      roleLabel: 'DOL staff',
      scopeMode: 'COMMITTEE',
      committeeIds: ['COM_MATERIALS'],
      committees: [{ id: 'COM_MATERIALS', name: 'Materials Committee' }],
      capabilities,
      workspaceIds: ['materials'],
      defaultWorkspaceId: 'materials',
      mappingStatus: 'MAPPED',
      active: true,
    },
  };
  bootstrap.operationalContext = {
    selected: {
      value: 'ALL:AUTHORIZED',
      kind: 'ALL',
      id: 'AUTHORIZED',
      label: 'All authorized operations',
      purpose: 'Global authorized view',
      available: true,
    },
    options: [
      {
        value: 'ALL:AUTHORIZED',
        kind: 'ALL',
        id: 'AUTHORIZED',
        label: 'All authorized operations',
        purpose: 'Global authorized view',
        available: true,
      },
      {
        value: 'COMMITTEE:COM_MATERIALS',
        kind: 'COMMITTEE',
        id: 'COM_MATERIALS',
        label: 'Materials Committee',
        purpose: 'Committee-owned operations',
        available: true,
      },
    ],
  };
  bootstrap.deliverables = materialsItems.map((item) => ({
    id: item.deliverableId,
    requestId: item.requestId,
    requestLineId: item.requestLineId,
    eventId: item.eventId,
    itemSpec: item.materials.specification,
    quantity: item.quantityRequested,
    quantityReceived: item.quantityReceived,
    quantityReleased: item.quantityReleased,
    unit: item.unit,
    status: item.status,
    fulfillmentSource: item.materials.fulfillmentPath,
    assignedCommittee: 'Materials Committee',
    assignedStaff: '',
    budgetStatus: item.materials.budgetStatus,
    procurementStatus: item.materials.procurementStatus,
    preferredCanvassId: item.materials.preferredCanvassId ?? '',
    linkedCanvassIds: item.materials.preferredCanvassId ? [item.materials.preferredCanvassId] : [],
    inventoryMatchId: '',
    eventItemId: '',
    neededAt: item.neededAt,
  }));
  bootstrap.canvassReferences = [
    {
      id: 'SYNTHETIC-CAN-1',
      linkedDeliverableId: 'SYNTHETIC-DEL-MAT-2',
      itemSpec: 'Delegate documentation kit with numbered folder',
      supplierId: 'SYNTHETIC-SUP-1',
      supplierName: 'Synthetic Print House',
      supplierTin: 'PRIVATE-TEST-TIN',
      location: 'Synthetic City',
      price: 185,
      unit: 'set',
      checkedAt: '2026-07-25T09:00:00.000Z',
      receiptStatus: 'ORIGINAL_RECEIPT',
      reliability: 'RELIABLE',
      status: 'ACTIVE',
      linkedLineIds: ['SYNTHETIC-LINE-MAT-2'],
    },
  ];

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
        csrfToken: 'materials-csrf',
        user: {
          accountId: 'SYNTHETIC-MATERIALS-OPERATOR',
          displayName: 'Authorized Materials Operator',
          experienceId: 'materials',
          authorization: bootstrap.currentUser.authorization,
        },
      }),
    }),
  );
  let bootstrapCalls = 0;
  await page.route('**/api/getBootstrapData', (route) => {
    bootstrapCalls += 1;
    const response = structuredClone(bootstrap);
    if (scopeSensitive && bootstrapCalls > 1)
      response.operationalContext.selected = response.operationalContext.options[1];
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, data: response }),
    });
  });
  const materialsQueueScopes = [];
  await page.route('**/api/getMaterialsWorkQueue', (route) => {
    const operationalScope = route.request().postDataJSON()?.operationalScope ?? '';
    materialsQueueScopes.push(operationalScope);
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        committeeId: 'COM_MATERIALS',
        items:
          scopeSensitive && operationalScope !== 'COMMITTEE:COM_MATERIALS' ? [] : materialsItems,
      }),
    });
  });
  await page.goto('/app/materials');
  await expect(page.locator('#loading')).toHaveClass(/hidden/u);
  if (!scopeSensitive)
    await expect(page.locator('#materialsCommitteeQueue')).toContainText('SYNTHETIC-DEL-MAT-1');
  return { bootstrap, materialsQueueScopes };
}

test('Materials exposes all accepted destinations and a stable source-grounded pipeline', async ({ page }, testInfo) => {
  test.skip(
    !['chromium-390', 'chromium-1366'].includes(testInfo.project.name),
    'One mobile and one desktop proof are sufficient.',
  );
  await openMaterials(page);
  const shell = page.locator('[data-internal-shell-context]');
  await expect(shell.getByLabel('Workspace')).toHaveValue('materials');
  await expect(shell.locator('[data-shell-account-role]')).toHaveText('DOL staff');

  const panel = page.locator('#roleExperiencePanel[data-role-experience="materials"]');
  await expect(panel.getByRole('heading', { name: 'Materials Overview' })).toBeVisible();
  for (const [destination, name] of [
    ['materials-queue', 'Materials Queue'],
    ['materials-canvassing', 'Canvassing'],
    ['materials-procurement', 'Procurement'],
    ['materials-suppliers', 'Suppliers'],
    ['materials-price-history', 'Price History'],
    ['materials-receiving', 'Receiving'],
    ['materials-deliverables', 'Deliverables'],
    ['materials-release', 'Release Desk'],
  ]) {
    await expect(
      panel.locator(`.role-experience-actions [data-materials-destination="${destination}"]`),
    ).toContainText(name);
  }
  await expect(panel).toContainText('Synthetic University Assembly');
  await expect(panel).toContainText('SYNTHETIC-REQ-MAT-1');
  await expect(panel).toContainText('SYNTHETIC-DEL-MAT-1');
  await expect(panel).toContainText('A3 directional signs on 220 gsm board');
  await expect(panel).toContainText('Requested 120 piece · Received 0 · Released 0');
  await expect(panel).toContainText('1 active quote');
  await expect(panel).toContainText('No preferred quote');
  await expect(panel).toContainText('Synthetic Print House');
  await expect(panel).not.toContainText('PRIVATE-TEST-TIN');
});

test('Materials refreshes canonical overview truth when operational scope changes', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-1366', 'One focused scope-change proof is sufficient.');
  const { materialsQueueScopes } = await openMaterials(page, { scopeSensitive: true });
  const panel = page.locator('#roleExperiencePanel[data-role-experience="materials"]');
  await expect(panel).toContainText('0 scoped deliverables');

  await page
    .locator('[data-internal-shell-context]')
    .getByLabel('Operational scope')
    .selectOption('COMMITTEE:COM_MATERIALS');

  await expect(page).toHaveURL(/scope=COMMITTEE%3ACOM_MATERIALS/u);
  await expect.poll(() => materialsQueueScopes).toContain('COMMITTEE:COM_MATERIALS');
  await expect(panel).toContainText('2 scoped deliverables');
  await expect(panel).toContainText('SYNTHETIC-DEL-MAT-1');
});

test('Materials destinations reuse shared queue, canvass, deliverables, receiving, and Release Desk', async ({ page }, testInfo) => {
  test.skip(
    !['chromium-390', 'chromium-1366'].includes(testInfo.project.name),
    'One mobile and one desktop proof are sufficient.',
  );
  await openMaterials(page);
  let panel = page.locator('#roleExperiencePanel[data-role-experience="materials"]');

  await panel.locator('[data-materials-destination="materials-queue"]').last().click();
  await expect(page.locator('#request')).toHaveClass(/active/u);
  await expect(page.locator('#materialsCommitteeQueue')).toBeFocused();

  await page.goto('/app/materials');
  await expect(page.locator('#loading')).toHaveClass(/hidden/u);
  panel = page.locator('#roleExperiencePanel[data-role-experience="materials"]');
  await panel.locator('[data-materials-destination="materials-canvassing"]').last().click();
  await expect(page.locator('#procurement')).toHaveClass(/active/u);
  await expect(page.locator('[data-proc-tab="canvass"]')).toHaveClass(/active/u);

  await page.goto('/app/materials');
  await expect(page.locator('#loading')).toHaveClass(/hidden/u);
  await page.locator('#roleExperiencePanel [data-materials-destination="materials-deliverables"]').last().click();
  await expect(page.locator('[data-proc-tab="deliverables"]')).toHaveClass(/active/u);

  await page.goto('/app/materials');
  await expect(page.locator('#loading')).toHaveClass(/hidden/u);
  await page.locator('#roleExperiencePanel [data-materials-destination="materials-receiving"]').last().click();
  await expect(page.locator('[data-proc-tab="receiving"]')).toHaveClass(/active/u);

  await page.goto('/app/materials');
  await expect(page.locator('#loading')).toHaveClass(/hidden/u);
  await page.locator('#roleExperiencePanel [data-materials-destination="materials-release"]').last().click();
  await expect(page.locator('#release')).toHaveClass(/active/u);

  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth))
    .toBeLessThanOrEqual(1);
});

test('Materials receiving fails closed without its server capability', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-390', 'One focused capability projection is sufficient.');
  await openMaterials(page, {
    capabilities: MATERIALS_CAPABILITIES.filter((capability) => capability !== 'fulfillment.receive'),
  });
  const receivingActions = page.locator('[data-materials-destination="materials-receiving"]');
  await expect(receivingActions).toHaveCount(2);
  await expect(receivingActions.first()).toBeDisabled();
  await expect(receivingActions.last()).toBeDisabled();
  await expect(page.locator('#procurement')).not.toHaveClass(/active/u);
});
