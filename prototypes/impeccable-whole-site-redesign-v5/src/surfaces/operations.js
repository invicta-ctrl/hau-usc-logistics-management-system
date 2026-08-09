/* Internal operational surfaces.
   Queue + detail is the default shape. Cards appear only where the content is
   genuinely heterogeneous. Every action implies a capability the actor holds. */

import { icon } from '../icons.js';
import {
  attentionBand,
  chip,
  composition,
  contextLine,
  deniedState,
  emptyState,
  esc,
  evidenceList,
  facts,
  loadingState,
  meter,
  notice,
  pageHead,
  qty,
  queueTable,
  rowLink,
  timeline,
} from '../components.js';
import {
  ACTIVITY,
  EVENTS,
  HEALTH,
  INVENTORY,
  INVENTORY_COMPOSITION,
  LEDGER,
  LOANS,
  PROCUREMENT,
  RELEASES,
  REQUESTS,
  REQUEST_LINES,
  RESTOCKING,
} from '../data/mock.js';
import { LEDGER_LABELS, label, statusLabel } from '../data/vocabulary.js';

const refreshAction = `<button class="btn" type="button" data-act="refresh">${icon(
  'repeat',
)}Refresh</button>`;

/* ================= Role overviews ================= */

const OVERVIEW_CONFIG = {
  'admin.overview': {
    crumbs: ['Administrator', 'Overview'],
    title: 'Control Centre',
    lede: 'Exceptions first. Everything below needs a decision, a handoff, or a correction.',
  },
  'director.overview': {
    crumbs: ['Director', 'Overview'],
    title: 'Executive Overview',
    lede: 'Where the department stands, and what only you can decide.',
  },
  'food.overview': {
    crumbs: ['Food Committee', 'Overview'],
    title: 'Food Committee',
    lede: 'Deadline-first. Sourcing, receiving, and release for catered and pantry needs.',
  },
  'inventory.overview': {
    crumbs: ['Inventory Committee', 'Overview'],
    title: 'Inventory and Pantry',
    lede: 'Authoritative stock, circulation, and the movements behind every balance.',
  },
  'materials.overview': {
    crumbs: ['Materials Committee', 'Overview'],
    title: 'Materials Committee',
    lede: 'Canvassing, procurement, and event deliverables.',
  },
};

export function overview(id, { state }) {
  const cfg = OVERVIEW_CONFIG[id];
  const head = pageHead({ ...cfg, actions: refreshAction });

  if (state === 'unavailable') {
    return `${head}
      ${notice({
        tone: 'alert',
        title: 'Some figures could not be loaded',
        body: 'Queue counts are current. Event readiness and directory synchronisation are unavailable, so those panels are hidden rather than shown as zero. Nothing was changed.',
      })}
      ${overviewWorkbench(state)}`;
  }

  return `${head}${overviewWorkbench(state)}`;
}

function overviewWorkbench(state) {
  const isLoading = state === 'loading';
  return `<div class="overview-command">
    <section class="overview-briefing" aria-labelledby="overview-briefing-title"${
      isLoading ? ' aria-busy="true"' : ''
    }>
      <div class="overview-briefing__intro">
        <span class="label">Operational brief · ${isLoading ? 'updating' : 'now'}</span>
        <h2 id="overview-briefing-title">${
          isLoading
            ? 'Refreshing the decision line.'
            : 'Decisions, custody, and release in one line of sight.'
        }</h2>
        <p>${
          isLoading
            ? 'Checking the latest illustrative records. Counts will appear together when this pass finishes.'
            : 'Start with the exception that can block today’s work, then move through review, handoff, and stock.'
        }</p>
      </div>
      ${isLoading ? overviewAttentionLoading() : attention()}
    </section>
    ${
      isLoading
        ? overviewContextLoading()
        : contextLine([
            { label: 'Active event series', value: '3' },
            { label: 'Sub-events', value: '12' },
            { label: 'Open requests', value: '18' },
            { label: 'Items tracked', value: '1,248' },
          ])
    }
    <div class="overview-workbench">
      <div class="overview-workbench__primary">${queueSection(state)}</div>
      <aside class="overview-workbench__support" aria-label="Operational context">
        ${rails(state)}
      </aside>
    </div>
  </div>`;
}

