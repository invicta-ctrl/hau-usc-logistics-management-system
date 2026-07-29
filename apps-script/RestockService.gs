var HAU_RESTOCK_COMMITTEE_ID_ = 'COM_INVENTORY_PANTRY';
var HAU_RESTOCK_TERMINAL_STATUSES_ = Object.freeze(['RESTOCKED', 'REJECTED', 'CANCELLED']);
var HAU_RESTOCK_TRANSITIONS_ = Object.freeze({
  SEND_TO_BUDGET_REVIEW: Object.freeze({ from: ['FOR_CANVASSING'], to: 'WAITING_FOR_BUDGET', requiresPreferredQuote: true, label: 'Send to budget review', consequence: 'Records that a preferred quote is ready for budget review.' }),
  AUTHORIZE_PROCUREMENT: Object.freeze({ from: ['WAITING_FOR_BUDGET'], to: 'TO_BE_PROCURED', requiresPreferredQuote: true, label: 'Authorize procurement', consequence: 'Authorizes procurement against the recorded preferred quote.' }),
  REJECT: Object.freeze({ from: ['FOR_CANVASSING', 'WAITING_FOR_BUDGET'], to: 'REJECTED', requiresPreferredQuote: false, label: 'Reject restock line', consequence: 'Stops remaining work while preserving request history.' }),
  CANCEL: Object.freeze({ from: ['FOR_REVIEW', 'FOR_CANVASSING', 'WAITING_FOR_BUDGET', 'TO_BE_PROCURED', 'PARTIALLY_RECEIVED'], to: 'CANCELLED', requiresPreferredQuote: false, label: 'Cancel remaining work', consequence: 'Stops remaining work; prior receipts and ledger entries remain immutable.' })
});

function restockProjectionId_(requestLineId) {
  return 'RRQ-' + String(requestLineId || '').trim();
}

function restockCapability_(user, capability, fallbackFlag) {
  var resource = { committeeIds: [HAU_RESTOCK_COMMITTEE_ID_] };
  if (typeof authorizationCan_ === 'function' && typeof authorizationContractVersion_ === 'function' && authorizationContractVersion_() >= 2) {
    return authorizationCan_(user, capability, resource, { allowUnresolvedScope: false });
  }
  return canPermission_(user, fallbackFlag, resource);
}

function restockRequireCapability_(capability, fallbackFlag) {
  var resource = { committeeIds: [HAU_RESTOCK_COMMITTEE_ID_] };
  if (typeof authorizationContractVersion_ === 'function' && authorizationContractVersion_() >= 2) return requireCapability_(capability, resource, { allowUnresolvedScope: false });
  return requirePermission_(fallbackFlag, resource);
}

function restockRequestForLine_(line) {
  var request = line && findOne_(HAU_SHEETS.REQUESTS, 'Request_ID', line.Request_ID);
  if (!request || String(request.Request_Type) !== 'CATALOG_RESTOCK') throw appError_('RESTOCK_NOT_FOUND', 'The durable catalog restock line was not found.', false);
  return request;
}

function restockLineFromCommand_(command) {
  var requestLineId = requireText_(command.requestLineId || command.sourceRequestLineId, 'requestLineId');
  var line = findOne_(HAU_SHEETS.REQUEST_LINES, 'Request_Line_ID', requestLineId);
  if (!line) throw appError_('RESTOCK_NOT_FOUND', 'The durable catalog restock line was not found.', false);
  var request = restockRequestForLine_(line);
  var expectedProjectionId = restockProjectionId_(line.Request_Line_ID);
  if (command.restockRequestId && String(command.restockRequestId) !== expectedProjectionId) throw appError_('RESTOCK_ID_MISMATCH', 'The restock projection does not match the selected request line.', false);
  if (command.sourceRequestId && String(command.sourceRequestId) !== String(request.Request_ID)) throw appError_('REQUEST_MISMATCH', 'The restock request does not match the selected request line.', false);
  return { line: line, request: request, restockRequestId: expectedProjectionId };
}

function restockPreferredQuotes_(requestLineId) {
  return findAll_(HAU_SHEETS.CANVASS, function(row) {
    return String(row.Linked_Request_Line_ID) === String(requestLineId) && String(row.Status) === 'ACTIVE' && booleanValue_(row.Preferred, false);
  });
}

