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

const CANONICAL_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/u;
const LINK_STATES = new Set(['ACTIVE', 'REVOKED', 'QUARANTINED']);
const ASSIGNMENT_STATES = new Set(['ACTIVE', 'HISTORICAL', 'QUARANTINED']);

function canonicalUtc(value, field) {
  const timestamp = String(value ?? '').trim();
  if (!CANONICAL_UTC.test(timestamp) || Number.isNaN(Date.parse(timestamp))) {
    throw new Error(`${field} must be canonical UTC.`);
  }
  if (new Date(timestamp).toISOString() !== timestamp) throw new Error(`${field} must be canonical UTC.`);
  return timestamp;
}

function optionalCanonicalUtc(value, field) {
  if (value == null || value === '') return null;
  return canonicalUtc(value, field);
}

function boundedCorrelationId(value, fallback) {
  const correlationId = String(value ?? fallback).trim();
  if (!correlationId || correlationId.length > 128) throw new Error('correlationId is invalid.');
  return correlationId;
}

function revisionAssertionStatement(db) {
  return db.prepare(
    `UPDATE data_revisions
     SET updated_at = CASE WHEN changes() = 1 THEN updated_at ELSE NULL END
     WHERE scope = 'global'`,
  );
}

function linkCreateContextStatement(db, link, correlationId) {
  return db
    .prepare(
      `INSERT INTO staff_account_activity_transition_context (
         transition_id, source_kind, source_id, account_staff_link_id, staff_assignment_id,
         action_code, person_id, account_id, old_link_state, new_link_state,
         old_assignment_state, new_assignment_state, old_effective_from, old_effective_to,
         new_effective_from, new_effective_to, correlation_id, created_at
       ) VALUES (
         'TRN-' || lower(hex(randomblob(16))), 'ACCOUNT_STAFF_LINK', ?1, ?1, NULL,
         'LINK_CREATED', ?2, ?3, NULL, ?4, NULL, NULL, NULL, NULL, NULL, NULL, ?5, ?6
       )`,
    )
    .bind(link.id, link.personId, link.accountId, link.state, correlationId, link.createdAt);
}

function linkStateContextStatement(db, link, nextState, updatedAt, correlationId) {
  return db
    .prepare(
      `INSERT INTO staff_account_activity_transition_context (
         transition_id, source_kind, source_id, account_staff_link_id, staff_assignment_id,
         action_code, person_id, account_id, old_link_state, new_link_state,
         old_assignment_state, new_assignment_state, old_effective_from, old_effective_to,
         new_effective_from, new_effective_to, correlation_id, created_at
       ) VALUES (
         'TRN-' || lower(hex(randomblob(16))), 'ACCOUNT_STAFF_LINK', ?1, ?1, NULL,
         'LINK_STATE_CHANGED', ?2, ?3, ?4, ?5, NULL, NULL, NULL, NULL, NULL, NULL, ?6, ?7
       )`,
    )
    .bind(link.id, link.personId, link.accountId, link.state, nextState, correlationId, updatedAt);
}

function assignmentCreateContextStatement(db, assignment, correlationId) {
  return db
    .prepare(
      `INSERT INTO staff_account_activity_transition_context (
         transition_id, source_kind, source_id, account_staff_link_id, staff_assignment_id,
         action_code, person_id, account_id, old_link_state, new_link_state,
         old_assignment_state, new_assignment_state, old_effective_from, old_effective_to,
         new_effective_from, new_effective_to, correlation_id, created_at
       ) VALUES (
         'TRN-' || lower(hex(randomblob(16))), 'STAFF_ASSIGNMENT', ?1, NULL, ?1,
         'ASSIGNMENT_CREATED', ?2, NULL, NULL, NULL, NULL, ?3, NULL, NULL, ?4, ?5, ?6, ?7
       )`,
    )
    .bind(
      assignment.id,
      assignment.personId,
      assignment.state,
      assignment.effectiveFrom,
      assignment.effectiveTo,
      correlationId,
      assignment.createdAt,
    );
}

