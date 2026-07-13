# Operator Checklist

## Start of shift

- Use the official restricted deployment and institutional account; confirm the environment indicator is expected.
- Confirm sync/health is normal and no unresolved stop-work notice exists.
- Review requests awaiting decision, overdue loans, low/out-of-stock/VERIFY items, partial releases/receipts, missing evidence, and failed/quarantined uploads.
- If data appears stale, use Refresh. Do not submit a mutation merely to force synchronization.
- Stop and contact an administrator on schema, Drive, authorization, environment, or repeated lock/configuration error.

## Review a request

1. Verify requester, event/type, dates, purpose, each line, unit, and duplicate/split context.
2. For exact catalog lines, inspect live availability, VERIFY/status, handling, and policy. Browser availability is advisory until the command succeeds.
3. Accept/reject with a clear note. Acceptance is locked and routes all lines; do not manually create reservations in Sheets.
4. Confirm the refreshed status, reservations/procurement routing, correlation/audit record, and no unexpected sibling change.

## Lending

1. Search and select the exact eligible item; verify audience, handling, available-to-promise, maximum quantity, and due date.
2. Record only the approved minimum borrower identity/contact data and physical institutional-ID verification context.
3. Create the ticket for review; no stock moves yet.
4. Approve only after rechecking eligibility and stock; the reservation makes it ready to claim.
5. At handoff, verify the person/item/quantity/condition and attach approved evidence if required. Confirmation consumes the reservation and appends the outbound movement.
6. On return, inspect condition/quantity, record notes/evidence, and confirm once. The system appends an inbound movement; never edit the issue.
7. Escalate overdue, damaged, missing, or disputed items under DOL policy. Do not fabricate a return to clear a ticket.

## Release desk

1. Match recipient, request, exact lines, units, active reservation, and quantity physically present.
2. Enter only the quantity handed over now; a partial release leaves the remainder open.
3. Obtain approved recipient confirmation/evidence and submit once.
4. Verify refreshed line/request status, release ID, reservation consumption, ledger movement, and evidence metadata.
5. On recorded-but-not-refreshed warning, do not resubmit. Refresh and reconcile by correlation ID.

## Restock receiving

1. Select the exact restock request and source line; verify item, unit, ordered/previously received/remaining quantities.
2. Count received, damaged, and rejected quantities separately. Do not exceed the remaining authorized quantity.
3. Select the supplier and record invoice/receipt status, approved price, storage context, and notes.
4. Upload only approved receipt evidence. Keep personal/tax values out of filenames and public notes.
5. Submit once and verify one immutable receipt, one inbound movement, cumulative totals, and unchanged sibling lines.

## Procurement and deliverables

- Link each canvass to the correct request line/deliverable/restock and supplier; verify price, unit, checked time, source, receipt capability, and evidence.
- Select a preferred canvass only with the required review/reason; preference is not budget approval or receipt.
- Follow only allowed deliverable transitions. Do not skip states by editing a Sheet.
- Receive cumulative quantities against the exact deliverable and preserve damaged/rejected context.
- Transfer an event item to catalog inventory only with admin authorization, semantic equivalence confirmation, compatible unit, sufficient balance, and an audited merge reason. The paired ledger movements preserve provenance.

## Inventory and catalog

- Treat on-hand as opening balance plus posted ledger, and ATP as on-hand minus active reservations.
- Never transact a VERIFY, inactive, or archived item.
- Catalog metadata/storage updates do not change quantity or legacy provenance.
- Archive/restore/unit changes may be blocked by active dependencies; resolve them through the workflow.
- A physical count difference requires an authorized cycle-count adjustment and evidence/reason, never a ledger edit.

## Evidence

- Accept only JPG, PNG, WEBP, or PDF within 10 MB in the current release.
- Verify the correct related entity/type before upload; do not use the evidence endpoint as general storage.
- Do not rename files with person/contact/tax data. The server generates a safe name.
- A duplicate digest for the same entity may return the existing evidence; confirm the link rather than uploading repeatedly.
- Escalate quarantine/metadata failure to an administrator with correlation ID; do not move Drive files manually.

## End of shift

- Reconcile today's requests, releases, lending handoffs/returns, receipts, adjustments, transfers, evidence, and idempotent replays.
- Review unresolved errors, partial workflows, overdue tickets, quarantine, and updates-available warnings.
- Confirm scheduled backup/trigger health is owned by the administrator; do not run ad hoc production setup.
- Hand over entity references, statuses, safe correlation IDs, and next actions through the approved restricted channel. Exclude personal data and resource IDs unless the recipient is authorized and needs them.

## Stop-work conditions

Stop new writes and escalate immediately if:

- unauthorized/request-only users can see internal data or invoke a staff action;
- inventory balance, reservation, ledger, or sibling-line behavior is inconsistent;
- VERIFY items transact;
- Drive falls back, evidence appears in the wrong/broadly shared folder, or bytes exist without metadata;
- the environment, deployment version, schema, source parity, or operational/backup routing is uncertain;
- repeated timeouts make it unclear whether commands were recorded;
- secrets, personal records, supplier tax data, or resource IDs appear in public output.

Preserve evidence, stop writes, and follow [Operations and Deployment Runbook](OPERATIONS_AND_DEPLOYMENT_RUNBOOK.md). Do not delete or edit posted records.
