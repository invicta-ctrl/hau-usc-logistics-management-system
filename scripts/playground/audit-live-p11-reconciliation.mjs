import { spawnSync } from 'node:child_process';
import { readFile, realpath, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';
import { d1Rows } from './reset-workspace.mjs';

const repoRoot = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));
const wranglerBin = path.join(repoRoot, 'node_modules', 'wrangler', 'bin', 'wrangler.js');

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

function requireCondition(condition, label) {
  if (!condition) throw new Error(`P11 reconciliation failed: ${label}.`);
}

function codeOf(payload) {
  return String(payload?.error?.code ?? payload?.code ?? 'UNKNOWN');
}

function requireStatus(result, label, expected = 200) {
  if (result.status !== expected) {
    throw new Error(`${label} failed (${result.status}:${codeOf(result.payload)}).`);
  }
  return result.payload;
}

function wrangler(args, { json = false } = {}) {
  const result = spawnSync(process.execPath, [wranglerBin, ...args], {
    cwd: repoRoot,
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
    windowsHide: true,
  });
  if (result.status !== 0) throw new Error('P11 private D1 reconciliation failed.');
  return json ? JSON.parse(result.stdout) : result.stdout;
}

const manifestPath = await privateExisting(process.argv[2], 'Playground resource manifest');
const reportPath = await privateNew(process.argv[3], 'P11 reconciliation report');
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
const databaseId = manifest.d1?.databaseId;
const databaseName = manifest.resources?.names?.d1Working;
requireCondition(databaseId && databaseName, 'fixed D1 identity is present');
const inventory = wrangler(['d1', 'list', '--json'], { json: true });
const exactDatabase = inventory.find((entry) => entry.name === databaseName);
requireCondition((exactDatabase?.uuid ?? exactDatabase?.id) === databaseId, 'fixed D1 identity matches');

const baseUrl = `https://${hostname}`;
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  colorScheme: 'light',
  serviceWorkers: 'block',
});
const page = await context.newPage();
let csrfToken = '';
let consoleErrorCount = 0;
const failedRequestPaths = [];
page.on('console', (message) => {
  if (message.type() === 'error') consoleErrorCount += 1;
});
page.on('requestfailed', (request) => {
  failedRequestPaths.push(`${request.method()} ${new URL(request.url()).pathname}`);
});

async function api(pathValue, { method = 'GET', body, csrf = false } = {}) {
  return page.evaluate(
    async ({ pathValue: endpoint, method: requestMethod, body: requestBody, csrf, token }) => {
      const headers = { accept: 'application/json' };
      if (requestBody !== undefined) headers['content-type'] = 'application/json';
      if (csrf) headers['x-csrf-token'] = token;
      const response = await fetch(endpoint, {
        method: requestMethod,
        headers,
        credentials: 'include',
        ...(requestBody !== undefined ? { body: JSON.stringify(requestBody) } : {}),
      });
      return { status: response.status, payload: await response.json().catch(() => null) };
    },
    { pathValue, method, body, csrf, token: csrfToken },
  );
}

const get = (pathValue) => api(pathValue);
const post = (pathValue, body = {}) => api(pathValue, { method: 'POST', body, csrf: true });
async function bootstrap(module) {
  return requireStatus(await get(`/api/bootstrap/${module}?page=1&pageSize=50`), `${module} bootstrap`);
}

const report = {
  status: 'RECONCILIATION_IN_PROGRESS',
  capturedAt: '',
  target: 'PLAYGROUND',
  isolatedManifestTarget: true,
  freshContext: true,
  productionMutation: 'NONE',
  googleMutation: 'NONE',
  playgroundMutation: 'ADMINISTRATION_COMPLETION_ONLY',
  priorAttemptDisposition: {
    attemptA: 'VALIDATION_STOP_BEFORE_BUSINESS_ROW',
    attemptB: 'PARTIAL_EVIDENCE_PRESERVED',
    attemptC: 'BUSINESS_WORKFLOWS_COMPLETE_ADMIN_REVISION_STOP',
  },
  authorization: {},
  workflows: {},
  idempotency: {},
  administration: {},
  unauthenticatedDenial: {},
  runtime: {},
  browserDiagnostics: {},
};

