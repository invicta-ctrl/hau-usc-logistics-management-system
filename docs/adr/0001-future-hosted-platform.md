# ADR 0001: Future Hosted Platform

- **Status:** Proposed
- **Date:** 2026-07-13
- **Decision owners:** HAU/USC data owner, system owner, privacy/security owner, and procurement (unassigned in repository)
- **Scope:** FUTURE hosted application only; no current deployment authorization

## Context

The current Apps Script/Sheets/Drive design supports a bounded pilot but uses a global script lock, tab-based integrity, broad Google scopes, and platform-specific HTML/callable behavior. A future system needs transactional PostgreSQL authority, managed identity, private object storage, previewable static hosting, durable asynchronous Sheets reporting, observability, backup/PITR, and a provider exit path.

Official-source provider research and weighted criteria are recorded in [Hosting and Database Candidates](../HOSTING_AND_DATABASE_CANDIDATES.md). No production workload, budget approval, institutional cloud agreement, RPO/RTO, data-residency ruling, or measured Philippine latency is yet available.

## Proposed decision

Run the first hosted validation spike using:

- Cloudflare Pages/Workers for the client and authenticated API;
- Cloudflare Queues for durable projection dispatch/retry/dead letter;
- Supabase in Singapore for managed PostgreSQL, Auth, and private Storage;
- PostgreSQL as sole command authority with a transactional outbox;
- an asynchronous, idempotent Google Sheets reporting projection.

If the spike and governance gates pass, this becomes the preferred implementation target. It is not approved for production simply because this ADR exists.

## Runner-up

Firebase Hosting + Cloud Run + Cloud SQL PostgreSQL + Firebase Auth + Cloud Storage + a Google-managed queue is the runner-up. It becomes preferred if institutional Google ownership/support, one-vendor governance, or Cloud SQL HA/DR outweighs the preferred stack's delivery/cost advantages.

## Rationale

The preferred stack scored highest for this small team's maintainability, preview workflow, entry cost, Singapore database availability, managed PostgreSQL/Auth/storage, and queue path. PostgreSQL and standard object export reduce application-level lock-in. The margin over the Google stack is small and based on assumptions, so a comparable two-stack spike is required.

## Consequences

Positive:

- clear browser/API/database/storage boundaries;
- database transactions and constraints for ledger/idempotency/outbox;
- Git-based preview deployment and low-friction static delivery;
- managed identity/storage/database with a listed Singapore option;
- asynchronous Sheets projection removes Sheets from request transactions.

Negative and risks:

- cross-vendor support, billing, incident, and data-path complexity;
- Worker-to-PostgreSQL placement/connection behavior must be engineered and measured;
- Supabase RLS/service-role mistakes can expose data;
- database backups do not back up Storage bytes;
- paid PITR/retention and production support may change the cost comparison;
- no Philippine latency or provider compliance conclusion has been proven.

## Mandatory acceptance conditions

1. Institutional ownership, billing, MFA/recovery, legal/privacy/security/subprocessor review.
2. Approved RPO/RTO, paid-plan/retention selection, automated database/object export, restore and provider-exit drill.
3. Protected previews and strict environment isolation.
4. Identity/role/request-only privacy contract tests and no browser service credentials.
5. Transaction/idempotency/outbox/dead-letter/reconciliation tests at expected concurrency.
6. Private evidence, short-lived access, file validation/scanning, retention/legal-hold process.
7. Measured campus/home/mobile p50/p95/p99 command, static, upload, cold-start, and projection results; no assumed latency.
8. Twelve-month cost model with alerts, taxes/exchange/support/backup/log/egress dimensions.
9. Rehearsed cutover, reverse cutover, and immutable release rollback.

## Reversal conditions

Reject or amend this proposal if any mandatory condition fails; if HAU requires a single Google control plane; if cross-vendor transfer/support is unacceptable; if Supabase/Cloudflare cannot meet RPO/RTO, identity, private-storage, or contract requirements; if measured Philippine performance is inadequate; or if total governed cost exceeds the runner-up.

## Migration and rollback

Follow the phased plan in [Future Hosting and Database](../FUTURE_HOSTING_AND_DATABASE.md). Until a bounded cutover, Apps Script/Sheets remains the authority and future resources use fictional or approved staging copies. At cutover there is one explicit source-of-truth transition, no indefinite dual command writes, and a timed reverse-import plan for any hosted commands before rollback. Old Sheets/Drive remain read-only through the governed rollback window.
