export const REVISION_SCOPES = Object.freeze([
  'overview',
  'request',
  'lending',
  'release',
  'restocking',
  'procurement',
  'inventory',
]);

export const DEFAULT_REVISION_INTERVAL_MS = 15_000;
export const DEFAULT_STALE_AFTER_MS = 60_000;
export const MAX_REVISION_BACKOFF_MS = 120_000;

const nonNegativeInteger = (value) => {
  const number = Number(value);
  return Number.isFinite(number) && number >= 0 ? Math.floor(number) : 0;
};

export function normalizeRevisionPayload(payload) {
  const source = payload?.data ?? payload ?? {};
  return {
    revision: nonNegativeInteger(source.revision),
    updatedAt: String(source.updatedAt || ''),
    environment: String(source.environment || ''),
  };
}

export function normalizeScopedRevisionPayload(payload, expectedScope = '') {
  const source = payload?.data ?? payload ?? {};
  const scope = String(source.scope || '').trim().toLowerCase();
  if (source.contract !== 'scoped-revision' || Number(source.contractVersion) !== 1)
    throw Object.assign(new Error('The revision response used an unsupported contract.'), {
      code: 'REVISION_CONTRACT_INVALID',
    });
  if (!REVISION_SCOPES.includes(scope) || (expectedScope && scope !== expectedScope))
    throw Object.assign(new Error('The revision response did not match the active module.'), {
      code: 'REVISION_SCOPE_MISMATCH',
    });
  const metrics = source.metrics && typeof source.metrics === 'object' ? source.metrics : {};
  return {
    contract: 'scoped-revision',
    contractVersion: 1,
    enabled: source.enabled === true,
    scope,
    token: nonNegativeInteger(source.token),
    globalRevision: nonNegativeInteger(source.globalRevision),
    updatedAt: String(source.updatedAt || ''),
    environment: String(source.environment || ''),
    metrics: {
      revisionReads: nonNegativeInteger(metrics.revisionReads),
      moduleReads: nonNegativeInteger(metrics.moduleReads),
      requestCount: nonNegativeInteger(metrics.requestCount),
    },
  };
}

export const revisionChanged = (accepted, incoming) => {
  if (incoming?.token !== undefined || accepted?.token !== undefined)
    return nonNegativeInteger(incoming?.token) > nonNegativeInteger(accepted?.token);
  return normalizeRevisionPayload(incoming).revision > normalizeRevisionPayload(accepted).revision;
};

export const backoffDelayMs = (
  failures,
  baseMs = DEFAULT_REVISION_INTERVAL_MS,
  maxMs = MAX_REVISION_BACKOFF_MS,
) => Math.min(maxMs, baseMs * (2 ** Math.max(0, Number(failures || 0))));

export const jitterDelayMs = (baseMs, { ratio = 0.1, random = Math.random } = {}) => {
  const boundedRatio = Math.min(0.25, Math.max(0, Number(ratio || 0)));
  const unit = Math.min(1, Math.max(0, Number(random())));
  return Math.max(0, Math.round(Number(baseMs) * (1 + ((unit * 2) - 1) * boundedRatio)));
};

export function modelNearLiveLoad({ sessions, hours = 1, intervalMs = DEFAULT_REVISION_INTERVAL_MS, changedTicks = 0 }) {
  const activeSessions = nonNegativeInteger(sessions);
  const durationHours = Math.max(0, Number(hours || 0));
  const cadence = Math.max(1, Number(intervalMs || DEFAULT_REVISION_INTERVAL_MS));
  const revisionRequests = Math.floor((durationHours * 3_600_000) / cadence) * activeSessions;
  const moduleRequests = Math.min(revisionRequests, nonNegativeInteger(changedTicks) * activeSessions);
  return {
    sessions: activeSessions,
    hours: durationHours,
    intervalMs: cadence,
    revisionRequests,
    revisionReads: revisionRequests,
    moduleRequests,
    unchangedModuleRequests: 0,
    totalRequests: revisionRequests + moduleRequests,
  };
}

