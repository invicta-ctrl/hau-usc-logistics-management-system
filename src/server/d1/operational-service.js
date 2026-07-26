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

const positiveNumber = (value, field = 'quantity') => {
  const result = Number(value);
  if (!Number.isFinite(result) || result <= 0) {
    throw new ApiError('VALIDATION_FAILED', `${field} must be greater than zero.`, {
      details: { field },
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

const nowIso = () => new Date().toISOString();
const createId = (prefix) => `${prefix}-${crypto.randomUUID()}`;

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

function auditStatement(db, { action, entityType, entityId, accountId, correlationId, after = {} }) {
  const timestamp = nowIso();
  const operationalContext = operationalAuditContexts.get(correlationId);
  return db
    .prepare(
      `INSERT INTO audit_log (
         id, created_at, action, entity_type, entity_id, actor_account_id,
         before_json, after_json, correlation_id, notes
       ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, '{}', ?7, ?8, '')`,
    )
    .bind(
      createId('AUD'),
      timestamp,
      action,
      entityType,
      entityId,
      accountId,
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
      }),
});

const requestDto = (row) => ({
  id: row.id,
  type: row.request_type,
  stage: row.request_stage,
  parentRequestId: row.parent_request_id,
  eventSeriesId: row.event_series_id,
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
    const itemRows = await rows(db, itemSql, [page.pageSize, page.offset]);
    let data;
    if (module === 'request') {
      const eventScope = requestOnly
        ? { sql: '1 = 1', values: [] }
        : multiScopeWhere(account, { committeeColumns: ['event.owner_committee_id'] });
      const eventLimitIndex = eventScope.values.length + 1;
      const eventRows = await rows(
        db,
        `SELECT event.* FROM events event WHERE event.active = 1 AND ${eventScope.sql}
         ORDER BY event.starts_at DESC LIMIT ?${eventLimitIndex} OFFSET ?${eventLimitIndex + 1}`,
        [...eventScope.values, page.pageSize, page.offset],
      );
      data = {
        eventSeries: await rows(db, 'SELECT id, code, name, status FROM event_series ORDER BY name LIMIT 50'),
        events: eventRows.map((row) => ({
          id: row.id,
          seriesId: row.event_series_id,
          name: row.name,
          startAt: row.starts_at,
          endAt: row.ends_at,
          ...(requestOnly ? {} : { venue: row.venue }),
          status: row.status,
        })),
        inventoryItems: itemRows.map((row) => itemDto(row, requestOnly)),
      };
    } else if (module === 'inventory') {
      data = {
        inventoryItems: itemRows.map((row) => itemDto(row)),
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
             ORDER BY created_at DESC, id DESC LIMIT 100`,
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
              metadata: JSON.parse(entry.metadata_json || '{}'),
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
           WHERE event.active = 1 AND ${eventScope.sql}
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
          canvassReferences: await rows(
            db,
            `SELECT canvass.* FROM canvass_references canvass
             JOIN restock_requests restock ON restock.id = canvass.linked_restock_id
             WHERE ${restockScope.sql} ORDER BY canvass.updated_at DESC
             LIMIT ?${restockLimitIndex} OFFSET ?${restockLimitIndex + 1}`,
            [...restockScope.values, page.pageSize, page.offset],
          ),
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
          deliverables: await rows(
            db,
            `SELECT deliverable.* FROM deliverables deliverable
             JOIN requests deliverable_request ON deliverable_request.id = deliverable.request_id
             WHERE ${deliverableScope.sql}
             ORDER BY deliverable.updated_at DESC
             LIMIT ?${deliverableLimitIndex} OFFSET ?${deliverableLimitIndex + 1}`,
            [...deliverableScope.values, page.pageSize, page.offset],
          ),
          canvassReferences: await rows(
            db,
            `SELECT canvass.* FROM canvass_references canvass
             LEFT JOIN deliverables deliverable ON deliverable.id = canvass.linked_deliverable_id
             LEFT JOIN requests deliverable_request ON deliverable_request.id = deliverable.request_id
             LEFT JOIN request_lines line ON line.id = canvass.linked_request_line_id
             LEFT JOIN requests line_request ON line_request.id = line.request_id
             LEFT JOIN restock_requests restock ON restock.id = canvass.linked_restock_id
             WHERE ${canvassScope.sql}
             ORDER BY canvass.updated_at DESC
             LIMIT ?${canvassLimitIndex} OFFSET ?${canvassLimitIndex + 1}`,
            [...canvassScope.values, page.pageSize, page.offset],
          ),
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
      pagination: {
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
    const supplierName = requiredText(command.supplierName, 'supplierName', 160);
    const normalizedName = supplierName.toLowerCase().replace(/\s+/gu, ' ');
    let supplier = command.supplierId
      ? await db
          .prepare('SELECT * FROM suppliers WHERE id = ?1 AND active = 1')
          .bind(command.supplierId)
          .first()
      : await db
          .prepare(
            'SELECT * FROM suppliers WHERE normalized_name = ?1 AND active = 1 ORDER BY updated_at DESC LIMIT 1',
          )
          .bind(normalizedName)
          .first();
    if (command.supplierId && !supplier) {
      throw new ApiError('SUPPLIER_NOT_FOUND', 'The selected supplier was not found.', { status: 404 });
    }
    const timestamp = nowIso();
    const supplierId = supplier?.id ?? createId('SUP');
    const canvassId = createId('CAN');
    const price = nonNegativeNumber(command.price, 'price');
    const checkedAt = optionalText(command.checkedAt, 64) || timestamp;
    const result = {
      canvassId,
      id: canvassId,
      supplierId,
      linkedRequestLineId: link.linkedRequestLineId || null,
      status: 'ACTIVE',
      correlationId,
    };
    const statements = [];
    if (!supplier) {
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
            supplierName,
            normalizedName,
            optionalText(command.location, 240),
            optionalText(command.receiptStatus, 80),
            optionalText(command.reliability, 80),
            optionalText(command.supplierNotes, 500),
            timestamp,
          ),
      );
    }
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
          link.linkedRequestLineId || null,
          link.linkedDeliverableId || null,
          link.linkedRestockId || null,
          supplierId,
          supplierName,
          requiredText(command.itemSpec, 'itemSpec', 500),
          price,
          requiredText(command.unit, 'unit', 40),
          optionalText(command.receiptStatus, 80),
          optionalText(command.reliability, 80),
          checkedAt,
          optionalText(command.sourceUrl, 500),
          evidenceId,
          JSON.stringify([{ price, checkedAt }]),
          mutation.key,
          optionalText(command.notes, 1000),
          timestamp,
          account.id,
        ),
      auditStatement(db, {
        action: 'CANVASS_REFERENCE_SAVED',
        entityType: 'CANVASS',
        entityId: canvassId,
        accountId: account.id,
        correlationId,
        after: {
          linkedRequestLineId: link.linkedRequestLineId || null,
          linkedDeliverableId: link.linkedDeliverableId || null,
          linkedRestockId: link.linkedRestockId || null,
        },
      }),
      idempotencyStatement(db, 'saveCanvassReference', mutation, account.id, result),
      ...revisionStatements(db, ['procurement', 'restocking']),
    );
    await db.batch(statements);
    return result;
  }

  async function selectPreferredCanvass({ account, command, correlationId }) {
    assertCapability(account, METHOD_CAPABILITIES.selectPreferredCanvass);
    const canvassId = requiredText(command.canvassId, 'canvassId', 80);
    const canvass = await db
      .prepare(
        `SELECT canvass.*,
           COALESCE(deliverable.assigned_committee_id, deliverable_request.owner_committee_id,
             line_request.owner_committee_id, restock.assigned_committee_id) AS committee_id,
           COALESCE(deliverable_request.requester_account_id, line_request.requester_account_id,
             restock_request.requester_account_id, restock.created_by) AS owner_account_id
         FROM canvass_references canvass
         LEFT JOIN deliverables deliverable ON deliverable.id = canvass.linked_deliverable_id
         LEFT JOIN requests deliverable_request ON deliverable_request.id = deliverable.request_id
         LEFT JOIN request_lines line ON line.id = canvass.linked_request_line_id
         LEFT JOIN requests line_request ON line_request.id = line.request_id
         LEFT JOIN restock_requests restock ON restock.id = canvass.linked_restock_id
         LEFT JOIN requests restock_request ON restock_request.id = restock.source_request_id
         WHERE canvass.id = ?1 AND canvass.status = 'ACTIVE'`,
      )
      .bind(canvassId)
      .first();
    if (!canvass) {
      throw new ApiError('CANVASS_NOT_FOUND', 'The canvass reference was not found.', { status: 404 });
    }
    assertEntityScope(account, {
      committeeId: canvass.committee_id,
      ownerAccountId: canvass.owner_account_id,
    });
    const rationale = requiredText(command.rationale, 'rationale', 500);
    const mutation = await replay(db, 'selectPreferredCanvass', command.clientRequestId, account.id, command);
    if (mutation.replayed) return mutation.value;
    const timestamp = nowIso();
    const result = {
      canvassId,
      preferred: true,
      deliverableId: canvass.linked_deliverable_id ?? null,
      restockId: canvass.linked_restock_id ?? null,
      correlationId,
    };
    const statements = [
      db
        .prepare(
          `UPDATE canvass_references
           SET preferred = CASE WHEN id = ?1 THEN 1 ELSE 0 END, updated_at = ?5
           WHERE status = 'ACTIVE' AND (
             (?2 IS NOT NULL AND linked_request_line_id = ?2) OR
             (?3 IS NOT NULL AND linked_deliverable_id = ?3) OR
             (?4 IS NOT NULL AND linked_restock_id = ?4)
           )`,
        )
        .bind(
          canvassId,
          canvass.linked_request_line_id,
          canvass.linked_deliverable_id,
          canvass.linked_restock_id,
          timestamp,
        ),
    ];
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
      auditStatement(db, {
        action: 'PREFERRED_CANVASS_SELECTED',
        entityType: 'CANVASS',
        entityId: canvassId,
        accountId: account.id,
        correlationId,
        after: { rationale },
      }),
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
    const result = { requestId, id: requestId, status: 'FOR_REVIEW', correlationId };
    const statements = [
      db
        .prepare(
          `INSERT INTO requests (
             id, request_type, request_stage, event_series_id, event_id, catalog_type,
             requester_account_id, requester_name, requester_email, department, priority, owner_committee_id,
             purpose, status, client_request_id, notes, created_at, updated_at, created_by
           ) VALUES (?1, ?2, 'REVIEW', ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11,
             ?12, 'FOR_REVIEW', ?13, ?14, ?15, ?15, ?6)`,
        )
        .bind(
          requestId,
          requiredText(command.requestType ?? 'EVENT_LOGISTICS', 'requestType', 64),
          optionalText(command.eventSeriesId, 80) || null,
          optionalText(command.eventId, 80) || null,
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
    lines.forEach((line, index) => {
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
            optionalText(line.itemId, 80) || null,
            requiredText(line.description ?? line.itemName, `lines[${index}].description`, 240),
            optionalText(line.specification, 1000),
            optionalText(line.category, 120),
            positiveNumber(line.quantity ?? line.requestedQuantity, `lines[${index}].quantity`),
            requiredText(line.unit, `lines[${index}].unit`, 40),
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
    });
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
      `SELECT id, event_series_id, name, starts_at, ends_at, venue
       FROM events
       WHERE active = 1 AND status NOT IN ('COMPLETED', 'CANCELLED')
       ORDER BY starts_at, name`,
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
        name: event.name,
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
        `SELECT event.id, event.name, series.name AS event_name
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
        quantity: positiveNumber(source.quantity, `lines[${index}].quantity`),
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
             event_series_id, event_id, catalog_type, requester_account_id,
             requester_name, requester_email, department, priority, owner_committee_id,
             purpose, status, client_request_id, notes, created_at, updated_at,
             created_by, requester_department_id
           ) VALUES (?1, 'EVENT_LOGISTICS', ?2, ?3, ?4, ?5, ?6, '', ?7,
             ?8, ?9, ?10, 'NORMAL', NULL, ?11, 'FOR_REVIEW', ?12, '', ?13, ?13,
             ?7, ?14)`,
        )
        .bind(
          requestId,
          requestType === 'ADDITIONAL' ? 'ADDITIONAL' : 'INITIAL',
          parent?.id ?? null,
          additionalSequence,
          eventSeriesId,
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
    const quantity = positiveNumber(command.quantity);
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
          requiredText(command.itemId, 'itemId', 80),
          positiveNumber(command.quantity),
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
                is_lendable, maximum_loan_quantity, default_loan_days, due_date_required
         FROM inventory_items WHERE id = ?1 AND status = 'ACTIVE'`,
      )
      .bind(requiredText(command.itemId, 'itemId', 80))
      .first();
    if (
      !item ||
      item.is_lendable !== 1 ||
      item.lending_status !== 'ACTIVE' ||
      !['STUDENTS_AND_STAFF', 'USC_STAFF_ONLY'].includes(item.lending_audience)
    ) {
      throw new ApiError('LENDING_ITEM_UNAVAILABLE', 'That item is not available through Office Lending.', {
        status: 404,
      });
    }
    const quantity = positiveNumber(command.quantity);
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
        `SELECT id, lending_kind, condition_tracking
         FROM inventory_items
         WHERE id = ?1 AND status = 'ACTIVE' AND is_lendable = 1`,
      )
      .bind(itemId)
      .first();
    if (!item || item.lending_kind !== 'REUSABLE' || item.condition_tracking !== 1) {
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
      command.approvedQuantity == null ? requestedQuantity : positiveNumber(command.approvedQuantity);
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
    const lostQuantity = nonNegativeNumber(
      command.lostQuantity ?? (returnCondition.includes('LOST') ? ticketQuantity : 0),
      'lostQuantity',
    );
    const damagedBeyondUseQuantity = nonNegativeNumber(
      command.damagedBeyondUseQuantity ??
        (returnCondition.includes('DAMAGED_BEYOND_USE') ? ticketQuantity : 0),
      'damagedBeyondUseQuantity',
    );
    const returnedQuantity = nonNegativeNumber(
      command.returnedQuantity ?? ticketQuantity - lostQuantity - damagedBeyondUseQuantity,
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
      const quantity = positiveNumber(input.quantity, `lines[${index}].quantity`);
      const line = await db.prepare('SELECT * FROM request_lines WHERE id = ?1').bind(lineId).first();
      if (!line || line.request_id !== requestId) {
        throw new ApiError(
          'RELEASE_SCOPE_MISMATCH',
          'Every release line must belong to the selected request.',
          { status: 409 },
        );
      }
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
    const quantity = positiveNumber(command.quantity, 'quantity');
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
    assertEntityScope(account, {
      committeeId: confirmation.owner_committee_id,
      ownerAccountId: confirmation.requester_account_id,
    });
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
    const mutation = await replay(db, 'correctRelease', command.clientRequestId, account.id, command);
    if (mutation.replayed) return mutation.value;
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
    const quantity = positiveNumber(command.quantity ?? command.quantityReceived, 'quantity');
    const table = kind === 'RESTOCK' ? 'restock_requests' : 'deliverables';
    const entity = await db.prepare(`SELECT * FROM ${table} WHERE id = ?1`).bind(entityId).first();
    if (!entity) {
      throw new ApiError(`${kind}_NOT_FOUND`, 'The receiving record was not found.', {
        status: 404,
      });
    }
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

  async function postCycleCountAdjustment({ account, command, correlationId }) {
    assertCapability(account, METHOD_CAPABILITIES.postCycleCountAdjustment);
    const itemId = requiredText(command.itemId, 'itemId', 80);
    const countedQuantity = Number(command.countedQuantity);
    if (!Number.isFinite(countedQuantity) || countedQuantity < 0) {
      throw new ApiError('VALIDATION_FAILED', 'countedQuantity must be zero or greater.');
    }
    const balance = await db
      .prepare('SELECT on_hand FROM inventory_balances WHERE item_id = ?1')
      .bind(itemId)
      .first();
    if (!balance) {
      throw new ApiError('ITEM_NOT_FOUND', 'The inventory item was not found.', { status: 404 });
    }
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
