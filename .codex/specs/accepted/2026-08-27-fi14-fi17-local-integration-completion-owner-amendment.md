# FI-14 through FI-17 — Local Frontend Integration Completion

STATUS: OWNER_ACCEPTED_AMENDMENT__EXECUTE_NOW
DATE: 2026-08-27
PROGRAM: HAU-USC Logistics Frontend Integration
BRANCH: frontend-design-integration
OWNER_BASELINE: 91662f32510520c3d19335a28812ce2162f5d541
OWNER_SOURCE: D:/Download/HAU_USC_FI14_FI17_Local_Integration_Completion_Owner_Amendment_2026-08-27.md
ROUTE: SOL_ADVISOR_SOLO

## Intent

Complete FI-14 through FI-17 continuously so FI-00 through FI-17 is locally runnable,
integrated, hardened, and frozen at `http://127.0.0.1:4173/`. This is local frontend
integration and local acceptance only.

## Authority and preserved history

- This owner amendment supersedes only the lane-classification and scope statements
  that stopped the FI lane after FI-13.
- Accepted FI-00 through FI-13 work and evidence remain preserved.
- Historical `LEGACY-FI14 / FM-01` remains read-only Frontend Migration evidence. It is
  not active FI-14 and does not block this program.
- Frontend Migration remains a separate branch/worktree whose current target is the
  finished FI-00 through FI-12 snapshot only.

## Boundaries

Allowed work is limited to frontend source, adapters/view-models, tests, local-only
runtime configuration and synthetic fixtures, deterministic local artifacts, and the
smallest repository Worker/API repair required by an already-defined contract when no
schema, migration, provider, or external write is required.

Forbidden without a later amendment: Playground or Production deployment, Cloudflare
provider mutation, remote D1/R2 mutation, Google writes, provider email, Production
data, FM branch/worktree writes, main promotion, Figma/Make mutation, new product
features, schema changes, or migrations. Preserve `.ai-bridge/` and `.local/` residue.

## Continuous execution

Execute FI-14, FI-15, FI-16, and FI-17 without an owner hold between green slices.
Use one canonical FI writer. Prefer one coherent commit per slice; a no-op slice may
close with evidence. Do not create FI-18.

## FI-14 — Local runtime and backend-contract completion

Objective: turn the FI-13 frozen frontend into a usable local integrated runtime whose
supported routes use current repository contracts or truthful local equivalents.

Required work:

- keep or recover the accepted 4173 supervisor;
- boot every implemented FI-00 through FI-13 route locally;
- verify adapters/view-models against current Worker/API contracts;
- reproduce and repair broken integration glue, supported wiring, or local runtime
  defects without inventing behavior;
- use repository-native local storage and synthetic data only where required;
- label runtime evidence as real local backend, authorized read-only isolated backend,
  synthetic local test data, or truthful deferred gap.

Acceptance:

```text
LOCAL_4173_HEALTHY = true
FI00_FI13_ROUTES_BOOT_LOCALLY = true
SUPPORTED_FRONTEND_CONTRACT_GAPS = 0
BROKEN_FRONTEND_ADAPTERS = 0
PROTOTYPE_ONLY_FAKE_SUCCESS_ON_SUPPORTED_ROUTES = 0
REMOTE_PROVIDER_WRITES = 0
REMOTE_SCHEMA_MIGRATIONS = 0
KNOWN_LOCAL_CONSOLE_FATAL = 0
KNOWN_LOCAL_ROUTE_DEAD_END = 0
```

## FI-15 — Local end-to-end workflow integration

Objective: prove a coherent local application across public, authenticated requester,
and DOL/internal contexts and their accepted cross-module workflows.

Required coverage includes landing and Public Lending; sign-in/account entry and the
External Request Center; Main Logistics Hub, Inventory, Internal Request Hub, Internal
Lending Hub, Release Desk, Restocking, Procurement/Receiving, Accounts/Directory/
History, References, Events, Health, and governed supporting surfaces.

