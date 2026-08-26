# FI-11 — References, Links, Brand, Events, and Owner Health Frontend Integration

STATUS: ACCEPTED__IMPLEMENTED__SOL_ACCEPTED__CLOSED
DATE: 2026-08-26
PROGRAM: HAU-USC Logistics FI-04 → FI-17 R1
SLICE: FI-11
TASK-BOUND ADOPTION: Earl FI09-FI17-SOL-COGNEE-2026-08-26 expressly accepts this faithful bounded extraction and authorizes FI-11 execution by the single canonical Terra writer.

## INTENT

SOFTWARE_FEATURE + TESTING

## MODE

EXECUTE

## OBJECTIVE

Integrate only the existing Reference Administration, Link Registry, Brand/media references, Events/reference data, and Owner/system health/readiness portions of the administrative frontend. Preserve capability boundaries and repository-owned truth. Render the same bounded module through trusted A4 Preview Index with explicit sanitized deterministic inspection data and zero protected traffic.

## TARGET

- src/frontend/app/AppRouteRenderer.tsx
- src/frontend/app/AdministrationRoute.tsx
- src/frontend/app/SupplyRoutes.tsx only if its existing Events mode is the truthful accepted FI-11 visual surface
- src/frontend/integration/backend.ts
- src/frontend/preview/index/PreviewInspectionRoute.tsx
- src/frontend/preview/index/registry.ts
- Direct focused FI-11 unit and bounded Preview Index behavior coverage
- Required current-chain records

## AUTHORITATIVE SOURCES

1. Earl FI09-FI17-SOL-COGNEE-2026-08-26 owner attachment and its FI-11/universal-floor sections.
2. TOKEN-OPT-001-A8, project policy, CURRENT.md, CURRENT_TASK.md, CURRENT_HANDOFF.md, and active A3/A4 Preview Index authority.
3. Live authenticated Figma Make Version 44 composition recorded by Sol; it is visual authority, while current repository data contracts and authorization remain functional authority.
4. Existing Worker contracts: read-only reference-link list/get/history under reference.manage, brand-asset list under brand.manage, POST /api/getEventManagement under event.manage, and public technical /api/health and /api/readiness responses projected only for system.admin presentation.
5. Existing route authorization, frontend adapter patterns, Preview Index boundary, and applicable focused tests.

## IN SCOPE

- Render Reference administration, Link registry, Brand and media, Events, and System status only after the existing authenticated router and each server-derived capability boundary admit their respective surface; do not alter route authorization or infer cross-domain capability from administration visibility.
- Preserve distinct reference.manage, brand.manage, event.manage, and system.admin presentation gates. A denied or unavailable capability receives a truthful role-appropriate state, never an invented fallback or a broader data request.
- Add narrow read-only frontend projections only for existing supported contracts:
  - Reference links may render supported plain-language label, governed destination, link type, audience, status, verification/sync state, and safe timestamps. Omit domain IDs, correlation IDs, version internals, and unneeded history internals.
  - Brand/media may render public slot label/path and supported published metadata. Omit R2 keys, hashes, actor account IDs, correlation IDs, versions, storage internals, and provider identifiers.
  - Events may render minimal supported series/day/activity presentation fields. Omit correlation, source/supersedes references, actor IDs, and internal linkage IDs.
  - Owner/system status may render a redacted user-safe current response summary only for system.admin. It must distinguish technical response from user-facing readiness and never claim healthy, synced, ready, connected, or up to date without current supporting response evidence.
- Preserve Worker/R2 authority and existing media behavior. Do not bind any mutation, upload, import, repair, sync, save, publish, delete, event-management, or media-management action.
- Use an existing designed Events mode only when its supported visual-only behavior and route capability match this packet; otherwise render a truthful unsupported/unavailable state rather than fabricate event data.
- Give authenticated runtime loading, empty, error/unavailable, denied, reference/media failure, and safe technical-status states.
- Render A4 Preview Index with clearly labeled sanitized deterministic fixture data and an explicit non-live health/readiness statement. A4 creates no session or capability, calls no protected or public API, and makes no mutation.
- Add focused unit and behavior coverage for capability segregation/denial, safe projections, no raw internal/provider data in rendered output, failure states, A4 isolation, responsive layout, keyboard/focus, and zero protected A4 traffic.

## CONTRACT, PRIVACY, AND TRUTH INVARIANTS

