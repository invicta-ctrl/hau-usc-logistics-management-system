import { test, expect } from '@playwright/test';

test('navigates primary modules and has no page-level horizontal overflow', async ({ page }, testInfo) => {
  await page.goto('/');
  const width = testInfo.project.use.viewport.width;
  if (width < 768) {
    await expect(page.locator('.bottom-nav')).toBeVisible();
    await page.getByRole('button', { name: 'Inventory', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Catalog and balances' })).toBeVisible();
    await page.getByRole('button', { name: 'More', exact: true }).click();
    await expect(page.getByRole('dialog', { name: 'More logistics modules' })).toBeVisible();
    await page.getByRole('button', { name: /Office Lending Hub/ }).click();
    await expect(page.getByRole('heading', { name: 'Borrowing and consumable tickets' })).toBeVisible();
  } else {
    for (const name of [
      'Request Center',
      'Release Desk',
      'Inventory Management',
      'Office Lending Hub',
      'Restocking',
      'Procurement & Deliverables',
      'Reports & Admin',
    ]) {
      await page
        .getByRole('button', { name: new RegExp(name) })
        .first()
        .click();
      await expect(page.locator('#view-root')).not.toBeEmpty();
    }
  }
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  );
  expect(overflow).toBeLessThanOrEqual(1);
});

test('request-only portal cannot reveal internal modules or state', async ({ page }) => {
  await page.goto('/?mode=request');
  await expect(page.getByText('Preview-only requester portal')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'New logistics request' })).toBeVisible();
  await expect(page.getByText('Inventory Management')).toHaveCount(0);
  await expect(page.getByText('Supplier TIN')).toHaveCount(0);
  await expect(page.getByText('Audit Log')).toHaveCount(0);
});
