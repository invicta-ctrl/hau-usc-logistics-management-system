import { expect, test } from '@playwright/test';
import { createEmptyBootstrapFixture } from '../fixtures/bootstrap-fixtures.js';

const FOOD_CAPABILITIES = [
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

const foodItems = [
  {
    requestId: 'SYNTHETIC-FOOD-REQUEST-1',
    componentId: 'SYNTHETIC-FOOD-1',
    status: 'FOR_REVIEW',
    dueAt: '2026-08-12T04:00:00.000Z',
    revision: 1,
    parent: {
      eventId: 'SYNTHETIC-EVENT-1',
      eventName: 'Synthetic Leadership Summit',
      eventStartAt: '2026-08-12T04:00:00.000Z',
      priority: 'HIGH',
      purpose: 'Opening Program',
      department: 'Synthetic Office',
    },
    food: {
      version: 1,
      serviceClass: 'BULK_NON_PERISHABLE_OR_CATERING',
      expectedHeadcount: 80,
      requiredServings: 84,
      serviceStartAt: '2026-08-12T04:00:00.000Z',
      serviceEndAt: '',
      serviceLocation: 'Synthetic Hall',
      dietarySummary: 'ATTENTION_REQUIRED',
      dietaryAttentionServings: 4,
      sourcingMode: 'CANVASS_REQUIRED',
      sourcingStatus: 'PENDING_CANVASS',
      sourceReference: '',
      completionEvidenceId: '',
      leadTime: { status: 'SHORT', requiredDays: 10, actualDays: 5, shortBy: 5 },
    },
    attentionFlags: [
      'FOOD_LEAD_TIME_SHORT',
      'FOOD_SOURCING_PENDING',
      'FOOD_COMPLETION_EVIDENCE_MISSING',
    ],
  },
  {
    requestId: 'SYNTHETIC-FOOD-REQUEST-2',
    componentId: 'SYNTHETIC-FOOD-2',
    status: 'READY_FOR_HANDOFF',
    dueAt: '2026-08-12T07:00:00.000Z',
    revision: 3,
    parent: {
      eventId: 'SYNTHETIC-EVENT-1',
      eventName: 'Synthetic Leadership Summit',
      eventStartAt: '2026-08-12T07:00:00.000Z',
      priority: 'ROUTINE',
      purpose: 'Closing Program',
      department: 'Synthetic Office',
    },
    food: {
      version: 1,
      serviceClass: 'PERISHABLE_FOOD',
      expectedHeadcount: 40,
      requiredServings: 40,
      serviceStartAt: '2026-08-12T07:00:00.000Z',
      serviceEndAt: '',
      serviceLocation: 'Synthetic Hall',
      dietarySummary: 'NONE_REPORTED',
      dietaryAttentionServings: 0,
      sourcingMode: 'APPROVED_EXTERNAL_SOURCE',
      sourcingStatus: 'CONFIRMED',
      sourceReference: 'SYNTHETIC-QUOTE-2',
      completionEvidenceId: '',
      leadTime: { status: 'MET', requiredDays: 5, actualDays: 8, shortBy: 0 },
    },
    attentionFlags: ['FOOD_COMPLETION_EVIDENCE_MISSING'],
  },
];

async function openFood(page, { capabilities = FOOD_CAPABILITIES } = {}) {
  const bootstrap = createEmptyBootstrapFixture({ backendMode: 'rest' });
  bootstrap.currentUser = {
    ...bootstrap.currentUser,
    id: 'SYNTHETIC-FOOD-OPERATOR',
    displayName: 'Authorized Food Operator',
    role: 'DOL_STAFF',
    permissions: { review: true, release: true, receive: true, admin: false, manageCatalog: false },
    authorization: {
      contract: 'canonical-authorization',
      contractVersion: 2,
      modelVersion: 2,
      roleId: 'DOL_STAFF',
      roleLabel: 'DOL staff',
      scopeMode: 'COMMITTEE',
      committeeIds: ['COM_FOOD'],
      committees: [{ id: 'COM_FOOD', name: 'Food Committee' }],
      capabilities,
      workspaceIds: ['food'],
      defaultWorkspaceId: 'food',
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
        csrfToken: 'food-csrf',
        user: {
          accountId: 'SYNTHETIC-FOOD-OPERATOR',
          displayName: 'Authorized Food Operator',
          experienceId: 'food',
          authorization: bootstrap.currentUser.authorization,
        },
      }),
    }),
  );
  await page.route('**/api/getBootstrapData', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ ok: true, data: bootstrap }) }),
  );
  await page.route('**/api/getFoodWorkQueue', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, committeeId: 'COM_FOOD', items: foodItems }),
    }),
  );
  await page.goto('/app/food');
  await expect(page.locator('#loading')).toHaveClass(/hidden/u);
  await expect(page.locator('#foodCommitteeQueue')).toContainText('SYNTHETIC-FOOD-1');
}

