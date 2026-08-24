# FI-07 — Internal Lending Hub Frontend Integration

STATUS: ACCEPTED_FOR_IMPLEMENTATION
DATE: 2026-08-24
PROGRAM: HAU-USC Logistics FI-04 → FI-17 R1
SLICE: FI-07
TASK-BOUND ADOPTION: Earl's continuing FI-04→FI-17 directive, accepted R1/A2/A3/A4 amendments, and the bounded Sol delegation to `/root/fi07_lending_hub_writer`.

## INTENT

SOFTWARE_FEATURE

## MODE

EXECUTE

## OBJECTIVE

Replace the current authenticated Lending placeholder/fixture with the DOL-only Internal Lending Hub. It must project only the existing lending bootstrap and submit only the existing approved lifecycle commands. Public Lending remains a separate public borrower surface.

## TARGET

- Authenticated `lending` route in the Main Logistics Hub.
- Local-only A4 Preview Index inspection rendering of that same module with deterministic fixture data.

## AUTHORITATIVE SOURCES

1. Earl's continuing FI-04→FI-17 directive.
2. R1 one-shot FI-07 Office Lending Hub requirement.
3. Accepted R1-A2 vocabulary: `LENDING / OFFICE LENDING HUB` means the Internal Lending Hub — DOL; Public Lending remains separate.
4. Accepted A3 persistent local preview gate and A4 Preview Index local-inspection boundary.
5. `output/design/figma-make-source/src/app/LendingHubRoute.tsx` (Make v44 composition/reference) for queue, table/cards, inspector, lifecycle, state presentation, and responsive intent.
6. Existing repository contracts, especially `src/server/d1/operational-service.js`, `src/worker/index.js`, `src/domain/permissions.js`, evidence contract, and `docs/frontend/ROUTING.md`. Runtime contract/security truth wins over a design implication.

## IN SCOPE

- DOL-only `lending` route retained behind server-derived `view.internal`.
- Presentation-only session capability booleans from the raw server capability array for `lending.approve`, `lending.handoff`, `lending.return`, and `evidence.upload`; all Worker authorization remains authoritative.
- Strict authenticated `GET /api/bootstrap/lending` adapter for bootstrap-module v2. It must reject a wrong/missing contract, wrong module, non-v2 version, `requestOnly`, malformed data, or malformed pagination/revision instead of inventing records.
- Canonical projection of `lendingTickets`, `inventoryItems`, loaded-page pagination, and `scopeRevision`. Preserve absent/redacted availability or storage fields as unavailable; never convert their absence into believable zeroes.
- Loaded-page queue, search and filters that are explicitly labeled as applying to the loaded authoritative page. Do not claim a global ticket total because this legacy bootstrap pagination total is inventory-derived rather than ticket-owned.
- Desktop table and mobile cards; selected-ticket inspector with borrower/custody, requested versus approved item/quantity, eligibility source, asset options/assignment context, due date, ticket type, review notes/reasons, condition/maintenance status when projected, and server status history.
- Display-only derived `OVERDUE` when a canonical `ON_LOAN` ticket has a past `dueAt`; do not mutate or misrepresent the server lifecycle state.
- `FOR_REVIEW` action dialog for APPROVE, PARTIAL_APPROVE, SUBSTITUTE, and REJECT. Require the canonical identity-verification source and acknowledgement for non-reject decisions, enforce client usability checks for quantity/reason/substitution/traceable asset selection, and send the existing approval command.
- `READY_TO_CLAIM` explicit consequence confirmation: `Confirm issue` for consumables and `Confirm handoff` for reusable loans, using the existing handoff command and no inventory approximation.
- `ON_LOAN`/derived `OVERDUE` return dialog: require an allowed condition, exact returned/lost/damaged-beyond-use reconciliation, exception note for loss/damage, and a selected governed photo. Upload it through existing `/api/uploadEvidence` as `LENDING_RETURN_PHOTO`, then provide its returned `evidenceId` to `/api/confirmReturn`. No raw evidence-id field is the primary UX.
- Stable deterministic client request IDs per exact logical command, in-flight disabling, server receipt/correlation display, authoritative refetch after success, and 409 refetch/replacement of the selected ticket while retaining safe local draft inputs for retry.
- Separate loading, refreshing, stale, error, and permission-limited states. Stale data pauses all mutations. Permission-limited wording does not confirm protected record existence.
- Fixed/full-screen mobile inspector, dialog focus trap, Escape close, body scroll lock, labelled dialogs/live regions, 44px controls, keyed focus restoration, and no horizontal overflow.
- A4 fixture-only Preview Index route with no session/capability creation and zero protected lending/mutation/evidence traffic. Preview actions may demonstrate local state only and must be visibly labeled.

