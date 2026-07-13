# Hosting and Database Candidates

## Research scope and date

This comparison was prepared on **2026-07-13** from official provider documentation only. Prices, free allowances, regions, product names, taxes, exchange rates, and terms can change; procurement must re-open every linked source and obtain a current quote. Scores are architecture judgments for this repository, not provider benchmarks or compliance certifications.

The target workload is a small institutional logistics application with a responsive static client, authenticated API, transactional inventory, private evidence, audit/idempotency, backups, preview deployments, and an asynchronous Google Sheets reporting projection. No production traffic profile, evidence growth rate, recovery objective, institutional cloud agreement, or measured Philippine latency was supplied.

## Decision summary

- **Preferred proposal:** Cloudflare Pages/Workers/Queues with Supabase Auth, PostgreSQL, and private Storage in the Singapore region.
- **Runner-up:** Firebase Hosting, Cloud Run, Cloud SQL for PostgreSQL, Firebase Auth, Google Cloud Storage, and a Google-managed queue/event service in Singapore where supported.
- **Decision status:** Proposed, not procured, built, measured, security-approved, or deployed. [ADR 0001](adr/0001-future-hosted-platform.md) records reversal conditions.

The preferred proposal optimizes a small team's delivery speed, preview workflow, and low entry cost while preserving PostgreSQL and an exit path. The Google-native runner-up offers stronger single-vendor integration and mature Cloud SQL HA/DR choices but carries more cloud configuration and potentially higher always-on database/operations cost. Either choice requires institutional identity/privacy review, production-paid service decisions, restore tests, Philippines-network measurements, and a provider exit drill.

## Weighted criteria

Scores use 1 (poor/high risk) to 5 (strong for this use case). Weighting was chosen before totals and sums to 100%.

| Criterion                          | Weight | What is evaluated                                                                                              |
| ---------------------------------- | -----: | -------------------------------------------------------------------------------------------------------------- |
| Security and identity              |    20% | Server authorization, managed auth, secret isolation, private networking/data controls                         |
| Transaction integrity and recovery |    20% | PostgreSQL constraints/transactions, backups/PITR/HA, restore and exit options                                 |
| Regional fit for Philippine users  |    15% | Listed nearby compute/database regions and ability to co-locate; no latency inference presented as measurement |
| Small-team maintainability         |    15% | Managed surface, local/preview workflow, operational burden, ecosystem clarity                                 |
| Cost and predictability            |    12% | Entry cost, idle/fixed cost, usage dimensions, guardrails; not a quote                                         |
| GitHub previews and rollback       |     8% | Review deployments, immutable releases, rollback workflow                                                      |
| Private evidence storage           |     5% | Access control, signed access, checksums/lifecycle/egress                                                      |
| Queues and observability           |     5% | Durable async projection, retries/dead letter, logs/metrics                                                    |

## Weighted matrix

| Candidate stack                                            | Security 20 | Integrity 20 | Region 15 | Maintain 15 | Cost 12 | Preview 8 | Storage 5 | Async 5 | Weighted / 5 |
| ---------------------------------------------------------- | ----------: | -----------: | --------: | ----------: | ------: | --------: | --------: | ------: | -----------: |
| Cloudflare + Supabase                                      |           4 |            4 |         4 |           5 |       4 |         5 |         4 |       4 |     **4.23** |
| Google-native Firebase/Cloud Run/Cloud SQL                 |           5 |            5 |         4 |           3 |       2 |         4 |         5 |       4 |     **4.06** |
| Vercel + Neon + separately selected auth/storage           |           4 |            4 |         4 |           4 |       3 |         5 |         3 |       3 |     **3.83** |
| Render Singapore + managed PostgreSQL + object storage/IdP |           3 |            4 |         4 |           4 |       3 |         4 |         3 |       3 |     **3.61** |
| Railway or Fly.io conventional service stack               |           3 |            3 |         4 |           3 |       3 |         3 |         3 |       3 |     **3.13** |

