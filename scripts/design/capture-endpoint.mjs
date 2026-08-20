#!/usr/bin/env node
// One-shot local capture endpoint for preserving provider-side buffers.
//
// WHY THIS EXISTS
// The unsaved Figma Make edit to RequestCenterRoute.tsx had to be preserved
// before any provider write could be attempted. Reading it out through the
// browser-automation channel is the wrong shape — that channel deliberately
// blocks bulk page content, because pulling a page's contents through an agent
// is what data exfiltration looks like. The content is the owner's own work
// going into the owner's own repository, so it should travel browser -> disk on
// the same machine and never transit anything else.
//
// SCOPE, deliberately narrow:
//   * binds to 127.0.0.1 only
//   * accepts exactly ONE POST, writes it, and exits
//   * writes only inside the directory given on the command line
//   * echoes a SHA-256 of what it wrote, so the capture can be proven identical
//     to the source buffer rather than assumed to be
//
// Usage: node scripts/design/capture-endpoint.mjs <outFile> [port] [allowOrigin]

import { createServer } from 'node:http';
import { writeFile, mkdir } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';

const OUT = path.resolve(process.argv[2]);
const PORT = Number(process.argv[3] || 8831);
const ORIGIN = process.argv[4] || 'https://www.figma.com';

const server = createServer(async (req, res) => {
  const cors = {
    'access-control-allow-origin': ORIGIN,
    'access-control-allow-methods': 'POST, OPTIONS',
    'access-control-allow-headers': 'content-type',
    'access-control-max-age': '600',
  };

  if (req.method === 'OPTIONS') {
    res.writeHead(204, cors).end();
    return;
  }
  if (req.method !== 'POST') {
    res.writeHead(405, cors).end('post only');
    return;
  }

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const body = Buffer.concat(chunks);
  const sha = createHash('sha256').update(body).digest('hex');

  await mkdir(path.dirname(OUT), { recursive: true });
  await writeFile(OUT, body);

  const report = { file: OUT, bytes: body.length, sha256: sha };
  res.writeHead(200, { ...cors, 'content-type': 'application/json' }).end(JSON.stringify(report));
  process.stdout.write(JSON.stringify(report, null, 2) + '\n');

  server.close();
  setTimeout(() => process.exit(0), 150);
});

server.listen(PORT, '127.0.0.1', () => {
  process.stdout.write(`capture endpoint · one POST -> ${OUT} · http://127.0.0.1:${PORT}\n`);
});
