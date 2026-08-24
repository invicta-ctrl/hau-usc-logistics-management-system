# A3 local live-preview receipt — 4173 visual-fix gate

STATUS: PASS_WITH_FIRST_SOURCE_EDIT_HMR_INSPECTION_PENDING
DATE: 2026-08-24
AUTHORITY: `.codex/specs/accepted/2026-08-24-fi04-fi17-r1-a3-persistent-local-live-preview-4173-visual-fix-gate.md`
BASELINE: `frontend-design-integration` at `fee2d1de79a071935db555eee04819d960c0424b` before this documentation-only checkpoint
SCOPE: Local live preview and pre-FI-04 visual gate. No product source changed.

## Safe preview recovery

The status command first identified stale repository runtime state and refused unknown ownership. Port `4173` was then verified free; every stale recorded repository PID was verified dead. The accepted repository-owned supervisor was safely restarted using the approved private runtime manifest without printing, committing, or otherwise disclosing its path, contents, origin, token, fingerprint, control channel, instance identity, or PIDs.

The runtime-only state mechanism remains the sole location for process identity, PID, health timestamp, restart count, and owner token. This receipt intentionally contains none of those values.

```text
LOCAL_FRONTEND_PREVIEW_URL: http://127.0.0.1:4173/
PREVIEW_OWNER: repository accepted supervisor
PREVIEW_MODE: PERSISTENT_SUPERVISED
PREVIEW_IS_NOT_DEPLOYMENT: true
PORT_4173_OWNERSHIP: VERIFIED
LOCAL_PREVIEW: RUNNING
LOCAL_PREVIEW_HEALTH: PASS
RESTART_COUNT: 0 at observation
HTTP_ROOT: PASS — 200 HTML
PRODUCTION_CROSSOVER: 0
UNKNOWN_PROCESS_KILLED: 0
PLAYGROUND_BUSINESS_DATA_WRITES: 0
```

## Browser visual/route gate

The owner-visible in-app browser opened the 4173 landing page. It rendered the HAU-USC landing surface and completed loading. No business-data submission or authentication credential entry was performed.

```text
LANDING_ROUTE: PASS
PUBLIC_LENDING_ROUTE: PASS — opens with no account/sign-in
START_LOGISTICS_REQUEST_AUTH_GATE: PASS — reaches Staff Sign In / External Request Center gate
HOME_ROUTE: PASS — returns safely to landing
THREE_CONTEXT_REGRESSION: 0 observed
CONSOLE_WARN_ERROR_COUNT: 0
```

Responsive browser inspection at `320`, `390`, `768`, `1024`, and `1440` found no horizontal overflow, a visible hero, expected mobile/desktop navigation behavior, and no current fatal console blocker. The landing announcement loading state cleared.

## HMR evidence

```text
HMR_TRANSPORT: READY — Vite client and React Refresh injected
SUPERVISOR_FOCUSED_TEST: PASS — npm.cmd test -- tests/unit/frontend-preview-supervisor.test.js (53/53)
HMR_SOURCE_EDIT_INSPECTION: NOT_APPLICABLE_TO_A3_DOCUMENTATION_ONLY_CHECKPOINT
```

No material product source edit occurred in this checkpoint. Therefore this receipt does not falsely claim an observed source-save hot replacement. The first FI-04 source edit must perform `edit → HMR → inspect 4173` before FI-04 can advance.

## A3 start-gate decision

```text
CURRENT_TASK_HANDOFF_RECONCILIATION: PASS
R3_A1_A2_BASELINE_ADOPTED: PASS
FRONTEND_F2_R3A1A2: FROZEN
OWNER_BROWSER_ACCESS: PASS
FI04_IMPLEMENTATION: NOT_STARTED
FI04_START_GATE: GREEN_FOR_BOUNDED_AUTHENTICATED_SHELL_SLICE
```

## Boundaries retained

No Production access, main write, provider/Figma mutation, Playground business-data mutation, D1/R2 mutation, deployment, migration, or product-source change occurred. The persistent preview must stay alive through active frontend integration unless the accepted supervisor is unhealthy, configuration requires restart, HMR cannot recover, the owner asks, or the FI program ends.
