# HAU-USC Logistics — FI-04 → FI-17 R1
## A3 Amendment — Persistent Local Live Preview at `http://127.0.0.1:4173/` + Pre-Slice Visual Fix Gate

**DATE:** 2026-08-24  
**OWNER:** Earl  
**TARGET:** the already-running FI-04 → FI-17 R1 one-shot program  
**MODE:** CONTINUE CURRENT SESSION — DO NOT RESTART  
**PRIMARY CHANGE:** Start and keep the real local frontend live preview healthy at `http://127.0.0.1:4173/` so defects can be seen and repaired before the program advances through integration slices.  
**PRODUCTION:** FORBIDDEN  
**MAIN:** NO NEW AUTHORITY  
**PLAYGROUND DATA WRITES:** FORBIDDEN UNLESS A LATER ACCEPTED FI SLICE EXPLICITLY AUTHORIZES THEM

This amendment supplements the existing FI-04→FI-17 R1 program and the R3-A1-A2 / Ox Alpha reconciliation amendments.

It does **not** replace the one-shot plan.

It changes the development loop so the local preview becomes a first-class acceptance surface throughout frontend integration.

---

# 1. OWNER DIRECTIVE

Start the current HAU-USC frontend implementation locally at:

```text
http://127.0.0.1:4173/
```

and KEEP IT AVAILABLE while FI-04→FI-17 work proceeds.

The purpose is:

```text
IMPLEMENT A SMALL FI UNIT
→ HMR / RELOAD LOCAL PREVIEW
→ INSPECT THE REAL WEBSITE
→ FIX VISIBLE / FUNCTIONAL DEFECTS
→ VERIFY
→ ONLY THEN ADVANCE TO THE NEXT FI UNIT
```

Do not race through FI slices while the local website is broken.

Do not wait until Playground to discover obvious frontend integration defects.

Do not substitute screenshots of source code or isolated component renders for the working local website when a real runnable route exists.

---

# 2. THIS IS THE CANONICAL LOCAL PREVIEW URL

For the running FI program:

```text
LOCAL_FRONTEND_PREVIEW_URL = http://127.0.0.1:4173/
LOCAL_FRONTEND_PREVIEW_HOST = 127.0.0.1
LOCAL_FRONTEND_PREVIEW_PORT = 4173
```

Do not move the owner-facing preview to:

```text
4174
5199
3000
5173
```

merely because another test/dev command uses those ports.

Other temporary test servers may exist, but Earl's persistent visual inspection surface is:

```text
4173
```

---

# 3. USE THE EXISTING ACCEPTED PREVIEW-RESILIENCE WORK

The repository already contains accepted FVR-02-A2 local-preview resilience work for port `4173`.

Use the existing owned-process supervisor rather than inventing another preview daemon.

Relevant current scripts include:

```text
npm run preview:frontend:start
npm run preview:frontend:status
npm run preview:frontend:restart
npm run preview:frontend:stop
```

Backed by:

```text
scripts/start-frontend-playground-preview.mjs
scripts/frontend-preview-supervisor.mjs
```

The accepted supervisor already provides:

```text
127.0.0.1:4173 binding
strict port ownership
owned-process proof
HTTP health probing
bounded auto-restart
HMR workflow
restart-loop protection
safe stop/restart
unknown-port-owner protection
runtime-only state
```

Do not replace this with a fragile one-off shell process if the accepted supervisor can be started safely.

---

# 4. FIRST ACTION — START OR RECOVER `4173`

Before beginning the next FI implementation slice:

```text
1. Resolve live repo/worktree/HEAD/writer state.
2. Check port 4173.
3. Run the repository preview status command.
4. Determine whether:
   A. the accepted owned preview is already healthy;
   B. the port is free;
   C. the port is occupied by an unknown process;
   D. stale runtime state exists.
5. Start/recover the accepted preview safely.
6. Verify HTTP root.
7. Open the preview in the real browser.
8. Only then continue FI implementation.
```

