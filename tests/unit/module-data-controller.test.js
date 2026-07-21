import { describe, expect, it } from 'vitest';
import { createModuleDataController } from '../../src/app/module-data-controller.js';
import { createBootstrapModuleFixture } from '../fixtures/essential-bootstrap-fixtures.js';

describe('lazy module data controller', () => {
  it('deduplicates identical in-flight reads', async () => {
    let calls = 0;
    let receivedRequest;
    const controller = createModuleDataController({
      load: async (_module, request) => { calls += 1; receivedRequest = request; await Promise.resolve(); return createBootstrapModuleFixture({ requestOnly: request.requestOnly }); },
    });

    const [first, second] = await Promise.all([
      controller.load('request', { page: 1, pageSize: 10 }),
      controller.load('request', { page: 1, pageSize: 10 }),
    ]);

    expect(calls).toBe(1);
    expect(receivedRequest.requestOnly).toBe(false);
    expect(first).toEqual(second);
    expect(controller.stats().inFlight).toBe(0);

    await controller.load('request', { requestOnly: true });
    expect(receivedRequest.requestOnly).toBe(true);
  });

  it('rejects unsupported module query bounds before invoking the loader', () => {
    const load = () => createBootstrapModuleFixture();
    const controller = createModuleDataController({ load, maxPageSize: 20 });

    expect(() => controller.load('unknown', {})).toThrowError(/unsupported/i);
    expect(() => controller.load('request', { page: 0 })).toThrowError(/page/i);
    expect(() => controller.load('request', { pageSize: 21 })).toThrowError(/page size/i);
    expect(() => controller.load('request', { query: 'x'.repeat(81) })).toThrowError(/query/i);
    expect(() => controller.load('overview', { committeeId: 'COM FOOD' })).toThrowError(/committee/i);
  });

  it('keeps committee context in the bounded request and cache key', async () => {
    const received = [];
    const controller = createModuleDataController({
      load: async (_module, request) => {
        received.push(request);
        return createBootstrapModuleFixture({ module: 'overview', cacheSafe: false });
      },
    });

    await controller.load('overview', { committeeId: 'COM_FOOD' });
    await controller.load('overview', { committeeId: 'COM_MATERIALS' });

    expect(received.map((request) => request.committeeId)).toEqual(['COM_FOOD', 'COM_MATERIALS']);
  });

  it('caches only bounded public-reference responses and expires them using the injected clock', async () => {
    let now = 0;
    let calls = 0;
    const controller = createModuleDataController({
      now: () => now,
      load: async () => { calls += 1; return createBootstrapModuleFixture({ cacheSafe: true }); },
    });

    await controller.load('request', {});
    await controller.load('request', {});
    expect(calls).toBe(1);
    expect(controller.stats().cacheEntries).toBe(1);

    now = 300_000;
    await controller.load('request', {});
    expect(calls).toBe(2);
  });

  it('does not retain session-operational responses and evicts oldest safe entries', async () => {
    let calls = 0;
    const controller = createModuleDataController({
      maxEntries: 1,
      load: async (module) => {
        calls += 1;
        return createBootstrapModuleFixture({ module, cacheSafe: true });
      },
    });
    await controller.load('request', {});
    await controller.load('inventory', {});
    await controller.load('request', {});
    expect(calls).toBe(3);
    expect(controller.stats().cacheEntries).toBe(1);

    const privateController = createModuleDataController({
      load: async () => { calls += 1; return createBootstrapModuleFixture({ cacheSafe: false }); },
    });
    await privateController.load('request', {});
    await privateController.load('request', {});
    expect(privateController.stats().cacheEntries).toBe(0);
  });

  it('cancels a late response without committing it', async () => {
    let resolve;
    const pendingResponse = new Promise((finish) => { resolve = finish; });
    const controller = createModuleDataController({ load: () => pendingResponse });
    const pending = controller.load('request', {});
    await Promise.resolve();
    controller.cancel('request', {});
    resolve(createBootstrapModuleFixture());

    await expect(pending).rejects.toMatchObject({ code: 'MODULE_LOAD_CANCELLED' });
    expect(controller.stats().cacheEntries).toBe(0);
  });

  it('starts a fresh read when a cancelled in-flight request is followed by the same query', async () => {
    let calls = 0;
    const resolvers = [];
    const controller = createModuleDataController({
      load: () => {
        calls += 1;
        return new Promise((resolve) => resolvers.push(resolve));
      },
    });

    const first = controller.load('request', {});
    await Promise.resolve();
    controller.cancel('request', {});
    const second = controller.load('request', {});
    await Promise.resolve();
    expect(calls).toBe(2);

    resolvers[0](createBootstrapModuleFixture());
    await expect(first).rejects.toMatchObject({ code: 'MODULE_LOAD_CANCELLED' });
    resolvers[1](createBootstrapModuleFixture());
    await expect(second).resolves.toEqual(expect.objectContaining({ module: 'request' }));
  });
});
