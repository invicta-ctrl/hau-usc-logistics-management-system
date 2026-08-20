# V83 Staff/Account Activity History: Authoritative Implementation Contract

INTENT: architecture / feature plan
OBJECTIVE: Later provider-free additive canonical staff/account activity history.
TARGET: release/v0.8.3-identity-foundation after c09626edb5131e1bdce6b060e6781ffd6904317d.
This document is the sole authoritative contract; all earlier amendments are
consolidated and have no independent force.

IN SCOPE: later migration 0032, event-time context, append-only history,
effective ACCESS_ADMIN read route, V5 rendering, and regression evidence.
OUT OF SCOPE: provider/private data, crypto/roster/protected data, backfill,
migration execution, candidate freeze, Playground, Production, deployment, and v0.8.4.

## Normative identity and schema

HIS and TRN are opaque 128-bit lowercase hexadecimal identifiers, not UUIDs:
HIS- plus lower(hex(randomblob(16))) and TRN- plus lower(hex(randomblob(16))).
All string identifiers use value=trim(value), length 1..128 unless below. All
timestamps use exactly YYYY-MM-DDTHH:MM:SS.mmmZ, length 24, checked separators
5/8 hyphen, 11 T, 14/17 colon, 20 dot, 24 Z. Nullable timestamps use that exact
predicate or NULL. Migration enables foreign_keys, creates all objects below,
then atomically sets operational_schema_version 31 to 32; it never backfills.

    CREATE TABLE staff_account_activity_history (
      event_id TEXT PRIMARY KEY NOT NULL CHECK(length(event_id)=36 AND
        substr(event_id,1,4)='HIS-' AND substr(event_id,5) NOT GLOB '*[^0-9a-f]*'),
      occurred_at TEXT NOT NULL CHECK(length(occurred_at)=24),
      event_type TEXT NOT NULL CHECK(event_type IN
        ('ACCOUNT_AUDIT','ACCOUNT_STAFF_LINK','STAFF_ASSIGNMENT')),
      action_code TEXT NOT NULL CHECK(action_code=trim(action_code) AND action_code IN
        ('ACCESS_ID_CHANGED','STARTER_ACCOUNT_CREATED','ACCOUNT_STATUS_CHANGED',
         'ACCOUNT_APPLICATION_ACTIVATED','LINK_CREATED','LINK_STATE_CHANGED',
         'ASSIGNMENT_CREATED','ASSIGNMENT_STATE_CHANGED',
         'ASSIGNMENT_EFFECTIVE_WINDOW_CHANGED')),
      person_id TEXT NOT NULL REFERENCES canonical_people(person_id)
        ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED,
      account_id TEXT REFERENCES accounts(id)
        ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED,
      account_staff_link_id TEXT REFERENCES account_staff_links(id)
        ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED,
      staff_assignment_id TEXT REFERENCES staff_assignments(id)
        ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED,
      link_state TEXT, previous_link_state TEXT,
      assignment_state TEXT, previous_assignment_state TEXT,
      old_effective_from TEXT, old_effective_to TEXT,
      new_effective_from TEXT, new_effective_to TEXT,
      account_access_id_snapshot TEXT, correlation_id TEXT,
      source_kind TEXT NOT NULL CHECK(source_kind IN
        ('ACCOUNT_AUDIT','ACCOUNT_STAFF_LINK','STAFF_ASSIGNMENT')),
      source_id TEXT NOT NULL, source_event_id TEXT NOT NULL,
      transition_id TEXT UNIQUE CHECK(transition_id IS NULL OR
        (length(transition_id)=36 AND substr(transition_id,1,4)='TRN-' AND
         substr(transition_id,5) NOT GLOB '*[^0-9a-f]*')),
      payload_version INTEGER NOT NULL DEFAULT 1 CHECK(payload_version=1),
      UNIQUE(source_kind,source_id,source_event_id),
      CHECK((source_kind='ACCOUNT_AUDIT' AND event_type='ACCOUNT_AUDIT' AND
        source_event_id=source_id AND transition_id IS NULL AND
        action_code IN ('ACCESS_ID_CHANGED','STARTER_ACCOUNT_CREATED',
          'ACCOUNT_STATUS_CHANGED','ACCOUNT_APPLICATION_ACTIVATED') AND
        account_id IS NOT NULL AND account_staff_link_id IS NOT NULL AND
        link_state='ACTIVE' AND account_access_id_snapshot IS NOT NULL AND
        staff_assignment_id IS NULL)
        OR (source_kind='ACCOUNT_STAFF_LINK' AND event_type='ACCOUNT_STAFF_LINK' AND
          source_event_id=transition_id AND transition_id IS NOT NULL AND
          source_id=account_staff_link_id AND account_id IS NOT NULL AND
          action_code IN ('LINK_CREATED','LINK_STATE_CHANGED') AND
          staff_assignment_id IS NULL)
        OR (source_kind='STAFF_ASSIGNMENT' AND event_type='STAFF_ASSIGNMENT' AND
          source_event_id=transition_id AND transition_id IS NOT NULL AND
          source_id=staff_assignment_id AND account_id IS NULL AND
          account_staff_link_id IS NULL AND
          action_code IN ('ASSIGNMENT_CREATED','ASSIGNMENT_STATE_CHANGED',
            'ASSIGNMENT_EFFECTIVE_WINDOW_CHANGED'))),
      CHECK(old_effective_from IS NULL OR length(old_effective_from)=24),
      CHECK(old_effective_to IS NULL OR length(old_effective_to)=24),
      CHECK(new_effective_from IS NULL OR length(new_effective_from)=24),
      CHECK(new_effective_to IS NULL OR length(new_effective_to)=24)
    ) STRICT;
    CREATE UNIQUE INDEX staff_account_activity_history_person_order
      ON staff_account_activity_history(person_id,occurred_at DESC,event_id DESC);
    CREATE UNIQUE INDEX staff_account_activity_history_account_order
      ON staff_account_activity_history(account_id,occurred_at DESC,event_id DESC);

    CREATE TABLE staff_account_activity_audit_context (
      audit_id TEXT PRIMARY KEY NOT NULL REFERENCES audit_log(id)
        ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED,
      person_id TEXT NOT NULL REFERENCES canonical_people(person_id)
        ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED,
      account_id TEXT NOT NULL REFERENCES accounts(id)
        ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED,
      account_staff_link_id TEXT NOT NULL REFERENCES account_staff_links(id)
        ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED,
      link_state TEXT NOT NULL CHECK(link_state='ACTIVE'),
      account_access_id_snapshot TEXT NOT NULL, action_code TEXT NOT NULL,
      correlation_id TEXT NOT NULL, prepared_at TEXT NOT NULL
    ) STRICT;

    CREATE TABLE staff_account_activity_transition_context (
      transition_id TEXT PRIMARY KEY NOT NULL CHECK(length(transition_id)=36 AND
        substr(transition_id,1,4)='TRN-' AND substr(transition_id,5)
        NOT GLOB '*[^0-9a-f]*'),
      source_kind TEXT NOT NULL CHECK(source_kind IN
        ('ACCOUNT_STAFF_LINK','STAFF_ASSIGNMENT')),
      source_id TEXT NOT NULL, action_code TEXT NOT NULL,
      person_id TEXT NOT NULL REFERENCES canonical_people(person_id)
        ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED,
      account_id TEXT REFERENCES accounts(id)
        ON DELETE RESTRICT DEFERRABLE INITIALLY DEFERRED,
      old_link_state TEXT, new_link_state TEXT,
      old_assignment_state TEXT, new_assignment_state TEXT,
      old_effective_from TEXT, old_effective_to TEXT,
      new_effective_from TEXT, new_effective_to TEXT,
      correlation_id TEXT, created_at TEXT NOT NULL,
      UNIQUE(source_kind,source_id),
      CHECK((source_kind='ACCOUNT_STAFF_LINK' AND
        action_code IN ('LINK_CREATED','LINK_STATE_CHANGED') AND account_id IS NOT NULL)
        OR (source_kind='STAFF_ASSIGNMENT' AND
          action_code IN ('ASSIGNMENT_CREATED','ASSIGNMENT_STATE_CHANGED',
            'ASSIGNMENT_EFFECTIVE_WINDOW_CHANGED') AND account_id IS NULL))
    ) STRICT;

