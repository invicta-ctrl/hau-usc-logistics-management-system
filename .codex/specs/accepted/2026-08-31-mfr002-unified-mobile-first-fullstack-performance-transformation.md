---
title: HAU-USC Logistics — MFR-002 Unified Mobile-First Fullstack, Performance, and Repository Transformation Reference
document_id: HAU-USC-MFR-002
status: ACCEPTED OWNER-DIRECTED PLAYGROUND-ONLY EXECUTION PROGRAM
prepared: 2026-08-31
adopted: 2026-08-31 Asia/Manila
adopted_by: Earl through HAU-USC-MFR-002-LAUNCHER
source_attachment_sha256: 9d76ffdae5c3d520da29a826424a863b59c04b780bee192a05351bd9806fb465
u00_starting_playground_sha: 6186f90a0591c7630e1bc564ea6475ae7b61a3ae
u00_starting_playground_tree: a802a2fe24cf808b922426be5951006e8ee9230b
u00_verified_main_sha: f7e5bf83205dbe58b5fb72126a4456747d92e906
timezone: Asia/Manila
target_repository: invicta-ctrl/hau-usc-logistics-management-system
primary_baseline_branch: Playground
production_branch: main
primary_environment: Isolated Staging Playground
production_mutation: FORBIDDEN BY THIS PROGRAM
primary_model: GPT-5.6 Sol — Ultra
execution_shape: ONE OWNER PROMPT / ONE CONTINUOUS PROGRAM / INTERNALLY BOUNDED VERIFIED SLICES
final_gate: READY_FOR_EARL_MOBILE_FIRST_ANNOTATION
supersedes_for_planning_after_repository_adoption:
  - HAU-USC-PERF-001
  - PLAYGROUND-MOBILE-FIRST-IMPECCABLE-V1
  - MFR-001-SOL-ULTRA-ONE-SHOT
---

# HAU-USC Logistics
# MFR-002 — Unified Mobile-First Fullstack, Performance, and Repository Transformation Reference
## One source. One real application. Playground first. Mobile first. Measured performance. Production untouched.

> **Purpose:** This file consolidates and improves the three 31 August 2026 plans into the accepted next HAU-USC Logistics transformation program. Earl formally adopted it through `HAU-USC-MFR-002-LAUNCHER` on 31 August 2026. The original attachment's pre-adoption status is superseded by this repository-normalized accepted copy; its source hash is preserved in the front matter.
>
> **Owner outcome:** Make the real HAU-USC Logistics website **flexible, fast, beautiful, fluid, impeccable, mobile-first, operationally clear, fullstack, maintainable, recoverable, and grounded in real Playground data**—without replacing the backend, fabricating product behavior, weakening data invariants, or spending the run auditing work that is already proven.
>
> **One-shot means one controlling program, not one giant uncontrolled diff.** Sol receives this once, performs a short authority handshake, then works continuously through internally bounded branches/slices until the final Playground candidate is green or a genuine stop condition is reached.

---

# 0. Controlling owner directive

The current accepted Playground program is already a strong, resettable, backend-backed baseline. The next program must **evolve it**, not restart it.

The target is:

```text
ONE REAL APPLICATION CODEBASE
        |
        +-> permanent Playground lineage
        |     isolated Worker / D1 / R2 / secrets
        |     canonical testing + owner-review surface
        |
        +-> protected Production lineage
              Production Worker / D1 / R2 / secrets
              untouched by this program
```

The transformation must deliver:

```text
MOBILE-FIRST TASK HIERARCHY
+ INTENTIONAL DESKTOP ENHANCEMENT
+ REAL BACKEND / REAL PLAYGROUND DATA
+ NORMAL CACHEABLE WEB BUILD
+ ROUTE-LEVEL CODE + DATA LOADING
+ MEASURED D1 / WORKER IMPROVEMENTS
+ CLEANER FRONTEND + SERVER BOUNDARIES
+ ACCESSIBILITY + SECURITY PRESERVED
+ MINIMAL CANONICAL DOCUMENTATION
+ NO PARALLEL DEMO ARCHITECTURE
```

The program must **not** become:

```text
AUDIT -> REPORT -> REVIEW REPORT -> AUDIT AGAIN -> RUN OUT OF CONTEXT
```

Use:

```text
UNDERSTAND JUST ENOUGH
-> IMPLEMENT
-> USE THE REAL UI
-> FIX MATERIAL DEFECTS
-> VERIFY
-> COMMIT / INTEGRATE
-> CONTINUE
-> STOP WHEN GREEN
```

---

# 1. Intent envelope

```text
INTENT:
  SOFTWARE_FEATURE
  + FRONTEND_REDESIGN
  + FULLSTACK_INTEGRATION
  + PERFORMANCE_OPTIMIZATION
  + ACCESSIBILITY
  + REFACTOR
  + REPOSITORY_MAINTENANCE
  + DOCUMENTATION_CONSOLIDATION
  + PLAYGROUND_HARDENING

MODE:
  EXECUTE AFTER FORMAL REPOSITORY ADOPTION

TARGET:
  invicta-ctrl/hau-usc-logistics-management-system
  permanent Playground branch
  task-scoped work/playground-* branches
  isolated Playground deployment

OUT OF SCOPE:
  Production deployment or mutation
  main mutation except a later separate owner-authorized production program
  unapproved schema migration
  framework replacement
  speculative realtime infrastructure
  speculative database indexing
  provider/secret changes outside accepted Playground scope

RISK:
  HIGH

FINAL DELIVERABLE:
  one exact Playground candidate that is materially better than the frozen
  29 August baseline in mobile usability, design coherence, maintainability,
  data-loading efficiency, measured performance, and implementation cleanliness,
  while preserving business truth and Production isolation.

FINAL STATE:
  READY_FOR_EARL_MOBILE_FIRST_ANNOTATION
```

---

# 2. Authority and cold-start contract

## 2.1 Authority order

For this program use, in order:

```text
1. Earl's current explicit instruction.
2. This MFR-002 file, only after it is formally adopted by the repository.
3. Repository root AGENTS.md.
4. .agents/PROJECT_POLICY.md and applicable worktree policy.
5. Playground .codex/CURRENT.md.
6. Playground .codex/CURRENT_TASK.md.
7. Playground .codex/CURRENT_HANDOFF.md.
8. The accepted MFR-002 repository specification/amendment.
9. Current source, tests, migrations, exact Git state, deployment evidence, and provider bindings.
10. DESIGN.md and current design-system evidence for visual/design roles.
11. Live Figma Make / Figma Design only for the role assigned by current repository governance and this accepted redesign amendment.
12. Historical roadmaps, prompts, prototypes, screenshots, and old reports only when a specific dependency/history question requires them.
```

Higher authority wins. Never average conflicting sources.

A material unresolved conflict is a stop condition.

## 2.2 Minimal startup read

Do **not** broad-scan the repository.

Read first:

```text
AGENTS.md
.agents/PROJECT_POLICY.md
.codex/CURRENT.md
.codex/CURRENT_TASK.md
.codex/CURRENT_HANDOFF.md
this accepted MFR-002 file
current performance/final-candidate receipts directly referenced below
```

Then inspect only source/tests required by the first bounded slice.

## 2.3 Git strategy

Permanent branches are already:

```text
main
Playground
```

This supersedes the stale MFR-001 instruction that said not to create or use a permanent Playground branch.

`main` remains read-only.

Use sequential temporary branches from the **latest integrated Playground HEAD**:

```text
work/playground-<task>
fix/playground-<task>
reconcile/playground-<task>
```

Default:

```text
Playground
-> work/playground-mfr002-<slice>
-> focused verification
-> integrate into Playground
-> verify containment
-> remove temporary branch when safe
-> create next branch from new Playground HEAD
```

Do not stack many dependent work branches in parallel.

## 2.4 One writer

Exactly one canonical writer owns shared repository state at a time.

Default execution route for this program is **SOLO Sol Ultra** unless current repository governance explicitly authorizes bounded read-only workers.

Never allow two writers to race:

- lockfile;
- `.codex` pointers;
- migrations;
- package scripts;
- shared registries;
- generated manifests;
- release/deployment state.

---

# 3. Grounded current baseline — use this, do not restart from older plans

All volatile values are a planning snapshot and must be reverified at program start.

## 3.1 Current repository lineage

```text
main:
  f7e5bf83205dbe58b5fb72126a4456747d92e906

Playground:
  6186f90a0591c7630e1bc564ea6475ae7b61a3ae
```

The authoritative working baseline is **Playground**, not a stale `main` continuity pointer.

## 3.2 Current accepted Playground state

The live Playground chain currently records:

