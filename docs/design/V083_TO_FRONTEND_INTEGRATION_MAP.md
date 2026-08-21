# v0.8.3 to Frontend Design Integration Map

```text
DOCUMENT_STATUS: COMPLETE
FUNCTIONAL_BASELINE: FINAL_V083_MAIN @ 86553349f5c2ebefaa637c30828c560a301f99ba
PRODUCTION_IDENTITY: frozen f8e63372bc8afcb6d092970b7f9fc9ee72fd3580
VISUAL_BASELINE: DESIGN_BASELINE_2026-08-20-F / Figma Make v39 / retained branch
INTEGRATION_DIRECTION: final-v0.8.3 contracts -> selective visual ports
```

This map is a planning guardrail, not an implementation authorization. It
replaces the historical v0.7.2 functional baseline with final v0.8.3 main and
keeps the branch’s visual assets separate from current product behavior.

## Immutable functional contracts

- Environment and data bindings are selected server-side; browser presentation
  must never retarget an environment or cross Playground/Production resources.
- Session, CSRF, credential-version, expiry, rate-limit, generic-error, and
  revocation behavior remain authoritative. A visual control cannot bypass a
  capability or authorization check.
- Canonical person, explicit account-to-person linkage, assignments, and
  active-access preservation do not infer identity or privilege from names,
  emails, roles, or display text.
- Public Request and Lending flows expose only purpose-limited data; tracking,
  evidence, internal notes, rosters, and privileged data remain protected.
- Activity History remains append-only and role-scoped; the final product’s
  schema32/0031+0032, foreign-key, and recovery receipts are not frontend work.
- The secure eight-digit verification lifecycle, resend invalidation, and
  provider boundary are behavior/security contracts, not visual styling scope.
- Status, validation, pagination, error, loading, denied, and empty states are
  rendered from final product results; no preview fixture or fake metric may
  replace them.

## Route and surface slices

| Final-v0.8.3 slice                                                 | Visual source to consider                                               | Classification                    | Non-negotiable contract preservation                                                                                                    | Future acceptance                                                                                       |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------- | --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Public landing and portals                                         | v5 landing hierarchy, campus visual field, module index, shared theme   | `PORT_WITH_CONTRACT_PRESERVATION` | Preserve actual public links, session-aware routing, published-only media, and protected-route enforcement                              | Public routes load; no mock chrome/data; keyboard, responsive, light/dark checks                        |
| Sign-in, registration, application, and application status         | v5 auth shell, form hierarchy, error/loading/denied patterns            | `RECONCILE`                       | Preserve auth API states, CSRF/session boundaries, generic failures, lifecycle/approval rules, and no account enumeration               | Existing auth journeys and failure semantics stay exact                                                 |
| Public Request, tracking, and policy dialogs                       | v5 staged form/timeline/dialog patterns                                 | `RECONCILE`                       | Preserve public-safe fields, validation, private tracking, acknowledgements, and no stock/identity fabrication                          | Field/action/status/error parity and public-data minimization                                           |
| Public Lending and tracking                                        | v5 catalog, intake, status timeline, evidence presentation              | `RECONCILE`                       | Preserve sanitized catalog, private tracking, lending lifecycle, and current final field semantics                                      | Catalog/filter/intake/tracking contract parity; no inferred availability or private data                |
| Authenticated shell, workspace, module index, profile              | final `src/v5/integration/*` plus v5 shell/controls                     | `PORT_WITH_CONTRACT_PRESERVATION` | Preserve route guards, capability checks, focus behavior, dirty-state safety, and server-backed view models                             | Authorized navigation, profile actions, mobile/keyboard behavior, no client-side bypass                 |
| Request, Lending, Release, Restocking, Procurement, Inventory      | v5 queue/table/detail/drawer compositions                               | `RECONCILE`                       | Preserve final services, status semantics, partial/cumulative release, append-only ledger truth, and pagination                         | Each chosen workflow’s fields/actions/statuses/errors/capabilities are proven before visual replacement |
| Accounts, Staff Directory, Activity History, owner/health surfaces | v5 administration patterns, status/denied/empty/loading treatments      | `RECONCILE`                       | Preserve explicit link/assignment authority, Activity History scope/append-only behavior, audit visibility, and system-owner boundaries | Role matrix, page bounds, no privilege inference, no private data leak                                  |
| Theme, typography, glass, motion, and responsive rules             | `theme-source.mjs`, `hau-theme.css`, v5 theme/motion evidence           | `PORT_WITH_CONTRACT_PRESERVATION` | Adapt tokens to final-main architecture; honor reduced motion, contrast, focus, and no dependency surprise                              | Token generation/checks plus slice-level accessibility/responsive evidence                              |
| Figma Make v39 scoped-atrium treatment                             | Canonical override and cascade/rollback receipts                        | `DESIGN_REFERENCE_ONLY`           | Treat as a visual decision; do not copy remote Make source or mutate Figma                                                              | Reuse only deterministic design intent; record any new divergence                                       |
| Prototype registry, fixtures, preview controls, screenshots        | v5 prototypes and output artifacts                                      | `DESIGN_REFERENCE_ONLY`           | Fixtures, actors, counts, and controls cannot enter product behavior                                                                    | Screenshot comparison only after a future real-slice candidate exists                                   |
| Historical branch runtime integration                              | `src/visual/*`, old generated artifacts, historical test/config changes | `DO_NOT_MIGRATE`                  | Final main owns runtime/API/auth/data behavior                                                                                          | No merge/wholesale copy; extract a visual rule only through a future map                                |
| v2/v3/v4/v4.1 historical previews and old production assumptions   | Older prototypes, old task pointers, v0.7.2 maps                        | `OBSOLETE_FOR_CURRENT_V083`       | Preserve as research history, not current baseline                                                                                      | None; do not revive as authority                                                                        |
| Any semantic design delta or unknown source                        | Pickup/date/catalog changes, missing Make source, API/auth/data changes | `OWNER_AMENDMENT_REQUIRED`        | Stop before changing a contract or external system                                                                                      | New accepted spec/amendment and exact verification plan                                                 |

