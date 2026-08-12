# V0.8.1 S11 Candidate Integrity and Generated-Artifact Parity

- **Status:** `V81-S11_GENERATOR_EOL_AMENDMENT_ACCEPTED_UNCOMMITTED_READY_FOR_GOVERNANCE_COMMIT`
- **State:** `GENERATOR_EOL_AMENDMENT_ACCEPTED_UNCOMMITTED_READY_FOR_GOVERNANCE_COMMIT`
- **Objective:** Candidate integrity and generated-artifact parity complete.
- **Canonical branch:** `release/v0.8.1-final-stabilization`
- **S11 baseline commit:** `650962f55061d38dce6ddfdaef057b71eb97d114`
- **S11 baseline tree:** `ed44638ceb764f7fb64db6ccf137273028f1fb1a`
- **S11 boundary commit:** `fd07baab2791c99528c607f7b8887d52d18e3236`
- **S11 boundary tree:** `70e2ab6e5bdff48aedc12b6b8bbe6be83e5fd7ec`
- **S11 boundary parent:** `650962f55061d38dce6ddfdaef057b71eb97d114`
- **Amendment baseline state:** local, upstream, and live remote equal the S11 boundary commit with divergence `0/0`; canonical tracked and staged counts are `0/0`; preserved46 and capture remain verified.
- **Recorded at:** `2026-08-12T08:13:26.2959755+08:00`
- **Sol S11 boundary acceptance:** `PASS`
- **Fresh Luna S11 boundary review:** `PASS_NO_P0_P1_P2_P3`
- **Boundary review timestamp:** `2026-08-12T08:28:23.8195422+08:00`
- **Generator-EOL amendment recorded at:** `2026-08-12T08:45:19.8447602+08:00`
- **Sol generator-EOL amendment acceptance:** `PASS`
- **Fresh Luna generator-EOL amendment review:** `PASS_NO_P0_P1_P2_P3`
- **Amendment review timestamp:** `2026-08-12T08:56:33.5425803+08:00`
- **Amendment review state:** accepted and uncommitted, ready for the exact governance commit after one final fresh packet audit.

## Exact governance boundary

The S11 boundary is durable at `fd07baab2791c99528c607f7b8887d52d18e3236` / `70e2ab6e5bdff48aedc12b6b8bbe6be83e5fd7ec`. This amendment records the exact generator defect reproduced by the accepted one-pass S11 evidence run and narrows the future repair. Its current write scope is exactly:

- `.codex/CURRENT.md`
- `.codex/CURRENT_TASK.md`
- `.codex/CURRENT_HANDOFF.md`
- `.codex/releases/v0.8.1/V0_8_1_S11_CANDIDATE_INTEGRITY_GENERATED_ARTIFACT_PARITY.md`

No implementation, build, clone update or creation, artifact, source, test, script, workflow, dependency, package-lock, schema, provider, private-configuration, live-data, deployment, migration, Playground, Production, ref, or S12+ action is authorized while this amendment remains uncommitted or pending review. The focused governance commands required to validate these four Markdown paths remain authorized.

## Reproduced generator-EOL defect

The independent branch-tracking evidence clone was fast-forwarded to the pushed S11 boundary and remains at `fd07baab2791c99528c607f7b8887d52d18e3236` / `70e2ab6e5bdff48aedc12b6b8bbe6be83e5fd7ec`. The accepted operational build ran once, `verify:dist` passed once, and the focused `tests/unit/v5-dist-verifier.test.js` run passed one file and two tests. The run then stopped on the first failing diff gate without a retry, normalization, hand edit, stage, commit, manifest, provider action, or external action.

The clone has exactly two unstaged tracked changes and no staged paths:

- `dist/index.html`
- `HAU-USC_Logistics-Prototype-Shareable.html`

`dist/_headers` is unchanged. The two generated HTML files are byte-identical. Each file is `627321` bytes with no BOM and contains `826` LF terminators: `29` have at least one preceding CR and `797` are bare LF. There are no spaces or tabs before any line terminator. The defect is instead two malformed multi-CR seams in each file:

- output line 8, after the title and stylesheet-inlining seam, has a run of 12 CR bytes before LF;
- output line 29, after `</noscript>` and the consumed module-script seam, has a run of 2 CR bytes before LF.

The checked-out `src/v5/index.html` template has 41 ordinary CRLF terminators, no BOM, and no multi-CR sequence under `core.autocrlf=true`. The committed generated artifacts are LF-only. The single-file transformations consume stylesheet and module-script lines but retain and accumulate carriage returns from the Windows checkout. The final post-plugin transformation in `vite.config.js` strips spaces and tabs at line ends but does not canonicalize the transformed HTML EOL bytes before assigning `html.source`. `scripts/create-v5-shareable.mjs` correctly copies the resulting `dist/index.html` bytes and is not an authorized repair path.