```text
STATUS:
  READY_FOR_EARL_MANUAL_ANNOTATION

ACTIVE_WRITER:
  NONE

SCHEMA:
  32

LATEST MIGRATION:
  0032_staff_account_activity_history.sql

RESET BASELINE:
  PGBL-20260828-COVERAGE-V2

RESET GENERATION:
  8

SESSION STATE:
  CLEAN

PRODUCTION MUTATION:
  ZERO
```

Current frozen runtime evidence records:

```text
accepted deployed runtime source:
  ab356898651317b1441ece72dcc95a9139b9fa21

accepted runtime tree:
  23caaf499f961dbe450f99946d78324d49172c22

staging entry artifact SHA-256:
  3bfa8b83a9bc06d1066cffa9f5467aa34f44e812ec83b3ecf5bba7349d934e0b
```

The preceding program closed with:

```text
169 test files / 1,245 tests passing
1,683-module staging build
fixture boundary PASS
focused Playground contracts PASS
branch topology: main + Playground
P0 = 0
P1 = 0
```

Reuse this evidence until the relevant source/config/data changes invalidate it.

## 3.3 Existing performance gains that MUST be preserved

P23 already changed the real staging/Production build from an enormous initial single-file experience into external CSS + lazy JavaScript chunks.

Measured accepted change:

```text
Deployment initial HTML:
  847,131 B -> 1,558 B

Desktop initial transfer:
  37,110,294 B -> 96,174 B

Midrange mobile Index ready:
  1,639 ms -> 792 ms

Desktop Index ready:
  279 ms -> 128 ms

Slower-network mobile Index ready:
  1,475 ms -> 1,032 ms

Initial requests:
  10 -> 7

Route chunks:
  0 -> 5

Primary navigation CLS:
  0
```

**Do not redo route splitting from scratch.** Extend the existing deployment architecture only where measurements show additional value.

## 3.4 Current build nuance — important correction to PERF-001/MFR-001

The current Vite configuration already behaves differently by mode:

```text
staging / production:
  normal external CSS
  normal asset threshold
  dynamic imports allowed
  deployment artifact marker

preview/default:
  vite-plugin-singlefile
  cssCodeSplit false
  assetsInlineLimit 100,000,000
  inlineDynamicImports true
```

The problem is therefore **not** that the deployed Playground is still one giant single file.

The remaining build debt is that:

```text
npm run build
-> vite build --mode preview
-> create-frontend-shareable
```

and the repository still carries:

```text
vite-plugin-singlefile
create-frontend-shareable
create-shareable
shareable module registry
build:share
build:legacy-artifacts
Apps Script checks/bundles that may or may not still be needed
```

The next program must normalize the **canonical developer/build path** and retire the shareable/demo architecture coherently after dependency proof—without discarding the P23 deployment architecture that already works.

## 3.5 Current D1 evidence — do not invent an index program

P24 already applied all 32 migrations to an isolated Miniflare D1 and inspected 16 representative query plans.

It found real query-shape debt, but **no index/migration was justified** because live `rows_read` and latency evidence was unavailable.

Strongest confirmed repair candidates are:

```text
1. Administration account hydration N+1
   - a 25-row page can trigger up to 75 sequential hydration reads.

2. Generic bootstrap reads the first Inventory page before every module branch.

3. Restocking receives generic Request/Request-line reads it does not use.

4. Several hot list paths use SELECT * rather than purpose-limited projections.

5. Inventory/Event history/reference collections are broad and not fully paginated.

6. Lending loads broad history/assets and filters ticket history in JavaScript.

7. Restocking/canvass includes correlated per-row history work.

8. Several queues scan + temporary-sort global time/order patterns.
```

The default database direction is:

```text
QUERY SHAPE FIRST
-> LIVE ROWS_READ / SQL DURATION
-> EXPLAIN QUERY PLAN
-> INDEX ONLY IF THE AFTER-EVIDENCE JUSTIFIES IT
```

Migration `0033` remains unused unless a later measured slice earns it.

## 3.6 Current design quality — evolve, do not erase

The current candidate has already passed a Hallmark/Impeccable hardening cycle.

It currently preserves:

- strong HAU-USC institutional identity;
- oxblood + restrained gold;
- warm paper content surfaces;
- six theme families with Light/Dark/System behavior;
- solid operational tables/forms/history;
- restrained functional glass;
- queue + inspector workbenches;
- tabular numeric treatment on repaired routes;
- accessible USC mark fallback;
- direct workflow language;
- no major AI-slop patterns.

The last Impeccable result was **19/20**, with remaining low-risk source-level legacy token/radius debt rather than a visible structural failure.

This program is a **design evolution**, not a visual reset.

## 3.7 Confirmed design-system debt worth fixing

Current `DESIGN.md` explicitly records a missing semantic type ramp: the system has governed font families and weights, but route code still uses ad-hoc text sizes.

This is a high-value redesign target because it improves:

- hierarchy;
- consistency;
- mobile reflow;
- maintainability;
- theme coherence;
- visual polish.

Create a real semantic typography scale during the foundation slice rather than continuing one-off font-size literals.

## 3.8 Current product access semantics — correct the older prompts

The accepted current design/product model is:

```text
PUBLIC
  Public Lending Hub
  no staff sign-in required for browsing/borrowing/tracking

AUTHENTICATED REQUESTER
  External Request Center
  verified USC staff/officer session required
  server capability determines eligibility

AUTHENTICATED DOL
  Main Logistics Hub
  capability-gated internal Request/Lending/Inventory/Release/etc.

GENERIC STAFF SIGN IN
  identity gateway
  destination determined by entry intent + capability
```

Therefore, **do not describe the Request Center as a public no-login portal** in the new redesign.

## 3.9 DOL operational grounding

The private 4 July 2026 meeting record remains policy context, not a file to copy into public Git.

Sanitized rules that must remain true:

- office supplies and equipment must be tracked;
- all items entering or leaving the office must be requested/accounted for;
- borrowing requires protected borrower identity evidence under the accepted policy;
- Inventory/Pantry responsibility includes office-stock accountability;
- Materials maintains canvassing/supplier reference information;
- private contact and institutional financial identifiers stay private.

---

# 4. Reconciliation of the three uploaded plans

## 4.1 PERF-001 — retain

Keep:

- measured bottleneck philosophy;
- normal cacheable web-build goal;
- shareable/demo retirement target;
- route/data-level loading;
- in-flight dedupe and cancellation;
- targeted client cache with server-authoritative writes;
- D1 rows-read/query-plan discipline;
- route -> service -> repository backend boundaries;
- explicit cache/privacy classification;
- performance regression gates.

Correct:

- do not treat current Playground deployment as a monolith;
- do not restart P23 route splitting;
- do not assume `main` is the operational baseline for this next program;
- do not restart a generic D1 index audit; P24 already established the exact query candidates and no-index decision.

## 4.2 Playground Mobile-First Impeccable plan — retain

Keep:

- 390 px as primary mobile composition;
- 320 px hard reflow floor;
- desktop as progressive enhancement;
- content-driven breakpoints;
- container-query strategy;
- semantic HTML;
- CSS layer direction;
- six-theme preservation;
- anti-AI-slop rules;
- solid operational surfaces;
- restrained glass;
- route-specific mobile information architecture;
- WCAG 2.2 AA gate;
- final Hallmark + Impeccable pass.

Correct:

- External Request Center is authenticated, not public no-login;
- do not rerun broad P15/P16/P26/P27 audits at the beginning;
- reuse current design direction and only audit the changed surface;
- do not treat a subjective 95/100 score as stronger than real tests/accessibility/performance evidence.

## 4.3 MFR-001 one-shot plan — retain

Keep:

- anti-hallucination evidence typing;
- source-addressable repository facts;
- evidence invalidation rules;
- no fake runtime success;
- minimal documentation authority;
- repository cleanup preservation gate;
- cloud-first Codex environment;
- real backend/resettable Playground;
- continuous owner experience without repeated “continue?” prompts;
- stop when accepted evidence is green.

Correct:

- permanent `Playground` already exists and is now repository authority;
- do not create a single long-lived `release/mfr-*` branch for the entire program when current governance prefers sequential `work/playground-*` branches;
- do not make one mega-diff that combines redesign, database, dependencies, docs, and architecture;
- Cloudflare Vite plugin, Queues, Workflows, Durable Objects, WebSockets, read replication, service workers, or Smart Placement are **optional hypotheses**, not transformation requirements.

---

# 5. Resolved owner decisions for MFR-002

These are the intended decisions this unified reference asks the repository to adopt.

