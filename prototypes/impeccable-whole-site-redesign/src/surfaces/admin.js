/* Administration and supporting modules. */

import { icon } from '../icons.js';
import {
  chip,
  deniedState,
  esc,
  facts,
  field,
  notice,
  pageHead,
  queueTable,
  rowLink,
} from '../components.js';
import { ACCOUNTS } from '../data/mock.js';
import { COMMITTEE_LABELS, ROLE_LABELS, label } from '../data/vocabulary.js';

export function access({ state }) {
  const head = pageHead({
    crumbs: ['Administration', 'Accounts and access'],
    title: 'Accounts and Access',
    lede: 'Effective access is granted by role and committee scope. Hiding a control is not authorization.',
    actions: `<button class="btn btn--primary" type="button">${icon('plus')}Invite account</button>`,
  });

  if (state === 'denied') return `${head}${deniedState()}`;

  return `${head}
  <div style="margin-top:16px">
  ${queueTable({
    caption: 'Accounts with their effective role and scope.',
    columns: [
      { label: 'Account' },
      { label: 'Role' },
      { label: 'Committee scope', priority: 3 },
      { label: 'Mapping', priority: 2 },
      { label: 'State' },
    ],
    rows: ACCOUNTS.map((a) => ({
      ref: a.name,
      cells: [
        rowLink(a.name, a.name, a.mapped ? 'Mapped to directory' : 'Awaiting review', 'noop'),
        esc(label(a.role, ROLE_LABELS)),
        a.committee ? esc(label(a.committee, COMMITTEE_LABELS)) : '<span class="muted">All operations</span>',
        a.mapped
          ? '<span class="chip" data-tone="done">Mapped</span>'
          : '<span class="chip" data-tone="progress">Unmatched</span>',
        chip(a.status),
      ],
    })),
  })}
  </div>
  ${notice({
    tone: 'info',
    title: 'Unmatched applicants stay closed',
    body: 'An application whose verified email does not exactly match the protected directory waits for manual review. It is never approved automatically.',
  })}`;
}

export const directory = () => `${pageHead({
  crumbs: ['Administration', 'Staff Directory'],
  title: 'Staff Directory',
  lede: 'A read-only projection of the protected institutional roster.',
})}
${notice({
  tone: 'info',
  title: 'This directory is read-only here',
  body: 'Entries come from the protected institutional source. Corrections are made at the source and applied through a reviewed synchronisation.',
})}
<div class="panel" style="margin-top:16px"><div class="panel__body">
  ${facts([
    { label: 'Active entries', value: '37' },
    { label: 'Quarantined source rows', value: '90' },
    { label: 'Last synchronisation', value: '5 August 2026' },
    { label: 'Inconsistent runs', value: '0' },
  ])}
</div></div>`;

export const reference = () => `${pageHead({
  crumbs: ['Administration', 'Reference Administration'],
  title: 'Reference Administration',
  lede: 'Controlled lists that other modules depend on. Changes are audited.',
  actions: `<button class="btn btn--primary" type="button">${icon('plus')}Add entry</button>`,
})}
<div style="margin-top:16px">
${queueTable({
  caption: 'Controlled reference catalogs.',
  columns: [{ label: 'Catalog' }, { label: 'Entries', numeric: true, priority: 2 }, { label: 'State' }],
  rows: [
    { ref: 'cat', cells: [rowLink('cat', 'Item categories', '7 controlled values', 'noop'), '7', chip('ACTIVE')] },
    { ref: 'unit', cells: [rowLink('unit', 'Units of measure', '10 controlled values', 'noop'), '10', chip('ACTIVE')] },
    { ref: 'dep', cells: [rowLink('dep', 'USC departments', 'Source-controlled', 'noop'), '24', chip('ACTIVE')] },
    { ref: 'sup', cells: [rowLink('sup', 'Supplier references', 'Materials committee only', 'noop'), '12', chip('ACTIVE')] },
  ],
})}
</div>`;

