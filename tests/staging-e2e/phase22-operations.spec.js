import { randomBytes } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { expect, request as apiRequest, test } from '@playwright/test';

async function privateCredential() {
  const file = process.env.HAU_STAGING_OWNER_CREDENTIAL_FILE;
  if (!file || !path.isAbsolute(file)) throw new Error('A private staging owner credential is required.');
  const value = JSON.parse(await readFile(file, 'utf8'));
  if (!value?.accessId || !value?.password) throw new Error('The private owner credential is incomplete.');
  return value;
}

function fixture(name) {
  const value = String(process.env[name] ?? '').trim();
  if (!value || !/SYNTHETIC|STAGING/iu.test(value)) {
    throw new Error(`${name} must be an explicitly synthetic staging fixture.`);
  }
  return value;
}

async function login(context) {
  const credential = await privateCredential();
  const response = await context.post('/api/auth/login', { data: credential });
  expect(response.status()).toBe(200);
  const result = await response.json();
  expect(result).toMatchObject({ state: 'AUTHENTICATED', user: { authorization: { roleId: 'SYSTEM_OWNER' } } });
  return result.csrfToken;
}

const mutate = (context, csrfToken, method, data) =>
  context.post(`/api/${method}`, { headers: { 'x-csrf-token': csrfToken }, data });

