import { normalizeBorrowerType } from './circulation-policy.js';

export const STUDENT_ID_MAX_LENGTH = 8;

export const BORROWER_IDENTITY_SOURCES = Object.freeze({
  USC_STAFF: 'APPROVED_ACTIVE_USC_SOURCE',
  ANGELITE: 'APPROVED_ANGELITE_IDENTITY_RULE',
});

export function normalizeStudentIdNumber(value) {
  return String(value ?? '').trim();
}

export function studentIdInputValue(value) {
  return normalizeStudentIdNumber(value)
    .replace(/[^0-9]/g, '')
    .slice(0, STUDENT_ID_MAX_LENGTH);
}

export function validateStudentIdNumber(value) {
  const normalized = normalizeStudentIdNumber(value);
  if (!/^[0-9]{1,8}$/.test(normalized)) {
    return {
      valid: false,
      code: 'INVALID_STUDENT_ID',
      message: 'Student ID Number must contain only digits and must not exceed 8 digits.',
    };
  }
  return { valid: true, value: normalized };
}

export function borrowerIdentityRequirement(borrowerType) {
  const normalized = normalizeBorrowerType(borrowerType);
  if (normalized === 'USC_STAFF') {
    return {
      borrowerType: normalized,
      source: BORROWER_IDENTITY_SOURCES.USC_STAFF,
      label: 'Approved active USC officer/staff source',
      instruction:
        'Confirm that the borrower appears as active in the approved USC officer/staff source. An email domain alone is not sufficient.',
    };
  }
  return {
    borrowerType: 'ANGELITE',
    source: BORROWER_IDENTITY_SOURCES.ANGELITE,
    label: 'Approved Angelite/student identity rule',
    instruction:
      'Confirm the borrower using the approved Angelite/student institutional identity rule before approval.',
  };
}

export function validateBorrowerIdentityApproval({
  borrowerType,
  identityVerified,
  identityVerificationSource,
} = {}) {
  const requirement = borrowerIdentityRequirement(borrowerType);
  const verified = identityVerified === true || identityVerified === 'true';
  if (!verified || identityVerificationSource !== requirement.source) {
    return {
      valid: false,
      code: 'BORROWER_IDENTITY_NOT_VERIFIED',
      message: `${requirement.label} verification is required before approval.`,
      requirement,
    };
  }
  return { valid: true, requirement };
}
