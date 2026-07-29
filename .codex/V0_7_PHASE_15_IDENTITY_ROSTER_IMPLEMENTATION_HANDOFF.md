# v0.7.0 Phase 15 — USC Officer and Staff Directory Handoff

Status: ACCEPTED ON STAGING; PRODUCTION NO-GO

## Exact checkpoint

- Branch: `chore/v0.6-codex-continuity-bootstrap`
- Source-flow commit: `2bfb393c564671d26b802c47adbe41978652aefa`
- Atomicity repair: `973a028c8c8940414d2baf9f64b4059ae453d9e0`
- Accepted staging candidate:
  `07b5dd006656e370cc2bf7df4ced785be61a2604`
- PR: draft #9
- Staging database: schema 21 /
  `0021_owner_protected_identity_roster.sql`
- Production remains untouched and NO-GO.

## Accepted product boundary

- The System Owner surface is named **USC Officer and Staff Directory**.
- The approved Google source is private, restricted, shared Viewer-only to a
  dedicated reader identity, and read through the read-only Sheets scope.
- The source adapter maps only Student Number, institutional email, and full
  name into the canonical roster projection. Unrelated source columns are not
  imported.
- Student ID, institutional email, display name, verification result, and
  review notes are AES-GCM encrypted before D1 storage.
- Institutional email matching uses a keyed HMAC identity key; plaintext email
  is not indexed in D1.
- Explicit owner preview validates required identity values and quarantines all
  occurrences of duplicate or incomplete rows. Valid rows can apply while
  quarantined rows remain outside the projection.
- Preview records an opaque exact-source fingerprint and add/change/removal/
  unchanged/rejection reconciliation counts.
- Apply requires the current fingerprint and a reason, is transaction-guarded,
  appends audit evidence, and verifies projection parity.
- Only the latest applied run can be rolled back. Rollback restores the exact
  encrypted pre-apply snapshot and reconciles the restored projection.
- Full directory, preview, apply, and rollback require `SYSTEM_OWNER`
  server-side. Normal staff receive only their permitted self-profile
  projection; login and self-profile never query Google.
- Privacy-safe rejection output exposes row numbers and validation codes, not
  Student IDs, emails, or private row values.
- The shared internal surface includes reusable `?` and `!` contextual help
  cues without weakening server authorization.

No private source identifier, service-account identity, private key, credential,
provider identifier, or roster value is recorded in Git.

## Migration, backup, and live staging

- A private pre-migration export was captured before applying migration 0021.
- Export SHA-256:
  `ff2c2dce5e0b81a7acd74c0829be82f73666b6c45c0eacbc3b3d85c49c64804f`
- Migration 0021 applied successfully and staging reports schema 21.
- Cache-busted health/readiness/version verification reports STAGING, exact
  candidate `07b5dd0`, schema 21, migration 0021, healthy and ready.
- The approved source returned 127 rows: 37 accepted and 90 quarantined.
- Final staging projection:
  - 37 directory entries;
  - 37 active entries;
  - one current source fingerprint;
  - 37 entries matching the latest fingerprint;
  - zero inconsistent sync runs.

## Repaired staging acceptance defect

The first live apply exposed a D1 repository defect: the projection and audit
batch committed for a validation result with quarantined rows, but the sync-run
status update rejected that result and the API returned 500.

Writes were stopped immediately. The single affected run and its 37 entries
were reconciled, then reverted through the normal owner rollback API. Database
guard statements were added at the start of apply and rollback batches, the
accepted validation state was handled consistently, and a Miniflare regression
test proved the repair.

The full live acceptance was then rerun from an empty projection and passed:

- anonymous owner endpoint: 401;
- authenticated non-owner owner endpoint and full directory: 403;
- permitted non-owner self-profile: 200 with no unauthorized directory data;
- stale or superseded apply: 409 with zero projection change;
- apply: 200 and reconciled to 37 entries;
- exact replay: 200 with replay evidence;
- no-op apply: 409 with the projection unchanged;
- rollback: 200 and reconciled to zero entries;
- re-apply: 200 and reconciled to the final 37 entries.

## Verification

- Focused Google source, service, and D1 repository tests: 10 / 10 passed.
- Focused local Worker/browser identity-roster scenario: 1 / 1 passed at the
  mobile viewport.
- `npm run check`: PASS
  - governance and continuation checks;
  - ESLint;
  - 65 Vitest files / 437 tests;
  - build and generated-artifact parity;
  - Apps Script checks;
  - distribution verification;
  - Cloudflare types and deploy dry-run.
- Exact-candidate deployed Chromium acceptance: 6 / 6 passed, covering governed
  branding/login, Materials, authentication and Access Management, Advanced
  Access Management, Request Center privacy, and Lending Center privacy.
- Live UI verification confirmed one governed directory control, the approved
  product name, and both contextual help cues.
- PR #9 exact-head CI passed 6 / 6.

No roster screenshot, trace, or video was captured. Production was not
deployed, migrated, promoted, merged, tagged, or released.

## Next accepted action

Proceed to Phase 16 — Shared Release Desk and Global Owner Access — using the
accepted master specification. Preserve the protected roster source,
encryption, privacy, atomicity, and live staging evidence.
