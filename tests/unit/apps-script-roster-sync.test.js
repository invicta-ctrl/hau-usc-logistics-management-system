import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';

const appScriptRoot = resolve(import.meta.dirname, '../../apps-script');
const sourceHeaders = ['Institutional_Email', 'Display_Name', 'Active', 'Role_ID', 'Committee_IDs'];

function gasContext({ properties = {}, users = [], runs = [], memberships = [] } = {}) {
  const propertyMap = new Map(Object.entries({
    HAU_ENVIRONMENT: 'STAGING',
    HAU_SPREADSHEET_ID: 'SYNTHETIC-SPREADSHEET-ID-0001',
    HAU_BACKUP_SPREADSHEET_ID: 'SYNTHETIC-BACKUP-ID-0001',
    HAU_PRIVATE_ROSTER_SOURCE_ID: 'SYNTHETIC-PRIVATE-SOURCE-0001',
    HAU_ROSTER_SYNC_APPROVED: 'TRUE',
    HAU_ROSTER_FRESHNESS_MINUTES: '60',
    ...properties,
  }));
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
    Utilities: { formatDate: () => '2026-07-14T08:00:00Z', getUuid: () => 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' },
    PropertiesService: { getScriptProperties: () => ({
      getProperty: (key) => propertyMap.get(key) ?? null,
      setProperty: (key, value) => propertyMap.set(key, String(value)),
    }) },
  });
  for (const file of ['Config.gs', 'Validation.gs', 'Authorization.gs', 'Auth.gs', 'RosterSyncService.gs']) {
    vm.runInContext(readFileSync(resolve(appScriptRoot, file), 'utf8'), context, { filename: file });
  }
  context.readObjects_ = (sheetName) => {
    if (sheetName === context.HAU_SHEETS.USERS) return users;
    if (sheetName === context.HAU_SHEETS.ACCESS_SYNC_RUNS) return runs;
    if (sheetName === context.HAU_SHEETS.USER_COMMITTEE_SCOPE) return memberships;
    return [];
  };
  context.setProperty_ = (key, value) => propertyMap.set(key, String(value));
  return context;
}

const validRows = [
  ['operator.one@example.invalid', 'Synthetic Operator One', true, 'ADMINISTRATOR', '["COM_FOOD"]'],
  ['operator.two@example.invalid', 'Synthetic Operator Two', false, 'REQUESTER', '[]'],
];

