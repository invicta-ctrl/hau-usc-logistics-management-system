function createDeliverableForLine_(request, line, user) {
  var existing = findOne_(HAU_SHEETS.DELIVERABLES, 'Request_Line_ID', line.Request_Line_ID);
  if (existing) return existing;
  var row = {
    Deliverable_ID: allocateId_('DEL'), Created_At: nowIso_(), Updated_At: nowIso_(),
    Request_ID: request.Request_ID, Request_Line_ID: line.Request_Line_ID, Event_Series_ID: request.Event_Series_ID,
    Event_ID: request.Event_ID, Inventory_Match_ID: line.Item_ID || '', Event_Item_ID: '', Item_Spec: line.Description,
    Quantity_Requested: line.Requested_Qty, Quantity_Received: 0, Quantity_Released: 0, Unit: line.Unit,
    Fulfillment_Source: 'PROCUREMENT', Assigned_Committee: defaultCommittee_(line.Category), Assigned_Staff: '',
    Preferred_Canvass_ID: '', Budget_Status: 'NOT_STARTED', Procurement_Status: 'FOR_CANVASSING',
    Receipt_Status: 'MISSING', Evidence_ID: '', Needed_At: line.Needed_At, Status: 'FOR_CANVASSING',
    Created_By: user.User_ID, Notes: ''
  };
  appendObject_(HAU_SHEETS.DELIVERABLES, row);
  return row;
}

function defaultCommittee_(category) {
  var value = String(category || '').toLowerCase();
  if (/food|pantry|catering/.test(value)) return 'Food Committee';
  if (/equipment|inventory/.test(value)) return 'Inventory Committee';
  return 'Materials Committee';
}

var DELIVERABLE_TRANSITIONS_ = Object.freeze({
  FOR_CANVASSING: ['WAITING_FOR_BUDGET', 'CANCELLED'], WAITING_FOR_BUDGET: ['TO_BE_PROCURED', 'CANCELLED'],
  TO_BE_PROCURED: ['PROCURED', 'CANCELLED'], PROCURED: ['PARTIALLY_RECEIVED', 'READY_TO_RELEASE', 'CANCELLED'],
  PARTIALLY_RECEIVED: ['READY_TO_RELEASE', 'CANCELLED'], READY_TO_RELEASE: ['PARTIALLY_RELEASED', 'COMPLETED'],
  PARTIALLY_RELEASED: ['COMPLETED']
});

function validateDeliverableReceiptState_(status) {
  var current = String(status || '').toUpperCase();
  if (['PROCURED', 'PARTIALLY_RECEIVED'].indexOf(current) < 0) {
    throw appError_('INVALID_TRANSITION', 'Only procured or partially received deliverables can be received.', false);
  }
  return current;
}

function transitionDeliverable_(command, correlationId) {
  return withScriptLock_(function() {
    var user = requirePermission_('Can_Receive'), key = requireIdempotency_(command), replay = idempotencyReplay_(key);
    if (replay) return Object.assign({ idempotentReplay: true }, replay);
    var row = findOne_(HAU_SHEETS.DELIVERABLES, 'Deliverable_ID', requireText_(command.deliverableId, 'deliverableId'));
    if (!row) throw appError_('DELIVERABLE_NOT_FOUND', 'Deliverable was not found.', false);
    var next = requireText_(command.status, 'status').toUpperCase(), allowed = DELIVERABLE_TRANSITIONS_[String(row.Status)] || [];
    if (allowed.indexOf(next) < 0) throw appError_('INVALID_TRANSITION', 'Deliverable cannot move from ' + row.Status + ' to ' + next + '.', false, { allowed: allowed });
    if (next === 'WAITING_FOR_BUDGET' && !row.Preferred_Canvass_ID) throw appError_('CANVASS_REQUIRED', 'Choose a preferred canvass before budget routing.', false);
    updateObject_(HAU_SHEETS.DELIVERABLES, row._row, { Status: next, Procurement_Status: next, Assigned_Committee: command.assignedCommittee || row.Assigned_Committee, Assigned_Staff: command.assignedStaff || row.Assigned_Staff, Updated_At: nowIso_(), Notes: [row.Notes, command.note].filter(Boolean).join(' | ') });
    history_('DELIVERABLE', row.Deliverable_ID, row.Status, next, user, command.note || 'Workflow transition', { requestId: row.Request_ID, eventId: row.Event_ID, idempotencyKey: key });
    audit_('TRANSITION_DELIVERABLE', 'DELIVERABLE', row.Deliverable_ID, user, correlationId, { before: { status: row.Status }, after: { status: next }, requestId: row.Request_ID, eventId: row.Event_ID, notes: command.note });
    return recordIdempotency_(key, { deliverableId: row.Deliverable_ID, status: next }, user, correlationId);
  });
}

