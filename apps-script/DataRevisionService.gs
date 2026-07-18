var HAU_DATA_REVISION_KEYS_ = Object.freeze({
  REVISION: 'DATA_REVISION',
  UPDATED_AT: 'DATA_REVISION_UPDATED_AT',
  SCOPES: 'DATA_SCOPE_REVISIONS_JSON'
});
var HAU_DATA_REVISION_SNAPSHOT_PROPERTY_ = 'HAU_DATA_REVISION_SNAPSHOT_JSON';

var HAU_DATA_REVISION_SCOPES_ = Object.freeze(['overview', 'request', 'lending', 'release', 'restocking', 'procurement', 'inventory']);

var HAU_MUTATION_CONTEXT_ = null;

function revisionConfigRow_(key) {
  return findOne_(HAU_SHEETS.CONFIG, 'Key', key);
}

function readDataRevisionSnapshot_(runtime) {
  if (typeof PropertiesService === 'undefined') return null;
  try {
    var value = PropertiesService.getScriptProperties().getProperty(HAU_DATA_REVISION_SNAPSHOT_PROPERTY_);
    var parsed = value ? JSON.parse(value) : null;
    if (!parsed || parsed.environment !== runtime.environment || parsed.spreadsheetId !== runtime.spreadsheetId) return null;
    var revision = Number(parsed.revision);
    if (!isFinite(revision) || revision < 0) return null;
    return { revision: Math.floor(revision), updatedAt: String(parsed.updatedAt || ''), environment: runtime.environment };
  } catch (_error) { return null; }
}

function writeDataRevisionSnapshot_(revision, runtime) {
  if (typeof PropertiesService === 'undefined') return;
  try {
    runtime = runtime || resolveRuntimeConfig_();
    PropertiesService.getScriptProperties().setProperty(HAU_DATA_REVISION_SNAPSHOT_PROPERTY_, JSON.stringify({
      revision: Math.max(0, Math.floor(Number(revision.revision || 0))),
      updatedAt: String(revision.updatedAt || ''),
      environment: runtime.environment,
      spreadsheetId: runtime.spreadsheetId
    }));
  } catch (_error) {}
}

function writeRevisionConfig_(key, value, description, actor, timestamp) {
  var runtime = resolveRuntimeConfig_();
  var row = revisionConfigRow_(key);
  var patch = {
    Key: key,
    Value: value,
    Environment: runtime.environment,
    Description: description,
    Secret: false,
    Updated_At: timestamp,
    Updated_By: actor && actor.User_ID || 'SYSTEM',
    Validation_Status: 'VALID'
  };
  if (row) updateObject_(HAU_SHEETS.CONFIG, row._row, patch);
  else appendObject_(HAU_SHEETS.CONFIG, patch);
  return patch;
}

function ensureDataRevisionConfig_(actor) {
  var timestamp = nowIso_();
  if (!revisionConfigRow_(HAU_DATA_REVISION_KEYS_.REVISION)) {
    writeRevisionConfig_(HAU_DATA_REVISION_KEYS_.REVISION, 0, 'Monotonic operational data revision', actor, timestamp);
  }
  if (!revisionConfigRow_(HAU_DATA_REVISION_KEYS_.UPDATED_AT)) {
    writeRevisionConfig_(HAU_DATA_REVISION_KEYS_.UPDATED_AT, timestamp, 'Last operational data revision update', actor, timestamp);
  }
  return getDataRevision_();
}

function getDataRevision_() {
  var runtime = resolveRuntimeConfig_();
  var snapshot = readDataRevisionSnapshot_(runtime);
  if (snapshot) return snapshot;
  var revisionRow = revisionConfigRow_(HAU_DATA_REVISION_KEYS_.REVISION);
  var updatedRow = revisionConfigRow_(HAU_DATA_REVISION_KEYS_.UPDATED_AT);
  var revision = Number(revisionRow && revisionRow.Value || 0);
  if (!isFinite(revision) || revision < 0) revision = 0;
  var result = {
    revision: Math.floor(revision),
    updatedAt: String(updatedRow && updatedRow.Value || ''),
    environment: runtime.environment
  };
  writeDataRevisionSnapshot_(result, runtime);
  return result;
}

function revisionScopeMap_(globalRevision) {
  var row = revisionConfigRow_(HAU_DATA_REVISION_KEYS_.SCOPES), parsed = {};
  try { parsed = row && row.Value ? JSON.parse(String(row.Value)) : {}; } catch (_error) { parsed = {}; }
  var fallback = globalRevision || getDataRevision_();
  return HAU_DATA_REVISION_SCOPES_.reduce(function(result, scope) {
    var current = parsed && parsed[scope] || {};
    var token = Number(current.token);
    result[scope] = {
      token: isFinite(token) && token >= 0 ? Math.floor(token) : fallback.revision,
      updatedAt: String(current.updatedAt || fallback.updatedAt || '')
    };
    return result;
  }, {});
}

