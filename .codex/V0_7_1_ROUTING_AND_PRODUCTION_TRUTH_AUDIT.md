# v0.7.1 Routing Preflight and Production Truth Audit

Date: 2026-08-02 (Asia/Manila)

Repository start: `9fb1b4e6b4e956419fa65dee55268b10c0a55da6`

Mode: read-only provider audit; no repository product change; no external write

## Routing preflight

```text
CUSTOM AGENT: sol-advisor route requested/accepted
PARENT ROUTE: requested Sol High; exact runtime identity not exposed
LUNA ROUTE: requested Luna Max; platform accepted; identity not exposed
TERRA ROUTE: requested Terra Max; platform accepted; identity not exposed
FRESH REVIEW: new independent read-only review context available
MAX CONCURRENCY: two delegated child packets
LOCAL TOML ACCESS: available
TOML CLEANUP: complete; backup retained; no unique source configuration removed
ROUTING EVIDENCE LEVEL: 3-4
LIMITATIONS: exact deployed parent/child model and effort are not agent-attestable
PREFLIGHT DECISION: PASS
```

Durable identity label for each route:
`REQUESTED / PLATFORM-ACCEPTED / NOT AGENT-ATTESTABLE`.

All applicable Codex TOML files parsed successfully. A hash-verified backup and
manifest were created outside the repository at
`C:\Users\adria\.codex\backups\v0.7.1-sol-advisor-toml-20260802-194241`.
`sol-advisor.toml` remains the supported active custom-agent definition; older
agent definitions were already archived. No repository file was touched by
this cleanup.

## Repository and GitHub truth

- Repository: `invicta-ctrl/hau-usc-logistics-management-system`.
- Starting branch: `main`; starting HEAD and fetched `origin/main` were exact
  at `9fb1b4e6b4e956419fa65dee55268b10c0a55da6`, ahead/behind `0/0`.
- Active recovery branch:
  `fix/v0.7.1-production-recovery`.
- The untracked `.codegraph/` directory existed before work and is preserved.
- Annotated/published v0.7.0 release target:
  `dc98d670fdd63f649037616c5a2d51e5c62ca4ae`.
- Current `main` differs from the release only through later governance and
  documentation commits; the product tree remains the release product tree.
- Main protection requires strict successful verification/browser-smoke,
  pull-request review, and resolved conversations; force-push and deletion are
  disallowed.
- Repository CI contains verification and browser-smoke jobs. No repository
  workflow currently provides Cloudflare preview upload or owner-gated
  production deployment.
- An unrelated pre-existing draft tooling pull request remains outside this
  recovery scope.

## Cloudflare and live application truth

The current private v0.7.0 production package remains outside Git and binds the
immutable release candidate. Public configuration retains placeholders; no
private provider/resource identifiers were copied into this report.

| Check                       | Production                               | Staging                            | Result                 |
| --------------------------- | ---------------------------------------- | ---------------------------------- | ---------------------- |
| Environment                 | `PRODUCTION`                             | `STAGING`                          | Separated              |
| App version                 | `0.7.0`                                  | `0.7.0`                            | Exact                  |
| Candidate                   | v0.7.0 release SHA                       | v0.7.0 release SHA                 | Exact immutable source |
| Schema                      | 29                                       | verified through accepted baseline | Production healthy     |
| Latest production migration | `0029_reusable_asset_reassignment.sql`   | accepted baseline                  | Exact                  |
| Health/readiness            | HTTP 200 / ready                         | version HTTP 200                   | Pass                   |
| Protected bindings          | D1/static/Brand R2/Evidence R2 available | configured distinctly              | Pass                   |

Private preflight correctly rejects reusing the v0.7.0 package for current
`main`, because its candidate and authorization hashes intentionally bind the
release SHA. A new v0.7.1 private package is required only after the candidate
exists. This is expected fail-closed behavior, not an incident.

No verified fact indicates the production Worker is bound to staging D1 or R2
resources. Staging and production Worker, D1, Brand R2, and Evidence R2 labels
are distinct. No cron trigger or custom route is declared in the private
Wrangler configs inspected. Secret values and private identifiers were not
read into durable evidence.

