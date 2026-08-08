# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

Existing product: vanilla ES modules + Vite, Cloudflare Worker + D1 + R2 backend,
with a preserved Apps Script adapter path. No UI framework.

Design-preview stack (owner decision, 2026-08-07): **standalone modular
HTML/CSS/JS** under `prototypes/impeccable-whole-site-redesign/`. No build step,
no `npm install`, no change to `vite.config.js`. Chosen for isolation from the
production build and because it matches the repository's existing vanilla-JS
idiom.

## Users

Primary users are HAU-USC Department of Logistics (DOL) operators working inside
a university student council, on desktop in the office and on phones while
physically moving goods.

Seven canonical roles exist in source (`src/domain/constants.js`):

- `SYSTEM_OWNER` — protected operational administration and system health.
- `ADMINISTRATOR` — access, reference data, brand/media, system administration.
- `DIRECTOR` — leadership decisions, committee assignment, escalation, audit.
- `COMMITTEE_HEAD` — committee-scoped review, assignment, escalation.
- `DOL_STAFF` — committee-scoped execution: canvass, procure, receive, release.
- `REQUESTER` — USC officers/staff and Angelite students submitting requests and
  lending applications.
- `READ_ONLY_AUDITOR` — audit view only.

Three committees scope most operational work (`COMMITTEES`): Food
(`COM_FOOD`), Inventory and Pantry (`COM_INVENTORY_PANTRY`), and Materials
(`COM_MATERIALS`).

Five internal workspaces exist (`src/visual/workspace-routes.js`):
`/admin`, `/director`, `/food`, `/inventory`, `/materials`.

## Product Purpose

One governed logistics operating system for inventory, requests, lending,
release, receiving, procurement, event deliverables, access, evidence, and
operational oversight — while preserving authoritative stock, custody, audit,
privacy, and role boundaries.

Success means an item cannot enter or leave the office without being requested,
accounted for, and traceable to an actor, a decision, and an append-only ledger
entry.

## Positioning

Most logistics tooling optimizes for throughput. This product optimizes for
**accountable custody**: every quantity is derived from an append-only movement
ledger rather than an editable balance field, acceptance is deliberately
separate from physical release, and release is allowed to be partial and
cumulative. A neighboring product cannot truthfully copy this without adopting
the same ledger and custody model.

## Operating Context

- Requests originate from USC officers, staff, and Angelite students through
  public portals, and from staff internally.
- Work is organized around events with a series → sub-event hierarchy, each
  carrying requests, readiness, procurement, release, and completion.
- Materials work includes canvassing and supplier reference records.
- Borrowing can require approved borrower identity evidence.
- Staff regularly operate one-handed on a phone at a storeroom or event venue.
- Google Sheets/Drive and Cloudflare D1/R2 are operational plumbing, not the
  apparent source of truth to users.

## Capabilities and Constraints

Seven bootstrap modules (`src/app/bootstrap-contract.js`): `overview`,
`request`, `lending`, `release`, `restocking`, `procurement`, `inventory`.

Twenty-one canonical workflow statuses and ten ledger movement types exist in
`src/domain/constants.js`. A centralized presentation layer
(`src/domain/presentation-labels.js`) maps every enum to user-facing copy;
raw enums must never reach the interface.

Durable constraints future work must preserve:

- HAU-USC institutional identity must remain recognizable.
- Operational truth, custody, audit, ledger, permissions, and workflow states
  must never be weakened for visual simplicity.
- Public portals and internal workspaces must remain clearly separated.
- Request submission does not deduct stock. Acceptance/reservation is distinct
  from physical release. Release can be partial and cumulative.
- Inventory movement history is append-only; direct stock-balance editing must
  not be presented as an affordance.
- UI hiding is not authorization; controls must not imply capability the actor
  lacks.
- Public views must not expose protected stock, internal notes, roster data,
  supplier or private evidence, or audit internals.
- Failure states must say what saved, what did not save, and the next safe
  action.

Explicitly undecided / out of scope for this record: the live email provider and
`ACCOUNT_APPLICATION_IDENTITY_CLASSES_JSON` remain absent; readiness is
intentionally fail-closed.

## Brand Commitments

- Name: HAU-USC Department of Logistics; the system is the HAU-USC Logistics
  Management System.
- Institutional palette is binding: oxblood, burgundy, maroon, crimson, antique
  gold, metallic gold, light gold, cream, paper, white.
- Voice is plain institutional English. No provider jargon, no raw enums, no
  marketing language inside staff workspaces.
- Binding visual reference supplied by the owner:
  `docs/design/references/HAU_USC_Logistics_v0.7.2_UI_Repair_Unified_Icons_Reference.html`
  (SHA-256 `44d2800695d0f9546911522eba1b240ff405b4dbbfc85493ac27ea90f7e0972c`).
  Its identity and "governed warmth" are preserved; its layout is evidence, not
  a constraint.

## Evidence on Hand

- The reference HTML above is the only supplied visual artifact.
- Real operational records exist in the product (397-row authoritative inventory
  import; a Youth Development Days 2026 event hierarchy), but **must not** be
  reproduced in design previews.
- No real phone numbers, emails, student IDs, supplier tax information,
  credentials, private resource identifiers, or personal records may appear in
  any preview. All preview data is sanitized and invented for illustration and
  must be labeled as such.
- No testimonials, benchmarks, pricing, or adoption claims exist. Do not
  fabricate them.

## Product Principles

1. **Custody over convenience.** When a visual simplification would blur who
   holds what, the simplification loses.
2. **Truthful unknowns.** Missing data reads as "Not recorded" / "Not assessed",
   never as zero, never invented.
3. **Authority is visible.** Administrator, Director, committee staff, and
   System Owner authority must be distinguishable on screen.
4. **Public is calmer and narrower.** Public portals carry less density and
   strictly less information than internal workspaces.
5. **Plain language at the edge.** Internal enums stay internal; the interface
   speaks the operator's language.

## Accessibility & Inclusion

Required, not aspirational: keyboard operation, visible focus, no keyboard trap,
accessible dialog/drawer semantics, no color-only status, sufficient contrast,
200% zoom, adequate touch targets, `prefers-reduced-motion` support, and no
horizontal page overflow at 320 px.

Acceptance widths: 320, 375, 414, 768, 1024, 1440 CSS px (this task) plus the
repository's established 390, 820, 1366 acceptance widths and 200% zoom.
