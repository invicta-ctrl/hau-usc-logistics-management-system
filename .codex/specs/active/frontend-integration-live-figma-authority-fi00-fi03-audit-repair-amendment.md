# HAU-USC Logistics — Live Figma Authority + FI-00 to FI-03 Audit/Repair Amendment

AMENDMENT: FI-LIVE-FIGMA-AUTHORITY-01
STATUS: ACCEPTED BY OWNER — EXECUTION PENDING
OWNER: Earl
DATE: 2026-08-22 (Asia/Manila)
TARGET BRANCH: frontend-design-integration
PREDECESSOR: FI-03 completed at 3d9a434
NEXT AFTER THIS AMENDMENT: FI-04 Authenticated Shell / Navigation / Profile

## Intent

Correct the frontend integration authority chain before FI-04 and audit/repair FI-00 through FI-03 against the current live Figma sources without reopening accepted backend, API, auth, data, migration, provider, Playground, or Production behavior.

## Canonical authority

Use this order for this amendment:

1. Earl's current instruction and this accepted amendment.
2. Root `AGENTS.md` and `.agents/PROJECT_POLICY.md`.
3. Live repository and accepted specifications for functional truth.
4. **Figma Make — HAU-USC Logistics — Prototyping** as the primary current visual implementation authority and partial code/reference baseline:
   https://www.figma.com/make/rP9W9MQlZkyQrUx38TVsFS/HAU-USC-Logistics-%E2%80%94-Prototyping?p=f&t=IzRz8zFMhHNpKUHC-0
5. **Figma Design — HAU-USC Logistics — Frontend Design Lab** as documentation/reference authority:
   https://www.figma.com/design/hXJElH4p72KfgAaoUyfNOC/HAU-USC-Logistics-%E2%80%94-Frontend-Design-Lab?node-id=0-1&p=f&t=MoIJxKJbLcfVZnz0-0
6. Repository-preserved Figma/Make exports only as fallback evidence for the evidence class they can actually prove.

Functional repository contracts always win over a design that implies unsupported behavior. Live Make wins over an older Git mirror for current visual composition when the two materially differ.

## Verified connector/browser state

The following facts were directly reverified before this amendment:

- `codex mcp login figma`: PASS.
- Figma OAuth authentication: PASS.
- Figma authenticated identity: `Invicta-ctrl`.
- Figma Design file metadata access at node `0:1`: PASS.
- Figma Make access through Figma MCP metadata/context tools: unsupported by tool capability, not an authentication failure.
- Exact Make MCP limitation: `This tool is not supported for Make files. Supported file type: Design.`
- Authenticated Chrome/browser access to the live Figma Make file: PASS.
- Browser-visible Make title: `HAU-USC Logistics — Prototyping – Figma Make`.
- Browser-visible current landing headline: `Every request. Every handoff. On record.`
- Normal web fetching is not an approved substitute for either Figma source.

Do not reclassify the current connector as `BLOCKED_REAUTHENTICATION`.

## Figma access policy for this repair

- Use Figma MCP for supported Design-file structured reads, metadata, screenshots, variables, and assets.
- Use the authenticated Chrome/browser route for current Make visual inspection.
- Do not use ordinary web fetching to bypass Figma authentication or Make-file tool limits.
- Use repository-preserved Make code exports as partial code evidence only when live Make code is not directly available through supported tooling.
- Compare preserved code/export evidence against current live Make visuals before using it.
- Do not write to either Figma file.

## Known authority defect

FI-02 and FI-03 were accepted while the current chain treated an older repository-preserved Make export as visual authority because Figma was believed to be blocked by reauthentication. That premise is superseded.

The live Figma Design source is now accessible through Figma MCP, and the live Figma Make source is accessible through the authenticated browser. The current Make landing visibly differs materially from the accepted FI-02 landing implementation.

Therefore:

- FI-00 functional reconciliation remains presumptively valid but its design-source conclusions must be audited.
- FI-01 shared design foundation remains presumptively valid but must be checked against the live Make visual system and Design documentation.
- FI-02 is `FUNCTIONALLY_PASS / VISUAL_ACCEPTANCE_REOPENED`.
- FI-03 is `FUNCTIONALLY_PASS / VISUAL_ACCEPTANCE_REOPENED`.
- FI-04 must not start until this bounded audit/repair closes.

## Execution sequence

### Phase A — authority freeze and evidence

