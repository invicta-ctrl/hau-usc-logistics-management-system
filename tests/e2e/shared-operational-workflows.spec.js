import { expect, test } from '@playwright/test';
import { navigateToView } from './navigation.js';

const workflowViewport = (testInfo) =>
  ['chromium-390', 'chromium-1366'].includes(testInfo.project.name);

test('Release Desk requires recipient confirmation before an audited partial handoff', async ({ page }, testInfo) => {
  test.skip(!workflowViewport(testInfo), 'One mobile and one desktop workflow proof are sufficient.');
  await page.goto('/');
  await expect(page.locator('#loading')).toHaveClass(/hidden/);
  await navigateToView(page, 'release');

  await page.locator('[data-release-action="event"]').first().click();
  const form = page.locator('#eventReleaseForm');
  await expect(form).toBeVisible();
  const confirmation = form.locator('[name="recipientConfirmed"]');
  await expect(confirmation).toBeVisible();
  await expect(confirmation).not.toBeChecked();
  await expect(confirmation).toHaveAttribute('required', '');
  await expect(form.locator('#releaseUploader input[type="file"]')).toHaveAttribute('accept', 'image/*');
  await expect(form.locator('#releaseUploader input[type="file"]')).toHaveAttribute('capture');

  await form.locator('[name="recipientName"]').fill('Synthetic Recipient');
  await form.locator('[name="recipientRole"]').fill('Committee representative');
  await form.locator('[name="notes"]').fill('Synthetic partial handoff for Gate 6 proof.');
  const lineChecks = form.locator('[name="releaseLine"]');
  for (let index = 1; index < await lineChecks.count(); index += 1) await lineChecks.nth(index).uncheck();
  const quantity = form.locator('input[name^="qty_"]').first();
  const maximum = Number(await quantity.getAttribute('max'));
  if (maximum > 1) await quantity.fill(String(Math.max(1, maximum - 1)));

  await form.getByRole('button', { name: 'Confirm Physical Release' }).click();
  await expect(form).toBeVisible();
  await confirmation.check();
  page.once('dialog', (dialog) => dialog.accept());
  await form.getByRole('button', { name: 'Confirm Physical Release' }).click();
  await expect(form).toBeHidden();
  await expect(page.locator('#releaseHistory')).toContainText('Synthetic Recipient');

  const release = await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem('hau-usc-logistics-prototype:v1.0.0'));
    return state.releaseConfirmations.at(-1);
  });
  expect(release).toMatchObject({
    recipientName: 'Synthetic Recipient',
    recipientConfirmed: true,
  });
  expect(release.confirmationLabel).toMatch(/Release Confirmation/);
  expect(release.lineReleases).toHaveLength(1);
});

test('Canvass Library exposes stale, missing-unit, comparison, and evidence signals', async ({ page }, testInfo) => {
  test.skip(!workflowViewport(testInfo), 'One mobile and one desktop workflow proof are sufficient.');
  await page.goto('/');
  await expect(page.locator('#loading')).toHaveClass(/hidden/);
  await page.evaluate(() => {
    const key = 'hau-usc-logistics-prototype:v1.0.0';
    const state = JSON.parse(localStorage.getItem(key));
    const quote = state.canvassReferences.find((entry) => entry.id === 'CAN-0001');
    quote.checkedAt = '2026-05-01T00:00:00.000Z';
    quote.unit = '';
    quote.sourceUrl = 'https://example.invalid/synthetic-quote';
    localStorage.setItem(key, JSON.stringify(state));
  });
  await page.reload();
  await expect(page.locator('#loading')).toHaveClass(/hidden/);
  await navigateToView(page, 'procurement');
  await page.getByRole('button', { name: 'Canvass Library' }).click();

  const library = page.locator('#canvassLibrary');
  await expect(library.locator('.canvass-quality-indicator:visible').filter({ hasText: 'Stale quote' })).toBeVisible();
  await expect(library.locator('.canvass-quality-indicator:visible').filter({ hasText: 'Missing unit' })).toBeVisible();
  const evidence = library.locator('.canvass-evidence-link:visible').filter({ hasText: 'Open evidence' }).first();
  await expect(evidence).toBeVisible();
  await expect(evidence).toHaveAttribute('target', '_blank');
  await expect(evidence).toHaveAttribute('rel', 'noopener noreferrer');

  await page.locator('#quoteCompareLine').selectOption('RL-0003');
  const comparison = page.locator('#quoteComparison');
  await expect(comparison.getByText('Stale quote')).toBeVisible();
  await expect(comparison.getByText('Missing unit')).toBeVisible();
  await expect(comparison.getByRole('button', { name: 'Select' }).first()).toBeVisible();
});