function overviewAttentionLoading() {
  return `<div class="overview-loading-grid" aria-hidden="true">
    ${Array.from({ length: 4 })
      .map(
        (_, index) => `<span class="overview-loading-card" style="--row:${index}">
          <i class="skeleton skeleton--primary"></i>
          <i class="skeleton skeleton--status"></i>
          <i class="skeleton skeleton--secondary"></i>
        </span>`,
      )
      .join('')}
  </div>
  <p class="visually-hidden" role="status">Updating illustrative operational counts.</p>`;
}

function overviewContextLoading() {
  return `<div class="overview-context-loading" aria-hidden="true">
    ${Array.from({ length: 4 })
      .map(
        () => `<span><i class="skeleton skeleton--secondary"></i><i class="skeleton skeleton--status"></i></span>`,
      )
      .join('')}
  </div>`;
}

function attention() {
  return attentionBand([
    {
      label: 'Loans overdue',
      value: '2',
      note: 'Oldest 4 days past due',
      icon: 'clock',
      urgent: true,
      act: 'go:lending.queue',
    },
    {
      label: 'Requests for review',
      value: '2',
      note: 'Each line needs one decision',
      icon: 'clipboard',
      act: 'go:request.queue',
    },
    {
      label: 'Ready to release',
      value: '1',
      note: '60 units awaiting handoff',
      icon: 'check',
      act: 'go:release.desk',
    },
    {
      label: 'Low or out of stock',
      value: '4',
      note: '1 item at zero',
      icon: 'box',
      act: 'go:inventory.catalog',
    },
  ]);
}

function queueSection(state) {
  const rows = REQUESTS.filter((r) => r.status === 'FOR_REVIEW' || r.status === 'READY_TO_RELEASE');
  return `<section class="section">
    <div class="section__head">
      <h2>Needs a decision today</h2>
      <a class="btn btn--sm btn--quiet" href="#/request.queue">Open Request Center${icon(
        'chevron-right',
        'icon--sm',
      )}</a>
    </div>
    ${
      state === 'loading'
        ? loadingState(3)
        : state === 'empty'
          ? emptyState({
              title: 'Nothing is waiting on you',
              body: 'No request or release in your scope needs a decision right now.',
            })
          : queueTable({
              caption: 'Requests and releases awaiting a decision in your scope.',
              columns: [
                { label: 'Request' },
                { label: 'Committee', priority: 3 },
                { label: 'Needed', priority: 2, nowrap: true },
                { label: 'Lines', numeric: true, priority: 2 },
                { label: 'Status' },
              ],
              rows: rows.map((r) => ({
                ref: r.ref,
                cells: [
                  rowLink(r.ref, r.title, `${r.ref} · ${r.org}`, 'select:request'),
                  esc(label(r.committee, { COM_FOOD: 'Food', COM_INVENTORY_PANTRY: 'Inventory', COM_MATERIALS: 'Materials' })),
                  esc(r.needed),
                  String(r.lines),
                  chip(r.status),
                ],
              })),
            })
    }
  </section>`;
}

