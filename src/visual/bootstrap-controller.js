export const BOOTSTRAP_COLLECTIONS = Object.freeze([
  'eventSeries',
  'eventDays',
  'events',
  'requests',
  'requestLines',
  'inventoryItems',
  'reservations',
  'ledgerTransactions',
  'restockRequests',
  'restockRecords',
  'lendingTickets',
  'releaseConfirmations',
  'releaseCorrections',
  'deliverables',
  'canvassReferences',
  'evidenceFiles',
  'roadmapMilestones',
  'statusHistory',
  'auditLog',
]);

export const BOOTSTRAP_STAGES = Object.freeze({
  SHELL_READY: 'SHELL_READY',
  REQUEST: 'REQUEST',
  RESPONSE_VALIDATION: 'RESPONSE_VALIDATION',
  NORMALIZATION: 'NORMALIZATION',
  STATIC_OPTIONS: 'STATIC_OPTIONS',
  EXTENSIONS: 'EXTENSIONS',
  BINDINGS: 'BINDINGS',
  ACTIVE_MODULE: 'ACTIVE_MODULE',
  FIRST_RENDER: 'FIRST_RENDER',
  POST_RENDER: 'POST_RENDER',
  READY: 'READY',
});

export const BOOTSTRAP_STATES = Object.freeze({
  SHELL_READY: 'SHELL_READY',
  REQUEST_SENT: 'REQUEST_SENT',
  RESPONSE_RECEIVED: 'RESPONSE_RECEIVED',
  VALIDATING: 'VALIDATING',
  NORMALIZING: 'NORMALIZING',
  PREPARING_STATIC_OPTIONS: 'PREPARING_STATIC_OPTIONS',
  INSTALLING_EXTENSIONS: 'INSTALLING_EXTENSIONS',
  BINDING_EVENTS: 'BINDING_EVENTS',
  LOADING_ACTIVE_MODULE: 'LOADING_ACTIVE_MODULE',
  RENDERING_ACTIVE_VIEW: 'RENDERING_ACTIVE_VIEW',
  POST_RENDER: 'POST_RENDER',
  SLOW: 'SLOW',
  READY: 'READY',
  FAILED: 'FAILED',
});

const SUPPORTED_BOOTSTRAP_VERSIONS = new Set(['0.5.0', '1.0.0']);
const SUPPORTED_SCHEMA_VERSIONS = new Set(['1.5.0', '1.4.0', '1.3.0', '1.2.0', '1.1.0', '1.0.0', '3', 3]);
const SAFE_TOKEN = /^[A-Z0-9][A-Z0-9_-]{2,63}$/i;
const noop = () => {};

const STAGE_STATES = Object.freeze({
  [BOOTSTRAP_STAGES.SHELL_READY]: BOOTSTRAP_STATES.SHELL_READY,
  [BOOTSTRAP_STAGES.REQUEST]: BOOTSTRAP_STATES.REQUEST_SENT,
  [BOOTSTRAP_STAGES.RESPONSE_VALIDATION]: BOOTSTRAP_STATES.VALIDATING,
  [BOOTSTRAP_STAGES.NORMALIZATION]: BOOTSTRAP_STATES.NORMALIZING,
  [BOOTSTRAP_STAGES.STATIC_OPTIONS]: BOOTSTRAP_STATES.PREPARING_STATIC_OPTIONS,
  [BOOTSTRAP_STAGES.EXTENSIONS]: BOOTSTRAP_STATES.INSTALLING_EXTENSIONS,
  [BOOTSTRAP_STAGES.BINDINGS]: BOOTSTRAP_STATES.BINDING_EVENTS,
  [BOOTSTRAP_STAGES.ACTIVE_MODULE]: BOOTSTRAP_STATES.LOADING_ACTIVE_MODULE,
  [BOOTSTRAP_STAGES.FIRST_RENDER]: BOOTSTRAP_STATES.RENDERING_ACTIVE_VIEW,
  [BOOTSTRAP_STAGES.POST_RENDER]: BOOTSTRAP_STATES.POST_RENDER,
  [BOOTSTRAP_STAGES.READY]: BOOTSTRAP_STATES.READY,
});

