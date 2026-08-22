---
schema_version: 1
status: active
scope: hau-usc-logistics-frontend
authority: canonical
branch: frontend-design-integration
visual_authority: live-figma-make-rP9W9MQlZkyQrUx38TVsFS
functional_authority: repository-server-worker-auth-contracts
last_reviewed: 2026-08-22
---

# HAU-USC Logistics frontend design authority

The authenticated live Figma Make file is the current visual, interaction, motion, and responsive authority. The Figma Design file is documentation and historical reference. Repository server, Worker, auth, domain, privacy, D1/R2, audit, and provider contracts are the sole functional authority.

## Current implemented scope

FI-00 through FI-03 are implemented in `src/frontend/`:

- institutional design foundation and public landing;
- Make hero poster, scrims, entrance motion, and reduced-motion behavior;
- public navigation, Request, Lending, receipt, and tracking presentation;
- sign-in, session/bootstrap, logout, starter activation, email verification, account application, private status-token lookup, and withdrawal;
- responsive layouts at 320, 390, 768, 1024, and 1440 CSS pixels, plus 200% effective reflow;
- light/dark presentation, keyboard focus, semantic states, and no horizontal overflow.

Authenticated operational workspaces begin in FI-04 and are intentionally not exposed by this cutover. No design artifact may fabricate authorization, identifiers, status, inventory, approval, or provider state.

## Visual system

- Oxblood provides institutional structure; warm gold marks focus and primary action.
- Warm paper and restrained glass carry public and authentication surfaces.
- Newsreader is the editorial hero face; Bricolage Grotesque is the display face; IBM Plex Sans and Mono carry operational copy and labels.
- Official USC and Department of Logistics identity follows the live Make ordering and compact mobile reduction.
- The public landing preserves the exact Make hierarchy, poster crop, two-gradient readability model, and staggered entrance.

## Implementation boundaries

- Frontend transport is same-origin and cookie-based.
- CSRF remains in memory and is sent only where the server contract requires it.
- Private verification receipts and status tokens remain caller-scoped and are never placed in URLs or persistent browser storage.
- Receipts and tracking views are constructed by the frontend from server-confirmed values; the client never invents record identifiers, tracking codes, status, or lifecycle history.
- Production deployment, backend changes, Figma writes, provider changes, and schema or migration changes require separate accepted authority.

Recovery and source-delivery evidence lives under `docs/frontend/`. Historical design research under `docs/design/` is reference-only and cannot override this file, live Make, an accepted specification, or repository functional contracts.
