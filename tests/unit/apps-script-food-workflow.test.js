import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';

const appScriptRoot = resolve(import.meta.dirname, '../../apps-script');

function contextFor() {
  const properties = new Map([
    ['HAU_ENVIRONMENT', 'STAGING'],
    ['HAU_SPREADSHEET_ID', 'SYNTHETIC-SPREADSHEET-ID-12345678901234567890'],
    ['HAU_BACKUP_SPREADSHEET_ID', 'SYNTHETIC-BACKUP-ID-12345678901234567890'],
    ['HAU_COMPOSITE_REQUESTS_ENABLED', 'true'],
    ['HAU_FOOD_REQUESTS_ENABLED', 'true'],
  ]);
  const tables = new Map();
  const idempotency = new Map();
  const scopes = [];
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
    isNaN,
    Utilities: {
      getUuid: () => 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
      formatDate: (value, _timezone, pattern) =>
        pattern === 'yyyy-MM-dd' ? new Date(value).toISOString().slice(0, 10) : '2026-07-20T09:00:00+08:00',
    },
    PropertiesService: {
      getScriptProperties: () => ({
        getProperty: (key) => properties.get(key) ?? null,
        setProperty: (key, value) => properties.set(key, String(value)),
      }),
    },
  });
  for (const file of [
    'Config.gs',
    'Validation.gs',
    'IdService.gs',
    'FoodWorkflowService.gs',
    'CompositeRequestService.gs',
    'Router.gs',
  ])
    vm.runInContext(readFileSync(resolve(appScriptRoot, file), 'utf8'), context, { filename: file });
  context.withScriptLock_ = (operation) => operation();
  context.withRequestReadCache_ = (operation) => operation();
  context.resolveRequesterUser_ = () => ({ User_ID: 'SYN-REQUESTER', Email: 'synthetic@example.invalid' });
  context.requirePermission_ = (_flag, resource) => {
    scopes.push(resource);
    return { User_ID: 'SYN-FOOD-HEAD', Role: 'COMMITTEE_HEAD' };
  };
  context.findAll_ = (sheet, predicate) => table(sheet).filter(predicate);
  context.appendObjects_ = (sheet, objects) => {
    const rows = table(sheet);
    objects.forEach((object) => rows.push({ ...object, _row: rows.length + 2 }));
  };
  context.updateObject_ = (sheet, rowNumber, patch) => {
    const row = table(sheet).find((entry) => entry._row === rowNumber);
    if (!row) throw new Error(`Missing row ${rowNumber}`);
    Object.assign(row, patch);
    return row;
  };
  context.history_ = (...args) => history.push(args);
  context.audit_ = (...args) => audit.push(args);
  context.idempotencyReplay_ = (key) => idempotency.get(key) ?? null;
  context.recordIdempotency_ = (key, result) => {
    idempotency.set(key, result);
    return result;
  };
  context.__table = table;
  context.__scopes = scopes;
  context.__history = history;
  context.__audit = audit;
  return context;
}

function command() {
  return {
    idempotencyKey: 'SYN-FOOD-SUBMIT',
    requesterName: 'Synthetic Requester',
    department: 'Synthetic Department',
    eventId: 'SYN-EVENT',
    eventName: 'Synthetic Event',
    eventStartAt: '2026-08-08T12:00:00+08:00',
    purpose: 'Synthetic scoped Food workflow',
    sections: [
      {
        type: 'FOOD',
        label: 'Meals',
        lines: [{ label: 'Packed meal', quantity: 12, unit: 'meal' }],
        food: {
          serviceClass: 'BULK_NON_PERISHABLE_OR_CATERING',
          expectedHeadcount: 10,
          requiredServings: 12,
          serviceStartAt: '2026-08-08T12:00:00+08:00',
          serviceLocation: 'Synthetic service area',
          dietarySummary: 'NONE_REPORTED',
          dietaryAttentionServings: 0,
          sourcingMode: 'APPROVED_EXTERNAL_SOURCE',
          sourceReference: 'SYN-SOURCE-1',
        },
      },
      {
        type: 'MATERIALS',
        label: 'Signs',
        lines: [{ label: 'Directional sign', quantity: 1, unit: 'piece' }],
      },
    ],
  };
}