```text
BASELINE:
  current permanent Playground branch + exact current deployed candidate

PRODUCTION:
  read-only / untouched

PRIMARY DESIGN:
  mobile first at 390 CSS px

REFLOW FLOOR:
  320 CSS px

PROGRESSIVE WIDTHS:
  768 -> 1024 -> 1440
  1920 only where additional width has a real operational use

FRONTEND FRAMEWORK:
  preserve current React + Vite application

STYLING:
  converge existing Tailwind / semantic CSS / existing primitives
  do not add another styling framework

DESIGN DIRECTION:
  evolve existing HAU-USC identity
  no generic SaaS redesign

SHAREABLE / DEMO PIPELINE:
  retirement target = YES
  execution only after complete dependency/replacement proof

PLAYGROUND:
  canonical test/review surface
  permanent branch and isolated mutable resources

D1:
  query-shape fixes first
  index only from live proof

R2:
  authoritative governed object/evidence store

GOOGLE:
  secondary only; never user-request critical path

REALTIME:
  targeted revision/invalidation refresh is default
  WebSockets/Durable Objects require separate measured need

STATE MANAGEMENT:
  use current/local/shared transport patterns
  do not add a large client-state library without measured need

SERVICE WORKER:
  not part of this program by default

CLOUDFLARE VITE PLUGIN:
  optional evaluation only if it measurably simplifies the current build/dev path

D1 READ REPLICATION:
  future-only unless geographic latency evidence proves need
```

---

# 6. Anti-hallucination and evidence-reuse contract

## 6.1 Evidence labels

Every material engineering claim is one of:

```text
FACT
  directly observed in current repo/test/provider/deployment evidence

INFERENCE
  reasoned conclusion from one or more facts

UNVERIFIED
  missing, stale, or contradictory evidence

DECISION
  accepted owner/specification/repository direction
```

Do not use `UNVERIFIED` as implementation truth for:

- authorization;
- identity;
- data migration;
- ledger/custody;
- provider bindings;
- destructive cleanup;
- privacy;
- Production;
- required business workflow semantics.

## 6.2 Load-bearing repository fact format

Record the smallest useful locator:

```text
branch / SHA / tree
path
symbol / route / migration
command or test
provider/environment when relevant
```

Generate counts from source when possible.

Do not write “probably 33 routes” if a route registry can count the exact current set.

## 6.3 Evidence invalidation

Before rerunning expensive work ask:

```text
Did relevant source change?
Did build/config change?
Did dependencies change?
Did data baseline change?
Did provider/environment state change?
Did artifact identity change?
```

If every answer is no, reuse the prior proof.

Specifically reuse P15/P16/P22/P23/P24/P25/P26/P27/P28/final-candidate evidence until the relevant changes invalidate it.

## 6.4 Runtime truth

A supported normal workflow must either:

```text
use real isolated Playground backend state
OR show a truthful loading/empty/error/denied/unsupported state
```

Never:

- fabricate stock;
- fabricate counts;
- fabricate a logged-in identity;
- fake success after a failed API call;
- simulate authorization in the browser;
- silently substitute fixtures for a backend-supported route.

---

# 7. Target architecture

```text
CLOUDFLARE EDGE
      |
      +------------------------------+
      |                              |
      v                              v
FINGERPRINTED STATIC ASSETS       WORKER/API
HTML + CSS + JS + fonts/media     HTTP/auth/validation
      |                              |
      v                              v
BROWSER APP SHELL                 ROUTE HANDLER
      |                              |
      +-> route lazy loader           +-> domain/service
      +-> route data loader           +-> repository/data access
      +-> shared transport            +-> D1 structured truth
      +-> in-memory route cache       +-> R2 object truth
      +-> revision invalidation
      +-> targeted UI update

D1/R2 commit
  -> optional existing async sidecars
  -> Google projection/mirror later
  -> never blocks a valid core user operation
```

## 7.1 Frontend boundaries

```text
route/view
-> controller or view-model when complexity warrants it
-> feature adapter
-> shared transport/session/CSRF/error layer
-> Worker API
```

A route component must not:

- know D1 table structure;
- implement server authorization;
- duplicate fetch/CSRF/session policy;
- import unrelated feature internals;
- become a multi-thousand-line mixture of view, business rules, API, and transforms.

## 7.2 Backend boundaries

```text
HTTP route
-> parse/auth/capability
-> service/domain behavior
-> repository/query layer
-> D1/R2
```

The Worker entry is composition/dispatch, not the entire product.

Refactor one route family at a time with contract/regression protection.

---

# 8. Mobile-first design system

## 8.1 Quality definition

The target terms mean:

### FLEXIBLE

- 320 px reflow;
- 360–430 px phones;
- tablet;
- desktop;
- keyboard/mouse/touch;
- 200% zoom;
- long labels;
- empty and dense data;
- all existing theme families and modes.

### FAST

- preserve P23 initial-loading gains;
- route/code/data only when needed;
- minimal duplicate work;
- stable geometry;
- quick feedback;
- no decorative long tasks.

### BEAUTIFUL

- typography;
- proportion;
- hierarchy;
- alignment;
- restraint;
- institutional identity;
- calm operational density.

### FLUID

- route/sheet/drawer transitions preserve context;
- no blanking the whole app for a pane refresh;
- filters/selection/scroll/focus persist where appropriate;
- state changes explain themselves without slowing the task.

### IMPECCABLE

- no broken/dead controls;
- no accidental overflow;
- no duplicated primary actions;
- no fake records;
- no inaccessible focus;
- no contradictory state;
- no one-theme-only surface;
- no mobile information loss.

## 8.2 Preserve the current design DNA

Preserve:

```text
HAU Institutional identity
oxblood structural color
canonical restrained gold
warm paper/content surfaces
Newsreader editorial moments
Bricolage Grotesque display identity
IBM Plex Sans operational UI
IBM Plex Mono technical/ID use where deliberate
solid tables/forms/history
restrained contextual glass
queue + inspector workbench
tabular figures
6 / 10 / 14 px touched-radius scale
six semantic theme families
Light / Dark / System
reduced motion
```

Do not turn this into Linear/Vercel/Notion-like monochrome minimalism or a generic AI dashboard.

## 8.3 Fix the typography debt

Create one semantic type contract in the design token source.

Required roles:

```text
display/editorial
page-title
section-title
record-title
body
compact-body
label
metadata/caption
numeric/data
mono-reference
```

Use bounded `clamp()` only where it improves responsive hierarchy.

Do not turn every size into fluid type.

Derive final values through browser comparison against current accepted screens and mobile reflow; do not simply bless the existing ad-hoc literals as a “scale.”

## 8.4 CSS architecture

Move custom application CSS toward:

```css
@layer reset, tokens, base, layout, components, states, utilities, overrides;
```

Use:

- Grid for page composition;
- Flexbox for one-dimensional alignment;
- container queries for reusable component composition;
- logical properties;
- `clamp`, `min`, `max`;
- `dvh/svh/lvh` where mobile viewport behavior requires it;
- safe-area environment variables;
- `scrollbar-gutter: stable` where it prevents jank;
- `:focus-visible`;
- progressive `:has()` where it simplifies styling without becoming a functional dependency.

Do not create selector-specificity wars.

## 8.5 Mobile hierarchy

Design each material route first at:

```text
390 CSS px
```

Then verify:

```text
320   hard reflow floor
390   primary mobile authority
768   tablet enhancement
1024  desktop transition
1440  primary desktop acceptance
1920  only when real wide-screen utility exists
```

Mobile determines:

- first useful information;
- primary action;
- status placement;
- record ordering;
- disclosure hierarchy;
- touch ergonomics;
- form sequence;
- error recovery;
- sticky action behavior.

Desktop may add context and density; it must not invert task priority.

## 8.6 Mobile navigation

No desktop sidebar compressed into a phone.

Use the smallest route-appropriate combination of:

- compact institutional header;
- role-aware top navigation;
- bottom navigation only when destination count and frequency justify it;
- compact More sheet for lower-frequency routes;
- task-specific bottom action dock only when it materially improves completion.

Sticky UI must never obscure focused content or the software keyboard.

## 8.7 Operational data on mobile

Do not turn every table into decorative cards.

Preserve decision-quality fields:

```text
identity
status
critical quantity
availability/consequence
important date/time
next action
```

Secondary fields may move to a detail sheet/inspector.

Horizontal scrolling is acceptable only for truly two-dimensional comparison.

## 8.8 Forms

- one task per section;
- one dominant final action;
- visible labels;
- correct autocomplete/input types;
- units beside quantities;
- plain-language validation;
- preserve values after recoverable errors;
- clear hidden/irrelevant values from payload when dynamic branches change;
- server remains validation authority.

## 8.9 Motion

Motion explains change.

Use for:

- inspector/drawer continuity;
- selected-record change;
- collapse/expand;
- save confirmation;
- route-region continuity.

Avoid:

- ambient loops;
- motion on every hover;
- decorative scroll effects;
- animated status chips;
- blocking entrance sequences.

View Transitions may be used only as progressive enhancement when they materially improve route continuity.

Reduced motion always preserves state feedback.

---

# 9. Anti-AI-slop contract

Never add:

- fake metrics or “insights”;
- generic SaaS card walls;
- random gradients/glows/orbs;
- nested glass-card stacks;
- rainbow icons;
- giant slogan typography on operational pages;
- meaningless eyebrow labels;
- a pill for every noun;
- eight equal action buttons;
- hover-only important actions;
- tiny icon-only mobile controls;
- fake AI features;
- decorative animation as proof of polish.

Prefer:

- one clear primary action;
- real record consequence;
- precise headings;
- quiet separators;
- direct verbs;
- compact but breathable density;
- contextual secondary action;
- excellent loading/empty/error/denied/conflict states;
- real operational language.

Do not replace a removed slogan with a new slogan merely to fill space.

---

# 10. Route and information architecture

The exact current route registry always wins.

## 10.1 Landing / gateway

Mobile:

- compact USC/DOL identity;
- immediate explanation of the system;
- clear entry to **Public Lending**, **External Request Center (authenticated)**, and **Staff Sign In** as applicable;
- announcements secondary to primary service access;
- no heavy media blocking first action.

Desktop may add institutional composition without becoming a marketing site.

## 10.2 Public Lending Hub

Remains no-login per current product authority.

Prioritize:

```text
browse eligible catalog
-> select item/quantity
-> borrower details/verification
-> purpose + pickup/due where applicable
-> acknowledgement
-> review
-> submit
-> receipt/tracking
```

Public responses remain borrower-safe and purpose-limited.

## 10.3 External Request Center

Authenticated requester context.

Prioritize:

```text
sign in / preserve entry intent
-> request purpose
-> requester/event context
-> requirements
-> review
-> submit
-> receipt/status
```

Do not expose it as a public no-login route.

## 10.4 Staff Sign In / account flows

- calm institutional form;
- excellent autofill/password-manager behavior;
- stable password visibility;
- generic errors that do not enumerate accounts;
- clear verification/application/approval state;
- no provider/database wording.

## 10.5 Overview

Answer:

```text
What needs attention?
What is ready?
What is blocked?
What changed?
What can I act on now?
```

Avoid a KPI wall.

## 10.6 Inventory

Mobile:

- search first;
- compact filters;
- On Hand / Reserved / Available visible together;
- record detail sheet;
- contextual actions.

Desktop:

- dense table;
- efficient filters/search;
- persistent/large inspector;
- movement/reservation/history context;
- keyboard efficiency.

Never expose direct editable stock balance.

## 10.7 Internal Request Hub

Mobile:

```text
queue
-> selected request
-> line decisions
-> consequence/action
```

Desktop:

```text
queue + inspector
```

Preserve request/reservation/routing semantics.

## 10.8 Lending Hub

Structure around lifecycle:

```text
For review
Ready to claim
On loan
Overdue
Returned / completed
```

Actions stay attached to the selected borrower/item context.

## 10.9 Release Desk

Treat as a focused station:

```text
ready record
-> authoritative stock recheck
-> recipient
-> quantity
-> evidence if required
-> confirm
-> receipt/history
```

No unrelated dashboard clutter.

## 10.10 Restocking / Receiving

Prioritize:

- items needing attention;
- inbound items;
- expected vs received;
- partial receipt;
- discrepancy;
- recent receipts;
- source/supplier context.

## 10.11 Procurement / Deliverables

Prioritize:

- request/source context;
- current stage;
- canvass/supplier evidence;
- next action;
- receiving/deliverable relationship.

No invented finance product.

## 10.12 Events

Only expose backend-supported event readiness/logistics behavior.

Do not invent a generic event-management platform.

## 10.13 Administration

Mobile:

```text
search/list
-> open full detail/sheet
-> privileged actions distinctly separated
```

Desktop:

```text
master list + persistent detail
```

System-level actions visually and semantically separate from ordinary edits.

## 10.14 Profile

Prioritize:

- identity;
- account state;
- profile/contact;
- appearance;
- security/account actions.

## 10.15 Playground Index / QA Hub

Primary:

- search;
- route name;
- one-click open;
- environment identity;
- compact health signal.

Secondary technical contract metadata appears only after selection.

It should feel like a fast QA launcher, not a documentation dump.

---

# 11. Frontend data-flow and perceived-performance contract

## 11.1 Initial shell

The initial authenticated shell should load only what it needs:

```text
session/current user
capability/route visibility
small operational context
release/environment identity
minimal attention counters if actually needed above the fold
```

Do not return full Inventory, full histories, every request, every loan, Procurement, and Administration in one bootstrap.

## 11.2 Route module data

Use the current module/bootstrap architecture efficiently:

```text
shell ready
-> route module requested
-> route renders
```

Combine shell + route only when measurement proves it produces a lower total cost for that entry path.

## 11.3 In-flight deduplication

One navigation/action must not trigger duplicate identical:

- bootstrap;
- version;
- session;
- route module;
- reference-list calls.

Share the same in-flight Promise by cache key.

## 11.4 Stale request cancellation

Abort obsolete:

- search;
- filter;
- route;
- selected record;
- closed drawer/detail requests.

Use `AbortController` or current repository equivalent.

## 11.5 Small in-memory cache

Do not add a large state framework by default.

Safe candidates:

- current session/capability projection;
- stable reference lists;
- last successful route page;
- item lookup page;
- safe public catalog metadata.

Each cache entry should know:

```text
key
data
revision/etag when available
loaded_at
staleness policy
in-flight promise
```

## 11.6 Stale-while-revalidate UX

On return to a recently visited route:

```text
show last valid data immediately where safe
-> refresh in background
-> update only if changed
```

Do not blank the route every time.

## 11.7 Consequential mutations

For:

- reservation;
- release;
- handoff;
- return;
- receiving;
- inventory adjustment;
- access changes;

use:

```text
server commit first
-> authoritative response/revision
-> patch affected record/count
-> invalidate only dependent cache keys
```

Never fake irreversible success.

## 11.8 Retry policy

Automatic retry only for:

- safe reads;
- operations that are explicitly idempotent and server-supported.

Do not retry non-idempotent writes blindly.

---

# 12. Performance program — baseline-relative, not arbitrary

## 12.1 Core Web Vitals target

Field target at p75, segmented by mobile and desktop:

```text
LCP <= 2.5 s
INP <= 200 ms
CLS <= 0.10
```

Lab evidence catches regressions; field evidence represents real experience when available.

## 12.2 Protect the accepted P23 gains

Use the exact current measurement profile when comparing source-changing slices.

Current P23 baseline alarms:

```text
Initial transfer baseline:
  96,174 B

Default unexplained-regression alarm:
  >15% increase on the same profile
  (~110.6 KB)

Midrange mobile route-ready baseline:
  792 ms

Default unexplained-regression alarm:
  >15% on the same profile
  (~911 ms)

Slower-network route-ready baseline:
  1,032 ms

Primary-navigation CLS:
  0
```

These are **lab regression references**, not replacements for field Web Vitals.

A redesign may intentionally increase one metric only when:

```text
reason
measured user benefit
tradeoff
new accepted budget
```

are recorded.

## 12.3 Do not set fantasy bundle limits

Measure current chunks first.

Use relative budgets:

```text
initial shell transfer
largest route chunk
route-specific CSS
request count
parsed/executed JS
main-thread long tasks
route-ready time
```

A route chunk doubling without an accepted reason is a stronger signal than an arbitrary universal “100 KB” rule.

## 12.4 Route splitting

Keep the P23 lazy renderer and protected-inspection lazy boundary.

Further split only by coherent feature boundaries:

- public lending/requester entry;
- authenticated shell;
- Inventory;
- Request;
- Lending;
- Release;
- Supply/Procurement;
- Administration;
- genuinely heavy reporting/charting.

Do not create a chunk per tiny component.

## 12.5 Prefetch carefully

After current route is interactive, optional prefetch can follow:

- nav pointer/focus intent;
- known next workflow step;
- idle browser time.

Never prefetch the entire app.

## 12.6 Chunk-deployment recovery

With hashed dynamic chunks, implement a graceful stale-version recovery using Vite's `vite:preloadError` event or an equivalent existing repository mechanism.

HTML must revalidate rather than remain stale while old chunk URLs disappear.

Do not hide genuine network failures behind infinite reload loops.

## 12.7 Media

Current deployment contains a very large institutional hero video divided into large chunks, but P23 prevents it from being an invisible initial-load cost.

For MFR-002:

- keep it off the initial critical path;
- measure whether it materially improves the product;
- prefer a lightweight responsive poster/image on mobile;
- if motion media remains, supply right-sized/compressed delivery and avoid autoplay cost on constrained devices;
- consider explicit/intent/idle loading rather than background download;
- remove the giant asset if its user value does not justify its transfer/storage complexity.

Protected evidence originals remain authoritative in R2 and are not recompressed destructively.

## 12.8 Fonts

