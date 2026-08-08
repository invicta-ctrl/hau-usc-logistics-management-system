# Launch Runbook

## Current production baseline

Production release `v0.7.2` is operational from exact source
`84eacfcdb47a3985fed48e3ba14bb413946d4410` at schema 30 / migration
`0030_production_access_and_operations.sql`. Maintenance v0.7.2.1 does not
authorize a production deployment, data change, identity change, secret change,
or route change.

## Permanent isolated staging

Staging uses the repository commands and private configuration described in
`docs/STAGING_SANDBOX.md`. Before a staging write:

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
   inputs;
4. merge through protected GitHub without force-push;
5. deploy only the accepted `main` SHA in the approved change window;
6. verify exact runtime identity, health/readiness, bounded smoke, and
   reconciliation; retain append-only history and rollback evidence.

On target, binding, integrity, authorization, privacy, evidence, or identity
drift, stop the affected write path and follow `docs/PRODUCTION_INCIDENT_GUIDE.md`
and `docs/BACKUP_AND_RECOVERY.md`. Never repair by deleting ledger, audit,
status-history, release, request, lending, account, identity, or evidence rows.
