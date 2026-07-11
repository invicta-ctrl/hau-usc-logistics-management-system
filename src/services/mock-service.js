import { AppError, normalizeError } from '../app/errors.js';
import { allocateId, allocateSimpleId, eventItemId, yearFromDate } from '../domain/ids.js';
import { buildInventoryIndexes } from '../domain/inventory.js';
import { routingDecision, deriveRequestStatus } from '../domain/requests.js';
import { reserveStock, consumeReservation } from '../domain/reservations.js';
import { validateReceipt, receiptTotals, receivingStatus } from '../domain/receiving.js';
import { validateRelease } from '../domain/release.js';
import { validateTransfer } from '../domain/transfers.js';
import { restorableReturnQuantity, derivedLendingStatus } from '../domain/lending.js';
import { assertTransition } from '../domain/transitions.js';
import {
  positiveNumber,
  requiredText,
  controlledCategory,
  controlledUnit,
  nonNegativeNumber,
} from '../domain/validators.js';
import { recomputeRestockParent } from '../domain/restocking.js';
import { can } from '../domain/permissions.js';
import { requireIdempotencyKey, previousResult, storeResult } from './idempotency-service.js';

const now = () => new Date().toISOString();

function requirePermission(state, action) {
  if (!can(state.role, action))
    throw new AppError('FORBIDDEN', `The ${state.role} preview role cannot perform this action.`);
}

function appendAudit(state, { action, entityType, entityId, actor, correlationId, summary }) {
  const id = allocateId(state, 'AUD');
  state.auditLog.push({ id, action, entityType, entityId, actor, timestamp: now(), correlationId, summary });
  state.lastCorrelationId = correlationId;
  return id;
}

function appendLedger(
  state,
  {
    type,
    direction,
    quantity,
    itemId = null,
    eventItemId: eventId = null,
    relatedEntityId,
    idempotencyKey,
    actor,
    note,
    correlationId,
  },
) {
  const id = allocateId(state, 'TXN');
  state.ledgerTransactions.push({
    id,
    type,
    direction,
    quantity: Number(quantity),
    itemId,
    eventItemId: eventId,
    relatedEntityId,
    idempotencyKey,
    actor,
    timestamp: now(),
    note,
    auditCorrelationId: correlationId,
  });
  state.revisions.inventory += 1;
  return id;
}

export class MockService {
  constructor(store) {
    this.store = store;
  }

  async _run(command, action, mutator, change = { views: ['active'], shared: true }) {
    const key = requireIdempotencyKey(command);
    const original = this.store.getState();
    const previous = previousResult(original, key);
    if (previous) return { ...previous, idempotentReplay: true };
    const draft = structuredClone(original);
    const correlationId = `COR-${allocateId(draft, 'AUD').replace('AUD-', '')}`;
    try {
      const result = await mutator(draft, { key, correlationId, actor: command.actor ?? 'PREVIEW_USER' });
      const normalized = { ...structuredClone(result), correlationId };
      storeResult(draft, { key, action, result: normalized, correlationId });
      appendAudit(draft, {
        action,
        entityType: result.entityType ?? 'COMMAND',
        entityId: result.entityId ?? key,
        actor: command.actor ?? 'PREVIEW_USER',
        correlationId,
        summary: result.summary ?? action,
      });
      this.store.replace(draft, change);
      return normalized;
    } catch (error) {
      const normalized = normalizeError(error);
      normalized.correlationId = correlationId;
      console.error(`[${correlationId}] ${action}`, error);
      throw normalized;
    }
  }

