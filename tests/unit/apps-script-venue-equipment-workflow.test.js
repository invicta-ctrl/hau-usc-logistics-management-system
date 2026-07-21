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
    ['HAU_FOOD_REQUESTS_ENABLED', 'false'],
    ['HAU_MATERIALS_REQUESTS_ENABLED', 'false'],
    ['HAU_VENUE_EQUIPMENT_REQUESTS_ENABLED', enabled ? 'true' : 'false'],
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
    'VenueEquipmentWorkflowService.gs',
    'CompositeRequestService.gs',
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
    return { User_ID: 'SYN-HEAD', Role: 'COMMITTEE_HEAD' };
  };
  context.readObjects_ = (sheet) => table(sheet);
  context.findAll_ = (sheet, predicate) => table(sheet).filter(predicate);
  context.appendObjects_ = (sheet, objects) => {
    const rows = table(sheet);
    objects.forEach((object) => rows.push({ ...object, _row: rows.length + 2 }));
  };
  context.updateObject_ = (sheet, rowNumber, change) => {
    const row = table(sheet).find((entry) => entry._row === rowNumber);
    if (!row) throw new Error(`Missing row ${rowNumber}`);
    Object.assign(row, change);
    return row;
  };
  context.history_ = (...args) => history.push(args);
  context.audit_ = (...args) => audit.push(args);
  context.idempotencyReplay_ = (key) => idempotency.get(key) ?? null;
  context.recordIdempotency_ = (key, result) => {
    idempotency.set(key, result);
    return result;
  };
  table(context.HAU_SHEETS.VENUE_EQUIPMENT_ROUTES).push(
    {
      Route_ID: 'SYN-ROUTE-VENUE',
      Match_Kind: 'REFERENCE',
      Reference_ID: 'SYN-VENUE-1',
      Reference_Type: 'VENUE',
      Category_ID: 'MEETING_SPACE',
      Owner_Committee_ID: 'COM_INVENTORY_PANTRY',
      Owner_User_ID: '',
      Responsible_Office_ID: 'SYN-OFFICE-FACILITIES',
      Approving_Authority_ID: 'SYN-AUTH-FACILITIES',
      Lead_Time_Business_Days: 5,
      Instructions: 'Synthetic confirmation is required.',
      Effective_From: '2026-01-01',
      Effective_To: '',
      Revision: 1,
      Status: 'ACTIVE',
    },
    {
      Route_ID: 'SYN-ROUTE-EQUIPMENT',
      Match_Kind: 'REFERENCE',
      Reference_ID: 'SYN-EQUIP-1',
      Reference_Type: 'EQUIPMENT',
      Category_ID: 'AUDIO_VISUAL',
      Owner_Committee_ID: 'COM_INVENTORY_PANTRY',
      Owner_User_ID: '',
      Responsible_Office_ID: 'SYN-OFFICE-EQUIPMENT',
      Approving_Authority_ID: 'SYN-AUTH-EQUIPMENT',
      Lead_Time_Business_Days: 3,
      Instructions: 'Synthetic equipment confirmation is required.',
      Effective_From: '2026-01-01',
      Effective_To: '',
      Revision: 2,
      Status: 'ACTIVE',
    },
    {
      Route_ID: 'SYN-ROUTE-OTHER',
      Match_Kind: 'OTHER',
      Reference_ID: '',
      Reference_Type: '',
      Category_ID: 'OTHER_CONTROLLED',
      Owner_Committee_ID: 'COM_INVENTORY_PANTRY',
      Owner_User_ID: '',
      Responsible_Office_ID: 'SYN-OFFICE-TRIAGE',
      Approving_Authority_ID: 'SYN-AUTH-TRIAGE',
      Lead_Time_Business_Days: 5,
      Instructions: 'Synthetic classification is required.',
      Effective_From: '2026-01-01',
      Effective_To: '',
      Revision: 1,
      Status: 'ACTIVE',
    },
  );
  table(context.HAU_SHEETS.VENUE_EQUIPMENT_REFERENCES).push(
    {
      Reference_ID: 'SYN-VENUE-1',
      Reference_Type: 'VENUE',
      Category_ID: 'MEETING_SPACE',
      Display_Name: 'Synthetic Assembly Room',
      Aliases_JSON: JSON.stringify(['Assembly Room']),
      Location_Label: 'Synthetic Building',
      Unit: 'service',
      Requestability: 'REQUESTABLE',
      Contact_Role: 'Synthetic facilities contact',
      Route_ID: 'SYN-ROUTE-VENUE',
      Return_Required: false,
      Effective_From: '2026-01-01',
      Effective_To: '',
      Revision: 1,
      Source_Revision: 'SYN-REF-1',
      Status: 'ACTIVE',
    },
    {
      Reference_ID: 'SYN-EQUIP-1',
      Reference_Type: 'EQUIPMENT',
      Category_ID: 'AUDIO_VISUAL',
      Display_Name: 'Synthetic Projector Set',
      Aliases_JSON: JSON.stringify(['Projector']),
      Location_Label: 'Synthetic Equipment Room',
      Unit: 'set',
      Requestability: 'REQUESTABLE',
      Contact_Role: 'Synthetic equipment custodian',
      Route_ID: 'SYN-ROUTE-EQUIPMENT',
      Return_Required: true,
      Effective_From: '2026-01-01',
      Effective_To: '',
      Revision: 1,
      Source_Revision: 'SYN-REF-1',
      Status: 'ACTIVE',
    },
  );
  context.__table = table;
  context.__scopes = scopes;
  context.__history = history;
  context.__audit = audit;
  return context;
}

