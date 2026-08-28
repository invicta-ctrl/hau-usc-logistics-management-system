---
title: HAU-USC Logistics — Playground Consolidation, Operational Readiness, UI/UX, Performance, Reset, and Branch Governance Master Prompt
document_id: PLAYGROUND-MASTER-2026-08-28
status: ACCEPTED OWNER-DIRECTED MASTER EXECUTION PROMPT
prepared: 2026-08-28
timezone: Asia/Manila
target_repository: invicta-ctrl/hau-usc-logistics-management-system
primary_target_branch: Playground
production_branch: main
production_environment: FORBIDDEN_TO_MUTATE
playground_environment: AUTHORIZED_WITHIN_THIS_PROMPT
final_owner_gate: READY_FOR_EARL_MANUAL_ANNOTATION
---

# HAU-USC Logistics
# Playground Consolidation, Operational Readiness, UI/UX, Performance, Reset, and Branch Governance Master Prompt

## 0. Controlling owner directive

This prompt is the owner's bounded authorization to consolidate the HAU-USC Logistics Playground into one permanent, production-equivalent testing branch and environment; repair the currently observed Playground defects; reconcile completed frontend and Playground work; populate the isolated Playground with real backend-backed demo data; make all supported workflows operational and resettable; improve UI/UX, copy, semantics, themes, light/dark modes, glass architecture, indexing, and performance; and freeze a candidate for Earl's manual annotation before any Production promotion.

The intended permanent topology is:

```text
main
= permanent
= Production website canonical source lineage

Playground
= permanent
= isolated Playground/demo/testing website canonical source lineage

Temporary work branches
= one or more task-scoped branches as required
= each targets exactly one permanent branch
= removed after verified integration and preservation of unique history
```

The old permanent recovery-branch model is superseded for this project only after this amendment is formally recorded and preservation gates pass.

Do **not** mutate Production under this prompt.

Do **not** stop for routine owner review between named phases. Continue while authority, environment identity, privacy, rollback, and verification remain green. Stop only on the explicit stop conditions below or at:

```text
READY_FOR_EARL_MANUAL_ANNOTATION
```

At that final state, freeze the exact deployed Playground candidate and wait for Earl's annotations. Do not promote to Production.

---

# 1. Intent envelope

```text
INTENT:
  REPOSITORY_MAINTENANCE
  + BUG_FIX
  + FRONTEND_MIGRATION
  + SOFTWARE_FEATURE
  + TESTING
  + PERFORMANCE
  + UI_UX_REFINEMENT
  + PLAYGROUND_DATA_LIFECYCLE

MODE:
  EXECUTE CONTINUOUSLY ACROSS THE NAMED PLAYGROUND PHASES

TARGET:
  invicta-ctrl/hau-usc-logistics-management-system
  completed FI frontend lineage
  existing Playground migration lineage
  isolated Playground Worker/D1/R2
  Playground UI, backend data, reset lifecycle, performance, themes, copy, semantics, and QA index

RISK: HIGH

DELIVERABLE:
  one permanent Playground branch and one isolated Playground environment that behave like
  the intended Production application for all currently supported workflows, use real
  Playground Worker/D1/R2 state, are resettable to a deterministic demo baseline, are
  visually/professionally polished, and are ready for Earl's final manual annotation

VERIFICATION:
  exact source/tree/artifact/provider identity
  branch/worktree reconciliation
  route-by-route browser proof
  end-to-end real workflow consequences
  fixture exclusion
  reset determinism
  privacy/authorization
  D1 query plans/index evidence
  performance before/after
  responsive/accessibility
  Hallmark
  Impeccable
  complete diff review
  durable handoff
```

---

# 2. Authority chain

Read only the minimum live authority chain first:

```text
1. Earl's current instruction and this prompt
2. root AGENTS.md
3. .agents/PROJECT_POLICY.md
4. .agents/WORKTREE_POLICY_APPENDIX.md when present
5. .codex/CURRENT.md
6. .codex/CURRENT_TASK.md
7. .codex/CURRENT_HANDOFF.md
8. .codex/PHASE_AND_CONTEXT_POLICY.md
9. exact accepted spec/amendment named by the pointer
10. completed FI lane final receipt / FI-17 freeze evidence
11. existing FI-00..FI-12 Playground migration receipt/amendment
12. only source/tests/provider evidence needed by the current phase
```

Frontend design-source authority:

```text
FUNCTIONAL TRUTH
= repository Worker/API/auth/domain/privacy/D1/R2/audit contracts

CURRENT VISUAL/INTERACTION AUTHORITY
= live Figma Make — HAU-USC Logistics — Prototyping

DESIGN/DOCUMENTATION REFERENCE
= Figma Design — HAU-USC Logistics — Frontend Design Lab

FALLBACK ONLY
= repository-preserved Make/Figma exports, screenshots, historical design branches
```

If live Make differs materially from an older export, live Make wins for visual intent unless it conflicts with functionality, accessibility, security, or accepted business behavior.

Do not broad-scan the repository first. Expand context only through direct dependencies, acceptance criteria, failed verification, security/privacy, migration, performance evidence, or contradiction.

---

# 3. Starting planning snapshots — reverify before mutation

## 3.1 Completed FI frontend

Historically recorded:

```text
BRANCH: frontend-design-integration
FI: FI-00 through FI-17 complete
FINAL SOURCE: d5ae172b8e012a1ad61d60da6fb54510d1677762
FINAL TREE: 3c68dddab37daeb2b4253256641acce989443466
ROUTES:
  landing
  external-request
  tracking
  borrow
  staff-signin
  overview
  inventory
  request-center
  lending
  release
  restocking
  procurement
  events
  administration
  profile
RECORDED FI GATES:
  1165/1165 Vitest
  release-candidate gate
  production-artifact browser gate
  five-width acceptance
  Hallmark/Impeccable evidence
  open P0/P1 = 0 at FI closeout
```

## 3.2 Existing Playground migration

