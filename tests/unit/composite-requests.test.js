import { describe, expect, it } from 'vitest';
import { createSeedState } from '../../src/data/seed.js';
import { can } from '../../src/domain/permissions.js';
import {
  COMPOSITE_ACTIONS,
  COMPOSITE_SECTION_TYPES,
  amendCompositeSection,
  consolidateCompositeLines,
  createCompositePacket,
  deriveCompositeParentStatus,
  transitionCompositeChild,
  validateCompositeDraft,
} from '../../src/domain/composite-requests.js';
import { MockService } from '../../src/services/mock-service.js';

const allSections = {
  FOOD: {
    type: 'FOOD',
    label: 'Meals',
    lines: [{ label: 'Packed meal', quantity: 10, unit: 'meal' }],
    food: {
      serviceClass: 'BULK_NON_PERISHABLE_OR_CATERING',
      expectedHeadcount: 10,
      requiredServings: 10,
      serviceStartAt: '2026-08-08T12:00:00+08:00',
      serviceLocation: 'Synthetic service area',
      dietarySummary: 'NONE_REPORTED',
      dietaryAttentionServings: 0,
      sourcingMode: 'APPROVED_EXTERNAL_SOURCE',
      sourceReference: 'SYN-SOURCE-1',
    },
  },
  MATERIALS: {
    type: 'MATERIALS',
    label: 'Materials',
    lines: [{ label: 'Directional sign', quantity: 4, unit: 'piece' }],
    materials: {
      materialCategory: 'PRINTING_SIGNAGE',
      specification: 'Directional event sign',
      requiredBy: '2026-08-08',
      usagePurpose: 'Synthetic event wayfinding',
      sourcingPreference: 'STOCK_REVIEW',
    },
  },
  VENUE_EQUIPMENT: {
    type: 'VENUE_EQUIPMENT',
    label: 'Venue setup',
    lines: [
      {
        referenceId: 'SYN-VENUE-1',
        referenceRevision: 1,
        label: 'Synthetic Assembly Room',
        quantity: 1,
        unit: 'service',
        category: 'MEETING_SPACE',
      },
    ],
    venueEquipment: { purposeDetail: 'Synthetic venue setup' },
  },
};

const venueRoute = {
  id: 'SYN-ROUTE-VENUE',
  matchKind: 'REFERENCE',
  referenceId: 'SYN-VENUE-1',
  ownerCommitteeId: 'COM_INVENTORY_PANTRY',
  ownerUserId: '',
  responsibleOfficeId: 'SYN-OFFICE-FACILITIES',
  approvingAuthorityId: 'SYN-AUTH-FACILITIES',
  leadTimeBusinessDays: 5,
  instructions: 'Synthetic route instructions',
  effectiveFrom: '2026-01-01',
  effectiveTo: '',
  revision: 1,
  status: 'ACTIVE',
};
const venueReference = {
  id: 'SYN-VENUE-1',
  type: 'VENUE',
  category: 'MEETING_SPACE',
  name: 'Synthetic Assembly Room',
  aliases: [],
  location: 'Synthetic Campus',
  unit: 'service',
  requestability: 'REQUESTABLE',
  contactRole: 'Facilities coordinator',
  routeId: 'SYN-ROUTE-VENUE',
  returnRequired: false,
  effectiveFrom: '2026-01-01',
  effectiveTo: '',
  revision: 1,
  sourceRevision: 'SYN-REFSET-1',
  status: 'ACTIVE',
};

function command(sections, idempotencyKey = 'SYN-COMPOSITE-1') {
  return {
    idempotencyKey,
    requesterName: 'Synthetic Requester',
    requesterEmail: 'synthetic@example.invalid',
    department: 'Synthetic Department',
    eventId: 'SYN-EVENT-1',
    eventName: 'Synthetic Event',
    purpose: 'Synthetic composite request',
    submittedAt: '2026-07-20T09:00:00+08:00',
    eventStartAt: '2026-08-08T09:00:00+08:00',
    eventEndAt: '2026-08-08T17:00:00+08:00',
    sections,
  };
}

function serviceContext(role = 'DOL_STAFF') {
  let state = createSeedState();
  state.role = role;
  const store = {
    getState: () => state,
    replace(next) {
      state = next;
    },
  };
  return { service: new MockService(store), getState: () => state };
}

