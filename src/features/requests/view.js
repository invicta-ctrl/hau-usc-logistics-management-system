import { bindAutocomplete } from '../../components/autocomplete.js';
import { applyFieldErrors } from '../../components/inline-error.js';
import { openConfirmation } from '../../components/modal.js';
import { statusChip, escapeHtml } from '../../components/status-chip.js';
import { availableToPromise } from '../../domain/inventory.js';
import { consolidateDraftLines, routingDecision } from '../../domain/requests.js';
import { meetsLeadTime } from '../../domain/dates.js';
import { announce } from '../../app/events.js';
import { config } from '../../app/config.js';

const templateLines = {
  OFFICE: [
    {
      itemId: 'ITM-0001',
      description: 'Ballpen - Black',
      category: 'OFFICE_SUPPLIES',
      unit: 'piece',
      quantity: 20,
    },
  ],
  PANTRY: [
    {
      itemId: 'ITM-0005',
      description: 'Bottled Water - 350 ml',
      category: 'PANTRY_FOOD',
      unit: 'bottle',
      quantity: 48,
    },
  ],
  EVENT: [
    {
      itemId: 'ITM-0006',
      description: 'Masking Tape - 1 inch',
      category: 'EVENT_MATERIALS',
      unit: 'roll',
      quantity: 6,
    },
  ],
};

const compositeSections = [
  ['FOOD', 'Food', 'food'],
  ['MATERIALS', 'Materials', 'materials'],
  ['VENUE_EQUIPMENT', 'Venue & Equipment', 'venueEquipment'],
];

function foodFields(key) {
  return `<div class="form-grid span-2" data-food-fields><label>Service class<select name="${key}ServiceClass" required><option value="BULK_NON_PERISHABLE_OR_CATERING">Bulk / non-perishable / catering (10 business days)</option><option value="PERISHABLE_FOOD">Perishable food (5 business days)</option></select></label><label>Expected headcount<input name="${key}ExpectedHeadcount" type="number" min="1" step="1" value="10" required /></label><label>Required servings<input name="${key}RequiredServings" type="number" min="1" step="1" value="10" required /></label><label>Service start (Manila time)<input name="${key}ServiceStartAt" type="datetime-local" value="2026-08-08T12:00" required /></label><label>Service end (optional)<input name="${key}ServiceEndAt" type="datetime-local" /></label><label>Service location<input name="${key}ServiceLocation" maxlength="120" value="Event service area" required /></label><label>Dietary summary<select name="${key}DietarySummary" required><option value="NONE_REPORTED">None reported</option><option value="ATTENTION_REQUIRED">Attention required (aggregate only)</option><option value="PENDING_CONFIRMATION">Pending confirmation</option></select></label><label>Servings needing attention<input name="${key}DietaryAttentionServings" type="number" min="0" step="1" value="0" required /></label><label>Sourcing mode<select name="${key}SourcingMode" required><option value="PANTRY_STOCK_REVIEW">Pantry stock review</option><option value="CANVASS_REQUIRED">Canvass required</option><option value="APPROVED_EXTERNAL_SOURCE">Approved external source</option></select></label><label>Source reference (no contacts or payment data)<input name="${key}SourceReference" maxlength="120" /></label><p class="muted span-2">Use aggregate counts only. Do not enter names, diagnoses, medical narratives, supplier contacts, TINs, or payment data.</p></div>`;
}

function materialsFields(key) {
  return `<div class="form-grid span-2" data-materials-fields><label>Controlled category<select name="${key}MaterialCategory" required>${['OFFICE_SUPPLIES', 'PRINTING_SIGNAGE', 'EVENT_MATERIALS', 'CLEANING_SUPPLIES', 'OTHER_CONTROLLED'].map((category) => `<option value="${category}">${category.replaceAll('_', ' ')}</option>`).join('')}</select></label><label>Required by<input name="${key}RequiredBy" type="date" required /></label><label class="span-2">Exact specification<input name="${key}Specification" maxlength="500" placeholder="Enter the exact material specification" required /></label><label class="span-2">Usage / purpose<input name="${key}UsagePurpose" maxlength="500" placeholder="Describe the approved logistics use" required /></label><label>Sourcing preference<select name="${key}SourcingPreference" required><option value="STOCK_REVIEW">Review available stock</option><option value="PROCUREMENT_REQUIRED">Procurement required</option></select></label><p class="muted span-2">Exact-only is the default. The Materials Committee records one stock-issue or procurement-receipt path; substitutions require a recorded approval.</p></div>`;
}

