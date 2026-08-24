import { expect, test } from '@playwright/test';

const exactInspectionPort = process.env.HAU_FRONTEND_E2E_PORT === '4173';

function fulfill(route, body, status = 200) {
  return route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });
}

function ticket(overrides) {
  return {
    id: 'LEND-REVIEW',
    itemId: 'ITM-MARKER',
    requestedItemId: 'ITM-MARKER',
    quantity: 4,
    requestedQuantity: 4,
    unit: 'pack',
    studentIdNumber: '20260041',
    borrowerName: 'FI-07 Angelite',
    borrowerType: 'ANGELITE',
    department: 'School of Engineering',
    contact: '09170000000',
    email: 'angelite@example.test',
    courseYear: 'BSIE 3',
    positionRole: '',
    purpose: 'Authoritative lending test fixture',
    dueAt: '',
    requestedStartAt: '2026-08-24T09:00:00.000Z',
    requestedEndAt: '',
    ticketType: 'CONSUMABLE',
    status: 'FOR_REVIEW',
    reviewDecision: '',
    reviewNotes: '',
    rejectionReason: '',
    substitutionNote: '',
    eligibilitySource: '',
    eligibilityReviewedBy: '',
    eligibilityReviewedAt: '',
    assetOptions: [],
    history: [
      {
        previousStatus: '',
        newStatus: 'FOR_REVIEW',
        changedAt: '2026-08-24T09:00:00.000Z',
        changedBy: 'FI-07 fixture',
        reason: 'Authoritative fixture',
        metadata: {},
      },
    ],
    createdAt: '2026-08-24T09:00:00.000Z',
    updatedAt: '2026-08-24T09:00:00.000Z',
    ...overrides,
  };
}

function inventoryItem(overrides) {
  return {
    id: 'ITM-MARKER',
    name: 'Marker packs',
    category: 'Office supplies',
    unit: 'pack',
    status: 'ACTIVE',
    catalogType: 'OFFICE_INVENTORY',
    stockArea: 'DOL storage',
    isLendable: true,
    lendingKind: 'CONSUMABLE',
    lendingStatus: 'ACTIVE',
    lendingAudience: 'ANGELITE_AND_USC_STAFF',
    eligibilityRule: 'Institutional identity required',
    conditionTracked: false,
    conditionReviewState: 'NOT_ASSESSED',
    maintenanceReviewState: 'NOT_ASSESSED',
    maximumLoanQuantity: 4,
    ...overrides,
  };
}

function lendingBootstrapFixture() {
  return {
    ok: true,
    correlationId: 'fi07-bootstrap',
    contract: 'bootstrap-module',
    contractVersion: 2,
    module: 'lending',
    requestOnly: false,
    scopeRevision: { scope: 'lending', token: 'fi07-r1', updatedAt: '2026-08-24T10:00:00.000Z' },
    pagination: { page: 1, pageSize: 25, total: 99, hasMore: true },
    data: {
      lendingTickets: [
        ticket({}),
        ticket({
          id: 'LEND-CLAIM',
          itemId: 'ITM-TAPE',
          requestedItemId: 'ITM-TAPE',
          borrowerName: 'FI-07 USC Office',
          borrowerType: 'USC_STAFF',
          quantity: 2,
          requestedQuantity: 2,
          ticketType: 'CONSUMABLE',
          status: 'READY_TO_CLAIM',
          reviewDecision: 'APPROVE',
          eligibilitySource: 'APPROVED_ACTIVE_USC_SOURCE',
          history: [
            {
              previousStatus: 'FOR_REVIEW',
              newStatus: 'READY_TO_CLAIM',
              changedAt: '2026-08-24T09:30:00.000Z',
              changedBy: 'FI-07 fixture',
              reason: 'Approved fixture',
              metadata: {},
            },
          ],
        }),
        ticket({
          id: 'LEND-RETURN',
          itemId: 'ITM-MIC',
          requestedItemId: 'ITM-MIC',
          borrowerName: 'FI-07 Custodian',
          quantity: 1,
          requestedQuantity: 1,
          unit: 'unit',
          ticketType: 'LOAN',
          status: 'ON_LOAN',
          dueAt: '2020-08-24T09:00:00.000Z',
          reviewDecision: 'APPROVE',
          eligibilitySource: 'APPROVED_ANGELITE_IDENTITY_RULE',
          assetOptions: [],
          history: [
            {
              previousStatus: 'READY_TO_CLAIM',
              newStatus: 'ON_LOAN',
              changedAt: '2020-08-20T09:00:00.000Z',
              changedBy: 'FI-07 fixture',
              reason: 'Fixture handoff',
              metadata: {},
            },
          ],
        }),
      ],
      inventoryItems: [
        inventoryItem({}),
        inventoryItem({ id: 'ITM-TAPE', name: 'Packing tape', maximumLoanQuantity: 2 }),
        inventoryItem({
          id: 'ITM-MIC',
          name: 'Wireless microphone',
          category: 'AV equipment',
          unit: 'unit',
          lendingKind: 'REUSABLE',
          conditionTracked: true,
          conditionReviewState: 'ASSESSED',
          maintenanceReviewState: 'CURRENT',
          lendableAvailable: 0,
          availableAssets: 0,
          traceableAssets: 1,
          maximumLoanQuantity: 1,
        }),
      ],
    },
  };
}

