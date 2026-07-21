import { statusChip, escapeHtml } from '../../components/status-chip.js';
import { openModal, openConfirmation } from '../../components/modal.js';

function detailMarkup(restock) {
  const quote = restock.preferredQuote;
  const decisions = restock.allowedActions ?? [];
  return `<div class="stack"><div class="alert"><div><strong>${escapeHtml(restock.id)} / ${escapeHtml(restock.requestLineId)}</strong><p>${restock.receivedQuantity} received · ${restock.remainingQuantity} remaining · revision ${restock.workflowRevision}</p></div></div>${restock.reconciliationRequired ? '<div class="alert error"><div><strong>Reconciliation required</strong><p>Immutable receipt totals do not match the stored request-line total. All actions remain disabled.</p></div></div>' : ''}<section><h3>Preferred quote</h3><p>${quote ? `${escapeHtml(quote.supplierName)} · PHP ${Number(quote.price).toFixed(2)} / ${escapeHtml(quote.unit)}` : 'No single active preferred quote is recorded.'}</p></section><section><h3>Server-authorized actions</h3><div class="button-row">${decisions.map((decision) => `<button type="button" class="${['REJECT', 'CANCEL'].includes(decision.action) ? 'danger' : 'secondary'}" data-restock-action="${decision.action}" ${decision.allowed ? '' : 'disabled'} title="${escapeHtml(decision.disabledReason || decision.consequence)}">${escapeHtml(decision.label)}</button>`).join('')}</div>${decisions.filter((decision) => !decision.allowed).map((decision) => `<small>${escapeHtml(decision.label)}: ${escapeHtml(decision.disabledReason)}</small>`).join('')}</section><section><h3>Line history</h3>${(restock.timeline ?? []).length ? (restock.timeline ?? []).map((entry) => `<p><strong>${escapeHtml(entry.status)}</strong><br><small>${escapeHtml(entry.changedAt ?? entry.at ?? '')}${entry.reason ? ` · ${escapeHtml(entry.reason)}` : ''}</small></p>`).join('') : '<p>No status history is available.</p>'}</section></div>`;
}

function openTransition(ctx, restock, decision) {
  openModal({
    title: decision.label,
    body: `<form id="restock-transition-form" class="stack"><div class="alert"><div><strong>${escapeHtml(restock.id)} / ${escapeHtml(restock.requestLineId)}</strong><p>${escapeHtml(restock.status)} → ${escapeHtml(decision.targetStatus)}. This cannot complete a sibling line.</p></div></div><label>Required reason<textarea name="reason" maxlength="500" required></textarea></label><button class="primary" type="submit">Review transition</button></form>`,
    onMount(body, close) {
      body.querySelector('form').addEventListener('submit', (event) => {
        event.preventDefault();
        if (!event.currentTarget.reportValidity()) return;
        const reason = new FormData(event.currentTarget).get('reason');
        close();
        openConfirmation({
          title: `Confirm ${decision.label}`,
          summary: `${restock.id} will move to ${decision.targetStatus}.`,
          effects: ['Recheck server authorization and expected revision', 'Append immutable history and audit records', `Update only ${restock.requestLineId}`, 'Refresh the queue from authoritative state'],
          confirmLabel: decision.label,
          onConfirm: async () => {
            const result = await ctx.service.transitionRestock({
              restockRequestId: restock.id,
              requestLineId: restock.requestLineId,
              expectedRevision: restock.workflowRevision,
              action: decision.action,
              reason,
              idempotencyKey: crypto.randomUUID(),
              actor: 'Preview Inventory Staff',
            });
            ctx.toast(`${restock.id} moved to ${result.status}.`);
          },
        });
      });
    },
  });
}

function openReceiving(ctx, restock) {
  openModal({
    title: `Receive ${restock.id}`,
    body: `<form id="restock-receipt-form" class="stack"><div class="alert"><div><strong>Exact line and revision locked</strong><p>${escapeHtml(restock.requestLineId)} · ${restock.remainingQuantity} ${escapeHtml(restock.unit ?? '')} remaining. Sibling request lines will not be completed.</p></div></div><div class="form-grid"><label>Received now<input name="quantityReceivedNow" type="number" min="0.01" max="${restock.remainingQuantity}" step="0.01" value="${restock.remainingQuantity}" required /></label><label>Damaged<input name="quantityDamaged" type="number" min="0" value="0" /></label><label>Rejected<input name="quantityRejected" type="number" min="0" value="0" /></label><label>Supplier<select name="supplierId">${ctx.state.suppliers.map((supplier) => `<option value="${supplier.id}">${escapeHtml(supplier.name)}</option>`).join('')}</select></label><label>Invoice/receipt status<select name="invoiceStatus"><option>SALES_INVOICE</option><option>ORIGINAL_RECEIPT</option><option>PENDING</option></select></label><label>Invoice number<input name="invoiceNumber" /></label><label>Unit price (PHP)<input name="unitPrice" type="number" min="0" step="0.01" value="0" /></label><label>Storage area<select name="storageArea"><option>Inventory</option><option>Pantry</option></select></label><label class="span-2">Storage location<input name="storageLocation" value="Main Logistics Room" /></label><label class="span-2">Shortage/substitution/notes<textarea name="notes"></textarea></label></div><button class="primary" type="submit">Review receipt</button></form>`,
    onMount(body, close) {
      body.querySelector('form').addEventListener('submit', (event) => {
        event.preventDefault();
        if (!event.currentTarget.reportValidity()) return;
        const values = Object.fromEntries(new FormData(event.currentTarget));
        close();
        openConfirmation({
          title: `Post receipt to ${restock.id}`,
          summary: `${values.quantityReceivedNow} ${restock.unit} will be added to ${restock.requestLineId}.`,
          effects: ['Append one immutable restock receipt', 'Append one PURCHASE_RECEIPT ledger movement', `Update only ${restock.requestLineId}`, 'Recompute parent status from every sibling line'],
          confirmLabel: 'Post cumulative receipt',
          onConfirm: async () => {
            const result = await ctx.service.receiveRestock({
              ...values,
              restockRequestId: restock.id,
              requestLineId: restock.requestLineId,
              expectedRevision: restock.workflowRevision,
              idempotencyKey: crypto.randomUUID(),
              actor: 'Preview Receiving Staff',
            });
            ctx.toast(`${result.receiptId}: cumulative ${result.receivedTotal}; ${result.quantityRemaining} remaining.`);
          },
        });
      });
    },
  });
}

