var HAU_COMPOSITE_SECTION_TYPES_ = ['FOOD', 'MATERIALS', 'VENUE_EQUIPMENT'];
var HAU_COMPOSITE_SECTION_LABELS_ = { FOOD: 'Food', MATERIALS: 'Materials', VENUE_EQUIPMENT: 'Venue & Equipment' };
var HAU_COMPOSITE_COMMITTEES_ = { FOOD: 'COM_FOOD', MATERIALS: 'COM_MATERIALS', VENUE_EQUIPMENT: 'COM_INVENTORY_PANTRY' };
var HAU_COMPOSITE_TERMINAL_STATUSES_ = ['COMPLETED', 'REJECTED', 'CANCELLED'];

function compositeRequestsEnabled_() { return resolveCompositeRequestsEnabled_(); }
function compositeNormalizeText_(value, field, required, max) {
  var text = String(value == null ? '' : value).trim(); max = max || 240;
  if (required && !text) throw appError_('VALIDATION_ERROR', field + ' is required.', false, { field: field });
  if (text.length > max) throw appError_('VALIDATION_ERROR', field + ' is too long.', false, { field: field, max: max });
  return text;
}
function compositePositive_(value, field) { var number = Number(value); if (!isFinite(number) || number <= 0) throw appError_('VALIDATION_ERROR', field + ' must be greater than zero.', false, { field: field }); return number; }
function compositeSectionType_(value) { var type = String(value || '').trim().toUpperCase(); if (HAU_COMPOSITE_SECTION_TYPES_.indexOf(type) < 0) throw appError_('VALIDATION_ERROR', 'Section type is not supported.', false, { field: 'sectionType' }); return type; }
function compositeLineKey_(line) { return safeJson_([String(line.referenceId || '').trim().toLowerCase(), String(line.label || '').trim().toLowerCase().replace(/\s+/g, ' '), String(line.unit || '').trim().toLowerCase(), String(line.notes || '').trim().toLowerCase().replace(/\s+/g, ' ')]); }
function compositeLine_(line, index) {
  if (!line || typeof line !== 'object' || Array.isArray(line)) throw appError_('VALIDATION_ERROR', 'Composite line is invalid.', false, { field: 'lines[' + index + ']' });
  return { referenceId: compositeNormalizeText_(line.referenceId || line.itemId, 'lines[' + index + '].referenceId', false, 100), label: compositeNormalizeText_(line.label || line.description || line.name, 'lines[' + index + '].label', true), quantity: compositePositive_(line.quantity, 'lines[' + index + '].quantity'), unit: compositeNormalizeText_(line.unit, 'lines[' + index + '].unit', true, 40).toLowerCase(), notes: compositeNormalizeText_(line.notes, 'lines[' + index + '].notes', false) };
}
function compositeConsolidateLines_(lines) {
  var result = [], indexes = {};
  lines.forEach(function(line) {
    var key = compositeLineKey_(line), index = indexes[key];
    if (index == null) { indexes[key] = result.length; result.push(Object.assign({}, line, { duplicateCount: 0 })); }
    else { result[index].quantity += Number(line.quantity); result[index].duplicateCount += 1; }
  });
  return result;
}
function compositeSection_(section, index) {
  if (!section || typeof section !== 'object' || Array.isArray(section)) throw appError_('VALIDATION_ERROR', 'Composite section is invalid.', false, { field: 'sections[' + index + ']' });
  var type = compositeSectionType_(section.type), label = compositeNormalizeText_(section.label, 'sections[' + index + '].label', false, 120), notes = compositeNormalizeText_(section.notes, 'sections[' + index + '].notes', false), lines = Array.isArray(section.lines) ? section.lines : [];
  if (!lines.length && !label && !notes) return null;
  if (!lines.length) throw appError_('VALIDATION_ERROR', HAU_COMPOSITE_SECTION_LABELS_[type] + ' needs at least one line.', false, { field: 'sections[' + index + '].lines' });
  if (lines.length > 100) throw appError_('VALIDATION_ERROR', HAU_COMPOSITE_SECTION_LABELS_[type] + ' has too many lines.', false);
  return { type: type, label: label || HAU_COMPOSITE_SECTION_LABELS_[type], notes: notes, clientComponentId: compositeNormalizeText_(section.clientComponentId, 'clientComponentId', false, 120), lines: compositeConsolidateLines_(lines.map(compositeLine_)) };
}
function compositeDraft_(command) {
  requireObject_(command, 'Composite request');
  if (command.requestId || command.parentRequestId || command.componentId) throw appError_('CLIENT_AUTHORITY_VIOLATION', 'Request and component IDs are server-owned.', false);
  var requester = command.requester || {};
  var requesterName = compositeNormalizeText_(command.requesterName || requester.name, 'requesterName', true);
  var requesterEmail = compositeNormalizeText_(command.requesterEmail || requester.email, 'requesterEmail', false).toLowerCase();
  var department = compositeNormalizeText_(command.department || requester.department, 'department', true);
  var purpose = compositeNormalizeText_(command.purpose, 'purpose', true, 1000);
  var event = command.event || {};
  var eventId = compositeNormalizeText_(command.eventId || event.id, 'eventId', true, 120);
  var sections = (Array.isArray(command.sections) ? command.sections : []).map(compositeSection_).filter(function(section) { return Boolean(section); });
  var seen = {};
  sections.forEach(function(section) { if (seen[section.type]) throw appError_('VALIDATION_ERROR', 'The ' + HAU_COMPOSITE_SECTION_LABELS_[section.type] + ' section was repeated.', false); seen[section.type] = true; });
  if (!sections.length) throw appError_('COMPOSITE_SECTIONS_REQUIRED', 'Add at least one non-empty logistics section.', false, { field: 'sections' });
  return { requesterName: requesterName, requesterEmail: requesterEmail, department: department, purpose: purpose, eventSeriesId: compositeNormalizeText_(command.eventSeriesId || event.seriesId, 'eventSeriesId', false, 120), eventId: eventId, eventName: compositeNormalizeText_(command.eventName || event.name, 'eventName', false), eventStartAt: compositeNormalizeText_(command.eventStartAt || event.startAt, 'eventStartAt', false, 80), eventEndAt: compositeNormalizeText_(command.eventEndAt || event.endAt, 'eventEndAt', false, 80), priority: compositeNormalizeText_(command.priority, 'priority', false, 40) || 'ROUTINE', sections: sections };
}
function compositePayload_(section) { return safeJson_({ notes: section.notes, lines: section.lines.map(function(line) { var copy = Object.assign({}, line); delete copy.duplicateCount; return copy; }) }); }
function compositeRowsFromDraft_(draft, requestId, componentIds, user, key, now) {
  var parent = { Record_ID: requestId, Record_Type: 'PARENT', Request_ID: requestId, Component_ID: '', Relationship_Type: 'COMPOSITE_PARENT', Relationship_Version: 1, Component_Type: '', Label: 'Composite Event Logistics', Requester_Name: draft.requesterName, Requester_Email: draft.requesterEmail, Department: draft.department, Event_Series_ID: draft.eventSeriesId, Event_ID: draft.eventId, Event_Name: draft.eventName, Event_Start_At: draft.eventStartAt, Event_End_At: draft.eventEndAt, Priority: draft.priority, Purpose: draft.purpose, Component_Payload_JSON: '', Lifecycle_Status: 'FOR_REVIEW', Owner_Committee_ID: '', Owner_User_ID: '', Due_At: draft.eventStartAt, Attention_Flags_JSON: '[]', Progress_JSON: safeJson_({ total: draft.sections.length, active: draft.sections.length, completed: 0, rejected: 0, cancelled: 0 }), Revision: 1, Created_At: now, Updated_At: now, Created_By: user.User_ID || 'PUBLIC', Client_Request_ID: key, Client_Component_ID: '', Idempotency_Key: key, Archived_At: '', Notes: '' };
  var rows = [parent];
  draft.sections.forEach(function(section, index) {
    rows.push({ Record_ID: componentIds[index], Record_Type: 'COMPONENT', Request_ID: requestId, Component_ID: componentIds[index], Relationship_Type: 'COMPOSITE_CHILD', Relationship_Version: 1, Component_Type: section.type, Label: section.label, Requester_Name: '', Requester_Email: '', Department: '', Event_Series_ID: '', Event_ID: draft.eventId, Event_Name: '', Event_Start_At: '', Event_End_At: '', Priority: draft.priority, Purpose: '', Component_Payload_JSON: compositePayload_(section), Lifecycle_Status: 'FOR_REVIEW', Owner_Committee_ID: HAU_COMPOSITE_COMMITTEES_[section.type], Owner_User_ID: '', Due_At: draft.eventStartAt, Attention_Flags_JSON: '[]', Progress_JSON: safeJson_({ lineCount: section.lines.length, duplicateCount: section.lines.reduce(function(sum, line) { return sum + Number(line.duplicateCount || 0); }, 0) }), Revision: 1, Created_At: now, Updated_At: now, Created_By: user.User_ID || 'PUBLIC', Client_Request_ID: '', Client_Component_ID: compositeNormalizeText_(draft.sections[index].clientComponentId, 'clientComponentId', false, 120), Idempotency_Key: key, Archived_At: '', Notes: section.notes });
  });
  return rows;
}
function compositeRowsForRequest_(requestId) { return findAll_(HAU_SHEETS.COMPOSITE_REQUESTS, function(row) { return String(row.Request_ID) === String(requestId); }); }
function compositeChildren_(rows) { return rows.filter(function(row) { return String(row.Record_Type) === 'COMPONENT'; }); }
function compositeParse_(value, fallback) { try { var parsed = JSON.parse(String(value || '')); return parsed == null ? fallback : parsed; } catch (e) { return fallback; } }
function compositeChildDto_(row) { var payload = compositeParse_(row.Component_Payload_JSON, { lines: [] }); return { componentId: row.Component_ID, componentType: row.Component_Type, label: row.Label, ownerCommitteeId: row.Owner_Committee_ID || '', ownerUserId: row.Owner_User_ID || '', dueAt: row.Due_At || '', status: row.Lifecycle_Status, attentionFlags: compositeParse_(row.Attention_Flags_JSON, []), progress: compositeParse_(row.Progress_JSON, {}), relationshipVersion: Number(row.Relationship_Version || 1), revision: Number(row.Revision || 1), payload: payload };
}
function compositeParentDto_(row, children) {
  var derived = compositeDerive_(children);
  return { requestId: row.Request_ID, recordType: 'PARENT', relationshipType: row.Relationship_Type, relationshipVersion: Number(row.Relationship_Version || 1), status: derived.status, attentionFlags: derived.attentionFlags, progress: derived.progress, requester: { name: row.Requester_Name || '', department: row.Department || '' }, event: { seriesId: row.Event_Series_ID || '', id: row.Event_ID || '', name: row.Event_Name || '', startAt: row.Event_Start_At || '', endAt: row.Event_End_At || '' }, priority: row.Priority || 'ROUTINE', purpose: row.Purpose || '', children: children.map(compositeChildDto_) };
}
function compositeDerive_(children) {
  if (!children.length) throw appError_('COMPOSITE_CHILDREN_REQUIRED', 'A composite request must have at least one child.', false);
  var counts = {}, completed = 0, rejected = 0, cancelled = 0;
  children.forEach(function(child) { var status = String(child.Lifecycle_Status || 'DRAFT'); counts[status] = (counts[status] || 0) + 1; if (status === 'COMPLETED') completed += 1; if (status === 'REJECTED') rejected += 1; if (status === 'CANCELLED') cancelled += 1; });
  var allRemainingCompleted = children.filter(function(child) { return child.Lifecycle_Status !== 'CANCELLED'; }).every(function(child) { return child.Lifecycle_Status === 'COMPLETED'; });
  var hasProgress = children.some(function(child) { return ['IN_PROGRESS', 'PARTIALLY_FULFILLED', 'READY_FOR_HANDOFF', 'COMPLETED'].indexOf(String(child.Lifecycle_Status)) >= 0; });
  var status = 'FOR_REVIEW';
  if (cancelled === children.length) status = 'CANCELLED';
  else if (rejected === children.length) status = 'REJECTED';
  else if (allRemainingCompleted) status = 'COMPLETED';
  else if (rejected || completed || hasProgress) status = 'PARTIALLY_FULFILLED';
  else if (children.every(function(child) { return child.Lifecycle_Status === 'DRAFT'; })) status = 'DRAFT';
  else if (children.every(function(child) { return child.Lifecycle_Status === 'FOR_REVIEW'; })) status = 'FOR_REVIEW';
  else if (children.some(function(child) { return child.Lifecycle_Status === 'ACCEPTED'; })) status = 'ACCEPTED';
  var attentionFlags = [];
  if (rejected && rejected < children.length) attentionFlags.push('HAS_REJECTED_SECTION');
  if (cancelled) attentionFlags.push('HAS_CANCELLED_SECTION');
  if (children.some(function(child) { return compositeParse_(child.Attention_Flags_JSON, []).indexOf('NEEDS_INFORMATION') >= 0; })) attentionFlags.push('NEEDS_INFORMATION');
  if (children.some(function(child) { return !child.Owner_Committee_ID || !child.Owner_User_ID; })) attentionFlags.push('UNASSIGNED_SECTION');
  return { status: status, attentionFlags: attentionFlags, progress: { total: children.length, active: children.length - rejected - cancelled, completed: completed, rejected: rejected, cancelled: cancelled, byStatus: counts } };
}
function compositeFindParent_(rows) { return rows.find(function(row) { return String(row.Record_Type) === 'PARENT'; }) || null; }
function compositeResult_(rows, idempotentReplay) { var parent = compositeFindParent_(rows), children = compositeChildren_(rows); if (!parent || !children.length) throw appError_('ATOMICITY_INCOMPLETE', 'The composite request packet is incomplete and was not replayed.', true); var dto = compositeParentDto_(parent, children); return { idempotentReplay: Boolean(idempotentReplay), requestId: dto.requestId, componentIds: dto.children.map(function(child) { return child.componentId; }), status: dto.status, request: dto };
}
function compositeSetParentProjection_(parent, children, now) { var derived = compositeDerive_(children); updateObject_(HAU_SHEETS.COMPOSITE_REQUESTS, parent._row, { Lifecycle_Status: derived.status, Attention_Flags_JSON: safeJson_(derived.attentionFlags), Progress_JSON: safeJson_(derived.progress), Revision: Number(parent.Revision || 1) + 1, Updated_At: now }); return derived; }
function compositeTransition_(child, action, reason) {
  var current = String(child.Lifecycle_Status || 'DRAFT'), normalized = String(action || '').trim().toUpperCase(), next = null;
  var transitions = { SUBMIT: { DRAFT: 'FOR_REVIEW' }, ACCEPT: { FOR_REVIEW: 'ACCEPTED' }, START: { ACCEPTED: 'IN_PROGRESS' }, PARTIALLY_FULFILL: { IN_PROGRESS: 'PARTIALLY_FULFILLED' }, READY_FOR_HANDOFF: { IN_PROGRESS: 'READY_FOR_HANDOFF', PARTIALLY_FULFILLED: 'READY_FOR_HANDOFF' }, COMPLETE: { READY_FOR_HANDOFF: 'COMPLETED' }, REJECT: { FOR_REVIEW: 'REJECTED', ACCEPTED: 'REJECTED' }, CANCEL: { DRAFT: 'CANCELLED', FOR_REVIEW: 'CANCELLED', ACCEPTED: 'CANCELLED', IN_PROGRESS: 'CANCELLED', PARTIALLY_FULFILLED: 'CANCELLED', READY_FOR_HANDOFF: 'CANCELLED' }, REOPEN: { REJECTED: 'FOR_REVIEW', CANCELLED: 'FOR_REVIEW' } };
  if (normalized === 'REQUEST_INFORMATION') { if (['FOR_REVIEW', 'ACCEPTED'].indexOf(current) < 0) throw appError_('INVALID_TRANSITION', 'Information cannot be requested from ' + current + '.', false); var flags = compositeParse_(child.Attention_Flags_JSON, []); if (flags.indexOf('NEEDS_INFORMATION') < 0) flags.push('NEEDS_INFORMATION'); return { status: current, attentionFlags: flags, reason: compositeNormalizeText_(reason, 'reason', true, 500) }; }
  if (normalized === 'CLEAR_ATTENTION') return { status: current, attentionFlags: compositeParse_(child.Attention_Flags_JSON, []).filter(function(flag) { return flag !== 'NEEDS_INFORMATION'; }), reason: '' };
  next = transitions[normalized] && transitions[normalized][current];
  if (!next) throw appError_('INVALID_TRANSITION', 'Composite child cannot move from ' + current + ' with ' + normalized + '.', false);
  return { status: next, attentionFlags: normalized === 'REOPEN' ? [] : compositeParse_(child.Attention_Flags_JSON, []).filter(function(flag) { return flag !== 'NEEDS_INFORMATION'; }), reason: compositeNormalizeText_(reason, 'reason', false, 500) };
}
function compositeRequireMutation_(command) { return requireIdempotency_(command); }

