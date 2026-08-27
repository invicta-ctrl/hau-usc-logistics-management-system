import { expect, test } from '@playwright/test';

const VERSION = '**/api/version';
const exactInspectionPort = process.env.HAU_FRONTEND_E2E_PORT === '4173';

function installVersion(page) {
  return page.route(VERSION, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, correlationId: 'fi11-e2e', playground: true }),
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

async function selectAdministrationTab(page, administration, label) {
  const viewport = page.viewportSize();
  if (viewport && viewport.width <= 768) {
    await administration.getByLabel('Administration section', { exact: true }).selectOption({ label });
    return;
  }
  await administration.getByRole('button', { name: label, exact: true }).click();
}

test('FI-11 exposes truthful sanitized Event and Administration inspection surfaces without protected traffic', async ({
  page,
}) => {
  test.skip(!exactInspectionPort, 'Run explicitly against the accepted 4173 supervisor.');
  await installVersion(page);
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

  await page.goto('/#/__preview/index', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('[data-preview-index]')).toBeVisible();
  await expect(
    page.locator('[data-preview-route="events"] [data-preview-entry-meta="status"] dd'),
  ).toHaveText('ACCEPTED');
  await expect(
    page.locator('[data-preview-route="events"] [data-preview-entry-meta="backend"] dd'),
  ).toHaveText('REAL BACKEND');
  await expect(
    page.locator('[data-preview-route="events"] [data-preview-entry-meta="mode"] dd'),
  ).toHaveText('Real module');

  await page.locator('[data-preview-route="events"] [data-action="open-preview"]').click();
  const events = page.locator('[data-fi11-events="true"]');
  await expect(events).toBeVisible();
  await expect(events.getByRole('heading', { name: 'Read-only event relationships' })).toBeVisible();
  await expect(events).toContainText('Sanitized event series');
  await expect(events.getByText('Synthetic preview · no session, backend, or protected data')).toBeVisible();
  await expect(events.getByRole('button', { name: 'New event' })).toHaveCount(0);
  await expect(events.locator('[role="dialog"]')).toHaveCount(0);
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth))
    .toBeLessThanOrEqual(1);
  await page.getByRole('button', { name: 'Back to Preview Index' }).first().click();

  await page.locator('[data-preview-route="administration"] [data-action="open-preview"]').click();
  const administration = page.locator('[data-fi11-administration="true"]');
  await expect(administration).toBeVisible();
  await selectAdministrationTab(page, administration, 'Reference administration');
  await expect(administration).toContainText('Reference-set data is not available in this frontend contract');
  await expect(administration).not.toContainText('departments 18');
  await selectAdministrationTab(page, administration, 'Link registry');
  await expect(administration).toContainText('Sanitized governed destination');
  await expect(administration).toContainText('Raw link identifiers, revision internals, and correlation data are not shown.');
  await selectAdministrationTab(page, administration, 'Brand & media');
  await expect(administration).toContainText('Sanitized brand slot');
  await expect(administration).toContainText('Upload, replacement, publish, rollback, provider synchronization, hashes, and storage internals remain outside this frontend slice.');
  await selectAdministrationTab(page, administration, 'System status');
  await expect(administration).toContainText('No live technical or readiness request was made in local Preview Index inspection.');
  await expect(administration).toContainText('REDACTED · READ-ONLY');
  await expect(administration).not.toContainText('schema 30');
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth))
    .toBeLessThanOrEqual(1);

  expect(protectedRequests).toEqual([]);
  expect(consoleErrors).toEqual([]);
});
