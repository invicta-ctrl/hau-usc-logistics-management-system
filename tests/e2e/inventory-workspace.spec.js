import { expect, test } from '@playwright/test';
import { createEmptyBootstrapFixture } from '../fixtures/bootstrap-fixtures.js';

const INVENTORY_CAPABILITIES = [
  'view.request',
  'view.internal',
  'view.committee.summary',
  'view.inventory',
  'request.create',
  'request.review',
  'fulfillment.reserve',
  'fulfillment.receive',
  'fulfillment.release',
  'lending.approve',
  'lending.handoff',
  'lending.return',
];

async function openInventory(page, { capabilities = INVENTORY_CAPABILITIES } = {}) {
  const bootstrap = createEmptyBootstrapFixture({ backendMode: 'rest' });
  bootstrap.currentUser = {
    ...bootstrap.currentUser,
    id: 'SYNTHETIC-INVENTORY-OPERATOR',
    displayName: 'Authorized Inventory Operator',
    role: 'DOL_STAFF',
    permissions: { review: true, release: true, receive: true, admin: false, manageCatalog: false },
    authorization: {
      contract: 'canonical-authorization',
      contractVersion: 2,
      modelVersion: 2,
      roleId: 'DOL_STAFF',
      roleLabel: 'DOL staff',
      scopeMode: 'COMMITTEE',
      committeeIds: ['COM_INVENTORY_PANTRY'],
      committees: [{ id: 'COM_INVENTORY_PANTRY', name: 'Inventory & Pantry Committee' }],
      capabilities,
      workspaceIds: ['inventory-pantry'],
      defaultWorkspaceId: 'inventory-pantry',
      mappingStatus: 'MAPPED',
      active: true,
    },
  };
  bootstrap.inventoryItems = [
    {
      id: 'SYNTHETIC-ITEM-LOW',
      name: 'Synthetic Office Stock',
      category: 'Office Supplies',
      stockArea: 'Inventory',
      handling: 'Consumable',
      unit: 'piece',
      reorderThreshold: 6,
      lowStockAlertEnabled: true,
      lowStockThreshold: 6,
      status: 'ACTIVE',
      catalogType: 'OFFICE_INVENTORY',
    },
    {
      id: 'SYNTHETIC-PANTRY-1',
      name: 'Synthetic Pantry Stock',
      category: 'Pantry',
      stockArea: 'Pantry',
      handling: 'Consumable',
      unit: 'pack',
      reorderThreshold: 1,
      status: 'ACTIVE',
      catalogType: 'PANTRY',
    },
    {
      id: 'SYNTHETIC-REUSABLE-NEGATIVE',
      name: 'Synthetic Reusable Negative ATP',
      aliases: ['negative asset', 'equipment fixture'],
      category: 'Equipment',
      stockArea: 'Inventory',
      handling: 'Reusable Asset',
      handlingCode: 'REUSABLE_ASSET',
      unit: 'piece',
      reorderThreshold: 1,
      status: 'ACTIVE',
      catalogType: 'OFFICE_INVENTORY',
      classificationStatus: 'CLASSIFIED',
      inventoryKind: 'REUSABLE',
      isLendable: true,
      lendingAudience: 'USC_STAFF_ONLY',
      provenance: { type: 'EVENT_TRANSFER', originEventItemId: 'EIT-SYNTHETIC-0001' },
      updatedAt: '2026-08-03T10:00:00.000Z',
    },
    {
      id: 'SYNTHETIC-ARCHIVED',
      name: 'Synthetic Archived Stock',
      category: 'Office Supplies',
      stockArea: 'Inventory',
      handling: 'Consumable',
      unit: 'piece',
      reorderThreshold: 1,
      status: 'ARCHIVED',
      catalogType: 'OFFICE_INVENTORY',
      updatedAt: '2026-08-03T09:00:00.000Z',
    },
  ];
  bootstrap.ledgerTransactions = [
    { id: 'SYNTHETIC-LEDGER-IN', itemId: 'SYNTHETIC-ITEM-LOW', direction: 'IN', quantity: 10, unit: 'piece', transactionType: 'PURCHASE_RECEIPT', status: 'POSTED', createdAt: '2026-07-25T08:00:00.000Z' },
    { id: 'SYNTHETIC-LEDGER-OUT', itemId: 'SYNTHETIC-ITEM-LOW', direction: 'OUT', quantity: 2, unit: 'piece', transactionType: 'ISSUE', status: 'POSTED', createdAt: '2026-07-26T08:00:00.000Z' },
    { id: 'SYNTHETIC-PANTRY-IN', itemId: 'SYNTHETIC-PANTRY-1', direction: 'IN', quantity: 3, unit: 'pack', transactionType: 'PURCHASE_RECEIPT', status: 'POSTED', createdAt: '2026-07-25T09:00:00.000Z' },
    { id: 'SYNTHETIC-NEGATIVE-IN', itemId: 'SYNTHETIC-REUSABLE-NEGATIVE', direction: 'IN', quantity: 3, unit: 'piece', transactionType: 'PURCHASE_RECEIPT', status: 'POSTED', createdAt: '2026-07-25T10:00:00.000Z' },
  ];
  bootstrap.reservations = [
    { id: 'SYNTHETIC-RESERVATION-1', itemId: 'SYNTHETIC-ITEM-LOW', quantity: 2, status: 'ACTIVE' },
    { id: 'SYNTHETIC-NEGATIVE-RESERVATION', itemId: 'SYNTHETIC-REUSABLE-NEGATIVE', quantity: 5, status: 'ACTIVE' },
  ];
  bootstrap.evidenceFiles = [
    {
      id: 'SYNTHETIC-EVIDENCE-1',
      itemId: 'SYNTHETIC-REUSABLE-NEGATIVE',
      fileName: 'synthetic-inventory-evidence.pdf',
    },
  ];
  bootstrap.inventoryAssets = [
    { id: 'SYNTHETIC-ASSET-1', item_id: 'SYNTHETIC-ITEM-LOW', asset_tag: 'SYN-ASSET-001', condition_label: 'DAMAGED', lifecycle_status: 'MAINTENANCE' },
  ];
  bootstrap.assetMaintenanceHistory = [
    { id: 'SYNTHETIC-MAINT-1', asset_id: 'SYNTHETIC-ASSET-1', event_type: 'MAINTENANCE_OPENED', condition_label: 'DAMAGED', occurred_at: '2026-07-26T09:00:00.000Z' },
  ];
  bootstrap.assetMovementHistory = [
    { id: 'SYNTHETIC-ASSET-MOVE-1', asset_id: 'SYNTHETIC-ASSET-1', movement_type: 'MAINTENANCE_HOLD', previous_status: 'AVAILABLE', new_status: 'MAINTENANCE', condition_label: 'DAMAGED', occurred_at: '2026-07-26T09:00:00.000Z' },
  ];
  bootstrap.restockRequests = [
    { id: 'SYNTHETIC-RESTOCK-1', itemId: 'SYNTHETIC-ITEM-LOW', quantity: 8, status: 'PROCURED' },
  ];
  bootstrap.lendingTickets = [
    { id: 'SYNTHETIC-LOAN-1', itemId: 'SYNTHETIC-ITEM-LOW', quantity: 1, status: 'OVERDUE' },
  ];
  bootstrap.requestLines = [
    { id: 'SYNTHETIC-LINE-1', itemId: 'SYNTHETIC-ITEM-LOW', status: 'READY_TO_RELEASE', fulfillmentSource: 'ISSUE_FROM_STOCK' },
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
        csrfToken: 'inventory-csrf',
        user: {
          accountId: 'SYNTHETIC-INVENTORY-OPERATOR',
          displayName: 'Authorized Inventory Operator',
          experienceId: 'inventory-pantry',
          authorization: bootstrap.currentUser.authorization,
        },
      }),
    }),
  );
  await page.route('**/api/getBootstrapData', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, data: bootstrap }) }),
  );
  await page.goto('/app/inventory');
  await expect(page.locator('#loading')).toHaveClass(/hidden/u);
  return bootstrap;
}

