/* Probe the celestial control's accessible state in both themes. */
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';

const { chromium } = await import(
  process.env.PLAYWRIGHT_PATH ? pathToFileURL(resolve(process.env.PLAYWRIGHT_PATH)).href : 'playwright'
);

const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
await page.goto(pathToFileURL(resolve(process.argv[2])).href);

const read = () =>
  page.evaluate(() => {
    const all = [...document.querySelectorAll('.celestial')];
    return {
      theme: document.body.dataset.theme || document.documentElement.dataset.theme,
      count: all.length,
      nodes: all.map((b) => ({
        checked: b.getAttribute('aria-checked'),
        pressed: b.getAttribute('aria-pressed'),
        role: b.getAttribute('role'),
        label: b.getAttribute('aria-label'),
      })),
    };
  });

await page.evaluate(() => {
  const s = document.querySelector('#surface-picker');
  s.value = 'admin.overview';
  s.dispatchEvent(new Event('change', { bubbles: true }));
});
await page.waitForTimeout(400);
await page.evaluate(() => document.querySelector('[data-act="theme"][data-v="light"]')?.click());
await page.waitForTimeout(500);
const light = await read();
await page.click('.celestial');
await page.waitForTimeout(600);
const dark = await read();

await browser.close();
console.log(JSON.stringify({ light, dark }, null, 1));
