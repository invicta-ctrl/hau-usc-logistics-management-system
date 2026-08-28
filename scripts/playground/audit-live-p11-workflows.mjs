import { randomUUID } from 'node:crypto';
import { readFile, realpath, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const repoRoot = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));
const PNG_BASE64 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
const REQUIRED_CAPABILITIES = Object.freeze([
  'view.request',
  'view.inventory',
  'request.review',
  'request.reject',
  'fulfillment.canvass',
  'fulfillment.procure',
  'fulfillment.reserve',
  'fulfillment.receive',
  'fulfillment.release',
  'lending.approve',
  'lending.handoff',
  'lending.return',
  'inventory.adjust',
  'event.manage',
  'access.admin',
  'reference.manage',
  'system.admin',
  'evidence.upload',
]);

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

function value(row, camel, snake = camel) {
  return row?.[camel] ?? row?.[snake];
}

function codeOf(payload) {
  return String(payload?.error?.code ?? payload?.code ?? 'UNKNOWN');
}

function requireCondition(condition, label) {
  if (!condition) throw new Error(`P11 verification failed: ${label}.`);
}

function requireStatus(result, label, expected = 200) {
  if (result.status !== expected) {
    throw new Error(`${label} failed (${result.status}:${codeOf(result.payload)}).`);
  }
  return result.payload;
}

function retryKey(label) {
  return `p11-${label}-${randomUUID()}`;
}

function dateOffset(days) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

const manifestPath = await privateExisting(process.argv[2], 'Playground resource manifest');
const reportPath = await privateNew(process.argv[3], 'P11 audit report');
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
const report = {
  status: 'AUDIT_IN_PROGRESS',
  capturedAt: '',
  target: 'PLAYGROUND',
  isolatedManifestTarget: true,
  freshContext: true,
  productionMutation: 'NONE',
  googleMutation: 'NONE',
  playgroundMutation: 'ISOLATED_WORKFLOW_PROOF',
  preflight: {},
  authorization: {},
  requests: {},
  inventory: {},
  restocking: {},
  lending: {},
  procurement: {},
  events: {},
  administration: {},
  unauthenticatedDenial: {},
  finalReadback: {},
  browserDiagnostics: {},
};

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  colorScheme: 'light',
  serviceWorkers: 'block',
});
const page = await context.newPage();
let consoleErrorCount = 0;
const failedRequestPaths = [];
page.on('console', (message) => {
  if (message.type() === 'error') consoleErrorCount += 1;
});
page.on('requestfailed', (request) => {
  failedRequestPaths.push(`${request.method()} ${new URL(request.url()).pathname}`);
});

let csrfToken = '';

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
      return {
        status: response.status,
        payload: await response.json().catch(() => null),
      };
    },
    { pathValue, method, body, csrf, token: csrfToken },
  );
}

const get = (pathValue) => api(pathValue);
const post = (pathValue, body = {}) => api(pathValue, { method: 'POST', body, csrf: true });

async function bootstrap(module, pageSize = 50) {
  const payload = requireStatus(
    await get(`/api/bootstrap/${module}?page=1&pageSize=${pageSize}`),
    `${module} bootstrap`,
  );
  requireCondition(payload?.data && typeof payload.data === 'object', `${module} bootstrap contract`);
  return payload;
}

async function uploadEvidence({ evidenceType, relatedEntityType, relatedEntityId, scope = {} }) {
  const payload = requireStatus(
    await post('/api/uploadEvidence', {
      evidenceType,
      relatedEntityType,
      relatedEntityId,
      ...scope,
      originalFileName: `p11-${evidenceType.toLowerCase().replaceAll('_', '-')}.png`,
      mimeType: 'image/png',
      base64: PNG_BASE64,
      clientRequestId: retryKey(`evidence-${evidenceType.toLowerCase()}`),
    }),
    `${evidenceType} upload`,
  );
  requireCondition(payload?.evidenceId && payload?.uploadStatus === 'VERIFIED', `${evidenceType} verified`);
  return payload.evidenceId;
}

async function submitPublicRequest({ marker, itemId, quantity, event }) {
  return requireStatus(
    await api('/api/public/request', {
      method: 'POST',
      body: {
        clientRequestId: retryKey('public-request'),
        requesterName: 'Playground P11 Synthetic Requester',
        organization: 'HAU-USC Logistics Playground',
        requesterType: 'HAU office / department',
        email: 'p11-requester@example.invalid',
        contactNumber: '+63 917 000 0040',
        purpose: marker,
        requestPurpose: 'EVENT_ACTIVITY_SUPPORT',
        eventSeriesId: event.seriesId,
        eventId: event.id,
        location: event.venue || 'Playground',
        dataUseAcknowledged: true,
        acceptableUseAcknowledged: true,
        evidenceConsentAcknowledged: true,
        lines: [{ category: 'Inventory Item', itemId, quantity }],
      },
    }),
    `public request ${marker}`,
  );
}

