import { createHash } from 'node:crypto';
import { mkdir, readFile, realpath, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const repoRoot = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));
const expectedCandidate = String(process.argv[4] ?? '').trim();
if (!/^[a-f0-9]{40}$/u.test(expectedCandidate)) {
  throw new Error('Expected candidate must be an exact 40-character Git SHA.');
}

function inside(parent, candidate) {
  const relative = path.relative(path.resolve(parent), path.resolve(candidate));
  return relative === '' || (!relative.startsWith('..') && !path.isAbsolute(relative));
}

async function privateExisting(value, label) {
  if (!path.isAbsolute(value ?? '')) throw new Error(`${label} must be an absolute private path.`);
  const resolved = await realpath(value);
  if (inside(repoRoot, resolved) || !(await stat(resolved)).isFile()) {
    throw new Error(`${label} must be a private file outside the repository.`);
  }
  return resolved;
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

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

const routes = [
  { name: 'Playground Index', hash: '#/__preview/index', api: ['/api/version'] },
  { name: 'Overview', hash: '#/route/overview', api: ['/api/bootstrap/overview'] },
  { name: 'Inventory', hash: '#/route/inventory', api: ['/api/bootstrap/inventory'] },
  { name: 'Request Hub', hash: '#/route/request-center', api: ['/api/bootstrap/request'] },
  { name: 'Lending Hub', hash: '#/route/lending', api: ['/api/bootstrap/lending'] },
  { name: 'Release', hash: '#/route/release', api: ['/api/bootstrap/release'] },
  { name: 'Restocking', hash: '#/route/restocking', api: ['/api/bootstrap/restocking'] },
  { name: 'Procurement', hash: '#/route/procurement', api: ['/api/bootstrap/procurement'] },
  { name: 'Events', hash: '#/route/events', api: ['/api/getEventManagement'] },
  { name: 'Administration', hash: '#/route/administration', api: ['/api/admin/staff-directory'] },
  { name: 'Profile', hash: '#/route/profile', api: ['/api/me/profile'] },
];

const manifestPath = await privateExisting(process.argv[2], 'Playground resource manifest');
const reportPath = await privateNew(process.argv[3], 'P30 acceptance report');
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

const report = {
  status: 'PASS',
  checkedAt: new Date().toISOString(),
  target: 'PLAYGROUND',
  expectedCandidate,
  isolatedManifestTarget: true,
  productionMutation: 'NONE',
  googleMutation: 'NONE',
  widths: {},
};

const failures = [];
const browser = await chromium.launch({ headless: true });

async function auditWidth(width) {
  const context = await browser.newContext({
    viewport: { width, height: width === 390 ? 844 : 1000 },
    colorScheme: 'light',
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
  });
  const initialCookies = await context.cookies();
  const page = await context.newPage();
  const apiResponses = [];
  let consoleErrors = 0;
  let failedRequests = 0;
  page.on('response', (response) => {
    const url = new URL(response.url());
    if (url.pathname.startsWith('/api/')) apiResponses.push({ path: url.pathname, status: response.status() });
  });
  page.on('console', (message) => {
    if (message.type() === 'error') consoleErrors += 1;
  });
  page.on('requestfailed', (request) => {
    const failure = request.failure()?.errorText ?? '';
    if (failure.includes('ERR_ABORTED') || request.resourceType() === 'media') return;
    failedRequests += 1;
  });

  const widthReport = {
    freshContext: initialCookies.length === 0,
    version: {},
    entry: {},
    routes: {},
    publicFlows: {},
    finalConsoleErrors: 0,
    finalFailedRequests: 0,
    signedOut: false,
  };

  async function screenshot(label) {
    const output = path.join(screenshotDirectory, `${width}-${label}.png`);
    await page.screenshot({ path: output, fullPage: true });
    return sha256(await readFile(output));
  }

  async function visit(label, hash, expectedApi, { allowInspectionCopy = false } = {}) {
    const apiStart = apiResponses.length;
    const consoleStart = consoleErrors;
    const failedStart = failedRequests;
    const response = await page.goto(`${baseUrl}/${hash}`, { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await page.getByRole('main').first().waitFor({ state: 'visible', timeout: 30_000 });
    await page.waitForTimeout(1_500);
    await page
      .waitForFunction(() => !document.querySelector('[aria-busy="true"]'), null, { timeout: 15_000 })
      .catch(() => {});
    const observedUi = apiResponses.slice(apiStart);
    const relevantUi = expectedApi.length
      ? observedUi.filter((entry) => expectedApi.some((prefix) => entry.path.startsWith(prefix)))
      : [];
    const probes = relevantUi.some((entry) => entry.status === 200)
      ? []
      : await page.evaluate(async (paths) => {
          const results = [];
          for (const apiPath of paths) {
            const probe = await fetch(apiPath, { headers: { accept: 'application/json' } });
            results.push({ path: new URL(probe.url).pathname, status: probe.status });
          }
          return results;
        }, expectedApi);
    const observed = [...observedUi, ...probes];
    const relevant = expectedApi.length
      ? observed.filter((entry) => expectedApi.some((prefix) => entry.path.startsWith(prefix)))
      : [];
    const main = page.getByRole('main').first();
    const body = await main.innerText();
    const heading = await main.locator('h1:visible').first().textContent().catch(() => '');
    const busy = await main.locator('[aria-busy="true"]').count();
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    const result = {
      httpStatus: response?.status() ?? (new URL(page.url()).origin === baseUrl ? 200 : 0),
      hash: new URL(page.url()).hash,
      mainVisible: await main.isVisible(),
      heading: String(heading ?? '').trim(),
      backendSource: label === 'Playground Index' ? 'Worker version and route metadata' : 'Worker and Playground D1',
      apiResults: relevant,
      apiPass: expectedApi.length === 0 || relevant.some((entry) => entry.status === 200),
      authorization: label === 'Playground Index' ? 'Playground environment gate' : 'authenticated System Owner session',
      fixtureLeak: !allowInspectionCopy && /sample data|fixture-only|preview-only/iu.test(body),
      loadingComplete: busy === 0,
      unavailableBlocker: /temporarily unavailable|service unavailable/iu.test(body),
      horizontalOverflow: overflow,
      consoleErrors: consoleErrors - consoleStart,
      failedRequests: failedRequests - failedStart,
      screenshotSha256: await screenshot(label.toLowerCase().replaceAll(/[^a-z0-9]+/gu, '-')),
    };
    const accepted =
      result.httpStatus === 200 &&
      result.mainVisible &&
      result.heading.length > 0 &&
      result.apiPass &&
      !result.fixtureLeak &&
      result.loadingComplete &&
      !result.unavailableBlocker &&
      result.horizontalOverflow <= 1 &&
      result.consoleErrors === 0 &&
      result.failedRequests === 0;
    if (!accepted) failures.push(`${width}:${label}`);
    return result;
  }

  try {
    const rootApiStart = apiResponses.length;
    const rootResponse = await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await page.getByRole('heading', { level: 1, name: 'Logistics services and records' }).waitFor({
      state: 'visible',
      timeout: 30_000,
    });
    const version = await page.evaluate(async () => {
      const response = await fetch('/api/version', { headers: { accept: 'application/json' } });
      const payload = await response.json().catch(() => null);
      return {
        status: response.status,
        playground: payload?.playground === true,
        environment: String(payload?.environment ?? ''),
        candidateSha: String(payload?.candidateSha ?? ''),
        schemaVersion: String(payload?.database?.schemaVersion ?? ''),
        latestMigration: String(payload?.database?.latestMigration ?? ''),
      };
    });
    widthReport.version = version;
    if (
      rootResponse?.status() !== 200 ||
      !version.playground ||
      version.environment !== 'STAGING' ||
      version.candidateSha !== expectedCandidate ||
      version.schemaVersion !== '32' ||
      version.latestMigration !== '0032_staff_account_activity_history.sql'
    ) {
      failures.push(`${width}:version`);
    }

    const staffEntry = page
      .getByRole('link', { name: 'Staff sign in', exact: true })
      .or(page.getByRole('button', { name: 'Staff sign in', exact: true }))
      .first();
    await staffEntry.click();
    const enter = page.getByRole('button', { name: 'Enter Playground' });
    await enter.waitFor({ state: 'visible', timeout: 15_000 });
    const sessionPromise = page.waitForResponse(
      (response) => new URL(response.url()).pathname === '/api/playground/session',
      { timeout: 30_000 },
    );
    await enter.click();
    const sessionResponse = await sessionPromise;
    const sessionPayload = await sessionResponse.json().catch(() => null);
    await page.getByRole('main').first().waitFor({ state: 'visible', timeout: 30_000 });
    widthReport.entry = {
      landingStatus: rootResponse?.status() ?? 0,
      landingApiResults: apiResponses.slice(rootApiStart),
      staffSignInVisible: true,
      enterPlaygroundVisible: true,
      sessionStatus: sessionResponse.status(),
      authenticated: sessionPayload?.state === 'AUTHENTICATED',
      systemOwner: sessionPayload?.user?.authorization?.roleId === 'SYSTEM_OWNER',
      capabilityCount: Array.isArray(sessionPayload?.user?.authorization?.capabilities)
        ? sessionPayload.user.authorization.capabilities.length
        : 0,
    };
    if (
      widthReport.entry.sessionStatus !== 200 ||
      !widthReport.entry.authenticated ||
      !widthReport.entry.systemOwner
    ) {
      failures.push(`${width}:entry`);
    }

    for (const route of routes) {
      widthReport.routes[route.name] = await visit(route.name, route.hash, route.api, {
        allowInspectionCopy: route.name === 'Playground Index',
      });
      if (route.name === 'Playground Index') {
        await page.getByRole('button', { name: 'Back', exact: true }).click();
        await page.getByRole('heading', { level: 1, name: 'Logistics services and records' }).waitFor({
          state: 'visible',
          timeout: 30_000,
        });
      }
    }

    let signOut = page.getByRole('button', { name: 'Sign out', exact: true }).first();
    if (!(await signOut.isVisible().catch(() => false))) {
      const menu = page.getByRole('button', { name: /^Open navigation(?: menu)?$/u });
      if (await menu.isVisible().catch(() => false)) await menu.click();
      signOut = page.getByRole('button', { name: 'Sign out', exact: true }).first();
    }
    if (await signOut.isVisible().catch(() => false)) {
      await signOut.click();
      await page.getByRole('heading', { level: 1, name: 'Logistics services and records' }).waitFor({
        state: 'visible',
        timeout: 20_000,
      });
      const remainingSessionCookie = (await context.cookies()).some((cookie) =>
        cookie.name.includes('hau_session'),
      );
      const publicEntryVisible = await page
        .getByRole('link', { name: 'Staff sign in', exact: true })
        .or(page.getByRole('button', { name: 'Staff sign in', exact: true }))
        .or(page.getByRole('button', { name: 'Enter Playground' }))
        .or(page.getByRole('heading', { level: 1, name: 'Logistics services and records' }))
        .first()
        .isVisible()
        .catch(() => false);
      widthReport.signedOut =
        !remainingSessionCookie &&
        !(await signOut.isVisible().catch(() => false)) &&
        publicEntryVisible;
      if (!widthReport.signedOut) failures.push(`${width}:sign-out`);
    } else {
      failures.push(`${width}:sign-out`);
    }
  } finally {
    widthReport.finalConsoleErrors = consoleErrors;
    widthReport.finalFailedRequests = failedRequests;
    await context.close();
  }

  report.widths[String(width)] = widthReport;

  const publicContext = await browser.newContext({
    viewport: { width, height: width === 390 ? 844 : 1000 },
    colorScheme: 'light',
    reducedMotion: 'reduce',
    serviceWorkers: 'block',
  });
  const publicPage = await publicContext.newPage();
  let publicConsoleErrors = 0;
  let publicFailedRequests = 0;
  const publicApis = [];
  publicPage.on('console', (message) => {
    if (message.type() === 'error') publicConsoleErrors += 1;
  });
  publicPage.on('requestfailed', (request) => {
    const failure = request.failure()?.errorText ?? '';
    if (failure.includes('ERR_ABORTED') || request.resourceType() === 'media') return;
    publicFailedRequests += 1;
  });
  publicPage.on('response', (response) => {
    const url = new URL(response.url());
    if (url.pathname.startsWith('/api/')) publicApis.push({ path: url.pathname, status: response.status() });
  });
  try {
    await publicPage.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await publicPage.getByRole('heading', { level: 1, name: 'Logistics services and records' }).waitFor({
      state: 'visible',
      timeout: 30_000,
    });
    const startRequest = publicPage.getByRole('link', { name: /Start a logistics request/ }).first();
    const authorizationProbePromise = publicPage.waitForResponse(
      (response) =>
        new URL(response.url()).pathname === '/api/auth/session' && response.status() === 401,
      { timeout: 15_000 },
    );
    await startRequest.click();
    const authorizationProbe = await authorizationProbePromise;
    const requestRequiresStaff = await publicPage
      .getByRole('heading', { name: /Staff sign in|Sign in to continue/u })
      .isVisible({ timeout: 15_000 })
      .catch(() => false);
    await publicPage.waitForTimeout(100);
    const authorizationProbeApi = [
      { path: new URL(authorizationProbe.url()).pathname, status: authorizationProbe.status() },
    ];
    const expectedAuthorizationConsoleErrors = publicConsoleErrors;
    publicConsoleErrors = 0;
    publicFailedRequests = 0;

    const borrowStart = publicApis.length;
    await publicPage.goto(`${baseUrl}/#/route/borrow`, { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await publicPage.getByRole('heading', { level: 1, name: 'Lending Center' }).waitFor({
      state: 'visible',
      timeout: 30_000,
    });
    await publicPage.waitForTimeout(1_500);
    const borrowApi = publicApis
      .slice(borrowStart)
      .filter((entry) => entry.path === '/api/public/lending/catalog');
    const borrowOverflow = await publicPage.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );

    await publicPage.goto(`${baseUrl}/#/route/tracking`, { waitUntil: 'domcontentloaded', timeout: 45_000 });
    await publicPage.getByLabel('Request or Submission ID').waitFor({ state: 'visible', timeout: 30_000 });
    const trackingHeading = String(
      (await publicPage.getByRole('main').first().locator('h1:visible').first().textContent()) ?? '',
    ).trim();
    const trackingOverflow = await publicPage.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    widthReport.publicFlows = {
      freshContext: (await publicContext.cookies()).every((cookie) => !cookie.name.includes('hau_session')),
      requestRequiresStaffSignIn: requestRequiresStaff,
      authorizationProbeApi,
      expectedAuthorizationConsoleErrors,
      lendingCatalogApi: borrowApi,
      lendingCatalogVisible: true,
      trackingHeading,
      trackingFormVisible: await publicPage.getByLabel('Request or Submission ID').isVisible(),
      borrowOverflow,
      trackingOverflow,
      consoleErrors: publicConsoleErrors,
      failedRequests: publicFailedRequests,
    };
    if (
      !requestRequiresStaff ||
      !authorizationProbeApi.some((entry) => entry.status === 401) ||
      !borrowApi.some((entry) => entry.status === 200) ||
      !/track/iu.test(trackingHeading) ||
      !widthReport.publicFlows.trackingFormVisible ||
      borrowOverflow > 1 ||
      trackingOverflow > 1 ||
      publicConsoleErrors !== 0 ||
      publicFailedRequests !== 0
    ) {
      failures.push(`${width}:public-flows`);
    }
  } finally {
    await publicContext.close();
  }
}

let executionError = null;
try {
  for (const width of [390, 1440]) await auditWidth(width);
} catch (error) {
  executionError = error;
  report.runtimeError = {
    name: String(error?.name ?? 'Error'),
    message: String(error?.message ?? 'Unknown runtime failure'),
  };
  failures.push(`runtime:${error?.name ?? 'Error'}`);
} finally {
  await browser.close();
}

report.status = failures.length === 0 ? 'PASS' : 'FAIL';
report.failures = failures;
await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx', mode: 0o600 });

if (failures.length > 0) {
  throw new Error(
    `P30 live acceptance failed ${failures.length} gate(s)${executionError ? ' after a runtime exception' : ''}.`,
  );
}
console.log('P30 fresh-browser live acceptance: PASS');
console.log('Two widths, exact runtime identity, eleven routes, and supported public flows passed.');
console.log('Private screenshots/report retained; provider identities, rows, and session material were not printed.');
