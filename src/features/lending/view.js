import { statusChip, escapeHtml } from '../../components/status-chip.js';
import { derivedLendingStatus } from '../../domain/lending.js';
import { openConfirmation, openDrawer, openModal } from '../../components/modal.js';

export function renderLending(ctx) {
  const { state } = ctx;
  return `<div class="view-grid"><section class="panel hero"><p class="eyebrow">Office Lending Hub</p><h2>Institution-only circulation preview</h2><p>Borrower identity, reservation, physical handoff, condition, and return are separate traceable steps. Authentication is simulated and not secure.</p></section><section class="panel"><div class="panel-head"><div><h2>Borrowing and consumable tickets</h2><p>Aging, overdue status, and borrower history remain visible.</p></div><div class="button-row"><button class="primary" data-new-lending-ticket>New ticket</button><button class="secondary" data-emergency-issue>Emergency issue / Paper Strike</button><span class="pill">${state.lendingTickets.length} tickets</span></div></div><div class="list">${state.lendingTickets
    .map((ticket) => {
      const item = state.inventoryItems.find((row) => row.id === ticket.itemId);
      const display = derivedLendingStatus(ticket, state.demoToday);
      return `<article class="list-item"><span><div class="button-row">${statusChip(display)}<code>${ticket.id}</code></div><strong>${escapeHtml(item?.name)} · ${ticket.quantity} ${item?.unit}</strong><small>${escapeHtml(ticket.borrowerName)} · ${escapeHtml(ticket.studentId)} · due ${ticket.dueDate || 'not applicable'}<br>ID verified: ${ticket.physicalIdVerified ? 'Yes' : 'No'} · condition out: ${ticket.conditionOut || 'pending'}</small></span><div class="button-row">${ticket.status === 'FOR_REVIEW' ? `<button class="secondary" data-lending-approve="${ticket.id}">Approve</button>` : ''}${ticket.status === 'READY_TO_CLAIM' ? `<button class="primary" data-lending-handoff="${ticket.id}">Confirm handoff</button>` : ''}${['ON_LOAN'].includes(ticket.status) ? `<button class="primary" data-lending-return="${ticket.id}">Record return</button>` : ''}<button class="ghost" data-borrower-history="${ticket.id}">Borrower history</button></div></article>`;
    })
    .join('')}</div></section></div>`;
}

