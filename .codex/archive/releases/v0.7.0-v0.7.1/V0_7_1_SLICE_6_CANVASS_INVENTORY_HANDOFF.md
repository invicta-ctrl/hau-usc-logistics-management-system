# v0.7.1 Slice 6 - Canvass and Inventory Handoff

Status: ACCEPTED

Base: `bd6a12c4f306581b88115dd95d1c63ea635332c5`

Initial reviewed candidate: `9c4fb1f43deb60d5de8c7665cb643575f9ed2b8b`

Accepted repair: `55930e5fec7b0f359a77df0a6f9a8e7cfae1b92c`

Production/external writes: none

## Accepted Canvass behavior

- Browser, REST, legacy-runtime, Apps Script, and D1 surfaces expose the
  governed create, edit, archive, and preferred-decision lifecycle without
  falling back to mock production behavior.
- Quote dates, quantity units, source URLs, evidence references, link scope,
  duplicates, optimistic revisions, and preferred-archive guards fail closed.
- Price corrections append price history. Preferred decisions require a
  rationale and retain selection and deselection history, audit context, and
  replacement provenance.
- Preferred selection uses one set-based active-group update, so overlapping
  decisions cannot leave multiple active preferred quotes. Group-decision
  provenance remains attached to history and audit records.
- Successful archive retries return the original result for the same actor and
  payload. Reusing the key with a changed payload returns an idempotency
  conflict.
- The real mobile workflow supports quote selection, rationale, price edit,
  replacement, and archive at the protected 390-pixel viewport.

## Accepted Inventory behavior

- Governed D1 catalog create, update, storage-context, archive, and restore
  mutations preserve aliases, quantity-unit rules, optimistic revisions,
  dependencies, history, audit, and fail-closed lending state.
- The Inventory bootstrap returns the complete active catalog needed by the
  existing client-side search, filter, sort, and paging workflow. The contract
  accepts the protected current 397-row catalog up to a bounded maximum of
  500, while other modules retain their 100-row bound.
- Classification history, append-only ledger projections, and reservations
  are newest-first and deterministically bounded to 500 so a growing ledger
  cannot break the Inventory module contract.
- Bulk classification uses one governed service call. Every selected item is
  validated before one D1 batch commits item updates, classification history,
  audit, idempotency, and revisions. A stale member writes nothing.
- The bulk path is limited to two through 50 physically reviewed items,
  generates its group identity on the server, cannot enable lending, cannot
  create assets, rejects duplicate items, and preserves each item's existing
  catalog and physical-asset context.
- Local preview applies the same atomic, non-lendable contract; Apps Script
  remains explicitly fail closed until its canonical atomic backend exists.

## Verification

- Full `npm run check` at the accepted tree passed governance, ESLint, 85
  Vitest files / 551 tests, deterministic preview and staging builds, Apps
  Script package parity, standalone artifact verification, Cloudflare types,
  and Wrangler dry-run.
- Focused post-review Vitest passed 5 files / 38 tests for D1 P1 invariants,
  bootstrap bounds, atomic bulk classification, Canvass service contracts, and
  Apps Script Canvass governance.
- Focused local Worker acceptance passed 5 / 5 Canvass and Inventory scenarios,
  including protected classification, stale-member zero-write atomicity,
  mobile bulk submission and refresh, authoritative Inventory projection,
  overlapping preferred selections with one final winner, archive replay, and
  changed-payload idempotency conflict.
- Final preview `dist/index.html`: 761,002 bytes; SHA-256
  `3f2aa96ab8615af44c93291d6b99d7fcbfd546ed21a34853b591b1b327a1ecdd`.
- `git diff --check` passed. The worktree retained only the user-owned,
  untracked `.codegraph/` directory.

## Independent review and orchestration

The original fresh Sol reviewer for exact candidate `9c4fb1f...` was
interrupted only after it returned no output, missed two direct status
checkpoints, and missed a final bounded two-minute window. One replacement
fresh Sol review was spawned for that recorded stall reason; no parallel
verdict or fast-review agent ran.

The replacement exact-head review confirmed two P1 findings and one P2: a
concurrent preferred-selection race, unbounded Inventory history projections
that could exceed the 500-row contract, and archive replay occurring after an
active-only record lookup. Complex P1 repairs were routed to Terra Max and the
localized P2 replay repair to Luna Max under sequential, non-overlapping D1
writer locks.

One additional fresh Sol re-review was required at
`55930e5fec7b0f359a77df0a6f9a8e7cfae1b92c` because confirmed P1 findings
caused code changes and materially changed the reviewed SHA. It passed with no
P0-P3 and confirmed all three findings closed. Sol was not used for routine
audits, implementation, copy review, test mapping, or artifact comparison.

## Boundaries and next slice

No migration, database write, provider mutation, staging upload, production
deployment, domain change, Google action, GitHub push, pull-request action, or
destructive operation occurred. Production remains on immutable v0.7.0. The
next bounded slice is wording, naming, and Hallmark-bounded polish.