function assignmentStateContextStatement(db, assignment, nextState, updatedAt, correlationId) {
  return db
    .prepare(
      `INSERT INTO staff_account_activity_transition_context (
         transition_id, source_kind, source_id, account_staff_link_id, staff_assignment_id,
         action_code, person_id, account_id, old_link_state, new_link_state,
         old_assignment_state, new_assignment_state, old_effective_from, old_effective_to,
         new_effective_from, new_effective_to, correlation_id, created_at
       ) VALUES (
         'TRN-' || lower(hex(randomblob(16))), 'STAFF_ASSIGNMENT', ?1, NULL, ?1,
         'ASSIGNMENT_STATE_CHANGED', ?2, NULL, NULL, NULL, ?3, ?4, ?5, ?6, ?5, ?6, ?7, ?8
       )`,
    )
    .bind(
      assignment.id,
      assignment.personId,
      assignment.state,
      nextState,
      assignment.effectiveFrom,
      assignment.effectiveTo,
      correlationId,
      updatedAt,
    );
}

function assignmentWindowContextStatement(
  db,
  assignment,
  nextEffectiveFrom,
  nextEffectiveTo,
  updatedAt,
  correlationId,
) {
  return db
    .prepare(
      `INSERT INTO staff_account_activity_transition_context (
         transition_id, source_kind, source_id, account_staff_link_id, staff_assignment_id,
         action_code, person_id, account_id, old_link_state, new_link_state,
         old_assignment_state, new_assignment_state, old_effective_from, old_effective_to,
         new_effective_from, new_effective_to, correlation_id, created_at
       ) VALUES (
         'TRN-' || lower(hex(randomblob(16))), 'STAFF_ASSIGNMENT', ?1, NULL, ?1,
         'ASSIGNMENT_EFFECTIVE_WINDOW_CHANGED', ?2, NULL, NULL, NULL, ?3, ?3, ?4, ?5, ?6, ?7, ?8, ?9
       )`,
    )
    .bind(
      assignment.id,
      assignment.personId,
      assignment.state,
      assignment.effectiveFrom,
      assignment.effectiveTo,
      nextEffectiveFrom,
      nextEffectiveTo,
      correlationId,
      updatedAt,
    );
}