## URLs and host routing

- `https://logistics.hausc.org/` is active, returns HTTP 200, and reports the
  production v0.7.0 release identity.
- `/login`, `/request`, and `/lending` on that host return HTTP 200.
- The requested `request.hausc.org` and `lending.hausc.org` hosts did not
  resolve during this audit. The apex was not an active application route.
- Current source selects public portals by pathname, not by hostname. Host
  routing and safe unknown-host behavior therefore remain v0.7.1 work.
- Session cookies use the secure `__Host-` form, HttpOnly, SameSite=Lax,
  Path=/, and no Domain attribute. This provides the intended host isolation.
- `workers.dev` remains enabled as a recovery-access path and is not the
  canonical public production URL.

## Confirmed application defects

### P1 — shared browser-service contract is incomplete

Worker routes exist for Access Management policy operations and Staff
Directory/identity-roster operations. `RestService` maps them, but
`HttpApiAdapter` omits the access-policy operations and
`createLegacyRuntimeAdapter` omits both the policy and roster method families.
The runtime extension contains similarly named `??=` services only inside
`installLocalReferenceAdminServices`, which returns immediately outside mock
mode. Those preview services do not mask or cause the production failure. The
active production runtime therefore receives undefined methods directly from
the incomplete adapter surface and fails closed before any unsupported write.

Required repair: make the shared contract explicit across adapters, preserve
mutation tracking/CSRF for writes, preserve the isolated mock-preview services,
add whole-surface parity tests, and provide correlation-based user-safe
failures.

### P1 — dedicated public-domain routing is not implemented

Only the staff domain is active; public subdomains do not resolve and the
Worker has no hostname-based entry routing. DNS/route activation remains an
owner-gated external action after source, cookie, redirect, deep-link, TLS,
and rollback acceptance.

### P2 — public portal navigation is inconsistent

The Request Center exposes Request/Lending links but no complete staff-sign-in
or portal-selection return. The Lending Center exposes Request/Staff links.
Both must implement the accepted consistent, accessible portal-navigation
contract.

### P2 — authentication support correlation is incomplete

The Worker creates an `x-correlation-id`, but the authentication response body
does not retain it and the auth client reads only a body field. Authentication
also uses a narrower response builder than the standard protected API header
set. The repair must retain cookie behavior, add safe correlation parity, and
apply the accepted no-store/nosniff/referrer/permissions controls without
exposing raw errors.

### P1/P2 — operational interaction gaps confirmed in source

- Request Center line quantities permit fractions. Lending item quantities are
  not required client-side, so an emptied field reaches the server as zero.
- Ordinary dirty forms are not guarded during navigation or workspace changes.
- Workspace selection changes route-derived presentation without proving an
  authoritative state refresh and does not provide the scope control's focus
  and live-announcement behavior.
- Staff Directory and Access Management loading/failure surfaces lack complete
  status/alert and retry behavior.
- Canvass renders a blank list for zero/no-match results rather than a truthful
  empty state and recovery action.

These source findings require browser reproduction and focused regression
tests before repair acceptance. Decimal quantities for legitimately measured
units are not classified as defective until the unit contract is reproduced;
countable units remain integer-only.

### P2 — visual/browser evidence limitation

Read-only DOM and route inspection succeeded in the authenticated in-app
browser. Screenshot capture timed out, so this audit does not claim visual
acceptance. Repository Playwright screenshots and later Hallmark before/after
evidence are mandatory before candidate acceptance.

## Classification and release impact

The visible staging wording reported by the owner is not caused by a verified
staging D1/R2 binding. Current login text is production-safe in the rendered
DOM; source contains environment strings for legitimate multi-environment use.
The identity risk is therefore classified as source/bundle/label parity work,
not a live mixed-binding incident, pending exact candidate preview checks.

No production, Cloudflare, GitHub, Google, DNS, migration, deployment, login,
or data mutation occurred during this audit. Production remains operational on
v0.7.0. v0.7.1 production deployment remains owner-gated.
