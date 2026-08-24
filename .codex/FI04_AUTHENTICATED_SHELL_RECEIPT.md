# FI-04 Authenticated Shell Receipt

STATUS: SOL_ACCEPTED_CHECKPOINT_READY
SCOPE: Bounded FI-04 Authenticated Shell, capability-projected navigation, read-only Profile route, responsive/light-dark shell parity, and mobile focus restoration only.
BASELINE: `01ba9eb05d224dc8a56f5257f1cd06e261590d4e`; branch and upstream were equal at entry and remain uncommitted for review.
COMMIT_PUSH: NONE — explicitly not authorized by this handoff.
FORMATTING_REPAIR: Sol-authorized local Prettier write was limited to `src/frontend/app/entryIntent.ts`, `src/frontend/app/shell/AuthShellTopbar.tsx`, `src/frontend/app/shell/SidebarNavItem.tsx`, and `tests/unit/frontend-entry-intent.test.js`. Targeted Prettier check across all FI-04 source/test/docs passed; adapter/entry units passed 34/34; build/verify:dist passed with unchanged SHA-256 `A07FCE9DF042C7244A7B1CCCC32F88573E47433BBDAAECA05B233797454BB1C6`; no behavior E2E rerun was needed.
SOL_ACCEPTANCE: Sol accepted the complete FI-04 logical diff for the authorized checkpoint. Root independently confirmed targeted Prettier clean; adapter/entry units 34/34; focused AUTH-01 5/5; `verify:dist` clean at unchanged SHA-256 `A07FCE9DF042C7244A7B1CCCC32F88573E47433BBDAAECA05B233797454BB1C6`; governance/handoff/diff checks passed; runtime-identity diff scan clean; and branch/upstream parity was 0/0 before checkpoint. TypeScript source lint is not configured; standalone `tsc --noEmit` is unavailable; Vite build passed.

## Read-only design evidence

- Design file: `hXJElH4p72KfgAaoUyfNOC`.
- Shell page/frame: `55:6` / `283:152`; drawer `283:153`; desktop `283:245`; compact 1024 `283:926`; mobile `283:1366`.
- Profile page/frame: `274:4` / `279:2`; light `279:3`; dark `279:626`; loading `279:1249`; mobile `279:1565`.
- Make file: `rP9W9MQlZkyQrUx38TVsFS`, frozen Version 44 with zero pending edits, as recorded in F2.
- Root had already completed exact Design context/screenshots for the main desktop/mobile/light nodes before implementation. This writer read only the missing directly material drawer, compact, dark/loading/mobile nodes. A later narrow connector reread returned reauthentication-required; it was not retried and did not alter the implementation authority, provider state, or recorded F2 baseline.
- No Figma or Make writes occurred.

## Implemented behavior

- Authorized authenticated routes mount `AuthenticatedShell`; the old FI-04 authorized/unavailable gateway is absent.
- Navigation/sidebar/drawer/dock are filtered only by the server-projected `session.capabilities`; no role-string privilege inference was added.
- Profile is an actual strict GET-only `/api/me/profile` surface with loading, unavailable values, error/retry, light/dark/mobile layout, avatar fallback, account/access summary, and no fabricated activity or mutation path.
- FI-05+ internal routes remain truthful placeholders inside the shell.
- Generic staff-home resolution excludes personal-only Profile, so real server projection with zero workspace capabilities remains denied while an authenticated direct Profile route remains available.
- Authenticated mobile drawer now focuses on open, traps Tab/Shift+Tab, closes on Escape, locks body scroll, and restores the opener. Public drawer shares the focused repair without routing change.
- Responsive shell matches current exact evidence: 76px compact rail at 1024; 272px full rail at 1440; governed USC/DOL full identity and DOL compact identity; truthfully labelled maroon environment strip; cream light command band; compact desktop search/theme; filled light Navigate affordance; 390 compact shell identity and 320 crowding fallback.

## Changed paths

- Routing and profile: `src/frontend/app/AppRouteRenderer.tsx`, `src/frontend/app/entryIntent.ts`, `src/frontend/app/profile/ProfileRoute.tsx`, `src/frontend/integration/backend.ts`.
- Shell/focus: `src/frontend/app/hooks/useDialogFocusTrap.ts`, `src/frontend/app/shell/AuthMobileDrawer.tsx`, `AuthShellSidebar.tsx`, `AuthShellTopbar.tsx`, `AuthenticatedShell.tsx`, `SidebarNavItem.tsx`, `navConfig.tsx`, plus the direct public focus repair in `src/frontend/app/public/PublicMobileDrawer.tsx`.
- Tests: `tests/unit/frontend-backend-adapter.test.js`, `tests/unit/frontend-entry-intent.test.js`, `tests/e2e/r3-a1-a2-routing.spec.js`, and directly coupled legacy assertions in `tests/e2e/frontend-cutover.spec.js`.
- Deterministic generated artifacts: `dist/index.html` and `HAU-USC_Logistics-Frontend-Shareable.html`.
- Continuity: `.codex/CURRENT.md`, `.codex/CURRENT_TASK.md`, `.codex/CURRENT_HANDOFF.md`, this receipt, and `docs/WORK_CONTINUATION.md`.

## Verification

- Root observed the mandatory initial source-save HMR gate and each subsequent material save in the existing healthy `http://127.0.0.1:4173/` preview. No restart was performed; no Vite overlay/module failure was observed.
- `npm.cmd test -- tests/unit/frontend-backend-adapter.test.js tests/unit/frontend-entry-intent.test.js` — 34 passed.
- `npm.cmd run test:e2e:frontend -- tests/e2e/r3-a1-a2-routing.spec.js` — 97 passed, 3 intended mobile-only skips.
- `npm.cmd run test:e2e:frontend -- tests/e2e/r3-a1-a2-routing.spec.js --grep "AUTH-01 generic staff sign-in sends a DOL"` — 5 passed after the final full-rail crest size adjustment.
- Focused legacy FVR cutover assertions were updated and passed 5/5 per affected run; isolated LEND-03 at 768 passed 1/1.
- `npm.cmd run build` passed; `npm.cmd run verify:dist` passed. Both generated artifacts are identical at SHA-256 `A07FCE9DF042C7244A7B1CCCC32F88573E47433BBDAAECA05B233797454BB1C6`.
- Safe-mock current visual captures outside Git: `C:/Users/adria/AppData/Local/Temp/fi04-visual-20260824/1440-shell-overview.png`, `1440-profile-light.png`, `1440-profile-dark.png`, `1024-shell-overview.png`, `390-shell-mobile-drawer.png`, `390-profile.png`, and `320-shell-overview.png`. All were within viewport; console warning/error count was zero.
- Standalone TypeScript `tsc --noEmit` was unavailable in this workspace; Vite build completed successfully.

## Safety and handoff

No backend/auth/capability/data semantic change, PATCH profile, business-data write, Production/Playground/provider write, deployment, migration, D1/R2 change, Figma write, commit, or push occurred. The existing untracked `.ai-bridge/` remains untouched. Browser-generated `.playwright-cli/` was removed after verification; screenshots remain outside the repository. Sol now owns the read-only complete-diff review.
