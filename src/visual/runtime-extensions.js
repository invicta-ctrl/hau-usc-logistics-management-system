import '../styles/visual/runtime-extensions.css';
import { config } from '../app/config.js';
import {
  evaluateLendingEligibility,
  lendingAudienceLabel,
  normalizeHandling,
  rankLendingItems,
  validateLendingSelection,
} from '../domain/circulation-policy.js';
import {
  buildCatalogUpdateCommand,
  canManageCatalog,
  validateCatalogDraft,
} from '../domain/catalog-management.js';
import { createRevisionPoller, normalizeRevisionPayload, revisionChanged } from '../app/revision-sync.js';
import { foodAttentionFlags, normalizeFoodDetails, updateFoodWorkflow } from '../domain/food-workflow.js';

const esc = (value) =>
  String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

const option = (value, label, selected) =>
  `<option value="${esc(value)}" ${String(value) === String(selected) ? 'selected' : ''}>${esc(label)}</option>`;

const statusText = {
  synced: 'Live · synced just now',
  checking: 'Checking for updates',
  'updates-available': 'Updates available',
  offline: 'Offline',
  delayed: 'Sync delayed',
};

function localDueValue(days) {
  const due = new Date(Date.now() + Number(days || 3) * 86_400_000);
  due.setHours(17, 0, 0, 0);
  const pad = (value) => String(value).padStart(2, '0');
  return `${due.getFullYear()}-${pad(due.getMonth() + 1)}-${pad(due.getDate())}T${pad(due.getHours())}:${pad(due.getMinutes())}`;
}

function createLendingController({ markFormClean }) {
  const original = document.querySelector('#lendingItem');
  if (!original) return null;
  const originalLabel = original.closest('label');
  const field = document.createElement('div');
  field.className = [originalLabel.className, 'field'].filter(Boolean).join(' ');
  field.innerHTML = `<label for="lendingItemSearch">Item</label>
    <div class="autocomplete lending-autocomplete">
      <div class="lending-search-row">
        <input id="lendingItemSearch" type="text" autocomplete="off" role="combobox" aria-autocomplete="list" aria-expanded="false" aria-controls="lendingAutocomplete" placeholder="Search item name, Item ID, alias, category, stock area, handling, or unit">
        <button id="clearLendingItem" class="ghost mini" type="button" aria-label="Clear selected lending item">Clear</button>
      </div>
      <input id="lendingItem" name="itemId" type="hidden">
      <div id="lendingAutocomplete" class="autocomplete-panel lending-suggestions" role="listbox"></div>
      <div id="lendingSelectedItem" class="selected-item-summary" aria-live="polite">No inventory item selected.</div>
    </div>`;
  originalLabel.replaceWith(field);
  const form = document.querySelector('#lendingForm');
  const input = document.querySelector('#lendingItemSearch');
  const hidden = document.querySelector('#lendingItem');
  const listbox = document.querySelector('#lendingAutocomplete');
  const summary = document.querySelector('#lendingSelectedItem');
  const clearButton = document.querySelector('#clearLendingItem');
  let items = [];
  let results = [];
  let activeIndex = -1;
  let selectedName = '';

  const borrowerType = () => form.elements.borrowerType.value;
  const quantity = () => Number(form.elements.quantity.value || 1);
  const selectedItem = () => items.find((item) => item.id === hidden.value) ?? null;
  const eligibilityFor = (item) =>
    evaluateLendingEligibility(item, {
      borrowerType: borrowerType(),
      quantity: quantity(),
    });
  const close = () => {
    listbox.classList.remove('show');
    input.setAttribute('aria-expanded', 'false');
    input.removeAttribute('aria-activedescendant');
    activeIndex = -1;
  };
  const updateActive = () => {
    listbox.querySelectorAll('[role="option"]').forEach((element, index) => {
      const active = index === activeIndex;
      element.classList.toggle('active', active);
      element.setAttribute('aria-selected', active ? 'true' : 'false');
    });
    if (activeIndex >= 0) {
      input.setAttribute('aria-activedescendant', `lending-suggestion-${activeIndex}`);
      listbox.querySelector(`#lending-suggestion-${activeIndex}`)?.scrollIntoView({ block: 'nearest' });
    }
  };
  const clear = ({ keepQuery = false } = {}) => {
    hidden.value = '';
    selectedName = '';
    if (!keepQuery) input.value = '';
    summary.textContent = 'No inventory item selected.';
    hidden.dispatchEvent(new Event('change', { bubbles: true }));
    close();
  };
  const select = (item) => {
    const eligibility = eligibilityFor(item);
    if (!eligibility.selectable) return;
    hidden.value = item.id;
    selectedName = item.name;
    input.value = item.name;
    summary.innerHTML = `<strong>${esc(item.name)}</strong><br><code>${esc(item.id)}</code> · ${esc(item.category)} · ${esc(item.unit)}<br>${esc(lendingAudienceLabel(item.lendingAudience))}`;
    hidden.dispatchEvent(new Event('change', { bubbles: true }));
    close();
  };
  const renderResults = () => {
    const query = input.value.trim();
    if (!query) {
      close();
      return;
    }
    results = rankLendingItems(items, query, 10);
    activeIndex = -1;
    if (!results.length) {
      listbox.innerHTML = `<div class="lending-no-match"><strong>No available inventory item matches “${esc(query)}”.</strong><br>Check the item name, aliases, or contact the Inventory Committee.</div>`;
    } else {
      listbox.innerHTML = results
        .map((item, index) => {
          const eligibility = eligibilityFor(item);
          return `<div id="lending-suggestion-${index}" class="suggestion ${eligibility.selectable ? '' : 'disabled'}" role="option" aria-selected="false" aria-disabled="${eligibility.selectable ? 'false' : 'true'}" data-lending-item="${esc(item.id)}">
          <strong>${esc(item.name)}</strong>
          <code>${esc(item.id)} · ${esc(item.category)} · ${esc(normalizeHandling(item.handlingCode || item.handling).replaceAll('_', ' '))} · ${esc(item.unit)}</code>
          <span class="stock"><b>${esc(eligibility.message)}</b>${esc(lendingAudienceLabel(item.lendingAudience))}</span>
        </div>`;
        })
        .join('');
    }
    listbox.classList.add('show');
    input.setAttribute('aria-expanded', 'true');
  };
  const rerank = () => {
    if (listbox.classList.contains('show')) renderResults();
    const item = selectedItem();
    if (item) select(item);
  };
  const renderAvailability = () => {
    const item = selectedItem();
    const availability = document.querySelector('#lendingAvailability');
    const dueWrap = document.querySelector('#lendingDueWrap');
    const due = form.elements.dueAt;
    if (!item) {
      availability.innerHTML =
        'Search for an inventory item and choose an actual suggestion. Typed text alone is not a valid selection.';
      dueWrap.classList.add('hidden');
      due.required = false;
      return;
    }
    const eligibility = eligibilityFor(item);
    availability.innerHTML = `<strong>${esc(item.name)}</strong><br>${esc(eligibility.message)} · ${esc(lendingAudienceLabel(item.lendingAudience))}`;
    dueWrap.classList.toggle('hidden', !eligibility.returnable);
    due.required = eligibility.returnable;
    if (eligibility.returnable && !due.value) due.value = localDueValue(item.defaultLoanDays || 3);
    if (!eligibility.returnable) due.value = '';
  };

  input.addEventListener('input', () => {
    if (hidden.value && input.value !== selectedName) clear({ keepQuery: true });
    renderResults();
  });
  input.addEventListener('focus', renderResults);
  input.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }
    if (!results.length) return;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      activeIndex = Math.min(results.length - 1, activeIndex + 1);
      updateActive();
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      activeIndex = Math.max(0, activeIndex - 1);
      updateActive();
    }
    if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault();
      select(results[activeIndex]);
    }
  });
  listbox.addEventListener('click', (event) => {
    const row = event.target.closest('[data-lending-item]');
    if (row) select(items.find((item) => item.id === row.dataset.lendingItem));
  });
  clearButton.addEventListener('click', () => clear());
  form.elements.borrowerType.addEventListener('change', () => {
    rerank();
    renderAvailability();
  });
  form.elements.quantity.addEventListener('input', () => {
    rerank();
    renderAvailability();
  });
  form.addEventListener('reset', () =>
    setTimeout(() => {
      clear();
      markFormClean(form);
    }, 0),
  );
  document.addEventListener('click', (event) => {
    if (!event.target.closest('.lending-autocomplete')) close();
  });

  return {
    setItems(nextItems) {
      items = nextItems ?? [];
      renderAvailability();
    },
    clear,
    selectedItem,
    renderAvailability,
    validate() {
      return validateLendingSelection(selectedItem(), {
        borrowerType: borrowerType(),
        quantity: quantity(),
        dueAt: form.elements.dueAt.value,
      });
    },
  };
}

