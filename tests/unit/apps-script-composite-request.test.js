import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';

const appScriptRoot = resolve(import.meta.dirname, '../../apps-script');

function contextFor({ enabled = true, failAppend = false } = {}) {
  const properties = new Map([
    ['HAU_ENVIRONMENT', 'STAGING'],
    ['HAU_SPREADSHEET_ID', 'SYNTHETIC-SPREADSHEET-ID-12345678901234567890'],
    ['HAU_BACKUP_SPREADSHEET_ID', 'SYNTHETIC-BACKUP-ID-12345678901234567890'],
    ['HAU_COMPOSITE_REQUESTS_ENABLED', enabled ? 'true' : 'false'],
  ]);
  const database = [];
  let appendCalls = 0;
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
    Utilities: {
      getUuid: () => 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      formatDate: () => '2026-07-14T00:00:00+08:00',
    },
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: (key) => properties.get(key) ?? null,
        setProperty: (key, value) => properties.set(key, String(value)),
      }),
    },
  });
  for (const file of ['Config.gs', 'Validation.gs', 'IdService.gs', 'CompositeRequestService.gs'])
    vm.runInContext(readFileSync(resolve(appScriptRoot, file), 'utf8'), context, { filename: file });
  context.withScriptLock_ = (operation) => operation();
  context.resolveRequesterUser_ = () => ({
    User_ID: 'SYN-REQUESTER',
    Email: 'synthetic@example.invalid',
    Active: true,
  });
  context.findAll_ = (_sheet, predicate) => database.filter(predicate);
  context.appendObjects_ = (_sheet, objects) => {
    appendCalls += 1;
    if (failAppend) throw context.appError_('ATOMIC_WRITE_FAILED', 'Synthetic append failed.', true);
    database.push(...objects.map((row, index) => ({ ...row, _row: database.length + index + 2 })));
  };
  context.appendObject_ = (_sheet, object) => {
    database.push({ ...object, _row: database.length + 2 });
  };
  context.history_ = () => ({});
  context.audit_ = () => ({});
  context.recordIdempotency_ = (key, result) => ({ ...result, idempotencyKey: key });
  context.__database = database;
  context.__appendCalls = () => appendCalls;
  return context;
}

function requestCommand(key = 'SYN-COMPOSITE-1') {
  return {
    idempotencyKey: key,
    requesterName: 'Synthetic Requester',
    requesterEmail: 'synthetic@example.invalid',
    department: 'Synthetic Department',
    eventId: 'SYN-EVENT-1',
    purpose: 'Synthetic composite request',
    sections: [
      { type: 'FOOD', label: 'Food', lines: [{ label: 'Packed meal', quantity: 2, unit: 'meal' }] },
      {
        type: 'MATERIALS',
        label: 'Materials',
        lines: [{ label: 'Directional sign', quantity: 1, unit: 'piece' }],
      },
      {
        type: 'VENUE_EQUIPMENT',
        label: 'Venue',
        lines: [{ label: 'Folding table', quantity: 1, unit: 'piece' }],
      },
    ],
  };
}

describe('Apps Script composite request foundation', () => {
  it('writes one parent and one child per non-empty section in one append and replays exactly', () => {
    const context = contextFor();
    const first = context.submitCompositeRequest_(requestCommand(), 'COR-SYN-1');
    expect(first.requestId).toMatch(/^LREQ-/);
    expect(first.componentIds).toHaveLength(3);
    expect(context.__database).toHaveLength(4);
    expect(context.__appendCalls()).toBe(1);
    expect(context.__database.filter((row) => row.Record_Type === 'PARENT')).toHaveLength(1);
    expect(context.__database.filter((row) => row.Record_Type === 'COMPONENT')).toHaveLength(3);
    expect(
      context.__database.every((row) => !Object.prototype.hasOwnProperty.call(row, 'Parent_Request_ID')),
    ).toBe(true);
    const replay = context.submitCompositeRequest_(requestCommand(), 'COR-SYN-2');
    expect(replay.idempotentReplay).toBe(true);
    expect(replay.requestId).toBe(first.requestId);
    expect(context.__database).toHaveLength(4);
    expect(context.__appendCalls()).toBe(1);
  });

  it('keeps the feature disabled by default and leaves the table untouched on validation failure', () => {
    const disabled = contextFor({ enabled: false });
    expect(() => disabled.submitCompositeRequest_(requestCommand(), 'COR-SYN-DISABLED')).toThrowError(
      expect.objectContaining({ code: 'FEATURE_DISABLED' }),
    );
    expect(disabled.__database).toHaveLength(0);
    const invalid = contextFor();
    expect(() =>
      invalid.submitCompositeRequest_(
        { ...requestCommand('SYN-INVALID'), sections: [{ type: 'FOOD', lines: [] }] },
        'COR-SYN-INVALID',
      ),
    ).toThrowError(expect.objectContaining({ code: 'COMPOSITE_SECTIONS_REQUIRED' }));
    expect(invalid.__database).toHaveLength(0);
    expect(invalid.__appendCalls()).toBe(0);
  });

  it('does not claim success when the single composite append fails', () => {
    const context = contextFor({ failAppend: true });
    expect(() => context.submitCompositeRequest_(requestCommand(), 'COR-SYN-FAIL')).toThrowError(
      expect.objectContaining({ code: 'ATOMIC_WRITE_FAILED' }),
    );
    expect(context.__database).toHaveLength(0);
    expect(context.__appendCalls()).toBe(1);
  });
});
