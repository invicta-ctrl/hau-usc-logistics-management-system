import type { FrontendOperationalModuleBootstrap } from '../../integration/backend';
import { numberValue, textValue, type OperationalRecord } from './operationUtils';

export type ReceivingCandidate = {
  id: string;
  requestId: string;
  requestLineId: string;
  itemId: string;
  itemName: string;
  requested: number;
  received: number;
  remaining: number;
  unit: string;
  status: string;
  revision: string;
  supplierName: string;
  preferredQuoteId: string;
  preferredPrice: number;
  preferredQuoteConflict: boolean;
  note: string;
};

export type ReceivingHistoryRow = {
  id: string;
  restockId: string;
  itemName: string;
  quantity: number;
  unit: string;
  invoiceStatus: string;
  invoiceNumber: string;
  hasEvidence: boolean;
  receivedAt: string;
};

export type ProcurementQuote = {
  id: string;
  supplierName: string;
  location: string;
  price: number;
  unit: string;
  receiptStatus: string;
  reliability: string;
  checkedAt: string;
  preferred: boolean;
  preferredRationale: string;
  evidenceAttached: boolean;
};

export type ProcurementRecord = {
  id: string;
  requestId: string;
  requestLineId: string;
  itemName: string;
  itemSpec: string;
  requested: number;
  received: number;
  outstanding: number;
  unit: string;
  status: string;
  procurementStatus: string;
  budgetStatus: string;
  receiptStatus: string;
  neededAt: string;
  preferredCanvassId: string;
  quotes: ProcurementQuote[];
  requestPurpose: string;
  requestDepartment: string;
  note: string;
};

const RECEIVABLE_RESTOCK_STATUSES = new Set(['TO_BE_PROCURED', 'PROCURED', 'PARTIALLY_RECEIVED']);

function byId(rows: OperationalRecord[]) {
  return new Map(rows.map((row) => [textValue(row, ['id']), row]).filter(([id]) => Boolean(id)));
}

function quoteForRestock(row: OperationalRecord, canvassRows: OperationalRecord[]) {
  const restockId = textValue(row, ['id']);
  const requestLineId = textValue(row, ['source_request_line_id', 'sourceRequestLineId']);
  const preferred = canvassRows.filter(
    (quote) =>
      textValue(quote, ['status']) === 'ACTIVE' &&
      Boolean(quote.preferred) &&
      (textValue(quote, ['linkedRestockId', 'linked_restock_id']) === restockId ||
        (requestLineId &&
          (Array.isArray(quote.linkedLineIds)
            ? quote.linkedLineIds.includes(requestLineId)
            : textValue(quote, ['linked_request_line_id']) === requestLineId))),
  );
  return { quote: preferred.length === 1 ? preferred[0] : null, conflict: preferred.length > 1 };
}

export function receivingCandidatesFromBootstrap(
  bootstrap: FrontendOperationalModuleBootstrap,
): ReceivingCandidate[] {
  const items = byId(bootstrap.data.inventoryItems ?? []);
  const canvassRows = bootstrap.data.canvassReferences ?? [];
  return (bootstrap.data.restockRequests ?? [])
    .filter((row) => RECEIVABLE_RESTOCK_STATUSES.has(textValue(row, ['status'])))
    .map((row) => {
      const id = textValue(row, ['id']);
      const itemId = textValue(row, ['item_id', 'itemId']);
      const item = items.get(itemId) ?? {};
      const requested = numberValue(row, ['requested_quantity', 'requestedQuantity', 'quantity']);
      const received = numberValue(row, ['received_quantity', 'receivedQuantity']);
      const { quote, conflict } = quoteForRestock(row, canvassRows);
      return {
        id,
        requestId: textValue(row, ['source_request_id', 'sourceRequestId']),
        requestLineId: textValue(row, ['source_request_line_id', 'sourceRequestLineId']),
        itemId,
        itemName: textValue(item, ['name']) || itemId || 'Item details unavailable',
        requested,
        received,
        remaining: Math.max(0, requested - received),
        unit: textValue(row, ['unit']) || textValue(item, ['unit']) || 'unit',
        status: textValue(row, ['status']),
        revision: textValue(row, ['updated_at', 'updatedAt']),
        supplierName:
          textValue(quote ?? {}, ['supplierName', 'supplier_name']) ||
          textValue(row, ['supplier_name', 'supplierName']),
        preferredQuoteId: textValue(quote ?? {}, ['id']),
        preferredPrice: numberValue(quote ?? {}, ['price']),
        preferredQuoteConflict: conflict,
        note: textValue(row, ['notes', 'reason']),
      };
    })
    .filter(
      (row) =>
        row.id &&
        row.unit &&
        Number.isSafeInteger(row.requested) &&
        Number.isSafeInteger(row.received) &&
        row.requested > 0 &&
        row.received >= 0 &&
        row.remaining > 0,
    )
    .sort((left, right) => right.revision.localeCompare(left.revision));
}

