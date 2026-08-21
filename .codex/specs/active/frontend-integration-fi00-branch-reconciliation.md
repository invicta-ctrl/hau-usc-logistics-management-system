# FI-00 — Frontend Branch Reconciliation

Status: **ACCEPTED**
Owner: Earl
Accepted: 2026-08-21, Asia/Manila — owner instruction issued directly as this specification
Writer: Claude Code / Claude Opus 5, High reasoning — explicit task-specific override
Branch: `frontend-design-integration`
Worktree: `D:/Documents/Codex/HAU-USC Logistics/worktrees/frontend-design-integration`

> This specification is the durable, content-equivalent record of Earl's
> 2026-08-21 FI-00 instruction. It supersedes
> `.codex/specs/active/v0.7.3-frontend-design-integration.md` as `ACCEPTED_SPEC`
> for this branch. That earlier specification remains preserved as historical
> design-stream authority and is not current functional authority.

## 0. Owner authorization and its exact bounds

Earl authorizes Claude Code / Claude Opus 5 as the **sole branch-local writer**
for FI-00 on `frontend-design-integration`.

This is a task-specific model and writer override for FI-00 only. It does not
permanently modify the repository's Sol / Terra / Luna governance, and it does
not authorize writes to any other HAU-USC branch, Production, the Isolated
Staging Playground, Figma, providers, D1, R2, Google resources, recovery
pointers, or the Context Vault.

## 1. Objective

Make `frontend-design-integration` safe to use as the temporary
frontend-integration implementation branch by:

1. bringing current `origin/main` into it losslessly through a normal merge;
2. making current main authoritative for every product, runtime, security,
   data, build, and governance contract;
3. preserving the approved frontend and Figma evidence;
4. containing obsolete or bulky historical artifacts after proving they remain
   recoverable;
5. leaving a clean handoff for FI-01 without implementing any frontend.

## 2. Why FI-00 is blocking

The Claude preparation packet (`f0ab75d`) recorded three branch-level blockers.

```text
LOSS RISK        The historical frontend tree lacks 135 files that current main
                 has, including migrations/0031_canonical_identity_foundation.sql,
                 migrations/0032_staff_account_activity_history.sql, and the whole
                 src/v5/integration/* adapter layer. Merging the branch into main
                 before reconciliation would delete frozen v0.8.3 work.

ARTIFACT WEIGHT  Roughly 1,170 branch-only design, prototype, and output files,
                 including about 904 PNG screenshots, totalling about 138.8 MB.
                 This must not become the active Production lineage.

GOVERNANCE DRIFT `check:agents` was a known pre-existing non-pass on this branch
                 with nine policy-marker errors.
```

Consequences, in force until FI-00 is accepted:

```text
Do NOT merge frontend-design-integration into main.
Do NOT use the historical frontend branch as functional authority.
Do NOT start FI-01.
```

## 3. Authority order

1. Earl's current instruction and this FI-00 specification.
2. Registered canonical Context Vault governance — only the minimum needed to
   validate the managed `AGENTS.md` and project-policy copies.
3. `origin/main` current/frozen v0.8.3 repository governance and technical state.
4. The `frontend-design-integration` Claude preparation packet.
5. Frozen v0.8.3 code, tests, migrations, release evidence, backend contracts.
6. Figma / Figma Make evidence — visual and reference authority only.
7. Historical frontend-branch material — preservation and design evidence only.

Resolution rule:

```text
MAIN            product, runtime, security, data, backend, governance truth
FRONTEND BRANCH design evidence, integration preparation, future implementation
FIGMA           visual and interaction reference only

On conflict, current main behavior wins. v0.8.3 product decisions are not reopened.
```

## 4. Scope

In scope:

- persisting this specification and initializing the branch-local FI-00 lock;
- immutably preserving the exact pre-FI-00 frontend branch head;
- a normal, non-rebase merge of current `origin/main` into the branch;
- conflict resolution under section 5;
- proof of zero current-main product loss and runtime parity;
- governance convergence until `check:agents` passes;
- classification-driven containment of historical artifacts in the active tree;
- recording the clean-lineage promotion strategy;
- carrying D-08, D-04, and D-02 forward as FI-01/FI-02 blockers;
- updating the preparation packet and the branch-local continuity records;
- coherent commits and a normal push.

## 5. Conflict-resolution authority

### A. Main wins exactly — product, runtime, security, data, build

```text
src/**            apps-script/**    migrations/**     migration/**
cloudflare/**     public/**         tests/**          package.json
package-lock.json vite.config.js    wrangler.jsonc    eslint.config.js
playwright*.js    worker-configuration.d.ts           appsscript.json
runtime and deployment scripts that exist on main
security, auth, data, and release configuration
```

Historical frontend-branch implementations in these areas are not reusable
runtime authority.

### B. Main and canonical governance win

`AGENTS.md`, `.agents/PROJECT_POLICY.md`, `.codex/agents/**`, `.codex/config.toml`,
and shared governance scripts and validators take the current registered version
already governing main. This is convergence, not policy redesign. Do not invent
or edit policy text.

### C. Branch-local continuity is synthesized

`.codex/CURRENT.md`, `.codex/CURRENT_TASK.md`, and `.codex/CURRENT_HANDOFF.md`
are rewritten to describe true FI-00 state, preserving current governed
authority, the current-main functional baseline, the Claude preparation
identity, this specification, exact writer and lock status, the archive receipt,
and the next action.

### D. Frontend preparation and design material is preserved selectively

`docs/design/**`, `scripts/design/**`, `prototypes/**`, `DESIGN.md`, preserved
Figma Make source, and design manifests and generators are governed by
`docs/design/FRONTEND_SOURCE_DISPOSITION.md`. Do not blindly retain everything
under those paths; apply the classification.

### E. Other documentation

Prefer current main unless a file carries verified unique frontend-design
evidence that the source-disposition map explicitly preserves. Do not revive
stale project-status, release-status, or v0.7.x / v0.8.1 operational authority.

## 6. Preservation rules

- The exact pre-FI-00 branch head is preserved by an immutable archive ref
  before any containment removal.
- Nothing is removed from the active tree until it is proven recoverable from
  that archive or another accepted immutable record.
- No unique small design or Figma Make source file is removed; if it lives
  inside a bulk family being removed, it is relocated into the accepted small
  reference structure with byte and hash parity proven and the register updated.
- No history rewrite, no `filter-repo`, no force-push, no reset, no clean, no
  deletion of unclassified unique work.
- Active-tree reduction is reported as active-tree reduction only. Repository
  size is not claimed to shrink; history retention is a separate decision.

## 7. Clean-lineage promotion rule

The historical frontend branch must not eventually be normal-merged into `main`,
because that would make its historical ancestry and legacy blobs part of the
protected mainline history.

```text
frontend-design-integration
-> FI-01 ... FI-12 implementation
-> exact candidate freeze
-> Isolated Staging Playground
-> automated verification
-> Earl manual acceptance
-> explicit Production GO
-> CLEAN-LINEAGE protected-main integration
-> prove main tree and application-artifact equivalence
-> Production
-> smoke, reconciliation, rollback readiness
-> delete frontend-design-integration after no-unique-work proof
```

Preferred final method is a **squash merge** of the accepted final tree through
the protected PR path. If repository protection cannot safely squash while
preserving the exact accepted application tree, create a fresh promotion branch
from accepted current main, apply the final integration delta deterministically,
prove tree and application-artifact identity against the Playground-accepted
candidate, and promote through that clean branch. A normal historical-branch
merge is not chosen merely because it is easier.

FI-00 documents this strategy only. It does not open or merge the Production PR.

## 8. Deferred visual defects

FI-00 does not repair these. They are carried as explicit FI-01 / FI-02
acceptance blockers.

