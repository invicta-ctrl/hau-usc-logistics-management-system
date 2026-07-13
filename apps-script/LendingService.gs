function borrowerEligibleForAudience_(audience, borrowerType, user) {
  var borrower = normalizeBorrowerType_(borrowerType);
  if (audience === 'STUDENTS_AND_STAFF') return borrower === 'ANGELITE' || borrower === 'USC_STAFF';
  if (audience === 'USC_STAFF_ONLY') return borrower === 'USC_STAFF';
  if (audience === 'DOL_INTERNAL_ONLY') return borrower === 'USC_STAFF' && user && String(user.Role || 'REQUESTER') !== 'REQUESTER';
  return false;
}

function verifiedBorrowerType_(requestedType, user) {
  var requested = normalizeBorrowerType_(requestedType || 'ANGELITE');
  if (requested !== 'USC_STAFF') return 'ANGELITE';
  if (!isInternalBootstrapUser_(user)) {
    throw appError_('STAFF_IDENTITY_REQUIRED', 'USC staff eligibility requires an authenticated authorized staff account.', false);
  }
  return 'USC_STAFF';
}

function validateLendingPolicy_(item, input, user, availabilityMode) {
  if (!item) throw appError_('ITEM_NOT_FOUND', 'Inventory item was not found.', false);
  var status = String(item.Status || '').toUpperCase();
  if (status === 'VERIFY') throw appError_('ITEM_REQUIRES_VERIFICATION', 'This legacy item must be reconciled before circulation.', false, { itemId:item.Item_ID });
  if (status !== 'ACTIVE') throw appError_('ITEM_NOT_CIRCULATING', 'This item is not active for circulation.', false, { itemId:item.Item_ID, status:status });
  var handling = normalizeHandling_(item.Handling);
  var audience = effectiveLendingAudience_(item);
  if (handling === 'NON_CIRCULATING' || audience === 'NOT_AVAILABLE_FOR_LENDING') throw appError_('ITEM_NOT_CIRCULATING', 'This item is tracked in inventory but is not available through the Lending Hub.', false, { itemId:item.Item_ID });
  var borrowerType = normalizeBorrowerType_(input.borrowerType);
  if (!borrowerEligibleForAudience_(audience, borrowerType, user)) throw appError_('BORROWER_NOT_ELIGIBLE', audience === 'USC_STAFF_ONLY' ? 'This item is available only to USC officers and staff.' : 'The borrower is not eligible for this item.', false, { audience:audience, borrowerType:borrowerType });
  var quantity = positiveNumber_(input.quantity, 'quantity');
  var maximum = item.Maximum_Loan_Qty === '' || item.Maximum_Loan_Qty == null ? null : positiveNumber_(item.Maximum_Loan_Qty, 'Maximum_Loan_Qty');
  if (maximum != null && quantity > maximum) throw appError_('MAXIMUM_LENDING_QUANTITY_EXCEEDED', 'Maximum ' + maximum + ' ' + item.Unit + ' per ticket.', false, { maximum:maximum, requested:quantity });
  if (availabilityMode === 'ON_HAND') {
    var onHand = onHand_(item.Item_ID);
    if (onHand <= 0) throw appError_('OUT_OF_STOCK', item.Item_Name + ' is currently out of stock.', false, { available:0 });
    if (quantity > onHand) throw appError_('INSUFFICIENT_AVAILABLE_STOCK', 'Physical stock is no longer sufficient for this handoff.', false, { available:onHand, requested:quantity });
  } else {
    var available = availableToPromise_(item.Item_ID);
    if (available <= 0) throw appError_('OUT_OF_STOCK', item.Item_Name + ' is currently out of stock.', false, { available:0 });
    if (quantity > available) throw appError_('INSUFFICIENT_AVAILABLE_STOCK', 'Only ' + available + ' ' + item.Unit + ' are currently available to promise.', false, { available:available, requested:quantity });
  }
  var returnable = handlingIsReturnable_(handling);
  if (returnable && !input.dueAt) throw appError_('DUE_DATE_REQUIRED', 'A future due date is required for loanable and reusable items.', false);
  if (returnable) {
    var due = new Date(input.dueAt);
    if (isNaN(due.getTime()) || due.getTime() <= Date.now()) throw appError_('INVALID_DUE_DATE', 'The due date must be in the future.', false);
  }
  return { handling:handling, audience:audience, borrowerType:borrowerType, quantity:quantity, returnable:returnable };
}

