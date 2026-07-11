import { test, expect } from '@playwright/test';

test('creates a request with keyboard autocomplete', async ({ page }, testInfo) => {
  test.skip(
    testInfo.project.use.viewport.width < 390,
    'Run the full form flow once at practical mobile/desktop widths.',
  );
  await page.goto('/#requests');
  const input = page.getByRole('combobox', { name: 'Item / particular' });
  await input.fill('ballpen');
  await input.press('ArrowDown');
  await input.press('Enter');
  await expect(page.getByText(/ITM-0001 selected exactly/)).toBeVisible();
  await page.getByRole('button', { name: 'Add item to review' }).click();
  await expect(page.getByText(/Full stock match/)).toBeVisible();
  await page.getByRole('button', { name: 'Submit for review' }).click();
  await expect(page.getByText(/submitted for review/)).toBeVisible();
});

test('modal traps focus and restores it to the trigger', async ({ page }) => {
  await page.goto('/#release');
  const trigger = page.getByRole('button', { name: 'Release quantity' }).first();
  await trigger.focus();
  await trigger.click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test('mobile inventory exposes secondary actions through one overflow menu', async ({ page }, testInfo) => {
  test.skip(testInfo.project.use.viewport.width >= 768, 'Mobile-specific behavior.');
  await page.goto('/#inventory');
  const more = page.getByRole('button', { name: /More actions for ITM-0001/ });
  await more.click();
  await expect(page.getByRole('menuitem', { name: /ledger history/ })).toBeVisible();
  await page.getByRole('menuitem', { name: /ledger history/ }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
});
