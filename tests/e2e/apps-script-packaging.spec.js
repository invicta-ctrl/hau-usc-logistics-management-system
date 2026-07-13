import { expect, test } from '@playwright/test';
import {
  analyzeAssembledDocument,
  assembleAppsScriptTemplate,
  createAppsScriptBundleFromProject,
} from '../../scripts/apps-script-bundle-lib.mjs';
import { createEmptyBootstrapFixture } from '../fixtures/bootstrap-fixtures.js';

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
  }, createEmptyBootstrapFixture({ backendMode: 'apps-script' }));

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
    `\u25CF Apps Script \u00B7 ${appEnvironment.toLowerCase()}`;

  if (requestOnly) {
    await expect(page.locator('body')).toHaveClass(/request-mode/);
    await expect(page.locator('#primaryNav')).toBeHidden();
    await expect(page.locator('.portal-header')).toBeVisible();
    await expect(page.locator('#syncIndicator')).toHaveCount(0);
    await page.evaluate(() => window.dispatchEvent(new Event('focus')));
    await page.waitForTimeout(50);
    await expect.poll(() => page.evaluate(() => globalThis.__appsScriptApiCalls.length)).toBe(1);
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

test('packaged Apps Script bootstrap recovers with one focused retry and safe diagnostics', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-390', 'One real browser recovery run is sufficient for packaging verification.');
  const files = await createAppsScriptBundleFromProject();
  const assembled = assembleAppsScriptTemplate(files, { requestOnly: false, appEnvironment: 'STAGING' });
  const bootstrap = createEmptyBootstrapFixture({ backendMode: 'apps-script' });

  await page.goto('about:blank');
  await page.evaluate((fixture) => {
    globalThis.__appsScriptApiCalls = [];
    globalThis.__maxConcurrentBootstrapCalls = 0;
    globalThis.__activeBootstrapCalls = 0;
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
          globalThis.__activeBootstrapCalls += 1;
          globalThis.__maxConcurrentBootstrapCalls = Math.max(
            globalThis.__maxConcurrentBootstrapCalls,
            globalThis.__activeBootstrapCalls,
          );
          queueMicrotask(() => {
            globalThis.__activeBootstrapCalls -= 1;
            if (globalThis.__appsScriptApiCalls.length === 1) failureHandler(new Error('SENSITIVE_BOOTSTRAP_CANARY'));
            else successHandler({ ok: true, data: fixture });
          });
        };
      },
    });
    globalThis.google = { script: { run: runner } };
  }, bootstrap);
  await page.setContent(assembled, { waitUntil: 'load' });

  await expect.poll(() => page.evaluate(() => globalThis.__appsScriptApiCalls.length)).toBe(1);
  await expect(page.locator('#loading')).not.toHaveClass(/hidden/);
  await expect(page.locator('#loading')).toHaveAttribute('data-state', 'error');
  await expect(page.locator('#loading')).toHaveAttribute('role', 'alert');
  await expect(page.locator('#loading')).toHaveAttribute('aria-live', 'assertive');
  await expect(page.locator('#loadingRetry')).toBeVisible();
  await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe('loadingRetry');
  const failureText = await page.locator('#loading').innerText();
  expect(failureText).not.toContain('SENSITIVE_BOOTSTRAP_CANARY');
  expect(failureText).toContain('Support code:');

  await page.locator('#loadingRetry').evaluate((button) => {
    button.click();
    button.click();
  });
  await expect.poll(() => page.evaluate(() => globalThis.__appsScriptApiCalls.length)).toBe(2);
  await expect(page.locator('#loading')).toHaveClass(/hidden/);
  expect(await page.evaluate(() => globalThis.__maxConcurrentBootstrapCalls)).toBe(1);
  expect(await page.evaluate(() => globalThis.__appsScriptApiCalls.map((call) => call.method))).toEqual([
    'api_getBootstrapData',
    'api_getBootstrapData',
  ]);
});

