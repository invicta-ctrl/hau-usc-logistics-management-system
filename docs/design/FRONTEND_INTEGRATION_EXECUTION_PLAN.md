# Frontend Integration Execution Plan — FI-00 to FI-16

Dependency-ordered slices for adopting the accepted visual design into the
frozen v0.8.3 frontend on `frontend-design-integration`.

```text
FUNCTIONAL_BASELINE  origin/main 86553349f5c2ebefaa637c30828c560a301f99ba
VISUAL_BASELINE      DESIGN_BASELINE_2026-08-20-F + Figma Make v39
WORK_BRANCH          frontend-design-integration (temporary; deleted after closure)
RELEASE_PATH         branch -> candidate freeze -> Playground -> Earl GO
                     -> protected main -> Production -> closure
```

## Standing rules for every slice

```text
CONTRACT_COMPLETE   A surface ships with its real backend actions or it does not
                    ship. Never merge a visual state whose required action is
                    fake, stubbed, or missing.
ONE_SLICE_AT_A_TIME One accepted slice, one writer, one lock.
NO_BACKEND_CHANGE   No src/worker, src/server, src/domain, src/services contract,
                    migration, or provider change in any FI-01..FI-12 slice.
NO_NEW_DEPENDENCY   Without a separate owner decision plus security and
                    performance verification.
ADAPTER_BOUNDARY    A surface reaches the network only through
                    src/v5/integration/backend.js. Never fetch from a surface.
STOP_ON             missing authority, contract conflict, privacy uncertainty,
                    unknown dirty work, writer conflict, failed integrity gate,
                    or any need to change backend behavior.
```

Each slice records: objective, owned paths, excluded paths, backend contracts,
visual reference, reused components, new components, data-privacy boundary,
acceptance tests, visual acceptance, rollback, invalidators, stop condition.

## FI-LIVE-PREVIEW-01 — local observation workflow for FI-01 through FI-12

The accepted [FI-LIVE-PREVIEW-01 amendment](../../.codex/specs/active/frontend-integration-live-local-preview-amendment.md)
adds a local developer-observation loop without changing any slice scope,
contract, release gate, or acceptance requirement. It is subordinate to the
active FI specification and never authorizes work by itself.

For an accepted FI-01 through FI-12 implementation session, prepend this after
the normal authority and Git handshake:

```text
1. Verify the active FI specification, branch/worktree, sole writer lock, and no Production crossover.
2. Start or reuse exactly one guarded local V5 Playground preview for that worktree.
3. Use: npm run dev:v5:playground -- <ABS_PRIVATE_PLAYGROUND_MANIFEST>
4. Confirm only loopback 127.0.0.1:4173 and the existing verified isolated-Playground proxy.
5. Report http://127.0.0.1:4173 once; Earl may keep that browser open while HMR updates it.
6. Implement the accepted slice. Do not screenshot, poll, inspect logs, or restart Vite as an ordinary edit loop.
7. Use targeted browser evidence only at a meaningful diagnostic, responsive/accessibility, or explicit acceptance checkpoint.
8. Run the slice-specific deterministic verification, review the complete diff, and update all handoff fields.
9. Stop the preview when the writer lock releases, the worktree/branch changes, the session ends, or it becomes stale.
```

Never record a private manifest path, resource identifier, credential, or secret.
If the approved private manifest or isolated Playground origin cannot be verified,
stop the local preview rather than substituting a Production configuration.

---

## FI-00 — Integration baseline and branch reconciliation · COMPLETE 2026-08-21

```text
OBJECTIVE      Make frontend-design-integration a safe base for v0.8.3 frontend
               work, and obtain the two owner decisions that block FI-01.
OWNED PATHS    .codex/CURRENT.md, .codex/CURRENT_TASK.md, .codex/CURRENT_HANDOFF.md
               .codex/specs/active/<new frontend-integration spec>
               the merge commit reconciling origin/main into the branch
EXCLUDED       every src/ file, every migration, every generated artifact
BACKEND        none
VISUAL REF     none
NEW COMPONENTS none
PRIVACY        none
ROLLBACK       git reset is forbidden; revert the merge commit if required
STOP           any conflict that would delete a file main has
```

