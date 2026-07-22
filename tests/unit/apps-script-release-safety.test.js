import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';

const appScriptRoot = resolve(import.meta.dirname, '../../apps-script');

function contextFor() {
  const tables = new Map();
  const idempotency = new Map();
  const history = [];
  const audit = [];
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
  });
  for (const file of ['Config.gs', 'Validation.gs', 'ReleaseService.gs']) {
    vm.runInContext(readFileSync(resolve(appScriptRoot, file), 'utf8'), context, { filename: file });
  }
  context.withScriptLock_ = (operation) => operation();
  context.requirePermission_ = () => ({ User_ID: 'SYN-RELEASER' });
  context.requireIdempotency_ = (command) => context.requireText_(command.idempotencyKey, 'idempotencyKey');
  context.idempotencyReplay_ = (key) => idempotency.get(key) ?? null;
  context.recordIdempotency_ = (key, result) => {
    idempotency.set(key, result);
    return result;
  };
  let nextId = 0;
  context.allocateId_ = (prefix) => `SYN-${prefix}-${++nextId}`;
  context.nowIso_ = () => '2026-07-22T10:00:00+08:00';
  context.findOne_ = (sheet, key, value) =>
    table(sheet).find((row) => String(row[key]) === String(value)) ?? null;
  context.findAll_ = (sheet, predicate) => table(sheet).filter(predicate);
  context.appendObject_ = (sheet, row) => {
    const stored = { ...row, _row: table(sheet).length + 2 };
    table(sheet).push(stored);
    return stored;
  };
  context.updateObject_ = (sheet, rowNumber, patch) => {
    const row = table(sheet).find((entry) => entry._row === rowNumber);
    Object.assign(row, patch);
    return row;
  };
  context.itemById_ = (itemId) => context.findOne_(context.HAU_SHEETS.ITEMS, 'Item_ID', itemId);
  context.assertTransactableItem_ = (item) => {
    if (!item || item.Status !== 'ACTIVE')
      throw context.appError_('ITEM_INACTIVE', 'Item is inactive.', false);
  };
  context.onHand_ = (itemId) => {
    const item = context.itemById_(itemId);
    return (
      Number(item.Opening_Qty || 0) +
      table(context.HAU_SHEETS.LEDGER)
        .filter((row) => row.Item_ID === itemId)
        .reduce((sum, row) => sum + (row.Direction === 'IN' ? 1 : -1) * Number(row.Quantity), 0)
    );
  };
  context.eventOnHand_ = () => 0;
  context.consumeReservations_ = (itemId, quantity, links) => {
    const reservation = table(context.HAU_SHEETS.RESERVATIONS).find(
      (row) =>
        row.Item_ID === itemId && row.Request_Line_ID === links.requestLineId && row.Status === 'ACTIVE',
    );
    if (!reservation || Number(reservation.Quantity) < quantity)
      throw context.appError_('RESERVATION_CONFLICT', 'Reservation is insufficient.', false);
    reservation.Quantity = Number(reservation.Quantity) - quantity;
    if (!reservation.Quantity) reservation.Status = 'CLEARED';
  };
  context.appendLedger_ = (entry) =>
    context.appendObject_(context.HAU_SHEETS.LEDGER, {
      Transaction_ID: `SYN-TXN-${table(context.HAU_SHEETS.LEDGER).length + 1}`,
      Item_ID: entry.itemId,
      Event_Item_ID: entry.eventItemId,
      Direction: entry.direction,
      Quantity: entry.quantity,
      ...entry,
    });
  context.history_ = (...args) => history.push(args);
  context.audit_ = (...args) => audit.push(args);
  context.deriveParentRequestStatus_ = (requestId) =>
    table(context.HAU_SHEETS.REQUEST_LINES)
      .filter((row) => row.Request_ID === requestId)
      .every((row) => row.Status === 'COMPLETED')
      ? 'COMPLETED'
      : 'PARTIALLY_FULFILLED';
  context.uploadEvidence_ = () => ({ evidenceId: 'SYN-EVIDENCE' });

  table(context.HAU_SHEETS.ITEMS).push(
    { _row: 2, Item_ID: 'SYN-ITEM-1', Opening_Qty: 10, Status: 'ACTIVE' },
    { _row: 3, Item_ID: 'SYN-ITEM-2', Opening_Qty: 5, Status: 'ACTIVE' },
  );
  table(context.HAU_SHEETS.REQUESTS).push({
    _row: 2,
    Request_ID: 'SYN-REQ-1',
    Status: 'ACCEPTED',
  });
  table(context.HAU_SHEETS.REQUEST_LINES).push(
    {
      _row: 2,
      Request_Line_ID: 'SYN-LINE-1',
      Request_ID: 'SYN-REQ-1',
      Event_ID: 'SYN-EVENT-1',
      Item_ID: 'SYN-ITEM-1',
      Requested_Qty: 10,
      Released_Qty: 0,
      Unit: 'piece',
      Status: 'READY_TO_RELEASE',
    },
    {
      _row: 3,
      Request_Line_ID: 'SYN-LINE-2',
      Request_ID: 'SYN-REQ-1',
      Event_ID: 'SYN-EVENT-1',
      Item_ID: 'SYN-ITEM-2',
      Requested_Qty: 5,
      Released_Qty: 0,
      Unit: 'piece',
      Status: 'FOR_REVIEW',
    },
  );
  table(context.HAU_SHEETS.RESERVATIONS).push(
    { _row: 2, Item_ID: 'SYN-ITEM-1', Request_Line_ID: 'SYN-LINE-1', Quantity: 10, Status: 'ACTIVE' },
    { _row: 3, Item_ID: 'SYN-ITEM-2', Request_Line_ID: 'SYN-LINE-2', Quantity: 5, Status: 'ACTIVE' },
  );
  context.__table = table;
  context.__history = history;
  context.__audit = audit;
  return context;
}

