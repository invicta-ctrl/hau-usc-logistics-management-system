# Migration and Reconciliation

Migration is non-destructive and administrator-controlled.

1. **Discovery:** scan all three quantity blocks in `MAIN INVENTORY`; scan the other legacy tabs for reference names; preserve source sheet, row, block/column, exact name, quantity, and unit.
2. **Normalization:** propose normalized names, aliases, category, stock area, handling, unit, duplicate group, and notes in `19_MIGRATION_MAP`. No automatic merge.
3. **Verification:** report date-serial/invalid quantities, missing/conflicting units, zero stock, duplicate names, and unmatched FAST MOVING/FOR SALE/TO BUY entries.
4. **Approval:** DOL explicitly marks mappings `APPROVED` and verification `VERIFIED` where justified.
5. **Apply/freeze:** `applyApprovedMigration()` applies mapping fields, audits each decision, records migration version/counts, and blocks rerun.

`VERIFY` remains fail-closed until an approved reconciliation action. Original values are never silently corrected. The chosen v1 baseline preserves opening quantities in `01_ITEM_MASTER`; subsequent movements are append-only ledger rows.

Reconciliation compares legacy discovery count, item-master count, missing source mappings, VERIFY and zero counts, duplicate groups, conflicting units, reference-list matches, categories, and stock areas. Dry-run performs zero destructive changes. Keep the JSON report with the launch evidence pack.
