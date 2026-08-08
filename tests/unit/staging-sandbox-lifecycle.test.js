import { describe, expect, it } from 'vitest';
import {
  SANDBOX_ACTORS,
  buildSandboxArchiveSql,
  buildSandboxSeedSql,
  createSandboxCredentials,
  sandboxSeedSummary,
} from '../../scripts/staging-sandbox-lifecycle.mjs';

const credential = Object.freeze({
  algorithm: 'PBKDF2-SHA-256',
  iterations: 100_000,
  salt: 'aaaaaaaaaaaaaaaaaaaaaa',
  hash: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
  peppered: true,
});

const credentials = Object.fromEntries(
  SANDBOX_ACTORS.map(([key]) => [
    key,
    {
      accountId: `SBX-G0001-ACC-${key}`,
      accessId: `SBX.G0001.${key}`,
      password: 'Private!Synthetic9a',
      credential,
    },
  ]),
);

describe('staging sandbox lifecycle manifest', () => {
  it('builds the versioned 36-item synthetic dataset without destructive SQL', () => {
    const sql = buildSandboxSeedSql({
      generation: 1,
      now: '2026-08-08T00:00:00.000Z',
      credentials,
    });
    expect(sql.match(/INSERT INTO inventory_items/gu)).toHaveLength(36);
    expect(sql).toContain("'SYNTHETIC_ONLY'");
    expect(sql).toContain('@example.invalid');
    expect(sql).not.toMatch(/DELETE FROM|DROP TABLE|INSERT OR REPLACE/iu);
    expect(sandboxSeedSummary(1)).toMatchObject({ accounts: 11, inventoryItems: 36 });
  });

  it('archives one exact generation and appends ledger reversals', () => {
    const sql = buildSandboxArchiveSql({
      generation: 1,
      now: '2026-08-08T01:00:00.000Z',
    });
    expect(sql).toContain("LIKE 'SBX-G0001-%'");
    expect(sql).toContain('reversal_of');
    expect(sql).toContain("status = 'ARCHIVED'");
    expect(sql).not.toMatch(/DELETE FROM (?:inventory_ledger|audit_log|status_history|.*history)/iu);
    expect(sql.match(/DELETE FROM/gu)).toHaveLength(1);
    expect(sql).toContain('DELETE FROM sessions');
  });

  it('derives peppered private credentials without exposing them to SQL callers', async () => {
    const generated = await createSandboxCredentials({
      generation: 2,
      pepper: 'private-staging-pepper-value',
      passwords: Object.fromEntries(SANDBOX_ACTORS.map(([key]) => [key, `Strong!${key}Password9a`])),
    });
    expect(generated.OWNER.credential).toMatchObject({ peppered: true, iterations: 100_000 });
    expect(generated.OWNER.accountId).toBe('SBX-G0002-ACC-OWNER');
    expect(JSON.stringify(generated.OWNER.credential)).not.toContain(generated.OWNER.password);
  });
});
