# FI-01 — Shared Design Foundation

Status: **ACCEPTED**
Owner: Earl
Accepted: 2026-08-21, Asia/Manila — FI-01 V2 owner prompt
Writer: `TERRA_MAX:/root/fi01_integration_writer`
Branch: `frontend-design-integration`
Worktree: `D:/Documents/Codex/HAU-USC Logistics/worktrees/frontend-design-integration`

## Objective

Translate the retained Figma Design / Figma Make v39 visual intent into one
canonical shared runtime foundation for the reconciled v0.8.3 application. The
foundation covers semantic color and surfaces, typography, spacing, sizing,
radius, elevation, glass/blur, motion, focus, and authored light/dark tokens.
It preserves every backend, API, auth, data, route, and provider contract.

## Authority and baseline

1. Earl's FI-01 V2 prompt and this accepted record.
2. Canonical `AGENTS.md`, project policy, and current-chain records.
3. FI-00 reconciliation receipt and frozen functional baseline
   `origin/main@86553349f5c2ebefaa637c30828c560a301f99ba`.
4. `DESIGN.md` and `docs/design/DESIGN_AUTHORITY.md` D08/D09/D12/D41.
5. Retained Make v39 source, including `scripts/design/theme-source.mjs` and
   `output/design/make-adoption/theme.css`.

Starting branch identity: `eacdfcc951c687cfca5731ede245130266b1c3da`, tree
`30b2ae1d15731d42fa668f48fe6a0064869ff655`; FI-00 runtime parity and governance
are PASS. The rollback is a normal revert of FI-01 commits to that identity.

## Scoped implementation

- Make `src/v5/styles/tokens.css` the sole live token and theme authority.
- Preserve existing primitive selectors while converting the imported legacy
  token layers to consumers only; define local approved font faces once.
- Reconcile D-04 to local Bricolage Grotesque display, IBM Plex Sans body and
  operational type, Newsreader wordmark, and system monospace for code/data.
- Reconcile D-02 to D41's G1–G4 recipe: 10/14/18/22px blur with corresponding
  opacity, saturation, edge, shadow, and solid fallback tokens.
- Update only directly coupled shared primitive presentation and deterministic
  FI-01 checks/documentation.

## Exclusions and invariants

No FI-02 route work or landing-hero acceptance: `D08_STATUS: OPEN_FOR_FI02`.
No backend/API/auth/session/CSRF/authorization/data/schema/migration/provider,
Figma, Playground, Production, recovery-pointer, or dependency change. No
parallel framework, remote font, generated-output hand edit, rebase, reset,
force-push, history rewrite, or normal branch-to-main merge.

## Acceptance and verification

- Exactly one active token/theme authority with deterministic light/dark roles.
- `D04_STATUS: PASS`, one classified semantic typography system and local fonts.
- `D02_STATUS: PASS`, one readable G1–G4 glass/blur ladder with fallbacks.
- Existing shared primitives consume canonical variables; D-08 remains deferred.
- Governance/current-chain checks, formatting, diff check, lint, production
  build, active design/theme/contrast/motion checks, bounded browser smoke,
  secret/private scan, full logical-diff review, normal push/readback all pass.

## Stop conditions

Stop for baseline/branch drift, dirty or competing writer state, material source
contradiction, missing/unclear approved font, dependency need, route redesign,
backend/security/data scope expansion, external mutation need, unresolved P0/P1,
or any load-bearing unverified fact.
