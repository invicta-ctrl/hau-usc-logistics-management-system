import { describe, expect, it } from 'vitest';
import {
  BOOTSTRAP_STAGES,
  BOOTSTRAP_STATES,
  createBootstrapController,
  validateBootstrapEnvelope,
  summarizeBootstrap,
} from '../../src/visual/bootstrap-controller.js';
import {
  createEmptyBootstrapFixture,
  createRealisticBootstrapFixture,
} from '../fixtures/bootstrap-fixtures.js';

describe('bootstrap contract validation', () => {
  it('accepts empty and realistic synthetic bootstrap envelopes', () => {
    const empty = validateBootstrapEnvelope(createEmptyBootstrapFixture(), { backendMode: 'mock' });
    const realistic = validateBootstrapEnvelope(createRealisticBootstrapFixture(), { backendMode: 'mock' });
    const summary = summarizeBootstrap(realistic);

    expect(empty.eventSeries).toEqual([]);
    expect(summary.contractVersion).toBe('0.5.0');
    expect(summary.schemaVersion).toBe('1.2.0');
    expect(summary.payloadBytes).toBeGreaterThan(10_000);
    expect(summary.collectionCounts.inventoryItems).toBe(24);
    expect(summary.collectionCounts.requests).toBe(30);
    expect(summary.collectionCounts.requestLines).toBe(60);
  });

  it.each([
    ['missing collection', (value) => { delete value.events; }],
    ['wrong contract version', (value) => { value.version = '9.9.9'; }],
    ['wrong schema version', (value) => { value.schemaVersion = '9.9.9'; }],
    ['wrong backend mode', (value) => { value.backendMode = 'production'; }],
    ['Date value', (value) => { value.events = [new Date('2026-07-14T00:00:00.000Z')]; }],
    ['non-finite number', (value) => { value.inventoryItems = [{ quantity: Number.POSITIVE_INFINITY }]; }],
    ['function value', (value) => { value.inventoryItems = [{ transform: () => {} }]; }],
    ['symbol value', (value) => { value.inventoryItems = [{ marker: Symbol('synthetic') }]; }],
    ['bigint value', (value) => { value.inventoryItems = [{ quantity: 1n }]; }],
    ['circular value', (value) => { value.inventoryItems = []; value.inventoryItems.push(value); }],
  ])('rejects %s before normalization', (_label, mutate) => {
    const value = createEmptyBootstrapFixture();
    mutate(value);
    expect(() => validateBootstrapEnvelope(value, { backendMode: 'mock' })).toThrowError(
      expect.objectContaining({ code: 'BOOTSTRAP_CONTRACT_INVALID' }),
    );
  });
});