- WOFF2;
- only used weights;
- avoid unnecessary preloads;
- critical font only if actually LCP/brand-important;
- stable fallback metrics;
- no font binaries inlined into HTML.

## 12.9 Dependency discipline

Current `package.json` includes a broad UI ecosystem: MUI/Emotion, many Radix primitives, Lucide, Motion, Popper, carousel/layout utilities, React Hook Form, charts, drawers, command UI, and more.

Build an actual production import graph and classify each dependency:

```text
PRODUCTION_USED
TOOLING_OR_TEST_ONLY
INDIRECT_REQUIRED
DEAD
UNVERIFIED
```

Remove only proven `DEAD` packages.

Do not rewrite good components only to reduce a package count.

Do not let three component systems proliferate inside new MFR-002 components.

---

# 13. D1 / query optimization — use the P24 findings as the work queue

## 13.1 Required loop

```text
MEASURE
-> RANK HOT PATHS
-> EXPLAIN QUERY PLAN
-> FIX QUERY SHAPE
-> MEASURE AGAIN
-> INDEX ONLY IF JUSTIFIED
-> MEASURE AGAIN
```

Capture where available:

```text
query ID / route
SQL fingerprint
calls per user action
rows_read
rows_written
rows returned
sql_duration_ms
response bytes
plan/index
p50/p95 route latency
```

## 13.2 Priority 1 — Administration N+1

P24 already proved a deterministic application-level N+1.

Default repair direction:

```text
account page IDs
-> set-based joins / grouped lookup / bounded batch
-> one hydration result keyed by account
```

Preserve authorization and field scoping.

Verify query count and rows-read before/after.

## 13.3 Priority 2 — bootstrap overfetch

Current generic bootstrap reads Inventory before every branch.

Repair so:

```text
shell bootstrap = shell data
route module = route data
```

Do not fetch Inventory for Procurement/Administration/etc. unless the route really uses it.

## 13.4 Priority 3 — Restocking redundant reads

Remove generic Request/Request-line work from the Restocking response path when the DTO does not use it.

## 13.5 Priority 4 — purpose-limited projections

Replace high-traffic `SELECT *` list queries with the exact columns rendered/needed for that response.

Detail endpoints may return more.

## 13.6 Priority 5 — pagination

For large/growing histories use cursor/keyset pagination when practical:

```sql
WHERE (created_at, id) < (?, ?)
ORDER BY created_at DESC, id DESC
LIMIT ?
```

Adapt to SQLite/D1 syntax and the actual stable key.

Do not introduce cursor complexity for tiny stable reference lists.

## 13.7 Priority 6 — set-based lending/history work

Avoid loading broad ticket histories and filtering them per ticket in JavaScript when a bounded set-based query can return the exact ticket subset.

## 13.8 Priority 7 — correlated hot aggregates

Benchmark the canvass/preferred-history and lending-availability correlated work.

Prefer grouped/set-based CTE/subquery + join if it materially reduces repeated work.

Do not create a denormalized second truth store merely for speed.

## 13.9 Index gate

A new index requires:

```text
exact hot query
live/representative cardinality
before query plan
before rows_read / duration
after query plan
after rows_read / duration
write/storage tradeoff
isolated migration rehearsal
rollback or forward-fix
```

Do not blanket-create global time indexes.

Leading wildcard search is not fixed by a normal B-tree; change search semantics or evaluate FTS only when dataset/use evidence justifies the storage/write cost.

## 13.10 D1 batch

Use D1 `batch()` when multiple related prepared statements are required for one response/transactional operation and it reduces round trips.

Do not batch unrelated expensive queries merely because the API exists.

---

# 14. Worker and server modularization

The goal is clarity, not a line-count competition.

## 14.1 Worker entry

Keep only:

- request entry;
- host/environment validation;
- shared security headers;
- correlation IDs;
- service composition;
- route registration/dispatch;
- top-level safe errors.

Move feature-specific routes behind feature modules.

## 14.2 Route extraction order

Use one family at a time, only when tests/contracts protect behavior:

```text
bootstrap/session
-> public lending / requester entry
-> inventory
-> request
-> lending
-> release
-> restocking/procurement
-> administration/profile
```

Do not rewrite the entire Worker in one branch.

## 14.3 Server layering

```text
HTTP
-> auth/capability + request validation
-> service/domain
-> repository/data access
-> D1/R2
```

Raw SQL belongs in data-access/repository modules, not scattered through UI or the HTTP entry.

---

# 15. Build architecture and shareable/demo retirement

## 15.1 The desired steady state

```text
npm run build
  = canonical normal application build

npm run build:cloudflare
  = isolated Playground/staging artifact

npm run build:cloudflare:production
  = Production-mode artifact

ACTIVE SHAREABLE/DEMO BUILD PIPELINE
  = none
```

The exact final script names may follow repository convention.

## 15.2 Removal gate

Before removing any shareable/legacy path:

```text
1. Search imports, scripts, CI, tests, docs, release tooling, and deploy tooling.
2. Identify unique behavior still required.
3. Move valid behavior to the real Playground/Production path.
4. Add replacement regression checks.
5. Remove generator/registry/output/dependency together.
6. Regenerate lockfile.
7. Verify local normal build.
8. Verify staging Cloudflare build/dry-run.
9. Verify production-mode build without deploying Production.
10. Search for zero active shareable/demo references.
11. Record disposition + rollback/history location.
```

## 15.3 Apps Script / Google legacy tooling

Do not delete merely because it says “Apps Script.”

Classify:

```text
STILL_REQUIRED_SIDECAR_OR_RECOVERY
DEAD
UNVERIFIED
```

Only remove after repository/provider references prove it no longer serves an accepted Google sidecar/import/recovery purpose.

## 15.4 Build identity

Every frozen candidate records:

```text
source branch/SHA/tree
lockfile hash
toolchain versions
build mode
HTML hash
asset manifest/hashes
Worker identity
schema/migration
environment
Playground baseline ID/reset generation
```

---

# 16. Cloudflare delivery and caching

## 16.1 Static asset model

Use Workers Static Assets for fingerprinted frontend assets.

For hashed immutable assets:

```http
Cache-Control: public, max-age=31556952, immutable
```

For the SPA HTML shell:

```http
Cache-Control: no-cache
```

or equivalent revalidation.

Do not give non-fingerprinted HTML an immutable year-long cache.

## 16.2 Private API responses

Authenticated operational responses normally remain:

```http
Cache-Control: no-store
```

including:

- account/access state;
- internal requests;
- lending custody;
- releases;
- inventory mutation state;
- private evidence.

Never shared-cache personalized operational JSON.

## 16.3 Safe public caching

After privacy/freshness review, consider short shared caching for:

- public lending catalog metadata;
- published announcements;
- safe branding/reference metadata.

TTL is a product freshness decision, not a universal constant.

## 16.4 Security headers

Verify static and Worker responses appropriately:

- CSP;
- `X-Content-Type-Options`;
- `Referrer-Policy`;
- `Permissions-Policy`;
- frame/clickjacking policy;
- HSTS in Production configuration when later promoted.

Static `_headers` does not replace headers on dynamic Worker responses.

## 16.5 Bindings first

Use native D1/R2/other accepted bindings in Worker hot paths rather than Cloudflare REST APIs when a binding exists.

## 16.6 Async correctness

Every Promise is:

```text
awaited
OR intentionally attached to ctx.waitUntil for non-response-critical work
```

No floating async work.

Do not store request/user mutable state in module-level globals.

## 16.7 Optional Cloudflare changes

### Cloudflare Vite plugin

Evaluate only if it materially reduces custom Vite/Wrangler glue or improves workerd parity.

If current scripts remain simpler and fully correct after cleanup, keep them.

### Compatibility date

Update only through isolated proof:

```text
old date recorded
-> current official change review
-> types
-> build
-> dry run
-> Worker tests
-> browser smoke
```

### Queues / Workflows

Use only for real existing/new background or durable multi-step needs.

Do not move tiny synchronous operations into them for architecture fashion.

### Durable Objects / WebSockets

Do not add for “realtime feel.”

Targeted revision refresh remains the default. A push architecture needs measured need and a separate accepted specification.

### D1 read replication

Do not add until real user geography/latency shows the primary D1 access path is the bottleneck. If later adopted, follow the current Sessions API consistency requirements.

---

# 17. Accessibility and inclusive interaction

Target:

```text
WCAG 2.2 AA
```

## Required gates

### Reflow

- no loss of information/function at 320 CSS px;
- 200% zoom passes;
- horizontal scroll only for content that genuinely requires two dimensions.

### Focus

- visible `:focus-visible`;
- focus never fully hidden by sticky headers/action docks;
- drawers/dialogs trap/restore focus correctly;
- route changes place focus intentionally when needed.

### Targets

WCAG minimum target-size requirements pass.

