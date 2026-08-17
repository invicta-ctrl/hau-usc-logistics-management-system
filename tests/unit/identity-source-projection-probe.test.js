import { describe, expect, it, vi } from 'vitest';
import { ROLES } from '../../src/domain/constants.js';
import {
  IDENTITY_SOURCE_PROJECTION_PROBE_STATUS,
  SOURCE_PROJECTION_PROBE_REQUEST_TIMEOUT_MS,
  SOURCE_PROJECTION_PROBE_TOTAL_TIMEOUT_MS,
  createIdentitySourceProjectionProbeService,
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
} = {}) {
  const source = { readProjectionSummary: vi.fn(async () => structuredClone(live)) };
  const repository = { readLatestAppliedCounts: vi.fn(async () => structuredClone(persisted)) };
  const reconciliation = { preview: vi.fn(async () => structuredClone(plan)) };
  const setTimeoutImpl = vi.fn(() => Symbol('timer'));
  const clearTimeoutImpl = vi.fn();
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

describe('identity source-projection probe', () => {
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