  submitRequest(command) {
    return this._run(
      command,
      'SUBMIT_REQUEST',
      async (state, _tx) => {
        requirePermission(state, 'submit_request');
        const type = command.type === 'CATALOG_RESTOCK' ? 'CATALOG_RESTOCK' : 'EVENT_LOGISTICS';
        const requesterName = requiredText(command.requesterName, 'requesterName', 'Requester name');
        if (!Array.isArray(command.lines) || !command.lines.length)
          throw new AppError('VALIDATION_ERROR', 'Add at least one request line.', {
            fieldErrors: { lines: 'Add at least one item.' },
          });
        const id = allocateId(state, 'REQ', yearFromDate(command.dateStart));
        const request = {
          id,
          type,
          eventId: type === 'EVENT_LOGISTICS' ? command.eventId : null,
          originalRequestId: command.originalRequestId || null,
          requesterName,
          requesterGroup: requiredText(command.requesterGroup, 'requesterGroup', 'Requester group'),
          dateStart: command.dateStart,
          dateEnd: command.dateEnd,
          purpose: requiredText(command.purpose, 'purpose', 'Purpose'),
          status: 'FOR_REVIEW',
          createdAt: now(),
        };
        state.requests.push(request);
        for (const draftLine of command.lines) {
          const quantity = positiveNumber(draftLine.quantity);
          controlledUnit(draftLine.unit);
          if (!draftLine.itemId) controlledCategory(draftLine.category);
          state.requestLines.push({
            id: allocateSimpleId(state, 'RL'),
            requestId: id,
            itemId: draftLine.itemId || null,
            description: requiredText(draftLine.description, 'description', 'Item description'),
            category: draftLine.category,
            unit: draftLine.unit,
            quantity,
            releasedQuantity: 0,
            fulfillmentSource: type === 'CATALOG_RESTOCK' ? 'RESTOCK' : 'PENDING_DECISION',
            status: 'FOR_REVIEW',
          });
        }
        state.revisions.requests += 1;
        return { entityType: 'REQUEST', entityId: id, requestId: id, summary: `${id} submitted for review.` };
      },
      { views: ['requests', 'overview'], shared: true },
    );
  }

  acceptRequest(command) {
    return this._run(
      command,
      'ACCEPT_REQUEST',
      async (state, tx) => {
        requirePermission(state, 'review_request');
        const request = state.requests.find((row) => row.id === command.requestId);
        if (!request) throw new AppError('NOT_FOUND', 'Request was not found.');
        assertTransition('request', request.status, 'ACCEPTED');
        const lines = state.requestLines.filter((line) => line.requestId === request.id);
        for (const line of lines) {
          if (line.status !== 'FOR_REVIEW') continue;
          if (request.type === 'CATALOG_RESTOCK') {
            line.fulfillmentSource = 'RESTOCK';
            line.status = 'FOR_CANVASSING';
            state.restockRequests.push({
              id: allocateSimpleId(state, 'RRQ'),
              requestId: request.id,
              requestLineId: line.id,
              itemId: line.itemId,
              quantityOrdered: line.quantity,
              status: 'FOR_CANVASSING',
            });
            continue;
          }
          const indexes = buildInventoryIndexes(state);
          const available = line.itemId
            ? Math.max(0, (indexes.onHand.get(line.itemId) ?? 0) - (indexes.reserved.get(line.itemId) ?? 0))
            : 0;
          const decision = routingDecision({
            selectedItemId: line.itemId,
            requestedQuantity: line.quantity,
            availableQuantity: available,
          });
          if (decision.kind === 'FULL') {
            if (command.simulateReservationFailureAtLineId === line.id)
              throw new AppError(
                'RESERVATION_CONFLICT',
                'Simulated reservation conflict for the audit rollback probe.',
              );
            await Promise.resolve(
              reserveStock(
                state,
                {
                  itemId: line.itemId,
                  quantity: line.quantity,
                  requestLineId: line.id,
                  actor: tx.actor,
                  idempotencyKey: `${tx.key}:${line.id}`,
                },
                indexes,
              ),
            );
            line.fulfillmentSource = 'STOCK';
            line.status = 'READY_TO_RELEASE';
          } else if (decision.kind === 'PARTIAL') {
            const stockLine = {
              ...line,
              id: allocateSimpleId(state, 'RL'),
              quantity: decision.stockQuantity,
              fulfillmentSource: 'STOCK',
              status: 'READY_TO_RELEASE',
            };
            if (command.simulateReservationFailureAtLineId === line.id)
              throw new AppError(
                'RESERVATION_CONFLICT',
                'Simulated reservation conflict for the audit rollback probe.',
              );
            await Promise.resolve(
              reserveStock(
                state,
                {
                  itemId: line.itemId,
                  quantity: stockLine.quantity,
                  requestLineId: stockLine.id,
                  actor: tx.actor,
                  idempotencyKey: `${tx.key}:${stockLine.id}`,
                },
                buildInventoryIndexes(state),
              ),
            );
            state.requestLines.push(stockLine);
            line.quantity = decision.procurementQuantity;
            line.fulfillmentSource = 'PROCUREMENT';
            line.status = 'FOR_CANVASSING';
            state.deliverables.push({
              id: allocateSimpleId(state, 'DEL'),
              requestId: request.id,
              requestLineId: line.id,
              eventId: request.eventId,
              eventItemId: null,
              itemId: line.itemId,
              itemSpec: line.description,
              category: line.category,
              handling:
                state.inventoryItems.find((item) => item.id === line.itemId)?.handling ?? 'Consumable',
              unit: line.unit,
              quantityOrdered: line.quantity,
              status: 'FOR_CANVASSING',
              committee: 'Materials Committee',
              assignee: '',
              preferredQuoteId: null,
            });
          } else {
            line.fulfillmentSource = 'PROCUREMENT';
            line.status = 'FOR_CANVASSING';
            state.deliverables.push({
              id: allocateSimpleId(state, 'DEL'),
              requestId: request.id,
              requestLineId: line.id,
              eventId: request.eventId,
              eventItemId: null,
              itemId: line.itemId,
              itemSpec: line.description,
              category: line.category,
              handling:
                state.inventoryItems.find((item) => item.id === line.itemId)?.handling ?? 'Consumable',
              unit: line.unit,
              quantityOrdered: line.quantity,
              status: 'FOR_CANVASSING',
              committee:
                line.category === 'PANTRY_FOOD'
                  ? 'Food Committee'
                  : line.category === 'EQUIPMENT'
                    ? 'Inventory Committee'
                    : 'Materials Committee',
              assignee: '',
              preferredQuoteId: null,
            });
          }
        }
        request.status = deriveRequestStatus(
          state.requestLines.filter((line) => line.requestId === request.id),
        );
        state.revisions.inventory += 1;
        state.revisions.requests += 1;
        return {
          entityType: 'REQUEST',
          entityId: request.id,
          requestId: request.id,
          summary: `${request.id} accepted with all reservations committed atomically.`,
        };
      },
      { views: ['requests', 'overview', 'release', 'procurement', 'restocking'], shared: true },
    );
  }

