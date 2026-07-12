function createLendingTicket_(command, correlationId) {
  return withScriptLock_(function() {
    var user = resolveRequesterUser_(), key = requireIdempotency_(command), replay = idempotencyReplay_(key);
    if (replay) return Object.assign({ idempotentReplay: true }, replay);
    var item = itemById_(requireText_(command.itemId, 'itemId')); assertTransactableItem_(item);
    var loanable = String(item.Handling).toUpperCase() === 'LOANABLE';
    if (loanable && !command.dueAt) throw appError_('VALIDATION_ERROR', 'dueAt is required for loanable items.', false);
    var id = allocateId_('LND'), row = {
      Lending_Ticket_ID: id, Created_At: nowIso_(), Updated_At: nowIso_(),
      Student_ID_Number: requireText_(command.studentIdNumber || command.studentId, 'studentIdNumber'),
      Borrower_Name: requireText_(command.borrowerName, 'borrowerName'),
      Borrower_Type: command.borrowerType || command.borrowerGroup || 'ANGELITE',
      Department_Organization: requireText_(command.department, 'department'), Contact: command.contact || '',
      Item_ID: item.Item_ID, Quantity: positiveNumber_(command.quantity, 'quantity'), Unit: item.Unit,
      Purpose: requireText_(command.purpose, 'purpose'), Due_At: loanable ? command.dueAt : '',
      Ticket_Type: loanable ? 'LOANABLE' : 'CONSUMABLE', Status: 'FOR_REVIEW',
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
    if (onHand_(ticket.Item_ID) < Number(ticket.Quantity)) throw appError_('INSUFFICIENT_STOCK', 'Physical stock is no longer sufficient.', false);
    var activeReserved = findAll_(HAU_SHEETS.RESERVATIONS, function(row) { return String(row.Lending_Ticket_ID) === String(ticket.Lending_Ticket_ID) && String(row.Status) === 'ACTIVE'; }).reduce(function(sum, row) { return sum + Number(row.Quantity || 0); }, 0);
    if (activeReserved < Number(ticket.Quantity)) throw appError_('RESERVATION_CONFLICT', 'The lending reservation no longer covers this handoff.', false, { reserved: activeReserved });
    consumeReservations_(ticket.Item_ID, Number(ticket.Quantity), { lendingTicketId: ticket.Lending_Ticket_ID }, user);
    var type = String(ticket.Ticket_Type) === 'LOANABLE' ? 'LOAN_OUT' : 'ISSUE', next = String(ticket.Ticket_Type) === 'LOANABLE' ? 'ON_LOAN' : 'COMPLETED';
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
  return findAll_(HAU_SHEETS.HISTORY, function(row) { return String(row.Entity_Type) === 'LENDING' && String(row.Entity_ID) === String(ticketId) && String(row.Reason) === 'Return received'; }).reduce(function(sum, row) { try { return sum + Number(JSON.parse(row.Metadata_JSON || '{}').returnedQuantity || 0); } catch (error) { return sum; } }, 0);
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
    var restorable = returnedNow - nonNegativeNumber_(command.lostQuantity, 'lostQuantity') - nonNegativeNumber_(command.damagedBeyondUseQuantity, 'damagedBeyondUseQuantity');
    if (restorable < 0) throw appError_('VALIDATION_ERROR', 'Lost and damaged quantities cannot exceed the returned quantity.', false);
    var tx = restorable > 0 ? appendLedger_({ type: 'LOAN_RETURN', direction: 'IN', itemId: ticket.Item_ID, quantity: restorable, unit: ticket.Unit, relatedEntityType: 'LENDING', relatedEntityId: ticket.Lending_Ticket_ID, idempotencyKey: key, notes: command.condition || command.notes || '' }, user) : null;
    var accounted = previouslyReturned + returnedNow, next = accounted === Number(ticket.Quantity) ? 'RETURNED' : 'ON_LOAN', evidenceId = '';
    if (command.evidence) evidenceId = uploadEvidence_(Object.assign({}, command.evidence, { evidenceType: 'LENDING_RETURN_PHOTO', relatedEntityType: 'LENDING', relatedEntityId: ticket.Lending_Ticket_ID, itemId: ticket.Item_ID, secondaryId: ticket.Item_ID, clientRequestId: key + ':evidence' }), correlationId).evidenceId;
    updateObject_(HAU_SHEETS.LENDING, ticket._row, { Status: next, Returned_At: next === 'RETURNED' ? nowIso_() : '', Updated_At: nowIso_(), Notes: [ticket.Notes, command.damageNotes, command.missingParts, command.lostQuantity && 'Lost ' + command.lostQuantity, command.damagedBeyondUseQuantity && 'Damaged beyond use ' + command.damagedBeyondUseQuantity, evidenceId && 'Evidence ' + evidenceId].filter(Boolean).join(' | ') });
    history_('LENDING', ticket.Lending_Ticket_ID, ticket.Status, next, user, 'Return received', { idempotencyKey: key, metadata: { returnedQuantity: returnedNow, restoredQuantity: restorable } });
    audit_('LENDING_RETURN', 'LENDING', ticket.Lending_Ticket_ID, user, correlationId, { after: { transaction: tx, returnedQuantity: returnedNow, restoredQuantity: restorable } });
    return recordIdempotency_(key, { ticketId: ticket.Lending_Ticket_ID, status: next, transactionId: tx && tx.Transaction_ID, evidenceId: evidenceId }, user, correlationId);
  });
}

function updateOverdueLending() {
  return withScriptLock_(function() {
    var now = new Date(), updated = [];
    readObjects_(HAU_SHEETS.LENDING).forEach(function(ticket) {
      if (String(ticket.Status) === 'ON_LOAN' && ticket.Due_At && new Date(ticket.Due_At) < now) {
        updateObject_(HAU_SHEETS.LENDING, ticket._row, { Status: 'OVERDUE', Updated_At: nowIso_() });
        history_('LENDING', ticket.Lending_Ticket_ID, 'ON_LOAN', 'OVERDUE', { User_ID: 'SYSTEM' }, 'Daily overdue trigger', {});
        updated.push(ticket.Lending_Ticket_ID);
      }
    });
    return { updated: updated };
  });
}