**Outcome.** Executed and accepted on 2026-08-21 by Claude Opus 5 under Earl's
task-specific writer override. Full evidence in
[FRONTEND_FI00_RECONCILIATION_RECEIPT.md](FRONTEND_FI00_RECONCILIATION_RECEIPT.md).

```text
pre-FI-00 head      f0ab75d2481ea7a39cbe29d2b0a1e4d59f632970
archive tag         archive/frontend-design-pre-fi00-2026-08-21
merge               normal --no-ff merge of origin/main@86553349 into the branch
main-file loss      0
runtime diff        0
check:agents        PASS   (was 9 policy-marker errors)
active-tree cut     916 files, 141,450,911 bytes
```

**Why it was blocking.** Verified on 2026-08-21 before the merge:

```text
frontend-design-integration vs origin/main   95 ahead - 191 behind
merge base                                   88bfdf026e716ffdc779cb2ce7534978f36df0f3
files present on main and ABSENT on branch   135
  migrations/0031_canonical_identity_foundation.sql
  migrations/0032_staff_account_activity_history.sql
  src/v5/integration/{entry,runtime,backend,view-models,operations-parity,
                      admin-parity}.js + owner-visual-feedback.css
  27 tests/unit/*  8 src/server/*  14 .codex/specs/*  16 .codex/releases/*
  15 scripts/playground/*  10 src/v5/*  13 docs/design/*
```

A PR from this branch into `main` before reconciliation would delete both
identity migrations and the entire adapter layer.

### Steps as executed

1. Verify the packet against current HEAD using each document's `STALE_IF` block.
2. **Owner decision A** — confirm the branch strategy in
   `FRONTEND_INTEGRATION_START_HERE.md` §7, superseding the Phase 9 "start from a
   fresh branch off main" recommendation.
3. **Owner decision B** — design-evidence promotion. Frozen main has no
   `prototypes/`, `output/design/`, or `scripts/design/`. The branch carries
   1,170 such files totalling 138,815,428 bytes, of which 134,737,146 bytes are
   904 PNG screenshots under `output/design/`. Decide per group: promote to main,
   keep on the branch only, preserve by immutable archive tag, or move outside
   Git. Recommended default: promote `docs/design/**` and `scripts/design/**`,
   keep `prototypes/public-portals-r3` and `prototypes/shared`, preserve
   `output/design/**` by archive tag rather than merging it into main.
4. Merge, never rebase:

   ```bash
   git fetch origin --prune
   git switch frontend-design-integration
   git merge --no-ff origin/main
   ```

5. Resolve conflicts in main's favour for every behavior path
   (`src/worker/**`, `src/server/**`, `src/services/**`, `src/domain/**`,
   `src/app/**`, `src/auth/**`, `src/v5/integration/**`, `migrations/**`,
   `tests/**`, `wrangler.jsonc`, `package.json`, `vite.config.js`).
6. Prove parity — this is the acceptance gate:

   ```bash
   git diff --name-status origin/main HEAD | grep '^D' | wc -l    # expect 0
   git diff --stat origin/main HEAD                               # additions only
   ```

7. Run `npm run check`. It must pass at the same level main passes.
8. Write the accepted frontend-integration specification and update the three
   `.codex` current records.

```text
ACCEPTANCE     MET. Zero deletions vs origin/main. Runtime diff 0. check:agents,
               handoff:verify, check:continuation, formatting, diff --check and
               the secret scan all pass. Owner decisions A and B are recorded in
               the accepted FI-00 specification and executed.
INVALIDATORS   any new commit on origin/main
```

`npm run check` was deliberately **not** run: every build and runtime input is
byte-identical to `origin/main`, which already passed it at that SHA. Rerunning
it would be ceremony, and `.agents/PROJECT_POLICY.md` forbids that. It becomes
required again the moment FI-01 edits a build or runtime input.

---

## FI-01 — Design tokens, primitives, theme, typography

