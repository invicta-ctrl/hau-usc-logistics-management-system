<!-- Hallmark · pre-emit critique: P5 H5 E5 S5 R5 V5 -->

# Proposed module-by-module redesign plan

## Status and sequencing

This is a Design Gate recommendation, not implementation authorization. Each slice requires an accepted amendment, frozen candidate, isolated playground verification, Earl review, and the existing production gate. Backend contracts, V5 route identities, permissions, and service truth remain authoritative.

## Slice 1 — Overview / Command Center

### Objective

Prove the Institutional Logistics Ledger direction in the surface with the most visual freedom while establishing only the reusable shell, tokens, state frames, pulse, exception ledger, and responsive system that the slice genuinely needs.

### Initial route scope

- Primary: `admin.overview`.
- Shared shell effects only where required to render that route.
- No redesign of other module content in this slice.
- Optional comparison: a static/non-interactive prototype of the role-specific overview composition, not backend behavior changes.

### Composition

1. Command band with page identity, scope, global search, and one primary action.
2. Operational pulse: requests awaiting action, releases due, lending overdue/approaching due, and stock exceptions.
3. Exception ledger: age, severity, owner, next action, and linked record.
4. Today's operational path: requests → reservation/approval → release/return.
5. Inventory health summary with accessible 2D topology.
6. Recent governed activity and reconciliation provenance.

### Optional spatial proof

Start with a 2D topology. A 3D version is a separate, disposable playground experiment only after owner approval and dependency/performance gates. It cannot block Slice 1 acceptance.

### Acceptance evidence

- Real backend-projected overview data; no fake success or prototype records.
- All declared route states: populated, loading, empty, unavailable.
- Permission denial and environment guards remain intact.
- Light/dark/reduced motion.
- 320/390/768/1024/1440 responsive matrix plus normal laptop and large desktop.
- Keyboard traversal and focus-not-obscured checks.
- Current artifact/runtime baseline and measured slice delta.
- Hallmark critique plus targeted Impeccable layout/typeset/color/motion passes.
- No source or visual drift in untouched modules.

## Slice 2 — Inventory workbench

### Routes

- `inventory.overview`
- `inventory.catalog`
- `inventory.item`

### Design priority

Density and truth. Use a filterable workbench with pinned identity/quantity fields, available/reserved/committed/physical relationships, bulk selection, threshold/eligibility markers, and a record inspector with movement history.

### Mobile transformation

Record summaries preserve item identity, location/classification, available quantity, exception status, and detail action. Full ledger history remains a dedicated detail route; no masonry or arbitrary card conversion.

### Constraints

No 3D in primary inventory work. Any zone visualization is secondary, 2D first, and cannot replace the table or ledger.

## Slice 3 — Request Center

### Routes

- `public.request-intake`
- `public.request-tracking`
- `request.queue`

### Design priority

State clarity and actionable review. The queue exposes category, requester/department as permitted, age, event relationship, line state, owner, and next allowed action. The inspector carries lifecycle, ask-info/reject/review/reserve actions, linked inventory, and audit evidence.

### Constraints

Public tracking remains privacy-preserving. Internal fields and staff actions never project into public routes. UI success waits for service confirmation.

## Slice 4 — Lending Hub

### Routes

- `public.lending-intake`
- `public.lending-tracking`
- `lending.queue`
- `lending.detail`

### Design priority

Availability, borrower/asset identity, due/return status, reservation, handoff, return, usage, and maintenance. Use an availability timeline and due-state grouping backed by complete text/table alternatives.

### Constraints

No unsupported public evidence upload or local-only asset illusion. Borrower evidence remains private and capability-gated.

## Slice 5 — Release Desk

### Route

- `release.desk`

### Design priority

Focused speed and certainty. One release context dominates: recipient/request, outstanding lines, verified quantities, confirmation/evidence, correction path, and audit reference. Secondary navigation recedes while the task is active.

### Constraints

No celebratory animation before the backend confirms. Correction and evidence are not hidden behind decorative transitions. Keyboard/scanner-oriented operation should be evaluated if supported by the current contract.

## Slice 6 — Supply, procurement, and events

### Routes

- `restocking.queue`
- `procurement.board`
- `events.series`
- `food.overview`
- `materials.overview`

### Design priority

Make linked workflows visible: canvass/preference, transition/receive, deliverable state, event series/day/activity, component ownership, and inventory transfer. Prefer timelines and relationship rails over generic boards where state sequence matters.

### Constraints

Do not invent composite lifecycle operations that the current backend does not implement. Missing contract capability remains explicit.

## Slice 7 — Staff, governance, and system status

### Routes

- `admin.access`
- `admin.directory`
- `admin.reference`
- `admin.links`
- `admin.brand`
- `account.profile`
- `owner.health`
- `audit.activity`

### Design priority

Calm, explicit, and safe. Forms use predictable grouping, effective-value previews, revision comparisons, scope statements, and consequence-first destructive confirmation. Brand/announcement media management shows governed preview and publication state without arbitrary HTML/CSS.

### Constraints

Google writes, provider email sends, evidence restoration, and other external mutations remain separately authorized. Production never exposes playground shortcuts.

## Public/editorial follow-up

The current event-led landing already has accepted behavior. Any future visual change should remain governed by published plain text, safe media, allowlisted presentation variants, same-origin/HTTPS links, and the USC/DOL identity rules in `DESIGN.md`. It is not included in the recommended first slice.

## Cross-slice reusable components

Extract only after recurrence is demonstrated:

- Institution rail and route drawer.
- Command band and permission-safe command palette.
- Filter grammar and result summary.
- Operational pulse and exception ledger.
- Queue/table workbench.
- Record inspector and lifecycle rail.
- Quantity truth and due-state primitives.
- Evidence/provenance block.
- Review/confirm plane.
- Loading/empty/partial/stale/unavailable/denied/error state frame.

## First-slice decision requested from Earl

Approve or reject the following bounded direction:

> Redesign `admin.overview` as the first Institutional Logistics Ledger slice, with a refined shell, real operational pulse, exception ledger, accessible 2D inventory/workflow topology, complete state/responsive coverage, and no 3D dependency. Evaluate a disposable optional 3D proof only under a later explicit approval.
