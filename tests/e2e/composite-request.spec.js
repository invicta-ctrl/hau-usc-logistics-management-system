import { test, expect } from '@playwright/test';

test('submits selected composite sections as one visible parent hierarchy', async ({ page }, testInfo) => {
  test.skip(testInfo.project.use.viewport.width < 390, 'Run the composite form at practical mobile and desktop widths.');
  await page.goto('/');
  await expect(page.locator('#loading')).toHaveClass(/hidden/);
  await page.locator('#primaryNav [data-view="request"]').click();

  const panel = page.locator('#compositeRequestPanel');
  await expect(panel).toBeVisible();
  await panel.locator('#compositeEvent').selectOption({ index: 1 });
  await panel.locator('[data-composite-toggle][value="FOOD"]').check();
  await panel.locator('[name="foodLine"]').fill('Packed meals');
  await panel.locator('[data-composite-toggle][value="MATERIALS"]').check();
  await panel.locator('[name="materialsLine"]').fill('Directional signs');
  await panel.getByRole('button', { name: 'Review composite request' }).click();

  const result = panel.locator('#compositeRequestResult');
  await expect(result).toBeVisible();
  await expect(result).toContainText(/LREQ-/);
  await expect(result).toContainText('FOOD');
  await expect(result).toContainText('MATERIALS');
});