test('Inventory & Pantry exposes every accepted destination and distinct stock truth', async ({ page }, testInfo) => {
  test.skip(
    !['chromium-390', 'chromium-1366'].includes(testInfo.project.name),
    'One mobile and one desktop proof are sufficient.',
  );
  await openInventory(page);
  const shell = page.locator('[data-internal-shell-context]');
  await expect(shell.getByLabel('Workspace')).toHaveValue('inventory-pantry');
  await expect(shell.locator('[data-shell-account-role]')).toHaveText('DOL staff');
  await expect(page.locator('[data-admin-view="referenceAdmin"]')).toBeHidden();

  const panel = page.locator('#roleExperiencePanel[data-role-experience="inventory-pantry"]');
  await expect(panel.getByRole('heading', { name: 'Inventory Overview' })).toBeVisible();
  for (const [destination, name] of [
    ['inventory-management', 'Inventory Management'],
    ['inventory-pantry-stock', 'Pantry'],
    ['inventory-restocking', 'Restocking'],
    ['inventory-lending', 'Lending Operations'],
    ['inventory-receiving', 'Receiving'],
    ['inventory-release', 'Release Desk'],
    ['inventory-movement-history', 'Movement History'],
    ['inventory-alerts', 'Condition & Stock Alerts'],
  ]) {
    await expect(
      panel.locator(`.role-experience-actions [data-inventory-destination="${destination}"]`),
    ).toContainText(name);
  }
  await expect(panel).toContainText('SYNTHETIC-ITEM-LOW');
  await expect(panel).toContainText('On hand 8 · Reserved 2 · ATP 6 piece');
  await expect(panel).toContainText('Low Stock');
  await expect(panel.getByRole('button', { name: /^Overdue 1 /u })).toBeVisible();
});

