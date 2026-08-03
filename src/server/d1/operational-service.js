import { accountAuthorization } from '../auth/contracts.js';
import { CAPABILITIES, COMMITTEES } from '../../domain/permissions.js';
import { validateBorrowerIdentityApproval } from '../../domain/borrower-identity.js';
import {
  isApprovedRequestCenterChoice,
  REQUEST_CENTER_CATEGORIES,
  REQUEST_CENTER_CHOICES,
  REQUEST_CENTER_UNITS,
} from '../../domain/request-center.js';
import { loadLendingCatalog } from '../lending-catalog-service.js';
import { isCountableUnit, isKnownQuantityUnit } from '../../domain/quantity-units.js';

const MODULES = Object.freeze([
  'overview',
  'request',
  'lending',
  'release',
  'restocking',
  'procurement',
  'inventory',
]);

const MODULE_CAPABILITIES = Object.freeze({
  overview: CAPABILITIES.VIEW_INTERNAL,
  request: CAPABILITIES.VIEW_REQUEST,
  lending: CAPABILITIES.VIEW_INTERNAL,
  release: CAPABILITIES.FULFILL_RELEASE,
  restocking: CAPABILITIES.VIEW_INVENTORY,
  procurement: CAPABILITIES.VIEW_INTERNAL,
  inventory: CAPABILITIES.VIEW_INVENTORY,
});

const METHOD_CAPABILITIES = Object.freeze({
  submitRequest: CAPABILITIES.REQUEST_CREATE,
  reviewRequest: CAPABILITIES.REQUEST_REVIEW,
  reserveStock: CAPABILITIES.FULFILL_RESERVE,
  saveCanvassReference: CAPABILITIES.FULFILL_CANVASS,
  updateCanvassReference: CAPABILITIES.FULFILL_CANVASS,
  archiveCanvassReference: CAPABILITIES.FULFILL_PROCURE,
  getMaterialsWorkQueue: CAPABILITIES.VIEW_INTERNAL,
  selectPreferredCanvass: CAPABILITIES.FULFILL_PROCURE,
  transitionDeliverable: CAPABILITIES.FULFILL_PROCURE,
  getRestockDetail: CAPABILITIES.VIEW_INVENTORY,
  transitionRestock: CAPABILITIES.FULFILL_PROCURE,
  createLendingTicket: CAPABILITIES.LENDING_CREATE,
  registerInventoryAsset: CAPABILITIES.LENDING_APPROVE,
  recordAssetMaintenance: CAPABILITIES.LENDING_RETURN,
  approveLendingTicket: CAPABILITIES.LENDING_APPROVE,
  confirmLendingHandoff: CAPABILITIES.LENDING_HANDOFF,
  confirmReturn: CAPABILITIES.LENDING_RETURN,
  receiveRestock: CAPABILITIES.FULFILL_RECEIVE,
  receiveDeliverable: CAPABILITIES.FULFILL_RECEIVE,
  uploadEvidence: CAPABILITIES.EVIDENCE_UPLOAD,
  confirmRelease: CAPABILITIES.FULFILL_RELEASE,
  correctRelease: CAPABILITIES.FULFILL_RELEASE,
  postCycleCountAdjustment: CAPABILITIES.INVENTORY_ADJUST,
  listInventoryClassifications: CAPABILITIES.INVENTORY_CLASSIFY,
  classifyInventoryItem: CAPABILITIES.INVENTORY_CLASSIFY,
  bulkClassifyInventoryItems: CAPABILITIES.INVENTORY_CLASSIFY,
  createInventoryItem: CAPABILITIES.REFERENCE_CATALOG_MANAGE,
  updateInventoryItem: CAPABILITIES.REFERENCE_CATALOG_MANAGE,
  updateInventoryStorageContext: CAPABILITIES.REFERENCE_CATALOG_MANAGE,
  archiveInventoryItem: CAPABILITIES.REFERENCE_CATALOG_MANAGE,
  restoreInventoryItem: CAPABILITIES.REFERENCE_CATALOG_MANAGE,
  getEventManagement: CAPABILITIES.EVENT_MANAGE,
  saveEventSeries: CAPABILITIES.EVENT_MANAGE,
  saveEventDay: CAPABILITIES.EVENT_MANAGE,
  saveEventActivity: CAPABILITIES.EVENT_MANAGE,
  linkEventOperationalRecord: CAPABILITIES.EVENT_MANAGE,
  getMigrationStatus: CAPABILITIES.SYSTEM_DIAGNOSTICS,
});

const DELIVERABLE_TRANSITIONS = Object.freeze({
  FOR_CANVASSING: Object.freeze(['WAITING_FOR_BUDGET', 'CANCELLED']),
  WAITING_FOR_BUDGET: Object.freeze(['TO_BE_PROCURED', 'CANCELLED']),
  TO_BE_PROCURED: Object.freeze(['PROCURED', 'CANCELLED']),
  PROCURED: Object.freeze(['PARTIALLY_RECEIVED', 'READY_TO_RELEASE', 'CANCELLED']),
  PARTIALLY_RECEIVED: Object.freeze(['READY_TO_RELEASE', 'CANCELLED']),
  READY_TO_RELEASE: Object.freeze(['PARTIALLY_RELEASED', 'COMPLETED']),
  PARTIALLY_RELEASED: Object.freeze(['COMPLETED']),
});

const RESTOCK_TRANSITIONS = Object.freeze({
  SEND_TO_BUDGET_REVIEW: Object.freeze({
    from: Object.freeze(['FOR_CANVASSING']),
    to: 'WAITING_FOR_BUDGET',
    requiresPreferred: true,
  }),
  AUTHORIZE_PROCUREMENT: Object.freeze({
    from: Object.freeze(['WAITING_FOR_BUDGET']),
    to: 'TO_BE_PROCURED',
    requiresPreferred: true,
  }),
  REJECT: Object.freeze({
    from: Object.freeze(['FOR_CANVASSING', 'WAITING_FOR_BUDGET']),
    to: 'REJECTED',
  }),
  CANCEL: Object.freeze({
    from: Object.freeze([
      'FOR_REVIEW',
      'FOR_CANVASSING',
      'WAITING_FOR_BUDGET',
      'TO_BE_PROCURED',
      'PARTIALLY_RECEIVED',
    ]),
    to: 'CANCELLED',
  }),
});

export class ApiError extends Error {
  constructor(code, message, { status = 422, details } = {}) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

const requiredText = (value, field, max = 240) => {
  const result = String(value ?? '').trim();
  if (!result || result.length > max) {
    throw new ApiError('VALIDATION_FAILED', `${field} is required.`, {
      details: { field },
    });
  }
  return result;
};

const optionalText = (value, max = 500) =>
  String(value ?? '')
    .trim()
    .slice(0, max);

const canvassUnit = (value) => {
  const unit = requiredText(value, 'unit', 40).toLowerCase();
  if (!isKnownQuantityUnit(unit)) {
    throw new ApiError('VALIDATION_FAILED', 'Select a supported quantity unit.', {
      details: { field: 'unit' },
    });
  }
  return unit;
};

const canvassCheckedAt = (value) => {
  const text = requiredText(value, 'checkedAt', 64);
  const parsed = new Date(text);
  const calendarDate = /^(\d{4})-(\d{2})-(\d{2})(?:$|T)/u.exec(text);
  const calendarCheck = calendarDate
    ? new Date(Date.UTC(Number(calendarDate[1]), Number(calendarDate[2]) - 1, Number(calendarDate[3])))
    : null;
  if (
    Number.isNaN(parsed.getTime()) ||
    (calendarDate &&
      (calendarCheck.getUTCFullYear() !== Number(calendarDate[1]) ||
        calendarCheck.getUTCMonth() + 1 !== Number(calendarDate[2]) ||
        calendarCheck.getUTCDate() !== Number(calendarDate[3])))
  ) {
    throw new ApiError('VALIDATION_FAILED', 'checkedAt must be a real date.', {
      details: { field: 'checkedAt' },
    });
  }
  return text;
};

const safeCanvassSourceUrl = (value) => {
  const text = optionalText(value, 500);
  if (!text) return '';
  try {
    const parsed = new URL(text);
    if (!['http:', 'https:'].includes(parsed.protocol) || parsed.username || parsed.password)
      throw new Error();
  } catch {
    throw new ApiError(
      'VALIDATION_FAILED',
      'sourceUrl must be a safe http(s) URL without embedded credentials.',
      { details: { field: 'sourceUrl' } },
    );
  }
  return text;
};

const positiveNumber = (value, field = 'quantity') => {
  const result = Number(value);
  if (!Number.isFinite(result) || result <= 0) {
    throw new ApiError('VALIDATION_FAILED', `${field} must be greater than zero.`, {
      details: { field },
    });
  }
  return result;
};

const positiveOperationalQuantity = (value, unit, field = 'quantity') => {
  const result = positiveNumber(value, field);
  if (!isKnownQuantityUnit(unit)) {
    throw new ApiError('VALIDATION_FAILED', `${field} uses an unsupported unit.`, {
      details: { field, unit: String(unit ?? '') },
    });
  }
  if (isCountableUnit(unit) && !Number.isInteger(result)) {
    throw new ApiError('VALIDATION_FAILED', `${field} must be a whole number for ${unit}.`, {
      details: { field, unit: String(unit ?? '') },
    });
  }
  return result;
};

const nonNegativeNumber = (value, field = 'value') => {
  const result = Number(value);
  if (!Number.isFinite(result) || result < 0) {
    throw new ApiError('VALIDATION_FAILED', `${field} must be zero or greater.`, {
      details: { field },
    });
  }
  return result;
};

const nonNegativeOperationalQuantity = (value, unit, field = 'quantity') => {
  const result = nonNegativeNumber(value, field);
  if (!isKnownQuantityUnit(unit)) {
    throw new ApiError('VALIDATION_FAILED', `${field} uses an unsupported unit.`, {
      details: { field, unit: String(unit ?? '') },
    });
  }
  if (isCountableUnit(unit) && !Number.isInteger(result)) {
    throw new ApiError('VALIDATION_FAILED', `${field} must be a whole number for ${unit}.`, {
      details: { field, unit: String(unit ?? '') },
    });
  }
  return result;
};

const nowIso = () => new Date().toISOString();
const createId = (prefix) => `${prefix}-${crypto.randomUUID()}`;

const nullableText = (value, max = 500) => optionalText(value, max) || null;

const nullablePercentage = (value, field) => {
  if (value === '' || value === null || value === undefined) return null;
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0 || number > 100) {
    throw new ApiError('VALIDATION_FAILED', `${field} must be between 0 and 100.`, {
      details: { field },
    });
  }
  return number;
};

const stableValue = (value) => {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === 'object') {
    return Object.keys(value)
      .sort()
      .reduce((result, key) => {
        result[key] = stableValue(value[key]);
        return result;
      }, {});
  }
  return value;
};

const base64Url = (buffer) => {
  let binary = '';
  for (const byte of new Uint8Array(buffer)) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/u, '');
};

async function fingerprint(value) {
  return base64Url(
    await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(stableValue(value)))),
  );
}

function permissionProjection(capabilities) {
  return {
    review: capabilities.includes(CAPABILITIES.REQUEST_REVIEW),
    release: capabilities.includes(CAPABILITIES.FULFILL_RELEASE),
    receive: capabilities.includes(CAPABILITIES.FULFILL_RECEIVE),
    admin: capabilities.includes(CAPABILITIES.SYSTEM_ADMIN),
    manageCatalog: capabilities.includes(CAPABILITIES.REFERENCE_CATALOG_MANAGE),
  };
}

function currentUser(account) {
  const authorization = accountAuthorization(account);
  return {
    id: account.id,
    displayName: account.profile?.fullName || account.accessIdNormalized,
    role: authorization.roleId,
    committee: authorization.committees[0]?.name ?? '',
    permissions: permissionProjection(authorization.capabilities),
    scopes: { committee: authorization.committeeIds, organization: [] },
    authorization,
  };
}

function publicUser() {
  return {
    id: 'PUBLIC',
    displayName: 'Requester',
    role: 'REQUESTER',
    committee: '',
    permissions: {
      review: false,
      release: false,
      receive: false,
      admin: false,
      manageCatalog: false,
    },
    scopes: { committee: [], organization: [] },
    authorization: {
      contract: 'canonical-authorization',
      contractVersion: 2,
      modelVersion: 2,
      roleId: 'REQUESTER',
      roleLabel: 'Requester',
      scopeMode: 'SELF',
      committeeIds: [],
      committees: [],
      capabilities: [CAPABILITIES.VIEW_REQUEST, CAPABILITIES.REQUEST_CREATE, CAPABILITIES.LENDING_CREATE],
      mappingStatus: 'MAPPED',
      active: true,
    },
  };
}

const operationalOption = (kind, id, label, purpose = '') => ({
  value: `${kind}:${String(id)
    .toUpperCase()
    .replace(/[^A-Z0-9_.-]+/gu, '_')}`,
  kind,
  id: String(id),
  label: String(label),
  purpose: String(purpose),
  available: true,
});

function publicOperationalContext() {
  const selected = operationalOption('SELF', 'CURRENT', 'My own records', 'Authenticated requester scope');
  return { selected, options: [selected] };
}

async function resolveOperationalContext(db, account, requestedValue = '') {
  const authorization = accountAuthorization(account);
  if (authorization.scopeMode === 'SELF') return publicOperationalContext();

  const [committeeRows, locationRows, seriesRows, eventRows] = await Promise.all([
    rows(db, 'SELECT id, name FROM committees WHERE active = 1 ORDER BY name LIMIT 50'),
    rows(
      db,
      `SELECT DISTINCT storage_location AS id
       FROM inventory_items
       WHERE status = 'ACTIVE' AND trim(storage_location) <> ''
       ORDER BY storage_location LIMIT 50`,
    ),
    rows(db, "SELECT id, name FROM event_series WHERE status = 'ACTIVE' ORDER BY name LIMIT 50"),
    rows(
      db,
      `SELECT id, event_series_id, name, owner_committee_id
       FROM events WHERE active = 1 ORDER BY starts_at, name LIMIT 100`,
    ),
  ]);
  const allScope = authorization.scopeMode === 'ALL';
  const committeeRestricted = allScope && authorization.committeeIds.length > 0;
  const allowedCommitteeIds = new Set(
    allScope && !committeeRestricted ? committeeRows.map((entry) => entry.id) : authorization.committeeIds,
  );
  const visibleCommittees = committeeRows.filter((entry) => allowedCommitteeIds.has(entry.id));
  const allowedEventSeriesIds = new Set(authorization.eventSeriesScopeIds ?? []);
  const allowedEventIds = new Set(authorization.eventScopeIds ?? []);
  const eventRestricted = allowedEventSeriesIds.size > 0 || allowedEventIds.size > 0;
  const visibleEvents = eventRows.filter(
    (entry) =>
      (allScope && !committeeRestricted ? true : allowedCommitteeIds.has(entry.owner_committee_id)) &&
      (!allowedEventSeriesIds.size || allowedEventSeriesIds.has(entry.event_series_id)) &&
      (!allowedEventIds.size || allowedEventIds.has(entry.id)),
  );
  const visibleSeriesIds = new Set(visibleEvents.map((entry) => entry.event_series_id).filter(Boolean));
  const eventVisibilityRestricted = eventRestricted || !allScope || committeeRestricted;
  const visibleSeries = seriesRows.filter(
    (entry) =>
      (!eventVisibilityRestricted || visibleSeriesIds.has(entry.id)) &&
      (!allowedEventSeriesIds.size || allowedEventSeriesIds.has(entry.id)),
  );
  const locationAllowed = allScope || allowedCommitteeIds.has(COMMITTEES.INVENTORY_PANTRY);
  const allowedLocationIds = new Set(authorization.locationScopeIds ?? []);
  const visibleLocations = locationRows.filter(
    (entry) => !allowedLocationIds.size || allowedLocationIds.has(entry.id),
  );
  const boundedScope = committeeRestricted || eventRestricted || allowedLocationIds.size > 0;
  const options = [
    ...(allScope && !boundedScope
      ? [
          operationalOption('ALL', 'AUTHORIZED', 'All authorized operations', 'Global authorized view'),
          operationalOption(
            'OFFICE',
            'NON_EVENT',
            'Office / non-event operations',
            'Requests outside an event',
          ),
        ]
      : []),
    ...visibleCommittees.map((entry) =>
      operationalOption('COMMITTEE', entry.id, entry.name, 'Committee-owned operations'),
    ),
    ...(locationAllowed
      ? visibleLocations.map((entry) =>
          operationalOption('LOCATION', entry.id, entry.id, 'Inventory storage location'),
        )
      : []),
    ...visibleSeries.map((entry) =>
      operationalOption('EVENT_SERIES', entry.id, entry.name, 'Approved event series'),
    ),
    ...visibleEvents.map((entry) => operationalOption('EVENT', entry.id, entry.name, 'Approved sub-event')),
  ];
  const fallback =
    options.find((entry) => entry.kind === 'ALL') ??
    options.find((entry) => entry.kind === 'COMMITTEE' && entry.id === account.defaultCommitteeId) ??
    options[0];
  if (!fallback) {
    throw new ApiError('OPERATIONAL_SCOPE_UNAVAILABLE', 'No authorized operational scope is available.', {
      status: 403,
    });
  }
  const requested = String(requestedValue ?? '').trim();
  const selected =
    requested && requested.toLowerCase() !== 'current'
      ? options.find((entry) => entry.value === requested)
      : fallback;
  if (!selected) {
    throw new ApiError('OPERATIONAL_SCOPE_INVALID', 'The selected operational scope is not authorized.', {
      status: 403,
    });
  }
  return { selected, options };
}

function scopedReleaseGroup(entry, linePredicate) {
  const lineReleases = (entry.lineReleases ?? []).filter(linePredicate);
  const visibleConfirmationIds = new Set(lineReleases.map((line) => line.confirmationId));
  const corrections = (entry.corrections ?? []).filter((correction) =>
    visibleConfirmationIds.has(correction.releaseConfirmationId),
  );
  return {
    ...entry,
    lineReleases,
    corrections,
    correctedQuantity: lineReleases.reduce((total, line) => total + Number(line.correctedQuantity ?? 0), 0),
    correctableQuantity: lineReleases.reduce(
      (total, line) => total + Number(line.correctableQuantity ?? 0),
      0,
    ),
    status: lineReleases.some((line) => line.status === 'PARTIAL') ? 'PARTIAL' : 'COMPLETED',
    updatedAt:
      corrections.reduce(
        (latest, correction) =>
          !latest || correction.correctedAt > latest ? correction.correctedAt : latest,
        '',
      ) ||
      entry.releasedAt ||
      entry.createdAt,
  };
}

export function filterOperationalData(data, selected) {
  if (!selected || ['ALL', 'COMMITTEE', 'SELF'].includes(selected.kind)) return data;
  const next = { ...data };
  if (selected.kind === 'LOCATION') {
    next.inventoryItems = (next.inventoryItems ?? []).filter(
      (entry) => String(entry.storageLocation ?? '') === selected.id,
    );
    const itemIds = new Set(next.inventoryItems.map((entry) => entry.id));
    if (Array.isArray(next.requestLines)) {
      next.requestLines = next.requestLines.filter((entry) => itemIds.has(entry.itemId));
      const requestIds = new Set(next.requestLines.map((entry) => entry.requestId));
      if (Array.isArray(next.requests))
        next.requests = next.requests.filter((entry) => requestIds.has(entry.id));
    }
    if (Array.isArray(next.lendingTickets))
      next.lendingTickets = next.lendingTickets.filter((entry) => itemIds.has(entry.itemId));
    if (Array.isArray(next.releaseConfirmations))
      next.releaseConfirmations = next.releaseConfirmations
        .map((entry) => scopedReleaseGroup(entry, (line) => itemIds.has(line.itemId)))
        .filter((entry) => entry.lineReleases.length > 0);
    ['inventoryAssets', 'inventoryAssetInstances'].forEach((key) => {
      if (Array.isArray(next[key]))
        next[key] = next[key].filter((entry) => itemIds.has(entry.item_id ?? entry.itemId));
    });
    const assetIds = new Set(
      (next.inventoryAssets ?? next.inventoryAssetInstances ?? []).map((entry) => entry.id),
    );
    if (Array.isArray(next.assetMaintenanceHistory))
      next.assetMaintenanceHistory = next.assetMaintenanceHistory.filter((entry) =>
        assetIds.has(entry.asset_id ?? entry.assetId),
      );
    if (Array.isArray(next.assetMovementHistory))
      next.assetMovementHistory = next.assetMovementHistory.filter((entry) =>
        assetIds.has(entry.asset_id ?? entry.assetId),
      );
    if (Array.isArray(next.ledgerTransactions))
      next.ledgerTransactions = next.ledgerTransactions.filter((entry) =>
        itemIds.has(entry.itemId ?? entry.item_id),
      );
    if (Array.isArray(next.reservations))
      next.reservations = next.reservations.filter((entry) => itemIds.has(entry.itemId ?? entry.item_id));
  }
  if (selected.kind === 'EVENT_SERIES') {
    next.eventSeries = (next.eventSeries ?? []).filter((entry) => entry.id === selected.id);
    next.events = (next.events ?? []).filter((entry) => entry.seriesId === selected.id);
    const eventIds = new Set(next.events.map((entry) => entry.id));
    next.requests = (next.requests ?? []).filter((entry) => entry.eventSeriesId === selected.id);
    next.requestLines = (next.requestLines ?? []).filter((entry) => eventIds.has(entry.eventId));
    next.deliverables = (next.deliverables ?? []).filter((entry) => eventIds.has(entry.eventId));
    if (Array.isArray(next.releaseConfirmations))
      next.releaseConfirmations = next.releaseConfirmations.filter((entry) => eventIds.has(entry.eventId));
    if (Array.isArray(next.lendingTickets)) next.lendingTickets = [];
    if (Array.isArray(next.ledgerTransactions))
      next.ledgerTransactions = next.ledgerTransactions.filter((entry) =>
        eventIds.has(entry.eventId ?? entry.event_id),
      );
  }
  if (selected.kind === 'EVENT') {
    next.events = (next.events ?? []).filter((entry) => entry.id === selected.id);
    const seriesIds = new Set(next.events.map((entry) => entry.seriesId));
    next.eventSeries = (next.eventSeries ?? []).filter((entry) => seriesIds.has(entry.id));
    next.requests = (next.requests ?? []).filter((entry) => entry.eventId === selected.id);
    next.requestLines = (next.requestLines ?? []).filter((entry) => entry.eventId === selected.id);
    next.deliverables = (next.deliverables ?? []).filter((entry) => entry.eventId === selected.id);
    if (Array.isArray(next.releaseConfirmations))
      next.releaseConfirmations = next.releaseConfirmations.filter((entry) => entry.eventId === selected.id);
    if (Array.isArray(next.lendingTickets)) next.lendingTickets = [];
    if (Array.isArray(next.ledgerTransactions))
      next.ledgerTransactions = next.ledgerTransactions.filter(
        (entry) => (entry.eventId ?? entry.event_id) === selected.id,
      );
  }
  if (selected.kind === 'OFFICE') {
    next.eventSeries = [];
    next.events = [];
    next.requests = (next.requests ?? []).filter((entry) => !entry.eventId && !entry.eventSeriesId);
    const requestIds = new Set(next.requests.map((entry) => entry.id));
    next.requestLines = (next.requestLines ?? []).filter((entry) => requestIds.has(entry.requestId));
    next.deliverables = (next.deliverables ?? []).filter((entry) => requestIds.has(entry.requestId));
    if (Array.isArray(next.releaseConfirmations))
      next.releaseConfirmations = next.releaseConfirmations.filter((entry) => !entry.eventId);
    if (Array.isArray(next.ledgerTransactions))
      next.ledgerTransactions = next.ledgerTransactions.filter((entry) => !(entry.eventId ?? entry.event_id));
  }
  if (Array.isArray(next.releaseConfirmations) && Array.isArray(next.releaseCorrections)) {
    const visibleConfirmationIds = new Set(
      next.releaseConfirmations.flatMap((entry) =>
        (entry.lineReleases ?? []).map((line) => line.confirmationId),
      ),
    );
    next.releaseCorrections = next.releaseCorrections.filter((entry) =>
      visibleConfirmationIds.has(entry.releaseConfirmationId),
    );
  }
  return next;
}

function assertCapability(account, capability) {
  const authorization = accountAuthorization(account);
  if (
    authorization.active !== true ||
    authorization.mappingStatus !== 'MAPPED' ||
    !authorization.capabilities.includes(capability)
  ) {
    throw new ApiError('CAPABILITY_REQUIRED', 'This action is not authorized.', { status: 403 });
  }
  return authorization;
}

function entityScope(account) {
  const authorization = accountAuthorization(account);
  const selected = account?.operationalContext?.selected;
  if (selected?.kind === 'COMMITTEE') {
    return { mode: 'COMMITTEE', committeeIds: [selected.id], accountId: account.id };
  }
  return {
    mode: authorization.scopeMode,
    committeeIds: authorization.committeeIds,
    accountId: account.id,
  };
}

function assertEntityScope(account, { committeeId = '', ownerAccountId = '' } = {}) {
  const scope = entityScope(account);
  if (scope.mode === 'ALL') return;
  if (scope.mode === 'SELF') {
    if (ownerAccountId && ownerAccountId === scope.accountId) return;
    throw new ApiError('OUT_OF_SCOPE', 'This record is outside your authorized scope.', { status: 403 });
  }
  if (!committeeId) {
    throw new ApiError('ENTITY_SCOPE_REQUIRED', 'The record has no verified committee scope.', {
      status: 403,
    });
  }
  if (!scope.committeeIds.includes(committeeId)) {
    throw new ApiError('OUT_OF_SCOPE', 'This record is outside your authorized committee scope.', {
      status: 403,
    });
  }
}

function ownerCommitteeId(account, requestedCommitteeId = '') {
  const scope = entityScope(account);
  const requested = optionalText(requestedCommitteeId, 80);
  if (scope.mode === 'SELF') return null;
  if (scope.mode === 'ALL') return requested || account.defaultCommitteeId || null;
  const selected = requested || account.defaultCommitteeId || scope.committeeIds[0] || '';
  if (!selected || !scope.committeeIds.includes(selected)) {
    throw new ApiError('OUT_OF_SCOPE', 'The selected committee is outside your authorized scope.', {
      status: 403,
    });
  }
  return selected;
}

function assertBorrowerPortalAccount(account) {
  const authorization = assertCapability(account, CAPABILITIES.LENDING_CREATE);
  if (authorization.roleId !== 'REQUESTER' || account.lendingEligible !== true || !account.institutionId) {
    throw new ApiError(
      'LENDING_ELIGIBILITY_REQUIRED',
      'This account is not eligible to use Office Lending.',
      {
        status: 403,
      },
    );
  }
  return authorization;
}

function assertRequesterPortalAccount(account) {
  const authorization = assertCapability(account, CAPABILITIES.REQUEST_CREATE);
  if (authorization.roleId !== 'REQUESTER' || !account.departmentId || !account.departmentDisplayName) {
    throw new ApiError('REQUESTER_PORTAL_REQUIRED', 'This account cannot use the requester portal.', {
      status: 403,
    });
  }
  return authorization;
}

function scopedWhere(account, { committeeColumn, ownerColumn, alias = '' }) {
  const scope = entityScope(account);
  const prefix = alias ? `${alias}.` : '';
  if (scope.mode === 'ALL') return { sql: '1 = 1', values: [] };
  if (scope.mode === 'SELF') {
    return { sql: `${prefix}${ownerColumn} = ?1`, values: [scope.accountId] };
  }
  if (!scope.committeeIds.length) return { sql: '1 = 0', values: [] };
  const placeholders = scope.committeeIds.map((_, index) => `?${index + 1}`).join(', ');
  return {
    sql: `${prefix}${committeeColumn} IN (${placeholders})`,
    values: scope.committeeIds,
  };
}

function multiScopeWhere(account, { committeeColumns = [], ownerColumns = [] } = {}) {
  const scope = entityScope(account);
  if (scope.mode === 'ALL') return { sql: '1 = 1', values: [] };
  if (scope.mode === 'SELF') {
    if (!ownerColumns.length) return { sql: '1 = 0', values: [] };
    return {
      sql: `(${ownerColumns.map((column) => `${column} = ?1`).join(' OR ')})`,
      values: [scope.accountId],
    };
  }
  if (!scope.committeeIds.length || !committeeColumns.length) return { sql: '1 = 0', values: [] };
  const placeholders = scope.committeeIds.map((_, index) => `?${index + 1}`).join(', ');
  return {
    sql: `(${committeeColumns.map((column) => `${column} IN (${placeholders})`).join(' OR ')})`,
    values: scope.committeeIds,
  };
}

const operationalAuditContexts = new Map();

export function enrichOperationalAuditAfter(after, operationalContext, timestamp, correlationId) {
  if (!operationalContext) return after;
  return {
    ...after,
    operationalContext: {
      ...operationalContext,
      timestamp,
      correlationId,
    },
  };
}

function auditStatement(
  db,
  { action, entityType, entityId, accountId, correlationId, before = {}, after = {} },
) {
  const timestamp = nowIso();
  const operationalContext = operationalAuditContexts.get(correlationId);
  return db
    .prepare(
      `INSERT INTO audit_log (
         id, created_at, action, entity_type, entity_id, actor_account_id,
         before_json, after_json, correlation_id, notes
       ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, '')`,
    )
    .bind(
      createId('AUD'),
      timestamp,
      action,
      entityType,
      entityId,
      accountId,
      JSON.stringify(before),
      JSON.stringify(enrichOperationalAuditAfter(after, operationalContext, timestamp, correlationId)),
      correlationId,
    );
}

function historyStatement(
  db,
  {
    entityType,
    entityId,
    previousStatus = '',
    newStatus,
    accountId,
    idempotencyKey,
    reason = '',
    metadata = {},
  },
) {
  return db
    .prepare(
      `INSERT INTO status_history (
         id, entity_type, entity_id, previous_status, new_status, changed_at,
         changed_by, reason, idempotency_key, metadata_json
       ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)`,
    )
    .bind(
      createId('HIS'),
      entityType,
      entityId,
      previousStatus,
      newStatus,
      nowIso(),
      accountId,
      reason,
      idempotencyKey,
      JSON.stringify(metadata),
    );
}

function eventActivityHistoryStatement(
  db,
  {
    eventSeriesId,
    eventDayId = null,
    eventId = null,
    entityType,
    entityId,
    action,
    before = null,
    after = null,
    reason,
    accountId,
    correlationId,
    idempotencyKey,
  },
) {
  return db
    .prepare(
      `INSERT INTO event_activity_history (
         id, event_series_id, event_day_id, event_id, entity_type, entity_id, action,
         before_json, after_json, reason, actor_account_id, occurred_at, correlation_id,
         idempotency_key
       ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14)`,
    )
    .bind(
      createId('EAH'),
      eventSeriesId,
      eventDayId,
      eventId,
      entityType,
      entityId,
      action,
      before ? JSON.stringify(before) : null,
      after ? JSON.stringify(after) : null,
      reason,
      accountId,
      nowIso(),
      correlationId,
      idempotencyKey,
    );
}

function revisionStatements(db, scopes, timestamp = nowIso()) {
  return [...new Set(['global', 'overview', ...scopes])].map((scope) =>
    db
      .prepare('UPDATE data_revisions SET revision = revision + 1, updated_at = ?2 WHERE scope = ?1')
      .bind(scope, timestamp),
  );
}

async function replay(db, scope, key, actorId, command) {
  const idempotencyKey = requiredText(key, 'clientRequestId', 128);
  const requestFingerprint = await fingerprint(command);
  const prior = await db
    .prepare(
      `SELECT actor_account_id, request_fingerprint, result_json
       FROM idempotency_keys
       WHERE scope = ?1 AND idempotency_key = ?2`,
    )
    .bind(scope, idempotencyKey)
    .first();
  if (prior) {
    if (prior.actor_account_id !== actorId || prior.request_fingerprint !== requestFingerprint) {
      throw new ApiError('IDEMPOTENCY_CONFLICT', 'The retry key was already used for another mutation.', {
        status: 409,
      });
    }
    return { replayed: true, value: JSON.parse(prior.result_json), key: idempotencyKey };
  }
  return { replayed: false, fingerprint: requestFingerprint, key: idempotencyKey };
}

function idempotencyStatement(db, scope, replayState, actorId, result) {
  return db
    .prepare(
      `INSERT INTO idempotency_keys (
         scope, idempotency_key, actor_account_id, request_fingerprint, result_json, created_at
       ) VALUES (?1, ?2, ?3, ?4, ?5, ?6)`,
    )
    .bind(scope, replayState.key, actorId, replayState.fingerprint, JSON.stringify(result), nowIso());
}

function pageInput(command = {}) {
  const page = Math.max(1, Math.floor(Number(command.page) || 1));
  const pageSize = Math.min(50, Math.max(1, Math.floor(Number(command.pageSize) || 10)));
  return { page, pageSize, offset: (page - 1) * pageSize };
}

async function rows(db, sql, bindings = []) {
  const statement = db.prepare(sql);
  return (await (bindings.length ? statement.bind(...bindings) : statement).all()).results;
}

const INVENTORY_CLASSIFICATION_ROLES = new Set(['SYSTEM_OWNER', 'ADMINISTRATOR', 'DIRECTOR']);
const INVENTORY_KINDS = new Set(['UNVERIFIED', 'REUSABLE', 'CONSUMABLE']);
const CLASSIFICATION_STATUSES = new Set(['NEEDS_CLASSIFICATION', 'CLASSIFIED']);
const INVENTORY_HANDLING = new Set([
  'CONSUMABLE',
  'LOANABLE',
  'REUSABLE_ASSET',
  'NON_CIRCULATING',
  'TO_CLASSIFY',
]);
const INVENTORY_CATALOG_TYPES = new Set(['OFFICE_INVENTORY', 'PANTRY', 'EVENT_SPECIFIC']);
const INVENTORY_STATUSES = new Set(['ACTIVE', 'VERIFY', 'INACTIVE']);
const CONDITION_REVIEW_STATES = new Set([
  'NOT_ASSESSED',
  'NOT_APPLICABLE',
  'NEW',
  'GOOD',
  'FAIR',
  'POOR',
  'DAMAGED',
]);
const MAINTENANCE_REVIEW_STATES = new Set([
  'NOT_ASSESSED',
  'NOT_APPLICABLE',
  'CLEARED',
  'MAINTENANCE_REQUIRED',
]);
const LENDING_AUDIENCES = new Set([
  'NOT_AVAILABLE_FOR_LENDING',
  'USC_STAFF_ONLY',
  'STUDENTS_AND_STAFF',
  'DOL_INTERNAL_ONLY',
]);

const normalizedCatalogEnum = (value, allowed, field, fallback = '') => {
  const normalized = String(value ?? fallback)
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/gu, '_');
  if (!allowed.has(normalized)) {
    throw new ApiError('VALIDATION_FAILED', `${field} is not supported.`, {
      details: { field, value: String(value ?? '') },
    });
  }
  return normalized;
};

const normalizedHandling = (value) => {
  const normalized = String(value ?? '')
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/gu, '_');
  const aliased =
    { REUSABLE: 'REUSABLE_ASSET', REUSABLEASSET: 'REUSABLE_ASSET', NONCIRCULATING: 'NON_CIRCULATING' }[
      normalized
    ] ?? normalized;
  return normalizedCatalogEnum(aliased, INVENTORY_HANDLING, 'handling');
};

const normalizedAliases = (value) => {
  const aliases = (Array.isArray(value) ? value : String(value ?? '').split(/[|,]/u))
    .map((alias) => String(alias).normalize('NFKC').trim().replace(/\s+/gu, ' '))
    .filter(Boolean);
  if (aliases.length > 24 || aliases.some((alias) => alias.length > 120)) {
    throw new ApiError('VALIDATION_FAILED', 'Aliases are limited to 24 values of 120 characters each.');
  }
  const unique = new Map();
  for (const alias of aliases) unique.set(alias.toLocaleLowerCase('en-US'), alias);
  return [...unique.entries()].map(([normalizedAlias, displayAlias]) => ({
    normalizedAlias,
    displayAlias,
  }));
};

const optionalPositiveInteger = (value, field) => {
  if (value === '' || value === null || value === undefined) return null;
  const number = Number(value);
  if (!Number.isInteger(number) || number < 1) {
    throw new ApiError('VALIDATION_FAILED', `${field} must be a positive integer.`, {
      details: { field },
    });
  }
  return number;
};

const booleanInput = (value, fallback = false) => {
  if (value === '' || value === null || value === undefined) return fallback;
  if (value === true || value === 1 || String(value).toLowerCase() === 'true') return true;
  if (value === false || value === 0 || String(value).toLowerCase() === 'false') return false;
  throw new ApiError('VALIDATION_FAILED', 'A boolean catalog value is invalid.');
};

function assertInventoryClassificationAccess(account) {
  assertCapability(account, CAPABILITIES.INVENTORY_CLASSIFY);
  const authorization = accountAuthorization(account);
  if (
    !INVENTORY_CLASSIFICATION_ROLES.has(authorization.roleId) &&
    !authorization.committeeIds.includes(COMMITTEES.INVENTORY_PANTRY)
  ) {
    throw new ApiError(
      'INVENTORY_CLASSIFICATION_FORBIDDEN',
      'Inventory classification is limited to authorized Inventory, Administrator, Director, and System Owner users.',
      { status: 403 },
    );
  }
}

function classificationEnum(value, allowed, field, fallback = '') {
  const normalized = String(value ?? fallback)
    .trim()
    .toUpperCase();
  if (!allowed.has(normalized)) {
    throw new ApiError('VALIDATION_FAILED', `Choose an approved ${field}.`, {
      details: { field },
    });
  }
  return normalized;
}

