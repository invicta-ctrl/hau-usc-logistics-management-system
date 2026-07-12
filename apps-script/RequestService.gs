function submitRequest_(command, correlationId) {
  return withScriptLock_(function() {
    requireObject_(command, 'Request');
    var key = requireIdempotency_(command), replay = idempotencyReplay_(key);
    if (replay) return Object.assign({ idempotentReplay: true }, replay);
    var user = resolveRequesterUser_(), lines = command.lines || [];
    if (!lines.length) throw appError_('VALIDATION_ERROR', 'Add at least one request line.', false);
    var requestId = allocateId_('LREQ'), now = nowIso_();
    var request = {
      Request_ID: requestId, Created_At: now, Updated_At: now,
      Request_Type: command.requestType || command.type || 'EVENT_LOGISTICS',
      Request_Stage: command.requestStage || 'INITIAL', Parent_Request_ID: command.parentRequestId || '',
      Additional_Sequence: Number(command.additionalSequence || 0), Event_Series_ID: command.eventSeriesId || '',
      Event_ID: command.eventId || '', Catalog_Type: command.catalogType || '',
      Requester_Name: requireText_(command.requesterName, 'requesterName'),
      Requester_Email: String(command.requesterEmail || user.Email || ''),
      Department: requireText_(command.department, 'department'), Priority: command.priority || 'ROUTINE',
      Purpose: requireText_(command.purpose, 'purpose'), Status: 'FOR_REVIEW', Created_By: user.User_ID || 'PUBLIC',
      Client_Request_ID: key, Archived_At: '', Notes: command.notes || ''
    };
    var lineRows = lines.map(function(line) {
      var item = line.itemId ? itemById_(line.itemId) : null;
      return {
        Request_Line_ID: allocateId_('RL'), Request_ID: requestId, Event_ID: request.Event_ID,
        Item_ID: item ? item.Item_ID : '', Event_Item_ID: '',
        Description: requireText_(line.description, 'line.description'), Specification: line.specification || '',
        Category: line.category || item && item.Category || 'TO_CLASSIFY',
        Requested_Qty: positiveNumber_(line.quantity, 'line.quantity'), Unit: line.unit || item && item.Unit || '',
        Fulfillment_Source: 'PENDING_REVIEW', Split_Group_ID: line.splitGroupId || '',
        Needed_At: line.neededAt || '', Return_Due: line.returnDue || '', Lead_Time_Rule: line.leadTimeRule || '',
        Suggested_Supplier: line.suggestedSupplier || '', Released_Qty: 0, Received_Qty: 0,
        Status: 'FOR_REVIEW', Created_At: now, Updated_At: now, Created_By: user.User_ID || 'PUBLIC',
        Client_Line_ID: line.clientLineId || Utilities.getUuid(), Notes: line.notes || ''
      };
    });
    appendObject_(HAU_SHEETS.REQUESTS, request);
    appendObjects_(HAU_SHEETS.REQUEST_LINES, lineRows);
    history_('REQUEST', requestId, '', 'FOR_REVIEW', user, 'Submitted', { idempotencyKey: key });
    audit_('SUBMIT_REQUEST', 'REQUEST', requestId, user, correlationId, { after: request, requestId: requestId });
    return recordIdempotency_(key, { requestId: requestId, lineIds: lineRows.map(function(line) { return line.Request_Line_ID; }), entityType: 'REQUEST', entityId: requestId }, user, correlationId);
  });
}

function planRequestAcceptance_(request, lines) {
  var remainingByItem = {}, plans = [];
  lines.forEach(function(line) {
    if (request.Request_Type === 'CATALOG_RESTOCK') {
      if (!line.Item_ID) throw appError_('ITEM_REQUIRED', 'Catalog restock lines must reference an item.', false, { requestLineId: line.Request_Line_ID });
      assertTransactableItem_(itemById_(line.Item_ID));
      plans.push({ line: line, kind: 'RESTOCK' });
      return;
    }
    if (!line.Item_ID) { plans.push({ line: line, kind: 'PROCUREMENT' }); return; }
    var item = itemById_(line.Item_ID); assertTransactableItem_(item);
    if (!Object.prototype.hasOwnProperty.call(remainingByItem, item.Item_ID)) remainingByItem[item.Item_ID] = availableToPromise_(item.Item_ID);
    var requested = Number(line.Requested_Qty), stock = Math.min(requested, Math.max(0, remainingByItem[item.Item_ID]));
    remainingByItem[item.Item_ID] -= stock;
    if (stock === requested) plans.push({ line: line, kind: 'STOCK', stock: stock });
    else if (stock > 0) plans.push({ line: line, kind: 'SPLIT', stock: stock, procurement: requested - stock });
    else plans.push({ line: line, kind: 'PROCUREMENT' });
  });
  return plans;
}