  receiveDeliverable(command) {
    return this._run(
      command,
      'RECEIVE_DELIVERABLE',
      async (state, tx) => {
        requirePermission(state, 'receive');
        const deliverable = state.deliverables.find((row) => row.id === command.deliverableId);
        if (!deliverable) throw new AppError('NOT_FOUND', 'Deliverable was not found.');
        if (!['PROCURED', 'PARTIALLY_RECEIVED'].includes(deliverable.status))
          throw new AppError(
            'INVALID_TRANSITION',
            'Only procured or partially received deliverables can be received.',
          );
        const totals = receiptTotals(state.deliverableReceipts, deliverable.id);
        const validation = validateReceipt({
          requiredTotal: deliverable.quantityOrdered,
          alreadyReceived: totals.received,
          quantityReceivedNow: command.quantityReceivedNow,
          quantityDamaged: command.quantityDamaged,
          quantityRejected: command.quantityRejected,
          amendmentQuantity: command.amendmentQuantity,
        });
        deliverable.eventItemId ??= eventItemId(
          state,
          state.events.find((event) => event.id === deliverable.eventId)?.code ?? 'EVENT',
        );
        const receiptId = allocateId(state, 'RCP');
        state.deliverableReceipts.push({
          id: receiptId,
          relatedId: deliverable.id,
          quantityReceived: validation.receivedNow,
          quantityDamaged: validation.damaged,
          quantityRejected: validation.rejected,
          substitutionNote: command.substitutionNote || '',
          shortageNote: command.shortageNote || '',
          receiptStatus: command.receiptStatus || 'PENDING',
          evidenceId: command.evidenceId || null,
          batchExpiry: command.batchExpiry || null,
          condition: command.condition || 'GOOD',
          supplierId: command.supplierId || null,
          receivedBy: tx.actor,
          receivedAt: now(),
          idempotencyKey: tx.key,
        });
        appendLedger(state, {
          type: 'RECEIPT',
          direction: 'IN',
          quantity: validation.receivedNow,
          eventItemId: deliverable.eventItemId,
          relatedEntityId: receiptId,
          idempotencyKey: tx.key,
          actor: tx.actor,
          note: `Deliverable receipt for ${deliverable.id}`,
          correlationId: tx.correlationId,
        });
        deliverable.status = receivingStatus({
          receivedTotal: validation.receivedTotal,
          requiredTotal: deliverable.quantityOrdered,
          finalStatus: 'READY_TO_RELEASE',
        });
        const line = state.requestLines.find((row) => row.id === deliverable.requestLineId);
        if (line) line.status = deliverable.status;
        const request = state.requests.find((row) => row.id === deliverable.requestId);
        if (request)
          request.status = deriveRequestStatus(
            state.requestLines.filter((row) => row.requestId === request.id),
          );
        state.revisions.receipts += 1;
        state.revisions.requests += 1;
        return {
          entityType: 'DELIVERABLE',
          entityId: deliverable.id,
          deliverableId: deliverable.id,
          receiptId,
          eventItemId: deliverable.eventItemId,
          receivedTotal: validation.receivedTotal,
          quantityRemaining: validation.quantityRemaining,
          summary: `${validation.receivedNow} ${deliverable.unit} received; cumulative total ${validation.receivedTotal}.`,
        };
      },
      { views: ['procurement', 'release', 'overview'], shared: true },
    );
  }

