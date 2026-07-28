export const ESSENTIAL_BOOTSTRAP_CONTRACT = 'essential-bootstrap';
export const BOOTSTRAP_MODULE_CONTRACT = 'bootstrap-module';
export const ESSENTIAL_BOOTSTRAP_VERSION = 2;

const SUPPORTED_SCHEMA_VERSIONS = new Set(['1.6.0', '1.5.0', '1.4.0', '1.3.0', '1.2.0', '1.1.0', '1.0.0', '3', 3]);

export const BOOTSTRAP_MODULES = Object.freeze([
  'overview',
  'request',
  'lending',
  'release',
  'restocking',
  'procurement',
  'inventory',
]);

const LEGACY_STATE_COLLECTIONS = Object.freeze([
  'eventSeries',
  'events',
  'requests',
  'requestLines',
  'inventoryItems',
  'reservations',
  'ledgerTransactions',
  'restockRequests',
  'restockRecords',
  'lendingTickets',
  'releaseConfirmations',
  'releaseCorrections',
  'deliverables',
  'canvassReferences',
  'evidenceFiles',
  'roadmapMilestones',
  'statusHistory',
  'auditLog',
  'dashboardMeta',
  'dashboardQueues',
  'dashboardStaffWorkload',
  'dashboardActivity',
  'dashboardLinks',
  'inventoryAssets',
  'assetMaintenanceHistory',
  'assetMovementHistory',
]);

const MODULE_DATA_KEYS = Object.freeze({
  overview: Object.freeze([
    'eventSeries',
    'events',
    'requests',
    'requestLines',
    'inventoryItems',
    'lendingTickets',
    'restockRequests',
    'deliverables',
    'roadmapMilestones',
    'dashboardMeta',
    'dashboardQueues',
    'dashboardStaffWorkload',
    'dashboardActivity',
    'dashboardLinks',
  ]),
  request: Object.freeze(['eventSeries', 'events', 'inventoryItems']),
  lending: Object.freeze(['inventoryItems', 'lendingTickets']),
  release: Object.freeze([
    'eventSeries',
    'events',
    'inventoryItems',
    'requests',
    'requestLines',
    'lendingTickets',
    'releaseConfirmations',
    'releaseCorrections',
  ]),
  restocking: Object.freeze(['inventoryItems', 'restockRequests', 'restockRecords', 'canvassReferences']),
  procurement: Object.freeze(['eventSeries', 'events', 'requests', 'requestLines', 'deliverables', 'canvassReferences']),
  inventory: Object.freeze([
    'inventoryItems',
    'ledgerTransactions',
    'inventoryAssets',
    'assetMaintenanceHistory',
    'assetMovementHistory',
  ]),
});

const ESSENTIAL_KEYS = new Set([
  'ok',
  'correlationId',
  'contract',
  'contractVersion',
  'appVersion',
  'schemaVersion',
  'backendMode',
  'environment',
  'requestOnly',
  'activeModule',
  'currentUser',
  'operationalContext',
  'navigation',
  'moduleConfig',
  'revision',
  'metrics',
]);

const MODULE_KEYS = new Set([
  'ok',
  'correlationId',
  'contract',
  'contractVersion',
  'appVersion',
  'schemaVersion',
  'backendMode',
  'environment',
  'requestOnly',
  'module',
  'data',
  'pagination',
  'revision',
  'scopeRevision',
  'cache',
  'metrics',
]);

