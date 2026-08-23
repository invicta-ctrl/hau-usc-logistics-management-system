# R3-A1-A2 — Owner routing model, identity flows, Figma documentation mirror, Make prototype and frontend continuation

STATUS: ACCEPTED
OWNER: Earl
DATE: 2026-08-23
SLUG: r3-a1-a2-owner-routing-identity-three-context
PARENT: R3-A1 (`.codex/specs/accepted/2026-08-23-r3-a1-figma-make-design-sync-codex-preview-handoff.md`)
GRANDPARENT: R3 (owner-held)
SOURCE: `HAU_USC_Logistics_R3_A1_A2_Routing_Identity_Figma_Documentation_Make_Continuation_2026-08-23.md` (owner-held)
BRANCH: frontend-design-integration
PRIMARY_EXECUTOR: Claude Code
RISK: HIGH — product-architecture correction, live design-provider writes, frontend implementation

FIGMA_DESIGN_WRITE: AUTHORIZED_BY_R3_A1_A2 — `hXJElH4p72KfgAaoUyfNOC` only
FIGMA_MAKE_WRITE: AUTHORIZED_BY_R3_A1_A2 — `rP9W9MQlZkyQrUx38TVsFS` only
FRONTEND_IMPLEMENTATION_WRITE: AUTHORIZED_BY_R3_A1_A2 — `src/frontend/` and frontend-owned tests on this branch only
OTHER_PROVIDER_WRITE: FORBIDDEN
PLAYGROUND_WRITE: FORBIDDEN
PRODUCTION_WRITE: FORBIDDEN
MAIN_WRITE: FORBIDDEN
BACKEND_SEMANTIC_CHANGE: FORBIDDEN
MIGRATION: FORBIDDEN
DEPLOYMENT: FORBIDDEN

## Intent

Primary `SOFTWARE_FEATURE`. Secondary `ARCHITECTURE`, `DOCUMENT_OR_ARTIFACT`,
`FIGMA_RECONCILIATION`, `FIGMA_MAKE_RECONCILIATION`, `AUTHENTICATION_UX`,
`ROUTING`, `FRONTEND_DOCUMENTATION`, `CODEX_HANDOFF`.

## Why this amendment exists

R3 correctly repaired routing against the **then-current** authority. That
authority treated the logistics Request Center as a public / no-login portal.
The owner has now corrected the product policy: it is not public.

This is an owner correction to product architecture, not a regression, and not
a reversal of R3's engineering. R3's repair was faithful to the authority it
had; that authority was wrong about the product.

## What is superseded

Superseded as **current** authority (preserved as historical record):

```text
"the logistics Request Center is public / no-login"
"Public Request Center — Authentication: none, ever"
"PUBLIC REQUEST · NO SIGN-IN"
"No account required" (for logistics requests)
DESIGN.md current-authority statements that the Request Center is public
docs/frontend/WORKFLOW_ARCHITECTURE.md §1 two-context model
```

`DESIGN.md` D24.0 — OWNER-LOCKED no-login **Public Lending** — is **not**
superseded. It remains current and correct. The R3-A1 correction of record
(D24.0 was mis-cited as Request authority) stands and is now moot for Request,
because Request is no longer public at all.

Historical receipts, including `.codex/R3_PUBLIC_STAFF_BOUNDARY_RECEIPT.md` and
`.codex/R3_A1_FIGMA_MAKE_DESIGN_SYNC_RECEIPT.md`, remain true of their own tasks
and are annotated `SUPERSEDED BY R3-A1-A2 — 2026-08-23` where they could be
mistaken for current truth. They are not rewritten.

## Owner-locked product model — three distinct contexts

```text
A. PUBLIC
   Public Lending Hub
   no staff sign-in

B. AUTHENTICATED REQUESTER
   External Request Center
   USC staff/officer sign-in required
   no Main Logistics Hub authority implied

C. AUTHENTICATED DOL OPERATIONS
   Main Logistics Hub (Internal Request Hub, Internal Lending Hub, and the rest)
   DOL/internal capability gated
```

