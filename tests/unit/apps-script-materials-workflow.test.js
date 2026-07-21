import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import vm from 'node:vm';
import { describe, expect, it } from 'vitest';

const appScriptRoot = resolve(import.meta.dirname, '../../apps-script');

function contextFor({ enabled = true } = {}) {
  const properties = new Map([
    ['HAU_ENVIRONMENT', 'STAGING'],
    ['HAU_SPREADSHEET_ID', 'SYNTHETIC-SPREADSHEET-ID-12345678901234567890'],
    ['HAU_BACKUP_SPREADSHEET_ID', 'SYNTHETIC-BACKUP-ID-12345678901234567890'],
    ['HAU_COMPOSITE_REQUESTS_ENABLED', 'true'],
    ['HAU_FOOD_REQUESTS_ENABLED', 'true'],
    ['HAU_MATERIALS_REQUESTS_ENABLED', enabled ? 'true' : 'false'],
  ]);
  const tables = new Map();
  const idempotency = new Map();
  const scopes = [];
  const history = [];
  const audit = [];
  const items = new Map([
    [
      'SYN-MAT-1',
      {
        Item_ID: 'SYN-MAT-1',
        Item_Name: 'Directional Sign',
        Unit: 'piece',
        Status: 'ACTIVE',
        Category: 'PRINTING_SIGNAGE',
        Legacy_Source_Sheet: 'SYNTHETIC SOURCE',
        Legacy_Source_Row: 12,
        Legacy_Source_Block: 'A-C',
        _Helper_Name: 'Directional Sign',
        _Helper_Qty: 18,
        _Helper_Unit: 'piece',
      },
    ],
    [
      'SYN-MAT-2',
      {
        Item_ID: 'SYN-MAT-2',
        Item_Name: 'Approved Directional Sign',
        Unit: 'piece',
        Status: 'ACTIVE',
        Category: 'PRINTING_SIGNAGE',
      },
    ],
    [
      'SYN-VERIFY-1',
      {
        Item_ID: 'SYN-VERIFY-1',
        Item_Name: 'Unverified Legacy Material',
        Unit: 'piece',
        Status: 'VERIFY',
        Category: 'PRINTING_SIGNAGE',
      },
    ],
  ]);
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
      formatDate: () => '2026-07-20T09:00:00+08:00',
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
    'MaterialsWorkflowService.gs',
    'CompositeRequestService.gs',
    'Router.gs',
  ])
    vm.runInContext(readFileSync(resolve(appScriptRoot, file), 'utf8'), context, { filename: file });
  context.withScriptLock_ = (operation) => operation();
  context.withRequestReadCache_ = (operation) => operation();
  context.resolveRequesterUser_ = () => ({
    User_ID: 'SYN-REQUESTER',
    Email: 'synthetic@example.invalid',
  });
  context.requirePermission_ = (_flag, resource) => {
    scopes.push(resource);
    return { User_ID: 'SYN-MATERIALS-HEAD', Role: 'COMMITTEE_HEAD' };
  };
  context.itemById_ = (id) => {
    const item = items.get(String(id));
    if (!item) throw context.appError_('ITEM_NOT_FOUND', 'Synthetic item was not found.', false);
    return item;
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
  context.__items = items;
  return context;
}

function materialsSection(referenceId = 'SYN-MAT-1', label = 'Directional Sign') {
  return {
    type: 'MATERIALS',
    label: 'Materials',
    lines: [
      {
        referenceId,
        label,
        quantity: 4,
        unit: 'piece',
        category: 'PRINTING_SIGNAGE',
      },
    ],
    materials: {
      materialCategory: 'PRINTING_SIGNAGE',
      specification: 'A3 directional sign with approved event wording',
      requiredBy: '2026-08-08',
      usagePurpose: 'Synthetic event wayfinding',
      sourcingPreference: 'STOCK_REVIEW',
    },
  };
}

function command(section = materialsSection()) {
  return {
    idempotencyKey: 'SYN-MATERIALS-SUBMIT',
    requesterName: 'Synthetic Requester',
    requesterEmail: 'synthetic@example.invalid',
    department: 'Synthetic Department',
    eventId: 'SYN-EVENT-1',
    eventName: 'Synthetic Event',
    eventStartAt: '2026-08-08T09:00:00+08:00',
    purpose: 'Synthetic composite request',
    sections: [
      section,
      {
        type: 'VENUE_EQUIPMENT',
        label: 'Venue',
        lines: [{ label: 'Synthetic room', quantity: 1, unit: 'piece' }],
      },
    ],
  };
}

