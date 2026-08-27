import { describe, expect, it } from 'vitest';
import { createEvidencePlaceholder } from '../../scripts/playground/evidence-placeholders.mjs';

describe('playground evidence placeholders', () => {
  it('creates a non-private placeholder for a sanitized evidence key', () => {
    const result = createEvidencePlaceholder('playground-redacted/0123456789abcdef01234567');

    expect(result.key).toBe('playground-redacted/0123456789abcdef01234567');
    expect(JSON.parse(result.body)).toEqual({
      playgroundRedacted: true,
      classification: 'PRIVATE_EVIDENCE_EXCLUDED',
    });
  });

  it('rejects unsanitized or traversal-like object keys', () => {
    expect(() => createEvidencePlaceholder('production/private.pdf')).toThrow(/unsafe object key/u);
    expect(() => createEvidencePlaceholder('../private')).toThrow(/unsafe object key/u);
  });
});