async function requestAndLine(requestId) {
  const payload = await bootstrap('request');
  const request = payload.data.requests.find((row) => row.id === requestId);
  const lines = payload.data.requestLines.filter((row) => row.requestId === requestId);
  requireCondition(request && lines.length === 1, 'request and single line projected');
  return { request, line: lines[0] };
}

async function acceptStock(requestId, line, quantity, label) {
  const review = requireStatus(
    await post('/api/reviewRequest', {
      requestId,
      decision: 'ACCEPT',
      lineDecisions: [{ lineId: line.id, decision: 'ISSUE_FROM_STOCK' }],
      note: `P11 isolated ${label} stock acceptance.`,
      clientRequestId: retryKey(`${label}-review`),
    }),
    `${label} review`,
  );
  const reserve = requireStatus(
    await post('/api/reserveStock', {
      itemId: line.itemId,
      requestLineId: line.id,
      quantity,
      clientRequestId: retryKey(`${label}-reserve`),
    }),
    `${label} reserve`,
  );
  return { review, reserve };
}

async function releaseEvidence(requestId, label) {
  return uploadEvidence({
    evidenceType: 'RELEASE_CONFIRMATION_PHOTO',
    relatedEntityType: 'RELEASE_REQUEST',
    relatedEntityId: requestId,
    scope: { requestId, marker: label },
  });
}

