import { ROLES } from '../../domain/constants.js';
import { IDENTITY_FOUNDATION_RECONCILIATION_STATUS } from './reconciliation.js';

export const SOURCE_PROJECTION_PROBE_REQUEST_TIMEOUT_MS = 8_000;
export const SOURCE_PROJECTION_PROBE_TOTAL_TIMEOUT_MS = 20_000;

export const IDENTITY_SOURCE_PROJECTION_PROBE_STATUS = Object.freeze({
  COUNTS_MATCH_READ_ONLY: 'COUNTS_MATCH_READ_ONLY',
  BLOCKED_NO_APPLIED_PROJECTION: 'BLOCKED_NO_APPLIED_PROJECTION',
  BLOCKED_PERSISTED_PROJECTION_MISMATCH: 'BLOCKED_PERSISTED_PROJECTION_MISMATCH',
  BLOCKED_ID_C_RECONCILIATION_MISMATCH: 'BLOCKED_ID_C_RECONCILIATION_MISMATCH',
  BLOCKED_LIVE_SOURCE_MISMATCH: 'BLOCKED_LIVE_SOURCE_MISMATCH',
  BLOCKED_QUARANTINE: 'BLOCKED_QUARANTINE',
});

export class IdentitySourceProjectionProbeError extends Error {
  constructor(code, { status = 400 } = {}) {
    super('The identity source-projection probe request is not authorized.');
    this.name = 'IdentitySourceProjectionProbeError';
    this.code = code;
    this.status = status;
  }
}

const MAX_COUNT = 1_000_000;

function fail(code, options) {
  throw new IdentitySourceProjectionProbeError(code, options);
}

function assertOwner(actor) {
  if (String(actor?.roleId ?? '').toUpperCase() !== ROLES.SYSTEM_OWNER) {
    fail('IDENTITY_SOURCE_PROJECTION_OWNER_REQUIRED', { status: 403 });
  }
}

function finiteCount(value) {
  const count = Number(value);
  if (!Number.isSafeInteger(count) || count < 0 || count > MAX_COUNT) {
    fail('IDENTITY_SOURCE_PROJECTION_PROBE_COUNT_INVALID', { status: 409 });
  }
  return count;
}

function sourceFingerprint(value) {
  const fingerprint = String(value ?? '').trim();
  if (!fingerprint || fingerprint.length > 512) {
    fail('IDENTITY_SOURCE_PROJECTION_PROBE_COUNT_INVALID', { status: 409 });
  }
  return fingerprint;
}

function sourceCounts(value, { includeProjection = false } = {}) {
  const counts = {
    sourceRowCount: finiteCount(value?.sourceRowCount),
    acceptedCount: finiteCount(value?.acceptedCount),
    rejectionCount: finiteCount(value?.rejectionCount),
  };
  if (counts.sourceRowCount !== counts.acceptedCount + counts.rejectionCount) {
    fail('IDENTITY_SOURCE_PROJECTION_PROBE_COUNT_INVALID', { status: 409 });
  }
  if (!includeProjection) return Object.freeze(counts);

  const projection = Object.freeze({
    ...counts,
    currentProjectionEntryCount: finiteCount(value?.currentProjectionEntryCount),
    matchingProjectionEntryCount: finiteCount(value?.matchingProjectionEntryCount),
  });
  return projection;
}

function persistedSummary(value) {
  if (!value) return null;
  return Object.freeze({
    sourceFingerprint: sourceFingerprint(value.sourceFingerprint),
    ...sourceCounts(value, { includeProjection: true }),
  });
}

function idcSummary(plan) {
  const source = plan?.source;
  const summary = Object.freeze({
    status: String(plan?.status ?? '').trim(),
    quarantineCount: finiteCount(plan?.candidates?.quarantineCount),
    ...sourceCounts(
      {
        sourceRowCount: source?.sourceRowCount,
        acceptedCount: source?.acceptedProjectionCount,
        rejectionCount: source?.rejectedSourceRowCount,
        currentProjectionEntryCount: source?.currentProjectionEntryCount,
        matchingProjectionEntryCount: source?.matchingProjectionEntryCount,
      },
      { includeProjection: true },
    ),
    projectionDiscrepancy: finiteCount(source?.projectionDiscrepancy),
  });
  return summary;
}

