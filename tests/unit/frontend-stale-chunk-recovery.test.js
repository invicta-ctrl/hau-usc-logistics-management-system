import { describe, expect, it, vi } from 'vitest';
import {
  installStaleChunkRecovery,
  staleChunkRecoveryContract,
} from '../../src/frontend/app/installStaleChunkRecovery.js';

function fakeWindow({ storageAvailable = true } = {}) {
  const listeners = new Map();
  const values = new Map();
  const target = {
    addEventListener(name, listener) {
      listeners.set(name, listener);
    },
    removeEventListener(name, listener) {
      if (listeners.get(name) === listener) listeners.delete(name);
    },
    location: { reload: vi.fn() },
    sessionStorage: {
      getItem(key) {
        if (!storageAvailable) throw new Error('storage unavailable');
        return values.get(key) ?? null;
      },
      setItem(key, value) {
        if (!storageAvailable) throw new Error('storage unavailable');
        values.set(key, value);
      },
    },
    dispatch(name, event) {
      listeners.get(name)?.(event);
    },
  };
  return target;
}

describe('stale dynamic chunk recovery', () => {
  it('prevents the preload error and reloads at most once per cooldown', () => {
    const target = fakeWindow();
    let time = 1_000;
    const dispose = installStaleChunkRecovery(target, { now: () => time });
    const event = { preventDefault: vi.fn() };

    target.dispatch(staleChunkRecoveryContract.eventName, event);
    target.dispatch(staleChunkRecoveryContract.eventName, event);
    expect(event.preventDefault).toHaveBeenCalledTimes(2);
    expect(target.location.reload).toHaveBeenCalledTimes(1);

    time += staleChunkRecoveryContract.cooldownMs + 1;
    target.dispatch(staleChunkRecoveryContract.eventName, event);
    expect(target.location.reload).toHaveBeenCalledTimes(2);

    dispose();
    target.dispatch(staleChunkRecoveryContract.eventName, event);
    expect(target.location.reload).toHaveBeenCalledTimes(2);
  });

  it('retains an in-memory loop guard when session storage is unavailable', () => {
    const target = fakeWindow({ storageAvailable: false });
    installStaleChunkRecovery(target, { now: () => 5_000 });
    const event = { preventDefault: vi.fn() };

    target.dispatch(staleChunkRecoveryContract.eventName, event);
    target.dispatch(staleChunkRecoveryContract.eventName, event);

    expect(target.location.reload).toHaveBeenCalledTimes(1);
    expect(event.preventDefault).toHaveBeenCalledTimes(2);
  });

  it('installs only one handler per window-like target', () => {
    const target = fakeWindow();
    const first = installStaleChunkRecovery(target);
    const second = installStaleChunkRecovery(target);

    expect(second).toBe(first);
    first();
  });
});