  transitionDeliverable(command) {
    return this._run(
      command,
      'TRANSITION_DELIVERABLE',
      async (state) => {
        requirePermission(state, 'review_request');
        const deliverable = state.deliverables.find((row) => row.id === command.deliverableId);
        if (!deliverable) throw new AppError('NOT_FOUND', 'Deliverable was not found.');
        assertTransition('procurement', deliverable.status, command.toStatus);
        if (command.toStatus === 'WAITING_FOR_BUDGET' && !deliverable.preferredQuoteId)
          throw new AppError('PREFERRED_QUOTE_REQUIRED', 'Select a preferred quote with rationale first.');
        if (command.toStatus === 'TO_BE_PROCURED' && !command.reason)
          throw new AppError('TRANSITION_REASON_REQUIRED', 'Record a preview budget/authorization note.');
        deliverable.status = command.toStatus;
        const line = state.requestLines.find((row) => row.id === deliverable.requestLineId);
        if (line) line.status = command.toStatus;
        const request = state.requests.find((row) => row.id === deliverable.requestId);
        if (request)
          request.status = deriveRequestStatus(
            state.requestLines.filter((row) => row.requestId === request.id),
          );
        state.revisions.requests += 1;
        return {
          entityType: 'DELIVERABLE',
          entityId: deliverable.id,
          status: deliverable.status,
          summary: `${deliverable.id} moved to ${deliverable.status}.`,
        };
      },
      { views: ['procurement', 'overview'], shared: true },
    );
  }

  receiveRestock(command) {
    return this._run(
      command,
      'RECEIVE_RESTOCK',
      async (state, tx) => {
        requirePermission(state, 'receive');
        const restock = state.restockRequests.find(
          (row) => row.id === command.restockRequestId && row.requestLineId === command.requestLineId,
        );
        if (!restock) throw new AppError('NOT_FOUND', 'The selected restock request line was not found.');
        if (!['TO_BE_PROCURED', 'PARTIALLY_RECEIVED'].includes(restock.status))
          throw new AppError('INVALID_TRANSITION', 'This restock line is not ready for receiving.');
        const totals = receiptTotals(state.restockReceipts, restock.id);
        const validation = validateReceipt({
          requiredTotal: restock.quantityOrdered,
          alreadyReceived: totals.received,
          quantityReceivedNow: command.quantityReceivedNow,
          quantityDamaged: command.quantityDamaged,
          quantityRejected: command.quantityRejected,
          amendmentQuantity: command.amendmentQuantity,
        });
        const receiptId = allocateId(state, 'RRCP');
        state.restockReceipts.push({
          id: receiptId,
          relatedId: restock.id,
          quantityReceived: validation.receivedNow,
          quantityDamaged: validation.damaged,
          quantityRejected: validation.rejected,
          supplierId: command.supplierId || null,
          invoiceStatus: command.invoiceStatus || 'PENDING',
          invoiceNumber: command.invoiceNumber || '',
          unitPrice: nonNegativeNumber(command.unitPrice ?? 0, 'unitPrice'),
          storageArea: command.storageArea || 'Inventory',
          storageLocation: command.storageLocation || 'To assign',
          evidenceId: command.evidenceId || null,
          notes: command.notes || '',
          receivedBy: tx.actor,
          receivedAt: now(),
          idempotencyKey: tx.key,
        });
        appendLedger(state, {
          type: 'RECEIPT',
          direction: 'IN',
          quantity: validation.receivedNow,
          itemId: restock.itemId,
          relatedEntityId: receiptId,
          idempotencyKey: tx.key,
          actor: tx.actor,
          note: `Restock receipt for ${restock.id}`,
          correlationId: tx.correlationId,
        });
        restock.status = receivingStatus({
          receivedTotal: validation.receivedTotal,
          requiredTotal: restock.quantityOrdered,
          finalStatus: 'RESTOCKED',
        });
        const line = state.requestLines.find((row) => row.id === restock.requestLineId);
        if (line) line.status = restock.status;
        recomputeRestockParent(state, restock.requestId);
        state.revisions.receipts += 1;
        state.revisions.requests += 1;
        return {
          entityType: 'RESTOCK',
          entityId: restock.id,
          restockRequestId: restock.id,
          receiptId,
          receivedTotal: validation.receivedTotal,
          quantityRemaining: validation.quantityRemaining,
          summary: `${restock.id} received at line level; sibling lines unchanged.`,
        };
      },
      { views: ['restocking', 'inventory', 'overview'], shared: true },
    );
  }

