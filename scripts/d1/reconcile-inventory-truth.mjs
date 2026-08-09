import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { fileURLToPath } from 'node:url';
import { resolvePrivatePath } from '../private-path.mjs';
import { restoreAndVerifyD1Export } from './verify-d1-export.mjs';

const repoRoot = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));
const EXPECTED_SCHEMA = '30';
const EXPECTED_MIGRATION = '0030_production_access_and_operations.sql';
const ENVIRONMENTS = new Set(['LOCAL_TEST', 'ISOLATED_STAGING', 'PRODUCTION_READ_ONLY']);
const SHA = /^[0-9a-f]{40}$/u;
const EPSILON = 0.000001;

const APPEND_ONLY_TRIGGERS = Object.freeze([
  'inventory_ledger_no_update',
  'inventory_ledger_no_delete',
  'reservation_consumption_no_update',
  'reservation_consumption_no_delete',
  'status_history_no_update',
  'status_history_no_delete',
  'audit_log_no_update',
  'audit_log_no_delete',
  'release_corrections_no_update',
  'release_corrections_no_delete',
  'inventory_asset_movements_no_update',
  'inventory_asset_movements_no_delete',
  'inventory_asset_maintenance_no_update',
  'inventory_asset_maintenance_no_delete',
  'inventory_classification_history_no_update',
  'inventory_classification_history_no_delete',
  'evidence_restore_history_no_update',
  'evidence_restore_history_no_delete',
  'event_activity_history_no_update',
  'event_activity_history_no_delete',
]);

const count = (database, sql) => Number(database.prepare(sql).get()?.count ?? 0);
const value = (database, sql, fallback = '') => String(database.prepare(sql).get()?.value ?? fallback);
const tableExists = (database, name) =>
  Number(
    database
      .prepare("SELECT COUNT(*) AS count FROM sqlite_master WHERE type IN ('table', 'view') AND name = ?")
      .get(name)?.count ?? 0,
  ) === 1;

