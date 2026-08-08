/* Theme toggle acceptance: sun -> moon -> sun, animated, persisted,
   accessible state truthful, system default only on first run, and
   reduced-motion behaviour. */

import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const { chromium } = await import(
  process.env.PLAYWRIGHT_PATH ? pathToFileURL(resolve(process.env.PLAYWRIGHT_PATH)).href : 'playwright'
);

const preview = resolve(process.argv[2]);
const url = pathToFileURL(preview).href;
const browser = await chromium.launch();
const results = {};

const readToggle = () =>
  document.querySelector('.theme-toggle') &&
  (() => {
    const btn = document.querySelector('.theme-toggle');
    const sun = document.querySelector('.theme-toggle__sun');
    const moon = document.querySelector('.theme-toggle__moon');
    const cs = (el) => getComputedStyle(el);
    return {
      theme: document.body.dataset.theme,
      pressed: btn.getAttribute('aria-pressed'),
      label: btn.getAttribute('aria-label'),
      sunOpacity: +cs(sun).opacity,
      moonOpacity: +cs(moon).opacity,
      sunTransform: cs(sun).transform,
      moonTransform: cs(moon).transform,
      transition: cs(sun).transitionDuration,
    };
  })();

/* ---- cycle: light -> dark -> light, on an internal surface ---- */
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  await page.goto(url);
  await page.evaluate(() => {
    // start from a known state
    document.querySelector('[data-act="theme"][data-v="light"]')?.click();
    const s = document.querySelector('#surface-picker');
    s.value = 'admin.overview';
    s.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await page.waitForTimeout(500);

  const cycle = [];
  cycle.push(await page.evaluate(readToggle));
  await page.click('.theme-toggle');
  await page.waitForTimeout(500);
  cycle.push(await page.evaluate(readToggle));
  await page.click('.theme-toggle');
  await page.waitForTimeout(500);
  cycle.push(await page.evaluate(readToggle));

  results.cycle = cycle;
  results.persistedAfterCycle = await page.evaluate(() => localStorage.getItem('hau-usc-v4-theme'));

  /* mid-transition sample proves the icon animates rather than snapping */
  await page.evaluate(() => document.querySelector('.theme-toggle').click());
  await page.waitForTimeout(60);
  results.midTransition = await page.evaluate(readToggle);
  await ctx.close();
}

/* ---- persistence across reload ---- */
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  await page.goto(url);
  await page.evaluate(() => document.querySelector('[data-act="theme"][data-v="dark"]').click());
  await page.waitForTimeout(400);
  await page.reload();
  await page.waitForTimeout(400);
  results.afterReload = await page.evaluate(() => ({
    theme: document.body.dataset.theme,
    stored: localStorage.getItem('hau-usc-v4-theme'),
  }));
  await ctx.close();
}

/* ---- first run follows system preference ---- */
for (const scheme of ['dark', 'light']) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, colorScheme: scheme });
  const page = await ctx.newPage();
  await page.goto(url);
  await page.waitForTimeout(300);
  results[`firstRun_system_${scheme}`] = await page.evaluate(() => ({
    theme: document.body.dataset.theme,
    stored: localStorage.getItem('hau-usc-v4-theme'),
  }));
  await ctx.close();
}

/* ---- stored preference beats system preference ---- */
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, colorScheme: 'dark' });
  const page = await ctx.newPage();
  await page.goto(url);
  await page.evaluate(() => document.querySelector('[data-act="theme"][data-v="light"]').click());
  await page.waitForTimeout(300);
  await page.reload();
  await page.waitForTimeout(300);
  results.storedBeatsSystem = await page.evaluate(() => document.body.dataset.theme);
  await ctx.close();
}

/* ---- reduced motion: icon still swaps, without rotation ---- */
{
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    reducedMotion: 'reduce',
  });
  const page = await ctx.newPage();
  await page.goto(url);
  // The product toggle lives in the shell and the public bar, not on the
  // preview's surface index — navigate to a real surface first.
  await page.evaluate(() => {
    const s = document.querySelector('#surface-picker');
    s.value = 'admin.overview';
    s.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await page.waitForTimeout(300);
  const before = await page.evaluate(readToggle);
  await page.click('.theme-toggle');
  await page.waitForTimeout(200);
  const after = await page.evaluate(readToggle);
  results.reducedMotion = { before, after };
  await ctx.close();
}

await browser.close();
console.log(JSON.stringify(results, null, 1));