function renderCompositeSection([type, title, key]) {
  if (type === 'FOOD' && !config.foodRequestsEnabled) return '';
  if (type === 'MATERIALS' && !config.materialsRequestsEnabled) return '';
  const units =
    type === 'MATERIALS'
      ? ['piece', 'box', 'pack', 'ream', 'roll', 'sheet', 'bottle', 'meter', 'kilogram', 'liter']
      : ['piece', 'box', 'pack', 'meal', 'service'];
  return `<fieldset class="panel inset" data-composite-section="${type}"><legend><label><input type="checkbox" name="${key}Enabled" value="${type}" data-composite-toggle /> ${title}</label></legend><div class="form-grid" data-composite-fields><label>Section label<input name="${key}Label" placeholder="Optional label" /></label><label>Line description<input name="${key}Line" placeholder="One minimal request line" /></label><label>Quantity<input name="${key}Quantity" type="number" min="0.01" step="0.01" value="1" /></label><label>Unit<select name="${key}Unit">${units.map((unit) => `<option>${unit}</option>`).join('')}</select></label>${type === 'FOOD' ? foodFields(key) : type === 'MATERIALS' ? materialsFields(key) : ''}</div></fieldset>`;
}

function renderCompositePanel(state) {
  if (!config.compositeRequestsEnabled) return '';
  const eventOptions = state.events
    .filter((event) => event.status === 'UPCOMING')
    .map((event) => `<option value="${event.id}">${escapeHtml(event.name)}</option>`)
    .join('');
  return `<section class="panel stack composite-request-panel" aria-labelledby="composite-request-title"><div class="panel-head"><div><p class="eyebrow">Composite event logistics</p><h2 id="composite-request-title">Review Food, Materials, and Venue &amp; Equipment together</h2><p>Each selected non-empty section becomes one independently trackable child under one parent request. Blank sections create no child.</p></div><span class="pill">Feature-flagged</span></div><form id="composite-request-form" novalidate><div class="form-grid"><label>Requester name<input name="compositeRequesterName" value="Preview Requester" required /></label><label>Department<input name="compositeDepartment" value="DOL - Preview Committee" required /></label><label>Event<select name="compositeEventId" required><option value="">Select an upcoming event</option>${eventOptions}</select></label><label>Purpose<input name="compositePurpose" value="Preview composite logistics request" required /></label></div><div class="composite-sections" data-composite-sections>${compositeSections.map(renderCompositeSection).join('')}</div><div class="button-row section-gap"><button class="primary" type="submit">Review composite request</button><span class="muted" data-composite-review aria-live="polite">Select at least one section.</span></div><div class="alert hidden" data-composite-result aria-live="polite"></div></form></section>`;
}

function compositeResultHtml(request) {
  if (!request) return '';
  const children = request.children ?? [];
  return `<strong>${escapeHtml(request.requestId ?? 'Composite request')} · ${escapeHtml(request.status ?? 'FOR_REVIEW')}</strong><ul>${children.map((child) => `<li><strong>${escapeHtml(child.componentType)}</strong> · ${escapeHtml(child.status)} · ${escapeHtml(child.componentId)}</li>`).join('')}</ul>`;
}