export function receivingRecheckIssue({
  before,
  after,
  quantity,
}: {
  before: ReceivingCandidate;
  after: ReceivingCandidate | null;
  quantity: number;
}) {
  if (!after) return 'This restock record is no longer open for receiving.';
  if (
    before.requestId !== after.requestId ||
    before.requestLineId !== after.requestLineId ||
    before.itemId !== after.itemId ||
    before.unit !== after.unit
  ) {
    return 'The authoritative request, line, item, or receiving unit changed.';
  }
  if (
    before.requested !== after.requested ||
    before.received !== after.received ||
    before.remaining !== after.remaining ||
    before.status !== after.status
  ) {
    return `The cumulative receiving state changed. Only ${after.remaining} ${after.unit} ${
      after.remaining === 1 ? 'remains' : 'remain'
    } receivable.`;
  }
  if (before.revision !== after.revision) return 'The authoritative restock revision changed.';
  if (!Number.isSafeInteger(quantity) || quantity <= 0 || quantity > after.remaining) {
    return `Only ${after.remaining} ${after.unit} ${
      after.remaining === 1 ? 'remains' : 'remain'
    } receivable after the authoritative recheck.`;
  }
  return '';
}

export function receivingConsequence(candidate: ReceivingCandidate, quantity: number) {
  if (!Number.isSafeInteger(quantity) || quantity <= 0) {
    return 'Enter a positive whole-number receiving quantity to see the exact consequence.';
  }
  if (quantity > candidate.remaining) {
    return `This quantity cannot be recorded. Only ${candidate.remaining} ${candidate.unit} ${
      candidate.remaining === 1 ? 'remains' : 'remain'
    } approved for receiving.`;
  }
  const cumulative = candidate.received + quantity;
  const remaining = candidate.requested - cumulative;
  const inventoryEffect = candidate.itemId
    ? ` It also posts ${quantity} ${candidate.unit} into the linked inventory ledger.`
    : ' No inventory item link is reported, so this workspace does not claim an inventory ledger movement.';
  return remaining > 0
    ? `Records a partial receipt and leaves ${remaining} ${candidate.unit} outstanding on this restock record.${inventoryEffect}`
    : `Records the full outstanding receipt and completes cumulative receiving at ${cumulative} of ${candidate.requested} ${candidate.unit}.${inventoryEffect}`;
}

export function receivingHistoryFromBootstrap(
  bootstrap: FrontendOperationalModuleBootstrap,
): ReceivingHistoryRow[] {
  const candidates = new Map(
    (bootstrap.data.restockRequests ?? []).map((row) => {
      const itemId = textValue(row, ['item_id', 'itemId']);
      return [textValue(row, ['id']), { itemId }];
    }),
  );
  const items = byId(bootstrap.data.inventoryItems ?? []);
  return (bootstrap.data.restockRecords ?? [])
    .map((row) => {
      const restockId = textValue(row, ['restock_request_id', 'restockRequestId']);
      const itemId = candidates.get(restockId)?.itemId ?? '';
      return {
        id: textValue(row, ['id']),
        restockId,
        itemName: textValue(items.get(itemId) ?? {}, ['name']) || itemId || 'Item not reported',
        quantity: numberValue(row, ['quantity']),
        unit: textValue(row, ['unit']) || 'unit',
        invoiceStatus: textValue(row, ['invoice_status', 'invoiceStatus']),
        invoiceNumber: textValue(row, ['invoice_number', 'invoiceNumber']),
        hasEvidence: Boolean(textValue(row, ['evidence_id', 'evidenceId'])),
        receivedAt: textValue(row, ['received_at', 'receivedAt']),
      };
    })
    .filter((row) => row.id && row.restockId)
    .sort((left, right) => right.receivedAt.localeCompare(left.receivedAt));
}