function restockReceiptRows_(requestLineId) {
  return findAll_(HAU_SHEETS.RESTOCK, function(row) { return String(row.Source_Request_Line_ID) === String(requestLineId); });
}

function restockReceiptTotal_(requestLineId) {
  return restockReceiptRows_(requestLineId).reduce(function(total, row) { return total + Number(row.Quantity || 0); }, 0);
}

function restockActionDecisions_(line, user, enabled, preferredCount, reconciliationRequired) {
  var current = String(line.Status || ''), canTransition = restockCapability_(user, HAU_CAPABILITIES_.FULFILL_PROCURE, 'Can_Review');
  var canReceive = restockCapability_(user, HAU_CAPABILITIES_.FULFILL_RECEIVE, 'Can_Receive');
  var decisions = Object.keys(HAU_RESTOCK_TRANSITIONS_).map(function(action) {
    var rule = HAU_RESTOCK_TRANSITIONS_[action], reason = '';
    if (!enabled) reason = 'Restock workflow writes are disabled; review remains read-only.';
    else if (reconciliationRequired) reason = 'Receipt totals require reconciliation before another action.';
    else if (!canTransition) reason = 'Your current server authorization does not permit this transition.';
    else if (rule.from.indexOf(current) < 0) reason = 'Action is not available from ' + (current || 'the current status') + '.';
    else if (rule.requiresPreferredQuote && preferredCount !== 1) reason = preferredCount > 1 ? 'Resolve the conflicting preferred quotes before this action.' : 'Select one active preferred quote before this action.';
    return { action: action, label: rule.label, consequence: rule.consequence, targetStatus: rule.to, allowed: !reason, disabledReason: reason };
  });
  var receiveReason = '';
  if (!enabled) receiveReason = 'Restock workflow writes are disabled; review remains read-only.';
  else if (reconciliationRequired) receiveReason = 'Receipt totals require reconciliation before another receipt.';
  else if (!canReceive) receiveReason = 'Your current server authorization does not permit receiving.';
  else if (['TO_BE_PROCURED', 'PARTIALLY_RECEIVED'].indexOf(current) < 0) receiveReason = 'Receiving is available only after procurement is authorized.';
  decisions.push({ action: 'RECEIVE', label: 'Receive this line', consequence: 'Appends one immutable receipt and purchase-receipt ledger entry for this line only.', targetStatus: 'PARTIALLY_RECEIVED_OR_RESTOCKED', allowed: !receiveReason, disabledReason: receiveReason });
  return decisions;
}

function restockProjectionDto_(line, request, user, includeDetail) {
  var item = findOne_(HAU_SHEETS.ITEMS, 'Item_ID', line.Item_ID), receipts = restockReceiptRows_(line.Request_Line_ID);
  var receivedTotal = receipts.reduce(function(total, row) { return total + Number(row.Quantity || 0); }, 0), requested = Number(line.Requested_Qty || 0);
  var preferred = restockPreferredQuotes_(line.Request_Line_ID), storedReceived = Number(line.Received_Qty || 0);
  var reconciliationRequired = Math.abs(storedReceived - receivedTotal) > 0.000001;
  var dto = {
    id: restockProjectionId_(line.Request_Line_ID), requestId: request.Request_ID, requestLineId: line.Request_Line_ID,
    itemId: line.Item_ID, itemName: item && item.Item_Name || line.Description || line.Item_ID,
    catalogType: request.Catalog_Type || item && item.Catalog_Type || '', quantity: requested, quantityOrdered: requested,
    receivedQuantity: receivedTotal, remainingQuantity: Math.max(0, requested - receivedTotal), unit: line.Unit || item && item.Unit || '',
    requester: request.Requester_Name || '', department: request.Department || '', neededAt: line.Needed_At || '',
    status: line.Status, workflowRevision: Number(line.Workflow_Revision || 1), assignedTo: 'Inventory and Pantry Committee',
    evidenceStatus: receipts.length ? 'Receipt recorded' : preferred.length ? 'Preferred quote recorded' : 'Missing',
    preferredQuoteCount: preferred.length, reconciliationRequired: reconciliationRequired,
    workflowEnabled: resolveRestockWorkflowEnabled_(), createdAt: line.Created_At, updatedAt: line.Updated_At
  };
  dto.allowedActions = restockActionDecisions_(line, user, dto.workflowEnabled, preferred.length, reconciliationRequired);
  if (!includeDetail) return dto;
  dto.preferredQuote = preferred.length === 1 ? { id: preferred[0].Canvass_ID, supplierName: preferred[0].Supplier_Name, price: Number(preferred[0].Price || 0), unit: preferred[0].Unit, checkedAt: preferred[0].Checked_At } : null;
  dto.receipts = receipts.map(function(row) { return { id: row.Restock_ID, quantity: Number(row.Quantity || 0), unit: row.Unit, invoiceStatus: row.Invoice_Status, invoiceNumber: row.Invoice_Number, status: row.Status, receivedAt: row.Received_At }; });
  dto.timeline = findAll_(HAU_SHEETS.HISTORY, function(row) { return String(row.Entity_Type) === 'REQUEST_LINE' && String(row.Entity_ID) === String(line.Request_Line_ID); }).map(function(row) { return { id: row.History_ID, previousStatus: row.Previous_Status, status: row.New_Status, changedAt: row.Changed_At, reason: row.Reason }; }).sort(function(a, b) { return String(a.changedAt).localeCompare(String(b.changedAt)); });
  return dto;
}