test('Phase 22 public reusable lending completes review, asset handoff, overdue projection, and return', async ({
  page,
  baseURL,
}) => {
  const reusableItemId = fixture('HAU_STAGING_REUSABLE_ITEM_ID');
  const owner = page.context().request;
  const csrfToken = await login(owner);
  const anonymous = await apiRequest.newContext({ baseURL });
  const nonce = `${Date.now().toString(36)}-${randomBytes(4).toString('hex')}`;
  const assetTag = `P22-ASSET-${nonce}`.toUpperCase();

  try {
    const registered = await mutate(owner, csrfToken, 'registerInventoryAsset', {
      itemId: reusableItemId,
      assetTag,
      serialNumber: `P22-SERIAL-${nonce}`.toUpperCase(),
      conditionLabel: 'GOOD',
      notes: 'Synthetic Phase 22 reusable asset.',
      clientRequestId: `p22-asset-register-${nonce}`,
    });
    expect(registered.status()).toBe(200);
    const assetId = (await registered.json()).assetId;

    const pickup = new Date(Date.now() + 2 * 86_400_000).toISOString().slice(0, 10);
    const due = new Date(Date.now() + 6 * 86_400_000).toISOString().slice(0, 10);
    const borrowerName = `Synthetic Phase 22 Public ${nonce}`;
    const submitted = await anonymous.post('/api/public/lending', {
      headers: { origin: new URL(baseURL).origin },
      data: {
        borrowerType: 'ANGELITE',
        borrowerName,
        studentId: '12345678',
        courseYear: 'BSIT 2',
        academicDepartment: 'School of Computing',
        contactNumber: '+63 917 000 0010',
        email: `p22-${nonce}@gmail.com`,
        purpose: 'Synthetic Phase 22 public reusable lending lifecycle.',
        pickupDate: pickup,
        dueDate: due,
        responsibilityAcknowledged: true,
        dataUseAcknowledged: true,
        acceptableUseAcknowledged: true,
        borrowerResponsibilityAcknowledged: true,
        evidenceConsentAcknowledged: true,
        lines: [{ itemId: reusableItemId, quantity: 1 }],
        clientRequestId: `p22-public-lending-${nonce}`,
      },
    });
    expect(submitted.status()).toBe(200);
    await expect(submitted.json()).resolves.toMatchObject({ status: 'FOR_REVIEW' });

    const queue = await (await owner.get('/api/lending?pageSize=50')).json();
    const publicTicket = queue.data.lendingTickets.find((entry) => entry.borrowerName === borrowerName);
    expect(publicTicket).toMatchObject({ itemId: reusableItemId, status: 'FOR_REVIEW' });

    const denied = await anonymous.post('/api/approveLendingTicket', {
      data: { ticketId: publicTicket.id, identityVerified: true },
    });
    expect(denied.status()).toBe(401);

    const missingAsset = await mutate(owner, csrfToken, 'approveLendingTicket', {
      ticketId: publicTicket.id,
      identityVerified: true,
      identityVerificationSource: 'APPROVED_ANGELITE_IDENTITY_RULE',
      clientRequestId: `p22-public-approve-missing-${nonce}`,
    });
    expect(missingAsset.status()).toBe(409);
    await expect(missingAsset.json()).resolves.toMatchObject({ code: 'ASSET_ASSIGNMENT_REQUIRED' });

    const approved = await mutate(owner, csrfToken, 'approveLendingTicket', {
      ticketId: publicTicket.id,
      assetIds: [assetId],
      identityVerified: true,
      identityVerificationSource: 'APPROVED_ANGELITE_IDENTITY_RULE',
      clientRequestId: `p22-public-approve-${nonce}`,
    });
    expect(approved.status()).toBe(200);
    await expect(approved.json()).resolves.toMatchObject({ status: 'READY_TO_CLAIM', assetIds: [assetId] });

    const handedOff = await mutate(owner, csrfToken, 'confirmLendingHandoff', {
      ticketId: publicTicket.id,
      conditionLabel: 'GOOD',
      notes: 'Synthetic public handoff.',
      clientRequestId: `p22-public-handoff-${nonce}`,
    });
    expect(handedOff.status()).toBe(200);
    await expect(handedOff.json()).resolves.toMatchObject({ status: 'ON_LOAN', assetIds: [assetId] });
    const duplicateHandoff = await mutate(owner, csrfToken, 'confirmLendingHandoff', {
      ticketId: publicTicket.id,
      clientRequestId: `p22-public-handoff-duplicate-${nonce}`,
    });
    expect(duplicateHandoff.status()).toBe(409);

    const returned = await mutate(owner, csrfToken, 'confirmReturn', {
      ticketId: publicTicket.id,
      conditionLabel: 'GOOD',
      notes: 'Synthetic public return.',
      clientRequestId: `p22-public-return-${nonce}`,
    });
    expect(returned.status()).toBe(200);
    await expect(returned.json()).resolves.toMatchObject({ status: 'RETURNED', assetIds: [assetId] });

    const overdueDueAt = new Date(Date.now() - 86_400_000).toISOString();
    const overdue = await mutate(owner, csrfToken, 'createLendingTicket', {
      borrowerReference: '87654321',
      borrowerName: `Synthetic Phase 22 Overdue ${nonce}`,
      borrowerType: 'STUDENT',
      itemId: reusableItemId,
      quantity: 1,
      unit: 'unit',
      purpose: 'Synthetic overdue projection proof.',
      dueAt: overdueDueAt,
      ticketType: 'LOAN',
      clientRequestId: `p22-overdue-create-${nonce}`,
    });
    expect(overdue.status()).toBe(200);
    const overdueTicketId = (await overdue.json()).ticketId;
    expect(
      (
        await mutate(owner, csrfToken, 'approveLendingTicket', {
          ticketId: overdueTicketId,
          assetIds: [assetId],
          identityVerified: true,
          identityVerificationSource: 'APPROVED_ANGELITE_IDENTITY_RULE',
          clientRequestId: `p22-overdue-approve-${nonce}`,
        })
      ).status(),
    ).toBe(200);
    expect(
      (
        await mutate(owner, csrfToken, 'confirmLendingHandoff', {
          ticketId: overdueTicketId,
          conditionLabel: 'GOOD',
          clientRequestId: `p22-overdue-handoff-${nonce}`,
        })
      ).status(),
    ).toBe(200);
    const overdueProjection = await (await owner.get('/api/lending?pageSize=50')).json();
    const projected = overdueProjection.data.lendingTickets.find((entry) => entry.id === overdueTicketId);
    expect(projected).toMatchObject({ status: 'ON_LOAN', dueAt: overdueDueAt });
    expect(Date.parse(projected.dueAt)).toBeLessThan(Date.now());
    expect(
      (
        await mutate(owner, csrfToken, 'confirmReturn', {
          ticketId: overdueTicketId,
          conditionLabel: 'GOOD',
          clientRequestId: `p22-overdue-return-${nonce}`,
        })
      ).status(),
    ).toBe(200);

    const finalInventory = await (await owner.get('/api/inventory?pageSize=50')).json();
    expect(finalInventory.data.inventoryAssets.find((entry) => entry.id === assetId)).toMatchObject({
      asset_tag: assetTag,
      lifecycle_status: 'AVAILABLE',
      return_condition: 'GOOD',
    });
  } finally {
    await anonymous.dispose();
  }
});

