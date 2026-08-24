# FI-05 — Inventory frontend integration packet

STATUS: ACCEPTED FOR THE BOUNDED FI-05 SLICE
DATE: 2026-08-24
OWNER AUTHORITY: Earl's continuing FI-04→FI-17 directive; R1 one-shot §12; R1-A2 reconciliation; accepted A3 and A4 amendments
IMPLEMENTATION WRITER: TERRA_MAX:/root/fi05_inventory_writer

## Objective

Integrate the current Inventory surface into the authenticated DOL shell while
preserving the existing `bootstrap-module` contract, server authority, and
ledger-derived inventory truth. The local Preview Index inspection route may
render a clearly labelled deterministic fixture, but may not read or mutate a
protected service.

## In scope

- Inventory list/table and mobile cards, search/filter, item inspector, focus
  restoration, light/dark and reduced-motion presentation.
- Truthful loading, empty, error, denied, stale, and degraded presentation.
- A strict same-origin authenticated `GET /api/bootstrap/inventory` adapter
  using `credentials: include`, with no browser-supplied identity or capability.
- Projection only of the established inventory DTO: ledger-derived `onHand`,
  `reserved`, `availableToPromise`, classification, lending, condition, and
  maintenance fields.
- A separate deterministic preview adapter in the existing A4 inspection
  boundary, with no protected request or mutation.
- Registry and actual Preview Index rendering updated together.

## Invariants and exclusions

The frontend does not compute or alter stock, reservations, availability,
classification, condition, maintenance, or authorization. It does not invent
inventory values in real runtime, expose a fake session/capability, or add a
write action. Backend/Worker/auth semantics, schema/migrations, D1/R2,
Playground/Production, main, provider/Figma, packages, and `.ai-bridge/` are
out of scope.

## Acceptance evidence

Focused adapter/component and browser coverage must prove authenticated read,
denial, preview no-network containment, state presentations, inspector keyboard
restoration, and responsive behavior at 320/390/768/1024/1440. Reuse the
healthy 4173 supervisor, then run the bounded build, deterministic artifact,
formatting, governance, continuation, handoff, and diff checks required by the
active project policy. A Sol review is required before commit or push.
