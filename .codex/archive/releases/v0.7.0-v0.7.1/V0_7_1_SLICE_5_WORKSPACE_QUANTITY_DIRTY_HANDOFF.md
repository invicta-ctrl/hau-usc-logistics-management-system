# v0.7.1 Slice 5 - Workspace, Quantity, Borrower, and Dirty-State Handoff

Status: ACCEPTED

Base: `8e6b0aacbb9eb07567680f01987e5a3d8c018627`

Initial implementation: `a0e403674f710653e85fce8555995f74a8f16cb8`

First P1 repair: `db365c6da798915f673dfc457c69214b7e452279`

Accepted repair: `4e40e79ad4ad626cba262e66187e1c4ba2220964`

Production/external writes: none

## Accepted behavior

- Internal workspaces use canonical root-level routes. Indexed history entries
  restore the exact accepted URL and active module when dirty navigation is
  cancelled, without duplicating or rewriting history.
- Direct loads, reloads, accepted history navigation, and workspace changes
  synchronize the active view, primary and mobile navigation, page title,
  shell breadcrumb, and document title for both legacy and essential-bootstrap
  runtime contracts.
- Countable units, including `can`, `pair`, `pallet`, and `tray`, require whole
  numbers. Explicit measured units retain decimal support. Unknown units fail
  closed across client, domain, mock, public, and D1 paths.
- Catalog-backed requests resolve the authoritative inventory unit. Missing
  items and caller-unit mismatches fail before persistence in D1, MockService,
  and the inline preview service.
- The borrower selector preserves the accepted USC Officer/Staff and
  Angelite/Student semantics and does not expose public tracking.
- Ordinary forms and modal forms protect unsaved work. Escape in the discard
  alert cannot propagate to and close the underlying modal, while successful
  modal saves clear dirty state centrally.
- `legacy/HAU-USC_Logistics-Prototype.original.html` is byte-identical to the
  Slice 5 base and is protected by SHA-256 sentinel
  `06dc6c4e62ac6db1e873f5f18dd6531dd6a9f91e3a1b1d27e89582eac3f04a84`.

## Verification

- Focused Vitest after the final correction: 3 files / 19 tests passed.
- Focused Administrator route, history-cancel, workspace-cancel, borrower, and
  modal-Escape browser proof: 2 responsive projects passed; 4 intentionally
  skipped.
- Focused System Owner canonical direct-load/reload and Release Desk proof:
  1 responsive project passed; 5 intentionally skipped.
- Focused local Worker proofs passed for server-validated operational catalog
  units and both public Lending borrower types, including fractional countable
  rejection. These D1/public paths were unchanged by the final UI/mock repair.
- Full `npm run check` at the accepted tree passed governance, ESLint, 80
  Vitest files / 527 tests, preview and staging builds, deterministic
  shareables and Apps Script bundle, standalone verification, Cloudflare
  types, and Wrangler dry-run.
- Final preview `dist/index.html`: 735,570 bytes; SHA-256
  `5f370aa6001b61555be9f02c8eaeef63fe7f36f3b34bdaadeb14be7d41c023f7`.
- `git diff --check` passed. The worktree retained only the user-owned,
  untracked `.codegraph/` directory after each commit.

## Independent review and orchestration

The initial fresh Sol review of `a0e40367...` found confirmed P1 defects in
Escape propagation, accepted-route state, countable-unit coverage, and the
protected legacy baseline, plus a material P2 successful-save dirty-state gap.
Routine repairs were routed to Luna Max and complex route/unit repairs to Terra
Max. Both were read-only; the parent remained the only repository writer.

One additional fresh Sol review was required at `db365c6d...` because the
confirmed P1 findings caused code changes and materially changed the reviewed
SHA. It found a further P1 stale route-chrome defect and a P2 mock
authoritative-unit gap.

A second additional fresh Sol review was required at
`4e40e79ad4ad626cba262e66187e1c4ba2220964` because that immediately prior P1
caused code changes and materially changed the reviewed SHA. It passed with no
P0-P3 findings and confirmed every earlier finding closed. No parallel Sol
verdict, fast-review, routine-audit, copy-review, or artifact-comparison agent
was spawned while either reviewer was active.

## Boundaries and next slice

No migration, database write, provider mutation, staging upload, production
deployment, domain change, Google action, GitHub push, pull-request action, or
destructive operation occurred. Production remains on immutable v0.7.0. The
next bounded slice is Canvass and Inventory readiness.