function revisionScopesForOperation_(operation) {
  var groups = {
    request: ['submitRequest', 'reviewRequest', 'submitCompositeRequest', 'transitionCompositeComponent', 'cancelCompositeRequest', 'reopenCompositeRequest', 'amendCompositeRequest', 'addCompositeSection', 'assignCompositeComponent', 'escalateCompositeComponent', 'updateFoodComponent', 'updateMaterialsComponent', 'updateVenueEquipmentComponent'],
    lending: ['reserveStock', 'createLendingTicket', 'approveLendingTicket', 'confirmLendingHandoff', 'confirmReturn'],
    restocking: ['saveCanvassReference', 'selectPreferredCanvass', 'transitionRestock', 'receiveRestock'],
    procurement: ['receiveDeliverable', 'transitionDeliverable'],
    release: ['confirmRelease'],
    inventory: ['transferEventItemToInventory', 'postEmergencyIssue', 'postCycleCountAdjustment', 'createInventoryItem', 'updateInventoryItem', 'updateInventoryStorageContext', 'archiveInventoryItem', 'restoreInventoryItem'],
    all: ['applyAuthorizationMapping', 'submitReferenceAdminChange', 'reviewReferenceAdminChange', 'runRosterSync', 'setRosterEmergencyDeny', 'setupRosterSyncTrigger', 'uploadEvidence']
  };
  if (groups.all.indexOf(operation) >= 0) return HAU_DATA_REVISION_SCOPES_.slice();
  if (groups.request.indexOf(operation) >= 0) return ['overview', 'request', 'release', 'restocking', 'procurement'];
  if (groups.lending.indexOf(operation) >= 0) return ['overview', 'request', 'lending', 'release', 'inventory'];
  if (groups.restocking.indexOf(operation) >= 0) return ['overview', 'restocking', 'procurement', 'inventory'];
  if (groups.procurement.indexOf(operation) >= 0) return ['overview', 'release', 'restocking', 'procurement', 'inventory'];
  if (groups.release.indexOf(operation) >= 0) return ['overview', 'release', 'inventory'];
  if (groups.inventory.indexOf(operation) >= 0) return ['overview', 'request', 'lending', 'release', 'restocking', 'inventory'];
  return HAU_DATA_REVISION_SCOPES_.slice();
}

function touchDataRevision_(actor, scopes) {
  ensureDataRevisionConfig_(actor);
  var current = getDataRevision_();
  var timestamp = nowIso_();
  var next = current.revision + 1;
  var scopeMap = revisionScopeMap_(current);
  var touchedScopes = (scopes && scopes.length ? scopes : HAU_DATA_REVISION_SCOPES_).filter(function(scope, index, values) {
    return HAU_DATA_REVISION_SCOPES_.indexOf(scope) >= 0 && values.indexOf(scope) === index;
  });
  touchedScopes.forEach(function(scope) {
    scopeMap[scope] = { token: Number(scopeMap[scope].token || 0) + 1, updatedAt: timestamp };
  });
  writeRevisionConfig_(HAU_DATA_REVISION_KEYS_.REVISION, next, 'Monotonic operational data revision', actor, timestamp);
  writeRevisionConfig_(HAU_DATA_REVISION_KEYS_.UPDATED_AT, timestamp, 'Last operational data revision update', actor, timestamp);
  writeRevisionConfig_(HAU_DATA_REVISION_KEYS_.SCOPES, JSON.stringify(scopeMap), 'Per-module near-live revision tokens', actor, timestamp);
  writeDataRevisionSnapshot_({ revision: next, updatedAt: timestamp, environment: current.environment });
  return { revision: next, updatedAt: timestamp, environment: current.environment, scopes: touchedScopes.reduce(function(result, scope) { result[scope] = scopeMap[scope].token; return result; }, {}) };
}

function touchDataRevisionForMutation_(actor) {
  if (!HAU_MUTATION_CONTEXT_) return null;
  if (HAU_MUTATION_CONTEXT_.touched) return HAU_MUTATION_CONTEXT_.revision;
  HAU_MUTATION_CONTEXT_.revision = touchDataRevision_(actor, HAU_MUTATION_CONTEXT_.scopes);
  HAU_MUTATION_CONTEXT_.touched = true;
  return HAU_MUTATION_CONTEXT_.revision;
}