const CHECKS = Object.freeze([
  {
    id: 'BALANCE_VIEW_MISMATCH',
    area: 'INVENTORY_BALANCE_TRUTH',
    sql: `
      WITH ledger AS (
        SELECT item_id, COALESCE(SUM(signed_quantity), 0) AS on_hand
        FROM inventory_ledger WHERE status = 'POSTED' GROUP BY item_id
      ), consumed AS (
        SELECT reservation_id, COALESCE(SUM(quantity), 0) AS consumed
        FROM reservation_consumptions GROUP BY reservation_id
      ), reserved AS (
        SELECT reservation.item_id,
          COALESCE(SUM(MAX(reservation.quantity - COALESCE(consumed.consumed, 0), 0)), 0) AS reserved
        FROM reservations reservation
        LEFT JOIN consumed ON consumed.reservation_id = reservation.id
        WHERE reservation.status = 'ACTIVE'
        GROUP BY reservation.item_id
      )
      SELECT COUNT(*) AS count
      FROM inventory_items item
      JOIN inventory_balances balance ON balance.item_id = item.id
      WHERE ABS(balance.on_hand - COALESCE((SELECT on_hand FROM ledger WHERE ledger.item_id = item.id), 0)) > ${EPSILON}
         OR ABS(balance.reserved - COALESCE((SELECT reserved FROM reserved WHERE reserved.item_id = item.id), 0)) > ${EPSILON}
         OR ABS(balance.available_to_promise - (balance.on_hand - balance.reserved)) > ${EPSILON}`,
  },
  {
    id: 'NEGATIVE_OR_IMPOSSIBLE_BALANCE',
    area: 'INVENTORY_BALANCE_TRUTH',
    sql: `SELECT COUNT(*) AS count FROM inventory_balances
          WHERE on_hand < -${EPSILON} OR reserved < -${EPSILON}
             OR available_to_promise < -${EPSILON}`,
  },
  {
    id: 'DIRECT_OPENING_QUANTITY',
    area: 'INVENTORY_BALANCE_TRUTH',
    sql: `SELECT COUNT(*) AS count FROM inventory_items WHERE ABS(opening_quantity) > ${EPSILON}`,
  },
  {
    id: 'RESERVATION_OVERCONSUMED',
    area: 'RESERVATIONS',
    sql: `SELECT COUNT(*) AS count
          FROM reservations reservation
          WHERE COALESCE((SELECT SUM(quantity) FROM reservation_consumptions consumption
                          WHERE consumption.reservation_id = reservation.id), 0)
                > reservation.quantity + ${EPSILON}`,
  },
  {
    id: 'TERMINAL_PARENT_ACTIVE_REMAINDER',
    area: 'RESERVATIONS',
    sql: `SELECT COUNT(*) AS count FROM (
            SELECT reservation.id
            FROM reservations reservation
            JOIN request_lines line ON line.id = reservation.request_line_id
            WHERE reservation.status = 'ACTIVE'
              AND line.status IN ('CANCELLED', 'REJECTED', 'COMPLETED')
              AND reservation.quantity - COALESCE((SELECT SUM(quantity)
                    FROM reservation_consumptions consumption
                    WHERE consumption.reservation_id = reservation.id), 0) > ${EPSILON}
            UNION ALL
            SELECT reservation.id
            FROM reservations reservation
            JOIN lending_tickets ticket ON ticket.id = reservation.lending_ticket_id
            WHERE reservation.status = 'ACTIVE'
              AND ticket.status IN ('CANCELLED', 'REJECTED', 'COMPLETED', 'RETURNED')
              AND reservation.quantity - COALESCE((SELECT SUM(quantity)
                    FROM reservation_consumptions consumption
                    WHERE consumption.reservation_id = reservation.id), 0) > ${EPSILON}
          )`,
  },
  {
    id: 'REQUEST_RELEASE_COUNTER_MISMATCH',
    area: 'REQUEST_RELEASE',
    sql: `SELECT COUNT(*) AS count
          FROM request_lines line
          WHERE ABS(line.released_quantity - (
            COALESCE((SELECT SUM(confirmation.quantity) FROM release_confirmations confirmation
                      WHERE confirmation.request_line_id = line.id), 0)
            - COALESCE((SELECT SUM(correction.quantity)
                        FROM release_corrections correction
                        JOIN release_confirmations confirmation
                          ON confirmation.id = correction.release_confirmation_id
                        WHERE confirmation.request_line_id = line.id), 0)
          )) > ${EPSILON}`,
  },
  {
    id: 'REQUEST_RELEASE_EFFECT_MISMATCH',
    area: 'REQUEST_RELEASE',
    sql: `SELECT COUNT(*) AS count
          FROM release_confirmations confirmation
          WHERE NOT (
                  confirmation.released_by = 'SYSTEM-IMPORT'
                  AND confirmation.recipient_name = 'REDACTED_SOURCE_RECIPIENT'
                  AND EXISTS (SELECT 1 FROM imported_source_rows source
                              WHERE source.target_table = 'release_confirmations'
                                AND source.import_status IN ('IMPORTED', 'UNCHANGED')
                                AND (confirmation.id = source.target_id OR (
                                  substr(confirmation.id, 1, length(source.target_id) + 1) = source.target_id || '-'
                                  AND substr(confirmation.id, length(source.target_id) + 2) <> ''
                                  AND substr(confirmation.id, length(source.target_id) + 2) NOT GLOB '*[^0-9]*')))
                )
            AND NOT (
                  confirmation.id LIKE 'SBX-G____-REL-%'
                  AND confirmation.notes = (SELECT value FROM app_metadata WHERE key = 'sandbox_seed_version')
                  AND (SELECT value FROM app_metadata WHERE key = 'sandbox_scope') = 'SYNTHETIC_ONLY'
                )
            AND ((SELECT COUNT(*) FROM inventory_ledger ledger
                 WHERE ledger.transaction_type = 'ISSUE'
                   AND ledger.related_entity_type = 'RELEASE'
                   AND ledger.related_entity_id = confirmation.release_group_id
                   AND ledger.idempotency_key = confirmation.idempotency_key
                   AND ledger.item_id = confirmation.item_id
                   AND ledger.unit = confirmation.unit
                   AND ABS(ledger.quantity - confirmation.quantity) <= ${EPSILON}
                   AND ledger.direction = 'OUT'
                   AND ABS(ledger.signed_quantity + confirmation.quantity) <= ${EPSILON}
                   AND ledger.status = 'POSTED') <> 1
             OR ABS(confirmation.quantity - COALESCE((
                  SELECT SUM(consumption.quantity)
                  FROM reservation_consumptions consumption
                  JOIN reservations reservation ON reservation.id = consumption.reservation_id
                  WHERE consumption.related_entity_type = 'RELEASE'
                    AND consumption.related_entity_id = confirmation.release_group_id
                    AND reservation.request_line_id = confirmation.request_line_id
                ), 0)) > ${EPSILON})`,
  },
  {
    id: 'RELEASE_CORRECTION_EFFECT_MISMATCH',
    area: 'REQUEST_RELEASE',
    sql: `SELECT COUNT(*) AS count
          FROM release_corrections correction
          JOIN release_confirmations confirmation ON confirmation.id = correction.release_confirmation_id
          LEFT JOIN inventory_ledger ledger ON ledger.id = correction.ledger_transaction_id
          LEFT JOIN inventory_ledger original
            ON original.idempotency_key = confirmation.idempotency_key
           AND original.related_entity_type = 'RELEASE'
           AND original.related_entity_id = confirmation.release_group_id
          WHERE ledger.id IS NULL
             OR ledger.transaction_type <> 'RELEASE_CORRECTION'
             OR ledger.related_entity_type <> 'RELEASE_CORRECTION'
             OR ledger.related_entity_id <> correction.id
             OR original.id IS NULL
             OR ledger.reversal_of IS NOT original.id
             OR ledger.item_id <> confirmation.item_id
             OR ledger.unit <> confirmation.unit
             OR ABS(ledger.quantity - correction.quantity) > ${EPSILON}
             OR ABS(ledger.signed_quantity - correction.quantity) > ${EPSILON}
             OR ledger.status <> 'POSTED'`,
  },
  {
    id: 'LENDING_HANDOFF_EFFECT_MISMATCH',
    area: 'LENDING_CUSTODY',
    sql: `SELECT COUNT(*) AS count
          FROM lending_handoffs handoff
          JOIN lending_tickets ticket ON ticket.id = handoff.lending_ticket_id
          WHERE NOT (
                  ticket.created_by = 'SYSTEM-IMPORT'
                  AND handoff.released_by = 'SYSTEM-IMPORT'
                  AND handoff.idempotency_key = 'IMPORT:HANDOFF:' || ticket.id
                  AND EXISTS (SELECT 1 FROM imported_source_rows source
                              WHERE source.target_table = 'lending_tickets'
                                AND source.target_id = ticket.id
                                AND source.import_status IN ('IMPORTED', 'UNCHANGED'))
                )
            AND NOT (
                  handoff.id LIKE 'SBX-G____-HND-%'
                  AND handoff.notes = (SELECT value FROM app_metadata WHERE key = 'sandbox_seed_version')
                  AND (SELECT value FROM app_metadata WHERE key = 'sandbox_scope') = 'SYNTHETIC_ONLY'
                )
            AND ((SELECT COUNT(*) FROM inventory_ledger ledger
                 WHERE ledger.related_entity_type = 'LENDING'
                   AND ledger.related_entity_id = ticket.id
                   AND ledger.idempotency_key = handoff.idempotency_key
                   AND ledger.transaction_type = CASE WHEN ticket.ticket_type = 'CONSUMABLE' THEN 'ISSUE' ELSE 'LOAN_OUT' END
                   AND ledger.direction = 'OUT'
                   AND ledger.item_id = ticket.item_id
                   AND ledger.unit = ticket.unit
                   AND ABS(ledger.quantity - ticket.quantity) <= ${EPSILON}
                   AND ABS(ledger.signed_quantity + ticket.quantity) <= ${EPSILON}
                   AND ledger.status = 'POSTED') <> 1
             OR EXISTS (SELECT 1 FROM reservations reservation
                        WHERE reservation.lending_ticket_id = ticket.id AND reservation.status = 'ACTIVE')
             OR (ticket.ticket_type = 'CONSUMABLE' AND ticket.status <> 'COMPLETED')
             OR (ticket.ticket_type <> 'CONSUMABLE' AND ticket.status NOT IN ('ON_LOAN', 'RETURNED')))`,
  },
  {
    id: 'LENDING_RETURN_EFFECT_MISMATCH',
    area: 'LENDING_CUSTODY',
    sql: `SELECT COUNT(*) AS count FROM (
            SELECT CASE
              WHEN replay.idempotency_key IS NULL OR json_valid(replay.result_json) <> 1 THEN 1
              WHEN ABS(COALESCE(json_extract(replay.result_json, '$.returnedQuantity'), -1)
                     + COALESCE(json_extract(replay.result_json, '$.lostQuantity'), -1)
                     + COALESCE(json_extract(replay.result_json, '$.damagedBeyondUseQuantity'), -1)
                     - ticket.quantity) > ${EPSILON} THEN 1
              WHEN ticket.status <> 'RETURNED' THEN 1
              WHEN COALESCE(json_extract(replay.result_json, '$.returnedQuantity'), 0) > ${EPSILON}
                AND (SELECT COUNT(*) FROM inventory_ledger ledger
                     WHERE ledger.related_entity_type = 'LENDING'
                       AND ledger.related_entity_id = ticket.id
                       AND ledger.idempotency_key = return_record.idempotency_key
                       AND ledger.transaction_type = 'LOAN_RETURN'
                       AND ledger.direction = 'IN'
                       AND ledger.item_id = ticket.item_id
                       AND ledger.unit = ticket.unit
                       AND ABS(ledger.quantity - json_extract(replay.result_json, '$.returnedQuantity')) <= ${EPSILON}
                       AND ABS(ledger.signed_quantity - json_extract(replay.result_json, '$.returnedQuantity')) <= ${EPSILON}
                       AND ledger.status = 'POSTED') <> 1 THEN 1
              ELSE 0 END AS mismatch
            FROM lending_returns return_record
            JOIN lending_tickets ticket ON ticket.id = return_record.lending_ticket_id
            LEFT JOIN idempotency_keys replay
              ON replay.scope = 'confirmReturn' AND replay.idempotency_key = return_record.idempotency_key
            WHERE NOT (
                    ticket.created_by = 'SYSTEM-IMPORT'
                    AND return_record.returned_by = 'SYSTEM-IMPORT'
                    AND return_record.idempotency_key = 'IMPORT:RETURN:' || ticket.id
                    AND EXISTS (SELECT 1 FROM imported_source_rows source
                                WHERE source.target_table = 'lending_tickets'
                                  AND source.target_id = ticket.id
                                  AND source.import_status IN ('IMPORTED', 'UNCHANGED'))
                  )
              AND NOT (
                    return_record.id LIKE 'SBX-G____-RTN-%'
                    AND return_record.notes = (SELECT value FROM app_metadata WHERE key = 'sandbox_seed_version')
                    AND (SELECT value FROM app_metadata WHERE key = 'sandbox_scope') = 'SYNTHETIC_ONLY'
                  )
          ) WHERE mismatch = 1`,
  },
  {
    id: 'ASSET_CUSTODY_EFFECT_MISMATCH',
    area: 'LENDING_CUSTODY',
    sql: `SELECT COUNT(*) AS count FROM (
            SELECT assignment.asset_id
            FROM lending_ticket_assets assignment
            JOIN lending_handoffs handoff ON handoff.lending_ticket_id = assignment.lending_ticket_id
            WHERE assignment.released_at IS NULL
               OR NOT EXISTS (SELECT 1 FROM inventory_asset_movements movement
                              WHERE movement.asset_id = assignment.asset_id
                                AND movement.lending_ticket_id = assignment.lending_ticket_id
                                AND movement.movement_type = 'HANDOFF')
            UNION ALL
            SELECT assignment.asset_id
            FROM lending_ticket_assets assignment
            JOIN lending_returns return_record ON return_record.lending_ticket_id = assignment.lending_ticket_id
            WHERE assignment.returned_at IS NULL
               OR NOT EXISTS (SELECT 1 FROM inventory_asset_movements movement
                              WHERE movement.asset_id = assignment.asset_id
                                AND movement.lending_ticket_id = assignment.lending_ticket_id
                                AND movement.movement_type = 'RETURN')
          )`,
  },
  {
    id: 'RECEIVING_COUNTER_MISMATCH',
    area: 'RECEIVING_RESTOCKING',
    sql: `SELECT COUNT(*) AS count FROM (
            SELECT restock.id FROM restock_requests restock
            WHERE ABS(restock.received_quantity - COALESCE((
              SELECT SUM(receiving.quantity) FROM receiving_records receiving
              WHERE receiving.entity_type = 'RESTOCK' AND receiving.entity_id = restock.id
            ), 0)) > ${EPSILON}
               OR ABS(restock.received_quantity - COALESCE((
              SELECT SUM(receipt.quantity) FROM restock_receipts receipt
              WHERE receipt.restock_request_id = restock.id
            ), 0)) > ${EPSILON}
            UNION ALL
            SELECT deliverable.id FROM deliverables deliverable
            WHERE NOT (
                    deliverable.id LIKE 'SBX-G____-DEL-%'
                    AND deliverable.notes = (SELECT value FROM app_metadata WHERE key = 'sandbox_seed_version')
                    AND (SELECT value FROM app_metadata WHERE key = 'sandbox_scope') = 'SYNTHETIC_ONLY'
                  )
              AND ABS(deliverable.quantity_received - COALESCE((
              SELECT SUM(receiving.quantity) FROM receiving_records receiving
              WHERE receiving.entity_type = 'DELIVERABLE' AND receiving.entity_id = deliverable.id
            ), 0)) > ${EPSILON}
          )`,
  },
  {
    id: 'RECEIVING_EFFECT_MISMATCH',
    area: 'RECEIVING_RESTOCKING',
    sql: `SELECT COUNT(*) AS count
          FROM receiving_records receiving
          WHERE NOT (
                  receiving.received_by = 'SYSTEM-IMPORT'
                  AND ((receiving.entity_type = 'RESTOCK'
                        AND receiving.id = 'RRC-' || receiving.entity_id
                        AND EXISTS (SELECT 1 FROM imported_source_rows source
                                    WHERE source.target_table = 'restock_requests'
                                      AND source.target_id = receiving.entity_id
                                      AND source.import_status IN ('IMPORTED', 'UNCHANGED')))
                    OR (receiving.entity_type = 'DELIVERABLE'
                        AND receiving.id = 'RCV-' || receiving.entity_id
                        AND receiving.idempotency_key = 'IMPORT:DELIVERABLE:' || receiving.entity_id
                        AND EXISTS (SELECT 1 FROM imported_source_rows source
                                    WHERE source.target_table = 'deliverables'
                                      AND source.target_id = receiving.entity_id
                                      AND source.import_status IN ('IMPORTED', 'UNCHANGED'))))
                )
            AND NOT (
                  receiving.id LIKE 'SBX-G____-%'
                  AND receiving.notes = (SELECT value FROM app_metadata WHERE key = 'sandbox_seed_version')
                  AND (SELECT value FROM app_metadata WHERE key = 'sandbox_scope') = 'SYNTHETIC_ONLY'
                )
            AND ((receiving.entity_type = 'RESTOCK' AND NOT EXISTS (
                   SELECT 1 FROM restock_receipts receipt
                   WHERE receipt.id = receiving.id
                     AND receipt.restock_request_id = receiving.entity_id
                     AND receipt.idempotency_key = receiving.idempotency_key
                     AND ABS(receipt.quantity - receiving.quantity) <= ${EPSILON}))
             OR (receiving.item_id IS NOT NULL AND (SELECT COUNT(*) FROM inventory_ledger ledger
                   WHERE ledger.transaction_type = 'RECEIVE'
                     AND ledger.related_entity_type = receiving.entity_type
                     AND ledger.related_entity_id = receiving.entity_id
                     AND ledger.idempotency_key = receiving.idempotency_key
                      AND ledger.item_id = receiving.item_id
                      AND ledger.unit = receiving.unit
                      AND ABS(ledger.quantity - receiving.quantity) <= ${EPSILON}
                      AND ledger.direction = 'IN'
                      AND ABS(ledger.signed_quantity - receiving.quantity) <= ${EPSILON}
                       AND ledger.status = 'POSTED') <> 1)
              OR EXISTS (
                   SELECT 1 FROM status_history history
                   WHERE history.entity_type = receiving.entity_type
                     AND history.entity_id = receiving.entity_id
                     AND history.new_status IN ('CANCELLED', 'REJECTED')
                     AND history.changed_at <= receiving.received_at
                 ))`,
  },
  {
    id: 'TRANSFER_PAIR_MISMATCH',
    area: 'TRANSFERS',
    sql: `SELECT COUNT(*) AS count FROM (
            SELECT related_entity_id
            FROM inventory_ledger
            WHERE related_entity_type = 'TRANSFER_MAP'
              AND transaction_type IN ('TRANSFER_OUT_EVENT', 'TRANSFER_IN_INVENTORY')
              AND status = 'POSTED'
            GROUP BY related_entity_id
            HAVING COUNT(*) <> 2
               OR SUM(CASE WHEN transaction_type = 'TRANSFER_OUT_EVENT' AND direction = 'OUT' THEN 1 ELSE 0 END) <> 1
               OR SUM(CASE WHEN transaction_type = 'TRANSFER_IN_INVENTORY' AND direction = 'IN' THEN 1 ELSE 0 END) <> 1
               OR SUM(CASE
                        WHEN transaction_type = 'TRANSFER_OUT_EVENT'
                          AND ABS(signed_quantity + quantity) <= ${EPSILON} THEN 0
                        WHEN transaction_type = 'TRANSFER_IN_INVENTORY'
                          AND ABS(signed_quantity - quantity) <= ${EPSILON} THEN 0
                        ELSE 1 END) <> 0
               OR ABS(SUM(signed_quantity)) > ${EPSILON}
               OR MIN(quantity) <> MAX(quantity)
               OR MIN(unit) <> MAX(unit)
               OR MIN(event_item_id) <> MAX(event_item_id)
               OR COUNT(DISTINCT item_id) <> 2
          )`,
  },
  {
    id: 'CYCLE_COUNT_EFFECT_MISMATCH',
    area: 'CYCLE_COUNTS',
    sql: `SELECT COUNT(*) AS count FROM (
            SELECT CASE
              WHEN replay.idempotency_key IS NULL OR json_valid(replay.result_json) <> 1 THEN 1
              WHEN COALESCE(json_type(replay.result_json, '$.transactionId'), '') <> 'text' THEN 1
              WHEN COALESCE(json_type(replay.result_json, '$.itemId'), '') <> 'text' THEN 1
              WHEN COALESCE(json_type(replay.result_json, '$.delta'), '') NOT IN ('integer', 'real') THEN 1
              WHEN COALESCE(json_type(replay.result_json, '$.previousOnHand'), '') NOT IN ('integer', 'real') THEN 1
              WHEN COALESCE(json_type(replay.result_json, '$.countedQuantity'), '') NOT IN ('integer', 'real') THEN 1
              WHEN ledger.direction <> 'ADJUSTMENT' THEN 1
              WHEN ABS(ABS(ledger.signed_quantity) - ledger.quantity) > ${EPSILON} THEN 1
              WHEN json_extract(replay.result_json, '$.transactionId') <> ledger.id THEN 1
              WHEN json_extract(replay.result_json, '$.itemId') <> ledger.item_id THEN 1
              WHEN ABS(json_extract(replay.result_json, '$.delta') - ledger.signed_quantity) > ${EPSILON} THEN 1
              WHEN ABS(json_extract(replay.result_json, '$.previousOnHand')
                     + ledger.signed_quantity
                     - json_extract(replay.result_json, '$.countedQuantity')) > ${EPSILON} THEN 1
              ELSE 0 END AS mismatch
            FROM inventory_ledger ledger
            LEFT JOIN idempotency_keys replay
              ON replay.scope = 'postCycleCountAdjustment'
             AND replay.idempotency_key = ledger.idempotency_key
            WHERE ledger.transaction_type = 'CYCLE_COUNT_ADJUSTMENT'
          ) WHERE mismatch = 1`,
  },
  {
    id: 'KNOWN_IDEMPOTENCY_ORPHAN',
    area: 'IDEMPOTENCY_AUDIT',
    sql: `SELECT COUNT(*) AS count
          FROM idempotency_keys replay
          WHERE replay.scope IN (
            'confirmRelease', 'correctRelease', 'confirmLendingHandoff', 'confirmReturn',
            'receiveRestock', 'receiveDeliverable', 'transferEventItemToInventory',
            'postCycleCountAdjustment'
          )
          AND CASE WHEN json_valid(replay.result_json) <> 1 THEN 1 ELSE CASE replay.scope
            WHEN 'confirmRelease' THEN COALESCE(json_type(replay.result_json, '$.transactionIds'), '') <> 'array'
              OR COALESCE(json_array_length(replay.result_json, '$.transactionIds'), 0) < 1
              OR (SELECT COUNT(*) FROM json_each(replay.result_json, '$.transactionIds') transaction_entry
                  JOIN inventory_ledger ledger ON ledger.id = transaction_entry.value)
                 <> COALESCE(json_array_length(replay.result_json, '$.transactionIds'), 0)
            WHEN 'correctRelease' THEN COALESCE(json_type(replay.result_json, '$.correctionId'), '') <> 'text'
              OR NOT EXISTS (
              SELECT 1 FROM release_corrections correction
              WHERE correction.id = json_extract(replay.result_json, '$.correctionId'))
            WHEN 'confirmLendingHandoff' THEN COALESCE(json_type(replay.result_json, '$.handoffId'), '') <> 'text'
              OR NOT EXISTS (
              SELECT 1 FROM lending_handoffs handoff
              WHERE handoff.id = json_extract(replay.result_json, '$.handoffId'))
            WHEN 'confirmReturn' THEN COALESCE(json_type(replay.result_json, '$.returnId'), '') <> 'text'
              OR NOT EXISTS (
              SELECT 1 FROM lending_returns return_record
              WHERE return_record.id = json_extract(replay.result_json, '$.returnId'))
            WHEN 'receiveRestock' THEN COALESCE(json_type(replay.result_json, '$.receiptId'), '') <> 'text'
              OR NOT EXISTS (
              SELECT 1 FROM receiving_records receiving
              WHERE receiving.id = json_extract(replay.result_json, '$.receiptId')
                AND receiving.entity_type = 'RESTOCK')
            WHEN 'receiveDeliverable' THEN COALESCE(json_type(replay.result_json, '$.receiptId'), '') <> 'text'
              OR NOT EXISTS (
              SELECT 1 FROM receiving_records receiving
              WHERE receiving.id = json_extract(replay.result_json, '$.receiptId')
                AND receiving.entity_type = 'DELIVERABLE')
            WHEN 'transferEventItemToInventory' THEN (
              COALESCE(json_type(replay.result_json, '$.outTransactionId'), '') <> 'text'
              OR COALESCE(json_type(replay.result_json, '$.inTransactionId'), '') <> 'text'
              OR NOT EXISTS (SELECT 1 FROM inventory_ledger ledger
                          WHERE ledger.id = json_extract(replay.result_json, '$.outTransactionId'))
              OR NOT EXISTS (SELECT 1 FROM inventory_ledger ledger
                             WHERE ledger.id = json_extract(replay.result_json, '$.inTransactionId')))
            WHEN 'postCycleCountAdjustment' THEN COALESCE(json_type(replay.result_json, '$.transactionId'), '') <> 'text'
              OR NOT EXISTS (
              SELECT 1 FROM inventory_ledger ledger
              WHERE ledger.id = json_extract(replay.result_json, '$.transactionId'))
            ELSE 1 END END`,
  },
  {
    id: 'AUDIT_HISTORY_EFFECT_MISMATCH',
    area: 'IDEMPOTENCY_AUDIT',
    sql: `SELECT COUNT(*) AS count FROM (
            SELECT confirmation.id FROM release_confirmations confirmation
            WHERE NOT (
                    confirmation.released_by = 'SYSTEM-IMPORT'
                    AND confirmation.recipient_name = 'REDACTED_SOURCE_RECIPIENT'
                    AND EXISTS (SELECT 1 FROM imported_source_rows source
                                WHERE source.target_table = 'release_confirmations'
                                  AND source.import_status IN ('IMPORTED', 'UNCHANGED')
                                  AND (confirmation.id = source.target_id OR (
                                    substr(confirmation.id, 1, length(source.target_id) + 1) = source.target_id || '-'
                                    AND substr(confirmation.id, length(source.target_id) + 2) <> ''
                                    AND substr(confirmation.id, length(source.target_id) + 2) NOT GLOB '*[^0-9]*')))
                  )
              AND NOT (
                    confirmation.id LIKE 'SBX-G____-REL-%'
                    AND confirmation.notes = (SELECT value FROM app_metadata WHERE key = 'sandbox_seed_version')
                    AND (SELECT value FROM app_metadata WHERE key = 'sandbox_scope') = 'SYNTHETIC_ONLY'
                  )
              AND (NOT EXISTS (SELECT 1 FROM status_history history
                              WHERE history.entity_type = 'REQUEST_LINE'
                                AND history.entity_id = confirmation.request_line_id
                                AND history.idempotency_key = confirmation.idempotency_key)
                OR NOT EXISTS (SELECT 1 FROM audit_log audit
                              WHERE audit.action = 'RELEASE_CONFIRMED'
                                AND audit.entity_type = 'RELEASE'
                                AND audit.entity_id = confirmation.release_group_id))
            UNION ALL
            SELECT correction.id FROM release_corrections correction
            JOIN release_confirmations confirmation ON confirmation.id = correction.release_confirmation_id
            WHERE NOT EXISTS (SELECT 1 FROM status_history history
                              WHERE history.entity_type = 'REQUEST_LINE'
                                AND history.entity_id = confirmation.request_line_id
                                AND history.idempotency_key = correction.idempotency_key)
               OR NOT EXISTS (SELECT 1 FROM audit_log audit
                              WHERE audit.action = 'RELEASE_CORRECTED'
                                AND audit.entity_type = 'RELEASE_CORRECTION'
                                AND audit.entity_id = correction.id)
            UNION ALL
            SELECT handoff.id FROM lending_handoffs handoff
            JOIN lending_tickets ticket ON ticket.id = handoff.lending_ticket_id
            WHERE NOT (
                    ticket.created_by = 'SYSTEM-IMPORT'
                    AND handoff.released_by = 'SYSTEM-IMPORT'
                    AND handoff.idempotency_key = 'IMPORT:HANDOFF:' || ticket.id
                    AND EXISTS (SELECT 1 FROM imported_source_rows source
                                WHERE source.target_table = 'lending_tickets'
                                  AND source.target_id = ticket.id
                                  AND source.import_status IN ('IMPORTED', 'UNCHANGED'))
                  )
              AND NOT (
                    handoff.id LIKE 'SBX-G____-HND-%'
                    AND handoff.notes = (SELECT value FROM app_metadata WHERE key = 'sandbox_seed_version')
                    AND (SELECT value FROM app_metadata WHERE key = 'sandbox_scope') = 'SYNTHETIC_ONLY'
                  )
              AND (NOT EXISTS (SELECT 1 FROM status_history history
                              WHERE history.entity_type = 'LENDING'
                                AND history.entity_id = handoff.lending_ticket_id
                                AND history.idempotency_key = handoff.idempotency_key)
               OR NOT EXISTS (SELECT 1 FROM audit_log audit
                              WHERE audit.entity_type = 'LENDING'
                                AND audit.entity_id = handoff.lending_ticket_id
                                AND audit.action IN ('CONSUMABLE_ISSUE_CONFIRMED', 'LENDING_HANDOFF_CONFIRMED')))
            UNION ALL
            SELECT return_record.id FROM lending_returns return_record
            JOIN lending_tickets ticket ON ticket.id = return_record.lending_ticket_id
            WHERE NOT (
                    ticket.created_by = 'SYSTEM-IMPORT'
                    AND return_record.returned_by = 'SYSTEM-IMPORT'
                    AND return_record.idempotency_key = 'IMPORT:RETURN:' || ticket.id
                    AND EXISTS (SELECT 1 FROM imported_source_rows source
                                WHERE source.target_table = 'lending_tickets'
                                  AND source.target_id = ticket.id
                                  AND source.import_status IN ('IMPORTED', 'UNCHANGED'))
                  )
              AND NOT (
                    return_record.id LIKE 'SBX-G____-RTN-%'
                    AND return_record.notes = (SELECT value FROM app_metadata WHERE key = 'sandbox_seed_version')
                    AND (SELECT value FROM app_metadata WHERE key = 'sandbox_scope') = 'SYNTHETIC_ONLY'
                  )
              AND (NOT EXISTS (SELECT 1 FROM status_history history
                              WHERE history.entity_type = 'LENDING'
                                AND history.entity_id = return_record.lending_ticket_id
                                AND history.idempotency_key = return_record.idempotency_key)
               OR NOT EXISTS (SELECT 1 FROM audit_log audit
                              WHERE audit.action = 'LENDING_RETURN_CONFIRMED'
                                AND audit.entity_type = 'LENDING'
                                AND audit.entity_id = return_record.lending_ticket_id))
            UNION ALL
            SELECT receiving.id FROM receiving_records receiving
            WHERE NOT (
                    receiving.received_by = 'SYSTEM-IMPORT'
                    AND ((receiving.entity_type = 'RESTOCK'
                          AND receiving.id = 'RRC-' || receiving.entity_id
                          AND EXISTS (SELECT 1 FROM imported_source_rows source
                                      WHERE source.target_table = 'restock_requests'
                                        AND source.target_id = receiving.entity_id
                                        AND source.import_status IN ('IMPORTED', 'UNCHANGED')))
                      OR (receiving.entity_type = 'DELIVERABLE'
                          AND receiving.id = 'RCV-' || receiving.entity_id
                          AND receiving.idempotency_key = 'IMPORT:DELIVERABLE:' || receiving.entity_id
                          AND EXISTS (SELECT 1 FROM imported_source_rows source
                                      WHERE source.target_table = 'deliverables'
                                        AND source.target_id = receiving.entity_id
                                        AND source.import_status IN ('IMPORTED', 'UNCHANGED'))))
                  )
              AND NOT (
                    receiving.id LIKE 'SBX-G____-%'
                    AND receiving.notes = (SELECT value FROM app_metadata WHERE key = 'sandbox_seed_version')
                    AND (SELECT value FROM app_metadata WHERE key = 'sandbox_scope') = 'SYNTHETIC_ONLY'
                  )
              AND (NOT EXISTS (SELECT 1 FROM status_history history
                              WHERE history.entity_type = receiving.entity_type
                                AND history.entity_id = receiving.entity_id
                                AND history.idempotency_key = receiving.idempotency_key)
               OR NOT EXISTS (SELECT 1 FROM audit_log audit
                              WHERE audit.action = receiving.entity_type || '_RECEIVED'
                                AND audit.entity_type = receiving.entity_type
                                AND audit.entity_id = receiving.entity_id))
            UNION ALL
            SELECT ledger.id FROM inventory_ledger ledger
            WHERE ledger.transaction_type = 'CYCLE_COUNT_ADJUSTMENT'
              AND NOT EXISTS (SELECT 1 FROM audit_log audit
                              WHERE audit.action = 'CYCLE_COUNT_ADJUSTMENT'
                                AND audit.entity_type = 'INVENTORY_ITEM'
                                AND audit.entity_id = ledger.item_id
                                AND audit.created_at = ledger.created_at)
            UNION ALL
            SELECT ledger.related_entity_id FROM inventory_ledger ledger
            WHERE ledger.transaction_type = 'TRANSFER_OUT_EVENT'
              AND NOT EXISTS (SELECT 1 FROM audit_log audit
                              WHERE audit.action = 'TRANSFER_EVENT_ITEM'
                                AND audit.entity_type = 'EVENT_ITEM'
                                AND audit.entity_id = ledger.event_item_id
                                AND audit.created_at = ledger.created_at)
          )`,
  },
]);