Historically recorded:

```text
BRANCH: release/v0.8.3-fi12-playground
DEPLOYED SOURCE: 50c5cab77b7fe251cf1a11c284fe791e6c2af127
DEPLOYED TREE: 5a985e623e8a234bf1d4cfac52ab5afb86fd8257
SCHEMA: 32
MIGRATION: 0032_staff_account_activity_history.sql
RECORDED BEHAVIOR:
  FI-00 through FI-12 migrated
  Playground Worker/D1/R2 isolated
  privacy-filtered backend populated
  staging-only Enter Playground session
  Production untouched
```

The old receipt also recorded representative safe data for inventory, ledger, accounts/roles, requests, reservations, lending, releases, restocking/receiving, procurement, evidence metadata, and events.

## 3.3 Current owner-observed defects override stale receipts

Treat current screenshots/live testing as higher-priority evidence until reconciled.

Observed defects include:

```text
blank/dark playground.hausc.org root
Preview Index workspace navigation not reliably opening workspaces
Overview reserved/not-built in preview
Internal Request Hub stuck/loading
Internal Lending Hub unavailable
Release showing design-fixture/synthetic records in some states
Restocking showing design-fixture/synthetic records
Procurement showing design-fixture/synthetic records
Events not working
Administration not working
Profile dominated by preview/contract-development language
marketing/AI-slop copy and redundant subtext
```

Therefore:

```text
LIVE CURRENT EVIDENCE > HISTORICAL CLOSEOUT RECEIPT
```

until source/artifact/Worker/bindings/D1/R2/session/browser behavior are reverified.

---

# 4. Owner-approved Git governance amendment

This prompt authorizes replacing the project's old permanent five-recovery-branch topology.

## 4.1 Permanent branches

Exactly two permanent functional branches:

```text
main
= Production website

Playground
= Playground/demo/testing website
```

Old recovery/design/release refs may remain temporarily only until preservation and reconciliation finish.

## 4.2 Temporary branches

One or more temporary branches may exist when justified:

```text
work/playground-<task>
fix/playground-<task>
reconcile/playground-<task>
work/main-<task>
fix/main-<task>
hotfix/main-<task>
```

Rules:

- every temporary branch targets exactly one permanent branch;
- one writer per branch/worktree;
- multiple temp branches may coexist only when isolated or explicitly sequenced;
- no writers race the same migration, lockfile, canonical current pointer, generated manifest, or external resource;
- temporary branches are removed after accepted integration and unique-history preservation.

## 4.3 Recovery history without permanent recovery branches

Preserve recovery via:

```text
immutable Git tags
GitHub releases when used
verified Git bundles
artifact hashes/manifests
D1 Time Travel/bookmarks/exports
R2 manifests/backups
private provider recovery records
deployment/version history
```

Before retiring any old permanent branch ref:

1. inventory head/tree;
2. classify unique commits;
3. preserve unique work;
4. tag/bundle/release as appropriate;
5. verify no live deployment/tool/doc depends on the branch name;
6. record disposition;
7. delete the branch ref only after proof.

Never delete by filename/branch-name appearance alone.

## 4.4 Environment mapping

```text
main -> Production
Playground -> Isolated Playground
```

Branch names are not security boundaries. Always verify Worker/D1/R2/secrets/provider bindings.

---

# 5. Non-negotiable environment and data invariants

## Production

Under this prompt:

```text
Production Worker writes = 0
Production D1 writes = 0
Production R2 writes = 0
Production secrets changes = 0
Production provider sends = 0
Production deployment = 0
```

Production may only be read when an accepted one-way privacy-filtered Playground baseline refresh requires it.

## Playground authority

Normal Playground operation must be:

```text
Browser
-> frontend adapter/view-model
-> Playground Worker/API
-> Playground D1
-> Playground R2 where applicable
```

No normal route may silently substitute browser fixtures for successful business state.

## Domain invariants

- D1 = structured operational truth.
- R2 = governed object/evidence truth.
- Inventory on-hand derives from accepted movements.
- Reservations affect availability, not physical on-hand.
- Request submission does not deduct stock.
- Receiving, release, handoff, return, transfer, reversal, and adjustment remain explicit operations.
- Ledger/audit/custody/identity/migration history is not silently rewritten merely to make a demo clean.
- UI hiding is never authorization.
- Unknown data remains unresolved/quarantined.
- Google is not runtime truth.

## Privacy

Never copy into Playground:

```text
Production passwords/password hashes
sessions
CSRF secrets
OTP/verification/reset tokens
provider secrets
private keys
recovery material
raw borrower identity evidence
unnecessary private contacts
Production credentials
unnecessary private evidence bodies
```

Use staging-safe pseudonyms, opaque IDs, and safe objects while preserving realistic relationships and workflows.

---

# 6. Final target: production-equivalent functional sandbox

The finished Playground must use:

```text
same intended business rules
same authorization model
same operational consequences
same frontend workflow expectations
same data-integrity rules
same safe error behavior
```

while remaining:

```text
isolated Playground Worker/D1/R2
staging-safe identities
staging-safe external side effects
resettable
Playground-only QA/admin controls
Production-independent
```

This is not merely a visual demo.

---

# 7. Execution strategy

Use one coherent work unit at a time:

```text
handshake
-> reproduce/measure
-> regression test when practical
-> smallest repair/change
-> focused verification
-> complete diff review
-> coherent commit/checkpoint
-> continue to next named phase if green
```

Do not combine branch deletion, broad UI redesign, unproven schema migration, backend repair, and external deployment in one uncontrolled commit.

Stop-when-green applies.

---

# 8. P00 — Adopt this master amendment

Persist this prompt as the accepted Playground consolidation/governance amendment before non-trivial mutation.

Required:

- exact branch/HEAD/tree/upstream/worktree;
- writer lock check;
- branch-governance docs/validators updated;
- current pointer/handoff updated only where required;
- completed FI and FM history preserved;
- Production explicitly excluded.