const PERMISSION_KEYS = new Set(['review', 'release', 'receive', 'admin', 'manageCatalog']);
const SCOPE_KEYS = new Set(['committee', 'organization']);
const AUTHORIZATION_ROLES = new Set(['SYSTEM_OWNER', 'REQUESTER', 'DOL_STAFF', 'COMMITTEE_HEAD', 'DIRECTOR', 'ADMINISTRATOR', 'READ_ONLY_AUDITOR']);
const AUTHORIZATION_COMMITTEES = new Set(['COM_FOOD', 'COM_INVENTORY_PANTRY', 'COM_MATERIALS']);
const AUTHORIZATION_SCOPE_MODES = new Set(['SELF', 'COMMITTEE', 'ALL', 'DENY']);
const AUTHORIZATION_MAPPING_STATUSES = new Set(['MAPPED', 'INACTIVE', 'NEEDS_REVIEW', 'UNKNOWN_ROLE']);
const AUTHORIZATION_WORKSPACES = new Set([
  'administrator',
  'director',
  'food',
  'inventory-pantry',
  'materials',
]);
const AUTHORIZATION_CAPABILITIES = new Set([
  'view.request', 'view.internal', 'view.committee.summary', 'view.all.summary', 'view.audit', 'view.inventory',
  'request.create', 'request.review', 'request.missing_information', 'request.reject', 'request.reopen',
  'workflow.assign_committee', 'workflow.assign_staff', 'workflow.escalate',
  'fulfillment.canvass', 'fulfillment.procure', 'fulfillment.reserve', 'fulfillment.receive', 'fulfillment.release',
  'lending.create', 'lending.approve', 'lending.handoff', 'lending.return', 'lending.usage.view', 'inventory.merge_event_item', 'inventory.adjust', 'inventory.classify',
  'reference.catalog.manage', 'reference.manage', 'advertisement.manage', 'access.admin', 'system.admin', 'system.diagnostics', 'evidence.upload',
]);
const SENSITIVE_KEYS = new Set([
  'email',
  'requesteremail',
  'requestername',
  'borroweremail',
  'borrowername',
  'borrowercontact',
  'studentid',
  'studentidnumber',
  'studentnumber',
  'contact',
  'phone',
  'phonenumber',
  'supplier_tin',
  'suppliertin',
  'suppliertaxid',
  'taxid',
  'evidenceid',
  'evidenceurl',
  'drivefileid',
  'drivefolderid',
  'driveid',
  'driveurl',
  'evidencefiles',
  'evidence',
  'auditlog',
  'statushistory',
  'ledgertransactions',
  'roster',
  'rosterdata',
]);
const SAFE_ENVIRONMENTS = new Set(['STAGING', 'PRODUCTION', 'DEVELOPMENT']);
const SAFE_CORRELATION = /^[A-Z0-9][A-Z0-9_-]{2,63}$/i;

function contractError(message = 'The bootstrap response did not match the supported contract.') {
  const error = new Error(message);
  error.code = 'BOOTSTRAP_CONTRACT_INVALID';
  return error;
}

function fail(message) {
  throw contractError(message);
}

function isPlainObject(value) {
  if (!value || Object.prototype.toString.call(value) !== '[object Object]') return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function assertJsonSafe(value, seen = new WeakSet()) {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return;
  if (value === undefined) fail();
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) fail();
    return;
  }
  if (typeof value !== 'object' || value instanceof Date || typeof value === 'function' || typeof value === 'symbol' || typeof value === 'bigint') fail();
  if (seen.has(value)) fail('The bootstrap response contains a circular value.');
  seen.add(value);
  if (Array.isArray(value)) value.forEach((item) => assertJsonSafe(item, seen));
  else {
    if (!isPlainObject(value)) fail();
    Object.values(value).forEach((item) => assertJsonSafe(item, seen));
  }
  seen.delete(value);
}

function assertAllowedKeys(value, allowed) {
  if (!isPlainObject(value)) fail();
  Object.keys(value).forEach((key) => {
    if (!allowed.has(key)) fail(`Unsupported bootstrap field: ${key}`);
  });
}

function assertSafeText(value, { required = false, max = 160 } = {}) {
  if (typeof value !== 'string') fail();
  if (required && !value.trim()) fail();
  if (value.length > max) fail();
}

