import { readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Miniflare } from 'miniflare';
import { unstable_splitSqlQuery } from 'wrangler';

const ROOT = path.resolve(fileURLToPath(new URL('../..', import.meta.url)));
const MIGRATIONS = path.join(ROOT, 'migrations');

function argument(name, fallback = '') {
  const prefix = `--${name}=`;
  const value = process.argv.find((entry) => entry.startsWith(prefix));
  return value ? value.slice(prefix.length) : fallback;
}

const QUERIES = Object.freeze([
  {
    id: 'inventory-catalog',
    surface: 'Inventory',
    sql: `SELECT item.id, item.name, availability.on_hand, availability.reserved,
                 availability.available_to_promise
          FROM inventory_items item
          JOIN lending_catalog_availability availability ON availability.item_id = item.id
          WHERE item.status = 'ACTIVE'
          ORDER BY item.name, item.id`,
  },
  {
    id: 'inventory-classification-history',
    surface: 'Inventory',
    sql: `SELECT history.id, history.item_id, history.occurred_at
          FROM inventory_classification_history history
          JOIN inventory_items item ON item.id = history.item_id
          WHERE item.status = 'ACTIVE'
          ORDER BY history.occurred_at DESC, history.id DESC
          LIMIT 500`,
  },
  {
    id: 'inventory-ledger-recent',
    surface: 'Inventory',
    sql: `SELECT id, item_id, created_at
          FROM inventory_ledger
          ORDER BY created_at DESC, id DESC
          LIMIT 500`,
  },
  {
    id: 'request-review-queue',
    surface: 'Request queue',
    sql: `SELECT request.id, request.status, request.updated_at
          FROM requests request
          WHERE request.archived_at IS NULL
          ORDER BY CASE WHEN request.status IN ('FOR_REVIEW', 'NEEDS_INFORMATION') THEN 0 ELSE 1 END,
                   request.updated_at DESC, request.id DESC
          LIMIT 10 OFFSET 0`,
  },
  {
    id: 'request-lines-for-page',
    surface: 'Request queue',
    sql: `SELECT line.id, line.request_id, line.created_at
          FROM request_lines line
          WHERE line.request_id IN ('P24-REQUEST-1', 'P24-REQUEST-2')
          ORDER BY line.request_id, line.created_at, line.id
          LIMIT 101`,
  },
  {
    id: 'lending-review-queue',
    surface: 'Lending queue',
    sql: `SELECT ticket.id, ticket.item_id, ticket.status, ticket.updated_at
          FROM lending_tickets ticket
          ORDER BY ticket.updated_at DESC
          LIMIT 10 OFFSET 0`,
  },
  {
    id: 'release-confirmation-queue',
    surface: 'Release queue',
    sql: `SELECT confirmation.id, confirmation.request_id, confirmation.lending_ticket_id,
                 confirmation.released_at
          FROM release_confirmations confirmation
          LEFT JOIN requests request ON request.id = confirmation.request_id
          LEFT JOIN lending_tickets ticket ON ticket.id = confirmation.lending_ticket_id
          ORDER BY confirmation.released_at DESC
          LIMIT 10 OFFSET 0`,
  },
  {
    id: 'restock-work-queue',
    surface: 'Restocking/receiving',
    sql: `SELECT restock.id, restock.status, restock.updated_at
          FROM restock_requests restock
          ORDER BY restock.updated_at DESC
          LIMIT 10 OFFSET 0`,
  },
  {
    id: 'restock-receipts',
    surface: 'Restocking/receiving',
    sql: `SELECT receipt.id, receipt.restock_request_id, receipt.received_at
          FROM restock_receipts receipt
          JOIN restock_requests restock ON restock.id = receipt.restock_request_id
          ORDER BY receipt.received_at DESC
          LIMIT 10 OFFSET 0`,
  },
  {
    id: 'procurement-deliverables',
    surface: 'Procurement',
    sql: `SELECT deliverable.id, deliverable.request_id, deliverable.status, deliverable.updated_at
          FROM deliverables deliverable
          JOIN requests deliverable_request ON deliverable_request.id = deliverable.request_id
          ORDER BY deliverable.updated_at DESC
          LIMIT 10 OFFSET 0`,
  },
  {
    id: 'procurement-canvass',
    surface: 'Procurement',
    sql: `SELECT canvass.id, canvass.status, canvass.updated_at
          FROM canvass_references canvass
          LEFT JOIN deliverables deliverable ON deliverable.id = canvass.linked_deliverable_id
          LEFT JOIN requests deliverable_request ON deliverable_request.id = deliverable.request_id
          LEFT JOIN request_lines line ON line.id = canvass.linked_request_line_id
          LEFT JOIN requests line_request ON line_request.id = line.request_id
          LEFT JOIN restock_requests restock ON restock.id = canvass.linked_restock_id
          ORDER BY canvass.updated_at DESC
          LIMIT 10 OFFSET 0`,
  },
  {
    id: 'event-activity-history',
    surface: 'Events',
    sql: `SELECT history.id, history.event_id, history.occurred_at
          FROM event_activity_history history
          LEFT JOIN accounts account ON account.id = history.actor_account_id
          ORDER BY history.occurred_at DESC
          LIMIT 500`,
  },
  {
    id: 'administration-account-directory',
    surface: 'Administration directory/accounts',
    sql: `SELECT a.id, a.access_id_normalized, a.role_id, a.status,
                 COALESCE((SELECT MAX(log.created_at)
                           FROM audit_log log
                           WHERE log.action = 'LOGIN_SUCCEEDED' AND log.entity_id = a.id), '')
                   AS last_successful_login
          FROM accounts a
          WHERE a.id NOT LIKE 'SYSTEM-%'
          ORDER BY a.access_id_normalized ASC
          LIMIT 25 OFFSET 0`,
  },
  {
    id: 'canonical-staff-directory',
    surface: 'Administration directory/accounts',
    sql: `SELECT p.person_id, COUNT(DISTINCT link.account_id) AS linked_account_count
          FROM canonical_people p
          LEFT JOIN account_staff_links link ON link.person_id = p.person_id
          LEFT JOIN person_emails email ON email.person_id = p.person_id
          LEFT JOIN staff_assignments assignment ON assignment.person_id = p.person_id
          WHERE p.person_id LIKE '%' ESCAPE '\\'
             OR EXISTS (
               SELECT 1
               FROM account_staff_links lookup_link
               JOIN accounts lookup_account ON lookup_account.id = lookup_link.account_id
               WHERE lookup_link.person_id = p.person_id
                 AND (lookup_account.access_id_normalized LIKE '%' ESCAPE '\\'
                   OR lookup_account.profile_full_name LIKE '%' ESCAPE '\\')
             )
          GROUP BY p.person_id
          ORDER BY p.person_id ASC
          LIMIT 25 OFFSET 0`,
  },
  {
    id: 'staff-account-activity-history',
    surface: 'Activity history',
    sql: `SELECT event_id, occurred_at, event_type, action_code, account_id
          FROM staff_account_activity_history
          WHERE person_id = 'P24-PERSON'
          ORDER BY occurred_at DESC, event_id DESC
          LIMIT 25 OFFSET 0`,
  },
  {
    id: 'profile-account-lookup',
    surface: 'Profile/account lookup',
    sql: `SELECT a.id, a.access_id_normalized, a.status, a.role_id,
                 department.display_name,
                 COALESCE((SELECT value FROM app_metadata
                           WHERE key = 'profile.appearance.' || a.id), 'SYSTEM') AS appearance_mode
          FROM accounts a
          LEFT JOIN requester_departments department
            ON department.id = COALESCE(a.profile_department_id, a.department_id)
          WHERE a.id = 'P24-ACCOUNT'`,
  },
]);

