import { describe, expect, it, vi } from 'vitest';
import { ROLES } from '../../src/domain/constants.js';
import {
  IDENTITY_SOURCE_PROJECTION_PROBE_STATUS,
  SOURCE_PROJECTION_PROBE_REQUEST_TIMEOUT_MS,
  SOURCE_PROJECTION_PROBE_TOTAL_TIMEOUT_MS,
  createIdentitySourceProjectionProbeService,
  isIdentitySourceProjectionProbeExecutionAuthorized,
} from '../../src/server/identity-foundation/source-projection-probe.js';

const owner = { id: 'OWNER-SYNTHETIC', roleId: ROLES.SYSTEM_OWNER };

function idcPlan({ status = 'READY', source = {}, quarantineCount = 0 } = {}) {
  return {
    status,
    source: {
      sourceRowCount: 3,
      acceptedProjectionCount: 2,
      rejectedSourceRowCount: 1,
      currentProjectionEntryCount: 2,
      matchingProjectionEntryCount: 2,
      projectionDiscrepancy: 0,
      ...source,
    },
    candidates: { quarantineCount },
  };
}

function context({
  executionAuthorized = true,
  persisted = {
    sourceFingerprint: 'SHA256-SYNTHETIC-SOURCE',
    sourceRowCount: 3,
    acceptedCount: 2,
    rejectionCount: 1,
    currentProjectionEntryCount: 2,
    matchingProjectionEntryCount: 2,
  },
  live = {
    sourceFingerprint: 'SHA256-SYNTHETIC-SOURCE',
    sourceRowCount: 3,
    acceptedCount: 2,
    rejectionCount: 1,
    rows: [['PRIVATE-SYNTHETIC-ROW']],
  },
  plan = idcPlan(),
  setTimeoutImpl = vi.fn(() => Symbol('timer')),
  clearTimeoutImpl = vi.fn(),
} = {}) {
  const source = { readProjectionSummary: vi.fn(async () => structuredClone(live)) };
  const repository = { readLatestAppliedCounts: vi.fn(async () => structuredClone(persisted)) };
  const reconciliation = { preview: vi.fn(async () => structuredClone(plan)) };
  const service = createIdentitySourceProjectionProbeService({
    source,
    repository,
    reconciliation,
    executionAuthorized,
    setTimeoutImpl,
    clearTimeoutImpl,
  });
  return { service, source, repository, reconciliation, setTimeoutImpl, clearTimeoutImpl };
}

function deferred() {
  let resolve;
  const promise = new Promise((resolvePromise) => {
    resolve = resolvePromise;
  });
  return { promise, resolve };
}

function controlledOverallDeadline() {
  let callback;
  const setTimeoutImpl = vi.fn((nextCallback) => {
    callback = nextCallback;
    return Symbol('overall-probe-deadline');
  });
  const clearTimeoutImpl = vi.fn();
  return {
    setTimeoutImpl,
    clearTimeoutImpl,
    expire() {
      if (typeof callback !== 'function') {
        throw new Error('Overall probe deadline was not scheduled.');
      }
      callback();
    },
  };
}

async function flushMicrotasks() {
  for (let attempt = 0; attempt < 16; attempt += 1) {
    await Promise.resolve();
  }
}

async function waitForCondition(condition) {
  for (let attempt = 0; attempt < 16; attempt += 1) {
    if (condition()) return;
    await Promise.resolve();
  }
  expect(condition()).toBe(true);
}

async function expectOverallDeadlineFailure({ service, deadline, pending, resumeValue, waitUntilStarted }) {
  const outcomes = [];
  void service.probe({ actor: owner }).then(
    () => outcomes.push({ type: 'success' }),
    (error) => outcomes.push({ type: 'error', code: error?.code, status: error?.status }),
  );

  await waitUntilStarted();
  expect(deadline.setTimeoutImpl).toHaveBeenCalledWith(
    expect.any(Function),
    SOURCE_PROJECTION_PROBE_TOTAL_TIMEOUT_MS,
  );
  deadline.expire();
  await waitForCondition(() => outcomes.length === 1);
  expect(outcomes).toEqual([
    { type: 'error', code: 'IDENTITY_SOURCE_PROJECTION_PROBE_TIMEOUT', status: 504 },
  ]);

  pending.resolve(resumeValue);
  await flushMicrotasks();
  expect(outcomes).toEqual([
    { type: 'error', code: 'IDENTITY_SOURCE_PROJECTION_PROBE_TIMEOUT', status: 504 },
  ]);
  expect(deadline.clearTimeoutImpl).toHaveBeenCalledOnce();
}