function rails(state) {
  if (state === 'empty') return '';
  if (state === 'loading') {
    return `<div class="rails rails--overview overview-support-loading" aria-hidden="true">
      ${Array.from({ length: 3 })
        .map(
          () => `<section class="rail-block">
            <span class="skeleton skeleton--primary"></span>
            <span class="skeleton skeleton--secondary"></span>
            <span class="skeleton skeleton--secondary"></span>
          </section>`,
        )
        .join('')}
    </div>`;
  }
  return `<div class="rails rails--overview">
    <section class="rail-block">
      <div class="rail-block__head"><h3>Recent activity</h3>
        <a class="btn btn--sm btn--quiet" href="#/audit.activity">All</a></div>
      <ul class="stack-list">
        ${ACTIVITY.slice(0, 5)
          .map(
            (a) =>
              `<li><span><b>${esc(a.text)}</b><span>${esc(a.kind)}</span></span><span class="muted" style="font-size:var(--t-xs);white-space:nowrap">${esc(
                a.time,
              )}</span></li>`,
          )
          .join('')}
      </ul>
    </section>
    <section class="rail-block">
      <div class="rail-block__head"><h3>Inventory composition</h3>
        <a class="btn btn--sm btn--quiet" href="#/inventory.catalog">Open</a></div>
      ${composition(INVENTORY_COMPOSITION)}
    </section>
    <section class="rail-block">
      <div class="rail-block__head"><h3>Event readiness</h3>
        <a class="btn btn--sm btn--quiet" href="#/events.series">All</a></div>
      <ul class="stack-list">
        ${EVENTS.map(
          (e) =>
            `<li><span><b>${esc(e.name)}</b><span>${esc(e.window)} · ${e.subEvents} sub-events</span></span>
             <span style="text-align:right">${meter(
               e.readiness,
               100,
               e.readiness >= 90 ? 'done' : e.readiness < 50 ? 'alert' : 'progress',
             )}</span></li>`,
        ).join('')}
      </ul>
    </section>
  </div>`;
}

/* ================= Request Center ================= */

export function requestQueue({ state, selected }) {
  const head = pageHead({
    crumbs: ['Request Center', 'Review queue'],
    title: 'Request Center',
    lede: 'Every line needs one explicit routing decision. Nothing is routed by default.',
    actions: `<button class="btn" type="button" data-act="filter">${icon('filter')}Filter</button>${refreshAction}`,
  });

  if (state === 'loading') return `${head}<div class="split"><div>${loadingState(6)}</div></div>`;
  if (state === 'empty')
    return `${head}<div class="split"><div class="panel">${emptyState({
      title: 'No requests in this scope',
      body: 'When a request is submitted through the portal or created internally, it appears here for review.',
    })}</div></div>`;
  if (state === 'denied') return `${head}${deniedState()}`;

  const table = queueTable({
    caption: 'Requests in your authorized scope, newest first.',
    columns: [
      { label: 'Request' },
      { label: 'Committee', priority: 3 },
      { label: 'Needed', priority: 2, nowrap: true },
      { label: 'Routed', numeric: true, priority: 2 },
      { label: 'Status' },
    ],
    selectedRef: selected ?? 'REQ-DEMO-431',
    rows: REQUESTS.map((r) => ({
      ref: r.ref,
      cells: [
        rowLink(r.ref, r.title, `${r.ref} · ${r.org}`, 'select:request'),
        esc(label(r.committee, { COM_FOOD: 'Food', COM_INVENTORY_PANTRY: 'Inventory', COM_MATERIALS: 'Materials' })),
        esc(r.needed),
        `${r.routed} / ${r.lines}`,
        chip(r.status),
      ],
    })),
  });

  return `${head}
    <div class="split">
      <div>${table}</div>
      ${requestDetailPanel(state)}
    </div>`;
}

/* Lines still carrying no decision. The surface's own rule — one explicit
   routing decision per line, nothing routed by default — has to be readable
   from the data, not restated as a hand-written count that can drift. */
const PENDING_LINES = REQUEST_LINES.filter((line) => line.route === 'PENDING_DECISION').length;

function acceptBlockedReason(stale) {
  if (stale) return 'Reload this request before deciding. Another reviewer changed it while you were reading.';
  if (PENDING_LINES)
    return `${PENDING_LINES} of ${REQUEST_LINES.length} lines still need a routing decision.`;
  return '';
}

/* The request detail is built in parts because two surfaces render it: the
   desktop split pane and, below 1180px, the drawer. The drawer used to carry a
   summary sentence and no lines at all, which left the one decision this
   surface exists for impossible on tablet and phone. */