For frequent mobile primary controls prefer approximately:

```text
44–48 CSS px
```

when layout permits.

### Keyboard

Every functional action is keyboard available.

Dragging has a non-drag alternative unless path movement is essential.

### Contrast

All existing family/mode palettes continue to pass the repository's deterministic theme/contrast checks.

### Motion

Reduced-motion mode removes nonessential movement but preserves state feedback.

### Forced/high contrast

Key controls, selected state, errors, and focus remain understandable.

### Authentication

Do not interfere with:

- password managers;
- copy/paste;
- autofill;
- show/hide password behavior.

---

# 18. Security, privacy, and data invariants

Never trade these for polish or milliseconds.

```text
D1 = authoritative structured operational truth
R2 = authoritative governed object/evidence truth
Google = secondary projection/mirror/import/reconciliation only
browser state = never authoritative
UI hiding = never authorization
```

Preserve:

- server-side capability checks;
- secure session behavior;
- CSRF boundaries;
- generic auth errors;
- idempotency of consequential writes;
- append-only ledger/audit/custody/history;
- reservation correctness;
- Request submission does not deduct stock;
- explicit receiving/release/handoff/return/transfer/reversal/adjustment;
- Playground/Production isolation;
- no secret/private data in logs/screenshots/public Git.

Do not automatically retry a consequential write unless the server contract explicitly supports safe idempotent replay.

---

# 19. Repository and documentation cleanup

## 19.1 Removal discipline

Every deletion/consolidation:

```text
INVENTORY
-> HASH
-> CLASSIFY
-> CHECK IMPORTS/REFERENCES/CI/BUILD/DOCS
-> INSPECT UNIQUE CONTENT
-> VERIFY REPLACEMENT
-> FOCUSED TEST
-> DELETE OR ARCHIVE
-> RESCAN
-> FULL DIFF REVIEW
-> RECORD DISPOSITION
```

`UNKNOWN` work is never deleted.

## 19.2 Minimal durable documentation target

Do not create another forest of status files.

Keep one clear role for each truth:

```text
.codex/CURRENT.md
.codex/CURRENT_TASK.md
.codex/CURRENT_HANDOFF.md

DESIGN.md
  durable design system and current design authority

one product/workflow authority set
  Request / Inventory / Lending / Release / Supply / Identity as needed

one architecture index
  Worker / D1 / R2 / environment / auth / build

one Playground operations/reset runbook

one performance baseline/budget document

one cleanup/archive manifest
```

Generate dynamic route/build/dependency facts when possible rather than manually duplicating them.

## 19.3 Current Project Source direction

After MFR-002 is accepted as the replacement planning reference, the three 31 August plans should be treated as historical planning inputs rather than three simultaneous active “master” plans.

Do not delete them automatically.

Existing high-confidence source-cleanup candidates still include historical assistant receipts/wrappers such as:

```text
SDD Implementation Review.txt
Project Status Summary PDF.txt
Lending Center Fixes.txt
AGENTS(3).md
```

subject to the existing source-removal gate.

Keep the July 4 meeting PDF private.

---

# 20. Codex Cloud operating model — one prompt, bounded internal work

OpenAI's current Codex guidance favors well-scoped, verifiable tasks and durable repository context. MFR-002 reconciles that with Earl's desire for a single prompt:

```text
ONE OWNER PROMPT
  controls the entire program

INTERNAL SLICES
  are small enough to reason about, test, commit, and recover

NO OWNER “CONTINUE?” GATE
  between routine green slices

DURABLE STATE
  lives in Git + accepted spec + .codex handoff
```

## 20.1 Default loop

```text
1. Select the highest-value incomplete acceptance criterion.
2. Read only its load-bearing source/tests.
3. Implement the smallest complete vertical slice.
4. Run the smallest meaningful deterministic verification.
5. Use the affected UI in a browser.
6. Fix material defects.
7. Review the complete diff.
8. Commit/integrate a coherent checkpoint.
9. Update compact durable handoff.
10. Continue automatically if no stop condition fired.
```

## 20.2 Investigation fuse

Investigate only when:

- a test fails;
- acceptance is unproven;
- a dependency is actually required;
- security/privacy/invariant is implicated;
- authority conflicts;
- migration is discovered;
- repeated failure indicates a shared cause.

Do not “research” settled P15/P16/P23/P24/P26/P27 findings again because time is available.

## 20.3 Failure fuse

```text
first same-root failure:
  diagnose and repair

second same-root failure:
  change strategy / escalate with a concise evidence packet

third identical loop:
  forbidden
```

## 20.4 Commit policy

Commit coherent engineering slices, not model turns.

Good:

```text
perf(build): retire verified shareable path
feat(ui): establish mobile-first shell foundation
feat(inventory): adopt responsive inventory workspace
perf(d1): remove admin account hydration N+1
refactor(worker): extract inventory route service boundary
```

Avoid “audit pass 4,” “agent notes,” or report-only commits during implementation.

---

# 21. Unified execution sequence

This is one owner-level program. Internally, use the smallest number of sequential branches required to keep each diff clear.

A phase below may split into 2–3 branches if it contains independent objectives. Never force unrelated work into one branch merely to reduce branch count.

---

## U00 — Adopt MFR-002 and re-anchor the current freeze

**Branch:** `work/playground-mfr002-adopt`

### Objective

Make this unified reference the accepted next program without changing runtime behavior.

### Actions

- reverify `Playground`, `main`, branch parity, active writer, current pointer;
- reverify exact deployed runtime source/tree/artifact;
- register the repository-normalized MFR-002 spec/amendment;
- update current/task/handoff;
- explicitly record that P34 manual-annotation freeze is superseded only for this accepted next program;
- record all current evidence that remains reusable.

### Verification

Governance/documentation checks only.

### Stop

Integrate immediately and continue U01.

---

## U01 — Canonical build + dependency/source map foundation

**Branch:** `work/playground-mfr002-build-foundation`

### Objective

Fix the build/dependency foundations once so all later design/performance work measures the real future architecture.

### Actions

- map active shareable/demo/Apps Script references;
- map installed dependencies to actual production imports;
- preserve P23 staging/Production external-asset build behavior;
- make the canonical ordinary `npm run build` a real application build;
- retire the shareable/demo pipeline completely if dependency proof is green;
- otherwise isolate the exact unresolved dependency and stop only that removal, not the entire program;
- add/retain deploy-artifact checks so a historical single-file artifact can never masquerade as a Production candidate;
- add stale dynamic-chunk recovery;
- establish baseline bundle/request report from the new canonical build.

### Do not

- redesign routes yet;
- remove Apps Script support without proof;
- add a new build framework;
- adopt Cloudflare Vite plugin unless a bounded comparison proves a real benefit.

### Acceptance

```text
canonical build = normal web app
Playground/staging build = normal web app
Production-mode build = normal web app
active shareable/demo pipeline = 0 if removal proof passed
no broken SPA deep link
P23 performance gains preserved within accepted budget
```

---

## U02 — Mobile-first design foundation

**Branch:** `work/playground-mfr002-design-foundation`

### Objective

Create the shared design system that prevents route-by-route styling drift.

### Actions

- semantic typography ramp;
- spacing/density roles;
- content widths;
- mobile safe areas;
- CSS cascade layers;
- container-query primitives;
- semantic surface/border/elevation roles;
- control heights/touch sizes;
- z-index contract;
- motion duration/easing roles;
- focus and forced-color behavior;
- remove low-risk legacy token/radius debt only in touched shared code.

### Preserve

- six theme families;
- 12 palette/mode contrast expectations;
- current HAU identity;
- solid operational planes;
- restrained glass.

### Acceptance

Five-width structural matrix + theme checks + focused tests + no route semantic change.

---

## U03 — App shell and responsive navigation

**Branch:** `work/playground-mfr002-shell`

### Objective

Make mobile the primary application frame and desktop a deliberate enhancement.

### Actions

- authenticated shell;
- public shell where shared;
- mobile navigation;
- desktop navigation;
- responsive page frame;
- page/context headers;
- inspectors/sheets/drawers;
- sticky action behavior;
- safe-area and keyboard viewport;
- route focus management;
- 200% zoom.

### Acceptance

```text
320 no functional loss
390 excellent primary experience
768 intentional tablet composition
1024 desktop transition
1440 intentional desktop
no focus obscured
no accidental horizontal overflow
```

Deploy to Playground only if current provider authorization is available and exact candidate checks are green.

---

## U04 — Landing + Public Lending + authenticated Request entry + auth/profile

**Branch:** `work/playground-mfr002-entry-flows`

### Objective

Make the first experience fast, beautiful, correct, and role-clear.

### Key correction

```text
Public Lending = no login
External Request Center = authenticated requester
Staff Sign In = generic gateway
```

### Actions

