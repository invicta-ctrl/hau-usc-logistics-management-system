import { test, expect } from '@playwright/test';
import { navigateToView } from './navigation.js';

async function revealWorkspaceSwitcher(page) {
  const menu = page.locator('[data-signature-menu]');
  if ((await menu.getAttribute('aria-expanded')) !== 'true') await menu.click();
  const switcher = page.locator('[data-v5-scope-switcher]');
  if ((await switcher.getAttribute('open')) === null) await switcher.locator('summary').click();
  await expect(switcher.getByLabel('Workspace')).toBeVisible();
}

test('shared internal context bar stays truthful, accessible, and responsive', async ({ page }, testInfo) => {
  test.skip(
    !['chromium-390', 'chromium-1366'].includes(testInfo.project.name),
    'One mobile and one desktop shell proof are sufficient.',
  );
  await page.goto('/app/admin');
  await expect(page.locator('#loading')).toHaveClass(/hidden/);

  const shell = page.locator('[data-internal-shell-context]');
  await expect(shell).toBeVisible();
  await expect(page.locator('#shellWorkspaceSelect')).toHaveValue('administrator');
  await expect(page.locator('#shellWorkspaceSelect option:disabled')).toHaveCount(0);
  await expect(page.locator('#shellScopeSelect')).toHaveValue('current');
  await expect(shell.locator('.shell-breadcrumbs')).toContainText('Administrator');
  await expect(shell.locator('[data-shell-release]')).toHaveText('Test site');
  await expect(shell.locator('.shell-attention')).toHaveAttribute(
    'aria-label',
    /operational items? need attention/u,
  );
  await shell.locator('.shell-account > summary').click();
  await expect(shell.locator('[data-shell-account-role]')).toContainText(/ADMIN|Administrator/u);

  await revealWorkspaceSwitcher(page);
  await page.locator('#shellWorkspaceSelect').selectOption('food');
  await expect(page).toHaveURL(/\/food$/u);
  await expect(page.locator('body')).toHaveAttribute('data-workspace', 'food');
  await expect(shell.locator('.shell-breadcrumbs')).toContainText('Food Committee');
  await expect(page.locator('#roleExperiencePanel')).toHaveAttribute('data-role-experience', 'food');
  expect(
    await page.evaluate(() => getComputedStyle(document.body).getPropertyValue('--role-accent').trim()),
  ).toBe('#c65f1c');
  await expect(shell.locator('[data-shell-account-role]')).toContainText(/ADMIN|Administrator/u);

  await navigateToView(page, 'inventory');
  await expect(shell.locator('[data-shell-module-crumb]')).toHaveText('Inventory');
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
});

test('Director receives a decision-first shared-shell experience', async ({ page }, testInfo) => {
  test.skip(
    !['chromium-390', 'chromium-1366'].includes(testInfo.project.name),
    'One mobile and one desktop role proof are sufficient.',
  );
  await page.goto('/');
  await expect(page.locator('#loading')).toHaveClass(/hidden/);
  await page.evaluate(() => {
    document.body.dataset.experience = 'director';
  });

  const panel = page.locator('#roleExperiencePanel');
  await expect(panel).toBeVisible();
  await expect(panel).toHaveAttribute('data-role-experience', 'director');
  await expect(panel.getByRole('heading', { name: 'Executive Overview' })).toBeVisible();
  await expect(panel.getByText('Bounded Management & Access', { exact: true })).toBeVisible();
  await expect(panel.getByRole('button', { name: /^Decision Queue/u })).toBeVisible();
  await expect(panel.getByRole('button', { name: /^Release Readiness/u })).toBeVisible();

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test('Food receives a deadline-first orange-accent shared-shell experience', async ({ page }, testInfo) => {
  test.skip(
    !['chromium-390', 'chromium-1366'].includes(testInfo.project.name),
    'One mobile and one desktop role proof are sufficient.',
  );
  await page.goto('/');
  await expect(page.locator('#loading')).toHaveClass(/hidden/);
  await page.evaluate(() => {
    document.body.dataset.experience = 'food';
  });

  const panel = page.locator('#roleExperiencePanel');
  await expect(panel).toBeVisible();
  await expect(panel).toHaveAttribute('data-role-experience', 'food');
  await expect(panel.getByRole('heading', { name: 'Food Overview' })).toBeVisible();
  await expect(panel.getByText('Food capability boundary', { exact: true })).toBeVisible();
  await expect(panel.getByRole('button', { name: /^Food Work Queue/u })).toBeVisible();
  await expect(panel.getByRole('button', { name: /^Release Desk/u })).toBeVisible();
  expect(
    await page.evaluate(() => getComputedStyle(document.body).getPropertyValue('--role-accent').trim()),
  ).toBe('#c65f1c');

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test('Inventory & Pantry receives an exception-first amber shared-shell experience', async ({
  page,
}, testInfo) => {
  test.skip(
    !['chromium-390', 'chromium-1366'].includes(testInfo.project.name),
    'One mobile and one desktop role proof are sufficient.',
  );
  await page.goto('/');
  await expect(page.locator('#loading')).toHaveClass(/hidden/);
  await page.evaluate(() => {
    document.body.dataset.experience = 'inventory-pantry';
  });

  const panel = page.locator('#roleExperiencePanel');
  await expect(panel).toBeVisible();
  await expect(panel).toHaveAttribute('data-role-experience', 'inventory-pantry');
  await expect(panel.getByRole('heading', { name: 'Inventory Overview' })).toBeVisible();
  await expect(panel.getByText('Inventory authority boundary', { exact: true })).toBeVisible();
  await expect(panel.getByRole('button', { name: /^Inventory Management/u })).toBeVisible();
  await expect(panel.getByRole('button', { name: /^Lending Operations/u })).toBeVisible();
  expect(
    await page.evaluate(() => getComputedStyle(document.body).getPropertyValue('--role-accent').trim()),
  ).toBe('#d59a18');

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test('Materials receives a traceable blue-accent shared-shell experience', async ({ page }, testInfo) => {
  test.skip(
    !['chromium-390', 'chromium-1366'].includes(testInfo.project.name),
    'One mobile and one desktop role proof are sufficient.',
  );
  await page.goto('/');
  await expect(page.locator('#loading')).toHaveClass(/hidden/);
  await page.evaluate(() => {
    document.body.dataset.experience = 'materials';
  });

  const panel = page.locator('#roleExperiencePanel');
  await expect(panel).toBeVisible();
  await expect(panel).toHaveAttribute('data-role-experience', 'materials');
  await expect(panel.getByRole('heading', { name: 'Materials Overview' })).toBeVisible();
  await expect(panel.getByText('Materials capability boundary', { exact: true })).toBeVisible();
  await expect(panel.getByRole('button', { name: /^Materials Queue/u })).toBeVisible();
  await expect(panel.getByRole('button', { name: /^Canvassing/u })).toBeVisible();
  expect(
    await page.evaluate(() => getComputedStyle(document.body).getPropertyValue('--role-accent').trim()),
  ).toBe('#356a88');

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