const STAGE_MESSAGES = Object.freeze({
  [BOOTSTRAP_STAGES.REQUEST]: 'The workspace could not connect to the read-only service.',
  [BOOTSTRAP_STAGES.RESPONSE_VALIDATION]: 'The workspace returned an unsupported response.',
  [BOOTSTRAP_STAGES.NORMALIZATION]: 'The workspace could not prepare the returned records.',
  [BOOTSTRAP_STAGES.STATIC_OPTIONS]: 'The workspace could not prepare its controls.',
  [BOOTSTRAP_STAGES.EXTENSIONS]: 'The workspace could not prepare its controls.',
  [BOOTSTRAP_STAGES.BINDINGS]: 'The workspace could not activate its controls.',
  [BOOTSTRAP_STAGES.ACTIVE_MODULE]: 'The workspace could not load the active module.',
  [BOOTSTRAP_STAGES.FIRST_RENDER]: 'The workspace could not render its first usable view.',
  [BOOTSTRAP_STAGES.POST_RENDER]: 'The workspace could not finish preparing the view.',
  [BOOTSTRAP_STAGES.READY]: 'The workspace could not finish loading.',
});

const ERROR_MESSAGES = Object.freeze({
  APPS_SCRIPT_FAILURE: 'The read-only service failed to respond safely.',
  BACKEND_TIMEOUT: 'The read-only service took too long to respond.',
  BACKEND_UNAVAILABLE: 'The read-only service is not available right now.',
  BOOTSTRAP_CONTRACT_INVALID: 'The workspace returned an unsupported response.',
  SERVER_ERROR: 'The read-only service could not prepare the workspace.',
});

export class BootstrapContractError extends Error {
  constructor() {
    super('The bootstrap response did not match the supported contract.');
    this.name = 'BootstrapContractError';
    this.code = 'BOOTSTRAP_CONTRACT_INVALID';
  }
}

function invalidContract() {
  throw new BootstrapContractError();
}

function isPlainObject(value) {
  if (!value || Object.prototype.toString.call(value) !== '[object Object]') return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function assertJsonSafe(value, seen) {
  if (value == null || typeof value === 'string' || typeof value === 'boolean') return;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) invalidContract();
    return;
  }
  if (typeof value !== 'object' || value instanceof Date || typeof value === 'function') invalidContract();
  if (seen.has(value)) invalidContract();
  seen.add(value);
  if (Array.isArray(value)) {
    value.forEach((item) => assertJsonSafe(item, seen));
  } else {
    if (!isPlainObject(value)) invalidContract();
    Object.keys(value).forEach((key) => assertJsonSafe(value[key], seen));
  }
  seen.delete(value);
}

function normalizeToken(value, fallback) {
  const token = String(value ?? '').trim();
  return SAFE_TOKEN.test(token) ? token : fallback;
}

export function createOpaqueId(prefix = 'ATT') {
  const uuid = globalThis.crypto?.randomUUID?.();
  const suffix = uuid
    ? uuid.replace(/-/g, '').slice(0, 20)
    : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  return `${prefix}-${suffix}`.toUpperCase().slice(0, 64);
}

export function validateBootstrapEnvelope(value, { backendMode = 'mock' } = {}) {
  const seen = new WeakSet();
  assertJsonSafe(value, seen);
  if (
    !isPlainObject(value) ||
    typeof value.version !== 'string' ||
    !SUPPORTED_BOOTSTRAP_VERSIONS.has(value.version)
  ) {
    invalidContract();
  }
  if (value.schemaVersion !== undefined && !SUPPORTED_SCHEMA_VERSIONS.has(value.schemaVersion))
    invalidContract();
  if (value.backendMode !== undefined && value.backendMode !== backendMode) invalidContract();
  BOOTSTRAP_COLLECTIONS.forEach((name) => {
    if (!Array.isArray(value[name])) invalidContract();
  });
  if (value.currentUser !== undefined && !isPlainObject(value.currentUser)) invalidContract();
  if (value.bootstrapMeta !== undefined && !isPlainObject(value.bootstrapMeta)) invalidContract();
  return value;
}

function byteLength(value) {
  const serialized = JSON.stringify(value);
  if (typeof TextEncoder === 'function') return new TextEncoder().encode(serialized).length;
  return serialized.length;
}

function summarizeStagePayload(value) {
  if (!value || typeof value !== 'object') return null;
  if (value.version) return summarizeBootstrap(value);
  if (value.contract) return { payloadBytes: byteLength(value), collectionCounts: {} };
  return null;
}

