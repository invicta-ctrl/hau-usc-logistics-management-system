import { describe, expect, it } from 'vitest';
import {
  createStateFromEssentialBootstrap,
  mergeBootstrapModule,
  moduleDataKeys,
  validateBootstrapModule,
} from '../../src/app/bootstrap-contract.js';
import { renderRequests } from '../../src/features/requests/view.js';
import { RestService } from '../../src/services/rest-service.js';
import { LAUNCH_SERVICE_METHODS } from '../../src/services/launch-service-contract.js';
import {
  createBootstrapModuleFixture,
  createEssentialBootstrapFixture,
  createRequestQueueFixture,
} from '../fixtures/essential-bootstrap-fixtures.js';

/**
 * RV-01 regression boundary.
 *
 * These assert the authoritative Request module contract required by amendment
 * v0.7.2-RV-01: the internal Request module independently projects canonical
 * parent requests and request lines, replaces them in module state without
 * Overview, and renders them in the internal review queue.
 */
describe('RV-01 authoritative Request module projection', () => {
  it('allows the request module to carry canonical parent and line collections', () => {
    const keys = moduleDataKeys('request');
    expect(keys).toContain('requests');
    expect(keys).toContain('requestLines');
  });

  it('accepts an internal request module response containing the review queue', () => {
    const fixture = createBootstrapModuleFixture({ module: 'request', requestOnly: false, cacheSafe: false });
    fixture.data = { ...fixture.data, ...createRequestQueueFixture() };
    expect(validateBootstrapModule(fixture, { backendMode: 'mock', module: 'request' })).toBe(fixture);
  });

  it('replaces Request collections authoritatively without Overview loading first', () => {
    const essential = createEssentialBootstrapFixture({ backendMode: 'mock' });
    const state = createStateFromEssentialBootstrap(essential, { requestOnly: false });
    expect(state.requests).toEqual([]);

    const requestModule = createBootstrapModuleFixture({
      module: 'request',
      requestOnly: false,
      cacheSafe: false,
    });
    requestModule.data = { ...requestModule.data, ...createRequestQueueFixture() };

    const next = mergeBootstrapModule(state, requestModule, { backendMode: 'mock' });
    expect(next.requests).toHaveLength(1);
    expect(next.requests[0].id).toBe('REQ-RV01-001');
    expect(next.requestLines).toHaveLength(2);
    expect(next.requestLines.every((line) => line.requestId === 'REQ-RV01-001')).toBe(true);
  });

  it('drops stale rows outside the current page and scope on replacement', () => {
    const essential = createEssentialBootstrapFixture({ backendMode: 'mock' });
    let state = createStateFromEssentialBootstrap(essential, { requestOnly: false });
    state = { ...state, requests: [{ id: 'REQ-STALE-999' }], requestLines: [{ id: 'RL-STALE-999' }] };

    const requestModule = createBootstrapModuleFixture({
      module: 'request',
      requestOnly: false,
      cacheSafe: false,
    });
    requestModule.data = { ...requestModule.data, ...createRequestQueueFixture() };

    const next = mergeBootstrapModule(state, requestModule, { backendMode: 'mock' });
    expect(next.requests.map((request) => request.id)).not.toContain('REQ-STALE-999');
    expect(next.requestLines.map((line) => line.id)).not.toContain('RL-STALE-999');
  });

  it('renders the unassigned FOR_REVIEW request in the internal review queue', () => {
    const essential = createEssentialBootstrapFixture({ backendMode: 'mock' });
    const state = createStateFromEssentialBootstrap(essential, { requestOnly: false });
    const requestModule = createBootstrapModuleFixture({
      module: 'request',
      requestOnly: false,
      cacheSafe: false,
    });
    requestModule.data = { ...requestModule.data, ...createRequestQueueFixture() };
    const next = mergeBootstrapModule(state, requestModule, { backendMode: 'mock' });

    const html = renderRequests({ state: next, ui: { requestDraftLines: [] }, requestOnly: false });
    expect(html).toContain('REQ-RV01-001');
    expect(html).toContain('Review queue');
  });

  it('exposes the revision endpoints the already-open REST session polls', async () => {
    const service = new RestService('');
    expect(typeof service.getDataRevision).toBe('function');
    expect(typeof service.getScopedRevision).toBe('function');

    const calls = [];
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (url, init) => {
      calls.push({ url, body: JSON.parse(init.body) });
      return {
        ok: true,
        status: 200,
        json: async () => ({ ok: true, data: { contract: 'scoped-revision', contractVersion: 1 } }),
      };
    };
    try {
      await service.getScopedRevision({ scope: 'request' });
    } finally {
      globalThis.fetch = originalFetch;
    }
    expect(calls[0].url).toBe('/api/getScopedRevision');
    expect(calls[0].body).toEqual({ scope: 'request' });
  });

  it('keeps the launch service contract satisfied by the REST adapter revision methods', () => {
    const service = new RestService('');
    const missing = ['getDataRevision', 'getScopedRevision'].filter(
      (method) => typeof service[method] !== 'function',
    );
    expect(missing).toEqual([]);
    expect(LAUNCH_SERVICE_METHODS).toContain('getScopedRevision');
  });

  it('keeps the public request-only contract free of internal queue collections', () => {
    const publicModule = createBootstrapModuleFixture({ module: 'request', requestOnly: true });
    expect(Object.keys(publicModule.data)).not.toContain('requests');
    expect(Object.keys(publicModule.data)).not.toContain('requestLines');

    const leaking = createBootstrapModuleFixture({ module: 'request', requestOnly: true });
    leaking.data = { ...leaking.data, ...createRequestQueueFixture() };
    expect(() => validateBootstrapModule(leaking, { backendMode: 'mock', module: 'request' })).toThrowError(
      expect.objectContaining({ code: 'BOOTSTRAP_CONTRACT_INVALID' }),
    );
  });
});
