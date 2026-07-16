import { expect, test } from '@playwright/test';

test('authorized administrator uses controlled reference workspace with before-after confirmation', async ({ page }, testInfo) => {
  test.skip(!['chromium-390', 'chromium-1366'].includes(testInfo.project.name), 'One mobile and one desktop proof are sufficient.');
  await page.goto('/');
  await expect(page.locator('#loading')).toHaveClass(/hidden/);

  const navigation = page.locator('[data-admin-view="referenceAdmin"]');
  await expect(navigation).toBeVisible();
  await navigation.click();
  await expect(page.locator('#referenceAdmin')).toHaveClass(/active/);
  await expect(page.locator('#referenceAdminWorkspace')).toBeVisible();
  await expect(page.locator('[data-reference-admin-write-state]')).toContainText('Controlled writes enabled');
  await expect(page.locator('[data-reference-admin-results] .request-line').first()).toBeVisible();

  await page.locator('[name="referenceAdminSearch"]').fill('assembly');
  await expect(page.locator('[data-reference-admin-results]')).toContainText('Synthetic Assembly Room');
  await page.locator('[data-reference-admin-edit]').first().click();
  const form = page.locator('#referenceAdminChangeForm');
  await expect(form).toBeVisible();
  await form.locator('[name="displayName"]').fill('Synthetic Assembly Room Revised');
  await form.locator('[type="submit"]').click();

  await expect(page.getByRole('heading', { name: 'Confirm administrative change' })).toBeVisible();
  await expect(page.locator('.comparison-grid')).toContainText('Synthetic Assembly Room');
  await expect(page.locator('.comparison-grid')).toContainText('Synthetic Assembly Room Revised');
  await page.locator('[data-reference-admin-confirm]').click();
  await expect(page.locator('#modalBackdrop')).not.toHaveClass(/show/);
  await expect(page.locator('[data-reference-admin-results]')).toContainText('Synthetic Assembly Room Revised');
});

test('read-only roster ownership and second-review routing are visible', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-390', 'One mobile policy proof is sufficient.');
  await page.goto('/');
  await expect(page.locator('#loading')).toHaveClass(/hidden/);
  await page.locator('[data-admin-view="referenceAdmin"]').click();
  await page.locator('[name="referenceAdminDomain"]').selectOption('PEOPLE_MEMBERSHIPS');
  await expect(page.locator('[data-reference-admin-add]')).toBeHidden();
  await expect(page.locator('[data-reference-admin-results]')).toContainText('Read only');
  await page.locator('[name="referenceAdminDomain"]').selectOption('ROUTING');
  await expect(page.locator('[data-reference-admin-pending]')).toContainText('No pending second-review changes');
  await page.locator('[data-reference-admin-edit]').first().click();
  await page.locator('#referenceAdminChangeForm [name="responsibleOfficeId"]').fill('SYN-OFFICE-REVIEWED');
  await page.locator('#referenceAdminChangeForm [type="submit"]').click();
  await expect(page.getByRole('heading', { name: 'Confirm administrative change' })).toBeVisible();
  await expect(page.locator('#modal .mode-note')).toContainText('Separate review required');
  await page.locator('[data-reference-admin-confirm]').click();
  await expect(page.locator('[data-reference-admin-pending]')).toContainText('Different administrator required');
  await expect(page.locator('[data-reference-admin-review]')).toHaveCount(0);
});

test('distinct administrator receives an actionable before-after review', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-1366', 'One desktop review proof is sufficient.');
  await page.goto('/');
  await expect(page.locator('#loading')).toHaveClass(/hidden/);
  await page.evaluate(() => {
    const key = 'hau-usc-logistics-prototype:v1.0.0';
    const state = JSON.parse(localStorage.getItem(key));
    state.referenceAdminChanges = [{
      changeId: 'PREVIEW-CHANGE-SECOND-REVIEW',
      domain: 'ROUTING',
      action: 'UPDATE',
      targetId: 'RTE-VENUE-001',
      expectedRevision: 1,
      risk: 'CROSS_OFFICE_ROUTING',
      requestedAt: '2026-07-16T10:00:00+08:00',
      requestedBy: 'SYN-ADMIN-OTHER',
      reviewStatus: 'PENDING_REVIEW',
      before: { id: 'RTE-VENUE-001', revision: 1, payload: { responsibleOfficeId: 'OFFICE-A' } },
      after: { id: 'RTE-VENUE-001', revision: 2, payload: { responsibleOfficeId: 'OFFICE-B' } },
      changedFields: ['responsibleOfficeId'],
    }];
    localStorage.setItem(key, JSON.stringify(state));
  });
  await page.reload();
  await expect(page.locator('#loading')).toHaveClass(/hidden/);
  await page.locator('[data-admin-view="referenceAdmin"]').click();
  await page.locator('[name="referenceAdminDomain"]').selectOption('ROUTING');
  await expect(page.locator('[data-reference-admin-review][data-reference-admin-decision="APPROVE"]')).toBeVisible();
  await page.locator('[data-reference-admin-review][data-reference-admin-decision="APPROVE"]').click();
  await expect(page.getByRole('heading', { name: 'Approve administrative change' })).toBeVisible();
  await expect(page.locator('#modal .comparison-grid')).toContainText('OFFICE-A');
  await expect(page.locator('#modal .comparison-grid')).toContainText('OFFICE-B');
  await expect(page.locator('#referenceAdminReviewForm [name="reason"]')).toBeVisible();
});