function assertSafeToken(value, { required = false } = {}) {
  if (typeof value !== 'string' || value.length > 80 || (required && !value.trim())) fail();
  if (value && !SAFE_CORRELATION.test(value)) fail();
}

function assertBoolean(value) {
  if (typeof value !== 'boolean') fail();
}

function assertAuthorization(value) {
  if (!isPlainObject(value)) fail();
  assertAllowedKeys(value, new Set(['contract', 'contractVersion', 'modelVersion', 'roleId', 'roleLabel', 'scopeMode', 'committeeIds', 'committees', 'capabilities', 'workspaceIds', 'defaultWorkspaceId', 'locationScopeIds', 'eventSeriesScopeIds', 'eventScopeIds', 'explicitDenies', 'mappingStatus', 'active']));
  if (value.contract !== 'canonical-authorization' || value.contractVersion !== 2) fail();
  if (!Number.isInteger(value.modelVersion) || ![1, 2].includes(value.modelVersion)) fail();
  assertSafeText(value.roleId, { max: 40 });
  if (value.roleId && !AUTHORIZATION_ROLES.has(value.roleId)) fail();
  assertSafeText(value.roleLabel, { max: 80 });
  if (!AUTHORIZATION_SCOPE_MODES.has(value.scopeMode)) fail();
  if (!Array.isArray(value.committeeIds) || value.committeeIds.length > 3) fail();
  value.committeeIds.forEach((id) => {
    assertSafeText(id, { required: true, max: 40 });
    if (!AUTHORIZATION_COMMITTEES.has(id)) fail();
  });
  if (!Array.isArray(value.committees) || value.committees.length > 3) fail();
  value.committees.forEach((committee) => {
    if (!isPlainObject(committee)) fail();
    assertAllowedKeys(committee, new Set(['id', 'name']));
    assertSafeText(committee.id, { required: true, max: 40 });
    if (!AUTHORIZATION_COMMITTEES.has(committee.id)) fail();
    assertSafeText(committee.name, { required: true, max: 80 });
  });
  if (!Array.isArray(value.capabilities) || value.capabilities.length > AUTHORIZATION_CAPABILITIES.size) fail();
  value.capabilities.forEach((capability) => {
    assertSafeText(capability, { required: true, max: 80 });
    if (!AUTHORIZATION_CAPABILITIES.has(capability)) fail();
  });
  const workspaceIds = value.workspaceIds ?? [];
  if (!Array.isArray(workspaceIds) || workspaceIds.length > AUTHORIZATION_WORKSPACES.size) fail();
  workspaceIds.forEach((workspaceId) => {
    assertSafeText(workspaceId, { required: true, max: 40 });
    if (!AUTHORIZATION_WORKSPACES.has(workspaceId)) fail();
  });
  assertSafeText(value.defaultWorkspaceId ?? '', { max: 40 });
  if (value.defaultWorkspaceId && !workspaceIds.includes(value.defaultWorkspaceId)) fail();
  for (const [key, limit] of [
    ['locationScopeIds', 50],
    ['eventSeriesScopeIds', 50],
    ['eventScopeIds', 100],
  ]) {
    const values = value[key] ?? [];
    if (!Array.isArray(values) || values.length > limit) fail();
    values.forEach((id) => assertSafeText(id, { required: true, max: 100 }));
  }
  const explicitDenies = value.explicitDenies ?? [];
  if (!Array.isArray(explicitDenies) || explicitDenies.length > AUTHORIZATION_CAPABILITIES.size) fail();
  explicitDenies.forEach((capability) => {
    assertSafeText(capability, { required: true, max: 80 });
    if (!AUTHORIZATION_CAPABILITIES.has(capability)) fail();
  });
  if (!AUTHORIZATION_MAPPING_STATUSES.has(value.mappingStatus)) fail();
  assertBoolean(value.active);
}

function assertNonNegativeInteger(value) {
  if (!Number.isInteger(value) || value < 0) fail();
}

