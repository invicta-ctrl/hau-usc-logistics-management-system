# MFR-002 U10 Cleanup and Archive Manifest

PROGRAM: HAU-USC-MFR-002
PHASE: U10_WORKER_CACHE_SECURITY_REPOSITORY
STATUS: COMPLETE_NO_ELIGIBLE_DELETION
BASE_PLAYGROUND_SHA: 6397780e3a22919cd5637507dd840e14465bf64a
BASE_PLAYGROUND_TREE: 67ddcc7d699026a09ce27ac5f8865a52ed3ee57f
AUDIT_SCOPE: Active package/build/Worker/static paths, named loose-source candidates, and current-named historical pointers only.
AUTHORITY: Accepted MFR-002 U10 contract and repository source/reference evidence.

## Production dependency classification

The canonical production set is already reduced to three packages. Direct imports prove all three are active; no package removal or lockfile rewrite is justified.

| Dependency     | Classification    | Direct evidence                                                                |
| -------------- | ----------------- | ------------------------------------------------------------------------------ |
| `react`        | `PRODUCTION_USED` | React components and hooks throughout `src/frontend/**`; entry in `main.jsx`.  |
| `react-dom`    | `PRODUCTION_USED` | `createRoot` import in `src/frontend/main.jsx`.                                |
| `lucide-react` | `PRODUCTION_USED` | Direct icon imports in the shell, public, Inventory, Request, Lending, and UI. |

The development packages are also proven by direct configuration, script, or test use:

- `@eslint/js` and `globals`: `eslint.config.js`;
- `@playwright/test`: registered browser and Cloudflare acceptance suites;
- `@tailwindcss/vite`, `@vitejs/plugin-react`, `tailwindcss`, and `vite`: `vite.config.js` and canonical builds;
- `eslint`, `prettier`, and `vitest`: package gates and unit/integration suites;
- `wrangler`: Cloudflare types, dry-run, deployment, reset, and D1/R2 tooling.

DEPENDENCY_REMOVAL: ZERO
SCRIPT_REMOVAL: ZERO
PACKAGE_JSON_CHANGE: ZERO
LOCKFILE_CHANGE: ZERO

## Build, fixture, media, and font disposition

- `package.json` and `vite.config.js` contain no active shareable build or deploy pipeline.
- The remaining demo/preview identifiers belong to explicit preview fixtures, fixture-boundary verification, design generators, or isolated Playground operations. They are not deletion evidence.
- The institutional hero remains poster-first and user-requested; its large motion chunks stay off the initial critical path and retain byte-parity verification. U10 has no measurement proving that removal or recompression would improve the accepted product.
- Protected evidence originals and R2 handling are unchanged.
- No WOFF, WOFF2, TTF, or OTF file exists under `src`; therefore there is no font binary to remove or preload to consolidate.

FONT_BINARY_COUNT: ZERO
MEDIA_DELETION_OR_RECOMPRESSION: ZERO
PROTECTED_EVIDENCE_CHANGE: ZERO

## Documentation and source disposition

The only active cross-session current chain remains:

- `.codex/CURRENT.md`
- `.codex/CURRENT_TASK.md`
- `.codex/CURRENT_HANDOFF.md`

`docs/ARCHITECTURE.md`, `docs/ISOLATED_STAGING_PLAYGROUND.md`, and the accepted performance evidence retain distinct current roles. The files named `IMPECCABLE_V2_CURRENT.md`, `IMPECCABLE_V3_CURRENT.md`, `IMPECCABLE_V4_CURRENT.md`, and `V0_4_2_FRONTEND_CURRENT.md` are referenced by their matching historical handoffs/resume prompts. Moving or deleting them would break retained evidence links, so they remain preserved historical program pointers and do not compete with the canonical current chain.

The accepted specification's loose-source cleanup candidates are absent at the repository root:

- `SDD Implementation Review.txt`
- `Project Status Summary PDF.txt`
- `Lending Center Fixes.txt`
- `AGENTS(3).md`

No unknown file, historical receipt, accepted specification, screenshot, private meeting artifact, branch, worktree, or external resource was deleted or moved.

DOCUMENT_DELETION_OR_MOVE: ZERO
UNKNOWN_DELETION: ZERO
HISTORICAL_EVIDENCE_PRESERVED: YES

## Verification and rollback

Evidence was generated with targeted `rg` file/import/reference searches, direct package/config inspection, exact Git status, and focused tests. The manifest deliberately records a zero-deletion decision because no candidate passed the required inventory, dependency, unique-content, replacement, and reference gates.

Rollback is removal of this manifest and its focused contract only. No dependency, script, document, artifact, provider, schema, data, main, or Production rollback is required.
