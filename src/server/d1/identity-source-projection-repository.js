function count(value, field) {
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed < 0) {
    throw new Error(`D1 identity source-projection ${field} is invalid.`);
  }
  return parsed;
}

function mapLatestAppliedCounts(row) {
  if (!row) return null;
  const sourceFingerprint = String(row.source_fingerprint ?? '').trim();
  if (!sourceFingerprint) throw new Error('D1 identity source-projection fingerprint is invalid.');
  return Object.freeze({
    sourceFingerprint,
    sourceRowCount: count(row.source_row_count, 'source row count'),
    acceptedCount: count(row.accepted_count, 'accepted count'),
    rejectionCount: count(row.rejection_count, 'rejection count'),
    currentProjectionEntryCount: count(row.current_projection_entry_count, 'projection entry count'),
    matchingProjectionEntryCount: count(row.matching_projection_entry_count, 'matching projection count'),
  });
}

export function createD1IdentitySourceProjectionRepository(db) {
  if (!db) throw new Error('D1 database binding is required.');

  return Object.freeze({
    async readLatestAppliedCounts() {
      const row = await db
        .prepare(
          `WITH latest_applied AS (
             SELECT id, source_fingerprint, source_row_count, accepted_count, rejection_count
             FROM identity_roster_sync_runs
             WHERE apply_status = 'APPLIED'
             ORDER BY applied_at DESC, created_at DESC, id DESC
             LIMIT 1
           )
           SELECT latest_applied.source_fingerprint,
                  latest_applied.source_row_count,
                  latest_applied.accepted_count,
                  latest_applied.rejection_count,
                  (SELECT COUNT(*) FROM identity_roster_entries) AS current_projection_entry_count,
                  (SELECT COUNT(*)
                   FROM identity_roster_entries entry
                   WHERE entry.source_run_id = latest_applied.id
                     AND entry.source_fingerprint = latest_applied.source_fingerprint
                  ) AS matching_projection_entry_count
           FROM latest_applied`,
        )
        .first();
      return mapLatestAppliedCounts(row);
    },
  });
}