function catalogFormHtml(item = null) {
  const create = !item;
  const current = item ?? {
    name: '',
    aliases: [],
    category: 'Office Supplies',
    catalogType: 'OFFICE_INVENTORY',
    stockArea: 'Inventory',
    storageLocation: 'TO_BE_ASSIGNED',
    handlingCode: 'NON_CIRCULATING',
    unit: 'piece',
    reorderThreshold: 0,
    lendingAudience: 'NOT_AVAILABLE_FOR_LENDING',
    defaultLoanDays: '',
    maximumLoanQuantity: 1,
    approvalRequired: true,
    status: 'ACTIVE',
    notes: '',
  };
  return `<form id="catalogItemForm">
    ${create ? '<div class="mode-note">New item IDs are generated by the server. Any initial quantity is posted as an append-only ledger movement.</div>' : `<div class="mode-note"><strong>${esc(current.id)}</strong> · On hand ${esc(current.onHand)} · Reserved ${esc(current.reserved)} · Available ${esc(current.availableToPromise)} ${esc(current.unit)}. Quantity and provenance are read-only here.</div>`}
    <div class="form-grid catalog-form-grid">
      <label class="span-2">Item name<input name="itemName" value="${esc(current.name)}" required></label>
      <label class="span-2">Aliases<input name="aliases" value="${esc((current.aliases ?? []).join(', '))}" placeholder="Comma-separated search aliases"></label>
      <label>Category<input name="category" value="${esc(current.category)}" required></label>
      <label>Catalog type<select name="catalogType">${option('OFFICE_INVENTORY', 'Office inventory', current.catalogType)}${option('PANTRY', 'Pantry', current.catalogType)}${option('EVENT_SPECIFIC', 'Event-specific', current.catalogType)}</select></label>
      <label>Stock area<input name="stockArea" value="${esc(current.stockArea)}" required></label>
      <label>Storage location<input name="storageLocation" value="${esc(current.storageLocation)}" required></label>
      <label>Handling<select name="handling">${option('CONSUMABLE', 'Consumable', current.handlingCode || current.handling)}${option('LOANABLE', 'Loanable', current.handlingCode || current.handling)}${option('REUSABLE_ASSET', 'Reusable Asset', current.handlingCode || current.handling)}${option('NON_CIRCULATING', 'Non-circulating', current.handlingCode || current.handling)}</select></label>
      <label>Unit<input name="unit" value="${esc(current.unit)}" required><small>Changing a historical unit is blocked by the server.</small></label>
      <label>Reorder threshold<input name="reorderThreshold" type="number" min="0" step="0.01" value="${esc(current.reorderThreshold ?? 0)}" required></label>
      <label>Lending audience<select name="lendingAudience">${option('NOT_AVAILABLE_FOR_LENDING', 'Not available in Lending Hub', current.lendingAudience)}${option('USC_STAFF_ONLY', 'USC officers and staff only', current.lendingAudience)}${option('STUDENTS_AND_STAFF', 'Students and USC staff', current.lendingAudience)}${option('DOL_INTERNAL_ONLY', 'Eligible DOL users only', current.lendingAudience)}</select></label>
      <label>Default loan days<input name="defaultLoanDays" type="number" min="1" step="1" value="${esc(current.defaultLoanDays ?? '')}"></label>
      <label>Maximum lending quantity<input name="maximumLoanQuantity" type="number" min="0.01" step="0.01" value="${esc(current.maximumLoanQuantity ?? '')}"></label>
      <label>Approval required<select name="approvalRequired">${option('true', 'Yes', String(current.approvalRequired))}${option('false', 'No', String(current.approvalRequired))}</select></label>
      <label>Active / verification status<select name="status">${option('ACTIVE', 'Active', current.status)}${option('VERIFY', 'Verification required', current.status)}${option('INACTIVE', 'Inactive', current.status)}</select></label>
      ${create ? '<label>Initial quantity<input name="initialQuantity" type="number" min="0" step="0.01" value="0"></label><label>Creation reason<input name="reason" value="Administrative catalog creation" required></label>' : ''}
      <label class="span-2">Notes<textarea name="notes">${esc(current.notes ?? '')}</textarea></label>
    </div>
    <button class="primary" type="submit">${create ? 'Create Inventory Item' : 'Save Item Settings'}</button>
  </form>`;
}

