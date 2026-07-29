var HAU_FOOD_SERVICE_CLASSES_ = ['BULK_NON_PERISHABLE_OR_CATERING', 'PERISHABLE_FOOD'];
var HAU_FOOD_DIETARY_SUMMARIES_ = ['NONE_REPORTED', 'ATTENTION_REQUIRED', 'PENDING_CONFIRMATION'];
var HAU_FOOD_SOURCING_MODES_ = ['PANTRY_STOCK_REVIEW', 'CANVASS_REQUIRED', 'APPROVED_EXTERNAL_SOURCE'];
var HAU_FOOD_SOURCING_STATUSES_ = ['PENDING_STOCK_REVIEW', 'PENDING_CANVASS', 'CONFIRMED'];

function foodRequestsEnabled_() { return resolveFoodRequestsEnabled_(); }
function foodControlled_(value, allowed, field) {
  var normalized = String(value == null ? '' : value).trim().toUpperCase();
  if (allowed.indexOf(normalized) < 0) throw appError_('VALIDATION_ERROR', field + ' is not supported.', false, { field: field });
  return normalized;
}
function foodInteger_(value, field, allowZero) {
  var number = Number(value), minimum = allowZero ? 0 : 1;
  if (!isFinite(number) || Math.floor(number) !== number || number < minimum) throw appError_('VALIDATION_ERROR', field + ' must be ' + (allowZero ? 'zero or a positive integer.' : 'a positive integer.'), false, { field: field });
  return number;
}
function foodIso_(value, field, required) {
  var normalized = compositeNormalizeText_(value, field, required, 80);
  if (normalized && (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(normalized) || isNaN(new Date(normalized).getTime()))) throw appError_('VALIDATION_ERROR', field + ' must be a valid ISO date-time.', false, { field: field });
  return normalized;
}
function foodManilaDate_(value) { return Utilities.formatDate(new Date(value), HAU_CONFIG.TIMEZONE, 'yyyy-MM-dd'); }
function foodBusinessDays_(start, end) {
  var cursor = new Date(start + 'T12:00:00+08:00'), finish = new Date(end + 'T12:00:00+08:00'), days = 0;
  while (cursor.getTime() < finish.getTime()) { var weekday = cursor.getDay(); if (weekday !== 0 && weekday !== 6) days += 1; cursor.setDate(cursor.getDate() + 1); }
  return days;
}
function foodLeadTime_(serviceClass, submittedAt, serviceStartAt) {
  var requiredDays = serviceClass === 'PERISHABLE_FOOD' ? 5 : 10;
  if (!submittedAt || !serviceStartAt) return { status: 'UNKNOWN', requiredDays: requiredDays, actualDays: null, shortBy: null };
  var actualDays = foodBusinessDays_(foodManilaDate_(submittedAt), foodManilaDate_(serviceStartAt));
  return { status: actualDays >= requiredDays ? 'MET' : 'SHORT', compliant: actualDays >= requiredDays, requiredDays: requiredDays, actualDays: actualDays, shortBy: Math.max(0, requiredDays - actualDays) };
}
function foodDetails_(raw, submittedAt, eventStartAt) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw appError_('VALIDATION_ERROR', 'Food workflow details are required.', false, { field: 'food' });
  ['dietaryNarrative','dietaryNames','medicalDetails','supplierContact','supplierTin','paymentDetails'].forEach(function(key) { if (raw[key] != null && String(raw[key]).trim()) throw appError_('SENSITIVE_DATA_NOT_ALLOWED', 'Person-level dietary, medical, supplier, and payment details are not allowed.', false); });
  var serviceClass = foodControlled_(raw.serviceClass, HAU_FOOD_SERVICE_CLASSES_, 'food.serviceClass');
  var requiredServings = foodInteger_(raw.requiredServings, 'food.requiredServings', false);
  var dietarySummary = foodControlled_(raw.dietarySummary, HAU_FOOD_DIETARY_SUMMARIES_, 'food.dietarySummary');
  var dietaryAttentionServings = foodInteger_(raw.dietaryAttentionServings == null ? 0 : raw.dietaryAttentionServings, 'food.dietaryAttentionServings', true);
  if (dietaryAttentionServings > requiredServings) throw appError_('VALIDATION_ERROR', 'food.dietaryAttentionServings cannot exceed required servings.', false, { field: 'food.dietaryAttentionServings' });
  if ((dietarySummary === 'ATTENTION_REQUIRED') !== (dietaryAttentionServings > 0)) throw appError_('VALIDATION_ERROR', 'Dietary attention count must be positive only when attention is required.', false, { field: 'food.dietaryAttentionServings' });
  var sourcingMode = foodControlled_(raw.sourcingMode, HAU_FOOD_SOURCING_MODES_, 'food.sourcingMode');
  var sourceReference = compositeNormalizeText_(raw.sourceReference, 'food.sourceReference', sourcingMode === 'APPROVED_EXTERNAL_SOURCE', 120);
  var serviceStartAt = foodIso_(raw.serviceStartAt || eventStartAt, 'food.serviceStartAt', true), serviceEndAt = foodIso_(raw.serviceEndAt, 'food.serviceEndAt', false);
  if (serviceEndAt && new Date(serviceEndAt).getTime() < new Date(serviceStartAt).getTime()) throw appError_('VALIDATION_ERROR', 'food.serviceEndAt cannot precede the service start.', false, { field: 'food.serviceEndAt' });
  return { version: 1, serviceClass: serviceClass, expectedHeadcount: foodInteger_(raw.expectedHeadcount, 'food.expectedHeadcount', false), requiredServings: requiredServings, serviceStartAt: serviceStartAt, serviceEndAt: serviceEndAt, serviceLocation: compositeNormalizeText_(raw.serviceLocation, 'food.serviceLocation', true, 120), dietarySummary: dietarySummary, dietaryAttentionServings: dietaryAttentionServings, sourcingMode: sourcingMode, sourcingStatus: { PANTRY_STOCK_REVIEW: 'PENDING_STOCK_REVIEW', CANVASS_REQUIRED: 'PENDING_CANVASS', APPROVED_EXTERNAL_SOURCE: 'CONFIRMED' }[sourcingMode], sourceReference: sourceReference, completionEvidenceId: '', leadTime: foodLeadTime_(serviceClass, submittedAt, serviceStartAt) };
}
function foodAttentionFlags_(food) {
  var flags = [];
  if (food.leadTime && food.leadTime.status === 'SHORT') flags.push('FOOD_LEAD_TIME_SHORT');
  if (food.leadTime && food.leadTime.status === 'UNKNOWN') flags.push('FOOD_LEAD_TIME_UNKNOWN');
  if (food.dietarySummary === 'PENDING_CONFIRMATION') flags.push('FOOD_DIETARY_CONFIRMATION_PENDING');
  if (food.sourcingStatus !== 'CONFIRMED') flags.push('FOOD_SOURCING_PENDING');
  if (!food.completionEvidenceId) flags.push('FOOD_COMPLETION_EVIDENCE_MISSING');
  return flags;
}
function foodUpdate_(current, patch) {
  if (!current || Number(current.version) !== 1) throw appError_('FOOD_WORKFLOW_VERSION_UNSUPPORTED', 'Food workflow version is unsupported.', false);
  patch = patch || {}; var next = Object.assign({}, current);
  if (patch.dietarySummary != null) next.dietarySummary = foodControlled_(patch.dietarySummary, HAU_FOOD_DIETARY_SUMMARIES_, 'dietarySummary');
  if (patch.dietaryAttentionServings != null) next.dietaryAttentionServings = foodInteger_(patch.dietaryAttentionServings, 'dietaryAttentionServings', true);
  if (next.dietaryAttentionServings > next.requiredServings || ((next.dietarySummary === 'ATTENTION_REQUIRED') !== (next.dietaryAttentionServings > 0))) throw appError_('VALIDATION_ERROR', 'Dietary attention count is inconsistent.', false, { field: 'dietaryAttentionServings' });
  if (patch.sourcingStatus != null) next.sourcingStatus = foodControlled_(patch.sourcingStatus, HAU_FOOD_SOURCING_STATUSES_, 'sourcingStatus');
  var allowedSourcingStatuses = { PANTRY_STOCK_REVIEW: ['PENDING_STOCK_REVIEW', 'CONFIRMED'], CANVASS_REQUIRED: ['PENDING_CANVASS', 'CONFIRMED'], APPROVED_EXTERNAL_SOURCE: ['CONFIRMED'] }[next.sourcingMode];
  if (allowedSourcingStatuses.indexOf(next.sourcingStatus) < 0) throw appError_('VALIDATION_ERROR', 'sourcingStatus is incompatible with the selected sourcing mode.', false, { field: 'sourcingStatus' });
  if (patch.sourceReference != null) next.sourceReference = compositeNormalizeText_(patch.sourceReference, 'sourceReference', false, 120);
  if (next.sourcingMode === 'APPROVED_EXTERNAL_SOURCE' && !next.sourceReference) throw appError_('VALIDATION_ERROR', 'sourceReference is required for an approved external source.', false, { field: 'sourceReference' });
  if (patch.completionEvidenceId != null) next.completionEvidenceId = compositeNormalizeText_(patch.completionEvidenceId, 'completionEvidenceId', false, 120);
  return next;
}
function foodEvidenceUploaded_(evidenceId, componentId) {
  if (!evidenceId) return false;
  return findAll_(HAU_SHEETS.EVIDENCE, function(row) { return String(row.Evidence_ID) === String(evidenceId) && String(row.Evidence_Type) === 'DELIVERABLE_DELIVERY_PROOF' && String(row.Related_Entity_Type) === 'COMPOSITE_COMPONENT' && String(row.Related_Entity_ID) === String(componentId) && String(row.Upload_Status) === 'UPLOADED'; }).length === 1;
}
function foodAssertTransition_(child, action) {
  if (String(child.Component_Type) !== 'FOOD') return;
  var food = compositeParse_(child.Component_Payload_JSON, {}).food, normalized = String(action || '').trim().toUpperCase();
  if (!food) throw appError_('FOOD_WORKFLOW_REQUIRED', 'Food workflow details are missing.', false);
  if (normalized === 'READY_FOR_HANDOFF' && food.dietarySummary === 'PENDING_CONFIRMATION') throw appError_('FOOD_DIETARY_CONFIRMATION_REQUIRED', 'Dietary summary must be confirmed before handoff.', false);
  if (normalized === 'READY_FOR_HANDOFF' && food.sourcingStatus !== 'CONFIRMED') throw appError_('FOOD_SOURCING_REQUIRED', 'Food sourcing must be confirmed before handoff.', false);
  if (normalized === 'COMPLETE' && !foodEvidenceUploaded_(food.completionEvidenceId, child.Component_ID)) throw appError_('FOOD_COMPLETION_EVIDENCE_REQUIRED', 'Uploaded Food delivery evidence is required before completion.', false);
}
function foodQueueItem_(parent, child) {
  var payload = compositeParse_(child.Component_Payload_JSON, {});
  return { requestId: parent.Request_ID, componentId: child.Component_ID, status: child.Lifecycle_Status, ownerCommitteeId: 'COM_FOOD', ownerUserId: child.Owner_User_ID || '', dueAt: child.Due_At || '', revision: Number(child.Revision || 1), parent: { eventId: parent.Event_ID || '', eventName: parent.Event_Name || '', eventStartAt: parent.Event_Start_At || '', priority: parent.Priority || 'ROUTINE', purpose: parent.Purpose || '', department: parent.Department || '' }, food: payload.food, attentionFlags: compositeParse_(child.Attention_Flags_JSON, []) };
}
function getFoodWorkQueue_() {
  return withRequestReadCache_(function() {
    requirePermission_('Can_Review', { committeeIds: ['COM_FOOD'] });
    var children = findAll_(HAU_SHEETS.COMPOSITE_REQUESTS, function(row) { return String(row.Record_Type) === 'COMPONENT' && String(row.Component_Type) === 'FOOD' && !row.Archived_At; });
    return { committeeId: 'COM_FOOD', items: children.slice(0, 100).map(function(child) { var parent = compositeFindParent_(compositeRowsForRequest_(child.Request_ID)); return foodQueueItem_(parent, child); }), truncated: children.length > 100 };
  });
}
function updateFoodComponent_(command, correlationId) {
  return withScriptLock_(function() {
    var key = requireIdempotency_(command), replay = idempotencyReplay_(key); if (replay) return Object.assign({ idempotentReplay: true }, replay);
    var rows = compositeRowsForRequest_(requireText_(command.requestId, 'requestId')), parent = compositeFindParent_(rows), child = compositeChildren_(rows).find(function(row) { return String(row.Component_ID) === String(command.componentId) && String(row.Component_Type) === 'FOOD'; });
    if (!parent || !child) throw appError_('FOOD_COMPONENT_NOT_FOUND', 'Food component was not found.', false);
    if (['COMPLETED', 'REJECTED', 'CANCELLED'].indexOf(String(child.Lifecycle_Status)) >= 0) throw appError_('FOOD_UPDATE_NOT_ALLOWED', 'Terminal Food components cannot be updated.', false);
    var user = requirePermission_('Can_Review', { committeeIds: ['COM_FOOD'] });
    if (Number(command.expectedRevision) !== Number(child.Revision || 1)) throw appError_('REVISION_CONFLICT', 'Food component changed; refresh before updating.', true);
    var payload = compositeParse_(child.Component_Payload_JSON, {}), next = foodUpdate_(payload.food, command.patch || {});
    if (next.completionEvidenceId && !foodEvidenceUploaded_(next.completionEvidenceId, child.Component_ID)) throw appError_('FOOD_COMPLETION_EVIDENCE_INVALID', 'Food completion evidence must be uploaded and linked to this component.', false);
    payload.food = next; var now = nowIso_(), flags = foodAttentionFlags_(next), revision = Number(child.Revision || 1) + 1;
    updateObject_(HAU_SHEETS.COMPOSITE_REQUESTS, child._row, { Component_Payload_JSON: safeJson_(payload), Attention_Flags_JSON: safeJson_(flags), Progress_JSON: safeJson_({ lineCount: (payload.lines || []).length, sourcingStatus: next.sourcingStatus, evidenceLinked: Boolean(next.completionEvidenceId) }), Revision: revision, Updated_At: now });
    var projectedChildren = compositeChildren_(rows).map(function(row) { return row.Component_ID === child.Component_ID ? Object.assign({}, row, { Component_Payload_JSON: safeJson_(payload), Attention_Flags_JSON: safeJson_(flags), Revision: revision, Updated_At: now }) : row; });
    var derived = compositeSetParentProjection_(parent, projectedChildren, now);
    history_('COMPOSITE_COMPONENT', child.Component_ID, child.Lifecycle_Status, child.Lifecycle_Status, user, command.reason || 'Food workflow updated', { requestId: child.Request_ID, idempotencyKey: key, metadata: { revision: revision } });
    audit_('UPDATE_FOOD_COMPONENT', 'COMPOSITE_COMPONENT', child.Component_ID, user, correlationId, { after: { revision: revision, sourcingStatus: next.sourcingStatus, dietarySummary: next.dietarySummary, evidenceLinked: Boolean(next.completionEvidenceId) }, requestId: child.Request_ID });
    return recordIdempotency_(key, { requestId: child.Request_ID, componentId: child.Component_ID, revision: revision, parentStatus: derived.status, food: next, entityType: 'COMPOSITE_COMPONENT', entityId: child.Component_ID }, user, correlationId);
  });
}
