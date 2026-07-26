# v0.7.0 Phase 15 — Owner-Protected Identity Roster Implementation Checkpoint

Status: IMPLEMENTATION COMPLETE; LIVE STAGING GATE BLOCKED BY ABSENT APPROVED PRIVATE SOURCE

Production remains NO-GO.

## Exact checkpoint

- Branch: `chore/v0.6-codex-continuity-bootstrap`
- Product commit: `49f3dfd98b033b6f4240dc22390bee5206d25c54`
- PR: draft #9
- Last accepted staging runtime remains Phase 14 candidate `eca00e606054e896d9559e0249aaff8de0e0b750`.
- Last accepted staging database remains schema 20 / migration `0020_advanced_access_management.sql`.
- Migration 0021 has not been applied to staging.
- No Phase 15 Worker has been deployed.

## Implemented boundary

- Migration 0021 adds the protected identity directory, sync-run metadata, and
  immutable pre-apply rollback snapshots.
- Student ID, institutional email, display name, verification result, and
  review notes are AES-GCM encrypted before D1 storage.
- Institutional email matching uses a keyed HMAC identity key; plaintext email
  is not indexed in D1.
- The Google reader uses service-account OAuth with the read-only Sheets scope
  and reads only during an explicit System Owner preview.
- Exact schema, types, duplicates, verification values, and empty-source rules
  fail closed. Any rejection blocks apply.
- Preview records an opaque fingerprint and add/change/removal/unchanged/
  rejection reconciliation counts.
- Apply requires exact fingerprint confirmation and a reason, replaces the D1
  projection atomically, appends audit evidence, and verifies count/fingerprint
  parity.
- Only the latest applied run can be rolled back. Rollback restores the exact
  encrypted pre-apply snapshot and reconciles the restored projection.
- Full directory, preview, apply, and rollback require the exact
  `SYSTEM_OWNER` role server-side. General Administrator capabilities do not
  qualify.
- Normal users receive only their allowed self-profile projection from D1;
  login and self-profile never query Google.
- The shared internal Admin workspace exposes the sync surface only to the
  System Owner. Non-owner controls and the protected panel are hidden, while
  the server remains authoritative.
- The legacy Apps Script access roster is explicitly non-authoritative after
  Worker/D1 cutover and cannot alter the Phase 15 identity projection.

## Verification actually run

- `npm run check`: PASS
  - governance and continuation checks passed;
  - ESLint passed;
  - 65 Vitest files / 433 tests passed;
  - build and every generated artifact matched its source pipeline;
  - Apps Script checks passed;
  - Cloudflare types and deploy dry-run passed.
- `npm run test:e2e`: PASS — 126 passed / 306 intentional skips / 0 failed
  across the accepted six Chromium viewports.
- `npm run test:e2e:cloudflare:local`: PASS — 30 / 30 against a fresh local
  Worker/D1 with migration 0021.
- Focused Google reader, encryption/privacy, validation, D1 repository,
  owner-role, fail-closed source, no-login-query, and shared-shell visibility
  cases passed.
- `git diff --check`: PASS before the product commit.

One invalid command selected the nonexistent Playwright project `chromium`.
It was a command-selection error, not a test failure; the accepted full
`npm run test:e2e` command then passed.

## External state and exact blocker

The existing private Google configuration points to the legacy operational
workbook and exposes no separate approved identity roster. No local private
configuration contains `HAU_PRIVATE_ROSTER_SOURCE_ID`, a Phase 15 workbook,
or a Viewer-only service-account credential. The accepted master specification
requires a separate approved private Google Sheet and forbids inventing
Student IDs, institutional emails, verification results, or review notes.

A header-only template and private setup checklist were created outside Git:

`D:\Documents\Codex\private-config\hau-usc-logistics-v0.7-phase15-20260726`

No roster values, spreadsheet identifier, service-account identity, or secret
was created or recorded in Git.

## Mandatory unrun live checks

- approved private Sheet read and source fingerprint;
- owner preview with real approved rows;
- validation/rejection review and owner approval;
- staging backup before migration 0021;
- staging migration 0021 and schema reconciliation;
- exact-candidate staging deploy and readiness/version verification;
- owner directory/apply/self-profile privacy acceptance;
- real staging rollback and re-apply rehearsal for the roster projection;
- post-write D1/audit reconciliation;
- exact-head deployed browser acceptance and CI after the final checkpoint.

## Smallest safe next action

The owner must provide or approve one separate private Google Sheet populated
with the exact six Phase 15 headers and approved identity rows, plus a
Viewer-only Google service-account credential shared to that workbook. Then
configure the private staging bindings/secrets and resume at source preview;
do not deploy or migrate staging before that source authority exists.