function restockQueueDtos_(user) {
  user = user || resolveCurrentUser_();
  var requests = readObjects_(HAU_SHEETS.REQUESTS).filter(function(row) { return String(row.Request_Type) === 'CATALOG_RESTOCK'; });
  var requestMap = {}; requests.forEach(function(row) { requestMap[String(row.Request_ID)] = row; });
  return readObjects_(HAU_SHEETS.REQUEST_LINES).filter(function(line) { return Boolean(requestMap[String(line.Request_ID)]); }).map(function(line) { return restockProjectionDto_(line, requestMap[String(line.Request_ID)], user, false); });
}

function getRestockDetail_(command) {
  var record = restockLineFromCommand_(command), user = restockRequireCapability_(HAU_CAPABILITIES_.VIEW_REQUEST, 'Can_Review');
  return { restock: restockProjectionDto_(record.line, record.request, user, true) };
}

function transitionRestock_(command, correlationId) {
  return withScriptLock_(function() {
    var key = requireIdempotency_(command), replay = idempotencyReplay_(key);
    if (replay) return Object.assign({ idempotentReplay: true }, replay);
    if (!resolveRestockWorkflowEnabled_()) throw appError_('FEATURE_DISABLED', 'Restock workflow writes are disabled.', false, { feature: 'HAU_RESTOCK_WORKFLOW_ENABLED' });
    var user = restockRequireCapability_(HAU_CAPABILITIES_.FULFILL_PROCURE, 'Can_Review'), record = restockLineFromCommand_(command);
    var line = record.line, action = requireText_(command.action, 'action').toUpperCase(), rule = HAU_RESTOCK_TRANSITIONS_[action];
    if (!rule) throw appError_('RESTOCK_ACTION_INVALID', 'Choose an approved restock action.', false);
    if (HAU_RESTOCK_TERMINAL_STATUSES_.indexOf(String(line.Status)) >= 0 || rule.from.indexOf(String(line.Status)) < 0) throw appError_('INVALID_TRANSITION', 'This restock action is not allowed from the current status.', false, { currentStatus: line.Status, action: action });
    var expectedRevision = Number(command.expectedRevision), currentRevision = Number(line.Workflow_Revision || 1);
    if (!Number.isInteger(expectedRevision) || expectedRevision !== currentRevision) throw appError_('REVISION_CONFLICT', 'The restock line changed. Refresh before acting.', false, { expectedRevision: expectedRevision, currentRevision: currentRevision });
    var reason = requireText_(command.reason, 'reason').slice(0, 500), preferred = restockPreferredQuotes_(line.Request_Line_ID);
    if (rule.requiresPreferredQuote && preferred.length !== 1) throw appError_('PREFERRED_QUOTE_REQUIRED', preferred.length > 1 ? 'Resolve the conflicting preferred quotes first.' : 'Select one active preferred quote first.', false);
    if (Math.abs(Number(line.Received_Qty || 0) - restockReceiptTotal_(line.Request_Line_ID)) > 0.000001) throw appError_('RESTOCK_RECONCILIATION_REQUIRED', 'Receipt totals require reconciliation before another action.', false);
    var now = nowIso_(), nextRevision = currentRevision + 1;
    updateObject_(HAU_SHEETS.REQUEST_LINES, line._row, { Status: rule.to, Workflow_Revision: nextRevision, Updated_At: now });
    history_('REQUEST_LINE', line.Request_Line_ID, line.Status, rule.to, user, reason, { requestId: line.Request_ID, idempotencyKey: key, metadata: { action: action, workflowRevision: nextRevision, preferredCanvassId: preferred.length === 1 ? preferred[0].Canvass_ID : '' } });
    var requestStatus = deriveParentRequestStatus_(line.Request_ID), request = record.request;
    if (String(request.Status) !== requestStatus) {
      updateObject_(HAU_SHEETS.REQUESTS, request._row, { Status: requestStatus, Updated_At: now });
      history_('REQUEST', request.Request_ID, request.Status, requestStatus, user, 'Derived after restock transition', { requestId: request.Request_ID, idempotencyKey: key });
    }
    audit_('TRANSITION_RESTOCK', 'REQUEST_LINE', line.Request_Line_ID, user, correlationId, { before: { status: line.Status, workflowRevision: currentRevision }, after: { status: rule.to, workflowRevision: nextRevision, action: action }, requestId: line.Request_ID, notes: reason });
    return recordIdempotency_(key, { restockRequestId: record.restockRequestId, requestId: line.Request_ID, requestLineId: line.Request_Line_ID, status: rule.to, workflowRevision: nextRevision, entityType: 'REQUEST_LINE', entityId: line.Request_Line_ID }, user, correlationId);
  });
}

