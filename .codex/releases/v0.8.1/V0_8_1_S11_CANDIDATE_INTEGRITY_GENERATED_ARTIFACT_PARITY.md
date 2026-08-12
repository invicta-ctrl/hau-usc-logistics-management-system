# V0.8.1 S11 Candidate Integrity and Generated-Artifact Parity

- **Status:** `V81-S11_BOUNDARY_ACCEPTED_UNCOMMITTED_READY_FOR_GOVERNANCE_COMMIT`
- **State:** `BOUNDARY_ACCEPTED_UNCOMMITTED_READY_FOR_GOVERNANCE_COMMIT`
- **Objective:** Candidate integrity and generated-artifact parity complete.
- **Canonical branch:** `release/v0.8.1-final-stabilization`
- **S11 baseline commit:** `650962f55061d38dce6ddfdaef057b71eb97d114`
- **S11 baseline tree:** `ed44638ceb764f7fb64db6ccf137273028f1fb1a`
- **S10 closeout parent:** `d94b25e485ea4bd317b82ff9cef0d846369a078c`
- **Baseline state:** local, upstream, and live remote are equal with divergence `0/0`; canonical tracked and staged counts are `0/0`; preserved46 and capture remain verified.
- **Recorded at:** `2026-08-12T08:13:26.2959755+08:00`
- **Sol S11 boundary acceptance:** `PASS`
- **Fresh Luna S11 boundary review:** `PASS_NO_P0_P1_P2_P3`
- **Boundary review timestamp:** `2026-08-12T08:28:23.8195422+08:00`
- **Review state:** accepted and uncommitted, ready for the exact governance commit after one final fresh incremental Luna audit.

## Exact governance boundary

This boundary advances only from durable S10 closeout into S11 candidate-integrity and generated-artifact parity. Its current write scope is exactly:

- `.codex/CURRENT.md`
- `.codex/CURRENT_TASK.md`
- `.codex/CURRENT_HANDOFF.md`
- `.codex/releases/v0.8.1/V0_8_1_S11_CANDIDATE_INTEGRITY_GENERATED_ARTIFACT_PARITY.md`

No build, npm command, clone update, artifact, source, test, script, workflow, dependency, package-lock, schema, provider, private-configuration, live-data, deployment, migration, Playground, Production, ref, or S12+ action is authorized while this packet remains uncommitted or pending review.

## Post-persistence evidence checkout

Only after this exact four-path packet passes fresh Luna review, receives Sol acceptance, is committed and normally pushed, and reaches local/upstream/live-remote parity may the existing independent clean branch-tracking evidence clone advance.

The clone currently remains clean at `d94b25e485ea4bd317b82ff9cef0d846369a078c` / `b1a51666625b6881db15e00a1e6020c4d162ddf4` on `release/v0.8.1-final-stabilization`, with its existing dependencies present. Fast-forward that clone only to the pushed S11 boundary commit. Do not delete, reclone, detach, create a linked worktree, reinstall dependencies, or reuse a dirty checkout. Before generation, prove the clone branch, `HEAD`, tree, upstream, and live remote equal the pushed boundary identity and that tracked, staged, and untracked counts are `0/0/0`.

## Exact generated-artifact set

The only files that the accepted V5 build may rewrite are:

- `dist/_headers`
- `dist/index.html`
- `HAU-USC_Logistics-Prototype-Shareable.html`

`npm.cmd run build` invokes the preview-mode Vite single-file build once and then `scripts/create-v5-shareable.mjs` once. Vite empties and recreates `dist`, whose exact accepted file set is `_headers` and `index.html`; the shareable generator must copy `dist/index.html` byte-for-byte to the root shareable. `dist/_headers` must remain byte-identical to `src/public/_headers` and is expected to have no Git delta.

The expected tracked result is `NO_OP`. If Git reports any delta, including within the three allowed artifact paths, stop immediately after capturing safe before/after SHA-256 values, byte counts, and the exact diff scope. Do not hand-edit, normalize, stage, commit, rerun, or try a variant until fresh review explicitly accepts the reproduced delta. If the build is a no-op and every parity check passes, S11 proceeds to evidence-only closeout.

Do not run the legacy artifact pipeline. In particular, do not regenerate the guided demo, seven module shareables, Apps Script UI/bundles, legacy standalone outputs, or any generated file outside the three-path set.

