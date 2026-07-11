import { statusChip, escapeHtml } from '../../components/status-chip.js';
import { taskRisk } from '../../domain/tasks.js';
import { renderTaskTracker } from '../tasks/view.js';

const percent = (value, total) => (total ? Math.round((value / total) * 100) : 0);

export function renderOverview(ctx) {
  const { state, selectors } = ctx;
  const warnings = selectors.warnings(state);
  const overdueTasks = state.eventTasks.filter((task) =>
    ['OVERDUE', 'AT_RISK'].includes(taskRisk(task, state.demoToday)),
  );
  const overdueLoans = state.lendingTickets.filter(
    (ticket) => ticket.status === 'ON_LOAN' && ticket.dueDate < state.demoToday,
  );
  const reviewCount = state.requests.filter((request) => request.status === 'FOR_REVIEW').length;
  const upcoming = state.events.filter((event) => event.status === 'UPCOMING');
  const attention = [
    ...warnings.slice(0, 4).map((warning) => ({
      title: warning.code.replaceAll('_', ' '),
      detail: `${warning.entityId}${warning.value !== undefined ? ` · raw value ${warning.value}` : ''}`,
      view: warning.code.includes('QUOTE') ? 'procurement' : 'inventory',
    })),
    ...overdueTasks.map((task) => ({
      title: `${taskRisk(task, state.demoToday)} task`,
      detail: task.title,
      view: 'overview',
    })),
    ...overdueLoans.map((ticket) => ({
      title: 'Overdue loan',
      detail: `${ticket.id} · ${ticket.borrowerName}`,
      view: 'lending',
    })),
  ];
  return `<div class="view-grid"><section class="panel hero"><p class="eyebrow">Welcome to HAU-USC Logistics</p><h2>One accountable workspace from request to physical handoff.</h2><p>Every preview reservation, receipt, release, loan, return, and transfer is traceable. Quantity remains ledger-derived.</p><div class="button-row section-gap"><button class="primary" data-navigate="requests">Create request</button><button class="secondary" data-navigate="release">Open Release Desk</button><button class="ghost" data-navigate="procurement">Review deliverables</button></div></section>
  <section class="panel"><div class="panel-head"><div><p class="eyebrow">1 · Needs attention</p><h2>Operational exceptions</h2></div><span class="pill">${attention.length} items</span></div>${
    attention.length
      ? `<div class="list">${attention
          .slice(0, 8)
          .map(
            (item) =>
              `<button class="list-item" type="button" data-navigate="${item.view}"><span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.detail)}</small></span><span aria-hidden="true">→</span></button>`,
          )
          .join('')}</div>`
      : '<div class="empty-state"><h3>No urgent preview exceptions</h3><p>All monitored rules currently reconcile.</p></div>'
  }</section>
  <section class="panel"><div class="panel-head"><div><p class="eyebrow">2 · Quick actions</p><h2>Move work forward</h2></div></div><div class="grid-4"><button class="card" data-navigate="requests"><strong>${reviewCount}</strong><p>Requests for review</p></button><button class="card" data-navigate="release"><strong>${state.requestLines.filter((line) => ['READY_TO_RELEASE', 'PARTIALLY_RELEASED'].includes(line.status)).length}</strong><p>Release-ready lines</p></button><button class="card" data-navigate="restocking"><strong>${state.restockRequests.filter((row) => row.status !== 'RESTOCKED').length}</strong><p>Open restocks</p></button><button class="card" data-navigate="lending"><strong>${overdueLoans.length}</strong><p>Overdue loans</p></button></div></section>
  <section class="panel"><div class="panel-head"><div><p class="eyebrow">3 · Upcoming events</p><h2>Readiness by lines and quantity</h2></div><label>Committee filter<select data-committee-filter><option>All committees</option><option>Food Committee</option><option>Inventory Committee</option><option>Materials Committee</option></select></label></div><div class="grid-2">${upcoming
    .map((event) => {
      const lines = state.requestLines.filter((line) =>
        state.requests.some((request) => request.id === line.requestId && request.eventId === event.id),
      );
      const ready = lines.filter((line) => ['READY_TO_RELEASE', 'COMPLETED'].includes(line.status));
      const totalQuantity = lines.reduce((sum, line) => sum + Number(line.quantity), 0);
      const readyQuantity = ready.reduce((sum, line) => sum + Number(line.quantity), 0);
      return `<article class="card"><div class="button-row"><span class="pill">${escapeHtml(event.startDate)}</span>${statusChip(event.status, 'Upcoming')}</div><h3 class="section-gap">${escapeHtml(event.name)}</h3><p class="muted">${escapeHtml(event.venue)} · ${escapeHtml(event.committee)}</p><div class="grid-2 section-gap"><div class="metric"><span>Line readiness</span><strong>${percent(ready.length, lines.length)}%</strong><small>${ready.length}/${lines.length || 0} lines</small></div><div class="metric"><span>Quantity readiness</span><strong>${percent(readyQuantity, totalQuantity)}%</strong><small>${readyQuantity}/${totalQuantity || 0} units</small></div></div><div class="button-row section-gap">${['FOR_REVIEW', 'FOR_CANVASSING', 'TO_BE_PROCURED', 'READY_TO_RELEASE', 'COMPLETED'].map((status) => statusChip(status, `${lines.filter((line) => line.status === status).length} ${status.replaceAll('_', ' ').toLowerCase()}`)).join('')}</div></article>`;
    })
    .join('')}</div></section>
  ${renderTaskTracker(state)}<section class="grid-4"><article class="card metric"><span>Inventory products</span><strong>${state.inventoryItems.filter((item) => item.status === 'ACTIVE').length}</strong><small>Paginated catalog</small></article><article class="card metric"><span>Active reservations</span><strong>${state.reservations.filter((row) => row.status === 'ACTIVE').length}</strong><small>Allocation controls</small></article><article class="card metric"><span>Ledger movements</span><strong>${state.ledgerTransactions.length}</strong><small>Immutable preview rows</small></article><article class="card metric"><span>Audit records</span><strong>${state.auditLog.length}</strong><small>Correlation-backed</small></article></section>
  <details class="panel collapsible"><summary>Completed event history</summary><div class="list">${state.events
    .filter((event) => event.status === 'COMPLETED')
    .map(
      (event) =>
        `<div class="list-item"><span><strong>${escapeHtml(event.name)}</strong><small>${escapeHtml(event.startDate)} · ${escapeHtml(event.venue)}</small></span>${statusChip('COMPLETED')}</div>`,
    )
    .join('')}</div></details>
  <details class="panel collapsible"><summary>Roadmap to v1.0</summary><ol><li><strong>Preserve baseline</strong> — archived authoritative prototype and audit.</li><li><strong>P0 integrity</strong> — unique IDs, cumulative receipts, guarded idempotent commands.</li><li><strong>UX and accessibility</strong> — responsive navigation, focus management, readable targets.</li><li><strong>Modular source</strong> — Vite modules, tests, and single-file build.</li><li><strong>Backend</strong> — institutional identity and LockService transactions.</li></ol></details></div>`;
}