describe('composite request domain', () => {
  it.each([
    [['FOOD']],
    [['MATERIALS']],
    [['VENUE_EQUIPMENT']],
    [['FOOD', 'MATERIALS']],
    [['FOOD', 'VENUE_EQUIPMENT']],
    [['MATERIALS', 'VENUE_EQUIPMENT']],
    [['FOOD', 'MATERIALS', 'VENUE_EQUIPMENT']],
  ])('creates one independent child for the non-empty combination %j', (types) => {
    const packet = createCompositePacket(command(types.map((type) => allSections[type])), {
      requestId: 'LREQ-2026-0001',
      componentIds: types.map((_, index) => `CMP-${String(index + 1).padStart(4, '0')}`),
      actor: 'SYN-ACTOR',
      now: '2026-07-14T00:00:00.000Z',
      resolveVenueEquipmentReference: () => venueReference,
      resolveVenueEquipmentRoute: () => venueRoute,
    });
    expect(packet.children).toHaveLength(types.length);
    expect(packet.children.map((child) => child.componentType)).toEqual(types);
    expect(new Set(packet.children.map((child) => child.componentId)).size).toBe(types.length);
    expect(packet.children.every((child) => child.requestId === packet.parent.requestId)).toBe(true);
  });

  it('rejects all-blank sections and never creates a blank child', () => {
    expect(() =>
      validateCompositeDraft(
        command([
          { type: 'FOOD', lines: [] },
          { type: 'MATERIALS', label: '', lines: [] },
        ]),
      ),
    ).toThrowError(expect.objectContaining({ code: 'COMPOSITE_SECTIONS_REQUIRED' }));
  });

  it('consolidates exact duplicate canonical lines but keeps distinct references separate', () => {
    const lines = consolidateCompositeLines([
      { referenceId: 'CAT-1', label: 'Water', quantity: 2, unit: 'bottle', notes: '' },
      { referenceId: 'CAT-1', label: ' water ', quantity: 3, unit: 'BOTTLE', notes: '' },
      { referenceId: 'CAT-2', label: 'Water', quantity: 1, unit: 'bottle', notes: '' },
    ]);
    expect(lines).toHaveLength(2);
    expect(lines[0]).toMatchObject({ referenceId: 'CAT-1', quantity: 5, duplicateCount: 1 });
    expect(lines[1]).toMatchObject({ referenceId: 'CAT-2', quantity: 1, duplicateCount: 0 });
  });

  it('rejects client-supplied authoritative IDs', () => {
    expect(() =>
      validateCompositeDraft({ ...command([allSections.FOOD]), requestId: 'CLIENT-ID' }),
    ).toThrowError(expect.objectContaining({ code: 'CLIENT_AUTHORITY_VIOLATION' }));
  });

  it('derives parent properties and never completes with a nonterminal required child', () => {
    const children = ['A', 'B'].map((componentId) => ({
      componentId,
      status: 'COMPLETED',
      ownerCommitteeId: 'COM_FOOD',
      ownerUserId: 'SYN-USER',
      attentionFlags: [],
    }));
    expect(deriveCompositeParentStatus(children)).toMatchObject({
      status: 'COMPLETED',
      progress: { completed: 2, active: 2 },
    });
    children[1].status = 'IN_PROGRESS';
    expect(deriveCompositeParentStatus(children).status).not.toBe('COMPLETED');
    children[1].status = 'REJECTED';
    expect(deriveCompositeParentStatus(children)).toMatchObject({
      status: 'PARTIALLY_FULFILLED',
      attentionFlags: ['HAS_REJECTED_SECTION'],
    });
  });

  it('supports independent lifecycle transitions and rejects an unsafe completion', () => {
    let child = { componentId: 'CMP-1', status: 'FOR_REVIEW', attentionFlags: [] };
    child = transitionCompositeChild(child, COMPOSITE_ACTIONS.ACCEPT);
    child = transitionCompositeChild(child, COMPOSITE_ACTIONS.START);
    expect(() => transitionCompositeChild(child, COMPOSITE_ACTIONS.COMPLETE)).toThrowError(
      expect.objectContaining({ code: 'INVALID_TRANSITION' }),
    );
    child = transitionCompositeChild(child, COMPOSITE_ACTIONS.PARTIALLY_FULFILL);
    child = transitionCompositeChild(child, COMPOSITE_ACTIONS.READY_FOR_HANDOFF);
    child = transitionCompositeChild(child, COMPOSITE_ACTIONS.COMPLETE);
    expect(child.status).toBe('COMPLETED');
  });

  it('recomputes Food attention on reopen and amendment', () => {
    const packet = createCompositePacket(command([allSections.FOOD]), {
      requestId: 'LREQ-2026-0002',
      componentIds: ['CMP-0002'],
      actor: 'SYN-ACTOR',
      now: '2026-07-14T00:00:00.000Z',
    });
    const cancelled = { ...packet.children[0], status: 'CANCELLED', attentionFlags: [] };
    const reopened = transitionCompositeChild(cancelled, COMPOSITE_ACTIONS.REOPEN);
    expect(reopened.attentionFlags).toContain('FOOD_COMPLETION_EVIDENCE_MISSING');
    const amended = amendCompositeSection(reopened, { label: 'Amended Food request' });
    expect(amended.attentionFlags).toEqual(
      expect.arrayContaining(['FOOD_COMPLETION_EVIDENCE_MISSING', 'AMENDED']),
    );
  });
});

