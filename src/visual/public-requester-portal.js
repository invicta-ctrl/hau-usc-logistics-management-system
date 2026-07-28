import { brandLockupMarkup } from './brand-assets.js';
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

const clientRequestId = () => `public-request:${crypto.randomUUID()}`;
const REQUEST_TYPE_LABELS = Object.freeze({
  EVENT_LOGISTICS: 'Event Logistics Request',
  CATALOG_RESTOCK: 'Catalog / Office Restock Request',
});
const STEP_LABELS = Object.freeze([
  'Request Type',
  'Requester',
  'Event & Schedule',
  'Requirements',
  'Review & Submit',
]);

function lineLabel(line) {
  return `${line.description} · ${line.quantity} ${line.unit}`;
}

function optionMarkup(rows, value, label) {
  return rows
    .map((row) => `<option value="${escapeHtml(value(row))}">${escapeHtml(label(row))}</option>`)
    .join('');
}

export async function mountPublicRequesterPortal({ root, client }) {
  let options;
  try {
    options = await client.request('/api/public/request/options', { method: 'GET' });
  } catch (error) {
    root.innerHTML = `<section class="auth-card"><p class="eyebrow">Request Center</p><h1>Request Center is unavailable</h1><p class="auth-intro">${escapeHtml(error.message)}</p><a href="/login">Staff sign in</a></section>`;
    return;
  }

  const eventSeries = options.eventSeries ?? [];
  const requesterTypes = options.requesterTypes ?? [
    'HAU student / Angelite',
    'HAU office / department',
    'USC officer / committee',
    'External partner',
  ];
  const stockAreas = options.stockAreas ?? [];
  const lines = [];
  let activeStep = 1;

  root.innerHTML = `
    <main class="public-request-portal" aria-labelledby="publicRequestTitle">
      <header class="public-portal-header">
        <div class="public-portal-identity">${brandLockupMarkup({ compact: true })}<div><p class="eyebrow">HAU-USC Logistics</p><h1 id="publicRequestTitle">Request Center</h1><p>Create and privately track a logistics request without a staff account.</p></div></div>
        <nav aria-label="Logistics portal links"><a href="/lending">Lending Center</a><a href="/login">Staff sign in</a></nav>
      </header>

      <nav class="public-mode-tabs" aria-label="Request Center mode">
        <button class="public-mode-tab active" type="button" data-request-mode="new" aria-selected="true">New Request</button>
        <button class="public-mode-tab" type="button" data-request-mode="track" aria-selected="false">Track Existing Request</button>
      </nav>

      <section data-request-mode-panel="new">
        <form id="publicRequestForm" class="panel public-guided-form">
          <ol class="public-stepper" aria-label="Request progress">
            ${STEP_LABELS.map((label, index) => `<li><button type="button" data-step-target="${index + 1}"><span>${index + 1}</span>${escapeHtml(label)}</button></li>`).join('')}
          </ol>

          <section class="public-step-panel" data-step="1" aria-labelledby="requestStep1Title">
            <p class="eyebrow">Step 1 of 5</p>
            <h2 id="requestStep1Title">What do you need?</h2>
            <p>Choose one workflow. The following steps show only the relevant source-grounded fields.</p>
            <div class="public-request-types">
              <label><input type="radio" name="requestType" value="EVENT_LOGISTICS" checked><span><strong>Event Logistics Request</strong><small>For an approved event series and sub-event.</small></span></label>
              <label><input type="radio" name="requestType" value="CATALOG_RESTOCK"><span><strong>Catalog / Office Restock Request</strong><small>For an approved inventory or pantry area.</small></span></label>
            </div>
          </section>

          <section class="public-step-panel" data-step="2" aria-labelledby="requestStep2Title" hidden>
            <p class="eyebrow">Step 2 of 5</p>
            <h2 id="requestStep2Title">Requester</h2>
            <p>Provide shared requester information once.</p>
            <div class="public-form-grid">
              <label>Full name<input name="requesterName" autocomplete="name" maxlength="120" required></label>
              <label>Requester type<select name="requesterType" required><option value="">Select requester type</option>${optionMarkup(
                requesterTypes,
                (value) => value,
                (value) => value,
              )}</select></label>
              <label>Organization / department / office<input name="organization" autocomplete="organization" maxlength="120" required></label>
              <label>Contact number<input name="contactNumber" autocomplete="tel" maxlength="24" required></label>
              <label class="span-2">Email address<input name="email" type="email" autocomplete="email" maxlength="254" required></label>
            </div>
          </section>

          <section class="public-step-panel" data-step="3" aria-labelledby="requestStep3Title" hidden>
            <p class="eyebrow">Step 3 of 5</p>
            <h2 id="requestStep3Title">Event & Schedule</h2>
            <section class="public-related-lookup" aria-labelledby="relatedLookupTitle">
              <div><h3 id="relatedLookupTitle">Link a private existing request</h3><p>Optional. Verify its Request ID and private tracking code before it can appear in the filtered dropdown.</p></div>
              <div class="public-related-fields">
                <label>Existing Request ID<input name="relatedLookupId" maxlength="80" autocomplete="off"></label>
                <label>Private tracking code<input name="relatedLookupCode" type="password" maxlength="128" autocomplete="off"></label>
                <button class="secondary" type="button" data-verify-related>Verify request</button>
              </div>
              <p class="borrower-form-message" data-related-message role="status" aria-live="polite"></p>
            </section>
            <div data-event-context class="public-form-grid">
              <label>Event series<select name="eventSeriesId" required><option value="">Select an approved series</option>${optionMarkup(
                eventSeries,
                (series) => series.id,
                (series) => series.name,
              )}</select></label>
              <label>Sub-event<select name="eventId" required disabled><option value="">Select an event series first</option></select></label>
              <label>Original Request ID, if additional<select name="originalRequestId" disabled><option value="">New parent request</option></select></label>
              <label>Location<input name="location" maxlength="160" placeholder="Filled from the approved sub-event when available"></label>
              <label>Overall start date<input name="startDate" type="date"></label>
              <label>Overall end date<input name="endDate" type="date"></label>
              <label class="span-2">Purpose / justification<textarea name="eventPurpose" maxlength="500" required></textarea></label>
              ${eventSeries.length ? '' : '<p class="span-2 public-source-note">No approved future event series are currently available. Select the restock workflow or ask DOL staff to publish an approved event.</p>'}
            </div>
            <div data-restock-context class="public-form-grid" hidden>
              <label>Inventory / pantry area<select name="stockArea" required disabled><option value="">Select an approved area</option>${optionMarkup(
                stockAreas,
                (value) => value,
                (value) => value,
              )}</select></label>
              <label>Needed date<input name="neededDate" type="date" required disabled></label>
              <label>Related Request ID, if applicable<select name="relatedRequestId" disabled><option value="">No related request</option></select></label>
              <label class="span-2">Purpose / justification<textarea name="restockPurpose" maxlength="500" required disabled></textarea></label>
              ${stockAreas.length ? '' : '<p class="span-2 public-source-note">No approved inventory or pantry area is currently available.</p>'}
            </div>
          </section>

          <section class="public-step-panel" data-step="4" aria-labelledby="requestStep4Title" hidden>
            <p class="eyebrow">Step 4 of 5</p>
            <h2 id="requestStep4Title">Requirements</h2>
            <p>Use one composer. Every selection becomes a standard line in this request.</p>
            <section class="public-composer" aria-labelledby="requestComposerTitle">
              <div class="panel-head"><div><h3 id="requestComposerTitle">Add Request Item</h3><p>Choose a category; only relevant fields appear.</p></div></div>
              <label>Category<select name="lineCategory" data-line-category>${options.categories.map((category) => `<option>${escapeHtml(category)}</option>`).join('')}</select></label>
              <div data-line-fields></div>
              <button class="secondary" type="button" data-add-request-line>Add to requested items</button>
            </section>
            <section class="public-request-lines" aria-labelledby="requestedItemsTitle">
              <div class="panel-head"><div><h3 id="requestedItemsTitle">Requested Items</h3><p>Submission does not reserve or reduce physical stock.</p></div><span class="pill" data-line-count>0 items</span></div>
              <div data-request-lines><p class="empty">No requested items yet.</p></div>
            </section>
          </section>

          <section class="public-step-panel" data-step="5" aria-labelledby="requestStep5Title" hidden>
            <p class="eyebrow">Step 5 of 5</p>
            <h2 id="requestStep5Title">Review & Submit</h2>
            <div data-request-review></div>
            <section class="public-review-evidence"><h3>Evidence</h3><p>No public evidence is attached. Staff may request supporting evidence during review.</p></section>
            <div data-lead-time-warning class="public-lead-time-warning" hidden></div>
            <label class="public-check"><input name="reviewAcknowledged" type="checkbox" required><span><strong>Review acknowledgment</strong><small>I confirm these details are accurate and understand this request starts For Review without reserving or deducting stock.</small></span></label>
            <label class="public-check"><input name="dataUseAcknowledged" type="checkbox" required><span><strong>Privacy acknowledgment</strong><small>I read the Privacy Notice and understand how my request data, private tracking, governed retention, correction, and support paths work.</small></span></label>
            <label class="public-check"><input name="acceptableUseAcknowledged" type="checkbox" required><span><strong>Acceptable Use acknowledgment</strong><small>I will provide accurate authorized information and keep identifiers, tracking codes, and sensitive data out of public channels.</small></span></label>
            <label class="public-check"><input name="evidenceConsentAcknowledged" type="checkbox" required><span><strong>Evidence and photo acknowledgment</strong><small>If evidence is later requested through a protected workflow, I will share only relevant content I am authorized to provide and have consent for.</small></span></label>
          </section>

          <p class="borrower-form-message" role="status" aria-live="polite"></p>
          <div class="public-step-actions">
            <button class="secondary" type="button" data-step-previous hidden>Previous</button>
            <button class="primary" type="button" data-step-next>Continue</button>
            <button class="primary" type="submit" data-submit-request hidden>Submit request for review</button>
          </div>
        </form>
      </section>

      <section data-request-mode-panel="track" hidden>
        <div class="public-track-layout">
          <section class="panel" aria-labelledby="trackRequestTitle">
            <p class="eyebrow">Private tracking</p>
            <h2 id="trackRequestTitle">Track Existing Request</h2>
            <p>Enter the Request ID and private tracking code shown once after submission.</p>
            <form id="publicTrackForm" class="borrower-form">
              <label>Request ID<input name="requestId" autocomplete="off" maxlength="80" required></label>
              <label>Private tracking code<input name="trackingCode" type="password" autocomplete="off" maxlength="128" required></label>
              <button class="secondary" type="submit">Check status</button>
              <p class="borrower-form-message" role="status" aria-live="polite"></p>
            </form>
            <div data-track-result></div>
          </section>
          <section class="panel public-privacy-note"><h2>Your privacy</h2><p>The tracking code is not stored in this browser. This view never exposes other requests, internal comments, protected stock, suppliers, audit records, or private evidence.</p></section>
        </div>
      </section>
      ${publicPolicyLinksMarkup()}
      ${publicPolicyDialogsMarkup()}
    </main>`;

  bindPublicPolicyDialogs(root);

  const form = root.querySelector('#publicRequestForm');
  const category = form.elements.lineCategory;
  const fields = root.querySelector('[data-line-fields]');
  const lineList = root.querySelector('[data-request-lines]');
  const lineCount = root.querySelector('[data-line-count]');
  const message = form.querySelector('.borrower-form-message');

  const requestType = () => form.elements.requestType.value;
  const purposeValue = () =>
    requestType() === 'EVENT_LOGISTICS'
      ? form.elements.eventPurpose.value
      : form.elements.restockPurpose.value;

  const renderFields = () => {
    if (category.value === 'Inventory Item') {
      fields.innerHTML = `<label>Approved inventory item<select name="itemId" required><option value="">Select an item</option>${options.items.map((item) => `<option value="${escapeHtml(item.id)}" data-name="${escapeHtml(item.name)}" data-unit="${escapeHtml(item.unit)}">${escapeHtml(item.name)} · ${escapeHtml(item.category)} (${escapeHtml(item.unit)})</option>`).join('')}</select></label><label>Quantity<input name="lineQuantity" type="number" min="1" step="1" value="1" required></label><label>Specification / notes<textarea name="lineSpecification" maxlength="1000"></textarea></label>`;
      return;
    }
    if (['Venue / Facility', 'Logistics / Equipment'].includes(category.value)) {
      const groups =
        category.value === 'Venue / Facility' ? ['Venues / Facilities'] : ['Logistics', 'Equipment'];
      const references = options.references.filter((reference) => groups.includes(reference.group));
      fields.innerHTML = references.length
        ? `<fieldset class="public-reference-choices"><legend>Approved ${escapeHtml(groups.join(' / '))}</legend>${references.map((reference) => `<label class="public-check"><input type="checkbox" name="referenceId" value="${escapeHtml(reference.id)}" data-name="${escapeHtml(reference.name)}" data-unit="${escapeHtml(reference.unit)}"><span><strong>${escapeHtml(reference.name)}</strong><small>${escapeHtml(reference.category)} · ${escapeHtml(reference.unit)}</small></span></label>`).join('')}</fieldset><label>Quantity for each selected row<input name="lineQuantity" type="number" min="1" step="1" value="1" required></label><label>Specification / notes<textarea name="lineSpecification" maxlength="1000"></textarea></label>`
        : `<p class="empty">No approved ${escapeHtml(groups.join(' or ').toLowerCase())} references are available. Use Other only when the need is not represented.</p>`;
      return;
    }
    fields.innerHTML = `<label>Description<input name="lineDescription" maxlength="240" required></label><div class="public-line-pair"><label>Quantity<input name="lineQuantity" type="number" min="1" step="1" value="1" required></label><label>Unit<input name="lineUnit" maxlength="40" placeholder="piece, pack, service" required></label></div><label>Specification / notes<textarea name="lineSpecification" maxlength="1000"></textarea></label>`;
  };

  const renderLines = () => {
    lineCount.textContent = `${lines.length} item${lines.length === 1 ? '' : 's'}`;
    lineList.innerHTML = lines.length
      ? lines
          .map(
            (line, index) =>
              `<article class="public-request-line"><span><strong>${escapeHtml(line.description)}</strong><small>${escapeHtml(line.category)} · ${escapeHtml(line.quantity)} ${escapeHtml(line.unit)}</small></span><button class="secondary mini" type="button" data-remove-line="${index}" aria-label="Remove ${escapeHtml(line.description)}">Remove</button></article>`,
          )
          .join('')
      : '<p class="empty">No requested items yet.</p>';
    lineList.querySelectorAll('[data-remove-line]').forEach((button) => {
      button.addEventListener('click', () => {
        lines.splice(Number(button.dataset.removeLine), 1);
        renderLines();
      });
    });
  };

  const renderEventOptions = () => {
    const seriesId = form.elements.eventSeriesId.value;
    const events = options.events.filter((event) => event.seriesId === seriesId);
    form.elements.eventId.innerHTML = `<option value="">Select an approved sub-event</option>${optionMarkup(
      events,
      (event) => event.id,
      (event) => event.name,
    )}`;
    form.elements.eventId.disabled = !seriesId;
    form.elements.originalRequestId.innerHTML = '<option value="">New parent request</option>';
    form.elements.originalRequestId.disabled = true;
    form.elements.location.value = '';
  };

  let verifiedReference = null;

  const renderOriginalRequests = () => {
    const eventId = form.elements.eventId.value;
    const event = options.events.find((candidate) => candidate.id === eventId);
    const references =
      verifiedReference?.seriesId === form.elements.eventSeriesId.value &&
      verifiedReference?.eventId === eventId
        ? [verifiedReference]
        : [];
    form.elements.originalRequestId.innerHTML = `<option value="">New parent request</option>${optionMarkup(
      references,
      (reference) => reference.id,
      (reference) => `${reference.id} · ${reference.status.replaceAll('_', ' ')}`,
    )}`;
    form.elements.originalRequestId.disabled = !eventId;
    form.elements.location.value = event?.venue ?? '';
    if (event?.startAt) form.elements.startDate.value = String(event.startAt).slice(0, 10);
    if (event?.endAt) form.elements.endDate.value = String(event.endAt).slice(0, 10);
  };

  const renderRestockReferences = () => {
    const area = form.elements.stockArea.value;
    const references =
      verifiedReference?.requestType === 'CATALOG_RESTOCK' && verifiedReference?.stockArea === area
        ? [verifiedReference]
        : [];
    form.elements.relatedRequestId.innerHTML = `<option value="">No related request</option>${optionMarkup(
      references,
      (reference) => reference.id,
      (reference) => `${reference.id} · ${reference.status.replaceAll('_', ' ')}`,
    )}`;
    form.elements.relatedRequestId.disabled = !area;
  };

  const syncRequestContext = () => {
    const event = requestType() === 'EVENT_LOGISTICS';
    root.querySelector('[data-event-context]').hidden = !event;
    root.querySelector('[data-restock-context]').hidden = event;
    root
      .querySelectorAll(
        '[data-event-context] input, [data-event-context] select, [data-event-context] textarea',
      )
      .forEach((control) => {
        control.disabled =
          !event ||
          (control.name === 'eventId' && !form.elements.eventSeriesId.value) ||
          (control.name === 'originalRequestId' && !form.elements.eventId.value);
      });
    root
      .querySelectorAll(
        '[data-restock-context] input, [data-restock-context] select, [data-restock-context] textarea',
      )
      .forEach((control) => {
        control.disabled = event || (control.name === 'relatedRequestId' && !form.elements.stockArea.value);
      });
  };

  const validateStep = () => {
    if (activeStep === 4 && !lines.length) {
      message.textContent = 'Add at least one requested item before continuing.';
      return false;
    }
    const panel = root.querySelector(`[data-step="${activeStep}"]`);
    const invalid = [...panel.querySelectorAll('input, select, textarea')].find(
      (control) =>
        !control.disabled &&
        !(activeStep === 4 && control.closest('[data-line-fields]')) &&
        !control.checkValidity(),
    );
    if (invalid) {
      invalid.reportValidity();
      return false;
    }
    message.textContent = '';
    return true;
  };

  const renderReview = () => {
    const values = Object.fromEntries(new FormData(form));
    const event = options.events.find((candidate) => candidate.id === values.eventId);
    const series = eventSeries.find((candidate) => candidate.id === values.eventSeriesId);
    const context =
      requestType() === 'EVENT_LOGISTICS'
        ? `${series?.name ?? 'No series'} · ${event?.name ?? 'No sub-event'} · ${values.location || 'Location not specified'} · ${values.startDate || 'No start date'} to ${values.endDate || 'No end date'}`
        : `${values.stockArea || 'No area'} · needed ${values.neededDate || 'date not specified'}${values.relatedRequestId ? ` · related ${values.relatedRequestId}` : ''}`;
    root.querySelector('[data-request-review]').innerHTML = `
      <div class="public-review-grid">
        <article><span>Request type</span><strong>${escapeHtml(REQUEST_TYPE_LABELS[requestType()])}</strong><button type="button" data-edit-step="1">Edit</button></article>
        <article><span>Requester</span><strong>${escapeHtml(values.requesterName)}</strong><small>${escapeHtml(values.requesterType)} · ${escapeHtml(values.organization)} · ${escapeHtml(values.email)}</small><button type="button" data-edit-step="2">Edit</button></article>
        <article><span>Event / restock context</span><strong>${escapeHtml(context)}</strong><small>${escapeHtml(purposeValue())}</small><button type="button" data-edit-step="3">Edit</button></article>
        <article><span>Requested items</span><strong>${lines.length} line${lines.length === 1 ? '' : 's'}</strong><ul>${lines.map((line) => `<li>${escapeHtml(lineLabel(line))}</li>`).join('')}</ul><button type="button" data-edit-step="4">Edit</button></article>
      </div>`;
    root.querySelectorAll('[data-edit-step]').forEach((button) => {
      button.addEventListener('click', () => showStep(Number(button.dataset.editStep)));
    });

    const date = requestType() === 'EVENT_LOGISTICS' ? values.startDate : values.neededDate;
    const days = date ? Math.ceil((new Date(`${date}T00:00:00`) - Date.now()) / 86_400_000) : null;
    const warning = root.querySelector('[data-lead-time-warning]');
    warning.hidden = days === null || days > 3;
    warning.textContent =
      days !== null && days <= 3
        ? 'Lead-time warning: the requested date is within three days. Staff review may require an adjusted schedule.'
        : '';
  };

  function showStep(step) {
    activeStep = Math.min(5, Math.max(1, step));
    root.querySelectorAll('[data-step]').forEach((panel) => {
      panel.hidden = Number(panel.dataset.step) !== activeStep;
    });
    root.querySelectorAll('[data-step-target]').forEach((button) => {
      const target = Number(button.dataset.stepTarget);
      button.disabled = target > activeStep;
      button.closest('li').classList.toggle('active', target === activeStep);
      button.closest('li').classList.toggle('complete', target < activeStep);
      if (target === activeStep) button.setAttribute('aria-current', 'step');
      else button.removeAttribute('aria-current');
    });
    root.querySelector('[data-step-previous]').hidden = activeStep === 1;
    root.querySelector('[data-step-next]').hidden = activeStep === 5;
    root.querySelector('[data-submit-request]').hidden = activeStep !== 5;
    root
      .querySelectorAll('[data-line-fields] input, [data-line-fields] select, [data-line-fields] textarea')
      .forEach((control) => {
        control.disabled = activeStep !== 4;
      });
    if (activeStep === 5) renderReview();
    root.querySelector(`[data-step="${activeStep}"]`).focus({ preventScroll: true });
  }

  category.addEventListener('change', renderFields);
  form.elements.eventSeriesId.addEventListener('change', () => {
    renderEventOptions();
    syncRequestContext();
  });
  form.elements.eventId.addEventListener('change', () => {
    renderOriginalRequests();
    syncRequestContext();
  });
  form.elements.stockArea.addEventListener('change', () => {
    renderRestockReferences();
    syncRequestContext();
  });
  [...form.elements.requestType].forEach((radio) => radio.addEventListener('change', syncRequestContext));

  renderFields();
  renderLines();
  syncRequestContext();
  showStep(1);

  root.querySelector('[data-add-request-line]').addEventListener('click', () => {
    const quantity = Number(form.elements.lineQuantity?.value);
    if (!Number.isFinite(quantity) || quantity <= 0) {
      form.elements.lineQuantity?.reportValidity();
      return;
    }
    const specification = form.elements.lineSpecification?.value ?? '';
    if (category.value === 'Inventory Item') {
      const selected = form.elements.itemId.selectedOptions[0];
      if (!selected?.value) return form.elements.itemId.reportValidity();
      lines.push({
        category: category.value,
        itemId: selected.value,
        description: selected.dataset.name,
        quantity,
        unit: selected.dataset.unit,
        specification,
      });
    } else if (['Venue / Facility', 'Logistics / Equipment'].includes(category.value)) {
      const selected = [...form.querySelectorAll('[name="referenceId"]:checked')];
      if (!selected.length) {
        message.textContent = 'Select at least one approved reference.';
        return;
      }
      selected.forEach((checkbox) =>
        lines.push({
          category: category.value,
          referenceId: checkbox.value,
          description: checkbox.dataset.name,
          quantity,
          unit: checkbox.dataset.unit,
          specification,
        }),
      );
    } else {
      if (!form.elements.lineDescription.reportValidity() || !form.elements.lineUnit.reportValidity()) return;
      lines.push({
        category: category.value,
        description: form.elements.lineDescription.value,
        quantity,
        unit: form.elements.lineUnit.value,
        specification,
      });
    }
    message.textContent = '';
    renderLines();
    renderFields();
  });

  root.querySelector('[data-step-next]').addEventListener('click', () => {
    if (validateStep()) showStep(activeStep + 1);
  });
  root.querySelector('[data-step-previous]').addEventListener('click', () => showStep(activeStep - 1));
  root.querySelectorAll('[data-step-target]').forEach((button) => {
    button.addEventListener('click', () => {
      const target = Number(button.dataset.stepTarget);
      if (target < activeStep) showStep(target);
    });
  });

  root.querySelectorAll('[data-request-mode]').forEach((button) => {
    button.addEventListener('click', () => {
      const mode = button.dataset.requestMode;
      root.querySelectorAll('[data-request-mode]').forEach((tab) => {
        const selected = tab === button;
        tab.classList.toggle('active', selected);
        tab.setAttribute('aria-selected', String(selected));
      });
      root.querySelectorAll('[data-request-mode-panel]').forEach((panel) => {
        panel.hidden = panel.dataset.requestModePanel !== mode;
      });
    });
  });

  root.querySelector('[data-verify-related]').addEventListener('click', async () => {
    const relatedMessage = root.querySelector('[data-related-message]');
    const requestId = form.elements.relatedLookupId.value.trim();
    const trackingCode = form.elements.relatedLookupCode.value.trim();
    if (!requestId || !trackingCode) {
      relatedMessage.textContent = 'Enter both the existing Request ID and its private tracking code.';
      return;
    }
    const button = root.querySelector('[data-verify-related]');
    button.disabled = true;
    try {
      const result = await client.request('/api/public/request/related', {
        body: { requestId, trackingCode },
      });
      verifiedReference = result.reference;
      renderOriginalRequests();
      renderRestockReferences();
      const contextMatches =
        requestType() === 'EVENT_LOGISTICS'
          ? verifiedReference.seriesId === form.elements.eventSeriesId.value &&
            verifiedReference.eventId === form.elements.eventId.value
          : verifiedReference.requestType === 'CATALOG_RESTOCK' &&
            verifiedReference.stockArea === form.elements.stockArea.value;
      relatedMessage.textContent = contextMatches
        ? `${verifiedReference.id} is verified and available in the related-request dropdown.`
        : `${verifiedReference.id} is verified but does not match the selected event or restock area.`;
    } catch (error) {
      verifiedReference = null;
      renderOriginalRequests();
      renderRestockReferences();
      relatedMessage.textContent = error.message;
    } finally {
      form.elements.relatedLookupCode.value = '';
      button.disabled = false;
    }
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!validateStep()) return;
    const submit = event.submitter;
    const values = Object.fromEntries(new FormData(form));
    submit.disabled = true;
    try {
      const result = await client.request('/api/public/request', {
        body: {
          requestType: values.requestType,
          requesterName: values.requesterName,
          requesterType: values.requesterType,
          organization: values.organization,
          contactNumber: values.contactNumber,
          email: values.email,
          eventSeriesId: values.eventSeriesId,
          eventId: values.eventId,
          originalRequestId: values.originalRequestId,
          location: values.location,
          startDate: values.startDate,
          endDate: values.endDate,
          stockArea: values.stockArea,
          neededDate: values.neededDate,
          relatedRequestId: values.relatedRequestId,
          purpose: purposeValue(),
          dataUseAcknowledged: values.dataUseAcknowledged === 'on',
          acceptableUseAcknowledged: values.acceptableUseAcknowledged === 'on',
          evidenceConsentAcknowledged: values.evidenceConsentAcknowledged === 'on',
          lines,
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
      receipt.innerHTML = `<p class="eyebrow">Request submitted</p><h2>Save your private tracking details</h2><p><strong>Request ID</strong><code>${escapeHtml(result.requestId)}</code></p><p><strong>Private tracking code</strong><code>${escapeHtml(result.trackingCode)}</code></p><p>This code is shown once. Store it securely; it cannot be recovered from this browser.</p><button class="secondary" type="button" data-open-tracking>Open private tracking</button>`;
      form.after(receipt);
      receipt.querySelector('[data-open-tracking]').addEventListener('click', () => {
        root.querySelector('[data-request-mode="track"]').click();
        root.querySelector('#publicTrackForm').elements.requestId.value = result.requestId;
        root.querySelector('#publicTrackForm').elements.trackingCode.focus();
      });
      receipt.scrollIntoView({ block: 'center' });
    } catch (error) {
      message.textContent = error.message;
      submit.disabled = false;
    }
  });

  const trackForm = root.querySelector('#publicTrackForm');
  trackForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const trackMessage = trackForm.querySelector('.borrower-form-message');
    const resultRoot = root.querySelector('[data-track-result]');
    const submit = event.submitter;
    submit.disabled = true;
    try {
      const values = Object.fromEntries(new FormData(trackForm));
      const result = await client.request('/api/public/request/track', { body: values });
      trackMessage.textContent = '';
      resultRoot.innerHTML = `<article class="public-track-result"><span class="status blue">${escapeHtml(result.request.status.replaceAll('_', ' '))}</span><h3>${escapeHtml(result.request.id)}</h3><ul>${result.request.lines.map((line) => `<li>${escapeHtml(lineLabel(line))} · ${escapeHtml(line.status.replaceAll('_', ' '))}</li>`).join('')}</ul><small>Last updated ${escapeHtml(new Date(result.request.updatedAt).toLocaleString('en-PH'))}</small></article>`;
    } catch (error) {
      resultRoot.innerHTML = '';
      trackMessage.textContent = error.message;
    } finally {
      submit.disabled = false;
    }
  });
}
