# FI-09 — Restocking, Procurement, and Receiving Frontend Integration

STATUS: ACCEPTED_FOR_IMPLEMENTATION
DATE: 2026-08-26
PROGRAM: HAU-USC Logistics FI-04 → FI-17 R1
SLICE: FI-09
TASK-BOUND ADOPTION: Earl's FI09-FI17-SOL-COGNEE-2026-08-26 attachment expressly accepts this faithful bounded extraction and authorizes FI-09 execution by the single canonical Terra writer.

## INTENT

SOFTWARE_FEATURE

## MODE

EXECUTE

## OBJECTIVE

Integrate the already-present Make-v44-parity SupplyRoutes component into the existing authenticated restocking and procurement routes and the accepted A4 local Preview Index inspection path. The local module remains deterministic synthetic presentation; it does not introduce a real procurement, receiving, inventory, ledger, or backend binding.

## TARGET

- Existing authenticated restocking and procurement branches in src/frontend/app/AppRouteRenderer.tsx.
- Trusted local A4 Preview Index inspection in src/frontend/preview/index/PreviewInspectionRoute.tsx.
- Restocking and procurement entries in src/frontend/preview/index/registry.ts.
- Existing src/frontend/app/SupplyRoutes.tsx only for the smallest semantic, keyboard-focus, or deterministic-preview truth hardening required by this packet.

## AUTHORITATIVE SOURCES

1. Earl's FI09-FI17-SOL-COGNEE-2026-08-26 owner attachment, which authorizes continuous FI-09 through FI-17 execution and this FI-09 start.
2. Live authenticated Figma Make Version 44 inspection recorded by Sol: Restocking and receiving with the REQUEST → CANVASS → DELIVERABLE → RECEIVE → LEDGER rail, restocking queue, and selected PO-2026-0031 receiving detail showing ordered 12, received 6, outstanding 6; Procurement lifecycle with the persistent PRC-2026-0044 revision band, Canvassing, Suppliers, and Deliverables panels, Contracts unavailable, named supplier summaries, and deliverable relationships.
3. .agents/PROJECT_POLICY.md: live Figma Make is visual authority; repository contracts, authorization, data invariants, accessibility, and accepted scope remain functional truth.
4. output/design/make-provider-export-v44/src/app/SupplyRoutes.tsx as preserved Make-v44 composition evidence. At the FI-09 start handshake, the runtime src/frontend/app/SupplyRoutes.tsx was byte-equivalent except for its final newline; this packet permits only the bounded semantic, focus, deterministic-preview, and responsive-equivalent deltas specified below.
5. Existing route, Preview Index, and test contracts. Runtime authorization and supply-domain behavior remain repository authority.

## IN SCOPE

- Wire the existing SupplyRoutes component into authenticated restocking and procurement routes without changing existing session, authenticated-shell, or capability gates.
- Render that same component through the trusted A4 local Preview Index only with the active route supplied as its mode and no protected fetch or request.
- Update both registry entries to truthful ACCEPTED, VISUAL_ONLY, AUTHENTICATED, REAL_MODULE local-module inspection metadata. Their descriptions must explicitly state deterministic synthetic presentation with no protected request or mutation.
- Preserve Make-v44 visual composition, responsive rules, queue/detail panels, restocking rail, PRC-2026-0044 revision band, Canvassing/Suppliers/Deliverables panels, disabled Contracts state, named supplier summaries, and deliverable relationships.
- Make only the smallest required interaction hardening: an accessible task-dialog name, focus entry and containment, Escape close, and exact visible desktop/mobile opener restoration with visible 3px focus treatment retained.
- Keep the Selected record preview state deterministic by selecting the canonical restocking record when needed, without inventing records or data.
- Add focused unit and behavioral Preview Index coverage, including A4 zero-protected-traffic evidence.

## EXISTING RUNTIME AND PREVIEW CONTRACT

