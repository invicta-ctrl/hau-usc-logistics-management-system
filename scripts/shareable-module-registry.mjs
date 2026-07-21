export const shareableModules = Object.freeze([
  Object.freeze({
    id: 'overview',
    order: 1,
    title: 'Operations Overview',
    filename: 'hau-usc-logistics-01-overview-shareable.html',
  }),
  Object.freeze({
    id: 'request',
    order: 2,
    title: 'Request Center',
    filename: 'hau-usc-logistics-02-request-center-shareable.html',
  }),
  Object.freeze({
    id: 'lending',
    order: 3,
    title: 'Office Lending Hub',
    filename: 'hau-usc-logistics-03-office-lending-hub-shareable.html',
  }),
  Object.freeze({
    id: 'release',
    order: 4,
    title: 'Release Desk',
    filename: 'hau-usc-logistics-04-release-desk-shareable.html',
  }),
  Object.freeze({
    id: 'restocking',
    order: 5,
    title: 'Restocking',
    filename: 'hau-usc-logistics-05-restocking-shareable.html',
  }),
  Object.freeze({
    id: 'procurement',
    order: 6,
    title: 'Procurement & Deliverables',
    filename: 'hau-usc-logistics-06-procurement-deliverables-shareable.html',
  }),
  Object.freeze({
    id: 'inventory',
    order: 7,
    title: 'Inventory Management',
    filename: 'hau-usc-logistics-07-inventory-management-shareable.html',
  }),
]);

export const shareableModuleIds = Object.freeze(shareableModules.map(({ id }) => id));
