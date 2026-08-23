# R3-A1 documentation reconciliation manifest

DATE: 2026-08-23
BRANCH: frontend-design-integration
AMENDMENT: `.codex/specs/accepted/2026-08-23-r3-a1-figma-make-design-sync-codex-preview-handoff.md`
RECEIPT: `.codex/R3_A1_FIGMA_MAKE_DESIGN_SYNC_RECEIPT.md`

## Method, stated honestly

R3-A1 §17 requires every tracked documentation file to be inventoried and
classified, and every file whose **current** claims are affected to be updated —
not that every file be edited.

The tracked doc-like inventory on this branch is **313 files** (`*.md`, `*.txt`,
and documentation JSON under `.codex/`, `.impeccable/`, `.hallmark/`), excluding
`node_modules`, `legacy/` and `archive*/`.

Those 313 were swept mechanically for the stale-claim patterns R3-A1 §28 names:

```text
FIGMA_WRITE: FORBIDDEN      PROVIDER_WRITE: FORBIDDEN
Staff Request Center        Version 39
BLOCKED_PARTIAL_FVR02       DeepSeek V4 Pro #1
"is documentation and historical reference"
```

Every file that matched was opened and classified individually. Files that
matched nothing were classified by directory class and **not** opened one by one.
That distinction is recorded per row below rather than implied, so a later
session knows exactly how much scrutiny each row carries.

## Classification legend

`CURRENT_AUTHORITY` · `CURRENT_CONTINUITY` · `CURRENT_EVIDENCE` ·
`HISTORICAL_EVIDENCE` · `REFERENCE_ONLY` · `SUPERSEDED_BUT_PRESERVED` ·
`UNRELATED_TO_R3_A1`

Actions: `UPDATED` · `PRESERVED_HISTORICAL` · `MARKED_SUPERSEDED` ·
`AUDITED_NO_CHANGE` · `AUDITED_BY_CLASS`

## Individually opened and reconciled

