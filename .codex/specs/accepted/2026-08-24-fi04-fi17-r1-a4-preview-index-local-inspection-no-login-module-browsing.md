# HAU-USC Logistics — FI-04 → FI-17 R1
## A4 Amendment — Preview Index Local Inspection Mode: Browse All Modules Without Staff Sign-In

**DATE:** 2026-08-24  
**OWNER:** Earl  
**TARGET:** the already-running FI-04 → FI-17 R1 one-shot program  
**LOCAL PREVIEW:** `http://127.0.0.1:4173/`  
**PURPOSE:** Make the Preview Index a true developer/operator inspection tool so Earl can open and browse protected modules locally without repeatedly authenticating, while preserving the real application authentication and authorization contracts everywhere else.

---

# 1. OWNER DIRECTIVE

When browsing modules from the **Preview Index** on:

```text
http://127.0.0.1:4173/
```

I should NOT be forced through Staff Sign In every time I open:

```text
Overview
Inventory
Internal Request Hub
Internal Lending Hub
Release Desk
Restocking
Procurement / Receiving
Events
Administration
Profile
External Request Center
```

The Preview Index exists so I can inspect and fix the frontend rapidly during FI-04→FI-17.

Required developer loop:

```text
Preview Index
→ choose module
→ open actual current frontend surface
→ inspect visually/functionally
→ return to Preview Index
→ choose another module
```

without:

```text
Preview Index
→ Staff Sign In
→ credentials
→ module
→ sign-in wall again
```

This is a **LOCAL PREVIEW INSPECTION FEATURE**, not a change to real authentication policy.

---

# 2. DO NOT WEAKEN REAL AUTHENTICATION

The real product rules remain unchanged:

```text
PUBLIC LENDING HUB
= public

EXTERNAL REQUEST CENTER
= authenticated eligible USC staff/officer

MAIN LOGISTICS HUB / INTERNAL MODULES
= authenticated + capability-gated
```

Normal application navigation must still enforce those rules.

The bypass applies ONLY when the route was explicitly opened through the trusted local Preview Index inspection path.

Never change server authorization to make preview browsing easier.

Never remove:

```text
requireAuth(...)
capability checks
/api auth middleware
request ownership checks
DOL authorization
CSRF
session checks
```

from the real application.

---

# 3. CURRENT ROOT CAUSE

The current Preview Index already has a registry of modules and an `Open` action.

However its `Open` handler currently does effectively:

```text
Preview Index
→ navigate(entry.route)
→ normal app controller
→ protected route detected
→ requireAuth(...)
→ Staff Sign In
```

That makes the Preview Index inconvenient for frontend inspection.

Current staff entries are also marked:

```text
access = AUTHENTICATED
previewMode = SURFACE_PREVIEW
```

and the Index already has a separate `Surface Preview` concept.

Do not solve this by changing those routes to `PUBLIC`.

Instead create a distinct preview-inspection execution path.

---

# 4. IMPLEMENT A FIRST-CLASS PREVIEW INSPECTION CONTEXT

Introduce one explicit concept, naming may vary:

```text
PreviewInspectionContext
```

with states equivalent to:

```text
OFF
LOCAL_INDEX_INSPECTION
```

Do NOT encode this as:

```text
fake authenticated user
fake real Session
fake DOL account
role = SYSTEM_OWNER
```

Preferred architecture:

```text
Preview Index
        |
        | openPreviewRoute(route)
        v
Preview Inspection Context
        |
        v
AppRouteRenderer / module preview adapter
        |
        v
Actual module UI
+ preview fixtures/read-only adapters
+ no real auth gate
+ no real mutation authority
```

Keep this context separate from:

```text
Session
AuthGateState
EntryIntent
server capabilities
```

so it cannot be mistaken for real authorization.

---

# 5. HARD ACTIVATION GATE

Preview auth bypass may activate only when ALL local conditions pass.

Minimum:

```text
window.location.hostname === "127.0.0.1"
window.location.port === "4173"
Vite/development preview context is true
Preview Index itself is allowed
route originated from Preview Index
```

A reasonable predicate is conceptually:

```text
LOCAL_PREVIEW_INSPECTION_ALLOWED =
  import.meta.env.DEV
  && window.location.hostname === "127.0.0.1"
  && window.location.port === "4173"
  && previewIndexAllowed
```

If this repo's build/runtime model needs a dedicated flag, use something equivalent to:

```text
VITE_HAU_PREVIEW_INSPECTION=1
```

and have the accepted 4173 preview launcher set it only for the local preview.

Do NOT enable this mode based on a query parameter alone.

Do NOT enable it merely because the URL hash says `#preview-index`.

---

# 6. PRODUCTION / PLAYGROUND SAFETY

Hard requirements:

```text
Production:
PREVIEW_AUTH_BYPASS = impossible

Playground deployed website:
PREVIEW_AUTH_BYPASS = disabled by default

Local 127.0.0.1:4173:
PREVIEW_AUTH_BYPASS = allowed through Preview Index
```

The existing Preview Index may still be available on a validated private Playground according to its current gate, but the **no-sign-in module inspection bypass** requested by this amendment is specifically local-loopback-only.

Test this explicitly.

---

# 7. PREVIEW INDEX BUTTON BEHAVIOR

For each registry row:

## PUBLIC route

Example:

```text
Landing
Public Lending
Track Lending
Staff Sign In
```

`Open` may continue using normal navigation.

## Protected route

Example:

```text
External Request Center
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
```

When running from the local Preview Index:

```text
Open
→ openPreviewRoute(entry.route)
→ render module without Staff Sign In
```

Do NOT call the normal `requireAuth` path for this inspection action.

---

# 8. KEEP A REAL-AUTH TEST PATH

Do not remove the ability to test the real auth behavior.

Keep or improve the existing:

```text
Test Real Login Flow
```

and preferably expose a secondary action for authenticated routes:

```text
Open Preview
Test Real Access
```

Semantics:

```text
Open Preview
= local inspection bypass

Test Real Access
= normal navigate(route)
= real auth/capability behavior
```

This gives Earl both workflows without constantly signing in during visual review.

---

# 9. VISIBLE PREVIEW BANNER

Whenever a protected module is rendered through local inspection mode, show a persistent but non-obstructive indicator such as:

```text
PREVIEW INSPECTION
Authentication bypassed locally for frontend review.
No backend authorization has been granted.
```

Requirements:

```text
clearly visible
not confused with Production UI
does not alter Figma parity materially
easy to dismiss visually only if state remains obvious
```

Do not hide the fact that the route is being previewed without real auth.

---

# 10. NO REAL PROTECTED DATA

Local inspection mode must NOT use the bypass to retrieve protected data as though the browser were authenticated.

For protected modules:

```text
use existing frontend fixtures
use preview adapters
use deterministic mock/read-only presentation data
or show truthful backend-unavailable states
```

Never:

```text
forge cookies
forge session tokens
inject admin headers
bypass Worker auth
read private Production D1 data
read private staff directory data
```

The bypass is for **rendering the frontend**, not bypassing the backend.

---

# 11. NO REAL MUTATIONS

While in:

```text
LOCAL_INDEX_INSPECTION
```

all actions that would mutate a real backend must be:

```text
disabled
preview-only
fixture-backed
or intercepted before network mutation
```

Examples:

```text
Approve
Reject
Release
Receive
Adjust stock
Create request
Borrow
Return
Save admin changes
Reset password
Send OTP
Delete
Archive
```

The UI may demonstrate intended interaction/state transitions with fixtures if the FI slice supports preview simulation.

It must never create real business records from inspection mode.

---

# 12. PREVIEW DATA ADAPTER

If modules increasingly require backend data during FI-04→FI-17, create a small explicit adapter boundary rather than scattering:

```text
if (preview) ...
```

through every component.

Preferred shape:

```text
Module
  |
  v
Frontend Data Adapter
  |
  +-- REAL
  |     → frontendBackend
  |
  +-- PREVIEW_INSPECTION
        → deterministic preview fixtures
```

Examples:

```text
getOverviewData()
getInventoryData()
getInternalRequestQueue()
getInternalLendingQueue()
getReleaseQueue()
getProcurementData()
```

