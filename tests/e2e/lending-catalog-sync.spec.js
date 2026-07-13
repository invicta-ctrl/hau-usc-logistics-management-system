import { expect, test } from '@playwright/test';
import {
  assembleAppsScriptTemplate,
  createAppsScriptBundleFromProject,
} from '../../scripts/apps-script-bundle-lib.mjs';

const internalBootstrap = ({ revision = 1, manageCatalog = false, tickets = [] } = {}) => ({
  version: '1.0.0-rc.1', schemaVersion: '1.2.0', backendMode: 'apps-script', environment: 'STAGING',
  dataRevision: revision, dataRevisionUpdatedAt: '2026-07-13T12:00:00+08:00',
  currentUser: { id: 'USR-1', displayName: 'Test User', role: 'DOL_STAFF', permissions: { review: true, release: true, receive: true, admin: false, manageCatalog } },
  eventSeries: [], events: [], requests: [], requestLines: [], reservations: [], ledgerTransactions: [],
  inventoryItems: [
    { id: 'ITM-0003', name: 'Extension Cord — 10 m', aliases: ['extension wire'], category: 'Equipment', stockArea: 'Inventory', catalogType: 'OFFICE_INVENTORY', storageLocation: 'Equipment Rack', handling: 'LOANABLE', handlingCode: 'LOANABLE', unit: 'piece', openingOnHand: 4, onHand: 4, reserved: 0, availableToPromise: 4, reorderThreshold: 1, lendingAudience: 'STUDENTS_AND_STAFF', defaultLoanDays: 3, maximumLoanQuantity: 2, approvalRequired: true, status: 'ACTIVE' },
  ],
  lendingTickets: tickets, releaseConfirmations: [], restockRecords: [], restockRequests: [],
  deliverables: [], canvassReferences: [], evidenceFiles: [], auditLog: [], statusHistory: [], roadmapMilestones: [],
});

test('lending predictive suggestions stay inside every configured viewport', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#loading')).toHaveClass(/hidden/);
  await page.locator('#primaryNav [data-view="lending"]').click();
  await expect(page.locator('label[for="lendingItemSearch"]')).toHaveText('Item');
  await page.locator('#lendingItemSearch').fill('ballpen');
  await expect(page.locator('#lendingAutocomplete [role="option"]').first()).toBeVisible();
  const box = await page.locator('#lendingAutocomplete').boundingBox();
  const viewport = page.viewportSize();
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1);
  expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(1);
});

test('predictive lending enforces selection, borrower, stock, and immediate ticket rendering', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-390', 'One complete lending workflow is sufficient.');
  await page.goto('/');
  await expect(page.locator('#loading')).toHaveClass(/hidden/);
  await page.locator('#primaryNav [data-view="lending"]').click();

  const form = page.locator('#lendingForm');
  await form.locator('[name="studentIdNumber"]').fill('2026-99999');
  await form.locator('[name="borrowerName"]').fill('Playwright Borrower');
  await form.locator('[name="department"]').fill('USC Secretariat');
  await form.locator('[name="purpose"]').fill('Automated lending acceptance');
  await form.locator('[name="borrowerType"]').selectOption('ANGELITE');
  await page.locator('#lendingItemSearch').fill('extension cord');
  await expect(page.locator('[data-lending-item="ITM-0003"]')).toHaveAttribute('aria-disabled', 'true');
  await expect(page.locator('[data-lending-item="ITM-0003"]')).toContainText('USC officers and staff');

  await page.locator('#lendingItemSearch').fill('drinking water');
  await expect(page.locator('[data-lending-item="ITM-0005"]')).toHaveAttribute('aria-disabled', 'true');
  await expect(page.locator('[data-lending-item="ITM-0005"]')).toContainText('out of stock');

  await page.locator('#lendingItemSearch').fill('projector cable');
  await expect(page.locator('#lendingAutocomplete')).toContainText('No available inventory item matches');
  await form.getByRole('button', { name: 'Create For Review Ticket' }).click();
  await expect(page.locator('#toast')).toContainText('Select an inventory item from the suggestions');

  await form.locator('[name="borrowerType"]').selectOption('USC_STAFF');
  await page.locator('#lendingItemSearch').fill('extension cord');
  await page.locator('#lendingItemSearch').press('ArrowDown');
  await expect(page.locator('#lendingItemSearch')).toHaveAttribute('aria-activedescendant', 'lending-suggestion-0');
  await page.locator('#lendingItemSearch').press('Enter');
  await expect(page.locator('#lendingItem')).toHaveValue('ITM-0003');
  await form.getByRole('button', { name: 'Create For Review Ticket' }).click();
  await expect(page.locator('#toast')).toContainText(/Ticket LND-.* created for review/);
  await expect(page.locator('#lendingTickets')).toContainText('Playwright Borrower');
  await expect(page.locator('#loanMetrics')).toContainText('For Review');
  await page.locator('#primaryNav [data-view="overview"]').click();
  await expect(page.locator('#overviewMetrics')).toContainText('Open lending tickets');
});