function guardMutationApi_(operationName, command, fn) {
  return guardApi_(operationName, command, function(correlationId) {
    var previous = HAU_MUTATION_CONTEXT_;
    var context = { operation: operationName, scopes: revisionScopesForOperation_(operationName), touched: false, revision: null };
    HAU_MUTATION_CONTEXT_ = context;
    try {
      var result = fn(correlationId) || {};
      if (!result.idempotentReplay && !context.touched) {
        context.revision = withScriptLock_(function() { return touchDataRevision_({ User_ID: 'SYSTEM' }, context.scopes); });
        context.touched = true;
      }
      if (context.revision) {
        result.dataRevision = context.revision.revision;
        result.dataRevisionUpdatedAt = context.revision.updatedAt;
        result.dataScopeRevisions = context.revision.scopes;
      }
      return result;
    } finally {
      HAU_MUTATION_CONTEXT_ = previous;
    }
  });
}

function api_getDataRevision() {
  return guardApi_('getDataRevision', {}, function() { return getDataRevision_(); });
}

function scopedRevisionResponse_(command, stats) {
  var scope = String(command && command.scope || '').trim().toLowerCase();
  if (HAU_DATA_REVISION_SCOPES_.indexOf(scope) < 0) throw appError_('REVISION_SCOPE_INVALID', 'The requested revision scope is not supported.', false);
  var session = bootstrapSession_(command || {});
  if (!session.internal || !bootstrapModuleAllowed_(scope, session)) throw appError_('FORBIDDEN', 'This revision scope is not available for the current session.', false);
  var globalRevision = getDataRevision_(), scoped = revisionScopeMap_(globalRevision)[scope];
  return {
    contract: 'scoped-revision',
    contractVersion: 1,
    enabled: resolveNearLiveRefreshEnabled_(),
    scope: scope,
    token: scoped.token,
    globalRevision: globalRevision.revision,
    updatedAt: scoped.updatedAt,
    environment: globalRevision.environment,
    metrics: { revisionReads: Math.max(1, Number(stats && stats.readCount || 0)), moduleReads: 0, requestCount: 1 }
  };
}

function api_getScopedRevision(command) {
  return guardApi_('getScopedRevision', command || {}, function() {
    return withRequestReadCache_(function(stats) { return scopedRevisionResponse_(command || {}, stats); });
  });
}

function revisionOnlyConfigEdit_(range) {
  if (range.getSheet().getName() !== HAU_SHEETS.CONFIG) return false;
  var start = range.getRow();
  var count = range.getNumRows();
  if (start < 2) return false;
  var keys = range.getSheet().getRange(start, 1, count, 1).getDisplayValues().map(function(row) { return String(row[0]); });
  return keys.length > 0 && keys.every(function(key) {
    return key === HAU_DATA_REVISION_KEYS_.REVISION || key === HAU_DATA_REVISION_KEYS_.UPDATED_AT || key === HAU_DATA_REVISION_KEYS_.SCOPES;
  });
}

function handleOperationalSheetEdit(e) {
  if (!e || !e.range) return { ignored: true, reason: 'EVENT_REQUIRED' };
  var runtime = resolveRuntimeConfig_();
  var sheet = e.range.getSheet();
  var spreadsheet = e.source || sheet.getParent();
  if (!spreadsheet || String(spreadsheet.getId()) !== String(runtime.spreadsheetId)) return { ignored: true, reason: 'WRONG_SPREADSHEET' };
  if (sheet.getName() === HAU_SHEETS.README || revisionOnlyConfigEdit_(e.range)) return { ignored: true, reason: 'IRRELEVANT_EDIT' };
  return withScriptLock_(function() {
    return touchDataRevision_({ User_ID: 'SHEET_EDIT_TRIGGER' }, HAU_DATA_REVISION_SCOPES_);
  });
}

function setupOperationalEditTrigger() {
  return guardApi_('setupOperationalEditTrigger', {}, function() {
    var user = setupUser_();
    var runtime = resolveRuntimeConfig_();
    var existing = ScriptApp.getProjectTriggers().filter(function(trigger) {
      if (trigger.getHandlerFunction() !== 'handleOperationalSheetEdit') return false;
      return typeof trigger.getTriggerSourceId !== 'function' || String(trigger.getTriggerSourceId() || '') === String(runtime.spreadsheetId);
    });
    if (existing.length) return { created: false, existing: existing.length, spreadsheetId: runtime.spreadsheetId, actor: user.User_ID };
    ScriptApp.newTrigger('handleOperationalSheetEdit').forSpreadsheet(getDatabase_()).onEdit().create();
    return { created: true, existing: 0, spreadsheetId: runtime.spreadsheetId, actor: user.User_ID };
  });
}
