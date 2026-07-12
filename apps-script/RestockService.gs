function receiveRestock_(command, correlationId) {
  return withScriptLock_(function() {
    var user = requirePermission_('Can_Receive'), key = requireIdempotency_(command), replay = idempotencyReplay_(key);
    if (replay) return Object.assign({ idempotentReplay: true }, replay);
    var item = itemById_(requireText_(command.itemId, 'itemId')); assertTransactableItem_(item);
    var quantity = positiveNumber_(command.quantity || command.quantityReceivedNow, 'quantity');
    var sourceLineId = command.sourceRequestLineId || command.requestLineId || '', line = null, receivedTotal = quantity, nextLineStatus = '';
    if (sourceLineId) {
      line = findOne_(HAU_SHEETS.REQUEST_LINES, 'Request_Line_ID', sourceLineId);
      if (!line) throw appError_('LINE_NOT_FOUND', 'The linked restock request line was not found.', false);
      if (String(line.Item_ID) !== String(item.Item_ID)) throw appError_('ITEM_MISMATCH', 'The receipt item does not match the linked restock line.', false);
      receivedTotal = Number(line.Received_Qty || 0) + quantity;
      if (receivedTotal > Number(line.Requested_Qty) && !command.authorizedAmendment) throw appError_('OVER_RECEIPT', 'Receipt exceeds the requested line quantity.', false, { required: Number(line.Requested_Qty), received: receivedTotal });
      nextLineStatus = receivedTotal >= Number(line.Requested_Qty) ? 'COMPLETED' : 'PARTIALLY_RECEIVED';
    }
    var restockId = allocateId_('RST'), evidenceId = '';
    if (command.evidence) evidenceId = uploadEvidence_(Object.assign({}, command.evidence, {
      evidenceType: command.invoiceStatus === 'SALES_INVOICE' ? 'RESTOCK_INVOICE' : 'RESTOCK_RECEIPT',
      relatedEntityType: 'RESTOCK', relatedEntityId: restockId, itemId: item.Item_ID, secondaryId: item.Item_ID,
      requestId: command.sourceRequestId || line && line.Request_ID || '', requestLineId: sourceLineId,
      clientRequestId: key + ':evidence'
    }), correlationId).evidenceId;
    var unitPrice = nonNegativeNumber_(command.unitPrice, 'unitPrice');
    var exceptionNotes = [command.notes, command.shortageNote, command.backorderNote, command.substitutionNote,
      command.quantityDamaged && 'Damaged: ' + command.quantityDamaged,
      command.quantityRejected && 'Rejected: ' + command.quantityRejected,
      command.batchNumber && 'Batch: ' + command.batchNumber,
      command.expiryDate && 'Expiry: ' + command.expiryDate].filter(Boolean).join(' | ');
    var row = {
      Restock_ID: restockId, Created_At: nowIso_(), Updated_At: nowIso_(),
      Source_Request_ID: command.sourceRequestId || line && line.Request_ID || '', Source_Request_Line_ID: sourceLineId,
      Item_ID: item.Item_ID, Quantity: quantity, Unit: command.unit || item.Unit,
      Supplier_ID: command.supplierId || '', Supplier_Name: command.supplierName || '', Unit_Price: unitPrice,
      Total_Amount: quantity * unitPrice, Invoice_Status: command.invoiceStatus || 'UNKNOWN', Invoice_Number: command.invoiceNumber || '',
      Supplier_TIN: command.supplierTin || '', Storage_Area: command.storageArea || item.Stock_Area,
      Storage_Location: command.storageLocation || '', Evidence_ID: evidenceId, Requested_At: command.requestedAt || '',
      Received_At: nowIso_(), Received_By: user.User_ID, Status: line ? nextLineStatus : 'RESTOCKED',
      Idempotency_Key: key, Notes: exceptionNotes
    };
    appendObject_(HAU_SHEETS.RESTOCK, row);
    var tx = appendLedger_({ type: 'PURCHASE_RECEIPT', direction: 'IN', itemId: item.Item_ID, quantity: quantity, unit: row.Unit, relatedEntityType: 'RESTOCK', relatedEntityId: restockId, requestId: row.Source_Request_ID, idempotencyKey: key, notes: row.Notes }, user);
    if (line) {
      updateObject_(HAU_SHEETS.REQUEST_LINES, line._row, { Received_Qty: receivedTotal, Status: nextLineStatus, Updated_At: nowIso_() });
      history_('REQUEST_LINE', line.Request_Line_ID, line.Status, nextLineStatus, user, 'Catalog receipt', { requestId: line.Request_ID, idempotencyKey: key, metadata: { quantityReceivedNow: quantity, quantityReceivedTotal: receivedTotal } });
      var request = findOne_(HAU_SHEETS.REQUESTS, 'Request_ID', line.Request_ID);
      if (request) {
        var requestStatus = deriveParentRequestStatus_(request.Request_ID);
        updateObject_(HAU_SHEETS.REQUESTS, request._row, { Status: requestStatus, Updated_At: nowIso_() });
        history_('REQUEST', request.Request_ID, request.Status, requestStatus, user, 'Derived after line receipt', { requestId: request.Request_ID, idempotencyKey: key });
      }
    }
    audit_('RECEIVE_RESTOCK', 'RESTOCK', restockId, user, correlationId, { after: row, requestId: row.Source_Request_ID });
    return recordIdempotency_(key, { restockId: restockId, transactionId: tx.Transaction_ID, evidenceId: evidenceId, quantityReceivedTotal: receivedTotal, status: row.Status }, user, correlationId);
  });
}
