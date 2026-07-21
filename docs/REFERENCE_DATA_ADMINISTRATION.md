# Authorized Reference-Data Administration

Status: Slice 10 repository implementation contract. It does not authorize a deployment, migration, production import, or operational data write.

## Purpose

The Reference Administration workspace replaces raw-sheet editing for controlled organization, committee, venue, equipment, routing, lifecycle, permission, and synchronization-health records. All server DTOs are allowlisted and bounded. The browser never decides whether a user is an administrator and never applies a change locally in Apps Script mode.

## Permission and ownership matrix

| Domain | Read | Direct change | Separate review | Ownership rule |
|---|---|---|---|---|
| Organization | `reference.manage` | add, update, archive, restore | optional policy escalation | administrator-owned reference |
| People and memberships | `reference.manage` | none | none | authoritative roster only; display is read-only |
| Committees | `reference.manage` | add, update, archive, restore | optional policy escalation | permanent IDs remain limited to the three canonical committees |
| Venues and equipment | `reference.manage` | add, update, archive, restore | not normally required | facilities/inventory owner validates content; administrator records it |
| Routing | `reference.manage` | none when cross-office values change | required | reviewer must differ from requester |
| Lifecycle vocabulary | `reference.manage` | add, update, archive, restore | optional policy escalation | non-destructive versioning only |
| Permissions | `reference.manage` | emergency revocation only | `access.admin` required for grant, activation, role, or committee-scope expansion | no requester or reviewer self-escalation; roster identity remains unchanged |
| Sync health | `reference.manage` | none | none | read-only operational health projection |

`DIRECTOR` is operational oversight, not system administration. Only canonical `ADMINISTRATOR` capability mappings receive `reference.manage` and `access.admin` by default.

## Change protocol

1. The client requests a bounded domain projection from `api_getReferenceAdminWorkspace`.
2. The server allowlists editable fields and returns no email, phone, supplier tax, Drive link, authorization-override, secret, or raw-note columns.
3. The client submits a preview request. The server re-reads the target, validates the expected numeric revision, effective dates, dependencies, canonical committees, and field ownership, then returns an explicit before/after comparison.
4. A confirmed safe reference change is submitted with one idempotency key and a script lock. The change first enters `APPLYING`; the replacement revision is appended before the exact expected revision is marked `SUPERSEDED`. No historical row is deleted.
5. Permission escalation and cross-office routing append a `PENDING_REVIEW` change record but do not affect the target.
6. A different authorized reviewer may approve or reject from an explicit before/after comparison. Approval requires a reason, revalidates the stored controlled payload, denies a grant targeting the reviewer, and rechecks the target revision under lock. A stale target returns `REFERENCE_ADMIN_REVISION_CONFLICT` and leaves the proposal pending.
7. Every applied change writes status history and a before/after audit record. Replays return the recorded result and append no second revision.
8. A failure after the apply boundary remains visibly `APPLYING`; the same idempotency key returns `REFERENCE_ADMIN_RECONCILIATION_REQUIRED` instead of attempting a duplicate write or claiming success.

## Effective dates and dependencies

- Stable IDs do not change across revisions.
- Exactly one non-`SUPERSEDED` revision is the administrative current record. Multiple current revisions fail closed with `REFERENCE_ADMIN_RECONCILIATION_REQUIRED`.
- Applying a replacement appends the new `ACTIVE` or `ARCHIVED` revision before superseding the exact expected revision. An append failure therefore preserves the previous current record; a later supersede failure remains detectable as a reconciliation condition.
- Archive is a compensating lifecycle revision, never permanent deletion.
- Active composite request references block venue/equipment archive.
- Active references block route archive.
- Stored request snapshots remain immutable and continue to describe the version originally submitted.

## Emergency access

The emergency path is revocation-only. It requires `active=false`, `emergencyRevocation=true`, and a bounded reason. The payload cannot carry even a dormant role or committee grant. It cannot activate access, assign a role, add a committee, or grant a capability. The emergency action still uses revision, idempotency, lock, history, and audit controls.

## Schema and rollout

- `14_USERS_ACCESS.Admin_Revision` is a numeric optimistic-concurrency token dedicated to administrative permission changes. It does not replace the existing authorization mapping/source revision fields.
- `27_REFERENCE_ADMIN_RECORDS` stores versioned organization, committee, and lifecycle records not owned by a more specific table.
- `28_REFERENCE_ADMIN_CHANGES` stores direct-change evidence and pending/reviewed proposals.
- Venue/equipment and routing revisions continue in `25_VENUE_EQUIPMENT_REFERENCES` and `26_VENUE_EQUIPMENT_ROUTES`.
- `HAU_REFERENCE_ADMIN_WRITES_ENABLED` defaults to `false`. Reads remain available to authorized administrators while all writes fail closed.

Before a later authorized activation: run schema validation, take an approved backup, dry-run any import, reconcile stable IDs/revisions/aliases/dependencies, enable one domain at a time, and exercise rollback. This repository slice performs none of those external actions.

## Rollback

1. Set `HAU_REFERENCE_ADMIN_WRITES_ENABLED=false`; this immediately retains read-only visibility and blocks new direct or review actions.
2. Preserve `27_REFERENCE_ADMIN_RECORDS`, `28_REFERENCE_ADMIN_CHANGES`, history, audit, and all specific reference revisions.
3. If a business value must be restored, submit a new compensating revision from the last approved snapshot. Do not delete the incorrect or superseded revision.
4. For code rollback, revert the focused Slice 10 commit while keeping the additive tabs/columns and recorded history.

## Verification evidence

Synthetic domain, Apps Script VM, adapter, and browser tests cover non-admin endpoint denial through the canonical operation map, DTO allowlists, roster ownership, controlled fields, stale revisions, direct replay, script locking, append-before-supersede failure safety, reconciliation-required retries, dependencies, archive/restore, effective dates, requester and reviewer self-escalation denial, reviewer separation, actionable pending review, emergency revocation, mobile/desktop forms, and before/after confirmation. Real institutional records are not used.
