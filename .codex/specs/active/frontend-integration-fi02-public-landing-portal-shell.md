# HAU-USC Logistics — FI-02 Public Landing and Portal Shell

**SLICE:** FI-02
**PROGRAM:** Frontend Design Integration
**MODE:** EXECUTE — FRONTEND ONLY
**STATUS:** ACCEPTED
**OWNER:** Earl
**ACCEPTED:** 2026-08-21, Asia/Manila — owner task plus D-08 decision amendment
**TARGET:** `frontend-design-integration`
**RISK:** MEDIUM
**PREDECESSOR:** FI-01 Shared Design Foundation — ACCEPTED
**NEXT SLICE:** FI-03 Sign-In, Verification, Application, and Application Status

## Durable owner-task adoption

This is the durable accepted repository transcription of the exact FI-02 owner
task supplied at
`C:\Users\adria\.codex\attachments\f83620b8-a8d3-4827-b05a-d43a45c02471\pasted-text.txt`,
read in full before acceptance. It is authoritative together with the following
later owner amendment, which resolves the task's originally open D-08 gate.

> Accessibility overrides literal low-contrast Figma ink. Preserve the Figma
> layout and visual hierarchy, but automatically use the closest approved FI-01
> semantic foreground token that meets WCAG AA. Active/emphasized elements use
> the high-contrast foreground; inactive/secondary elements remain visually
> muted but must still pass the required contrast ratio.

This amendment is accepted as `D08_STATUS: OWNER_RESOLVED`. It supersedes only
the task's former unresolved-D-08 stop condition. It does not broaden FI-02.

## Owner amendment — advertisement state projection

Accepted after the initial FI-02 contract-gap evidence on 2026-08-21,
Asia/Manila:

> Permit changes to src/v5/integration/runtime.js and src/v5/src/registry.js
> solely to project the existing advertisement API into truthful loading,
> populated, empty, request-error, and media-failure UI states. No
> backend/API/auth/data contract, dependency, provider, Playground, or
> Production changes are authorized.

This is a narrow exception to the former integration exclusion. It permits only
the presentation-state projection necessary for `public.landing`: registering
the existing states, rendering them while the existing adapter is in flight or
has completed, and passing existing public advertisement/media outcome state to
the already-owned landing surface. It does not permit a new fetch, a changed
endpoint/payload, a direct browser data access, a changed authorization/privacy
boundary, a provider write, or any unrelated integration change.

## Intent and objective

```text
INTENT: SOFTWARE_FEATURE
SECONDARY: FRONTEND_IMPLEMENTATION, VISUAL_INTEGRATION, ACCESSIBILITY
MODE: EXECUTE
TARGET: Public landing page and public portal shell
PRIMARY ENVIRONMENT: Local loopback preview backed by the Isolated Playground
PRODUCTION: FORBIDDEN
BACKEND CHANGES: FORBIDDEN
MIGRATIONS: FORBIDDEN
PROVIDER CHANGES: FORBIDDEN
```

Port the accepted public landing and portal-shell visual hierarchy onto the real
v0.8.3 frontend while preserving existing routes, backend contracts,
authorization boundaries, public-data restrictions, accessibility requirements,
and environment isolation. Do not begin FI-03.

The completed slice must satisfy:

```text
FI02_STATUS: PASS
PUBLIC_LANDING: REAL
PUBLIC_PORTAL_SHELL: REAL
MOCK_DATA: 0
BACKEND_CHANGE: 0
PRODUCTION_MUTATION: 0
READY_FOR_FI03: TRUE
```

## Authority and immutable baselines

1. Earl's owner task and accepted D-08 amendment above.
2. Canonical `AGENTS.md`, `.agents/PROJECT_POLICY.md`, and the three current
   continuity records.
3. This accepted specification and FI-LIVE-PREVIEW-01.
4. FI-01 accepted specification/receipt/handoff; `tokens.css` remains the sole
   runtime token/theme authority. D02 and D04 remain closed and are not reopened.
5. Frozen functional authority:
   `origin/main@86553349f5c2ebefaa637c30828c560a301f99ba`, v0.8.3. Backend,
   API, authorization, privacy, data, and route contracts win over visual
   references.
6. Visual authority:
   `DESIGN_BASELINE_2026-08-20-F` plus Figma Make v39.
   The accepted repository mirror is authoritative because the live Figma
   connector requires reauthentication: `output/design/make-adoption/` and
   `docs/design/FIGMA_MAKE_SOURCE_REGISTER.md`; `theme.css` must retain
   SHA-256 `249857a93f0f90425504da286aab4a296445b4f74546e4fbff72dcf30663140d`.
   Do not retry the unavailable connector blindly and never claim live Figma
   access.
