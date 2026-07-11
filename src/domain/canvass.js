export const normalizeQuoteSearch = (quote, supplier) =>
  [quote.id, quote.itemSpec, ...(quote.tags ?? []), supplier?.name, supplier?.branch, quote.notes]
    .join(' ')
    .toLowerCase();
export function findQuoteDuplicates(quotes, candidate) {
  return quotes.filter(
    (quote) =>
      quote.supplierId === candidate.supplierId &&
      quote.itemSpec.toLowerCase() === candidate.itemSpec.toLowerCase() &&
      quote.checkedOn === candidate.checkedOn,
  );
}