```text
D-08  HIGH  17 landing-hero text nodes measure ~1.01:1 to 1.84:1 contrast.
            Must be corrected before visual acceptance. Replicating the Figma
            defect exactly is not success when it violates accessibility.
D-04        Three conflicting typeface realities. Must resolve to one canonical
            typography authority before broad surface adoption.
D-02        Blur ladder defined twice. Must resolve to one canonical blur/glass
            token source before broad surface adoption.
```

## 9. Acceptance criteria

- Current main and frontend branch identities freshly verified.
- Worktree clean at start, or all known work explicitly preserved.
- Claude recorded as the sole FI-00 branch writer under a durable override.
- Exact pre-FI-00 frontend head immutably preserved.
- Current `origin/main` merged normally into the branch; no rebase, force-push,
  reset, clean, or history rewrite.
- Every current-main functional, runtime, build, security, and data file survives.
- Migrations 0031 and 0032 survive exactly.
- `src/v5/integration/*` and all frozen-v0.8.3 identity and activity-history work survive.
- Product, runtime, and build inputs are byte and path equivalent to current main.
- No FI-00-authored runtime behavior change relative to main.
- Root AGENTS and project policy converge to current registered governance.
- `check:agents` passes.
- Branch-local `.codex` records accurately describe FI-00 and FI-01 continuity.
- Historical design artifacts fully classified before active-tree removal.
- Unique design and Figma Make source preserved with hashes.
- Bulky generated or history-only artifacts removed from the active tree where safe.
- The pre-FI-00 archive proves removed artifacts remain recoverable.
- `UNCLASSIFIED_LOAD_BEARING_ITEMS = 0`.
- The clean-lineage promotion rule is recorded and forbids a normal historical merge.
- D-08, D-04, D-02 carried forward, neither silently fixed nor dropped.
- `handoff:verify`, continuation validation, formatting, `git diff --check`, path
  checks, and the secret scan pass.
- The full product suite is not rerun unless a real build or runtime invalidator
  is discovered.
- Coherent FI-00 commits pushed normally; `origin/frontend-design-integration`
  equals local final HEAD.
- `ACTIVE_WRITER: NONE`, `WRITER_LOCK: RELEASED`, `HANDOFF_STATUS: READY_FOR_FI01`.

## 10. Out of scope

Implementing FI-01 or any frontend component; altering current main product
behavior; adding a migration; rerunning 0031 or 0032; changing authentication,
session, CSRF, or authorization; changing Worker or API contracts; changing D1,
R2, Google, or provider resources; deploying Playground or Production; mutating
Figma Design or Figma Make; merging the frontend branch into main; opening the
Production PR; rotating recovery refs; deleting the active frontend branch or
unrelated worktrees; cleaning the orphan `spec-v073-frontend-design-integration`
directory; repository-history rewriting; filtering large objects from history;
silently removing unique design evidence; Hallmark or Impeccable redesign work;
fixing D-08, D-04, or D-02.

## 11. Stop conditions

Stop the affected operation and report the exact blocker when: current main
moves in a way that changes the accepted frozen functional baseline; the branch
has unknown dirty or unpushed work; another writer owns the branch; pre-FI-00
history cannot be preserved; the merge requires force, rebase, or history
rewrite; a runtime conflict cannot be resolved by the main-wins rule without
losing accepted design evidence; `check:agents` cannot be made green by
convergence; a supposedly historical artifact is the only copy of required Make
or design source and cannot be safely preserved; private data or secrets appear
in preservation or design evidence; the branch needs a new migration, backend, or
API behavior to become reconcilable; Figma, provider, Playground, or Production
mutation becomes necessary; any load-bearing item remains `UNVERIFIED` at
closeout.

Do not solve a stop condition by broadening scope.

## 12. Next slice

```text
NEXT_EXACT_ACTION: FI-01_SHARED_DESIGN_FOUNDATION
```

FI-01 is the shared design foundation slice — tokens, primitives, theme, and
typography — and it is blocked until D-04 and D-02 are resolved by owner
decision. See `docs/design/FRONTEND_INTEGRATION_EXECUTION_PLAN.md`.
