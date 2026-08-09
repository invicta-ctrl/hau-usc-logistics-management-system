import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = dirname(fileURLToPath(import.meta.url));
const candidatePath = resolve(projectRoot, '../dist/index.html');
const outputPath = resolve(projectRoot, 'dist/server/index.js');
const candidate = await readFile(candidatePath, 'utf8');

const worker = `const CANDIDATE_HTML = ${JSON.stringify(candidate)};

const responseHeaders = Object.freeze({
  'Content-Type': 'text/html; charset=utf-8',
  'Cache-Control': 'public, max-age=300',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Content-Type-Options': 'nosniff',
});

export default {
  async fetch(request) {
    const url = new URL(request.url);
    if (url.pathname.startsWith('/api/')) {
      return Response.json(
        { ok: false, code: 'PUBLIC_PREVIEW_ONLY', message: 'This public site does not provide protected operations.' },
        { status: 404, headers: { 'Cache-Control': 'no-store' } },
      );
    }
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method not allowed', { status: 405, headers: { Allow: 'GET, HEAD' } });
    }
    return new Response(request.method === 'HEAD' ? null : CANDIDATE_HTML, {
      status: 200,
      headers: responseHeaders,
    });
  },
};
`;

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, worker, 'utf8');
console.log(JSON.stringify({ source: candidatePath, output: outputPath, candidateBytes: Buffer.byteLength(candidate) }));