const KNOWN_NONBLOCKING = Object.freeze([
  {
    id: 'PROVEN_IMPORTED_SNAPSHOT_HISTORY',
    sql: `SELECT COUNT(*) AS count FROM (
            SELECT confirmation.id
            FROM release_confirmations confirmation
            WHERE confirmation.released_by = 'SYSTEM-IMPORT'
              AND confirmation.recipient_name = 'REDACTED_SOURCE_RECIPIENT'
              AND EXISTS (SELECT 1 FROM imported_source_rows source
                          WHERE source.target_table = 'release_confirmations'
                            AND source.import_status IN ('IMPORTED', 'UNCHANGED')
                            AND (confirmation.id = source.target_id OR (
                              substr(confirmation.id, 1, length(source.target_id) + 1) = source.target_id || '-'
                              AND substr(confirmation.id, length(source.target_id) + 2) <> ''
                              AND substr(confirmation.id, length(source.target_id) + 2) NOT GLOB '*[^0-9]*')))
            UNION ALL
            SELECT handoff.id
            FROM lending_handoffs handoff
            JOIN lending_tickets ticket ON ticket.id = handoff.lending_ticket_id
            WHERE ticket.created_by = 'SYSTEM-IMPORT'
              AND handoff.released_by = 'SYSTEM-IMPORT'
              AND handoff.idempotency_key = 'IMPORT:HANDOFF:' || ticket.id
              AND EXISTS (SELECT 1 FROM imported_source_rows source
                          WHERE source.target_table = 'lending_tickets'
                            AND source.target_id = ticket.id
                            AND source.import_status IN ('IMPORTED', 'UNCHANGED'))
            UNION ALL
            SELECT return_record.id
            FROM lending_returns return_record
            JOIN lending_tickets ticket ON ticket.id = return_record.lending_ticket_id
            WHERE ticket.created_by = 'SYSTEM-IMPORT'
              AND return_record.returned_by = 'SYSTEM-IMPORT'
              AND return_record.idempotency_key = 'IMPORT:RETURN:' || ticket.id
              AND EXISTS (SELECT 1 FROM imported_source_rows source
                          WHERE source.target_table = 'lending_tickets'
                            AND source.target_id = ticket.id
                            AND source.import_status IN ('IMPORTED', 'UNCHANGED'))
            UNION ALL
            SELECT receiving.id
            FROM receiving_records receiving
            WHERE receiving.received_by = 'SYSTEM-IMPORT'
              AND ((receiving.entity_type = 'RESTOCK'
                    AND receiving.id = 'RRC-' || receiving.entity_id
                    AND EXISTS (SELECT 1 FROM imported_source_rows source
                                WHERE source.target_table = 'restock_requests'
                                  AND source.target_id = receiving.entity_id
                                  AND source.import_status IN ('IMPORTED', 'UNCHANGED')))
                OR (receiving.entity_type = 'DELIVERABLE'
                    AND receiving.id = 'RCV-' || receiving.entity_id
                    AND receiving.idempotency_key = 'IMPORT:DELIVERABLE:' || receiving.entity_id
                    AND EXISTS (SELECT 1 FROM imported_source_rows source
                                WHERE source.target_table = 'deliverables'
                                  AND source.target_id = receiving.entity_id
                                  AND source.import_status IN ('IMPORTED', 'UNCHANGED'))))
          )`,
  },
  {
    id: 'PROVEN_SYNTHETIC_SNAPSHOT_HISTORY',
    sql: `SELECT CASE WHEN (SELECT value FROM app_metadata WHERE key = 'sandbox_scope') = 'SYNTHETIC_ONLY'
                 THEN (
                   (SELECT COUNT(*) FROM release_confirmations confirmation
                    WHERE confirmation.id LIKE 'SBX-G____-REL-%'
                      AND confirmation.notes = (SELECT value FROM app_metadata WHERE key = 'sandbox_seed_version'))
                   + (SELECT COUNT(*) FROM lending_handoffs handoff
                      WHERE handoff.id LIKE 'SBX-G____-HND-%'
                        AND handoff.notes = (SELECT value FROM app_metadata WHERE key = 'sandbox_seed_version'))
                   + (SELECT COUNT(*) FROM lending_returns return_record
                      WHERE return_record.id LIKE 'SBX-G____-RTN-%'
                        AND return_record.notes = (SELECT value FROM app_metadata WHERE key = 'sandbox_seed_version'))
                   + (SELECT COUNT(*) FROM deliverables deliverable
                      WHERE deliverable.id LIKE 'SBX-G____-DEL-%'
                        AND deliverable.quantity_received > 0
                        AND deliverable.notes = (SELECT value FROM app_metadata WHERE key = 'sandbox_seed_version'))
                 ) ELSE 0 END AS count`,
  },
]);

