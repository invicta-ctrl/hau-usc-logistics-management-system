const PUBLIC_AUDIENCE = 'STUDENTS_AND_STAFF';

async function rows(db, sql, values = []) {
  let statement = db.prepare(sql);
  if (values.length) statement = statement.bind(...values);
  return (await statement.all()).results ?? [];
}

function nonNegative(value) {
  return Math.max(0, Number(value ?? 0) || 0);
}

export function safeLendingAvailability(row) {
  const quantity = nonNegative(row.lendable_available);
  if (row.lending_status === 'MAINTENANCE' || (quantity === 0 && Number(row.maintenance_assets) > 0)) {
    return 'MAINTENANCE';
  }
  if (quantity === 0) return 'CURRENTLY_UNAVAILABLE';
  if (String(row.eligibility_rule ?? '').trim()) return 'ELIGIBILITY_REQUIRED';
  const maximum = Math.max(1, Number(row.maximum_loan_quantity ?? 1) || 1);
  return quantity <= maximum ? 'LIMITED' : 'AVAILABLE';
}

export function lendingCatalogDto(row, { staff = false } = {}) {
  const safe = {
    id: row.id,
    productId: row.id,
    name: row.name,
    aliases: (() => {
      try {
        const parsed = JSON.parse(row.aliases_json || '[]');
        return Array.isArray(parsed) ? parsed.filter((value) => typeof value === 'string') : [];
      } catch {
        return [];
      }
    })(),
    category: row.category,
    type: row.lending_kind,
    availability: safeLendingAvailability(row),
    unit: row.lending_unit || row.unit,
    maximumQuantity: Math.max(1, Number(row.maximum_loan_quantity ?? 1) || 1),
    defaultLoanDays: Math.max(0, Number(row.default_loan_days ?? 0) || 0),
    dueDateRequired: row.due_date_required === 1,
    acknowledgmentRequired: row.acknowledgment_required === 1,
    eligibility: row.eligibility_rule || '',
    handlingNotes: row.lending_handling_notes || '',
    description: row.borrower_safe_description || '',
    restrictions: row.borrower_safe_restrictions || '',
    imageUrl: row.image_asset_key ? `/brand/catalog/${encodeURIComponent(row.image_asset_key)}` : '',
    conditionTracked: row.condition_tracking === 1,
  };
  if (!staff) return safe;
  return {
    ...safe,
    onHand: nonNegative(row.on_hand),
    reserved: nonNegative(row.reserved),
    availableToPromise: nonNegative(row.available_to_promise),
    readyToClaim: nonNegative(row.ready_to_claim),
    onLoan: nonNegative(row.on_loan),
    overdue: nonNegative(row.overdue),
    damaged: nonNegative(row.damaged_assets),
    maintenance: nonNegative(row.maintenance_assets),
    expectedReturnAt: row.expected_return_at ?? null,
    traceableAssets: nonNegative(row.traceable_assets),
    availableAssets: nonNegative(row.available_assets),
    lendableAvailable: nonNegative(row.lendable_available),
  };
}

export async function loadLendingCatalog(db, { publicOnly = false, itemId = '', staff = false } = {}) {
  const conditions = [
    "item.status = 'ACTIVE'",
    'item.is_lendable = 1',
    "item.lending_status <> 'NOT_LENDABLE'",
  ];
  const values = [];
  if (publicOnly) {
    conditions.push(`item.lending_audience = ?${values.length + 1}`);
    values.push(PUBLIC_AUDIENCE);
  }
  if (itemId) {
    conditions.push(`item.id = ?${values.length + 1}`);
    values.push(itemId);
  }
  const result = await rows(
    db,
    `SELECT item.*,
            COALESCE((
              SELECT json_group_array(alias.display_alias)
              FROM item_aliases alias
              WHERE alias.item_id = item.id
            ), '[]') AS aliases_json,
            availability.on_hand, availability.reserved,
            availability.available_to_promise, availability.ready_to_claim,
            availability.on_loan, availability.overdue, availability.expected_return_at,
            availability.traceable_assets, availability.available_assets,
            availability.damaged_assets, availability.maintenance_assets,
            availability.lendable_available
     FROM inventory_items item
     JOIN lending_catalog_availability availability ON availability.item_id = item.id
     WHERE ${conditions.join(' AND ')}
     ORDER BY item.name
     LIMIT 500`,
    values,
  );
  return result.map((row) => lendingCatalogDto(row, { staff }));
}
