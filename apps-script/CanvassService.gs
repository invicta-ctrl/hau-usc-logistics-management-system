var HAU_CANVASS_UNITS_ = ['bottle','box','can','chair','day','each','facility','gram','kilogram','kit','liter','meal','meter','milliliter','pack','pair','pallet','piece','ream','roll','service','set','sheet','square meter','table','tray','unit'];

function canvassText_(value, field, required, max) {
  var text = String(value == null ? '' : value).trim().replace(/\s+/g, ' ');
  if (required && !text) throw appError_('VALIDATION_ERROR', field + ' is required.', false, { field: field });
  if (max && text.length > max) throw appError_('VALIDATION_ERROR', field + ' is too long.', false, { field: field, maxLength: max });
  return text;
}

function canvassUnit_(value) {
  var unit = canvassText_(value, 'unit', true, 40).toLowerCase();
  if (HAU_CANVASS_UNITS_.indexOf(unit) < 0) throw appError_('VALIDATION_ERROR', 'Select a supported quantity unit.', false, { field: 'unit' });
  return unit;
}

function canvassCheckedAt_(value) {
  var text = canvassText_(value, 'checkedAt', true, 40);
  var parsed = new Date(text);
  if (isNaN(parsed.getTime())) throw appError_('VALIDATION_ERROR', 'checkedAt must be a real date.', false, { field: 'checkedAt' });
  var calendarDate = /^(\d{4})-(\d{2})-(\d{2})(?:$|T)/.exec(text);
  var calendarCheck = calendarDate && new Date(Date.UTC(Number(calendarDate[1]), Number(calendarDate[2]) - 1, Number(calendarDate[3])));
  if (calendarDate && (calendarCheck.getUTCFullYear() !== Number(calendarDate[1]) || calendarCheck.getUTCMonth() + 1 !== Number(calendarDate[2]) || calendarCheck.getUTCDate() !== Number(calendarDate[3]))) {
    throw appError_('VALIDATION_ERROR', 'checkedAt must be a real date.', false, { field: 'checkedAt' });
  }
  return text;
}

