import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';

const appScriptRoot = resolve(import.meta.dirname, '../../apps-script');

function contextFor({ enabled = true, receivedQuantity = 0, receiptQuantity = 0 } = {}) {
  const properties = new Map([
    ['HAU_RESTOCK_WORKFLOW_ENABLED', enabled ? 'true' : 'false'],
  ]);
  const tables = new Map();
  const idempotency = new Map();
  const scopes = [];
  const history = [];
  const audit = [];
  const ledger = [];
  const table = (name) => {
    if (!tables.has(name)) tables.set(name, []);
    return tables.get(name);
  };
  const context = vm.createContext({
    console,
    Object,
    JSON,
    Date,
    Math,
    Number,
    String,
    Boolean,
    Array,
    Error,
    isFinite,
    isNaN,
    PropertiesService: {
      getScriptProperties: () => ({ getProperty: (key) => properties.get(key) ?? null }),
    },
  });
  for (const file of ['Config.gs', 'Validation.gs', 'RestockService.gs']) {
    vm.runInContext(readFileSync(resolve(appScriptRoot, file), 'utf8'), context, { filename: file });
  }

  context.HAU_CAPABILITIES_ = {
    VIEW_REQUEST: 'request.view',
    FULFILL_PROCURE: 'fulfillment.procure',
    FULFILL_RECEIVE: 'fulfillment.receive',
  };
  context.authorizationContractVersion_ = () => 2;
  context.booleanValue_ = (value, defaultValue) => {
    if (typeof value === 'boolean') return value;
    if (String(value).toUpperCase() === 'TRUE') return true;
    if (String(value).toUpperCase() === 'FALSE') return false;
    return defaultValue;
  };
  context.authorizationCan_ = (_user, _capability, resource) => {
    scopes.push(resource);
    return true;
  };
  context.requireCapability_ = (_capability, resource) => {
    scopes.push(resource);
    return { User_ID: 'SYN-INVENTORY-HEAD', Role: 'COMMITTEE_HEAD' };
  };
  context.withScriptLock_ = (operation) => operation();
  context.resolveCurrentUser_ = () => ({ User_ID: 'SYN-INVENTORY-HEAD' });
  context.requireIdempotency_ = (command) =>
    context.requireText_(command.idempotencyKey || command.clientRequestId, 'idempotencyKey');
  context.idempotencyReplay_ = (key) => idempotency.get(key) ?? null;
  context.recordIdempotency_ = (key, result) => {
    idempotency.set(key, result);
    return result;
  };
  context.nowIso_ = () => '2026-07-16T10:00:00+08:00';
  let nextId = 0;
  context.allocateId_ = (prefix) => `SYN-${prefix}-${++nextId}`;
  context.readObjects_ = (sheet) => table(sheet);
  context.findOne_ = (sheet, key, value) =>
    table(sheet).find((row) => String(row[key]) === String(value)) || null;
  context.findAll_ = (sheet, predicate) => table(sheet).filter(predicate);
  context.appendObject_ = (sheet, row) => {
    const stored = { ...row, _row: table(sheet).length + 2 };
    table(sheet).push(stored);
    return stored;
  };
  context.updateObject_ = (sheet, rowNumber, patch) => {
    const row = table(sheet).find((entry) => entry._row === rowNumber);
    if (!row) throw new Error(`Missing synthetic row ${rowNumber}`);
    Object.assign(row, patch);
    return row;
  };
  context.itemById_ = (id) => context.findOne_(context.HAU_SHEETS.ITEMS, 'Item_ID', id);
  context.assertTransactableItem_ = (item) => {
    if (!item || item.Status !== 'ACTIVE') throw context.appError_('ITEM_NOT_ACTIVE', 'Item is not active.', false);
  };
  context.appendLedger_ = (command) => {
    const row = { ...command, Transaction_ID: `SYN-TXN-${ledger.length + 1}` };
    ledger.push(row);
    return row;
  };
  context.history_ = (...args) => history.push(args);
  context.audit_ = (...args) => audit.push(args);
  context.deriveParentRequestStatus_ = () => 'PARTIALLY_FULFILLED';

  table(context.HAU_SHEETS.REQUESTS).push({
    _row: 2,
    Request_ID: 'SYN-REQ-1',
    Request_Type: 'CATALOG_RESTOCK',
    Status: 'ACCEPTED',
    Requester_Name: 'Synthetic Requester',
    Department: 'Synthetic Department',
    Created_At: '2026-07-15T08:00:00+08:00',
  });
  table(context.HAU_SHEETS.REQUEST_LINES).push(
    {
      _row: 2,
      Request_Line_ID: 'SYN-LINE-1',
      Request_ID: 'SYN-REQ-1',
      Item_ID: 'SYN-ITEM-1',
      Description: 'Synthetic paper',
      Requested_Qty: 10,
      Received_Qty: receivedQuantity,
      Unit: 'ream',
      Status: receiptQuantity || receivedQuantity ? 'PARTIALLY_RECEIVED' : 'FOR_CANVASSING',
      Workflow_Revision: 2,
      Created_At: '2026-07-15T08:00:00+08:00',
      Updated_At: '2026-07-15T08:00:00+08:00',
    },
    {
      _row: 3,
      Request_Line_ID: 'SYN-SIBLING-2',
      Request_ID: 'SYN-REQ-1',
      Item_ID: 'SYN-ITEM-2',
      Description: 'Synthetic sibling',
      Requested_Qty: 5,
      Received_Qty: 0,
      Unit: 'box',
      Status: 'TO_BE_PROCURED',
      Workflow_Revision: 7,
    },
  );
  table(context.HAU_SHEETS.ITEMS).push(
    { _row: 2, Item_ID: 'SYN-ITEM-1', Item_Name: 'Synthetic Paper', Unit: 'ream', Status: 'ACTIVE', Stock_Area: 'PANTRY' },
    { _row: 3, Item_ID: 'SYN-ITEM-2', Item_Name: 'Synthetic Sibling', Unit: 'box', Status: 'ACTIVE', Stock_Area: 'PANTRY' },
  );
  table(context.HAU_SHEETS.CANVASS).push({
    _row: 2,
    Canvass_ID: 'SYN-CANVASS-1',
    Linked_Request_Line_ID: 'SYN-LINE-1',
    Supplier_Name: 'Synthetic Supplier',
    Supplier_TIN: 'must-not-leak',
    Contact: 'must-not-leak@example.invalid',
    Price: 120,
    Unit: 'ream',
    Preferred: true,
    Status: 'ACTIVE',
    Checked_At: '2026-07-15T09:00:00+08:00',
  });
  if (receiptQuantity) {
    table(context.HAU_SHEETS.RESTOCK).push({
      _row: 2,
      Restock_ID: 'SYN-RST-0',
      Source_Request_ID: 'SYN-REQ-1',
      Source_Request_Line_ID: 'SYN-LINE-1',
      Item_ID: 'SYN-ITEM-1',
      Quantity: receiptQuantity,
      Unit: 'ream',
      Status: 'PARTIALLY_RECEIVED',
      Received_At: '2026-07-15T10:00:00+08:00',
    });
  }
  table(context.HAU_SHEETS.HISTORY).push({
    History_ID: 'SYN-HIS-1',
    Entity_Type: 'REQUEST_LINE',
    Entity_ID: 'SYN-LINE-1',
    Previous_Status: 'SUBMITTED',
    New_Status: 'FOR_CANVASSING',
    Changed_At: '2026-07-15T08:30:00+08:00',
    Reason: 'Accepted for restock',
  });

  return { context, table, properties, scopes, history, audit, ledger };
}