const QUARANTINE = Object.freeze([
  {
    id: 'UNPROVEN_SYSTEM_IMPORT_HISTORY',
    sql: `SELECT COUNT(*) AS count FROM (
            SELECT confirmation.id FROM release_confirmations confirmation
            WHERE confirmation.released_by = 'SYSTEM-IMPORT'
              AND NOT (confirmation.recipient_name = 'REDACTED_SOURCE_RECIPIENT'
                AND EXISTS (SELECT 1 FROM imported_source_rows source
                            WHERE source.target_table = 'release_confirmations'
                              AND source.import_status IN ('IMPORTED', 'UNCHANGED')
                              AND (confirmation.id = source.target_id OR
                                   substr(confirmation.id, 1, length(source.target_id) + 1) = source.target_id || '-')))
            UNION ALL
            SELECT handoff.id FROM lending_handoffs handoff
            JOIN lending_tickets ticket ON ticket.id = handoff.lending_ticket_id
            WHERE handoff.released_by = 'SYSTEM-IMPORT'
              AND NOT (ticket.created_by = 'SYSTEM-IMPORT'
                AND handoff.idempotency_key = 'IMPORT:HANDOFF:' || ticket.id
                AND EXISTS (SELECT 1 FROM imported_source_rows source
                            WHERE source.target_table = 'lending_tickets'
                              AND source.target_id = ticket.id
                              AND source.import_status IN ('IMPORTED', 'UNCHANGED')))
            UNION ALL
            SELECT return_record.id FROM lending_returns return_record
            JOIN lending_tickets ticket ON ticket.id = return_record.lending_ticket_id
            WHERE return_record.returned_by = 'SYSTEM-IMPORT'
              AND NOT (ticket.created_by = 'SYSTEM-IMPORT'
                AND return_record.idempotency_key = 'IMPORT:RETURN:' || ticket.id
                AND EXISTS (SELECT 1 FROM imported_source_rows source
                            WHERE source.target_table = 'lending_tickets'
                              AND source.target_id = ticket.id
                              AND source.import_status IN ('IMPORTED', 'UNCHANGED')))
            UNION ALL
            SELECT receiving.id FROM receiving_records receiving
            WHERE receiving.received_by = 'SYSTEM-IMPORT'
              AND NOT ((receiving.entity_type = 'RESTOCK'
                        AND receiving.id = 'RRC-' || receiving.entity_id
                        AND EXISTS (SELECT 1 FROM imported_source_rows source
                                    WHERE source.target_table = 'restock_requests'
                                      AND source.target_id = receiving.entity_id
                                      AND source.import_status IN ('IMPORTED', 'UNCHANGED')))
                    OR (receiving.entity_type = 'DELIVERABLE'
                        AND receiving.id = 'RCV-' || receiving.entity_id
                        AND receiving.idempotency_key = 'IMPORT:DELIVERABLE:' || receiving.entity_id
                        AND EXISTS (SELECT 1 FROM imported_source_rows source
                                    WHERE source.target_table = 'deliverables'
                                      AND source.target_id = receiving.entity_id
                                      AND source.import_status IN ('IMPORTED', 'UNCHANGED'))))
          )`,
  },
]);

