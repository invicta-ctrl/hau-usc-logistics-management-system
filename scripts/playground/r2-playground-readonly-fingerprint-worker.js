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

async function fingerprint(bucket) {
  const objects = [];
  let cursor;
  do {
    const page = await bucket.list({ ...(cursor ? { cursor } : {}), limit: 1000 });
    objects.push(...page.objects);
    cursor = page.truncated ? page.cursor : undefined;
  } while (cursor);
  const entries = objects
    .sort((left, right) => left.key.localeCompare(right.key))
    .map((object) => ({ key: object.key, size: object.size, etag: object.etag }));
  const hash = await crypto.subtle.digest('SHA-256', encoder.encode(JSON.stringify(entries)));
  return {
    count: entries.length,
    bytes: entries.reduce((total, entry) => total + Number(entry.size ?? 0), 0),
    hash: [...new Uint8Array(hash)].map((value) => value.toString(16).padStart(2, '0')).join(''),
  };
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (
      request.method !== 'GET' ||
      url.pathname !== '/fingerprint' ||
      env.READ_ONLY_LABEL !== 'ISOLATED_PLAYGROUND_R2_READ_ONLY'
    ) {
      return new Response('Not found', { status: 404 });
    }
    if (!(await authorized(request, env.READ_TOKEN))) return new Response('Forbidden', { status: 403 });
    const [baselineBrand, workingBrand, baselineEvidence, workingEvidence] = await Promise.all([
      fingerprint(env.BASELINE_BRAND),
      fingerprint(env.WORKING_BRAND),
      fingerprint(env.BASELINE_EVIDENCE),
      fingerprint(env.WORKING_EVIDENCE),
    ]);
    return Response.json({
      status: 'PASS',
      baselineBrand,
      workingBrand,
      baselineEvidence,
      workingEvidence,
      playgroundMutation: 'NONE',
      productionMutation: 'NONE',
    });
  },
};