  createLendingTicket(command) {
    return this._run(
      command,
      'CREATE_LENDING_TICKET',
      async (state, tx) => {
        requirePermission(state, 'submit_request');
        const item = state.inventoryItems.find((row) => row.id === command.itemId);
        if (!item) throw new AppError('ITEM_SELECTION_REQUIRED', 'Select an exact inventory item.');
        const quantity = positiveNumber(command.quantity);
        if (!command.physicalIdVerified)
          throw new AppError('PHYSICAL_ID_REQUIRED', 'Physical institutional ID verification is required.');
        if (item.handling === 'Loanable' && !command.dueDate)
          throw new AppError('DUE_DATE_REQUIRED', 'A due date is required for loanable items.');
        const id = allocateId(state, 'LND');
        state.lendingTickets.push({
          id,
          itemId: item.id,
          borrowerName: requiredText(command.borrowerName, 'borrowerName', 'Borrower name'),
          studentId: requiredText(command.studentId, 'studentId', 'Student ID number'),
          borrowerGroup: requiredText(command.borrowerGroup, 'borrowerGroup', 'Borrower group'),
          department: requiredText(command.department, 'department', 'Department'),
          contact: requiredText(command.contact, 'contact', 'Contact'),
          purpose: requiredText(command.purpose, 'purpose', 'Purpose'),
          quantity,
          dueDate: item.handling === 'Loanable' ? command.dueDate : null,
          physicalIdVerified: true,
          ticketType: item.handling === 'Loanable' ? 'LOANABLE' : 'CONSUMABLE',
          status: 'FOR_REVIEW',
          handedOutQuantity: 0,
          returnedQuantity: 0,
          conditionOut: null,
          createdAt: now(),
          createdBy: tx.actor,
        });
        state.revisions.lending += 1;
        return {
          entityType: 'LENDING',
          entityId: id,
          ticketId: id,
          summary: `${id} created for review; no stock was deducted.`,
        };
      },
      { views: ['lending', 'overview'], shared: true },
    );
  }

  approveLendingTicket(command) {
    return this._run(
      command,
      'APPROVE_LENDING',
      async (state, tx) => {
        requirePermission(state, 'approve_lending');
        const ticket = state.lendingTickets.find((row) => row.id === command.ticketId);
        if (!ticket) throw new AppError('NOT_FOUND', 'Lending ticket was not found.');
        assertTransition('lending', ticket.status, 'READY_TO_CLAIM');
        reserveStock(
          state,
          {
            itemId: ticket.itemId,
            quantity: ticket.quantity,
            lendingTicketId: ticket.id,
            actor: tx.actor,
            idempotencyKey: tx.key,
          },
          buildInventoryIndexes(state),
        );
        ticket.status = 'READY_TO_CLAIM';
        state.revisions.inventory += 1;
        state.revisions.lending += 1;
        return {
          entityType: 'LENDING',
          entityId: ticket.id,
          ticketId: ticket.id,
          summary: `${ticket.id} approved and reserved.`,
        };
      },
      { views: ['lending', 'release', 'overview'], shared: true },
    );
  }

  confirmLendingHandoff(command) {
    return this._run(
      command,
      'CONFIRM_LENDING_HANDOFF',
      async (state, tx) => {
        requirePermission(state, 'release');
        const ticket = state.lendingTickets.find((row) => row.id === command.ticketId);
        if (!ticket) throw new AppError('NOT_FOUND', 'Lending ticket was not found.');
        const target = ticket.ticketType === 'LOANABLE' ? 'ON_LOAN' : 'COMPLETED';
        assertTransition('lending', ticket.status, target);
        const reservation = state.reservations.find(
          (row) => row.lendingTicketId === ticket.id && row.status === 'ACTIVE',
        );
        if (!reservation || reservation.quantity < ticket.quantity)
          throw new AppError('RESERVATION_MISSING', 'A full active reservation is required for handoff.');
        const indexes = buildInventoryIndexes(state);
        const physical = indexes.onHand.get(ticket.itemId) ?? 0;
        if (physical < ticket.quantity)
          throw new AppError(
            'PHYSICAL_BALANCE_INSUFFICIENT',
            'Physical balance cannot support this handoff.',
          );
        const transactionId = appendLedger(state, {
          type: ticket.ticketType === 'LOANABLE' ? 'LOAN_OUT' : 'ISSUE',
          direction: 'OUT',
          quantity: ticket.quantity,
          itemId: ticket.itemId,
          relatedEntityId: ticket.id,
          idempotencyKey: tx.key,
          actor: tx.actor,
          note: command.conditionOut || 'Condition recorded at handoff',
          correlationId: tx.correlationId,
        });
        consumeReservation(state, reservation.id, ticket.quantity);
        ticket.status = target;
        ticket.handedOutQuantity = ticket.quantity;
        ticket.conditionOut = command.conditionOut || 'GOOD';
        ticket.identityVerificationNote = command.identityVerificationNote || 'Preview verification';
        ticket.handedOffAt = now();
        state.revisions.lending += 1;
        return {
          entityType: 'LENDING',
          entityId: ticket.id,
          ticketId: ticket.id,
          transactionId,
          summary: `${ticket.id} handed off once.`,
        };
      },
      { views: ['lending', 'inventory', 'overview'], shared: true },
    );
  }

