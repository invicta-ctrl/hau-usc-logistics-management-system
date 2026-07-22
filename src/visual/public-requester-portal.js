function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

const clientRequestId = () => `public-request:${crypto.randomUUID()}`;

function lineLabel(line) {
  return `${line.description} · ${line.quantity} ${line.unit}`;
}

export async function mountPublicRequesterPortal({ root, client }) {
  let options;
  try {
    options = await client.request('/api/public/request/options', { method: 'GET' });
  } catch (error) {
    root.innerHTML = `<section class="auth-card"><p class="eyebrow">Request Center</p><h1>Request Center is unavailable</h1><p class="auth-intro">${escapeHtml(error.message)}</p><a href="/login">Staff sign in</a></section>`;
    return;
  }

  const lines = [];
  const eventOptions = options.events
    .map((event) => `<option value="${escapeHtml(event.id)}">${escapeHtml(event.name)}</option>`)
    .join('');
  root.innerHTML = `
    <main class="public-request-portal" aria-labelledby="publicRequestTitle">
      <header class="public-portal-header">
        <div><p class="eyebrow">HAU-USC Logistics</p><h1 id="publicRequestTitle">Request Center</h1><p>Submit a logistics request without a staff account. Every request starts For Review.</p></div>
        <nav aria-label="Logistics portal links"><a href="/lending">Lending Center</a><a href="/login">Staff sign in</a></nav>
      </header>
      <div class="public-request-layout">
        <form id="publicRequestForm" class="panel public-request-form">
          <div class="panel-head"><div><h2>New logistics request</h2><p>Shared requester and event details are collected once.</p></div></div>
          <div class="public-form-grid">
            <label>Full name<input name="requesterName" autocomplete="name" maxlength="120" required></label>
            <label>Organization / department<input name="organization" autocomplete="organization" maxlength="120" required></label>
            <label>Contact number<input name="contactNumber" autocomplete="tel" maxlength="24" required></label>
            <label>Email address<input name="email" type="email" autocomplete="email" maxlength="254" required></label>
            <label>Approved event / sub-event<select name="eventId"><option value="">Office / non-event request</option>${eventOptions}</select></label>
            <label>Overall start date<input name="startDate" type="date"></label>
            <label>Overall end date<input name="endDate" type="date"></label>
            <label class="span-2">Purpose / justification<textarea name="purpose" maxlength="500" required></textarea></label>
          </div>
          <section class="public-composer" aria-labelledby="requestComposerTitle">
            <div class="panel-head"><div><h3 id="requestComposerTitle">Add Request Item</h3><p>Choose a category; only relevant fields will appear.</p></div></div>
            <label>Category<select name="lineCategory" data-line-category>${options.categories.map((category) => `<option>${escapeHtml(category)}</option>`).join('')}</select></label>
            <div data-line-fields></div>
            <button class="secondary" type="button" data-add-request-line>Add to requested items</button>
          </section>
          <section class="public-request-lines" aria-labelledby="requestedItemsTitle">
            <div class="panel-head"><div><h3 id="requestedItemsTitle">Requested Items</h3><p>Submission does not reserve or reduce physical stock.</p></div><span class="pill" data-line-count>0 items</span></div>
            <div data-request-lines><p class="empty">No requested items yet.</p></div>
          </section>
          <p class="borrower-form-message" role="status" aria-live="polite"></p>
          <button class="primary" type="submit">Submit request for review</button>
        </form>
        <aside class="public-request-aside">
          <section class="panel" aria-labelledby="trackRequestTitle">
            <p class="eyebrow">Private tracking</p>
            <h2 id="trackRequestTitle">Track Existing Request</h2>
            <p>Use the Request ID and private tracking code shown after submission.</p>
            <form id="publicTrackForm" class="borrower-form">
              <label>Request ID<input name="requestId" autocomplete="off" maxlength="80" required></label>
              <label>Private tracking code<input name="trackingCode" type="password" autocomplete="off" maxlength="128" required></label>
              <button class="secondary" type="submit">Check status</button>
              <p class="borrower-form-message" role="status" aria-live="polite"></p>
            </form>
            <div data-track-result></div>
          </section>
          <section class="panel public-privacy-note"><h2>Your privacy</h2><p>The tracking code is shown once and is not stored in this browser. Staff-only stock, supplier, roster, and audit information is never shown here.</p></section>
        </aside>
      </div>
    </main>`;

  const form = root.querySelector('#publicRequestForm');
  const category = form.elements.lineCategory;
  const fields = root.querySelector('[data-line-fields]');
  const lineList = root.querySelector('[data-request-lines]');
  const lineCount = root.querySelector('[data-line-count]');

  const renderFields = () => {
    if (category.value === 'Inventory Item') {
      fields.innerHTML = `<label>Approved inventory item<select name="itemId"><option value="">Select an item</option>${options.items.map((item) => `<option value="${escapeHtml(item.id)}" data-name="${escapeHtml(item.name)}" data-unit="${escapeHtml(item.unit)}">${escapeHtml(item.name)} · ${escapeHtml(item.category)} (${escapeHtml(item.unit)})</option>`).join('')}</select></label><label>Quantity<input name="lineQuantity" type="number" min="1" step="1" value="1"></label><label>Specification / notes<textarea name="lineSpecification" maxlength="1000"></textarea></label>`;
      return;
    }
    if (['Venue / Facility', 'Logistics / Equipment'].includes(category.value)) {
      const group = category.value === 'Venue / Facility' ? 'Venues / Facilities' : 'Equipment';
      const references = options.references.filter((reference) => reference.group === group);
      fields.innerHTML = references.length
        ? `<fieldset class="public-reference-choices"><legend>Approved ${escapeHtml(group)}</legend>${references.map((reference) => `<label class="public-check"><input type="checkbox" name="referenceId" value="${escapeHtml(reference.id)}" data-name="${escapeHtml(reference.name)}" data-unit="${escapeHtml(reference.unit)}"><span><strong>${escapeHtml(reference.name)}</strong><small>${escapeHtml(reference.category)} · ${escapeHtml(reference.unit)}</small></span></label>`).join('')}</fieldset><label>Quantity for each selected row<input name="lineQuantity" type="number" min="1" step="1" value="1"></label><label>Specification / notes<textarea name="lineSpecification" maxlength="1000"></textarea></label>`
        : `<p class="empty">No approved ${escapeHtml(group.toLowerCase())} references are currently available. Use Other only when your need is not represented.</p>`;
      return;
    }
    fields.innerHTML = `<label>Description<input name="lineDescription" maxlength="240"></label><div class="public-line-pair"><label>Quantity<input name="lineQuantity" type="number" min="1" step="1" value="1"></label><label>Unit<input name="lineUnit" maxlength="40" placeholder="piece, pack, service"></label></div><label>Specification / notes<textarea name="lineSpecification" maxlength="1000"></textarea></label>`;
  };

  const renderLines = () => {
    lineCount.textContent = `${lines.length} item${lines.length === 1 ? '' : 's'}`;
    lineList.innerHTML = lines.length
      ? lines.map((line, index) => `<article class="public-request-line"><span><strong>${escapeHtml(line.description)}</strong><small>${escapeHtml(line.category)} · ${escapeHtml(line.quantity)} ${escapeHtml(line.unit)}</small></span><button class="secondary mini" type="button" data-remove-line="${index}" aria-label="Remove ${escapeHtml(line.description)}">Remove</button></article>`).join('')
      : '<p class="empty">No requested items yet.</p>';
    lineList.querySelectorAll('[data-remove-line]').forEach((button) => {
      button.addEventListener('click', () => {
        lines.splice(Number(button.dataset.removeLine), 1);
        renderLines();
      });
    });
  };

  category.addEventListener('change', renderFields);
  renderFields();
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
      lines.push({ category: category.value, itemId: selected.value, description: selected.dataset.name, quantity, unit: selected.dataset.unit, specification });
    } else if (['Venue / Facility', 'Logistics / Equipment'].includes(category.value)) {
      const selected = [...form.querySelectorAll('[name="referenceId"]:checked')];
      if (!selected.length) return;
      selected.forEach((checkbox) => lines.push({ category: category.value, referenceId: checkbox.value, description: checkbox.dataset.name, quantity, unit: checkbox.dataset.unit, specification }));
    } else {
      if (!form.elements.lineDescription.value.trim()) {
        form.elements.lineDescription.focus();
        return;
      }
      if (!form.elements.lineUnit.value.trim()) {
        form.elements.lineUnit.focus();
        return;
      }
      lines.push({ category: category.value, description: form.elements.lineDescription.value, quantity, unit: form.elements.lineUnit.value, specification });
    }
    renderLines();
    renderFields();
  });

  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    const message = form.querySelector('.borrower-form-message');
    if (!lines.length) {
      message.textContent = 'Add at least one requested item.';
      return;
    }
    const submit = event.submitter;
    const values = Object.fromEntries(new FormData(form));
    submit.disabled = true;
    try {
      const result = await client.request('/api/public/request', {
        body: {
          requesterName: values.requesterName,
          organization: values.organization,
          contactNumber: values.contactNumber,
          email: values.email,
          eventId: values.eventId,
          startDate: values.startDate,
          endDate: values.endDate,
          purpose: values.purpose,
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
      receipt.innerHTML = `<p class="eyebrow">Request submitted</p><h2>Save your private tracking details</h2><p><strong>Request ID</strong><code>${escapeHtml(result.requestId)}</code></p><p><strong>Private tracking code</strong><code>${escapeHtml(result.trackingCode)}</code></p><p>This code is shown once. Store it securely; it cannot be recovered from this browser.</p>`;
      form.after(receipt);
      receipt.scrollIntoView({ block: 'center' });
    } catch (error) {
      message.textContent = error.message;
      submit.disabled = false;
    }
  });

  const trackForm = root.querySelector('#publicTrackForm');
  trackForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const message = trackForm.querySelector('.borrower-form-message');
    const resultRoot = root.querySelector('[data-track-result]');
    const submit = event.submitter;
    submit.disabled = true;
    try {
      const values = Object.fromEntries(new FormData(trackForm));
      const result = await client.request('/api/public/request/track', { body: values });
      message.textContent = '';
      resultRoot.innerHTML = `<article class="public-track-result"><span class="status blue">${escapeHtml(result.request.status.replaceAll('_', ' '))}</span><h3>${escapeHtml(result.request.id)}</h3><ul>${result.request.lines.map((line) => `<li>${escapeHtml(lineLabel(line))} · ${escapeHtml(line.status.replaceAll('_', ' '))}</li>`).join('')}</ul><small>Last updated ${escapeHtml(new Date(result.request.updatedAt).toLocaleString('en-PH'))}</small></article>`;
    } catch (error) {
      resultRoot.innerHTML = '';
      message.textContent = error.message;
    } finally {
      submit.disabled = false;
    }
  });
}