Prove routing separation, session preservation and sign-out, inventory-backed states,
request/reservation/release transitions, lending review/claim/loan/return transitions,
restock/procurement/receiving coherence, account/directory/history references,
cross-surface navigation, and truthful denied/loading/empty/error states.

Acceptance:

```text
LOCAL_CROSS_MODULE_P0 = 0
LOCAL_CROSS_MODULE_P1 = 0
PUBLIC_REQUESTER_INTERNAL_ROUTE_CROSSOVER = 0
KNOWN_STALE_STATE_AFTER_LOCAL_MUTATION = 0
KNOWN_DUPLICATE_LOCAL_MUTATION_EFFECT = 0
KNOWN_BROKEN_LOCAL_NAVIGATION = 0
KNOWN_AUTHORIZATION_UI_MISREPRESENTATION = 0
```

## FI-16 — Final local hardening and acceptance matrix

Run final whole-product local acceptance at 320, 390, 768, 1024, and 1440 CSS pixels.
Cover supported light/dark/reduced-motion and loading/empty/error/denied/conflict/
success/dense-content states. Verify layout, overflow, keyboard/focus lifecycle, forms,
drawers/dialogs, tables, touch targets, semantics, contrast, motion, console/network,
route separation, source labeling, local errors, and reconnect/reload behavior.

Run Hallmark and Impeccable once as bounded defect-finding/hardening workflows. Repair
only reproduced material defects and rerun invalidated checks.

Acceptance:

```text
OPEN_LOCAL_VISUAL_P0 = 0
OPEN_LOCAL_VISUAL_P1 = 0
OPEN_LOCAL_UNWAIVED_P2 = 0
KNOWN_REPRODUCIBLE_LOCAL_UI_BUGS = 0
KNOWN_ACCESSIBILITY_BLOCKER = 0
KNOWN_RESPONSIVE_BLOCKER = 0
KNOWN_CONSOLE_FATAL = 0
KNOWN_ROUTE_SEPARATION_REGRESSION = 0
```

## FI-17 — Production-mode local build and FI closure

Build the current source with the repository's production-mode frontend build, verify
deterministic artifact identity, serve/inspect it locally, keep the owner-facing 4173
preview usable, and prove Production-mode output contains no unauthorized Playground/
test chrome or fixture-derived fake success on supported routes.

Record branch, ending commit/tree, toolchain/lockfile identity when required, route
registry, artifact hashes, runtime identity, FI-00 through FI-17 receipt summary,
nonblocking residuals, and the exact FM boundary.

Acceptance:

```text
FI00_FI17_LOCAL_STATUS = COMPLETE
LOCAL_4173_HEALTHY = true
PRODUCTION_MODE_LOCAL_BUILD = PASS
DEPLOYABLE_FRONTEND_ARTIFACT = FROZEN
PLAYGROUND_ONLY_UI_IN_PRODUCTION_MODE = 0
SUPPORTED_ROUTE_FAKE_SUCCESS = 0
OPEN_P0 = 0
OPEN_P1 = 0
REMOTE_DEPLOYMENTS_BY_FI = 0
PRODUCTION_WRITES_BY_FI = 0
```

At closure set `ACTIVE_WRITER: NONE`, release the FI writer lock as
`RELEASED__FI00_FI17_COMPLETE`, set the lane to `COMPLETE__LOCAL`, and set the next FI
slice to none.

## FM handoff boundary

FM may read FI history, specifications, receipts, accepted FI-00 through FI-12
evidence, and current progress. FM writes only its own branch/worktree. Its current
migration target remains FI-00 through FI-12; FI-13 through FI-17 require a later owner
amendment before migration.

## Verification and stop conditions

Use focused test, local browser check, slice acceptance, checkpoint, then the next
slice. Reuse unchanged FI-00 through FI-13 evidence only when source, artifacts,
configuration, and runtime state relevant to that evidence have not changed.

Stop only for a wrong/divergent branch, unknown tracked product work, competing writer,
unsafe governance sync, a required schema/provider/Production/FM mutation, a protected
invariant that would need invention or weakening, or an unresolved P0/P1 outside this
accepted local scope.