export function reconcileInventoryDatabase(database, { environment = 'LOCAL_TEST', candidateSha = '' } = {}) {
  if (!ENVIRONMENTS.has(environment)) throw new Error('Unsupported sanitized reconciliation environment.');
  if (candidateSha && !SHA.test(candidateSha))
    throw new Error('Candidate SHA must be an exact lowercase commit SHA.');

  const integrity = String(
    database.prepare('PRAGMA integrity_check').get()?.integrity_check ?? '',
  ).toLowerCase();
  const foreignKeyViolations = database.prepare('PRAGMA foreign_key_check').all().length;
  const schemaVersion = tableExists(database, 'app_metadata')
    ? value(database, "SELECT value FROM app_metadata WHERE key = 'operational_schema_version'", 'MISSING')
    : 'MISSING';
  const latestMigration = tableExists(database, 'd1_migrations')
    ? value(database, 'SELECT name AS value FROM d1_migrations ORDER BY id DESC LIMIT 1', 'MISSING')
    : 'MISSING';

  const checks = CHECKS.map((check) => ({
    id: check.id,
    area: check.area,
    discrepancyCount: count(database, check.sql),
    classification: 'BLOCKS_CANDIDATE',
  }));
  const knownNonblocking = KNOWN_NONBLOCKING.map((entry) => ({
    id: entry.id,
    count: count(database, entry.sql),
    classification: 'KNOWN_NONBLOCKING',
  }));
  const quarantine = QUARANTINE.map((entry) => ({
    id: entry.id,
    count: count(database, entry.sql),
    classification: 'QUARANTINE_REQUIRED',
  }));
  const appendOnlyTriggersPresent = APPEND_ONLY_TRIGGERS.filter(
    (trigger) =>
      Number(
        database
          .prepare("SELECT COUNT(*) AS count FROM sqlite_master WHERE type = 'trigger' AND name = ?")
          .get(trigger)?.count ?? 0,
      ) === 1,
  ).length;
  checks.push({
    id: 'APPEND_ONLY_TRIGGER_MISSING',
    area: 'IMMUTABLE_HISTORY',
    discrepancyCount: APPEND_ONLY_TRIGGERS.length - appendOnlyTriggersPresent,
    classification: 'BLOCKS_CANDIDATE',
  });
  checks.push({
    id: 'SCHEMA_MIGRATION_MISMATCH',
    area: 'SCHEMA_IDENTITY',
    discrepancyCount: schemaVersion === EXPECTED_SCHEMA && latestMigration === EXPECTED_MIGRATION ? 0 : 1,
    classification: 'BLOCKS_CANDIDATE',
  });
  checks.push({
    id: 'INTEGRITY_OR_FOREIGN_KEY_FAILURE',
    area: 'RECOVERY',
    discrepancyCount: integrity === 'ok' && foreignKeyViolations === 0 ? 0 : 1,
    classification: 'BLOCKS_CANDIDATE',
  });

  const blockingDiscrepancies = checks.reduce((sum, check) => sum + check.discrepancyCount, 0);
  const knownNonblockingCount = knownNonblocking.reduce((sum, entry) => sum + entry.count, 0);
  const quarantineRequired = quarantine.reduce((sum, entry) => sum + entry.count, 0);
  const safeCounts = Object.fromEntries(
    [
      ['inventoryItems', 'inventory_items'],
      ['postedLedgerRows', 'inventory_ledger', "status = 'POSTED'"],
      ['reservations', 'reservations'],
      ['reservationConsumptions', 'reservation_consumptions'],
      ['releaseConfirmations', 'release_confirmations'],
      ['releaseCorrections', 'release_corrections'],
      ['lendingTickets', 'lending_tickets'],
      ['receivingRecords', 'receiving_records'],
      ['idempotencyKeys', 'idempotency_keys'],
      ['auditRows', 'audit_log'],
    ].map(([label, table, predicate = '1 = 1']) => [
      label,
      tableExists(database, table)
        ? count(database, `SELECT COUNT(*) AS count FROM ${table} WHERE ${predicate}`)
        : 0,
    ]),
  );

  return Object.freeze({
    schemaVersion: 1,
    environment,
    ...(candidateSha ? { candidateSha } : {}),
    database: {
      operationalSchema: schemaVersion,
      latestMigration,
      integrityOk: integrity === 'ok',
      foreignKeyViolations,
    },
    safeCounts,
    checks,
    classifications: { knownNonblocking, quarantine },
    summary: {
      checksExecuted: checks.length,
      acceptedChecks: checks.filter((check) => check.discrepancyCount === 0).length,
      discrepantChecks: checks.filter((check) => check.discrepancyCount > 0).length,
      blockingDiscrepancies,
      discrepancyCount: blockingDiscrepancies,
      knownNonblockingCount,
      quarantineRequired,
      disposition:
        blockingDiscrepancies > 0
          ? 'BLOCKS_CANDIDATE'
          : quarantineRequired > 0
            ? 'QUARANTINE_REQUIRED'
            : 'RECONCILED',
    },
  });
}