function receiveRestock_(command, correlationId) {
  return withScriptLock_(function() {
    var key = requireIdempotency_(command), replay = idempotencyReplay_(key);
    if (replay) return Object.assign({ idempotentReplay: true }, replay);
    if (!resolveRestockWorkflowEnabled_()) throw appError_('FEATURE_DISABLED', 'Restock workflow writes are disabled.', false, { feature: 'HAU_RESTOCK_WORKFLOW_ENABLED' });
    var user = restockRequireCapability_(HAU_CAPABILITIES_.FULFILL_RECEIVE, 'Can_Receive'), record = restockLineFromCommand_(command), line = record.line;
    if (['TO_BE_PROCURED', 'PARTIALLY_RECEIVED'].indexOf(String(line.Status)) < 0) throw appError_('INVALID_TRANSITION', 'This restock line is not ready for receiving.', false, { currentStatus: line.Status });
    var expectedRevision = Number(command.expectedRevision), currentRevision = Number(line.Workflow_Revision || 1);
    if (!Number.isInteger(expectedRevision) || expectedRevision !== currentRevision) throw appError_('REVISION_CONFLICT', 'The restock line changed. Refresh before receiving.', false, { expectedRevision: expectedRevision, currentRevision: currentRevision });
    var item = itemById_(requireText_(command.itemId, 'itemId')); assertTransactableItem_(item);
    if (String(line.Item_ID) !== String(item.Item_ID)) throw appError_('ITEM_MISMATCH', 'The receipt item does not match the linked restock line.', false);
    var authorizedUnit = requireText_(line.Unit || item.Unit, 'line.unit'), itemUnit = requireText_(item.Unit, 'item.unit');
    if (authorizedUnit.toLowerCase() !== itemUnit.toLowerCase()) throw appError_('RESTOCK_RECONCILIATION_REQUIRED', 'The linked line unit no longer matches the catalog unit.', false);
    var receiptUnit = requireText_(command.unit || authorizedUnit, 'unit');
    if (receiptUnit.toLowerCase() !== authorizedUnit.toLowerCase()) throw appError_('UNIT_MISMATCH', 'The receipt unit must match the linked restock line.', false, { expectedUnit: authorizedUnit });
    var quantity = positiveNumber_(command.quantity || command.quantityReceivedNow, 'quantity'), immutableTotal = restockReceiptTotal_(line.Request_Line_ID);
    if (Math.abs(Number(line.Received_Qty || 0) - immutableTotal) > 0.000001) throw appError_('RESTOCK_RECONCILIATION_REQUIRED', 'Receipt totals require reconciliation before another receipt.', false);
    var receivedTotal = immutableTotal + quantity, requested = Number(line.Requested_Qty || 0);
    if (receivedTotal > requested) throw appError_('OVER_RECEIPT', 'Receipt exceeds the requested line quantity.', false, { required: requested, received: receivedTotal });
    var nextLineStatus = receivedTotal === requested ? 'RESTOCKED' : 'PARTIALLY_RECEIVED', restockId = allocateId_('RST'), evidenceId = '';
    if (command.evidence) evidenceId = uploadEvidence_(Object.assign({}, command.evidence, {
      evidenceType: command.invoiceStatus === 'SALES_INVOICE' ? 'RESTOCK_INVOICE' : 'RESTOCK_RECEIPT',
      relatedEntityType: 'RESTOCK', relatedEntityId: restockId, itemId: item.Item_ID, secondaryId: item.Item_ID,
      requestId: line.Request_ID, requestLineId: line.Request_Line_ID, clientRequestId: key + ':evidence'
    }), correlationId).evidenceId;
    var unitPrice = nonNegativeNumber_(command.unitPrice, 'unitPrice');
    var exceptionNotes = [command.notes, command.shortageNote, command.backorderNote, command.substitutionNote,
      command.quantityDamaged && 'Damaged: ' + command.quantityDamaged,
      command.quantityRejected && 'Rejected: ' + command.quantityRejected,
      command.batchNumber && 'Batch: ' + command.batchNumber,
      command.expiryDate && 'Expiry: ' + command.expiryDate].filter(Boolean).join(' | ');
    var now = nowIso_(), row = {
      Restock_ID: restockId, Created_At: now, Updated_At: now, Source_Request_ID: line.Request_ID,
      Source_Request_Line_ID: line.Request_Line_ID, Item_ID: item.Item_ID, Quantity: quantity, Unit: authorizedUnit,
      Supplier_ID: command.supplierId || '', Supplier_Name: command.supplierName || '', Unit_Price: unitPrice,
      Total_Amount: quantity * unitPrice, Invoice_Status: command.invoiceStatus || 'UNKNOWN', Invoice_Number: command.invoiceNumber || '',
      Supplier_TIN: command.supplierTin || '', Storage_Area: command.storageArea || item.Stock_Area, Storage_Location: command.storageLocation || '',
      Evidence_ID: evidenceId, Requested_At: record.request.Created_At || '', Received_At: now, Received_By: user.User_ID,
      Status: nextLineStatus, Idempotency_Key: key, Notes: exceptionNotes
    };
    appendObject_(HAU_SHEETS.RESTOCK, row);
    var tx = appendLedger_({ type: 'PURCHASE_RECEIPT', direction: 'IN', itemId: item.Item_ID, quantity: quantity, unit: row.Unit, relatedEntityType: 'RESTOCK', relatedEntityId: restockId, requestId: line.Request_ID, idempotencyKey: key, notes: row.Notes }, user);
    var nextRevision = currentRevision + 1;
    updateObject_(HAU_SHEETS.REQUEST_LINES, line._row, { Received_Qty: receivedTotal, Status: nextLineStatus, Workflow_Revision: nextRevision, Updated_At: now });
    history_('REQUEST_LINE', line.Request_Line_ID, line.Status, nextLineStatus, user, 'Catalog restock receipt', { requestId: line.Request_ID, idempotencyKey: key, metadata: { restockId: restockId, quantityReceivedNow: quantity, quantityReceivedTotal: receivedTotal, workflowRevision: nextRevision } });
    var requestStatus = deriveParentRequestStatus_(line.Request_ID), request = record.request;
    if (String(request.Status) !== requestStatus) {
      updateObject_(HAU_SHEETS.REQUESTS, request._row, { Status: requestStatus, Updated_At: now });
      history_('REQUEST', request.Request_ID, request.Status, requestStatus, user, 'Derived after line receipt', { requestId: request.Request_ID, idempotencyKey: key });
    }
    audit_('RECEIVE_RESTOCK', 'RESTOCK', restockId, user, correlationId, { after: row, requestId: line.Request_ID, notes: 'Linked only to ' + line.Request_Line_ID });
    return recordIdempotency_(key, { restockId: restockId, restockRequestId: record.restockRequestId, requestId: line.Request_ID, requestLineId: line.Request_Line_ID, transactionId: tx.Transaction_ID, evidenceId: evidenceId, quantityReceivedTotal: receivedTotal, quantityRemaining: requested - receivedTotal, status: nextLineStatus, workflowRevision: nextRevision }, user, correlationId);
  });
}