function submitCompositeRequest_(command, correlationId) {
  return withScriptLock_(function() {
    var key = compositeRequireMutation_(command), enabled = compositeRequestsEnabled_(), existing = [];
    try { existing = findAll_(HAU_SHEETS.COMPOSITE_REQUESTS, function(row) { return String(row.Idempotency_Key) === String(key); }); } catch (error) { if (!enabled) throw appError_('FEATURE_DISABLED', 'Composite request submission is not enabled.', false, { feature: 'HAU_COMPOSITE_REQUESTS_ENABLED' }); throw error; }
    if (existing.length) return compositeResult_(existing, true);
    if (!enabled) throw appError_('FEATURE_DISABLED', 'Composite request submission is not enabled.', false, { feature: 'HAU_COMPOSITE_REQUESTS_ENABLED' });
    var user = resolveRequesterUser_(), draft = compositeDraft_(command), requestId = allocateId_('LREQ'), componentIds = draft.sections.map(function() { return allocateId_('CMP'); }), now = nowIso_(), rows = compositeRowsFromDraft_(draft, requestId, componentIds, user, key, now);
    appendObjects_(HAU_SHEETS.COMPOSITE_REQUESTS, rows);
    history_('COMPOSITE_REQUEST', requestId, '', 'FOR_REVIEW', user, 'Composite request submitted', { idempotencyKey: key });
    rows.slice(1).forEach(function(row) { history_('COMPOSITE_COMPONENT', row.Component_ID, '', 'FOR_REVIEW', user, 'Composite section created', { requestId: requestId, idempotencyKey: key }); });
    audit_('SUBMIT_COMPOSITE_REQUEST', 'COMPOSITE_REQUEST', requestId, user, correlationId, { after: { requestId: requestId, componentIds: componentIds }, requestId: requestId, notes: safeJson_({ sectionCount: rows.length - 1 }) });
    return recordIdempotency_(key, compositeResult_(rows, false), user, correlationId);
  });
}