Pass:

```text
new branch model recorded
main role recorded
Playground role recorded
temp branch policy recorded
old permanent recovery policy superseded for this project
preservation gate recorded
runtime/provider/database unchanged
```

---

# 9. P01 — Repository/worktree/branch reconciliation inventory

Audit at minimum:

```text
main
frontend-design-integration
release/v0.8.3-fi12-playground
all related current release/fix/work branches
all HAU-USC worktrees
local-only commits
untracked/ignored task-relevant files
```

Classify unique work:

```text
PRODUCTION_CANONICAL
PLAYGROUND_BACKEND_UNIQUE
FI_FRONTEND_UNIQUE
SHARED_CURRENT
HISTORICAL_ONLY
SUPERSEDED
DUPLICATE
PRIVATE_LOCAL_ONLY
UNKNOWN_REVIEW
```

Create a reconciliation manifest containing branch, head, tree, merge-base, unique commits/paths, accepted scope, deployment relationship, preservation method, target branch, and retirement decision.

Do not broad-merge stale branches.

---

# 10. P02 — Create temporary Playground reconciliation branch

Create one temporary branch, e.g.:

```text
reconcile/playground-master
```

Select the base from verified repository truth.

Preserve and combine:

```text
accepted FI-00..FI-17 frontend
Playground environment guards
Enter Playground staging access
Playground backend adapters
Playground D1/R2 population/reset tooling
current schema/domain contracts
current accepted auth/identity needed by Playground
```

Do not import stale fixture runtime, obsolete provider bindings, superseded config, or Production secrets.

---

# 11. P03 — Blank-root / deployment audit

Explain exactly why current live Playground can render blank/dark before redesigning anything.

Audit:

```text
DNS/route
Worker route
index.html
asset binding
JS/CSS URLs
MIME
CSP
cache
hashed chunks
base path
React bootstrap/root mount
route/hash parser
session bootstrap
/api/version
/api/readiness
CSS visibility
console/network errors
```

At 390 and 1440 capture screenshot, DOM mount state, network failures, console errors, source/artifact/Worker identity, and STAGING D1/R2 classification.

Repair deployment mismatch before source if deployment is the cause.

Pass:

```text
fresh GET / = visible usable UI
hard refresh = works
required assets = present
fatal console errors = 0
STAGING identity correct
Production crossover = 0
```

---

# 12. P04 — Preview Index/workspace navigation repair

Every workspace listed in the QA/Preview Index must open correctly.

Required workspaces:

```text
Overview
Inventory
Internal Request Hub
Internal Lending Hub
Release
Restocking
Procurement
Events
Administration
Profile
plus public/request/lending/tracking routes exposed by Index
```

For every route prove:

```text
click -> expected workspace
correct route/history state
Back works
Forward works
Back to Preview Index works
direct route load works
route works after reset
```

Add a Playwright regression that clicks every workspace entry and verifies the page landmark/title.

Required:

```text
DEAD_WORKSPACE_LINKS = 0
PREVIEW_INDEX_NAVIGATION = PASS
DIRECT_ROUTE_NAVIGATION = PASS
BACK_FORWARD = PASS
POST_RESET_NAVIGATION = PASS
```

---

# 13. P05 — Reconcile full FI-00..FI-17 frontend into Playground

Compare frozen FI accepted tree vs reconciliation branch.

Classify differences:

```text
KEEP_PLAYGROUND_INTEGRATION
ADOPT_FI_FRONTEND
REPAIR_CONFLICT
KEEP_NEWER_SHARED_CONTRACT
SUPERSEDED
UNVERIFIED
```

All accepted FI routes must use the accepted implementation. A route completed by FI-00..FI-17 may not remain a reserved/not-built placeholder simply because the old Playground migration stopped at FI-12.

Preserve Playground-only backend/environment work.

---

# 14. P06 — Full normal-runtime fixture audit

Search deployed normal application graph for:

```text
Design fixture
Synthetic prototype
no backend
preview*
fixture
mock
hard-coded operational IDs/rows
simulated save
locally confirmed
```

Allowed only in explicit visual/test modes or tests.

Forbidden in normal deployed Playground:

```text
hard-coded inventory
requests
lending
release
restocking
procurement
events
accounts/staff
fake successful writes
```

If backend is missing, show truthful empty/denied/unavailable/error. Never fake success.

Add/extend a deterministic fixture-boundary build test.

---

# 15. P07 — Build clean production-equivalent Playground baseline

Use current accepted one-way privacy-filtered baseline tooling.

Prefer valid current safe baseline; refresh from Production read-only only when stale/incomplete; add deterministic staging-safe data only for missing workflow coverage.

Baseline must cover:

## Inventory
- in stock;
- low stock;
- out of stock;
- lendable;
- consumable;
- multiple categories;
- ledger history;
- reservations;
- receiving history.

## Requests
- submitted/for review;
- accepted;
- stock route;
- canvass route;
- split if supported;
- ready to release;
- partial/completed.

## Lending
- review;
- ready to claim;
- active reusable loan;
- overdue if supported;
- returned;
- consumable completion.

## Release
- ready;
- partial;
- completed;
- linked reservations/movements.

## Restocking/Receiving
- open;
- partial;
- complete;
- movement linkage.

## Procurement
- need;
- canvass/reference;
- supplier;
- deliverable/receiving linkage where supported.

## Events
- event series;
- dates/days;
- activities;
- request relationship;
- inventory relationship where supported.

## Administration
- staging-safe people;
- accounts;
- roles/capabilities;
- account-person links;
- activity;
- references;
- brand/media metadata;
- system status.

## Profile
- editable staging-safe username/contact/photo/theme baseline.

## R2
- safe profile/brand/evidence demo objects only.

Record baseline ID/version, source classification, privacy transform version, schema/migration, domain counts, inventory reconciliation, R2 safe object count/hash, role/capability coverage, frontend source/tree.

---

# 16. P08 — Core owner-observed route bug repairs

