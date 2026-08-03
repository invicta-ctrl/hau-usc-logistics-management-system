function parseJson(value, fallback = null) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function mapLink(row) {
  if (!row) return null;
  return {
    id: row.id,
    label: row.label,
    url: row.url,
    linkType: row.link_type,
    audience: row.audience,
    status: row.status,
    revision: Number(row.revision),
    syncState: row.sync_state,
    createdByAccountId: row.created_by_account_id,
    updatedByAccountId: row.updated_by_account_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    archivedAt: row.archived_at ?? null,
  };
}

function mapVersion(row) {
  return {
    id: row.id,
    linkId: row.link_id,
    revision: Number(row.revision),
    before: parseJson(row.before_json),
    after: parseJson(row.after_json),
    action: row.action,
    actorAccountId: row.actor_account_id,
    reason: row.reason,
    idempotencyKey: row.idempotency_key,
    correlationId: row.correlation_id,
    createdAt: row.created_at,
  };
}

function escapeLike(value) {
  return value.replaceAll('\\', '\\\\').replaceAll('%', '\\%').replaceAll('_', '\\_');
}

function versionStatement(db, version) {
  return db
    .prepare(
      `INSERT INTO reference_link_versions (
         id, link_id, revision, before_json, after_json, action,
         actor_account_id, reason, idempotency_key, correlation_id, created_at
       ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)`,
    )
    .bind(
      version.id,
      version.linkId,
      version.revision,
      JSON.stringify(version.before),
      JSON.stringify(version.after),
      version.action,
      version.actorAccountId,
      version.reason,
      version.idempotencyKey,
      version.correlationId,
      version.createdAt,
    );
}

function auditStatement(db, audit) {
  return db
    .prepare(
      `INSERT INTO audit_log (
         id, created_at, action, entity_type, entity_id, actor_account_id,
         before_json, after_json, correlation_id, notes
       ) VALUES (?1, ?2, ?3, 'REFERENCE_LINK', ?4, ?5, ?6, ?7, ?8, '')`,
    )
    .bind(
      audit.id,
      audit.createdAt,
      audit.action,
      audit.entityId,
      audit.actorAccountId,
      JSON.stringify(audit.before ?? {}),
      JSON.stringify(audit.after ?? {}),
      audit.correlationId,
    );
}

function idempotencyStatement(db, idempotency) {
  return db
    .prepare(
      `INSERT INTO idempotency_keys (
         scope, idempotency_key, actor_account_id, request_fingerprint, result_json, created_at
       ) VALUES (?1, ?2, ?3, ?4, ?5, ?6)`,
    )
    .bind(
      idempotency.scope,
      idempotency.key,
      idempotency.actorAccountId,
      idempotency.requestFingerprint,
      JSON.stringify(idempotency.result),
      idempotency.createdAt,
    );
}

function revisionGuardStatement(db, linkId, expectedRevision) {
  return db
    .prepare(
      `SELECT CASE
         WHEN EXISTS (
           SELECT 1 FROM reference_links WHERE id = ?1 AND revision = ?2
         ) THEN 1
         ELSE json_extract('REFERENCE_LINK_REVISION_CONFLICT', '$')
       END AS allowed`,
    )
    .bind(linkId, expectedRevision);
}

