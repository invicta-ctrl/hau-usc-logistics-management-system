# FVR-001-A2 - Native Figma MCP Truncation Recovery

STATUS: ACCEPTED
OWNER: Earl
DATE: 2026-08-22
AMENDS: `.codex/specs/accepted/2026-08-22-fvr001-atomic-figma-frontend-cutover.md`; `.codex/specs/accepted/2026-08-22-fvr001-a1-figma-design-source-limitation.md`

## Authority and finding

Native Figma Make retrieval succeeded for 200 current source/resources. The MCP transport inserted literal `...N tokens truncated...` markers into 47 returned large source files. Those markers are a transport-limit artifact, not source authority.

The six transport-limited files reachable from the new production entry are:

- `src/frontend/app/PublicFlows.tsx`
- `src/frontend/app/RequestCenterRoute.tsx`
- `src/frontend/assets/production/combinedLockup.ts`
- `src/frontend/assets/production/currentProductionCover.ts`
- `src/frontend/assets/production/loginBackground.ts`
- `src/frontend/assets/production/uscLogo.ts`

The remaining 41 files are generated/reference `src/imports/**` material and are not runtime reachable. Preserve a manifest of all 47 as explicitly incomplete evidence under `output/design/figma-make-source`; do not copy, import, or claim byte-completeness for a transport-limited mirror in the active production graph.

## Authorized exact recovery

The following preserved current Make v39 source mirrors are authorized replacements, not V5 visual authority:

- Replace `src/frontend/app/PublicFlows.tsx` from `output/design/make-adoption/PublicFlows.tsx`. The native current source prefix before `...1184 tokens truncated...` matches byte-for-byte for 22,746 characters; its suffix matches byte-for-byte for 23,424 characters except terminal newline.
- Replace `src/frontend/app/RequestCenterRoute.tsx` from `output/design/make-adoption/RequestCenterRoute.tsx`. The native current source prefix before `...495 tokens truncated...` matches byte-for-byte for 21,611 characters; its suffix matches byte-for-byte for 23,051 characters except terminal newline.

Record hashes and proof in the A2 receipt.

## Production asset and advertisement recovery

Use the accepted backend media contracts, not corrupt or truncated inline data:

- `combinedLockup` = `/brand/combined-lockup`
- `loginBackground` = `/brand/login-background`
- `uscLogo` = `/brand/usc-logo`
- Preserve complete Make-native `dolLogo`, `defaultItemImage`, and `favicon` modules when valid, or use their accepted `/brand/*` backend paths where the source architecture prefers a URL.

Delete or exclude the corrupted active `src/frontend/assets/production/currentProductionCover.ts` module and remove its imports. Literal truncation markers must not remain anywhere in the reachable active source graph.

Replace the static prototype-only cover with the accepted real public advertisement integration: request `GET /api/public/advertisements`, use each published `imageUrl` under `/media/advertisements/<id>`, and implement loading, populated, empty, request-error, and media-error states within the Figma-native Landing/Current hierarchy. Do not alter Figma hierarchy, typography, colors, spacing, or motion; do not hardcode an advertisement ID or title; retain real `altText`; and do not let an advertisement replace the canonical logistics hero. An empty published feed uses the Make-designed intentional empty state, not fabricated event data.

## Required evidence and remaining FVR-001 gates

Create `docs/frontend/FIGMA_MCP_TRUNCATION_RECOVERY.md` and a machine-readable or Markdown manifest of all 47 transport-limited mirrors, the six reachable files, their exact disposition, hashes, and source proof.

Move `react` and `react-dom` to runtime `dependencies`; leave `@vitejs/plugin-react` and build/test tooling in `devDependencies`. Inspect and classify each of the eight high `npm audit` findings as production-runtime or dev-tooling; do not run blind `npm audit fix`.

Then resume only the accepted atomic cutover: repair source; implement the thin adapter from accepted server/Worker/auth contracts and tests; preserve endpoint, session/cookie, CSRF, capability, authorization, D1/R2, ledger/audit, privacy, and provider behavior; and run the guarded Playground preview without Production crossover. Verify FI-00 through FI-03, landing animation, reduced motion, responsive/mobile, light/dark, keyboard/focus, accessibility, and Make visual parity.

Only after all pre-delete gates pass, remove every active V5 source, script, test, config, specification, plan, document, generated artifact, and reference identified by the accepted manifest. Regenerate outputs and run zero-V5 greps, lockfile integrity, lint, build, `verify:dist`, unit, frontend E2E, Cloudflare dry-run/build, guarded Playground preview, and complete diff review. One coherent commit, push/readback, current records/receipt, and lock release follow successful evidence. Governed clean-lineage main promotion and the parked v0.8.4 baseline update remain conditional on exactly preserving the known uncommitted main-governance work. If that is not possible, stop at the promotion gate with this frontend branch clean and pushed. Production deployment is forbidden.

## Non-negotiable exclusions

Do not use `@figma/codex_apps`; do not use V5 as visual or architectural authority; do not delete V5 before replacement and rollback gates; keep the existing writer lock during this continuation; do not use subagents; and do not claim tests, deletions, tags, commits, pushes, merges, or worktree updates without direct verification.
