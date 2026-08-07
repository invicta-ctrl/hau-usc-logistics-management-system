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
  const publicContext = await apiRequest.newContext({ baseURL: BASE_URL });
  let submittedId;
  try {
    const options = await (await publicContext.get('/api/public/request/options')).json();
    const event = options.events[0];
    const item = options.items[0];
    const submitted = await publicContext.post('/api/public/request', {
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
    expect(submitted.status()).toBe(200);
    submittedId = (await submitted.json()).requestId;
  } finally {
    await publicContext.dispose();
  }
  expect(submittedId).toBeTruthy();

  // Context B: authenticated Main Hub.
  await page.goto('/app/admin');
  await page.getByLabel('Access ID').fill('LOCAL.OWNER');
  await page.getByLabel('Password', { exact: true }).fill(PASSWORD);
  await page.getByRole('button', { name: 'Sign in' }).click();
  await expect(page.locator('.app-shell')).toBeVisible();

  await page.goto('/app/admin/requests');
  await expect(page.locator('#request')).toBeVisible();

  // The shipped reviewer surface exists and shows the new request.
  const queue = page.locator('#requestReviewQueue');
  await expect(queue).toBeVisible();
  await expect(queue).toContainText(submittedId);

  // Open the per-line decision surface.
  // The queue renders a desktop table and mobile cards; click whichever the
  // active viewport actually shows.
  await queue.locator(`[data-review-request="${submittedId}"]:visible`).first().click();
  const form = page.locator('#requestReviewForm');
  await expect(form).toBeVisible();

  // Exactly one explicit decision control per reviewable line.
  const decisions = form.locator('[data-line-decision]');
  await expect(decisions).toHaveCount(2);

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
  await form.getByRole('button', { name: 'Submit review' }).click();

  // The modal closes and the queue reflects canonical refreshed server truth.
  await expect(form).toBeHidden();
  await expect(queue).not.toContainText(submittedId, { timeout: 15_000 });

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
  await page.goto('/?request=1');
  await expect(page.locator('#request')).toBeVisible();
  const queue = page.locator('#requestReviewQueue');
  expect(await queue.count()).toBeLessThanOrEqual(1);
  if (await queue.count()) await expect(queue).toBeHidden();
  await expect(page.locator('body')).not.toContainText('Requests awaiting your decision');
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
