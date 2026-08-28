import { describe, expect, it } from 'vitest';
import { classifyLiveBindingIsolation } from '../../scripts/playground/audit-live-binding-isolation.mjs';

function version({ d1, brand, evidence }) {
  return {
    resources: {
      bindings: [
        { name: 'DB', type: 'd1', database_id: d1 },
        { name: 'BRAND_ASSETS', type: 'r2_bucket', bucket_name: brand },
        { name: 'EVIDENCE_ASSETS', type: 'r2_bucket', bucket_name: evidence },
      ],
    },
  };
}

describe('live Playground binding isolation audit', () => {
  const production = version({
    d1: 'production-d1',
    brand: 'production-brand',
    evidence: 'production-evidence',
  });

  it('reports only safe classification facts for a complete distinct staging tuple', () => {
    expect(
      classifyLiveBindingIsolation(
        version({ d1: 'staging-d1', brand: 'staging-brand', evidence: 'staging-evidence' }),
        production,
      ),
    ).toEqual({
      valid: true,
      classification: 'ISOLATED_STAGING_WORKING_D1_R2',
      staging: { d1Bound: true, brandR2Bound: true, evidenceR2Bound: true },
      productionComparisonAvailable: true,
      productionCrossover: false,
    });
  });

  it('fails closed on a missing binding or any corresponding Production crossover', () => {
    expect(
      classifyLiveBindingIsolation(
        version({ d1: 'production-d1', brand: 'staging-brand', evidence: '' }),
        production,
      ),
    ).toEqual({
      valid: false,
      classification: 'ISOLATED_STAGING_WORKING_D1_R2',
      staging: { d1Bound: true, brandR2Bound: true, evidenceR2Bound: false },
      productionComparisonAvailable: true,
      productionCrossover: true,
    });
  });
});
