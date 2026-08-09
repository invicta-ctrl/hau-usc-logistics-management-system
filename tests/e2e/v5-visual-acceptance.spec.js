import { mkdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';

const evidenceRoot = resolve('output/design/v5-production-acceptance');

test.beforeEach(({ page }, testInfo) => {
  void page;
  test.skip(testInfo.project.name !== 'chromium-390', 'One Chromium worker captures the v5 visual matrix.');
});

async function capture(page, name, { fullPage = true } = {}) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: resolve(evidenceRoot, `${name}.png`), fullPage });
}

async function openProductionView(page, view) {
  const button = page.locator(`#primaryNav [data-view="${view}"], #primaryNav [data-admin-view="${view}"]`);
  await expect(button).toBeEnabled();
  await button.click();
  const viewId = view === 'referenceAdmin' ? 'referenceAdmin' : view;
  await expect(page.locator(`#${viewId}.view.active`)).toBeVisible();
}

async function installSyntheticProfile(page) {
  await page.goto('/portals');
  await page.evaluate(async () => {
    document.body.innerHTML = '<main class="profile-acceptance-host"><div id="accountControls"></div></main>';
    const { createAuthenticatedAccountControlButtons } =
      await import('/visual/authenticated-account-controls.js');
    const profile = {
      accountCode: 'HAU-SYNTHETIC-001',
      username: 'synthetic.reviewer',
      displayName: 'Synthetic Reviewer',
      legalName: 'Synthetic Reviewer',
      verifiedEmail: 'reviewer@example.test',
      contactNumber: '+63 917 000 0001',
      roleId: 'ADMINISTRATOR',
      committeeIds: [],
      affiliation: {
        departmentId: 'USC-DEPT-DOL',
        departmentDisplayName: 'Department of Logistics',
        courseId: 'COURSE-SYNTHETIC',
        yearLevel: 4,
      },
      accessSummary: {
        roleLabel: 'Administrator',
        workspaceIds: ['administrator'],
      },
      avatar: { initials: 'SR' },
      status: 'ACTIVE',
    };
    const client = {
      getProfile: async () => ({ profile }),
      updateProfileContact: async () => ({ profile }),
      changeProfileUsername: async () => ({ profile }),
      changeProfilePassword: async () => ({ ok: true }),
      requestProfileIdentityCorrection: async () => ({ ok: true }),
    };
    const session = {
      csrfToken: 'synthetic-csrf',
      user: { authorization: { capabilities: [] } },
    };
    document
      .querySelector('#accountControls')
      .append(...createAuthenticatedAccountControlButtons({ client, session, onSessionInvalidated() {} }));
  });
  await page.getByRole('button', { name: 'My Profile' }).click();
  await expect(page.getByRole('dialog', { name: 'My Profile' })).toBeVisible();
}

test('captures the v5 public landing and module index in both themes', async ({ page }) => {
  await mkdir(evidenceRoot, { recursive: true });
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto('/portals');
  await expect(page.getByRole('heading', { name: 'Request. Prepare. Release.' })).toBeVisible();
  await capture(page, 'landing-desktop-light');

  await page.getByRole('link', { name: 'Module index' }).first().click();
  await expect(page.getByRole('dialog', { name: 'Find a logistics module' })).toBeVisible();
  await capture(page, 'module-index-desktop-light', { fullPage: false });
  await page.getByRole('button', { name: 'Close module index' }).click();

  await page.getByRole('button', { name: 'Switch to dark mode' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await capture(page, 'landing-desktop-dark');
});

test('captures real v5 operational and administration surfaces', async ({ page }) => {
  await mkdir(evidenceRoot, { recursive: true });
  await page.setViewportSize({ width: 1440, height: 960 });
  await page.goto('/admin');
  await expect(page.locator('.app-shell.shell')).toBeVisible();
  await capture(page, 'overview-desktop-light');

  for (const view of ['request', 'lending', 'release', 'inventory', 'referenceAdmin']) {
    await openProductionView(page, view);
    await capture(page, `${view === 'referenceAdmin' ? 'accounts-access' : view}-desktop-light`);
  }

  await page.getByRole('button', { name: 'Switch to dark mode' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await openProductionView(page, 'overview');
  await capture(page, 'overview-desktop-dark');
});

test('captures the v5 profile on desktop and mobile', async ({ page }) => {
  await mkdir(evidenceRoot, { recursive: true });
  await page.setViewportSize({ width: 1440, height: 960 });
  await installSyntheticProfile(page);
  await capture(page, 'profile-desktop-light', { fullPage: false });

  await page.setViewportSize({ width: 390, height: 844 });
  await capture(page, 'profile-mobile-light', { fullPage: false });
});

test('captures the v5 landing and index on mobile', async ({ page }) => {
  await mkdir(evidenceRoot, { recursive: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/portals');
  await expect(page.getByRole('heading', { name: 'Request. Prepare. Release.' })).toBeVisible();
  await capture(page, 'landing-mobile-light');
  await page.getByRole('link', { name: 'Module index' }).first().click();
  await expect(page.getByRole('dialog', { name: 'Find a logistics module' })).toBeVisible();
  await capture(page, 'module-index-mobile-light', { fullPage: false });
});