describe('identity source-projection probe', () => {
  it('authorizes execution only for the exact staging-only boolean and candidate identity gate', () => {
    const authorizedSha = '0123456789abcdef0123456789abcdef01234567';
    const allowed = {
      ENVIRONMENT: 'STAGING',
      PLAYGROUND_MODE: true,
      IDENTITY_SOURCE_PROJECTION_PROBE_ENABLED: true,
      IDENTITY_SOURCE_PROJECTION_PROBE_AUTHORIZED_SHA: authorizedSha,
      CANDIDATE_SHA: authorizedSha,
    };

    expect(isIdentitySourceProjectionProbeExecutionAuthorized(allowed)).toBe(true);
    for (const blocked of [
      { ...allowed, ENVIRONMENT: 'PRODUCTION' },
      { ...allowed, ENVIRONMENT: undefined },
      { ...allowed, PLAYGROUND_MODE: undefined },
      { ...allowed, IDENTITY_SOURCE_PROJECTION_PROBE_ENABLED: undefined },
      { ...allowed, PLAYGROUND_MODE: 'true' },
      { ...allowed, IDENTITY_SOURCE_PROJECTION_PROBE_ENABLED: 'true' },
      { ...allowed, IDENTITY_SOURCE_PROJECTION_PROBE_AUTHORIZED_SHA: undefined },
      { ...allowed, IDENTITY_SOURCE_PROJECTION_PROBE_AUTHORIZED_SHA: authorizedSha.toUpperCase() },
      { ...allowed, CANDIDATE_SHA: undefined },
      { ...allowed, CANDIDATE_SHA: authorizedSha.toUpperCase() },
      { ...allowed, CANDIDATE_SHA: authorizedSha.slice(0, -1) },
      { ...allowed, CANDIDATE_SHA: '89abcdef0123456789abcdef0123456789abcdef' },
    ]) {
      expect(isIdentitySourceProjectionProbeExecutionAuthorized(blocked)).toBe(false);
    }
  });

  it('keeps live probe execution blocked by default before provider or repository access', async () => {
    const { service, source, repository, reconciliation } = context({ executionAuthorized: false });

    await expect(service.probe({ actor: owner })).rejects.toMatchObject({
      code: 'IDENTITY_SOURCE_PROJECTION_PROBE_EXECUTION_BLOCKED',
      status: 423,
    });
    expect(source.readProjectionSummary).not.toHaveBeenCalled();
    expect(repository.readLatestAppliedCounts).not.toHaveBeenCalled();
    expect(reconciliation.preview).not.toHaveBeenCalled();
  });

  it('requires System Owner before any probe provider, repository, or reconciliation call', async () => {
    const { service, source, repository, reconciliation } = context();

    await expect(
      service.probe({ actor: { id: 'USER-SYNTHETIC', roleId: ROLES.DOL_STAFF } }),
    ).rejects.toMatchObject({
      code: 'IDENTITY_SOURCE_PROJECTION_OWNER_REQUIRED',
      status: 403,
    });
    expect(source.readProjectionSummary).not.toHaveBeenCalled();
    expect(repository.readLatestAppliedCounts).not.toHaveBeenCalled();
    expect(reconciliation.preview).not.toHaveBeenCalled();
  });

  it('fails closed at the 20s overall deadline when the repository ignores abort and remains pending', async () => {
    const deadline = controlledOverallDeadline();
    const pending = deferred();
    const { service, source, repository, reconciliation } = context({
      setTimeoutImpl: deadline.setTimeoutImpl,
      clearTimeoutImpl: deadline.clearTimeoutImpl,
    });
    repository.readLatestAppliedCounts.mockImplementation(() => pending.promise);

    await expectOverallDeadlineFailure({
      service,
      deadline,
      pending,
      resumeValue: {
        sourceFingerprint: 'SHA256-SYNTHETIC-SOURCE',
        sourceRowCount: 3,
        acceptedCount: 2,
        rejectionCount: 1,
        currentProjectionEntryCount: 2,
        matchingProjectionEntryCount: 2,
      },
      waitUntilStarted: () =>
        waitForCondition(() => repository.readLatestAppliedCounts.mock.calls.length === 1),
    });
    expect(reconciliation.preview).not.toHaveBeenCalled();
    expect(source.readProjectionSummary).not.toHaveBeenCalled();
  });

  it('fails closed at the 20s overall deadline when reconciliation ignores abort and remains pending', async () => {
    const deadline = controlledOverallDeadline();
    const pending = deferred();
    const { service, source, reconciliation } = context({
      setTimeoutImpl: deadline.setTimeoutImpl,
      clearTimeoutImpl: deadline.clearTimeoutImpl,
    });
    reconciliation.preview.mockImplementation(() => pending.promise);

    await expectOverallDeadlineFailure({
      service,
      deadline,
      pending,
      resumeValue: idcPlan(),
      waitUntilStarted: () => waitForCondition(() => reconciliation.preview.mock.calls.length === 1),
    });
    expect(source.readProjectionSummary).not.toHaveBeenCalled();
  });

  it('fails closed at the 20s overall deadline when the provider ignores its aborted signal and remains pending', async () => {
    const deadline = controlledOverallDeadline();
    const pending = deferred();
    const { service, source } = context({
      setTimeoutImpl: deadline.setTimeoutImpl,
      clearTimeoutImpl: deadline.clearTimeoutImpl,
    });
    source.readProjectionSummary.mockImplementation(() => pending.promise);

    let options;
    await expectOverallDeadlineFailure({
      service,
      deadline,
      pending,
      resumeValue: {
        sourceFingerprint: 'SHA256-SYNTHETIC-SOURCE',
        sourceRowCount: 3,
        acceptedCount: 2,
        rejectionCount: 1,
      },
      waitUntilStarted: async () => {
        await waitForCondition(() => source.readProjectionSummary.mock.calls.length === 1);
        options = source.readProjectionSummary.mock.calls[0][0];
        expect(options.signal).toBeInstanceOf(AbortSignal);
      },
    });
    expect(options.signal.aborted).toBe(true);
  });

  it('returns only a finite safe allowlist after every live, persisted, projection, and ID-C count agrees', async () => {
    const { service, source, repository, reconciliation, setTimeoutImpl, clearTimeoutImpl } = context();

    const result = await service.probe({ actor: owner });

    expect(result).toEqual({
      status: IDENTITY_SOURCE_PROJECTION_PROBE_STATUS.COUNTS_MATCH_READ_ONLY,
      counts: {
        live: { sourceRowCount: 3, acceptedCount: 2, rejectionCount: 1 },
        persisted: {
          sourceRowCount: 3,
          acceptedCount: 2,
          rejectionCount: 1,
          currentProjectionEntryCount: 2,
          matchingProjectionEntryCount: 2,
        },
        idc: {
          sourceRowCount: 3,
          acceptedCount: 2,
          rejectionCount: 1,
          currentProjectionEntryCount: 2,
          matchingProjectionEntryCount: 2,
        },
      },
      idc: { status: 'READY', quarantineCount: 0 },
      idD: { authorized: false, blocked: true, blocker: 'NOT_AUTHORIZED' },
      safety: {
        dataMutation: false,
        providerRead: true,
        rawRowsPersisted: false,
        retryCount: 0,
        requestTimeoutMs: SOURCE_PROJECTION_PROBE_REQUEST_TIMEOUT_MS,
        overallTimeoutMs: SOURCE_PROJECTION_PROBE_TOTAL_TIMEOUT_MS,
      },
    });
    expect(JSON.stringify(result)).not.toContain('PRIVATE-SYNTHETIC-ROW');
    expect(JSON.stringify(result)).not.toContain('SHA256-SYNTHETIC-SOURCE');
    expect(repository.readLatestAppliedCounts).toHaveBeenCalledOnce();
    expect(reconciliation.preview).toHaveBeenCalledWith({ actor: owner });
    expect(source.readProjectionSummary).toHaveBeenCalledOnce();
    const options = source.readProjectionSummary.mock.calls[0][0];
    expect(options.requestTimeoutMs).toBe(SOURCE_PROJECTION_PROBE_REQUEST_TIMEOUT_MS);
    expect(options.signal).toBeInstanceOf(AbortSignal);
    expect(setTimeoutImpl).toHaveBeenCalledWith(
      expect.any(Function),
      SOURCE_PROJECTION_PROBE_TOTAL_TIMEOUT_MS,
    );
    expect(clearTimeoutImpl).toHaveBeenCalledOnce();
  });

  it('blocks before a provider call when the persisted projection or ID-C source summary is inconsistent', async () => {
    const persistedMismatch = context({
      persisted: {
        sourceFingerprint: 'SHA256-SYNTHETIC-SOURCE',
        sourceRowCount: 3,
        acceptedCount: 2,
        rejectionCount: 1,
        currentProjectionEntryCount: 1,
        matchingProjectionEntryCount: 1,
      },
    });

    await expect(persistedMismatch.service.probe({ actor: owner })).resolves.toMatchObject({
      status: IDENTITY_SOURCE_PROJECTION_PROBE_STATUS.BLOCKED_PERSISTED_PROJECTION_MISMATCH,
      idD: { authorized: false, blocked: true, blocker: 'PERSISTED_PROJECTION_MISMATCH' },
      safety: { providerRead: false, dataMutation: false },
    });
    expect(persistedMismatch.reconciliation.preview).not.toHaveBeenCalled();
    expect(persistedMismatch.source.readProjectionSummary).not.toHaveBeenCalled();

    const idcMismatch = context({
      plan: idcPlan({
        source: { acceptedProjectionCount: 1, rejectedSourceRowCount: 2, projectionDiscrepancy: 1 },
      }),
    });

    await expect(idcMismatch.service.probe({ actor: owner })).resolves.toMatchObject({
      status: IDENTITY_SOURCE_PROJECTION_PROBE_STATUS.BLOCKED_ID_C_RECONCILIATION_MISMATCH,
      idD: { authorized: false, blocked: true, blocker: 'ID_C_RECONCILIATION_MISMATCH' },
      safety: { providerRead: false, dataMutation: false },
    });
    expect(idcMismatch.source.readProjectionSummary).not.toHaveBeenCalled();
  });

  it('requires the exact live fingerprint and all validated source counts to match before it can report read-only agreement', async () => {
    const { service, source } = context({
      live: {
        sourceFingerprint: 'SHA256-SYNTHETIC-CHANGED',
        sourceRowCount: 3,
        acceptedCount: 2,
        rejectionCount: 1,
        rows: [['PRIVATE-CHANGED-ROW']],
      },
    });

    await expect(service.probe({ actor: owner })).resolves.toMatchObject({
      status: IDENTITY_SOURCE_PROJECTION_PROBE_STATUS.BLOCKED_LIVE_SOURCE_MISMATCH,
      idD: { authorized: false, blocked: true, blocker: 'LIVE_SOURCE_MISMATCH' },
      safety: { providerRead: true, dataMutation: false, rawRowsPersisted: false, retryCount: 0 },
    });
    expect(source.readProjectionSummary).toHaveBeenCalledOnce();
  });

  it('treats a quarantine as an ID-D blocker even when every count and fingerprint agrees', async () => {
    const { service } = context({ plan: idcPlan({ status: 'READY_WITH_QUARANTINE', quarantineCount: 1 }) });

    await expect(service.probe({ actor: owner })).resolves.toMatchObject({
      status: IDENTITY_SOURCE_PROJECTION_PROBE_STATUS.BLOCKED_QUARANTINE,
      idc: { status: 'READY_WITH_QUARANTINE', quarantineCount: 1 },
      idD: { authorized: false, blocked: true, blocker: 'QUARANTINE' },
      safety: { dataMutation: false, providerRead: true },
    });
  });
});
