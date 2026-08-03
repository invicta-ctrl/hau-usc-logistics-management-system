import { expect, test } from '@playwright/test';
import { navigateToAdminView } from './navigation.js';

test('reference administration stays within the 320 px viewport', async ({ page }, testInfo) => {
  test.skip(
    testInfo.project.name !== 'chromium-320',
    'The smallest supported viewport is the regression target.',
  );
  await page.goto('/');
  await expect(page.locator('#loading')).toHaveClass(/hidden/);
  await navigateToAdminView(page, 'referenceAdmin');
  await expect(page.locator('#referenceAdmin')).toHaveClass(/active/);
  const hero = page.locator('#referenceAdminWorkspace > .hero');
  await expect(hero).not.toHaveClass(/\bpanel\b/);
  const heroPresentation = await hero.evaluate((element) => ({
    backgroundImage: getComputedStyle(element).backgroundImage,
    headingColor: getComputedStyle(element.querySelector('h2')).color,
  }));
  expect(heroPresentation.backgroundImage).toContain('linear-gradient');
  expect(heroPresentation.headingColor).toBe('rgb(255, 255, 255)');
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth),
    )
    .toBeLessThanOrEqual(1);
});

test('authorized administrator uses controlled reference workspace with before-after confirmation', async ({
  page,
}, testInfo) => {
  test.skip(
    !['chromium-390', 'chromium-1366'].includes(testInfo.project.name),
    'One mobile and one desktop proof are sufficient.',
  );
  await page.goto('/');
  await expect(page.locator('#loading')).toHaveClass(/hidden/);

  await navigateToAdminView(page, 'referenceAdmin');
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
  await expect(page.locator('[data-reference-admin-results]')).toContainText(
    'Synthetic Assembly Room Revised',
  );
});

test('administrator control desk exposes only existing governed domains', async ({ page }, testInfo) => {
  test.skip(
    testInfo.project.name !== 'chromium-390',
    'One practical mobile control-desk proof is sufficient.',
  );
  await page.goto('/');
  await expect(page.locator('#loading')).toHaveClass(/hidden/);
  await navigateToAdminView(page, 'referenceAdmin');
  await expect(page.getByRole('heading', { name: 'Governed control areas' })).toBeVisible();
  await expect(page.locator('.admin-governance-note')).toContainText('does not grant access');

  await page.getByRole('button', { name: /Access Management/ }).click();
  await expect(page.locator('[name="referenceAdminDomain"]')).toHaveValue('PERMISSIONS');
  await expect(page.getByRole('button', { name: /Access Management/ })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
  await expect(page.locator('[data-access-management]')).toBeVisible();
  await expect(page.locator('[data-access-results] .access-account-row')).toHaveCount(1);
  await expect(page.locator('[data-access-results]')).toContainText('Administrator');

  await page.getByRole('button', { name: /Audit & System/ }).click();
  await expect(page.locator('[name="referenceAdminDomain"]')).toHaveValue('SYNC_HEALTH');
  await expect(page.locator('[data-reference-admin-add]')).toBeHidden();
  await expect(page.locator('[data-reference-admin-results]')).toContainText('Read only');
});

test('advanced Access Management previews bounded workspace and scope policy', async ({
  page,
}, testInfo) => {
  test.skip(
    !['chromium-390', 'chromium-1366'].includes(testInfo.project.name),
    'One mobile and one desktop effective-access proof are sufficient.',
  );
  await page.goto('/');
  await expect(page.locator('#loading')).toHaveClass(/hidden/);
  await navigateToAdminView(page, 'referenceAdmin');
  await page.getByRole('button', { name: /Access Management/ }).click();
  const accountRow = page.locator('[data-access-results] .access-account-row').first();
  const accessId = (await accountRow.locator('strong').first().textContent()).trim();
  await expect(accountRow.getByRole('button', { name: 'Disable' })).toBeVisible();
  await expect(accountRow.getByRole('button', { name: 'Archive' })).toBeVisible();
  await expect(accountRow.getByRole('button', { name: /delete/i })).toHaveCount(0);
  await accountRow.getByRole('button', { name: 'Edit access' }).click();

  const form = page.locator('#accessPolicyForm');
  await expect(form).toBeVisible();
  await expect(form.getByLabel('Access preset')).toBeVisible();
  await expect(form.getByText('Authorized workspaces')).toBeVisible();
  await expect(form.getByText('Committee scopes')).toBeVisible();
  await expect(form.getByText('Location scopes')).toBeVisible();
  await expect(form.getByText('Event-series scopes')).toBeVisible();
  await expect(form.getByText('Sub-event scopes')).toBeVisible();
  await expect(form.locator('.access-advanced-settings')).not.toHaveAttribute('open', /.*/u);

  await form.getByLabel('Access preset').selectOption('MATERIALS_OPERATOR');
  await expect(form.getByLabel('Role')).toHaveValue('DOL_STAFF');
  await expect(form.getByLabel('Default workspace')).toHaveValue('materials');
  await expect(form.locator('[name="workspaceIds"][value="materials"]')).toBeChecked();
  await expect(form.locator('[name="committeeIds"][value="COM_MATERIALS"]')).toBeChecked();
  await form.getByLabel('Confirm current Access ID').fill(accessId);
  await form.getByLabel('Reason').fill('Preview the bounded Materials operator assignment.');
  await form.getByRole('button', { name: 'Preview effective access' }).click();

  await expect(page.getByRole('heading', { name: 'Confirm effective access' })).toBeVisible();
  const preview = page.locator('.access-effective-preview');
  await expect(preview).toContainText('MATERIALS_OPERATOR');
  await expect(preview).toContainText('materials');
  await expect(preview).toContainText('COM_MATERIALS');
  await expect(page.locator('#modal')).toContainText('All active sessions will be revoked');
  await expect(page.getByRole('button', { name: 'Save policy and revoke sessions' })).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth))
    .toBeLessThanOrEqual(1);
});

