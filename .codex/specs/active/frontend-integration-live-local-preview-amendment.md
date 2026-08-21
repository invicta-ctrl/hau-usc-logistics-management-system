# HAU-USC Logistics — Frontend Integration Live Local Preview Amendment

**AMENDMENT ID:** FI-LIVE-PREVIEW-01
**PROGRAM:** Frontend Design Integration
**TARGET BRANCH:** `frontend-design-integration`
**MODE:** LOCAL DEVELOPMENT ERGONOMICS / OBSERVATION
**RISK:** LOW, provided Production isolation remains intact
**OWNER:** Earl
**APPLIES TO:** FI-01 through FI-12
**DOES NOT CHANGE:** FI scope, backend contracts, release sequence, migration authority, Production authority, or acceptance requirements

---

## INTENT

Add a persistent local-development preview to the existing frontend-integration workflow so Earl can visually watch the website change while Codex implements each accepted FI slice.

The local preview is a **developer observation surface only**.

It must not become:

- a new deployment environment;
- a substitute for the Isolated Staging Playground;
- a substitute for FI acceptance testing;
- a reason to modify backend contracts;
- a continuous AI browser-monitoring loop;
- a source of unnecessary Codex token consumption.

---

# OBJECTIVE

For every authorized frontend implementation slice from FI-01 through FI-12:

```text
accepted FI slice
-> verify branch/worktree/authority
-> start or reuse one persistent local Vite preview
-> Earl opens localhost once
-> Codex implements the bounded frontend slice
-> Vite HMR updates Earl's browser automatically
-> Codex performs targeted verification
-> slice acceptance
-> next FI slice
```

Earl should be able to leave the local browser open and see frontend changes appear as Codex saves source files.

---

# CURRENT AUTHORITY PRESERVED

This amendment is subordinate to:

1. Earl's current explicit instruction.
2. Universal `AGENTS.md`.
3. `.agents/PROJECT_POLICY.md`.
4. Branch-local `.codex/CURRENT.md`.
5. `.codex/CURRENT_TASK.md`.
6. `.codex/CURRENT_HANDOFF.md`.
7. The accepted specification for the active FI slice.
8. `docs/design/FRONTEND_INTEGRATION_EXECUTION_PLAN.md`.
9. The frozen v0.8.3 backend/API/auth/data contracts.
10. The accepted visual/Figma baseline.

This amendment does **not** authorize FI-01 implementation before FI-01's own specification and required owner decisions are resolved.

---

# LOCAL PREVIEW MODE

Prefer the repository's existing V5 Playground-preview command:

```bash
npm run dev:v5:playground -- <absolute-private-playground-manifest>
```

The existing implementation is expected to bind the preview to:

```text
127.0.0.1:4173
```

Expected user-facing URL:

```text
http://127.0.0.1:4173
```

Use the repository's existing private-path and Playground configuration mechanisms to resolve the approved private manifest.

Do not:

- invent a manifest;
- copy a Production manifest;
- print private manifest contents;
- expose secrets or resource IDs;
- substitute Production when Playground configuration is unavailable.

If the required private Playground manifest cannot be resolved safely:

```text
STOP_LOCAL_PROXY_PREVIEW
```

Report the exact missing prerequisite.

Do not weaken the environment boundary merely to make the local preview work.

---

# LOOPBACK-ONLY RULE

The development server must remain bound to:

```text
127.0.0.1
```

Do not expose it on:

```text
0.0.0.0
LAN
public tunnel
Cloudflare Tunnel
remote host
public URL
```

unless Earl separately authorizes such access.

The purpose is local visual observation only.

---

# START ONCE, REUSE

Do not restart the development server after every frontend edit.

Start it once for the active implementation session and leave it running.

Vite Hot Module Replacement should handle normal source updates.

Restart only when required by:

- dev-server failure;
- dependency changes;
- Vite configuration changes;
- environment/configuration changes that Vite cannot reload;
- branch/worktree change;
- an accepted slice explicitly requiring a clean restart.

If the correct local preview is already running against the same worktree/configuration:

```text
REUSE_EXISTING_PREVIEW
```

Do not launch a duplicate server.

---

# REAL-TIME OWNER VIEW

Once the server is ready:

1. Print the exact local URL clearly.
2. When the execution environment supports opening the user's browser safely, open that URL **once**.
3. Otherwise instruct Earl to open:

```text
http://127.0.0.1:4173
```

4. Keep the development server alive while Codex implements the slice.
5. Let HMR update the page naturally.

Do not repeatedly reopen or steal focus from the browser.

---

# TOKEN-OPTIMIZED OBSERVATION POLICY

The purpose of this amendment is to improve owner visibility **without turning visual watching into an AI workload**.

## Codex must NOT

- take a screenshot after every source edit;
- continuously inspect the DOM;
- continuously poll the browser;
- continuously read browser console output;
- repeatedly dump network activity;
- repeatedly restart Vite;
- repeatedly rebuild the full Production artifact;
- repeatedly rerun unchanged visual tests;
- run an autonomous browser-watching loop while Earl is already watching the page.