function plannerFlags(steps) {
  const details = steps.map((entry) => String(entry.detail ?? ''));
  return {
    fullScan: details.some((detail) => /^SCAN\s/iu.test(detail) && !/USING (?:COVERING )?INDEX/iu.test(detail)),
    tempSort: details.some((detail) => /USE TEMP B-TREE FOR ORDER BY/iu.test(detail)),
    tempGroup: details.some((detail) => /USE TEMP B-TREE FOR GROUP BY/iu.test(detail)),
    indexes: [...new Set(details.flatMap((detail) => [...detail.matchAll(/USING (?:COVERING )?INDEX ([^ ]+)/giu)].map((match) => match[1])))],
  };
}

async function applyMigrations(db) {
  const names = (await readdir(MIGRATIONS)).filter((name) => /^\d{4}_.+\.sql$/u.test(name)).sort();
  for (const name of names) {
    const sql = await readFile(path.join(MIGRATIONS, name), 'utf8');
    for (const statement of unstable_splitSqlQuery(sql)) {
      await db.prepare(statement).run();
    }
  }
  return names;
}

const miniflare = new Miniflare({
  modules: true,
  script: 'export default { fetch() { return new Response("ok"); } }',
  d1Databases: ['DB'],
});

try {
  const db = await miniflare.getD1Database('DB');
  const migrations = await applyMigrations(db);
  const indexResult = await db
    .prepare(
      `SELECT name, tbl_name AS tableName, sql
       FROM sqlite_master
       WHERE type = 'index' AND sql IS NOT NULL
       ORDER BY tbl_name, name`,
    )
    .all();
  const plans = [];
  for (const query of QUERIES) {
    const result = await db.prepare(`EXPLAIN QUERY PLAN ${query.sql}`).all();
    const steps = result.results.map((entry) => ({
      id: Number(entry.id),
      parent: Number(entry.parent),
      detail: String(entry.detail),
    }));
    plans.push({ id: query.id, surface: query.surface, flags: plannerFlags(steps), steps });
  }
  const report = {
    schemaVersion: 1,
    phase: 'P24',
    measurementClass: 'local-schema-32-query-plan-audit',
    measuredAt: new Date().toISOString(),
    migrations: { count: migrations.length, latest: migrations.at(-1) },
    rowsReadAvailable: false,
    rowsReadLimitation:
      'Authenticated remote D1 inventory failed before query execution; this receipt contains deterministic local schema/query-plan evidence only.',
    indexes: indexResult.results,
    plans,
  };
  const output = argument('output');
  if (output) {
    const outputPath = path.resolve(ROOT, output);
    await writeFile(outputPath, `${JSON.stringify(report, null, 2)}\n`, 'utf8');
    process.stdout.write(`P24 query-plan audit written to ${path.relative(ROOT, outputPath).replaceAll('\\', '/')}\n`);
  } else {
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
  }
  process.stdout.write(
    `${JSON.stringify({
      queryCount: plans.length,
      fullScans: plans.filter((plan) => plan.flags.fullScan).map((plan) => plan.id),
      tempSorts: plans.filter((plan) => plan.flags.tempSort).map((plan) => plan.id),
    })}\n`,
  );
} finally {
  await miniflare.dispose();
}
