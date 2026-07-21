import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';

const root = resolve(import.meta.dirname, '../../apps-script');

function contextFor({ actorId = 'SYN-ADMIN-1', enabled = true } = {}) {
  const properties = new Map([
    ['HAU_REFERENCE_ADMIN_WRITES_ENABLED', enabled ? 'true' : 'false'],
  ]);
  const tables = new Map();
  const idempotency = new Map();
  const audit = [];
  const history = [];
  const table = (name) => {
    if (!tables.has(name)) tables.set(name, []);
    return tables.get(name);
  };
  const context = vm.createContext({
    console, Object, JSON, Date, Math, Number, String, Boolean, Array, Error, isFinite, isNaN,
    Utilities: { getUuid: () => 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee', formatDate: () => '2026-07-16T12:00:00+08:00' },
    PropertiesService: { getScriptProperties: () => ({ getProperty: (key) => properties.get(key) ?? null }) },
    LockService: { getScriptLock: () => ({ tryLock: () => true, releaseLock: () => {} }) },
  });
  for (const file of ['Config.gs', 'Validation.gs', 'ReferenceAdministrationService.gs'])
    vm.runInContext(readFileSync(resolve(root, file), 'utf8'), context, { filename: file });
  let next = 0;
  context.allocateId_ = (prefix) => `SYN-${prefix}-${++next}`;
  context.nowIso_ = () => '2026-07-16T12:00:00+08:00';
  context.resolveCurrentUser_ = () => ({ User_ID: actorId, Role: 'ADMINISTRATOR', Role_ID: 'ADMINISTRATOR', Active: true });
  context.authorizationContractVersion_ = () => 2;
  context.HAU_CAPABILITIES_ = { REFERENCE_MANAGE: 'reference.manage', ACCESS_ADMIN: 'access.admin' };
  context.authorizationCan_ = () => true;
  context.canonicalRoleId_ = (value) => String(value || '').toUpperCase();
  context.compositeParse_ = (value, fallback) => {
    if (!value) return fallback;
    try { return typeof value === 'string' ? JSON.parse(value) : value; } catch { return fallback; }
  };
  context.readObjects_ = (sheet) => table(sheet);
  context.appendObject_ = (sheet, row) => {
    const stored = { ...row, _row: table(sheet).length + 2 };
    table(sheet).push(stored);
    return stored;
  };
  context.updateObject_ = (sheet, rowNumber, patch) => {
    const row = table(sheet).find((entry) => entry._row === rowNumber);
    if (!row) throw new Error(`Missing row ${rowNumber}`);
    Object.assign(row, patch);
    return row;
  };
  context.idempotencyReplay_ = (key) => idempotency.get(key) ?? null;
  context.recordIdempotency_ = (key, result) => { idempotency.set(key, result); return result; };
  context.audit_ = (...args) => audit.push(args);
  context.history_ = (...args) => history.push(args);
  table(context.HAU_SHEETS.VENUE_EQUIPMENT_REFERENCES).push({
    _row: 2, Reference_ID: 'SYN-VENUE-1', Reference_Type: 'VENUE', Category_ID: 'MEETING_SPACE',
    Display_Name: 'Synthetic Hall', Aliases_JSON: '["Hall"]', Unit: 'service', Requestability: 'REQUESTABLE',
    Route_ID: 'SYN-ROUTE-1', Revision: 2, Status: 'ACTIVE', Effective_From: '2026-01-01', Updated_At: '2026-07-15T00:00:00+08:00',
  });
  table(context.HAU_SHEETS.VENUE_EQUIPMENT_ROUTES).push({
    _row: 2, Route_ID: 'SYN-ROUTE-1', Match_Kind: 'REFERENCE', Reference_ID: 'SYN-VENUE-1',
    Owner_Committee_ID: 'COM_MATERIALS', Responsible_Office_ID: 'SYN-OFFICE', Approving_Authority_ID: 'SYN-AUTH',
    Lead_Time_Business_Days: 5, Instructions: 'Synthetic route', Revision: 1, Status: 'ACTIVE', Effective_From: '2026-01-01',
  });
  table(context.HAU_SHEETS.USERS).push({
    _row: 2, User_ID: 'SYN-USER-2', Display_Name: 'Synthetic Member', Role: 'REQUESTER', Role_ID: 'REQUESTER',
    Committee_IDs_JSON: '[]', Active: true, Authorization_Revision: 'AUTH-2', Admin_Revision: 1, Roster_Managed: true,
  });
  return { context, table, audit, history };
}

describe('Apps Script reference administration service', () => {
  it('returns bounded allowlisted admin projections without roster contact fields', () => {
    const { context } = contextFor();
    const result = context.getReferenceAdminWorkspace_({ domain: 'VENUES', query: 'hall' });
    expect(result).toMatchObject({ contractVersion: 1, writesEnabled: true, domain: 'VENUES' });
    expect(result.items).toEqual([expect.objectContaining({ id: 'SYN-VENUE-1', revision: 2 })]);
    expect(JSON.stringify(result)).not.toContain('Email');
  });

  it('applies a direct effective-dated reference revision with history and audit', () => {
    const { context, table, audit, history } = contextFor();
    const result = context.submitReferenceAdminChange_(
      { domain: 'VENUES', action: 'UPDATE', targetId: 'SYN-VENUE-1', expectedRevision: 2, patch: { displayName: 'Synthetic Assembly Hall', aliases: ['Assembly Hall'], category: 'MEETING_SPACE', unit: 'service', requestability: 'REQUESTABLE', routeId: 'SYN-ROUTE-1', effectiveFrom: '2026-07-16' }, idempotencyKey: 'SYN-DIRECT-1' },
      'COR-DIRECT',
    );
    expect(result).toMatchObject({ applied: true, reviewStatus: 'APPLIED' });
    expect(table(context.HAU_SHEETS.VENUE_EQUIPMENT_REFERENCES)[0]).toMatchObject({ Status: 'SUPERSEDED' });
    expect(table(context.HAU_SHEETS.VENUE_EQUIPMENT_REFERENCES).at(-1)).toMatchObject({ Reference_ID: 'SYN-VENUE-1', Revision: 3, Display_Name: 'Synthetic Assembly Hall', Status: 'ACTIVE' });
    expect(history).toHaveLength(1);
    expect(audit.some((entry) => entry[0] === 'REFERENCE_ADMIN_UPDATE')).toBe(true);
  });

  it('replays an idempotent direct mutation without appending another revision', () => {
    const { context, table } = contextFor();
    const command = { domain: 'VENUES', action: 'UPDATE', targetId: 'SYN-VENUE-1', expectedRevision: 2, patch: { displayName: 'Synthetic Assembly Hall' }, idempotencyKey: 'SYN-REPLAY-1' };
    context.submitReferenceAdminChange_(command, 'COR-1');
    const replay = context.submitReferenceAdminChange_(command, 'COR-2');
    expect(replay.idempotentReplay).toBe(true);
    expect(table(context.HAU_SHEETS.VENUE_EQUIPMENT_REFERENCES)).toHaveLength(2);
  });

  it('queues routing changes for a distinct reviewer and applies only after approval', () => {
    const fixture = contextFor();
    const { context, table } = fixture;
    const submitted = context.submitReferenceAdminChange_(
      { domain: 'ROUTING', action: 'UPDATE', targetId: 'SYN-ROUTE-1', expectedRevision: 1, patch: { ownerCommitteeId: 'COM_FOOD', responsibleOfficeId: 'SYN-OFFICE-2', approvingAuthorityId: 'SYN-AUTH-2', leadTimeBusinessDays: 7, instructions: 'Synthetic reviewed route' }, idempotencyKey: 'SYN-ROUTE-SUBMIT' },
      'COR-ROUTE',
    );
    expect(submitted).toMatchObject({ applied: false, reviewStatus: 'PENDING_REVIEW' });
    expect(table(context.HAU_SHEETS.VENUE_EQUIPMENT_ROUTES)).toHaveLength(1);
    context.resolveCurrentUser_ = () => ({ User_ID: 'SYN-ADMIN-2', Role_ID: 'ADMINISTRATOR' });
    const approved = context.reviewReferenceAdminChange_({ changeId: submitted.changeId, decision: 'APPROVE', reason: 'Synthetic second review', idempotencyKey: 'SYN-ROUTE-APPROVE' }, 'COR-APPROVE');
    expect(approved).toMatchObject({ applied: true, reviewStatus: 'APPROVED_APPLIED' });
    expect(table(context.HAU_SHEETS.VENUE_EQUIPMENT_ROUTES).at(-1)).toMatchObject({ Route_ID: 'SYN-ROUTE-1', Revision: 2, Owner_Committee_ID: 'COM_FOOD' });
  });

  it('denies same-actor approval and stale pending review', () => {
    const { context } = contextFor();
    const submitted = context.submitReferenceAdminChange_(
      { domain: 'ROUTING', action: 'UPDATE', targetId: 'SYN-ROUTE-1', expectedRevision: 1, patch: { responsibleOfficeId: 'SYN-OFFICE-2' }, idempotencyKey: 'SYN-SUBMIT' }, 'COR-SUBMIT',
    );
    expect(() => context.reviewReferenceAdminChange_({ changeId: submitted.changeId, decision: 'APPROVE', idempotencyKey: 'SYN-SAME' }, 'COR-SAME')).toThrowError(expect.objectContaining({ code: 'REFERENCE_ADMIN_SEPARATION_OF_DUTIES' }));
    context.resolveCurrentUser_ = () => ({ User_ID: 'SYN-ADMIN-2', Role_ID: 'ADMINISTRATOR' });
    context.readObjects_(context.HAU_SHEETS.VENUE_EQUIPMENT_ROUTES)[0].Revision = 2;
    expect(() => context.reviewReferenceAdminChange_({ changeId: submitted.changeId, decision: 'APPROVE', reason: 'Synthetic stale review', idempotencyKey: 'SYN-STALE' }, 'COR-STALE')).toThrowError(expect.objectContaining({ code: 'REFERENCE_ADMIN_REVISION_CONFLICT' }));
  });

  it('denies self-escalation and requires review for another user permission grant', () => {
    const { context } = contextFor({ actorId: 'SYN-USER-2' });
    expect(() => context.previewReferenceAdminChange_({ domain: 'PERMISSIONS', action: 'UPDATE', targetId: 'SYN-USER-2', expectedRevision: 1, patch: { roleId: 'ADMINISTRATOR', active: true, reason: 'Attempted synthetic self grant' } })).toThrowError(expect.objectContaining({ code: 'REFERENCE_ADMIN_SELF_ESCALATION_DENIED' }));
    context.resolveCurrentUser_ = () => ({ User_ID: 'SYN-ADMIN-1', Role_ID: 'ADMINISTRATOR' });
    expect(context.previewReferenceAdminChange_({ domain: 'PERMISSIONS', action: 'UPDATE', targetId: 'SYN-USER-2', expectedRevision: 1, patch: { roleId: 'COMMITTEE_HEAD', committeeIds: ['COM_FOOD'], reason: 'Synthetic approved scope' } })).toMatchObject({ requiresReview: true, risk: 'PERMISSION_ESCALATION' });
    expect(() => context.previewReferenceAdminChange_({ domain: 'PERMISSIONS', action: 'UPDATE', targetId: 'SYN-USER-2', expectedRevision: 1, patch: { active: false, emergencyRevocation: true, roleId: 'ADMINISTRATOR', reason: 'Dormant synthetic grant' } })).toThrowError(expect.objectContaining({ code: 'REFERENCE_ADMIN_VALIDATION_ERROR' }));
  });

  it('denies a reviewer permission escalation that targets the reviewer', () => {
    const { context } = contextFor();
    const submitted = context.submitReferenceAdminChange_(
      { domain: 'PERMISSIONS', action: 'UPDATE', targetId: 'SYN-USER-2', expectedRevision: 1, patch: { roleId: 'COMMITTEE_HEAD', committeeIds: ['COM_FOOD'], reason: 'Synthetic escalation request' }, idempotencyKey: 'SYN-SELF-REVIEW-SUBMIT' },
      'COR-SELF-REVIEW-SUBMIT',
    );
    context.resolveCurrentUser_ = () => ({ User_ID: 'SYN-USER-2', Role_ID: 'ADMINISTRATOR' });
    expect(() => context.reviewReferenceAdminChange_({ changeId: submitted.changeId, decision: 'APPROVE', reason: 'Synthetic self approval', idempotencyKey: 'SYN-SELF-REVIEW' }, 'COR-SELF-REVIEW')).toThrowError(expect.objectContaining({ code: 'REFERENCE_ADMIN_SELF_ESCALATION_DENIED' }));
  });

  it('preserves the current version and requires reconciliation when append fails', () => {
    const { context, table } = contextFor();
    const append = context.appendObject_;
    context.appendObject_ = (sheet, row) => {
      if (sheet === context.HAU_SHEETS.VENUE_EQUIPMENT_REFERENCES) throw new Error('Synthetic append failure');
      return append(sheet, row);
    };
    const command = { domain: 'VENUES', action: 'UPDATE', targetId: 'SYN-VENUE-1', expectedRevision: 2, patch: { displayName: 'Synthetic failed update' }, idempotencyKey: 'SYN-FAILED-APPEND' };
    expect(() => context.submitReferenceAdminChange_(command, 'COR-FAILED-APPEND')).toThrow('Synthetic append failure');
    expect(table(context.HAU_SHEETS.VENUE_EQUIPMENT_REFERENCES)[0]).toMatchObject({ Revision: 2, Status: 'ACTIVE' });
    expect(table(context.HAU_SHEETS.REFERENCE_ADMIN_CHANGES)[0]).toMatchObject({ Review_Status: 'APPLYING' });
    expect(() => context.submitReferenceAdminChange_(command, 'COR-FAILED-RETRY')).toThrowError(expect.objectContaining({ code: 'REFERENCE_ADMIN_RECONCILIATION_REQUIRED' }));
  });

  it('keeps roster-owned data and sync health read-only', () => {
    const { context } = contextFor();
    expect(() => context.previewReferenceAdminChange_({ domain: 'PEOPLE_MEMBERSHIPS', action: 'UPDATE', targetId: 'SYN-USER-2', expectedRevision: 1, patch: {} })).toThrowError(expect.objectContaining({ code: 'REFERENCE_ADMIN_ROSTER_OWNED' }));
    expect(() => context.previewReferenceAdminChange_({ domain: 'SYNC_HEALTH', action: 'ADD', targetId: 'SYN-SYNC-1', patch: {} })).toThrowError(expect.objectContaining({ code: 'REFERENCE_ADMIN_DOMAIN_READ_ONLY' }));
  });

  it('fails closed when writes are disabled', () => {
    const { context } = contextFor({ enabled: false });
    expect(() => context.submitReferenceAdminChange_({ domain: 'VENUES', action: 'UPDATE', targetId: 'SYN-VENUE-1', expectedRevision: 2, patch: { displayName: 'No' }, idempotencyKey: 'SYN-DISABLED' }, 'COR-DISABLED')).toThrowError(expect.objectContaining({ code: 'REFERENCE_ADMIN_WRITES_DISABLED' }));
  });

  it('retains server-side administrator enforcement under the legacy authorization contract', () => {
    const { context } = contextFor();
    context.authorizationContractVersion_ = () => 1;
    context.resolveCurrentUser_ = () => ({ User_ID: 'SYN-DIRECTOR', Role_ID: 'DOL_DIRECTOR' });
    expect(() => context.getReferenceAdminWorkspace_({ domain: 'VENUES' })).toThrowError(expect.objectContaining({ code: 'FORBIDDEN' }));
    expect(() => context.submitReferenceAdminChange_({ domain: 'VENUES', action: 'UPDATE', targetId: 'SYN-VENUE-1', expectedRevision: 2, patch: { displayName: 'Denied' }, idempotencyKey: 'SYN-DENIED' }, 'COR-DENIED')).toThrowError(expect.objectContaining({ code: 'FORBIDDEN' }));
  });
});