function receiveDeliverable_(command, correlationId) {
  return withScriptLock_(function() {
    var user = requirePermission_('Can_Receive'), key = requireIdempotency_(command), replay = idempotencyReplay_(key);
    if (replay) return Object.assign({ idempotentReplay: true }, replay);
    var deliverable = findOne_(HAU_SHEETS.DELIVERABLES, 'Deliverable_ID', requireText_(command.deliverableId, 'deliverableId'));
    if (!deliverable) throw appError_('DELIVERABLE_NOT_FOUND', 'Deliverable was not found.', false);
    validateDeliverableReceiptState_(deliverable.Status);
    var receivedNow = positiveNumber_(command.quantity || command.quantityReceivedNow, 'quantity');
    var receivedTotal = Number(deliverable.Quantity_Received || 0) + receivedNow, required = Number(deliverable.Quantity_Requested || 0);
    if (receivedTotal > required && !command.authorizedAmendment) throw appError_('OVER_RECEIPT', 'Receipt exceeds the approved deliverable quantity.', false, { required: required, received: receivedTotal });
    var eventItemId = deliverable.Event_Item_ID || allocateEventItemId_(deliverable.Event_ID);
    var next = receivedTotal >= required ? 'READY_TO_RELEASE' : 'PARTIALLY_RECEIVED', evidenceId = '';
    if (command.evidence) evidenceId = uploadEvidence_(Object.assign({}, command.evidence, { evidenceType: 'DELIVERABLE_RECEIPT', relatedEntityType: 'DELIVERABLE', relatedEntityId: deliverable.Deliverable_ID, requestId: deliverable.Request_ID, requestLineId: deliverable.Request_Line_ID, eventId: deliverable.Event_ID, eventItemId: eventItemId, secondaryId: eventItemId, clientRequestId: key + ':evidence' }), correlationId).evidenceId;
    updateObject_(HAU_SHEETS.DELIVERABLES, deliverable._row, { Event_Item_ID: eventItemId, Quantity_Received: receivedTotal, Receipt_Status: command.receiptStatus || 'RECEIVED', Evidence_ID: evidenceId || deliverable.Evidence_ID, Status: next, Procurement_Status: next, Updated_At: nowIso_(), Notes: [deliverable.Notes, command.shortageNote, command.substitutionNote, command.condition, command.batchExpiry, command.notes].filter(Boolean).join(' | ') });
    var line = findOne_(HAU_SHEETS.REQUEST_LINES, 'Request_Line_ID', deliverable.Request_Line_ID);
    if (line) {
      updateObject_(HAU_SHEETS.REQUEST_LINES, line._row, { Event_Item_ID: eventItemId, Received_Qty: receivedTotal, Status: next, Updated_At: nowIso_() });
      history_('REQUEST_LINE', line.Request_Line_ID, line.Status, next, user, 'Deliverable receipt', { requestId: line.Request_ID, eventId: line.Event_ID, idempotencyKey: key, metadata: { quantityReceivedNow: receivedNow, quantityReceivedTotal: receivedTotal } });
    }
    var tx = appendLedger_({ type: 'PURCHASE_RECEIPT', direction: 'IN', eventItemId: eventItemId, quantity: receivedNow, unit: deliverable.Unit, relatedEntityType: 'DELIVERABLE', relatedEntityId: deliverable.Deliverable_ID, requestId: deliverable.Request_ID, eventId: deliverable.Event_ID, idempotencyKey: key, notes: command.notes || '' }, user);
    audit_('RECEIVE_DELIVERABLE', 'DELIVERABLE', deliverable.Deliverable_ID, user, correlationId, { after: { quantityReceivedNow: receivedNow, quantityReceivedTotal: receivedTotal, eventItemId: eventItemId }, requestId: deliverable.Request_ID, eventId: deliverable.Event_ID });
    return recordIdempotency_(key, { deliverableId: deliverable.Deliverable_ID, eventItemId: eventItemId, receivedTotal: receivedTotal, status: next, transactionId: tx.Transaction_ID, evidenceId: evidenceId }, user, correlationId);
  });
}

var CONTROLLED_TRANSFER_CATEGORIES_ = Object.freeze(['OFFICE_SUPPLIES', 'EVENT_MATERIALS', 'FOOD_PANTRY', 'EQUIPMENT', 'PRINTING_SIGNAGE', 'REUSABLE_MATERIALS']);
function controlledCategory_(value) {
  var text = String(value || '').toUpperCase().replace(/&/g, ' AND ').replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '');
  if (/FOOD|PANTRY|CATER/.test(text)) return 'FOOD_PANTRY';
  if (/EQUIP|DEVICE|TOOL/.test(text)) return 'EQUIPMENT';
  if (/PRINT|SIGN|TARPAULIN/.test(text)) return 'PRINTING_SIGNAGE';
  if (/REUS|FABRIC|DECOR/.test(text)) return 'REUSABLE_MATERIALS';
  if (/OFFICE|STATIONERY/.test(text)) return 'OFFICE_SUPPLIES';
  return 'EVENT_MATERIALS';
}