Those behaviors add token/context/tool overhead without improving implementation quality.

## Codex SHOULD

Use browser automation or visual inspection only when:

1. a component reaches a meaningful checkpoint;
2. a visual defect needs diagnosis;
3. responsive behavior needs verification;
4. accessibility behavior needs verification;
5. an FI acceptance criterion specifically requires browser evidence;
6. the final state of the current FI slice is ready for acceptance.

Normal implementation remains:

```text
edit source
-> HMR
-> Earl sees change
-> continue
```

not:

```text
edit
-> screenshot
-> analyze
-> edit
-> screenshot
-> analyze
-> repeat forever
```

---

# SERVER OUTPUT POLICY

Do not continuously stream development-server logs into model context.

After successful startup, retain only enough information to prove:

```text
DEV_SERVER: RUNNING
HOST: 127.0.0.1
PORT: 4173
PLAYGROUND_PROXY: VERIFIED
WORKTREE: <current frontend worktree>
SLICE: <current FI slice>
```

Ignore normal repetitive Vite/HMR output.

Inspect logs only when:

- the build fails;
- HMR fails;
- the page fails to load;
- a network/API request fails unexpectedly;
- an acceptance test requires the evidence.

---

# BACKEND AND DATA BOUNDARY

The local preview must preserve the frozen v0.8.3 functional contract.

For FI-01 through FI-12:

```text
FRONTEND MAY CHANGE
visual tokens
layout
components
responsive behavior
interaction presentation
approved accessibility/frontend states

FRONTEND MAY NOT CHANGE
Worker behavior
server contracts
D1 schema
R2 behavior
authentication
session
CSRF
authorization
capabilities
business rules
inventory invariants
migrations
provider configuration
Production data
```

The current integration plan's `NO_BACKEND_CHANGE` rule remains binding.

---

# PLAYGROUND WRITE SAFETY

Starting the local preview does not itself authorize business-data mutation.

During ordinary live visual observation:

```text
PLAYGROUND_WRITES: NOT_AUTHORIZED_BY_THIS_AMENDMENT
```

Earl may navigate and inspect frontend states.

Do not deliberately trigger state-changing actions against the isolated Playground merely to make the page look populated unless the active FI specification explicitly authorizes that test.

When an FI acceptance test later requires an authorized mutation, follow that FI slice's exact test and data rules.

Production writes remain prohibited.

---

# PRODUCTION BOUNDARY

This amendment authorizes:

```text
LOCAL LOOPBACK PREVIEW
```

It does not authorize:

```text
PLAYGROUND DEPLOYMENT
PRODUCTION DEPLOYMENT
PRODUCTION DATA ACCESS EXPANSION
PRODUCTION MUTATION
PROVIDER MUTATION
MIGRATION
RECOVERY POINTER MOVEMENT
MAIN MERGE
```

FI-13 through FI-16 retain their existing candidate-freeze, Playground, owner-GO, protected-main, Production and closure gates.

---

# FI-SLICE WORKFLOW ADDITION

For FI-01 through FI-12, prepend this small development loop after the normal authority/Git handshake:

```text
1. VERIFY ACTIVE FI SPECIFICATION
2. VERIFY BRANCH + WORKTREE + WRITER LOCK
3. VERIFY NO PRODUCTION CROSSOVER
4. START OR REUSE LOCAL V5 PLAYGROUND PREVIEW
5. REPORT LOCAL URL TO EARL
6. IMPLEMENT ACTIVE FI SLICE
7. USE HMR FOR ORDINARY ITERATION
8. TARGETED BROWSER CHECKS ONLY WHEN REQUIRED
9. RUN FI-SPECIFIC DETERMINISTIC VERIFICATION
10. REVIEW COMPLETE DIFF
11. UPDATE HANDOFF
12. KEEP OR STOP SERVER AS APPROPRIATE
```

---

# SESSION CLOSEOUT

At the end of an FI implementation session:

If the same worktree/session will continue immediately, the local preview may remain running.

If:

- writer lock is released;
- branch/worktree changes;
- Codex session closes;
- a different FI worktree will be used;
- the preview becomes stale;

terminate the development server cleanly.

Do not leave multiple stale Vite processes competing for port `4173`.

---

# ACCEPTANCE CRITERIA

This amendment is functioning correctly when:

- [ ] Earl can open one localhost URL and watch frontend changes update during implementation.
- [ ] Vite HMR handles normal updates without server restart.
- [ ] Only one local preview instance exists for the active frontend worktree.
- [ ] Preview binds to loopback only.
- [ ] The approved isolated Playground proxy is used when backend data is required.
- [ ] Production resources are never substituted.
- [ ] Normal visual observation produces no Playground mutation.
- [ ] Codex does not continuously screenshot, inspect, or poll the browser.
- [ ] Browser inspection occurs only at meaningful implementation/acceptance checkpoints.
- [ ] No FI scope, backend contract, migration, security, data, or release rule is weakened.
- [ ] Local preview remains supplementary to formal Playground acceptance.