Default `git diff --check` exits `2` with 58 true trailing-whitespace diagnostics, 29 per artifact. `git -c core.whitespace=cr-at-eol diff --check` still exits `2` with four diagnostics, exactly lines 8 and 29 in both artifacts. Because the CR-aware check still fails on accumulated CR runs, this is a generator defect rather than ordinary CRLF checkout presentation.

## Post-persistence evidence checkout

Preserve the dirty evidence clone exactly as reproduced. Do not reset, clean, normalize, hand-edit, build in, advance, delete, reclone, or reuse it for implementation.

Only after one final fresh packet audit remains `PASS`, this accepted exact four-path amendment is committed and normally pushed, and local/upstream/live-remote parity is proved may Sol create a new isolated Worker Terra branch/worktree from the pushed amendment commit. That new isolated checkout owns the exact future implementation scope below and must begin clean with an exact branch, `HEAD`, tree, upstream, and writer-lock handshake. No shared or canonical implementation is allowed.

## Exact generated-artifact set

The future Worker Terra implementation write scope is exactly:

- `vite.config.js`
- `tests/unit/v5-dist-verifier.test.js`
- `dist/index.html`
- `HAU-USC_Logistics-Prototype-Shareable.html`

`vite.config.js` must normalize the final post-plugin HTML source EOL representation to canonical LF before assigning or returning `html.source`. Do not hand-edit either generated artifact. The focused regression must prove that generated preview output and the root shareable contain zero CR bytes and no trailing whitespace, remain byte-identical, and preserve the required V5 markers.

The build may regenerate only `dist/index.html` and `HAU-USC_Logistics-Prototype-Shareable.html`; those two artifacts must remain byte-identical. `dist/_headers` may be verified but must remain byte-identical to `src/public/_headers` and have no Git delta. Stop on any fifth path, any change to `dist/_headers`, any CR byte, any trailing whitespace, or any mismatch.

Do not edit `scripts/verify-v5-dist.mjs`, `scripts/create-v5-shareable.mjs`, `src/v5/index.html`, or any other source or test. Do not run the legacy artifact pipeline or regenerate the guided demo, seven module shareables, Apps Script UI/bundles, legacy standalone outputs, or any generated file outside the two writable artifact paths.

## One-pass generation and parity commands

After the amendment is persisted and the new isolated worker checkout passes its clean identity handshake, implement the canonical-LF repair and focused regression, then run exactly once:

```powershell
npm.cmd run build
npm.cmd run verify:dist
npx.cmd --no-install vitest run tests/unit/v5-dist-verifier.test.js
```

The accepted `verify:dist` implementation creates one fresh preview build and one fresh Production build under a disposable OS-temporary directory, compares the tracked `dist` file set and bytes with the fresh preview build, checks the root shareable against `dist/index.html`, validates required V5 markers and classic inline-script syntax, rejects external runtime assets and module scripts, and proves that the fresh Production artifact exposes no effective Playground capability marker. Its temporary directory must be removed by the verifier. These internal verifier builds are required parity probes, not retries or alternate operational builds.

Run `node --check`, Prettier, and ESLint only across the changed JavaScript paths. Run the focused verifier test, `git diff --check`, `git -c core.whitespace=cr-at-eol diff --check`, exact four-path implementation-scope checks, root/dist byte comparison, required-marker checks, and the repository governance gates. Do not rerun the retained dirty clone and do not enter the S12 full stabilization suite.

## Disposable candidate manifest and binding

Candidate-manifest generation is paused during the generator-EOL amendment and its isolated implementation. After the repair is independently reviewed, integrated, durably pushed, and separately authorized for resumed S11 evidence, create exactly one new candidate manifest at a never-before-existing ignored `.release/` path named for that pushed candidate commit:

```powershell
node scripts/create-release-candidate-manifest.mjs .release/s11-candidate-<FULL_BOUNDARY_SHA>.json
```

The generator's exclusive-create guard must succeed on the first attempt. The ignored manifest is disposable evidence, must never be staged or committed, and contains no private configuration or live data. It must bind:

- package version `0.8.1`;
- current branch and exact boundary `HEAD`;
- `dist/index.html` and root-shareable SHA-256 values;
- the deterministic Worker-source SHA-256 derived from sorted domain, server, Worker, and `wrangler.jsonc` inputs;
- the Google-mapping SHA-256;
- the complete sorted migration-name-to-SHA-256 map.

