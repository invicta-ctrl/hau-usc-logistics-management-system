# FI-10 — Accounts, Staff Directory, and Activity History Frontend Integration

STATUS: ACCEPTED_FOR_IMPLEMENTATION
DATE: 2026-08-26
PROGRAM: HAU-USC Logistics FI-04 → FI-17 R1
SLICE: FI-10
TASK-BOUND ADOPTION: Earl FI09-FI17-SOL-COGNEE-2026-08-26 attachment expressly accepts this faithful bounded extraction and authorizes FI-10 execution by the single canonical Terra writer.

## INTENT

SOFTWARE_FEATURE + TESTING

## MODE

EXECUTE

## OBJECTIVE

Integrate only the already-designed Accounts and access, Staff directory, and Activity portions of the Administration surface into the authenticated administration route with existing supported read-only access-admin data. Render the same bounded FI-10 visual composition through trusted A4 Preview Index using visibly synthetic, sanitized deterministic data and zero protected traffic.

## TARGET

- src/frontend/app/AppRouteRenderer.tsx
- src/frontend/app/AdministrationRoute.tsx
- src/frontend/integration/backend.ts
- src/frontend/preview/index/PreviewInspectionRoute.tsx
- src/frontend/preview/index/registry.ts
- Direct focused FI-10 unit and bounded Preview Index behavior coverage
- Required current-chain records

## AUTHORITATIVE SOURCES

1. Earl FI09-FI17-SOL-COGNEE-2026-08-26 owner attachment and its FI-10/privacy/universal-floor sections.
2. Project policy, CURRENT.md, CURRENT_TASK.md, and CURRENT_HANDOFF.md.
3. Live authenticated Figma Make Version 44 administration composition recorded by Sol; it is visual authority, while repository data contracts and authorization remain functional authority.
4. Existing authenticated Worker contracts: POST /api/admin/access/directory, POST /api/admin/staff-directory, and POST /api/admin/staff-account-activity-history.
5. Existing route authorization, frontend adapter patterns, Preview Index boundary, and applicable tests.

## IN SCOPE

- Render an Administration route only after the existing authenticated router and server-derived access.admin path admit it; do not alter its authorization.
- Expose only the three FI-10 tabs: Accounts and access, Staff directory, and Activity. Do not expose Reference administration, Link registry, Brand and media, System status, or Events in FI-10 runtime or A4.
- Add a narrow FrontendBackend read-only projection for the three existing endpoints:
  - Account directory uses only supported server-provided display/access/role/status information and never renders raw account IDs.
  - Staff directory preserves the conditional identity exposure defined by the canonical directory contract. Opaque person IDs may be held only in transient application memory to request that selected record activity.
  - Activity requests are scoped to a selected canonical staff record and render only non-sensitive supported fields such as occurrence time, event type, action, link/assignment state, and effective-window information. Raw account IDs, correlation IDs, account-access snapshots, and opaque IDs are not rendered.
- Preserve person/account distinction, supplied role and status truth, approval lifecycle framing, directory privacy, read-only/append-only activity semantics, archive/history behavior, and profile/account state.
- Replace or disable the fixture synthetic save/apply controls in the integrated surface. The FI-10 UI is read-only unless a supported safe contract proves otherwise; no mutation is in this packet.
- Give authenticated runtime loading, empty, error/unavailable, denied, and selected-record activity states. Present unsupported or unavailable facts as a truthful designed gap.
- Render A4 Preview Index with the same FI-10 module in explicit inspection mode, visibly labeled as sanitized synthetic data, with no Session, capability, protected read, protected mutation, export, or evidence behavior.
- Add focused unit and behavior coverage for adapter projection, tab restriction, sanitized preview, selected-record activity behavior, privacy suppression, responsive layout, keyboard/focus, and zero protected A4 traffic.

## CONTRACT AND PRIVACY INVARIANTS