function transferEventItemToInventory_(command, correlationId) {
  return withScriptLock_(function() {
    var user = requirePermission_('Can_Admin'), key = requireIdempotency_(command), replay = idempotencyReplay_(key);
    if (replay) return Object.assign({ idempotentReplay: true }, replay);
    var deliverable = command.deliverableId ? findOne_(HAU_SHEETS.DELIVERABLES, 'Deliverable_ID', command.deliverableId) : null;
    var eventItemId = requireText_(command.eventItemId || deliverable && deliverable.Event_Item_ID, 'eventItemId');
    var line = deliverable && findOne_(HAU_SHEETS.REQUEST_LINES, 'Request_Line_ID', deliverable.Request_Line_ID);
    var sourceCategory = controlledCategory_(line && line.Category || command.category), sourceHandling = requireText_(command.handling, 'handling').toUpperCase(), target, isNew = Boolean(command.createNew);
    if (isNew) {
      var category = controlledCategory_(command.category);
      if (CONTROLLED_TRANSFER_CATEGORIES_.indexOf(category) < 0) throw appError_('CATEGORY_REQUIRED', 'Choose a controlled destination category.', false);
      target = { Item_ID: allocateId_('ITM', { year: false }), Item_Name: requireText_(command.newItemName, 'newItemName'), Aliases: '', Category: category, Stock_Area: command.destinationArea || 'Inventory', Handling: command.handling, Unit: requireText_(command.unit, 'unit'), Opening_Qty: 0, Reserved_Qty: 0, Available_To_Promise: 0, Status: 'ACTIVE', Legacy_Source_Sheet: 'EVENT_TRANSFER', Legacy_Source_Row: '', Legacy_Source_Block: eventItemId, Verification_Note: 'Created from ' + eventItemId };
    } else {
      target = itemById_(requireText_(command.destinationItemId, 'destinationItemId')); assertTransactableItem_(target);
      if (controlledCategory_(target.Category) !== sourceCategory || String(target.Handling || '').toUpperCase() !== sourceHandling) throw appError_('DESTINATION_INCOMPATIBLE', 'Destination category or handling is incompatible with the event item.', false, { sourceCategory: sourceCategory, destinationCategory: controlledCategory_(target.Category), sourceHandling: sourceHandling, destinationHandling: target.Handling });
    }
    var quantity = positiveNumber_(command.quantity, 'quantity'), balance = eventOnHand_(eventItemId);
    if (quantity > balance) throw appError_('INSUFFICIENT_EVENT_BALANCE', 'Only ' + balance + ' ' + target.Unit + ' remain in this event item.', false, { balance: balance });
    if (String(command.unit) !== String(target.Unit)) throw appError_('UNIT_MISMATCH', 'Destination unit is incompatible.', false);
    if (!command.semanticConfirmed || !(command.mergeReason || command.notes)) throw appError_('MERGE_CONFIRMATION_REQUIRED', 'Semantic match confirmation and merge reason are required.', false);
    if (isNew) appendObject_(HAU_SHEETS.ITEMS, target);
    var reason = command.mergeReason || command.notes, mappingId = allocateId_('MAP');
    var out = ledgerRow_({ type: 'TRANSFER_OUT_EVENT', direction: 'OUT', eventItemId: eventItemId, quantity: quantity, unit: target.Unit, relatedEntityType: 'TRANSFER_MAP', relatedEntityId: mappingId, idempotencyKey: key + ':out', notes: reason }, user);
    var inside = ledgerRow_({ type: 'TRANSFER_IN_INVENTORY', direction: 'IN', itemId: target.Item_ID, eventItemId: eventItemId, quantity: quantity, unit: target.Unit, relatedEntityType: 'TRANSFER_MAP', relatedEntityId: mappingId, idempotencyKey: key + ':in', notes: reason }, user);
    appendObjects_(HAU_SHEETS.LEDGER, [out, inside]);
    audit_('TRANSFER_EVENT_ITEM', 'EVENT_ITEM', eventItemId, user, correlationId, { after: { mappingId: mappingId, destinationItemId: target.Item_ID, outTransactionId: out.Transaction_ID, inTransactionId: inside.Transaction_ID, provenance: eventItemId }, notes: reason });
    return recordIdempotency_(key, { mappingId: mappingId, outTransactionId: out.Transaction_ID, inTransactionId: inside.Transaction_ID, destinationItemId: target.Item_ID }, user, correlationId);
  });
}
