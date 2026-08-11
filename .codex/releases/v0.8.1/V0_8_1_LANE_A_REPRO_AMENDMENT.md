# V0.8.1 Lane A Reproduction Amendment

## Status and authority

- **Status:** `V81-S09_LANE_A_REPRO_AMENDMENT_ACCEPTED_READY_FOR_COMMIT`
- **State:** `ACCEPTED_UNCOMMITTED_READY_FOR_GOVERNANCE_COMMIT`
- **Sol acceptance:** `PASS`.
- **Fresh Luna amendment review:** `PASS_NO_P0_P1_P2_P3`.
- **Acceptance timestamp:** `2026-08-12T04:07:16.4390951+08:00`.
- **Canonical baseline:** commit `76294daa725bbd13c46066ef6af337b94a4539e0`, tree `e29fe778c2276b2822c99f66de1e493e059f8c55`.
- **Evidence source:** isolated worker task `v0.8.1-s09-lane-a`, based on `76294daa725bbd13c46066ef6af337b94a4539e0`.
- **Boundary:** this accepted amendment authorizes only the exact four-path governance commit/normal push and parity verification. The retained Lane A worker may resume with the five-path amended scope only after governance push parity. Lane D and Lane F continue only in their isolated disjoint worktrees.

## Exact isolated-worker evidence

| Item | Result              | Evidence conclusion                                                                                                                    |
| ---- | ------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| V15  | PASS                | STAGING `9/9`, Production `9/9`, invalid identity `1/1`. Preserve the accepted identity contract.                                      |
| V31  | REPRODUCED          | Route selection leaves `#surface-main` inactive. Repair existing `focusMain` precedence only.                                          |
| V16  | REPRODUCED          | At the real `1024` evidence width, `admin.overview` right edge is `1235.765625`, greater than viewport width `1025`.                   |
| V42  | REPRODUCED          | At the real `320` evidence width, sticky masthead/hero overlap area is `17068`.                                                        |
| V19  | TEST FALSE NEGATIVE | Runtime/form values are correct. The failure comes from inspecting the CSS `[value]` attribute instead of the live DOM value property. |

The original four isolated-worker files remain retainable and unstaged: `src/v5/src/app.js`, `src/v5/integration/runtime.js`, `src/v5/styles/responsive.css`, and `tests/e2e/v5-current-application.spec.js`. They remain isolated from the canonical worktree pending acceptance.

## Amended Lane A write scope

**Allowed write paths only:**

1. `src/v5/src/app.js`
2. `src/v5/integration/runtime.js`
3. `src/v5/styles/responsive.css`
4. `tests/e2e/v5-current-application.spec.js`
5. `src/v5/styles/v4.css`

No other source, style, test, generated, configuration, workflow, provider, or governance path is authorized for Lane A implementation.

## Authorized repairs

- **V15:** no new repair is authorized by this reproduction; retain the passing identity behavior and its STAGING, Production, and invalid-identity evidence.
- **V31:** repair `focusMain` precedence within the existing app/runtime flow so route selection leaves `#surface-main` active. Preserve existing route behavior and the accepted menu-toggle, scrim, Escape, and route-focus contracts.
- **V16:** make the minimum overview grid/container responsive CSS correction needed at `1024`. Eliminate clipping and horizontal overflow without redesign or content removal.
- **V42:** make the minimum sticky masthead/hero geometry correction needed at `320`. Eliminate overlap without removing governed institutional identity or making a broad visual change.
- **V19:** change only the assertion to inspect the live DOM value property with `toHaveValue` or `inputValue`. Do not edit operations source or parity code.

## Required verification

Rerun the affected Lane A evidence at `320`, `390`, `1024`, and `1280`, plus all V15 identity cases.

- V15: STAGING `9/9`, Production `9/9`, invalid identity `1/1` remain passing with no private/full identity exposure.
- V31: route-selection focus resolves to active `#surface-main`; existing close/focus behaviors remain passing.
- V16: `admin.overview` grid and critical content fit without clipping or horizontal overflow at every required width, including the real `1024` case.
- V42: masthead and hero-heading bounds do not overlap or obscure one another at initial, `scrollIntoView`, and representative-scroll states, including the real `320` case.
- V19: review/info/reject/reserve form evidence uses the DOM value property, preserves the correct request ID, and requires no operations source edit.

## Invariants and stop conditions

Preserve routes, payloads, authorization, capabilities, release identity, governed institutional identity, and the accepted A/D/F plan boundaries. Keep `OPEN_P0=0`; the two accepted P1 families remain unchanged.

Stop immediately on any write outside the five allowed paths; any route, payload, authorization, capability, release-identity, provider, environment, schema, migration, or governance behavior change; any redesign or broad visual change; any unresolved overlap, overflow, clipping, or focus failure; any need to edit operations source/parity for V19; or any P0/P1 finding. A wider need requires a new bounded amendment.

## Exact next action

Commit and normally push only the exact four Lane A amendment governance paths, verify local/upstream/remote parity and preserved46, then resume the retained Lane A worker with the accepted five-path amended scope; no worker implementation/source/provider/Playground/Production/migration/ref action before governance push parity.