```text
OBJECTIVE      One canonical token layer serving every surface, in light and dark.
OWNED PATHS    src/v5/styles/tokens.css, base.css
               src/index.html (stylesheet order, direction-contract comment)
               scripts/design/theme-source.mjs if the owner adopts the generator
EXCLUDED       every src/v5/src/surfaces/* file, every integration file, all backend
BACKEND        none
VISUAL REF     output/design/make-adoption/theme.css (v39, sha256 249857a9…)
               prototypes/shared/hau-theme.css, DESIGN.md D08/D09/D12/D41
REUSED         the existing 11-stylesheet cascade in src/index.html
NEW            none; tokens only
PRIVACY        none
ROLLBACK       revert the slice commit
STOP           a token change that alters a status colour's meaning
```

**Outcome: PASS.** FI-01 establishes `src/v5/styles/tokens.css` as the sole
active runtime token/theme authority. D-04 is PASS with local Bricolage display,
IBM Plex Sans body/control/data, and Newsreader wordmark roles. D-02 is PASS
with the D41 G1/G2/G3/G4 ladder (10/14/18/22px) and tiered fill, saturation,
border, shadow, and solid fallback consumption. Legacy selector sheets retain
only primitive consumers; their `:not(*)` root/theme evidence is inert.

**D-08 remains OPEN_FOR_FI02.** FI-01 did not accept, redesign, or claim the
landing-hero contrast/state semantics; that work belongs only to the accepted
FI-02 slice.

```text
ACCEPTANCE     PASS — token/theme checks and contrast audit pass; light/dark
               resolve from `tokens.css`; active glass consumers use G1–G4
               values and no second active root/theme authority remains
VISUAL         320 / 390 / 768 / 1024 / 1440 CSS px, 200% zoom, light and dark,
               reduced motion, on one representative surface
INVALIDATORS   DESIGN.md, output/design/make-adoption/theme.css,
               scripts/design/theme-source.mjs
```

---

## FI-02 — Public landing and portal shell

```text
OBJECTIVE      Port the landing and portal shell hierarchy onto real public routes.
OWNED PATHS    src/v5/src/surfaces/public.js (landing, policy),
               src/v5/styles/{shell,surfaces}.css
EXCLUDED       auth surfaces, intake surfaces, all integration files
BACKEND        GET /api/public/advertisements  ->  backend.publicAdvertisements
               GET /media/advertisements/<id>  (Worker-served R2, GET/HEAD only)
VISUAL REF     Figma page 15 Landing; make-adoption/PublicFlows.tsx;
               prototypes/impeccable-whole-site-redesign-v5
REUSED         app-shell, mobile-navigation, overflow-menu
PRIVACY        published advertisements only; no session-derived content
ROLLBACK       revert the slice commit
STOP           any landing link that does not resolve to a real route
```

```text
ACCEPTANCE     every destination is a real route; published-only media;
               no demo, preview, version, or mock chrome; no fabricated metric
VISUAL         all widths, both themes, reduced motion, keyboard, 200% zoom
INVALIDATORS   src/server/advertisement-admin-service.js, the Worker media route
```

---

## FI-03 — Sign-in, verification, application, application status

```text
OBJECTIVE      Port the authentication and application shell without weakening
               a single security behavior.
OWNED PATHS    src/v5/src/surfaces/public.js (signin, verify, application,
               applicationStatus), src/styles/visual/auth.css
EXCLUDED       src/server/auth/**, src/server/account-application/**,
               src/auth/http-contract.js
BACKEND        POST /api/auth/login                        no CSRF, issues one
               GET  /api/auth/session
               POST /api/auth/activate                     CSRF
               POST /api/auth/logout                       CSRF
               POST /api/auth/reset/complete               CSRF
               POST /api/account-applications/email/start
               POST /api/account-applications/email/confirm
               POST /api/account-applications               bearer status token
               GET  /api/account-applications/status        bearer status token
               POST /api/account-applications/withdraw      bearer status token
VISUAL REF     Figma page 90 Public + Authentication; StaffAccess.tsx
REUSED         inline-error, modal, form-dirty-state, password-visibility
PRIVACY        no account enumeration; generic failures stay generic
ROLLBACK       revert the slice commit
STOP           any change that makes a login failure more specific
```

