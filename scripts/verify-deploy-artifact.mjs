// Fail-closed deployment preflight.
//
// `wrangler` serves ./dist. `npm run build` produces a preview/mock artifact,
// and the local Worker acceptance harness rebuilds dist in staging mode, so the
// directory can legitimately hold either variant at any moment. Deploying the
// preview artifact would publish a mock-backend Main Hub against live D1.
//
// `src/app/config.js` derives the backend mode from `import.meta.env.MODE`,
// which Vite inlines as a string literal, so the built artifact states its own
// build mode. This asserts that literal before any upload.
//
// Usage: node scripts/verify-deploy-artifact.mjs [staging|production]

import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

const CLOUDFLARE_MODES = new Set(['staging', 'production']);
const target = String(process.argv[2] ?? '').trim().toLowerCase();
if (target && !CLOUDFLARE_MODES.has(target)) {
  throw new Error(`Unknown deploy target "${target}". Expected staging or production.`);
}

const artifactPath = resolve('dist/index.html');
let html;
try {
  html = await readFile(artifactPath, 'utf8');
} catch {
  throw new Error(
    'dist/index.html is missing. Run the Cloudflare build (npm run build:cloudflare) before deploying.',
  );
}

// Matches the compiled form of:
//   String(import.meta.env?.MODE ?? 'development').trim().toLowerCase()
const modeMatches = [...html.matchAll(/["']([a-z]+)["']\s*\)?\s*\.trim\(\)\s*\.toLowerCase\(\)/gu)].map(
  (match) => match[1],
);

if (!modeMatches.length) {
  throw new Error(
    'Could not determine the build mode of dist/index.html. Refusing to deploy an unverifiable artifact.',
  );
}

const cloudflareModes = modeMatches.filter((mode) => CLOUDFLARE_MODES.has(mode));
const previewModes = modeMatches.filter((mode) => ['preview', 'development', 'mock'].includes(mode));

if (previewModes.length) {
  throw new Error(
    `dist/index.html is a ${previewModes[0]} build. That artifact runs the mock backend and must never be ` +
      'deployed against live D1. Rebuild with npm run build:cloudflare and re-run this preflight.',
  );
}

if (!cloudflareModes.length) {
  throw new Error(
    `dist/index.html does not declare a Cloudflare build mode (found: ${[...new Set(modeMatches)].join(', ')}). ` +
      'Refusing to deploy.',
  );
}

if (target && !cloudflareModes.includes(target) && !cloudflareModes.includes('staging')) {
  throw new Error(
    `dist/index.html declares build mode "${cloudflareModes[0]}", which does not satisfy the ${target} deploy.`,
  );
}

const digest = createHash('sha256').update(html).digest('hex');
process.stdout.write(
  `Deploy artifact verified: build mode ${cloudflareModes[0]}, ${html.length} bytes, sha256 ${digest.slice(0, 16)}...\n` +
    `${target ? `Target: ${target}\n` : ''}`,
);
