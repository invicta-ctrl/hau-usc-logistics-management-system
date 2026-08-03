# v0.7.1 Owner-Gated Preview and Release Runbook

Status: SOURCE PREPARED; EXTERNAL ACTIVATION NOT AUTHORIZED

Production baseline: immutable v0.7.0 at
`dc98d670fdd63f649037616c5a2d51e5c62ca4ae`, schema 29

Candidate: bind the exact reviewed v0.7.1 commit SHA at release-candidate
freeze; never substitute a branch name or a later commit

## Safe Cloudflare preview

The `Cloudflare static preview` workflow is manual and checks out the exact
40-character SHA supplied by the operator. It builds the repository's isolated
mock preview, proves the dedicated preview config with Wrangler dry-run, and
deploys only static assets through `cloudflare/wrangler.preview.jsonc`.

The preview config has no Worker entry point, D1 binding, R2 binding, cron,
route, custom domain, application variable, or application secret. The GitHub
environment named `cloudflare-preview` must require owner approval and expose
only a preview-Worker-scoped API token and account label through
`CLOUDFLARE_PREVIEW_API_TOKEN` and `CLOUDFLARE_PREVIEW_ACCOUNT_ID`. Production
credentials or resources must never be copied into that environment.

The preview is a mock-data presentation and interaction surface. It is not
staging, must not be used for authorization or persistence acceptance, and
must not be represented as a production contract implementation.

External status: `UNRUN - OWNER GATE`. No preview deployment was performed by
the source-preparation slice.

## Exact release-candidate package

The `Release candidate package` workflow is manual, checks out an exact SHA,
runs the complete repository gate, creates a bound manifest, and uploads the
generated Cloudflare, shareable, and Apps Script artifacts. It has no provider
credential and no deployment command. The GitHub environment named
`release-candidate` must require owner approval.

Before accepting its artifact:

1. Confirm the workflow SHA equals the final fresh Sol-reviewed candidate.
2. Confirm every required job passed at that SHA.
3. Compare the manifest SHA and artifact hashes with the downloaded files.
4. Retain the immutable artifact and review evidence under the private release
   evidence policy.

External status: `UNRUN - OWNER GATE`. Repository-local manifest generation
and dry runs may be used as source proof, but are not a GitHub acceptance run.

## Staging and production preparation

Private staging and production Wrangler configurations, authorization package,
Google mapping, backup manifest, and secret package remain outside Git. Create
new v0.7.1 packages bound to the exact candidate SHA; the immutable v0.7.0
package is not reusable because its hashes correctly fail closed.

The owner-gated sequence is:

1. Verify the private staging and production resource labels are distinct and
   that both private configs bind the exact reviewed candidate.
2. Run `npm run cloudflare:preflight -- <absolute-staging-config>
   <absolute-production-config>` without printing identifiers.
3. Deploy to staging only after its private authorization gate passes.
4. Reconcile identity, health, readiness, schema, bindings, authorization and
   privacy denials, protected journeys, rollback readiness, and monitoring.
5. Recreate the production authorization package against the final clean
   candidate and current private evidence. Run `npm run production:preflight`
   only inside the approved launch window.
6. Request explicit owner approval for production. Approval for preview,
   staging, DNS, or this runbook is not production approval.

No migration is part of v0.7.1 source preparation. If staging proves that a
migration is required, stop for an accepted amendment and fresh recovery plan.

## Host and domain activation manifest

Source recognizes the following production entry points:

| Host | Entry | Activation state |
| --- | --- | --- |
| `logistics.hausc.org` | canonical staff and portal paths | existing production host; do not repoint before production approval |
| `request.hausc.org` | same-host redirect from `/` to `/request` | DNS, TLS, and Worker custom-domain activation owner-gated |
| `lending.hausc.org` | same-host redirect from `/` to `/lending` | DNS, TLS, and Worker custom-domain activation owner-gated |

Accepted deep paths remain on their original host. Session cookies retain the
`__Host-` form, Secure, HttpOnly, SameSite=Lax, Path=/, and no Domain attribute.
Workers.dev remains a recovery path. Other hosts fail before assets or APIs are
served.

Before domain activation, record the exact Cloudflare zone, Worker version,
custom-domain targets, TLS state, rollback targets, operator, approval
reference, window, and stop authority in a private manifest. After activation,
test `/`, the accepted deep path, login/session behavior, logout/revocation,
cross-host cookie absence, unknown-host denial, and cache-busted release
identity. Do not activate a public domain against staging resources.

## Monitoring and rollback

Monitor cache-busted `/api/version`, `/api/health`, and `/api/readiness`, then
the accepted staff login/session, Request Center, Lending Center, Directory,
Access Management, Canvass, Inventory, evidence, and brand journeys. Confirm
environment `PRODUCTION`, release `0.7.1`, exact candidate SHA, schema 29,
readiness, protected bindings, authorization/privacy denials, and structured
request failure rates without copying private log content into Git.

Rollback triggers include identity drift, a staging resource in production,
contract-method failure, broken login or session revocation, Directory or
Access Management failure, domain-critical access failure, integrity failure,
or a P0 data/privacy risk.

Because v0.7.1 introduces no migration, prefer immutable Worker-version
rollback to the retained healthy v0.7.0 version without changing D1. Revert or
disable the new public-domain routes when the trigger is domain-specific.
Escalate to the retained D1 export and Time Travel recovery inputs only when
reconciliation proves a data change; do not perform speculative database
rollback against a healthy schema-29 database.

## Current authorization boundary

This runbook authorizes repository-local builds, tests, manifests, and dry
runs only. Cloudflare upload, GitHub workflow dispatch, staging mutation, DNS
or custom-domain activation, production preflight with private credentials,
production deployment, rollback, Google mutation, and destructive cleanup all
remain explicit owner-gated actions.
