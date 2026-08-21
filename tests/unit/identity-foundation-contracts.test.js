import { describe, expect, it } from 'vitest';
import {
  ACCOUNT_STAFF_LINK_STATE,
  PERSON_EMAIL_STATE,
  PERSON_EMAIL_VERIFICATION_STATE,
  STAFF_ASSIGNMENT_STATE,
  createCanonicalPersonId,
  normalizeEmailForMatching,
  validateAccountStaffLink,
  validateCanonicalPerson,
  validatePersonEmail,
  validateStaffAssignment,
} from '../../src/server/identity-foundation/contracts.js';

const canonicalPersonId = 'PER-123E4567-E89B-42D3-A456-426614174000';

describe('canonical identity foundation contracts', () => {
  it('creates an opaque person identifier and normalizes email only for matching', () => {
    expect(createCanonicalPersonId(() => '123e4567-e89b-42d3-a456-426614174000')).toBe(
      'PER-123E4567-E89B-42D3-A456-426614174000',
    );
    expect(normalizeEmailForMatching(' Person.Example@Students.Example.Test ')).toBe(
      'person.example@students.example.test',
    );
  });

  it('rejects a noncanonical person identifier before repository mutation', () => {
    expect(() =>
      validateCanonicalPerson({
        personId: 'PER-123E4567-E89B-Z2D3-A456-426614174000',
        createdAt: '2026-08-14T00:00:00.000Z',
      }),
    ).toThrow(/personId/i);
  });

  it('requires a protected email envelope and rejects an unverified primary email', () => {
    expect(() =>
      validatePersonEmail({
        id: 'EML-SYNTHETIC-0001',
        personId: canonicalPersonId,
        protectedEmailEnvelope: 'v1.synthetic.email-envelope',
        normalizedEmailFingerprint: 'FP-SYNTHETIC-EMAIL-0001',
        state: PERSON_EMAIL_STATE.ACTIVE,
        verificationState: PERSON_EMAIL_VERIFICATION_STATE.UNVERIFIED,
        isPrimary: true,
        createdAt: '2026-08-14T00:00:00.000Z',
        updatedAt: '2026-08-14T00:00:00.000Z',
      }),
    ).toThrow(/primary/i);

    expect(
      validatePersonEmail({
        id: 'EML-SYNTHETIC-0001',
        personId: canonicalPersonId,
        protectedEmailEnvelope: 'v1.synthetic.email-envelope',
        normalizedEmailFingerprint: 'FP-SYNTHETIC-EMAIL-0001',
        state: PERSON_EMAIL_STATE.ACTIVE,
        verificationState: PERSON_EMAIL_VERIFICATION_STATE.VERIFIED,
        isPrimary: true,
        createdAt: '2026-08-14T00:00:00.000Z',
        updatedAt: '2026-08-14T00:00:00.000Z',
      }),
    ).toMatchObject({
      protectedEmailEnvelope: 'v1.synthetic.email-envelope',
      normalizedEmailFingerprint: 'FP-SYNTHETIC-EMAIL-0001',
    });
  });

  it('preserves explicit account links and assignment null dates without authorization inference', () => {
    expect(
      validateAccountStaffLink({
        id: 'LNK-SYNTHETIC-0001',
        accountId: 'ACCOUNT-SYNTHETIC-0001',
        personId: canonicalPersonId,
        state: ACCOUNT_STAFF_LINK_STATE.ACTIVE,
        createdAt: '2026-08-14T00:00:00.000Z',
        updatedAt: '2026-08-14T00:00:00.000Z',
      }),
    ).toEqual({
      id: 'LNK-SYNTHETIC-0001',
      accountId: 'ACCOUNT-SYNTHETIC-0001',
      personId: canonicalPersonId,
      state: ACCOUNT_STAFF_LINK_STATE.ACTIVE,
      sourceProvenanceEnvelope: null,
      createdAt: '2026-08-14T00:00:00.000Z',
      updatedAt: '2026-08-14T00:00:00.000Z',
    });

    expect(
      validateStaffAssignment({
        id: 'ASN-SYNTHETIC-0001',
        personId: canonicalPersonId,
        assignmentFingerprint: 'FP-SYNTHETIC-ASSIGNMENT-0001',
        protectedAssignmentEnvelope: 'v1.synthetic.assignment-envelope',
        state: STAFF_ASSIGNMENT_STATE.QUARANTINED,
        effectiveFrom: null,
        effectiveTo: null,
        createdAt: '2026-08-14T00:00:00.000Z',
        updatedAt: '2026-08-14T00:00:00.000Z',
      }),
    ).toMatchObject({
      state: STAFF_ASSIGNMENT_STATE.QUARANTINED,
      effectiveFrom: null,
      effectiveTo: null,
    });
  });
});
