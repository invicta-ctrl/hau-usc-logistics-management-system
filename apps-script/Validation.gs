function appError_(code, message, retryable, details) {
  var error = new Error(message); error.code = code; error.retryable = Boolean(retryable); error.details = details || {}; return error;
}
function requireObject_(value, name) { if (!value || Object.prototype.toString.call(value) !== '[object Object]') throw appError_('VALIDATION_ERROR', (name || 'Payload') + ' is required.', false); return value; }
function requireText_(value, field) { var text = String(value == null ? '' : value).trim(); if (!text) throw appError_('VALIDATION_ERROR', field + ' is required.', false, { field: field }); return text; }
function positiveNumber_(value, field) { var n = Number(value); if (!isFinite(n) || n <= 0) throw appError_('VALIDATION_ERROR', field + ' must be greater than zero.', false); return n; }
function nonNegativeNumber_(value, field) { var n = Number(value || 0); if (!isFinite(n) || n < 0) throw appError_('VALIDATION_ERROR', field + ' cannot be negative.', false); return n; }
function requireIdempotency_(command) { return requireText_(command.clientRequestId || command.idempotencyKey, 'clientRequestId'); }
function normalizeEmail_(value) { return String(value || '').trim().toLowerCase(); }
function safeJson_(value) { try { return JSON.stringify(value == null ? null : value); } catch (e) { return JSON.stringify({ serializationError: true }); } }
function sanitizeSystemToken_(value) { return String(value || 'NA').toUpperCase().replace(/[^A-Z0-9-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').slice(0, 80) || 'NA'; }
function correlationId_() { return 'COR-' + Utilities.getUuid().replace(/-/g, '').slice(0, 16).toUpperCase(); }
function publicError_(error, correlationId) { return { ok: false, code: error.code || 'INTERNAL_ERROR', message: error.code ? error.message : 'The operation could not be completed.', correlationId: correlationId, retryable: Boolean(error.retryable), details: error.code ? (error.details || {}) : {} }; }

function clientSafeValue_(value) {
  var valueType = typeof value;
  if (value === null) return null;
  if (valueType === 'undefined' || valueType === 'function' || valueType === 'symbol' || valueType === 'bigint') return null;
  if (Object.prototype.toString.call(value) === '[object Date]') {
    return isNaN(value.getTime()) ? '' : value.toISOString();
  }
  if (Array.isArray(value)) return value.map(clientSafeValue_);
  if (typeof value === 'number' && !isFinite(value)) return null;
  if (typeof value === 'object') {
    var output = {};
    Object.keys(value).forEach(function(key) {
      var item = value[key];
      var itemType = typeof item;
      if (itemType !== 'function' && itemType !== 'undefined' && itemType !== 'symbol' && itemType !== 'bigint') output[key] = clientSafeValue_(item);
    });
    return output;
  }
  return value;
}

function withScriptLock_(operation) {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(HAU_CONFIG.LOCK_TIMEOUT_MS)) throw appError_('LOCK_TIMEOUT', 'The system is busy. Please retry safely.', true);
  try { return operation(); } finally { lock.releaseLock(); }
}
function guardApi_(operationName, command, fn) {
  var correlationId = correlationId_();
  try {
    var result = fn(correlationId);
    return clientSafeValue_(Object.assign({ ok: true, correlationId: correlationId }, result || {}));
  }
  catch (error) {
    try { logError_(operationName, command, error, correlationId); } catch (ignored) {}
    return clientSafeValue_(publicError_(error, correlationId));
  }
}
