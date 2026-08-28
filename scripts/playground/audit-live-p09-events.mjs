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

function aggregateEvents(payload) {
  const series = Array.isArray(payload?.eventSeries) ? payload.eventSeries : [];
  const days = Array.isArray(payload?.eventDays) ? payload.eventDays : [];
  const activities = Array.isArray(payload?.activities) ? payload.activities : [];
  const seriesIds = new Set(series.map((row) => String(row?.id ?? '')).filter(Boolean));
  const dayIds = new Set(days.map((row) => String(row?.id ?? '')).filter(Boolean));
  return {
    contractValid:
      payload?.ok === true &&
      Array.isArray(payload?.eventSeries) &&
      Array.isArray(payload?.eventDays) &&
      Array.isArray(payload?.activities),
    counts: {
      series: series.length,
      days: days.length,
      activities: activities.length,
      links: Array.isArray(payload?.links) ? payload.links.length : 0,
    },
    unresolvedDaySeries: days.filter((row) => !seriesIds.has(String(row?.seriesId ?? ''))).length,
    unresolvedActivityDays: activities.filter((row) => row?.eventDayId && !dayIds.has(String(row.eventDayId)))
      .length,
  };
}

const manifestPath = await privateExisting(process.argv[2], 'Playground resource manifest');
const reportPath = await privateNew(process.argv[3], 'P09 audit report');
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
  playgroundMutation: 'SESSION_ONLY',
  session: {},
  events: {},
  unauthenticatedDenial: {},
  consoleErrors,
  failedRequests,
};

try {
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 45_000 });
  await page.waitForTimeout(1_500);
  const staffSignIn = page.getByRole('button', { name: 'Staff sign in', exact: true }).first();
  const staffSignInVisible = await staffSignIn.isVisible({ timeout: 10_000 }).catch(() => false);
  if (staffSignInVisible) await staffSignIn.click();
  const enter = page.getByRole('button', { name: 'Enter Playground' });
  const entryVisible = await enter.isVisible({ timeout: 10_000 }).catch(() => false);
  let sessionResponseStatus = 0;
  let sessionProjection = { authenticated: false, systemOwner: false, eventManage: false };
  if (entryVisible) {
    const responsePromise = page.waitForResponse(
      (response) => new URL(response.url()).pathname === '/api/playground/session',
      { timeout: 30_000 },
    );
    await enter.click();
    const sessionResponse = await responsePromise;
    sessionResponseStatus = sessionResponse.status();
    const sessionPayload = await sessionResponse.json().catch(() => null);
    const authorization = sessionPayload?.user?.authorization ?? {};
    sessionProjection = {
      authenticated: sessionPayload?.state === 'AUTHENTICATED',
      systemOwner: authorization.roleId === 'SYSTEM_OWNER',
      eventManage: Array.isArray(authorization.capabilities)
        ? authorization.capabilities.includes('event.manage')
        : false,
    };
    await page
      .getByRole('button', { name: 'Sign out' })
      .first()
      .waitFor({ state: 'visible', timeout: 30_000 });
  }
  report.session = {
    staffSignInVisible,
    entryVisible,
    responseStatus: sessionResponseStatus,
    ...sessionProjection,
  };

  const navigation = page
    .getByRole('button', { name: /^events$/iu })
    .or(page.getByRole('link', { name: /^events$/iu }))
    .first();
  const navigationVisible = await navigation.isVisible().catch(() => false);
  let apiStatus = 0;
  let apiAggregate = aggregateEvents(null);
  if (navigationVisible) {
    const responsePromise = page.waitForResponse(
      (response) => new URL(response.url()).pathname === '/api/getEventManagement',
      { timeout: 30_000 },
    );
    await navigation.click();
    const response = await responsePromise;
    apiStatus = response.status();
    apiAggregate = aggregateEvents(await response.json().catch(() => null));
  }
  await page.waitForTimeout(1_500);
  const screenshotPath = path.join(screenshotDirectory, 'events.png');
  await page.screenshot({ path: screenshotPath, fullPage: true });
  const body = (await page.locator('body').innerText()).toLowerCase();
  report.events = {
    navigationVisible,
    hash: new URL(page.url()).hash,
    apiStatus,
    ...apiAggregate,
    seriesHeadingVisible: await page
      .getByRole('heading', { name: 'Series and governed relationships', exact: true })
      .isVisible()
      .catch(() => false),
    daysHeadingVisible: await page
      .getByRole('heading', { name: 'Current day relationships', exact: true })
      .isVisible()
      .catch(() => false),
    activitiesHeadingVisible: await page
      .getByRole('heading', { name: 'Read-only activity relationships', exact: true })
      .isVisible()
      .catch(() => false),
    loadingVisible: await page
      .locator('[aria-busy="true"]')
      .first()
      .isVisible()
      .catch(() => false),
    retryVisible: await page
      .getByRole('button', { name: /retry/iu })
      .first()
      .isVisible()
      .catch(() => false),
    deniedCopy: /event records are not available to this account/iu.test(body),
    unavailableCopy: /event relationships are temporarily unavailable/iu.test(body),
    previewFixtureCopy: /sanitized fixture|synthetic preview/iu.test(body),
    screenshotSha256: sha256(await readFile(screenshotPath)),
  };

  const denialContext = await browser.newContext({ serviceWorkers: 'block' });
  const denialPage = await denialContext.newPage();
  try {
    await denialPage.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 45_000 });
    report.unauthenticatedDenial = await denialPage.evaluate(async () => {
      const response = await fetch('/api/getEventManagement', {
        method: 'POST',
        headers: { accept: 'application/json', 'content-type': 'application/json' },
        body: '{}',
      });
      const payload = await response.json().catch(() => null);
      return {
        status: response.status,
        denied: [401, 403].includes(response.status),
        code: String(payload?.error?.code ?? payload?.code ?? ''),
        recordShapeExposed:
          Array.isArray(payload?.eventSeries) ||
          Array.isArray(payload?.eventDays) ||
          Array.isArray(payload?.activities),
      };
    });
  } finally {
    await denialContext.close();
  }
} finally {
  await context.close();
  await browser.close();
}

await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
console.log('P09 fresh-browser Events audit: COMPLETE');
console.log('Screenshot and aggregate report remain private; no credentials or row identities were printed.');
