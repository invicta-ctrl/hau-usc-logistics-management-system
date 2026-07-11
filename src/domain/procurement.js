export function defaultCommittee(category) {
  if (category === 'PANTRY_FOOD') return 'Food Committee';
  if (category === 'EQUIPMENT') return 'Inventory Committee';
  return 'Materials Committee';
}

export function quoteFreshness(quote, today) {
  return quote.expiresOn < today ? 'STALE' : 'FRESH';
}
