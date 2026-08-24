# FRONTEND_F2_R3A1A2 — frozen FI visual baseline

STATUS: FROZEN_FOR_FI04_START
DATE: 2026-08-24
OWNER_AUTHORITY: R1 one-shot program + R1-A2 reconciliation + accepted A3 local-preview gate
SUPERSEDES: FRONTEND_F1 (any pre-R3-A1-A2 FI baseline)
SCOPE: Read-only frontend visual and routing baseline for FI-04→FI-17. It does not authorize product, provider, backend, environment, or data mutation.

## Authority order

1. Current owner instruction and accepted specifications/amendments.
2. Repository contracts and accepted source for functional, security, authorization, privacy, API, and data truth.
3. Live Figma Make for current visual implementation, composition, interaction, responsive intent, and approved assets.
4. Live Figma Design for documentation, annotations, exploration, tokens, component notes, and supporting rationale.
5. Repository-preserved exports/mirrors/receipts as identity evidence only; they never override an accessible newer live source.

Functional truth wins if a visual reference implies unsupported behavior. Never fabricate backend success or bypass authorization to obtain visual parity.

## Frozen live identities and readback

| Evidence | Frozen verified value |
|---|---|
| Figma Design file | `hXJElH4p72KfgAaoUyfNOC` |
| Figma Design current page / authority board | page `55:3`, board `568:2` |
| Current authority block nodes | `753:2`, `753:3`, `753:4` |
| Documentation-mirror page / board | page `755:2`, board `755:3` |
| Documentation-mirror cards | `755:4`, `755:7`, `756:2`, `759:2`, `760:2`, `761:2`, `762:2`, `762:6` |
| Additional current-board metadata | `691:2`, `568:5`, `568:8`, `568:11`, `568:14`, `568:17`, `680:2`, `680:5`, `680:8`, `680:11`, `680:14`, `568:20` |
| Design readback | Official MCP `get_design_context` and screenshot for `753:2` matched the R3-A1-A2 current authority |
| Figma Make file | `rP9W9MQlZkyQrUx38TVsFS` |
| Make provider state | Version `44`; `MAKE_PENDING_EDITS: 0`; authenticated browser showed no visible pending/unsaved marker |
| Make MCP read | Authenticated official MCP read returned 209-source-file context (first 200 resource links due response size) |
| Make preserved mirror | 212 files; truncation markers 0 |
| Make archive SHA-256 | `1c58a56dbbf0b9908f5713aa98a7658a6fc63a8e5eff918892da4cf29d0a7609` |
| Provider/repository changed-file identity | 16/16 byte-identical |
| `PublicFlows` SHA-256 | `165aa1c626775b0330f0b2bdb6dd30a70fe940d7bca753712172d903ee1c2765` |

Do not infer a provider write from this receipt. No Figma mutation is authorized by F2.

## Normative repository anchors

| Need | Minimum source |
|---|---|
| Three-context routing, entry intent, Home/session, auth and backend-gap truth | `docs/frontend/ROUTING.md`; `docs/frontend/WORKFLOW_ARCHITECTURE.md`; `.codex/R3_A1_A2_ROUTING_IDENTITY_RECEIPT.md` |
| Current design authority and traceability | `.codex/R3_A1_A2_ROUTING_IDENTITY_RECEIPT.md` sections 6–9; `docs/design/FIGMA_BASELINE_REGISTER.md` |
| Make export/provider identity and content register | `docs/design/FIGMA_MAKE_SOURCE_REGISTER.md`; `.codex/R3_A1_A2_MAKE_CHANGESET.md`; `.codex/R3_A1_A2_MAKE_MIRROR_TRUNCATION.txt` |
| Design tokens, assets, responsive states, motion, light/dark, and state references | `DESIGN.md`; live Figma Make and Design node context for the bounded FI surface; the two design registers above |
| Quality baseline and known findings | `docs/design/HALLMARK_IMPECCABLE_CLOSURE.md`; `docs/frontend/WORKFLOW_ARCHITECTURE.md` |
| A3 local-preview rules | `.codex/specs/accepted/2026-08-24-fi04-fi17-r1-a3-persistent-local-live-preview-4173-visual-fix-gate.md`; `.codex/A3_LOCAL_PREVIEW_RECEIPT.md` |

These pointers deliberately avoid copying token values, asset URLs, layout metrics, motion numbers, or state content that must be read from the exact current live node/resource for each FI slice. A future slice must record its exact Design node(s), Make resource(s), and relevant responsive/light-dark/loading/empty/error/denied states before implementing it.

## Routing baseline — preserved

```text
PUBLIC LENDING = public / no staff login
EXTERNAL REQUEST CENTER = authenticated eligible USC staff/officer
MAIN LOGISTICS HUB = authenticated DOL/internal capability gated

Start logistics request → Staff Sign In when signed out
Browse public lending → Public Lending with no staff sign-in
Home → landing / scroll top / preserves session
Sign Out → destroys session
```

The current baseline does not expose or implementation-verify FI-04 internal workspaces. `FI04_IMPLEMENTATION = NOT_STARTED` at this frozen baseline.

## Required FI visual loop

For each material FI change: exact Figma intake → bounded implementation → focused verification → HMR/reload 4173 → inspect the affected route → repair current defects → recheck → checkpoint. Inspect 320/390/768/1024/1440 when layout changes, plus Light/Dark and reduced motion when relevant. Treat observable API/authorization gaps truthfully; do not fake success.

## F2 validity and invalidators

F2 remains current only while the live Design/Make state, accepted routing authority, and referenced repository identity remain consistent. Re-read the minimum exact live Design and Make context before a slice; record a formally accepted successor if current visual authority changes materially. FI-13 must revalidate this baseline or its accepted successor before candidate freeze.
