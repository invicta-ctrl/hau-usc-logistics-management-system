# FVR-02-A2 Local Preview Resilience

## Summary

Make the local Figma-native frontend preview at http://127.0.0.1:4173 survive ordinary local preview process failure by adding a persistent, owned-process supervisor that auto-restarts its Vite child with bounded backoff while preserving the guarded isolated-Playground proxy.

## Type

Fix + preview tooling.

## Source Issue/Task

FVR-02-A2 "Local Preview Resilience / Auto-Recovery Amendment" (accepted: `.codex/specs/accepted/2026-08-22-fvr02-a2-local-preview-resilience.md`). Observed 2026-08-22: `127.0.0.1:4173` actively refused connection.

## Original Requirements (100% Coverage Required)

| # | Requirement | Plan Step(s) |
|---|-------------|--------------|
| 1 | Persistent supervisor that starts a detached hidden process, owns exactly one Vite child, and auto-restarts unexpected exits | 2, 3, 4 |
| 2 | Preserve `resolvePrivatePath`, `parsePlaygroundOrigin`, and `verifyPlaygroundOrigin` before every initial start/restart | 2, 3 |
| 3 | Thin CLI modes start/status/restart/stop | 3 |
| 4 | Loopback-only control endpoint with random owner token stored only in ignored state, never logged | 3 |
| 5 | Prove token plus live supervisor/child identity before any command action | 3 |
| 6 | Never kill/replace an unknown listener; return exact ownership-unknown failure | 3, 4 |
| 7 | Store no manifest content/credentials; only canonical private manifest path and content fingerprint | 3 |
| 8 | Readiness is HTTP 2xx HTML; tolerate transient HMR failure; bounded backoff 1/2/4/8/15; stop on loop | 4 |
| 9 | Preserve Vite args and `/api`, `/brand`, `/media` proxy behavior | 2, 3 |
| 10 | Inject spawn/fetch/timers/fs/logger for testability; direct unit coverage | 4, 5 |
| 11 | Keep Production/Playground data/Figma/provider writes forbidden | 2, 6 |

**Coverage Check**: 11 of 11 requirements mapped to plan steps.

## Status

In progress. Only this local-preview slice is active. First-pass commit 346f4bf0b5e6a78308305393d72385d44f3d98ee and second-pass commit ac2d7227314acb923a55657f4e7fb09870f8d9b2 both failed parent/Ox runtime-promotion review; the final corrective commit closed the remaining ownership/lifecycle/termination gaps. Live runtime acceptance is still pending and is not claimed.

## Context

The original `scripts/start-frontend-playground-preview.mjs` starts one Vite child and exits with it, so an unexpected child/session exit leaves no listener. The FVR-02 audit-first program requires a stable guarded preview to compare live Figma against localhost.

## Current State

`scripts/start-frontend-playground-preview.mjs` is a foreground launcher. `scripts/playground-proxy-guard.mjs` exports `parsePlaygroundOrigin`, `verifyPlaygroundOrigin`, `isIsolatedPlaygroundHealth`. `scripts/private-path.mjs` exports `resolvePrivatePath`. `.gitignore` already ignores `.codex/runtime/`.

## Desired State

A thin CLI (`start`/`status`/`restart`/`stop` plus preserved foreground `dev`) and a detached supervisor under `.codex/runtime/local-preview/` state, loopback control, bounded auto-recovery, and no unknown-process killing.

## Governance Compliance

- Universal `AGENTS.md` byte-for-byte unchanged; only the temporary branch-local appendix governs routing (FVR-02-A2 Ox-first).
- `.agents/PROJECT_POLICY.md`: Production/Playground data/provider/Figma writes forbidden; one canonical writer (`ACTIVE_WRITER: DEEPSEEK_V4_PRO:/root/ds1_fvr02_writer_v2`); no history rewrite.
- This slice is local preview tooling only; no product/backend/auth/data/schema change.

## Existing Helpers to Reuse

- `resolvePrivatePath` (`scripts/private-path.mjs`) - canonical private path resolution.
- `parsePlaygroundOrigin`, `verifyPlaygroundOrigin` (`scripts/playground-proxy-guard.mjs`) - guarded origin verification.
- Existing `scripts/check-agent-instructions.mjs` and `git diff --check` as governance checks.

## Impact Analysis

### Files to Modify

- `scripts/start-frontend-playground-preview.mjs` - replaced with the thin CLI (preserves foreground `dev`).
- `package.json` - add `preview:frontend:start/status/restart/stop`; keep `dev:frontend:playground`.

### Files to Create

- `scripts/frontend-preview-supervisor.mjs` - `PreviewSupervisor` class plus runtime state helpers.
- `tests/unit/frontend-preview-supervisor.test.js` - focused unit coverage.
- `.codex/specs/accepted/2026-08-22-fvr02-a2-local-preview-resilience.md` (already committed) and this plan.

