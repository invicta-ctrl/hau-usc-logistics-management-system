# P10 Administration — Full Recovery

DATE: 2026-08-28
PROGRAM: PLAYGROUND-MASTER-2026-08-28
STATUS: PASS_LOCAL_REPAIR;LIVE_POST_DEPLOY_ACCEPTANCE_PENDING_P29_P30
ROUTE: SOLO

## Authority and boundary

P10 audited the seven Administration tabs independently against only the private-manifest-bound isolated Playground. No credential, provider identifier, bookmark value, or private row identifier was recorded. No account, staff, activity, reference, link, brand, system, business-data, R2, deployment, Production, main, Google, or Figma mutation occurred. Two staging-only System Owner convenience sessions were issued across the preserved harness attempt and the accepted before-repair audit.

## Accepted live before-repair evidence

The System Owner session projected `access.admin`, `reference.manage`, `brand.manage`, and `system.admin`; Administration navigation was visible. Live endpoints returned Accounts HTTP 200 with 25 rows, Staff HTTP 200 with one row, Link registry HTTP 200 with one row, Brand HTTP 200 with six published slots, and both health/readiness HTTP 200 with readiness true. An unauthenticated Accounts request returned HTTP 401 `SESSION_REQUIRED` without a record shape. No settled Administration request produced a console error.

Link registry rendered its real server row. Brand & media rendered six real publication slots with mutation disabled. System status rendered redacted readiness with mutation disabled. Reference administration truthfully exposed the unsupported-write contract gap with mutation disabled. These tabs did not depend on the FI10 Accounts/Staff load path.

Accounts, Staff directory, and Activity all displayed the terminal unavailable state. Activity did not call its endpoint because the failed shared FI10 load left no selectable staff member.

## Root cause and repair

The Worker correctly returns the access directory as `{ items, pagination: { page, pageSize, total, totalPages } }`. `FrontendBackend.adminAccountDirectory()` incorrectly required `page`, `pageSize`, and `total` at the top level, rejected the live response as `INCOMPLETE_RESPONSE`, and then `AdministrationRoute` used one `Promise.all` and one load state for both Accounts and Staff. The Accounts adapter mismatch therefore collapsed Staff and prevented Activity selection, violating the P10 independent-tab requirement.

The bounded repair:

- accepts either the established top-level pagination shape or the live Worker's nested `pagination` object;
- gives Accounts and Staff separate load states and independent abortable reads;
- preserves terminal denied/unavailable handling for each tab;
- restores Activity's path through the independently available Staff directory;
- leaves every mutation unsupported by this slice disabled and leaves server authorization authoritative.

Regression tests were added before the repair and failed on the nested live response and shared `Promise.all`; they pass after the repair. The P10 browser harness also now counts nested access-directory pagination correctly.

## Authorization and isolation

The canonical matrix explicitly proves that System Owner contains all four P10 administration capabilities and that DOL Staff and Requester contain none. Worker and service authorization remain independently enforced. The live unauthenticated denial is 401 with no record projection; authenticated underprivileged access is regression-gated as a safe denial before protected data is returned.

One unrelated Overview bootstrap request was aborted during immediate navigation into Administration. This was a navigation cancellation, not a settled Administration failure.

## Preserved diagnostic attempt

Attempt A is retained privately and is not accepted evidence. Its harness armed an Activity response wait before establishing whether an Activity trigger existed, so it stopped without writing a report. The accepted attempt audited each reachable tab without that invalid wait. Do not replay attempt A's synchronization form.

## Reset and live-state evidence

Read-only post-audit inspection remains schema 32 / migration 0032 with baseline v2, reset generation 4, zero foreign-key violations, and a reversible sealed clean bookmark. The two P10 sessions correctly moved the isolated Playground to five sessions and transient total five while working state remains `DIRTY` / active. P12 owns lifecycle cleanup and deterministic reset; the residue was not silently normalized.

## Verification

```text
Focused Vitest: PASS — 6 files, 57 tests
Full Vitest: PASS — 164 files, 1210 tests
Cloudflare build: PASS — 1679 modules
P10 capability matrix: PASS
P10 harness safety/baseline contract: PASS
Targeted ESLint: PASS
Prettier: PASS for changed formatted sources
git diff --check: PASS
Live D1 inspection: PASS — generation 4, sessions 5, transient total 5, FK violations 0
```

The repaired source is not yet deployed. Fresh-browser post-repair acceptance is intentionally deferred to the accepted P29 deployment and P30 end-to-end acceptance phases; the current live audit is before-repair evidence only.

## Next exact action

Begin P11 production-equivalent end-to-end workflows. Execute the exact request, inventory, lending, release, partial/duplicate, authorization, idempotency, ledger, audit, and reset-consequence matrix from the accepted specification against isolated Playground state only.