function assertRevision(value) {
  if (value === null) return;
  if (!isPlainObject(value)) fail();
  assertAllowedKeys(value, new Set(['revision', 'updatedAt']));
  assertNonNegativeInteger(value.revision);
  assertSafeText(value.updatedAt, { max: 64 });
}

function assertScopeRevision(value, module, { requestOnly = false } = {}) {
  if (requestOnly) {
    if (value !== null) fail();
    return;
  }
  if (!isPlainObject(value)) fail();
  assertAllowedKeys(value, new Set(['scope', 'token', 'updatedAt']));
  if (value.scope !== module) fail();
  assertNonNegativeInteger(value.token);
  assertSafeText(value.updatedAt, { max: 64 });
}

function assertMetrics(value) {
  if (value === undefined) return;
  if (!isPlainObject(value)) fail();
  assertAllowedKeys(value, new Set(['readCount', 'cacheHits', 'payloadBytes']));
  ['readCount', 'cacheHits', 'payloadBytes'].forEach((key) => {
    if (value[key] !== undefined) assertNonNegativeInteger(value[key]);
  });
}

function assertCurrentUser(value, { requireAuthorization = false } = {}) {
  if (!isPlainObject(value)) fail();
  assertAllowedKeys(value, new Set(['id', 'displayName', 'role', 'committee', 'permissions', 'scopes', 'authorization']));
  assertSafeText(value.id, { required: true, max: 80 });
  assertSafeText(value.displayName, { required: true, max: 120 });
  assertSafeText(value.role, { required: true, max: 80 });
  assertSafeText(value.committee ?? '', { max: 120 });
  if (!isPlainObject(value.permissions)) fail();
  Object.keys(value.permissions).forEach((key) => {
    if (!PERMISSION_KEYS.has(key)) fail();
    assertBoolean(value.permissions[key]);
  });
  if (value.scopes !== undefined) {
    if (!isPlainObject(value.scopes)) fail();
    Object.keys(value.scopes).forEach((key) => {
      if (!SCOPE_KEYS.has(key) || !Array.isArray(value.scopes[key]) || value.scopes[key].length > 8) fail();
      value.scopes[key].forEach((scope) => assertSafeText(scope, { max: 120 }));
    });
  }
  if (requireAuthorization && value.authorization === undefined) fail('Canonical authorization metadata is required for the v2 bootstrap contract.');
  if (value.authorization !== undefined) assertAuthorization(value.authorization);
}

function assertNavigation(value) {
  if (!Array.isArray(value) || value.length > BOOTSTRAP_MODULES.length) fail();
  value.forEach((entry) => {
    if (!isPlainObject(entry)) fail();
    assertAllowedKeys(entry, new Set(['id', 'label', 'enabled']));
    if (!BOOTSTRAP_MODULES.includes(entry.id)) fail();
    assertSafeText(entry.label, { required: true, max: 100 });
    assertBoolean(entry.enabled);
  });
}

function assertOperationalContext(value) {
  if (!isPlainObject(value)) fail();
  assertAllowedKeys(value, new Set(['selected', 'options']));
  if (!isPlainObject(value.selected)) fail();
  assertAllowedKeys(value.selected, new Set(['value', 'kind', 'id', 'label', 'purpose', 'available']));
  ['value', 'kind', 'id', 'label'].forEach((key) =>
    assertSafeText(value.selected[key], { required: true, max: key === 'label' ? 160 : 120 }),
  );
  if (value.selected.purpose !== undefined) assertSafeText(value.selected.purpose, { max: 200 });
  if (value.selected.available !== undefined) assertBoolean(value.selected.available);
  if (!Array.isArray(value.options) || value.options.length < 1 || value.options.length > 200) fail();
  value.options.forEach((entry) => {
    if (!isPlainObject(entry)) fail();
    assertAllowedKeys(entry, new Set(['value', 'kind', 'id', 'label', 'purpose', 'available']));
    ['value', 'kind', 'id', 'label', 'purpose'].forEach((key) =>
      assertSafeText(entry[key], { required: key !== 'purpose', max: key === 'purpose' ? 200 : 160 }),
    );
    assertBoolean(entry.available);
  });
  if (!value.options.some((entry) => entry.value === value.selected.value && entry.available)) fail();
}

