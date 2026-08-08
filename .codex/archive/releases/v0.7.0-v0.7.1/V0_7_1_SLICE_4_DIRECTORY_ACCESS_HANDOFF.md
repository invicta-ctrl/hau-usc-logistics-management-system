# v0.7.1 Slice 4 — Staff Directory and Access Management Handoff

Status: ACCEPTED

Base: `4350d88b9db338ccce0f3cd8efe3a877f5d7650f`

Initial implementation: `045aece8d69308444b9e687760db16de671e30b0`

Accepted P1 repair: `6bec7d9be355b556fe0d93143a85127a99dd9740`

Production/external writes: none

## Accepted behavior

- The owner-only USC Officer and Staff Directory now reports the latest applied
  sync independently from a newer preview, supports search plus activity and
  verification filters, clamps integer pagination, and provides polite loading,
  safe correlated failure, and retry states.
- Directory preview remains read-only. Apply, quarantine, history, encrypted D1
  projection, owner authorization, exact-fingerprint confirmation, and
  reconciliation boundaries remain intact.
- Latest-sync rollback consumes a stable client request ID and writes its D1
  mutation, audit record, and replay result atomically. Exact retries return the
  original audit correlation; conflicting key reuse fails closed.
- Access policy, Access ID, temporary-password, session-revocation, unlock,
  status, archive, and restore flows show the target and current/proposed result
  where applicable. Successful mutation feedback exposes a truthful audit
  reference; no-op status results state that no new audit record was created.
- Password reset, session revoke, and unlock now use the existing D1 idempotency
  ledger. A password-reset replay never stores, reconstructs, or returns the
  one-time plaintext credential.
- Safe account audit history exposes only allowlisted before/after fields.
  Successful HTTP responses retain the Worker correlation header; transport
  failures use a generic retryable error.
- Ordinary Administrators still cannot assign or retain the Administrator role
  through policy editing; System Owner targets remain protected.

## Verification

- Focused Vitest: 4 files / 29 tests passed after the P1 repair.
- Full `npm run check`: governance, ESLint, 78 Vitest files / 513 tests, preview
  build, deterministic shareables and Apps Script bundle, Cloudflare types,
  staging build and Wrangler dry-run, then final preview rebuild and artifact
  parity all passed at the accepted implementation.
- Real local Worker: owner-only roster plus Access lifecycle passed 2 / 2 on the
  initial implementation; ordered department seed plus Administrator reset UI
  and audit-reference handoff passed 2 / 2 after repair.
- An isolated reset-UI diagnostic was invalid without its department-seed
  prerequisite; the ordered prerequisite pair passed and is the accepted proof.
- `git diff --check` passed and the worktree retained only untracked
  `.codegraph/` after each commit.

## Independent review and orchestration

The first usable fresh Sol review of `045aece8…` failed with one P1 and two P2
findings: replay responses could display the retry request rather than the
original audit correlation, while first password reset and Access-ID change
omitted their audit reference and the Access-ID confirmation lacked explicit
target/current/proposed/result labels.

All findings were repaired at `6bec7d9be355b556fe0d93143a85127a99dd9740`.
One additional fresh Sol review was required because the confirmed P1 caused
code changes and materially changed the reviewed SHA. That exact-head re-review
passed with no P0–P3 findings. The delegation ledger records stalled review
attempts and the refined one-review-per-slice policy.

## Boundaries and next slice

No migration, database write, provider mutation, staging upload, production
deployment, domain change, Google action, GitHub push, or pull-request action
occurred. Production remains on immutable v0.7.0. The next bounded slice is
canonical workspace routing, integer quantities, borrower-selector semantics,
and dirty-form protection.