Preserve exactly: session cookie handling, `x-csrf-token` attachment via
`backend.js`, credential-version and revocation behavior, expiry, rate limiting,
the secure eight-digit verification lifecycle with resend invalidation, and
`AUTH_STATE` = `SIGNED_OUT | ACTIVATION_REQUIRED | AUTHENTICATED`.

`public.register` is `PROTOTYPE_ONLY_UNSUPPORTED`. Do not implement it. If the
design shows self-service registration, raise `OWNER_AMENDMENT_REQUIRED`.

```text
ACCEPTANCE     every auth journey and failure semantic unchanged; CSRF never
               rendered or logged; states populated/loading/error/unavailable
INVALIDATORS   src/server/auth/**, src/auth/http-contract.js,
               src/server/account-application/**
```

---

## FI-04 — Authenticated shell, navigation, mobile shell, profile

```text
OBJECTIVE      The workspace frame every operational slice sits inside.
OWNED PATHS    src/v5/src/{app.js, components.js}, src/v5/src/surfaces/admin.js
               (profile only), src/v5/styles/{shell,motion,responsive}.css
EXCLUDED       src/v5/integration/** (guards and view models are not visual scope)
BACKEND        GET/POST /api/bootstrap | /api/getEssentialBootstrapData
               POST /api/getScopedRevision        near-live refresh
               GET/PATCH /api/me/profile          PATCH needs CSRF
               POST /api/me/username/change | /password/change |
                    /identity-correction-request  CSRF
               POST|DELETE /api/me/avatar         CSRF
               POST /api/identity-roster/self     CSRF
VISUAL REF     Figma page 13 Shell + Navigation, page 21 Profile
REUSED         app-shell, mobile-navigation, drawer, overflow-menu, status-chip
PRIVACY        the profile surface shows only the signed-in person's data
ROLLBACK       revert the slice commit
STOP           any client-side capability computation
```

Preserve: `NAV`, `NAV_ADMIN`, `TABS` from `src/v5/src/registry.js`;
`selectDefaultWorkspaceRoute()` fallback ladder (mapped workspace route ->
`account.profile` -> first authorized route -> `public.signin`);
`account.profile` reachable without a module capability; `clearBackendViewModels()`
still running before first render; the `revision-sync` poller still wired.

```text
ACCEPTANCE     authorized navigation only; denied route renders the denied state,
               not a blank; focus restoration on drawer and dialog close;
               dirty-state guard preserved
VISUAL         320 / 390 / 768 / 1024 / 1440, 200% zoom, keyboard-only pass,
               reduced motion, both themes
INVALIDATORS   src/v5/src/registry.js, src/v5/integration/runtime.js,
               src/app/bootstrap-contract.js, src/app/revision-sync.js
```

---

## FI-05 to FI-11 — Operational and administration surfaces

Each is one contract-complete surface group. Common shape:

```text
EXCLUDED       every backend path; every other slice's surfaces
REUSED         data-table, pagination, drawer, modal, status-chip, uploader,
               inline-error, autocomplete, mobile-card-list
NEW            only where the contract matrix proves no existing primitive fits
PRIVACY        render only what the server returned; never widen a response
ROLLBACK       revert the slice commit
STOP           a design that implies a field, action, status, or capability that
               the contract matrix does not list
```

