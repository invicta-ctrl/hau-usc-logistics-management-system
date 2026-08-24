# R3-A1-A2-B1-A1 — Secure Authenticated Identity and Requester Backend Foundation

STATUS: ACCEPTED
OWNER: Earl
ACCEPTED: 2026-08-24
OWNER_ACCEPTANCE: Approve the recommended B1-A1 defaults.
PARENT: `.codex/specs/accepted/2026-08-23-r3-a1-a2-owner-routing-identity-three-context.md`
SOURCE_PROPOSAL: frontend branch `.codex/specs/proposed/2026-08-24-r3-a1-a2-b1-authenticated-identity-and-dol-requester-backend.md`
AMENDMENT_SOURCE: owner-held A2 reconciliation amendment dated 2026-08-24
BRANCH: `backend/r3-a1-a2-b1`
BASE: `main@f7e5bf83205dbe58b5fb72126a4456747d92e906`
ACTIVE_WRITER: Ox Alpha #1 (`/root/ox_b1_bi02a_writer`)
WRITER_AUTHORITY: Owner-approved sole-writer failover after verified DeepSeek V4 Pro exhaustion
REVIEWER: Sol, read-only
RISK: HIGH — authentication credentials, protected identity data, atomic state, migration schema

## Objective

Implement the secure backend foundation required by the authenticated identity flows before exposing any route. The program first completes BI-02 identity verification and recovery, then separately implements BI-03 DOL requester mode. This accepted slice is BI-02A only: additive state, cryptography contracts, protected identity lookup contract, atomic repositories, and focused tests. HTTP routes, service exposure, provider delivery, feature activation, BI-02B, and BI-03 remain out of scope.

## Accepted defaults

- Overall order is BI-02 identity verification/recovery followed by BI-03 DOL requester mode.
- Migration sources 0033 and 0034 are authorized for writing. They may be applied only to disposable local test databases. No remote D1/R2 write, provider call, deployment, Playground mutation, Production mutation, email-provider mutation, Figma change, or frontend change is authorized.
- The protected canonical identity roster is the future registered-email authority. The foundation must never request, accept, store, log, audit, or expose a raw destination email.
- OTPs and completion tokens use versioned keyed HMAC with an injected approved secret pepper. Unkeyed digests are forbidden for new credential material. Verification uses constant-time comparison, preserves leading zeros, separates key/domain/flow context, and fails closed on absent, invalid, expired, revoked, exhausted, wrong-flow, or delivery-failed state.
- Challenge transitions use compare-and-set semantics with affected-row proof. Exactly one concurrent verify, consume, or completion-token consumer wins. Attempts cannot exceed their maximum through a race. Resend revokes the prior generation. Expired, revoked, and failed-delivery challenges cannot verify.
- Delivery reconciliation uses a durable PENDING/SENT/FAILED outbox seam without raw recipient material. This slice sends nothing. Audit is atomic in the same persistence batch when available, or explicitly staged for the same batch; it never contains secret material or raw PII.
- Protected identity resolution is an injected fail-closed interface returning only the minimal canonical/account mapping later service code needs. Zero matches and multiple matches fail closed. Runtime Google/provider lookup is not implemented here.
- Schema changes are additive SQLite/D1-compatible tables, indexes, constraints, and metadata only. New behavior remains default-off until a separately accepted exposure slice. Rollback disables or reverts code while inert additive schema may remain.
- Legacy starter activation remains unchanged.

## BI-03 boundary

A future requester-mode account must be exactly one active `REQUESTER` or `DOL_STAFF` account holding `request.create` and resolving to exactly one active canonical department. The server derives requester identity, department, source, and account-plus-department scope. Client-supplied source, department, or requester identity is ignored. Self-approval is forbidden under this acceptance. BI-03 is not part of BI-02A.

## Data and future API direction

Migration 0033 provides challenge state, versioned HMAC metadata, attempt/resend generation accounting, expiry, flow binding (`ACTIVATE` versus `RESET`), verified/consumed/revoked timestamps, completion-token single-use state, delivery-outbox reconciliation, audit correlation, uniqueness/constraints, and indexes supporting at most one active challenge per protected identity and flow. Migration 0034 remains reserved for the later BI-02 slice and must not start in BI-02A. Future HTTP routes may follow the proposed activate/reset start, verify, and complete shape only after a separate accepted exposure amendment and default-on decision.

## Security and privacy invariants

- No raw identifier, destination email, OTP, token, password, provider prose, credential fragment, or unnecessary personal data may enter rows, logs, errors, audits, or test fixtures as live secret material.
- HMAC versions are explicit and rotation-safe; old-version verification policy must fail closed unless a later accepted amendment defines compatible migration.
- Ambiguous identity, unavailable roster, missing pepper configuration, wrong flow, replay, expiry boundary, maximum attempts, and delivery failure all fail closed with stable non-sensitive outcomes.
- Atomicity is proven deterministically rather than asserted. D1 batch guards and affected-row checks follow repository conventions.

## Verification

Focused tests run first. Required coverage includes migration ordering/replay/fresh disposable local database through 0033, foreign-key/integrity/schema checks, versioned HMAC separation and mismatch, leading-zero preservation, concurrency/replay/expiry/cross-flow/delivery-failure behavior, one-winner consumption, privacy/redaction assertions, and unaffected auth/reset/identity/migration suites. Repository-required lint/build/backend checks may run when relevant. Remote bindings and persistent databases are forbidden.

## Execution boundary

BI-02A permits only accepted-specification/continuity records, migration 0033, crypto and identity-contract modules, repository/state-machine primitives, and directly coupled tests. It forbids migration 0034, HTTP routes, Worker routing changes, service exposure, email sending, provider configuration, frontend/Figma changes, secrets, `.ai-bridge/`, destructive Git operations, history rewrite, unrelated cleanup, and any external-state write.

## Stop conditions

Stop and preserve a durable checkpoint on baseline/writer conflict, unsafe isolation, contradiction with migrations 0001-0032, missing deterministic atomicity, security/privacy test failure not repairable within BI-02A, need for remote/provider/secret access, scope expansion toward routes/providers/BI-03, push failure, or completed BI-02A awaiting Sol review.

## Current status

CHECKPOINT_A: COMPLETE_AFTER_VERIFICATION_AND_PUSH
IMPLEMENTATION_SLICE: BI-02A_ONLY
EXTERNAL_STATE_CHANGED: NONE
NEXT_EXACT_ACTION: implement migration 0033, versioned HMAC, protected identity contract, atomic repositories/state machine, and focused tests; then stop for Sol review.
