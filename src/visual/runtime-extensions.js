import '../styles/visual/runtime-extensions.css';
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
import {
  createRevisionPoller,
  normalizeRevisionPayload,
  revisionChanged,
} from '../app/revision-sync.js';

const esc = (value) => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;');

const option = (value, label, selected) => (
  `<option value="${esc(value)}" ${String(value) === String(selected) ? 'selected' : ''}>${esc(label)}</option>`
);

const statusText = {
  synced: 'Live · synced just now',
  checking: 'Checking for updates',
  'updates-available': 'Updates available',
  offline: 'Offline',
  delayed: 'Sync delayed',
};

const canonicalRoadmap = [
  { title: 'Foundation', status: 'COMPLETED', progress: 100, highlight: 'The approved visual baseline, service boundary, and safety controls are established.', nextStep: 'Keep generated artifacts and live configuration behind reviewed release gates.', date: '2026-07-13' },
  { title: 'Inventory and Requests', status: 'IN_PROGRESS', progress: 90, highlight: 'Predictive catalog requests and append-only inventory controls are connected.', nextStep: 'Complete live workflow acceptance against designated staging data.', date: '2026-07-13' },
  { title: 'Lending and Release', status: 'IN_PROGRESS', progress: 80, highlight: 'Requester-safe ticket creation and controlled handoff/return workflows are prepared.', nextStep: 'Prove authorization, damage/loss accounting, and evidence in staging.', date: '2026-07-13' },
  { title: 'Procurement and Evidence', status: 'IN_PROGRESS', progress: 75, highlight: 'Canvass, receiving, registration, and evidence workflows retain linked history.', nextStep: 'Validate protected Drive routing and end-to-end audit evidence.', date: '2026-07-13' },
  { title: 'Public Portals', status: 'IN_PROGRESS', progress: 70, highlight: 'Request and lending entry points use purpose-specific sanitized data.', nextStep: 'Complete cross-requester privacy acceptance with separate identities.', date: '2026-07-13' },
  { title: 'Admin Console', status: 'IN_PROGRESS', progress: 45, highlight: 'Server-protected access, event, content, and branding hooks are surfaced.', nextStep: 'Finish live validation, conflict handling, and operational reports.', date: '2026-07-13' },
  { title: 'Production V1', status: 'NEXT', progress: 25, highlight: 'Runbooks, backups, rollback, and launch gates are defined.', nextStep: 'Obtain owner sign-off after staging workflow and security acceptance.', date: '2026-07-13' },
  { title: 'Future Hosted Platform', status: 'PLANNED', progress: 5, highlight: 'Stable IDs and adapter contracts preserve a future migration path.', nextStep: 'Re-evaluate hosting after production workload and governance evidence exist.', date: '2026-07-13' },
];

const fallbackChanges = [
  { title: 'Purpose-specific public portals', summary: 'Request and lending entry points receive only the fields needed for submission.', date: '2026-07-13' },
  { title: 'Safer operations review', summary: 'Staff can review requests, explain partial releases, and account for returned, damaged, or lost quantities.', date: '2026-07-13' },
  { title: 'Published V1 guidance', summary: 'Roadmap and release notes now use structured, plain-language content.', date: '2026-07-13' },
];

const unwrapResult = (result) => result?.data ?? result?.dashboard ?? result ?? {};

function permissionEnabled(user, permission) {
  const normalized = String(permission).toLowerCase().replace(/[^a-z]/g, '');
  const candidates = [
    user?.[permission],
    user?.[`can${permission[0].toUpperCase()}${permission.slice(1)}`],
    user?.permissions?.[permission],
    user?.permissions?.[`can${permission[0].toUpperCase()}${permission.slice(1)}`],
  ];
  for (const [key, value] of Object.entries(user?.permissions ?? {})) {
    if (key.toLowerCase().replace(/[^a-z]/g, '').endsWith(normalized)) candidates.push(value);
  }
  if (candidates.some((value) => value === true || String(value).toLowerCase() === 'true')) return true;
  return permission === 'admin' && ['ADMIN', 'DOL_DIRECTOR'].includes(String(user?.role ?? '').toUpperCase());
}

function readableDate(value) {
  if (!value) return 'Date not published';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return new Intl.DateTimeFormat('en-PH', { year: 'numeric', month: 'short', day: 'numeric' }).format(parsed);
}

const displayStatus = (value) => String(value || 'PLANNED')
  .toLowerCase()
  .replaceAll('_', ' ')
  .replace(/\b\w/g, (letter) => letter.toUpperCase());

