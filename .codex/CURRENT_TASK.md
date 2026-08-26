# Current Bounded Task — FI-10 Accounts, Directory, and Activity History Frontend Integration (Closed)

INTENT: SOFTWARE_FEATURE + TESTING
MODE: EXECUTE
OBJECTIVE: Record the closed accepted FI-10 integration: only Accounts and access, Staff directory, and Activity are integrated into authenticated administration with existing read-only access-admin data and a sanitized deterministic zero-protected-traffic A4 surface.
TARGET: .codex/specs/accepted/2026-08-26-fi10-accounts-directory-activity-history-frontend-integration.md; src/frontend/app/AppRouteRenderer.tsx; src/frontend/app/AdministrationRoute.tsx; src/frontend/integration/backend.ts; src/frontend/preview/index/PreviewInspectionRoute.tsx; src/frontend/preview/index/registry.ts; focused FI-10 unit and bounded Preview Index behavior coverage; the three current-chain records.
CURRENT_POINTER: .codex/CURRENT.md
CURRENT_HANDOFF: .codex/CURRENT_HANDOFF.md
ACCEPTED_SPEC: .codex/specs/accepted/2026-08-26-fi10-accounts-directory-activity-history-frontend-integration.md
START_HEAD: 88aa02d8598040b6d7c9689965ee6750672f34bb
UPSTREAM_AT_HANDSHAKE: origin/frontend-design-integration @ 88aa02d8598040b6d7c9689965ee6750672f34bb (+0/-0)
AUTHORITY: Earl FI09-FI17-SOL-COGNEE-2026-08-26 owner attachment; accepted FI-10 packet; TOKEN-OPT-001-A8; project policy; A3/A4 Preview Index authority; existing authenticated access-admin, staff-directory, and activity-history contracts; live Make-v44 administration composition recorded by Sol.
REQUIRED_MODEL: GPT-5.6 Terra / Max sole canonical frontend writer; Sol remains read-only orchestrator, reviewer, and final acceptance authority.
TASK_STATUS: FI10_CLOSED__SOL_ACCEPTED
ACTIVE_WRITER: NONE
WRITER_LOCK: RELEASED__FI10
RISK: HIGH
SCOPE: Render only Accounts and access, Staff directory, and Activity in authenticated administration and A4 inspection. Authenticated runtime may use the three existing access.admin read-only endpoints; person/account/correlation identifiers stay opaque and are never rendered. A4 remains visibly synthetic, sanitized, deterministic, and zero-protected-traffic. Preserve route authorization, person/account distinction, role/capability data only when server-provided, approval lifecycle, privacy, append-only history, archive semantics, profile/account states, responsive/keyboard/focus/contrast behavior, and visible 3px focus treatment.
OUT_OF_SCOPE: Backend/API/Worker/service/authorization/capability/permission/auth/session/schema/migration/D1/R2/provider/Figma/Make/Playground/Production/main/deployment; all mutations; raw roster/contact/birthday/identity data; Reference administration, Link registry, Brand and media, System status, Events, FI-11+, and .ai-bridge/. The deterministic generated artifacts and FI-10 closure receipt are accepted closure evidence only.
INVARIANTS: Existing server-derived access.admin authorization remains the authority. UI visibility is never authorization. Staff identity may be displayed only when the supported directory contract conditionally permits it; accountId, personId, correlationId, account-access snapshots, email, birthdays, and contact fields are not rendered. Activity history is append-only/read-only and never fabricated or erased. A4 creates no session/capability and sends no protected backend read or mutation.
VERIFICATION: PASS — focused adapter/behavior tests 25/25; exact canonical-4173 Preview Index serial 320/390/768/1024/1440; capability/denial and privacy projection evidence; sanitized-preview/no protected traffic/console checks; keyboard/focus/overflow; Make-v44 parity review; Hallmark/Impeccable/Sol acceptance; npm.cmd run build; npm.cmd run verify:dist; npm.cmd run check:continuation; npm.cmd run handoff:verify; git diff --check; complete logical diff review. The healthy supervisor was not restarted.
STOP_CONDITIONS: FI-10 is complete. Do not begin FI-11 without Earl's next explicit authorization.
DELEGATION_LEDGER:

- writer=/root/fi10_terra_writer | model=gpt-5.6-terra | reasoning=max | role=sole canonical FI-10 frontend writer | mode=execute | scope=accepted Accounts and access, Staff directory, Activity integration, sanitized A4 inspection, focused verification, generated artifacts, and closure | owned=FI-10 packet/current-chain/receipt,AppRouteRenderer,AdministrationRoute,frontend backend adapter,PreviewInspectionRoute,registry,focused FI-10 unit,bounded Preview Index additions,accepted generated artifacts | excluded=backend/Worker/auth/authorization/permissions/schema/migration/provider/Figma/Make/Playground/Production/main/deployment/.ai-bridge/FI-11+ | status=COMPLETED__RELEASED__SOL_ACCEPTED | evidence=focused tests 25/25; exact-4173 five-width serial case; manual desktop/mobile audit; build/dist SHA; Sol/Hallmark/Impeccable acceptance.

PREVIEW_TARGET: http://127.0.0.1:4173/
PREVIEW_STATUS: RUNNING__HEALTHY__VERIFIED_2026-08-26
NEXT_EXACT_ACTION: Await Earl's explicit authorization for FI-11 preflight only; do not implement FI-11.
