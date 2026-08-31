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
const reportPath = await privateNew(process.argv[3], 'P10 audit report');
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
  endpointCounts: {},
  tabs: {},
  unauthenticatedDenial: {},
  consoleErrors,
  failedRequests,
};

async function screenshotTab(tab) {
  await page.waitForTimeout(900);
  const body = (await page.locator('body').innerText()).toLowerCase();
  const screenshotPath = path.join(
    screenshotDirectory,
    `${tab.toLowerCase().replace(/[^a-z0-9]+/gu, '-')}.png`,
  );
  await page.screenshot({ path: screenshotPath, fullPage: true });
  report.tabs[tab] = {
    tabSelected: await page
      .getByRole('button', { name: tab, exact: true })
      .getAttribute('aria-current')
      .then((value) => value === 'page')
      .catch(() => false),
    contentVisible: await page
      .locator('[data-fi11-administration="true"] h2')
      .first()
      .isVisible()
      .catch(() => false),
    loadingVisible: await page
      .locator('[aria-busy="true"]')
      .first()
      .isVisible()
      .catch(() => false),
    alertCount: await page.locator('[role="alert"]').count(),
    deniedCopy: /is not available to your account|access administration is not available/iu.test(body),
    unavailableCopy: /temporarily unavailable/iu.test(body),
    previewFixtureCopy: /sanitized fixture|synthetic preview/iu.test(body),
    disabledMutationVisible: (await page.locator('button:disabled').count()) > 0,
    screenshotSha256: sha256(await readFile(screenshotPath)),
  };
}

async function selectTab(tab) {
  await page.getByRole('button', { name: tab, exact: true }).click();
}

