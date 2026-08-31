import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdir, readFile, realpath, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const repoRoot = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));
const phase = String(process.argv[2] ?? '').trim();
const outputArgument = String(process.argv[3] ?? '').trim();
const baseUrl = String(process.argv[4] ?? 'http://127.0.0.1:4173').replace(/\/$/u, '');

if (!['before', 'after'].includes(phase)) {
  throw new Error('Phase must be exactly before or after.');
}
if (baseUrl !== 'http://127.0.0.1:4173') {
  throw new Error('Visual-recovery capture is restricted to the exact local inspection origin.');
}

function inside(parent, candidate) {
  const relative = path.relative(path.resolve(parent), path.resolve(candidate));
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

async function existingPrivateDirectory(value) {
  if (!path.isAbsolute(value)) throw new Error('Output root must be an absolute private path.');
  const resolved = await realpath(value);
  if (inside(repoRoot, resolved) || !(await stat(resolved)).isDirectory()) {
    throw new Error('Output root must be an existing private directory outside the repository.');
  }
  return resolved;
}

async function ensureNew(value, label) {
  try {
    await stat(value);
    throw new Error(`${label} already exists; refusing to overwrite it.`);
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
}

const routes = [
  { slug: 'landing', label: 'Public landing', hash: '' },
  { slug: 'tracking', label: 'Tracking', hash: '#/route/tracking' },
  { slug: 'public-lending', label: 'Public Lending', hash: '#/route/borrow' },
  { slug: 'staff-sign-in', label: 'Staff sign-in', hash: '#/route/staff-signin' },
  {
    slug: 'external-request',
    label: 'External Request',
    hash: '#/__preview/inspect/external-request',
    inspection: 'external-request',
  },
  {
    slug: 'overview-shell',
    label: 'Authenticated shell and Overview',
    hash: '#/__preview/inspect/overview',
    inspection: 'overview',
  },
  { slug: 'inventory', label: 'Inventory', hash: '#/__preview/inspect/inventory', inspection: 'inventory' },
  {
    slug: 'request-hub',
    label: 'Internal Request Hub',
    hash: '#/__preview/inspect/request-center',
    inspection: 'request-center',
  },
  {
    slug: 'lending-operations',
    label: 'Lending operations',
    hash: '#/__preview/inspect/lending',
    inspection: 'lending',
  },
  { slug: 'release-desk', label: 'Release Desk', hash: '#/__preview/inspect/release', inspection: 'release' },
  {
    slug: 'restocking',
    label: 'Restocking and Receiving',
    hash: '#/__preview/inspect/restocking',
    inspection: 'restocking',
  },
  {
    slug: 'procurement',
    label: 'Procurement and Deliverables',
    hash: '#/__preview/inspect/procurement',
    inspection: 'procurement',
  },
  { slug: 'events', label: 'Events', hash: '#/__preview/inspect/events', inspection: 'events' },
  {
    slug: 'administration',
    label: 'Administration',
    hash: '#/__preview/inspect/administration',
    inspection: 'administration',
  },
  { slug: 'profile', label: 'Profile', hash: '#/__preview/inspect/profile', inspection: 'profile' },
  { slug: 'playground-index', label: 'Playground Index', hash: '#/__preview/index', index: true },
];

const outputRoot = await existingPrivateDirectory(outputArgument);
const phaseDirectory = path.join(outputRoot, phase);
const reportPath = path.join(outputRoot, `${phase}-manifest.json`);
await ensureNew(phaseDirectory, `${phase} screenshot directory`);
await ensureNew(reportPath, `${phase} manifest`);
await mkdir(phaseDirectory, { recursive: false });

const git = (...args) => execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' }).trim();
const statusBytes = execFileSync('git', ['status', '--porcelain=v1', '-z'], { cwd: repoRoot });
const diffBytes = execFileSync('git', ['diff', '--binary', 'HEAD'], { cwd: repoRoot });
const report = {
  schemaVersion: 1,
  program: 'HAU-USC-MFR-002',
  phase,
  target: 'LOCAL_EXACT_4173_INSPECTION',
  capturedAt: new Date().toISOString(),
  source: {
    branch: git('branch', '--show-current'),
    head: git('rev-parse', 'HEAD'),
    tree: git('rev-parse', 'HEAD^{tree}'),
    statusSha256: sha256(statusBytes),
    trackedDiffSha256: sha256(diffBytes),
  },
  privateEvidence: true,
  containsPrivateProviderIdentity: false,
  containsSessionMaterial: false,
  widths: [390, 1440],
  routes: [],
  status: 'PASS',
  failures: [],
};

const browser = await chromium.launch({ headless: true });
try {
  for (const width of report.widths) {
    const widthDirectory = path.join(phaseDirectory, String(width));
    await mkdir(widthDirectory, { recursive: false });
    const context = await browser.newContext({
      viewport: { width, height: width === 390 ? 844 : 1000 },
      colorScheme: 'light',
      reducedMotion: 'reduce',
      serviceWorkers: 'block',
    });
    const page = await context.newPage();
    await page.route('**/api/version', (request) =>
      request.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, playground: true, correlationId: 'u11-visual-recovery' }),
      }),
    );
    await page.route('**/api/public/advertisements', (request) =>
      request.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ ok: true, items: [] }),
      }),
    );

    let consoleErrors = [];
    let requestFailures = [];
    let responseErrors = [];
    page.on('console', (message) => {
      if (message.type() === 'error' && !message.text().includes('/favicon.ico')) {
        consoleErrors.push(message.text());
      }
    });
    page.on('requestfailed', (request) => {
      const failure = request.failure()?.errorText ?? '';
      if (failure.includes('ERR_ABORTED') || request.resourceType() === 'media') return;
      requestFailures.push(`${request.method()} ${new URL(request.url()).pathname}: ${failure}`);
    });
    page.on('response', (response) => {
      if (response.status() < 400) return;
      const request = response.request();
      responseErrors.push(`${request.method()} ${new URL(response.url()).pathname}: ${response.status()}`);
    });

    for (const route of routes) {
      consoleErrors = [];
      requestFailures = [];
      responseErrors = [];
      const response = await page.goto(`${baseUrl}/${route.hash}`, {
        waitUntil: 'domcontentloaded',
        timeout: 45_000,
      });
      if (route.index) {
        await page.locator('[data-preview-index]').waitFor({ state: 'visible', timeout: 30_000 });
      } else if (route.inspection) {
        await page
          .locator(`[data-preview-inspection="true"][data-preview-route="${route.inspection}"]`)
          .waitFor({ state: 'visible', timeout: 30_000 });
      }
      const main = page.getByRole('main').first();
      await main.waitFor({ state: 'visible', timeout: 30_000 });
      await main.getByRole('heading', { level: 1 }).waitFor({ state: 'visible', timeout: 30_000 });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(900);
      await page
        .waitForFunction(
          () =>
            ![...document.querySelectorAll('[aria-busy="true"]')].some((element) => {
              const style = getComputedStyle(element);
              const bounds = element.getBoundingClientRect();
              return (
                style.display !== 'none' &&
                style.visibility !== 'hidden' &&
                bounds.width > 0 &&
                bounds.height > 0
              );
            }),
          undefined,
          { timeout: 10_000 },
        )
        .catch(() => undefined);

      const screenshotPath = path.join(widthDirectory, `${route.slug}.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true, animations: 'disabled' });
      const screenshot = await readFile(screenshotPath);
      const geometry = await page.evaluate(() => {
        const visible = (element) => {
          const style = getComputedStyle(element);
          const bounds = element.getBoundingClientRect();
          return (
            style.display !== 'none' && style.visibility !== 'hidden' && bounds.width > 0 && bounds.height > 0
          );
        };
        return {
          documentWidth: document.documentElement.scrollWidth,
          viewportWidth: document.documentElement.clientWidth,
          documentHeight: document.documentElement.scrollHeight,
          h1Count: document.querySelectorAll('main h1').length,
          activeBusyCount: [...document.querySelectorAll('[aria-busy="true"]')].filter(visible).length,
          visibleSkeletonCount: [...document.querySelectorAll('[class*="skeleton"]')].filter(visible).length,
        };
      });
      const expectedAuthorizationProbe =
        route.index &&
        responseErrors.includes('GET /api/playground/status: 401') &&
        (await page.getByText('Authorized sign-in required', { exact: true }).count()) > 0;
      const expectedConsoleErrors = expectedAuthorizationProbe
        ? consoleErrors.filter((message) =>
            message.includes('Failed to load resource: the server responded with a status of 401'),
          )
        : [];
      const unexpectedConsoleErrors = consoleErrors.filter(
        (message) => !expectedConsoleErrors.includes(message),
      );
      const unexpectedResponseErrors = responseErrors.filter(
        (responseError) =>
          !(expectedAuthorizationProbe && responseError === 'GET /api/playground/status: 401'),
      );
      const row = {
        width,
        slug: route.slug,
        label: route.label,
        hash: route.hash,
        status: response?.status() ?? (new URL(page.url()).origin === baseUrl ? 200 : 0),
        screenshotSha256: sha256(screenshot),
        screenshotBytes: screenshot.byteLength,
        geometry,
        expectedAuthorizationProbe,
        expectedConsoleErrors,
        consoleErrors: unexpectedConsoleErrors,
        responseErrors: unexpectedResponseErrors,
        requestFailures: [...requestFailures],
      };
      report.routes.push(row);
      if (
        row.status !== 200 ||
        geometry.h1Count !== 1 ||
        geometry.activeBusyCount > 0 ||
        geometry.visibleSkeletonCount > 0 ||
        geometry.documentWidth - geometry.viewportWidth > 1 ||
        row.consoleErrors.length > 0 ||
        row.responseErrors.length > 0 ||
        row.requestFailures.length > 0
      ) {
        report.failures.push({ width, slug: route.slug, reason: 'Rendered capture contract failed.' });
      }
    }
    await context.close();
  }
} finally {
  await browser.close();
}

if (report.failures.length > 0) report.status = 'FAIL';
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx' });

console.log(`CAPTURE_STATUS=${report.status}`);
console.log(`PHASE=${phase}`);
console.log(`ROUTES=${routes.length}`);
console.log(`WIDTHS=${report.widths.join(',')}`);
console.log(`SCREENSHOTS=${report.routes.length}`);
if (report.status !== 'PASS') process.exitCode = 1;