function transitionCommand(overrides = {}) {
  return {
    restockRequestId: 'RRQ-SYN-LINE-1',
    requestLineId: 'SYN-LINE-1',
    expectedRevision: 2,
    action: 'SEND_TO_BUDGET_REVIEW',
    reason: 'Preferred quote checked against the request.',
    idempotencyKey: 'SYN-TRANSITION-1',
    ...overrides,
  };
}

function receiptCommand(overrides = {}) {
  return {
    restockRequestId: 'RRQ-SYN-LINE-1',
    requestLineId: 'SYN-LINE-1',
    sourceRequestId: 'SYN-REQ-1',
    itemId: 'SYN-ITEM-1',
    expectedRevision: 2,
    quantity: 4,
    unit: 'ream',
    unitPrice: 120,
    supplierName: 'Synthetic Supplier',
    idempotencyKey: 'SYN-RECEIPT-1',
    ...overrides,
  };
}

describe('Apps Script durable restock safety workflow', () => {
  it('returns a line projection with server decisions, scoped authorization, and no sensitive supplier fields', () => {
    const { context, scopes } = contextFor();
    const queue = context.restockQueueDtos_({ User_ID: 'SYN-INVENTORY-HEAD' });
    expect(queue).toHaveLength(2);
    expect(queue[0]).toMatchObject({
      id: 'RRQ-SYN-LINE-1',
      requestId: 'SYN-REQ-1',
      requestLineId: 'SYN-LINE-1',
      workflowRevision: 2,
      preferredQuoteCount: 1,
      reconciliationRequired: false,
    });
    const detail = context.getRestockDetail_({
      restockRequestId: 'RRQ-SYN-LINE-1',
      requestLineId: 'SYN-LINE-1',
    }).restock;
    expect(detail.preferredQuote).toEqual({
      id: 'SYN-CANVASS-1',
      supplierName: 'Synthetic Supplier',
      price: 120,
      unit: 'ream',
      checkedAt: '2026-07-15T09:00:00+08:00',
    });
    expect(JSON.stringify(detail)).not.toMatch(/must-not-leak|Supplier_TIN|Contact/);
    expect(detail.timeline).toHaveLength(1);
    expect(detail.allowedActions.find((action) => action.action === 'SEND_TO_BUDGET_REVIEW')).toMatchObject({ allowed: true });
    expect(detail.allowedActions.find((action) => action.action === 'RECEIVE')).toMatchObject({ allowed: false });
    expect(scopes).toContainEqual({ committeeIds: ['COM_INVENTORY_PANTRY'] });
  });

  it('transitions one linked line with revision, history, audit, and idempotent replay', () => {
    const { context, table, history, audit } = contextFor();
    const first = context.transitionRestock_(transitionCommand(), 'COR-TRANSITION');
    const replay = context.transitionRestock_(transitionCommand(), 'COR-REPLAY');
    expect(first).toMatchObject({ status: 'WAITING_FOR_BUDGET', workflowRevision: 3 });
    expect(replay).toMatchObject({ status: 'WAITING_FOR_BUDGET', workflowRevision: 3, idempotentReplay: true });
    expect(table(context.HAU_SHEETS.REQUEST_LINES)[0]).toMatchObject({ Status: 'WAITING_FOR_BUDGET', Workflow_Revision: 3 });
    expect(table(context.HAU_SHEETS.REQUEST_LINES)[1]).toMatchObject({ Status: 'TO_BE_PROCURED', Workflow_Revision: 7 });
    expect(history.filter((entry) => entry[0] === 'REQUEST_LINE')).toHaveLength(1);
    expect(audit).toHaveLength(1);
  });

  it('fails closed for disabled writes and stale revisions while keeping read-only detail available', () => {
    const disabled = contextFor({ enabled: false });
    const detail = disabled.context.getRestockDetail_({
      restockRequestId: 'RRQ-SYN-LINE-1',
      requestLineId: 'SYN-LINE-1',
    }).restock;
    expect(detail.workflowEnabled).toBe(false);
    expect(detail.allowedActions.every((action) => !action.allowed)).toBe(true);
    expect(() => disabled.context.transitionRestock_(transitionCommand(), 'COR-DISABLED')).toThrowError(
      expect.objectContaining({ code: 'FEATURE_DISABLED' }),
    );
    const stale = contextFor();
    expect(() =>
      stale.context.transitionRestock_(transitionCommand({ expectedRevision: 1 }), 'COR-STALE'),
    ).toThrowError(expect.objectContaining({ code: 'REVISION_CONFLICT' }));
  });

  it('posts cumulative immutable receipts and never completes a sibling line', () => {
    const { context, table, history, audit, ledger } = contextFor();
    table(context.HAU_SHEETS.REQUEST_LINES)[0].Status = 'TO_BE_PROCURED';
    const partial = context.receiveRestock_(receiptCommand(), 'COR-PARTIAL');
    const replay = context.receiveRestock_(receiptCommand(), 'COR-REPLAY');
    expect(partial).toMatchObject({
      requestLineId: 'SYN-LINE-1',
      quantityReceivedTotal: 4,
      quantityRemaining: 6,
      status: 'PARTIALLY_RECEIVED',
      workflowRevision: 3,
    });
    expect(replay).toMatchObject({ idempotentReplay: true, quantityReceivedTotal: 4 });
    const final = context.receiveRestock_(
      receiptCommand({ expectedRevision: 3, quantity: 6, idempotencyKey: 'SYN-RECEIPT-2' }),
      'COR-FINAL',
    );
    expect(final).toMatchObject({ quantityReceivedTotal: 10, quantityRemaining: 0, status: 'RESTOCKED', workflowRevision: 4 });
    expect(table(context.HAU_SHEETS.RESTOCK)).toHaveLength(2);
    expect(ledger).toHaveLength(2);
    expect(history.filter((entry) => entry[0] === 'REQUEST_LINE')).toHaveLength(2);
    expect(audit).toHaveLength(2);
    expect(table(context.HAU_SHEETS.REQUEST_LINES)[0]).toMatchObject({ Received_Qty: 10, Status: 'RESTOCKED', Workflow_Revision: 4 });
    expect(table(context.HAU_SHEETS.REQUEST_LINES)[1]).toMatchObject({ Received_Qty: 0, Status: 'TO_BE_PROCURED', Workflow_Revision: 7 });
  });

  it('blocks over-receipt, projection mismatch, and stored-versus-immutable reconciliation drift', () => {
    const over = contextFor({ receivedQuantity: 8, receiptQuantity: 8 });
    expect(() =>
      over.context.receiveRestock_(receiptCommand({ quantity: 3 }), 'COR-OVER'),
    ).toThrowError(expect.objectContaining({ code: 'OVER_RECEIPT' }));

    const mismatch = contextFor();
    mismatch.table(mismatch.context.HAU_SHEETS.REQUEST_LINES)[0].Status = 'TO_BE_PROCURED';
    expect(() =>
      mismatch.context.receiveRestock_(receiptCommand({ restockRequestId: 'RRQ-WRONG' }), 'COR-WRONG'),
    ).toThrowError(expect.objectContaining({ code: 'RESTOCK_ID_MISMATCH' }));
    expect(() =>
      mismatch.context.receiveRestock_(receiptCommand({ unit: 'box' }), 'COR-UNIT'),
    ).toThrowError(expect.objectContaining({ code: 'UNIT_MISMATCH' }));

    const drift = contextFor({ receivedQuantity: 4, receiptQuantity: 3 });
    const detail = drift.context.getRestockDetail_({
      restockRequestId: 'RRQ-SYN-LINE-1',
      requestLineId: 'SYN-LINE-1',
    }).restock;
    expect(detail.reconciliationRequired).toBe(true);
    expect(detail.allowedActions.every((action) => !action.allowed)).toBe(true);
    expect(() => drift.context.receiveRestock_(receiptCommand(), 'COR-DRIFT')).toThrowError(
      expect.objectContaining({ code: 'RESTOCK_RECONCILIATION_REQUIRED' }),
    );
  });
});
