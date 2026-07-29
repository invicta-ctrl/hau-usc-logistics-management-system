# v0.7.0 Production Incident Guide

## First response

1. Record time, affected route/workflow, safe correlation ID, observed status,
   and operator. Do not paste credentials, personal data, object keys, OAuth
   values, private URLs, provider identifiers, or raw stack traces.
2. Stop only the affected write path when data integrity, authorization,
   privacy, evidence, or ledger correctness is uncertain.
3. Check public health/readiness/version and protected System Health. Treat
   `ATTENTION`, `NOT_CONFIGURED`, and `UNAVAILABLE` as truthful states.
4. Inspect redacted Workers Logs/traces and immutable audit/history. Preserve
   the failing state and evidence before repair.

## Recovery decision

- Application defect: reproduce safely, repair on a short-lived branch, run the
  affected and repository gates, stage, then merge through a green PR.
- Bad operational action: append an authorized correction/reversal. Never edit
  append-only records.
- Worker regression: select a retained exact Worker version and reconcile D1
  before and after rollback.
- D1 incident: stop writes, capture a fresh export/bookmark if safe, select the
  required Time Travel point or verified SQL export, restore to an isolated
  target, verify integrity/FKs/counts, then stage before production recovery.
- Evidence incident: preserve R2 and Drive copies/metadata and use the governed
  reconciliation/restore workflow.

Escalate any suspected credential, privacy, or authorization exposure
immediately and rotate/revoke affected access without disclosing values in the
incident record.