function statusChip(value) {
  const normalized = String(value || 'PLANNED').toUpperCase();
  const color = normalized === 'COMPLETED' || normalized === 'PUBLISHED'
    ? 'green'
    : normalized === 'IN_PROGRESS' || normalized === 'NEXT'
      ? 'amber'
      : 'gray';
  return `<span class="status ${color}">${esc(displayStatus(normalized))}</span>`;
}

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
  const eligibilityFor = (item) => {
    const protectedAvailability = item?.availabilityProtected === true;
    const result = evaluateLendingEligibility(protectedAvailability
      ? { ...item, availableToPromise: Number.MAX_SAFE_INTEGER }
      : item, {
      borrowerType: borrowerType(),
      quantity: quantity(),
    });
    if (!protectedAvailability || !result.selectable) return result;
    if (result.state === 'quantity-restricted') return { ...result, available: null };
    const maximum = result.maximum == null ? '' : ` Maximum ${result.maximum} ${item.unit} per ticket.`;
    return {
      ...result,
      available: null,
      message: `Availability is confirmed by DOL during review.${maximum}`,
    };
  };
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
    if (!query) { close(); return; }
    results = rankLendingItems(items, query, 10);
    activeIndex = -1;
    if (!results.length) {
      listbox.innerHTML = `<div class="lending-no-match"><strong>No available inventory item matches “${esc(query)}”.</strong><br>Check the item name, aliases, or contact the Inventory Committee.</div>`;
    } else {
      listbox.innerHTML = results.map((item, index) => {
        const eligibility = eligibilityFor(item);
        return `<div id="lending-suggestion-${index}" class="suggestion ${eligibility.selectable ? '' : 'disabled'}" role="option" aria-selected="false" aria-disabled="${eligibility.selectable ? 'false' : 'true'}" data-lending-item="${esc(item.id)}">
          <strong>${esc(item.name)}</strong>
          <code>${esc(item.id)} · ${esc(item.category)} · ${esc(normalizeHandling(item.handlingCode || item.handling).replaceAll('_', ' '))} · ${esc(item.unit)}</code>
          <span class="stock"><b>${esc(eligibility.message)}</b>${esc(lendingAudienceLabel(item.lendingAudience))}</span>
        </div>`;
      }).join('');
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
      availability.innerHTML = 'Search for an inventory item and choose an actual suggestion. Typed text alone is not a valid selection.';
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
    if (event.key === 'Escape') { event.preventDefault(); close(); return; }
    if (!results.length) return;
    if (event.key === 'ArrowDown') { event.preventDefault(); activeIndex = Math.min(results.length - 1, activeIndex + 1); updateActive(); }
    if (event.key === 'ArrowUp') { event.preventDefault(); activeIndex = Math.max(0, activeIndex - 1); updateActive(); }
    if (event.key === 'Enter' && activeIndex >= 0) { event.preventDefault(); select(results[activeIndex]); }
  });
  listbox.addEventListener('click', (event) => {
    const row = event.target.closest('[data-lending-item]');
    if (row) select(items.find((item) => item.id === row.dataset.lendingItem));
  });
  clearButton.addEventListener('click', () => clear());
  form.elements.borrowerType.addEventListener('change', () => { rerank(); renderAvailability(); });
  form.elements.quantity.addEventListener('input', () => { rerank(); renderAvailability(); });
  form.addEventListener('reset', () => setTimeout(() => { clear(); markFormClean(form); }, 0));
  document.addEventListener('click', (event) => { if (!event.target.closest('.lending-autocomplete')) close(); });

  return {
    setItems(nextItems) { items = nextItems ?? []; renderAvailability(); },
    clear,
    selectedItem,
    renderAvailability,
    validate() {
      const item = selectedItem();
      const itemForValidation = item?.availabilityProtected
        ? { ...item, availableToPromise: Number.MAX_SAFE_INTEGER }
        : item;
      return validateLendingSelection(itemForValidation, {
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
    name: '', aliases: [], category: 'Office Supplies', catalogType: 'OFFICE_INVENTORY',
    stockArea: 'Inventory', storageLocation: 'TO_BE_ASSIGNED', handlingCode: 'NON_CIRCULATING',
    unit: 'piece', reorderThreshold: 0, lendingAudience: 'NOT_AVAILABLE_FOR_LENDING',
    defaultLoanDays: '', maximumLoanQuantity: 1, approvalRequired: true, status: 'ACTIVE', notes: '',
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
    toast,
    openModal,
    closeModal,
    isRequestOnly = () => false,
    getPortalMode = () => (isRequestOnly() ? 'request' : 'internal'),
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
  let adminData = null;
  let adminLoading = false;

  const portalMode = () => {
    const value = String(getPortalMode() || 'internal').toLowerCase();
    return ['internal', 'request', 'lending'].includes(value) ? value : 'internal';
  };
  const isPublicPortal = () => portalMode() !== 'internal';
  const bootstrapOptions = () => portalMode() === 'lending'
    ? { portalMode: 'lending', requestOnly: false, lendingOnly: true }
    : { requestOnly: portalMode() === 'request' };

  const cleanDisconnectedForms = () => {
    for (const form of dirtyForms) if (!form.isConnected) dirtyForms.delete(form);
  };
  const isDirty = () => {
    cleanDisconnectedForms();
    return dirtyForms.size > 0
      || document.querySelector('#modalBackdrop')?.classList.contains('show')
      || hasUnsavedRuntimeState();
  };
  const setSyncStatus = (status) => {
    if (!syncIndicator) return;
    syncIndicator.dataset.syncStatus = status;
    syncIndicator.textContent = statusText[status] ?? statusText.delayed;
  };
  const hideBanner = () => { if (updateBanner) updateBanner.hidden = true; };
  const showBanner = (message, { failure = false } = {}) => {
    if (!updateBanner) return;
    updateBanner.hidden = false;
    updateBanner.classList.toggle('sync-refresh-failure', failure);
    updateBanner.querySelector('[data-sync-message]').textContent = message;
    updateBanner.querySelector('[data-sync-continue]').hidden = failure;
    setSyncStatus(failure ? 'delayed' : 'updates-available');
  };
  const markFormClean = (form) => { if (form) dirtyForms.delete(form); };
  const markAllClean = () => { dirtyForms.clear(); };
  const refreshAuthoritative = async (reason = 'manual') => {
    if (refreshPromise) return refreshPromise;
    refreshPromise = (async () => {
      setSyncStatus('checking');
      const next = await services.loadBootstrapData(bootstrapOptions());
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
    try { return await refreshPromise; }
    finally { refreshPromise = null; }
  };

  const mockCatalogMutation = (kind, payload) => {
    const state = getState();
    const now = new Date().toISOString();
    if (kind === 'create') {
      const max = state.inventoryItems.reduce((value, item) => Math.max(value, Number(String(item.id).match(/\d+$/)?.[0] || 0)), 0);
      const id = `ITM-${String(max + 1).padStart(4, '0')}`;
      const item = {
        id, name: payload.itemName, aliases: payload.aliases, category: payload.category,
        catalogType: payload.catalogType, stockArea: payload.stockArea, storageLocation: payload.storageLocation,
        handling: payload.handling, handlingCode: payload.handling, unit: payload.unit, openingOnHand: 0,
        reorderThreshold: payload.reorderThreshold, lendingAudience: payload.lendingAudience,
        defaultLoanDays: payload.defaultLoanDays, maximumLoanQuantity: payload.maximumLoanQuantity,
        approvalRequired: payload.approvalRequired, status: payload.status, notes: payload.notes,
        createdAt: now, updatedAt: now, createdBy: 'LOCAL_PREVIEW',
      };
      state.inventoryItems.push(item);
      if (Number(payload.initialQuantity) > 0) state.ledgerTransactions.push({ id: `TXN-LOCAL-${Date.now()}`, type: 'OPENING_BALANCE', direction: 'IN', itemId: id, quantity: Number(payload.initialQuantity), unit: payload.unit, createdAt: now, createdBy: 'LOCAL_PREVIEW', notes: payload.reason });
      return { id, itemId: id, correlationId: 'LOCAL-PREVIEW' };
    }
    const item = state.inventoryItems.find((candidate) => candidate.id === payload.itemId);
    if (!item) throw new Error('Inventory item was not found.');
    if (kind === 'update') Object.assign(item, {
      name: payload.itemName, aliases: payload.aliases, category: payload.category,
      catalogType: payload.catalogType, stockArea: payload.stockArea, storageLocation: payload.storageLocation,
      handling: payload.handling, handlingCode: payload.handling, unit: payload.unit,
      reorderThreshold: payload.reorderThreshold, lendingAudience: payload.lendingAudience,
      defaultLoanDays: payload.defaultLoanDays, maximumLoanQuantity: payload.maximumLoanQuantity,
      approvalRequired: payload.approvalRequired, status: payload.status, notes: payload.notes, updatedAt: now,
    });
    if (kind === 'storage') Object.assign(item, { stockArea: payload.stockArea, storageLocation: payload.storageLocation, updatedAt: now });
    if (kind === 'archive') item.status = 'ARCHIVED';
    if (kind === 'restore') { item.status = 'ACTIVE'; item.lendingAudience = 'USC_STAFF_ONLY'; }
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
        if (!validation.valid) { toast(validation.message, true); return; }
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
          await commit(item ? `${item.id} catalog settings updated.` : `${result.id ?? result.itemId} created.`, 'success', result);
        } catch (error) {
          toast(`${error.message}${error.correlationId ? ` · ${error.correlationId}` : ''}`, true);
          button.disabled = false;
          button.textContent = item ? 'Save Item Settings' : 'Create Inventory Item';
        }
      });
    });
  };

  const accessibleFieldName = (field) => {
    const source = field.placeholder || field.name || field.id || field.type || 'field';
    return String(source).replace(/([a-z])([A-Z])/g, '$1 $2').replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
  };

  const labelUnlabelledFields = (root = document) => {
    root.querySelectorAll('input, select, textarea').forEach((field) => {
      if (field.type === 'hidden' || field.labels?.length || field.hasAttribute('aria-label') || field.hasAttribute('aria-labelledby')) return;
      field.setAttribute('aria-label', accessibleFieldName(field));
    });
  };

  const mountAccessibility = () => {
    const main = document.querySelector('.main');
    if (main) { main.id = 'mainWorkspace'; main.tabIndex = -1; }
    if (!document.querySelector('.skip-link')) {
      const skip = document.createElement('a');
      skip.className = 'skip-link';
      skip.href = '#mainWorkspace';
      skip.textContent = 'Skip to main content';
      document.body.prepend(skip);
    }
    const toastRegion = document.querySelector('#toast');
    toastRegion?.setAttribute('aria-atomic', 'true');
    document.querySelector('#loading')?.setAttribute('role', 'status');
    document.querySelector('#loading')?.setAttribute('aria-live', 'polite');
    document.addEventListener('keydown', (event) => {
      if (event.key !== 'Tab') return;
      const backdrop = document.querySelector('#drawerBackdrop.show');
      const drawer = backdrop?.querySelector('#drawer');
      if (!drawer) return;
      const focusable = [...drawer.querySelectorAll('button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])')]
        .filter((element) => !element.disabled && !element.hidden);
      if (!focusable.length) return;
      const first = focusable[0];
      const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }, true);
    labelUnlabelledFields();
  };

  const mountPortalUi = () => {
    const mode = portalMode();
    if (mode === 'internal') return;
    const header = document.querySelector('.portal-header');
    const title = header?.querySelector('strong');
    const subtitle = header?.querySelector('small');
    if (mode === 'lending') {
      if (title) title.textContent = 'HAU-USC Logistics Lending Hub';
      if (subtitle) subtitle.textContent = 'Submit a lending request and keep the receipt shown after submission';
      document.title = 'HAU-USC Lending Hub';
      const form = document.querySelector('#lendingForm');
      if (form && !document.querySelector('#publicLendingGuidance')) {
        form.insertAdjacentHTML('beforebegin', `<div id="publicLendingGuidance" class="public-portal-notice" role="note">
          <strong>Submission is safe; private history is unavailable here.</strong>
          <span>DOL confirms item availability and eligibility during review. Save the receipt ID after submitting. Student ID alone cannot retrieve or change a ticket.</span>
        </div>`);
      }
    } else {
      if (title) title.textContent = 'HAU-USC Logistics Request Center';
      if (subtitle) subtitle.textContent = 'Submit an event or catalog-restock request for DOL review';
      document.title = 'HAU-USC Request Center';
    }
  };

  const openRequestReview = (requestId, decision) => {
    const request = (getState()?.requests ?? []).find((row) => row.id === requestId);
    if (!request) return;
    const rejecting = decision === 'REJECT';
    openModal(`${rejecting ? 'Reject' : 'Accept'} ${request.id}`, `<form id="requestReviewForm">
      <div class="mode-note"><strong>${esc(request.displayName || request.eventName || request.id)}</strong><br>${esc(request.department || 'Department not supplied')} · ${esc(request.requesterName || 'Requester')}</div>
      <label style="margin-top:14px">${rejecting ? 'Rejection reason' : 'Review note'}<textarea name="note" ${rejecting ? 'required' : ''} placeholder="${rejecting ? 'Explain what must be corrected or why the request cannot proceed.' : 'Optional routing or fulfillment note.'}"></textarea></label>
      <button class="${rejecting ? 'danger' : 'primary'}" type="submit">${rejecting ? 'Reject Request' : 'Accept and Route Request'}</button>
    </form>`, (modal) => {
      const form = modal.querySelector('#requestReviewForm');
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!form.reportValidity()) return;
        const button = event.submitter || form.querySelector('[type="submit"]');
        button.disabled = true;
        button.textContent = rejecting ? 'Rejecting…' : 'Accepting…';
        try {
          const note = String(new FormData(form).get('note') || '').trim();
          const result = await services.reviewRequest(request.id, decision, note);
          markFormClean(form);
          closeModal();
          await commit(`Request ${request.id} ${rejecting ? 'rejected' : 'accepted and routed'}.`, 'success', result);
        } catch (error) {
          toast(`${error.message}${error.correlationId ? ` · ${error.correlationId}` : ''}`, true);
          button.disabled = false;
          button.textContent = rejecting ? 'Reject Request' : 'Accept and Route Request';
        }
      });
    });
  };

  const renderRequestReviewQueue = () => {
    const root = document.querySelector('#requestReviewQueue');
    if (!root) return;
    const state = getState() ?? {};
    const rows = (state.requests ?? [])
      .filter((request) => request.status === 'FOR_REVIEW')
      .sort((left, right) => new Date(left.createdAt || 0) - new Date(right.createdAt || 0));
    const lineRows = state.requestLines ?? [];
    root.querySelector('[data-review-count]').textContent = `${rows.length} awaiting review`;
    root.querySelector('[data-review-list]').innerHTML = rows.map((request) => {
      const lines = lineRows.filter((line) => line.requestId === request.id);
      const summary = lines.slice(0, 4).map((line) => `${line.description} (${line.quantity} ${line.unit})`).join(', ');
      return `<article class="request-line review-queue-card">
        <div><div class="button-row"><span class="status amber">For Review</span><span class="pill">${esc(request.id)}</span></div>
          <strong>${esc(request.displayName || request.eventName || (request.type === 'CATALOG_RESTOCK' ? 'Catalog Restock' : 'Event Logistics Request'))}</strong>
          <small>${esc(request.requesterName || 'Requester')} · ${esc(request.department || 'Department not supplied')} · ${esc(readableDate(request.createdAt))}</small>
          <small>${lines.length} line${lines.length === 1 ? '' : 's'}${summary ? ` · ${esc(summary)}` : ''}</small>
        </div>
        <div class="request-line-actions"><button class="primary mini" type="button" data-review-request="${esc(request.id)}" data-review-decision="ACCEPT">Accept and Route</button><button class="danger mini" type="button" data-review-request="${esc(request.id)}" data-review-decision="REJECT">Reject</button></div>
      </article>`;
    }).join('') || '<div class="empty">No newly submitted requests are waiting for staff review.</div>';
    labelUnlabelledFields(root);
  };

  const mountRequestReviewQueue = () => {
    if (portalMode() !== 'internal' || !permissionEnabled(getState()?.currentUser, 'review')) return;
    const requestForm = document.querySelector('#requestForm');
    if (!requestForm || document.querySelector('#requestReviewQueue')) return;
    requestForm.insertAdjacentHTML('beforebegin', `<section id="requestReviewQueue" class="panel request-review-queue" aria-labelledby="requestReviewTitle">
      <div class="panel-head"><div><h2 id="requestReviewTitle">New Requests Awaiting Review</h2><p>Accepting performs the authoritative stock/procurement routing. Submission alone never reserves or deducts stock.</p></div><span class="pill" data-review-count>0 awaiting review</span></div>
      <div class="line-list" data-review-list></div>
    </section>`);
    const root = document.querySelector('#requestReviewQueue');
    root.addEventListener('click', (event) => {
      const action = event.target.closest('[data-review-request]');
      if (action) openRequestReview(action.dataset.reviewRequest, action.dataset.reviewDecision);
    });
    renderRequestReviewQueue();
  };

  const normalizePublishedBlock = (block) => {
    if (!block || typeof block !== 'object') return block;
    let body = block.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch { body = null; }
    }
    if (Array.isArray(body)) return { ...block, items: body, entries: body };
    return body && typeof body === 'object' ? { ...block, ...body } : block;
  };

  const publishedBlock = (state, alias, key) => {
    const roots = [state?.publishedContent, state?.publicContent, state?.content];
    for (const root of roots) {
      if (!root) continue;
      if (!Array.isArray(root) && root[alias]) return normalizePublishedBlock(root[alias]);
      const rows = Array.isArray(root) ? root : root.items;
      const match = rows?.find((row) => [row.key, row.contentKey, row.Content_Key].includes(key));
      if (match) return normalizePublishedBlock(match);
    }
    return null;
  };

  const renderRoadmapAndChanges = () => {
    const roadmapRoot = document.querySelector('#roadmap');
    const overall = document.querySelector('#roadmapOverall');
    if (!roadmapRoot || !overall) return false;
    const state = getState() ?? {};
    const roadmapBlock = publishedBlock(state, 'roadmap', 'PUBLIC_ROADMAP');
    const supplied = roadmapBlock?.items ?? roadmapBlock?.milestones ?? state.roadmapMilestones ?? [];
    const rows = canonicalRoadmap.map((fallback, index) => {
      const matching = supplied.find?.((row) => String(row.title || row.phase || '').toLowerCase() === fallback.title.toLowerCase()) ?? supplied[index] ?? {};
      const progress = Math.max(0, Math.min(100, Number(matching.progress ?? fallback.progress) || 0));
      return {
        ...fallback,
        ...matching,
        title: fallback.title,
        progress,
        highlight: matching.highlight || matching.description || fallback.highlight,
        nextStep: matching.nextStep || matching.output || fallback.nextStep,
        date: matching.date || matching.publishedAt || matching.updatedAt || fallback.date,
      };
    });
    const average = rows.length ? Math.round(rows.reduce((sum, row) => sum + row.progress, 0) / rows.length) : 0;
    overall.textContent = `${average}% overall`;
    roadmapRoot.innerHTML = rows.map((row, index) => `<article class="milestone">
      <span class="milestone-index" aria-hidden="true">${index + 1}</span>
      <div><h4>${esc(row.title)}</h4><p>${esc(row.highlight)}</p><p><strong>Next step:</strong> ${esc(row.nextStep)}</p><small>Updated ${esc(readableDate(row.date))}</small></div>
      <div class="milestone-progress">${statusChip(row.status)}<strong>${row.progress}%</strong><div class="track" role="progressbar" aria-label="${esc(row.title)} progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${row.progress}"><i style="width:${row.progress}%"></i></div></div>
    </article>`).join('');

    const roadmapPanel = roadmapRoot.closest('.panel');
    let changesPanel = document.querySelector('#whatChangedPanel');
    if (!changesPanel && roadmapPanel) {
      roadmapPanel.insertAdjacentHTML('afterend', `<article id="whatChangedPanel" class="panel section-gap" aria-labelledby="whatChangedTitle"><div class="panel-head"><div><h2 id="whatChangedTitle">What Changed</h2><p>Published, plain-language release notes from the same structured content source.</p></div><span class="pill">Published updates</span></div><div id="whatChanged" class="what-changed-list"></div></article>`);
      changesPanel = document.querySelector('#whatChangedPanel');
    }
    const changesBlock = publishedBlock(state, 'whatChanged', 'PUBLIC_WHAT_CHANGED');
    const changes = changesBlock?.entries ?? changesBlock?.items ?? state.whatChangedEntries ?? fallbackChanges;
    const changesRoot = changesPanel?.querySelector('#whatChanged');
    if (changesRoot) changesRoot.innerHTML = (changes.length ? changes : fallbackChanges).map((entry) => `<article class="data-card what-changed-card">
      <div class="button-row">${statusChip(entry.status || 'PUBLISHED')}<span class="pill">${esc(readableDate(entry.date || entry.publishedAt || entry.updatedAt))}</span></div>
      <h4>${esc(entry.title || entry.heading || 'Product update')}</h4><p>${esc(entry.summary || entry.description || entry.body || '')}</p>
    </article>`).join('');
    return true;
  };

  const adminRows = (dashboard, ...keys) => {
    for (const key of keys) if (Array.isArray(dashboard?.[key])) return dashboard[key];
    return [];
  };

  const adminReadinessCard = (title, value, detail = '') => `<article class="data-card"><span class="section-kicker">${esc(title)}</span><h4>${esc(value || 'Not reported')}</h4><p>${esc(detail || 'Read-only status supplied by the protected admin API.')}</p></article>`;

  const renderAdminDashboard = () => {
    const root = document.querySelector('#adminDashboardBody');
    if (!root) return;
    if (adminLoading) { root.innerHTML = '<div class="loading-state" role="status">Loading protected administrative status…</div>'; return; }
    const dashboard = adminData ?? {};
    const health = dashboard.health ?? dashboard.systemHealth ?? {};
    const schema = dashboard.schema ?? dashboard.schemaStatus ?? {};
    const reconciliation = dashboard.reconciliation ?? dashboard.ledgerReconciliation ?? {};
    const backup = dashboard.backup ?? dashboard.backupStatus ?? {};
    const drive = dashboard.drive ?? dashboard.driveFolders ?? {};
    const triggers = dashboard.triggers ?? dashboard.triggerStatus ?? {};
    const users = adminRows(dashboard, 'users', 'userAccess');
    const events = adminRows(dashboard, 'events', 'eventRows');
    const revisions = adminRows(dashboard, 'contentRevisions', 'revisions');
    const branding = adminRows(dashboard, 'brandingAssets', 'branding');
    const errors = adminRows(dashboard, 'errors', 'recentErrors');
    const audit = adminRows(dashboard, 'audit', 'recentAudit');
    root.innerHTML = `<div class="admin-dashboard-grid">
      <section class="admin-span-all" aria-labelledby="adminHealthTitle"><div class="panel-head"><div><h2 id="adminHealthTitle">Sanitized System Health</h2><p>Identifiers, secrets, private links, and raw configuration are not rendered.</p></div><button class="secondary mini" type="button" data-admin-refresh>Refresh Status</button></div>
        <div class="grid-4">${adminReadinessCard('Environment', health.environment || dashboard.environment, health.status || 'Protected status')}${adminReadinessCard('Schema', schema.status || health.schemaStatus, schema.summary)}${adminReadinessCard('Ledger reconciliation', reconciliation.status, reconciliation.summary)}${adminReadinessCard('Backup readiness', backup.status || backup.readiness, backup.lastCompletedAt ? `Last completed ${readableDate(backup.lastCompletedAt)}` : backup.summary)}${adminReadinessCard('Drive folders', drive.status || health.driveStatus, drive.summary)}${adminReadinessCard('Triggers', triggers.status || health.triggerStatus, triggers.summary)}${adminReadinessCard('Data revision', health.dataRevision ?? dashboard.dataRevision, health.updatedAt ? `Updated ${readableDate(health.updatedAt)}` : '')}${adminReadinessCard('Cache / reports', dashboard.cacheStatus || dashboard.reportStatus, dashboard.exportStatus || '')}</div>
      </section>
      <section class="panel"><div class="panel-head"><div><h2>User Access</h2><p>Create or update access without deleting history.</p></div><span class="pill">${users.length} records</span></div>
        <form data-admin-form="user"><div class="form-grid"><label>Email / identity<input name="email" type="email" required></label><label>Display name<input name="displayName" required></label><label>Role<select name="role"><option>REQUESTER</option><option>DOL_STAFF</option><option>COMMITTEE_HEAD</option><option>DOL_DIRECTOR</option><option>ADMIN</option><option>READ_ONLY_AUDITOR</option></select></label><label>Account status<select name="active"><option value="true">Active</option><option value="false">Deactivated</option></select></label></div><fieldset class="permission-grid"><legend>Server-checked permissions</legend><label><input type="checkbox" name="canReview"> Review</label><label><input type="checkbox" name="canRelease"> Release</label><label><input type="checkbox" name="canReceive"> Receive</label><label><input type="checkbox" name="canAdmin"> Admin</label><label><input type="checkbox" name="canManageCatalog"> Catalog</label></fieldset><button class="primary" type="submit">Save User Access</button></form>
        <div class="admin-record-list">${users.slice(0, 6).map((user) => `<div class="detail-line"><div><strong>${esc(user.displayName || user.name || user.email || user.id)}</strong><small>${esc(user.role || 'Role not reported')} · ${user.active === false ? 'Deactivated' : 'Active'}</small></div></div>`).join('') || '<div class="empty">No access rows were returned.</div>'}</div>
      </section>
      <section class="panel"><div class="panel-head"><div><h2>Events and Sub-events</h2><p>Create or revise metadata; the server retains stable IDs and history.</p></div><span class="pill">${events.length} records</span></div>
        <form data-admin-form="event"><div class="form-grid"><label>Event ID (for edit)<input name="eventId" placeholder="Leave blank for server-generated ID"></label><label>Series ID<input name="eventSeriesId" required></label><label>Series name<input name="eventSeriesName" required></label><label>Event / sub-event name<input name="eventName" required></label><label>Start<input name="startAt" type="datetime-local" required></label><label>End<input name="endAt" type="datetime-local" required></label><label>Owner / committee<input name="owner"></label><label>Venue<input name="venue"></label><label>Status<select name="status"><option>UPCOMING</option><option>ACTIVE</option><option>COMPLETED</option><option>ARCHIVED</option></select></label></div><button class="primary" type="submit">Save Event</button></form>
      </section>
      <section class="panel"><div class="panel-head"><div><h2>Published Content</h2><p>Draft, publish, or revert stable structured content keys.</p></div><span class="pill">${revisions.length} revisions</span></div>
        <form data-admin-form="content"><div class="form-grid"><label>Content key<select name="contentKey"><option value="PUBLIC_ROADMAP">Public Roadmap</option><option value="PUBLIC_WHAT_CHANGED">What Changed</option><option value="PUBLIC_HOME">Public home guidance</option></select></label><label>Revision ID<input name="revisionId" placeholder="Required to publish or revert"></label><label>Expected revision<input name="expectedRevision" type="number" min="0"></label><label>Title<input name="title"></label><label class="span-2">Structured content<textarea name="body" rows="7" placeholder="Server-validated structured content"></textarea></label><label class="span-2">Change note<input name="changeNote" required></label></div><div class="button-row"><button class="secondary" type="submit" data-admin-action="draft">Save Draft</button><button class="primary" type="submit" data-admin-action="publish">Publish Revision</button><button class="ghost" type="submit" data-admin-action="revert">Revert to Revision</button></div></form>
      </section>
      <section class="panel"><div class="panel-head"><div><h2>Branding Metadata</h2><p>Official assets are never fabricated; missing assets retain a text fallback.</p></div><span class="pill">${branding.length} versions</span></div>
        <form data-admin-form="branding"><div class="form-grid"><label>Asset key<select name="assetKey"><option value="DOL_LOGO">DOL logo</option><option value="USC_LOGO">USC logo</option><option value="HAU_LOGO">HAU logo</option></select></label><label>Protected asset ID<input name="assetId" required></label><label class="span-2">Alt text<input name="altText" required></label><label>Status<select name="status"><option>DRAFT</option><option>ACTIVE</option><option>FALLBACK</option><option>ARCHIVED</option></select></label><label>Expected revision<input name="expectedRevision" type="number" min="0"></label><label class="span-2">Version note<input name="versionNote" required></label></div><button class="primary" type="submit">Save Branding Metadata</button></form>
      </section>
      <section class="panel admin-span-all"><div class="grid-2"><div><div class="panel-head"><div><h2>Recent Errors</h2><p>Safe messages and correlation IDs only.</p></div><span class="pill">${errors.length}</span></div><div class="admin-record-list">${errors.slice(0, 8).map((row) => `<div class="detail-line"><div><strong>${esc(row.code || 'ERROR')} · ${esc(row.message || 'Safe details unavailable')}</strong><small>${esc(row.correlationId || 'No correlation ID')} · ${esc(readableDate(row.at || row.createdAt))}</small></div></div>`).join('') || '<div class="empty">No recent errors were returned.</div>'}</div></div><div><div class="panel-head"><div><h2>Recent Audit</h2><p>Read-only administrative activity.</p></div><span class="pill">${audit.length}</span></div><div class="admin-record-list">${audit.slice(0, 8).map((row) => `<div class="detail-line"><div><strong>${esc(row.action || 'Activity')} · ${esc(row.entityType || '')}</strong><small>${esc(row.entityId || '')} · ${esc(readableDate(row.at || row.createdAt))}</small></div></div>`).join('') || '<div class="empty">No recent audit rows were returned.</div>'}</div></div></div></section>
    </div>`;
    labelUnlabelledFields(root);
  };

  const loadAdminDashboard = async () => {
    const root = document.querySelector('#adminDashboardBody');
    if (!root || adminLoading) return;
    if (typeof services.getAdminDashboard !== 'function') { root.innerHTML = '<div class="empty">The protected admin dashboard API is unavailable in this runtime.</div>'; return; }
    adminLoading = true; renderAdminDashboard();
    try { adminData = unwrapResult(await services.getAdminDashboard()); }
    catch (error) { adminData = {}; toast(`${error.message}${error.correlationId ? ` · ${error.correlationId}` : ''}`, true); }
    finally { adminLoading = false; renderAdminDashboard(); }
  };

  const runAdminMutation = async (method, payload, message) => {
    if (typeof services[method] !== 'function') throw new Error(`${method} is unavailable in this runtime.`);
    const result = unwrapResult(await services[method](payload));
    await commit(message, 'success', result);
    await loadAdminDashboard();
    return result;
  };

  const adminPayload = (form) => {
    const payload = Object.fromEntries(new FormData(form).entries());
    if (form.dataset.adminForm === 'user') {
      payload.active = payload.active === 'true';
      for (const name of ['canReview', 'canRelease', 'canReceive', 'canAdmin', 'canManageCatalog']) payload[name] = form.elements[name].checked;
    }
    return payload;
  };

  const mountAdminDashboard = () => {
    if (portalMode() !== 'internal' || !permissionEnabled(getState()?.currentUser, 'admin')) return;
    const nav = document.querySelector('#primaryNav');
    if (!nav || document.querySelector('[data-view="admin"]')) return;
    nav.classList.add('has-admin');
    nav.insertAdjacentHTML('beforeend', '<button data-view="admin"><span class="nav-icon" aria-hidden="true">⚙</span><span class="nav-copy">Admin Dashboard<small>Health, access, content</small></span></button>');
    document.querySelector('#inventory')?.insertAdjacentHTML('afterend', '<section id="admin" class="view"><article class="panel"><div class="panel-head"><div><p class="eyebrow">Admin only</p><h2>Protected Administrative Controls</h2><p>Every write is re-authorized, validated, audited, and conflict-checked by the server.</p></div></div><div id="adminDashboardBody"><div class="empty">Open this view to load protected status.</div></div></article></section>');
    nav.querySelector('[data-view="admin"]').addEventListener('click', () => { void loadAdminDashboard(); });
    const section = document.querySelector('#admin');
    section.addEventListener('click', (event) => { if (event.target.closest('[data-admin-refresh]')) void loadAdminDashboard(); });
    section.addEventListener('submit', async (event) => {
      const form = event.target.closest('[data-admin-form]');
      if (!form) return;
      event.preventDefault();
      if (!form.reportValidity()) return;
      const button = event.submitter || form.querySelector('[type="submit"]');
      const original = button.textContent;
      button.disabled = true; button.textContent = 'Saving…';
      try {
        const payload = adminPayload(form);
        if (form.dataset.adminForm === 'user') await runAdminMutation('saveUserAccess', payload, 'User access saved.');
        if (form.dataset.adminForm === 'event') await runAdminMutation('saveEvent', payload, 'Event metadata saved.');
        if (form.dataset.adminForm === 'branding') await runAdminMutation('saveBrandingMetadata', payload, 'Branding metadata saved.');
        if (form.dataset.adminForm === 'content') {
          const action = button.dataset.adminAction || 'draft';
          if (action !== 'draft' && !payload.revisionId) throw new Error('Choose a revision ID before publishing or reverting.');
          const method = action === 'publish' ? 'publishContentRevision' : action === 'revert' ? 'revertContentRevision' : 'saveContentRevision';
          await runAdminMutation(method, payload, action === 'publish' ? 'Content revision published.' : action === 'revert' ? 'Published content reverted.' : 'Content draft saved.');
        }
        markFormClean(form);
      } catch (error) { toast(`${error.message}${error.correlationId ? ` · ${error.correlationId}` : ''}`, true); }
      finally { button.disabled = false; button.textContent = original; }
    });
  };

  const bindPartialReleaseReason = (form, lines) => {
    const note = form.elements.notes;
    const help = form.querySelector('#partialReleaseHelp');
    const label = form.querySelector('[data-release-reason-label]');
    const remaining = new Map(lines.map((line) => [String(line.id), Number(line.quantity) - Number(line.releasedQuantity || 0)]));
    const isPartial = () => {
      const selected = [...form.querySelectorAll('[name="releaseLine"]:checked')];
      if (selected.length !== lines.length) return true;
      return selected.some((choice) => Number(form.querySelector(`[name="qty_${CSS.escape(choice.value)}"]`)?.value || 0) < Number(remaining.get(choice.value) || 0));
    };
    const sync = () => {
      const partial = isPartial();
      note.required = partial;
      note.setAttribute('aria-required', String(partial));
      if (label) label.textContent = partial ? 'Partial release reason' : 'Condition, shortage, or substitution notes';
      if (help) help.textContent = partial ? 'Required because at least one selected line will remain outstanding.' : 'Optional for a complete handoff.';
      return partial;
    };
    form.addEventListener('input', sync);
    form.addEventListener('change', sync);
    sync();
    return {
      isPartial,
      validate() {
        const partial = sync();
        if (partial && !String(note.value || '').trim()) {
          toast('Explain why this is a partial release before posting the handoff.', true);
          note.focus();
          return false;
        }
        return true;
      },
    };
  };

  const openReturnWorkflow = (ticket) => {
    const remaining = Math.max(0, Number(ticket.quantity || 0) - Number(ticket.returnedQuantity || 0));
    openModal(`Return ${ticket.id}`, `<form id="returnForm"><div class="mode-note"><strong>${esc(ticket.id)}</strong><br>${esc(remaining)} of ${esc(ticket.quantity)} units remain to be accounted for.${ticket.dueAt ? `<br>Due ${esc(readableDate(ticket.dueAt))}` : ''}</div>
      <div class="form-grid" style="margin-top:14px"><label>Returned / accounted quantity<input name="returnedQuantity" type="number" min="0.01" max="${esc(remaining)}" step="0.01" value="${esc(remaining)}" required></label><label>Condition<select name="condition"><option value="GOOD">Good / reusable</option><option value="DAMAGED">Damaged</option><option value="INCOMPLETE">Incomplete / missing parts</option><option value="LOST">Lost</option></select></label><label>Damaged beyond use<input name="damagedBeyondUseQuantity" type="number" min="0" max="${esc(remaining)}" step="0.01" value="0" required></label><label>Lost quantity<input name="lostQuantity" type="number" min="0" max="${esc(remaining)}" step="0.01" value="0" required></label><label class="span-2">Damage, loss, or missing-parts details<textarea name="damageNotes" aria-describedby="returnDamageHelp"></textarea><small id="returnDamageHelp" class="field-help">Required when any quantity is damaged beyond use or lost.</small></label><label class="span-2">Partial-return reason<textarea name="partialReason" aria-describedby="partialReturnHelp"></textarea><small id="partialReturnHelp" class="field-help">Required when less than the remaining quantity is accounted for now.</small></label></div><button class="primary" type="submit">Post Return</button>
    </form>`, (modal) => {
      const form = modal.querySelector('#returnForm');
      const sync = () => {
        const returned = Number(form.elements.returnedQuantity.value || 0);
        const damaged = Number(form.elements.damagedBeyondUseQuantity.value || 0);
        const lost = Number(form.elements.lostQuantity.value || 0);
        const exceptional = damaged > 0 || lost > 0;
        const partial = returned < remaining;
        form.elements.damageNotes.required = exceptional;
        form.elements.partialReason.required = partial;
        form.elements.damageNotes.setAttribute('aria-required', String(exceptional));
        form.elements.partialReason.setAttribute('aria-required', String(partial));
      };
      form.addEventListener('input', sync); form.addEventListener('change', sync); sync();
      form.addEventListener('submit', async (event) => {
        event.preventDefault(); sync();
        const payload = Object.fromEntries(new FormData(form).entries());
        payload.returnedQuantity = Number(payload.returnedQuantity);
        payload.damagedBeyondUseQuantity = Number(payload.damagedBeyondUseQuantity || 0);
        payload.lostQuantity = Number(payload.lostQuantity || 0);
        if (payload.damagedBeyondUseQuantity + payload.lostQuantity > payload.returnedQuantity) { toast('Lost and damaged quantities cannot exceed the returned quantity.', true); return; }
        if (!form.reportValidity()) return;
        const button = event.submitter || form.querySelector('[type="submit"]');
        button.disabled = true; button.textContent = 'Posting…';
        try {
          const result = await services.confirmReturn(ticket.id, payload);
          markFormClean(form); closeModal();
          await commit(`Return recorded for ${ticket.id}.`, 'success', result);
        } catch (error) {
          toast(`${error.message}${error.correlationId ? ` · ${error.correlationId}` : ''}`, true);
          button.disabled = false; button.textContent = 'Post Return';
        }
      });
    });
  };

  const showLendingReceipt = (ticket) => {
    const status = ticket.status || 'FOR_REVIEW';
    openModal('Lending request received', `<div id="lendingReceipt" class="receipt-card" role="status" aria-live="polite" aria-atomic="true">
      <p class="eyebrow">Keep this reference</p><strong class="receipt-id">${esc(ticket.id || ticket.ticketId)}</strong><p>Status: ${esc(displayStatus(status))}</p>
      <div class="public-portal-notice"><strong>No public ticket history is provided.</strong><span>Student ID is not authority to retrieve, enumerate, or change a request. DOL will contact you using the details submitted.</span></div>
      <p>${ticket.dueAt ? `If this ticket is approved and handed over, return the item to DOL by ${esc(readableDate(ticket.dueAt))}.` : 'If approved, follow the collection or return instructions provided directly by DOL.'}</p>
    </div>`);
  };

  const mountSyncUi = () => {
    if (isPublicPortal()) return;
    const tools = document.querySelector('.app-header .header-tools');
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
    const insertionPoint = tools.querySelector('#resetDemo');
    tools.insertBefore(syncIndicator, insertionPoint);
    tools.insertBefore(refresh, insertionPoint);
    updateBanner = document.createElement('div');
    updateBanner.id = 'syncUpdateBanner';
    updateBanner.className = 'sync-update-banner';
    updateBanner.hidden = true;
    updateBanner.innerHTML = '<span data-sync-message>New operational data is available.</span><div class="button-row"><button class="primary mini" type="button" data-sync-refresh>Refresh now</button><button class="ghost mini" type="button" data-sync-continue>Continue editing</button></div>';
    document.querySelector('.app-header').after(updateBanner);
    refresh.addEventListener('click', () => { void poller?.check('manual'); });
    updateBanner.querySelector('[data-sync-refresh]').addEventListener('click', async () => {
      try { await refreshAuthoritative('explicit-refresh'); }
      catch (error) { showBanner(`Refresh failed. ${error.message}`, { failure: true }); }
    });
    updateBanner.querySelector('[data-sync-continue]').addEventListener('click', () => {
      updateBanner.hidden = true;
      setSyncStatus('updates-available');
    });
    setSyncStatus(navigator.onLine ? 'synced' : 'offline');
  };

  const install = () => {
    if (portalMode() !== 'request') lending = createLendingController({ markFormClean });
    mountPortalUi();
    mountAccessibility();
    mountRequestReviewQueue();
    mountAdminDashboard();
    mountSyncUi();
    const statusFilter = document.querySelector('#inventoryStatusFilter');
    if (statusFilter && !statusFilter.querySelector('[value="ARCHIVED"]')) statusFilter.insertAdjacentHTML('beforeend', '<option value="ARCHIVED">Archived</option>');
    const handlingFilter = document.querySelector('#inventoryHandlingFilter');
    if (handlingFilter && !handlingFilter.querySelector('[value="Reusable Asset"]')) handlingFilter.insertAdjacentHTML('beforeend', '<option value="Reusable Asset">Reusable Asset</option><option value="Non Circulating">Non-circulating</option>');
    document.addEventListener('input', (event) => {
      const form = event.target.closest('form');
      if (form && !event.target.closest('[data-passive-sync]')) dirtyForms.add(form);
    }, true);
    document.addEventListener('change', (event) => {
      const form = event.target.closest('form');
      if (form && !event.target.closest('[data-passive-sync]')) dirtyForms.add(form);
    }, true);
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
    if (portalMode() === 'internal') {
      mountRequestReviewQueue();
      renderRequestReviewQueue();
      mountAdminDashboard();
      if (document.querySelector('#admin.active') && adminData) renderAdminDashboard();
    }
    document.querySelectorAll('#primaryNav [data-view]').forEach((button) => {
      if (button.classList.contains('active')) button.setAttribute('aria-current', 'page');
      else button.removeAttribute('aria-current');
    });
    labelUnlabelledFields();
  };

  const start = () => {
    if (isPublicPortal() || backendMode !== 'apps-script' || typeof services.getDataRevision !== 'function') return;
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
    window.addEventListener('focus', () => { void poller.resume('focus'); });
    window.addEventListener('online', () => { setSyncStatus('checking'); void poller.resume('online'); });
    window.addEventListener('offline', () => poller.pause('offline'));
    poller.start();
  };

  return {
    install,
    start,
    afterRender,
    markFormClean,
    refreshAuthoritative,
    bindPartialReleaseReason,
    openReturnWorkflow,
    showLendingReceipt,
    renderRoadmapAndChanges,
    get lending() { return lending; },
    showRecordedRefreshFailure({ correlationId, error }) {
      const suffix = correlationId ? ` Correlation ID: ${correlationId}.` : '';
      showBanner(`The action was recorded, but the screen could not refresh.${suffix} Use Refresh now; do not submit the action again.${error?.message ? ` ${error.message}` : ''}`, { failure: true });
    },
    inventoryActions(item) {
      const allowed = canManageCatalog(getState()?.currentUser);
      const catalog = allowed && item.status !== 'ARCHIVED'
        ? `<button class="secondary mini" data-inventory-action="edit" data-item-id="${esc(item.id)}">View / Edit</button>`
        : '';
      const lifecycle = allowed
        ? item.status === 'ARCHIVED'
          ? `<button class="secondary mini" data-inventory-action="restore" data-item-id="${esc(item.id)}">Restore Item</button>`
          : `<button class="danger mini" data-inventory-action="archive" data-item-id="${esc(item.id)}">Archive</button>`
        : '';
      const operational = item.status === 'ARCHIVED' ? '' : `<button class="ghost mini" data-inventory-action="restock" data-item-id="${esc(item.id)}">Restock</button><button class="ghost mini" data-inventory-action="context" data-item-id="${esc(item.id)}">Reserve / Release</button><button class="ghost mini" data-inventory-action="transfer" data-item-id="${esc(item.id)}">Transfer</button>`;
      return `${catalog}<button class="secondary mini" data-inventory-action="history" data-item-id="${esc(item.id)}">Ledger</button>${operational}${lifecycle}`;
    },
    openCatalogItem(itemId) {
      const item = getState().inventoryItems.find((candidate) => candidate.id === itemId);
      if (item) openCatalogForm(item);
    },
    openCreateCatalogItem() { openCatalogForm(); },
    async updateStorage(payload) {
      const result = await runCatalogMutation('storage', payload);
      return commit(`${payload.itemId} storage context updated.`, 'success', result);
    },
    async archiveItem(itemId) {
      const result = await runCatalogMutation('archive', { itemId, reason: 'Archived from Inventory Management' });
      return commit(`${itemId} archived.`, 'success', result);
    },
    async restoreItem(itemId) {
      const result = await runCatalogMutation('restore', { itemId, reason: 'Restored from Inventory Management' });
      return commit(`${itemId} restored.`, 'success', result);
    },
    pendingRevision: () => pendingRevision,
  };
}