### Dependencies Affected

None beyond the preview launcher and package scripts.

### Breaking Changes

`dev:frontend:playground` invocation shape is preserved (`npm run dev:frontend:playground -- <manifest>`). New persistent commands are additive.

## Implementation Steps

### Step 1: Author the bounded plan

**File**: `.plans/fvr02-a2-local-preview-resilience.todo.md`

**Action**: Record scope, requirements, blockers, and validation.

**Why**: create-plan workflow and durable continuity.

### Step 2: Supervisor module

**File**: `scripts/frontend-preview-supervisor.mjs`

**Action**: Add `PreviewSupervisor` with injected spawn/fetch/sleep/now/logger, guarded origin resolution, loopback control endpoint, owner token, bounded backoff, health loop, and owned-child exit handling.

**Why**: isolated, testable supervision.

### Step 3: Thin CLI

**File**: `scripts/start-frontend-playground-preview.mjs`

**Action**: Add `start`/`status`/`restart`/`stop`/`dev` modes; `start` resolves and verifies the manifest, refuses stale state, spawns a detached supervisor, and awaits its published state.

**Why**: owner-friendly persistent commands and preserved foreground dev.

### Step 4: Tests

**File**: `tests/unit/frontend-preview-supervisor.test.js`

**Action**: Cover backoff, token, fingerprint, guarded launch, no duplicate child, unexpected-exit restart, expected stop, restart request, ownership-unknown control rejection, and healthy transition.

**Why**: deterministic verification without the private manifest.

### Step 5: Verification

**Action**: `git diff --check`; `node scripts/check-agent-instructions.mjs`; `npx vitest run tests/unit/frontend-preview-supervisor.test.js tests/unit/frontend-playground-guard.test.js`; focused eslint.

### Step 6: Continuity and receipt

**Action**: Update `.codex/CURRENT.md`, `.codex/CURRENT_TASK.md`, `.codex/CURRENT_HANDOFF.md`, and write a local-preview verification receipt.

## REMOVAL SPECIFICATION

### From `scripts/start-frontend-playground-preview.mjs`

- The old single-child foreground launcher body is replaced by the thin CLI dispatcher; the foreground behavior is preserved in the new `dev` mode.
- **Why removing**: it cannot recover from unexpected child exit.
- **Replacement**: Step 2 and Step 3.
- **Dependencies**: `package.json` `dev:frontend:playground` now invokes `dev` mode explicitly.

### Removal Checklist

- [x] Old single-exit launcher replaced.
- [x] Package script updated to explicit `dev` mode.
- [x] No dead references to the removed behavior remain.

## Anti-Patterns to Avoid

- No migration or parallel-old-code; the launcher is replaced cleanly.
- No fallback that silently uses Production as proxy origin.
- No killing of unknown processes.

## Validation Criteria

### Post-Implementation Checklist

- [x] `git diff --check` passes.
- [x] Focused unit tests pass (supervisor plus existing guard).
- [x] Focused eslint passes on changed JS.
- [x] `scripts/check-agent-instructions.mjs` passes.
- [x] No product/backend/auth/schema/Figma/Production change.

## Correction record

- First pass (346f4bf) fixed the launcher/supervisor baseline but left atomic duplicate-start claim, safe stale recovery, authenticated identity, readiness-marker, restart concurrency, storm reset, ownership stop, request bounding, state/token redaction, and Windows tree-kill gaps.
- Second pass (ac2d722) closed many gaps but left Windows tree termination unwired in the standalone supervisor, unsafe Vite arg forwarding, stale lifecycle truth across replacement launches, unhealthy-authenticated-start handling, own-claim cleanup on startup failure, identity-bearing control acks, pending-claim PID/port recovery, response-body overflow, and 0600/atomic-update truth.
- Final correction (this active slice) closes the remaining gaps; see `.codex/FVR02_A2_LOCAL_PREVIEW_RECEIPT.md`.

## Blockers (recorded; not part of this slice)

- `FVR02_VIDEO_AUTHORITY_CONFLICT` risk: hero video source must be resolved from live Figma; never invent a video.
- Public advertisements: expired plus missing media observed; no approved public-media mutation runbook yet, so C/D media population remains blocked pending owner authority.

## Pending later FVR-02 stages

- FI-00/FI-01 revalidate; FI-02/FI-03 functional preserve-if-verified and visual revalidate.
- Hero media/motion authority resolution and normal-motion/poster/reduced-motion gates.
- Public media chain classification (A/B frontend repair vs C/D runbook vs E amendment).
- Preview Module Index / Surface Preview / Test Real Login Flow and Production-negative gates.