---

# TOKEN-EFFICIENCY RULE

Treat the persistent local dev server as infrastructure, not as an ongoing agent task.

```text
SERVER_RUNTIME_TOKEN_COST:
effectively none after startup

HMR_TOKEN_COST:
none by itself

EARL_MANUAL_VIEWING:
no Codex tokens

TARGETED_ACCEPTANCE_BROWSER_CHECKS:
expected and justified

CONTINUOUS_AI_VISUAL_MONITORING:
forbidden by default
```

Do not spend reasoning tokens narrating ordinary HMR updates.

Only report something when:

- a meaningful frontend milestone is visible;
- Codex needs Earl's decision;
- the local preview fails;
- the FI slice reaches its acceptance gate.

---

# REQUIRED HANDOFF ADDITION

Add these fields to FI-01 through FI-12 handoffs:

```text
LOCAL_PREVIEW:
LOCAL_PREVIEW_COMMAND:
LOCAL_PREVIEW_HOST:
LOCAL_PREVIEW_PORT:
LOCAL_PREVIEW_WORKTREE:
PLAYGROUND_PROXY_VERIFIED:
PREVIEW_PRODUCTION_CROSSOVER:
PREVIEW_BACKEND_WRITES:
PREVIEW_REUSED_OR_RESTARTED:
VISUAL_CHECKPOINTS_PERFORMED:
PREVIEW_STOPPED_AT_HANDOFF:
```

Do not record private manifest paths, resource identifiers, credentials or secrets.

---

# STOP CONDITIONS

Stop the preview or affected operation on:

- Production resource crossover;
- unverified Playground origin;
- required private manifest missing;
- unexpected backend mutation;
- wrong branch/worktree;
- competing writer;
- stale FI specification;
- Vite running against another worktree on the same port;
- private information appearing in logs;
- need for backend/API/migration changes outside the active FI specification.

---

# FINAL RULE

The owner should be able to **watch the site being built without requiring Codex to watch it with him**.

Use the local browser as Earl's real-time visual window.

Use Codex browser inspection only as engineering evidence when the active FI slice requires it.

```text
CODING -> HMR -> EARL WATCHES

not

CODING -> AI SCREENSHOT LOOP -> MORE TOKENS -> CODING
```

---

# FI-LIVE-PREVIEW-02 — Persistent Cross-Slice Preview

**STATUS:** OWNER-DIRECTED; adopted in-place on 2026-08-21 for FI-03 through FI-12.
**SCOPE:** preview lifecycle only; it does not broaden any FI slice, backend/auth/API contract, data/provider/deploy/migration authority, or writer-lock rules.

After the active FI authority, worktree, sole writer lock, and guarded proxy isolation are reverified, start or safely reuse exactly one local preview at `http://127.0.0.1:4173`. It must bind only `127.0.0.1`, serve the current `frontend-design-integration` V5 entry from this worktree, use the existing guarded isolated Playground proxy, and show no Production crossover. Do not record the private manifest path, identifiers, bindings, secrets, credentials, session material, or protected data.

For normal FI-03 through FI-12 closeout the preview remains alive independently of the writer lock:

```text
LOCAL_PREVIEW: RUNNING_PERSISTENT
PREVIEW_STOPPED_AT_HANDOFF: NO
```

Use Vite HMR for ordinary source changes. Never continuously poll, inspect, screenshot, or stream logs. Health checks are limited to startup/takeover, configuration/HMR failure, required restart, and immediately before a slice handoff. Do not start a duplicate listener. If port 4173 belongs to an unknown or ambiguous process, binds outside loopback, serves the wrong worktree/source, lacks isolated-proxy proof, or crosses to Production, stop only the preview operation and report the blocker without discarding valid FI work.

Restart only after listener/source/proxy failure, relevant configuration/manifest change, required exclusive-port test, or Earl's explicit request. When an accepted test requires port 4173, record the pause, stop the preview temporarily, run the test, then restart and reverify source/proxy/isolation. No new repository script, dependency, service, deployment, or architecture is authorized for persistence.

Each FI-03 through FI-12 current record and handoff must keep these safe fields current: `LOCAL_PREVIEW`, `LOCAL_PREVIEW_URL`, `LOCAL_PREVIEW_HOST`, `LOCAL_PREVIEW_PORT`, `LOCAL_PREVIEW_WORKTREE`, `LOCAL_PREVIEW_MODE`, `PLAYGROUND_PROXY_VERIFIED`, `PREVIEW_PRODUCTION_CROSSOVER`, `PREVIEW_REUSED_OR_RESTARTED`, `PREVIEW_TEMPORARILY_PAUSED_FOR_TEST`, `PREVIEW_HMR_STATUS`, `PREVIEW_BACKEND_WRITES`, `VISUAL_CHECKPOINTS_PERFORMED`, and `PREVIEW_STOPPED_AT_HANDOFF`.