Expected success:

```text
PREVIEW_STATE = RUNNING
PREVIEW_HEALTHY = true
HTTP_GET_4173_ROOT = 2xx HTML
OWNER_URL = http://127.0.0.1:4173/
```

---

# 5. PORT OWNERSHIP SAFETY

If `4173` is occupied:

```text
DO NOT force-kill by port number.
```

Verify ownership through the existing supervisor state / PID / control channel.

If it is the repository-owned preview:

```text
reuse it
or
use the authenticated supervisor restart command
```

If ownership is unknown:

```text
STOP_PORT_4173_OWNERSHIP_UNKNOWN
```

Report the exact PID/process evidence.

Do not kill unrelated user processes.

---

# 6. RESOLVE THE PRIVATE PLAYGROUND MANIFEST SAFELY

The accepted persistent preview launcher may use a verified isolated-Playground proxy for:

```text
/api
/brand
/media
```

Resolve the current approved private Playground manifest from repository/private runtime authority.

Do not:

```text
print the manifest contents
print access credentials
commit the manifest
copy secrets into logs
fall back to Production
guess a hostname
```

The launcher must preserve:

```text
resolvePrivatePath(...)
parsePlaygroundOrigin(...)
verifyPlaygroundOrigin(...)
```

before setting:

```text
HAU_PLAYGROUND_PROXY_ORIGIN
```

If the approved manifest exists and verifies:

```text
use the accepted supervised 4173 preview
```

If manifest verification fails:

```text
DO NOT FALL BACK TO PRODUCTION
DO NOT BYPASS THE GUARD
```

Stop the proxy-backed start and report the real guard failure.

---

# 7. FRONTEND-ONLY FALLBACK IF THE PROXY IS NOT CURRENTLY AUTHORIZED

If the running FI slice only needs frontend visual work and the guarded private Playground target is legitimately unavailable, a temporary LOCAL-ONLY visual preview at the same URL is permitted:

```text
HAU_PLAYGROUND_PROXY_ORIGIN = unset

npm run dev -- --host 127.0.0.1 --port 4173 --strictPort
```

Use this only as:

```text
FRONTEND_ONLY_LOCAL_PREVIEW
```

and label backend-dependent states truthfully.

Do not pretend API-dependent flows are integrated if no backend proxy is attached.

As soon as the accepted guarded supervisor can be used again, return to it.

The user-facing URL remains:

```text
http://127.0.0.1:4173/
```

---

# 8. NEVER PROXY TO PRODUCTION FOR LOCAL DESIGN WORK

Hard rule:

```text
LOCAL PREVIEW
→ local frontend
→ verified isolated Playground proxy when authorized
```

Never:

```text
LOCAL PREVIEW
→ Production backend
```

as a convenience fallback.

Production crossover:

```text
0
```

until the release process explicitly reaches its Production-authorized phase.

---

# 9. KEEP THE PREVIEW ALIVE ACROSS FI SLICES

Once healthy, do not intentionally stop `4173` after each task.

Keep it alive through the active frontend integration window.

The desired loop is:

```text
FI-04 change
→ HMR
→ inspect 4173
→ fix
→ verify

FI-05 change
→ HMR
→ inspect 4173
→ fix
→ verify

...

FI-13
→ complete whole-product visual review on 4173
```

Only stop/restart the supervisor when:

```text
the owned preview is unhealthy
the relevant config requires restart
the process exited
HMR cannot recover
the owner explicitly asks
the FI program finishes
```

---

# 10. PRE-SLICE VISUAL FIX GATE

Before declaring any FI slice complete and advancing:

```text
LOCAL_PREVIEW_4173 = HEALTHY
CURRENT_SLICE_ROUTE = RENDERABLE
NO_KNOWN_P0_VISUAL_DEFECT = true
NO_KNOWN_P1_FUNCTIONAL_DEFECT = true
NO_OBVIOUS_ROUTE_DEAD_END = true
NO_OBVIOUS_CONSOLE_FATAL = true
NO_OBVIOUS_MOBILE_BREAKAGE = true
NO_NEW_PUBLIC/REQUESTER/INTERNAL_CONTEXT_REGRESSION = true
```

