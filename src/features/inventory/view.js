import { statusChip, escapeHtml } from '../../components/status-chip.js';
import { dataTable } from '../../components/data-table.js';
import { mobileCardList } from '../../components/mobile-card-list.js';
import { overflowMenu } from '../../components/overflow-menu.js';
import { paginate, pagination } from '../../components/pagination.js';
import { availableToPromise } from '../../domain/inventory.js';
import { reorderSuggestion } from '../../domain/restocking.js';
import { openDrawer, openModal, openConfirmation } from '../../components/modal.js';

export function renderInventory(ctx) {
  const indexes = ctx.selectors.indexes(ctx.state);
  const query = (ctx.ui.inventorySearch ?? '').toLowerCase();
  const area = ctx.ui.inventoryArea ?? 'ALL';
  const filtered = ctx.state.inventoryItems.filter(
    (item) =>
      item.status !== 'ARCHIVED' &&
      (!query || indexes.searchText.get(item.id).includes(query)) &&
      (area === 'ALL' || item.area === area),
  );
  const page = paginate(filtered, ctx.ui.inventoryPage ?? 1, 10);
  const row = (item) => {
    const onHand = indexes.onHand.get(item.id) ?? 0;
    const reserved = indexes.reserved.get(item.id) ?? 0;
    const atp = availableToPromise(item.id, indexes);
    const suggestion = reorderSuggestion({
      onHand,
      threshold: item.reorderThreshold,
      recentDemand: 20,
      leadTimeDays: 7,
    });
    return `<tr><td><strong>${escapeHtml(item.name)}</strong><code>${item.id}</code><small>${escapeHtml(item.category)} · ${item.unit}</small></td><td>${onHand}<small>Raw audit balance</small></td><td>${reserved}</td><td><strong class="${atp < 0 ? 'danger-text' : ''}">${atp}</strong><small>${atp < 0 ? 'Allocation blocked' : 'Available to promise'}</small></td><td>${suggestion ? statusChip('FOR_REVIEW', `Suggest ${suggestion}`) : statusChip('COMPLETED', 'Sufficient')}<small>Reorder at ${item.reorderThreshold}</small></td><td><button class="secondary" data-ledger-history="${item.id}">Ledger history</button></td></tr>`;
  };
  return `<div class="view-grid"><section class="panel hero"><p class="eyebrow">Inventory Management</p><h2>Catalog metadata is separate from quantity truth.</h2><p>On-hand comes only from immutable ledger movements. Raw negative exceptions remain visible while new allocations are blocked.</p></section><section class="panel"><div class="panel-head"><div><h2>Catalog and balances</h2><p>Search, filters, scalable pagination, ledger context, cycle count, labels, and archive controls.</p></div><span class="pill">${filtered.length} active products</span></div><div class="toolbar"><input data-inventory-search value="${escapeHtml(ctx.ui.inventorySearch ?? '')}" placeholder="Search Product ID, name, alias, category, area, or specification" aria-label="Search inventory" /><select data-inventory-area><option value="ALL">All areas</option><option>Inventory</option><option>Pantry</option><option>Event-Specific</option></select><button class="secondary" data-clear-inventory>Clear all</button></div>${dataTable({ caption: 'Inventory catalog with ledger-derived balances', columns: ['Product', 'On hand', 'Reserved', 'Available', 'Reorder', 'Actions'], rows: page.rows, rowRenderer: row })}${mobileCardList(
    page.rows,
    (item) => {
      const onHand = indexes.onHand.get(item.id) ?? 0;
      const reserved = indexes.reserved.get(item.id) ?? 0;
      const atp = availableToPromise(item.id, indexes);
      return `<article class="card"><div class="button-row"><span class="pill">${item.id}</span>${statusChip(atp <= 0 ? 'FOR_REVIEW' : 'COMPLETED', atp <= 0 ? 'Verify' : 'Available')}</div><h3 class="section-gap">${escapeHtml(item.name)}</h3><p>${escapeHtml(item.category)} · ${item.area} · ${item.handling}</p><p><strong>On hand ${onHand}</strong> · Reserved ${reserved} · ATP <span class="${atp < 0 ? 'danger-text' : ''}">${atp}</span> ${item.unit}</p>${overflowMenu(
        item.id,
        [
          { action: 'ledger-history', label: `Open ${item.name} ledger history` },
          { action: 'cycle-count', label: `Start cycle count for ${item.name}` },
          { action: 'print-label', label: `Preview label for ${item.name}` },
          { action: 'archive-item', label: `Review archive eligibility for ${item.name}` },
        ],
      )}</article>`;
    },
  )}${pagination({ ...page, target: 'inventory' })}</section></div>`;
}