function getCompositeRequest_(command) {
  return withRequestReadCache_(function() {
    var requestId = requireText_(command && command.requestId, 'requestId'), rows = compositeRowsForRequest_(requestId), parent = compositeFindParent_(rows);
    if (!parent) throw appError_('REQUEST_NOT_FOUND', 'Composite request was not found.', false);
    var user = resolveRequesterUser_();
    var internal = typeof isInternalBootstrapUser_ === 'function' && isInternalBootstrapUser_(user);
    if (String(user.User_ID || 'PUBLIC') !== 'PUBLIC' && String(parent.Created_By || '') !== String(user.User_ID || '') && !internal) throw appError_('FORBIDDEN', 'This composite request is outside your requester scope.', false);
    return { request: compositeParentDto_(parent, compositeChildren_(rows)) };
  });
}

function transitionCompositeComponent_(command, correlationId) {
  return withScriptLock_(function() {
    var key = requireIdempotency_(command), replay = idempotencyReplay_(key); if (replay) return Object.assign({ idempotentReplay: true }, replay);
    var componentId = requireText_(command.componentId, 'componentId'), rows = compositeRowsForRequest_(command.requestId || ''), child = rows.find(function(row) { return String(row.Component_ID) === String(componentId); });
    if (!child) throw appError_('COMPONENT_NOT_FOUND', 'Composite section was not found.', false);
    var parent = compositeFindParent_(rows), user = requirePermission_('Can_Review', { committeeIds: [child.Owner_Committee_ID] }), next = compositeTransition_(child, command.action, command.reason), now = nowIso_();
    updateObject_(HAU_SHEETS.COMPOSITE_REQUESTS, child._row, { Lifecycle_Status: next.status, Attention_Flags_JSON: safeJson_(next.attentionFlags), Revision: Number(child.Revision || 1) + 1, Updated_At: now, Notes: next.reason || child.Notes || '' });
    var children = compositeChildren_(rows).map(function(row) { return row.Component_ID === child.Component_ID ? Object.assign({}, row, { Lifecycle_Status: next.status, Attention_Flags_JSON: safeJson_(next.attentionFlags), Revision: Number(child.Revision || 1) + 1 }) : row; });
    var derived = compositeSetParentProjection_(parent, children, now);
    history_('COMPOSITE_COMPONENT', componentId, child.Lifecycle_Status, next.status, user, command.reason || '', { requestId: child.Request_ID, idempotencyKey: key, metadata: { action: command.action } });
    audit_('TRANSITION_COMPOSITE_COMPONENT', 'COMPOSITE_COMPONENT', componentId, user, correlationId, { before: { status: child.Lifecycle_Status }, after: { status: next.status }, requestId: child.Request_ID, notes: command.reason || '' });
    return recordIdempotency_(key, { requestId: child.Request_ID, componentId: componentId, status: next.status, parentStatus: derived.status, entityType: 'COMPOSITE_COMPONENT', entityId: componentId }, user, correlationId);
  });
}