These must not be collapsed.

### A. Public Lending Hub — public by design

Audience: students, USC staff/officers, DOL staff, and any other user allowed by
accepted lending policy. Items: pens, pencils, calculators, sewing kits, cutters,
brooms, small tools, reusable supplies, borrowable equipment, and other currently
published lending items.

No staff sign-in is required to browse or to begin the public lending workflow.
The experience stays borrower-safe.

### B. External Request Center — authenticated USC requester

Not public. For authenticated USC staff/officers with legitimate USC operational
needs: inventory restocking, office inventory, pantry restocking, food
requirements, event-specific materials, event food, event logistics, venue
requirements, venue support, logistical materials, activity support, and other
approved USC operational needs.

Ordinary students must not reach it merely because they can reach Public Lending.
Authentication verifies the requester is an eligible USC staff/officer.

### C. Internal Request Hub / Internal Lending Hub — DOL operations

Authorized DOL/internal logistics staff. Receives and processes the canonical
records created through the external contexts.

```text
EXTERNAL REQUEST CENTER   ->  CANONICAL REQUEST  ->  INTERNAL REQUEST HUB
PUBLIC LENDING HUB        ->  CANONICAL LENDING  ->  INTERNAL LENDING HUB
```

One canonical record plus role-appropriate projections. Never separate
external/internal record types. The public borrower never receives DOL
operational controls.

## Entry-intent routing — owner approved

```text
AUTHENTICATION = who is this user?
AUTHORIZATION  = what may this account access?
ENTRY INTENT   = what did the user explicitly try to open?

1. Preserve explicit valid entry intent.
2. Check server-derived authorization.
3. Use capability-based default routing only when there was no explicit destination.
```

| Entry point | User after sign-in | Destination |
|---|---|---|
| External Request Center | Non-DOL USC staff/officer | External Request Center |
| External Request Center | DOL staff | External Request Center, with **Open Logistics Hub** shortcut |
| Staff Sign In (global navbar) | Non-DOL USC staff/officer | External Request Center |
| Staff Sign In (global navbar) | DOL/internal staff | Main Logistics Hub, capability-appropriate home |
| Direct protected internal Request Hub | DOL with Request capability | Internal Request Hub |
| Direct protected internal Request Hub | Non-DOL | Denied / redirected safely |
| Public Lending Hub | eligible student/staff | Public Lending Hub, no auth gate |

Entry intent is a **first-class concept**, not inferred from a capability string:

```text
GENERIC_STAFF_SIGN_IN
EXTERNAL_REQUEST_CENTER
INTERNAL_REQUEST_HUB
OTHER_INTERNAL_DESTINATION
```

The DOL "Open Logistics Hub" shortcut routes to `resolveStaffHome(session)`, not
blindly to Overview, because the account may lack Overview capability.

## DOL staff as requesters

DOL staff may request items/services for themselves, either through the External
Request Center intentionally or through internal self-service entry.

Both paths create the same canonical record type:

```text
REQUESTED_BY   = their account
REQUEST_SOURCE = INTERNAL_SELF_SERVICE   (when created internally)
APPROVED_BY    = their account           (when policy permits self-approval)
```

Audit history must show both facts. Never hide self-approval. Never convert
self-service into an administrator-only synthetic transaction. Preserve room for
a future second-approver rule on higher-risk or restricted categories rather than
hard-coding unrestricted global self-approval.

## Home semantics

```text
NAV_HOME, LENDING_HOME, AUTH_BACK_HOME, EXTERNAL_REQUEST_HOME
    -> landing
    -> scroll to top
    -> close transient drawer/modal
    -> preserve authenticated session
```

**Home is not logout.** Sign Out is the only normal action that destroys the
session. Home clears only transient navigation intent that should not persist.

## Copy corrections

`"Public front door"` is not current product copy. Current active UI uses `Home`,
`← Home`, `Back to Home`, or `Return Home` — whichever is most natural for the
surface. Historical evidence frames are marked historical rather than rewritten.

