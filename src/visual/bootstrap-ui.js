import { BOOTSTRAP_COLLECTIONS } from './bootstrap-controller.js';

const SAFE_TOKEN = /^[A-Z0-9][A-Z0-9_-]{2,63}$/i;
const SAFE_COLLECTIONS = new Set(BOOTSTRAP_COLLECTIONS);
const SAFE_STAGES = new Set([
  'SHELL_READY',
  'REQUEST',
  'RESPONSE_VALIDATION',
  'NORMALIZATION',
  'STATIC_OPTIONS',
  'EXTENSIONS',
  'BINDINGS',
  'ACTIVE_MODULE',
  'FIRST_RENDER',
  'POST_RENDER',
  'READY',
]);

const STATE_COPY = Object.freeze({
  SHELL_READY: ['Preparing the Logistics workspace.', 'Starting a read-only bootstrap attempt.'],
  REQUEST_SENT: ['Connecting to the read-only service.', 'Request sent.'],
  RESPONSE_RECEIVED: ['Response received.', 'Checking the returned workspace envelope.'],
  VALIDATING: ['Checking the workspace response.', 'Validating supported contract fields.'],
  NORMALIZING: ['Preparing the returned records.', 'Normalizing the bootstrap data.'],
  PREPARING_STATIC_OPTIONS: ['Preparing workspace controls.', 'Loading safe static options.'],
  INSTALLING_EXTENSIONS: ['Preparing workspace helpers.', 'Installing runtime extensions.'],
  BINDING_EVENTS: ['Activating workspace controls.', 'Binding keyboard and form interactions.'],
  LOADING_ACTIVE_MODULE: ['Loading the active module.', 'Fetching only the records needed for this view.'],
  RENDERING_ACTIVE_VIEW: ['Rendering the workspace.', 'Preparing the first usable view.'],
  POST_RENDER: ['Finishing workspace setup.', 'Completing post-render checks.'],
  SLOW: ['This is taking longer than usual.', 'The read-only service is still working.'],
  READY: ['Workspace ready.', ''],
  FAILED: ['The workspace could not start.', 'Retry to begin a new safe bootstrap attempt.'],
});

function safeToken(value, fallback) {
  const token = String(value ?? '').trim();
  return SAFE_TOKEN.test(token) ? token : fallback;
}

function finiteNumber(value, fallback = 0) {
  return Number.isFinite(value) && value >= 0 ? Math.round(value) : fallback;
}

function safeDiagnostic(event) {
  const stage = SAFE_STAGES.has(event.stage) ? event.stage : 'UNKNOWN';
  const state = Object.prototype.hasOwnProperty.call(STATE_COPY, event.state) ? event.state : 'UNKNOWN';
  const stageDurations = {};
  Object.entries(event.stageDurations ?? {}).forEach(([name, duration]) => {
    if (SAFE_STAGES.has(name)) stageDurations[name] = finiteNumber(duration);
  });
  const collectionCounts = {};
  Object.entries(event.collectionCounts ?? {}).forEach(([name, count]) => {
    if (SAFE_COLLECTIONS.has(name) && Number.isInteger(count) && count >= 0) collectionCounts[name] = count;
  });
  return {
    attemptId: safeToken(event.attemptId, 'ATTEMPT-UNAVAILABLE'),
    correlationId: safeToken(event.correlationId, safeToken(event.attemptId, 'CORRELATION-UNAVAILABLE')),
    stage,
    state,
    durationMs: finiteNumber(event.durationMs),
    stageDurations,
    payloadBytes: finiteNumber(event.payloadBytes),
    collectionCounts,
  };
}

export function createBootstrapUi({ documentRef = globalThis.document, setTimer = globalThis.setTimeout.bind(globalThis) } = {}) {
  const loading = documentRef?.getElementById('loading');
  if (!loading) throw new Error('Bootstrap loading surface is missing.');
  loading.innerHTML = '<div class="loading-panel" role="status" aria-live="polite" aria-busy="true"><div class="spinner" aria-hidden="true"></div><strong class="loading-title" id="loadingTitle"></strong><p class="loading-detail" id="loadingDetail"></p><p class="loading-support" id="loadingSupport" hidden></p><button class="primary loading-retry" id="loadingRetry" type="button" hidden>Retry</button></div>';
  loading.classList.remove('hidden');
  loading.dataset.state = 'shell-ready';
  loading.setAttribute('aria-busy', 'true');

  const panel = loading.querySelector('.loading-panel');
  const title = loading.querySelector('#loadingTitle');
  const detail = loading.querySelector('#loadingDetail');
  const support = loading.querySelector('#loadingSupport');
  const retryButton = loading.querySelector('#loadingRetry');
  let finalized = false;

  const update = (event = {}) => {
    if (finalized) return;
    const state = Object.prototype.hasOwnProperty.call(STATE_COPY, event.state) ? event.state : 'SHELL_READY';
    const copy = STATE_COPY[state];
    loading.dataset.state = state.toLowerCase();
    loading.setAttribute('aria-busy', 'true');
    loading.setAttribute('role', 'status');
    loading.setAttribute('aria-live', 'polite');
    panel?.setAttribute('role', 'status');
    if (title) title.textContent = copy[0];
    if (detail) detail.textContent = copy[1];
    if (support) support.hidden = true;
    globalThis.console?.debug?.('[HAU bootstrap]', safeDiagnostic(event));
  };

  const finalize = (outcome) => {
    if (finalized) return false;
    finalized = true;
    if (outcome?.ok) {
      loading.dataset.state = 'ready';
      loading.setAttribute('aria-busy', 'false');
      loading.setAttribute('role', 'status');
      loading.setAttribute('aria-live', 'polite');
      retryButton.hidden = true;
      retryButton.disabled = true;
      loading.classList.add('hidden');
      return true;
    }
    const failure = outcome?.failure ?? {};
    const supportCode = safeToken(failure.correlationId, safeToken(failure.attemptId, 'CORRELATION-UNAVAILABLE'));
    loading.dataset.state = 'error';
    loading.classList.remove('hidden');
    loading.setAttribute('aria-busy', 'false');
    loading.setAttribute('role', 'alert');
    loading.setAttribute('aria-live', 'assertive');
    panel?.setAttribute('role', 'alert');
    if (title) title.textContent = 'The workspace could not start.';
    if (detail) detail.textContent = typeof failure.message === 'string' ? failure.message : STATE_COPY.FAILED[1];
    if (support) {
      support.hidden = false;
      support.textContent = `Support code: ${supportCode}`;
    }
    retryButton.hidden = false;
    retryButton.disabled = false;
    setTimer(() => retryButton.focus(), 0);
    return true;
  };

  const reset = () => {
    if (!finalized) return false;
    finalized = false;
    loading.classList.remove('hidden');
    retryButton.hidden = true;
    retryButton.disabled = true;
    update({ state: 'SHELL_READY', stage: 'SHELL_READY' });
    return true;
  };

  update({ state: 'SHELL_READY', stage: 'SHELL_READY' });
  return Object.freeze({ loading, retryButton, update, finalize, reset });
}
