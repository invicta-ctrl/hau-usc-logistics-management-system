import { accountAuthorization } from './auth/contracts.js';
import { ApiError } from './d1/operational-service.js';

export const BRAND_ASSET_SLOTS = Object.freeze([
  'usc-logo',
  'dol-logo',
  'combined-lockup',
  'favicon',
  'login-background',
  'default-item-image',
]);

const MAX_IMAGE_BYTES = 5_000_000;
const CONTENT_EXTENSIONS = Object.freeze({
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/svg+xml': 'svg',
});

const requiredText = (value, field, max = 240) => {
  const text = String(value ?? '').trim();
  if (!text || text.length > max) {
    throw new ApiError('VALIDATION_FAILED', `${field} is required.`, {
      status: 422,
      details: { field },
    });
  }
  return text;
};

function assertOwner(account) {
  if (!accountAuthorization(account).capabilities.includes('brand.manage')) {
    throw new ApiError('AUTHORIZATION_DENIED', 'Brand asset management is System Owner-only.', {
      status: 403,
    });
  }
}

function safeSlot(value) {
  const slot = requiredText(value, 'slot', 40).toLowerCase();
  if (!BRAND_ASSET_SLOTS.includes(slot)) {
    throw new ApiError('BRAND_ASSET_SLOT_INVALID', 'Choose a governed brand asset slot.', {
      status: 422,
      details: { field: 'slot' },
    });
  }
  return slot;
}

const ascii = (bytes, start, length) => String.fromCharCode(...bytes.slice(start, start + length));
const u16be = (bytes, offset) => (bytes[offset] << 8) | bytes[offset + 1];
const u24le = (bytes, offset) => bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16);
const u32be = (bytes, offset) =>
  (bytes[offset] * 0x1000000 + (bytes[offset + 1] << 16) + (bytes[offset + 2] << 8) + bytes[offset + 3]) >>>
  0;

function jpegDimensions(bytes) {
  let offset = 2;
  while (offset + 9 < bytes.length) {
    if (bytes[offset] !== 0xff) {
      offset += 1;
      continue;
    }
    const marker = bytes[offset + 1];
    if ([0xd8, 0xd9].includes(marker)) {
      offset += 2;
      continue;
    }
    const length = u16be(bytes, offset + 2);
    if (length < 2 || offset + length + 2 > bytes.length) break;
    if (
      (marker >= 0xc0 && marker <= 0xc3) ||
      (marker >= 0xc5 && marker <= 0xc7) ||
      (marker >= 0xc9 && marker <= 0xcb) ||
      (marker >= 0xcd && marker <= 0xcf)
    ) {
      return { height: u16be(bytes, offset + 5), width: u16be(bytes, offset + 7) };
    }
    offset += length + 2;
  }
  return null;
}

function webpDimensions(bytes) {
  const chunk = ascii(bytes, 12, 4);
  if (chunk === 'VP8X' && bytes.length >= 30) {
    return { width: 1 + u24le(bytes, 24), height: 1 + u24le(bytes, 27) };
  }
  if (chunk === 'VP8L' && bytes.length >= 25 && bytes[20] === 0x2f) {
    const bits = (bytes[21] | (bytes[22] << 8) | (bytes[23] << 16) | (bytes[24] << 24)) >>> 0;
    return { width: 1 + (bits & 0x3fff), height: 1 + ((bits >>> 14) & 0x3fff) };
  }
  if (
    chunk === 'VP8 ' &&
    bytes.length >= 30 &&
    bytes[23] === 0x9d &&
    bytes[24] === 0x01 &&
    bytes[25] === 0x2a
  ) {
    return {
      width: u16be(Uint8Array.of(bytes[27], bytes[26]), 0) & 0x3fff,
      height: u16be(Uint8Array.of(bytes[29], bytes[28]), 0) & 0x3fff,
    };
  }
  return null;
}

