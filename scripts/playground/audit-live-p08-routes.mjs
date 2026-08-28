import { createHash } from 'node:crypto';
import { mkdir, readFile, realpath, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const repoRoot = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));

function inside(parent, candidate) {
  const relative = path.relative(path.resolve(parent), path.resolve(candidate));
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

async function privateNew(value, label) {
  if (!path.isAbsolute(value ?? '')) throw new Error(`${label} must be an absolute private path.`);
  const parent = await realpath(path.dirname(value));
  const resolved = path.join(parent, path.basename(value));
  if (inside(repoRoot, resolved)) throw new Error(`${label} must remain outside the repository.`);
  try {
    await stat(resolved);
    throw new Error(`${label} exists; refusing to overwrite it.`);
  } catch (error) {
    if (error?.code !== 'ENOENT') throw error;
  }
  return resolved;
}

async function privateExisting(value, label) {
  if (!path.isAbsolute(value ?? '')) throw new Error(`${label} must be an absolute private path.`);
  const resolved = await realpath(value);
  if (inside(repoRoot, resolved) || !(await stat(resolved)).isFile()) {
    throw new Error(`${label} must be a private file outside the repository.`);
  }
  return resolved;
}

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

const manifestPath = await privateExisting(process.argv[2], 'Playground resource manifest');
const reportPath = await privateNew(process.argv[3], 'P08 audit report');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
const hostname = String(manifest.playgroundHostname ?? '')
  .replace(/^https?:\/\//u, '')
  .replace(/\/$/u, '');
if (
  manifest.status !== 'READY' ||
  !hostname ||
  hostname === 'logistics.hausc.org' ||
  !/^[-a-z0-9.]+$/iu.test(hostname)
) {
  throw new Error('Private manifest does not identify an isolated Playground hostname.');
}
const baseUrl = `https://${hostname}`;
const screenshotDirectory = path.join(path.dirname(reportPath), `${path.parse(reportPath).name}-screenshots`);
await mkdir(screenshotDirectory, { recursive: false });

const routes = [
  ['overview', /^(operations )?overview$/iu, '/api/bootstrap/overview?page=1&pageSize=25'],
  ['request-center', /internal request hub|request hub/iu, '/api/bootstrap/request?page=1&pageSize=25'],
  ['lending', /internal lending hub|lending hub/iu, '/api/bootstrap/lending?page=1&pageSize=25'],
  ['release', /release( desk)?/iu, '/api/bootstrap/release?page=1&pageSize=25'],
  ['restocking', /restocking/iu, '/api/bootstrap/restocking?page=1&pageSize=25'],
  ['procurement', /procurement/iu, '/api/bootstrap/procurement?page=1&pageSize=25'],
];

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  colorScheme: 'light',
  serviceWorkers: 'block',
});
const page = await context.newPage();
const consoleErrors = [];
const failedRequests = [];
page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text().slice(0, 500));
});
page.on('requestfailed', (request) => {
  failedRequests.push({
    method: request.method(),
    path: new URL(request.url()).pathname,
    reason: String(request.failure()?.errorText ?? 'UNKNOWN').slice(0, 160),
  });
});

const report = {
  status: 'AUDIT_COMPLETE',
  capturedAt: new Date().toISOString(),
  target: 'PLAYGROUND',
  isolatedManifestTarget: true,
  freshContext: true,
  productionMutation: 'NONE',
  root: {},
  session: {},
  routes: {},
  consoleErrors,
  failedRequests,
};

