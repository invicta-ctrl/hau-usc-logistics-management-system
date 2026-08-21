# FI-00 Reconciliation Receipt

What FI-00 did to `frontend-design-integration`, with the evidence. Read this
before FI-01 so you do not re-derive any of it.

```text
FI00_STATUS               COMPLETE
DATE                      2026-08-21, Asia/Manila
WRITER                    Claude Code / Claude Opus 5, High reasoning
                          sole branch-local writer under Earl explicit
                          task-specific override, FI-00 only
ACCEPTED_SPECIFICATION    .codex/specs/active/frontend-integration-fi00-branch-reconciliation.md
```

## 1. Identities

```text
START_HEAD                f0ab75d2481ea7a39cbe29d2b0a1e4d59f632970
START_TREE                1d20843c07bc407ec0fac757ec49dfb2d11c796c
START_UPSTREAM_PARITY     origin/frontend-design-integration 0 ahead / 0 behind
START_WORKTREE            CLEAN
START_DIVERGENCE          191 main-only commits, 95 branch-only commits

ORIGIN_MAIN_HEAD          86553349f5c2ebefaa637c30828c560a301f99ba
ORIGIN_MAIN_TREE          db95ebaafb7de421d02b12f0158bc1a93953edde
V083_TAG                  07aa2d2dfcee12fb1ec26fc5a3658ca9ca9be34e   ancestor of main
FROZEN_PRODUCT_CANDIDATE  f8e63372bc8afcb6d092970b7f9fc9ee72fd3580   ancestor of main
PRODUCTION_SCHEMA         32
PRODUCTION_MIGRATIONS     0031_canonical_identity_foundation.sql
                          0032_staff_account_activity_history.sql

PRE_FI00_ARCHIVE_REF      archive/frontend-design-pre-fi00-2026-08-21
  tag object              1d1dd518ad9bf9a05dc7fd446c589d891d74467f
  commit                  f0ab75d2481ea7a39cbe29d2b0a1e4d59f632970
  tree                    1d20843c07bc407ec0fac757ec49dfb2d11c796c
  pushed and read back    yes, from origin
```

Every volatile value was reverified live before acting. None had moved.

## 2. What was done, in order

```text
A  Rehydrated and verified Git state; confirmed no dirty work and no other writer.
B  Persisted the accepted FI-00 specification and took the branch-local lock.
   commit cd11ccf
C  Created and pushed the immutable pre-FI-00 archive tag.
D  Normal --no-ff merge of origin/main into frontend-design-integration.
   24 conflicts, resolved under the FI-00 authority.
E  Forced exact main parity across every runtime scope; proved zero main-file loss.
F  Governance converged; check:agents went from 9 errors to PASS.
G  Contained historical artifacts after proving recoverability.
H  Locked the clean-lineage promotion rule.
I  Carried D-08, D-04, D-02 to FI-01 and FI-02 unfixed.
J  Verified, updated the packet, rewrote continuity, committed and pushed.
```

No rebase. No force-push. No reset. No clean. No history rewrite. No
`filter-repo`. No ref deleted.

## 3. Conflict resolution

24 conflicts. Resolution followed section 5 of the accepted specification.

| Resolution                                | Files                                                                                                                                                                                                                                                                                                                                                     |
| ----------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Main wins** — runtime, build, generated | `src/index.html`, `src/visual/auth-gateway.js`, `src/visual/authenticated-account-controls.js`, `tests/e2e/role-experiences.spec.js`, `tests/e2e/v5-visual-acceptance.spec.js`, `package.json`, `eslint.config.js`, `dist/index.html`, `HAU-USC_Logistics-Prototype-Shareable.html`, `hau-usc-logistics-guided-demo.html`, 7 × `shareable-html-modules/*` |
| **Main wins** — project documentation     | `CHANGELOG.md`, `PRODUCT.md`, `docs/WORK_CONTINUATION.md`, `DESIGN.md`                                                                                                                                                                                                                                                                                    |
| **Branch, then rewritten** — continuity   | `.codex/CURRENT.md`, `.codex/CURRENT_TASK.md`, `.codex/CURRENT_HANDOFF.md`                                                                                                                                                                                                                                                                                |