describe('Apps Script Food workflow', () => {
  it('returns only the Food child with bounded parent context and enforces COM_FOOD scope', () => {
    const context = contextFor();
    context.submitCompositeRequest_(command(), 'COR-SUBMIT');
    const queue = context.getFoodWorkQueue_();
    expect(queue.items).toHaveLength(1);
    expect(queue.items[0]).toMatchObject({
      ownerCommitteeId: 'COM_FOOD',
      parent: { eventId: 'SYN-EVENT', eventName: 'Synthetic Event' },
      food: { version: 1, requiredServings: 12 },
    });
    expect(queue.items[0]).not.toHaveProperty('children');
    expect(JSON.stringify(queue)).not.toContain('Directional sign');
    expect(context.__scopes).toContainEqual({ committeeIds: ['COM_FOOD'] });
    const rows = context.__table(context.HAU_SHEETS.COMPOSITE_REQUESTS);
    const parent = rows.find((row) => row.Record_Type === 'PARENT');
    const food = rows.find((row) => row.Component_Type === 'FOOD');
    const materials = rows.find((row) => row.Component_Type === 'MATERIALS');
    food.Lifecycle_Status = 'COMPLETED';
    expect(context.compositeParentDto_(parent, [food], [food, materials])).toMatchObject({
      status: 'PARTIALLY_FULFILLED',
      children: [{ componentType: 'FOOD' }],
    });
  });

  it('uses server submission time and denies public route-level reads by guessed ID', () => {
    const context = contextFor();
    const draft = command();
    draft.submittedAt = '2020-01-01T00:00:00+08:00';
    draft.eventStartAt = '2026-07-24T12:00:00+08:00';
    draft.sections[0].food.serviceStartAt = draft.eventStartAt;
    const created = context.submitCompositeRequest_(draft, 'COR-SERVER-TIME');
    const food = created.request.children.find((child) => child.componentType === 'FOOD').payload.food;
    expect(food.leadTime).toMatchObject({ status: 'SHORT', requiredDays: 10 });
    context.resolveRequesterUser_ = () => ({ User_ID: 'PUBLIC', Role: 'REQUESTER', Active: true });
    expect(context.api_getCompositeRequest({ requestId: created.requestId })).toMatchObject({
      ok: false,
      code: 'FORBIDDEN',
    });
  });

  it('requires revision parity and a matching uploaded delivery proof before linking evidence', () => {
    const context = contextFor();
    const created = context.submitCompositeRequest_(command(), 'COR-SUBMIT');
    const componentId = created.request.children.find((child) => child.componentType === 'FOOD').componentId;
    expect(() =>
      context.updateFoodComponent_(
        {
          requestId: created.requestId,
          componentId,
          expectedRevision: 99,
          patch: { sourcingStatus: 'CONFIRMED' },
          idempotencyKey: 'SYN-WRONG-REVISION',
        },
        'COR-UPDATE-1',
      ),
    ).toThrowError(expect.objectContaining({ code: 'REVISION_CONFLICT' }));
    expect(() =>
      context.updateFoodComponent_(
        {
          requestId: created.requestId,
          componentId,
          expectedRevision: 1,
          patch: { completionEvidenceId: 'SYN-EVIDENCE' },
          idempotencyKey: 'SYN-BAD-EVIDENCE',
        },
        'COR-UPDATE-2',
      ),
    ).toThrowError(expect.objectContaining({ code: 'FOOD_COMPLETION_EVIDENCE_INVALID' }));
    context.__table(context.HAU_SHEETS.EVIDENCE).push({
      Evidence_ID: 'SYN-EVIDENCE',
      Evidence_Type: 'DELIVERABLE_DELIVERY_PROOF',
      Related_Entity_Type: 'COMPOSITE_COMPONENT',
      Related_Entity_ID: componentId,
      Upload_Status: 'UPLOADED',
    });
    const updated = context.updateFoodComponent_(
      {
        requestId: created.requestId,
        componentId,
        expectedRevision: 1,
        patch: { completionEvidenceId: 'SYN-EVIDENCE' },
        idempotencyKey: 'SYN-GOOD-EVIDENCE',
      },
      'COR-UPDATE-3',
    );
    expect(updated).toMatchObject({ revision: 2, food: { completionEvidenceId: 'SYN-EVIDENCE' } });
    expect(context.__history).toHaveLength(4);
    expect(context.__audit).toHaveLength(2);
  });

  it('rechecks Food sourcing and uploaded evidence at server transition time', () => {
    const context = contextFor();
    const created = context.submitCompositeRequest_(command(), 'COR-SUBMIT');
    const componentId = created.request.children.find((child) => child.componentType === 'FOOD').componentId;
    const transition = (action, suffix, expectedRevision) =>
      context.transitionCompositeComponent_(
        {
          requestId: created.requestId,
          componentId,
          action,
          expectedRevision,
          idempotencyKey: `SYN-${suffix}`,
        },
        `COR-${suffix}`,
      );
    expect(transition('ACCEPT', 'ACCEPT', 1)).toMatchObject({ status: 'ACCEPTED' });
    expect(transition('START', 'START', 2)).toMatchObject({ status: 'IN_PROGRESS' });
    expect(transition('READY_FOR_HANDOFF', 'READY', 3)).toMatchObject({ status: 'READY_FOR_HANDOFF' });
    expect(() => transition('COMPLETE', 'COMPLETE-MISSING', 4)).toThrowError(
      expect.objectContaining({ code: 'FOOD_COMPLETION_EVIDENCE_REQUIRED' }),
    );
    context.__table(context.HAU_SHEETS.EVIDENCE).push({
      Evidence_ID: 'SYN-EVIDENCE-TRANSITION',
      Evidence_Type: 'DELIVERABLE_DELIVERY_PROOF',
      Related_Entity_Type: 'COMPOSITE_COMPONENT',
      Related_Entity_ID: componentId,
      Upload_Status: 'UPLOADED',
    });
    context.updateFoodComponent_(
      {
        requestId: created.requestId,
        componentId,
        expectedRevision: 4,
        patch: { completionEvidenceId: 'SYN-EVIDENCE-TRANSITION' },
        idempotencyKey: 'SYN-LINK-EVIDENCE',
      },
      'COR-LINK-EVIDENCE',
    );
    expect(transition('COMPLETE', 'COMPLETE', 5)).toMatchObject({
      status: 'COMPLETED',
      parentStatus: 'PARTIALLY_FULFILLED',
    });
  });

  it('preserves authoritative Food attention through generic cancel, reopen, and amend paths', () => {
    const context = contextFor();
    const created = context.submitCompositeRequest_(command(), 'COR-SUBMIT');
    const food = created.request.children.find((child) => child.componentType === 'FOOD');
    context.cancelCompositeRequest_(
      {
        requestId: created.requestId,
        expectedRevisions: { [food.componentId]: 1 },
        idempotencyKey: 'SYN-CANCEL-ATTENTION',
      },
      'COR-CANCEL-ATTENTION',
    );
    context.reopenCompositeRequest_(
      {
        requestId: created.requestId,
        expectedRevisions: { [food.componentId]: 2 },
        idempotencyKey: 'SYN-REOPEN-ATTENTION',
      },
      'COR-REOPEN-ATTENTION',
    );
    let foodRow = context
      .__table(context.HAU_SHEETS.COMPOSITE_REQUESTS)
      .find((row) => row.Component_ID === food.componentId);
    expect(JSON.parse(foodRow.Attention_Flags_JSON)).toContain('FOOD_COMPLETION_EVIDENCE_MISSING');

    context.amendCompositeRequest_(
      {
        requestId: created.requestId,
        componentId: food.componentId,
        expectedRevision: 3,
        section: { label: 'Amended Food request' },
        idempotencyKey: 'SYN-AMEND-ATTENTION',
      },
      'COR-AMEND-ATTENTION',
    );
    foodRow = context
      .__table(context.HAU_SHEETS.COMPOSITE_REQUESTS)
      .find((row) => row.Component_ID === food.componentId);
    expect(JSON.parse(foodRow.Attention_Flags_JSON)).toEqual(
      expect.arrayContaining(['FOOD_COMPLETION_EVIDENCE_MISSING', 'AMENDED']),
    );
  });
});