Public Lending Hub navigation is:

```text
Home · Lending Center / Browse equipment · Track lending · Lending policy · Staff Sign In
```

`Request Center` is removed from the Public Lending Hub tab set. The
"No account and no sign-in needed" banner may remain **for Public Lending only**
and must no longer visually or semantically govern the External Request Center.

Staff sign-in page copy becomes equivalent to:

```text
Staff sign in

Sign in with your USC account to submit logistics requests
or access the workspaces authorized for your account.
```

## Identity flows

### Account activation — not open sign-up

The affordance is `No password yet? Activate account`. It activates an
**existing eligible staff identity**; it does not create one, and the frontend
never creates DOL/internal capabilities.

```text
Activate account
  -> enter registered staff identifier/email
  -> server verifies eligible existing staff identity
  -> send 8-digit verification code to registered email
  -> enter code -> create password -> confirm password
  -> activation complete -> Staff Sign In
```

`Activate an existing staff account` and `Apply for staff access` are **different
operations**. Both exist in this product and both are explicit and separately
labelled.

### Forgot password

```text
Forgot password
  -> enter account identifier / registered email
  -> generic confirmation response
  -> send 8-digit verification code to registered email
  -> verify code -> new password -> confirm -> updated -> Staff Sign In
```

Security requirements: 8-digit code, one-time use, short expiry, rate limited,
attempt limited, invalidated after success, no email/account enumeration,
server-side verification. Copy is generic:
`If this account exists, a verification code has been sent to its registered email.`

### OTP / verification-code UI

Reuse the existing project OTP component where suitable. Required states:
code-entry, invalid code, expired code, resend cooldown, resending, verified,
server error, too many attempts. Keyboard-friendly, paste-friendly, accessible
label, no colour-only error, focus first invalid field, announce validation state.

## Backend contract rule — no fake security

The External Request Center may only be described as protected where a real
server-derived boundary exists. Where it does not, the gap is recorded, not
papered over. No Production/Playground/D1/R2 mutation in this task. Backend
source changes require a separate narrowly-scoped accepted backend amendment.

Findings are recorded in this amendment's companion receipt
`.codex/R3_A1_A2_ROUTING_IDENTITY_RECEIPT.md` and in
`docs/frontend/ROUTING.md`.

## Figma requirements

The owner explicitly requires the current documentation content to be **present
inside** the Figma Design file, not merely linked. A one-line link is not a
documentation mirror.

- Preserve node `35:145` as historical evidence; add a visible CURRENT AUTHORITY
  pointer on or adjacent to it.
- Create/update a dedicated current documentation page or section in the same
  file, carrying the normative content of `DESIGN.md`,
  `docs/frontend/WORKFLOW_ARCHITECTURE.md`, `docs/frontend/ROUTING.md`, this
  amendment summary, the Codex handoff, and the Figma/Make source register
  summary — each with repository path, commit identity and content hash.
- Update current-authority visual references for the surfaces named in the owner
  document, labelled `DESIGN AUTHORITY` / `READY FOR FI-04 IMPLEMENTATION` where
  they are not runnable. FI-04+ internal workflows are never marked
  "functionally verified" while they remain unrunnable.
- Update the actual Make source and prototype in `rP9W9MQlZkyQrUx38TVsFS`. Do
  not create a second Make file.

No claim without provider readback.

## Documentation to reconcile

```text
DESIGN.md
docs/frontend/WORKFLOW_ARCHITECTURE.md
docs/frontend/ROUTING.md            (new canonical control contract)
.codex/CURRENT.md · CURRENT_TASK.md · CURRENT_HANDOFF.md
R3 / R3-A1 receipts (annotate, do not rewrite)
docs/design/FIGMA_BASELINE_REGISTER.md
docs/design/FIGMA_MAKE_SOURCE_REGISTER.md
docs/design/DESIGN_EXECUTION_TRACKER.md
docs/design/HALLMARK_IMPECCABLE_CLOSURE.md
docs/frontend/R3_A1_DOCUMENTATION_RECONCILIATION_MANIFEST.md
```