## Reusable, port, forget, and reconcile lists

| List                    | Content                                                                                                                                                                                                           |
| ----------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Reuse as evidence       | Baseline register, Make audit/adoption packet, tracker, decision records, V5 maps/parity reports, screenshot sets, and rollback copies                                                                            |
| Port selectively        | Color/typography hierarchy, semantic surfaces, visual loading/denied/empty states, accessible shell patterns, responsive/motion patterns, route-independent components                                            |
| Forget as runtime input | Preview controls, fake roles/counts/states, mock registry data, historical production routes/fields, generated HTML, and old package/tooling edits                                                                |
| Reconcile first         | All final-main routes, V5 integration runtime, auth/account lifecycle, identity/activity history, Request/Lending, server pagination/errors, access/capability behavior, and current public/private data boundary |

## Generated-artifact rules

1. Never copy or hand-edit `dist`, shareable HTML, screenshot artifacts, or
   generated CSS into final product source.
2. Treat `scripts/design/theme-source.mjs` and the Make-theme generator as
   design evidence. A future specification must name the final-main destination
   and whether the generator is adopted, adapted, or only consulted.
3. Keep theme and visual work dependency-free unless a separate owner decision
   accepts a dependency with focused security/performance verification.
4. Browser/visual artifacts are recreated only from the future accepted source
   and final-main toolchain.

## Visual acceptance for a future slice

- Compare the selected final-main surface with the named v5/Figma reference;
  do not compare it with obsolete v0.7.2 production presentation.
- Verify light/dark, contrast, focus, keyboard, dialogs/drawers, reduced
  motion, responsive widths, 200% zoom, loading, empty, denied, and error
  states relevant to the slice.
- Exercise real authorized and unauthorized outcomes with the final v0.8.3
  runtime contract. Historic screenshots prove design intent only.
- Confirm no preview label, mock actor, fake count, demo selector, or
  implementation jargon ships in a user-facing surface.

## Rollback and release boundary

Future work starts from final main on a new isolated branch/worktree, with a
normal Git rollback point recorded before source changes. This retained frontend
branch remains a preserved reference and is never merged or rebased into main.
No implementation candidate authorizes a deploy: Playground/Production,
provider, migration, recovery, and Figma writes require their own accepted
authority and verification gates.

```text
FRONTEND_DESIGN_ADOPTION_INTAKE: COMPLETE
FUNCTIONAL_BASELINE: FINAL_V083_MAIN
FRONTEND_IMPLEMENTATION: NOT_STARTED
DEPLOY: NOT_AUTHORIZED
READY_FOR_FRONTEND_ADOPTION_SPEC_REVIEW: TRUE
```
