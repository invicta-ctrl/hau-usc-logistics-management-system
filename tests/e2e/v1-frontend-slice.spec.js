import { expect, test } from '@playwright/test';

const onlyFocusedViewport = (testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-390', 'The bounded V1 interaction proof runs once at the practical mobile viewport.');
};

test('request and lending portals stay isolated and lending returns a receipt without history', async ({ page }, testInfo) => {
  onlyFocusedViewport(testInfo);

  await page.goto('/?request=1');
  await expect(page.locator('#loading')).toHaveClass(/hidden/);
  await expect(page.locator('body')).toHaveAttribute('data-portal-mode', 'request');
  await expect(page.locator('.sidebar')).toBeHidden();
  await page.locator('#requestItemInput').fill('ballpen');
  const requestSuggestion = page.locator('#requestAutocomplete [role="option"]').first();
  await expect(requestSuggestion).toContainText('Availability protected');
  await expect(requestSuggestion).not.toContainText('Main Cabinet');
  await expect(requestSuggestion).not.toContainText(/\b\d+(?:\.\d+)?\s+piece\b/);
  await page.locator('#requestItemInput').fill('extension cord');
  await page.locator('[data-item-suggestion="ITM-0003"]').click();
  await expect(page.locator('#requestReturnWrap')).toBeVisible();

  await page.goto('/?lending=1');
  await expect(page.locator('#loading')).toHaveClass(/hidden/);
  await expect(page.locator('body')).toHaveAttribute('data-portal-mode', 'lending');
  await expect(page.locator('body')).toHaveClass(/lending-mode/);
  await expect(page.locator('.portal-header')).toContainText('Lending Hub');
  await expect(page.locator('.sidebar')).toBeHidden();
  await expect(page.locator('#request')).toBeHidden();
  await expect(page.locator('#lending')).toBeVisible();
  await expect(page.locator('#lending > .grid-2 > article').nth(1)).toBeHidden();
  await expect(page.locator('#lending > article.section-gap')).toBeHidden();
  await expect(page.locator('#publicLendingGuidance')).toContainText('Student ID alone cannot retrieve');

  const form = page.locator('#lendingForm');
  await form.locator('[name="borrowerType"]').selectOption('USC_STAFF');
  await page.locator('#lendingItemSearch').fill('extension cord');
  const lendingSuggestion = page.locator('[data-lending-item="ITM-0003"]');
  await expect(lendingSuggestion).toContainText('Availability is confirmed by DOL');
  await expect(lendingSuggestion).not.toContainText(/\b\d+(?:\.\d+)?\s+piece\s+available/);
  await lendingSuggestion.click();
  await form.locator('[name="studentIdNumber"]').fill('2026-54321');
  await form.locator('[name="borrowerName"]').fill('Portal Borrower');
  await form.locator('[name="department"]').fill('Student Organization');
  await form.locator('[name="purpose"]').fill('Portal receipt verification');
  await form.getByRole('button', { name: 'Create For Review Ticket' }).click();
  await expect(page.locator('#modalTitle')).toHaveText('Lending request received');
  await expect(page.locator('#lendingReceipt .receipt-id')).toContainText('LND-');
  await expect(page.locator('#lendingReceipt')).toContainText('No public ticket history is provided');
  await expect(page.locator('#lendingTickets')).toBeHidden();
});

test('internal request review consolidates duplicates and consumes the restock queue fallback', async ({ page }, testInfo) => {
  onlyFocusedViewport(testInfo);
  await page.goto('/');
  await expect(page.locator('#loading')).toHaveClass(/hidden/);
  await page.locator('#primaryNav [data-view="request"]').click();
  await expect(page.locator('#requestReviewQueue')).toBeVisible();
  await expect(page.locator('[data-review-count]')).toHaveText('1 awaiting review');

  for (const quantity of ['1', '2']) {
    await page.locator('#requestItemInput').fill('ballpen');
    await expect(page.locator('#requestAutocomplete [role="option"]').first()).toBeVisible();
    await page.locator('#requestItemInput').press('ArrowDown');
    await page.locator('#requestItemInput').press('Enter');
    await page.locator('#requestQty').fill(quantity);
    await page.locator('#addRequestLine').click();
  }
  await expect(page.locator('#draftLineCount')).toHaveText('1 line');
  await expect(page.locator('#requestLines')).toContainText('3 piece');
  await expect(page.locator('#toast')).toContainText('Duplicate request consolidated');

  await page.locator('[data-review-decision="ACCEPT"]').first().click();
  await expect(page.locator('#modalTitle')).toContainText('Accept');
  await page.getByRole('button', { name: 'Accept and Route Request' }).click();
  await expect(page.locator('#modalBackdrop')).not.toHaveClass(/show/);
  await expect(page.locator('[data-review-count]')).toHaveText('0 awaiting review');

  await page.evaluate(() => {
    const key = 'hau-usc-logistics-prototype:v1.0.0';
    const state = JSON.parse(localStorage.getItem(key));
    state.restockQueue = state.restockRequests;
    delete state.restockRequests;
    localStorage.setItem(key, JSON.stringify(state));
  });
  await page.reload();
  await expect(page.locator('#loading')).toHaveClass(/hidden/);
  await page.locator('#primaryNav [data-view="restocking"]').click();
  await expect(page.locator('#restockRequestCount')).toContainText('2 requests');
});

