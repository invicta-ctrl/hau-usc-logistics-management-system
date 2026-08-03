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
    RegExp,
    isFinite,
    isNaN,
  });
  for (const file of ['Config.gs', 'Validation.gs', 'CanvassService.gs']) {
    vm.runInContext(readFileSync(resolve(appScriptRoot, file), 'utf8'), context, { filename: file });
  }
  context.withScriptLock_ = (operation) => operation();
  context.requirePermission_ = () => ({ User_ID: 'SYN-CANVASS-STAFF', Email: 'staff@example.invalid' });
  context.booleanValue_ = (value, fallback) => {
    if (typeof value === 'boolean') return value;
    if (String(value).toUpperCase() === 'TRUE') return true;
    if (String(value).toUpperCase() === 'FALSE') return false;
    return fallback;
  };
  context.nowIso_ = () => '2026-08-03T10:00:00+08:00';
  let nextId = 0;
  context.allocateId_ = (prefix) => `SYN-${prefix}-${++nextId}`;
  context.readObjects_ = (sheet) => table(sheet);
  context.findOne_ = (sheet, key, value) =>
    table(sheet).find((row) => String(row[key]) === String(value)) || null;
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
  context.idempotencyReplay_ = (key) => idempotency.get(key) ?? null;
  context.recordIdempotency_ = (key, result) => {
    idempotency.set(key, result);
    return result;
  };
  context.history_ = (...args) => history.push(args);
  context.audit_ = (...args) => audit.push(args);
  context.uploadEvidence_ = () => ({ evidenceId: 'SYN-EVIDENCE' });
  return { context, table, history, audit };
}

function quoteCommand(overrides = {}) {
  return {
    supplierName: 'Synthetic Supplier A',
    linkedRequestLineId: 'SYN-LINE-1',
    itemSpec: 'Synthetic paper stock',
    price: 120,
    unit: 'ream',
    checkedAt: '2026-08-03',
    sourceUrl: 'https://supplier.example.invalid/quote/1',
    clientRequestId: 'SYN-CREATE-1',
    ...overrides,
  };
}

describe('Apps Script governed Canvass mutations', () => {
  it('rejects invalid dates, unsupported units, unsafe URLs, and active duplicates', () => {
    const { context } = contextFor();
    expect(() => context.saveCanvassReference_(quoteCommand({ checkedAt: '2026-02-30' }), 'COR-1')).toThrow(
      /real date/i,
    );
    expect(() =>
      context.saveCanvassReference_(
        quoteCommand({ checkedAt: '2026-02-30T00:00:00+08:00', clientRequestId: 'SYN-BAD-ISO-DATE' }),
        'COR-1B',
      ),
    ).toThrow(/real date/i);
    expect(() =>
      context.saveCanvassReference_(
        quoteCommand({ unit: 'unsupported', clientRequestId: 'SYN-BAD-UNIT' }),
        'COR-2',
      ),
    ).toThrow(/supported quantity unit/i);
    expect(() =>
      context.saveCanvassReference_(
        quoteCommand({ sourceUrl: 'javascript:alert(1)', clientRequestId: 'SYN-BAD-URL' }),
        'COR-3',
      ),
    ).toThrow(/safe http/i);

    context.saveCanvassReference_(quoteCommand(), 'COR-4');
    expect(() =>
      context.saveCanvassReference_(quoteCommand({ clientRequestId: 'SYN-DUPLICATE' }), 'COR-5'),
    ).toThrow(/matching canvass reference/i);
  });

  it('creates and updates with idempotency, optimistic concurrency, price history, and full evidence', () => {
    const { context, table, history, audit } = contextFor();
    const created = context.saveCanvassReference_(quoteCommand(), 'COR-CREATE');
    const replayed = context.saveCanvassReference_(quoteCommand(), 'COR-CREATE-REPLAY');
    expect(replayed).toMatchObject({ canvassId: created.canvassId, idempotentReplay: true });
    expect(table(context.HAU_SHEETS.CANVASS)).toHaveLength(1);

    const stored = table(context.HAU_SHEETS.CANVASS)[0];
    expect(() =>
      context.updateCanvassReference_(
        quoteCommand({
          canvassId: stored.Canvass_ID,
          expectedUpdatedAt: 'stale-token',
          price: 130,
          clientRequestId: 'SYN-UPDATE-STALE',
        }),
        'COR-STALE',
      ),
    ).toThrow(/refresh before updating/i);

    const updated = context.updateCanvassReference_(
      quoteCommand({
        canvassId: stored.Canvass_ID,
        expectedUpdatedAt: stored.Updated_At,
        price: 130,
        checkedAt: '2026-08-04',
        reason: 'Supplier refreshed the quote.',
        clientRequestId: 'SYN-UPDATE-1',
      }),
      'COR-UPDATE',
    );
    expect(updated).toMatchObject({ canvassId: stored.Canvass_ID, revision: 2 });
    expect(JSON.parse(stored.Price_History_JSON)).toHaveLength(2);
    expect(history).toHaveLength(2);
    expect(audit.map((entry) => entry[0])).toEqual(['SAVE_CANVASS', 'UPDATE_CANVASS']);
    expect(audit[1][5]).toMatchObject({ before: expect.any(Object), after: expect.any(Object) });
  });

  it('persists preferred rationale and blocks archival until another quote supersedes it', () => {
    const { context, table, history, audit } = contextFor();
    const first = context.saveCanvassReference_(quoteCommand(), 'COR-FIRST');
    const second = context.saveCanvassReference_(
      quoteCommand({
        supplierName: 'Synthetic Supplier B',
        price: 125,
        clientRequestId: 'SYN-CREATE-2',
      }),
      'COR-SECOND',
    );
    context.selectPreferredCanvass_(
      { canvassId: first.canvassId, rationale: 'Best compliant value.', clientRequestId: 'SYN-PREFERRED-1' },
      'COR-PREFERRED-1',
    );
    const firstRow = table(context.HAU_SHEETS.CANVASS).find((row) => row.Canvass_ID === first.canvassId);
    expect(firstRow).toMatchObject({ Preferred: true, Preferred_Rationale: 'Best compliant value.' });
    expect(() =>
      context.archiveCanvassReference_(
        { canvassId: first.canvassId, reason: 'Expired.', clientRequestId: 'SYN-ARCHIVE-BLOCKED' },
        'COR-ARCHIVE-BLOCKED',
      ),
    ).toThrow(/select another preferred/i);

    context.selectPreferredCanvass_(
      {
        canvassId: second.canvassId,
        rationale: 'Faster compliant delivery.',
        clientRequestId: 'SYN-PREFERRED-2',
      },
      'COR-PREFERRED-2',
    );
    expect(firstRow).toMatchObject({ Preferred: false, Preferred_Rationale: '' });
    expect(audit.map((entry) => entry[0])).toEqual(
      expect.arrayContaining(['SELECT_PREFERRED_CANVASS', 'DESELECT_PREFERRED_CANVASS']),
    );
    const archived = context.archiveCanvassReference_(
      { canvassId: first.canvassId, reason: 'Superseded and expired.', clientRequestId: 'SYN-ARCHIVE-1' },
      'COR-ARCHIVE',
    );
    expect(archived).toMatchObject({ canvassId: first.canvassId, status: 'ARCHIVED' });
    expect(firstRow).toMatchObject({ Status: 'ARCHIVED', Archive_Reason: 'Superseded and expired.' });
    expect(history.at(-1)[3]).toBe('ARCHIVED');
    expect(audit.at(-1)[0]).toBe('ARCHIVE_CANVASS');
  });
});
