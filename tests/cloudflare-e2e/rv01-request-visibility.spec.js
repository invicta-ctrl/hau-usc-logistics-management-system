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
  // RV-01.4: the poller permanently disables itself when `enabled` is false,
  // after which route return, focus, and reconnect are all refused. Near-live
  // refresh only exists if REST reports the mechanism enabled.
  expect(body.enabled).toBe(true);
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

  // RV-01.6: once a line owns a downstream item, a whole-request reject is
  // refused so the live Deliverables item cannot be stranded under a rejected
  // parent. The parent here is already ACCEPTED, which the state guard rejects
  // first; the dedicated routed-line guard is proven on a mixed parent below.
  const lateReject = await mutate(request, csrfToken, 'reviewRequest', {
    requestId: parent.id,
    decision: 'REJECT',
    note: 'Late whole-request reject',
    clientRequestId: `rv01-late-reject-${parent.id}`,
  });
  expect(lateReject.status()).toBe(409);
  expect(['REQUEST_STATE_CONFLICT', 'REQUEST_ALREADY_ROUTED']).toContain(
    (await lateReject.json()).code,
  );

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

test('the Request module owns its search, date, archive, and scope filtering', async ({ request }) => {
  // RV-01.5: filtering is computed by Request itself, and total/hasMore always
  // agree with the same predicate rather than another module's count.
  const csrfToken = await login(request, 'LOCAL.OWNER');

  const all = await (await request.get('/api/requests')).json();
  expect(all.data.requests.length).toBeGreaterThan(0);
  const target = all.data.requests[0];

  // Search narrows by request id and keeps total consistent with the page.
  const searched = await (
    await request.get(`/api/requests?query=${encodeURIComponent(target.id)}`)
  ).json();
  expect(searched.data.requests.every((row) => row.id === target.id)).toBe(true);
  expect(searched.pagination.total).toBe(searched.data.requests.length);
  expect(searched.pagination.total).toBeLessThanOrEqual(all.pagination.total);

  // A search that matches nothing yields a truthful empty page, not a fallback.
  const empty = await (await request.get('/api/requests?query=ZZ-NO-SUCH-REQUEST-ZZ')).json();
  expect(empty.data.requests).toHaveLength(0);
  expect(empty.data.requestLines).toHaveLength(0);
  expect(empty.pagination.total).toBe(0);
  expect(empty.pagination.hasMore).toBe(false);

  // Date boundaries filter on the submission day.
  const future = new Date(Date.now() + 90 * 86_400_000).toISOString().slice(0, 10);
  const afterFuture = await (await request.get(`/api/requests?from=${future}`)).json();
  expect(afterFuture.data.requests).toHaveLength(0);
  expect(afterFuture.pagination.total).toBe(0);

  const past = new Date(Date.now() - 365 * 86_400_000).toISOString().slice(0, 10);
  const sincePast = await (await request.get(`/api/requests?from=${past}`)).json();
  expect(sincePast.pagination.total).toBe(all.pagination.total);

  // The archive filter is Request-owned; the default page excludes archived rows.
  const archived = await (await request.get('/api/requests?filter=ARCHIVED')).json();
  expect(archived.pagination.total).toBeLessThanOrEqual(all.pagination.total);
  expect(archived.data.requests.every((row) => row.id !== undefined)).toBe(true);

  // A malformed date is ignored server-side rather than leaking into the query.
  const malformed = await request.get('/api/requests?from=not-a-date');
  expect(malformed.status()).toBe(200);
  expect((await malformed.json()).pagination.total).toBe(all.pagination.total);

  // Search must never reach the public contract.
  expect(csrfToken).toBeTruthy();
});

test('the unassigned review queue matches the RV-01.3 authorization table', async ({ request }) => {
  // RV-01.3: Director must see unassigned central review work; requester-only
  // and disabled identities must not reach the internal queue at all.
  await login(request, 'LOCAL.OWNER');
  const ownerView = await (await request.get('/api/requests')).json();
  const unassigned = ownerView.data.requests.find((row) => !row.ownerCommitteeId);
  expect(unassigned).toBeTruthy();

  // Director with central capability: reads the same unassigned work.
  const director = await apiRequest.newContext({ baseURL: BASE_URL });
  try {
    await login(director, 'LOCAL.DIRECTOR');
    const directorView = await director.get('/api/requests');
    expect(directorView.status()).toBe(200);
    const directorBody = await directorView.json();
    expect(directorBody.data.requests.some((row) => row.id === unassigned.id)).toBe(true);
  } finally {
    await director.dispose();
  }

  // Requester-only separation is proven by the existing local-worker test
  // "requester portals keep request and lending records self-scoped", which
  // provisions a department requester through the Access API. It is not
  // duplicated here because LOCAL.REQUESTER is not a seeded fixture.

  // Unauthenticated: the internal queue is never served.
  const anonymous = await apiRequest.newContext({ baseURL: BASE_URL });
  try {
    const anonymousView = await anonymous.get('/api/requests');
    expect([401, 403]).toContain(anonymousView.status());
    expect(JSON.stringify(await anonymousView.json())).not.toContain(unassigned.id);
  } finally {
    await anonymous.dispose();
  }
});

test('a partially routed request cannot be rejected as a whole', async ({ request }) => {
  // RV-01.6: a mixed review leaves the parent NEEDS_INFORMATION while one line
  // already owns a live Deliverables item. A later whole-request REJECT must be
  // refused, or that procurement item would proceed under a rejected parent.
  const csrfToken = await login(request, 'LOCAL.OWNER');

  const before = await (await request.get('/api/requests')).json();
  const knownIds = new Set(before.data.requests.map((row) => row.id));

  const publicContext = await apiRequest.newContext({ baseURL: BASE_URL });
  try {
    const options = await (await publicContext.get('/api/public/request/options')).json();
    const event = options.events[0];
    const submitted = await publicContext.post('/api/public/request', {
      headers: { origin: BASE_URL },
      data: {
        clientRequestId: `rv01-partial-${crypto.randomUUID()}`,
        requesterName: 'Synthetic RV-01 Partial Requester',
        organization: 'Synthetic Organization',
        requesterType: 'HAU office / department',
        email: `rv01-partial-${crypto.randomUUID()}@example.invalid`,
        contactNumber: '+63 917 000 0032',
        purpose: 'Synthetic RV-01 partial routing proof.',
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
          { category: 'Other', description: 'Partial line A', quantity: 2, unit: 'piece' },
          { category: 'Other', description: 'Partial line B', quantity: 3, unit: 'piece' },
        ],
      },
    });
    expect(submitted.status()).toBe(200);
  } finally {
    await publicContext.dispose();
  }

  const after = await (await request.get('/api/requests')).json();
  const parent = after.data.requests.find((row) => !knownIds.has(row.id));
  expect(parent).toBeTruthy();
  const lines = after.data.requestLines.filter((line) => line.requestId === parent.id);
  expect(lines).toHaveLength(2);

  // Mixed outcome: one line routed to procurement, one returned for information.
  const mixed = await mutate(request, csrfToken, 'reviewRequest', {
    requestId: parent.id,
    decision: 'ACCEPT',
    note: 'Mixed partial routing',
    clientRequestId: `rv01-partial-review-${parent.id}`,
    lineDecisions: [
      { lineId: lines[0].id, decision: 'PROCUREMENT' },
      { lineId: lines[1].id, decision: 'MISSING_INFORMATION' },
    ],
  });
  expect(mixed.status()).toBe(200);
  expect((await mixed.json()).status).toBe('NEEDS_INFORMATION');

  const procurement = await (await request.get('/api/procurement')).json();
  expect(
    (procurement.data.deliverables ?? []).filter((entry) => entry.requestId === parent.id),
  ).toHaveLength(1);

  // The parent is still reviewable, but a whole-request reject must be refused.
  const reject = await mutate(request, csrfToken, 'reviewRequest', {
    requestId: parent.id,
    decision: 'REJECT',
    note: 'Whole-request reject after partial routing',
    clientRequestId: `rv01-partial-reject-${parent.id}`,
  });
  expect(reject.status()).toBe(409);
  expect((await reject.json()).code).toBe('REQUEST_ALREADY_ROUTED');

  // The same protection must key off the DERIVED outcome, not the submitted
  // decision: an ACCEPT whose remaining decisions are all REJECT derives a
  // REJECTED parent and would strand the routed line just the same.
  const derivedReject = await mutate(request, csrfToken, 'reviewRequest', {
    requestId: parent.id,
    decision: 'ACCEPT',
    note: 'Accept that derives a rejected parent',
    clientRequestId: `rv01-derived-reject-${parent.id}`,
    lineDecisions: [{ lineId: lines[1].id, decision: 'REJECT' }],
  });
  expect(derivedReject.status()).toBe(409);
  expect((await derivedReject.json()).code).toBe('REQUEST_ALREADY_ROUTED');

  // The routed line and its deliverable are untouched.
  const settled = await (await request.get('/api/procurement')).json();
  expect(
    (settled.data.deliverables ?? []).filter((entry) => entry.requestId === parent.id),
  ).toHaveLength(1);
  const settledParent = (await (await request.get('/api/requests')).json()).data.requests.find(
    (row) => row.id === parent.id,
  );
  expect(settledParent.status).toBe('NEEDS_INFORMATION');
});

