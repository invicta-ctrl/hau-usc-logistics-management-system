import { expect, test } from '@playwright/test';
import {
  analyzeAssembledDocument,
  assembleAppsScriptTemplate,
  createAppsScriptBundleFromProject,
} from '../../scripts/apps-script-bundle-lib.mjs';

const emptyBootstrap = {
  eventSeries: [], events: [], requests: [], requestLines: [], inventoryItems: [], reservations: [],
  ledgerTransactions: [], restockRequests: [], restockRecords: [], lendingTickets: [],
  releaseConfirmations: [], deliverables: [], canvassReferences: [], evidenceFiles: [],
  roadmapMilestones: [], statusHistory: [], auditLog: [], transferMappings: [], users: [],
};

for (const appEnvironment of ['STAGING', 'PRODUCTION']) {
for (const requestOnly of [false, true]) {
test(`assembled ${appEnvironment.toLowerCase()} Apps Script document executes one ${requestOnly ? 'request-only' : 'internal'} bootstrap without visible JavaScript`, async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-390', 'One real browser parse is sufficient for packaging verification.');
  const files = await createAppsScriptBundleFromProject();
  const assembled = assembleAppsScriptTemplate(files, {
    requestOnly,
    appEnvironment,
  });
  const analysis = analyzeAssembledDocument(assembled);
  expect(analysis.scriptCount).toBe(1);
  expect(analysis.styleCount).toBe(1);
  expect(analysis.suspiciousVisibleJavaScriptTokenCount).toBe(0);

  await page.goto('about:blank');
  await page.evaluate((bootstrap) => {
    globalThis.__appsScriptApiCalls = [];
    let successHandler = () => {};
    let failureHandler = () => {};
    let runner;
    const target = {
      withSuccessHandler(handler) { successHandler = handler; return runner; },
      withFailureHandler(handler) { failureHandler = handler; return runner; },
    };
    runner = new Proxy(target, {
      get(object, property) {
        if (property in object) return object[property];
        if (typeof property === 'symbol') return undefined;
        return (payload) => {
          globalThis.__appsScriptApiCalls.push({ method: String(property), payload });
          queueMicrotask(() => {
            if (property === 'api_getBootstrapData') successHandler({ ok: true, data: bootstrap });
            else failureHandler(new Error(`Unexpected Apps Script call: ${String(property)}`));
          });
        };
      },
    });
    globalThis.google = { script: { run: runner } };
  }, emptyBootstrap);

  await page.setContent(assembled, { waitUntil: 'load' });
  await expect.poll(() => page.evaluate(() => globalThis.__appsScriptApiCalls.length)).toBe(1);
  await expect(page.locator('#loading')).toHaveClass(/hidden/);
  expect(await page.evaluate(() => globalThis.__appsScriptApiCalls)).toEqual([
    { method: 'api_getBootstrapData', payload: { requestOnly } },
  ]);
  await expect(page.locator('body')).toHaveAttribute(
    'data-request-only',
    String(requestOnly),
  );
  await expect(page.locator('body')).toHaveAttribute(
    'data-app-environment',
    appEnvironment,
  );

  const resetDemo = page.locator('#resetDemo');
  await expect(resetDemo).toBeHidden();
  await expect(resetDemo).toBeDisabled();
  await expect(resetDemo).toHaveAttribute('tabindex', '-1');
  await expect(resetDemo).toHaveAttribute('aria-hidden', 'true');

  const expectedEnvironmentLabel =
    `● Apps Script · ${appEnvironment.toLowerCase()}`;

  if (requestOnly) {
    await expect(page.locator('body')).toHaveClass(/request-mode/);
    await expect(page.locator('#primaryNav')).toBeHidden();
    await expect(page.locator('.portal-header')).toBeVisible();
    await expect(
      page.locator('.portal-header .preview-badge'),
    ).toHaveText(expectedEnvironmentLabel);
  } else {
    await expect(
      page.locator('.app-header .preview-badge'),
    ).toHaveText(expectedEnvironmentLabel);
  }
  const visibleText = await page.locator('body').innerText();
  expect(visibleText).not.toContain('api_getBootstrapData');
  expect(visibleText).not.toContain('__HAU_RUNTIME_CONFIG__');
  expect(visibleText).not.toContain('Preview mode · local data');
  expect(visibleText).not.toContain('Reset Demo Data');
});
}
}
