import { expect, test } from '@playwright/test';
import {
  assembleAppsScriptTemplate,
  createAppsScriptBundleFromProject,
} from '../../scripts/apps-script-bundle-lib.mjs';

const internalBootstrap = ({ revision = 1, manageCatalog = false, tickets = [] } = {}) => ({
  version: '0.5.0', schemaVersion: '1.2.0', backendMode: 'apps-script', environment: 'STAGING',
  dataRevision: revision, dataRevisionUpdatedAt: '2026-07-13T12:00:00+08:00',
  currentUser: {
    id: 'USR-1', displayName: 'Test User', role: 'DOL_STAFF',
    permissions: { review: true, release: true, receive: true, admin: false, manageCatalog },
    authorization: {
      contract: 'canonical-authorization', contractVersion: 2, modelVersion: 2,
      roleId: 'DOL_STAFF', roleLabel: 'DOL Staff', scopeMode: 'COMMITTEE',
      committeeIds: ['COM_FOOD'], committees: [{ id: 'COM_FOOD', name: 'Food Committee' }],
      capabilities: ['view.request', 'view.internal', 'view.inventory', 'lending.create'],
      mappingStatus: 'MAPPED', active: true,
    },
  },
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
    const essentialBootstrap = (state) => ({
      ok: true,
      correlationId: 'COR-SYNTHETIC-ESSENTIAL',
      contract: 'essential-bootstrap',
      contractVersion: 2,
      appVersion: state.version,
      schemaVersion: state.schemaVersion,
      backendMode: state.backendMode,
      environment: state.environment,
      requestOnly: false,
      activeModule: 'overview',
      currentUser: {
        id: state.currentUser.id,
        displayName: state.currentUser.displayName,
        role: state.currentUser.role,
        committee: state.currentUser.committee || '',
        permissions: state.currentUser.permissions,
        scopes: { committee: [] },
        authorization: state.currentUser.authorization,
      },
      navigation: ['overview', 'request', 'lending', 'release', 'restocking', 'procurement', 'inventory']
        .map((id) => ({ id, label: id, enabled: true })),
      moduleConfig: { maxPageSize: 50, defaultPageSize: 10, legacyEndpointAvailable: true, activeModuleOnly: true },
      revision: { revision: state.dataRevision, updatedAt: state.dataRevisionUpdatedAt },
      metrics: { readCount: 2, cacheHits: 0 },
    });
    const moduleBootstrap = (state, module) => {
      const data = {
        overview: {
          eventSeries: state.eventSeries,
          events: state.events,
          requests: state.requests,
          requestLines: state.requestLines,
          inventoryItems: state.inventoryItems,
          lendingTickets: state.lendingTickets,
          restockRequests: state.restockRequests,
          deliverables: state.deliverables,
          roadmapMilestones: state.roadmapMilestones,
        },
        lending: { inventoryItems: state.inventoryItems, lendingTickets: state.lendingTickets },
      }[module] || { inventoryItems: state.inventoryItems };
      return {
        ok: true,
        correlationId: `COR-SYNTHETIC-${module.toUpperCase()}`,
        contract: 'bootstrap-module',
        contractVersion: 2,
        appVersion: state.version,
        schemaVersion: state.schemaVersion,
        backendMode: state.backendMode,
        environment: state.environment,
        requestOnly: false,
        module,
        data,
        pagination: { page: 1, pageSize: 10, total: data.lendingTickets?.length || data.inventoryItems?.length || 0, hasMore: false },
        revision: { revision: state.dataRevision, updatedAt: state.dataRevisionUpdatedAt },
        scopeRevision: { scope: module, token: state.dataRevision, updatedAt: state.dataRevisionUpdatedAt },
        cache: { safe: false, scope: 'SESSION_OPERATIONAL', ttlMs: 0 },
        metrics: { readCount: 2, cacheHits: 0 },
      };
    };
    globalThis.__server = { bootstrap, revision: 1, writes: 0, failNextBootstrap: false, nearLiveEnabled: true, calls: [] };
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
            if (method === 'api_getEssentialBootstrapData') {
              if (globalThis.__server.failNextBootstrap) {
                globalThis.__server.failNextBootstrap = false;
                failureHandler(new Error('Simulated refresh failure'));
              } else successHandler({ ...essentialBootstrap(globalThis.__server.bootstrap) });
              return;
            }
           if (method === 'api_getBootstrapModule') {
             if (globalThis.__server.failNextBootstrap) {
               globalThis.__server.failNextBootstrap = false;
               failureHandler(new Error('Simulated refresh failure'));
             } else successHandler({ ...moduleBootstrap(globalThis.__server.bootstrap, payload.module) });
             return;
           }
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
          if (method === 'api_getScopedRevision') {
            successHandler({
              ok: true,
              contract: 'scoped-revision',
              contractVersion: 1,
              enabled: globalThis.__server.nearLiveEnabled,
              scope: payload.scope,
              token: globalThis.__server.revision,
              globalRevision: globalThis.__server.revision,
              updatedAt: '2026-07-16T12:00:00+08:00',
              environment: 'STAGING',
              metrics: { revisionReads: 1, moduleReads: 0, requestCount: 1 },
            });
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
            successHandler({
              ok: true,
              ticketId: id,
              correlationId: 'COR-WRITE-1',
              dataRevision: globalThis.__server.revision,
              dataRevisionUpdatedAt: '2026-07-16T12:00:00+08:00',
              dataScopeRevisions: { overview: globalThis.__server.revision, lending: globalThis.__server.revision },
            });
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

  const beforeChanged = await page.evaluate(() => ({
    module: globalThis.__server.calls.filter((call) => call.method === 'api_getBootstrapModule').length,
    essential: globalThis.__server.calls.filter((call) => call.method === 'api_getEssentialBootstrapData').length,
  }));
  await page.evaluate(() => {
    globalThis.__server.revision += 1;
    window.dispatchEvent(new Event('focus'));
  });
  await expect.poll(() => page.evaluate(() =>
    globalThis.__server.calls.filter((call) => call.method === 'api_getBootstrapModule').length,
  )).toBe(beforeChanged.module + 1);
  expect(await page.evaluate(() => globalThis.__server.calls.filter((call) => call.method === 'api_getEssentialBootstrapData').length)).toBe(beforeChanged.essential);
  expect(await page.evaluate(() => globalThis.__server.calls.filter((call) => call.method === 'api_getBootstrapModule').at(-1)?.payload?.module)).toBe('lending');

  const beforeUnchanged = await page.evaluate(() => ({
    module: globalThis.__server.calls.filter((call) => call.method === 'api_getBootstrapModule').length,
    revision: globalThis.__server.calls.filter((call) => call.method === 'api_getScopedRevision').length,
  }));
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await expect.poll(() => page.evaluate(() =>
    globalThis.__server.calls.filter((call) => call.method === 'api_getScopedRevision').length,
  )).toBe(beforeUnchanged.revision + 1);
  expect(await page.evaluate(() => globalThis.__server.calls.filter((call) => call.method === 'api_getBootstrapModule').length)).toBe(beforeUnchanged.module);

  const beforeAbandonedModal = await page.evaluate(() =>
    globalThis.__server.calls.filter((call) => call.method === 'api_getBootstrapModule').length,
  );
  await page.evaluate(() => {
    const modal = document.querySelector('#modal');
    const backdrop = document.querySelector('#modalBackdrop');
    modal.innerHTML = '<form id="abandonedNearLiveDraft"><input name="draft"></form>';
    backdrop.classList.add('show');
    const input = modal.querySelector('input');
    input.value = 'abandoned';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    backdrop.classList.remove('show');
    globalThis.__server.revision += 1;
    window.dispatchEvent(new Event('focus'));
  });
  await expect.poll(() => page.evaluate(() =>
    globalThis.__server.calls.filter((call) => call.method === 'api_getBootstrapModule').length,
  )).toBe(beforeAbandonedModal + 1);
  await expect(page.locator('#syncUpdateBanner')).toBeHidden();

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
  await testInfo.attach('near-live-dirty-deferral', {
    body: await page.screenshot(),
    contentType: 'image/png',
  });

  await page.locator('[data-sync-continue]').click();
  await page.evaluate(() => {
    globalThis.__server.nearLiveEnabled = false;
    window.dispatchEvent(new Event('focus'));
  });
  await expect(page.locator('#syncIndicator')).toContainText('Manual refresh only');
  await testInfo.attach('near-live-remote-disable', {
    body: await page.screenshot(),
    contentType: 'image/png',
  });
  const beforeManual = await page.evaluate(() => globalThis.__server.calls.filter((call) => call.method === 'api_getBootstrapModule').length);
  await page.locator('#refreshOperationalData').click();
  await expect.poll(() => page.evaluate(() => globalThis.__server.calls.filter((call) => call.method === 'api_getBootstrapModule').length)).toBe(beforeManual + 1);
  expect(await page.evaluate(() => globalThis.__server.writes)).toBe(1);
});
