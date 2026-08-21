# Isolated Staging Playground, Git Governance, and Production-Parity Amendment

Status: ACCEPTED - ACTIVE
Owner: Earl
Accepted: 2026-08-09, Asia/Manila
Required model: CODEX
Branch: `release/v0.8.1-isolated-staging-playground`
Starting main SHA: `df3fdb96e62ab396c63e3300b58fb70c6ab960a5`
Released production baseline: `v0.8.0` at `3059098ff2a2935fec59df52748ccae420aadba7`
Schema: 30
Latest migration: `0030_production_access_and_operations.sql`
New migration: none authorized

## Objective

Convert the permanent isolated staging environment into the Isolated Staging Playground, establish one-way production-derived clean baselines and resettable working state for D1 and R2, and make the post-v0.8.0 Git/release model durable repository governance.

The playground is a deployment environment, never a Git branch. This unit ends after playground/governance verification and does not promote production.

## Accepted authority

Earl directly submitted the owner execution prompt on 2026-08-09. It is the accepted amendment for this bounded unit and explicitly authorizes:

- the permanent root `AGENTS.md` branch/playground policy;
- accepted-spec, governance, runbook, continuity, CI, test, and bounded runtime changes required for this unit;
- one temporary release branch and a protected GitHub PR;
- playground-only Worker deployment and environment configuration;
- playground-only D1/R2 creation, import, restore, reset, reconciliation, and recovery evidence;
- private production read-only D1 export and R2 source-copy operations needed to create a policy-compliant playground baseline;
- private staging hostname/access adjustment already inside the isolated staging boundary;
- creation of verified recovery pointers after exact source proof, without rotating them for this non-production task.

This amendment supersedes the v0.7.2.1 prohibition on production-derived staging data only for the controlled, one-way, privacy-reviewed baseline defined here. All other production and privacy protections remain active.

## Explicit exclusions

No production deployment, production migration, production business-data mutation, production R2 mutation other than read-only export/copy source access, automatic production promotion, Google write, provider/email send, M1/M2 work, frontend baseline integration, unrelated cleanup, force push, unknown branch deletion, or permanent staging/playground/production/develop branch is authorized.

## Permanent Git model

Retain only these permanent policy pointers: `main`, `backup/last-known-good`, `regression/r1`, `regression/r2`, and `regression/r3`. At most one production-bound temporary `release/`, `fix/`, or true urgent `hotfix/` branch may be active unless Earl explicitly authorizes otherwise.

Every production-bound change after v0.8.0 follows the exact candidate -> playground -> automated acceptance -> Earl manual test -> Earl exact-candidate GO -> protected accepted main -> production -> smoke/reconciliation -> recovery-pointer rotation -> playground rebaseline -> temporary-branch deletion path. Code changes invalidate prior manual approval.

Protected merge SHA differences require tree/application-artifact equivalence proof. Never test one tree and deploy another.

## Git branch disposition at adoption

- `main`: retain; current synchronized documentation-closeout lineage.
- prior v0.8.0 release branch: merged, zero unique commits, no worktree/open PR; eligible only for later explicit controlled deletion.
- frontend design branch/worktree: dirty, unique, ahead of its remote, and out of scope; preserve without mutation.
- recovery pointer sources proposed for proof: v0.7.2, v0.7.1, v0.7.0, and the preserved canonical pre-v0.7.0 checkpoint.

No branch deletion occurs merely because its name is outside the target topology.

## Data model and one-way rule

The system distinguishes:

1. production truth: live production D1 and R2;
2. playground clean baseline: a verified point-in-time, production-derived, privacy-reviewed snapshot;
3. playground working state: isolated mutable D1/R2 used for automated and manual testing.

Production may flow one way into the clean baseline and then into working state. Playground data never flows to production. Working divergence after testing is expected and is tracked separately from baseline parity.

## D1 contract

Production and playground use different D1 databases. The playground Worker can never bind production D1. A baseline refresh performs production read-only preflight, fresh export, checksum metadata, privacy transformation when required, isolated playground import, export-file integrity and foreign-key checks, schema/migration verification, reconciliation, and a playground recovery point/bookmark where supported.

Reset proves the target is playground using server-owned bindings/safe labels, enters maintenance state, preserves a reversible playground recovery point, restores the current clean baseline, verifies integrity/FK/schema/reconciliation, and exits maintenance. Browser input cannot select a database identifier.

D1 Time Travel may restore the playground to its own verified bookmark. It is not a production-to-playground clone mechanism.

## R2 contract

