# v0.7.0 Production Inventory Reconciliation

- Approved source rows: 397.
- Imported: 397; rejected: 0.
- Physical-classification state: 397 `NEEDS_CLASSIFICATION`.
- Lending state: all 397 fail closed and are not lendable until an authorized
  physical review records handling, audience, limits, and asset instances where
  required.
- Ledger openings are server-owned and reconciled; no negative balance or
  foreign-key violation remains.
- The import replay is idempotent and created no duplicate source row.
- The two controlled production smoke items are archived and non-lendable;
  their immutable history is retained.

Authorized Inventory staff classify items through the protected website. They
must not infer physical condition or lending eligibility from the import.