describe('Apps Script Materials workflow', () => {
  it('persists exact source provenance and returns only COM_MATERIALS scoped queue data', () => {
    const context = contextFor();
    const created = context.submitCompositeRequest_(command(), 'COR-SUBMIT');
    const materials = created.request.children.find((child) => child.componentType === 'MATERIALS');
    expect(materials.payload.materials.lineSnapshots[0]).toMatchObject({
      referenceId: 'SYN-MAT-1',
      sourceName: 'Directional Sign',
      requestedQuantity: 4,
      sourceQuantity: 18,
      sourceUnit: 'piece',
      sourceSheet: 'SYNTHETIC SOURCE',
      sourceRow: '12',
      sourceBlock: 'A-C',
    });
    const queue = context.getMaterialsWorkQueue_();
    expect(queue.items).toHaveLength(1);
    expect(queue.items[0]).toMatchObject({
      componentId: materials.componentId,
      ownerCommitteeId: 'COM_MATERIALS',
      parent: { eventName: 'Synthetic Event', department: 'Synthetic Department' },
    });
    expect(queue.items[0].parent).not.toHaveProperty('requesterEmail');
    expect(context.__scopes).toContainEqual({ committeeIds: ['COM_MATERIALS'] });
  });

  it('fails closed for disabled specialization and blocks VERIFY before persistence', () => {
    const disabled = contextFor({ enabled: false });
    expect(() => disabled.submitCompositeRequest_(command(), 'COR-DISABLED')).toThrowError(
      expect.objectContaining({ code: 'FEATURE_DISABLED' }),
    );
    const context = contextFor();
    expect(() =>
      context.submitCompositeRequest_(
        command(materialsSection('SYN-VERIFY-1', 'Unverified Legacy Material')),
        'COR-VERIFY',
      ),
    ).toThrowError(expect.objectContaining({ code: 'MATERIAL_VERIFY_BLOCKED' }));
    expect(context.__table(context.HAU_SHEETS.COMPOSITE_REQUESTS)).toHaveLength(0);
  });

  it('accepts only ACTIVE catalog references with the exact controlled category', () => {
    for (const status of ['', 'IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK', 'ARCHIVED']) {
      const context = contextFor();
      context.__items.get('SYN-MAT-1').Status = status;
      expect(() => context.submitCompositeRequest_(command(), `COR-${status || 'BLANK'}`)).toThrowError(
        expect.objectContaining({ code: 'MATERIAL_REFERENCE_INACTIVE' }),
      );
    }
    const context = contextFor();
    context.__items.get('SYN-MAT-1').Category = 'OFFICE_SUPPLIES';
    expect(() => context.submitCompositeRequest_(command(), 'COR-CATEGORY')).toThrowError(
      expect.objectContaining({ code: 'MATERIAL_CATEGORY_MISMATCH' }),
    );
  });

  it('enforces revision parity, explicit substitutions, and path-matching evidence', () => {
    const context = contextFor();
    const created = context.submitCompositeRequest_(command(), 'COR-SUBMIT');
    const componentId = created.request.children.find(
      (child) => child.componentType === 'MATERIALS',
    ).componentId;
    expect(() =>
      context.updateMaterialsComponent_(
        {
          requestId: created.requestId,
          componentId,
          expectedRevision: 2,
          patch: { fulfillmentPath: 'STOCK_ISSUE' },
          idempotencyKey: 'SYN-STALE',
        },
        'COR-STALE',
      ),
    ).toThrowError(expect.objectContaining({ code: 'REVISION_CONFLICT' }));
    expect(() =>
      context.updateMaterialsComponent_(
        {
          requestId: created.requestId,
          componentId,
          expectedRevision: 1,
          patch: {
            substitutionPolicy: 'APPROVED_SUBSTITUTION',
            approvedSubstitutionReferenceId: 'SYN-MAT-2',
          },
          idempotencyKey: 'SYN-BAD-SUB',
        },
        'COR-BAD-SUB',
      ),
    ).toThrowError(expect.objectContaining({ code: 'VALIDATION_ERROR' }));
    context.__table(context.HAU_SHEETS.EVIDENCE).push({
      Evidence_ID: 'SYN-RECEIPT-1',
      Evidence_Type: 'DELIVERABLE_RECEIPT',
      Related_Entity_Type: 'COMPOSITE_COMPONENT',
      Related_Entity_ID: componentId,
      Upload_Status: 'UPLOADED',
    });
    expect(() =>
      context.updateMaterialsComponent_(
        {
          requestId: created.requestId,
          componentId,
          expectedRevision: 1,
          patch: {
            fulfillmentPath: 'STOCK_ISSUE',
            fulfillmentEvidenceId: 'SYN-RECEIPT-1',
          },
          idempotencyKey: 'SYN-WRONG-EVIDENCE',
        },
        'COR-WRONG-EVIDENCE',
      ),
    ).toThrowError(expect.objectContaining({ code: 'MATERIALS_COMPLETION_EVIDENCE_INVALID' }));
    const updated = context.updateMaterialsComponent_(
      {
        requestId: created.requestId,
        componentId,
        expectedRevision: 1,
        patch: {
          fulfillmentPath: 'PROCUREMENT_RECEIPT',
          substitutionPolicy: 'APPROVED_SUBSTITUTION',
          approvedSubstitutionReferenceId: 'SYN-MAT-2',
          substitutionReason: 'Authorized equivalent for the same specification',
          fulfillmentEvidenceId: 'SYN-RECEIPT-1',
        },
        idempotencyKey: 'SYN-GOOD-UPDATE',
      },
      'COR-GOOD-UPDATE',
    );
    expect(updated).toMatchObject({
      revision: 2,
      materials: {
        fulfillmentPath: 'PROCUREMENT_RECEIPT',
        approvedSubstitutionReferenceId: 'SYN-MAT-2',
      },
    });
    expect(context.__history).toHaveLength(4);
    expect(context.__audit.at(-1)[0]).toBe('UPDATE_MATERIALS_COMPONENT');
    expect(context.__history.at(-1)[6].metadata.substitutionAfter).toEqual({
      policy: 'APPROVED_SUBSTITUTION',
      approvedReferenceId: 'SYN-MAT-2',
      reason: 'Authorized equivalent for the same specification',
    });
    expect(context.__audit.at(-1)[5].after).toMatchObject({
      approvedSubstitutionReferenceId: 'SYN-MAT-2',
      substitutionReason: 'Authorized equivalent for the same specification',
    });
  });

  it('preserves workflow decisions and immutable provenance when Materials is amended', () => {
    const context = contextFor();
    const created = context.submitCompositeRequest_(command(), 'COR-SUBMIT');
    const component = created.request.children.find((child) => child.componentType === 'MATERIALS');
    context.__table(context.HAU_SHEETS.EVIDENCE).push({
      Evidence_ID: 'SYN-ISSUE-AMEND',
      Evidence_Type: 'MATERIALS_ISSUE_PROOF',
      Related_Entity_Type: 'COMPOSITE_COMPONENT',
      Related_Entity_ID: component.componentId,
      Upload_Status: 'UPLOADED',
    });
    context.updateMaterialsComponent_(
      {
        requestId: created.requestId,
        componentId: component.componentId,
        expectedRevision: 1,
        patch: {
          fulfillmentPath: 'STOCK_ISSUE',
          substitutionPolicy: 'APPROVED_SUBSTITUTION',
          approvedSubstitutionReferenceId: 'SYN-MAT-2',
          substitutionReason: 'Synthetic authorized equivalent',
          blockerStatus: 'BLOCKED',
          blockerReason: 'Synthetic pending confirmation',
          fulfillmentEvidenceId: 'SYN-ISSUE-AMEND',
        },
        idempotencyKey: 'SYN-AMEND-DECISION',
      },
      'COR-AMEND-DECISION',
    );
    context.__items.get('SYN-MAT-1')._Helper_Qty = 999;
    context.amendCompositeRequest_(
      {
        requestId: created.requestId,
        componentId: component.componentId,
        expectedRevision: 2,
        section: {
          lines: [{ ...materialsSection().lines[0], quantity: 6 }],
          materials: { specification: 'Amended sign wording' },
        },
        idempotencyKey: 'SYN-AMEND-MATERIALS',
      },
      'COR-AMEND-MATERIALS',
    );
    const row = context
      .__table(context.HAU_SHEETS.COMPOSITE_REQUESTS)
      .find((entry) => entry.Component_ID === component.componentId);
    const materials = JSON.parse(row.Component_Payload_JSON).materials;
    expect(materials).toMatchObject({
      fulfillmentPath: 'STOCK_ISSUE',
      substitutionPolicy: 'APPROVED_SUBSTITUTION',
      approvedSubstitutionReferenceId: 'SYN-MAT-2',
      blockerStatus: 'BLOCKED',
      fulfillmentEvidenceId: 'SYN-ISSUE-AMEND',
      lineSnapshots: [{ requestedQuantity: 6, sourceQuantity: 18 }],
      provenanceHistory: [{ version: 1, lineSnapshots: [{ requestedQuantity: 4 }] }],
    });
    expect(JSON.parse(row.Attention_Flags_JSON)).toEqual(
      expect.arrayContaining(['MATERIALS_BLOCKED', 'AMENDED']),
    );
    expect(JSON.parse(row.Attention_Flags_JSON)).not.toContain(
      'MATERIALS_FULFILLMENT_PATH_PENDING',
    );
  });

  it('rechecks fulfillment decision, blockers, and uploaded evidence at transition time', () => {
    const context = contextFor();
    const created = context.submitCompositeRequest_(command(), 'COR-SUBMIT');
    const componentId = created.request.children.find(
      (child) => child.componentType === 'MATERIALS',
    ).componentId;
    const transition = (action, key, expectedRevision) =>
      context.transitionCompositeComponent_(
        {
          requestId: created.requestId,
          componentId,
          action,
          expectedRevision,
          idempotencyKey: key,
        },
        `COR-${key}`,
      );
    expect(transition('ACCEPT', 'ACCEPT', 1)).toMatchObject({ status: 'ACCEPTED' });
    expect(transition('START', 'START', 2)).toMatchObject({ status: 'IN_PROGRESS' });
    expect(() => transition('READY_FOR_HANDOFF', 'EARLY', 3)).toThrowError(
      expect.objectContaining({ code: 'MATERIALS_FULFILLMENT_PATH_REQUIRED' }),
    );
    context.__table(context.HAU_SHEETS.EVIDENCE).push({
      Evidence_ID: 'SYN-ISSUE-1',
      Evidence_Type: 'MATERIALS_ISSUE_PROOF',
      Related_Entity_Type: 'COMPOSITE_COMPONENT',
      Related_Entity_ID: componentId,
      Upload_Status: 'UPLOADED',
    });
    context.updateMaterialsComponent_(
      {
        requestId: created.requestId,
        componentId,
        expectedRevision: 3,
        patch: { fulfillmentPath: 'STOCK_ISSUE', fulfillmentEvidenceId: 'SYN-ISSUE-1' },
        idempotencyKey: 'SYN-LINK-ISSUE',
      },
      'COR-LINK-ISSUE',
    );
    expect(transition('READY_FOR_HANDOFF', 'HANDOFF', 4)).toMatchObject({
      status: 'READY_FOR_HANDOFF',
    });
    context.updateMaterialsComponent_(
      {
        requestId: created.requestId,
        componentId,
        expectedRevision: 5,
        patch: { blockerStatus: 'BLOCKED', blockerReason: 'Synthetic late blocker' },
        idempotencyKey: 'SYN-LATE-BLOCKER',
      },
      'COR-LATE-BLOCKER',
    );
    expect(() => transition('COMPLETE', 'BLOCKED-COMPLETE', 6)).toThrowError(
      expect.objectContaining({ code: 'MATERIALS_BLOCKED' }),
    );
    context.updateMaterialsComponent_(
      {
        requestId: created.requestId,
        componentId,
        expectedRevision: 6,
        patch: { blockerStatus: 'NONE' },
        idempotencyKey: 'SYN-CLEAR-LATE-BLOCKER',
      },
      'COR-CLEAR-LATE-BLOCKER',
    );
    expect(transition('COMPLETE', 'COMPLETE', 7)).toMatchObject({ status: 'COMPLETED' });
  });
});