export function createRuntimeExtensions(options) {
  const {
    backendMode,
    services,
    getState,
    acceptState,
    commit,
    loadAuthoritativeState = (requestOnly) => services.loadBootstrapData({ requestOnly }),
    toast,
    openModal,
    closeModal,
    isRequestOnly,
    hasUnsavedRuntimeState = () => false,
  } = options;
  const dirtyForms = new Set();
  let acceptedRevision = normalizeRevisionPayload({ revision: getState()?.dataRevision });
  let pendingRevision = null;
  let refreshPromise = null;
  let syncIndicator = null;
  let updateBanner = null;
  let lending = null;
  let poller = null;
  let foodQueue = null;
  let foodQueueItems = null;
  let foodQueuePromise = null;

  const foodRequestsEnabled = config.foodRequestsEnabled === true;
  const foodFormPayload = () => {
    const form = document.querySelector('#compositeRequestForm');
    if (!form) return null;
    const toManilaIso = (value) => (value ? `${value}:00+08:00` : '');
    return {
      serviceClass: form.elements.foodServiceClass?.value,
      expectedHeadcount: form.elements.foodExpectedHeadcount?.value,
      requiredServings: form.elements.foodRequiredServings?.value,
      serviceStartAt: toManilaIso(form.elements.foodServiceStartAt?.value),
      serviceEndAt: toManilaIso(form.elements.foodServiceEndAt?.value),
      serviceLocation: form.elements.foodServiceLocation?.value,
      dietarySummary: form.elements.foodDietarySummary?.value,
      dietaryAttentionServings: form.elements.foodDietaryAttentionServings?.value,
      sourcingMode: form.elements.foodSourcingMode?.value,
      sourceReference: form.elements.foodSourceReference?.value,
    };
  };

  const installFoodWorkflow = () => {
    const section = document.querySelector('[data-composite-section="FOOD"]');
    const fields = section?.querySelector('[data-composite-fields]');
    const toggle = section?.querySelector('[data-composite-toggle]');
    if (!section || !fields || !toggle) return;
    if (!foodRequestsEnabled) {
      toggle.disabled = true;
      section.insertAdjacentHTML(
        'beforeend',
        '<p class="muted">Food specialization is disabled for new submissions.</p>',
      );
    }
    if (!fields.querySelector('[name="foodServiceClass"]')) {
      fields.insertAdjacentHTML(
        'beforeend',
        `<label>Service class<select name="foodServiceClass" required><option value="BULK_NON_PERISHABLE_OR_CATERING">Bulk / non-perishable / catering (10 business days)</option><option value="PERISHABLE_FOOD">Perishable food (5 business days)</option></select></label>
        <label>Expected headcount<input name="foodExpectedHeadcount" type="number" min="1" step="1" value="10" required></label>
        <label>Required servings<input name="foodRequiredServings" type="number" min="1" step="1" value="10" required></label>
        <label>Service start (Manila time)<input name="foodServiceStartAt" type="datetime-local" value="2026-08-08T12:00" required></label>
        <label>Service end (optional)<input name="foodServiceEndAt" type="datetime-local"></label>
        <label>Service location<input name="foodServiceLocation" maxlength="120" value="Event service area" required></label>
        <label>Dietary summary<select name="foodDietarySummary" required><option value="NONE_REPORTED">None reported</option><option value="ATTENTION_REQUIRED">Attention required (aggregate only)</option><option value="PENDING_CONFIRMATION">Pending confirmation</option></select></label>
        <label>Servings needing attention<input name="foodDietaryAttentionServings" type="number" min="0" step="1" value="0" required></label>
        <label>Sourcing mode<select name="foodSourcingMode" required><option value="PANTRY_STOCK_REVIEW">Pantry stock review</option><option value="CANVASS_REQUIRED">Canvass required</option><option value="APPROVED_EXTERNAL_SOURCE">Approved external source</option></select></label>
        <label>Source reference (no contacts or payment data)<input name="foodSourceReference" maxlength="120"></label>
        <p class="muted span-2">Aggregate counts only. Do not enter names, diagnoses, medical narratives, supplier contacts, TINs, or payment data.</p>`,
      );
    }
    const originalSubmit = services.submitCompositeRequest.bind(services);
    services.submitCompositeRequest = async (payload) => {
      const enriched = structuredClone(payload);
      const sectionDraft = enriched.sections?.find((entry) => entry.type === 'FOOD');
      let normalizedFood = null;
      if (sectionDraft) {
        if (!foodRequestsEnabled) throw new Error('Food request specialization is not enabled.');
        sectionDraft.food = foodFormPayload();
        const event = (getState()?.events ?? []).find((entry) => entry.id === enriched.eventId);
        enriched.submittedAt = new Date().toISOString();
        normalizedFood = normalizeFoodDetails(sectionDraft.food, {
          submittedAt: enriched.submittedAt,
          eventStartAt: event?.startAt,
          examWeeks: getState()?.examWeeks,
        });
      }
      const result = await originalSubmit(enriched);
      if (backendMode === 'mock' && normalizedFood) {
        const requestId = result.requestId || result.request?.requestId;
        const child = (getState()?.compositeComponents ?? []).find(
          (entry) => entry.requestId === requestId && entry.componentType === 'FOOD',
        );
        if (child) {
          child.payload = { notes: '', lines: child.lines ?? [], food: normalizedFood };
          child.attentionFlags = foodAttentionFlags(normalizedFood);
        }
        await refreshFoodQueue({ force: true });
      }
      return result;
    };
    if (!isRequestOnly() && canAccessFoodQueue()) {
      foodQueue = document.createElement('article');
      foodQueue.id = 'foodCommitteeQueue';
      foodQueue.className = 'panel section-gap';
      foodQueue.setAttribute('aria-labelledby', 'foodCommitteeQueueTitle');
      section.closest('#compositeRequestPanel')?.after(foodQueue);
      foodQueue.addEventListener('click', (event) => {
        const button = event.target.closest('[data-food-manage]');
        if (button) openFoodWorkflow(button.dataset.foodManage);
      });
      void refreshFoodQueue();
    }
  };

  const canAccessFoodQueue = () => {
    const user = getState()?.currentUser ?? {};
    const role = String(user.authorization?.roleId ?? user.role ?? '')
      .trim()
      .replace(/[\s-]+/g, '_')
      .toUpperCase();
    const capabilities = user.authorization?.capabilities ?? [];
    const mayReview =
      capabilities.includes('request.review') ||
      user.permissions?.review === true ||
      ['DOL_STAFF', 'COMMITTEE_HEAD', 'DIRECTOR'].includes(role) ||
      (backendMode === 'mock' && ['ADMIN', 'ADMINISTRATOR'].includes(role));
    if (!mayReview) return false;
    if (role === 'DIRECTOR' || (backendMode === 'mock' && ['ADMIN', 'ADMINISTRATOR'].includes(role)))
      return true;
    const committeeIds = user.authorization?.committeeIds ?? user.scopes?.committee ?? [];
    if (committeeIds.length) return committeeIds.includes('COM_FOOD');
    return backendMode === 'mock' && user.permissions?.review === true;
  };

  const localFoodQueue = () => {
    const state = getState();
    const parents = new Map(
      (state?.compositeRequests ?? []).map((parent) => [parent.requestId ?? parent.id, parent]),
    );
    return (state?.compositeComponents ?? [])
      .filter((child) => child.componentType === 'FOOD')
      .map((child) => {
        const parent = parents.get(child.requestId) ?? {};
        return {
          requestId: child.requestId,
          componentId: child.componentId ?? child.id,
          status: child.status,
          ownerCommitteeId: 'COM_FOOD',
          ownerUserId: child.ownerUserId ?? '',
          dueAt: child.dueAt ?? '',
          revision: Number(child.revision ?? 1),
          parent: {
            eventId: parent.eventId ?? parent.event?.id ?? '',
            eventName: parent.eventName ?? parent.event?.name ?? '',
            eventStartAt: parent.eventStartAt ?? parent.event?.startAt ?? '',
            priority: parent.priority ?? 'ROUTINE',
            purpose: parent.purpose ?? '',
            department: parent.department ?? parent.requester?.department ?? '',
          },
          food: child.payload?.food,
          attentionFlags: child.attentionFlags ?? [],
        };
      });
  };

  const installLocalFoodServices = () => {
    if (backendMode !== 'mock') return;
    services.getFoodWorkQueue ??= async () => ({ committeeId: 'COM_FOOD', items: localFoodQueue() });
    services.updateFoodComponent ??= async (command) => {
      const child = (getState()?.compositeComponents ?? []).find(
        (entry) =>
          entry.componentType === 'FOOD' &&
          entry.requestId === command.requestId &&
          (entry.componentId ?? entry.id) === command.componentId,
      );
      if (!child) throw new Error('Food component was not found.');
      if (['COMPLETED', 'REJECTED', 'CANCELLED'].includes(child.status))
        throw new Error('Terminal Food components cannot be updated.');
      if (Number(command.expectedRevision) !== Number(child.revision ?? 1))
        throw new Error('Food component changed; refresh before updating.');
      const food = updateFoodWorkflow(child.payload?.food, command.patch ?? {});
      child.payload = { ...(child.payload ?? {}), food };
      child.attentionFlags = foodAttentionFlags(food);
      child.revision = Number(child.revision ?? 1) + 1;
      child.updatedAt = new Date().toISOString();
      return {
        entityType: 'COMPOSITE_COMPONENT',
        entityId: command.componentId,
        requestId: command.requestId,
        componentId: command.componentId,
        revision: child.revision,
        food,
      };
    };
  };

  const refreshFoodQueue = async ({ force = false } = {}) => {
    if (!foodQueue || !canAccessFoodQueue() || typeof services.getFoodWorkQueue !== 'function') return;
    if (foodQueuePromise) return foodQueuePromise;
    if (!force && foodQueueItems !== null) return;
    foodQueuePromise = (async () => {
      const result = await services.getFoodWorkQueue();
      foodQueueItems = Array.isArray(result?.items) ? result.items : [];
      renderFoodQueue();
    })();
    try {
      await foodQueuePromise;
    } catch (error) {
      foodQueueItems = [];
      renderFoodQueue(error.message);
    } finally {
      foodQueuePromise = null;
    }
  };

  const renderFoodQueue = () => {
    if (!foodQueue) return;
    const items = foodQueueItems ?? [];
    foodQueue.innerHTML = `<div class="panel-head"><div><p class="eyebrow">Food Committee</p><h3 id="foodCommitteeQueueTitle">Scoped Food work queue</h3><p>Food children only; sibling payloads are not projected here.</p></div><span class="pill">${items.length} item${items.length === 1 ? '' : 's'}</span></div><div class="line-list">${items.map((item) => `<div class="request-line"><div><strong>${esc(item.componentId)}</strong><small>${esc(item.food?.serviceClass || 'Food')} · ${esc(item.food?.requiredServings || 0)} servings · ${esc(item.food?.sourcingStatus || 'PENDING')}</small></div><div class="request-line-actions"><span class="pill">${esc(item.status || 'FOR_REVIEW')}</span>${['COMPLETED', 'REJECTED', 'CANCELLED'].includes(item.status) ? '' : `<button class="secondary mini" type="button" data-food-manage="${esc(item.componentId)}">Manage</button>`}</div></div>`).join('') || '<div class="empty">No Food work is in the current authorized scope.</div>'}</div>`;
  };

  const openFoodWorkflow = (componentId) => {
    const item = (foodQueueItems ?? []).find((entry) => entry.componentId === componentId);
    if (!item) return;
    openModal(
      `Manage Food ${item.componentId}`,
      `<form id="foodWorkflowForm"><div class="mode-note">Aggregate dietary counts only. Do not enter names, diagnoses, contacts, TINs, or payment data.</div><div class="form-grid" style="margin-top:14px"><label>Dietary summary<select name="dietarySummary">${option('NONE_REPORTED', 'None reported', item.food?.dietarySummary)}${option('ATTENTION_REQUIRED', 'Attention required', item.food?.dietarySummary)}${option('PENDING_CONFIRMATION', 'Pending confirmation', item.food?.dietarySummary)}</select></label><label>Servings needing attention<input name="dietaryAttentionServings" type="number" min="0" step="1" value="${esc(item.food?.dietaryAttentionServings ?? 0)}" required></label><label>Sourcing status<select name="sourcingStatus">${option('PENDING_STOCK_REVIEW', 'Pending stock review', item.food?.sourcingStatus)}${option('PENDING_CANVASS', 'Pending canvass', item.food?.sourcingStatus)}${option('CONFIRMED', 'Confirmed', item.food?.sourcingStatus)}</select></label><label>Source reference<input name="sourceReference" maxlength="120" value="${esc(item.food?.sourceReference ?? '')}"></label><label class="span-2">Delivery proof (optional)<input name="deliveryProof" type="file" accept="image/jpeg,image/png,image/webp,application/pdf"><small>${item.food?.completionEvidenceId ? `Linked evidence: ${esc(item.food.completionEvidenceId)}` : 'Upload is required before completion.'}</small></label></div><button class="primary" type="submit">Save Food Workflow</button></form>`,
      (modal) => {
        const form = modal.querySelector('#foodWorkflowForm');
        form.addEventListener('submit', async (event) => {
          event.preventDefault();
          if (!form.reportValidity()) return;
          const button = form.querySelector('[type="submit"]');
          button.disabled = true;
          button.textContent = 'Saving…';
          try {
            const values = Object.fromEntries(new FormData(form).entries());
            let completionEvidenceId = item.food?.completionEvidenceId ?? '';
            const file = form.elements.deliveryProof.files?.[0];
            if (file) {
              if (typeof services.uploadEvidenceFile !== 'function')
                throw new Error('Evidence upload is unavailable.');
              const evidence = await services.uploadEvidenceFile(file, {
                evidenceType: 'DELIVERABLE_DELIVERY_PROOF',
                relatedEntityType: 'COMPOSITE_COMPONENT',
                relatedEntityId: item.componentId,
                requestId: item.requestId,
              });
              completionEvidenceId = evidence.id;
            }
            const result = await services.updateFoodComponent({
              requestId: item.requestId,
              componentId: item.componentId,
              expectedRevision: item.revision,
              patch: {
                dietarySummary: values.dietarySummary,
                dietaryAttentionServings: Number(values.dietaryAttentionServings),
                sourcingStatus: values.sourcingStatus,
                sourceReference: values.sourceReference,
                completionEvidenceId,
              },
              reason: 'Food workflow updated from the scoped queue',
              idempotencyKey: `food-update-${item.componentId}-${item.revision}`,
            });
            markFormClean(form);
            closeModal();
            await commit(`${item.componentId} Food workflow updated.`, 'success', result);
            await refreshFoodQueue({ force: true });
          } catch (error) {
            toast(`${error.message}${error.correlationId ? ` · ${error.correlationId}` : ''}`, true);
            button.disabled = false;
            button.textContent = 'Save Food Workflow';
          }
        });
      },
    );
  };

  const cleanDisconnectedForms = () => {
    for (const form of dirtyForms) if (!form.isConnected) dirtyForms.delete(form);
  };
  const isDirty = () => {
    cleanDisconnectedForms();
    return (
      dirtyForms.size > 0 ||
      document.querySelector('#modalBackdrop')?.classList.contains('show') ||
      hasUnsavedRuntimeState()
    );
  };
  const setSyncStatus = (status) => {
    if (!syncIndicator) return;
    syncIndicator.dataset.syncStatus = status;
    syncIndicator.textContent = statusText[status] ?? statusText.delayed;
  };
  const hideBanner = () => {
    if (updateBanner) updateBanner.hidden = true;
  };
  const showBanner = (message, { failure = false } = {}) => {
    if (!updateBanner) return;
    updateBanner.hidden = false;
    updateBanner.classList.toggle('sync-refresh-failure', failure);
    updateBanner.querySelector('[data-sync-message]').textContent = message;
    updateBanner.querySelector('[data-sync-continue]').hidden = failure;
    setSyncStatus(failure ? 'delayed' : 'updates-available');
  };
  const markFormClean = (form) => {
    if (form) dirtyForms.delete(form);
  };
  const markAllClean = () => {
    dirtyForms.clear();
  };
  const refreshAuthoritative = async (reason = 'manual') => {
    if (refreshPromise) return refreshPromise;
    refreshPromise = (async () => {
      setSyncStatus('checking');
      const next = await loadAuthoritativeState(isRequestOnly());
      acceptState(next);
      acceptedRevision = normalizeRevisionPayload({
        revision: next.dataRevision,
        updatedAt: next.dataRevisionUpdatedAt,
        environment: next.environment,
      });
      pendingRevision = null;
      markAllClean();
      hideBanner();
      setSyncStatus('synced');
      return { state: next, reason };
    })();
    try {
      return await refreshPromise;
    } finally {
      refreshPromise = null;
    }
  };

  const mockCatalogMutation = (kind, payload) => {
    const state = getState();
    const now = new Date().toISOString();
    if (kind === 'create') {
      const max = state.inventoryItems.reduce(
        (value, item) => Math.max(value, Number(String(item.id).match(/\d+$/)?.[0] || 0)),
        0,
      );
      const id = `ITM-${String(max + 1).padStart(4, '0')}`;
      const item = {
        id,
        name: payload.itemName,
        aliases: payload.aliases,
        category: payload.category,
        catalogType: payload.catalogType,
        stockArea: payload.stockArea,
        storageLocation: payload.storageLocation,
        handling: payload.handling,
        handlingCode: payload.handling,
        unit: payload.unit,
        openingOnHand: 0,
        reorderThreshold: payload.reorderThreshold,
        lendingAudience: payload.lendingAudience,
        defaultLoanDays: payload.defaultLoanDays,
        maximumLoanQuantity: payload.maximumLoanQuantity,
        approvalRequired: payload.approvalRequired,
        status: payload.status,
        notes: payload.notes,
        createdAt: now,
        updatedAt: now,
        createdBy: 'LOCAL_PREVIEW',
      };
      state.inventoryItems.push(item);
      if (Number(payload.initialQuantity) > 0)
        state.ledgerTransactions.push({
          id: `TXN-LOCAL-${Date.now()}`,
          type: 'OPENING_BALANCE',
          direction: 'IN',
          itemId: id,
          quantity: Number(payload.initialQuantity),
          unit: payload.unit,
          createdAt: now,
          createdBy: 'LOCAL_PREVIEW',
          notes: payload.reason,
        });
      return { id, itemId: id, correlationId: 'LOCAL-PREVIEW' };
    }
    const item = state.inventoryItems.find((candidate) => candidate.id === payload.itemId);
    if (!item) throw new Error('Inventory item was not found.');
    if (kind === 'update')
      Object.assign(item, {
        name: payload.itemName,
        aliases: payload.aliases,
        category: payload.category,
        catalogType: payload.catalogType,
        stockArea: payload.stockArea,
        storageLocation: payload.storageLocation,
        handling: payload.handling,
        handlingCode: payload.handling,
        unit: payload.unit,
        reorderThreshold: payload.reorderThreshold,
        lendingAudience: payload.lendingAudience,
        defaultLoanDays: payload.defaultLoanDays,
        maximumLoanQuantity: payload.maximumLoanQuantity,
        approvalRequired: payload.approvalRequired,
        status: payload.status,
        notes: payload.notes,
        updatedAt: now,
      });
    if (kind === 'storage')
      Object.assign(item, {
        stockArea: payload.stockArea,
        storageLocation: payload.storageLocation,
        updatedAt: now,
      });
    if (kind === 'archive') item.status = 'ARCHIVED';
    if (kind === 'restore') {
      item.status = 'ACTIVE';
      item.lendingAudience = 'USC_STAFF_ONLY';
    }
    return { id: item.id, itemId: item.id, status: item.status, correlationId: 'LOCAL-PREVIEW' };
  };

  const runCatalogMutation = async (kind, payload) => {
    if (backendMode === 'mock') return mockCatalogMutation(kind, payload);
    if (kind === 'create') return services.createInventoryItem(payload);
    if (kind === 'update') return services.updateInventoryItem(payload);
    if (kind === 'storage') return services.updateInventoryStorageContext(payload);
    if (kind === 'archive') return services.archiveInventoryItem(payload.itemId, payload);
    if (kind === 'restore') return services.restoreInventoryItem(payload.itemId, payload);
    throw new Error('Unsupported catalog mutation.');
  };

  const openCatalogForm = (item = null) => {
    openModal(item ? `View / Edit ${item.id}` : 'Create Inventory Item', catalogFormHtml(item), (modal) => {
      const form = modal.querySelector('#catalogItemForm');
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!form.reportValidity()) return;
        const draft = Object.fromEntries(new FormData(form).entries());
        const validation = validateCatalogDraft(draft);
        if (!validation.valid) {
          toast(validation.message, true);
          return;
        }
        const command = buildCatalogUpdateCommand(item?.id ?? '', draft);
        if (!item) {
          command.initialQuantity = Number(draft.initialQuantity || 0);
          command.reason = draft.reason;
        }
        const button = form.querySelector('[type="submit"]');
        button.disabled = true;
        button.textContent = 'Saving…';
        try {
          const result = await runCatalogMutation(item ? 'update' : 'create', command);
          markFormClean(form);
          closeModal();
          await commit(
            item ? `${item.id} catalog settings updated.` : `${result.id ?? result.itemId} created.`,
            'success',
            result,
          );
        } catch (error) {
          toast(`${error.message}${error.correlationId ? ` · ${error.correlationId}` : ''}`, true);
          button.disabled = false;
          button.textContent = item ? 'Save Item Settings' : 'Create Inventory Item';
        }
      });
    });
  };

  const mountSyncUi = () => {
    const requestOnly = isRequestOnly();
    if (requestOnly) return;
    const tools = document.querySelector(requestOnly ? '.portal-header' : '.app-header .header-tools');
    if (!tools || backendMode !== 'apps-script') return;
    syncIndicator = document.createElement('span');
    syncIndicator.id = 'syncIndicator';
    syncIndicator.className = 'sync-indicator';
    syncIndicator.setAttribute('role', 'status');
    syncIndicator.setAttribute('aria-live', 'polite');
    const refresh = document.createElement('button');
    refresh.id = 'refreshOperationalData';
    refresh.className = 'secondary';
    refresh.type = 'button';
    refresh.textContent = 'Refresh';
    const insertionPoint = requestOnly
      ? tools.querySelector('.preview-badge')
      : tools.querySelector('#resetDemo');
    tools.insertBefore(syncIndicator, insertionPoint);
    tools.insertBefore(refresh, insertionPoint);
    updateBanner = document.createElement('div');
    updateBanner.id = 'syncUpdateBanner';
    updateBanner.className = 'sync-update-banner';
    updateBanner.hidden = true;
    updateBanner.innerHTML =
      '<span data-sync-message>New operational data is available.</span><div class="button-row"><button class="primary mini" type="button" data-sync-refresh>Refresh now</button><button class="ghost mini" type="button" data-sync-continue>Continue editing</button></div>';
    document.querySelector(requestOnly ? '.portal-header' : '.app-header').after(updateBanner);
    refresh.addEventListener('click', () => {
      void poller?.check('manual');
    });
    updateBanner.querySelector('[data-sync-refresh]').addEventListener('click', async () => {
      try {
        await refreshAuthoritative('explicit-refresh');
      } catch (error) {
        showBanner(`Refresh failed. ${error.message}`, { failure: true });
      }
    });
    updateBanner.querySelector('[data-sync-continue]').addEventListener('click', () => {
      updateBanner.hidden = true;
      setSyncStatus('updates-available');
    });
    setSyncStatus(navigator.onLine ? 'synced' : 'offline');
  };

  const install = () => {
    installLocalFoodServices();
    installFoodWorkflow();
    if (!isRequestOnly()) lending = createLendingController({ markFormClean });
    mountSyncUi();
    const statusFilter = document.querySelector('#inventoryStatusFilter');
    if (statusFilter && !statusFilter.querySelector('[value="ARCHIVED"]'))
      statusFilter.insertAdjacentHTML('beforeend', '<option value="ARCHIVED">Archived</option>');
    const handlingFilter = document.querySelector('#inventoryHandlingFilter');
    if (handlingFilter && !handlingFilter.querySelector('[value="Reusable Asset"]'))
      handlingFilter.insertAdjacentHTML(
        'beforeend',
        '<option value="Reusable Asset">Reusable Asset</option><option value="Non Circulating">Non-circulating</option>',
      );
    document.addEventListener(
      'input',
      (event) => {
        const form = event.target.closest('form');
        if (form && !event.target.closest('[data-passive-sync]')) dirtyForms.add(form);
      },
      true,
    );
    document.addEventListener(
      'change',
      (event) => {
        const form = event.target.closest('form');
        if (form && !event.target.closest('[data-passive-sync]')) dirtyForms.add(form);
      },
      true,
    );
    document.addEventListener('reset', (event) => setTimeout(() => markFormClean(event.target), 0), true);
    afterRender();
  };

  const afterRender = () => {
    const stateRevision = normalizeRevisionPayload({
      revision: getState()?.dataRevision,
      updatedAt: getState()?.dataRevisionUpdatedAt,
      environment: getState()?.environment,
    });
    if (stateRevision.revision >= acceptedRevision.revision) acceptedRevision = stateRevision;
    lending?.setItems(getState()?.inventoryItems ?? []);
    const catalogButton = document.querySelector('#adminCatalogException');
    if (catalogButton) {
      const allowed = canManageCatalog(getState()?.currentUser);
      catalogButton.hidden = !allowed;
      catalogButton.disabled = !allowed;
      catalogButton.setAttribute('aria-hidden', String(!allowed));
    }
    renderFoodQueue();
  };

  const start = () => {
    if (isRequestOnly() || backendMode !== 'apps-script' || typeof services.getDataRevision !== 'function')
      return;
    poller = createRevisionPoller({
      readRevision: () => services.getDataRevision(),
      isVisible: () => document.visibilityState === 'visible',
      isOnline: () => navigator.onLine,
      onStatus: setSyncStatus,
      onRevision: async (incoming) => {
        if (!revisionChanged(acceptedRevision, incoming)) return true;
        pendingRevision = incoming;
        if (isDirty()) {
          showBanner('New operational data is available.');
          return false;
        }
        await refreshAuthoritative('poll');
        return true;
      },
    });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') void poller.resume('visible');
      else poller.pause('delayed');
    });
    window.addEventListener('focus', () => {
      void poller.resume('focus');
    });
    window.addEventListener('online', () => {
      setSyncStatus('checking');
      void poller.resume('online');
    });
    window.addEventListener('offline', () => poller.pause('offline'));
    poller.start();
  };

  return {
    install,
    start,
    afterRender,
    markFormClean,
    refreshAuthoritative,
    get lending() {
      return lending;
    },
    showRecordedRefreshFailure({ correlationId, error }) {
      const suffix = correlationId ? ` Correlation ID: ${correlationId}.` : '';
      showBanner(
        `The action was recorded, but the screen could not refresh.${suffix} Use Refresh now; do not submit the action again.${error?.message ? ` ${error.message}` : ''}`,
        { failure: true },
      );
    },
    inventoryActions(item) {
      const allowed = canManageCatalog(getState()?.currentUser);
      const catalog =
        allowed && item.status !== 'ARCHIVED'
          ? `<button class="secondary mini" data-inventory-action="edit" data-item-id="${esc(item.id)}">View / Edit</button>`
          : '';
      const lifecycle = allowed
        ? item.status === 'ARCHIVED'
          ? `<button class="secondary mini" data-inventory-action="restore" data-item-id="${esc(item.id)}">Restore Item</button>`
          : `<button class="danger mini" data-inventory-action="archive" data-item-id="${esc(item.id)}">Archive</button>`
        : '';
      const operational =
        item.status === 'ARCHIVED'
          ? ''
          : `<button class="ghost mini" data-inventory-action="restock" data-item-id="${esc(item.id)}">Restock</button><button class="ghost mini" data-inventory-action="context" data-item-id="${esc(item.id)}">Reserve / Release</button><button class="ghost mini" data-inventory-action="transfer" data-item-id="${esc(item.id)}">Transfer</button>`;
      return `${catalog}<button class="secondary mini" data-inventory-action="history" data-item-id="${esc(item.id)}">Ledger</button>${operational}${lifecycle}`;
    },
    openCatalogItem(itemId) {
      const item = getState().inventoryItems.find((candidate) => candidate.id === itemId);
      if (item) openCatalogForm(item);
    },
    openCreateCatalogItem() {
      openCatalogForm();
    },
    async updateStorage(payload) {
      const result = await runCatalogMutation('storage', payload);
      return commit(`${payload.itemId} storage context updated.`, 'success', result);
    },
    async archiveItem(itemId) {
      const result = await runCatalogMutation('archive', {
        itemId,
        reason: 'Archived from Inventory Management',
      });
      return commit(`${itemId} archived.`, 'success', result);
    },
    async restoreItem(itemId) {
      const result = await runCatalogMutation('restore', {
        itemId,
        reason: 'Restored from Inventory Management',
      });
      return commit(`${itemId} restored.`, 'success', result);
    },
    pendingRevision: () => pendingRevision,
  };
}
