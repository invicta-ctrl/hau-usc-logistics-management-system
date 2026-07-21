import { describe, expect, it } from 'vitest';
import {
  assertVenueEquipmentTransition,
  buildVenueEquipmentQueueItem,
  normalizeVenueEquipmentDetails,
  searchVenueEquipmentReferences,
  updateVenueEquipmentWorkflow,
  venueEquipmentAttentionFlags,
} from '../../src/domain/venue-equipment-workflow.js';

const routes = [
  {
    id: 'SYN-ROUTE-VENUE',
    matchKind: 'REFERENCE',
    referenceId: 'SYN-VENUE-1',
    ownerCommitteeId: 'COM_INVENTORY_PANTRY',
    ownerUserId: '',
    responsibleOfficeId: 'SYN-OFFICE-FACILITIES',
    approvingAuthorityId: 'SYN-AUTH-FACILITIES',
    leadTimeBusinessDays: 5,
    instructions: 'Submit the synthetic setup plan for review.',
    effectiveFrom: '2026-01-01',
    effectiveTo: '',
    revision: 3,
    status: 'ACTIVE',
  },
  {
    id: 'SYN-ROUTE-EQUIPMENT',
    matchKind: 'REFERENCE',
    referenceId: 'SYN-EQUIP-1',
    ownerCommitteeId: 'COM_INVENTORY_PANTRY',
    ownerUserId: '',
    responsibleOfficeId: 'SYN-OFFICE-INVENTORY',
    approvingAuthorityId: 'SYN-AUTH-INVENTORY',
    leadTimeBusinessDays: 3,
    instructions: 'Confirm the synthetic handoff and return plan.',
    effectiveFrom: '2026-01-01',
    effectiveTo: '',
    revision: 2,
    status: 'ACTIVE',
  },
  {
    id: 'SYN-ROUTE-OTHER',
    matchKind: 'OTHER',
    ownerCommitteeId: 'COM_INVENTORY_PANTRY',
    ownerUserId: '',
    responsibleOfficeId: 'SYN-OFFICE-TRIAGE',
    approvingAuthorityId: 'SYN-AUTH-TRIAGE',
    leadTimeBusinessDays: 5,
    instructions: 'Classify the synthetic Other request before handoff.',
    effectiveFrom: '2026-01-01',
    effectiveTo: '',
    revision: 1,
    status: 'ACTIVE',
  },
];

const references = [
  {
    id: 'SYN-VENUE-1',
    type: 'VENUE',
    category: 'MEETING_SPACE',
    name: 'Synthetic Assembly Room',
    aliases: ['Synthetic Meeting Room'],
    location: 'Synthetic Campus',
    unit: 'service',
    requestability: 'REQUESTABLE',
    contactRole: 'Facilities coordinator',
    routeId: 'SYN-ROUTE-VENUE',
    returnRequired: false,
    effectiveFrom: '2026-01-01',
    effectiveTo: '',
    revision: 4,
    sourceRevision: 'SYN-REFSET-1',
    status: 'ACTIVE',
  },
  {
    id: 'SYN-EQUIP-1',
    type: 'EQUIPMENT',
    category: 'AUDIO_VISUAL',
    name: 'Synthetic Projector Set',
    aliases: ['Synthetic AV Set'],
    location: '',
    unit: 'set',
    requestability: 'REQUESTABLE',
    contactRole: 'Inventory custodian',
    routeId: 'SYN-ROUTE-EQUIPMENT',
    returnRequired: true,
    effectiveFrom: '2026-01-01',
    effectiveTo: '',
    revision: 2,
    sourceRevision: 'SYN-REFSET-1',
    status: 'ACTIVE',
  },
];

const context = (overrides = {}) => ({
  submittedAt: '2026-07-15T09:00:00+08:00',
  eventStartAt: '2026-08-08T09:00:00+08:00',
  eventEndAt: '2026-08-08T17:00:00+08:00',
  resolveVenueEquipmentReference: (id) => references.find((reference) => reference.id === id),
  resolveVenueEquipmentRoute: (id) => routes.find((route) => route.id === id),
  resolveVenueEquipmentOtherRoute: () => routes.find((route) => route.matchKind === 'OTHER'),
  ...overrides,
});

