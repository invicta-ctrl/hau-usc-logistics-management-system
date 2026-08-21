# V83 Staff Directory Canonical Projection Plan

INTENT: feature / architecture

OBJECTIVE: Implement one provider-free, server-authoritative, read-only Staff
Directory projection over the existing v0.8.3 canonical-identity tables. The
projection must preserve the current `ACCESS_ADMIN` audience without inferring
System Owner privilege, keep the protected roster-management workflow separate,
and expose only the allowlisted safe directory state below.

TARGET: `release/v0.8.3-identity-foundation` after this plan's governance
commit; implementation begins from that clean SHA in an isolated worktree.

AUTHORITATIVE SOURCES: `.codex/specs/active/v0.8.3-identity-intake-a5-accepted.md`
sections 1–6; `.codex/releases/v0.8.3/V0_8_3_SCOPE_COMPLETENESS_MATRIX.md`;
the accepted Staff Directory review at `c7d1218a2dd35cffb282c2ca43ba01fc9d87a389`;
and the owner/parent accepted policy for this slice.

IN SCOPE: the one read endpoint, its canonical D1 read model and DTO service,
Worker/adaptor/V5 wiring, focused regression-first tests, and exact evidence.
The endpoint is `POST /api/admin/staff-directory`, calls Worker `authorize` with
`CAPABILITIES.ACCESS_ADMIN` and `mutation: false`, and is read-only. The
existing `/api/admin/access/directory` remains the Accounts-and-Access endpoint;
`/api/owner/identity-roster/*` and its preview/apply/rollback UI remain separate.

OUT OF SCOPE: any source/provider roster read, private-source access, mutation,
schema or migration change, 0031 release application, account-link or
assignment write, authorization-policy change, inferred privilege, deployment,
candidate freeze, Playground, Production, or recovery action.

DELIVERABLES: a safe canonical directory read model and DTO, effective
`ACCESS_ADMIN` Worker route, V5 read-only view, regression-first tests, and
durable evidence. No canonical or provider data is changed.

VERIFICATION: portable Node 22.23.2 focused unit/repository/Worker/V5 tests,
Node syntax, scoped ESLint/Prettier, privacy/static/diff checks, full logical
diff review, normal commit/push, and local/upstream/live parity.

CONSTRAINTS:

- The Worker authorization result is authoritative. A System Owner is admitted
  only if its effective server-projected capabilities include `ACCESS_ADMIN`;
  no role-only bypass or client-side capability inference is allowed.
- The new service receives only the canonical repository. It must not receive
  `rosterCrypto`, decrypt any value, inspect legacy roster entries, call Google,
  or select protected envelopes, email/assignment fingerprints, raw provenance,
  source rows, secrets, or capabilities.
- The SQL read model has one row per `canonical_people.person_id`, fixed
  deterministic `person_id ASC` order, `page` clamped to at least 1, `pageSize`
  clamped to 5–50, and `query` trimmed/clamped to 120 characters. Search may
  match only opaque `person_id` and explicitly linked account `access_id` or
  `profile_full_name`; it never searches encrypted email or assignment values.
- Missing, ambiguous, revoked, or quarantined data never grants anything. It is
  returned only as a non-privileging state indicator and does not alter existing
  account authorization or effective access.

## Exact DTO and read model

Each item is a canonical person, never a name-join result:

```text
{
  personId: opaque canonical ID,
  displayName: string | null,
  accessId: string | null,
  linkState: ACTIVE | UNLINKED | REVOKED | QUARANTINED | AMBIGUOUS,
  linkedAccountCount: non-negative integer,
  emailState: NONE | ACTIVE_VERIFIED | ACTIVE_UNVERIFIED | AMBIGUOUS | QUARANTINED,
  assignmentSummary: {
    activeCount: non-negative integer,
    historicalCount: non-negative integer,
    quarantinedCount: non-negative integer,
    provenanceState: PRESENT | UNAVAILABLE
  }
}
```

`displayName` and `accessId` are the only business fields. Both are allowlisted
existing Accounts-and-Access fields and are returned only where exactly one
active explicit link has a non-empty account profile name/access ID. Otherwise
both are `null`; the person remains a distinct row. This prevents name-based
merge or selection when a person has zero/multiple active account links.

