import { expect, test } from '@playwright/test';

const releaseIdentity = {
  ok: true,
  environment: 'STAGING',
  appVersion: '0.7.2',
  releaseVersion: '0.7.2',
  candidateSha: 'a'.repeat(40),
};

const requesterOptions = {
  requesterTypes: ['HAU office / department'],
  eventSeries: [
    {
      id: 'SER-SYNTHETIC',
      name: 'Synthetic Event Series',
    },
  ],
  events: [
    {
      id: 'EVT-SYNTHETIC',
      seriesId: 'SER-SYNTHETIC',
      name: 'Synthetic Sub-event',
      venue: 'Synthetic Hall',
      startAt: '2026-08-10T08:00:00.000Z',
      endAt: '2026-08-10T17:00:00.000Z',
    },
  ],
  stockAreas: ['Office Inventory'],
  categories: ['Other'],
  items: [],
  references: [],
};

const lendingCatalog = {
  uscDepartments: ['Department of Logistics'],
  items: [
    {
      id: 'ITM-LEND-SYNTHETIC',
      name: 'Synthetic Projector',
      category: 'Equipment',
      unit: 'piece',
      type: 'REUSABLE',
      availability: 'AVAILABLE',
      maximumQuantity: 2,
      defaultLoanDays: 7,
      productId: 'ITM-LEND-SYNTHETIC',
      aliases: ['presentation projector'],
      dueDateRequired: true,
      acknowledgmentRequired: true,
      conditionTracked: true,
    },
  ],
  process: ['Submit for review.', 'Wait for pickup instructions.'],
};

test.beforeEach(async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-390', 'One mobile browser covers this focused UI slice.');
  await page.addInitScript(() => {
    globalThis.__HAU_RUNTIME_CONFIG__ = { backendMode: 'rest', httpApiBaseUrl: '' };
  });
  await page.route('**/api/version', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(releaseIdentity),
    }),
  );
});

test('public requester exposes two purpose choices, submits the purpose, and surfaces server errors', async ({
  page,
}) => {
  await page.goto('/portals');
  await page.evaluate(async (options) => {
    document.body.innerHTML = '<div id="publicRequesterTestRoot"></div>';
    globalThis.__publicRequestCalls = [];
    globalThis.__publicRequestAttempts = 0;
    const { mountPublicRequesterPortal } = await import('/visual/public-requester-portal.js');
    await mountPublicRequesterPortal({
      root: document.querySelector('#publicRequesterTestRoot'),
      client: {
        async request(path, init = {}) {
          if (path === '/api/public/request/options') return options;
          if (path !== '/api/public/request') throw new Error(`Unexpected request: ${path}`);
          globalThis.__publicRequestCalls.push(JSON.parse(JSON.stringify(init.body)));
          globalThis.__publicRequestAttempts += 1;
          if (globalThis.__publicRequestAttempts === 1) {
            throw new Error('Synthetic server validation message.');
          }
          return {
            requestId: 'REQ-SYNTHETIC-PUBLIC',
            trackingCode: 'TRACK-SYNTHETIC-REQUEST',
          };
        },
      },
    });
  }, requesterOptions);

  const form = page.locator('#publicRequestForm');
  const choices = await form.locator('[name="requestPurpose"]').evaluateAll((nodes) =>
    nodes.map((node) => ({
      value: node.value,
      label: node.closest('label')?.querySelector('strong')?.textContent,
    })),
  );
  expect(choices).toEqual([
    { value: 'EVENT_ACTIVITY_SUPPORT', label: 'Event or activity support' },
    { value: 'OFFICE_INVENTORY_PANTRY', label: 'Office inventory or pantry' },
  ]);

  await form.getByLabel('Office inventory or pantry').check({ force: true });
  await expect(form.locator('[data-event-context]')).toHaveAttribute('hidden', '');
  await expect(form.locator('[name="eventSeriesId"]')).toBeDisabled();
  await expect(form.locator('[data-restock-context]')).not.toHaveAttribute('hidden', '');
  await form.getByRole('button', { name: 'Continue' }).click();

  await form.getByLabel('Full name').fill('Synthetic Office Requester');
  await form.getByLabel('Requester type').selectOption('HAU office / department');
  await form.getByLabel('Organization / department / office').fill('Synthetic Office');
  await form.getByLabel('Contact number').fill('+63 917 000 0100');
  await form.getByLabel('Email address').fill('requester@example.invalid');
  await form.getByRole('button', { name: 'Continue' }).click();

  await form.getByLabel('Inventory / pantry area').selectOption('Office Inventory');
  await form.getByLabel('Needed date').fill('2026-08-20');
  await form.locator('[name="restockPurpose"]').fill('Synthetic pantry replenishment.');
  await form.getByRole('button', { name: 'Continue' }).click();

  await form.getByLabel('Description').fill('Synthetic pantry pack');
  await form.getByLabel('Quantity').fill('1.5');
  await form.getByLabel('Unit').fill('pack');
  await form.getByRole('button', { name: 'Add to requested items' }).click();
  await expect(form.locator('[data-request-message]')).toContainText(
    'Quantity must be a whole number of at least 1.',
  );
  await expect(form.locator('[data-line-count]')).toHaveText('0 items');
  await form.getByLabel('Quantity').fill('2');
  await form.getByRole('button', { name: 'Add to requested items' }).click();
  await expect(form.locator('[data-line-count]')).toHaveText('1 item');
  await form.getByRole('button', { name: 'Continue' }).click();

  await expect(
    form.locator('[data-step="5"]').getByText('Office inventory or pantry', { exact: true }),
  ).toBeVisible();
  await form.getByLabel('Review acknowledgment').check();
  await form.getByLabel('Privacy acknowledgment').check();
  await form.getByLabel('Acceptable Use acknowledgment').check();
  await form.getByLabel('Evidence and photo acknowledgment').check();
  const submit = form.getByRole('button', { name: 'Submit request for review' });
  await submit.click();
  await expect(form.locator('[data-request-message]')).toContainText('Synthetic server validation message.');
  await expect(submit).toBeEnabled();
  await submit.click();
  await expect(page.locator('.public-tracking-receipt')).toContainText('REQ-SYNTHETIC-PUBLIC');

  const calls = await page.evaluate(() => globalThis.__publicRequestCalls);
  expect(calls).toHaveLength(2);
  expect(calls.at(-1)).toMatchObject({
    requestPurpose: 'OFFICE_INVENTORY_PANTRY',
    requestType: 'CATALOG_RESTOCK',
    stockArea: 'Office Inventory',
    purpose: 'Synthetic pantry replenishment.',
    lines: [
      {
        category: 'Other',
        description: 'Synthetic pantry pack',
        quantity: 2,
        unit: 'pack',
      },
    ],
  });
  expect(calls.at(-1)).not.toHaveProperty('eventSeriesId');
  expect(calls.at(-1)).not.toHaveProperty('eventId');
  expect(calls.at(-1)).not.toHaveProperty('location');
  expect(calls.at(-1)).not.toHaveProperty('startDate');
  expect(calls.at(-1)).not.toHaveProperty('endDate');
});