describe('private roster source validation', () => {
  it('fails closed when the private source is missing, malformed, or reuses an operational target', () => {
    const context = gasContext({ properties: { HAU_PRIVATE_ROSTER_SOURCE_ID: '' } });
    expect(() => context.readRosterSource_()).toThrow(expect.objectContaining({ code: 'ROSTER_SOURCE_NOT_CONFIGURED' }));
    context.setProperty_('HAU_PRIVATE_ROSTER_SOURCE_ID', 'not-an-id');
    expect(() => context.readRosterSource_()).toThrow(expect.objectContaining({ code: 'ROSTER_SOURCE_CONFIGURATION_INVALID' }));
    context.setProperty_('HAU_PRIVATE_ROSTER_SOURCE_ID', 'SYNTHETIC-SPREADSHEET-ID-0001');
    expect(() => context.readRosterSource_()).toThrow(expect.objectContaining({ code: 'ROSTER_SOURCE_CONFIGURATION_INVALID' }));
  });

  it('requires the exact five-column source schema and rejects extra or fuzzy headers', () => {
    const context = gasContext();
    expect(context.validateRosterRows_({ headers: [...sourceHeaders, 'Alias'], rows: validRows }).issues).toEqual(['SOURCE_SCHEMA_INVALID']);
    expect(context.validateRosterRows_({ headers: ['Email', ...sourceHeaders.slice(1)], rows: validRows }).issues).toEqual(['SOURCE_SCHEMA_INVALID']);
  });

  it('accepts canonical synthetic rows and returns only an opaque revision', () => {
    const context = gasContext();
    const report = context.validateRosterRows_({ headers: sourceHeaders, rows: validRows });
    expect(report).toMatchObject({ valid: true, sourceRowCount: 2, activeRowCount: 1, inactiveRowCount: 1, duplicateIdentityCount: 0 });
    expect(report.rows).toEqual([
      { email: 'operator.one@example.invalid', displayName: 'Synthetic Operator One', active: true, roleId: 'ADMINISTRATOR', committeeIds: ['COM_FOOD'] },
      { email: 'operator.two@example.invalid', displayName: 'Synthetic Operator Two', active: false, roleId: 'REQUESTER', committeeIds: [] },
    ]);
    expect(report.sourceRevision).toMatch(/^REV-/);
  });

  it('fails closed for empty, duplicate, invalid-type, unknown-role, unknown-committee, and missing-scope rows', () => {
    const context = gasContext();
    const report = context.validateRosterRows_({
      headers: sourceHeaders,
      rows: [
        ['duplicate@example.invalid', 'Synthetic A', 'MAYBE', 'NOT_A_ROLE', '["NOT_A_COMMITTEE"]'],
        [' DUPLICATE@example.invalid ', 'Synthetic B', true, 'COMMITTEE_HEAD', '[]'],
      ],
    });
    expect(report.valid).toBe(false);
    expect(report.invalidTypeCount).toBeGreaterThan(0);
    expect(report.duplicateIdentityCount).toBe(1);
    expect(report.unknownRoleCount).toBe(1);
    expect(report.unknownCommitteeCount).toBe(1);
    expect(report.missingScopeCount).toBe(1);
    expect(report.issues).toEqual(expect.arrayContaining(['INVALID_ROW_TYPES', 'DUPLICATE_IDENTITY', 'UNKNOWN_ROLE', 'UNKNOWN_COMMITTEE', 'MISSING_COMMITTEE_SCOPE']));
    expect(context.validateRosterRows_({ headers: sourceHeaders, rows: [['', '', '', '', '']] }).issues).toEqual(['SOURCE_EMPTY']);
  });
});