7. `docs/design/FRONTEND_INTEGRATION_EXECUTION_PLAN.md` FI-02 rows,
   `FRONTEND_INTEGRATION_ACCEPTANCE_MATRIX.md` FI-02-applicable rows,
   `FRONTEND_BACKEND_CONTRACT_MATRIX.md` public landing/media rows, route
   registry, and relevant accepted design authority.

If a listed invalidator changes, revalidate only its affected evidence. Stop if
a load-bearing design fact cannot be verified from the accepted Git mirror.

## Scope and exclusions

Primary owned product paths:

```text
src/v5/src/surfaces/public.js
  -> landing and FI-02 policy/public-shell portions only
src/v5/styles/shell.css
src/v5/styles/surfaces.css
```

The accepted owner amendment additionally owns these exact directly coupled
frontend files and no other integration/registry paths:

```text
src/v5/integration/runtime.js
  -> public.landing advertisement state projection only
src/v5/src/registry.js
  -> public.landing's existing render-state registration only
```

Directly coupled frontend-only test or generated artifacts may be changed only
when deterministic dependency analysis proves the necessity, it is recorded,
and the repository's reproducible pipeline generates the artifact. The exact
FI-02 spec, current-chain records, receipt/status/continuation/changelog records
needed for this slice are also owned.

Do not modify or invoke changes in:

```text
src/v5/integration/** except `src/v5/integration/runtime.js` only for the
accepted public.landing advertisement-state projection
src/worker/**
src/server/**
src/services/**
src/domain/**
src/auth/**
migrations/**
migration/**
apps-script/**
wrangler.jsonc / Cloudflare bindings
D1 / R2 behavior or configuration
Google or provider configuration
authentication, authorization, session, CSRF, or capability contracts
```

Do not implement FI-03 surfaces, account registration, any application forms or
status work, profile, Inventory, queues, release/restock/procurement, directory,
administration, a new dependency, a route, a migration, a deployment, a Figma
write, a Playground write, a Production mutation, a main merge, a rebase, reset,
clean, force push, or history rewrite.

## Real public-contract and privacy requirements

Only the existing public contracts may be consumed:

```text
GET /api/public/advertisements
  -> backend.publicAdvertisements
GET|HEAD /media/advertisements/<id>
  -> existing Worker-served R2 media
```

The browser must retain the adapter boundary; it must not touch D1/R2 directly,
construct private R2 URLs, widen public responses, use Google as truth, expose
unpublished/internal data, or invent fallback business records. A visual element
not supported by the existing response is `STOP / CONTRACT_GAP`.

The signed-out landing may render only deliberately public API data. It must not
expose session, staff, inventory, request, borrower, account, audit, unpublished
advertisement, raw object/provider/resource identifiers, or private notes.

## Visual and accessibility requirements

Use the accepted Page 15 Landing / Make v39 `PublicFlows.tsx` hierarchy and the
current HAU-USC institutional identity. Preserve a calm, credible,
purposeful, HAU-USC-first gateway: restrained premium material, no generic
dashboard/card wall, excess glass, decorative gradients, fake statistics,
activity, events, achievements, technical/playground copy, or fabricated facts.

Use FI-01 semantic tokens only. Do not introduce new hardcoded colours where an
accepted semantic token exists or fork tokens in `surfaces.css`. The layout may
deviate from low-contrast Figma ink only as an explicit
`ACCESSIBILITY_CORRECTION` under the D-08 decision. The known 1.01:1–1.84:1
dark-ink/dark-card combinations must not survive.

Required D-08 result:

```text
KNOWN_D08_LOW_CONTRAST_COMBINATIONS: 0
```

Meet the project's WCAG 2.2 AA direction: readable hero, semantic headings and
landmarks, keyboard-reachable controls, visible focus, meaningful labels,
reduced motion, non-colour cues, accessible advertisement/media presentation,
and contrast measured at native resolution.

## Route integrity

Before closeout, every delivered CTA, navigation item, footer link, portal entry,
policy link, and announcement action is mapped as one of:

```text
SUPPORTED_REAL_ROUTE
EXTERNAL_APPROVED_LINK
UNSUPPORTED
```

Only the first two ship. No dead buttons, `href="#"`, fabricated destinations,
or unsupported registration flow may ship. `public.register` remains
`PROTOTYPE_ONLY_UNSUPPORTED`; it must not be linked or implemented.

### FI-02 control route map — verified before product edits