test('release and return controls require reasons and expose due dates and condition quantities', async ({ page }, testInfo) => {
  onlyFocusedViewport(testInfo);
  await page.goto('/');
  await expect(page.locator('#loading')).toHaveClass(/hidden/);
  await page.locator('#primaryNav [data-view="release"]').click();
  await expect(page.locator('#releaseTickets')).toContainText('Return due');

  await page.getByRole('button', { name: 'Open Ticket' }).first().click();
  const releaseForm = page.locator('#eventReleaseForm');
  const quantity = releaseForm.locator('input[name^="qty_"]').first();
  await quantity.fill('0.5');
  await expect(releaseForm.locator('[name="notes"]')).toHaveAttribute('required', '');
  await expect(releaseForm.locator('#partialReleaseHelp')).toContainText('Required');
  await page.keyboard.press('Escape');

  await page.locator('#primaryNav [data-view="lending"]').click();
  await page.locator('[data-loan-tab="ON_LOAN"]').click();
  await page.getByRole('button', { name: 'Confirm Return' }).first().click();
  const returnForm = page.locator('#returnForm');
  await expect(returnForm.locator('[name="returnedQuantity"]')).toBeVisible();
  await expect(returnForm.locator('[name="damagedBeyondUseQuantity"]')).toBeVisible();
  await expect(returnForm.locator('[name="lostQuantity"]')).toBeVisible();
  await expect(returnForm.locator('[name="returnEvidence"]')).toBeVisible();
  await returnForm.locator('[name="returnedQuantity"]').fill('0.5');
  await expect(returnForm.locator('[name="partialReason"]')).toHaveAttribute('required', '');
  await returnForm.locator('[name="lostQuantity"]').fill('0.25');
  await expect(returnForm.locator('[name="damageNotes"]')).toHaveAttribute('required', '');
  await expect(returnForm.locator('[name="returnEvidence"]')).toHaveAttribute('required', '');
});

test('roadmap, release notes, admin hooks, and accessibility affordances render coherently', async ({ page }, testInfo) => {
  onlyFocusedViewport(testInfo);
  await page.goto('/');
  await expect(page.locator('#loading')).toHaveClass(/hidden/);
  await expect(page.locator('#roadmap .milestone')).toHaveCount(8);
  const expectedPhases = [
    'Foundation',
    'Inventory and Requests',
    'Lending and Release',
    'Procurement and Evidence',
    'Public Portals',
    'Admin Console',
    'Production V1',
    'Future Hosted Platform',
  ];
  await expect(page.locator('#roadmap .milestone h4')).toHaveText(expectedPhases);
  await expect(page.locator('#roadmapOverall')).not.toContainText('NaN');
  await expect(page.locator('#whatChangedPanel')).toBeVisible();
  await expect(page.locator('#whatChanged .what-changed-card')).toHaveCount(3);

  await page.keyboard.press('Tab');
  await expect(page.locator('.skip-link')).toBeFocused();
  await expect(page.locator('#releaseSearch')).toHaveAttribute('aria-label', /Search/);
  const miniHeight = await page.locator('.mini').first().evaluate((element) => Number.parseFloat(getComputedStyle(element).minHeight));
  expect(miniHeight).toBeGreaterThanOrEqual(44);

  await page.locator('#primaryNav [data-view="admin"]').click();
  await expect(page.locator('#admin')).toHaveClass(/active/);
  await expect(page.locator('#adminDashboardBody')).toContainText('Sanitized System Health');
  await expect(page.locator('[data-admin-form="user"]')).toBeVisible();
  await expect(page.locator('[data-admin-form="event"]')).toBeVisible();
  await expect(page.locator('[data-admin-form="content"]')).toBeVisible();
  await expect(page.locator('[data-admin-form="branding"]')).toBeVisible();
});