- The Worker remains the sole authority for authentication, session, capability, data access, reference policy, media behavior, and health/readiness source data. UI visibility is never authorization.
- No capability is inferred from access.admin or another administration tab. Reference, brand, event, and owner-status data remain independently gated.
- Do not render or log raw provider/Sheet/Drive IDs, R2 keys, hashes, internal domain IDs, account/person/actor IDs, correlation IDs, version/storage internals, private contacts, stack traces, or internal-only diagnostics.
- Never fabricate link destination, verification state, event record, media record, provider state, health, synchronization, readiness, connection, currency, identity, role, or history.
- R2 remains authoritative for governed media where the repository contract says so. The frontend does not reclassify, upload, rewrite, or replace it.
- A4 local inspection is permitted only at trusted http://127.0.0.1:4173 after explicit Preview Index action. It sends no protected request, public technical request, mutation, export, or evidence behavior and cannot cross into Playground or Production.

## OUT OF SCOPE

- Backend/Worker/service, API contracts, session/authentication, authorization/capabilities/permissions, D1/R2, schemas, migrations, provider state, production data, Figma/Make writes, Playground, Production, deployment, and main.
- All reference/link/brand/event/system mutations, provider synchronization, media upload, media repair, event management, export, print, or convenience capture.
- Advertisements and advertisement.manage, account/directory/activity, Release Desk, supply-operation scope except a pre-existing truthful visual-only Events surface, FI-12+, .ai-bridge/, generated artifacts, and a closure receipt before Sol accepts the candidate.

## ACCEPTANCE CRITERIA

1. Authenticated frontend exposes the bounded FI-11 surfaces only through their existing independent capability boundaries and preserves denial states without a capability crossover.
2. Runtime uses only supported read-only contracts and truthfully represents loading, empty, denied, unavailable, reference/media failure, and status-uncertainty states without invented operational truth.
3. No raw provider/Sheet/Drive/R2/domain/account/person/actor/correlation/version/storage/internal linkage ID, private contact, stack trace, or internal diagnostic renders in runtime or A4 DOM.
4. User-facing link labels/destinations are plain-language and role-appropriate; R2 media authority and existing media behavior are preserved.
5. Owner/system status is gated separately at system.admin and clearly separates a redacted technical response from user-facing readiness; unsupported or unavailable data stays explicit.
6. A4 renders the same bounded module in visibly synthetic sanitized inspection mode, makes zero protected/public API traffic, creates no session/capability state, and makes no mutation.
7. Responsive, keyboard, focus-visible, semantic heading/control, contrast, loading/empty/denied/error, and overflow behavior meet the continuation acceptance floor at 320/390/768/1024/1440.
8. Focused tests, bounded exact-4173 Preview Index checks, live Make parity evidence, Hallmark and Impeccable bounded audits, build, dist verification, continuation/handoff verification, diff check, and complete logical review pass before Sol final acceptance.

## VERIFICATION

- Keep the healthy canonical 127.0.0.1:4173 supervisor running; use HMR and do not restart it without a proved failure.
- Run focused adapter/behavior tests and bounded serial exact-4173 Preview Index checks at 320, 390, 768, 1024, and 1440.
- Exercise each permitted and denied tab/surface, reference/media failures, status uncertainty, keyboard and visible focus, responsive/no-overflow behavior, console, and protected-request capture.
- Run npm.cmd run build, npm.cmd run verify:dist, npm.cmd run check:continuation, npm.cmd run handoff:verify, git diff --check, and one complete logical-diff review. Do not run unrelated large suites without an invalidator.

## STOP CONDITIONS

- A required change would modify backend, Worker, authentication, authorization, permissions, contract, schema, migration, R2/provider, Figma, Playground, Production, deployment, or data.
- A runtime adapter cannot prevent raw/private/internal fields from rendering.
- A4 creates protected/public traffic or cannot remain isolated/sanitized.
- An existing Events surface does not faithfully map to the supported event contract and cannot remain a clearly disclosed visual-only presentation.
- An active writer conflict, unknown tracked work, source/contract contradiction, or unresolved privacy/auth ambiguity cannot be safely preserved and resolved in this packet.

## OWNER ACCEPTANCE

This packet is accepted for implementation by Earl FI09-FI17-SOL-COGNEE-2026-08-26. It is a faithful bounded extraction of existing FI-11 design, route, privacy, capability, R2, status, A3, and A4 authority; it does not authorize a backend, authorization, provider, media, event, or FI-12 feature.

## CLOSURE

FI-11 was implemented and accepted by Sol on 2026-08-26. Verification and preserved-boundary evidence are recorded in `.codex/FI11_GOVERNED_REFERENCE_SURFACES_RECEIPT.md`. The next step remains owner-authorized FI-12 only; this packet does not authorize it.