| Delivered control                         | Real destination or action                                                                                                                      | Classification                                   |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------ |
| Header theme control                      | Existing client-side authored-theme toggle                                                                                                      | LOCAL_UI_CONTROL; no route or service call added |
| Hero primary: Staff sign in               | `#/public.signin`                                                                                                                               | SUPPORTED_REAL_ROUTE                             |
| Hero secondary: official USC page         | `https://www.facebook.com/holyangeluniversitysc`                                                                                                | EXTERNAL_APPROVED_LINK                           |
| Portal: Request Center                    | `#/public.request-intake`                                                                                                                       | SUPPORTED_REAL_ROUTE                             |
| Portal: Office Lending                    | `#/public.lending-intake`                                                                                                                       | SUPPORTED_REAL_ROUTE                             |
| Portal: Staff sign in                     | `#/public.signin`                                                                                                                               | SUPPORTED_REAL_ROUTE                             |
| Published announcement action             | Existing public API `destinationUrl` only when the existing adapter accepts an HTTPS URL; otherwise the approved official-page fallback remains | EXTERNAL_APPROVED_LINK / contract-governed       |
| Footer: Privacy Notice and Acceptable Use | `#/public.policy`                                                                                                                               | SUPPORTED_REAL_ROUTE                             |
| Self-service registration                 | Not delivered; `public.register` remains prototype-only/unsupported                                                                             | UNSUPPORTED — excluded                           |

The existing `public.landing` load path remains the sole data route:
`backend.publicAdvertisements()` -> `GET /api/public/advertisements`; governed
media remains the existing public `mediaUrl`/`imageUrl` path served by the
Worker. No direct browser fetch, D1/R2 access, URL construction, or new route
is permitted.

## Advertisement and public-media states

Use the real public feed and existing Worker media route. The navigation must
remain usable in all required states:

```text
LOADING
POPULATED
EMPTY
ERROR / UNAVAILABLE
```

No fake record, data mutation, re-hosted/inline governed media, or mock
user-facing advertising is allowed. Existing permitted test fixtures may support
test infrastructure only and must not enter the production application graph.

## Local loopback preview

After this spec, the writer lock, and no-Production-crossover checks are durable,
start or reuse exactly one preview through the accepted command:

```text
npm run dev:v5:playground -- <approved-absolute-private-playground-manifest>
```

It must bind only `127.0.0.1:4173`, keep HMR enabled, use the isolated
Playground proxy, and never disclose a private manifest path/contents or any
protected identifier. No Production proxy, public tunnel, duplicate server, or
business-data mutation is permitted. Report the local URL once. Use targeted
browser inspection only at structural, responsive, and final acceptance
checkpoints; do not run a screenshot/inspection loop.

## Required implementation and acceptance

1. Build the real public landing/shell while preserving semantic navigation,
   current content/route behavior, API/media contracts, external-link behavior,
   boot behavior, and accessibility. Reuse accepted shell/mobile/nav/button/
   feedback/media primitives where they fit.
2. Compose mobile intentionally at 320 and 390 px; test 768, 1024, and 1440 px.
   At each width prove no horizontal overflow, clipped/overlapping text,
   unreachable action, or broken hierarchy/media scaling.
3. Test 200% zoom, light and dark authored themes, keyboard-only flow, visible
   focus, and reduced motion.
4. Verify loading, populated, empty, media failure, and request-failure behavior
   safely against the existing public backend; no production graph data is to be
   invented or written.
5. Run focused tests, required FI-02 browser/route/media checks, required
   lint/format, and the FI-02-required broader closeout checks once after source
   stabilization. Reuse unchanged FI-01/FI-00 evidence where valid.
6. Review the complete diff and prove:

```text
BACKEND_DIFF: 0
MIGRATION_DIFF: 0
INTEGRATION_CONTRACT_DIFF: 0
NEW_RUNTIME_DEPENDENCIES: 0
PRODUCTION_WRITES: 0
PLAYGROUND_DEPLOYMENTS: 0
FIGMA_WRITES: 0
```

## Stop conditions

Stop immediately for a dirty/conflicting writer, wrong branch/worktree,
baseline/contract/route invalidation, a missing or unverified load-bearing design
fact, unsupported design behavior, a needed backend/API/auth/data/migration/
provider/dependency change, private public-surface data, Production crossover,
unverified Playground origin, required manifest absence, a failed mandatory
verification, or an accessibility requirement that cannot be met within FI-02.

## Commit, handoff, and rollback

Rollback is a normal revert of the single FI-02 commit. When every criterion is
green, review the complete diff, create one coherent FI-02 commit, push normally
to `origin/frontend-design-integration`, read it back at 0 ahead/behind, update
the current pointer/task/handoff together plus required status/continuation/
changelog/receipt records, release the sole writer lock, and stop.

The final handoff must record the exact FI-02 fields specified by the owner task:
starting/ending SHA/tree, route parity, public/privacy/media assertions, all
responsive/theme/accessibility states, D-08 contrast, local-preview/proxy
evidence, prohibited-change counters, commands/results, browser evidence,
rollback, no-repeat facts, `ACTIVE_WRITER: NONE`, `WRITER_LOCK: RELEASED`, and
`HANDOFF_STATUS: READY_FOR_FI03` with next action
`FI-03_SIGNIN_VERIFICATION_APPLICATION_STATUS`.
