import { describe, expect, it } from 'vitest';
import { amendCompositeSection } from '../../src/domain/composite-requests.js';
import {
  assertMaterialsTransition,
  buildMaterialsQueueItem,
  materialsAttentionFlags,
  normalizeMaterialsDetails,
  updateMaterialsWorkflow,
} from '../../src/domain/materials-workflow.js';

const line = {
  referenceId: 'SYN-MAT-1',
  label: 'Directional Sign',
  quantity: 4,
  unit: 'piece',
  category: 'PRINTING_SIGNAGE',
  notes: 'Synthetic fixture',
};
const details = {
  materialCategory: 'PRINTING_SIGNAGE',
  specification: 'A3 directional sign with approved event wording',
  requiredBy: '2026-08-08',
  usagePurpose: 'Synthetic event wayfinding',
  sourcingPreference: 'STOCK_REVIEW',
};
const reference = {
  id: 'SYN-MAT-1',
  name: 'Directional Sign',
  unit: 'piece',
  status: 'ACTIVE',
  category: 'PRINTING_SIGNAGE',
  legacySourceSheet: 'SYNTHETIC SOURCE',
  legacySourceRow: '12',
  legacySourceBlock: 'A-C',
  legacySourceName: 'Directional Sign',
  legacySourceQuantity: 18,
  legacySourceUnit: 'piece',
};
const normalize = (overrides = {}, lineOverrides = {}, referenceOverrides = {}) =>
  normalizeMaterialsDetails(
    { ...details, ...overrides },
    [{ ...line, ...lineOverrides }],
    { resolveMaterialReference: () => ({ ...reference, ...referenceOverrides }) },
  );

