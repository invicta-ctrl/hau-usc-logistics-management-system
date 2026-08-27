# FI-00 through FI-12 Playground Migration Receipt

STATUS: COMPLETE
DATE: 2026-08-27
ENVIRONMENT: isolated Playground only
PUBLIC_URL: https://playground.hausc.org/
ACCEPTED_AUTHORITY: .codex/specs/accepted/2026-08-27-fi00-fi12-playground-migration.md plus .codex/specs/accepted/2026-08-27-fi00-fi12-playground-full-backend-population-amendment.md

## Deployed identity

- Source commit: `50c5cab77b7fe251cf1a11c284fe791e6c2af127`
- Source tree: `5a985e623e8a234bf1d4cfac52ab5afb86fd8257`
- Staging artifact SHA-256: `a9d2d162a3085cf0e60fdc809943c41f7ed23c59be5f53b1587be31fe3d64e54`
- Shareable artifact SHA-256: `34ce3d5f586defbe45faaae7803d12f2bb51a2ff7a1a4bc87d0ff11df6dd3bfc`
- Replacement Playground D1/R2 tuple: bound, live, and isolated; exact provider identifiers remain private.

## Population and reconciliation

The replacement D1 was populated from the governed privacy-filtered v4 baseline. A fresh remote export matched all 89 compared baseline tables with zero mismatches. Schema 32, migration `0032_staff_account_activity_history.sql`, integrity, foreign keys, and append-only-ledger inventory reconciliation passed.

Safe populated counts include 399 inventory items and aliases, 407 posted ledger rows, 63 accounts with 10 active staging-safe accounts across 7 roles, 6 requests, 8 request lines, 5 reservations, 4 lending tickets, 2 handoffs, 2 returns, 3 releases, 1 restock request, 2 receipts, 4 receiving records, 2 suppliers, 2 canvass references, 2 safe evidence metadata rows, and 8 events.

Credentials, sessions, reset/verification material, private evidence, private identity/contact tables, and Production-derived active credentialed accounts were excluded. The two required R2 evidence objects are redacted placeholders; the approved brand copy is one-way into Playground. No reverse synchronization exists.

## Live acceptance

A fresh browser context with no cookies and no supplied credentials:

1. opened the public Playground;
2. selected `Staff sign in`;
3. observed the Playground-only `Enter Playground` action;
4. obtained a temporary staging-only System Owner session;
5. loaded requests, lending, releases, inventory, restocking, procurement, receiving, reference, and administration modules;
6. passed responsive checks at 320, 390, 768, 1024, and 1440 pixels; and
7. completed test-session cleanup.

The action fails closed unless same-origin version metadata reports literal `playground: true`; Production retains its ordinary credential-based authentication.

## Safety and recovery

- Production Worker and complete D1/R2 binding tuple: unchanged.
- Production writes: zero.
- Production route crossover: absent.
- Playground email provider and scheduled triggers: absent.
- Immediately prior populated Playground candidate: retained.
- Original pre-replacement Worker and complete Playground tuple: retained.
- Rollback state: ready.
- Known Playground P0/P1/P2 blockers: zero.
- Private provider logs, manifests, exports, screenshots, and identifiers: retained outside Git.

## Verification

- `npm.cmd run check:release-candidate`: PASS.
- Governance, build, Apps Script source verification, deterministic artifacts, Cloudflare types/build, and Wrangler dry-run: PASS.
- Tests: 158 files / 1,173 tests passed.
- Lint: zero errors; two pre-existing warnings.
- Exact provider identity/bindings/rollback/schema/privacy checks: PASS.
- Fresh credential-free UI entry and authenticated module acceptance: PASS.

FI00_FI12_PLAYGROUND_DEPLOYED=TRUE
PLAYGROUND_AVAILABLE_FOR_TESTING=TRUE
PRODUCTION_UNTOUCHED=TRUE
MIGRATION_PERCENTAGE=100
MIGRATION_JOB_STATUS=COMPLETE
FINAL_ACCEPTANCE=PASS