function createLendingTicket_(command, correlationId) {
  return withScriptLock_(function() {
    var user = resolveRequesterUser_(), key = requireIdempotency_(command), replay = idempotencyReplay_(key);
    if (replay) return Object.assign({ idempotentReplay: true }, replay);
    if (!String(command.itemId || '').trim()) throw appError_('ITEM_NOT_SELECTED', 'Select an inventory item from the suggestions before submitting.', false);
    var item = itemById_(String(command.itemId).trim());
    var borrowerType = verifiedBorrowerType_(command.borrowerType || command.borrowerGroup || 'ANGELITE', user);
    var policy = validateLendingPolicy_(item, { borrowerType:borrowerType, quantity:command.quantity, dueAt:command.dueAt }, user, 'AVAILABLE_TO_PROMISE');
    var id = allocateId_('LND'), row = {
      Lending_Ticket_ID: id, Created_At: nowIso_(), Updated_At: nowIso_(),
      Student_ID_Number: requireText_(command.studentIdNumber || command.studentId, 'studentIdNumber'),
      Borrower_Name: requireText_(command.borrowerName, 'borrowerName'),
      Borrower_Type: policy.borrowerType,
      Department_Organization: requireText_(command.department, 'department'), Contact: command.contact || '',
      Item_ID: item.Item_ID, Quantity: policy.quantity, Unit: item.Unit,
      Purpose: requireText_(command.purpose, 'purpose'), Due_At: policy.returnable ? command.dueAt : '',
      Ticket_Type: policy.handling, Status: 'FOR_REVIEW',
      Approved_By: '', Approved_At: '', Released_By: '', Released_At: '', Returned_At: '',
      Created_By: user.User_ID || 'PUBLIC', Notes: command.notes || ''
    };
    appendObject_(HAU_SHEETS.LENDING, row);
    history_('LENDING', id, '', 'FOR_REVIEW', user, 'Ticket created', { idempotencyKey: key });
    audit_('CREATE_LENDING', 'LENDING', id, user, correlationId, { after: row });
    return recordIdempotency_(key, { ticketId: id, entityType: 'LENDING', entityId: id }, user, correlationId);
  });
}

function approveLendingTicket_(command, correlationId) {
  return withScriptLock_(function() {
    var user = requirePermission_('Can_Review'), key = requireIdempotency_(command), replay = idempotencyReplay_(key);
    if (replay) return Object.assign({ idempotentReplay: true }, replay);
    var ticket = findOne_(HAU_SHEETS.LENDING, 'Lending_Ticket_ID', requireText_(command.ticketId, 'ticketId'));
    if (!ticket) throw appError_('TICKET_NOT_FOUND', 'Lending ticket was not found.', false);
    if (String(ticket.Status) !== 'FOR_REVIEW') throw appError_('INVALID_TRANSITION', 'Only FOR_REVIEW tickets may be approved.', false);
    var item = itemById_(ticket.Item_ID);
    validateLendingPolicy_(item, { borrowerType:ticket.Borrower_Type, quantity:ticket.Quantity, dueAt:ticket.Due_At }, user, 'AVAILABLE_TO_PROMISE');
    createReservation_({ itemId: ticket.Item_ID, quantity: ticket.Quantity, lendingTicketId: ticket.Lending_Ticket_ID }, user, key);
    updateObject_(HAU_SHEETS.LENDING, ticket._row, { Status: 'READY_TO_CLAIM', Approved_By: user.User_ID, Approved_At: nowIso_(), Updated_At: nowIso_() });
    history_('LENDING', ticket.Lending_Ticket_ID, ticket.Status, 'READY_TO_CLAIM', user, 'Approved and reserved', { idempotencyKey: key });
    audit_('APPROVE_LENDING', 'LENDING', ticket.Lending_Ticket_ID, user, correlationId, { before: ticket });
    return recordIdempotency_(key, { ticketId: ticket.Lending_Ticket_ID, status: 'READY_TO_CLAIM' }, user, correlationId);
  });
}