This adapter must preserve the expected real API shapes so preview rendering helps integration rather than drifting into a fake second application.

---

# 13. ROUTE STATE SHOULD REMAIN DISTINCT

Do not redefine `AuthRoute` as public.

Do not remove access metadata from `registry.ts`.

Keep:

```text
access: AUTHENTICATED
```

for protected modules.

Add separate metadata if useful:

```text
localInspectionAllowed: true
```

or derive it from:

```text
previewMode
+ route type
+ local inspection gate
```

The Preview Index should truthfully say:

```text
Access: Authenticated
Preview: Local inspection available
```

instead of pretending:

```text
Access: Public
```

---

# 14. PREVIEW INDEX BACK / MODULE SWITCHING

Make browsing fast.

From a preview-opened protected module provide a predictable way to return:

```text
Preview Index
```

without passing through Home or Staff Sign In.

Desired loop:

```text
Inventory
→ Preview Index
→ Internal Request Hub
→ Preview Index
→ Lending Hub
→ Preview Index
```

Preserve:

```text
search text
filter
scroll position where practical
```

when returning to the Index.

---

# 15. DO NOT BREAK NORMAL HOME

Preview inspection controls must not change the application's normal Home semantics.

Normal:

```text
Home
→ landing
→ session preserved if a real session exists
```

Preview-specific:

```text
Back to Preview Index
→ Preview Index
```

These are separate actions.

---

# 16. ACTUAL MODULE SURFACES, NOT GENERIC PLACEHOLDERS

The Preview Index currently has a generic `Surface Preview` placeholder.

As FI slices become implemented:

```text
Open Preview
```

must render the **actual current integrated module UI**, not only a generic sample card.

For an FI slice not implemented yet:

```text
show current design/surface preview
clearly label NOT IMPLEMENTED / DESIGN PREVIEW
```

Once FI implementation exists:

```text
registry implementationStatus
preview behavior
module rendering
```

must be updated together.

No stale `SURFACE_PREVIEW` registry status for a fully implemented module.

---

# 17. EXTERNAL REQUEST CENTER SPECIAL CASE

The External Request Center is a real authenticated requester surface.

Normal route:

```text
Start logistics request
→ Staff Sign In
→ External Request Center
```

That remains mandatory.

But from local Preview Index:

```text
External Request Center
→ Open Preview
→ render requester UI with preview requester fixtures
```

No real authenticated requester is created.

No `/api/portal/request` protected mutation should be performed from preview inspection.

`Test Real Access` must still exercise the normal authentication path.

---

# 18. INTERNAL DOL MODULE SPECIAL CASE

For:

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
```

local Preview Index should render the UI under a **preview DOL presentation context**, not a real DOL security context.

If UI needs display identity, use explicit preview-only values such as:

```text
Preview Operator
DOL Preview
```

Do not call it:

```text
SYSTEM_OWNER
Authenticated User
Verified DOL
```

unless it actually represents a real authenticated session.

---

# 19. SHARED COMPONENT SAFETY

If internal shell components currently require a `Session`, prefer refactoring presentation needs from auth truth.

Example:

```text
BAD:
AuthenticatedShell requires real Session solely to display avatar/name

BETTER:
AuthenticatedShell receives presentation identity separately
real runtime derives it from Session
preview derives it from PreviewIdentity
```

Do not force a fake security object into every module merely because a presentational component was tightly coupled.

Separate:

```text
AUTHORIZATION STATE
from
PRESENTATION CONTEXT
```

without changing server security.

---

# 20. NETWORK INTERCEPTION SAFETY

If inspection-mode modules accidentally call protected APIs, fail closed.

In Preview Inspection mode:

```text
protected mutation
→ block locally
→ log preview warning

unexpected protected read
→ use preview adapter
or
→ show explicit preview-data gap
```

Do not silently let protected requests hit a live backend and rely on 401/403 as the normal preview experience.

---

# 21. TEST / DEBUG MARKERS

Expose enough state for deterministic tests:

```text
data-preview-inspection="true"
data-preview-route="<route>"
```

or equivalent.

Do not expose secret material.

---

# 22. REQUIRED TESTS

Add focused coverage:

```text
INDEX-INSPECT-01
127.0.0.1:4173
→ Preview Index
→ Inventory
→ Open Preview
→ Inventory renders
→ Staff Sign In does NOT render

