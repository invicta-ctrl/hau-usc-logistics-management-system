# Accepted Packet — FI-00 through FI-12 Isolated Playground Migration Candidate

STATUS: ACCEPTED for the first local-only implementation checkpoint
DATE: 2026-08-27

## Objective

Prepare the isolated FI-00 through FI-12 Playground candidate for later owner-controlled operations. This packet authorizes only candidate-local source, test, and deterministic build changes. It does not authorize external execution.

## Scope and invariants

- Required data contract: schema 32 and `0032_staff_account_activity_history.sql`.
- Baseline direction is Production read-only export to privacy transform to sealed Playground baseline to Playground working state only. Reverse synchronization is forbidden.
- Baseline data must exclude or fail closed for credentials, sessions, tokens, private evidence, unnecessary contact data, raw identifiers, normalized-email and assignment fingerprints, provenance envelopes, account-access snapshots, `staff_account_activity_history`, and `staff_account_activity_audit_context`.
- The artifact verifier accepts exactly one canonical `hau-deploy-target` marker for staging or production and rejects preview artifacts.
- Any future deployment must verify both the current Production binding tuple and the exact rollback staging version/binding tuple before upload or rollback.
- FI-08 and FI-09 remain visual-only where their existing runtime contracts say so. Existing no-store protections for protected/session/account/private responses are preserved.

## Explicit exclusions

No Production/Playground/D1/R2/provider mutation, workflow dispatch, baseline export/import, deployment, main promotion, Figma write, migration application, commit, push, or FI-13/FI-14 work is authorized. Product UI, Worker/API/auth/session code, migrations, generated artifacts, lockfiles, and provider configuration are excluded.

## Required local verification

Verify the exact candidate worktree/branch/HEAD and permitted dirty baseline; reconcile managed governance replicas by byte equality; run focused unit suites and `npm run check:release-candidate`; build staging and production artifacts and verify their markers; build preview and prove marker-verifier rejection; inspect the complete diff; then stop.