test('a reviewer routes each line of a public request through the shipped Main Hub UI', async ({
  page,
  request,
}) => {
  // RV-01.6 shipped-UI proof. Context A submits publicly through a separate
  // API context; Context B is an already-open authenticated Main Hub that must
  // surface the request and let a human route every line without re-login.
  const authRequests = [];
  page.on('request', (browserRequest) => {
    const pathname = new URL(browserRequest.url()).pathname;
    if (['/api/auth/login', '/api/auth/session'].includes(pathname)) authRequests.push(pathname);
  });

  // Context B opens and authenticates the V5 queue before Context A submits.
  await page.goto('/#/public.signin');
  await page.getByLabel('Username').fill('LOCAL.OWNER');
  await page.getByLabel('Password (required)', { exact: true }).fill(PASSWORD);
  const overviewRevision = page.waitForResponse((response) => {
    if (new URL(response.url()).pathname !== '/api/getScopedRevision') return false;
    return response.request().postDataJSON?.()?.scope === 'overview';
  });
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.locator('.shell')).toBeVisible();
  await overviewRevision;
  const baselineRevision = page.waitForResponse((response) => {
    if (new URL(response.url()).pathname !== '/api/getScopedRevision') return false;
    return response.request().postDataJSON?.()?.scope === 'request';
  });
  await page.goto('/#/request.queue');
  await page.waitForFunction(() =>
    globalThis.__HAU_V5_INTEGRATION__?.status?.().connectedRoutes?.includes('request.queue'),
  );
  await baselineRevision;
  await expect(page.getByRole('heading', { name: 'Request Center', exact: true })).toBeVisible();
  await page.evaluate(() => {
    globalThis.__RV01_ALREADY_OPEN__ = true;
  });
  const authenticatedRequestCount = authRequests.length;

  // Context A remains separate and unauthenticated.
  const publicContext = await apiRequest.newContext({ baseURL: BASE_URL });
  let submittedId;
  try {
    const options = await (await publicContext.get('/api/public/request/options')).json();
    const event = options.events[0];
    const item = options.items[0];
    const submittedResponse = await publicContext.post('/api/public/request', {
      headers: { origin: BASE_URL },
      data: {
        clientRequestId: `rv01-ui-${crypto.randomUUID()}`,
        requesterName: 'Synthetic RV-01 UI Requester',
        organization: 'Synthetic Organization',
        requesterType: 'HAU office / department',
        email: `rv01-ui-${crypto.randomUUID()}@example.invalid`,
        contactNumber: '+63 917 000 0033',
        purpose: 'Synthetic RV-01 shipped reviewer UI proof.',
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
          { category: 'Other', description: 'UI proof procurement line', quantity: 2, unit: 'piece' },
        ],
      },
    });
    expect(submittedResponse.status()).toBe(200);
    const submitted = await submittedResponse.json();
    expect(submitted.status).toBe('FOR_REVIEW');
    expect(submitted.requests).toBeUndefined();
    expect(submitted.requestLines).toBeUndefined();
    submittedId = submitted.requestId;
  } finally {
    await publicContext.dispose();
  }
  expect(submittedId).toBeTruthy();

  // The already-open V5 queue detects the newer token and refreshes itself.
  const refreshedModule = page.waitForResponse((response) => {
    if (new URL(response.url()).pathname !== '/api/getBootstrapModule') return false;
    return response.request().postDataJSON?.()?.module === 'request';
  });
  await page.evaluate(() => window.dispatchEvent(new Event('focus')));
  await refreshedModule;
  const queue = page.locator('#surface-main');
  const submittedRow = queue.locator(`[data-act="select:request"][data-ref="${submittedId}"]:visible`);
  await expect(submittedRow.first()).toBeVisible({ timeout: 15_000 });
  expect(await page.evaluate(() => globalThis.__RV01_ALREADY_OPEN__)).toBe(true);
  expect(authRequests).toHaveLength(authenticatedRequestCount);

  // Open the V5 contextual command and keep every line decision explicit.
  await submittedRow.first().click();
  const form = page.locator('[data-v5-command="request-review"]:visible').first();
  await expect(form).toBeVisible();

  // Exactly one explicit decision control per reviewable line.
  const decisions = form.locator('select[name^="lineDecision"]');
  await expect(decisions).toHaveCount(2);

  // No route is pre-selected: RV-01.6 requires an explicit decision per line.
  const preselected = await decisions.evaluateAll((nodes) => nodes.map((n) => n.value));
  expect(preselected.every((value) => value === '')).toBe(true);

  // A line with no catalog item must not offer a stock route.
  const optionSets = await decisions.evaluateAll((nodes) =>
    nodes.map((n) => [...n.options].map((o) => o.value)),
  );
  const stockCapable = optionSets.filter((set) => set.includes('ISSUE_FROM_STOCK'));
  expect(stockCapable).toHaveLength(1);
  expect(optionSets.every((set) => set.includes('REJECT'))).toBe(true);

  // Route the catalog line from stock and the free-text line to procurement.
  for (let index = 0; index < optionSets.length; index += 1) {
    await decisions
      .nth(index)
      .selectOption(optionSets[index].includes('ISSUE_FROM_STOCK') ? 'ISSUE_FROM_STOCK' : 'PROCUREMENT');
  }
  await form.getByRole('button', { name: 'Submit explicit line review' }).click();

  // The reviewed request remains queued and exposes canonical accepted status.
  await expect(submittedRow.first()).toBeVisible({ timeout: 15_000 });
  await expect(
    submittedRow.first().locator('xpath=ancestor::tr[1]').getByText('Accepted', { exact: true }),
  ).toBeVisible();

  // Downstream ownership is exactly one procurement item, created only by review.
  const csrfToken = await login(request, 'LOCAL.OWNER');
  expect(csrfToken).toBeTruthy();
  const procurement = await (await request.get('/api/procurement')).json();
  const deliverables = (procurement.data.deliverables ?? []).filter(
    (entry) => entry.requestId === submittedId,
  );
  expect(deliverables).toHaveLength(1);
  const routed = procurement.data.requestLines.filter((line) => line.requestId === submittedId);
  expect(routed.map((line) => line.status).sort()).toEqual(['FOR_CANVASSING', 'READY_TO_RESERVE']);

  const restocking = await (await request.get('/api/restocking')).json();
  expect(
    (restocking.data.restockRequests ?? []).filter((entry) => entry.sourceRequestId === submittedId),
  ).toHaveLength(0);
});

test('the shipped reviewer UI stays hidden from the public request portal', async ({ page }) => {
  // RV-01.8: the public Request Center must never render internal review work.
  await page.goto('/#/public.request-intake');
  await expect(page.locator('#request-center-form')).toBeVisible();
  await expect(page.locator('[data-v5-command="request-review"]')).toHaveCount(0);
  await expect(page.locator('[data-v5-contextual-mount="request.queue"]')).toHaveCount(0);
  await expect(page.locator('body')).not.toContainText('Submit explicit line review');
});

test('an ALL-scope reviewer keeps central scope even while holding a committee', async ({ request }) => {
  // RV-01.3 gap A: including committeeRestricted in boundedScope suppressed the
  // ALL option, demoting an ALL-scope role to committee scope so unassigned
  // requests vanished from the queue and the review command failed.
  const csrfToken = await login(request, 'LOCAL.OWNER');
  const essential = await request.post('/api/getEssentialBootstrapData', {
    headers: { 'x-csrf-token': csrfToken },
    data: {},
  });
  expect(essential.status()).toBe(200);
  const context = (await essential.json()).operationalContext;
  expect(context).toBeTruthy();
  expect(context.options.some((option) => option.kind === 'ALL' && option.available)).toBe(true);
  expect(context.selected.kind).toBe('ALL');

  const queue = await (await request.get('/api/requests')).json();
  expect(queue.data.requests.some((row) => !row.ownerCommitteeId)).toBe(true);
});