| Slice                                              | Surfaces                                                                         | Capability                                                               | Contract anchors                                                                                                                                                                                                                                                                                                                       |
| -------------------------------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| FI-05 Inventory                                    | `inventory.catalog`, `inventory.item`, `inventory.overview`                      | `view.inventory`                                                         | module `inventory`; ops `classifyInventoryItem`, `bulkClassifyInventoryItems`, `listInventoryClassifications`, `postCycleCountAdjustment`, `createInventoryItem`, `updateInventoryItem`, `updateInventoryStorageContext`, `archiveInventoryItem`, `restoreInventoryItem`, `transferEventItem`, `transferEventItemToInventory`          |
| FI-06 Request                                      | `request.queue`                                                                  | `view.request`                                                           | module `request`; ops `submitRequest`, `reviewRequest`, `reserveStock`; states populated/loading/empty/stale/denied                                                                                                                                                                                                                    |
| FI-07 Lending                                      | `lending.queue`, `lending.detail`                                                | `view.internal`                                                          | module `lending`; ops `createLendingTicket`, `approveLendingTicket`, `confirmLendingHandoff` (UI id `confirmLoanHandoff`), `confirmReturn`, `registerInventoryAsset`, `recordAssetMaintenance`; `/api/lending/usage`, `usage.csv`                                                                                                      |
| FI-08 Release                                      | `release.desk`                                                                   | `fulfillment.release`                                                    | module `release`; ops `confirmRelease`, `correctRelease`, `uploadEvidence` (14,100,000 B bound)                                                                                                                                                                                                                                        |
| FI-09 Restocking + Procurement + Receiving         | `restocking.queue`, `procurement.board`                                          | `view.inventory`, `view.internal`                                        | modules `restocking`, `procurement`; ops `getRestockDetail`, `transitionRestock`, `receiveRestock`, `receiveDeliverable`, `transitionDeliverable`, `saveCanvassReference`, `updateCanvassReference`, `archiveCanvassReference`, `selectPreferredCanvass`, `getMaterialsWorkQueue`; `DELIVERABLE_TRANSITIONS` and `RESTOCK_TRANSITIONS` |
| FI-10 Accounts + Directory + Activity History      | `admin.access`, `admin.directory`, `audit.activity`                              | `access.admin`, `view.audit`                                             | `/api/admin/access/*` 14 actions; `/api/admin/staff-directory`; `/api/admin/staff-account-activity-history`; account-application review queues                                                                                                                                                                                         |
| FI-11 References + Links + Brand + Events + Health | `admin.reference`, `admin.links`, `admin.brand`, `events.series`, `owner.health` | `reference.manage`, `brand.manage`, `event.manage`, `system.diagnostics` | `/api/admin/reference-links/*` 6; `/api/admin/advertisements/*` 9; `/api/owner/brand-assets/*` 4; ops `getEventManagement`, `saveEventSeries`, `saveEventDay`, `saveEventActivity`, `linkEventOperationalRecord`; `/api/owner/evidence/*`, `/api/admin/migrations`                                                                     |

Slice-specific hard rules:

- **FI-05** — inventory quantity derives from an append-only ledger. Reservations
  affect availability only. Never render a computed on-hand the server did not send.
- **FI-06** — request submission does **not** deduct physical stock. Reserve is a
  separate authorized action gated on `RESERVABLE_PARENT_STATUSES`
  (`ACCEPTED`, `PARTIALLY_RELEASED`).
- **FI-08** — partial and cumulative release semantics and owner correction must
  survive intact. Evidence upload is append-only.
- **FI-09** — build timelines from the D1 transition tables, not from
  `src/domain/`. The domain vocabulary contains `PARTIALLY_FULFILLED`,
  `IN_PROGRESS`, and `READY_FOR_HANDOFF`, which the D1 layer has never written.
- **FI-10** — Activity History is append-only and role-scoped. Account-application
  review requires `reviewEvidence`; never render the decrypted envelope. Add no
  export, copy-all, print, or screenshot affordance to roster or directory surfaces.
- **FI-11** — brand and advertisement media are Worker-served R2 objects. Do not
  inline, proxy, or re-host them.

```text
ACCEPTANCE per slice
  field / action / status / error / capability parity proven against the matrix
  authorized AND unauthorized outcomes exercised against the real API
  pagination bound respected (100 standard, 500 inventory, 500 child rows)
  every declared state rendered: loading, empty, populated, error, denied,
  stale/conflict, success, partial, unavailable, validation error
  retry reuses the idempotency key
VISUAL per slice
  320 / 390 / 768 / 1024 / 1440, 200% zoom, light and dark, keyboard, focus,
  dialogs and drawers, reduced motion, no horizontal overflow,
  no preview label, mock actor, fake count, demo selector, or implementation jargon
INVALIDATORS
  src/server/d1/operational-service.js, src/worker/index.js,
  src/v5/integration/{operations-parity,admin-parity,view-models}.js,
  src/domain/permissions.js, src/app/bootstrap-contract.js
```

