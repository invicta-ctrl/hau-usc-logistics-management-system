const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu;
const PERSON_ID = /^PER-[0-9A-F]{8}-[0-9A-F]{4}-[1-8][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/u;
const RECORD_ID = /^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$/u;
const FINGERPRINT = /^[A-Za-z0-9._:-]{16,256}$/u;

export const PERSON_EMAIL_STATE = Object.freeze({
  ACTIVE: 'ACTIVE',
  SUPERSEDED: 'SUPERSEDED',
  QUARANTINED: 'QUARANTINED',
});

export const PERSON_EMAIL_VERIFICATION_STATE = Object.freeze({
  UNVERIFIED: 'UNVERIFIED',
  VERIFIED: 'VERIFIED',
  AMBIGUOUS: 'AMBIGUOUS',
});

export const ACCOUNT_STAFF_LINK_STATE = Object.freeze({
  ACTIVE: 'ACTIVE',
  REVOKED: 'REVOKED',
  QUARANTINED: 'QUARANTINED',
});

export const STAFF_ASSIGNMENT_STATE = Object.freeze({
  ACTIVE: 'ACTIVE',
  HISTORICAL: 'HISTORICAL',
  QUARANTINED: 'QUARANTINED',
});

const requiredText = (value, field, { pattern = null, max = 4096 } = {}) => {
  const text = String(value ?? '').trim();
  if (!text || text.length > max || (pattern && !pattern.test(text))) {
    throw new Error(`${field} is invalid.`);
  }
  return text;
};

const nullableText = (value, field, { max = 4096 } = {}) => {
  if (value === null || value === undefined || value === '') return null;
  return requiredText(value, field, { max });
};

const stateValue = (value, states, field) => {
  const state = requiredText(value, field, { max: 64 }).toUpperCase();
  if (!Object.values(states).includes(state)) throw new Error(`${field} is invalid.`);
  return state;
};

export function createCanonicalPersonId(createUuid = () => globalThis.crypto.randomUUID()) {
  const uuid = String(createUuid?.() ?? '').trim();
  if (!UUID.test(uuid)) throw new Error('Canonical person identifier generation failed.');
  return `PER-${uuid.toUpperCase()}`;
}

export function normalizeEmailForMatching(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase();
}

export function validateCanonicalPerson(value = {}) {
  return Object.freeze({
    personId: requiredText(value.personId, 'personId', { pattern: PERSON_ID, max: 128 }),
    sourceProvenanceEnvelope: nullableText(value.sourceProvenanceEnvelope, 'sourceProvenanceEnvelope', {
      max: 131072,
    }),
    createdAt: requiredText(value.createdAt, 'createdAt', { max: 64 }),
  });
}

export function validatePersonEmail(value = {}) {
  const state = stateValue(value.state, PERSON_EMAIL_STATE, 'state');
  const verificationState = stateValue(
    value.verificationState,
    PERSON_EMAIL_VERIFICATION_STATE,
    'verificationState',
  );
  const isPrimary = value.isPrimary === true;
  if (
    isPrimary &&
    (state !== PERSON_EMAIL_STATE.ACTIVE || verificationState !== PERSON_EMAIL_VERIFICATION_STATE.VERIFIED)
  ) {
    throw new Error('A primary email must be active and verified.');
  }
  return Object.freeze({
    id: requiredText(value.id, 'id', { pattern: RECORD_ID, max: 128 }),
    personId: requiredText(value.personId, 'personId', { pattern: PERSON_ID, max: 128 }),
    protectedEmailEnvelope: requiredText(value.protectedEmailEnvelope, 'protectedEmailEnvelope', {
      max: 131072,
    }),
    normalizedEmailFingerprint: requiredText(value.normalizedEmailFingerprint, 'normalizedEmailFingerprint', {
      pattern: FINGERPRINT,
      max: 256,
    }),
    state,
    verificationState,
    isPrimary,
    sourceProvenanceEnvelope: nullableText(value.sourceProvenanceEnvelope, 'sourceProvenanceEnvelope', {
      max: 131072,
    }),
    createdAt: requiredText(value.createdAt, 'createdAt', { max: 64 }),
    updatedAt: requiredText(value.updatedAt, 'updatedAt', { max: 64 }),
  });
}

export function validateAccountStaffLink(value = {}) {
  return Object.freeze({
    id: requiredText(value.id, 'id', { pattern: RECORD_ID, max: 128 }),
    accountId: requiredText(value.accountId, 'accountId', { pattern: RECORD_ID, max: 128 }),
    personId: requiredText(value.personId, 'personId', { pattern: PERSON_ID, max: 128 }),
    state: stateValue(value.state, ACCOUNT_STAFF_LINK_STATE, 'state'),
    sourceProvenanceEnvelope: nullableText(value.sourceProvenanceEnvelope, 'sourceProvenanceEnvelope', {
      max: 131072,
    }),
    createdAt: requiredText(value.createdAt, 'createdAt', { max: 64 }),
    updatedAt: requiredText(value.updatedAt, 'updatedAt', { max: 64 }),
  });
}

export function validateStaffAssignment(value = {}) {
  const effectiveFrom = nullableText(value.effectiveFrom, 'effectiveFrom', { max: 64 });
  const effectiveTo = nullableText(value.effectiveTo, 'effectiveTo', { max: 64 });
  if (effectiveFrom && effectiveTo && effectiveFrom > effectiveTo) {
    throw new Error('effectiveFrom must not be after effectiveTo.');
  }
  return Object.freeze({
    id: requiredText(value.id, 'id', { pattern: RECORD_ID, max: 128 }),
    personId: requiredText(value.personId, 'personId', { pattern: PERSON_ID, max: 128 }),
    assignmentFingerprint: requiredText(value.assignmentFingerprint, 'assignmentFingerprint', {
      pattern: FINGERPRINT,
      max: 256,
    }),
    protectedAssignmentEnvelope: requiredText(
      value.protectedAssignmentEnvelope,
      'protectedAssignmentEnvelope',
      {
        max: 131072,
      },
    ),
    state: stateValue(value.state, STAFF_ASSIGNMENT_STATE, 'state'),
    effectiveFrom,
    effectiveTo,
    sourceProvenanceEnvelope: nullableText(value.sourceProvenanceEnvelope, 'sourceProvenanceEnvelope', {
      max: 131072,
    }),
    createdAt: requiredText(value.createdAt, 'createdAt', { max: 64 }),
    updatedAt: requiredText(value.updatedAt, 'updatedAt', { max: 64 }),
  });
}