The table CHECK matrix additionally requires all assignment fields null for audit
and link events; link/assignment previous state null on create and non-null on
state change; assignment window event has a NULL-safe OLD/NEW difference; and
all four timestamp fields use the exact timestamp predicate above. Every history,
context, source ID, action, snapshot, and correlation has the stated trim/bound
predicate. Source identity columns and assignment_fingerprint have BEFORE UPDATE
abort guards; history/context have BEFORE UPDATE OR DELETE abort guards. Context
source_id has no FK only because CREATE precedes source-row existence.

## Producer, trigger, assertion, cleanup contract

Each ACCOUNT audit (ACCESS_ID_CHANGED, both independent STARTER_ACCOUNT_CREATED
producers, and ACCOUNT_STATUS_CHANGED) does: validate; guarded audit-context
INSERT SELECT requiring exactly one ACTIVE explicit link; existing ACCOUNT audit
INSERT with same audit ID; AFTER audit trigger exact-match project; delete context.
Invalid/ambiguous/revoked/quarantined/sentinel/malformed proof writes zero
context/audit projection while preserved audit logging succeeds.

Account-application activation does: guarded application transition/history;
guarded account-context INSERT SELECT by activated account plus exactly one ACTIVE
link; guarded ACCOUNT audit INSERT SELECT only if context exists; existing
ACCOUNT_APPLICATION audit unchanged. No link, ambiguous, sentinel, or malformed
makes both new rows zero while activation/application audit commits.

