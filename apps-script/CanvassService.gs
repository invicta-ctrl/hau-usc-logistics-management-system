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
    var row = { Canvass_ID: id, Created_At: nowIso_(), Updated_At: nowIso_(), Linked_Request_Line_ID: linkedLineId, Linked_Deliverable_ID: linkedDeliverableId, Linked_Restock_ID: command.linkedRestockId || '', Supplier_ID: supplier.Supplier_ID, Supplier_Name: supplier.Supplier_Name, Location: command.location || supplier.Location, Item_Spec: requireText_(command.itemSpec, 'itemSpec'), Price: nonNegativeNumber_(command.price, 'price'), Unit: requireText_(command.unit, 'unit'), Receipt_Status: command.receiptStatus || 'NOT_CHECKED', Supplier_TIN: command.supplierTin || '', Reliability: command.reliability || 'UNRATED', Checked_At: command.checkedAt || nowIso_(), Source_URL: safeCanvassSourceUrl_(command.sourceUrl), Evidence_ID: evidenceId, Preferred: false, Status: 'ACTIVE', Created_By: user.User_ID, Price_History_JSON: safeJson_([{ price: Number(command.price), checkedAt: command.checkedAt || nowIso_() }]), Idempotency_Key: key, Notes: command.notes || '' };
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

function safeCanvassSourceUrl_(value) {
  var url=String(value||'').trim();if(!url)return'';
  if(!/^https:\/\//i.test(url))throw appError_('UNSAFE_SOURCE_URL','Canvass source URLs must use HTTPS.',false,{field:'sourceUrl'});
  return url.slice(0,1000);
}

function updateCanvassReference_(command,correlationId){return withScriptLock_(function(){var user=requirePermission_('Can_Receive'),key=requireIdempotency_(command),replay=idempotencyReplay_(key,user);if(replay)return Object.assign({idempotentReplay:true},replay);var row=findOne_(HAU_SHEETS.CANVASS,'Canvass_ID',requireText_(command.canvassId,'canvassId'));if(!row)throw appError_('CANVASS_NOT_FOUND','Canvass reference was not found.',false);if(String(row.Status)==='ARCHIVED')throw appError_('CANVASS_ARCHIVED','Restore this canvass reference before editing it.',false);var patch={},history=[];try{history=JSON.parse(row.Price_History_JSON||'[]');}catch(ignored){}if(Object.prototype.hasOwnProperty.call(command,'price')){patch.Price=nonNegativeNumber_(command.price,'price');history.push({price:patch.Price,checkedAt:command.checkedAt||nowIso_(),changedBy:user.User_ID});patch.Price_History_JSON=safeJson_(history.slice(-100));}if(Object.prototype.hasOwnProperty.call(command,'itemSpec'))patch.Item_Spec=requireText_(command.itemSpec,'itemSpec');if(Object.prototype.hasOwnProperty.call(command,'unit'))patch.Unit=requireText_(command.unit,'unit');if(Object.prototype.hasOwnProperty.call(command,'location'))patch.Location=String(command.location||'').slice(0,250);if(Object.prototype.hasOwnProperty.call(command,'receiptStatus'))patch.Receipt_Status=String(command.receiptStatus||'NOT_CHECKED').slice(0,80);if(Object.prototype.hasOwnProperty.call(command,'reliability'))patch.Reliability=String(command.reliability||'UNRATED').slice(0,80);if(Object.prototype.hasOwnProperty.call(command,'checkedAt'))patch.Checked_At=String(command.checkedAt||'');if(Object.prototype.hasOwnProperty.call(command,'sourceUrl'))patch.Source_URL=safeCanvassSourceUrl_(command.sourceUrl);if(Object.prototype.hasOwnProperty.call(command,'notes'))patch.Notes=String(command.notes||'').slice(0,1000);patch.Updated_At=nowIso_();var after=Object.assign({},row,patch);updateObject_(HAU_SHEETS.CANVASS,row._row,patch);audit_('UPDATE_CANVASS','CANVASS',row.Canvass_ID,user,correlationId,{before:{price:row.Price,status:row.Status,checkedAt:row.Checked_At},after:{price:after.Price,status:after.Status,checkedAt:after.Checked_At},notes:command.reason||''});return recordIdempotency_(key,{canvassId:row.Canvass_ID,status:after.Status,entityType:'CANVASS',entityId:row.Canvass_ID},user,correlationId);});}

function archiveCanvassReference_(command,correlationId){return withScriptLock_(function(){var user=requirePermission_('Can_Receive'),key=requireIdempotency_(command),replay=idempotencyReplay_(key,user);if(replay)return Object.assign({idempotentReplay:true},replay);var row=findOne_(HAU_SHEETS.CANVASS,'Canvass_ID',requireText_(command.canvassId,'canvassId'));if(!row)throw appError_('CANVASS_NOT_FOUND','Canvass reference was not found.',false);if(String(row.Status)==='ARCHIVED')throw appError_('INVALID_TRANSITION','This canvass reference is already archived.',false);var reason=requireText_(command.reason,'reason');updateObject_(HAU_SHEETS.CANVASS,row._row,{Status:'ARCHIVED',Preferred:false,Updated_At:nowIso_(),Notes:[row.Notes,reason].filter(Boolean).join(' | ')});if(row.Linked_Deliverable_ID){var deliverable=findOne_(HAU_SHEETS.DELIVERABLES,'Deliverable_ID',row.Linked_Deliverable_ID);if(deliverable&&String(deliverable.Preferred_Canvass_ID)===String(row.Canvass_ID))updateObject_(HAU_SHEETS.DELIVERABLES,deliverable._row,{Preferred_Canvass_ID:'',Updated_At:nowIso_()});}history_('CANVASS',row.Canvass_ID,row.Status,'ARCHIVED',user,reason,{idempotencyKey:key});audit_('ARCHIVE_CANVASS','CANVASS',row.Canvass_ID,user,correlationId,{before:{status:row.Status,preferred:row.Preferred},after:{status:'ARCHIVED',preferred:false},notes:reason});return recordIdempotency_(key,{canvassId:row.Canvass_ID,status:'ARCHIVED',entityType:'CANVASS',entityId:row.Canvass_ID},user,correlationId);});}

function restoreCanvassReference_(command,correlationId){return withScriptLock_(function(){var user=requirePermission_('Can_Receive'),key=requireIdempotency_(command),replay=idempotencyReplay_(key,user);if(replay)return Object.assign({idempotentReplay:true},replay);var row=findOne_(HAU_SHEETS.CANVASS,'Canvass_ID',requireText_(command.canvassId,'canvassId'));if(!row)throw appError_('CANVASS_NOT_FOUND','Canvass reference was not found.',false);if(String(row.Status)!=='ARCHIVED')throw appError_('INVALID_TRANSITION','Only archived canvass references may be restored.',false);updateObject_(HAU_SHEETS.CANVASS,row._row,{Status:'ACTIVE',Preferred:false,Updated_At:nowIso_()});history_('CANVASS',row.Canvass_ID,'ARCHIVED','ACTIVE',user,command.reason||'Canvass restored',{idempotencyKey:key});audit_('RESTORE_CANVASS','CANVASS',row.Canvass_ID,user,correlationId,{after:{status:'ACTIVE',preferred:false},notes:command.reason||''});return recordIdempotency_(key,{canvassId:row.Canvass_ID,status:'ACTIVE',entityType:'CANVASS',entityId:row.Canvass_ID},user,correlationId);});}