function canvassSourceUrl_(value) {
  var sourceUrl = canvassText_(value, 'sourceUrl', false, 500);
  if (!sourceUrl) return '';
  if (!/^https?:\/\/[^\s/@]+(?::\d+)?(?:[/?#][^\s]*)?$/i.test(sourceUrl)) {
    throw appError_('VALIDATION_ERROR', 'sourceUrl must be a safe http(s) URL without embedded credentials.', false, { field: 'sourceUrl' });
  }
  return sourceUrl;
}

function canvassComparable_(value) {
  return String(value == null ? '' : value).trim().replace(/\s+/g, ' ').toLowerCase();
}

function canvassLinkKey_(row) {
  return ['LINE', row.Linked_Request_Line_ID || '', 'DELIVERABLE', row.Linked_Deliverable_ID || '', 'RESTOCK', row.Linked_Restock_ID || ''].join('|');
}

function canvassDuplicate_(candidate, excludedId) {
  return readObjects_(HAU_SHEETS.CANVASS).find(function(row) {
    return String(row.Canvass_ID) !== String(excludedId || '') &&
      String(row.Status || 'ACTIVE').toUpperCase() === 'ACTIVE' &&
      canvassLinkKey_(row) === canvassLinkKey_(candidate) &&
      canvassComparable_(row.Supplier_Name) === canvassComparable_(candidate.Supplier_Name) &&
      canvassComparable_(row.Item_Spec) === canvassComparable_(candidate.Item_Spec) &&
      canvassComparable_(row.Unit) === canvassComparable_(candidate.Unit) &&
      canvassComparable_(row.Checked_At) === canvassComparable_(candidate.Checked_At);
  });
}

function canvassPriceHistory_(row) {
  try {
    var parsed = JSON.parse(row && row.Price_History_JSON || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch (ignored) {
    return [];
  }
}

function ensureSupplier_(command, user) {
  if (command.supplierId) { var supplier = findOne_(HAU_SHEETS.SUPPLIERS, 'Supplier_ID', command.supplierId); if (supplier) return supplier; }
  var supplierName = canvassText_(command.supplierName, 'supplierName', true, 160);
  var normalized = supplierName.toLowerCase();
  var existing = readObjects_(HAU_SHEETS.SUPPLIERS).find(function(row) { return String(row.Normalized_Name || '').toLowerCase() === normalized; });
  if (existing) return existing;
  var row = { Supplier_ID: allocateId_('SUP'), Created_At: nowIso_(), Updated_At: nowIso_(), Supplier_Name: supplierName, Normalized_Name: normalized, Location: canvassText_(command.location, 'location', false, 160), Contact_Name: '', Contact_Number: '', Email: '', Supplier_TIN: canvassText_(command.supplierTin, 'supplierTin', false, 80), Receipt_Capability: command.receiptStatus || 'NOT_CHECKED', Reliability: command.reliability || 'UNRATED', Active: true, Created_By: user.User_ID, Last_Canvassed_At: nowIso_(), Notes: '', Archive_Reason: '', Archived_At: '' };
  appendObject_(HAU_SHEETS.SUPPLIERS, row); return row;
}

function canvassValidatedCandidate_(command, current) {
  var linkedLineId = command.linkedRequestLineId != null ? command.linkedRequestLineId : command.linkedLineId != null ? command.linkedLineId : current && current.Linked_Request_Line_ID || '';
  var linkedDeliverableId = command.linkedDeliverableId != null ? command.linkedDeliverableId : current && current.Linked_Deliverable_ID || '';
  var linkedDeliverable = linkedLineId && findOne_(HAU_SHEETS.DELIVERABLES, 'Request_Line_ID', linkedLineId);
  if (!linkedDeliverableId && linkedDeliverable) linkedDeliverableId = linkedDeliverable.Deliverable_ID;
  var supplierById = command.supplierId && findOne_(HAU_SHEETS.SUPPLIERS, 'Supplier_ID', command.supplierId);
  var supplierName = supplierById ? supplierById.Supplier_Name : command.supplierName != null ? command.supplierName : current && current.Supplier_Name;
  return {
    Linked_Request_Line_ID: canvassText_(linkedLineId, 'linkedRequestLineId', false, 100),
    Linked_Deliverable_ID: canvassText_(linkedDeliverableId, 'linkedDeliverableId', false, 100),
    Linked_Restock_ID: canvassText_(command.linkedRestockId != null ? command.linkedRestockId : current && current.Linked_Restock_ID, 'linkedRestockId', false, 100),
    Supplier_Name: canvassText_(supplierName, 'supplierName', true, 160),
    Location: canvassText_(command.location != null ? command.location : current && current.Location, 'location', false, 160),
    Item_Spec: canvassText_(command.itemSpec != null ? command.itemSpec : current && current.Item_Spec, 'itemSpec', true, 500),
    Price: positiveNumber_(command.price != null ? command.price : current && current.Price, 'price'),
    Unit: canvassUnit_(command.unit != null ? command.unit : current && current.Unit),
    Receipt_Status: canvassText_(command.receiptStatus != null ? command.receiptStatus : current && current.Receipt_Status || 'NOT_CHECKED', 'receiptStatus', true, 60).toUpperCase(),
    Supplier_TIN: canvassText_(command.supplierTin != null ? command.supplierTin : current && current.Supplier_TIN, 'supplierTin', false, 80),
    Reliability: canvassText_(command.reliability != null ? command.reliability : current && current.Reliability || 'UNRATED', 'reliability', true, 60).toUpperCase(),
    Checked_At: canvassCheckedAt_(command.checkedAt != null ? command.checkedAt : current && current.Checked_At),
    Source_URL: canvassSourceUrl_(command.sourceUrl != null ? command.sourceUrl : current && current.Source_URL),
    Notes: canvassText_(command.notes != null ? command.notes : current && current.Notes, 'notes', false, 1000)
  };
}

function saveCanvassReference_(command, correlationId) {
  return withScriptLock_(function() {
    var user = requirePermission_('Can_Receive'), key = requireIdempotency_(command), replay = idempotencyReplay_(key);
    if (replay) return Object.assign({ idempotentReplay: true }, replay);
    var candidate = canvassValidatedCandidate_(command, null);
    if (canvassDuplicate_(candidate, '')) throw appError_('CANVASS_DUPLICATE', 'An active matching canvass reference already exists.', false);
    var supplier = ensureSupplier_(Object.assign({}, command, { supplierName: candidate.Supplier_Name, location: candidate.Location }), user), id = allocateId_('CAN'), evidenceId = '';
    if (command.evidence) evidenceId = uploadEvidence_(Object.assign({}, command.evidence, { evidenceType: 'CANVASS_QUOTE', relatedEntityType: 'CANVASS', relatedEntityId: id, requestLineId: candidate.Linked_Request_Line_ID, supplierId: supplier.Supplier_ID, secondaryId: candidate.Linked_Request_Line_ID || 'NA', clientRequestId: key + ':evidence' }), correlationId).evidenceId;
    var timestamp = nowIso_();
    var row = Object.assign({}, candidate, { Canvass_ID: id, Created_At: timestamp, Updated_At: timestamp, Supplier_ID: supplier.Supplier_ID, Supplier_Name: supplier.Supplier_Name, Evidence_ID: evidenceId, Preferred: false, Preferred_Rationale: '', Status: 'ACTIVE', Created_By: user.User_ID, Price_History_JSON: safeJson_([{ price: candidate.Price, checkedAt: candidate.Checked_At, recordedAt: timestamp, recordedBy: user.User_ID }]), Idempotency_Key: key, Revision: 1, Archived_At: '', Archived_By: '', Archive_Reason: '' });
    appendObject_(HAU_SHEETS.CANVASS, row);
    history_('CANVASS', id, '', 'ACTIVE', user, 'Canvass reference created', { idempotencyKey: key, metadata: { after: row } });
    audit_('SAVE_CANVASS', 'CANVASS', id, user, correlationId, { after: row });
    return recordIdempotency_(key, { canvassId: id, supplierId: supplier.Supplier_ID, evidenceId: evidenceId, revision: 1 }, user, correlationId);
  });
}

function updateCanvassReference_(command, correlationId) {
  return withScriptLock_(function() {
    var user = requirePermission_('Can_Receive'), key = requireIdempotency_(command), replay = idempotencyReplay_(key);
    if (replay) return Object.assign({ idempotentReplay: true }, replay);
    var canvass = findOne_(HAU_SHEETS.CANVASS, 'Canvass_ID', requireText_(command.canvassId, 'canvassId'));
    if (!canvass) throw appError_('CANVASS_NOT_FOUND', 'Canvass reference was not found.', false);
    if (String(canvass.Status).toUpperCase() !== 'ACTIVE') throw appError_('INVALID_TRANSITION', 'Only active canvass references can be updated.', false);
    var expectedUpdatedAt = requireText_(command.expectedUpdatedAt, 'expectedUpdatedAt');
    if (String(expectedUpdatedAt) !== String(canvass.Updated_At)) throw appError_('REVISION_CONFLICT', 'This canvass reference changed; refresh before updating.', true);
    var candidate = canvassValidatedCandidate_(command, canvass);
    if (canvassDuplicate_(candidate, canvass.Canvass_ID)) throw appError_('CANVASS_DUPLICATE', 'An active matching canvass reference already exists.', false);
    var supplier = ensureSupplier_(Object.assign({}, command, { supplierName: candidate.Supplier_Name, location: candidate.Location }), user);
    var evidenceId = canvass.Evidence_ID || '';
    if (command.evidence) evidenceId = uploadEvidence_(Object.assign({}, command.evidence, { evidenceType: 'CANVASS_QUOTE', relatedEntityType: 'CANVASS', relatedEntityId: canvass.Canvass_ID, requestLineId: candidate.Linked_Request_Line_ID, supplierId: supplier.Supplier_ID, secondaryId: candidate.Linked_Request_Line_ID || 'NA', clientRequestId: key + ':evidence' }), correlationId).evidenceId;
    var history = canvassPriceHistory_(canvass), timestamp = nowIso_();
    if (Number(canvass.Price) !== candidate.Price || String(canvass.Checked_At) !== String(candidate.Checked_At)) history.push({ price: candidate.Price, checkedAt: candidate.Checked_At, recordedAt: timestamp, recordedBy: user.User_ID });
    var patch = Object.assign({}, candidate, { Supplier_ID: supplier.Supplier_ID, Supplier_Name: supplier.Supplier_Name, Evidence_ID: evidenceId, Updated_At: timestamp, Price_History_JSON: safeJson_(history), Revision: Number(canvass.Revision || 1) + 1 });
    updateObject_(HAU_SHEETS.CANVASS, canvass._row, patch);
    history_('CANVASS', canvass.Canvass_ID, canvass.Status, canvass.Status, user, command.reason || 'Canvass reference updated', { idempotencyKey: key, metadata: { before: canvass, after: patch } });
    audit_('UPDATE_CANVASS', 'CANVASS', canvass.Canvass_ID, user, correlationId, { before: canvass, after: patch, notes: command.reason || '' });
    return recordIdempotency_(key, { canvassId: canvass.Canvass_ID, evidenceId: evidenceId, revision: patch.Revision, updatedAt: timestamp }, user, correlationId);
  });
}

function archiveCanvassReference_(command, correlationId) {
  return withScriptLock_(function() {
    var user = requirePermission_('Can_Review'), key = requireIdempotency_(command), replay = idempotencyReplay_(key);
    if (replay) return Object.assign({ idempotentReplay: true }, replay);
    var canvass = findOne_(HAU_SHEETS.CANVASS, 'Canvass_ID', requireText_(command.canvassId, 'canvassId'));
    if (!canvass) throw appError_('CANVASS_NOT_FOUND', 'Canvass reference was not found.', false);
    if (String(canvass.Status).toUpperCase() !== 'ACTIVE') throw appError_('INVALID_TRANSITION', 'Only active canvass references can be archived.', false);
    if (booleanValue_(canvass.Preferred, false)) throw appError_('PREFERRED_CANVASS_ARCHIVE_BLOCKED', 'Select another preferred canvass reference before archiving this one.', false);
    var reason = canvassText_(command.reason, 'reason', true, 500), timestamp = nowIso_();
    var patch = { Status: 'ARCHIVED', Preferred: false, Updated_At: timestamp, Archived_At: timestamp, Archived_By: user.User_ID, Archive_Reason: reason, Revision: Number(canvass.Revision || 1) + 1 };
    updateObject_(HAU_SHEETS.CANVASS, canvass._row, patch);
    history_('CANVASS', canvass.Canvass_ID, canvass.Status, 'ARCHIVED', user, reason, { idempotencyKey: key, metadata: { before: canvass, after: patch } });
    audit_('ARCHIVE_CANVASS', 'CANVASS', canvass.Canvass_ID, user, correlationId, { before: canvass, after: patch, notes: reason });
    return recordIdempotency_(key, { canvassId: canvass.Canvass_ID, status: 'ARCHIVED', revision: patch.Revision, updatedAt: timestamp }, user, correlationId);
  });
}

function selectPreferredCanvass_(command, correlationId) {
  return withScriptLock_(function() {
    var user = requirePermission_('Can_Review'), key = requireIdempotency_(command), replay = idempotencyReplay_(key);
    if (replay) return Object.assign({ idempotentReplay: true }, replay);
    var canvass = findOne_(HAU_SHEETS.CANVASS, 'Canvass_ID', requireText_(command.canvassId, 'canvassId'));
    if (!canvass || String(canvass.Status).toUpperCase() !== 'ACTIVE') throw appError_('CANVASS_NOT_FOUND', 'An active canvass reference was not found.', false);
    var rationale = canvassText_(command.rationale, 'rationale', true, 1000), timestamp = nowIso_();
    var groupKey = canvassLinkKey_(canvass);
    readObjects_(HAU_SHEETS.CANVASS).filter(function(row) { return String(row.Status || 'ACTIVE').toUpperCase() === 'ACTIVE' && canvassLinkKey_(row) === groupKey; }).forEach(function(row) {
      var preferred = row.Canvass_ID === canvass.Canvass_ID;
      if (!preferred && !booleanValue_(row.Preferred, false)) return;
      var patch = { Preferred: preferred, Preferred_Rationale: preferred ? rationale : '', Updated_At: timestamp, Revision: Number(row.Revision || 1) + 1 };
      updateObject_(HAU_SHEETS.CANVASS, row._row, patch);
      history_('CANVASS', row.Canvass_ID, row.Status, row.Status, user, preferred ? rationale : 'Preferred canvass changed to ' + canvass.Canvass_ID, { idempotencyKey: key, metadata: { preferred: preferred, rationale: preferred ? rationale : '', selectedCanvassId: canvass.Canvass_ID, before: row, after: patch } });
      audit_(preferred ? 'SELECT_PREFERRED_CANVASS' : 'DESELECT_PREFERRED_CANVASS', 'CANVASS', row.Canvass_ID, user, correlationId, { before: row, after: patch, notes: preferred ? rationale : 'Preferred canvass changed to ' + canvass.Canvass_ID });
    });
    var deliverable = canvass.Linked_Deliverable_ID ? findOne_(HAU_SHEETS.DELIVERABLES, 'Deliverable_ID', canvass.Linked_Deliverable_ID) : findOne_(HAU_SHEETS.DELIVERABLES, 'Request_Line_ID', canvass.Linked_Request_Line_ID);
    if (deliverable) updateObject_(HAU_SHEETS.DELIVERABLES, deliverable._row, { Preferred_Canvass_ID: canvass.Canvass_ID, Updated_At: timestamp });
    return recordIdempotency_(key, { canvassId: canvass.Canvass_ID, preferred: true, rationale: rationale, deliverableId: deliverable && deliverable.Deliverable_ID }, user, correlationId);
  });
}
