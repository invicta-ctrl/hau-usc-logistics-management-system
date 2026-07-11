import { statusChip, escapeHtml } from '../../components/status-chip.js';
import { openModal, openConfirmation } from '../../components/modal.js';

export function renderRelease(ctx) {
  const active = ctx.state.requestLines.filter((line) =>
    ['READY_TO_RELEASE', 'PARTIALLY_RELEASED'].includes(line.status),
  );
  return `<div class="view-grid"><section class="panel hero"><p class="eyebrow">Release Desk</p><h2>The controlled physical deduction point</h2><p>Every release rechecks request remainder, reservation or event balance, and physical balance inside one mock transaction.</p></section><section class="panel"><div class="panel-head"><div><h2>Active queue</h2><p>Event requests and approved circulation tickets.</p></div><span class="pill">${active.length} lines</span></div><div class="list">${active.map((line) => `<article class="list-item"><span><div class="button-row">${statusChip(line.status)}<code>${line.id}</code></div><strong>${escapeHtml(line.description)}</strong><small>${line.requestId} · ${line.quantity - (line.releasedQuantity ?? 0)} ${line.unit} remaining · ${escapeHtml(line.fulfillmentSource)}</small></span><button class="primary" data-release-line="${line.id}">Release quantity</button></article>`).join('') || '<div class="empty-state"><h3>No active releases</h3><p>Accepted stock and fully received event items appear here.</p></div>'}</div></section><section class="panel"><div class="panel-head"><div><h2>Release history</h2><p>Reprintable slip structure and evidence context.</p></div><span class="pill">${ctx.state.releaseRecords.length} records</span></div><div class="list">${ctx.state.releaseRecords.map((record) => `<article class="list-item"><span><strong>${record.id} · ${record.quantity} ${record.unit}</strong><small>${escapeHtml(record.recipientName)} · ${record.releasedAt}<br>Ledger ${record.transactionId}</small></span><button class="secondary" data-print-release="${record.id}">Print slip preview</button></article>`).join('') || '<div class="empty-state"><h3>No release history yet</h3><p>Guided scenarios can create immutable preview release records.</p></div>'}</div></section></div>`;
}

export function mountRelease(ctx, root) {
  root.querySelectorAll('[data-release-line]').forEach((button) => {
    const line = ctx.state.requestLines.find((row) => row.id === button.dataset.releaseLine);
    button.addEventListener('click', () =>
      openModal({
        title: `Release ${line.id}`,
        body: `<form id="release-form" class="stack"><div class="alert"><div><strong>Transaction preview</strong><p>Up to ${line.quantity - (line.releasedQuantity ?? 0)} ${line.unit}; one ISSUE movement plus reservation, line, parent, release, and audit updates.</p></div></div><div class="form-grid"><label>Quantity<input name="quantity" type="number" min="0.01" max="${line.quantity - (line.releasedQuantity ?? 0)}" step="0.01" value="${line.quantity - (line.releasedQuantity ?? 0)}" required /></label><label>Condition<select name="condition"><option>GOOD</option><option>AS_IS</option></select></label><label>Recipient name<input name="recipientName" value="Preview Recipient" required /></label><label>Recipient role<input name="recipientRole" value="Event Representative" /></label><label>Department<input name="department" value="USC" /></label><label>Received by<input name="receivedBy" value="Preview Recipient" /></label><label class="span-2">Identity verification note<input name="identityVerificationNote" value="Preview ID check recorded" /></label><label class="span-2">Partial-release reason<textarea name="partialReason"></textarea></label><label class="span-2">Remarks<textarea name="remarks">Preview controlled handoff</textarea></label></div><button class="primary" type="submit">Review confirmation</button></form>`,
        onMount(body, close) {
          body.querySelector('form').addEventListener('submit', (event) => {
            event.preventDefault();
            const values = Object.fromEntries(new FormData(event.currentTarget));
            close();
            openConfirmation({
              title: `Confirm release ${line.id}`,
              summary: `${values.quantity} ${line.unit} will be physically deducted and assigned to ${values.recipientName}.`,
              effects: [
                'Validate remaining request quantity',
                'Validate exact active reservation/event balance',
                'Append one ISSUE ledger movement',
                'Reduce reservation and derive parent status',
                'Create reprintable release record and audit entry',
              ],
              confirmLabel: 'Post controlled release',
              onConfirm: async () => {
                const result = await ctx.service.confirmRelease({
                  ...values,
                  requestLineId: line.id,
                  idempotencyKey: crypto.randomUUID(),
                  actor: 'Preview Release Staff',
                });
                ctx.toast(`${result.releaseId} posted with ${result.transactionId}.`);
              },
            });
          });
        },
      }),
    );
  });
  root.querySelectorAll('[data-print-release]').forEach((button) =>
    button.addEventListener('click', () => {
      const record = ctx.state.releaseRecords.find((row) => row.id === button.dataset.printRelease);
      openModal({
        title: `Release slip ${record.id}`,
        body: `<article class="panel"><p class="eyebrow">HAU-USC Department of Logistics</p><h2>Release Acknowledgment</h2><dl><dt>Recipient</dt><dd>${escapeHtml(record.recipientName)}</dd><dt>Quantity</dt><dd>${record.quantity} ${record.unit}</dd><dt>Ledger transaction</dt><dd>${record.transactionId}</dd><dt>Released at</dt><dd>${record.releasedAt}</dd></dl><p class="muted">Printable browser preview only; no production PDF service is connected.</p></article><button class="primary section-gap" onclick="window.print()">Print browser view</button>`,
      });
    }),
  );
}
