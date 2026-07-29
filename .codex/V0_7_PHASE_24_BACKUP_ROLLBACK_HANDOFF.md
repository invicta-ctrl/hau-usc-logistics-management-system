# v0.7.0 Phase 24 Backup, Retention, and Rollback Handoff

Status: ACCEPTED ON STAGING — PRODUCTION UNTOUCHED

Final staging runtime: `d095685e223be2697cc72582d35967e70cfd5163`

Approved prior safe runtime: `7c47f229c43e36bcf28273998a48b36aeb3aaedd`

Schema: 29 / `0029_reusable_asset_reassignment.sql`

## Recovery package

- A fresh private D1 SQL export is retained outside Git: 3,265,192 bytes,
  SHA-256 `ba8c039a5ebbdfb56103fd49baee5d3eade9b06985023d826d4e8fc1fcd28c42`.
- Independent local import validation reports integrity `ok`, zero foreign-key
  violations, 75 application/provider tables, and schema 29.
- A fresh private D1 Time Travel bookmark is present. It is not reproduced in
  Git because a restore bookmark is protected operational metadata.
- The latest applied Google roster run preserves an encrypted 127-row source
  snapshot: 37 accepted and 90 quarantined. The protected envelope and its
  private digest are retained outside Git; no roster value was exposed.
- R2-related metadata was preserved for 464 rows across five D1 metadata
  tables. Object keys, checksums, provider identifiers, and private asset
  values remain outside Git.
- The private package also preserves the retained Worker-version and
  deployment metadata needed to resolve both rehearsal endpoints.

## Cleanup, retention, and append-only proof

- Forty-two accounts carrying staging/smoke/phase/acceptance synthetic labels
  are all disabled or revoked; zero labeled synthetic account is active.
- Thirty database triggers enforce append-only or immutable history boundaries.
  Audit, status, ledger, release, evidence, event, access, and related history
  were not rewritten or deleted.
- Private D1 export, bookmark, encrypted Google snapshot, R2 metadata, Worker
  metadata, and rehearsal evidence remain owner-restricted outside Git through
  production launch and post-launch owner sign-off. No automated purge is
  authorized.
- Evidence/Drive lifecycle and any longer numeric retention period remain an
  HAU owner-policy value. Until that value is approved, evidence is preserved
  and deletion fails closed; the repository does not invent a duration.
- Ephemeral rate-limit rows continue to use their implemented sliding-window
  cleanup. Phase-created rows were reconciled exactly before this backup.

## Real staging rollback rehearsal

The rehearsal used retained immutable Worker versions and changed only staging
traffic:

1. deployed approved prior safe runtime `7c47f22` at 100 percent;
2. verified exact runtime identity and schema-29 compatibility;
3. ran health, readiness, version, unauthenticated auth-session, request-page,
   requester-boundary, public-lending, and protected-release smoke;
4. restored exact final runtime `d095685` at 100 percent;
5. repeated the same eight checks on the restored runtime;
6. exported D1 again and reconciled it byte-for-byte with the pre-rehearsal
   export.

Both runtimes returned 200 for health, readiness, version, request page, and
public lending. Auth session, requester-only data, and protected release
correctly returned 401 without a session. The final D1 export has the same
3,265,192 bytes and SHA-256 as the pre-rehearsal export.

An initial verifier pass used a 60-second convergence window and one overly
strict version/schema assertion; staging was restored before the verifier
failed. The corrected rehearsal then passed completely. Those provider
deployment attempts are retained honestly in private history.

## Verification

- Cache-busted live health after rehearsal: STAGING, exact `d095685`, schema
  29, D1 connected, ready runtime.
- D1 pre/post export: byte-identical.
- Phase 23 documentation head `c61cb65` passed PR #9 exact-head CI 6 / 6.
- Working tree preserves the pre-existing untracked `.codegraph/` directory.

## Boundary and next phase

Phase 24 passes. Continue directly to Phase 25 production authorization,
resource separation, and fail-closed preflight. This handoff does not authorize
production deployment, migration, secret mutation, data writes, or smoke.