---

## FI-12 — Cross-surface polish

```text
OBJECTIVE      Repair only defects proven to be shared across two or more
               accepted slices.
STOP           any "while we are here" change. A single-surface defect belongs
               to that surface's slice, not to this one.
ACCEPTANCE     each change cites the two or more slices that proved it
```

---

## FI-13 — Exact candidate freeze

```text
OBJECTIVE      One immutable candidate identity.
RECORD         commit SHA, tree SHA, package-lock and toolchain identity,
               application-artifact identity (dist hash), Worker identity,
               schema and migration state, target environment, Playground baseline
COMMANDS       npm run check
               npm run release:candidate:manifest
               npm run verify:deploy:artifact
STOP           any source or artifact change after the freeze invalidates the
               candidate. Freeze a new one; do not patch this one.
```

---

## FI-14 — Isolated Staging Playground acceptance

```text
OBJECTIVE      Prove the candidate against a real, isolated backend.
GATE           FRONTEND_INTEGRATION_ACCEPTANCE_MATRIX.md in full
ISOLATION      Playground Worker, D1, R2, secrets, and queues are distinct from
               Production. Never point Playground code at a Production resource.
               Playground data never flows back to Production.
DEPLOY         explicit workflow dispatch only, to the Playground environment
STOP           any acceptance failure, any Production crossover, any live
               Production mutation
```

---

## FI-15 — Protected-main integration and Production preflight

### Clean-lineage promotion is mandatory — locked by FI-00

`frontend-design-integration` must **never** be normal-merged into `main`. Its
ancestry carries 191 commits of superseded history and, in the archive tag, the
full 167 MB pre-FI-00 tree. A normal merge would make all of that a parent of the
protected mainline.

```text
PREFERRED
  SQUASH MERGE the accepted final tree through the protected PR path.
  A squash does not make the historical branch ancestry a parent of main.

FALLBACK, when branch protection cannot squash while preserving the exact
accepted application tree
  1. cut a fresh promotion branch from accepted current main
  2. apply the final integration delta deterministically
  3. prove tree and application-artifact identity against the
     Playground-accepted candidate
  4. promote that clean branch through protected main

FORBIDDEN
  choosing a normal historical-branch merge because it is easier.
```

```text
SEQUENCE
  Earl explicit Production GO for the exact tested candidate
  protected PR into main, squash or clean promotion branch per the rule above
  required CI passes
  prove merged-main tree and application artifact equal the accepted candidate
  npm run production:preflight
  npm run production:authorization:check
  recovery and rollback evidence recorded
STOP   the merge SHA differing is expected; the TREE or ARTIFACT differing is a
       hard stop. Never silently rebuild different source for Production.
```

---

## FI-16 — Production deployment, smoke, reconciliation, branch closure

```text
SEQUENCE
  deploy Production from the protected main lineage only
  Production smoke
  D1 / R2 / schema / release-identity reconciliation
  rollback-readiness proof
  recovery-pointer rotation where current policy requires it:
    regression/r2 -> regression/r3
    regression/r1 -> regression/r2
    backup/last-known-good -> regression/r1
    previous accepted main -> backup/last-known-good
    new accepted release stays on main
  prove frontend-design-integration holds no unique unmerged work
  delete frontend-design-integration
STOP   never deploy Production directly from the frontend branch.
       never rotate recovery pointers merely because a PR merged.
```

---

## Ordering rationale

FI-00 is blocking because the branch would otherwise delete frozen work. FI-01
is next because every surface consumes tokens. FI-02 and FI-03 precede FI-04
because the public shell is the smallest real end-to-end proof that the ported
visual layer still talks to the real API. FI-04 precedes FI-05 to FI-11 because
every operational surface renders inside the authenticated shell. FI-05 leads the
operational group because Inventory is the ledger surface every other module
reads. FI-12 exists only to prevent per-slice polish creep.

Reorder only when a dependency mapping proves a better sequence, and record why.