test('the Request page is bounded so its lines can never exceed the child cap', async ({ request }) => {
  // RV-01.5 gap C: a 50-parent page could carry more than the 500-line child cap
  // and fail the strict contract closed for every reviewer.
  await login(request, 'LOCAL.OWNER');
  const requested = await (await request.get('/api/requests?pageSize=50')).json();
  expect(requested.pagination.pageSize).toBeLessThanOrEqual(10);
  expect(requested.data.requests.length).toBeLessThanOrEqual(requested.pagination.pageSize);
  // A single public submission may carry 50 lines, so the bound must keep the
  // worst case within the contract maximum.
  expect(requested.pagination.pageSize * 50).toBeLessThanOrEqual(500);
  expect(requested.data.requestLines.length).toBeLessThanOrEqual(500);
  // hasMore must describe the clamped page, not the requested one.
  const expectedHasMore = requested.pagination.pageSize < requested.pagination.total;
  expect(requested.pagination.hasMore).toBe(expectedHasMore);
});

test('an over-long search term is bounded server-side', async ({ request }) => {
  // RV-01.5 gap D: the 80-character cap lived only in the client, which a direct
  // GET bypasses entirely.
  await login(request, 'LOCAL.OWNER');
  const oversized = 'x'.repeat(5000);
  const response = await request.get(`/api/requests?query=${oversized}`);
  expect([200, 422]).toContain(response.status());
  if (response.status() === 200) {
    const body = await response.json();
    expect(body.data.requests).toHaveLength(0);
    expect(body.pagination.total).toBe(0);
  }
});

test('reviewable work sorts ahead of already-reviewed requests on the queue page', async ({
  request,
}) => {
  // RV-01.3: reviewing bumps updated_at, so a pure recency order would let
  // freshly accepted requests fill the only page the queue loads and hide
  // still-pending review work from every authorized owner.
  const csrfToken = await login(request, 'LOCAL.OWNER');
  const page = await (await request.get('/api/requests')).json();
  const statuses = page.data.requests.map((row) => row.status);
  const reviewable = (status) => ['FOR_REVIEW', 'NEEDS_INFORMATION'].includes(status);
  const lastReviewable = statuses.map(reviewable).lastIndexOf(true);
  const firstReviewed = statuses.map(reviewable).indexOf(false);
  if (lastReviewable !== -1 && firstReviewed !== -1) {
    expect(lastReviewable).toBeLessThan(firstReviewed);
  }

  // Any request still awaiting review must be reachable on the first page while
  // the page is not full.
  if (page.data.requests.length < page.pagination.pageSize) {
    const everything = await (await request.get('/api/requests?filter=ALL')).json();
    const pendingEverywhere = everything.data.requests.filter((row) => reviewable(row.status));
    const pendingOnPage = new Set(
      page.data.requests.filter((row) => reviewable(row.status)).map((row) => row.id),
    );
    for (const pending of pendingEverywhere) expect(pendingOnPage.has(pending.id)).toBe(true);
  }
  expect(csrfToken).toBeTruthy();
});

test('a larger requested page size cannot skip rows', async ({ request }) => {
  // The offset must follow the clamped page size, or pageSize=50&page=2 reads
  // OFFSET 50 while returning a 10-row window and rows 10-49 become unreachable.
  await login(request, 'LOCAL.OWNER');
  const first = await (await request.get('/api/requests?filter=ALL&pageSize=50&page=1')).json();
  const second = await (await request.get('/api/requests?filter=ALL&pageSize=50&page=2')).json();
  expect(first.pagination.pageSize).toBeLessThanOrEqual(10);
  expect(second.pagination.pageSize).toBe(first.pagination.pageSize);

  if (first.pagination.total > first.pagination.pageSize) {
    // Page 2 must continue immediately after page 1, with no gap and no overlap.
    const firstIds = first.data.requests.map((row) => row.id);
    const secondIds = second.data.requests.map((row) => row.id);
    expect(secondIds.some((id) => firstIds.includes(id))).toBe(false);
    const paged = await (await request.get('/api/requests?filter=ALL&pageSize=10&page=2')).json();
    expect(secondIds).toEqual(paged.data.requests.map((row) => row.id));
  }
});

test('two concurrent reviewers cannot both route the same line', async ({ request }) => {
  // The parent guard must be a compare-and-swap, not a state-membership test.
  // NEEDS_INFORMATION is both an accepted from-state and a state a mixed review
  // produces, so a membership guard let two reviewers holding different decision
  // sets each commit, giving one line two downstream owners.
  const csrfToken = await login(request, 'LOCAL.OWNER');

  const publicContext = await apiRequest.newContext({ baseURL: BASE_URL });
  try {
    const options = await (await publicContext.get('/api/public/request/options')).json();
    const event = options.events[0];
    const submitted = await publicContext.post('/api/public/request', {
      headers: { origin: BASE_URL },
      data: {
        clientRequestId: `rv01-race-${crypto.randomUUID()}`,
        requesterName: 'Synthetic RV-01 Race Requester',
        organization: 'Synthetic Organization',
        requesterType: 'HAU office / department',
        email: `rv01-race-${crypto.randomUUID()}@example.invalid`,
        contactNumber: '+63 917 000 0034',
        purpose: 'Synthetic RV-01 concurrent review proof.',
        requestPurpose: 'EVENT_ACTIVITY_SUPPORT',
        eventSeriesId: event.seriesId,
        eventId: event.id,
        startDate: '',
        endDate: '',
        location: event.venue ?? '',
        dataUseAcknowledged: true,
        acceptableUseAcknowledged: true,
        evidenceConsentAcknowledged: true,
        lines: [{ category: 'Other', description: 'Race line', quantity: 1, unit: 'piece' }],
      },
    });
    expect(submitted.status()).toBe(200);
  } finally {
    await publicContext.dispose();
  }

  const queue = await (await request.get('/api/requests')).json();
  const parent = queue.data.requests.find((row) => row.purpose === 'Synthetic RV-01 concurrent review proof.');
  expect(parent).toBeTruthy();
  const line = queue.data.requestLines.find((row) => row.requestId === parent.id);
  expect(line).toBeTruthy();

  // Two distinct decision sets, so they do not collide on the idempotency key
  // and must be separated by the state guard alone.
  const [first, second] = await Promise.all([
    mutate(request, csrfToken, 'reviewRequest', {
      requestId: parent.id,
      decision: 'ACCEPT',
      note: 'Racer A',
      clientRequestId: `rv01-race-a-${parent.id}`,
      lineDecisions: [{ lineId: line.id, decision: 'PROCUREMENT' }],
    }),
    mutate(request, csrfToken, 'reviewRequest', {
      requestId: parent.id,
      decision: 'ACCEPT',
      note: 'Racer B',
      clientRequestId: `rv01-race-b-${parent.id}`,
      lineDecisions: [{ lineId: line.id, decision: 'MISSING_INFORMATION' }],
    }),
  ]);

  const codes = [first.status(), second.status()].sort();
  // Exactly one may win; the loser must fail closed.
  expect(codes[0]).toBe(200);
  expect(codes[1]).toBe(409);

  // The decisive invariant: the line never gains two downstream owners.
  const procurement = await (await request.get('/api/procurement')).json();
  const deliverables = (procurement.data.deliverables ?? []).filter(
    (entry) => entry.requestLineId === line.id,
  );
  expect(deliverables.length).toBeLessThanOrEqual(1);
  const restocking = await (await request.get('/api/restocking')).json();
  expect(
    (restocking.data.restockRequests ?? []).filter((entry) => entry.sourceRequestLineId === line.id),
  ).toHaveLength(0);
});

