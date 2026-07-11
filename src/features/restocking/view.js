import { statusChip, escapeHtml } from '../../components/status-chip.js';
import { receiptTotals } from '../../domain/receiving.js';
import { openModal, openConfirmation } from '../../components/modal.js';

export function renderRestocking(ctx) {
  const query = (ctx.ui.restockSearch ?? '').toLowerCase();
  const status = ctx.ui.restockStatus ?? 'ALL';
  const rows = ctx.state.restockRequests.filter((restock) => {
    const item = ctx.state.inventoryItems.find((row) => row.id === restock.itemId);
    return (
      (!query || [restock.id, restock.requestId, item?.name].join(' ').toLowerCase().includes(query)) &&
      (status === 'ALL' || restock.status === status)
    );
  });
  return `<div class="view-grid"><section class="panel hero"><p class="eyebrow">Restocking</p><h2>Line-specific, cumulative receiving</h2><p>Every delivery becomes an immutable receipt linked to exactly one restock request and one request line. Siblings remain untouched.</p></section><section class="panel"><div class="panel-head"><div><h2>Catalog restock requests</h2><p>Ordered, received, remaining, shortage, damaged, substitution, and evidence context.</p></div><span class="pill">${rows.length} matching lines</span></div><div class="toolbar"><input data-restock-search value="${escapeHtml(ctx.ui.restockSearch ?? '')}" aria-label="Search restocks" placeholder="Search item, request, or RRQ" /><select data-restock-status><option value="ALL">All statuses</option><option value="PARTIALLY_RECEIVED">Partially received</option><option value="TO_BE_PROCURED">To be procured</option><option value="RESTOCKED">Restocked</option></select><button class="secondary" data-clear-restock>Clear all</button></div><div class="list">${rows
    .map((restock) => {
      const item = ctx.state.inventoryItems.find((row) => row.id === restock.itemId);
      const totals = receiptTotals(ctx.state.restockReceipts, restock.id);
      const remaining = restock.quantityOrdered - totals.received;
      return `<article class="list-item"><span><div class="button-row">${statusChip(restock.status)}<code>${restock.id}</code></div><strong>${escapeHtml(item?.name)}</strong><small>${restock.requestId} / ${restock.requestLineId}<br>Requested ${restock.quantityOrdered} · received ${totals.received} · remaining ${remaining} ${item?.unit}</small></span>${['TO_BE_PROCURED', 'PARTIALLY_RECEIVED'].includes(restock.status) ? `<button class="primary" data-receive-restock="${restock.id}">Receive this line</button>` : ''}</article>`;
    })
    .join(
      '',
    )}</div></section><section class="panel"><div class="panel-head"><div><h2>Receipt history</h2><p>Recent and full preview history remain immutable.</p></div><span class="pill">${ctx.state.restockReceipts.length} receipts</span></div><div class="list">${ctx.state.restockReceipts.map((receipt) => `<div class="list-item"><span><strong>${receipt.id} · ${receipt.quantityReceived} received</strong><small>${receipt.relatedId} · ${receipt.invoiceStatus} ${escapeHtml(receipt.invoiceNumber || '')}<br>${receipt.receivedAt}</small></span>${statusChip('COMPLETED', 'Immutable')}</div>`).join('')}</div></section></div>`;
}

export function mountRestocking(ctx, root) {
  root.querySelector('[data-restock-status]').value = ctx.ui.restockStatus ?? 'ALL';
  root.querySelector('[data-restock-search]').addEventListener('input', (event) => {
    ctx.ui.restockSearch = event.target.value;
    clearTimeout(ctx.ui.restockTimer);
    ctx.ui.restockTimer = setTimeout(ctx.renderActive, 180);
  });
  root.querySelector('[data-restock-status]').addEventListener('change', (event) => {
    ctx.ui.restockStatus = event.target.value;
    ctx.renderActive();
  });
  root.querySelector('[data-clear-restock]').addEventListener('click', () => {
    ctx.ui.restockSearch = '';
    ctx.ui.restockStatus = 'ALL';
    ctx.renderActive();
  });
  root.querySelectorAll('[data-receive-restock]').forEach((button) => {
    const restock = ctx.state.restockRequests.find((row) => row.id === button.dataset.receiveRestock);
    const line = ctx.state.requestLines.find((row) => row.id === restock.requestLineId);
    const totals = receiptTotals(ctx.state.restockReceipts, restock.id);
    const remaining = restock.quantityOrdered - totals.received;
    button.addEventListener('click', () =>
      openModal({
        title: `Receive ${restock.id}`,
        body: `<form id="restock-receipt-form" class="stack"><div class="alert"><div><strong>Line-level receipt</strong><p>${line.description}: ${remaining} ${line.unit} remaining. Sibling request lines will not be completed.</p></div></div><div class="form-grid"><label>Received now<input name="quantityReceivedNow" type="number" min="0.01" max="${remaining}" step="0.01" value="${remaining}" required /></label><label>Damaged<input name="quantityDamaged" type="number" min="0" value="0" /></label><label>Rejected<input name="quantityRejected" type="number" min="0" value="0" /></label><label>Supplier<select name="supplierId">${ctx.state.suppliers.map((supplier) => `<option value="${supplier.id}">${escapeHtml(supplier.name)}</option>`).join('')}</select></label><label>Invoice/receipt status<select name="invoiceStatus"><option>SALES_INVOICE</option><option>ORIGINAL_RECEIPT</option><option>PENDING</option></select></label><label>Invoice number<input name="invoiceNumber" /></label><label>Unit price (PHP)<input name="unitPrice" type="number" min="0" step="0.01" value="0" /></label><label>Storage area<select name="storageArea"><option>Inventory</option><option>Pantry</option></select></label><label class="span-2">Storage location<input name="storageLocation" value="Main Logistics Room" /></label><label class="span-2">Shortage/substitution/notes<textarea name="notes"></textarea></label></div><button class="primary" type="submit">Review receipt</button></form>`,
        onMount(body, close) {
          body.querySelector('form').addEventListener('submit', (event) => {
            event.preventDefault();
            const values = Object.fromEntries(new FormData(event.currentTarget));
            close();
            openConfirmation({
              title: `Post receipt to ${restock.id}`,
              summary: `${values.quantityReceivedNow} ${line.unit} will be added to ${line.itemId}.`,
              effects: [
                'Append one immutable restock receipt',
                'Append one RECEIPT ledger movement',
                `Update only ${restock.requestLineId}`,
                'Recompute parent from all sibling lines',
              ],
              confirmLabel: 'Post cumulative receipt',
              onConfirm: async () => {
                const result = await ctx.service.receiveRestock({
                  ...values,
                  quantityDamaged: values.quantityDamaged,
                  quantityRejected: values.quantityRejected,
                  restockRequestId: restock.id,
                  requestLineId: restock.requestLineId,
                  idempotencyKey: crypto.randomUUID(),
                  actor: 'Preview Receiving Staff',
                });
                ctx.toast(
                  `${result.receiptId}: cumulative ${result.receivedTotal}; ${result.quantityRemaining} remaining.`,
                );
              },
            });
          });
        },
      }),
    );
  });
}
