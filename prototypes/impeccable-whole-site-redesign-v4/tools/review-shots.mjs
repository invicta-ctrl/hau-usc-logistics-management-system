/* Curated finish-review screenshot set for the v4 offline export. */

import { mkdirSync, writeFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { resolve, join } from 'node:path';

const { chromium } = await import(
  process.env.PLAYWRIGHT_PATH ? pathToFileURL(resolve(process.env.PLAYWRIGHT_PATH)).href : 'playwright'
);

const [previewArg, outArg] = process.argv.slice(2);
const preview = resolve(previewArg);
const outDir = resolve(outArg);
mkdirSync(outDir, { recursive: true });

const cases = [
  { name: 'desktop-light-public-landing', width: 1440, theme: 'light', surface: 'public.landing' },
  { name: 'mobile-light-public-landing', width: 390, theme: 'light', surface: 'public.landing' },
  { name: 'desktop-light-admin-overview', width: 1440, theme: 'light', surface: 'admin.overview' },
  { name: 'mobile-light-admin-overview', width: 390, theme: 'light', surface: 'admin.overview' },
  { name: 'desktop-dark-admin-overview', width: 1440, theme: 'dark', surface: 'admin.overview' },
  { name: 'desktop-light-request-queue', width: 1440, theme: 'light', surface: 'request.queue' },
  { name: 'mobile-light-request-queue', width: 390, theme: 'light', surface: 'request.queue' },
  { name: 'desktop-light-release-desk', width: 1440, theme: 'light', surface: 'release.desk' },
  { name: 'desktop-dark-public-signin', width: 1440, theme: 'dark', surface: 'public.signin' },
  { name: 'desktop-light-admin-loading', width: 1440, theme: 'light', surface: 'admin.overview', state: 'loading' },
  { name: 'desktop-light-command', width: 1440, theme: 'light', surface: 'admin.overview', overlay: 'command' },
  { name: 'mobile-dark-command', width: 390, theme: 'dark', surface: 'admin.overview', overlay: 'command' },
];

const browser = await chromium.launch();
const manifest = [];

for (const shot of cases) {
  const context = await browser.newContext({ viewport: { width: shot.width, height: 900 } });
  const page = await context.newPage();
  const errors = [];
  const externalRequests = [];
  page.on('console', (message) => message.type() === 'error' && errors.push(message.text()));
  page.on('pageerror', (error) => errors.push(String(error)));
  page.on('request', (request) => {
    if (!request.url().startsWith('file:') && !request.url().startsWith('data:')) {
      externalRequests.push(request.url());
    }
  });

  await page.goto(pathToFileURL(preview).href);
  await page.click(`[data-act="theme"][data-v="${shot.theme}"]`);
  await page.selectOption('#surface-picker', shot.surface);
  await page.waitForTimeout(520);
  if (shot.state) {
    await page.selectOption('#state-picker', shot.state);
    await page.waitForTimeout(520);
  }
  if (shot.overlay === 'command') {
    await page.click('.searchpill');
    await page.waitForSelector('#command-dialog');
    await page.waitForTimeout(320);
  }

  const file = join(outDir, `${shot.name}.png`);
  await page.screenshot({ path: file });
  manifest.push({ ...shot, file, errors, externalRequests });
  await context.close();
}

await browser.close();
writeFileSync(join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2));

const failures = manifest.filter((entry) => entry.errors.length || entry.externalRequests.length);
console.log(JSON.stringify({ shots: manifest.length, failures: failures.length, outDir }, null, 2));
if (failures.length) process.exitCode = 1;
