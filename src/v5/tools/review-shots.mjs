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
  { name: 'desktop-dark-public-landing', width: 1440, theme: 'dark', surface: 'public.landing' },
  { name: 'desktop-light-request-center', width: 1440, theme: 'light', surface: 'public.request-intake' },
  { name: 'mobile-light-request-center', width: 390, theme: 'light', surface: 'public.request-intake' },
  { name: 'desktop-light-admin-overview', width: 1440, theme: 'light', surface: 'admin.overview' },
  { name: 'mobile-light-admin-overview', width: 390, theme: 'light', surface: 'admin.overview' },
  { name: 'desktop-dark-admin-overview', width: 1440, theme: 'dark', surface: 'admin.overview' },
  { name: 'desktop-light-request-queue', width: 1440, theme: 'light', surface: 'request.queue' },
  { name: 'mobile-light-request-queue', width: 390, theme: 'light', surface: 'request.queue' },
  { name: 'mobile-light-request-queue-bottom', width: 390, theme: 'light', surface: 'request.queue', scrollBottom: true },
  { name: 'desktop-light-release-desk', width: 1440, theme: 'light', surface: 'release.desk' },
  { name: 'desktop-light-lending-hub', width: 1440, theme: 'light', surface: 'lending.queue' },
  { name: 'desktop-light-procurement', width: 1440, theme: 'light', surface: 'procurement.board' },
  { name: 'desktop-light-profile', width: 1440, theme: 'light', surface: 'account.profile' },
  { name: 'desktop-light-system-status', width: 1440, theme: 'light', surface: 'owner.health' },
  { name: 'desktop-dark-public-signin', width: 1440, theme: 'dark', surface: 'public.signin' },
  { name: 'desktop-light-admin-loading', width: 1440, theme: 'light', surface: 'admin.overview', state: 'loading' },
  { name: 'desktop-light-command', width: 1440, theme: 'light', surface: 'admin.overview', overlay: 'command' },
  { name: 'desktop-light-role-dialog', width: 1440, theme: 'light', surface: 'admin.overview', overlay: 'role' },
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
  const previewViewport = shot.width <= 414 ? 'mobile' : shot.width <= 1024 ? 'tablet' : 'desktop';
  await page.click(`[data-act="viewport"][data-v="${previewViewport}"]`);
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
  if (shot.overlay === 'role') {
    await page.click('[data-act="open-menu"]');
    await page.click('[data-act="open-role-dialog"]');
    await page.waitForSelector('.role-dialog');
    await page.waitForTimeout(320);
  }
  if (shot.scrollBottom) {
    await page.evaluate(() => window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
    await page.waitForTimeout(180);
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