export function mountLending(ctx, root) {
  root.querySelector('[data-new-lending-ticket]')?.addEventListener('click', () =>
    openModal({
      title: 'New lending / consumable ticket',
      body: `<form class="stack"><div class="alert"><div><strong>Institution-only preview</strong><p>Submission creates For Review and never deducts stock.</p></div></div><div class="form-grid"><label>Exact inventory item<select name="itemId">${ctx.state.inventoryItems
        .filter((item) => item.status === 'ACTIVE')
        .slice(0, 30)
        .map(
          (item) =>
            `<option value="${item.id}">${item.id} · ${escapeHtml(item.name)} · ${item.handling}</option>`,
        )
        .join(
          '',
        )}</select></label><label>Quantity<input name="quantity" type="number" min="1" value="1" required /></label><label>Student ID number<input name="studentId" value="2026-PREVIEW" required /></label><label>Borrower name<input name="borrowerName" value="Preview Borrower" required /></label><label>Borrower group<input name="borrowerGroup" value="Angelite" required /></label><label>Department<input name="department" value="School of Engineering" required /></label><label>Contact<input name="contact" value="Preview contact" required /></label><label>Due date<input name="dueDate" type="date" value="2026-07-20" /></label><label class="span-2">Purpose<textarea name="purpose" required>Preview borrowing workflow</textarea></label><label class="span-2"><input name="physicalIdVerified" type="checkbox" value="true" checked /> Physical institutional ID verified in preview</label></div><button class="primary" type="submit">Create For Review ticket</button></form>`,
      onMount(body, close) {
        body.querySelector('form').addEventListener('submit', async (event) => {
          event.preventDefault();
          const values = Object.fromEntries(new FormData(event.currentTarget));
          try {
            const result = await ctx.service.createLendingTicket({
              ...values,
              physicalIdVerified: Boolean(values.physicalIdVerified),
              idempotencyKey: crypto.randomUUID(),
              actor: 'Preview Requester',
            });
            close();
            ctx.toast(result.summary);
          } catch (error) {
            ctx.toast(`${error.message} Incident ${error.correlationId}`, true);
          }
        });
      },
    }),
  );
  root.querySelectorAll('[data-lending-approve]').forEach((button) =>
    button.addEventListener('click', () =>
      openConfirmation({
        title: `Approve ${button.dataset.lendingApprove}`,
        summary: 'Approval validates current availability and creates one active reservation.',
        effects: [
          'Status: For Review → Ready to Claim',
          'One reservation; no ledger deduction',
          'Duplicate retry returns original result',
        ],
        onConfirm: async () =>
          ctx.service.approveLendingTicket({
            ticketId: button.dataset.lendingApprove,
            idempotencyKey: crypto.randomUUID(),
            actor: 'Preview DOL Staff',
          }),
      }),
    ),
  );
  root.querySelectorAll('[data-lending-handoff]').forEach((button) =>
    button.addEventListener('click', () =>
      openConfirmation({
        title: `Handoff ${button.dataset.lendingHandoff}`,
        summary: 'The exact reservation and physical balance are rechecked in one transaction.',
        effects: [
          'One LOAN_OUT or ISSUE movement',
          'Reservation consumed exactly',
          'Condition and identity verification recorded',
        ],
        onConfirm: async () =>
          ctx.service.confirmLendingHandoff({
            ticketId: button.dataset.lendingHandoff,
            conditionOut: 'GOOD',
            identityVerificationNote: 'Physical ID viewed in preview',
            idempotencyKey: crypto.randomUUID(),
            actor: 'Preview Release Staff',
          }),
      }),
    ),
  );
  root.querySelectorAll('[data-lending-return]').forEach((button) =>
    button.addEventListener('click', () =>
      openModal({
        title: `Return ${button.dataset.lendingReturn}`,
        body: `<form id="return-form" class="stack"><label>Returned quantity<input name="returnedQuantity" type="number" min="0.01" step="0.01" value="1" required /></label><div class="grid-2"><label>Lost quantity<input name="lostQuantity" type="number" min="0" value="0" /></label><label>Damaged beyond use<input name="damagedBeyondUse" type="number" min="0" value="0" /></label></div><label>Condition on return<select name="conditionReturn"><option>GOOD</option><option>DAMAGED</option><option>MISSING_PARTS</option></select></label><label>Missing parts / damage notes<textarea name="missingParts"></textarea></label><button class="primary" type="submit">Post one return</button></form>`,
        onMount(body, close) {
          body.querySelector('form').addEventListener('submit', async (event) => {
            event.preventDefault();
            const values = Object.fromEntries(new FormData(event.currentTarget));
            try {
              await ctx.service.confirmLendingReturn({
                ...values,
                ticketId: button.dataset.lendingReturn,
                idempotencyKey: crypto.randomUUID(),
                actor: 'Preview Receiving Staff',
              });
              close();
              ctx.toast('Return posted once. Lost/damaged quantity was not falsely restored.');
            } catch (error) {
              ctx.toast(error.message, true);
            }
          });
        },
      }),
    ),
  );
  root.querySelectorAll('[data-borrower-history]').forEach((button) =>
    button.addEventListener('click', () => {
      const ticket = ctx.state.lendingTickets.find((row) => row.id === button.dataset.borrowerHistory);
      const history = ctx.state.lendingTickets.filter(
        (row) => row.studentId === ticket.studentId || row.borrowerName === ticket.borrowerName,
      );
      openDrawer({
        title: `Borrower history · ${escapeHtml(ticket.borrowerName)}`,
        body: `<div class="alert"><div><strong>Restricted production data</strong><p>This fictional preview history must be protected by institutional identity and server authorization.</p></div></div><div class="list section-gap">${history
          .map(
            (row) =>
              `<div class="list-item"><span><strong>${row.id}</strong><small>${row.itemId} · ${row.quantity} · due ${row.dueDate || 'n/a'}</small></span>${statusChip(derivedLendingStatus(row, ctx.state.demoToday))}</div>`,
          )
          .join('')}</div>`,
      });
    }),
  );
  root.querySelector('[data-emergency-issue]')?.addEventListener('click', () =>
    openModal({
      title: 'Emergency issue / Paper Strike',
      body: `<form id="emergency-form" class="stack"><div class="alert"><div><strong>Internal preview only</strong><p>Immediate issue requires an approver and reconciliation deadline.</p></div></div><label>Requester classification<select name="classification"><option>USC staff</option><option>Non-USC</option></select></label><label>Item<select name="itemId">${ctx.state.inventoryItems
        .slice(0, 10)
        .map((item) => `<option value="${item.id}">${escapeHtml(item.name)}</option>`)
        .join(
          '',
        )}</select></label><label>Quantity<input name="quantity" type="number" min="1" value="1" /></label><label>Reason<textarea name="reason" required></textarea></label><label>Approver<input name="approver" required /></label><label>Reconciliation deadline<input name="deadline" type="date" value="2026-07-12" /></label><button class="danger" type="submit">Post emergency issue</button></form>`,
      onMount(body, close) {
        body.querySelector('form').addEventListener('submit', async (event) => {
          event.preventDefault();
          const values = Object.fromEntries(new FormData(event.currentTarget));
          await ctx.service.postEmergencyIssue({
            ...values,
            reconciliationId: `EMG-${Date.now()}`,
            idempotencyKey: crypto.randomUUID(),
            actor: 'Preview DOL Staff',
          });
          close();
          ctx.toast('Emergency issue posted with reconciliation requirement.');
        });
      },
    }),
  );
}