`PROJECT_STATUS.md` auto-merged and kept the branch's stale "V4.1 front-end
candidate" heading. That is exactly the stale-status case the specification
forbids reviving, so it was reset to main.

`.gitignore` keeps the branch's one added rule, which ignores
`.impeccable/hook.cache.json`. That rule is retained because `.impeccable/**` is
retained.

## 4. Runtime parity — the core proof

```text
RUNTIME_PARITY_RESULT     PASS
files present on origin/main and ABSENT here          0
diff vs origin/main across every scope in 5A          0
```

Scopes proven byte and path equivalent to `origin/main`:

```text
src/**  apps-script/**  migrations/**  migration/**  cloudflare/**  public/**
tests/**  package.json  package-lock.json  vite.config.js  wrangler.jsonc
eslint.config.js  worker-configuration.d.ts  appsscript.json  playwright*.js
```

Spot proofs:

| Check                                                          | Result                                                                              |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `migrations/0031_canonical_identity_foundation.sql`            | blob `39dd85fa047b70f587cb240b07689e6dcedbfb38`, identical to main                  |
| `migrations/0032_staff_account_activity_history.sql`           | blob `6f9bdf0cdd02e348dd47afd0318e9af80dad1a08`, identical to main                  |
| migration file count                                           | 32, equal to main                                                                   |
| `src/v5/integration/*`                                         | 7 files, `git diff` vs main across `src/v5` = 0                                     |
| `src/server/identity-foundation`, `src/server/identity-roster` | 8 files, `git diff` vs `src/server` = 0                                             |
| test files                                                     | 146 unit / 2 integration / 25 e2e / 2 cloudflare-e2e / 3 staging-e2e, equal to main |
| `package.json` version                                         | 0.8.3                                                                               |

FI-00 authored **zero** runtime behavior change. Fourteen historical
branch-only runtime files were removed because main wins those scopes exactly:

```text
src/styles/visual/v0-7-2-r2.css          src/visual/landing-network.js
src/styles/visual/v4-1-integration.css   src/visual/module-index.js
src/styles/visual/v5-baseline-entry.css  src/visual/sanitized-preview-client.js
src/styles/visual/v5-production.css      src/visual/signature-controls.js
                                         src/visual/v5-production-adapter.js
tests/e2e/v41-production-integration.spec.js
tests/e2e/v41-visual-acceptance.spec.js
tests/e2e/v5-production-transfer.spec.js
tests/unit/v41-production-integration.test.js
tests/unit/v5-production-transfer.test.js
```

14 files, 109,569 bytes. All preserved in the archive tag.

## 5. Governance parity

```text
GOVERNANCE_PARITY_RESULT  PASS
check:agents              PASS (12 project files)   was: 9 policy-marker errors
```

Root cause, diagnosed rather than patched around: `AGENTS.md` and
`.agents/PROJECT_POLICY.md` were **already byte-identical** between the branch
and main (blobs `8ded446b` and `042a4183`). The failure came from the branch
carrying a superseded `scripts/check-agent-instructions.mjs` (`0ce245f5`) plus
two stale `.codex/agents/*.toml` definitions. Main's validator (`70d57cb8`) and
main's agent definitions won the merge, and the check passed with no policy text
edited.

This is convergence, not a policy rewrite. No canonical Context Vault file was
touched.

## 6. Artifact containment

```text
ARTIFACT_CONTAINMENT_RESULT      PASS
ACTIVE_TREE_FILES_REMOVED        1,078   (containment)  + 14 (runtime scope)
ACTIVE_TREE_BYTES_REMOVED        136,496,010            + 109,569
ARCHIVE_PRESERVATION_REF         archive/frontend-design-pre-fi00-2026-08-21
RETAINED_DESIGN_SOURCE_COUNT     115 files across 9 retained areas
UNCLASSIFIED_LOAD_BEARING_ITEMS  0
```

Active-tree reduction:

```text
pre-FI-00 branch tree     1,894 files    167,117,742 bytes
origin/main                 851 files     22,939,630 bytes
FI-00 reconciled            978 files     25,666,831 bytes

reduction vs pre-FI-00      916 files    141,450,911 bytes
surplus over main           127 files      2,727,201 bytes
```

This is **active-tree** reduction only. Repository size is unchanged: the
history and the archive tag still hold every object. History retention is a
separate decision that FI-00 does not make.

Retention was dependency-proven. `scripts/design/*.mjs` references exactly
`output/design/make-adoption/**`,
`output/design/make-preservation/{index.css,theme.v36.css}`,
`prototypes/public-portals-r3/figma-make/src/styles/theme-canonical.css`, and
`prototypes/shared/hau-theme.css` — all retained. No retained code file imports a
removed path. All 1,078 removal candidates were verified present in the archive
tag tree before removal; zero were unrecoverable.

Full detail, including the reclassification table, is in
[FRONTEND_SOURCE_DISPOSITION.md](FRONTEND_SOURCE_DISPOSITION.md) section 10.

## 7. Figma and Make reference status

```text
FIGMA_MAKE_REFERENCE_STATUS   RECOVERABLE_FROM_GIT, unchanged and reverified
FIGMA_WRITES                  0
FIGMA_READS                   0   (no provider access was required for FI-00)
```

Hashes recomputed on the reconciled tree, all matching the register:

| File                                                                     |   Bytes | sha256 (first 16)  |
| ------------------------------------------------------------------------ | ------: | ------------------ |
| `output/design/make-adoption/theme.css`                                  |  20,453 | `249857a93f0f9042` |
| `output/design/make-preservation/theme.v36.css`                          |   9,419 | `50cb55de9d8e20ad` |
| `output/design/make-preservation/appRoutes.ts`                           |   1,047 | `a0de837a82089720` |
| `prototypes/public-portals-r3/figma-make/src/styles/theme-canonical.css` |  11,033 | `2542f712cd0de2c1` |
| `prototypes/shared/hau-theme.css`                                        |   7,816 | `5922ec25b1ea185c` |
| `scripts/design/theme-source.mjs`                                        |  15,220 | `a5246678ff4b2540` |
| `docs/design/design-reference/v5-theme-final.css`                        |  11,467 | `849e8bd4c265bea5` |
| `docs/design/DESIGN_AUTHORITY.md`                                        | 128,015 | `2c98391d139b1c62` |

The Make source path locations are **unchanged**, so
[FIGMA_MAKE_SOURCE_REGISTER.md](FIGMA_MAKE_SOURCE_REGISTER.md) needed no path or
hash churn. `output/design/make-adoption/` and `output/design/make-preservation/`
were deliberately kept in place rather than relocated: they are captured provider
source, not generated build output, and the register already documents them.

Three of the four design verifiers were re-run on the reconciled tree and pass:

```text
node scripts/design/build-make-theme.mjs --check    PASS  theme-canonical.css is current
node scripts/design/verify-make-theme.mjs           PASS  no superseded value survives
node scripts/design/verify-make-landing-theme.mjs   PASS  31/31 landing tokens conform
node scripts/design/theme-source.mjs --check        PASS  contrast ladder emitted
```

`node scripts/design/build-make-routes.mjs --check` is unavailable: it imports
`esbuild`, which is not a declared dependency in `package.json` on main or on the
pre-FI-00 branch. Pre-existing, not an FI-00 regression. Declaring it is an FI-01
owner decision.

The `design:*` npm aliases quoted throughout the historical design records do not
exist in the v0.8.3 `package.json`. Those records are historical evidence of what
was run at the time and were left unedited; the forward-looking packet documents
now name the direct `node` invocations.

## 8. Verification run for FI-00

`docs/design/DESIGN_AUTHORITY.md` is deliberately excluded from the Prettier
rewrite. Reflowing 128 KB of design authority to `printWidth: 110` would make it
diverge visibly from the archived original for no content gain, and it would sit
inconsistently beside the 28 other historical design documents on this branch
that have never been Prettier-formatted either. It passes `git diff --check`;
its Prettier warning is expected and matches the precedent this branch already
recorded in Phase 9 for the preserved historical handoff body.

