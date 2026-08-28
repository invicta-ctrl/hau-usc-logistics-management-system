# P03 Blank-root / Deployment Audit

DATE: 2026-08-28
PROGRAM: PLAYGROUND-MASTER-2026-08-28
BRANCH: reconcile/playground-master
LIVE_TARGET: https://playground.hausc.org/
MODE: READ_ONLY_LIVE_DIAGNOSIS_PLUS_LOCAL_SOURCE_REPAIR

## Outcome

P03 diagnosed a source-level fail-closed visibility mechanism. The public application mounts synchronously and the current deployed candidate is healthy, but `.atrium__reveal` previously started at `opacity: 0` and depended on the `atrium-enter` CSS animation to restore visibility. A controlled animation-time-zero inspection reproduced the mounted application with its hero copy present in the DOM while the computed opacity was zero. If animation progress stalls or is suppressed unexpectedly, critical landing content can remain dark/blank even though routing, React bootstrap, APIs, and assets succeeded.

The local repair makes the base state visible and moves the hidden/transformed state into the animation's `from` keyframe. Normal motion remains intact; stalled or failed animation now fails open to usable content.

The persistent live blank/dark symptom was not reproducible during this audit. The current deployed candidate remains unchanged; the local repair has not been deployed.

## Live evidence

| Area                   | Result                                                                                                                                                                 |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DNS / route / Worker   | Fresh root navigation returned HTTP 200 and usable HTML at the canonical Playground origin.                                                                            |
| React bootstrap        | `#app` mounted with two children, visible application text, and the expected landing copy.                                                                             |
| Route / base path      | Path `/`, empty hash, and base `https://playground.hausc.org/` resolved correctly.                                                                                     |
| Required assets        | USC brand logo, public advertisements, version/readiness, and both hero media parts returned HTTP 200.                                                                 |
| JS / CSS               | The staging artifact is a single-file build with inline application JS/CSS; no missing hashed application chunk exists.                                                |
| MIME                   | Required first-party content returned usable MIME types. `favicon.ico` currently falls through to HTML; this is nonfatal residual cleanup.                             |
| CSP                    | Same-origin application and media policy permits required landing assets.                                                                                              |
| Cache                  | Root returned `public,max-age=0,must-revalidate`; fresh navigation and refresh loaded usable UI.                                                                       |
| Session bootstrap      | Public landing did not wait on a protected session before mounting.                                                                                                    |
| `/api/version`         | HTTP 200; STAGING; release `0.8.3-playground.1`; candidate `9d48eaa8afb81734db3855b1834607e410f717fd`; schema 32; migration `0032_staff_account_activity_history.sql`. |
| `/api/readiness`       | HTTP 200; connected and ready; D1, static assets, brand assets, evidence assets, and protected configuration reported ready.                                           |
| Console                | Fatal errors: 0 at 390 and 1440 CSS-pixel audits.                                                                                                                      |
| Network                | No fatal first-party failure. At 390, one duplicate logo request was canceled after another logo request succeeded; navigation remained usable.                        |
| Live artifact identity | Live HTML equals the previously deployed staging artifact except for Cloudflare's runtime analytics injection. No source/deployment mismatch was found.                |
| Binding isolation      | `ISOLATED_STAGING_WORKING_D1_R2`; staging D1/brand R2/evidence R2 bound; Production comparison available; Production crossover false.                                  |

## Responsive evidence

- 390 x 844: `C:/Users/adria/.codex/visualizations/2026/08/28/01a04711-6f62-75c0-bbfe-8c02630cfee1/playground-p03-root-390.png`
- 1440 x 900 outer metrics; 1425 x 900 CSS viewport after scrollbar: `C:/Users/adria/.codex/visualizations/2026/08/28/01a04711-6f62-75c0-bbfe-8c02630cfee1/playground-p03-root-1440.png`

Both captures had a mounted DOM and zero console errors. Browser device emulation was cleared after capture.

## Local repair and verification

- `src/frontend/styles/index.css`: reveal base state is visible; entrance animation owns its temporary hidden `from` state.
- `tests/unit/frontend-blank-root.test.js`: guards the synchronous public mount and fail-open CSS contract.
- `scripts/playground/audit-live-binding-isolation.mjs`: outputs only staging/Production isolation booleans and classifications; resource identifiers remain undisclosed.
- `tests/unit/playground-live-binding-isolation.test.js`: covers the binding-audit classification and crossover gate.
- `scripts/playground/playground-config.mjs` and its unit test: align the reconciliation branch with the accepted temporary branch policy discovered during P03 verification.

Focused verification passed 5 files / 16 tests. A post-repair staging build passed with index size `791687` bytes and SHA-256 `B4D9AC7725E7AF20D8E6CAAD777A4872397AED989A8E08B5166E11831FD5DB23`. Hero media reconstruction remained byte-identical: source size `36018711`, parts `20000000 + 16018711`, SHA-256 `657b38b82d452a234ab76c64a3c4312133279ec3d59b9923c84c5e24501e71d1`.

## P03 gate

```text
FRESH_GET_ROOT = PASS
HARD_REFRESH = PASS
REQUIRED_ASSETS = PASS
FATAL_CONSOLE_ERRORS = 0
STAGING_IDENTITY = PASS
PRODUCTION_CROSSOVER = 0
PERSISTENT_LIVE_BLANK_ROOT_REPRODUCED = NO
SOURCE_FAIL_CLOSED_VISIBILITY_MECHANISM = CONFIRMED_AND_REPAIRED_LOCALLY
DEPLOYMENT = NOT_PERFORMED
```

P03 is complete for diagnosis and local repair. Deployment verification remains a later exact-candidate responsibility after the accepted rollback and external-write gates.
