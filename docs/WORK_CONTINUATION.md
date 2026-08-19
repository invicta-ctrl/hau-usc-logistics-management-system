# Work Continuation

The current block is the operator resume record. Historical evidence remains reachable through Git history, release tags, CHANGELOG.md, and accepted specifications; it does not override the canonical current-task chain.

## Claude R3 frontend-design stream — LIVE

> **Progress lives in one place.** `docs/design/DESIGN_EXECUTION_TRACKER.md` is
> the canonical derived tracker. No other document — including this one — may
> state a completion percentage. Recompute with `npm run design:tracker`;
> `npm run design:tracker:check` fails if the derived block is stale.

- **Stream:** isolated Claude frontend-design stream, parallel to the v0.8.3–v0.8.5 product program. The product stream is a **separate git repository** (`worktrees/v081-production-execution-eb14cd81/.git`, branch `release/v0.8.3-identity-foundation`) and was never modified.
- **Worktree / branch:** `worktrees/spec-v073-frontend-design-integration` on `frontend-design-integration`, pushed to origin, 0/0 with upstream.
- **Reference truth:** production **0.8.2 @ `c316e047`**, schema 30, read from `git show c316e047:src/visual/*.js` — the exact deployed commit, not branch HEAD and not documentation. Live production probed read-only for version/health/host routing only; no form submitted, no credential entered.
- **Figma Design:** `hXJElH4p72KfgAaoUyfNOC` — 28 pages, 122 variables, 102 components. Two semantic tokens added to close real gaps: `color/accent/text` (gold/400 measured **1.52:1**, failed AA) and `color/text/on-accent` (action surface stays light gold in both modes).
- **Figma Make:** `rP9W9MQlZkyQrUx38TVsFS`. Readable via `get_design_context`; **not writable** by MCP — `use_figma` and `get_metadata` reject Make files. Edited through the browser instead. `PublicFlows.tsx` replaced and building (`[vite] connected.`, no error overlay).

### Highest-priority finding — resolved

Both the Figma design file and Figma Make asserted that public borrowing required staff sign-in. Make said it outright: *"Public data entry — Disabled"*, *"Sign in to start request"*, *"Sign in to request equipment"*. Production has **no session check, no sign-in gate and no authorization branch** in either public module. Four design frames superseded, `PublicFlows.tsx` replaced, and the rule written into `DESIGN.md` **D24.0 as OWNER-LOCKED** so it cannot drift again.

### Owner-directed design changes carrying contract deltas

| Change | Status | Delta |
|---|---|---|
| Borrower details become a basic information sheet — academic fields always collected, council role the only branch | Designed and built | None |
| Requested pickup date removed; only "Borrowing until" remains, pickup recorded by staff at handoff | Designed and built | **Production declares `pickupDate` required.** Needs an accepted amendment before implementation |
| Catalog is search-first — no grid until 2+ characters or a category choice | Designed and built | **Production renders the full catalog on mount.** Needs an accepted amendment before implementation |

### State

- **Done:** production contracts for all six surfaces read at the deployed commit; Public Lending and Public Request built across 1440 light/dark and 390 light/dark with declared states; Staff Request Center reconciled and completed; authenticated requester portal built; 22 Figma clipping faults repaired and the class re-scanned to zero; D-02 and D-04 closed; canonical gold **#D4AF37** adopted and reconciled system-wide; Figma Make recovered, audited and reconciled at Version 35; real keyboard and accessibility-tree acceptance passing.
- **Open:** Angelite branch and catalog states at 390; Make lending lifecycle and per-line review UI; remaining module pages; 2,941 non-gold one-off paints needing role decisions.
- **Blocked:** `FD-COLOUR` — the node ids of the 54 inferred colours were never recorded, so the set cannot be identified even with version history. Needs the Figma REST API with an owner token, or a manual version diff.
- **Not run:** Hallmark as its own pass; a screen-reader runtime test. Neither is claimed.
- **Boundary held:** no product code, release state, provider, database, migration or deployment write. One production defect candidate recorded and deliberately not fixed (PDC-01).
- **Verify with:** `npm run design:tracker:check`, `design:contrast`, `design:keyboard`, `design:semantics`.
- **Resume:** read `docs/design/DESIGN_EXECUTION_TRACKER.md` first — it is derived and current.

### What the Staff Request Center pass established

Production's Request Center is a **submission form with a review queue appended
below it**, and the queue exists only for a session holding `request.review`.
Figma had only the queue. Both halves now exist: the submission region is
`615:2` and the corrected per-line decision panel is `300:624`.

The route vocabulary was wrong in a way that inverted the lifecycle. Figma
offered *Accept and reserve*, *Fulfil from stock*, *Route to canvassing* and
*Send to Release Desk*; production's routes are `ISSUE_FROM_STOCK`,
`PROCUREMENT`, `RESTOCK`, `REJECT` and `MISSING_INFORMATION`. The Release Desk
contract (audit §15) independently confirms it: a request **arrives** there when
its lines reach a ready state, so review cannot send anything to it.

The record inspector was a fixed 380 × 380 hard clip over 2,086px of content, so
most of it never rendered. The same template was clipping Inventory, Lending Hub
and Release Desk. Root cause of the fragility was a queue container sitting
FILL-vertical inside a content-driven vertical parent, which starved to 1px the
moment a sibling grew. All 22 instances are repaired and a full-document rescan
returns zero.