```text
check:agents            PASS   12 project files
handoff:verify          PASS   canonical records, Git state, secret scan
check:continuation      PASS   14 required fields
prettier --check        PASS   every touched document except the two byte-exact
                               relocations, which are deliberately excluded
                               28 unrelated historical design documents were
                               already unformatted before FI-00 and are untouched
git diff --check        PASS
intra-doc references    PASS
secret / private scan   PASS
main-file loss          0
runtime diff vs main    0
```

`npm run check` was deliberately not run. Every build and runtime input is
byte-identical to `origin/main`, which already passed that gate at
`86553349`. `.agents/PROJECT_POLICY.md` forbids rerunning expensive suites after
a documentation-only change purely for ceremony, and FI-00 authored no runtime
change. The gate becomes required again the moment FI-01 edits a build or runtime
input.

## 9. Carried forward to FI-01 and FI-02, unfixed by design

```text
D-08  HIGH   17 landing-hero text nodes measure ~1.01:1 to 1.84:1 contrast.
             Must be corrected before FI-02 visual acceptance. Replicating the
             Figma defect exactly is not success when it violates accessibility.
             The cards may encode an intentional active/inactive distinction, so
             this is a state-semantics decision, not a mechanical recolour.

D-04         Three conflicting typeface realities: Production Georgia + Aptos,
             DESIGN_AUTHORITY.md D09 Bricolage / IBM Plex Sans / Newsreader, and
             Figma Inter. Must resolve to one canonical typography authority
             before FI-01 broad surface adoption.

D-02         The blur ladder is defined twice and the definitions disagree:
             variables 12/18/24/28 against effect styles 16/22/30/36. Only the
             effect styles render. Must resolve to one canonical blur and glass
             token source before FI-01 broad surface adoption.
```

FI-00 modified no runtime UI and made no Figma call.

## 10. Owner decisions still open

```text
1. D-04 typography authority.                                    blocks FI-01
2. D-02 blur and glass token source.                             blocks FI-01
3. D-08 landing hero ink and active/inactive state semantics.    blocks FI-02
4. Whether to declare `esbuild` so the Make route-rebuild check can run.
5. Whether the retained design packet is promoted to main at FI-15, or stays
   branch-only with the archive tag as its permanent home.
```

## 11. Boundary attestation

```text
RUNTIME CHANGES AUTHORED BY FI-00   0
BACKEND CHANGES                     0
MIGRATIONS                          0   0031 and 0032 untouched, never rerun
AUTH / SESSION / CSRF CHANGES       0
WORKER / API CONTRACT CHANGES       0
D1 / R2 / GOOGLE / PROVIDER WRITES  0
FIGMA WRITES                        0
PLAYGROUND WRITES                   0
PRODUCTION WRITES                   0
RECOVERY POINTER CHANGES            0
MERGES INTO MAIN                    0
HISTORY REWRITES                    0
REFS DELETED                        0
WORKTREES DELETED                   0
```

The orphan `spec-v073-frontend-design-integration` directory was left untouched,
as the specification requires.

## 12. Final state

```text
FINAL_HEAD           see .codex/CURRENT_HANDOFF.md
FINAL_TREE           see .codex/CURRENT_HANDOFF.md
UPSTREAM_PARITY      origin/frontend-design-integration, verified 0 ahead / 0 behind
ACTIVE_WRITER        NONE
WRITER_LOCK          RELEASED
HANDOFF_STATUS       READY_FOR_FI01
NEXT_SLICE           FI-01 — Shared Design Foundation
```

## STALE_IF

```text
origin/main moves beyond 86553349f5c2ebefaa637c30828c560a301f99ba
archive/frontend-design-pre-fi00-2026-08-21 no longer resolves to f0ab75d
git diff --name-status origin/main HEAD reports any D entry
any runtime-scope path diverges from origin/main
check:agents stops passing
```

Cheap re-verification:

```bash
git diff --name-status origin/main HEAD --diff-filter=D | wc -l
```