The 0.17 difference between the first two options is not statistically meaningful. An institutional Google agreement, identity mandate, Cloud SQL recovery requirement, or cross-vendor prohibition would move the runner-up ahead. Conversely, a very small pilot budget and strong PostgreSQL/Supabase skills strengthen the preferred proposal.

## Candidate A: Cloudflare plus Supabase

### Components

- Cloudflare Pages or Workers Static Assets for the Vite single-file client and GitHub previews.
- Cloudflare Workers for the authenticated API and Cloudflare Queues for outbox projection dispatch/retry.
- Supabase Singapore project for PostgreSQL, Auth, row-level security as defense in depth, and private Storage.
- Optional Cloudflare R2 only if evidence is intentionally separated from Supabase Storage after a governance/egress/operations comparison.

### Official facts

[Cloudflare Pages limits](https://developers.cloudflare.com/pages/platform/limits/) list, for the Free plan, 500 builds per month, one concurrent build, a 20-minute build timeout, 20,000 files, 25 MiB maximum per asset, and unlimited preview deployments. The single-file artifact is well below file-count concerns, but build quotas still require monitoring.

[Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/) lists a Free allowance of 100,000 requests per day and a paid plan with a US$5 monthly minimum and included request usage; static asset requests are described separately. CPU, subrequest, queue, log, and storage dimensions must be modeled from a real workload. The page was updated shortly before this comparison, reinforcing the need to recheck at procurement.

[Workers Smart Placement](https://developers.cloudflare.com/workers/configuration/placement/) can place Worker execution nearer backends based on observed traffic. That is an optimization mechanism, not proof of HAU-to-Singapore latency or data residency.

[Supabase regions](https://supabase.com/docs/guides/platform/regions) list Singapore as an APAC option. [Supabase billing](https://supabase.com/docs/guides/platform/billing-on-supabase) and the [pricing page](https://supabase.com/pricing) describe Free and paid quotas; the documented Free tier includes two projects, 500 MB database per project, 50,000 monthly active users, and 1 GB storage. Production should not depend on a free-plan continuity or backup assumption.

[Supabase backups](https://supabase.com/docs/guides/platform/backups) describes plan-dependent daily retention and paid point-in-time recovery. Database backups do not restore Storage object bytes, so evidence requires a separate object backup/export and restore test. [PostgreSQL row-level security guidance](https://supabase.com/docs/guides/database/postgres/row-level-security) supports requester row policies, but service-role secrets bypass those policies and belong only on the server. [Storage access control](https://supabase.com/docs/guides/storage/security/access-control) documents private bucket policy controls.

[R2 pricing](https://developers.cloudflare.com/r2/pricing/) lists a free tier of 10 GB-month storage, one million Class A operations, ten million Class B operations, and free direct egress, followed by usage pricing. [R2 presigned URL documentation](https://developers.cloudflare.com/r2/api/s3/presigned-urls/) warns through its bearer-style model that an unexpired URL grants its scoped operation; keep it short-lived and out of logs.

### Strengths and risks

Strengths are excellent preview/static delivery, a small API surface, managed PostgreSQL/Auth, a Singapore database choice, and a natural durable queue. Risks are cross-vendor incident/support boundaries, Worker-to-PostgreSQL connection design, Supabase service-role/RLS mistakes, independent database/object backup, PITR cost, and the need to prove where Workers execute relative to the database. Configure and test API/database co-location or connection pooling; do not assume edge execution makes database calls fast.

## Candidate B: Google-native

### Components

- Firebase Hosting for the static client and preview channels.
- Cloud Run for the authenticated API and projection worker.
- Cloud SQL for PostgreSQL, Firebase Authentication (or an approved institutional identity integration), Cloud Storage for evidence, and Pub/Sub/Cloud Tasks for durable async work.

### Official facts

[Firebase Hosting with Cloud Run](https://firebase.google.com/docs/hosting/cloud-run) supports rewrites to Cloud Run and requires a billing account/Blaze plan for the integration. [Firebase Hosting quotas and pricing](https://firebase.google.com/docs/hosting/usage-quotas-pricing) lists storage and data-transfer allowances/usage charges; preview and release usage must be included in the budget.

[Cloud Run pricing](https://cloud.google.com/run/pricing) is usage-based with a free tier and regional pricing. Singapore `asia-southeast1` is listed in the relevant regional tier; no Philippine Cloud Run region is shown in the researched source. Google's [cost optimization guidance](https://docs.cloud.google.com/run/docs/tips/services-cost-optimization) recommends co-locating services with dependent data and requiring authentication unless public access is intentionally needed.

[Firebase project locations](https://firebase.google.com/docs/projects/locations) explains that location choices affect supported resources and can be immutable. [Firebase Authentication](https://firebase.google.com/docs/auth) and its [limits](https://firebase.google.com/docs/auth/limits) document providers, quotas, and Identity Platform-related limits; institutional SSO and account governance still need a separate decision.

[Cloud SQL pricing](https://cloud.google.com/sql/pricing) varies by machine, storage, network, region, and HA. [Cloud SQL high availability](https://docs.cloud.google.com/sql/docs/postgres/high-availability) uses a regional primary/standby design and notes the additional cost; [region availability](https://docs.cloud.google.com/sql/docs/postgres/region-availability-overview) lists Singapore `asia-southeast1`. [Cloud SQL PostgreSQL FAQ](https://docs.cloud.google.com/sql/docs/postgres/faq) and [disaster recovery guidance](https://docs.cloud.google.com/sql/docs/postgres/intro-to-cloud-sql-disaster-recovery) cover backups/PITR and DR choices that must be tested against approved RPO/RTO.

[Cloud Storage signed URLs](https://docs.cloud.google.com/storage/docs/access-control/signed-urls) are time-limited but usable by anyone who possesses them until expiry. [Cloud Storage pricing](https://cloud.google.com/storage/pricing) includes regional storage, operations, retrieval, replication, and network dimensions.

### Strengths and risks

Strengths are one major-cloud control plane, mature PostgreSQL HA/DR choices, private object storage, granular IAM, and proximity to the existing Google Workspace/Sheets integration. Risks are greater IAM/network/project configuration, Cloud SQL minimum/HA cost, billing complexity, immutable location choices, and possible confusion between Firebase Auth and institutional Google Workspace authorization. The institution must own the Cloud project and billing; a personal project is unacceptable.

## Candidate C: Vercel plus Neon

Vercel provides strong Git-based previews and a Singapore function region (`sin1`), but its [function region documentation](https://vercel.com/docs/functions/configuring-functions/region) notes a default region that may not match the data service, so the API must be explicitly co-located. [Regional pricing](https://vercel.com/docs/pricing/regional-pricing) and [function usage/pricing](https://vercel.com/docs/functions/usage-and-pricing) show plan and region-dependent compute/memory/invocation charges; Hobby allowances are not a production procurement plan.

[Neon regions](https://neon.com/docs/introduction/regions) list Singapore on AWS AP Southeast 1. [Neon plans](https://neon.com/docs/introduction/plans) describe Free, Launch, and Scale usage/restore windows; current documentation lists Free compute/storage limits and shorter restore history, while paid plans extend retention and charge for compute/storage. Recheck the exact current plan and protected-production features.

Strengths are developer experience, previews, serverless PostgreSQL branching, and a Singapore pairing. The incomplete part is material: this application still needs an institutionally approved identity service, private object storage, durable queue, and unified backup/incident/exit story. Cross-region defaults and preview databases can also leak or drift if not governed.

## Candidate D: Render

[Render regions](https://render.com/docs/regions) list Singapore and warn that an existing service region cannot simply be changed; migration/recreation is required. [Render pricing](https://render.com/pricing) lists current service and PostgreSQL tiers. Render's platform documentation includes preview environments, deployment rollback, and monitoring capabilities.

Render offers a conventional always-on API and managed PostgreSQL model that may be easier for teams unfamiliar with edge/serverless constraints. It still needs an approved identity approach and object storage choice, and regional immutability/instance cost/backup retention must be modeled. A single service process must not perform an unbounded synchronous Sheets projection.

## Candidate E: Railway or Fly.io

[Railway plans](https://docs.railway.com/pricing/plans) describe current Free, Hobby, and Pro subscriptions plus resource usage; the documented base plan prices/credits and CPU, memory, storage, and egress charges require a workload estimate. [Railway regions](https://docs.railway.com/deployments/regions) list deployment locations and networking behavior. Earlier provider restrictions or promotional allowances should not be assumed current without rechecking the linked pages on procurement day.

[Fly.io pricing](https://fly.io/docs/about/pricing/) is usage-based across machines, volumes, snapshots, and network transfer. [Fly.io regions](https://fly.io/docs/reference/regions/) lists available locations including Singapore when capacity/product support permits.

These platforms support a conventional API/worker and can co-locate near managed data, but the organization must assemble identity, PostgreSQL recovery, private object storage, queues, monitoring, secrets, patching, and provider exit. They are flexible runner candidates if the team already operates them; they are not the lowest-governance option for this project today.

## Philippine region and latency caveat

The reviewed managed database/compute options commonly list Singapore as the nearest clearly documented regional choice; none of the cited pages establishes a Philippine database region for these exact products. Cloudflare may execute edge code in distributed locations, but database-bound commands are dominated by API-to-database placement and connection behavior.

Therefore:

- “Singapore is a listed nearby option” is a sourced fact.
- “It will be fast for HAU users” is an unmeasured hypothesis.
- Before procurement/cutover, measure p50/p95/p99 full command and static-load timing from representative HAU campus, home fiber, and mobile networks, at expected concurrency, with the API and database explicitly configured.
- Measure cold starts, connection setup, upload/download, Sheets projection lag, and provider failure behavior—not ping alone.
- Keep API, database, object storage, and queue in compatible locations where possible; record cross-region data transfer and governance implications.

## Security, backup, and cost gates common to every provider

1. Institutional owner/billing/MFA/recovery; no personal sole owner.
2. Deny-by-default server authorization and approved identity provider; RLS is defense in depth.
3. Managed secrets, no browser service credentials, protected previews, environment separation.
4. PostgreSQL constraints/transactions and immutable ledger/audit policy.
5. Defined RPO/RTO, PITR/backup retention, automated exports, quarterly restore, and provider-exit test.
6. Private object storage, short-lived signed access, malware/type controls, independent object backup.
7. Durable outbox projection with retry/dead letter/checkpoint and reconciliation.
8. Spending budgets/alerts and modeled database, compute, storage, operations, logs, backups, egress, support, taxes, and exchange rates.
9. Vendor privacy/security/legal/subprocessor/residency/retention review; provider product features are not automatic compliance.
10. Measured acceptance from Philippine networks and rollback under failure.

## Sheets projection requirement

The future command transaction writes PostgreSQL business rows plus one outbox row atomically. A worker claims outbox rows with safe concurrency, writes an idempotent reporting row/batch to a dedicated Google Sheet using a service identity, verifies the result, then checkpoints the event. Retry uses backoff; poison events enter a dead-letter queue with alert and manual replay tooling. Projection lag and reconciliation count are observable.

Sheets is eventually consistent and read-only for reporting. It never participates in a browser request transaction and never becomes a second command authority. A projection outage leaves PostgreSQL operations available; a database outage stops mutations rather than writing to Sheets as a fallback.

## Validation spike before final selection

Build the same thin vertical slice on the preferred and runner-up:

- institutional/test identity with requester/staff/admin authorization;
- one request-and-reserve transaction with idempotent replay and audit/outbox;
- one private evidence upload and short-lived authorized download;
- one async Sheets projection with retry/dead letter/reconciliation;
- preview deployment, secret isolation, structured logs/alerts;
- backup/PITR restore to isolation and provider export;
- measured Philippine-network/cold-start/load results and 12-month cost model.

Use those results to accept or amend the ADR. Do not migrate production data merely to run the spike.
