# v0.7.0 Phase 16 — Shared Release Desk and System Status Handoff

Status: PHASE 16 ACCEPTED ON STAGING; PHASE 17 NEXT; PRODUCTION NO-GO

## Exact checkpoint

- Branch: `chore/v0.6-codex-continuity-bootstrap`
- Shared Release Desk implementation and proof:
  `8bd5897cf7afb6e1ef75ce69e4c3f2818603b179`
- Deployed-route correction:
  `b02b50219ecec02d2dfabfc42b260f08eb8328d9`
- Governed cleanup-session correction and accepted staging runtime:
  `ac83af82aec2e42ae839d8b4975947ebf0a1526a`
- Hybrid evidence predecessor:
  `5f2645d45106bad05ff3bcdab64c1d6bcc322c88`
- Staging database: schema 23 /
  `0023_hybrid_evidence_storage.sql`
- Production remains untouched and NO-GO.

## Accepted operational path

The Shared Release Desk remains one canonical governed domain across the
Administrator, Food, Inventory, and Materials projections. Workspace and
operational-scope changes filter the same records; they do not fork release
identity, evidence, quantities, history, corrections, or ledger relationships.

The accepted path proves:

```text
Accepted request line
→ reservation
→ release eligibility
→ stock revalidation
→ partial handoff
→ completed handoff
→ explicit recipient confirmation
→ verified private R2 evidence
→ append-only ISSUE movements
→ remaining quantity and request status
→ Owner-only compensating correction
→ append-only RELEASE_CORRECTION reversal
→ final release
→ scoped request/release/inventory projections
```

- Full, partial, and final releases preserve one request and request-line
  history with stable release-group relationships.
- Recipient name, role, organization, releasing actor, timestamp, evidence,
  notes, line quantities, and status remain projected from canonical D1 data.
- Duplicate reservation, release, and correction delivery is idempotent.
- A fully consumed correction replay now resolves its prior result before
  mutable remaining-quantity validation, without weakening actor or scope
  authorization.
- Corrections never rewrite an ISSUE row. They append a governed
  `RELEASE_CORRECTION` reversal linked to the original movement and create the
  compensating reservation required for a later release.
- Unauthorized evidence-status and correction requests fail closed.

## Protected System Status

The System Owner-only control desk now presents:

- primary R2 status;
- pending Drive backups;
- failed backups;
- oldest pending backup;
- last successful backup;
- last reconciliation;
- files requiring restoration.

The client calls the protected Owner endpoint through every runtime adapter.
Normal Administrators cannot see or open the control or panel. Technical
Details expose only governed configuration and status totals; bucket names,
object keys, Drive file IDs, OAuth values, and raw provider errors are not
rendered.

## Verification

- `npm run check`: PASS
  - governance and continuation checks;
  - ESLint;
  - 70 Vitest files / 457 tests;
  - build and generated-artifact parity;
  - Apps Script checks;
  - distribution verification;
  - Cloudflare types and deploy dry-run.
- Full browser matrix: 126 passed / 306 intentional viewport skips / zero
  failures.
- Fresh local Worker/D1 acceptance: 30 / 30 passed.
- Focused exact-runtime deployed staging acceptance: 1 / 1 passed.
- Draft PR #9 exact-runtime checks: 6 / 6 passed.
- Cache-busted staging health and readiness report `STAGING`, exact runtime
  `ac83af82aec2e42ae839d8b4975947ebf0a1526a`, schema 23, migration 0023,
  evidence R2 available, and protected configuration complete.
- The live staging scenario proved request/release/recipient/evidence/
  correction projections, three ISSUE movements, one linked compensating
  reversal, R2 acceptance, verified asynchronous Drive synchronization,
  protected System Status, and governed evidence archive.

## Reconciliation and external-state result

- A private remote D1 export was verified before synthetic setup.
- Only the explicitly synthetic staging event, series, item, requests,
  releases, evidence, and ledger records were used.
- The staging event is restored to `CANCELLED`; its series and item are
  restored to `ARCHIVED`.
- The synthetic item is reconciled to on-hand `1`, effective reserved `0`, and
  available-to-promise `1`.
- All Release Desk acceptance evidence is `ARCHIVED`; both primary and Drive
  copies are retained. No pending, failed, restore-required, or synced
  Release Desk acceptance fixture remains active.
- Private bucket, Drive, OAuth, credential, and Worker configuration remains
  outside Git.
- No public file permission or link was created.
- Production was not uploaded, deployed, migrated, written, promoted, merged,
  tagged, or released.

## Rollback

The accepted pre-completion Phase 16 runtime is
`5f2645d45106bad05ff3bcdab64c1d6bcc322c88`. If rollback becomes necessary,
redeploy that runtime, preserve additive schema 23 and immutable release,
ledger, evidence, history, and audit records, then reconcile before any
separately authorized data action.

## Phase boundary

Phase 16 is complete on staging. Phase 17 — Inventory Production Data
Readiness — is the next accepted work unit. Begin it with a fresh authoritative
source snapshot and reconciliation; do not infer production deployment,
migration, merge, tag, or release authority from this handoff.
