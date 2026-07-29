import { expect, test } from '@playwright/test';
import { navigateToView } from './navigation.js';

test('restock review authorizes and receives exactly one linked line', async ({ page }, testInfo) => {
  test.skip(
    !['chromium-390', 'chromium-1366'].includes(testInfo.project.name),
    'One mobile and one desktop workflow proof are sufficient.',
  );
  await page.goto('/');
  await expect(page.locator('#loading')).toHaveClass(/hidden/);
  await navigateToView(page, 'restocking');
  await expect(page.locator('#restocking')).toHaveClass(/active/);

  const queue = page.locator('#restockRequestsTable');
  await expect(queue).toContainText('RRQ-RL-RST-0001');
  await expect(queue.locator('[data-restock-action]:not([data-restock-action="details"])')).toHaveCount(0);

  const targetReview = queue.locator(
    'button[data-restock-id="RRQ-RL-RST-0001"]:visible',
  );
  await targetReview.click();
  await expect(page.getByRole('heading', { name: 'RRQ-RL-RST-0001' })).toBeVisible();
  await expect(page.locator('#drawer')).toContainText('revision 3');
  await expect(page.locator('#drawer')).toContainText('Preferred quote');
  await page.locator('#drawer [data-restock-detail-action="AUTHORIZE_PROCUREMENT"]').click();

  const transition = page.locator('#restockTransitionForm');
  await expect(transition).toBeVisible();
  await transition.locator('[name="reason"]').fill('Synthetic budget authorization for line-isolation proof.');
  await transition.getByRole('button', { name: 'Confirm Authorize procurement' }).click();
  await expect(queue).toContainText('To Be Procured');

  await targetReview.click();
  await page.locator('#drawer [data-restock-detail-action="RECEIVE"]').click();
  const receipt = page.locator('#restockReceiveForm');
  await expect(receipt.locator('[name="requestLineId"]')).toHaveValue('RL-RST-0001');
  await expect(receipt.locator('[name="expectedRevision"]')).toHaveValue('4');
  await receipt.locator('[name="quantity"]').fill('48');
  page.once('dialog', (dialog) => dialog.accept());
  await receipt.getByRole('button', { name: 'Confirm Line Receiving' }).click();
  await expect(queue).toContainText('Restocked');

  const persisted = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('hau-usc-logistics-prototype:v1.0.0')),
  );
  expect(persisted.requestLines.find((line) => line.id === 'RL-RST-0001')).toMatchObject({
    status: 'RESTOCKED',
    receivedQuantity: 48,
    workflowRevision: 5,
  });
  expect(persisted.requestLines.find((line) => line.id === 'RL-RST-0002')).toMatchObject({
    status: 'FOR_REVIEW',
    receivedQuantity: 0,
    workflowRevision: 1,
  });
  expect(
    persisted.ledgerTransactions.filter(
      (transaction) =>
        transaction.type === 'PURCHASE_RECEIPT' && transaction.itemId === 'ITM-0005',
    ),
  ).toHaveLength(1);
});
