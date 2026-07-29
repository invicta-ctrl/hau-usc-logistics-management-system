import { describe, expect, it } from 'vitest';
import { canvassEvidenceLinks, canvassQualityIndicators } from '../../src/domain/canvass-quality.js';

describe('canvass quality presentation', () => {
  it('flags stale quotes, missing units, and linked-unit mismatches', () => {
    expect(
      canvassQualityIndicators(
        { checkedAt: '2026-05-01T00:00:00Z', unit: '' },
        { now: '2026-07-22T00:00:00Z', expectedUnits: ['piece'] },
      ).map((entry) => entry.code),
    ).toEqual(['STALE_QUOTE', 'MISSING_UNIT']);
    expect(
      canvassQualityIndicators(
        { checkedAt: '2026-07-21T00:00:00Z', unit: 'box' },
        { now: '2026-07-22T00:00:00Z', expectedUnits: ['piece'] },
      ),
    ).toContainEqual(expect.objectContaining({ code: 'UNIT_MISMATCH' }));
  });

  it('returns only safe, unique evidence and source links', () => {
    expect(
      canvassEvidenceLinks(
        { sourceUrl: 'javascript:alert(1)' },
        { url: 'https://drive.example.invalid/quote' },
      ),
    ).toEqual([
      {
        kind: 'evidence',
        label: 'Open evidence',
        url: 'https://drive.example.invalid/quote',
      },
    ]);
    expect(
      canvassEvidenceLinks(
        { sourceUrl: 'https://example.invalid/quote' },
        { url: 'https://example.invalid/quote' },
      ),
    ).toHaveLength(1);
  });
});
