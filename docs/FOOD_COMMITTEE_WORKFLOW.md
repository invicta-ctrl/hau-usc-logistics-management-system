# Food Committee Workflow

Status: Accepted Slice 7 execution contract
Version: 1
Timezone: `Asia/Manila`

## Purpose and boundary

Slice 7 specializes only the `FOOD` child of a composite Event Logistics
request. The parent remains server-owned, and Materials and Venue & Equipment
children retain their Slice 6 behavior. Food reviewers receive bounded parent
context plus the Food child only.

This workflow must not store dietary names, diagnoses, medical narratives,
private supplier contacts, supplier TINs, bank/payment details, or accounting
amounts. Dietary data is an operational aggregate, never a person-level record.

## Version 1 field dictionary

| Field                      | Rule                                                                                                     |
| -------------------------- | -------------------------------------------------------------------------------------------------------- |
| `serviceClass`             | Required: `BULK_NON_PERISHABLE_OR_CATERING` or `PERISHABLE_FOOD`.                                        |
| `expectedHeadcount`        | Required positive integer. It estimates people, not ordered units.                                       |
| `requiredServings`         | Required positive integer. It remains distinct from headcount; no ratio is inferred.                     |
| `serviceStartAt`           | Required ISO date-time. Operational comparisons use Asia/Manila.                                         |
| `serviceEndAt`             | Optional ISO date-time; when present it cannot precede the start.                                        |
| `serviceLocation`          | Required operational location snapshot, 120 characters maximum.                                          |
| `dietarySummary`           | Required: `NONE_REPORTED`, `ATTENTION_REQUIRED`, or `PENDING_CONFIRMATION`.                              |
| `dietaryAttentionServings` | Integer from 0 through required servings; positive only when attention is required.                      |
| `sourcingMode`             | Required: `PANTRY_STOCK_REVIEW`, `CANVASS_REQUIRED`, or `APPROVED_EXTERNAL_SOURCE`.                      |
| `sourceReference`          | Optional opaque operational reference, 120 characters maximum; required for an approved external source. |

All Food detail is stored as `food.version = 1`. Unknown fields, client-owned
workflow states, client evidence claims, and client-derived lead-time results
are rejected or ignored at the server boundary.

## Lead time and prerequisites

- Bulk/non-perishable food and catering require 10 business days (two business
  weeks).
- Perishable food requires 5 business days (one business week).
- The calculated lead-time status is `MET`, `SHORT`, or `UNKNOWN`, with an
  explicit required-business-day value. Exam-week exclusion remains an
  operational calendar input; when unavailable the repository calculation does
  not pretend to exclude unknown dates.
- A short/unknown lead time produces an attention flag but does not silently
  alter the event date or create an approval.
- `CANVASS_REQUIRED` must become `CONFIRMED` before ready-for-handoff.
- `APPROVED_EXTERNAL_SOURCE` requires a source reference.
- Completion requires an uploaded `DELIVERABLE_DELIVERY_PROOF` evidence record
  linked to the Food composite component. A client-provided ID alone is not
  proof.

## Authorization and lifecycle

- Food reads and writes require internal review capability scoped to
  `COM_FOOD`, except Director all-committee operational oversight supplied by
  the existing authorization contract. Administrator system authority does not
  imply Food operational access.
- The Food queue returns only Food children, never sibling child payloads.
- Mutations require idempotency, a script lock, server-side revision checking,
  status history, and audit logging.
- Generic child lifecycle remains:
  `FOR_REVIEW -> ACCEPTED -> IN_PROGRESS -> READY_FOR_HANDOFF -> COMPLETED`,
  with the accepted partial/reject/cancel/reopen paths.
- Food prerequisites are checked again on the server before
  `READY_FOR_HANDOFF` and `COMPLETED`.

## Rollback and migration

No historical backfill or external sheet migration belongs to Slice 7. New
Food submissions are controlled by a fail-closed Food feature flag. Disabling
that flag stops new Food specialization while retaining versioned stored Food
children for safe reading and service continuity. Code rollback uses a focused
revert; stored history and evidence are never deleted.