function pagedLendingBootstrapFixture(page) {
  const fixture = lendingBootstrapFixture();
  fixture.pagination = { page, pageSize: 25, total: 999, hasMore: true };
  fixture.data.lendingTickets =
    page <= 2
      ? Array.from({ length: 25 }, (_value, index) =>
          ticket({
            id: `LEND-PAGE-${page}-${String(index + 1).padStart(2, '0')}`,
            borrowerName: `FI-07 page ${page} borrower ${index + 1}`,
            status: 'FOR_REVIEW',
          }),
        )
      : [];
  return fixture;
}

async function installSignedOutSession(page) {
  await page.route('**/api/auth/session', (route) =>
    fulfill(route, { code: 'SESSION_REQUIRED', message: 'Sign in to continue.' }, 401),
  );
}

async function installLogin(page) {
  await page.route('**/api/auth/login', (route) =>
    fulfill(route, {
      state: 'AUTHENTICATED',
      csrfToken: 'fi07-csrf',
      user: {
        accountId: 'ACC-FI07-DOL',
        displayName: 'FI-07 DOL Operator',
        authorization: {
          active: true,
          mappingStatus: 'MAPPED',
          roleId: 'DOL_STAFF',
          capabilities: [
            'view.internal',
            'view.inventory',
            'lending.approve',
            'lending.handoff',
            'lending.return',
            'evidence.upload',
          ],
        },
      },
    }),
  );
}

async function installPublicFeed(page) {
  await page.route('**/api/public/advertisements', (route) => fulfill(route, { ok: true, items: [] }));
}

async function installLendingBootstrap(page, requests) {
  await page.route('**/api/bootstrap/lending**', (route) => {
    requests.push(new URL(route.request().url()).pathname + new URL(route.request().url()).search);
    return fulfill(route, lendingBootstrapFixture());
  });
}

function usesMobileShell(testInfo) {
  return ['frontend-320', 'frontend-390', 'frontend-768'].includes(testInfo.project.name);
}