test('Procurement receiving posts line-level cumulative receipts only after procurement', async ({ page }, testInfo) => {
  test.skip(!workflowViewport(testInfo), 'One mobile and one desktop workflow proof are sufficient.');
  await page.goto('/');
  await expect(page.locator('#loading')).toHaveClass(/hidden/);
  const target = await page.evaluate(() => {
    const key = 'hau-usc-logistics-prototype:v1.0.0';
    const state = JSON.parse(localStorage.getItem(key));
    const deliverable = state.deliverables.find((entry) => entry.requestLineId === 'RL-0006');
    const line = state.requestLines.find((entry) => entry.id === deliverable.requestLineId);
    deliverable.status = 'PROCURED';
    deliverable.procurementStatus = 'PROCURED';
    deliverable.quantityReceived = 0;
    deliverable.eventItemId = '';
    line.status = 'PROCURED';
    line.receivedQuantity = 0;
    line.eventItemId = '';
    localStorage.setItem(key, JSON.stringify(state));
    return { id: deliverable.id, quantity: Number(deliverable.quantity), unit: deliverable.unit };
  });
  await page.reload();
  await expect(page.locator('#loading')).toHaveClass(/hidden/);
  await navigateToView(page, 'procurement');
  await page.getByRole('button', { name: 'Receiving & Auto-Registration' }).click();

  const form = page.locator('#deliverableReceiveForm');
  const select = page.locator('#receiveDeliverable');
  await select.selectOption(target.id);
  const firstReceipt = Math.max(1, Math.floor(target.quantity / 3));
  await expect(form.locator('#deliverableCumulativeSummary')).toContainText(
    `0 received · ${target.quantity} remaining`,
  );
  await form.locator('[name="quantity"]').fill(String(firstReceipt));
  page.once('dialog', (dialog) => dialog.accept());
  await form.getByRole('button', { name: 'Receive & Auto-Register' }).click();
  await expect(page.locator('#receivedEventItems')).toContainText(
    `${firstReceipt} ${target.unit} received`,
  );

  await select.selectOption(target.id);
  const remaining = target.quantity - firstReceipt;
  await expect(form.locator('#deliverableCumulativeSummary')).toContainText(
    `${firstReceipt} received · ${remaining} remaining`,
  );
  await expect(form.locator('[name="quantity"]')).toHaveValue(String(remaining));
  page.once('dialog', (dialog) => dialog.accept());
  await form.getByRole('button', { name: 'Receive & Auto-Register' }).click();

  const persisted = await page.evaluate((deliverableId) => {
    const state = JSON.parse(localStorage.getItem('hau-usc-logistics-prototype:v1.0.0'));
    const deliverable = state.deliverables.find((entry) => entry.id === deliverableId);
    const receipts = state.ledgerTransactions.filter(
      (entry) => entry.type === 'PURCHASE_RECEIPT' && entry.eventItemId === deliverable.eventItemId,
    );
    return { deliverable, receipts };
  }, target.id);
  expect(persisted.deliverable).toMatchObject({
    quantityReceived: target.quantity,
    status: 'READY_TO_RELEASE',
  });
  expect(persisted.receipts).toHaveLength(2);
  expect(persisted.receipts.reduce((sum, entry) => sum + Number(entry.quantity), 0)).toBe(
    target.quantity,
  );
});
