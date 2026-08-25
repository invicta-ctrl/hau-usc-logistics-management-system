# FI-08 — Release Desk Frontend Integration

STATUS: ACCEPTED_FOR_IMPLEMENTATION
DATE: 2026-08-25
PROGRAM: HAU-USC Logistics FI-04 → FI-17 R1
SLICE: FI-08
TASK-BOUND ADOPTION: Earl's 2026-08-25 `TOKEN-OPT-001-A8 GOVERNANCE CORRECTION + FI-08 IMMEDIATE EXECUTION AND PREVIEW` instruction expressly accepts this faithful bounded extraction and authorizes immediate execution by the single canonical Terra writer.

## INTENT

SOFTWARE_FEATURE

## MODE

EXECUTE

## OBJECTIVE

Integrate the already-present Make-v44-parity Release Desk UI into the existing authenticated route and the accepted A4 local Preview Index inspection path. The slice preserves the existing deterministic synthetic Release Desk states and interactions; it does not introduce a real release, custody, ledger, or backend mutation binding.

## TARGET

- The existing authenticated `release` route in `src/frontend/app/AppRouteRenderer.tsx`.
- The trusted local A4 Preview Index inspection route in `src/frontend/preview/index/PreviewInspectionRoute.tsx`.
- The `release` entry in `src/frontend/preview/index/registry.ts`.
- The existing `src/frontend/app/ReleaseDeskRoute.tsx` presentation component, only if a direct live-Make comparison identifies a bounded fidelity defect.

## AUTHORITATIVE SOURCES

1. Earl's 2026-08-25 owner instruction accepting this bounded FI-08 packet and execution transition.
2. Accepted A4 local Preview Index inspection amendment: `.codex/specs/accepted/2026-08-24-fi04-fi17-r1-a4-preview-index-local-inspection-no-login-module-browsing.md`.
3. `.agents/PROJECT_POLICY.md`: live Figma Make is visual authority; repository contracts, security, and accepted scope remain functional truth.
4. `output/design/make-provider-export-v44/src/app/ReleaseDeskRoute.tsx` and `output/design/make-provider-export-v44/src/app/AppRouteRenderer.tsx` as preserved Make-v44 composition and route-wiring evidence, compared to the accessible live Make authority before UI changes.
5. Existing frontend route, Preview Index, and test contracts. Runtime authorization, data, and release-domain behavior remain repository authority.

## IN SCOPE

- Wire the existing `ReleaseDeskRoute` into the authenticated `release` branch of `AppRouteRenderer` without changing the existing session, authenticated-shell, or capability gates.
- Render that same Release Desk component from the A4 `PreviewInspectionRoute` only through its established trusted local inspection context.
- Update the Preview Index `release` registry entry from a visual placeholder to a truthful accepted real-module inspection entry while retaining `access: AUTHENTICATED` and its visual-only/no-active-backend truth.
- Preserve deterministic synthetic queue, detail, correction, confirmation, loading, empty, stale, denied, unavailable, validation, focus-restoration, Escape, keyboard, and responsive presentation behavior already provided by `ReleaseDeskRoute`.
- Preserve the Make-v44 visual composition, hierarchy, state labels, responsive table/card behavior, focus visibility, and semantic controls. Make a narrowly scoped `ReleaseDeskRoute` change only when direct live-Make comparison proves a defect within this slice.
- Add focused tests proving authenticated rendering, A4 local fixture rendering, truthful registry metadata, and the absence of protected reads or mutations in local Preview Index inspection.

## EXISTING RUNTIME AND PREVIEW CONTRACT

- The authenticated route remains reachable only through the existing `session && isAuthRoute(route)` path and existing runtime authorization/capability controls. This slice does not create a session, role, capability, or alternate auth path.
- The current Release Desk UI is deterministic synthetic presentation. It must remain clearly labeled and must not claim a real release receipt, ledger write, audit write, or backend binding.
- A4 Preview Index inspection is allowed only at the trusted local development address `http://127.0.0.1:4173/` after an explicit Preview Index action. It renders fixtures/presentation only and creates no Session, grants no capability, bypasses no Worker authorization, and sends no protected backend read, mutation, or evidence traffic.

## SECURITY AND DATA INVARIANTS

- Normal authenticated navigation continues to enforce the existing session and capability gates.
- UI visibility or local fixture interaction is never authorization.
- No backend/API/D1/R2/schema/migration/auth/permission/ledger/release-domain semantics change is permitted.
- No real release, handoff, correction, custody, inventory, audit, or evidence action may be simulated as a backend write.
- The Preview Index must retain its explicit local-inspection banner/context and no protected request/mutation behavior.

## OUT OF SCOPE

- Backend/API/Worker/D1/R2/schema/migration/authentication/authorization/permissions/CSRF/session/ledger/domain semantics.
- New runtime release endpoints, real release mutation binding, provider changes, Figma writes, Playground/Production/deployment/main changes, or production data.
- `.ai-bridge/`, which remains excluded and preserved.
- Replacing the existing frontend architecture or adding a parallel Release Desk implementation.

## ACCEPTANCE CRITERIA

1. Authenticated `release` renders the existing Release Desk inside the existing authenticated shell and remains subject to normal session/capability routing.
2. Local Preview Index `release` renders the same deterministic component with A4 local-inspection framing and zero protected reads/mutations.
3. The registry reports Release Desk truthfully as accepted for frontend inspection without downgrading authenticated access or claiming a real backend binding.
4. The component retains keyboard operation, focus visibility/restoration, Escape behavior, semantic controls, responsive behavior, and all deterministic state variants.
5. Focused FI-08 tests, Preview Index checks, frontend build, `git diff --check`, and complete logical-diff review pass. Console inspection introduces no new fatal errors.

## VERIFICATION

- Verify the canonical local preview at `http://127.0.0.1:4173/` is running and reaches the Preview Index Release Desk route before deep implementation.
- Run focused FI-08 unit tests and applicable Preview Index foundation/targeted browser assertions.
- Check keyboard/focus behavior, semantic controls, responsive rendering at 320, 390, 768, 1024, and 1440 widths where practical, console output, and A4 zero-protected-request/mutation network evidence.
- Run the required frontend build and bounded regression checks; do not rerun unchanged expensive suites without an invalidator.

## STOP CONDITIONS

- A required change would alter backend, auth, authorization, permissions, release/inventory/ledger semantics, provider state, migration, deployment, or production data.
- The accepted A4 local-inspection isolation cannot be maintained.
- Live Make authority cannot be inspected through its documented authenticated route after the required recovery path.
- Unknown tracked work, a conflicting writer lock, or a material source/design contradiction cannot be preserved and resolved within this bounded scope.

## OWNER ACCEPTANCE

This packet is accepted for implementation by Earl's 2026-08-25 owner instruction. It is a bounded extraction of already accepted frontend and A4 preview authority; it does not independently authorize a broader Release Desk backend feature.
