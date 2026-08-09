import { brandLockupMarkup } from './brand-assets.js';
import { portalNavigationMarkup, releaseIdentityMarkup } from './portal-navigation.js';
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

const requestKey = (scope) => `${scope}:${crypto.randomUUID()}`;
const displayStatus = (value) => String(value ?? '').replaceAll('_', ' ');
const autocompleteThreshold = 8;
const formatDate = (value) =>
  value ? new Date(value).toLocaleString('en-PH', { dateStyle: 'medium', timeStyle: 'short' }) : '';

function option(value, label = value) {
  return `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`;
}

function pdfText(value) {
  return String(value ?? '')
    .normalize('NFKD')
    .replace(/[^\x20-\x7e]/gu, '-')
    .replaceAll('\\', '\\\\')
    .replaceAll('(', '\\(')
    .replaceAll(')', '\\)');
}

function buildReceiptPdf(receipt) {
  const detailLines = [
    'HAU-USC Department of Logistics',
    'Logistics Request Receipt',
    '',
    `Request type: ${receipt.requestType}`,
    ...(receipt.parentRequestId ? [`Parent request: ${receipt.parentRequestId}`] : []),
    `Request ID: ${receipt.requestId}`,
    `Department: ${receipt.department}`,
    `Event: ${receipt.event}`,
    `Sub-event: ${receipt.subEvent}`,
    `Submitted: ${formatDate(receipt.submittedAt)}`,
    `Initial status: ${displayStatus(receipt.status)}`,
    '',
    'Requested items:',
    ...receipt.lines.flatMap((line, index) => [
      `${index + 1}. [${line.category}] ${line.description}`,
      `   ${line.quantity} ${line.unit}${line.specification ? ` - ${line.specification}` : ''}`,
    ]),
    '',
    'This receipt confirms submission only. It is not an approval, reservation,',
    'release, or guarantee of availability.',
    'Sign in to the Request Center and use Track Existing Request for status.',
  ];
  const pages = [];
  for (let index = 0; index < detailLines.length; index += 42) {
    pages.push(detailLines.slice(index, index + 42));
  }
  const objects = [];
  const add = (body) => {
    objects.push(body);
    return objects.length;
  };
  const catalogId = add('');
  const pagesId = add('');
  const fontId = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>');
  const pageIds = [];
  for (const lines of pages) {
    const commands = [
      'BT',
      '/F1 11 Tf',
      '48 790 Td',
      '14 TL',
      ...lines.flatMap((line) => [`(${pdfText(line)}) Tj`, 'T*']),
      'ET',
    ].join('\n');
    const contentId = add(`<< /Length ${commands.length} >>\nstream\n${commands}\nendstream`);
    pageIds.push(
      add(
        `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 ${fontId} 0 R >> >> /Contents ${contentId} 0 R >>`,
      ),
    );
  }
  objects[catalogId - 1] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;
  objects[pagesId - 1] =
    `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`;
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((body, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${body}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f\n`;
  offsets.slice(1).forEach((offset) => {
    pdf += `${String(offset).padStart(10, '0')} 00000 n\n`;
  });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new Blob([pdf], { type: 'application/pdf' });
}

function downloadReceipt(receipt) {
  const url = URL.createObjectURL(buildReceiptPdf(receipt));
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `${receipt.requestId}-request-receipt.pdf`;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function requestCard(request, { expanded = false } = {}) {
  const cancellable = ['FOR_REVIEW', 'ACCEPTED'].includes(request.status);
  return `<article class="borrower-ticket request-center-ticket" data-request="${escapeHtml(request.id)}">
    <div>
      <span class="status blue">${escapeHtml(displayStatus(request.status))}</span>
      <strong>${escapeHtml(request.id)} · ${escapeHtml(request.event)} / ${escapeHtml(request.subEvent)}</strong>
      <small>${escapeHtml(request.requestType)}${request.parentRequestId ? ` · Parent ${escapeHtml(request.parentRequestId)}` : ''} · ${request.lines.length} item${request.lines.length === 1 ? '' : 's'} · ${escapeHtml(formatDate(request.updatedAt))}</small>
    </div>
    <button class="secondary mini" type="button" data-view-request="${escapeHtml(request.id)}">${expanded ? 'Hide details' : 'View status'}</button>
    <div class="request-center-detail" ${expanded ? '' : 'hidden'}>
      <p>${escapeHtml(request.purpose)}</p>
      <ul>${request.lines.map((line) => `<li><strong>${escapeHtml(line.description)}</strong> — ${escapeHtml(line.quantity)} ${escapeHtml(line.unit)} · ${escapeHtml(line.category)} · ${escapeHtml(displayStatus(line.status))}${line.specification ? `<br><small>${escapeHtml(line.specification)}</small>` : ''}</li>`).join('')}</ul>
      <h3>Visible history</h3>
      <ol>${request.history.map((entry) => `<li>${escapeHtml(displayStatus(entry.status))} · ${escapeHtml(formatDate(entry.at))}</li>`).join('') || '<li>No visible status changes yet.</li>'}</ol>
      <div class="button-row"><button class="secondary mini" type="button" data-additional-for="${escapeHtml(request.parentRequestId || request.id)}">Add to this request</button>${cancellable ? `<button class="danger mini" type="button" data-cancel-request="${escapeHtml(request.id)}">Cancel request</button>` : ''}</div>
    </div>
  </article>`;
}

export async function mountRequesterPortal({ root, client, session, onLogout }) {
  const logout = async () => onLogout();
  if (session?.user?.authorization?.roleId !== 'REQUESTER' || !session.user.requesterDepartment?.id) {
    root.innerHTML = `
      <section class="auth-card" aria-labelledby="requesterTitle">
        <p class="eyebrow">Request Center</p>
        <h1 id="requesterTitle">Department requester access is required</h1>
        <p class="auth-intro">This portal is limited to a governed department account.</p>
        <button class="primary" type="button" data-requester-logout>Sign out</button>
      </section>`;
    root.querySelector('[data-requester-logout]').addEventListener('click', logout);
    return;
  }

  let portal;
  let draft = [];
  let receipt = null;
  let openRequestId = '';

  const load = async () => {
    portal = await client.request('/api/portal/request', { method: 'GET' });
  };

  const render = () => {
    const parentOptions = portal.requests
      .filter(
        (request) => request.requestType === 'NEW' && !['CANCELLED', 'REJECTED'].includes(request.status),
      )
      .map((request) =>
        option(
          request.id,
          `${request.id} — ${request.event} / ${request.subEvent} — ${displayStatus(request.status)}`,
        ),
      )
      .join('');
    const categoryOptions = Object.keys(portal.choices)
      .map((category) => option(category))
      .concat(option('Other', 'Other item'))
      .join('');
    const unitOptions = portal.units.map((unit) => option(unit)).join('');
    const trackOptions = portal.requests
      .flatMap((request) => [
        `<option value="${escapeHtml(request.id)}">${escapeHtml(request.event)} / ${escapeHtml(request.subEvent)}</option>`,
        `<option value="${escapeHtml(request.event)}"></option>`,
        `<option value="${escapeHtml(request.subEvent)}"></option>`,
      ])
      .join('');

    root.innerHTML = `
      <main class="borrower-portal requester-portal authenticated-request-center" aria-labelledby="requesterPortalTitle">
        <header class="borrower-portal-header">
          <div class="public-portal-identity">${brandLockupMarkup({ compact: true })}<div><p class="eyebrow">HAU-USC Logistics</p><h1 id="requesterPortalTitle">Request Center</h1><p>Authenticated department requests and private status.</p>${releaseIdentityMarkup()}</div></div>
          <div class="borrower-profile"><strong>${escapeHtml(portal.profile.displayName)}</strong><small>Department requester</small><button class="secondary" type="button" data-requester-logout>Sign out</button></div>
        </header>
        ${portalNavigationMarkup({ current: 'request' })}
        <nav class="public-mode-tabs" aria-label="Request Center mode">
          <button class="public-mode-tab active" type="button" data-center-tab="create" aria-selected="true">Create Request</button>
          <button class="public-mode-tab" type="button" data-center-tab="track" aria-selected="false">Track Existing Request</button>
        </nav>
        <section data-center-panel="create">
          <form id="requesterRequestForm" class="panel public-request-form">
            <div class="panel-head"><div><p class="eyebrow">Step 1</p><h2>Request identity</h2><p>Your department is derived from the secure session and cannot be edited.</p></div></div>
            <div class="public-form-grid">
              <label>Department<input value="${escapeHtml(portal.profile.displayName)}" readonly aria-readonly="true"></label>
            </div>
            <div class="panel-head section-gap"><div><p class="eyebrow">Step 2</p><h2>New or Additional</h2><p>Additional requests remain separate records linked to your existing request.</p></div></div>
            <div class="public-form-grid">
              <fieldset><legend>Request type</legend><label class="checkbox"><input type="radio" name="requestType" value="NEW" checked> New request</label><label class="checkbox"><input type="radio" name="requestType" value="ADDITIONAL"> Additional request</label></fieldset>
              <label class="span-2" data-parent-wrap hidden>Existing parent request<select name="parentRequestId"><option value="">Select your existing request</option>${parentOptions}</select></label>
            </div>
            <div class="panel-head section-gap"><div><p class="eyebrow">Step 3</p><h2>Event and Sub-event</h2><p>Only approved, active source records are available.</p></div></div>
            <div class="public-form-grid">
              <label data-event-series-autocomplete-wrap hidden>Event autocomplete<input type="search" data-event-series-autocomplete list="requestEventSeriesSuggestions" autocomplete="off" aria-autocomplete="list" aria-controls="requestEventSeries"><small>Type an approved Event name, then confirm it in the Event selector.</small><datalist id="requestEventSeriesSuggestions">${portal.eventSeries.map((event) => `<option value="${escapeHtml(event.name)}"></option>`).join('')}</datalist></label>
              <label>Event<select id="requestEventSeries" name="eventSeriesId" required><option value="">Select Event</option>${portal.eventSeries.map((event) => option(event.id, event.name)).join('')}</select></label>
              <label data-event-autocomplete-wrap hidden>Sub-event autocomplete<input type="search" data-event-autocomplete list="requestEventSuggestions" autocomplete="off" aria-autocomplete="list" aria-controls="requestEvent"><small>Type an approved Sub-event name, then confirm it in the Sub-event selector.</small><datalist id="requestEventSuggestions"></datalist></label>
              <label>Sub-event<select id="requestEvent" name="eventId" required disabled><option value="">Select Event first</option></select></label>
            </div>
            <div class="panel-head section-gap"><div><p class="eyebrow">Step 4</p><h2>Requested venues, logistics, and equipment</h2><p>Every item begins For Review. Availability is non-binding and submission makes no reservation or stock movement.</p></div></div>
            <div class="public-form-grid request-line-composer">
              <label class="span-2">Purpose / need<textarea name="purpose" maxlength="500" required></textarea></label>
              <label>Category<select name="lineCategory">${categoryOptions}</select></label>
              <label>Approved item<select name="lineChoice"></select></label>
              <label data-custom-name hidden>Custom item name<input name="lineCustomName" maxlength="240"></label>
              <label>Quantity<input name="lineQuantity" type="number" min="1" max="100000" step="1" value="1"></label>
              <label>Unit<select name="lineUnit">${unitOptions}</select></label>
              <label class="span-2">Optional note / specifications<textarea name="lineSpecification" maxlength="1000"></textarea></label>
              <button class="secondary" type="button" data-add-request-line>Add requested item</button>
            </div>
            <div class="request-center-draft" aria-live="polite">${draft.length ? '' : '<p class="empty">No requested items added.</p>'}</div>
            <label class="public-check"><input name="dataUseAcknowledged" type="checkbox" required><span><strong>Privacy and acceptable use</strong><small>I read the Privacy Notice and Acceptable Use terms and confirm this authorized department request is accurate.</small></span></label>
            <p class="borrower-form-message" role="status" aria-live="polite"></p>
            <button class="primary" type="submit" ${draft.length ? '' : 'disabled'}>Submit request</button>
          </form>
        </section>
        <section data-center-panel="track" hidden>
          <section class="panel">
            <div class="panel-head"><div><h2>Track Existing Request</h2><p>Search is restricted to ${escapeHtml(portal.profile.displayName)}. No private tracking code is required.</p></div></div>
            <label>Request ID, Event, or Sub-event<input name="requestSearch" list="requestSuggestions" autocomplete="off"><datalist id="requestSuggestions">${trackOptions}</datalist></label>
            <div class="borrower-ticket-list" data-tracking-results></div>
          </section>
        </section>
        <section class="request-success panel" ${receipt ? '' : 'hidden'} aria-live="polite">
          <img class="request-success-logo brand-media" src="/brand/usc-logo" alt="" aria-hidden="true">
          <p class="eyebrow">Request committed</p><h2>Submitted successfully</h2>
          ${receipt ? `<dl><dt>Request ID</dt><dd><code>${escapeHtml(receipt.requestId)}</code></dd><dt>Type</dt><dd>${escapeHtml(receipt.requestType)}</dd><dt>Event</dt><dd>${escapeHtml(receipt.event)}</dd><dt>Sub-event</dt><dd>${escapeHtml(receipt.subEvent)}</dd><dt>Department</dt><dd>${escapeHtml(receipt.department)}</dd><dt>Submitted</dt><dd>${escapeHtml(formatDate(receipt.submittedAt))}</dd><dt>Status</dt><dd>For Review</dd></dl><p>This confirms submission only; it is not approval or a reservation.</p><div class="button-row"><button class="primary" type="button" data-view-receipt-status>View Request Status</button><button class="secondary" type="button" data-create-another>Create Another Request</button><button class="secondary" type="button" data-save-receipt>Save PDF Receipt</button></div>` : ''}
        </section>
        ${publicPolicyLinksMarkup()}
        ${publicPolicyDialogsMarkup()}
      </main>`;

    bindPublicPolicyDialogs(root);

    root.querySelector('[data-requester-logout]').addEventListener('click', logout);
    const form = root.querySelector('#requesterRequestForm');
    const message = form.querySelector('.borrower-form-message');
    const requestTypeInputs = [...form.elements.requestType];
    const parentWrap = form.querySelector('[data-parent-wrap]');
    const seriesSelect = form.elements.eventSeriesId;
    const eventSelect = form.elements.eventId;
    const seriesAutocompleteWrap = form.querySelector('[data-event-series-autocomplete-wrap]');
    const seriesAutocomplete = form.querySelector('[data-event-series-autocomplete]');
    const eventAutocompleteWrap = form.querySelector('[data-event-autocomplete-wrap]');
    const eventAutocomplete = form.querySelector('[data-event-autocomplete]');
    const eventSuggestions = form.querySelector('#requestEventSuggestions');
    const categorySelect = form.elements.lineCategory;
    const choiceSelect = form.elements.lineChoice;
    const customWrap = form.querySelector('[data-custom-name]');
    const draftRoot = form.querySelector('.request-center-draft');

    const syncRequestType = () => {
      const additional = form.elements.requestType.value === 'ADDITIONAL';
      parentWrap.hidden = !additional;
      form.elements.parentRequestId.required = additional;
    };
    requestTypeInputs.forEach((input) => input.addEventListener('change', syncRequestType));
    syncRequestType();

    seriesAutocompleteWrap.hidden = portal.eventSeries.length <= autocompleteThreshold;

    const selectAutocompleteMatch = (input, select, records) => {
      const normalized = input.value.trim().toLocaleLowerCase();
      const match = records.find(
        (record) =>
          record.name.toLocaleLowerCase() === normalized || record.id.toLocaleLowerCase() === normalized,
      );
      if (!match) return;
      select.value = match.id;
      select.dispatchEvent(new Event('change', { bubbles: true }));
    };

    const syncEvents = () => {
      const available = portal.events.filter((event) => event.seriesId === seriesSelect.value);
      eventSelect.innerHTML = `<option value="">${available.length ? 'Select Sub-event' : 'No approved Sub-events'}</option>${available.map((event) => option(event.id, event.name)).join('')}`;
      eventSelect.disabled = !available.length;
      eventSuggestions.innerHTML = available
        .map((event) => `<option value="${escapeHtml(event.name)}"></option>`)
        .join('');
      eventAutocompleteWrap.hidden = available.length <= autocompleteThreshold;
      eventAutocomplete.value = '';
      seriesAutocomplete.value = seriesSelect.selectedOptions[0]?.textContent ?? '';
    };
    seriesSelect.addEventListener('change', syncEvents);
    eventSelect.addEventListener('change', () => {
      eventAutocomplete.value = eventSelect.selectedOptions[0]?.value
        ? eventSelect.selectedOptions[0].textContent
        : '';
    });
    seriesAutocomplete.addEventListener('input', () =>
      selectAutocompleteMatch(seriesAutocomplete, seriesSelect, portal.eventSeries),
    );
    eventAutocomplete.addEventListener('input', () => {
      const available = portal.events.filter((event) => event.seriesId === seriesSelect.value);
      selectAutocompleteMatch(eventAutocomplete, eventSelect, available);
    });

    const syncChoices = () => {
      const custom = categorySelect.value === 'Other';
      customWrap.hidden = !custom;
      form.elements.lineCustomName.required = false;
      choiceSelect.closest('label').hidden = custom;
      choiceSelect.required = false;
      choiceSelect.innerHTML = custom
        ? ''
        : `<option value="">Select approved item</option>${portal.choices[categorySelect.value].map((name) => option(name)).join('')}`;
    };
    categorySelect.addEventListener('change', syncChoices);
    syncChoices();

    const renderDraft = () => {
      draftRoot.innerHTML =
        draft
          .map(
            (line, index) =>
              `<article class="borrower-ticket"><div><strong>${escapeHtml(line.description)}</strong><small>${escapeHtml(line.category)} · ${escapeHtml(line.quantity)} ${escapeHtml(line.unit)}${line.specification ? ` · ${escapeHtml(line.specification)}` : ''}</small></div><button class="danger mini" type="button" data-remove-line="${index}">Remove</button></article>`,
          )
          .join('') || '<p class="empty">No requested items added.</p>';
      form.querySelector('button[type="submit"]').disabled = !draft.length;
      draftRoot.querySelectorAll('[data-remove-line]').forEach((button) =>
        button.addEventListener('click', () => {
          draft.splice(Number(button.dataset.removeLine), 1);
          renderDraft();
        }),
      );
    };
    renderDraft();

    form.querySelector('[data-add-request-line]').addEventListener('click', () => {
      const category = categorySelect.value;
      const custom = category === 'Other';
      const description = String(custom ? form.elements.lineCustomName.value : choiceSelect.value).trim();
      const quantity = Number(form.elements.lineQuantity.value);
      const unit = form.elements.lineUnit.value;
      if (!description || !Number.isInteger(quantity) || quantity <= 0 || !unit) {
        message.textContent = 'Choose or name an item, then enter a whole-number quantity and unit.';
        return;
      }
      if (
        draft.some(
          (line) =>
            line.category.toLowerCase() === category.toLowerCase() &&
            line.description.toLowerCase() === description.toLowerCase(),
        )
      ) {
        message.textContent = 'That requested item is already in this request.';
        return;
      }
      draft.push({
        category,
        description,
        custom,
        quantity,
        unit,
        specification: String(form.elements.lineSpecification.value).trim(),
      });
      form.elements.lineCustomName.value = '';
      form.elements.lineChoice.value = '';
      form.elements.lineSpecification.value = '';
      message.textContent = `${description} added for review.`;
      renderDraft();
    });

    form.addEventListener('submit', async (event) => {
      event.preventDefault();
      const submit = form.querySelector('button[type="submit"]');
      submit.disabled = true;
      message.textContent = 'Submitting…';
      const values = new FormData(form);
      try {
        receipt = await client.request('/api/portal/request', {
          body: {
            requestType: values.get('requestType'),
            parentRequestId: values.get('parentRequestId'),
            eventSeriesId: values.get('eventSeriesId'),
            eventId: values.get('eventId'),
            purpose: values.get('purpose'),
            lines: draft,
            clientRequestId: requestKey('department-request'),
          },
          csrfToken: session.csrfToken,
        });
        draft = [];
        await load();
        render();
        root.querySelector('.request-success').scrollIntoView({ behavior: 'smooth' });
      } catch (error) {
        message.textContent = error.message;
        submit.disabled = false;
      }
    });

    const renderTracking = (query = '') => {
      const normalized = query.trim().toLowerCase();
      const matches = portal.requests.filter((request) =>
        [request.id, request.event, request.subEvent].some((value) =>
          value.toLowerCase().includes(normalized),
        ),
      );
      const output = root.querySelector('[data-tracking-results]');
      output.innerHTML =
        matches.map((request) => requestCard(request, { expanded: request.id === openRequestId })).join('') ||
        '<p class="empty">No matching request exists for this department.</p>';
      output.querySelectorAll('[data-view-request]').forEach((button) =>
        button.addEventListener('click', () => {
          openRequestId = openRequestId === button.dataset.viewRequest ? '' : button.dataset.viewRequest;
          renderTracking(root.querySelector('[name="requestSearch"]').value);
        }),
      );
      output.querySelectorAll('[data-additional-for]').forEach((button) =>
        button.addEventListener('click', () => {
          const parent = portal.requests.find(
            (request) => (request.parentRequestId || request.id) === button.dataset.additionalFor,
          );
          root.querySelector('[data-center-tab="create"]').click();
          form.elements.requestType.value = 'ADDITIONAL';
          syncRequestType();
          form.elements.parentRequestId.value = button.dataset.additionalFor;
          if (parent) {
            seriesSelect.value = parent.eventSeriesId;
            syncEvents();
            eventSelect.value = parent.eventId;
          }
          form.scrollIntoView({ behavior: 'smooth' });
        }),
      );
      output.querySelectorAll('[data-cancel-request]').forEach((button) =>
        button.addEventListener('click', async () => {
          button.disabled = true;
          try {
            await client.request('/api/portal/request/cancel', {
              body: {
                requestId: button.dataset.cancelRequest,
                clientRequestId: requestKey('requester-cancel'),
              },
              csrfToken: session.csrfToken,
            });
            await load();
            render();
          } finally {
            button.disabled = false;
          }
        }),
      );
    };
    const search = root.querySelector('[name="requestSearch"]');
    search.addEventListener('input', () => renderTracking(search.value));
    renderTracking();

    root.querySelectorAll('[data-center-tab]').forEach((button) =>
      button.addEventListener('click', () => {
        root.querySelectorAll('[data-center-tab]').forEach((tab) => {
          const active = tab === button;
          tab.classList.toggle('active', active);
          tab.setAttribute('aria-selected', String(active));
        });
        root.querySelectorAll('[data-center-panel]').forEach((panel) => {
          panel.hidden = panel.dataset.centerPanel !== button.dataset.centerTab;
        });
      }),
    );
    root.querySelector('[data-view-receipt-status]')?.addEventListener('click', () => {
      openRequestId = receipt.requestId;
      root.querySelector('[data-center-tab="track"]').click();
      search.value = receipt.requestId;
      renderTracking(search.value);
      search.focus();
    });
    root.querySelector('[data-create-another]')?.addEventListener('click', () => {
      receipt = null;
      render();
    });
    root.querySelector('[data-save-receipt]')?.addEventListener('click', () => downloadReceipt(receipt));
  };

  try {
    await load();
    render();
  } catch (error) {
    root.innerHTML = `<section class="auth-card"><h1>Request Center is unavailable</h1><p class="auth-intro">${escapeHtml(error.message)}</p><button class="primary" type="button" data-requester-logout>Sign out</button></section>`;
    root.querySelector('[data-requester-logout]').addEventListener('click', logout);
  }
}