export function requestDetailParts(state, titleAction = '') {
  const stale = state === 'stale';
  const blockedReason = acceptBlockedReason(stale);

  const head = `<div class="detail__title">
        <h2>Sound system and stage materials</h2>
        ${chip('FOR_REVIEW')}${titleAction}
      </div>
      <p class="muted" style="font-size:var(--t-xs)">REQ-DEMO-431 · Illustrative Executive Council · needed 19 May 2032</p>`;

  const body = `${
        stale
          ? notice({
              tone: 'alert',
              title: 'This request changed while you were reading it',
              body: 'Another reviewer routed two lines 40 seconds ago. Your decisions were not saved. Reload to see the current lines before deciding.',
              action:
                '<button class="btn btn--sm" type="button" style="margin-top:10px">Reload request</button>',
            })
          : ''
      }
      ${facts([
        { label: 'Event', value: 'Aurora Commons Week · Route A' },
        { label: 'Committee', value: 'Materials' },
        { label: 'Submitted', value: '7 May 2032' },
        { label: 'Lines routed', value: '0 of 6' },
      ])}
      <section>
        <div class="section__head" style="margin-bottom:10px"><h3>Lines</h3>
          <span class="muted" style="font-size:var(--t-xs)">One decision each</span></div>
        <div class="table-wrap"><table class="q">
          <caption>Requested lines with authoritative stock on hand.</caption>
          <thead><tr><th scope="col">Item</th><th scope="col" style="text-align:right">Requested</th>
            <th scope="col" style="text-align:right" class="col-p2">On hand</th><th scope="col">Route</th></tr></thead>
          <tbody>${REQUEST_LINES.map(
            (l) => `<tr><th scope="row"><b style="font-size:var(--t-sm)">${esc(l.item)}</b></th>
            <td class="q__num">${qty(l.qty, l.unit)}</td>
            <td class="q__num col-p2">${l.onHand === 0 ? '<span class="muted">None</span>' : l.onHand}</td>
            <td>${routeControl(l.route)}</td></tr>`,
          ).join('')}</tbody>
        </table></div>
      </section>
      <section>
        <div class="section__head" style="margin-bottom:10px"><h3>Evidence</h3></div>
        ${evidenceList([
          { name: 'Approved activity proposal', meta: 'PDF · uploaded 7 August', state: 'Verified', tone: 'done' },
        ])}
      </section>`;

  /* `aria-disabled` alone announced a block the control did not enforce, so the
     button stayed clickable for everyone it claimed to stop. The reason travels
     with the control; the click handler reads it and says what is in the way. */
  const foot = `<button class="btn btn--primary" type="button" data-act="confirm-accept"${
      blockedReason ? ` aria-disabled="true" data-blocked-reason="${esc(blockedReason)}"` : ''
    }>${icon('check')}Accept and reserve</button>
      <button class="btn" type="button">Ask for information</button>
      <button class="btn btn--quiet" type="button">Reject</button>`;

  return { head, body, foot };
}

function requestDetailPanel(state) {
  const { head, body, foot } = requestDetailParts(state);
  return `<aside class="split__detail" aria-label="Request detail">
    <div class="detail__head">${head}</div>
    <div class="detail__body">${body}</div>
    <div class="detail__foot">${foot}</div>
  </aside>`;
}

function routeControl(route) {
  const map = {
    ISSUE_FROM_STOCK: 'Issue from Stock',
    PROCUREMENT_REQUIRED: 'Procurement Required',
    PENDING_DECISION: 'Pending Decision',
    STOCK_REVIEW: 'Review Available Stock',
  };
  const pending = route === 'PENDING_DECISION';
  return `<select aria-label="Routing decision" style="min-height:var(--control-h);padding:5px 8px;border:1px solid ${
    pending ? 'var(--tone-alert-fg)' : 'var(--line-strong)'
  };border-radius:var(--r-sm);background:${
    pending ? 'var(--tone-alert-bg)' : 'var(--paper)'
  };font-size:var(--t-xs);max-width:100%">
    ${Object.entries(map)
      .map(([k, v]) => `<option${k === route ? ' selected' : ''}>${esc(v)}</option>`)
      .join('')}
  </select>`;
}