function quotesForDeliverable(deliverable: OperationalRecord, canvassRows: OperationalRecord[]) {
  const deliverableId = textValue(deliverable, ['id']);
  const requestLineId = textValue(deliverable, ['requestLineId', 'request_line_id']);
  const linkedIds = new Set(
    Array.isArray(deliverable.linkedCanvassIds)
      ? deliverable.linkedCanvassIds.filter((value): value is string => typeof value === 'string')
      : [],
  );
  const preferredCanvassId = textValue(deliverable, ['preferredCanvassId', 'preferred_canvass_id']);
  return canvassRows
    .filter((quote) => {
      const lineIds = Array.isArray(quote.linkedLineIds) ? quote.linkedLineIds : [];
      return (
        linkedIds.has(textValue(quote, ['id'])) ||
        textValue(quote, ['linkedDeliverableId', 'linked_deliverable_id']) === deliverableId ||
        (requestLineId && lineIds.includes(requestLineId))
      );
    })
    .map((quote) => ({
      id: textValue(quote, ['id']),
      supplierName: textValue(quote, ['supplierName', 'supplier_name']) || 'Supplier not reported',
      location: textValue(quote, ['location']),
      price: numberValue(quote, ['price']),
      unit: textValue(quote, ['unit']) || 'unit',
      receiptStatus: textValue(quote, ['receiptStatus', 'receipt_status']),
      reliability: textValue(quote, ['reliability']),
      checkedAt: textValue(quote, ['checkedAt', 'checked_at']),
      preferred: preferredCanvassId
        ? textValue(quote, ['id']) === preferredCanvassId
        : Boolean(quote.preferred),
      preferredRationale: textValue(quote, ['preferredRationale', 'preferred_rationale']),
      evidenceAttached: Boolean(textValue(quote, ['evidenceId', 'evidence_id'])),
    }))
    .sort((left, right) => Number(right.preferred) - Number(left.preferred) || left.price - right.price);
}

export function procurementRecordsFromBootstrap(
  bootstrap: FrontendOperationalModuleBootstrap,
): ProcurementRecord[] {
  const requests = byId(bootstrap.data.requests ?? []);
  const lines = byId(bootstrap.data.requestLines ?? []);
  const canvassRows = bootstrap.data.canvassReferences ?? [];
  return (bootstrap.data.deliverables ?? [])
    .map((row) => {
      const requestId = textValue(row, ['requestId', 'request_id']);
      const requestLineId = textValue(row, ['requestLineId', 'request_line_id']);
      const request = requests.get(requestId) ?? {};
      const line = lines.get(requestLineId) ?? {};
      const requested = numberValue(row, ['quantity', 'quantityRequested', 'quantity_requested']);
      const received = numberValue(row, ['quantityReceived', 'quantity_received']);
      return {
        id: textValue(row, ['id']),
        requestId,
        requestLineId,
        itemName:
          textValue(row, ['itemSpec', 'item_spec']) ||
          textValue(line, ['description']) ||
          'Deliverable details unavailable',
        itemSpec: textValue(row, ['itemSpec', 'item_spec']) || textValue(line, ['specification']),
        requested,
        received,
        outstanding: Math.max(0, requested - received),
        unit: textValue(row, ['unit']) || textValue(line, ['unit']) || 'unit',
        status: textValue(row, ['status']),
        procurementStatus: textValue(row, ['procurementStatus', 'procurement_status']),
        budgetStatus: textValue(row, ['budgetStatus', 'budget_status']),
        receiptStatus: textValue(row, ['receiptStatus', 'receipt_status']),
        neededAt: textValue(row, ['neededAt', 'needed_at']) || textValue(line, ['neededAt', 'needed_at']),
        preferredCanvassId: textValue(row, ['preferredCanvassId', 'preferred_canvass_id']),
        quotes: quotesForDeliverable(row, canvassRows),
        requestPurpose: textValue(request, ['purpose']),
        requestDepartment: textValue(request, ['department']),
        note: textValue(row, ['notes']),
      };
    })
    .filter((row) => row.id)
    .sort((left, right) => left.neededAt.localeCompare(right.neededAt) || left.id.localeCompare(right.id));
}

export function procurementConsequence(record: ProcurementRecord) {
  if (['CANCELLED', 'REJECTED'].includes(record.status)) {
    return 'This deliverable is closed without fulfillment. No procurement or receiving action is presented.';
  }
  if (record.status === 'READY_TO_RELEASE' || record.status === 'RELEASED') {
    return 'Procurement and receiving are complete. The next supported custody step belongs in the Release Desk.';
  }
  if (record.status === 'RECEIVED' || record.outstanding === 0) {
    return 'Cumulative receiving is complete. No outstanding procurement quantity remains.';
  }
  if (record.status === 'WAITING_FOR_BUDGET' || record.budgetStatus === 'WAITING_FOR_BUDGET') {
    return 'Budget clearance is the next governed step before a procurement commitment can be recorded.';
  }
  if (record.status === 'TO_BE_PROCURED') {
    return record.preferredCanvassId
      ? `The preferred quote is identified. Procurement must be recorded through its governed transition before ${record.outstanding} ${record.unit} can be received.`
      : 'Exactly one active preferred canvass reference must be selected through the governed procurement workflow.';
  }
  if (record.status === 'PROCURED' || record.status === 'PARTIALLY_RECEIVED') {
    return `${record.outstanding} ${record.unit} remain for governed receiving. Receiving evidence and cumulative quantity checks are required.`;
  }
  return 'No supported update action is available from this status. Review the linked request and procurement record.';
}