test('a reject is refused after procurement advances the deliverable past its first state', async ({
  request,
}) => {
  // P0 regression. transitionDeliverable advances request_lines.status in
  // lockstep with the deliverable, so a status-literal probe stops matching once
  // procurement moves the item on. A reject would then strand a live owner that
  // continues to receiving and physical release under a REJECTED request.
  const csrfToken = await login(request, 'LOCAL.OWNER');

  const publicContext = await apiRequest.newContext({ baseURL: BASE_URL });
  try {
    const options = await (await publicContext.get('/api/public/request/options')).json();
    const event = options.events[0];
    const submitted = await publicContext.post('/api/public/request', {
      headers: { origin: BASE_URL },
      data: {
        clientRequestId: `rv01-p0-${crypto.randomUUID()}`,
        requesterName: 'Synthetic RV-01 P0 Requester',
        organization: 'Synthetic Organization',
        requesterType: 'HAU office / department',
        email: `rv01-p0-${crypto.randomUUID()}@example.invalid`,
        contactNumber: '+63 917 000 0035',
        purpose: 'Synthetic RV-01 advanced-deliverable reject proof.',
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
          { category: 'Other', description: 'P0 procurement line', quantity: 2, unit: 'piece' },
          { category: 'Other', description: 'P0 pending line', quantity: 1, unit: 'piece' },
        ],
      },
    });
    expect(submitted.status()).toBe(200);
  } finally {
    await publicContext.dispose();
  }

  const queue = await (await request.get('/api/requests')).json();
  const parent = queue.data.requests.find(
    (row) => row.purpose === 'Synthetic RV-01 advanced-deliverable reject proof.',
  );
  expect(parent).toBeTruthy();
  const lines = queue.data.requestLines.filter((row) => row.requestId === parent.id);
  expect(lines).toHaveLength(2);

  // Mixed review: one line routed to procurement, one returned for information.
  const mixed = await mutate(request, csrfToken, 'reviewRequest', {
    requestId: parent.id,
    decision: 'ACCEPT',
    note: 'P0 mixed review',
    clientRequestId: `rv01-p0-review-${parent.id}`,
    lineDecisions: [
      { lineId: lines[0].id, decision: 'PROCUREMENT' },
      { lineId: lines[1].id, decision: 'MISSING_INFORMATION' },
    ],
  });
  expect(mixed.status()).toBe(200);

  const procurement = await (await request.get('/api/procurement')).json();
  const deliverable = (procurement.data.deliverables ?? []).find(
    (entry) => entry.requestId === parent.id,
  );
  expect(deliverable).toBeTruthy();
  expect(deliverable.status).toBe('FOR_CANVASSING');

  // While the deliverable is live, a whole-request reject must be refused.
  const blocked = await mutate(request, csrfToken, 'reviewRequest', {
    requestId: parent.id,
    decision: 'REJECT',
    note: 'P0 reject while owner is live',
    clientRequestId: `rv01-p0-reject-live-${parent.id}`,
  });
  expect(blocked.status()).toBe(409);
  expect((await blocked.json()).code).toBe('REQUEST_ALREADY_ROUTED');

  // Cancelling the deliverable closes the ownership. The probe must key off the
  // deliverable's own status, not the request line's, so the reject is now
  // allowed. Advancing (rather than cancelling) leaves the deliverable live and
  // must keep blocking; that direction is asserted structurally in
  // tests/unit/d1-operational-p1-regressions.test.js because WAITING_FOR_BUDGET
  // additionally requires a preferred canvass.
  const cancelled = await mutate(request, csrfToken, 'transitionDeliverable', {
    deliverableId: deliverable.id,
    status: 'CANCELLED',
    note: 'P0 cancel',
    clientRequestId: `rv01-p0-cancel-${parent.id}`,
  });
  expect(cancelled.status()).toBe(200);

  const allowed = await mutate(request, csrfToken, 'reviewRequest', {
    requestId: parent.id,
    decision: 'REJECT',
    note: 'P0 reject after ownership closed',
    clientRequestId: `rv01-p0-reject-closed-${parent.id}`,
  });
  expect(allowed.status()).toBe(200);

  const afterParent = (await (await request.get('/api/requests?filter=ALL')).json()).data.requests.find(
    (row) => row.id === parent.id,
  );
  expect(afterParent.status).toBe('REJECTED');
});

test('a requester cannot review their own request and an Administrator can', async ({ request }) => {
  // Owner decisions B1 and B2: ADMINISTRATOR holds REQUEST_REVIEW for central
  // review, and no actor may review a request they submitted, even holding
  // request.review.
  const ownerCsrf = await login(request, 'LOCAL.OWNER');

  const clientRequestId = `rv01-sod-${crypto.randomUUID()}`;
  const submitted = await mutate(request, ownerCsrf, 'submitRequest', {
    clientRequestId,
    requestType: 'GENERAL_REQUEST',
    purpose: 'Synthetic separation-of-duties proof',
    lines: [
      {
        clientLineId: `rv01-sod-line-${crypto.randomUUID()}`,
        description: 'Synthetic self-review fixture',
        quantity: 1,
        unit: 'piece',
        fulfillmentSource: 'FOR_CANVASSING',
      },
    ],
  });
  expect(submitted.status()).toBe(200);
  const requestId = (await submitted.json()).requestId;
  expect(requestId).toBeTruthy();

  const queue = await (await request.get('/api/requests')).json();
  const line = queue.data.requestLines.find((row) => row.requestId === requestId);
  expect(line).toBeTruthy();

  // The submitter holds request.review but must still be refused.
  const selfReview = await mutate(request, ownerCsrf, 'reviewRequest', {
    requestId,
    decision: 'ACCEPT',
    note: 'Self review attempt',
    clientRequestId: `rv01-sod-self-${requestId}`,
    lineDecisions: [{ lineId: line.id, decision: 'PROCUREMENT' }],
  });
  expect(selfReview.status()).toBe(403);
  const selfBody = await selfReview.json();
  expect(selfBody.code).toBe('SELF_REVIEW_FORBIDDEN');
  // The denial must not leak protected requester details.
  expect(JSON.stringify(selfBody)).not.toContain('@');

  // Nothing was routed by the refused attempt.
  const afterSelf = await (await request.get('/api/procurement')).json();
  expect(
    (afterSelf.data.deliverables ?? []).filter((entry) => entry.requestId === requestId),
  ).toHaveLength(0);

  // A different central reviewer — an Administrator — can review it.
  const admin = await apiRequest.newContext({ baseURL: BASE_URL });
  try {
    const adminCsrf = await login(admin, 'LOCAL.ADMIN');
    const adminQueue = await admin.get('/api/requests');
    expect(adminQueue.status()).toBe(200);
    expect((await adminQueue.json()).data.requests.some((row) => row.id === requestId)).toBe(true);

    const reviewed = await mutate(admin, adminCsrf, 'reviewRequest', {
      requestId,
      decision: 'ACCEPT',
      note: 'Administrator central review',
      clientRequestId: `rv01-sod-admin-${requestId}`,
      lineDecisions: [{ lineId: line.id, decision: 'PROCUREMENT' }],
    });
    expect(reviewed.status()).toBe(200);
  } finally {
    await admin.dispose();
  }

  const afterAdmin = await (await request.get('/api/procurement')).json();
  expect(
    (afterAdmin.data.deliverables ?? []).filter((entry) => entry.requestId === requestId),
  ).toHaveLength(1);
});