export function summarizeBootstrap(value) {
  return {
    contractVersion: String(value.version),
    schemaVersion: value.schemaVersion == null ? '' : String(value.schemaVersion),
    payloadBytes: byteLength(value),
    collectionCounts: Object.fromEntries(
      BOOTSTRAP_COLLECTIONS.map((name) => [name, Array.isArray(value[name]) ? value[name].length : 0]),
    ),
  };
}

function nowValue() {
  return globalThis.performance?.now?.() ?? Date.now();
}

function durationSince(startedAt, now) {
  const duration = Number(now() - startedAt);
  return Number.isFinite(duration) && duration >= 0 ? Math.round(duration) : 0;
}

function safeCorrelationId(value, fallback) {
  return normalizeToken(value, fallback);
}

export function createSafeStartupFailure(error, stage, { attemptId, correlationId } = {}) {
  const normalizedStage = Object.values(BOOTSTRAP_STAGES).includes(stage) ? stage : BOOTSTRAP_STAGES.READY;
  const fallbackCode = `BOOTSTRAP_${normalizedStage}`;
  const candidateCode = normalizeToken(error?.code, '');
  const code = ERROR_MESSAGES[candidateCode] ? candidateCode : fallbackCode;
  const safeCorrelation = safeCorrelationId(
    error?.correlationId,
    safeCorrelationId(correlationId, attemptId),
  );
  return Object.freeze({
    code,
    stage: normalizedStage,
    correlationId: safeCorrelation,
    attemptId,
    message:
      ERROR_MESSAGES[code] ?? STAGE_MESSAGES[normalizedStage] ?? 'The workspace could not finish loading.',
    retryable: true,
  });
}

class StageFailure extends Error {
  constructor(stage, cause) {
    super('Bootstrap stage failed.');
    this.name = 'StageFailure';
    this.stage = stage;
    this.cause = cause;
  }
}