If a defect is found:

```text
KEEP THE DEFECT IN THE CURRENT FI SLICE
→ FIX IT
→ VERIFY IT
→ THEN ADVANCE
```

Do not push a broken slice merely to preserve schedule.

---

# 11. OWNER LIVE-FEEDBACK PRIORITY

The preview exists so Earl can inspect the current frontend while the FI program runs.

If Earl reports a defect seen at:

```text
http://127.0.0.1:4173/
```

then:

```text
1. Treat the report as current owner feedback.
2. Reproduce on the local preview.
3. Identify the owning FI slice.
4. Fix it before advancing if it affects the current/shared frontend.
5. Add a regression check when practical.
6. Re-render/reload 4173.
7. Verify visually and functionally.
8. Continue the one-shot program.
```

Do not require Earl to wait until Playground for frontend corrections.

---

# 12. DO NOT CREATE A MANUAL APPROVAL HOLD AFTER EVERY SLICE

This amendment enables live owner inspection.

It does not automatically turn FI-04→FI-17 into a manual approval workflow.

Default:

```text
agent continues automatically when current slice is green
```

But if Earl is actively reviewing and sends feedback:

```text
feedback preempts next-slice advancement
```

until the relevant defect is resolved.

---

# 13. ROUTES THAT MUST REMAIN INSPECTABLE

As they become implemented, make the local preview capable of exercising the actual product contexts.

At minimum:

```text
LANDING

PUBLIC
- Public Lending Hub
- borrower-safe browse
- lending tracking/policy states

AUTH GATE
- Staff Sign In
- Activate Account UI
- Forgot Password UI
- 8-digit verification UI
- denied / loading / error states

AUTHENTICATED REQUESTER
- External Request Center
- requester mode
- DOL requester-mode cue
- Open Logistics Hub shortcut

AUTHENTICATED DOL OPERATIONS
- FI-04 shell
- FI-05 Inventory
- FI-06 Internal Request Hub
- FI-07 Internal Lending Hub
- FI-08 Release
- FI-09 Restocking / Procurement / Receiving
- FI-10 Accounts / Directory / History
- FI-11 References / Events / Health
```

If a backend gap makes a route impossible to complete, the preview must show the truthful designed gap state rather than fake success.

---

# 14. PRESERVE THE THREE-CONTEXT ARCHITECTURE

Visual inspection must protect:

```text
PUBLIC LENDING
= public/no staff login

EXTERNAL REQUEST CENTER
= authenticated eligible USC staff/officer

MAIN LOGISTICS HUB
= authenticated DOL/internal capability gated
```

Immediately flag any preview regression where:

```text
Start logistics request
→ Public Lending

External Request Center
→ no-login public portal

Public Lending
→ Internal Request Hub

generic Staff Sign In
→ arbitrary hardcoded internal route
```

These are architecture regressions, not cosmetic issues.

---

# 15. HOME / SESSION BEHAVIOR

Continuously verify on `4173`:

```text
Home
→ landing
→ scroll top
→ preserve authenticated session
```

and:

```text
Sign Out
→ destroys session
```

Do not regress Home into logout.

Do not reintroduce current copy:

```text
Public front door
```

---

# 16. RESPONSIVE LIVE PREVIEW LOOP

For each FI slice that materially changes layout, inspect at least:

```text
320
390
768
1024
1440
```

Do not needlessly restart Vite for viewport changes.

Use the running `4173` instance.

At minimum check:

```text
overflow
clipping
broken grid
sidebar/drawer behavior
navigation
focus visibility
touch targets
modals
forms
tables
long text
loading/error/empty states
```

---

