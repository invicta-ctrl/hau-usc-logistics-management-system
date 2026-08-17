import { describe, expect, it } from 'vitest';
import { createD1IdentitySourceProjectionRepository } from '../../src/server/d1/identity-source-projection-repository.js';

function database(row) {
  const calls = [];
  return {
    calls,
    db: {
      prepare(sql) {
        const call = { sql: String(sql), firstCalls: 0 };
        calls.push(call);
        return {
          async first() {
            call.firstCalls += 1;
            return row;
          },
        };
      },
    },
  };
}

describe('D1 identity source-projection repository', () => {
  it('uses one dedicated count-only SELECT and exposes only source fingerprint and scalar reconciliation counts', async () => {
    const { db, calls } = database({
      source_fingerprint: 'SHA256-SYNTHETIC-SOURCE',
      source_row_count: 3,
      accepted_count: 2,
      rejection_count: 1,
      current_projection_entry_count: 2,
      matching_projection_entry_count: 2,
    });
    const repository = createD1IdentitySourceProjectionRepository(db);

    await expect(repository.readLatestAppliedCounts()).resolves.toEqual({
      sourceFingerprint: 'SHA256-SYNTHETIC-SOURCE',
      sourceRowCount: 3,
      acceptedCount: 2,
      rejectionCount: 1,
      currentProjectionEntryCount: 2,
      matchingProjectionEntryCount: 2,
    });
    expect(calls).toHaveLength(1);
    expect(calls[0].firstCalls).toBe(1);
    expect(calls[0].sql).toMatch(/^\s*WITH\s+latest_applied/iu);
    expect(calls[0].sql).toContain('SELECT COUNT(*) FROM identity_roster_entries');
    expect(calls[0].sql).toContain("apply_status = 'APPLIED'");
    expect(calls[0].sql).not.toMatch(/\b(?:INSERT|UPDATE|DELETE|REPLACE|CREATE|DROP|ALTER|RUN|BATCH)\b/iu);
  });

  it('returns null instead of manufacturing a count when no applied projection exists', async () => {
    const { db } = database(null);
    const repository = createD1IdentitySourceProjectionRepository(db);

    await expect(repository.readLatestAppliedCounts()).resolves.toBeNull();
  });
});