try {
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 45_000 });
  await page.waitForTimeout(1_000);
  const staffSignIn = page.getByRole('button', { name: 'Staff sign in', exact: true }).first();
  if (await staffSignIn.isVisible({ timeout: 10_000 }).catch(() => false)) await staffSignIn.click();
  const enter = page.getByRole('button', { name: 'Enter Playground' });
  await enter.waitFor({ state: 'visible', timeout: 30_000 });
  requireCondition(await enter.isVisible(), 'Playground entry available');
  const sessionResponsePromise = page.waitForResponse(
    (response) => new URL(response.url()).pathname === '/api/playground/session',
    { timeout: 30_000 },
  );
  await enter.click();
  const sessionResponse = await sessionResponsePromise;
  const sessionPayload = await sessionResponse.json().catch(() => null);
  csrfToken = String(sessionPayload?.csrfToken ?? '');
  const authorization = sessionPayload?.user?.authorization ?? {};
  const capabilities = Array.isArray(authorization.capabilities) ? authorization.capabilities : [];
  const missingCapabilities = REQUIRED_CAPABILITIES.filter((entry) => !capabilities.includes(entry));
  requireCondition(sessionResponse.status() === 200 && csrfToken, 'authenticated Playground session');
  requireCondition(authorization.roleId === 'SYSTEM_OWNER', 'System Owner role');
  requireCondition(missingCapabilities.length === 0, 'required System Owner capabilities');
  report.authorization = {
    authenticated: sessionPayload?.state === 'AUTHENTICATED',
    systemOwner: authorization.roleId === 'SYSTEM_OWNER',
    requiredCapabilityCount: REQUIRED_CAPABILITIES.length,
    missingCapabilityCount: missingCapabilities.length,
  };

  const evidenceStatus = requireStatus(await post('/api/owner/evidence/status', {}), 'evidence preflight');
  const googleDrive = String(evidenceStatus?.storage?.googleDrive ?? 'UNKNOWN');
  const evidenceR2 = String(evidenceStatus?.storage?.evidenceR2 ?? 'UNKNOWN');
  if (googleDrive === 'CONFIGURED') {
    throw new Error('P11 fail-closed gate: Google Drive is configured; no business mutation was attempted.');
  }
  requireCondition(evidenceR2 === 'AVAILABLE', 'private R2 evidence storage available');
  report.preflight = {
    evidenceStatus: 'AVAILABLE',
    evidenceR2,
    googleDrive,
    googleMutationAllowed: false,
    businessMutationGate: 'OPEN',
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
      const payload = await response.json().catch(() => null);
      return {
        status: response.status,
        denied: [401, 403].includes(response.status),
        code: String(payload?.error?.code ?? payload?.code ?? ''),
        mutationReceiptExposed: Boolean(payload?.transactionId || payload?.changed),
      };
    });
  } finally {
    await denialContext.close();
  }
  requireCondition(report.unauthenticatedDenial.denied, 'unauthenticated mutation denied');

  const options = requireStatus(await get('/api/public/request/options'), 'public request options');
  const inventoryBaseline = await bootstrap('inventory');
  const event = options.events.find(
    (entry) =>
      entry?.id && entry?.seriesId && options.eventSeries.some((series) => series.id === entry.seriesId),
  );
  const stockItem = [...inventoryBaseline.data.inventoryItems]
    .filter((entry) => Number(entry.availableToPromise) >= 8 && entry.status === 'ACTIVE')
    .sort((left, right) => Number(right.availableToPromise) - Number(left.availableToPromise))[0];
  requireCondition(event && stockItem, 'event and stock fixtures available');

  const partialMarker = `P11 partial release ${randomUUID()}`;
  const partialSubmission = await submitPublicRequest({
    marker: partialMarker,
    itemId: stockItem.id,
    quantity: 2,
    event,
  });
  const partialRecord = await requestAndLine(partialSubmission.requestId);
  const partialRoute = await acceptStock(partialSubmission.requestId, partialRecord.line, 2, 'partial');
  const partialEvidenceId = await releaseEvidence(partialSubmission.requestId, 'partial');
  const partialCommand = {
    requestId: partialSubmission.requestId,
    recipientConfirmed: true,
    recipientName: 'Playground P11 Recipient',
    recipientRole: 'Synthetic verifier',
    department: 'Department of Logistics',
    evidenceId: partialEvidenceId,
    lines: [{ requestLineId: partialRecord.line.id, quantity: 1 }],
    notes: 'P11 isolated partial release.',
    clientRequestId: retryKey('partial-release'),
  };
  const partialRelease = requireStatus(await post('/api/confirmRelease', partialCommand), 'partial release');
  const partialReplay = requireStatus(
    await post('/api/confirmRelease', partialCommand),
    'partial release replay',
  );
  const finalRelease = requireStatus(
    await post('/api/confirmRelease', {
      ...partialCommand,
      notes: 'P11 isolated final release.',
      clientRequestId: retryKey('partial-release-final'),
    }),
    'partial scenario final release',
  );
  const partialReadback = await requestAndLine(partialSubmission.requestId);
  requireCondition(partialRelease.status === 'PARTIAL', 'partial release status');
  requireCondition(partialReplay.releaseId === partialRelease.releaseId, 'partial release replay receipt');
  requireCondition(finalRelease.status === 'COMPLETED', 'partial scenario completed');
  requireCondition(
    partialReadback.request.status === 'COMPLETED' && partialReadback.line.status === 'COMPLETED',
    'partial scenario final projection',
  );

  const fullMarker = `P11 full release ${randomUUID()}`;
  const fullSubmission = await submitPublicRequest({
    marker: fullMarker,
    itemId: stockItem.id,
    quantity: 1,
    event,
  });
  const fullRecord = await requestAndLine(fullSubmission.requestId);
  const fullRoute = await acceptStock(fullSubmission.requestId, fullRecord.line, 1, 'full');
  const fullEvidenceId = await releaseEvidence(fullSubmission.requestId, 'full');
  const fullRelease = requireStatus(
    await post('/api/confirmRelease', {
      requestId: fullSubmission.requestId,
      recipientConfirmed: true,
      recipientName: 'Playground P11 Recipient',
      recipientRole: 'Synthetic verifier',
      department: 'Department of Logistics',
      evidenceId: fullEvidenceId,
      lines: [{ requestLineId: fullRecord.line.id, quantity: 1 }],
      notes: 'P11 isolated full release.',
      clientRequestId: retryKey('full-release'),
    }),
    'full release',
  );
  const fullReadback = await requestAndLine(fullSubmission.requestId);
  requireCondition(fullRelease.status === 'COMPLETED', 'full release completed');
  requireCondition(
    fullReadback.request.status === 'COMPLETED' && fullReadback.line.status === 'COMPLETED',
    'full release projection',
  );

  const rejectMarker = `P11 rejected request ${randomUUID()}`;
  const rejectSubmission = await submitPublicRequest({
    marker: rejectMarker,
    itemId: stockItem.id,
    quantity: 1,
    event,
  });
  await requestAndLine(rejectSubmission.requestId);
  const rejected = requireStatus(
    await post('/api/reviewRequest', {
      requestId: rejectSubmission.requestId,
      decision: 'REJECT',
      note: 'P11 isolated rejection proof.',
      clientRequestId: retryKey('reject-review'),
    }),
    'request rejection',
  );
  const rejectReadback = await requestAndLine(rejectSubmission.requestId);
  requireCondition(rejected.status === 'REJECTED', 'rejection receipt');
  requireCondition(
    rejectReadback.request.status === 'REJECTED' && rejectReadback.line.status === 'REJECTED',
    'rejection projection',
  );
  report.requests = {
    publicSubmissions: 3,
    queueProjection: true,
    acceptedStockRoutes: 2,
    rejectedRoutes: 1,
    reserveReceipts: Boolean(partialRoute.reserve.reservationId && fullRoute.reserve.reservationId),
    reviewReceipts: Boolean(partialRoute.review.requestId && fullRoute.review.requestId),
    partialRelease: partialRelease.status === 'PARTIAL',
    partialReplay: partialReplay.releaseId === partialRelease.releaseId,
    partialThenComplete: finalRelease.status === 'COMPLETED',
    fullRelease: fullRelease.status === 'COMPLETED',
    finalRequestStatesVerified: true,
  };

  const inventoryBeforeAdjustment = await bootstrap('inventory');
  const adjustmentItem = inventoryBeforeAdjustment.data.inventoryItems.find(
    (entry) => entry.id === stockItem.id,
  );
  const beforeOnHand = Number(adjustmentItem.onHand);
  const adjustmentCommand = {
    itemId: adjustmentItem.id,
    countedQuantity: beforeOnHand + 1,
    reason: 'P11 isolated cycle-count adjustment proof.',
    clientRequestId: retryKey('cycle-adjustment'),
  };
  const adjustment = requireStatus(
    await post('/api/postCycleCountAdjustment', adjustmentCommand),
    'cycle-count adjustment',
  );
  const adjustmentReplay = requireStatus(
    await post('/api/postCycleCountAdjustment', adjustmentCommand),
    'cycle-count adjustment replay',
  );
  const inventoryAfterAdjustment = await bootstrap('inventory');
  const adjustedItem = inventoryAfterAdjustment.data.inventoryItems.find(
    (entry) => entry.id === stockItem.id,
  );
  const adjustmentLedger = inventoryAfterAdjustment.data.ledgerTransactions.filter(
    (entry) => entry.itemId === stockItem.id && entry.transactionType === 'CYCLE_COUNT_ADJUSTMENT',
  );
  requireCondition(Number(adjustedItem.onHand) === beforeOnHand + 1, 'cycle-count derived quantity');
  requireCondition(adjustmentLedger.length > 0, 'cycle-count ledger entry');
  requireCondition(adjustmentReplay.transactionId === adjustment.transactionId, 'cycle-count replay receipt');
  report.inventory = {
    inspected: true,
    authorizedAdjustment: true,
    onHandDelta: Number(adjustedItem.onHand) - beforeOnHand,
    adjustmentLedgerPresent: adjustmentLedger.length > 0,
    idempotentReplay: adjustmentReplay.transactionId === adjustment.transactionId,
    downstreamRefresh: inventoryAfterAdjustment.scopeRevision !== inventoryBeforeAdjustment.scopeRevision,
  };

  const restockingBefore = await bootstrap('restocking');
  const restock = restockingBefore.data.restockRequests.find((entry) => {
    const requested = Number(value(entry, 'requestedQuantity', 'requested_quantity'));
    const received = Number(value(entry, 'receivedQuantity', 'received_quantity'));
    return (
      entry.status === 'PARTIALLY_RECEIVED' && value(entry, 'itemId', 'item_id') && requested - received > 1
    );
  });
  requireCondition(restock, 'partially received restock fixture');
  const restockId = restock.id;
  const restockItemId = value(restock, 'itemId', 'item_id');
  const restockUnit = value(restock, 'unit');
  const restockRequested = Number(value(restock, 'requestedQuantity', 'requested_quantity'));
  const restockReceived = Number(value(restock, 'receivedQuantity', 'received_quantity'));
  const restockRemaining = restockRequested - restockReceived;
  const restockInventoryBefore = (await bootstrap('inventory')).data.inventoryItems.find(
    (entry) => entry.id === restockItemId,
  );
  const restockEvidenceId = await uploadEvidence({
    evidenceType: 'RESTOCK_RECEIPT',
    relatedEntityType: 'RESTOCK',
    relatedEntityId: restockId,
    scope: { restockId },
  });
  const partialReceiveQuantity = Math.min(2, restockRemaining - 1);
  const partialReceiveCommand = {
    restockRequestId: restockId,
    quantity: partialReceiveQuantity,
    unit: restockUnit,
    evidenceId: restockEvidenceId,
    invoiceStatus: 'RECORDED',
    invoiceNumber: 'P11-SYNTHETIC',
    notes: 'P11 isolated partial restock receipt.',
    clientRequestId: retryKey('restock-partial'),
  };
  const partialReceive = requireStatus(
    await post('/api/receiveRestock', partialReceiveCommand),
    'partial restock receipt',
  );
  const partialReceiveReplay = requireStatus(
    await post('/api/receiveRestock', partialReceiveCommand),
    'partial restock receipt replay',
  );
  const finalReceive = requireStatus(
    await post('/api/receiveRestock', {
      ...partialReceiveCommand,
      quantity: restockRemaining - partialReceiveQuantity,
      notes: 'P11 isolated final restock receipt.',
      clientRequestId: retryKey('restock-final'),
    }),
    'final restock receipt',
  );
  const restockingAfter = await bootstrap('restocking');
  const restockAfter = restockingAfter.data.restockRequests.find((entry) => entry.id === restockId);
  const inventoryAfterRestock = await bootstrap('inventory');
  const restockInventoryAfter = inventoryAfterRestock.data.inventoryItems.find(
    (entry) => entry.id === restockItemId,
  );
  const restockLedger = inventoryAfterRestock.data.ledgerTransactions.filter(
    (entry) => entry.itemId === restockItemId && entry.transactionType === 'RECEIVE',
  );
  requireCondition(partialReceive.status === 'PARTIALLY_RECEIVED', 'restock partial status');
  requireCondition(partialReceiveReplay.receiptId === partialReceive.receiptId, 'restock replay receipt');
  requireCondition(finalReceive.status === 'RECEIVED', 'restock completed receipt');
  requireCondition(
    restockAfter.status === 'RECEIVED' &&
      Number(value(restockAfter, 'receivedQuantity', 'received_quantity')) === restockRequested,
    'restock final projection',
  );
  requireCondition(
    Number(restockInventoryAfter.onHand) - Number(restockInventoryBefore.onHand) === restockRemaining,
    'restock inventory quantity consequence',
  );
  requireCondition(restockLedger.length >= 2, 'restock ledger consequences');
  report.restocking = {
    initialState: 'PARTIALLY_RECEIVED',
    partialReceipt: partialReceive.status === 'PARTIALLY_RECEIVED',
    idempotentReplay: partialReceiveReplay.receiptId === partialReceive.receiptId,
    completedReceipt: finalReceive.status === 'RECEIVED',
    inventoryDelta: Number(restockInventoryAfter.onHand) - Number(restockInventoryBefore.onHand),
    expectedInventoryDelta: restockRemaining,
    receiveLedgerPresent: restockLedger.length >= 2,
  };

  const lendingCatalog = requireStatus(await get('/api/public/lending/catalog'), 'public lending catalog');
  const lendingItem = lendingCatalog.items.find(
    (entry) =>
      entry.type === 'REUSABLE' &&
      ['AVAILABLE', 'LIMITED', 'ELIGIBILITY_REQUIRED'].includes(entry.availability) &&
      Number(entry.maximumQuantity) >= 1,
  );
  requireCondition(lendingItem, 'public reusable lending fixture');
  const lendingMarker = `P11 lending lifecycle ${randomUUID()}`;
  const lendingSubmission = requireStatus(
    await api('/api/public/lending', {
      method: 'POST',
      body: {
        clientRequestId: randomUUID(),
        borrowerType: 'ANGELITE',
        borrowerName: 'Playground P11 Borrower',
        studentId: '12345678',
        courseYear: 'Synthetic',
        academicDepartment: 'Synthetic',
        contactNumber: '+63 917 000 0041',
        email: 'p11-lending@example.invalid',
        pickupDate: dateOffset(1),
        dueDate: dateOffset(8),
        purpose: lendingMarker,
        responsibilityAcknowledged: true,
        dataUseAcknowledged: true,
        acceptableUseAcknowledged: true,
        borrowerResponsibilityAcknowledged: true,
        evidenceConsentAcknowledged: true,
        lines: [{ itemId: lendingItem.id, quantity: 1 }],
      },
    }),
    'public lending submission',
  );
  const lendingBeforeReview = await bootstrap('lending');
  const ticket = lendingBeforeReview.data.lendingTickets.find((entry) => entry.purpose === lendingMarker);
  requireCondition(ticket && ticket.status === 'FOR_REVIEW', 'lending review queue projection');
  const eligibleAsset = ticket.assetOptions.find(
    (entry) => entry.itemId === ticket.itemId && entry.status === 'AVAILABLE',
  );
  const approvalCommand = {
    ticketId: ticket.id,
    decision: 'APPROVE',
    identityVerified: true,
    identityVerificationSource: 'APPROVED_ANGELITE_IDENTITY_RULE',
    approvedQuantity: 1,
    ...(eligibleAsset ? { assetIds: [eligibleAsset.id] } : {}),
    clientRequestId: retryKey('lending-approve'),
  };
  const lendingApproved = requireStatus(
    await post('/api/approveLendingTicket', approvalCommand),
    'lending approval',
  );
  const lendingHandoff = requireStatus(
    await post('/api/confirmLendingHandoff', {
      ticketId: ticket.id,
      conditionLabel: 'GOOD',
      notes: 'P11 isolated lending handoff.',
      clientRequestId: retryKey('lending-handoff'),
    }),
    'lending handoff',
  );
  const lendingEvidenceId = await uploadEvidence({
    evidenceType: 'LENDING_RETURN_PHOTO',
    relatedEntityType: 'LENDING',
    relatedEntityId: ticket.id,
    scope: { lendingTicketId: ticket.id },
  });
  const lendingReturned = requireStatus(
    await post('/api/confirmReturn', {
      ticketId: ticket.id,
      conditionLabel: 'GOOD',
      evidenceId: lendingEvidenceId,
      returnedQuantity: 1,
      lostQuantity: 0,
      damagedBeyondUseQuantity: 0,
      notes: 'P11 isolated lending return.',
      clientRequestId: retryKey('lending-return'),
    }),
    'lending return',
  );
  const lendingAfter = await bootstrap('lending');
  const ticketAfter = lendingAfter.data.lendingTickets.find((entry) => entry.id === ticket.id);
  const lendingHistory = ticketAfter.history.map((entry) => entry.newStatus);
  const inventoryAfterLending = await bootstrap('inventory');
  const lendingLedger = inventoryAfterLending.data.ledgerTransactions.filter(
    (entry) => entry.itemId === ticket.itemId && ['LOAN_OUT', 'LOAN_RETURN'].includes(entry.transactionType),
  );
  requireCondition(lendingSubmission.submissionId, 'lending submission receipt');
  requireCondition(lendingApproved.status === 'READY_TO_CLAIM', 'lending ready-to-claim');
  requireCondition(lendingHandoff.status === 'ON_LOAN', 'lending on-loan');
  requireCondition(lendingReturned.status === 'RETURNED', 'lending returned');
  requireCondition(ticketAfter.status === 'RETURNED', 'lending final projection');
  requireCondition(
    ['READY_TO_CLAIM', 'ON_LOAN', 'RETURNED'].every((status) => lendingHistory.includes(status)),
    'lending status history',
  );
  requireCondition(
    ['LOAN_OUT', 'LOAN_RETURN'].every((type) =>
      lendingLedger.some((entry) => entry.transactionType === type),
    ),
    'lending ledger consequences',
  );
  report.lending = {
    publicSubmission: true,
    reviewQueue: true,
    approved: lendingApproved.status === 'READY_TO_CLAIM',
    reserved: lendingApproved.status === 'READY_TO_CLAIM',
    handoff: lendingHandoff.status === 'ON_LOAN',
    activeLoan: lendingHandoff.status === 'ON_LOAN',
    returned: lendingReturned.status === 'RETURNED',
    historyVerified: true,
    ledgerVerified: true,
    traceableAssetAssigned: Boolean(eligibleAsset),
  };

  const procurementMarker = `P11 procurement lifecycle ${randomUUID()}`;
  const procurementSubmission = await submitPublicRequest({
    marker: procurementMarker,
    itemId: stockItem.id,
    quantity: 1,
    event,
  });
  const procurementRequest = await requestAndLine(procurementSubmission.requestId);
  requireStatus(
    await post('/api/reviewRequest', {
      requestId: procurementSubmission.requestId,
      decision: 'ACCEPT',
      lineDecisions: [{ lineId: procurementRequest.line.id, decision: 'PROCUREMENT' }],
      note: 'P11 isolated procurement routing.',
      clientRequestId: retryKey('procurement-review'),
    }),
    'procurement request review',
  );
  const procurementBefore = await bootstrap('procurement');
  const deliverable = procurementBefore.data.deliverables.find(
    (entry) => entry.requestLineId === procurementRequest.line.id,
  );
  requireCondition(deliverable && deliverable.status === 'FOR_CANVASSING', 'procurement deliverable created');
  const canvassEvidenceId = await uploadEvidence({
    evidenceType: 'CANVASS_QUOTE',
    relatedEntityType: 'CANVASS',
    relatedEntityId: procurementRequest.line.id,
    scope: { requestLineId: procurementRequest.line.id },
  });
  const canvass = requireStatus(
    await post('/api/saveCanvassReference', {
      linkedDeliverableId: deliverable.id,
      supplierName: 'Playground P11 Synthetic Supplier',
      location: 'Playground',
      itemSpec: stockItem.name,
      price: 125,
      unit: procurementRequest.line.unit,
      receiptStatus: 'VERIFIED',
      reliability: 'SYNTHETIC',
      checkedAt: dateOffset(0),
      evidenceId: canvassEvidenceId,
      notes: 'P11 isolated synthetic canvass.',
      clientRequestId: retryKey('procurement-canvass'),
    }),
    'procurement canvass',
  );
  const preferred = requireStatus(
    await post('/api/selectPreferredCanvass', {
      canvassId: canvass.canvassId,
      rationale: 'P11 isolated preferred quote proof.',
      clientRequestId: retryKey('procurement-preferred'),
    }),
    'preferred canvass selection',
  );
  const transitionResults = [];
  for (const status of ['WAITING_FOR_BUDGET', 'TO_BE_PROCURED', 'PROCURED', 'READY_TO_RELEASE']) {
    transitionResults.push(
      requireStatus(
        await post('/api/transitionDeliverable', {
          deliverableId: deliverable.id,
          status,
          note: `P11 isolated transition to ${status}.`,
          clientRequestId: retryKey(`procurement-${status.toLowerCase()}`),
        }),
        `procurement transition ${status}`,
      ),
    );
  }
  const procurementAfter = await bootstrap('procurement');
  const deliverableAfter = procurementAfter.data.deliverables.find((entry) => entry.id === deliverable.id);
  const canvassAfter = procurementAfter.data.canvassReferences.find(
    (entry) => entry.id === canvass.canvassId,
  );
  requireCondition(preferred.preferred === true, 'preferred canvass receipt');
  requireCondition(
    transitionResults.map((entry) => entry.status).join('|') ===
      'WAITING_FOR_BUDGET|TO_BE_PROCURED|PROCURED|READY_TO_RELEASE',
    'procurement transition receipts',
  );
  requireCondition(deliverableAfter.status === 'READY_TO_RELEASE', 'procurement final projection');
  requireCondition(canvassAfter.preferred === true, 'procurement preferred quote projection');
  report.procurement = {
    publicSubmission: true,
    routedToProcurement: true,
    deliverableCreated: true,
    canvassStored: canvass.status === 'ACTIVE',
    preferredQuote: preferred.preferred === true,
    lifecycle: transitionResults.map((entry) => entry.status),
    finalState: deliverableAfter.status,
  };

  const eventsBefore = requireStatus(
    await post('/api/getEventManagement', {}),
    'event management before link',
  );
  const eventLinksBefore = Array.isArray(eventsBefore.links) ? eventsBefore.links.length : 0;
  const eventLink = requireStatus(
    await post('/api/linkEventOperationalRecord', {
      activityId: event.id,
      linkType: 'REQUEST',
      linkedEntityId: partialSubmission.requestId,
      reason: 'P11 isolated event relationship proof.',
      notes: 'Synthetic Playground-only operational relationship.',
      clientRequestId: retryKey('event-link'),
    }),
    'event operational link',
  );
  const eventsAfter = requireStatus(await post('/api/getEventManagement', {}), 'event management after link');
  const eventLinksAfter = Array.isArray(eventsAfter.links) ? eventsAfter.links.length : 0;
  requireCondition(
    eventLink.linkId && eventLinksAfter === eventLinksBefore + 1,
    'event relationship consequence',
  );
  report.events = {
    recordsReadable: Array.isArray(eventsAfter.activities),
    relationshipCreated: true,
    linkCountDelta: eventLinksAfter - eventLinksBefore,
    relationshipReadback: eventsAfter.links.some((entry) => entry.id === eventLink.linkId),
  };
  requireCondition(report.events.relationshipReadback, 'event relationship readback');

  const directory = requireStatus(
    await post('/api/admin/access/directory', { page: 1, pageSize: 50, status: 'ACTIVE' }),
    'access directory',
  );
  const activeAccount = directory.items.find((entry) => entry.status === 'ACTIVE');
  requireCondition(activeAccount?.accountId, 'active account available for no-op');
  const accountNoopCommand = {
    accountId: activeAccount.accountId,
    status: 'ACTIVE',
    reason: 'P11 isolated account status no-op proof.',
    clientRequestId: retryKey('access-status-noop'),
  };
  const accountNoop = requireStatus(
    await post('/api/admin/access/status', accountNoopCommand),
    'account status no-op',
  );
  const accountNoopReplay = requireStatus(
    await post('/api/admin/access/status', accountNoopCommand),
    'account status no-op replay',
  );
  requireCondition(
    accountNoop.changed === false && accountNoopReplay.replayed === true,
    'account no-op replay',
  );

  const referenceCreateCommand = {
    label: 'Playground P11 synthetic reference',
    linkType: 'EXTERNAL_URL',
    url: 'https://example.invalid/p11-playground',
    audience: 'ADMINISTRATOR',
    reason: 'P11 isolated reference lifecycle proof.',
    clientRequestId: retryKey('reference-create'),
  };
  const referenceCreated = requireStatus(
    await post('/api/admin/reference-links/create', referenceCreateCommand),
    'reference link create',
  );
  const referenceCreateReplay = requireStatus(
    await post('/api/admin/reference-links/create', referenceCreateCommand),
    'reference link create replay',
  );
  const referenceArchived = requireStatus(
    await post('/api/admin/reference-links/transition', {
      id: referenceCreated.link.id,
      status: 'ARCHIVED',
      expectedRevision: referenceCreated.link.revision,
      reason: 'P11 isolated reference cleanup.',
      clientRequestId: retryKey('reference-archive'),
    }),
    'reference link archive',
  );
  const referenceList = requireStatus(
    await post('/api/admin/reference-links/list', { page: 1, pageSize: 50, status: 'ARCHIVED' }),
    'reference link readback',
  );
  const referenceHistory = requireStatus(
    await post('/api/admin/reference-links/history', {
      id: referenceCreated.link.id,
      page: 1,
      pageSize: 20,
    }),
    'reference link history',
  );
  const health = requireStatus(await get('/api/health'), 'health readback');
  const readiness = requireStatus(await get('/api/readiness'), 'readiness readback');
  const finalEvidenceStatus = requireStatus(
    await post('/api/owner/evidence/status', {}),
    'final evidence status',
  );
  requireCondition(referenceCreateReplay.replayed === true, 'reference create replay');
  requireCondition(referenceArchived.link.status === 'ARCHIVED', 'reference archived receipt');
  requireCondition(
    referenceList.items.some((entry) => entry.id === referenceCreated.link.id && entry.status === 'ARCHIVED'),
    'reference archived readback',
  );
  requireCondition(referenceHistory.items.length >= 2, 'reference history readback');
  requireCondition(readiness.ready === true, 'Playground readiness');
  report.administration = {
    accountDirectoryReadable: Array.isArray(directory.items),
    accountStatusNoop: accountNoop.changed === false,
    accountStatusReplay: accountNoopReplay.replayed === true,
    referenceCreatedDraft: referenceCreated.link.status === 'DRAFT',
    referenceCreateReplay: referenceCreateReplay.replayed === true,
    referenceArchived: referenceArchived.link.status === 'ARCHIVED',
    referenceHistoryEntries: referenceHistory.items.length,
    systemReadOnly: true,
    healthStatus: String(health.status ?? 'OK'),
    readiness: readiness.ready === true,
    googleDrive: String(finalEvidenceStatus?.storage?.googleDrive ?? 'UNKNOWN'),
  };

  const finalRequest = await bootstrap('request');
  const finalInventory = await bootstrap('inventory');
  const finalLending = await bootstrap('lending');
  const finalProcurement = await bootstrap('procurement');
  report.finalReadback = {
    requests: finalRequest.data.requests.length,
    requestLines: finalRequest.data.requestLines.length,
    inventoryItems: finalInventory.data.inventoryItems.length,
    ledgerTransactions: finalInventory.data.ledgerTransactions.length,
    lendingTickets: finalLending.data.lendingTickets.length,
    deliverables: finalProcurement.data.deliverables.length,
    allWorkflowAssertionsPassed: true,
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
console.log('P11 isolated live workflow audit: COMPLETE');
console.log(
  'Aggregate report remains private; no credentials, tokens, provider IDs, or row identities were printed.',
);