/* ================= Office Lending Hub ================= */

export function lendingQueue({ state }) {
  const head = pageHead({
    crumbs: ['Office Lending Hub', 'Loans'],
    title: 'Office Lending Hub',
    lede: 'Review, ready-to-claim, handoff, on loan, overdue, and return are distinct states.',
    actions: refreshAction,
  });

  if (state === 'empty')
    return `${head}<div class="panel" style="margin-top:16px">${emptyState({
      title: 'No loans in this scope',
      body: 'Approved lending requests appear here once a borrower is confirmed.',
    })}</div>`;

  return `${head}
    ${notice({
      tone: 'alert',
      title: '2 loans are overdue',
      body: 'Follow up on returns before approving new loans for the same borrowers.',
    })}
    <div style="margin-top:16px">
    ${queueTable({
      caption: 'Loans in your authorized scope.',
      columns: [
        { label: 'Loan' },
        { label: 'Borrower', priority: 3 },
        { label: 'Return by', priority: 2, nowrap: true },
        { label: 'Evidence', priority: 3 },
        { label: 'Status' },
      ],
      rows: LOANS.map((l) => ({
        ref: l.ref,
        cells: [
          rowLink(l.ref, l.item, `${l.ref}${l.days ? ` · ${l.days} days past due` : ''}`, 'go:lending.detail'),
          esc(`${l.borrower} · ${l.kind}`),
          esc(l.due),
          l.evidence
            ? '<span class="chip" data-tone="done">Recorded</span>'
            : '<span class="chip">Not required</span>',
          chip(l.status),
        ],
      })),
    })}
    </div>`;
}

export function lendingDetail() {
  return `${pageHead({
    crumbs: ['Office Lending Hub', 'LOAN-DEMO-221'],
    title: 'Portable PA system',
    lede: 'Loan LOAN-DEMO-221 · Illustrative Education Council',
    actions: `<a class="btn btn--quiet" href="#/lending.queue">${icon('arrow-left')}Back to loans</a>`,
  })}
  ${notice({
    tone: 'alert',
    title: 'This loan is 4 days overdue',
    body: 'Record the return when the item is physically back. Stock is restored by the return, not by closing this screen.',
  })}
  <div class="rails" style="margin-top:16px">
    <div class="panel"><div class="panel__body">
      <h2 class="block-title">Loan facts</h2>
      ${facts([
        { label: 'Status', html: chip('OVERDUE') },
        { label: 'Return by', value: '3 May 2032' },
        { label: 'Borrower type', value: 'USC officer' },
        { label: 'Quantity', html: qty(1, 'set') },
        { label: 'Handed over', value: '28 April 2032' },
        { label: 'Condition at handoff', value: 'Good' },
      ])}
    </div></div>
    <div class="panel"><div class="panel__body">
      <h2 class="block-title">Custody timeline</h2>
      ${timeline([
        { title: 'Requested', meta: '26 April 2032', done: true },
        { title: 'Approved', meta: '27 April 2032', done: true },
        { title: 'Handed over', meta: '28 April 2032 · recipient confirmed', done: true },
        { title: 'Overdue', meta: 'Since 3 May 2032', current: true },
        { title: 'Returned', meta: 'Not recorded' },
      ])}
    </div></div>
  </div>
  <div class="panel" style="margin-top:16px"><div class="panel__body" style="display:flex;gap:8px;flex-wrap:wrap">
    <button class="btn btn--primary" type="button" data-act="confirm-return">${icon('check')}Preview return</button>
    <button class="btn" type="button">Record partial return</button>
    <button class="btn btn--quiet" type="button">Add note</button>
  </div></div>`;
}

/* ================= Release Desk ================= */