## Branch-local frontend continuation — HISTORICAL (v0.7.3 GPT Sites candidate)

- **Worktree:** `D:/Documents/Codex/HAU-USC Logistics/worktrees/spec-v073-frontend-design-integration`.
- **Authority:** accepted `.codex/specs/active/v0.7.3-frontend-design-integration.md` plus Earl's 2026-08-09 instruction to continue Claude's exact state.
- **Recovery:** classification B, partial committed checkpoint at `85f064a`; Claude work and two untracked artifacts preserved.
- **Current state:** complete; candidate `0ccc0dee60a5eef79e57ef896bea25b4ea0284b1` pushed and published as GPT Sites version 1 with anonymous public access.
- **Public preview:** https://hau-usc-logistics-v41.adrianoearl04.chatgpt.site/portals; fresh cookie-free Chromium returned HTTP 200 with no account wall.
- **Evidence:** 842 unit tests; 146 applicable Playwright tests; generated parity; all required design reports and screenshot matrix; required widths, theme persistence, 3D/mobile/reduced-motion fallbacks, sanitized Request submission, menu/Escape, and Lending return passed on the public URL with zero `/api/` calls or browser errors.
- **Boundary:** front-end only; no backend, contract, migration, provider, protected-data, staging, production, merge, tag, or release action.
- **Resume:** no implementation work remains. Earl may review the public candidate; use `.codex/CURRENT_TASK.md` and `.codex/CURRENT_HANDOFF.md` for any separately authorized next action, and do not reconstruct from chat or restart from the design preview.

## Current resume block

- **Repository/worktree:** D:/Documents/Codex/HAU-USC Logistics/active/hau-usc-logistics-management-system; preserve ignored local evidence and unknown work.
- **Branch/HEAD/upstream:** Protected no-op closeout PR #19 merged to canonical `main` at `8b4ad05c6754b3de627535577d24216023dca8ca`; resolve current identity with `git branch --show-current`, `git rev-parse HEAD`, and `git rev-parse --abbrev-ref --symbolic-full-name @{upstream}`.
- **Current phase/stage:** V0.7.3 Rollout Stabilization is complete with `NO RUNTIME PATCH REQUIRED`; the writer lock is released and the next action is Earl's decision on a bounded v0.8.0 Inventory Truth and Ledger Lock specification.
- **Accepted scope:** .codex/specs/active/v0.7.3-rollout-stabilization.md is complete. No accepted v0.8.0 implementation specification exists, so only read-only intake and specification adoption are allowed.
- **Completed work:** Gate 0 closed v0.7.2.1; Gate 1 adopted the owner-submitted v0.7.3 amendment; focused Account, RV-01 Request, Lending, Inventory/Release, route, privacy, and safe-error acceptance found no eligible blocker. No runtime v0.7.3 was manufactured.
- **Files changed by purpose:** V0.7.3 specification and canonical continuity/status/changelog records only. Runtime source, tests, migrations, dependencies, deploy configuration, generated runtime artifacts, and product version remain unchanged.
- **Tests verified at current SHA:** 12 focused unit files 89/89; RV-01 local Worker/D1 19/19; ten coherent focused core Worker/D1 cases 10/10; Account/Public portal UI 6/6; governance, formatting, handoff, and secret-pattern checks pass. The exact `c4fa46f` complete repository gate, provider delivery/redemption/denials, backup/restore, integrity/FK, authentication/authorization, browser smoke, CodeQL, and fresh Sol review remain reusable because no runtime invalidator changed.
- **Generated artifacts:** None changed. Product version stays 0.7.2 and no v0.7.3 candidate/tag/release exists.
- **External actions:** Created and merged protected documentation-only PR #19 at exact head `e3a354128a8531f68ef3959ad978de0782eb70f6`, resolved its evidence-only review thread, and deleted only the merged temporary branch. Runtime/provider/environment checks were read-only. No provider send, staging mutation/reset/seed/deploy, production mutation/deploy, tag, release, or database write.
- **Rollback:** No rollback is required because no runtime/environment mutation occurred. Retain the private staging backup/restore and prior-Worker evidence; immutable production v0.7.2 remains unchanged.
- **Blocker:** NONE. The four missing staging brand-image endpoints are a cosmetic out-of-scope observation, not a rollout blocker.
- **Next three actions:** Ask Earl for the first bounded v0.8.0 objective; adopt a specification covering Inventory truth, ledger invariants, migration/recovery, acceptance, rollback, and stop conditions; then claim the writer lock only after acceptance.
- **Resume commands:** git status --short --branch; git rev-parse HEAD; git fetch --prune origin; git rev-list --left-right --count origin/main...HEAD; npm run handoff:verify; npm run check:governance.
- **Prohibited actions:** Do not implement v0.8.0 without an accepted specification; do not manufacture v0.7.3 code; do not repeat provider delivery/redemption or destructive sandbox reset/reseed; do not create live REQ/LBR rows that violate SBX-only classification; do not fix cosmetic brand assets under blocker-patch authority; do not mutate production or protected resources.
