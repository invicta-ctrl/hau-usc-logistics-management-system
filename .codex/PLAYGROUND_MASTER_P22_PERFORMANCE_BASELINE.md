# P22 Checkpoint — Performance Baseline

DATE: 2026-08-29
STATUS: PASS_MEASURED_LOCAL_BASELINE
PROGRAM: PLAYGROUND-MASTER-2026-08-28
BRANCH: reconcile/playground-master
MEASURED_COMMIT: 8e9eda9372d5eb098a21004d5990d2cc5cab3f31
SCOPE: P22 only

## Measurement Contract

The reproducible harness is `scripts/measure-playground-performance.mjs`, exposed as `npm run performance:playground:baseline`. Raw evidence is stored at `.codex/evidence/P22_PLAYGROUND_PERFORMANCE_BASELINE.json`.

The harness separates three evidence classes:

1. the deployment-shaped staging build from `.wrangler/build/staging`;
2. the deterministic offline shareable from `dist/index.html` and `HAU-USC_Logistics-Frontend-Shareable.html`;
3. exact-4173 sanitized inspection transitions for protected workspaces.

Browser measurements used Chromium 149 with four profiles: 1440 desktop, 1440 constrained four-times-slower CPU laptop, 390 mid-range mobile, and 390 slower network. API responses were deterministic non-sensitive fixtures. No live operational records were read and no provider state was changed.

## Artifact Baseline

- Deployment HTML: 847,131 bytes raw; 251,867 bytes gzip.
- Deployment inline JavaScript: 683,234 bytes; inline CSS: 162,403 bytes.
- Deployment route chunks: 0 JavaScript/CSS chunks because dynamic imports are currently forced inline.
- Deferred hero media: 20,000,000 bytes and 16,018,711 bytes across two emitted parts.
- Complete deployment directory: 36,866,413 bytes raw; 36,239,412 bytes gzip.
- Offline shareable: 48,871,892 bytes raw; 36,386,514 bytes gzip. This is an offline artifact and is not classified as the live initial HTML response.

## Built Index Baseline

| Profile | Index ready | LCP | CLS | Index search | Longest event | TTFB |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Desktop 1440 | 279 ms | 276 ms | 0.22 | 16.6 ms | 24 ms | 17.1 ms |
| Older laptop 1440 | 983 ms | 708 ms | 0.24 | 68.8 ms | 72 ms | 9.2 ms |
| Mid-range mobile 390 | 1,639 ms | 1,208 ms | 0.04 | 62.9 ms | 48 ms | 76.1 ms |
| Slower network 390 | 1,475 ms | 1,152 ms | 0.04 | 65.4 ms | 120 ms | 8.9 ms |

These are one-run local lab values. They are directional baseline evidence only; P23 must use the same harness for any before/after claim. TTFB is local-lab evidence, not a production edge latency claim.

Every built profile issued ten initial requests. Despite rendering the Playground Index rather than Landing, the runtime fetched both hero media parts. Total initial encoded transfer was approximately 37.1 MB in the complete desktop/laptop/mobile runs; the slower profile still transferred both complete hero parts while its invalid local brand-image fallback was cancelled early. The request set also includes two `/api/version` reads, the bounded health/readiness/status reads, the public advertisement read, and the brand-logo path.

## Warm Workspace Baseline

| Profile | Inventory | Request queue | Lending | Events | Administration | Inventory search |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Desktop 1440 | 71.0 ms | 78.3 ms | 79.3 ms | 100.0 ms | 64.7 ms | 18.6 ms |
| Older laptop 1440 | 346.3 ms | 323.0 ms | 311.6 ms | 289.7 ms | 186.5 ms | 69.0 ms |
| Mid-range mobile 390 | 306.5 ms | 279.7 ms | 264.3 ms | 318.5 ms | 196.1 ms | 77.7 ms |
| Slower-network profile 390 | 381.2 ms | 305.9 ms | 319.6 ms | 333.3 ms | 190.7 ms | 75.9 ms |

Warm protected-route measurements use the exact-4173 sanitized inspection harness after its development modules settle. They are CPU/render measurements; the slower network is exercised by the deployment-shaped built profile, not by these warm transitions. No operational endpoint was called during a transition. Each shell remount requested only `/brand/usc-logo` in the local preview environment.

## Measured P23 Targets

1. Stop invisible Landing hero media from fetching while the Index or another route is active.
2. Permit deployment route splitting and lazy route loading while preserving the explicitly separate offline single-file shareable.
3. Remove the duplicate initial `/api/version` request if the trusted gate result can be reused without weakening fail-closed behavior.
4. Avoid repeated shell logo fetches or make the logo source cacheable and valid in the local harness.
5. Investigate the 0.22–0.24 desktop CLS without changing semantic content or accessibility.
6. Re-run this exact harness after P23 and report deltas without treating local lab TTFB as production evidence.

## Verification

- `npm run build:cloudflare`: passed; 1681 modules transformed; deployment-shaped artifacts produced.
- `node --check scripts/measure-playground-performance.mjs`: passed before measurement.
- Final performance harness: completed across all four built profiles and all four warm inspection profiles with zero browser console errors.
- Raw report contains artifact identities, request paths/types/bytes, web-vital lab metrics, route timings, and search timings.

## External State

No deployment, D1, R2, Production, main, Google, or Figma mutation occurred. Temporary local preview infrastructure was stopped after measurement. The existing exact-4173 project preview remained unchanged.

## Next

P23: implement only improvements supported by this baseline, preserve the offline shareable as a separate artifact class, and rerun the same measurement contract for before/after evidence.
