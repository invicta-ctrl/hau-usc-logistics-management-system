import { brandLockupMarkup } from './brand-assets.js';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

const clientRequestId = () => `public-lending:${crypto.randomUUID()}`;

export async function mountPublicLendingPortal({ root, client }) {
  let catalog;
  try {
    catalog = await client.request('/api/public/lending/catalog', { method: 'GET' });
  } catch (error) {
    root.innerHTML = `<section class="auth-card"><p class="eyebrow">Lending Center</p><h1>Lending Center is unavailable</h1><p class="auth-intro">${escapeHtml(error.message)}</p><a href="/login">Staff sign in</a></section>`;
    return;
  }

  const selected = new Map();
  const categories = [...new Set(catalog.items.map((item) => item.category))].sort();
  const today = new Date().toISOString().slice(0, 10);
  root.innerHTML = `
    <main class="public-request-portal public-lending-portal" aria-labelledby="publicLendingTitle">
      <header class="public-portal-header">
        <div class="public-portal-identity">${brandLockupMarkup({ compact: true })}<div><p class="eyebrow">HAU-USC Logistics</p><h1 id="publicLendingTitle">Lending Center</h1><p>Browse the borrower-safe catalog before providing personal information. Every request starts For Review.</p></div></div>
        <nav aria-label="Logistics portal links"><a href="/request">Request Center</a><a href="/login">Staff sign in</a></nav>
      </header>
      <section class="panel public-catalog" aria-labelledby="publicCatalogTitle">
        <div class="panel-head"><div><h2 id="publicCatalogTitle">Browse Items Available for Lending</h2><p>Displayed availability is a current review signal, not a reservation or approval.</p></div><span class="pill" data-catalog-count></span></div>
        <div class="public-catalog-filters">
          <label>Search<input type="search" data-catalog-search placeholder="Search item name or category"></label>
          <label>Category<select data-catalog-category><option value="ALL">All categories</option>${categories.map((value) => `<option>${escapeHtml(value)}</option>`).join('')}</select></label>
          <label>Availability<select data-catalog-availability><option value="AVAILABLE">Available now</option><option value="ALL">All availability</option><option value="CURRENTLY_UNAVAILABLE">Currently unavailable</option></select></label>
          <label>Item type<select data-catalog-type><option value="ALL">Reusable and consumable</option><option value="REUSABLE">Reusable</option><option value="CONSUMABLE">Consumable</option></select></label>
        </div>
        <div class="public-catalog-grid" data-catalog-items></div>
      </section>
      <div class="public-request-layout public-lending-layout">
        <form id="publicLendingForm" class="panel public-request-form">
          <div class="panel-head"><div><h2>New Borrowing Request</h2><p>Select items above, then provide the borrower details needed for staff review.</p></div></div>
          <section class="public-request-lines" aria-labelledby="selectedLendingTitle">
            <div class="panel-head"><div><h3 id="selectedLendingTitle">Selected items</h3><p>No item is reserved until authorized staff approve it.</p></div><span class="pill" data-selected-count>0 items</span></div>
            <div data-selected-items><p class="empty">Choose an available catalog item.</p></div>
          </section>
          <div class="public-form-grid">
            <label>Full name<input name="borrowerName" autocomplete="name" maxlength="120" required></label>
            <label>Student ID<input name="studentId" inputmode="numeric" pattern="[0-9]{1,8}" maxlength="8" required></label>
            <label>Course and Year<input name="courseYear" maxlength="80" placeholder="e.g. BSIT 2" required></label>
            <label>Department<select name="department" required><option value="">Select department</option>${catalog.departments.map((value) => `<option>${escapeHtml(value)}</option>`).join('')}</select></label>
            <label>Contact number<input name="contactNumber" autocomplete="tel" maxlength="24" required></label>
            <label>Email address<input name="email" type="email" autocomplete="email" maxlength="254" aria-describedby="lendingEmailHelp" required><small id="lendingEmailHelp">HAU Outlook/Microsoft and Gmail addresses are accepted.</small></label>
            <label>Requested pickup date<input name="pickupDate" type="date" min="${today}" required></label>
            <label>Requested due date<input name="dueDate" type="date" min="${today}" required></label>
            <label class="span-2">Purpose<textarea name="purpose" maxlength="500" required></textarea></label>
            <label class="public-check span-2"><input name="responsibilityAcknowledged" type="checkbox" required><span><strong>Responsibility acknowledgment</strong><small>I will present the approved borrower identity, follow pickup instructions, care for reusable items, and return them by the approved due date.</small></span></label>
          </div>
          <p class="borrower-form-message" role="status" aria-live="polite"></p>
          <button class="primary" type="submit">Submit borrowing request for review</button>
        </form>
        <aside class="public-request-aside">
          <section class="panel" aria-labelledby="borrowingProcessTitle"><p class="eyebrow">How it works</p><h2 id="borrowingProcessTitle">Borrowing process</h2><ol>${catalog.process.map((step) => `<li>${escapeHtml(step)}</li>`).join('')}</ol></section>
          <section class="panel" aria-labelledby="trackLendingTitle"><p class="eyebrow">Private tracking</p><h2 id="trackLendingTitle">Track Existing Request</h2><p>Use the Lending Ticket ID and private tracking code shown after submission.</p><form id="publicLendingTrackForm" class="borrower-form"><label>Lending Ticket ID<input name="ticketId" autocomplete="off" maxlength="80" required></label><label>Private tracking code<input name="trackingCode" type="password" autocomplete="off" maxlength="128" required></label><button class="secondary" type="submit">Check status</button><p class="borrower-form-message" role="status" aria-live="polite"></p></form><div data-lending-track-result></div></section>
          <section class="panel public-privacy-note"><h2>Your privacy</h2><p>Only your private code can open this ticket group. Other borrowers, exact stock balances, storage locations, staff notes, and internal records are never shown here.</p></section>
        </aside>
      </div>
    </main>`;

  const catalogRoot = root.querySelector('[data-catalog-items]');
  const search = root.querySelector('[data-catalog-search]');
  const category = root.querySelector('[data-catalog-category]');
  const availability = root.querySelector('[data-catalog-availability]');
  const type = root.querySelector('[data-catalog-type]');
  const count = root.querySelector('[data-catalog-count]');
  const form = root.querySelector('#publicLendingForm');
  const selectedRoot = root.querySelector('[data-selected-items]');
  const selectedCount = root.querySelector('[data-selected-count]');

  const renderSelected = () => {
    selectedCount.textContent = `${selected.size} item${selected.size === 1 ? '' : 's'}`;
    selectedRoot.innerHTML = selected.size
      ? [...selected.values()]
          .map(
            (line) =>
              `<article class="public-request-line"><span><strong>${escapeHtml(line.name)}</strong><small>${escapeHtml(line.type)} · ${escapeHtml(line.unit)} · maximum ${escapeHtml(line.maximumQuantity)}</small></span><span class="public-lending-quantity"><label>Quantity<input type="number" min="1" max="${escapeHtml(line.maximumQuantity)}" step="1" value="${escapeHtml(line.quantity)}" data-lending-quantity="${escapeHtml(line.itemId)}" aria-label="Quantity for ${escapeHtml(line.name)}"></label><button class="secondary mini" type="button" data-remove-lending="${escapeHtml(line.itemId)}">Remove</button></span></article>`,
          )
          .join('')
      : '<p class="empty">Choose an available catalog item.</p>';
    selectedRoot.querySelectorAll('[data-lending-quantity]').forEach((input) =>
      input.addEventListener('change', () => {
        selected.get(input.dataset.lendingQuantity).quantity = Number(input.value);
      }),
    );
    selectedRoot.querySelectorAll('[data-remove-lending]').forEach((button) =>
      button.addEventListener('click', () => {
        selected.delete(button.dataset.removeLending);
        renderSelected();
        renderCatalog();
      }),
    );
  };

  const renderCatalog = () => {
    const query = search.value.trim().toLowerCase();
    const visible = catalog.items.filter(
      (item) =>
        (!query || `${item.name} ${item.category}`.toLowerCase().includes(query)) &&
        (category.value === 'ALL' || item.category === category.value) &&
        (availability.value === 'ALL' || item.availability === availability.value) &&
        (type.value === 'ALL' || item.type === type.value),
    );
    count.textContent = `${visible.length} item${visible.length === 1 ? '' : 's'}`;
    catalogRoot.innerHTML = visible.length
      ? visible
          .map(
            (item) =>
              `<article class="public-catalog-card"><div><span class="status ${item.availability === 'AVAILABLE' ? 'green' : 'red'}">${escapeHtml(item.availability.replaceAll('_', ' '))}</span><h3>${escapeHtml(item.name)}</h3><p>${escapeHtml(item.category)} · ${escapeHtml(item.type)}</p><small>Unit: ${escapeHtml(item.unit)} · Maximum request: ${escapeHtml(item.maximumQuantity)}${item.defaultLoanDays ? ` · Standard loan: ${escapeHtml(item.defaultLoanDays)} days` : ''}</small></div><button class="${selected.has(item.id) ? 'secondary' : 'primary'} mini" type="button" data-select-lending="${escapeHtml(item.id)}" ${item.availability !== 'AVAILABLE' ? 'disabled' : ''}>${selected.has(item.id) ? 'Selected' : 'Add item'}</button></article>`,
          )
          .join('')
      : '<p class="empty">No catalog items match these filters.</p>';
    catalogRoot.querySelectorAll('[data-select-lending]').forEach((button) =>
      button.addEventListener('click', () => {
        const item = catalog.items.find((entry) => entry.id === button.dataset.selectLending);
        if (!item || selected.has(item.id)) return;
        selected.set(item.id, {
          itemId: item.id,
          name: item.name,
          type: item.type,
          unit: item.unit,
          maximumQuantity: item.maximumQuantity,
          quantity: 1,
        });
        renderSelected();
        renderCatalog();
      }),
    );
  };

  [search, category, availability, type].forEach((control) =>
    control.addEventListener('input', renderCatalog),
  );
  renderCatalog();
  renderSelected();

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const message = form.querySelector('.borrower-form-message');
    if (!selected.size) {
      message.textContent = 'Select at least one available lending item.';
      catalogRoot.scrollIntoView({ block: 'center' });
      return;
    }
    const values = Object.fromEntries(new FormData(form));
    const submit = event.submitter ?? form.querySelector('[type="submit"]');
    submit.disabled = true;
    try {
      const result = await client.request('/api/public/lending', {
        body: {
          ...values,
          responsibilityAcknowledged: form.elements.responsibilityAcknowledged.checked,
          lines: [...selected.values()].map(({ itemId, quantity }) => ({ itemId, quantity })),
          clientRequestId: clientRequestId(),
        },
      });
      message.textContent = '';
      form.querySelectorAll('input, select, textarea, button').forEach((control) => {
        control.disabled = true;
      });
      const receipt = document.createElement('section');
      receipt.className = 'public-tracking-receipt';
      receipt.setAttribute('role', 'status');
      receipt.innerHTML = `<p class="eyebrow">Borrowing request submitted</p><h2>Save your private tracking details</h2><p><strong>Lending Ticket ID</strong><code>${escapeHtml(result.ticketId)}</code></p><p><strong>Private tracking code</strong><code>${escapeHtml(result.trackingCode)}</code></p><p>This code is shown once. Store it securely; it cannot be recovered from this browser.</p>`;
      form.after(receipt);
      receipt.scrollIntoView({ block: 'center' });
    } catch (error) {
      message.textContent = error.message;
      submit.disabled = false;
    }
  });

  const trackForm = root.querySelector('#publicLendingTrackForm');
  trackForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const message = trackForm.querySelector('.borrower-form-message');
    const resultRoot = root.querySelector('[data-lending-track-result]');
    const submit = event.submitter ?? trackForm.querySelector('[type="submit"]');
    submit.disabled = true;
    try {
      const result = await client.request('/api/public/lending/track', {
        body: Object.fromEntries(new FormData(trackForm)),
      });
      message.textContent = '';
      resultRoot.innerHTML = `<article class="public-track-result"><span class="status blue">${escapeHtml(result.request.status.replaceAll('_', ' '))}</span><h3>${escapeHtml(result.request.id)}</h3><p>Pickup requested: ${escapeHtml(result.request.pickupDate)} · Due requested: ${escapeHtml(result.request.dueDate)}</p><ul>${result.request.tickets.map((ticket) => `<li>${escapeHtml(ticket.itemName)} · ${escapeHtml(ticket.quantity)} ${escapeHtml(ticket.unit)} · ${escapeHtml(ticket.status.replaceAll('_', ' '))}</li>`).join('')}</ul><small>Last updated ${escapeHtml(new Date(result.request.updatedAt).toLocaleString('en-PH'))}</small></article>`;
    } catch (error) {
      resultRoot.innerHTML = '';
      message.textContent = error.message;
    } finally {
      submit.disabled = false;
    }
  });
}