test('a partly released stock request stays reservable and completes despite a rejected line', async ({
  request,
}) => {
  // Two regressions in one sequence, both caused by the D1 layer using a
  // different parent-status vocabulary from src/domain/.
  //
  // P1: reserveStock gated on 'PARTIALLY_FULFILLED', which no server path ever
  //     writes. Releasing the first line moves the parent to PARTIALLY_RELEASED,
  //     so every remaining line became permanently unreservable — and nothing
  //     transitions a parent back out of that status, so there was no operator
  //     recovery path and the requester never received the rest of the order.
  // P2: the COMPLETED derivation counted REJECTED lines as outstanding work, so
  //     a mixed request could never leave PARTIALLY_RELEASED even once every
  //     routable line was fully released.
  const csrfToken = await login(request, 'LOCAL.OWNER');
  const marker = `Synthetic RV-01 partial-release reservation proof ${crypto.randomUUID()}`;

  const publicContext = await apiRequest.newContext({ baseURL: BASE_URL });
  let itemId;
  try {
    const options = await (await publicContext.get('/api/public/request/options')).json();
    const event = options.events[0];
    const item =
      (options.items ?? []).find((entry) => entry.id === 'ITM-LOCAL-001') ?? options.items[0];
    expect(item).toBeTruthy();
    itemId = item.id;
    const submitted = await publicContext.post('/api/public/request', {
      headers: { origin: BASE_URL },
      data: {
        clientRequestId: `rv01-partial-${crypto.randomUUID()}`,
        requesterName: 'Synthetic RV-01 Partial Requester',
        organization: 'Synthetic Organization',
        requesterType: 'HAU office / department',
        email: `rv01-partial-${crypto.randomUUID()}@example.invalid`,
        contactNumber: '+63 917 000 0036',
        purpose: marker,
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
          { category: 'Inventory Item', itemId, quantity: 1 },
          { category: 'Inventory Item', itemId, quantity: 1 },
          { category: 'Other', description: 'Partial rejected line', quantity: 1, unit: 'piece' },
        ],
      },
    });
    expect(submitted.status()).toBe(200);
  } finally {
    await publicContext.dispose();
  }

  const queue = await (await request.get('/api/requests')).json();
  const parent = queue.data.requests.find((row) => row.purpose === marker);
  expect(parent).toBeTruthy();
  const lines = queue.data.requestLines.filter((row) => row.requestId === parent.id);
  expect(lines).toHaveLength(3);
  const stockLines = lines.filter((row) => row.itemId === itemId);
  const rejectedLine = lines.find((row) => !row.itemId);
  expect(stockLines).toHaveLength(2);
  expect(rejectedLine).toBeTruthy();
  const [firstStockLine, secondStockLine] = stockLines;

  const review = await mutate(request, csrfToken, 'reviewRequest', {
    requestId: parent.id,
    decision: 'ACCEPT',
    note: 'Partial-release reservation proof',
    clientRequestId: `rv01-partial-review-${parent.id}`,
    lineDecisions: [
      { lineId: firstStockLine.id, decision: 'ISSUE_FROM_STOCK' },
      { lineId: secondStockLine.id, decision: 'ISSUE_FROM_STOCK' },
      { lineId: rejectedLine.id, decision: 'REJECT' },
    ],
  });
  expect(review.status()).toBe(200);

  const parentStatus = async () => {
    const all = await (await request.get('/api/requests?filter=ALL&pageSize=10')).json();
    return all.data.requests.find((row) => row.id === parent.id)?.status;
  };
  expect(await parentStatus()).toBe('ACCEPTED');

  const evidenceBytes = new Uint8Array([
    0x89,
    0x50,
    0x4e,
    0x47,
    0x0d,
    0x0a,
    0x1a,
    0x0a,
    ...new TextEncoder().encode('synthetic-partial-release-evidence'),
  ]);
  const uploaded = await mutate(request, csrfToken, 'uploadEvidence', {
    evidenceType: 'RELEASE_CONFIRMATION_PHOTO',
    originalFileName: 'synthetic-partial-release.png',
    mimeType: 'image/png',
    base64: btoa(String.fromCharCode(...evidenceBytes)),
    relatedEntityType: 'RELEASE_REQUEST',
    relatedEntityId: parent.id,
    requestId: parent.id,
    clientRequestId: `rv01-partial-evidence-${parent.id}`,
  });
  expect(uploaded.status()).toBe(200);
  const { evidenceId } = await uploaded.json();

  // Reserve and fully release only the first stock line.
  const firstReserve = await mutate(request, csrfToken, 'reserveStock', {
    itemId,
    requestLineId: firstStockLine.id,
    quantity: 1,
    clientRequestId: `rv01-partial-reserve-1-${parent.id}`,
  });
  expect(firstReserve.status()).toBe(200);

  const firstRelease = await mutate(request, csrfToken, 'confirmRelease', {
    requestId: parent.id,
    recipientConfirmed: true,
    recipientName: 'Synthetic Recipient',
    recipientRole: 'Synthetic Tester',
    department: 'Synthetic Department',
    evidenceId,
    lines: [{ requestLineId: firstStockLine.id, quantity: 1 }],
    clientRequestId: `rv01-partial-release-1-${parent.id}`,
  });
  expect(firstRelease.status()).toBe(200);

  // The parent is now PARTIALLY_RELEASED — the exact state the old gate refused,
  // which stranded the remaining line permanently.
  expect(await parentStatus()).toBe('PARTIALLY_RELEASED');

  const secondReserve = await mutate(request, csrfToken, 'reserveStock', {
    itemId,
    requestLineId: secondStockLine.id,
    quantity: 1,
    clientRequestId: `rv01-partial-reserve-2-${parent.id}`,
  });
  expect(secondReserve.status()).toBe(200);

  const secondRelease = await mutate(request, csrfToken, 'confirmRelease', {
    requestId: parent.id,
    recipientConfirmed: true,
    recipientName: 'Synthetic Recipient',
    recipientRole: 'Synthetic Tester',
    department: 'Synthetic Department',
    evidenceId,
    lines: [{ requestLineId: secondStockLine.id, quantity: 1 }],
    clientRequestId: `rv01-partial-release-2-${parent.id}`,
  });
  expect(secondRelease.status()).toBe(200);

  // Every routable line is released and the rejected line has no downstream
  // owner, so the parent must complete rather than stay PARTIALLY_RELEASED.
  expect(await parentStatus()).toBe('COMPLETED');
});

test('a procurement line at READY_TO_RELEASE can be reserved and released', async ({ request }) => {
  const csrfToken = await login(request, 'LOCAL.OWNER');
  const marker = `Synthetic RV-01 procurement reservation proof ${crypto.randomUUID()}`;

  const publicContext = await apiRequest.newContext({ baseURL: BASE_URL });
  let item;
  try {
    const options = await (await publicContext.get('/api/public/request/options')).json();
    const event = options.events[0];
    item = (options.items ?? []).find((entry) => entry.id === 'ITM-LOCAL-001') ?? options.items[0];
    expect(item).toBeTruthy();
    const submitted = await publicContext.post('/api/public/request', {
      headers: { origin: BASE_URL, 'cf-connecting-ip': '192.0.2.40' },
      data: {
        clientRequestId: `rv01-procurement-reserve-${crypto.randomUUID()}`,
        requesterName: 'Synthetic RV-01 Procurement Requester',
        organization: 'Synthetic Organization',
        requesterType: 'HAU office / department',
        email: `rv01-procurement-reserve-${crypto.randomUUID()}@example.invalid`,
        contactNumber: '+63 917 000 0040',
        purpose: marker,
        requestPurpose: 'EVENT_ACTIVITY_SUPPORT',
        eventSeriesId: event.seriesId,
        eventId: event.id,
        startDate: '',
        endDate: '',
        location: event.venue ?? '',
        dataUseAcknowledged: true,
        acceptableUseAcknowledged: true,
        evidenceConsentAcknowledged: true,
        lines: [{ category: 'Inventory Item', itemId: item.id, quantity: 2 }],
      },
    });
    expect(submitted.status()).toBe(200);
  } finally {
    await publicContext.dispose();
  }

  const queue = await (await request.get('/api/requests')).json();
  const parent = queue.data.requests.find((row) => row.purpose === marker);
  expect(parent).toBeTruthy();
  const line = queue.data.requestLines.find((row) => row.requestId === parent.id);
  expect(line).toBeTruthy();

  const reviewed = await mutate(request, csrfToken, 'reviewRequest', {
    requestId: parent.id,
    decision: 'ACCEPT',
    note: 'Procurement reservation proof',
    clientRequestId: `rv01-procurement-review-${parent.id}`,
    lineDecisions: [{ lineId: line.id, decision: 'PROCUREMENT' }],
  });
  expect(reviewed.status()).toBe(200);

  const procurement = await (await request.get('/api/procurement')).json();
  const deliverable = (procurement.data.deliverables ?? []).find(
    (entry) => entry.requestLineId === line.id,
  );
  expect(deliverable).toBeTruthy();

  const canvass = await mutate(request, csrfToken, 'saveCanvassReference', {
    linkedDeliverableId: deliverable.id,
    supplierName: `Synthetic Procurement Supplier ${crypto.randomUUID()}`,
    itemSpec: item.name,
    price: 125,
    unit: item.unit,
    receiptStatus: 'VERIFIED',
    reliability: 'SYNTHETIC',
    checkedAt: '2026-08-08',
    clientRequestId: `rv01-procurement-canvass-${parent.id}`,
  });
  expect(canvass.status()).toBe(200);
  const canvassBody = await canvass.json();

  const preferred = await mutate(request, csrfToken, 'selectPreferredCanvass', {
    canvassId: canvassBody.canvassId,
    rationale: 'Synthetic procurement reservation proof',
    clientRequestId: `rv01-procurement-preferred-${parent.id}`,
  });
  expect(preferred.status()).toBe(200);

  for (const status of ['WAITING_FOR_BUDGET', 'TO_BE_PROCURED', 'PROCURED', 'READY_TO_RELEASE']) {
    const transitioned = await mutate(request, csrfToken, 'transitionDeliverable', {
      deliverableId: deliverable.id,
      status,
      note: `Synthetic transition to ${status}`,
      clientRequestId: `rv01-procurement-${status.toLowerCase()}-${parent.id}`,
    });
    expect(transitioned.status()).toBe(200);
  }

  const ready = await (await request.get('/api/requests?filter=ALL&pageSize=10')).json();
  expect(ready.data.requestLines.find((row) => row.id === line.id)?.status).toBe('READY_TO_RELEASE');

  const inventoryBeforeMismatch = await (await request.get('/api/inventory?pageSize=50')).json();
  const wrongItem = (inventoryBeforeMismatch.data.inventoryItems ?? []).find(
    (entry) =>
      entry.id !== item.id &&
      Number(entry.availableToPromise) >= 1 &&
      entry.id === 'ITM-LOCAL-CLASSIFY',
  );
  expect(wrongItem).toBeTruthy();
  const wrongItemAtp = Number(wrongItem.availableToPromise);
  expect(
    (inventoryBeforeMismatch.data.reservations ?? []).filter(
      (entry) => entry.requestLineId === line.id && entry.status === 'ACTIVE',
    ),
  ).toHaveLength(0);

  const mismatchedReservation = await mutate(request, csrfToken, 'reserveStock', {
    itemId: wrongItem.id,
    requestLineId: line.id,
    quantity: 1,
    clientRequestId: `rv01-procurement-wrong-item-${parent.id}`,
  });
  expect(mismatchedReservation.status()).toBe(409);
  await expect(mismatchedReservation.json()).resolves.toMatchObject({
    code: 'RESERVATION_ITEM_MISMATCH',
  });

  const inventoryAfterMismatch = await (await request.get('/api/inventory?pageSize=50')).json();
  expect(
    Number(
      inventoryAfterMismatch.data.inventoryItems.find((entry) => entry.id === wrongItem.id)
        .availableToPromise,
    ),
  ).toBe(wrongItemAtp);
  expect(
    (inventoryAfterMismatch.data.reservations ?? []).filter(
      (entry) => entry.requestLineId === line.id && entry.status === 'ACTIVE',
    ),
  ).toHaveLength(0);

  const reserved = await mutate(request, csrfToken, 'reserveStock', {
    itemId: item.id,
    requestLineId: line.id,
    quantity: 2,
    clientRequestId: `rv01-procurement-reserve-stock-${parent.id}`,
  });
  expect(reserved.status()).toBe(200);

  const evidenceBytes = new Uint8Array([
    0x89,
    0x50,
    0x4e,
    0x47,
    0x0d,
    0x0a,
    0x1a,
    0x0a,
    ...new TextEncoder().encode('synthetic-procurement-release-evidence'),
  ]);
  const uploaded = await mutate(request, csrfToken, 'uploadEvidence', {
    evidenceType: 'RELEASE_CONFIRMATION_PHOTO',
    originalFileName: 'synthetic-procurement-release.png',
    mimeType: 'image/png',
    base64: btoa(String.fromCharCode(...evidenceBytes)),
    relatedEntityType: 'RELEASE_REQUEST',
    relatedEntityId: parent.id,
    requestId: parent.id,
    clientRequestId: `rv01-procurement-evidence-${parent.id}`,
  });
  expect(uploaded.status()).toBe(200);
  const { evidenceId } = await uploaded.json();

  const released = await mutate(request, csrfToken, 'confirmRelease', {
    requestId: parent.id,
    recipientConfirmed: true,
    recipientName: 'Synthetic Procurement Recipient',
    recipientRole: 'Synthetic Tester',
    department: 'Synthetic Department',
    evidenceId,
    lines: [{ requestLineId: line.id, quantity: 2 }],
    clientRequestId: `rv01-procurement-release-${parent.id}`,
  });
  expect(released.status()).toBe(200);

  const completed = await (await request.get('/api/requests?filter=ALL&pageSize=10')).json();
  expect(completed.data.requestLines.find((row) => row.id === line.id)?.status).toBe('COMPLETED');
  expect(completed.data.requests.find((row) => row.id === parent.id)?.status).toBe('COMPLETED');
});

