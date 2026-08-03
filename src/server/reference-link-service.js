import { accountAuthorization } from './auth/contracts.js';
import { ApiError } from './d1/operational-service.js';
import { operationalInteger } from '../domain/operational-integers.js';

export const REFERENCE_LINK_TYPES = Object.freeze({
  EXTERNAL_URL: 'EXTERNAL_URL',
  INTERNAL_ROUTE: 'INTERNAL_ROUTE',
});

export const REFERENCE_LINK_AUDIENCES = Object.freeze({
  PUBLIC: 'PUBLIC',
  STAFF: 'STAFF',
  ADMINISTRATOR: 'ADMINISTRATOR',
  DIRECTOR: 'DIRECTOR',
});

export const REFERENCE_LINK_STATUSES = Object.freeze({
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  ARCHIVED: 'ARCHIVED',
});

export const REFERENCE_LINK_SYNC_STATES = Object.freeze({
  SYNCED: 'SYNCED',
  SYNC_PENDING: 'SYNC_PENDING',
  SYNC_FAILED: 'SYNC_FAILED',
  NOT_CONFIGURED: 'NOT_CONFIGURED',
});

const LINK_TYPES = new Set(Object.values(REFERENCE_LINK_TYPES));
const AUDIENCES = new Set(Object.values(REFERENCE_LINK_AUDIENCES));
const STATUSES = new Set(Object.values(REFERENCE_LINK_STATUSES));
const MUTABLE_STATUSES = new Set([
  REFERENCE_LINK_STATUSES.DRAFT,
  REFERENCE_LINK_STATUSES.ACTIVE,
  REFERENCE_LINK_STATUSES.INACTIVE,
]);
const TRANSITIONS = Object.freeze({
  [REFERENCE_LINK_STATUSES.DRAFT]: new Set([
    REFERENCE_LINK_STATUSES.ACTIVE,
    REFERENCE_LINK_STATUSES.INACTIVE,
    REFERENCE_LINK_STATUSES.ARCHIVED,
  ]),
  [REFERENCE_LINK_STATUSES.ACTIVE]: new Set([
    REFERENCE_LINK_STATUSES.INACTIVE,
    REFERENCE_LINK_STATUSES.ARCHIVED,
  ]),
  [REFERENCE_LINK_STATUSES.INACTIVE]: new Set([
    REFERENCE_LINK_STATUSES.ACTIVE,
    REFERENCE_LINK_STATUSES.ARCHIVED,
  ]),
  [REFERENCE_LINK_STATUSES.ARCHIVED]: new Set(),
});

function validationError(message, field) {
  return new ApiError('VALIDATION_FAILED', message, {
    status: 422,
    details: field ? { field } : undefined,
  });
}

function requiredText(value, field, max) {
  if (typeof value !== 'string') throw validationError(`${field} is required.`, field);
  if (!value || value.length > max) {
    throw validationError(`${field} is required and must be at most ${max} characters.`, field);
  }
  for (let index = 0; index < value.length; index += 1) {
    const codePoint = value.charCodeAt(index);
    if (codePoint <= 0x1f || codePoint === 0x7f) {
      throw validationError(`${field} contains unsupported characters.`, field);
    }
  }
  const normalized = value.trim().replace(/\s+/gu, ' ');
  if (!normalized) {
    throw validationError(`${field} is required and must be at most ${max} characters.`, field);
  }
  return normalized;
}

function optionalText(value, field, max) {
  if (value === undefined || value === null || value === '') return '';
  return requiredText(value, field, max);
}

function enumValue(value, field, allowed) {
  const normalized = requiredText(value, field, 40).toUpperCase();
  if (!allowed.has(normalized)) throw validationError(`${field} is not supported.`, field);
  return normalized;
}

function positiveInteger(value, field, { max = Number.MAX_SAFE_INTEGER } = {}) {
  try {
    return operationalInteger(value, { field, min: 1, max });
  } catch {
    throw validationError(`${field} must be a positive whole number.`, field);
  }
}

function safeLinkId(value) {
  const id = requiredText(value, 'id', 100);
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{1,99}$/u.test(id)) {
    throw validationError('id is invalid.', 'id');
  }
  return id;
}

function idempotencyKey(value) {
  const key = requiredText(value, 'clientRequestId', 128);
  if (!/^[A-Za-z0-9][A-Za-z0-9._:-]{7,127}$/u.test(key)) {
    throw validationError('clientRequestId must be a safe stable retry key.', 'clientRequestId');
  }
  return key;
}

function approvedRouteSet(value) {
  if (value instanceof Map) return new Set(value.keys());
  if (value instanceof Set || Array.isArray(value)) return new Set(value);
  if (value && typeof value === 'object') return new Set(Object.keys(value));
  return new Set();
}