1. Rehydrate current Git/governance state.
2. Verify no active writer and a clean product state apart from this amendment/governance checkpoint.
3. Reverify Figma authentication once.
4. Capture only the Design-file metadata/screenshots needed for FI-00 to FI-03.
5. Inspect the current Make pages/screens relevant to FI-00 to FI-03 through authenticated browser state.
6. Record a bounded current visual evidence register with route/surface, live source, current repository implementation, and material delta.
7. Do not broadly export or mirror the whole Figma files.

### Phase B — FI-00 audit

Audit FI-00 only for authority/reconciliation correctness: branch reconciliation, preserved historical design evidence, current-vs-historical classification, stale-mirror assumptions, and unique-evidence preservation. Prefer `VERIFIED_NO_OP`. Do not rewrite FI-00 functional integration unless a concrete defect is proven.

### Phase C — FI-01 audit/repair

Audit the accepted shared foundation against live Make and Design documentation: theme/token roles, typography, shared surfaces/primitives, G1-G4 glass/material system, responsive foundation, and accessibility corrections. Preserve accepted tokens when compatible. Repair only proven shared-foundation drift that blocks current Make fidelity.

### Phase D — FI-02 landing/public-shell repair

Reopen only visual/interaction acceptance while preserving FI-02 functional truth.

The current live Make landing is the primary composition reference. At minimum reconcile the current live structure that includes:

- USC / Department of Logistics masthead;
- Home / Logistics hub / theme / Staff sign in navigation;
- HAU-USC institutional logistics ledger eyebrow;
- dominant `Every request. Every handoff. On record.` hero;
- primary `Start a logistics request`;
- secondary `Browse public lending`;
- `Track request`;
- `Staff sign in`;
- current live Make spacing, hierarchy, typography, hero media treatment, and responsive intent.

Preserve accepted real routes, public advertisement/media truth, no-fabrication rules, accessibility, privacy, loading/empty/error/media-failure behavior, and isolated Playground proxy. Do not copy prototype-only fake data or unsupported behavior.

### Phase E — FI-03 auth/application repair

Audit and repair only the FI-03 frontend presentation surfaces against current live Make plus Design documentation: sign in, eight-digit verification, account application, application status, and directly coupled supported activation/recovery presentation.

Preserve existing backend auth/session/CSRF/rate-limit/approval/verification contracts. No backend security behavior may be weakened or redesigned from Figma.

### Phase F — acceptance and handoff

For every changed surface:

- compare the current local preview against current live Make;
- verify route and state behavior against repository contracts;
- test 320 / 390 / 768 / 1024 / 1440;
- test light/dark where supported;
- test keyboard/focus, reduced motion, 200 percent zoom, no horizontal overflow, and applicable automated accessibility checks;
- prove no mock/fabricated Production behavior.

Run focused tests first. Run broader suites only once when required by invalidated acceptance gates.

Close with FI-00 audit result, FI-01 audit result, FI-02 `FUNCTIONAL_PASS + VISUAL_PASS`, FI-03 `FUNCTIONAL_PASS + VISUAL_PASS`, exact final commit/tree, current Figma access evidence, persistent local preview state, `ACTIVE_WRITER: NONE`, `WRITER_LOCK: RELEASED`, and `HANDOFF_STATUS: READY_FOR_FI04`.

## In scope

- documentation/governance corrections required by this authority change;
- FI-00 to FI-03 audit evidence;
- frontend-only repairs required for current Make fidelity;
- directly coupled tests and generated artifacts through canonical build scripts;
- current-chain correction from stale Figma-blocked language.

## Out of scope

- FI-04 implementation;
- backend/API/auth/data/schema/migration changes;
- D1/R2/Google/provider mutations;
- Figma writes;
- Production or Playground deployment;
- dependency changes unless separately accepted;
- broad redesign beyond current live Make;
- fabrication of unsupported features or data;
- deleting historical evidence;
- rewriting accepted functional history merely because visual authority changed.

## Stop conditions

Stop the affected repair if a visual requirement implies unsupported runtime behavior; live Make and Design documentation materially conflict on a load-bearing decision that cannot be resolved from assigned roles; authentication fails again after the supported single reauthentication attempt; the current Make source cannot be inspected through the approved browser route; the repair requires backend/auth/data/migration/provider changes; private data would be exposed; Production crossover occurs; unknown dirty work or a conflicting writer appears; or a mandatory verification fails.

## Deliverable

A repaired, current-live-Figma-aligned FI-00 to FI-03 frontend baseline that preserves all valid v0.8.3 functional behavior and is ready for FI-04 without relying on stale Make mirrors as current visual authority.
