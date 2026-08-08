/* Purposeful-motion and transition-lifecycle acceptance for the v4 export. */

import { mkdirSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { dirname, resolve } from 'node:path';

const { chromium } = await import(
  process.env.PLAYWRIGHT_PATH ? pathToFileURL(resolve(process.env.PLAYWRIGHT_PATH)).href : 'playwright'
);

const [previewArg, resultArg] = process.argv.slice(2);
const preview = resolve(previewArg);
const resultFile = resolve(resultArg ?? 'motion-results.json');
mkdirSync(dirname(resultFile), { recursive: true });

const url = pathToFileURL(preview).href;
const browser = await chromium.launch();
const results = [];

async function run(name, fn) {
  try {
    const evidence = await fn();
    results.push({ name, pass: true, evidence });
  } catch (error) {
    results.push({ name, pass: false, error: String(error?.stack ?? error) });
  }
}

const assert = (condition, message) => {
  if (!condition) throw new Error(message);
};

async function selectSurface(page, id) {
  await page.selectOption('#surface-picker', id);
  await page.waitForFunction((expected) => document.querySelector('#surface-picker')?.value === expected, id);
  await page.waitForTimeout(380);
}

async function newPage(options = {}) {
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, ...options });
  const page = await context.newPage();
  const errors = [];
  page.on('console', (message) => message.type() === 'error' && errors.push(message.text()));
  page.on('pageerror', (error) => errors.push(String(error)));
  await page.goto(url);
  await page.waitForTimeout(460);
  return { context, page, errors };
}

await run('route registry is visible', async () => {
  const { context, page, errors } = await newPage();
  const evidence = await page.evaluate(() => ({
    surfaces: [...document.querySelectorAll('#surface-picker option')].filter((option) => option.value !== 'index').length,
    title: document.title,
  }));
  assert(evidence.surfaces === 33, `Expected 33 surfaces, found ${evidence.surfaces}`);
  assert(errors.length === 0, `Console errors: ${errors.join(' | ')}`);
  await context.close();
  return evidence;
});

await run('desktop rail semantics are truthful', async () => {
  const { context, page } = await newPage();
  await selectSurface(page, 'admin.overview');
  const before = await page.getAttribute('[data-act="toggle-rail"]', 'aria-expanded');
  await page.click('[data-act="toggle-rail"]');
  await page.waitForTimeout(320);
  const after = await page.evaluate(() => ({
    expanded: document.querySelector('[data-act="toggle-rail"]')?.getAttribute('aria-expanded'),
    rail: document.querySelector('.shell')?.dataset.rail,
    drawer: document.querySelector('.shell')?.dataset.drawer,
  }));
  assert(before === 'true', `Expanded desktop rail reported ${before}`);
  assert(after.expanded === 'false' && after.rail === 'collapsed' && after.drawer === 'closed', JSON.stringify(after));
  await context.close();
  return { before, after };
});

await run('mobile drawer semantics and request detail work', async () => {
  const context = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await context.newPage();
  await page.goto(url);
  await selectSurface(page, 'admin.overview');
  const before = await page.getAttribute('[data-act="toggle-rail"]', 'aria-expanded');
  await page.click('[data-act="toggle-rail"]');
  await page.waitForTimeout(320);
  const open = await page.evaluate(() => ({
    expanded: document.querySelector('[data-act="toggle-rail"]')?.getAttribute('aria-expanded'),
    drawer: document.querySelector('.shell')?.dataset.drawer,
  }));
  assert(before === 'false' && open.expanded === 'true' && open.drawer === 'open', JSON.stringify({ before, open }));
  await page.keyboard.press('Escape');
  await selectSurface(page, 'request.queue');
  await page.click('[data-act="select:request"]');
  await page.waitForSelector('[data-overlay-root] .drawer');
  const detailTitle = await page.textContent('[data-overlay-root] .detail__title h2');
  assert(detailTitle?.includes('Sound system'), `Unexpected detail: ${detailTitle}`);
  await context.close();
  return { before, open, detailTitle };
});