function applyAcceptancePlan_(request, plans, user, key) {
  plans.forEach(function(plan) {
    var line = plan.line, now = nowIso_();
    if (plan.kind === 'RESTOCK') {
      updateObject_(HAU_SHEETS.REQUEST_LINES, line._row, { Fulfillment_Source: 'RESTOCK', Status: 'FOR_CANVASSING', Updated_At: now });
      history_('REQUEST_LINE', line.Request_Line_ID, line.Status, 'FOR_CANVASSING', user, 'Catalog restock accepted', { requestId: request.Request_ID, idempotencyKey: key });
      return;
    }
    if (plan.kind === 'STOCK') {
      createReservation_({ itemId: line.Item_ID, quantity: plan.stock, requestLineId: line.Request_Line_ID }, user, key + ':' + line.Request_Line_ID);
      updateObject_(HAU_SHEETS.REQUEST_LINES, line._row, { Fulfillment_Source: 'ISSUE_FROM_STOCK', Status: 'READY_TO_RELEASE', Updated_At: now });
      history_('REQUEST_LINE', line.Request_Line_ID, line.Status, 'READY_TO_RELEASE', user, 'Stock reserved', { requestId: request.Request_ID, idempotencyKey: key });
      return;
    }
    if (plan.kind === 'SPLIT') {
      var split = 'SPLIT-' + Utilities.getUuid().slice(0, 8).toUpperCase();
      createReservation_({ itemId: line.Item_ID, quantity: plan.stock, requestLineId: line.Request_Line_ID }, user, key + ':' + line.Request_Line_ID);
      updateObject_(HAU_SHEETS.REQUEST_LINES, line._row, { Requested_Qty: plan.stock, Fulfillment_Source: 'ISSUE_FROM_STOCK', Split_Group_ID: split, Status: 'READY_TO_RELEASE', Updated_At: now });
      var procurementLine = Object.assign({}, line, {
        Request_Line_ID: allocateId_('RL'), Requested_Qty: plan.procurement, Fulfillment_Source: 'PROCUREMENT',
        Split_Group_ID: split, Status: 'FOR_CANVASSING', Created_At: now, Updated_At: now, Client_Line_ID: Utilities.getUuid()
      });
      delete procurementLine._row;
      appendObject_(HAU_SHEETS.REQUEST_LINES, procurementLine);
      createDeliverableForLine_(request, procurementLine, user);
      history_('REQUEST_LINE', line.Request_Line_ID, line.Status, 'READY_TO_RELEASE', user, 'Partial stock reserved; procurement line created', { requestId: request.Request_ID, idempotencyKey: key });
      return;
    }
    updateObject_(HAU_SHEETS.REQUEST_LINES, line._row, { Fulfillment_Source: 'PROCUREMENT', Status: 'FOR_CANVASSING', Updated_At: now });
    createDeliverableForLine_(request, line, user);
    history_('REQUEST_LINE', line.Request_Line_ID, line.Status, 'FOR_CANVASSING', user, 'Routed to procurement', { requestId: request.Request_ID, idempotencyKey: key });
  });
}

function reviewRequest_(command, correlationId) {
  return withScriptLock_(function() {
    var user = requirePermission_('Can_Review'), key = requireIdempotency_(command), replay = idempotencyReplay_(key);
    if (replay) return Object.assign({ idempotentReplay: true }, replay);
    var request = findOne_(HAU_SHEETS.REQUESTS, 'Request_ID', requireText_(command.requestId, 'requestId'));
    if (!request) throw appError_('REQUEST_NOT_FOUND', 'Request was not found.', false);
    if (String(request.Status) !== 'FOR_REVIEW') throw appError_('INVALID_TRANSITION', 'Only FOR_REVIEW requests may be reviewed.', false);
    var decision = String(command.decision || 'ACCEPT').toUpperCase();
    if (['ACCEPT', 'REJECT'].indexOf(decision) < 0) throw appError_('VALIDATION_ERROR', 'Decision must be ACCEPT or REJECT.', false);
    var lines = findAll_(HAU_SHEETS.REQUEST_LINES, function(line) { return String(line.Request_ID) === String(request.Request_ID); });
    if (decision === 'REJECT') {
      lines.forEach(function(line) {
        updateObject_(HAU_SHEETS.REQUEST_LINES, line._row, { Status: 'REJECTED', Updated_At: nowIso_() });
        history_('REQUEST_LINE', line.Request_Line_ID, line.Status, 'REJECTED', user, command.note, { requestId: request.Request_ID, idempotencyKey: key });
      });
      updateObject_(HAU_SHEETS.REQUESTS, request._row, { Status: 'REJECTED', Updated_At: nowIso_() });
      history_('REQUEST', request.Request_ID, request.Status, 'REJECTED', user, command.note, { requestId: request.Request_ID, idempotencyKey: key });
    } else {
      var plan = planRequestAcceptance_(request, lines);
      applyAcceptancePlan_(request, plan, user, key);
      updateObject_(HAU_SHEETS.REQUESTS, request._row, { Status: 'ACCEPTED', Updated_At: nowIso_() });
      history_('REQUEST', request.Request_ID, request.Status, 'ACCEPTED', user, command.note || 'Accepted and routed', { requestId: request.Request_ID, idempotencyKey: key });
    }
    audit_('REVIEW_REQUEST', 'REQUEST', request.Request_ID, user, correlationId, { before: request, after: { decision: decision }, requestId: request.Request_ID, notes: command.note });
    return recordIdempotency_(key, { requestId: request.Request_ID, status: decision === 'REJECT' ? 'REJECTED' : 'ACCEPTED', entityType: 'REQUEST', entityId: request.Request_ID }, user, correlationId);
  });
}

function deriveParentRequestStatus_(requestId) {
  var lines = findAll_(HAU_SHEETS.REQUEST_LINES, function(line) { return String(line.Request_ID) === String(requestId) && ['REJECTED', 'CANCELLED'].indexOf(String(line.Status)) < 0; });
  if (!lines.length) return 'CANCELLED';
  if (lines.every(function(line) { return ['COMPLETED', 'RESTOCKED'].indexOf(String(line.Status)) >= 0; })) return 'COMPLETED';
  if (lines.some(function(line) { return ['PARTIALLY_RELEASED', 'COMPLETED', 'RESTOCKED', 'PARTIALLY_RECEIVED'].indexOf(String(line.Status)) >= 0; })) return 'PARTIALLY_FULFILLED';
  if (lines.some(function(line) { return String(line.Status) !== 'FOR_REVIEW'; })) return 'ACCEPTED';
  return 'FOR_REVIEW';
}