## EXISTING RUNTIME CONTRACT

### Read

`GET /api/bootstrap/lending?page=<positive>&pageSize=<positive>` returns authenticated `bootstrap-module` v2 with `module: "lending"`, `requestOnly: false`, canonical `data.lendingTickets`, canonical `data.inventoryItems`, `pagination`, and `scopeRevision`. `lendingTickets` include identity/custody, requested/approved fields, eligibility review details, `assetOptions`, full status history, and timestamps.

The module's current `pagination.total` is not ticket-owned. The UI may describe only the loaded page and current returned page controls; it must not calculate or display a global lending-ticket count from that value.

### Commands

- `POST /api/approveLendingTicket`: `ticketId`, `decision`, `clientRequestId`; non-reject decisions also need `identityVerified: true` and the exact `identityVerificationSource`. Partial/substitute/reject require `reviewReason`; partial has an approved quantity below requested; substitute has a different canonical `substitutionItemId`; traceable approved items require matching available `assetIds`.
- `POST /api/confirmLendingHandoff`: `ticketId`, `clientRequestId`, optional canonical `conditionLabel` and notes. The server decides consumable issue versus reusable handoff from the ticket type.
- `POST /api/uploadEvidence`: existing evidence command with `evidenceType: "LENDING_RETURN_PHOTO"`, related ticket identity, original filename, MIME type, base64 file data, and stable command ID. This happens before a return and returns a stored/verified `evidenceId`.
- `POST /api/confirmReturn`: `ticketId`, `clientRequestId`, `conditionLabel`, `evidenceId`, returned/lost/damaged-beyond-use quantities, and an exception note where required. The server rechecks evidence linkage, scope, lifecycle, quantity reconciliation, ledger/custody, and idempotency.

## SECURITY AND DATA INVARIANTS

- The browser never creates a session, role, capability, availability, asset assignment, custody state, evidence reference, or success receipt.
- UI control hiding/disabling is presentation only. Direct requests remain subject to existing Worker capability, CSRF, entity scope, idempotency, atomicity, condition, availability, evidence, and lifecycle checks.
- No fake asset availability, stock balance, condition, maintenance record, physical-stock deduction, or public identity is permitted.
- Return photos stay in the governed evidence flow; file contents are never persisted by the frontend or placed in a handoff/receipt.
- Preview inspection never accesses protected data or sends a protected read/mutation/evidence request.

## OUT OF SCOPE

- Public Lending intake, `createLendingTicket`, requester mode, public catalog changes, or borrower creation.
- Backend/Worker/auth/capability/permission/schema/migration/provider/Figma/Playground/Production/main/deploy changes.
- Due reminders, notifications, monitoring, cancellation, Register asset, Log maintenance, or maintenance/condition mutation. Maintenance and condition are read/presentation only where canonical data projects them.
- Restarting a healthy local 4173 preview, touching `.ai-bridge/`, FI-08+, committing, or pushing before independent review.

## VERIFICATION

- Focused adapter/session capability/lending behavior unit tests.
- Dedicated FI-07 frontend Playwright tests under `playwright.frontend.config.js` at 320, 390, 768, 1024, and 1440 widths.
- Exact `127.0.0.1:4173` Preview Index lending inspection case proving zero protected `/api/bootstrap/lending`, lifecycle mutation, and evidence traffic.
- Targeted format; `npm.cmd run build`; `npm.cmd run verify:dist`; `npm.cmd run check:agents`; `npm.cmd run check:continuation`; `npm.cmd run handoff:verify`; `git diff --check`.

## STOP CONDITIONS

- Unknown tracked dirt, a conflicting writer, missing/contradictory contract, an auth/capability semantic change, required backend expansion, inability to use governed return evidence without widening scope, protected traffic in A4 inspection, failed focused verification that cannot be repaired in scope, or any provider/deploy/destructive action.