Reproduce before repair; add regression test first when practical.

## Overview
- no reserved/not-built when accepted FI surface exists;
- real backend summaries;
- no fabricated KPI;
- fast useful initial render.

## Internal Request Hub
- skeleton terminates;
- real queue loads;
- loading/empty/denied/unavailable distinct;
- retry/abort/timeout safe;
- real mutations use Worker/D1.

## Internal Lending Hub
- real queue loads;
- capability matches Worker;
- linked inventory/availability works;
- retry works;
- handoff/return real where supported.

## Release
- backend-derived queue;
- real full/partial release;
- ledger/reservation reconcile;
- duplicate protected.

## Restocking
- real backend queue/receiving;
- no normal synthetic rows;
- inventory movement consequence.

## Procurement
- real backend data;
- no synthetic rows;
- unsupported functions truthfully unavailable.

---

# 17. P09 — Events full recovery

From a fresh browser:

```text
Staff sign in -> Enter Playground -> Events
```

Audit session capabilities, `event.manage`, UI gate, Worker auth, endpoint, response shape, D1 rows, adapter validation, render state, retry.

Root-cause order:

1. staging System Owner missing capability;
2. UI capability name mismatch;
3. Worker capability mismatch;
4. missing/deployed endpoint issue;
5. baseline relationship missing;
6. response contract drift;
7. adapter bug;
8. stuck loading;
9. render/CSS bug.

Rules:

- never hard-code event authorization;
- never bypass Worker auth;
- never substitute preview event rows;
- do not invent unsupported event mutations.

Acceptance:

```text
System Owner: Events real data PASS
underprivileged role: safe denial PASS
loading terminates
retry works
reset restores event baseline
```

---

# 18. P10 — Administration full recovery

Audit tabs independently:

```text
Accounts & access
Staff directory
Activity
Reference administration
Link registry
Brand & media
System status
```

Verify backend methods and capability matrix for:

```text
access.admin
reference.manage
brand.manage
system.admin
other current admin capabilities
```

Rules:

- staging-safe data only;
- no inferred person/account links;
- no fake admin save;
- a visible mutation must be real and authorized or disabled/read-only;
- one failed tab must not crash unrelated tabs.

Acceptance:

```text
System Owner permitted tabs load
underprivileged role denied safely
real backend activity
safe system status
no perpetual skeleton
reset restores admin baseline
```

---

# 19. P11 — Production-equivalent end-to-end workflows

Prove operations, not just screens.

## Request

```text
create -> staff queue -> review -> accept/reject -> reserve/route -> ready -> release -> complete
```

## Inventory

```text
inspect -> receive/restock/authorized adjustment -> ledger -> derived quantity -> downstream refresh
```

## Lending

```text
submit/select -> review -> approve -> reserve -> ready -> handoff -> active -> return -> history
```

## Release

Test full + partial + retry/idempotency.

## Restocking/Receiving

Test open -> partial -> complete -> ledger.

## Procurement

Test current supported lifecycle.

## Events

Test current supported records/relationships/actions.

## Administration

Test current supported staging-safe account/reference/system mutations.

Required result:

```text
all supported workflows read real Playground state
all supported writes create real Playground consequences
server authorization remains authoritative
no fake success
```

---

# 20. P12 — Reset architecture

Reuse/extend current guarded staging lifecycle tooling such as current equivalents of:

```text
staging:sandbox:status
staging:seed-sandbox
staging:reset-sandbox
capture clean reset point
D1 backup/export + restore verification
generation tracking
reset eligibility
```

Do not replace with an unsafe wipe script.

Capture baseline:

```text
baseline ID/version
frontend source/tree
D1 bookmark if supported
verified D1 export + SHA-256
schema/migration
domain counts/fingerprints
inventory reconciliation
R2 safe manifest + SHA-256
profile/theme baseline
privacy transform version
```

Reset algorithm:

```text
1. verify Playground/STAGING environment
2. verify exact Worker/D1/R2 tuple
3. acquire reset lock
4. refuse if Production identity appears
5. invalidate temporary demo sessions
6. backup/export current D1
7. restore/reseed D1 baseline
8. verify schema/migration
9. reconcile inventory/FKs/domain counts
10. restore governed R2 demo objects
11. never delete unclassified R2 objects
12. restore profile/theme baseline
13. increment generation
14. mark CLEAN only after verification
15. allow new staging demo entry
16. run core route smoke
17. release lock
```

On failure, never report CLEAN; preserve backup/evidence and recover safely.

Two consecutive successful reset cycles are mandatory at final acceptance.

---

# 21. P13 — In-app Playground Reset Center

After operator reset is proven, add Playground-only UI at:

```text
Administration -> System status -> Playground controls
```

Required primary control:

```text
Reset Entire Playground
```

Show current baseline ID, generation, working state, last reset, and concise consequences.

Require staging environment, System Owner/dedicated reset capability, server-side environment check, confirmation, reset lock, progress, final receipt.

After reset: old session invalid, return to safe entry, new Enter Playground works, new generation visible.

Production must not expose a usable reset control/endpoint.

Partial/module resets are optional only when dependency-safe. Do not fake a module reset by directly overwriting derived state.

---

# 22. P14 — Profile and personalization

Turn Profile into a real authenticated surface.

## Read-only institution-controlled fields

Users cannot directly edit:

```text
real/legal name
canonical person identity
institution
department/assignment
official role/position
system authorization grants
```

If real/legal name is wrong, provide a concise correction/request path.

## Editable username

Real backend mutation with uniqueness, normalization, reserved-name validation, conflict handling, audit, session auth, clear result.

## Change password

Require current password or accepted reauth; server validation; no logging; safe generic errors; session/credential revocation per current contract; reset restores staging-safe demo credential baseline.

Do not silently rewrite password policy beyond accepted auth scope.

## Contact number

Editable, normalized, validated, persisted, audited, resettable.

## Profile picture

