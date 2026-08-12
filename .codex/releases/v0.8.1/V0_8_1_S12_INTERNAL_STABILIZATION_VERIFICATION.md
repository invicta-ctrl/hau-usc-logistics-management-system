# V0.8.1 S12 Internal Stabilization Verification

- **Status:** `V81-S12_REPAIR_SCOPE_EXPANSION_AMENDMENT_ACCEPTED_UNCOMMITTED_READY_FOR_GOVERNANCE_COMMIT`
- **State:** `REPAIR_SCOPE_EXPANSION_AMENDMENT_ACCEPTED_UNCOMMITTED_READY_FOR_GOVERNANCE_COMMIT`
- **Objective:** Internal stabilization verification complete.
- **Canonical branch:** `release/v0.8.1-final-stabilization`
- **Boundary baseline commit:** `7e572e9347033b8d59ed4491ef0d6477f01b7115`
- **Boundary baseline tree:** `835f9679b6119a3b51c3eabd759a98d0e4a9acba`
- **Durable S12 boundary commit:** `aa083567f1fd12600eb107c213d8ffa0d50060bb`
- **Durable S12 boundary tree:** `4738feffb676bbba36f36e936ab684722d00baf9`
- **Durable recovery-amendment commit:** `4ded0bc2ed34211d5338d91cc235c6127a628222`
- **Durable recovery-amendment tree:** `e26e7d44b5454b3fc2025b4647d232abf274cf56`
- **Durable legacy-browser-gate amendment commit:** `1a93bb01acc5a732b3f9180be93d1d04d8001114`
- **Durable legacy-browser-gate amendment tree:** `705e4129019aa15533ff375db42792b8dabb0b85`
- **Current canonical identity:** commit `947c15d26df9ff37ee0e3b40721c59712d4daddd`, tree `38f9390168282425be6fde444bb317912e86ef78`; local, upstream, and remote-tracking parity pass with divergence `0/0`; canonical tracked and staged counts were `0/0` before this exact-four amendment; preserved46 and capture remain verified.
- **Recorded at:** `2026-08-12T09:53:53.1092205+08:00`
- **Writer lock:** `HELD` by `TERRA_MAX:/root/integration_terra_accelerated`
- **Sol S12 boundary acceptance:** `PASS`
- **Fresh Luna boundary review:** `PASS_NO_P0_P1_P2_P3`
- **Boundary review timestamp:** `2026-08-12T10:50:09.4956401+08:00`
- **Recovery amendment recorded at:** `2026-08-12T11:20:18.2115164+08:00`
- **Sol recovery-amendment acceptance:** `PASS`
- **Fresh Luna recovery-amendment review:** `PASS_NO_P0_P1_P2_P3`
- **Recovery-amendment review timestamp:** `2026-08-12T11:40:44.7620174+08:00`
- **Legacy-browser-gate amendment recorded at:** `2026-08-12T12:34:46.8942158+08:00`
- **Sol legacy-browser-gate amendment acceptance:** `PASS`
- **Fresh Luna legacy-browser-gate amendment review:** `PASS_NO_P0_P1_P2_P3`
- **Legacy-browser-gate amendment review timestamp:** `2026-08-12T12:54:50.6274076+08:00`
- **Legacy-browser-gate amendment validation:** `HANDOFF_VERIFY=PASS; CHECK_GOVERNANCE=PASS; GIT_DIFF_CHECK=PASS; MARKDOWN_PRETTIER_4=PASS; STRUCTURAL_PRIVACY=PASS; DUPLICATE_KEYS=0; COMMON_FIELDS=0; NEXT_EQUAL=PASS; COHERENCE=PASS; SCOPE=EXACT_FOUR_PATH; STAGED=0; PRESERVED46=PASS`
- **Cloudflare-local P1 repair amendment recorded at:** `2026-08-12T13:34:32.9482317+08:00`
- **Open product P0/P1 at prior repair acceptance:** `0/1`
- **Sol Cloudflare-local P1 repair amendment acceptance:** `PASS`
- **Fresh Luna Lane P plan review:** `PASS_NO_P0_P1_P2_P3`
- **Fresh Luna Lane A plan review:** `PASS`
- **Cloudflare-local P1 repair amendment review timestamp:** `2026-08-12T14:01:17.6057479+08:00`
- **Cloudflare-local P1 repair amendment validation:** `HANDOFF_VERIFY=PASS; CHECK_GOVERNANCE=PASS; GIT_DIFF_CHECK=PASS; MARKDOWN_PRETTIER_4=PASS; STRUCTURAL_PRIVACY=PASS; DUPLICATE_KEYS=0; COMMON_FIELDS=0; NEXT_EQUAL=PASS; COHERENCE=PASS; SCOPE=EXACT_FOUR_PATH; STAGED=0; PRESERVED46=PASS`
- **Repair-scope expansion amendment recorded at:** `2026-08-12T15:49:00.2794723+08:00`
- **Open product P0/P1:** `0/4`
- **Fresh expanded Lane P plan review:** `PASS_NO_P0_P1_P2_P3`
- **Fresh expanded Lane A plan review:** `PASS_NO_P0_P1_P2_P3`
- **Fresh Lane G plan review:** `PASS_NO_P0_P1_P2_P3`
- **Sol repair-scope expansion acceptance:** `PASS`
- **Repair-scope expansion review timestamp:** `2026-08-12T16:20:43.8633637+08:00`
- **Repair-scope expansion amendment validation:** `HANDOFF_VERIFY=PASS; CHECK_GOVERNANCE=PASS; GIT_DIFF_CHECK=PASS; MARKDOWN_PRETTIER_4=PASS; STRUCTURAL_PRIVACY=PASS; DUPLICATE_KEYS=0; COMMON_FIELDS=0; NEXT_EQUAL=PASS; COHERENCE=PASS; SCOPE=EXACT_FOUR_PATH; STAGED=0; PRESERVED46=PASS`