  confirmLendingReturn(command) {
    return this._run(
      command,
      'CONFIRM_LENDING_RETURN',
      async (state, tx) => {
        requirePermission(state, 'release');
        const ticket = state.lendingTickets.find((row) => row.id === command.ticketId);
        if (!ticket) throw new AppError('NOT_FOUND', 'Lending ticket was not found.');
        const displayed = derivedLendingStatus(ticket, state.demoToday);
        if (!['ON_LOAN', 'OVERDUE'].includes(displayed))
          throw new AppError('INVALID_TRANSITION', 'Only an active or overdue loan may be returned.');
        const returnedNow = positiveNumber(command.returnedQuantity, 'returnedQuantity');
        const remainingOut = Number(ticket.handedOutQuantity) - Number(ticket.returnedQuantity ?? 0);
        if (returnedNow > remainingOut)
          throw new AppError('OVER_RETURN', `Only ${remainingOut} remains on loan.`);
        const restorable = restorableReturnQuantity({
          handedOut: returnedNow,
          returned: returnedNow,
          lost: command.lostQuantity ?? 0,
          damagedBeyondUse: command.damagedBeyondUse ?? 0,
        });
        let transactionId = null;
        if (restorable > 0)
          transactionId = appendLedger(state, {
            type: 'LOAN_RETURN',
            direction: 'IN',
            quantity: restorable,
            itemId: ticket.itemId,
            relatedEntityId: ticket.id,
            idempotencyKey: tx.key,
            actor: tx.actor,
            note: command.conditionReturn || 'Return condition recorded',
            correlationId: tx.correlationId,
          });
        ticket.returnedQuantity = Number(ticket.returnedQuantity ?? 0) + returnedNow;
        ticket.lostQuantity = Number(ticket.lostQuantity ?? 0) + Number(command.lostQuantity ?? 0);
        ticket.damagedBeyondUse =
          Number(ticket.damagedBeyondUse ?? 0) + Number(command.damagedBeyondUse ?? 0);
        ticket.conditionReturn = command.conditionReturn || 'GOOD';
        ticket.missingParts = command.missingParts || '';
        ticket.receivedBy = tx.actor;
        if (ticket.returnedQuantity >= ticket.handedOutQuantity) ticket.status = 'RETURNED';
        state.revisions.lending += 1;
        return {
          entityType: 'LENDING',
          entityId: ticket.id,
          ticketId: ticket.id,
          transactionId,
          restorableQuantity: restorable,
          status: ticket.status,
          summary: `${returnedNow} returned; ${restorable} restored to stock.`,
        };
      },
      { views: ['lending', 'inventory', 'overview'], shared: true },
    );
  }

