import { brandLockupMarkup } from './brand-assets.js';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

const dateLabel = (value) => {
  if (!value) return 'Not applicable';
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? 'Not available'
    : date.toLocaleDateString('en-PH', { dateStyle: 'medium' });
};

const requestKey = (scope) => `${scope}:${crypto.randomUUID()}`;

export async function mountBorrowerLendingPortal({ root, client, session, onLogout }) {
  const logout = async () => {
    await onLogout();
  };
  const load = () => client.request('/api/portal/lending', { method: 'GET' });
  const renderDenied = () => {
    root.innerHTML = `
      <section class="auth-card" aria-labelledby="borrowerTitle">
        <p class="eyebrow">Office Lending</p>
        <h1 id="borrowerTitle">Borrower access is not enabled</h1>
        <p class="auth-intro">Your account cannot use the borrower portal. Contact the Logistics administrator if you believe this is an error.</p>
        <button class="primary" type="button" data-borrower-logout>Sign out</button>
      </section>`;
    root.querySelector('[data-borrower-logout]').addEventListener('click', logout);
  };
  if (session?.user?.authorization?.roleId !== 'REQUESTER' || session?.user?.lendingEligible !== true) {
    renderDenied();
    return;
  }

  const render = async () => {
    let portal;
    try {
      portal = await load();
    } catch (error) {
      root.innerHTML = `<section class="auth-card"><h1>Office Lending is unavailable</h1><p class="auth-intro">${escapeHtml(error.message)}</p><button class="primary" type="button" data-borrower-logout>Sign out</button></section>`;
      root.querySelector('[data-borrower-logout]').addEventListener('click', logout);
      return;
    }
    const itemOptions = portal.items
      .map(
        (item) =>
          `<option value="${escapeHtml(item.id)}" data-unit="${escapeHtml(item.unit)}">${escapeHtml(item.name)} · ${escapeHtml(item.category)}</option>`,
      )
      .join('');
    const tickets =
      portal.tickets
        .map(
          (ticket) => `<article class="borrower-ticket" data-ticket="${escapeHtml(ticket.id)}">
          <div><span class="status ${ticket.status === 'OVERDUE' ? 'red' : 'blue'}">${escapeHtml(ticket.status.replaceAll('_', ' '))}</span><strong>${escapeHtml(ticket.itemName)}</strong><small>${escapeHtml(ticket.quantity)} ${escapeHtml(ticket.unit)} · ${escapeHtml(ticket.type)}</small></div>
          <div><small>Due: ${escapeHtml(dateLabel(ticket.dueAt))}</small>${['FOR_REVIEW', 'READY_TO_CLAIM'].includes(ticket.status) ? `<button class="secondary mini" type="button" data-cancel-ticket="${escapeHtml(ticket.id)}">Cancel request</button>` : ''}</div>
        </article>`,
        )
        .join('') || '<p class="empty">No borrowing or consumable requests yet.</p>';
    root.innerHTML = `
      <main class="borrower-portal" aria-labelledby="borrowerPortalTitle">
        <header class="borrower-portal-header">
          <div class="public-portal-identity">${brandLockupMarkup({ compact: true })}<div><p class="eyebrow">HAU-USC Logistics</p><h1 id="borrowerPortalTitle">Office Lending</h1><p>Institution-approved borrower portal</p></div></div>
          <div class="borrower-profile"><strong>${escapeHtml(portal.profile.displayName)}</strong><small>Institution ID verified</small><button class="secondary" type="button" data-borrower-logout>Sign out</button></div>
        </header>
        <section class="borrower-grid">
          <form id="borrowerLendingForm" class="panel borrower-form">
            <div class="panel-head"><div><h2>New borrowing or consumable request</h2><p>Availability is confirmed during staff review. Your request does not reserve stock.</p></div></div>
            <label>Find approved item<input name="itemSearch" type="search" autocomplete="off" placeholder="Search lending catalog"></label>
            <label>Item<select name="itemId" required><option value="">Select an approved item</option>${itemOptions}</select></label>
            <label>Request type<select name="ticketType"><option value="LOAN">Loan</option><option value="CONSUMABLE">Consumable request</option></select></label>
            <label>Quantity<input name="quantity" type="number" min="1" step="1" value="1" required></label>
            <label>Department / organization<input name="department" maxlength="120" required></label>
            <label>Purpose<textarea name="purpose" maxlength="500" required></textarea></label>
            <label data-due-date>Requested due date<input name="dueAt" type="date" required></label>
            <p class="borrower-form-message" role="status" aria-live="polite"></p>
            <button class="primary" type="submit">Submit for review</button>
          </form>
          <section class="panel borrower-ticket-panel" aria-labelledby="borrowerTicketsTitle">
            <div class="panel-head"><div><h2 id="borrowerTicketsTitle">My lending requests</h2><p>Ready to Claim requests include collection instructions after staff approval. On Loan and overdue entries retain their due date. Returned and completed entries remain in your history.</p></div></div>
            <div class="borrower-ticket-list">${tickets}</div>
          </section>
        </section>
      </main>`;
    root.querySelector('[data-borrower-logout]').addEventListener('click', logout);
    const form = root.querySelector('#borrowerLendingForm');
    const itemSearch = form.elements.itemSearch;
    const itemSelect = form.elements.itemId;
    itemSearch.addEventListener('input', () => {
      const query = itemSearch.value.trim().toLowerCase();
      [...itemSelect.options].forEach((option, index) => {
        if (index === 0) return;
        option.hidden = Boolean(query) && !option.textContent.toLowerCase().includes(query);
      });
      if (itemSelect.selectedOptions[0]?.hidden) itemSelect.value = '';
    });
    const type = form.elements.ticketType;
    const due = form.querySelector('[data-due-date]');
    const syncType = () => {
      const loan = type.value === 'LOAN';
      due.hidden = !loan;
      due.querySelector('input').required = loan;
    };
    type.addEventListener('change', syncType);
    syncType();
    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const message = form.querySelector('.borrower-form-message');
      const values = new FormData(form);
      const submit = form.querySelector('button[type="submit"]');
      submit.disabled = true;
      try {
        const result = await client.request('/api/portal/lending', {
          body: { ...Object.fromEntries(values), clientRequestId: requestKey('borrower-lending') },
          csrfToken: session.csrfToken,
        });
        message.textContent = `Request ${result.ticketId} is now For Review.`;
        await render();
      } catch (error) {
        message.textContent = error.message;
      } finally {
        submit.disabled = false;
      }
    });
    root.querySelectorAll('[data-cancel-ticket]').forEach((button) => {
      button.addEventListener('click', async () => {
        button.disabled = true;
        try {
          await client.request('/api/portal/lending/cancel', {
            body: { ticketId: button.dataset.cancelTicket, clientRequestId: requestKey('borrower-cancel') },
            csrfToken: session.csrfToken,
          });
          await render();
        } finally {
          button.disabled = false;
        }
      });
    });
  };
  await render();
}