test('packaged Apps Script bootstrap rejects an unsupported response without exposing raw values', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-390', 'One real browser contract run is sufficient for packaging verification.');
  const files = await createAppsScriptBundleFromProject();
  const assembled = assembleAppsScriptTemplate(files, { requestOnly: false, appEnvironment: 'STAGING' });
  const invalidBootstrap = { ...createEmptyBootstrapFixture({ backendMode: 'apps-script' }), version: 'UNSUPPORTED-VERSION' };

  await page.goto('about:blank');
  await page.evaluate((fixture) => {
    globalThis.__appsScriptApiCalls = [];
    let successHandler = () => {};
    let runner;
    const target = {
      withSuccessHandler(handler) { successHandler = handler; return runner; },
      withFailureHandler() { return runner; },
    };
    runner = new Proxy(target, {
      get(object, property) {
        if (property in object) return object[property];
        if (typeof property === 'symbol') return undefined;
        return (payload) => {
          globalThis.__appsScriptApiCalls.push({ method: String(property), payload });
          queueMicrotask(() => successHandler({ ok: true, data: fixture }));
        };
      },
    });
    globalThis.google = { script: { run: runner } };
  }, invalidBootstrap);
  await page.setContent(assembled, { waitUntil: 'load' });

  await expect.poll(() => page.evaluate(() => globalThis.__appsScriptApiCalls.length)).toBe(1);
  await expect(page.locator('#loading')).toHaveAttribute('data-state', 'error');
  await expect(page.locator('#loadingRetry')).toBeVisible();
  const failureText = await page.locator('#loading').innerText();
  expect(failureText).not.toContain('UNSUPPORTED-VERSION');
});

test('packaged Apps Script bootstrap shows the slow state without a duplicate call', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'chromium-390', 'One real browser slow-state run is sufficient for packaging verification.');
  const files = await createAppsScriptBundleFromProject();
  const assembled = assembleAppsScriptTemplate(files, { requestOnly: false, appEnvironment: 'STAGING' });
  const bootstrap = createEmptyBootstrapFixture({ backendMode: 'apps-script' });

  await page.goto('about:blank');
  await page.evaluate(() => {
    globalThis.__appsScriptApiCalls = [];
    let successHandler = () => {};
    let runner;
    const target = {
      withSuccessHandler(handler) { successHandler = handler; return runner; },
      withFailureHandler() { return runner; },
    };
    runner = new Proxy(target, {
      get(object, property) {
        if (property in object) return object[property];
        if (typeof property === 'symbol') return undefined;
        return () => {
          globalThis.__appsScriptApiCalls.push(String(property));
          globalThis.__resolveSlowBootstrap = (fixture) => successHandler({ ok: true, data: fixture });
        };
      },
    });
    globalThis.google = { script: { run: runner } };
  });
  await page.setContent(assembled, { waitUntil: 'load' });

  await expect(page.locator('#loading')).toHaveAttribute('data-state', 'slow', { timeout: 10_000 });
  expect(await page.evaluate(() => globalThis.__appsScriptApiCalls.length)).toBe(1);
  await page.evaluate((fixture) => globalThis.__resolveSlowBootstrap(fixture), bootstrap);
  await expect(page.locator('#loading')).toHaveClass(/hidden/);
  expect(await page.evaluate(() => globalThis.__appsScriptApiCalls.length)).toBe(1);
});

for (const stage of [
  'RESPONSE_VALIDATION',
  'NORMALIZATION',
  'STATIC_OPTIONS',
  'EXTENSIONS',
  'BINDINGS',
  'FIRST_RENDER',
  'POST_RENDER',
]) {
  test(`packaged bootstrap contains ${stage} failure`, async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'chromium-390', 'One real browser stage-boundary run is sufficient for packaging verification.');
    const files = await createAppsScriptBundleFromProject();
    const assembled = assembleAppsScriptTemplate(files, { requestOnly: false, appEnvironment: 'STAGING' });
    const bootstrap = createEmptyBootstrapFixture({ backendMode: 'apps-script' });
    await page.goto('about:blank');
    await page.evaluate(({ fixture, failureStage }) => {
      globalThis.__HAU_BOOTSTRAP_TEST_MODE__ = true;
      globalThis.__HAU_BOOTSTRAP_STAGE_HOOK__ = (currentStage) => {
        if (currentStage === failureStage) throw new Error('SENSITIVE_STAGE_CANARY');
      };
      globalThis.__appsScriptApiCalls = [];
      let successHandler = () => {};
      let runner;
      const target = {
        withSuccessHandler(handler) { successHandler = handler; return runner; },
        withFailureHandler() { return runner; },
      };
      runner = new Proxy(target, {
        get(object, property) {
          if (property in object) return object[property];
          if (typeof property === 'symbol') return undefined;
          return (payload) => {
            globalThis.__appsScriptApiCalls.push({ method: String(property), payload });
            queueMicrotask(() => successHandler({ ok: true, data: fixture }));
          };
        },
      });
      globalThis.google = { script: { run: runner } };
    }, { fixture: bootstrap, failureStage: stage });
    await page.setContent(assembled, { waitUntil: 'load' });

    await expect.poll(() => page.evaluate(() => globalThis.__appsScriptApiCalls.length)).toBe(1);
    await expect(page.locator('#loading')).toHaveAttribute('data-state', 'error');
    await expect(page.locator('#loadingRetry')).toBeVisible();
    const failureText = await page.locator('#loading').innerText();
    expect(failureText).not.toContain('SENSITIVE_STAGE_CANARY');
  });
}