function venueEquipmentSection({ equipment = true } = {}) {
  return {
    type: 'VENUE_EQUIPMENT',
    label: 'Venue & Equipment',
    lines: equipment
      ? [
          {
            referenceId: 'SYN-EQUIP-1',
            referenceRevision: 1,
            label: 'Synthetic Projector Set',
            quantity: 1,
            unit: 'set',
            category: 'AUDIO_VISUAL',
          },
        ]
      : [
          {
            referenceId: 'SYN-VENUE-1',
            referenceRevision: 1,
            label: 'Synthetic Assembly Room',
            quantity: 1,
            unit: 'service',
            category: 'MEETING_SPACE',
          },
        ],
    venueEquipment: {
      purposeDetail: 'Synthetic controlled event support',
      scheduleStartAt: '2026-08-08T09:00:00+08:00',
      scheduleEndAt: '2026-08-08T17:00:00+08:00',
    },
  };
}

function command(section = venueEquipmentSection()) {
  return {
    idempotencyKey: 'SYN-VE-SUBMIT',
    requesterName: 'Synthetic Requester',
    requesterEmail: 'synthetic@example.invalid',
    department: 'Synthetic Department',
    eventId: 'SYN-EVENT-1',
    eventName: 'Synthetic Event',
    eventStartAt: '2026-08-08T09:00:00+08:00',
    eventEndAt: '2026-08-08T17:00:00+08:00',
    purpose: 'Synthetic composite request',
    sections: [section],
  };
}

