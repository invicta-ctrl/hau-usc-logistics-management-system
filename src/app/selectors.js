import { buildInventoryIndexes, qualityWarnings } from '../domain/inventory.js';

export function createSelectors() {
  let inventoryCache = null;
  return {
    indexes(state) {
      if (!inventoryCache || inventoryCache.revision !== state.revisions.inventory)
        inventoryCache = buildInventoryIndexes(state);
      return inventoryCache;
    },
    warnings(state) {
      const indexes = this.indexes(state);
      return qualityWarnings(state, indexes);
    },
    requestLines(state, requestId) {
      return state.requestLines.filter((line) => line.requestId === requestId);
    },
    sanitizedBootstrap(state) {
      return {
        previewMode: true,
        events: state.events
          .filter((event) => event.status === 'UPCOMING')
          .map(({ id, seriesId, name, startDate, endDate }) => ({ id, seriesId, name, startDate, endDate })),
        eventSeries: state.eventSeries
          .filter((series) => series.approved)
          .map(({ id, name }) => ({ id, name })),
        catalogSuggestions: state.inventoryItems
          .filter((item) => item.status === 'ACTIVE')
          .map(({ id, name, aliases, category, unit }) => ({ id, name, aliases, category, unit })),
        units: [...new Set(state.inventoryItems.map((item) => item.unit))],
      };
    },
  };
}