Link CREATE/UPDATE and assignment CREATE/UPDATE/window mutation do: validate
direct OLD/NEW truth; guarded transition-context INSERT with TRN; guarded source
mutation with expected OLD; immediate NOT NULL assertion:
UPDATE data_revisions SET updated_at=CASE WHEN changes()=1 THEN updated_at ELSE
NULL END WHERE scope='global'; AFTER trigger requires exactly one matching pending
context, kind/source/action/person/account and NULL-safe OLD/NEW values, projects
history with transition_id; then delete that context. No-op returns before context.
Missing/stale/mismatched context, zero/multi mutation, replay, or conflict aborts
the batch. Pending primary TRN plus UNIQUE(source_kind,source_id) prevents NULL
uniqueness bypass; completed history.transition_id UNIQUE prevents global TRN
reuse. Context is ephemeral, never recovery evidence.

## Regression/acceptance matrix

Migration tests apply 0031/0032, assert version 32/order, every DDL/index/guard,
STRICT/deferred FK, source delete/identity guards, and no backfill. Real
Miniflare executes every trigger and guarded activation SQL: exactly-one, no,
ambiguous, sentinel/malformed link; existing application audit success;
AUTHENTICATION/nonexistent/delayed/replayed/malformed legacy audit safety.

Producer tests cover both STARTER producers, ACCESS_ID_CHANGED,
ACCOUNT_STATUS_CHANGED, application existing audit plus conditional account audit,
link/assignment create/update/window, stale/missing context, cleanup/rollback,
no-op/retry/conflict, and immutable fingerprint. Service/route tests prove DTO
allowlist, query/pagination, effective ACCESS_ADMIN mutation:false denial before
read. Browser/V5 tests prove textContent/escaped dynamic output, safe empty/error,
no roster/access-directory fallback, privacy, authorized result and denied
no-request. The accepted P3 residual remains: no live Worker 403 execution;
static authorization and browser denied/no-request evidence only.

Owned later paths: migration 0032; identity-foundation repository; access service
and access-management repository; account-application service/repository; new
activity service; Worker/HTTP/V5 files; identity/migration/account-application/
access-management/worker/V5/local-worker tests already named by the matrix.
No provider, private source, deployment, or migration execution is authorized.