test('Phase 22 procurement, restock, cumulative receiving, and reservation concurrency remain ledger-safe', async ({
  page,
}) => {
  const eventId = fixture('HAU_STAGING_RELEASE_EVENT_ID');
  const itemId = fixture('HAU_STAGING_RELEASE_ITEM_ID');
  const reusableItemId = fixture('HAU_STAGING_REUSABLE_ITEM_ID');
  const owner = page.context().request;
  const csrfToken = await login(owner);
  const nonce = `${Date.now().toString(36)}-${randomBytes(4).toString('hex')}`;

  const submitted = await mutate(owner, csrfToken, 'submitRequest', {
    requestType: 'EVENT_LOGISTICS',
    eventSeriesId: 'SER-STAGING-REQUEST-ACCEPTANCE',
    eventId,
    ownerCommitteeId: 'COM_MATERIALS',
    department: 'Department of Logistics',
    purpose: `Synthetic Phase 22 sourcing and concurrency ${nonce}`,
    clientRequestId: `p22-operations-submit-${nonce}`,
    lines: [
      {
        clientLineId: `p22-procurement-${nonce}`,
        description: 'Synthetic Phase 22 procured set',
        specification: 'Synthetic Phase 22 procured set',
        quantity: 4,
        unit: 'set',
        fulfillmentSource: 'PROCUREMENT',
      },
      {
        clientLineId: `p22-restock-${nonce}`,
        itemId,
        description: 'Synthetic Phase 22 restock kit',
        quantity: 4,
        unit: 'kit',
        fulfillmentSource: 'RESTOCK',
      },
    ],
  });
  expect(submitted.status()).toBe(200);
  const requestId = (await submitted.json()).requestId;
  const reviewed = await mutate(owner, csrfToken, 'reviewRequest', {
    requestId,
    decision: 'ACCEPT',
    note: 'Authorized synthetic Phase 22 operations proof.',
    clientRequestId: `p22-operations-review-${nonce}`,
  });
  expect(reviewed.status()).toBe(200);

  const procurement = await (await owner.get('/api/procurement?pageSize=50')).json();
  const deliverable = procurement.data.deliverables.find((entry) => entry.request_id === requestId);
  expect(deliverable).toMatchObject({ quantity_requested: 4, status: 'FOR_CANVASSING' });
  const restocking = await (await owner.get('/api/restocking?pageSize=50')).json();
  const restock = restocking.data.restockRequests.find((entry) => entry.source_request_id === requestId);
  expect(restock).toMatchObject({ requested_quantity: 4, status: 'FOR_CANVASSING' });

  async function canvass(link, label) {
    const command = {
      ...link,
      supplierName: `Synthetic Phase 22 Supplier ${label}`,
      itemSpec: `Synthetic Phase 22 ${label}`,
      price: 125,
      unit: label === 'procurement' ? 'set' : 'kit',
      receiptStatus: 'VERIFIED',
      reliability: 'SYNTHETIC',
      checkedAt: new Date().toISOString(),
      clientRequestId: `p22-${label}-canvass-${nonce}`,
    };
    const saved = await mutate(owner, csrfToken, 'saveCanvassReference', command);
    expect(saved.status()).toBe(200);
    const canvassId = (await saved.json()).canvassId;
    const replay = await mutate(owner, csrfToken, 'saveCanvassReference', command);
    expect(replay.status()).toBe(200);
    await expect(replay.json()).resolves.toMatchObject({ canvassId });
    const preferred = await mutate(owner, csrfToken, 'selectPreferredCanvass', {
      canvassId,
      rationale: 'Synthetic quote comparison and receipt reliability.',
      clientRequestId: `p22-${label}-preferred-${nonce}`,
    });
    expect(preferred.status()).toBe(200);
    return canvassId;
  }

  await canvass({ linkedDeliverableId: deliverable.id }, 'procurement');
  for (const status of ['WAITING_FOR_BUDGET', 'TO_BE_PROCURED', 'PROCURED']) {
    const response = await mutate(owner, csrfToken, 'transitionDeliverable', {
      deliverableId: deliverable.id,
      status,
      note: `Synthetic transition to ${status}.`,
      clientRequestId: `p22-deliverable-${status}-${nonce}`,
    });
    expect(response.status()).toBe(200);
  }
  const firstDeliverableReceipt = await mutate(owner, csrfToken, 'receiveDeliverable', {
    deliverableId: deliverable.id,
    quantity: 1,
    unit: 'set',
    clientRequestId: `p22-deliverable-receive-1-${nonce}`,
  });
  await expect(firstDeliverableReceipt.json()).resolves.toMatchObject({
    cumulativeReceived: 1,
    remaining: 3,
    status: 'PARTIALLY_RECEIVED',
  });
  const finalDeliverableReceipt = await mutate(owner, csrfToken, 'receiveDeliverable', {
    deliverableId: deliverable.id,
    quantity: 3,
    unit: 'set',
    clientRequestId: `p22-deliverable-receive-2-${nonce}`,
  });
  await expect(finalDeliverableReceipt.json()).resolves.toMatchObject({
    cumulativeReceived: 4,
    remaining: 0,
    status: 'RECEIVED',
  });
  expect(
    (
      await mutate(owner, csrfToken, 'receiveDeliverable', {
        deliverableId: deliverable.id,
        quantity: 1,
        unit: 'set',
        clientRequestId: `p22-deliverable-over-${nonce}`,
      })
    ).status(),
  ).toBe(409);

  await canvass({ linkedRestockId: restock.id }, 'restock');
  let revision = 1;
  for (const action of ['SEND_TO_BUDGET_REVIEW', 'AUTHORIZE_PROCUREMENT']) {
    const response = await mutate(owner, csrfToken, 'transitionRestock', {
      restockRequestId: restock.id,
      requestLineId: restock.source_request_line_id,
      action,
      expectedRevision: revision,
      reason: `Synthetic ${action} transition.`,
      clientRequestId: `p22-restock-${action}-${nonce}`,
    });
    expect(response.status()).toBe(200);
    revision = (await response.json()).workflowRevision;
  }
  const firstRestockReceipt = await mutate(owner, csrfToken, 'receiveRestock', {
    restockRequestId: restock.id,
    quantity: 1,
    unit: 'kit',
    invoiceStatus: 'SYNTHETIC',
    clientRequestId: `p22-restock-receive-1-${nonce}`,
  });
  await expect(firstRestockReceipt.json()).resolves.toMatchObject({
    cumulativeReceived: 1,
    remaining: 3,
    status: 'PARTIALLY_RECEIVED',
  });
  const finalRestockReceipt = await mutate(owner, csrfToken, 'receiveRestock', {
    restockRequestId: restock.id,
    quantity: 3,
    unit: 'kit',
    invoiceStatus: 'SYNTHETIC',
    clientRequestId: `p22-restock-receive-2-${nonce}`,
  });
  await expect(finalRestockReceipt.json()).resolves.toMatchObject({
    cumulativeReceived: 4,
    remaining: 0,
    status: 'RECEIVED',
  });
  expect(
    (
      await mutate(owner, csrfToken, 'receiveRestock', {
        restockRequestId: restock.id,
        quantity: 1,
        unit: 'kit',
        clientRequestId: `p22-restock-over-${nonce}`,
      })
    ).status(),
  ).toBe(409);

  const inventoryBeforeConcurrency = await (await owner.get('/api/inventory?pageSize=50')).json();
  const availableBeforeConcurrency = inventoryBeforeConcurrency.data.inventoryItems.find(
    (entry) => entry.id === reusableItemId,
  ).availableToPromise;
  expect(availableBeforeConcurrency).toBeGreaterThanOrEqual(1);
  const concurrencyRequest = await mutate(owner, csrfToken, 'submitRequest', {
    requestType: 'EVENT_LOGISTICS',
    eventSeriesId: 'SER-STAGING-REQUEST-ACCEPTANCE',
    eventId,
    ownerCommitteeId: 'COM_MATERIALS',
    department: 'Department of Logistics',
    purpose: `Synthetic Phase 22 reservation concurrency ${nonce}`,
    clientRequestId: `p22-concurrency-submit-${nonce}`,
    lines: [
      {
        clientLineId: `p22-stock-${nonce}`,
        itemId: reusableItemId,
        description: 'Synthetic Phase 22 reusable concurrency kit',
        quantity: availableBeforeConcurrency,
        unit: 'unit',
        fulfillmentSource: 'ISSUE_FROM_STOCK',
      },
    ],
  });
  expect(concurrencyRequest.status()).toBe(200);
  const concurrencyRequestId = (await concurrencyRequest.json()).requestId;
  expect(
    (
      await mutate(owner, csrfToken, 'reviewRequest', {
        requestId: concurrencyRequestId,
        decision: 'ACCEPT',
        note: 'Authorized synthetic Phase 22 concurrency proof.',
        clientRequestId: `p22-concurrency-review-${nonce}`,
      })
    ).status(),
  ).toBe(200);
  const release = await (
    await owner.get(
      `/api/releases?operationalScope=${encodeURIComponent(`EVENT:${eventId}`)}&pageSize=50`,
    )
  ).json();
  const stockLine = release.data.requestLines.find(
    (entry) => entry.requestId === concurrencyRequestId && entry.status === 'READY_TO_RESERVE',
  );
  expect(stockLine).toMatchObject({ itemId: reusableItemId, quantity: availableBeforeConcurrency });
  const reservations = await Promise.all([
    mutate(owner, csrfToken, 'reserveStock', {
      itemId: reusableItemId,
      requestLineId: stockLine.id,
      quantity: availableBeforeConcurrency,
      clientRequestId: `p22-concurrency-a-${nonce}`,
    }),
    mutate(owner, csrfToken, 'reserveStock', {
      itemId: reusableItemId,
      requestLineId: stockLine.id,
      quantity: availableBeforeConcurrency,
      clientRequestId: `p22-concurrency-b-${nonce}`,
    }),
  ]);
  expect(reservations.map((response) => response.status()).sort()).toEqual([200, 409]);
  const deniedBody = await reservations.find((response) => response.status() === 409).json();
  expect(deniedBody).toMatchObject({ code: 'INSUFFICIENT_STOCK' });

  const inventory = await (await owner.get('/api/inventory?pageSize=50')).json();
  const concurrencyItem = inventory.data.inventoryItems.find((entry) => entry.id === reusableItemId);
  expect(concurrencyItem.reserved).toBeGreaterThanOrEqual(availableBeforeConcurrency);
  expect(concurrencyItem.availableToPromise).toBeGreaterThanOrEqual(0);
  expect(
    inventory.data.ledgerTransactions.some((entry) => entry.type === 'RECEIVE' && entry.itemId === itemId),
  ).toBe(true);
});
