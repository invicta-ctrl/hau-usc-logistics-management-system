import {
  ACCOUNTS,
  ACTIVITY,
  EVENTS,
  HEALTH,
  INVENTORY,
  INVENTORY_COMPOSITION,
  LEDGER,
  LOANS,
  NOTIFICATIONS,
  PROCUREMENT,
  RELEASES,
  REQUEST_LINES,
  REQUESTS,
  RESTOCKING,
} from '../src/data/mock.js';

const TARGETS = Object.freeze([
  REQUESTS,
  REQUEST_LINES,
  LOANS,
  RELEASES,
  INVENTORY,
  LEDGER,
  EVENTS,
  ACTIVITY,
  PROCUREMENT,
  RESTOCKING,
  ACCOUNTS,
  HEALTH,
  NOTIFICATIONS,
  INVENTORY_COMPOSITION,
]);

const text = (...values) => {
  for (const value of values) {
    const normalized = String(value ?? '').trim();
    if (normalized) return normalized;
  }
  return '';
};

const number = (...values) => {
  for (const value of values) {
    const normalized = Number(value);
    if (Number.isFinite(normalized)) return normalized;
  }
  return 0;
};

const rows = (...values) => values.find((value) => Array.isArray(value)) ?? [];
const replace = (target, values) => target.splice(0, target.length, ...values);

function dateOnly(value) {
  const normalized = text(value);
  if (!normalized) return 'Not set';
  return normalized.slice(0, 10);
}

function age(value) {
  const instant = new Date(value).getTime();
  if (!Number.isFinite(instant)) return '';
  const days = Math.max(0, Math.floor((Date.now() - instant) / 86_400_000));
  return days === 0 ? 'Today' : `${days} day${days === 1 ? '' : 's'}`;
}

function timeLabel(value) {
  const instant = new Date(value);
  if (Number.isNaN(instant.getTime())) return text(value, 'Recent');
  return instant.toLocaleString('en-PH', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'Asia/Manila',
  });
}

function itemMap(state) {
  return new Map(rows(state.inventoryItems).map((item) => [text(item.id, item.itemId), item]));
}

function eventMap(state) {
  return new Map(rows(state.events).map((event) => [text(event.id, event.eventId), event]));
}

function requestRows(state) {
  const allLines = rows(state.requestLines);
  const events = eventMap(state);
  return rows(state.requests).map((request) => {
    const requestId = text(request.id, request.requestId);
    const lines = allLines.filter(
      (line) => text(line.requestId, line.request_id, line.sourceRequestId) === requestId,
    );
    const routed = lines.filter(
      (line) => !['', 'PENDING_DECISION'].includes(text(line.fulfillmentSource, line.route).toUpperCase()),
    ).length;
    const event = events.get(text(request.eventId, request.event_id));
    return {
      ref: requestId,
      title: text(request.purpose, request.title, request.type, requestId),
      org: text(request.requesterGroup, request.organization, request.requesterName, 'Requester'),
      event: text(event?.name, request.eventName, request.eventId, 'Not linked'),
      committee: text(request.ownerCommitteeId, request.committeeId, request.committee, 'ALL'),
      status: text(request.status, 'FOR_REVIEW').toUpperCase(),
      lines: lines.length,
      routed,
      needed: dateOnly(request.neededDate ?? request.dateStart ?? request.dateEnd),
      age: age(request.createdAt),
    };
  });
}

function requestLineRows(state, selectedRequestId) {
  const requests = rows(state.requests);
  const selected = text(selectedRequestId, requests[0]?.id, requests[0]?.requestId);
  const items = itemMap(state);
  return rows(state.requestLines)
    .filter((line) => !selected || text(line.requestId, line.request_id, line.sourceRequestId) === selected)
    .map((line) => {
      const item = items.get(text(line.itemId, line.item_id));
      return {
        id: text(line.id, line.requestLineId),
        requestId: text(line.requestId, line.request_id, line.sourceRequestId),
        item: text(line.description, line.itemName, item?.name, line.id, 'Requested item'),
        qty: number(line.requestedQuantity, line.quantity),
        unit: text(line.unit, item?.unit, 'piece'),
        route: text(line.fulfillmentSource, line.route, 'PENDING_DECISION').toUpperCase(),
        onHand: number(item?.onHand, item?.quantityOnHand),
        workflowRevision: number(line.workflowRevision, line.revision, 1),
      };
    });
}