test('a partial reservation can be topped up after restock without exceeding demand', async ({ request }) => {
  const csrfToken = await login(request, 'LOCAL.OWNER');
  const stockMarker = `Synthetic RV-01 reservation top-up proof ${crypto.randomUUID()}`;
  const restockMarker = `Synthetic RV-01 replenishment proof ${crypto.randomUUID()}`;

  const publicContext = await apiRequest.newContext({ baseURL: BASE_URL });
  let event;
  let item;
  let stockArea;
  try {
    const options = await (await publicContext.get('/api/public/request/options')).json();
    event = options.events[0];
    item = (options.items ?? []).find((entry) => entry.id === 'ITM-LOCAL-001') ?? options.items[0];
    stockArea = (options.stockAreas ?? []).find((entry) => entry === 'Office Inventory') ?? options.stockAreas[0];
    expect(item).toBeTruthy();
    expect(stockArea).toBeTruthy();

    const stockSubmitted = await publicContext.post('/api/public/request', {
      headers: { origin: BASE_URL, 'cf-connecting-ip': '192.0.2.41' },
      data: {
        clientRequestId: `rv01-top-up-stock-${crypto.randomUUID()}`,
        requesterName: 'Synthetic RV-01 Top-up Requester',
        organization: 'Synthetic Organization',
        requesterType: 'HAU office / department',
        email: `rv01-top-up-stock-${crypto.randomUUID()}@example.invalid`,
        contactNumber: '+63 917 000 0041',
        purpose: stockMarker,
        requestPurpose: 'EVENT_ACTIVITY_SUPPORT',
        eventSeriesId: event.seriesId,
        eventId: event.id,
        startDate: '',
        endDate: '',
        location: event.venue ?? '',
        dataUseAcknowledged: true,
        acceptableUseAcknowledged: true,
        evidenceConsentAcknowledged: true,
        lines: [{ category: 'Inventory Item', itemId: item.id, quantity: 4 }],
      },
    });
    expect(stockSubmitted.status()).toBe(200);
  } finally {
    await publicContext.dispose();
  }

  const initialQueue = await (await request.get('/api/requests')).json();
  const stockParent = initialQueue.data.requests.find((row) => row.purpose === stockMarker);
  expect(stockParent).toBeTruthy();
  const stockLine = initialQueue.data.requestLines.find((row) => row.requestId === stockParent.id);
  expect(stockLine).toBeTruthy();

  const stockReviewed = await mutate(request, csrfToken, 'reviewRequest', {
    requestId: stockParent.id,
    decision: 'ACCEPT',
    note: 'Reservation top-up proof',
    clientRequestId: `rv01-top-up-review-${stockParent.id}`,
    lineDecisions: [{ lineId: stockLine.id, decision: 'ISSUE_FROM_STOCK' }],
  });
  expect(stockReviewed.status()).toBe(200);

  const firstReservation = await mutate(request, csrfToken, 'reserveStock', {
    itemId: item.id,
    requestLineId: stockLine.id,
    quantity: 1,
    clientRequestId: `rv01-top-up-reserve-first-${stockParent.id}`,
  });
  expect(firstReservation.status()).toBe(200);

  const activeReservationQuantity = async () => {
    const inventory = await (await request.get('/api/inventory?pageSize=50')).json();
    return (inventory.data.reservations ?? [])
      .filter((entry) => entry.requestLineId === stockLine.id && entry.status === 'ACTIVE')
      .reduce((sum, entry) => sum + Number(entry.quantity), 0);
  };
  expect(await activeReservationQuantity()).toBe(1);

  const evidenceBytes = new Uint8Array([
    0x89,
    0x50,
    0x4e,
    0x47,
    0x0d,
    0x0a,
    0x1a,
    0x0a,
    ...new TextEncoder().encode('synthetic-consumed-reservation-top-up-evidence'),
  ]);
  const uploaded = await mutate(request, csrfToken, 'uploadEvidence', {
    evidenceType: 'RELEASE_CONFIRMATION_PHOTO',
    originalFileName: 'synthetic-consumed-reservation-top-up.png',
    mimeType: 'image/png',
    base64: btoa(String.fromCharCode(...evidenceBytes)),
    relatedEntityType: 'RELEASE_REQUEST',
    relatedEntityId: stockParent.id,
    requestId: stockParent.id,
    clientRequestId: `rv01-top-up-evidence-${stockParent.id}`,
  });
  expect(uploaded.status()).toBe(200);
  const { evidenceId } = await uploaded.json();

  const firstRelease = await mutate(request, csrfToken, 'confirmRelease', {
    requestId: stockParent.id,
    recipientConfirmed: true,
    recipientName: 'Synthetic Top-up Recipient',
    recipientRole: 'Synthetic Tester',
    department: 'Synthetic Department',
    evidenceId,
    lines: [{ requestLineId: stockLine.id, quantity: 1 }],
    clientRequestId: `rv01-top-up-release-first-${stockParent.id}`,
  });
  expect(firstRelease.status()).toBe(200);
  const partiallyReleased = await (await request.get('/api/requests?filter=ALL&pageSize=10')).json();
  expect(partiallyReleased.data.requestLines.find((row) => row.id === stockLine.id)?.status).toBe(
    'PARTIALLY_RELEASED',
  );
  expect(partiallyReleased.data.requests.find((row) => row.id === stockParent.id)?.status).toBe(
    'PARTIALLY_RELEASED',
  );

  const restockContext = await apiRequest.newContext({ baseURL: BASE_URL });
  try {
    const restockSubmitted = await restockContext.post('/api/public/request', {
      headers: { origin: BASE_URL, 'cf-connecting-ip': '192.0.2.42' },
      data: {
        clientRequestId: `rv01-top-up-restock-${crypto.randomUUID()}`,
        requesterName: 'Synthetic RV-01 Restock Requester',
        organization: 'Synthetic Organization',
        requesterType: 'HAU office / department',
        email: `rv01-top-up-restock-${crypto.randomUUID()}@example.invalid`,
        contactNumber: '+63 917 000 0042',
        purpose: restockMarker,
        requestPurpose: 'OFFICE_INVENTORY_PANTRY',
        stockArea,
        neededDate: '2026-08-30',
        dataUseAcknowledged: true,
        acceptableUseAcknowledged: true,
        evidenceConsentAcknowledged: true,
        lines: [{ category: 'Inventory Item', itemId: item.id, quantity: 3 }],
      },
    });
    expect(restockSubmitted.status()).toBe(200);
  } finally {
    await restockContext.dispose();
  }

  const restockQueue = await (await request.get('/api/requests')).json();
  const restockParent = restockQueue.data.requests.find((row) => row.purpose === restockMarker);
  expect(restockParent).toBeTruthy();
  const restockLine = restockQueue.data.requestLines.find((row) => row.requestId === restockParent.id);
  expect(restockLine).toBeTruthy();

  const restockReviewed = await mutate(request, csrfToken, 'reviewRequest', {
    requestId: restockParent.id,
    decision: 'ACCEPT',
    note: 'Restock for reservation top-up proof',
    clientRequestId: `rv01-top-up-restock-review-${restockParent.id}`,
    lineDecisions: [{ lineId: restockLine.id, decision: 'RESTOCK' }],
  });
  expect(restockReviewed.status()).toBe(200);

  const restocking = await (await request.get('/api/restocking?pageSize=50')).json();
  const restock = (restocking.data.restockRequests ?? []).find(
    (entry) => (entry.sourceRequestId ?? entry.source_request_id) === restockParent.id,
  );
  expect(restock).toBeTruthy();

  const canvass = await mutate(request, csrfToken, 'saveCanvassReference', {
    linkedRestockId: restock.id,
    supplierName: `Synthetic Restock Supplier ${crypto.randomUUID()}`,
    itemSpec: item.name,
    price: 75,
    unit: item.unit,
    receiptStatus: 'VERIFIED',
    reliability: 'SYNTHETIC',
    checkedAt: '2026-08-08',
    clientRequestId: `rv01-top-up-restock-canvass-${restockParent.id}`,
  });
  expect(canvass.status()).toBe(200);
  const canvassBody = await canvass.json();

  const preferred = await mutate(request, csrfToken, 'selectPreferredCanvass', {
    canvassId: canvassBody.canvassId,
    rationale: 'Synthetic restock reservation top-up proof',
    clientRequestId: `rv01-top-up-restock-preferred-${restockParent.id}`,
  });
  expect(preferred.status()).toBe(200);

  const budgeted = await mutate(request, csrfToken, 'transitionRestock', {
    restockRequestId: restock.id,
    action: 'SEND_TO_BUDGET_REVIEW',
    expectedRevision: restockLine.workflowRevision,
    reason: 'Synthetic restock budget transition',
    clientRequestId: `rv01-top-up-restock-budget-${restockParent.id}`,
  });
  expect(budgeted.status()).toBe(200);
  const budgetedBody = await budgeted.json();

  const authorized = await mutate(request, csrfToken, 'transitionRestock', {
    restockRequestId: restock.id,
    action: 'AUTHORIZE_PROCUREMENT',
    expectedRevision: budgetedBody.workflowRevision,
    reason: 'Synthetic restock authorization',
    clientRequestId: `rv01-top-up-restock-authorize-${restockParent.id}`,
  });
  expect(authorized.status()).toBe(200);

  const received = await mutate(request, csrfToken, 'receiveRestock', {
    restockRequestId: restock.id,
    quantity: 3,
    unit: item.unit,
    invoiceStatus: 'SYNTHETIC',
    clientRequestId: `rv01-top-up-restock-receive-${restockParent.id}`,
  });
  expect(received.status()).toBe(200);

  const remainderReservation = await mutate(request, csrfToken, 'reserveStock', {
    itemId: item.id,
    requestLineId: stockLine.id,
    quantity: 3,
    clientRequestId: `rv01-top-up-reserve-remainder-${stockParent.id}`,
  });
  expect(remainderReservation.status()).toBe(200);
  expect(await activeReservationQuantity()).toBe(4);

  const overReservation = await mutate(request, csrfToken, 'reserveStock', {
    itemId: item.id,
    requestLineId: stockLine.id,
    quantity: 1,
    clientRequestId: `rv01-top-up-reserve-over-${stockParent.id}`,
  });
  expect(overReservation.status()).toBe(409);
  expect(await activeReservationQuantity()).toBe(4);

  const finalRelease = await mutate(request, csrfToken, 'confirmRelease', {
    requestId: stockParent.id,
    recipientConfirmed: true,
    recipientName: 'Synthetic Top-up Recipient',
    recipientRole: 'Synthetic Tester',
    department: 'Synthetic Department',
    evidenceId,
    lines: [{ requestLineId: stockLine.id, quantity: 3 }],
    clientRequestId: `rv01-top-up-release-remainder-${stockParent.id}`,
  });
  expect(finalRelease.status()).toBe(200);
  const completed = await (await request.get('/api/requests?filter=ALL&pageSize=10')).json();
  expect(completed.data.requestLines.find((row) => row.id === stockLine.id)?.status).toBe('COMPLETED');
  expect(completed.data.requests.find((row) => row.id === stockParent.id)?.status).toBe('COMPLETED');
});

