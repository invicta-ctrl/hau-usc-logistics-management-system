/* global Response, TextEncoder, URL, crypto */

const encoder = new TextEncoder();

function bytesEqual(left, right) {
  const length = Math.max(left.length, right.length);
  let difference = left.length ^ right.length;
  for (let index = 0; index < length; index += 1) {
    difference |= (left[index % left.length] ?? 0) ^ (right[index % right.length] ?? 0);
  }
  return difference === 0;
}

async function authorized(request, expected) {
  const supplied = String(request.headers.get('authorization') ?? '').replace(/^Bearer\s+/iu, '');
  const [left, right] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(supplied)),
    crypto.subtle.digest('SHA-256', encoder.encode(String(expected ?? ''))),
  ]);
  return bytesEqual(new Uint8Array(left), new Uint8Array(right));
}

async function listAll(bucket) {
  const objects = [];
  let cursor;
  do {
    const page = await bucket.list({ ...(cursor ? { cursor } : {}), limit: 1000 });
    objects.push(...page.objects);
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);
  return objects.sort((left, right) => left.key.localeCompare(right.key));
}

async function manifest(bucket) {
  const objects = await listAll(bucket);
  const entries = objects.map((object) => ({
    key: object.key,
    size: object.size,
    etag: object.etag,
  }));
  const hash = await crypto.subtle.digest('SHA-256', encoder.encode(JSON.stringify(entries)));
  return {
    count: entries.length,
    bytes: entries.reduce((total, entry) => total + Number(entry.size ?? 0), 0),
    hash: [...new Uint8Array(hash)].map((value) => value.toString(16).padStart(2, '0')).join(''),
  };
}

async function copyAll(source, destination) {
  const sourceObjects = await listAll(source);
  let metadataVerified = 0;
  for (const listed of sourceObjects) {
    const object = await source.get(listed.key);
    if (!object) throw new Error('SOURCE_OBJECT_DISAPPEARED');
    await destination.put(listed.key, object.body, {
      httpMetadata: object.httpMetadata,
      customMetadata: object.customMetadata,
    });
    const copied = await destination.head(listed.key);
    if (
      copied?.httpMetadata?.contentType !== object.httpMetadata?.contentType ||
      JSON.stringify(copied?.customMetadata ?? {}) !== JSON.stringify(object.customMetadata ?? {})
    ) {
      throw new Error('COPIED_OBJECT_METADATA_MISMATCH');
    }
    metadataVerified += 1;
  }
  return { copied: sourceObjects.length, metadataVerified };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method !== 'POST' || url.pathname !== '/copy') {
      return new Response('Not found', { status: 404 });
    }
    if (!(await authorized(request, env.COPY_TOKEN))) {
      return new Response('Forbidden', { status: 403 });
    }
    const baselineCopied = await copyAll(env.SOURCE_BRAND, env.BASELINE_BRAND);
    const workingCopied = await copyAll(env.BASELINE_BRAND, env.WORKING_BRAND);
    const [source, baseline, working] = await Promise.all([
      manifest(env.SOURCE_BRAND),
      manifest(env.BASELINE_BRAND),
      manifest(env.WORKING_BRAND),
    ]);
    const parity =
      source.count === baseline.count &&
      baseline.count === working.count &&
      source.bytes === baseline.bytes &&
      baseline.bytes === working.bytes &&
      source.hash === baseline.hash &&
      baseline.hash === working.hash;
    return Response.json({
      ok: parity,
      baselineCopied,
      workingCopied,
      source,
      baseline,
      working,
    });
  },
};
