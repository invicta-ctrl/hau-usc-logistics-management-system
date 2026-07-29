# v0.7.0 Phase 19 Brand Assets and R2 Handoff

Status: ACCEPTED ON STAGING — PRODUCTION UNTOUCHED

Accepted staging runtime: `f8b19f6be042c995ad0ae01f420d15ac191cfdad`

## Accepted scope

Phase 19 provides six governed brand slots: USC logo, DOL logo, combined
lockup, favicon, login background, and default item image. The System Owner
can preview, upload a validated draft, publish, replace, and roll back retained
versions. Administrator remains read only and every mutation is authorized,
idempotent, versioned, and audited on the server.

Migration `0028_brand_asset_governance.sql` adds the owner-only
`brand.manage` capability, the slot registry, immutable version metadata,
append-only history, optimistic revisions, and mutation replay records. R2
objects use versioned keys and are never deleted when a later version is
published. Public routes resolve the D1-published pointer and retain a bounded
legacy-key fallback for migration safety.

## Validation and delivery

- MIME type is derived from PNG, JPEG, WebP, or sanitized SVG bytes; client
  metadata is not trusted.
- Byte size and dimensions are bounded; favicon dimensions have the tighter
  512-pixel maximum.
- SVG scripts, active content, event handlers, external references, data URLs,
  doctypes, and entities are rejected.
- SHA-256, dimensions, byte size, accessible alt text, upload actor/time, and
  publication actor/time are recorded for every version.
- Exact duplicates within a slot are rejected after idempotent replay is
  checked.
- Login, shared navigation, mobile header, authenticated and public Request
  Center/Lending Center identity, favicon, and catalog item placeholders use
  the governed routes. No live stock-media integration was added.

## Staging evidence

- A private pre-0028 D1 export was independently restored in memory with
  integrity `ok`, zero foreign-key violations, and 72 tables.
- Staging is ready on schema 28 and migration 0028 at the exact accepted
  runtime above.
- Reconciliation reports six slots, seven retained versions, six published
  pointers, fifteen append-only history rows, fifteen matching brand audit
  rows, one System Owner grant, and zero grants to other roles.
- Lifecycle totals are seven uploads, six initial publications, one
  replacement, and one rollback. The reviewed 256-pixel favicon is the final
  published version; the replacement remains retained as history.
- All six public routes return HTTP 200 with validated PNG content. Recorded
  byte sizes range from the compact favicon through the official source logo
  and login background without HTML fallback.
- Staging rejects an exact duplicate with `BRAND_ASSET_DUPLICATE`, active SVG
  with `BRAND_ASSET_MEDIA_INVALID`, and excessive dimensions with
  `BRAND_ASSET_DIMENSIONS_INVALID`.
- Deployed browser acceptance passed on mobile and desktop. Administrator saw
  six governed routes and zero owner controls. System Owner started cleanly,
  saw all six upload controls, six published labels, six version histories,
  and six completely loaded images.
- The synthetic staging owner was disabled after acceptance, its credential
  version was rotated, and all sessions were revoked. Creation, lifecycle, and
  cleanup audits remain immutable.

## Verification

- `npm run check`: pass; 72 Vitest files / 467 tests plus governance, lint,
  deterministic generated artifacts, Apps Script parity, distribution checks,
  Cloudflare types, and deployment dry-run.
- `npm run test:e2e`: 127 passed / 311 intentional skips / zero failed across
  the six-width responsive matrix.
- `npm run test:e2e:cloudflare:local`: 34 / 34 passed against fresh workerd,
  D1, and R2 emulation. This includes owner lifecycle, Administrator denial,
  public delivery, and requester self-scope after the qualified event-ordering
  repair.
- Exact-head PR #9 CI: 6 / 6 passed for
  `f8b19f6be042c995ad0ae01f420d15ac191cfdad`.

## Boundary and next phase

Production was not deployed, migrated, seeded, promoted, merged, tagged, or
otherwise modified. Staging and production private configurations use distinct
D1/R2 bindings and both now route `/api/*`, `/brand/*`, and `/media/*` through
the Worker, but only staging was applied.

Phase 19 passes. Continue directly to Phase 20:
Privacy, Consent, and Support. Add accessible, production-ready policy and
support content to the public requester and borrower surfaces; verify private
data exclusion from errors, URLs, logs, screenshots, analytics, receipts, and
unauthorized responses. Do not weaken existing tracking or authorization
boundaries.
