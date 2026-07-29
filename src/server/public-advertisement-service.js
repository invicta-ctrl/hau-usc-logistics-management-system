import { ApiError } from './d1/operational-service.js';

const safeId = (value) => {
  const id = String(value ?? '').trim();
  if (!/^[A-Z0-9][A-Z0-9_-]{2,79}$/iu.test(id)) {
    throw new ApiError('ADVERTISEMENT_NOT_FOUND', 'The announcement is unavailable.', {
      status: 404,
    });
  }
  return id;
};

export function createPublicAdvertisementService({ db, bucket, clock = Date } = {}) {
  if (!db) throw new Error('D1 database binding is required.');
  if (!bucket) throw new Error('R2 advertisement binding is required.');
  const nowIso = () => new Date(clock.now()).toISOString();

  async function list() {
    const now = nowIso();
    const result = await db
      .prepare(
        `SELECT id, title, description, alt_text, call_to_action, destination_url
         FROM public_advertisements
         WHERE status = 'ACTIVE' AND archived_at IS NULL
           AND (publish_at IS NULL OR publish_at <= ?1)
           AND (expire_at IS NULL OR expire_at > ?1)
         ORDER BY display_order, created_at, id
         LIMIT 50`,
      )
      .bind(now)
      .all();
    return {
      ok: true,
      items: (result.results ?? []).map((row) => ({
        id: row.id,
        title: row.title,
        description: row.description,
        altText: row.alt_text,
        callToAction: row.call_to_action,
        destinationUrl: row.destination_url,
        imageUrl: `/media/advertisements/${encodeURIComponent(row.id)}`,
      })),
    };
  }

  async function image(idValue) {
    const id = safeId(idValue);
    const now = nowIso();
    const advertisement = await db
      .prepare(
        `SELECT image_asset_key
         FROM public_advertisements
         WHERE id = ?1 AND status = 'ACTIVE' AND archived_at IS NULL
           AND (publish_at IS NULL OR publish_at <= ?2)
           AND (expire_at IS NULL OR expire_at > ?2)`,
      )
      .bind(id, now)
      .first();
    if (!advertisement) {
      throw new ApiError('ADVERTISEMENT_NOT_FOUND', 'The announcement is unavailable.', {
        status: 404,
      });
    }
    const assetKey = String(advertisement.image_asset_key ?? '');
    if (!/^[a-zA-Z0-9][a-zA-Z0-9._/-]{0,199}$/u.test(assetKey) || assetKey.includes('..')) {
      throw new ApiError('ADVERTISEMENT_ASSET_INVALID', 'The announcement image is unavailable.', {
        status: 404,
      });
    }
    const object = await bucket.get(`catalog/${assetKey}`);
    if (!object) {
      throw new ApiError('ADVERTISEMENT_ASSET_MISSING', 'The announcement image is unavailable.', {
        status: 404,
      });
    }
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);
    headers.set('cache-control', 'public, max-age=300, stale-while-revalidate=600');
    headers.set('x-content-type-options', 'nosniff');
    return new Response(object.body, { headers });
  }

  return Object.freeze({ list, image });
}