Use real Playground R2. Support upload/replace/remove, MIME/signature/size checks, safe metadata, fallback avatar, isolated R2, reset baseline.

## Appearance

Profile contains:

```text
Theme
Appearance: Light / Dark / System
```

Preference persists across sign-in/out through current backend preference contract or the smallest accepted preference addition under this prompt.

Reset returns the demo profile appearance to baseline.

Recommended IA:

```text
Profile

Identity
  Real name                 Read-only
  Institution               Read-only
  Department/assignment     Read-only
  Role/access summary       Read-only

Account
  Username                  Edit
  Password                  Change password

Contact
  Contact number            Edit

Appearance
  Profile picture           Change / Remove
  Theme                     Select
  Appearance                Light / Dark / System

Security & Activity
  relevant account activity
  last password change where safely supported
```

Remove development/contract prose from normal user view.

---

# 23. P15 — UI/UX research

Before broad design changes, conduct bounded current research using official accessibility, materials/glass/translucency, enterprise operations UI, data-table/dashboard usability, responsive/mobile, and Core Web Vitals guidance.

External inspiration cannot override HAU-USC identity, live Figma Make, repository functionality, auth/data invariants, accessibility, or owner requirements.

Record only a concise decision note:

```text
patterns adopted
patterns rejected
why
performance consequence
accessibility consequence
```

No large research report.

---

# 24. P16 — Anti-AI-slop design rules

Avoid:

```text
giant slogan heroes
marketing filler
generic empower/streamline/seamless copy
huge empty whitespace around data
card walls where tables/lists are clearer
nested cards
pill saturation
random gradients/glow
rainbow icons
excessive all-caps microcopy
fake statistics/analytics
oversized headings
excessive rounded rectangles
glass everywhere
unnecessary animation
redundant subtitles
```

Prefer:

```text
operational title
only necessary context
records/queues
attention states
selected detail
one primary action
secondary actions
history/evidence
```

Make dense operational screens intentional, legible, and calm.

---

# 25. P17 — Restrained glass architecture

Suitable translucent/glass surfaces:

```text
sidebar/nav
top navigation
command/search palette
floating quick actions
drawers
modals
overlays
selected navigation
Playground QA controls
```

Prefer solid high-legibility surfaces for:

```text
tables
inventory rows
request/lending/release queues
forms
administration data
long text
critical warnings
audit/history
```

Rules:

- glass never lowers contrast below acceptance;
- opaque fallback required;
- no essential meaning depends on transparency;
- `backdrop-filter` failure must degrade safely;
- reduce expensive effects on mobile/low-power profiles when measured;
- no slow scrolling because of blur.

---

# 26. P18 — Six-theme system with real Light/Dark modes

Create at least six themes:

```text
1. HAU Institutional — DEFAULT
2. Angelite Ivory
3. Midnight Ledger
4. Emerald Operations
5. Cobalt Signal
6. Graphite & Copper
```

Names may be refined only if the result is more professional.

Every theme defines semantic tokens for page/nav/surfaces/glass/primary/accent/text/borders/focus/selection/tables/inputs/success/warning/danger/info/unavailable/pending.

Each theme gets independently designed:

```text
LIGHT palette
DARK palette
```

Do not merely darken/lighten the same module colors.

Light mode: warm/neutral, high clarity, restrained brand, clear content planes.

Dark mode: true dark neutral operational canvas, deliberate maroon, controlled gold, clear surfaces/borders, not a uniform brown filter.

Success/warning/danger/info meanings remain semantically consistent across themes.

Theme selector lives in Profile. HAU Institutional is default. `Light / Dark / System` is separate from theme selection.

Persist preference; reset restores baseline.

---

# 27. P19 — Full copy, semantics, and UX writing audit

Audit every user-visible string:

```text
page titles
headings/subheadings/eyebrows
navigation
buttons/links/tabs
field labels/placeholders/helper text
status chips
loading/empty/error/warning/confirmation
modals/toasts/tooltips
table headers
Profile
Playground Index
reset controls
Events
Administration
accessible labels
```

Writing standard:

```text
specific
concise
professional
plain-language
operational
consistent
action-oriented
non-marketing
```

Audit/remove slogan-like landing copy such as:

```text
Every request.
Every handoff.
On record.
```

Do not replace with another slogan. Prefer direct product/navigation context such as a concise HAU-USC Logistics title and actual actions.

Subtext exists only if it adds a requirement, restriction, format, deadline, consequence, next action, or non-obvious context. If it merely explains the heading, delete it.

Buttons use verb + object where possible:

```text
Submit Request
Approve Request
Receive Stock
Confirm Release
Return Item
Change Password
Save Username
Upload Photo
Reset Playground
```

Avoid vague `Continue`, `Proceed`, `Manage`, `Confirm`, `Save` when the object/consequence can be named.

Errors = what happened + what to do next. Do not expose Worker/D1/R2/provider/contract/revision internals except an intentional technical System Status surface.

Loading copy minimal. Empty states short.

Remove normal-user development language such as:

```text
Design fixture
Synthetic prototype
Contract evidence
Server-decided access scope
No backend
Preview fixture
Local inspection presentation
Implementation-ready
```

One concise Playground environment indicator is enough; do not repeat disclaimers in every module.

Create a small canonical UI-language guide covering voice, action labels, statuses, errors, helper-text rule, technical terms, Playground terminology, capitalization, date/number conventions.

---

# 28. P20 — HTML/accessibility semantics

Audit native semantics:

```text
one meaningful page H1
logical heading hierarchy
button for actions
anchor/link for navigation
associated labels
fieldset/legend where appropriate
table headers/scope
dialog semantics
focus management
aria-live only where useful
accessible names
keyboard operation
landmarks/skip behavior where appropriate
```

Prefer native HTML over ARIA patches.

At 200% zoom: critical content reflows, no blocking clipping, actions reachable, tables have deliberate responsive behavior.

---

# 29. P21 — Playground Index / QA Hub redesign

