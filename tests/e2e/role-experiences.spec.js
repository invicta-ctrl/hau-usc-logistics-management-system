import { test, expect } from '@playwright/test';
import { navigateToView } from './navigation.js';

test('shared internal context bar stays truthful, accessible, and responsive', async ({
  page,
}, testInfo) => {
  test.skip(
    !['chromium-390', 'chromium-1366'].includes(testInfo.project.name),
    'One mobile and one desktop shell proof are sufficient.',
  );
  await page.goto('/app/admin');
  await expect(page.locator('#loading')).toHaveClass(/hidden/);

  const shell = page.locator('[data-internal-shell-context]');
  await expect(shell).toBeVisible();
  await expect(shell.getByLabel('Workspace')).toHaveValue('administrator');
  await expect(shell.getByLabel('Workspace').locator('option:disabled')).toHaveCount(0);
  await expect(shell.getByLabel('Operational scope')).toHaveValue('current');
  await expect(shell.getByRole('navigation', { name: 'Breadcrumb' })).toContainText(
    'Administrator',
  );
  await expect(shell.locator('[data-shell-release]')).toContainText(/v0\.7\.0/u);
  await expect(shell.getByRole('button', { name: /operational items? need attention/u })).toBeVisible();
  await shell.locator('.shell-account > summary').click();
  await expect(shell.locator('[data-shell-account-role]')).toContainText(/ADMIN|Administrator/u);

  await shell.getByLabel('Workspace').selectOption('food');
  await expect(page).toHaveURL(/\/app\/food$/u);
  await expect(page.locator('body')).toHaveAttribute('data-workspace', 'food');
  await expect(shell.getByRole('navigation', { name: 'Breadcrumb' })).toContainText(
    'Food Committee',
  );
  await expect(page.locator('#roleExperiencePanel')).toHaveAttribute('data-role-experience', 'food');
  expect(
    await page.evaluate(() => getComputedStyle(document.body).getPropertyValue('--role-accent').trim()),
  ).toBe('#c65f1c');
  await expect(shell.locator('[data-shell-account-role]')).toContainText(/ADMIN|Administrator/u);

  await navigateToView(page, 'inventory');
  await expect(shell.locator('[data-shell-module-crumb]')).toHaveText('Inventory Management');
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
  await expect(
    panel.getByRole('heading', { name: 'Decisions, readiness, and cross-committee blockers' }),
  ).toBeVisible();
  await expect(panel.getByText('Bounded Management & Access', { exact: true })).toBeVisible();
  await expect(panel.getByRole('button', { name: /Review cross-committee requests/ })).toBeVisible();
  await expect(panel.getByRole('button', { name: /Check release readiness/ })).toBeVisible();

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
  await expect(
    panel.getByRole('heading', { name: 'Keep every meal, deadline, and handoff on time' }),
  ).toBeVisible();
  await expect(panel.getByText('Food capability boundary', { exact: true })).toBeVisible();
  await expect(panel.getByRole('button', { name: /Open the food request queue/ })).toBeVisible();
  await expect(panel.getByRole('button', { name: /Open controlled distribution/ })).toBeVisible();
  expect(
    await page.evaluate(() => getComputedStyle(document.body).getPropertyValue('--role-accent').trim()),
  ).toBe('#c65f1c');

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});

test('Inventory & Pantry receives an exception-first amber shared-shell experience', async ({ page }, testInfo) => {
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
  await expect(
    panel.getByRole('heading', { name: 'Keep stock accurate, available, and traceable' }),
  ).toBeVisible();
  await expect(panel.getByText('Inventory authority boundary', { exact: true })).toBeVisible();
  await expect(panel.getByRole('button', { name: /Open stock control/ })).toBeVisible();
  await expect(panel.getByRole('button', { name: /Review circulation exceptions/ })).toBeVisible();
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
  await expect(
    panel.getByRole('heading', { name: 'Move materials from request to release without losing context' }),
  ).toBeVisible();
  await expect(panel.getByText('Materials capability boundary', { exact: true })).toBeVisible();
  await expect(panel.getByRole('button', { name: /Open the materials queue/ })).toBeVisible();
  await expect(panel.getByRole('button', { name: /Compare sourcing and budget/ })).toBeVisible();
  expect(
    await page.evaluate(() => getComputedStyle(document.body).getPropertyValue('--role-accent').trim()),
  ).toBe('#356a88');

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