try {
  const rootResponse = await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 45_000 });
  await page.waitForTimeout(2_000);
  report.root = {
    httpStatus: rootResponse?.status() ?? 0,
    bodyNonBlank: (await page.locator('body').innerText()).trim().length > 0,
    mainVisible: await page
      .locator('main')
      .first()
      .isVisible()
      .catch(() => false),
  };

  const staffSignIn = page.getByRole('button', { name: 'Staff sign in', exact: true }).first();
  const staffSignInVisible = await staffSignIn.isVisible({ timeout: 10_000 }).catch(() => false);
  if (staffSignInVisible) await staffSignIn.click();
  const enter = page.getByRole('button', { name: 'Enter Playground' });
  const entryVisible = await enter.isVisible({ timeout: 10_000 }).catch(() => false);
  let sessionResponseStatus = 0;
  if (entryVisible) {
    const responsePromise = page
      .waitForResponse((response) => new URL(response.url()).pathname === '/api/playground/session', {
        timeout: 30_000,
      })
      .catch(() => null);
    await enter.click();
    sessionResponseStatus = (await responsePromise)?.status() ?? 0;
    await page
      .getByRole('button', { name: 'Sign out' })
      .first()
      .waitFor({ state: 'visible', timeout: 30_000 })
      .catch(() => {});
  }
  report.session = {
    staffSignInVisible,
    entryVisible,
    responseStatus: sessionResponseStatus,
    authenticatedNavigationVisible: await page
      .getByRole('button', { name: 'Sign out' })
      .first()
      .isVisible()
      .catch(() => false),
  };

  for (const [route, navigationName, endpoint] of routes) {
    const failedStart = failedRequests.length;
    const consoleStart = consoleErrors.length;
    const navigation = page
      .getByRole('button', { name: navigationName })
      .or(page.getByRole('link', { name: navigationName }))
      .first();
    const navigationVisible = await navigation.isVisible().catch(() => false);
    if (navigationVisible) await navigation.click();
    await page.waitForTimeout(2_500);

    const api = await page.evaluate(async (pathValue) => {
      try {
        const response = await fetch(pathValue, { headers: { accept: 'application/json' } });
        const payload = await response.json().catch(() => null);
        const data = payload && typeof payload.data === 'object' ? payload.data : {};
        return {
          status: response.status,
          contract: String(payload?.contract ?? ''),
          contractVersion: Number(payload?.contractVersion ?? 0),
          module: String(payload?.module ?? ''),
          requestOnly: payload?.requestOnly,
          total: Number(payload?.pagination?.total ?? 0),
          dataCounts: Object.fromEntries(
            Object.entries(data)
              .filter(([, value]) => Array.isArray(value))
              .map(([key, value]) => [key, value.length]),
          ),
          errorCode: String(payload?.error?.code ?? ''),
        };
      } catch (error) {
        return { status: 0, errorCode: error instanceof Error ? error.name : 'FETCH_FAILED' };
      }
    }, endpoint);

    const body = (await page.locator('body').innerText()).toLowerCase();
    const screenshotPath = path.join(screenshotDirectory, `${route}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    report.routes[route] = {
      navigationVisible,
      hash: new URL(page.url()).hash,
      api,
      loadingVisible: await page
        .locator('[aria-busy="true"]')
        .first()
        .isVisible()
        .catch(() => false),
      alertCount: await page.locator('[role="alert"]').count(),
      retryVisible: await page
        .getByRole('button', { name: /retry/iu })
        .first()
        .isVisible()
        .catch(() => false),
      reservedOrNotBuilt: /reserved|not built|coming soon|placeholder/iu.test(body),
      unavailableCopy: /temporarily unavailable|service unavailable/iu.test(body),
      emptyCopy: /no .* (found|available|yet)|nothing .* (found|available)/iu.test(body),
      routeConsoleErrors: consoleErrors.length - consoleStart,
      routeFailedRequests: failedRequests.length - failedStart,
      screenshotSha256: sha256(await readFile(screenshotPath)),
    };
  }
} finally {
  await context.close();
  await browser.close();
}

await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, {
  flag: 'wx',
  mode: 0o600,
});
console.log('P08 fresh-browser live route audit: COMPLETE');
console.log(
  'Screenshots and aggregate report remain private; no credentials or row identities were printed.',
);