export function renderRequests(ctx) {
  const { state, ui, requestOnly } = ctx;
  const lines = ui.requestDraftLines ?? [];
  const internalQueue = requestOnly
    ? []
    : state.requests.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  return `<div class="view-grid"><section class="panel hero"><p class="eyebrow">Request Center</p><h2>Describe the need; the system proposes the fulfillment route.</h2><p>Submission creates <strong>For Review</strong>. It never deducts stock. “Ready to Release” means procurement is unnecessary—not that a physical handoff already occurred.</p></section>${renderCompositePanel(state)}
  <section class="split"><form id="request-form" class="panel stack" novalidate><div class="panel-head"><div><h2>New logistics request</h2><p>Preview-only submission with fixed demo events.</p></div><span class="pill">No writes</span></div><div class="form-grid"><label>Request type<select name="type"><option value="EVENT_LOGISTICS">Event Logistics</option><option value="CATALOG_RESTOCK">Catalog Restock</option></select></label><label>Request template<select name="template"><option value="">Start blank</option><option value="OFFICE">Common office needs</option><option value="PANTRY">Pantry restock</option><option value="EVENT">Recurring event materials</option></select></label><label>Event series<select name="eventSeriesId"><option value="">Select series</option>${state.eventSeries.map((series) => `<option value="${series.id}">${escapeHtml(series.name)}</option>`).join('')}</select></label><label>Approved sub-event<select name="eventId"><option value="">Select event</option>${state.events
    .filter((event) => event.status === 'UPCOMING')
    .map((event) => `<option value="${event.id}">${escapeHtml(event.name)}</option>`)
    .join(
      '',
    )}</select></label><label class="span-2">Additional request linked to<select name="originalRequestId"><option value="">Initial request</option>${internalQueue
    .filter((request) => request.type === 'EVENT_LOGISTICS')
    .map((request) => `<option value="${request.id}">${request.id} · ${escapeHtml(request.purpose)}</option>`)
    .join(
      '',
    )}</select></label><label>Date range starts<input name="dateStart" type="date" value="2026-07-25" required /></label><label>Date range ends<input name="dateEnd" type="date" value="2026-07-25" required /></label><label>Requester name<input name="requesterName" autocomplete="name" value="Preview Requester" required /></label><label>Group / department<input name="requesterGroup" value="DOL - Preview Committee" required /></label><label class="span-2">Purpose<textarea name="purpose" required>Preview logistics request for workflow validation.</textarea></label></div><div class="alert" data-lead-warning><div><strong>Lead-time check</strong><p>Choose the needed date and category to evaluate DOL business-week rules. Configured exam weeks are excluded.</p></div></div><hr /><div><p class="eyebrow">Item composer</p><div class="form-grid"><label class="span-2">Item / particular<div class="combobox"><input name="itemSearch" role="combobox" aria-autocomplete="list" aria-controls="request-item-listbox" aria-expanded="false" placeholder="Search Product ID, name, alias, category, area, or specification" /><div id="request-item-listbox" class="listbox hidden" role="listbox"></div></div><small data-selected-item>No exact catalog item selected; free text will never deduct inventory.</small></label><label>Quantity<input name="quantity" type="number" min="0.01" step="0.01" value="1" /></label><label>Unit<select name="unit">${['piece', 'box', 'pack', 'ream', 'roll', 'sheet', 'bottle', 'meter', 'kilogram', 'liter'].map((unit) => `<option>${unit}</option>`).join('')}</select></label><label>Controlled category<select name="category">${['OFFICE_SUPPLIES', 'PANTRY_FOOD', 'EQUIPMENT', 'PRINTING_SIGNAGE', 'EVENT_MATERIALS', 'CLEANING_SUPPLIES', 'OTHER_CONTROLLED'].map((category) => `<option>${category}</option>`).join('')}</select></label><label>Specification<input name="description" placeholder="Exact item/specification" /></label></div><button class="secondary section-gap" type="button" data-add-draft-line>Add item to review</button></div></form>
  <aside class="panel stack"><div class="panel-head"><div><h2>Request review</h2><p>Duplicate lines consolidate by item, unit, and route.</p></div><span class="pill">${lines.length} lines</span></div><div class="list" data-draft-lines>${lines.map((line, index) => `<div class="list-item"><span><strong>${escapeHtml(line.description)}</strong><small>${line.quantity} ${line.unit} · ${escapeHtml(line.decisionLabel)}</small></span><button class="ghost" type="button" data-remove-draft="${index}" aria-label="Remove ${escapeHtml(line.description)}">Remove</button></div>`).join('') || '<div class="empty-state"><h3>No request lines yet</h3><p>Use exact catalog selection for stock decisions, or enter a new controlled specification.</p></div>'}</div>${lines.length ? `<div class="sticky-mobile-submit"><strong>${lines.reduce((sum, line) => sum + Number(line.quantity), 0)} total requested quantity</strong><p class="muted">Stock is reserved only after staff acceptance.</p><button class="primary section-gap" type="submit" form="request-form">Submit for review</button></div>` : ''}</aside></section>
  ${requestOnly ? '' : `<section class="panel"><div class="panel-head"><div><h2>Review queue</h2><p>Accepting a request validates every line and commits all reservations together.</p></div><span class="pill">${internalQueue.length} requests</span></div><div class="list">${internalQueue.map((request) => `<article class="list-item"><span><div class="button-row">${statusChip(request.status)}<code>${request.id}</code></div><strong>${escapeHtml(request.purpose)}</strong><small>${escapeHtml(request.requesterName)} · ${request.dateStart} to ${request.dateEnd}</small></span>${request.status === 'FOR_REVIEW' ? `<button class="primary" type="button" data-accept-request="${request.id}">Accept & route</button>` : ''}</article>`).join('')}</div></section>`}</div>`;
}

