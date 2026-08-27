# FM-R04 Checkpoint — Playground Reset Baseline Frozen

STATUS: PASS
CHECKPOINT_DATE: 2026-08-28 Asia/Manila
MODE: PLAYGROUND-ONLY BASELINE RECONCILIATION
WORKTREE: D:/Documents/Codex/HAU-USC Logistics/worktrees/fi00-fi12-playground-candidate
BRANCH: release/v0.8.3-fi12-playground
TOOLING_SOURCE_COMMIT: da6de450a98a54a8515f8c4ef2b4df349089d20f
TOOLING_SOURCE_TREE: 4610e50b4996384c338c28ee3fae9aea191946b2
PRODUCTION_MUTATION: ZERO

## Frozen reset inputs

- The sealed D1 reset bookmark remains available and bound to the isolated Playground working database.
- Schema 32, migration `0032_staff_account_activity_history.sql`, and foreign-key checks pass.
- Exactly two D1-linked privacy-filtered evidence placeholders exist under the accepted `playground-redacted/` namespace.
- Those two placeholders now exist byte-identically in both the sealed Playground evidence baseline and the isolated working evidence bucket.
- Sealed recovery objects under `control/` remain baseline-only and are excluded from application-evidence reconciliation.
- The reset generation before the first proof is zero.

## Transient-state classification

- Eleven Playground sessions existed at freeze and are reset-scoped state that must be invalidated by the first proof.
- Password-reset tokens, authentication rate limits/events, email-verification challenges, account applications/history, public request/lending rate-limit events, and reporting outbox rows are all zero.
- The nonzero sessions do not contaminate the privacy-filtered baseline; they are the old-session invalidation input.

## Provider and isolation verification

- Provider identity, the exact isolated Playground D1/R2 tuple, rollback availability, disabled email delivery, direct public readiness/version endpoints, and custom-domain Access protection pass.
- The Production Worker identity and Production binding tuple remain unchanged from the accepted receipt.
- No Production object was read while reconciling the privacy-filtered evidence baseline.
- Production mutation remained zero.

## Evidence handling

- The initial failed read-only lookup is preserved outside Git.
- Successful reconciliation and freeze reports, command outputs, redacted placeholder copies, hashes, provider identifiers, and bookmarks remain outside Git in the private evidence root.
- No secret, provider identifier, object key, bookmark, or evidence body is recorded here.

NEXT_ACTION: Run reset proof one exactly once to a new private report path, reconcile its result, then prove that a session created before the reset is rejected.