test('public lending receipt supports private tracking without rendering borrower PII', async ({ page }) => {
  await page.goto('/portals');
  await page.evaluate(async (catalog) => {
    document.body.innerHTML = '<div id="publicLendingTestRoot"></div>';
    globalThis.__publicLendingCalls = [];
    const { mountPublicLendingPortal } = await import('/visual/public-lending-portal.js');
    await mountPublicLendingPortal({
      root: document.querySelector('#publicLendingTestRoot'),
      client: {
        async request(path, init = {}) {
          if (path === '/api/public/lending/catalog') return catalog;
          if (path === '/api/public/advertisements') return { items: [] };
          if (path === '/api/public/lending') {
            globalThis.__publicLendingCalls.push(JSON.parse(JSON.stringify(init.body)));
            return {
              submissionId: 'LBR-SYNTHETIC-PUBLIC',
              trackingCode: 'TRACK-SYNTHETIC-PRIVATE',
              status: 'FOR_REVIEW',
            };
          }
          if (path === '/api/public/lending/track') {
            globalThis.__publicLendingTrackBody = JSON.parse(JSON.stringify(init.body));
            return {
              submission: {
                id: 'LBR-SYNTHETIC-PUBLIC',
                status: 'FOR_REVIEW',
                updatedAt: '2026-08-03T04:00:00.000Z',
                borrowerName: 'Private Borrower Name',
                email: 'private-borrower@example.invalid',
                studentId: '87654321',
                contactNumber: '+63 917 999 9999',
                lines: [{ itemName: 'Synthetic Projector', quantity: 1, status: 'FOR_REVIEW' }],
              },
            };
          }
          throw new Error(`Unexpected request: ${path}`);
        },
      },
    });
  }, lendingCatalog);

  const portal = page.locator('.public-lending-portal');
  await portal.getByRole('button', { name: 'Request item' }).click();
  const form = portal.locator('#publicLendingForm');
  await form.getByLabel('Angelite Student').check();
  await form.getByLabel('Full name').fill('Synthetic Angelite Borrower');
  await form.getByLabel('Student ID').fill('12345678');
  await form.getByLabel('Course and year').fill('BSIT 2');
  await form.getByLabel('College, school, or academic department').fill('School of Computing');
  await form.getByLabel('Contact number').fill('+63 917 000 0010');
  await form.getByLabel('Email address').fill('borrower@example.invalid');
  await form.getByLabel('Requested pickup date').fill('2026-08-20');
  await form.getByLabel('Requested due date').fill('2026-08-27');
  await form.getByLabel('Purpose').fill('Synthetic public lending proof.');
  await form.getByLabel('Responsibility acknowledgment').check();
  await form.getByLabel('Privacy acknowledgment').check();
  await form.getByLabel('Acceptable Use acknowledgment').check();
  await form.getByLabel('Borrower responsibility').check();
  await form.getByLabel('Evidence and photo acknowledgment').check();
  await form.getByRole('button', { name: 'Submit borrowing request for review' }).click();

  const receipt = page.locator('.public-tracking-receipt');
  await expect(receipt).toContainText('LBR-SYNTHETIC-PUBLIC');
  await expect(receipt).toContainText('TRACK-SYNTHETIC-PRIVATE');
  await expect(receipt).toContainText('private password manager or secure note');
  await expect(receipt).toContainText('do not paste it into email, chat, or a public form');
  await receipt.getByRole('button', { name: 'Track this request' }).click();

  const trackForm = portal.locator('#publicLendingTrackForm');
  await expect(trackForm.getByLabel('Submission ID')).toHaveValue('LBR-SYNTHETIC-PUBLIC');
  await expect(trackForm.getByLabel('Private tracking code')).toBeFocused();
  await expect(trackForm.getByLabel('Private tracking code')).toHaveValue('');
  await trackForm.getByLabel('Private tracking code').fill('TRACK-SYNTHETIC-PRIVATE');
  await trackForm.getByRole('button', { name: 'Check borrowing status' }).click();

  expect(await page.evaluate(() => globalThis.__publicLendingTrackBody)).toEqual({
    submissionId: 'LBR-SYNTHETIC-PUBLIC',
    trackingCode: 'TRACK-SYNTHETIC-PRIVATE',
  });
  await expect(trackForm.getByLabel('Private tracking code')).toHaveValue('');
  const result = portal.locator('[data-lending-track-result]');
  await expect(result).toContainText('LBR-SYNTHETIC-PUBLIC');
  await expect(result).toContainText('Synthetic Projector');
  await expect(result).not.toContainText('Private Borrower Name');
  await expect(result).not.toContainText('private-borrower@example.invalid');
  await expect(result).not.toContainText('87654321');
  await expect(result).not.toContainText('+63 917 999 9999');
});