function loanRows(state) {
  const items = itemMap(state);
  const today = Date.now();
  return rows(state.lendingTickets).map((loan) => {
    const due = text(loan.dueDate, loan.returnBy);
    const dueInstant = due ? new Date(`${due.slice(0, 10)}T00:00:00Z`).getTime() : Number.NaN;
    const item = items.get(text(loan.itemId, loan.item_id));
    return {
      ref: text(loan.id, loan.ticketId, loan.submissionId),
      item: text(loan.itemName, item?.name, loan.itemId, 'Loan item'),
      borrower: text(loan.borrowerName, loan.borrowerGroup, 'Borrower'),
      kind: text(loan.borrowerType, loan.borrowerGroup, loan.type, 'Borrower'),
      status: text(loan.status, 'FOR_REVIEW').toUpperCase(),
      due: dateOnly(due),
      days:
        Number.isFinite(dueInstant) && dueInstant < today
          ? Math.max(0, Math.floor((today - dueInstant) / 86_400_000))
          : 0,
      evidence: Boolean(
        loan.physicalIdVerified || loan.evidenceVerified || loan.evidenceStatus === 'VERIFIED',
      ),
    };
  });
}

function releaseRows(state) {
  const confirmations = rows(state.releaseConfirmations);
  const lines = rows(state.requestLines);
  return rows(state.requests).map((request) => {
    const requestId = text(request.id, request.requestId);
    const requestLines = lines.filter((line) => text(line.requestId, line.request_id) === requestId);
    const confirmed = confirmations.filter(
      (entry) => text(entry.requestId, entry.request_id, entry.relatedEntityId) === requestId,
    );
    const total = requestLines.reduce((sum, line) => sum + number(line.requestedQuantity, line.quantity), 0);
    const releasedFromLines = requestLines.reduce(
      (sum, line) => sum + number(line.releasedQuantity, line.quantityReleased),
      0,
    );
    const released = confirmed.length
      ? confirmed.reduce((sum, entry) => sum + number(entry.quantity, entry.releasedQuantity), 0)
      : releasedFromLines;
    return {
      ref: requestId,
      title: text(request.purpose, request.title, request.type, requestId),
      recipient: text(request.requesterGroup, request.organization, request.requesterName, 'Requester'),
      status: text(
        request.status,
        released >= total && total > 0 ? 'COMPLETED' : 'READY_TO_RELEASE',
      ).toUpperCase(),
      released,
      total,
    };
  });
}

function inventoryRows(state) {
  return rows(state.inventoryItems).map((item) => {
    const onHand = number(item.onHand, item.quantityOnHand, item.stockOnHand);
    const reserved = number(item.reserved, item.reservedQuantity);
    return {
      ref: text(item.id, item.itemId, item.productId),
      name: text(item.name, item.itemName, item.id, 'Inventory item'),
      category: text(item.category, item.categoryCode) || null,
      handling: text(item.handling, item.handlingCode, item.type, 'Unverified'),
      onHand,
      reserved,
      unit: text(item.unit, 'piece'),
      status: text(item.status, 'ACTIVE').toUpperCase(),
      low: Boolean(item.lowStock) || onHand <= number(item.reorderThreshold),
      imageUrl: text(item.imageUrl),
    };
  });
}

function ledgerRows(state, selectedInventoryId = '') {
  return rows(state.ledgerTransactions)
    .filter(
      (movement) => !selectedInventoryId || text(movement.itemId, movement.item_id) === selectedInventoryId,
    )
    .map((movement) => {
      const rawQuantity = number(movement.quantity, movement.delta);
      const direction = text(movement.direction).toUpperCase();
      const quantity = direction === 'OUT' && rawQuantity > 0 ? -rawQuantity : rawQuantity;
      return {
        date: dateOnly(movement.timestamp ?? movement.createdAt ?? movement.occurredAt),
        type: text(movement.type, movement.movementType, 'ADJUSTMENT'),
        ref: text(movement.relatedEntityId, movement.referenceId, movement.id),
        actor: text(movement.actorName, movement.actor, 'Authorized staff'),
        qty: quantity,
        balance: number(movement.balanceAfter, movement.balance),
      };
    });
}

function eventRows(state) {
  const events = rows(state.events);
  const requests = rows(state.requests);
  const series = rows(state.eventSeries);
  if (!series.length) {
    return events.map((event) => ({
      name: text(event.name, event.code, event.id),
      window: `${dateOnly(event.startAt ?? event.startsAt)} – ${dateOnly(event.endAt ?? event.endsAt)}`,
      subEvents: 1,
      readiness: number(event.readiness, event.readinessPercent),
      requests: requests.filter((request) => text(request.eventId) === text(event.id)).length,
      status: text(event.status, 'ACTIVE').toUpperCase(),
    }));
  }
  return series.map((entry) => {
    const id = text(entry.id, entry.seriesId);
    const children = events.filter((event) => text(event.seriesId, event.eventSeriesId) === id);
    const dates = children
      .flatMap((event) => [event.startAt, event.startsAt, event.endAt, event.endsAt])
      .filter(Boolean)
      .sort();
    const readiness = children.length
      ? Math.round(
          children.reduce((sum, event) => sum + number(event.readiness, event.readinessPercent), 0) /
            children.length,
        )
      : number(entry.readiness, entry.readinessPercent);
    return {
      name: text(entry.name, entry.code, id),
      window: dates.length ? `${dateOnly(dates[0])} – ${dateOnly(dates.at(-1))}` : 'Not scheduled',
      subEvents: children.length,
      readiness,
      requests: requests.filter((request) => text(request.eventSeriesId) === id).length,
      status: text(entry.status, 'ACTIVE').toUpperCase(),
    };
  });
}

