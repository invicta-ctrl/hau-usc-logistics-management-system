import { expect, test } from '@playwright/test';
import { createEmptyBootstrapFixture } from '../fixtures/bootstrap-fixtures.js';

const DIRECTOR_CAPABILITIES = [
  'view.request',
  'view.internal',
  'view.all.summary',
  'view.audit',
  'view.inventory',
  'request.review',
  'fulfillment.procure',
  'fulfillment.release',
  'lending.approve',
  'lending.usage.view',
];

async function openDirector(page) {
  const bootstrap = createEmptyBootstrapFixture({ backendMode: 'rest' });
  bootstrap.currentUser = {
    ...bootstrap.currentUser,
    id: 'SYNTHETIC-DIRECTOR',
    displayName: 'Authorized Director',
    role: 'DIRECTOR',
    authorization: {
      contract: 'canonical-authorization',
      contractVersion: 2,
      modelVersion: 2,
      roleId: 'DIRECTOR',
      roleLabel: 'Director',
      scopeMode: 'ALL',
      committeeIds: [],
      committees: [],
      capabilities: DIRECTOR_CAPABILITIES,
      workspaceIds: ['director'],
      defaultWorkspaceId: 'director',
      mappingStatus: 'MAPPED',
      active: true,
    },
  };
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
        csrfToken: 'director-csrf',
        user: {
          accountId: 'SYNTHETIC-DIRECTOR',
          displayName: 'Authorized Director',
          experienceId: 'director',
          authorization: bootstrap.currentUser.authorization,
        },
      }),
    }),
  );
  await page.route('**/api/getBootstrapData', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, data: bootstrap }) }),
  );
  await page.goto('/app/director');
  await expect(page.locator('#loading')).toHaveClass(/hidden/u);
  return bootstrap;
}

test('Director receives complete decision and readiness destinations without Admin controls', async ({
  page,
}, testInfo) => {
  test.skip(
    !['chromium-390', 'chromium-1366'].includes(testInfo.project.name),
    'One mobile and one desktop proof are sufficient.',
  );
  await openDirector(page);
  const shell = page.locator('[data-internal-shell-context]');
  await expect(shell.locator('[data-shell-account-role]')).toHaveText('Director');
  await expect(shell.getByLabel('Workspace')).toHaveValue('director');
  await expect(shell.getByLabel('Workspace').locator('option:not(:disabled)')).toHaveCount(1);
  await expect(page.locator('[data-admin-view="referenceAdmin"]')).toBeHidden();

  const panel = page.locator('#roleExperiencePanel[data-role-experience="director"]');
  await expect(panel).toBeVisible();
  for (const name of [
    'Decision Queue',
    'Event Planning',
    'Event Series & Sub-events',
    'Committee Readiness',
    'Request Progress',
    'Procurement Progress',
    'Release Readiness',
    'Lending Status',
    'Inventory Alerts',
    'Management & Access',
  ]) {
    await expect(panel.getByRole('button', { name: new RegExp(name, 'u') })).toBeVisible();
  }

  await panel.getByRole('button', { name: /^Inventory Alerts/u }).click();
  await expect(page.locator('#inventory')).toHaveClass(/active/u);
  await expect(page.locator('#inventoryStatusFilter')).toHaveValue('VERIFY');
});

test('Director Management & Access stays bounded and actionable metrics open owner workflows', async ({
  page,
}, testInfo) => {
  test.skip(
    !['chromium-390', 'chromium-1366'].includes(testInfo.project.name),
    'One mobile and one desktop proof are sufficient.',
  );
  await openDirector(page);
  const panel = page.locator('#roleExperiencePanel[data-role-experience="director"]');

  await panel.getByRole('button', { name: /^Management & Access/u }).click();
  const management = panel.locator('[data-director-management-access]');
  await expect(management).toBeFocused();
  await expect(management).toContainText('Director');
  await expect(management).toContainText('Server-authorized');
  await expect(management).toContainText('No system administration');

  await panel.getByRole('button', { name: /Inventory alerts/u }).click();
  await expect(page.locator('#inventoryStatusFilter')).toHaveValue('VERIFY');

  await page.goto('/app/director');
  await expect(page.locator('#loading')).toHaveClass(/hidden/u);
  const refreshedPanel = page.locator('#roleExperiencePanel[data-role-experience="director"]');
  await refreshedPanel.getByRole('button', { name: /Leadership decisions/u }).click();
  await expect(page.getByRole('heading', { name: 'Decision Queue' })).toBeVisible();

  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth),
    )
    .toBeLessThanOrEqual(1);
});