const details = {
  purposeDetail: 'Synthetic event setup and audiovisual support',
};

const venueLine = {
  referenceId: 'SYN-VENUE-1',
  referenceRevision: 4,
  label: 'Synthetic Assembly Room',
  quantity: 1,
  unit: 'service',
  category: 'MEETING_SPACE',
  notes: '',
};

const equipmentLine = {
  referenceId: 'SYN-EQUIP-1',
  referenceRevision: 2,
  label: 'Synthetic Projector Set',
  quantity: 2,
  unit: 'set',
  category: 'AUDIO_VISUAL',
  notes: '',
};

describe('Venue and Equipment reference workflow', () => {
  it('returns bounded safe requestable lookup results with truthful wording', () => {
    const results = searchVenueEquipmentReferences(references, {
      query: 'meeting',
      at: '2026-07-15T09:00:00+08:00',
      resolveRoute: (id) => routes.find((route) => route.id === id),
    });
    expect(results).toEqual([
      expect.objectContaining({
        id: 'SYN-VENUE-1',
        type: 'VENUE',
        requestability: 'REQUESTABLE',
        requestabilityLabel: expect.stringContaining('not a booking guarantee'),
      }),
    ]);
    expect(results[0]).not.toHaveProperty('ownerCommitteeId');
    expect(results[0]).not.toHaveProperty('ownerUserId');
    expect(results[0]).not.toHaveProperty('contactRole');
  });

  it('selects one effective stable-ID revision and rejects overlapping active revisions', () => {
    const current = { ...references[0], effectiveTo: '2026-12-31' };
    const future = {
      ...references[0],
      name: 'Synthetic Assembly Room Future Revision',
      aliases: ['Synthetic Future Meeting Room'],
      effectiveFrom: '2027-01-01',
      effectiveTo: '',
      revision: 5,
    };
    const results = searchVenueEquipmentReferences([current, future], {
      query: 'meeting',
      at: '2026-07-15T09:00:00+08:00',
      resolveRoute: (id) => routes.find((route) => route.id === id),
    });
    expect(results).toEqual([
      expect.objectContaining({ id: 'SYN-VENUE-1', referenceRevision: 4 }),
    ]);

    expect(() =>
      searchVenueEquipmentReferences([references[0], { ...references[0], revision: 5 }], {
        at: '2026-07-15T09:00:00+08:00',
        resolveRoute: (id) => routes.find((route) => route.id === id),
      }),
    ).toThrowError(expect.objectContaining({ code: 'VENUE_EQUIPMENT_REFERENCE_CONFLICT' }));
  });

  it('fails closed on duplicate active names or aliases', () => {
    expect(() =>
      searchVenueEquipmentReferences(
        [references[0], { ...references[1], aliases: ['Synthetic Meeting Room'] }],
        {
          at: '2026-07-15T09:00:00+08:00',
          resolveRoute: (id) => routes.find((route) => route.id === id),
        },
      ),
    ).toThrowError(expect.objectContaining({ code: 'VENUE_EQUIPMENT_ALIAS_CONFLICT' }));
  });

  it('persists immutable reference and route revisions without a booking claim', () => {
    const result = normalizeVenueEquipmentDetails(details, [venueLine, equipmentLine], context());
    expect(result).toMatchObject({
      version: 1,
      ownerCommitteeId: 'COM_INVENTORY_PANTRY',
      confirmationStatus: 'PENDING_CONFIRMATION',
      otherTriageStatus: 'NOT_REQUIRED',
      returnRequired: true,
      returnStatus: 'PENDING_RETURN',
      referenceSnapshots: [
        {
          referenceId: 'SYN-VENUE-1',
          referenceRevision: 4,
          routeId: 'SYN-ROUTE-VENUE',
          routeRevision: 3,
          requestedQuantity: 1,
        },
        {
          referenceId: 'SYN-EQUIP-1',
          referenceRevision: 2,
          routeId: 'SYN-ROUTE-EQUIPMENT',
          routeRevision: 2,
          requestedQuantity: 2,
          returnRequired: true,
        },
      ],
    });
    expect(JSON.stringify(result)).toContain('not a booking guarantee');
    expect(venueEquipmentAttentionFlags(result)).toEqual(
      expect.arrayContaining([
        'VENUE_EQUIPMENT_CONFIRMATION_PENDING',
        'VENUE_EQUIPMENT_RETURN_PENDING',
        'VENUE_EQUIPMENT_EVIDENCE_MISSING',
      ]),
    );
  });

  it('rejects inactive, not-requestable, stale-revision, wrong-unit, and wrong-category references', () => {
    for (const overrides of [
      { status: 'ARCHIVED' },
      { requestability: 'NOT_REQUESTABLE' },
    ])
      expect(() =>
        normalizeVenueEquipmentDetails(details, [venueLine],
          context({
            resolveVenueEquipmentReference: () => ({ ...references[0], ...overrides }),
          }),
        ),
      ).toThrowError(
        expect.objectContaining({
          code:
            overrides.status === 'ARCHIVED'
              ? 'VENUE_EQUIPMENT_REFERENCE_INACTIVE'
              : 'VENUE_EQUIPMENT_NOT_REQUESTABLE',
        }),
      );
    expect(() =>
      normalizeVenueEquipmentDetails(details, [{ ...venueLine, referenceRevision: 3 }], context()),
    ).toThrowError(
      expect.objectContaining({ code: 'VENUE_EQUIPMENT_REFERENCE_REVISION_CONFLICT' }),
    );
    expect(() =>
      normalizeVenueEquipmentDetails(details, [{ ...venueLine, unit: 'piece' }], context()),
    ).toThrowError(expect.objectContaining({ code: 'VENUE_EQUIPMENT_UNIT_MISMATCH' }));
    expect(() =>
      normalizeVenueEquipmentDetails(details, [{ ...venueLine, category: 'EVENT_SPACE' }], context()),
    ).toThrowError(expect.objectContaining({ code: 'VENUE_EQUIPMENT_CATEGORY_MISMATCH' }));
  });

  it('rejects routes outside the three approved permanent committees', () => {
    expect(() =>
      normalizeVenueEquipmentDetails(
        details,
        [venueLine],
        context({
          resolveVenueEquipmentRoute: () => ({ ...routes[0], ownerCommitteeId: 'COM_VENUE' }),
        }),
      ),
    ).toThrowError(expect.objectContaining({ code: 'VENUE_EQUIPMENT_ROUTE_SCOPE_INVALID' }));
  });

  it('keeps constrained Other visible and requires one explicit triage route', () => {
    const result = normalizeVenueEquipmentDetails(
      details,
      [
        {
          referenceId: '',
          label: 'Synthetic specialty setup',
          quantity: 1,
          unit: 'service',
          category: 'OTHER_CONTROLLED',
          notes: 'Synthetic constrained Other',
        },
      ],
      context(),
    );
    expect(result).toMatchObject({
      ownerCommitteeId: 'COM_INVENTORY_PANTRY',
      otherTriageStatus: 'PENDING_CLASSIFICATION',
      referenceSnapshots: [
        {
          referenceType: 'OTHER',
          requestability: 'PENDING_CLASSIFICATION',
          routeId: 'SYN-ROUTE-OTHER',
        },
      ],
    });
    expect(() =>
      normalizeVenueEquipmentDetails(details, [{ ...venueLine, referenceId: '', category: 'MEETING_SPACE' }], context()),
    ).toThrowError(expect.objectContaining({ code: 'VENUE_EQUIPMENT_REFERENCE_REQUIRED' }));
  });

  it('fails closed when one child resolves to multiple committee routes', () => {
    expect(() =>
      normalizeVenueEquipmentDetails(
        details,
        [venueLine, equipmentLine],
        context({
          resolveVenueEquipmentRoute: (id) => {
            const route = routes.find((entry) => entry.id === id);
            return id === 'SYN-ROUTE-EQUIPMENT'
              ? { ...route, ownerCommitteeId: 'COM_MATERIALS' }
              : route;
          },
        }),
      ),
    ).toThrowError(expect.objectContaining({ code: 'VENUE_EQUIPMENT_ROUTE_CONFLICT' }));
  });

  it('preserves operational decisions and archives prior snapshots on amendment normalization', () => {
    const initial = normalizeVenueEquipmentDetails(details, [venueLine], context());
    const decided = updateVenueEquipmentWorkflow(initial, {
      confirmationStatus: 'CONFIRMED',
      confirmationReference: 'SYN-CONFIRM-1',
      fulfillmentEvidenceId: 'SYN-EVIDENCE-1',
    });
    const amended = normalizeVenueEquipmentDetails(
      { ...details, purposeDetail: 'Amended synthetic setup' },
      [{ ...venueLine, quantity: 2 }],
      context({ existingVenueEquipment: decided }),
    );
    expect(amended).toMatchObject({
      confirmationStatus: 'CONFIRMED',
      confirmationReference: 'SYN-CONFIRM-1',
      fulfillmentEvidenceId: 'SYN-EVIDENCE-1',
      referenceSnapshots: [{ requestedQuantity: 2 }],
      provenanceHistory: [{ version: 1, referenceSnapshots: [{ requestedQuantity: 1 }] }],
    });
  });

  it('rechecks confirmation, Other, blockers, returns, and evidence at transitions', () => {
    let result = normalizeVenueEquipmentDetails(details, [equipmentLine], context());
    expect(() => assertVenueEquipmentTransition(result, 'READY_FOR_HANDOFF')).toThrowError(
      expect.objectContaining({ code: 'VENUE_EQUIPMENT_CONFIRMATION_REQUIRED' }),
    );
    result = updateVenueEquipmentWorkflow(result, {
      confirmationStatus: 'CONFIRMED',
      confirmationReference: 'SYN-CONFIRM-2',
      fulfillmentEvidenceId: 'SYN-EVIDENCE-2',
    });
    expect(assertVenueEquipmentTransition(result, 'READY_FOR_HANDOFF')).toBe(true);
    expect(() => assertVenueEquipmentTransition(result, 'COMPLETE', { evidenceUploaded: true })).toThrowError(
      expect.objectContaining({ code: 'VENUE_EQUIPMENT_RETURN_REQUIRED' }),
    );
    result = updateVenueEquipmentWorkflow(result, { returnStatus: 'RETURNED' });
    expect(() => assertVenueEquipmentTransition(result, 'COMPLETE')).toThrowError(
      expect.objectContaining({ code: 'VENUE_EQUIPMENT_EVIDENCE_REQUIRED' }),
    );
    expect(assertVenueEquipmentTransition(result, 'COMPLETE', { evidenceUploaded: true })).toBe(true);
    result = updateVenueEquipmentWorkflow(result, {
      blockerStatus: 'BLOCKED',
      blockerReason: 'Synthetic late blocker',
    });
    expect(() => assertVenueEquipmentTransition(result, 'COMPLETE', { evidenceUploaded: true })).toThrowError(
      expect.objectContaining({ code: 'VENUE_EQUIPMENT_BLOCKED' }),
    );
  });

  it('builds a safe scoped queue projection', () => {
    const result = normalizeVenueEquipmentDetails(details, [venueLine], context());
    const item = buildVenueEquipmentQueueItem(
      {
        requestId: 'SYN-REQ-1',
        eventId: 'SYN-EVENT-1',
        eventName: 'Synthetic Event',
        eventStartAt: '2026-08-08T09:00:00+08:00',
        purpose: 'Synthetic purpose',
        department: 'Synthetic Department',
      },
      {
        componentId: 'SYN-CMP-1',
        componentType: 'VENUE_EQUIPMENT',
        ownerCommitteeId: 'COM_INVENTORY_PANTRY',
        status: 'FOR_REVIEW',
        revision: 2,
        payload: { venueEquipment: result, lines: result.lines },
      },
    );
    expect(item).toMatchObject({
      ownerCommitteeId: 'COM_INVENTORY_PANTRY',
      parent: { eventName: 'Synthetic Event' },
    });
    expect(item.parent).not.toHaveProperty('requesterEmail');
  });
});