## Durable S11 handoff

S11 is durably closed by governance commit `7e572e9347033b8d59ed4491ef0d6477f01b7115`, tree `835f9679b6119a3b51c3eabd759a98d0e4a9acba`, parent `ecb4bfd2c16a503d00abe517624ca2035c460353`. That closeout commit contains exactly the three current records and `.codex/releases/v0.8.1/V0_8_1_S11_CANDIDATE_INTEGRITY_GENERATED_ARTIFACT_PARITY.md`. Local, upstream, and live remote parity, divergence `0/0`, tracked/index cleanliness, preserved46, capture, private-ref, lock, and process checks passed after its normal push.

The accepted S11 artifacts remain the immutable S12 baseline:

- `dist/index.html` and `HAU-USC_Logistics-Prototype-Shareable.html` are byte-identical, `627280` bytes each, SHA-256 `264416024868E94378783FE29E47FE82542E67DB1332AFA46C9A487899018DCB`, LF `826`, CR `0`, BOM `0`, and trailing-whitespace lines `0`.
- `dist/_headers` remains unchanged and byte-identical to `src/public/_headers`, SHA-256 `CB56F0BD684421CFC6C64D68F1CC9C20F65D5B6029F8CF7B939221BE1DA51D92`.
- `package-lock.json`, workflows, Playground files, source, and tests are unchanged after the accepted S11 implementation and closeout.

## Durable S12 boundary, recovery, and first-run evidence

The exact S12 boundary is durably committed and pushed at `aa083567f1fd12600eb107c213d8ffa0d50060bb`, tree `4738feffb676bbba36f36e936ab684722d00baf9`, parent `7e572e9347033b8d59ed4491ef0d6477f01b7115`. Local, upstream, and live remote equal that commit with divergence `0/0`; canonical tracked/index counts are `0/0`; preserved46, capture, private-ref, lock, and Git-process checks passed.

The retained attached branch-tracking clone `D:/Documents/Codex/HAU-USC Logistics/worktrees/v081-s12-internal-verification-aa083567` equals the durable boundary commit and tree. Its one allowed dependency installation and first top-level gate produced this exact evidence:

- `npm.cmd ci` ran once and passed, installing `169` packages. The `package-lock.json` Git blob remained `96c7ae23c4486079ecf10675201048dd385470a7`; the diagnostic reported `8` pre-existing high advisories, and no audit fix or dependency mutation occurred.
- `npm.cmd run check` ran once and failed after `51.61s`: test files `133` passed and `5` failed of `138`; tests `937` passed and `5` failed of `942`. The run stopped at this first top-level failure, so every later S12 top-level gate remains unrun.
- Four Miniflare/D1 tests timed out at `5000ms`: `tests/unit/access-management-repository.test.js` / `rolls back all policy dependents when the credential/update guard is stale`; `tests/unit/auth-reset-atomicity.test.js` / `commits credential change, target-session revocation, and completion audit together`; `tests/unit/identity-roster-d1-repository.test.js` / `atomically applies and reconciles a preview, then restores its append-only snapshot`; and `tests/unit/profile-repository-atomicity.test.js` / `reports a pending account-application username as a collision`.
- `tests/unit/visual-baseline.test.js` / `keeps the protected historical baseline byte-identical` expected canonical-LF SHA-256 `06dc6c4e62ac6db1e873f5f18dd6531dd6a9f91e3a1b1d27e89582eac3f04a84` and received CRLF-checkout SHA-256 `3d5fe083a44523e455eabe843590cfed17872cce5ac49677113ff6f9419787f4`.
- The retained failed clone remains untouched with staged count `0` and exactly two tracked EOL-presentation paths reported by status: `dist/index.html` and `HAU-USC_Logistics-Prototype-Shareable.html`. Their accepted S11 content hash remains unchanged; do not clean, reset, normalize, rebuild, reuse, or advance this clone.