function sameCountSummary(left, right) {
  return (
    left.sourceRowCount === right.sourceRowCount &&
    left.acceptedCount === right.acceptedCount &&
    left.rejectionCount === right.rejectionCount
  );
}

function sameProjectionSummary(left, right) {
  return (
    sameCountSummary(left, right) &&
    left.currentProjectionEntryCount === right.currentProjectionEntryCount &&
    left.matchingProjectionEntryCount === right.matchingProjectionEntryCount
  );
}

function consistentPersistedProjection(summary) {
  return (
    summary.acceptedCount === summary.currentProjectionEntryCount &&
    summary.acceptedCount === summary.matchingProjectionEntryCount
  );
}

function publicCounts({ live = null, persisted = null, idc = null } = {}) {
  const safeSource = (summary) =>
    summary
      ? Object.freeze({
          sourceRowCount: summary.sourceRowCount,
          acceptedCount: summary.acceptedCount,
          rejectionCount: summary.rejectionCount,
        })
      : null;
  const safeProjection = (summary) =>
    summary
      ? Object.freeze({
          ...safeSource(summary),
          currentProjectionEntryCount: summary.currentProjectionEntryCount,
          matchingProjectionEntryCount: summary.matchingProjectionEntryCount,
        })
      : null;
  return Object.freeze({
    live: safeSource(live),
    persisted: safeProjection(persisted),
    idc: safeProjection(idc),
  });
}

function safeResult({ status, live = null, persisted = null, idc = null, providerRead, blocker }) {
  return Object.freeze({
    status,
    counts: publicCounts({ live, persisted, idc }),
    idc: Object.freeze({
      status: idc?.status ?? 'NOT_EVALUATED',
      quarantineCount: idc?.quarantineCount ?? 0,
    }),
    idD: Object.freeze({ authorized: false, blocked: true, blocker }),
    safety: Object.freeze({
      dataMutation: false,
      providerRead: providerRead === true,
      rawRowsPersisted: false,
      retryCount: 0,
      requestTimeoutMs: SOURCE_PROJECTION_PROBE_REQUEST_TIMEOUT_MS,
      overallTimeoutMs: SOURCE_PROJECTION_PROBE_TOTAL_TIMEOUT_MS,
    }),
  });
}

async function withinOverallTimeout(read, { setTimeoutImpl, clearTimeoutImpl }) {
  const controller = new AbortController();
  let timer;
  const deadline = new Promise((_, reject) => {
    timer = setTimeoutImpl(() => {
      controller.abort();
      reject(
        new IdentitySourceProjectionProbeError('IDENTITY_SOURCE_PROJECTION_PROBE_TIMEOUT', { status: 504 }),
      );
    }, SOURCE_PROJECTION_PROBE_TOTAL_TIMEOUT_MS);
  });
  try {
    return await Promise.race([Promise.resolve().then(() => read(controller.signal)), deadline]);
  } finally {
    clearTimeoutImpl(timer);
  }
}

function assertOverallDeadlineNotAborted(signal) {
  if (signal.aborted) {
    fail('IDENTITY_SOURCE_PROJECTION_PROBE_TIMEOUT', { status: 504 });
  }
}

