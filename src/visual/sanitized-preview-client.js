const requesterOptions = Object.freeze({
  requesterTypes: ['HAU office / department', 'Student organization'],
  eventSeries: [{ id: 'SER-SAMPLE', name: 'Campus Activity Series' }],
  events: [{ id: 'EVT-SAMPLE', seriesId: 'SER-SAMPLE', name: 'Campus Activity', venue: 'HAU Campus', startAt: '2026-08-20T08:00:00.000Z', endAt: '2026-08-20T17:00:00.000Z' }],
  stockAreas: ['Office Inventory', 'Pantry'],
  categories: ['Equipment', 'Event materials', 'Other'],
  items: [],
  references: [],
});

const lendingCatalog = Object.freeze({
  uscDepartments: ['Department of Logistics', 'University Student Council'],
  items: [
    { id: 'ITM-SAMPLE-PROJECTOR', productId: 'ITM-SAMPLE-PROJECTOR', name: 'Presentation projector', category: 'Equipment', unit: 'piece', type: 'REUSABLE', availability: 'AVAILABLE', maximumQuantity: 2, defaultLoanDays: 7, aliases: ['projector'], dueDateRequired: true, acknowledgmentRequired: true, conditionTracked: true },
    { id: 'ITM-SAMPLE-EXTENSION', productId: 'ITM-SAMPLE-EXTENSION', name: 'Extension cable', category: 'Equipment', unit: 'piece', type: 'REUSABLE', availability: 'AVAILABLE', maximumQuantity: 4, defaultLoanDays: 3, aliases: ['cable'], dueDateRequired: true, acknowledgmentRequired: true, conditionTracked: true },
  ],
  process: ['Submit for review.', 'Wait for pickup instructions.', 'Return reusable items by the due date.'],
});

export function createSanitizedPreviewClient() {
  return {
    async request(path, init = {}) {
      if (path === '/api/public/request/options') return requesterOptions;
      if (path === '/api/public/lending/catalog') return lendingCatalog;
      if (path === '/api/public/advertisements') return { items: [] };
      if (path === '/api/public/request') {
        return { requestId: 'REQ-SAMPLE-2026', trackingCode: 'SAMPLE-REQUEST-CODE' };
      }
      if (path === '/api/public/lending') {
        return { submissionId: 'LBR-SAMPLE-2026', trackingCode: 'SAMPLE-LENDING-CODE', status: 'FOR_REVIEW' };
      }
      if (path === '/api/public/request/track') {
        return { request: { id: init.body?.requestId || 'REQ-SAMPLE-2026', status: 'FOR_REVIEW', updatedAt: '2026-08-09T08:00:00.000Z', lines: [{ description: 'Sample event materials', quantity: 1, unit: 'set', status: 'FOR_REVIEW' }] } };
      }
      if (path === '/api/public/lending/track') {
        return { submission: { id: init.body?.submissionId || 'LBR-SAMPLE-2026', status: 'FOR_REVIEW', updatedAt: '2026-08-09T08:00:00.000Z', lines: [{ itemName: 'Presentation projector', quantity: 1, status: 'FOR_REVIEW' }] } };
      }
      if (path === '/api/public/request/related') {
        return { reference: { id: init.body?.requestId || 'REQ-SAMPLE-2026', requestType: 'CATALOG_RESTOCK', stockArea: 'Office Inventory', seriesId: '', eventId: '' } };
      }
      throw new Error('This public site does not perform that protected operation.');
    },
  };
}
