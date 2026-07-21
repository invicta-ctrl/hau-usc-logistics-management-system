import { describe, expect, it } from 'vitest';
import {
  assertFoodTransition,
  deriveFoodLeadTime,
  foodAttentionFlags,
  normalizeFoodDetails,
  updateFoodWorkflow,
} from '../../src/domain/food-workflow.js';

const base = {
  serviceClass: 'PERISHABLE_FOOD',
  expectedHeadcount: 25,
  requiredServings: 30,
  serviceStartAt: '2026-08-10T12:00:00+08:00',
  serviceLocation: 'Synthetic service area',
  dietarySummary: 'ATTENTION_REQUIRED',
  dietaryAttentionServings: 3,
  sourcingMode: 'CANVASS_REQUIRED',
  sourceReference: '',
};

describe('Food workflow domain', () => {
  it('normalizes the controlled minimal payload and keeps headcount distinct from servings', () => {
    const food = normalizeFoodDetails(base, { submittedAt: '2026-08-03T09:00:00+08:00' });
    expect(food).toMatchObject({
      version: 1,
      expectedHeadcount: 25,
      requiredServings: 30,
      sourcingStatus: 'PENDING_CANVASS',
      leadTime: { requiredDays: 5, status: 'MET' },
    });
    expect(foodAttentionFlags(food)).toEqual(
      expect.arrayContaining(['FOOD_SOURCING_PENDING', 'FOOD_COMPLETION_EVIDENCE_MISSING']),
    );
  });

  it('rejects person-level dietary/medical data and inconsistent aggregates', () => {
    expect(() => normalizeFoodDetails({ ...base, dietaryNarrative: 'Named medical detail' })).toThrowError(
      expect.objectContaining({ code: 'SENSITIVE_DATA_NOT_ALLOWED' }),
    );
    expect(() =>
      normalizeFoodDetails({ ...base, dietarySummary: 'NONE_REPORTED', dietaryAttentionServings: 2 }),
    ).toThrowError(expect.objectContaining({ code: 'VALIDATION_ERROR' }));
  });

  it('applies the recorded one- and two-week business-day policies', () => {
    expect(
      deriveFoodLeadTime({
        serviceClass: 'PERISHABLE_FOOD',
        submittedAt: '2026-08-03T09:00:00+08:00',
        serviceStartAt: '2026-08-10T09:00:00+08:00',
      }),
    ).toMatchObject({ status: 'MET', requiredDays: 5, actualDays: 5 });
    expect(
      deriveFoodLeadTime({
        serviceClass: 'BULK_NON_PERISHABLE_OR_CATERING',
        submittedAt: '2026-08-03T09:00:00+08:00',
        serviceStartAt: '2026-08-10T09:00:00+08:00',
      }),
    ).toMatchObject({ status: 'SHORT', requiredDays: 10, shortBy: 5 });
  });

  it('blocks handoff until sourcing/dietary confirmation and completion until uploaded evidence', () => {
    let food = normalizeFoodDetails(
      { ...base, dietarySummary: 'PENDING_CONFIRMATION', dietaryAttentionServings: 0 },
      { submittedAt: '2026-08-03T09:00:00+08:00' },
    );
    expect(() => assertFoodTransition(food, 'READY_FOR_HANDOFF')).toThrowError(
      expect.objectContaining({ code: 'FOOD_DIETARY_CONFIRMATION_REQUIRED' }),
    );
    food = updateFoodWorkflow(food, {
      dietarySummary: 'NONE_REPORTED',
      dietaryAttentionServings: 0,
      sourcingStatus: 'CONFIRMED',
      completionEvidenceId: 'SYN-EVIDENCE-1',
    });
    expect(assertFoodTransition(food, 'READY_FOR_HANDOFF')).toBe(true);
    expect(() => assertFoodTransition(food, 'COMPLETE')).toThrowError(
      expect.objectContaining({ code: 'FOOD_COMPLETION_EVIDENCE_REQUIRED' }),
    );
    expect(assertFoodTransition(food, 'COMPLETE', { evidenceUploaded: true })).toBe(true);
  });

  it('rejects sourcing states that belong to another sourcing mode', () => {
    const food = normalizeFoodDetails(base, { submittedAt: '2026-08-03T09:00:00+08:00' });
    expect(() => updateFoodWorkflow(food, { sourcingStatus: 'PENDING_STOCK_REVIEW' })).toThrowError(
      expect.objectContaining({ code: 'VALIDATION_ERROR' }),
    );
  });
});