function activityRows(state) {
  return rows(state.dashboardActivity, state.auditLog, state.statusHistory).map((entry) => ({
    time: timeLabel(entry.occurredAt ?? entry.createdAt ?? entry.timestamp ?? entry.updatedAt),
    text: text(entry.summary, entry.message, entry.action, entry.eventType, entry.id, 'Operational update'),
    kind: text(entry.kind, entry.entityType, entry.domain, 'Activity'),
  }));
}

function restockRows(state) {
  const items = itemMap(state);
  const receipts = rows(state.restockRecords);
  return rows(state.restockRequests).map((request) => {
    const id = text(request.id, request.restockRequestId);
    const requestLineId = text(request.requestLineId, request.sourceRequestLineId);
    const received = receipts
      .filter(
        (entry) => text(entry.restockRequestId) === id || text(entry.sourceRequestLineId) === requestLineId,
      )
      .reduce((sum, entry) => sum + number(entry.quantity, entry.quantityReceived), 0);
    const item = items.get(text(request.itemId));
    return {
      ref: id,
      item: text(request.itemName, item?.name, request.description, requestLineId),
      requested: number(request.quantity, request.quantityOrdered, request.requestedQuantity),
      received,
      unit: text(request.unit, item?.unit, 'piece'),
      status: text(request.status, 'FOR_REVIEW').toUpperCase(),
    };
  });
}

function procurementRows(state) {
  const canvasses = rows(state.canvassReferences);
  return rows(state.deliverables).map((deliverable) => {
    const id = text(deliverable.id, deliverable.deliverableId);
    const quotes = canvasses.filter((entry) =>
      [entry.deliverableId, entry.relatedEntityId, ...(entry.linkedRequestLineIds ?? [])]
        .map(text)
        .includes(id),
    );
    const preferred = quotes.find((entry) => entry.preferred || entry.status === 'PREFERRED');
    return {
      ref: id,
      item: text(deliverable.itemSpec, deliverable.description, deliverable.itemName, id),
      suppliers: new Set(quotes.map((entry) => text(entry.supplierId, entry.supplierName))).size,
      preferred: text(preferred?.supplierName, preferred?.supplierId, 'Not decided'),
      status: text(deliverable.status, 'FOR_CANVASSING').toUpperCase(),
    };
  });
}

function notificationRows(state) {
  const loans = rows(state.lendingTickets);
  const requests = rows(state.requests);
  const inventory = rows(state.inventoryItems);
  return [
    {
      title: `${loans.filter((loan) => text(loan.status).toUpperCase() === 'OVERDUE').length} loans are overdue`,
      body: 'Follow up on pending returns.',
      tone: 'alert',
    },
    {
      title: `${requests.filter((request) => text(request.status).toUpperCase() === 'FOR_REVIEW').length} requests await review`,
      body: 'Each line needs one routing decision.',
      tone: 'info',
    },
    {
      title: `${inventory.filter((item) => number(item.onHand) <= number(item.reorderThreshold)).length} items are low or out of stock`,
      body: 'Check restocking before the next event.',
      tone: 'progress',
    },
  ];
}

function compositionRows(state) {
  const inventory = rows(state.inventoryItems);
  const available = inventory.reduce(
    (sum, item) => sum + number(item.availableToPromise, number(item.onHand) - number(item.reserved)),
    0,
  );
  const reserved = inventory.reduce((sum, item) => sum + number(item.reserved), 0);
  const canvass = rows(state.deliverables)
    .filter((entry) => text(entry.status).toUpperCase() === 'FOR_CANVASSING')
    .reduce((sum, entry) => sum + number(entry.quantity, entry.quantityOrdered), 0);
  const onLoan = rows(state.lendingTickets)
    .filter((loan) => ['ON_LOAN', 'OVERDUE'].includes(text(loan.status).toUpperCase()))
    .reduce((sum, loan) => sum + number(loan.quantity, loan.handedOutQuantity), 0);
  return [
    { label: 'Available', value: available, color: 'var(--tone-done-fg)' },
    { label: 'Reserved', value: reserved, color: 'var(--gold-600)' },
    { label: 'For canvassing', value: canvass, color: 'var(--tone-info-fg)' },
    { label: 'On loan', value: onLoan, color: 'var(--ox-600)' },
  ];
}

