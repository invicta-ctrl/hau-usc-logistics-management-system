import { expect, test } from '@playwright/test';

const inspectionRoute = (route) => `/#/__preview/inspect/${route}`;
const isNarrow = (testInfo) => testInfo.project.use.viewport.width <= 640;

async function pageOverflow(page) {
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
}

async function installLendingCatalog(page) {
  await page.route('**/api/public/lending/catalog', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        ok: true,
        uscDepartments: ['Department of Logistics'],
        items: [
          {
            id: 'ITM-U04-CHAIR',
            productId: 'ITM-U04-CHAIR',
            name: 'Folding chair',
            aliases: ['chair'],
            category: 'Furniture',
            type: 'REUSABLE',
            availability: 'AVAILABLE',
            unit: 'piece',
            maximumQuantity: 4,
            defaultLoanDays: 7,
            dueDateRequired: true,
            acknowledgmentRequired: false,
            eligibility: '',
            handlingNotes: '',
            description: 'Borrower-safe folding chair.',
            restrictions: '',
            imageUrl: '',
            conditionTracked: true,
          },
        ],
      }),
    }),
  );
}

test('MFR-002 U04 landing is poster-first at every accepted width', async ({ page }) => {
  let heroChunkRequests = 0;
  page.on('request', (request) => {
    if (/hausc-institutional-logistics-hero\.mp4\.part/u.test(request.url())) heroChunkRequests += 1;
  });
  await page.route('**/api/public/advertisements', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true,"items":[]}' }),
  );

  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Logistics services and records' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Play hero motion' })).toBeVisible();
  await expect(page.locator('.atrium__video')).not.toHaveAttribute('src');
  await page.waitForTimeout(400);
  expect(heroChunkRequests).toBe(0);
  expect(await pageOverflow(page)).toBeLessThanOrEqual(1);
});

test('MFR-002 U04 Public Lending keeps one shell and a recoverable mobile sequence', async ({
  page,
}, testInfo) => {
  await installLendingCatalog(page);
  await page.goto('/#/route/borrow');

  await expect(page.getByRole('heading', { name: 'Lending Center', exact: true })).toBeVisible();
  await expect(page.getByText('Public lending — no account and no sign-in needed')).toBeVisible();
  await expect(page.getByRole('link', { name: 'HAU-USC home', exact: true })).toHaveCount(1);
  await expect(page.locator('.mast')).toHaveCount(0);
  const localNavigation = page.getByRole('navigation', { name: 'Public lending navigation' });
  await expect(localNavigation.getByRole('button')).toHaveCount(3);
  await expect(localNavigation.getByRole('link')).toHaveCount(0);

  await page.getByRole('searchbox', { name: 'Search', exact: true }).fill('chair');
  await page.getByRole('button', { name: 'Request item' }).click();
  const continuation = page.getByRole('complementary', { name: 'Selected borrowing items' });
  if (isNarrow(testInfo)) {
    await expect(continuation).toBeVisible();
    await continuation.getByRole('button', { name: 'Continue' }).click();
    await expect(page.getByRole('heading', { name: 'New borrowing request' })).toBeFocused();
  } else {
    await expect(continuation).toBeHidden();
  }

  await page.getByRole('radio', { name: /Angelite Student/u }).check();
  if (isNarrow(testInfo)) await expect(continuation.getByRole('button', { name: 'Review' })).toBeVisible();
  await expect(page.getByLabel('Availability', { exact: true })).toHaveAccessibleName('Availability');
  expect(await pageOverflow(page)).toBeLessThanOrEqual(1);
});

test('MFR-002 U04 generic staff gateway preserves account and password-manager semantics', async ({
  page,
}) => {
  await page.route('**/api/auth/session', (route) =>
    route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: '{"code":"SESSION_REQUIRED","message":"Sign in to continue."}',
    }),
  );
  await page.goto('/#/route/staff-signin');

  const identifier = page.getByLabel('Identifier');
  const password = page.getByLabel('Password', { exact: true });
  await expect(identifier).toHaveAttribute('autocomplete', 'username');
  await expect(password).toHaveAttribute('autocomplete', 'current-password');
  expect((await page.getByRole('button', { name: 'Sign in', exact: true }).boundingBox()).height).toBeGreaterThanOrEqual(44);

  await page.getByRole('button', { name: 'Apply for staff access' }).click();
  const applyTab = page.getByRole('tab', { name: 'Apply for access' });
  const statusTab = page.getByRole('tab', { name: 'Application status' });
  await applyTab.focus();
  await page.keyboard.press('ArrowRight');
  await expect(statusTab).toBeFocused();
  await expect(statusTab).toHaveAttribute('aria-selected', 'true');
  expect(await pageOverflow(page)).toBeLessThanOrEqual(1);
});

test('MFR-002 U04 requester and Profile previews keep form and card hierarchy at every width', async ({
  page,
}, testInfo) => {
  await page.goto(inspectionRoute('external-request'));
  await page.getByRole('button', { name: 'New request' }).click();
  const requestForm = page.getByRole('form', { name: 'New request' });
  await expect(requestForm).toBeVisible();
  await expect(requestForm.getByLabel('Request type', { exact: true })).toHaveAccessibleName('Request type');
  await expect(requestForm.getByRole('button', { name: 'Submission disabled in preview' })).toBeDisabled();
  const actions = requestForm.locator('.entry-flow__actions');
  expect(await actions.evaluate((element) => getComputedStyle(element).position)).toBe(
    isNarrow(testInfo) ? 'sticky' : 'static',
  );
  expect(await pageOverflow(page)).toBeLessThanOrEqual(1);

  await page.goto(inspectionRoute('profile'));
  await expect(page.getByRole('heading', { name: 'Identity' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Account' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Appearance' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Security & Activity' })).toBeVisible();
  expect(await pageOverflow(page)).toBeLessThanOrEqual(1);
});

test('MFR-002 U04 preserves 200 percent reflow for entry flows', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'frontend-1440', 'One exact 1440 to 720 CSS-pixel zoom simulation.');
  await page.setViewportSize({ width: 720, height: 500 });
  await page.goto('/#/route/staff-signin');

  await expect(page.getByRole('heading', { name: 'Staff sign in' })).toBeVisible();
  expect(await pageOverflow(page)).toBeLessThanOrEqual(1);
});
