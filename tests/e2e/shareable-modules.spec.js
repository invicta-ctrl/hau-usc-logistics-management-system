import { expect, test } from '@playwright/test';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { shareableModules } from '../../scripts/shareable-module-registry.mjs';

test('every generated module shareable opens offline in its named workspace', async ({ page }, testInfo) => {
  test.skip(
    testInfo.project.name !== 'chromium-390',
    'One real browser is sufficient for offline packaging proof.',
  );

  for (const module of shareableModules) {
    const url = pathToFileURL(resolve('shareable-html-modules', module.filename)).href;
    await page.goto(url);
    await expect(page.locator('#loading')).toHaveClass(/hidden/);
    await expect(page).toHaveTitle(`HAU-USC Logistics - ${module.title}`);
    await expect(page.locator('body')).toHaveAttribute('data-default-view', module.id);
    await expect(page.locator(`#primaryNav [data-view="${module.id}"]`)).toHaveClass(/active/);
    await expect(page.locator(`section#${module.id}`)).toHaveClass(/active/);
    await expect(page.locator('#pageTitle')).toHaveText(module.title);
    await expect(page.locator('#primaryNav [data-view].active')).toHaveCount(1);
    await expect(page.locator('section.view.active')).toHaveCount(1);
  }
});