function cancelCompositeRequest_(command, correlationId) {
  return withScriptLock_(function() {
    var key = requireIdempotency_(command), replay = idempotencyReplay_(key); if (replay) return Object.assign({ idempotentReplay: true }, replay);
    var rows = compositeRowsForRequest_(requireText_(command.requestId, 'requestId')), parent = compositeFindParent_(rows), children = compositeChildren_(rows), user = requirePermission_('Can_Review'), now = nowIso_(); if (!parent) throw appError_('REQUEST_NOT_FOUND', 'Composite request was not found.', false);
    children.forEach(function(child) { if (HAU_COMPOSITE_TERMINAL_STATUSES_.indexOf(String(child.Lifecycle_Status)) < 0) { updateObject_(HAU_SHEETS.COMPOSITE_REQUESTS, child._row, { Lifecycle_Status: 'CANCELLED', Attention_Flags_JSON: safeJson_([]), Revision: Number(child.Revision || 1) + 1, Updated_At: now }); history_('COMPOSITE_COMPONENT', child.Component_ID, child.Lifecycle_Status, 'CANCELLED', user, command.reason || 'Composite request cancelled', { requestId: parent.Request_ID, idempotencyKey: key }); } });
    var refreshed = compositeRowsForRequest_(parent.Request_ID), derived = compositeSetParentProjection_(parent, compositeChildren_(refreshed), now); history_('COMPOSITE_REQUEST', parent.Request_ID, parent.Lifecycle_Status, derived.status, user, command.reason || 'Composite request cancelled', { idempotencyKey: key }); audit_('CANCEL_COMPOSITE_REQUEST', 'COMPOSITE_REQUEST', parent.Request_ID, user, correlationId, { after: { status: derived.status }, requestId: parent.Request_ID }); return recordIdempotency_(key, { requestId: parent.Request_ID, status: derived.status, entityType: 'COMPOSITE_REQUEST', entityId: parent.Request_ID }, user, correlationId);
  });
}

