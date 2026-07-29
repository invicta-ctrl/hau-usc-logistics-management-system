var HAU_MATERIAL_CATEGORIES_ = ['OFFICE_SUPPLIES', 'PRINTING_SIGNAGE', 'EVENT_MATERIALS', 'CLEANING_SUPPLIES', 'OTHER_CONTROLLED'];
var HAU_MATERIAL_UNITS_ = ['piece', 'box', 'pack', 'ream', 'roll', 'sheet', 'bottle', 'meter', 'kilogram', 'liter'];
var HAU_MATERIAL_SOURCING_PREFERENCES_ = ['STOCK_REVIEW', 'PROCUREMENT_REQUIRED'];
var HAU_MATERIAL_FULFILLMENT_PATHS_ = ['PENDING_DECISION', 'STOCK_ISSUE', 'PROCUREMENT_RECEIPT'];
var HAU_MATERIAL_SUBSTITUTION_POLICIES_ = ['EXACT_ONLY', 'APPROVED_SUBSTITUTION'];
var HAU_MATERIAL_BLOCKER_STATUSES_ = ['NONE', 'BLOCKED'];

function materialsRequestsEnabled_() { return resolveMaterialsRequestsEnabled_(); }
function materialsControlled_(value, allowed, field, lower) {
  var normalized = String(value == null ? '' : value).trim();
  normalized = lower ? normalized.toLowerCase() : normalized.toUpperCase();
  if (allowed.indexOf(normalized) < 0) throw appError_('VALIDATION_ERROR', field + ' is not supported.', false, { field: field });
  return normalized;
}
function materialsDate_(value, field) {
  var normalized = compositeNormalizeText_(value, field, true, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(normalized) || isNaN(new Date(normalized + 'T00:00:00Z').getTime())) throw appError_('VALIDATION_ERROR', field + ' must be a valid ISO date.', false, { field: field });
  return normalized;
}
function materialsReference_(referenceId) {
  var item = typeof itemById_ === 'function' ? itemById_(referenceId) : null;
  if (!item) throw appError_('MATERIAL_REFERENCE_NOT_FOUND', 'The selected material reference was not found.', false);
  var status = String(item.Status || item.status || '').trim().toUpperCase();
  if (status === 'VERIFY') throw appError_('MATERIAL_VERIFY_BLOCKED', 'Materials marked VERIFY cannot be requested or fulfilled until explicitly resolved.', false);
  if (status !== 'ACTIVE') throw appError_('MATERIAL_REFERENCE_INACTIVE', 'The selected material reference is not active.', false);
  return item;
}
function materialsSnapshot_(line, existingSnapshot) {
  if (!line.referenceId) return null;
  var item = materialsReference_(line.referenceId);
  var catalogName = compositeNormalizeText_(item.Item_Name || item.name, 'catalogName', true);
  var catalogUnit = materialsControlled_(item.Unit || item.unit, HAU_MATERIAL_UNITS_, 'catalogUnit', true);
  var sourceCategory = materialsControlled_(item.Category || item.category, HAU_MATERIAL_CATEGORIES_, 'sourceCategory', false);
  if (catalogUnit !== line.unit) throw appError_('MATERIAL_UNIT_MISMATCH', 'The selected material must retain its exact catalog unit (' + catalogUnit + ').', false);
  if (catalogName.toLowerCase() !== String(line.label).toLowerCase()) throw appError_('MATERIAL_SOURCE_NAME_MISMATCH', 'The selected material must retain its exact source name.', false);
  if (sourceCategory !== line.category) throw appError_('MATERIAL_CATEGORY_MISMATCH', 'The selected material must retain its exact controlled category.', false);
  var preserved = existingSnapshot && String(existingSnapshot.referenceId) === String(line.referenceId) && String(existingSnapshot.catalogName) === catalogName && String(existingSnapshot.catalogUnit) === catalogUnit && String(existingSnapshot.sourceCategory) === sourceCategory ? existingSnapshot : null;
  var sourceQuantity = item._Helper_Qty != null && String(item._Helper_Qty) !== '' ? item._Helper_Qty : item.Opening_Qty != null ? item.Opening_Qty : item.legacySourceQuantity != null ? item.legacySourceQuantity : '';
  return { referenceId: line.referenceId, catalogName: catalogName, catalogUnit: catalogUnit, requestedQuantity: Number(line.quantity), sourceCategory: sourceCategory, sourceName: preserved ? preserved.sourceName : compositeNormalizeText_(item._Helper_Name || item.legacySourceName || catalogName, 'sourceName', true), sourceQuantity: preserved ? preserved.sourceQuantity : sourceQuantity, sourceUnit: preserved ? preserved.sourceUnit : compositeNormalizeText_(item._Helper_Unit || item.legacySourceUnit || catalogUnit, 'sourceUnit', true, 40), sourceStatus: preserved ? preserved.sourceStatus : 'ACTIVE', sourceSheet: preserved ? preserved.sourceSheet : compositeNormalizeText_(item.Legacy_Source_Sheet || item.legacySourceSheet, 'sourceSheet', false, 120), sourceRow: preserved ? preserved.sourceRow : compositeNormalizeText_(item.Legacy_Source_Row || item.legacySourceRow, 'sourceRow', false, 40), sourceBlock: preserved ? preserved.sourceBlock : compositeNormalizeText_(item.Legacy_Source_Block || item.legacySourceBlock, 'sourceBlock', false, 120) };
}
function materialsDetails_(raw, lines, existingMaterials) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw appError_('VALIDATION_ERROR', 'Materials workflow details are required.', false, { field: 'materials' });
  var materialCategory = materialsControlled_(raw.materialCategory, HAU_MATERIAL_CATEGORIES_, 'materials.materialCategory', false);
  var specification = compositeNormalizeText_(raw.specification, 'materials.specification', true, 500);
  if (materialCategory === 'OTHER_CONTROLLED' && specification.length < 5) throw appError_('VALIDATION_ERROR', 'Constrained Other materials require a specific description.', false, { field: 'materials.specification' });
  var remainingSnapshots = existingMaterials && Array.isArray(existingMaterials.lineSnapshots) ? existingMaterials.lineSnapshots.slice() : [];
  var normalizedLines = lines.map(function(line, index) {
    var unit = materialsControlled_(line.unit, HAU_MATERIAL_UNITS_, 'lines[' + index + '].unit', true);
    var category = materialsControlled_(line.category || materialCategory, HAU_MATERIAL_CATEGORIES_, 'lines[' + index + '].category', false);
    if (category !== materialCategory) throw appError_('VALIDATION_ERROR', 'Every Materials line must use the selected controlled category.', false, { field: 'materials.materialCategory' });
    return Object.assign({}, line, { unit: unit, category: category });
  });
  var lineSnapshots = normalizedLines.map(function(line) {
    var snapshotIndex = -1;
    remainingSnapshots.some(function(snapshot, index) {
      if (String(snapshot.referenceId) === String(line.referenceId) && String(snapshot.catalogName).toLowerCase() === String(line.label).toLowerCase() && String(snapshot.catalogUnit) === String(line.unit)) { snapshotIndex = index; return true; }
      return false;
    });
    var existingSnapshot = snapshotIndex >= 0 ? remainingSnapshots.splice(snapshotIndex, 1)[0] : null;
    return materialsSnapshot_(line, existingSnapshot);
  }).filter(function(snapshot) { return Boolean(snapshot); });
  var provenanceHistory = existingMaterials && Array.isArray(existingMaterials.provenanceHistory) ? existingMaterials.provenanceHistory.slice() : [];
  if (existingMaterials && JSON.stringify(existingMaterials.lineSnapshots || []) !== JSON.stringify(lineSnapshots)) provenanceHistory.push({ version: Number(existingMaterials.version || 1), lineSnapshots: existingMaterials.lineSnapshots || [] });
  return { version: 1, materialCategory: materialCategory, specification: specification, requiredBy: materialsDate_(raw.requiredBy, 'materials.requiredBy'), usagePurpose: compositeNormalizeText_(raw.usagePurpose, 'materials.usagePurpose', true, 500), sourcingPreference: materialsControlled_(raw.sourcingPreference, HAU_MATERIAL_SOURCING_PREFERENCES_, 'materials.sourcingPreference', false), fulfillmentPath: existingMaterials ? existingMaterials.fulfillmentPath : 'PENDING_DECISION', substitutionPolicy: existingMaterials ? existingMaterials.substitutionPolicy : 'EXACT_ONLY', approvedSubstitutionReferenceId: existingMaterials ? existingMaterials.approvedSubstitutionReferenceId : '', substitutionReason: existingMaterials ? existingMaterials.substitutionReason : '', blockerStatus: existingMaterials ? existingMaterials.blockerStatus : 'NONE', blockerReason: existingMaterials ? existingMaterials.blockerReason : '', fulfillmentEvidenceId: existingMaterials ? existingMaterials.fulfillmentEvidenceId : '', lineSnapshots: lineSnapshots, provenanceHistory: provenanceHistory, lines: normalizedLines };
}
function materialsAttentionFlags_(materials) {
  var flags = [];
  if (materials.fulfillmentPath === 'PENDING_DECISION') flags.push('MATERIALS_FULFILLMENT_PATH_PENDING');
  if (materials.substitutionPolicy === 'APPROVED_SUBSTITUTION' && !materials.approvedSubstitutionReferenceId) flags.push('MATERIALS_SUBSTITUTION_APPROVAL_REQUIRED');
  if (materials.blockerStatus === 'BLOCKED') flags.push('MATERIALS_BLOCKED');
  if (!materials.fulfillmentEvidenceId) flags.push('MATERIALS_COMPLETION_EVIDENCE_MISSING');
  return flags;
}
function materialsUpdate_(current, patch) {
  if (!current || Number(current.version) !== 1) throw appError_('MATERIALS_WORKFLOW_VERSION_UNSUPPORTED', 'Materials workflow version is unsupported.', false);
  patch = patch || {}; var next = Object.assign({}, current);
  if (patch.fulfillmentPath != null) next.fulfillmentPath = materialsControlled_(patch.fulfillmentPath, HAU_MATERIAL_FULFILLMENT_PATHS_, 'fulfillmentPath', false);
  if (patch.substitutionPolicy != null) next.substitutionPolicy = materialsControlled_(patch.substitutionPolicy, HAU_MATERIAL_SUBSTITUTION_POLICIES_, 'substitutionPolicy', false);
  if (patch.approvedSubstitutionReferenceId != null) next.approvedSubstitutionReferenceId = compositeNormalizeText_(patch.approvedSubstitutionReferenceId, 'approvedSubstitutionReferenceId', false, 100);
  if (patch.substitutionReason != null) next.substitutionReason = compositeNormalizeText_(patch.substitutionReason, 'substitutionReason', false, 500);
  if (next.substitutionPolicy === 'EXACT_ONLY' && (next.approvedSubstitutionReferenceId || next.substitutionReason)) throw appError_('VALIDATION_ERROR', 'Exact-only requests cannot record a substitution.', false, { field: 'substitutionPolicy' });
  if (next.substitutionPolicy === 'APPROVED_SUBSTITUTION') {
    if (!next.approvedSubstitutionReferenceId || !next.substitutionReason) throw appError_('VALIDATION_ERROR', 'An approved substitution requires the replacement reference and recorded reason.', false, { field: 'approvedSubstitutionReferenceId' });
    var replacement = materialsReference_(next.approvedSubstitutionReferenceId);
    materialsSnapshot_({ referenceId: next.approvedSubstitutionReferenceId, label: replacement.Item_Name || replacement.name, quantity: 1, unit: String(replacement.Unit || replacement.unit).toLowerCase(), category: current.materialCategory }, null);
  }
  if (patch.blockerStatus != null) next.blockerStatus = materialsControlled_(patch.blockerStatus, HAU_MATERIAL_BLOCKER_STATUSES_, 'blockerStatus', false);
  if (patch.blockerReason != null) next.blockerReason = compositeNormalizeText_(patch.blockerReason, 'blockerReason', false, 500);
  if (next.blockerStatus === 'BLOCKED' && !next.blockerReason) throw appError_('VALIDATION_ERROR', 'A blocker reason is required while Materials is blocked.', false, { field: 'blockerReason' });
  if (next.blockerStatus === 'NONE') next.blockerReason = '';
  if (patch.fulfillmentEvidenceId != null) next.fulfillmentEvidenceId = compositeNormalizeText_(patch.fulfillmentEvidenceId, 'fulfillmentEvidenceId', false, 120);
  return next;
}
function materialsEvidenceType_(fulfillmentPath) { return fulfillmentPath === 'STOCK_ISSUE' ? 'MATERIALS_ISSUE_PROOF' : fulfillmentPath === 'PROCUREMENT_RECEIPT' ? 'DELIVERABLE_RECEIPT' : ''; }
function materialsEvidenceUploaded_(evidenceId, componentId, fulfillmentPath) {
  var evidenceType = materialsEvidenceType_(fulfillmentPath);
  if (!evidenceId || !evidenceType) return false;
  return findAll_(HAU_SHEETS.EVIDENCE, function(row) { return String(row.Evidence_ID) === String(evidenceId) && String(row.Evidence_Type) === evidenceType && String(row.Related_Entity_Type) === 'COMPOSITE_COMPONENT' && String(row.Related_Entity_ID) === String(componentId) && String(row.Upload_Status) === 'UPLOADED'; }).length === 1;
}
function materialsAssertTransition_(child, action) {
  if (String(child.Component_Type) !== 'MATERIALS') return;
  var materials = compositeParse_(child.Component_Payload_JSON, {}).materials, normalized = String(action || '').trim().toUpperCase();
  if (!materials) throw appError_('MATERIALS_WORKFLOW_REQUIRED', 'Materials workflow details are missing.', false);
  if (['READY_FOR_HANDOFF', 'COMPLETE'].indexOf(normalized) >= 0 && materials.fulfillmentPath === 'PENDING_DECISION') throw appError_('MATERIALS_FULFILLMENT_PATH_REQUIRED', 'Choose exactly one stock-issue or procurement-receipt path before handoff.', false);
  if (['READY_FOR_HANDOFF', 'COMPLETE'].indexOf(normalized) >= 0 && materials.blockerStatus === 'BLOCKED') throw appError_('MATERIALS_BLOCKED', 'Resolve the Materials blocker before handoff.', false);
  if (['READY_FOR_HANDOFF', 'COMPLETE'].indexOf(normalized) >= 0 && materials.substitutionPolicy === 'APPROVED_SUBSTITUTION' && !materials.approvedSubstitutionReferenceId) throw appError_('MATERIALS_SUBSTITUTION_APPROVAL_REQUIRED', 'Record the approved substitution before handoff.', false);
  if (normalized === 'COMPLETE' && !materialsEvidenceUploaded_(materials.fulfillmentEvidenceId, child.Component_ID, materials.fulfillmentPath)) throw appError_('MATERIALS_COMPLETION_EVIDENCE_REQUIRED', 'Uploaded issue or receipt evidence is required before Materials completion.', false);
}
function materialsQueueItem_(parent, child) {
  var payload = compositeParse_(child.Component_Payload_JSON, {});
  return { requestId: parent.Request_ID, componentId: child.Component_ID, status: child.Lifecycle_Status, ownerCommitteeId: 'COM_MATERIALS', ownerUserId: child.Owner_User_ID || '', dueAt: child.Due_At || '', revision: Number(child.Revision || 1), parent: { eventId: parent.Event_ID || '', eventName: parent.Event_Name || '', eventStartAt: parent.Event_Start_At || '', priority: parent.Priority || 'ROUTINE', purpose: parent.Purpose || '', department: parent.Department || '' }, materials: payload.materials, lines: payload.lines || [], attentionFlags: compositeParse_(child.Attention_Flags_JSON, []) };
}
function getMaterialsWorkQueue_() {
  return withRequestReadCache_(function() {
    requirePermission_('Can_Review', { committeeIds: ['COM_MATERIALS'] });
    var children = findAll_(HAU_SHEETS.COMPOSITE_REQUESTS, function(row) { return String(row.Record_Type) === 'COMPONENT' && String(row.Component_Type) === 'MATERIALS' && !row.Archived_At; });
    return { committeeId: 'COM_MATERIALS', items: children.slice(0, 100).map(function(child) { return materialsQueueItem_(compositeFindParent_(compositeRowsForRequest_(child.Request_ID)), child); }), truncated: children.length > 100 };
  });
}
function updateMaterialsComponent_(command, correlationId) {
  return withScriptLock_(function() {
    var key = requireIdempotency_(command), replay = idempotencyReplay_(key); if (replay) return Object.assign({ idempotentReplay: true }, replay);
    var rows = compositeRowsForRequest_(requireText_(command.requestId, 'requestId')), parent = compositeFindParent_(rows), child = compositeChildren_(rows).find(function(row) { return String(row.Component_ID) === String(command.componentId) && String(row.Component_Type) === 'MATERIALS'; });
    if (!parent || !child) throw appError_('MATERIALS_COMPONENT_NOT_FOUND', 'Materials component was not found.', false);
    if (['COMPLETED', 'REJECTED', 'CANCELLED'].indexOf(String(child.Lifecycle_Status)) >= 0) throw appError_('MATERIALS_UPDATE_NOT_ALLOWED', 'Terminal Materials components cannot be updated.', false);
    var user = requirePermission_('Can_Review', { committeeIds: ['COM_MATERIALS'] });
    if (Number(command.expectedRevision) !== Number(child.Revision || 1)) throw appError_('REVISION_CONFLICT', 'Materials component changed; refresh before updating.', true);
    var payload = compositeParse_(child.Component_Payload_JSON, {}), currentMaterials = payload.materials, next = materialsUpdate_(currentMaterials, command.patch || {});
    if (next.fulfillmentEvidenceId && !materialsEvidenceUploaded_(next.fulfillmentEvidenceId, child.Component_ID, next.fulfillmentPath)) throw appError_('MATERIALS_COMPLETION_EVIDENCE_INVALID', 'Materials evidence type must match the selected fulfillment path and component.', false);
    payload.materials = next; var now = nowIso_(), flags = materialsAttentionFlags_(next), revision = Number(child.Revision || 1) + 1;
    updateObject_(HAU_SHEETS.COMPOSITE_REQUESTS, child._row, { Component_Payload_JSON: safeJson_(payload), Attention_Flags_JSON: safeJson_(flags), Progress_JSON: safeJson_({ lineCount: (payload.lines || []).length, fulfillmentPath: next.fulfillmentPath, blockerStatus: next.blockerStatus, evidenceLinked: Boolean(next.fulfillmentEvidenceId) }), Revision: revision, Updated_At: now });
    var projectedChildren = compositeChildren_(rows).map(function(row) { return row.Component_ID === child.Component_ID ? Object.assign({}, row, { Component_Payload_JSON: safeJson_(payload), Attention_Flags_JSON: safeJson_(flags), Revision: revision, Updated_At: now }) : row; });
    var derived = compositeSetParentProjection_(parent, projectedChildren, now);
    var beforeSubstitution = { policy: currentMaterials.substitutionPolicy, approvedReferenceId: currentMaterials.approvedSubstitutionReferenceId || '', reason: currentMaterials.substitutionReason || '' };
    var afterSubstitution = { policy: next.substitutionPolicy, approvedReferenceId: next.approvedSubstitutionReferenceId || '', reason: next.substitutionReason || '' };
    history_('COMPOSITE_COMPONENT', child.Component_ID, child.Lifecycle_Status, child.Lifecycle_Status, user, command.reason || 'Materials workflow updated', { requestId: child.Request_ID, idempotencyKey: key, metadata: { revision: revision, substitutionBefore: beforeSubstitution, substitutionAfter: afterSubstitution } });
    audit_('UPDATE_MATERIALS_COMPONENT', 'COMPOSITE_COMPONENT', child.Component_ID, user, correlationId, { before: { substitution: beforeSubstitution }, after: { revision: revision, fulfillmentPath: next.fulfillmentPath, substitutionPolicy: next.substitutionPolicy, approvedSubstitutionReferenceId: next.approvedSubstitutionReferenceId || '', substitutionReason: next.substitutionReason || '', blockerStatus: next.blockerStatus, evidenceLinked: Boolean(next.fulfillmentEvidenceId) }, requestId: child.Request_ID });
    return recordIdempotency_(key, { requestId: child.Request_ID, componentId: child.Component_ID, revision: revision, parentStatus: derived.status, materials: next, entityType: 'COMPOSITE_COMPONENT', entityId: child.Component_ID }, user, correlationId);
  });
}
