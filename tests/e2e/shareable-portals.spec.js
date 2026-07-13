import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { expect, test } from '@playwright/test';

const root = resolve(import.meta.dirname, '../..');
const portals = [
  { mode: 'internal', file: 'HAU-USC_Logistics-Main-Hub-Shareable.html', view: 'overview' },
  { mode: 'request', file: 'HAU-USC_Logistics-Request-Center-Shareable.html', view: 'request' },
  { mode: 'lending', file: 'HAU-USC_Logistics-Lending-Hub-Shareable.html', view: 'lending' },
];

for (const portal of portals) {
  test(`${portal.mode} standalone shareable opens its pinned portal without overflow`, async ({ page }) => {
    await page.goto(pathToFileURL(resolve(root, portal.file)).href);
    await expect(page.locator('#loading')).toHaveClass(/hidden/);
    await expect(page.locator('body')).toHaveAttribute('data-portal-mode', portal.mode);
    await expect(page.locator(`#${portal.view}`)).toHaveClass(/active/);
    if (portal.mode === 'internal') {
      await expect(page.locator('#primaryNav')).toBeVisible();
    } else {
      await expect(page.locator('body')).toHaveClass(new RegExp(`${portal.mode}-mode`));
      await expect(page.locator('#primaryNav')).toBeHidden();
    }
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });
}
