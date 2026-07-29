import { accountAuthorization } from './auth/contracts.js';
import { ApiError } from './d1/operational-service.js';

const CONTENT_TYPES = Object.freeze({
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
});
const MAX_IMAGE_BYTES = 750_000;

function mediaMatchesType(bytes, contentType) {
  if (contentType === 'image/jpeg') {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }
  if (contentType === 'image/png') {
    return [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every(
      (value, index) => bytes[index] === value,
    );
  }
  if (contentType === 'image/webp') {
    return (
      String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' &&
      String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP'
    );
  }
  return false;
}

const requiredText = (value, field, max = 240) => {
  const result = String(value ?? '').trim();
  if (!result || result.length > max) {
    throw new ApiError('VALIDATION_FAILED', `${field} is required.`, {
      status: 422,
      details: { field },
    });
  }
  return result;
};
const optionalText = (value, max = 500) =>
  String(value ?? '')
    .trim()
    .slice(0, max);

function assertAdmin(account) {
  const authorization = accountAuthorization(account);
  if (!authorization.capabilities.includes('advertisement.manage')) {
    throw new ApiError('AUTHORIZATION_DENIED', 'Advertisement management is Administrator-only.', {
      status: 403,
    });
  }
}

function safeId(value) {
  const result = requiredText(value, 'id', 80).toUpperCase();
  if (!/^[A-Z0-9][A-Z0-9_-]{2,79}$/u.test(result)) {
    throw new ApiError('VALIDATION_FAILED', 'Use a safe stable advertisement ID.', {
      status: 422,
      details: { field: 'id' },
    });
  }
  return result;
}

function optionalInstant(value, field) {
  const result = optionalText(value, 32);
  if (result && Number.isNaN(Date.parse(result))) {
    throw new ApiError('VALIDATION_FAILED', `${field} must be a valid date and time.`, {
      status: 422,
      details: { field },
    });
  }
  return result ? new Date(result).toISOString() : null;
}

function destination(value) {
  const result = optionalText(value, 500);
  if (!result) return '';
  let parsed;
  try {
    parsed = new URL(result);
  } catch {
    parsed = null;
  }
  if (!parsed || parsed.protocol !== 'https:') {
    throw new ApiError('VALIDATION_FAILED', 'Destination must use HTTPS.', {
      status: 422,
      details: { field: 'destinationUrl' },
    });
  }
  return parsed.href;
}

async function requestHash(command) {
  const bytes = new TextEncoder().encode(JSON.stringify(command));
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function replay(db, account, operation, command) {
  const key = requiredText(command.clientRequestId, 'clientRequestId', 100);
  const hash = await requestHash(command);
  const previous = await db
    .prepare(
      `SELECT request_hash, result_json FROM advertisement_mutation_results
       WHERE actor_account_id = ?1 AND operation = ?2 AND idempotency_key = ?3`,
    )
    .bind(account.id, operation, key)
    .first();
  if (previous) {
    if (previous.request_hash !== hash) {
      throw new ApiError('IDEMPOTENCY_CONFLICT', 'This retry key was used with different values.', {
        status: 409,
      });
    }
    return { key, hash, result: JSON.parse(previous.result_json) };
  }
  return { key, hash, result: null };
}

function auditStatement(db, { account, action, id, after, correlationId }) {
  return db
    .prepare(
      `INSERT INTO audit_log (
         id, created_at, action, entity_type, entity_id, actor_account_id,
         after_json, correlation_id
       ) VALUES (?1, ?2, ?3, 'ADVERTISEMENT', ?4, ?5, ?6, ?7)`,
    )
    .bind(
      `AUD-${crypto.randomUUID()}`,
      new Date().toISOString(),
      action,
      id,
      account.id,
      JSON.stringify(after),
      correlationId,
    );
}

function idempotencyStatement(db, { account, operation, replayState, result, createdAt }) {
  return db
    .prepare(
      `INSERT INTO advertisement_mutation_results (
         actor_account_id, operation, idempotency_key, request_hash, result_json, created_at
       ) VALUES (?1, ?2, ?3, ?4, ?5, ?6)`,
    )
    .bind(
      account.id,
      operation,
      replayState.key,
      replayState.hash,
      JSON.stringify(result),
      createdAt,
    );
}

function normalizedMetadata(command, current = {}) {
  current ??= {};
  const publishAt = optionalInstant(command.publishAt ?? current.publish_at, 'publishAt');
  const expireAt = optionalInstant(command.expireAt ?? current.expire_at, 'expireAt');
  if (publishAt && expireAt && expireAt <= publishAt) {
    throw new ApiError('VALIDATION_FAILED', 'Expiration must be later than publication.', {
      status: 422,
      details: { field: 'expireAt' },
    });
  }
  return {
    title: requiredText(command.title ?? current.title, 'title', 160),
    description: optionalText(command.description ?? current.description, 500),
    altText: requiredText(command.altText ?? current.alt_text, 'altText', 240),
    callToAction: optionalText(command.callToAction ?? current.call_to_action, 80),
    destinationUrl: destination(command.destinationUrl ?? current.destination_url),
    status: String(command.status ?? current.status ?? 'DRAFT').toUpperCase(),
    displayOrder: Number(command.displayOrder ?? current.display_order ?? 0),
    publishAt,
    expireAt,
  };
}

export function createAdvertisementAdminService({ db, bucket } = {}) {
  if (!db) throw new Error('D1 database binding is required.');
  if (!bucket) throw new Error('R2 advertisement binding is required.');

  async function list({ account, command = {} } = {}) {
    assertAdmin(account);
    const page = Math.max(1, Number(command.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(command.pageSize) || 20));
    const status = optionalText(command.status, 20).toUpperCase();
    const query = optionalText(command.query, 120);
    const filter = `WHERE (?1 = '' OR status = ?1)
      AND (?2 = '' OR lower(title || ' ' || id || ' ' || description) LIKE '%' || lower(?2) || '%')`;
    const total = await db
      .prepare(`SELECT COUNT(*) AS count FROM public_advertisements ${filter}`)
      .bind(status === 'ALL' ? '' : status, query)
      .first();
    const result = await db
      .prepare(
        `SELECT id, title, description, alt_text, call_to_action, image_asset_key,
           destination_url, status, display_order, publish_at, expire_at,
           created_by, updated_by, created_at, updated_at, archived_at
         FROM public_advertisements ${filter}
         ORDER BY display_order, created_at DESC, id
         LIMIT ?3 OFFSET ?4`,
      )
      .bind(status === 'ALL' ? '' : status, query, pageSize, (page - 1) * pageSize)
      .all();
    const count = Number(total?.count ?? 0);
    return {
      ok: true,
      items: result.results ?? [],
      pagination: {
        page,
        pageSize,
        total: count,
        totalPages: Math.max(1, Math.ceil(count / pageSize)),
      },
    };
  }

  async function save({ account, command = {}, correlationId = '' } = {}) {
    assertAdmin(account);
    const operation = 'SAVE';
    const replayState = await replay(db, account, operation, command);
    if (replayState.result) return { ...replayState.result, replayed: true };
    const id = safeId(command.id);
    const current = await db
      .prepare('SELECT * FROM public_advertisements WHERE id = ?1')
      .bind(id)
      .first();
    const metadata = normalizedMetadata(command, current);
    if (!['DRAFT', 'ACTIVE', 'INACTIVE'].includes(metadata.status)) {
      throw new ApiError('VALIDATION_FAILED', 'Choose Draft, Active, or Inactive.', {
        status: 422,
        details: { field: 'status' },
      });
    }
    if (metadata.status === 'ACTIVE' && !current?.image_asset_key) {
      throw new ApiError(
        'ADVERTISEMENT_MEDIA_REQUIRED',
        'Upload validated media before activating the advertisement.',
        { status: 409 },
      );
    }
    const timestamp = new Date().toISOString();
    const result = { ok: true, id, status: metadata.status, updatedAt: timestamp, replayed: false };
    const write = current
      ? db
          .prepare(
            `UPDATE public_advertisements
             SET title = ?2, description = ?3, alt_text = ?4, call_to_action = ?5,
               destination_url = ?6, status = ?7, display_order = ?8, publish_at = ?9,
               expire_at = ?10, updated_by = ?11, updated_at = ?12, archived_at = NULL
             WHERE id = ?1`,
          )
          .bind(
            id,
            metadata.title,
            metadata.description,
            metadata.altText,
            metadata.callToAction,
            metadata.destinationUrl,
            metadata.status,
            metadata.displayOrder,
            metadata.publishAt,
            metadata.expireAt,
            account.id,
            timestamp,
          )
      : db
          .prepare(
            `INSERT INTO public_advertisements (
               id, title, description, alt_text, call_to_action, image_asset_key,
               destination_url, status, display_order, publish_at, expire_at,
               created_by, updated_by, created_at, updated_at
             ) VALUES (?1, ?2, ?3, ?4, ?5, '', ?6, ?7, ?8, ?9, ?10, ?11, ?11, ?12, ?12)`,
          )
          .bind(
            id,
            metadata.title,
            metadata.description,
            metadata.altText,
            metadata.callToAction,
            metadata.destinationUrl,
            metadata.status,
            metadata.displayOrder,
            metadata.publishAt,
            metadata.expireAt,
            account.id,
            timestamp,
          );
    await db.batch([
      write,
      auditStatement(db, {
        account,
        action: current ? 'ADVERTISEMENT_UPDATED' : 'ADVERTISEMENT_CREATED',
        id,
        after: metadata,
        correlationId,
      }),
      idempotencyStatement(db, {
        account,
        operation,
        replayState,
        result,
        createdAt: timestamp,
      }),
    ]);
    return result;
  }

  async function upload({ account, command = {}, correlationId = '' } = {}) {
    assertAdmin(account);
    const operation = 'UPLOAD';
    const replayState = await replay(db, account, operation, command);
    if (replayState.result) return { ...replayState.result, replayed: true };
    const id = safeId(command.id);
    const contentType = optionalText(command.contentType, 80).toLowerCase();
    const extension = CONTENT_TYPES[contentType];
    if (!extension) {
      throw new ApiError('ADVERTISEMENT_MEDIA_TYPE_INVALID', 'Use JPEG, PNG, or WebP media.', {
        status: 415,
      });
    }
    let bytes;
    try {
      const binary = atob(requiredText(command.base64, 'base64', 1_100_000));
      bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    } catch {
      throw new ApiError('ADVERTISEMENT_MEDIA_INVALID', 'The advertisement media is invalid.', {
        status: 422,
      });
    }
    if (bytes.length < 32 || bytes.length > MAX_IMAGE_BYTES) {
      throw new ApiError(
        'ADVERTISEMENT_MEDIA_SIZE_INVALID',
        `Advertisement media must be between 32 bytes and ${MAX_IMAGE_BYTES} bytes.`,
        { status: 413 },
      );
    }
    if (!mediaMatchesType(bytes, contentType)) {
      throw new ApiError(
        'ADVERTISEMENT_MEDIA_SIGNATURE_INVALID',
        'The file contents do not match the declared image type.',
        { status: 422 },
      );
    }
    const record = await db
      .prepare('SELECT image_asset_key FROM public_advertisements WHERE id = ?1 AND archived_at IS NULL')
      .bind(id)
      .first();
    if (!record) {
      throw new ApiError('ADVERTISEMENT_NOT_FOUND', 'Create the advertisement before uploading media.', {
        status: 404,
      });
    }
    const assetKey = `advertisements/${id.toLowerCase()}/${crypto.randomUUID()}.${extension}`;
    const timestamp = new Date().toISOString();
    await bucket.put(`catalog/${assetKey}`, bytes, {
      httpMetadata: { contentType },
      customMetadata: { advertisementId: id, uploadedBy: account.id },
    });
    const result = {
      ok: true,
      id,
      imageUrl: `/media/advertisements/${encodeURIComponent(id)}`,
      updatedAt: timestamp,
      replayed: false,
    };
    try {
      await db.batch([
        db
          .prepare(
            `UPDATE public_advertisements
             SET image_asset_key = ?2, updated_by = ?3, updated_at = ?4
             WHERE id = ?1`,
          )
          .bind(id, assetKey, account.id, timestamp),
        auditStatement(db, {
          account,
          action: 'ADVERTISEMENT_MEDIA_REPLACED',
          id,
          after: { assetKey, contentType, byteLength: bytes.length },
          correlationId,
        }),
        idempotencyStatement(db, {
          account,
          operation,
          replayState,
          result,
          createdAt: timestamp,
        }),
      ]);
    } catch (error) {
      await bucket.delete(`catalog/${assetKey}`);
      throw error;
    }
    if (
      record.image_asset_key &&
      record.image_asset_key !== 'advertisements/executive-staff-applications.jpg'
    ) {
      await bucket.delete(`catalog/${record.image_asset_key}`);
    }
    return result;
  }

  async function archive({ account, command = {}, correlationId = '' } = {}) {
    assertAdmin(account);
    const operation = 'ARCHIVE';
    const replayState = await replay(db, account, operation, command);
    if (replayState.result) return { ...replayState.result, replayed: true };
    const id = safeId(command.id);
    const timestamp = new Date().toISOString();
    const result = { ok: true, id, status: 'ARCHIVED', updatedAt: timestamp, replayed: false };
    const record = await db.prepare('SELECT id FROM public_advertisements WHERE id = ?1').bind(id).first();
    if (!record) {
      throw new ApiError('ADVERTISEMENT_NOT_FOUND', 'The advertisement was not found.', { status: 404 });
    }
    await db.batch([
      db
        .prepare(
          `UPDATE public_advertisements
           SET status = 'ARCHIVED', archived_at = ?2, updated_at = ?2, updated_by = ?3
           WHERE id = ?1`,
        )
        .bind(id, timestamp, account.id),
      auditStatement(db, {
        account,
        action: 'ADVERTISEMENT_ARCHIVED',
        id,
        after: { status: 'ARCHIVED' },
        correlationId,
      }),
      idempotencyStatement(db, {
        account,
        operation,
        replayState,
        result,
        createdAt: timestamp,
      }),
    ]);
    return result;
  }

  return Object.freeze({ list, save, upload, archive });
}
