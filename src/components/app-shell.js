import { mobileNavigation } from './mobile-navigation.js';

export const NAV = [
  ['overview', 'Operations Overview', 'Attention, events, readiness'],
  ['requests', 'Request Center', 'Events and catalog restock'],
  ['release', 'Release Desk', 'Controlled physical handoff'],
  ['inventory', 'Inventory Management', 'Catalog, balances, ledger'],
  ['lending', 'Office Lending Hub', 'Loans and consumables'],
  ['restocking', 'Restocking', 'Line-level immutable receipts'],
  ['procurement', 'Procurement & Deliverables', 'Canvass, receive, transfer'],
  ['reports', 'Reports & Admin', 'Exports and diagnostics'],
];

export function appShell({ active, requestOnly }) {
  if (requestOnly)
    return `<div class="app-shell"><div class="preview-banner">Preview-only requester portal · sanitized data · no production writes</div><header class="mobile-topbar"><strong>HAU-USC Logistics Request</strong><span class="pill">Preview</span></header><main id="main-content" class="content" tabindex="-1"><div id="view-root"></div></main><div class="toast-region" aria-live="polite"></div></div>`;
  return `<div class="app-shell"><div class="preview-banner">PREVIEW MODE · Mock data only · No Google Sheets, Drive, email, or backend writes</div><aside class="sidebar"><div class="brand"><div class="brand-mark" aria-label="DOL logo placeholder">DOL</div><div><strong>HAU-USC Logistics</strong><small>Operations Prototype</small></div></div><nav class="desktop-nav" aria-label="Application modules">${NAV.map(([id, label, description]) => `<button type="button" data-navigate="${id}" ${active === id ? 'aria-current="page"' : ''}><strong>${label}</strong><small>${description}</small></button>`).join('')}</nav></aside><div class="workspace"><header class="topbar"><div><p class="eyebrow">Department of Logistics</p><h1 data-view-title>Operations Overview</h1></div><label>Preview role (not security)<select data-role-switch><option value="REQUESTER">Requester</option><option value="DOL_STAFF">DOL Staff</option><option value="COMMITTEE_HEAD">Committee Head</option><option value="DIRECTOR">Director</option><option value="ADMINISTRATOR">Administrator</option></select></label></header><header class="mobile-topbar"><div><strong>HAU-USC Logistics</strong><small class="muted">Preview mode</small></div><button class="icon-button" type="button" data-open-more aria-label="Open more modules">☰</button></header><main id="main-content" class="content" tabindex="-1"><div id="global-warning"></div><div id="view-root"></div></main></div>${mobileNavigation(active)}<div class="toast-region" aria-live="polite"></div></div>`;
}
