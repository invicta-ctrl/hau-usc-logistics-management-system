import { expect, request as apiRequest, test } from '@playwright/test';

/**
 * RV-01.9 mandatory real Worker/D1 two-context regression.
 *
 * Distinct public and authenticated contexts run against the real local Worker
 * and D1. The authenticated Main Hub is opened BEFORE the public submission and
 * is never fully reloaded, logged out, or re-authenticated.
 */

const PASSWORD = `LocalOnly${String.fromCharCode(33)}Pass2026`;
const BASE_URL = process.env.HAU_CLOUDFLARE_BASE_URL || 'http://127.0.0.1:8787';

async function login(context, accessId, password = PASSWORD) {
  const response = await context.post('/api/auth/login', { data: { accessId, password } });
  expect(response.status()).toBe(200);
  const result = await response.json();
  expect(result.state).toBe('AUTHENTICATED');
  return result.csrfToken;
}

function mutate(context, csrfToken, method, data) {
  return context.post(`/api/${method}`, { headers: { 'x-csrf-token': csrfToken }, data });
}

async function scopedToken(context, csrfToken, scope) {
  const response = await mutate(context, csrfToken, 'getScopedRevision', { scope });
  expect(response.status()).toBe(200);
  const body = (await response.json()).data;
  expect(body.contract).toBe('scoped-revision');
  return Number(body.token);
}