describe('composite request mock workflow', () => {
  it('uses server time for public reference lookup and submission revision selection', async () => {
    const { service, getState } = serviceContext();
    const currentReference = getState().venueEquipmentReferences.find(
      (reference) => reference.id === 'SYN-VENUE-1',
    );
    const currentRoute = getState().venueEquipmentRoutes.find(
      (route) => route.id === 'SYN-ROUTE-VENUE',
    );
    currentReference.effectiveTo = '2098-12-31';
    currentRoute.effectiveTo = '2098-12-31';
    getState().venueEquipmentReferences.push({
      ...currentReference,
      name: 'Synthetic Future Assembly Room',
      aliases: ['Synthetic Future Meeting Room'],
      effectiveFrom: '2099-01-01',
      effectiveTo: '',
      revision: 2,
      sourceRevision: 'SYN-REFSET-2',
    });
    getState().venueEquipmentRoutes.push({
      ...currentRoute,
      effectiveFrom: '2099-01-01',
      effectiveTo: '',
      revision: 2,
      responsibleOfficeId: 'SYN-OFFICE-FACILITIES-FUTURE',
    });

    const lookup = await service.searchVenueEquipmentReferences({
      query: 'assembly',
      at: '2099-07-20T09:00:00+08:00',
    });
    expect(lookup.items).toEqual([
      expect.objectContaining({ id: 'SYN-VENUE-1', referenceRevision: 1 }),
    ]);

    const submitted = await service.submitCompositeRequest({
      ...command([allSections.VENUE_EQUIPMENT], 'SYN-SERVER-TIME'),
      submittedAt: '2099-07-20T09:00:00+08:00',
    });
    expect(submitted.request.children[0].payload.venueEquipment.referenceSnapshots[0]).toMatchObject({
      referenceRevision: 1,
      routeRevision: 1,
    });
  });

  it('is idempotent, atomic on validation failure, and exposes the hierarchy', async () => {
    const { service, getState } = serviceContext();
    const accepted = await service.submitCompositeRequest(command([allSections.FOOD, allSections.MATERIALS]));
    expect(accepted.request.children).toHaveLength(2);
    expect(getState().compositeRequests).toHaveLength(1);
    expect(getState().compositeComponents).toHaveLength(2);
    const replay = await service.submitCompositeRequest(command([allSections.FOOD, allSections.MATERIALS]));
    expect(replay.idempotentReplay).toBe(true);
    expect(getState().compositeRequests).toHaveLength(1);
    await expect(
      service.submitCompositeRequest(
        command([{ ...allSections.FOOD, lines: [{ label: '', quantity: 1, unit: 'piece' }] }], 'SYN-INVALID'),
      ),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' });
    expect(getState().compositeRequests).toHaveLength(1);
    expect(getState().compositeComponents).toHaveLength(2);
  });

  it('serializes concurrent submissions and preserves same-key replay semantics', async () => {
    const { service, getState } = serviceContext();
    const sameKey = await Promise.all([
      service.submitCompositeRequest(command([allSections.FOOD], 'SYN-CONCURRENT-SAME')),
      service.submitCompositeRequest(command([allSections.FOOD], 'SYN-CONCURRENT-SAME')),
    ]);
    expect(getState().compositeRequests).toHaveLength(1);
    expect(new Set(sameKey.map((result) => result.requestId))).toHaveLength(1);
    expect(sameKey.filter((result) => result.idempotentReplay)).toHaveLength(1);

    const differentKeys = await Promise.all([
      service.submitCompositeRequest(command([allSections.MATERIALS], 'SYN-CONCURRENT-A')),
      service.submitCompositeRequest(command([allSections.VENUE_EQUIPMENT], 'SYN-CONCURRENT-B')),
    ]);
    expect(getState().compositeRequests).toHaveLength(3);
    expect(new Set(differentKeys.map((result) => result.requestId))).toHaveLength(2);
  });

  it('supports review, amendment, add-section, cancellation, and reopen without orphaning children', async () => {
    const { service, getState } = serviceContext('COMMITTEE_HEAD');
    const created = await service.submitCompositeRequest(
      command([allSections.FOOD, allSections.MATERIALS], 'SYN-LIFECYCLE'),
    );
    const [food, materials] = created.request.children;
    await service.transitionCompositeComponent({
      requestId: created.requestId,
      componentId: food.componentId,
      action: 'ACCEPT',
      expectedRevision: 1,
      idempotencyKey: 'SYN-ACCEPT',
    });
    await service.amendCompositeRequest({
      requestId: created.requestId,
      componentId: food.componentId,
      section: { label: 'Amended meals', lines: [{ label: 'Packed meal', quantity: 12, unit: 'meal' }] },
      expectedRevision: 2,
      idempotencyKey: 'SYN-AMEND',
    });
    const added = await service.addCompositeSection({
      requestId: created.requestId,
      section: allSections.VENUE_EQUIPMENT,
      expectedParentRevision: 3,
      idempotencyKey: 'SYN-ADD',
    });
    expect(getState().compositeComponents).toHaveLength(3);
    await service.cancelCompositeRequest({
      requestId: created.requestId,
      reason: 'Synthetic cancellation',
      expectedRevisions: {
        [food.componentId]: 3,
        [materials.componentId]: 1,
        [added.componentId]: 1,
      },
      idempotencyKey: 'SYN-CANCEL',
    });
    expect(getState().compositeComponents.every((child) => child.status === 'CANCELLED')).toBe(true);
    const reopened = await service.reopenCompositeRequest({
      requestId: created.requestId,
      reason: 'Synthetic reopen',
      expectedRevisions: {
        [food.componentId]: 4,
        [materials.componentId]: 2,
        [added.componentId]: 2,
      },
      idempotencyKey: 'SYN-REOPEN',
    });
    expect(reopened.status).toBe('FOR_REVIEW');
    expect(getState().compositeComponents).toHaveLength(3);
    expect(getState().compositeComponents.map((child) => child.requestId)).toEqual([
      created.requestId,
      created.requestId,
      created.requestId,
    ]);
    expect(added.componentId).toBeTruthy();
    expect(materials.componentId).toBeTruthy();
  });

  it('denies component transitions to a requester and keeps assignment server-role bounded', async () => {
    const requester = serviceContext('REQUESTER');
    const created = await requester.service.submitCompositeRequest(command([allSections.FOOD], 'SYN-AUTH'));
    await expect(
      requester.service.transitionCompositeComponent({
        requestId: created.requestId,
        componentId: created.componentIds[0],
        action: 'ACCEPT',
        idempotencyKey: 'SYN-DENY',
      }),
    ).rejects.toMatchObject({ code: 'FORBIDDEN' });
    const head = serviceContext('COMMITTEE_HEAD');
    const owned = await head.service.submitCompositeRequest(command([allSections.FOOD], 'SYN-ASSIGN'));
    await expect(
      head.service.assignCompositeComponent({
        requestId: owned.requestId,
        componentId: owned.componentIds[0],
        userId: 'SYN-STAFF',
        expectedRevision: 1,
        idempotencyKey: 'SYN-ASSIGN-1',
      }),
    ).resolves.toMatchObject({ committeeId: 'COM_FOOD' });
    expect(can('REQUESTER', 'workflow.assign_staff')).toBe(false);
  });
});

describe('composite constants', () => {
  it('keeps exactly the three bounded section types', () => {
    expect(COMPOSITE_SECTION_TYPES).toEqual(['FOOD', 'MATERIALS', 'VENUE_EQUIPMENT']);
  });
});
