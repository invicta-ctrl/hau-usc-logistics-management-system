import { afterEach, describe, expect, it, vi } from 'vitest';
import { AppsScriptAdapter } from '../../src/services/apps-script-adapter.js';

function runnerFor(result) {
  let success;
  let proxy;
  const runner = {
    withSuccessHandler(handler) { success = handler; return proxy; },
    withFailureHandler() { return proxy; },
  };
  proxy = new Proxy(runner, { get(target, property) { if (property in target) return target[property]; return () => queueMicrotask(() => success(result)); } });
  return proxy;
}

afterEach(() => { delete globalThis.google; vi.useRealTimers(); });

describe('AppsScriptAdapter', () => {
  it('routes essential and module bootstrap reads through the sole Apps Script adapter', async () => {
    const calls = [];
    let success;
    let proxy;
    const runner = {
      withSuccessHandler(handler) { success = handler; return proxy; },
      withFailureHandler() { return proxy; },
    };
    proxy = new Proxy(runner, {
      get(target, property) {
        if (property in target) return target[property];
        return (command) => { calls.push({ method: property, command }); queueMicrotask(() => success({ ok: true, data: {} })); };
      },
    });
    globalThis.google = { script: { run: proxy } };

    const adapter = new AppsScriptAdapter();
    await adapter.getEssentialBootstrapData({ requestOnly: true });
    await adapter.getBootstrapModule({ module: 'request', page: 1 });

    expect(calls).toEqual([
      { method: 'api_getEssentialBootstrapData', command: { requestOnly: true } },
      { method: 'api_getBootstrapModule', command: { module: 'request', page: 1 } },
    ]);
  });

  it('normalizes successful server responses', async () => {
    globalThis.google = { script: { run: runnerFor({ ok: true, correlationId: 'COR-1', requestId: 'LREQ-2026-0001' }) } };
    await expect(new AppsScriptAdapter().submitRequest({ clientRequestId: 'client-1' })).resolves.toEqual(expect.objectContaining({ requestId: 'LREQ-2026-0001' }));
  });

  it('clones cross-realm Apps Script responses before contract validation', async () => {
    const result = Object.create({ inherited: true });
    result.ok = true;
    result.data = Object.assign(Object.create({ inherited: true }), { version: '0.5.0' });
    globalThis.google = { script: { run: runnerFor(result) } };

    const response = await new AppsScriptAdapter().getBootstrapData({ requestOnly: false });

    expect(Object.getPrototypeOf(response)).toBe(Object.prototype);
    expect(response.data).toMatchObject({ version: '0.5.0' });
  });

  it('preserves safe error codes, retryability, and correlation IDs', async () => {
    globalThis.google = { script: { run: runnerFor({ ok: false, code: 'INSUFFICIENT_STOCK', message: 'Only 3 pieces are available to promise.', retryable: false, correlationId: 'COR-2' }) } };
    await expect(new AppsScriptAdapter().reserveStock({ clientRequestId: 'client-2' })).rejects.toMatchObject({ code: 'INSUFFICIENT_STOCK', correlationId: 'COR-2', retryable: false });
  });

  it('allows a slow read-only bootstrap module without relaxing mutation timeouts', async () => {
    vi.useFakeTimers();
    let success;
    let proxy;
    const runner = {
      withSuccessHandler(handler) { success = handler; return proxy; },
      withFailureHandler() { return proxy; },
    };
    proxy = new Proxy(runner, {
      get(target, property) {
        if (property in target) return target[property];
        return () => setTimeout(() => success({ ok: true, data: {} }), 40_000);
      },
    });
    globalThis.google = { script: { run: proxy } };

    const adapter = new AppsScriptAdapter();
    const moduleRead = adapter.getBootstrapModule({ module: 'overview' });
    await vi.advanceTimersByTimeAsync(40_000);
    await expect(moduleRead).resolves.toEqual({ ok: true, data: {} });

    const mutation = adapter.submitRequest({ clientRequestId: 'client-1' });
    const mutationResult = expect(mutation).rejects.toMatchObject({ code: 'BACKEND_TIMEOUT', retryable: true });
    await vi.advanceTimersByTimeAsync(30_000);
    await mutationResult;
  });

  it('keeps a timeout terminal when a late success callback arrives', async () => {
    let success;
    let failure;
    let proxy;
    const runner = {
      withSuccessHandler(handler) { success = handler; return proxy; },
      withFailureHandler(handler) { failure = handler; return proxy; },
    };
    proxy = new Proxy(runner, {
      get(target, property) {
        if (property in target) return target[property];
        return () => {};
      },
    });
    globalThis.google = { script: { run: proxy } };

    const pending = new AppsScriptAdapter({ timeoutMs: 5 }).getBootstrapData({ requestOnly: false });
    await expect(pending).rejects.toMatchObject({ code: 'BACKEND_TIMEOUT', retryable: true });
    success({ ok: true, data: { version: '0.5.0' } });
    failure(new Error('late failure is ignored by the settled promise'));
    await expect(pending).rejects.toMatchObject({ code: 'BACKEND_TIMEOUT' });
  });
});