test('public request becomes visible to an already-open authorized Main Hub and routes each line exactly once', async ({
  request,
}) => {
  const csrfToken = await login(request, 'LOCAL.OWNER');

  // The already-open internal session records its baseline first.
  const openedRequests = await request.get('/api/requests');
  expect(openedRequests.status()).toBe(200);
  const opened = await openedRequests.json();
  const knownRequestIds = new Set(opened.data.requests.map((row) => row.id));
  const openedRequestToken = Number(opened.scopeRevision.token);
  const openedOverviewToken = await scopedToken(request, csrfToken, 'overview');

  // A separate public context with no authenticated session and no CSRF token.
  const publicContext = await apiRequest.newContext({ baseURL: BASE_URL });
  let publicItemId;
  try {
    const optionsResponse = await publicContext.get('/api/public/request/options');
    expect(optionsResponse.status()).toBe(200);
    const options = await optionsResponse.json();
    const event = options.events[0];
    const item = options.items[0];
    expect(event).toBeTruthy();
    expect(item).toBeTruthy();
    publicItemId = item.id;

    // RV-01.8: the public contract never carries internal queue collections.
    expect(JSON.stringify(options)).not.toContain('"requestLines"');

    const submittedResponse = await publicContext.post('/api/public/request', {
      headers: { origin: BASE_URL },
      data: {
        clientRequestId: `rv01-two-context-${crypto.randomUUID()}`,
        requesterName: 'Synthetic RV-01 Requester',
        organization: 'Synthetic Organization',
        requesterType: 'HAU office / department',
        email: `rv01-${crypto.randomUUID()}@example.invalid`,
        contactNumber: '+63 917 000 0031',
        purpose: 'Synthetic RV-01 two-context visibility proof.',
        requestPurpose: 'EVENT_ACTIVITY_SUPPORT',
        eventSeriesId: event.seriesId,
        eventId: event.id,
        startDate: '',
        endDate: '',
        location: event.venue ?? '',
        dataUseAcknowledged: true,
        acceptableUseAcknowledged: true,
        evidenceConsentAcknowledged: true,
        lines: [
          { category: 'Inventory Item', itemId: item.id, quantity: 1 },
          {
            category: 'Other',
            description: 'Synthetic RV-01 procurement line',
            quantity: 4,
            unit: 'piece',
          },
        ],
      },
    });
    expect(submittedResponse.status()).toBe(200);
    const submitted = await submittedResponse.json();
    expect(submitted.status).toBe('FOR_REVIEW');
    expect(submitted.requests).toBeUndefined();
    expect(submitted.requestLines).toBeUndefined();
  } finally {
    await publicContext.dispose();
  }

  // RV-01.4: the already-open session detects the change through the existing
  // scoped-revision contract, with no hard refresh and no re-login.
  expect(await scopedToken(request, csrfToken, 'request')).toBeGreaterThan(openedRequestToken);
  expect(await scopedToken(request, csrfToken, 'overview')).toBeGreaterThan(openedOverviewToken);

  // RV-01.2: the refetched Request module carries the new parent and its lines.
  const refetched = await request.get('/api/requests');
  expect(refetched.status()).toBe(200);
  const refetchedBody = await refetched.json();
  const parent = refetchedBody.data.requests.find((row) => !knownRequestIds.has(row.id));
  expect(parent).toBeTruthy();
  expect(parent.status).toBe('FOR_REVIEW');
  const lines = refetchedBody.data.requestLines.filter((line) => line.requestId === parent.id);
  expect(lines).toHaveLength(2);
  expect(lines.every((line) => line.status === 'FOR_REVIEW')).toBe(true);

  // RV-01.7: fresh FOR_REVIEW lines own nothing downstream.
  const procurementBefore = await (await request.get('/api/procurement')).json();
  expect(
    (procurementBefore.data.deliverables ?? []).filter((entry) => entry.requestId === parent.id),
  ).toHaveLength(0);
  const restockingBefore = await (await request.get('/api/restocking')).json();
  expect(
    (restockingBefore.data.restockRequests ?? []).filter(
      (entry) => entry.sourceRequestId === parent.id,
    ),
  ).toHaveLength(0);

  const stockLine = lines.find((line) => line.itemId === publicItemId);
  const procurementLine = lines.find((line) => !line.itemId);
  expect(stockLine).toBeTruthy();
  expect(procurementLine).toBeTruthy();

  // RV-01.6: accepting without explicit per-line decisions fails closed.
  const missing = await mutate(request, csrfToken, 'reviewRequest', {
    requestId: parent.id,
    decision: 'ACCEPT',
    note: 'Missing line decisions',
    clientRequestId: `rv01-missing-${parent.id}`,
  });
  expect(missing.status()).toBe(422);
  expect((await missing.json()).code).toBe('LINE_DECISIONS_REQUIRED');

  // RV-01.6: a decision naming a line outside this request is rejected.
  const foreign = await mutate(request, csrfToken, 'reviewRequest', {
    requestId: parent.id,
    decision: 'ACCEPT',
    note: 'Foreign line decision',
    clientRequestId: `rv01-foreign-${parent.id}`,
    lineDecisions: [{ lineId: 'RL-DOES-NOT-EXIST', decision: 'PROCUREMENT' }],
  });
  expect(foreign.status()).toBe(409);
  expect((await foreign.json()).code).toBe('LINE_DECISION_SCOPE_MISMATCH');

  // RV-01.6: a stock route requires an exact catalog item.
  const invalidStock = await mutate(request, csrfToken, 'reviewRequest', {
    requestId: parent.id,
    decision: 'ACCEPT',
    note: 'Stock route without catalog item',
    clientRequestId: `rv01-invalid-stock-${parent.id}`,
    lineDecisions: [
      { lineId: stockLine.id, decision: 'ISSUE_FROM_STOCK' },
      { lineId: procurementLine.id, decision: 'ISSUE_FROM_STOCK' },
    ],
  });
  expect(invalidStock.status()).toBe(409);
  expect((await invalidStock.json()).code).toBe('LINE_ROUTE_NOT_ALLOWED');

  const reviewCommand = {
    requestId: parent.id,
    decision: 'ACCEPT',
    note: 'RV-01 two-context acceptance',
    clientRequestId: `rv01-review-${parent.id}`,
    lineDecisions: [
      { lineId: stockLine.id, decision: 'ISSUE_FROM_STOCK' },
      { lineId: procurementLine.id, decision: 'PROCUREMENT' },
    ],
  };
  expect((await mutate(request, csrfToken, 'reviewRequest', reviewCommand)).status()).toBe(200);
  // RV-01.8: an exact retry replays with no duplicate effect.
  expect((await mutate(request, csrfToken, 'reviewRequest', reviewCommand)).status()).toBe(200);

  const afterReview = await (await request.get('/api/procurement')).json();
  const deliverables = (afterReview.data.deliverables ?? []).filter(
    (entry) => entry.requestId === parent.id,
  );
  expect(deliverables).toHaveLength(1);
  expect(deliverables[0].requestLineId).toBe(procurementLine.id);

  const routedLines = afterReview.data.requestLines.filter((line) => line.requestId === parent.id);
  expect(routedLines.find((line) => line.id === stockLine.id).status).toBe('READY_TO_RESERVE');
  expect(routedLines.find((line) => line.id === procurementLine.id).status).toBe('FOR_CANVASSING');

  // RV-01.6: the stock route creates no Restocking owner.
  const afterRestocking = await (await request.get('/api/restocking')).json();
  expect(
    (afterRestocking.data.restockRequests ?? []).filter(
      (entry) => entry.sourceRequestId === parent.id,
    ),
  ).toHaveLength(0);

  // RV-01.3: an unrelated committee scope is denied the same request server-side.
  const unrelated = await apiRequest.newContext({ baseURL: BASE_URL });
  try {
    await login(unrelated, 'LOCAL.FOOD');
    const unrelatedRequests = await unrelated.get('/api/requests');
    expect(unrelatedRequests.status()).toBe(200);
    const unrelatedBody = await unrelatedRequests.json();
    expect(unrelatedBody.data.requests.some((row) => row.id === parent.id)).toBe(false);
  } finally {
    await unrelated.dispose();
  }
});