  confirmRelease(command) {
    return this._run(
      command,
      'CONFIRM_RELEASE',
      async (state, tx) => {
        requirePermission(state, 'release');
        const line = state.requestLines.find((row) => row.id === command.requestLineId);
        if (!line || !['READY_TO_RELEASE', 'PARTIALLY_RELEASED'].includes(line.status))
          throw new AppError('INVALID_TRANSITION', 'This line is not available for release.');
        const indexes = buildInventoryIndexes(state);
        const deliverable = state.deliverables.find(
          (row) => row.requestLineId === line.id && row.eventItemId,
        );
        const reservation = line.itemId
          ? state.reservations.find((row) => row.requestLineId === line.id && row.status === 'ACTIVE')
          : null;
        const physicalBalance = deliverable
          ? (indexes.eventItemBalance.get(deliverable.eventItemId) ?? 0)
          : (indexes.onHand.get(line.itemId) ?? 0);
        const validation = validateRelease({
          requested: line.quantity,
          released: line.releasedQuantity ?? 0,
          quantity: command.quantity,
          reservationBalance: line.itemId ? (reservation?.quantity ?? 0) : null,
          physicalBalance,
          eventItemBalance: deliverable ? physicalBalance : null,
        });
        const transactionId = appendLedger(state, {
          type: 'ISSUE',
          direction: 'OUT',
          quantity: validation.quantity,
          itemId: deliverable ? null : line.itemId,
          eventItemId: deliverable?.eventItemId ?? null,
          relatedEntityId: line.id,
          idempotencyKey: tx.key,
          actor: tx.actor,
          note: command.remarks || 'Controlled physical release',
          correlationId: tx.correlationId,
        });
        if (reservation) consumeReservation(state, reservation.id, validation.quantity);
        line.releasedQuantity = Number(line.releasedQuantity ?? 0) + validation.quantity;
        line.status = validation.remainingAfter === 0 ? 'COMPLETED' : 'PARTIALLY_RELEASED';
        const request = state.requests.find((row) => row.id === line.requestId);
        request.status = deriveRequestStatus(
          state.requestLines.filter((row) => row.requestId === request.id),
        );
        const releaseId = allocateId(state, 'REL');
        state.releaseRecords.push({
          id: releaseId,
          requestId: request.id,
          requestLineId: line.id,
          quantity: validation.quantity,
          unit: line.unit,
          recipientName: requiredText(command.recipientName, 'recipientName', 'Recipient name'),
          recipientRole: command.recipientRole || '',
          department: command.department || '',
          identityVerificationNote: command.identityVerificationNote || '',
          releasedBy: tx.actor,
          receivedBy: command.receivedBy || command.recipientName,
          releasedAt: now(),
          condition: command.condition || 'GOOD',
          remarks: command.remarks || '',
          partialReason: validation.remainingAfter
            ? requiredText(command.partialReason, 'partialReason', 'Partial release reason')
            : '',
          evidenceId: command.evidenceId || null,
          transactionId,
          idempotencyKey: tx.key,
        });
        state.revisions.requests += 1;
        return {
          entityType: 'RELEASE',
          entityId: releaseId,
          releaseId,
          transactionId,
          requestStatus: request.status,
          lineStatus: line.status,
          summary: `${validation.quantity} ${line.unit} released through the controlled desk.`,
        };
      },
      { views: ['release', 'inventory', 'overview', 'requests'], shared: true },
    );
  }

  transferEventItem(command) {
    return this._run(
      command,
      'TRANSFER_EVENT_ITEM',
      async (state, tx) => {
        requirePermission(state, 'merge_event_item');
        const deliverable = state.deliverables.find(
          (row) => row.id === command.deliverableId && row.eventItemId,
        );
        if (!deliverable) throw new AppError('NOT_FOUND', 'Event item was not found.');
        const indexes = buildInventoryIndexes(state);
        const balance = indexes.eventItemBalance.get(deliverable.eventItemId) ?? 0;
        let target = command.destinationItemId
          ? state.inventoryItems.find((item) => item.id === command.destinationItemId)
          : null;
        const destination = target
          ? { ...target, isNew: false }
          : { isNew: true, unit: command.unit, handling: command.handling, category: command.category };
        const quantity = validateTransfer({
          quantity: command.quantity,
          eventBalance: balance,
          source: { unit: deliverable.unit, handling: deliverable.handling },
          destination,
          role: state.role,
          mergeReason: command.mergeReason,
          semanticConfirmed: command.semanticConfirmed,
        });
        if (!target) {
          controlledCategory(command.category);
          target = {
            id: allocateSimpleId(state, 'ITM'),
            name: requiredText(command.newItemName, 'newItemName', 'New item name'),
            aliases: [],
            category: command.category,
            area: command.area || 'Inventory',
            handling: command.handling,
            unit: command.unit,
            storage: command.storage || 'To assign',
            reorderThreshold: 0,
            status: 'ACTIVE',
            specification: command.newItemName,
            provenance: {
              type: 'EVENT_TRANSFER',
              originEventItemId: deliverable.eventItemId,
              reason: command.mergeReason,
            },
            createdAt: now(),
          };
          state.inventoryItems.push(target);
        }
        const mappingId = allocateSimpleId(state, 'MAP');
        const outTransactionId = appendLedger(state, {
          type: 'TRANSFER_OUT_EVENT',
          direction: 'OUT',
          quantity,
          eventItemId: deliverable.eventItemId,
          relatedEntityId: mappingId,
          idempotencyKey: `${tx.key}:out`,
          actor: tx.actor,
          note: `Transfer to ${target.id}; ${command.mergeReason}`,
          correlationId: tx.correlationId,
        });
        const inTransactionId = appendLedger(state, {
          type: 'TRANSFER_IN_INVENTORY',
          direction: 'IN',
          quantity,
          itemId: target.id,
          relatedEntityId: mappingId,
          idempotencyKey: `${tx.key}:in`,
          actor: tx.actor,
          note: `Origin ${deliverable.eventItemId}; provenance retained`,
          correlationId: tx.correlationId,
        });
        if (outTransactionId === inTransactionId)
          throw new AppError('DUPLICATE_TRANSACTION_ID', 'Paired transactions must have different IDs.');
        return {
          entityType: 'TRANSFER',
          entityId: mappingId,
          mappingId,
          targetItemId: target.id,
          outTransactionId,
          inTransactionId,
          summary: `${quantity} ${deliverable.unit} transferred with paired unique transactions.`,
        };
      },
      { views: ['procurement', 'inventory', 'overview'], shared: true },
    );
  }

