import { describe, expect, it, vi } from 'vitest';
import { createBootstrapUi } from '../../src/visual/bootstrap-ui.js';

function element() {
  return {
    hidden: false,
    disabled: false,
    textContent: '',
    dataset: {},
    attributes: {},
    classList: {
      values: new Set(),
      add(name) { this.values.add(name); },
      remove(name) { this.values.delete(name); },
      contains(name) { return this.values.has(name); },
    },
    setAttribute(name, value) { this.attributes[name] = String(value); },
    querySelector(selector) {
      return this.children[selector] ?? null;
    },
    focus() { this.focused = true; },
    children: {},
  };
}

function documentFixture() {
  const loading = element();
  const panel = element();
  const title = element();
  const detail = element();
  const support = element();
  const retryButton = element();
  loading.children = {
    '.loading-panel': panel,
    '#loadingTitle': title,
    '#loadingDetail': detail,
    '#loadingSupport': support,
    '#loadingRetry': retryButton,
  };
  return {
    loading,
    documentRef: { getElementById: (id) => id === 'loading' ? loading : null },
    retryButton,
    support,
  };
}

describe('bootstrap loading UI finalizer', () => {
  it('is idempotent for failure and success terminal outcomes', () => {
    const fixture = documentFixture();
    const ui = createBootstrapUi({
      documentRef: fixture.documentRef,
      setTimer: (callback) => { callback(); return 1; },
    });
    const failure = { ok: false, failure: { message: 'Safe startup failure.', correlationId: 'COR-SYNTHETIC' } };

    expect(ui.finalize(failure)).toBe(true);
    expect(ui.finalize(failure)).toBe(false);
    expect(fixture.loading.dataset.state).toBe('error');
    expect(fixture.retryButton.disabled).toBe(false);
    expect(fixture.support.textContent).toBe('Support code: COR-SYNTHETIC');

    expect(ui.reset()).toBe(true);
    expect(ui.finalize({ ok: true })).toBe(true);
    expect(ui.finalize({ ok: true })).toBe(false);
    expect(fixture.loading.classList.contains('hidden')).toBe(true);
  });

  it('emits only allowlisted diagnostic fields and collection counts', () => {
    const fixture = documentFixture();
    const debug = vi.spyOn(console, 'debug').mockImplementation(() => {});
    try {
      const ui = createBootstrapUi({ documentRef: fixture.documentRef, setTimer: () => 1 });
      debug.mockClear();
      ui.update({
        attemptId: 'ATT-SYNTHETIC',
        correlationId: 'COR-SYNTHETIC',
        stage: 'REQUEST',
        state: 'REQUEST_SENT',
        durationMs: 12,
        stageDurations: { REQUEST: 12, PRIVATE_STAGE: 99 },
        payloadBytes: 128,
        collectionCounts: { inventoryItems: 4, privateStudentRecords: 99 },
        errorCode: 'SENSITIVE_ERROR_CODE',
        message: 'SENSITIVE_DIAGNOSTIC_CANARY',
      });

      expect(debug).toHaveBeenCalledOnce();
      const diagnostic = debug.mock.calls[0][1];
      expect(diagnostic).toEqual({
        attemptId: 'ATT-SYNTHETIC',
        correlationId: 'COR-SYNTHETIC',
        stage: 'REQUEST',
        state: 'REQUEST_SENT',
        durationMs: 12,
        stageDurations: { REQUEST: 12 },
        payloadBytes: 128,
        collectionCounts: { inventoryItems: 4 },
      });
      expect(JSON.stringify(diagnostic)).not.toContain('SENSITIVE');
    } finally {
      debug.mockRestore();
    }
  });
});