function reopenCompositeRequest_(command, correlationId) {
  return withScriptLock_(function() {
    var key = requireIdempotency_(command), replay = idempotencyReplay_(key); if (replay) return Object.assign({ idempotentReplay: true }, replay);
    var rows = compositeRowsForRequest_(requireText_(command.requestId, 'requestId')), parent = compositeFindParent_(rows), children = compositeChildren_(rows), user = requirePermission_('Can_Review'), now = nowIso_(); if (!parent) throw appError_('REQUEST_NOT_FOUND', 'Composite request was not found.', false); if (['REJECTED', 'CANCELLED'].indexOf(String(parent.Lifecycle_Status)) < 0) throw appError_('INVALID_TRANSITION', 'Only rejected or cancelled composite requests may be reopened.', false);
    children.forEach(function(child) { if (['REJECTED', 'CANCELLED'].indexOf(String(child.Lifecycle_Status)) >= 0) { updateObject_(HAU_SHEETS.COMPOSITE_REQUESTS, child._row, { Lifecycle_Status: 'FOR_REVIEW', Attention_Flags_JSON: safeJson_([]), Revision: Number(child.Revision || 1) + 1, Updated_At: now }); history_('COMPOSITE_COMPONENT', child.Component_ID, child.Lifecycle_Status, 'FOR_REVIEW', user, command.reason || 'Composite request reopened', { requestId: parent.Request_ID, idempotencyKey: key }); } });
    var refreshed = compositeRowsForRequest_(parent.Request_ID), derived = compositeSetParentProjection_(parent, compositeChildren_(refreshed), now); audit_('REOPEN_COMPOSITE_REQUEST', 'COMPOSITE_REQUEST', parent.Request_ID, user, correlationId, { after: { status: derived.status }, requestId: parent.Request_ID }); return recordIdempotency_(key, { requestId: parent.Request_ID, status: derived.status, entityType: 'COMPOSITE_REQUEST', entityId: parent.Request_ID }, user, correlationId);
  });
}