function confirmLendingHandoff_(command, correlationId) {
  return withScriptLock_(function() {
    var user = requirePermission_('Can_Release'), key = requireIdempotency_(command), replay = idempotencyReplay_(key);
    if (replay) return Object.assign({ idempotentReplay: true }, replay);
    var ticket = findOne_(HAU_SHEETS.LENDING, 'Lending_Ticket_ID', requireText_(command.ticketId, 'ticketId'));
    if (!ticket || String(ticket.Status) !== 'READY_TO_CLAIM') throw appError_('INVALID_TRANSITION', 'Only READY_TO_CLAIM tickets may be handed off.', false);
    var item = itemById_(ticket.Item_ID);
    validateLendingPolicy_(item, { borrowerType:ticket.Borrower_Type, quantity:ticket.Quantity, dueAt:ticket.Due_At }, user, 'ON_HAND');
    var activeReserved = findAll_(HAU_SHEETS.RESERVATIONS, function(row) { return String(row.Lending_Ticket_ID) === String(ticket.Lending_Ticket_ID) && String(row.Status) === 'ACTIVE'; }).reduce(function(sum, row) { return sum + Number(row.Quantity || 0); }, 0);
    if (activeReserved < Number(ticket.Quantity)) throw appError_('RESERVATION_CONFLICT', 'The lending reservation no longer covers this handoff.', false, { reserved: activeReserved });
    consumeReservations_(ticket.Item_ID, Number(ticket.Quantity), { lendingTicketId: ticket.Lending_Ticket_ID }, user);
    var returnable = handlingIsReturnable_(ticket.Ticket_Type), type = returnable ? 'LOAN_OUT' : 'ISSUE', next = returnable ? 'ON_LOAN' : 'COMPLETED';
    var tx = appendLedger_({ type: type, direction: 'OUT', itemId: ticket.Item_ID, quantity: ticket.Quantity, unit: ticket.Unit, relatedEntityType: 'LENDING', relatedEntityId: ticket.Lending_Ticket_ID, idempotencyKey: key, notes: command.conditionOut || command.notes || '' }, user);
    var evidenceId = '';
    if (command.evidence) evidenceId = uploadEvidence_(Object.assign({}, command.evidence, { evidenceType: 'LENDING_HANDOFF_PHOTO', relatedEntityType: 'LENDING', relatedEntityId: ticket.Lending_Ticket_ID, itemId: ticket.Item_ID, secondaryId: ticket.Item_ID, clientRequestId: key + ':evidence' }), correlationId).evidenceId;
    updateObject_(HAU_SHEETS.LENDING, ticket._row, { Status: next, Released_By: user.User_ID, Released_At: nowIso_(), Updated_At: nowIso_(), Notes: [ticket.Notes, command.conditionOut, evidenceId && 'Evidence ' + evidenceId].filter(Boolean).join(' | ') });
    history_('LENDING', ticket.Lending_Ticket_ID, ticket.Status, next, user, 'Physical handoff', { idempotencyKey: key });
    audit_('LENDING_HANDOFF', 'LENDING', ticket.Lending_Ticket_ID, user, correlationId, { after: tx });
    return recordIdempotency_(key, { ticketId: ticket.Lending_Ticket_ID, status: next, transactionId: tx.Transaction_ID, evidenceId: evidenceId }, user, correlationId);
  });
}

function returnedQuantityForTicket_(ticketId) {
  return lendingReturnSummary_(ticketId).returnedQuantity;
}

function lendingReturnSummary_(ticketId, ticketQuantity) {
  var summary = { returnedQuantity:0, restoredQuantity:0, lostQuantity:0, damagedBeyondUseQuantity:0, remainingQuantity:Number(ticketQuantity||0), evidenceIds:[] };
  findAll_(HAU_SHEETS.HISTORY, function(row) { return String(row.Entity_Type) === 'LENDING' && String(row.Entity_ID) === String(ticketId) && String(row.Reason) === 'Return received'; }).forEach(function(row) {
    try {
      var metadata = JSON.parse(row.Metadata_JSON || '{}');
      summary.returnedQuantity += Number(metadata.returnedQuantity || 0);
      summary.restoredQuantity += Number(metadata.restoredQuantity || 0);
      summary.lostQuantity += Number(metadata.lostQuantity || 0);
      summary.damagedBeyondUseQuantity += Number(metadata.damagedBeyondUseQuantity || 0);
      if (metadata.evidenceId && summary.evidenceIds.indexOf(metadata.evidenceId) < 0) summary.evidenceIds.push(metadata.evidenceId);
    } catch (ignored) {}
  });
  summary.remainingQuantity = Math.max(0, Number(ticketQuantity || summary.returnedQuantity) - summary.returnedQuantity);
  return summary;
}

