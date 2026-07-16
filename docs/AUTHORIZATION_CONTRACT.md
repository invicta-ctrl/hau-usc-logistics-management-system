# HAU-USC Canonical Authorization Contract

Status: Slice 3 repository contract, not an external activation instruction.

## Canonical vocabulary

The server owns these immutable role IDs and labels:

- `REQUESTER` — Requester
- `DOL_STAFF` — DOL Staff
- `COMMITTEE_HEAD` — Committee Head
- `DIRECTOR` — DOL Director
- `ADMINISTRATOR` — Administrator
- `READ_ONLY_AUDITOR` — Read-only Auditor

There are exactly three permanent committee IDs:

- `COM_FOOD` — Food Committee
- `COM_INVENTORY_PANTRY` — Inventory and Pantry Committee
- `COM_MATERIALS` — Materials Committee

Legacy labels are accepted only through explicit mappings. Unknown or ambiguous labels remain unreconciled and do not receive canonical authorization.

## Decision model

Visibility, action capability, and entity scope are separate decisions.

- Requesters use self scope for request creation and public reference selection.
- DOL Staff and Committee Heads use committee scope. Committee Heads do not receive release capability by default.
- Directors have all-committee oversight and operational capabilities defined by the server registry; this is separate from system administration.
- Administrators manage reference data, access, and system operations. Operational release is not granted merely because an account is an Administrator.
- Read-only Auditors receive audit visibility only.
- Multiple committee memberships are represented as separate rows in `20_USER_COMMITTEE_SCOPE`; a single display label is not treated as authoritative membership.

Every server operation is checked against the canonical capability registry. Inactive users, unknown roles, missing committee scope, invalid mappings, unresolved entity scope, and out-of-scope entities fail closed with a safe reason code and generic message.

## Bootstrap contract

Canonical current-user metadata is limited to:

`contract`, `contractVersion`, `modelVersion`, `roleId`, `roleLabel`, `scopeMode`, `committeeIds`, `committees`, `capabilities`, `mappingStatus`, and `active`.

The browser validates this allowlist and projects only server-provided capabilities into legacy permission booleans. It does not turn a hidden or visible control into authorization. The essential/current-user bootstrap does not include credentials, private contacts, roster data, student records, supplier tax values, evidence links, or operational records. Authorized internal lazy modules remain session-operational, non-cacheable, and capability/scope filtered; request-only modules remain sanitized.

## Additive rollout and reconciliation

`HAU_AUTHORIZATION_CONTRACT_VERSION` is a Script Property. Missing or blank values resolve to legacy model v1; explicit `2` selects the canonical model. This checkpoint does not activate v2 in an external environment.

The additive schema appends canonical fields to `14_USERS_ACCESS` and defines `20_USER_COMMITTEE_SCOPE`. `runAuthorizationMappingDryRun()` reports counts and safe row-number issues without changing records. `applyAuthorizationMapping()` requires an explicit `AUTHORIZATION_MAPPING_APPROVED=TRUE` configuration value, requires a clean dry run, writes only canonical mapping fields, preserves legacy labels, and reports zero destructive or immutable-history changes. No migration, roster import, Sheet write, or deployment was run for this repository checkpoint.

## Verification

Synthetic browser and Apps Script VM tests cover role aliases, the three-committee bound, Committee Head scope, Director oversight, inactive and unknown identity denial, Administrator/reference separation, safe denial messages, client capability projection, and mapping dry-run findings. Generated output is refreshed only through the repository generator/build path.

## Reference administration separation of duties

The Slice 10 operation map requires `reference.manage` to read, preview, and submit controlled reference changes, and `access.admin` to review permission/routing proposals. Permission activation, role assignment, committee-scope expansion, and cross-office routing do not apply at submission: they create a pending proposal. The reviewer must be a different user, and approval rechecks the target revision. Administrators cannot grant or expand their own access. Emergency access is revocation-only and audited. Roster-owned identity and membership fields remain read-only in the application.