export function mountInventory(ctx, root) {
  root.querySelector('[data-inventory-area]').value = ctx.ui.inventoryArea ?? 'ALL';
  root.querySelector('[data-inventory-search]').addEventListener('input', (event) => {
    ctx.ui.inventorySearch = event.target.value;
    ctx.ui.inventoryPage = 1;
    clearTimeout(ctx.ui.inventoryTimer);
    ctx.ui.inventoryTimer = setTimeout(ctx.renderActive, 180);
  });
  root.querySelector('[data-inventory-area]').addEventListener('change', (event) => {
    ctx.ui.inventoryArea = event.target.value;
    ctx.ui.inventoryPage = 1;
    ctx.renderActive();
  });
  root.querySelector('[data-clear-inventory]').addEventListener('click', () => {
    ctx.ui.inventorySearch = '';
    ctx.ui.inventoryArea = 'ALL';
    ctx.ui.inventoryPage = 1;
    ctx.renderActive();
  });
  root.querySelectorAll('[data-page]').forEach((button) =>
    button.addEventListener('click', () => {
      ctx.ui.inventoryPage = Number(button.dataset.page);
      ctx.renderActive();
    }),
  );
  root.querySelectorAll('[data-overflow-toggle]').forEach((button) =>
    button.addEventListener('click', () => {
      const menu = root.querySelector(`[data-overflow-menu="${button.dataset.overflowToggle}"]`);
      const opening = menu.classList.contains('hidden');
      root.querySelectorAll('[data-overflow-menu]').forEach((node) => node.classList.add('hidden'));
      menu.classList.toggle('hidden', !opening);
      button.setAttribute('aria-expanded', String(opening));
    }),
  );
  root
    .querySelectorAll('[data-ledger-history], [data-action="ledger-history"]')
    .forEach((button) =>
      button.addEventListener('click', () =>
        showLedger(ctx, button.dataset.ledgerHistory || button.dataset.id),
      ),
    );
  root
    .querySelectorAll('[data-action="cycle-count"]')
    .forEach((button) => button.addEventListener('click', () => showCycleCount(ctx, button.dataset.id)));
  root.querySelectorAll('[data-action="print-label"]').forEach((button) =>
    button.addEventListener('click', () => {
      const item = ctx.state.inventoryItems.find((row) => row.id === button.dataset.id);
      openModal({
        title: `Label preview ${item.id}`,
        body: `<div class="panel"><p class="eyebrow">HAU-USC Logistics</p><h2>${escapeHtml(item.name)}</h2><p>${item.id} · ${item.unit} · ${escapeHtml(item.storage)}</p><div class="empty-state section-gap"><strong>QR / barcode placeholder</strong><p>Production label service not connected.</p></div></div>`,
      });
    }),
  );
  root.querySelectorAll('[data-action="archive-item"]').forEach((button) =>
    button.addEventListener('click', () => {
      const item = ctx.state.inventoryItems.find((row) => row.id === button.dataset.id);
      const indexes = ctx.selectors.indexes(ctx.state);
      const onHand = indexes.onHand.get(item.id) ?? 0;
      const reserved = indexes.reserved.get(item.id) ?? 0;
      openModal({
        title: `Archive eligibility · ${item.id}`,
        body: `<div class="alert ${onHand || reserved ? 'error' : 'success'}"><div><strong>${onHand || reserved ? 'Archive blocked safely' : 'Eligible for controlled archive'}</strong><p>On hand ${onHand}; reserved ${reserved}. ${onHand || reserved ? 'A catalog item with quantity or reservations cannot be archived.' : 'Production archive would require an authorized reason and audit record.'}</p></div></div>`,
      });
    }),
  );
}

function showLedger(ctx, itemId) {
  const item = ctx.state.inventoryItems.find((row) => row.id === itemId);
  const indexes = ctx.selectors.indexes(ctx.state);
  const rows = ctx.state.ledgerTransactions
    .filter((txn) => txn.itemId === itemId)
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  openDrawer({
    title: `${item.id} · ${escapeHtml(item.name)}`,
    body: `<div class="grid-3"><div class="card metric"><span>On hand</span><strong>${indexes.onHand.get(itemId) ?? 0}</strong></div><div class="card metric"><span>Reserved</span><strong>${indexes.reserved.get(itemId) ?? 0}</strong></div><div class="card metric"><span>ATP</span><strong>${availableToPromise(itemId, indexes)}</strong></div></div><div class="list section-gap">${rows.map((txn) => `<div class="list-item"><span><strong>${txn.type} · ${txn.direction === 'IN' ? '+' : '-'}${txn.quantity}</strong><small>${txn.id} · ${txn.timestamp}<br>${escapeHtml(txn.note)}</small></span><code>${txn.auditCorrelationId}</code></div>`).join('')}</div>`,
  });
}

function showCycleCount(ctx, itemId) {
  const item = ctx.state.inventoryItems.find((row) => row.id === itemId);
  const expected = ctx.selectors.indexes(ctx.state).onHand.get(itemId) ?? 0;
  openModal({
    title: `Cycle count ${item.id}`,
    body: `<form class="stack"><div class="alert"><div><strong>Expected ${expected} ${item.unit}</strong><p>An approved production workflow would require a second reviewer for adjustments.</p></div></div><label>Physical count<input name="physicalCount" type="number" min="0" value="${expected}" /></label><label>Adjustment reason<textarea name="reason">Preview cycle count reconciliation</textarea></label><button class="primary" type="submit">Review adjustment</button></form>`,
    onMount(body, close) {
      body.querySelector('form').addEventListener('submit', (event) => {
        event.preventDefault();
        const values = Object.fromEntries(new FormData(event.currentTarget));
        close();
        openConfirmation({
          title: `Confirm count ${item.id}`,
          summary: `Expected ${expected}; physical count ${values.physicalCount}.`,
          effects: [
            'Record discrepancy and reason',
            'Append immutable adjustment movement only when needed',
            'Preserve preview approval placeholder',
          ],
          onConfirm: async () =>
            ctx.service.postCycleCountAdjustment({
              ...values,
              itemId,
              sessionId: `COUNT-${Date.now()}`,
              idempotencyKey: crypto.randomUUID(),
              actor: 'Preview Inventory Staff',
            }),
        });
      });
    },
  });
}