export function createBootstrapController({
  load,
  steps = {},
  onUpdate = noop,
  onSlow = noop,
  onReady = noop,
  onFailure = noop,
  slowAfterMs = 8_000,
  now = nowValue,
  setTimer = globalThis.setTimeout.bind(globalThis),
  clearTimer = globalThis.clearTimeout.bind(globalThis),
  createAttemptId = () => createOpaqueId('ATT'),
} = {}) {
  if (typeof load !== 'function') throw new TypeError('A bootstrap loader is required.');
  let activeAttempt = null;
  let sequence = 0;

  const isCurrent = (attempt) => activeAttempt === attempt && !attempt.terminal;
  const snapshot = (attempt) => ({
    attemptId: attempt.attemptId,
    correlationId: attempt.correlationId,
    stage: attempt.stage,
    durationMs: durationSince(attempt.startedAt, now),
    stageDurations: { ...attempt.stageDurations },
    payloadBytes: attempt.payloadBytes,
    collectionCounts: attempt.collectionCounts ? { ...attempt.collectionCounts } : undefined,
  });
  const emit = (attempt, state, stage, extra = {}) => {
    if (!isCurrent(attempt)) return false;
    attempt.stage = stage;
    try {
      onUpdate({ state, ...snapshot(attempt), ...extra });
    } catch {
      // Diagnostic observers must never break startup recovery.
    }
    return true;
  };
  const finish = (attempt, result) => {
    if (!isCurrent(attempt)) return false;
    attempt.terminal = true;
    if (attempt.slowTimer != null) clearTimer(attempt.slowTimer);
    if (result.ok) {
      attempt.stage = BOOTSTRAP_STAGES.READY;
      try {
        onUpdate({ state: BOOTSTRAP_STATES.READY, ...snapshot(attempt) });
        onReady(result.value, snapshot(attempt));
      } catch {
        // The runtime finalizer is independently idempotent and owns the UI boundary.
      }
    } else {
      const failure = result.safeFailure ?? createSafeStartupFailure(result.error, result.stage, attempt);
      attempt.stage = failure.stage;
      try {
        onUpdate({ state: BOOTSTRAP_STATES.FAILED, ...snapshot(attempt), errorCode: failure.code });
        onFailure(failure, snapshot(attempt));
      } catch {
        // Failure reporting must not create a second startup failure.
      }
      result.error = failure;
    }
    return true;
  };
  const executeStage = async (attempt, stage, fn, value) => {
    if (!isCurrent(attempt)) return { ignored: true };
    const startedAt = now();
    emit(attempt, STAGE_STATES[stage], stage, { phase: 'start' });
    try {
      const next = await fn(value, {
        attemptId: attempt.attemptId,
        correlationId: attempt.correlationId,
        stage,
        isCurrent: () => isCurrent(attempt),
      });
      if (!isCurrent(attempt)) return { ignored: true };
      attempt.stageDurations[stage] = durationSince(startedAt, now);
      if (next && next.bootstrapMeta?.correlationId) {
        attempt.correlationId = safeCorrelationId(next.bootstrapMeta.correlationId, attempt.correlationId);
      }
      const summary = summarizeStagePayload(next);
      if (summary) {
        attempt.payloadBytes = summary.payloadBytes;
        attempt.collectionCounts = summary.collectionCounts;
      }
      emit(attempt, STAGE_STATES[stage], stage, { phase: 'complete' });
      return { value: next };
    } catch (error) {
      throw new StageFailure(stage, error);
    }
  };
  const runAttempt = async (attempt) => {
    try {
      const request = await executeStage(
        attempt,
        BOOTSTRAP_STAGES.REQUEST,
        (value, context) => load(context),
        undefined,
      );
      if (request.ignored) return { ignored: true, attemptId: attempt.attemptId };
      if (!isCurrent(attempt)) return { ignored: true, attemptId: attempt.attemptId };
      emit(attempt, BOOTSTRAP_STATES.RESPONSE_RECEIVED, BOOTSTRAP_STAGES.REQUEST, { phase: 'response' });
      let value = request.value;
      for (const [stage, step] of [
        [BOOTSTRAP_STAGES.RESPONSE_VALIDATION, steps.validate],
        [BOOTSTRAP_STAGES.NORMALIZATION, steps.normalize],
        [BOOTSTRAP_STAGES.STATIC_OPTIONS, steps.staticOptions],
        [BOOTSTRAP_STAGES.EXTENSIONS, steps.extensions],
        [BOOTSTRAP_STAGES.BINDINGS, steps.bindings],
        [BOOTSTRAP_STAGES.ACTIVE_MODULE, steps.activeModule],
        [BOOTSTRAP_STAGES.FIRST_RENDER, steps.firstRender],
        [BOOTSTRAP_STAGES.POST_RENDER, steps.postRender],
      ]) {
        if (typeof step !== 'function') continue;
        const result = await executeStage(attempt, stage, step, value);
        if (result.ignored) return { ignored: true, attemptId: attempt.attemptId };
        value = result.value;
      }
      const diagnostics = snapshot(attempt);
      finish(attempt, { ok: true, value });
      return { ok: true, value, diagnostics };
    } catch (error) {
      if (!isCurrent(attempt)) return { ignored: true, attemptId: attempt.attemptId };
      const stage = error instanceof StageFailure ? error.stage : attempt.stage;
      const cause = error instanceof StageFailure ? error.cause : error;
      const safeFailure = createSafeStartupFailure(cause, stage, attempt);
      const failure = { ok: false, error: cause, stage, safeFailure };
      finish(attempt, failure);
      return {
        ok: false,
        error: safeFailure,
        diagnostics: snapshot(attempt),
      };
    }
  };

  function start() {
    if (activeAttempt && !activeAttempt.terminal) return activeAttempt.promise;
    const attempt = {
      token: ++sequence,
      attemptId: createAttemptId(),
      correlationId: '',
      stage: BOOTSTRAP_STAGES.SHELL_READY,
      startedAt: now(),
      stageDurations: {},
      terminal: false,
      slowTimer: null,
      slow: false,
    };
    activeAttempt = attempt;
    emit(attempt, BOOTSTRAP_STATES.SHELL_READY, BOOTSTRAP_STAGES.SHELL_READY, { phase: 'complete' });
    attempt.slowTimer = setTimer(() => {
      if (!isCurrent(attempt) || attempt.slow) return;
      attempt.slow = true;
      const diagnostics = snapshot(attempt);
      try {
        onUpdate({ state: BOOTSTRAP_STATES.SLOW, ...diagnostics });
        onSlow(diagnostics);
      } catch {
        // Slow-state messaging must not affect the active request.
      }
    }, slowAfterMs);
    attempt.promise = runAttempt(attempt);
    return attempt.promise;
  }

  return Object.freeze({
    start,
    isActive: () => Boolean(activeAttempt && !activeAttempt.terminal),
    getDiagnostics: () => (activeAttempt ? snapshot(activeAttempt) : null),
  });
}