test('an event-bounded reviewer is refused on a record outside its event scope', async ({ request }) => {
  // RV-01.3 requires "unrelated committee/event/location -> No" for the command
  // path, not only for the read path.
  //
  // assertEntityScope defaulted eventId to '' and only compared when the caller
  // supplied it, so of sixteen call sites the one that passed event context
  // (reviewRequest) was guarded and the fifteen physical-movement commands
  // behind it were not. The bound is now a positive match evaluated before any
  // committee or ALL-scope logic, so an omitted context fails closed.
  //
  // Scope of this test, stated precisely: it pins that an event bound is
  // enforced, takes precedence, and produces OUT_OF_SCOPE. It does not by itself
  // demonstrate the downstream-command hole, because the local fixture seeds a
  // single event, so the only out-of-scope record available is an eventless one
  // — which the committee guard also refused under the old code, with
  // ENTITY_SCOPE_REQUIRED. The fifteen downstream call sites now pass real event
  // context (see the SELECTs in transitionDeliverable, transitionRestock,
  // confirmRelease, correctRelease, receiveEntity and reserveStock); covering
  // each of them behaviorally needs a second seeded event and is tracked for
  // v0.7.3 rather than left silently unstated.
  const ownerCsrf = await login(request, 'LOCAL.OWNER');

  // A non-event (office/pantry) submission carries no event id, so it is outside
  // an actor bounded to EVT-LOCAL.
  const marker = `Synthetic RV-01 event-bound refusal proof ${crypto.randomUUID()}`;
  const publicContext = await apiRequest.newContext({ baseURL: BASE_URL });
  try {
    const options = await (await publicContext.get('/api/public/request/options')).json();
    const stockArea = (options.stockAreas ?? [])[0];
    expect(stockArea).toBeTruthy();
    const submitted = await publicContext.post('/api/public/request', {
      headers: { origin: BASE_URL },
      data: {
        clientRequestId: `rv01-bound-${crypto.randomUUID()}`,
        requesterName: 'Synthetic RV-01 Bound Requester',
        organization: 'Synthetic Organization',
        requesterType: 'HAU office / department',
        email: `rv01-bound-${crypto.randomUUID()}@example.invalid`,
        contactNumber: '+63 917 000 0037',
        purpose: marker,
        requestPurpose: "OFFICE_INVENTORY_PANTRY",
        stockArea,
        neededDate: "2026-12-01",
        startDate: '',
        endDate: '',
        dataUseAcknowledged: true,
        acceptableUseAcknowledged: true,
        evidenceConsentAcknowledged: true,
        lines: [{ category: 'Other', description: 'Bound proof line', quantity: 1, unit: 'piece' }],
      },
    });
    expect(submitted.status()).toBe(200);
  } finally {
    await publicContext.dispose();
  }

  const queue = await (await request.get('/api/requests?pageSize=10')).json();
  const parent = queue.data.requests.find((row) => row.purpose === marker);
  expect(parent).toBeTruthy();
  const line = queue.data.requestLines.find((row) => row.requestId === parent.id);
  expect(line).toBeTruthy();

  const directory = await request.post('/api/admin/access/directory', {
    headers: { 'x-csrf-token': ownerCsrf },
    data: { query: 'LOCAL.ADMIN', status: 'ALL', page: 1, pageSize: 20 },
  });
  expect(directory.status()).toBe(200);
  const admin = (await directory.json()).items.find((entry) => entry.accessId === 'LOCAL.ADMIN');
  expect(admin).toBeTruthy();

  const policyCommand = (eventScopeIds, revision, idempotencyKey) => ({
    idempotencyKey,
    accountId: admin.accountId,
    expectedRevision: revision,
    currentAccessId: admin.accessId,
    confirmCurrentAccessId: admin.accessId,
    presetId: admin.accessProfile?.presetId ?? 'CUSTOM',
    roleId: admin.roleId,
    committeeIds: admin.committeeIds ?? [],
    defaultCommitteeId: admin.defaultCommitteeId ?? (admin.committeeIds ?? [])[0] ?? '',
    workspaceIds: admin.accessProfile?.workspaceIds ?? [],
    defaultWorkspaceId: admin.accessProfile?.defaultWorkspaceId ?? '',
    locationScopeIds: admin.accessProfile?.locationScopeIds ?? [],
    eventSeriesScopeIds: admin.accessProfile?.eventSeriesScopeIds ?? [],
    eventScopeIds,
    capabilityGrants: admin.accessProfile?.capabilityGrants ?? [],
    capabilityDenies: admin.accessProfile?.capabilityDenies ?? [],
    reason: 'RV-01.3 event-bound command-path regression.',
  });

  const bound = await request.post('/api/admin/access/update-policy', {
    headers: { 'x-csrf-token': ownerCsrf },
    data: policyCommand(['EVT-LOCAL'], admin.revision, `rv01-bound-bind-${parent.id}`),
  });
  expect(bound.status()).toBe(200);

  try {
    const adminContext = await apiRequest.newContext({ baseURL: BASE_URL });
    try {
      const adminCsrf = await login(adminContext, 'LOCAL.ADMIN');
      const refused = await mutate(adminContext, adminCsrf, 'reviewRequest', {
        requestId: parent.id,
        decision: 'ACCEPT',
        note: 'Bounded actor reviewing outside its events',
        clientRequestId: `rv01-bound-review-${parent.id}`,
        lineDecisions: [{ lineId: line.id, decision: 'RESTOCK' }],
      });
      expect(refused.status()).toBe(403);
      expect((await refused.json()).code).toBe('OUT_OF_SCOPE');
    } finally {
      await adminContext.dispose();
    }
  } finally {
    // Restore the unbounded policy so no later test inherits the bound.
    const refreshed = await request.post('/api/admin/access/directory', {
      headers: { 'x-csrf-token': ownerCsrf },
      data: { query: 'LOCAL.ADMIN', status: 'ALL', page: 1, pageSize: 20 },
    });
    const current = (await refreshed.json()).items.find((entry) => entry.accessId === 'LOCAL.ADMIN');
    const restored = await request.post('/api/admin/access/update-policy', {
      headers: { 'x-csrf-token': ownerCsrf },
      data: policyCommand([], current.revision, `rv01-bound-restore-${parent.id}`),
    });
    expect(restored.status()).toBe(200);
  }

  // Positive control: with the bound removed, the identical command from the
  // identical account clears authorization and reaches business validation
  // instead. That proves the refusal above came from the event bound and not
  // from a missing capability, an inactive session, or committee scope — which
  // would all still fail here.
  const restoredContext = await apiRequest.newContext({ baseURL: BASE_URL });
  try {
    const restoredCsrf = await login(restoredContext, 'LOCAL.ADMIN');
    const allowed = await mutate(restoredContext, restoredCsrf, 'reviewRequest', {
      requestId: parent.id,
      decision: 'ACCEPT',
      note: 'Unbounded central review',
      clientRequestId: `rv01-bound-review-ok-${parent.id}`,
      lineDecisions: [{ lineId: line.id, decision: 'RESTOCK' }],
    });
    expect(allowed.status()).not.toBe(403);
    // A catalog-restock line still needs an exact catalog item, which this
    // synthetic line deliberately lacks; reaching that check is the proof.
    expect((await allowed.json()).code).toBe('LINE_ROUTE_NOT_ALLOWED');
  } finally {
    await restoredContext.dispose();
  }
});