export function createIdentitySourceProjectionProbeService({
  source,
  repository,
  reconciliation,
  executionAuthorized = false,
  setTimeoutImpl = globalThis.setTimeout,
  clearTimeoutImpl = globalThis.clearTimeout,
} = {}) {
  if (
    typeof source?.readProjectionSummary !== 'function' ||
    typeof repository?.readLatestAppliedCounts !== 'function' ||
    typeof reconciliation?.preview !== 'function'
  ) {
    throw new Error('Identity source-projection probe dependencies are required.');
  }

  return Object.freeze({
    async probe({ actor } = {}) {
      assertOwner(actor);
      if (executionAuthorized !== true) {
        fail('IDENTITY_SOURCE_PROJECTION_PROBE_EXECUTION_BLOCKED', { status: 423 });
      }

      return withinOverallTimeout(
        async (signal) => {
          const persistedRecord = await repository.readLatestAppliedCounts();
          assertOverallDeadlineNotAborted(signal);
          const persisted = persistedSummary(persistedRecord);
          if (!persisted) {
            return safeResult({
              status: IDENTITY_SOURCE_PROJECTION_PROBE_STATUS.BLOCKED_NO_APPLIED_PROJECTION,
              providerRead: false,
              blocker: 'NO_APPLIED_PROJECTION',
            });
          }
          if (!consistentPersistedProjection(persisted)) {
            return safeResult({
              status: IDENTITY_SOURCE_PROJECTION_PROBE_STATUS.BLOCKED_PERSISTED_PROJECTION_MISMATCH,
              persisted,
              providerRead: false,
              blocker: 'PERSISTED_PROJECTION_MISMATCH',
            });
          }

          const reconciliationPlan = await reconciliation.preview({ actor });
          assertOverallDeadlineNotAborted(signal);
          const idc = idcSummary(reconciliationPlan);
          const idcReady = [
            IDENTITY_FOUNDATION_RECONCILIATION_STATUS.READY,
            IDENTITY_FOUNDATION_RECONCILIATION_STATUS.READY_WITH_QUARANTINE,
          ].includes(idc.status);
          if (
            !idcReady ||
            idc.projectionDiscrepancy !== 0 ||
            !sameProjectionSummary(idc, persisted) ||
            !consistentPersistedProjection(idc)
          ) {
            return safeResult({
              status: IDENTITY_SOURCE_PROJECTION_PROBE_STATUS.BLOCKED_ID_C_RECONCILIATION_MISMATCH,
              persisted,
              idc,
              providerRead: false,
              blocker: 'ID_C_RECONCILIATION_MISMATCH',
            });
          }

          let live;
          try {
            const summary = await source.readProjectionSummary({
              requestTimeoutMs: SOURCE_PROJECTION_PROBE_REQUEST_TIMEOUT_MS,
              signal,
            });
            assertOverallDeadlineNotAborted(signal);
            live = Object.freeze({
              sourceFingerprint: sourceFingerprint(summary?.sourceFingerprint),
              ...sourceCounts(summary),
            });
          } catch (error) {
            if (error instanceof IdentitySourceProjectionProbeError) throw error;
            if (signal.aborted || String(error?.code ?? '') === 'ROSTER_SOURCE_TIMEOUT') {
              fail('IDENTITY_SOURCE_PROJECTION_PROBE_TIMEOUT', { status: 504 });
            }
            fail('IDENTITY_SOURCE_PROJECTION_PROBE_SOURCE_UNAVAILABLE', { status: 502 });
          }

          if (live.sourceFingerprint !== persisted.sourceFingerprint || !sameCountSummary(live, persisted)) {
            return safeResult({
              status: IDENTITY_SOURCE_PROJECTION_PROBE_STATUS.BLOCKED_LIVE_SOURCE_MISMATCH,
              live,
              persisted,
              idc,
              providerRead: true,
              blocker: 'LIVE_SOURCE_MISMATCH',
            });
          }
          if (idc.quarantineCount > 0) {
            return safeResult({
              status: IDENTITY_SOURCE_PROJECTION_PROBE_STATUS.BLOCKED_QUARANTINE,
              live,
              persisted,
              idc,
              providerRead: true,
              blocker: 'QUARANTINE',
            });
          }
          return safeResult({
            status: IDENTITY_SOURCE_PROJECTION_PROBE_STATUS.COUNTS_MATCH_READ_ONLY,
            live,
            persisted,
            idc,
            providerRead: true,
            blocker: 'NOT_AUTHORIZED',
          });
        },
        { setTimeoutImpl, clearTimeoutImpl },
      );
    },
  });
}