export function createRevisionPoller(options) {
  const {
    readRevision,
    onRevision,
    onStatus = () => {},
    onMetrics = () => {},
    getScope = () => 'overview',
    isVisible = () => true,
    isOnline = () => true,
    isActive = () => true,
    schedule = (callback, delay) => setTimeout(callback, delay),
    cancel = (timer) => clearTimeout(timer),
    now = () => Date.now(),
    random = Math.random,
    intervalMs = DEFAULT_REVISION_INTERVAL_MS,
    staleAfterMs = DEFAULT_STALE_AFTER_MS,
    maxBackoffMs = MAX_REVISION_BACKOFF_MS,
    jitterRatio = 0.1,
  } = options;
  let timer = null;
  let running = false;
  let inFlight = false;
  let failures = 0;
  let automaticEnabled = true;
  let lastSuccessAt = 0;
  let issued = 0;
  const totals = { revisionReads: 0, moduleReads: 0, requestCount: 0 };

  const clear = () => {
    if (timer != null) cancel(timer);
    timer = null;
  };
  const eligible = (reason) => (
    running
    && isVisible()
    && isOnline()
    && (reason === 'manual' || isActive())
    && (automaticEnabled || reason === 'manual')
  );
  const reportStatus = (status, detail = {}) => {
    const stale = lastSuccessAt > 0 && now() - lastSuccessAt >= staleAfterMs;
    onStatus(stale && ['delayed', 'checking'].includes(status) ? 'stale' : status, {
      ...detail,
      stale,
      lastSuccessAt,
    });
  };
  const queue = (delay = intervalMs) => {
    clear();
    if (!eligible('poll')) return;
    timer = schedule(
      () => { void check('poll'); },
      jitterDelayMs(delay, { ratio: jitterRatio, random }),
    );
  };
  const check = async (reason = 'manual') => {
    if (inFlight || !eligible(reason)) return false;
    const scope = String(getScope() || '').trim().toLowerCase();
    if (!REVISION_SCOPES.includes(scope)) return false;
    const requestId = ++issued;
    inFlight = true;
    reportStatus('checking', { reason, scope });
    try {
      const revision = normalizeScopedRevisionPayload(
        await readRevision(scope, { reason, requestId }),
        scope,
      );
      if (requestId !== issued || scope !== getScope()) return false;
      for (const key of Object.keys(totals)) totals[key] += revision.metrics[key];
      onMetrics({ ...totals }, revision);
      failures = 0;
      lastSuccessAt = now();
      automaticEnabled = revision.enabled;
      if (!automaticEnabled) {
        clear();
        reportStatus('manual-only', { reason, scope, revision });
        return true;
      }
      const accepted = await onRevision(revision, reason);
      if (accepted === false) {
        clear();
        reportStatus('updates-available', { reason, scope, revision });
        return false;
      }
      reportStatus('synced', { reason, scope, revision });
      queue();
      return true;
    } catch (error) {
      failures += 1;
      reportStatus('delayed', { reason, scope, error });
      queue(backoffDelayMs(failures - 1, intervalMs, maxBackoffMs));
      return false;
    } finally {
      inFlight = false;
    }
  };
  return {
    start() {
      running = true;
      if (!isOnline()) reportStatus('offline');
      else queue();
    },
    stop() { running = false; clear(); issued += 1; },
    pause(status = 'offline') { clear(); reportStatus(status); },
    resume(reason = 'resume') {
      if (!running || (!automaticEnabled && reason !== 'manual')) return Promise.resolve(false);
      clear();
      return check(reason);
    },
    check,
    get inFlight() { return inFlight; },
    get failures() { return failures; },
    get automaticEnabled() { return automaticEnabled; },
    get metrics() { return { ...totals }; },
  };
}
