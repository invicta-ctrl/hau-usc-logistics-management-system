# Impeccable v2 — Surface Matrix

v2 preserves v1's surface coverage exactly: **32 surfaces, 53 surface/state
combinations**. No surface was dropped and none was invented.

Route facts are unchanged from `docs/design/IMPECCABLE_SURFACE_MATRIX.md`, which
remains the authoritative derivation with its source citations
(`src/visual/workspace-routes.js`, `src/app/bootstrap-contract.js`,
`src/domain/constants.js`, `src/domain/permissions.js`,
`src/domain/presentation-labels.js`). This document records only what **v2
changes** per surface.

> **No Reports surface.** `src/features/reports/` exists with no bootstrap
> module and no view template, so it still gets no preview surface. This is a
> deliberate omission, not an oversight.

## Legend

**Deep** — full fidelity plus the full state set.
**Solid** — full fidelity, populated plus one or two salient states.

---

## Public and pre-authentication

| # | Surface | Tier | v2 change |
|---|---|---|---|
| 1 | `public.landing` | Solid | Full-width horizontal **lead action** with anchor wash and display-serif title; remaining three in a 3-column row. v1 gave four identical cards, so nothing told a first-time visitor where to start |
| 2 | `public.signin` | **Deep** | Larger display heading; theme toggle in the public bar; elevated auth card |
| 3 | `public.register` | Solid | Same auth-card treatment |
| 4 | `public.verify` | Solid | Same |
| 5 | `public.application` | Solid | Larger heading; stepper unchanged |
| 6 | `public.application-status` | Solid | Timeline on a raised surface |
| 7 | `public.request-intake` | **Deep** | Larger heading; fieldsets on raised surfaces |
| 8 | `public.request-tracking` | **Deep** | Receipt on a raised surface; success state unchanged in content |
| 9 | `public.lending-intake` | Solid | Same form treatment |
| 10 | `public.lending-tracking` | Solid | Timeline treatment |
| 11 | `public.policy` | Solid | Raised surface, 24px checkbox target |

## Authenticated shared shell

| # | Surface | Tier | v2 change |
|---|---|---|---|
| 12 | `shell` | **Deep** | Rail re-toned to sit between ground and surface; gold edge hairline; topbar elevated |
| 13 | `shell.command` | **Deep** | Dialog entry motion |
| 14 | `shell.notifications` | Solid | Menu disclosure motion |
| 15 | `shell.account` | Solid | Menu disclosure motion |
| 16 | `shell.scope` | **Deep** | Unchanged in content |
| 17 | Light / dark themes | **Deep** | **New animated sun/moon product toggle**; dark mode depth re-ordered |
| 18 | Collapsed rail | **Deep** | Animated `scaleY` active indicator |
| 19 | Tablet layout | **Deep** | Overview rails collapse 3 → 2 with the lead rail spanning |
| 20 | Mobile drawer / tab bar | **Deep** | Tab bar rebuilt: oxblood active fill, gold glyph, `--elev-3`, 52px targets |

## Operations overview and role workspaces

| # | Surface | Tier | v2 change |
|---|---|---|---|
| 21 | `admin.overview` | **Deep** | Attention band is now the page anchor — elevated, display-serif 44px numerals, alert-toned urgent cell; asymmetric rails; editorial section rule |
| 22 | `director.overview` | Solid | Same system |
| 23 | `food.overview` | Solid | Same system |
| 24 | `inventory.overview` | Solid | Same system |
| 25 | `materials.overview` | Solid | Same system |
| 26 | `owner.health` | Solid | Raised surface; truthful unavailable states unchanged |

## Core operational modules

| # | Surface | Tier | v2 change |
|---|---|---|---|
| 27 | `request.queue` / detail | **Deep** | Queue is a raised working surface; selected row grows an oxblood spine that ties it to the detail pane; detail head carries an anchor wash and serif title; split rebalanced to 1.32 / 0.68 so titles and dates stop wrapping |
| 28 | `lending.queue` | **Deep** | Same queue treatment; `Return by` no longer wraps |
| 28 | `lending.detail` | **Deep** | Block titles promoted to `h2.block-title` |
| 29 | `release.desk` | **Deep** | Progress meters animate `scaleX` on state change |
| 30 | `restocking.queue` | Solid | Same meter treatment |
| 31 | `procurement.board` | Solid | Raised queue surface |
| 32 | `inventory.catalog` | **Deep** | Raised queue surface; exception rows keep chip semantics |
| 33 | `inventory.item` | **Deep** | Ledger on a raised surface; block titles promoted |
| 34 | `events.series` | Solid | Readiness meters animate |
| 35 | `audit.activity` | Solid | Raised surface |

## Administration

| # | Surface | Tier | v2 change |
|---|---|---|---|
| 36 | `admin.access` | Solid | Raised governed table |
| 37 | `admin.directory` | Solid | Raised surface |
| 38 | `admin.reference` | Solid | Raised queue surface |
| 39 | `admin.links` | Solid | Raised queue surface |
| 40 | `admin.brand` | Solid | Raised queue surface |
| 41 | `account.profile` | Solid | Block titles promoted |
| 42 | `owner.health` | Solid | Shared with #26 — one surface in source |

## State coverage

Unchanged from v1 and re-verified in v2: loading, empty, populated, validation
error, service unavailable, access denied, stale/revision conflict, success,
partial completion, and mobile narrow. Long text and large quantities are
covered by the existing hardening (`overflow-wrap: anywhere`, `min-width: 0`,
tabular numerals, nowrap date cells).

## Column priority

Unchanged, and re-verified at every width: `col-p3` (reference ids, secondary
metadata) drops at 767px, `col-p2` at 560px. **Status and quantity survive every
breakpoint.**

A latent v1 bug was fixed here: `queueTable` emitted two separate `class`
attributes when a column had both `priority` and `numeric`, so the browser
dropped the second and numeric alignment was silently lost on those columns.
Classes are now built as one list.