function externalUrl(value) {
  const candidate = requiredText(value, 'url', 2048);
  let parsed;
  try {
    parsed = new URL(candidate);
  } catch {
    throw validationError('url must be a valid HTTPS URL.', 'url');
  }
  if (parsed.protocol !== 'https:' || !parsed.hostname || parsed.username !== '' || parsed.password !== '') {
    throw validationError('url must use HTTPS and must not contain credentials.', 'url');
  }
  return parsed.href;
}

function normalizeTarget({ linkType, url }, approvedRoutes) {
  const normalizedType = enumValue(linkType, 'linkType', LINK_TYPES);
  if (normalizedType === REFERENCE_LINK_TYPES.EXTERNAL_URL) {
    return { linkType: normalizedType, url: externalUrl(url) };
  }
  const routeId = requiredText(url, 'url', 120);
  if (!approvedRoutes.has(routeId)) {
    throw validationError('url must be an approved internal route ID.', 'url');
  }
  return { linkType: normalizedType, url: routeId };
}

function assertAuthorized(actor) {
  if (!actor || typeof actor.id !== 'string' || !actor.id) {
    throw new ApiError('CAPABILITY_REQUIRED', 'This action is not authorized.', { status: 403 });
  }
  const authorization = accountAuthorization(actor);
  if (
    authorization.active !== true ||
    authorization.mappingStatus !== 'MAPPED' ||
    !authorization.capabilities.includes('reference.manage')
  ) {
    throw new ApiError('CAPABILITY_REQUIRED', 'This action is not authorized.', { status: 403 });
  }
}

function canonicalJson(value) {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') {
    return `{${Object.keys(value)
      .sort()
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
      .join(',')}}`;
  }
  return JSON.stringify(value);
}

async function requestFingerprint(value) {
  const encoded = new TextEncoder().encode(canonicalJson(value));
  const digest = await globalThis.crypto.subtle.digest('SHA-256', encoded);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

function safeLink(link) {
  if (!link) return null;
  return Object.freeze({
    id: link.id,
    label: link.label,
    url: link.url,
    linkType: link.linkType,
    audience: link.audience,
    status: link.status,
    revision: Number(link.revision),
    syncState: link.syncState,
    createdAt: link.createdAt,
    updatedAt: link.updatedAt,
    archivedAt: link.archivedAt || null,
  });
}

function safeVersion(version) {
  return Object.freeze({
    revision: Number(version.revision),
    action: version.action,
    before: safeLink(version.before),
    after: safeLink(version.after),
    createdAt: version.createdAt,
    correlationId: version.correlationId,
  });
}

function timestamp(clock) {
  const value = clock.now();
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) throw new Error('Reference Link clock returned an invalid time.');
  return date.toISOString();
}

function normalizedCorrelationId(value, createId) {
  return value ? requiredText(value, 'correlationId', 128) : createId('COR');
}

function mutationSnapshot(link) {
  return {
    id: link.id,
    label: link.label,
    url: link.url,
    linkType: link.linkType,
    audience: link.audience,
    status: link.status,
    revision: link.revision,
    syncState: link.syncState,
    createdAt: link.createdAt,
    updatedAt: link.updatedAt,
    archivedAt: link.archivedAt || null,
  };
}

function pageInput(command) {
  const page = command.page === undefined ? 1 : positiveInteger(command.page, 'page', { max: 100_000 });
  const pageSize =
    command.pageSize === undefined ? 20 : positiveInteger(command.pageSize, 'pageSize', { max: 100 });
  return { page, pageSize };
}