export function releaseDesk({ state }) {
  const head = pageHead({
    crumbs: ['Release Desk'],
    title: 'Release Desk',
    lede: 'Release can be partial and cumulative. Every handoff is confirmed by the recipient.',
    actions: refreshAction,
  });

  if (state === 'unavailable')
    return `${head}${notice({
      tone: 'alert',
      title: 'Evidence storage is unavailable',
      body: 'You can still record a release, but the handoff photo cannot be attached right now. The release will be recorded and the evidence marked as pending upload. Nothing is lost.',
    })}<div style="margin-top:16px">${releaseTable()}</div>`;

  if (state === 'success')
    return `${head}${notice({
      tone: 'done',
      title: 'Partial release recorded for REQ-DEMO-417',
      body: '18 of 42 units released and confirmed by the recipient. The remaining 24 units stay reserved and this request remains open.',
    })}<div style="margin-top:16px">${releaseTable()}</div>`;

  return `${head}
    ${notice({
      tone: 'info',
      title: 'Stock moves only when you record a release',
      body: 'Accepting a request reserves stock. The ledger records an issue at the moment of physical handoff.',
    })}
    <div style="margin-top:16px">${releaseTable()}</div>
    ${partialPanel()}`;
}

function releaseTable() {
  return queueTable({
    caption: 'Requests reserved and awaiting or undergoing release.',
    columns: [
      { label: 'Request' },
      { label: 'Recipient', priority: 3 },
      { label: 'Released', numeric: true },
      { label: 'Status' },
    ],
    rows: RELEASES.map((r) => ({
      ref: r.ref,
      cells: [
        rowLink(r.ref, r.title, r.ref, 'select:release'),
        esc(r.recipient),
        meter(r.released, r.total, r.released === r.total ? 'done' : 'progress'),
        chip(r.status),
      ],
    })),
  });
}

function partialPanel() {
  return `<section class="section">
    <div class="section__head"><h2>Record a release · REQ-DEMO-417</h2></div>
    <div class="panel" style="margin-top:12px"><div class="panel__body" style="display:grid;gap:16px">
      ${facts([
        { label: 'Reserved', html: qty(42, 'units') },
        { label: 'Already released', html: qty(18, 'units') },
        { label: 'Remaining', html: qty(24, 'units') },
        { label: 'Recipient', value: 'Committee on Facilities' },
      ])}
      <div class="form-row" style="max-width:520px">
        <div class="field"><label for="rel-q">Quantity to release now</label>
          <input id="rel-q" type="number" value="12" max="24" aria-describedby="rel-q-h" />
          <span class="field__hint" id="rel-q-h">Cannot exceed the 24 units still reserved.</span></div>
        <div class="field"><label for="rel-c">Recipient confirming</label>
          <input id="rel-c" type="text" value="Committee on Facilities" /></div>
      </div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <button class="btn btn--primary" type="button" data-act="confirm-release">${icon('check')}Record release</button>
        <button class="btn" type="button">Attach handoff evidence</button>
      </div>
    </div></div>
  </section>`;
}

/* ================= Inventory ================= */

