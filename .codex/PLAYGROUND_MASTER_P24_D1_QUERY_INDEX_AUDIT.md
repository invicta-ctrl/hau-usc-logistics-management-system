# P24 — D1 Query/Index Audit

STATUS: PASS_BOUNDED_PLAN_AUDIT; NO_INDEX_OR_MIGRATION_JUSTIFIED

## Evidence boundary

- Reproducible audit: `scripts/d1/audit-query-plans.mjs`
- Raw receipt: `.codex/evidence/P24_D1_QUERY_PLAN_AUDIT.json`
- Schema: all 32 accepted migrations through `0032_staff_account_activity_history.sql` applied to an ephemeral Miniflare D1.
- Coverage: 16 representative reads across every P24 surface.
- Live rows-read/latency: unavailable. The existing authenticated Playground inspector failed at Wrangler's D1 inventory call before query execution. It made no D1 query or mutation and was not retried.
- Production and Playground D1/R2 mutation: none.

The local planner found eight representative full scans and eleven temporary ORDER BY sorts. These are candidate pressure points, not proof that an index creates net value at current live row counts.

## Surface findings

| Surface | Planner/read finding | Bound/pagination finding | Disposition |
| --- | --- | --- | --- |
| Inventory | Catalog balance subqueries use existing ledger/reservation indexes but require a temp sort. Recent ledger is a full scan plus temp sort. Classification history uses its item index but temp-sorts by global occurrence time. | Active catalog is unpaged; classification/ledger/reservations are capped at 500, not paginated. | Candidate global-time/history pressure; no live value proof. |
| Request queue | Default active review queue scans and temp-sorts because archive filtering plus priority `CASE` ordering is not covered. Page-child lookup uses `idx_request_lines_request_status`. Search uses `instr(lower(...))`, so arbitrary substring search cannot use a normal B-tree prefix. | Parent and child pages are bounded and share one predicate/total. | Keep current correctness bounds; do not add an expression/composite index without live evidence. |
| Lending queue | Global updated-time page scans and temp-sorts. Available assets and scoped status history are loaded as broad collections; ticket history is then filtered per ticket in JavaScript. | Ticket page is bounded; history/assets are not independently paginated. | Candidate queue-time index and set-bound history projection. |
| Release queue | Release confirmations scan and temp-sort by `released_at`; correction lookup is page-bound and covered by `idx_release_corrections_confirmation`. | Confirmation page is bounded. Supporting event/ticket/reference reads have separate caps. | Candidate released-time index only after live rows-read/latency proof. |
| Restocking/receiving | Restock work and receipt queues both scan and temp-sort. The canvass projection also performs a correlated preferred-history lookup per row. | Result sets are page-bounded, but generic Request/Request-line reads occur before this branch and are not used by the Restocking DTO. | Remove redundant reads in a separately accepted runtime-query repair; index remains unproven. |
| Procurement | Deliverables use the existing request/status index but temp-sort globally. Canvass performs a full scan/temp sort across broad left joins. | Results are page-bounded. The initial Inventory catalog read occurs before this branch but is not returned. | Candidate set/query restructuring; no speculative index. |
| Events | Global activity history scans and temp-sorts. | Main events, days, activities, and operational links are unpaged; activity history alone is capped at 500. | Pagination/query-shape debt recorded; no time index without live proof. |
| Administration directory/accounts | Account page follows the access-ID index with no temp sort, but its correlated last-login lookup is not covered by the current `audit_log(entity_type, entity_id, created_at)` index because the query filters `action` and `entity_id` only. `listAccounts` then performs up to three sequential lookups per returned account (department, committees, access profile): a deterministic N+1 pattern. Canonical directory joins use person indexes but require distinct aggregation work and leading-wildcard search. | Both account and canonical-directory results are paginated. | N+1/set hydration is the strongest code-level repair candidate. An audit-log index is not justified without rows-read evidence. |
| Activity history | `staff_account_activity_history_person_order(person_id, occurred_at DESC, event_id DESC)` satisfies the person lookup and ordering with no scan or temp sort. | Count and result are paginated with the same predicate. | Green; no index change. |
| Profile/account lookup | Account, department, appearance metadata, and committee reads use primary/composite indexes. | Exact account lookup; bounded. | Green; no index change. |

## Cross-cutting findings

1. `bootstrapModule` reads the first Inventory page before every branch. Inventory then replaces it with an unpaged full catalog, while Procurement does not return it. The generic branch also reads Request parents/lines before Restocking even though that DTO does not use them.
2. High-traffic queues commonly use `SELECT ...*`, moving columns not necessarily needed for their list surfaces.
3. Inventory and Event management own several broad history/reference collections with caps but no cursor/page contract.
4. Administration account hydration is the only confirmed application-level N+1 in the audited primary paths: a 25-row page can require the count/page reads plus as many as 75 sequential hydration reads.
5. Existing composite indexes correctly cover Activity history, Profile/account keys, Request child lookup, release corrections, entity history, item ledger/reservation aggregation, and canonical identity joins.

## Index decision

No migration was created or applied. Planner scans alone do not satisfy the accepted proof sequence because live rows-read, latency, data cardinality, and an after-plan/delta are unavailable. Adding global-time indexes to every scan would increase D1 write amplification and storage while potentially duplicating existing scope-prefixed indexes. Migration `0033` therefore remains unused.

Candidate indexes for a future measured Playground-only experiment, not approved changes, are:

- `inventory_ledger(created_at DESC, id DESC)`;
- `release_confirmations(released_at DESC, id DESC)`;
- event activity global occurrence time;
- a queue-specific request/lending/restock time or expression index aligned to the exact scope/filter order;
- `audit_log(action, entity_id, created_at DESC)` if Administration rows-read proves the correlated last-login lookup material.

Each candidate still requires current live cardinality, before/after rows-read and latency, write/storage tradeoff, Playground-only migration rehearsal, and rollback/forward-fix proof.

## Verification

- `node scripts/d1/audit-query-plans.mjs --output=.codex/evidence/P24_D1_QUERY_PLAN_AUDIT.json`: PASS; 32 migrations, 16 query plans.
- Targeted ESLint for the audit script: PASS.
- `git diff --check`: PASS.
- D1 writes, migration application, deployment, Production, Google, Figma, and `main` mutation: none.

## Decision

P24 is complete as the bounded audit authorized by the prompt. The raw receipt distinguishes deterministic plan evidence from unavailable live D1 evidence and preserves the no-speculative-index gate. The query-shape and pagination findings remain measured audit outputs; P24 did not silently change API behavior.

NEXT_EXACT_ACTION: Begin P25 Theme performance/accessibility across six families and Light/Dark/System, including instant switching, blur/animation cost, representative five-width coverage, and the exact contrast/focus/nav/table/form/status/dialog/glass checks.
