import { BOOTSTRAP_MODULES, validateBootstrapModule } from './bootstrap-contract.js';

const DEFAULT_MAX_PAGE_SIZE = 50;
const DEFAULT_MAX_ENTRIES = 8;
const DEFAULT_MAX_BYTES = 100 * 1024;

function clone(value) {
  if (typeof structuredClone === 'function') return structuredClone(value);
  return JSON.parse(JSON.stringify(value));
}

function byteLength(value) {
  const serialized = JSON.stringify(value);
  if (typeof TextEncoder === 'function') return new TextEncoder().encode(serialized).length;
  return serialized.length;
}

function controllerError(code, message) {
  const error = new Error(message);
  error.code = code;
  error.retryable = code !== 'MODULE_QUERY_INVALID';
  return error;
}

function normalizeRequest(module, params, maxPageSize) {
  if (!BOOTSTRAP_MODULES.includes(module)) throw controllerError('MODULE_QUERY_INVALID', 'Unsupported bootstrap module.');
  const page = params.page === undefined ? 1 : Number(params.page);
  const pageSize = params.pageSize === undefined ? Math.min(DEFAULT_MAX_PAGE_SIZE, maxPageSize) : Number(params.pageSize);
  if (!Number.isInteger(page) || page < 1) throw controllerError('MODULE_QUERY_INVALID', 'Module page must be a positive integer.');
  if (!Number.isInteger(pageSize) || pageSize < 1 || pageSize > maxPageSize || pageSize > 100) throw controllerError('MODULE_QUERY_INVALID', 'Module page size is outside the supported bound.');
  const query = String(params.query ?? '').trim();
  if (query.length > 80) throw controllerError('MODULE_QUERY_INVALID', 'Module query is too long.');
  const filter = params.filter === undefined ? '' : String(params.filter).trim();
  if (filter.length > 80) throw controllerError('MODULE_QUERY_INVALID', 'Module filter is too long.');
  const committeeId = params.committeeId === undefined ? '' : String(params.committeeId).trim();
  if (committeeId.length > 40 || (committeeId && !/^[A-Z0-9_]+$/i.test(committeeId))) throw controllerError('MODULE_QUERY_INVALID', 'The committee context is invalid.');
  const operationalScope = params.operationalScope === undefined ? '' : String(params.operationalScope).trim();
  if (operationalScope.length > 120 || (operationalScope && !/^[A-Z0-9_.:-]+$/i.test(operationalScope))) throw controllerError('MODULE_QUERY_INVALID', 'The operational context is invalid.');
  // RV-01.5: bare ISO calendar days only, so a date boundary is part of the
  // cache key and can never carry arbitrary text to the server.
  const isoDay = (value, label) => {
    if (value === undefined || value === null || value === '') return '';
    const text = String(value).trim();
    if (!/^\d{4}-\d{2}-\d{2}$/u.test(text)) throw controllerError('MODULE_QUERY_INVALID', `The ${label} date is invalid.`);
    return text;
  };
  const from = isoDay(params.from, 'start');
  const to = isoDay(params.to, 'end');
  if (from && to && from > to) throw controllerError('MODULE_QUERY_INVALID', 'The date range is inverted.');
  // Date boundaries are omitted when unset so the ordinary module query keeps
  // its existing wire shape; an unused optional filter must not change the
  // payload every caller sends.
  return {
    page,
    pageSize,
    query,
    filter,
    committeeId,
    operationalScope,
    ...(from ? { from } : {}),
    ...(to ? { to } : {}),
    requestOnly: params.requestOnly === true,
  };
}

function cacheKey(module, request) {
  return `${module}:${JSON.stringify(request)}`;
}

function safeCacheEntry(value, maxBytes, now) {
  if (value?.cache?.safe !== true || value.cache.scope !== 'PUBLIC_REFERENCE') return null;
  const bytes = byteLength(value);
  return bytes <= maxBytes ? { value: clone(value), bytes, expiresAt: now() + value.cache.ttlMs } : null;
}

export function createModuleDataController({
  load,
  validate = validateBootstrapModule,
  maxPageSize = DEFAULT_MAX_PAGE_SIZE,
  maxEntries = DEFAULT_MAX_ENTRIES,
  maxBytes = DEFAULT_MAX_BYTES,
  now = () => Date.now(),
} = {}) {
  if (typeof load !== 'function') throw new TypeError('A module loader is required.');
  if (!Number.isInteger(maxPageSize) || maxPageSize < 1 || maxPageSize > 100) throw new TypeError('A bounded module page size is required.');
  const cache = new Map();
  const inFlight = new Map();
  const generations = new Map();

  function evictIfNeeded() {
    while (cache.size > maxEntries) cache.delete(cache.keys().next().value);
  }

  function readCache(key) {
    const entry = cache.get(key);
    if (!entry) return null;
    if (entry.expiresAt <= now()) {
      cache.delete(key);
      return null;
    }
    cache.delete(key);
    cache.set(key, entry);
    return clone(entry.value);
  }

  function storeCache(key, value) {
    const entry = safeCacheEntry(value, maxBytes, now);
    if (!entry) return;
    cache.delete(key);
    cache.set(key, entry);
    evictIfNeeded();
  }

  function requestKey(module, params) {
    return cacheKey(module, normalizeRequest(module, params, maxPageSize));
  }

  function cancel(module, params = {}) {
    const key = requestKey(module, params);
    generations.set(key, (generations.get(key) ?? 0) + 1);
    return key;
  }

  function loadModule(module, params = {}) {
    const request = normalizeRequest(module, params, maxPageSize);
    const key = cacheKey(module, request);
    const cached = readCache(key);
    if (cached) return Promise.resolve(cached);
    const generation = generations.get(key) ?? 0;
    const existing = inFlight.get(key);
    if (existing?.generation === generation) return existing.promise;
    let promise;
    promise = Promise.resolve()
      .then(() => load(module, request))
      .then((value) => {
        const validated = validate(value, { module, request });
        if ((generations.get(key) ?? 0) !== generation) throw controllerError('MODULE_LOAD_CANCELLED', 'The module response was no longer current.');
        storeCache(key, validated);
        return clone(validated);
      })
      .finally(() => {
        if (inFlight.get(key)?.promise === promise) inFlight.delete(key);
      });
    inFlight.set(key, { generation, promise });
    return promise;
  }

  return Object.freeze({
    load: loadModule,
    cancel,
    invalidate(module, params = {}) {
      const key = requestKey(module, params);
      cache.delete(key);
      generations.set(key, (generations.get(key) ?? 0) + 1);
    },
    clear() {
      cache.clear();
      for (const key of inFlight.keys()) generations.set(key, (generations.get(key) ?? 0) + 1);
    },
    stats() { return { cacheEntries: cache.size, inFlight: inFlight.size, cacheBytes: [...cache.values()].reduce((sum, entry) => sum + entry.bytes, 0) }; },
  });
}
