function releaseRecipientConfirmed_(value) {
  return value === true || String(value == null ? '' : value).trim().toLowerCase() === 'true';
}

function releaseReservationQuantity_(itemId, requestLineId) {
  return findAll_(HAU_SHEETS.RESERVATIONS, function(row) {
    return String(row.Item_ID) === String(itemId) &&
      String(row.Request_Line_ID) === String(requestLineId) &&
      String(row.Status) === 'ACTIVE';
  }).reduce(function(sum, row) { return sum + Number(row.Quantity || 0); }, 0);
}

function preflightReleaseLines_(command) {
  var inputs = command.lines || [];
  if (!inputs.length && command.requestLineId) {
    inputs = [{ requestLineId: command.requestLineId, quantity: command.quantity }];
  }
  if (!inputs.length) {
    throw appError_('VALIDATION_ERROR', 'At least one release line is required.', false);
  }

  var seen = {}, itemTotals = {}, eventItemTotals = {}, prepared = [];
  inputs.forEach(function(input) {
    var lineId = requireText_(input.requestLineId, 'requestLineId');
    if (seen[lineId]) {
      throw appError_('DUPLICATE_RELEASE_LINE', 'A request line can appear only once per release.', false, { requestLineId: lineId });
    }
    seen[lineId] = true;
    var line = findOne_(HAU_SHEETS.REQUEST_LINES, 'Request_Line_ID', lineId);
    if (!line) throw appError_('LINE_NOT_FOUND', 'Request line was not found.', false);
    if (command.requestId && String(command.requestId) !== String(line.Request_ID)) {
      throw appError_('RELEASE_SCOPE_MISMATCH', 'Every release line must belong to the selected request.', false);
    }
    if (command.eventId && String(command.eventId) !== String(line.Event_ID)) {
      throw appError_('RELEASE_SCOPE_MISMATCH', 'Every release line must belong to the selected event.', false);
    }
    if (prepared.length && (
      String(prepared[0].line.Request_ID) !== String(line.Request_ID) ||
      String(prepared[0].line.Event_ID) !== String(line.Event_ID)
    )) {
      throw appError_('RELEASE_SCOPE_MISMATCH', 'One release cannot combine different requests or events.', false);
    }
    if (['READY_TO_RELEASE', 'PARTIALLY_RELEASED'].indexOf(String(line.Status)) < 0) {
      throw appError_('INVALID_TRANSITION', 'This line is not ready for release.', false);
    }
    var quantity = positiveNumber_(input.quantity, 'quantity');
    var remaining = Number(line.Requested_Qty) - Number(line.Released_Qty || 0);
    if (quantity > remaining) {
      throw appError_('OVER_RELEASE', 'Release quantity exceeds the remaining request quantity.', false, { remaining: remaining });
    }

    if (line.Item_ID) {
      var item = itemById_(line.Item_ID);
      assertTransactableItem_(item);
      var reservationQuantity = releaseReservationQuantity_(line.Item_ID, line.Request_Line_ID);
      if (reservationQuantity < quantity) {
        throw appError_('RESERVATION_CONFLICT', 'The active reservation no longer covers this quantity.', false, { reserved: reservationQuantity, requested: quantity });
      }
      itemTotals[line.Item_ID] = Number(itemTotals[line.Item_ID] || 0) + quantity;
      if (itemTotals[line.Item_ID] > onHand_(line.Item_ID)) {
        throw appError_('INSUFFICIENT_STOCK', 'Physical stock is insufficient for release.', false);
      }
    } else {
      var eventItemId = line.Event_Item_ID;
      if (!eventItemId) {
        throw appError_('EVENT_ITEM_NOT_FOUND', 'The received event item is not registered.', false);
      }
      eventItemTotals[eventItemId] = Number(eventItemTotals[eventItemId] || 0) + quantity;
      if (eventItemTotals[eventItemId] > eventOnHand_(eventItemId)) {
        throw appError_('INSUFFICIENT_EVENT_BALANCE', 'Event-item balance is insufficient.', false);
      }
    }
    prepared.push({ line: line, quantity: quantity });
  });
  return prepared;
}