State precedence is fail-closed: any quarantined record wins; otherwise any
ambiguous email wins; otherwise an active explicit link is `ACTIVE`; otherwise
a revoked link is `REVOKED`; otherwise `UNLINKED`. `provenanceState` reports
only whether any assignment provenance envelope is present; it never exposes
the envelope or its contents. The query may aggregate states and counts but
must not select protected columns. An empty canonical table returns `items: []`
and normal pagination. The response has no mutation token, credential,
capability, source, provider, or raw audit data.

## Exact implementation map

| Responsibility                       | Owned path and change                                                                                                                                                                                                                                                        |
| ------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Canonical SQL read model             | `src/server/d1/identity-foundation-repository.js`: add `listCanonicalDirectory` with the constrained aggregation/query above.                                                                                                                                                |
| DTO, validation, fail-closed mapping | New `src/server/identity-foundation/staff-directory-service.js`: accept only the repository; normalize inputs; map safe states; do no decryption or writes.                                                                                                                  |
| Server wiring                        | `src/worker/index.js`: construct the service and add only `POST /api/admin/staff-directory` behind `CAPABILITIES.ACCESS_ADMIN`, `mutation: false`.                                                                                                                           |
| Client transport                     | `src/services/http-api-adapter.js` and `src/services/rest-service.js`: add `listCanonicalStaffDirectory` for the new route.                                                                                                                                                  |
| V5 view                              | `src/v5/integration/runtime.js`, `src/v5/integration/view-models.js`, and `src/v5/src/surfaces/admin.js`: load the new endpoint only for `admin.directory`, render safe state/count rows, and retain an empty/denied state without fallback to Accounts-and-Access.          |
| Separation                           | `src/v5/integration/admin-parity.js`: remove the protected roster action panel from `admin.directory`; do not change legacy roster endpoints or their management UI.                                                                                                         |
| Focused tests                        | New `tests/unit/staff-directory-service.test.js`; extend `tests/unit/identity-foundation-migration.test.js`, `tests/unit/identity-foundation-worker-route-contract.test.js`, `tests/e2e/v5-current-application-fixtures.js`, and `tests/e2e/v5-current-application.spec.js`. |

No other path is authorized. In particular, `migrations/0031_canonical_identity_foundation.sql`,
identity-roster source/crypto modules, access-management service/repository,
account authorization code, and provider configuration remain unchanged.

## Regression-first acceptance

1. Before implementation, add failing focused cases that prove: an
   `ACCESS_ADMIN` effective capability succeeds; no capability is denied; a
   System Owner without that capability is denied; no provider/roster call is
   made; only allowlisted fields are serialized; and a link never changes
   capabilities.
2. Prove repository pagination, bounded search, empty result, one-person/many-
   account non-selection, null business fields, and state precedence for
   missing/ambiguous/revoked/quarantined links/emails/assignments.
3. Prove the Worker route's `mutation:false` read behavior and absence of the
   protected roster route in the V5 Staff Directory load path.
4. Prove V5 authorized rendering, safe empty rendering, and denied navigation
   with no canonical-directory request when capability is absent. The existing
   browser fixture's `/api/admin/access/directory` response is not evidence for
   this new endpoint and must not be reused as such.

Verification after implementation is portable Node 22.23.2 focused Vitest for
the owned unit/route/V5 files, scoped ESLint and Prettier, Node syntax for
changed server modules, `git diff --check`, privacy/static scans for forbidden
field names, complete logical-diff review, commit/push, and local/upstream/live
parity. No build, provider access, browser live probe, migration, or deployment
is part of this slice unless separately authorized.

## Migration, rollback, and stop conditions

The plan uses the existing additive 0031 schema only; it introduces no DDL,
backfill, import, or migration execution. The separate migration-0031 release
decision remains pending. Rollback is a normal non-force Git revert of this
read-only projection; no canonical data changes exist to reverse.

STOP CONDITIONS: any need to decrypt or disclose a protected envelope, email
fingerprint, assignment fingerprint, raw provenance, source row, secret, or
capability; an audience broadening; any inferred privilege; a needed schema
change; provider/private-source access; unexpected path/worktree divergence;
or a failed regression/static/privacy/governance check. These conditions block
implementation rather than permitting a fallback to the legacy roster or
Accounts-and-Access directory.
