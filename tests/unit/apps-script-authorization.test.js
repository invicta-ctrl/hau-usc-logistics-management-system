import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';

const appScriptRoot = resolve(import.meta.dirname, '../../apps-script');

function gasContext({ users = [], memberships = [], version = 2 } = {}) {
  const properties = new Map([['HAU_AUTHORIZATION_CONTRACT_VERSION', String(version)]]);
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
    Utilities: { getUuid: () => 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee' },
    PropertiesService: { getScriptProperties: () => ({ getProperty: (key) => properties.get(key) ?? null }) },
  });

  for (const file of ['Config.gs', 'Validation.gs', 'Authorization.gs']) {
    vm.runInContext(readFileSync(resolve(appScriptRoot, file), 'utf8'), context, { filename: file });
  }

  context.readObjects_ = (sheetName) => {
    if (sheetName === context.HAU_SHEETS.USERS) return users;
    if (sheetName === context.HAU_SHEETS.USER_COMMITTEE_SCOPE) return memberships;
    return [];
  };
  return context;
}

const member = (userId, committeeId, active = true) => ({
  User_ID: userId,
  Committee_ID: committeeId,
  Active: active,
});

describe('Apps Script canonical authorization contract', () => {
  it('exposes exactly three committees and rejects unknown legacy labels', () => {
    const context = gasContext();
    expect(context.HAU_COMMITTEE_REGISTRY_).toHaveLength(3);
    expect(context.canonicalCommitteeId_('Inventory and Pantry Committee')).toBe('COM_INVENTORY_PANTRY');
    expect(context.canonicalCommitteeId_('Fourth Venue Committee')).toBe('');
    expect(context.canonicalRoleId_('DOL Director')).toBe('DIRECTOR');
  });

  it('enforces committee scope, Director oversight, inactive access, and capability separation', () => {
    const context = gasContext();
    const head = { User_ID: 'SYNTHETIC-HEAD', Role: 'COMMITTEE_HEAD', Committee: 'Food Committee', Active: true };
    const director = { User_ID: 'SYNTHETIC-DIRECTOR', Role: 'DOL_DIRECTOR', Active: true };
    const admin = { User_ID: 'SYNTHETIC-ADMIN', Role: 'ADMIN', Active: true };

    expect(context.authorizationCan_(head, context.HAU_CAPABILITIES_.REQUEST_REVIEW, { committeeId: 'COM_FOOD' })).toBe(true);
    expect(context.authorizationCan_(head, context.HAU_CAPABILITIES_.REQUEST_REVIEW, { committeeId: 'COM_MATERIALS' })).toBe(false);
    expect(context.authorizationCan_(head, context.HAU_CAPABILITIES_.FULFILL_RELEASE, { committeeId: 'COM_FOOD' })).toBe(false);
    expect(context.authorizationCan_(director, context.HAU_CAPABILITIES_.VIEW_AUDIT, { committeeId: 'COM_MATERIALS' })).toBe(true);
    expect(context.authorizationCan_(admin, context.HAU_CAPABILITIES_.REFERENCE_CATALOG_MANAGE)).toBe(true);
    expect(context.authorizationCan_(admin, context.HAU_CAPABILITIES_.FULFILL_RELEASE)).toBe(false);
    expect(context.authorizationDecision_({ User_ID: 'SYNTHETIC-INACTIVE', Role: 'DOL_STAFF', Committee: 'Food', Active: false }, context.HAU_CAPABILITIES_.REQUEST_REVIEW, { committeeId: 'COM_FOOD' }).reason).toBe('INACTIVE_USER');
    expect(context.authorizationDecision_({ User_ID: 'SYNTHETIC-UNKNOWN', Role: 'UNKNOWN_ROLE', Active: true }, context.HAU_CAPABILITIES_.VIEW_REQUEST, {}).reason).toBe('UNKNOWN_ROLE');
  });

  it('requires explicit mapping reconciliation and returns safe denial details', () => {
    const context = gasContext();
    const user = { User_ID: 'SYNTHETIC-HEAD', Role: 'COMMITTEE_HEAD', Committee: 'Unrecognized Committee', Active: true };
    const decision = context.authorizationDecision_(user, context.HAU_CAPABILITIES_.REQUEST_REVIEW, { committeeId: 'COM_FOOD' });
    expect(decision.reason).toBe('MAPPING_RECONCILIATION_REQUIRED');
    expect(() => context.authorizationRequire_(user, context.HAU_CAPABILITIES_.REQUEST_REVIEW, { committeeId: 'COM_FOOD' })).toThrow(expect.objectContaining({
      code: 'AUTHORIZATION_DENIED',
      details: { reason: 'MAPPING_RECONCILIATION_REQUIRED' },
    }));
    expect(context.authorizationMessage_('OUT_OF_SCOPE')).toMatch(/outside.*committee scope/i);
  });

  it('fails closed when the login identity has multiple active access rows', () => {
    const context = gasContext({ users: [
      { User_ID: 'SYNTHETIC-A', Email: 'same@example.invalid', Role: 'DOL_STAFF', Active: true },
      { User_ID: 'SYNTHETIC-B', Email: 'same@example.invalid', Role: 'DOL_STAFF', Active: true },
    ] });
    vm.runInContext(readFileSync(resolve(appScriptRoot, 'Auth.gs'), 'utf8'), context, { filename: 'Auth.gs' });
    context.Session = { getActiveUser: () => ({ getEmail: () => 'same@example.invalid' }) };
    expect(() => context.resolveCurrentUser_()).toThrow(expect.objectContaining({ code: 'AMBIGUOUS_IDENTITY' }));
  });

  it('keeps audit visibility separate from operational review capability', () => {
    const context = gasContext({ users: [
      { User_ID: 'SYNTHETIC-AUDITOR', Email: 'auditor@example.invalid', Role: 'READ_ONLY_AUDITOR', Active: true },
    ] });
    vm.runInContext(readFileSync(resolve(appScriptRoot, 'Auth.gs'), 'utf8'), context, { filename: 'Auth.gs' });
    vm.runInContext(readFileSync(resolve(appScriptRoot, 'AuditService.gs'), 'utf8'), context, { filename: 'AuditService.gs' });
    context.Session = { getActiveUser: () => ({ getEmail: () => 'auditor@example.invalid' }) };
    context.findAll_ = () => [];
    context.logError_ = () => {};

    expect(context.api_getAuditTimeline({ entityType: 'REQUEST', entityId: 'SYNTHETIC-ENTITY' })).toMatchObject({ ok: true, timeline: [] });
  });

  it('gates the legacy bootstrap endpoint and central authorization on the v2 rollout flag', () => {
    const legacy = gasContext({ version: 1 });
    legacy.getBootstrapData_ = () => ({ legacy: true });
    vm.runInContext(readFileSync(resolve(appScriptRoot, 'Router.gs'), 'utf8'), legacy, { filename: 'Router.gs' });
    expect(legacy.authorizeOperation_('getAuditTimeline', {})).toBeNull();
    expect(legacy.api_getBootstrapData({ requestOnly: false })).toMatchObject({ ok: true, legacy: true });

    const canonical = gasContext({ version: 2 });
    canonical.getBootstrapData_ = () => ({ legacy: true });
    vm.runInContext(readFileSync(resolve(appScriptRoot, 'Router.gs'), 'utf8'), canonical, { filename: 'Router.gs' });
    expect(canonical.api_getBootstrapData({ requestOnly: false })).toMatchObject({ ok: false, code: 'LEGACY_BOOTSTRAP_DISABLED' });
  });

  it('resolves committee scope through linked request, delivery, canvass, and event-item records', () => {
    const context = gasContext();
    const records = [
      [context.HAU_SHEETS.EVENTS, { Event_ID: 'SYNTHETIC-EVENT', Owner_Committee: 'Food Committee' }],
      [context.HAU_SHEETS.REQUESTS, { Request_ID: 'SYNTHETIC-REQUEST', Assigned_Committee: 'Food Committee', Event_ID: 'SYNTHETIC-EVENT' }],
      [context.HAU_SHEETS.REQUEST_LINES, { Request_Line_ID: 'SYNTHETIC-LINE', Request_ID: 'SYNTHETIC-REQUEST', Event_ID: 'SYNTHETIC-EVENT', Event_Item_ID: 'SYNTHETIC-EVENT-ITEM' }],
      [context.HAU_SHEETS.DELIVERABLES, { Deliverable_ID: 'SYNTHETIC-DELIVERABLE', Assigned_Committee: 'Materials Committee', Request_Line_ID: 'SYNTHETIC-LINE', Event_Item_ID: 'SYNTHETIC-EVENT-ITEM' }],
      [context.HAU_SHEETS.CANVASS, { Canvass_ID: 'SYNTHETIC-CANVASS', Linked_Deliverable_ID: 'SYNTHETIC-DELIVERABLE' }],
    ];
    context.findOne_ = (sheet, key, value) => records.find(([name, row]) => name === sheet && String(row[key]) === String(value))?.[1] || null;
    context.findAll_ = (sheet, predicate) => records.filter(([name]) => name === sheet).map(([, row]) => row).filter(predicate);

    expect(context.authorizationResourceFromCommand_('confirmRelease', { lines: [{ requestLineId: 'SYNTHETIC-LINE' }] }).committeeIds).toEqual(['COM_FOOD']);
    expect(context.authorizationResourceFromCommand_('selectPreferredCanvass', { canvassId: 'SYNTHETIC-CANVASS' }).committeeIds).toEqual(['COM_MATERIALS', 'COM_FOOD']);
    expect(context.authorizationResourceFromCommand_('transferEventItemToInventory', { eventItemId: 'SYNTHETIC-EVENT-ITEM' }).committeeIds).toEqual(['COM_FOOD', 'COM_MATERIALS']);
  });

  it('blocks activation for every unresolved active mapping issue', () => {
    const context = gasContext({ users: [
      { _row: 2, User_ID: 'SYNTHETIC-ADMIN', Role: 'ADMIN', Active: true, Authorization_Overrides_JSON: JSON.stringify({ grant: ['capability.not.real'] }) },
      { _row: 3, User_ID: 'SYNTHETIC-STAFF', Role: 'DOL_STAFF', Committee: 'Food Committee', Active: true, Committee_IDs_JSON: '{malformed' },
    ] });
    const report = context.authorizationMappingDryRun_();

    expect(report.activationReady).toBe(false);
    expect(report.unresolvedIssueCount).toBeGreaterThanOrEqual(2);
    expect(report.issueRows.every((row) => !JSON.stringify(row).match(/SYNTHETIC|email|committee\.not/))).toBe(true);
  });

  it('treats blank and invalid active values as unresolved instead of active access', () => {
    const context = gasContext();
    const decision = context.authorizationDecision_({ User_ID: 'SYNTHETIC-INVALID-ACTIVE', Role: 'ADMIN', Active: 'MAYBE' }, context.HAU_CAPABILITIES_.VIEW_AUDIT, {});
    expect(decision.reason).toBe('MAPPING_RECONCILIATION_REQUIRED');
    expect(context.authorizationContext_({ User_ID: 'SYNTHETIC-BLANK-ACTIVE', Role: 'ADMIN', Active: '' }).mappingStatus).toBe('NEEDS_REVIEW');
  });

  it('applies a clean mapping only inside the lock with idempotency and audit hooks', () => {
    const users = [{ _row: 2, User_ID: 'SYNTHETIC-ADMIN', Role: 'ADMIN', Active: true }];
    const context = gasContext({ users });
    let lockCount = 0;
    let auditCount = 0;
    let idempotencyCount = 0;
    context.withScriptLock_ = (fn) => { lockCount += 1; return fn(); };
    context.requireIdempotency_ = (command) => command.clientRequestId;
    context.idempotencyReplay_ = () => null;
    context.getConfigValue_ = () => 'TRUE';
    context.updateObject_ = () => {};
    context.setConfigValue_ = () => {};
    context.audit_ = () => { auditCount += 1; };
    context.recordIdempotency_ = (_key, result) => { idempotencyCount += 1; return result; };
    context.resolveCurrentUser_ = () => users[0];

    const result = context.applyAuthorizationMapping_({ clientRequestId: 'SYNTHETIC-MAPPING-1' }, 'COR-SYNTHETIC');
    expect(result).toMatchObject({ mode: 'APPLIED', appliedCount: 1 });
    expect(lockCount).toBe(1);
    expect(auditCount).toBe(1);
    expect(idempotencyCount).toBe(1);
  });

  it('reports dry-run mapping issues without changing records or exposing values', () => {
    const users = [
      { _row: 2, User_ID: 'SYNTHETIC-STAFF', Role: 'DOL_STAFF', Committee: '', Active: true },
      { _row: 3, User_ID: 'SYNTHETIC-HEAD', Role: 'COMMITTEE_HEAD', Committee: '', Active: true },
      { _row: 4, User_ID: 'SYNTHETIC-UNKNOWN', Role: 'UNKNOWN_ROLE', Committee: '', Active: true },
      { _row: 5, User_ID: 'SYNTHETIC-INACTIVE', Role: 'DOL_STAFF', Committee: '', Active: false },
    ];
    const context = gasContext({
      users,
      memberships: [
        member('SYNTHETIC-STAFF', 'COM_FOOD'),
        member('SYNTHETIC-HEAD', 'COM_FOOD', false),
      ],
    });
    const report = context.authorizationMappingDryRun_();

    expect(report).toMatchObject({
      mode: 'DRY_RUN',
      totalUsers: 4,
      unknownRoleCount: 1,
      missingCommitteeScopeCount: 2,
      activationReady: false,
      destructiveChanges: 0,
      immutableHistoryChanged: 0,
      legacyLabelsPreserved: true,
    });
    expect(report.issueRows).toHaveLength(3);
    expect(JSON.stringify(report)).not.toMatch(/email|spreadsheet|drive|roster|SYNTHETIC-STAFF/);
  });
});
