import { BOOTSTRAP_COLLECTIONS } from '../../src/visual/bootstrap-controller.js';

const iso = (day) => `2026-07-${String(day).padStart(2, '0')}T08:00:00.000Z`;

export function createEmptyBootstrapFixture({ backendMode = 'mock', environment = 'STAGING' } = {}) {
  return {
    version: '0.5.0',
    schemaVersion: '1.2.0',
    backendMode,
    environment,
    currentUser: {
      id: 'SYNTHETIC-USER-001',
      displayName: 'Synthetic Operator',
      role: 'ADMIN',
      permissions: { review: true, release: true, receive: true, admin: true, manageCatalog: true },
    },
    ...Object.fromEntries(BOOTSTRAP_COLLECTIONS.map((name) => [name, []])),
  };
}

export function createRealisticBootstrapFixture(options = {}) {
  const fixture = createEmptyBootstrapFixture(options);
  fixture.eventSeries = Array.from({ length: 4 }, (_, index) => ({
    id: `SYNTHETIC-SERIES-${String(index + 1).padStart(2, '0')}`,
    code: `SYN-${String(index + 1).padStart(2, '0')}`,
    name: `Synthetic Series ${String(index + 1).padStart(2, '0')}`,
    status: index === 3 ? 'COMPLETED' : 'ACTIVE',
    createdAt: iso(1 + index),
    updatedAt: iso(8 + index),
    createdBy: 'SYNTHETIC-SYSTEM',
  }));
  fixture.events = Array.from({ length: 12 }, (_, index) => ({
    id: `SYNTHETIC-EVENT-${String(index + 1).padStart(2, '0')}`,
    seriesId: fixture.eventSeries[index % fixture.eventSeries.length].id,
    code: `SYN-EVENT-${String(index + 1).padStart(2, '0')}`,
    name: `Synthetic Event ${String(index + 1).padStart(2, '0')}`,
    startAt: iso(10 + (index % 15)),
    endAt: iso(10 + (index % 15)),
    venue: `Synthetic Venue ${String((index % 4) + 1).padStart(2, '0')}`,
    owner: 'SYNTHETIC-OWNER',
    department: 'SYNTHETIC-DEPARTMENT',
    status: 'ACTIVE',
  }));
  fixture.inventoryItems = Array.from({ length: 24 }, (_, index) => ({
    id: `SYNTHETIC-ITEM-${String(index + 1).padStart(3, '0')}`,
    name: `Synthetic Item ${String(index + 1).padStart(3, '0')}`,
    aliases: [`synthetic-${index + 1}`],
    category: index % 3 === 0 ? 'Equipment' : 'Office Supplies',
    stockArea: index % 4 === 0 ? 'Pantry' : 'Inventory',
    handling: index % 5 === 0 ? 'Loanable' : 'Consumable',
    unit: index % 2 === 0 ? 'piece' : 'pack',
    openingOnHand: 12 + index,
    reserved: index % 4,
    availableToPromise: 12 + index - (index % 4),
    status: index === 23 ? 'VERIFY' : 'ACTIVE',
    catalogType: index % 4 === 0 ? 'PANTRY' : 'OFFICE_INVENTORY',
    storageLocation: `SYNTHETIC-LOCATION-${String((index % 6) + 1).padStart(2, '0')}`,
    reorderThreshold: 2,
    lendingAudience: index % 5 === 0 ? 'USC_STAFF_ONLY' : 'NOT_AVAILABLE_FOR_LENDING',
    defaultLoanDays: index % 5 === 0 ? 3 : '',
    maximumLoanQuantity: index % 5 === 0 ? 2 : '',
    approvalRequired: true,
    createdAt: iso(2),
    updatedAt: iso(9),
    createdBy: 'SYNTHETIC-SYSTEM',
  }));
  fixture.requests = Array.from({ length: 30 }, (_, index) => ({
    id: `SYNTHETIC-REQUEST-${String(index + 1).padStart(3, '0')}`,
    requestType: index % 5 === 0 ? 'CATALOG_RESTOCK' : 'EVENT_LOGISTICS',
    eventId: fixture.events[index % fixture.events.length].id,
    eventName: fixture.events[index % fixture.events.length].name,
    purpose: `Synthetic request ${String(index + 1).padStart(3, '0')}`,
    displayName: `Synthetic request ${String(index + 1).padStart(3, '0')}`,
    status: index % 4 === 0 ? 'FOR_REVIEW' : 'APPROVED',
    createdAt: iso(3 + (index % 7)),
    updatedAt: iso(10 + (index % 5)),
    createdBy: 'SYNTHETIC-USER-001',
  }));
  fixture.requestLines = Array.from({ length: 60 }, (_, index) => ({
    id: `SYNTHETIC-LINE-${String(index + 1).padStart(3, '0')}`,
    requestId: fixture.requests[index % fixture.requests.length].id,
    itemId: fixture.inventoryItems[index % fixture.inventoryItems.length].id,
    itemName: fixture.inventoryItems[index % fixture.inventoryItems.length].name,
    quantity: 1 + (index % 3),
    unit: fixture.inventoryItems[index % fixture.inventoryItems.length].unit,
    status: 'FOR_REVIEW',
    fulfillmentSource: index % 2 === 0 ? 'ISSUE_FROM_STOCK' : 'FOR_CANVASSING',
    createdAt: iso(5),
    updatedAt: iso(11),
    createdBy: 'SYNTHETIC-USER-001',
  }));
  fixture.reservations = Array.from({ length: 12 }, (_, index) => ({
    id: `SYNTHETIC-RESERVATION-${String(index + 1).padStart(2, '0')}`,
    requestId: fixture.requests[index].id,
    itemId: fixture.inventoryItems[index].id,
    quantity: 1 + (index % 3),
    status: 'ACTIVE',
    createdAt: iso(6),
    updatedAt: iso(11),
    createdBy: 'SYNTHETIC-SYSTEM',
  }));
  fixture.ledgerTransactions = Array.from({ length: 48 }, (_, index) => ({
    id: `SYNTHETIC-LEDGER-${String(index + 1).padStart(3, '0')}`,
    itemId: fixture.inventoryItems[index % fixture.inventoryItems.length].id,
    direction: index % 2 === 0 ? 'IN' : 'OUT',
    quantity: 1 + (index % 4),
    transactionType: index % 2 === 0 ? 'PURCHASE_RECEIPT' : 'ISSUE',
    status: 'POSTED',
    createdAt: iso(7),
    updatedAt: iso(7),
    createdBy: 'SYNTHETIC-SYSTEM',
  }));
  fixture.restockRequests = Array.from({ length: 6 }, (_, index) => ({
    id: `SYNTHETIC-RESTOCK-REQUEST-${String(index + 1).padStart(2, '0')}`,
    itemId: fixture.inventoryItems[index].id,
    quantity: 4 + index,
    status: index % 2 === 0 ? 'FOR_REVIEW' : 'APPROVED',
    createdAt: iso(8),
    updatedAt: iso(12),
    createdBy: 'SYNTHETIC-USER-001',
  }));
  fixture.restockRecords = Array.from({ length: 4 }, (_, index) => ({
    id: `SYNTHETIC-RESTOCK-RECORD-${String(index + 1).padStart(2, '0')}`,
    restockRequestId: fixture.restockRequests[index].id,
    status: 'RECEIVED',
    createdAt: iso(9),
    updatedAt: iso(12),
    createdBy: 'SYNTHETIC-SYSTEM',
  }));
  fixture.lendingTickets = Array.from({ length: 8 }, (_, index) => ({
    id: `SYNTHETIC-LENDING-${String(index + 1).padStart(2, '0')}`,
    itemId: fixture.inventoryItems[(index * 5) % fixture.inventoryItems.length].id,
    quantity: 1,
    status: index % 2 === 0 ? 'FOR_REVIEW' : 'ACTIVE',
    borrowerType: 'USC_STAFF',
    dueAt: iso(20 + (index % 5)),
    createdAt: iso(8),
    updatedAt: iso(12),
    createdBy: 'SYNTHETIC-USER-001',
  }));
  fixture.releaseConfirmations = Array.from({ length: 6 }, (_, index) => ({
    id: `SYNTHETIC-RELEASE-${String(index + 1).padStart(2, '0')}`,
    requestId: fixture.requests[index].id,
    status: 'CONFIRMED',
    createdAt: iso(9),
    updatedAt: iso(12),
    createdBy: 'SYNTHETIC-USER-001',
  }));
  fixture.deliverables = Array.from({ length: 18 }, (_, index) => ({
    id: `SYNTHETIC-DELIVERABLE-${String(index + 1).padStart(2, '0')}`,
    requestId: fixture.requests[index].id,
    itemId: fixture.inventoryItems[index % fixture.inventoryItems.length].id,
    status: index % 3 === 0 ? 'FOR_REVIEW' : 'RECEIVED',
    quantity: 1 + (index % 3),
    createdAt: iso(9),
    updatedAt: iso(12),
    createdBy: 'SYNTHETIC-USER-001',
  }));
  fixture.canvassReferences = Array.from({ length: 6 }, (_, index) => ({
    id: `SYNTHETIC-CANVASS-${String(index + 1).padStart(2, '0')}`,
    requestId: fixture.requests[index].id,
    supplierName: `Synthetic Supplier ${String(index + 1).padStart(2, '0')}`,
    status: 'RECEIVED',
    createdAt: iso(10),
    updatedAt: iso(12),
    createdBy: 'SYNTHETIC-USER-001',
  }));
  fixture.roadmapMilestones = Array.from({ length: 5 }, (_, index) => ({
    id: `SYNTHETIC-MILESTONE-${String(index + 1).padStart(2, '0')}`,
    title: `Synthetic milestone ${String(index + 1).padStart(2, '0')}`,
    status: index < 2 ? 'COMPLETE' : 'PLANNED',
    createdAt: iso(1),
    updatedAt: iso(12),
    createdBy: 'SYNTHETIC-SYSTEM',
  }));
  fixture.statusHistory = Array.from({ length: 20 }, (_, index) => ({
    id: `SYNTHETIC-HISTORY-${String(index + 1).padStart(2, '0')}`,
    entityId: fixture.requests[index % fixture.requests.length].id,
    fromStatus: 'FOR_REVIEW',
    toStatus: 'APPROVED',
    createdAt: iso(11),
    createdBy: 'SYNTHETIC-USER-001',
  }));
  fixture.auditLog = Array.from({ length: 20 }, (_, index) => ({
    id: `SYNTHETIC-AUDIT-${String(index + 1).padStart(2, '0')}`,
    action: 'READ_BOOTSTRAP_FIXTURE',
    entityType: 'BOOTSTRAP',
    entityId: `SYNTHETIC-REQUEST-${String((index % fixture.requests.length) + 1).padStart(3, '0')}`,
    createdAt: iso(12),
    createdBy: 'SYNTHETIC-SYSTEM',
  }));
  return fixture;
}