test('advanced account creation exposes governed identity and credential controls', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-390', 'One mobile creation-form proof is sufficient.');
  await page.goto('/');
  await expect(page.locator('#loading')).toHaveClass(/hidden/);
  await navigateToAdminView(page, 'referenceAdmin');
  await page.getByRole('button', { name: /Access Management/ }).click();
  await page.getByRole('button', { name: 'Create account' }).click();

  const form = page.locator('#accessAccountCreateForm');
  await expect(form).toBeVisible();
  await expect(form.getByLabel('Access preset')).toBeVisible();
  await expect(form.getByLabel('Account status')).toHaveValue('STARTER');
  await expect(form.getByLabel('Temporary credential expiry')).toHaveValue('72');
  await expect(form.getByLabel('Requester is eligible for Office Lending')).toBeVisible();
  await expect(form.locator('.access-advanced-settings')).not.toHaveAttribute('open', /.*/u);
  await form.getByLabel('Generate DOL-YYYY-NNNN Access ID').check();
  await expect(form.getByRole('textbox', { name: 'Access ID', exact: true })).toBeDisabled();
  await form.getByLabel('Access preset').selectOption('FOOD_OPERATOR');
  await expect(form.getByLabel('Role')).toHaveValue('DOL_STAFF');
  await expect(form.getByLabel('Default workspace')).toHaveValue('food');
  await expect(form.locator('[name="committeeIds"][value="COM_FOOD"]')).toBeChecked();
  await expect(form).toContainText('plaintext only once');
});

test('read-only roster ownership and second-review routing are visible', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-390', 'One mobile policy proof is sufficient.');
  await page.goto('/');
  await expect(page.locator('#loading')).toHaveClass(/hidden/);
  await navigateToAdminView(page, 'referenceAdmin');
  await page.locator('[name="referenceAdminDomain"]').selectOption('PEOPLE_MEMBERSHIPS');
  await expect(page.locator('[data-reference-admin-add]')).toBeHidden();
  await expect(page.locator('[data-reference-admin-results]')).toContainText('Read only');
  await page.locator('[name="referenceAdminDomain"]').selectOption('ROUTING');
  await expect(page.locator('[data-reference-admin-pending]')).toContainText(
    'No pending second-review changes',
  );
  await page.locator('[data-reference-admin-edit]').first().click();
  await page.locator('#referenceAdminChangeForm [name="responsibleOfficeId"]').fill('SYN-OFFICE-REVIEWED');
  await page.locator('#referenceAdminChangeForm [type="submit"]').click();
  await expect(page.getByRole('heading', { name: 'Confirm administrative change' })).toBeVisible();
  await expect(page.locator('#modal .mode-note')).toContainText('Separate review required');
  await page.locator('[data-reference-admin-confirm]').click();
  await expect(page.locator('[data-reference-admin-pending]')).toContainText(
    'Different administrator required',
  );
  await expect(page.locator('[data-reference-admin-review]')).toHaveCount(0);
});

test('distinct administrator receives an actionable before-after review', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-1366', 'One desktop review proof is sufficient.');
  await page.goto('/');
  await expect(page.locator('#loading')).toHaveClass(/hidden/);
  await page.evaluate(() => {
    const key = 'hau-usc-logistics-prototype:v1.0.0';
    const state = JSON.parse(localStorage.getItem(key));
    state.referenceAdminChanges = [
      {
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
      },
    ];
    localStorage.setItem(key, JSON.stringify(state));
  });
  await page.reload();
  await expect(page.locator('#loading')).toHaveClass(/hidden/);
  await navigateToAdminView(page, 'referenceAdmin');
  await page.locator('[name="referenceAdminDomain"]').selectOption('ROUTING');
  await expect(
    page.locator('[data-reference-admin-review][data-reference-admin-decision="APPROVE"]'),
  ).toBeVisible();
  await page.locator('[data-reference-admin-review][data-reference-admin-decision="APPROVE"]').click();
  await expect(page.getByRole('heading', { name: 'Approve administrative change' })).toBeVisible();
  await expect(page.locator('#modal .comparison-grid')).toContainText('OFFICE-A');
  await expect(page.locator('#modal .comparison-grid')).toContainText('OFFICE-B');
  await expect(page.locator('#referenceAdminReviewForm [name="reason"]')).toBeVisible();
});