function assertModuleConfig(value) {
  if (!isPlainObject(value)) fail();
  assertAllowedKeys(value, new Set(['maxPageSize', 'defaultPageSize', 'legacyEndpointAvailable', 'activeModuleOnly']));
  if (!Number.isInteger(value.maxPageSize) || value.maxPageSize < 1 || value.maxPageSize > 100) fail();
  if (!Number.isInteger(value.defaultPageSize) || value.defaultPageSize < 1 || value.defaultPageSize > value.maxPageSize) fail();
  assertBoolean(value.legacyEndpointAvailable);
  assertBoolean(value.activeModuleOnly);
}

export function validateEssentialBootstrap(value, { backendMode = 'mock' } = {}) {
  assertJsonSafe(value);
  assertAllowedKeys(value, ESSENTIAL_KEYS);
  if (value.ok !== undefined && value.ok !== true) fail();
  if (value.correlationId !== undefined) assertSafeToken(value.correlationId);
  if (value.contract !== ESSENTIAL_BOOTSTRAP_CONTRACT || value.contractVersion !== ESSENTIAL_BOOTSTRAP_VERSION) fail();
  assertSafeText(value.appVersion, { required: true, max: 32 });
  if (value.schemaVersion === undefined || value.schemaVersion === null) fail();
  assertSafeText(String(value.schemaVersion), { required: true, max: 32 });
  if (!SUPPORTED_SCHEMA_VERSIONS.has(value.schemaVersion)) fail();
  if (value.backendMode !== backendMode) fail();
  if (!SAFE_ENVIRONMENTS.has(String(value.environment).toUpperCase())) fail();
  assertBoolean(value.requestOnly);
  if (!BOOTSTRAP_MODULES.includes(value.activeModule)) fail();
  assertCurrentUser(value.currentUser, { requireAuthorization: true });
  if (value.operationalContext !== undefined) assertOperationalContext(value.operationalContext);
  assertNavigation(value.navigation);
  assertModuleConfig(value.moduleConfig);
  assertRevision(value.revision);
  assertMetrics(value.metrics);
  return value;
}

function assertNoSensitiveKeys(value, seen = new WeakSet()) {
  if (!value || typeof value !== 'object') return;
  if (seen.has(value)) fail();
  seen.add(value);
  if (Array.isArray(value)) value.forEach((item) => assertNoSensitiveKeys(item, seen));
  else Object.entries(value).forEach(([key, item]) => {
    const normalizedKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (SENSITIVE_KEYS.has(key.toLowerCase()) || SENSITIVE_KEYS.has(normalizedKey)) fail(`Sensitive bootstrap field: ${key}`);
    assertNoSensitiveKeys(item, seen);
  });
  seen.delete(value);
}

function assertPagination(value) {
  if (!isPlainObject(value)) fail();
  assertAllowedKeys(value, new Set(['page', 'pageSize', 'total', 'hasMore']));
  if (!Number.isInteger(value.page) || value.page < 1) fail();
  if (!Number.isInteger(value.pageSize) || value.pageSize < 1 || value.pageSize > 100) fail();
  assertNonNegativeInteger(value.total);
  assertBoolean(value.hasMore);
}

