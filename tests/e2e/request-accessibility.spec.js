import { test, expect } from '@playwright/test';

test('creates a request with keyboard autocomplete', async ({ page }, testInfo) => {
  test.skip(testInfo.project.use.viewport.width < 390, 'Run the full form once at practical mobile and desktop widths.');
  await page.goto('/');
  await expect(page.locator('#loading')).toHaveClass(/hidden/);
  await page.locator('#primaryNav [data-view="request"]').click();
  const input = page.locator('#requestItemInput');
  await input.fill('ballpen');
  await expect(page.locator('#requestAutocomplete [role="option"]').first()).toBeVisible();
  await input.press('ArrowDown');
  await input.press('Enter');
  await expect(page.locator('#requestDecision')).toContainText(/fulfilled from stock|Partial stock detected|For Canvassing/);
  await page.locator('#addRequestLine').click();
  await expect(page.locator('#draftLineCount')).toContainText('1 line');
  await page.locator('[name="requesterName"]').fill('Demo Requester');
  await page.locator('[name="requesterEmail"]').fill('demo@example.com');
  await page.locator('#requestForm [name="department"]').fill('Demo Department');
  await page.locator('#requestForm [name="purpose"]').fill('Automated preview workflow check');
  await page.locator('#requestConsent').check();
  await page.getByRole('button', { name: 'Submit for DOL Review' }).click();
  await expect(page.locator('#drawerBackdrop')).toHaveClass(/show/);
  await expect(page.locator('#drawerTitle')).toHaveText('Request submitted');
});

test('modal traps focus and restores it to the trigger', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#loading')).toHaveClass(/hidden/);
  await page.locator('#primaryNav [data-view="release"]').click();
  const trigger = page.getByRole('button', { name: 'Open Ticket' }).first();
  await trigger.focus();
  await trigger.click();
  const dialog = page.locator('#modal[role="dialog"]');
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#modalBackdrop')).not.toHaveClass(/show/);
  await expect(trigger).toBeFocused();
});

test('mobile inventory actions open an accessible ledger drawer', async ({ page }, testInfo) => {
  test.skip(testInfo.project.use.viewport.width >= 768, 'Mobile-specific behavior.');
  await page.goto('/');
  await expect(page.locator('#loading')).toHaveClass(/hidden/);
  await page.locator('#primaryNav [data-view="inventory"]').click();
  const ledger = page.locator('.mobile-cards [data-inventory-action="history"]').first();
  await ledger.click();
  await expect(page.locator('#drawer[role="dialog"]')).toBeVisible();
  await expect(page.locator('#drawerTitle')).toContainText(/ITM-/);
});
