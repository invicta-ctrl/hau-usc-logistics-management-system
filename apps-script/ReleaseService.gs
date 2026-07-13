function releaseLineInputs_(command) {
  var lines = Array.isArray(command.lines) ? command.lines.slice() : [];
  if (!lines.length && command.requestLineId) {
    lines = [{
      requestLineId: command.requestLineId,
      quantity: command.quantity,
      partialReason: command.partialReason || ''
    }];
  }
  if (!lines.length) {
    throw appError_('VALIDATION_ERROR', 'At least one release line is required.', false);
  }
  return lines;
}

function releaseReservationTotal_(itemId, requestLineId) {
  return findAll_(HAU_SHEETS.RESERVATIONS, function(row) {
    return String(row.Item_ID) === String(itemId) &&
      String(row.Request_Line_ID) === String(requestLineId) &&
      String(row.Status) === 'ACTIVE';
  }).reduce(function(total, row) {
    return total + Number(row.Quantity || 0);
  }, 0);
}

function releaseEvidencePayload_(evidence, releaseId, requestId, key) {
  return Object.assign({}, evidence || {}, {
    evidenceType: 'RELEASE_CONFIRMATION_PHOTO',
    relatedEntityType: 'RELEASE',
    relatedEntityId: releaseId,
    requestId: requestId,
    secondaryId: requestId || 'NA',
    clientRequestId: key + ':evidence'
  });
}

function preflightReleaseEvidence_(command, requestId, key) {
  if (!command.evidence) return null;
  var payload = releaseEvidencePayload_(command.evidence, 'PENDING_RELEASE', requestId, key);
  authorizeEvidenceUpload_(payload.evidenceType);
  var validated = validateEvidencePayload_(payload);
  payload.evidenceType = validated.type;
  payload.mimeType = validated.mime;
  payload.relatedEntityType = validated.relatedEntityType;
  var bytes = decodeEvidenceBytes_(payload);
  validateUploadedBytes_(bytes, validated.mime, false);
  folderForEvidence_(payload.evidenceType, payload);
  return payload;
}