export function createD1ReferenceLinkRepository(db) {
  if (!db) throw new Error('D1 database binding is required.');

  return Object.freeze({
    async list({ query = '', status = '', audience = '', page = 1, pageSize = 20 } = {}) {
      const filter = `WHERE (?1 = '' OR status = ?1)
        AND (?2 = '' OR audience = ?2)
        AND (
          ?3 = '' OR
          lower(label || ' ' || url || ' ' || link_type) LIKE '%' || lower(?3) || '%' ESCAPE '\\'
        )`;
      const bindings = [status, audience, escapeLike(query)];
      const totalRow = await db
        .prepare(`SELECT COUNT(*) AS total FROM reference_links ${filter}`)
        .bind(...bindings)
        .first();
      const result = await db
        .prepare(
          `SELECT * FROM reference_links ${filter}
           ORDER BY
             CASE status
               WHEN 'ACTIVE' THEN 1
               WHEN 'DRAFT' THEN 2
               WHEN 'INACTIVE' THEN 3
               ELSE 4
             END,
             lower(label), id
           LIMIT ?4 OFFSET ?5`,
        )
        .bind(...bindings, pageSize, (page - 1) * pageSize)
        .all();
      return {
        items: (result.results ?? []).map(mapLink),
        total: Number(totalRow?.total ?? 0),
      };
    },

    async getById(id) {
      return mapLink(await db.prepare('SELECT * FROM reference_links WHERE id = ?1').bind(id).first());
    },

    async listVersions({ linkId, page = 1, pageSize = 20 }) {
      const totalRow = await db
        .prepare('SELECT COUNT(*) AS total FROM reference_link_versions WHERE link_id = ?1')
        .bind(linkId)
        .first();
      const result = await db
        .prepare(
          `SELECT * FROM reference_link_versions
           WHERE link_id = ?1
           ORDER BY revision DESC
           LIMIT ?2 OFFSET ?3`,
        )
        .bind(linkId, pageSize, (page - 1) * pageSize)
        .all();
      return {
        items: (result.results ?? []).map(mapVersion),
        total: Number(totalRow?.total ?? 0),
      };
    },

    async getIdempotency(scope, key) {
      const row = await db
        .prepare(
          `SELECT actor_account_id, request_fingerprint, result_json
           FROM idempotency_keys
           WHERE scope = ?1 AND idempotency_key = ?2`,
        )
        .bind(scope, key)
        .first();
      return row
        ? {
            actorAccountId: row.actor_account_id,
            requestFingerprint: row.request_fingerprint,
            result: parseJson(row.result_json),
          }
        : null;
    },

    async create({ link, version, audit, idempotency }) {
      await db.batch([
        db
          .prepare(
            `INSERT INTO reference_links (
               id, label, url, link_type, audience, status, revision, sync_state,
               created_by_account_id, updated_by_account_id, created_at, updated_at, archived_at
             ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)`,
          )
          .bind(
            link.id,
            link.label,
            link.url,
            link.linkType,
            link.audience,
            link.status,
            link.revision,
            link.syncState,
            link.createdByAccountId,
            link.updatedByAccountId,
            link.createdAt,
            link.updatedAt,
            link.archivedAt,
          ),
        versionStatement(db, version),
        auditStatement(db, audit),
        idempotencyStatement(db, idempotency),
      ]);
    },

    async update({ linkId, expectedRevision, next, version, audit, idempotency }) {
      try {
        const results = await db.batch([
          revisionGuardStatement(db, linkId, expectedRevision),
          db
            .prepare(
              `UPDATE reference_links
               SET label = ?3, url = ?4, link_type = ?5, audience = ?6, status = ?7,
                 revision = ?8, sync_state = ?9, updated_by_account_id = ?10,
                 updated_at = ?11, archived_at = ?12
               WHERE id = ?1 AND revision = ?2`,
            )
            .bind(
              linkId,
              expectedRevision,
              next.label,
              next.url,
              next.linkType,
              next.audience,
              next.status,
              next.revision,
              next.syncState,
              next.updatedByAccountId,
              next.updatedAt,
              next.archivedAt,
            ),
          versionStatement(db, version),
          auditStatement(db, audit),
          idempotencyStatement(db, idempotency),
        ]);
        return { updated: Number(results[1]?.meta?.changes ?? 0) === 1 };
      } catch (error) {
        const current = await db
          .prepare('SELECT revision FROM reference_links WHERE id = ?1')
          .bind(linkId)
          .first();
        if (!current || Number(current.revision) !== expectedRevision) return { updated: false };
        throw error;
      }
    },
  });
}