function confirmReturn_(command, correlationId) {
  return withScriptLock_(function() {
    var user = requirePermission_('Can_Receive'), key = requireIdempotency_(command), replay = idempotencyReplay_(key);
    if (replay) return Object.assign({ idempotentReplay: true }, replay);
    var ticket = findOne_(HAU_SHEETS.LENDING, 'Lending_Ticket_ID', requireText_(command.ticketId, 'ticketId'));
    if (!ticket || ['ON_LOAN', 'OVERDUE'].indexOf(String(ticket.Status)) < 0) throw appError_('INVALID_TRANSITION', 'Only ON_LOAN or OVERDUE tickets may be returned.', false);
    var previouslyReturned = returnedQuantityForTicket_(ticket.Lending_Ticket_ID), remaining = Number(ticket.Quantity) - previouslyReturned;
    var returnedNow = positiveNumber_(command.returnedQuantity == null ? remaining : command.returnedQuantity, 'returnedQuantity');
    if (returnedNow > remaining) throw appError_('OVER_RETURN', 'Returned quantity exceeds the remaining loan quantity.', false, { remaining: remaining });
    var lostQuantity = nonNegativeNumber_(command.lostQuantity, 'lostQuantity'), damagedBeyondUseQuantity = nonNegativeNumber_(command.damagedBeyondUseQuantity, 'damagedBeyondUseQuantity');
    var restorable = returnedNow - lostQuantity - damagedBeyondUseQuantity;
    if (restorable < 0) throw appError_('VALIDATION_ERROR', 'Lost and damaged quantities cannot exceed the returned quantity.', false);
    if ((lostQuantity > 0 || damagedBeyondUseQuantity > 0) && !command.evidence) throw appError_('RETURN_EVIDENCE_REQUIRED', 'Photo evidence is required when returned items are lost or damaged beyond use.', false);
    var accounted = previouslyReturned + returnedNow, next = accounted === Number(ticket.Quantity) ? 'RETURNED' : 'ON_LOAN', evidenceId = '';
    if (command.evidence) evidenceId = uploadEvidence_(Object.assign({}, command.evidence, { evidenceType: 'LENDING_RETURN_PHOTO', relatedEntityType: 'LENDING', relatedEntityId: ticket.Lending_Ticket_ID, itemId: ticket.Item_ID, secondaryId: ticket.Item_ID, clientRequestId: key + ':evidence' }), correlationId).evidenceId;
    var tx = restorable > 0 ? appendLedger_({ type: 'LOAN_RETURN', direction: 'IN', itemId: ticket.Item_ID, quantity: restorable, unit: ticket.Unit, relatedEntityType: 'LENDING', relatedEntityId: ticket.Lending_Ticket_ID, idempotencyKey: key, notes: command.condition || command.notes || '' }, user) : null;
    updateObject_(HAU_SHEETS.LENDING, ticket._row, { Status: next, Returned_At: next === 'RETURNED' ? nowIso_() : '', Updated_At: nowIso_(), Notes: [ticket.Notes, command.damageNotes, command.missingParts, command.lostQuantity && 'Lost ' + command.lostQuantity, command.damagedBeyondUseQuantity && 'Damaged beyond use ' + command.damagedBeyondUseQuantity, evidenceId && 'Evidence ' + evidenceId].filter(Boolean).join(' | ') });
    var remainingAfter = Math.max(0, Number(ticket.Quantity) - accounted);
    history_('LENDING', ticket.Lending_Ticket_ID, ticket.Status, next, user, 'Return received', { idempotencyKey: key, metadata: { returnedQuantity: returnedNow, restoredQuantity: restorable, lostQuantity:lostQuantity, damagedBeyondUseQuantity:damagedBeyondUseQuantity, remainingQuantity:remainingAfter, evidenceId:evidenceId } });
    audit_('LENDING_RETURN', 'LENDING', ticket.Lending_Ticket_ID, user, correlationId, { before:{ status:ticket.Status, previouslyReturnedQuantity:previouslyReturned, remainingQuantity:remaining }, after: { status:next, transactionId:tx&&tx.Transaction_ID, returnedQuantity: returnedNow, restoredQuantity: restorable, lostQuantity:lostQuantity, damagedBeyondUseQuantity:damagedBeyondUseQuantity, remainingQuantity:remainingAfter, evidenceId:evidenceId } });
    return recordIdempotency_(key, { ticketId: ticket.Lending_Ticket_ID, status: next, transactionId: tx && tx.Transaction_ID, evidenceId: evidenceId, returnedQuantity:returnedNow, restoredQuantity:restorable, lostQuantity:lostQuantity, damagedBeyondUseQuantity:damagedBeyondUseQuantity, remainingQuantity:remainingAfter, fullyReturned:remainingAfter===0 }, user, correlationId);
  });
}

function updateOverdueLending_() {
  return withScriptLock_(function() {
    var now = new Date(), updated = [], correlationId = correlationId_();
    var systemUser = { User_ID: 'SYSTEM', Email: '', Role: 'SYSTEM' };
    readObjects_(HAU_SHEETS.LENDING).forEach(function(ticket) {
      if (String(ticket.Status) === 'ON_LOAN' && ticket.Due_At && new Date(ticket.Due_At) < now) {
        updateObject_(HAU_SHEETS.LENDING, ticket._row, { Status: 'OVERDUE', Updated_At: nowIso_() });
        history_('LENDING', ticket.Lending_Ticket_ID, 'ON_LOAN', 'OVERDUE', systemUser, 'Daily overdue trigger', { metadata: { dueAt: ticket.Due_At, correlationId: correlationId } });
        audit_('LENDING_OVERDUE', 'LENDING', ticket.Lending_Ticket_ID, systemUser, correlationId, { before: { status: 'ON_LOAN', dueAt: ticket.Due_At }, after: { status: 'OVERDUE' } });
        updated.push(ticket.Lending_Ticket_ID);
      }
    });
    if (updated.length) touchDataRevision_(systemUser);
    return { updated: updated, correlationId: correlationId };
  });
}