test('Inventory destinations reuse canonical stock, circulation, receiving, release, movement, and alert surfaces', async ({ page }, testInfo) => {
  test.skip(
    !['chromium-390', 'chromium-1366'].includes(testInfo.project.name),
    'One mobile and one desktop proof are sufficient.',
  );
  await openInventory(page);
  let panel = page.locator('#roleExperiencePanel[data-role-experience="inventory-pantry"]');

  await panel.locator('.role-experience-actions [data-inventory-destination="inventory-pantry-stock"]').click();
  await expect(page.locator('#inventory')).toHaveClass(/active/u);
  await expect(page.locator('#inventoryAreaFilter')).toHaveValue('Pantry');
  await expect(page.locator('#inventoryTable')).toContainText('SYNTHETIC-PANTRY-1');

  await page.goto('/app/inventory');
  await expect(page.locator('#loading')).toHaveClass(/hidden/u);
  panel = page.locator('#roleExperiencePanel[data-role-experience="inventory-pantry"]');
  await panel.locator('.role-experience-actions [data-inventory-destination="inventory-restocking"]').click();
  await expect(page.locator('#restocking')).toHaveClass(/active/u);

  await page.goto('/app/inventory');
  await expect(page.locator('#loading')).toHaveClass(/hidden/u);
  await page.locator('#roleExperiencePanel .role-experience-actions [data-inventory-destination="inventory-lending"]').click();
  await expect(page.locator('#lending')).toHaveClass(/active/u);
  await expect(page.locator('[data-loan-tab="FOR_REVIEW"]')).toHaveClass(/active/u);

  await page.goto('/app/inventory');
  await expect(page.locator('#loading')).toHaveClass(/hidden/u);
  await page.locator('#roleExperiencePanel .role-experience-actions [data-inventory-destination="inventory-receiving"]').click();
  await expect(page.locator('#restocking')).toHaveClass(/active/u);
  await expect(page.locator('#restockReceiveForm')).toBeVisible();

  await page.goto('/app/inventory');
  await expect(page.locator('#loading')).toHaveClass(/hidden/u);
  await page.locator('#roleExperiencePanel .role-experience-actions [data-inventory-destination="inventory-release"]').click();
  await expect(page.locator('#release')).toHaveClass(/active/u);

  await page.goto('/app/inventory');
  await expect(page.locator('#loading')).toHaveClass(/hidden/u);
  await page.locator('#roleExperiencePanel .role-experience-actions [data-inventory-destination="inventory-movement-history"]').click();
  let supplement = page.locator('[data-inventory-workspace-supplement]');
  await expect(supplement).toBeFocused();
  await expect(supplement).toContainText('SYNTHETIC-LEDGER-OUT');
  await expect(supplement).toContainText('SYNTHETIC-ASSET-MOVE-1');

  await page.goto('/app/inventory');
  await expect(page.locator('#loading')).toHaveClass(/hidden/u);
  await page.locator('#roleExperiencePanel .role-experience-actions [data-inventory-destination="inventory-alerts"]').click();
  supplement = page.locator('[data-inventory-workspace-supplement]');
  await expect(supplement).toBeFocused();
  await expect(supplement).toContainText('SYN-ASSET-001');
  await expect(supplement).toContainText('MAINTENANCE');

  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth))
    .toBeLessThanOrEqual(1);
});