function assertCache(value) {
  if (!isPlainObject(value)) fail();
  assertAllowedKeys(value, new Set(['safe', 'scope', 'ttlMs']));
  assertBoolean(value.safe);
  assertSafeText(value.scope, { required: true, max: 60 });
  if (!Number.isInteger(value.ttlMs) || value.ttlMs < 0 || value.ttlMs > 86_400_000) fail();
  if (value.safe && value.scope !== 'PUBLIC_REFERENCE') fail();
  if (!value.safe && value.ttlMs !== 0) fail();
  if (value.safe && value.ttlMs < 1) fail();
}

export function validateBootstrapModule(value, { backendMode = 'mock', module } = {}) {
  assertJsonSafe(value);
  assertAllowedKeys(value, MODULE_KEYS);
  if (value.ok !== undefined && value.ok !== true) fail();
  if (value.correlationId !== undefined) assertSafeToken(value.correlationId);
  if (value.contract !== BOOTSTRAP_MODULE_CONTRACT || value.contractVersion !== ESSENTIAL_BOOTSTRAP_VERSION) fail();
  assertSafeText(value.appVersion, { required: true, max: 32 });
  if (value.schemaVersion === undefined || value.schemaVersion === null) fail();
  assertSafeText(String(value.schemaVersion), { required: true, max: 32 });
  if (!SUPPORTED_SCHEMA_VERSIONS.has(value.schemaVersion)) fail();
  if (value.backendMode !== backendMode) fail();
  if (!SAFE_ENVIRONMENTS.has(String(value.environment).toUpperCase())) fail();
  assertBoolean(value.requestOnly);
  if (!BOOTSTRAP_MODULES.includes(value.module) || (module && value.module !== module)) fail();
  if (!isPlainObject(value.data)) fail();
  const allowedData = new Set(MODULE_DATA_KEYS[value.module]);
  assertAllowedKeys(value.data, allowedData);
  Object.entries(value.data).forEach(([_key, rows]) => {
    if (!Array.isArray(rows) || rows.length > 100) fail();
  });
  if (value.requestOnly) assertNoSensitiveKeys(value.data);
  assertPagination(value.pagination);
  assertRevision(value.revision);
  assertScopeRevision(value.scopeRevision, value.module, { requestOnly: value.requestOnly });
  assertCache(value.cache);
  assertMetrics(value.metrics);
  return value;
}

export function createStateFromEssentialBootstrap(value, { requestOnly = value?.requestOnly } = {}) {
  validateEssentialBootstrap(value, { backendMode: value.backendMode });
  const state = Object.fromEntries(LEGACY_STATE_COLLECTIONS.map((name) => [name, []]));
  return {
    ...state,
    version: value.appVersion,
    schemaVersion: value.schemaVersion,
    backendMode: value.backendMode,
    environment: value.environment,
    currentUser: value.currentUser,
    operationalContext: value.operationalContext ?? null,
    catalogAvailabilityProtected: Boolean(requestOnly),
    dataRevision: value.revision?.revision ?? null,
    dataRevisionUpdatedAt: value.revision?.updatedAt ?? '',
    moduleConfig: value.moduleConfig,
    scopeRevisions: {},
  };
}

export function mergeBootstrapModule(state, value, { backendMode = state?.backendMode } = {}) {
  validateBootstrapModule(value, { backendMode, module: value.module });
  const scopeRevisions = { ...(state?.scopeRevisions ?? {}) };
  if (value.scopeRevision !== null) scopeRevisions[value.module] = value.scopeRevision;
  return {
    ...state,
    ...value.data,
    dataRevision: value.revision?.revision ?? state?.dataRevision ?? null,
    dataRevisionUpdatedAt: value.revision?.updatedAt ?? state?.dataRevisionUpdatedAt ?? '',
    scopeRevisions,
    catalogAvailabilityProtected: Boolean(state?.catalogAvailabilityProtected || value.requestOnly),
  };
}

export function moduleDataKeys(module) {
  if (!BOOTSTRAP_MODULES.includes(module)) throw contractError('Unsupported bootstrap module.');
  return [...MODULE_DATA_KEYS[module]];
}
