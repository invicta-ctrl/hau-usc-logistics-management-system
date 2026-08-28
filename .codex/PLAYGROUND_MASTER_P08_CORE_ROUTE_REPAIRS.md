# P08 Core Routes — Focused Repairs

DATE: 2026-08-28
PROGRAM: PLAYGROUND-MASTER-2026-08-28
STATUS: PASS_LOCAL_CORE_ROUTE_REPAIRS;LIVE_DEPLOYMENT_PENDING_P29
ROUTE: SOLO

## Authority and boundary

The accepted Playground master specification authorized the smallest supported repairs after the fresh-browser before-repair audit. Work remained in the isolated `reconcile/playground-master` worktree with one Sol writer. No deployment, schema migration, Playground business-data mutation, Production read/write, main mutation, Google write, or Figma write occurred.

## Confirmed causes

- Lending paginated the recent ticket queue independently from the alphabetical inventory page. Tickets could therefore reference canonical items outside the bounded inventory window, causing the UI to report that every linked item was unavailable in the projection.
- Release had an existing authenticated Worker/D1 command with recipient confirmation, required evidence, full/partial quantities, reservation consumption, inventory-ledger issue movements, revision/conflict protection, and idempotency, but the normal frontend route exposed only read-only collections.
- Restocking had an existing authenticated Worker/D1 receiving command with required evidence, cumulative quantity enforcement, restock lifecycle changes, inventory-ledger receive movements, conflict protection, and idempotency, but the normal frontend route exposed only read-only collections.
- Overview and Procurement already met their P08 truthfulness boundary in the fresh-browser audit. Request already used the authenticated queue and mutation contracts; focused regression coverage confirmed abort/retry/failure handling and real service consequences, so no speculative Request rewrite was applied.

## Repairs

### Lending

The lending bootstrap now supplements its bounded inventory page with only the canonical inventory rows referenced by the loaded ticket page. These rows retain the same scope, availability, storage-hiding, and DTO protections as normal inventory projections. The UI no longer needs a fabricated fallback item or availability value.

### Release

The normal Release route is now gated by the exact server-derived `fulfillment.release` and `evidence.upload` capabilities. Authorized operators can record a full or partial physical release through the existing evidence-upload and `confirmRelease` Worker commands. The UI uses stable command identities, requires recipient details and governed evidence, reloads the authoritative bootstrap after success, and fails closed on conflicts or unknown outcomes.

### Restocking

The normal Restocking route is now gated by the exact server-derived `fulfillment.receive` and `evidence.upload` capabilities. Authorized operators can record full or partial cumulative receiving through the existing evidence-upload and `receiveRestock` Worker commands. The UI validates the bounded quantity and evidence, uses stable command identities, reloads authoritative state after success, and fails closed on conflicts or unknown outcomes.

### Procurement and fixture boundary

Procurement remains truthfully read-only because this surface does not expose an accepted mutation. The fixture-boundary verifier now requires the three authenticated operational calls and rejects synthetic success markers in the normal operational route.

## Verification

```text
Focused Vitest: PASS — 7 files, 71 tests
Full Vitest: PASS — 164 files, 1204 tests
Cloudflare build: PASS — 1679 modules transformed
Frontend fixture boundary: PASS
Prettier check for all 10 changed implementation/test files: PASS
git diff --check: PASS
Targeted ESLint for changed JavaScript: PASS
```

The focused set covered the D1 lending projection regression, frontend adapter contracts, fixture guards, FI-07 Lending, FI-08 Release, FI-09 Restocking, and integration workflows. Existing Worker/D1 tests continue to prove full/partial release, replay/duplicate protection, reservation and ledger consequences, cumulative receiving, and inventory movement.

TypeScript's compiler is not installed as a project dependency; invoking `npm exec tsc` reached the registry placeholder package and was not treated as compiler evidence. The production Cloudflare build compiled the changed TypeScript/TSX successfully.

## Browser acceptance boundary

A local Cloudflare/Playwright rerun was not performed because `127.0.0.1:8787` is owned by an unrelated Astral Bridge process. That process was preserved and not stopped. The before-repair live audit remains the route-reproduction baseline; post-repair live consequences, denial, retry, and reset acceptance will be run against the isolated Playground only after the authorized P29 deployment and P30 acceptance cycle.

## Preserved finding

The one Playground convenience session/transient created by the P08 before-repair browser audit remains preserved as a P12 lifecycle finding. No cleanup or working-state normalization was performed in this phase.

## Next exact action

Begin P09 Events full recovery from the accepted root-cause order. Audit the current System Owner capability, UI gate, Worker authorization and endpoint, response contract, baseline relationships, adapter, terminal loading/retry states, underprivileged denial, and reset coverage before applying any repair.