function preflightRelease_(command, user, key) {
  var recipientName = requireText_(command.recipientName, 'recipientName');
  var inputs = releaseLineInputs_(command);
  var seenLineIds = {};
  var prepared = [];
  var itemTotals = {};
  var eventItemTotals = {};
  var requestId = String(command.requestId || '').trim();
  var eventId = String(command.eventId || '').trim();
  var requestBound = Object.prototype.hasOwnProperty.call(command, 'requestId');
  var eventBound = Object.prototype.hasOwnProperty.call(command, 'eventId');

  inputs.forEach(function(input) {
    requireObject_(input, 'Release line');
    var requestLineId = requireText_(input.requestLineId, 'requestLineId');
    if (seenLineIds[requestLineId]) {
      throw appError_('DUPLICATE_RELEASE_LINE', 'A request line may appear only once in a release command.', false, {
        requestLineId: requestLineId
      });
    }
    seenLineIds[requestLineId] = true;

    var line = findOne_(HAU_SHEETS.REQUEST_LINES, 'Request_Line_ID', requestLineId);
    if (!line) throw appError_('LINE_NOT_FOUND', 'Request line was not found.', false);
    var lineRequestId = requireText_(line.Request_ID, 'requestId');
    var lineEventId = String(line.Event_ID || '').trim();
    if (!requestBound) {
      requestId = lineRequestId;
      requestBound = true;
    } else if (String(requestId) !== String(lineRequestId)) {
      throw appError_('CROSS_REQUEST_RELEASE', 'All selected lines must belong to the same request.', false, {
        requestLineId: requestLineId
      });
    }
    if (!eventBound) {
      eventId = lineEventId;
      eventBound = true;
    } else if (String(eventId) !== String(lineEventId)) {
      throw appError_('CROSS_EVENT_RELEASE', 'All selected lines must belong to the same event.', false, {
        requestLineId: requestLineId
      });
    }

    var quantity = positiveNumber_(input.quantity, 'quantity');
    var requested = Number(line.Requested_Qty);
    var alreadyReleased = Number(line.Released_Qty || 0);
    if (!isFinite(requested) || requested <= 0 || !isFinite(alreadyReleased) || alreadyReleased < 0 || alreadyReleased > requested) {
      throw appError_('INVALID_REQUEST_LINE_QUANTITY', 'The request line quantity state is invalid and must be reviewed.', false, {
        requestLineId: requestLineId
      });
    }
    var remaining = requested - alreadyReleased;
    if (quantity > remaining) {
      throw appError_('OVER_RELEASE', 'Release quantity exceeds the remaining request quantity.', false, {
        remaining: remaining,
        requestLineId: requestLineId
      });
    }
    var partialReason = String(input.partialReason || command.partialReason || '').trim();
    if (quantity < remaining && !partialReason) {
      throw appError_('PARTIAL_RELEASE_REASON_REQUIRED', 'A reason is required for a partial release.', false, {
        requestLineId: requestLineId
      });
    }
    if (['READY_TO_RELEASE', 'PARTIALLY_RELEASED'].indexOf(String(line.Status)) < 0) {
      throw appError_('INVALID_TRANSITION', 'This line is not ready for release.', false, {
        requestLineId: requestLineId
      });
    }

    var route;
    if (line.Item_ID) {
      var item = itemById_(line.Item_ID);
      assertTransactableItem_(item);
      var reservationTotal = releaseReservationTotal_(line.Item_ID, line.Request_Line_ID);
      if (!isFinite(reservationTotal) || reservationTotal < quantity) {
        throw appError_('RESERVATION_CONFLICT', 'The active reservation no longer covers this quantity.', false, {
          reserved: isFinite(reservationTotal) ? reservationTotal : 0,
          requested: quantity,
          requestLineId: requestLineId
        });
      }
      itemTotals[line.Item_ID] = Number(itemTotals[line.Item_ID] || 0) + quantity;
      route = { itemId: line.Item_ID, eventItemId: '' };
    } else {
      var eventItemId = String(line.Event_Item_ID || '').trim();
      if (!eventItemId) {
        throw appError_('EVENT_ITEM_NOT_FOUND', 'The received event item is not registered.', false, {
          requestLineId: requestLineId
        });
      }
      eventItemTotals[eventItemId] = Number(eventItemTotals[eventItemId] || 0) + quantity;
      route = { itemId: '', eventItemId: eventItemId };
    }

    prepared.push({
      input: input,
      line: line,
      quantity: quantity,
      remaining: remaining,
      partialReason: partialReason,
      route: route
    });
  });

  Object.keys(itemTotals).forEach(function(itemId) {
    var available = onHand_(itemId);
    if (!isFinite(available) || itemTotals[itemId] > available) {
      throw appError_('INSUFFICIENT_STOCK', 'Physical stock is insufficient for the complete release.', false, {
        itemId: itemId,
        available: isFinite(available) ? available : 0,
        requested: itemTotals[itemId]
      });
    }
  });
  Object.keys(eventItemTotals).forEach(function(eventItemId) {
    var available = eventOnHand_(eventItemId);
    if (!isFinite(available) || eventItemTotals[eventItemId] > available) {
      throw appError_('INSUFFICIENT_EVENT_BALANCE', 'Event-item balance is insufficient for the complete release.', false, {
        eventItemId: eventItemId,
        available: isFinite(available) ? available : 0,
        requested: eventItemTotals[eventItemId]
      });
    }
  });

  var evidence = preflightReleaseEvidence_(command, requestId, key);
  return {
    user: user,
    key: key,
    requestId: requestId,
    eventId: eventId,
    recipientName: recipientName,
    recipientRole: String(command.recipientRole || '').trim(),
    department: String(command.department || '').trim(),
    lines: prepared,
    evidence: evidence
  };
}

function releaseRecoveryError_(error, releaseId, evidenceId, attemptedLineIds, completedLineIds) {
  if (error && error.code === 'RELEASE_RECOVERY_REQUIRED') return error;
  return appError_(
    'RELEASE_RECOVERY_REQUIRED',
    'Release processing stopped after a write began. Do not retry with a new key; an administrator must reconcile the command.',
    false,
    {
      releaseId: releaseId,
      evidenceId: evidenceId || '',
      attemptedLineIds: attemptedLineIds.slice(),
      completedLineIds: completedLineIds.slice(),
      causeCode: error && error.code || 'INTERNAL_ERROR',
      recoveryStatus: 'REVIEW_REQUIRED'
    }
  );
}