export function clearBackendViewModels() {
  TARGETS.forEach((target) => target.splice(0, target.length));
}

export function applyOperationalState(state, { selectedRequestId = '', selectedInventoryId = '' } = {}) {
  replace(REQUESTS, requestRows(state));
  replace(REQUEST_LINES, requestLineRows(state, selectedRequestId));
  replace(LOANS, loanRows(state));
  replace(RELEASES, releaseRows(state));
  replace(INVENTORY, inventoryRows(state));
  replace(LEDGER, ledgerRows(state, selectedInventoryId));
  replace(EVENTS, eventRows(state));
  replace(ACTIVITY, activityRows(state));
  replace(PROCUREMENT, procurementRows(state));
  replace(RESTOCKING, restockRows(state));
  replace(NOTIFICATIONS, notificationRows(state));
  replace(INVENTORY_COMPOSITION, compositionRows(state));
}

export function applyAccounts(result) {
  const source = rows(result?.accounts, result?.items, result?.directory, result?.rows);
  replace(
    ACCOUNTS,
    source.map((account) => ({
      name: text(account.displayName, account.name, account.accessId, account.id, 'Account'),
      role: text(account.roleId, account.role, 'REQUESTER').toUpperCase(),
      committee: text(account.committeeId, account.committee) || null,
      status: text(account.status, account.accountStatus, 'ACTIVE').toUpperCase(),
      mapped: !['NEEDS_REVIEW', 'UNKNOWN_ROLE'].includes(
        text(account.mappingStatus, account.directoryStatus).toUpperCase(),
      ),
    })),
  );
}

export function staffAccountActivityHistoryProjection(result) {
  return {
    personId: text(result?.personId),
    historyStartsAt: text(result?.historyStartsAt),
    page: number(result?.page),
    pageSize: number(result?.pageSize),
    total: number(result?.total),
    totalPages: number(result?.totalPages),
    items: rows(result?.items).map((item) => ({
      id: text(item?.id),
      occurredAt: text(item?.occurredAt),
      eventType: text(item?.eventType),
      actionCode: text(item?.actionCode),
      accountId: text(item?.accountId),
      accountAccessIdSnapshot: text(item?.accountAccessIdSnapshot),
      correlationId: text(item?.correlationId),
      linkState: text(item?.linkState),
      previousLinkState: text(item?.previousLinkState),
      assignmentState: text(item?.assignmentState),
      previousAssignmentState: text(item?.previousAssignmentState),
      oldEffectiveFrom: text(item?.oldEffectiveFrom),
      oldEffectiveTo: text(item?.oldEffectiveTo),
      newEffectiveFrom: text(item?.newEffectiveFrom),
      newEffectiveTo: text(item?.newEffectiveTo),
    })),
  };
}

export function applyHealth({ health, readiness, version, evidence } = {}) {
  const healthOk = health?.ok !== false;
  const readinessOk = readiness?.ok !== false && readiness?.ready !== false;
  replace(HEALTH, [
    {
      name: 'Release identity',
      value: text(version?.version, version?.appVersion, 'Unavailable'),
      tone: version ? 'done' : 'alert',
    },
    { name: 'Database', value: healthOk ? 'Healthy' : 'Unavailable', tone: healthOk ? 'done' : 'alert' },
    {
      name: 'Evidence storage',
      value: evidence?.ok === false ? 'Unavailable' : evidence ? 'Healthy' : 'Not reported',
      tone: evidence?.ok === false ? 'alert' : evidence ? 'done' : 'progress',
    },
    {
      name: 'Readiness',
      value: readinessOk ? 'Ready' : 'Unavailable',
      tone: readinessOk ? 'done' : 'alert',
    },
  ]);
}

export function roleForV5(user) {
  const role = text(user?.authorization?.roleId, user?.role).toUpperCase();
  return ['SYSTEM_OWNER', 'ADMINISTRATOR', 'DIRECTOR', 'COMMITTEE_HEAD', 'DOL_STAFF', 'REQUESTER'].includes(
    role,
  )
    ? role
    : 'REQUESTER';
}

export function workspaceForV5(user) {
  return text(user?.authorization?.defaultWorkspaceId, 'administrator');
}

export function viewModelCounts() {
  return Object.freeze({
    requests: REQUESTS.length,
    requestLines: REQUEST_LINES.length,
    loans: LOANS.length,
    releases: RELEASES.length,
    inventory: INVENTORY.length,
    ledger: LEDGER.length,
    events: EVENTS.length,
    activity: ACTIVITY.length,
    procurement: PROCUREMENT.length,
    restocking: RESTOCKING.length,
    accounts: ACCOUNTS.length,
    health: HEALTH.length,
  });
}