describe('Materials workflow domain', () => {
  it('preserves exact quantity, unit, name, and legacy provenance in a versioned snapshot', () => {
    const materials = normalize();
    expect(materials).toMatchObject({
      version: 1,
      materialCategory: 'PRINTING_SIGNAGE',
      fulfillmentPath: 'PENDING_DECISION',
      substitutionPolicy: 'EXACT_ONLY',
      lineSnapshots: [
        {
          referenceId: 'SYN-MAT-1',
          catalogName: 'Directional Sign',
          catalogUnit: 'piece',
          sourceCategory: 'PRINTING_SIGNAGE',
          sourceName: 'Directional Sign',
          sourceQuantity: 18,
          requestedQuantity: 4,
          sourceUnit: 'piece',
          sourceSheet: 'SYNTHETIC SOURCE',
          sourceRow: '12',
          sourceBlock: 'A-C',
        },
      ],
    });
    expect(materialsAttentionFlags(materials)).toEqual(
      expect.arrayContaining([
        'MATERIALS_FULFILLMENT_PATH_PENDING',
        'MATERIALS_COMPLETION_EVIDENCE_MISSING',
      ]),
    );
  });

  it('blocks VERIFY, every non-ACTIVE status, renamed, recategorized, and unit-converted references', () => {
    expect(() => normalize({}, {}, { status: 'VERIFY' })).toThrowError(
      expect.objectContaining({ code: 'MATERIAL_VERIFY_BLOCKED' }),
    );
    for (const status of ['', 'IN_STOCK', 'LOW_STOCK', 'OUT_OF_STOCK', 'ARCHIVED'])
      expect(() => normalize({}, {}, { status })).toThrowError(
        expect.objectContaining({ code: 'MATERIAL_REFERENCE_INACTIVE' }),
      );
    expect(() => normalize({}, { label: 'Renamed material' })).toThrowError(
      expect.objectContaining({ code: 'MATERIAL_SOURCE_NAME_MISMATCH' }),
    );
    expect(() => normalize({}, { unit: 'box' })).toThrowError(
      expect.objectContaining({ code: 'MATERIAL_UNIT_MISMATCH' }),
    );
    expect(() => normalize({}, {}, { category: 'OFFICE_SUPPLIES' })).toThrowError(
      expect.objectContaining({ code: 'MATERIAL_CATEGORY_MISMATCH' }),
    );
  });

  it('validates controlled category, unit, quantity-adjacent fields, and constrained Other', () => {
    expect(() => normalize({ materialCategory: 'PANTRY_FOOD' })).toThrowError(
      expect.objectContaining({ code: 'VALIDATION_ERROR' }),
    );
    expect(() => normalize({}, { unit: 'pallet' })).toThrowError(
      expect.objectContaining({ code: 'VALIDATION_ERROR' }),
    );
    expect(() =>
      normalize(
        { materialCategory: 'OTHER_CONTROLLED', specification: 'x' },
        { category: 'OTHER_CONTROLLED' },
        { category: 'OTHER_CONTROLLED' },
      ),
    ).toThrowError(expect.objectContaining({ code: 'VALIDATION_ERROR' }));
  });

  it('records one authoritative fulfillment path and requires explicit substitution approval', () => {
    const materials = normalize();
    expect(() =>
      updateMaterialsWorkflow(materials, {
        substitutionPolicy: 'APPROVED_SUBSTITUTION',
        approvedSubstitutionReferenceId: 'SYN-MAT-2',
      }),
    ).toThrowError(expect.objectContaining({ code: 'VALIDATION_ERROR' }));
    const updated = updateMaterialsWorkflow(materials, {
      fulfillmentPath: 'STOCK_ISSUE',
      substitutionPolicy: 'APPROVED_SUBSTITUTION',
      approvedSubstitutionReferenceId: 'SYN-MAT-2',
      substitutionReason: 'Approved equivalent finish for the same specification',
      blockerStatus: 'NONE',
      fulfillmentEvidenceId: 'SYN-EVIDENCE-1',
    });
    expect(updated).toMatchObject({
      fulfillmentPath: 'STOCK_ISSUE',
      substitutionPolicy: 'APPROVED_SUBSTITUTION',
      approvedSubstitutionReferenceId: 'SYN-MAT-2',
    });
    expect(() => updateMaterialsWorkflow(updated, { substitutionPolicy: 'EXACT_ONLY' })).toThrowError(
      expect.objectContaining({ code: 'VALIDATION_ERROR' }),
    );
    expect(() =>
      updateMaterialsWorkflow(
        materials,
        {
          substitutionPolicy: 'APPROVED_SUBSTITUTION',
          approvedSubstitutionReferenceId: 'SYN-MAT-2',
          substitutionReason: 'Synthetic approved equivalent',
        },
        { resolveMaterialReference: () => ({ ...reference, id: 'SYN-MAT-2', status: 'VERIFY' }) },
      ),
    ).toThrowError(expect.objectContaining({ code: 'MATERIAL_VERIFY_BLOCKED' }));
  });

  it('preserves workflow decisions and archives immutable provenance across amendments', () => {
    const initial = normalize();
    const decided = updateMaterialsWorkflow(initial, {
      fulfillmentPath: 'STOCK_ISSUE',
      substitutionPolicy: 'APPROVED_SUBSTITUTION',
      approvedSubstitutionReferenceId: 'SYN-MAT-2',
      substitutionReason: 'Synthetic authorized equivalent',
      blockerStatus: 'BLOCKED',
      blockerReason: 'Synthetic pending confirmation',
      fulfillmentEvidenceId: 'SYN-EVIDENCE-1',
    });
    const amended = amendCompositeSection(
      {
        componentType: 'MATERIALS',
        label: 'Materials',
        status: 'IN_PROGRESS',
        revision: 3,
        relationshipVersion: 1,
        attentionFlags: ['MATERIALS_FULFILLMENT_PATH_PENDING', 'ESCALATED'],
        payload: { lines: initial.lines, materials: decided },
      },
      { lines: [{ ...line, quantity: 6 }], materials: { specification: 'Amended sign wording' } },
      {
        now: '2026-07-20T10:00:00.000Z',
        resolveMaterialReference: () => ({ ...reference, legacySourceQuantity: 999 }),
      },
    );
    expect(amended.payload.materials).toMatchObject({
      fulfillmentPath: 'STOCK_ISSUE',
      substitutionPolicy: 'APPROVED_SUBSTITUTION',
      approvedSubstitutionReferenceId: 'SYN-MAT-2',
      substitutionReason: 'Synthetic authorized equivalent',
      blockerStatus: 'BLOCKED',
      blockerReason: 'Synthetic pending confirmation',
      fulfillmentEvidenceId: 'SYN-EVIDENCE-1',
      lineSnapshots: [{ requestedQuantity: 6, sourceQuantity: 18 }],
      provenanceHistory: [{ version: 1, lineSnapshots: [{ requestedQuantity: 4 }] }],
    });
    expect(amended.attentionFlags).toEqual(
      expect.arrayContaining(['MATERIALS_BLOCKED', 'ESCALATED', 'AMENDED']),
    );
    expect(amended.attentionFlags).not.toContain('MATERIALS_FULFILLMENT_PATH_PENDING');
  });

  it('blocks handoff on undecided/blocked work and completion without matching uploaded evidence', () => {
    let materials = normalize();
    expect(() => assertMaterialsTransition(materials, 'READY_FOR_HANDOFF')).toThrowError(
      expect.objectContaining({ code: 'MATERIALS_FULFILLMENT_PATH_REQUIRED' }),
    );
    materials = updateMaterialsWorkflow(materials, {
      fulfillmentPath: 'PROCUREMENT_RECEIPT',
      blockerStatus: 'BLOCKED',
      blockerReason: 'Synthetic budget hold',
    });
    expect(() => assertMaterialsTransition(materials, 'READY_FOR_HANDOFF')).toThrowError(
      expect.objectContaining({ code: 'MATERIALS_BLOCKED' }),
    );
    materials = updateMaterialsWorkflow(materials, {
      blockerStatus: 'NONE',
      fulfillmentEvidenceId: 'SYN-EVIDENCE-2',
    });
    expect(assertMaterialsTransition(materials, 'READY_FOR_HANDOFF')).toBe(true);
    expect(() => assertMaterialsTransition(materials, 'COMPLETE')).toThrowError(
      expect.objectContaining({ code: 'MATERIALS_COMPLETION_EVIDENCE_REQUIRED' }),
    );
    expect(assertMaterialsTransition(materials, 'COMPLETE', { evidenceUploaded: true })).toBe(true);
    materials = updateMaterialsWorkflow(materials, {
      blockerStatus: 'BLOCKED',
      blockerReason: 'Synthetic late blocker',
    });
    expect(() => assertMaterialsTransition(materials, 'COMPLETE', { evidenceUploaded: true })).toThrowError(
      expect.objectContaining({ code: 'MATERIALS_BLOCKED' }),
    );
  });

  it('builds a Materials-only queue projection with bounded parent context', () => {
    const materials = normalize();
    const item = buildMaterialsQueueItem(
      {
        requestId: 'SYN-REQ-1',
        eventId: 'SYN-EVENT-1',
        eventName: 'Synthetic Event',
        purpose: 'Synthetic purpose',
        department: 'Synthetic Department',
      },
      {
        componentId: 'SYN-CMP-1',
        componentType: 'MATERIALS',
        status: 'FOR_REVIEW',
        revision: 2,
        payload: { materials, lines: materials.lines },
      },
    );
    expect(item).toMatchObject({
      requestId: 'SYN-REQ-1',
      componentId: 'SYN-CMP-1',
      ownerCommitteeId: 'COM_MATERIALS',
      parent: { eventName: 'Synthetic Event', department: 'Synthetic Department' },
    });
    expect(item.parent).not.toHaveProperty('requesterEmail');
  });
});