test('catalog administrator edits an item and the change survives reload', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-390', 'One persistence workflow is sufficient.');
  await page.goto('/');
  await expect(page.locator('#loading')).toHaveClass(/hidden/);
  await page.locator('#primaryNav [data-view="inventory"]').click();
  await page.locator('.mobile-cards [data-inventory-action="edit"]').first().click();
  const form = page.locator('#catalogItemForm');
  const original = await form.locator('[name="itemName"]').inputValue();
  const changed = `${original} QA`;
  await form.locator('[name="itemName"]').fill(changed);
  await form.getByRole('button', { name: 'Save Item Settings' }).click();
  await expect(page.locator('#toast')).toContainText('catalog settings updated');
  await expect(page.locator('#inventoryTable')).toContainText(changed);
  await page.reload();
  await expect(page.locator('#loading')).toHaveClass(/hidden/);
  await page.locator('#primaryNav [data-view="inventory"]').click();
  await expect(page.locator('#inventoryTable')).toContainText(changed);
});

test('Apps Script mutation refresh failure never repeats the write and safe refresh accepts it', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-390', 'One assembled Apps Script workflow is sufficient.');
  const files = await createAppsScriptBundleFromProject();
  const assembled = assembleAppsScriptTemplate(files, { requestOnly: false, appEnvironment: 'STAGING' });
  await page.goto('about:blank');
  await page.evaluate((bootstrap) => {
    globalThis.__server = { bootstrap, revision: 1, writes: 0, failNextBootstrap: false, calls: [] };
    let successHandler = () => {};
    let failureHandler = () => {};
    let runner;
    const target = {
      withSuccessHandler(handler) { successHandler = handler; return runner; },
      withFailureHandler(handler) { failureHandler = handler; return runner; },
    };
    runner = new Proxy(target, {
      get(object, property) {
        if (property in object) return object[property];
        if (typeof property === 'symbol') return undefined;
        return (payload) => queueMicrotask(() => {
          const method = String(property);
          globalThis.__server.calls.push({ method, payload });
          if (method === 'api_getBootstrapData') {
            if (globalThis.__server.failNextBootstrap) {
              globalThis.__server.failNextBootstrap = false;
              failureHandler(new Error('Simulated refresh failure'));
            } else successHandler({ ok: true, data: globalThis.__server.bootstrap });
            return;
          }
          if (method === 'api_getDataRevision') {
            successHandler({ ok: true, revision: globalThis.__server.revision, updatedAt: 'now', environment: 'STAGING' });
            return;
          }
          if (method === 'api_createLendingTicket') {
            globalThis.__server.writes += 1;
            const id = 'LND-2026-0999';
            globalThis.__server.revision += 1;
            globalThis.__server.bootstrap = {
              ...globalThis.__server.bootstrap,
              dataRevision: globalThis.__server.revision,
              lendingTickets: [...globalThis.__server.bootstrap.lendingTickets, {
                id, studentIdNumber: payload.studentIdNumber, borrowerName: payload.borrowerName,
                borrowerType: payload.borrowerType, department: payload.department, contact: payload.contact,
                itemId: payload.itemId, quantity: Number(payload.quantity), purpose: payload.purpose,
                dueAt: payload.dueAt, ticketType: 'LOANABLE', status: 'FOR_REVIEW', createdAt: '2026-07-13T12:00:00+08:00', updatedAt: '2026-07-13T12:00:00+08:00',
              }],
            };
            globalThis.__server.failNextBootstrap = true;
            successHandler({ ok: true, ticketId: id, correlationId: 'COR-WRITE-1' });
            return;
          }
          failureHandler(new Error(`Unexpected Apps Script call: ${method}`));
        });
      },
    });
    globalThis.google = { script: { run: runner } };
  }, internalBootstrap({ manageCatalog: false }));
  await page.setContent(assembled, { waitUntil: 'load' });
  await expect(page.locator('#loading')).toHaveClass(/hidden/);
  await page.locator('#primaryNav [data-view="lending"]').click();
  const form = page.locator('#lendingForm');
  await form.locator('[name="studentIdNumber"]').fill('2026-09999');
  await form.locator('[name="borrowerName"]').fill('Remote Borrower');
  await form.locator('[name="department"]').fill('USC');
  await form.locator('[name="purpose"]').fill('Remote refresh test');
  await form.locator('[name="borrowerType"]').selectOption('USC_STAFF');
  await page.locator('#lendingItemSearch').fill('extension cord');
  await page.locator('[data-lending-item="ITM-0003"]').click();
  await form.getByRole('button', { name: 'Create For Review Ticket' }).click();
  await expect(page.locator('#syncUpdateBanner')).toBeVisible();
  await expect(page.locator('#syncUpdateBanner')).toContainText('action was recorded');
  await expect(page.locator('#syncUpdateBanner')).toContainText('COR-WRITE-1');
  expect(await page.evaluate(() => globalThis.__server.writes)).toBe(1);
  await page.locator('[data-sync-refresh]').click();
  await expect(page.locator('#syncUpdateBanner')).toBeHidden();
  await expect(page.locator('#lendingTickets')).toContainText('Remote Borrower');
  expect(await page.evaluate(() => globalThis.__server.writes)).toBe(1);

  await expect(page.locator('#adminCatalogException')).toBeHidden();
  await page.locator('#primaryNav [data-view="inventory"]').click();
  await expect(page.locator('[data-inventory-action="edit"]')).toHaveCount(0);

  await page.locator('#primaryNav [data-view="lending"]').click();
  await form.locator('[name="borrowerName"]').fill('Unsaved input');
  await page.evaluate(() => {
    globalThis.__server.revision += 1;
    window.dispatchEvent(new Event('focus'));
  });
  await expect(page.locator('#syncUpdateBanner')).toBeVisible();
  await expect(page.locator('#syncIndicator')).toContainText('Updates available');
  await expect(form.locator('[name="borrowerName"]')).toHaveValue('Unsaved input');
});
