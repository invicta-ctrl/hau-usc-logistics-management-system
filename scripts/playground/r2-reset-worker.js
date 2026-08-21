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
  const entries = (await listAll(bucket)).map(({ key, size, etag }) => ({ key, size, etag }));
  const hash = await crypto.subtle.digest('SHA-256', encoder.encode(JSON.stringify(entries)));
  return {
    count: entries.length,
    bytes: entries.reduce((total, entry) => total + Number(entry.size ?? 0), 0),
    hash: [...new Uint8Array(hash)].map((value) => value.toString(16).padStart(2, '0')).join(''),
  };
}

async function resetBrand(baseline, working) {
  const [baselineObjects, workingObjects] = await Promise.all([listAll(baseline), listAll(working)]);
  const baselineByKey = new Map(baselineObjects.map((object) => [object.key, object]));
  const workingByKey = new Map(workingObjects.map((object) => [object.key, object]));
  let deleted = 0;
  let restored = 0;
  for (const object of workingObjects) {
    if (!baselineByKey.has(object.key)) {
      await working.delete(object.key);
      deleted += 1;
    }
  }
  for (const baselineObject of baselineObjects) {
    const current = workingByKey.get(baselineObject.key);
    if (
      current &&
      current.size === baselineObject.size &&
      String(current.etag) === String(baselineObject.etag)
    ) {
      continue;
    }
    const source = await baseline.get(baselineObject.key);
    if (!source) throw new Error('BASELINE_OBJECT_DISAPPEARED');
    await working.put(baselineObject.key, source.body, {
      httpMetadata: source.httpMetadata,
      customMetadata: source.customMetadata,
    });
    const copied = await working.head(baselineObject.key);
    if (
      copied?.httpMetadata?.contentType !== source.httpMetadata?.contentType ||
      JSON.stringify(copied?.customMetadata ?? {}) !== JSON.stringify(source.customMetadata ?? {})
    ) {
      throw new Error('RESET_OBJECT_METADATA_MISMATCH');
    }
    restored += 1;
  }
  return { deleted, restored };
}

async function clearWorkingEvidence(bucket) {
  const objects = await listAll(bucket);
  for (const object of objects) await bucket.delete(object.key);
  return objects.length;
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method !== 'POST' || url.pathname !== '/reset') {
      return new Response('Not found', { status: 404 });
    }
    if (!(await authorized(request, env.RESET_TOKEN))) {
      return new Response('Forbidden', { status: 403 });
    }
    const before = {
      brand: await manifest(env.WORKING_BRAND),
      evidence: await manifest(env.WORKING_EVIDENCE),
    };
    const [brand, evidenceDeleted] = await Promise.all([
      resetBrand(env.BASELINE_BRAND, env.WORKING_BRAND),
      clearWorkingEvidence(env.WORKING_EVIDENCE),
    ]);
    const [baseline, working, evidence] = await Promise.all([
      manifest(env.BASELINE_BRAND),
      manifest(env.WORKING_BRAND),
      manifest(env.WORKING_EVIDENCE),
    ]);
    const ok =
      baseline.count === working.count &&
      baseline.bytes === working.bytes &&
      baseline.hash === working.hash &&
      evidence.count === 0;
    return Response.json({ ok, before, baseline, working, evidence, brand, evidenceDeleted });
  },
};
