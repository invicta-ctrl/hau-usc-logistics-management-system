var HAU_DATA_REVISION_KEYS_ = Object.freeze({
  REVISION: 'DATA_REVISION',
  UPDATED_AT: 'DATA_REVISION_UPDATED_AT'
});

var HAU_MUTATION_CONTEXT_ = null;

function revisionConfigRow_(key) {
  return findOne_(HAU_SHEETS.CONFIG, 'Key', key);
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
  var revisionRow = revisionConfigRow_(HAU_DATA_REVISION_KEYS_.REVISION);
  var updatedRow = revisionConfigRow_(HAU_DATA_REVISION_KEYS_.UPDATED_AT);
  var revision = Number(revisionRow && revisionRow.Value || 0);
  if (!isFinite(revision) || revision < 0) revision = 0;
  return {
    revision: Math.floor(revision),
    updatedAt: String(updatedRow && updatedRow.Value || ''),
    environment: resolveRuntimeConfig_().environment
  };
}

function touchDataRevision_(actor) {
  ensureDataRevisionConfig_(actor);
  var current = getDataRevision_();
  var timestamp = nowIso_();
  var next = current.revision + 1;
  writeRevisionConfig_(HAU_DATA_REVISION_KEYS_.REVISION, next, 'Monotonic operational data revision', actor, timestamp);
  writeRevisionConfig_(HAU_DATA_REVISION_KEYS_.UPDATED_AT, timestamp, 'Last operational data revision update', actor, timestamp);
  return { revision: next, updatedAt: timestamp, environment: current.environment };
}

function touchDataRevisionForMutation_(actor) {
  if (!HAU_MUTATION_CONTEXT_) return null;
  if (HAU_MUTATION_CONTEXT_.touched) return HAU_MUTATION_CONTEXT_.revision;
  HAU_MUTATION_CONTEXT_.revision = touchDataRevision_(actor);
  HAU_MUTATION_CONTEXT_.touched = true;
  return HAU_MUTATION_CONTEXT_.revision;
}

function guardMutationApi_(operationName, command, fn) {
  return guardApi_(operationName, command, function(correlationId) {
    var previous = HAU_MUTATION_CONTEXT_;
    var context = { operation: operationName, touched: false, revision: null };
    HAU_MUTATION_CONTEXT_ = context;
    try {
      var result = fn(correlationId) || {};
      if (!result.idempotentReplay && !context.touched) {
        context.revision = withScriptLock_(function() { return touchDataRevision_({ User_ID: 'SYSTEM' }); });
        context.touched = true;
      }
      if (context.revision) {
        result.dataRevision = context.revision.revision;
        result.dataRevisionUpdatedAt = context.revision.updatedAt;
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

function revisionOnlyConfigEdit_(range) {
  if (range.getSheet().getName() !== HAU_SHEETS.CONFIG) return false;
  var start = range.getRow();
  var count = range.getNumRows();
  if (start < 2) return false;
  var keys = range.getSheet().getRange(start, 1, count, 1).getDisplayValues().map(function(row) { return String(row[0]); });
  return keys.length > 0 && keys.every(function(key) {
    return key === HAU_DATA_REVISION_KEYS_.REVISION || key === HAU_DATA_REVISION_KEYS_.UPDATED_AT;
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
    return touchDataRevision_({ User_ID: 'SHEET_EDIT_TRIGGER' });
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