const itemDto = (row, requestOnly = false) => ({
  id: row.id,
  name: row.name,
  aliases: row.aliases ? String(row.aliases).split('|').filter(Boolean) : [],
  category: row.category,
  stockArea: requestOnly ? '' : row.stock_area,
  handling: row.handling,
  unit: row.unit,
  ...(requestOnly
    ? {}
    : {
        onHand: Number(row.on_hand ?? 0),
        reserved: Number(row.reserved ?? 0),
        availableToPromise: Number(row.available_to_promise ?? 0),
        storageLocation: row.storage_location,
        reorderThreshold: Number(row.reorder_threshold ?? 0),
      }),
  status: row.status,
  catalogType: row.catalog_type,
  lendingAudience: row.lending_audience,
  isLendable: row.is_lendable === 1,
  lendingKind: row.lending_kind,
  lendingStatus: row.lending_status,
  lendingUnit: row.lending_unit || row.unit,
  defaultLoanDays: row.default_loan_days,
  maximumLoanQuantity: row.maximum_loan_quantity,
  dueDateRequired: row.due_date_required === 1,
  acknowledgmentRequired: row.acknowledgment_required === 1,
  eligibilityRule: row.eligibility_rule,
  lendingHandlingNotes: row.lending_handling_notes,
  borrowerSafeDescription: row.borrower_safe_description,
  borrowerSafeRestrictions: row.borrower_safe_restrictions,
  imageUrl: row.image_asset_key ? `/brand/catalog/${encodeURIComponent(row.image_asset_key)}` : '',
  conditionTracked: row.condition_tracking === 1,
  approvalRequired: row.approval_required === 1,
  updatedAt: row.updated_at,
  ...(requestOnly
    ? {}
    : {
        readyToClaim: Number(row.ready_to_claim ?? 0),
        onLoan: Number(row.on_loan ?? 0),
        overdue: Number(row.overdue ?? 0),
        damaged: Number(row.damaged_assets ?? 0),
        maintenance: Number(row.maintenance_assets ?? 0),
        expectedReturnAt: row.expected_return_at ?? null,
        traceableAssets: Number(row.traceable_assets ?? 0),
        availableAssets: Number(row.available_assets ?? 0),
        lendableAvailable: Number(row.lendable_available ?? 0),
        inventoryKind: row.inventory_kind ?? 'UNVERIFIED',
        classificationStatus: row.classification_status ?? 'NEEDS_CLASSIFICATION',
        conditionReviewState: row.condition_review_state ?? 'NOT_ASSESSED',
        maintenanceReviewState: row.maintenance_review_state ?? 'NOT_ASSESSED',
        classificationNotes: row.classification_notes ?? '',
        classificationEvidenceId: row.classification_evidence_id ?? '',
        classificationRevision: Number(row.classification_revision ?? 1),
        classifiedAt: row.classified_at ?? null,
        classifiedBy: row.classified_by ?? null,
      }),
});

