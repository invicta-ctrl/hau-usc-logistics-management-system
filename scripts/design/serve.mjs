#!/usr/bin/env node
// Static file server for the design prototypes.
//
// The prototypes use ES modules, so `file://` refuses to load them — every
// audit script in this directory assumes an origin. This is that origin.
// It exists so the audits are reproducible without a global install.
//
// Usage: node scripts/design/serve.mjs [root] [port]
//   default root  prototypes  (both prototypes plus the shared theme)
//   default port  8805

import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(HERE, '../..');
const ROOT = path.resolve(REPO, process.argv[2] || 'prototypes');
const PORT = Number(process.argv[3] || 8805);

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
};

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1');
  let rel = decodeURIComponent(url.pathname);
  if (rel.endsWith('/')) rel += 'index.html';
  // Containment: a resolved path must stay inside ROOT.
  const file = path.resolve(ROOT, '.' + rel);
  if (!file.startsWith(ROOT)) {
    res.writeHead(403).end('forbidden');
    return;
  }
  try {
    const info = await stat(file);
    if (!info.isFile()) throw new Error('not a file');
    res.writeHead(200, {
      'content-type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream',
      'cache-control': 'no-store',
      /* Read-only, loopback-bound, GET only. This exists so a provider editor
         open in the browser can pull a generated file straight from disk instead
         of the file being carried through an agent's context — which is both
         lossy and the wrong shape for moving 45KB of someone's source. */
      'access-control-allow-origin': '*',
    });
    createReadStream(file).pipe(res);
  } catch {
    res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' }).end('not found');
  }
}).listen(PORT, '127.0.0.1', () => {
  process.stdout.write(`design server · ${ROOT} · http://127.0.0.1:${PORT}/index.html\n`);
});
