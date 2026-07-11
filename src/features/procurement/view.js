import { statusChip, escapeHtml } from '../../components/status-chip.js';
import { receiptTotals } from '../../domain/receiving.js';
import { quoteFreshness } from '../../domain/procurement.js';
import { openModal, openConfirmation } from '../../components/modal.js';
import { paginate, pagination } from '../../components/pagination.js';

function renderDeliverables(ctx) {
  const next = {
    FOR_CANVASSING: ['WAITING_FOR_BUDGET', 'Send to budget placeholder'],
    WAITING_FOR_BUDGET: ['TO_BE_PROCURED', 'Mark budget placeholder cleared'],
    TO_BE_PROCURED: ['PROCURED', 'Mark procured'],
  };
  return `<section class="panel"><div class="panel-head"><div><h2>Event deliverables queue</h2><p>Committee assignment, canvass, procurement, cumulative receiving, and EIT closeout.</p></div><span class="pill">${ctx.state.deliverables.length} deliverables</span></div><div class="list">${ctx.state.deliverables
    .map((item) => {
      const totals = receiptTotals(ctx.state.deliverableReceipts, item.id);
      return `<article class="list-item"><span><div class="button-row">${statusChip(item.status)}<code>${item.id}</code>${item.eventItemId ? `<span class="pill">${item.eventItemId}</span>` : ''}</div><strong>${escapeHtml(item.itemSpec)}</strong><small>${escapeHtml(item.committee)} · ${escapeHtml(item.assignee || 'Unassigned')}<br>Ordered ${item.quantityOrdered} · received ${totals.received} · remaining ${item.quantityOrdered - totals.received} ${item.unit}</small></span><div class="button-row">${next[item.status] ? `<button class="secondary" data-deliverable-transition="${item.id}" data-next-status="${next[item.status][0]}">${next[item.status][1]}</button>` : ''}${['PROCURED', 'PARTIALLY_RECEIVED'].includes(item.status) ? `<button class="primary" data-receive-deliverable="${item.id}">Receive</button>` : ''}${item.eventItemId ? `<button class="secondary" data-transfer-event="${item.id}">Transfer excess</button>` : ''}</div></article>`;
    })
    .join('')}</div></section>`;
}

function renderCanvass(ctx) {
  const query = (ctx.ui.canvassSearch ?? '').trim().toLowerCase();
  const savedView = ctx.ui.canvassView ?? 'ALL';
  const page = paginate(
    ctx.state.quotes.filter((quote) => {
      if (quote.status !== 'ACTIVE') return false;
      const supplier = ctx.state.suppliers.find((row) => row.id === quote.supplierId);
      const searchable = [quote.id, quote.itemSpec, ...(quote.tags ?? []), supplier?.name]
        .join(' ')
        .toLowerCase();
      if (query && !searchable.includes(query)) return false;
      if (savedView === 'FRESH' && quoteFreshness(quote, ctx.state.demoToday) !== 'FRESH') return false;
      if (savedView === 'STALE' && quoteFreshness(quote, ctx.state.demoToday) !== 'STALE') return false;
      if (savedView === 'MISSING' && quote.receiptCompliance !== 'MISSING') return false;
      if (savedView === 'PREFERRED' && !quote.preferred) return false;
      return true;
    }),
    ctx.ui.canvassPage ?? 1,
    10,
  );
  return `<section class="panel"><div class="panel-head"><div><h2>Canvass library</h2><p>Normalized suppliers, quote freshness, compliance, price history, saved views, archive behavior.</p></div><span class="pill">${page.total} matching references</span></div><div class="toolbar"><input data-canvass-search value="${escapeHtml(ctx.ui.canvassSearch ?? '')}" aria-label="Search canvass references" placeholder="Search supplier, item, tag, or CAN ID" /><select data-canvass-view><option value="ALL">All references</option><option value="FRESH">Fresh Quotes</option><option value="STALE">Stale Quotes</option><option value="MISSING">Missing Receipt Compliance</option><option value="PREFERRED">Preferred Suppliers</option></select><button class="secondary" data-clear-canvass>Clear all</button></div><div class="list">${page.rows
    .map((quote) => {
      const supplier = ctx.state.suppliers.find((row) => row.id === quote.supplierId);
      return `<article class="list-item"><span><div class="button-row"><code>${quote.id}</code>${statusChip(quoteFreshness(quote, ctx.state.demoToday) === 'FRESH' ? 'COMPLETED' : 'OVERDUE', quoteFreshness(quote, ctx.state.demoToday))}${quote.preferred ? '<span class="pill">Preferred</span>' : ''}</div><strong>${escapeHtml(quote.itemSpec)}</strong><small>${escapeHtml(supplier?.name)} · ₱${quote.price.toFixed(2)} / ${quote.unit}<br>${quote.receiptCompliance} · expires ${quote.expiresOn}</small></span><button class="secondary" data-quote-details="${quote.id}">Open quote details</button></article>`;
    })
    .join(
      '',
    )}</div>${pagination({ ...page, target: 'canvass' })}<div class="button-row section-gap"><button class="secondary" data-bulk-import>Bulk-import preview</button><button class="ghost" data-saved-views>Manage saved views</button></div></section>`;
}