function amendCompositeRequest_(command, correlationId) {
  return withScriptLock_(function() {
    var key = requireIdempotency_(command), replay = idempotencyReplay_(key); if (replay) return Object.assign({ idempotentReplay: true }, replay);
    var rows = compositeRowsForRequest_(requireText_(command.requestId, 'requestId')), parent = compositeFindParent_(rows), child = compositeChildren_(rows).find(function(row) { return String(row.Component_ID) === String(command.componentId); }), user = requirePermission_('Can_Review'), now = nowIso_(); if (!parent || !child) throw appError_('COMPONENT_NOT_FOUND', 'Composite section was not found.', false); if (HAU_COMPOSITE_TERMINAL_STATUSES_.indexOf(String(child.Lifecycle_Status)) >= 0) throw appError_('AMENDMENT_NOT_ALLOWED', 'Completed, rejected, or cancelled sections cannot be amended directly.', false); var section = compositeSection_(Object.assign({}, command.section || {}, { type: child.Component_Type, label: (command.section || {}).label || child.Label, lines: (command.section || {}).lines || compositeParse_(child.Component_Payload_JSON, { lines: [] }).lines }), 0); if (!section) throw appError_('VALIDATION_ERROR', 'An amended section cannot be blank.', false);
    updateObject_(HAU_SHEETS.COMPOSITE_REQUESTS, child._row, { Label: section.label, Lifecycle_Status: 'FOR_REVIEW', Attention_Flags_JSON: safeJson_(['AMENDED']), Component_Payload_JSON: compositePayload_(section), Relationship_Version: Number(child.Relationship_Version || 1) + 1, Revision: Number(child.Revision || 1) + 1, Updated_At: now, Notes: section.notes });
    var refreshed = compositeRowsForRequest_(parent.Request_ID), derived = compositeSetParentProjection_(parent, compositeChildren_(refreshed), now); history_('COMPOSITE_COMPONENT', child.Component_ID, child.Lifecycle_Status, 'FOR_REVIEW', user, command.reason || 'Composite section amended', { requestId: parent.Request_ID, idempotencyKey: key }); audit_('AMEND_COMPOSITE_REQUEST', 'COMPOSITE_COMPONENT', child.Component_ID, user, correlationId, { after: { status: 'FOR_REVIEW', relationshipVersion: Number(child.Relationship_Version || 1) + 1 }, requestId: parent.Request_ID }); return recordIdempotency_(key, { requestId: parent.Request_ID, componentId: child.Component_ID, status: 'FOR_REVIEW', parentStatus: derived.status, entityType: 'COMPOSITE_COMPONENT', entityId: child.Component_ID }, user, correlationId);
  });
}