Independent read-only diagnoses of that first `check` run found no product P0 or P1 in those five failures. The visual mismatch is checkout presentation from `core.autocrlf=true`; the protected Git blob is unchanged. The four timeouts are Miniflare contention under Node 26 with Vitest parallelism, while the repository CI standard is Node 22. No timeout increase, source edit, Vitest/config edit, or test relaxation is authorized.

The accepted runner/EOL recovery amendment is durably committed and pushed at `4ded0bc2ed34211d5338d91cc235c6127a628222`, tree `e26e7d44b5454b3fc2025b4647d232abf274cf56`, parent `aa083567f1fd12600eb107c213d8ffa0d50060bb`. Local, upstream, and live remote equal that commit with divergence `0/0`; canonical tracked/index counts are `0/0`; preserved46, capture, private-ref, lock, and Git-process checks passed.

The retained attached recovery clone `D:/Documents/Codex/HAU-USC Logistics/worktrees/v081-s12-recovery-4ded0bc2` equals that commit and tree, has local `core.autocrlf=false`, and remains tracked/index clean. The checksum-verified portable runtime is preserved at `D:/Documents/Codex/HAU-USC Logistics/Private/v081-s12-node-v22.23.2-4ded0bc2`; it reports Node `v22.23.2` and npm `10.9.8`, and its official archive SHA-256 is `1177b4137ba5adaa56354ae40f1080c7450e8ae09cecb47da459d1c52ac99f97`.

The recovery run produced these exact one-pass results:

- `npm.cmd ci` passed once with the committed lock unchanged; `npm.cmd run check` then passed once with `138` test files and `942` tests in `194.43s`.
- V5 functional passed `80` with `64` intentional skips and zero failures across widths `320`, `375`, `390`, `414`, `768`, `1024`, `1280`, `1440`, and `1920`.
- V5 visual passed `5/5` with zero failures across widths `320`, `390`, `768`, `1024`, and `1440`.
- The full `npm.cmd run test:e2e` diagnostic ran exactly once, exited `1` after `262.04s`, and reported `61` passed, `408` skipped, and `131` failed of `600`. The retained sanitized log SHA-256 is `3fe4ceaee6a0aebb793741fafeb01a2f97a1ccbb9c328cd72bc5834d57ffea25`; it must not be rerun.
- Mechanical clustering found `74` unique failing titles in `18` specs: `101` missing legacy `#loading` assertions across `14` specs; `17` retired `AUTHORITATIVE_VISUAL` assembly assertions, comprising `16` Apps Script packaging cases plus `1` lending assembly case; and `13` residual legacy pathname, DOM, content, or geometry assumptions. Project failure counts were `7`, `70`, `7`, `7`, `33`, and `7` at Chromium widths `320`, `390`, `768`, `1024`, `1366`, and `1440` respectively.
- The root cause of the legacy diagnostic is a deterministic obsolete pre-V5 verification contract. Current `src/index.html` mounts V5 at `#app` and uses hash routes; it intentionally has no legacy `#loading`, old pathname shell, or legacy `AUTHORITATIVE_VISUAL` injection marker. There is no `RESPONSE_VALIDATION` behavior failure and no product P0 or P1 within that legacy failure family; its verification-contract P1 is resolved by the accepted legacy-browser-gate amendment.

Repository policy confirms the mismatch: `npm.cmd run check` excludes the full legacy `test:e2e` matrix; `.github/workflows/ci.yml` requires `check` plus `test:e2e:v5`; `.github/workflows/release-candidate.yml` requires `check`; only this S12 packet mistakenly added the legacy full matrix. The amendment retires `npm.cmd run test:e2e` from the v0.8.1 S12 gate while preserving the package script and specs as historical diagnostics. No skip, test, source, Playwright/config, plugin, or index edit is allowed. Restoring the legacy marker is forbidden because `check:apps-script` rejects it for the V5 Worker candidate; current Apps Script and unit bundle coverage remains required.