- The Worker remains the sole authority for authentication, session, access.admin, and data access. UI visibility is never authorization.
- POST /api/admin/access/directory is access-admin-gated. The frontend must not use its raw account ID as visible content.
- POST /api/admin/staff-directory conditionally exposes business identity only for an authoritative active single link; the frontend must not infer identity, role, assignment, approval, contact, or status absent from its response.
- POST /api/admin/staff-account-activity-history is read-only but contains raw account/correlation fields; the frontend adapter must deliberately omit them from its projected display model and DOM.
- Do not render or log email, birthday, contact, raw roster identity, raw account/person/correlation identifier, account-access snapshot, fabricated assignment/relationship/approval, or unsanitized history.
- No copy-all, bulk protected-data export, print-all, or roster screenshot convenience is authorized.
- Activity is append-only/read-only; archival presentation never deletes or hides immutable operational history.
- A4 local inspection is permitted only at trusted http://127.0.0.1:4173 after explicit Preview Index action. It sends no protected request, creates no session/capability, and cannot cross into Playwright artifacts, generated output, Playground, or Production.

## OUT OF SCOPE

- Backend/Worker/service, API contracts, session/authentication, authorization/capabilities/permissions, D1/R2, schemas, migrations, provider state, production data, Figma/Make writes, Playground, Production, deployment, and main.
- All account/staff/activity mutations, real save/apply/rollback behavior, staff-roster import, exports, prints, or convenience capture.
- FI-11 Reference administration, Link registry, Brand and media, System status, Events, and every later FI slice.
- .ai-bridge/, generated artifacts, and a closure receipt before Sol accepts the candidate.

## ACCEPTANCE CRITERIA

1. Authenticated administration renders FI-10 three tabs inside the existing authenticated shell and preserves the existing server-derived access.admin boundary.
2. Runtime uses only the three supported read-only contracts and correctly represents loading, empty, denied, unavailable/error, and selected-record activity states without fabricated data.
3. Accounts, directory, and activity views never render raw account/person/correlation IDs, account-access snapshots, emails, birthdays, contacts, or unsupported identity/role/assignment/approval facts.
4. The Activity tab stays a truthful selection-required or data-gap state until a canonical directory record has been selected, then shows only approved display fields from the read-only response.
5. A4 Preview Index renders the same bounded module in visibly synthetic sanitized inspection mode and creates zero protected traffic or session/capability state.
6. Only FI-10 tabs are exposed in runtime/A4; FI-11 tabs are absent.
7. Responsive, keyboard, focus-visible, semantic heading/control, contrast, loading/empty/denied/error, and overflow behavior meet the continuation acceptance floor at 320/390/768/1024/1440.
8. Focused tests, bounded exact-4173 Preview Index checks, build, dist verification, continuation and handoff verification, diff check, and complete logical review pass before Sol final acceptance.

## VERIFICATION

- Keep the healthy canonical 127.0.0.1:4173 supervisor running; use HMR and do not restart it without a proved failure.
- Run focused adapter/behavior tests and bounded serial exact-4173 Preview Index checks at 320, 390, 768, 1024, and 1440.
- Exercise the three tabs, selected-record Activity state, empty/denied/unavailable states, keyboard and visible focus, responsive/no-overflow behavior, console, and protected-request capture.
- Run npm.cmd run build, npm.cmd run verify:dist, npm.cmd run check:continuation, npm.cmd run handoff:verify, git diff --check, and one complete logical-diff review. Do not run unrelated large suites without an invalidator.

## STOP CONDITIONS

- A required change would modify backend, Worker, authentication, authorization, permissions, contract, schema, migration, provider, Figma, Playground, Production, deployment, or data.
- A runtime adapter cannot prevent sensitive/raw identity and correlation fields from rendering.
- A4 creates protected traffic or cannot remain isolated/sanitized.
- An active writer conflict, unknown tracked work, source/contract contradiction, or unresolved privacy/auth ambiguity cannot be safely preserved and resolved in this packet.

## OWNER ACCEPTANCE

This packet is accepted for implementation by Earl FI09-FI17-SOL-COGNEE-2026-08-26 owner attachment. It is a faithful bounded extraction of existing FI-10 design, privacy, route, A4, and contract authority; it does not authorize a backend, identity, permissions, provider, or FI-11 feature.
