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
  document.querySelector('.celestial') &&
  (() => {
    const btn = document.querySelector('.celestial');
    const sun = document.querySelector('.celestial__slot--sun');
    const moon = document.querySelector('.celestial__slot--moon');
    const track = document.querySelector('.celestial__capsule');
    const thumb = document.querySelector('.celestial__plate');
    const cs = (el) => getComputedStyle(el);
    return {
      theme: document.body.dataset.theme,
      pressed: btn.getAttribute('aria-pressed'),
      label: btn.getAttribute('aria-label'),
      sunOpacity: +cs(sun).opacity,
      moonOpacity: +cs(moon).opacity,
      sunTransform: cs(sun).transform,
      moonTransform: cs(moon).transform,
      thumbTransform: cs(thumb).transform,
      thumbTransitionProperty: cs(thumb).transitionProperty,
      thumbTransition: cs(thumb).transitionDuration,
      trackWidth: track.getBoundingClientRect().width,
      trackHeight: track.getBoundingClientRect().height,
      endpointsVisible: +cs(sun).opacity > 0 && +cs(moon).opacity > 0,
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
  await page.click('.celestial');
  await page.waitForTimeout(500);
  cycle.push(await page.evaluate(readToggle));
  await page.click('.celestial');
  await page.waitForTimeout(500);
  cycle.push(await page.evaluate(readToggle));

  results.cycle = cycle;
  results.persistedAfterCycle = await page.evaluate(() => localStorage.getItem('hau-usc-v4-theme'));

  /* mid-transition sample proves the icon animates rather than snapping */
  await page.evaluate(() => document.querySelector('.celestial').click());
  await page.waitForFunction(() => document.body.dataset.theme === 'dark');
  await page.waitForTimeout(80);
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
  await page.click('.celestial');
  await page.waitForTimeout(200);
  const after = await page.evaluate(readToggle);
  results.reducedMotion = { before, after };
  await ctx.close();
}

await browser.close();
const [cycleLight, cycleDark, cycleLightAgain] = results.cycle;
const transitionSeconds = (entry, property) => {
  const properties = String(entry.thumbTransitionProperty).split(',').map((part) => part.trim());
  const durations = String(entry.thumbTransition).split(',').map((part) => Number.parseFloat(part) || 0);
  const index = properties.indexOf(property);
  if (index < 0) return properties.includes('all') ? Math.max(...durations) : 0;
  return durations[index % durations.length];
};
const checks = {
  lightStateTruthful:
    cycleLight.theme === 'light' && cycleLight.pressed === 'false' && cycleLight.label === 'Switch to dark mode',
  darkStateTruthful:
    cycleDark.theme === 'dark' && cycleDark.pressed === 'true' && cycleDark.label === 'Switch to light mode',
  returnsToLight: cycleLightAgain.theme === 'light' && cycleLightAgain.pressed === 'false',
  bothEndpointsRemainVisible: results.cycle.every((entry) => entry.endpointsVisible),
  wideCelestialCapsule: cycleLight.trackWidth >= 70 && cycleLight.trackHeight >= 36,
  plateChangesEndpoint: cycleLight.thumbTransform !== cycleDark.thumbTransform,
  plateTravelIsAnimated:
    results.midTransition.thumbTransform !== cycleLight.thumbTransform &&
    results.midTransition.thumbTransform !== cycleDark.thumbTransform,
  travelDurationWithinBudget:
    transitionSeconds(cycleLight, 'transform') >= 0.2 &&
    transitionSeconds(cycleLight, 'transform') <= 0.26,
  persisted: results.persistedAfterCycle === 'light' && results.afterReload.theme === 'dark',
  systemPreferenceHonored:
    results.firstRun_system_dark.theme === 'dark' && results.firstRun_system_light.theme === 'light',
  storedPreferenceWins: results.storedBeatsSystem === 'light',
  reducedMotionKeepsState:
    results.reducedMotion.before.theme !== results.reducedMotion.after.theme &&
    results.reducedMotion.after.endpointsVisible,
  reducedMotionRemovesLongTravel:
    transitionSeconds(results.reducedMotion.after, 'transform') === 0,
};
results.acceptance = {
  checks,
  passed: Object.values(checks).every(Boolean),
};
console.log(JSON.stringify(results, null, 1));
if (!results.acceptance.passed) process.exitCode = 1;