The legacy-browser-gate amendment is durably committed and pushed at `1a93bb01acc5a732b3f9180be93d1d04d8001114`, tree `705e4129019aa15533ff375db42792b8dabb0b85`, parent `4ded0bc2ed34211d5338d91cc235c6127a628222`. Local, upstream, and live remote equal that commit with divergence `0/0`; canonical tracked/index counts are `0/0`; preserved46, capture, private-ref, lock, and Git-process checks passed.

## Cloudflare-local one-pass evidence and confirmed product P1

The retained LF recovery clone was fast-forwarded to the durable legacy-browser-gate commit and remained attached, upstream-equal, tracked/index clean, and bound to the preserved portable Node runtime. `npm.cmd run test:e2e:cloudflare:local` then ran exactly once, exited `1` after `635.2s` wrapper time (`10.5m` reported by Playwright), and returned `36` passed and `22` failed of `58`.

Only the console capture, the current `test-results/.last-run.json`, and the current `22` failure directories are authoritative for this run. The retained `playwright-report` belongs to an earlier full legacy E2E run and is explicitly stale and excluded from Cloudflare-local evidence.

The mechanical outcome is exact:

- `tests/cloudflare-e2e/local-worker.spec.js` accounts for `20` failures and `19` passes; `tests/cloudflare-e2e/rv01-request-visibility.spec.js` accounts for `2` failures and `17` passes.
- `18` failures are obsolete `Access ID` locator/timeouts, including one approximately `60s` case; `3` are stale locators; and `1` is a stale pathname expectation.
- No HTTP or API status assertion failed. Fourteen failures occurred before any API assertion; eight occurred only after successful setup/API work. The `36` passes preserve current API, D1, authentication, request, inventory, and revision-related coverage as a baseline.

Static contract tracing and the frozen worker evidence confirm four disjoint product P1 families with product P0 `0`:

- The Worker returns `{ok,correlationId,data:{contract,enabled,scope,token}}`; the backend and legacy runtime adapters pass that envelope through unchanged.
- `src/v5/integration/runtime.js` reads `enabled` and `token` from the envelope root, so it drops every valid poll. Its separate integration revision map is also not seeded even though `state.scopeRevisions` already holds module tokens, and the current loop is a bare `30s` interval.
- Existing `src/app/revision-sync.js` already supports envelope normalization, same-scope validation, monotonic tokens, single-flight refresh, backoff, visibility, online, and resume behavior. It may be imported and reused unchanged; it is not an authorized write path.
- The same V5 routing seam does not reliably map the authenticated default workspace to its authoritative route. The required mapping is Administrator to `admin.overview`, Director to `director.overview`, Food Committee to `food.overview`, Inventory and Pantry to `inventory.overview`, and Materials Committee to `materials.overview`. A mapped route may be selected only when present and allowed in the server-projected `authorizedRoutes`; otherwise choose a deterministic safe authorized fallback, such as the first safe route or `account.profile` when authorized, and never select an unauthorized route.
- At viewport widths at or below `767px`, current CSS hides the sole account trigger and therefore makes the profile/session/sign-out action unreachable. This is a product accessibility and session-boundary failure, not a test-only selector mismatch.
- The Vite HTML generator inserts module text through a JavaScript replacement string, so replacement metapatterns expand rather than remaining byte-exact. The exact adversarial tokens are:

  ```text
  $&
  $`
  $'
  $$
  ```

  The committed artifacts remain clean, so there is no current live impact. The frozen Lane P minified bundle exposed one script pair, four `</body>` occurrences, and one `Unexpected token`, making this release-blocking.

The exact open families are `V5_REVISION_POLL_ENVELOPE_BASELINE_LIFECYCLE`, `V5_GENERATOR_REPLACEMENT_STRING_EXPANSION`, `MOBILE_ACCOUNT_LOGOUT_UNREACHABLE`, and `DEFAULT_WORKSPACE_ROUTE_MISMAPPING`. Thus `OPEN_PRODUCT_P1=4`; they remain separate from the resolved legacy-browser verification-contract P1.

## Frozen partial worker evidence

Lane P remains frozen, uncommitted, and unstaged at base `947c15d26df9ff37ee0e3b40721c59712d4daddd`, tree `38f9390168282425be6fde444bb317912e86ef78`, in `worktrees/v081-s12-lane-p-revision-sync`. Its exact four paths are preserved without revert. The tracked-diff blob is `58edd3038ff8482d6de5d409decdd5285ff7276d`; working blobs are runtime `947083a69adcc9e900ba2a9930700da7c16a37c3`, new unit `2d07ba871162b37b82a78f1ac51c58776ea32ca9`, V5 E2E `6cc0009cdf5cfdb4ef823db42448a4404845bf24`, and RV01 `3eca2e0212e411ddcd5c09bc8f9ddcd6919ba985`. Focused evidence is unit `4/4` and V5 `1/1` green; RV01 is `17/19`, with both failures occurring during generated-page boot. The sanitized result SHA-256 is `e9d8ff76b1caf9ad7b8a034a9b2c5b630ec8eae6c48f2877d1a770f1ac980ac0`; the Main Hub and public trace SHA-256 values are `1c000a4dd0c7aec9f3a523a39835a5aa718e24831ba43d5d96fa66704b42f911` and `fbb0aed3ef5a900d13f317412dc5b922a1aa36416124e1b8846c29875896075e`. The public trace resource `resources/4b13fa...html` contains the count-only generator proof above. Do not rerun RV01 before the combined generator repair.

Lane A remains frozen, uncommitted, and unstaged at the same base and tree in `worktrees/v081-s12-lane-a-current-ui`, with only `tests/cloudflare-e2e/local-worker.spec.js` modified, working blob `3ecd5e455536343a12011962ccca850f0a6fa68d`. Partial V5 ports and static checks are green. Progressive authorized attempts validated the first `17` tests, then stopped at the mobile hidden-account path. Its current diff removed the account-menu assertions under an earlier test-only interpretation; those assertions must be restored after this amendment. The later bounded diagnostic was interrupted and has no result claim. Preserve the entire partial diff without revert.

## Exact disjoint repair lanes accepted pending governance persistence

Fresh independent Lane P, Lane A, and Lane G plan audits all returned `PASS_NO_P0_P1_P2_P3`, and Sol accepted this amendment. Only after the exact four governance paths are committed and normally pushed and parity is proved may the frozen workers resume and the new Lane G worker be created. All workers remain local-only with no upstream or push.

### Lane P - revision polling and near-live request visibility

Lane P may write only:

- `src/v5/integration/runtime.js`
- new focused `tests/unit/v5-revision-sync.test.js`
- `tests/e2e/v5-current-application.spec.js`
- `tests/cloudflare-e2e/rv01-request-visibility.spec.js`

The new focused unit file remains chosen because the runtime timer, envelope, scope, route, and lifecycle contract does not fit cleanly in the existing backend-integration unit. Lane P must reuse `src/app/revision-sync.js` unchanged; seed each module immediately from `state.scopeRevisions[module]` after module load; unwrap and validate the Worker envelope; issue exactly one refetch for a strictly newer token in the same scope; and ignore unchanged, backward, or mismatched scope/token results. Enabled-state, visibility, online, resume, single-flight, backoff, authentication, and privacy behavior must remain intact. It must implement the authoritative default-workspace route mapping above, select a mapped route only when present and allowed in server-projected `authorizedRoutes`, otherwise choose a deterministic safe authorized fallback, and never select an unauthorized route. The focused route matrix in its owned unit or V5 test must include a known workspace whose mapped route is denied. An already-open authenticated V5 `request.queue` view must update after a separate public submission without reload or relogin and must allow an explicit line decision. The two obsolete RV01 route/DOM expectations must be ported to current V5 semantics. Lane P must not edit `local-worker.spec.js`, Worker, API, schema, migration, provider, authorization, privacy, or payload contracts.

### Lane A - current V5 Cloudflare-local UI selectors

Lane A may write only:

- `tests/cloudflare-e2e/local-worker.spec.js`
- `src/v5/styles/v4.css`

It must preserve and finish the partial UI ports and every API/D1 assertion. At widths at or below `767px`, retain a compact visible and focusable account trigger with an accessible name; the label or chevron may be hidden if needed, but the button may not. Preserve reduced-motion behavior and prevent overflow. Restore the `390px` account-menu and Sign out assertion and prove Sign out reaches `public.signin` with subsequent session status `401`. The six-role loop must assert each role's immediate post-login route and authorized workspace before any manual or deep navigation, then prove its authorized deep link and capability surface. Preserve the accepted Administrator health adaptation and do not interact with evidence operations. No skip, timeout, configuration, runtime, backend, role, API, D1, schema, migration, or provider change is allowed.

### Lane G - byte-exact generated-module insertion

Lane G may write only:

- `vite.config.js`
- `tests/unit/v5-dist-verifier.test.js`

Use a callback replacer so arbitrary module text, including all four adversarial replacement tokens above, is inserted byte-exact. Expose a pure helper or equivalent focused fixture. The regression must prove exactly one closing body tag and one script pair, successful VM parsing, byte-exact insertion, and preserved final EOL normalization. Lane G must not generate or commit artifacts.

### Integration-only conditional generated outputs

Only the Integration writer may include `dist/index.html` and `HAU-USC_Logistics-Prototype-Shareable.html`, and only if the combined build regenerates different bytes. They must be byte-identical to each other, contain zero CR bytes, retain all required V5 markers, and be generator-produced rather than hand-edited. `dist/_headers` must remain unchanged. The three worker scopes are pairwise disjoint: Lane P `4`, Lane A `2`, Lane G `2`; with the two conditional generated outputs, the maximum authorized combined scope is `10` paths.

Lane P must run focused syntax, formatting, lint, unit, and V5 coverage, but must not rerun RV01 before the generator is combined. Lane A must run focused syntax, formatting, and lint only; no additional browser run is allowed before combine because route and generator dependencies remain open. Lane G must run syntax, formatting, lint, and the focused dist verifier. Each lane then requires a fresh independent read-only Luna implementation audit. The Integration writer alone combines the accepted commits, verifies pairwise overlap `0` and maximum scope `10`, and owns combined scope and regression audits.

After P, G, and A are combined, run `npm.cmd run check` exactly once under portable Node 22 with `VITEST_MAX_WORKERS=1`, V5 functional once, V5 visual once because `v4.css` changes, and the complete Cloudflare-local `58`-test suite once against a fresh local D1. Never rerun the retired full `test:e2e` matrix or any S09-S11 gate. If all are green, continue the four still-unrun staging/Production build and deploy-artifact verification commands exactly once in their established order.

## Exact governance boundary

Before this accepted repair-scope expansion amendment is durably pushed, the only authorized writes are:

- `.codex/CURRENT.md`
- `.codex/CURRENT_TASK.md`
- `.codex/CURRENT_HANDOFF.md`
- `.codex/releases/v0.8.1/V0_8_1_S12_INTERNAL_STABILIZATION_VERIFICATION.md`

Implementation is authorized only after the accepted exact four governance paths are committed, normally pushed, and verified at local/upstream/live-remote parity with preserved46. Until then, no worker resume or creation, runtime download, npm, test, build, source/test/config edit, provider, private-configuration, live-data, deployment, migration, release-manifest, candidate-freeze, Playground, Production, ref, or S13+ action is authorized. Focused governance verification of these four Markdown paths is authorized.

The current operational baseline is canonical commit `947c15d26df9ff37ee0e3b40721c59712d4daddd`, tree `38f9390168282425be6fde444bb317912e86ef78`; `1a93bb01acc5a732b3f9180be93d1d04d8001114` is its historical parent lineage. The next operational candidate is the exact governance commit created from the current baseline after this amendment is accepted and pushed; its future commit and tree must not be invented here.

## Retained recovery clone

The retained recovery clone is preserved with the ignored Cloudflare-local evidence above. Do not clean, reset, delete, repurpose, or discard it. Preserve the frozen Lane P and Lane A worktrees at `947c15d` without revert, reset, cleanup, test, or resume. Only after durable governance parity may those workers resume and a new isolated Lane G worktree be created; no worker may reuse an evidence clone.

Do not reuse, advance, clean, reset, delete, or normalize `worktrees/v081-s12-internal-verification-aa083567`. That retained failed clone intentionally remains at its recorded first-run state with exactly the two EOL-presentation HTML paths reported by status. Preserve the recovery clone's ignored evidence, `worktrees/v081-s10-evidence-bb652506`, and the isolated S11 implementation worktree; no evidence or worker clone may be repurposed.

## Preserved immutable portable Node 22 tooling

The official portable Node `v22.23.2` Windows x64 ZIP and `SHASUMS256.txt` were acquired once into the immutable private/tooling directory above. The exact archive checksum matched the single official row before safe extraction, and the adjacent runtime reports Node `v22.23.2` plus npm `10.9.8`.

This remains immutable portable tooling only: no installer, registry write, global or persistent `PATH`, persistent configuration, overwrite, re-download, or repository write is allowed. Continue using the absolute adjacent `npm.cmd` or a process-scoped `PATH`, and restore prior `PATH` plus every temporary environment variable in `finally`.

The accepted recovery clone already ran `npm.cmd ci` once with the committed `package-lock.json` blob and bytes unchanged. Do not run it again. Before each remaining command, require no repository test/build Node or `workerd` process; unrelated desktop MCP and CodeGraph Node processes remain non-operational and are not competitors.

## One-pass internal stabilization gate

The exact-candidate `npm.cmd run check`, V5 functional, and V5 visual gates were green before the confirmed runtime repair. The full `npm.cmd run test:e2e` command remains retired from this v0.8.1 S12 gate and must not be rerun. The first Cloudflare-local run is the retained failure evidence above and must not be rerun before Lane P, Lane A, and Lane G are accepted and combined.

After Lane P, Lane A, and Lane G are accepted and combined, every `npm.cmd` below means the absolute `npm.cmd` adjacent to the checksum-verified portable Node executable. Run the invalidated and remaining gates once in this order:

```powershell
npm.cmd run check
npm.cmd run test:e2e:v5
npm.cmd run test:e2e:v5:visual
npm.cmd run test:e2e:cloudflare:local
npm.cmd run build:cloudflare
npm.cmd run verify:deploy:artifact -- staging .wrangler/build/staging
npm.cmd run build:cloudflare:production
npm.cmd run verify:deploy:artifact -- production .wrangler/build/production
```

The V5 visual command is mandatory once immediately after V5 functional because Lane A authorizes `v4.css`.

The completed and remaining browser dispositions are exact:

- V5 functional is complete at `80` pass, `64` intentional skip, zero fail across its nine widths and becomes invalidated when the accepted runtime and route repair is combined; rerun it once then.
- V5 visual is complete and accepted at `5/5`, zero fail across its five widths, but `v4.css` invalidates it; rerun it once after combine.
- Full local E2E is retained only as the completed obsolete-contract diagnostic summarized above, not a release gate.
- Local Cloudflare/D1 E2E has one retained failed diagnostic (`36` pass, `22` fail) and is authorized for exactly one post-combine rerun after Lane P, Lane A, and Lane G are accepted, independently audited, and combined.

The accepted recovery `npm.cmd run check` remains the exact full repository gate: governance, ESLint, deterministic preview build, the complete Vitest suite, Apps Script validation, V5 distribution parity, Cloudflare types, staging build, and Wrangler dry-run. The remaining explicit staging and Production builds must remain isolated under `.wrangler/build/staging` and `.wrangler/build/production`; each must pass `verify:deploy:artifact` for its exact target. None may be deployed.

The S09, S10, and S11 results remain accepted baselines. The pre-repair S12 `check`, V5 functional, and V5 visual results remain truthful historical evidence. Combining the exact P4/A2/G2 paths plus up to two conditional generated outputs invalidates `check`, V5 functional, and V5 visual, so all three require one post-combine rerun. The retired legacy diagnostic neither substitutes for nor invalidates these rules.

## Deterministic integrity, static, security, and privacy evidence

The operational run must also prove, without printing matched content or private values:

- package version is exactly `0.8.1`; the attached branch is `release/v0.8.1-final-stabilization`; local HEAD, upstream, and live remote equal the pushed recovery candidate; divergence is `0/0`;
- local `core.autocrlf` is exactly `false`; the protected visual-baseline LF sentinel and Git blob match; portable Node is exactly `v22.23.2`; the official archive checksum, extracted file set, adjacent npm, process-scoped environment, and no-competing-Node/`workerd` predicates pass;
- the pre-repair `npm.cmd run check` evidence remains bound to the pre-repair candidate, while the post-combine rerun is bound to the exact authorized maximum-ten-path combined scope, unchanged lockfile and workflows, and generator-produced conditional artifacts only;
- default `git diff --check`, `git -c core.whitespace=cr-at-eol diff --check`, `npm.cmd run check:governance`, and the exact candidate status/scope checks pass;
- a deterministic count-only scan of the candidate delta reports no new private-key block, recognized bearer/token format, explicit credential assignment, raw provider identifier, disallowed live email domain, or personal-data fixture; only labels, counts, and paths safe for repository evidence may be recorded;
- `dist/index.html`, the root shareable, and `dist/_headers` retain the exact committed S11 bytes and hashes after all builds; preview and root remain byte-identical with required V5 markers, no external runtime asset, no effective Production Playground capability, CR `0`, BOM `0`, and trailing-whitespace lines `0`;
- worker-source, Google-mapping, and migration hashes are deterministically bound to the exact candidate without creating a release manifest;
- ignored `.wrangler`, Playwright report, test-result, and OS-temporary outputs are either removed safely or retained only in a new classified ignored/private evidence location; no unclassified file remains;
- no Vite, Playwright, Wrangler, Worker, Node test-runner, or Git process remains orphaned after the gate.

An optional `npm.cmd audit --package-lock-only` may run once as a diagnostic only if the accepted S12 execution authorization retains it. It must not run `audit fix`, alter dependencies or the lockfile, or fail the gate solely for an unchanged pre-existing advisory. Any new critical/high advisory affecting the candidate must be reported for Sol review.

Local CodeQL CLI is not part of this boundary, and `.github/workflows/ci.yml` plus `.github/workflows/codeql.yml` do not run merely because this temporary release branch is pushed. Do not mark exact-candidate CI or CodeQL green at S12. Their exact-candidate evidence is deferred to the governed PR/freeze boundary where the existing workflows actually run; S12 records only local static/security/privacy evidence.

## Expected result and evidence handling

After acceptance, expected tracked changes are only Lane P's four paths, Lane A's two paths, Lane G's two paths, and the two Integration-only generated HTML outputs if the combined build changes their bytes. The generated HTML files must remain byte-identical to each other; `dist/_headers`, dependencies, `package-lock.json`, workflows, and Playground files must remain unchanged. Any other tracked delta stops the work; do not hand-edit, normalize, stage, retry, or select an alternate command to erase it. The retained failed clone's two EOL-presentation status paths, recovery-clone evidence, and frozen partial workers must remain preserved.

The official portable Node archive, checksum file, extracted runtime, operational logs, reports, screenshots, traces, local D1 state, Cloudflare build output, and count-only evidence must remain in the existing immutable private/tooling directory or as classified ephemeral/ignored output. They may not enter Git. A later S12 closeout may write only the three current records and this packet after a separate accepted evidence review.

## Stop conditions and exclusions

Stop at the first occurrence of:

- candidate branch, HEAD, tree, upstream, live-remote, divergence, cleanliness, preservation, capture, writer, lock, or process drift;
- preserved portable Node `v22.23.2`, adjacent npm, archive checksum, process-environment restoration, local `core.autocrlf=false`, or canonical-LF sentinel failure;
- any repository test/build Node or `workerd` process; any premature rerun of `npm.cmd ci`, `check`, V5 functional, Cloudflare-local, or the retired full matrix; any V5 visual run without a visual diff; or any `package-lock.json` change; unrelated desktop MCP and CodeGraph Node processes are non-operational and do not trigger this stop;
- any failed remaining local Worker/D1, build, deploy-artifact, governance, static, security, privacy, identity, artifact, cleanup, or orphan-process predicate;
- any unexpected or out-of-scope tracked delta outside the authorized maximum-ten-path combined scope; any hand-edited artifact, dependency, lockfile, workflow, Playground, or unchanged-headers delta;
- any command rerun beyond the exact post-combine authorization, variant, alternate runtime source, timeout increase, package script/spec skip, out-of-lane source/config/test/plugin/index edit, hand edit, normalization, manifest, freeze, provider/private-config/live read, HTTPS staging-auth or Phase 23 test, deployment, migration, Playground, Production, ref mutation, or S13+ action;
- any scope overlap; missing route or generator regression; hidden mobile logout; wrong default route; replacement-token expansion; regression; privacy, authentication, scope, or token failure; D1/API invariant failure; unknown diff; remaining P1; new P0 or additional P1; material privacy/security uncertainty; or inability to preserve sanitized evidence.

Explicitly excluded at S12 are package script/spec skip, timeout changes, edits outside the exact P/A/G and conditional Integration-output paths, any edit to `src/app/revision-sync.js`, Worker/API/schema/migration changes, deployed HTTPS staging auth, Phase 23 acceptance, provider and private-config reads or writes, live D1/R2/Google access, deploy, migration, seed/reset, live restore, R2 write, staging smoke, release-manifest creation, candidate freeze, Playground, Production, merge, tag, release, recovery-pointer, ref, and S13+ actions. No further runtime download, extraction, or dependency installation is authorized.

## Exact next action

NEXT_EXACT_ACTION: Obtain one final fresh read-only Luna incremental packet audit of the accepted S12 repair-scope expansion amendment; after PASS, stage, commit, and normally push exactly .codex/CURRENT.md, .codex/CURRENT_TASK.md, .codex/CURRENT_HANDOFF.md, and .codex/releases/v0.8.1/V0_8_1_S12_INTERNAL_STABILIZATION_VERIFICATION.md and verify local/upstream/live-remote parity plus preserved46; only after durable governance parity resume the preserved Lane P and Lane A workers and create the isolated local-only Lane G worker; no worker resume, new worker, implementation, npm, test, build, provider, private-data, deployment, migration, ref, S13+, retired full test:e2e rerun, or retained-evidence mutation before that authorization.