  finalizeEvidence(command) {
    return this._run(command, 'FINALIZE_EVIDENCE', async (state, tx) => {
      const id = allocateId(state, 'EVD');
      state.evidenceFiles.push({
        id,
        relatedEntityType: command.relatedEntityType,
        relatedEntityId: command.relatedEntityId,
        name: command.name,
        mimeType: command.mimeType,
        size: command.size,
        accessClass: command.accessClass || 'INTERNAL',
        uploader: tx.actor,
        uploadedAt: now(),
        previewOnly: true,
      });
      return {
        entityType: 'EVIDENCE',
        entityId: id,
        evidenceId: id,
        summary: `${command.name} metadata attached in preview mode.`,
      };
    });
  }

  postEmergencyIssue(command) {
    return this._run(
      command,
      'EMERGENCY_ISSUE',
      async (state, tx) => {
        requirePermission(state, 'release');
        const quantity = positiveNumber(command.quantity);
        requiredText(command.reason, 'reason', 'Reason');
        requiredText(command.approver, 'approver', 'Approver');
        const indexes = buildInventoryIndexes(state);
        if ((indexes.onHand.get(command.itemId) ?? 0) < quantity)
          throw new AppError('PHYSICAL_BALANCE_INSUFFICIENT', 'Emergency issue exceeds physical stock.');
        const transactionId = appendLedger(state, {
          type: 'EMERGENCY_ISSUE',
          direction: 'OUT',
          quantity,
          itemId: command.itemId,
          relatedEntityId: command.reconciliationId,
          idempotencyKey: tx.key,
          actor: tx.actor,
          note: `${command.reason}; approver ${command.approver}`,
          correlationId: tx.correlationId,
        });
        return {
          entityType: 'EMERGENCY_ISSUE',
          entityId: command.reconciliationId,
          transactionId,
          summary: 'Emergency issue posted with mandatory reconciliation.',
        };
      },
      { views: ['lending', 'inventory', 'reports'], shared: true },
    );
  }

  postCycleCountAdjustment(command) {
    return this._run(
      command,
      'CYCLE_COUNT_ADJUSTMENT',
      async (state, tx) => {
        requirePermission(state, 'receive');
        const indexes = buildInventoryIndexes(state);
        const expected = indexes.onHand.get(command.itemId) ?? 0;
        const physical = nonNegativeNumber(command.physicalCount, 'physicalCount');
        const difference = physical - expected;
        if (!difference)
          return {
            entityType: 'CYCLE_COUNT',
            entityId: command.sessionId,
            transactionId: null,
            difference: 0,
            summary: 'Cycle count reconciled with no adjustment.',
          };
        requiredText(command.reason, 'reason', 'Adjustment reason');
        const transactionId = appendLedger(state, {
          type: difference > 0 ? 'ADJUSTMENT_IN' : 'ADJUSTMENT_OUT',
          direction: difference > 0 ? 'IN' : 'OUT',
          quantity: Math.abs(difference),
          itemId: command.itemId,
          relatedEntityId: command.sessionId,
          idempotencyKey: tx.key,
          actor: tx.actor,
          note: command.reason,
          correlationId: tx.correlationId,
        });
        return {
          entityType: 'CYCLE_COUNT',
          entityId: command.sessionId,
          transactionId,
          difference,
          summary: `Cycle count adjustment ${difference}.`,
        };
      },
      { views: ['inventory', 'reports'], shared: true },
    );
  }
}
