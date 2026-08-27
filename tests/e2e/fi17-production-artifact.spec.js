import { expect, test } from '@playwright/test';

const protectedPathPrefixes = ['/api/bootstrap', '/api/session', '/api/playground/'];

test('FI-17 production artifact fails closed without Playground chrome or fixture success', async ({
  page,
}) => {
  const consoleErrors = [];
  const failedResponses = [];
  const pageErrors = [];
  const protectedRequests = [];

  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors.push(message.text());
  });
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('response', (response) => {
    if (response.status() >= 400) failedResponses.push(new URL(response.url()).pathname);
  });
  page.on('request', (request) => {
    const url = new URL(request.url());
    if (protectedPathPrefixes.some((prefix) => url.pathname.startsWith(prefix))) {
      protectedRequests.push(`${request.method()} ${url.pathname}`);
    }
  });

  await page.goto('/#/__preview/index', { waitUntil: 'domcontentloaded' });

  await expect(page.locator('meta[name="hau-deploy-target"]')).toHaveAttribute(
    'content',
    'production',
  );
  await expect(
    page.getByRole('heading', { name: 'Every request. Every handoff. On record.' }),
  ).toBeVisible();
  await expect(
    page
      .getByRole('article')
      .getByText('Current announcements are temporarily unavailable. Please try again shortly.'),
  ).toBeVisible();
  await expect(page.locator('[data-preview-index]')).toHaveCount(0);
  await expect(page.locator('[data-preview-index-launcher]')).toHaveCount(0);
  await expect(page.locator('[data-preview-surface]')).toHaveCount(0);
  await expect(page.getByText('PREVIEW MODE · Mock data only', { exact: false })).toHaveCount(0);

  expect(protectedRequests).toEqual([]);
  expect(pageErrors).toEqual([]);
  expect([...new Set(failedResponses)].sort()).toEqual([
    '/api/public/advertisements',
    '/api/version',
  ]);
  expect(
    consoleErrors.filter(
      (message) => message !== 'Failed to load resource: the server responded with a status of 404 (Not Found)',
    ),
  ).toEqual([]);
});