describe('Apps Script Venue and Equipment workflow', () => {
  it('returns safe requestability search results and persists immutable reference and route snapshots', () => {
    const context = contextFor();
    const references = context.__table(context.HAU_SHEETS.VENUE_EQUIPMENT_REFERENCES);
    const routes = context.__table(context.HAU_SHEETS.VENUE_EQUIPMENT_ROUTES);
    const currentReference = references.find((row) => row.Reference_ID === 'SYN-EQUIP-1');
    const currentRoute = routes.find((row) => row.Route_ID === 'SYN-ROUTE-EQUIPMENT');
    currentReference.Effective_To = '2026-12-31';
    currentRoute.Effective_To = '2026-12-31';
    references.push({
      ...currentReference,
      Display_Name: 'Synthetic Future Projector Set',
      Aliases_JSON: JSON.stringify(['Future Projector']),
      Effective_From: '2027-01-01',
      Effective_To: '',
      Revision: 2,
      Source_Revision: 'SYN-REF-2',
    });
    routes.push({
      ...currentRoute,
      Responsible_Office_ID: 'SYN-OFFICE-EQUIPMENT-FUTURE',
      Effective_From: '2027-01-01',
      Effective_To: '',
      Revision: 3,
    });
    const search = context.searchVenueEquipmentReferences_({
      query: 'projector',
      at: '2027-07-20T09:00:00+08:00',
    });
    expect(search).toEqual([
      expect.objectContaining({
        id: 'SYN-EQUIP-1',
        requestabilityLabel: 'Requestable - confirmation required; not a booking guarantee',
        referenceRevision: 1,
        leadTimeBusinessDays: 3,
      }),
    ]);
    expect(search[0]).not.toHaveProperty('ownerCommitteeId');
    expect(search[0]).not.toHaveProperty('ownerUserId');
    const created = context.submitCompositeRequest_(command(), 'COR-SUBMIT');
    const child = created.request.children[0];
    expect(child).toMatchObject({
      componentType: 'VENUE_EQUIPMENT',
      ownerCommitteeId: 'COM_INVENTORY_PANTRY',
      payload: {
        venueEquipment: {
          confirmationStatus: 'PENDING_CONFIRMATION',
          returnRequired: true,
          returnStatus: 'PENDING_RETURN',
          referenceSnapshots: [
            {
              referenceId: 'SYN-EQUIP-1',
              referenceRevision: 1,
              routeId: 'SYN-ROUTE-EQUIPMENT',
              routeRevision: 2,
            },
          ],
        },
      },
    });
  });

  it('fails closed only when stable-ID revisions overlap at server time', () => {
    const context = contextFor();
    const references = context.__table(context.HAU_SHEETS.VENUE_EQUIPMENT_REFERENCES);
    const current = references.find((row) => row.Reference_ID === 'SYN-EQUIP-1');
    references.push({ ...current, Revision: 2, Source_Revision: 'SYN-REF-OVERLAP' });
    expect(() => context.searchVenueEquipmentReferences_({ query: 'projector' })).toThrowError(
      expect.objectContaining({ code: 'VENUE_EQUIPMENT_REFERENCE_CONFLICT' }),
    );

    const routeContext = contextFor();
    const routes = routeContext.__table(routeContext.HAU_SHEETS.VENUE_EQUIPMENT_ROUTES);
    const currentRoute = routes.find((row) => row.Route_ID === 'SYN-ROUTE-EQUIPMENT');
    routes.push({ ...currentRoute, Revision: 3 });
    expect(() => routeContext.searchVenueEquipmentReferences_({ query: 'projector' })).toThrowError(
      expect.objectContaining({ code: 'VENUE_EQUIPMENT_ROUTE_CONFLICT' }),
    );
  });

  it('fails closed for disabled specialized input and exact ACTIVE requestability rules', () => {
    const disabled = contextFor({ enabled: false });
    expect(() => disabled.submitCompositeRequest_(command(), 'COR-DISABLED')).toThrowError(
      expect.objectContaining({ code: 'FEATURE_DISABLED' }),
    );
    disabled.__table(disabled.HAU_SHEETS.COMPOSITE_REQUESTS).push(
      {
        _row: 2,
        Record_Type: 'PARENT',
        Request_ID: 'SYN-EXISTING-1',
        Event_Name: 'Existing synthetic event',
        Lifecycle_Status: 'FOR_REVIEW',
      },
      {
        _row: 3,
        Record_Type: 'COMPONENT',
        Request_ID: 'SYN-EXISTING-1',
        Component_ID: 'SYN-EXISTING-CMP-1',
        Component_Type: 'VENUE_EQUIPMENT',
        Owner_Committee_ID: 'COM_INVENTORY_PANTRY',
        Lifecycle_Status: 'FOR_REVIEW',
        Revision: 4,
        Component_Payload_JSON: JSON.stringify({
          lines: [],
          venueEquipment: { version: 1, confirmationStatus: 'PENDING_CONFIRMATION' },
        }),
        Attention_Flags_JSON: '[]',
      },
    );
    expect(
      disabled.getVenueEquipmentWorkQueue_({ committeeId: 'COM_INVENTORY_PANTRY' }).items,
    ).toEqual([
      expect.objectContaining({
        componentId: 'SYN-EXISTING-CMP-1',
        revision: 4,
      }),
    ]);
    const context = contextFor();
    context.__table(context.HAU_SHEETS.VENUE_EQUIPMENT_REFERENCES)[1].Requestability = 'NOT_REQUESTABLE';
    expect(() => context.submitCompositeRequest_(command(), 'COR-NOT-REQUESTABLE')).toThrowError(
      expect.objectContaining({ code: 'VENUE_EQUIPMENT_NOT_REQUESTABLE' }),
    );
    expect(context.__table(context.HAU_SHEETS.COMPOSITE_REQUESTS)).toHaveLength(0);
  });

  it('scopes each work queue to one of the three existing committees', () => {
    const context = contextFor();
    const created = context.submitCompositeRequest_(command(), 'COR-SUBMIT');
    const queue = context.getVenueEquipmentWorkQueue_({ committeeId: 'COM_INVENTORY_PANTRY' });
    expect(queue.items).toHaveLength(1);
    expect(queue.items[0]).toMatchObject({
      componentId: created.componentIds[0],
      ownerCommitteeId: 'COM_INVENTORY_PANTRY',
      parent: { eventName: 'Synthetic Event', department: 'Synthetic Department' },
    });
    expect(queue.items[0].parent).not.toHaveProperty('requesterEmail');
    expect(context.__scopes).toContainEqual({ committeeIds: ['COM_INVENTORY_PANTRY'] });
    expect(() => context.getVenueEquipmentWorkQueue_({ committeeId: 'COM_VENUE' })).toThrowError(
      expect.objectContaining({ code: 'VENUE_EQUIPMENT_QUEUE_SCOPE_INVALID' }),
    );
  });

  it('requires revision parity, approved confirmation, return, and linked evidence before completion', () => {
    const context = contextFor();
    const created = context.submitCompositeRequest_(command(), 'COR-SUBMIT');
    const componentId = created.componentIds[0];
    expect(() =>
      context.updateVenueEquipmentComponent_(
        {
          requestId: created.requestId,
          componentId,
          expectedRevision: 2,
          patch: { confirmationStatus: 'CONFIRMED', confirmationReference: 'SYN-CONFIRM-1' },
          idempotencyKey: 'SYN-STALE',
        },
        'COR-STALE',
      ),
    ).toThrowError(expect.objectContaining({ code: 'REVISION_CONFLICT' }));
    context.__table(context.HAU_SHEETS.EVIDENCE).push({
      Evidence_ID: 'SYN-VE-EVIDENCE-1',
      Evidence_Type: 'VENUE_EQUIPMENT_CONFIRMATION',
      Related_Entity_Type: 'COMPOSITE_COMPONENT',
      Related_Entity_ID: componentId,
      Upload_Status: 'UPLOADED',
    });
    context.transitionCompositeComponent_(
      { requestId: created.requestId, componentId, expectedRevision: 1, action: 'ACCEPT', idempotencyKey: 'SYN-ACCEPT' },
      'COR-ACCEPT',
    );
    context.transitionCompositeComponent_(
      { requestId: created.requestId, componentId, expectedRevision: 2, action: 'START', idempotencyKey: 'SYN-START' },
      'COR-START',
    );
    const updated = context.updateVenueEquipmentComponent_(
      {
        requestId: created.requestId,
        componentId,
        expectedRevision: 3,
        patch: {
          confirmationStatus: 'CONFIRMED',
          confirmationReference: 'SYN-CONFIRM-1',
          returnStatus: 'RETURNED',
          fulfillmentEvidenceId: 'SYN-VE-EVIDENCE-1',
        },
        idempotencyKey: 'SYN-UPDATE',
      },
      'COR-UPDATE',
    );
    expect(updated).toMatchObject({ revision: 4, venueEquipment: { returnStatus: 'RETURNED' } });
    context.transitionCompositeComponent_(
      { requestId: created.requestId, componentId, expectedRevision: 4, action: 'READY_FOR_HANDOFF', idempotencyKey: 'SYN-READY' },
      'COR-READY',
    );
    const completed = context.transitionCompositeComponent_(
      { requestId: created.requestId, componentId, expectedRevision: 5, action: 'COMPLETE', idempotencyKey: 'SYN-COMPLETE' },
      'COR-COMPLETE',
    );
    expect(completed).toMatchObject({ status: 'COMPLETED', parentStatus: 'COMPLETED' });
    expect(context.__audit.some((entry) => entry[0] === 'UPDATE_VENUE_EQUIPMENT_COMPONENT')).toBe(true);
  });

  it('preserves prior reference snapshots when an effective-dated amendment reroutes the child', () => {
    const context = contextFor();
    const created = context.submitCompositeRequest_(command(), 'COR-SUBMIT');
    const componentId = created.componentIds[0];
    context.amendCompositeRequest_(
      {
        requestId: created.requestId,
        componentId,
        expectedRevision: 1,
        section: venueEquipmentSection({ equipment: false }),
        idempotencyKey: 'SYN-AMEND',
        reason: 'Synthetic approved venue amendment',
      },
      'COR-AMEND',
    );
    const child = context
      .__table(context.HAU_SHEETS.COMPOSITE_REQUESTS)
      .find((row) => row.Component_ID === componentId);
    const details = JSON.parse(child.Component_Payload_JSON).venueEquipment;
    expect(details.referenceSnapshots[0]).toMatchObject({ referenceId: 'SYN-VENUE-1' });
    expect(details.provenanceHistory).toEqual([
      expect.objectContaining({
        version: 1,
        referenceSnapshots: [expect.objectContaining({ referenceId: 'SYN-EQUIP-1' })],
      }),
    ]);
    expect(child.Owner_Committee_ID).toBe('COM_INVENTORY_PANTRY');
  });
});
