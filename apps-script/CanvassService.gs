function ensureSupplier_(command, user) {
  if (command.supplierId) { var supplier = findOne_(HAU_SHEETS.SUPPLIERS, 'Supplier_ID', command.supplierId); if (supplier) return supplier; }
  var normalized = String(command.supplierName || '').trim().toLowerCase();
  var existing = readObjects_(HAU_SHEETS.SUPPLIERS).find(function(row) { return String(row.Normalized_Name || '').toLowerCase() === normalized; });
  if (existing) return existing;
  var row = { Supplier_ID: allocateId_('SUP'), Created_At: nowIso_(), Updated_At: nowIso_(), Supplier_Name: requireText_(command.supplierName, 'supplierName'), Normalized_Name: normalized, Location: command.location || '', Contact_Name: '', Contact_Number: '', Email: '', Supplier_TIN: command.supplierTin || '', Receipt_Capability: command.receiptStatus || 'NOT_CHECKED', Reliability: command.reliability || 'UNRATED', Active: true, Created_By: user.User_ID, Last_Canvassed_At: nowIso_(), Notes: '', Archive_Reason: '', Archived_At: '' };
  appendObject_(HAU_SHEETS.SUPPLIERS, row); return row;
}

function saveCanvassReference_(command, correlationId) {
  return withScriptLock_(function() {
    var user = requirePermission_('Can_Receive'), key = requireIdempotency_(command), replay = idempotencyReplay_(key);
    if (replay) return Object.assign({ idempotentReplay: true }, replay);
    var supplier = ensureSupplier_(command, user), id = allocateId_('CAN'), evidenceId = '';
    var linkedLineId = command.linkedRequestLineId || command.linkedLineId || '', linkedDeliverableId = command.linkedDeliverableId || '';
    var linkedDeliverable = linkedLineId && findOne_(HAU_SHEETS.DELIVERABLES, 'Request_Line_ID', linkedLineId);
    if (!linkedDeliverableId && linkedDeliverable) linkedDeliverableId = linkedDeliverable.Deliverable_ID;
    if (command.evidence) evidenceId = uploadEvidence_(Object.assign({}, command.evidence, { evidenceType: 'CANVASS_QUOTE', relatedEntityType: 'CANVASS', relatedEntityId: id, requestLineId: linkedLineId, supplierId: supplier.Supplier_ID, secondaryId: linkedLineId || 'NA', clientRequestId: key + ':evidence' }), correlationId).evidenceId;
    var row = { Canvass_ID: id, Created_At: nowIso_(), Updated_At: nowIso_(), Linked_Request_Line_ID: linkedLineId, Linked_Deliverable_ID: linkedDeliverableId, Linked_Restock_ID: command.linkedRestockId || '', Supplier_ID: supplier.Supplier_ID, Supplier_Name: supplier.Supplier_Name, Location: command.location || supplier.Location, Item_Spec: requireText_(command.itemSpec, 'itemSpec'), Price: nonNegativeNumber_(command.price, 'price'), Unit: requireText_(command.unit, 'unit'), Receipt_Status: command.receiptStatus || 'NOT_CHECKED', Supplier_TIN: command.supplierTin || '', Reliability: command.reliability || 'UNRATED', Checked_At: command.checkedAt || nowIso_(), Source_URL: command.sourceUrl || '', Evidence_ID: evidenceId, Preferred: false, Status: 'ACTIVE', Created_By: user.User_ID, Price_History_JSON: safeJson_([{ price: Number(command.price), checkedAt: command.checkedAt || nowIso_() }]), Idempotency_Key: key, Notes: command.notes || '' };
    appendObject_(HAU_SHEETS.CANVASS, row);
    audit_('SAVE_CANVASS', 'CANVASS', id, user, correlationId, { after: row });
    return recordIdempotency_(key, { canvassId: id, supplierId: supplier.Supplier_ID, evidenceId: evidenceId }, user, correlationId);
  });
}

function selectPreferredCanvass_(command, correlationId) {
  return withScriptLock_(function() {
    var user = requirePermission_('Can_Review'), key = requireIdempotency_(command), replay = idempotencyReplay_(key);
    if (replay) return Object.assign({ idempotentReplay: true }, replay);
    var canvass = findOne_(HAU_SHEETS.CANVASS, 'Canvass_ID', requireText_(command.canvassId, 'canvassId'));
    if (!canvass) throw appError_('CANVASS_NOT_FOUND', 'Canvass reference was not found.', false);
    requireText_(command.rationale, 'rationale');
    readObjects_(HAU_SHEETS.CANVASS).filter(function(row) { return row.Linked_Request_Line_ID && row.Linked_Request_Line_ID === canvass.Linked_Request_Line_ID; }).forEach(function(row) { updateObject_(HAU_SHEETS.CANVASS, row._row, { Preferred: row.Canvass_ID === canvass.Canvass_ID, Updated_At: nowIso_() }); });
    var deliverable = canvass.Linked_Deliverable_ID ? findOne_(HAU_SHEETS.DELIVERABLES, 'Deliverable_ID', canvass.Linked_Deliverable_ID) : findOne_(HAU_SHEETS.DELIVERABLES, 'Request_Line_ID', canvass.Linked_Request_Line_ID);
    if (deliverable) updateObject_(HAU_SHEETS.DELIVERABLES, deliverable._row, { Preferred_Canvass_ID: canvass.Canvass_ID, Updated_At: nowIso_() });
    audit_('SELECT_PREFERRED_CANVASS', 'CANVASS', canvass.Canvass_ID, user, correlationId, { notes: command.rationale });
    return recordIdempotency_(key, { canvassId: canvass.Canvass_ID, preferred: true, deliverableId: deliverable && deliverable.Deliverable_ID }, user, correlationId);
  });
}
