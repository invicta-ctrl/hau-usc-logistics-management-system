import { test, expect } from '@playwright/test';

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
