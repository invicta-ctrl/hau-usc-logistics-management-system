var HAU_VENUE_EQUIPMENT_REFERENCE_TYPES_ = ['VENUE', 'EQUIPMENT'];
var HAU_VENUE_EQUIPMENT_CATEGORIES_ = ['MEETING_SPACE', 'EVENT_SPACE', 'AUDIO_VISUAL', 'FURNITURE', 'LOGISTICS_SUPPORT', 'OTHER_CONTROLLED'];
var HAU_VENUE_EQUIPMENT_UNITS_ = ['service', 'piece', 'set', 'unit'];
var HAU_VENUE_EQUIPMENT_CONFIRMATION_STATUSES_ = ['PENDING_CONFIRMATION', 'CONFIRMED', 'DECLINED'];
var HAU_VENUE_EQUIPMENT_TRIAGE_STATUSES_ = ['NOT_REQUIRED', 'PENDING_CLASSIFICATION', 'APPROVED_AS_SPECIFIED'];
var HAU_VENUE_EQUIPMENT_BLOCKER_STATUSES_ = ['NONE', 'BLOCKED'];
var HAU_VENUE_EQUIPMENT_RETURN_STATUSES_ = ['NOT_REQUIRED', 'PENDING_RETURN', 'RETURNED'];
var HAU_VENUE_EQUIPMENT_OWNER_COMMITTEES_ = ['COM_FOOD', 'COM_INVENTORY_PANTRY', 'COM_MATERIALS'];

