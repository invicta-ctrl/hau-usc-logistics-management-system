# FI-14 — Autonomous Isolated Playground Deployment + Acceptance

STATUS: ACCEPTED__OWNER_AUTHORIZED__EXECUTE
DATE: 2026-08-26
PROGRAM: HAU-USC Logistics FI-04 → FI-17 R1
SLICE: FI-14
TASK-BOUND ADOPTION: Earl FI09-FI17-SOL-COGNEE-2026-08-26 section 16 expressly accepts this faithful bounded extraction and authorizes FI-14 execution by the single canonical Terra writer.

## INTENT

RELEASE_PREPARATION + TESTING + ISOLATED_PLAYGROUND_DEPLOYMENT

## MODE

EXECUTE

## OBJECTIVE

Deploy only the exact FI-13 frozen frontend application to the existing Isolated Staging Playground through the repository's `release-candidate.yml` workflow. Prove candidate, Worker, D1, R2, secret/binding, recipient/provider, Preview Index, and rollback boundaries before deployment; then record bounded Playground acceptance. Production remains untouched.

## TARGET

- The three current-chain records, this packet, the FI-14 receipt after verified acceptance, and only directly coupled release-pipeline evidence.
- `.github/workflows/release-candidate.yml` and its narrow deterministic workflow assertion when required to make the accepted exact-candidate path truthful.
- A new temporary `release/v0.8.3-frontend-design-integration` ref only when it points exactly to the verified refrozen candidate commit.

## AUTHORITATIVE SOURCES

1. Earl FI09-FI17-SOL-COGNEE-2026-08-26 owner attachment, section 16 and section 20 defect-handling authority.
2. TOKEN-OPT-001-A8, `AGENTS.md`, `.agents/PROJECT_POLICY.md`, and the current-chain records.
3. Accepted FI-13 packet/receipt, `.codex/specs/active/isolated-staging-playground-and-git-governance.md`, `docs/ISOLATED_STAGING_PLAYGROUND.md`, and the repository-native candidate workflow/configuration guards.
4. Current GitHub/Cloudflare read-only identity and isolation evidence obtained without exposing private values.

## IN SCOPE

- The smallest correction from the retired Prototype shareable upload path to the current deterministic Frontend shareable path, plus a directly coupled deterministic assertion.
- A new FI-13 exact-source freeze because that tracked workflow configuration change invalidates the prior freeze; reuse previous app/browser/Hallmark/Impeccable evidence only after proving the frontend application artifact remains byte-identical.
- Exact temporary candidate-ref creation/push, isolated workflow dispatch, serial bounded Playground acceptance, and verified FI-14 evidence/closure records.

## INVARIANTS

- The frontend application source, deterministic application artifact, backend, Worker source, API, authentication, authorization, session, schema, migrations, D1/R2 data, provider configuration, Figma, Make, Production, `main`, and `.ai-bridge/` remain untouched unless a verified FI-14 stop condition requires returning to accepted frontend repair.
- Never expose secrets, provider IDs, private hostnames, recipients, database IDs, bucket names, recovery bookmarks, or private payloads.
- Playground uses only its existing isolated Worker, working D1, working R2, disabled provider/email delivery, no schedules, and no Production mutable-resource bindings.
- Candidate branch must be a temporary `release/`, `fix/`, or `hotfix/` branch whose remote tip exactly equals the candidate SHA; no branch name or candidate identity may be spoofed.
- Never deploy Production or hand-edit deployed assets.

## ACCEPTANCE CRITERIA

1. The new frozen candidate commit/tree and deterministic application artifact hash are recorded; the artifact remains byte-identical to FI-13 application evidence.
2. GitHub candidate workflow, Cloudflare authorization, private-environment secret presence, Worker/API identity, D1/R2/provider/binding isolation, Preview Index suppression, and rollback/redeploy target all pass without private-value disclosure.
3. The isolated workflow accepts only the exact temporary branch tip and deploys only to the isolated Playground; Production is untouched.
4. Playground readiness, version/candidate identity, public route smoke, authenticated-module/role-denial/privacy checks, supported isolated reads, responsive browser checks, and console/network sanity are recorded with no unaccepted product defect.
5. No protected preview traffic, Production crossover, migration, data mutation, secret exposure, or out-of-scope source drift occurs.

## VERIFICATION

- Focused release-pipeline/governance/config tests for the workflow repair; `npm run build`, `npm run verify:dist`, continuation/handoff checks, and `git diff --check`.
- Reuse the unchanged FI-13 local responsive, Hallmark, and Impeccable evidence only after proving the application artifact hash remains `B1B1F51E7C5DB3B96F7EB55A9CFE3C6E7F36B9D741807219BB6BEA2FB1B20556`.
- Use only the accepted GitHub `release-candidate.yml` path for the actual isolated deployment; record direct workflow/run and bounded acceptance evidence.

## STOP CONDITIONS

- Missing/ambiguous candidate identity, temporary-ref topology, Cloudflare/GitHub authorization, private manifest/secret presence, rollback/redeploy evidence, Worker/API identity, or D1/R2/provider isolation.
- Any Production resource crossover, credential/private-value exposure, unaccepted migration/data write, frontend application artifact drift, failed exact-candidate check, or actual product defect outside accepted frontend scope.

## OWNER ACCEPTANCE

This packet is accepted by Earl's FI09-FI17-SOL-COGNEE-2026-08-26 authority and Sol's FI-14 route decision. It authorizes only the bounded release-pipeline correction, refreeze, exact isolated Playground deployment/acceptance, and required continuity evidence. It does not authorize Production, `main`, backend/domain behavior, schema/migration, provider configuration, Figma/Make, or `.ai-bridge/` changes.