function sanitizedSvg(bytes) {
  let source;
  try {
    source = new TextDecoder('utf-8', { fatal: true }).decode(bytes).trim();
  } catch {
    return null;
  }
  if (!/^<svg(?:\s|>)/iu.test(source.replace(/^<\?xml[^>]*>\s*/iu, ''))) return null;
  if (/<\s*(?:script|foreignObject|iframe|object|embed|audio|video)\b/iu.test(source)) return null;
  if (/\son[a-z]+\s*=/iu.test(source)) return null;
  if (/(?:href|src)\s*=\s*["']\s*(?:https?:|\/\/|data:|javascript:)/iu.test(source)) return null;
  if (/url\s*\(\s*["']?\s*(?:https?:|\/\/|data:|javascript:)/iu.test(source)) return null;
  if (/<!DOCTYPE|<!ENTITY/iu.test(source)) return null;
  const tag = source.match(/<svg\b([^>]*)>/iu)?.[1] ?? '';
  const widthValue = tag.match(/\bwidth\s*=\s*["']([0-9.]+)(?:px)?["']/iu)?.[1];
  const heightValue = tag.match(/\bheight\s*=\s*["']([0-9.]+)(?:px)?["']/iu)?.[1];
  const viewBox = tag.match(/\bviewBox\s*=\s*["']\s*[-0-9.]+\s+[-0-9.]+\s+([0-9.]+)\s+([0-9.]+)\s*["']/iu);
  const width = Math.round(Number(widthValue ?? viewBox?.[1]));
  const height = Math.round(Number(heightValue ?? viewBox?.[2]));
  return width > 0 && height > 0 ? { bytes: new TextEncoder().encode(source), width, height } : null;
}

export function inspectBrandAssetBytes(input) {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input ?? []);
  let contentType = '';
  let dimensions = null;
  let normalizedBytes = bytes;
  if ([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((value, index) => bytes[index] === value)) {
    contentType = 'image/png';
    if (ascii(bytes, 12, 4) === 'IHDR') dimensions = { width: u32be(bytes, 16), height: u32be(bytes, 20) };
  } else if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    contentType = 'image/jpeg';
    dimensions = jpegDimensions(bytes);
  } else if (ascii(bytes, 0, 4) === 'RIFF' && ascii(bytes, 8, 4) === 'WEBP') {
    contentType = 'image/webp';
    dimensions = webpDimensions(bytes);
  } else {
    const svg = sanitizedSvg(bytes);
    if (svg) {
      contentType = 'image/svg+xml';
      dimensions = svg;
      normalizedBytes = svg.bytes;
    }
  }
  if (!contentType || !dimensions) {
    throw new ApiError('BRAND_ASSET_MEDIA_INVALID', 'Use a valid PNG, JPEG, WebP, or sanitized SVG image.', {
      status: 415,
    });
  }
  if (normalizedBytes.length < 32 || normalizedBytes.length > MAX_IMAGE_BYTES) {
    throw new ApiError(
      'BRAND_ASSET_SIZE_INVALID',
      `Brand assets must be between 32 and ${MAX_IMAGE_BYTES} bytes.`,
      { status: 413 },
    );
  }
  if (
    dimensions.width < 16 ||
    dimensions.height < 16 ||
    dimensions.width > 8192 ||
    dimensions.height > 8192
  ) {
    throw new ApiError(
      'BRAND_ASSET_DIMENSIONS_INVALID',
      'Brand asset dimensions must be between 16 and 8192 pixels.',
      { status: 422 },
    );
  }
  return { bytes: normalizedBytes, contentType, width: dimensions.width, height: dimensions.height };
}

async function sha256(value) {
  const digest = await crypto.subtle.digest('SHA-256', value);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

async function replay(db, account, operation, command) {
  const key = requiredText(command.clientRequestId, 'clientRequestId', 100);
  const hash = await sha256(new TextEncoder().encode(JSON.stringify(command)));
  const previous = await db
    .prepare(
      `SELECT request_hash, result_json FROM brand_asset_mutation_results
     WHERE actor_account_id = ?1 AND operation = ?2 AND idempotency_key = ?3`,
    )
    .bind(account.id, operation, key)
    .first();
  if (previous) {
    if (previous.request_hash !== hash)
      throw new ApiError('IDEMPOTENCY_CONFLICT', 'This retry key was used with different values.', {
        status: 409,
      });
    return { key, hash, result: JSON.parse(previous.result_json) };
  }
  return { key, hash, result: null };
}

function mutationStatement(db, account, operation, replayState, result, timestamp) {
  return db
    .prepare(
      `INSERT INTO brand_asset_mutation_results
     (actor_account_id, operation, idempotency_key, request_hash, result_json, created_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6)`,
    )
    .bind(account.id, operation, replayState.key, replayState.hash, JSON.stringify(result), timestamp);
}

function auditStatement(db, account, action, slot, after, correlationId, timestamp) {
  return db
    .prepare(
      `INSERT INTO audit_log (id, created_at, action, entity_type, entity_id, actor_account_id, after_json, correlation_id)
     VALUES (?1, ?2, ?3, 'BRAND_ASSET', ?4, ?5, ?6, ?7)`,
    )
    .bind(
      `AUD-${crypto.randomUUID()}`,
      timestamp,
      action,
      slot,
      account.id,
      JSON.stringify(after),
      correlationId,
    );
}

export function createBrandAssetService({ db, bucket, clock = Date } = {}) {
  if (!db) throw new Error('D1 database binding is required.');
  if (!bucket) throw new Error('R2 brand asset binding is required.');
  const now = () => new Date(clock.now()).toISOString();

  async function list({ account } = {}) {
    assertOwner(account);
    const slots = await db
      .prepare(
        `SELECT slot.id, slot.label, slot.public_path, slot.revision,
         version.id AS published_version_id, version.version_number, version.content_type,
         version.byte_size, version.width, version.height, version.content_sha256,
         version.alt_text, version.published_at
       FROM brand_asset_slots slot
       LEFT JOIN brand_asset_versions version ON version.id = slot.published_version_id
       ORDER BY slot.rowid`,
      )
      .all();
    const versions = await db
      .prepare(
        `SELECT id, slot_id, version_number, content_type, byte_size, width, height,
         content_sha256, alt_text, status, uploaded_at, published_at
       FROM brand_asset_versions ORDER BY slot_id, version_number DESC`,
      )
      .all();
    const history = await db
      .prepare(
        `SELECT id, slot_id, version_id, action, reason, actor_account_id, occurred_at, correlation_id
         FROM brand_asset_history ORDER BY occurred_at DESC LIMIT 200`,
      )
      .all();
    return {
      ok: true,
      slots: slots.results ?? [],
      versions: versions.results ?? [],
      history: history.results ?? [],
    };
  }

  async function upload({ account, command = {}, correlationId = '' } = {}) {
    assertOwner(account);
    const replayState = await replay(db, account, 'UPLOAD', command);
    if (replayState.result) return { ...replayState.result, replayed: true };
    const slot = safeSlot(command.slot);
    const altText = requiredText(command.altText, 'altText', 240);
    let decoded;
    try {
      const binary = atob(requiredText(command.base64, 'base64', 7_000_000));
      decoded = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    } catch {
      throw new ApiError('BRAND_ASSET_MEDIA_INVALID', 'The uploaded image is not valid base64.', {
        status: 422,
      });
    }
    const media = inspectBrandAssetBytes(decoded);
    if (slot === 'favicon' && (media.width > 512 || media.height > 512)) {
      throw new ApiError(
        'BRAND_ASSET_DIMENSIONS_INVALID',
        'The favicon must be no larger than 512 by 512 pixels.',
        { status: 422 },
      );
    }
    const hash = await sha256(media.bytes);
    const duplicate = await db
      .prepare('SELECT id FROM brand_asset_versions WHERE slot_id = ?1 AND content_sha256 = ?2')
      .bind(slot, hash)
      .first();
    if (duplicate)
      throw new ApiError(
        'BRAND_ASSET_DUPLICATE',
        'This exact asset version already exists in the selected slot.',
        { status: 409 },
      );
    const latest = await db
      .prepare(
        'SELECT COALESCE(MAX(version_number), 0) AS version_number FROM brand_asset_versions WHERE slot_id = ?1',
      )
      .bind(slot)
      .first();
    const versionNumber = Number(latest?.version_number ?? 0) + 1;
    const versionId = `BRAND-${crypto.randomUUID()}`;
    const objectKey = `brand/versions/${slot}/${versionId}.${CONTENT_EXTENSIONS[media.contentType]}`;
    const timestamp = now();
    const result = {
      ok: true,
      slot,
      versionId,
      versionNumber,
      status: 'DRAFT',
      contentType: media.contentType,
      byteSize: media.bytes.length,
      width: media.width,
      height: media.height,
      sha256: hash,
      replayed: false,
    };
    await bucket.put(objectKey, media.bytes, {
      httpMetadata: { contentType: media.contentType },
      customMetadata: { slot, versionId, sha256: hash, uploadedBy: account.id },
    });
    try {
      await db.batch([
        db
          .prepare(
            `INSERT INTO brand_asset_versions
           (id, slot_id, version_number, object_key, content_type, byte_size, width, height,
            content_sha256, alt_text, status, uploaded_by, uploaded_at)
           VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, 'DRAFT', ?11, ?12)`,
          )
          .bind(
            versionId,
            slot,
            versionNumber,
            objectKey,
            media.contentType,
            media.bytes.length,
            media.width,
            media.height,
            hash,
            altText,
            account.id,
            timestamp,
          ),
        db
          .prepare(
            `INSERT INTO brand_asset_history
           (id, slot_id, version_id, action, after_json, reason, actor_account_id, occurred_at, correlation_id, idempotency_key)
           VALUES (?1, ?2, ?3, 'UPLOADED', ?4, ?5, ?6, ?7, ?8, ?9)`,
          )
          .bind(
            `BRH-${crypto.randomUUID()}`,
            slot,
            versionId,
            JSON.stringify(result),
            requiredText(command.reason, 'reason', 500),
            account.id,
            timestamp,
            correlationId,
            replayState.key,
          ),
        auditStatement(db, account, 'BRAND_ASSET_UPLOADED', slot, result, correlationId, timestamp),
        mutationStatement(db, account, 'UPLOAD', replayState, result, timestamp),
      ]);
    } catch (error) {
      await bucket.delete(objectKey);
      throw error;
    }
    return result;
  }

  async function changePublished({ account, command = {}, correlationId = '' } = {}, rollback = false) {
    assertOwner(account);
    const operation = rollback ? 'ROLLBACK' : 'PUBLISH';
    const replayState = await replay(db, account, operation, command);
    if (replayState.result) return { ...replayState.result, replayed: true };
    const slot = safeSlot(command.slot);
    const versionId = requiredText(command.versionId, 'versionId', 80);
    const current = await db
      .prepare('SELECT published_version_id, revision FROM brand_asset_slots WHERE id = ?1')
      .bind(slot)
      .first();
    const target = await db
      .prepare(
        'SELECT id, version_number, object_key, status, published_at FROM brand_asset_versions WHERE id = ?1 AND slot_id = ?2',
      )
      .bind(versionId, slot)
      .first();
    if (!current || !target)
      throw new ApiError('BRAND_ASSET_VERSION_NOT_FOUND', 'The selected brand asset version was not found.', {
        status: 404,
      });
    if (current.published_version_id === versionId)
      throw new ApiError('BRAND_ASSET_ALREADY_PUBLISHED', 'This version is already published.', {
        status: 409,
      });
    if (rollback && !target.published_at)
      throw new ApiError(
        'BRAND_ASSET_ROLLBACK_INVALID',
        'Rollback requires a previously published version.',
        { status: 409 },
      );
    if (command.expectedRevision != null && Number(command.expectedRevision) !== Number(current.revision)) {
      throw new ApiError('REVISION_CONFLICT', 'Brand asset data changed; refresh before publishing.', {
        status: 409,
      });
    }
    if (!(await bucket.head(target.object_key)))
      throw new ApiError('BRAND_ASSET_OBJECT_MISSING', 'The selected governed object is unavailable.', {
        status: 409,
      });
    const timestamp = now();
    const action = rollback ? 'ROLLED_BACK' : current.published_version_id ? 'REPLACED' : 'PUBLISHED';
    const result = {
      ok: true,
      slot,
      versionId,
      versionNumber: target.version_number,
      status: 'PUBLISHED',
      revision: Number(current.revision) + 1,
      publicPath: `/brand/${slot}`,
      replayed: false,
    };
    await db.batch([
      db
        .prepare(
          "UPDATE brand_asset_versions SET status = 'RETIRED' WHERE slot_id = ?1 AND status = 'PUBLISHED'",
        )
        .bind(slot),
      db
        .prepare(
          "UPDATE brand_asset_versions SET status = 'PUBLISHED', published_by = ?2, published_at = ?3 WHERE id = ?1",
        )
        .bind(versionId, account.id, timestamp),
      db
        .prepare(
          'UPDATE brand_asset_slots SET published_version_id = ?2, revision = revision + 1, updated_at = ?3, updated_by = ?4 WHERE id = ?1',
        )
        .bind(slot, versionId, timestamp, account.id),
      db
        .prepare(
          `INSERT INTO brand_asset_history
         (id, slot_id, version_id, action, before_json, after_json, reason, actor_account_id, occurred_at, correlation_id, idempotency_key)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11)`,
        )
        .bind(
          `BRH-${crypto.randomUUID()}`,
          slot,
          versionId,
          action,
          JSON.stringify({ publishedVersionId: current.published_version_id, revision: current.revision }),
          JSON.stringify(result),
          requiredText(command.reason, 'reason', 500),
          account.id,
          timestamp,
          correlationId,
          replayState.key,
        ),
      auditStatement(db, account, `BRAND_ASSET_${action}`, slot, result, correlationId, timestamp),
      mutationStatement(db, account, operation, replayState, result, timestamp),
    ]);
    return result;
  }

  return Object.freeze({
    list,
    upload,
    publish: (context) => changePublished(context, false),
    rollback: (context) => changePublished(context, true),
  });
}