try {
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 45_000 });
  await page.waitForTimeout(1_000);
  const staffSignIn = page.getByRole('button', { name: 'Staff sign in', exact: true }).first();
  if (await staffSignIn.isVisible().catch(() => false)) await staffSignIn.click();
  const enter = page.getByRole('button', { name: 'Enter Playground' });
  await enter.waitFor({ state: 'visible', timeout: 30_000 });
  const sessionResponsePromise = page.waitForResponse(
    (response) => new URL(response.url()).pathname === '/api/playground/session',
    { timeout: 30_000 },
  );
  await enter.click();
  const sessionResponse = await sessionResponsePromise;
  const session = await sessionResponse.json().catch(() => null);
  csrfToken = String(session?.csrfToken ?? '');
  const authorization = session?.user?.authorization ?? {};
  requireCondition(sessionResponse.status() === 200 && csrfToken, 'authenticated session');
  requireCondition(authorization.roleId === 'SYSTEM_OWNER', 'System Owner role');
  report.authorization = {
    authenticated: session?.state === 'AUTHENTICATED',
    systemOwner: true,
    capabilityCount: Array.isArray(authorization.capabilities) ? authorization.capabilities.length : 0,
  };

  const evidenceStatus = requireStatus(await post('/api/owner/evidence/status', {}), 'evidence status');
  requireCondition(evidenceStatus?.storage?.googleDrive !== 'CONFIGURED', 'Google Drive remains disabled');
  requireCondition(evidenceStatus?.storage?.evidenceR2 === 'AVAILABLE', 'evidence R2 remains available');

  const [requests, releases, inventoryModule, restocking, lending, procurement, events] = await Promise.all([
    bootstrap('request'),
    bootstrap('release'),
    bootstrap('inventory'),
    bootstrap('restocking'),
    bootstrap('lending'),
    bootstrap('procurement'),
    post('/api/getEventManagement', {}).then((result) => requireStatus(result, 'event management')),
  ]);
  const p11Requests = requests.data.requests.filter((entry) => /^P11 /u.test(String(entry.purpose ?? '')));
  const requestStatusCounts = Object.fromEntries(
    [...new Set(p11Requests.map((entry) => entry.status))]
      .sort()
      .map((status) => [status, p11Requests.filter((entry) => entry.status === status).length]),
  );
  const p11Releases = releases.data.releaseConfirmations.filter(
    (entry) => entry.recipientName === 'Playground P11 Recipient',
  );
  const p11Ledger = inventoryModule.data.ledgerTransactions.filter((entry) =>
    String(entry.notes ?? '').startsWith('P11 isolated'),
  );
  const p11RestockReceipts = restocking.data.restockRecords.filter((entry) =>
    String(entry.notes ?? '').startsWith('P11 isolated'),
  );
  const completedRestock = restocking.data.restockRequests.find(
    (entry) => entry.id === 'PGBL-V2-RST-PARTIAL' && entry.status === 'RECEIVED',
  );
  const p11Lending = lending.data.lendingTickets.filter((entry) =>
    /^P11 lending lifecycle /u.test(String(entry.purpose ?? '')),
  );
  const returnedLending = p11Lending.find(
    (entry) =>
      entry.status === 'RETURNED' &&
      ['READY_TO_CLAIM', 'ON_LOAN', 'RETURNED'].every((status) =>
        entry.history.some((history) => history.newStatus === status),
      ),
  );
  const procurementRequestIds = new Set(
    procurement.data.requests
      .filter((entry) => /^P11 procurement lifecycle /u.test(String(entry.purpose ?? '')))
      .map((entry) => entry.id),
  );
  const procurementLines = procurement.data.requestLines.filter((entry) =>
    procurementRequestIds.has(entry.requestId),
  );
  const procurementLineIds = new Set(procurementLines.map((entry) => entry.id));
  const readyDeliverables = procurement.data.deliverables.filter(
    (entry) => procurementLineIds.has(entry.requestLineId) && entry.status === 'READY_TO_RELEASE',
  );
  const readyDeliverableIds = new Set(readyDeliverables.map((entry) => entry.id));
  const preferredCanvasses = procurement.data.canvassReferences.filter(
    (entry) =>
      entry.preferred === true &&
      (readyDeliverableIds.has(entry.linkedDeliverableId) ||
        entry.linkedLineIds?.some((lineId) => procurementLineIds.has(lineId))),
  );
  const p11EventLinks = events.links.filter((entry) =>
    String(entry.notes ?? '').includes('Synthetic Playground-only operational relationship'),
  );
  requireCondition((requestStatusCounts.COMPLETED ?? 0) >= 4, 'completed request workflows');
  requireCondition((requestStatusCounts.REJECTED ?? 0) >= 2, 'rejected request workflows');
  requireCondition(p11Releases.filter((entry) => entry.status === 'PARTIAL').length >= 2, 'partial releases');
  requireCondition(
    p11Releases.filter((entry) => entry.status === 'COMPLETED').length >= 4,
    'full/final releases',
  );
  requireCondition(
    ['CYCLE_COUNT_ADJUSTMENT', 'RECEIVE', 'LOAN_OUT', 'LOAN_RETURN'].every((type) =>
      p11Ledger.some((entry) => entry.transactionType === type),
    ),
    'inventory ledger consequences',
  );
  requireCondition(completedRestock && p11RestockReceipts.length >= 2, 'restock completion');
  requireCondition(returnedLending, 'lending lifecycle and history');
  requireCondition(readyDeliverables.length >= 1 && preferredCanvasses.length >= 1, 'procurement lifecycle');
  requireCondition(p11EventLinks.length >= 1, 'event relationship');
  report.workflows = {
    p11RequestCount: p11Requests.length,
    requestStatusCounts,
    partialReleaseCount: p11Releases.filter((entry) => entry.status === 'PARTIAL').length,
    completedReleaseCount: p11Releases.filter((entry) => entry.status === 'COMPLETED').length,
    cycleAdjustmentLedgerCount: p11Ledger.filter(
      (entry) => entry.transactionType === 'CYCLE_COUNT_ADJUSTMENT',
    ).length,
    receiveLedgerCount: p11Ledger.filter((entry) => entry.transactionType === 'RECEIVE').length,
    restockReceiptCount: p11RestockReceipts.length,
    restockCompleted: Boolean(completedRestock),
    lendingReturnedCount: p11Lending.filter((entry) => entry.status === 'RETURNED').length,
    lendingHistoryVerified: Boolean(returnedLending),
    procurementReadyCount: readyDeliverables.length,
    preferredCanvassCount: preferredCanvasses.length,
    eventLinkCount: p11EventLinks.length,
  };

  const directory = requireStatus(
    await post('/api/admin/access/directory', { page: 1, pageSize: 50, status: 'ACTIVE' }),
    'access directory',
  );
  const activeAccount = directory.items.find((entry) => entry.status === 'ACTIVE');
  requireCondition(activeAccount?.accountId && activeAccount?.revision, 'revisioned active account');
  const accessCommand = {
    accountId: activeAccount.accountId,
    expectedRevision: activeAccount.revision,
    status: 'ACTIVE',
    reason: 'P11 isolated account status no-op proof.',
    clientRequestId: `p11-access-noop-${crypto.randomUUID()}`,
  };
  const accessNoop = requireStatus(await post('/api/admin/access/status', accessCommand), 'access no-op');
  const accessReplay = requireStatus(
    await post('/api/admin/access/status', accessCommand),
    'access no-op replay',
  );
  requireCondition(
    accessNoop.changed === false && accessReplay.replayed === true,
    'access no-op idempotency',
  );

  const referenceCommand = {
    label: 'Playground P11 reconciliation reference',
    linkType: 'EXTERNAL_URL',
    url: 'https://example.invalid/p11-reconciliation',
    audience: 'ADMINISTRATOR',
    reason: 'P11 isolated reference lifecycle reconciliation.',
    clientRequestId: `p11-reference-create-${crypto.randomUUID()}`,
  };
  const referenceCreated = requireStatus(
    await post('/api/admin/reference-links/create', referenceCommand),
    'reference create',
  );
  const referenceReplay = requireStatus(
    await post('/api/admin/reference-links/create', referenceCommand),
    'reference create replay',
  );
  const referenceArchived = requireStatus(
    await post('/api/admin/reference-links/transition', {
      id: referenceCreated.link.id,
      expectedRevision: referenceCreated.link.revision,
      status: 'ARCHIVED',
      reason: 'P11 isolated reference reconciliation cleanup.',
      clientRequestId: `p11-reference-archive-${crypto.randomUUID()}`,
    }),
    'reference archive',
  );
  const referenceHistory = requireStatus(
    await post('/api/admin/reference-links/history', {
      id: referenceCreated.link.id,
      page: 1,
      pageSize: 20,
    }),
    'reference history',
  );
  requireCondition(referenceReplay.replayed === true, 'reference create idempotency');
  requireCondition(referenceArchived.link.status === 'ARCHIVED', 'reference archived');
  requireCondition(referenceHistory.items.length >= 2, 'reference history');
  report.administration = {
    accountStatusNoop: accessNoop.changed === false,
    accountStatusReplay: accessReplay.replayed === true,
    referenceCreatedDraft: referenceCreated.link.status === 'DRAFT',
    referenceCreateReplay: referenceReplay.replayed === true,
    referenceArchived: referenceArchived.link.status === 'ARCHIVED',
    referenceHistoryEntries: referenceHistory.items.length,
    systemMutation: 'NONE',
  };

  const denialContext = await browser.newContext({ serviceWorkers: 'block' });
  try {
    const denialPage = await denialContext.newPage();
    await denialPage.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 45_000 });
    report.unauthenticatedDenial = await denialPage.evaluate(async () => {
      const response = await fetch('/api/postCycleCountAdjustment', {
        method: 'POST',
        headers: { accept: 'application/json', 'content-type': 'application/json' },
        body: JSON.stringify({}),
      });
      return { status: response.status, denied: [401, 403].includes(response.status) };
    });
  } finally {
    await denialContext.close();
  }
  requireCondition(report.unauthenticatedDenial.denied, 'unauthenticated mutation denial');

  const idempotencySql = `SELECT
    SUM(CASE WHEN scope = 'confirmRelease' AND idempotency_key LIKE 'p11-%' THEN 1 ELSE 0 END) AS confirm_release,
    SUM(CASE WHEN scope = 'postCycleCountAdjustment' AND idempotency_key LIKE 'p11-%' THEN 1 ELSE 0 END) AS cycle_adjustment,
    SUM(CASE WHEN scope = 'receiveRestock' AND idempotency_key LIKE 'p11-%' THEN 1 ELSE 0 END) AS receive_restock,
    SUM(CASE WHEN scope = 'approveLendingTicket' AND idempotency_key LIKE 'p11-%' THEN 1 ELSE 0 END) AS lending_approve,
    SUM(CASE WHEN scope = 'confirmLendingHandoff' AND idempotency_key LIKE 'p11-%' THEN 1 ELSE 0 END) AS lending_handoff,
    SUM(CASE WHEN scope = 'confirmReturn' AND idempotency_key LIKE 'p11-%' THEN 1 ELSE 0 END) AS lending_return,
    SUM(CASE WHEN scope = 'saveCanvassReference' AND idempotency_key LIKE 'p11-%' THEN 1 ELSE 0 END) AS canvass_save,
    SUM(CASE WHEN scope = 'selectPreferredCanvass' AND idempotency_key LIKE 'p11-%' THEN 1 ELSE 0 END) AS canvass_preferred,
    SUM(CASE WHEN scope = 'transitionDeliverable' AND idempotency_key LIKE 'p11-%' THEN 1 ELSE 0 END) AS deliverable_transition,
    SUM(CASE WHEN scope = 'linkEventOperationalRecord' AND idempotency_key LIKE 'p11-%' THEN 1 ELSE 0 END) AS event_link,
    SUM(CASE WHEN scope = 'access-set-account-status' AND idempotency_key LIKE 'p11-%' THEN 1 ELSE 0 END) AS access_status,
    SUM(CASE WHEN scope LIKE 'reference-link:%:CREATE' AND idempotency_key LIKE 'p11-%' THEN 1 ELSE 0 END) AS reference_create,
    (SELECT COUNT(*) FROM pragma_foreign_key_check) AS foreign_key_violations
  FROM idempotency_keys;`;
  const idempotency = d1Rows(
    wrangler(['d1', 'execute', databaseId, '--remote', '--command', idempotencySql, '--json'], {
      json: true,
    }),
  )[0];
  requireCondition(Number(idempotency.confirm_release) >= 6, 'release idempotency receipts');
  requireCondition(Number(idempotency.cycle_adjustment) >= 2, 'cycle-count idempotency receipts');
  requireCondition(Number(idempotency.receive_restock) >= 2, 'restock idempotency receipts');
  requireCondition(Number(idempotency.lending_approve) >= 1, 'lending approval idempotency receipt');
  requireCondition(Number(idempotency.deliverable_transition) >= 4, 'procurement transition receipts');
  requireCondition(Number(idempotency.foreign_key_violations) === 0, 'foreign keys');
  report.idempotency = Object.fromEntries(
    Object.entries(idempotency).map(([key, entry]) => [key, Number(entry)]),
  );

  const health = requireStatus(await get('/api/health'), 'health');
  const readiness = requireStatus(await get('/api/readiness'), 'readiness');
  requireCondition(readiness.ready === true, 'runtime readiness');
  report.runtime = {
    health: String(health.status ?? 'AVAILABLE'),
    ready: true,
    evidenceR2: String(evidenceStatus.storage.evidenceR2),
    googleDrive: String(evidenceStatus.storage.googleDrive),
    foreignKeyViolations: Number(idempotency.foreign_key_violations),
  };
  report.browserDiagnostics = {
    consoleErrorCount,
    failedRequestCount: failedRequestPaths.length,
    failedRequestPaths: [...new Set(failedRequestPaths)].sort(),
  };
  report.status = 'AUDIT_COMPLETE';
  report.capturedAt = new Date().toISOString();
} finally {
  await context.close();
  await browser.close();
}

await writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`, { flag: 'wx', mode: 0o600 });
console.log('P11 live reconciliation and Administration completion: COMPLETE');
console.log(
  'Aggregate report remains private; no credentials, provider IDs, or row identities were printed.',
);