await run('command palette filters, focuses, navigates, and restores', async () => {
  const { context, page, errors } = await newPage();
  await selectSurface(page, 'admin.overview');
  await page.click('.searchpill');
  await page.waitForSelector('#command-dialog');
  const opened = await page.evaluate(() => ({
    active: document.activeElement?.id,
    workspaceInert: document.querySelector('.workspace')?.inert,
    previewInert: document.querySelector('.preview-bar')?.inert,
    options: document.querySelectorAll('.cmdk__item').length,
  }));
  assert(opened.active === 'command-input', JSON.stringify(opened));
  assert(opened.workspaceInert && opened.previewInert, JSON.stringify(opened));
  await page.fill('#command-input', 'inventory');
  await page.waitForTimeout(80);
  const filtered = await page.locator('.cmdk__item').count();
  assert(filtered >= 1, 'No inventory command results');
  await page.keyboard.press('Enter');
  await page.waitForTimeout(420);
  const selected = await page.inputValue('#surface-picker');
  assert(selected.startsWith('inventory.'), `Command opened ${selected}`);
  assert(errors.length === 0, `Console errors: ${errors.join(' | ')}`);
  await context.close();
  return { opened, filtered, selected };
});

await run('confirmation overlay traps meaningful focus and restores it', async () => {
  const { context, page } = await newPage();
  await selectSurface(page, 'request.queue');
  await page.click('[data-act="confirm-accept"]');
  await page.waitForSelector('[data-overlay-root]');
  const opened = await page.evaluate(() => ({
    active: document.activeElement?.dataset.act,
    workspaceInert: document.querySelector('.workspace')?.inert,
    open: !!document.querySelector('[data-overlay-root]'),
  }));
  assert(opened.open && opened.active === 'confirm-done' && opened.workspaceInert, JSON.stringify(opened));
  await page.keyboard.press('Tab');
  const tabInside = await page.evaluate(() => !!document.activeElement?.closest('[data-overlay-root]'));
  assert(tabInside, 'Tab escaped the overlay');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(340);
  const closed = await page.evaluate(() => ({
    open: !!document.querySelector('[data-overlay-root]'),
    restored: document.activeElement?.dataset.act,
  }));
  assert(!closed.open && closed.restored === 'confirm-accept', JSON.stringify(closed));
  await context.close();
  return { opened, tabInside, closed };
});

await run('form values survive theme and overlay rerenders', async () => {
  const { context, page } = await newPage();
  await selectSurface(page, 'account.profile');
  const input = page.locator('#surface-main input').first();
  await input.fill('Preserved local draft');
  await page.click('.theme-toggle');
  await page.waitForTimeout(380);
  const afterTheme = await page.locator('#surface-main input').first().inputValue();
  await page.click('.searchpill');
  await page.waitForTimeout(320);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(320);
  const afterOverlay = await page.locator('#surface-main input').first().inputValue();
  assert(afterTheme === 'Preserved local draft' && afterOverlay === afterTheme, JSON.stringify({ afterTheme, afterOverlay }));
  await context.close();
  return { afterTheme, afterOverlay };
});

await run('route animation is scoped and all animation is finite', async () => {
  const { context, page, errors } = await newPage();
  await selectSurface(page, 'admin.overview');
  const routeRun = await page.getAttribute('.route-progress', 'data-run');
  await page.click('.theme-toggle');
  await page.waitForTimeout(720);
  const afterTheme = await page.evaluate(() => ({
    routeRun: document.querySelector('.route-progress')?.dataset.run,
    transitionState: document.documentElement.dataset.transition ?? null,
    infinite: document.getAnimations({ subtree: true }).filter((animation) => animation.effect?.getTiming().iterations === Infinity).length,
  }));
  assert(routeRun === 'true', `Route change reported data-run=${routeRun}`);
  assert(afterTheme.routeRun === 'false', JSON.stringify(afterTheme));
  assert(afterTheme.transitionState === null && afterTheme.infinite === 0, JSON.stringify(afterTheme));
  await page.selectOption('#state-picker', 'loading');
  await page.waitForTimeout(820);
  const loadingInfinite = await page.evaluate(() =>
    document.getAnimations({ subtree: true }).filter((animation) => animation.effect?.getTiming().iterations === Infinity).length,
  );
  assert(loadingInfinite === 0, `Loading has ${loadingInfinite} infinite animations`);
  assert(errors.length === 0, `Console errors: ${errors.join(' | ')}`);
  await context.close();
  return { routeRun, afterTheme, loadingInfinite };
});