function addCompositeSection_(command, correlationId) {
  return withScriptLock_(function() {
    var key = requireIdempotency_(command), replay = idempotencyReplay_(key); if (replay) return Object.assign({ idempotentReplay: true }, replay);
    var rows = compositeRowsForRequest_(requireText_(command.requestId, 'requestId')), parent = compositeFindParent_(rows), user = requirePermission_('Can_Review'), section = compositeSection_(command.section || {}, 0), now = nowIso_(); if (!parent) throw appError_('REQUEST_NOT_FOUND', 'Composite request was not found.', false); if (compositeChildren_(rows).some(function(row) { return String(row.Component_Type) === section.type; })) throw appError_('DUPLICATE_COMPONENT', 'That composite section already exists.', false); if (['COMPLETED', 'CANCELLED'].indexOf(String(parent.Lifecycle_Status)) >= 0) throw appError_('AMENDMENT_NOT_ALLOWED', 'A completed or cancelled composite request cannot receive a new section.', false);
    var componentId = allocateId_('CMP'); appendObject_(HAU_SHEETS.COMPOSITE_REQUESTS, { Record_ID: componentId, Record_Type: 'COMPONENT', Request_ID: parent.Request_ID, Component_ID: componentId, Relationship_Type: 'COMPOSITE_CHILD', Relationship_Version: 1, Component_Type: section.type, Label: section.label, Requester_Name: '', Requester_Email: '', Department: '', Event_Series_ID: '', Event_ID: parent.Event_ID, Event_Name: '', Event_Start_At: '', Event_End_At: '', Priority: parent.Priority, Purpose: '', Component_Payload_JSON: compositePayload_(section), Lifecycle_Status: 'FOR_REVIEW', Owner_Committee_ID: HAU_COMPOSITE_COMMITTEES_[section.type], Owner_User_ID: '', Due_At: parent.Due_At, Attention_Flags_JSON: safeJson_([]), Progress_JSON: safeJson_({ lineCount: section.lines.length, duplicateCount: section.lines.reduce(function(sum, line) { return sum + Number(line.duplicateCount || 0); }, 0) }), Revision: 1, Created_At: now, Updated_At: now, Created_By: user.User_ID || 'SYSTEM', Client_Request_ID: '', Client_Component_ID: compositeNormalizeText_(command.section.clientComponentId, 'clientComponentId', false, 120), Idempotency_Key: key, Archived_At: '', Notes: section.notes });
    var refreshed = compositeRowsForRequest_(parent.Request_ID), derived = compositeSetParentProjection_(parent, compositeChildren_(refreshed), now); history_('COMPOSITE_COMPONENT', componentId, '', 'FOR_REVIEW', user, command.reason || 'Composite section added', { requestId: parent.Request_ID, idempotencyKey: key }); audit_('ADD_COMPOSITE_SECTION', 'COMPOSITE_COMPONENT', componentId, user, correlationId, { after: { requestId: parent.Request_ID, componentId: componentId }, requestId: parent.Request_ID }); return recordIdempotency_(key, { requestId: parent.Request_ID, componentId: componentId, status: 'FOR_REVIEW', parentStatus: derived.status, entityType: 'COMPOSITE_COMPONENT', entityId: componentId }, user, correlationId);
  });
}

