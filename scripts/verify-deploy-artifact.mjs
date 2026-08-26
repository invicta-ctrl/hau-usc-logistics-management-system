// Fail-closed deployment preflight.
//
// `wrangler` serves ./dist. `npm run build` produces a preview/mock artifact,
// and the local Worker acceptance harness rebuilds dist in staging mode, so the
// directory can legitimately hold either variant at any moment. Deploying the
// preview artifact would publish a mock-backend Main Hub against live D1.
//
// `vite.config.js` adds one canonical HTML marker only to staging and production
// builds. Assert that marker before any upload; Vite/minifier JavaScript shapes
// are not a deployment-identity contract.
//
// Usage: node scripts/verify-deploy-artifact.mjs [staging|production] [artifact-directory]

import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { resolve } from 'node:path';

const CLOUDFLARE_MODES = new Set(['staging', 'production']);
const DEPLOY_ARTIFACT_MARKER_NAME = 'hau-deploy-target';
const canonicalMarkerPattern = new RegExp(
  `<meta name="${DEPLOY_ARTIFACT_MARKER_NAME}" content="([^"]*)"\\s*/?>`,
  'gu',
);
const target = String(process.argv[2] ?? '')
  .trim()
  .toLowerCase();
if (target && !CLOUDFLARE_MODES.has(target)) {
  throw new Error(`Unknown deploy target "${target}". Expected staging or production.`);
}

const artifactDirectory = resolve(process.argv[3] ?? (target ? `.wrangler/build/${target}` : 'dist'));
const artifactPath = resolve(artifactDirectory, 'index.html');
let html;
try {
  html = await readFile(artifactPath, 'utf8');
} catch {
  throw new Error(`${artifactPath} is missing. Run the target-specific Cloudflare build before deploying.`);
}

const markers = [...html.matchAll(canonicalMarkerPattern)].map((match) => match[1]);
if (markers.length !== 1) {
  throw new Error(
    'The isolated artifact must contain exactly one canonical deploy target marker. Refusing to deploy.',
  );
}

const buildMode = markers[0];
if (!CLOUDFLARE_MODES.has(buildMode)) {
  throw new Error('The isolated artifact declares an invalid deploy target marker. Refusing to deploy.');
}

// The declared build mode must equal the deploy target. Accepting a staging
// artifact for a production deploy would ship a bundle whose baked-in
// appEnvironment says "staging", defeating the RV-01.8 identity proof.
if (target && buildMode !== target) {
  throw new Error(
    `The isolated artifact deploy target marker does not satisfy the ${target} deploy. ` +
      `Rebuild with the ${target} Cloudflare build path.`,
  );
}

const digest = createHash('sha256').update(html).digest('hex');
process.stdout.write(
  `Deploy artifact verified: build mode ${buildMode}, ${html.length} bytes, sha256 ${digest.slice(0, 16)}...\n` +
    `${target ? `Target: ${target}\n` : ''}`,
);