function argument(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : '';
}

async function main() {
  const databaseArgument = argument('--database');
  const exportArgument = argument('--export');
  if (Boolean(databaseArgument) === Boolean(exportArgument)) {
    throw new Error('Use exactly one of --database or --export with an absolute private path.');
  }
  const environment = argument('--environment') || 'LOCAL_TEST';
  const candidateSha = argument('--candidate-sha');
  let workspace = '';
  let databasePath;
  try {
    if (exportArgument) {
      const exportPath = await resolvePrivatePath(exportArgument, {
        repoRoot,
        label: 'D1 export',
        kind: 'file',
      });
      workspace = await mkdtemp(path.join(tmpdir(), 'hau-inventory-reconciliation-'));
      databasePath = path.join(workspace, 'restored.sqlite');
      await restoreAndVerifyD1Export(exportPath, databasePath);
    } else {
      databasePath = await resolvePrivatePath(databaseArgument, {
        repoRoot,
        label: 'SQLite database',
        kind: 'file',
      });
    }
    const database = new DatabaseSync(databasePath, { readOnly: true });
    try {
      const result = reconcileInventoryDatabase(database, { environment, candidateSha });
      process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
      if (result.summary.disposition === 'BLOCKS_CANDIDATE') process.exitCode = 2;
    } finally {
      database.close();
    }
  } finally {
    if (workspace) await rm(workspace, { recursive: true, force: true });
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    void error;
    console.error('Inventory reconciliation failed: PRIVATE_INPUT_OR_DATABASE_ERROR');
    process.exitCode = 1;
  });
}