export function inventoryCatalog({ state }) {
  const head = pageHead({
    crumbs: ['Inventory Management'],
    title: 'Inventory',
    lede: 'Balances are derived from the movement ledger. They are not edited directly.',
    actions: `<button class="btn" type="button" data-act="filter">${icon('filter')}Filter</button>${refreshAction}`,
  });

  if (state === 'loading') return `${head}<div style="margin-top:16px">${loadingState(7)}</div>`;

  return `${head}
    ${notice({
      tone: 'progress',
      title: '1 item needs classification',
      body: 'Unclassified items cannot be lent or released until a committee head classifies them.',
    })}
    <div style="margin-top:16px">
    ${queueTable({
      caption: 'Active inventory in your authorized scope.',
      columns: [
        { label: 'Item' },
        { label: 'Category', priority: 3 },
        { label: 'Handling', priority: 3 },
        { label: 'On hand', numeric: true },
        { label: 'Reserved', numeric: true, priority: 2 },
        { label: 'State' },
      ],
      rows: INVENTORY.map((i) => ({
        ref: i.ref,
        cells: [
          rowLink(i.ref, i.name, i.ref, 'go:inventory.item'),
          i.category
            ? esc(label(i.category, {
                OFFICE_SUPPLIES: 'Office Supplies',
                PANTRY_FOOD: 'Pantry Food',
                EQUIPMENT: 'Equipment',
                PRINTING_SIGNAGE: 'Printing and Signage',
                CLEANING_SUPPLIES: 'Cleaning Supplies',
              }))
            : '<span class="muted">Needs classification</span>',
          esc(i.handling),
          qty(i.onHand, i.unit),
          i.reserved ? String(i.reserved) : '<span class="muted">—</span>',
          i.onHand === 0
            ? '<span class="chip" data-tone="alert">Out of stock</span>'
            : i.low
              ? '<span class="chip" data-tone="progress">Low stock</span>'
              : chip('ACTIVE'),
        ],
      })),
    })}
    </div>`;
}

export function inventoryItem() {
  return `${pageHead({
    crumbs: ['Inventory Management', 'ITM-DEMO-204'],
    title: 'Extension cord, 10 m',
    lede: 'Equipment · Reusable Asset · ITM-DEMO-204',
    actions: `<a class="btn btn--quiet" href="#/inventory.catalog">${icon('arrow-left')}Back to inventory</a>`,
  })}
  <div class="rails" style="margin-top:16px">
    <div class="panel"><div class="panel__body">
      ${facts([
        { label: 'On hand', html: qty(11, 'piece') },
        { label: 'Reserved', html: qty(6, 'piece') },
        { label: 'Available', html: qty(5, 'piece') },
        { label: 'Condition', value: 'Good' },
        { label: 'Lending audience', value: 'Eligible DOL users only' },
        { label: 'Last counted', value: 'Not recorded' },
      ])}
      ${notice({
        tone: 'info',
        title: 'Balances cannot be edited here',
        body: 'To change a balance, record a receipt, an issue, or an adjustment. The ledger below is append-only.',
      })}
    </div></div>
    <div class="panel"><div class="panel__body">
      <h2 class="block-title">Movement history</h2>
      <div class="table-wrap"><table class="ledger">
        <caption class="visually-hidden">Append-only movement history for ITM-DEMO-204.</caption>
        <thead><tr><th scope="col">Date</th><th scope="col">Movement</th><th scope="col">Reference</th><th scope="col">Change</th></tr></thead>
        <tbody>${LEDGER.map(
          (m) => `<tr><td>${esc(m.date)}</td><td>${esc(LEDGER_LABELS[m.type] ?? m.type)}</td>
          <td class="q__ref">${esc(m.ref)}</td>
          <td class="${m.qty >= 0 ? 'ledger__in' : 'ledger__out'}">${m.qty >= 0 ? '+' : ''}${m.qty}</td></tr>`,
        ).join('')}</tbody>
      </table></div>
    </div></div>
  </div>`;
}

/* ================= Restocking, procurement, events, activity ================= */

export function restockingQueue({ state }) {
  const head = pageHead({
    crumbs: ['Restocking and receiving'],
    title: 'Restocking',
    lede: 'Requests to replenish stock, and what has physically arrived.',
    actions: refreshAction,
  });
  if (state === 'partial')
    return `${head}${notice({
      tone: 'progress',
      title: 'RST-DEMO-157 is partially received',
      body: '12 of 24 bottles arrived and were added to stock. The remaining 12 stay on order. Record the rest when they arrive.',
    })}<div style="margin-top:16px">${restockTable()}</div>`;
  return `${head}<div style="margin-top:16px">${restockTable()}</div>`;
}