| Path | Classification | Affected | Action | Authority after A1 | Notes |
|---|---|---|---|---|---|
| `DESIGN.md` | CURRENT_AUTHORITY | YES | UPDATED | Canonical design authority | Rewritten to the post-R3-A1 model: authority hierarchy, public/staff workflow diagram, provider identity, Codex adoption. Machine-readable `colors`/`typography`/`rounded` frontmatter added so the Impeccable detector has a real palette. Carries the D24.0 correction of record. |
| `docs/frontend/WORKFLOW_ARCHITECTURE.md` | CURRENT_AUTHORITY | YES | UPDATED | Frontend route and workflow ownership | D24.0 citation corrected; §7 Figma relationship rewritten from "no write performed / awaiting authority" to the R3-A1 outcome; FE-R3-010 closed, FE-R3-011 re-scoped, **FE-R3-012 opened**. |
| `.codex/CURRENT.md` | CURRENT_CONTINUITY | YES | UPDATED | Current work pointer | Milestone moved from FVR-02 to R3-A1. Provider-write block now records the bounded authority. Stale `GUARDED_PREVIEW … RUNNING` replaced with the verified truth that no listener exists. |
| `.codex/CURRENT_TASK.md` | CURRENT_CONTINUITY | YES | UPDATED | Bounded task | Now the Codex preview-adoption task. |
| `.codex/CURRENT_HANDOFF.md` | CURRENT_CONTINUITY | YES | UPDATED | Codex handoff | Traceability map, provider identity, must-read and must-not-trust lists, verified preview command, resume block. |
| `.codex/R3_A1_FIGMA_MAKE_DESIGN_SYNC_RECEIPT.md` | CURRENT_EVIDENCE | YES | UPDATED | R3-A1 receipt | Created mid-pass while the Make changeset was unsaved, then updated to the verified v40 outcome. Retains the save-incident narrative as history. |
| `.codex/specs/accepted/2026-08-23-r3-a1-…handoff.md` | CURRENT_AUTHORITY | YES | UPDATED | Accepted amendment | New. The explicit bounded provider-write authority. |
| `.codex/specs/README.md` | CURRENT_AUTHORITY | YES | UPDATED | Spec index | Corrected: the current pointer may name a spec under `accepted/`, not only `active/`. Records that FVR-02's `FIGMA_WRITE: FORBIDDEN` front matter and its DeepSeek/Sol writer contract are historical. |
| `docs/WORK_CONTINUATION.md` | CURRENT_CONTINUITY | YES | UPDATED | Resume block (gated by `check:continuation`) | Rewritten to R3-A1. Its previous next-action was "grant or withhold Figma/Make write authority" — granted and exercised. |
| `docs/design/FIGMA_MAKE_SOURCE_REGISTER.md` | CURRENT_EVIDENCE | YES | UPDATED | Make source identity | v39 → v40, mirror refreshed, per-file bytes and sha256, and an explicit statement of how far each file is verified. Corrects its own false claim that no MCP tool can read a `/make/` URL. |
| `docs/design/FIGMA_BASELINE_REGISTER.md` | CURRENT_EVIDENCE | YES | UPDATED | Figma baseline identity | New append-only baseline `DESIGN_BASELINE_2026-08-23-R3A1`. Records the connector page-list truncation as resolved so it is not reopened as a defect. |
| `docs/design/HALLMARK_IMPECCABLE_CLOSURE.md` | CURRENT_EVIDENCE | YES | UPDATED | Canonical design-audit record | Third bounded pass appended: Impeccable 27 → 7 measured before/after, Hallmark 0 critical · 1 major · 3 minor, and the two generic heuristics deliberately not applied. |
| `.impeccable/design.json` | CURRENT_AUTHORITY | YES | UPDATED | Impeccable design sidecar | Rebuilt at schemaVersion 2 from `theme-source.mjs` and the shipped `theme.css`. The 2026-08-08 V4.1 sidecar knew none of the current identity anchors. |
| `.codex/R3_PUBLIC_STAFF_BOUNDARY_RECEIPT.md` | HISTORICAL_EVIDENCE | Cited | PRESERVED_HISTORICAL | R3 receipt, unedited | Its D24.0 citation is wrong — D24.0 is the public **Lending** model. Deliberately **not** rewritten; the correction lives in `DESIGN.md`, `WORKFLOW_ARCHITECTURE.md`, `.codex/CURRENT.md` and the R3-A1 receipt. History is not edited to look right. |
| `.codex/FVR02_RECEIPT.md` | HISTORICAL_EVIDENCE | NO | PRESERVED_HISTORICAL | Historical only | Records `FIGMA_WRITE: FORBIDDEN` and a DeepSeek canonical writer. True of its own task. Superseded as *current* authority by `.codex/CURRENT.md` and `specs/README.md`. |
| `.codex/FVR02_A2_LOCAL_PREVIEW_RECEIPT.md` | HISTORICAL_EVIDENCE | NO | PRESERVED_HISTORICAL | Historical only | Its "preview RUNNING at 4173" claim was already verified false in R3; the current pointer now states the verified truth. |
| `.codex/specs/accepted/2026-08-22-fvr02-*.md` (3 files) | SUPERSEDED_BUT_PRESERVED | Cited | PRESERVED_HISTORICAL | Not the current pointer | Carry `FIGMA_WRITE: FORBIDDEN` / `PROVIDER_WRITE: FORBIDDEN` in front matter. Accepted specs are durable evidence and were not edited; `specs/README.md` now states plainly that R3-A1 supersedes them for the two canonical design files only. |
| `docs/design/FIGMA_DESIGN_MAKE_AUDIT.md` | HISTORICAL_EVIDENCE | Matched sweep | AUDITED_NO_CHANGE | Historical audit | Two matches, both factual observations of the state at audit time: §10 heading "Version 39", and a note that `AUTH_ROUTE_INTENT_LABELS` names the route "Staff Request Center". Correct as history. The second is now tracked live as FE-R3-012. |
| `docs/design/FIGMA_MAKE_ADOPTION_PACKET.md` | HISTORICAL_EVIDENCE | Matched sweep | AUDITED_NO_CHANGE | Historical packet | One match, the same "Staff Request Center" observation. Accurate for its time. |
| `docs/design/DESIGN_EXECUTION_TRACKER.md` | CURRENT_EVIDENCE | Matched sweep | AUDITED_NO_CHANGE | Derived progress | One match is a v36/v3x tracker row, historical. The tracker is derived from verified gates and is not hand-edited; `PL-ACCESS` still cites D24.0, which remains correct for the Lending half. |
| `docs/design/CODEX_LANDING_REPRODUCTION_HANDOFF.md` | SUPERSEDED_BUT_PRESERVED | Matched sweep | MARKED_SUPERSEDED | Not current authority | Presents `FIGMA_MAKE_VERSION Version 39 · pending edits NONE` as current identity; Make is now v40. Listed explicitly in the Codex handoff's "MUST NOT treat as current authority" section rather than edited, because it is a completed historical handoff. |
| `docs/design/CODEX_LANDING_REPRODUCTION_PROMPT.md` | SUPERSEDED_BUT_PRESERVED | NO | MARKED_SUPERSEDED | Not current authority | Same disposition; superseded by `.codex/CURRENT_HANDOFF.md`. |
| `docs/frontend/FRONTEND_CUTOVER_RECEIPT.md` | HISTORICAL_EVIDENCE | NO | AUDITED_NO_CHANGE | FVR-001 closeout | Zero stale-pattern matches. |
| `docs/frontend/FIGMA_MCP_TRUNCATION_RECOVERY.md` | CURRENT_EVIDENCE | NO | AUDITED_NO_CHANGE | Truncation evidence | Zero matches. Its terminal-newline convention was relied on and confirmed by R3-A1's byte comparison. |
| `docs/frontend/FIGMA_MCP_TRUNCATION_MANIFEST.json` | CURRENT_EVIDENCE | NO | AUDITED_NO_CHANGE | Generated manifest | Generated by `scripts/design/write-figma-mcp-truncation-manifest.mjs`; not hand-edited. |
| `docs/design/FRONTEND_FI00_FI03_LIVE_FIGMA_AUTHORITY_RECEIPT.md` | HISTORICAL_EVIDENCE | NO | AUDITED_NO_CHANGE | FI receipt | Zero matches. |
| `docs/design/DESIGN_RESEARCH_HANDOFF.md` | REFERENCE_ONLY | NO | AUDITED_NO_CHANGE | Reference only | Zero matches. `DESIGN.md` states that `docs/design/` research cannot override current authority. |
| `AGENTS.md` | CURRENT_AUTHORITY | NO | AUDITED_NO_CHANGE | Repository governance | Unaffected by R3-A1; `npm run check:agents` passes (12 project files). |
| `PRODUCT.md` | CURRENT_AUTHORITY | NO | AUDITED_NO_CHANGE | Product context | Already names oxblood and gold as identity anchors and the live Make source as visual intent — consistent with the post-R3-A1 model. |
| `output/design/figma-make-source/src/app/**` (8 files) | CURRENT_EVIDENCE | YES | UPDATED | Make v40 mirror | Not prose, but design evidence. Refreshed from the saved v40 source; surgical 19+/29− diff; hashes in the source register. |