describe('private roster sync safety boundaries', () => {
  it('does not read the private source during ordinary identity resolution', () => {
    const context = gasContext({ users: [{ User_ID: 'SYNTHETIC-MANUAL', Email: 'manual@example.invalid', Role: 'REQUESTER', Active: true }] });
    let sourceReads = 0;
    context.HAU_ROSTER_SOURCE_READER_ = () => { sourceReads += 1; return { headers: sourceHeaders, rows: validRows }; };
    context.Session = { getActiveUser: () => ({ getEmail: () => 'manual@example.invalid' }) };
    expect(context.resolveCurrentUser_()).toMatchObject({ User_ID: 'SYNTHETIC-MANUAL' });
    expect(sourceReads).toBe(0);
  });

  it('classifies inaccessible, timeout, and partial source reads without exposing source values', () => {
    const context = gasContext();
    context.HAU_ROSTER_SOURCE_READER_ = () => { const error = new Error('synthetic timeout'); error.code = 'TIMEOUT'; throw error; };
    context.appendObject_ = () => {};
    const timeout = context.performRosterSync_({ activate: false }, 'COR-SYNTHETIC', { User_ID: 'SYSTEM' }, false);
    expect(timeout).toMatchObject({ sourceReadStatus: 'FAILED', failureCode: 'SOURCE_TIMEOUT', activationStatus: 'FAILED' });
    expect(JSON.stringify(timeout)).not.toMatch(/synthetic timeout|example\.invalid/i);

    context.HAU_ROSTER_SOURCE_READER_ = () => { const error = new Error('synthetic partial'); error.code = 'PARTIAL_READ'; throw error; };
    const partial = context.performRosterSync_({ activate: false }, 'COR-SYNTHETIC', { User_ID: 'SYSTEM' }, false);
    expect(partial.failureCode).toBe('SOURCE_PARTIAL_READ');
  });

  it('keeps dry-run output metadata-only and requires an approval gate for activation', () => {
    const context = gasContext();
    context.HAU_ROSTER_SOURCE_READER_ = () => ({ headers: sourceHeaders, rows: validRows });
    context.appendObject_ = () => {};
    context.audit_ = () => {};
    const dryRun = context.performRosterSync_({ activate: false }, 'COR-SYNTHETIC', { User_ID: 'SYSTEM' }, false);
    expect(dryRun).toMatchObject({ activationStatus: 'NOT_ACTIVATED', validationStatus: 'VALID', sourceRowCount: 2 });
    expect(JSON.stringify(dryRun)).not.toMatch(/operator\.one|operator\.two|Synthetic Operator/);
    context.setProperty_('HAU_ROSTER_SYNC_APPROVED', 'FALSE');
    expect(() => context.performRosterSync_({ activate: true }, 'COR-SYNTHETIC', { User_ID: 'SYSTEM' }, false)).toThrow(expect.objectContaining({ code: 'ROSTER_SYNC_NOT_APPROVED' }));
  });

  it('detects manual-access conflicts and managed-row revocations before activation', () => {
    const context = gasContext({ users: [
      { _row: 2, User_ID: 'SYNTHETIC-MANUAL', Email: 'operator.one@example.invalid', Role: 'REQUESTER', Active: true, Roster_Managed: false },
      { _row: 3, User_ID: 'SYNTHETIC-MANAGED', Email: 'departed@example.invalid', Role: 'REQUESTER', Active: true, Access_Source: 'PRIVATE_ROSTER', Roster_Managed: true },
    ], memberships: [{ _row: 2, Membership_ID: 'SYNTHETIC-MEMBERSHIP', User_ID: 'SYNTHETIC-MANAGED', Committee_ID: 'COM_FOOD', Active: true, Source: 'MANUAL' }] });
    const validation = context.validateRosterRows_({ headers: sourceHeaders, rows: [['operator.one@example.invalid', 'Synthetic', true, 'REQUESTER', '[]']] });
    const plan = context.rosterLocalPlan_(validation.rows);
    expect(plan.manualConflictCount).toBe(1);
    expect(plan.manualMembershipConflictCount).toBe(1);
    expect(plan.revocationCount).toBe(1);
  });

  it('activates an access row and canonical membership through the snapshot boundary', () => {
    const context = gasContext();
    const users = [];
    const memberships = [];
    const snapshots = [];
    const membershipSnapshots = [];
    const sheetFor = (name) => ({
      getLastRow: () => (name === context.HAU_SHEETS.USERS ? users : memberships).length + 1,
      deleteRow: (rowNumber) => {
        const collection = name === context.HAU_SHEETS.USERS ? users : memberships;
        const index = collection.findIndex((row) => row._row === rowNumber);
        if (index >= 0) collection.splice(index, 1);
      },
    });
    context.getDatabase_ = () => ({ getSheetByName: sheetFor });
    context.appendObject_ = (name, row) => {
      const collection = name === context.HAU_SHEETS.USERS ? users : memberships;
      row._row = collection.length + 2;
      collection.push(row);
      return row;
    };
    context.appendObjects_ = (name, rows) => {
      if (name === context.HAU_SHEETS.ACCESS_SYNC_SNAPSHOT) snapshots.push(...rows);
      if (name === context.HAU_SHEETS.MEMBERSHIP_SYNC_SNAPSHOT) membershipSnapshots.push(...rows);
    };
    context.updateObject_ = (name, rowNumber, patch) => {
      const collection = name === context.HAU_SHEETS.USERS ? users : memberships;
      const row = collection.find((item) => item._row === rowNumber);
      if (row) Object.assign(row, patch);
    };
    let nextId = 0;
    context.allocateId_ = (prefix) => `${prefix}-SYNTHETIC-${++nextId}`;
    context.readObjects_ = (sheetName) => sheetName === context.HAU_SHEETS.USERS ? users : sheetName === context.HAU_SHEETS.USER_COMMITTEE_SCOPE ? memberships : [];
    const validation = context.validateRosterRows_({ headers: sourceHeaders, rows: [['new.operator@example.invalid', 'Synthetic New Operator', true, 'COMMITTEE_HEAD', '["COM_FOOD"]']] });
    const plan = context.rosterLocalPlan_(validation.rows);
    const result = context.rosterApply_(validation, plan, 'RSY-SYNTHETIC', '2026-07-14T08:00:00Z');
    expect(result).toMatchObject({ snapshots: 0, membershipSnapshots: 0, appended: 1, membershipAppended: 1 });
    expect(users[0]).toMatchObject({ Email: 'new.operator@example.invalid', Role_ID: 'COMMITTEE_HEAD', Roster_Managed: true, Active: true });
    expect(memberships[0]).toMatchObject({ User_ID: users[0].User_ID, Committee_ID: 'COM_FOOD', Source: 'PRIVATE_ROSTER', Active: true });
    expect(snapshots).toHaveLength(0);
    expect(membershipSnapshots).toHaveLength(0);
  });

  it('denies managed access when the last-known-good snapshot is stale or emergency-disabled', () => {
    const expired = [{ Sync_Run_ID: 'RSY-SYNTHETIC', Activation_Status: 'ACTIVATED', Completed_At: '2026-07-01T00:00:00.000Z', Freshness_Expires_At: '2026-07-01T01:00:00.000Z' }];
    const context = gasContext({ runs: expired });
    expect(context.rosterAccessDenied_({ Access_Source: 'PRIVATE_ROSTER', Roster_Managed: true, Active: true })).toBe(true);
    context.readObjects_ = (sheetName) => sheetName === context.HAU_SHEETS.ACCESS_SYNC_RUNS ? [{ Sync_Run_ID: 'RSY-SYNTHETIC', Activation_Status: 'ACTIVATED', Completed_At: '2026-07-14T00:00:00.000Z', Freshness_Expires_At: '2099-07-01T00:00:00.000Z' }] : [];
    context.setProperty_('HAU_ROSTER_EMERGENCY_DENY', 'TRUE');
    expect(context.rosterAccessDenied_({ Access_Source: 'PRIVATE_ROSTER', Roster_Managed: true, Active: true })).toBe(true);
    expect(context.rosterHealth_()).toMatchObject({ configured: true, emergencyDeny: true, status: 'EMERGENCY_DENY' });
  });

  it('treats malformed freshness timestamps as stale and denies managed access', () => {
    const context = gasContext({ runs: [{ Sync_Run_ID: 'RSY-SYNTHETIC', Activation_Status: 'ACTIVATED', Freshness_Expires_At: 'not-a-timestamp' }] });
    expect(context.rosterHealth_()).toMatchObject({ status: 'STALE', freshnessExpired: true });
    expect(context.rosterAccessDenied_({ Access_Source: 'PRIVATE_ROSTER', Roster_Managed: true, Active: true })).toBe(true);
  });

  it('serializes health and run metadata without a source identifier or source rows', () => {
    const context = gasContext({ runs: [{ Sync_Run_ID: 'RSY-SYNTHETIC', Activation_Status: 'ACTIVATED', Source_Revision: 'REV-SYNTHETIC', Completed_At: '2099-07-01T00:00:00.000Z', Freshness_Expires_At: '2099-07-02T00:00:00.000Z' }] });
    const output = JSON.stringify(context.rosterHealth_());
    expect(output).toContain('REV-SYNTHETIC');
    expect(output).not.toContain('SYNTHETIC-PRIVATE-SOURCE-0001');
    expect(output).not.toMatch(/operator\.one|Display_Name|Institutional_Email|Committee_IDs/);
  });

  it('serializes concurrent sync through the repository lock boundary', () => {
    const context = gasContext();
    let lockCount = 0;
    context.withScriptLock_ = (operation) => { lockCount += 1; return operation(); };
    context.HAU_ROSTER_SOURCE_READER_ = () => ({ headers: sourceHeaders, rows: validRows });
    context.appendObject_ = () => {};
    context.audit_ = () => {};
    context.runRosterSync_({ activate: false }, 'COR-SYNTHETIC', { actor: { User_ID: 'SYSTEM' }, scheduled: false });
    expect(lockCount).toBe(1);
  });
});