function restockTable() {
  return queueTable({
    caption: 'Restocking requests and receiving progress.',
    columns: [
      { label: 'Request' },
      { label: 'Received', numeric: true },
      { label: 'Status' },
    ],
    rows: RESTOCKING.map((r) => ({
      ref: r.ref,
      cells: [
        rowLink(r.ref, r.item, `${r.ref} · ${r.requested} ${r.unit} requested`, 'noop'),
        meter(r.received, r.requested, r.received === r.requested ? 'done' : 'progress'),
        chip(r.status),
      ],
    })),
  });
}

export function procurementBoard() {
  return `${pageHead({
    crumbs: ['Procurement and deliverables'],
    title: 'Procurement',
    lede: 'Canvassing, supplier references, and event deliverables.',
    actions: refreshAction,
  })}
  <div style="margin-top:16px">
  ${queueTable({
    caption: 'Canvass records and their procurement state.',
    columns: [
      { label: 'Canvass' },
      { label: 'Quotes', numeric: true, priority: 2 },
      { label: 'Preferred', priority: 3 },
      { label: 'Status' },
    ],
    rows: PROCUREMENT.map((p) => ({
      ref: p.ref,
      cells: [
        rowLink(p.ref, p.item, p.ref, 'noop'),
        String(p.suppliers),
        p.preferred === 'Not decided' ? '<span class="muted">Not decided</span>' : esc(p.preferred),
        chip(p.status),
      ],
    })),
  })}
  </div>`;
}

export function eventsSeries() {
  return `${pageHead({
    crumbs: ['Events'],
    title: 'Event series',
    lede: 'Series, sub-events, and the requests and deliverables attached to each.',
  })}
  <div style="margin-top:16px">
  ${queueTable({
    caption: 'Event series with readiness and linked requests.',
    columns: [
      { label: 'Series' },
      { label: 'Sub-events', numeric: true, priority: 2 },
      { label: 'Requests', numeric: true, priority: 2 },
      { label: 'Readiness', numeric: true },
      { label: 'Status' },
    ],
    rows: EVENTS.map((e) => ({
      ref: e.name,
      cells: [
        rowLink(e.name, e.name, e.window, 'noop'),
        String(e.subEvents),
        String(e.requests),
        meter(e.readiness, 100, e.readiness >= 90 ? 'done' : e.readiness < 50 ? 'alert' : 'progress'),
        chip(e.status),
      ],
    })),
  })}
  </div>`;
}

export function auditActivity() {
  return `${pageHead({
    crumbs: ['Recent activity'],
    title: 'Activity',
    lede: 'Consequential actions, with the actor and the record they touched.',
  })}
  <div class="panel" style="margin-top:16px"><div class="panel__body">
    <ul class="stack-list">
      ${ACTIVITY.map(
        (a) =>
          `<li><span><b>${esc(a.text)}</b><span>${esc(a.kind)}</span></span>
           <span class="muted" style="font-size:var(--t-xs);white-space:nowrap">${esc(a.time)}</span></li>`,
      ).join('')}
    </ul>
  </div></div>
  ${notice({
    tone: 'info',
    title: 'History is never deleted',
    body: 'Corrections are recorded as reversals so the original entry stays readable.',
  })}`;
}

export function ownerHealth({ state }) {
  if (state === 'denied')
    return `${pageHead({ crumbs: ['System'], title: 'System status' })}${deniedState()}`;

  return `${pageHead({
    crumbs: ['System'],
    title: 'System status',
    lede: 'Safe aggregates only. Unavailable services are reported as unavailable, never as zero.',
    actions: refreshAction,
  })}
  <div class="panel" style="margin-top:16px"><div class="panel__body">
    ${HEALTH.map(
      (h) =>
        `<div class="health-row"><span>${esc(h.name)}</span>
         <span class="chip" data-tone="${h.tone}">${esc(h.value)}</span></div>`,
    ).join('')}
  </div></div>
  ${notice({
    tone: 'info',
    title: 'Synchronisation is an operational detail',
    body: 'External synchronisation status is reported here for operators. It is never the source of truth for stock or custody.',
  })}`;
}