export function renderProcurement(ctx) {
  const tab = ctx.ui.procurementTab ?? 'deliverables';
  return `<div class="view-grid"><section class="panel hero"><p class="eyebrow">Procurement & Deliverables</p><h2>Canvass, receive, register, release, and close out.</h2><p>Budget remains a visible placeholder only. No DOF approval automation or external write is active.</p></section><nav class="tabs" aria-label="Procurement sections"><button type="button" data-proc-tab="deliverables" aria-selected="${tab === 'deliverables'}">Deliverables</button><button type="button" data-proc-tab="canvass" aria-selected="${tab === 'canvass'}">Canvass Library</button></nav>${tab === 'deliverables' ? renderDeliverables(ctx) : renderCanvass(ctx)}</div>`;
}

export function mountProcurement(ctx, root) {
  root.querySelectorAll('[data-proc-tab]').forEach((button) =>
    button.addEventListener('click', () => {
      ctx.ui.procurementTab = button.dataset.procTab;
      ctx.renderActive();
    }),
  );
  root.querySelectorAll('[data-page]').forEach((button) =>
    button.addEventListener('click', () => {
      ctx.ui.canvassPage = Number(button.dataset.page);
      ctx.renderActive();
    }),
  );
  const canvassSearch = root.querySelector('[data-canvass-search]');
  if (canvassSearch) {
    root.querySelector('[data-canvass-view]').value = ctx.ui.canvassView ?? 'ALL';
    canvassSearch.addEventListener('input', (event) => {
      ctx.ui.canvassSearch = event.target.value;
      ctx.ui.canvassPage = 1;
      clearTimeout(ctx.ui.canvassTimer);
      ctx.ui.canvassTimer = setTimeout(ctx.renderActive, 180);
    });
    root.querySelector('[data-canvass-view]').addEventListener('change', (event) => {
      ctx.ui.canvassView = event.target.value;
      ctx.ui.canvassPage = 1;
      ctx.renderActive();
    });
    root.querySelector('[data-clear-canvass]').addEventListener('click', () => {
      ctx.ui.canvassSearch = '';
      ctx.ui.canvassView = 'ALL';
      ctx.ui.canvassPage = 1;
      ctx.renderActive();
    });
  }
  root.querySelectorAll('[data-deliverable-transition]').forEach((button) =>
    button.addEventListener('click', () =>
      openConfirmation({
        title: `Move ${button.dataset.deliverableTransition}`,
        summary: `Transition to ${button.dataset.nextStatus.replaceAll('_', ' ')} in preview mode.`,
        effects: [
          'Validate the explicit procurement transition map',
          'Retain budget as a placeholder only',
          'Update the linked request line and audit history',
        ],
        onConfirm: async () =>
          ctx.service.transitionDeliverable({
            deliverableId: button.dataset.deliverableTransition,
            toStatus: button.dataset.nextStatus,
            reason: 'Preview workflow authorization note',
            idempotencyKey: crypto.randomUUID(),
            actor: 'Preview Committee Staff',
          }),
      }),
    ),
  );
  root.querySelectorAll('[data-receive-deliverable]').forEach((button) => {
    const item = ctx.state.deliverables.find((row) => row.id === button.dataset.receiveDeliverable);
    const totals = receiptTotals(ctx.state.deliverableReceipts, item.id);
    const remaining = item.quantityOrdered - totals.received;
    button.addEventListener('click', () =>
      openModal({
        title: `Receive ${item.id}`,
        body: `<form class="stack"><div class="alert"><div><strong>Cumulative receiving</strong><p>${remaining} ${item.unit} remains. Each submission becomes an immutable receipt.</p></div></div><div class="form-grid"><label>Received now<input name="quantityReceivedNow" type="number" min="0.01" max="${remaining}" step="0.01" value="${remaining}" required /></label><label>Damaged<input name="quantityDamaged" type="number" min="0" value="0" /></label><label>Rejected<input name="quantityRejected" type="number" min="0" value="0" /></label><label>Supplier<select name="supplierId">${ctx.state.suppliers.map((supplier) => `<option value="${supplier.id}">${escapeHtml(supplier.name)}</option>`).join('')}</select></label><label>Receipt status<select name="receiptStatus"><option>SALES_INVOICE</option><option>ORIGINAL_RECEIPT</option><option>PENDING</option></select></label><label>Condition<select name="condition"><option>GOOD</option><option>DAMAGED</option><option>SUBSTITUTED</option></select></label><label class="span-2">Shortage/backorder note<textarea name="shortageNote"></textarea></label><label class="span-2">Substitution note<textarea name="substitutionNote"></textarea></label></div><button class="primary" type="submit">Review receipt</button></form>`,
        onMount(body, close) {
          body.querySelector('form').addEventListener('submit', (event) => {
            event.preventDefault();
            const values = Object.fromEntries(new FormData(event.currentTarget));
            close();
            openConfirmation({
              title: `Post receipt to ${item.id}`,
              summary: `${values.quantityReceivedNow} ${item.unit} will be recorded for ${item.itemSpec}.`,
              effects: [
                'Append immutable deliverable receipt',
                'Create/retain event-specific EIT ID',
                'Append one event-item RECEIPT ledger movement',
                'Derive Partially Received or Ready to Release',
              ],
              onConfirm: async () => {
                const result = await ctx.service.receiveDeliverable({
                  ...values,
                  deliverableId: item.id,
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
  root.querySelectorAll('[data-transfer-event]').forEach((button) => {
    const item = ctx.state.deliverables.find((row) => row.id === button.dataset.transferEvent);
    button.addEventListener('click', () =>
      openModal({
        title: `Transfer ${item.eventItemId}`,
        body: `<form class="stack"><div class="alert"><div><strong>Supervisor-controlled merge</strong><p>Unit, handling, semantic match, reason, balance, and provenance are validated.</p></div></div><label>Destination<select name="destinationItemId"><option value="">Create new controlled item</option>${ctx.state.inventoryItems
          .filter((target) => target.unit === item.unit && target.handling === item.handling)
          .slice(0, 20)
          .map((target) => `<option value="${target.id}">${target.id} · ${escapeHtml(target.name)}</option>`)
          .join(
            '',
          )}</select></label><label>Quantity<input name="quantity" type="number" min="0.01" value="1" /></label><label>New item name<input name="newItemName" value="${escapeHtml(item.itemSpec)}" /></label><label>Controlled category<select name="category"><option>EVENT_MATERIALS</option><option>EQUIPMENT</option><option>OFFICE_SUPPLIES</option><option>OTHER_CONTROLLED</option></select></label><label>Area<select name="area"><option>Inventory</option><option>Pantry</option></select></label><label>Merge reason<textarea name="mergeReason" required>Legitimate event excess with retained provenance.</textarea></label><label><input name="semanticConfirmed" type="checkbox" value="true" /> I confirm the destination is semantically compatible.</label><button class="primary" type="submit">Review paired transfer</button></form>`,
        onMount(body, close) {
          body.querySelector('form').addEventListener('submit', (event) => {
            event.preventDefault();
            const values = Object.fromEntries(new FormData(event.currentTarget));
            close();
            openConfirmation({
              title: `Transfer from ${item.eventItemId}`,
              summary: `${values.quantity} ${item.unit} will move to ${values.destinationItemId || 'a new controlled catalog item'}.`,
              effects: [
                'Validate raw event-item balance',
                'Allocate two different transaction IDs',
                'Append atomic OUT and IN movements',
                'Retain shared mapping ID and provenance',
              ],
              onConfirm: async () => {
                const result = await ctx.service.transferEventItem({
                  ...values,
                  semanticConfirmed: Boolean(values.semanticConfirmed),
                  deliverableId: item.id,
                  unit: item.unit,
                  handling: item.handling,
                  idempotencyKey: crypto.randomUUID(),
                  actor: 'Preview Committee Head',
                });
                ctx.toast(`${result.outTransactionId} / ${result.inTransactionId} posted uniquely.`);
              },
            });
          });
        },
      }),
    );
  });
  root.querySelectorAll('[data-quote-details]').forEach((button) =>
    button.addEventListener('click', () => {
      const quote = ctx.state.quotes.find((row) => row.id === button.dataset.quoteDetails);
      const supplier = ctx.state.suppliers.find((row) => row.id === quote.supplierId);
      openModal({
        title: quote.id,
        body: `<div class="stack"><div class="alert"><div><strong>${escapeHtml(supplier.name)}</strong><p>${escapeHtml(supplier.branch)} · ${supplier.receiptCapability} · ${supplier.deliveryLeadDays}-day lead time</p></div></div><h3>${escapeHtml(quote.itemSpec)}</h3><p>₱${quote.price.toFixed(2)} / ${quote.unit} · checked ${quote.checkedOn} · expires ${quote.expiresOn}</p><p>${escapeHtml(quote.preferredRationale || quote.notes)}</p><div class="alert"><div><strong>Sensitive supplier fields</strong><p>TIN and production contacts are intentionally excluded from this preview payload.</p></div></div></div>`,
      });
    }),
  );
  root.querySelector('[data-bulk-import]')?.addEventListener('click', () =>
    openModal({
      title: 'Bulk-import preview',
      body: `<div class="stack"><div class="alert"><div><strong>No records will be written</strong><p>Paste CSV-like rows to preview duplicate and validation checks.</p></div></div><label>Preview rows<textarea data-import-rows placeholder="supplier,item,price,unit"></textarea></label><button class="primary" type="button" data-preview-import>Validate preview</button><div data-import-result></div></div>`,
      onMount(body) {
        body.querySelector('[data-preview-import]').addEventListener('click', () => {
          const rows = body
            .querySelector('[data-import-rows]')
            .value.split('\n')
            .filter((line) => line.trim());
          body.querySelector('[data-import-result]').innerHTML =
            `<div class="alert success"><div><strong>${rows.length} rows parsed</strong><p>Preview only. Production import requires schema validation, duplicate resolution, and authorization.</p></div></div>`;
        });
      },
    }),
  );
  root.querySelector('[data-saved-views]')?.addEventListener('click', () =>
    openModal({
      title: 'Canvass saved views',
      body: '<div class="list"><div class="list-item"><strong>Fresh Quotes</strong><span>Built in</span></div><div class="list-item"><strong>Missing Receipt Compliance</strong><span>Built in</span></div><div class="list-item"><strong>Preferred Suppliers</strong><span>Built in</span></div><div class="list-item"><strong>Stale Quotes</strong><span>Built in</span></div></div>',
    }),
  );
}