function venueEquipmentRequestsEnabled_() { return resolveVenueEquipmentRequestsEnabled_(); }
function venueEquipmentControlled_(value, allowed, field, lower) {
  var normalized = String(value == null ? '' : value).trim();
  normalized = lower ? normalized.toLowerCase() : normalized.toUpperCase();
  if (allowed.indexOf(normalized) < 0) throw appError_('VALIDATION_ERROR', field + ' is not supported.', false, { field: field });
  return normalized;
}
function venueEquipmentInteger_(value, field) {
  var number = Number(value);
  if (!isFinite(number) || Math.floor(number) !== number || number < 1) throw appError_('VALIDATION_ERROR', field + ' must be a positive integer.', false, { field: field });
  return number;
}
function venueEquipmentDate_(value, field) {
  var normalized = compositeNormalizeText_(value, field, false, 10);
  if (normalized && (!/^\d{4}-\d{2}-\d{2}$/.test(normalized) || isNaN(new Date(normalized + 'T00:00:00Z').getTime()))) throw appError_('VALIDATION_ERROR', field + ' must be a valid ISO date.', false, { field: field });
  return normalized;
}
function venueEquipmentIso_(value, field, required) {
  var normalized = compositeNormalizeText_(value, field, required, 80);
  if (normalized && (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(normalized) || isNaN(new Date(normalized).getTime()))) throw appError_('VALIDATION_ERROR', field + ' must be a valid ISO date-time.', false, { field: field });
  return normalized;
}
function venueEquipmentActiveAt_(row, at) {
  var date = String(at || '').slice(0, 10), from = venueEquipmentDate_(row.Effective_From || row.effectiveFrom, 'effectiveFrom'), to = venueEquipmentDate_(row.Effective_To || row.effectiveTo, 'effectiveTo');
  return (!from || date >= from) && (!to || date <= to);
}
function venueEquipmentSearchToken_(value) {
  return String(value == null ? '' : value).normalize('NFKC').trim().toLowerCase().replace(/\s+/g, ' ');
}
function venueEquipmentAliases_(row) {
  var parsed = compositeParse_(row.Aliases_JSON || row.aliases, []);
  if (!Array.isArray(parsed)) throw appError_('VENUE_EQUIPMENT_ALIASES_INVALID', 'Reference aliases must be a JSON array.', false);
  return parsed.map(function(alias) { return compositeNormalizeText_(alias, 'reference.alias', false, 120); }).filter(Boolean);
}
function venueEquipmentReferenceRows_() { return readObjects_(HAU_SHEETS.VENUE_EQUIPMENT_REFERENCES); }
function venueEquipmentRouteRows_() { return readObjects_(HAU_SHEETS.VENUE_EQUIPMENT_ROUTES); }
function venueEquipmentEffectiveRows_(rows, at) {
  return rows.filter(function(row) { return String(row.Status || '').trim().toUpperCase() === 'ACTIVE' && venueEquipmentActiveAt_(row, at); });
}
function venueEquipmentReferenceById_(referenceId, at) {
  var matches = venueEquipmentReferenceRows_().filter(function(row) { return String(row.Reference_ID) === String(referenceId) && !row.Archived_At; });
  if (!matches.length) return null;
  var effective = venueEquipmentEffectiveRows_(matches, at);
  if (effective.length > 1) throw appError_('VENUE_EQUIPMENT_REFERENCE_CONFLICT', 'A reference ID has overlapping active effective revisions.', false);
  return effective[0] || matches[0];
}
function venueEquipmentRouteById_(routeId, at) {
  var matches = venueEquipmentRouteRows_().filter(function(row) { return String(row.Route_ID) === String(routeId) && !row.Archived_At; });
  if (!matches.length) return null;
  var effective = venueEquipmentEffectiveRows_(matches, at);
  if (effective.length > 1) throw appError_('VENUE_EQUIPMENT_ROUTE_CONFLICT', 'A route ID has overlapping active effective revisions.', false);
  return effective[0] || matches[0];
}
function venueEquipmentOtherRoute_(at) {
  var matches = venueEquipmentRouteRows_().filter(function(row) { return String(row.Match_Kind || '').trim().toUpperCase() === 'OTHER' && !row.Archived_At && String(row.Status || '').trim().toUpperCase() === 'ACTIVE' && venueEquipmentActiveAt_(row, at); });
  if (matches.length !== 1) throw appError_('VENUE_EQUIPMENT_ROUTE_CONFLICT', 'Controlled Other must resolve to exactly one active approved route.', false);
  return matches[0];
}
function venueEquipmentRouteSnapshot_(row, context) {
  if (!row) throw appError_('VENUE_EQUIPMENT_ROUTE_NOT_FOUND', 'No approved route exists for this reference.', false);
  if (String(row.Status || '').trim().toUpperCase() !== 'ACTIVE' || !venueEquipmentActiveAt_(row, context.at)) throw appError_('VENUE_EQUIPMENT_ROUTE_INACTIVE', 'The approved route is not active or effective.', false);
  var matchKind = venueEquipmentControlled_(row.Match_Kind, ['REFERENCE', 'CATEGORY', 'OTHER'], 'route.matchKind', false);
  if (matchKind === 'REFERENCE' && String(row.Reference_ID || '') !== String(context.referenceId || '')) throw appError_('VENUE_EQUIPMENT_ROUTE_MISMATCH', 'The reference route does not match the selected reference.', false);
  if (matchKind === 'CATEGORY' && (String(row.Reference_Type || '').trim().toUpperCase() !== context.referenceType || String(row.Category_ID || '').trim().toUpperCase() !== context.category)) throw appError_('VENUE_EQUIPMENT_ROUTE_MISMATCH', 'The category route does not match the selected reference.', false);
  if (matchKind === 'OTHER' && context.category !== 'OTHER_CONTROLLED') throw appError_('VENUE_EQUIPMENT_ROUTE_MISMATCH', 'The Other route is limited to controlled Other lines.', false);
  var committeeId = compositeNormalizeText_(row.Owner_Committee_ID, 'route.ownerCommitteeId', true, 80);
  if (HAU_VENUE_EQUIPMENT_OWNER_COMMITTEES_.indexOf(committeeId) < 0) throw appError_('VENUE_EQUIPMENT_ROUTE_SCOPE_INVALID', 'Venue and Equipment routing must target an approved existing committee.', false);
  return {
    routeId: compositeNormalizeText_(row.Route_ID, 'route.routeId', true, 100), routeRevision: venueEquipmentInteger_(row.Revision, 'route.revision'), matchKind: matchKind,
    ownerCommitteeId: committeeId, ownerUserId: compositeNormalizeText_(row.Owner_User_ID, 'route.ownerUserId', false, 100),
    responsibleOfficeId: compositeNormalizeText_(row.Responsible_Office_ID, 'route.responsibleOfficeId', true, 100), approvingAuthorityId: compositeNormalizeText_(row.Approving_Authority_ID, 'route.approvingAuthorityId', true, 100),
    leadTimeBusinessDays: venueEquipmentInteger_(row.Lead_Time_Business_Days, 'route.leadTimeBusinessDays'), instructions: compositeNormalizeText_(row.Instructions, 'route.instructions', true, 500),
    effectiveFrom: venueEquipmentDate_(row.Effective_From, 'route.effectiveFrom'), effectiveTo: venueEquipmentDate_(row.Effective_To, 'route.effectiveTo')
  };
}
function venueEquipmentReferenceSnapshot_(line, submittedAt, existingSnapshot) {
  var row = venueEquipmentReferenceById_(line.referenceId, submittedAt);
  if (!row) throw appError_('VENUE_EQUIPMENT_REFERENCE_NOT_FOUND', 'The selected reference was not found.', false);
  if (String(row.Status || '').trim().toUpperCase() !== 'ACTIVE' || !venueEquipmentActiveAt_(row, submittedAt)) throw appError_('VENUE_EQUIPMENT_REFERENCE_INACTIVE', 'The selected reference is not active or effective.', false);
  if (String(row.Requestability || '').trim().toUpperCase() !== 'REQUESTABLE') throw appError_('VENUE_EQUIPMENT_NOT_REQUESTABLE', 'The selected reference is not currently requestable. This is not a booking availability result.', false);
  var type = venueEquipmentControlled_(row.Reference_Type, HAU_VENUE_EQUIPMENT_REFERENCE_TYPES_, 'reference.type', false), category = venueEquipmentControlled_(row.Category_ID, HAU_VENUE_EQUIPMENT_CATEGORIES_, 'reference.category', false), name = compositeNormalizeText_(row.Display_Name, 'reference.name', true), unit = venueEquipmentControlled_(row.Unit, HAU_VENUE_EQUIPMENT_UNITS_, 'reference.unit', true), revision = venueEquipmentInteger_(row.Revision, 'reference.revision');
  if (line.referenceRevision != null && Number(line.referenceRevision) !== revision) throw appError_('VENUE_EQUIPMENT_REFERENCE_REVISION_CONFLICT', 'The selected reference changed; refresh before submitting.', true);
  if (String(line.label).toLowerCase() !== name.toLowerCase()) throw appError_('VENUE_EQUIPMENT_REFERENCE_NAME_MISMATCH', 'Use the current canonical reference name.', false);
  if (line.unit !== unit) throw appError_('VENUE_EQUIPMENT_UNIT_MISMATCH', 'The selected reference requires unit ' + unit + '.', false);
  if (line.category !== category) throw appError_('VENUE_EQUIPMENT_CATEGORY_MISMATCH', 'The selected reference category changed.', false);
  var route = venueEquipmentRouteSnapshot_(venueEquipmentRouteById_(row.Route_ID, submittedAt), { at: submittedAt, referenceType: type, category: category, referenceId: line.referenceId });
  var preserved = existingSnapshot && String(existingSnapshot.referenceId) === String(line.referenceId) && Number(existingSnapshot.referenceRevision) === revision && String(existingSnapshot.routeId) === route.routeId && Number(existingSnapshot.routeRevision) === route.routeRevision;
  return Object.assign({ referenceId: line.referenceId, referenceRevision: revision, referenceType: type, category: category, name: name, aliases: venueEquipmentAliases_(row), location: compositeNormalizeText_(row.Location_Label, 'reference.location', false, 160), unit: unit, requestedQuantity: Number(line.quantity), requestability: 'REQUESTABLE', requestabilityLabel: 'Requestable - confirmation required; not a booking guarantee', returnRequired: type === 'EQUIPMENT' && String(row.Return_Required).trim().toUpperCase() === 'TRUE', contactRole: preserved ? existingSnapshot.contactRole : compositeNormalizeText_(row.Contact_Role, 'reference.contactRole', false, 120), sourceRevision: preserved ? existingSnapshot.sourceRevision : compositeNormalizeText_(row.Source_Revision, 'reference.sourceRevision', false, 120) }, route);
}
function venueEquipmentOtherSnapshot_(line, submittedAt) {
  if (line.category !== 'OTHER_CONTROLLED') throw appError_('VENUE_EQUIPMENT_REFERENCE_REQUIRED', 'Select an approved reference or use constrained Other.', false);
  if (line.label.length < 5 || venueEquipmentSearchToken_(line.label) === 'other') throw appError_('VALIDATION_ERROR', 'Other requires a specific description.', false, { field: 'line.label' });
  var route = venueEquipmentRouteSnapshot_(venueEquipmentOtherRoute_(submittedAt), { at: submittedAt, referenceType: 'OTHER', category: 'OTHER_CONTROLLED', referenceId: '' });
  return Object.assign({ referenceId: '', referenceRevision: 1, referenceType: 'OTHER', category: 'OTHER_CONTROLLED', name: line.label, aliases: [], location: '', unit: line.unit, requestedQuantity: Number(line.quantity), requestability: 'PENDING_CLASSIFICATION', requestabilityLabel: 'Pending classification - no booking or stock promise', returnRequired: false, contactRole: '', sourceRevision: '' }, route);
}
function venueEquipmentBusinessDays_(fromValue, toValue) {
  var from = new Date(fromValue), to = new Date(toValue); if (isNaN(from.getTime()) || isNaN(to.getTime()) || to <= from) return 0;
  var cursor = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate())), end = new Date(Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate())), count = 0;
  while (cursor < end) { cursor.setUTCDate(cursor.getUTCDate() + 1); if (cursor.getUTCDay() !== 0 && cursor.getUTCDay() !== 6) count += 1; }
  return count;
}
function venueEquipmentDetails_(raw, lines, context) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw appError_('VALIDATION_ERROR', 'Venue and Equipment workflow details are required.', false, { field: 'venueEquipment' });
  context = context || {}; var submittedAt = context.submittedAt || nowIso_(), scheduleStartAt = venueEquipmentIso_(raw.scheduleStartAt || context.eventStartAt, 'venueEquipment.scheduleStartAt', true), scheduleEndAt = venueEquipmentIso_(raw.scheduleEndAt || context.eventEndAt, 'venueEquipment.scheduleEndAt', false);
  if (scheduleEndAt && new Date(scheduleEndAt).getTime() <= new Date(scheduleStartAt).getTime()) throw appError_('VALIDATION_ERROR', 'Schedule end must be after schedule start.', false, { field: 'venueEquipment.scheduleEndAt' });
  var existing = context.existingVenueEquipment || null, remaining = existing && Array.isArray(existing.referenceSnapshots) ? existing.referenceSnapshots.slice() : [];
  var normalizedLines = (lines || []).map(function(line, index) {
    var normalized = Object.assign({}, line, { unit: venueEquipmentControlled_(line.unit, HAU_VENUE_EQUIPMENT_UNITS_, 'lines[' + index + '].unit', true), category: venueEquipmentControlled_(line.category, HAU_VENUE_EQUIPMENT_CATEGORIES_, 'lines[' + index + '].category', false) });
    var priorIndex = remaining.findIndex(function(snapshot) { return String(snapshot.referenceId) === String(normalized.referenceId) && String(snapshot.name || '').toLowerCase() === String(normalized.label).toLowerCase() && String(snapshot.unit) === normalized.unit; });
    var prior = priorIndex >= 0 ? remaining.splice(priorIndex, 1)[0] : null;
    return Object.assign({}, normalized, { referenceSnapshot: normalized.referenceId ? venueEquipmentReferenceSnapshot_(normalized, submittedAt, prior) : venueEquipmentOtherSnapshot_(normalized, submittedAt) });
  });
  if (!normalizedLines.length) throw appError_('VALIDATION_ERROR', 'Venue and Equipment needs at least one line.', false, { field: 'venueEquipment.lines' });
  var snapshots = normalizedLines.map(function(line) { return line.referenceSnapshot; }), owners = [];
  snapshots.forEach(function(snapshot) { if (owners.indexOf(snapshot.ownerCommitteeId) < 0) owners.push(snapshot.ownerCommitteeId); });
  if (owners.length !== 1) throw appError_('VENUE_EQUIPMENT_ROUTE_CONFLICT', 'Selected references resolve to different committee routes. Submit one approved route per section.', false);
  var hasOther = snapshots.some(function(snapshot) { return snapshot.referenceType === 'OTHER'; }), returnRequired = snapshots.some(function(snapshot) { return snapshot.returnRequired; }), requiredLeadTime = Math.max.apply(null, snapshots.map(function(snapshot) { return snapshot.leadTimeBusinessDays; })), history = existing && Array.isArray(existing.provenanceHistory) ? existing.provenanceHistory.slice() : [];
  if (existing && JSON.stringify(existing.referenceSnapshots || []) !== JSON.stringify(snapshots)) history.push({ version: Number(existing.version || 1), referenceSnapshots: existing.referenceSnapshots || [] });
  return { version: 1, purposeDetail: compositeNormalizeText_(raw.purposeDetail, 'venueEquipment.purposeDetail', true, 500), scheduleStartAt: scheduleStartAt, scheduleEndAt: scheduleEndAt, ownerCommitteeId: owners[0], ownerUserId: snapshots.every(function(snapshot) { return String(snapshot.ownerUserId || '') === String(snapshots[0].ownerUserId || ''); }) ? snapshots[0].ownerUserId : '', leadTimeStatus: venueEquipmentBusinessDays_(submittedAt, scheduleStartAt) >= requiredLeadTime ? 'MET' : 'SHORT', confirmationStatus: existing ? existing.confirmationStatus : 'PENDING_CONFIRMATION', confirmationReference: existing ? existing.confirmationReference : '', otherTriageStatus: hasOther ? existing && existing.otherTriageStatus === 'APPROVED_AS_SPECIFIED' ? 'APPROVED_AS_SPECIFIED' : 'PENDING_CLASSIFICATION' : 'NOT_REQUIRED', otherTriageReason: hasOther && existing ? existing.otherTriageReason || '' : '', blockerStatus: existing ? existing.blockerStatus : 'NONE', blockerReason: existing ? existing.blockerReason : '', returnRequired: returnRequired, returnStatus: returnRequired ? existing && existing.returnStatus === 'RETURNED' ? 'RETURNED' : 'PENDING_RETURN' : 'NOT_REQUIRED', fulfillmentEvidenceId: existing ? existing.fulfillmentEvidenceId : '', referenceSnapshots: snapshots, provenanceHistory: history, lines: normalizedLines.map(function(line) { var copy = Object.assign({}, line); delete copy.referenceSnapshot; return copy; }) };
}
function venueEquipmentAttentionFlags_(details) {
  var flags = [];
  if (details.confirmationStatus !== 'CONFIRMED') flags.push('VENUE_EQUIPMENT_CONFIRMATION_PENDING');
  if (details.otherTriageStatus === 'PENDING_CLASSIFICATION') flags.push('VENUE_EQUIPMENT_OTHER_TRIAGE_PENDING');
  if (details.blockerStatus === 'BLOCKED') flags.push('VENUE_EQUIPMENT_BLOCKED');
  if (details.returnStatus === 'PENDING_RETURN') flags.push('VENUE_EQUIPMENT_RETURN_PENDING');
  if (!details.fulfillmentEvidenceId) flags.push('VENUE_EQUIPMENT_EVIDENCE_MISSING');
  if (details.leadTimeStatus === 'SHORT') flags.push('VENUE_EQUIPMENT_LEAD_TIME_SHORT');
  return flags;
}
function venueEquipmentUpdate_(current, patch) {
  if (!current || Number(current.version) !== 1) throw appError_('VENUE_EQUIPMENT_WORKFLOW_VERSION_UNSUPPORTED', 'Venue and Equipment workflow version is unsupported.', false);
  patch = patch || {}; var next = Object.assign({}, current);
  if (patch.confirmationStatus != null) next.confirmationStatus = venueEquipmentControlled_(patch.confirmationStatus, HAU_VENUE_EQUIPMENT_CONFIRMATION_STATUSES_, 'confirmationStatus', false);
  if (patch.confirmationReference != null) next.confirmationReference = compositeNormalizeText_(patch.confirmationReference, 'confirmationReference', false, 120);
  if (next.confirmationStatus === 'CONFIRMED' && !next.confirmationReference) throw appError_('VALIDATION_ERROR', 'Confirmed routing requires a confirmation reference.', false, { field: 'confirmationReference' });
  if (patch.otherTriageStatus != null) next.otherTriageStatus = venueEquipmentControlled_(patch.otherTriageStatus, HAU_VENUE_EQUIPMENT_TRIAGE_STATUSES_, 'otherTriageStatus', false);
  if (patch.otherTriageReason != null) next.otherTriageReason = compositeNormalizeText_(patch.otherTriageReason, 'otherTriageReason', false, 500);
  if (current.otherTriageStatus === 'NOT_REQUIRED' && next.otherTriageStatus !== 'NOT_REQUIRED') throw appError_('VALIDATION_ERROR', 'Other triage is not applicable to this child.', false, { field: 'otherTriageStatus' });
  if (current.otherTriageStatus !== 'NOT_REQUIRED' && next.otherTriageStatus === 'NOT_REQUIRED') throw appError_('VALIDATION_ERROR', 'Other lines require an authorized triage disposition.', false, { field: 'otherTriageStatus' });
  if (next.otherTriageStatus === 'APPROVED_AS_SPECIFIED' && !next.otherTriageReason) throw appError_('VALIDATION_ERROR', 'Approved Other lines require a recorded disposition.', false, { field: 'otherTriageReason' });
  if (patch.blockerStatus != null) next.blockerStatus = venueEquipmentControlled_(patch.blockerStatus, HAU_VENUE_EQUIPMENT_BLOCKER_STATUSES_, 'blockerStatus', false);
  if (patch.blockerReason != null) next.blockerReason = compositeNormalizeText_(patch.blockerReason, 'blockerReason', false, 500);
  if (next.blockerStatus === 'BLOCKED' && !next.blockerReason) throw appError_('VALIDATION_ERROR', 'A blocker reason is required.', false, { field: 'blockerReason' });
  if (next.blockerStatus === 'NONE') next.blockerReason = '';
  if (patch.returnStatus != null) next.returnStatus = venueEquipmentControlled_(patch.returnStatus, HAU_VENUE_EQUIPMENT_RETURN_STATUSES_, 'returnStatus', false);
  if (!current.returnRequired && next.returnStatus !== 'NOT_REQUIRED') throw appError_('VALIDATION_ERROR', 'Return status is not applicable to this child.', false, { field: 'returnStatus' });
  if (current.returnRequired && next.returnStatus === 'NOT_REQUIRED') throw appError_('VALIDATION_ERROR', 'Equipment return obligations cannot be removed.', false, { field: 'returnStatus' });
  if (patch.fulfillmentEvidenceId != null) next.fulfillmentEvidenceId = compositeNormalizeText_(patch.fulfillmentEvidenceId, 'fulfillmentEvidenceId', false, 120);
  return next;
}
function venueEquipmentEvidenceUploaded_(evidenceId, componentId) {
  if (!evidenceId) return false;
  return findAll_(HAU_SHEETS.EVIDENCE, function(row) { return String(row.Evidence_ID) === String(evidenceId) && String(row.Evidence_Type) === 'VENUE_EQUIPMENT_CONFIRMATION' && String(row.Related_Entity_Type) === 'COMPOSITE_COMPONENT' && String(row.Related_Entity_ID) === String(componentId) && String(row.Upload_Status) === 'UPLOADED'; }).length === 1;
}
function venueEquipmentAssertTransition_(child, action) {
  if (String(child.Component_Type) !== 'VENUE_EQUIPMENT') return;
  var details = compositeParse_(child.Component_Payload_JSON, {}).venueEquipment, normalized = String(action || '').trim().toUpperCase();
  if (!details) return;
  if (['READY_FOR_HANDOFF', 'COMPLETE'].indexOf(normalized) >= 0 && details.confirmationStatus !== 'CONFIRMED') throw appError_('VENUE_EQUIPMENT_CONFIRMATION_REQUIRED', 'Record approved confirmation before handoff.', false);
  if (['READY_FOR_HANDOFF', 'COMPLETE'].indexOf(normalized) >= 0 && details.otherTriageStatus === 'PENDING_CLASSIFICATION') throw appError_('VENUE_EQUIPMENT_OTHER_TRIAGE_REQUIRED', 'Resolve controlled Other lines before handoff.', false);
  if (['READY_FOR_HANDOFF', 'COMPLETE'].indexOf(normalized) >= 0 && details.blockerStatus === 'BLOCKED') throw appError_('VENUE_EQUIPMENT_BLOCKED', 'Resolve the blocker before handoff.', false);
  if (normalized === 'COMPLETE' && details.returnRequired && details.returnStatus !== 'RETURNED') throw appError_('VENUE_EQUIPMENT_RETURN_REQUIRED', 'Resolve all equipment return obligations before completion.', false);
  if (normalized === 'COMPLETE' && !venueEquipmentEvidenceUploaded_(details.fulfillmentEvidenceId, child.Component_ID)) throw appError_('VENUE_EQUIPMENT_EVIDENCE_REQUIRED', 'Uploaded component confirmation evidence is required before completion.', false);
}
function searchVenueEquipmentReferences_(command) {
  if (!venueEquipmentRequestsEnabled_()) throw appError_('FEATURE_DISABLED', 'Venue and Equipment request specialization is not enabled.', false, { feature: 'HAU_VENUE_EQUIPMENT_REQUESTS_ENABLED' });
  command = command || {}; var at = nowIso_(), aliases = {}, groups = {}, safe = [];
  venueEquipmentReferenceRows_().forEach(function(row) {
    if (row.Archived_At) return; var id = compositeNormalizeText_(row.Reference_ID, 'reference.id', true, 100);
    if (!groups[id]) groups[id] = []; groups[id].push(row);
  });
  Object.keys(groups).forEach(function(id) {
    var effective = venueEquipmentEffectiveRows_(groups[id], at);
    if (effective.length > 1) throw appError_('VENUE_EQUIPMENT_REFERENCE_CONFLICT', 'A reference ID has overlapping active effective revisions.', false);
    if (!effective.length) return;
    var row = effective[0];
    var type = venueEquipmentControlled_(row.Reference_Type, HAU_VENUE_EQUIPMENT_REFERENCE_TYPES_, 'reference.type', false), category = venueEquipmentControlled_(row.Category_ID, HAU_VENUE_EQUIPMENT_CATEGORIES_, 'reference.category', false), name = compositeNormalizeText_(row.Display_Name, 'reference.name', true), rowAliases = venueEquipmentAliases_(row);
    [name].concat(rowAliases).forEach(function(alias) { var token = venueEquipmentSearchToken_(alias); if (aliases[token] && aliases[token] !== id) throw appError_('VENUE_EQUIPMENT_ALIAS_CONFLICT', 'Active reference names and aliases must be unique.', false); aliases[token] = id; });
    if (String(row.Requestability || '').trim().toUpperCase() !== 'REQUESTABLE') return;
    var route = venueEquipmentRouteSnapshot_(venueEquipmentRouteById_(row.Route_ID, at), { at: at, referenceType: type, category: category, referenceId: id });
    safe.push({ id: id, type: type, category: category, name: name, aliases: rowAliases, location: compositeNormalizeText_(row.Location_Label, 'reference.location', false, 160), unit: venueEquipmentControlled_(row.Unit, HAU_VENUE_EQUIPMENT_UNITS_, 'reference.unit', true), referenceRevision: venueEquipmentInteger_(row.Revision, 'reference.revision'), requestability: 'REQUESTABLE', requestabilityLabel: 'Requestable - confirmation required; not a booking guarantee', leadTimeBusinessDays: route.leadTimeBusinessDays, responsibleOfficeId: route.responsibleOfficeId, approvingAuthorityId: route.approvingAuthorityId, instructions: route.instructions });
  });
  var query = venueEquipmentSearchToken_(command.query), typeFilter = String(command.type || '').trim().toUpperCase(), categoryFilter = String(command.category || '').trim().toUpperCase(), limit = Math.min(Math.max(Number(command.limit) || 20, 1), 50);
  return safe.filter(function(reference) { var haystack = venueEquipmentSearchToken_([reference.id, reference.name].concat(reference.aliases, [reference.category, reference.location]).join(' ')); return (!query || haystack.indexOf(query) >= 0) && (!typeFilter || reference.type === typeFilter) && (!categoryFilter || reference.category === categoryFilter); }).sort(function(left, right) { return [left.type, left.category, left.name].join('|').localeCompare([right.type, right.category, right.name].join('|')); }).slice(0, limit);
}
function venueEquipmentQueueItem_(parent, child) {
  var payload = compositeParse_(child.Component_Payload_JSON, {});
  return { requestId: parent.Request_ID, componentId: child.Component_ID, status: child.Lifecycle_Status, ownerCommitteeId: child.Owner_Committee_ID, ownerUserId: child.Owner_User_ID || '', dueAt: child.Due_At || '', revision: Number(child.Revision || 1), parent: { eventId: parent.Event_ID || '', eventName: parent.Event_Name || '', eventStartAt: parent.Event_Start_At || '', eventEndAt: parent.Event_End_At || '', priority: parent.Priority || 'ROUTINE', purpose: parent.Purpose || '', department: parent.Department || '' }, venueEquipment: payload.venueEquipment, lines: payload.lines || [], attentionFlags: compositeParse_(child.Attention_Flags_JSON, []) };
}
function getVenueEquipmentWorkQueue_(command) {
  return withRequestReadCache_(function() {
    var committeeId = compositeNormalizeText_(command && command.committeeId, 'committeeId', true, 80);
    if (HAU_VENUE_EQUIPMENT_OWNER_COMMITTEES_.indexOf(committeeId) < 0) throw appError_('VENUE_EQUIPMENT_QUEUE_SCOPE_INVALID', 'Select one approved existing committee queue.', false);
    requirePermission_('Can_Review', { committeeIds: [committeeId] });
    var children = findAll_(HAU_SHEETS.COMPOSITE_REQUESTS, function(row) { return String(row.Record_Type) === 'COMPONENT' && String(row.Component_Type) === 'VENUE_EQUIPMENT' && String(row.Owner_Committee_ID) === committeeId && !row.Archived_At; });
    return { committeeId: committeeId, items: children.slice(0, 100).map(function(child) { return venueEquipmentQueueItem_(compositeFindParent_(compositeRowsForRequest_(child.Request_ID)), child); }), truncated: children.length > 100 };
  });
}
function updateVenueEquipmentComponent_(command, correlationId) {
  return withScriptLock_(function() {
    var key = requireIdempotency_(command), replay = idempotencyReplay_(key); if (replay) return Object.assign({ idempotentReplay: true }, replay);
    var rows = compositeRowsForRequest_(requireText_(command.requestId, 'requestId')), parent = compositeFindParent_(rows), child = compositeChildren_(rows).find(function(row) { return String(row.Component_ID) === String(command.componentId) && String(row.Component_Type) === 'VENUE_EQUIPMENT'; });
    if (!parent || !child) throw appError_('VENUE_EQUIPMENT_COMPONENT_NOT_FOUND', 'Venue and Equipment component was not found.', false);
    if (['COMPLETED', 'REJECTED', 'CANCELLED'].indexOf(String(child.Lifecycle_Status)) >= 0) throw appError_('VENUE_EQUIPMENT_UPDATE_NOT_ALLOWED', 'Terminal Venue and Equipment components cannot be updated.', false);
    var committeeId = String(child.Owner_Committee_ID || ''), user = requirePermission_('Can_Review', { committeeIds: [committeeId] });
    if (Number(command.expectedRevision) !== Number(child.Revision || 1)) throw appError_('REVISION_CONFLICT', 'Venue and Equipment component changed; refresh before updating.', true);
    var payload = compositeParse_(child.Component_Payload_JSON, {}), current = payload.venueEquipment;
    if (!current) throw appError_('VENUE_EQUIPMENT_WORKFLOW_REQUIRED', 'Venue and Equipment workflow details are missing.', false);
    var next = venueEquipmentUpdate_(current, command.patch || {});
    if (next.fulfillmentEvidenceId && !venueEquipmentEvidenceUploaded_(next.fulfillmentEvidenceId, child.Component_ID)) throw appError_('VENUE_EQUIPMENT_EVIDENCE_INVALID', 'Venue and Equipment evidence must be uploaded and linked to this component.', false);
    payload.venueEquipment = next; var now = nowIso_(), flags = venueEquipmentAttentionFlags_(next), revision = Number(child.Revision || 1) + 1;
    updateObject_(HAU_SHEETS.COMPOSITE_REQUESTS, child._row, { Component_Payload_JSON: safeJson_(payload), Attention_Flags_JSON: safeJson_(flags), Progress_JSON: safeJson_({ lineCount: (payload.lines || []).length, confirmationStatus: next.confirmationStatus, otherTriageStatus: next.otherTriageStatus, returnStatus: next.returnStatus, evidenceLinked: Boolean(next.fulfillmentEvidenceId) }), Revision: revision, Updated_At: now });
    var projectedChildren = compositeChildren_(rows).map(function(row) { return row.Component_ID === child.Component_ID ? Object.assign({}, row, { Component_Payload_JSON: safeJson_(payload), Attention_Flags_JSON: safeJson_(flags), Revision: revision, Updated_At: now }) : row; }), derived = compositeSetParentProjection_(parent, projectedChildren, now);
    history_('COMPOSITE_COMPONENT', child.Component_ID, child.Lifecycle_Status, child.Lifecycle_Status, user, command.reason || 'Venue and Equipment workflow updated', { requestId: child.Request_ID, idempotencyKey: key, metadata: { revision: revision, confirmationStatus: next.confirmationStatus, returnStatus: next.returnStatus } });
    audit_('UPDATE_VENUE_EQUIPMENT_COMPONENT', 'COMPOSITE_COMPONENT', child.Component_ID, user, correlationId, { before: { confirmationStatus: current.confirmationStatus, otherTriageStatus: current.otherTriageStatus, blockerStatus: current.blockerStatus, returnStatus: current.returnStatus }, after: { revision: revision, confirmationStatus: next.confirmationStatus, otherTriageStatus: next.otherTriageStatus, blockerStatus: next.blockerStatus, returnStatus: next.returnStatus, evidenceLinked: Boolean(next.fulfillmentEvidenceId) }, requestId: child.Request_ID });
    return recordIdempotency_(key, { requestId: child.Request_ID, componentId: child.Component_ID, revision: revision, parentStatus: derived.status, venueEquipment: next, entityType: 'COMPOSITE_COMPONENT', entityId: child.Component_ID }, user, correlationId);
  });
}
