const PRELOAD_ERROR_EVENT = 'vite:preloadError';
const RECOVERY_STORAGE_KEY = 'hau:stale-chunk-recovery-at';
const DEFAULT_COOLDOWN_MS = 60_000;
const installedTargets = new WeakMap();

/**
 * Reload once when an already-open tab requests a chunk that no longer exists
 * after a deployment. Vite documents preventDefault() as the way to suppress
 * the stale import error after the application takes responsibility for it.
 */
export function installStaleChunkRecovery(
  target = globalThis.window,
  { cooldownMs = DEFAULT_COOLDOWN_MS, now = () => Date.now() } = {},
) {
  if (!target?.addEventListener || !target?.location?.reload) return () => {};
  if (installedTargets.has(target)) return installedTargets.get(target);

  let lastRecoveryAt = null;
  const onPreloadError = (event) => {
    event.preventDefault?.();
    const currentTime = now();
    let storedRecoveryAt = null;
    try {
      const stored = target.sessionStorage?.getItem(RECOVERY_STORAGE_KEY);
      storedRecoveryAt = stored === null || stored === undefined ? null : Number(stored);
    } catch {
      // Privacy modes can deny sessionStorage. The in-memory guard still
      // prevents a same-document reload storm.
    }
    const mostRecentRecovery = Math.max(
      Number.isFinite(storedRecoveryAt) ? storedRecoveryAt : 0,
      Number.isFinite(lastRecoveryAt) ? lastRecoveryAt : 0,
    );
    if (mostRecentRecovery > 0 && currentTime - mostRecentRecovery < cooldownMs) return;

    lastRecoveryAt = currentTime;
    try {
      target.sessionStorage?.setItem(RECOVERY_STORAGE_KEY, String(currentTime));
    } catch {
      // The in-memory timestamp above remains the bounded fallback.
    }
    target.location.reload();
  };

  target.addEventListener(PRELOAD_ERROR_EVENT, onPreloadError);
  const dispose = () => {
    target.removeEventListener?.(PRELOAD_ERROR_EVENT, onPreloadError);
    installedTargets.delete(target);
  };
  installedTargets.set(target, dispose);
  return dispose;
}

export const staleChunkRecoveryContract = Object.freeze({
  eventName: PRELOAD_ERROR_EVENT,
  storageKey: RECOVERY_STORAGE_KEY,
  cooldownMs: DEFAULT_COOLDOWN_MS,
});
