import { describe, expect, it, vi } from 'vitest';
import {
  createPlaygroundService,
  isPlaygroundRuntime,
  playgroundRuntimeIssues,
} from '../../src/server/playground-service.js';
import worker from '../../src/worker/index.js';

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
    ['playground.baseline_id', { value: 'PLAYGROUND-CLEAN-V2', updated_at: baseline.capturedAt }],
    ['playground.baseline_version', { value: '2', updated_at: baseline.capturedAt }],
    ['playground.reset_generation', { value: '6', updated_at: baseline.capturedAt }],
    [
      'playground.last_reset_receipt',
      {
        value: JSON.stringify({
          status: 'PASS',
          generation: 6,
          completedAt: '2026-08-28T06:00:00.000Z',
          oldSessionsInvalidated: 1,
          consequences: ['Previous Playground sessions were invalidated.'],
        }),
        updated_at: baseline.capturedAt,
      },
    ],
  ]);
  const run = vi.fn().mockResolvedValue({ success: true });
  const prepare = vi.fn((sql) => ({
    bind: vi.fn((key) => ({
      first: vi.fn().mockResolvedValue(rows.get(key) ?? null),
      run,
    })),
    first: vi
      .fn()
      .mockResolvedValue(
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

  it('does not expose the owner convenience-session endpoint in production', async () => {
    const response = await worker.fetch(
      new Request('https://logistics.hausc.org/api/playground/session', {
        method: 'POST',
        headers: { 'content-type': 'application/json', origin: 'https://logistics.hausc.org' },
        body: JSON.stringify({ accountId: 'browser-selected-production-owner' }),
      }),
      { ENVIRONMENT: 'PRODUCTION', RECOVERY_HOSTNAME: 'recovery.workers.dev' },
    );

    expect(response.status).toBe(404);
    expect(response.headers.get('set-cookie')).toBeNull();
    await expect(response.json()).resolves.toMatchObject({
      error: { code: 'PLAYGROUND_ENVIRONMENT_REFUSED' },
    });
  });

  it('returns only safe candidate, production, baseline, and working identities', async () => {
    const status = await createPlaygroundService(environment()).status();
    expect(status).toMatchObject({
      playground: true,
      workingState: 'CLEAN',
      d1BaselineParity: 'EXCEPTIONS',
      r2BaselineParity: 'PASS',
      resetCenter: {
        baselineId: 'PLAYGROUND-CLEAN-V2',
        baselineVersion: '2',
        generation: 6,
        workingState: 'CLEAN',
        resetAvailable: true,
        confirmationPhrase: 'RESET PLAYGROUND',
        lastReset: { status: 'PASS', generation: 6, oldSessionsInvalidated: 1 },
      },
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

  it('rejects a second operation while the reset lock state is active', async () => {
    const service = createPlaygroundService(
      environment({ state: 'RESETTING', activeTestSession: false, resetGeneration: 7 }),
    );
    await expect(
      service.requestOperation({
        kind: 'RESET',
        confirmation: 'RESET PLAYGROUND',
        actorAccountId: 'OWNER',
      }),
    ).rejects.toMatchObject({ code: 'PLAYGROUND_OPERATION_IN_PROGRESS', status: 409 });
  });

  it.each([
    ['GET', '/api/playground/status'],
    ['POST', '/api/playground/operation'],
  ])('does not expose %s %s in production', async (method, pathname) => {
    const response = await worker.fetch(new Request(`https://logistics.hausc.org${pathname}`, { method }), {
      ENVIRONMENT: 'PRODUCTION',
      RECOVERY_HOSTNAME: 'recovery.workers.dev',
    });
    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: 'PLAYGROUND_ENVIRONMENT_REFUSED' },
    });
  });
});