## One-pass generation and parity commands

After the persisted boundary and clean-clone identity checks, run exactly once:

```powershell
npm.cmd run build
npm.cmd run verify:dist
npx.cmd --no-install vitest run tests/unit/v5-dist-verifier.test.js
```

The accepted `verify:dist` implementation creates one fresh preview build and one fresh Production build under a disposable OS-temporary directory, compares the tracked `dist` file set and bytes with the fresh preview build, checks the root shareable against `dist/index.html`, validates required V5 markers and classic inline-script syntax, rejects external runtime assets and module scripts, and proves that the fresh Production artifact exposes no effective Playground capability marker. Its temporary directory must be removed by the verifier. These internal verifier builds are required parity probes, not retries or alternate operational builds.

Run `node --check`, ESLint, and the focused unit test only across `vite.config.js`, `scripts/v5-application-plugin.mjs`, `scripts/create-v5-shareable.mjs`, `scripts/verify-v5-dist.mjs`, `scripts/inline-script-elements.mjs`, and `tests/unit/v5-dist-verifier.test.js`. Run `git diff --check`, exact artifact-scope checks, byte/hash comparison, and the repository governance gates. Do not enter the S12 full stabilization suite.

## Disposable candidate manifest and binding

After build and parity checks pass without a tracked delta, create exactly one new candidate manifest at a never-before-existing ignored `.release/` path named for the pushed S11 boundary commit:

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
- Source, tests, scripts, workflow, Playground files, dependencies, and `package-lock.json` remain unchanged.
- The ignored manifest is the only allowed new disposable path and is never staged or committed.
- No provider or private-configuration read, live-data access, deployment, migration, environment mutation, release upload, recovery-pointer change, ref mutation, S12 verification, or later gate is authorized.

## Stop conditions

Stop on any of the following:

- canonical or evidence-clone branch, `HEAD`, tree, upstream, live-remote, cleanliness, preservation, capture, lock, or writer drift;
- missing dependencies or a perceived need to install, update, or repair them;
- an unexpected `dist` file, missing `_headers` or `index.html`, or any tracked/untracked output outside the exact allowed set and ignored manifest;
- any Git-visible artifact delta, even within the allowed three-path set;
- shareable/dist byte or hash mismatch, fresh-preview file/byte mismatch, required-marker failure, invalid classic inline script, external runtime dependency, module script, or Production Playground exposure;
- package, branch, `HEAD`, tree, Worker-source, Google-mapping, migration, artifact, or manifest binding mismatch;
- a pre-existing manifest target, failed exclusive create, retry, alternate output, or attempt to stage the ignored manifest;
- any source, test, script, workflow, Playground, package-lock, dependency, provider, private-configuration, live-data, deployment, migration, ref, S12+, or unapproved-path action.

## Current boundary and exact next action

This record is `BOUNDARY_ACCEPTED_UNCOMMITTED_READY_FOR_GOVERNANCE_COMMIT`. S10 closeout is durable at `650962f55061d38dce6ddfdaef057b71eb97d114` / `ed44638ceb764f7fb64db6ccf137273028f1fb1a`, parent `d94b25e485ea4bd317b82ff9cef0d846369a078c`. No build, npm command, clone update, artifact/source/test/package-lock/workflow/Playground change, provider/private-config/live-data access, deployment, migration, stage, commit, push, fetch, ref, or S12+ action has occurred during S11 boundary materialization or acceptance.

**NEXT_EXACT_ACTION:** Run one final fresh read-only Luna audit of the exact four accepted S11 boundary governance paths; only after that audit remains `PASS`, stage and commit exactly `.codex/CURRENT.md`, `.codex/CURRENT_TASK.md`, `.codex/CURRENT_HANDOFF.md`, and `.codex/releases/v0.8.1/V0_8_1_S11_CANDIDATE_INTEGRITY_GENERATED_ARTIFACT_PARITY.md`, normally push, verify local/upstream/live-remote parity and preserved46, then fast-forward the existing clean evidence clone to the pushed S11 boundary commit and run the accepted one-pass S11 build/parity evidence; no build, npm, clone update, artifact/source/test/package-lock/workflow/playground/provider/private-config/live-data/deployment/migration/ref/S12+ action before boundary push parity.
