import { expect, test } from '@playwright/test';

const FAMILIES = [
  'HAU_INSTITUTIONAL',
  'ANGELITE_IVORY',
  'MIDNIGHT_LEDGER',
  'EMERALD_OPERATIONS',
  'COBALT_SIGNAL',
  'GRAPHITE_COPPER',
];

function installPlaygroundCapability(page) {
  return page.route('**/api/version', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ ok: true, playground: true, correlationId: 'p25-theme-a11y' }),
    }),
  );
}

async function openThemedRoute(page, { family, mode, colorScheme = 'light', hash = '' }) {
  if (page.url() === 'about:blank') await page.goto('/');
  await page.emulateMedia({ colorScheme, reducedMotion: 'reduce' });
  await page.evaluate(
    () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
  );
  await page.evaluate(
    ({ nextFamily, nextMode }) => {
      localStorage.setItem('hau-usc-theme-family', nextFamily);
      localStorage.setItem('hau-usc-theme', nextMode.toLowerCase());
    },
    { nextFamily: family, nextMode: mode },
  );
  await page.reload();
  if (new URL(page.url()).hash !== hash) await page.goto(`/${hash}`);
  await expect(page.getByRole('main').first()).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-theme-family', family);
  if (mode === 'DARK' || (mode === 'SYSTEM' && colorScheme === 'dark')) {
    await expect(page.locator('html')).toHaveClass(/\bdark\b/u);
  } else {
    await expect(page.locator('html')).not.toHaveClass(/\bdark\b/u);
  }
}

async function runtimeAudit(page) {
  return page.evaluate(() => {
    const visible = (element) => {
      const style = getComputedStyle(element);
      const rect = element.getBoundingClientRect();
      return style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0;
    };
    const elements = [...document.querySelectorAll('main *, aside *, nav *')].filter(visible);
    const effectRows = elements
      .filter((element) => element.closest('tr,[role="row"]'))
      .filter((element) => {
        const style = getComputedStyle(element);
        const backdrop = style.backdropFilter || style.webkitBackdropFilter || 'none';
        return backdrop !== 'none' || style.animationName !== 'none';
      })
      .map((element) => `${element.tagName.toLowerCase()}.${element.className}`);
    const blurred = elements.filter((element) => {
      const style = getComputedStyle(element);
      return (style.backdropFilter || style.webkitBackdropFilter || 'none') !== 'none';
    });
    const root = getComputedStyle(document.documentElement);
    return {
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
      blurredElements: blurred.length,
      effectRows,
      tokens: [
        'page',
        'nav',
        'nav-text',
        'surface',
        'table',
        'input',
        'success',
        'warning',
        'danger',
        'focus',
      ].map((name) => root.getPropertyValue(`--theme-${name}`).trim()),
    };
  });
}

test('P25 keeps default HAU Light/Dark and representative alternate palettes responsive at every accepted width', async ({ page }) => {
  test.setTimeout(120_000);
  await installPlaygroundCapability(page);
  const appearances = [
    { family: 'HAU_INSTITUTIONAL', mode: 'LIGHT', colorScheme: 'light' },
    { family: 'HAU_INSTITUTIONAL', mode: 'DARK', colorScheme: 'light' },
    { family: 'ANGELITE_IVORY', mode: 'LIGHT', colorScheme: 'dark' },
    { family: 'MIDNIGHT_LEDGER', mode: 'DARK', colorScheme: 'light' },
  ];

  for (const appearance of appearances) {
    await openThemedRoute(page, appearance);
    const audit = await runtimeAudit(page);
    expect(audit.overflow, `${appearance.family} ${appearance.mode}: horizontal overflow`).toBeLessThanOrEqual(1);
    expect(audit.tokens, `${appearance.family} ${appearance.mode}: resolved semantic tokens`).not.toContain('');
    expect(audit.effectRows, `${appearance.family} ${appearance.mode}: no row-level blur or animation`).toEqual([]);
    expect(audit.blurredElements, `${appearance.family} ${appearance.mode}: bounded glass layers`).toBeLessThanOrEqual(12);
  }
});

test('P25 spot-checks every family in Light, Dark, and System at 390 and 1440', async ({ page }, testInfo) => {
  test.skip(!['frontend-390', 'frontend-1440'].includes(testInfo.project.name), 'P25 exact inspection widths only.');
  test.setTimeout(120_000);
  await installPlaygroundCapability(page);

  let sequence = 0;
  for (const family of FAMILIES) {
    for (const mode of ['LIGHT', 'DARK', 'SYSTEM']) {
      const colorScheme = mode === 'SYSTEM' && sequence % 2 ? 'dark' : 'light';
      sequence += 1;
      await openThemedRoute(page, { family, mode, colorScheme, hash: '#/route/staff-signin' });
      await expect(page.getByRole('heading', { level: 1, name: /Staff sign in|Sign in to continue/u })).toBeVisible();
      await expect(page.getByRole('textbox', { name: 'Identifier' })).toBeVisible();
      await expect(page.getByLabel('Password', { exact: true })).toBeVisible();
      expect((await runtimeAudit(page)).overflow, `${family} ${mode}: horizontal overflow`).toBeLessThanOrEqual(1);
    }
  }
});

test('P25 preserves keyboard focus, the mobile navigation dialog, form controls, and bounded effects', async ({ page }, testInfo) => {
  test.skip(!['frontend-390', 'frontend-1440'].includes(testInfo.project.name), 'P25 exact inspection widths only.');
  test.setTimeout(90_000);
  await installPlaygroundCapability(page);
  await openThemedRoute(page, {
    family: 'GRAPHITE_COPPER',
    mode: 'SYSTEM',
    colorScheme: 'dark',
  });

  await page.keyboard.press('Tab');
  const focusedTag = await page.evaluate(() => document.activeElement?.tagName ?? '');
  expect(['A', 'BUTTON', 'INPUT', 'SELECT', 'TEXTAREA', 'MAIN']).toContain(focusedTag);

  if (testInfo.project.name === 'frontend-390') {
    const opener = page.getByRole('button', { name: 'Open navigation menu' });
    await opener.click();
    const dialog = page.getByRole('dialog', { name: 'Navigation menu' });
    await expect(dialog).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toHaveCount(0);
    await expect(opener).toBeFocused();
  } else {
    const themeToggle = page.getByRole('button', { name: 'Switch to light theme' }).first();
    await themeToggle.focus();
    await expect(themeToggle).toBeFocused();
  }

  await openThemedRoute(page, {
    family: 'GRAPHITE_COPPER',
    mode: 'SYSTEM',
    colorScheme: 'dark',
    hash: '#/route/staff-signin',
  });
  await expect(page.getByRole('textbox', { name: 'Identifier' })).toBeVisible();
  await expect(page.getByLabel('Password', { exact: true })).toBeVisible();

  const audit = await runtimeAudit(page);
  expect(audit.effectRows).toEqual([]);
  expect(audit.blurredElements).toBeLessThanOrEqual(12);
});