async function openLendingHub(page, testInfo) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Staff sign in' }).first().click();
  await page.getByLabel('Identifier').fill('fi07.dol');
  await page.getByLabel('Password', { exact: true }).fill('service-verified-password');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  const navigation = usesMobileShell(testInfo)
    ? (await page.getByRole('button', { name: 'Open navigation' }).click(),
      page.getByRole('dialog', { name: 'Workspace navigation' }))
    : page;
  await navigation.getByRole('button', { name: 'Internal Lending Hub', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Loans and custody' })).toBeVisible();
}

test('FI-07 projects the strict lending page, responsive queue, custody actions, and governed return evidence', async ({
  page,
}, testInfo) => {
  test.skip(exactInspectionPort, 'The exact-4173 invocation exercises the A4 inspection path only.');
  const bootstrapRequests = [];
  const commands = {};
  await installSignedOutSession(page);
  await installLogin(page);
  await installPublicFeed(page);
  await installLendingBootstrap(page, bootstrapRequests);
  await page.route('**/api/approveLendingTicket', (route) => {
    commands.review = JSON.parse(route.request().postData() || '{}');
    return fulfill(route, {
      ticketId: 'LEND-REVIEW',
      status: 'READY_TO_CLAIM',
      replayed: false,
      correlationId: 'review-correlation',
    });
  });
  await page.route('**/api/confirmLendingHandoff', (route) => {
    commands.handoff = JSON.parse(route.request().postData() || '{}');
    return fulfill(route, {
      ticketId: 'LEND-CLAIM',
      status: 'COMPLETED',
      replayed: false,
      correlationId: 'handoff-correlation',
    });
  });
  await page.route('**/api/uploadEvidence', (route) => {
    commands.evidence = JSON.parse(route.request().postData() || '{}');
    return fulfill(route, {
      evidenceId: 'EVD-FI07-RETURN',
      uploadStatus: 'STORED',
      duplicate: false,
      correlationId: 'evidence-correlation',
    });
  });
  await page.route('**/api/confirmReturn', (route) => {
    commands.return = JSON.parse(route.request().postData() || '{}');
    return fulfill(route, {
      ticketId: 'LEND-RETURN',
      status: 'RETURNED',
      replayed: false,
      correlationId: 'return-correlation',
    });
  });

  await openLendingHub(page, testInfo);
  expect(bootstrapRequests[0]).toBe('/api/bootstrap/lending?page=1&pageSize=25');
  await expect(
    page.getByText(/Search and status filters apply only to this loaded authoritative page/u),
  ).toBeVisible();
  await expect(page.getByText(/No global lending-ticket total is shown/u)).toBeVisible();
  expect(
    await page
      .locator('[data-fi07-lending-hub] span')
      .filter({ hasText: /^Overdue$/u })
      .count(),
  ).toBeGreaterThan(0);
  if (['frontend-320', 'frontend-390'].includes(testInfo.project.name)) {
    await expect(page.locator('table')).not.toBeVisible();
    await expect(page.getByRole('button', { name: 'Open ticket' }).first()).toBeVisible();
  } else {
    await expect(page.locator('table')).toBeVisible();
  }
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth),
  ).toBeLessThanOrEqual(1);

  await page.locator('[data-ticket-trigger="LEND-REVIEW"]:visible').click();
  await expect(page.locator('[data-lending-inspector]')).toBeVisible();
  await expect(
    page
      .locator('[data-lending-inspector]')
      .getByText('Not available for this session', { exact: true })
      .first(),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Review ticket', exact: true }).click();
  const review = page.getByRole('dialog', { name: 'Review LEND-REVIEW' });
  await review.getByRole('checkbox', { name: /Identity verified through/u }).check();
  await review.getByRole('button', { name: 'Record server review', exact: true }).click();
  await expect(page.getByText('Server lending review recorded', { exact: true })).toBeVisible();
  expect(commands.review).toMatchObject({
    ticketId: 'LEND-REVIEW',
    decision: 'APPROVE',
    identityVerified: true,
    identityVerificationSource: 'APPROVED_ANGELITE_IDENTITY_RULE',
    approvedQuantity: 4,
    clientRequestId: expect.stringMatching(/^fi07-review-LEND-REVIEW-/u),
  });

  await page.getByRole('button', { name: 'Close lending ticket details' }).click();
  await page.locator('[data-ticket-trigger="LEND-CLAIM"]:visible').click();
  await page.getByRole('button', { name: 'Confirm issue', exact: true }).click();
  const handoff = page.getByRole('dialog', { name: 'Confirm issue for LEND-CLAIM' });
  await handoff
    .getByRole('checkbox', { name: /I understand this records the physical custody consequence/u })
    .check();
  await handoff.getByRole('button', { name: 'Confirm issue', exact: true }).click();
  await expect(page.getByText('Server issue recorded', { exact: true })).toBeVisible();
  expect(commands.handoff).toMatchObject({
    ticketId: 'LEND-CLAIM',
    conditionLabel: 'GOOD',
    clientRequestId: expect.stringMatching(/^fi07-handoff-LEND-CLAIM-/u),
  });

  await page.getByRole('button', { name: 'Close lending ticket details' }).click();
  await page.locator('[data-ticket-trigger="LEND-RETURN"]:visible').click();
  await page.getByRole('button', { name: 'Inspect return', exact: true }).click();
  const returnDialog = page.getByRole('dialog', { name: 'Confirm return for LEND-RETURN' });
  await returnDialog.locator('input[type="file"]').setInputFiles({
    name: 'fi07-return.jpg',
    mimeType: 'image/jpeg',
    buffer: Buffer.from([0xff, 0xd8, 0xff, 0xe0]),
  });
  await returnDialog
    .getByRole('checkbox', { name: /I confirm the inspected quantities and condition/u })
    .check();
  await returnDialog.getByRole('button', { name: 'Upload evidence and confirm return', exact: true }).click();
  await expect(page.getByText('Server return recorded', { exact: true })).toBeVisible();
  expect(commands.evidence).toMatchObject({
    evidenceType: 'LENDING_RETURN_PHOTO',
    relatedEntityType: 'LENDING',
    relatedEntityId: 'LEND-RETURN',
    lendingTicketId: 'LEND-RETURN',
    originalFileName: 'fi07-return.jpg',
    mimeType: 'image/jpeg',
    clientRequestId: expect.stringMatching(/^fi07-evidence-LEND-RETURN-/u),
  });
  expect(commands.evidence.base64).toMatch(/^data:image\/jpeg;base64,/u);
  expect(commands.return).toMatchObject({
    ticketId: 'LEND-RETURN',
    conditionLabel: 'GOOD',
    evidenceId: 'EVD-FI07-RETURN',
    returnedQuantity: 1,
    lostQuantity: 0,
    damagedBeyondUseQuantity: 0,
    clientRequestId: expect.stringMatching(/^fi07-return-LEND-RETURN-/u),
  });
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth),
  ).toBeLessThanOrEqual(1);
});