INDEX-INSPECT-02
repeat for Overview / Internal Request Hub / Internal Lending Hub /
Release / Procurement / Administration / Profile

INDEX-INSPECT-03
Preview Index
→ External Request Center
→ Open Preview
→ requester surface renders with PREVIEW INSPECTION indicator
→ no real auth session required

INDEX-REAL-AUTH-01
Preview Index
→ protected route
→ Test Real Access
→ Staff Sign In

INDEX-PROD-01
production-mode build
→ local preview auth bypass unavailable

INDEX-PLAYGROUND-01
deployed Playground
→ local auth bypass unavailable by default

INDEX-NET-01
preview inspection
→ no protected mutation leaves browser

INDEX-BACK-01
preview module
→ Preview Index
→ browsing state preserved where practical
```

---

# 23. VERIFY REAL PRODUCT AUTH DID NOT REGRESS

Existing auth behavior must remain:

```text
Start logistics request signed out
→ Staff Sign In

Direct internal route signed out
→ Staff Sign In

Unauthorized real account
→ denied

Public Lending
→ no staff sign-in
```

Preview Index bypass must not alter these.

---

# 24. `4173` ACCEPTANCE

At:

```text
http://127.0.0.1:4173/
```

Earl must be able to:

```text
open Preview Index
open protected module preview
inspect it
return to Preview Index
open another protected module
```

without credentials.

Expected:

```text
PREVIEW_INDEX_BROWSE_WITHOUT_LOGIN = PASS
REAL_AUTH_POLICY_UNCHANGED = PASS
PROTECTED_BACKEND_BYPASS = 0
PROTECTED_BACKEND_MUTATIONS = 0
PRODUCTION_BYPASS = 0
PLAYGROUND_BYPASS = 0
```

---

# 25. CONTINUITY

Record this as a **preview-only FI development convenience**.

Recommended durable wording:

```text
PREVIEW_INDEX_LOCAL_INSPECTION:
Enabled only on trusted 127.0.0.1:4173 development preview.
Bypasses frontend auth routing solely to render preview/fixture-backed module UI.
Does not create a session, grant capabilities, bypass Worker authorization,
or authorize backend reads/writes.
```

No future agent may reinterpret this as:

```text
internal routes no longer require authentication
```

---

# 26. IMPLEMENTATION ORDER

Do this before advancing far into additional FI slices because it improves every later visual review:

```text
1. Preserve current FI work / writer state.
2. Inspect Preview Index integration.
3. Add local preview inspection gate.
4. Add preview-route context/state.
5. Keep it separate from Session/AuthGateState.
6. Route protected Preview Index "Open Preview" through it.
7. Add preview adapter/fixtures where required.
8. Add Preview Inspection banner.
9. Add Back to Preview Index.
10. Keep Test Real Access.
11. Add focused tests.
12. Start/reload 4173.
13. Exercise multiple protected modules manually.
14. Verify normal real auth still works.
15. Continue the owning FI slice.
```

---

# 27. SHORT DIRECTIVE

```text
THE PREVIEW INDEX IS A DEVELOPMENT INSPECTION TOOL.

WHEN I AM ON:

http://127.0.0.1:4173/

I SHOULD BE ABLE TO USE THE INDEX TO BROWSE EVERY MODULE
WITHOUT SIGNING IN REPEATEDLY.

DO NOT MAKE THE MODULES PUBLIC.

DO NOT FAKE A REAL AUTHENTICATED SESSION.

DO NOT BYPASS THE CLOUDFLARE BACKEND.

ADD A LOCAL-ONLY PREVIEW INSPECTION CONTEXT.

OPEN PREVIEW
= render actual module UI with preview/fixture data

TEST REAL ACCESS
= use normal real auth flow

KEEP BOTH.

MAKE IT FAST FOR ME TO:
INDEX → MODULE → INDEX → MODULE

SO I CAN FIX FI-04→FI-17 VISUALLY BEFORE PUSHING THROUGH THE NEXT SLICES.
```
