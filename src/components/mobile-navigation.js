const PRIMARY = [
  ['overview', 'Overview'],
  ['requests', 'Request'],
  ['release', 'Release'],
  ['inventory', 'Inventory'],
];

export function mobileNavigation(active) {
  return `<nav class="bottom-nav" aria-label="Primary mobile navigation">${PRIMARY.map(([id, label]) => `<button type="button" data-navigate="${id}" ${active === id ? 'aria-current="page"' : ''}>${label}</button>`).join('')}<button type="button" data-open-more aria-haspopup="dialog">More</button></nav>`;
}
