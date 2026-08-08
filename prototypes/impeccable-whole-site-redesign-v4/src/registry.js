/* Surface registry. Ids and grouping mirror docs/design/IMPECCABLE_SURFACE_MATRIX.md.
   `states` lists the state variants each surface can demonstrate. */

import * as pub from './surfaces/public.js';
import * as ops from './surfaces/operations.js';
import * as adm from './surfaces/admin.js';

const S = (id, name, group, tier, kind, render, states = ['populated']) => ({
  id,
  name,
  group,
  tier,
  kind,
  render,
  states,
});

export const SURFACES = [
  /* Public and pre-authentication */
  S('public.landing', 'Portal landing', 'Public', 'solid', 'public', pub.landing),
  S('public.signin', 'Staff sign in', 'Public', 'deep', 'public', pub.signin, [
    'populated',
    'loading',
    'error',
    'unavailable',
  ]),
  S('public.register', 'Create staff account', 'Public', 'solid', 'public', pub.register),
  S('public.verify', 'Email verification', 'Public', 'solid', 'public', pub.verify),
  S('public.application', 'Account application', 'Public', 'solid', 'public', pub.application),
  S('public.application-status', 'Application status', 'Public', 'solid', 'public', pub.applicationStatus),
  S('public.request-intake', 'Public request intake', 'Public', 'deep', 'public', pub.requestIntake, [
    'populated',
    'error',
  ]),
  S('public.request-tracking', 'Public request tracking', 'Public', 'deep', 'public', pub.requestTracking, [
    'populated',
    'empty',
    'success',
  ]),
  S('public.lending-intake', 'Public lending intake', 'Public', 'solid', 'public', pub.lendingIntake),
  S('public.lending-tracking', 'Public lending tracking', 'Public', 'solid', 'public', pub.lendingTracking),
  S('public.policy', 'Privacy and acceptable use', 'Public', 'solid', 'public', pub.policy),

  /* Role overviews */
  S('admin.overview', 'Administrator overview', 'Overviews', 'deep', 'internal', (c) => ops.overview('admin.overview', c), [
    'populated',
    'loading',
    'empty',
    'unavailable',
  ]),
  S('director.overview', 'Director overview', 'Overviews', 'solid', 'internal', (c) => ops.overview('director.overview', c)),
  S('food.overview', 'Food committee', 'Overviews', 'solid', 'internal', (c) => ops.overview('food.overview', c)),
  S('inventory.overview', 'Inventory committee', 'Overviews', 'solid', 'internal', (c) => ops.overview('inventory.overview', c)),
  S('materials.overview', 'Materials committee', 'Overviews', 'solid', 'internal', (c) => ops.overview('materials.overview', c)),

  /* Core operations */
  S('request.queue', 'Request review queue', 'Operations', 'deep', 'internal', ops.requestQueue, [
    'populated',
    'loading',
    'empty',
    'stale',
    'denied',
  ]),
  S('lending.queue', 'Lending hub', 'Operations', 'deep', 'internal', ops.lendingQueue, ['populated', 'empty']),
  S('lending.detail', 'Loan detail', 'Operations', 'deep', 'internal', ops.lendingDetail),
  S('release.desk', 'Release Desk', 'Operations', 'deep', 'internal', ops.releaseDesk, [
    'populated',
    'success',
    'unavailable',
  ]),
  S('inventory.catalog', 'Inventory', 'Operations', 'deep', 'internal', ops.inventoryCatalog, ['populated', 'loading']),
  S('inventory.item', 'Item and movement history', 'Operations', 'deep', 'internal', ops.inventoryItem),
  S('restocking.queue', 'Restocking and receiving', 'Operations', 'solid', 'internal', ops.restockingQueue, [
    'populated',
    'partial',
  ]),
  S('procurement.board', 'Procurement', 'Operations', 'solid', 'internal', ops.procurementBoard),
  S('events.series', 'Event series', 'Operations', 'solid', 'internal', ops.eventsSeries),
  S('audit.activity', 'Recent activity', 'Operations', 'solid', 'internal', ops.auditActivity),

  /* Administration */
  S('admin.access', 'Accounts and access', 'Administration', 'solid', 'internal', adm.access, ['populated', 'denied']),
  S('admin.directory', 'Staff directory', 'Administration', 'solid', 'internal', adm.directory),
  S('admin.reference', 'Reference administration', 'Administration', 'solid', 'internal', adm.reference),
  S('admin.links', 'Link registry', 'Administration', 'solid', 'internal', adm.links),
  S('admin.brand', 'Brand and media', 'Administration', 'solid', 'internal', adm.brand),
  S('account.profile', 'My profile', 'Administration', 'solid', 'internal', adm.profile),
  S('owner.health', 'System status', 'Administration', 'solid', 'internal', ops.ownerHealth, ['populated', 'denied']),
];

export const byId = (id) => SURFACES.find((s) => s.id === id);

export const GROUPS = ['Public', 'Overviews', 'Operations', 'Administration'];

/* Rail navigation — mirrors the product's module list. */
export const NAV = [
  { id: 'admin.overview', label: 'Overview', icon: 'home' },
  { id: 'request.queue', label: 'Request Center', icon: 'clipboard' },
  { id: 'lending.queue', label: 'Office Lending Hub', icon: 'repeat' },
  { id: 'release.desk', label: 'Release Desk', icon: 'check' },
  { id: 'restocking.queue', label: 'Restocking', icon: 'arrow-down' },
  { id: 'procurement.board', label: 'Procurement', icon: 'briefcase' },
  { id: 'inventory.catalog', label: 'Inventory', icon: 'box' },
  { id: 'events.series', label: 'Events', icon: 'calendar' },
];

export const NAV_ADMIN = [
  { id: 'admin.access', label: 'Accounts and Access', icon: 'users' },
  { id: 'admin.directory', label: 'Staff Directory', icon: 'users' },
  { id: 'admin.reference', label: 'Reference Administration', icon: 'settings' },
  { id: 'admin.links', label: 'Link Registry', icon: 'link' },
  { id: 'admin.brand', label: 'Brand and Media', icon: 'megaphone' },
  { id: 'owner.health', label: 'System status', icon: 'shield' },
];

export const TABS = [
  { id: 'admin.overview', label: 'Overview', icon: 'home' },
  { id: 'request.queue', label: 'Requests', icon: 'clipboard' },
  { id: 'lending.queue', label: 'Lending', icon: 'repeat' },
  { id: 'inventory.catalog', label: 'Inventory', icon: 'box' },
  { id: 'release.desk', label: 'Release', icon: 'check' },
];