Make Preview Index a fast QA/demo launcher, not a giant dashboard.

Provide:

```text
instant fuzzy workspace search
keyboard navigation
grouped modules
route status
backend availability/health
current baseline ID
generation
recently visited workspaces
authorized reset shortcut
clear Playground identity
one-click navigation
```

Search must use a small in-memory route index; do not query backend per keystroke.

Use measured intent-based route/data prefetch on hover/focus/idle only where it improves transitions. Do not preload every heavy route.

---

# 30. P22 — Performance baseline

Measure before optimizing:

```text
initial HTML/JS/CSS bytes
route chunks
request count
payload size
LCP
interaction latency/INP equivalent lab measure
CLS
TTFB
route transitions
Inventory search/load
Request queue load
Lending load
Events load
Administration load
Index search
```

Test representative desktop, older/lower-powered laptop, mid-range mobile, slower network, 390 and 1440.

No performance claim without before/after evidence.

---

# 31. P23 — Frontend performance improvements

Investigate measured bottlenecks:

```text
route code splitting/lazy loading
unused JS removal
duplicate bootstrap calls
stale request aborts
search debounce
large-list pagination/virtualization
smaller payloads
image sizing/compression
font loading
static caching + safe HTML revalidation
intent prefetch
bounded DOM size
reduce expensive repeated backdrop blur
avoid unnecessary re-render
avoid loading invisible route data
```

Prefer fast shell + progressive route data + stable layout.

Never weaken auth, data freshness, ledger correctness, or privacy for speed.

---

# 32. P24 — D1 query/index audit

Measure high-traffic queries for:

```text
Inventory
Request queue
Lending queue
Release queue
Restocking/receiving
Procurement
Events
Administration directory/accounts
Activity history
Profile/account lookup
```

Inspect query plans/rows read where available. Look for full scans, N+1, repeated reads, unbounded joins, missing pagination, missing composite indexes, unnecessary columns.

Add an index only when evidence proves value.

If needed:

1. record slow query;
2. capture plan before;
3. design smallest additive index;
4. evaluate write/storage tradeoff;
5. create next valid migration number;
6. apply to Playground only;
7. rehearse migration/rollback/forward-fix;
8. capture plan after;
9. record performance delta;
10. keep Production unchanged.

Any Playground candidate migration is recorded for later Production adoption under a separate Production prompt.

No speculative indexes.

---

# 33. P25 — Theme performance/accessibility

Theme changes must be instant without full-page reload and must not cause heavy row-by-row blur/animation cost.

Verify all themes in Light/Dark/System for contrast, focus, nav, tables, forms, status colors, dialogs, glass fallback, 390 and 1440.

Run full five-width matrix on default HAU Light/Dark and representative alternate palettes; spot-check all six themes before closeout.

---

# 34. P26 — Hallmark audit

After function/data/reset/copy/semantics/performance are green, run one bounded Hallmark pass for hierarchy, operational clarity, nav consistency, density, action prominence, environment identity, empty/error states, themes, glass usage, copy coherence, anti-AI-slop.

Target:

```text
critical = 0
major = 0
minor = 0 or each residual explicitly justified as nonblocking
```

One material repair pass, then stop when green.

---

# 35. P27 — Impeccable audit

Audit spacing, typography, icons, alignment, focus, contrast, overflow, touch targets, responsive behavior, component states, motion, light/dark, theme quality, glass fallback, and copy presentation.

Target:

```text
errors = 0
score = 20/20 when achievable without harming function/performance/accessibility
```

If not 20/20, record each deduction and why accepted.

---

# 36. P28 — Final accessibility/responsive matrix

Widths:

```text
320
390
768
1024
1440
```

Required:

```text
HAU default Light
HAU default Dark
representative alternate Light
representative alternate Dark
spot-check all themes
keyboard
focus
200% zoom/reflow
reduced motion
screen-reader smoke on critical forms/workflows
```

No primary-workflow-breaking horizontal overflow.

---

# 37. P29 — Freeze/deploy exact Playground candidate

Freeze:

```text
source branch/SHA/tree
lockfile hash
staging artifact hash
Worker identity
schema/latest migration
D1 identity
R2 identity
baseline ID/generation
theme version
UI language guide version
rollback target
```

Deploy only to Playground. Production remains unchanged.

---

# 38. P30 — Fresh-browser full acceptance

Start with no cookie/session:

```text
playground.hausc.org
-> visible landing
-> Staff sign in
-> Enter Playground
-> staging System Owner
-> Playground Index
-> Overview
-> Inventory
-> Request Hub
-> Lending Hub
-> Release
-> Restocking
-> Procurement
-> Events
-> Administration
-> Profile
```

Test public request/lending/tracking where supported.

For each route record backend source, API result, visible state, authorization, fixture result, console errors, load/transition, 390 and 1440; then full final matrix.

---

# 39. P31 — Reset E2E acceptance

Make real changes, e.g.:

```text
submit request
review/accept request
create reservation/release consequence
receive/restock inventory
complete lending handoff/return
change username/contact
authorize password-change test using staging-safe account
change theme
upload profile photo
perform supported admin change
```

Prove D1/R2 changed.

Press/run `Reset Entire Playground`.

Prove baseline ID/domain counts/inventory/R2/profile/theme/events/admin restored, old session invalid, new Enter Playground works, critical routes green.

Repeat a second independent mutation/reset cycle.

Two successful cycles required.

---

# 40. P32 — Establish permanent `Playground` branch

Only after candidate acceptance:

1. verify `Playground` branch does not contain unknown unique work;
2. reconcile if it exists;
3. establish/update `Playground` to accepted source lineage;
4. verify remote parity;
5. update deployment/process docs to target `Playground`;
6. keep `main` unchanged;
7. preserve reconciliation temp branch until parity proven;
8. retire temporary reconciliation branch afterward.

---

# 41. P33 — Retire obsolete permanent/historical branch refs

After preservation proof, classify current refs such as:

```text
frontend-design-integration
release/v0.8.3-fi12-playground
backup/last-known-good
regression/r1
regression/r2
regression/r3
other obsolete release/fix/work refs
```

Do not assume each exists.

For each deleted ref: record head/tree, resolve unique work, record immutable preservation location, clear deployment/doc dependencies, verify deletion.

Final permanent list:

```text
main
Playground
```

Only currently active task branches may remain temporarily.

---

# 42. P34 — Compact operator documentation

Keep only necessary durable documentation:

```text
branch governance
Playground purpose/environment rules
reset runbook
baseline/version record
theme/appearance guide
UI language/style guide
known nonblocking residuals
exact final candidate receipt
```

Do not create duplicate status systems. `.codex/CURRENT.md`, task, and handoff remain operational pointers.

---

# 43. Final route acceptance matrix

| Route | Required normal source | Default populated | Required special result |
|---|---|---:|---|
| Landing | frontend + public Worker reads | yes | professional direct copy, no marketing slop |
| Staff sign in | Worker/session | yes | staging-only Enter Playground |
| Playground Index | route metadata + health | yes | every workspace opens |
| Overview | Worker/D1 | yes | real accepted FI surface, no fake KPIs |
| Inventory | Worker/D1 ledger | yes | derived quantities reconcile |
| Request Hub | Worker/D1 | yes | no endless skeleton |
| Lending Hub | Worker/D1 | yes | no unavailable blocker |
| Release | Worker/D1 | yes | real queue/consequences |
| Restocking | Worker/D1 | yes | real receiving, no fixture rows |
| Procurement | Worker/D1 | yes | real backend data |
| Events | Worker/D1 | yes | full capability/data recovery |
| Administration | Worker/D1/R2 metadata | yes | real protected tabs |
| Profile | Worker/D1/R2 | yes | username/password/number/photo/theme |
| External Request | Worker/D1 | representative | real supported submit/track |
| Public Lending | Worker/D1 | representative | borrower-safe real data |
| Tracking | Worker/D1 | representative | purpose-limited real records |

A route is not accepted merely because its shell renders.

---

# 44. Profile acceptance

- [ ] Real/legal name read-only.
- [ ] Name correction path exists if required.
- [ ] Username change real and audited.
- [ ] Password change real and secure.
- [ ] Contact number real and audited.
- [ ] Profile picture uses Playground R2.
- [ ] Theme persists.
- [ ] Light/Dark/System persists.
- [ ] Institution/department/role remain authority-controlled.
- [ ] Reset returns profile demo state to baseline.
- [ ] Normal Profile UI contains no unnecessary development/contract prose.

---

# 45. Copy acceptance

- [ ] No unnecessary slogan copy.
- [ ] No filler subtitle that repeats heading.
- [ ] No generic AI marketing language.
- [ ] Actions use specific verb + object.
- [ ] Status terms consistent.
- [ ] Errors explain issue + next action.
- [ ] Empty states short.
- [ ] Loading copy minimal.
- [ ] Internal backend terminology removed from ordinary UI.
- [ ] One clear Playground identity is retained without repeated disclaimers.
- [ ] Small canonical UI language guide updated.

---

# 46. Theme acceptance

Required themes:

- [ ] HAU Institutional — Default
- [ ] Angelite Ivory
- [ ] Midnight Ledger
- [ ] Emerald Operations
- [ ] Cobalt Signal
- [ ] Graphite & Copper

Each:

- [ ] Light
- [ ] Dark
- [ ] System
- [ ] readable text
- [ ] focus
- [ ] navigation
- [ ] tables
- [ ] forms
- [ ] semantic statuses
- [ ] dialogs
- [ ] glass fallback
- [ ] persistence
- [ ] reset baseline

---

# 47. Performance acceptance

Use measured current baselines.

Preferred web targets where applicable:

```text
LCP <= 2.5 s
interaction/INP target <= 200 ms when measurable
CLS <= 0.1
```

Do not invent field metrics from lab-only tests.

Also define repository-local budgets from measured baseline for initial bundle, request count, route transition, Inventory, Request, Lending, Events, Administration, and Index search.

Every optimization report includes before/after evidence.

---

# 48. Reset acceptance

- [ ] Impossible against Production.
- [ ] Requires staging/operator authority.
- [ ] Exact Playground tuple verified.
- [ ] Pre-reset backup/export restore-verified.
- [ ] Baseline D1 ID/version known.
- [ ] R2 baseline manifest/hash known.
- [ ] Unknown R2 objects never deleted silently.
- [ ] Real demo mutations can be made.
- [ ] D1 restored.
- [ ] R2 restored.
- [ ] Inventory reconciliation green.
- [ ] Events/Admin/Profile restored.
- [ ] Old temporary session invalid.
- [ ] New Enter Playground works.
- [ ] Reset cycle 1 pass.
- [ ] Reset cycle 2 pass.
- [ ] Production mutation remains zero.

---

# 49. Branch acceptance

Final permanent branches:

```text
main
Playground
```

- [ ] old recovery refs preserved then retired;
- [ ] FI unique work preserved;
- [ ] Playground migration unique work preserved;
- [ ] Playground remote verified;
- [ ] main unchanged by this program;
- [ ] docs/config reference correct branches;
- [ ] no branch deleted before unique-work proof.

---

# 50. Test strategy

## Focused unit/contract

Cover route registry, Preview Index, blank-root regression, fixture exclusion, Events auth/states, Administration tabs, Profile validation/mutations, theme tokens, copy/status helpers, reset eligibility, baseline metadata, session invalidation.

## Integration

For affected routes:

```text
frontend adapter -> Worker -> auth/capability -> D1/R2 -> validated response
```

## Browser

```text
fresh no-cookie
System Owner
underprivileged staging role
390 focused
1440 focused
final 320/390/768/1024/1440
Light/Dark
six themes
keyboard
200% zoom
reduced motion
```

## Reset E2E

Two deterministic mutation/reset cycles.