test('Food workspace exposes every accepted destination and governed queue context', async ({
  page,
}, testInfo) => {
  test.skip(
    !['chromium-390', 'chromium-1366'].includes(testInfo.project.name),
    'One mobile and one desktop proof are sufficient.',
  );
  await openFood(page);
  const shell = page.locator('[data-internal-shell-context]');
  await expect(shell.getByLabel('Workspace')).toHaveValue('food');
  await expect(shell.locator('[data-shell-account-role]')).toHaveText('DOL staff');
  await expect(page.locator('[data-admin-view="referenceAdmin"]')).toBeHidden();

  const panel = page.locator('#roleExperiencePanel[data-role-experience="food"]');
  await expect(panel.getByRole('heading', { name: 'Food Overview' })).toBeVisible();
  for (const [destination, name] of [
    ['food-work-queue', 'Food Work Queue'],
    ['food-suppliers-quotes', 'Suppliers & Quotes'],
    ['food-procurement', 'Procurement'],
    ['food-receiving', 'Receiving'],
    ['food-release', 'Release Desk'],
    ['food-workflow-reference', 'Workflow Reference'],
  ]) {
    await expect(
      panel.locator(`.role-experience-actions [data-food-destination="${destination}"]`),
    ).toContainText(name);
  }

  await expect(panel).toContainText('Synthetic Leadership Summit');
  await expect(panel).toContainText('Opening Program');
  await expect(panel).toContainText('80 headcount');
  await expect(panel).toContainText('84 servings');
  await expect(panel).toContainText('4 dietary-attention servings');
  await expect(panel).toContainText('Lead time short');

  await panel.getByRole('button', { name: /^Food Work Queue/u }).click();
  await expect(page.locator('#request')).toHaveClass(/active/u);
  const queue = page.locator('#foodCommitteeQueue');
  await expect(queue).toContainText('Synthetic Leadership Summit');
  await expect(queue).toContainText('Opening Program');
  await expect(queue).toContainText('80 headcount');
  await expect(queue).toContainText('84 servings');
});

test('Food destinations reuse shared canvass, procurement, receiving, release, and reference surfaces', async ({
  page,
}, testInfo) => {
  test.skip(
    !['chromium-390', 'chromium-1366'].includes(testInfo.project.name),
    'One mobile and one desktop proof are sufficient.',
  );
  await openFood(page);
  const panel = page.locator('#roleExperiencePanel[data-role-experience="food"]');

  await panel.getByRole('button', { name: /^Suppliers & Quotes/u }).click();
  await expect(page.locator('#procurement')).toHaveClass(/active/u);
  await expect(page.locator('[data-proc-tab="canvass"]')).toHaveClass(/active/u);
  await expect(page.getByRole('heading', { name: 'Canvass Library' })).toBeVisible();

  await page.goto('/app/food');
  await expect(page.locator('#loading')).toHaveClass(/hidden/u);
  await page.locator('#roleExperiencePanel [data-food-destination="food-receiving"]').last().click();
  await expect(page.locator('[data-proc-tab="receiving"]')).toHaveClass(/active/u);

  await page.goto('/app/food');
  await expect(page.locator('#loading')).toHaveClass(/hidden/u);
  await page.locator('#roleExperiencePanel').getByRole('button', { name: /^Release Desk/u }).click();
  await expect(page.locator('#release')).toHaveClass(/active/u);

  await page.goto('/app/food');
  await expect(page.locator('#loading')).toHaveClass(/hidden/u);
  const refreshedPanel = page.locator('#roleExperiencePanel[data-role-experience="food"]');
  await refreshedPanel.getByRole('button', { name: /^Workflow Reference/u }).click();
  const reference = refreshedPanel.locator('[data-food-workflow-reference]');
  await expect(reference).toBeFocused();
  await expect(reference).toContainText('10 business days');
  await expect(reference).toContainText('5 business days');
  await expect(reference).toContainText('Historical prices are reference only');
  await expect(reference).toContainText('Aggregate dietary and allergen counts only');

  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth),
    )
    .toBeLessThanOrEqual(1);
});

test('Food action projection fails closed when a server capability is absent', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-390', 'One focused capability projection is sufficient.');
  await openFood(page, {
    capabilities: FOOD_CAPABILITIES.filter((capability) => capability !== 'fulfillment.receive'),
  });
  const panel = page.locator('#roleExperiencePanel[data-role-experience="food"]');
  const receivingActions = panel.locator('[data-food-destination="food-receiving"]');
  await expect(receivingActions).toHaveCount(2);
  await expect(receivingActions.first()).toBeDisabled();
  await expect(receivingActions.last()).toBeDisabled();
  await expect(page.locator('#procurement')).not.toHaveClass(/active/u);
});
