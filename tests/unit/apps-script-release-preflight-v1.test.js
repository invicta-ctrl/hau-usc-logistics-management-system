import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';

const appsScriptRoot = resolve(import.meta.dirname, '../../apps-script');

function appError(code, message = code, details = {}) {
  const error = new Error(message);
  error.code = code;
  error.details = details;
  return error;
}

function releaseHarness({ lines, stock = {}, eventStock = {}, reservations = {} }) {
  const context = vm.createContext({
    console,
    Date,
    JSON,
    Math,
    Object,
    Error,
    isFinite,
  });
  for (const file of ['Validation.gs', 'ReleaseService.gs']) {
    vm.runInContext(readFileSync(resolve(appsScriptRoot, file), 'utf8'), context, {
      filename: file,
    });
  }

  const writes = {
    ledger: [],
    reservations: [],
    requestLines: [],
    releases: [],
    history: [],
    evidence: [],
  };
  const byId = new Map(lines.map((line) => [line.Request_Line_ID, { ...line }]));
  const user = { User_ID: 'USR-RELEASER', Email: 'releaser@example.edu' };

  context.HAU_SHEETS = {
    REQUEST_LINES: 'REQUEST_LINES',
    REQUESTS: 'REQUESTS',
    RESERVATIONS: 'RESERVATIONS',
    RELEASES: 'RELEASES',
  };
  context.withScriptLock_ = (operation) => operation();
  context.requirePermission_ = () => user;
  context.idempotencyReplay_ = () => null;
  context.allocateId_ = (prefix) => `${prefix}-2026-0001`;
  context.nowIso_ = () => '2026-07-13T08:00:00.000Z';
  context.findOne_ = (sheet, field, value) => {
    if (sheet === 'REQUEST_LINES' && field === 'Request_Line_ID') return byId.get(value) ?? null;
    if (sheet === 'REQUESTS' && field === 'Request_ID') {
      return { Request_ID: value, Status: 'ACCEPTED', _row: 40 };
    }
    return null;
  };
  context.findAll_ = (sheet, predicate) => {
    if (sheet !== 'RESERVATIONS') return [];
    return lines.flatMap((line, index) => {
      const quantity = reservations[line.Request_Line_ID] ?? 100;
      const row = {
        Reservation_ID: `RSV-${index + 1}`,
        Item_ID: line.Item_ID,
        Request_Line_ID: line.Request_Line_ID,
        Quantity: quantity,
        Status: 'ACTIVE',
        _row: index + 2,
      };
      return predicate(row) ? [row] : [];
    });
  };
  context.itemById_ = (itemId) => ({ Item_ID: itemId, Status: 'ACTIVE', Unit: 'piece' });
  context.assertTransactableItem_ = () => true;
  context.onHand_ = (itemId) => stock[itemId] ?? 100;
  context.eventOnHand_ = (eventItemId) => eventStock[eventItemId] ?? 100;
  context.consumeReservations_ = (itemId, quantity, links) => {
    const reserved = reservations[links.requestLineId] ?? 100;
    if (reserved < quantity) {
      throw appError('RESERVATION_CONFLICT', 'Reservation is insufficient.', {
        reserved,
        requested: quantity,
      });
    }
    writes.reservations.push({ itemId, quantity, ...links });
  };
  context.appendLedger_ = (entry) => {
    writes.ledger.push(entry);
    return { Transaction_ID: `TXN-${writes.ledger.length}` };
  };
  context.updateObject_ = (sheet, row, patch) => {
    if (sheet === 'REQUEST_LINES') writes.requestLines.push({ row, patch });
  };
  context.history_ = (...args) => writes.history.push(args);
  context.deriveParentRequestStatus_ = () => 'PARTIALLY_FULFILLED';
  context.audit_ = () => undefined;
  context.recordIdempotency_ = (_key, result) => result;
  context.appendObject_ = (sheet, row) => {
    if (sheet === 'RELEASES') writes.releases.push(row);
    return row;
  };
  context.authorizeEvidenceUpload_ = () => user;
  context.validateEvidencePayload_ = (payload) => {
    if (payload.originalFileName === 'bad.exe') {
      throw appError('UNSUPPORTED_FILE_TYPE', 'Unsupported evidence file.');
    }
    return {
      type: payload.evidenceType,
      mime: payload.mimeType,
      relatedEntityType: payload.relatedEntityType,
    };
  };
  context.decodeEvidenceBytes_ = () => [0xff, 0xd8, 0xff, 0xe0];
  context.validateUploadedBytes_ = () => true;
  context.folderForEvidence_ = () => ({ getId: () => 'private-folder' });
  context.uploadEvidence_ = (payload) => {
    if (payload.originalFileName === 'bad.exe') {
      throw appError('UNSUPPORTED_FILE_TYPE', 'Unsupported evidence file.');
    }
    writes.evidence.push(payload);
    return { evidenceId: 'EVD-1' };
  };

  return { context, writes };
}