## Full suite

Run complete release-candidate suite at meaningful candidate freezes, not after every small change. Do not repeat unchanged expensive gates.

---

# 51. Migration policy

Do not create a migration unless current evidence proves it is needed.

Allowed Playground-only additive migration under this prompt when required for:

```text
functional compatibility
measured D1 performance index
profile/theme preference storage
reset lifecycle metadata
```

Only if:

```text
current schema lacks the requirement
migration is controlled/additive
need is documented
Playground backup exists
rollback/forward-fix exists
migration rehearsed
schema identity recorded
Production unchanged
```

Any migration created here is a later Production candidate only; Production adoption requires a separate Production prompt.

---

# 52. Stop conditions

Stop immediately on:

```text
wrong repo/branch/worktree
unknown dirty work in owned paths
conflicting writer
missing accepted amendment
Production binding crossover
Production write/deploy
privacy uncertainty
secret/private-data exposure
missing backup before reset/migration
unclassified R2 deletion risk
schema drift requiring destructive/unaccepted change
unsupported business workflow needed to satisfy UI
Figma intent conflicting with functional truth
branch unique history cannot be safely resolved
repeated failed repair strategy after bounded attempts
P0 remains after its repair phase
P1 remains at final acceptance
```

When stopped, report exact blocker, evidence, safe state, smallest owner decision, and recommended default.

---

# 53. Required final handoff

```text
PROGRAM:
MASTER_PROMPT:
FINAL_STATUS:

GIT
MAIN_HEAD:
MAIN_TREE:
PLAYGROUND_HEAD:
PLAYGROUND_TREE:
PLAYGROUND_UPSTREAM:
PERMANENT_BRANCHES:
TEMP_BRANCHES_REMAINING:
RETIRED_BRANCHES:
PRESERVATION_TAGS_BUNDLES:

PLAYGROUND DEPLOYMENT
HOST:
WORKER_IDENTITY:
SOURCE_SHA:
SOURCE_TREE:
ARTIFACT_SHA256:
SCHEMA:
LATEST_MIGRATION:
D1_SAFE_LABEL:
R2_SAFE_LABEL:

FRONTEND
FI_SOURCE_ADOPTED:
ROUTE_COUNT:
PREVIEW_INDEX:
NORMAL_ROUTE_FIXTURES_REMAINING:
COPY_AUDIT:
SEMANTICS:
HALLMARK:
IMPECCABLE:

ROUTES
LANDING:
OVERVIEW:
INVENTORY:
REQUEST_HUB:
LENDING_HUB:
RELEASE:
RESTOCKING:
PROCUREMENT:
EVENTS:
ADMINISTRATION:
PROFILE:
PUBLIC_REQUEST:
PUBLIC_LENDING:
TRACKING:

WORKFLOWS
REQUEST_E2E:
INVENTORY_E2E:
LENDING_E2E:
RELEASE_E2E:
RESTOCK_RECEIVE_E2E:
PROCUREMENT_E2E:
EVENTS_E2E:
ADMIN_E2E:
PROFILE_E2E:

DATA
BASELINE_ID:
BASELINE_VERSION:
D1_COUNTS_SUMMARY:
D1_RECONCILIATION:
R2_RECONCILIATION:
PRIVACY_RESULT:
PRODUCTION_READS:
PRODUCTION_WRITES:

RESET
RESET_UI:
RESET_CAPABILITY:
RESET_GENERATION:
RESET_CYCLE_1:
RESET_CYCLE_2:
OLD_SESSION_INVALIDATION:
BASELINE_RESTORE:

THEMES
DEFAULT_THEME:
THEMES:
LIGHT_MODE:
DARK_MODE:
SYSTEM_MODE:
THEME_PERSISTENCE:
THEME_RESET:

PERFORMANCE
INITIAL_BUNDLE_BEFORE_AFTER:
REQUEST_COUNT_BEFORE_AFTER:
LCP:
INTERACTION_METRIC:
CLS:
ROUTE_TRANSITIONS:
D1_INDEX_CHANGES:
QUERY_PLAN_EVIDENCE:

ACCESSIBILITY
WIDTH_MATRIX:
KEYBOARD:
FOCUS:
ZOOM_200:
REDUCED_MOTION:
SCREEN_READER_SMOKE:

TESTS
FOCUSED:
FULL:
BROWSER:
RESET_E2E:
LINT:
BUILD:
CLOUDFLARE_DRY_RUN:

EXTERNAL STATE
PRODUCTION_MUTATION:
PLAYGROUND_MUTATION:
GOOGLE_WRITES:
PROVIDER_SENDS:
MIGRATIONS:

ROLLBACK:
KNOWN_NONBLOCKING_RESIDUALS:
DO_NOT_REPEAT:
NEXT_OWNER_ACTION:
HANDOFF_STATUS:
```

---

# 54. Final success state

The program succeeds only when:

```text
GIT
main = permanent Production lineage
Playground = permanent Playground lineage
old recovery model retired after preservation
temporary branches only for active accepted work

PLAYGROUND
visible and reliable
Preview Index navigation fully working
accepted FI-00..FI-17 frontend reconciled
real isolated Worker/D1/R2
real operational data
real supported mutations
Events working
Administration working
Profile editable where authorized
resettable twice deterministically
fast/responsive/accessibile

DESIGN
professional operational UI
restrained glass architecture
anti-AI-slop
six themes
true Light/Dark/System modes
copy audited
semantics audited
Hallmark green
Impeccable green

PERFORMANCE
measured before/after
snappy on representative lower-end devices
D1 query/index improvements only where justified
no correctness/security tradeoff

PRODUCTION
unchanged

P0 = 0
P1 = 0

STATUS = READY_FOR_EARL_MANUAL_ANNOTATION
```

At `READY_FOR_EARL_MANUAL_ANNOTATION`, freeze the exact deployed Playground candidate and wait.

Do not perform Production promotion, main deployment, Production migration, or final product closure in this prompt.