- Authenticated restocking remains subject to the existing view.inventory route authorization; authenticated procurement remains subject to the existing view.internal route authorization. This packet creates no session, role, capability, or alternate auth path.
- A4 Preview Index inspection is allowed only at trusted local http://127.0.0.1:4173 after an explicit Preview Index action. It renders deterministic fixtures/presentation only, creates no Session, grants no capability, bypasses no Worker authorization, and sends no protected backend read, mutation, or evidence traffic.
- The local component may be ACCEPTED and REAL_MODULE only as a deterministic local module. Its backend classification remains VISUAL_ONLY until an accepted frontend backend adapter exists.

## SECURITY AND DATA INVARIANTS

- UI visibility or local fixture interaction is never authorization.
- No backend/API/Worker/D1/R2/schema/migration/authentication/authorization/permission/ledger/procurement/receiving domain semantics change is permitted.
- Receiving is cumulative in truth: the selected record displays ordered 12, received 6, and outstanding 6. Prior receipts must never be overwritten.
- Inventory balances cannot be directly edited. No UI interaction may claim a real receiving, procurement, inventory, ledger, audit, supplier, deliverable, or evidence write.
- Preserve synthetic confirmation and no-write language, A4 local-inspection framing, zero protected request/mutation behavior, and visible 3px focus-visible treatment.

## OUT OF SCOPE

- Backend/API/Worker/D1/R2/schema/migration/authentication/authorization/permissions/session/ledger/procurement/receiving/inventory semantics.
- New runtime supply endpoints, real receiving or procurement mutation binding, provider changes, Figma or Make writes, Playground/Production/deployment/main changes, or production data.
- .ai-bridge/, which remains excluded and preserved.
- Generated artifacts and a closure receipt before Sol accepts this candidate.
- FI-10 and later slices.

## ACCEPTANCE CRITERIA

1. Authenticated restocking and procurement render the existing SupplyRoutes module inside the existing authenticated shell and remain subject to their existing route authorization.
2. A4 local Preview Index renders the same deterministic module in the requested mode with zero protected reads or mutations.
3. Registry entries report truthful ACCEPTED / VISUAL_ONLY / AUTHENTICATED / REAL_MODULE status and explicitly disclose deterministic synthetic no-request/no-mutation behavior.
4. Restocking shows PO-2026-0031 with ordered 12, received 6, and outstanding 6; Selected record deterministically selects that canonical record.
5. Procurement retains behavioral Canvassing, Suppliers, and Deliverables panels, persistent selected-record context, and disabled Contracts state.
6. Task dialogs have an accessible name and correct entry-focus, Tab/Shift+Tab containment, Escape, exact desktop/mobile opener restoration, and visible focus treatment.
7. Focused FI-09 tests, exact-4173 Preview Index behavioral checks, frontend build, verify:dist, continuation and handoff checks, git diff --check, and complete logical-diff review pass without restarting the healthy preview.

## VERIFICATION

- Reuse the parent-verified canonical 127.0.0.1:4173 supervisor health only while it remains unchanged; do not restart it.
- Run focused FI-09 unit tests and exact-4173 Preview Index behavioral assertions serially at 320, 390, 768, 1024, and 1440 widths as practical.
- Exercise keyboard entry focus, Tab/Shift+Tab containment, Escape dismissal, and exact desktop/mobile restoration; inspect protected traffic and console.
- Run npm.cmd run build, npm.cmd run verify:dist, npm.cmd run check:continuation, npm.cmd run handoff:verify, git diff --check, and one complete logical-diff review. Do not run unrelated broad suites.

## STOP CONDITIONS

- A required change would alter backend, auth, authorization, permissions, procurement/receiving/inventory/ledger semantics, provider state, migration, deployment, Production, or data.
- A4 local-inspection isolation, Make-v44 visual parity, or existing route authorization cannot be maintained.
- Unknown tracked work, a conflicting writer lock, or a material source/design contradiction cannot be preserved and resolved within this bounded scope.
- Required verification fails after the lock is acquired; preserve the candidate and report it without broadening scope.

## OWNER ACCEPTANCE

This packet is accepted for implementation by Earl's FI09-FI17-SOL-COGNEE-2026-08-26 owner attachment. It is a bounded extraction of current FI-09 frontend and A4 preview authority; it does not independently authorize a supply backend feature.
