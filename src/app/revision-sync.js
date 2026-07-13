export function normalizeRevisionPayload(payload) {
  const source = payload?.data ?? payload ?? {};
  const revision = Number(source.revision || 0);
  return {
    revision: Number.isFinite(revision) && revision >= 0 ? Math.floor(revision) : 0,
    updatedAt: String(source.updatedAt || ''),
    environment: String(source.environment || ''),
  };
}

export const revisionChanged = (accepted, incoming) => (
  normalizeRevisionPayload(incoming).revision > normalizeRevisionPayload(accepted).revision
);

export const backoffDelayMs = (failures, baseMs = 5_000, maxMs = 30_000) => (
  Math.min(maxMs, baseMs * (2 ** Math.max(0, Number(failures || 0))))
);

export function createRevisionPoller(options) {
  const {
    readRevision,
    onRevision,
    onStatus = () => {},
    isVisible = () => true,
    isOnline = () => true,
    schedule = (callback, delay) => setTimeout(callback, delay),
    cancel = (timer) => clearTimeout(timer),
    intervalMs = 5_000,
  } = options;
  let timer = null;
  let running = false;
  let inFlight = false;
  let failures = 0;

  const clear = () => {
    if (timer != null) cancel(timer);
    timer = null;
  };
  const queue = (delay = intervalMs) => {
    clear();
    if (!running || !isVisible() || !isOnline()) return;
    timer = schedule(() => { void check('poll'); }, delay);
  };
  const check = async (reason = 'manual') => {
    if (!running || inFlight || !isVisible() || !isOnline()) return false;
    inFlight = true;
    onStatus('checking');
    try {
      const revision = normalizeRevisionPayload(await readRevision());
      failures = 0;
      const accepted = await onRevision(revision, reason);
      if (accepted !== false) onStatus('synced');
      queue();
      return true;
    } catch (error) {
      failures += 1;
      onStatus('delayed', error);
      queue(backoffDelayMs(failures - 1, intervalMs));
      return false;
    } finally {
      inFlight = false;
    }
  };
  return {
    start() {
      running = true;
      if (!isOnline()) onStatus('offline');
      else queue();
    },
    stop() { running = false; clear(); },
    pause(status = 'offline') { clear(); onStatus(status); },
    resume(reason = 'resume') { if (running) { clear(); return check(reason); } return Promise.resolve(false); },
    check,
    get inFlight() { return inFlight; },
    get failures() { return failures; },
  };
}
