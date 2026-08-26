import { expect, test } from '@playwright/test';

const VERSION = '**/api/version';
const exactInspectionPort = process.env.HAU_FRONTEND_E2E_PORT === '4173';

function installVersion(page, playground) {
  return page.route(VERSION, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, correlationId: 'e2e', playground }),
    }),
  );
}

function installDeniedVersion(page, payload) {
  return page.route(VERSION, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(payload),
    }),
  );
}

function installEmptyFeed(page) {
  return page.route('**/api/public/advertisements', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, items: [] }),
    }),
  );
}

test('allows the exact direct route and shows the launcher when playground is true', async ({ page }) => {
  await installVersion(page, true);
  await page.goto('/#/__preview/index');
  await expect(page.locator('[data-preview-index]')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Preview Module Index' })).toBeVisible();

  await page.goto('/');
  await expect(page.locator('[data-preview-index-launcher]')).toBeVisible();
});

test('fails closed on every spoofed version signal regardless of hash, query, or storage', async ({
  page,
}) => {
  await page.addInitScript(() => {
    try {
      window.localStorage.setItem('preview-allowed', 'true');
      window.sessionStorage.setItem('preview-allowed', 'true');
    } catch {
      /* storage may be unavailable; the gate must not depend on it */
    }
    window.__previewSpoof = 'true';
  });

  const scenarios = [
    { name: 'false', payload: { ok: true, playground: false } },
    { name: 'missing', payload: { ok: true, correlationId: 'e2e' } },
    { name: 'string true', payload: { ok: true, playground: 'true' } },
    { name: 'number', payload: { ok: true, playground: 1 } },
    { name: 'object', payload: { ok: true, playground: { valueOf: () => true } } },
  ];

  for (const scenario of scenarios) {
    await page.unroute(VERSION);
    await installDeniedVersion(page, scenario.payload);
    await page.goto('/?preview=1#/__preview/index');
    await expect(
      page.getByRole('heading', { name: 'Every request. Every handoff. On record.' }),
    ).toBeVisible();
    await expect(page.locator('[data-preview-index]')).toHaveCount(0);
    await expect(page.locator('[data-preview-index-launcher]')).toHaveCount(0);
    await expect(page.locator('[data-preview-surface]')).toHaveCount(0);
    await expect(page.getByText('Operations overview')).toHaveCount(0);
    await expect(page.getByText('Preview Module Index')).toHaveCount(0);
  }
});

test('fails closed when the version endpoint errors', async ({ page }) => {
  await page.route(VERSION, (route) =>
    route.fulfill({
      status: 503,
      contentType: 'application/json',
      body: '{"message":"Unavailable"}',
    }),
  );
  await page.goto('/#/__preview/index');
  await expect(page.getByRole('heading', { name: 'Every request. Every handoff. On record.' })).toBeVisible();
  await expect(page.locator('[data-preview-index]')).toHaveCount(0);
  await expect(page.locator('[data-preview-index-launcher]')).toHaveCount(0);
  await expect(page.locator('[data-preview-surface]')).toHaveCount(0);
  await expect(page.getByText('Preview Module Index')).toHaveCount(0);
});

test('renders exactly 15 registry entries, groups, and drives search and all filters', async ({ page }) => {
  await installVersion(page, true);
  await installEmptyFeed(page);
  await page.goto('/#/__preview/index');
  await expect(page.locator('[data-preview-index]')).toBeVisible();

  await expect(page.locator('[data-preview-route]')).toHaveCount(15);
  // R3-A1-A2 added a fourth context: the authenticated External Request Center
  // is no longer filed under Public, because it is not public.
  await expect(page.locator('[data-preview-group]')).toHaveCount(4);
  await expect(page.locator('[data-preview-group="PUBLIC"] [data-preview-route]')).toHaveCount(4);
  await expect(page.locator('[data-preview-group="REQUESTER"] [data-preview-route]')).toHaveCount(1);
  await expect(page.locator('[data-preview-group="STAFF"] [data-preview-route]')).toHaveCount(8);
  await expect(page.locator('[data-preview-group="ADMINISTRATION"] [data-preview-route]')).toHaveCount(2);

  await expect(
    page.locator('[data-preview-route="landing"] [data-preview-entry-meta="status"] dd'),
  ).toHaveText('ACCEPTED');
  await expect(
    page.locator('[data-preview-route="landing"] [data-preview-entry-meta="backend"] dd'),
  ).toHaveText('REAL BACKEND');
  await expect(
    page.locator('[data-preview-route="lending"] [data-preview-entry-meta="status"] dd'),
  ).toHaveText('ACCEPTED');
  await expect(
    page.locator('[data-preview-route="lending"] [data-preview-entry-meta="backend"] dd'),
  ).toHaveText('REAL BACKEND');
  await expect(
    page.locator('[data-preview-route="overview"] [data-preview-entry-meta="status"] dd'),
  ).toHaveText('SURFACE PREVIEW');
  await expect(
    page.locator('[data-preview-route="overview"] [data-preview-entry-meta="backend"] dd'),
  ).toHaveText('VISUAL ONLY');
  await expect(
    page.locator('[data-preview-route="release"] [data-preview-entry-meta="status"] dd'),
  ).toHaveText('ACCEPTED');
  await expect(
    page.locator('[data-preview-route="release"] [data-preview-entry-meta="backend"] dd'),
  ).toHaveText('VISUAL ONLY');
  await expect(
    page.locator('[data-preview-route="release"] [data-preview-entry-meta="mode"] dd'),
  ).toHaveText('Real module');
  await expect(
    page.locator('[data-preview-route="restocking"] [data-preview-entry-meta="status"] dd'),
  ).toHaveText('ACCEPTED');
  await expect(
    page.locator('[data-preview-route="restocking"] [data-preview-entry-meta="backend"] dd'),
  ).toHaveText('VISUAL ONLY');
  await expect(
    page.locator('[data-preview-route="restocking"] [data-preview-entry-meta="mode"] dd'),
  ).toHaveText('Real module');
  await expect(
    page.locator('[data-preview-route="procurement"] [data-preview-entry-meta="status"] dd'),
  ).toHaveText('ACCEPTED');
  await expect(
    page.locator('[data-preview-route="procurement"] [data-preview-entry-meta="backend"] dd'),
  ).toHaveText('VISUAL ONLY');
  await expect(
    page.locator('[data-preview-route="procurement"] [data-preview-entry-meta="mode"] dd'),
  ).toHaveText('Real module');

  await page.locator('[data-preview-search]').fill('release');
  await expect(page.locator('[data-preview-route]')).toHaveCount(1);
  await expect(page.locator('[data-preview-route="release"]')).toBeVisible();

  await page.locator('[data-preview-search]').fill('does-not-exist');
  await expect(page.locator('[data-preview-empty]')).toBeVisible();
  await page.locator('[data-preview-search]').fill('');

  await page.locator('[data-filter="PUBLIC"]').click();
  await expect(page.locator('[data-preview-route]')).toHaveCount(4);
  await page.locator('[data-filter="PREVIEW_ONLY"]').click();
  await expect(page.locator('[data-preview-route]')).toHaveCount(1);
  await page.locator('[data-filter="IN_PROGRESS"]').click();
  await expect(page.locator('[data-preview-empty]')).toBeVisible();
  await expect(page.locator('[data-preview-count]')).toHaveText('0 routes');
  await page.locator('[data-filter="ALL"]').click();
  await expect(page.locator('[data-preview-route]')).toHaveCount(15);

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
});

test('opens a public real route from the index', async ({ page }) => {
  await installVersion(page, true);
  await installEmptyFeed(page);
  await page.goto('/#/__preview/index');
  await page.locator('[data-preview-route="landing"] [data-action="open"]').click();
  await expect(page.getByRole('heading', { name: 'Every request. Every handoff. On record.' })).toBeVisible();
  await expect(page.locator('[data-preview-index]')).toHaveCount(0);
});

test('routes protected Test Real Access through the unchanged real session check', async ({ page }) => {
  await installVersion(page, true);
  await installEmptyFeed(page);
  await page.route('**/api/auth/session', (route) =>
    route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify({ code: 'SESSION_REQUIRED', message: 'Sign in to continue.' }),
    }),
  );
  await page.goto('/#/__preview/index');
  await page.locator('[data-preview-route="inventory"] [data-action="test-real-access"]').click();
  await expect(page.getByRole('heading', { name: 'Sign in to continue' })).toBeVisible();
  await expect(page.locator('[data-preview-index]')).toHaveCount(0);
});