function confirmRelease_(command, correlationId) {
  return withScriptLock_(function() {
    command = requireObject_(command, 'Release command');
    var user = requirePermission_('Can_Release');
    var key = requireIdempotency_(command);
    var replay = idempotencyReplay_(key, user);
    if (replay) return Object.assign({ idempotentReplay: true }, replay);

    var prepared = preflightRelease_(command, user, key);
    var releaseId = allocateId_('REL');
    var transactions = [];
    var attemptedLineIds = [];
    var lineIds = [];
    var quantities = [];
    var units = [];
    var evidenceId = '';
    var writeStarted = false;

    try {
      if (prepared.evidence) {
        writeStarted = true;
        evidenceId = uploadEvidence_(
          releaseEvidencePayload_(command.evidence, releaseId, prepared.requestId, key),
          correlationId
        ).evidenceId;
      }

      prepared.lines.forEach(function(entry) {
        var line = entry.line;
        var tx;
        writeStarted = true;
        attemptedLineIds.push(line.Request_Line_ID);
        if (entry.route.itemId) {
          consumeReservations_(entry.route.itemId, entry.quantity, {
            requestLineId: line.Request_Line_ID
          }, user);
          tx = appendLedger_({
            type: 'ISSUE',
            direction: 'OUT',
            itemId: entry.route.itemId,
            quantity: entry.quantity,
            unit: line.Unit,
            relatedEntityType: 'RELEASE',
            relatedEntityId: releaseId,
            requestId: line.Request_ID,
            eventId: line.Event_ID,
            idempotencyKey: key + ':' + line.Request_Line_ID,
            notes: command.notes || ''
          }, user);
        } else {
          tx = appendLedger_({
            type: 'ISSUE',
            direction: 'OUT',
            eventItemId: entry.route.eventItemId,
            quantity: entry.quantity,
            unit: line.Unit,
            relatedEntityType: 'RELEASE',
            relatedEntityId: releaseId,
            requestId: line.Request_ID,
            eventId: line.Event_ID,
            idempotencyKey: key + ':' + line.Request_Line_ID,
            notes: command.notes || ''
          }, user);
        }
        var released = Number(line.Released_Qty || 0) + entry.quantity;
        var next = released >= Number(line.Requested_Qty) ? 'COMPLETED' : 'PARTIALLY_RELEASED';
        updateObject_(HAU_SHEETS.REQUEST_LINES, line._row, {
          Released_Qty: released,
          Status: next,
          Updated_At: nowIso_()
        });
        history_('REQUEST_LINE', line.Request_Line_ID, line.Status, next, user, entry.partialReason || 'Physical release', {
          requestId: line.Request_ID,
          eventId: line.Event_ID,
          idempotencyKey: key
        });
        transactions.push(tx.Transaction_ID);
        lineIds.push(line.Request_Line_ID);
        quantities.push(entry.quantity);
        units.push(line.Unit);
      });

      var release = {
        Release_ID: releaseId,
        Created_At: nowIso_(),
        Request_ID: prepared.requestId,
        Event_ID: prepared.eventId,
        Lending_Ticket_ID: command.lendingTicketId || '',
        Recipient_Name: prepared.recipientName,
        Recipient_Role: prepared.recipientRole,
        Department: prepared.department,
        Released_By: user.User_ID,
        Released_At: nowIso_(),
        Status: 'POSTED',
        Evidence_ID: evidenceId,
        Confirmation_Label: 'Release Confirmation | ' + releaseId + ' | ' + (prepared.requestId || 'NA') + ' | ' + nowIso_(),
        Notes: command.notes || '',
        Client_Request_ID: key,
        Request_Line_IDs_JSON: safeJson_(lineIds),
        Quantities_JSON: safeJson_(quantities),
        Units_JSON: safeJson_(units),
        Idempotency_Key: key,
        Reversed_By: ''
      };
      appendObject_(HAU_SHEETS.RELEASES, release);
      if (prepared.requestId) {
        var request = findOne_(HAU_SHEETS.REQUESTS, 'Request_ID', prepared.requestId);
        if (request) {
          var status = deriveParentRequestStatus_(prepared.requestId);
          updateObject_(HAU_SHEETS.REQUESTS, request._row, { Status: status, Updated_At: nowIso_() });
          history_('REQUEST', prepared.requestId, request.Status, status, user, 'Derived after release', {
            requestId: prepared.requestId,
            idempotencyKey: key
          });
        }
      }
      audit_('CONFIRM_RELEASE', 'RELEASE', releaseId, user, correlationId, {
        after: release,
        requestId: prepared.requestId,
        eventId: prepared.eventId
      });
      return recordIdempotency_(key, {
        releaseId: releaseId,
        transactionIds: transactions,
        status: release.Status,
        entityType: 'RELEASE',
        entityId: releaseId
      }, user, correlationId);
    } catch (error) {
      if (!writeStarted) throw error;
      throw releaseRecoveryError_(error, releaseId, evidenceId, attemptedLineIds, lineIds);
    }
  });
}
