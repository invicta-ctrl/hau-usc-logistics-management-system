# v0.7.1 Slice 8 Release-Candidate Handoff

Date: 2026-08-03 (Asia/Manila)

## Accepted repository state

- Branch: `fix/v0.7.1-production-recovery`.
- Starting production-recovery base:
  `9fb1b4e6b4e956419fa65dee55268b10c0a55da6`.
- Slice 8 pipeline/domain implementation:
  `4f753b27db429c21a127df5e38d7afd9aac36e4d`.
- Request-only and opaque-origin runtime repair:
  `3bd7e20f63aa0fb95082bc1d080a335311bc5d83`.
- Integrated Worker/browser contract alignment:
  `5d04009235fca55a6495763ac0c7592f1220ddc0`.
- The final review target is the committed release-candidate closure record
  containing this handoff; record its exact SHA in the delegation ledger.

## Delivered scope

- The static preview workflow is manual, owner-approved, exact-candidate
  checked, binding-free, and limited to mock static assets. It contains no
  Worker entrypoint, D1/R2 binding, application environment, production secret,
  or production deploy command.
- The release-candidate workflow checks out an exact requested SHA, runs the
  complete repository gate, and produces a SHA- and artifact-bound package. It
  has no provider credential or deploy command.
- `logistics.hau-usc.org`, `request.hau-usc.org`, and
  `lending.hau-usc.org` route only to their accepted entry points. Request and
  Lending root routes redirect on the same host while deep links remain valid.
  Unknown hosts, missing/unknown environments, and unconfigured recovery hosts
  fail closed before API or asset dispatch.
- Only an exact private `.workers.dev` `RECOVERY_HOSTNAME` is accepted for
  staging/production recovery. Explicit `DEVELOPMENT` remains unrestricted for
  local workerd tests; that exception has direct Worker-boundary coverage.
- Existing host-scoped `__Host-` cookie behavior is preserved.
- Request-only mode clears internal Inventory, Release, Lending, advanced
  classification, and supplemental surfaces before protected rendering.
- Apps Script/offline startup handles the opaque-origin `history.replaceState`
  `SecurityError` without hiding unrelated errors.
- `.codex/V0_7_1_OWNER_GATED_RELEASE_RUNBOOK.md` defines private environment
  preflight, preview/package use, staging acceptance, production/domain
  activation, monitoring, reconciliation, and rollback. It does not authorize
  or perform them.

## Verification evidence

- `npm run check`: PASS; governance and continuation checks, lint, 88 Vitest
  files / 575 tests, deterministic builds, Apps Script validation, dist parity,
  Cloudflare type generation, and local dry-run gates.
- `npm run test:e2e`: PASS; 130 passed / 326 intentionally skipped / 0 failed
  across 456 configured cases.
- `npm run test:e2e:cloudflare:local`: PASS; 38/38 Worker/D1/browser cases.
- `npx wrangler deploy --dry-run --config cloudflare/wrangler.preview.jsonc
  --outdir .wrangler/preview-final`: PASS; no bindings; no upload.
- Generated standalone: 767,391 bytes; SHA-256
  `8bc8725db88b3840e67edba0d70ea75599b963941f7563520b736eafa0f8ed83`.
- Generated Apps Script package: 639,095 bytes; SHA-256
  `a034c8e6dce937b5686cc1efac75e88c76616691a67123512f750819b149c874`.
- Protected visual baseline files remain unchanged. The untracked `.codegraph/`
  directory remains preserved.

## Review orchestration record

- Routine pipeline audit, workflow evidence repair, test-fixture alignment,
  stale browser assertion mapping, and localized test interaction repairs were
  routed to Luna Max.
- Complex host routing, recovery-host hardening, request-only containment, and
  Apps Script runtime diagnosis were routed to Terra Max. Two Apps Script Terra
  attempts stalled without a usable cause or edit and were interrupted; the
  parent then performed a bounded targeted diagnosis and repair.
- The integrated Worker suite initially exposed stale canonical-route, DTO,
  schema, locator, and mobile test interactions. Terra handled the complex
  classification; Luna handled the two routine residual test repairs. No
  production host behavior was relaxed.
- No additional Sol reviewer was spawned during Slice 8 repair because no Sol
  review was active and no review threshold had been triggered. The one
  reserved fresh Sol reviewer is used only for the complete committed release
  candidate.

## External state and owner gates

- No provider, deployment, migration, domain, Google, GitHub, staging, or
  production write occurred in Slice 8.
- The local branch has no upstream. Push, pull request, CI, merge, tag, and
  release evidence are unrun and owner-gated.
- Private staging/production Wrangler configs, secrets, exact provider
  identifiers, recovery hostname, domain control, staging reconciliation,
  production authorization, production smoke, and live monitoring remain
  unrun and owner-gated.
- Production remains operational on immutable v0.7.0 source
  `dc98d670fdd63f649037616c5a2d51e5c62ca4ae`, schema 29, based on the accepted
  read-only starting audit; Slice 8 did not refresh or mutate that external
  state.

## Rollback and stop conditions

- Before activation, rollback is no-op: retain the existing immutable v0.7.0
  Worker route/version and private schema-29 recovery evidence.
- After a separately authorized activation failure, stop writes, preserve
  append-only evidence, restore the prior Worker route/version, restore prior
  domain routing, and reconcile D1/R2/domain state using the owner-gated
  runbook. Do not delete audit, history, ledger, or recovery evidence.
- Stop on wrong bindings, candidate-SHA mismatch, unavailable rollback proof,
  failed authorization/privacy denial, unresolved P0/P1, material P2 workflow
  or authorization risk, or any unexpected production truth.

## Next action

Run one fresh Sol reviewer against the exact committed complete release
candidate. Do not start a parallel verdict or fast-review agent. A new Sol
re-review is allowed only if the final reviewer confirms a threshold finding
defined by the user-approved orchestration policy.