Production mutable buckets, private sealed playground baseline buckets/prefixes, and playground working buckets are distinct. Normal playground runtime writes only to working bindings. Baseline resources are not writable through ordinary application paths.

Baseline refresh records a deterministic safe manifest, copies only approved objects, verifies count/size/hash-or-ETag/metadata/content type as applicable, records redactions/omissions, and seals the baseline. Reset removes playground-only working objects, restores missing/changed baseline objects, and verifies the manifest. No delete/reconcile operation may target production R2.

## Privacy and parity exceptions

Classify PII, borrower evidence, roster/account data, private uploads, credentials/secrets, and restricted institutional records before copying. Credentials, password material, sessions, reset/verification tokens, secrets, and provider credentials are never copied.

Until private-playground access and retention are proven at least as protective as production, sanitize or omit restricted D1 fields while preserving schema, relationships, record shape, workflow state, representative volume, and referential integrity. Exclude private evidence objects from R2 and copy approved public brand assets only. Record every intentional difference in a private `PARITY_EXCEPTIONS` manifest and report parity as `EXCEPTIONS`, never byte-identical.

## Playground status, reset, refresh, and session state

Expose a private playground-only panel with safe candidate, production, clean-baseline, schema, D1/R2 parity, working-state, and last-reset labels. It must reveal no private IDs, real bucket/database names, bookmarks, PII, or secrets.

`Reset Workspace` requires owner/operator capability and the exact confirmation `RESET PLAYGROUND`; it restores working D1/R2 to the current clean baseline without changing Git, production, code promotion, or the baseline.

`Refresh Baseline From Production` is a separate stronger action. It requires owner/operator privilege, no active valuable test session or explicit discard confirmation, a fresh production read-only preflight, preservation of the current baseline until replacement verifies, D1/R2 reconciliation, and rollback on failure.

Track `IDLE`, `ACTIVE`, `DIRTY`, `RESETTING`, `REFRESHING_BASELINE`, and `ERROR`. Automatic refresh never destroys an active/dirty manual test session.

Retain the playground-only Module Index/Switcher behind server-validated playground identity and selected-persona capability checks, including a `Test Real Login Flow` path. It never renders or activates in production.

## CI and candidate identity

Record candidate commit SHA, tree SHA, build-input identity, application-artifact/manifest hash, and playground deployment identity. Candidate CI freezes exact identity and deploys to playground acceptance, then stops at `WAIT FOR EARL`. No candidate-success path may trigger production.

Production workflows require an independently accepted owner-authorized task/runbook and Earl's explicit GO for the exact tested candidate.

## Rollback and preservation

Before playground conversion, preserve the current staging Worker deployment/version, D1 recovery capability/export, R2 safe manifest or metadata recovery boundary, environment-configuration fingerprints, and branch/CI state. Preserve production recovery readiness.

If conversion fails, restore the previous staging deployment/configuration and its isolated D1/R2 resources. Rollback never rebinds staging to production.

## Required negative tests

Deterministically prove that reset cannot select production D1, R2 cleanup cannot target production, module-switcher/tester shortcuts cannot activate in production, browser environment spoofing cannot change server bindings, ordinary candidate CI cannot trigger production, and deployment logic requires no staging/playground Git branch.

## Acceptance and evidence

Completion requires:

- current v0.8.0 Git, tag/release, runtime, schema 30/0030, Worker/D1/R2 separation, and recovery state reverified;
- root governance and lower-level runbooks/tests green with no contradictory branch rule;
- recovery-pointer source proof and deterministic rotation dry-run proof, without release-time rotation;
- exact candidate automatically deployed to playground and acceptance green while production promotion remains impossible;
- production-derived D1 and R2 baselines created with safe parity/exceptions manifests;
- playground D1 and a safe playground R2 object deliberately mutated, then reset successfully;
- reset/refresh/session guards and module-switcher/real-login path verified;
- safe production D1/R2 fingerprints before and after unchanged;
- focused tests, canonical repository gate, workflow validation, governance/handoff checks, complete logical diff, and zero unresolved P0/P1;
- no production deployment/business mutation, Google write, provider/email send, M1/M2, or frontend integration.

## Stop conditions

Stop on wrong/unverified environment, production crossover, unknown dirty target, competing writer, unpreserved unique branch/worktree, missing rollback evidence, privacy/access uncertainty that prevents safe sanitization, failed export/restore integrity or FK proof, target/binding drift, unauthorized migration, exact-identity failure, automatic production path, or unresolved P0/P1. Two failed targeted repair rounds at the same blocker require a preserved STOPPED handoff.
