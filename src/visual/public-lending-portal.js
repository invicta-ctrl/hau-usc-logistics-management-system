import { brandLockupMarkup } from './brand-assets.js';
import { mountPublicAdvertisementCarousel } from './public-advertisement-carousel.js';
import {
  bindPublicPolicyDialogs,
  publicPolicyDialogsMarkup,
  publicPolicyLinksMarkup,
} from './public-policy.js';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

const clientRequestId = () => `public-lending:${crypto.randomUUID()}`;
const requestable = (item) => ['AVAILABLE', 'LIMITED', 'ELIGIBILITY_REQUIRED'].includes(item.availability);
const searchableText = (item) =>
  [item.name, item.productId, item.category, ...(item.aliases ?? [])].join(' ').trim().toLowerCase();

export async function mountPublicLendingPortal({ root, client }) {
  root.innerHTML =
    '<section class="auth-card" role="status"><p class="eyebrow">Lending Center</p><h1>Loading the governed catalog…</h1><p class="auth-intro">Checking current borrower-safe availability.</p></section>';
  let catalog;
  let advertisements = [];
  try {
    [catalog, advertisements] = await Promise.all([
      client.request('/api/public/lending/catalog', { method: 'GET' }),
      client
        .request('/api/public/advertisements', { method: 'GET' })
        .then((result) => result.items ?? [])
        .catch(() => []),
    ]);
  } catch (error) {
    root.innerHTML = `<section class="auth-card" role="alert"><p class="eyebrow">Lending Center</p><h1>Catalog service unavailable</h1><p class="auth-intro">The borrower-safe catalog could not be loaded. This is a service error, not an empty catalog.</p><p>${escapeHtml(error.message)}</p><button class="secondary" type="button" data-retry-catalog>Try again</button><a href="/login">Staff sign in</a></section>`;
    root
      .querySelector('[data-retry-catalog]')
      ?.addEventListener('click', () => mountPublicLendingPortal({ root, client }));
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
          <label>Search<input type="search" data-catalog-search autocomplete="off" aria-autocomplete="list" aria-controls="publicCatalogSuggestions" aria-expanded="false" placeholder="Search name, Product ID, alias, or category"><div id="publicCatalogSuggestions" class="public-catalog-suggestions" role="listbox" hidden></div></label>
          <label>Category<select data-catalog-category><option value="ALL">All categories</option>${categories.map((value) => `<option>${escapeHtml(value)}</option>`).join('')}</select></label>
          <label>Availability<select data-catalog-availability><option value="ALL">All availability</option><option value="REQUESTABLE">Requestable now</option>${[
            ...new Set(catalog.items.map((item) => item.availability)),
          ]
            .sort()
            .map(
              (value) =>
                `<option value="${escapeHtml(value)}">${escapeHtml(value.replaceAll('_', ' '))}</option>`,
            )
            .join('')}</select></label>
          <label>Item type<select data-catalog-type><option value="ALL">Reusable and consumable</option><option value="REUSABLE">Reusable</option><option value="CONSUMABLE">Consumable</option></select></label>
        </div>
        <div class="public-catalog-grid" data-catalog-items></div>
      </section>
      <div class="public-request-layout public-lending-layout">
        <form id="publicLendingForm" class="panel public-request-form">
          <div class="panel-head"><div><h2>New Borrowing Request</h2><p>Select items above, then choose the borrower classification before entering details.</p></div></div>
          <section class="public-request-lines" aria-labelledby="selectedLendingTitle">
            <div class="panel-head"><div><h3 id="selectedLendingTitle">Selected items</h3><p>No item is reserved until authorized staff approve it.</p></div><span class="pill" data-selected-count>0 items</span></div>
            <div data-selected-items><p class="empty">Choose an available catalog item.</p></div>
          </section>
          <fieldset class="public-borrower-type">
            <legend>Who is borrowing?</legend>
            <div class="public-selection-cards">
              <label><input type="radio" name="borrowerType" value="USC_STAFF" required><span><strong>USC Staff/Officer</strong><small>Department or office borrower</small></span></label>
              <label><input type="radio" name="borrowerType" value="ANGELITE" required><span><strong>Angelite Student</strong><small>Academic borrower</small></span></label>
            </div>
          </fieldset>
          <section data-borrower-details hidden>
            <div class="public-form-grid">
              <label>Full name<input name="borrowerName" autocomplete="name" maxlength="120" required></label>
              <label>Student ID<input name="studentId" inputmode="numeric" pattern="[0-9]{1,8}" maxlength="8" required></label>
              <div class="public-form-grid span-2" data-staff-fields hidden>
                <label>USC department<select name="uscDepartment"><option value="">Select department or office</option>${catalog.uscDepartments.map((value) => `<option>${escapeHtml(value)}</option>`).join('')}</select></label>
                <label>Position or role<input name="positionRole" maxlength="120"></label>
              </div>
              <div class="public-form-grid span-2" data-angelite-fields hidden>
                <label>Course and year<input name="courseYear" maxlength="80" placeholder="e.g. BSIT 2"></label>
                <label>College, school, or academic department<input name="academicDepartment" maxlength="120"></label>
              </div>
              <label>Contact number<input name="contactNumber" autocomplete="tel" maxlength="24" required></label>
              <label>Email address<input name="email" type="email" autocomplete="email" maxlength="254" required></label>
              <label>Requested pickup date<input name="pickupDate" type="date" min="${today}" required></label>
              <label>Requested due date<input name="dueDate" type="date" min="${today}" data-lending-due><small data-lending-due-help>Required when a selected reusable item has a governed due-date rule.</small></label>
              <label class="span-2">Purpose<textarea name="purpose" maxlength="500" required></textarea></label>
              <label class="public-check span-2"><input name="responsibilityAcknowledged" type="checkbox" data-lending-acknowledgment><span><strong>Responsibility acknowledgment</strong><small data-lending-acknowledgment-help>Required when a selected item has a governed acknowledgment rule.</small></span></label>
              <label class="public-check span-2"><input name="dataUseAcknowledged" type="checkbox" required><span><strong>Privacy acknowledgment</strong><small>I read the Privacy Notice and understand the data use, private review, governed retention, correction, and support paths.</small></span></label>
              <label class="public-check span-2"><input name="acceptableUseAcknowledged" type="checkbox" required><span><strong>Acceptable Use acknowledgment</strong><small>I will provide accurate authorized information and will not put secrets, unrelated sensitive data, or another person's information in this request.</small></span></label>
              <label class="public-check span-2"><input name="borrowerResponsibilityAcknowledged" type="checkbox" required><span><strong>Borrower responsibility</strong><small>I understand this starts For Review and I must follow eligibility, pickup, care, condition, return, due-date, and correction instructions from authorized logistics staff.</small></span></label>
              <label class="public-check span-2"><input name="evidenceConsentAcknowledged" type="checkbox" required><span><strong>Evidence and photo acknowledgment</strong><small>If evidence is later requested through a protected workflow, I will share only relevant content I am authorized to provide and have consent for.</small></span></label>
            </div>
          </section>
          <p class="borrower-form-message" role="status" aria-live="polite"></p>
          <button class="primary" type="submit">Submit borrowing request for review</button>
        </form>
        <aside class="public-request-aside">
          <section class="panel" aria-labelledby="borrowingProcessTitle"><p class="eyebrow">How it works</p><h2 id="borrowingProcessTitle">Borrowing process</h2><ol>${catalog.process.map((step) => `<li>${escapeHtml(step)}</li>`).join('')}</ol></section>
          <div data-public-announcements></div>
        </aside>
      </div>
      ${publicPolicyLinksMarkup()}
      ${publicPolicyDialogsMarkup()}
    </main>`;

  bindPublicPolicyDialogs(root);

  mountPublicAdvertisementCarousel({
    root: root.querySelector('[data-public-announcements]'),
    advertisements,
  });

  const catalogRoot = root.querySelector('[data-catalog-items]');
  const search = root.querySelector('[data-catalog-search]');
  const suggestions = root.querySelector('[data-catalog-search] + [role="listbox"]');
  const category = root.querySelector('[data-catalog-category]');
  const availability = root.querySelector('[data-catalog-availability]');
  const type = root.querySelector('[data-catalog-type]');
  const count = root.querySelector('[data-catalog-count]');
  const form = root.querySelector('#publicLendingForm');
  const selectedRoot = root.querySelector('[data-selected-items]');
  const selectedCount = root.querySelector('[data-selected-count]');
  const dueDate = root.querySelector('[data-lending-due]');
  const dueHelp = root.querySelector('[data-lending-due-help]');
  const acknowledgment = root.querySelector('[data-lending-acknowledgment]');
  const acknowledgmentHelp = root.querySelector('[data-lending-acknowledgment-help]');
  const borrowerDetails = root.querySelector('[data-borrower-details]');
  const staffFields = root.querySelector('[data-staff-fields]');
  const angeliteFields = root.querySelector('[data-angelite-fields]');

  const syncBorrowerType = (value) => {
    borrowerDetails.hidden = !value;
    const staff = value === 'USC_STAFF';
    staffFields.hidden = !staff;
    angeliteFields.hidden = staff || !value;
    for (const control of staffFields.querySelectorAll('input, select')) {
      control.disabled = !staff;
      control.required = staff && control.name === 'uscDepartment';
      if (!staff) control.value = '';
    }
    for (const control of angeliteFields.querySelectorAll('input, select')) {
      control.disabled = staff || !value;
      control.required = !staff && Boolean(value);
      if (staff) control.value = '';
    }
  };
  form
    .querySelectorAll('[name="borrowerType"]')
    .forEach((control) => control.addEventListener('change', () => syncBorrowerType(control.value)));
  syncBorrowerType('');

  const renderSelected = () => {
    const requiresDueDate = [...selected.values()].some((line) => line.dueDateRequired);
    const requiresAcknowledgment = [...selected.values()].some((line) => line.acknowledgmentRequired);
    dueDate.required = requiresDueDate;
    acknowledgment.required = requiresAcknowledgment;
    dueHelp.textContent = requiresDueDate
      ? 'Required for the selected reusable item.'
      : 'Optional for the current selection.';
    acknowledgmentHelp.textContent = requiresAcknowledgment
      ? 'Required for the current selection.'
      : 'Optional for the current selection.';
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

  const renderSuggestions = (visible) => {
    const query = search.value.trim().toLowerCase();
    const matches = query.length >= 2 ? visible.slice(0, 8) : [];
    suggestions.hidden = matches.length === 0;
    search.setAttribute('aria-expanded', matches.length ? 'true' : 'false');
    suggestions.innerHTML = matches
      .map(
        (item) =>
          `<button type="button" role="option" data-catalog-suggestion="${escapeHtml(item.id)}"><strong>${escapeHtml(item.name)}</strong><small>${escapeHtml(item.productId)} · ${escapeHtml(item.category)}</small></button>`,
      )
      .join('');
  };

  function renderCatalog() {
    const query = search.value.trim().toLowerCase();
    const visible = catalog.items.filter(
      (item) =>
        (!query || searchableText(item).includes(query)) &&
        (category.value === 'ALL' || item.category === category.value) &&
        (availability.value === 'ALL' ||
          item.availability === availability.value ||
          (availability.value === 'REQUESTABLE' && requestable(item))) &&
        (type.value === 'ALL' || item.type === type.value),
    );
    count.textContent = `${visible.length} item${visible.length === 1 ? '' : 's'}`;
    if (!catalog.items.length) {
      catalogRoot.innerHTML =
        '<div class="empty"><strong>No approved lending items are published.</strong><br>The governed catalog loaded successfully, but no active item is currently approved for public lending.</div>';
    } else {
      catalogRoot.innerHTML = visible.length
        ? visible
            .map(
              (item) =>
                `<article class="public-catalog-card"><div class="public-catalog-image"><img src="${escapeHtml(item.imageUrl || '/brand/default-item-image')}" alt="" loading="lazy" decoding="async"></div><div><span class="status ${requestable(item) ? 'green' : 'red'}">${escapeHtml(item.availability.replaceAll('_', ' '))}</span><p class="eyebrow">Product ID ${escapeHtml(item.productId)}</p><h3>${escapeHtml(item.name)}</h3><p>${escapeHtml(item.category)} · ${escapeHtml(item.type)}</p>${item.description ? `<p>${escapeHtml(item.description)}</p>` : ''}<small>Unit: ${escapeHtml(item.unit)} · Maximum request: ${escapeHtml(item.maximumQuantity)}${item.defaultLoanDays ? ` · Normal loan: ${escapeHtml(item.defaultLoanDays)} days` : ''}</small>${item.eligibility ? `<small><strong>Eligibility:</strong> ${escapeHtml(item.eligibility)}</small>` : ''}${item.restrictions ? `<small><strong>Restrictions:</strong> ${escapeHtml(item.restrictions)}</small>` : ''}${item.handlingNotes ? `<small><strong>Handling:</strong> ${escapeHtml(item.handlingNotes)}</small>` : ''}</div><button class="${selected.has(item.id) ? 'secondary' : 'primary'} mini" type="button" data-select-lending="${escapeHtml(item.id)}" ${!requestable(item) ? 'disabled' : ''}>${selected.has(item.id) ? 'Selected' : 'Request item'}</button></article>`,
            )
            .join('')
        : '<p class="empty">No catalog items match the current search and filters.</p>';
    }
    renderSuggestions(visible);
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
          dueDateRequired: item.dueDateRequired,
          acknowledgmentRequired: item.acknowledgmentRequired,
          quantity: 1,
        });
        renderSelected();
        renderCatalog();
      }),
    );
  }

  suggestions.addEventListener('click', (event) => {
    const button = event.target.closest('[data-catalog-suggestion]');
    if (!button) return;
    const item = catalog.items.find((entry) => entry.id === button.dataset.catalogSuggestion);
    if (!item) return;
    search.value = item.name;
    suggestions.hidden = true;
    search.setAttribute('aria-expanded', 'false');
    renderCatalog();
  });
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
    if (!form.reportValidity()) return;
    const values = Object.fromEntries(new FormData(form));
    const submit = event.submitter ?? form.querySelector('[type="submit"]');
    submit.disabled = true;
    try {
      const result = await client.request('/api/public/lending', {
        body: {
          ...values,
          responsibilityAcknowledged: form.elements.responsibilityAcknowledged.checked,
          dataUseAcknowledged: form.elements.dataUseAcknowledged.checked,
          acceptableUseAcknowledged: form.elements.acceptableUseAcknowledged.checked,
          borrowerResponsibilityAcknowledged:
            form.elements.borrowerResponsibilityAcknowledged.checked,
          evidenceConsentAcknowledged: form.elements.evidenceConsentAcknowledged.checked,
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
      receipt.innerHTML = `<p class="eyebrow">Borrowing request submitted</p><h2>Submitted successfully</h2><p><strong>Submission ID</strong><code>${escapeHtml(result.submissionId)}</code></p><p><strong>Initial status</strong> For Review</p><p>Submission does not guarantee approval or allocation. Authorized staff will complete eligibility and availability review.</p>`;
      form.after(receipt);
      receipt.scrollIntoView({ block: 'center' });
    } catch (error) {
      message.textContent = error.message;
      submit.disabled = false;
    }
  });
}
