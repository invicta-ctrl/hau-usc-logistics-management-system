# Google Apps Script Handoff

The current prototype does not call Apps Script. `apps-script-service.js` documents client method mappings only.

## Required server action pattern

Every irreversible Apps Script function must:

1. Resolve institutional identity and role.
2. Validate the command schema and reject unknown fields.
3. Acquire a scoped `LockService` lock.
4. Load current records.
5. Validate transition, permission, reservation, and balance.
6. Check the idempotency key and return the original result if already posted.
7. Allocate server IDs while locked.
8. Append related rows in one batch.
9. Write the audit record with correlation ID.
10. Release the lock in `finally`.
11. Return a normalized DTO with no restricted fields.

## Suggested Sheets/entities

- Users & Roles
- Event Series
- Events
- Requests
- Request Lines
- Inventory Items
- Ledger Transactions
- Reservations
- Lending Tickets
- Restock Requests
- Restock Receipts
- Deliverables
- Deliverable Receipts
- Suppliers
- Canvass References
- Evidence Files
- Event Tasks
- Audit Log
- Idempotency Records
- Configuration

Google Sheets is a reporting/export destination and prototype persistence option, not an excuse to keep mutable stock totals. Quantity remains derived from Ledger Transactions and active Reservations.

## Evidence production rules

Validate MIME signature server-side, enforce extension/size/image-dimension limits, normalize filenames, route to controlled least-privilege Drive folders, store uploader identity/timestamp/access class, and implement retention/deletion policy. Browser-provided MIME type is advisory only.

## Security

The server resolves identity and permission for every action. UI hiding is not security. Public/requester DTOs contain only permitted events, limited catalog suggestions, units, and the requester's own result. Never expose staff records, full ledger, supplier TINs, borrower histories, audits, or admin operations.