test('Inventory receiving projection fails closed without its server capability', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-390', 'One focused capability projection is sufficient.');
  await openInventory(page, {
    capabilities: INVENTORY_CAPABILITIES.filter((capability) => capability !== 'fulfillment.receive'),
  });
  const receivingActions = page.locator('[data-inventory-destination="inventory-receiving"]');
  await expect(receivingActions).toHaveCount(2);
  await expect(receivingActions.first()).toBeDisabled();
  await expect(receivingActions.last()).toBeDisabled();
  await expect(page.locator('#restocking')).not.toHaveClass(/active/u);
});

test('Inventory extension filters, sorts, and exposes negative raw ATP without changing allocation safety', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-1366', 'One desktop proof is sufficient.');
  await openInventory(page);
  await page
    .locator('#roleExperiencePanel .role-experience-actions [data-inventory-destination="inventory-management"]')
    .click();
  await expect(page.locator('#inventory')).toHaveClass(/active/u);

  const controls = page.locator('[data-inventory-advanced-controls]');
  await expect(controls).toBeVisible();
  await expect(controls.locator('[data-inventory-advanced-filter="classification"]')).toContainText('Reusable');
  await expect(controls.locator('[data-inventory-advanced-filter="lendingAudience"]')).toContainText('USC officers and staff only');

  await controls.locator('[data-inventory-advanced-filter="classification"]').selectOption('REUSABLE');
  await expect(page.locator('#inventoryTable')).toContainText('SYNTHETIC-REUSABLE-NEGATIVE');
  await expect(page.locator('#inventoryTable')).not.toContainText('SYNTHETIC-ITEM-LOW');
  await expect(page.locator('#inventoryTable')).toContainText('-2 piece');
  await expect(page.locator('#inventoryTable')).toContainText('Negative ATP — new allocations blocked');
  await expect(page.locator('#inventoryTable thead')).toContainText('Provenance / Movement');
  await expect(page.locator('#inventoryTable thead')).toContainText('Evidence');
  await expect(page.locator('#inventoryTable')).toContainText('EIT-SYNTHETIC-0001');
  await expect(page.locator('#inventoryTable')).toContainText('1 file');
  await expect(page.locator('#inventoryTable').getByRole('button', { name: 'View / Edit' })).toHaveCount(0);
  await expect(page.locator('#inventoryTable').getByRole('button', { name: 'Transfer' })).toHaveCount(0);
  await expect(page.locator('#inventoryTable').getByRole('button', { name: 'Archive' })).toHaveCount(0);

  await controls.locator('[data-inventory-advanced-filter="category"]').selectOption('Equipment');
  await controls.locator('[data-inventory-advanced-filter="unit"]').selectOption('piece');
  await controls.locator('[data-inventory-advanced-filter="lendingAudience"]').selectOption('USC_STAFF_ONLY');
  await expect(page.locator('#inventoryCount')).toHaveText('1 matching product');

  await controls.locator('[data-inventory-advanced-filter="classification"]').selectOption('ALL');
  await controls.locator('[data-inventory-advanced-filter="category"]').selectOption('ALL');
  await controls.locator('[data-inventory-advanced-filter="unit"]').selectOption('ALL');
  await controls.locator('[data-inventory-advanced-filter="lendingAudience"]').selectOption('ALL');
  await controls.locator('[data-inventory-advanced-filter="sort"]').selectOption('ATP_ASC');
  await expect(page.locator('#inventoryTable tbody tr').first().locator('td').first().locator('code')).toHaveText(
    'SYNTHETIC-REUSABLE-NEGATIVE',
  );

  await controls.locator('[data-inventory-advanced-filter="lifecycle"]').selectOption('ARCHIVED');
  await expect(page.locator('#inventoryTable')).toContainText('SYNTHETIC-ARCHIVED');
  await expect(page.locator('#inventoryTable')).not.toContainText('SYNTHETIC-REUSABLE-NEGATIVE');

  await page.locator('#clearInventoryFilters').click();
  await expect(controls.locator('[data-inventory-advanced-filter="lifecycle"]')).toHaveValue('ALL');
  await expect(page.locator('#inventoryTable')).toContainText('SYNTHETIC-REUSABLE-NEGATIVE');
});
