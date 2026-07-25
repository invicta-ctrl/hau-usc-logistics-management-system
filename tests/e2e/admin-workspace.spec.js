import { expect, test } from '@playwright/test';
import { navigateToView } from './navigation.js';

const ADMIN_ATTENTION_DESTINATIONS = [
  ['Access changes', 'access-changes'],
  ['Failed evidence', 'failed-evidence'],
  ['Reference-data errors', 'reference-errors'],
  ['Inventory discrepancies', 'inventory-discrepancies'],
  ['Request blockers', 'request-blockers'],
  ['Lending blockers', 'lending-blockers'],
  ['Release blockers', 'release-blockers'],
  ['Environment health', 'environment-health'],
];

test('Administrator overview prioritizes actionable exceptions and filtered destinations', async ({
  page,
}, testInfo) => {
  test.skip(
    !['chromium-390', 'chromium-1366'].includes(testInfo.project.name),
    'One mobile and one desktop proof are sufficient.',
  );
  await page.goto('/app/admin');
  await expect(page.locator('#loading')).toHaveClass(/hidden/u);

  const panel = page.locator('#roleExperiencePanel[data-role-experience="administrator"]');
  await expect(panel).toBeVisible();
  await expect(panel.getByRole('heading', { name: /Administrator Control Center/u })).toBeVisible();
  for (const [label, destination] of ADMIN_ATTENTION_DESTINATIONS) {
    await expect(panel.getByRole('button', { name: new RegExp(label, 'u') })).toHaveAttribute(
      'data-admin-destination',
      destination,
    );
  }

  await panel.getByRole('button', { name: /Inventory discrepancies/u }).click();
  await expect(page.locator('#inventory')).toHaveClass(/active/u);
  await expect(page.locator('#inventoryStatusFilter')).toHaveValue('VERIFY');

  await navigateToView(page, 'overview');
  await panel.getByRole('button', { name: /Lending blockers/u }).click();
  await expect(page.locator('#lending')).toHaveClass(/active/u);
  await expect(page.locator('[data-loan-tab="OVERDUE"]')).toHaveClass(/active/u);

  await navigateToView(page, 'overview');
  await panel.getByRole('button', { name: /Request blockers/u }).click();
  await expect(page.locator('#committeeDashboardPanel')).toBeVisible();
  await expect(page.getByRole('heading', { name: /Blocked or waiting/u })).toBeVisible();
});

test('Administrator exposes every accepted Control Center and Operations destination', async ({
  page,
}, testInfo) => {
  test.skip(
    !['chromium-390', 'chromium-1366'].includes(testInfo.project.name),
    'One mobile and one desktop proof are sufficient.',
  );
  await page.goto('/app/admin');
  await expect(page.locator('#loading')).toHaveClass(/hidden/u);
  const panel = page.locator('#roleExperiencePanel[data-role-experience="administrator"]');

  for (const name of [
    'All Request Queues',
    'Internal Lending Hub',
    'Release Desk',
    'Restocking',
    'Procurement & Deliverables',
    'Inventory Management',
    'Receiving',
    'Evidence status',
  ]) {
    await expect(panel.getByRole('button', { name: new RegExp(name, 'u') })).toBeVisible();
  }

  await panel.getByRole('button', { name: /^Release Desk/u }).click();
  await expect(page.locator('#release')).toHaveClass(/active/u);
  await expect(page.getByRole('heading', { name: 'Active Release Tickets' })).toBeVisible();

  await navigateToView(page, 'overview');
  await panel.getByRole('button', { name: /^Receiving/u }).click();
  await expect(page.locator('#procurement')).toHaveClass(/active/u);
  await expect(page.locator('[data-proc-tab="receiving"]')).toHaveClass(/active/u);

  await navigateToView(page, 'overview');
  await panel.getByRole('button', { name: /^Evidence status/u }).click();
  await expect(page.locator('[data-admin-evidence-status]')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Evidence status' })).toBeVisible();

  await page.getByRole('button', { name: /Operational Health/u }).click();
  await expect(page.locator('[data-admin-operational-health]')).toBeVisible();
  await expect(page.locator('[data-admin-operational-health]')).toContainText(/Environment|Schema/u);

  await page.getByRole('button', { name: /Brand Assets/u }).click();
  await expect(page.locator('[data-admin-brand-assets]')).toBeVisible();
  await expect(page.locator('[data-admin-brand-assets] [data-brand-slot]')).toHaveCount(4);

  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth),
    )
    .toBeLessThanOrEqual(1);
});
