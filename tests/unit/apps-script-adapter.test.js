import { afterEach, describe, expect, it } from 'vitest';
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

afterEach(() => { delete globalThis.google; });

describe('AppsScriptAdapter', () => {
  it('normalizes successful server responses', async () => {
    globalThis.google = { script: { run: runnerFor({ ok: true, correlationId: 'COR-1', requestId: 'LREQ-2026-0001' }) } };
    await expect(new AppsScriptAdapter().submitRequest({ clientRequestId: 'client-1' })).resolves.toEqual(expect.objectContaining({ requestId: 'LREQ-2026-0001' }));
  });

  it('preserves safe error codes, retryability, and correlation IDs', async () => {
    globalThis.google = { script: { run: runnerFor({ ok: false, code: 'INSUFFICIENT_STOCK', message: 'Only 3 pieces are available to promise.', retryable: false, correlationId: 'COR-2' }) } };
    await expect(new AppsScriptAdapter().reserveStock({ clientRequestId: 'client-2' })).rejects.toMatchObject({ code: 'INSUFFICIENT_STOCK', correlationId: 'COR-2', retryable: false });
  });
});