export function createReferenceLinkService({
  repository,
  approvedInternalRoutes = [],
  syncConfigured = false,
  clock = { now: () => Date.now() },
  createId = (prefix) => `${prefix}-${globalThis.crypto.randomUUID()}`,
} = {}) {
  if (!repository) throw new Error('Reference Link repository is required.');
  const approvedRoutes = approvedRouteSet(approvedInternalRoutes);
  const nextSyncState = syncConfigured
    ? REFERENCE_LINK_SYNC_STATES.SYNC_PENDING
    : REFERENCE_LINK_SYNC_STATES.NOT_CONFIGURED;

  async function replayState(actor, operation, key, fingerprintValue) {
    const scope = `reference-link:${actor.id}:${operation}`;
    const fingerprint = await requestFingerprint(fingerprintValue);
    const prior = await repository.getIdempotency(scope, key);
    if (prior) {
      if (prior.actorAccountId !== actor.id || prior.requestFingerprint !== fingerprint) {
        throw new ApiError('IDEMPOTENCY_CONFLICT', 'The retry key was already used for another mutation.', {
          status: 409,
        });
      }
      if (!prior.result || typeof prior.result !== 'object') {
        throw new ApiError('IDEMPOTENCY_RECORD_INVALID', 'The stored retry result is unavailable.', {
          status: 500,
        });
      }
      return { replayed: true, result: { ...prior.result, replayed: true } };
    }
    return { replayed: false, scope, key, fingerprint };
  }

  async function recoverReplay(actor, replay, error) {
    const prior = await repository.getIdempotency(replay.scope, replay.key);
    if (!prior) throw error;
    if (prior.actorAccountId !== actor.id || prior.requestFingerprint !== replay.fingerprint) {
      throw new ApiError('IDEMPOTENCY_CONFLICT', 'The retry key was already used for another mutation.', {
        status: 409,
      });
    }
    return { ...prior.result, replayed: true };
  }

  function mutationRecords({ actor, operation, action, before, after, reason, replay, correlationId, at }) {
    const result = {
      ok: true,
      link: safeLink(after),
      correlationId,
      replayed: false,
    };
    return {
      result,
      version: {
        id: createId('RLV'),
        linkId: after.id,
        revision: after.revision,
        before: before ? mutationSnapshot(before) : null,
        after: mutationSnapshot(after),
        action,
        actorAccountId: actor.id,
        reason,
        idempotencyKey: replay.key,
        correlationId,
        createdAt: at,
      },
      audit: {
        id: createId('AUD'),
        action: `REFERENCE_LINK_${action}`,
        entityId: after.id,
        actorAccountId: actor.id,
        before: before ? mutationSnapshot(before) : {},
        after: mutationSnapshot(after),
        correlationId,
        createdAt: at,
      },
      idempotency: {
        scope: replay.scope,
        key: replay.key,
        actorAccountId: actor.id,
        requestFingerprint: replay.fingerprint,
        result,
        createdAt: at,
      },
      operation,
    };
  }

  async function list({ actor, command = {} } = {}) {
    assertAuthorized(actor);
    const { page, pageSize } = pageInput(command);
    const query = optionalText(command.query, 'query', 160);
    const status = command.status ? enumValue(command.status, 'status', STATUSES) : '';
    const audience = command.audience ? enumValue(command.audience, 'audience', AUDIENCES) : '';
    const result = await repository.list({ query, status, audience, page, pageSize });
    const total = Number(result.total ?? 0);
    return {
      ok: true,
      items: (result.items ?? []).map(safeLink),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    };
  }

  async function get({ actor, id } = {}) {
    assertAuthorized(actor);
    const link = await repository.getById(safeLinkId(id));
    if (!link)
      throw new ApiError('REFERENCE_LINK_NOT_FOUND', 'The reference link was not found.', { status: 404 });
    return { ok: true, link: safeLink(link) };
  }

  async function history({ actor, id, command = {} } = {}) {
    assertAuthorized(actor);
    const linkId = safeLinkId(id);
    if (!(await repository.getById(linkId))) {
      throw new ApiError('REFERENCE_LINK_NOT_FOUND', 'The reference link was not found.', { status: 404 });
    }
    const { page, pageSize } = pageInput(command);
    const result = await repository.listVersions({ linkId, page, pageSize });
    const total = Number(result.total ?? 0);
    return {
      ok: true,
      items: (result.items ?? []).map(safeVersion),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      },
    };
  }

  async function create({ actor, command = {}, correlationId = '' } = {}) {
    assertAuthorized(actor);
    const key = idempotencyKey(command.clientRequestId);
    const target = normalizeTarget(command, approvedRoutes);
    const normalized = {
      label: requiredText(command.label, 'label', 160),
      ...target,
      audience: enumValue(command.audience, 'audience', AUDIENCES),
      reason: requiredText(command.reason, 'reason', 500),
    };
    const replay = await replayState(actor, 'CREATE', key, normalized);
    if (replay.replayed) return replay.result;
    const at = timestamp(clock);
    const resolvedCorrelationId = normalizedCorrelationId(correlationId, createId);
    const link = {
      id: createId('RLK'),
      ...normalized,
      status: REFERENCE_LINK_STATUSES.DRAFT,
      revision: 1,
      syncState: nextSyncState,
      createdByAccountId: actor.id,
      updatedByAccountId: actor.id,
      createdAt: at,
      updatedAt: at,
      archivedAt: null,
    };
    delete link.reason;
    const records = mutationRecords({
      actor,
      operation: 'CREATE',
      action: 'CREATED',
      before: null,
      after: link,
      reason: normalized.reason,
      replay,
      correlationId: resolvedCorrelationId,
      at,
    });
    try {
      await repository.create({ link, ...records });
      return records.result;
    } catch (error) {
      return recoverReplay(actor, replay, error);
    }
  }

  async function update({ actor, command = {}, correlationId = '' } = {}) {
    assertAuthorized(actor);
    const key = idempotencyKey(command.clientRequestId);
    const target = normalizeTarget(command, approvedRoutes);
    const normalized = {
      id: safeLinkId(command.id),
      expectedRevision: positiveInteger(command.expectedRevision, 'expectedRevision'),
      label: requiredText(command.label, 'label', 160),
      ...target,
      audience: enumValue(command.audience, 'audience', AUDIENCES),
      reason: requiredText(command.reason, 'reason', 500),
    };
    const replay = await replayState(actor, 'UPDATE', key, normalized);
    if (replay.replayed) return replay.result;
    const current = await repository.getById(normalized.id);
    if (!current)
      throw new ApiError('REFERENCE_LINK_NOT_FOUND', 'The reference link was not found.', { status: 404 });
    if (Number(current.revision) !== normalized.expectedRevision) {
      throw new ApiError(
        'REFERENCE_LINK_REVISION_CONFLICT',
        'The reference link changed. Refresh and retry.',
        {
          status: 409,
        },
      );
    }
    if (!MUTABLE_STATUSES.has(current.status)) {
      throw new ApiError('REFERENCE_LINK_ARCHIVED', 'Archived reference links cannot be changed.', {
        status: 409,
      });
    }
    const at = timestamp(clock);
    const resolvedCorrelationId = normalizedCorrelationId(correlationId, createId);
    const next = {
      ...current,
      label: normalized.label,
      url: normalized.url,
      linkType: normalized.linkType,
      audience: normalized.audience,
      revision: normalized.expectedRevision + 1,
      syncState: nextSyncState,
      updatedByAccountId: actor.id,
      updatedAt: at,
    };
    const records = mutationRecords({
      actor,
      operation: 'UPDATE',
      action: 'UPDATED',
      before: current,
      after: next,
      reason: normalized.reason,
      replay,
      correlationId: resolvedCorrelationId,
      at,
    });
    try {
      const outcome = await repository.update({
        linkId: current.id,
        expectedRevision: normalized.expectedRevision,
        next,
        ...records,
      });
      if (!outcome.updated) {
        throw new ApiError(
          'REFERENCE_LINK_REVISION_CONFLICT',
          'The reference link changed. Refresh and retry.',
          { status: 409 },
        );
      }
      return records.result;
    } catch (error) {
      return recoverReplay(actor, replay, error);
    }
  }

  async function transition({ actor, command = {}, correlationId = '' } = {}) {
    assertAuthorized(actor);
    const key = idempotencyKey(command.clientRequestId);
    const normalized = {
      id: safeLinkId(command.id),
      expectedRevision: positiveInteger(command.expectedRevision, 'expectedRevision'),
      status: enumValue(command.status, 'status', STATUSES),
      reason: requiredText(command.reason, 'reason', 500),
    };
    const replay = await replayState(actor, 'TRANSITION', key, normalized);
    if (replay.replayed) return replay.result;
    const current = await repository.getById(normalized.id);
    if (!current)
      throw new ApiError('REFERENCE_LINK_NOT_FOUND', 'The reference link was not found.', { status: 404 });
    if (Number(current.revision) !== normalized.expectedRevision) {
      throw new ApiError(
        'REFERENCE_LINK_REVISION_CONFLICT',
        'The reference link changed. Refresh and retry.',
        {
          status: 409,
        },
      );
    }
    if (!TRANSITIONS[current.status]?.has(normalized.status)) {
      throw new ApiError(
        'REFERENCE_LINK_TRANSITION_INVALID',
        'The requested reference link state transition is not allowed.',
        { status: 409 },
      );
    }
    const at = timestamp(clock);
    const resolvedCorrelationId = normalizedCorrelationId(correlationId, createId);
    const next = {
      ...current,
      status: normalized.status,
      revision: normalized.expectedRevision + 1,
      syncState: nextSyncState,
      updatedByAccountId: actor.id,
      updatedAt: at,
      archivedAt: normalized.status === REFERENCE_LINK_STATUSES.ARCHIVED ? at : null,
    };
    const action =
      normalized.status === REFERENCE_LINK_STATUSES.ACTIVE
        ? 'ACTIVATED'
        : normalized.status === REFERENCE_LINK_STATUSES.INACTIVE
          ? 'DEACTIVATED'
          : 'ARCHIVED';
    const records = mutationRecords({
      actor,
      operation: 'TRANSITION',
      action,
      before: current,
      after: next,
      reason: normalized.reason,
      replay,
      correlationId: resolvedCorrelationId,
      at,
    });
    try {
      const outcome = await repository.update({
        linkId: current.id,
        expectedRevision: normalized.expectedRevision,
        next,
        ...records,
      });
      if (!outcome.updated) {
        throw new ApiError(
          'REFERENCE_LINK_REVISION_CONFLICT',
          'The reference link changed. Refresh and retry.',
          { status: 409 },
        );
      }
      return records.result;
    } catch (error) {
      return recoverReplay(actor, replay, error);
    }
  }

  return Object.freeze({ list, get, history, create, update, transition });
}