await run('browser history restores prior routes', async () => {
  const { context, page } = await newPage();
  await selectSurface(page, 'admin.overview');
  await selectSurface(page, 'inventory.catalog');
  await page.goBack();
  await page.waitForFunction(() => document.querySelector('#surface-picker')?.value === 'admin.overview');
  const restored = await page.inputValue('#surface-picker');
  assert(restored === 'admin.overview', `History restored ${restored}`);
  await context.close();
  return { restored };
});

await run('reduced motion reaches final state immediately', async () => {
  const { context, page, errors } = await newPage({ reducedMotion: 'reduce' });
  await selectSurface(page, 'admin.overview');
  await page.click('.searchpill');
  await page.waitForSelector('#command-dialog');
  const evidence = await page.evaluate(() => ({
    reduce: matchMedia('(prefers-reduced-motion: reduce)').matches,
    active: document.activeElement?.id,
    transitionState: document.documentElement.dataset.transition ?? null,
    maxDuration: Math.max(
      0,
      ...[...document.querySelectorAll('*')].map((element) => parseFloat(getComputedStyle(element).transitionDuration) || 0),
    ),
  }));
  assert(evidence.reduce && evidence.active === 'command-input', JSON.stringify(evidence));
  assert(evidence.transitionState === null && evidence.maxDuration <= 0.15, JSON.stringify(evidence));
  assert(errors.length === 0, `Console errors: ${errors.join(' | ')}`);
  await context.close();
  return evidence;
});

await run('unsupported View Transition fallback is complete', async () => {
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();
  await page.addInitScript(() => {
    Object.defineProperty(Document.prototype, 'startViewTransition', {
      configurable: true,
      value: undefined,
    });
  });
  await page.goto(url);
  await page.selectOption('#surface-picker', 'admin.overview');
  await page.waitForFunction(() => document.querySelector('#surface-picker')?.value === 'admin.overview');
  const routeMotion = await page.evaluate(() => ({
    fallback: document.documentElement.dataset.fallbackTransition,
    animation: getComputedStyle(document.querySelector('.stage > *')).animationName,
  }));
  assert(
    routeMotion.fallback === 'route' && routeMotion.animation.includes('v4-fallback-arrive'),
    JSON.stringify(routeMotion),
  );
  await page.waitForTimeout(500);
  await page.click('.theme-toggle');
  await page.click('.searchpill');
  const evidence = await page.evaluate(() => ({
    surface: document.querySelector('#surface-picker')?.value,
    theme: document.body.dataset.theme,
    command: !!document.querySelector('#command-dialog'),
    active: document.activeElement?.id,
    fallbackCleared: !document.documentElement.dataset.fallbackTransition,
  }));
  assert(
    evidence.surface === 'admin.overview' &&
      evidence.command &&
      evidence.active === 'command-input' &&
      evidence.fallbackCleared,
    JSON.stringify(evidence),
  );
  await context.close();
  return { ...evidence, routeMotion };
});

await browser.close();

const summary = {
  passed: results.filter((result) => result.pass).length,
  failed: results.filter((result) => !result.pass).length,
  results,
};

writeFileSync(resultFile, JSON.stringify(summary, null, 2));
console.log(JSON.stringify({ passed: summary.passed, failed: summary.failed, resultFile }, null, 2));

if (summary.failed) {
  for (const result of results.filter((item) => !item.pass)) {
    console.error(`FAIL ${result.name}: ${result.error}`);
  }
  process.exitCode = 1;
}