function confirmRelease_(command, correlationId) {
  return withScriptLock_(function() {
    var user = requirePermission_('Can_Release');
    var key = requireIdempotency_(command);
    var replay = idempotencyReplay_(key);
    if (replay) return Object.assign({ idempotentReplay: true }, replay);
    if (!releaseRecipientConfirmed_(command.recipientConfirmed)) {
      throw appError_('RECIPIENT_CONFIRMATION_REQUIRED', 'The recipient must confirm the physical handoff before release.', false);
    }
    var recipientName = requireText_(command.recipientName, 'recipientName');
    var recipientRole = requireText_(command.recipientRole, 'recipientRole');
    var department = requireText_(command.department, 'department');
    var prepared = preflightReleaseLines_(command);
    var releaseId = allocateId_('REL');
    var requestId = prepared[0].line.Request_ID;
    var eventId = prepared[0].line.Event_ID;
    var evidenceId = '';
    if (command.evidence) {
      evidenceId = uploadEvidence_(Object.assign({}, command.evidence, {
        evidenceType: 'RELEASE_CONFIRMATION_PHOTO',
        relatedEntityType: 'RELEASE',
        relatedEntityId: releaseId,
        requestId: requestId,
        secondaryId: requestId,
        clientRequestId: key + ':evidence'
      }), correlationId).evidenceId;
    }

    var transactions = [], lineIds = [], quantities = [], units = [];
    prepared.forEach(function(entry) {
      var line = entry.line, quantity = entry.quantity, transaction;
      if (line.Item_ID) {
        consumeReservations_(line.Item_ID, quantity, { requestLineId: line.Request_Line_ID }, user);
        transaction = appendLedger_({
          type: 'ISSUE', direction: 'OUT', itemId: line.Item_ID, quantity: quantity,
          unit: line.Unit, relatedEntityType: 'RELEASE', relatedEntityId: releaseId,
          requestId: line.Request_ID, eventId: line.Event_ID,
          idempotencyKey: key + ':' + line.Request_Line_ID, notes: command.notes || ''
        }, user);
      } else {
        transaction = appendLedger_({
          type: 'ISSUE', direction: 'OUT', eventItemId: line.Event_Item_ID, quantity: quantity,
          unit: line.Unit, relatedEntityType: 'RELEASE', relatedEntityId: releaseId,
          requestId: line.Request_ID, eventId: line.Event_ID,
          idempotencyKey: key + ':' + line.Request_Line_ID, notes: command.notes || ''
        }, user);
      }
      var released = Number(line.Released_Qty || 0) + quantity;
      var next = released >= Number(line.Requested_Qty) ? 'COMPLETED' : 'PARTIALLY_RELEASED';
      updateObject_(HAU_SHEETS.REQUEST_LINES, line._row, {
        Released_Qty: released, Status: next, Updated_At: nowIso_()
      });
      history_('REQUEST_LINE', line.Request_Line_ID, line.Status, next, user,
        command.partialReason || command.notes || 'Physical release', {
          requestId: line.Request_ID, eventId: line.Event_ID, idempotencyKey: key
        });
      transactions.push(transaction.Transaction_ID);
      lineIds.push(line.Request_Line_ID);
      quantities.push(quantity);
      units.push(line.Unit);
    });

    var requestStatus = deriveParentRequestStatus_(requestId);
    var request = findOne_(HAU_SHEETS.REQUESTS, 'Request_ID', requestId);
    if (request) {
      updateObject_(HAU_SHEETS.REQUESTS, request._row, { Status: requestStatus, Updated_At: nowIso_() });
      history_('REQUEST', requestId, request.Status, requestStatus, user, 'Derived after release', {
        requestId: requestId, idempotencyKey: key
      });
    }
    var releasedAt = nowIso_();
    var releaseStatus = requestStatus === 'COMPLETED' ? 'COMPLETED' : 'PARTIAL';
    var confirmationLabel = 'Release Confirmation | ' + releaseId + ' | ' + requestId + ' | Recipient confirmed | ' + releasedAt;
    var release = {
      Release_ID: releaseId, Created_At: releasedAt, Request_ID: requestId, Event_ID: eventId,
      Lending_Ticket_ID: command.lendingTicketId || '', Recipient_Name: recipientName,
      Recipient_Role: recipientRole, Department: department, Released_By: user.User_ID,
      Released_At: releasedAt, Status: releaseStatus, Evidence_ID: evidenceId,
      Confirmation_Label: confirmationLabel, Notes: command.notes || '', Client_Request_ID: key,
      Request_Line_IDs_JSON: safeJson_(lineIds), Quantities_JSON: safeJson_(quantities),
      Units_JSON: safeJson_(units), Idempotency_Key: key, Reversed_By: ''
    };
    appendObject_(HAU_SHEETS.RELEASES, release);
    audit_('CONFIRM_RELEASE', 'RELEASE', releaseId, user, correlationId, {
      after: release, requestId: requestId, eventId: eventId
    });
    return recordIdempotency_(key, {
      releaseId: releaseId, transactionIds: transactions, status: release.Status,
      recipientConfirmed: true, confirmationLabel: confirmationLabel
    }, user, correlationId);
  });
}