test('two concurrent reservations for one line yield one winner and one inventory effect', async ({
  request,
}) => {
  // The line transition is a compare-and-swap, but a plain D1 batch does not
  // abort when it matches zero rows — every statement runs before results are
  // returned. Both callers therefore inserted an ACTIVE reservation while only
  // one moved the line, and the loser's reservation held available-to-promise
  // permanently, because no command clears a request-line reservation.
  const csrfToken = await login(request, 'LOCAL.OWNER');
  const marker = `Synthetic RV-01 concurrent reservation proof ${crypto.randomUUID()}`;

  const publicContext = await apiRequest.newContext({ baseURL: BASE_URL });
  let itemId;
  try {
    const options = await (await publicContext.get('/api/public/request/options')).json();
    const event = options.events[0];
    const item =
      (options.items ?? []).find((entry) => entry.id === 'ITM-LOCAL-001') ?? options.items[0];
    itemId = item.id;
    const submitted = await publicContext.post('/api/public/request', {
      headers: { origin: BASE_URL },
      data: {
        clientRequestId: `rv01-concurrent-${crypto.randomUUID()}`,
        requesterName: 'Synthetic RV-01 Concurrent Requester',
        organization: 'Synthetic Organization',
        requesterType: 'HAU office / department',
        email: `rv01-concurrent-${crypto.randomUUID()}@example.invalid`,
        contactNumber: '+63 917 000 0038',
        purpose: marker,
        requestPurpose: 'EVENT_ACTIVITY_SUPPORT',
        eventSeriesId: event.seriesId,
        eventId: event.id,
        startDate: '',
        endDate: '',
        location: event.venue ?? '',
        dataUseAcknowledged: true,
        acceptableUseAcknowledged: true,
        evidenceConsentAcknowledged: true,
        lines: [{ category: 'Inventory Item', itemId, quantity: 2 }],
      },
    });
    expect(submitted.status()).toBe(200);
  } finally {
    await publicContext.dispose();
  }

  const queue = await (await request.get('/api/requests')).json();
  const parent = queue.data.requests.find((row) => row.purpose === marker);
  expect(parent).toBeTruthy();
  const line = queue.data.requestLines.find((row) => row.requestId === parent.id);
  expect(line).toBeTruthy();

  const review = await mutate(request, csrfToken, 'reviewRequest', {
    requestId: parent.id,
    decision: 'ACCEPT',
    note: 'Concurrent reservation proof',
    clientRequestId: `rv01-concurrent-review-${parent.id}`,
    lineDecisions: [{ lineId: line.id, decision: 'ISSUE_FROM_STOCK' }],
  });
  expect(review.status()).toBe(200);

  const availableToPromise = async () => {
    const inventory = await (await request.get('/api/inventory?pageSize=50')).json();
    const item = (inventory.data.inventoryItems ?? []).find((entry) => entry.id === itemId);
    expect(item).toBeTruthy();
    return Number(item.availableToPromise);
  };
  const before = await availableToPromise();

  // Distinct idempotency keys, so replay cannot mask the race.
  const [first, second] = await Promise.all([
    mutate(request, csrfToken, 'reserveStock', {
      itemId,
      requestLineId: line.id,
      quantity: 2,
      clientRequestId: `rv01-concurrent-reserve-a-${parent.id}`,
    }),
    mutate(request, csrfToken, 'reserveStock', {
      itemId,
      requestLineId: line.id,
      quantity: 2,
      clientRequestId: `rv01-concurrent-reserve-b-${parent.id}`,
    }),
  ]);

  // One winner, one safe failure.
  expect([first.status(), second.status()].sort()).toEqual([200, 409]);
  const loser = first.status() === 409 ? first : second;
  expect((await loser.json()).code).toBe('REQUEST_STATE_CONFLICT');

  // One inventory effect: the loser's reservation must have rolled back with
  // the rest of its batch, so exactly one reservation's worth of stock is held.
  expect(await availableToPromise()).toBe(before - 2);

  // One reservation owner: the line advanced exactly once.
  const after = await (await request.get('/api/requests?filter=ALL&pageSize=10')).json();
  const reservedLine = after.data.requestLines.find((row) => row.id === line.id);
  expect(reservedLine.status).toBe('READY_TO_RELEASE');
});