Required synchronized state, within each artifact's own responsibility:

```text
WORKFLOW_ARCHITECTURE.md = ROUTING.md = DESIGN.md
  = FIGMA DOCUMENTATION = FIGMA VISUAL REFERENCES
  = FIGMA MAKE PROTOTYPE = FRONTEND IMPLEMENTATION / HANDOFF
```

## Traceability change IDs

```text
R3A1A2-REQUEST-AUTH-GATE
R3A1A2-LENDING-REQUEST-SEPARATION
R3A1A2-HOME-ROUTING
R3A1A2-PUBLIC-FRONT-DOOR-RENAME
R3A1A2-GENERIC-STAFF-SIGNIN
R3A1A2-ACCOUNT-ACTIVATION
R3A1A2-PASSWORD-RESET
R3A1A2-OTP-8-DIGIT
R3A1A2-DOL-REQUESTER-MODE
R3A1A2-INTERNAL-SELF-SERVICE
R3A1A2-FIGMA-DOC-MIRROR
```

## Ownership

R3-A1 left `ACTIVE_WRITER: NONE`, `WRITER_LOCK: RELEASED`,
`REQUIRED_MODEL: ANY_ACCEPTED_WRITER`. The owner's R3-A1-A2 instruction directs
this Claude Code session to apply the corrections to the current frontend
implementation as well as the design authorities, rather than deferring them to
Codex rediscovery. Claude Code therefore takes the writer lock for R3-A1-A2 and
is the canonical frontend writer for this amendment. Ownership is not split.

## Scope fence

Forbidden unless separately authorized: Production deployment, Playground
deployment, `main` merge, Cloudflare provider mutation, D1 mutation, R2 mutation,
production data mutation, schema migration, secret rotation, branch cleanup,
unrelated backend redesign. Local frontend preview is allowed. Figma Design and
Figma Make writes are explicitly authorized.

## Completion gate

See `.codex/R3_A1_A2_ROUTING_IDENTITY_RECEIPT.md` for the measured gate. The task
must not claim end-to-end security completion while any
`BACKEND_CONTRACT_GAP_*` recorded there is open.

## Final owner rule

```text
PUBLIC LENDING IS PUBLIC.
EXTERNAL REQUEST CENTER IS FOR VERIFIED USC STAFF/OFFICERS.
INTERNAL REQUEST HUB AND INTERNAL LENDING HUB ARE FOR AUTHORIZED DOL STAFF.
DOL STAFF MAY ACT AS REQUESTERS WITHOUT LOSING THEIR OPERATIONAL IDENTITY.
EXPLICIT ENTRY INTENT MUST BE PRESERVED.
GENERIC STAFF LOGIN USES CAPABILITIES TO CHOOSE A DEFAULT HOME.
HOME IS HOME, NOT LOGOUT.
"PUBLIC FRONT DOOR" IS NOT CURRENT PRODUCT COPY.
STAFF WHO DO NOT YET HAVE A PASSWORD NEED ACCOUNT ACTIVATION.
STAFF WHO FORGOT A PASSWORD NEED A SECURE 8-DIGIT EMAIL VERIFICATION FLOW.
FIGMA DESIGN MUST CONTAIN THE CURRENT DOCUMENTATION ITSELF, NOT ONLY LINKS.
FIGMA MAKE MUST CONTAIN THE CURRENT PROTOTYPE/CODE.
WORKFLOW_ARCHITECTURE.md EXPLAINS THE BUSINESS FLOW.
ROUTING.md EXPLAINS EXACTLY WHAT EACH CONTROL DOES.
CODEX MUST BE ABLE TO READ THE BRANCH AND IMPLEMENT BUTTONS WITHOUT GUESSING.
NO STALE PUBLIC-REQUEST AUTHORITY.
NO FRONTEND-ONLY FAKE SECURITY.
NO DESIGN/DOC/MAKE/REPO DRIFT.
NO CLAIM WITHOUT READBACK.
```
