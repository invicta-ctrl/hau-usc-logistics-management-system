# FI-06 — Internal Request Hub frontend integration packet

STATUS: ACCEPTED FOR THE BOUNDED FI-06 SLICE
DATE: 2026-08-24
OWNER AUTHORITY: Earl's continuing FI-04→FI-17 directive; R1 §13; R1-A2 §17; accepted A3 and A4 amendments
IMPLEMENTATION WRITER: TERRA_MAX:/root/fi05_inventory_writer

## Objective

Integrate the Make v44 Request Center as the DOL-only Internal Request Hub.
It is a read/review workspace, distinct from the existing requester-facing
External Request Center, and preserves the Worker as authority for scope,
capabilities, request state, inventory truth, review legality, idempotency, and
concurrency.

## In scope

- Require both `view.internal` and `view.request` for the internal route.
- Read the existing same-origin credentialed `GET /api/bootstrap/request`
  `bootstrap-module` v2 projection, including requests, lines, events,
  inventory projection, pagination, and scope revision.
- Render the v44 dense queue, search/filter/pagination, fixed or fullscreen
  inspector, lifecycle/context, loading/empty/error/denied/stale states, and
  dark/light/reduced-motion responsive presentation.
- Submit only the established CSRF-protected `POST /api/reviewRequest` contract
  with a stable logical `clientRequestId`, every reviewable line explicitly
  routed, no double submit, truthful receipt/conflict/error/denial, and a
  refetch after server confirmation.
- Mount the same component in A4 Preview Index using a labelled deterministic
  fixture and local-only action demonstration with no protected read/mutation.

## Invariants and exclusions

The browser does not derive or deduct stock/reservations, create a Release
action, supply identity/scope/capabilities/quantities, widen authorization, or
simulate requester success. Route choice is presentation filtering only; the
server revalidates permitted routes, state, idempotency, and concurrency.
Backend/Worker/domain/auth semantics, D1/R2/schema/migrations, the unresolved
DOL-requester/OTP gap, packages, Figma/Make writes, providers, Playground,
Production, main, `.ai-bridge/`, and FI-07+ are excluded.

## Acceptance evidence

Focused regression proves non-DOL direct denial and three-context routing.
Units and E2E cover strict DTO mapping/no invented values, authenticated
bootstrap/review, CSRF, server receipt/refetch, denied/error/stale/empty/conflict
and double-submit states, per-line validation, focus restoration/trapping,
exact-4173 preview no-network containment, and 320/390/768/1024/1440 behavior.
Run build, deterministic artifact verification, formatting, governance,
continuation, handoff, and diff checks before Sol review.