- reduce/replace heavy hero media if measured value is weak;
- strengthen mobile form sequence;
- improve receipts/status/error recovery;
- preserve account lifecycle and password-manager behavior;
- profile presentation cleanup;
- no marketing filler.

---

## U05 — Overview + Inventory

**Branch:** `work/playground-mfr002-overview-inventory`

### Objective

Set the operational quality bar.

### Overview

Attention-driven, not KPI-card-driven.

### Inventory

Mobile record-first + detail sheet; desktop dense table + inspector.

Preserve On Hand / Reserved / Available semantics and ledger authority.

Measure search/filter and route-ready interaction on realistic baseline data.

---

## U06 — Internal Request Hub

**Branch:** `work/playground-mfr002-request-hub`

### Objective

Create a coherent review/routing workbench.

Mobile:

```text
queue -> selected request -> line decisions -> action
```

Desktop:

```text
queue + inspector
```

Preserve request submission/reservation/stock/procurement/release semantics.

---

## U07 — Lending + Release

**Branch:** `work/playground-mfr002-custody`

### Objective

Make custody precise and fast.

Before consequential confirmation show:

```text
record
person/recipient
item
quantity
consequence
```

Preserve protected identity/evidence, partial/cumulative behavior, idempotency, and audit.

---

## U08 — Restocking + Procurement + Events + Administration + Playground Index

Split this phase into separate branches if diff size or domain coupling becomes large.

### Objectives

- Receiving: discrepancy/inbound focus.
- Procurement: canvass/supplier/deliverable consequence.
- Events: supported logistics readiness only.
- Administration: responsive master/detail with privileged-action clarity.
- Index: launcher first, technical detail second.

### Performance opportunity

When Administration and Restocking routes are touched, repair the already-proven P24 N+1/redundant-read issues in a **separate focused commit/branch** if the change is contract-safe.

Do not hide database refactoring inside a visual diff.

---

## U09 — Fullstack data-path and D1 hot-query hardening

Use multiple focused branches by query family if needed.

### Objective

Remove proven overfetch/query waste without changing business behavior.

### Priority

```text
1. admin account hydration N+1
2. bootstrap Inventory overfetch
3. Restocking unused generic reads
4. purpose-limited SELECT projections
5. pagination for growing histories
6. lending set-based history retrieval
7. correlated hot aggregate repair
8. only then live evidence for candidate indexes
```

### Acceptance for each query change

```text
before query count/plan/rows_read when available
after query count/plan/rows_read
correctness/authorization tests
route response equivalence
p50/p95 where measurable
```

No speculative migration.

---

## U10 — Worker modularity + cache/R2/static/security + repository cleanup

Do **not** combine all of this in one diff. Use focused branches.

### Worker modularity

Extract only multi-responsibility hotspots, one route family at a time.

### Caching/assets

- immutable fingerprinted static assets;
- revalidated HTML;
- private API no-store;
- safe public short caching only after privacy review;
- right-sized public display media;
- protected evidence remains private/original-authoritative;
- font cleanup.

### Security

Tighten CSP/headers only with tests and without broad wildcards.

### Repository

- remove proven dead dependencies/scripts;
- consolidate duplicate current docs;
- preserve historical evidence;
- update one cleanup/archive manifest;
- no unknown deletion.

---

## U11 — Final integrated Playground acceptance and freeze

**Branch:** `work/playground-mfr002-final`

### Objective

Prove the complete transformed product once, then stop.

### Final design review

Do **not** repeat the original broad P26/P27 process throughout the program.

At the end:

```text
one Hallmark review of the changed final product
-> one bounded repair batch
-> one Impeccable hardening pass
-> one confirmation only if source changed materially
```

### Required route matrix

Every supported route:

```text
390 mobile
1440 desktop
```

Structural/accessibility automation:

```text
320
390
768
1024
1440
```

Add 1920 only for surfaces that intentionally use wide-screen space.

### Required states

Primary workflows intentionally prove:

```text
loading
empty
filtered empty
populated
denied
validation error
server/network error
stale/conflict where applicable
success
partial success where applicable
```

### Playground reset acceptance

Run the accepted reset/recovery path and prove:

- schema 32 or exact current accepted successor;
- known baseline;
- generation increment;
- old session invalidation;
- clean transient state;
- critical routes recover;
- no Production binding/data crossover.

### Final freeze

Record:

```text
branch
commit
Git tree
lockfile hash
frontend artifact manifest/hash
Worker/deployment identity
schema/migration
Playground baseline/reset generation
route matrix
accessibility result
performance before/after
D1 before/after evidence
security/privacy result
known nonblocking residuals
```

Deploy only to isolated Playground under current authorization.

Final state:

```text
READY_FOR_EARL_MOBILE_FIRST_ANNOTATION
```

Then STOP.

---

# 22. Verification strategy — proportional and non-repetitive

## 22.1 Every source-changing branch

Run the smallest relevant set:

- affected unit/contract tests;
- affected browser flow;
- affected build/lint;
- fixture-boundary check when data path changed;
- complete diff review;
- `git diff --check` or repository equivalent.

## 22.2 Major design checkpoints

Run:

- five-width structural matrix;
- affected themes;
- keyboard/focus;
- representative real-data state;
- performance comparison if payload/render behavior changed.

## 22.3 Candidate freeze

Run the full required release-candidate/Playground acceptance gate once.

Do not run the entire suite after a documentation-only edit that cannot affect it.

Do not reuse a performance result after source/build/config/data changes invalidate it.

---

# 23. Performance evidence format

Every material performance slice records:

```text
SLICE:
BASE SHA:
ENDING SHA:

BOTTLENECK:
FACTUAL BEFORE EVIDENCE:
CHANGE:
FACTUAL AFTER EVIDENCE:
DELTA:

BUILD:
  initial HTML
  initial encoded transfer
  JS/CSS chunks
  largest route chunk
  request count

WEB:
  route-ready profile
  LCP when meaningful
  INP or lab interaction proxy
  CLS
  long tasks

API:
  route
  p50/p95 where measurable
  response bytes
  request count

D1:
  query ID
  query count
  rows_read
  rows_written
  sql_duration_ms
  plan/index

CACHE:
  expected policy
  observed policy/hit behavior

TESTS:
REGRESSIONS:
UNRUN:
ROLLBACK:
DO_NOT_REPEAT:
```

Do not use “feels faster” as the only evidence.

---

# 24. Code quality gates

Prefer lightweight deterministic checks.

Warn/fail on:

- newly created multi-responsibility frontend mega-files;
- raw `fetch` outside the governed transport layer without explicit exemption;
- raw SQL in frontend or scattered HTTP entry code;
- production fixture/mock imports;
- cross-feature private-internal imports;
- circular feature dependencies;
- active shareable/demo references after retirement;
- unexplained route chunk regressions;
- duplicate bootstrap/version calls;
- new unbounded growing list endpoints.

Line-count thresholds are alarms, not correctness laws.

Split by responsibility, not by arbitrary number.

---

# 25. Stop conditions

Stop and report the exact gap only for:

- accepted authority conflict;
- wrong branch / unexpected divergence;
- unknown dirty or unpreserved work;
- conflicting writer;
- secret/private-data exposure;
- Playground/Production binding ambiguity;
- Production mutation required to continue;
- required schema migration outside accepted scope;
- unsupported business truth required for completion;
- destructive cleanup without replacement/rollback proof;
- security/privacy ambiguity;
- two failed bounded strategies with no evidence-supported next route;
- unresolved P0/P1 at final acceptance;
- inability to verify a consequential change.

Do **not** stop for ordinary design decisions such as:

- spacing;
- radius;
- icon placement;
- local component composition;
- responsive arrangement;
- minor copy;
- one within-scope test failure whose cause can be repaired safely.

Use professional judgment and keep moving.

---

# 26. Final acceptance criteria

## Product

- [ ] Existing real product transformed, not replaced by a detached prototype.
- [ ] Mobile is primary and excellent.
- [ ] Desktop is intentionally denser/more contextual.
- [ ] HAU-USC identity remains unmistakable and restrained.
- [ ] No generic AI/SaaS visual drift.
- [ ] Supported routes use real Playground backend state.
- [ ] No fixture-backed normal-runtime success.

## Access/product semantics

- [ ] Public Lending remains public/no-login as currently authorized.
- [ ] External Request Center remains authenticated requester context.
- [ ] Internal Hub remains capability-gated.
- [ ] Staff sign-in remains a generic identity gateway.

## Design

- [ ] Semantic type ramp exists and ad-hoc type debt is materially reduced.
- [ ] Six theme families remain coherent.
- [ ] Light/Dark/System behavior remains correct.
- [ ] Solid operational surfaces dominate.
- [ ] Glass remains restrained/functional.
- [ ] Tables/queues remain decision-quality.

## Accessibility

