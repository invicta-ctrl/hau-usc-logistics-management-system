import { expect, test } from '@playwright/test';

const inspectionRoute = (route) => `/#/__preview/inspect/${route}`;
const isDesktop = (testInfo) => testInfo.project.use.viewport.width >= 1024;

async function pageOverflow(page) {
  return page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
}

test('MFR-002 U03 composes the authenticated shell intentionally at every accepted width', async ({
  page,
}, testInfo) => {
  await page.goto(inspectionRoute('overview'));
  const shell = page.locator('.auth-shell');
  const main = page.locator('#main-content');
  const rail = page.getByRole('complementary', { name: 'Workspace navigation' });
  const dock = page.getByRole('navigation', { name: 'Quick navigation' });

  await expect(shell).toBeVisible();
  await expect(main).toBeVisible();
  await expect(page.getByRole('banner', { name: 'Workspace command bar' })).toBeVisible();
  expect(await pageOverflow(page)).toBeLessThanOrEqual(1);

  if (isDesktop(testInfo)) {
    await expect(rail).toBeVisible();
    await expect(dock).toBeHidden();
    const expectedWidth = testInfo.project.use.viewport.width >= 1280 ? 272 : 76;
    expect(Math.round((await rail.boundingBox()).width)).toBe(expectedWidth);
  } else {
    await expect(rail).toBeHidden();
    await expect(dock).toBeVisible();
    const links = await dock.getByRole('link').all();
    expect(links).toHaveLength(5);
    for (const link of links) {
      const box = await link.boundingBox();
      expect(box.height).toBeGreaterThanOrEqual(44);
    }
  }

  const navigate = page.getByRole('button', { name: 'Open navigation' });
  const profile = page.getByRole('link', { name: /go to profile/u });
  expect((await navigate.boundingBox()).height).toBeGreaterThanOrEqual(44);
  expect((await profile.boundingBox()).height).toBeGreaterThanOrEqual(44);
});

test('MFR-002 U03 moves route focus to the new main context', async ({ page }, testInfo) => {
  await page.goto(inspectionRoute('overview'));

  if (isDesktop(testInfo)) {
    await page
      .getByRole('complementary', { name: 'Workspace navigation' })
      .getByRole('link', { name: 'Inventory' })
      .click();
  } else {
    await page.getByRole('button', { name: 'Open navigation' }).click();
    await page
      .getByRole('dialog', { name: 'Workspace navigation' })
      .getByRole('link', { name: 'Inventory' })
      .click();
  }

  await expect(page).toHaveURL(/#\/__preview\/inspect\/inventory$/u);
  const main = page.locator('#main-content');
  await expect(main).toHaveAttribute('aria-label', 'Inventory');
  await expect(main).toBeFocused();
  expect(await pageOverflow(page)).toBeLessThanOrEqual(1);
});

test('MFR-002 U03 mobile drawer traps focus, isolates background and restores the opener', async ({
  page,
}, testInfo) => {
  test.skip(isDesktop(testInfo), 'Mobile and tablet drawer contract.');
  await page.goto(inspectionRoute('overview'));
  const opener = page.getByRole('button', { name: 'Open navigation' });
  await opener.focus();
  await opener.click();

  const drawer = page.getByRole('dialog', { name: 'Workspace navigation' });
  const close = drawer.getByRole('button', { name: 'Close navigation' });
  await expect(drawer).toBeVisible();
  await expect(close).toBeFocused();
  await expect(page.locator('[data-auth-shell-background]')).toHaveAttribute('aria-hidden', 'true');
  expect(await page.locator('[data-auth-shell-background]').evaluate((node) => node.inert)).toBe(true);
  expect((await drawer.boundingBox()).height).toBeLessThanOrEqual(testInfo.project.use.viewport.height);

  await page.keyboard.press('Escape');
  await expect(drawer).toHaveCount(0);
  await expect(opener).toBeFocused();
  await expect(page.locator('[data-auth-shell-background]')).not.toHaveAttribute('aria-hidden', 'true');
});

test('MFR-002 U03 treats 200 percent zoom as a mobile reflow, not a compressed desktop', async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== 'frontend-1440', 'One exact 1440 to 720 CSS-pixel zoom simulation.');
  await page.setViewportSize({ width: 720, height: 500 });
  await page.goto(inspectionRoute('overview'));

  await expect(page.getByRole('complementary', { name: 'Workspace navigation' })).toBeHidden();
  await expect(page.getByRole('navigation', { name: 'Quick navigation' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Open navigation' })).toBeVisible();
  expect(await pageOverflow(page)).toBeLessThanOrEqual(1);
});
