import { describe, expect, it, vi } from 'vitest';
import {
  createPlaygroundService,
  isPlaygroundRuntime,
  playgroundRuntimeIssues,
} from '../../src/server/playground-service.js';

const baseline = {
  sourceProductionVersion: 'v0.8.0',
  sourceProductionSha: 'a'.repeat(40),
  capturedAt: '2026-08-09T00:00:00.000Z',
  schemaVersion: '30',
  latestMigration: '0030_production_access_and_operations.sql',
  d1BaselineParity: 'EXCEPTIONS',
  r2BaselineParity: 'PASS',
  parityExceptions: ['PRODUCTION_CREDENTIALS_EXCLUDED'],
};

function environment(state = { state: 'CLEAN', activeTestSession: false }) {
  const rows = new Map([
    ['playground.clean_baseline', { value: JSON.stringify(baseline), updated_at: baseline.capturedAt }],
    ['playground.working_state', { value: JSON.stringify(state), updated_at: baseline.capturedAt }],
  ]);
  const run = vi.fn().mockResolvedValue({ success: true });
  const prepare = vi.fn((sql) => ({
    bind: vi.fn((key) => ({
      first: vi.fn().mockResolvedValue(rows.get(key) ?? null),
      run,
    })),
    first: vi.fn().mockResolvedValue(
      sql.includes('operational_schema_version')
        ? { value: '30' }
        : { name: '0030_production_access_and_operations.sql' },
    ),
  }));
  return {
    ENVIRONMENT: 'STAGING',
    PLAYGROUND_MODE: true,
    PLAYGROUND_LABEL: 'ISOLATED_STAGING_PLAYGROUND',
    APP_VERSION: '0.8.0-playground.1',
    CANDIDATE_SHA: 'b'.repeat(40),
    CANDIDATE_TREE_SHA: 'c'.repeat(40),
    APPLICATION_ARTIFACT_HASH: 'd'.repeat(64),
    PRODUCTION_ACCEPTED_VERSION: 'v0.8.0',
    PRODUCTION_ACCEPTED_SHA: 'a'.repeat(40),
    PRODUCTION_SCHEMA_VERSION: '30',
    DB: { prepare, batch: vi.fn().mockResolvedValue([]) },
    BRAND_ASSETS: { get: vi.fn(), put: vi.fn() },
    EVIDENCE_ASSETS: { get: vi.fn(), put: vi.fn() },
  };
}

describe('isolated playground runtime guard and status', () => {
  it('cannot be activated in production or by a browser-supplied flag', () => {
    expect(
      isPlaygroundRuntime({
        ENVIRONMENT: 'PRODUCTION',
        PLAYGROUND_MODE: true,
        PLAYGROUND_LABEL: 'ISOLATED_STAGING_PLAYGROUND',
      }),
    ).toBe(false);
    expect(isPlaygroundRuntime({ ENVIRONMENT: 'STAGING', request: { staging: true } })).toBe(false);
  });

  it('returns only safe candidate, production, baseline, and working identities', async () => {
    const status = await createPlaygroundService(environment()).status();
    expect(status).toMatchObject({
      playground: true,
      workingState: 'CLEAN',
      d1BaselineParity: 'EXCEPTIONS',
      r2BaselineParity: 'PASS',
    });
    expect(status.candidate.commit).toHaveLength(12);
    expect(status.production.identity).toHaveLength(12);
    expect(JSON.stringify(status)).not.toContain('database_id');
    expect(JSON.stringify(status)).not.toContain('bucket');
  });

  it('protects an active test session from baseline refresh', async () => {
    const service = createPlaygroundService(environment({ state: 'DIRTY', activeTestSession: true }));
    await expect(
      service.requestOperation({
        kind: 'REFRESH_BASELINE',
        confirmation: 'REFRESH BASELINE FROM PRODUCTION',
        actorAccountId: 'OWNER',
      }),
    ).rejects.toMatchObject({ code: 'PLAYGROUND_ACTIVE_SESSION_PROTECTED', status: 409 });
  });

  it('requires the exact reset phrase and fixed server-owned runtime bindings', async () => {
    const env = environment();
    const service = createPlaygroundService(env);
    await expect(
      service.requestOperation({ kind: 'RESET', confirmation: 'production', actorAccountId: 'OWNER' }),
    ).rejects.toMatchObject({ code: 'PLAYGROUND_CONFIRMATION_REQUIRED' });
    await expect(
      service.requestOperation({
        kind: 'RESET',
        confirmation: 'RESET PLAYGROUND',
        actorAccountId: 'OWNER',
        databaseId: 'production-id-from-browser',
      }),
    ).resolves.toMatchObject({ accepted: true, state: 'RESETTING' });
    expect(env.DB.batch).toHaveBeenCalledTimes(1);
    expect(playgroundRuntimeIssues(env)).toEqual([]);
  });
});
