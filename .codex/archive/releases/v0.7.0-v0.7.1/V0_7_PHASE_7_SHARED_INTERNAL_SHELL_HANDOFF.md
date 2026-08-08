# v0.7.0 Phase 7 Shared Internal Shell Handoff

Status: **ACCEPTED ON STAGING — PRODUCTION NO-GO**

## Accepted result

- One authenticated internal application serves `/app/admin`, `/app/director`,
  `/app/food`, `/app/inventory`, and `/app/materials` with direct-route recovery.
- The shared context bar provides URL-backed workspace switching, governed
  operational scope, breadcrumb, attention, truthful staging/release identity,
  and an account menu without changing the authenticated actor.
- Administrator workspace switching preserves the Administrator session and
  server capability projection. Non-Administrator direct routes remain
  fail-closed to the server-assigned workspace.
- All five destinations retain their real workflows, responsive navigation,
  governed USC/DOL R2 media, accessible controls, and secondary-only role
  accents. Public/request-only surfaces remain outside the internal shell.
- REST production copy no longer presents preview, no-write, synthetic-data,
  or role-preview claims.

## Priority account acceptance

- The ten approved department Access IDs are `ACTIVE`, onboarding-complete,
  mapped to the correct governed department, and resolve the `REQUESTER` role.
- Fresh staging login verification passed 10 / 10.
- The Administrator Accounts tab shows each exact Access ID, department,
  `ACTIVE` status, and password-reset control.
- The plaintext credential handoff remains only at the owner-restricted,
  outside-Git path `D:\Documents\Logistics Website Access codes.txt`; this
  repository contains no password.
- A live race that could drop a search entered while the initial account
  directory was loading was reproduced, regression-covered, and repaired.

## Repository evidence

- Shared-shell implementation commit:
  `6b2c5c43941b14496e65de4c82d0c1671ba7f398`.
- Account-search repair commit:
  `e7922148fb3d2d9d0bd9d96179aaa20272e4ce4d`.
- Staging account-menu test alignment commit:
  `6c1906ad299edfb878de7f86615287370eca90a8`.
- `npm run check`: PASS — 60 Vitest files / 409 tests plus governance, lint,
  deterministic builds, Apps Script parity, standalone verification, Worker
  types, and Cloudflare dry run.
- `npm run test:e2e`: PASS — 99 passed / 237 intentional skips / zero failed.
- Focused Administrator control-desk test: 1 / 1 PASS.
- Complete logical diff inspection and `git diff --check`: PASS.

## Staging evidence

- Worker: `hau-usc-logistics-staging`.
- Accepted product/test candidate:
  `6c1906ad299edfb878de7f86615287370eca90a8`.
- Worker version: `94ef26a7-cbe3-4000-b40d-30711d67428c`.
- Cache-busted health/readiness: `STAGING`, release `0.7.0`, D1 connected,
  schema 18, migration `0018_authenticated_request_center.sql`, ready.
- Governed background/logo slots: 1 / 1 deployed scenario PASS.
- Authentication, all five workspace switching, all ten Account rows/reset
  controls, reversible Access Management lifecycle, public-shell isolation:
  1 / 1 deployed scenario PASS.
- Fresh department authentication and identity reconciliation: 10 / 10 PASS.
- A private pre-activation staging export is retained outside Git at
  `D:\Documents\Codex\private-config\hau-usc-logistics-v0.6-phase3-20260722\staging-pre-phase7-account-activation-20260726.sql`,
  SHA-256 `ddbdd9aefdde2b6013dcd8baf1702346bda89e68af180fbd19892e7e33011cb8`.

## Remote and safety evidence

- PR #9 at `6c1906ad299edfb878de7f86615287370eca90a8`: open draft,
  mergeable, exact head, 6 / 6 checks passed.
- Branch and upstream were equal before this durable checkpoint.
- No migration was required. Schema remains 18.
- No production Worker upload, production D1/R2 write, merge, tag, release, or
  production smoke occurred.

## Next accepted slice

Phase 8 — complete System Owner global access, governed workspace switching,
and operational scope without weakening server authorization or creating an
impersonation path.