const requestDto = (row) => ({
  id: row.id,
  type: row.request_type,
  stage: row.request_stage,
  parentRequestId: row.parent_request_id,
  eventSeriesId: row.event_series_id,
  eventDayId: row.event_day_id,
  eventId: row.event_id,
  ownerCommitteeId: row.owner_committee_id,
  catalogType: row.catalog_type,
  department: row.department,
  priority: row.priority,
  purpose: row.purpose,
  status: row.status,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const parseJsonArray = (value) => {
  try {
    const parsed = JSON.parse(value || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const parseHistoryMetadata = (value) => {
  try {
    const parsed = JSON.parse(value || '{}');
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
};

const canvassDto = (row) => {
  const preferredMetadata = parseHistoryMetadata(row.preferred_metadata_json);
  return {
    id: row.id,
    linkedLineIds: row.linked_request_line_id ? [row.linked_request_line_id] : [],
    linkedDeliverableId: row.linked_deliverable_id ?? '',
    linkedRestockId: row.linked_restock_id ?? '',
    supplierId: row.supplier_id ?? '',
    supplierName: row.supplier_name,
    location: row.supplier_location ?? '',
    itemSpec: row.item_spec,
    price: Number(row.price ?? 0),
    unit: row.unit,
    receiptStatus: row.receipt_status,
    reliability: row.reliability,
    checkedAt: row.checked_at,
    sourceUrl: row.source_url,
    evidenceId: row.evidence_id ?? '',
    preferred: row.preferred === 1,
    preferredRationale: row.preferred === 1 ? (preferredMetadata.rationale ?? '') : '',
    status: row.status,
    priceHistory: parseJsonArray(row.price_history_json),
    notes: row.notes,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by,
  };
};

const deliverableDto = (row) => ({
  id: row.id,
  requestId: row.request_id,
  requestLineId: row.request_line_id,
  eventSeriesId: row.event_series_id ?? '',
  eventId: row.event_id ?? '',
  itemId: row.inventory_match_id ?? '',
  inventoryMatchId: row.inventory_match_id ?? '',
  eventItemId: row.event_item_id ?? '',
  itemSpec: row.item_spec,
  quantity: Number(row.quantity_requested ?? 0),
  quantityReceived: Number(row.quantity_received ?? 0),
  quantityReleased: Number(row.quantity_released ?? 0),
  unit: row.unit,
  fulfillmentSource: row.fulfillment_source ?? '',
  assignedCommittee: row.assigned_committee_id ?? '',
  assignedStaff: row.assigned_account_id ?? '',
  linkedCanvassIds: String(row.linked_canvass_ids ?? '')
    .split('|')
    .filter(Boolean),
  preferredCanvassId: row.preferred_canvass_id ?? '',
  budgetStatus: row.budget_status ?? '',
  procurementStatus: row.procurement_status ?? '',
  receiptStatus: row.receipt_status ?? '',
  evidenceId: row.evidence_id ?? '',
  neededAt: row.needed_at ?? '',
  status: row.status,
  notes: row.notes ?? '',
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  createdBy: row.created_by ?? '',
});

const eventActivityDto = (row) => ({
  id: row.id,
  code: row.code || '',
  seriesId: row.event_series_id,
  eventDayId: row.event_day_id,
  name: row.name,
  activityType: row.activity_type || '',
  includedItems: parseJsonArray(row.included_items_json),
  timeStatus: row.time_status || (row.starts_at ? 'SCHEDULED' : 'TBA'),
  startAt: row.starts_at,
  endAt: row.ends_at,
  venue: row.venue,
  responsibleCommitteeId: row.owner_committee_id,
  responsibleCommitteeName: row.responsible_committee_name || null,
  supportingCommitteeIds: parseJsonArray(row.supporting_committees_json),
  preparationDeadline: row.preparation_deadline,
  requestWindowOpensAt: row.request_window_opens_at,
  requestWindowClosesAt: row.request_window_closes_at,
  releaseDeadline: row.release_deadline,
  readinessPercentage:
    row.readiness_percentage === null || row.readiness_percentage === undefined
      ? null
      : Number(row.readiness_percentage),
  preparationProgress:
    row.preparation_progress === null || row.preparation_progress === undefined
      ? null
      : Number(row.preparation_progress),
  status: row.status,
  ownerReviewStatus: row.owner_review_status || 'OWNER_REVIEW_REQUIRED',
  notes: row.notes || null,
  sourceReference: row.source_reference || null,
  revision: Number(row.revision || 1),
  active: row.active === 1,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  updatedBy: row.updated_by || row.created_by || null,
});

const lineDto = (row) => ({
  id: row.id,
  requestId: row.request_id,
  eventId: row.event_id,
  itemId: row.item_id,
  description: row.description,
  specification: row.specification,
  category: row.category,
  quantity: Number(row.requested_quantity),
  unit: row.unit,
  fulfillmentSource: row.fulfillment_source,
  neededAt: row.needed_at,
  returnDue: row.return_due_at,
  releasedQuantity: Number(row.released_quantity),
  receivedQuantity: Number(row.received_quantity),
  status: row.status,
  workflowRevision: Number(row.workflow_revision),
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const releaseCorrectionDto = (row) => ({
  id: row.id,
  releaseGroupId: row.release_group_id,
  releaseConfirmationId: row.release_confirmation_id,
  quantity: Number(row.quantity),
  reason: row.reason,
  evidenceId: row.evidence_id,
  transactionId: row.ledger_transaction_id,
  correctedBy: row.corrected_by,
  correctedAt: row.corrected_at,
  status: row.status,
});

function releaseConfirmationDtos(confirmationRows, correctionRows) {
  const correctionsByConfirmation = new Map();
  correctionRows.forEach((row) => {
    const correction = releaseCorrectionDto(row);
    const existing = correctionsByConfirmation.get(correction.releaseConfirmationId) ?? [];
    existing.push(correction);
    correctionsByConfirmation.set(correction.releaseConfirmationId, existing);
  });
  const groups = new Map();
  confirmationRows.forEach((row) => {
    const releaseGroupId = row.release_group_id || row.id;
    const corrections = correctionsByConfirmation.get(row.id) ?? [];
    const correctedQuantity = corrections.reduce((sum, entry) => sum + entry.quantity, 0);
    const line = {
      confirmationId: row.id,
      requestLineId: row.request_line_id,
      itemId: row.item_id,
      quantity: Number(row.quantity),
      correctedQuantity,
      correctableQuantity: Math.max(0, Number(row.quantity) - correctedQuantity),
      unit: row.unit,
      status: row.status,
      corrections,
    };
    const existing = groups.get(releaseGroupId);
    if (existing) {
      existing.lineReleases.push(line);
      existing.corrections.push(...corrections);
      existing.correctedQuantity += correctedQuantity;
      existing.correctableQuantity += line.correctableQuantity;
      if (row.status === 'PARTIAL') existing.status = 'PARTIAL';
      return;
    }
    groups.set(releaseGroupId, {
      id: releaseGroupId,
      requestId: row.request_id,
      eventId: row.event_id,
      lendingTicketId: row.lending_ticket_id,
      recipientName: row.recipient_name,
      recipientRole: row.recipient_role,
      department: row.department,
      lineReleases: [line],
      notes: row.notes,
      releasedAt: row.released_at,
      releasedBy: row.released_by,
      evidenceId: row.evidence_id,
      status: row.status === 'PARTIAL' ? 'PARTIAL' : 'COMPLETED',
      corrections: [...corrections],
      correctedQuantity,
      correctableQuantity: line.correctableQuantity,
      createdAt: row.released_at,
      updatedAt: corrections.at(-1)?.correctedAt ?? row.released_at,
    });
  });
  return [...groups.values()];
}

async function revision(db, scope = 'global') {
  const value = await db
    .prepare('SELECT revision, updated_at FROM data_revisions WHERE scope = ?1')
    .bind(scope)
    .first();
  return { revision: Number(value?.revision ?? 0), updatedAt: value?.updated_at ?? '' };
}

export function createD1OperationalService({
  db,
  environment = 'DEVELOPMENT',
  appVersion = '0.7.0',
  schemaVersion = '1.0.0',
  evidenceStore = null,
}) {
  if (!db) throw new Error('D1 database binding is required.');

  async function essential({ account, requestOnly = false, command = {}, correlationId }) {
    const user = requestOnly ? publicUser() : currentUser(account);
    const operationalContext = requestOnly
      ? publicOperationalContext()
      : await resolveOperationalContext(db, account, command.operationalScope);
    const capabilities = user.authorization.capabilities;
    const activeModule =
      requestOnly || !capabilities.includes(CAPABILITIES.VIEW_INTERNAL) ? 'request' : 'overview';
    const navigation = MODULES.map((id) => ({
      id,
      label: {
        overview: 'Overview',
        request: 'Request Center',
        lending: 'Lending Hub',
        release: 'Release Desk',
        restocking: 'Restocking',
        procurement: 'Procurement',
        inventory: 'Inventory',
      }[id],
      enabled: requestOnly ? id === 'request' : capabilities.includes(MODULE_CAPABILITIES[id]),
    }));
    return {
      ok: true,
      correlationId,
      contract: 'essential-bootstrap',
      contractVersion: 2,
      appVersion,
      schemaVersion,
      backendMode: 'rest',
      environment,
      requestOnly,
      activeModule,
      currentUser: user,
      operationalContext,
      navigation,
      moduleConfig: {
        maxPageSize: 50,
        defaultPageSize: 10,
        legacyEndpointAvailable: false,
        activeModuleOnly: true,
      },
      revision: await revision(db),
      metrics: { readCount: 2, cacheHits: 0 },
    };
  }

  async function bootstrapModule({ account, requestOnly = false, command = {}, correlationId }) {
    const module = requiredText(command.module, 'module', 32).toLowerCase();
    if (!MODULES.includes(module) || (requestOnly && module !== 'request')) {
      throw new ApiError('MODULE_NOT_FOUND', 'The requested workspace module is not available.', {
        status: 404,
      });
    }
    if (!requestOnly) assertCapability(account, MODULE_CAPABILITIES[module]);
    const operationalContext = requestOnly
      ? publicOperationalContext()
      : await resolveOperationalContext(db, account, command.operationalScope);
    if (!requestOnly) account = { ...account, operationalContext };
    const page = pageInput(command);
    const itemSql = `SELECT item.*, availability.on_hand, availability.reserved,
      availability.available_to_promise, availability.ready_to_claim, availability.on_loan,
      availability.overdue, availability.expected_return_at, availability.traceable_assets,
      availability.available_assets, availability.damaged_assets, availability.maintenance_assets,
      availability.lendable_available,
      (SELECT GROUP_CONCAT(display_alias, '|') FROM item_aliases alias WHERE alias.item_id = item.id) AS aliases
      FROM inventory_items item
      JOIN lending_catalog_availability availability ON availability.item_id = item.id
      WHERE item.status = 'ACTIVE' ORDER BY item.name LIMIT ?1 OFFSET ?2`;
    let itemRows = await rows(db, itemSql, [page.pageSize, page.offset]);
    let data;
    if (module === 'request') {
      const eventScope = requestOnly
        ? { sql: '1 = 1', values: [] }
        : multiScopeWhere(account, { committeeColumns: ['event.owner_committee_id'] });
      const eventLimitIndex = eventScope.values.length + 1;
      const eventRows = await rows(
        db,
        `SELECT event.* FROM events event
         JOIN event_days event_day ON event_day.id = event.event_day_id
         WHERE event.active = 1 AND event_day.active = 1 AND ${eventScope.sql}
         ORDER BY event.starts_at DESC LIMIT ?${eventLimitIndex} OFFSET ?${eventLimitIndex + 1}`,
        [...eventScope.values, page.pageSize, page.offset],
      );
      data = {
        eventSeries: await rows(
          db,
          "SELECT id, code, name, status FROM event_series WHERE status = 'ACTIVE' ORDER BY name LIMIT 50",
        ),
        eventDays: await rows(
          db,
          `SELECT id, event_series_id AS seriesId, name, event_date AS date, status
           FROM event_days WHERE active = 1 ORDER BY event_date LIMIT 100`,
        ),
        events: eventRows.map((row) => ({
          id: row.id,
          seriesId: row.event_series_id,
          name: row.name,
          startAt: row.starts_at,
          endAt: row.ends_at,
          eventDayId: row.event_day_id,
          activityType: row.activity_type,
          timeStatus: row.time_status,
          ...(requestOnly ? {} : { venue: row.venue }),
          status: row.status,
        })),
        inventoryItems: itemRows.map((row) => itemDto(row, requestOnly)),
      };
    } else if (module === 'inventory') {
      itemRows = await rows(
        db,
        `SELECT item.*, availability.on_hand, availability.reserved,
           availability.available_to_promise, availability.ready_to_claim, availability.on_loan,
           availability.overdue, availability.expected_return_at, availability.traceable_assets,
           availability.available_assets, availability.damaged_assets, availability.maintenance_assets,
           availability.lendable_available,
           (SELECT GROUP_CONCAT(display_alias, '|') FROM item_aliases alias WHERE alias.item_id = item.id) AS aliases
         FROM inventory_items item
         JOIN lending_catalog_availability availability ON availability.item_id = item.id
         WHERE item.status = 'ACTIVE'
         ORDER BY item.name, item.id`,
      );
      const classificationHistoryRows = await rows(
        db,
        `SELECT history.id, history.item_id, history.revision, history.previous_status,
           history.new_status, history.previous_kind, history.new_kind, history.lendable_enabled,
           history.lending_audience, history.condition_review_state,
           history.maintenance_review_state, history.asset_instance_count,
           history.classification_notes, history.evidence_id, history.bulk_group_id,
           history.occurred_at, history.actor_account_id, history.correlation_id
         FROM inventory_classification_history history
         JOIN inventory_items item ON item.id = history.item_id
         WHERE item.status = 'ACTIVE'
         ORDER BY history.occurred_at DESC, history.id DESC
         LIMIT 500`,
      );
      const classificationHistoryByItem = new Map();
      for (const entry of classificationHistoryRows) {
        if (!classificationHistoryByItem.has(entry.item_id))
          classificationHistoryByItem.set(entry.item_id, []);
        classificationHistoryByItem.get(entry.item_id).push({
          id: entry.id,
          revision: Number(entry.revision),
          previousStatus: entry.previous_status,
          newStatus: entry.new_status,
          previousKind: entry.previous_kind,
          newKind: entry.new_kind,
          isLendable: entry.lendable_enabled === 1,
          lendingAudience: entry.lending_audience,
          conditionReviewState: entry.condition_review_state,
          maintenanceReviewState: entry.maintenance_review_state,
          assetInstanceCount: Number(entry.asset_instance_count),
          classificationNotes: entry.classification_notes,
          evidenceId: entry.evidence_id,
          bulkGroupId: entry.bulk_group_id,
          occurredAt: entry.occurred_at,
          actorAccountId: entry.actor_account_id,
          correlationId: entry.correlation_id,
        });
      }
      data = {
        inventoryItems: itemRows.map((row) => ({
          ...itemDto(row),
          assetInstanceCount: Number(row.traceable_assets ?? 0),
          classificationHistory: classificationHistoryByItem.get(row.id) ?? [],
        })),
        inventoryAssets: await rows(
          db,
          `SELECT id, item_id, asset_tag, serial_number, condition_label, lifecycle_status,
                  current_lending_ticket_id, expected_return_at, handoff_condition, return_condition,
                  created_at, updated_at
           FROM inventory_asset_instances
           ORDER BY item_id, asset_tag LIMIT 100`,
        ),
        assetMaintenanceHistory: await rows(
          db,
          `SELECT id, asset_id, event_type, condition_label, evidence_asset_key,
                  occurred_at, recorded_by, notes
           FROM inventory_asset_maintenance
           ORDER BY occurred_at DESC LIMIT 100`,
        ),
        assetMovementHistory: await rows(
          db,
          `SELECT id, asset_id, movement_type, previous_status, new_status,
                  lending_ticket_id, condition_label, evidence_asset_key,
                  occurred_at, recorded_by, notes
           FROM inventory_asset_movements
           ORDER BY occurred_at DESC LIMIT 100`,
        ),
        ledgerTransactions: (
          await rows(
            db,
            `SELECT id, transaction_type, direction, item_id, event_item_id, quantity, unit,
                    related_entity_type, related_entity_id, request_id, event_id, reversal_of,
                    status, notes, created_at
             FROM inventory_ledger
             ORDER BY created_at DESC, id DESC
             LIMIT 500`,
          )
        ).map((row) => ({
          id: row.id,
          type: row.transaction_type,
          transactionType: row.transaction_type,
          direction: row.direction,
          itemId: row.item_id,
          eventItemId: row.event_item_id,
          quantity: Number(row.quantity),
          unit: row.unit,
          relatedEntityType: row.related_entity_type,
          relatedId: row.related_entity_id,
          requestId: row.request_id,
          eventId: row.event_id,
          reversalOf: row.reversal_of,
          status: row.status,
          notes: row.notes,
          createdAt: row.created_at,
        })),
        reservations: (
          await rows(
            db,
            `SELECT id, item_id, quantity, unit, request_line_id, lending_ticket_id,
                    status, cleared_at, clear_reason, notes, created_at, updated_at, created_by
             FROM reservations
             ORDER BY created_at DESC, id DESC
             LIMIT 500`,
          )
        ).map((row) => ({
          id: row.id,
          itemId: row.item_id,
          quantity: Number(row.quantity),
          unit: row.unit,
          requestLineId: row.request_line_id,
          lendingTicketId: row.lending_ticket_id,
          status: row.status,
          clearedAt: row.cleared_at,
          clearReason: row.clear_reason,
          notes: row.notes,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          createdBy: row.created_by,
        })),
      };
    } else if (module === 'lending') {
      const scope = scopedWhere(account, {
        committeeColumn: 'owner_committee_id',
        ownerColumn: 'created_by',
        alias: 'ticket',
      });
      const limitIndex = scope.values.length + 1;
      const tickets = await rows(
        db,
        `SELECT ticket.*,
                COALESCE(submission.course_year, public_request.course_year, '') AS course_year,
                COALESCE(submission.email, public_request.email, '') AS borrower_email,
                COALESCE(submission.contact_number, public_request.contact_number, ticket.contact) AS contact_number,
                COALESCE(submission.position_role, '') AS position_role
         FROM lending_tickets ticket
         LEFT JOIN public_lending_submission_tickets submission_link
           ON submission_link.lending_ticket_id = ticket.id
         LEFT JOIN public_lending_submissions submission
           ON submission.id = submission_link.public_lending_submission_id
         LEFT JOIN public_lending_request_tickets public_link
           ON public_link.lending_ticket_id = ticket.id
         LEFT JOIN public_lending_requests public_request
           ON public_request.id = public_link.public_lending_request_id
         WHERE ${scope.sql}
         ORDER BY ticket.updated_at DESC LIMIT ?${limitIndex} OFFSET ?${limitIndex + 1}`,
        [...scope.values, page.pageSize, page.offset],
      );
      const availableAssets = await rows(
        db,
        `SELECT id, item_id, asset_tag, serial_number, condition_label, lifecycle_status
         FROM inventory_asset_instances
         WHERE lifecycle_status = 'AVAILABLE' AND current_lending_ticket_id IS NULL
         ORDER BY item_id, asset_tag, id`,
      );
      const ticketHistory = await rows(
        db,
        `SELECT history.entity_id, history.previous_status, history.new_status,
                history.changed_at, history.changed_by, history.reason, history.metadata_json
         FROM status_history history
         JOIN lending_tickets ticket ON ticket.id = history.entity_id
         WHERE history.entity_type = 'LENDING' AND ${scope.sql}
         ORDER BY history.changed_at, history.id`,
        scope.values,
      );
      data = {
        inventoryItems: itemRows.map((row) => itemDto(row)),
        lendingTickets: tickets.map((row) => ({
          id: row.id,
          itemId: row.item_id,
          requestedItemId: row.requested_item_id ?? row.item_id,
          quantity: Number(row.quantity),
          requestedQuantity: Number(row.requested_quantity ?? row.quantity),
          unit: row.unit,
          studentIdNumber: row.borrower_reference,
          borrowerName: row.borrower_name,
          borrowerType: row.borrower_type,
          department: row.department_organization,
          contact: row.contact_number || row.contact,
          email: row.borrower_email || '',
          courseYear: row.course_year || '',
          positionRole: row.position_role || '',
          purpose: row.purpose,
          dueAt: row.due_at,
          requestedStartAt: row.requested_start_at,
          requestedEndAt: row.requested_end_at,
          ticketType: row.ticket_type,
          status: row.status,
          reviewDecision: row.review_decision,
          reviewNotes: row.review_notes,
          rejectionReason: row.rejection_reason,
          substitutionNote: row.substitution_note,
          eligibilitySource: row.eligibility_source,
          eligibilityReviewedBy: row.eligibility_reviewed_by,
          eligibilityReviewedAt: row.eligibility_reviewed_at,
          assetOptions: availableAssets.map((asset) => ({
            id: asset.id,
            itemId: asset.item_id,
            assetTag: asset.asset_tag,
            serialNumber: asset.serial_number,
            condition: asset.condition_label,
            status: asset.lifecycle_status,
          })),
          history: ticketHistory
            .filter((entry) => entry.entity_id === row.id)
            .map((entry) => ({
              previousStatus: entry.previous_status,
              newStatus: entry.new_status,
              changedAt: entry.changed_at,
              changedBy: entry.changed_by,
              reason: entry.reason,
              metadata: parseHistoryMetadata(entry.metadata_json),
            })),
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        })),
      };
    } else {
      const requestScope = scopedWhere(account, {
        committeeColumn: 'owner_committee_id',
        ownerColumn: 'requester_account_id',
        alias: 'request',
      });
      const limitIndex = requestScope.values.length + 1;
      const requestRows = await rows(
        db,
        `SELECT request.* FROM requests request WHERE ${requestScope.sql}
         ORDER BY request.updated_at DESC LIMIT ?${limitIndex} OFFSET ?${limitIndex + 1}`,
        [...requestScope.values, page.pageSize, page.offset],
      );
      const requestLines = await rows(
        db,
        `SELECT line.* FROM request_lines line
         JOIN requests request ON request.id = line.request_id
         WHERE ${requestScope.sql}
         ORDER BY line.updated_at DESC LIMIT ?${limitIndex} OFFSET ?${limitIndex + 1}`,
        [...requestScope.values, page.pageSize, page.offset],
      );
      if (module === 'release') {
        const releaseScope = multiScopeWhere(account, {
          committeeColumns: ['request.owner_committee_id', 'ticket.owner_committee_id'],
          ownerColumns: ['request.requester_account_id', 'ticket.created_by'],
        });
        const releaseLimitIndex = releaseScope.values.length + 1;
        const confirmationRows = await rows(
          db,
          `SELECT confirmation.* FROM release_confirmations confirmation
           LEFT JOIN requests request ON request.id = confirmation.request_id
           LEFT JOIN lending_tickets ticket ON ticket.id = confirmation.lending_ticket_id
           WHERE ${releaseScope.sql}
           ORDER BY confirmation.released_at DESC
           LIMIT ?${releaseLimitIndex} OFFSET ?${releaseLimitIndex + 1}`,
          [...releaseScope.values, page.pageSize, page.offset],
        );
        const confirmationIds = confirmationRows.map((entry) => entry.id);
        const correctionRows = confirmationIds.length
          ? await rows(
              db,
              `SELECT correction.* FROM release_corrections correction
               WHERE correction.release_confirmation_id IN (${confirmationIds
                 .map((_, index) => `?${index + 1}`)
                 .join(', ')})
               ORDER BY correction.corrected_at`,
              confirmationIds,
            )
          : [];
        const eventScope = multiScopeWhere(account, {
          committeeColumns: ['event.owner_committee_id'],
        });
        const eventLimitIndex = eventScope.values.length + 1;
        const eventRows = await rows(
          db,
          `SELECT event.* FROM events event
           JOIN event_days event_day ON event_day.id = event.event_day_id
           WHERE event.active = 1 AND event_day.active = 1 AND ${eventScope.sql}
           ORDER BY event.starts_at, event.name
           LIMIT ?${eventLimitIndex}`,
          [...eventScope.values, 100],
        );
        const lendingScope = scopedWhere(account, {
          committeeColumn: 'owner_committee_id',
          ownerColumn: 'created_by',
          alias: 'ticket',
        });
        const lendingLimitIndex = lendingScope.values.length + 1;
        const lendingRows = await rows(
          db,
          `SELECT ticket.* FROM lending_tickets ticket
           WHERE ticket.status = 'READY_TO_CLAIM' AND ${lendingScope.sql}
           ORDER BY ticket.updated_at
           LIMIT ?${lendingLimitIndex}`,
          [...lendingScope.values, page.pageSize],
        );
        data = {
          eventSeries: await rows(
            db,
            "SELECT id, code, name, status FROM event_series WHERE status = 'ACTIVE' ORDER BY name LIMIT 50",
          ),
          events: eventRows.map((row) => ({
            id: row.id,
            seriesId: row.event_series_id,
            name: row.name,
            startAt: row.starts_at,
            endAt: row.ends_at,
            venue: row.venue,
            status: row.status,
          })),
          inventoryItems: itemRows.map((row) => itemDto(row)),
          requests: requestRows.map(requestDto),
          requestLines: requestLines.map(lineDto),
          lendingTickets: lendingRows.map((row) => ({
            id: row.id,
            itemId: row.item_id,
            quantity: Number(row.quantity),
            unit: row.unit,
            studentIdNumber: row.borrower_reference,
            borrowerName: row.borrower_name,
            borrowerType: row.borrower_type,
            department: row.department_organization,
            contact: row.contact,
            purpose: row.purpose,
            dueAt: row.due_at,
            ticketType: row.ticket_type,
            status: row.status,
            ownerCommitteeId: row.owner_committee_id,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
          })),
          releaseConfirmations: releaseConfirmationDtos(confirmationRows, correctionRows),
          releaseCorrections: correctionRows.map(releaseCorrectionDto),
        };
      } else if (module === 'restocking') {
        const restockScope = scopedWhere(account, {
          committeeColumn: 'assigned_committee_id',
          ownerColumn: 'created_by',
          alias: 'restock',
        });
        const restockLimitIndex = restockScope.values.length + 1;
        data = {
          inventoryItems: itemRows.map((row) => itemDto(row)),
          restockRequests: await rows(
            db,
            `SELECT restock.* FROM restock_requests restock WHERE ${restockScope.sql}
             ORDER BY restock.updated_at DESC
             LIMIT ?${restockLimitIndex} OFFSET ?${restockLimitIndex + 1}`,
            [...restockScope.values, page.pageSize, page.offset],
          ),
          restockRecords: await rows(
            db,
            `SELECT receipt.* FROM restock_receipts receipt
             JOIN restock_requests restock ON restock.id = receipt.restock_request_id
             WHERE ${restockScope.sql} ORDER BY receipt.received_at DESC
             LIMIT ?${restockLimitIndex} OFFSET ?${restockLimitIndex + 1}`,
            [...restockScope.values, page.pageSize, page.offset],
          ),
          canvassReferences: (
            await rows(
              db,
              `SELECT canvass.*, supplier.location AS supplier_location,
                (SELECT history.metadata_json FROM status_history history
                 WHERE history.entity_type = 'CANVASS' AND history.entity_id = canvass.id
                   AND json_extract(history.metadata_json, '$.preferred') = 1
                 ORDER BY history.changed_at DESC, history.id DESC LIMIT 1) AS preferred_metadata_json
                FROM canvass_references canvass
             JOIN restock_requests restock ON restock.id = canvass.linked_restock_id
             LEFT JOIN suppliers supplier ON supplier.id = canvass.supplier_id
             WHERE ${restockScope.sql} ORDER BY canvass.updated_at DESC
             LIMIT ?${restockLimitIndex} OFFSET ?${restockLimitIndex + 1}`,
              [...restockScope.values, page.pageSize, page.offset],
            )
          ).map(canvassDto),
        };
      } else if (module === 'procurement') {
        const deliverableScope = multiScopeWhere(account, {
          committeeColumns: [
            'COALESCE(deliverable.assigned_committee_id, deliverable_request.owner_committee_id)',
          ],
          ownerColumns: ['deliverable_request.requester_account_id'],
        });
        const canvassScope = multiScopeWhere(account, {
          committeeColumns: [
            'COALESCE(deliverable.assigned_committee_id, deliverable_request.owner_committee_id)',
            'line_request.owner_committee_id',
            'restock.assigned_committee_id',
          ],
          ownerColumns: [
            'deliverable_request.requester_account_id',
            'line_request.requester_account_id',
            'restock.created_by',
          ],
        });
        const deliverableLimitIndex = deliverableScope.values.length + 1;
        const canvassLimitIndex = canvassScope.values.length + 1;
        data = {
          eventSeries: [],
          events: [],
          requests: requestRows.map(requestDto),
          requestLines: requestLines.map(lineDto),
          deliverables: (
            await rows(
              db,
              `SELECT deliverable.*,
                (SELECT GROUP_CONCAT(canvass.id, '|') FROM canvass_references canvass
                 WHERE canvass.status = 'ACTIVE' AND (
                   canvass.linked_deliverable_id = deliverable.id OR
                   canvass.linked_request_line_id = deliverable.request_line_id
                 )) AS linked_canvass_ids
               FROM deliverables deliverable
               JOIN requests deliverable_request ON deliverable_request.id = deliverable.request_id
               WHERE ${deliverableScope.sql}
               ORDER BY deliverable.updated_at DESC
               LIMIT ?${deliverableLimitIndex} OFFSET ?${deliverableLimitIndex + 1}`,
              [...deliverableScope.values, page.pageSize, page.offset],
            )
          ).map(deliverableDto),
          canvassReferences: (
            await rows(
              db,
              `SELECT canvass.*, supplier.location AS supplier_location,
                (SELECT history.metadata_json FROM status_history history
                 WHERE history.entity_type = 'CANVASS' AND history.entity_id = canvass.id
                   AND json_extract(history.metadata_json, '$.preferred') = 1
                 ORDER BY history.changed_at DESC, history.id DESC LIMIT 1) AS preferred_metadata_json
                FROM canvass_references canvass
             LEFT JOIN suppliers supplier ON supplier.id = canvass.supplier_id
             LEFT JOIN deliverables deliverable ON deliverable.id = canvass.linked_deliverable_id
             LEFT JOIN requests deliverable_request ON deliverable_request.id = deliverable.request_id
             LEFT JOIN request_lines line ON line.id = canvass.linked_request_line_id
             LEFT JOIN requests line_request ON line_request.id = line.request_id
             LEFT JOIN restock_requests restock ON restock.id = canvass.linked_restock_id
             WHERE ${canvassScope.sql}
             ORDER BY canvass.updated_at DESC
             LIMIT ?${canvassLimitIndex} OFFSET ?${canvassLimitIndex + 1}`,
              [...canvassScope.values, page.pageSize, page.offset],
            )
          ).map(canvassDto),
        };
      } else if (module === 'overview') {
        const eventScope = multiScopeWhere(account, { committeeColumns: ['event.owner_committee_id'] });
        const eventRows = await rows(
          db,
          `SELECT event.* FROM events event
           JOIN event_days event_day ON event_day.id = event.event_day_id
           WHERE event.active = 1 AND event_day.active = 1 AND ${eventScope.sql}
           ORDER BY COALESCE(event.starts_at, '9999-12-31'), event.name LIMIT 200`,
          eventScope.values,
        );
        data = {
          eventSeries: await rows(
            db,
            "SELECT id, code, name, status FROM event_series WHERE status = 'ACTIVE' ORDER BY name LIMIT 50",
          ),
          eventDays: await rows(
            db,
            `SELECT id, event_series_id AS seriesId, name, event_date AS date, status
             FROM event_days WHERE active = 1 ORDER BY event_date LIMIT 100`,
          ),
          events: eventRows.map(eventActivityDto),
          requests: requestRows.map(requestDto),
          requestLines: requestLines.map(lineDto),
          inventoryItems: itemRows.map((row) => itemDto(row)),
          lendingTickets: [],
          restockRequests: [],
          deliverables: [],
          roadmapMilestones: [],
          dashboardMeta: [],
          dashboardQueues: [],
          dashboardStaffWorkload: [],
          dashboardActivity: [],
          dashboardLinks: [],
        };
      } else {
        data = {
          eventSeries: [],
          events: [],
          requests: requestRows.map(requestDto),
          requestLines: requestLines.map(lineDto),
          inventoryItems: itemRows.map((row) => itemDto(row)),
          lendingTickets: [],
          restockRequests: [],
          deliverables: [],
          roadmapMilestones: [],
          dashboardMeta: [],
          dashboardQueues: [],
          dashboardStaffWorkload: [],
          dashboardActivity: [],
          dashboardLinks: [],
        };
      }
    }
    data = filterOperationalData(data, operationalContext.selected);
    const totalRow = await db
      .prepare('SELECT COUNT(*) AS count FROM inventory_items WHERE status = ?1')
      .bind('ACTIVE')
      .first();
    const globalRevision = await revision(db);
    const scopeRevision = requestOnly ? null : await revision(db, module);
    return {
      ok: true,
      correlationId,
      contract: 'bootstrap-module',
      contractVersion: 2,
      appVersion,
      schemaVersion,
      backendMode: 'rest',
      environment,
      requestOnly,
      module,
      data,
      pagination:
        module === 'inventory'
          ? {
              page: 1,
              pageSize: data.inventoryItems.length,
              total: data.inventoryItems.length,
              hasMore: false,
            }
          : {
              page: page.page,
              pageSize: page.pageSize,
              total: Number(totalRow?.count ?? 0),
              hasMore: page.offset + page.pageSize < Number(totalRow?.count ?? 0),
            },
      revision: globalRevision,
      scopeRevision: scopeRevision
        ? { scope: module, token: scopeRevision.revision, updatedAt: scopeRevision.updatedAt }
        : null,
      cache: requestOnly
        ? { safe: true, scope: 'PUBLIC_REFERENCE', ttlMs: 300_000 }
        : { safe: false, scope: 'SESSION_OPERATIONAL', ttlMs: 0 },
      metrics: { readCount: 4, cacheHits: 0 },
    };
  }

  async function getMaterialsWorkQueue({ account, command = {}, correlationId }) {
    assertCapability(account, METHOD_CAPABILITIES.getMaterialsWorkQueue);
    const scope = multiScopeWhere(account, {
      committeeColumns: ['COALESCE(deliverable.assigned_committee_id, request.owner_committee_id)'],
      ownerColumns: ['request.requester_account_id'],
    });
    const limit = Math.min(Math.max(Number(command.limit ?? 100), 1), 100);
    const limitIndex = scope.values.length + 1;
    const queueRows = await rows(
      db,
      `SELECT deliverable.*, line.description AS line_description,
              line.specification AS line_specification, line.category AS line_category,
              line.requested_quantity AS line_requested_quantity,
              line.received_quantity AS line_received_quantity,
              line.released_quantity AS line_released_quantity,
              line.needed_at AS line_needed_at, line.status AS line_status,
              request.event_series_id AS request_event_series_id,
              request.event_id AS request_event_id, request.department,
              request.priority, request.purpose, request.status AS request_status,
              event.name AS event_name, event.starts_at AS event_start_at,
              preferred.supplier_id AS preferred_supplier_id,
              preferred.supplier_name AS preferred_supplier_name,
              preferred.price AS preferred_price, preferred.unit AS preferred_unit,
              preferred.checked_at AS preferred_checked_at,
              preferred.receipt_status AS preferred_receipt_status,
              preferred.reliability AS preferred_reliability,
              preferred.evidence_id AS preferred_evidence_id,
              (SELECT COUNT(*) FROM canvass_references canvass
                WHERE canvass.status = 'ACTIVE'
                  AND (canvass.linked_deliverable_id = deliverable.id
                    OR canvass.linked_request_line_id = deliverable.request_line_id)) AS canvass_count,
              (SELECT COUNT(DISTINCT canvass.unit) FROM canvass_references canvass
                WHERE canvass.status = 'ACTIVE'
                  AND (canvass.linked_deliverable_id = deliverable.id
                    OR canvass.linked_request_line_id = deliverable.request_line_id)) AS canvass_unit_count,
              (SELECT MAX(canvass.checked_at) FROM canvass_references canvass
                WHERE canvass.status = 'ACTIVE'
                  AND (canvass.linked_deliverable_id = deliverable.id
                    OR canvass.linked_request_line_id = deliverable.request_line_id)) AS latest_canvass_at
       FROM deliverables deliverable
       JOIN requests request ON request.id = deliverable.request_id
       JOIN request_lines line ON line.id = deliverable.request_line_id
       LEFT JOIN events event ON event.id = COALESCE(deliverable.event_id, request.event_id)
       LEFT JOIN canvass_references preferred ON preferred.id = deliverable.preferred_canvass_id
       WHERE COALESCE(deliverable.assigned_committee_id, request.owner_committee_id) = '${COMMITTEES.MATERIALS}'
         AND ${scope.sql}
       ORDER BY deliverable.updated_at DESC, deliverable.id
       LIMIT ?${limitIndex}`,
      [...scope.values, limit],
    );
    return {
      committeeId: COMMITTEES.MATERIALS,
      correlationId,
      items: queueRows.map((row) => ({
        deliverableId: row.id,
        componentId: row.id,
        requestId: row.request_id,
        requestLineId: row.request_line_id,
        eventSeriesId: row.event_series_id ?? row.request_event_series_id,
        eventId: row.event_id ?? row.request_event_id,
        status: row.status,
        ownerCommitteeId: row.assigned_committee_id ?? COMMITTEES.MATERIALS,
        assignedAccountId: row.assigned_account_id,
        quantityRequested: Number(row.quantity_requested),
        quantityReceived: Number(row.quantity_received),
        quantityReleased: Number(row.quantity_released),
        unit: row.unit,
        eventItemId: row.event_item_id ?? null,
        inventoryMatchId: row.inventory_match_id ?? null,
        evidenceId: row.evidence_id ?? null,
        neededAt: row.needed_at ?? row.line_needed_at,
        updatedAt: row.updated_at,
        parent: {
          eventId: row.event_id ?? row.request_event_id,
          eventName: row.event_name ?? '',
          eventStartAt: row.event_start_at ?? '',
          priority: row.priority,
          purpose: row.purpose,
          department: row.department,
        },
        materials: {
          materialCategory: row.line_category,
          specification: row.line_specification || row.item_spec,
          requiredBy: row.needed_at ?? row.line_needed_at,
          usagePurpose: row.purpose,
          fulfillmentPath: row.fulfillment_source,
          budgetStatus: row.budget_status,
          procurementStatus: row.procurement_status,
          receiptStatus: row.receipt_status,
          preferredCanvassId: row.preferred_canvass_id,
          preferredSupplierId: row.preferred_supplier_id,
          preferredSupplierName: row.preferred_supplier_name,
          preferredPrice: row.preferred_price == null ? null : Number(row.preferred_price),
          preferredUnit: row.preferred_unit,
          preferredCheckedAt: row.preferred_checked_at,
          preferredReceiptStatus: row.preferred_receipt_status,
          preferredReliability: row.preferred_reliability,
          preferredEvidenceId: row.preferred_evidence_id,
        },
        lines: [
          {
            id: row.request_line_id,
            description: row.line_description,
            specification: row.line_specification,
            category: row.line_category,
            quantity: Number(row.line_requested_quantity),
            receivedQuantity: Number(row.line_received_quantity),
            releasedQuantity: Number(row.line_released_quantity),
            unit: row.unit,
            status: row.line_status,
          },
        ],
        quoteSummary: {
          activeCount: Number(row.canvass_count ?? 0),
          distinctUnits: Number(row.canvass_unit_count ?? 0),
          latestCheckedAt: row.latest_canvass_at ?? '',
        },
      })),
    };
  }

  async function canvassLinkContext(command) {
    let linkedRequestLineId = optionalText(command.linkedRequestLineId ?? command.linkedLineId, 80);
    let linkedDeliverableId = optionalText(command.linkedDeliverableId, 80);
    let linkedRestockId = optionalText(command.linkedRestockId, 80);
    let record;
    if (linkedDeliverableId) {
      record = await db
        .prepare(
          `SELECT deliverable.id AS deliverable_id, deliverable.request_line_id,
             COALESCE(deliverable.assigned_committee_id, request.owner_committee_id) AS committee_id,
             request.requester_account_id AS owner_account_id
           FROM deliverables deliverable
           JOIN requests request ON request.id = deliverable.request_id
           WHERE deliverable.id = ?1`,
        )
        .bind(linkedDeliverableId)
        .first();
      if (!record) {
        throw new ApiError('DELIVERABLE_NOT_FOUND', 'The linked deliverable was not found.', {
          status: 404,
        });
      }
      if (linkedRequestLineId && linkedRequestLineId !== record.request_line_id) {
        throw new ApiError(
          'CANVASS_SCOPE_MISMATCH',
          'The linked deliverable and request line do not match.',
          { status: 409 },
        );
      }
      linkedRequestLineId ||= record.request_line_id;
    } else if (linkedRestockId) {
      record = await db
        .prepare(
          `SELECT restock.id AS restock_id, restock.source_request_line_id AS request_line_id,
             restock.assigned_committee_id AS committee_id,
             COALESCE(request.requester_account_id, restock.created_by) AS owner_account_id
           FROM restock_requests restock
           LEFT JOIN requests request ON request.id = restock.source_request_id
           WHERE restock.id = ?1`,
        )
        .bind(linkedRestockId)
        .first();
      if (!record) {
        throw new ApiError('RESTOCK_NOT_FOUND', 'The linked restock request was not found.', {
          status: 404,
        });
      }
      if (linkedRequestLineId && linkedRequestLineId !== record.request_line_id) {
        throw new ApiError(
          'CANVASS_SCOPE_MISMATCH',
          'The linked restock request and request line do not match.',
          { status: 409 },
        );
      }
      linkedRequestLineId ||= record.request_line_id ?? '';
    } else if (linkedRequestLineId) {
      record = await db
        .prepare(
          `SELECT line.id AS request_line_id, request.owner_committee_id AS committee_id,
             request.requester_account_id AS owner_account_id
           FROM request_lines line
           JOIN requests request ON request.id = line.request_id
           WHERE line.id = ?1`,
        )
        .bind(linkedRequestLineId)
        .first();
      if (!record) {
        throw new ApiError('REQUEST_LINE_NOT_FOUND', 'The linked request line was not found.', {
          status: 404,
        });
      }
      const deliverable = await db
        .prepare('SELECT id FROM deliverables WHERE request_line_id = ?1 ORDER BY created_at LIMIT 1')
        .bind(linkedRequestLineId)
        .first();
      const restock = await db
        .prepare(
          'SELECT id FROM restock_requests WHERE source_request_line_id = ?1 ORDER BY created_at LIMIT 1',
        )
        .bind(linkedRequestLineId)
        .first();
      linkedDeliverableId = deliverable?.id ?? '';
      linkedRestockId = restock?.id ?? '';
    } else {
      record = { committee_id: '', owner_account_id: '' };
    }
    return { linkedRequestLineId, linkedDeliverableId, linkedRestockId, record };
  }

  async function requireStoredEvidence(command, { evidenceTypes = [], relatedEntityIds = [] } = {}) {
    const evidenceId = optionalText(command.evidenceId, 80);
    if (command.evidence && !evidenceId) {
      throw new ApiError(
        'EVIDENCE_BRIDGE_NOT_CONFIGURED',
        'Evidence must be stored through the approved private staging bridge first.',
        { status: 503 },
      );
    }
    if (!evidenceId) return null;
    const evidence = await db
      .prepare(
        `SELECT id, evidence_type, related_entity_id, upload_status
         FROM evidence_metadata WHERE id = ?1`,
      )
      .bind(evidenceId)
      .first();
    if (!evidence || !['STORED', 'VERIFIED'].includes(String(evidence.upload_status).toUpperCase())) {
      throw new ApiError(
        'EVIDENCE_REFERENCE_INVALID',
        'The evidence reference is not an approved stored staging object.',
        { status: 409 },
      );
    }
    if (evidenceTypes.length && !evidenceTypes.includes(evidence.evidence_type)) {
      throw new ApiError(
        'EVIDENCE_REFERENCE_MISMATCH',
        'The evidence reference does not match this workflow.',
        { status: 409 },
      );
    }
    const expectedIds = relatedEntityIds.filter(Boolean).map(String);
    if (expectedIds.length && !expectedIds.includes(String(evidence.related_entity_id))) {
      throw new ApiError(
        'EVIDENCE_REFERENCE_MISMATCH',
        'The evidence reference belongs to a different operational record.',
        { status: 409 },
      );
    }
    return evidence.id;
  }

  async function assertEvidenceScope(account, command) {
    const evidenceType = requiredText(command.evidenceType, 'evidenceType', 80);
    const relatedEntityId = requiredText(
      command.relatedEntityId ??
        command.requestId ??
        command.restockId ??
        command.deliverableId ??
        command.lendingTicketId,
      'relatedEntityId',
      100,
    );
    let scopeRecord;
    if (evidenceType === 'RELEASE_CONFIRMATION_PHOTO') {
      assertCapability(account, CAPABILITIES.FULFILL_RELEASE);
      scopeRecord = await db
        .prepare(
          `SELECT owner_committee_id AS committee_id, requester_account_id AS owner_account_id
           FROM requests WHERE id = ?1`,
        )
        .bind(command.requestId ?? relatedEntityId)
        .first();
    } else if (['RESTOCK_RECEIPT', 'RESTOCK_INVOICE'].includes(evidenceType)) {
      assertCapability(account, CAPABILITIES.FULFILL_RECEIVE);
      scopeRecord = await db
        .prepare(
          `SELECT restock.assigned_committee_id AS committee_id,
                  request.requester_account_id AS owner_account_id
           FROM restock_requests restock
           LEFT JOIN requests request ON request.id = restock.source_request_id
           WHERE restock.id = ?1`,
        )
        .bind(command.restockId ?? relatedEntityId)
        .first();
    } else if (['DELIVERABLE_RECEIPT', 'DELIVERABLE_DELIVERY_PROOF'].includes(evidenceType)) {
      assertCapability(account, CAPABILITIES.FULFILL_RECEIVE);
      scopeRecord = await db
        .prepare(
          `SELECT COALESCE(deliverable.assigned_committee_id, request.owner_committee_id) AS committee_id,
                  request.requester_account_id AS owner_account_id
           FROM deliverables deliverable
           JOIN requests request ON request.id = deliverable.request_id
           WHERE deliverable.id = ?1`,
        )
        .bind(command.deliverableId ?? relatedEntityId)
        .first();
    } else if (['LENDING_HANDOFF_PHOTO', 'LENDING_RETURN_PHOTO'].includes(evidenceType)) {
      const capability =
        evidenceType === 'LENDING_HANDOFF_PHOTO' ? CAPABILITIES.LENDING_HANDOFF : CAPABILITIES.LENDING_RETURN;
      assertCapability(account, capability);
      scopeRecord = await db
        .prepare(
          `SELECT owner_committee_id AS committee_id, created_by AS owner_account_id
           FROM lending_tickets WHERE id = ?1`,
        )
        .bind(command.lendingTicketId ?? relatedEntityId)
        .first();
    } else if (['CANVASS_QUOTE', 'CANVASS_PHOTO'].includes(evidenceType)) {
      assertCapability(account, CAPABILITIES.FULFILL_CANVASS);
      const requestLineId = command.requestLineId ?? relatedEntityId;
      scopeRecord = await db
        .prepare(
          `SELECT request.owner_committee_id AS committee_id,
                  request.requester_account_id AS owner_account_id
           FROM request_lines line
           JOIN requests request ON request.id = line.request_id
           WHERE line.id = ?1`,
        )
        .bind(requestLineId)
        .first();
    } else if (evidenceType === 'OTHER_SUPPORTING_DOCUMENT') {
      assertCapability(account, CAPABILITIES.SYSTEM_ADMIN);
      return { evidenceType, relatedEntityId };
    } else {
      throw new ApiError('UNSUPPORTED_EVIDENCE_TYPE', 'The evidence type is not supported.');
    }
    if (!scopeRecord) {
      throw new ApiError(
        'EVIDENCE_RELATED_RECORD_NOT_FOUND',
        'The evidence target was not found in the authorized operational scope.',
        { status: 404 },
      );
    }
    assertEntityScope(account, {
      committeeId: scopeRecord.committee_id,
      ownerAccountId: scopeRecord.owner_account_id,
    });
    return { evidenceType, relatedEntityId };
  }

  async function uploadEvidence({ account, command, correlationId }) {
    assertCapability(account, METHOD_CAPABILITIES.uploadEvidence);
    const { evidenceType, relatedEntityId } = await assertEvidenceScope(account, command);
    if (!evidenceStore?.status(evidenceType)?.configured) {
      throw new ApiError(
        'EVIDENCE_STORE_NOT_CONFIGURED',
        'The approved private evidence store is not configured for this evidence type.',
        { status: 503 },
      );
    }
    const mutation = await replay(db, 'uploadEvidence', command.clientRequestId, account.id, command);
    if (mutation.replayed) return mutation.value;
    const evidenceId = createId('EVD');
    let prepared;
    try {
      prepared = await evidenceStore.prepare({
        evidenceId,
        command: { ...command, evidenceType, relatedEntityId },
      });
    } catch (error) {
      throw new ApiError(error?.code ?? 'EVIDENCE_VALIDATION_FAILED', error?.message, {
        status: error?.code === 'EVIDENCE_STORE_NOT_CONFIGURED' ? 503 : 422,
        details: error?.details,
      });
    }
    const duplicate = await db
      .prepare(
        `SELECT evidence.id, backup.status AS backup_status
         FROM evidence_metadata evidence
         LEFT JOIN evidence_backup_jobs backup ON backup.evidence_id = evidence.id
         WHERE evidence.sha256 = ?1
           AND evidence.related_entity_type = ?2
           AND evidence.related_entity_id = ?3
           AND UPPER(evidence.upload_status) IN ('STORED', 'VERIFIED')
         ORDER BY evidence.created_at LIMIT 1`,
      )
      .bind(prepared.sha256, prepared.relatedEntityType, prepared.relatedEntityId)
      .first();
    if (duplicate) {
      const result = {
        evidenceId: duplicate.id,
        id: duplicate.id,
        duplicate: true,
        uploadStatus: 'VERIFIED',
        backupStatus: duplicate.backup_status ?? 'PENDING',
        message: '✓ Your photo or document is saved securely. A backup copy will be created automatically.',
        correlationId,
      };
      await db.batch([
        auditStatement(db, {
          action: 'DUPLICATE_EVIDENCE_ATTEMPT',
          entityType: 'EVIDENCE',
          entityId: duplicate.id,
          accountId: account.id,
          correlationId,
          after: {
            evidenceType,
            relatedEntityType: prepared.relatedEntityType,
            relatedEntityId: prepared.relatedEntityId,
          },
        }),
        idempotencyStatement(db, 'uploadEvidence', mutation, account.id, result),
      ]);
      return result;
    }
    let stored;
    try {
      stored = await evidenceStore.upload(prepared);
    } catch (error) {
      throw new ApiError(error?.code ?? 'EVIDENCE_STORE_UPLOAD_FAILED', error?.message, {
        status: 502,
      });
    }
    const timestamp = nowIso();
    const result = {
      evidenceId,
      id: evidenceId,
      evidenceLabel: prepared.evidenceLabel,
      normalizedFileName: prepared.normalizedFileName,
      duplicate: false,
      uploadStatus: 'VERIFIED',
      backupStatus: 'PENDING',
      message: '✓ Your photo or document is saved securely. A backup copy will be created automatically.',
      correlationId,
    };
    const backupJobId = createId('EBJ');
    const backupIdempotencyKey = `${evidenceId}:${prepared.sha256}`;
    try {
      await db.batch([
        db
          .prepare(
            `INSERT INTO evidence_metadata (
               id, evidence_type, evidence_label, normalized_file_name, mime_type,
               size_bytes, sha256, private_storage_reference, related_entity_type,
               related_entity_id, uploaded_by, upload_status, duplicate_of, notes, created_at,
               primary_storage_status, primary_etag, primary_version, retention_class
             ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11,
                       'VERIFIED', NULL, ?12, ?13, 'VERIFIED', ?14, ?15,
                       'HAU_USC_OPERATIONAL_EVIDENCE')`,
          )
          .bind(
            evidenceId,
            prepared.evidenceType,
            prepared.evidenceLabel,
            prepared.normalizedFileName,
            prepared.mimeType,
            prepared.sizeBytes,
            prepared.sha256,
            stored.privateStorageReference,
            prepared.relatedEntityType,
            prepared.relatedEntityId,
            account.id,
            prepared.notes,
            timestamp,
            stored.primaryEtag,
            stored.primaryVersion,
          ),
        db
          .prepare(
            `INSERT INTO evidence_backup_jobs (
               id, evidence_id, idempotency_key, status, attempt_count, max_attempts,
               next_attempt_at, created_at, updated_at
             ) VALUES (?1, ?2, ?3, 'PENDING', 0, 8, ?4, ?4, ?4)`,
          )
          .bind(backupJobId, evidenceId, backupIdempotencyKey, timestamp),
        auditStatement(db, {
          action: 'EVIDENCE_PRIMARY_STORED',
          entityType: 'EVIDENCE',
          entityId: evidenceId,
          accountId: account.id,
          correlationId,
          after: {
            evidenceType,
            relatedEntityType: prepared.relatedEntityType,
            relatedEntityId: prepared.relatedEntityId,
            sizeBytes: prepared.sizeBytes,
          },
        }),
        idempotencyStatement(db, 'uploadEvidence', mutation, account.id, result),
        ...revisionStatements(db, ['evidence']),
      ]);
    } catch (error) {
      await evidenceStore.remove(stored.privateStorageReference, evidenceId).catch(() => false);
      if (String(error?.message ?? '').includes('evidence duplicate conflict')) {
        const existing = await db
          .prepare(
            `SELECT evidence.id, backup.status AS backup_status
               FROM evidence_metadata evidence
               LEFT JOIN evidence_backup_jobs backup ON backup.evidence_id = evidence.id
               WHERE evidence.sha256 = ?1
                 AND evidence.related_entity_type = ?2
                 AND evidence.related_entity_id = ?3
                 AND UPPER(evidence.upload_status) IN ('STORED', 'VERIFIED')
               ORDER BY evidence.created_at LIMIT 1`,
          )
          .bind(prepared.sha256, prepared.relatedEntityType, prepared.relatedEntityId)
          .first();
        if (existing) {
          const duplicateResult = {
            evidenceId: existing.id,
            id: existing.id,
            duplicate: true,
            uploadStatus: 'VERIFIED',
            backupStatus: existing.backup_status ?? 'PENDING',
            message:
              '✓ Your photo or document is saved securely. A backup copy will be created automatically.',
            correlationId,
          };
          await db.batch([
            auditStatement(db, {
              action: 'DUPLICATE_EVIDENCE_ATTEMPT',
              entityType: 'EVIDENCE',
              entityId: existing.id,
              accountId: account.id,
              correlationId,
              after: {
                evidenceType,
                relatedEntityType: prepared.relatedEntityType,
                relatedEntityId: prepared.relatedEntityId,
              },
            }),
            idempotencyStatement(db, 'uploadEvidence', mutation, account.id, duplicateResult),
          ]);
          return duplicateResult;
        }
      }
      throw new ApiError(
        'EVIDENCE_METADATA_FAILED',
        'The evidence upload was reversed because its governed metadata could not be recorded.',
        { status: 503 },
      );
    }
    return result;
  }

  async function canvassRecord(canvassId, { activeOnly = true } = {}) {
    return db
      .prepare(
        `SELECT canvass.*, supplier.location AS supplier_location,
           COALESCE(deliverable.assigned_committee_id, deliverable_request.owner_committee_id,
             line_request.owner_committee_id, restock.assigned_committee_id) AS committee_id,
           COALESCE(deliverable_request.requester_account_id, line_request.requester_account_id,
             restock_request.requester_account_id, restock.created_by) AS owner_account_id
         FROM canvass_references canvass
         LEFT JOIN suppliers supplier ON supplier.id = canvass.supplier_id
         LEFT JOIN deliverables deliverable ON deliverable.id = canvass.linked_deliverable_id
         LEFT JOIN requests deliverable_request ON deliverable_request.id = deliverable.request_id
         LEFT JOIN request_lines line ON line.id = canvass.linked_request_line_id
         LEFT JOIN requests line_request ON line_request.id = line.request_id
         LEFT JOIN restock_requests restock ON restock.id = canvass.linked_restock_id
         LEFT JOIN requests restock_request ON restock_request.id = restock.source_request_id
         WHERE canvass.id = ?1 ${activeOnly ? "AND canvass.status = 'ACTIVE'" : ''}`,
      )
      .bind(canvassId)
      .first();
  }

  async function assertNoCanvassDuplicate(candidate, excludedId = '') {
    const duplicate = await db
      .prepare(
        `SELECT id FROM canvass_references
         WHERE status = 'ACTIVE' AND id <> ?1
           AND COALESCE(linked_request_line_id, '') = ?2
           AND COALESCE(linked_deliverable_id, '') = ?3
           AND COALESCE(linked_restock_id, '') = ?4
           AND LOWER(TRIM(supplier_name)) = ?5
           AND LOWER(TRIM(item_spec)) = ?6
           AND LOWER(TRIM(unit)) = ?7
           AND checked_at = ?8
         LIMIT 1`,
      )
      .bind(
        excludedId,
        candidate.linkedRequestLineId || '',
        candidate.linkedDeliverableId || '',
        candidate.linkedRestockId || '',
        candidate.supplierName.toLowerCase(),
        candidate.itemSpec.toLowerCase(),
        candidate.unit.toLowerCase(),
        candidate.checkedAt,
      )
      .first();
    if (duplicate) {
      throw new ApiError('CANVASS_DUPLICATE', 'An active matching canvass reference already exists.', {
        status: 409,
      });
    }
  }

  async function resolveCanvassSupplier(command, current = null) {
    const requestedSupplierId = optionalText(command.supplierId, 80);
    let supplier = requestedSupplierId
      ? await db
          .prepare('SELECT * FROM suppliers WHERE id = ?1 AND active = 1')
          .bind(requestedSupplierId)
          .first()
      : null;
    if (requestedSupplierId && !supplier) {
      throw new ApiError('SUPPLIER_NOT_FOUND', 'The selected supplier was not found.', { status: 404 });
    }
    const supplierName =
      supplier?.name ?? requiredText(command.supplierName ?? current?.supplier_name, 'supplierName', 160);
    const normalizedName = supplierName.toLowerCase().replace(/\s+/gu, ' ');
    supplier ??= await db
      .prepare(
        'SELECT * FROM suppliers WHERE normalized_name = ?1 AND active = 1 ORDER BY updated_at DESC LIMIT 1',
      )
      .bind(normalizedName)
      .first();
    return { supplier, supplierName: supplier?.name ?? supplierName, normalizedName };
  }

  async function saveCanvassReference({ account, command, correlationId }) {
    assertCapability(account, METHOD_CAPABILITIES.saveCanvassReference);
    const link = await canvassLinkContext(command);
    assertEntityScope(account, {
      committeeId: link.record.committee_id,
      ownerAccountId: link.record.owner_account_id,
    });
    const evidenceId = await requireStoredEvidence(command, {
      evidenceTypes: ['CANVASS_QUOTE', 'CANVASS_PHOTO'],
      relatedEntityIds: [link.linkedRequestLineId, link.linkedDeliverableId, link.linkedRestockId],
    });
    const mutation = await replay(db, 'saveCanvassReference', command.clientRequestId, account.id, command);
    if (mutation.replayed) return mutation.value;
    const supplierResolution = await resolveCanvassSupplier(command);
    const timestamp = nowIso();
    const supplierId = supplierResolution.supplier?.id ?? createId('SUP');
    const canvassId = createId('CAN');
    const candidate = {
      linkedRequestLineId: link.linkedRequestLineId || '',
      linkedDeliverableId: link.linkedDeliverableId || '',
      linkedRestockId: link.linkedRestockId || '',
      supplierName: supplierResolution.supplierName,
      itemSpec: requiredText(command.itemSpec, 'itemSpec', 500).replace(/\s+/gu, ' '),
      price: positiveNumber(command.price, 'price'),
      unit: canvassUnit(command.unit),
      receiptStatus: optionalText(command.receiptStatus, 80),
      reliability: optionalText(command.reliability, 80),
      checkedAt: canvassCheckedAt(command.checkedAt),
      sourceUrl: safeCanvassSourceUrl(command.sourceUrl),
      notes: optionalText(command.notes, 1000),
    };
    await assertNoCanvassDuplicate(candidate);
    const priceHistory = [
      {
        price: candidate.price,
        checkedAt: candidate.checkedAt,
        recordedAt: timestamp,
        recordedBy: account.id,
      },
    ];
    const result = {
      canvassId,
      id: canvassId,
      supplierId,
      linkedRequestLineId: candidate.linkedRequestLineId || null,
      status: 'ACTIVE',
      updatedAt: timestamp,
      correlationId,
    };
    const statements = [];
    if (!supplierResolution.supplier) {
      statements.push(
        db
          .prepare(
            `INSERT INTO suppliers (
               id, name, normalized_name, location, receipt_capability, reliability,
               active, notes, created_at, updated_at
             ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, 1, ?7, ?8, ?8)`,
          )
          .bind(
            supplierId,
            candidate.supplierName,
            supplierResolution.normalizedName,
            optionalText(command.location, 240),
            candidate.receiptStatus,
            candidate.reliability,
            optionalText(command.supplierNotes, 500),
            timestamp,
          ),
      );
    }
    const after = {
      ...candidate,
      supplierId,
      evidenceId,
      preferred: false,
      status: 'ACTIVE',
      updatedAt: timestamp,
    };
    statements.push(
      db
        .prepare(
          `INSERT INTO canvass_references (
             id, linked_request_line_id, linked_deliverable_id, linked_restock_id,
             supplier_id, supplier_name, item_spec, price, unit, receipt_status,
             reliability, checked_at, source_url, evidence_id, preferred, status,
             price_history_json, idempotency_key, notes, created_at, updated_at, created_by
           ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12,
             ?13, ?14, 0, 'ACTIVE', ?15, ?16, ?17, ?18, ?18, ?19)`,
        )
        .bind(
          canvassId,
          candidate.linkedRequestLineId || null,
          candidate.linkedDeliverableId || null,
          candidate.linkedRestockId || null,
          supplierId,
          candidate.supplierName,
          candidate.itemSpec,
          candidate.price,
          candidate.unit,
          candidate.receiptStatus,
          candidate.reliability,
          candidate.checkedAt,
          candidate.sourceUrl,
          evidenceId,
          JSON.stringify(priceHistory),
          mutation.key,
          candidate.notes,
          timestamp,
          account.id,
        ),
      historyStatement(db, {
        entityType: 'CANVASS',
        entityId: canvassId,
        newStatus: 'ACTIVE',
        accountId: account.id,
        idempotencyKey: mutation.key,
        reason: 'Canvass reference created',
        metadata: { before: null, after },
      }),
      auditStatement(db, {
        action: 'CANVASS_REFERENCE_SAVED',
        entityType: 'CANVASS',
        entityId: canvassId,
        accountId: account.id,
        correlationId,
        after,
      }),
      idempotencyStatement(db, 'saveCanvassReference', mutation, account.id, result),
      ...revisionStatements(db, ['procurement', 'restocking']),
    );
    await db.batch(statements);
    return result;
  }

  async function updateCanvassReference({ account, command, correlationId }) {
    assertCapability(account, METHOD_CAPABILITIES.updateCanvassReference);
    const canvassId = requiredText(command.canvassId, 'canvassId', 80);
    const canvass = await canvassRecord(canvassId);
    if (!canvass)
      throw new ApiError('CANVASS_NOT_FOUND', 'The canvass reference was not found.', { status: 404 });
    assertEntityScope(account, {
      committeeId: canvass.committee_id,
      ownerAccountId: canvass.owner_account_id,
    });
    const mutation = await replay(db, 'updateCanvassReference', command.clientRequestId, account.id, command);
    if (mutation.replayed) return mutation.value;
    const expectedUpdatedAt = requiredText(command.expectedUpdatedAt, 'expectedUpdatedAt', 64);
    if (expectedUpdatedAt !== canvass.updated_at) {
      throw new ApiError('REVISION_CONFLICT', 'This canvass reference changed; refresh before updating.', {
        status: 409,
      });
    }
    const supplierResolution = await resolveCanvassSupplier(command, canvass);
    const evidenceId =
      (await requireStoredEvidence(command, {
        evidenceTypes: ['CANVASS_QUOTE', 'CANVASS_PHOTO'],
        relatedEntityIds: [
          canvass.linked_request_line_id,
          canvass.linked_deliverable_id,
          canvass.linked_restock_id,
        ],
      })) ?? canvass.evidence_id;
    const candidate = {
      linkedRequestLineId: canvass.linked_request_line_id || '',
      linkedDeliverableId: canvass.linked_deliverable_id || '',
      linkedRestockId: canvass.linked_restock_id || '',
      supplierName: supplierResolution.supplierName,
      itemSpec: requiredText(command.itemSpec ?? canvass.item_spec, 'itemSpec', 500).replace(/\s+/gu, ' '),
      price: positiveNumber(command.price ?? canvass.price, 'price'),
      unit: canvassUnit(command.unit ?? canvass.unit),
      receiptStatus: optionalText(command.receiptStatus ?? canvass.receipt_status, 80),
      reliability: optionalText(command.reliability ?? canvass.reliability, 80),
      checkedAt: canvassCheckedAt(command.checkedAt ?? canvass.checked_at),
      sourceUrl: safeCanvassSourceUrl(command.sourceUrl ?? canvass.source_url),
      notes: optionalText(command.notes ?? canvass.notes, 1000),
    };
    await assertNoCanvassDuplicate(candidate, canvassId);
    const timestamp = nowIso();
    const supplierId = supplierResolution.supplier?.id ?? createId('SUP');
    const priceHistory = parseJsonArray(canvass.price_history_json);
    if (Number(canvass.price) !== candidate.price || canvass.checked_at !== candidate.checkedAt) {
      priceHistory.push({
        price: candidate.price,
        checkedAt: candidate.checkedAt,
        recordedAt: timestamp,
        recordedBy: account.id,
      });
    }
    const after = {
      ...candidate,
      supplierId,
      evidenceId,
      preferred: canvass.preferred === 1,
      status: 'ACTIVE',
      updatedAt: timestamp,
    };
    const result = { canvassId, id: canvassId, updatedAt: timestamp, correlationId };
    const statements = [];
    if (!supplierResolution.supplier) {
      statements.push(
        db
          .prepare(
            `INSERT INTO suppliers (
               id, name, normalized_name, location, receipt_capability, reliability,
               active, notes, created_at, updated_at
             ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, 1, '', ?7, ?7)`,
          )
          .bind(
            supplierId,
            candidate.supplierName,
            supplierResolution.normalizedName,
            optionalText(command.location, 240),
            candidate.receiptStatus,
            candidate.reliability,
            timestamp,
          ),
      );
    }
    statements.push(
      db
        .prepare(
          `UPDATE canvass_references SET supplier_id = ?1, supplier_name = ?2, item_spec = ?3,
             price = ?4, unit = ?5, receipt_status = ?6, reliability = ?7, checked_at = ?8,
             source_url = ?9, evidence_id = ?10, price_history_json = ?11, notes = ?12, updated_at = ?13
           WHERE id = ?14 AND updated_at = ?15`,
        )
        .bind(
          supplierId,
          candidate.supplierName,
          candidate.itemSpec,
          candidate.price,
          candidate.unit,
          candidate.receiptStatus,
          candidate.reliability,
          candidate.checkedAt,
          candidate.sourceUrl,
          evidenceId,
          JSON.stringify(priceHistory),
          candidate.notes,
          timestamp,
          canvassId,
          expectedUpdatedAt,
        ),
      historyStatement(db, {
        entityType: 'CANVASS',
        entityId: canvassId,
        previousStatus: 'ACTIVE',
        newStatus: 'ACTIVE',
        accountId: account.id,
        idempotencyKey: mutation.key,
        reason: optionalText(command.reason, 500) || 'Canvass reference updated',
        metadata: { before: canvassDto(canvass), after },
      }),
      auditStatement(db, {
        action: 'CANVASS_REFERENCE_UPDATED',
        entityType: 'CANVASS',
        entityId: canvassId,
        accountId: account.id,
        correlationId,
        before: canvassDto(canvass),
        after,
      }),
      idempotencyStatement(db, 'updateCanvassReference', mutation, account.id, result),
      ...revisionStatements(db, ['procurement', 'restocking']),
    );
    await db.batch(statements);
    return result;
  }

  async function archiveCanvassReference({ account, command, correlationId }) {
    assertCapability(account, METHOD_CAPABILITIES.archiveCanvassReference);
    const canvassId = requiredText(command.canvassId, 'canvassId', 80);
    const canvass = await canvassRecord(canvassId);
    if (!canvass)
      throw new ApiError('CANVASS_NOT_FOUND', 'The canvass reference was not found.', { status: 404 });
    assertEntityScope(account, {
      committeeId: canvass.committee_id,
      ownerAccountId: canvass.owner_account_id,
    });
    const mutation = await replay(
      db,
      'archiveCanvassReference',
      command.clientRequestId,
      account.id,
      command,
    );
    if (mutation.replayed) return mutation.value;
    const expectedUpdatedAt = requiredText(command.expectedUpdatedAt, 'expectedUpdatedAt', 64);
    if (expectedUpdatedAt !== canvass.updated_at) {
      throw new ApiError('REVISION_CONFLICT', 'This canvass reference changed; refresh before archiving.', {
        status: 409,
      });
    }
    if (canvass.preferred === 1) {
      throw new ApiError(
        'PREFERRED_CANVASS_ARCHIVE_BLOCKED',
        'Select another preferred canvass reference before archiving this one.',
        { status: 409 },
      );
    }
    const reason = requiredText(command.reason, 'reason', 500);
    const timestamp = nowIso();
    const after = { ...canvassDto(canvass), preferred: false, status: 'ARCHIVED', updatedAt: timestamp };
    const result = { canvassId, id: canvassId, status: 'ARCHIVED', updatedAt: timestamp, correlationId };
    await db.batch([
      db
        .prepare(
          `UPDATE canvass_references SET preferred = 0, status = 'ARCHIVED', updated_at = ?1
           WHERE id = ?2 AND updated_at = ?3`,
        )
        .bind(timestamp, canvassId, expectedUpdatedAt),
      historyStatement(db, {
        entityType: 'CANVASS',
        entityId: canvassId,
        previousStatus: 'ACTIVE',
        newStatus: 'ARCHIVED',
        accountId: account.id,
        idempotencyKey: mutation.key,
        reason,
        metadata: { before: canvassDto(canvass), after },
      }),
      auditStatement(db, {
        action: 'CANVASS_REFERENCE_ARCHIVED',
        entityType: 'CANVASS',
        entityId: canvassId,
        accountId: account.id,
        correlationId,
        before: canvassDto(canvass),
        after,
      }),
      idempotencyStatement(db, 'archiveCanvassReference', mutation, account.id, result),
      ...revisionStatements(db, ['procurement', 'restocking']),
    ]);
    return result;
  }

  async function selectPreferredCanvass({ account, command, correlationId }) {
    assertCapability(account, METHOD_CAPABILITIES.selectPreferredCanvass);
    const canvassId = requiredText(command.canvassId, 'canvassId', 80);
    const canvass = await canvassRecord(canvassId);
    if (!canvass)
      throw new ApiError('CANVASS_NOT_FOUND', 'The canvass reference was not found.', { status: 404 });
    assertEntityScope(account, {
      committeeId: canvass.committee_id,
      ownerAccountId: canvass.owner_account_id,
    });
    const rationale = requiredText(command.rationale, 'rationale', 500);
    const mutation = await replay(db, 'selectPreferredCanvass', command.clientRequestId, account.id, command);
    if (mutation.replayed) return mutation.value;
    const timestamp = nowIso();
    const groupRows = await rows(
      db,
      `SELECT canvass.* FROM canvass_references canvass
       WHERE canvass.status = 'ACTIVE' AND (
         (?1 IS NOT NULL AND canvass.linked_request_line_id = ?1) OR
         (?2 IS NOT NULL AND canvass.linked_deliverable_id = ?2) OR
         (?3 IS NOT NULL AND canvass.linked_restock_id = ?3)
       )`,
      [canvass.linked_request_line_id, canvass.linked_deliverable_id, canvass.linked_restock_id],
    );
    const result = {
      canvassId,
      preferred: true,
      rationale,
      deliverableId: canvass.linked_deliverable_id ?? null,
      restockId: canvass.linked_restock_id ?? null,
      updatedAt: timestamp,
      correlationId,
    };
    const groupDecision = {
      selectedCanvassId: canvassId,
      activeCanvassIds: groupRows.map((entry) => entry.id).sort(),
      linkedRequestLineId: canvass.linked_request_line_id ?? null,
      linkedDeliverableId: canvass.linked_deliverable_id ?? null,
      linkedRestockId: canvass.linked_restock_id ?? null,
      exclusivePreferenceApplied: true,
    };
    const statements = [
      db
        .prepare(
          `UPDATE canvass_references
           SET preferred = CASE WHEN id = ?1 THEN 1 ELSE 0 END, updated_at = ?2
           WHERE status = 'ACTIVE' AND (
             (?3 IS NOT NULL AND linked_request_line_id = ?3) OR
             (?4 IS NOT NULL AND linked_deliverable_id = ?4) OR
             (?5 IS NOT NULL AND linked_restock_id = ?5)
           )`,
        )
        .bind(
          canvassId,
          timestamp,
          canvass.linked_request_line_id,
          canvass.linked_deliverable_id,
          canvass.linked_restock_id,
        ),
    ];
    for (const row of groupRows.filter((entry) => entry.id === canvassId || entry.preferred === 1)) {
      const preferred = row.id === canvassId;
      const before = canvassDto(row);
      const after = {
        ...before,
        preferred,
        preferredRationale: preferred ? rationale : '',
        updatedAt: timestamp,
      };
      statements.push(
        historyStatement(db, {
          entityType: 'CANVASS',
          entityId: row.id,
          previousStatus: 'ACTIVE',
          newStatus: 'ACTIVE',
          accountId: account.id,
          idempotencyKey: mutation.key,
          reason: preferred ? rationale : `Preferred canvass changed to ${canvassId}`,
          metadata: {
            preferred,
            ...(preferred ? { rationale } : { selectedCanvassId: canvassId }),
            groupDecision,
            before,
            after,
          },
        }),
        auditStatement(db, {
          action: preferred ? 'PREFERRED_CANVASS_SELECTED' : 'PREFERRED_CANVASS_DESELECTED',
          entityType: 'CANVASS',
          entityId: row.id,
          accountId: account.id,
          correlationId,
          before,
          after: { ...after, groupDecision },
        }),
      );
    }
    if (canvass.linked_deliverable_id || canvass.linked_request_line_id) {
      statements.push(
        db
          .prepare(
            `UPDATE deliverables SET preferred_canvass_id = ?1, updated_at = ?4
             WHERE (?2 IS NOT NULL AND id = ?2) OR (?3 IS NOT NULL AND request_line_id = ?3)`,
          )
          .bind(canvassId, canvass.linked_deliverable_id, canvass.linked_request_line_id, timestamp),
      );
    }
    statements.push(
      idempotencyStatement(db, 'selectPreferredCanvass', mutation, account.id, result),
      ...revisionStatements(db, ['procurement', 'restocking']),
    );
    await db.batch(statements);
    return result;
  }

  async function transitionDeliverable({ account, command, correlationId }) {
    assertCapability(account, METHOD_CAPABILITIES.transitionDeliverable);
    const deliverableId = requiredText(command.deliverableId, 'deliverableId', 80);
    const target = requiredText(command.status ?? command.toStatus, 'status', 40).toUpperCase();
    const reason = requiredText(command.note ?? command.reason, 'reason', 500);
    const deliverable = await db
      .prepare(
        `SELECT deliverable.*, request.owner_committee_id,
           request.requester_account_id AS owner_account_id
         FROM deliverables deliverable
         JOIN requests request ON request.id = deliverable.request_id
         WHERE deliverable.id = ?1`,
      )
      .bind(deliverableId)
      .first();
    if (!deliverable) {
      throw new ApiError('DELIVERABLE_NOT_FOUND', 'The deliverable was not found.', { status: 404 });
    }
    assertEntityScope(account, {
      committeeId: deliverable.assigned_committee_id ?? deliverable.owner_committee_id,
      ownerAccountId: deliverable.owner_account_id,
    });
    if (!DELIVERABLE_TRANSITIONS[deliverable.status]?.includes(target)) {
      throw new ApiError(
        'INVALID_TRANSITION',
        `The deliverable cannot move from ${deliverable.status} to ${target}.`,
        { status: 409 },
      );
    }
    if (target === 'WAITING_FOR_BUDGET' && !deliverable.preferred_canvass_id) {
      throw new ApiError(
        'PREFERRED_QUOTE_REQUIRED',
        'Select one active preferred canvass before budget routing.',
        { status: 409 },
      );
    }
    const mutation = await replay(db, 'transitionDeliverable', command.clientRequestId, account.id, command);
    if (mutation.replayed) return mutation.value;
    const timestamp = nowIso();
    const result = { deliverableId, id: deliverableId, status: target, correlationId };
    await db.batch([
      db
        .prepare(
          `UPDATE deliverables
           SET status = ?2, procurement_status = ?2,
             budget_status = CASE
               WHEN ?2 = 'WAITING_FOR_BUDGET' THEN 'WAITING'
               WHEN ?2 IN ('TO_BE_PROCURED', 'PROCURED', 'PARTIALLY_RECEIVED', 'READY_TO_RELEASE')
                 THEN 'CLEARED'
               ELSE budget_status END,
             assigned_committee_id = COALESCE(?3, assigned_committee_id),
             assigned_account_id = COALESCE(?4, assigned_account_id),
             notes = CASE WHEN notes = '' THEN ?5 ELSE notes || ' | ' || ?5 END,
             updated_at = ?6
           WHERE id = ?1 AND status = ?7`,
        )
        .bind(
          deliverableId,
          target,
          optionalText(command.assignedCommitteeId, 80) || null,
          optionalText(command.assignedAccountId, 80) || null,
          reason,
          timestamp,
          deliverable.status,
        ),
      db
        .prepare(
          `UPDATE request_lines SET status = ?2, updated_at = ?3
           WHERE id = ?1 AND status = ?4`,
        )
        .bind(deliverable.request_line_id, target, timestamp, deliverable.status),
      db.prepare('UPDATE requests SET updated_at = ?2 WHERE id = ?1').bind(deliverable.request_id, timestamp),
      historyStatement(db, {
        entityType: 'DELIVERABLE',
        entityId: deliverableId,
        previousStatus: deliverable.status,
        newStatus: target,
        accountId: account.id,
        idempotencyKey: mutation.key,
        reason,
      }),
      auditStatement(db, {
        action: 'DELIVERABLE_TRANSITIONED',
        entityType: 'DELIVERABLE',
        entityId: deliverableId,
        accountId: account.id,
        correlationId,
        after: { previousStatus: deliverable.status, status: target },
      }),
      idempotencyStatement(db, 'transitionDeliverable', mutation, account.id, result),
      ...revisionStatements(db, ['procurement', 'request']),
    ]);
    return result;
  }

  async function getRestockDetail({ account, command, correlationId }) {
    assertCapability(account, METHOD_CAPABILITIES.getRestockDetail);
    const restockId = optionalText(command.restockRequestId ?? command.restockId, 80);
    const requestLineId = optionalText(command.requestLineId, 80);
    if (!restockId && !requestLineId) {
      throw new ApiError('VALIDATION_FAILED', 'A restock or request-line identifier is required.');
    }
    const restock = await db
      .prepare(
        `SELECT restock.*, line.workflow_revision, line.received_quantity AS line_received_quantity,
           request.requester_account_id AS owner_account_id
         FROM restock_requests restock
         LEFT JOIN request_lines line ON line.id = restock.source_request_line_id
         LEFT JOIN requests request ON request.id = restock.source_request_id
         WHERE (?1 <> '' AND restock.id = ?1) OR
           (?2 <> '' AND restock.source_request_line_id = ?2)
         ORDER BY restock.updated_at DESC LIMIT 1`,
      )
      .bind(restockId, requestLineId)
      .first();
    if (!restock) {
      throw new ApiError('RESTOCK_NOT_FOUND', 'The selected restock request was not found.', {
        status: 404,
      });
    }
    assertEntityScope(account, {
      committeeId: restock.assigned_committee_id,
      ownerAccountId: restock.owner_account_id ?? restock.created_by,
    });
    const receipt = await db
      .prepare(
        'SELECT COALESCE(SUM(quantity), 0) AS received FROM restock_receipts WHERE restock_request_id = ?1',
      )
      .bind(restock.id)
      .first();
    const preferred = await db
      .prepare(
        `SELECT id, supplier_name, price, unit, checked_at
         FROM canvass_references
         WHERE status = 'ACTIVE' AND preferred = 1 AND
           (linked_restock_id = ?1 OR linked_request_line_id = ?2)
         ORDER BY updated_at DESC`,
      )
      .bind(restock.id, restock.source_request_line_id)
      .all();
    const received = Number(receipt?.received ?? 0);
    const reconciliationRequired =
      received !== Number(restock.received_quantity) ||
      received !== Number(restock.line_received_quantity ?? received);
    const preferredRows = preferred.results ?? [];
    return {
      ok: true,
      correlationId,
      restock: {
        id: restock.id,
        requestId: restock.source_request_id,
        requestLineId: restock.source_request_line_id,
        itemId: restock.item_id,
        quantityOrdered: Number(restock.requested_quantity),
        receivedQuantity: received,
        remainingQuantity: Number(restock.requested_quantity) - received,
        unit: restock.unit,
        status: restock.status,
        workflowRevision: Number(restock.workflow_revision ?? 1),
        preferredQuote:
          preferredRows.length === 1
            ? {
                id: preferredRows[0].id,
                supplierName: preferredRows[0].supplier_name,
                price: Number(preferredRows[0].price),
                unit: preferredRows[0].unit,
                checkedAt: preferredRows[0].checked_at,
              }
            : null,
        preferredQuoteConflict: preferredRows.length > 1,
        reconciliationRequired,
      },
    };
  }

  async function transitionRestock({ account, command, correlationId }) {
    assertCapability(account, METHOD_CAPABILITIES.transitionRestock);
    const restockId = requiredText(command.restockRequestId ?? command.restockId, 'restockRequestId', 80);
    const action = requiredText(command.action, 'action', 40).toUpperCase();
    const rule = RESTOCK_TRANSITIONS[action];
    if (!rule) throw new ApiError('RESTOCK_ACTION_INVALID', 'Choose an approved restock action.');
    const reason = requiredText(command.reason, 'reason', 500);
    const restock = await db
      .prepare(
        `SELECT restock.*, line.status AS line_status, line.workflow_revision,
           request.requester_account_id AS owner_account_id
         FROM restock_requests restock
         LEFT JOIN request_lines line ON line.id = restock.source_request_line_id
         LEFT JOIN requests request ON request.id = restock.source_request_id
         WHERE restock.id = ?1`,
      )
      .bind(restockId)
      .first();
    if (!restock) {
      throw new ApiError('RESTOCK_NOT_FOUND', 'The selected restock request was not found.', {
        status: 404,
      });
    }
    if (command.requestLineId && command.requestLineId !== restock.source_request_line_id) {
      throw new ApiError('RESTOCK_SCOPE_MISMATCH', 'The restock request and line do not match.', {
        status: 409,
      });
    }
    assertEntityScope(account, {
      committeeId: restock.assigned_committee_id,
      ownerAccountId: restock.owner_account_id ?? restock.created_by,
    });
    const currentStatus = restock.line_status ?? restock.status;
    if (!rule.from.includes(currentStatus)) {
      throw new ApiError('INVALID_TRANSITION', `The restock action is not allowed from ${currentStatus}.`, {
        status: 409,
      });
    }
    const expectedRevision = Number(command.expectedRevision);
    const currentRevision = Number(restock.workflow_revision ?? 1);
    if (!Number.isInteger(expectedRevision) || expectedRevision !== currentRevision) {
      throw new ApiError('REVISION_CONFLICT', 'The restock line changed. Refresh before acting.', {
        status: 409,
      });
    }
    const preferred = await db
      .prepare(
        `SELECT COUNT(*) AS count FROM canvass_references
         WHERE status = 'ACTIVE' AND preferred = 1 AND
           (linked_restock_id = ?1 OR linked_request_line_id = ?2)`,
      )
      .bind(restock.id, restock.source_request_line_id)
      .first();
    if (rule.requiresPreferred && Number(preferred?.count ?? 0) !== 1) {
      throw new ApiError('PREFERRED_QUOTE_REQUIRED', 'Select exactly one active preferred quote first.', {
        status: 409,
      });
    }
    const mutation = await replay(db, 'transitionRestock', command.clientRequestId, account.id, command);
    if (mutation.replayed) return mutation.value;
    const timestamp = nowIso();
    const nextRevision = currentRevision + 1;
    const result = {
      restockId,
      restockRequestId: restockId,
      requestLineId: restock.source_request_line_id,
      status: rule.to,
      workflowRevision: nextRevision,
      correlationId,
    };
    await db.batch([
      db
        .prepare(
          `UPDATE restock_requests SET status = ?2,
             notes = CASE WHEN notes = '' THEN ?3 ELSE notes || ' | ' || ?3 END,
             updated_at = ?4
           WHERE id = ?1 AND status = ?5`,
        )
        .bind(restockId, rule.to, reason, timestamp, restock.status),
      db
        .prepare(
          `UPDATE request_lines SET status = ?2, workflow_revision = ?3, updated_at = ?4
           WHERE id = ?1 AND workflow_revision = ?5`,
        )
        .bind(restock.source_request_line_id, rule.to, nextRevision, timestamp, currentRevision),
      db
        .prepare('UPDATE requests SET updated_at = ?2 WHERE id = ?1')
        .bind(restock.source_request_id, timestamp),
      historyStatement(db, {
        entityType: 'REQUEST_LINE',
        entityId: restock.source_request_line_id,
        previousStatus: currentStatus,
        newStatus: rule.to,
        accountId: account.id,
        idempotencyKey: mutation.key,
        reason,
      }),
      auditStatement(db, {
        action: 'RESTOCK_TRANSITIONED',
        entityType: 'RESTOCK',
        entityId: restockId,
        accountId: account.id,
        correlationId,
        after: { action, status: rule.to, workflowRevision: nextRevision },
      }),
      idempotencyStatement(db, 'transitionRestock', mutation, account.id, result),
      ...revisionStatements(db, ['restocking', 'request']),
    ]);
    return result;
  }

  async function submitRequest({ account, command, correlationId }) {
    assertCapability(account, METHOD_CAPABILITIES.submitRequest);
    const mutation = await replay(db, 'submitRequest', command.clientRequestId, account.id, command);
    if (mutation.replayed) return mutation.value;
    const lines = Array.isArray(command.lines) ? command.lines : [];
    if (!lines.length || lines.length > 50) {
      throw new ApiError('VALIDATION_FAILED', 'At least one request line is required.');
    }
    const timestamp = nowIso();
    const requestId = createId('REQ');
    const committeeId = ownerCommitteeId(account, command.ownerCommitteeId);
    const eventSeriesId = optionalText(command.eventSeriesId, 80) || null;
    const eventId = optionalText(command.eventId, 80) || null;
    let eventDayId = null;
    if (eventSeriesId || eventId) {
      if (!eventSeriesId || !eventId) {
        throw new ApiError('VALIDATION_FAILED', 'Event-linked requests require a main event and activity.');
      }
      const event = await db
        .prepare(
          `SELECT event.event_day_id FROM events event
           JOIN event_series series ON series.id = event.event_series_id
           JOIN event_days day ON day.id = event.event_day_id
           WHERE event.id = ?1 AND event.event_series_id = ?2 AND event.active = 1
             AND day.active = 1 AND series.status = 'ACTIVE'`,
        )
        .bind(eventId, eventSeriesId)
        .first();
      if (!event) {
        throw new ApiError('REQUEST_EVENT_UNAVAILABLE', 'The selected event activity is unavailable.', {
          status: 409,
        });
      }
      eventDayId = event.event_day_id;
    }
    const result = { requestId, id: requestId, status: 'FOR_REVIEW', correlationId };
    const statements = [
      db
        .prepare(
          `INSERT INTO requests (
             id, request_type, request_stage, event_series_id, event_day_id, event_id, catalog_type,
             requester_account_id, requester_name, requester_email, department, priority, owner_committee_id,
             purpose, status, client_request_id, notes, created_at, updated_at, created_by
           ) VALUES (?1, ?2, 'REVIEW', ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12,
              ?13, 'FOR_REVIEW', ?14, ?15, ?16, ?16, ?7)`,
        )
        .bind(
          requestId,
          requiredText(command.requestType ?? 'EVENT_LOGISTICS', 'requestType', 64),
          eventSeriesId,
          eventDayId,
          eventId,
          optionalText(command.catalogType, 80),
          account.id,
          optionalText(command.requesterName ?? account.profile?.fullName, 120),
          optionalText(command.requesterEmail ?? account.profile?.email, 254),
          optionalText(command.department ?? command.requesterGroup, 120),
          optionalText(command.priority || 'NORMAL', 40),
          committeeId,
          requiredText(command.purpose ?? command.eventName, 'purpose', 500),
          mutation.key,
          optionalText(command.notes, 1000),
          timestamp,
        ),
    ];
    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      const itemId = optionalText(line.itemId, 80) || null;
      let unit = requiredText(line.unit, `lines[${index}].unit`, 40);
      if (itemId) {
        const item = await db
          .prepare("SELECT unit FROM inventory_items WHERE id = ?1 AND status = 'ACTIVE'")
          .bind(itemId)
          .first();
        if (!item) {
          throw new ApiError('ITEM_NOT_FOUND', `lines[${index}].itemId is unavailable.`, { status: 404 });
        }
        if (String(unit).trim().toLowerCase() !== String(item.unit).trim().toLowerCase()) {
          throw new ApiError('UNIT_MISMATCH', `lines[${index}].unit must match the catalog item.`, {
            details: { field: `lines[${index}].unit` },
          });
        }
        unit = item.unit;
      }
      const quantity = positiveOperationalQuantity(
        line.quantity ?? line.requestedQuantity,
        unit,
        `lines[${index}].quantity`,
      );
      statements.push(
        db
          .prepare(
            `INSERT INTO request_lines (
               id, request_id, event_id, item_id, description, specification, category,
               requested_quantity, unit, fulfillment_source, split_group_id, needed_at,
               return_due_at, status, client_line_id, notes, created_at, updated_at, created_by
             ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12,
               ?13, 'FOR_REVIEW', ?14, ?15, ?16, ?16, ?17)`,
          )
          .bind(
            createId('LIN'),
            requestId,
            optionalText(line.eventId ?? command.eventId, 80) || null,
            itemId,
            requiredText(line.description ?? line.itemName, `lines[${index}].description`, 240),
            optionalText(line.specification, 1000),
            optionalText(line.category, 120),
            quantity,
            unit,
            requiredText(line.fulfillmentSource ?? 'FOR_CANVASSING', `lines[${index}].fulfillmentSource`, 64),
            optionalText(line.splitGroupId, 80) || null,
            optionalText(line.neededAt, 64) || null,
            optionalText(line.returnDue, 64) || null,
            optionalText(line.clientLineId, 80) || `line-${index + 1}`,
            optionalText(line.notes, 500),
            timestamp,
            account.id,
          ),
      );
    }
    statements.push(
      historyStatement(db, {
        entityType: 'REQUEST',
        entityId: requestId,
        newStatus: 'FOR_REVIEW',
        accountId: account.id,
        idempotencyKey: mutation.key,
        reason: 'Request submitted; no physical stock movement posted.',
      }),
      auditStatement(db, {
        action: 'REQUEST_SUBMITTED',
        entityType: 'REQUEST',
        entityId: requestId,
        accountId: account.id,
        correlationId,
        after: { status: 'FOR_REVIEW', lineCount: lines.length },
      }),
      idempotencyStatement(db, 'submitRequest', mutation, account.id, result),
      ...revisionStatements(db, ['request']),
    );
    await db.batch(statements);
    return result;
  }

  async function requesterRequestPortal({ account, correlationId }) {
    assertRequesterPortalAccount(account);
    const eventSeries = await rows(
      db,
      `SELECT id, code, name
       FROM event_series
       WHERE status = 'ACTIVE'
       ORDER BY name`,
    );
    const events = await rows(
      db,
      `SELECT events.id, events.event_series_id, events.event_day_id, events.name,
              events.activity_type, events.time_status, events.starts_at, events.ends_at, events.venue
       FROM events
       JOIN event_days day ON day.id = events.event_day_id
       WHERE events.active = 1 AND day.active = 1 AND events.status NOT IN ('COMPLETED', 'CANCELLED')
       ORDER BY events.starts_at, events.name`,
    );
    const requests = await rows(
      db,
      `SELECT request.id, request.request_type, request.request_stage,
              request.parent_request_id, request.additional_sequence,
              request.event_series_id, request.event_id, request.purpose,
              request.status, request.created_at, request.updated_at,
              series.name AS event_name, event.name AS sub_event_name
       FROM requests request
       LEFT JOIN event_series series ON series.id = request.event_series_id
       LEFT JOIN events event ON event.id = request.event_id
       WHERE request.requester_account_id = ?1
         AND request.requester_department_id = ?2
         AND request.archived_at IS NULL
       ORDER BY request.updated_at DESC`,
      [account.id, account.departmentId],
    );
    const requestLines = await rows(
      db,
      `SELECT line.request_id, line.description, line.specification, line.category,
              line.requested_quantity, line.unit, line.status
       FROM request_lines line
       JOIN requests request ON request.id = line.request_id
       WHERE request.requester_account_id = ?1
         AND request.requester_department_id = ?2
       ORDER BY line.created_at, line.id`,
      [account.id, account.departmentId],
    );
    const history = await rows(
      db,
      `SELECT entity_id, new_status, changed_at
       FROM status_history
       WHERE entity_type = 'REQUEST' AND entity_id IN (
         SELECT id FROM requests
         WHERE requester_account_id = ?1 AND requester_department_id = ?2
       )
       ORDER BY changed_at DESC LIMIT 200`,
      [account.id, account.departmentId],
    );
    return {
      ok: true,
      correlationId,
      profile: {
        displayName: account.departmentDisplayName,
        departmentId: account.departmentId,
      },
      eventSeries: eventSeries.map((series) => ({
        id: series.id,
        code: series.code,
        name: series.name,
      })),
      events: events.map((event) => ({
        id: event.id,
        seriesId: event.event_series_id,
        eventDayId: event.event_day_id,
        name: event.name,
        activityType: event.activity_type,
        timeStatus: event.time_status,
        startsAt: event.starts_at,
        endsAt: event.ends_at,
        venue: event.venue,
      })),
      choices: REQUEST_CENTER_CHOICES,
      units: REQUEST_CENTER_UNITS,
      requests: requests.map((request) => ({
        id: request.id,
        type: request.request_type,
        requestType: request.request_stage === 'ADDITIONAL' ? 'ADDITIONAL' : 'NEW',
        parentRequestId: request.parent_request_id ?? '',
        additionalSequence: Number(request.additional_sequence ?? 0),
        eventSeriesId: request.event_series_id ?? '',
        eventId: request.event_id ?? '',
        event: request.event_name ?? '',
        subEvent: request.sub_event_name ?? '',
        department: account.departmentDisplayName,
        purpose: request.purpose,
        status: request.status,
        createdAt: request.created_at,
        updatedAt: request.updated_at,
        lines: requestLines
          .filter((line) => line.request_id === request.id)
          .map((line) => ({
            description: line.description,
            specification: line.specification,
            category: line.category,
            quantity: Number(line.requested_quantity),
            unit: line.unit,
            status: line.status,
          })),
        history: history
          .filter((entry) => entry.entity_id === request.id)
          .map((entry) => ({ status: entry.new_status, at: entry.changed_at })),
      })),
    };
  }

  async function submitRequesterRequest({ account, command, correlationId }) {
    assertRequesterPortalAccount(account);
    const mutation = await replay(db, 'submitRequesterRequest', command.clientRequestId, account.id, command);
    if (mutation.replayed) return { ...mutation.value, replayed: true };
    const requestType = requiredText(command.requestType, 'requestType', 20).toUpperCase();
    if (!['NEW', 'ADDITIONAL'].includes(requestType)) {
      throw new ApiError('VALIDATION_FAILED', 'Choose New or Additional.', { status: 422 });
    }
    const eventSeriesId = requiredText(command.eventSeriesId, 'eventSeriesId', 80);
    const eventId = requiredText(command.eventId, 'eventId', 80);
    const event = await db
      .prepare(
        `SELECT event.id, event.name, event.event_day_id, series.name AS event_name
         FROM events event
         JOIN event_series series ON series.id = event.event_series_id
         WHERE event.id = ?1 AND event.event_series_id = ?2
           AND event.active = 1 AND event.status NOT IN ('COMPLETED', 'CANCELLED')
           AND series.status = 'ACTIVE'`,
      )
      .bind(eventId, eventSeriesId)
      .first();
    if (!event) {
      throw new ApiError('REQUEST_EVENT_UNAVAILABLE', 'The selected Event or Sub-event is unavailable.', {
        status: 409,
      });
    }
    let parent = null;
    let additionalSequence = 0;
    if (requestType === 'NEW') {
      const duplicate = await db
        .prepare(
          `SELECT id FROM requests
           WHERE requester_department_id = ?1 AND event_series_id = ?2 AND event_id = ?3
             AND request_stage = 'INITIAL' AND archived_at IS NULL
             AND status NOT IN ('CANCELLED', 'REJECTED', 'COMPLETED')
           ORDER BY created_at LIMIT 1`,
        )
        .bind(account.departmentId, eventSeriesId, eventId)
        .first();
      if (duplicate) {
        throw new ApiError(
          'REQUEST_ALREADY_EXISTS',
          `Active request ${duplicate.id} already exists for this department, Event, and Sub-event. Open it and submit an Additional request instead.`,
          { status: 409 },
        );
      }
    } else {
      const parentRequestId = requiredText(command.parentRequestId, 'parentRequestId', 80);
      parent = await db
        .prepare(
          `SELECT id, status FROM requests
           WHERE id = ?1 AND requester_account_id = ?2 AND requester_department_id = ?3
             AND event_series_id = ?4 AND event_id = ?5 AND archived_at IS NULL
             AND status NOT IN ('CANCELLED', 'REJECTED')`,
        )
        .bind(parentRequestId, account.id, account.departmentId, eventSeriesId, eventId)
        .first();
      if (!parent) {
        throw new ApiError(
          'REQUEST_PARENT_UNAVAILABLE',
          'The selected parent request is not available to this department for the chosen Event and Sub-event.',
          { status: 404 },
        );
      }
      const sequence = await db
        .prepare(
          `SELECT COALESCE(MAX(additional_sequence), 0) + 1 AS next_sequence
           FROM requests WHERE parent_request_id = ?1`,
        )
        .bind(parent.id)
        .first();
      additionalSequence = Number(sequence?.next_sequence ?? 1);
    }

    const sourceLines = Array.isArray(command.lines) ? command.lines : [];
    if (!sourceLines.length || sourceLines.length > 50) {
      throw new ApiError('VALIDATION_FAILED', 'Add between 1 and 50 requested items.', { status: 422 });
    }
    const lines = [];
    const duplicateKeys = new Set();
    for (const [index, source] of sourceLines.entries()) {
      const category = requiredText(source.category, `lines[${index}].category`, 40);
      if (!Object.values(REQUEST_CENTER_CATEGORIES).includes(category)) {
        throw new ApiError('VALIDATION_FAILED', `lines[${index}].category is invalid.`, { status: 422 });
      }
      const description = requiredText(source.description, `lines[${index}].description`, 240);
      const custom = source.custom === true || category === REQUEST_CENTER_CATEGORIES.OTHER;
      if (!custom && !isApprovedRequestCenterChoice(category, description)) {
        throw new ApiError('VALIDATION_FAILED', `lines[${index}] is not an approved choice.`, {
          status: 422,
        });
      }
      const unit = requiredText(source.unit, `lines[${index}].unit`, 40).toLowerCase();
      if (!REQUEST_CENTER_UNITS.includes(unit)) {
        throw new ApiError('VALIDATION_FAILED', `lines[${index}].unit is invalid.`, { status: 422 });
      }
      const duplicateKey = `${category}:${description}`.toLocaleLowerCase('en-US');
      if (duplicateKeys.has(duplicateKey)) {
        throw new ApiError('VALIDATION_FAILED', `Duplicate requested item: ${description}.`, { status: 422 });
      }
      duplicateKeys.add(duplicateKey);
      lines.push({
        category,
        description,
        quantity: positiveOperationalQuantity(source.quantity, unit, `lines[${index}].quantity`),
        unit,
        specification: optionalText(source.specification, 1000),
      });
    }

    const purpose = requiredText(command.purpose, 'purpose', 500);
    const timestamp = nowIso();
    const requestId = createId('REQ');
    const result = {
      ok: true,
      id: requestId,
      requestId,
      requestType,
      parentRequestId: parent?.id ?? '',
      department: account.departmentDisplayName,
      event: event.event_name,
      subEvent: event.name,
      submittedAt: timestamp,
      status: 'FOR_REVIEW',
      lines,
      replayed: false,
      correlationId,
    };
    const statements = [
      db
        .prepare(
          `INSERT INTO requests (
             id, request_type, request_stage, parent_request_id, additional_sequence,
             event_series_id, event_day_id, event_id, catalog_type, requester_account_id,
             requester_name, requester_email, department, priority, owner_committee_id,
             purpose, status, client_request_id, notes, created_at, updated_at,
             created_by, requester_department_id
           ) VALUES (?1, 'EVENT_LOGISTICS', ?2, ?3, ?4, ?5, ?6, ?7, '', ?8,
              ?9, ?10, ?11, 'NORMAL', NULL, ?12, 'FOR_REVIEW', ?13, '', ?14, ?14,
              ?8, ?15)`,
        )
        .bind(
          requestId,
          requestType === 'ADDITIONAL' ? 'ADDITIONAL' : 'INITIAL',
          parent?.id ?? null,
          additionalSequence,
          eventSeriesId,
          event.event_day_id,
          eventId,
          account.id,
          account.departmentDisplayName,
          account.profile?.email ?? '',
          account.departmentDisplayName,
          purpose,
          mutation.key,
          timestamp,
          account.departmentId,
        ),
    ];
    lines.forEach((line, index) => {
      statements.push(
        db
          .prepare(
            `INSERT INTO request_lines (
               id, request_id, event_id, item_id, description, specification, category,
               requested_quantity, unit, fulfillment_source, status, client_line_id,
               created_at, updated_at, created_by
             ) VALUES (?1, ?2, ?3, NULL, ?4, ?5, ?6, ?7, ?8,
               'PENDING_REVIEW', 'FOR_REVIEW', ?9, ?10, ?10, ?11)`,
          )
          .bind(
            createId('LIN'),
            requestId,
            eventId,
            line.description,
            line.specification,
            line.category,
            line.quantity,
            line.unit,
            `request-center-line-${index + 1}`,
            timestamp,
            account.id,
          ),
      );
    });
    statements.push(
      historyStatement(db, {
        entityType: 'REQUEST',
        entityId: requestId,
        newStatus: 'FOR_REVIEW',
        accountId: account.id,
        idempotencyKey: mutation.key,
        reason: 'Authenticated department request submitted; no stock movement posted.',
      }),
      auditStatement(db, {
        action: requestType === 'ADDITIONAL' ? 'REQUEST_ADDITIONAL_SUBMITTED' : 'REQUEST_SUBMITTED',
        entityType: 'REQUEST',
        entityId: requestId,
        accountId: account.id,
        correlationId,
        after: {
          status: 'FOR_REVIEW',
          requestType,
          parentRequestId: parent?.id ?? '',
          departmentId: account.departmentId,
          lineCount: lines.length,
        },
      }),
      idempotencyStatement(db, 'submitRequesterRequest', mutation, account.id, result),
      ...revisionStatements(db, ['request'], timestamp),
    );
    try {
      await db.batch(statements);
    } catch (error) {
      if (String(error?.message ?? '').includes('UNIQUE constraint failed')) {
        const replayed = await replay(
          db,
          'submitRequesterRequest',
          command.clientRequestId,
          account.id,
          command,
        );
        if (replayed.replayed) return { ...replayed.value, replayed: true };
        throw new ApiError('REQUEST_CONFLICT', 'This request is already being processed.', {
          status: 409,
        });
      }
      throw error;
    }
    return result;
  }

  async function cancelRequesterRequest({ account, command, correlationId }) {
    assertRequesterPortalAccount(account);
    const requestId = requiredText(command.requestId, 'requestId', 80);
    const mutation = await replay(db, 'cancelRequesterRequest', command.clientRequestId, account.id, command);
    if (mutation.replayed) return mutation.value;
    const request = await db
      .prepare('SELECT status, requester_account_id FROM requests WHERE id = ?1')
      .bind(requestId)
      .first();
    if (!request || request.requester_account_id !== account.id) {
      throw new ApiError('REQUEST_NOT_FOUND', 'The request was not found.', { status: 404 });
    }
    if (request.status !== 'FOR_REVIEW') {
      throw new ApiError('REQUEST_CANCELLATION_NOT_ALLOWED', 'This request can no longer be cancelled.', {
        status: 409,
      });
    }
    const timestamp = nowIso();
    const result = { id: requestId, requestId, status: 'CANCELLED', correlationId };
    await db.batch([
      db
        .prepare(
          "UPDATE requests SET status = 'CANCELLED', updated_at = ?2 WHERE id = ?1 AND status = 'FOR_REVIEW'",
        )
        .bind(requestId, timestamp),
      db
        .prepare(
          "UPDATE request_lines SET status = 'CANCELLED', updated_at = ?2 WHERE request_id = ?1 AND status = 'FOR_REVIEW'",
        )
        .bind(requestId, timestamp),
      historyStatement(db, {
        entityType: 'REQUEST',
        entityId: requestId,
        previousStatus: 'FOR_REVIEW',
        newStatus: 'CANCELLED',
        accountId: account.id,
        idempotencyKey: mutation.key,
        reason: 'Cancelled by requester.',
      }),
      auditStatement(db, {
        action: 'REQUEST_CANCELLED_BY_REQUESTER',
        entityType: 'REQUEST',
        entityId: requestId,
        accountId: account.id,
        correlationId,
      }),
      idempotencyStatement(db, 'cancelRequesterRequest', mutation, account.id, result),
      ...revisionStatements(db, ['request']),
    ]);
    return result;
  }

  async function reserveStock({ account, command, correlationId }) {
    assertCapability(account, METHOD_CAPABILITIES.reserveStock);
    const itemId = requiredText(command.itemId, 'itemId', 80);
    const requestLineId = optionalText(command.requestLineId, 80);
    if (entityScope(account).mode !== 'ALL' && !requestLineId) {
      throw new ApiError('ENTITY_SCOPE_REQUIRED', 'A scoped request line is required for this reservation.', {
        status: 403,
      });
    }
    if (requestLineId) {
      const requestScope = await db
        .prepare(
          `SELECT request.owner_committee_id, request.requester_account_id
           FROM request_lines line JOIN requests request ON request.id = line.request_id
           WHERE line.id = ?1`,
        )
        .bind(requestLineId)
        .first();
      if (!requestScope)
        throw new ApiError('REQUEST_LINE_NOT_FOUND', 'The request line was not found.', { status: 404 });
      assertEntityScope(account, {
        committeeId: requestScope.owner_committee_id,
        ownerAccountId: requestScope.requester_account_id,
      });
    }
    const mutation = await replay(db, 'reserveStock', command.clientRequestId, account.id, command);
    if (mutation.replayed) return mutation.value;
    const item = await db
      .prepare('SELECT unit FROM inventory_items WHERE id = ?1 AND status = ?2')
      .bind(itemId, 'ACTIVE')
      .first();
    if (!item) throw new ApiError('ITEM_NOT_FOUND', 'The inventory item was not found.', { status: 404 });
    const quantity = positiveOperationalQuantity(command.quantity, item.unit);
    const reservationId = createId('RSV');
    const result = { reservationId, id: reservationId, itemId, quantity, status: 'ACTIVE', correlationId };
    const inserted = db
      .prepare(
        `INSERT INTO reservations (
           id, item_id, quantity, unit, request_line_id, lending_ticket_id, status,
           idempotency_key, notes, created_at, updated_at, created_by
         ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, 'ACTIVE', ?7, ?8, ?9, ?9, ?10)`,
      )
      .bind(
        reservationId,
        itemId,
        quantity,
        item.unit,
        requestLineId || null,
        optionalText(command.lendingTicketId, 80) || null,
        mutation.key,
        optionalText(command.notes, 500),
        nowIso(),
        account.id,
      );
    try {
      await db.batch([
        inserted,
        db
          .prepare(
            `UPDATE request_lines
             SET status = 'READY_TO_RELEASE', updated_at = ?2
             WHERE id = ?1 AND status IN ('READY_TO_RESERVE', 'ACCEPTED')`,
          )
          .bind(requestLineId, nowIso()),
        idempotencyStatement(db, 'reserveStock', mutation, account.id, result),
        ...revisionStatements(db, ['inventory', 'request']),
      ]);
    } catch (error) {
      if (String(error?.message ?? '').includes('insufficient available-to-promise')) {
        throw new ApiError('INSUFFICIENT_STOCK', 'Available stock is insufficient for this reservation.', {
          status: 409,
        });
      }
      throw error;
    }
    await db.batch([
      auditStatement(db, {
        action: 'STOCK_RESERVED',
        entityType: 'RESERVATION',
        entityId: reservationId,
        accountId: account.id,
        correlationId,
        after: { itemId, quantity },
      }),
    ]);
    return result;
  }

  async function createLendingTicket({ account, command, correlationId }) {
    assertCapability(account, METHOD_CAPABILITIES.createLendingTicket);
    const itemId = requiredText(command.itemId, 'itemId', 80);
    const catalogItem = await db
      .prepare(
        `SELECT id, unit, status, classification_status, inventory_kind, is_lendable,
           lending_status, lending_audience
         FROM inventory_items WHERE id = ?1`,
      )
      .bind(itemId)
      .first();
    if (
      !catalogItem ||
      catalogItem.status !== 'ACTIVE' ||
      catalogItem.classification_status !== 'CLASSIFIED' ||
      catalogItem.inventory_kind === 'UNVERIFIED' ||
      catalogItem.is_lendable !== 1 ||
      catalogItem.lending_status !== 'ACTIVE'
    ) {
      throw new ApiError(
        'LENDING_ITEM_UNAVAILABLE',
        'That item is not classified and available for lending.',
        { status: 409 },
      );
    }
    if (requiredText(command.unit, 'unit', 40) !== catalogItem.unit) {
      throw new ApiError('LENDING_UNIT_MISMATCH', 'The lending unit no longer matches the catalog.', {
        status: 409,
      });
    }
    const mutation = await replay(db, 'createLendingTicket', command.clientRequestId, account.id, command);
    if (mutation.replayed) return mutation.value;
    const ticketId = createId('LND');
    const timestamp = nowIso();
    const committeeId = ownerCommitteeId(account, command.ownerCommitteeId);
    const result = { ticketId, id: ticketId, status: 'FOR_REVIEW', correlationId };
    const borrowerReference = requiredText(
      command.studentIdNumber ?? command.borrowerReference,
      'borrowerReference',
      32,
    );
    if (!/^\d{1,8}$/u.test(borrowerReference)) {
      throw new ApiError('BORROWER_REFERENCE_INVALID', 'The student ID must contain one to eight digits.');
    }
    await db.batch([
      db
        .prepare(
          `INSERT INTO lending_tickets (
             id, borrower_reference, borrower_name, borrower_type, department_organization,
             contact, item_id, quantity, unit, purpose, due_at, ticket_type, status,
             requested_item_id, requested_quantity, requested_start_at, requested_end_at,
             owner_committee_id, created_by, notes, created_at, updated_at
           ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12,
             'FOR_REVIEW', ?7, ?8, ?13, ?14, ?15, ?16, ?17, ?18, ?18)`,
        )
        .bind(
          ticketId,
          borrowerReference,
          optionalText(command.borrowerName, 120),
          requiredText(command.borrowerType, 'borrowerType', 40),
          optionalText(command.department ?? command.departmentOrganization, 120),
          optionalText(command.contact, 120),
          itemId,
          positiveOperationalQuantity(command.quantity, catalogItem.unit),
          requiredText(command.unit, 'unit', 40),
          requiredText(command.purpose, 'purpose', 500),
          optionalText(command.dueAt, 64) || null,
          requiredText(command.ticketType ?? 'LOAN', 'ticketType', 40),
          optionalText(command.requestedStartAt ?? command.pickupDate, 64) || null,
          optionalText(command.requestedEndAt ?? command.dueAt, 64) || null,
          committeeId,
          account.id,
          optionalText(command.notes, 500),
          timestamp,
        ),
      historyStatement(db, {
        entityType: 'LENDING',
        entityId: ticketId,
        newStatus: 'FOR_REVIEW',
        accountId: account.id,
        idempotencyKey: mutation.key,
      }),
      auditStatement(db, {
        action: 'LENDING_CREATED',
        entityType: 'LENDING',
        entityId: ticketId,
        accountId: account.id,
        correlationId,
      }),
      idempotencyStatement(db, 'createLendingTicket', mutation, account.id, result),
      ...revisionStatements(db, ['lending']),
    ]);
    return result;
  }

  async function borrowerLendingPortal({ account, correlationId }) {
    assertBorrowerPortalAccount(account);
    const items = await loadLendingCatalog(db);
    const tickets = await rows(
      db,
      `SELECT ticket.id, ticket.quantity, ticket.unit, ticket.purpose, ticket.due_at, ticket.ticket_type,
              ticket.status, ticket.created_at, ticket.updated_at, item.name AS item_name
       FROM lending_tickets ticket
       LEFT JOIN inventory_items item ON item.id = ticket.item_id
       WHERE ticket.created_by = ?1
       ORDER BY ticket.updated_at DESC`,
      [account.id],
    );
    const history = await rows(
      db,
      `SELECT entity_id, new_status, changed_at, reason
       FROM status_history
       WHERE entity_type = 'LENDING' AND entity_id IN (
         SELECT id FROM lending_tickets WHERE created_by = ?1
       )
       ORDER BY changed_at DESC LIMIT 200`,
      [account.id],
    );
    return {
      ok: true,
      correlationId,
      profile: {
        displayName: account.profile?.fullName ?? '',
        institutionId: account.institutionId,
      },
      items,
      tickets: tickets.map((ticket) => ({
        id: ticket.id,
        itemName: ticket.item_name ?? 'Requested item',
        quantity: Number(ticket.quantity),
        unit: ticket.unit,
        purpose: ticket.purpose,
        dueAt: ticket.due_at,
        type: ticket.ticket_type,
        status:
          ticket.status === 'ON_LOAN' && ticket.due_at && ticket.due_at < nowIso()
            ? 'OVERDUE'
            : ticket.status,
        createdAt: ticket.created_at,
        updatedAt: ticket.updated_at,
      })),
      history: history.map((entry) => ({
        ticketId: entry.entity_id,
        status: entry.new_status,
        at: entry.changed_at,
        note: entry.reason || '',
      })),
    };
  }

  async function submitBorrowerLendingRequest({ account, command, correlationId }) {
    assertBorrowerPortalAccount(account);
    const item = await db
      .prepare(
        `SELECT id, unit, lending_unit, lending_audience, lending_kind, lending_status,
                is_lendable, maximum_loan_quantity, default_loan_days, due_date_required,
                classification_status, inventory_kind
         FROM inventory_items WHERE id = ?1 AND status = 'ACTIVE'`,
      )
      .bind(requiredText(command.itemId, 'itemId', 80))
      .first();
    if (
      !item ||
      item.classification_status !== 'CLASSIFIED' ||
      item.inventory_kind === 'UNVERIFIED' ||
      item.is_lendable !== 1 ||
      item.lending_status !== 'ACTIVE' ||
      !['STUDENTS_AND_STAFF', 'USC_STAFF_ONLY'].includes(item.lending_audience)
    ) {
      throw new ApiError('LENDING_ITEM_UNAVAILABLE', 'That item is not available through Office Lending.', {
        status: 404,
      });
    }
    const quantity = positiveOperationalQuantity(command.quantity, item.lending_unit || item.unit);
    if (item.maximum_loan_quantity && quantity > Number(item.maximum_loan_quantity)) {
      throw new ApiError(
        'LENDING_QUANTITY_EXCEEDED',
        'The requested quantity exceeds the approved lending limit.',
      );
    }
    const ticketType = item.lending_kind === 'REUSABLE' ? 'LOAN' : 'CONSUMABLE';
    if (!['LOAN', 'CONSUMABLE'].includes(ticketType)) {
      throw new ApiError('LENDING_TYPE_INVALID', 'Choose a loan or consumable request.');
    }
    const dueAt = optionalText(command.dueAt, 64);
    if (
      item.due_date_required === 1 &&
      (!dueAt || Number.isNaN(Date.parse(dueAt)) || Date.parse(dueAt) <= Date.now())
    ) {
      throw new ApiError('LENDING_DUE_DATE_INVALID', 'A future requested due date is required for a loan.');
    }
    return createLendingTicket({
      account,
      correlationId,
      command: {
        ...command,
        borrowerReference: account.institutionId,
        borrowerName: account.profile?.fullName ?? '',
        borrowerType: 'INSTITUTION_APPROVED',
        contact: '',
        unit: item.lending_unit || item.unit,
        ticketType,
        dueAt: ticketType === 'LOAN' ? dueAt : '',
        requestedStartAt: optionalText(command.pickupDate, 64),
        requestedEndAt: ticketType === 'LOAN' ? dueAt : '',
      },
    });
  }

  async function cancelBorrowerLendingRequest({ account, command, correlationId }) {
    assertBorrowerPortalAccount(account);
    const ticketId = requiredText(command.ticketId, 'ticketId', 80);
    const mutation = await replay(
      db,
      'cancelBorrowerLendingRequest',
      command.clientRequestId,
      account.id,
      command,
    );
    if (mutation.replayed) return mutation.value;
    const ticket = await db
      .prepare('SELECT status, created_by FROM lending_tickets WHERE id = ?1')
      .bind(ticketId)
      .first();
    if (!ticket || ticket.created_by !== account.id) {
      throw new ApiError('LENDING_NOT_FOUND', 'The lending request was not found.', { status: 404 });
    }
    if (ticket.status !== 'FOR_REVIEW') {
      throw new ApiError(
        'LENDING_CANCELLATION_NOT_ALLOWED',
        'This lending request can no longer be cancelled.',
        { status: 409 },
      );
    }
    const result = { id: ticketId, ticketId, status: 'CANCELLED', correlationId };
    await db.batch([
      db
        .prepare(
          "UPDATE lending_tickets SET status = 'CANCELLED', updated_at = ?2 WHERE id = ?1 AND status = 'FOR_REVIEW'",
        )
        .bind(ticketId, nowIso()),
      historyStatement(db, {
        entityType: 'LENDING',
        entityId: ticketId,
        previousStatus: 'FOR_REVIEW',
        newStatus: 'CANCELLED',
        accountId: account.id,
        idempotencyKey: mutation.key,
        reason: 'Cancelled by borrower.',
      }),
      auditStatement(db, {
        action: 'LENDING_CANCELLED_BY_BORROWER',
        entityType: 'LENDING',
        entityId: ticketId,
        accountId: account.id,
        correlationId,
      }),
      idempotencyStatement(db, 'cancelBorrowerLendingRequest', mutation, account.id, result),
      ...revisionStatements(db, ['lending']),
    ]);
    return result;
  }

  async function registerInventoryAsset({ account, command, correlationId }) {
    assertCapability(account, METHOD_CAPABILITIES.registerInventoryAsset);
    const itemId = requiredText(command.itemId, 'itemId', 80);
    const item = await db
      .prepare(
        `SELECT id, inventory_kind, classification_status, condition_tracking
         FROM inventory_items
         WHERE id = ?1 AND status = 'ACTIVE'`,
      )
      .bind(itemId)
      .first();
    if (
      !item ||
      item.inventory_kind !== 'REUSABLE' ||
      item.classification_status !== 'CLASSIFIED' ||
      item.condition_tracking !== 1
    ) {
      throw new ApiError(
        'ASSET_ITEM_NOT_TRACEABLE',
        'Asset instances may be registered only for condition-tracked reusable items.',
        { status: 409 },
      );
    }
    const assetTag = requiredText(command.assetTag, 'assetTag', 80).toUpperCase();
    const condition = requiredText(command.conditionLabel ?? 'GOOD', 'conditionLabel', 24).toUpperCase();
    if (!['NEW', 'GOOD', 'FAIR', 'POOR', 'DAMAGED'].includes(condition)) {
      throw new ApiError('ASSET_CONDITION_INVALID', 'Choose an approved asset condition.');
    }
    const mutation = await replay(db, 'registerInventoryAsset', command.clientRequestId, account.id, command);
    if (mutation.replayed) return mutation.value;
    const assetId = createId('AST');
    const timestamp = nowIso();
    const photoKey = optionalText(command.photoAssetKey, 160);
    if (photoKey && !/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,159}$/u.test(photoKey)) {
      throw new ApiError('ASSET_KEY_INVALID', 'The governed asset key is invalid.');
    }
    const result = {
      id: assetId,
      assetId,
      itemId,
      assetTag,
      status: condition === 'DAMAGED' ? 'DAMAGED' : 'AVAILABLE',
      correlationId,
    };
    const statements = [
      db
        .prepare(
          `INSERT INTO inventory_asset_instances (
             id, item_id, asset_tag, serial_number, condition_label, lifecycle_status,
             created_at, updated_at, created_by, updated_by
           ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?7, ?8, ?8)`,
        )
        .bind(
          assetId,
          itemId,
          assetTag,
          optionalText(command.serialNumber, 120),
          condition,
          result.status,
          timestamp,
          account.id,
        ),
      db
        .prepare(
          `INSERT INTO inventory_asset_movements (
             id, asset_id, movement_type, new_status, condition_label,
             occurred_at, recorded_by, notes
           ) VALUES (?1, ?2, 'REGISTERED', ?3, ?4, ?5, ?6, ?7)`,
        )
        .bind(
          createId('AMV'),
          assetId,
          result.status,
          condition,
          timestamp,
          account.id,
          optionalText(command.notes, 500),
        ),
      auditStatement(db, {
        action: 'INVENTORY_ASSET_REGISTERED',
        entityType: 'INVENTORY_ASSET',
        entityId: assetId,
        accountId: account.id,
        correlationId,
        after: { itemId, assetTag, status: result.status },
      }),
      idempotencyStatement(db, 'registerInventoryAsset', mutation, account.id, result),
      ...revisionStatements(db, ['inventory', 'lending']),
    ];
    if (photoKey) {
      statements.push(
        db
          .prepare(
            `INSERT INTO inventory_asset_photos (
               id, asset_id, asset_key, photo_type, captured_at, recorded_by, notes
             ) VALUES (?1, ?2, ?3, 'CATALOG', ?4, ?5, ?6)`,
          )
          .bind(createId('APH'), assetId, photoKey, timestamp, account.id, optionalText(command.notes, 500)),
      );
    }
    try {
      await db.batch(statements);
    } catch (error) {
      if (String(error?.message ?? '').includes('UNIQUE constraint failed')) {
        throw new ApiError('ASSET_TAG_CONFLICT', 'That asset tag is already registered.', {
          status: 409,
        });
      }
      throw error;
    }
    return result;
  }

  async function recordAssetMaintenance({ account, command, correlationId }) {
    assertCapability(account, METHOD_CAPABILITIES.recordAssetMaintenance);
    const assetId = requiredText(command.assetId, 'assetId', 80);
    const eventType = requiredText(command.eventType, 'eventType', 32).toUpperCase();
    if (!['OPENED', 'INSPECTED', 'REPAIRED', 'COMPLETED', 'DECLARED_DAMAGED'].includes(eventType)) {
      throw new ApiError('ASSET_MAINTENANCE_EVENT_INVALID', 'Choose an approved maintenance event.');
    }
    const asset = await db
      .prepare(
        `SELECT id, lifecycle_status, current_lending_ticket_id
         FROM inventory_asset_instances WHERE id = ?1`,
      )
      .bind(assetId)
      .first();
    if (!asset) throw new ApiError('ASSET_NOT_FOUND', 'The asset instance was not found.', { status: 404 });
    if (asset.current_lending_ticket_id || ['ON_LOAN', 'RESERVED'].includes(asset.lifecycle_status)) {
      throw new ApiError(
        'ASSET_CURRENTLY_ASSIGNED',
        'Complete the active lending workflow before changing maintenance state.',
        { status: 409 },
      );
    }
    const mutation = await replay(db, 'recordAssetMaintenance', command.clientRequestId, account.id, command);
    if (mutation.replayed) return mutation.value;
    const nextStatus =
      eventType === 'COMPLETED' ? 'AVAILABLE' : eventType === 'DECLARED_DAMAGED' ? 'DAMAGED' : 'MAINTENANCE';
    const condition = optionalText(command.conditionLabel, 24).toUpperCase();
    const evidenceKey = optionalText(command.evidenceAssetKey, 160);
    if (evidenceKey && !/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,159}$/u.test(evidenceKey)) {
      throw new ApiError('ASSET_KEY_INVALID', 'The governed evidence asset key is invalid.');
    }
    const timestamp = nowIso();
    const result = { id: assetId, assetId, status: nextStatus, eventType, correlationId };
    const statements = [
      db
        .prepare(
          `INSERT INTO inventory_asset_maintenance (
             id, asset_id, event_type, condition_label, evidence_asset_key,
             occurred_at, recorded_by, notes
           ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)`,
        )
        .bind(
          createId('AMT'),
          assetId,
          eventType,
          condition,
          evidenceKey,
          timestamp,
          account.id,
          optionalText(command.notes, 500),
        ),
      db
        .prepare(
          `INSERT INTO inventory_asset_movements (
             id, asset_id, movement_type, previous_status, new_status, condition_label,
             evidence_asset_key, occurred_at, recorded_by, notes
           ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)`,
        )
        .bind(
          createId('AMV'),
          assetId,
          eventType === 'COMPLETED' ? 'RESTORED' : 'MAINTENANCE',
          asset.lifecycle_status,
          nextStatus,
          condition,
          evidenceKey,
          timestamp,
          account.id,
          optionalText(command.notes, 500),
        ),
      db
        .prepare(
          `UPDATE inventory_asset_instances
           SET lifecycle_status = ?2,
               condition_label = CASE WHEN ?3 = '' THEN condition_label ELSE ?3 END,
               updated_at = ?4, updated_by = ?5
           WHERE id = ?1`,
        )
        .bind(assetId, nextStatus, condition, timestamp, account.id),
      auditStatement(db, {
        action: 'INVENTORY_ASSET_MAINTENANCE_RECORDED',
        entityType: 'INVENTORY_ASSET',
        entityId: assetId,
        accountId: account.id,
        correlationId,
        after: { eventType, status: nextStatus },
      }),
      idempotencyStatement(db, 'recordAssetMaintenance', mutation, account.id, result),
      ...revisionStatements(db, ['inventory', 'lending']),
    ];
    if (evidenceKey) {
      statements.push(
        db
          .prepare(
            `INSERT INTO inventory_asset_photos (
               id, asset_id, asset_key, photo_type, captured_at, recorded_by, notes
             ) VALUES (?1, ?2, ?3, 'MAINTENANCE', ?4, ?5, ?6)`,
          )
          .bind(
            createId('APH'),
            assetId,
            evidenceKey,
            timestamp,
            account.id,
            optionalText(command.notes, 500),
          ),
      );
    }
    await db.batch(statements);
    return result;
  }

  async function approveLendingTicket({ account, command, correlationId }) {
    assertCapability(account, METHOD_CAPABILITIES.approveLendingTicket);
    const ticketId = requiredText(command.ticketId, 'ticketId', 80);
    const key = command.clientRequestId ?? `approve-${ticketId}`;
    const ticket = await db.prepare('SELECT * FROM lending_tickets WHERE id = ?1').bind(ticketId).first();
    if (!ticket)
      throw new ApiError('LENDING_NOT_FOUND', 'The lending ticket was not found.', { status: 404 });
    assertEntityScope(account, { committeeId: ticket.owner_committee_id, ownerAccountId: ticket.created_by });
    const mutation = await replay(db, 'approveLendingTicket', key, account.id, command);
    if (mutation.replayed) return mutation.value;
    if (ticket.status !== 'FOR_REVIEW')
      throw new ApiError(
        'LENDING_STATE_CONFLICT',
        'The lending ticket cannot be reviewed from its current state.',
        { status: 409 },
      );
    const decision = requiredText(command.decision ?? 'APPROVE', 'decision', 40).toUpperCase();
    if (!['APPROVE', 'PARTIAL_APPROVE', 'SUBSTITUTE', 'REJECT'].includes(decision)) {
      throw new ApiError('LENDING_REVIEW_DECISION_INVALID', 'Choose an allowed lending review decision.');
    }
    const reviewNotes = optionalText(command.reviewNotes ?? command.notes, 500);
    const reviewReason = optionalText(
      command.reviewReason ?? command.rejectionReason ?? command.substitutionNote,
      500,
    );
    if (decision !== 'APPROVE' && !reviewReason) {
      throw new ApiError(
        'LENDING_REVIEW_REASON_REQUIRED',
        'Record a reason for partial approval, substitution, or rejection.',
      );
    }
    const timestamp = nowIso();
    if (decision === 'REJECT') {
      const result = {
        ticketId,
        id: ticketId,
        status: 'REJECTED',
        decision,
        correlationId,
      };
      await db.batch([
        db
          .prepare(
            `UPDATE lending_tickets
             SET status = 'REJECTED', review_decision = 'REJECT',
                 review_notes = ?2, rejection_reason = ?3,
                 approved_by = ?4, approved_at = ?5, updated_at = ?5
             WHERE id = ?1 AND status = 'FOR_REVIEW'`,
          )
          .bind(ticketId, reviewNotes, reviewReason, account.id, timestamp),
        historyStatement(db, {
          entityType: 'LENDING',
          entityId: ticketId,
          previousStatus: 'FOR_REVIEW',
          newStatus: 'REJECTED',
          accountId: account.id,
          idempotencyKey: mutation.key,
          reason: reviewReason,
          metadata: { decision, reviewNotes },
        }),
        auditStatement(db, {
          action: 'LENDING_REVIEWED',
          entityType: 'LENDING',
          entityId: ticketId,
          accountId: account.id,
          correlationId,
          after: { decision, reason: reviewReason },
        }),
        idempotencyStatement(db, 'approveLendingTicket', mutation, account.id, result),
        ...revisionStatements(db, ['lending']),
      ]);
      return result;
    }
    const identityReview = validateBorrowerIdentityApproval({
      borrowerType: ticket.borrower_type,
      identityVerified: command.identityVerified,
      identityVerificationSource: command.identityVerificationSource,
    });
    if (!identityReview.valid) {
      throw new ApiError(identityReview.code, identityReview.message, {
        status: 422,
        details: { requiredSource: identityReview.requirement.source },
      });
    }
    const requestedQuantity = Number(ticket.requested_quantity ?? ticket.quantity);
    const approvedQuantity =
      command.approvedQuantity == null
        ? requestedQuantity
        : positiveOperationalQuantity(command.approvedQuantity, ticket.unit);
    if (approvedQuantity > requestedQuantity) {
      throw new ApiError(
        'LENDING_APPROVED_QUANTITY_INVALID',
        'The approved quantity cannot exceed the requested quantity.',
      );
    }
    if (decision === 'PARTIAL_APPROVE' && approvedQuantity >= requestedQuantity) {
      throw new ApiError(
        'LENDING_PARTIAL_QUANTITY_REQUIRED',
        'A partial approval must be less than the requested quantity.',
      );
    }
    if (decision === 'APPROVE' && approvedQuantity !== requestedQuantity) {
      throw new ApiError(
        'LENDING_REVIEW_DECISION_INVALID',
        'Use Partial Approve when approving less than the requested quantity.',
      );
    }
    const approvedItemId =
      decision === 'SUBSTITUTE'
        ? requiredText(command.substitutionItemId, 'substitutionItemId', 80)
        : ticket.item_id;
    if (decision === 'SUBSTITUTE' && approvedItemId === ticket.item_id) {
      throw new ApiError(
        'LENDING_SUBSTITUTION_REQUIRED',
        'Choose a different canonical item for substitution.',
      );
    }
    const approvedItem = await db
      .prepare(
        `SELECT item.*, availability.available_to_promise
         FROM inventory_items item
         JOIN lending_catalog_availability availability ON availability.item_id = item.id
         WHERE item.id = ?1`,
      )
      .bind(approvedItemId)
      .first();
    if (
      !approvedItem ||
      approvedItem.status !== 'ACTIVE' ||
      approvedItem.classification_status !== 'CLASSIFIED' ||
      approvedItem.inventory_kind === 'UNVERIFIED' ||
      approvedItem.is_lendable !== 1 ||
      approvedItem.lending_status !== 'ACTIVE'
    ) {
      throw new ApiError(
        'LENDING_SUBSTITUTION_UNAVAILABLE',
        'The approved catalog item is not currently lendable.',
        { status: 409 },
      );
    }
    const staffBorrower = identityReview.requirement.borrowerType === 'USC_STAFF';
    if (approvedItem.lending_audience === 'USC_STAFF_ONLY' && !staffBorrower) {
      throw new ApiError(
        'LENDING_ELIGIBILITY_MISMATCH',
        'The borrower is not eligible for the approved catalog item.',
        { status: 409 },
      );
    }
    const maximumQuantity = Number(approvedItem.maximum_loan_quantity ?? approvedItem.available_to_promise);
    if (
      approvedQuantity > Number(approvedItem.available_to_promise) ||
      (Number.isFinite(maximumQuantity) && approvedQuantity > maximumQuantity)
    ) {
      throw new ApiError(
        'INSUFFICIENT_STOCK',
        'Available stock or the governed lending limit is insufficient for this approval.',
        { status: 409 },
      );
    }
    const traceable = await db
      .prepare(
        `SELECT COUNT(*) AS count
         FROM inventory_asset_instances
         WHERE item_id = ?1 AND lifecycle_status <> 'ARCHIVED'`,
      )
      .bind(approvedItemId)
      .first();
    const assetIds = Array.isArray(command.assetIds)
      ? command.assetIds.map((value, index) => requiredText(value, `assetIds[${index}]`, 80))
      : [];
    if (new Set(assetIds).size !== assetIds.length) {
      throw new ApiError('ASSET_ASSIGNMENT_DUPLICATE', 'Each asset instance may be assigned once.');
    }
    if (Number(traceable?.count ?? 0) > 0) {
      if (!Number.isSafeInteger(approvedQuantity) || assetIds.length !== approvedQuantity) {
        throw new ApiError(
          'ASSET_ASSIGNMENT_REQUIRED',
          'Assign one available asset instance for each approved reusable unit.',
          { status: 409 },
        );
      }
      const placeholders = assetIds.map((_, index) => `?${index + 2}`).join(', ');
      const availableAssets = await rows(
        db,
        `SELECT id FROM inventory_asset_instances
         WHERE item_id = ?1 AND lifecycle_status = 'AVAILABLE'
           AND current_lending_ticket_id IS NULL AND id IN (${placeholders})`,
        [approvedItemId, ...assetIds],
      );
      if (availableAssets.length !== assetIds.length) {
        throw new ApiError(
          'ASSET_ASSIGNMENT_UNAVAILABLE',
          'One or more selected asset instances are no longer available.',
          { status: 409 },
        );
      }
    } else if (assetIds.length) {
      throw new ApiError(
        'ASSET_ASSIGNMENT_UNAVAILABLE',
        'This item does not have registered asset instances.',
        { status: 409 },
      );
    }
    const reservationId = createId('RSV');
    const result = {
      ticketId,
      id: ticketId,
      status: 'READY_TO_CLAIM',
      decision,
      approvedItemId,
      approvedQuantity,
      assetIds,
      correlationId,
    };
    const approvedUnit = approvedItem.lending_unit || approvedItem.unit;
    const approvedTicketType = approvedItem.lending_kind === 'REUSABLE' ? 'LOAN' : 'CONSUMABLE';
    const statements = [
      db
        .prepare(
          `INSERT INTO reservations (
             id, item_id, quantity, unit, lending_ticket_id, status, idempotency_key,
             reserved_from, reserved_until, created_at, updated_at, created_by
           ) VALUES (?1, ?2, ?3, ?4, ?5, 'ACTIVE', ?6, ?7, ?8, ?9, ?9, ?10)`,
        )
        .bind(
          reservationId,
          approvedItemId,
          approvedQuantity,
          approvedUnit,
          ticketId,
          mutation.key,
          ticket.requested_start_at,
          ticket.requested_end_at,
          timestamp,
          account.id,
        ),
    ];
    for (const assetId of assetIds) {
      statements.push(
        db
          .prepare(
            `INSERT INTO lending_ticket_assets (
               lending_ticket_id, asset_id, assigned_at, assigned_by
             ) VALUES (?1, ?2, ?3, ?4)`,
          )
          .bind(ticketId, assetId, timestamp, account.id),
        db
          .prepare(
            `UPDATE inventory_asset_instances
             SET lifecycle_status = 'RESERVED', current_lending_ticket_id = ?2,
                 expected_return_at = ?3, updated_at = ?4, updated_by = ?5
             WHERE id = ?1 AND lifecycle_status = 'AVAILABLE'
               AND current_lending_ticket_id IS NULL`,
          )
          .bind(assetId, ticketId, ticket.requested_end_at ?? ticket.due_at, timestamp, account.id),
        db
          .prepare(
            `INSERT INTO inventory_asset_movements (
               id, asset_id, movement_type, previous_status, new_status,
               lending_ticket_id, occurred_at, recorded_by, notes
             ) VALUES (?1, ?2, 'RESERVED', 'AVAILABLE', 'RESERVED', ?3, ?4, ?5, ?6)`,
          )
          .bind(createId('AMV'), assetId, ticketId, timestamp, account.id, optionalText(command.notes, 500)),
      );
    }
    statements.push(
      db
        .prepare(
          `UPDATE lending_tickets
           SET item_id = ?2, quantity = ?3, unit = ?4, ticket_type = ?5,
               status = 'READY_TO_CLAIM', review_decision = ?6, review_notes = ?7,
               rejection_reason = '', substitution_note = ?8,
               eligibility_source = ?9, eligibility_reviewed_by = ?10,
               eligibility_reviewed_at = ?11, approved_by = ?10,
               approved_at = ?11, updated_at = ?11
           WHERE id = ?1 AND status = 'FOR_REVIEW'
             AND EXISTS (SELECT 1 FROM reservations WHERE id = ?12)`,
        )
        .bind(
          ticketId,
          approvedItemId,
          approvedQuantity,
          approvedUnit,
          approvedTicketType,
          decision,
          reviewNotes,
          decision === 'SUBSTITUTE' ? reviewReason : '',
          identityReview.requirement.source,
          account.id,
          timestamp,
          reservationId,
        ),
      idempotencyStatement(db, 'approveLendingTicket', mutation, account.id, result),
      historyStatement(db, {
        entityType: 'LENDING',
        entityId: ticketId,
        previousStatus: 'FOR_REVIEW',
        newStatus: 'READY_TO_CLAIM',
        accountId: account.id,
        idempotencyKey: mutation.key,
        reason: reviewReason,
        metadata: {
          decision,
          requestedItemId: ticket.requested_item_id ?? ticket.item_id,
          requestedQuantity,
          approvedItemId,
          approvedQuantity,
          eligibilitySource: identityReview.requirement.source,
          assetIds,
          reviewNotes,
        },
      }),
      auditStatement(db, {
        action: 'LENDING_REVIEWED',
        entityType: 'LENDING',
        entityId: ticketId,
        accountId: account.id,
        correlationId,
        after: {
          decision,
          approvedItemId,
          approvedQuantity,
          eligibilitySource: identityReview.requirement.source,
        },
      }),
      ...revisionStatements(db, ['lending', 'inventory']),
    );
    try {
      await db.batch(statements);
    } catch (error) {
      if (String(error?.message ?? '').includes('insufficient available-to-promise')) {
        throw new ApiError('INSUFFICIENT_STOCK', 'Available stock is insufficient for this lending ticket.', {
          status: 409,
        });
      }
      if (String(error?.message ?? '').includes('asset is not available')) {
        throw new ApiError(
          'ASSET_ASSIGNMENT_UNAVAILABLE',
          'One or more selected asset instances are no longer available.',
          { status: 409 },
        );
      }
      throw error;
    }
    return result;
  }

  async function confirmLendingHandoff({ account, command, correlationId }) {
    assertCapability(account, METHOD_CAPABILITIES.confirmLendingHandoff);
    const ticketId = requiredText(command.ticketId, 'ticketId', 80);
    const key = command.clientRequestId ?? `handoff-${ticketId}`;
    const ticket = await db.prepare('SELECT * FROM lending_tickets WHERE id = ?1').bind(ticketId).first();
    if (!ticket)
      throw new ApiError('LENDING_NOT_FOUND', 'The lending ticket was not found.', { status: 404 });
    assertEntityScope(account, { committeeId: ticket.owner_committee_id, ownerAccountId: ticket.created_by });
    const mutation = await replay(db, 'confirmLendingHandoff', key, account.id, command);
    if (mutation.replayed) return mutation.value;
    if (ticket.status !== 'READY_TO_CLAIM')
      throw new ApiError(
        'DUPLICATE_HANDOFF',
        'The lending handoff has already been completed or is not ready.',
        { status: 409 },
      );
    const handoffItem = await db
      .prepare(
        `SELECT status, classification_status, inventory_kind, is_lendable, lending_status
         FROM inventory_items WHERE id = ?1`,
      )
      .bind(ticket.item_id)
      .first();
    if (
      !handoffItem ||
      handoffItem.status !== 'ACTIVE' ||
      handoffItem.classification_status !== 'CLASSIFIED' ||
      handoffItem.inventory_kind === 'UNVERIFIED' ||
      handoffItem.is_lendable !== 1 ||
      handoffItem.lending_status !== 'ACTIVE'
    ) {
      throw new ApiError(
        'LENDING_ITEM_UNAVAILABLE',
        'The item classification is no longer safe for handoff.',
        { status: 409 },
      );
    }
    const timestamp = nowIso();
    const handoffId = createId('HND');
    const consumableIssue = ticket.ticket_type === 'CONSUMABLE';
    const completedStatus = consumableIssue ? 'COMPLETED' : 'ON_LOAN';
    const assignedAssets = await rows(
      db,
      `SELECT asset_id FROM lending_ticket_assets
       WHERE lending_ticket_id = ?1 ORDER BY assigned_at, asset_id`,
      [ticketId],
    );
    const handoffCondition = optionalText(command.conditionLabel, 80).toUpperCase();
    const assetStatements = assignedAssets.flatMap(({ asset_id: assetId }) => [
      db
        .prepare(
          `UPDATE lending_ticket_assets
           SET released_at = ?3, handoff_condition = ?4
           WHERE lending_ticket_id = ?1 AND asset_id = ?2 AND released_at IS NULL`,
        )
        .bind(ticketId, assetId, timestamp, handoffCondition),
      db
        .prepare(
          `UPDATE inventory_asset_instances
           SET lifecycle_status = 'ON_LOAN', handoff_condition = ?3,
               updated_at = ?4, updated_by = ?5
           WHERE id = ?1 AND current_lending_ticket_id = ?2 AND lifecycle_status = 'RESERVED'`,
        )
        .bind(assetId, ticketId, handoffCondition, timestamp, account.id),
      db
        .prepare(
          `INSERT INTO inventory_asset_movements (
             id, asset_id, movement_type, previous_status, new_status,
             lending_ticket_id, condition_label, occurred_at, recorded_by, notes
           ) VALUES (?1, ?2, 'HANDOFF', 'RESERVED', 'ON_LOAN', ?3, ?4, ?5, ?6, ?7)`,
        )
        .bind(
          createId('AMV'),
          assetId,
          ticketId,
          handoffCondition,
          timestamp,
          account.id,
          optionalText(command.notes, 500),
        ),
    ]);
    const result = {
      ticketId,
      id: ticketId,
      handoffId,
      assetIds: assignedAssets.map((asset) => asset.asset_id),
      status: completedStatus,
      correlationId,
    };
    await db.batch([
      db
        .prepare(
          `INSERT INTO lending_handoffs (id, lending_ticket_id, released_by, released_at, idempotency_key, notes)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6)`,
        )
        .bind(handoffId, ticketId, account.id, timestamp, mutation.key, optionalText(command.notes, 500)),
      db
        .prepare(
          `INSERT INTO inventory_ledger (
        id, created_at, transaction_type, direction, item_id, quantity, unit, signed_quantity,
        related_entity_type, related_entity_id, actor_account_id, idempotency_key, status, notes
      ) VALUES (?1, ?2, ?3, 'OUT', ?4, ?5, ?6, ?7, 'LENDING', ?8, ?9, ?10, 'POSTED', ?11)`,
        )
        .bind(
          createId('LED'),
          timestamp,
          consumableIssue ? 'ISSUE' : 'LOAN_OUT',
          ticket.item_id,
          ticket.quantity,
          ticket.unit,
          -Number(ticket.quantity),
          ticketId,
          account.id,
          mutation.key,
          optionalText(command.notes, 500),
        ),
      db
        .prepare(
          `UPDATE reservations SET status = 'RELEASED', cleared_at = ?2, clear_reason = 'LENDING_HANDOFF', updated_at = ?2
        WHERE lending_ticket_id = ?1 AND status = 'ACTIVE'`,
        )
        .bind(ticketId, timestamp),
      db
        .prepare(
          `UPDATE lending_tickets SET status = ?2, updated_at = ?3
           WHERE id = ?1 AND status = 'READY_TO_CLAIM'`,
        )
        .bind(ticketId, completedStatus, timestamp),
      ...assetStatements,
      historyStatement(db, {
        entityType: 'LENDING',
        entityId: ticketId,
        previousStatus: 'READY_TO_CLAIM',
        newStatus: completedStatus,
        accountId: account.id,
        idempotencyKey: mutation.key,
        reason: consumableIssue ? 'Consumable issue completed.' : 'Reusable item handed off.',
        metadata: {
          transactionType: consumableIssue ? 'ISSUE' : 'LOAN_OUT',
          assetIds: assignedAssets.map((asset) => asset.asset_id),
        },
      }),
      auditStatement(db, {
        action: consumableIssue ? 'CONSUMABLE_ISSUE_CONFIRMED' : 'LENDING_HANDOFF_CONFIRMED',
        entityType: 'LENDING',
        entityId: ticketId,
        accountId: account.id,
        correlationId,
      }),
      idempotencyStatement(db, 'confirmLendingHandoff', mutation, account.id, result),
      ...revisionStatements(db, ['lending', 'inventory']),
    ]);
    return result;
  }

  async function confirmReturn({ account, command, correlationId }) {
    assertCapability(account, METHOD_CAPABILITIES.confirmReturn);
    const ticketId = requiredText(command.ticketId, 'ticketId', 80);
    const key = command.clientRequestId ?? `return-${ticketId}`;
    const ticket = await db.prepare('SELECT * FROM lending_tickets WHERE id = ?1').bind(ticketId).first();
    if (!ticket)
      throw new ApiError('LENDING_NOT_FOUND', 'The lending ticket was not found.', { status: 404 });
    assertEntityScope(account, { committeeId: ticket.owner_committee_id, ownerAccountId: ticket.created_by });
    const evidenceId = await requireStoredEvidence(command, {
      evidenceTypes: ['LENDING_RETURN_PHOTO'],
      relatedEntityIds: [ticketId],
    });
    const mutation = await replay(db, 'confirmReturn', key, account.id, command);
    if (mutation.replayed) return mutation.value;
    if (ticket.status !== 'ON_LOAN')
      throw new ApiError(
        'DUPLICATE_RETURN',
        'The lending return has already been completed or is not on loan.',
        { status: 409 },
      );
    const timestamp = nowIso();
    const returnId = createId('RTN');
    const returnCondition = requiredText(command.conditionLabel, 'conditionLabel', 80).toUpperCase();
    const ticketQuantity = Number(ticket.quantity);
    const lostQuantity = nonNegativeOperationalQuantity(
      command.lostQuantity ?? (returnCondition.includes('LOST') ? ticketQuantity : 0),
      ticket.unit,
      'lostQuantity',
    );
    const damagedBeyondUseQuantity = nonNegativeOperationalQuantity(
      command.damagedBeyondUseQuantity ??
        (returnCondition.includes('DAMAGED_BEYOND_USE') ? ticketQuantity : 0),
      ticket.unit,
      'damagedBeyondUseQuantity',
    );
    const returnedQuantity = nonNegativeOperationalQuantity(
      command.returnedQuantity ?? ticketQuantity - lostQuantity - damagedBeyondUseQuantity,
      ticket.unit,
      'returnedQuantity',
    );
    if (Math.abs(returnedQuantity + lostQuantity + damagedBeyondUseQuantity - ticketQuantity) > 0.000001) {
      throw new ApiError(
        'LENDING_RETURN_QUANTITY_MISMATCH',
        'Returned, lost, and damaged-beyond-use quantities must equal the quantity on loan.',
      );
    }
    if ((lostQuantity > 0 || damagedBeyondUseQuantity > 0) && !optionalText(command.notes, 500)) {
      throw new ApiError(
        'LENDING_RETURN_EXCEPTION_NOTE_REQUIRED',
        'Record an inspection note for lost or damaged-beyond-use quantities.',
      );
    }
    const nextAssetStatus = returnCondition.includes('LOST')
      ? 'LOST'
      : returnCondition.includes('DAMAGED')
        ? 'DAMAGED'
        : returnCondition.includes('POOR') ||
            returnCondition.includes('MAINTENANCE') ||
            returnCondition.includes('QUARANTINE')
          ? 'MAINTENANCE'
          : 'AVAILABLE';
    const evidenceAssetKey = optionalText(command.assetEvidenceKey, 160);
    if (evidenceAssetKey && !/^[a-zA-Z0-9][a-zA-Z0-9._-]{0,159}$/u.test(evidenceAssetKey)) {
      throw new ApiError('ASSET_KEY_INVALID', 'The governed evidence asset key is invalid.');
    }
    const assignedAssets = await rows(
      db,
      `SELECT asset_id FROM lending_ticket_assets
       WHERE lending_ticket_id = ?1 ORDER BY assigned_at, asset_id`,
      [ticketId],
    );
    const assetStatements = assignedAssets.flatMap(({ asset_id: assetId }) => {
      const statements = [
        db
          .prepare(
            `UPDATE lending_ticket_assets
             SET returned_at = ?3, return_condition = ?4
             WHERE lending_ticket_id = ?1 AND asset_id = ?2 AND returned_at IS NULL`,
          )
          .bind(ticketId, assetId, timestamp, returnCondition),
        db
          .prepare(
            `UPDATE inventory_asset_instances
             SET lifecycle_status = ?3, current_lending_ticket_id = NULL,
                 expected_return_at = NULL, return_condition = ?4,
                 condition_label = CASE
                   WHEN ?3 = 'DAMAGED' THEN 'DAMAGED'
                   WHEN ?5 = '' THEN condition_label
                   ELSE ?5
                 END,
                 updated_at = ?6, updated_by = ?7
             WHERE id = ?1 AND current_lending_ticket_id = ?2 AND lifecycle_status = 'ON_LOAN'`,
          )
          .bind(
            assetId,
            ticketId,
            nextAssetStatus,
            returnCondition,
            ['NEW', 'GOOD', 'FAIR', 'POOR', 'DAMAGED'].includes(returnCondition) ? returnCondition : '',
            timestamp,
            account.id,
          ),
        db
          .prepare(
            `INSERT INTO inventory_asset_movements (
               id, asset_id, movement_type, previous_status, new_status,
               lending_ticket_id, condition_label, evidence_asset_key,
               occurred_at, recorded_by, notes
             ) VALUES (?1, ?2, 'RETURN', 'ON_LOAN', ?3, ?4, ?5, ?6, ?7, ?8, ?9)`,
          )
          .bind(
            createId('AMV'),
            assetId,
            nextAssetStatus,
            ticketId,
            returnCondition,
            evidenceAssetKey,
            timestamp,
            account.id,
            optionalText(command.notes, 500),
          ),
      ];
      if (nextAssetStatus !== 'AVAILABLE') {
        statements.push(
          db
            .prepare(
              `INSERT INTO inventory_asset_maintenance (
                 id, asset_id, event_type, condition_label, evidence_asset_key,
                 occurred_at, recorded_by, notes
               ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)`,
            )
            .bind(
              createId('AMT'),
              assetId,
              nextAssetStatus === 'DAMAGED' || nextAssetStatus === 'LOST' ? 'DECLARED_DAMAGED' : 'OPENED',
              returnCondition,
              evidenceAssetKey,
              timestamp,
              account.id,
              optionalText(command.notes, 500),
            ),
        );
      }
      if (evidenceAssetKey) {
        statements.push(
          db
            .prepare(
              `INSERT INTO inventory_asset_photos (
                 id, asset_id, asset_key, photo_type, captured_at, recorded_by, notes
               ) VALUES (?1, ?2, ?3, 'RETURN', ?4, ?5, ?6)`,
            )
            .bind(
              createId('APH'),
              assetId,
              evidenceAssetKey,
              timestamp,
              account.id,
              optionalText(command.notes, 500),
            ),
        );
      }
      return statements;
    });
    const result = {
      ticketId,
      id: ticketId,
      returnId,
      assetIds: assignedAssets.map((asset) => asset.asset_id),
      returnedQuantity,
      lostQuantity,
      damagedBeyondUseQuantity,
      status: 'RETURNED',
      correlationId,
    };
    const returnStatements = [
      db
        .prepare(
          `INSERT INTO lending_returns (
        id, lending_ticket_id, returned_by, returned_at, condition_label, evidence_id, idempotency_key, notes
      ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8)`,
        )
        .bind(
          returnId,
          ticketId,
          account.id,
          timestamp,
          optionalText(command.conditionLabel, 80),
          evidenceId,
          mutation.key,
          optionalText(command.notes, 500),
        ),
      db
        .prepare(
          `UPDATE lending_tickets SET status = 'RETURNED', updated_at = ?2 WHERE id = ?1 AND status = 'ON_LOAN'`,
        )
        .bind(ticketId, timestamp),
      ...assetStatements,
      historyStatement(db, {
        entityType: 'LENDING',
        entityId: ticketId,
        previousStatus: 'ON_LOAN',
        newStatus: 'RETURNED',
        accountId: account.id,
        idempotencyKey: mutation.key,
        reason: optionalText(command.notes, 500),
        metadata: {
          condition: returnCondition,
          returnedQuantity,
          lostQuantity,
          damagedBeyondUseQuantity,
          assetIds: assignedAssets.map((asset) => asset.asset_id),
        },
      }),
      auditStatement(db, {
        action: 'LENDING_RETURN_CONFIRMED',
        entityType: 'LENDING',
        entityId: ticketId,
        accountId: account.id,
        correlationId,
        after: { returnCondition, returnedQuantity, lostQuantity, damagedBeyondUseQuantity },
      }),
      idempotencyStatement(db, 'confirmReturn', mutation, account.id, result),
      ...revisionStatements(db, ['lending', 'inventory']),
    ];
    if (returnedQuantity > 0) {
      returnStatements.splice(
        1,
        0,
        db
          .prepare(
            `INSERT INTO inventory_ledger (
          id, created_at, transaction_type, direction, item_id, quantity, unit, signed_quantity,
          related_entity_type, related_entity_id, actor_account_id, idempotency_key, status, notes
        ) VALUES (?1, ?2, 'LOAN_RETURN', 'IN', ?3, ?4, ?5, ?4, 'LENDING', ?6, ?7, ?8, 'POSTED', ?9)`,
          )
          .bind(
            createId('LED'),
            timestamp,
            ticket.item_id,
            returnedQuantity,
            ticket.unit,
            ticketId,
            account.id,
            mutation.key,
            optionalText(command.notes, 500),
          ),
      );
    }
    await db.batch(returnStatements);
    return result;
  }

  async function reviewRequest({ account, command, correlationId }) {
    assertCapability(account, METHOD_CAPABILITIES.reviewRequest);
    const requestId = requiredText(command.requestId, 'requestId', 80);
    const decision = requiredText(command.decision, 'decision', 40).toUpperCase();
    const nextStatus = {
      ACCEPT: 'ACCEPTED',
      APPROVE: 'ACCEPTED',
      REJECT: 'REJECTED',
      MISSING_INFORMATION: 'NEEDS_INFORMATION',
    }[decision];
    if (!nextStatus) throw new ApiError('VALIDATION_FAILED', 'The review decision is invalid.');
    const key = command.clientRequestId ?? `review-${requestId}-${decision}`;
    const current = await db.prepare('SELECT * FROM requests WHERE id = ?1').bind(requestId).first();
    if (!current) throw new ApiError('REQUEST_NOT_FOUND', 'The request was not found.', { status: 404 });
    assertEntityScope(account, {
      committeeId: current.owner_committee_id,
      ownerAccountId: current.requester_account_id,
    });
    const mutation = await replay(db, 'reviewRequest', key, account.id, command);
    if (mutation.replayed) return mutation.value;
    if (!['FOR_REVIEW', 'NEEDS_INFORMATION'].includes(current.status)) {
      throw new ApiError('REQUEST_STATE_CONFLICT', 'The request cannot be reviewed from its current state.', {
        status: 409,
      });
    }
    const timestamp = nowIso();
    const requestLines = await rows(
      db,
      `SELECT * FROM request_lines
       WHERE request_id = ?1 AND status IN ('FOR_REVIEW', 'NEEDS_INFORMATION')`,
      [requestId],
    );
    const result = { requestId, id: requestId, status: nextStatus, correlationId };
    const statements = [
      db
        .prepare(
          `UPDATE requests SET status = ?2, updated_at = ?3
           WHERE id = ?1 AND status IN ('FOR_REVIEW', 'NEEDS_INFORMATION')`,
        )
        .bind(requestId, nextStatus, timestamp),
      db
        .prepare(
          `UPDATE request_lines
           SET status = CASE
             WHEN ?2 = 'ACCEPTED' AND item_id IS NOT NULL
               AND fulfillment_source IN ('ISSUE_FROM_STOCK', 'SPLIT_FULFILLMENT')
               THEN 'READY_TO_RESERVE'
             WHEN ?2 = 'ACCEPTED' THEN 'FOR_CANVASSING'
             WHEN ?2 = 'REJECTED' THEN 'REJECTED'
             ELSE 'NEEDS_INFORMATION' END,
             updated_at = ?3
           WHERE request_id = ?1 AND status IN ('FOR_REVIEW', 'NEEDS_INFORMATION')`,
        )
        .bind(requestId, nextStatus, timestamp),
    ];
    if (nextStatus === 'ACCEPTED') {
      for (const line of requestLines) {
        const routesFromStock =
          line.item_id && ['ISSUE_FROM_STOCK', 'SPLIT_FULFILLMENT'].includes(line.fulfillment_source);
        if (routesFromStock) continue;
        if (current.request_type === 'CATALOG_RESTOCK' || line.fulfillment_source === 'RESTOCK') {
          statements.push(
            db
              .prepare(
                `INSERT INTO restock_requests (
                   id, source_request_id, source_request_line_id, item_id, requested_quantity,
                   received_quantity, unit, supplier_name, status, assigned_committee_id,
                   notes, created_at, updated_at, created_by
                 ) VALUES (?1, ?2, ?3, ?4, ?5, 0, ?6, '', 'FOR_CANVASSING', ?7,
                   ?8, ?9, ?9, ?10)`,
              )
              .bind(
                createId('RST'),
                requestId,
                line.id,
                line.item_id,
                line.requested_quantity,
                line.unit,
                current.owner_committee_id,
                optionalText(line.notes, 500),
                timestamp,
                account.id,
              ),
          );
        } else {
          statements.push(
            db
              .prepare(
                `INSERT INTO deliverables (
                   id, request_id, request_line_id, event_series_id, event_id,
                   inventory_match_id, item_spec, quantity_requested, quantity_received,
                   quantity_released, unit, fulfillment_source, assigned_committee_id,
                   budget_status, procurement_status, receipt_status, needed_at, status,
                   notes, created_at, updated_at, created_by
                 ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, 0, 0, ?9,
                   'PROCUREMENT', ?10, 'NOT_STARTED', 'FOR_CANVASSING', 'MISSING',
                   ?11, 'FOR_CANVASSING', ?12, ?13, ?13, ?14)`,
              )
              .bind(
                createId('DEL'),
                requestId,
                line.id,
                current.event_series_id,
                line.event_id ?? current.event_id,
                line.item_id,
                line.specification || line.description,
                line.requested_quantity,
                line.unit,
                current.owner_committee_id,
                line.needed_at,
                optionalText(line.notes, 500),
                timestamp,
                account.id,
              ),
          );
        }
      }
    }
    statements.push(
      historyStatement(db, {
        entityType: 'REQUEST',
        entityId: requestId,
        previousStatus: current.status,
        newStatus: nextStatus,
        accountId: account.id,
        idempotencyKey: mutation.key,
        reason: optionalText(command.note, 500),
      }),
      auditStatement(db, {
        action: `REQUEST_${nextStatus}`,
        entityType: 'REQUEST',
        entityId: requestId,
        accountId: account.id,
        correlationId,
        after: { status: nextStatus },
      }),
      idempotencyStatement(db, 'reviewRequest', mutation, account.id, result),
      ...revisionStatements(db, ['request']),
    );
    const outcomes = await db.batch(statements);
    if (Number(outcomes[0]?.meta?.changes ?? 0) !== 1) {
      throw new ApiError('REQUEST_STATE_CONFLICT', 'The request changed during review.', { status: 409 });
    }
    return result;
  }

  async function confirmRelease({ account, command, correlationId }) {
    assertCapability(account, METHOD_CAPABILITIES.confirmRelease);
    if (command.recipientConfirmed !== true) {
      throw new ApiError(
        'RECIPIENT_CONFIRMATION_REQUIRED',
        'Recipient confirmation is required before release.',
      );
    }
    const requestId = requiredText(command.requestId, 'requestId', 80);
    const requestScope = await db
      .prepare('SELECT owner_committee_id, requester_account_id FROM requests WHERE id = ?1')
      .bind(requestId)
      .first();
    if (!requestScope) throw new ApiError('REQUEST_NOT_FOUND', 'The request was not found.', { status: 404 });
    assertEntityScope(account, {
      committeeId: requestScope.owner_committee_id,
      ownerAccountId: requestScope.requester_account_id,
    });
    const lines = Array.isArray(command.lines) ? command.lines : [];
    if (!lines.length || lines.length > 50) {
      throw new ApiError('VALIDATION_FAILED', 'At least one release line is required.');
    }
    const uniqueLines = new Set(lines.map((line) => String(line.requestLineId ?? '').trim()));
    if (uniqueLines.size !== lines.length || uniqueLines.has('')) {
      throw new ApiError('DUPLICATE_RELEASE_LINE', 'Each release line must be unique.');
    }
    const evidenceId = await requireStoredEvidence(command, {
      evidenceTypes: ['RELEASE_CONFIRMATION_PHOTO'],
      relatedEntityIds: [requestId],
    });
    const mutation = await replay(db, 'confirmRelease', command.clientRequestId, account.id, command);
    if (mutation.replayed) return mutation.value;
    const releaseId = createId('REL');
    const timestamp = nowIso();
    const statements = [];
    const transactionIds = [];
    let completed = true;
    for (let index = 0; index < lines.length; index += 1) {
      const input = lines[index];
      const lineId = requiredText(input.requestLineId, `lines[${index}].requestLineId`, 80);
      const line = await db.prepare('SELECT * FROM request_lines WHERE id = ?1').bind(lineId).first();
      if (!line || line.request_id !== requestId) {
        throw new ApiError(
          'RELEASE_SCOPE_MISMATCH',
          'Every release line must belong to the selected request.',
          { status: 409 },
        );
      }
      const quantity = positiveOperationalQuantity(input.quantity, line.unit, `lines[${index}].quantity`);
      if (!['READY_TO_RELEASE', 'PARTIALLY_RELEASED'].includes(line.status)) {
        throw new ApiError('RELEASE_STATE_CONFLICT', 'A release line is not ready for physical handoff.', {
          status: 409,
        });
      }
      const remaining = Number(line.requested_quantity) - Number(line.released_quantity);
      if (quantity > remaining) {
        throw new ApiError('OVER_RELEASE', 'Release quantity exceeds the remaining approved quantity.', {
          status: 409,
        });
      }
      if (!line.item_id) {
        throw new ApiError('EVENT_ITEM_NOT_READY', 'The release line has no authoritative inventory item.', {
          status: 409,
        });
      }
      const reservationRows = await rows(
        db,
        `SELECT reservation.id,
           reservation.quantity - COALESCE(SUM(consumption.quantity), 0) AS remaining
         FROM reservations reservation
         LEFT JOIN reservation_consumptions consumption
           ON consumption.reservation_id = reservation.id
         WHERE reservation.item_id = ?1
           AND reservation.request_line_id = ?2
           AND reservation.status = 'ACTIVE'
         GROUP BY reservation.id, reservation.quantity
         HAVING remaining > 0
         ORDER BY reservation.created_at`,
        [line.item_id, lineId],
      );
      let uncovered = quantity;
      for (const reservation of reservationRows) {
        if (uncovered <= 0) break;
        const consumed = Math.min(uncovered, Number(reservation.remaining));
        statements.push(
          db
            .prepare(
              `INSERT INTO reservation_consumptions (
                 id, reservation_id, related_entity_type, related_entity_id, quantity,
                 idempotency_key, consumed_at, consumed_by
               ) VALUES (?1, ?2, 'RELEASE', ?3, ?4, ?5, ?6, ?7)`,
            )
            .bind(
              createId('RSC'),
              reservation.id,
              releaseId,
              consumed,
              `${mutation.key}:${lineId}:${reservation.id}`,
              timestamp,
              account.id,
            ),
        );
        uncovered -= consumed;
      }
      if (uncovered > 0) {
        throw new ApiError('RESERVATION_CONFLICT', 'The active reservation no longer covers this release.', {
          status: 409,
        });
      }
      const lineReleaseId = lines.length === 1 ? releaseId : `${releaseId}-${index + 1}`;
      const transactionId = createId('LED');
      const lineStatus = quantity >= remaining ? 'COMPLETED' : 'PARTIALLY_RELEASED';
      completed &&= lineStatus === 'COMPLETED';
      transactionIds.push(transactionId);
      statements.push(
        db
          .prepare(
            `INSERT INTO inventory_ledger (
               id, created_at, transaction_type, direction, item_id, quantity, unit,
               signed_quantity, related_entity_type, related_entity_id, request_id,
               event_id, actor_account_id, idempotency_key, status, notes
             ) VALUES (?1, ?2, 'ISSUE', 'OUT', ?3, ?4, ?5, ?6, 'RELEASE', ?7,
               ?8, ?9, ?10, ?11, 'POSTED', ?12)`,
          )
          .bind(
            transactionId,
            timestamp,
            line.item_id,
            quantity,
            line.unit,
            -quantity,
            releaseId,
            requestId,
            line.event_id,
            account.id,
            `${mutation.key}:${lineId}`,
            optionalText(command.notes, 500),
          ),
        db
          .prepare(
            `UPDATE request_lines
             SET released_quantity = released_quantity + ?2,
                 status = ?3,
                 updated_at = ?4
             WHERE id = ?1 AND released_quantity + ?2 <= requested_quantity`,
          )
          .bind(lineId, quantity, lineStatus, timestamp),
        db
          .prepare(
            `INSERT INTO release_confirmations (
               id, release_group_id, request_id, request_line_id, event_id, lending_ticket_id,
               recipient_name, recipient_role, department, item_id, quantity, unit,
               released_by, released_at, confirmation_label, evidence_id,
               idempotency_key, status, notes
             ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12,
               ?13, ?14, ?15, ?16, ?17, ?18, ?19)`,
          )
          .bind(
            lineReleaseId,
            releaseId,
            requestId,
            lineId,
            line.event_id,
            optionalText(command.lendingTicketId, 80) || null,
            requiredText(command.recipientName, 'recipientName', 120),
            requiredText(command.recipientRole, 'recipientRole', 120),
            requiredText(command.department, 'department', 120),
            line.item_id,
            quantity,
            line.unit,
            account.id,
            timestamp,
            `Release Confirmation | ${releaseId} | ${requestId} | Recipient confirmed | ${timestamp}`,
            evidenceId,
            `${mutation.key}:${lineId}`,
            lineStatus === 'COMPLETED' ? 'COMPLETED' : 'PARTIAL',
            optionalText(command.notes, 500),
          ),
        historyStatement(db, {
          entityType: 'REQUEST_LINE',
          entityId: lineId,
          previousStatus: line.status,
          newStatus: lineStatus,
          accountId: account.id,
          idempotencyKey: `${mutation.key}:${lineId}`,
          reason: optionalText(command.notes, 500) || 'Physical release confirmed.',
        }),
      );
    }
    const result = {
      releaseId,
      id: releaseId,
      transactionIds,
      status: completed ? 'COMPLETED' : 'PARTIAL',
      recipientConfirmed: true,
      correlationId,
    };
    statements.push(
      db
        .prepare(
          `UPDATE requests
           SET status = CASE
             WHEN NOT EXISTS (
               SELECT 1 FROM request_lines line
               WHERE line.request_id = requests.id AND line.status <> 'COMPLETED'
             ) THEN 'COMPLETED' ELSE 'PARTIALLY_RELEASED' END,
             updated_at = ?2
           WHERE id = ?1`,
        )
        .bind(requestId, timestamp),
      auditStatement(db, {
        action: 'RELEASE_CONFIRMED',
        entityType: 'RELEASE',
        entityId: releaseId,
        accountId: account.id,
        correlationId,
        after: { requestId, lineCount: lines.length },
      }),
      idempotencyStatement(db, 'confirmRelease', mutation, account.id, result),
      ...revisionStatements(db, ['release', 'request', 'inventory']),
    );
    try {
      await db.batch(statements);
    } catch (error) {
      const message = String(error?.message ?? '');
      if (message.includes('reservation coverage')) {
        throw new ApiError('RESERVATION_CONFLICT', 'The active reservation changed before release.', {
          status: 409,
        });
      }
      if (message.includes('on-hand negative')) {
        throw new ApiError('INSUFFICIENT_STOCK', 'Physical stock changed before release.', { status: 409 });
      }
      throw error;
    }
    return result;
  }

  async function correctRelease({ account, command, correlationId }) {
    const authorization = assertCapability(account, METHOD_CAPABILITIES.correctRelease);
    if (authorization.roleId !== 'SYSTEM_OWNER') {
      throw new ApiError('SYSTEM_OWNER_REQUIRED', 'Only the System Owner may correct a release.', {
        status: 403,
      });
    }
    if (command.correctionConfirmed !== true) {
      throw new ApiError(
        'CORRECTION_CONFIRMATION_REQUIRED',
        'Confirm the compensating correction before posting it.',
      );
    }
    const releaseConfirmationId = requiredText(command.releaseConfirmationId, 'releaseConfirmationId', 100);
    const reason = requiredText(command.reason, 'reason', 500);
    const confirmation = await db
      .prepare(
        `SELECT confirmation.*, request.owner_committee_id, request.requester_account_id,
                line.requested_quantity, line.released_quantity, line.status AS line_status,
                ledger.id AS original_ledger_id
         FROM release_confirmations confirmation
         JOIN requests request ON request.id = confirmation.request_id
         JOIN request_lines line ON line.id = confirmation.request_line_id
         JOIN inventory_ledger ledger ON ledger.idempotency_key = confirmation.idempotency_key
         WHERE confirmation.id = ?1 AND ledger.related_entity_type = 'RELEASE'
         LIMIT 1`,
      )
      .bind(releaseConfirmationId)
      .first();
    if (!confirmation) {
      throw new ApiError('RELEASE_CONFIRMATION_NOT_FOUND', 'The release confirmation was not found.', {
        status: 404,
      });
    }
    const quantity = positiveOperationalQuantity(command.quantity, confirmation.unit, 'quantity');
    assertEntityScope(account, {
      committeeId: confirmation.owner_committee_id,
      ownerAccountId: confirmation.requester_account_id,
    });
    const mutation = await replay(db, 'correctRelease', command.clientRequestId, account.id, command);
    if (mutation.replayed) return mutation.value;
    const corrected = await db
      .prepare(
        `SELECT COALESCE(SUM(quantity), 0) AS quantity
         FROM release_corrections
         WHERE release_confirmation_id = ?1`,
      )
      .bind(releaseConfirmationId)
      .first();
    const correctable = Number(confirmation.quantity) - Number(corrected?.quantity ?? 0);
    if (quantity > correctable || quantity > Number(confirmation.released_quantity)) {
      throw new ApiError(
        'CORRECTION_QUANTITY_CONFLICT',
        'The correction exceeds the unreversed release quantity.',
        { status: 409 },
      );
    }
    const evidenceId = await requireStoredEvidence(command, {
      evidenceTypes: ['RELEASE_CONFIRMATION_PHOTO'],
      relatedEntityIds: [confirmation.request_id],
    });
    const correctionId = createId('RLC');
    const transactionId = createId('LED');
    const reservationId = createId('RSV');
    const timestamp = nowIso();
    const nextReleased = Number(confirmation.released_quantity) - quantity;
    const nextStatus = nextReleased <= 0 ? 'READY_TO_RELEASE' : 'PARTIALLY_RELEASED';
    const result = {
      correctionId,
      id: correctionId,
      releaseId: confirmation.release_group_id || confirmation.id,
      releaseConfirmationId,
      transactionId,
      reservationId,
      quantity,
      status: 'POSTED',
      lineStatus: nextStatus,
      remainingReleasedQuantity: nextReleased,
      correlationId,
    };
    const statements = [
      db
        .prepare(
          `INSERT INTO inventory_ledger (
             id, created_at, transaction_type, direction, item_id, quantity, unit,
             signed_quantity, related_entity_type, related_entity_id, request_id,
             event_id, actor_account_id, idempotency_key, reversal_of, status, notes
           ) VALUES (?1, ?2, 'RELEASE_CORRECTION', 'REVERSAL', ?3, ?4, ?5, ?4,
             'RELEASE_CORRECTION', ?6, ?7, ?8, ?9, ?10, ?11, 'POSTED', ?12)`,
        )
        .bind(
          transactionId,
          timestamp,
          confirmation.item_id,
          quantity,
          confirmation.unit,
          correctionId,
          confirmation.request_id,
          confirmation.event_id,
          account.id,
          `${mutation.key}:ledger`,
          confirmation.original_ledger_id,
          reason,
        ),
      db
        .prepare(
          `INSERT INTO reservations (
             id, item_id, quantity, unit, request_line_id, lending_ticket_id,
             status, idempotency_key, cleared_at, clear_reason, notes,
             created_at, updated_at, created_by
           ) VALUES (?1, ?2, ?3, ?4, ?5, NULL, 'ACTIVE', ?6, NULL, '', ?7, ?8, ?8, ?9)`,
        )
        .bind(
          reservationId,
          confirmation.item_id,
          quantity,
          confirmation.unit,
          confirmation.request_line_id,
          `${mutation.key}:reservation`,
          `Compensating reservation for ${correctionId}.`,
          timestamp,
          account.id,
        ),
      db
        .prepare(
          `INSERT INTO release_corrections (
             id, release_group_id, release_confirmation_id, quantity, reason,
             evidence_id, ledger_transaction_id, corrected_by, corrected_at,
             idempotency_key, status
           ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, 'POSTED')`,
        )
        .bind(
          correctionId,
          confirmation.release_group_id || confirmation.id,
          releaseConfirmationId,
          quantity,
          reason,
          evidenceId,
          transactionId,
          account.id,
          timestamp,
          mutation.key,
        ),
      db
        .prepare(
          `UPDATE request_lines
           SET released_quantity = released_quantity - ?2,
               status = ?3,
               updated_at = ?4
           WHERE id = ?1 AND released_quantity >= ?2`,
        )
        .bind(confirmation.request_line_id, quantity, nextStatus, timestamp),
      db
        .prepare("UPDATE requests SET status = 'PARTIALLY_RELEASED', updated_at = ?2 WHERE id = ?1")
        .bind(confirmation.request_id, timestamp),
      historyStatement(db, {
        entityType: 'REQUEST_LINE',
        entityId: confirmation.request_line_id,
        previousStatus: confirmation.line_status,
        newStatus: nextStatus,
        accountId: account.id,
        idempotencyKey: mutation.key,
        reason,
        metadata: {
          correctionId,
          releaseId: confirmation.release_group_id || confirmation.id,
          quantity,
          transactionId,
        },
      }),
      auditStatement(db, {
        action: 'RELEASE_CORRECTED',
        entityType: 'RELEASE_CORRECTION',
        entityId: correctionId,
        accountId: account.id,
        correlationId,
        after: {
          releaseId: confirmation.release_group_id || confirmation.id,
          releaseConfirmationId,
          quantity,
          transactionId,
          reason,
        },
      }),
      idempotencyStatement(db, 'correctRelease', mutation, account.id, result),
      ...revisionStatements(db, ['release', 'request', 'inventory']),
    ];
    let outcomes;
    try {
      outcomes = await db.batch(statements);
    } catch (error) {
      if (String(error?.message ?? '').includes('release correction state conflict')) {
        throw new ApiError(
          'CORRECTION_STATE_CONFLICT',
          'The release changed before the correction could be posted.',
          { status: 409 },
        );
      }
      throw error;
    }
    if (Number(outcomes[3]?.meta?.changes ?? 0) !== 1) {
      throw new ApiError(
        'CORRECTION_STATE_CONFLICT',
        'The release changed before the correction could be posted.',
        { status: 409 },
      );
    }
    return result;
  }

  async function receiveEntity({ account, command, correlationId, kind }) {
    const method = kind === 'RESTOCK' ? 'receiveRestock' : 'receiveDeliverable';
    assertCapability(account, METHOD_CAPABILITIES[method]);
    const entityId = requiredText(
      kind === 'RESTOCK' ? (command.restockId ?? command.restockRequestId) : command.deliverableId,
      kind === 'RESTOCK' ? 'restockId' : 'deliverableId',
      80,
    );
    const table = kind === 'RESTOCK' ? 'restock_requests' : 'deliverables';
    const entity = await db.prepare(`SELECT * FROM ${table} WHERE id = ?1`).bind(entityId).first();
    if (!entity) {
      throw new ApiError(`${kind}_NOT_FOUND`, 'The receiving record was not found.', {
        status: 404,
      });
    }
    const quantity = positiveOperationalQuantity(
      command.quantity ?? command.quantityReceived,
      entity.unit,
      'quantity',
    );
    let scopeRecord;
    if (kind === 'RESTOCK') {
      scopeRecord = await db
        .prepare(
          `SELECT restock.assigned_committee_id AS committee_id,
             request.requester_account_id AS owner_account_id
           FROM restock_requests restock
           LEFT JOIN requests request ON request.id = restock.source_request_id
           WHERE restock.id = ?1`,
        )
        .bind(entityId)
        .first();
    } else {
      scopeRecord = await db
        .prepare(
          `SELECT COALESCE(deliverable.assigned_committee_id, request.owner_committee_id) AS committee_id,
             request.requester_account_id AS owner_account_id
           FROM deliverables deliverable
           JOIN requests request ON request.id = deliverable.request_id
           WHERE deliverable.id = ?1`,
        )
        .bind(entityId)
        .first();
    }
    assertEntityScope(account, {
      committeeId: scopeRecord?.committee_id,
      ownerAccountId: scopeRecord?.owner_account_id,
    });
    const evidenceId = await requireStoredEvidence(command, {
      evidenceTypes:
        kind === 'RESTOCK'
          ? ['RESTOCK_RECEIPT', 'RESTOCK_INVOICE']
          : ['DELIVERABLE_RECEIPT', 'DELIVERABLE_DELIVERY_PROOF'],
      relatedEntityIds: [entityId],
    });
    const mutation = await replay(db, method, command.clientRequestId, account.id, command);
    if (mutation.replayed) return mutation.value;
    const requested = Number(kind === 'RESTOCK' ? entity.requested_quantity : entity.quantity_requested);
    const received = Number(kind === 'RESTOCK' ? entity.received_quantity : entity.quantity_received);
    if (received + quantity > requested) {
      throw new ApiError('OVER_RECEIVING', 'The receipt exceeds the approved cumulative quantity.', {
        status: 409,
      });
    }
    const itemId = kind === 'RESTOCK' ? entity.item_id : entity.inventory_match_id;
    const unit = requiredText(command.unit ?? entity.unit, 'unit', 40);
    const timestamp = nowIso();
    const receiptId = createId(kind === 'RESTOCK' ? 'RRC' : 'RCV');
    const nextReceived = received + quantity;
    const nextStatus = nextReceived >= requested ? 'RECEIVED' : 'PARTIALLY_RECEIVED';
    const result = {
      [kind === 'RESTOCK' ? 'restockId' : 'deliverableId']: entityId,
      receiptId,
      quantityReceived: quantity,
      cumulativeReceived: nextReceived,
      remaining: requested - nextReceived,
      status: nextStatus,
      correlationId,
    };
    const statements = [
      db
        .prepare(
          `INSERT INTO receiving_records (
             id, entity_type, entity_id, item_id, quantity, unit, evidence_id,
             received_by, received_at, idempotency_key, notes
           ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)`,
        )
        .bind(
          receiptId,
          kind,
          entityId,
          itemId || null,
          quantity,
          unit,
          evidenceId,
          account.id,
          timestamp,
          mutation.key,
          optionalText(command.notes, 500),
        ),
    ];
    if (kind === 'RESTOCK') {
      statements.push(
        db
          .prepare(
            `INSERT INTO restock_receipts (
               id, restock_request_id, quantity, unit, invoice_status, invoice_number,
               evidence_id, idempotency_key, received_at, received_by, notes
             ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)`,
          )
          .bind(
            receiptId,
            entityId,
            quantity,
            unit,
            optionalText(command.invoiceStatus, 80),
            optionalText(command.invoiceNumber, 120),
            evidenceId,
            mutation.key,
            timestamp,
            account.id,
            optionalText(command.notes, 500),
          ),
        db
          .prepare(
            `UPDATE restock_requests
             SET received_quantity = received_quantity + ?2,
                 status = ?3,
                 updated_at = ?4
             WHERE id = ?1 AND received_quantity + ?2 <= requested_quantity`,
          )
          .bind(entityId, quantity, nextStatus, timestamp),
      );
    } else {
      statements.push(
        db
          .prepare(
            `UPDATE deliverables
             SET quantity_received = quantity_received + ?2,
                 status = ?3,
                 receipt_status = ?3,
                 updated_at = ?4
             WHERE id = ?1 AND quantity_received + ?2 <= quantity_requested`,
          )
          .bind(entityId, quantity, nextStatus, timestamp),
      );
    }
    if (itemId) {
      statements.push(
        db
          .prepare(
            `INSERT INTO inventory_ledger (
               id, created_at, transaction_type, direction, item_id, quantity, unit,
               signed_quantity, related_entity_type, related_entity_id, actor_account_id,
               idempotency_key, status, notes
             ) VALUES (?1, ?2, 'RECEIVE', 'IN', ?3, ?4, ?5, ?4, ?6, ?7,
               ?8, ?9, 'POSTED', ?10)`,
          )
          .bind(
            createId('LED'),
            timestamp,
            itemId,
            quantity,
            unit,
            kind,
            entityId,
            account.id,
            mutation.key,
            optionalText(command.notes, 500),
          ),
      );
    }
    statements.push(
      historyStatement(db, {
        entityType: kind,
        entityId,
        previousStatus: entity.status,
        newStatus: nextStatus,
        accountId: account.id,
        idempotencyKey: mutation.key,
        reason: `Cumulative receiving ${nextReceived} of ${requested}.`,
      }),
      auditStatement(db, {
        action: `${kind}_RECEIVED`,
        entityType: kind,
        entityId,
        accountId: account.id,
        correlationId,
        after: { quantity, cumulativeReceived: nextReceived },
      }),
      idempotencyStatement(db, method, mutation, account.id, result),
      ...revisionStatements(db, [kind === 'RESTOCK' ? 'restocking' : 'procurement', 'inventory']),
    );
    try {
      await db.batch(statements);
    } catch (error) {
      if (String(error?.message ?? '').includes('exceeds approved quantity')) {
        throw new ApiError('OVER_RECEIVING', 'Concurrent receiving exhausted the approved quantity.', {
          status: 409,
        });
      }
      throw error;
    }
    return result;
  }

  const catalogItemSnapshot = (row) => ({
    ...itemDto(row),
    verificationNote: row.verification_note ?? '',
    notes: row.notes ?? '',
    updatedAt: row.updated_at,
  });

  const loadCatalogItem = async (itemId) =>
    db
      .prepare(
        `SELECT item.*, availability.on_hand, availability.reserved,
           availability.available_to_promise, availability.ready_to_claim, availability.on_loan,
           availability.overdue, availability.expected_return_at, availability.traceable_assets,
           availability.available_assets, availability.damaged_assets, availability.maintenance_assets,
           availability.lendable_available,
           (SELECT GROUP_CONCAT(display_alias, '|') FROM item_aliases alias
             WHERE alias.item_id = item.id) AS aliases,
           (SELECT COUNT(*) FROM inventory_ledger ledger WHERE ledger.item_id = item.id) AS ledger_count,
           (SELECT COUNT(*) FROM reservations reservation WHERE reservation.item_id = item.id) AS reservation_count,
           (SELECT COUNT(*) FROM lending_tickets ticket WHERE ticket.item_id = item.id) AS lending_ticket_count,
           (SELECT COUNT(*) FROM request_lines line WHERE line.item_id = item.id) AS request_line_count,
           (SELECT COUNT(*) FROM restock_requests restock WHERE restock.item_id = item.id) AS restock_count,
           (SELECT COUNT(*) FROM inventory_asset_instances asset WHERE asset.item_id = item.id) AS asset_count
         FROM inventory_items item
         JOIN lending_catalog_availability availability ON availability.item_id = item.id
         WHERE item.id = ?1`,
      )
      .bind(itemId)
      .first();

  const requireCatalogItem = async (itemId) => {
    const item = await loadCatalogItem(itemId);
    if (!item) throw new ApiError('ITEM_NOT_FOUND', 'The inventory item was not found.', { status: 404 });
    return item;
  };

  const requireCatalogRevision = (command, current) => {
    const expectedUpdatedAt = requiredText(command.expectedUpdatedAt, 'expectedUpdatedAt', 80);
    if (expectedUpdatedAt !== current.updated_at) {
      throw new ApiError('CATALOG_REVISION_CONFLICT', 'This catalog item changed. Refresh before saving.', {
        status: 409,
      });
    }
  };

  const nextCatalogTimestamp = (current = '') => {
    const timestamp = nowIso();
    if (!current || timestamp !== current) return timestamp;
    return new Date(Date.parse(timestamp) + 1).toISOString();
  };

  const aliasStatements = (itemId, aliases, { replace = false } = {}) => [
    ...(replace ? [db.prepare('DELETE FROM item_aliases WHERE item_id = ?1').bind(itemId)] : []),
    ...aliases.map(({ normalizedAlias, displayAlias }) =>
      db
        .prepare(
          `INSERT INTO item_aliases (item_id, normalized_alias, display_alias)
           VALUES (?1, ?2, ?3)`,
        )
        .bind(itemId, normalizedAlias, displayAlias),
    ),
  ];

  const catalogUnitDependencies = (current) => ({
    ledger: Number(current.ledger_count ?? 0),
    reservations: Number(current.reservation_count ?? 0),
    lendingTickets: Number(current.lending_ticket_count ?? 0),
    requestLines: Number(current.request_line_count ?? 0),
    restockRecords: Number(current.restock_count ?? 0),
    assets: Number(current.asset_count ?? 0),
  });

  const validateCatalogQuantities = ({ unit, reorderThreshold, maximumLoanQuantity, initialQuantity }) => ({
    reorderThreshold: nonNegativeOperationalQuantity(reorderThreshold ?? 0, unit, 'reorderThreshold'),
    maximumLoanQuantity:
      maximumLoanQuantity === '' || maximumLoanQuantity === null || maximumLoanQuantity === undefined
        ? null
        : positiveOperationalQuantity(maximumLoanQuantity, unit, 'maximumLoanQuantity'),
    initialQuantity:
      initialQuantity === undefined
        ? undefined
        : nonNegativeOperationalQuantity(initialQuantity, unit, 'initialQuantity'),
  });

  async function createInventoryItem({ account, command, correlationId }) {
    const authorization = assertCapability(account, CAPABILITIES.REFERENCE_CATALOG_MANAGE);
    const mutation = await replay(db, 'createInventoryItem', command.clientRequestId, account.id, command);
    if (mutation.replayed) return mutation.value;
    const itemId = createId('ITM');
    const name = requiredText(command.itemName ?? command.name, 'itemName', 240);
    const category = requiredText(command.category, 'category', 120);
    const stockArea = requiredText(command.stockArea, 'stockArea', 120);
    const storageLocation = requiredText(command.storageLocation ?? 'TO_BE_ASSIGNED', 'storageLocation', 160);
    const handling = normalizedHandling(command.handling ?? 'NON_CIRCULATING');
    const unit = requiredText(command.unit, 'unit', 40).toLowerCase();
    if (!isKnownQuantityUnit(unit)) {
      throw new ApiError('VALIDATION_FAILED', `Catalog item uses an unsupported unit: ${unit}.`);
    }
    const status = normalizedCatalogEnum(command.status, INVENTORY_STATUSES, 'status', 'ACTIVE');
    const catalogType = normalizedCatalogEnum(
      command.catalogType,
      INVENTORY_CATALOG_TYPES,
      'catalogType',
      stockArea.toUpperCase() === 'PANTRY' ? 'PANTRY' : 'OFFICE_INVENTORY',
    );
    const quantities = validateCatalogQuantities({
      unit,
      reorderThreshold: command.reorderThreshold,
      maximumLoanQuantity: command.maximumLoanQuantity,
      initialQuantity: command.initialQuantity ?? command.quantity ?? 0,
    });
    if (
      quantities.initialQuantity > 0 &&
      !authorization.capabilities.includes(CAPABILITIES.FULFILL_RECEIVE) &&
      !authorization.capabilities.includes(CAPABILITIES.INVENTORY_ADJUST) &&
      !authorization.capabilities.includes(CAPABILITIES.SYSTEM_ADMIN)
    ) {
      throw new ApiError(
        'CAPABILITY_REQUIRED',
        'Receiving or inventory-adjustment permission is required to post initial stock.',
        { status: 403 },
      );
    }
    const aliases = normalizedAliases(command.aliases);
    const defaultLoanDays = optionalPositiveInteger(command.defaultLoanDays, 'defaultLoanDays');
    const approvalRequired = booleanInput(command.approvalRequired, true);
    const verificationNote = optionalText(command.verificationNote, 1000);
    const notes = optionalText(command.notes, 2000);
    const timestamp = nowIso();
    const after = {
      id: itemId,
      name,
      aliases: aliases.map((alias) => alias.displayAlias),
      category,
      stockArea,
      storageLocation,
      handling,
      unit,
      status,
      catalogType,
      reorderThreshold: quantities.reorderThreshold,
      lendingAudience: 'NOT_AVAILABLE_FOR_LENDING',
      defaultLoanDays,
      maximumLoanQuantity: quantities.maximumLoanQuantity,
      approvalRequired,
      verificationNote,
      notes,
      inventoryKind: 'UNVERIFIED',
      classificationStatus: 'NEEDS_CLASSIFICATION',
      isLendable: false,
      updatedAt: timestamp,
    };
    const transactionId = quantities.initialQuantity > 0 ? createId('TXN') : null;
    const result = {
      itemId,
      status,
      updatedAt: timestamp,
      transactionId,
      initialQuantityPosted: quantities.initialQuantity,
      correlationId,
    };
    const statements = [
      db
        .prepare(
          `INSERT INTO inventory_items (
             id, name, category, stock_area, handling, unit, opening_quantity, status,
             catalog_type, storage_location, reorder_threshold, lending_audience,
             default_loan_days, maximum_loan_quantity, approval_required, legacy_source_sheet,
             verification_note, notes, created_at, updated_at, updated_by
           ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, 0, ?7, ?8, ?9, ?10,
             'NOT_AVAILABLE_FOR_LENDING', ?11, ?12, ?13, '', ?14, ?15, ?16, ?16, ?17)`,
        )
        .bind(
          itemId,
          name,
          category,
          stockArea,
          handling,
          unit,
          status,
          catalogType,
          storageLocation,
          quantities.reorderThreshold,
          defaultLoanDays,
          quantities.maximumLoanQuantity,
          approvalRequired ? 1 : 0,
          verificationNote,
          notes,
          timestamp,
          account.id,
        ),
      ...aliasStatements(itemId, aliases),
    ];
    if (transactionId) {
      statements.push(
        db
          .prepare(
            `INSERT INTO inventory_ledger (
               id, created_at, transaction_type, direction, item_id, quantity, unit,
               signed_quantity, related_entity_type, related_entity_id, actor_account_id,
               idempotency_key, status, notes
             ) VALUES (?1, ?2, 'OPENING_BALANCE', 'IN', ?3, ?4, ?5, ?4,
               'INVENTORY_ITEM', ?3, ?6, ?7, 'POSTED', ?8)`,
          )
          .bind(
            transactionId,
            timestamp,
            itemId,
            quantities.initialQuantity,
            unit,
            account.id,
            `${mutation.key}:opening`,
            optionalText(command.reason ?? command.notes ?? 'Catalog item creation', 1000),
          ),
      );
    }
    statements.push(
      historyStatement(db, {
        entityType: 'INVENTORY_ITEM',
        entityId: itemId,
        newStatus: status,
        accountId: account.id,
        idempotencyKey: mutation.key,
        reason: optionalText(command.reason ?? 'Catalog item created', 500),
        metadata: { before: {}, after },
      }),
      auditStatement(db, {
        action: 'CREATE_INVENTORY_ITEM',
        entityType: 'INVENTORY_ITEM',
        entityId: itemId,
        accountId: account.id,
        correlationId,
        before: {},
        after,
      }),
      idempotencyStatement(db, 'createInventoryItem', mutation, account.id, result),
      ...revisionStatements(db, ['inventory', 'lending']),
    );
    await db.batch(statements);
    return result;
  }

  async function updateInventoryItem({ account, command, correlationId }) {
    assertCapability(account, CAPABILITIES.REFERENCE_CATALOG_MANAGE);
    const mutation = await replay(db, 'updateInventoryItem', command.clientRequestId, account.id, command);
    if (mutation.replayed) return mutation.value;
    const itemId = requiredText(command.itemId, 'itemId', 80);
    const current = await requireCatalogItem(itemId);
    if (current.status === 'ARCHIVED') {
      throw new ApiError('ITEM_ARCHIVED', 'Restore this item before editing it.', { status: 409 });
    }
    requireCatalogRevision(command, current);
    const before = catalogItemSnapshot(current);
    const has = (field) => Object.prototype.hasOwnProperty.call(command, field);
    const name =
      has('itemName') || has('name')
        ? requiredText(command.itemName ?? command.name, 'itemName', 240)
        : current.name;
    const category = has('category') ? requiredText(command.category, 'category', 120) : current.category;
    const stockArea = has('stockArea')
      ? requiredText(command.stockArea, 'stockArea', 120)
      : current.stock_area;
    const storageLocation = has('storageLocation')
      ? requiredText(command.storageLocation, 'storageLocation', 160)
      : current.storage_location;
    const handling = has('handling') ? normalizedHandling(command.handling) : current.handling;
    const unit = has('unit') ? requiredText(command.unit, 'unit', 40).toLowerCase() : current.unit;
    if (!isKnownQuantityUnit(unit)) {
      throw new ApiError('VALIDATION_FAILED', `Catalog item uses an unsupported unit: ${unit}.`);
    }
    if (unit !== current.unit) {
      const dependencies = catalogUnitDependencies(current);
      if (Object.values(dependencies).some((count) => count > 0)) {
        throw new ApiError(
          'HISTORICAL_UNIT_CHANGE_BLOCKED',
          'The unit cannot change because historical or active records depend on it.',
          { status: 409, details: dependencies },
        );
      }
    }
    if (
      handling !== current.handling &&
      current.classification_status === 'CLASSIFIED' &&
      handling !==
        (current.inventory_kind === 'REUSABLE'
          ? 'REUSABLE_ASSET'
          : current.inventory_kind === 'CONSUMABLE'
            ? 'CONSUMABLE'
            : 'TO_CLASSIFY')
    ) {
      throw new ApiError(
        'CLASSIFICATION_CONTROLLED_FIELD',
        'Handling for a classified item must be changed through physical classification review.',
        { status: 409 },
      );
    }
    const status = has('status')
      ? normalizedCatalogEnum(command.status, INVENTORY_STATUSES, 'status')
      : current.status;
    const catalogType = has('catalogType')
      ? normalizedCatalogEnum(command.catalogType, INVENTORY_CATALOG_TYPES, 'catalogType')
      : current.catalog_type;
    const quantities = validateCatalogQuantities({
      unit,
      reorderThreshold: has('reorderThreshold') ? command.reorderThreshold : current.reorder_threshold,
      maximumLoanQuantity: has('maximumLoanQuantity')
        ? command.maximumLoanQuantity
        : current.maximum_loan_quantity,
    });
    const defaultLoanDays = has('defaultLoanDays')
      ? optionalPositiveInteger(command.defaultLoanDays, 'defaultLoanDays')
      : current.default_loan_days;
    const approvalRequired = has('approvalRequired')
      ? booleanInput(command.approvalRequired, true)
      : current.approval_required === 1;
    let lendingAudience = has('lendingAudience')
      ? normalizedCatalogEnum(command.lendingAudience, LENDING_AUDIENCES, 'lendingAudience')
      : current.lending_audience;
    const isLendable =
      current.is_lendable === 1 &&
      current.classification_status === 'CLASSIFIED' &&
      status === 'ACTIVE' &&
      handling !== 'NON_CIRCULATING';
    if (!isLendable) lendingAudience = 'NOT_AVAILABLE_FOR_LENDING';
    const verificationNote = has('verificationNote')
      ? optionalText(command.verificationNote, 1000)
      : current.verification_note;
    const notes = has('notes') ? optionalText(command.notes, 2000) : current.notes;
    const aliases = has('aliases') ? normalizedAliases(command.aliases) : normalizedAliases(current.aliases);
    const timestamp = nextCatalogTimestamp(current.updated_at);
    const after = {
      ...before,
      name,
      aliases: aliases.map((alias) => alias.displayAlias),
      category,
      stockArea,
      storageLocation,
      handling,
      unit,
      status,
      catalogType,
      reorderThreshold: quantities.reorderThreshold,
      lendingAudience,
      defaultLoanDays,
      maximumLoanQuantity: handling === 'NON_CIRCULATING' ? null : quantities.maximumLoanQuantity,
      approvalRequired,
      verificationNote,
      notes,
      isLendable,
      updatedAt: timestamp,
    };
    const result = { itemId, status, updatedAt: timestamp, correlationId };
    const statements = [
      db
        .prepare(
          `UPDATE inventory_items SET name = ?1, category = ?2, stock_area = ?3,
             storage_location = ?4, handling = ?5, unit = ?6, status = ?7, catalog_type = ?8,
             reorder_threshold = ?9, lending_audience = ?10, default_loan_days = ?11,
             maximum_loan_quantity = ?12, approval_required = ?13, verification_note = ?14,
             notes = ?15, is_lendable = ?16, lending_status = ?17, lending_unit = ?6,
             updated_at = ?18, updated_by = ?19
           WHERE id = ?20 AND updated_at = ?21`,
        )
        .bind(
          name,
          category,
          stockArea,
          storageLocation,
          handling,
          unit,
          status,
          catalogType,
          quantities.reorderThreshold,
          lendingAudience,
          defaultLoanDays,
          after.maximumLoanQuantity,
          approvalRequired ? 1 : 0,
          verificationNote,
          notes,
          isLendable ? 1 : 0,
          isLendable ? 'ACTIVE' : 'NOT_LENDABLE',
          timestamp,
          account.id,
          itemId,
          current.updated_at,
        ),
      ...(has('aliases') ? aliasStatements(itemId, aliases, { replace: true }) : []),
      historyStatement(db, {
        entityType: 'INVENTORY_ITEM',
        entityId: itemId,
        previousStatus: current.status,
        newStatus: status,
        accountId: account.id,
        idempotencyKey: mutation.key,
        reason: optionalText(command.reason ?? 'Catalog item updated', 500),
        metadata: { before, after },
      }),
      auditStatement(db, {
        action: 'UPDATE_INVENTORY_ITEM',
        entityType: 'INVENTORY_ITEM',
        entityId: itemId,
        accountId: account.id,
        correlationId,
        before,
        after,
      }),
      idempotencyStatement(db, 'updateInventoryItem', mutation, account.id, result),
      ...revisionStatements(db, ['inventory', 'lending']),
    ];
    await db.batch(statements);
    return result;
  }

  async function updateInventoryStorageContext({ account, command, correlationId }) {
    assertCapability(account, CAPABILITIES.REFERENCE_CATALOG_MANAGE);
    const mutation = await replay(
      db,
      'updateInventoryStorageContext',
      command.clientRequestId,
      account.id,
      command,
    );
    if (mutation.replayed) return mutation.value;
    const itemId = requiredText(command.itemId, 'itemId', 80);
    const current = await requireCatalogItem(itemId);
    if (current.status === 'ARCHIVED') {
      throw new ApiError('ITEM_ARCHIVED', 'Restore this item before changing its storage context.', {
        status: 409,
      });
    }
    requireCatalogRevision(command, current);
    const before = catalogItemSnapshot(current);
    const stockArea = requiredText(command.stockArea, 'stockArea', 120);
    const storageLocation = requiredText(command.storageLocation, 'storageLocation', 160);
    const timestamp = nextCatalogTimestamp(current.updated_at);
    const after = { ...before, stockArea, storageLocation, updatedAt: timestamp };
    const result = { itemId, stockArea, storageLocation, updatedAt: timestamp, correlationId };
    await db.batch([
      db
        .prepare(
          `UPDATE inventory_items SET stock_area = ?1, storage_location = ?2,
             updated_at = ?3, updated_by = ?4 WHERE id = ?5 AND updated_at = ?6`,
        )
        .bind(stockArea, storageLocation, timestamp, account.id, itemId, current.updated_at),
      historyStatement(db, {
        entityType: 'INVENTORY_ITEM',
        entityId: itemId,
        previousStatus: current.status,
        newStatus: current.status,
        accountId: account.id,
        idempotencyKey: mutation.key,
        reason: optionalText(command.note ?? command.reason ?? 'Storage context updated', 500),
        metadata: { before, after },
      }),
      auditStatement(db, {
        action: 'UPDATE_INVENTORY_STORAGE',
        entityType: 'INVENTORY_ITEM',
        entityId: itemId,
        accountId: account.id,
        correlationId,
        before,
        after,
      }),
      idempotencyStatement(db, 'updateInventoryStorageContext', mutation, account.id, result),
      ...revisionStatements(db, ['inventory']),
    ]);
    return result;
  }

  async function archiveInventoryItem({ account, command, correlationId }) {
    assertCapability(account, CAPABILITIES.REFERENCE_CATALOG_MANAGE);
    const mutation = await replay(db, 'archiveInventoryItem', command.clientRequestId, account.id, command);
    if (mutation.replayed) return mutation.value;
    const itemId = requiredText(command.itemId, 'itemId', 80);
    const current = await requireCatalogItem(itemId);
    if (current.status === 'ARCHIVED') {
      throw new ApiError('INVALID_TRANSITION', 'This item is already archived.', { status: 409 });
    }
    requireCatalogRevision(command, current);
    const dependencies = await db
      .prepare(
        `SELECT balance.on_hand, balance.reserved,
           (SELECT COUNT(*) FROM lending_tickets ticket WHERE ticket.item_id = item.id
             AND ticket.status NOT IN ('RETURNED', 'COMPLETED', 'REJECTED', 'CANCELLED')) AS open_lending,
           (SELECT COUNT(*) FROM request_lines line WHERE line.item_id = item.id
             AND line.status NOT IN ('COMPLETED', 'REJECTED', 'CANCELLED')) AS active_lines,
           (SELECT COUNT(*) FROM restock_requests restock WHERE restock.item_id = item.id
             AND restock.status NOT IN ('RESTOCKED', 'COMPLETED', 'REJECTED', 'CANCELLED')) AS open_restocks,
           (SELECT COUNT(*) FROM inventory_asset_instances asset WHERE asset.item_id = item.id
             AND asset.lifecycle_status <> 'ARCHIVED') AS active_assets
         FROM inventory_items item JOIN inventory_balances balance ON balance.item_id = item.id
         WHERE item.id = ?1`,
      )
      .bind(itemId)
      .first();
    const dependencySummary = {
      onHand: Number(dependencies?.on_hand ?? 0),
      activeReservations: Number(dependencies?.reserved ?? 0),
      openLendingTickets: Number(dependencies?.open_lending ?? 0),
      activeRequestLines: Number(dependencies?.active_lines ?? 0),
      openRestockRequests: Number(dependencies?.open_restocks ?? 0),
      activeAssets: Number(dependencies?.active_assets ?? 0),
    };
    if (Object.values(dependencySummary).some((value) => value !== 0)) {
      throw new ApiError(
        'ARCHIVE_NOT_ALLOWED',
        'Archive requires zero balance and no active reservation, lending, request, restock, or asset dependencies.',
        { status: 409, details: dependencySummary },
      );
    }
    const before = catalogItemSnapshot(current);
    const timestamp = nextCatalogTimestamp(current.updated_at);
    const after = {
      ...before,
      status: 'ARCHIVED',
      isLendable: false,
      lendingAudience: 'NOT_AVAILABLE_FOR_LENDING',
      updatedAt: timestamp,
    };
    const result = { itemId, status: 'ARCHIVED', updatedAt: timestamp, correlationId };
    await db.batch([
      db
        .prepare(
          `UPDATE inventory_items SET status = 'ARCHIVED', is_lendable = 0,
             lending_audience = 'NOT_AVAILABLE_FOR_LENDING', lending_status = 'NOT_LENDABLE',
             updated_at = ?1, updated_by = ?2 WHERE id = ?3 AND updated_at = ?4`,
        )
        .bind(timestamp, account.id, itemId, current.updated_at),
      historyStatement(db, {
        entityType: 'INVENTORY_ITEM',
        entityId: itemId,
        previousStatus: current.status,
        newStatus: 'ARCHIVED',
        accountId: account.id,
        idempotencyKey: mutation.key,
        reason: optionalText(command.reason ?? 'Item archived', 500),
        metadata: { before, after, dependencies: dependencySummary },
      }),
      auditStatement(db, {
        action: 'ARCHIVE_INVENTORY_ITEM',
        entityType: 'INVENTORY_ITEM',
        entityId: itemId,
        accountId: account.id,
        correlationId,
        before,
        after,
      }),
      idempotencyStatement(db, 'archiveInventoryItem', mutation, account.id, result),
      ...revisionStatements(db, ['inventory', 'lending']),
    ]);
    return result;
  }

  async function restoreInventoryItem({ account, command, correlationId }) {
    assertCapability(account, CAPABILITIES.REFERENCE_CATALOG_MANAGE);
    const mutation = await replay(db, 'restoreInventoryItem', command.clientRequestId, account.id, command);
    if (mutation.replayed) return mutation.value;
    const itemId = requiredText(command.itemId, 'itemId', 80);
    const current = await requireCatalogItem(itemId);
    if (current.status !== 'ARCHIVED') {
      throw new ApiError('INVALID_TRANSITION', 'Only archived items may be restored.', { status: 409 });
    }
    requireCatalogRevision(command, current);
    const requestedStatus = normalizedCatalogEnum(command.status, INVENTORY_STATUSES, 'status', 'ACTIVE');
    const status = current.verification_note ? 'VERIFY' : requestedStatus;
    const before = catalogItemSnapshot(current);
    const timestamp = nextCatalogTimestamp(current.updated_at);
    const after = {
      ...before,
      status,
      isLendable: false,
      lendingAudience: 'NOT_AVAILABLE_FOR_LENDING',
      updatedAt: timestamp,
    };
    const result = { itemId, status, updatedAt: timestamp, correlationId };
    await db.batch([
      db
        .prepare(
          `UPDATE inventory_items SET status = ?1, is_lendable = 0,
             lending_audience = 'NOT_AVAILABLE_FOR_LENDING', lending_status = 'NOT_LENDABLE',
             updated_at = ?2, updated_by = ?3 WHERE id = ?4 AND updated_at = ?5`,
        )
        .bind(status, timestamp, account.id, itemId, current.updated_at),
      historyStatement(db, {
        entityType: 'INVENTORY_ITEM',
        entityId: itemId,
        previousStatus: 'ARCHIVED',
        newStatus: status,
        accountId: account.id,
        idempotencyKey: mutation.key,
        reason: optionalText(command.reason ?? 'Item restored', 500),
        metadata: { before, after },
      }),
      auditStatement(db, {
        action: 'RESTORE_INVENTORY_ITEM',
        entityType: 'INVENTORY_ITEM',
        entityId: itemId,
        accountId: account.id,
        correlationId,
        before,
        after,
      }),
      idempotencyStatement(db, 'restoreInventoryItem', mutation, account.id, result),
      ...revisionStatements(db, ['inventory', 'lending']),
    ]);
    return result;
  }

  async function listInventoryClassifications({ account, command = {}, correlationId }) {
    assertInventoryClassificationAccess(account);
    const page = pageInput(command);
    const statusFilter = String(command.status ?? 'NEEDS_CLASSIFICATION')
      .trim()
      .toUpperCase();
    if (!new Set(['ALL', ...CLASSIFICATION_STATUSES]).has(statusFilter)) {
      throw new ApiError('VALIDATION_FAILED', 'Choose an approved classification status filter.');
    }
    const kindFilter = String(command.inventoryKind ?? 'ALL')
      .trim()
      .toUpperCase();
    if (!new Set(['ALL', ...INVENTORY_KINDS]).has(kindFilter)) {
      throw new ApiError('VALIDATION_FAILED', 'Choose an approved inventory kind filter.');
    }
    const search = optionalText(command.search, 120).toUpperCase();
    const conditions = ["item.status <> 'ARCHIVED'"];
    const values = [];
    if (statusFilter !== 'ALL') {
      values.push(statusFilter);
      conditions.push(`item.classification_status = ?${values.length}`);
    }
    if (kindFilter !== 'ALL') {
      values.push(kindFilter);
      conditions.push(`item.inventory_kind = ?${values.length}`);
    }
    if (search) {
      values.push(`%${search}%`);
      conditions.push(
        `(upper(item.id) LIKE ?${values.length} OR upper(item.name) LIKE ?${values.length} ` +
          `OR upper(item.category) LIKE ?${values.length} OR upper(item.stock_area) LIKE ?${values.length})`,
      );
    }
    const where = conditions.join(' AND ');
    const [summary, totalRow, itemRows] = await Promise.all([
      db
        .prepare(
          `SELECT COUNT(*) AS total,
             SUM(CASE WHEN classification_status = 'NEEDS_CLASSIFICATION' THEN 1 ELSE 0 END) AS pending,
             SUM(CASE WHEN classification_status = 'CLASSIFIED' THEN 1 ELSE 0 END) AS classified
           FROM inventory_items WHERE status <> 'ARCHIVED'`,
        )
        .first(),
      (values.length
        ? db.prepare(`SELECT COUNT(*) AS count FROM inventory_items item WHERE ${where}`).bind(...values)
        : db.prepare(`SELECT COUNT(*) AS count FROM inventory_items item WHERE ${where}`)
      ).first(),
      rows(
        db,
        `SELECT item.*, availability.on_hand, availability.reserved,
           availability.available_to_promise, availability.ready_to_claim, availability.on_loan,
           availability.overdue, availability.expected_return_at, availability.traceable_assets,
           availability.available_assets, availability.damaged_assets, availability.maintenance_assets,
           availability.lendable_available
         FROM inventory_items item
         JOIN lending_catalog_availability availability ON availability.item_id = item.id
         WHERE ${where}
         ORDER BY CASE item.classification_status WHEN 'NEEDS_CLASSIFICATION' THEN 0 ELSE 1 END,
           item.name, item.id
         LIMIT ?${values.length + 1} OFFSET ?${values.length + 2}`,
        [...values, page.pageSize, page.offset],
      ),
    ]);
    const ids = itemRows.map((item) => item.id);
    const historyRows = ids.length
      ? await rows(
          db,
          `SELECT id, item_id, revision, previous_status, new_status, previous_kind, new_kind,
             lendable_enabled, lending_audience, condition_review_state,
             maintenance_review_state, asset_instance_count, classification_notes,
             evidence_id, bulk_group_id, occurred_at, actor_account_id, correlation_id
           FROM inventory_classification_history
           WHERE item_id IN (${ids.map((_, index) => `?${index + 1}`).join(', ')})
           ORDER BY occurred_at DESC LIMIT 500`,
          ids,
        )
      : [];
    const historyByItem = new Map();
    for (const entry of historyRows) {
      if (!historyByItem.has(entry.item_id)) historyByItem.set(entry.item_id, []);
      historyByItem.get(entry.item_id).push({
        id: entry.id,
        revision: Number(entry.revision),
        previousStatus: entry.previous_status,
        newStatus: entry.new_status,
        previousKind: entry.previous_kind,
        newKind: entry.new_kind,
        isLendable: entry.lendable_enabled === 1,
        lendingAudience: entry.lending_audience,
        conditionReviewState: entry.condition_review_state,
        maintenanceReviewState: entry.maintenance_review_state,
        assetInstanceCount: Number(entry.asset_instance_count),
        classificationNotes: entry.classification_notes,
        evidenceId: entry.evidence_id,
        bulkGroupId: entry.bulk_group_id,
        occurredAt: entry.occurred_at,
        actorAccountId: entry.actor_account_id,
        correlationId: entry.correlation_id,
      });
    }
    return {
      ok: true,
      correlationId,
      progress: {
        total: Number(summary?.total ?? 0),
        pending: Number(summary?.pending ?? 0),
        classified: Number(summary?.classified ?? 0),
      },
      page: page.page,
      pageSize: page.pageSize,
      total: Number(totalRow?.count ?? 0),
      items: itemRows.map((item) => ({
        ...itemDto(item),
        assetInstanceCount: Number(item.traceable_assets ?? 0),
        classificationHistory: historyByItem.get(item.id) ?? [],
      })),
    };
  }

  async function prepareInventoryClassification({
    account,
    command,
    correlationId,
    bulkGroupId = '',
    idempotencyKey,
  }) {
    const itemId = requiredText(command.itemId, 'itemId', 80);
    const current = await db
      .prepare(
        `SELECT item.*,
           (SELECT COUNT(*) FROM inventory_ledger ledger WHERE ledger.item_id = item.id) AS ledger_count,
           (SELECT COUNT(*) FROM inventory_asset_instances asset
             WHERE asset.item_id = item.id AND asset.lifecycle_status <> 'ARCHIVED') AS asset_count
         FROM inventory_items item WHERE item.id = ?1 AND item.status <> 'ARCHIVED'`,
      )
      .bind(itemId)
      .first();
    if (!current) {
      throw new ApiError('ITEM_NOT_FOUND', 'The inventory item was not found.', { status: 404 });
    }
    const expectedRevision = Number(command.expectedRevision);
    if (!Number.isInteger(expectedRevision) || expectedRevision !== Number(current.classification_revision)) {
      throw new ApiError(
        'CLASSIFICATION_REVISION_CONFLICT',
        'This classification changed. Refresh the queue before saving.',
        { status: 409 },
      );
    }
    const classificationStatus = classificationEnum(
      command.classificationStatus,
      CLASSIFICATION_STATUSES,
      'classification status',
      'NEEDS_CLASSIFICATION',
    );
    const inventoryKind = classificationEnum(
      command.inventoryKind,
      INVENTORY_KINDS,
      'inventory kind',
      'UNVERIFIED',
    );
    if (classificationStatus === 'CLASSIFIED' && inventoryKind === 'UNVERIFIED') {
      throw new ApiError(
        'VALIDATION_FAILED',
        'A completed classification requires reusable or consumable kind.',
      );
    }
    let conditionReviewState = classificationEnum(
      command.conditionReviewState,
      CONDITION_REVIEW_STATES,
      'condition review state',
      inventoryKind === 'CONSUMABLE' ? 'NOT_APPLICABLE' : 'NOT_ASSESSED',
    );
    let maintenanceReviewState = classificationEnum(
      command.maintenanceReviewState,
      MAINTENANCE_REVIEW_STATES,
      'maintenance review state',
      inventoryKind === 'CONSUMABLE' ? 'NOT_APPLICABLE' : 'NOT_ASSESSED',
    );
    if (inventoryKind !== 'REUSABLE') {
      conditionReviewState = inventoryKind === 'CONSUMABLE' ? 'NOT_APPLICABLE' : 'NOT_ASSESSED';
      maintenanceReviewState = inventoryKind === 'CONSUMABLE' ? 'NOT_APPLICABLE' : 'NOT_ASSESSED';
    }
    if (
      classificationStatus === 'CLASSIFIED' &&
      inventoryKind === 'REUSABLE' &&
      (conditionReviewState === 'NOT_ASSESSED' || maintenanceReviewState === 'NOT_ASSESSED')
    ) {
      throw new ApiError(
        'PHYSICAL_REVIEW_REQUIRED',
        'Reusable classification requires a physical condition and maintenance review.',
        { status: 409 },
      );
    }
    let isLendable =
      classificationStatus === 'CLASSIFIED' && (command.isLendable === true || command.isLendable === 'true');
    let lendingAudience = classificationEnum(
      command.lendingAudience,
      LENDING_AUDIENCES,
      'lending audience',
      'NOT_AVAILABLE_FOR_LENDING',
    );
    if (isLendable && command.enableLendingConfirmed !== true && command.enableLendingConfirmed !== 'true') {
      throw new ApiError(
        'LENDING_CONFIRMATION_REQUIRED',
        'Explicit confirmation is required before enabling lending.',
        { status: 409 },
      );
    }
    if (isLendable && lendingAudience === 'NOT_AVAILABLE_FOR_LENDING') {
      throw new ApiError('VALIDATION_FAILED', 'Choose an approved lending audience before enabling lending.');
    }
    if (
      isLendable &&
      inventoryKind === 'REUSABLE' &&
      (!['NEW', 'GOOD', 'FAIR'].includes(conditionReviewState) || maintenanceReviewState !== 'CLEARED')
    ) {
      throw new ApiError(
        'UNSAFE_REUSABLE_LENDING_BLOCKED',
        'Reusable lending remains disabled until condition is safe and maintenance is cleared.',
        { status: 409 },
      );
    }
    if (!isLendable) lendingAudience = 'NOT_AVAILABLE_FOR_LENDING';

    const stockArea = requiredText(command.stockArea ?? current.stock_area, 'stockArea', 120);
    const storageLocation = requiredText(
      command.storageLocation ?? current.storage_location,
      'storageLocation',
      160,
    );
    const unit = requiredText(command.unit ?? current.unit, 'unit', 40);
    if (unit !== current.unit && Number(current.ledger_count) > 0) {
      throw new ApiError(
        'HISTORICAL_UNIT_CHANGE_BLOCKED',
        'An item with ledger history cannot change unit through classification.',
        { status: 409 },
      );
    }
    const reorderThreshold = Number(command.reorderThreshold ?? current.reorder_threshold);
    if (
      !isKnownQuantityUnit(unit) ||
      !Number.isFinite(reorderThreshold) ||
      reorderThreshold < 0 ||
      (isCountableUnit(unit) && !Number.isInteger(reorderThreshold))
    ) {
      throw new ApiError(
        'VALIDATION_FAILED',
        !isKnownQuantityUnit(unit)
          ? `Reorder threshold uses an unsupported unit: ${unit}.`
          : isCountableUnit(unit)
            ? `Reorder threshold must be a whole number for ${unit}.`
            : 'Reorder threshold must be zero or greater.',
      );
    }
    const classificationNotes = optionalText(command.classificationNotes, 1000);
    const evidenceId = optionalText(command.evidenceId, 120);
    if (evidenceId) {
      const evidence = await db
        .prepare(
          `SELECT id FROM evidence_metadata
           WHERE id = ?1 AND related_entity_id = ?2 AND upload_status NOT IN ('FAILED', 'ARCHIVED')`,
        )
        .bind(evidenceId, itemId)
        .first();
      if (!evidence) {
        throw new ApiError(
          'CLASSIFICATION_EVIDENCE_INVALID',
          'Classification evidence must be an active governed file linked to this item.',
          { status: 409 },
        );
      }
    }
    const existingAssetCount = Number(current.asset_count ?? 0);
    const requestedAssetCount = Number(command.assetInstanceCountIfReusable ?? existingAssetCount);
    if (!Number.isInteger(requestedAssetCount) || requestedAssetCount < 0) {
      throw new ApiError('VALIDATION_FAILED', 'Asset instance count must be a whole number zero or greater.');
    }
    const assetTags = Array.isArray(command.assetTags)
      ? command.assetTags.map((tag) => requiredText(tag, 'assetTag', 80).toUpperCase())
      : [];
    if (new Set(assetTags).size !== assetTags.length) {
      throw new ApiError('ASSET_TAG_CONFLICT', 'Asset tags in this classification must be unique.', {
        status: 409,
      });
    }
    if (inventoryKind !== 'REUSABLE' && (requestedAssetCount !== 0 || assetTags.length)) {
      throw new ApiError('ASSET_ITEM_NOT_TRACEABLE', 'Only reusable items may have asset instances.', {
        status: 409,
      });
    }
    if (requestedAssetCount < existingAssetCount) {
      throw new ApiError(
        'ASSET_INSTANCE_COUNT_CONFLICT',
        'Classification cannot remove existing physical asset instances.',
        { status: 409 },
      );
    }
    if (requestedAssetCount - existingAssetCount !== assetTags.length) {
      throw new ApiError(
        'ASSET_INSTANCE_COUNT_CONFLICT',
        'Enter one new physical asset tag for every added asset instance.',
        { status: 409 },
      );
    }
    if (
      assetTags.length &&
      (classificationStatus !== 'CLASSIFIED' ||
        (command.assetTrackingConfirmed !== true && command.assetTrackingConfirmed !== 'true') ||
        conditionReviewState === 'NOT_ASSESSED')
    ) {
      throw new ApiError(
        'ASSET_TRACKING_CONFIRMATION_REQUIRED',
        'Confirm reusable kind, actual instance count, individual tracking, and physical condition before creating assets.',
        { status: 409 },
      );
    }
    const timestamp = nowIso();
    const nextRevision = expectedRevision + 1;
    const handling =
      inventoryKind === 'REUSABLE'
        ? 'REUSABLE_ASSET'
        : inventoryKind === 'CONSUMABLE'
          ? 'CONSUMABLE'
          : 'TO_CLASSIFY';
    const result = {
      itemId,
      classificationStatus,
      inventoryKind,
      isLendable,
      lendingAudience,
      assetInstanceCount: requestedAssetCount,
      classificationRevision: nextRevision,
      correlationId,
    };
    const assetLifecycleStatus =
      maintenanceReviewState === 'MAINTENANCE_REQUIRED'
        ? 'MAINTENANCE'
        : ['POOR'].includes(conditionReviewState)
          ? 'QUARANTINE'
          : conditionReviewState === 'DAMAGED'
            ? 'DAMAGED'
            : 'AVAILABLE';
    const statements = [
      db
        .prepare(
          `UPDATE inventory_items SET
             stock_area = ?1, storage_location = ?2, handling = ?3, unit = ?4,
             reorder_threshold = ?5, inventory_kind = ?6, classification_status = ?7,
             condition_review_state = ?8, maintenance_review_state = ?9,
             classification_notes = ?10, classification_evidence_id = ?11,
             classification_revision = ?12, classified_at = ?13, classified_by = ?14,
             is_lendable = ?15, lending_audience = ?16, lending_kind = ?17,
             lending_status = ?18, lending_unit = ?4, due_date_required = ?19,
             condition_tracking = ?20, eligibility_rule = ?21,
             lending_handling_notes = ?10, updated_at = ?22, updated_by = ?14
           WHERE id = ?23 AND classification_revision = ?24`,
        )
        .bind(
          stockArea,
          storageLocation,
          handling,
          unit,
          reorderThreshold,
          inventoryKind,
          classificationStatus,
          conditionReviewState,
          maintenanceReviewState,
          classificationNotes,
          evidenceId,
          nextRevision,
          classificationStatus === 'CLASSIFIED' ? timestamp : null,
          classificationStatus === 'CLASSIFIED' ? account.id : null,
          isLendable ? 1 : 0,
          lendingAudience,
          inventoryKind === 'REUSABLE' ? 'REUSABLE' : 'CONSUMABLE',
          isLendable ? 'ACTIVE' : 'NOT_LENDABLE',
          inventoryKind === 'REUSABLE' ? 1 : 0,
          inventoryKind === 'REUSABLE' ? 1 : 0,
          isLendable
            ? lendingAudience === 'STUDENTS_AND_STAFF'
              ? 'HAU students and authorized USC staff'
              : lendingAudience === 'USC_STAFF_ONLY'
                ? 'Authorized USC staff only'
                : 'Authorized DOL users only'
            : '',
          timestamp,
          itemId,
          expectedRevision,
        ),
      db
        .prepare(
          `INSERT INTO inventory_classification_history (
             id, item_id, revision, previous_status, new_status, previous_kind, new_kind,
             lendable_enabled, lending_audience, condition_review_state,
             maintenance_review_state, asset_instance_count, classification_notes,
             evidence_id, bulk_group_id, occurred_at, actor_account_id, correlation_id
           ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18)`,
        )
        .bind(
          createId('ICH'),
          itemId,
          nextRevision,
          current.classification_status,
          classificationStatus,
          current.inventory_kind,
          inventoryKind,
          isLendable ? 1 : 0,
          lendingAudience,
          conditionReviewState,
          maintenanceReviewState,
          requestedAssetCount,
          classificationNotes,
          evidenceId,
          bulkGroupId,
          timestamp,
          account.id,
          correlationId,
        ),
      historyStatement(db, {
        entityType: 'INVENTORY_CLASSIFICATION',
        entityId: itemId,
        previousStatus: current.classification_status,
        newStatus: classificationStatus,
        accountId: account.id,
        idempotencyKey,
        reason: classificationNotes,
        metadata: { inventoryKind, isLendable, assetInstanceCount: requestedAssetCount },
      }),
      auditStatement(db, {
        action: 'INVENTORY_CLASSIFICATION_RECORDED',
        entityType: 'INVENTORY_ITEM',
        entityId: itemId,
        accountId: account.id,
        correlationId,
        after: {
          classificationStatus,
          inventoryKind,
          isLendable,
          lendingAudience,
          conditionReviewState,
          maintenanceReviewState,
          assetInstanceCount: requestedAssetCount,
          classificationRevision: nextRevision,
          evidenceLinked: Boolean(evidenceId),
          bulkGroupId,
        },
      }),
    ];
    for (const assetTag of assetTags) {
      const assetId = createId('AST');
      statements.push(
        db
          .prepare(
            `INSERT INTO inventory_asset_instances (
               id, item_id, asset_tag, condition_label, lifecycle_status,
               created_at, updated_at, created_by, updated_by
             ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?6, ?7, ?7)`,
          )
          .bind(assetId, itemId, assetTag, conditionReviewState, assetLifecycleStatus, timestamp, account.id),
        db
          .prepare(
            `INSERT INTO inventory_asset_movements (
               id, asset_id, movement_type, new_status, condition_label,
               occurred_at, recorded_by, notes
             ) VALUES (?1, ?2, 'REGISTERED', ?3, ?4, ?5, ?6, ?7)`,
          )
          .bind(
            createId('AMV'),
            assetId,
            assetLifecycleStatus,
            conditionReviewState,
            timestamp,
            account.id,
            classificationNotes,
          ),
      );
    }
    return { result, statements };
  }

  function throwInventoryClassificationWriteError(error) {
    if (String(error?.message ?? '').includes('inventory_classification_history.item_id')) {
      throw new ApiError(
        'CLASSIFICATION_REVISION_CONFLICT',
        'This classification changed. Refresh the queue before saving.',
        { status: 409 },
      );
    }
    if (String(error?.message ?? '').includes('UNIQUE constraint failed')) {
      throw new ApiError('ASSET_TAG_CONFLICT', 'An entered asset tag is already registered.', {
        status: 409,
      });
    }
    throw error;
  }

  async function classifyInventoryItem({ account, command, correlationId }) {
    assertInventoryClassificationAccess(account);
    if (optionalText(command.bulkGroupId, 120)) {
      throw new ApiError(
        'VALIDATION_FAILED',
        'Bulk classification groups must use the atomic bulk classification action.',
      );
    }
    const mutation = await replay(db, 'classifyInventoryItem', command.clientRequestId, account.id, command);
    if (mutation.replayed) return mutation.value;
    const prepared = await prepareInventoryClassification({
      account,
      command,
      correlationId,
      idempotencyKey: mutation.key,
    });
    try {
      await db.batch([
        ...prepared.statements,
        idempotencyStatement(db, 'classifyInventoryItem', mutation, account.id, prepared.result),
        ...revisionStatements(db, ['inventory', 'lending']),
      ]);
    } catch (error) {
      throwInventoryClassificationWriteError(error);
    }
    return prepared.result;
  }

  async function bulkClassifyInventoryItems({ account, command, correlationId }) {
    assertInventoryClassificationAccess(account);
    if (command.similarityConfirmed !== true && command.similarityConfirmed !== 'true') {
      throw new ApiError(
        'BULK_SIMILARITY_CONFIRMATION_REQUIRED',
        'Confirm that every selected item received the same physical classification review.',
        { status: 409 },
      );
    }
    if (!Array.isArray(command.items) || command.items.length < 2 || command.items.length > 50) {
      throw new ApiError('VALIDATION_FAILED', 'Bulk classification requires between 2 and 50 items.');
    }
    const bulkReason = requiredText(command.reason ?? command.items[0]?.classificationNotes, 'reason', 1000);
    const itemIds = command.items.map((item) => requiredText(item?.itemId, 'itemId', 80));
    if (new Set(itemIds).size !== itemIds.length) {
      throw new ApiError('VALIDATION_FAILED', 'Each item may appear only once in a bulk classification.');
    }
    for (const item of command.items) {
      if (optionalText(item.bulkGroupId, 120)) {
        throw new ApiError('VALIDATION_FAILED', 'Bulk group identifiers are generated by the server.');
      }
      if (
        String(item.classificationStatus ?? '')
          .trim()
          .toUpperCase() !== 'CLASSIFIED'
      ) {
        throw new ApiError('VALIDATION_FAILED', 'Bulk classification may only complete reviewed items.');
      }
      if (
        item.isLendable === true ||
        item.isLendable === 'true' ||
        String(item.lendingAudience ?? 'NOT_AVAILABLE_FOR_LENDING')
          .trim()
          .toUpperCase() !== 'NOT_AVAILABLE_FOR_LENDING'
      ) {
        throw new ApiError(
          'BULK_LENDING_ENABLEMENT_BLOCKED',
          'Bulk classification cannot enable lending for any selected item.',
          { status: 409 },
        );
      }
      if (Array.isArray(item.assetTags) && item.assetTags.length) {
        throw new ApiError(
          'BULK_ASSET_CREATION_BLOCKED',
          'Register new reusable asset instances through an individual classification review.',
          { status: 409 },
        );
      }
    }
    const mutation = await replay(
      db,
      'bulkClassifyInventoryItems',
      command.clientRequestId,
      account.id,
      command,
    );
    if (mutation.replayed) return mutation.value;
    const bulkGroupId = createId('BCL');
    const preparedItems = [];
    for (const item of command.items) {
      preparedItems.push(
        await prepareInventoryClassification({
          account,
          command: {
            ...item,
            classificationNotes: optionalText(item.classificationNotes, 1000) || bulkReason,
          },
          correlationId,
          bulkGroupId,
          idempotencyKey: mutation.key,
        }),
      );
    }
    const result = {
      itemIds,
      count: itemIds.length,
      bulkGroupId,
      correlationId,
      classificationRevisions: Object.fromEntries(
        preparedItems.map(({ result: item }) => [item.itemId, item.classificationRevision]),
      ),
      items: preparedItems.map(({ result: item }) => item),
    };
    try {
      await db.batch([
        ...preparedItems.flatMap((prepared) => prepared.statements),
        idempotencyStatement(db, 'bulkClassifyInventoryItems', mutation, account.id, result),
        ...revisionStatements(db, ['inventory', 'lending']),
      ]);
    } catch (error) {
      throwInventoryClassificationWriteError(error);
    }
    return result;
  }

  async function postCycleCountAdjustment({ account, command, correlationId }) {
    assertCapability(account, METHOD_CAPABILITIES.postCycleCountAdjustment);
    const itemId = requiredText(command.itemId, 'itemId', 80);
    const balance = await db
      .prepare(
        `SELECT balance.on_hand, item.unit
         FROM inventory_balances balance
         JOIN inventory_items item ON item.id = balance.item_id
         WHERE balance.item_id = ?1`,
      )
      .bind(itemId)
      .first();
    if (!balance) {
      throw new ApiError('ITEM_NOT_FOUND', 'The inventory item was not found.', { status: 404 });
    }
    const countedQuantity = nonNegativeOperationalQuantity(
      command.countedQuantity,
      balance.unit,
      'countedQuantity',
    );
    const delta = countedQuantity - Number(balance.on_hand);
    if (delta === 0) {
      throw new ApiError('NO_ADJUSTMENT_REQUIRED', 'The count already matches authoritative stock.');
    }
    const mutation = await replay(
      db,
      'postCycleCountAdjustment',
      command.clientRequestId,
      account.id,
      command,
    );
    if (mutation.replayed) return mutation.value;
    const transactionId = createId('LED');
    const result = {
      transactionId,
      itemId,
      previousOnHand: Number(balance.on_hand),
      countedQuantity,
      delta,
      correlationId,
    };
    await db.batch([
      db
        .prepare(
          `INSERT INTO inventory_ledger (
             id, created_at, transaction_type, direction, item_id, quantity, unit,
             signed_quantity, related_entity_type, related_entity_id, actor_account_id,
             idempotency_key, status, notes
           ) SELECT ?1, ?2, 'CYCLE_COUNT_ADJUSTMENT', 'ADJUSTMENT', item.id, ?3,
             item.unit, ?4, 'INVENTORY_ITEM', item.id, ?5, ?6, 'POSTED', ?7
             FROM inventory_items item WHERE item.id = ?8`,
        )
        .bind(
          transactionId,
          nowIso(),
          Math.abs(delta),
          delta,
          account.id,
          mutation.key,
          requiredText(command.reason, 'reason', 500),
          itemId,
        ),
      auditStatement(db, {
        action: 'CYCLE_COUNT_ADJUSTMENT',
        entityType: 'INVENTORY_ITEM',
        entityId: itemId,
        accountId: account.id,
        correlationId,
        after: { countedQuantity, delta },
      }),
      idempotencyStatement(db, 'postCycleCountAdjustment', mutation, account.id, result),
      ...revisionStatements(db, ['inventory']),
    ]);
    return result;
  }

  async function getEventManagement({ account, correlationId }) {
    assertCapability(account, METHOD_CAPABILITIES.getEventManagement);
    const [series, eventDays, activities, committees, history, links] = await Promise.all([
      rows(
        db,
        `SELECT id, code, name, status, revision, owner_review_status, source_reference,
                supersedes_reference, notes, archived_at, created_at, updated_at, created_by, updated_by
         FROM event_series ORDER BY CASE status WHEN 'ACTIVE' THEN 0 ELSE 1 END, name`,
      ),
      rows(
        db,
        `SELECT id, event_series_id, name, event_date, status, revision, owner_review_status,
                notes, active, archived_at, created_at, updated_at, created_by, updated_by
         FROM event_days ORDER BY event_date, name`,
      ),
      rows(
        db,
        `SELECT event.*, committee.name AS responsible_committee_name
         FROM events event
         LEFT JOIN committees committee ON committee.id = event.owner_committee_id
         ORDER BY COALESCE(event.starts_at, event_day.event_date || 'T23:59:59'), event.name`.replace(
          'FROM events event',
          'FROM events event LEFT JOIN event_days event_day ON event_day.id = event.event_day_id',
        ),
      ),
      rows(db, 'SELECT id, name FROM committees WHERE active = 1 ORDER BY name'),
      rows(
        db,
        `SELECT history.*, account.profile_full_name AS actor_name,
                account.access_id_normalized AS actor_access_id
         FROM event_activity_history history
         LEFT JOIN accounts account ON account.id = history.actor_account_id
         ORDER BY history.occurred_at DESC LIMIT 500`,
      ),
      rows(
        db,
        `SELECT link.*, account.profile_full_name AS linked_by_name
         FROM event_operational_links link
         LEFT JOIN accounts account ON account.id = link.linked_by
         ORDER BY link.linked_at DESC`,
      ),
    ]);
    return {
      ok: true,
      correlationId,
      eventSeries: series.map((entry) => ({
        id: entry.id,
        code: entry.code,
        name: entry.name,
        status: entry.status,
        revision: Number(entry.revision || 1),
        ownerReviewStatus: entry.owner_review_status,
        sourceReference: entry.source_reference || null,
        supersedesReference: entry.supersedes_reference || null,
        notes: entry.notes || null,
        archivedAt: entry.archived_at,
        createdAt: entry.created_at,
        updatedAt: entry.updated_at,
        updatedBy: entry.updated_by || entry.created_by || null,
      })),
      eventDays: eventDays.map((entry) => ({
        id: entry.id,
        seriesId: entry.event_series_id,
        name: entry.name,
        date: entry.event_date,
        status: entry.status,
        revision: Number(entry.revision || 1),
        ownerReviewStatus: entry.owner_review_status,
        notes: entry.notes || null,
        active: entry.active === 1,
        archivedAt: entry.archived_at,
        createdAt: entry.created_at,
        updatedAt: entry.updated_at,
        updatedBy: entry.updated_by || entry.created_by || null,
      })),
      activities: activities.map(eventActivityDto),
      committees,
      history: history.map((entry) => ({
        id: entry.id,
        seriesId: entry.event_series_id,
        eventDayId: entry.event_day_id,
        activityId: entry.event_id,
        entityType: entry.entity_type,
        entityId: entry.entity_id,
        action: entry.action,
        before: entry.before_json ? JSON.parse(entry.before_json) : null,
        after: entry.after_json ? JSON.parse(entry.after_json) : null,
        reason: entry.reason,
        actorId: entry.actor_account_id,
        actorName: entry.actor_name || entry.actor_access_id,
        occurredAt: entry.occurred_at,
        correlationId: entry.correlation_id,
      })),
      links: links.map((entry) => ({
        id: entry.id,
        seriesId: entry.event_series_id,
        eventDayId: entry.event_day_id,
        activityId: entry.event_id,
        linkType: entry.link_type,
        linkedEntityType: entry.linked_entity_type,
        linkedEntityId: entry.linked_entity_id,
        notes: entry.notes || null,
        linkedBy: entry.linked_by,
        linkedByName: entry.linked_by_name || null,
        linkedAt: entry.linked_at,
      })),
    };
  }

  async function allocateEventCode(name, year, excludeId = '') {
    const words = name
      .normalize('NFKD')
      .replace(/[^A-Za-z0-9 ]+/gu, ' ')
      .trim()
      .split(/\s+/u)
      .filter(Boolean);
    const acronym = (words.length > 1 ? words.map((word) => word[0]).join('') : words[0] || 'EVENT')
      .slice(0, 12)
      .toUpperCase();
    const base = `${acronym}-${year}`;
    for (let sequence = 1; sequence <= 999; sequence += 1) {
      const code = sequence === 1 ? base : `${base}-${sequence}`;
      const existing = await db
        .prepare('SELECT id FROM event_series WHERE code = ?1 AND id <> ?2')
        .bind(code, excludeId)
        .first();
      if (!existing) return code;
    }
    throw new ApiError('EVENT_CODE_EXHAUSTED', 'A unique event code could not be allocated.', {
      status: 409,
    });
  }

  async function allocateActivityCode(seriesCode, name, excludeId = '') {
    const activityToken =
      name
        .normalize('NFKD')
        .replace(/[^A-Za-z0-9 ]+/gu, ' ')
        .trim()
        .split(/\s+/u)
        .filter(Boolean)
        .map((word) => word[0])
        .join('')
        .slice(0, 10)
        .toUpperCase() || 'ACT';
    const base = `${seriesCode}-${activityToken}`;
    for (let sequence = 1; sequence <= 999; sequence += 1) {
      const code = sequence === 1 ? base : `${base}-${sequence}`;
      const existing = await db
        .prepare('SELECT id FROM events WHERE code = ?1 AND id <> ?2')
        .bind(code, excludeId)
        .first();
      if (!existing) return code;
    }
    throw new ApiError('EVENT_CODE_EXHAUSTED', 'A unique activity code could not be allocated.', {
      status: 409,
    });
  }

  async function saveEventSeries({ account, command, correlationId }) {
    assertCapability(account, METHOD_CAPABILITIES.saveEventSeries);
    const mutation = await replay(db, 'saveEventSeries', command.clientRequestId, account.id, command);
    if (mutation.replayed) return mutation.value;
    const id = optionalText(command.eventSeriesId, 80) || createId('SER');
    const existing = command.eventSeriesId
      ? await db.prepare('SELECT * FROM event_series WHERE id = ?1').bind(id).first()
      : null;
    if (command.eventSeriesId && !existing) {
      throw new ApiError('EVENT_SERIES_NOT_FOUND', 'The selected main event was not found.', { status: 404 });
    }
    const name = requiredText(command.name ?? existing?.name, 'name', 200);
    const status = requiredText(command.status ?? existing?.status ?? 'ACTIVE', 'status', 32).toUpperCase();
    if (!['ACTIVE', 'ARCHIVED'].includes(status)) {
      throw new ApiError('VALIDATION_FAILED', 'Main event status must be Active or Archived.');
    }
    const yearMatch = name.match(/\b(20\d{2})\b/u);
    const year = Number(command.year || yearMatch?.[1] || new Date().getUTCFullYear());
    if (!Number.isInteger(year) || year < 2000 || year > 2200) {
      throw new ApiError('VALIDATION_FAILED', 'Choose a valid event year.');
    }
    const expectedRevision = existing ? Number(command.expectedRevision) : 0;
    if (existing && (!Number.isInteger(expectedRevision) || expectedRevision !== Number(existing.revision))) {
      throw new ApiError('REVISION_CONFLICT', 'This main event changed. Refresh before saving.', {
        status: 409,
      });
    }
    const code = existing?.code || (await allocateEventCode(name, year));
    const sourceReference = optionalText(command.sourceReference ?? existing?.source_reference, 500);
    const supersedesReference = optionalText(
      command.supersedesReference ?? existing?.supersedes_reference,
      500,
    );
    const notes = optionalText(command.notes ?? existing?.notes, 1000);
    const reason = requiredText(command.reason, 'reason', 500);
    const timestamp = nowIso();
    const revision = existing ? expectedRevision + 1 : 1;
    const archivedAt = status === 'ARCHIVED' ? timestamp : null;
    const result = { eventSeriesId: id, code, status, revision, correlationId };
    const statement = existing
      ? db
          .prepare(
            `UPDATE event_series SET name = ?2, status = ?3, revision = ?4,
               owner_review_status = 'OWNER_REVIEW_REQUIRED', source_reference = ?5,
               supersedes_reference = ?6, notes = ?7, archived_at = ?8, updated_at = ?9,
               updated_by = ?10 WHERE id = ?1 AND revision = ?11`,
          )
          .bind(
            id,
            name,
            status,
            revision,
            sourceReference,
            supersedesReference,
            notes,
            archivedAt,
            timestamp,
            account.id,
            expectedRevision,
          )
      : db
          .prepare(
            `INSERT INTO event_series (
               id, code, name, status, revision, owner_review_status, source_reference,
               supersedes_reference, notes, archived_at, created_at, updated_at, created_by, updated_by
             ) VALUES (?1, ?2, ?3, ?4, 1, 'OWNER_REVIEW_REQUIRED', ?5, ?6, ?7, ?8, ?9, ?9, ?10, ?10)`,
          )
          .bind(
            id,
            code,
            name,
            status,
            sourceReference,
            supersedesReference,
            notes,
            archivedAt,
            timestamp,
            account.id,
          );
    await db.batch([
      statement,
      eventActivityHistoryStatement(db, {
        eventSeriesId: id,
        entityType: 'EVENT_SERIES',
        entityId: id,
        action: existing ? (status === 'ARCHIVED' ? 'ARCHIVED' : 'UPDATED') : 'CREATED',
        before: existing,
        after: { id, code, name, status, revision, sourceReference, supersedesReference, notes },
        reason,
        accountId: account.id,
        correlationId,
        idempotencyKey: mutation.key,
      }),
      auditStatement(db, {
        action: existing ? 'EVENT_SERIES_UPDATED' : 'EVENT_SERIES_CREATED',
        entityType: 'EVENT_SERIES',
        entityId: id,
        accountId: account.id,
        correlationId,
        after: result,
      }),
      idempotencyStatement(db, 'saveEventSeries', mutation, account.id, result),
      ...revisionStatements(db, ['request', 'release']),
    ]);
    return result;
  }

  async function saveEventDay({ account, command, correlationId }) {
    assertCapability(account, METHOD_CAPABILITIES.saveEventDay);
    const mutation = await replay(db, 'saveEventDay', command.clientRequestId, account.id, command);
    if (mutation.replayed) return mutation.value;
    const id = optionalText(command.eventDayId, 80) || createId('EDY');
    const existing = command.eventDayId
      ? await db.prepare('SELECT * FROM event_days WHERE id = ?1').bind(id).first()
      : null;
    if (command.eventDayId && !existing) {
      throw new ApiError('EVENT_DAY_NOT_FOUND', 'The selected event day was not found.', { status: 404 });
    }
    const seriesId = requiredText(command.eventSeriesId ?? existing?.event_series_id, 'eventSeriesId', 80);
    const series = await db
      .prepare('SELECT id FROM event_series WHERE id = ?1 AND status <> ?2')
      .bind(seriesId, 'ARCHIVED')
      .first();
    if (!series)
      throw new ApiError('EVENT_SERIES_NOT_FOUND', 'Choose an active main event.', { status: 404 });
    const eventDate = requiredText(command.date ?? existing?.event_date, 'date', 10);
    if (!/^20\d{2}-\d{2}-\d{2}$/u.test(eventDate) || Number.isNaN(Date.parse(`${eventDate}T00:00:00Z`))) {
      throw new ApiError('VALIDATION_FAILED', 'Event day date must use YYYY-MM-DD.');
    }
    const status = requiredText(command.status ?? existing?.status ?? 'UPCOMING', 'status', 32).toUpperCase();
    if (!['UPCOMING', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'ARCHIVED'].includes(status)) {
      throw new ApiError('VALIDATION_FAILED', 'Choose an approved event-day status.');
    }
    const expectedRevision = existing ? Number(command.expectedRevision) : 0;
    if (existing && (!Number.isInteger(expectedRevision) || expectedRevision !== Number(existing.revision))) {
      throw new ApiError('REVISION_CONFLICT', 'This event day changed. Refresh before saving.', {
        status: 409,
      });
    }
    const name =
      optionalText(command.name, 200) ||
      new Intl.DateTimeFormat('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        timeZone: 'UTC',
      }).format(new Date(`${eventDate}T00:00:00Z`));
    const notes = optionalText(command.notes ?? existing?.notes, 1000);
    const reason = requiredText(command.reason, 'reason', 500);
    const timestamp = nowIso();
    const revision = existing ? expectedRevision + 1 : 1;
    const archivedAt = status === 'ARCHIVED' ? timestamp : null;
    const active = status === 'ARCHIVED' ? 0 : 1;
    const result = {
      eventDayId: id,
      eventSeriesId: seriesId,
      date: eventDate,
      status,
      revision,
      correlationId,
    };
    const statement = existing
      ? db
          .prepare(
            `UPDATE event_days SET event_series_id = ?2, name = ?3, event_date = ?4, status = ?5,
             revision = ?6, owner_review_status = 'OWNER_REVIEW_REQUIRED', notes = ?7, active = ?8,
             archived_at = ?9, updated_at = ?10, updated_by = ?11
           WHERE id = ?1 AND revision = ?12`,
          )
          .bind(
            id,
            seriesId,
            name,
            eventDate,
            status,
            revision,
            notes,
            active,
            archivedAt,
            timestamp,
            account.id,
            expectedRevision,
          )
      : db
          .prepare(
            `INSERT INTO event_days (
             id, event_series_id, name, event_date, status, revision, owner_review_status,
             notes, active, archived_at, created_at, updated_at, created_by, updated_by
           ) VALUES (?1, ?2, ?3, ?4, ?5, 1, 'OWNER_REVIEW_REQUIRED', ?6, ?7, ?8, ?9, ?9, ?10, ?10)`,
          )
          .bind(id, seriesId, name, eventDate, status, notes, active, archivedAt, timestamp, account.id);
    await db.batch([
      statement,
      eventActivityHistoryStatement(db, {
        eventSeriesId: seriesId,
        eventDayId: id,
        entityType: 'EVENT_DAY',
        entityId: id,
        action: existing ? (status === 'ARCHIVED' ? 'ARCHIVED' : 'UPDATED') : 'CREATED',
        before: existing,
        after: { id, seriesId, name, eventDate, status, revision, notes },
        reason,
        accountId: account.id,
        correlationId,
        idempotencyKey: mutation.key,
      }),
      auditStatement(db, {
        action: existing ? 'EVENT_DAY_UPDATED' : 'EVENT_DAY_CREATED',
        entityType: 'EVENT_DAY',
        entityId: id,
        accountId: account.id,
        correlationId,
        after: result,
      }),
      idempotencyStatement(db, 'saveEventDay', mutation, account.id, result),
      ...revisionStatements(db, ['request', 'release']),
    ]);
    return result;
  }

  async function saveEventActivity({ account, command, correlationId }) {
    assertCapability(account, METHOD_CAPABILITIES.saveEventActivity);
    const mutation = await replay(db, 'saveEventActivity', command.clientRequestId, account.id, command);
    if (mutation.replayed) return mutation.value;
    const id = optionalText(command.activityId ?? command.eventId, 80) || createId('EVT');
    const existing =
      command.activityId || command.eventId
        ? await db.prepare('SELECT * FROM events WHERE id = ?1').bind(id).first()
        : null;
    if ((command.activityId || command.eventId) && !existing) {
      throw new ApiError('EVENT_ACTIVITY_NOT_FOUND', 'The selected activity was not found.', { status: 404 });
    }
    const eventDayId = requiredText(command.eventDayId ?? existing?.event_day_id, 'eventDayId', 80);
    const eventDay = await db
      .prepare(
        `SELECT day.*, series.code AS series_code FROM event_days day
                JOIN event_series series ON series.id = day.event_series_id
                WHERE day.id = ?1 AND day.active = 1 AND series.status <> 'ARCHIVED'`,
      )
      .bind(eventDayId)
      .first();
    if (!eventDay) throw new ApiError('EVENT_DAY_NOT_FOUND', 'Choose an active event day.', { status: 404 });
    const name = requiredText(command.name ?? existing?.name, 'name', 240);
    const activityType = requiredText(command.activityType ?? existing?.activity_type, 'activityType', 120);
    const includedItems = Array.isArray(command.includedItems)
      ? [...new Set(command.includedItems.map((value) => requiredText(value, 'includedItem', 120)))]
      : parseJsonArray(existing?.included_items_json);
    const timeStatus = requiredText(
      command.timeStatus ?? existing?.time_status ?? 'TBA',
      'timeStatus',
      20,
    ).toUpperCase();
    if (!['TBA', 'SCHEDULED'].includes(timeStatus)) {
      throw new ApiError('VALIDATION_FAILED', 'Activity time status must be TBA or Scheduled.');
    }
    const startAt = timeStatus === 'TBA' ? null : nullableText(command.startAt ?? existing?.starts_at, 40);
    const endAt = timeStatus === 'TBA' ? null : nullableText(command.endAt ?? existing?.ends_at, 40);
    if (timeStatus === 'SCHEDULED') {
      if (
        !startAt ||
        !endAt ||
        Number.isNaN(Date.parse(startAt)) ||
        Number.isNaN(Date.parse(endAt)) ||
        Date.parse(endAt) <= Date.parse(startAt)
      ) {
        throw new ApiError(
          'VALIDATION_FAILED',
          'Scheduled activities require a valid start and later end time.',
        );
      }
      if (!startAt.startsWith(eventDay.event_date) || !endAt.startsWith(eventDay.event_date)) {
        throw new ApiError('VALIDATION_FAILED', 'Activity times must fall on the selected event day.');
      }
    }
    const venue = requiredText(command.venue ?? existing?.venue, 'venue', 240);
    const status = requiredText(command.status ?? existing?.status ?? 'UPCOMING', 'status', 32).toUpperCase();
    if (!['UPCOMING', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'ARCHIVED'].includes(status)) {
      throw new ApiError('VALIDATION_FAILED', 'Choose an approved activity status.');
    }
    const commandOrExisting = (commandKey, column) =>
      Object.prototype.hasOwnProperty.call(command, commandKey) ? command[commandKey] : existing?.[column];
    const responsibleCommitteeId = nullableText(
      commandOrExisting('responsibleCommitteeId', 'owner_committee_id'),
      80,
    );
    const supportingCommitteeIds = Array.isArray(command.supportingCommitteeIds)
      ? [
          ...new Set(
            command.supportingCommitteeIds.map((value) => requiredText(value, 'supportingCommitteeId', 80)),
          ),
        ]
      : parseJsonArray(existing?.supporting_committees_json);
    const committeeIds = [...new Set([responsibleCommitteeId, ...supportingCommitteeIds].filter(Boolean))];
    if (committeeIds.length) {
      const placeholders = committeeIds.map((_, index) => `?${index + 1}`).join(', ');
      const found = await rows(
        db,
        `SELECT id FROM committees WHERE active = 1 AND id IN (${placeholders})`,
        committeeIds,
      );
      if (found.length !== committeeIds.length) {
        throw new ApiError('VALIDATION_FAILED', 'Choose only active responsible and supporting committees.');
      }
    }
    const preparationDeadline = nullableText(
      commandOrExisting('preparationDeadline', 'preparation_deadline'),
      40,
    );
    const requestWindowOpensAt = nullableText(
      commandOrExisting('requestWindowOpensAt', 'request_window_opens_at'),
      40,
    );
    const requestWindowClosesAt = nullableText(
      commandOrExisting('requestWindowClosesAt', 'request_window_closes_at'),
      40,
    );
    const releaseDeadline = nullableText(commandOrExisting('releaseDeadline', 'release_deadline'), 40);
    for (const [field, value] of Object.entries({
      preparationDeadline,
      requestWindowOpensAt,
      requestWindowClosesAt,
      releaseDeadline,
    })) {
      if (value && Number.isNaN(Date.parse(value)))
        throw new ApiError('VALIDATION_FAILED', `${field} must be a valid date and time.`);
    }
    if (
      requestWindowOpensAt &&
      requestWindowClosesAt &&
      Date.parse(requestWindowClosesAt) <= Date.parse(requestWindowOpensAt)
    ) {
      throw new ApiError('VALIDATION_FAILED', 'The request window must close after it opens.');
    }
    const readinessPercentage = nullablePercentage(
      commandOrExisting('readinessPercentage', 'readiness_percentage'),
      'readinessPercentage',
    );
    const preparationProgress = nullablePercentage(
      commandOrExisting('preparationProgress', 'preparation_progress'),
      'preparationProgress',
    );
    const notes = optionalText(commandOrExisting('notes', 'notes'), 2000);
    const sourceReference = optionalText(commandOrExisting('sourceReference', 'source_reference'), 500);
    const ownerReviewStatus = [
      responsibleCommitteeId,
      supportingCommitteeIds.length ? supportingCommitteeIds : null,
      preparationDeadline,
      requestWindowOpensAt,
      requestWindowClosesAt,
      releaseDeadline,
      readinessPercentage,
      preparationProgress,
      notes || null,
    ].every((value) => value !== null)
      ? 'REVIEW_COMPLETE'
      : 'OWNER_REVIEW_REQUIRED';
    const expectedRevision = existing ? Number(command.expectedRevision) : 0;
    if (existing && (!Number.isInteger(expectedRevision) || expectedRevision !== Number(existing.revision))) {
      throw new ApiError('REVISION_CONFLICT', 'This activity changed. Refresh before saving.', {
        status: 409,
      });
    }
    const code = existing?.code || (await allocateActivityCode(eventDay.series_code, name));
    const reason = requiredText(command.reason, 'reason', 500);
    const timestamp = nowIso();
    const revision = existing ? expectedRevision + 1 : 1;
    const active = status === 'ARCHIVED' ? 0 : 1;
    const archivedAt = status === 'ARCHIVED' ? timestamp : null;
    const result = {
      activityId: id,
      eventId: id,
      eventDayId,
      eventSeriesId: eventDay.event_series_id,
      code,
      status,
      timeStatus,
      ownerReviewStatus,
      revision,
      correlationId,
    };
    const statement = existing
      ? db
          .prepare(
            `UPDATE events SET event_series_id = ?2, event_day_id = ?3, name = ?4, code = ?5,
             activity_type = ?6, included_items_json = ?7, time_status = ?8,
             starts_at = ?9, ends_at = ?10, venue = ?11,
             owner_committee_id = ?12, supporting_committees_json = ?13,
             preparation_deadline = ?14, request_window_opens_at = ?15,
             request_window_closes_at = ?16, release_deadline = ?17,
             readiness_percentage = ?18, preparation_progress = ?19, status = ?20,
             owner_review_status = ?21, revision = ?22, notes = ?23, source_reference = ?24,
             active = ?25, archived_at = ?26, updated_at = ?27, updated_by = ?28
           WHERE id = ?1 AND revision = ?29`,
          )
          .bind(
            id,
            eventDay.event_series_id,
            eventDayId,
            name,
            code,
            activityType,
            JSON.stringify(includedItems),
            timeStatus,
            startAt,
            endAt,
            venue,
            responsibleCommitteeId,
            JSON.stringify(supportingCommitteeIds),
            preparationDeadline,
            requestWindowOpensAt,
            requestWindowClosesAt,
            releaseDeadline,
            readinessPercentage,
            preparationProgress,
            status,
            ownerReviewStatus,
            revision,
            notes,
            sourceReference,
            active,
            archivedAt,
            timestamp,
            account.id,
            expectedRevision,
          )
      : db
          .prepare(
            `INSERT INTO events (
             id, event_series_id, event_day_id, name, code, activity_type, included_items_json,
             time_status, starts_at, ends_at, venue, owner_committee_id, supporting_committees_json,
             preparation_deadline, request_window_opens_at, request_window_closes_at,
             release_deadline, readiness_percentage, preparation_progress, status,
             owner_review_status, revision, notes, source_reference, active, archived_at,
             department, external_reference, created_at, updated_at, created_by, updated_by
           ) VALUES (
             ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15,
             ?16, ?17, ?18, ?19, ?20, ?21, 1, ?22, ?23, ?24, ?25, '', '', ?26, ?26, ?27, ?27
           )`,
          )
          .bind(
            id,
            eventDay.event_series_id,
            eventDayId,
            name,
            code,
            activityType,
            JSON.stringify(includedItems),
            timeStatus,
            startAt,
            endAt,
            venue,
            responsibleCommitteeId,
            JSON.stringify(supportingCommitteeIds),
            preparationDeadline,
            requestWindowOpensAt,
            requestWindowClosesAt,
            releaseDeadline,
            readinessPercentage,
            preparationProgress,
            status,
            ownerReviewStatus,
            notes,
            sourceReference,
            active,
            archivedAt,
            timestamp,
            account.id,
          );
    await db.batch([
      statement,
      eventActivityHistoryStatement(db, {
        eventSeriesId: eventDay.event_series_id,
        eventDayId,
        eventId: id,
        entityType: 'EVENT_ACTIVITY',
        entityId: id,
        action: existing ? (status === 'ARCHIVED' ? 'ARCHIVED' : 'CORRECTED') : 'CREATED',
        before: existing,
        after: {
          ...result,
          name,
          activityType,
          includedItems,
          startAt,
          endAt,
          venue,
          responsibleCommitteeId,
          supportingCommitteeIds,
          preparationDeadline,
          requestWindowOpensAt,
          requestWindowClosesAt,
          releaseDeadline,
          readinessPercentage,
          preparationProgress,
          notes,
        },
        reason,
        accountId: account.id,
        correlationId,
        idempotencyKey: mutation.key,
      }),
      auditStatement(db, {
        action: existing ? 'EVENT_ACTIVITY_CORRECTED' : 'EVENT_ACTIVITY_CREATED',
        entityType: 'EVENT_ACTIVITY',
        entityId: id,
        accountId: account.id,
        correlationId,
        after: result,
      }),
      idempotencyStatement(db, 'saveEventActivity', mutation, account.id, result),
      ...revisionStatements(db, ['request', 'release']),
    ]);
    return result;
  }

  async function linkEventOperationalRecord({ account, command, correlationId }) {
    assertCapability(account, METHOD_CAPABILITIES.linkEventOperationalRecord);
    const mutation = await replay(
      db,
      'linkEventOperationalRecord',
      command.clientRequestId,
      account.id,
      command,
    );
    if (mutation.replayed) return mutation.value;
    const activityId = requiredText(command.activityId ?? command.eventId, 'activityId', 80);
    const activity = await db
      .prepare('SELECT id, event_series_id, event_day_id FROM events WHERE id = ?1 AND active = 1')
      .bind(activityId)
      .first();
    if (!activity)
      throw new ApiError('EVENT_ACTIVITY_NOT_FOUND', 'Choose an active activity.', { status: 404 });
    const linkType = requiredText(command.linkType, 'linkType', 40).toUpperCase();
    const targets = {
      REQUEST: ['requests', 'REQUEST'],
      FOOD_REQUIREMENT: ['request_lines', 'REQUEST_LINE'],
      MATERIAL: ['request_lines', 'REQUEST_LINE'],
      PROCUREMENT: ['deliverables', 'DELIVERABLE'],
      INVENTORY_REQUIREMENT: ['request_lines', 'REQUEST_LINE'],
      RELEASE: ['release_confirmations', 'RELEASE_CONFIRMATION'],
    };
    const target = targets[linkType];
    if (!target) throw new ApiError('VALIDATION_FAILED', 'Choose an approved operational link type.');
    const linkedEntityId = requiredText(command.linkedEntityId, 'linkedEntityId', 100);
    const linkedEntity = await db
      .prepare(`SELECT id FROM ${target[0]} WHERE id = ?1`)
      .bind(linkedEntityId)
      .first();
    if (!linkedEntity)
      throw new ApiError('LINKED_RECORD_NOT_FOUND', 'The operational record was not found.', { status: 404 });
    const linkId = createId('EVL');
    const notes = nullableText(command.notes, 1000);
    const reason = requiredText(command.reason, 'reason', 500);
    const result = { linkId, activityId, linkType, linkedEntityId, correlationId };
    await db.batch([
      db
        .prepare(
          `INSERT INTO event_operational_links (
           id, event_series_id, event_day_id, event_id, link_type, linked_entity_type,
           linked_entity_id, notes, linked_by, linked_at
         ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)`,
        )
        .bind(
          linkId,
          activity.event_series_id,
          activity.event_day_id,
          activityId,
          linkType,
          target[1],
          linkedEntityId,
          notes,
          account.id,
          nowIso(),
        ),
      eventActivityHistoryStatement(db, {
        eventSeriesId: activity.event_series_id,
        eventDayId: activity.event_day_id,
        eventId: activityId,
        entityType: 'EVENT_LINK',
        entityId: linkId,
        action: 'LINKED',
        after: { linkType, linkedEntityType: target[1], linkedEntityId, notes },
        reason,
        accountId: account.id,
        correlationId,
        idempotencyKey: mutation.key,
      }),
      auditStatement(db, {
        action: 'EVENT_OPERATIONAL_RECORD_LINKED',
        entityType: 'EVENT_ACTIVITY',
        entityId: activityId,
        accountId: account.id,
        correlationId,
        after: result,
      }),
      idempotencyStatement(db, 'linkEventOperationalRecord', mutation, account.id, result),
      ...revisionStatements(db, ['request', 'release']),
    ]);
    return result;
  }

  async function migrationStatus({ account, correlationId }) {
    assertCapability(account, METHOD_CAPABILITIES.getMigrationStatus);
    const migrations = await rows(db, 'SELECT name, applied_at FROM d1_migrations ORDER BY id');
    const schema = await db
      .prepare("SELECT value, updated_at FROM app_metadata WHERE key = 'operational_schema_version'")
      .first();
    const latest = await db
      .prepare(
        'SELECT id, source_snapshot_hash, status, source_row_count, imported_row_count, rejected_row_count, reconciled_at FROM import_batches ORDER BY created_at DESC LIMIT 1',
      )
      .first();
    return {
      ok: true,
      correlationId,
      schemaVersion: schema?.value ?? '0',
      schemaUpdatedAt: schema?.updated_at ?? '',
      migrations,
      latestImport: latest ?? null,
    };
  }

  const mutationHandlers = {
    submitRequest,
    requesterRequestPortal,
    submitRequesterRequest,
    cancelRequesterRequest,
    reviewRequest,
    reserveStock,
    saveCanvassReference,
    updateCanvassReference,
    archiveCanvassReference,
    getMaterialsWorkQueue,
    selectPreferredCanvass,
    transitionDeliverable,
    getRestockDetail,
    transitionRestock,
    createLendingTicket,
    registerInventoryAsset,
    recordAssetMaintenance,
    approveLendingTicket,
    confirmLendingHandoff,
    confirmReturn,
    uploadEvidence,
    confirmRelease,
    correctRelease,
    receiveRestock: (context) => receiveEntity({ ...context, kind: 'RESTOCK' }),
    receiveDeliverable: (context) => receiveEntity({ ...context, kind: 'DELIVERABLE' }),
    listInventoryClassifications,
    classifyInventoryItem,
    bulkClassifyInventoryItems,
    createInventoryItem,
    updateInventoryItem,
    updateInventoryStorageContext,
    archiveInventoryItem,
    restoreInventoryItem,
    getEventManagement,
    saveEventSeries,
    saveEventDay,
    saveEventActivity,
    linkEventOperationalRecord,
    postCycleCountAdjustment,
  };

  return Object.freeze({
    essential,
    bootstrapModule,
    requesterRequestPortal,
    submitRequesterRequest,
    cancelRequesterRequest,
    borrowerLendingPortal,
    submitBorrowerLendingRequest,
    cancelBorrowerLendingRequest,
    migrationStatus,
    capabilityForMethod(method) {
      return METHOD_CAPABILITIES[method] ?? null;
    },
    async call(method, context) {
      const handler = mutationHandlers[method];
      if (!handler) {
        throw new ApiError(
          'OPERATION_NOT_IMPLEMENTED',
          'This operation is not available in the D1 staging service.',
          {
            status: 501,
          },
        );
      }
      const operationalContext = await resolveOperationalContext(
        db,
        context.account,
        context.command?.operationalScope,
      );
      const authorization = accountAuthorization(context.account);
      const activeWorkspace = String(context.command?.activeWorkspace ?? '')
        .trim()
        .toLowerCase();
      if (
        activeWorkspace &&
        !['admin', 'director', 'food', 'inventory', 'materials'].includes(activeWorkspace)
      ) {
        throw new ApiError('OPERATIONAL_WORKSPACE_INVALID', 'The active workspace is not recognized.', {
          status: 400,
        });
      }
      const selected = operationalContext.selected;
      const reason = String(
        context.command?.reason ??
          context.command?.note ??
          context.command?.notes ??
          context.command?.purpose ??
          method,
      )
        .trim()
        .slice(0, 500);
      operationalAuditContexts.set(context.correlationId, {
        actorAccountId: context.account.id,
        actorRole: authorization.roleId,
        activeWorkspace: activeWorkspace || 'server-api',
        committeeScope: selected.kind === 'COMMITTEE' ? selected.id : '',
        locationScope: selected.kind === 'LOCATION' ? selected.id : '',
        eventScope: ['EVENT_SERIES', 'EVENT'].includes(selected.kind)
          ? { kind: selected.kind, id: selected.id }
          : null,
        selectedScope: selected.value,
        reason,
      });
      try {
        return await handler({
          ...context,
          account: { ...context.account, operationalContext },
        });
      } finally {
        operationalAuditContexts.delete(context.correlationId);
      }
    },
    revision: (scope) => revision(db, scope),
  });
}
