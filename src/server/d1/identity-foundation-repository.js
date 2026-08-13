import {
  validateAccountStaffLink,
  validateCanonicalPerson,
  validatePersonEmail,
  validateStaffAssignment,
} from '../identity-foundation/contracts.js';

function mapPerson(row) {
  if (!row) return null;
  return {
    personId: row.person_id,
    sourceProvenanceEnvelope: row.source_provenance_envelope ?? null,
    createdAt: row.created_at,
  };
}

function mapEmail(row) {
  if (!row) return null;
  return {
    id: row.id,
    personId: row.person_id,
    protectedEmailEnvelope: row.protected_email_envelope,
    normalizedEmailFingerprint: row.normalized_email_fingerprint,
    state: row.state,
    verificationState: row.verification_state,
    isPrimary: row.is_primary === 1,
    sourceProvenanceEnvelope: row.source_provenance_envelope ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapAccountStaffLink(row) {
  if (!row) return null;
  return {
    id: row.id,
    accountId: row.account_id,
    personId: row.person_id,
    state: row.state,
    sourceProvenanceEnvelope: row.source_provenance_envelope ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapStaffAssignment(row) {
  if (!row) return null;
  return {
    id: row.id,
    personId: row.person_id,
    assignmentFingerprint: row.assignment_fingerprint,
    protectedAssignmentEnvelope: row.protected_assignment_envelope,
    state: row.state,
    effectiveFrom: row.effective_from ?? null,
    effectiveTo: row.effective_to ?? null,
    sourceProvenanceEnvelope: row.source_provenance_envelope ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createD1IdentityFoundationRepository(db) {
  if (!db) throw new Error('D1 database binding is required.');

  return Object.freeze({
    async getPerson(personId) {
      return mapPerson(
        await db.prepare('SELECT * FROM canonical_people WHERE person_id = ?1').bind(personId).first(),
      );
    },

    async createPerson(value) {
      const person = validateCanonicalPerson(value);
      await db
        .prepare(
          `INSERT INTO canonical_people (person_id, source_provenance_envelope, created_at)
           VALUES (?1, ?2, ?3)`,
        )
        .bind(person.personId, person.sourceProvenanceEnvelope, person.createdAt)
        .run();
      return this.getPerson(person.personId);
    },

    async listPersonEmails(personId) {
      const result = await db
        .prepare('SELECT * FROM person_emails WHERE person_id = ?1 ORDER BY created_at, id')
        .bind(personId)
        .all();
      return result.results.map(mapEmail);
    },

    async createPersonEmail(value) {
      const email = validatePersonEmail(value);
      await db
        .prepare(
          `INSERT INTO person_emails (
             id, person_id, protected_email_envelope, normalized_email_fingerprint,
             state, verification_state, is_primary, source_provenance_envelope, created_at, updated_at
           ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)`,
        )
        .bind(
          email.id,
          email.personId,
          email.protectedEmailEnvelope,
          email.normalizedEmailFingerprint,
          email.state,
          email.verificationState,
          email.isPrimary ? 1 : 0,
          email.sourceProvenanceEnvelope,
          email.createdAt,
          email.updatedAt,
        )
        .run();
      const row = await db.prepare('SELECT * FROM person_emails WHERE id = ?1').bind(email.id).first();
      return mapEmail(row);
    },

    async getActiveAccountStaffLink(accountId) {
      return mapAccountStaffLink(
        await db
          .prepare("SELECT * FROM account_staff_links WHERE account_id = ?1 AND state = 'ACTIVE'")
          .bind(accountId)
          .first(),
      );
    },

    async getAccountStaffLink(linkId) {
      return mapAccountStaffLink(
        await db.prepare('SELECT * FROM account_staff_links WHERE id = ?1').bind(linkId).first(),
      );
    },

    async listAccountStaffLinks(personId) {
      const result = await db
        .prepare('SELECT * FROM account_staff_links WHERE person_id = ?1 ORDER BY created_at, id')
        .bind(personId)
        .all();
      return result.results.map(mapAccountStaffLink);
    },

    async createAccountStaffLink(value) {
      const link = validateAccountStaffLink(value);
      await db
        .prepare(
          `INSERT INTO account_staff_links (
             id, account_id, person_id, state, source_provenance_envelope, created_at, updated_at
           ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`,
        )
        .bind(
          link.id,
          link.accountId,
          link.personId,
          link.state,
          link.sourceProvenanceEnvelope,
          link.createdAt,
          link.updatedAt,
        )
        .run();
      return this.getAccountStaffLink(link.id);
    },

    async listStaffAssignments(personId) {
      const result = await db
        .prepare('SELECT * FROM staff_assignments WHERE person_id = ?1 ORDER BY created_at, id')
        .bind(personId)
        .all();
      return result.results.map(mapStaffAssignment);
    },

    async createStaffAssignment(value) {
      const assignment = validateStaffAssignment(value);
      await db
        .prepare(
          `INSERT INTO staff_assignments (
             id, person_id, assignment_fingerprint, protected_assignment_envelope,
             state, effective_from, effective_to, source_provenance_envelope, created_at, updated_at
           ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)`,
        )
        .bind(
          assignment.id,
          assignment.personId,
          assignment.assignmentFingerprint,
          assignment.protectedAssignmentEnvelope,
          assignment.state,
          assignment.effectiveFrom,
          assignment.effectiveTo,
          assignment.sourceProvenanceEnvelope,
          assignment.createdAt,
          assignment.updatedAt,
        )
        .run();
      const row = await db
        .prepare('SELECT * FROM staff_assignments WHERE id = ?1')
        .bind(assignment.id)
        .first();
      return mapStaffAssignment(row);
    },
  });
}
