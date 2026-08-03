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
- Final-review P2/P3 repair:
  `42f1970efbccd8c275be2cc4bc77246b5a9c97ab`.
- The correction re-review target is the committed repaired closure record
  containing this handoff; record its exact SHA in the delegation ledger.

## Delivered scope

- The static preview workflow is manual, owner-approved, exact-candidate
  checked, binding-free, and limited to mock static assets. It contains no
  Worker entrypoint, D1/R2 binding, application environment, production secret,
  or production deploy command.
- Preview smoke obtains the registered workers.dev account subdomain from the
  authenticated Cloudflare account, combines it only with the fixed preview
  Worker name, redacts deploy URLs, and records only the Worker name and target
  SHA-256. Operator-supplied smoke targets are not accepted.
- The release-candidate workflow checks out an exact requested SHA, runs the
  complete repository gate, and produces a SHA- and artifact-bound package. It
  has no provider credential or deploy command.
- `logistics.hausc.org`, `request.hausc.org`, and
  `lending.hausc.org` route only to their accepted entry points. Request and
  Lending root routes redirect on the same host while deep links remain valid.
  Unknown hosts, missing/unknown environments, and unconfigured recovery hosts
  fail closed before API or asset dispatch.
- Only an exact private `.workers.dev` `RECOVERY_HOSTNAME` is accepted for
  staging/production recovery. Explicit `DEVELOPMENT` remains unrestricted for
  local workerd tests; that exception has direct Worker-boundary coverage.
- Existing host-scoped `__Host-` cookie behavior is preserved.
- A reusable item can reach `CLASSIFIED` only with an actual condition outcome
  (`NEW`, `GOOD`, `FAIR`, `POOR`, or `DAMAGED`) and maintenance outcome
  (`CLEARED` or `MAINTENANCE_REQUIRED`). Pending reusable records may retain
  `NOT_ASSESSED` but remain fail-closed and non-lendable; consumable semantics
  are unchanged.
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
  files / 576 tests, deterministic builds, Apps Script validation, dist parity,
  Cloudflare type generation, and local dry-run gates.
- `npm run test:e2e`: PASS; 130 passed / 326 intentionally skipped / 0 failed
  across 456 configured cases.
- `npm run test:e2e:cloudflare:local`: PASS; 38/38 Worker/D1/browser cases.
- `npx wrangler deploy --dry-run --config cloudflare/wrangler.preview.jsonc
  --outdir .wrangler/preview-final`: PASS; no bindings; no upload.
- Generated standalone: 768,377 bytes; SHA-256
  `7862c7d4ce54fb794db107d86dffcad887901baeb796d77f447b4640bf67d4b5`.
- Generated Apps Script package: 640,081 bytes; SHA-256
  `7f26505754e4eb6b286c3a19cbf9499ee334c3165601a338027fc670edb5707c`.
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

## Final review disposition and repair

- The single final fresh Sol review inspected exact SHA
  `d3d4cc8de84e9b37d151b41b59ff19422d9a7ee1` and returned no P0/P1, two P2s,
  and one P3.
- P2 inventory: reusable items could use `NOT_APPLICABLE` physical outcomes and
  become classified. Terra Max repaired the server, mock parity, individual
  form, bulk form, and atomic regression coverage at `42f1970`.
- P2 preview: an operator-supplied URL could attest a different Worker. Luna
  Max repaired the workflow to derive the subdomain from the authenticated
  Cloudflare account, use the fixed preview Worker, redact deploy output, and
  withhold the complete target URL.
- P3 documentation: corrected `*.hau-usc.org` to the accepted `*.hausc.org`.
- One new fresh Sol correction re-review is required and permitted because the
  confirmed P2 repairs materially changed inventory and preview workflows. No
  separate verdict or fast-review agent is authorized while it is active.

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

Run one fresh Sol correction reviewer against the exact committed repaired
release candidate. Do not start a parallel verdict or fast-review agent. The
additional review is necessary because the confirmed P2 repairs materially
changed inventory and preview workflows.
