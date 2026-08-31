import type { Route } from '../appTypes';

type JsonRecord = Record<string, unknown>;

export type OverviewSignal = {
  key: string;
  kind: 'request' | 'request-line' | 'inventory' | 'lending' | 'restock' | 'deliverable' | 'event';
  eyebrow: string;
  title: string;
  detail: string;
  status: string;
  route: Route;
  updatedAt: string;
  urgency: number;
};

export type OverviewProjection = {
  attention: OverviewSignal[];
  ready: OverviewSignal[];
  blocked: OverviewSignal[];
  changed: OverviewSignal[];
  sourceRecordCount: number;
};

const ATTENTION_REQUEST = new Set([
  'FOR_REVIEW',
  'NEEDS_INFORMATION',
  'PARTIALLY_FULFILLED',
  'PARTIALLY_RELEASED',
]);
const BLOCKED = new Set(['BLOCKED', 'NEEDS_INFORMATION']);
const READY = new Set([
  'READY',
  'READY_TO_RELEASE',
  'READY_TO_CLAIM',
  'READY_TO_RECEIVE',
  'PROCURED',
  'REVIEW_COMPLETE',
]);

function text(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function number(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

function records(value: unknown): JsonRecord[] {
  return Array.isArray(value)
    ? value.filter((entry): entry is JsonRecord => Boolean(entry) && typeof entry === 'object')
    : [];
}

export function presentStatus(value: string) {
  const normalized = value || 'STATUS_NOT_REPORTED';
  return normalized
    .toLowerCase()
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function timestamp(value: string) {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function newestFirst(a: OverviewSignal, b: OverviewSignal) {
  return (
    b.urgency - a.urgency || timestamp(b.updatedAt) - timestamp(a.updatedAt) || a.key.localeCompare(b.key)
  );
}

function dedupe(values: OverviewSignal[], limit: number) {
  const keys = new Set<string>();
  return values
    .sort(newestFirst)
    .filter((value) => {
      if (keys.has(value.key)) return false;
      keys.add(value.key);
      return true;
    })
    .slice(0, limit);
}

function requestSignal(row: JsonRecord): OverviewSignal | null {
  const id = text(row.id);
  if (!id) return null;
  const status = text(row.status);
  return {
    key: `request:${id}`,
    kind: 'request',
    eyebrow: `Request · ${id}`,
    title: text(row.purpose) || text(row.type) || 'Request record',
    detail: text(row.department) || 'Department not reported',
    status,
    route: 'request-center',
    updatedAt: text(row.updatedAt) || text(row.createdAt),
    urgency: text(row.priority).toUpperCase() === 'URGENT' ? 4 : status === 'FOR_REVIEW' ? 3 : 2,
  };
}

function requestLineSignal(row: JsonRecord): OverviewSignal | null {
  const id = text(row.id);
  if (!id) return null;
  const status = text(row.status);
  const quantity = number(row.quantity);
  const unit = text(row.unit);
  return {
    key: `request-line:${id}`,
    kind: 'request-line',
    eyebrow: `Request line · ${text(row.requestId) || id}`,
    title: text(row.description) || 'Requested item',
    detail:
      quantity === null
        ? text(row.fulfillmentSource) || 'Quantity not reported'
        : `${quantity} ${unit}`.trim(),
    status,
    route: status === 'READY_TO_RELEASE' ? 'release' : 'request-center',
    updatedAt: text(row.updatedAt) || text(row.neededAt),
    urgency: status === 'READY_TO_RELEASE' ? 3 : 2,
  };
}

function inventorySignal(row: JsonRecord): OverviewSignal | null {
  const id = text(row.id);
  if (!id) return null;
  const available = number(row.availableToPromise);
  const status = text(row.classificationStatus);
  const lowState = text(row.lowStockState);
  const out = available !== null && available <= 0;
  const unconfirmed = status !== 'CLASSIFIED';
  const low = lowState === 'LOW';
  if (!out && !unconfirmed && !low) return null;
  return {
    key: `inventory:${id}`,
    kind: 'inventory',
    eyebrow: `Inventory · ${id}`,
    title: text(row.name) || 'Inventory record',
    detail: out
      ? 'No quantity is available to promise.'
      : unconfirmed
        ? 'Classification requires confirmation.'
        : 'On-hand quantity is below the configured alert threshold.',
    status: out ? 'OUT_OF_STOCK' : unconfirmed ? 'NEEDS_CLASSIFICATION' : 'LOW_STOCK',
    route: 'inventory',
    updatedAt: text(row.updatedAt),
    urgency: out ? 4 : unconfirmed ? 3 : 2,
  };
}

function simpleSignal(
  row: JsonRecord,
  kind: OverviewSignal['kind'],
  route: Route,
  label: string,
): OverviewSignal | null {
  const id = text(row.id);
  if (!id) return null;
  const status = text(row.status);
  return {
    key: `${kind}:${id}`,
    kind,
    eyebrow: `${label} · ${id}`,
    title: text(row.name) || text(row.purpose) || text(row.description) || `${label} record`,
    detail: text(row.department) || text(row.unit) || 'Current authorized record',
    status,
    route,
    updatedAt: text(row.updatedAt) || text(row.createdAt),
    urgency: status === 'OVERDUE' || BLOCKED.has(status) ? 4 : status === 'FOR_REVIEW' ? 3 : 2,
  };
}

function eventSignal(row: JsonRecord): OverviewSignal | null {
  const id = text(row.id);
  if (!id) return null;
  const timeStatus = text(row.timeStatus);
  const reviewStatus = text(row.ownerReviewStatus);
  const status = timeStatus === 'TBA' ? 'TIME_TBA' : reviewStatus || text(row.status);
  return {
    key: `event:${id}`,
    kind: 'event',
    eyebrow: `Event · ${id}`,
    title: text(row.name) || 'Event record',
    detail:
      timeStatus === 'TBA'
        ? 'Schedule is still to be announced.'
        : text(row.startAt) || 'Scheduled time not reported',
    status,
    route: 'events',
    updatedAt: text(row.updatedAt) || text(row.startAt),
    urgency: timeStatus === 'TBA' ? 4 : reviewStatus === 'OWNER_REVIEW_REQUIRED' ? 3 : 1,
  };
}

/**
 * Produces an attention-first view from the bounded authorized bootstrap only.
 * It never creates metrics, predictions, or lifecycle states the server did not return.
 */
export function projectOverview(data: Record<string, JsonRecord[]>): OverviewProjection {
  const requests = records(data.requests).map(requestSignal).filter(Boolean) as OverviewSignal[];
  const requestLines = records(data.requestLines).map(requestLineSignal).filter(Boolean) as OverviewSignal[];
  const inventory = records(data.inventoryItems).map(inventorySignal).filter(Boolean) as OverviewSignal[];
  const lending = records(data.lendingTickets)
    .map((row) => simpleSignal(row, 'lending', 'lending', 'Lending'))
    .filter(Boolean) as OverviewSignal[];
  const restocks = records(data.restockRequests)
    .map((row) => simpleSignal(row, 'restock', 'restocking', 'Restock'))
    .filter(Boolean) as OverviewSignal[];
  const deliverables = records(data.deliverables)
    .map((row) => simpleSignal(row, 'deliverable', 'procurement', 'Deliverable'))
    .filter(Boolean) as OverviewSignal[];
  const events = records(data.events).map(eventSignal).filter(Boolean) as OverviewSignal[];
  const all = [
    ...requests,
    ...requestLines,
    ...inventory,
    ...lending,
    ...restocks,
    ...deliverables,
    ...events,
  ];

  const attention = all.filter((signal) => {
    if (signal.kind === 'inventory') return true;
    if (signal.kind === 'event') {
      return ['TIME_TBA', 'OWNER_REVIEW_REQUIRED'].includes(signal.status);
    }
    return ATTENTION_REQUEST.has(signal.status) || BLOCKED.has(signal.status) || signal.status === 'OVERDUE';
  });
  const ready = all.filter((signal) => READY.has(signal.status));
  const blocked = all.filter(
    (signal) =>
      BLOCKED.has(signal.status) ||
      signal.status === 'TIME_TBA' ||
      (signal.kind === 'inventory' && ['OUT_OF_STOCK', 'NEEDS_CLASSIFICATION'].includes(signal.status)),
  );
  const changed = all.filter((signal) => Boolean(signal.updatedAt));
  const sourceRecordCount = Object.values(data).reduce(
    (total, collection) => total + records(collection).length,
    0,
  );

  return {
    attention: dedupe(attention, 8),
    ready: dedupe(ready, 6),
    blocked: dedupe(blocked, 6),
    changed: dedupe(changed, 8),
    sourceRecordCount,
  };
}
