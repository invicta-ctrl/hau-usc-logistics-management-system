# Read-only Schema Validation — 2026-07-12

No write operation was performed.

## Production and backup

- Production title/ID matched the supplied target; timezone: `Asia/Manila`.
- Backup contained exactly the four legacy tabs.
- All four production legacy tabs matched the backup value-for-value at inspection time.

| Legacy tab | Rows | Non-empty cells | Comparison |
|---|---:|---:|---|
| MAIN INVENTORY | 261 | 1,239 | matched |
| FAST MOVING ITEMS | 114 | 842 | matched |
| FOR SALE ITEMS | 0 data rows | 0 | matched |
| TO BUY | 40 | 260 | matched |

## Prepared backend

All tabs `00_README` through `19_MIGRATION_MAP` were present and their header rows were inspected. `01_ITEM_MASTER` contained 397 records (`ITM-0001` through `ITM-0397`): 394 `ACTIVE`, 3 `VERIFY`, 2 zero quantity, and 0 missing unit. Source-block totals were A–C: 69, E–G: 257, I–K: 71.

Known suspicious date-serial quantities, including values 46026 and 46024, remained marked `VERIFY`. No value was corrected.

## Configuration gaps

`SPREADSHEET_ID`, timezone, upload limit, allowed MIME types, and `APP_ENV=STAGING` were valid. Root, receipts, canvass, release, and deliverable Drive values were `TO_BE_ASSIGNED`; lending and archive keys were absent. These are launch blockers. `setupDatabase()` can add the missing config keys non-destructively after administrator review.