function activityHistoryWhere({ personId, query, eventType, actionCode }) {
  const clauses = ['person_id = ?1'];
  const bindings = [personId];
  if (query) {
    bindings.push(query);
    clauses.push(`(account_id = ?${bindings.length} OR account_access_id_snapshot = ?${bindings.length})`);
  }
  if (eventType) {
    bindings.push(eventType);
    clauses.push(`event_type = ?${bindings.length}`);
  }
  if (actionCode) {
    bindings.push(actionCode);
    clauses.push(`action_code = ?${bindings.length}`);
  }
  return { where: clauses.join(' AND '), bindings };
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

    async createAccountStaffLink(value, { correlationId } = {}) {
      const input = validateAccountStaffLink(value);
      const link = {
        ...input,
        createdAt: canonicalUtc(input.createdAt, 'createdAt'),
        updatedAt: canonicalUtc(input.updatedAt, 'updatedAt'),
      };
      const eventCorrelationId = boundedCorrelationId(correlationId, `IDENTITY_LINK:${link.id}`);
      await db.batch([
        linkCreateContextStatement(db, link, eventCorrelationId),
        db
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
          ),
        revisionAssertionStatement(db),
      ]);
      return this.getAccountStaffLink(link.id);
    },

    async updateAccountStaffLinkState({ id, state, updatedAt, correlationId } = {}) {
      const link = await this.getAccountStaffLink(id);
      if (!link) throw new Error('The account staff link does not exist.');
      const nextState = String(state ?? '')
        .trim()
        .toUpperCase();
      if (!LINK_STATES.has(nextState)) throw new Error('state is invalid.');
      if (nextState === link.state) return link;
      const occurredAt = canonicalUtc(updatedAt, 'updatedAt');
      const eventCorrelationId = boundedCorrelationId(correlationId, `IDENTITY_LINK:${link.id}`);
      await db.batch([
        linkStateContextStatement(db, link, nextState, occurredAt, eventCorrelationId),
        db
          .prepare(
            `UPDATE account_staff_links
             SET state = ?1, updated_at = ?2
             WHERE id = ?3
               AND account_id = ?4
               AND person_id = ?5
               AND state = ?6
               AND updated_at = ?7`,
          )
          .bind(nextState, occurredAt, link.id, link.accountId, link.personId, link.state, link.updatedAt),
        revisionAssertionStatement(db),
      ]);
      return this.getAccountStaffLink(link.id);
    },

    async listStaffAssignments(personId) {
      const result = await db
        .prepare('SELECT * FROM staff_assignments WHERE person_id = ?1 ORDER BY created_at, id')
        .bind(personId)
        .all();
      return result.results.map(mapStaffAssignment);
    },

    async listStaffAccountActivityHistory({
      personId,
      query = null,
      eventType = null,
      actionCode = null,
      page,
      pageSize,
    }) {
      const { where, bindings } = activityHistoryWhere({ personId, query, eventType, actionCode });
      const offset = (page - 1) * pageSize;
      const [metadata, counted, result] = await Promise.all([
        db
          .prepare(
            `SELECT value
             FROM app_metadata
             WHERE key = 'staff_account_activity_history_starts_at'`,
          )
          .first(),
        db
          .prepare(`SELECT COUNT(*) AS count FROM staff_account_activity_history WHERE ${where}`)
          .bind(...bindings)
          .first(),
        db
          .prepare(
            `SELECT
               event_id,
               occurred_at,
               event_type,
               action_code,
               account_id,
               account_access_id_snapshot,
               correlation_id,
               link_state,
               previous_link_state,
               assignment_state,
               previous_assignment_state,
               old_effective_from,
               old_effective_to,
               new_effective_from,
               new_effective_to
             FROM staff_account_activity_history
             WHERE ${where}
             ORDER BY occurred_at DESC, event_id DESC
             LIMIT ?${bindings.length + 1} OFFSET ?${bindings.length + 2}`,
          )
          .bind(...bindings, pageSize, offset)
          .all(),
      ]);
      return {
        historyStartsAt: metadata?.value ?? null,
        total: Number(counted?.count ?? 0),
        items: result.results,
      };
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

    async createStaffAssignment(value, { correlationId } = {}) {
      const input = validateStaffAssignment(value);
      const assignment = {
        ...input,
        createdAt: canonicalUtc(input.createdAt, 'createdAt'),
        updatedAt: canonicalUtc(input.updatedAt, 'updatedAt'),
        effectiveFrom: optionalCanonicalUtc(input.effectiveFrom, 'effectiveFrom'),
        effectiveTo: optionalCanonicalUtc(input.effectiveTo, 'effectiveTo'),
      };
      if (
        assignment.effectiveFrom &&
        assignment.effectiveTo &&
        assignment.effectiveFrom > assignment.effectiveTo
      ) {
        throw new Error('effectiveFrom must not be after effectiveTo.');
      }
      const eventCorrelationId = boundedCorrelationId(correlationId, `IDENTITY_ASSIGNMENT:${assignment.id}`);
      await db.batch([
        assignmentCreateContextStatement(db, assignment, eventCorrelationId),
        db
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
          ),
        revisionAssertionStatement(db),
      ]);
      const row = await db
        .prepare('SELECT * FROM staff_assignments WHERE id = ?1')
        .bind(assignment.id)
        .first();
      return mapStaffAssignment(row);
    },

    async updateStaffAssignmentState({ id, state, updatedAt, correlationId } = {}) {
      const assignment = mapStaffAssignment(
        await db.prepare('SELECT * FROM staff_assignments WHERE id = ?1').bind(id).first(),
      );
      if (!assignment) throw new Error('The staff assignment does not exist.');
      const nextState = String(state ?? '')
        .trim()
        .toUpperCase();
      if (!ASSIGNMENT_STATES.has(nextState)) throw new Error('state is invalid.');
      if (nextState === assignment.state) return assignment;
      const occurredAt = canonicalUtc(updatedAt, 'updatedAt');
      const eventCorrelationId = boundedCorrelationId(correlationId, `IDENTITY_ASSIGNMENT:${assignment.id}`);
      await db.batch([
        assignmentStateContextStatement(db, assignment, nextState, occurredAt, eventCorrelationId),
        db
          .prepare(
            `UPDATE staff_assignments
             SET state = ?1, updated_at = ?2
             WHERE id = ?3
               AND person_id = ?4
               AND assignment_fingerprint = ?5
               AND state = ?6
               AND effective_from IS ?7
               AND effective_to IS ?8
               AND updated_at = ?9`,
          )
          .bind(
            nextState,
            occurredAt,
            assignment.id,
            assignment.personId,
            assignment.assignmentFingerprint,
            assignment.state,
            assignment.effectiveFrom,
            assignment.effectiveTo,
            assignment.updatedAt,
          ),
        revisionAssertionStatement(db),
      ]);
      return mapStaffAssignment(
        await db.prepare('SELECT * FROM staff_assignments WHERE id = ?1').bind(assignment.id).first(),
      );
    },

    async updateStaffAssignmentEffectiveWindow({
      id,
      effectiveFrom,
      effectiveTo,
      updatedAt,
      correlationId,
    } = {}) {
      const assignment = mapStaffAssignment(
        await db.prepare('SELECT * FROM staff_assignments WHERE id = ?1').bind(id).first(),
      );
      if (!assignment) throw new Error('The staff assignment does not exist.');
      const nextEffectiveFrom = optionalCanonicalUtc(effectiveFrom, 'effectiveFrom');
      const nextEffectiveTo = optionalCanonicalUtc(effectiveTo, 'effectiveTo');
      if (nextEffectiveFrom && nextEffectiveTo && nextEffectiveFrom > nextEffectiveTo) {
        throw new Error('effectiveFrom must not be after effectiveTo.');
      }
      if (nextEffectiveFrom === assignment.effectiveFrom && nextEffectiveTo === assignment.effectiveTo) {
        return assignment;
      }
      const occurredAt = canonicalUtc(updatedAt, 'updatedAt');
      const eventCorrelationId = boundedCorrelationId(correlationId, `IDENTITY_ASSIGNMENT:${assignment.id}`);
      await db.batch([
        assignmentWindowContextStatement(
          db,
          assignment,
          nextEffectiveFrom,
          nextEffectiveTo,
          occurredAt,
          eventCorrelationId,
        ),
        db
          .prepare(
            `UPDATE staff_assignments
             SET effective_from = ?1, effective_to = ?2, updated_at = ?3
             WHERE id = ?4
               AND person_id = ?5
               AND assignment_fingerprint = ?6
               AND state = ?7
               AND effective_from IS ?8
               AND effective_to IS ?9
               AND updated_at = ?10`,
          )
          .bind(
            nextEffectiveFrom,
            nextEffectiveTo,
            occurredAt,
            assignment.id,
            assignment.personId,
            assignment.assignmentFingerprint,
            assignment.state,
            assignment.effectiveFrom,
            assignment.effectiveTo,
            assignment.updatedAt,
          ),
        revisionAssertionStatement(db),
      ]);
      return mapStaffAssignment(
        await db.prepare('SELECT * FROM staff_assignments WHERE id = ?1').bind(assignment.id).first(),
      );
    },
  });
}
