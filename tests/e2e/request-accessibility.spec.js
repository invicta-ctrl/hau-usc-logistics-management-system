import { test, expect } from '@playwright/test';
import { navigateToView } from './navigation.js';

test('creates a request with keyboard autocomplete', async ({ page }, testInfo) => {
  test.skip(
    testInfo.project.use.viewport.width < 390,
    'Run the full form once at practical mobile and desktop widths.',
  );
  await page.goto('/');
  await expect(page.locator('#loading')).toHaveClass(/hidden/);
  await navigateToView(page, 'request');
  const input = page.locator('#requestItemInput');
  await input.fill('ballpen');
  await expect(page.locator('#requestAutocomplete [role="option"]').first()).toBeVisible();
  await input.press('ArrowDown');
  await input.press('Enter');
  await expect(page.locator('#requestDecision')).toContainText(
    /fulfilled from stock|Partial stock detected|For Canvassing/,
  );
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

test('Phase 2 Request Center preserves event context, routing presentation, and stock on submission', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-390', 'One complete Gate 5 request workflow is sufficient.');
  await page.goto('/');
  await expect(page.locator('#loading')).toHaveClass(/hidden/);
  await navigateToView(page, 'request');

  const form = page.locator('#requestForm');
  await expect(form.locator('[name="requestType"][value="EVENT_LOGISTICS"]')).toBeVisible();
  await expect(form.locator('[name="requestType"][value="CATALOG_RESTOCK"]')).toBeVisible();
  await form.locator('[name="requestType"][value="CATALOG_RESTOCK"]').check({ force: true });
  await expect(page.locator('#catalogRequestFields')).toBeVisible();
  await expect(page.locator('#catalogType')).toContainText('Office Inventory');
  await expect(page.locator('#catalogType')).toContainText('Pantry');
  await form.locator('[name="requestType"][value="EVENT_LOGISTICS"]').check({ force: true });

  const dateRange = form.getByRole('group', { name: 'Event Date Range' });
  await expect(dateRange).toBeVisible();
  await expect(dateRange.locator('input[type="date"]')).toHaveCount(2);

  await page.locator('#requestEventSeries').selectOption('SER-YDD-2026');
  await page.locator('#requestEvent').selectOption('EVT-YDD-COOKING');
  await page.locator('#requestStage').selectOption('ADDITIONAL');
  await expect(page.locator('#originalRequestWrap')).toBeVisible();
  const originalIds = await page
    .locator('#originalRequestId option')
    .evaluateAll((options) => options.map((entry) => entry.value).filter(Boolean));
  expect(originalIds).toContain('LREQ-2026-0102');
  const mismatchedOriginal = await page.evaluate((ids) => {
    const state = JSON.parse(localStorage.getItem('hau-usc-logistics-prototype:v1.0.0'));
    return ids.some((id) => {
      const request = state.requests.find((entry) => entry.id === id);
      return !request || request.eventId !== 'EVT-YDD-COOKING' || request.stage !== 'INITIAL';
    });
  }, originalIds);
  expect(mismatchedOriginal).toBe(false);
  await page.locator('#requestStage').selectOption('INITIAL');

  const search = page.locator('#requestItemInput');
  await search.fill('extension wire');
  await expect(page.locator('#requestAutocomplete [role="option"]').first()).toContainText('Extension Cord');
  await search.press('ArrowDown');
  await search.press('Enter');
  await page.locator('#requestQty').fill('1');
  await expect(page.locator('#requestFulfillment')).toContainText('Issue from Stock');
  await page.locator('#requestQty').fill('9999');
  await expect(page.locator('#requestFulfillment')).toContainText('Split: Stock + Canvassing');
  await page.locator('#requestQty').fill('1');
  await page.locator('#addRequestLine').click();

  const before = await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem('hau-usc-logistics-prototype:v1.0.0'));
    return {
      ledger: state.ledgerTransactions.map(({ id, type, itemId, quantity, direction, relatedId }) => ({
        id,
        type,
        itemId,
        quantity,
        direction,
        relatedId,
      })),
      reservations: state.reservations.map(
        ({ id, itemId, quantity, status, requestLineId, lendingTicketId }) => ({
          id,
          itemId,
          quantity,
          status,
          requestLineId,
          lendingTicketId,
        }),
      ),
    };
  });
  await form.locator('[name="requesterName"]').fill('Gate Five Requester');
  await form.locator('[name="requesterEmail"]').fill('gate5@example.com');
  await form.locator('[name="department"]').fill('Synthetic Department');
  await form.locator('[name="purpose"]').fill('Gate 5 acceptance evidence');
  await page.locator('#requestConsent').check();
  await form.getByRole('button', { name: 'Submit for DOL Review' }).click();
  await expect(page.locator('#drawerTitle')).toHaveText('Request submitted');
  const after = await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem('hau-usc-logistics-prototype:v1.0.0'));
    return {
      ledger: state.ledgerTransactions.map(({ id, type, itemId, quantity, direction, relatedId }) => ({
        id,
        type,
        itemId,
        quantity,
        direction,
        relatedId,
      })),
      reservations: state.reservations.map(
        ({ id, itemId, quantity, status, requestLineId, lendingTicketId }) => ({
          id,
          itemId,
          quantity,
          status,
          requestLineId,
          lendingTicketId,
        }),
      ),
    };
  });
  expect(after).toEqual(before);
});

test('modal traps focus and restores it to the trigger', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('#loading')).toHaveClass(/hidden/);
  await navigateToView(page, 'release');
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
  await navigateToView(page, 'inventory');
  const ledger = page.locator('.mobile-cards [data-inventory-action="history"]').first();
  await ledger.click();
  await expect(page.locator('#drawer[role="dialog"]')).toBeVisible();
  await expect(page.locator('#drawerTitle')).toContainText(/ITM-/);
});
