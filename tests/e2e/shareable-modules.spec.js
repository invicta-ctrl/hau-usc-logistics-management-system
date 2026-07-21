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

test('guided demo walks through offline modules with accessible controls', async ({ page }, testInfo) => {
  test.skip(
    !['chromium-390', 'chromium-1366'].includes(testInfo.project.name),
    'Phone and desktop browsers are sufficient for offline demo proof.',
  );

  await page.goto(pathToFileURL(resolve('hau-usc-logistics-guided-demo.html')).href);
  await expect(page.locator('#loading')).toHaveClass(/hidden/);
  await expect(page).toHaveTitle('HAU-USC Logistics - Guided Demo');
  await page.locator('#demoGuideLauncher').click();
  await expect(page.locator('#demoGuide')).toBeVisible();
  await expect(page.locator('#demoGuideCount')).toHaveText('Step 1 of 7');
  await expect(page.locator('#demoGuideTitle')).toHaveText('Operations Overview');

  await page.locator('#demoGuideOpen').press('Enter');
  await expect(page.locator('#overview')).toHaveClass(/demo-guided-highlight/);

  await page.locator('#demoGuideNext').press('Enter');
  await expect(page.locator('#demoGuideCount')).toHaveText('Step 2 of 7');
  await expect(page.locator('#request')).toHaveClass(/active/);

  await page.locator('#demoGuideNext').click();
  await expect(page.locator('#demoGuideCount')).toHaveText('Step 3 of 7');
  await expect(page.locator('#lending')).toHaveClass(/active/);

  await page.locator('#demoGuideBack').click();
  await expect(page.locator('#demoGuideCount')).toHaveText('Step 2 of 7');
  await expect(page.locator('#request')).toHaveClass(/active/);

  const remainingSteps = [
    ['lending', 'Office Lending Hub'],
    ['release', 'Release Desk'],
    ['restocking', 'Restocking'],
    ['procurement', 'Procurement & Deliverables'],
    ['inventory', 'Inventory Management'],
  ];
  for (const [stepIndex, [moduleId, title]] of remainingSteps.entries()) {
    await page.locator('#demoGuideNext').click();
    await expect(page.locator('#demoGuideCount')).toHaveText(`Step ${stepIndex + 3} of 7`);
    await expect(page.locator('#demoGuideTitle')).toHaveText(title);
    await expect(page.locator(`#${moduleId}`)).toHaveClass(/active/);
    await expect(page.locator(`#${moduleId}`)).toHaveClass(/demo-guided-highlight/);
  }

  await expect(page.locator('#demoGuideNext')).toHaveText('Restart tour');
  await page.locator('#demoGuideNext').click();
  await expect(page.locator('#demoGuideCount')).toHaveText('Step 1 of 7');
  await expect(page.locator('#overview')).toHaveClass(/active/);

  await page.keyboard.press('Escape');
  await expect(page.locator('#demoGuide')).toBeHidden();
  await expect(page.locator('#demoGuideLauncher')).toBeFocused();
});