## Audited by class, not individually opened

Zero stale-pattern matches inside each class.

| Class | Count | Classification | Action | Notes |
|---|---:|---|---|---|
| `.codex/**` other than the rows above | ~120 | HISTORICAL_EVIDENCE / UNRELATED | AUDITED_BY_CLASS | Release notes, task history, archived specs, runtime records. Not named by the current pointer. |
| `docs/**` other than the rows above | ~120 | HISTORICAL_EVIDENCE / REFERENCE_ONLY | AUDITED_BY_CLASS | Operations, deployment, recovery, migration and research documentation. Out of R3-A1's frontend-design scope. |
| `docs/design/IMPECCABLE_V2…V4_*.md` | 20 | HISTORICAL_EVIDENCE | AUDITED_BY_CLASS | Superseded design-direction records for V2–V4.1. Retained as provenance; the V4.1 lineage is exactly what made the old sidecar stale. |
| `prototypes/**` docs | 4 | REFERENCE_ONLY | AUDITED_BY_CLASS | `prototypes/public-portals-r3/README.md` states the public portals carry no session check — consistent with, and cited by, the corrected Request authority. |
| `.hallmark/*.json` | 2 | CURRENT_EVIDENCE | AUDITED_NO_CHANGE | `log.json` and `preflight.json` are Hallmark's own records. The R3-A1 pass was `audit` (read-only), which does not append a log entry. |
| Root `*.md` other than the rows above | 4 | UNRELATED_TO_R3_A1 | AUDITED_BY_CLASS | `README.md`, `CHANGELOG.md`, `PROJECT_STATUS.md` and similar carry no frontend-design current claims that R3-A1 changes. |

## Current contradictions remaining

**Documentation: 0.** The §28 sweep returns no current document asserting the
old Request auth model, a forbidden Figma write, a running preview on 4173, or
Make at v39.

**Implementation: 1, and it is recorded, not hidden.** `FE-R3-012` —
`src/frontend/app/appRoutes.ts:19` still maps `"request-center"` to the
user-facing label **"Staff Request Center"**, surfaced by
`auth/StaffSignInPage.tsx:41` and duplicated at
`src/frontend/preview/index/registry.ts:103`. The R3-A1 vocabulary agreement
therefore holds across `DESIGN.md`, the Figma Design current lane, Figma Make
v40, the repository mirror and this documentation set — but **not** yet in the
frontend implementation. That is a product-source edit and belongs to Codex;
R3-A1 is design-authority only and did not touch `src/frontend/`.

## Historical evidence preserved

No historical receipt, accepted spec or superseded design record was rewritten to
agree with the current model. Where a historical document would mislead if read
as current — the R3 receipt's D24.0 citation, the FVR-02 provider-write
prohibition, the landing-reproduction handoff's v39 identity — the correction
lives in a **current** document that supersedes it, and the historical text is
left as written.
