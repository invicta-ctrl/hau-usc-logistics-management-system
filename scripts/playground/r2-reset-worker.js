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

async function listAll(bucket, accept = () => true) {
  const objects = [];
  let cursor;
  do {
    const page = await bucket.list({
      ...(cursor ? { cursor } : {}),
      limit: 1000,
      include: ['customMetadata'],
    });
    objects.push(...page.objects.filter((object) => accept(object)));
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);
  return objects.sort((left, right) => left.key.localeCompare(right.key));
}

async function manifest(bucket, accept) {
  const entries = (await listAll(bucket, accept)).map(({ key, size, etag }) => ({ key, size, etag }));
  const [hash, keyHash] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(JSON.stringify(entries))),
    crypto.subtle.digest('SHA-256', encoder.encode(JSON.stringify(entries.map(({ key }) => key)))),
  ]);
  return {
    count: entries.length,
    bytes: entries.reduce((total, entry) => total + Number(entry.size ?? 0), 0),
    hash: [...new Uint8Array(hash)].map((value) => value.toString(16).padStart(2, '0')).join(''),
    keyHash: [...new Uint8Array(keyHash)].map((value) => value.toString(16).padStart(2, '0')).join(''),
  };
}

async function resetBucket(
  baseline,
  working,
  { acceptBaseline = () => true, governedWorking = () => true } = {},
) {
  const [baselineObjects, allWorkingObjects] = await Promise.all([
    listAll(baseline, acceptBaseline),
    listAll(working),
  ]);
  const baselineByKey = new Map(baselineObjects.map((object) => [object.key, object]));
  const workingObjects = allWorkingObjects.filter(
    (object) => baselineByKey.has(object.key) || governedWorking(object),
  );
  const workingByKey = new Map(workingObjects.map((object) => [object.key, object]));
  const preservedUnclassified = allWorkingObjects.length - workingObjects.length;
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
  return { deleted, restored, preservedUnclassified };
}

function governedBrandObject(object) {
  const metadata = object?.customMetadata ?? {};
  return (
    ['PUBLIC_BRAND', 'PLAYGROUND_DEMO'].includes(String(metadata.classification ?? '')) ||
    (typeof metadata.slot === 'string' && typeof metadata.versionId === 'string')
  );
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
    const redactedEvidence = (object) => object.key.startsWith('playground-redacted/');
    const before = {
      brand: await manifest(env.WORKING_BRAND),
      evidence: await manifest(env.WORKING_EVIDENCE, redactedEvidence),
    };
    const [brand, evidence] = await Promise.all([
      resetBucket(env.BASELINE_BRAND, env.WORKING_BRAND, {
        governedWorking: governedBrandObject,
      }),
      resetBucket(env.BASELINE_EVIDENCE, env.WORKING_EVIDENCE, {
        acceptBaseline: redactedEvidence,
        governedWorking: redactedEvidence,
      }),
    ]);
    const baselineBrandKeys = new Set((await listAll(env.BASELINE_BRAND)).map((object) => object.key));
    const governedWorkingBrand = (object) => baselineBrandKeys.has(object.key) || governedBrandObject(object);
    const [baselineBrand, workingBrand, baselineEvidence, workingEvidence] = await Promise.all([
      manifest(env.BASELINE_BRAND),
      manifest(env.WORKING_BRAND, governedWorkingBrand),
      manifest(env.BASELINE_EVIDENCE, redactedEvidence),
      manifest(env.WORKING_EVIDENCE, redactedEvidence),
    ]);
    const ok =
      baselineBrand.count === workingBrand.count &&
      baselineBrand.bytes === workingBrand.bytes &&
      baselineBrand.hash === workingBrand.hash &&
      baselineEvidence.count === workingEvidence.count &&
      baselineEvidence.bytes === workingEvidence.bytes &&
      baselineEvidence.hash === workingEvidence.hash;
    return Response.json({
      ok,
      before,
      baseline: { brand: baselineBrand, evidence: baselineEvidence },
      working: { brand: workingBrand, evidence: workingEvidence },
      changes: { brand, evidence },
      preservedUnclassified: {
        brand: brand.preservedUnclassified,
        evidence: evidence.preservedUnclassified,
      },
    });
  },
};