test('INDEX-GATE fails closed outside the exact local 4173 inspection origin', async ({ page }) => {
  test.skip(exactInspectionPort, 'The exact-4173 invocation asserts positive local inspection instead.');
  await installVersion(page, true);
  await installEmptyFeed(page);
  const protectedRequests = [];
  page.on('request', (request) => {
    const pathname = new URL(request.url()).pathname;
    if (
      pathname.startsWith('/api/') &&
      pathname !== '/api/version' &&
      pathname !== '/api/public/advertisements'
    ) {
      protectedRequests.push({ method: request.method(), pathname });
    }
  });

  await page.goto('/#/__preview/index');
  await page.locator('[data-preview-route="inventory"] [data-action="open-preview"]').click();
  await expect(page.locator('[data-preview-index]')).toBeVisible();
  await expect(page.locator('[data-preview-inspection="true"]')).toHaveCount(0);
  expect(protectedRequests).toEqual([]);
});

test('INDEX-INSPECT opens exact-4173 protected modules without real auth or protected network traffic', async ({
  page,
}) => {
  test.skip(!exactInspectionPort, 'Run explicitly against the accepted 4173 supervisor.');
  await installVersion(page, true);
  await installEmptyFeed(page);
  const protectedRequests = [];
  page.on('request', (request) => {
    const pathname = new URL(request.url()).pathname;
    if (
      pathname.startsWith('/api/') &&
      pathname !== '/api/version' &&
      pathname !== '/api/public/advertisements'
    ) {
      protectedRequests.push({ method: request.method(), pathname });
    }
  });

  await page.goto('/#/__preview/index');
  await page.locator('[data-preview-search]').fill('inventory');
  await page.locator('[data-preview-route="inventory"] [data-action="open-preview"]').click();
  await expect(
    page.locator('[data-preview-inspection="true"][data-preview-route="inventory"]'),
  ).toBeVisible();
  await expect(page.getByText('PREVIEW INSPECTION', { exact: false })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Sign in to continue' })).toHaveCount(0);

  await page.getByRole('button', { name: 'Back to Preview Index' }).first().click();
  await expect(page.locator('[data-preview-index]')).toBeVisible();
  await expect(page.locator('[data-preview-search]')).toHaveValue('inventory');
  await page.locator('[data-preview-search]').fill('');
  await page.locator('[data-preview-route="profile"] [data-action="open-preview"]').click();
  await expect(page.locator('[data-preview-inspection="true"][data-preview-route="profile"]')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Preview Operator' })).toBeVisible();

  await page.getByRole('button', { name: 'Back to Preview Index' }).first().click();
  await page.locator('[data-preview-route="release"] [data-action="open-preview"]').click();
  await expect(
    page.locator('[data-preview-inspection="true"][data-preview-route="release"]'),
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Confirm physical release' })).toBeVisible();
  await expect(page.getByText('Synthetic prototype · no backend')).toBeVisible();

  await page.getByRole('button', { name: 'Back to Preview Index' }).first().click();
  await page.locator('[data-preview-route="external-request"] [data-action="open-preview"]').click();
  await expect(
    page.locator('[data-preview-inspection="true"][data-preview-route="external-request"]'),
  ).toBeVisible();
  await page.getByRole('button', { name: 'New request' }).click();
  await expect(page.getByRole('button', { name: 'Submission disabled in preview' })).toBeDisabled();
  expect(protectedRequests).toEqual([]);
});

test('FI-08R keeps focused-task preview and both dialog focus lifecycles inside the Release Desk', async ({
  page,
}) => {
  test.skip(!exactInspectionPort, 'Run explicitly against the accepted 4173 supervisor.');
  await installVersion(page, true);
  await installEmptyFeed(page);
  const protectedRequests = [];
  page.on('request', (request) => {
    const pathname = new URL(request.url()).pathname;
    if (
      pathname.startsWith('/api/') &&
      pathname !== '/api/version' &&
      pathname !== '/api/public/advertisements'
    ) {
      protectedRequests.push({ method: request.method(), pathname });
    }
  });

  await page.goto('/#/__preview/index');
  await page.locator('[data-preview-route="release"] [data-action="open-preview"]').click();
  await expect(
    page.locator('[data-preview-inspection="true"][data-preview-route="release"]'),
  ).toBeVisible();

  const previewState = page.getByLabel('Preview state');
  const task = page.locator('.task[role="dialog"]');
  const taskNote = task.getByRole('textbox', { name: 'Required correction note' });

  await previewState.selectOption('Focused task');
  await expect(task).toBeVisible();
  await expect(taskNote).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(task).toHaveCount(0);
  await expect(previewState).toBeFocused();

  await previewState.selectOption('Populated');
  const releaseTrigger = page.locator(
    '[data-release-trigger="REQ-2026-0136"]:visible',
  );
  await expect(releaseTrigger).toBeVisible();
  await releaseTrigger.click();

  const detail = page.locator('.detail[role="dialog"]');
  const detailClose = detail.getByRole('button', { name: 'Close release details' });
  const detailLast = detail.getByRole('button', { name: 'Open request' });
  await expect(detail).toBeVisible();
  await expect(detailClose).toBeFocused();
  await detailLast.focus();
  await page.keyboard.press('Tab');
  await expect(detailClose).toBeFocused();
  await detailClose.focus();
  await page.keyboard.press('Shift+Tab');
  await expect(detailLast).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(detail).toHaveCount(0);
  await expect(releaseTrigger).toBeFocused();

  await releaseTrigger.click();
  await page.getByLabel(/Recipient confirmed the physical handoff/u).check();
  const taskTrigger = page.getByRole('button', { name: 'Record physical release' });
  await expect(taskTrigger).toBeEnabled();
  await taskTrigger.click();

  const taskCancel = task.getByRole('button', { name: 'Cancel' });
  await expect(task).toBeVisible();
  await expect(taskNote).toBeFocused();
  await taskCancel.focus();
  await page.keyboard.press('Tab');
  await expect(taskNote).toBeFocused();
  await taskNote.focus();
  await page.keyboard.press('Shift+Tab');
  await expect(taskCancel).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(task).toHaveCount(0);
  await expect(taskTrigger).toBeFocused();

  await taskTrigger.click();
  await taskNote.fill('Microphone shortfall confirmed for synthetic release review.');
  await task.getByRole('button', { name: 'Confirm release of 3 lines' }).click();
  const nextRelease = page.getByRole('button', { name: 'Next release' });
  await expect(task).toHaveCount(0);
  await expect(nextRelease).toBeFocused();

  expect(protectedRequests).toEqual([]);
});

test('FI-09 opens deterministic Restocking and Procurement modules with cumulative receiving truth and contained task focus', async ({
  page,
}) => {
  test.skip(!exactInspectionPort, 'Run explicitly against the accepted 4173 supervisor.');
  await installVersion(page, true);
  await installEmptyFeed(page);
  const protectedRequests = [];
  const consoleErrors = [];
  page.on('request', (request) => {
    const pathname = new URL(request.url()).pathname;
    if (
      pathname.startsWith('/api/') &&
      pathname !== '/api/version' &&
      pathname !== '/api/public/advertisements'
    ) {
      protectedRequests.push({ method: request.method(), pathname });
    }
  });
  page.on('console', (message) => {
    if (message.type() === 'error' && !message.text().includes('/favicon.ico')) {
      consoleErrors.push(message.text());
    }
  });

  await page.goto('/#/__preview/index');
  await page.locator('[data-preview-route="restocking"] [data-action="open-preview"]').click();
  await expect(
    page.locator('[data-preview-inspection="true"][data-preview-route="restocking"]'),
  ).toBeVisible();
  const restocking = page.locator('.sup');
  const previewState = restocking.getByLabel('Preview state');
  await expect(page.getByRole('heading', { name: 'Restocking and receiving' })).toBeVisible();
  await expect(restocking.getByText('Synthetic prototype · no backend')).toBeVisible();

  const restockTaskOpener = restocking.getByRole('button', { name: 'Restock an item' });
  await expect(restockTaskOpener).toHaveCount(1);
  await restockTaskOpener.click();
  const supplyTask = restocking.locator('.task[role="dialog"]');
  const quantity = supplyTask.getByRole('spinbutton', { name: 'Quantity' });
  const cancel = supplyTask.getByRole('button', { name: 'Cancel' });
  const confirm = supplyTask.getByRole('button', { name: 'Confirm local preview' });
  await expect(supplyTask).toBeVisible();
  await expect(supplyTask).toHaveAttribute('aria-labelledby', 'supply-task-title');
  await expect(
    supplyTask.getByRole('heading', { name: 'Update selected supply record' }),
  ).toBeVisible();
  await expect(quantity).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(supplyTask).toHaveCount(0);
  await expect(restockTaskOpener).toBeFocused();

  await previewState.selectOption('Selected record');
  const receivingDetail = restocking.locator('.detail').filter({ hasText: 'Receiving detail' });
  await expect(receivingDetail).toBeVisible();
  await expect(receivingDetail.getByText('PO-2026-0031', { exact: true })).toBeVisible();
  await expect(receivingDetail.locator('dt:has-text("Ordered") + dd')).toHaveText('12');
  await expect(receivingDetail.locator('dt:has-text("Received") + dd')).toHaveText('6');
  await expect(receivingDetail.locator('dt:has-text("Outstanding") + dd')).toHaveText('6');

  const receivingTaskOpener = receivingDetail.getByRole('button', { name: 'Receiving' });
  await expect(receivingTaskOpener).toHaveCount(1);
  await expect(receivingTaskOpener).toBeVisible();
  await receivingTaskOpener.click();
  await expect(supplyTask).toBeVisible();
  await expect(quantity).toBeFocused();
  await cancel.focus();
  await page.keyboard.press('Tab');
  await expect(quantity).toBeFocused();
  await quantity.focus();
  await page.keyboard.press('Shift+Tab');
  await expect(cancel).toBeFocused();
  await confirm.click();
  await expect(supplyTask).toHaveCount(0);
  await expect(receivingTaskOpener).toBeFocused();
  await expect(restocking.getByRole('heading', { name: 'Local fixture updated' })).toBeVisible();
  await expect(restocking.getByRole('status')).toHaveText(
    'Locally confirmed · synthetic fixture only · no service write',
  );

  await previewState.selectOption('Loading');
  await expect(restocking.locator('[aria-busy="true"]')).toBeVisible();
  await previewState.selectOption('Empty');
  await expect(restocking.getByRole('heading', { name: 'No records match this view' })).toBeVisible();
  await previewState.selectOption('Filtered empty');
  await expect(restocking.locator('.state .eye')).toHaveText('Filtered empty');
  await previewState.selectOption('Validation error');
  await restockTaskOpener.click();
  await expect(supplyTask.getByRole('alert')).toHaveText('Complete required fields.');
  await page.keyboard.press('Escape');
  await previewState.selectOption('Stale revision');
  await expect(restocking.getByText('Last-known record · actions paused')).toBeVisible();
  await previewState.selectOption('Denied');
  await expect(
    restocking.getByRole('heading', { name: 'Supply records are not available to this account' }),
  ).toBeVisible();
  await previewState.selectOption('Unavailable');
  await expect(restocking.getByRole('heading', { name: 'Supply service unavailable' })).toBeVisible();
  await previewState.selectOption('Locally confirmed');
  await expect(restocking.getByRole('heading', { name: 'Local fixture updated' })).toBeVisible();

  await page.getByRole('button', { name: 'Back to Preview Index' }).first().click();
  await page.locator('[data-preview-route="procurement"] [data-action="open-preview"]').click();
  await expect(
    page.locator('[data-preview-inspection="true"][data-preview-route="procurement"]'),
  ).toBeVisible();
  const procurement = page.locator('.sup');
  await expect(page.getByRole('heading', { name: 'Procurement lifecycle' })).toBeVisible();
  await expect(procurement.locator('.recordband > b')).toHaveText('PRC-2026-0044');
  await expect(procurement.getByRole('button', { name: 'Contracts · unavailable' })).toBeDisabled();
  const desktopCanvassingRecord = procurement.getByRole('button', {
    name: /Wireless microphone ×12/u,
  });
  const mobileCanvassingRecord = procurement
    .locator('.cards article')
    .filter({ hasText: 'PRC-2026-0044' })
    .getByRole('button', { name: 'Open procurement' });
  if (await desktopCanvassingRecord.isVisible()) {
    await desktopCanvassingRecord.click();
  } else {
    await expect(mobileCanvassingRecord).toBeVisible();
    await mobileCanvassingRecord.click();
  }
  await expect(procurement.locator('.recordband > b')).toHaveText('PRC-2026-0044');
  await procurement.getByRole('button', { name: 'Suppliers' }).click();
  await expect(procurement.getByRole('heading', { name: 'Named supplier summaries' })).toBeVisible();
  await expect(procurement.getByText('Supplier A', { exact: true })).toBeVisible();
  await expect(procurement.locator('.recordband > b')).toHaveText('PRC-2026-0044');
  await procurement.getByRole('button', { name: 'Deliverables' }).click();
  await expect(procurement.getByRole('heading', { name: 'Delivery relationships' })).toBeVisible();
  const desktopDeliverable = procurement.locator('table').filter({ hasText: 'DLV-2026-0022' });
  const mobileDeliverable = procurement
    .locator('.cards article')
    .filter({ hasText: 'DLV-2026-0022' });
  if (await desktopDeliverable.isVisible()) {
    await expect(desktopDeliverable).toContainText('DLV-2026-0022');
  } else {
    await expect(mobileDeliverable).toBeVisible();
    await expect(mobileDeliverable).toContainText('Sound system hire');
  }

  expect(
    await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth),
  ).toBeLessThanOrEqual(1);
  expect(protectedRequests).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test('FI-10 renders the bounded Administration inspection safely at every accepted viewport', async ({ page }) => {
  test.setTimeout(90_000);
  test.skip(!exactInspectionPort, 'Run explicitly against the accepted 4173 supervisor.');
  await installVersion(page, true);
  await installEmptyFeed(page);
  const protectedRequests = [];
  const consoleErrors = [];
  page.on('request', (request) => {
    const pathname = new URL(request.url()).pathname;
    if (
      pathname.startsWith('/api/') &&
      pathname !== '/api/version' &&
      pathname !== '/api/public/advertisements'
    ) {
      protectedRequests.push({ method: request.method(), pathname });
    }
  });
  page.on('console', (message) => {
    if (message.type() === 'error' && !message.text().includes('/favicon.ico')) {
      consoleErrors.push(message.text());
    }
  });

  await page.setViewportSize({ width: 320, height: 1000 });
  await page.goto('/#/__preview/index');
  for (const width of [320, 390, 768, 1024, 1440]) {
    if (width !== 320) {
      await page.getByRole('button', { name: 'Back to Preview Index' }).first().click();
      await expect(page.locator('[data-preview-index]')).toBeVisible();
    }
    await page.setViewportSize({ width, height: 1000 });
    await page.locator('[data-preview-route="administration"] [data-action="open-preview"]').click();

    const administration = page.locator(
      '[data-preview-inspection="true"][data-preview-route="administration"] [data-fi10-administration="true"]',
    );
    await expect(administration).toBeVisible();
    await expect(administration.getByText('Sanitized local inspection', { exact: true })).toBeVisible();
    await expect(
      administration.getByText('Synthetic preview · no session, backend, or protected data', { exact: true }),
    ).toBeVisible();
    for (const name of ['Reference administration', 'Link registry', 'Brand & media', 'System status']) {
      const tab = administration.getByRole('button', { name });
      if (width <= 768) await expect(tab).toHaveCount(0);
      else await expect(tab).toHaveCount(1);
    }
    await expect(administration).not.toContainText('preview-fi10-person-a');

    const previewState = administration.getByLabel('Administration preview state');
    await previewState.selectOption('Loading');
    await expect(administration.locator('[aria-busy="true"]')).toBeVisible();
    await previewState.selectOption('Populated');

    const staffTab = administration.getByRole('button', { name: 'Staff directory' });
    if (await staffTab.isVisible()) {
      await staffTab.focus();
      await page.keyboard.press('Enter');
      await expect(staffTab).toHaveAttribute('aria-current', 'page');
    } else {
      const sectionSelect = administration.getByLabel('Administration section', { exact: true });
      await sectionSelect.focus();
      await sectionSelect.selectOption('Staff directory');
      await expect(sectionSelect).toHaveValue('Staff directory');
    }
    const desktopStaffRow = administration.locator('tbody tr').filter({
      hasText: 'Identity withheld by directory policy',
    }).first();
    const mobileStaffCard = administration.locator('.cards article').filter({
      hasText: 'Identity withheld by directory policy',
    }).first();
    if (await desktopStaffRow.isVisible()) {
      await expect(desktopStaffRow).toContainText('Identity withheld by directory policy');
    } else {
      await expect(mobileStaffCard).toContainText('Identity withheld by directory policy');
    }
    await administration
      .locator('button[aria-label="Review activity for directory record 1"]:visible')
      .click();
    await expect(administration.locator('[data-fi10-activity="true"]')).toBeVisible();
    await expect(
      administration.getByText('Preview inspection intentionally withholds staff activity.', { exact: false }),
    ).toBeVisible();

    await previewState.selectOption('Empty');
    await expect(
      administration.getByRole('heading', { name: 'No administration records are shown in this preview state' }),
    ).toBeVisible();
    await previewState.selectOption('Populated');
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth),
    ).toBeLessThanOrEqual(1);
  }

  expect(protectedRequests).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test('reaches the real staff sign-in page through Test Real Login Flow', async ({ page }) => {
  await installVersion(page, true);
  await installEmptyFeed(page);
  await page.goto('/#/__preview/index');
  await page.locator('[data-action="test-login"]').click();
  await expect(page.getByRole('heading', { name: 'Staff sign in' })).toBeVisible();
  await expect(page.locator('[data-preview-index]')).toHaveCount(0);
});

test('shows a labeled, sanitized, read-only surface preview with no additional API traffic', async ({
  page,
}) => {
  await installVersion(page, true);
  await installEmptyFeed(page);

  const requests = [];
  page.on('request', (request) => {
    if (request.url().includes('/api/')) {
      requests.push({ method: request.method(), pathname: new URL(request.url()).pathname });
    }
  });

  await page.goto('/#/__preview/index');
  await expect(page.locator('[data-preview-index]')).toBeVisible();
  requests.length = 0;

  await page.locator('[data-preview-route="overview"] [data-action="surface"]').click();
  await expect(page.locator('[data-preview-surface]')).toBeVisible();
  await expect(page.getByRole('note').getByText(/Visual reference only/)).toBeVisible();
  await expect(page.locator('[data-preview-surface] input')).toHaveCount(0);
  await expect(page.locator('[data-preview-surface] form')).toHaveCount(0);

  await page.locator('[data-action="surface-back"]').click();
  await expect(page.locator('[data-preview-surface]')).toHaveCount(0);

  expect(requests.filter((request) => request.pathname !== '/api/version')).toEqual([]);
  expect(requests.filter((request) => request.method !== 'GET')).toEqual([]);
});

test('focuses the heading on entry and restores launcher focus only on Back', async ({ page }) => {
  await installVersion(page, true);
  await installEmptyFeed(page);

  await page.goto('/#/__preview/index');
  await expect(page.locator('[data-preview-index]')).toBeVisible();
  await expect(page.locator('[data-preview-index] h1')).toBeFocused();

  await page.goto('/');
  const launcher = page.locator('[data-preview-index-launcher]');
  await expect(launcher).toBeVisible();
  await launcher.click();
  await expect(page.locator('[data-preview-index]')).toBeVisible();
  await expect(page.locator('[data-preview-index] h1')).toBeFocused();
  await page.locator('[data-action="back"]').click();
  await expect(launcher).toBeFocused();

  const launcherHeight = await launcher.evaluate((element) => element.getBoundingClientRect().height);
  expect(launcherHeight).toBeGreaterThanOrEqual(44);
});

test('does not focus the reappearing launcher after Open or Test Real Login', async ({ page }) => {
  await installVersion(page, true);
  await installEmptyFeed(page);

  await page.goto('/');
  await page.locator('[data-preview-index-launcher]').click();
  await expect(page.locator('[data-preview-index]')).toBeVisible();
  await page.locator('[data-preview-route="landing"] [data-action="open"]').click();
  await expect(page.getByRole('heading', { name: 'Every request. Every handoff. On record.' })).toBeVisible();
  const launcher = page.locator('[data-preview-index-launcher]');
  await expect(launcher).toBeVisible();
  await expect(launcher).not.toBeFocused();

  await launcher.click();
  await expect(page.locator('[data-preview-index]')).toBeVisible();
  await page.locator('[data-action="test-login"]').click();
  await expect(page.getByRole('heading', { name: 'Staff sign in' })).toBeVisible();
  await expect(launcher).toBeVisible();
  await expect(launcher).not.toBeFocused();
});

test('honors reduced motion on the preview index surface', async ({ page }) => {
  await installVersion(page, true);
  await installEmptyFeed(page);
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/#/__preview/index');
  await expect(page.locator('[data-preview-index]')).toBeVisible();

  const duration = await page
    .locator('[data-preview-index]')
    .evaluate((element) => getComputedStyle(element).animationDuration);
  expect(parseFloat(duration)).toBeGreaterThan(0);
  expect(parseFloat(duration)).toBeLessThan(0.001);
});

test('keeps skip link on the Index and focuses the heading without changing the hash', async ({ page }) => {
  await installVersion(page, true);
  await installEmptyFeed(page);
  await page.goto('/#/__preview/index');
  await expect(page.locator('[data-preview-index]')).toBeVisible();

  const skipLink = page.getByRole('link', { name: 'Skip to main content' });

  // Starts off-canvas.
  const offscreenTop = await skipLink.evaluate((element) => element.getBoundingClientRect().top);
  expect(offscreenTop).toBeLessThan(0);

  // Reset focus to the document start so Tab reaches the skip link first.
  await page.evaluate(() => {
    document.body.setAttribute('tabindex', '-1');
    document.body.focus();
  });

  // Tab focuses and brings it into the viewport.
  await page.keyboard.press('Tab');
  await expect(skipLink).toBeFocused();
  await expect
    .poll(() => skipLink.evaluate((element) => element.getBoundingClientRect().top))
    .toBeGreaterThanOrEqual(0);

  // Enter keeps the exact Index hash, keeps Index rendered, and focuses the heading.
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#\/__preview\/index$/u);
  await expect(page.locator('[data-preview-index]')).toBeVisible();
  await expect(page.locator('[data-preview-index] h1')).toBeFocused();
});