const command = (overrides = {}) => ({
  requestId: 'SYN-REQ-1',
  eventId: 'SYN-EVENT-1',
  recipientName: 'Synthetic Recipient',
  recipientRole: 'Committee representative',
  department: 'Synthetic Department',
  recipientConfirmed: true,
  lines: [{ requestLineId: 'SYN-LINE-1', quantity: 4 }],
  notes: 'Synthetic partial handoff',
  idempotencyKey: 'SYN-RELEASE-1',
  ...overrides,
});

describe('Apps Script release safety', () => {
  it('requires recipient confirmation before any stock or ledger mutation', () => {
    const context = contextFor();
    expect(() => context.confirmRelease_(command({ recipientConfirmed: false }), 'SYN-COR-1')).toThrowError(
      expect.objectContaining({ code: 'RECIPIENT_CONFIRMATION_REQUIRED' }),
    );
    expect(context.__table(context.HAU_SHEETS.LEDGER)).toHaveLength(0);
    expect(context.__table(context.HAU_SHEETS.RELEASES)).toHaveLength(0);
    expect(context.__table(context.HAU_SHEETS.REQUEST_LINES)[0].Released_Qty).toBe(0);
    expect(context.__table(context.HAU_SHEETS.RESERVATIONS)[0].Quantity).toBe(10);
  });

  it('preflights every selected line before mutating the first line', () => {
    const context = contextFor();
    expect(() =>
      context.confirmRelease_(
        command({
          lines: [
            { requestLineId: 'SYN-LINE-1', quantity: 4 },
            { requestLineId: 'SYN-LINE-2', quantity: 1 },
          ],
        }),
        'SYN-COR-2',
      ),
    ).toThrowError(expect.objectContaining({ code: 'INVALID_TRANSITION' }));
    expect(context.__table(context.HAU_SHEETS.LEDGER)).toHaveLength(0);
    expect(context.__table(context.HAU_SHEETS.REQUEST_LINES)[0].Released_Qty).toBe(0);
    expect(context.__table(context.HAU_SHEETS.RESERVATIONS)[0].Quantity).toBe(10);
  });

  it('records a confirmed partial release once with traceable metadata', () => {
    const context = contextFor();
    const result = context.confirmRelease_(command(), 'SYN-COR-3');
    const replay = context.confirmRelease_(command(), 'SYN-COR-4');
    const release = context.__table(context.HAU_SHEETS.RELEASES)[0];
    expect(result).toMatchObject({ status: 'PARTIAL', recipientConfirmed: true });
    expect(replay).toMatchObject({ idempotentReplay: true, releaseId: result.releaseId });
    expect(release).toMatchObject({
      Recipient_Name: 'Synthetic Recipient',
      Recipient_Role: 'Committee representative',
      Department: 'Synthetic Department',
      Released_By: 'SYN-RELEASER',
      Status: 'PARTIAL',
    });
    expect(release.Confirmation_Label).toMatch(/Recipient confirmed/);
    expect(context.__table(context.HAU_SHEETS.LEDGER)).toHaveLength(1);
    expect(context.__table(context.HAU_SHEETS.REQUEST_LINES)[0]).toMatchObject({
      Released_Qty: 4,
      Status: 'PARTIALLY_RELEASED',
    });
    expect(context.__table(context.HAU_SHEETS.RESERVATIONS)[0].Quantity).toBe(6);
    expect(context.__history.length).toBeGreaterThan(0);
    expect(context.__audit).toHaveLength(1);
  });
});
