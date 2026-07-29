# Migration and Reconciliation

Migration is non-destructive and administrator-controlled.

1. **Discovery:** scan all three quantity blocks in `MAIN INVENTORY`; scan the other legacy tabs for reference names; preserve source sheet, row, block/column, exact name, quantity, and unit.
2. **Normalization:** propose normalized names, aliases, category, stock area, handling, unit, duplicate group, and notes in `19_MIGRATION_MAP`. No automatic merge.
3. **Verification:** report date-serial/invalid quantities, missing/conflicting units, zero stock, duplicate names, and unmatched FAST MOVING/FOR SALE/TO BUY entries.
4. **Approval:** DOL explicitly marks mappings `APPROVED` and verification `VERIFIED` where justified.
5. **Apply/freeze:** `applyApprovedMigration()` applies mapping fields, audits each decision, records migration version/counts, and blocks rerun.

`VERIFY` remains fail-closed until an approved reconciliation action. Original values are never silently corrected. The chosen v1 baseline preserves opening quantities in `01_ITEM_MASTER`; subsequent movements are append-only ledger rows.

Reconciliation compares legacy discovery count, item-master count, missing source mappings, VERIFY and zero counts, duplicate groups, conflicting units, reference-list matches, categories, and stock areas. Dry-run performs zero destructive changes. Keep the JSON report with the launch evidence pack.

## Version 0.5.0 additive schema migration

This migration does not replace sheets, rebuild item rows, or modify the four legacy tabs.

1. Append missing `01_ITEM_MASTER` fields after every pre-existing column: `Catalog_Type`, `Storage_Location`, `Reorder_Threshold`, `Lending_Audience`, `Default_Loan_Days`, `Maximum_Loan_Qty`, `Approval_Required`, `Updated_At`, `Updated_By`, and `Notes`.
2. Append `Can_Manage_Catalog` to `14_USERS_ACCESS` without reordering prior permission columns.
3. Add `DATA_REVISION` and `DATA_REVISION_UPDATED_AT` to `17_CONFIG` when missing.
4. Preserve every existing value, user, Drive row, audit/history record, and operational row. Repeated setup must not duplicate columns/keys or reset reviewed values.
5. Fill only blank new item fields with least-privilege defaults: derive catalog type from stock area; use `TO_BE_ASSIGNED` storage; use reorder threshold zero; make active circulating items `USC_STAFF_ONLY`; make VERIFY/inactive/archived/non-circulating items `NOT_AVAILABLE_FOR_LENDING`; use three days for returnable items; use a conservative maximum quantity of one for circulating items; and require approval.
6. Never infer student access from legacy handling or stock. `STUDENTS_AND_STAFF` requires an explicit reviewed catalog decision.
7. Preserve every `VERIFY` item and its exact source sheet, row, block, name, quantity, and unit. New fields do not make a VERIFY item transactable.

Run the migration against a backed-up staging spreadsheet first, validate headers and defaults, install the operational edit trigger, and complete functional/reconciliation acceptance. Production requires a fresh backup and the identical accepted code/defaults. It is safe to migrate schema before activating the 0.5.0 web deployment because Version 9 ignores appended fields and revision rows.

Rollback re-points the web deployment to the preceding immutable version. It does not delete appended columns, config rows, defaults, catalog edits, ledger movements, audit/history records, or the existing `LND-2026-0001` production ticket. If a correction is needed, use an explicit audited forward migration or adjustment.