export const links = () => `${pageHead({
  crumbs: ['Administration', 'Reference Administration', 'Link Registry'],
  title: 'Link Registry',
  lede: 'Named destinations used across the system, so URLs are never hard-coded into content.',
  actions: `<button class="btn btn--primary" type="button">${icon('plus')}Add link</button>`,
})}
<div style="margin-top:16px">
${queueTable({
  caption: 'Registered links and their publication state.',
  columns: [{ label: 'Link' }, { label: 'Used by', priority: 3 }, { label: 'State' }],
  rows: [
    { ref: 'l1', cells: [rowLink('l1', 'Request Center guide', 'Public portals', 'noop'), 'Public request intake', chip('ACTIVE')] },
    { ref: 'l2', cells: [rowLink('l2', 'Lending terms', 'Public portals', 'noop'), 'Public lending intake', chip('ACTIVE')] },
    { ref: 'l3', cells: [rowLink('l3', 'Privacy Notice', 'All surfaces', 'noop'), 'Footer', chip('ACTIVE')] },
    { ref: 'l4', cells: [rowLink('l4', 'Archived orientation deck', 'Retired', 'noop'), 'Not in use', chip('ARCHIVED')] },
  ],
})}
</div>
${notice({
  tone: 'info',
  title: 'Synchronisation is queued, not immediate',
  body: 'Changes here publish to the system first. External synchronisation follows and is reported separately on System status.',
})}`;

export const brand = () => `${pageHead({
  crumbs: ['Administration', 'Brand and Media'],
  title: 'Brand and Media',
  lede: 'Versioned institutional assets. Publishing replaces the live asset; previous versions are retained.',
  actions: `<button class="btn btn--primary" type="button">${icon('plus')}Upload version</button>`,
})}
<div style="margin-top:16px">
${queueTable({
  caption: 'Brand asset slots and their published version.',
  columns: [{ label: 'Slot' }, { label: 'Version', numeric: true, priority: 2 }, { label: 'Published', priority: 3 }, { label: 'State' }],
  rows: [
    { ref: 'b1', cells: [rowLink('b1', 'Primary institutional mark', 'Used in the rail and public bar', 'noop'), '3', '2 August 2026', chip('ACTIVE')] },
    { ref: 'b2', cells: [rowLink('b2', 'Council mark', 'Used beside the institutional mark', 'noop'), '2', '2 August 2026', chip('ACTIVE')] },
    { ref: 'b3', cells: [rowLink('b3', 'Public portal banner', 'Public landing', 'noop'), '1', 'Not published', chip('ARCHIVED')] },
  ],
})}
</div>`;

export const profile = () => `${pageHead({
  crumbs: ['My profile'],
  title: 'My profile',
  lede: 'Your own details and sign-in security. You cannot change your own role or scope.',
})}
<div class="rails" style="margin-top:16px">
  <div class="panel"><div class="panel__body">
    <h2 class="block-title">Your access</h2>
    ${facts([
      { label: 'Role', value: 'Administrator' },
      { label: 'Scope', value: 'All authorized operations' },
      { label: 'Committee', value: 'Not applicable' },
      { label: 'Account state', html: chip('ACTIVE') },
    ])}
    ${notice({
      tone: 'info',
      title: 'Role changes go through Accounts and Access',
      body: 'Only an administrator can change a role, and every change is audited.',
    })}
  </div></div>
  <div class="panel"><div class="panel__body">
    <h2 class="block-title">Password</h2>
    <form style="display:grid;gap:16px" onsubmit="return false">
      ${field({ label: 'Current password', name: 'cur', type: 'password', required: true })}
      ${field({ label: 'New password', name: 'nw', type: 'password', required: true, hint: 'At least 12 characters.' })}
      <button class="btn btn--primary" type="submit" style="justify-self:start">Update password</button>
    </form>
  </div></div>
</div>`;
