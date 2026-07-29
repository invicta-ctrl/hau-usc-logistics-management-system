import { describe, expect, it } from 'vitest';
import { requireRecipientConfirmation } from '../../src/domain/release.js';

describe('release confirmation', () => {
  it('accepts only an explicit recipient attestation', () => {
    expect(requireRecipientConfirmation(true)).toBe(true);
    expect(requireRecipientConfirmation('true')).toBe(true);
    expect(() => requireRecipientConfirmation(false)).toThrowError(
      expect.objectContaining({ code: 'RECIPIENT_CONFIRMATION_REQUIRED' }),
    );
  });
});