The S11 evidence tuple separately records exact `HEAD^{tree}` because the existing manifest schema binds `HEAD` but does not contain a tree field. Prove the manifest's two HTML hashes equal the independently calculated artifact hashes and prove the manifest candidate object equals a fresh in-memory `productionCandidateEvidence({ requireRepositoryReady: false })` result without changing the manifest.

## Invariants and exclusions

- Package version, branch, `HEAD`, tree, upstream, and live remote remain exact throughout the evidence run.
- `dist/index.html` and the root shareable are byte-identical and have the same nonempty SHA-256 and byte count.
- Tracked `dist` contains exactly `_headers` and `index.html`; fresh preview output has the same file set and bytes.
- Fresh Production output contains no effective Playground capability marker.
- Source beyond `vite.config.js`, tests beyond `tests/unit/v5-dist-verifier.test.js`, all scripts, workflow, Playground files, dependencies, and `package-lock.json` remain unchanged.
- `dist/_headers` remains byte-identical and unchanged.
- Generated preview and root-shareable HTML contain zero CR bytes and no trailing whitespace.
- No ignored manifest is created during the amendment implementation.
- No provider or private-configuration read, live-data access, deployment, migration, environment mutation, release upload, recovery-pointer change, ref mutation, S12 verification, or later gate is authorized.

## Stop conditions

Stop on any of the following:

- canonical, retained evidence-clone, or new worker branch, `HEAD`, tree, upstream, live-remote, cleanliness, preservation, capture, lock, or writer drift;
- missing dependencies or a perceived need to install, update, or repair them;
- an unexpected `dist` file, missing `_headers` or `index.html`, any `dist/_headers` delta, or any tracked/untracked output outside the exact four-path implementation scope;
- any CR byte, trailing whitespace, fifth changed path, hand edit, normalization outside the generator, or script/package-lock/workflow/Playground drift;
- shareable/dist byte or hash mismatch, fresh-preview file/byte mismatch, required-marker failure, invalid classic inline script, external runtime dependency, module script, or Production Playground exposure;
- package, branch, `HEAD`, tree, Worker-source, Google-mapping, migration, artifact, or manifest binding mismatch;
- any retry, alternate output, reuse or mutation of the retained dirty evidence clone, or attempt to create a candidate manifest during the amendment implementation;
- any source beyond `vite.config.js`, test beyond `tests/unit/v5-dist-verifier.test.js`, script, workflow, Playground, package-lock, dependency, provider, private-configuration, live-data, deployment, migration, ref, S12+, or other unapproved-path action.

## Current boundary and exact next action

This record is `GENERATOR_EOL_AMENDMENT_ACCEPTED_UNCOMMITTED_READY_FOR_GOVERNANCE_COMMIT`. The S11 boundary is durable at `fd07baab2791c99528c607f7b8887d52d18e3236` / `70e2ab6e5bdff48aedc12b6b8bbe6be83e5fd7ec`, parent `650962f55061d38dce6ddfdaef057b71eb97d114`, with parity `0/0`. The dirty evidence clone is retained at that boundary with exactly the two generated HTML artifacts changed and staged count zero. Fresh Luna amendment review is `PASS_NO_P0_P1_P2_P3` and Sol amendment acceptance is `PASS`. During this amendment materialization and acceptance, no implementation, build, clone action, artifact/source/test/script/package-lock/workflow/Playground change, provider/private-config/live-data access, deployment, migration, stage, commit, push, fetch, ref, or S12+ action has occurred.

**NEXT_EXACT_ACTION:** Run one final fresh read-only Luna audit of the exact four accepted S11 generator-EOL amendment governance paths; only after that audit remains `PASS`, stage and commit exactly `.codex/CURRENT.md`, `.codex/CURRENT_TASK.md`, `.codex/CURRENT_HANDOFF.md`, and `.codex/releases/v0.8.1/V0_8_1_S11_CANDIDATE_INTEGRITY_GENERATED_ARTIFACT_PARITY.md`, normally push, verify local/upstream/live-remote parity and preserved46, then create a new isolated Worker Terra branch/worktree from the pushed amendment for only `vite.config.js`, `tests/unit/v5-dist-verifier.test.js`, `dist/index.html`, and `HAU-USC_Logistics-Prototype-Shareable.html`; preserve the retained dirty evidence clone, require `dist/_headers` unchanged, and do not implement, build, update a clone, access provider/private/live data, deploy, migrate, mutate refs, or begin S12+ before governance push parity.
