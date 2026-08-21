# Launch Runbook

> Mandatory after `v0.8.0`: all production-bound changes follow the permanent branch and playground policy in root `AGENTS.md` and [Isolated Staging Playground](./ISOLATED_STAGING_PLAYGROUND.md). Playground acceptance stops for Earl's explicit GO; this runbook cannot infer production approval from CI or staging success.

## Current production baseline

Production release `v0.8.0` is operational from exact source
`3059098ff2a2935fec59df52748ccae420aadba7` at schema 30 / migration
`0030_production_access_and_operations.sql`. The Isolated Staging Playground
amendment does not authorize a production deployment, data change, identity
change, secret change, or route change.

## Permanent isolated playground

The playground uses the repository commands and private configuration described
in `docs/ISOLATED_STAGING_PLAYGROUND.md`. Before a playground write:

1. verify the exact Cloudflare account and the dedicated Worker, D1, and R2
   identities against live provider inventory;
2. prove the config contains only the accepted staging bindings, no custom
   route, the exact candidate SHA/branch, and no production or legacy Google
   binding;
3. retain the protected prior operational staging D1 as read-only evidence;
4. capture or verify a private Worker rollback target and a fresh D1 recovery
   point before reset;
5. keep recipient, sender, fixture, credentials, provider secrets, IDs,
   exports, bookmarks, and rollback material outside Git and logs;
6. deploy only the exact clean candidate and require version/readiness/banner
   agreement before acceptance writes.

Reset archives and disables only recognized sandbox generations, appends
required ledger reversals, preserves immutable history, and then seeds the next
deterministic generation. It never runs a generic table deletion and never
targets the protected prior staging D1 or production.

## Verification

Require schema/migration, integrity, foreign-key, inventory/ledger invariants,
synthetic classification, reset eligibility, authentication, disabled and
least-privilege denials, recipient containment, critical module reads, exact
STAGING identity, and affected browser checks. A non-allowlisted recipient must
be rejected before challenge creation and before provider contact.

## Production change sequence

For a separately accepted future production change:

1. branch from current `main` and adopt a bounded specification;
2. pass focused checks, one complete repository gate, isolated exact-SHA
   staging acceptance, and required review/CI;
3. capture a fresh private production authorization package, D1 export/Time
   Travel bookmark, previous Worker version, and affected R2/provider recovery
   inputs. Recovery captured on the release branch is read-only pre-merge evidence;
4. merge through protected GitHub without force-push;
5. resolve the accepted `main` SHA, prove `git diff --exit-code <candidate> <main>`
   (tree parity), wait for required main-push CI, and stop on any merge-time tree
   drift;
6. regenerate private configs, authorization, release manifest, and recovery
   evidence bound to the accepted `main` SHA; pre-merge candidate packages are
   invalid after a merge commit changes the SHA;
7. run `npm run production:recovery:evidence -- --staging-config <private> --production-config <private> --authorization <private> --private-dir <private> --manifest <private>`;
8. require `npm run production:preflight`; the live deploy repeats that gate and therefore requires
   `npm run deploy:production -- --config <private-production-config> --authorization <private> --staging-config <private-staging-config> --secrets <private-production-secrets>` only
   in the approved change window;
9. verify exact runtime identity, health/readiness, bounded smoke, and
   reconciliation; retain append-only history and rollback evidence.

The private authorization package must approve backup, Worker deployment, rollback,
and closure. A no-migration/no-Google/no-seed release explicitly sets the inapplicable
mutation actions to `DENIED`; `PENDING` remains fail-closed and a denied required action
revokes launch authorization.

The production deploy wrapper additionally requires both checked-out Git branch and
private `CANDIDATE_BRANCH` to equal `main`. A release-branch package can capture only
pre-merge read-only recovery evidence; it cannot deploy production.

On target, binding, integrity, authorization, privacy, evidence, or identity
drift, stop the affected write path and follow `docs/PRODUCTION_INCIDENT_GUIDE.md`
and `docs/BACKUP_AND_RECOVERY.md`. Never repair by deleting ledger, audit,
status-history, release, request, lending, account, identity, or evidence rows.
