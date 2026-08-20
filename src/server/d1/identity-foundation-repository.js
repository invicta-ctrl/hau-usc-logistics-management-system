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

function mapCanonicalEmailMatch(row) {
  if (!row) return null;
  return {
    id: row.id,
    personId: row.person_id,
    state: row.state,
    verificationState: row.verification_state,
  };
}

function mapVerifiedAccountCandidate(row) {
  if (!row) return null;
  return {
    id: row.id,
    status: row.status,
    profileEmailVerifiedAt: row.profile_email_verified_at ?? null,
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

function mapDirectoryRow(row) {
  return {
    personId: row.person_id,
    linkedAccountCount: Number(row.linked_account_count ?? 0),
    activeLinkCount: Number(row.active_link_count ?? 0),
    revokedLinkCount: Number(row.revoked_link_count ?? 0),
    quarantinedLinkCount: Number(row.quarantined_link_count ?? 0),
    quarantinedEmailCount: Number(row.quarantined_email_count ?? 0),
    ambiguousEmailCount: Number(row.ambiguous_email_count ?? 0),
    activeVerifiedEmailCount: Number(row.active_verified_email_count ?? 0),
    activeUnverifiedEmailCount: Number(row.active_unverified_email_count ?? 0),
    activeAssignmentCount: Number(row.active_assignment_count ?? 0),
    historicalAssignmentCount: Number(row.historical_assignment_count ?? 0),
    quarantinedAssignmentCount: Number(row.quarantined_assignment_count ?? 0),
    assignmentProvenanceCount: Number(row.assignment_provenance_count ?? 0),
    activeAccessId: row.active_access_id ?? null,
    activeDisplayName: row.active_display_name ?? null,
  };
}

function escapedLike(value) {
  return `%${String(value ?? '').replace(/[\\%_]/gu, '\\$&')}%`;
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

    async listCanonicalEmailMatches(normalizedEmailFingerprint) {
      const result = await db
        .prepare(
          `SELECT id, person_id, state, verification_state
           FROM person_emails
           WHERE normalized_email_fingerprint = ?1
           ORDER BY person_id, id`,
        )
        .bind(normalizedEmailFingerprint)
        .all();
      return result.results.map(mapCanonicalEmailMatch);
    },

    async listAccountsByVerifiedEmailFingerprint(verifiedEmailFingerprint) {
      const result = await db
        .prepare(
          `SELECT id, status, profile_email_verified_at
           FROM accounts
           WHERE verified_email_fingerprint = ?1
           ORDER BY id`,
        )
        .bind(verifiedEmailFingerprint)
        .all();
      return result.results.map(mapVerifiedAccountCandidate);
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

    async listCanonicalDirectory({ query = '', page = 1, pageSize = 25 } = {}) {
      const search = escapedLike(query);
      const offset = (page - 1) * pageSize;
      const where = `
        p.person_id LIKE ?1 ESCAPE '\\'
        OR EXISTS (
          SELECT 1
          FROM account_staff_links lookup_link
          JOIN accounts lookup_account ON lookup_account.id = lookup_link.account_id
          WHERE lookup_link.person_id = p.person_id
            AND (
              lookup_account.access_id_normalized LIKE ?1 ESCAPE '\\'
              OR lookup_account.profile_full_name LIKE ?1 ESCAPE '\\'
            )
        )`;
      const count = await db
        .prepare(`SELECT COUNT(*) AS count FROM canonical_people p WHERE ${where}`)
        .bind(search)
        .first();
      const result = await db
        .prepare(
          `SELECT
             p.person_id,
             COUNT(DISTINCT link.account_id) AS linked_account_count,
             COUNT(DISTINCT CASE WHEN link.state = 'ACTIVE' THEN link.id END) AS active_link_count,
             COUNT(DISTINCT CASE WHEN link.state = 'REVOKED' THEN link.id END) AS revoked_link_count,
             COUNT(DISTINCT CASE WHEN link.state = 'QUARANTINED' THEN link.id END) AS quarantined_link_count,
             COUNT(DISTINCT CASE WHEN email.state = 'QUARANTINED' THEN email.id END) AS quarantined_email_count,
             COUNT(DISTINCT CASE WHEN email.verification_state = 'AMBIGUOUS' THEN email.id END) AS ambiguous_email_count,
             COUNT(DISTINCT CASE WHEN email.state = 'ACTIVE' AND email.verification_state = 'VERIFIED' THEN email.id END) AS active_verified_email_count,
             COUNT(DISTINCT CASE WHEN email.state = 'ACTIVE' AND email.verification_state = 'UNVERIFIED' THEN email.id END) AS active_unverified_email_count,
             COUNT(DISTINCT CASE WHEN assignment.state = 'ACTIVE' THEN assignment.id END) AS active_assignment_count,
             COUNT(DISTINCT CASE WHEN assignment.state = 'HISTORICAL' THEN assignment.id END) AS historical_assignment_count,
             COUNT(DISTINCT CASE WHEN assignment.state = 'QUARANTINED' THEN assignment.id END) AS quarantined_assignment_count,
             COUNT(DISTINCT CASE WHEN assignment.source_provenance_envelope IS NOT NULL THEN assignment.id END) AS assignment_provenance_count,
             MIN(CASE WHEN link.state = 'ACTIVE' THEN account.access_id_normalized END) AS active_access_id,
             MIN(CASE WHEN link.state = 'ACTIVE' THEN account.profile_full_name END) AS active_display_name
           FROM canonical_people p
           LEFT JOIN account_staff_links link ON link.person_id = p.person_id
           LEFT JOIN accounts account ON account.id = link.account_id
           LEFT JOIN person_emails email ON email.person_id = p.person_id
           LEFT JOIN staff_assignments assignment ON assignment.person_id = p.person_id
           WHERE ${where}
           GROUP BY p.person_id
           ORDER BY p.person_id ASC
           LIMIT ?2 OFFSET ?3`,
        )
        .bind(search, pageSize, offset)
        .all();
      return {
        total: Number(count?.count ?? 0),
        items: result.results.map(mapDirectoryRow),
      };
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
