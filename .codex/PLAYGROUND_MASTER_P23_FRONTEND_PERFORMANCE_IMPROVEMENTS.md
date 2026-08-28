# P23 — Frontend Performance Improvements

STATUS: PASS_MEASURED_LOCAL_IMPLEMENTATION; LIVE_PLAYGROUND_DEPLOYMENT_PENDING_P29

## Scope and evidence

- Before evidence: `.codex/evidence/P22_PLAYGROUND_PERFORMANCE_BASELINE.json`
- After evidence: `.codex/evidence/P23_PLAYGROUND_PERFORMANCE_AFTER.json`
- Measurement class: local deployment-shaped Chromium lab plus the exact-4173 sanitized inspection harness
- Production, Playground deployment, D1, R2, Google, Figma, and `main` mutations: none
- Deployed Playground source remains `ca28bde`; Playground remains generation 6 CLEAN with no active or transient sessions.

## Implementation

1. Split deployment and offline packaging policy. Staging/Production now emit external CSS and lazy JavaScript chunks; the deterministic offline shareable remains one self-contained HTML artifact.
2. Lazy-load the main application route renderer and protected inspection route behind stable `Suspense` shells.
3. Preflight exact Playground Index/inspection hashes before the first React mount, so the invisible Landing route cannot start hero, logo, or advertisement traffic while the fail-closed Playground version gate is pending.
4. Share one page-load version request across bootstrap, controller, and Preview Index consumers.
5. Place deployment CSS before the module entry script to stabilize first paint.
6. Extend the Cloudflare hero verifier across emitted JavaScript chunks while retaining exact 36,018,711-byte reconstruction and SHA-256 proof.
7. Correct the performance harness to capture navigation timing and CLS before its synthetic search interaction, record CLS sources, and label phase/measurement class.

No speculative route prefetch was introduced. The first protected workspace navigation intentionally pays for its lazy route chunk; subsequent routes reuse the loaded graph. Exact-4173 inspection measurements use Vite's development module graph, so they are diagnostic and are not represented as deployment chunk timings.

## Before/after result

| Measure | P22 before | P23 after | Result |
| --- | ---: | ---: | --- |
| Deployment initial HTML | 847,131 B | 1,558 B | 99.8% smaller |
| Deployment initial HTML gzip | 251,867 B | 874 B | 99.7% smaller |
| Deployment route chunks | 0 | 5 | progressive loading enabled |
| Initial Index requests | 10 | 7 | hero, logo, advertisement, and duplicate version traffic removed |
| Desktop initial transfer | 37,110,294 B | 96,174 B | 99.7% smaller |
| Slower-network initial transfer | 36,376,668 B | 96,174 B | 99.7% smaller |
| Offline shareable HTML | 48,871,892 B | 48,875,158 B | self-contained artifact preserved; +3,266 B |

| Profile | Index ready P22 -> P23 | Index search P22 -> P23 | LCP P22 -> P23 |
| --- | ---: | ---: | ---: |
| Desktop 1440 | 279 -> 128 ms | 16.6 -> 17.7 ms | 276 -> 132 ms |
| Older laptop 1440 | 983 -> 805 ms | 68.8 -> 56.9 ms | 708 -> 800 ms |
| Midrange mobile 390 | 1,639 -> 792 ms | 62.9 -> 55.5 ms | 1,208 -> 748 ms |
| Slower network 390 | 1,475 -> 1,032 ms | 65.4 -> 56.9 ms | 1,152 -> 1,016 ms |

The older-laptop LCP sample regressed by 92 ms even though Index readiness and search improved; it remains an observed local-lab tradeoff, not hidden as a win. P23 navigation CLS is 0 with no recorded sources across all four profiles. P22's prior CLS values included the harness-triggered search/filter layout change, so those old values are interaction-contaminated and are not used as a direct navigation-CLS comparison.

## Verification

- `npm.cmd run build`: PASS; deterministic offline single-file artifact retained.
- `npm.cmd run build:cloudflare`: PASS; 1,683 modules transformed; four JavaScript files, one CSS file, and five deployment route chunks emitted.
- `npm.cmd run verify:cloudflare:hero`: PASS; exact 36,018,711-byte hero reconstructed with SHA-256 `657b38b82d452a234ab76c64a3c4312133279ec3d59b9923c84c5e24501e71d1`; all emitted JavaScript files remain below 25 MB; no `data:video/` payload.
- `npm.cmd test`: PASS; 169 files and 1,243 tests.
- `HAU_FRONTEND_E2E_PORT=4173 npm.cmd run test:e2e:frontend -- tests/e2e/preview-index.spec.js`: PASS; 95 passed and five exact-origin cases intentionally skipped (100 total).
- Focused blank-root and version-loader unit regression: PASS; 15/15.
- P23 JavaScript/MJS ESLint targets: zero errors. TypeScript/JSX frontend files remain outside the repository's current ESLint match configuration. Repository-wide `npm.cmd run lint` still reports 26 pre-existing browser-global errors in unchanged `prototypes/public-portals-r3/app.js` plus two unrelated warnings; P23 did not normalize that out-of-scope baseline.
- Final local measurement server on 4184: stopped and confirmed closed.

## Decision

P23 is complete at its local measured gate. The deployment candidate no longer downloads invisible hero media, no longer performs duplicate version bootstrap work, and no longer ships the whole application in initial deployment HTML. The offline shareable contract remains intact. Live Playground acceptance remains assigned to P29-P31.

NEXT_EXACT_ACTION: Begin P24 as a read-first D1 query/index audit. Measure the named high-traffic query paths and add no index unless query-plan and row-read evidence proves a smallest additive Playground-only migration is valuable.