function stockLine(id, overrides = {}) {
  return {
    Request_Line_ID: id,
    Request_ID: 'REQ-1',
    Event_ID: 'EVT-1',
    Item_ID: 'ITM-1',
    Event_Item_ID: '',
    Requested_Qty: 10,
    Released_Qty: 0,
    Unit: 'piece',
    Status: 'READY_TO_RELEASE',
    _row: Number(id.replace(/\D/g, '')) + 1,
    ...overrides,
  };
}

function operationalWriteCount(writes) {
  return (
    writes.ledger.length +
    writes.reservations.length +
    writes.requestLines.length +
    writes.releases.length +
    writes.history.length +
    writes.evidence.length
  );
}

function baseCommand(lines) {
  return {
    requestId: 'REQ-1',
    recipientName: 'Demo Recipient',
    recipientRole: 'Project Head',
    department: 'Demo Office',
    clientRequestId: 'release-command-1',
    lines,
  };
}

describe('Apps Script multi-line release preflight', () => {
  it('rejects an invalid later line before any operational write', () => {
    const first = stockLine('RL-1');
    const later = stockLine('RL-2', { Status: 'FOR_REVIEW' });
    const { context, writes } = releaseHarness({ lines: [first, later] });

    expect(() =>
      context.confirmRelease_(
        baseCommand([
          { requestLineId: first.Request_Line_ID, quantity: 2, partialReason: 'Staged handoff' },
          { requestLineId: later.Request_Line_ID, quantity: 2, partialReason: 'Staged handoff' },
        ]),
        'COR-1',
      ),
    ).toThrow(expect.objectContaining({ code: 'INVALID_TRANSITION' }));
    expect(operationalWriteCount(writes)).toBe(0);
  });

  it('rejects duplicate and cross-request line selections before writing', () => {
    const first = stockLine('RL-1');
    const otherRequest = stockLine('RL-2', { Request_ID: 'REQ-2' });

    const duplicate = releaseHarness({ lines: [first] });
    expect(() =>
      duplicate.context.confirmRelease_(
        baseCommand([
          { requestLineId: 'RL-1', quantity: 2, partialReason: 'Staged handoff' },
          { requestLineId: 'RL-1', quantity: 2, partialReason: 'Staged handoff' },
        ]),
        'COR-1',
      ),
    ).toThrow(expect.objectContaining({ code: 'DUPLICATE_RELEASE_LINE' }));
    expect(operationalWriteCount(duplicate.writes)).toBe(0);

    const crossed = releaseHarness({ lines: [first, otherRequest] });
    expect(() =>
      crossed.context.confirmRelease_(
        baseCommand([
          { requestLineId: 'RL-1', quantity: 2, partialReason: 'Staged handoff' },
          { requestLineId: 'RL-2', quantity: 2, partialReason: 'Staged handoff' },
        ]),
        'COR-1',
      ),
    ).toThrow(expect.objectContaining({ code: 'CROSS_REQUEST_RELEASE' }));
    expect(operationalWriteCount(crossed.writes)).toBe(0);

    const blankEvent = stockLine('RL-3', { Event_ID: '' });
    const boundEvent = stockLine('RL-4', { Event_ID: 'EVT-1' });
    const crossedEvent = releaseHarness({ lines: [blankEvent, boundEvent] });
    const eventCommand = baseCommand([
      { requestLineId: 'RL-3', quantity: 2, partialReason: 'Staged handoff' },
      { requestLineId: 'RL-4', quantity: 2, partialReason: 'Staged handoff' },
    ]);
    delete eventCommand.eventId;
    expect(() => crossedEvent.context.confirmRelease_(eventCommand, 'COR-1')).toThrow(
      expect.objectContaining({ code: 'CROSS_EVENT_RELEASE' }),
    );
    expect(operationalWriteCount(crossedEvent.writes)).toBe(0);
  });

  it('checks aggregate item, event-item, and reservation sufficiency before writing', () => {
    const itemLines = [stockLine('RL-1'), stockLine('RL-2')];
    const itemHarness = releaseHarness({ lines: itemLines, stock: { 'ITM-1': 5 } });
    expect(() =>
      itemHarness.context.confirmRelease_(
        baseCommand([
          { requestLineId: 'RL-1', quantity: 3, partialReason: 'Staged handoff' },
          { requestLineId: 'RL-2', quantity: 3, partialReason: 'Staged handoff' },
        ]),
        'COR-1',
      ),
    ).toThrow(expect.objectContaining({ code: 'INSUFFICIENT_STOCK' }));
    expect(operationalWriteCount(itemHarness.writes)).toBe(0);

    const eventLines = [
      stockLine('RL-3', { Item_ID: '', Event_Item_ID: 'EIT-1' }),
      stockLine('RL-4', { Item_ID: '', Event_Item_ID: 'EIT-1' }),
    ];
    const eventHarness = releaseHarness({ lines: eventLines, eventStock: { 'EIT-1': 5 } });
    expect(() =>
      eventHarness.context.confirmRelease_(
        baseCommand([
          { requestLineId: 'RL-3', quantity: 3, partialReason: 'Staged handoff' },
          { requestLineId: 'RL-4', quantity: 3, partialReason: 'Staged handoff' },
        ]),
        'COR-1',
      ),
    ).toThrow(expect.objectContaining({ code: 'INSUFFICIENT_EVENT_BALANCE' }));
    expect(operationalWriteCount(eventHarness.writes)).toBe(0);

    const reservationHarness = releaseHarness({
      lines: itemLines,
      reservations: { 'RL-1': 3, 'RL-2': 1 },
    });
    expect(() =>
      reservationHarness.context.confirmRelease_(
        baseCommand([
          { requestLineId: 'RL-1', quantity: 3, partialReason: 'Staged handoff' },
          { requestLineId: 'RL-2', quantity: 2, partialReason: 'Staged handoff' },
        ]),
        'COR-1',
      ),
    ).toThrow(expect.objectContaining({ code: 'RESERVATION_CONFLICT' }));
    expect(operationalWriteCount(reservationHarness.writes)).toBe(0);
  });

  it('validates recipient and evidence before mutating release state', () => {
    const line = stockLine('RL-1');
    const missingRecipient = releaseHarness({ lines: [line] });
    expect(() =>
      missingRecipient.context.confirmRelease_(
        { ...baseCommand([{ requestLineId: 'RL-1', quantity: 10 }]), recipientName: '' },
        'COR-1',
      ),
    ).toThrow(expect.objectContaining({ code: 'VALIDATION_ERROR' }));
    expect(operationalWriteCount(missingRecipient.writes)).toBe(0);

    const invalidEvidence = releaseHarness({ lines: [line] });
    expect(() =>
      invalidEvidence.context.confirmRelease_(
        {
          ...baseCommand([{ requestLineId: 'RL-1', quantity: 10 }]),
          evidence: { originalFileName: 'bad.exe', mimeType: 'application/octet-stream' },
        },
        'COR-1',
      ),
    ).toThrow(expect.objectContaining({ code: 'UNSUPPORTED_FILE_TYPE' }));
    expect(operationalWriteCount(invalidEvidence.writes)).toBe(0);
  });

  it('marks unexpected post-preflight failures for explicit recovery review', () => {
    const line = stockLine('RL-1');
    const { context, writes } = releaseHarness({ lines: [line] });
    context.appendLedger_ = () => {
      throw appError('SHEET_WRITE_FAILED', 'Simulated ledger failure.');
    };

    expect(() =>
      context.confirmRelease_(
        baseCommand([{ requestLineId: 'RL-1', quantity: 10 }]),
        'COR-1',
      ),
    ).toThrow(
      expect.objectContaining({
        code: 'RELEASE_RECOVERY_REQUIRED',
        details: expect.objectContaining({
          recoveryStatus: 'REVIEW_REQUIRED',
          attemptedLineIds: ['RL-1'],
          completedLineIds: [],
        }),
      }),
    );
    expect(writes.reservations).toHaveLength(1);
    expect(writes.releases).toHaveLength(0);
  });
});
