# v0.7.0 Phase 16 — Hybrid Evidence Storage Staging Handoff

Status: ACCEPTED PHASE 16 SUB-SLICE ON STAGING; PHASE 16 ACTIVE; PRODUCTION NO-GO

## Exact checkpoint

- Branch: `chore/v0.6-codex-continuity-bootstrap`
- Shared Release Desk foundation:
  `2cf7344f77259a9e8aef25a1f06ba942115fccab`
- Hybrid evidence implementation:
  `fc737d0101ec97c749ad7d718ddb35afdcf26279`
- Private Worker-config repair:
  `7eb682a1899640e0f39414678f2756604412001e`
- Deployed acceptance coverage:
  `1daad52e531bf5a400ca2a368ac9229cd3b83593`
- Protected diagnostic status repair:
  `f936b5ac2b88ad5475ae3aabc986c836245ca0b2`
- Accepted staging runtime:
  `5f2645d45106bad05ff3bcdab64c1d6bcc322c88`
- PR: draft #9
- Staging database: schema 23 /
  `0023_hybrid_evidence_storage.sql`
- Production remains untouched and NO-GO.

## Accepted authority and boundary

This sub-slice implements
`.codex/specs/v0.7.0-hybrid-evidence-storage-amendment.md` under Phase 16 of the
accepted production master specification.

- Private Cloudflare R2 is the authoritative operational evidence store.
- Authorization, declared type, file signature, and size are validated before
  acceptance.
- The R2 write is verified before D1 atomically commits protected metadata,
  audit context, retention, and the asynchronous backup job.
- The related workflow completes only after R2 and D1 pass. Google Drive
  availability is not part of the synchronous transaction.
- Google Drive is a private, asynchronous secondary backup and Owner recovery
  archive.
- Backup jobs use bounded retry and a stable evidence-ID/checksum idempotency
  key. The Drive custom property stores its deterministic SHA-256 marker so it
  remains within the provider's key/value length limit.
- A backup becomes `SYNCED` only after file identity, size, approved parent, and
  checksum verification.
- Duplicate delivery reuses the existing copy and does not create another Drive
  file.
- Exhausted or permanent failures remain available for protected Owner review.
- The Owner-only restore path validates the backup, refuses to overwrite a
  valid primary silently, verifies the restored R2 object, updates protected
  metadata, and appends Activity History and audit evidence.
- Archive retains both the operational object and recovery copy. Permanent
  deletion remains separately owner-authorized and retention-governed.
- Bucket names, object keys, Drive file IDs, OAuth values, and raw provider
  errors remain in protected Technical Details only.

## Required acceptance evidence

1. **R2 succeeds while Drive is unavailable.** Unit coverage and a live bounded
   provider-failure probe confirmed a verified R2 object and committed D1
   record while the backup moved to protected failure handling.
2. **The related workflow completes safely.** The accepted API result remained
   complete after the authoritative R2/D1 transaction; Drive failure did not
   roll it back.
3. **The backup job retries.** Focused automated coverage verifies bounded
   backoff and the transition through retry states.
4. **Duplicate delivery creates no duplicate.** Automated delivery replay and
   the deployed staging scenario returned the same evidence identity and one
   verified secondary copy.
5. **Verification precedes `SYNCED`.** The deployed job reached `SYNCED` only
   after size, approved parent, and checksum verification.
6. **An Owner can restore.** A governed staging acceptance removed only a
   validated synthetic primary object, observed `RESTORE_REQUIRED`, restored
   it through the Owner path, and independently verified matching protected,
   R2, and Drive checksums.
7. **Unauthorized users cannot inspect or restore.** Anonymous status and
   restore requests returned 401; server-side capability tests cover
   authenticated non-owner denial.
8. **No public link is created.** The Drive adapter requests private-file
   creation only and never invokes a permission/public-link API; focused tests
   assert the boundary.
9. **Secrets and private identifiers remain protected.** Ordinary responses,
   UI, and logs expose only bounded status; protected provider identifiers and
   diagnostics stay behind System Owner authorization.

## Verification

- `npm run check`: PASS
  - governance and continuation checks;
  - ESLint;
  - 70 Vitest files / 456 tests;
  - build and generated-artifact parity;
  - Apps Script checks;
  - distribution verification;
  - Cloudflare types and deploy dry-run.
- Fresh local Worker/D1 acceptance: 30 / 30 passed.
- Focused exact-runtime deployed staging acceptance: 1 / 1 passed.
- Fresh cache-busted health and readiness report `STAGING`, exact runtime
  `5f2645d45106bad05ff3bcdab64c1d6bcc322c88`, schema 23, migration 0023, and
  all required dependencies available.
- Governed Owner restore acceptance and independent post-restore R2/Drive
  checksum reconciliation: passed.
- PR #9 exact-runtime checks: 6 / 6 passed.
- The UI/client artifacts did not change in the final provider repair, so the
  earlier verified Phase 16 browser matrix of 126 passed / 306 intentional
  skips was reused rather than redundantly rerun.

## Reconciliation and external-state result

- Three bounded pre-repair failure probes were archived through the governed
  Owner API while retaining both operational evidence and audit history.
- The restore acceptance record was archived after successful independent
  verification.
- All synthetic evidence records are `ARCHIVED`; no `PENDING`, `FAILED`,
  `RESTORE_REQUIRED`, or `SYNCED` acceptance fixture remains active.
- Private OAuth, folder, bucket, and Worker configuration remains outside Git.
- No public file permission or link was created.
- Production was not uploaded, deployed, migrated, written, promoted, merged,
  tagged, or released.

## Rollback

The last fully accepted pre-Phase-16 runtime is
`07b5dd006656e370cc2bf7df4ced785be61a2604`. If rollback becomes necessary,
redeploy that runtime, preserve additive schema 23 and immutable history, stop
evidence writes, and reconcile before any separately authorized data action.
Intermediate diagnostic runtimes are not accepted Drive-backup rollback
targets.

## Remaining Phase 16 work

Phase 16 is not complete. The next bounded action is to audit and prove the
remaining Shared Release Desk operational path and the protected System Status
presentation against the master specification and hybrid amendment. Preserve
this evidence-storage acceptance, the Phase 15 protected roster, and all earlier
authorization/data invariants. Do not advance Phase 17.