async function openDetail(ctx, queueRow) {
  const result = await ctx.service.getRestockDetail({
    restockRequestId: queueRow.id,
    requestLineId: queueRow.requestLineId,
  });
  const restock = result.restock;
  openModal({
    title: `Review ${restock.id}`,
    body: detailMarkup(restock),
    onMount(body, close) {
      body.querySelectorAll('[data-restock-action]').forEach((button) => {
        button.addEventListener('click', () => {
          const decision = restock.allowedActions.find((entry) => entry.action === button.dataset.restockAction);
          if (!decision?.allowed) return;
          close();
          if (decision.action === 'RECEIVE') openReceiving(ctx, restock);
          else openTransition(ctx, restock, decision);
        });
      });
    },
  });
}

export function renderRestocking(ctx) {
  const query = (ctx.ui.restockSearch ?? '').toLowerCase();
  const status = ctx.ui.restockStatus ?? 'ALL';
  const rows = ctx.state.restockRequests.filter((restock) => {
    const item = ctx.state.inventoryItems.find((row) => row.id === restock.itemId);
    return (!query || [restock.id, restock.requestId, item?.name].join(' ').toLowerCase().includes(query)) && (status === 'ALL' || restock.status === status);
  });
  return `<div class="view-grid"><section class="panel hero"><p class="eyebrow">Restocking</p><h2>Server-controlled, line-specific review</h2><p>Queue rows are read-only. Open authoritative details to see permitted transitions, disabled reasons, history, and cumulative receiving for exactly one line.</p></section><section class="panel"><div class="panel-head"><div><h2>Catalog restock requests</h2><p>Consequential controls appear only after an authoritative detail refresh.</p></div><span class="pill">${rows.length} matching lines</span></div><div class="toolbar"><input data-restock-search value="${escapeHtml(ctx.ui.restockSearch ?? '')}" aria-label="Search restocks" placeholder="Search item, request, or RRQ" /><select data-restock-status><option value="ALL">All statuses</option><option value="FOR_CANVASSING">For canvassing</option><option value="WAITING_FOR_BUDGET">Waiting for budget</option><option value="TO_BE_PROCURED">To be procured</option><option value="PARTIALLY_RECEIVED">Partially received</option><option value="RESTOCKED">Restocked</option></select><button class="secondary" data-clear-restock>Clear all</button></div><div class="list">${rows.map((restock) => { const item = ctx.state.inventoryItems.find((row) => row.id === restock.itemId); return `<article class="list-item"><span><div class="button-row">${statusChip(restock.status)}<code>${escapeHtml(restock.id)}</code></div><strong>${escapeHtml(item?.name ?? restock.itemId)}</strong><small>${escapeHtml(restock.requestId)} / ${escapeHtml(restock.requestLineId)}<br>Requested ${restock.quantityOrdered} ${escapeHtml(item?.unit ?? '')}</small></span><button class="secondary" data-review-restock="${escapeHtml(restock.id)}">Review details</button></article>`; }).join('')}</div></section><section class="panel"><div class="panel-head"><div><h2>Receipt history</h2><p>Immutable line-linked receipts.</p></div><span class="pill">${ctx.state.restockReceipts.length} receipts</span></div><div class="list">${ctx.state.restockReceipts.map((receipt) => `<div class="list-item"><span><strong>${escapeHtml(receipt.id)} · ${receipt.quantityReceived} received</strong><small>${escapeHtml(receipt.relatedId)} · ${escapeHtml(receipt.invoiceStatus)} ${escapeHtml(receipt.invoiceNumber || '')}<br>${escapeHtml(receipt.receivedAt)}</small></span>${statusChip('COMPLETED', 'Immutable')}</div>`).join('')}</div></section></div>`;
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
  root.querySelectorAll('[data-review-restock]').forEach((button) => {
    button.addEventListener('click', async () => {
      const row = ctx.state.restockRequests.find((entry) => entry.id === button.dataset.reviewRestock);
      if (row) await openDetail(ctx, row);
    });
  });
}