try {
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 45_000 });
  await page.waitForTimeout(1_500);
  const staffSignIn = page.getByRole('button', { name: 'Staff sign in', exact: true }).first();
  const staffSignInVisible = await staffSignIn.isVisible({ timeout: 10_000 }).catch(() => false);
  if (staffSignInVisible) await staffSignIn.click();
  const enter = page.getByRole('button', { name: 'Enter Playground' });
  const entryVisible = await enter.isVisible({ timeout: 10_000 }).catch(() => false);
  let sessionResponseStatus = 0;
  let sessionProjection = {
    authenticated: false,
    systemOwner: false,
    accessAdmin: false,
    referenceManage: false,
    brandManage: false,
    systemAdmin: false,
  };
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
    const capabilities = Array.isArray(authorization.capabilities) ? authorization.capabilities : [];
    sessionProjection = {
      authenticated: sessionPayload?.state === 'AUTHENTICATED',
      systemOwner: authorization.roleId === 'SYSTEM_OWNER',
      accessAdmin: capabilities.includes('access.admin'),
      referenceManage: capabilities.includes('reference.manage'),
      brandManage: capabilities.includes('brand.manage'),
      systemAdmin: capabilities.includes('system.admin'),
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

  const accountResponsePromise = page.waitForResponse(
    (response) => new URL(response.url()).pathname === '/api/admin/access/directory',
    { timeout: 30_000 },
  );
  const directoryResponsePromise = page.waitForResponse(
    (response) => new URL(response.url()).pathname === '/api/admin/staff-directory',
    { timeout: 30_000 },
  );
  const navigation = page
    .getByRole('button', { name: /^administration$/iu })
    .or(page.getByRole('link', { name: /^administration$/iu }))
    .first();
  const navigationVisible = await navigation.isVisible().catch(() => false);
  if (navigationVisible) await navigation.click();
  const [accountResponse, directoryResponse] = await Promise.all([
    accountResponsePromise,
    directoryResponsePromise,
  ]);
  const accountPayload = await accountResponse.json().catch(() => null);
  const directoryPayload = await directoryResponse.json().catch(() => null);
  report.endpointCounts.accounts = {
    status: accountResponse.status(),
    total: Number(accountPayload?.total ?? accountPayload?.pagination?.total ?? 0),
    items: Array.isArray(accountPayload?.items) ? accountPayload.items.length : 0,
  };
  report.endpointCounts.directory = {
    status: directoryResponse.status(),
    total: Number(directoryPayload?.total ?? 0),
    items: Array.isArray(directoryPayload?.items) ? directoryPayload.items.length : 0,
  };
  report.session.administrationNavigationVisible = navigationVisible;
  await screenshotTab('Accounts & access');

  await selectTab('Staff directory');
  await screenshotTab('Staff directory');

  const openStaffRecord = page.locator('[data-administration-staff-open]').first();
  const openStaffRecordVisible = await openStaffRecord.isVisible().catch(() => false);
  let activityResponse = null;
  if (openStaffRecordVisible) {
    await openStaffRecord.click();
    const reviewActivity = page
      .locator('.administration-records-inspector:visible')
      .getByRole('button', { name: 'Review retained activity' });
    const activityResponsePromise = page.waitForResponse(
      (response) => new URL(response.url()).pathname === '/api/admin/staff-account-activity-history',
      { timeout: 30_000 },
    );
    await reviewActivity.click();
    activityResponse = await activityResponsePromise;
  } else {
    await selectTab('Activity');
  }
  const activityPayload = activityResponse ? await activityResponse.json().catch(() => null) : null;
  report.endpointCounts.activity = {
    triggerVisible: openStaffRecordVisible,
    status: activityResponse?.status() ?? 0,
    total: Number(activityPayload?.total ?? 0),
    items: Array.isArray(activityPayload?.items) ? activityPayload.items.length : 0,
  };
  await screenshotTab('Activity');

  await selectTab('Reference administration');
  await screenshotTab('Reference administration');
  report.tabs['Reference administration'].truthfulContractGap = await page
    .getByText('Reference-set data is not available in this frontend contract', { exact: true })
    .isVisible()
    .catch(() => false);

  const linkResponsePromise = page.waitForResponse(
    (response) => new URL(response.url()).pathname === '/api/admin/reference-links/list',
    { timeout: 30_000 },
  );
  await selectTab('Link registry');
  const linkResponse = await linkResponsePromise;
  const linkPayload = await linkResponse.json().catch(() => null);
  report.endpointCounts.links = {
    status: linkResponse.status(),
    items: Array.isArray(linkPayload?.items) ? linkPayload.items.length : 0,
  };
  await screenshotTab('Link registry');

  const brandResponsePromise = page.waitForResponse(
    (response) => new URL(response.url()).pathname === '/api/owner/brand-assets/list',
    { timeout: 30_000 },
  );
  await selectTab('Brand & media');
  const brandResponse = await brandResponsePromise;
  const brandPayload = await brandResponse.json().catch(() => null);
  report.endpointCounts.brand = {
    status: brandResponse.status(),
    slots: Array.isArray(brandPayload?.slots) ? brandPayload.slots.length : 0,
  };
  await screenshotTab('Brand & media');

  const healthResponsePromise = page.waitForResponse(
    (response) => new URL(response.url()).pathname === '/api/health',
    { timeout: 30_000 },
  );
  const readinessResponsePromise = page.waitForResponse(
    (response) => new URL(response.url()).pathname === '/api/readiness',
    { timeout: 30_000 },
  );
  await selectTab('System status');
  const healthResponse = await healthResponsePromise;
  const readinessResponse = await readinessResponsePromise;
  const readinessPayload = await readinessResponse.json().catch(() => null);
  report.endpointCounts.system = {
    healthStatus: healthResponse.status(),
    readinessStatus: readinessResponse.status(),
    ready: readinessPayload?.ready === true,
  };
  await screenshotTab('System status');

  const denialContext = await browser.newContext({ serviceWorkers: 'block' });
  const denialPage = await denialContext.newPage();
  try {
    await denialPage.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 45_000 });
    report.unauthenticatedDenial = await denialPage.evaluate(async () => {
      const response = await fetch('/api/admin/access/directory', {
        method: 'POST',
        headers: { accept: 'application/json', 'content-type': 'application/json' },
        body: '{}',
      });
      const payload = await response.json().catch(() => null);
      return {
        status: response.status,
        denied: [401, 403].includes(response.status),
        code: String(payload?.error?.code ?? payload?.code ?? ''),
        recordShapeExposed: Array.isArray(payload?.items),
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
console.log('P10 fresh-browser Administration audit: COMPLETE');
console.log(
  'Screenshots and aggregate report remain private; no credentials or row identities were printed.',
);
