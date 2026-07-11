import { config } from './config.js';
import { createSeedState } from '../data/seed.js';
import { migrateState } from './migrations.js';

export function createStore({ storage = globalThis.localStorage } = {}) {
  let state;
  let warning = '';
  let corruptPayload = null;
  try {
    const raw = config.previewMode ? storage?.getItem(config.storageKey) : null;
    if (raw) {
      const migrated = migrateState(JSON.parse(raw));
      state = migrated.state;
      warning = migrated.warning;
    } else state = createSeedState();
  } catch (error) {
    corruptPayload = storage?.getItem(config.storageKey) ?? null;
    state = createSeedState();
    warning =
      'Stored preview data was corrupt. Safe demo data was restored; the original payload is available from Diagnostics.';
    console.error('Preview state recovery', error);
  }
  const listeners = new Set();
  const persist = () => {
    if (config.previewMode) storage?.setItem(config.storageKey, JSON.stringify(state));
  };
  const notify = (change = { views: ['active'], shared: true }) =>
    listeners.forEach((listener) => listener(state, change));
  return {
    getState: () => state,
    getWarning: () => warning,
    getCorruptPayload: () => corruptPayload,
    replace(next, change) {
      state = next;
      persist();
      notify(change);
    },
    update(mutator, change) {
      const next = structuredClone(state);
      mutator(next);
      state = next;
      persist();
      notify(change);
      return state;
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    reset() {
      state = createSeedState();
      warning = '';
      corruptPayload = null;
      persist();
      notify({ views: ['active'], shared: true });
    },
    export() {
      return JSON.stringify(state, null, 2);
    },
  };
}