- [ ] WCAG 2.2 AA target for primary workflows.
- [ ] 320 reflow.
- [ ] 200% zoom.
- [ ] keyboard.
- [ ] visible focus.
- [ ] focus not obscured.
- [ ] target-size gate.
- [ ] reduced motion.
- [ ] contrast/theme matrix.

## Performance

- [ ] P23 gains preserved unless a measured accepted tradeoff supersedes them.
- [ ] Initial transfer has no unexplained >15% same-profile regression.
- [ ] No hidden-route hero/media initial download regression.
- [ ] No duplicate version/bootstrap regression.
- [ ] Route code/data loading remains selective.
- [ ] Dynamic chunk deployment has graceful stale-client recovery.
- [ ] Core Web Vitals remain LCP <=2.5s / INP <=200ms / CLS <=0.1 at p75 when field evidence exists.

## D1/API

- [ ] Confirmed admin N+1 resolved or explicitly measured as no longer applicable.
- [ ] Generic bootstrap overfetch reduced.
- [ ] Restocking redundant reads reduced.
- [ ] Hot list DTOs use purpose-limited data where practical.
- [ ] Growing histories are bounded.
- [ ] No speculative index migration.
- [ ] Every retained index change has before/after proof.

## Build/repository

- [ ] Canonical app build is a normal cacheable web build.
- [ ] Shareable/demo active architecture retired when dependency proof passes.
- [ ] Dead dependencies/scripts removed only after import/reference proof.
- [ ] Unknown work preserved.
- [ ] Documentation has one clear current authority chain.
- [ ] Cleanup manifest records removals/consolidations.

## Security/privacy

- [ ] Server authorization preserved.
- [ ] CSRF/session behavior preserved.
- [ ] Private API data not shared-cached.
- [ ] Protected R2 evidence remains private.
- [ ] Logs contain no credentials/codes/tokens/private evidence.
- [ ] Security headers/CSP verified without permissive shortcuts.

## Environment

- [ ] `main` unchanged by this program.
- [ ] Production deployment/mutation = 0.
- [ ] exact Playground candidate identity recorded.
- [ ] reset state known and proven.
- [ ] P0 = 0.
- [ ] P1 = 0.

---

# 27. Required compact handoff after each branch

```text
PHASE:
BRANCH:
BASE_PLAYGROUND_SHA:
ENDING_SHA:
TREE:
OBJECTIVE:
COMPLETED:
FILES_CHANGED:
FACTS_INVALIDATED:
TESTS_AND_RESULTS:
BROWSER_EVIDENCE:
PERFORMANCE_EFFECT:
D1_EFFECT:
ACCESSIBILITY_EFFECT:
PLAYGROUND_DEPLOYMENT:
EXTERNAL_WRITES:
KNOWN_RESIDUALS:
NEXT_BRANCH:
DO_NOT_REPEAT:
```

Update only the canonical repository continuity chain.

Do not create a second project-status system.

---

# 28. Final owner-facing report

At completion return a concise decision-ready report:

```text
PROGRAM:
MFR-002 Unified Mobile-First Fullstack / Performance Transformation

STATUS:
PASS / BLOCKED

STARTING BASELINE:
Playground branch / SHA / tree / deployed runtime / baseline / schema

ENDING CANDIDATE:
branch / SHA / tree / artifact / Playground runtime

WHAT CHANGED:
mobile
shell/navigation
design system
typography
route UX
frontend data flow
build
D1/API
Worker modularity
assets/cache
repository/docs

PERFORMANCE:
P23 baseline vs final
Core Web Vitals/lab evidence
API/D1 improvements

REMOVED / CONSOLIDATED:
paths/scripts/dependencies/docs + reason

VERIFICATION:
exact commands/results
widths/themes/accessibility
reset/data isolation
security/privacy

KNOWN NON-BLOCKING RESIDUALS:

PRODUCTION:
NOT TOUCHED

NEXT OWNER DECISION:
annotate the exact Playground candidate;
Production remains a separate later authorization.
```

Do not make Earl read an implementation transcript to know whether the program succeeded.

---

# 29. Current external engineering references

These are supporting technique references. Repository contracts remain the product authority.

## OpenAI / Codex

- How OpenAI uses Codex: https://openai.com/business/guides-and-resources/how-openai-uses-codex/
- Codex long-running work: https://openai.com/index/codex-maxxing-long-running-work/
- Running Codex safely: https://openai.com/index/running-codex-safely/

Key adopted lesson: keep one controlling objective, but perform implementation through small, verifiable, repository-grounded work units with durable environment/context rather than one undifferentiated mega-edit.

## Vite

- Build guide: https://vite.dev/guide/build
- Build options: https://vite.dev/config/build-options
- Troubleshooting/dynamic imports: https://vite.dev/guide/troubleshooting

Key adopted lessons:

- CSS splitting is a normal default;
- dynamic chunks need stale-deployment recovery;
- `vite:preloadError` provides a bounded recovery hook;
- HTML should revalidate so stale chunk references do not persist.

## Cloudflare Workers / Static Assets / Cache

- Workers Static Assets: https://developers.cloudflare.com/workers/static-assets/
- Static asset headers: https://developers.cloudflare.com/workers/static-assets/headers/
- Workers best practices: https://developers.cloudflare.com/workers/best-practices/workers-best-practices/
- Cache: https://developers.cloudflare.com/cache/get-started/

Key adopted lessons:

- use Static Assets for the SPA assets;
- fingerprinted assets can use immutable browser caching;
- dynamic Worker responses set their own headers;
- use bindings in hot paths;
- do not store request state in module globals;
- await work or intentionally use `waitUntil` for non-response-critical tasks.

## Cloudflare D1

- Index best practices: https://developers.cloudflare.com/d1/best-practices/use-indexes/
- D1 database Worker API / batch: https://developers.cloudflare.com/d1/worker-api/d1-database/
- D1 FAQ/performance: https://developers.cloudflare.com/d1/reference/faq/
- D1 observability/metrics: https://developers.cloudflare.com/d1/observability/metrics-analytics/

Key adopted lesson: optimize high-frequency/high-rows-read queries from measured evidence; indexes are not free and leading-wildcard search requires a different strategy than a normal B-tree.

## Web performance

- Web Vitals: https://web.dev/articles/vitals

Current good thresholds:

```text
LCP <= 2.5s
INP <= 200ms
CLS <= 0.1
measured at the 75th percentile and segmented by mobile/desktop
```

## Accessibility

- WCAG 2.2: https://www.w3.org/TR/WCAG22/
- Target Size (Minimum): https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html
- Focus Not Obscured: https://www.w3.org/WAI/WCAG22/Understanding/focus-not-obscured-minimum.html
- Reflow: https://www.w3.org/WAI/WCAG22/Understanding/reflow.html

## Responsive CSS

- Container Queries: https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Containment/Container_queries
- Cascade Layers: https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/At-rules/@layer
- View Transition API: https://developer.mozilla.org/en-US/docs/Web/API/View_Transition_API

---

# 30. Historical/source mapping and supersession rule

After MFR-002 is formally accepted in the repository:

```text
HAU-USC-PERF-001
  -> historical detailed performance input

PLAYGROUND-MOBILE-FIRST-IMPECCABLE-V1
  -> historical detailed UI/UX input

MFR-001-SOL-ULTRA-ONE-SHOT
  -> historical fullstack/anti-hallucination input

MFR-002
  -> single current unified planning/execution reference
```

Do not keep all four as competing current “master” instructions.

Preserve the older files in history/archive if useful, but point future prompts and current repository continuity to MFR-002 once it is adopted.

---

# 31. First actions for Sol Ultra after adoption

```text
1. Open/fetch the HAU-USC Logistics repository.
2. Check current main and Playground heads.
3. Read the minimum authority chain.
4. Reverify the P34/current final-candidate identity and active writer.
5. Create work/playground-mfr002-adopt from current Playground.
6. Register the byte-faithful/repository-normalized MFR-002 spec.
7. Update CURRENT / CURRENT_TASK / CURRENT_HANDOFF.
8. Run focused governance checks.
9. Integrate U00.
10. Immediately begin U01.
```

Do **not** spend the first work block rewriting this into another plan.

---

# 32. Final operating principle

```text
REAL REPOSITORY
+ REAL PLAYGROUND
+ REAL DATA
+ MOBILE-FIRST DESIGN
+ MEASURED PERFORMANCE
+ BOUNDED CHANGES
+ DETERMINISTIC VERIFICATION
+ ONE WRITER
+ NO PRODUCTION MUTATION
+ STOP WHEN GREEN
```

The finished HAU-USC Logistics Playground should feel like a mature institutional operations product: **fast enough to disappear, flexible enough to work anywhere, beautiful without decoration-for-decoration's-sake, fluid without theatrics, and impeccable in the small details that make staff trust it.**