export function mountRequests(ctx, root) {
  const compositeForm = root.querySelector('#composite-request-form');
  if (compositeForm) {
    const compositeFields = {
      FOOD: 'food',
      MATERIALS: 'materials',
      VENUE_EQUIPMENT: 'venueEquipment',
    };
    const syncCompositeReview = () => {
      const selected = [...root.querySelectorAll('[data-composite-toggle]:checked')].map((toggle) => {
        const key = compositeFields[toggle.value];
        const label = compositeForm.elements[`${key}Label`].value.trim();
        const line = compositeForm.elements[`${key}Line`].value.trim();
        return `${toggle.value}${label ? ` · ${label}` : ''}${line ? ` · ${line}` : ''}`;
      });
      root.querySelector('[data-composite-review]').textContent = selected.length
        ? `${selected.length} child section${selected.length === 1 ? '' : 's'} ready: ${selected.join(' | ')}`
        : 'Select at least one section.';
      root.querySelectorAll('[data-composite-section]').forEach((section) => {
        const toggle = section.querySelector('[data-composite-toggle]');
        section.querySelector('[data-composite-fields]').toggleAttribute('aria-hidden', !toggle.checked);
        section
          .querySelectorAll('[data-composite-fields] input, [data-composite-fields] select')
          .forEach((field) => {
            field.disabled = !toggle.checked;
          });
      });
    };
    root
      .querySelectorAll('[data-composite-toggle]')
      .forEach((toggle) => toggle.addEventListener('change', syncCompositeReview));
    root
      .querySelectorAll('[data-composite-fields] input, [data-composite-fields] select')
      .forEach((field) => field.addEventListener('input', syncCompositeReview));
    compositeForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      if (!compositeForm.reportValidity()) return;
      const sections = [...root.querySelectorAll('[data-composite-toggle]:checked')].map((toggle) => {
        const key = compositeFields[toggle.value];
        const section = {
          type: toggle.value,
          label: compositeForm.elements[`${key}Label`].value,
          lines: [
            {
              label: compositeForm.elements[`${key}Line`].value,
              quantity: compositeForm.elements[`${key}Quantity`].value,
              unit: compositeForm.elements[`${key}Unit`].value,
              ...(toggle.value === 'MATERIALS'
                ? { category: compositeForm.elements.materialsMaterialCategory.value }
                : {}),
            },
          ],
        };
        if (toggle.value === 'FOOD') {
          const toManilaIso = (value) => (value ? `${value}:00+08:00` : '');
          section.food = {
            serviceClass: compositeForm.elements.foodServiceClass.value,
            expectedHeadcount: compositeForm.elements.foodExpectedHeadcount.value,
            requiredServings: compositeForm.elements.foodRequiredServings.value,
            serviceStartAt: toManilaIso(compositeForm.elements.foodServiceStartAt.value),
            serviceEndAt: toManilaIso(compositeForm.elements.foodServiceEndAt.value),
            serviceLocation: compositeForm.elements.foodServiceLocation.value,
            dietarySummary: compositeForm.elements.foodDietarySummary.value,
            dietaryAttentionServings: compositeForm.elements.foodDietaryAttentionServings.value,
            sourcingMode: compositeForm.elements.foodSourcingMode.value,
            sourceReference: compositeForm.elements.foodSourceReference.value,
          };
        }
        if (toggle.value === 'MATERIALS') {
          section.materials = {
            materialCategory: compositeForm.elements.materialsMaterialCategory.value,
            specification: compositeForm.elements.materialsSpecification.value,
            requiredBy: compositeForm.elements.materialsRequiredBy.value,
            usagePurpose: compositeForm.elements.materialsUsagePurpose.value,
            sourcingPreference: compositeForm.elements.materialsSourcingPreference.value,
          };
        }
        return section;
      });
      try {
        const result = await ctx.service.submitCompositeRequest({
          requesterName: compositeForm.elements.compositeRequesterName.value,
          department: compositeForm.elements.compositeDepartment.value,
          eventId: compositeForm.elements.compositeEventId.value,
          purpose: compositeForm.elements.compositePurpose.value,
          sections,
          idempotencyKey: globalThis.crypto?.randomUUID?.() ?? `composite-${Date.now()}`,
          actor: compositeForm.elements.compositeRequesterName.value,
        });
        const resultBox = root.querySelector('[data-composite-result]');
        resultBox.classList.remove('hidden');
        resultBox.innerHTML = compositeResultHtml(result.request ?? result);
        ctx.toast(
          `${result.requestId} submitted with ${result.componentIds?.length ?? sections.length} child sections.`,
        );
        announce('Composite request submitted for review. Each selected section is independently trackable.');
        compositeForm.reset();
        syncCompositeReview();
      } catch (error) {
        ctx.toast(`${error.message}${error.correlationId ? ` Incident ${error.correlationId}` : ''}`, true);
      }
    });
    syncCompositeReview();
  }
  const form = root.querySelector('#request-form');
  const input = form.elements.itemSearch;
  const listbox = root.querySelector('#request-item-listbox');
  const inventory = ctx.state.inventoryItems.map((item) => ({
    ...item,
    searchText: [item.id, item.name, ...(item.aliases ?? []), item.category, item.area, item.specification]
      .join(' ')
      .toLowerCase(),
  }));
  bindAutocomplete({
    input,
    listbox,
    items: inventory,
    onSelect(item) {
      ctx.ui.selectedRequestItemId = item.id;
      input.value = item.name;
      form.elements.description.value = item.name;
      form.elements.unit.value = item.unit;
      form.elements.category.value = item.category;
      root.querySelector('[data-selected-item]').textContent =
        `${item.id} selected exactly · ${item.unit} · current preview stock decision will use this ID.`;
    },
  });
  form.elements.template.addEventListener('change', () => {
    const template = templateLines[form.elements.template.value];
    if (!template) return;
    ctx.ui.requestDraftLines = consolidateDraftLines([
      ...(ctx.ui.requestDraftLines ?? []),
      ...template.map((line) => ({
        ...line,
        decisionLabel: 'Template line; routing recalculated on acceptance',
      })),
    ]);
    ctx.renderActive();
  });
  form.elements.category.addEventListener('change', () => {
    const weeks =
      form.elements.category.value === 'PANTRY_FOOD'
        ? 2
        : form.elements.category.value === 'EVENT_MATERIALS'
          ? 3
          : 1;
    const result = meetsLeadTime({
      submittedOn: ctx.state.demoToday,
      neededOn: form.elements.dateStart.value,
      businessWeeks: weeks,
      examWeeks: ctx.state.examWeeks,
    });
    root.querySelector('[data-lead-warning]').innerHTML =
      `<div><strong>${result.compliant ? 'Lead time is compliant' : 'Lead-time risk detected'}</strong><p>${result.actualDays} eligible business days available; ${result.requiredDays} required${result.shortBy ? ` (${result.shortBy} short)` : ''}.</p></div>`;
  });
  root.querySelector('[data-add-draft-line]').addEventListener('click', () => {
    const itemId = ctx.ui.selectedRequestItemId ?? null;
    const quantity = Number(form.elements.quantity.value);
    if (!Number.isFinite(quantity) || quantity <= 0 || !form.elements.description.value.trim()) {
      applyFieldErrors(form, {
        quantity: 'Enter a positive quantity.',
        description: 'Enter an item specification.',
      });
      return;
    }
    const indexes = ctx.selectors.indexes(ctx.state);
    const available = itemId ? Math.max(0, availableToPromise(itemId, indexes)) : 0;
    const decision = routingDecision({
      selectedItemId: itemId,
      requestedQuantity: quantity,
      availableQuantity: available,
    });
    const labels = {
      FULL: 'Full stock match · issue from stock after approval',
      PARTIAL: `Partial match · ${decision.stockQuantity} stock + ${decision.procurementQuantity} procurement`,
      NONE: 'Known item · procurement required',
      NEW: 'New item · specification and canvass required',
    };
    ctx.ui.requestDraftLines = consolidateDraftLines([
      ...(ctx.ui.requestDraftLines ?? []),
      {
        itemId,
        description: form.elements.description.value.trim(),
        category: form.elements.category.value,
        unit: form.elements.unit.value,
        quantity,
        decisionLabel: labels[decision.kind],
      },
    ]);
    ctx.ui.selectedRequestItemId = null;
    ctx.renderActive();
  });
  root.querySelectorAll('[data-remove-draft]').forEach((button) =>
    button.addEventListener('click', () => {
      ctx.ui.requestDraftLines.splice(Number(button.dataset.removeDraft), 1);
      ctx.renderActive();
    }),
  );
  form.addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!(ctx.ui.requestDraftLines ?? []).length) {
      applyFieldErrors(form, { lines: 'Add at least one item.' });
      return;
    }
    const data = Object.fromEntries(new FormData(form));
    try {
      const result = await ctx.service.submitRequest({
        ...data,
        lines: ctx.ui.requestDraftLines,
        idempotencyKey: crypto.randomUUID(),
        actor: data.requesterName,
      });
      ctx.ui.requestDraftLines = [];
      ctx.toast(`${result.requestId} submitted for review.`);
      announce('Request submitted for review. No stock was deducted.');
    } catch (error) {
      applyFieldErrors(form, error.fieldErrors);
      ctx.toast(`${error.message} Incident ${error.correlationId}`, true);
    }
  });
  root.querySelectorAll('[data-accept-request]').forEach((button) =>
    button.addEventListener('click', () =>
      openConfirmation({
        title: `Accept ${button.dataset.acceptRequest}`,
        summary:
          'Every line will be routed using current availability. Required reservations commit together or the entire command rolls back.',
        effects: [
          'No physical stock deduction',
          'Active reservations for full/partial stock lines',
          'Procurement deliverables for unmet quantity',
          'Parent status derived from all child lines',
        ],
        confirmLabel: 'Accept and reserve safely',
        onConfirm: async () => {
          const result = await ctx.service.acceptRequest({
            requestId: button.dataset.acceptRequest,
            idempotencyKey: crypto.randomUUID(),
            actor: 'Preview DOL Staff',
          });
          ctx.toast(result.summary);
        },
      }),
    ),
  );
}