# 17. LIGHT / DARK / MOTION

When the slice touches shared design:

```text
LIGHT = inspect
DARK = inspect
REDUCED MOTION = inspect when motion changed
```

Use the same live preview.

Do not rely only on Figma screenshots.

Figma is visual authority/reference; `4173` proves the implemented browser behavior.

---

# 18. CONSOLE / NETWORK FEEDBACK

During local visual acceptance, watch:

```text
browser console errors
uncaught exceptions
React warnings that affect behavior
failed asset loads
failed API calls
wrong API origin
CORS errors
404/500 responses
infinite retries
duplicate requests
```

Classify:

```text
FRONTEND DEFECT
EXPECTED BACKEND GAP
PROXY CONFIG DEFECT
UNRELATED BASELINE NOISE
```

Do not hide errors merely to make the page look green.

---

# 19. NO BUSINESS-DATA MUTATIONS DURING ORDINARY VISUAL REVIEW

The local preview is primarily a frontend inspection surface.

Unless a later accepted integration slice explicitly authorizes an isolated Playground mutation:

```text
DO NOT:
submit real logistics requests
submit real lending requests
approve/reject records
release stock
receive procurement
adjust inventory
reset passwords
send verification codes
write D1
write R2
```

Prefer:

```text
read-only states
fixtures
safe mocks
already-approved isolated test data
```

for ordinary visual inspection.

---

# 20. PREVIEW HEALTH CHECKS

At useful checkpoints, run:

```text
npm run preview:frontend:status
```

and directly verify:

```text
GET http://127.0.0.1:4173/
```

Expected:

```text
RUNNING
healthy=true
2xx
HTML
```

Do not mark the preview healthy only because a process exists.

---

# 21. AUTO-RECOVERY

The accepted supervisor is designed to recover an owned Vite child.

If the preview disappears:

```text
1. status
2. inspect supervisor health
3. allow bounded auto-recovery
4. verify a new owned Vite PID
5. verify 4173 returns healthy HTML
```

Do not create duplicate Vite processes.

Do not repeatedly spawn new preview servers while an owned supervisor exists.

---

# 22. HMR IS PART OF THE REQUIRED WORKFLOW

For normal frontend edits:

```text
edit
→ save
→ HMR
→ inspect
```

If HMR fails for a particular config/module transition:

```text
use the owned safe restart
```

Do not restart the whole FI orchestration session.

---

# 23. LOCAL PREVIEW IS NOT PLAYGROUND ACCEPTANCE

Keep terminology precise:

```text
4173
= LOCAL LIVE PREVIEW

Playground domain
= isolated deployed staging environment

Production domain
= Production
```

Passing `4173` does not authorize Playground.

Passing Playground does not authorize Production.

All original FI-14/FI-16/FI-17 release gates remain.

---

# 24. FI-04 START GATE

Before FI-04 begins/continues:

```text
CURRENT / TASK / HANDOFF reconciled
R3-A1-A2 baseline adopted
F2 baseline frozen
4173 healthy
owner can open 4173
landing works
Public Lending opens correctly
Start logistics request reaches Staff Sign In
Home works
console has no current fatal blocker
```

Then proceed with FI-04.

---

# 25. FI-04→FI-11 LOOP

For each slice:

```text
A. REHYDRATE CURRENT SLICE
B. IMPLEMENT BOUNDED CHANGE
C. RUN FOCUSED TESTS
D. CHECK 4173 HEALTH
E. OPEN AFFECTED ROUTE
F. VISUAL / INTERACTION PASS
G. FIX CURRENT DEFECTS
H. RECHECK
I. COMMIT/PUSH AT THE EXISTING SAFE R1 CHECKPOINT
J. ADVANCE
```

Do not perform a full whole-product audit after every small edit.

Use focused inspection until FI-12/FI-13 convergence.

---

# 26. FI-12 CONVERGENCE

At FI-12, use the still-running preview to inspect cross-module behavior:

```text
shell navigation
request/lending separation
shared profile/account states
inventory-linked surfaces
release/procurement handoffs
theme
responsive
accessibility
```

Fix cross-slice integration defects before FI-13 freeze.

---

# 27. FI-13 FINAL LOCAL PREVIEW ACCEPTANCE

Before freezing the FI-13 exact candidate:

```text
4173 must represent the complete candidate source
```

Run:

```text
Hallmark
Impeccable
Taste if available
Vercel Web Interface Guidelines if available
accessibility
responsive matrix
motion/reduced-motion
focused browser acceptance
```

Then use `4173` for a final owner-observable candidate sanity pass.

Only after the local candidate is coherent should FI-14 Playground work begin.

---

# 28. DURABLE CONTINUITY

Update the current FI continuity record so a resumed session knows:

```text
LOCAL_PREVIEW_REQUIRED = true
LOCAL_PREVIEW_URL = http://127.0.0.1:4173/
PREVIEW_POLICY = persistent while frontend integration active
PREVIEW_OWNER = repository accepted supervisor
PREVIEW_IS_NOT_DEPLOYMENT = true
```

Record:

```text
instance ID
supervisor PID
Vite PID
health
restart count
last healthy timestamp
```

only in the existing untracked runtime state mechanism.

Do not commit runtime PID/token state.

---

# 29. DO-NOT-REPEAT RULE

If `preview:frontend:status` proves the same owned preview is already:

```text
RUNNING
healthy=true
```

do not stop and recreate it.

Reuse it.

If HMR is functioning, do not restart after every code change.

If the owner reports no defect and focused verification is green, continue.

---

# 30. STOP CONDITIONS

Stop preview-related advancement and report if:

```text
PORT_4173_OWNERSHIP_UNKNOWN
PRIVATE_PLAYGROUND_MANIFEST_INVALID
PLAYGROUND_ORIGIN_GUARD_FAILS
PREVIEW_RESTART_LOOP_DETECTED
PRODUCTION_FALLBACK_WOULD_BE_REQUIRED
SECRET/PII EXPOSURE WOULD_BE_REQUIRED
UNKNOWN DIRTY WORK AT RISK
CONFLICTING WRITER
```

Do not turn these into destructive recovery.

---

# 31. ACCEPTANCE GATE FOR THIS AMENDMENT

This amendment is active when:

```text
LOCAL_PREVIEW_URL
= http://127.0.0.1:4173/

PORT_4173_OWNERSHIP
= VERIFIED

LOCAL_PREVIEW
= RUNNING

LOCAL_PREVIEW_HEALTH
= PASS

HTTP_ROOT
= PASS

HMR
= PASS

OWNER_BROWSER_ACCESS
= PASS

PUBLIC_LENDING_ROUTE
= PASS

START_LOGISTICS_REQUEST_AUTH_GATE
= PASS

HOME_ROUTE
= PASS

PRODUCTION_CROSSOVER
= 0

UNKNOWN_PROCESS_KILLED
= 0
```

Then continue the running FI program.

---

# 32. SHORT DIRECTIVE

```text
START THE REAL WEBSITE LOCALLY AT:

http://127.0.0.1:4173/

KEEP IT RUNNING.

USE THE EXISTING SAFE SUPERVISOR.

DO NOT FORCE-KILL UNKNOWN PROCESSES.

DO NOT FALL BACK TO PRODUCTION.

AFTER EVERY MATERIAL FI CHANGE:
HMR → LOOK AT 4173 → FIX IT → VERIFY IT → THEN MOVE ON.

IF EARL REPORTS A DEFECT FROM 4173:
FIX IT BEFORE ADVANCING THE AFFECTED SLICE.

THE GOAL IS TO CATCH AND FIX FRONTEND INTEGRATION PROBLEMS LOCALLY,
NOT AFTER WE HAVE ALREADY PUSHED THROUGH MULTIPLE FI SLICES.
```