function assignCompositeComponent_(command, correlationId) {
  return withScriptLock_(function() {
    var key = requireIdempotency_(command), replay = idempotencyReplay_(key); if (replay) return Object.assign({ idempotentReplay: true }, replay);
    var componentId = requireText_(command.componentId, 'componentId'), rows = compositeRowsForRequest_(command.requestId || ''), child = compositeChildren_(rows).find(function(row) { return String(row.Component_ID) === String(componentId); }), committeeId = requireText_(command.committeeId || (child && child.Owner_Committee_ID), 'committeeId'), user = requirePermission_('Can_Review'), assignee = compositeNormalizeText_(command.userId, 'userId', false, 120), now = nowIso_(); if (!child) throw appError_('COMPONENT_NOT_FOUND', 'Composite section was not found.', false); if (committeeId !== child.Owner_Committee_ID) throw appError_('ASSIGNMENT_SCOPE_INVALID', 'A composite section must remain with its canonical committee.', false); if (assignee) { var target = findOne_(HAU_SHEETS.USERS, 'User_ID', assignee); if (!target || !accessRowEligible_(target)) throw appError_('ASSIGNEE_INVALID', 'The selected assignee is not active.', false); }
    updateObject_(HAU_SHEETS.COMPOSITE_REQUESTS, child._row, { Owner_User_ID: assignee, Updated_At: now, Revision: Number(child.Revision || 1) + 1 }); audit_('ASSIGN_COMPOSITE_COMPONENT', 'COMPOSITE_COMPONENT', componentId, user, correlationId, { after: { committeeId: committeeId, userId: assignee }, requestId: child.Request_ID }); return recordIdempotency_(key, { requestId: child.Request_ID, componentId: componentId, committeeId: committeeId, userId: assignee, entityType: 'COMPOSITE_COMPONENT', entityId: componentId }, user, correlationId);
  });
}

function escalateCompositeComponent_(command, correlationId) {
  return withScriptLock_(function() {
    var key = requireIdempotency_(command), replay = idempotencyReplay_(key); if (replay) return Object.assign({ idempotentReplay: true }, replay);
    var componentId = requireText_(command.componentId, 'componentId'), rows = compositeRowsForRequest_(command.requestId || ''), child = compositeChildren_(rows).find(function(row) { return String(row.Component_ID) === String(componentId); }), user = requirePermission_('Can_Review'), now = nowIso_(); if (!child) throw appError_('COMPONENT_NOT_FOUND', 'Composite section was not found.', false); var flags = compositeParse_(child.Attention_Flags_JSON, []); if (flags.indexOf('ESCALATED') < 0) flags.push('ESCALATED'); updateObject_(HAU_SHEETS.COMPOSITE_REQUESTS, child._row, { Attention_Flags_JSON: safeJson_(flags), Updated_At: now, Revision: Number(child.Revision || 1) + 1, Notes: compositeNormalizeText_(command.reason, 'reason', true, 500) }); audit_('ESCALATE_COMPOSITE_COMPONENT', 'COMPOSITE_COMPONENT', componentId, user, correlationId, { after: { attentionFlags: flags }, requestId: child.Request_ID }); return recordIdempotency_(key, { requestId: child.Request_ID, componentId: componentId, attentionFlags: flags, entityType: 'COMPOSITE_COMPONENT', entityId: componentId }, user, correlationId);
  });
}