test('FI-07 reaches loaded ticket page two without trusting inventory pagination totals', async ({
  page,
}, testInfo) => {
  test.skip(exactInspectionPort, 'The exact-4173 invocation exercises the A4 inspection path only.');
  const bootstrapRequests = [];
  await installSignedOutSession(page);
  await installLogin(page);
  await installPublicFeed(page);
  await page.route('**/api/bootstrap/lending**', (route) => {
    const url = new URL(route.request().url());
    const currentPage = Number(url.searchParams.get('page') || '1');
    bootstrapRequests.push(url.pathname + url.search);
    return fulfill(route, pagedLendingBootstrapFixture(currentPage));
  });

  await openLendingHub(page, testInfo);
  await expect(page.getByRole('button', { name: 'Next', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.locator('[data-ticket-trigger="LEND-PAGE-2-01"]:visible')).toBeVisible();
  await expect(page.getByText('Loaded ticket page 2', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page.getByText('No loaded lending tickets match', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Previous', exact: true })).toBeEnabled();
  await page.getByRole('button', { name: 'Previous', exact: true }).click();
  await expect(page.locator('[data-ticket-trigger="LEND-PAGE-2-01"]:visible')).toBeVisible();
  const pageSequence = bootstrapRequests
    .map((request) => new URL('http://localhost' + request).searchParams.get('page'))
    .filter((current, index, pages) => index === 0 || current !== pages[index - 1]);
  expect(pageSequence).toEqual(['1', '2', '3', '2']);
});

test('FI-07 clears a disappeared selected record and restores stable queue focus after a conflict reload', async ({
  page,
}, testInfo) => {
  test.skip(exactInspectionPort, 'The exact-4173 invocation exercises the A4 inspection path only.');
  let removeSelectedRecord = false;
  await installSignedOutSession(page);
  await installLogin(page);
  await installPublicFeed(page);
  await page.route('**/api/bootstrap/lending**', (route) => {
    const fixture = lendingBootstrapFixture();
    if (removeSelectedRecord) {
      fixture.data.lendingTickets = fixture.data.lendingTickets.filter((entry) => entry.id !== 'LEND-REVIEW');
    }
    return fulfill(route, fixture);
  });
  await page.route('**/api/approveLendingTicket', (route) => {
    removeSelectedRecord = true;
    return fulfill(
      route,
      { code: 'CONFLICT', message: 'Ticket advanced elsewhere.', correlationId: 'fi07-conflict' },
      409,
    );
  });

  await openLendingHub(page, testInfo);
  await page.locator('[data-ticket-trigger="LEND-REVIEW"]:visible').click();
  await page.getByRole('button', { name: 'Review ticket', exact: true }).click();
  const review = page.getByRole('dialog', { name: 'Review LEND-REVIEW' });
  await review.getByRole('checkbox', { name: /Identity verified through/u }).check();
  await review.getByRole('button', { name: 'Record server review', exact: true }).click();
  await expect(
    page.getByText('Selected ticket is no longer on this loaded page', { exact: true }),
  ).toBeVisible();
  await expect(page.locator('[data-lending-inspector]')).toHaveCount(0);
  await expect(page.getByRole('dialog', { name: 'Review LEND-REVIEW' })).toHaveCount(0);
  await expect(page.locator('[data-fi07-queue-fallback]')).toBeFocused();
  expect(await page.evaluate(() => document.body.style.overflow)).not.toBe('hidden');
});

test('FI-07 pauses an open confirmation dialog when its authoritative reload becomes stale', async ({
  page,
}, testInfo) => {
  test.skip(exactInspectionPort, 'The exact-4173 invocation exercises the A4 inspection path only.');
  let makeReloadStale = false;
  await installSignedOutSession(page);
  await installLogin(page);
  await installPublicFeed(page);
  await page.route('**/api/bootstrap/lending**', (route) => {
    return !makeReloadStale
      ? fulfill(route, lendingBootstrapFixture())
      : fulfill(route, { code: 'SERVICE_UNAVAILABLE', message: 'Reload unavailable.' }, 503);
  });
  await page.route('**/api/approveLendingTicket', (route) => {
    makeReloadStale = true;
    return fulfill(route, { code: 'CONFLICT', message: 'Ticket changed.', correlationId: 'fi07-stale' }, 409);
  });

  await openLendingHub(page, testInfo);
  await page.locator('[data-ticket-trigger="LEND-REVIEW"]:visible').click();
  await page.getByRole('button', { name: 'Review ticket', exact: true }).click();
  const review = page.getByRole('dialog', { name: 'Review LEND-REVIEW' });
  const inspector = page.locator('[data-lending-inspector]');
  await expect(inspector).toHaveAttribute('aria-hidden', 'true');
  await expect(inspector).not.toHaveAttribute('aria-modal', 'true');
  await review.getByRole('checkbox', { name: /Identity verified through/u }).check();
  await review.getByRole('button', { name: 'Record server review', exact: true }).click();
  await expect(page.getByText('Last-known lending data', { exact: true })).toBeVisible();
  await expect(review.getByRole('button', { name: 'Record server review', exact: true })).toBeDisabled();
});

test('FI-07 requires exact matching available candidates for traceable reusable review and blocks zero availability', async ({
  page,
}, testInfo) => {
  test.skip(exactInspectionPort, 'The exact-4173 invocation exercises the A4 inspection path only.');
  const commands = [];
  const fixture = lendingBootstrapFixture();
  fixture.data.lendingTickets = [
    ticket({
      id: 'LEND-TRACE-EXACT',
      itemId: 'ITM-TRACE',
      requestedItemId: 'ITM-TRACE',
      quantity: 2,
      requestedQuantity: 2,
      unit: 'unit',
      ticketType: 'LOAN',
      assetOptions: [
        {
          id: 'AST-TRACE-1',
          itemId: 'ITM-TRACE',
          assetTag: 'TRACE-1',
          serialNumber: '',
          condition: 'GOOD',
          status: 'AVAILABLE',
        },
        {
          id: 'AST-TRACE-2',
          itemId: 'ITM-TRACE',
          assetTag: 'TRACE-2',
          serialNumber: '',
          condition: 'GOOD',
          status: 'AVAILABLE',
        },
      ],
    }),
    ticket({
      id: 'LEND-TRACE-ZERO',
      itemId: 'ITM-TRACE-ZERO',
      requestedItemId: 'ITM-TRACE-ZERO',
      quantity: 1,
      requestedQuantity: 1,
      unit: 'unit',
      ticketType: 'LOAN',
      assetOptions: [],
    }),
  ];
  fixture.data.inventoryItems = [
    inventoryItem({
      id: 'ITM-TRACE',
      name: 'Traceable chair',
      unit: 'unit',
      lendingKind: 'REUSABLE',
      conditionTracked: true,
      traceableAssets: 2,
      availableAssets: 2,
    }),
    inventoryItem({
      id: 'ITM-TRACE-ZERO',
      name: 'Unavailable traceable microphone',
      unit: 'unit',
      lendingKind: 'REUSABLE',
      conditionTracked: true,
      traceableAssets: 1,
      availableAssets: 0,
    }),
  ];
  await installSignedOutSession(page);
  await installLogin(page);
  await installPublicFeed(page);
  await page.route('**/api/bootstrap/lending**', (route) => fulfill(route, fixture));
  await page.route('**/api/approveLendingTicket', (route) => {
    commands.push(JSON.parse(route.request().postData() || '{}'));
    return fulfill(route, {
      ticketId: commands.at(-1).ticketId,
      status: 'READY_TO_CLAIM',
      replayed: false,
      correlationId: 'fi07-traceable',
    });
  });

  await openLendingHub(page, testInfo);
  await page.locator('[data-ticket-trigger="LEND-TRACE-EXACT"]:visible').click();
  await page.getByRole('button', { name: 'Review ticket', exact: true }).click();
  const exactReview = page.getByRole('dialog', { name: 'Review LEND-TRACE-EXACT' });
  await exactReview.getByRole('checkbox', { name: /Identity verified through/u }).check();
  await expect(
    exactReview.getByText('Available review candidates — not yet assigned', { exact: true }),
  ).toBeVisible();
  await exactReview.getByRole('checkbox', { name: /TRACE-1/u }).check();
  await exactReview.getByRole('checkbox', { name: /TRACE-2/u }).check();
  await exactReview.getByRole('button', { name: 'Record server review', exact: true }).click();
  await expect(page.getByText('Server lending review recorded', { exact: true })).toBeVisible();
  expect(commands).toHaveLength(1);
  expect(commands[0].assetIds).toEqual(['AST-TRACE-1', 'AST-TRACE-2']);

  await page.getByRole('button', { name: 'Close lending ticket details' }).click();
  await page.locator('[data-ticket-trigger="LEND-TRACE-ZERO"]:visible').click();
  await page.getByRole('button', { name: 'Review ticket', exact: true }).click();
  const zeroReview = page.getByRole('dialog', { name: 'Review LEND-TRACE-ZERO' });
  await zeroReview.getByRole('checkbox', { name: /Identity verified through/u }).check();
  await expect(zeroReview.getByText(/No matching available review candidates are projected/u)).toBeVisible();
  await zeroReview.getByRole('button', { name: 'Record server review', exact: true }).click();
  await expect(zeroReview.getByText(/not enough matching available review candidates/u)).toBeVisible();
  expect(commands).toHaveLength(1);
});

test('FI-07 blocks mixed traceable reusable return outcomes before any protected return request', async ({
  page,
}, testInfo) => {
  test.skip(exactInspectionPort, 'The exact-4173 invocation exercises the A4 inspection path only.');
  const fixture = lendingBootstrapFixture();
  fixture.data.lendingTickets = [
    ticket({
      id: 'LEND-TRACE-MIXED-RETURN',
      itemId: 'ITM-TRACE-MIXED-RETURN',
      requestedItemId: 'ITM-TRACE-MIXED-RETURN',
      borrowerName: 'FI-07 traceable custodian',
      quantity: 2,
      requestedQuantity: 2,
      unit: 'unit',
      ticketType: 'LOAN',
      status: 'ON_LOAN',
      dueAt: '2026-08-30T09:00:00.000Z',
      reviewDecision: 'APPROVE',
      assetOptions: [],
    }),
  ];
  fixture.data.inventoryItems = [
    inventoryItem({
      id: 'ITM-TRACE-MIXED-RETURN',
      name: 'Traceable return fixture',
      unit: 'unit',
      lendingKind: 'REUSABLE',
      conditionTracked: true,
      traceableAssets: 2,
      availableAssets: 0,
      lendableAvailable: 0,
      maximumLoanQuantity: 2,
    }),
  ];
  let returnRequests = 0;
  let evidenceRequests = 0;
  await installSignedOutSession(page);
  await installLogin(page);
  await installPublicFeed(page);
  await page.route('**/api/bootstrap/lending**', (route) => fulfill(route, fixture));
  await page.route('**/api/confirmReturn', (route) => {
    returnRequests += 1;
    return fulfill(route, { code: 'TEST_SHOULD_NOT_BE_CALLED' }, 500);
  });
  await page.route('**/api/uploadEvidence', (route) => {
    evidenceRequests += 1;
    return fulfill(route, { code: 'TEST_SHOULD_NOT_BE_CALLED' }, 500);
  });

  await openLendingHub(page, testInfo);
  await page.locator('[data-ticket-trigger="LEND-TRACE-MIXED-RETURN"]:visible').click();
  await page.getByRole('button', { name: 'Inspect return', exact: true }).click();
  const returnDialog = page.getByRole('dialog', { name: 'Confirm return for LEND-TRACE-MIXED-RETURN' });
  await returnDialog.getByLabel('Return condition').selectOption('LOST');
  await returnDialog.getByRole('textbox', { name: 'Returned', exact: true }).fill('1');
  await returnDialog.getByRole('textbox', { name: 'Lost', exact: true }).fill('1');
  await returnDialog.getByLabel('Inspection note').fill('One fixture unit was lost.');
  await returnDialog
    .getByRole('checkbox', { name: /I confirm the inspected quantities and condition/u })
    .check();
  await returnDialog.getByRole('button', { name: 'Upload evidence and confirm return', exact: true }).click();
  await expect(returnDialog.getByText(/exactly one nonzero outcome bucket/u)).toBeVisible();
  expect(returnRequests).toBe(0);
  expect(evidenceRequests).toBe(0);
});

test('FI-07 A4 Preview Index inspection is local-only and sends no protected lending traffic', async ({
  page,
}) => {
  test.skip(!exactInspectionPort, 'Run explicitly against the accepted 127.0.0.1:4173 supervisor.');
  await page.route('**/api/version', (route) =>
    fulfill(route, { ok: true, playground: true, correlationId: 'fi07-preview' }),
  );
  await installPublicFeed(page);
  const protectedRequests = [];
  page.on('request', (request) => {
    const pathname = new URL(request.url()).pathname;
    if (
      pathname.startsWith('/api/') &&
      pathname !== '/api/version' &&
      pathname !== '/api/public/advertisements'
    ) {
      protectedRequests.push({ method: request.method(), pathname });
    }
  });

  await page.goto('/#/__preview/index', { waitUntil: 'domcontentloaded' });
  await page.locator('[data-preview-route="lending"] [data-action="open-preview"]').click();
  await expect(page.locator('[data-preview-inspection="true"][data-preview-route="lending"]')).toBeVisible();
  await expect(page.locator('[data-fi07-lending-hub][data-fi07-mode="preview"]')).toBeVisible();
  await expect(page.getByText(/No backend read, mutation, or evidence upload/u)).toBeVisible();
  await page.locator('[data-ticket-trigger="LEND-PREVIEW-REVIEW"]:visible').click();
  await page.getByRole('button', { name: 'Demonstrate review', exact: true }).click();
  const review = page.getByRole('dialog', { name: 'Review LEND-PREVIEW-REVIEW' });
  await review.locator('select').selectOption('REJECT');
  await review.locator('textarea').first().fill('Local fixture rejection only');
  await review.getByRole('button', { name: 'Record local demonstration', exact: true }).click();
  await expect(page.getByText('Local lending review demonstrated', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Close lending ticket details' }).click();
  await page.locator('[data-ticket-trigger="LEND-PREVIEW-CLAIM"]:visible').click();
  await page.getByRole('button', { name: 'Confirm issue', exact: true }).click();
  const issue = page.getByRole('dialog', { name: 'Confirm issue for LEND-PREVIEW-CLAIM' });
  await issue
    .getByRole('checkbox', { name: /I understand this records the physical custody consequence/u })
    .check();
  await issue.getByRole('button', { name: 'Record local demonstration', exact: true }).click();
  await expect(page.getByText('Local custody action demonstrated', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Close lending ticket details' }).click();
  await page.locator('[data-ticket-trigger="LEND-PREVIEW-RETURN"]:visible').click();
  await page.getByRole('button', { name: 'Demonstrate return', exact: true }).click();
  const returnDialog = page.getByRole('dialog', { name: 'Confirm return for LEND-PREVIEW-RETURN' });
  await returnDialog
    .getByRole('checkbox', { name: /I confirm the inspected quantities and condition/u })
    .check();
  await returnDialog.getByRole('button', { name: 'Record local demonstration', exact: true }).click();
  await expect(page.getByText('Local return demonstrated', { exact: true })).toBeVisible();
  expect(protectedRequests).toEqual([]);
});