test('announcement carousel offers explicit motion control without live auto-rotation announcements', async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/portals');
  await page.evaluate(async () => {
    document.body.innerHTML =
      '<button id="outsideCarousel">Outside carousel</button><div id="carouselRoot"></div>';
    const { mountPublicAdvertisementCarousel } = await import('/visual/public-advertisement-carousel.js');
    globalThis.__carousel = mountPublicAdvertisementCarousel({
      root: document.querySelector('#carouselRoot'),
      advertisements: [
        {
          id: 'ADV-ONE',
          title: 'Synthetic announcement one',
          description: 'First governed announcement.',
          altText: 'Synthetic announcement artwork one.',
          imageUrl: '/brand/default-item-image',
        },
        {
          id: 'ADV-TWO',
          title: 'Synthetic announcement two',
          description: 'Second governed announcement.',
          altText: 'Synthetic announcement artwork two.',
          imageUrl: '/brand/default-item-image',
        },
      ],
      intervalMs: 80,
    });
  });

  const carousel = page.locator('#carouselRoot');
  const stage = carousel.locator('[data-announcement-stage]');
  const toggle = carousel.locator('[data-announcement-toggle]');
  await expect(carousel.locator('.public-announcements')).toHaveClass(/reduced-motion/u);
  await expect(toggle).toHaveText('Resume');
  await expect(toggle).toHaveAccessibleName('Resume automatic announcements');
  await expect(toggle).toHaveAttribute('aria-pressed', 'true');
  await expect(stage).not.toHaveAttribute('aria-live', /.+/u);
  await expect(stage).toContainText('Synthetic announcement one');
  await page.waitForTimeout(180);
  await expect(stage).toContainText('Synthetic announcement one');

  await carousel.getByRole('button', { name: 'Next announcement' }).click();
  await expect(stage).toContainText('Synthetic announcement two');
  const activeIndicator = carousel.locator('[data-announcement-index="1"]');
  await activeIndicator.focus();
  await activeIndicator.press('ArrowRight');
  await expect(stage).toContainText('Synthetic announcement one');
  await expect(carousel.locator('[data-announcement-index="0"]')).toBeFocused();

  await toggle.click();
  await expect(toggle).toHaveText('Pause');
  await expect(toggle).toHaveAccessibleName('Pause automatic announcements');
  await expect(toggle).toHaveAttribute('aria-pressed', 'false');
  await page.locator('#outsideCarousel').focus();
  await carousel.locator('.public-announcements').dispatchEvent('mouseleave');
  await expect
    .poll(() => stage.locator('h3').textContent(), { timeout: 1000, intervals: [20] })
    .toBe('Synthetic announcement two');

  for (const name of ['Previous announcement', 'Pause automatic announcements', 'Next announcement']) {
    const box = await carousel.getByRole('button', { name }).boundingBox();
    expect(box?.height).toBeGreaterThanOrEqual(40);
  }
});
