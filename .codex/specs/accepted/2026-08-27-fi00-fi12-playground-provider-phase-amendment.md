# Accepted Amendment — FI-00 through FI-12 Playground Provider Phase

STATUS: ACCEPTED__OWNER_CONTINUED__NOT_STARTED
DATE: 2026-08-27

## Authority

- `D:/Download/HAU_USC_Logistics_FI00_FI12_Playground_Migration_Master_Prompt_2026-08-26.md`, explicitly adopted by the owner.
- The owner's explicit continuation of the FI-00 through FI-12 Playground migration.
- Candidate checkpoint `2a2887b92b8a25fc395e493bab327418d37fc1ce` on `release/v0.8.3-fi12-playground`.
- `.codex/specs/accepted/2026-08-27-fi00-fi12-playground-migration.md`.

## Authorized provider phase

Only the following ordered work is authorized for the isolated Playground candidate:

1. Authenticated, read-only Cloudflare, GitHub, and provider reconciliation/preflight.
2. Preservation and rollback evidence capture before any Playground write.
3. Read-only Production D1 export and R2 fingerprint evidence, kept private and outside Git.
4. Existing-script privacy filtering for the one-way Production -> sealed Playground baseline -> Playground working-state path.
5. Playground-only resource reconciliation and provisioning.
6. Exact candidate configuration, build, and Playground deployment.
7. Staged Playground acceptance and reset.
8. Required private evidence outside Git and deployment/rollback receipts.

## Non-negotiable boundaries

- Production remains read-only: no Production write, deploy, schema/data/provider mutation, or Production recovery-pointer rotation.
- No reverse Playground -> Production synchronization.
- Never copy or retain credentials, password material, OTPs, tokens, sessions, private keys, recovery codes, private evidence objects, hidden provider identifiers, raw internal identifiers/fingerprints/provenance, or unnecessary personal/contact data.
- The sanitizer must fail closed for schema-31/32 sensitive data, including `normalized_email_fingerprint`, `source_provenance_envelope`, `assignment_fingerprint`, `account_access_id_snapshot`, `staff_account_activity_history`, and `staff_account_activity_audit_context`.
- Require schema 32 and `0032_staff_account_activity_history.sql`; preserve exact candidate identity and the current Production/rollback binding-isolation checks.
- No FI-13/FI-14 work, Figma write, main merge, arbitrary impersonation, or release-scope expansion.
- Do not clean up, retire, delete, or repurpose the prior Playground resource set until the replacement candidate passes acceptance and a separate cleanup decision is accepted.
- Private exports, provider/resource identifiers, rollback material, and deployment evidence remain outside Git; Git receives only sanitized non-secret receipts.

## Stop conditions

Stop before the affected action if exact candidate/deployment identity, binding isolation, schema-32/0032 parity, rollback/recovery evidence, privacy transformation, authorization, or reconciliation cannot be proven; if a provider preflight exposes an unexpected resource, divergence, secret/private value, or unauthorized Production impact; or if staged acceptance fails.

## Next action

Run authenticated read-only provider reconciliation only. Do not provision, export, deploy, reset, or mutate any external resource in this amendment-recording checkpoint.
