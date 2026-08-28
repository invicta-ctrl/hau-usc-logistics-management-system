#!/usr/bin/env node
/**
 * RECOVERY-02 §9 regression proof.
 *
 * Builds the frontend in PRODUCTION mode and asserts that the local-only
 * Preview Index feature is genuinely ABSENT from the emitted bundle — not
 * merely unreachable at runtime.
 *
 * Two tiers, because the codebase has two different things and conflating them
 * would produce a check that either lies or can never pass:
 *
 *   TIER 1 — the Preview Index FEATURE. Its own modules: the index page, the
 *     launcher, the route registry, the surface preview, the preview personas
 *     and requester fixtures. App.tsx gates these behind a build-time constant
 *     so Rollup drops them. ENFORCED: any hit fails the build.
 *
 *   TIER 2 — per-route INSPECTION CHROME. `AuthenticatedShell`,
 *     `InternalLendingHub`, `InternalRequestHub`, `AdministrationRoute` and the
 *     shell drawers each carry their own `inspection` branch. Those are
 *     production components, so their strings ship. They are dead in
 *     Production because nothing passes `inspection`, but "dead" is a weaker
 *     claim than "absent" and this script does not pretend otherwise.
 *     REPORTED, not enforced — removing them is a cross-cutting refactor of
 *     five route components, tracked as a residual.
 *
 * Deliberately builds rather than inspecting a committed artifact: a committed
 * artifact can go stale, and a stale pass here is worse than no check at all.
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = path.resolve(fileURLToPath(new URL('..', import.meta.url)));

/** Distinctive to the Preview Index feature. A generic word here would produce
 *  a check that passes for the wrong reason. */
const TIER_1_MUST_BE_ABSENT = [
  'Preview Module Index',
  'data-preview-index-launcher',
  'data-preview-search',
  'Visual reference only',
  'Test Real Access',
  'preview.operator@local.invalid',
  'PREVIEW_PRESENTATION_ONLY',
  'PREVIEW-REQUEST-001',
  'Preview Requester',
  'LOCAL-4173',
];

/** Ships inside production route components. Counted, not enforced. */
const TIER_2_INSPECTION_CHROME = [
  'No backend authorization has been granted',
  'Back to Preview Index',
  'Local inspection fixture',
  'Preview folding chair',
  'SANITIZED-ACCOUNT-A',
];

function collectFiles(dir) {
  const out = [];
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...collectFiles(full));
    else out.push(full);
  }
  return out;
}

const outDir = mkdtempSync(path.join(tmpdir(), 'hau-prod-verify-'));
try {
  execFileSync(
    'npx',
    ['vite', 'build', '--mode', 'production', '--outDir', outDir, '--emptyOutDir', '--logLevel', 'error'],
    { cwd: repoRoot, stdio: 'inherit' },
  );

  const files = collectFiles(outDir);
  if (files.length === 0) throw new Error('Production build produced no files.');
  const corpus = files.map((file) => [path.relative(outDir, file), readFileSync(file, 'utf8')]);

  const leaked = [];
  for (const [name, text] of corpus) {
    for (const needle of TIER_1_MUST_BE_ABSENT) {
      if (text.includes(needle)) leaked.push(`${name} contains ${JSON.stringify(needle)}`);
    }
  }

  const residual = TIER_2_INSPECTION_CHROME.filter((needle) =>
    corpus.some(([, text]) => text.includes(needle)),
  );

  if (leaked.length > 0) {
    console.error('FAIL — Production bundle exposes the Preview Index feature:');
    for (const finding of leaked) console.error(`  - ${finding}`);
    console.error('\nThe Preview Index must not ship in Production-mode output (RECOVERY-02 §9).');
    process.exit(1);
  }

  const bytes = corpus.reduce((total, [, text]) => total + Buffer.byteLength(text), 0);
  console.log(
    `Preview Index absent from Production output: ${corpus.length} file(s), ${bytes} bytes, ` +
      `0 of ${TIER_1_MUST_BE_ABSENT.length} feature markers present.`,
  );
  console.log(
    `Residual (tier 2, tracked not enforced): ${residual.length} of ` +
      `${TIER_2_INSPECTION_CHROME.length} per-route inspection markers still ship inside ` +
      `production route components. Unreachable — nothing passes inspection in Production.`,
  );
} finally {
  rmSync(outDir, { recursive: true, force: true });
}
