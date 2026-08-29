import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  d1Rows,
  nextResetGeneration,
  validatePlaygroundResetTarget,
  validateResetVerification,
} from '../../scripts/playground/reset-workspace.mjs';

const transientCounts = {
  sessions: 0,
  password_reset_tokens: 0,
  auth_rate_limits: 0,
  auth_rate_limit_events: 0,
  email_verification_challenges: 0,
  account_applications: 0,
  account_application_history: 0,
  public_request_rate_limit_events: 0,
  public_lending_rate_limit_events: 0,
  reporting_outbox: 0,
};

function hash(value) {
  return createHash('sha256').update(value).digest('hex');
}

function verificationRow(overrides = {}) {
  const evidenceKeys = ['evidence/redacted-a.json', 'evidence/redacted-b.json'];
  return {
    schema_version: '32',
    latest_migration: '0032_staff_account_activity_history.sql',
    working_state: JSON.stringify({
      state: 'CLEAN',
      activeTestSession: false,
      resetGeneration: 4,
      updatedAt: '2026-08-28T00:00:00.000Z',
    }),
    reset_generation: '4',
    ...transientCounts,
    foreign_key_violations: 0,
    evidence_object_count: evidenceKeys.length,
    evidence_object_keys_json: JSON.stringify(evidenceKeys),
    ...overrides,
  };
}

function r2Result(keys = ['evidence/redacted-a.json', 'evidence/redacted-b.json']) {
  return {
    d1Evidence: {
      count: keys.length,
      keyHash: hash(JSON.stringify(keys)),
      allPresent: true,
    },
  };
}

describe('Playground reset workspace contract', () => {
  it('preserves a verified export, serializes resets, and records fail-closed ERROR state', () => {
    const source = readFileSync(
      new URL('../../scripts/playground/reset-workspace.mjs', import.meta.url),
      'utf8',
    );
    expect(source).toContain("'d1', 'export'");
    expect(source).toContain("wrangler(['r2', 'bucket', 'list'])");
    expect(source).not.toContain("['r2', 'bucket', 'list', '--json']");
    expect(source).toContain('restoreAndVerifyD1Export');
    expect(source).toContain("open(lockPath, 'wx', 0o600)");
    expect(source).toContain("state: 'ERROR'");
    expect(source).toContain("state: 'RESETTING'");
  });

  it('keeps reset-cycle canaries private and proves old-session invalidation', () => {
    const source = readFileSync(
      new URL('../../scripts/playground/audit-live-p12-reset-cycle.mjs', import.meta.url),
      'utf8',
    );
    expect(source).toContain('mode: 0o600');
    expect(source).toContain('response.status === 401');
    expect(source).toContain("hostname !== 'logistics.hausc.org'");
    expect(source).toContain("productionMutation: 'NONE'");
    expect(source).not.toContain('console.log(session');
    expect(source).not.toContain('console.log(cookie');
  });

  it('accepts only a complete isolated Playground Worker, D1, and R2 tuple', () => {
    const manifest = {
      status: 'READY',
      playgroundHostname: 'playground.hausc.org',
      resources: {
        names: {
          d1Working: 'hau-usc-logistics-playground-working-safe',
          r2BaselineBrand: 'hau-usc-logistics-playground-baseline-brand-safe',
          r2WorkingBrand: 'hau-usc-logistics-playground-working-brand-safe',
          r2BaselineEvidence: 'hau-usc-logistics-pg-baseline-evidence-safe',
          r2WorkingEvidence: 'hau-usc-logistics-pg-working-evidence-safe',
        },
      },
      d1: {
        databaseId: '11111111-1111-4111-8111-111111111111',
        cleanBaselineBookmark: 'sealed-bookmark',
      },
    };

    expect(validatePlaygroundResetTarget(manifest)).toMatchObject({
      hostname: 'playground.hausc.org',
    });
    expect(() =>
      validatePlaygroundResetTarget({
        ...manifest,
        playgroundHostname: 'logistics.hausc.org',
      }),
    ).toThrow('isolated Playground tuple');
    expect(() =>
      validatePlaygroundResetTarget({
        ...manifest,
        resources: {
          names: { ...manifest.resources.names, r2WorkingBrand: 'production-brand-assets' },
        },
      }),
    ).toThrow('isolated Playground tuple');
  });

  it('increments only a valid non-negative reset generation', () => {
    expect(nextResetGeneration(undefined)).toBe(1);
    expect(nextResetGeneration('3')).toBe(4);
    expect(() => nextResetGeneration('-1')).toThrow('generation is invalid');
    expect(() => nextResetGeneration('not-a-number')).toThrow('generation is invalid');
  });

  it('projects Wrangler D1 rows across supported response envelopes', () => {
    expect(d1Rows([{ results: [{ value: 1 }] }, { result: [{ results: [{ value: 2 }] }] }])).toEqual([
      { value: 1 },
      { value: 2 },
    ]);
  });

  it('accepts schema, generation, transient, FK, and D1-to-R2 linkage parity', () => {
    expect(validateResetVerification(verificationRow(), r2Result(), 4)).toMatchObject({
      generation: 4,
      transientTotal: 0,
      foreignKeyViolations: 0,
      evidenceObjectCount: 2,
      linkageMatches: true,
    });
  });

  it('fails closed on residual sessions or evidence-linkage drift', () => {
    expect(() => validateResetVerification(verificationRow({ sessions: 1 }), r2Result(), 4)).toThrow(
      'D1 reset verification failed',
    );
    expect(() => validateResetVerification(verificationRow(), r2Result(['evidence/other.json']), 4)).toThrow(
      'D1 reset verification failed',
    );
  });
});
