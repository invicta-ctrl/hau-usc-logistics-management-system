import { test, expect } from '@playwright/test';

test('Committee Main Hub queue counts open the same bounded matching record set', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#loading')).toHaveClass(/hidden/);
  await expect(page.locator('#committeeDashboardPanel')).toBeVisible();
  await expect(page.locator('#dashboardCommitteeSelect')).toBeVisible();
  await expect(page.locator('#dashboardRefresh')).toBeEnabled();

  const queue = page.locator('#dashboardQueues [data-dashboard-queue="requests-review"]');
  await expect(queue).toBeVisible();
  await queue.focus();
  await expect(queue).toBeFocused();
  const count = Number((await queue.locator('strong').textContent()).trim());
  await queue.press('Enter');

  await expect(page.locator('#drawerBackdrop')).toHaveClass(/show/);
  await expect(page.locator('#drawer')).toContainText(`${count} matching record`);
  await expect(page.locator('#drawer .line-list .request-line')).toHaveCount(count);
});
