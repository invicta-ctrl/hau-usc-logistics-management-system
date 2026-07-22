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
import {
  createRevisionPoller,
  normalizeScopedRevisionPayload,
  revisionChanged,
} from '../app/revision-sync.js';
import { foodAttentionFlags, normalizeFoodDetails, updateFoodWorkflow } from '../domain/food-workflow.js';
import {
  materialsAttentionFlags,
  normalizeMaterialsDetails,
  updateMaterialsWorkflow,
} from '../domain/materials-workflow.js';
import {
  buildVenueEquipmentQueueItem,
  normalizeVenueEquipmentDetails,
  searchVenueEquipmentReferences,
  updateVenueEquipmentWorkflow,
  venueEquipmentAttentionFlags,
} from '../domain/venue-equipment-workflow.js';
import { can } from '../domain/permissions.js';
import {
  filterReferenceAdminRecords,
  previewReferenceAdminChange,
} from '../domain/reference-administration.js';

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
  synced: 'Near-live · updated just now',
  checking: 'Checking for updates',
  'updates-available': 'Updates available',
  offline: 'Offline',
  delayed: 'Sync delayed',
  stale: 'Updates may be stale',
  'manual-only': 'Manual refresh only',
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
    getActiveModule = () => 'overview',
    refreshActiveModule = null,
  } = options;
  const dirtyForms = new Set();
  const acceptedRevisions = new Map();
  let pendingRevision = null;
  let refreshPromise = null;
  let syncIndicator = null;
  let updateBanner = null;
  let lending = null;
  let poller = null;
  let foodQueue = null;
  let foodQueueItems = null;
  let foodQueuePromise = null;
  let materialsQueue = null;
  let materialsQueueItems = null;
  let materialsQueuePromise = null;
  let venueEquipmentQueue = null;
  let venueEquipmentQueueItems = null;
  let venueEquipmentQueuePromise = null;
  let venueEquipmentLines = [];
  let venueEquipmentSearchResults = [];
  let referenceAdminWorkspace = null;
  let referenceAdminPromise = null;
  let referenceAdminDomain = 'VENUES';
  let sharedMobileNav = null;
  let sharedMobileMore = null;
  let roleExperienceObserver = null;
  let lastActiveAt = Date.now();
  let lastUpdatedAt = '';

  const foodRequestsEnabled = config.foodRequestsEnabled === true;
  const materialsRequestsEnabled = config.materialsRequestsEnabled === true;
  const venueEquipmentRequestsEnabled = config.venueEquipmentRequestsEnabled === true;

  const referenceAdminAllowed = () => {
    const user = getState()?.currentUser;
    return can(user, 'manage_reference');
  };

  const localReferenceAdminRecords = (domain) => {
    const state = getState() ?? {};
    if (domain === 'VENUES' || domain === 'EQUIPMENT')
      return (state.venueEquipmentReferences ?? [])
        .filter((entry) => entry.type === (domain === 'VENUES' ? 'VENUE' : 'EQUIPMENT'))
        .map((entry) => ({
          id: entry.id,
          domain,
          revision: Number(entry.revision ?? 1),
          status: entry.status ?? 'ACTIVE',
          payload: {
            displayName: entry.name,
            aliases: entry.aliases ?? [],
            category: entry.category,
            location: entry.location ?? '',
            unit: entry.unit,
            requestability: entry.requestability,
            contactRole: entry.contactRole ?? '',
            routeId: entry.routeId ?? '',
            returnRequired: entry.returnRequired === true,
            effectiveFrom: entry.effectiveFrom ?? '',
            effectiveTo: entry.effectiveTo ?? '',
            notes: entry.notes ?? '',
          },
          effectiveFrom: entry.effectiveFrom ?? '',
          effectiveTo: entry.effectiveTo ?? '',
          updatedAt: entry.updatedAt ?? '',
        }));
    if (domain === 'ROUTING')
      return (state.venueEquipmentRoutes ?? []).map((entry) => ({
        id: entry.id,
        domain,
        revision: Number(entry.revision ?? 1),
        status: entry.status ?? 'ACTIVE',
        payload: { ...entry },
        effectiveFrom: entry.effectiveFrom ?? '',
        effectiveTo: entry.effectiveTo ?? '',
        updatedAt: entry.updatedAt ?? '',
      }));
    if (domain === 'PERMISSIONS') {
      const user = state.currentUser ?? {};
      return [{
        id: user.id ?? 'PREVIEW-USER',
        domain,
        revision: Number(user.authorization?.revision ?? 1),
        status: user.authorization?.active === false ? 'ARCHIVED' : 'ACTIVE',
        payload: {
          roleId: user.authorization?.roleId ?? user.role ?? 'REQUESTER',
          committeeIds: user.authorization?.committeeIds ?? user.scopes?.committee ?? [],
          active: user.authorization?.active !== false,
        },
      }];
    }
    if (domain === 'PEOPLE_MEMBERSHIPS') {
      const user = state.currentUser ?? {};
      return [{ id: user.id ?? 'PREVIEW-USER', domain, revision: 1, status: 'ACTIVE', payload: { displayName: user.displayName ?? 'Preview user', rosterManaged: true } }];
    }
    if (domain === 'SYNC_HEALTH')
      return [{ id: 'PREVIEW-SYNC', domain, revision: 1, status: 'ACTIVE', payload: { validationStatus: 'PREVIEW_ONLY', conflictCount: 0, revocationCount: 0 } }];
    return (state.referenceAdminRecords ?? []).filter((entry) => entry.domain === domain);
  };

  const installLocalReferenceAdminServices = () => {
    if (backendMode !== 'mock') return;
    const state = getState();
    state.referenceAdminRecords ??= [];
    state.referenceAdminChanges ??= [];
    services.getReferenceAdminWorkspace ??= async (command = {}) => {
      const domain = command.domain ?? 'VENUES';
      const currentById = new Map();
      localReferenceAdminRecords(domain).forEach((record) => {
        const current = currentById.get(record.id);
        if (!current || Number(record.revision) > Number(current.revision)) currentById.set(record.id, record);
      });
      return {
        contract: 'reference-administration',
        contractVersion: 1,
        domain,
        writesEnabled: true,
        items: filterReferenceAdminRecords([...currentById.values()], command),
        pendingChanges: state.referenceAdminChanges.filter((entry) => entry.domain === domain && entry.reviewStatus === 'PENDING_REVIEW'),
        fieldOwnership: { peopleMemberships: 'AUTHORITATIVE_ROSTER_READ_ONLY', permissions: 'REVIEW_GATED', routing: 'REVIEW_GATED' },
        actor: { id: state.currentUser?.id ?? 'PREVIEW-ADMIN', role: state.currentUser?.role ?? 'ADMINISTRATOR' },
      };
    };
    services.previewReferenceAdminChange ??= async (command) => previewReferenceAdminChange(command, {
      current: localReferenceAdminRecords(command.domain)
        .filter((entry) => entry.id === command.targetId)
        .sort((left, right) => Number(right.revision) - Number(left.revision))[0],
      actorId: state.currentUser?.id ?? 'PREVIEW-ADMIN',
      dependencies: [],
    });
    services.submitReferenceAdminChange ??= async (command) => {
      const preview = await services.previewReferenceAdminChange(command);
      const changeId = `PREVIEW-CHANGE-${state.referenceAdminChanges.length + 1}`;
      if (preview.requiresReview) {
        state.referenceAdminChanges.push({ changeId, domain: preview.domain, action: preview.action, targetId: preview.targetId, expectedRevision: preview.expectedRevision, risk: preview.risk, requestedAt: new Date().toISOString(), requestedBy: state.currentUser?.id ?? 'PREVIEW-ADMIN', reviewStatus: 'PENDING_REVIEW', before: preview.before, after: preview.after, changedFields: preview.changedFields });
        return { changeId, reviewStatus: 'PENDING_REVIEW', applied: false, preview };
      }
      const updatedAt = new Date().toISOString();
      if (preview.domain === 'VENUES' || preview.domain === 'EQUIPMENT') {
        state.venueEquipmentReferences ??= [];
        state.venueEquipmentReferences.push({
          id: preview.after.id,
          type: preview.domain === 'VENUES' ? 'VENUE' : 'EQUIPMENT',
          name: preview.after.payload.displayName,
          aliases: preview.after.payload.aliases ?? [],
          category: preview.after.payload.category,
          location: preview.after.payload.location ?? '',
          unit: preview.after.payload.unit,
          requestability: preview.after.payload.requestability,
          contactRole: preview.after.payload.contactRole ?? '',
          routeId: preview.after.payload.routeId ?? '',
          returnRequired: preview.after.payload.returnRequired === true,
          effectiveFrom: preview.after.effectiveFrom,
          effectiveTo: preview.after.effectiveTo,
          revision: preview.after.revision,
          status: preview.after.status,
          updatedAt,
        });
      } else if (preview.domain === 'ROUTING') {
        state.venueEquipmentRoutes ??= [];
        state.venueEquipmentRoutes.push({
          id: preview.after.id,
          ...preview.after.payload,
          revision: preview.after.revision,
          status: preview.after.status,
          effectiveFrom: preview.after.effectiveFrom,
          effectiveTo: preview.after.effectiveTo,
          updatedAt,
        });
      } else state.referenceAdminRecords.push({ ...preview.after, updatedAt });
      return { changeId, reviewStatus: 'APPLIED', applied: true, preview };
    };
    services.reviewReferenceAdminChange ??= async () => {
      throw new Error('Preview review requires a different administrator session to demonstrate separation of duties.');
    };
  };

  const referenceAdminFields = (domain, record = {}) => {
    const payload = record.payload ?? {};
    const common = `<label>Display name<input name="displayName" maxlength="160" value="${esc(payload.displayName ?? '')}"></label><label>Aliases<input name="aliases" maxlength="500" value="${esc((payload.aliases ?? []).join(' | '))}"></label><label>Effective from<input name="effectiveFrom" type="date" value="${esc(payload.effectiveFrom ?? record.effectiveFrom ?? '')}"></label><label>Effective to<input name="effectiveTo" type="date" value="${esc(payload.effectiveTo ?? record.effectiveTo ?? '')}"></label>`;
    if (domain === 'VENUES' || domain === 'EQUIPMENT') return `${common}<label>Category<input name="category" maxlength="80" value="${esc(payload.category ?? '')}" required></label><label>Location<input name="location" maxlength="160" value="${esc(payload.location ?? '')}"></label><label>Unit<select name="unit">${['service', 'piece', 'set', 'unit'].map((value) => option(value, value, payload.unit)).join('')}</select></label><label>Requestability<select name="requestability">${option('REQUESTABLE', 'Requestable - confirmation required', payload.requestability)}${option('NOT_REQUESTABLE', 'Not requestable', payload.requestability)}</select></label><label>Contact role<input name="contactRole" maxlength="120" value="${esc(payload.contactRole ?? '')}"></label><label>Route ID<input name="routeId" maxlength="100" value="${esc(payload.routeId ?? '')}" required></label>${domain === 'EQUIPMENT' ? `<label class="checkbox"><input name="returnRequired" type="checkbox" ${payload.returnRequired ? 'checked' : ''}> Return required</label>` : ''}<label class="span-2">Notes<textarea name="notes" maxlength="500">${esc(payload.notes ?? '')}</textarea></label>`;
    if (domain === 'ROUTING') return `<label>Match kind<select name="matchKind">${['REFERENCE', 'CATEGORY', 'OTHER'].map((value) => option(value, value, payload.matchKind)).join('')}</select></label><label>Reference ID<input name="referenceId" maxlength="100" value="${esc(payload.referenceId ?? '')}"></label><label>Reference type<input name="referenceType" maxlength="40" value="${esc(payload.referenceType ?? '')}"></label><label>Category<input name="category" maxlength="80" value="${esc(payload.category ?? '')}"></label><label>Owner committee<select name="ownerCommitteeId">${['COM_FOOD', 'COM_INVENTORY_PANTRY', 'COM_MATERIALS'].map((value) => option(value, value.replaceAll('_', ' '), payload.ownerCommitteeId)).join('')}</select></label><label>Owner user ID<input name="ownerUserId" maxlength="100" value="${esc(payload.ownerUserId ?? '')}"></label><label>Responsible office ID<input name="responsibleOfficeId" maxlength="100" value="${esc(payload.responsibleOfficeId ?? '')}" required></label><label>Approving authority ID<input name="approvingAuthorityId" maxlength="100" value="${esc(payload.approvingAuthorityId ?? '')}" required></label><label>Lead time (business days)<input name="leadTimeBusinessDays" type="number" min="1" max="90" value="${esc(payload.leadTimeBusinessDays ?? 1)}" required></label><label class="span-2">Instructions<textarea name="instructions" maxlength="500" required>${esc(payload.instructions ?? '')}</textarea></label><label>Effective from<input name="effectiveFrom" type="date" value="${esc(payload.effectiveFrom ?? record.effectiveFrom ?? '')}"></label><label>Effective to<input name="effectiveTo" type="date" value="${esc(payload.effectiveTo ?? record.effectiveTo ?? '')}"></label>`;
    if (domain === 'PERMISSIONS') return `<label>Role<select name="roleId">${['REQUESTER', 'DOL_STAFF', 'COMMITTEE_HEAD', 'DIRECTOR', 'ADMINISTRATOR', 'READ_ONLY_AUDITOR'].map((value) => option(value, value.replaceAll('_', ' '), payload.roleId)).join('')}</select></label><label>Committee IDs<input name="committeeIds" maxlength="260" value="${esc((payload.committeeIds ?? []).join(' | '))}"></label><label class="checkbox"><input name="active" type="checkbox" ${payload.active !== false ? 'checked' : ''}> Active access</label><label class="checkbox"><input name="emergencyRevocation" type="checkbox"> Emergency revocation only</label><label class="span-2">Reason<textarea name="reason" maxlength="500" required></textarea></label>`;
    return `${common}<label class="span-2">Description<textarea name="description" maxlength="500">${esc(payload.description ?? '')}</textarea></label>`;
  };

  const referenceAdminPatchFromForm = (domain, form) => {
    const values = Object.fromEntries(new FormData(form).entries());
    delete values.targetId;
    if (Object.prototype.hasOwnProperty.call(values, 'aliases')) values.aliases = values.aliases.split(/[|,]/).map((entry) => entry.trim()).filter(Boolean);
    if (domain === 'PERMISSIONS') {
      values.committeeIds = String(values.committeeIds ?? '').split(/[|,]/).map((entry) => entry.trim()).filter(Boolean);
      values.active = form.elements.active.checked;
      values.emergencyRevocation = form.elements.emergencyRevocation.checked;
    }
    if (domain === 'EQUIPMENT') values.returnRequired = form.elements.returnRequired.checked;
    if (domain === 'ROUTING') values.leadTimeBusinessDays = Number(values.leadTimeBusinessDays);
    return Object.fromEntries(Object.entries(values).filter(([, value]) => value !== ''));
  };

  const refreshReferenceAdminWorkspace = async ({ force = false } = {}) => {
    const root = document.querySelector('#referenceAdminWorkspace');
    if (!root || !referenceAdminAllowed()) return;
    if (referenceAdminPromise) return referenceAdminPromise;
    if (!force && referenceAdminWorkspace?.domain === referenceAdminDomain) return;
    const query = root.querySelector('[name="referenceAdminSearch"]')?.value ?? '';
    const status = root.querySelector('[name="referenceAdminStatus"]')?.value ?? 'ALL';
    referenceAdminPromise = services.getReferenceAdminWorkspace({ domain: referenceAdminDomain, query, status, limit: 50 });
    try {
      referenceAdminWorkspace = await referenceAdminPromise;
      renderReferenceAdminWorkspace();
    } catch (error) {
      root.querySelector('[data-reference-admin-results]').innerHTML = `<div class="alert error">${esc(error.message)}</div>`;
    } finally {
      referenceAdminPromise = null;
    }
  };

  const openReferenceAdminChange = (record, action = record ? 'UPDATE' : 'ADD') => {
    const targetId = record?.id ?? '';
    openModal(
      `${action === 'ADD' ? 'Add' : action === 'UPDATE' ? 'Update' : action.toLowerCase()} ${referenceAdminDomain.replaceAll('_', ' ')}`,
      `<form id="referenceAdminChangeForm"><div class="mode-note">Controlled fields only. Roster-owned identity is read-only; permission and cross-office routing changes require a distinct reviewer.</div><div class="form-grid" style="margin-top:14px"><label>Stable ID<input name="targetId" maxlength="100" value="${esc(targetId)}" ${record ? 'readonly' : ''} required></label>${action === 'UPDATE' || action === 'ADD' ? referenceAdminFields(referenceAdminDomain, record) : `<label class="span-2">Reason<textarea name="reason" maxlength="500" required></textarea></label>`}</div><button class="primary" type="submit">Preview change</button></form>`,
      (modal) => {
        const form = modal.querySelector('#referenceAdminChangeForm');
        form.addEventListener('submit', async (event) => {
          event.preventDefault();
          if (!form.reportValidity()) return;
          const command = {
            domain: referenceAdminDomain,
            action,
            targetId: form.elements.targetId.value,
            expectedRevision: Number(record?.revision ?? 0),
            patch: action === 'ADD' || action === 'UPDATE' ? referenceAdminPatchFromForm(referenceAdminDomain, form) : {},
            reason: form.elements.reason?.value ?? '',
          };
          try {
            const preview = await services.previewReferenceAdminChange(command);
            openModal('Confirm administrative change', `<div class="mode-note"><strong>${esc(preview.risk)}</strong> &middot; ${preview.requiresReview ? 'Separate review required' : 'Applies after confirmation'} &middot; Revision ${esc(preview.expectedRevision)} to ${esc(preview.after.revision)}</div><div class="comparison-grid section-gap"><article class="card"><h3>Before</h3><pre>${esc(JSON.stringify(preview.before, null, 2))}</pre></article><article class="card"><h3>After</h3><pre>${esc(JSON.stringify(preview.after, null, 2))}</pre></article></div><button class="primary" type="button" data-reference-admin-confirm>Confirm ${preview.requiresReview ? 'review request' : 'change'}</button>`, (confirmation) => {
              confirmation.querySelector('[data-reference-admin-confirm]').addEventListener('click', async (confirmEvent) => {
                const button = confirmEvent.currentTarget;
                button.disabled = true;
                try {
                  const result = await services.submitReferenceAdminChange({ ...command, idempotencyKey: `reference-admin-${globalThis.crypto?.randomUUID?.() ?? Date.now()}` });
                  closeModal();
                  referenceAdminWorkspace = null;
                  await refreshReferenceAdminWorkspace({ force: true });
                  toast(result.applied ? 'Administrative change applied and audited.' : 'Administrative change queued for separate review.');
                } catch (error) {
                  toast(error.message, true);
                  button.disabled = false;
                }
              });
            });
          } catch (error) {
            toast(error.message, true);
          }
        });
      },
    );
  };

  const openReferenceAdminReview = (change, decision) => {
    const normalizedDecision = decision === 'REJECT' ? 'REJECT' : 'APPROVE';
    openModal(
      `${normalizedDecision === 'APPROVE' ? 'Approve' : 'Reject'} administrative change`,
      `<div class="mode-note"><strong>${esc(change.risk)}</strong> &middot; requested by ${esc(change.requestedBy)} &middot; expected revision ${esc(change.expectedRevision)}</div><div class="comparison-grid section-gap"><article class="card"><h3>Before</h3><pre>${esc(JSON.stringify(change.before, null, 2))}</pre></article><article class="card"><h3>After</h3><pre>${esc(JSON.stringify(change.after, null, 2))}</pre></article></div><form id="referenceAdminReviewForm"><label class="section-gap">Independent review reason<textarea name="reason" maxlength="500" required></textarea></label><button class="${normalizedDecision === 'APPROVE' ? 'primary' : 'danger'}" type="submit">Confirm ${normalizedDecision.toLowerCase()}</button></form>`,
      (modal) => {
        const form = modal.querySelector('#referenceAdminReviewForm');
        form.addEventListener('submit', async (event) => {
          event.preventDefault();
          if (!form.reportValidity()) return;
          const button = form.querySelector('[type="submit"]');
          button.disabled = true;
          try {
            const result = await services.reviewReferenceAdminChange({
              changeId: change.changeId,
              decision: normalizedDecision,
              reason: form.elements.reason.value,
              idempotencyKey: `reference-admin-review-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`,
            });
            closeModal();
            referenceAdminWorkspace = null;
            await refreshReferenceAdminWorkspace({ force: true });
            toast(result.applied ? 'Administrative change approved, applied, and audited.' : 'Administrative change rejected and audited.');
          } catch (error) {
            toast(error.message, true);
            button.disabled = false;
          }
        });
      },
    );
  };

  const renderReferenceAdminWorkspace = () => {
    const root = document.querySelector('#referenceAdminWorkspace');
    if (!root) return;
    const allowed = referenceAdminAllowed();
    root.hidden = !allowed;
    if (!allowed) return;
    const workspace = referenceAdminWorkspace;
    root.querySelector('[data-reference-admin-write-state]').textContent = workspace?.writesEnabled ? 'Controlled writes enabled' : 'Read-only / kill switch active';
    const results = root.querySelector('[data-reference-admin-results]');
    const readOnly = ['PEOPLE_MEMBERSHIPS', 'SYNC_HEALTH'].includes(referenceAdminDomain);
    root.querySelectorAll('[data-reference-admin-control-domain]').forEach((control) => {
      const active = control.dataset.referenceAdminControlDomain === referenceAdminDomain;
      control.classList.toggle('active', active);
      control.setAttribute('aria-pressed', String(active));
    });
    root.querySelector('[data-reference-admin-add]').hidden = readOnly || !workspace?.writesEnabled;
    results.innerHTML = (workspace?.items ?? []).map((record) => `<div class="request-line"><div><strong>${esc(record.payload?.displayName ?? record.payload?.roleId ?? record.payload?.instructions ?? record.id)}</strong><small>${esc(record.id)} &middot; revision ${esc(record.revision)} &middot; ${esc(record.status)}</small></div><div class="request-line-actions">${readOnly ? '<span class="pill">Read only</span>' : `<button class="secondary mini" type="button" data-reference-admin-edit="${esc(record.id)}">View / edit</button><button class="${record.status === 'ARCHIVED' ? 'secondary' : 'danger'} mini" type="button" data-reference-admin-lifecycle="${esc(record.id)}" data-reference-admin-action="${record.status === 'ARCHIVED' ? 'RESTORE' : 'ARCHIVE'}">${record.status === 'ARCHIVED' ? 'Restore' : 'Archive'}</button>`}</div></div>`).join('') || '<div class="empty">No records match the current controlled filters.</div>';
    const pending = root.querySelector('[data-reference-admin-pending]');
    pending.innerHTML = (workspace?.pendingChanges ?? []).map((change) => {
      const applying = change.reviewStatus === 'APPLYING';
      const canReview = !applying && workspace?.writesEnabled && change.requestedBy !== workspace?.actor?.id;
      const action = applying
        ? '<span class="pill">Reconciliation required</span>'
        : canReview
          ? `<div class="request-line-actions"><button class="secondary mini" type="button" data-reference-admin-review="${esc(change.changeId)}" data-reference-admin-decision="REJECT">Reject</button><button class="primary mini" type="button" data-reference-admin-review="${esc(change.changeId)}" data-reference-admin-decision="APPROVE">Review and approve</button></div>`
          : '<span class="pill">Different administrator required</span>';
      return `<div class="request-line"><div><strong>${esc(change.action)} ${esc(change.targetId)}</strong><small>${esc(change.risk)} &middot; requested by ${esc(change.requestedBy)} &middot; ${esc(change.requestedAt ?? '')}</small></div>${action}</div>`;
    }).join('') || '<div class="empty">No pending second-review changes in this domain.</div>';
  };

  const installReferenceAdminWorkspace = () => {
    const root = document.querySelector('#referenceAdminWorkspace');
    if (!root || root.dataset.bound === 'true') return;
    root.dataset.bound = 'true';
    const navigation = document.querySelector('[data-admin-view="referenceAdmin"]');
    if (navigation) {
      const allowed = referenceAdminAllowed();
      navigation.hidden = !allowed;
      navigation.disabled = !allowed;
      navigation.setAttribute('aria-hidden', String(!allowed));
      navigation.addEventListener('click', () => {
        document.querySelectorAll('.view').forEach((view) => view.classList.toggle('active', view.id === 'referenceAdmin'));
        document.querySelectorAll('#primaryNav button').forEach((button) => button.classList.toggle('active', button === navigation));
        const title = document.querySelector('#pageTitle');
        if (title) title.textContent = 'Reference Administration';
        document.querySelector('#referenceAdmin')?.scrollIntoView({ block: 'start' });
        void refreshReferenceAdminWorkspace({ force: true });
      });
    }
    root.querySelector('[name="referenceAdminDomain"]').value = referenceAdminDomain;
    root.querySelector('[name="referenceAdminDomain"]').addEventListener('change', (event) => {
      referenceAdminDomain = event.target.value;
      referenceAdminWorkspace = null;
      void refreshReferenceAdminWorkspace({ force: true });
    });
    root.querySelector('[name="referenceAdminSearch"]').addEventListener('input', () => {
      referenceAdminWorkspace = null;
      void refreshReferenceAdminWorkspace({ force: true });
    });
    root.querySelector('[name="referenceAdminStatus"]').addEventListener('change', () => {
      referenceAdminWorkspace = null;
      void refreshReferenceAdminWorkspace({ force: true });
    });
    root.querySelectorAll('[data-reference-admin-control-domain]').forEach((control) => {
      control.addEventListener('click', () => {
        referenceAdminDomain = control.dataset.referenceAdminControlDomain;
        root.querySelector('[name="referenceAdminDomain"]').value = referenceAdminDomain;
        referenceAdminWorkspace = null;
        void refreshReferenceAdminWorkspace({ force: true });
      });
    });
    root.querySelector('[data-reference-admin-refresh]').addEventListener('click', () => void refreshReferenceAdminWorkspace({ force: true }));
    root.querySelector('[data-reference-admin-add]').addEventListener('click', () => openReferenceAdminChange(null, 'ADD'));
    root.addEventListener('click', (event) => {
      const edit = event.target.closest('[data-reference-admin-edit]');
      if (edit) openReferenceAdminChange(referenceAdminWorkspace?.items.find((record) => record.id === edit.dataset.referenceAdminEdit));
      const lifecycle = event.target.closest('[data-reference-admin-lifecycle]');
      if (lifecycle) openReferenceAdminChange(referenceAdminWorkspace?.items.find((record) => record.id === lifecycle.dataset.referenceAdminLifecycle), lifecycle.dataset.referenceAdminAction);
      const review = event.target.closest('[data-reference-admin-review]');
      if (review) {
        const change = referenceAdminWorkspace?.pendingChanges.find((entry) => entry.changeId === review.dataset.referenceAdminReview);
        if (change) openReferenceAdminReview(change, review.dataset.referenceAdminDecision);
      }
    });
  };
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

  const canAccessMaterialsQueue = () => {
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
    if (committeeIds.length) return committeeIds.includes('COM_MATERIALS');
    return backendMode === 'mock' && user.permissions?.review === true;
  };

  const materialsFormPayload = () => {
    const form = document.querySelector('#compositeRequestForm');
    if (!form) return null;
    return {
      materialCategory: form.elements.materialsMaterialCategory?.value,
      specification: form.elements.materialsSpecification?.value,
      requiredBy: form.elements.materialsRequiredBy?.value,
      usagePurpose: form.elements.materialsUsagePurpose?.value,
      sourcingPreference: form.elements.materialsSourcingPreference?.value,
    };
  };

  const localMaterialsQueue = () => {
    const state = getState();
    const parents = new Map(
      (state?.compositeRequests ?? []).map((parent) => [parent.requestId ?? parent.id, parent]),
    );
    return (state?.compositeComponents ?? [])
      .filter((child) => child.componentType === 'MATERIALS')
      .map((child) => {
        const parent = parents.get(child.requestId) ?? {};
        return {
          requestId: child.requestId,
          componentId: child.componentId ?? child.id,
          status: child.status,
          ownerCommitteeId: 'COM_MATERIALS',
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
          materials: child.payload?.materials,
          lines: child.payload?.lines ?? [],
          attentionFlags: child.attentionFlags ?? [],
        };
      });
  };

  const installLocalMaterialsServices = () => {
    if (backendMode !== 'mock') return;
    services.getMaterialsWorkQueue ??= async () => ({
      committeeId: 'COM_MATERIALS',
      items: localMaterialsQueue(),
    });
    services.updateMaterialsComponent ??= async (command) => {
      const child = (getState()?.compositeComponents ?? []).find(
        (entry) =>
          entry.componentType === 'MATERIALS' &&
          entry.requestId === command.requestId &&
          (entry.componentId ?? entry.id) === command.componentId,
      );
      if (!child) throw new Error('Materials component was not found.');
      if (['COMPLETED', 'REJECTED', 'CANCELLED'].includes(child.status))
        throw new Error('Terminal Materials components cannot be updated.');
      if (Number(command.expectedRevision) !== Number(child.revision ?? 1))
        throw new Error('Materials component changed; refresh before updating.');
      const materials = updateMaterialsWorkflow(child.payload?.materials, command.patch ?? {}, {
        resolveMaterialReference: (referenceId) =>
          (getState()?.inventoryItems ?? []).find((item) => item.id === referenceId),
      });
      if (materials.fulfillmentEvidenceId) {
        const requiredEvidenceType =
          materials.fulfillmentPath === 'STOCK_ISSUE'
            ? 'MATERIALS_ISSUE_PROOF'
            : materials.fulfillmentPath === 'PROCUREMENT_RECEIPT'
              ? 'DELIVERABLE_RECEIPT'
              : '';
        const evidenceUploaded = (getState()?.evidenceFiles ?? []).some(
          (evidence) =>
            evidence.id === materials.fulfillmentEvidenceId &&
            (evidence.evidenceType ?? evidence.metadata?.evidenceType ?? evidence.folderType) ===
              requiredEvidenceType &&
            (evidence.relatedEntityType ?? evidence.metadata?.relatedEntityType) ===
              'COMPOSITE_COMPONENT' &&
            (evidence.relatedEntityId ?? evidence.relatedId ?? evidence.metadata?.relatedEntityId) ===
              child.componentId,
        );
        if (!evidenceUploaded)
          throw new Error('Materials evidence type must match the selected fulfillment path.');
      }
      child.payload = { ...(child.payload ?? {}), materials };
      child.attentionFlags = materialsAttentionFlags(materials);
      child.revision = Number(child.revision ?? 1) + 1;
      child.updatedAt = new Date().toISOString();
      return {
        entityType: 'COMPOSITE_COMPONENT',
        entityId: command.componentId,
        requestId: command.requestId,
        componentId: command.componentId,
        revision: child.revision,
        materials,
      };
    };
  };

  const refreshMaterialsQueue = async ({ force = false } = {}) => {
    if (
      !materialsQueue ||
      !canAccessMaterialsQueue() ||
      typeof services.getMaterialsWorkQueue !== 'function'
    )
      return;
    if (materialsQueuePromise) return materialsQueuePromise;
    if (!force && materialsQueueItems !== null) return;
    materialsQueuePromise = (async () => {
      const result = await services.getMaterialsWorkQueue();
      materialsQueueItems = Array.isArray(result?.items) ? result.items : [];
      renderMaterialsQueue();
    })();
    try {
      await materialsQueuePromise;
    } catch (error) {
      materialsQueueItems = [];
      renderMaterialsQueue(error.message);
    } finally {
      materialsQueuePromise = null;
    }
  };

  const renderMaterialsQueue = (error = '') => {
    if (!materialsQueue) return;
    const items = materialsQueueItems ?? [];
    materialsQueue.innerHTML = `<div class="panel-head"><div><p class="eyebrow">Materials Committee</p><h3 id="materialsCommitteeQueueTitle">Scoped Materials work queue</h3><p>Exact quantities, units, provenance, and one authoritative fulfillment path.</p></div><span class="pill">${items.length} item${items.length === 1 ? '' : 's'}</span></div>${error ? `<div class="alert">${esc(error)}</div>` : ''}<div class="line-list">${items.map((item) => `<div class="request-line"><div><strong>${esc(item.componentId)}</strong><small>${esc(item.materials?.materialCategory || 'Materials')} Â· ${esc(item.materials?.fulfillmentPath || 'PENDING_DECISION')} Â· ${esc(item.lines?.length || 0)} line(s)</small></div><div class="request-line-actions"><span class="pill">${esc(item.status || 'FOR_REVIEW')}</span>${['COMPLETED', 'REJECTED', 'CANCELLED'].includes(item.status) ? '' : `<button class="secondary mini" type="button" data-materials-manage="${esc(item.componentId)}">Manage</button>`}</div></div>`).join('') || '<div class="empty">No Materials work is in the current authorized scope.</div>'}</div>`;
  };

  const openMaterialsWorkflow = (componentId) => {
    const item = (materialsQueueItems ?? []).find((entry) => entry.componentId === componentId);
    if (!item) return;
    openModal(
      `Manage Materials ${item.componentId}`,
      `<form id="materialsWorkflowForm"><div class="mode-note">Choose one fulfillment path. Exact-only remains the default; substitutions require an approved catalog reference and reason.</div><div class="form-grid" style="margin-top:14px"><label>Fulfillment path<select name="fulfillmentPath">${option('PENDING_DECISION', 'Pending decision', item.materials?.fulfillmentPath)}${option('STOCK_ISSUE', 'Issue from stock', item.materials?.fulfillmentPath)}${option('PROCUREMENT_RECEIPT', 'Procurement and receipt', item.materials?.fulfillmentPath)}</select></label><label>Substitution policy<select name="substitutionPolicy">${option('EXACT_ONLY', 'Exact only', item.materials?.substitutionPolicy)}${option('APPROVED_SUBSTITUTION', 'Approved substitution', item.materials?.substitutionPolicy)}</select></label><label>Approved substitute reference<input name="approvedSubstitutionReferenceId" maxlength="100" value="${esc(item.materials?.approvedSubstitutionReferenceId ?? '')}"></label><label>Substitution reason<input name="substitutionReason" maxlength="500" value="${esc(item.materials?.substitutionReason ?? '')}"></label><label>Blocker status<select name="blockerStatus">${option('NONE', 'No blocker', item.materials?.blockerStatus)}${option('BLOCKED', 'Blocked', item.materials?.blockerStatus)}</select></label><label>Blocker reason<input name="blockerReason" maxlength="500" value="${esc(item.materials?.blockerReason ?? '')}"></label><label class="span-2">Issue / receipt evidence (optional)<input name="fulfillmentEvidence" type="file" accept="image/jpeg,image/png,image/webp,application/pdf"><small>${item.materials?.fulfillmentEvidenceId ? `Linked evidence: ${esc(item.materials.fulfillmentEvidenceId)}` : 'A path-matching upload is required before completion.'}</small></label></div><button class="primary" type="submit">Save Materials Workflow</button></form>`,
      (modal) => {
        const form = modal.querySelector('#materialsWorkflowForm');
        form.addEventListener('submit', async (event) => {
          event.preventDefault();
          if (!form.reportValidity()) return;
          const button = form.querySelector('[type="submit"]');
          button.disabled = true;
          button.textContent = 'Savingâ€¦';
          try {
            const values = Object.fromEntries(new FormData(form).entries());
            let fulfillmentEvidenceId = item.materials?.fulfillmentEvidenceId ?? '';
            const file = form.elements.fulfillmentEvidence.files?.[0];
            if (file) {
              if (typeof services.uploadEvidenceFile !== 'function')
                throw new Error('Evidence upload is unavailable.');
              if (values.fulfillmentPath === 'PENDING_DECISION')
                throw new Error('Choose a fulfillment path before uploading evidence.');
              const evidence = await services.uploadEvidenceFile(file, {
                evidenceType:
                  values.fulfillmentPath === 'STOCK_ISSUE'
                    ? 'MATERIALS_ISSUE_PROOF'
                    : 'DELIVERABLE_RECEIPT',
                relatedEntityType: 'COMPOSITE_COMPONENT',
                relatedEntityId: item.componentId,
                requestId: item.requestId,
              });
              fulfillmentEvidenceId = evidence.id;
            }
            const result = await services.updateMaterialsComponent({
              requestId: item.requestId,
              componentId: item.componentId,
              expectedRevision: item.revision,
              patch: {
                fulfillmentPath: values.fulfillmentPath,
                substitutionPolicy: values.substitutionPolicy,
                approvedSubstitutionReferenceId: values.approvedSubstitutionReferenceId,
                substitutionReason: values.substitutionReason,
                blockerStatus: values.blockerStatus,
                blockerReason: values.blockerReason,
                fulfillmentEvidenceId,
              },
              reason: 'Materials workflow updated from the scoped queue',
              idempotencyKey: `materials-update-${item.componentId}-${item.revision}`,
            });
            markFormClean(form);
            closeModal();
            await commit(`${item.componentId} Materials workflow updated.`, 'success', result);
            await refreshMaterialsQueue({ force: true });
          } catch (error) {
            toast(`${error.message}${error.correlationId ? ` Â· ${error.correlationId}` : ''}`, true);
            button.disabled = false;
            button.textContent = 'Save Materials Workflow';
          }
        });
      },
    );
  };

  const installMaterialsWorkflow = () => {
    const section = document.querySelector('[data-composite-section="MATERIALS"]');
    const fields = section?.querySelector('[data-composite-fields]');
    const toggle = section?.querySelector('[data-composite-toggle]');
    if (!section || !fields || !toggle) return;
    if (!materialsRequestsEnabled) {
      toggle.disabled = true;
      section.insertAdjacentHTML(
        'beforeend',
        '<p class="muted">Materials specialization is disabled for new submissions.</p>',
      );
    }
    if (!fields.querySelector('[name="materialsMaterialCategory"]')) {
      fields.insertAdjacentHTML(
        'beforeend',
        `<label>Controlled category<select name="materialsMaterialCategory" required>${['OFFICE_SUPPLIES', 'PRINTING_SIGNAGE', 'EVENT_MATERIALS', 'CLEANING_SUPPLIES', 'OTHER_CONTROLLED'].map((category) => `<option value="${category}">${category.replaceAll('_', ' ')}</option>`).join('')}</select></label>
        <label>Required by<input name="materialsRequiredBy" type="date" required></label>
        <label class="span-2">Exact specification<input name="materialsSpecification" maxlength="500" placeholder="Enter the exact material specification" required></label>
        <label class="span-2">Usage / purpose<input name="materialsUsagePurpose" maxlength="500" placeholder="Describe the approved logistics use" required></label>
        <label>Sourcing preference<select name="materialsSourcingPreference" required><option value="STOCK_REVIEW">Review available stock</option><option value="PROCUREMENT_REQUIRED">Procurement required</option></select></label>
        <p class="muted span-2">Exact-only by default. No automatic substitution or unit conversion.</p>`,
      );
    }
    const originalSubmit = services.submitCompositeRequest.bind(services);
    services.submitCompositeRequest = async (payload) => {
      const enriched = structuredClone(payload);
      const sectionDraft = enriched.sections?.find((entry) => entry.type === 'MATERIALS');
      let normalizedMaterials = null;
      if (sectionDraft) {
        if (!materialsRequestsEnabled)
          throw new Error('Materials request specialization is not enabled.');
        sectionDraft.materials = materialsFormPayload();
        sectionDraft.lines = (sectionDraft.lines ?? []).map((line) => ({
          ...line,
          category: sectionDraft.materials.materialCategory,
        }));
        normalizedMaterials = normalizeMaterialsDetails(sectionDraft.materials, sectionDraft.lines, {
          resolveMaterialReference: (referenceId) =>
            (getState()?.inventoryItems ?? []).find((item) => item.id === referenceId),
        });
        sectionDraft.lines = normalizedMaterials.lines;
        sectionDraft.materials = { ...normalizedMaterials };
        delete sectionDraft.materials.lines;
      }
      const result = await originalSubmit(enriched);
      if (backendMode === 'mock' && normalizedMaterials) {
        const requestId = result.requestId || result.request?.requestId;
        const child = (getState()?.compositeComponents ?? []).find(
          (entry) => entry.requestId === requestId && entry.componentType === 'MATERIALS',
        );
        if (child) {
          child.payload = {
            notes: '',
            lines: normalizedMaterials.lines,
            materials: sectionDraft.materials,
          };
          child.attentionFlags = materialsAttentionFlags(sectionDraft.materials);
        }
      }
      await refreshMaterialsQueue({ force: true });
      return result;
    };
    if (!isRequestOnly() && canAccessMaterialsQueue()) {
      materialsQueue = document.createElement('article');
      materialsQueue.id = 'materialsCommitteeQueue';
      materialsQueue.className = 'panel section-gap';
      materialsQueue.setAttribute('aria-labelledby', 'materialsCommitteeQueueTitle');
      section.closest('#compositeRequestPanel')?.after(materialsQueue);
      materialsQueue.addEventListener('click', (event) => {
        const button = event.target.closest('[data-materials-manage]');
        if (button) openMaterialsWorkflow(button.dataset.materialsManage);
      });
      void refreshMaterialsQueue();
    }
  };

  const venueEquipmentCommitteeIds = () => {
    const user = getState()?.currentUser ?? {};
    const role = String(user.authorization?.roleId ?? user.role ?? '')
      .trim()
      .replace(/[\s-]+/g, '_')
      .toUpperCase();
    const approved = ['COM_FOOD', 'COM_INVENTORY_PANTRY', 'COM_MATERIALS'];
    if (role === 'DIRECTOR' || (backendMode === 'mock' && ['ADMIN', 'ADMINISTRATOR'].includes(role)))
      return approved;
    const capabilities = user.authorization?.capabilities ?? [];
    const mayReview =
      capabilities.includes('request.review') ||
      user.permissions?.review === true ||
      ['DOL_STAFF', 'COMMITTEE_HEAD'].includes(role);
    if (!mayReview) return [];
    const scoped = user.authorization?.committeeIds ?? user.scopes?.committee ?? [];
    return approved.filter((committeeId) => scoped.includes(committeeId));
  };

  const venueEquipmentEffectiveAt = (record, at) => {
    const date = String(at ?? '').slice(0, 10);
    return (
      String(record.status ?? '').trim().toUpperCase() === 'ACTIVE' &&
      (!record.effectiveFrom || date >= record.effectiveFrom) &&
      (!record.effectiveTo || date <= record.effectiveTo)
    );
  };

  const venueEquipmentRevision = (records, predicate, at, message) => {
    const revisions = (records ?? []).filter(predicate);
    if (!revisions.length) return undefined;
    const effective = revisions.filter((record) => venueEquipmentEffectiveAt(record, at));
    if (effective.length > 1) throw new Error(message);
    return effective[0] ?? revisions[0];
  };

  const localVenueEquipmentResolvers = (at) => ({
    resolveVenueEquipmentReference: (referenceId, effectiveAt = at) =>
      venueEquipmentRevision(
        getState()?.venueEquipmentReferences,
        (reference) => reference.id === referenceId && !reference.archivedAt,
        effectiveAt,
        'A reference ID has overlapping active effective revisions.',
      ),
    resolveVenueEquipmentRoute: (routeId, effectiveAt = at) =>
      venueEquipmentRevision(
        getState()?.venueEquipmentRoutes,
        (route) => route.id === routeId && !route.archivedAt,
        effectiveAt,
        'A route ID has overlapping active effective revisions.',
      ),
    resolveVenueEquipmentOtherRoute: (effectiveAt = at) => {
      const effective = (getState()?.venueEquipmentRoutes ?? []).filter(
        (route) =>
          route.matchKind === 'OTHER' &&
          !route.archivedAt &&
          venueEquipmentEffectiveAt(route, effectiveAt),
      );
      if (effective.length > 1)
        throw new Error('Controlled Other must resolve to exactly one active approved route.');
      return effective[0];
    },
  });

  const localVenueEquipmentQueue = (committeeId) => {
    const state = getState();
    const parents = new Map(
      (state?.compositeRequests ?? []).map((parent) => [parent.requestId ?? parent.id, parent]),
    );
    return (state?.compositeComponents ?? [])
      .filter(
        (child) =>
          child.componentType === 'VENUE_EQUIPMENT' && child.ownerCommitteeId === committeeId,
      )
      .map((child) => {
        const parent = parents.get(child.requestId) ?? {};
        return buildVenueEquipmentQueueItem(
          {
            requestId: child.requestId,
            eventId: parent.eventId ?? parent.event?.id ?? '',
            eventName: parent.eventName ?? parent.event?.name ?? '',
            eventStartAt: parent.eventStartAt ?? parent.event?.startAt ?? '',
            eventEndAt: parent.eventEndAt ?? parent.event?.endAt ?? '',
            priority: parent.priority ?? 'ROUTINE',
            purpose: parent.purpose ?? '',
            department: parent.department ?? parent.requester?.department ?? '',
          },
          child,
        );
      });
  };

  const installLocalVenueEquipmentServices = () => {
    if (backendMode !== 'mock') return;
    services.searchVenueEquipmentReferences ??= async (command = {}) => {
      const at = new Date().toISOString();
      const items = searchVenueEquipmentReferences(getState()?.venueEquipmentReferences, {
        ...command,
        at,
        resolveRoute: localVenueEquipmentResolvers(at).resolveVenueEquipmentRoute,
      });
      return { items, truncated: items.length >= 50 };
    };
    services.getVenueEquipmentWorkQueue ??= async (command = {}) => ({
      committeeId: command.committeeId,
      items: localVenueEquipmentQueue(command.committeeId),
    });
    services.updateVenueEquipmentComponent ??= async (command) => {
      const child = (getState()?.compositeComponents ?? []).find(
        (entry) =>
          entry.componentType === 'VENUE_EQUIPMENT' &&
          entry.requestId === command.requestId &&
          (entry.componentId ?? entry.id) === command.componentId,
      );
      if (!child) throw new Error('Venue and Equipment component was not found.');
      if (['COMPLETED', 'REJECTED', 'CANCELLED'].includes(child.status))
        throw new Error('Terminal Venue and Equipment components cannot be updated.');
      if (Number(command.expectedRevision) !== Number(child.revision ?? 1))
        throw new Error('Venue and Equipment component changed; refresh before updating.');
      const venueEquipment = updateVenueEquipmentWorkflow(
        child.payload?.venueEquipment,
        command.patch ?? {},
      );
      if (venueEquipment.fulfillmentEvidenceId) {
        const evidenceUploaded = (getState()?.evidenceFiles ?? []).some(
          (evidence) => {
            const evidenceType =
              evidence.evidenceType ?? evidence.metadata?.evidenceType ?? evidence.folderType;
            const uploadStatus =
              evidence.uploadStatus ??
              evidence.metadata?.uploadStatus ??
              (evidence.driveFileId ? 'UPLOADED' : '');
            return (
              evidence.id === venueEquipment.fulfillmentEvidenceId &&
              evidenceType === 'VENUE_EQUIPMENT_CONFIRMATION' &&
              uploadStatus === 'UPLOADED' &&
              (evidence.relatedEntityType ?? evidence.metadata?.relatedEntityType) ===
                'COMPOSITE_COMPONENT' &&
              (evidence.relatedEntityId ??
                evidence.relatedId ??
                evidence.metadata?.relatedEntityId) === child.componentId
            );
          },
        );
        if (!evidenceUploaded)
          throw new Error('Venue and Equipment evidence must be uploaded and linked to this component.');
      }
      child.payload = { ...(child.payload ?? {}), venueEquipment };
      child.attentionFlags = venueEquipmentAttentionFlags(venueEquipment);
      child.revision = Number(child.revision ?? 1) + 1;
      child.updatedAt = new Date().toISOString();
      return {
        requestId: child.requestId,
        componentId: child.componentId,
        revision: child.revision,
        venueEquipment,
      };
    };
  };

  const renderVenueEquipmentLines = () => {
    const container = document.querySelector('[data-venue-equipment-selected]');
    const form = document.querySelector('#compositeRequestForm');
    if (!container || !form) return;
    container.innerHTML = venueEquipmentLines.length
      ? venueEquipmentLines
          .map(
            (line, index) =>
              `<div class="request-line"><div><strong>${esc(line.label)}</strong><small>${esc(line.referenceId || 'Controlled Other')} &middot; ${esc(line.category.replaceAll('_', ' '))} &middot; ${esc(line.unit)}</small><span>${line.referenceId ? 'Requestable - confirmation required; not a booking guarantee' : 'Pending classification - no booking or stock promise'}</span></div><div class="request-line-actions"><label>Quantity<input type="number" min="1" step="1" value="${esc(line.quantity)}" data-venue-equipment-quantity="${index}" aria-label="Quantity for ${esc(line.label)}"></label><button class="ghost mini" type="button" data-venue-equipment-remove="${index}">Remove</button></div></div>`,
          )
          .join('')
      : '<div class="empty">Search and add a requestable venue or equipment reference, or add a constrained Other line.</div>';
    const first = venueEquipmentLines[0];
    form.elements.venueEquipmentLine.value = first?.label ?? '';
    form.elements.venueEquipmentQuantity.value = first?.quantity ?? 1;
    form.elements.venueEquipmentUnit.value = first?.unit ?? 'service';
  };

  const renderVenueEquipmentSearch = (error = '') => {
    const container = document.querySelector('[data-venue-equipment-results]');
    const input = document.querySelector('[name="venueEquipmentSearch"]');
    if (!container) return;
    input?.setAttribute('aria-expanded', String(Boolean(input.value.trim())));
    if (error) {
      container.innerHTML = `<div class="alert">${esc(error)}</div>`;
      return;
    }
    container.innerHTML = venueEquipmentSearchResults.length
      ? venueEquipmentSearchResults
          .reduce((rows, reference, index, references) => {
            const group = `${reference.type}|${reference.category}`;
            const previous = index ? `${references[index - 1].type}|${references[index - 1].category}` : '';
            if (group !== previous)
              rows.push(
                `<p class="eyebrow">${esc(reference.type)} &middot; ${esc(reference.category.replaceAll('_', ' '))}</p>`,
              );
            rows.push(
              `<button class="suggestion" type="button" role="option" data-venue-equipment-reference="${esc(reference.id)}"><strong>${esc(reference.name)}</strong><code>${esc(reference.id)} &middot; ${esc(reference.type)} &middot; ${esc(reference.category.replaceAll('_', ' '))}</code><span class="stock">${esc(reference.location || 'Location confirmed during review')} &middot; ${esc(reference.requestabilityLabel)}</span></button>`,
            );
            return rows;
          }, [])
          .join('')
      : '<div class="empty">No matching active requestable references.</div>';
  };

  const searchVenueEquipment = async () => {
    const form = document.querySelector('#compositeRequestForm');
    if (!form || typeof services.searchVenueEquipmentReferences !== 'function') return;
    const query = form.elements.venueEquipmentSearch?.value?.trim() ?? '';
    if (!query) {
      venueEquipmentSearchResults = [];
      renderVenueEquipmentSearch();
      return;
    }
    try {
      const result = await services.searchVenueEquipmentReferences({
        query,
        type: form.elements.venueEquipmentTypeFilter?.value ?? '',
        category: form.elements.venueEquipmentCategoryFilter?.value ?? '',
        limit: 20,
      });
      venueEquipmentSearchResults = result?.items ?? result ?? [];
      renderVenueEquipmentSearch();
    } catch (error) {
      venueEquipmentSearchResults = [];
      renderVenueEquipmentSearch(error.message);
    }
  };

  const venueEquipmentFormPayload = () => {
    const form = document.querySelector('#compositeRequestForm');
    if (!form) return null;
    const event = (getState()?.events ?? []).find((entry) => entry.id === form.elements.eventId?.value);
    const toManilaIso = (value) => (value ? `${value}:00+08:00` : '');
    return {
      purposeDetail: form.elements.venueEquipmentPurposeDetail?.value,
      scheduleStartAt:
        toManilaIso(form.elements.venueEquipmentScheduleStartAt?.value) || event?.startAt || '',
      scheduleEndAt:
        toManilaIso(form.elements.venueEquipmentScheduleEndAt?.value) || event?.endAt || '',
    };
  };

  const refreshVenueEquipmentQueue = async ({ force = false } = {}) => {
    const committeeIds = venueEquipmentCommitteeIds();
    if (!venueEquipmentQueue || !committeeIds.length || typeof services.getVenueEquipmentWorkQueue !== 'function')
      return;
    if (venueEquipmentQueuePromise) return venueEquipmentQueuePromise;
    if (!force && venueEquipmentQueueItems !== null) return;
    venueEquipmentQueuePromise = (async () => {
      const responses = await Promise.all(
        committeeIds.map((committeeId) => services.getVenueEquipmentWorkQueue({ committeeId })),
      );
      const byComponent = new Map();
      responses.forEach((response) =>
        (response?.items ?? []).forEach((item) => byComponent.set(item.componentId, item)),
      );
      venueEquipmentQueueItems = [...byComponent.values()];
      renderVenueEquipmentQueue();
    })();
    try {
      await venueEquipmentQueuePromise;
    } catch (error) {
      venueEquipmentQueueItems = [];
      renderVenueEquipmentQueue(error.message);
    } finally {
      venueEquipmentQueuePromise = null;
    }
  };

  const renderVenueEquipmentQueue = (error = '') => {
    if (!venueEquipmentQueue) return;
    const items = venueEquipmentQueueItems ?? [];
    venueEquipmentQueue.innerHTML = `<div class="panel-head"><div><p class="eyebrow">Effective-dated routing</p><h3 id="venueEquipmentQueueTitle">Scoped Venue &amp; Equipment work queue</h3><p>Requestability permits review; it never promises a booking, stock, or approval.</p></div><span class="pill">${items.length} item${items.length === 1 ? '' : 's'}</span></div>${error ? `<div class="alert">${esc(error)}</div>` : ''}<div class="line-list">${items
      .map(
        (item) =>
          `<div class="request-line"><div><strong>${esc(item.componentId)}</strong><small>${esc(item.ownerCommitteeId)} &middot; ${esc(item.venueEquipment?.confirmationStatus || 'PENDING_CONFIRMATION')} &middot; ${esc(item.lines?.length || 0)} line(s)</small></div><div class="request-line-actions"><span class="pill">${esc(item.status || 'FOR_REVIEW')}</span>${['COMPLETED', 'REJECTED', 'CANCELLED'].includes(item.status) ? '' : `<button class="secondary mini" type="button" data-venue-equipment-manage="${esc(item.componentId)}">Manage</button>`}</div></div>`,
      )
      .join('') || '<div class="empty">No Venue &amp; Equipment work is in the current authorized scope.</div>'}</div>`;
  };

  const openVenueEquipmentWorkflow = (componentId) => {
    const item = (venueEquipmentQueueItems ?? []).find((entry) => entry.componentId === componentId);
    if (!item) return;
    const details = item.venueEquipment ?? {};
    openModal(
      `Manage Venue & Equipment ${item.componentId}`,
      `<form id="venueEquipmentWorkflowForm"><div class="mode-note">Record the authoritative confirmation and controlled obligations. Requestability is not a booking guarantee.</div><div class="form-grid" style="margin-top:14px"><label>Confirmation status<select name="confirmationStatus">${option('PENDING_CONFIRMATION', 'Pending confirmation', details.confirmationStatus)}${option('CONFIRMED', 'Confirmed', details.confirmationStatus)}${option('DECLINED', 'Declined', details.confirmationStatus)}</select></label><label>Confirmation reference<input name="confirmationReference" maxlength="120" value="${esc(details.confirmationReference ?? '')}"></label><label>Other triage<select name="otherTriageStatus" ${details.otherTriageStatus === 'NOT_REQUIRED' ? 'disabled' : ''}>${option('NOT_REQUIRED', 'Not required', details.otherTriageStatus)}${option('PENDING_CLASSIFICATION', 'Pending classification', details.otherTriageStatus)}${option('APPROVED_AS_SPECIFIED', 'Approved as specified', details.otherTriageStatus)}</select></label><label>Other disposition<input name="otherTriageReason" maxlength="500" value="${esc(details.otherTriageReason ?? '')}" ${details.otherTriageStatus === 'NOT_REQUIRED' ? 'disabled' : ''}></label><label>Blocker status<select name="blockerStatus">${option('NONE', 'No blocker', details.blockerStatus)}${option('BLOCKED', 'Blocked', details.blockerStatus)}</select></label><label>Blocker reason<input name="blockerReason" maxlength="500" value="${esc(details.blockerReason ?? '')}"></label><label>Return status<select name="returnStatus" ${details.returnRequired ? '' : 'disabled'}>${option('NOT_REQUIRED', 'Not required', details.returnStatus)}${option('PENDING_RETURN', 'Pending return', details.returnStatus)}${option('RETURNED', 'Returned', details.returnStatus)}</select></label><label class="span-2">Confirmation evidence (optional)<input name="fulfillmentEvidence" type="file" accept="image/jpeg,image/png,image/webp,application/pdf"><small>${details.fulfillmentEvidenceId ? `Linked evidence: ${esc(details.fulfillmentEvidenceId)}` : 'Uploaded component confirmation evidence is required before completion.'}</small></label></div><button class="primary" type="submit">Save Venue &amp; Equipment Workflow</button></form>`,
      (modal) => {
        const form = modal.querySelector('#venueEquipmentWorkflowForm');
        form.addEventListener('submit', async (event) => {
          event.preventDefault();
          if (!form.reportValidity()) return;
          const button = form.querySelector('[type="submit"]');
          button.disabled = true;
          button.textContent = 'Saving...';
          try {
            const values = Object.fromEntries(new FormData(form).entries());
            let fulfillmentEvidenceId = details.fulfillmentEvidenceId ?? '';
            const file = form.elements.fulfillmentEvidence.files?.[0];
            if (file) {
              if (typeof services.uploadEvidenceFile !== 'function')
                throw new Error('Evidence upload is unavailable.');
              const evidence = await services.uploadEvidenceFile(file, {
                evidenceType: 'VENUE_EQUIPMENT_CONFIRMATION',
                relatedEntityType: 'COMPOSITE_COMPONENT',
                relatedEntityId: item.componentId,
                requestId: item.requestId,
              });
              fulfillmentEvidenceId = evidence.id;
            }
            const result = await services.updateVenueEquipmentComponent({
              requestId: item.requestId,
              componentId: item.componentId,
              expectedRevision: item.revision,
              patch: {
                confirmationStatus: values.confirmationStatus,
                confirmationReference: values.confirmationReference,
                otherTriageStatus: details.otherTriageStatus === 'NOT_REQUIRED' ? 'NOT_REQUIRED' : values.otherTriageStatus,
                otherTriageReason: details.otherTriageStatus === 'NOT_REQUIRED' ? '' : values.otherTriageReason,
                blockerStatus: values.blockerStatus,
                blockerReason: values.blockerReason,
                returnStatus: details.returnRequired ? values.returnStatus : 'NOT_REQUIRED',
                fulfillmentEvidenceId,
              },
              reason: 'Venue and Equipment workflow updated from the scoped queue',
              idempotencyKey: `venue-equipment-update-${item.componentId}-${item.revision}`,
            });
            markFormClean(form);
            closeModal();
            await commit(`${item.componentId} Venue & Equipment workflow updated.`, 'success', result);
            await refreshVenueEquipmentQueue({ force: true });
          } catch (error) {
            toast(`${error.message}${error.correlationId ? ` - ${error.correlationId}` : ''}`, true);
            button.disabled = false;
            button.textContent = 'Save Venue & Equipment Workflow';
          }
        });
      },
    );
  };

  const installVenueEquipmentWorkflow = () => {
    const section = document.querySelector('[data-composite-section="VENUE_EQUIPMENT"]');
    const fields = section?.querySelector('[data-composite-fields]');
    const toggle = section?.querySelector('[data-composite-toggle]');
    const form = document.querySelector('#compositeRequestForm');
    if (!section || !fields || !toggle || !form) return;
    if (!venueEquipmentRequestsEnabled) {
      toggle.disabled = true;
      section.insertAdjacentHTML(
        'beforeend',
        '<p class="muted">Venue &amp; Equipment specialization is disabled for new submissions.</p>',
      );
    }
    for (const name of ['venueEquipmentLine', 'venueEquipmentQuantity', 'venueEquipmentUnit'])
      form.elements[name]?.closest('label')?.setAttribute('hidden', '');
    if (!fields.querySelector('[name="venueEquipmentSearch"]'))
      fields.insertAdjacentHTML(
        'beforeend',
        `<label>Reference type<select name="venueEquipmentTypeFilter"><option value="">Venue and equipment</option><option value="VENUE">Venue</option><option value="EQUIPMENT">Equipment</option></select></label>
        <label>Controlled category<select name="venueEquipmentCategoryFilter"><option value="">All categories</option>${['MEETING_SPACE', 'EVENT_SPACE', 'AUDIO_VISUAL', 'FURNITURE', 'LOGISTICS_SUPPORT', 'OTHER_CONTROLLED'].map((category) => `<option value="${category}">${category.replaceAll('_', ' ')}</option>`).join('')}</select></label>
        <label class="span-2">Search approved references<input name="venueEquipmentSearch" autocomplete="off" role="combobox" aria-autocomplete="list" aria-controls="venueEquipmentReferenceResults" aria-expanded="false" placeholder="Search canonical name, alias, category, or location"><small>Results show requestability only. Confirmation is still required.</small></label>
        <div id="venueEquipmentReferenceResults" class="autocomplete-panel show span-2" role="listbox" data-venue-equipment-results><div class="empty">Enter a search term.</div></div>
        <label>Quantity to add<input name="venueEquipmentAddQuantity" type="number" min="1" step="1" value="1"></label>
        <div class="span-2 line-list" data-venue-equipment-selected></div>
        <details class="span-2"><summary>Add constrained Other</summary><div class="form-grid section-gap"><label class="span-2">Specific description<input name="venueEquipmentOtherDescription" maxlength="240" placeholder="Do not enter only Other"></label><label>Unit<select name="venueEquipmentOtherUnit"><option value="service">Service</option><option value="piece">Piece</option><option value="set">Set</option><option value="unit">Unit</option></select></label><label>Quantity<input name="venueEquipmentOtherQuantity" type="number" min="1" step="1" value="1"></label><button class="secondary" type="button" data-venue-equipment-add-other>Add Other for triage</button></div></details>
        <label class="span-2">Purpose detail<input name="venueEquipmentPurposeDetail" maxlength="500" required></label>
        <label>Schedule start (Manila time)<input name="venueEquipmentScheduleStartAt" type="datetime-local"></label>
        <label>Schedule end (optional)<input name="venueEquipmentScheduleEndAt" type="datetime-local"></label>
        <p class="muted span-2">Routing, owner, lead time, responsible office, and approving authority are resolved by the server from effective-dated records.</p>`,
      );
    renderVenueEquipmentLines();
    let searchTimer = null;
    const scheduleSearch = () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => void searchVenueEquipment(), 150);
    };
    form.elements.venueEquipmentSearch.addEventListener('input', scheduleSearch);
    form.elements.venueEquipmentSearch.addEventListener('keydown', (event) => {
      if (event.key !== 'ArrowDown') return;
      const first = fields.querySelector('[data-venue-equipment-reference]');
      if (!first) return;
      event.preventDefault();
      first.focus();
    });
    form.elements.venueEquipmentTypeFilter.addEventListener('change', scheduleSearch);
    form.elements.venueEquipmentCategoryFilter.addEventListener('change', scheduleSearch);
    fields.addEventListener('click', (event) => {
      const referenceButton = event.target.closest('[data-venue-equipment-reference]');
      if (referenceButton) {
        const reference = venueEquipmentSearchResults.find(
          (entry) => entry.id === referenceButton.dataset.venueEquipmentReference,
        );
        if (!reference) return;
        const quantity = Number(form.elements.venueEquipmentAddQuantity.value || 1);
        const existing = venueEquipmentLines.find((line) => line.referenceId === reference.id);
        if (existing) existing.quantity += quantity;
        else
          venueEquipmentLines.push({
            referenceId: reference.id,
            referenceRevision: reference.referenceRevision,
            label: reference.name,
            quantity,
            unit: reference.unit,
            category: reference.category,
            notes: '',
          });
        renderVenueEquipmentLines();
        return;
      }
      const removeButton = event.target.closest('[data-venue-equipment-remove]');
      if (removeButton) {
        venueEquipmentLines.splice(Number(removeButton.dataset.venueEquipmentRemove), 1);
        renderVenueEquipmentLines();
        return;
      }
      if (event.target.closest('[data-venue-equipment-add-other]')) {
        const label = form.elements.venueEquipmentOtherDescription.value.trim();
        if (label.length < 5 || label.toLowerCase() === 'other') {
          toast('Enter a specific description for controlled Other.', true);
          return;
        }
        venueEquipmentLines.push({
          referenceId: '',
          label,
          quantity: Number(form.elements.venueEquipmentOtherQuantity.value || 1),
          unit: form.elements.venueEquipmentOtherUnit.value,
          category: 'OTHER_CONTROLLED',
          notes: '',
        });
        form.elements.venueEquipmentOtherDescription.value = '';
        renderVenueEquipmentLines();
      }
    });
    fields.addEventListener('input', (event) => {
      const index = event.target.dataset.venueEquipmentQuantity;
      if (index == null) return;
      venueEquipmentLines[Number(index)].quantity = Math.max(1, Number(event.target.value || 1));
      const first = venueEquipmentLines[0];
      form.elements.venueEquipmentQuantity.value = first?.quantity ?? 1;
    });
    form.addEventListener('reset', () =>
      setTimeout(() => {
        venueEquipmentLines = [];
        venueEquipmentSearchResults = [];
        renderVenueEquipmentLines();
        renderVenueEquipmentSearch();
      }, 0),
    );
    const originalSubmit = services.submitCompositeRequest.bind(services);
    services.submitCompositeRequest = async (payload) => {
      const enriched = structuredClone(payload);
      const replayExists =
        backendMode === 'mock' &&
        (getState()?.compositeRequests ?? []).some(
          (request) => request.idempotencyKey === enriched.idempotencyKey,
        );
      if (replayExists) return originalSubmit({ idempotencyKey: enriched.idempotencyKey });
      const sectionDraft = enriched.sections?.find((entry) => entry.type === 'VENUE_EQUIPMENT');
      let normalizedVenueEquipment = null;
      if (sectionDraft) {
        if (!venueEquipmentLines.length)
          throw new Error('Add at least one approved reference or constrained Other line.');
        sectionDraft.lines = structuredClone(venueEquipmentLines);
        sectionDraft.venueEquipment = venueEquipmentFormPayload();
        enriched.submittedAt = new Date().toISOString();
        if (backendMode === 'mock') {
          const event = (getState()?.events ?? []).find((entry) => entry.id === enriched.eventId);
          normalizedVenueEquipment = normalizeVenueEquipmentDetails(
            sectionDraft.venueEquipment,
            sectionDraft.lines,
            {
              submittedAt: enriched.submittedAt,
              eventStartAt: event?.startAt,
              eventEndAt: event?.endAt,
              ...localVenueEquipmentResolvers(enriched.submittedAt),
            },
          );
        }
      }
      const result = await originalSubmit(enriched);
      if (backendMode === 'mock' && normalizedVenueEquipment) {
        const requestId = result.requestId || result.request?.requestId;
        const child = (getState()?.compositeComponents ?? []).find(
          (entry) => entry.requestId === requestId && entry.componentType === 'VENUE_EQUIPMENT',
        );
        if (child) {
          const { lines, ...venueEquipment } = normalizedVenueEquipment;
          child.payload = { notes: '', lines, venueEquipment };
          child.lines = lines;
          child.ownerCommitteeId = venueEquipment.ownerCommitteeId;
          child.ownerUserId = venueEquipment.ownerUserId;
          child.attentionFlags = venueEquipmentAttentionFlags(venueEquipment);
        }
      }
      await refreshVenueEquipmentQueue({ force: true });
      return result;
    };
    if (!isRequestOnly() && venueEquipmentCommitteeIds().length) {
      venueEquipmentQueue = document.createElement('article');
      venueEquipmentQueue.id = 'venueEquipmentQueue';
      venueEquipmentQueue.className = 'panel section-gap';
      venueEquipmentQueue.setAttribute('aria-labelledby', 'venueEquipmentQueueTitle');
      (materialsQueue ?? section.closest('#compositeRequestPanel'))?.after(venueEquipmentQueue);
      venueEquipmentQueue.addEventListener('click', (event) => {
        const button = event.target.closest('[data-venue-equipment-manage]');
        if (button) openVenueEquipmentWorkflow(button.dataset.venueEquipmentManage);
      });
      void refreshVenueEquipmentQueue();
    }
  };

  const cleanAbandonedForms = () => {
    const modalOpen = document.querySelector('#modalBackdrop')?.classList.contains('show');
    for (const form of dirtyForms) {
      if (!form.isConnected || (!modalOpen && form.closest('#modal'))) dirtyForms.delete(form);
    }
  };
  const isDirty = () => {
    cleanAbandonedForms();
    return (
      dirtyForms.size > 0 ||
      document.querySelector('#modalBackdrop')?.classList.contains('show') ||
      hasUnsavedRuntimeState()
    );
  };
  const setSyncStatus = (status, detail = {}) => {
    if (!syncIndicator) return;
    const updatedAt = detail?.revision?.updatedAt || detail?.lastUpdatedAt || '';
    if (updatedAt) lastUpdatedAt = updatedAt;
    syncIndicator.dataset.syncStatus = status;
    const timestamp = lastUpdatedAt ? new Date(lastUpdatedAt) : null;
    const suffix = timestamp && !Number.isNaN(timestamp.getTime())
      ? ` · ${timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
      : '';
    syncIndicator.textContent = `${statusText[status] ?? statusText.delayed}${suffix}`;
    syncIndicator.title = lastUpdatedAt
      ? `Last successful update: ${lastUpdatedAt}`
      : 'No successful near-live update recorded yet.';
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
  const acceptScopedRevision = (revision) => {
    if (!revision?.scope) return;
    acceptedRevisions.set(revision.scope, revision);
    if (revision.updatedAt) lastUpdatedAt = revision.updatedAt;
  };
  const refreshAuthoritative = async (reason = 'manual', revision = pendingRevision) => {
    if (refreshPromise) return refreshPromise;
    refreshPromise = (async () => {
      setSyncStatus('checking');
      if (typeof refreshActiveModule === 'function') {
        const scope = revision?.scope || getActiveModule();
        const result = await refreshActiveModule({ scope, reason });
        if (result?.ignored) return false;
      } else {
        const next = await loadAuthoritativeState(isRequestOnly());
        acceptState(next);
      }
      if (revision) acceptScopedRevision(revision);
      pendingRevision = null;
      markAllClean();
      hideBanner();
      setSyncStatus('synced', { revision });
      return { scope: revision?.scope || getActiveModule(), reason };
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
      void refreshAuthoritative('manual').catch((error) => {
        showBanner(`Refresh failed. ${error.message}`, { failure: true });
      });
    });
    updateBanner.querySelector('[data-sync-refresh]').addEventListener('click', async () => {
      try {
        await refreshAuthoritative('explicit-refresh', pendingRevision);
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

  const syncSharedMobileNav = () => {
    if (!sharedMobileNav) return;
    const activeView = document.querySelector('#primaryNav [data-view].active')?.dataset.view;
    sharedMobileNav.querySelectorAll('[data-shared-mobile-view]').forEach((button) => {
      const active = button.dataset.sharedMobileView === activeView;
      button.classList.toggle('active', active);
      button.toggleAttribute('aria-current', active);
    });
  };

  const closeSharedMobileMore = () => {
    if (!sharedMobileMore) return;
    sharedMobileMore.hidden = true;
    sharedMobileNav?.querySelector('[data-shared-mobile-more]')?.setAttribute('aria-expanded', 'false');
  };

  const installSharedMobileNav = () => {
    if (isRequestOnly() || sharedMobileNav || document.querySelector('[data-shared-mobile-nav]')) return;
    const primaryNav = document.querySelector('#primaryNav');
    if (!primaryNav) return;
    const views = [
      ['overview', 'Overview', '⌂'],
      ['request', 'Request', '+'],
      ['lending', 'Lending', '⇄'],
      ['release', 'Release', '✓'],
      ['more', 'More', '•••'],
    ];
    sharedMobileNav = document.createElement('nav');
    sharedMobileNav.className = 'shared-mobile-nav';
    sharedMobileNav.dataset.sharedMobileNav = '';
    sharedMobileNav.setAttribute('aria-label', 'Primary navigation');
    sharedMobileNav.innerHTML = views
      .map(
        ([view, label, icon]) => view === 'more'
          ? `<button type="button" data-shared-mobile-more aria-expanded="false" aria-controls="sharedMobileMore"><span aria-hidden="true">${icon}</span><small>${label}</small></button>`
          : `<button type="button" data-shared-mobile-view="${view}" aria-label="Open ${label}"><span aria-hidden="true">${icon}</span><small>${label}</small></button>`,
      )
      .join('');
    const primaryViews = new Set(views.map(([view]) => view));
    const moreItems = [...primaryNav.querySelectorAll('button')]
      .filter((button) => !primaryViews.has(button.dataset.view))
      .map((button) => {
        const view = button.dataset.view;
        const adminView = button.dataset.adminView;
        const label = button.querySelector('.nav-copy')?.textContent?.trim() || button.textContent.trim();
        return `<button type="button" ${view ? `data-shared-more-view="${view}"` : ''} ${adminView ? `data-shared-more-admin="${adminView}"` : ''}>${label}</button>`;
      })
      .join('');
    sharedMobileMore = document.createElement('section');
    sharedMobileMore.id = 'sharedMobileMore';
    sharedMobileMore.className = 'shared-mobile-more';
    sharedMobileMore.hidden = true;
    sharedMobileMore.setAttribute('aria-label', 'More logistics modules');
    sharedMobileMore.innerHTML = `<div class="shared-mobile-more-head"><strong>More logistics modules</strong><button type="button" class="icon-button" data-shared-mobile-close aria-label="Close more navigation">×</button></div>${moreItems}`;
    sharedMobileNav.addEventListener('click', (event) => {
      const button = event.target.closest('[data-shared-mobile-view]');
      if (!button) return;
      primaryNav.querySelector(`[data-view="${button.dataset.sharedMobileView}"]`)?.click();
    });
    sharedMobileNav.querySelector('[data-shared-mobile-more]').addEventListener('click', () => {
      sharedMobileMore.hidden = false;
      sharedMobileNav.querySelector('[data-shared-mobile-more]').setAttribute('aria-expanded', 'true');
      sharedMobileMore.querySelector('button:not([data-shared-mobile-close])')?.focus();
    });
    sharedMobileMore.addEventListener('click', (event) => {
      const close = event.target.closest('[data-shared-mobile-close]');
      if (close) return closeSharedMobileMore();
      const button = event.target.closest('[data-shared-more-view], [data-shared-more-admin]');
      if (!button) return;
      if (button.dataset.sharedMoreView)
        primaryNav.querySelector(`[data-view="${button.dataset.sharedMoreView}"]`)?.click();
      if (button.dataset.sharedMoreAdmin)
        primaryNav.querySelector(`[data-admin-view="${button.dataset.sharedMoreAdmin}"]`)?.click();
      closeSharedMobileMore();
    });
    document.body.append(sharedMobileNav, sharedMobileMore);
    syncSharedMobileNav();
  };

  const normalizedExperience = () => {
    const value = String(document.body.dataset.experience ?? '').trim().toLowerCase();
    return {
      admin: 'administrator',
      inventory: 'inventory-pantry',
    }[value] ?? value;
  };

  const roleExperienceDefinitions = {
    director: {
      label: 'Director workspace',
      heading: 'Decisions, readiness, and cross-committee blockers',
      description:
        'Lead from the shared operational picture: review exceptions, compare committee progress, and open the existing request, procurement, release, lending, or inventory workspace for the governed next action.',
      boundaryTitle: 'Bounded Management & Access',
      boundary:
        'Director visibility supports event structure and leadership decisions. Access, configuration, and environment changes remain in the existing server-authorized administration boundary.',
      actions: [
        ['request', 'Review cross-committee requests', 'Requests awaiting review and committee routing'],
        ['procurement', 'Resolve procurement blockers', 'Canvassing, budget, receiving, and deliverables'],
        ['release', 'Check release readiness', 'Controlled handoffs and recipient confirmation'],
        ['lending', 'Review lending exceptions', 'For-review, overdue, handoff, and return context'],
        ['inventory', 'Inspect inventory attention', 'Low stock, reservations, and movement history'],
      ],
    },
    food: {
      label: 'Food Committee workspace',
      heading: 'Keep every meal, deadline, and handoff on time',
      description:
        'Work deadline-first across food requests, canvassing and procurement context, cumulative receiving, and controlled release while keeping event and distribution timing visible.',
      boundaryTitle: 'Food capability boundary',
      boundary:
        'Food ownership scopes the queue and context. Procurement, receiving, evidence, and Release Desk actions remain available only through existing capabilities and server-side validation.',
      actions: [
        ['request', 'Open the food request queue', 'Food requirements, quantities, purpose, and event deadlines'],
        ['procurement', 'Review food sourcing', 'Canvassing, supplier references, budgets, and receiving'],
        ['release', 'Open controlled distribution', 'Recipient confirmation and approved release evidence'],
        ['inventory', 'Check stock context', 'Available stock and movement history before fulfillment'],
      ],
    },
  };

  const countStatuses = (rows, statuses) =>
    (rows ?? []).filter((row) => statuses.has(String(row?.status ?? '').toUpperCase())).length;

  const directorMetrics = (state) => {
    const activeSeries = (state.eventSeries ?? []).filter(
      (series) => !['COMPLETED', 'ARCHIVED', 'CANCELLED'].includes(String(series?.status ?? '').toUpperCase()),
    ).length;
    const decisions =
      countStatuses(state.requests, new Set(['FOR_REVIEW', 'NEEDS_INFORMATION'])) +
      countStatuses(state.deliverables, new Set(['FOR_REVIEW']));
    const blockers =
      countStatuses(state.requests, new Set(['BLOCKED', 'WAITING_FOR_BUDGET', 'NEEDS_INFORMATION'])) +
      countStatuses(state.deliverables, new Set(['BLOCKED', 'WAITING_FOR_BUDGET'])) +
      countStatuses(state.lendingTickets, new Set(['OVERDUE']));
    const readyToRelease =
      countStatuses(state.requestLines, new Set(['READY_TO_RELEASE'])) +
      countStatuses(state.deliverables, new Set(['READY_TO_RELEASE']));
    return [
      ['Active event series', activeSeries, 'Readiness and upcoming deadlines'],
      ['Leadership decisions', decisions, 'Review or missing-information items'],
      ['Cross-workflow blockers', blockers, 'Budget, information, and overdue exceptions'],
      ['Ready to release', readyToRelease, 'Items eligible for controlled handoff'],
    ];
  };

  const foodMetrics = (state) => {
    const foodOwned = (row) =>
      [row?.ownerCommitteeId, row?.assignedCommittee, row?.committeeId, row?.committee]
        .filter(Boolean)
        .some((value) => String(value).toUpperCase().includes('FOOD')) ||
      String(row?.componentType ?? row?.type ?? '').toUpperCase() === 'FOOD';
    const rows = [
      ...(state.compositeComponents ?? []),
      ...(state.deliverables ?? []),
      ...(state.requests ?? []),
    ].filter(foodOwned);
    const active = rows.filter(
      (row) => !['COMPLETED', 'REJECTED', 'CANCELLED', 'ARCHIVED'].includes(String(row?.status ?? '').toUpperCase()),
    );
    const sourcing = countStatuses(
      active,
      new Set(['FOR_CANVASSING', 'WAITING_FOR_BUDGET', 'TO_BE_PROCURED', 'PROCURED']),
    );
    const receiving = countStatuses(active, new Set(['RECEIVING', 'PARTIALLY_RECEIVED']));
    const ready = countStatuses(active, new Set(['READY_TO_RELEASE']));
    return [
      ['Active food lines', active.length, 'All current food requirements'],
      ['Sourcing and budget', sourcing, 'Canvassing through procurement'],
      ['Receiving attention', receiving, 'Cumulative quantity and evidence checks'],
      ['Ready to distribute', ready, 'Capability-bound Release Desk handoffs'],
    ];
  };

  const metricsForExperience = (experience, state) => ({
    director: directorMetrics,
    food: foodMetrics,
  }[experience]?.(state) ?? []);

  const installRoleExperience = () => {
    if (isRequestOnly() || document.querySelector('#roleExperiencePanel')) return;
    const overviewHero = document.querySelector('#overview > .hero');
    if (!overviewHero) return;
    const panel = document.createElement('section');
    panel.id = 'roleExperiencePanel';
    panel.className = 'role-experience panel section-gap';
    panel.hidden = true;
    panel.setAttribute('aria-live', 'polite');
    overviewHero.after(panel);
    if (!roleExperienceObserver) {
      roleExperienceObserver = new MutationObserver(() => renderRoleExperience());
      roleExperienceObserver.observe(document.body, {
        attributes: true,
        attributeFilter: ['data-experience'],
      });
    }
  };

  const renderRoleExperience = () => {
    installRoleExperience();
    const panel = document.querySelector('#roleExperiencePanel');
    if (!panel) return;
    const experience = normalizedExperience();
    const definition = roleExperienceDefinitions[experience];
    panel.hidden = !definition;
    if (!definition) return;
    const state = getState() ?? {};
    const metrics = metricsForExperience(experience, state);
    panel.dataset.roleExperience = experience;
    panel.innerHTML = `<div class="role-experience-head">
      <div>
        <p class="role-experience-kicker">${esc(definition.label)} &middot; source-grounded role view</p>
        <h2 id="roleExperienceTitle">${esc(definition.heading)}</h2>
        <p>${esc(definition.description)}</p>
      </div>
      <span class="role-experience-badge">Role-scoped overview</span>
    </div>
    <div class="role-experience-metrics">
      ${metrics.map(([label, value, note]) => `<article><span>${esc(label)}</span><strong>${esc(value)}</strong><small>${esc(note)}</small></article>`).join('')}
    </div>
    <div class="role-experience-layout">
      <section aria-labelledby="roleExperienceActionsTitle">
        <div class="section-kicker" id="roleExperienceActionsTitle">Leadership action map</div>
        <div class="role-experience-actions">
          ${definition.actions.map(([view, title, detail]) => `<button type="button" data-go="${esc(view)}"><span>${esc(title)}</span><small>${esc(detail)}</small><b aria-hidden="true">&rarr;</b></button>`).join('')}
        </div>
      </section>
      <aside class="role-experience-boundary" aria-label="${esc(definition.boundaryTitle)}">
        <span>Authority boundary</span>
        <h3>${esc(definition.boundaryTitle)}</h3>
        <p>${esc(definition.boundary)}</p>
      </aside>
    </div>`;
  };

  const install = () => {
    installLocalFoodServices();
    installLocalMaterialsServices();
    installLocalVenueEquipmentServices();
    installLocalReferenceAdminServices();
    installFoodWorkflow();
    installMaterialsWorkflow();
    installVenueEquipmentWorkflow();
    installReferenceAdminWorkspace();
    installRoleExperience();
    renderRoleExperience();
    installSharedMobileNav();
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
    ['pointerdown', 'keydown'].forEach((eventName) => {
      document.addEventListener(eventName, () => { lastActiveAt = Date.now(); }, { passive: true });
    });
    afterRender();
  };

  const afterRender = () => {
    syncSharedMobileNav();
    renderRoleExperience();
    lending?.setItems(getState()?.inventoryItems ?? []);
    const catalogButton = document.querySelector('#adminCatalogException');
    if (catalogButton) {
      const allowed = canManageCatalog(getState()?.currentUser);
      catalogButton.hidden = !allowed;
      catalogButton.disabled = !allowed;
      catalogButton.setAttribute('aria-hidden', String(!allowed));
    }
    renderFoodQueue();
    renderMaterialsQueue();
    renderVenueEquipmentQueue();
    if (document.querySelector('#referenceAdminWorkspace')?.closest('.view.active')) {
      installReferenceAdminWorkspace();
      void refreshReferenceAdminWorkspace();
    }
  };

  const start = () => {
    if (isRequestOnly() || backendMode !== 'apps-script' || typeof services.getScopedRevision !== 'function')
      return;
    poller = createRevisionPoller({
      readRevision: (scope) => services.getScopedRevision(scope),
      getScope: () => getActiveModule(),
      isVisible: () => document.visibilityState === 'visible',
      isOnline: () => navigator.onLine,
      isActive: () => document.hasFocus() || Date.now() - lastActiveAt <= 60_000,
      onStatus: setSyncStatus,
      onRevision: async (incoming) => {
        const accepted = acceptedRevisions.get(incoming.scope) || { scope: incoming.scope, token: 0 };
        if (!revisionChanged(accepted, incoming)) {
          acceptScopedRevision(incoming);
          return true;
        }
        pendingRevision = incoming;
        if (isDirty()) {
          showBanner('New operational data is available.');
          return false;
        }
        return (await refreshAuthoritative('poll', incoming)) !== false;
      },
    });
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') void poller.resume('visible');
      else poller.pause('delayed');
    });
    window.addEventListener('focus', () => {
      lastActiveAt = Date.now();
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
    async refreshAfterMutation(result = {}) {
      const scope = getActiveModule();
      const token = Number(result?.dataScopeRevisions?.[scope]);
      const revision = Number.isFinite(token)
        ? normalizeScopedRevisionPayload({
          contract: 'scoped-revision',
          contractVersion: 1,
          enabled: true,
          scope,
          token,
          globalRevision: result.dataRevision,
          updatedAt: result.dataRevisionUpdatedAt,
          environment: getState()?.environment,
          metrics: {},
        }, scope)
        : null;
      return refreshAuthoritative('mutation', revision);
    },
    activeModuleChanged() {
      lastActiveAt = Date.now();
      return poller?.resume('scope-change') ?? Promise.resolve(false);
    },
    acceptModuleRevision(scope, revision) {
      if (!revision || revision.scope !== scope || !Number.isFinite(Number(revision.token))) return false;
      acceptScopedRevision({
        contract: 'scoped-revision',
        contractVersion: 1,
        enabled: true,
        scope,
        token: Math.max(0, Math.floor(Number(revision.token))),
        globalRevision: Number(getState()?.dataRevision || 0),
        updatedAt: String(revision.updatedAt || ''),
        environment: String(getState()?.environment || ''),
        metrics: { revisionReads: 0, moduleReads: 1, requestCount: 1 },
      });
      return true;
    },
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