describe('bootstrap controller recovery boundary', () => {
  it('runs one ordinary bootstrap call through every named stage', async () => {
    const fixture = createEmptyBootstrapFixture();
    const updates = [];
    let calls = 0;
    const controller = createBootstrapController({
      load: async () => {
        calls += 1;
        return fixture;
      },
      steps: {
        validate: (value) => validateBootstrapEnvelope(value, { backendMode: 'mock' }),
        normalize: (value) => value,
        staticOptions: (value) => value,
        extensions: (value) => value,
        bindings: (value) => value,
        firstRender: (value) => value,
        postRender: (value) => value,
      },
      onUpdate: (event) => updates.push(event),
    });

    const first = controller.start();
    const duplicate = controller.start();
    const result = await first;

    expect(duplicate).toBe(first);
    expect(calls).toBe(1);
    expect(result.ok).toBe(true);
    expect(updates.at(-1)).toMatchObject({ state: BOOTSTRAP_STATES.READY, stage: BOOTSTRAP_STAGES.READY });
    expect(updates.map((event) => event.stage)).toEqual(expect.arrayContaining([
      BOOTSTRAP_STAGES.SHELL_READY,
      BOOTSTRAP_STAGES.REQUEST,
      BOOTSTRAP_STAGES.RESPONSE_VALIDATION,
      BOOTSTRAP_STAGES.NORMALIZATION,
      BOOTSTRAP_STAGES.STATIC_OPTIONS,
      BOOTSTRAP_STAGES.EXTENSIONS,
      BOOTSTRAP_STAGES.BINDINGS,
      BOOTSTRAP_STAGES.FIRST_RENDER,
      BOOTSTRAP_STAGES.POST_RENDER,
      BOOTSTRAP_STAGES.READY,
    ]));
    expect(updates.every((event) => !('message' in event) || typeof event.message === 'undefined')).toBe(true);
  });

  it('keeps loading recoverable after backend failure and retries once', async () => {
    const fixture = createEmptyBootstrapFixture();
    let calls = 0;
    const failures = [];
    const ready = [];
    const controller = createBootstrapController({
      load: async () => {
        calls += 1;
        if (calls === 1) throw { code: 'BACKEND_TIMEOUT', correlationId: 'COR-SYNTHETIC' };
        return fixture;
      },
      steps: { validate: (value) => validateBootstrapEnvelope(value, { backendMode: 'mock' }) },
      onFailure: (failure) => failures.push(failure),
      onReady: (value) => ready.push(value),
    });

    const first = controller.start();
    expect(controller.start()).toBe(first);
    const failed = await first;
    expect(failed).toMatchObject({ ok: false, error: { code: 'BACKEND_TIMEOUT', correlationId: 'COR-SYNTHETIC' } });
    expect(failures).toHaveLength(1);
    expect(controller.isActive()).toBe(false);

    const retry = controller.start();
    expect(controller.start()).toBe(retry);
    const recovered = await retry;
    expect(recovered.ok).toBe(true);
    expect(calls).toBe(2);
    expect(ready).toHaveLength(1);
  });

  it('shows slow state once without making another request', async () => {
    const fixture = createEmptyBootstrapFixture();
    const timers = [];
    const slow = [];
    let resolveLoad;
    const controller = createBootstrapController({
      load: () => new Promise((resolve) => { resolveLoad = resolve; }),
      onSlow: (diagnostics) => slow.push(diagnostics),
      setTimer: (callback, delay) => { timers.push({ callback, delay }); return timers.length; },
      clearTimer: () => {},
    });

    const pending = controller.start();
    expect(timers).toHaveLength(1);
    expect(timers[0].delay).toBe(8_000);
    timers[0].callback();
    timers[0].callback();
    expect(slow).toHaveLength(1);
    resolveLoad(fixture);
    await expect(pending).resolves.toMatchObject({ ok: true });
  });

  it.each([
    BOOTSTRAP_STAGES.RESPONSE_VALIDATION,
    BOOTSTRAP_STAGES.NORMALIZATION,
    BOOTSTRAP_STAGES.STATIC_OPTIONS,
    BOOTSTRAP_STAGES.EXTENSIONS,
    BOOTSTRAP_STAGES.BINDINGS,
    BOOTSTRAP_STAGES.FIRST_RENDER,
    BOOTSTRAP_STAGES.POST_RENDER,
  ])('contains a thrown error from %s inside the same recovery boundary', async (stageToFail) => {
    const fixture = createEmptyBootstrapFixture();
    const failures = [];
    const steps = {
      validate: (value) => value,
      normalize: (value) => value,
      staticOptions: (value) => value,
      extensions: (value) => value,
      bindings: (value) => value,
      firstRender: (value) => value,
      postRender: (value) => value,
    };
    const stepByStage = {
      [BOOTSTRAP_STAGES.RESPONSE_VALIDATION]: 'validate',
      [BOOTSTRAP_STAGES.NORMALIZATION]: 'normalize',
      [BOOTSTRAP_STAGES.STATIC_OPTIONS]: 'staticOptions',
      [BOOTSTRAP_STAGES.EXTENSIONS]: 'extensions',
      [BOOTSTRAP_STAGES.BINDINGS]: 'bindings',
      [BOOTSTRAP_STAGES.FIRST_RENDER]: 'firstRender',
      [BOOTSTRAP_STAGES.POST_RENDER]: 'postRender',
    };
    steps[stepByStage[stageToFail]] = () => {
      throw new Error('SENSITIVE_CANARY_SHOULD_NOT_RENDER');
    };
    const controller = createBootstrapController({
      load: async () => fixture,
      steps,
      onFailure: (failure) => failures.push(failure),
    });

    const result = await controller.start();

    expect(result.ok).toBe(false);
    expect(result.error).toMatchObject({ stage: stageToFail, retryable: true });
    expect(result.error.message).not.toContain('SENSITIVE_CANARY');
    expect(failures).toHaveLength(1);
    expect(failures[0].message).not.toContain('SENSITIVE_CANARY');
  });
});
