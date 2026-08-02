import '../styles/visual/runtime-extensions.css';
import { config } from '../app/config.js';
import { AppError } from '../app/errors.js';
import {
  evaluateLendingEligibility,
  lendingAudienceLabel,
  normalizeHandling,
  rankLendingItems,
  validateLendingSelection,
} from '../domain/circulation-policy.js';
import {
  borrowerIdentityRequirement,
  studentIdInputValue,
  validateBorrowerIdentityApproval,
  validateStudentIdNumber,
} from '../domain/borrower-identity.js';
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
import { USC_DEPARTMENT_REGISTRY } from '../domain/usc-departments.js';
import {
  filterReferenceAdminRecords,
  previewReferenceAdminChange,
} from '../domain/reference-administration.js';
import { canvassEvidenceLinks, canvassQualityIndicators } from '../domain/canvass-quality.js';

const esc = (value) =>
  String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

const option = (value, label, selected) =>
  `<option value="${esc(value)}" ${String(value) === String(selected) ? 'selected' : ''}>${esc(label)}</option>`;

const safeReference = (value) => {
  const reference = String(value ?? '').trim();
  return /^(?:REQ_[A-Za-z0-9_-]{8,64}|INC-[A-Z0-9-]{4,64}|ACCESS_[A-Za-z0-9_-]{4,64})$/u.test(reference)
    ? reference
    : '';
};

const operationalErrorText = (error) => {
  const message = error instanceof AppError ? error.message : 'The service is temporarily unavailable.';
  const reference = safeReference(error?.correlationId);
  return reference ? `${message} Reference: ${reference}` : message;
};

const auditReferenceText = (result) => {
  const reference = safeReference(result?.correlationId);
  return reference ? ` Audit reference: ${reference}.` : '';
};

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
  const studentId = form.elements.studentIdNumber;
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

  studentId.addEventListener('input', () => {
    const next = studentIdInputValue(studentId.value);
    if (studentId.value !== next) studentId.value = next;
  });

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
      const identity = validateStudentIdNumber(studentId.value);
      if (!identity.valid) return identity;
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
    changeOperationalScope = null,
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
  let adminControlSurface = 'reference';
  let accessDirectory = null;
  let accessDirectoryPromise = null;
  let accessDirectoryPage = 1;
  let accessPolicyOptions = null;
  let accessSearchTimer = null;
  let evidenceSystemStatus = null;
  let identityRosterStatus = null;
  let identityRosterDirectory = null;
  let identityRosterPreview = null;
  let identityRosterPage = 1;
  let identityRosterSearchTimer = null;
  let advertisementAdminOpen = false;
  let advertisementDirectory = null;
  let advertisementPage = 1;
  let advertisementSearchTimer = null;
  let brandAssetDirectory = null;
  let lendingUsageReport = null;
  let sharedMobileNav = null;
  let sharedMobileMore = null;
  let roleExperienceObserver = null;
  let inventoryWorkspaceSurface = '';
  let inventoryClassificationDirectory = null;
  let inventoryClassificationPromise = null;
  let inventoryClassificationPage = 1;
  let inventoryClassificationSearch = '';
  let inventoryClassificationStatus = 'NEEDS_CLASSIFICATION';
  let inventoryClassificationKind = 'ALL';
  let inventoryClassificationSearchTimer = null;
  let eventManagementDirectory = null;
  let eventManagementPromise = null;
  let eventManagementOpen = false;
  let internalShellBar = null;
  let accountControlObserver = null;
  let lendingApprovalRoot = null;
  let releaseConfirmationInstalled = false;
  let releaseFormObserver = null;
  let deliverableReceivingInstalled = false;
  const canvassObservedRoots = new WeakSet();
  let lastActiveAt = Date.now();
  let lastUpdatedAt = '';

  const foodRequestsEnabled = config.foodRequestsEnabled === true;
  const materialsRequestsEnabled = config.materialsRequestsEnabled === true;
  const venueEquipmentRequestsEnabled = config.venueEquipmentRequestsEnabled === true;

  const openLendingApproval = (ticketId) => {
    const ticket = (getState()?.lendingTickets ?? []).find((entry) => entry.id === ticketId);
    if (!ticket) {
      toast('Ticket not found.', true);
      return;
    }
    const requirement = borrowerIdentityRequirement(ticket.borrowerType);
    openModal(
      `Approve ${ticket.id}`,
      `<form id="lendingApprovalForm"><div class="mode-note"><strong>${esc(requirement.label)}</strong><br>${esc(requirement.instruction)}</div><label class="checkbox section-gap"><input name="identityVerified" type="checkbox" value="true" required> I completed this approved-source identity check for ${esc(ticket.borrowerName)}.</label><button class="primary" type="submit">Verify Identity and Approve</button></form>`,
      (modal) => {
        const form = modal.querySelector('#lendingApprovalForm');
        form.addEventListener('submit', async (event) => {
          event.preventDefault();
          if (!form.reportValidity()) return;
          const identityVerification = {
            identityVerified: new FormData(form).get('identityVerified'),
            identityVerificationSource: requirement.source,
          };
          const validation = validateBorrowerIdentityApproval({
            borrowerType: ticket.borrowerType,
            ...identityVerification,
          });
          if (!validation.valid) {
            toast(validation.message, true);
            return;
          }
          const button = form.querySelector('[type="submit"]');
          button.disabled = true;
          button.textContent = 'Approvingâ€¦';
          try {
            const result = await services.approveLendingTicket(ticket.id, identityVerification);
            if (backendMode === 'mock') {
              result.identityVerification = {
                source: requirement.source,
                verifiedAt: new Date().toISOString(),
                verifiedBy: getState()?.currentUser?.id ?? 'LOCAL-PREVIEW',
              };
            }
            markFormClean(form);
            closeModal();
            await commit(`Ticket ${ticket.id} is ready to claim.`, 'success', result);
          } catch (error) {
            toast(`${error.message}${error.correlationId ? ` Â· ${error.correlationId}` : ''}`, true);
            button.disabled = false;
            button.textContent = 'Verify Identity and Approve';
          }
        });
      },
    );
  };

  void openLendingApproval;

  const lendingApplicantHtml = (ticket) => `
    <dl class="data-card lending-review-applicant">
      <div><strong>Full name</strong><p>${esc(ticket.borrowerName || 'Not supplied')}</p></div>
      <div><strong>Student ID</strong><p>${esc(ticket.studentIdNumber || 'Not supplied')}</p></div>
      <div><strong>Course / year</strong><p>${esc(ticket.courseYear || 'Not applicable')}</p></div>
      <div><strong>Department</strong><p>${esc(ticket.department || 'Not supplied')}</p></div>
      <div><strong>Contact</strong><p>${esc(ticket.contact || 'Not supplied')}</p></div>
      <div><strong>Email</strong><p>${esc(ticket.email || 'Not supplied')}</p></div>
      <div><strong>Requested dates</strong><p>${esc(ticket.requestedStartAt || 'Not supplied')} to ${esc(ticket.requestedEndAt || ticket.dueAt || 'Not supplied')}</p></div>
      <div><strong>Purpose</strong><p>${esc(ticket.purpose || 'Not supplied')}</p></div>
    </dl>`;

  const openLendingReview = (ticketId, initialDecision = 'APPROVE') => {
    const ticket = (getState()?.lendingTickets ?? []).find((entry) => entry.id === ticketId);
    if (!ticket) return toast('Ticket not found.', true);
    const requirement = borrowerIdentityRequirement(ticket.borrowerType);
    const inventoryItems = (getState()?.inventoryItems ?? []).filter(
      (item) =>
        item.status !== 'ARCHIVED' &&
        item.isLendable !== false &&
        !['NOT_LENDABLE', 'PAUSED', 'MAINTENANCE'].includes(item.lendingStatus),
    );
    const itemOptions = inventoryItems
      .map(
        (item) =>
          `<option value="${esc(item.id)}" ${item.id === ticket.itemId ? 'selected' : ''}>${esc(item.name)} (${esc(item.id)})</option>`,
      )
      .join('');
    openModal(
      `Review ${ticket.id}`,
      `<form id="lendingReviewForm">
        ${lendingApplicantHtml(ticket)}
        <div class="form-grid section-gap">
          <label>Decision<select name="decision">
            <option value="APPROVE">Approve requested item and quantity</option>
            <option value="PARTIAL_APPROVE">Partially approve</option>
            <option value="SUBSTITUTE">Approve a substitute</option>
            <option value="REJECT">Reject</option>
          </select></label>
          <label>Approved quantity<input name="approvedQuantity" type="number" min="0.01" max="${esc(ticket.requestedQuantity || ticket.quantity)}" step="0.01" value="${esc(ticket.requestedQuantity || ticket.quantity)}"></label>
          <label class="span-2" data-substitution-wrap>Substitute item<select name="substitutionItemId">${itemOptions}</select></label>
          <label class="span-2" data-review-reason-wrap>Decision reason<textarea name="reviewReason" maxlength="500"></textarea></label>
          <label class="span-2">Internal review note<textarea name="reviewNotes" maxlength="500"></textarea></label>
        </div>
        <div class="mode-note" data-identity-review><strong>${esc(requirement.label)}</strong><br>${esc(requirement.instruction)}
          <label class="checkbox section-gap"><input name="identityVerified" type="checkbox" value="true"> I completed this approved-source identity check for ${esc(ticket.borrowerName)}.</label>
        </div>
        <fieldset class="section-gap" data-asset-assignment><legend>Traceable asset assignment</legend><div data-asset-options class="line-list"></div></fieldset>
        <button class="primary" type="submit">Record Review Decision</button>
      </form>`,
      (modal) => {
        const form = modal.querySelector('#lendingReviewForm');
        form.elements.decision.value = initialDecision;
        const decisionInput = form.elements.decision;
        const quantityInput = form.elements.approvedQuantity;
        const substitutionWrap = form.querySelector('[data-substitution-wrap]');
        const substitutionInput = form.elements.substitutionItemId;
        const reasonWrap = form.querySelector('[data-review-reason-wrap]');
        const reasonInput = form.elements.reviewReason;
        const identityReview = form.querySelector('[data-identity-review]');
        const identityInput = form.elements.identityVerified;
        const assetAssignment = form.querySelector('[data-asset-assignment]');
        const assetOptions = form.querySelector('[data-asset-options]');
        const renderAssets = () => {
          const itemId = decisionInput.value === 'SUBSTITUTE' ? substitutionInput.value : ticket.itemId;
          const options = (ticket.assetOptions ?? []).filter((asset) => asset.itemId === itemId);
          assetAssignment.hidden = options.length === 0 || decisionInput.value === 'REJECT';
          assetOptions.innerHTML =
            options
              .map(
                (asset) =>
                  `<label class="checkbox"><input name="assetIds" type="checkbox" value="${esc(asset.id)}"> <span><strong>${esc(asset.assetTag || asset.id)}</strong>${asset.serialNumber ? ` · ${esc(asset.serialNumber)}` : ''} · ${esc(asset.condition || 'Condition not recorded')}</span></label>`,
              )
              .join('') || '<div class="empty">No traceable asset assignment is required.</div>';
        };
        const syncDecision = () => {
          const decision = decisionInput.value;
          const rejecting = decision === 'REJECT';
          const substituting = decision === 'SUBSTITUTE';
          substitutionWrap.hidden = !substituting;
          substitutionInput.disabled = !substituting;
          reasonWrap.hidden = decision === 'APPROVE';
          reasonInput.disabled = decision === 'APPROVE';
          reasonInput.required = decision !== 'APPROVE';
          quantityInput.disabled = rejecting;
          quantityInput.required = !rejecting;
          identityReview.hidden = rejecting;
          identityInput.disabled = rejecting;
          identityInput.required = !rejecting;
          renderAssets();
        };
        decisionInput.addEventListener('change', syncDecision);
        substitutionInput.addEventListener('change', renderAssets);
        syncDecision();
        form.addEventListener('submit', async (event) => {
          event.preventDefault();
          if (!form.reportValidity()) return;
          const values = new FormData(form);
          const decision = values.get('decision');
          const identityVerification = {
            identityVerified: values.get('identityVerified'),
            identityVerificationSource: requirement.source,
          };
          if (decision !== 'REJECT') {
            const validation = validateBorrowerIdentityApproval({
              borrowerType: ticket.borrowerType,
              ...identityVerification,
            });
            if (!validation.valid) return toast(validation.message, true);
          }
          const command = {
            decision,
            approvedQuantity: decision === 'REJECT' ? undefined : Number(values.get('approvedQuantity')),
            substitutionItemId: decision === 'SUBSTITUTE' ? values.get('substitutionItemId') : undefined,
            reviewReason: values.get('reviewReason') || '',
            reviewNotes: values.get('reviewNotes') || '',
            assetIds: values.getAll('assetIds'),
            ...(decision === 'REJECT' ? {} : identityVerification),
          };
          const button = form.querySelector('[type="submit"]');
          button.disabled = true;
          button.textContent = 'Recording…';
          try {
            const result = await services.approveLendingTicket(ticket.id, command);
            markFormClean(form);
            closeModal();
            await commit(
              decision === 'REJECT'
                ? `Ticket ${ticket.id} was rejected.`
                : `Ticket ${ticket.id} is ready to claim.`,
              'success',
              result,
            );
          } catch (error) {
            toast(`${error.message}${error.correlationId ? ` · ${error.correlationId}` : ''}`, true);
            button.disabled = false;
            button.textContent = 'Record Review Decision';
          }
        });
      },
    );
  };

  const openLendingHandoff = (ticketId) => {
    const ticket = (getState()?.lendingTickets ?? []).find((entry) => entry.id === ticketId);
    if (!ticket) return toast('Ticket not found.', true);
    const consumable = ticket.ticketType === 'CONSUMABLE';
    openModal(
      `${consumable ? 'Issue' : 'Handoff'} ${ticket.id}`,
      `<form id="lendingHandoffForm">
        ${lendingApplicantHtml(ticket)}
        <div class="form-grid section-gap">
          <label>Condition at handoff<select name="conditionLabel"><option>GOOD</option><option>FAIR</option><option>AS_IS</option></select></label>
          <label class="span-2">Handoff note<textarea name="notes" maxlength="500" required>${consumable ? 'Consumable issue confirmed with recipient.' : 'Reusable item handed off to the named borrower.'}</textarea></label>
        </div>
        <button class="primary" type="submit">${consumable ? 'Confirm Consumable Issue' : 'Confirm Controlled Handoff'}</button>
      </form>`,
      (modal) => {
        const form = modal.querySelector('#lendingHandoffForm');
        form.addEventListener('submit', async (event) => {
          event.preventDefault();
          if (!form.reportValidity()) return;
          const values = Object.fromEntries(new FormData(form).entries());
          const button = form.querySelector('[type="submit"]');
          button.disabled = true;
          try {
            const result = await services.confirmLoanHandoff(ticket.id, values);
            markFormClean(form);
            closeModal();
            await commit(
              consumable ? `Consumable issue ${ticket.id} completed.` : `Handoff ${ticket.id} confirmed.`,
              'success',
              result,
            );
          } catch (error) {
            toast(`${error.message}${error.correlationId ? ` · ${error.correlationId}` : ''}`, true);
            button.disabled = false;
          }
        });
      },
    );
  };

  const openLendingReturn = (ticketId) => {
    const ticket = (getState()?.lendingTickets ?? []).find((entry) => entry.id === ticketId);
    if (!ticket) return toast('Ticket not found.', true);
    openModal(
      `Inspect Return ${ticket.id}`,
      `<form id="lendingReturnForm">
        <div class="mode-note"><strong>${esc(ticket.quantity)} ${esc(ticket.unit)}</strong> must be fully reconciled as returned, lost, or damaged beyond use.</div>
        <div class="form-grid section-gap">
          <label>Inspection condition<select name="conditionLabel"><option>GOOD</option><option>FAIR</option><option>POOR</option><option>DAMAGED</option><option>MAINTENANCE</option><option>LOST</option><option>DAMAGED_BEYOND_USE</option></select></label>
          <label>Returned quantity<input name="returnedQuantity" type="number" min="0" max="${esc(ticket.quantity)}" step="0.01" value="${esc(ticket.quantity)}" required></label>
          <label>Lost quantity<input name="lostQuantity" type="number" min="0" max="${esc(ticket.quantity)}" step="0.01" value="0" required></label>
          <label>Damaged beyond use<input name="damagedBeyondUseQuantity" type="number" min="0" max="${esc(ticket.quantity)}" step="0.01" value="0" required></label>
          <label class="span-2">Inspection note<textarea name="notes" maxlength="500" required>Return inspected and reconciled.</textarea></label>
          <label class="span-2">Governed evidence asset key, when already uploaded<input name="assetEvidenceKey" maxlength="160"></label>
        </div>
        <button class="primary" type="submit">Confirm Return Inspection</button>
      </form>`,
      (modal) => {
        const form = modal.querySelector('#lendingReturnForm');
        form.addEventListener('submit', async (event) => {
          event.preventDefault();
          if (!form.reportValidity()) return;
          const values = Object.fromEntries(new FormData(form).entries());
          const reconciled =
            Number(values.returnedQuantity) +
            Number(values.lostQuantity) +
            Number(values.damagedBeyondUseQuantity);
          if (Math.abs(reconciled - Number(ticket.quantity)) > 0.000001) {
            return toast(
              'Returned, lost, and damaged-beyond-use quantities must equal the quantity on loan.',
              true,
            );
          }
          const button = form.querySelector('[type="submit"]');
          button.disabled = true;
          try {
            const result = await services.confirmReturn(ticket.id, values);
            markFormClean(form);
            closeModal();
            await commit(`Return ${ticket.id} inspected and recorded.`, 'success', result);
          } catch (error) {
            toast(`${error.message}${error.correlationId ? ` · ${error.correlationId}` : ''}`, true);
            button.disabled = false;
          }
        });
      },
    );
  };

  const openLendingDetails = (ticketId) => {
    const ticket = (getState()?.lendingTickets ?? []).find((entry) => entry.id === ticketId);
    if (!ticket) return toast('Ticket not found.', true);
    const history = (ticket.history ?? [])
      .map(
        (entry) =>
          `<article class="request-line"><div><strong>${esc(entry.newStatus)}</strong><small>${esc(entry.changedAt)} · ${esc(entry.changedBy)}</small>${entry.reason ? `<small>${esc(entry.reason)}</small>` : ''}</div></article>`,
      )
      .join('');
    openModal(
      `${ticket.id} · ${ticket.borrowerName}`,
      `${lendingApplicantHtml(ticket)}
       <div class="mode-note section-gap"><strong>Requested</strong><br>${esc(ticket.requestedQuantity || ticket.quantity)} of ${esc(ticket.requestedItemId || ticket.itemId)}<br><strong>Current approved line</strong><br>${esc(ticket.quantity)} of ${esc(ticket.itemId)} · ${esc(ticket.status)}</div>
       <div class="section-kicker section-gap">Review and status history</div>
       <div class="line-list">${history || '<div class="empty">No status history is available.</div>'}</div>`,
    );
  };

  const installLendingApproval = () => {
    const root = document.querySelector('#lendingTickets');
    if (!root || root === lendingApprovalRoot) return;
    lendingApprovalRoot = root;
    root.addEventListener(
      'click',
      (event) => {
        const button = event.target.closest('[data-loan-action]');
        if (!button) return;
        const action = button.dataset.loanAction;
        if (!['approve', 'reject', 'handoff', 'return', 'details'].includes(action)) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        if (action === 'approve') openLendingReview(button.dataset.ticketId);
        if (action === 'reject') openLendingReview(button.dataset.ticketId, 'REJECT');
        if (action === 'handoff') openLendingHandoff(button.dataset.ticketId);
        if (action === 'return') openLendingReturn(button.dataset.ticketId);
        if (action === 'details') openLendingDetails(button.dataset.ticketId);
      },
      true,
    );
  };

  const enhanceReleaseConfirmationForm = () => {
    const form = document.querySelector('#eventReleaseForm');
    if (!form || form.querySelector('[name="recipientConfirmed"]')) return;
    const confirmation = document.createElement('label');
    confirmation.className = 'checkbox release-recipient-confirmation';
    confirmation.innerHTML =
      '<input name="recipientConfirmed" type="checkbox" value="true" required> Recipient confirms the selected quantities were physically received in the condition described above.';
    const uploader = form.querySelector('#releaseUploader');
    if (uploader) uploader.before(confirmation);
    else form.querySelector('[type="submit"]')?.before(confirmation);
  };

  const installReleaseConfirmation = () => {
    if (!releaseConfirmationInstalled && typeof services.confirmRelease === 'function') {
      const originalConfirmRelease = services.confirmRelease.bind(services);
      services.confirmRelease = async (payload = {}) => {
        const formConfirmed = document.querySelector(
          '#eventReleaseForm [name="recipientConfirmed"]',
        )?.checked;
        const explicitlyConfirmed =
          payload.recipientConfirmed === true ||
          String(payload.recipientConfirmed ?? '')
            .trim()
            .toLowerCase() === 'true' ||
          formConfirmed === true;
        if (!explicitlyConfirmed) {
          const error = new Error('The recipient must confirm the physical handoff before release.');
          error.code = 'RECIPIENT_CONFIRMATION_REQUIRED';
          throw error;
        }
        const result = await originalConfirmRelease({ ...payload, recipientConfirmed: true });
        if (backendMode === 'mock' && result && typeof result === 'object') {
          result.recipientConfirmed = true;
          result.confirmationLabel ??= `Release Confirmation | ${result.id ?? result.releaseId ?? 'RECORDED'}`;
        }
        return result;
      };
      releaseConfirmationInstalled = true;
      document.addEventListener('click', (event) => {
        if (event.target.closest('[data-release-action="event"]'))
          queueMicrotask(enhanceReleaseConfirmationForm);
      });
    }
    const modal = document.querySelector('#modal');
    if (modal && !releaseFormObserver) {
      releaseFormObserver = new MutationObserver(enhanceReleaseConfirmationForm);
      releaseFormObserver.observe(modal, { childList: true, subtree: true });
    }
    enhanceReleaseConfirmationForm();
  };

  const expectedCanvassUnits = (quote, state) => {
    const linkedIds = quote?.linkedLineIds ?? [];
    const units = [];
    linkedIds.forEach((lineId) => {
      const line = (state.requestLines ?? []).find((entry) => entry.id === lineId);
      const deliverable = (state.deliverables ?? []).find((entry) => entry.requestLineId === lineId);
      const restock = (state.restockRequests ?? []).find((entry) => entry.requestLineId === lineId);
      [line?.unit, deliverable?.unit, restock?.unit].filter(Boolean).forEach((unit) => units.push(unit));
    });
    return [...new Set(units)];
  };

  const canvassQualityMarkup = (quote, state) => {
    const indicators = canvassQualityIndicators(quote, {
      expectedUnits: expectedCanvassUnits(quote, state),
    });
    const evidence = (state.evidenceFiles ?? []).find((entry) => entry.id === quote.evidenceId);
    const links = canvassEvidenceLinks(quote, evidence);
    return {
      fingerprint: JSON.stringify({ indicators, links }),
      html: `${indicators
        .map(
          (indicator) =>
            `<span class="canvass-quality-indicator is-${esc(indicator.tone)}">${esc(indicator.label)}</span>`,
        )
        .join('')}${links
        .map(
          (link) =>
            `<a class="canvass-evidence-link" href="${esc(link.url)}" target="_blank" rel="noopener noreferrer">${esc(link.label)}</a>`,
        )
        .join('')}`,
    };
  };

  const decorateCanvassHost = (host, quote, state) => {
    if (!host || !quote) return;
    const target = host.matches('tr') ? host.cells[4] : (host.querySelector(':scope > div') ?? host);
    const markup = canvassQualityMarkup(quote, state);
    let quality = target.querySelector(':scope > .canvass-quality');
    if (!markup.html) {
      quality?.remove();
      return;
    }
    if (quality?.dataset.fingerprint === markup.fingerprint) return;
    if (!quality) {
      quality = document.createElement('div');
      quality.className = 'canvass-quality';
      target.append(quality);
    }
    quality.dataset.fingerprint = markup.fingerprint;
    quality.innerHTML = markup.html;
  };

  const renderCanvassQuality = () => {
    const state = getState() ?? {};
    const byId = new Map((state.canvassReferences ?? []).map((quote) => [quote.id, quote]));
    document.querySelectorAll('[data-canvass-details]').forEach((button) => {
      decorateCanvassHost(
        button.closest('tr, article.data-card'),
        byId.get(button.dataset.canvassDetails),
        state,
      );
    });
    document.querySelectorAll('[data-prefer-canvass]').forEach((button) => {
      decorateCanvassHost(
        button.closest('article.request-line'),
        byId.get(button.dataset.preferCanvass),
        state,
      );
    });
  };

  const installCanvassQuality = () => {
    ['#canvassLibrary', '#quoteComparison'].forEach((selector) => {
      const root = document.querySelector(selector);
      if (!root || canvassObservedRoots.has(root)) return;
      canvassObservedRoots.add(root);
      new MutationObserver(renderCanvassQuality).observe(root, { childList: true, subtree: true });
    });
    renderCanvassQuality();
  };

  const syncDeliverableReceiving = () => {
    const select = document.querySelector('#receiveDeliverable');
    const form = document.querySelector('#deliverableReceiveForm');
    if (!select || !form) return;
    const state = getState() ?? {};
    const eligible = (state.deliverables ?? []).filter((entry) =>
      ['PROCURED', 'PARTIALLY_RECEIVED'].includes(entry.status),
    );
    const fingerprint = JSON.stringify(
      eligible.map((entry) => [entry.id, entry.status, entry.quantityReceived, entry.quantity]),
    );
    const current = select.value;
    if (select.dataset.cumulativeFingerprint !== fingerprint) {
      select.innerHTML = `<option value="">Select a procured deliverable</option>${eligible
        .map(
          (entry) =>
            `<option value="${esc(entry.id)}">${esc(entry.id)} &mdash; ${esc(entry.itemSpec)} &mdash; ${esc(entry.quantityReceived ?? 0)}/${esc(entry.quantity)} received</option>`,
        )
        .join('')}`;
      select.dataset.cumulativeFingerprint = fingerprint;
      if (eligible.some((entry) => entry.id === current)) select.value = current;
    }
    const deliverable = eligible.find((entry) => entry.id === select.value);
    const input = form.elements.quantity;
    const label = input?.closest('label');
    const labelText = label && [...label.childNodes].find((node) => node.nodeType === Node.TEXT_NODE);
    if (labelText) labelText.textContent = 'Quantity received now';
    let summary = form.querySelector('#deliverableCumulativeSummary');
    if (!summary) {
      summary = document.createElement('div');
      summary.id = 'deliverableCumulativeSummary';
      summary.className = 'deliverable-cumulative-summary span-2';
      input?.closest('.form-grid')?.append(summary);
    }
    if (!deliverable) {
      summary.textContent = 'Select a procured deliverable to see received and remaining totals.';
      if (input) input.removeAttribute('max');
      return;
    }
    const total = Number(deliverable.quantity || 0);
    const received = Number(deliverable.quantityReceived || 0);
    const remaining = Math.max(0, total - received);
    summary.innerHTML = `<strong>Cumulative receiving</strong><span>${esc(received)} received &middot; ${esc(remaining)} remaining &middot; ${esc(total)} total ${esc(deliverable.unit)}</span>`;
    if (input) {
      input.max = String(remaining);
      input.value = String(remaining);
    }
  };

  const installDeliverableReceiving = () => {
    if (!deliverableReceivingInstalled && typeof services.receiveDeliverable === 'function') {
      const originalReceiveDeliverable = services.receiveDeliverable.bind(services);
      services.receiveDeliverable = async (payload = {}) => {
        const deliverable = (getState()?.deliverables ?? []).find(
          (entry) => entry.id === payload.deliverableId,
        );
        if (backendMode === 'mock' && deliverable) {
          if (!['PROCURED', 'PARTIALLY_RECEIVED'].includes(deliverable.status)) {
            const error = new Error('Only procured or partially received deliverables can be received.');
            error.code = 'INVALID_TRANSITION';
            throw error;
          }
          const receivedBefore = Number(deliverable.quantityReceived || 0);
          const receivedNow = Number(payload.quantity || payload.quantityReceivedNow);
          const required = Number(deliverable.quantity || 0);
          if (!(receivedNow > 0) || receivedBefore + receivedNow > required) {
            const error = new Error('Receipt exceeds the approved deliverable quantity.');
            error.code = 'OVER_RECEIPT';
            throw error;
          }
          const result = await originalReceiveDeliverable({ ...payload, quantity: receivedNow });
          const receivedTotal = receivedBefore + receivedNow;
          const next = receivedTotal >= required ? 'READY_TO_RELEASE' : 'PARTIALLY_RECEIVED';
          result.quantityReceived = receivedTotal;
          result.status = next;
          result.procurementStatus = next;
          const latest = result.statusHistory?.at(-1);
          if (latest) {
            latest.status = next;
            latest.note = `Received ${receivedNow}; cumulative total ${receivedTotal} of ${required}`;
          }
          const line = (getState()?.requestLines ?? []).find((entry) => entry.id === result.requestLineId);
          if (line) {
            line.receivedQuantity = receivedTotal;
            line.status = next;
            const lineLatest = line.statusHistory?.at(-1);
            if (lineLatest) {
              lineLatest.status = next;
              lineLatest.note = `Received ${receivedNow}; cumulative total ${receivedTotal} of ${required}`;
            }
          }
          result.receivedTotal = receivedTotal;
          return result;
        }
        return originalReceiveDeliverable(payload);
      };
      deliverableReceivingInstalled = true;
      document
        .querySelector('#receiveDeliverable')
        ?.addEventListener('change', () => queueMicrotask(syncDeliverableReceiving));
    }
    syncDeliverableReceiving();
  };

  const referenceAdminAllowed = () => {
    const user = getState()?.currentUser;
    return can(user, 'manage_reference');
  };

  const accessManagementAllowed = () => can(getState()?.currentUser, 'admin_access');
  const identityRosterAllowed = () =>
    String(
      getState()?.currentUser?.authorization?.roleId ?? getState()?.currentUser?.role ?? '',
    ).toUpperCase() === 'SYSTEM_OWNER';
  const evidenceSystemStatusAllowed = identityRosterAllowed;
  const advertisementManagementAllowed = () => can(getState()?.currentUser, 'manage_advertisements');
  const brandAssetManagementAllowed = () => can(getState()?.currentUser, 'manage_brand_assets');

  const lendingUsageAllowed = () => {
    const authorization = getState()?.currentUser?.authorization;
    if (!can(getState()?.currentUser, 'view_lending_usage')) return false;
    return (
      ['DIRECTOR', 'ADMINISTRATOR', 'SYSTEM_OWNER'].includes(authorization?.roleId) ||
      authorization?.committeeIds?.includes('COM_INVENTORY_PANTRY')
    );
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
      return [
        {
          id: user.id ?? 'PREVIEW-USER',
          domain,
          revision: Number(user.authorization?.revision ?? 1),
          status: user.authorization?.active === false ? 'ARCHIVED' : 'ACTIVE',
          payload: {
            roleId: user.authorization?.roleId ?? user.role ?? 'REQUESTER',
            committeeIds: user.authorization?.committeeIds ?? user.scopes?.committee ?? [],
            active: user.authorization?.active !== false,
          },
        },
      ];
    }
    if (domain === 'PEOPLE_MEMBERSHIPS') {
      const user = state.currentUser ?? {};
      return [
        {
          id: user.id ?? 'PREVIEW-USER',
          domain,
          revision: 1,
          status: 'ACTIVE',
          payload: { displayName: user.displayName ?? 'Preview user', rosterManaged: true },
        },
      ];
    }
    if (domain === 'SYNC_HEALTH')
      return [
        {
          id: 'PREVIEW-SYNC',
          domain,
          revision: 1,
          status: 'ACTIVE',
          payload: { validationStatus: 'PREVIEW_ONLY', conflictCount: 0, revocationCount: 0 },
        },
      ];
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
        if (!current || Number(record.revision) > Number(current.revision))
          currentById.set(record.id, record);
      });
      return {
        contract: 'reference-administration',
        contractVersion: 1,
        domain,
        writesEnabled: true,
        items: filterReferenceAdminRecords([...currentById.values()], command),
        pendingChanges: state.referenceAdminChanges.filter(
          (entry) => entry.domain === domain && entry.reviewStatus === 'PENDING_REVIEW',
        ),
        fieldOwnership: {
          peopleMemberships: 'AUTHORITATIVE_ROSTER_READ_ONLY',
          permissions: 'REVIEW_GATED',
          routing: 'REVIEW_GATED',
        },
        actor: {
          id: state.currentUser?.id ?? 'PREVIEW-ADMIN',
          role: state.currentUser?.role ?? 'ADMINISTRATOR',
        },
      };
    };
    services.previewReferenceAdminChange ??= async (command) =>
      previewReferenceAdminChange(command, {
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
        state.referenceAdminChanges.push({
          changeId,
          domain: preview.domain,
          action: preview.action,
          targetId: preview.targetId,
          expectedRevision: preview.expectedRevision,
          risk: preview.risk,
          requestedAt: new Date().toISOString(),
          requestedBy: state.currentUser?.id ?? 'PREVIEW-ADMIN',
          reviewStatus: 'PENDING_REVIEW',
          before: preview.before,
          after: preview.after,
          changedFields: preview.changedFields,
        });
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
      throw new Error(
        'Preview review requires a different administrator session to demonstrate separation of duties.',
      );
    };
    services.listAccessAccounts ??= async (command = {}) => {
      const user = state.currentUser ?? {};
      const item = {
        accessId: user.accessId ?? user.id ?? 'PREVIEW.ADMIN',
        displayName: user.displayName ?? 'Preview Administrator',
        roleId: user.authorization?.roleId ?? user.role ?? 'ADMINISTRATOR',
        committeeIds: user.authorization?.committeeIds ?? user.scopes?.committee ?? [],
        status: user.authorization?.active === false ? 'DISABLED' : 'ACTIVE',
        firstLoginPending: false,
        locked: false,
        createdAt: '',
        lastSuccessfulLogin: '',
        lastAccessIdChange: '',
        defaultCommitteeId: user.authorization?.committeeIds?.[0] ?? '',
        accessProfile: {
          presetId: 'CUSTOM',
          workspaceIds: user.authorization?.workspaceIds ?? ['administrator'],
          defaultWorkspaceId: user.authorization?.defaultWorkspaceId ?? 'administrator',
          locationScopeIds: user.authorization?.locationScopeIds ?? [],
          eventSeriesScopeIds: user.authorization?.eventSeriesScopeIds ?? [],
          eventScopeIds: user.authorization?.eventScopeIds ?? [],
          capabilityGrants: [],
          capabilityDenies: user.authorization?.explicitDenies ?? [],
        },
      };
      const query = String(command.query ?? '').toLowerCase();
      const items =
        query && !`${item.accessId} ${item.displayName}`.toLowerCase().includes(query) ? [] : [item];
      return { ok: true, items, pagination: { page: 1, pageSize: 20, total: items.length, totalPages: 1 } };
    };
    services.getAccessIdHistory ??= async (command = {}) => ({
      ok: true,
      account: { accessId: command.currentAccessId },
      history: [],
    });
    services.getAccessPolicyOptions ??= async () => ({
      ok: true,
      workspaces: [
        { id: 'administrator', label: 'Admin' },
        { id: 'director', label: 'Director' },
        { id: 'food', label: 'Food' },
        { id: 'inventory-pantry', label: 'Inventory & Pantry' },
        { id: 'materials', label: 'Materials' },
      ],
      presets: [
        {
          id: 'ADMINISTRATOR',
          label: 'Administrator',
          roleId: 'ADMINISTRATOR',
          workspaceIds: ['administrator', 'director', 'food', 'inventory-pantry', 'materials'],
        },
        { id: 'DIRECTOR', label: 'Director', roleId: 'DIRECTOR', workspaceIds: ['director'] },
        {
          id: 'FOOD_OPERATOR',
          label: 'Food Operator',
          roleId: 'DOL_STAFF',
          workspaceIds: ['food'],
          committeeIds: ['COM_FOOD'],
        },
        {
          id: 'INVENTORY_OPERATOR',
          label: 'Inventory & Pantry Operator',
          roleId: 'DOL_STAFF',
          workspaceIds: ['inventory-pantry'],
          committeeIds: ['COM_INVENTORY_PANTRY'],
        },
        {
          id: 'MATERIALS_OPERATOR',
          label: 'Materials Operator',
          roleId: 'DOL_STAFF',
          workspaceIds: ['materials'],
          committeeIds: ['COM_MATERIALS'],
        },
        { id: 'REQUEST_REVIEWER', label: 'Request Reviewer', roleId: 'COMMITTEE_HEAD', workspaceIds: [] },
        {
          id: 'LENDING_STAFF',
          label: 'Lending Staff',
          roleId: 'DOL_STAFF',
          workspaceIds: ['inventory-pantry'],
          committeeIds: ['COM_INVENTORY_PANTRY'],
        },
        { id: 'REQUESTER_ONLY', label: 'Requester Only', roleId: 'REQUESTER', workspaceIds: [] },
        { id: 'CUSTOM', label: 'Custom', roleId: '', workspaceIds: [] },
      ],
      committees: [
        { id: 'COM_FOOD', label: 'Food Committee' },
        { id: 'COM_INVENTORY_PANTRY', label: 'Inventory & Pantry Committee' },
        { id: 'COM_MATERIALS', label: 'Materials Committee' },
      ],
      locations: [],
      eventSeries: [],
      events: [],
      capabilities: (state.currentUser?.authorization?.capabilities ?? []).map((id) => ({ id, label: id })),
    });
    services.previewAccessPolicy ??= async (command) => ({
      ok: true,
      ...command,
      visibleNavigation: command.workspaceIds,
      allowedActions: (state.currentUser?.authorization?.capabilities ?? []).filter(
        (capability) => !command.capabilityDenies.includes(capability),
      ),
      explicitDenies: command.capabilityDenies,
      sensitiveCapabilities: [],
      conflictWarnings: [],
      sessionImpact: 'ALL_ACTIVE_SESSIONS_REVOKED',
    });
    services.updateAccessPolicy ??= async (command) => ({
      ok: true,
      changed: true,
      replayed: false,
      sessionsRevoked: true,
      preview: await services.previewAccessPolicy(command),
    });
    services.seedDepartmentAccessAccounts ??= async () => ({
      ok: true,
      seeded: false,
      accounts: 10,
      credentials: [],
    });
    state.publicAdvertisements ??= [];
    services.listAdvertisements ??= async () => ({
      ok: true,
      items: state.publicAdvertisements,
      pagination: {
        page: 1,
        pageSize: 20,
        total: state.publicAdvertisements.length,
        totalPages: 1,
      },
    });
    services.saveAdvertisement ??= async (command) => {
      const current = state.publicAdvertisements.find((item) => item.id === command.id);
      const record = {
        ...current,
        ...command,
        alt_text: command.altText,
        call_to_action: command.callToAction,
        destination_url: command.destinationUrl,
        display_order: Number(command.displayOrder ?? 0),
        publish_at: command.publishAt,
        expire_at: command.expireAt,
        status: command.status ?? 'DRAFT',
        updated_at: new Date().toISOString(),
      };
      if (current) Object.assign(current, record);
      else state.publicAdvertisements.push(record);
      return { ok: true, id: command.id, status: record.status };
    };
    services.uploadAdvertisementMedia ??= async (command) => ({
      ok: true,
      id: command.id,
      imageUrl: '',
    });
    services.archiveAdvertisement ??= async (command) => {
      const current = state.publicAdvertisements.find((item) => item.id === command.id);
      if (current) current.status = 'ARCHIVED';
      return { ok: true, id: command.id, status: 'ARCHIVED' };
    };
    services.listBrandAssets ??= async () => ({
      ok: true,
      slots: [
        ['usc-logo', 'USC logo'],
        ['dol-logo', 'DOL logo'],
        ['combined-lockup', 'Combined lockup'],
        ['favicon', 'Favicon'],
        ['login-background', 'Login background'],
        ['default-item-image', 'Default item image'],
      ].map(([id, label]) => ({ id, label, public_path: `/brand/${id}`, revision: 1 })),
      versions: [],
    });
    services.uploadBrandAsset ??= async (command) => ({
      ok: true,
      slot: command.slot,
      versionId: `BRAND-${Date.now()}`,
      versionNumber: 1,
      status: 'DRAFT',
    });
    services.publishBrandAsset ??= async (command) => ({ ok: true, ...command, status: 'PUBLISHED' });
    services.rollbackBrandAsset ??= services.publishBrandAsset;
    services.getLendingUsage ??= async () => {
      const activity = [
        ...new Map(
          (state.lendingTickets ?? []).map((ticket) => [
            `${ticket.borrowerName}:${ticket.department}`,
            {
              staff_name: ticket.borrowerName,
              department: ticket.department,
              request_count: 1,
              consumable_requests: ticket.ticketType === 'CONSUMABLE' ? 1 : 0,
              consumable_quantity: ticket.ticketType === 'CONSUMABLE' ? Number(ticket.quantity) : 0,
              reusable_borrowed: ticket.ticketType !== 'CONSUMABLE' ? Number(ticket.quantity) : 0,
              reusable_outstanding: ticket.status === 'ON_LOAN' ? Number(ticket.quantity) : 0,
              reusable_overdue: 0,
              first_request_at: ticket.createdAt,
              latest_request_at: ticket.createdAt,
            },
          ]),
        ).values(),
      ];
      return {
        ok: true,
        generatedAt: new Date().toISOString(),
        activity,
        frequentItems: [],
        options: {
          departments: [...new Set(activity.map((row) => row.department))].filter(Boolean),
          staff: [...new Set(activity.map((row) => row.staff_name))].filter(Boolean),
          items: (state.inventoryItems ?? []).map((item) => ({ id: item.id, name: item.name })),
        },
      };
    };
    services.getEvidenceSystemStatus ??= async () => ({
      primaryR2Status: 'AVAILABLE',
      pendingDriveBackups: 0,
      failedDriveBackups: 0,
      oldestPendingBackupAt: null,
      lastSuccessfulBackupAt: null,
      lastReconciliationAt: null,
      filesRequiringRestoration: 0,
      backupMessage: '',
      technicalDetails: {
        driveBackupConfigured: false,
        providerIdentifiersProtected: true,
        statusCounts: {},
      },
    });
    services.getIdentityRosterStatus ??= async () => ({
      ok: true,
      source: {
        configured: false,
        missingConfiguration: ['GOOGLE_ROSTER_SPREADSHEET_ID'],
      },
      latestRun: null,
      runs: [],
      directory: { total: 0, active: 0 },
    });
    services.listIdentityRoster ??= async () => ({
      ok: true,
      items: [],
      pagination: { page: 1, pageSize: 25, total: 0, totalPages: 1 },
    });
    services.previewIdentityRosterSync ??= async () => {
      const error = new Error('The approved private roster source is not configured.');
      error.code = 'ROSTER_SOURCE_NOT_CONFIGURED';
      throw error;
    };
    services.applyIdentityRosterSync ??= async () => ({ ok: true, applied: true });
    services.rollbackIdentityRosterSync ??= async () => ({ ok: true, rolledBack: true });
    services.getIdentityRosterSelfProfile ??= async () => ({
      ok: true,
      linked: false,
      profile: null,
    });
  };

  const accessDate = (value) => (value ? new Date(value).toLocaleString('en-PH') : 'Not recorded');

  const fileBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.addEventListener('load', () => resolve(String(reader.result).split(',')[1] ?? ''));
      reader.addEventListener('error', () => reject(reader.error));
      reader.readAsDataURL(file);
    });

  const renderAdvertisementDirectory = () => {
    const root = document.querySelector('[data-advertisement-admin]');
    if (!root || root.hidden) return;
    const items = advertisementDirectory?.items ?? [];
    root.querySelector('[data-advertisement-results]').innerHTML =
      items
        .map(
          (item) =>
            `<article class="request-line advertisement-admin-row"><div class="advertisement-admin-summary">${item.image_asset_key ? `<img src="/media/advertisements/${encodeURIComponent(item.id)}" alt="">` : '<span class="advertisement-media-missing">No media</span>'}<span><strong>${esc(item.title)}</strong><small>${esc(item.id)} &middot; ${esc(item.status)} &middot; order ${esc(item.display_order)}</small><small>${esc(item.publish_at ? `From ${accessDate(item.publish_at)}` : 'No start')} &middot; ${esc(item.expire_at ? `until ${accessDate(item.expire_at)}` : 'no expiry')}</small></span></div><div class="request-line-actions"><button class="secondary mini" type="button" data-advertisement-edit="${esc(item.id)}">Edit / media</button>${item.status !== 'ARCHIVED' ? `<button class="danger mini" type="button" data-advertisement-archive="${esc(item.id)}">Archive</button>` : ''}</div></article>`,
        )
        .join('') || '<div class="empty">No advertisements match these filters.</div>';
    const pagination = advertisementDirectory?.pagination ?? {
      page: 1,
      totalPages: 1,
      total: items.length,
    };
    const pager = root.querySelector('[data-advertisement-pagination]');
    pager.hidden = pagination.totalPages <= 1;
    pager.querySelector('[data-advertisement-page-summary]').textContent =
      `Page ${pagination.page} of ${pagination.totalPages} Â· ${pagination.total} records`;
    pager.querySelector('[data-advertisement-page="previous"]').disabled = pagination.page <= 1;
    pager.querySelector('[data-advertisement-page="next"]').disabled =
      pagination.page >= pagination.totalPages;
  };

  const refreshAdvertisementDirectory = async ({ force = false } = {}) => {
    const root = document.querySelector('[data-advertisement-admin]');
    if (!root || !advertisementManagementAllowed()) return;
    if (!force && advertisementDirectory?.pagination?.page === advertisementPage) return;
    root.querySelector('[data-advertisement-results]').innerHTML =
      '<div class="empty">Loading authorized advertisementsâ€¦</div>';
    try {
      advertisementDirectory = await services.listAdvertisements({
        query: root.querySelector('[name="advertisementSearch"]')?.value ?? '',
        status: root.querySelector('[name="advertisementStatus"]')?.value ?? 'ALL',
        page: advertisementPage,
        pageSize: 20,
      });
      renderAdvertisementDirectory();
    } catch (error) {
      root.querySelector('[data-advertisement-results]').innerHTML =
        `<div class="alert error">${esc(error.message)}</div>`;
    }
  };

  const openAdvertisementForm = (item = null) => {
    openModal(
      item ? `Edit ${item.id}` : 'Create advertisement',
      `<form id="advertisementForm"><div class="form-grid">
        <label>Stable ID<input name="id" maxlength="80" pattern="[A-Za-z0-9][A-Za-z0-9_-]{2,79}" value="${esc(item?.id ?? '')}" ${item ? 'readonly' : ''} required></label>
        <label>Title<input name="title" maxlength="160" value="${esc(item?.title ?? '')}" required></label>
        <label class="span-2">Description<textarea name="description" maxlength="500">${esc(item?.description ?? '')}</textarea></label>
        <label class="span-2">Alternative text<input name="altText" maxlength="240" value="${esc(item?.alt_text ?? '')}" required></label>
        <label>Call to action<input name="callToAction" maxlength="80" value="${esc(item?.call_to_action ?? '')}"></label>
        <label>HTTPS destination<input name="destinationUrl" type="url" value="${esc(item?.destination_url ?? '')}"></label>
        <label>Status<select name="status">${['DRAFT', 'ACTIVE', 'INACTIVE'].map((status) => option(status, status, item?.status ?? 'DRAFT')).join('')}</select></label>
        <label>Display order<input name="displayOrder" type="number" step="1" value="${esc(item?.display_order ?? 0)}"></label>
        <label>Publish at<input name="publishAt" type="datetime-local" value="${esc(item?.publish_at?.slice(0, 16) ?? '')}"></label>
        <label>Expire at<input name="expireAt" type="datetime-local" value="${esc(item?.expire_at?.slice(0, 16) ?? '')}"></label>
        <label class="span-2">JPEG, PNG, or WebP media<input name="media" type="file" accept="image/jpeg,image/png,image/webp"><small>Maximum 750 KB. Full artwork is shown without cropping.</small></label>
      </div><button class="primary" type="submit">${item ? 'Save changes' : 'Create advertisement'}</button></form>`,
      (modal) => {
        const form = modal.querySelector('#advertisementForm');
        form.addEventListener('submit', async (event) => {
          event.preventDefault();
          if (!form.reportValidity()) return;
          const button = form.querySelector('[type="submit"]');
          button.disabled = true;
          const values = Object.fromEntries(new FormData(form).entries());
          const media = form.elements.media.files[0];
          delete values.media;
          try {
            const requestedStatus = values.status;
            const initialValues = {
              ...values,
              displayOrder: Number(values.displayOrder),
              ...(!item && media && requestedStatus === 'ACTIVE' ? { status: 'DRAFT' } : {}),
            };
            await services.saveAdvertisement(initialValues);
            if (media) {
              if (media.size > 750_000) throw new Error('Advertisement media exceeds 750 KB.');
              await services.uploadAdvertisementMedia({
                id: values.id,
                contentType: media.type,
                base64: await fileBase64(media),
              });
            }
            if (!item && media && requestedStatus === 'ACTIVE') {
              await services.saveAdvertisement({
                ...values,
                displayOrder: Number(values.displayOrder),
              });
            }
            closeModal();
            advertisementDirectory = null;
            await refreshAdvertisementDirectory({ force: true });
            toast('Advertisement saved and audited.');
          } catch (error) {
            toast(error.message, true);
            button.disabled = false;
          }
        });
      },
    );
  };

  const renderAccessDirectory = () => {
    const root = document.querySelector('[data-access-management]');
    if (!root || root.hidden) return;
    const results = root.querySelector('[data-access-results]');
    const items = accessDirectory?.items ?? [];
    results.innerHTML =
      items
        .map((account) => {
          const stateLabels = [
            account.status,
            account.firstLoginPending ? 'Pending first login' : 'Onboarding complete',
            account.locked ? 'Locked' : '',
          ].filter(Boolean);
          const departmentLine = account.departmentId
            ? `<small>${esc(account.departmentDisplayName)} &middot; ${esc(account.departmentId)}</small>`
            : '';
          const archiveAction = ['ACTIVE', 'STARTER', 'DISABLED'].includes(account.status)
            ? `<button class="danger mini" type="button" data-access-action="archive" data-access-id="${esc(account.accessId)}">Archive</button>`
            : '';
          const lifecycleAction =
            account.status === 'ACTIVE' || account.status === 'STARTER'
              ? `<button class="danger mini" type="button" data-access-action="disable" data-access-id="${esc(account.accessId)}">Disable</button>${archiveAction}`
              : account.status === 'DISABLED'
                ? `<button class="secondary mini" type="button" data-access-action="restore" data-access-id="${esc(account.accessId)}">Restore</button>${archiveAction}`
                : account.status === 'REVOKED'
                  ? `<button class="secondary mini" type="button" data-access-action="restore" data-access-id="${esc(account.accessId)}">Restore</button>`
                  : '';
          const accessProfile = account.accessProfile ?? {};
          const workspaceLine = (accessProfile.workspaceIds ?? []).length
            ? `${accessProfile.workspaceIds.join(', ')}; default ${accessProfile.defaultWorkspaceId || 'not set'}`
            : 'No internal workspace';
          return `<div class="request-line access-account-row"><div><strong>${esc(account.accessId)}</strong>${departmentLine}<small>${esc(account.displayName)} &middot; ${esc(account.roleId)} &middot; ${esc((account.committeeIds ?? []).join(', ') || 'All / no committee')}</small><small>Workspaces: ${esc(workspaceLine)} &middot; Preset: ${esc(accessProfile.presetId || 'CUSTOM')}</small><small>${esc(stateLabels.join(' · '))} &middot; Last login: ${esc(accessDate(account.lastSuccessfulLogin))} &middot; Created: ${esc(accessDate(account.createdAt))}</small><small>Password changed: ${esc(accessDate(account.passwordChangedAt))} &middot; Last reset: ${esc(accessDate(account.lastPasswordResetAt))} &middot; Last Access ID change: ${esc(accessDate(account.lastAccessIdChange))}</small></div><div class="request-line-actions access-account-actions"><button class="secondary mini" type="button" data-access-action="policy" data-access-id="${esc(account.accessId)}">Edit access</button><button class="secondary mini" type="button" data-access-action="history" data-access-id="${esc(account.accessId)}">History</button><button class="secondary mini" type="button" data-access-action="rename" data-access-id="${esc(account.accessId)}">Change Access ID</button><button class="secondary mini" type="button" data-access-action="reset" data-access-id="${esc(account.accessId)}">Reset password</button><button class="secondary mini" type="button" data-access-action="revoke-sessions" data-access-id="${esc(account.accessId)}">Revoke sessions</button>${lifecycleAction}${account.locked ? `<button class="secondary mini" type="button" data-access-action="unlock" data-access-id="${esc(account.accessId)}">Unlock</button>` : ''}</div></div>`;
        })
        .join('') || '<div class="empty">No accounts match the authorized filters.</div>';
    const pagination = accessDirectory?.pagination ?? { page: 1, totalPages: 1, total: items.length };
    const pager = root.querySelector('[data-access-pagination]');
    pager.hidden = pagination.totalPages <= 1;
    pager.querySelector('[data-access-page-summary]').textContent =
      `Page ${pagination.page} of ${pagination.totalPages} · ${pagination.total} accounts`;
    pager.querySelector('[data-access-page="previous"]').disabled = pagination.page <= 1;
    pager.querySelector('[data-access-page="next"]').disabled = pagination.page >= pagination.totalPages;
  };

  const refreshAccessDirectory = async ({ force = false } = {}) => {
    const root = document.querySelector('[data-access-management]');
    if (!root || !accessManagementAllowed()) return;
    if (accessDirectoryPromise) {
      if (!force) return accessDirectoryPromise;
      await accessDirectoryPromise;
      return refreshAccessDirectory({ force: true });
    }
    if (!force && accessDirectory?.pagination?.page === accessDirectoryPage) return;
    root.querySelector('[data-access-results]').innerHTML =
      '<div class="empty">Loading authorized accounts…</div>';
    accessDirectoryPromise = services.listAccessAccounts({
      query: root.querySelector('[name="accessSearch"]')?.value ?? '',
      role: root.querySelector('[name="accessRole"]')?.value ?? '',
      committee: root.querySelector('[name="accessCommittee"]')?.value ?? '',
      status: root.querySelector('[name="accessStatus"]')?.value ?? 'ALL',
      sort: root.querySelector('[name="accessSort"]')?.value ?? 'accessId',
      direction: 'asc',
      page: accessDirectoryPage,
      pageSize: 20,
    });
    try {
      accessDirectory = await accessDirectoryPromise;
      renderAccessDirectory();
    } catch (error) {
      root.querySelector('[data-access-results]').innerHTML =
        `<div class="alert error">${esc(error.message)}</div>`;
    } finally {
      accessDirectoryPromise = null;
    }
  };

  const accessAccount = (accessId) =>
    (accessDirectory?.items ?? []).find((account) => account.accessId === accessId);

  const ensureAccessPolicyOptions = async () => {
    accessPolicyOptions ??= await services.getAccessPolicyOptions({});
    return accessPolicyOptions;
  };

  const accessCheckboxes = (name, entries, selected = []) => {
    const selectedIds = new Set(selected);
    return `<div class="access-choice-grid" data-access-choice-group="${esc(name)}">${
      entries
        .map(
          (entry) =>
            `<label class="checkbox"><input name="${esc(name)}" type="checkbox" value="${esc(entry.id)}"${selectedIds.has(entry.id) ? ' checked' : ''}> ${esc(entry.label ?? entry.id)}</label>`,
        )
        .join('') || '<span class="empty">No governed values are currently available.</span>'
    }</div>`;
  };

  const accessCapabilityOptions = (capabilities, selected = []) => {
    const selectedIds = new Set(selected);
    const groups = new Map();
    capabilities.forEach((entry) => {
      const group = entry.id.split('.')[0] || 'other';
      if (!groups.has(group)) groups.set(group, []);
      groups.get(group).push(entry);
    });
    return [...groups.entries()]
      .map(
        ([group, entries]) =>
          `<optgroup label="${esc(group)}">${entries.map((entry) => `<option value="${esc(entry.id)}"${selectedIds.has(entry.id) ? ' selected' : ''}>${esc(entry.id)} — ${esc(entry.label ?? '')}</option>`).join('')}</optgroup>`,
      )
      .join('');
  };

  const accessPolicyFormMarkup = (account, options) => {
    const profile = account.accessProfile ?? {};
    const workspaceIds = profile.workspaceIds ?? [];
    const committeeIds = account.committeeIds ?? [];
    return `<form id="accessPolicyForm">
      <div class="mode-note">Workspace visibility is not authorization. The server validates this policy, projects effective actions, revokes active sessions after a material change, and appends audit history.</div>
      <div class="form-grid section-gap">
        <label>Selected account<input name="currentAccessId" value="${esc(account.accessId)}" readonly></label>
        <label>Access preset<select name="presetId">${options.presets.map((entry) => option(entry.id, entry.label, profile.presetId || 'CUSTOM')).join('')}</select></label>
        <label>Role<select name="roleId">${['REQUESTER', 'ADMINISTRATOR', 'DIRECTOR', 'DOL_STAFF', 'COMMITTEE_HEAD', 'READ_ONLY_AUDITOR'].map((value) => option(value, value.replaceAll('_', ' '), account.roleId)).join('')}</select></label>
        <label>Default workspace<select name="defaultWorkspaceId"><option value="">No internal workspace</option>${options.workspaces.map((entry) => option(entry.id, entry.label, profile.defaultWorkspaceId)).join('')}</select></label>
        <fieldset class="span-2"><legend>Authorized workspaces</legend>${accessCheckboxes('workspaceIds', options.workspaces, workspaceIds)}</fieldset>
        <fieldset class="span-2"><legend>Committee scopes</legend>${accessCheckboxes('committeeIds', options.committees, committeeIds)}</fieldset>
        <label>Primary committee<select name="defaultCommitteeId"><option value="">No primary committee</option>${options.committees.map((entry) => option(entry.id, entry.label, account.defaultCommitteeId)).join('')}</select></label>
        <span></span>
        <fieldset class="span-2"><legend>Location scopes</legend>${accessCheckboxes('locationScopeIds', options.locations, profile.locationScopeIds)}</fieldset>
        <fieldset class="span-2"><legend>Event-series scopes</legend>${accessCheckboxes('eventSeriesScopeIds', options.eventSeries, profile.eventSeriesScopeIds)}</fieldset>
        <fieldset class="span-2"><legend>Sub-event scopes</legend>${accessCheckboxes('eventScopeIds', options.events, profile.eventScopeIds)}</fieldset>
        <details class="span-2 access-advanced-settings"><summary>Advanced settings</summary><p>Use only small approved overrides. Sensitive grants require System Owner approval.</p><div class="form-grid section-gap"><label>Explicit grants<select name="capabilityGrants" multiple size="8">${accessCapabilityOptions(options.capabilities, profile.capabilityGrants)}</select></label><label>Explicit denies<select name="capabilityDenies" multiple size="8">${accessCapabilityOptions(options.capabilities, profile.capabilityDenies)}</select></label></div></details>
        <label>Confirm current Access ID<input name="confirmCurrentAccessId" maxlength="64" autocomplete="off" required></label>
        <label class="span-2">Reason<textarea name="reason" minlength="8" maxlength="500" required></textarea></label>
      </div>
      <button class="primary" type="submit">Preview effective access</button>
    </form>`;
  };

  const accessPolicyCommand = (form) => {
    const data = new FormData(form);
    return {
      currentAccessId: data.get('currentAccessId'),
      confirmCurrentAccessId: data.get('confirmCurrentAccessId'),
      presetId: data.get('presetId'),
      roleId: data.get('roleId'),
      workspaceIds: data.getAll('workspaceIds'),
      defaultWorkspaceId: data.get('defaultWorkspaceId'),
      committeeIds: data.getAll('committeeIds'),
      defaultCommitteeId: data.get('defaultCommitteeId'),
      locationScopeIds: data.getAll('locationScopeIds'),
      eventSeriesScopeIds: data.getAll('eventSeriesScopeIds'),
      eventScopeIds: data.getAll('eventScopeIds'),
      capabilityGrants: data.getAll('capabilityGrants'),
      capabilityDenies: data.getAll('capabilityDenies'),
      reason: data.get('reason'),
    };
  };

  const accessPreviewMarkup = (preview) => {
    const rows = [
      ['Preset', preview.presetId],
      ['Role', preview.roleId],
      ['Available workspaces', preview.workspaceIds?.join(', ') || 'None'],
      ['Default workspace', preview.defaultWorkspaceId || 'None'],
      ['Visible navigation', preview.visibleNavigation?.join(', ') || 'None'],
      ['Committee scopes', preview.committeeIds?.join(', ') || 'None'],
      ['Location scopes', preview.locationScopeIds?.join(', ') || 'All authorized'],
      ['Event-series scopes', preview.eventSeriesScopeIds?.join(', ') || 'All authorized'],
      ['Sub-event scopes', preview.eventScopeIds?.join(', ') || 'All authorized'],
      ['Explicit denies', preview.explicitDenies?.join(', ') || 'None'],
      ['Sensitive capabilities', preview.sensitiveCapabilities?.join(', ') || 'None'],
    ];
    const current = preview.account ?? {};
    const proposed = preview.proposedAccount ?? {};
    return `<div class="mode-note"><strong>Target: ${esc(current.accessId || 'Unknown account')}</strong><br>Current: ${esc(current.roleId || 'Unknown role')} / ${esc(current.status || 'Unknown status')}<br>Proposed: ${esc(proposed.roleId || preview.roleId || 'Unknown role')} / ${esc(proposed.status || current.status || 'Unknown status')}</div><dl class="access-effective-preview section-gap">${rows.map(([label, value]) => `<div><dt>${esc(label)}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl><details class="section-gap"><summary>Allowed actions (${preview.allowedActions?.length ?? 0})</summary><p>${esc(preview.allowedActions?.join(', ') || 'No actions')}</p></details><div class="alert warning section-gap">All active sessions will be revoked when this policy is saved.</div>`;
  };

  const openAccessPolicyEditor = async (account) => {
    try {
      const options = await ensureAccessPolicyOptions();
      openModal(
        `Edit effective access · ${account.accessId}`,
        accessPolicyFormMarkup(account, options),
        (modal) => {
          const form = modal.querySelector('#accessPolicyForm');
          const presetSelect = form.elements.presetId;
          presetSelect.addEventListener('change', () => {
            const preset = options.presets.find((entry) => entry.id === presetSelect.value);
            if (!preset || preset.id === 'CUSTOM') return;
            form.elements.roleId.value = preset.roleId;
            form.querySelectorAll('[name="workspaceIds"]').forEach((control) => {
              control.checked = (preset.workspaceIds ?? []).includes(control.value);
            });
            form.querySelectorAll('[name="committeeIds"]').forEach((control) => {
              control.checked = (preset.committeeIds ?? []).includes(control.value);
            });
            form.elements.defaultWorkspaceId.value = preset.workspaceIds?.[0] ?? '';
            form.elements.defaultCommitteeId.value = preset.committeeIds?.[0] ?? '';
          });
          form.addEventListener('submit', async (event) => {
            event.preventDefault();
            if (!form.reportValidity()) return;
            const button = form.querySelector('[type="submit"]');
            button.disabled = true;
            const command = accessPolicyCommand(form);
            try {
              const preview = await services.previewAccessPolicy(command);
              openModal(
                'Confirm effective access',
                `${accessPreviewMarkup(preview)}<button class="danger section-gap" type="button" data-access-policy-confirm>Save policy and revoke sessions</button>`,
                (confirmModal) => {
                  confirmModal
                    .querySelector('[data-access-policy-confirm]')
                    .addEventListener('click', async (confirmEvent) => {
                      confirmEvent.currentTarget.disabled = true;
                      try {
                        const result = await services.updateAccessPolicy({
                          ...command,
                          idempotencyKey: `access-policy-change-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`,
                        });
                        closeModal();
                        accessDirectory = null;
                        await refreshAccessDirectory({ force: true });
                        toast(
                          `Effective access updated; active sessions were revoked and audit history was appended.${auditReferenceText(result)}`,
                        );
                      } catch (error) {
                        toast(error.message, true);
                        confirmEvent.currentTarget.disabled = false;
                      }
                    });
                },
              );
            } catch (error) {
              toast(error.message, true);
              button.disabled = false;
            }
          });
        },
      );
    } catch (error) {
      toast(error.message, true);
    }
  };

  const openAccessHistory = async (account) => {
    openModal('Access ID history', '<div class="empty">Loading append-only history…</div>');
    try {
      const result = await services.getAccessIdHistory({ currentAccessId: account.accessId, limit: 100 });
      openModal(
        `Access ID history · ${account.accessId}`,
        `<h3>Append-only Access ID history</h3><div class="line-list">${
          (result.history ?? [])
            .map(
              (entry) =>
                `<div class="request-line"><div><strong>${esc(entry.oldAccessId)} → ${esc(entry.newAccessId)}</strong><small>${esc(accessDate(entry.changedAt))} · ${esc(entry.environment)} · actor ${esc(entry.actorAccessId)}</small><small>${esc(entry.reason)}</small></div></div>`,
            )
            .join('') || '<div class="empty">No Access ID changes have been recorded.</div>'
        }</div><h3 class="section-gap">Safe account audit history</h3><div class="line-list">${
          (result.auditHistory ?? [])
            .map((entry) => ({
              ...entry,
              reason: `Before: ${JSON.stringify(entry.before ?? {})}; After: ${JSON.stringify(entry.after ?? {})}; ${entry.reason || 'No reason recorded'}`,
            }))
            .map(
              (entry) =>
                `<div class="request-line"><div><strong>${esc(entry.action)}</strong><small>${esc(accessDate(entry.changedAt))} · ${esc(entry.correlationId || 'No correlation ID')}</small><small>${esc(entry.reason || 'No reason recorded')}</small></div></div>`,
            )
            .join('') || '<div class="empty">No account-management actions have been recorded.</div>'
        }</div>`,
      );
    } catch (error) {
      openModal('Access ID history', `<div class="alert error">${esc(error.message)}</div>`);
    }
  };

  const openAccessIdChange = (account) => {
    openModal(
      `Change Access ID · ${account.accessId}`,
      `<form id="accessIdChangeForm"><div class="mode-note">The immutable account identity, role, capabilities, and historical authorship remain unchanged. All active sessions will be revoked.</div><div class="form-grid section-gap"><label>Selected account<input name="currentAccessId" value="${esc(account.accessId)}" readonly></label><label>Proposed Access ID<input name="proposedAccessId" maxlength="64" autocomplete="off" required></label><label>Confirm current Access ID<input name="confirmCurrentAccessId" maxlength="64" autocomplete="off" required></label><label class="span-2">Reason<textarea name="reason" minlength="8" maxlength="500" required></textarea></label></div><button class="primary" type="submit">Preview normalized change</button></form>`,
      (modal) => {
        const form = modal.querySelector('#accessIdChangeForm');
        form.addEventListener('submit', async (event) => {
          event.preventDefault();
          if (!form.reportValidity()) return;
          const command = Object.fromEntries(new FormData(form).entries());
          const button = form.querySelector('[type="submit"]');
          button.disabled = true;
          try {
            const preview = await services.previewAccessIdChange(command);
            openModal(
              'Confirm Access ID change',
              `<div class="mode-note"><strong>${esc(account.accessId)} → ${esc(preview.normalizationPreview)}</strong><br>All active sessions will be revoked. The previous Access ID remains reserved and cannot be reused. Role, capability, and historical ownership links are unchanged.</div><button class="danger section-gap" type="button" data-access-confirm-change>Confirm and revoke sessions</button>`,
              (confirmModal) => {
                confirmModal
                  .querySelector('[data-access-confirm-change]')
                  .addEventListener('click', async (confirmEvent) => {
                    confirmEvent.currentTarget.disabled = true;
                    try {
                      await services.changeAccessId({
                        ...command,
                        proposedAccessId: preview.proposedAccessId,
                        idempotencyKey: `access-id-change-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`,
                      });
                      closeModal();
                      accessDirectory = null;
                      await refreshAccessDirectory({ force: true });
                      toast('Access ID changed; prior sessions were revoked and history was appended.');
                    } catch (error) {
                      toast(error.message, true);
                      confirmEvent.currentTarget.disabled = false;
                    }
                  });
              },
            );
          } catch (error) {
            toast(error.message, true);
            button.disabled = false;
          }
        });
      },
    );
  };

  const openAccessReasonAction = (account, action) => {
    const clientRequestId = `access-${action}-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`;
    const definitions = {
      disable: { title: 'Disable account', button: 'Disable and revoke sessions', status: 'DISABLED' },
      enable: { title: 'Enable account', button: 'Enable account', status: 'ACTIVE' },
      archive: {
        title: 'Archive account',
        button: 'Archive account and revoke sessions',
        status: 'REVOKED',
        lifecycleAction: 'ARCHIVE',
      },
      restore: { title: 'Restore account', button: 'Restore account', status: 'ACTIVE' },
      'revoke-sessions': { title: 'Revoke all sessions', button: 'Revoke all sessions' },
      unlock: { title: 'Unlock account', button: 'Unlock account' },
    };
    const definition = definitions[action];
    openModal(
      `${definition.title} · ${account.accessId}`,
      `<form id="accessReasonActionForm"><div class="mode-note"><strong>Target: ${esc(account.accessId)}</strong><br>Current state: ${esc(account.status)}${account.locked ? ' / locked' : ''}<br>Proposed result: ${esc(definition.status ?? (action === 'unlock' ? 'unlocked' : 'all sessions revoked'))}. This action is recorded in the append-only audit log.</div><label class="section-gap">Confirm current Access ID<input name="confirmCurrentAccessId" maxlength="64" autocomplete="off" required></label><label class="section-gap">Reason<textarea name="reason" minlength="8" maxlength="500" required></textarea></label><button class="${['disable', 'archive'].includes(action) ? 'danger' : 'primary'}" type="submit">${definition.button}</button></form>`,
      (modal) => {
        const form = modal.querySelector('#accessReasonActionForm');
        form.addEventListener('submit', async (event) => {
          event.preventDefault();
          if (!form.reportValidity()) return;
          const values = Object.fromEntries(new FormData(form).entries());
          const command = {
            currentAccessId: account.accessId,
            ...values,
            ...(definition.lifecycleAction ? { lifecycleAction: definition.lifecycleAction } : {}),
            ...(['unlock', 'revoke-sessions'].includes(action) ? { clientRequestId } : {}),
          };
          const button = form.querySelector('[type="submit"]');
          button.disabled = true;
          try {
            let result;
            if (definition.status)
              result = await services.setAccessAccountStatus({ ...command, status: definition.status });
            else if (action === 'unlock') result = await services.unlockAccessAccount(command);
            else result = await services.revokeAccessSessions(command);
            closeModal();
            accessDirectory = null;
            await refreshAccessDirectory({ force: true });
            toast(
              action === 'archive'
                ? `Account archived without deleting history; active sessions were revoked.${auditReferenceText(result)}`
                : `${definition.title} completed.${auditReferenceText(result)}`,
            );
          } catch (error) {
            toast(operationalErrorText(error), true);
            button.disabled = false;
          }
        });
      },
    );
  };

  const credentialsText = (credentials) =>
    [
      'HAU-USC Logistics Department Access Codes',
      `Generated: ${credentials[0]?.generatedAt ?? new Date().toISOString()}`,
      '',
      ...credentials.flatMap((credential) => [
        `Department: ${credential.department || 'Not mapped'}`,
        `Access ID: ${credential.accessId}`,
        `Initial password: ${credential.temporaryPassword}`,
        `Account status: ${credential.status}`,
        '',
      ]),
      'These one-time credentials must be delivered through an approved private channel.',
    ].join('\r\n');

  const openOneTimeCredentialHandoff = (title, credentials) => {
    const text = credentialsText(credentials);
    openModal(
      title,
      `<div class="alert warning"><strong>One-time credential display.</strong> Save this export now. Passwords are not stored in plaintext and cannot be reconstructed after this dialog closes.</div><pre class="credential-handoff section-gap">${esc(text)}</pre><div class="button-row section-gap"><button class="secondary" type="button" data-copy-credentials>Copy access codes</button><button class="primary" type="button" data-download-credentials>Download access codes</button></div>`,
      (modal) => {
        modal.querySelector('[data-copy-credentials]').addEventListener('click', async () => {
          await navigator.clipboard.writeText(text);
          toast('One-time access codes copied.');
        });
        modal.querySelector('[data-download-credentials]').addEventListener('click', () => {
          const url = URL.createObjectURL(new Blob([text], { type: 'text/plain;charset=utf-8' }));
          const link = document.createElement('a');
          link.href = url;
          link.download = 'HAU-USC Department Access Codes.txt';
          link.click();
          setTimeout(() => URL.revokeObjectURL(url), 0);
        });
      },
    );
  };

  const openAccessPasswordReset = (account) => {
    const clientRequestId = `access-reset-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`;
    openModal(
      `Reset temporary password · ${account.accessId}`,
      `<form id="accessPasswordResetForm"><div class="mode-note"><strong>Target: ${esc(account.accessId)}</strong><br>Current state: ${esc(account.status)}<br>Proposed result: STARTER / pending first login / sessions revoked. The server generates a cryptographically secure one-time password.</div><div class="form-grid section-gap"><label>Confirm current Access ID<input name="confirmCurrentAccessId" maxlength="64" autocomplete="off" required></label><label class="span-2">Reason<textarea name="reason" minlength="8" maxlength="500" required></textarea></label></div><button class="danger" type="submit">Generate reset credential and revoke sessions</button></form>`,
      (modal) => {
        const form = modal.querySelector('#accessPasswordResetForm');
        form.addEventListener('submit', async (event) => {
          event.preventDefault();
          if (!form.reportValidity()) return;
          const button = form.querySelector('[type="submit"]');
          button.disabled = true;
          try {
            const result = await services.resetAccessPassword({
              currentAccessId: account.accessId,
              ...Object.fromEntries(new FormData(form).entries()),
              clientRequestId,
            });
            form.reset();
            accessDirectory = null;
            await refreshAccessDirectory({ force: true });
            if (result.credential) {
              openOneTimeCredentialHandoff('Temporary password generated', [result.credential]);
            } else {
              openModal(
                'Password reset completed',
                `<div class="alert warning">The reset was already completed, but its one-time plaintext credential cannot be displayed again. Start a new confirmed reset if a replacement credential is required.${esc(auditReferenceText(result))}</div>`,
              );
            }
          } catch (error) {
            toast(operationalErrorText(error), true);
            button.disabled = false;
          }
        });
      },
    );
  };

  const openAccessAccountCreate = async () => {
    try {
      const options = await ensureAccessPolicyOptions();
      openModal(
        'Create governed account',
        `<form id="accessAccountCreateForm"><div class="mode-note">The server generates the temporary password, validates effective access, requires first-login password change, and returns plaintext only once.</div><div class="form-grid section-gap">
          <label>Access ID<input name="accessId" maxlength="64" autocomplete="off" required></label>
          <label class="checkbox"><input name="generateAccessId" type="checkbox"> Generate DOL-YYYY-NNNN Access ID</label>
          <label>Access preset<select name="presetId">${options.presets.map((entry) => option(entry.id, entry.label, 'CUSTOM')).join('')}</select></label>
          <label>Role<select name="roleId">${['REQUESTER', 'ADMINISTRATOR', 'DIRECTOR', 'DOL_STAFF', 'COMMITTEE_HEAD'].map((value) => option(value, value.replaceAll('_', ' '), 'REQUESTER')).join('')}</select></label>
          <label>Department<select name="departmentId"><option value="">Not mapped</option>${USC_DEPARTMENT_REGISTRY.map((department) => option(department.id, department.displayName)).join('')}</select></label>
          <label>Account status<select name="status"><option value="STARTER">Starter — first-login activation required</option><option value="DISABLED">Disabled — credential cannot be used yet</option></select></label>
          <label>Temporary credential expiry<select name="temporaryPasswordHours"><option value="24">24 hours</option><option value="48">48 hours</option><option value="72" selected>72 hours</option><option value="168">7 days</option></select></label>
          <label>Default workspace<select name="defaultWorkspaceId"><option value="">No internal workspace</option>${options.workspaces.map((entry) => option(entry.id, entry.label)).join('')}</select></label>
          <fieldset class="span-2"><legend>Authorized workspaces</legend>${accessCheckboxes('workspaceIds', options.workspaces)}</fieldset>
          <fieldset class="span-2"><legend>Committee scopes</legend>${accessCheckboxes('committeeIds', options.committees)}</fieldset>
          <label>Primary committee<select name="defaultCommitteeId"><option value="">No primary committee</option>${options.committees.map((entry) => option(entry.id, entry.label)).join('')}</select></label>
          <label class="checkbox"><input name="lendingEligible" type="checkbox"> Requester is eligible for Office Lending</label>
          <label>Institution ID<input name="institutionId" inputmode="numeric" maxlength="8"></label>
          <fieldset class="span-2"><legend>Location scopes</legend>${accessCheckboxes('locationScopeIds', options.locations)}</fieldset>
          <fieldset class="span-2"><legend>Event-series scopes</legend>${accessCheckboxes('eventSeriesScopeIds', options.eventSeries)}</fieldset>
          <fieldset class="span-2"><legend>Sub-event scopes</legend>${accessCheckboxes('eventScopeIds', options.events)}</fieldset>
          <details class="span-2 access-advanced-settings"><summary>Advanced settings</summary><p>Use small approved overrides only. Sensitive grants require System Owner approval.</p><div class="form-grid section-gap"><label>Explicit grants<select name="capabilityGrants" multiple size="8">${accessCapabilityOptions(options.capabilities)}</select></label><label>Explicit denies<select name="capabilityDenies" multiple size="8">${accessCapabilityOptions(options.capabilities)}</select></label></div></details>
          <label class="span-2">Reason<textarea name="reason" minlength="8" maxlength="500" required></textarea></label>
          <label class="checkbox span-2"><input name="confirmed" type="checkbox" required> I confirm this account and effective-access assignment.</label>
        </div><button class="primary" type="submit">Create account and show one-time credential</button></form>`,
        (modal) => {
          const form = modal.querySelector('#accessAccountCreateForm');
          form.elements.generateAccessId.addEventListener('change', () => {
            form.elements.accessId.disabled = form.elements.generateAccessId.checked;
            form.elements.accessId.required = !form.elements.generateAccessId.checked;
            if (form.elements.generateAccessId.checked) form.elements.accessId.value = '';
          });
          form.elements.presetId.addEventListener('change', () => {
            const preset = options.presets.find((entry) => entry.id === form.elements.presetId.value);
            if (!preset || preset.id === 'CUSTOM') return;
            form.elements.roleId.value = preset.roleId;
            form.querySelectorAll('[name="workspaceIds"]').forEach((control) => {
              control.checked = (preset.workspaceIds ?? []).includes(control.value);
            });
            form.querySelectorAll('[name="committeeIds"]').forEach((control) => {
              control.checked = (preset.committeeIds ?? []).includes(control.value);
            });
            form.elements.defaultWorkspaceId.value = preset.workspaceIds?.[0] ?? '';
            form.elements.defaultCommitteeId.value = preset.committeeIds?.[0] ?? '';
          });
          form.addEventListener('submit', async (event) => {
            event.preventDefault();
            if (!form.reportValidity()) return;
            const data = new FormData(form);
            const button = form.querySelector('[type="submit"]');
            button.disabled = true;
            try {
              const result = await services.createAccessAccount({
                accessId: data.get('accessId'),
                generateAccessId: form.elements.generateAccessId.checked,
                presetId: data.get('presetId'),
                roleId: data.get('roleId'),
                departmentId: data.get('departmentId'),
                status: data.get('status'),
                temporaryPasswordHours: Number(data.get('temporaryPasswordHours')),
                workspaceIds: data.getAll('workspaceIds'),
                defaultWorkspaceId: data.get('defaultWorkspaceId'),
                committeeIds: data.getAll('committeeIds'),
                defaultCommitteeId: data.get('defaultCommitteeId'),
                lendingEligible: form.elements.lendingEligible.checked,
                institutionId: data.get('institutionId'),
                locationScopeIds: data.getAll('locationScopeIds'),
                eventSeriesScopeIds: data.getAll('eventSeriesScopeIds'),
                eventScopeIds: data.getAll('eventScopeIds'),
                capabilityGrants: data.getAll('capabilityGrants'),
                capabilityDenies: data.getAll('capabilityDenies'),
                reason: data.get('reason'),
                confirmed: form.elements.confirmed.checked,
              });
              form.reset();
              accessDirectory = null;
              await refreshAccessDirectory({ force: true });
              openOneTimeCredentialHandoff('Account created', [result.credential]);
            } catch (error) {
              toast(error.message, true);
              button.disabled = false;
            }
          });
        },
      );
    } catch (error) {
      toast(error.message, true);
    }
  };

  const openDepartmentAccountSeed = () => {
    openModal(
      'Initialize department requester accounts',
      `<form id="departmentAccountSeedForm"><div class="alert warning">This creates the exact ten owner-approved department accounts in one atomic server operation. Initial passwords are shown only in the successful response.</div><label class="section-gap">Reason<textarea name="reason" minlength="8" maxlength="500" required></textarea></label><label class="checkbox section-gap"><input name="confirmed" type="checkbox" required> I confirm the governed ten-department initialization.</label><button class="primary" type="submit">Generate and initialize accounts</button></form>`,
      (modal) => {
        const form = modal.querySelector('#departmentAccountSeedForm');
        form.addEventListener('submit', async (event) => {
          event.preventDefault();
          if (!form.reportValidity()) return;
          const button = form.querySelector('[type="submit"]');
          button.disabled = true;
          try {
            const result = await services.seedDepartmentAccessAccounts({
              reason: form.elements.reason.value,
              confirmed: form.elements.confirmed.checked,
            });
            accessDirectory = null;
            await refreshAccessDirectory({ force: true });
            if (result.credentials?.length) {
              openOneTimeCredentialHandoff('Department access codes generated', result.credentials);
            } else {
              closeModal();
              toast('All ten governed department accounts are already initialized.');
            }
          } catch (error) {
            toast(error.message, true);
            button.disabled = false;
          }
        });
      },
    );
  };

  const referenceAdminFields = (domain, record = {}) => {
    const payload = record.payload ?? {};
    const common = `<label>Display name<input name="displayName" maxlength="160" value="${esc(payload.displayName ?? '')}"></label><label>Aliases<input name="aliases" maxlength="500" value="${esc((payload.aliases ?? []).join(' | '))}"></label><label>Effective from<input name="effectiveFrom" type="date" value="${esc(payload.effectiveFrom ?? record.effectiveFrom ?? '')}"></label><label>Effective to<input name="effectiveTo" type="date" value="${esc(payload.effectiveTo ?? record.effectiveTo ?? '')}"></label>`;
    if (domain === 'VENUES' || domain === 'EQUIPMENT')
      return `${common}<label>Category<input name="category" maxlength="80" value="${esc(payload.category ?? '')}" required></label><label>Location<input name="location" maxlength="160" value="${esc(payload.location ?? '')}"></label><label>Unit<select name="unit">${['service', 'piece', 'set', 'unit'].map((value) => option(value, value, payload.unit)).join('')}</select></label><label>Requestability<select name="requestability">${option('REQUESTABLE', 'Requestable - confirmation required', payload.requestability)}${option('NOT_REQUESTABLE', 'Not requestable', payload.requestability)}</select></label><label>Contact role<input name="contactRole" maxlength="120" value="${esc(payload.contactRole ?? '')}"></label><label>Route ID<input name="routeId" maxlength="100" value="${esc(payload.routeId ?? '')}" required></label>${domain === 'EQUIPMENT' ? `<label class="checkbox"><input name="returnRequired" type="checkbox" ${payload.returnRequired ? 'checked' : ''}> Return required</label>` : ''}<label class="span-2">Notes<textarea name="notes" maxlength="500">${esc(payload.notes ?? '')}</textarea></label>`;
    if (domain === 'ROUTING')
      return `<label>Match kind<select name="matchKind">${['REFERENCE', 'CATEGORY', 'OTHER'].map((value) => option(value, value, payload.matchKind)).join('')}</select></label><label>Reference ID<input name="referenceId" maxlength="100" value="${esc(payload.referenceId ?? '')}"></label><label>Reference type<input name="referenceType" maxlength="40" value="${esc(payload.referenceType ?? '')}"></label><label>Category<input name="category" maxlength="80" value="${esc(payload.category ?? '')}"></label><label>Owner committee<select name="ownerCommitteeId">${['COM_FOOD', 'COM_INVENTORY_PANTRY', 'COM_MATERIALS'].map((value) => option(value, value.replaceAll('_', ' '), payload.ownerCommitteeId)).join('')}</select></label><label>Owner user ID<input name="ownerUserId" maxlength="100" value="${esc(payload.ownerUserId ?? '')}"></label><label>Responsible office ID<input name="responsibleOfficeId" maxlength="100" value="${esc(payload.responsibleOfficeId ?? '')}" required></label><label>Approving authority ID<input name="approvingAuthorityId" maxlength="100" value="${esc(payload.approvingAuthorityId ?? '')}" required></label><label>Lead time (business days)<input name="leadTimeBusinessDays" type="number" min="1" max="90" value="${esc(payload.leadTimeBusinessDays ?? 1)}" required></label><label class="span-2">Instructions<textarea name="instructions" maxlength="500" required>${esc(payload.instructions ?? '')}</textarea></label><label>Effective from<input name="effectiveFrom" type="date" value="${esc(payload.effectiveFrom ?? record.effectiveFrom ?? '')}"></label><label>Effective to<input name="effectiveTo" type="date" value="${esc(payload.effectiveTo ?? record.effectiveTo ?? '')}"></label>`;
    if (domain === 'PERMISSIONS')
      return `<label>Role<select name="roleId">${['REQUESTER', 'DOL_STAFF', 'COMMITTEE_HEAD', 'DIRECTOR', 'ADMINISTRATOR', 'READ_ONLY_AUDITOR'].map((value) => option(value, value.replaceAll('_', ' '), payload.roleId)).join('')}</select></label><label>Committee IDs<input name="committeeIds" maxlength="260" value="${esc((payload.committeeIds ?? []).join(' | '))}"></label><label class="checkbox"><input name="active" type="checkbox" ${payload.active !== false ? 'checked' : ''}> Active access</label><label class="checkbox"><input name="emergencyRevocation" type="checkbox"> Emergency revocation only</label><label class="span-2">Reason<textarea name="reason" maxlength="500" required></textarea></label>`;
    return `${common}<label class="span-2">Description<textarea name="description" maxlength="500">${esc(payload.description ?? '')}</textarea></label>`;
  };

  const referenceAdminPatchFromForm = (domain, form) => {
    const values = Object.fromEntries(new FormData(form).entries());
    delete values.targetId;
    if (Object.prototype.hasOwnProperty.call(values, 'aliases'))
      values.aliases = values.aliases
        .split(/[|,]/)
        .map((entry) => entry.trim())
        .filter(Boolean);
    if (domain === 'PERMISSIONS') {
      values.committeeIds = String(values.committeeIds ?? '')
        .split(/[|,]/)
        .map((entry) => entry.trim())
        .filter(Boolean);
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
    renderReferenceAdminWorkspace();
    if (referenceAdminDomain === 'PERMISSIONS') {
      return refreshAccessDirectory({ force });
    }
    if (referenceAdminPromise) return referenceAdminPromise;
    if (!force && referenceAdminWorkspace?.domain === referenceAdminDomain) return;
    const query = root.querySelector('[name="referenceAdminSearch"]')?.value ?? '';
    const status = root.querySelector('[name="referenceAdminStatus"]')?.value ?? 'ALL';
    referenceAdminPromise = services.getReferenceAdminWorkspace({
      domain: referenceAdminDomain,
      query,
      status,
      limit: 50,
    });
    try {
      referenceAdminWorkspace = await referenceAdminPromise;
      renderReferenceAdminWorkspace();
    } catch (error) {
      root.querySelector('[data-reference-admin-results]').innerHTML =
        `<div class="alert error">${esc(error.message)}</div>`;
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
            patch:
              action === 'ADD' || action === 'UPDATE'
                ? referenceAdminPatchFromForm(referenceAdminDomain, form)
                : {},
            reason: form.elements.reason?.value ?? '',
          };
          try {
            const preview = await services.previewReferenceAdminChange(command);
            openModal(
              'Confirm administrative change',
              `<div class="mode-note"><strong>${esc(preview.risk)}</strong> &middot; ${preview.requiresReview ? 'Separate review required' : 'Applies after confirmation'} &middot; Revision ${esc(preview.expectedRevision)} to ${esc(preview.after.revision)}</div><div class="comparison-grid section-gap"><article class="card"><h3>Before</h3><pre>${esc(JSON.stringify(preview.before, null, 2))}</pre></article><article class="card"><h3>After</h3><pre>${esc(JSON.stringify(preview.after, null, 2))}</pre></article></div><button class="primary" type="button" data-reference-admin-confirm>Confirm ${preview.requiresReview ? 'review request' : 'change'}</button>`,
              (confirmation) => {
                confirmation
                  .querySelector('[data-reference-admin-confirm]')
                  .addEventListener('click', async (confirmEvent) => {
                    const button = confirmEvent.currentTarget;
                    button.disabled = true;
                    try {
                      const result = await services.submitReferenceAdminChange({
                        ...command,
                        idempotencyKey: `reference-admin-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`,
                      });
                      closeModal();
                      referenceAdminWorkspace = null;
                      await refreshReferenceAdminWorkspace({ force: true });
                      toast(
                        result.applied
                          ? 'Administrative change applied and audited.'
                          : 'Administrative change queued for separate review.',
                      );
                    } catch (error) {
                      toast(error.message, true);
                      button.disabled = false;
                    }
                  });
              },
            );
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
            toast(
              result.applied
                ? 'Administrative change approved, applied, and audited.'
                : 'Administrative change rejected and audited.',
            );
          } catch (error) {
            toast(error.message, true);
            button.disabled = false;
          }
        });
      },
    );
  };

  const adminExceptionCounts = (state = getState() ?? {}) => {
    const statusIn = (row, values) => values.has(String(row?.status ?? '').toUpperCase());
    const requestBlockers = (state.requests ?? []).filter((row) =>
      statusIn(row, new Set(['FOR_REVIEW', 'BLOCKED', 'WAITING_FOR_BUDGET', 'NEEDS_INFORMATION'])),
    ).length;
    const lendingBlockers = (state.lendingTickets ?? []).filter((row) =>
      statusIn(row, new Set(['FOR_REVIEW', 'OVERDUE', 'DAMAGED', 'LOST'])),
    ).length;
    const releaseBlockers = [...(state.requestLines ?? []), ...(state.deliverables ?? [])].filter((row) =>
      statusIn(row, new Set(['BLOCKED', 'NEEDS_INFORMATION', 'PARTIALLY_RELEASED'])),
    ).length;
    const inventoryDiscrepancies = (state.inventoryItems ?? []).filter(
      (item) =>
        String(item?.status ?? '').toUpperCase() === 'VERIFY' ||
        Number(item?.openingOnHand ?? 0) <= Number(item?.reorderThreshold ?? 0),
    ).length;
    const failedEvidence = (state.evidenceFiles ?? []).filter((row) =>
      statusIn(row, new Set(['FAILED', 'REJECTED', 'CORRUPT', 'UNAVAILABLE'])),
    ).length;
    const accessChanges = (state.referenceAdminChanges ?? []).filter((row) =>
      statusIn(row, new Set(['PENDING_REVIEW', 'APPLYING', 'FAILED'])),
    ).length;
    const referenceErrors = (state.referenceAdminRecords ?? []).filter(
      (row) =>
        row?.domain === 'SYNC_HEALTH' &&
        statusIn(row, new Set(['ERROR', 'FAILED', 'STALE', 'CONFLICT', 'VERIFY'])),
    ).length;
    const environment = String(state.environment ?? config.appEnvironment ?? '').toUpperCase();
    const environmentIssues = ['DEVELOPMENT', 'STAGING', 'PRODUCTION'].includes(environment) ? 0 : 1;
    return {
      accessChanges,
      failedEvidence,
      referenceErrors,
      inventoryDiscrepancies,
      requestBlockers,
      lendingBlockers,
      releaseBlockers,
      environmentIssues,
      total:
        accessChanges +
        failedEvidence +
        referenceErrors +
        inventoryDiscrepancies +
        requestBlockers +
        lendingBlockers +
        releaseBlockers +
        environmentIssues,
    };
  };

  const renderAdminOperationalHealth = () => {
    const root = document.querySelector('[data-admin-operational-health]');
    if (!root) return;
    const state = getState() ?? {};
    const counts = adminExceptionCounts(state);
    const environment = String(state.environment ?? config.appEnvironment ?? 'UNKNOWN').toUpperCase();
    const revision = state.dataRevision ?? 'Not reported';
    const updatedAt = state.dataRevisionUpdatedAt || state.updatedAt || '';
    const metrics = [
      ['Environment', environment, 'Server-reported deployment identity'],
      ['Release', `v${state.appVersion ?? '0.7.0'}`, 'Authenticated application release'],
      ['Schema', state.schemaVersion ?? 'Not reported', 'Server-reported data contract'],
      ['Attention', counts.total, 'Cross-workspace exception total'],
    ];
    root.querySelector('[data-admin-health-metrics]').innerHTML = metrics
      .map(
        ([label, value, note]) =>
          `<article class="card metric"><span>${esc(label)}</span><strong>${esc(value)}</strong><small>${esc(note)}</small></article>`,
      )
      .join('');
    root.querySelector('[data-admin-health-attention]').innerHTML = `
      <div class="request-line"><div><strong>Operational data revision</strong><small>${esc(revision)} &middot; ${esc(updatedAt ? accessDate(updatedAt) : 'Last update not reported')}</small></div><span class="pill">Read only</span></div>
      <div class="request-line"><div><strong>Authorization boundary</strong><small>Visibility and navigation do not grant a capability; every action remains server-authorized.</small></div><span class="pill">Fail closed</span></div>
      <div class="request-line"><div><strong>Cross-workspace attention</strong><small>${esc(counts.requestBlockers)} request &middot; ${esc(counts.lendingBlockers)} lending &middot; ${esc(counts.releaseBlockers)} release &middot; ${esc(counts.inventoryDiscrepancies)} inventory</small></div><button class="secondary mini" type="button" data-admin-destination="cross-workspace-attention">Open attention</button></div>`;
  };

  const brandAssetDefinitions = [
    ['usc-logo', 'USC logo', 'Official council identity'],
    ['dol-logo', 'DOL logo', 'Department identity'],
    ['combined-lockup', 'Combined lockup', 'Approved combined identity'],
    ['favicon', 'Favicon', 'Browser and compact identity'],
    ['login-background', 'Login background', 'Governed staff sign-in background'],
    ['default-item-image', 'Default item image', 'Catalog fallback when no item photo exists'],
  ];

  const renderAdminBrandAssets = () => {
    const root = document.querySelector('[data-admin-brand-assets]');
    if (!root) return;
    const managed = brandAssetManagementAllowed();
    root.querySelector('[data-brand-assets-owner-state]').textContent = managed
      ? 'System Owner controls enabled'
      : 'Read-only governed routes';
    root.querySelector('[data-brand-assets-refresh]').hidden = !managed;
    root.querySelector('[data-admin-brand-slots]').innerHTML = brandAssetDefinitions
      .map(([id, label, note]) => {
        const path = `/brand/${id}`;
        const slot = brandAssetDirectory?.slots?.find((entry) => entry.id === id);
        const versions = (brandAssetDirectory?.versions ?? []).filter((entry) => entry.slot_id === id);
        const history = versions
          .map((version) => {
            const published = version.status === 'PUBLISHED';
            const action = published
              ? ''
              : version.published_at
                ? `<button class="secondary mini" type="button" data-brand-rollback="${esc(version.id)}" data-brand-slot-id="${esc(id)}">Roll back</button>`
                : `<button class="primary mini" type="button" data-brand-publish="${esc(version.id)}" data-brand-slot-id="${esc(id)}">Publish</button>`;
            return `<div class="request-line"><div><strong>Version ${esc(version.version_number)}</strong><small>${esc(version.content_type)} &middot; ${esc(version.width)}&times;${esc(version.height)} &middot; ${esc(version.byte_size)} bytes</small><small>${esc(version.status)} &middot; SHA-256 ${esc(String(version.content_sha256).slice(0, 12))}&hellip;</small></div>${managed ? action : ''}</div>`;
          })
          .join('');
        const routeState = slot?.published_version_id
          ? `Published v${slot.version_number}`
          : managed
            ? 'Not published'
            : 'Governed route';
        return `<article class="admin-brand-slot" data-brand-slot="${esc(path)}"><div class="admin-brand-preview"><img src="${esc(path)}?revision=${esc(slot?.revision ?? 1)}" alt="${esc(slot?.alt_text ?? '')}" loading="lazy" decoding="async"></div><strong>${esc(label)}</strong><small>${esc(note)}</small><code>${esc(path)}</code><span class="pill">${esc(routeState)}</span>${managed ? `<button class="secondary mini" type="button" data-brand-upload="${esc(id)}">Upload new draft</button>` : ''}${history ? `<details><summary>Version history</summary><div class="line-list">${history}</div></details>` : ''}</article>`;
      })
      .join('');
  };

  const refreshBrandAssets = async ({ force = false } = {}) => {
    if (!brandAssetManagementAllowed()) {
      renderAdminBrandAssets();
      return;
    }
    if (!force && brandAssetDirectory) return renderAdminBrandAssets();
    const root = document.querySelector('[data-admin-brand-slots]');
    if (root) root.innerHTML = '<div class="empty">Loading governed brand asset versions&hellip;</div>';
    try {
      brandAssetDirectory = await services.listBrandAssets({});
      renderAdminBrandAssets();
    } catch (error) {
      if (root) root.innerHTML = `<div class="empty">${esc(error.message)}</div>`;
    }
  };

  const openBrandAssetUpload = (slot) => {
    const label = brandAssetDefinitions.find(([id]) => id === slot)?.[1] ?? slot;
    openModal(
      `Upload ${label}`,
      `<form data-brand-upload-form><div class="alert">The file is validated from its bytes. Upload creates a draft; publication is a separate audited action.</div><div class="form-grid section-gap"><label class="span-2">Image file<input name="file" type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml" required></label><label class="span-2">Accessible alt text<input name="altText" maxlength="240" required></label><label class="span-2">Reason<textarea name="reason" minlength="8" maxlength="500" required></textarea></label></div><div class="admin-brand-preview section-gap"><img data-brand-local-preview alt="Local preview" hidden></div><button class="primary" type="submit">Validate and upload draft</button></form>`,
      (modal) => {
        const form = modal.querySelector('[data-brand-upload-form]');
        const input = form.elements.file;
        input.addEventListener('change', () => {
          const preview = form.querySelector('[data-brand-local-preview]');
          if (!input.files?.[0]) return;
          preview.src = URL.createObjectURL(input.files[0]);
          preview.hidden = false;
        });
        form.addEventListener('submit', async (event) => {
          event.preventDefault();
          if (!form.reportValidity()) return;
          const button = form.querySelector('[type="submit"]');
          button.disabled = true;
          try {
            const file = input.files[0];
            const base64 = await new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onerror = () => reject(new Error('The selected file could not be read.'));
              reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
              reader.readAsDataURL(file);
            });
            await services.uploadBrandAsset({
              slot,
              base64,
              altText: form.elements.altText.value,
              reason: form.elements.reason.value,
              clientRequestId: `brand-upload-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`,
            });
            closeModal();
            brandAssetDirectory = null;
            await refreshBrandAssets({ force: true });
            toast('Validated brand asset draft uploaded. Review its metadata before publishing.');
          } catch (error) {
            toast(error.message, true);
            button.disabled = false;
          }
        });
      },
    );
  };

  const changePublishedBrandAsset = async (slot, versionId, rollback) => {
    const current = brandAssetDirectory?.slots?.find((entry) => entry.id === slot);
    try {
      await services[rollback ? 'rollbackBrandAsset' : 'publishBrandAsset']({
        slot,
        versionId,
        expectedRevision: current?.revision,
        reason: rollback
          ? 'Restore a previously published governed version.'
          : 'Publish the reviewed governed brand asset version.',
        clientRequestId: `brand-${rollback ? 'rollback' : 'publish'}-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`,
      });
      brandAssetDirectory = null;
      await refreshBrandAssets({ force: true });
      toast(
        rollback
          ? 'Brand asset rollback published and audited.'
          : 'Brand asset version published and audited.',
      );
    } catch (error) {
      toast(error.message, true);
    }
  };

  const renderAdminEvidenceStatus = () => {
    const root = document.querySelector('[data-admin-evidence-status]');
    if (!root) return;
    const state = getState() ?? {};
    const evidence = state.evidenceFiles ?? [];
    const failed = evidence.filter((row) =>
      new Set(['FAILED', 'REJECTED', 'CORRUPT', 'UNAVAILABLE']).has(String(row?.status ?? '').toUpperCase()),
    );
    const openDeliverables = (state.deliverables ?? []).filter(
      (row) =>
        !['COMPLETED', 'REJECTED', 'CANCELLED', 'ARCHIVED'].includes(
          String(row?.status ?? '').toUpperCase(),
        ) && !row?.evidenceId,
    );
    const metrics = [
      ['Evidence records', evidence.length, 'Authorized metadata records'],
      ['Failed or unavailable', failed.length, 'File records requiring follow-up'],
      [
        'Open deliverables missing evidence',
        openDeliverables.length,
        'Owning workflow remains authoritative',
      ],
      ['Governed storage', 'R2 / Drive', 'Provider identifiers remain private'],
    ];
    root.querySelector('[data-admin-evidence-metrics]').innerHTML = metrics
      .map(
        ([label, value, note]) =>
          `<article class="card metric"><span>${esc(label)}</span><strong>${esc(value)}</strong><small>${esc(note)}</small></article>`,
      )
      .join('');
    const exceptions = [
      ...failed.map((row) => ({
        id: row.id,
        label: row.name || row.id,
        note: `Evidence ${row.status}`,
      })),
      ...openDeliverables.map((row) => ({
        id: row.id,
        label: row.itemSpec || row.id,
        note: 'Open deliverable has no linked evidence',
      })),
    ];
    root.querySelector('[data-admin-evidence-results]').innerHTML =
      exceptions
        .map(
          (row) =>
            `<div class="request-line"><div><strong>${esc(row.label)}</strong><small>${esc(row.id)} &middot; ${esc(row.note)}</small></div><button class="secondary mini" type="button" data-admin-destination="procurement-evidence">Open owner workflow</button></div>`,
        )
        .join('') ||
      '<div class="empty">No failed evidence or open deliverable evidence exceptions are currently projected.</div>';
  };

  const renderEvidenceSystemStatus = () => {
    const root = document.querySelector('[data-system-status]');
    if (!root || root.hidden || !evidenceSystemStatusAllowed()) return;
    const status = evidenceSystemStatus;
    if (!status) return;
    const pending = Number(status.pendingDriveBackups ?? 0);
    const failed = Number(status.failedDriveBackups ?? 0);
    const restoreRequired = Number(status.filesRequiringRestoration ?? 0);
    const primaryAvailable = String(status.primaryR2Status ?? '').toUpperCase() === 'AVAILABLE';
    const release = status.release ?? {};
    const database = status.database ?? {};
    const bindings = status.bindings ?? {};
    const authentication = status.authentication ?? {};
    const emailVerification = status.emailVerification ?? {};
    const roster = status.identityRoster ?? {};
    const storage = status.storage ?? {};
    const inventory = status.inventory ?? {};
    const recovery = status.recovery ?? {};
    const rateLimitTotal =
      Number(authentication.authRateLimitEvents24h ?? 0) +
      Number(authentication.publicRequestRateLimitEvents24h ?? 0) +
      Number(authentication.publicLendingRateLimitEvents24h ?? 0);
    root.querySelector('[data-system-status-metrics]').innerHTML = [
      ['Overall', status.overallStatus ?? 'Not assessed', 'Truthful aggregate; attention is not hidden'],
      [
        'Worker / API',
        status.workerApi?.status ?? 'Not reported',
        `${status.workerApi?.readinessIssueCount ?? 0} readiness issue(s)`,
      ],
      [
        'Deployed release',
        `v${release.releaseVersion ?? 'Not reported'}`,
        `${release.environment ?? 'Unknown'} · ${String(release.candidateSha ?? 'Not reported').slice(0, 12)}`,
      ],
      [
        'D1 schema',
        database.schemaVersion ?? 'Not reported',
        database.latestMigration ?? 'Latest migration not reported',
      ],
      [
        'Current bindings',
        [bindings.d1, bindings.brandR2, bindings.evidenceR2, bindings.staticAssets].every(
          (value) => value === 'BOUND',
        )
          ? 'Bound'
          : 'Attention',
        `${bindings.currentEnvironment ?? 'Unknown'} resources only`,
      ],
      [
        'Authentication',
        authentication.status ?? 'Not reported',
        `${authentication.activeAccounts ?? 0} active account(s) · ${authentication.activeSessions ?? 0} active session(s)`,
      ],
      [
        'Email verification',
        emailVerification.status ?? 'Not reported',
        emailVerification.note ?? 'Provider state unavailable',
      ],
      [
        'Identity roster sync',
        roster.status ?? 'Not reported',
        `${roster.latestApplyStatus ?? 'Not recorded'} · ${roster.activeIdentities ?? 0} active identities`,
      ],
      ['Google Drive backup', storage.googleDrive ?? 'Not reported', 'Private evidence recovery copy'],
      [
        'R2 storage',
        primaryAvailable && storage.brandR2 === 'AVAILABLE' ? 'Available' : 'Attention',
        `Brand ${storage.brandR2 ?? 'unknown'} · Evidence ${storage.evidenceR2 ?? 'unknown'}`,
      ],
      [
        'Evidence failures',
        failed + restoreRequired,
        `${pending} pending · ${restoreRequired} require restoration`,
      ],
      [
        'Login / rate limits',
        Number(authentication.failedLoginEvents24h ?? 0) + rateLimitTotal,
        `${authentication.failedLoginEvents24h ?? 0} failed login event(s) · ${rateLimitTotal} rate-limit event(s), last 24h`,
      ],
      [
        'Inventory alerts',
        Number(inventory.negativeBalanceAlerts ?? 0) + Number(inventory.lowStockAlerts ?? 0),
        `${inventory.negativeBalanceAlerts ?? 0} negative · ${inventory.lowStockAlerts ?? 0} low stock · ${inventory.classificationPending ?? 0} pending classification`,
      ],
      [
        'Last successful backup',
        recovery.lastSuccessfulBackupAt ? accessDate(recovery.lastSuccessfulBackupAt) : 'Not recorded',
        'Most recent verified private recovery copy',
      ],
      [
        'Last reconciliation',
        recovery.lastSuccessfulReconciliationAt
          ? accessDate(recovery.lastSuccessfulReconciliationAt)
          : 'Not recorded',
        'Most recent primary-object verification',
      ],
      [
        'Last rollback rehearsal',
        recovery.lastRollbackRehearsalAt ? accessDate(recovery.lastRollbackRehearsalAt) : 'Not recorded',
        recovery.rollbackRehearsalStatus ?? 'Recovery rehearsal status unavailable',
      ],
    ]
      .map(
        ([label, value, note]) =>
          `<article class="card metric"><span>${esc(label)}</span><strong>${esc(value)}</strong><small>${esc(note)}</small></article>`,
      )
      .join('');

    const stateMessage = root.querySelector('[data-system-status-state]');
    const needsAttention = String(status.overallStatus ?? '').toUpperCase() !== 'HEALTHY';
    stateMessage.className = `alert ${needsAttention ? 'warning' : 'success'}`;
    stateMessage.textContent = needsAttention
      ? 'Operational health has truthful attention items. Review the safe aggregate statuses below.'
      : 'Worker, data, authentication, storage, inventory, and recovery status report no active exceptions.';

    const technical = status.technicalDetails ?? {};
    const statusCounts = Object.entries(technical.statusCounts ?? {})
      .filter(([, count]) => Number(count) > 0)
      .map(([name, count]) => `${name}: ${Number(count)}`)
      .join(' | ');
    root.querySelector('[data-system-status-technical-details]').innerHTML = [
      [
        'Environment boundary',
        bindings.otherEnvironment ?? 'Not reported',
        'The other environment is not loaded into this Worker',
      ],
      [
        'D1 migration time',
        database.latestMigrationAt ? accessDate(database.latestMigrationAt) : 'Not recorded',
        database.schemaUpdatedAt
          ? `Schema updated ${accessDate(database.schemaUpdatedAt)}`
          : 'Schema update time not recorded',
      ],
      [
        'Authentication totals',
        `${authentication.totalAccounts ?? 0} total · ${authentication.starterAccounts ?? 0} starter · ${authentication.inactiveAccounts ?? 0} inactive`,
        'Aggregate counts only; account identifiers are omitted',
      ],
      [
        'Evidence backup queue',
        statusCounts || 'No active backup records',
        `Oldest pending: ${status.oldestPendingBackupAt ? accessDate(status.oldestPendingBackupAt) : 'None'}`,
      ],
      [
        'Identifier protection',
        Object.values(status.protection ?? {}).every(Boolean) ? 'Enforced' : 'Unconfirmed',
        'No secret, account identifier, provider ID, raw error, object key, OAuth value, or personal data is rendered',
      ],
    ]
      .map(
        ([label, value, note]) =>
          `<div class="request-line"><div><strong>${esc(label)}</strong><small>${esc(value)}</small><small>${esc(note)}</small></div></div>`,
      )
      .join('');
  };

  const refreshEvidenceSystemStatus = async ({ force = false } = {}) => {
    if (!evidenceSystemStatusAllowed()) return;
    const root = document.querySelector('[data-system-status]');
    if (!root || root.hidden) return;
    if (!force && evidenceSystemStatus) {
      renderEvidenceSystemStatus();
      return;
    }
    const stateMessage = root.querySelector('[data-system-status-state]');
    stateMessage.className = 'alert';
    stateMessage.textContent = 'Loading protected evidence-storage status...';
    try {
      evidenceSystemStatus = await services.getEvidenceSystemStatus({});
      renderEvidenceSystemStatus();
    } catch (error) {
      stateMessage.className = 'alert error';
      stateMessage.textContent = error.message;
    }
  };

  const renderIdentityRoster = () => {
    const root = document.querySelector('[data-identity-roster]');
    if (!root || root.hidden || !identityRosterAllowed()) return;
    const sourceState = root.querySelector('[data-roster-source-state]');
    const source = identityRosterStatus?.source;
    if (source?.configured) {
      sourceState.className = 'alert success';
      sourceState.textContent =
        'The approved private source and least-privilege reader are configured. A source read occurs only when the System Owner requests a preview.';
    } else {
      sourceState.className = 'alert warning';
      sourceState.textContent = `Sync remains fail-closed. Missing private configuration: ${(source?.missingConfiguration ?? []).join(', ') || 'status unavailable'}.`;
    }
    const latest = identityRosterStatus?.latestRun;
    const latestApplied = identityRosterStatus?.latestAppliedRun;
    const directory = identityRosterStatus?.directory ?? { total: 0, active: 0 };
    root.querySelector('[data-roster-metrics]').innerHTML = [
      ['Protected identities', directory.total, 'Owner directory only'],
      ['Active identities', directory.active, 'D1 last-known projection'],
      [
        'Last sync',
        latestApplied?.appliedAt ? accessDate(latestApplied.appliedAt) : 'Not applied',
        latestApplied?.applyStatus ?? 'No applied run',
      ],
      ['Source fingerprint', latest?.sourceFingerprint ?? 'Not recorded', 'Opaque content fingerprint'],
    ]
      .map(
        ([label, value, note]) =>
          `<article class="card metric"><span>${esc(label)}</span><strong>${esc(value)}</strong><small>${esc(note)}</small></article>`,
      )
      .join('');

    const previewRoot = root.querySelector('[data-roster-preview-result]');
    if (!identityRosterPreview) previewRoot.innerHTML = '';
    else {
      const preview = identityRosterPreview;
      const rejected = preview.validationStatus === 'REJECTED';
      previewRoot.innerHTML = `<article class="mode-note"><strong>Directory preview ${esc(preview.id)}</strong><dl class="access-effective-preview section-gap"><div><dt>Source fingerprint</dt><dd>${esc(preview.sourceFingerprint)}</dd></div><div><dt>Rows reviewed</dt><dd>${esc(preview.sourceRowCount)}</dd></div><div><dt>Additions</dt><dd>${esc(preview.addCount)}</dd></div><div><dt>Changes</dt><dd>${esc(preview.changeCount)}</dd></div><div><dt>Removals</dt><dd>${esc(preview.removalCount)}</dd></div><div><dt>Unchanged</dt><dd>${esc(preview.unchangedCount)}</dd></div><div><dt>Quarantined</dt><dd>${esc(preview.rejectionCount)}</dd></div><div><dt>Validation</dt><dd>${esc(preview.validationStatus)}</dd></div></dl>${(preview.rejections ?? []).length ? `<div class="alert warning section-gap"><strong>Rows kept in quarantine</strong><p>These rows will not be written. A matching current directory record, when identifiable, will be kept unchanged.</p>${preview.rejections.map((entry) => `<p>Source row ${esc(entry.rowNumber)} &middot; ${esc(entry.codes.join(', '))}</p>`).join('')}</div>` : ''}${rejected ? '<div class="alert error section-gap">No valid directory rows are available to apply. Correct the private source and create a new preview.</div>' : `<form data-roster-apply class="form-grid section-gap"><input type="hidden" name="runId" value="${esc(preview.id)}"><label class="span-2">Confirm exact source fingerprint<input name="confirmSourceFingerprint" autocomplete="off" required></label><label class="span-2">Reason<textarea name="reason" minlength="8" maxlength="500" required></textarea></label><button class="danger" type="submit">Apply accepted directory rows</button></form>`}</article>`;
      const applyForm = previewRoot.querySelector('[data-roster-apply]');
      applyForm?.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!applyForm.reportValidity()) return;
        const button = applyForm.querySelector('[type="submit"]');
        button.disabled = true;
        try {
          await services.applyIdentityRosterSync(Object.fromEntries(new FormData(applyForm).entries()));
          identityRosterPreview = null;
          toast('USC Officer and Staff Directory applied and reconciled.');
          await refreshIdentityRoster({ force: true });
        } catch (error) {
          toast(operationalErrorText(error), true);
          button.disabled = false;
        }
      });
    }

    const items = identityRosterDirectory?.items ?? [];
    root.querySelector('[data-roster-directory]').innerHTML =
      items
        .map(
          (entry) =>
            `<div class="request-line"><div><strong>${esc(entry.displayName)}</strong><small>${esc(entry.studentId)} &middot; ${esc(entry.institutionalEmail)}</small><small>${esc(entry.verificationResult)} &middot; ${entry.active ? 'Active' : 'Inactive'} &middot; updated ${esc(accessDate(entry.updatedAt))}</small>${entry.reviewNotes ? `<small>Review: ${esc(entry.reviewNotes)}</small>` : ''}</div><span class="pill">${entry.active ? 'Active' : 'Inactive'}</span></div>`,
        )
        .join('') || '<div class="empty">No officers or staff match this search.</div>';
    const pagination = identityRosterDirectory?.pagination ?? {
      page: 1,
      totalPages: 1,
      total: items.length,
    };
    const pager = root.querySelector('[data-roster-pagination]');
    pager.hidden = pagination.totalPages <= 1;
    pager.querySelector('[data-roster-page-summary]').textContent =
      `Page ${pagination.page} of ${pagination.totalPages} · ${pagination.total} identities`;
    pager.querySelector('[data-roster-page="previous"]').disabled = pagination.page <= 1;
    pager.querySelector('[data-roster-page="next"]').disabled = pagination.page >= pagination.totalPages;

    root.querySelector('[data-roster-history]').innerHTML =
      (identityRosterStatus?.runs ?? [])
        .map(
          (run) =>
            `<div class="request-line"><div><strong>${esc(run.applyStatus)} &middot; ${esc(run.id)}</strong><small>${esc(accessDate(run.createdAt))} &middot; ${esc(run.validationStatus)} &middot; fingerprint ${esc(run.sourceFingerprint)}</small><small>${esc(run.addCount)} add &middot; ${esc(run.changeCount)} change &middot; ${esc(run.removalCount)} removal &middot; ${esc(run.rejectionCount)} rejection</small></div>${latestApplied?.id === run.id ? `<button class="danger mini" type="button" data-roster-rollback="${esc(run.id)}" data-roster-fingerprint="${esc(run.sourceFingerprint)}">Roll back latest sync</button>` : ''}</div>`,
        )
        .join('') || '<div class="empty">No directory update has been previewed.</div>';
  };

  const refreshIdentityRoster = async ({ force = false } = {}) => {
    if (!identityRosterAllowed()) return;
    const root = document.querySelector('[data-identity-roster]');
    if (!root || root.hidden) return;
    if (!force && identityRosterStatus && identityRosterDirectory) {
      renderIdentityRoster();
      return;
    }
    root.querySelector('[data-roster-directory]').innerHTML =
      '<div class="empty">Loading the protected USC Officer and Staff Directory…</div>';
    try {
      [identityRosterStatus, identityRosterDirectory] = await Promise.all([
        services.getIdentityRosterStatus({}),
        services.listIdentityRoster({
          query: root.querySelector('[name="identityRosterSearch"]')?.value ?? '',
          active: root.querySelector('[name="identityRosterActive"]')?.value ?? 'ALL',
          verificationResult: root.querySelector('[name="identityRosterVerification"]')?.value ?? 'ALL',
          page: identityRosterPage,
          pageSize: 25,
        }),
      ]);
      renderIdentityRoster();
    } catch (error) {
      root.querySelector('[data-roster-directory]').innerHTML =
        `<div class="alert error"><strong>Directory unavailable.</strong><p>${esc(operationalErrorText(error))}</p><button class="secondary mini" type="button" data-roster-retry>Retry</button></div>`;
      root.querySelector('[data-roster-retry]')?.addEventListener('click', () => {
        identityRosterStatus = null;
        identityRosterDirectory = null;
        void refreshIdentityRoster({ force: true });
      });
    }
  };

  const previewIdentityRoster = async () => {
    const button = document.querySelector('[data-roster-preview]');
    if (!button || !identityRosterAllowed()) return;
    button.disabled = true;
    try {
      identityRosterPreview = await services.previewIdentityRosterSync({});
      identityRosterStatus = null;
      identityRosterDirectory = null;
      await refreshIdentityRoster({ force: true });
      toast('USC Officer and Staff Directory preview completed.');
    } catch (error) {
      toast(operationalErrorText(error), true);
    } finally {
      button.disabled = false;
    }
  };

  const openIdentityRosterRollback = (runId, sourceFingerprint) => {
    const clientRequestId = `roster-rollback-${globalThis.crypto?.randomUUID?.() ?? Date.now()}`;
    openModal(
      'Roll back the latest directory update',
      `<form data-roster-rollback-form><div class="alert warning">Rollback restores the protected pre-apply D1 snapshot. It does not change the private Google Sheet.</div><div class="form-grid section-gap"><input type="hidden" name="runId" value="${esc(runId)}"><label class="span-2">Confirm exact source fingerprint<input name="confirmSourceFingerprint" autocomplete="off" required></label><label class="span-2">Reason<textarea name="reason" minlength="8" maxlength="500" required></textarea></label></div><button class="danger" type="submit">Restore protected snapshot</button></form>`,
      (modal) => {
        const form = modal.querySelector('[data-roster-rollback-form]');
        form.addEventListener('submit', async (event) => {
          event.preventDefault();
          if (!form.reportValidity()) return;
          if (form.elements.confirmSourceFingerprint.value !== sourceFingerprint) {
            toast('The source fingerprint confirmation does not match.', true);
            return;
          }
          const button = form.querySelector('[type="submit"]');
          button.disabled = true;
          try {
            const result = await services.rollbackIdentityRosterSync({
              ...Object.fromEntries(new FormData(form).entries()),
              clientRequestId,
            });
            closeModal();
            identityRosterStatus = null;
            identityRosterDirectory = null;
            await refreshIdentityRoster({ force: true });
            toast(`The latest directory update was rolled back and reconciled.${auditReferenceText(result)}`);
          } catch (error) {
            toast(operationalErrorText(error), true);
            button.disabled = false;
          }
        });
      },
    );
  };

  const renderAdminControlSurface = () => {
    if (adminControlSurface === 'operational-health') renderAdminOperationalHealth();
    if (adminControlSurface === 'brand-assets') renderAdminBrandAssets();
    if (adminControlSurface === 'evidence-status') renderAdminEvidenceStatus();
    if (adminControlSurface === 'system-status') renderEvidenceSystemStatus();
    if (adminControlSurface === 'identity-roster') renderIdentityRoster();
  };

  const renderReferenceAdminWorkspace = () => {
    const root = document.querySelector('#referenceAdminWorkspace');
    if (!root) return;
    const allowed = referenceAdminAllowed();
    root.hidden = !allowed;
    if (!allowed) return;
    const customSurface = [
      'operational-health',
      'brand-assets',
      'evidence-status',
      'system-status',
      'identity-roster',
    ].includes(adminControlSurface);
    const accessMode = !customSurface && referenceAdminDomain === 'PERMISSIONS';
    const accessRoot = root.querySelector('[data-access-management]');
    accessRoot.hidden = advertisementAdminOpen || customSurface || !accessMode || !accessManagementAllowed();
    root.querySelector('[data-reference-admin-generic]').hidden =
      advertisementAdminOpen || customSurface || accessMode;
    root.querySelector('[data-reference-admin-pending-panel]').hidden =
      advertisementAdminOpen || customSurface || accessMode;
    root.querySelector('[data-admin-operational-health]').hidden =
      adminControlSurface !== 'operational-health';
    root.querySelector('[data-admin-brand-assets]').hidden = adminControlSurface !== 'brand-assets';
    root.querySelector('[data-admin-evidence-status]').hidden = adminControlSurface !== 'evidence-status';
    root.querySelector('[data-system-status]').hidden =
      adminControlSurface !== 'system-status' || !evidenceSystemStatusAllowed();
    root.querySelector('[data-identity-roster]').hidden =
      adminControlSurface !== 'identity-roster' || !identityRosterAllowed();
    const advertisementRoot = root.querySelector('[data-advertisement-admin]');
    advertisementRoot.hidden = !advertisementAdminOpen || !advertisementManagementAllowed();
    const advertisementControl = root.querySelector('[data-advertisement-admin-control]');
    advertisementControl.hidden = !advertisementManagementAllowed();
    advertisementControl.disabled = !advertisementManagementAllowed();
    advertisementControl.classList.toggle('active', advertisementAdminOpen);
    advertisementControl.setAttribute('aria-pressed', String(advertisementAdminOpen));
    const accessControl = root.querySelector('[data-reference-admin-control-domain="PERMISSIONS"]');
    if (accessControl) {
      accessControl.hidden = !accessManagementAllowed();
      accessControl.disabled = !accessManagementAllowed();
    }
    const rosterControl = root.querySelector('[data-admin-control-surface="identity-roster"]');
    if (rosterControl) {
      rosterControl.hidden = !identityRosterAllowed();
      rosterControl.disabled = !identityRosterAllowed();
    }
    const systemStatusControl = root.querySelector('[data-admin-control-surface="system-status"]');
    if (systemStatusControl) {
      systemStatusControl.hidden = !evidenceSystemStatusAllowed();
      systemStatusControl.disabled = !evidenceSystemStatusAllowed();
    }
    const workspace = referenceAdminWorkspace;
    root.querySelector('[data-reference-admin-write-state]').textContent = workspace?.writesEnabled
      ? 'Controlled writes enabled'
      : 'Read-only / kill switch active';
    const results = root.querySelector('[data-reference-admin-results]');
    const readOnly = ['PEOPLE_MEMBERSHIPS', 'SYNC_HEALTH'].includes(referenceAdminDomain);
    root.querySelectorAll('[data-reference-admin-control-domain]').forEach((control) => {
      const active =
        adminControlSurface === 'reference' &&
        control.dataset.referenceAdminControlDomain === referenceAdminDomain;
      control.classList.toggle('active', active);
      control.setAttribute('aria-pressed', String(active));
    });
    root.querySelectorAll('[data-admin-control-surface]').forEach((control) => {
      const active = control.dataset.adminControlSurface === adminControlSurface;
      control.classList.toggle('active', active);
      control.setAttribute('aria-pressed', String(active));
    });
    if (advertisementAdminOpen) {
      renderAdvertisementDirectory();
      return;
    }
    if (accessMode) {
      renderAccessDirectory();
      return;
    }
    if (customSurface) {
      renderAdminControlSurface();
      return;
    }
    root.querySelector('[data-reference-admin-add]').hidden = readOnly || !workspace?.writesEnabled;
    results.innerHTML =
      (workspace?.items ?? [])
        .map(
          (record) =>
            `<div class="request-line"><div><strong>${esc(record.payload?.displayName ?? record.payload?.roleId ?? record.payload?.instructions ?? record.id)}</strong><small>${esc(record.id)} &middot; revision ${esc(record.revision)} &middot; ${esc(record.status)}</small></div><div class="request-line-actions">${readOnly ? '<span class="pill">Read only</span>' : `<button class="secondary mini" type="button" data-reference-admin-edit="${esc(record.id)}">View / edit</button><button class="${record.status === 'ARCHIVED' ? 'secondary' : 'danger'} mini" type="button" data-reference-admin-lifecycle="${esc(record.id)}" data-reference-admin-action="${record.status === 'ARCHIVED' ? 'RESTORE' : 'ARCHIVE'}">${record.status === 'ARCHIVED' ? 'Restore' : 'Archive'}</button>`}</div></div>`,
        )
        .join('') || '<div class="empty">No records match the current controlled filters.</div>';
    const pending = root.querySelector('[data-reference-admin-pending]');
    pending.innerHTML =
      (workspace?.pendingChanges ?? [])
        .map((change) => {
          const applying = change.reviewStatus === 'APPLYING';
          const canReview =
            !applying && workspace?.writesEnabled && change.requestedBy !== workspace?.actor?.id;
          const action = applying
            ? '<span class="pill">Reconciliation required</span>'
            : canReview
              ? `<div class="request-line-actions"><button class="secondary mini" type="button" data-reference-admin-review="${esc(change.changeId)}" data-reference-admin-decision="REJECT">Reject</button><button class="primary mini" type="button" data-reference-admin-review="${esc(change.changeId)}" data-reference-admin-decision="APPROVE">Review and approve</button></div>`
              : '<span class="pill">Different administrator required</span>';
          return `<div class="request-line"><div><strong>${esc(change.action)} ${esc(change.targetId)}</strong><small>${esc(change.risk)} &middot; requested by ${esc(change.requestedBy)} &middot; ${esc(change.requestedAt ?? '')}</small></div>${action}</div>`;
        })
        .join('') || '<div class="empty">No pending second-review changes in this domain.</div>';
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
        document
          .querySelectorAll('.view')
          .forEach((view) => view.classList.toggle('active', view.id === 'referenceAdmin'));
        document
          .querySelectorAll('#primaryNav button')
          .forEach((button) => button.classList.toggle('active', button === navigation));
        const title = document.querySelector('#pageTitle');
        if (title) title.textContent = 'Reference Administration';
        document.querySelector('#referenceAdmin')?.scrollIntoView({ block: 'start' });
        void refreshReferenceAdminWorkspace({ force: true });
      });
    }
    root.querySelector('[name="referenceAdminDomain"]').value = referenceAdminDomain;
    root.querySelector('[name="referenceAdminDomain"]').addEventListener('change', (event) => {
      advertisementAdminOpen = false;
      adminControlSurface = 'reference';
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
        advertisementAdminOpen = false;
        adminControlSurface = 'reference';
        referenceAdminDomain = control.dataset.referenceAdminControlDomain;
        root.querySelector('[name="referenceAdminDomain"]').value = referenceAdminDomain;
        referenceAdminWorkspace = null;
        void refreshReferenceAdminWorkspace({ force: true });
      });
    });
    root.querySelectorAll('[data-admin-control-surface]').forEach((control) => {
      control.addEventListener('click', () => {
        if (control.dataset.adminControlSurface === 'system-status' && !evidenceSystemStatusAllowed()) return;
        if (control.dataset.adminControlSurface === 'identity-roster' && !identityRosterAllowed()) return;
        advertisementAdminOpen = false;
        adminControlSurface = control.dataset.adminControlSurface;
        renderReferenceAdminWorkspace();
        if (adminControlSurface === 'system-status') void refreshEvidenceSystemStatus({ force: true });
        if (adminControlSurface === 'identity-roster') void refreshIdentityRoster({ force: true });
        if (adminControlSurface === 'brand-assets') void refreshBrandAssets({ force: true });
      });
    });
    root.querySelector('[data-brand-assets-refresh]').addEventListener('click', () => {
      brandAssetDirectory = null;
      void refreshBrandAssets({ force: true });
    });
    root.querySelector('[data-admin-brand-slots]').addEventListener('click', (event) => {
      const upload = event.target.closest('[data-brand-upload]');
      if (upload && brandAssetManagementAllowed()) return openBrandAssetUpload(upload.dataset.brandUpload);
      const publish = event.target.closest('[data-brand-publish]');
      if (publish && brandAssetManagementAllowed())
        return void changePublishedBrandAsset(
          publish.dataset.brandSlotId,
          publish.dataset.brandPublish,
          false,
        );
      const rollback = event.target.closest('[data-brand-rollback]');
      if (rollback && brandAssetManagementAllowed())
        return void changePublishedBrandAsset(
          rollback.dataset.brandSlotId,
          rollback.dataset.brandRollback,
          true,
        );
    });
    root.querySelector('[data-system-status-refresh]').addEventListener('click', () => {
      evidenceSystemStatus = null;
      void refreshEvidenceSystemStatus({ force: true });
    });
    root.querySelector('[data-roster-refresh]').addEventListener('click', () => {
      identityRosterStatus = null;
      identityRosterDirectory = null;
      void refreshIdentityRoster({ force: true });
    });
    root.querySelector('[data-roster-preview]').addEventListener('click', () => previewIdentityRoster());
    root.querySelector('[name="identityRosterSearch"]').addEventListener('input', () => {
      clearTimeout(identityRosterSearchTimer);
      identityRosterSearchTimer = setTimeout(() => {
        identityRosterPage = 1;
        identityRosterDirectory = null;
        void refreshIdentityRoster({ force: true });
      }, 180);
    });
    ['identityRosterActive', 'identityRosterVerification'].forEach((name) => {
      root.querySelector(`[name="${name}"]`).addEventListener('change', () => {
        identityRosterPage = 1;
        identityRosterDirectory = null;
        void refreshIdentityRoster({ force: true });
      });
    });
    root.querySelector('[data-roster-pagination]').addEventListener('click', (event) => {
      const control = event.target.closest('[data-roster-page]');
      if (!control) return;
      identityRosterPage += control.dataset.rosterPage === 'next' ? 1 : -1;
      identityRosterPage = Math.max(1, identityRosterPage);
      identityRosterDirectory = null;
      void refreshIdentityRoster({ force: true });
    });
    root.querySelector('[data-roster-history]').addEventListener('click', (event) => {
      const control = event.target.closest('[data-roster-rollback]');
      if (control)
        openIdentityRosterRollback(control.dataset.rosterRollback, control.dataset.rosterFingerprint);
    });
    root.querySelector('[data-advertisement-admin-control]').addEventListener('click', () => {
      if (!advertisementManagementAllowed()) return;
      adminControlSurface = 'reference';
      advertisementAdminOpen = true;
      renderReferenceAdminWorkspace();
      void refreshAdvertisementDirectory({ force: true });
    });
    root
      .querySelector('[data-advertisement-create]')
      .addEventListener('click', () => openAdvertisementForm());
    root
      .querySelector('[data-advertisement-refresh]')
      .addEventListener('click', () => refreshAdvertisementDirectory({ force: true }));
    root.querySelector('[name="advertisementStatus"]').addEventListener('change', () => {
      advertisementPage = 1;
      advertisementDirectory = null;
      void refreshAdvertisementDirectory({ force: true });
    });
    root.querySelector('[name="advertisementSearch"]').addEventListener('input', () => {
      clearTimeout(advertisementSearchTimer);
      advertisementSearchTimer = setTimeout(() => {
        advertisementPage = 1;
        advertisementDirectory = null;
        void refreshAdvertisementDirectory({ force: true });
      }, 180);
    });
    root.querySelector('[data-advertisement-pagination]').addEventListener('click', (event) => {
      const button = event.target.closest('[data-advertisement-page]');
      if (!button) return;
      advertisementPage += button.dataset.advertisementPage === 'previous' ? -1 : 1;
      advertisementPage = Math.max(1, advertisementPage);
      advertisementDirectory = null;
      void refreshAdvertisementDirectory({ force: true });
    });
    root.querySelector('[data-advertisement-results]').addEventListener('click', (event) => {
      const edit = event.target.closest('[data-advertisement-edit]');
      if (edit) {
        openAdvertisementForm(
          advertisementDirectory?.items.find((item) => item.id === edit.dataset.advertisementEdit),
        );
      }
      const archive = event.target.closest('[data-advertisement-archive]');
      if (archive) {
        const id = archive.dataset.advertisementArchive;
        openModal(
          `Archive ${id}`,
          '<p>This removes the advertisement from public rotation while preserving its audit history.</p><button class="danger" type="button" data-confirm-advertisement-archive>Archive advertisement</button>',
          (modal) => {
            modal
              .querySelector('[data-confirm-advertisement-archive]')
              .addEventListener('click', async (confirmEvent) => {
                confirmEvent.currentTarget.disabled = true;
                try {
                  await services.archiveAdvertisement({ id });
                  closeModal();
                  advertisementDirectory = null;
                  await refreshAdvertisementDirectory({ force: true });
                  toast('Advertisement archived and audited.');
                } catch (error) {
                  toast(error.message, true);
                  confirmEvent.currentTarget.disabled = false;
                }
              });
          },
        );
      }
    });
    root
      .querySelector('[data-reference-admin-refresh]')
      .addEventListener('click', () => void refreshReferenceAdminWorkspace({ force: true }));
    root
      .querySelector('[data-reference-admin-add]')
      .addEventListener('click', () => openReferenceAdminChange(null, 'ADD'));
    root.querySelector('[data-access-create]').addEventListener('click', openAccessAccountCreate);
    root.querySelector('[data-access-seed-departments]').addEventListener('click', openDepartmentAccountSeed);
    ['accessRole', 'accessStatus', 'accessCommittee', 'accessSort'].forEach((name) => {
      root.querySelector(`[name="${name}"]`).addEventListener('change', () => {
        accessDirectoryPage = 1;
        accessDirectory = null;
        void refreshAccessDirectory({ force: true });
      });
    });
    root.querySelector('[name="accessSearch"]').addEventListener('input', () => {
      clearTimeout(accessSearchTimer);
      accessSearchTimer = setTimeout(() => {
        accessDirectoryPage = 1;
        accessDirectory = null;
        void refreshAccessDirectory({ force: true });
      }, 180);
    });
    root.querySelector('[data-access-pagination]').addEventListener('click', (event) => {
      const button = event.target.closest('[data-access-page]');
      if (!button) return;
      accessDirectoryPage += button.dataset.accessPage === 'previous' ? -1 : 1;
      accessDirectoryPage = Math.max(1, accessDirectoryPage);
      accessDirectory = null;
      void refreshAccessDirectory({ force: true });
    });
    root.querySelector('[data-access-results]').addEventListener('click', (event) => {
      const button = event.target.closest('[data-access-action]');
      if (!button) return;
      const account = accessAccount(button.dataset.accessId);
      if (!account) return;
      if (button.dataset.accessAction === 'policy') void openAccessPolicyEditor(account);
      else if (button.dataset.accessAction === 'history') void openAccessHistory(account);
      else if (button.dataset.accessAction === 'rename') openAccessIdChange(account);
      else if (button.dataset.accessAction === 'reset') openAccessPasswordReset(account);
      else openAccessReasonAction(account, button.dataset.accessAction);
    });
    root.addEventListener('click', (event) => {
      const destination = event.target.closest('[data-admin-destination]')?.dataset.adminDestination;
      if (destination) {
        openAdminDestination(destination);
        return;
      }
      const edit = event.target.closest('[data-reference-admin-edit]');
      if (edit)
        openReferenceAdminChange(
          referenceAdminWorkspace?.items.find((record) => record.id === edit.dataset.referenceAdminEdit),
        );
      const lifecycle = event.target.closest('[data-reference-admin-lifecycle]');
      if (lifecycle)
        openReferenceAdminChange(
          referenceAdminWorkspace?.items.find(
            (record) => record.id === lifecycle.dataset.referenceAdminLifecycle,
          ),
          lifecycle.dataset.referenceAdminAction,
        );
      const review = event.target.closest('[data-reference-admin-review]');
      if (review) {
        const change = referenceAdminWorkspace?.pendingChanges.find(
          (entry) => entry.changeId === review.dataset.referenceAdminReview,
        );
        if (change) openReferenceAdminReview(change, review.dataset.referenceAdminDecision);
      }
    });
  };

  const renderLendingUsage = () => {
    const root = document.querySelector('[data-lending-usage]');
    if (!root || root.hidden || !lendingUsageReport) return;
    const activity = lendingUsageReport.activity ?? [];
    const sum = (field) => activity.reduce((total, row) => total + Number(row[field] ?? 0), 0);
    root.querySelector('[data-lending-usage-metrics]').innerHTML = [
      ['Requests', sum('request_count'), 'Distinct Lending Hub requests'],
      ['Consumables', sum('consumable_quantity'), 'Issued or requested quantity'],
      ['Reusable outstanding', sum('reusable_outstanding'), 'Currently on loan'],
      ['Reusable overdue', sum('reusable_overdue'), 'Past the approved due date'],
    ]
      .map(
        ([label, value, detail]) =>
          `<article class="card metric"><span>${esc(label)}</span><strong>${esc(value)}</strong><small>${esc(detail)}</small></article>`,
      )
      .join('');
    root.querySelector('[data-lending-usage-results]').innerHTML =
      activity.length > 0
        ? `<table><thead><tr><th>Staff / officer</th><th>Department</th><th>Requests</th><th>Consumables</th><th>Reusable borrowed</th><th>Outstanding</th><th>Overdue</th><th>First / latest</th></tr></thead><tbody>${activity
            .map(
              (row) =>
                `<tr><td>${esc(row.staff_name)}</td><td>${esc(row.department)}</td><td>${esc(row.request_count)}</td><td>${esc(row.consumable_requests)} requests &middot; ${esc(row.consumable_quantity)} quantity</td><td>${esc(row.reusable_borrowed)}</td><td>${esc(row.reusable_outstanding)}</td><td>${esc(row.reusable_overdue)}</td><td>${esc(accessDate(row.first_request_at))}<br>${esc(accessDate(row.latest_request_at))}</td></tr>`,
            )
            .join('')}</tbody></table>`
        : '<div class="empty">No Lending Hub activity matches these filters.</div>';
    root.querySelector('[data-lending-usage-items]').innerHTML = `<h3>Frequent items</h3>${
      (lendingUsageReport.frequentItems ?? [])
        .map(
          (item) =>
            `<div class="request-line"><span><strong>${esc(item.item_name)}</strong><small>${esc(item.item_id)} &middot; ${esc(item.item_type)}</small></span><span>${esc(item.request_count)} requests &middot; ${esc(item.quantity)} quantity</span></div>`,
        )
        .join('') || '<div class="empty">No item activity matches these filters.</div>'
    }`;
  };

  const loadLendingUsage = async () => {
    const root = document.querySelector('[data-lending-usage]');
    if (!root || !lendingUsageAllowed()) return;
    const form = root.querySelector('[data-lending-usage-filters]');
    root.querySelector('[data-lending-usage-results]').innerHTML =
      '<div class="empty">Loading authorized Lending Hub activityâ€¦</div>';
    try {
      lendingUsageReport = await services.getLendingUsage(Object.fromEntries(new FormData(form).entries()));
      const department = form.elements.department.value;
      const itemId = form.elements.itemId.value;
      form.elements.department.innerHTML = `<option value="">All departments</option>${(
        lendingUsageReport.options?.departments ?? []
      )
        .map((value) => option(value, value, department))
        .join('')}`;
      form.elements.itemId.innerHTML = `<option value="">All items</option>${(
        lendingUsageReport.options?.items ?? []
      )
        .map((item) => option(item.id, `${item.name} (${item.id})`, itemId))
        .join('')}`;
      root.querySelector('#lendingUsageStaff').innerHTML = (lendingUsageReport.options?.staff ?? [])
        .map((value) => `<option value="${esc(value)}"></option>`)
        .join('');
      renderLendingUsage();
    } catch (error) {
      root.querySelector('[data-lending-usage-results]').innerHTML =
        `<div class="alert error">${esc(error.message)}</div>`;
    }
  };

  const exportLendingUsage = () => {
    const activity = lendingUsageReport?.activity ?? [];
    const cells = (values) =>
      values
        .map((value) => {
          const text = String(value ?? '');
          return /[",\r\n]/u.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
        })
        .join(',');
    const csv = [
      cells([
        'Staff or officer',
        'Department',
        'Request count',
        'Consumable requests',
        'Consumable quantity',
        'Reusable borrowed',
        'Reusable outstanding',
        'Reusable overdue',
        'First request',
        'Latest request',
      ]),
      ...activity.map((row) =>
        cells([
          row.staff_name,
          row.department,
          row.request_count,
          row.consumable_requests,
          row.consumable_quantity,
          row.reusable_borrowed,
          row.reusable_outstanding,
          row.reusable_overdue,
          row.first_request_at,
          row.latest_request_at,
        ]),
      ),
    ].join('\r\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'hau-usc-lending-usage.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  const installLendingUsage = () => {
    const lendingView = document.querySelector('#lending');
    if (lendingView && !lendingView.querySelector('[data-lending-usage]')) {
      lendingView.insertAdjacentHTML(
        'beforeend',
        `<article class="panel section-gap" data-lending-usage hidden>
          <div class="panel-head"><div><h2>Lending Usage</h2><p>Authorized Lending Hub activity only. Consumable and reusable use remain separated.</p></div><button class="secondary" type="button" data-lending-usage-export>Export CSV</button></div>
          <form class="toolbar lending-usage-toolbar" data-lending-usage-filters>
            <label>From<input name="from" type="date"></label>
            <label>To<input name="to" type="date"></label>
            <label>Department<select name="department"><option value="">All departments</option></select></label>
            <label>Staff or officer<input name="staff" list="lendingUsageStaff" placeholder="Name"></label>
            <datalist id="lendingUsageStaff"></datalist>
            <label>Item<select name="itemId"><option value="">All items</option></select></label>
            <button class="primary" type="submit">Apply filters</button>
          </form>
          <div class="grid-4 section-gap" data-lending-usage-metrics></div>
          <div class="table-wrap section-gap" data-lending-usage-results><div class="empty">Open Lending Usage to load authorized activity.</div></div>
          <div class="section-gap" data-lending-usage-items></div>
        </article>`,
      );
    }
    const root = lendingView?.querySelector('[data-lending-usage]');
    if (!root) return;
    const allowed = lendingUsageAllowed();
    root.hidden = !allowed;
    if (!allowed || root.dataset.bound === 'true') return;
    root.dataset.bound = 'true';
    root.querySelector('[data-lending-usage-filters]').addEventListener('submit', (event) => {
      event.preventDefault();
      void loadLendingUsage();
    });
    root.querySelector('[data-lending-usage-export]').addEventListener('click', exportLendingUsage);
    void loadLendingUsage();
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
    if (
      role === 'DIRECTOR' ||
      user.authorization?.scopeMode === 'ALL' ||
      (backendMode === 'mock' && ['ADMIN', 'ADMINISTRATOR'].includes(role))
    )
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
      renderRoleExperience();
    })();
    try {
      await foodQueuePromise;
    } catch (error) {
      foodQueueItems = [];
      renderFoodQueue(error.message);
      renderRoleExperience();
    } finally {
      foodQueuePromise = null;
    }
  };

  const renderFoodQueue = (errorMessage = '') => {
    if (!foodQueue) return;
    const items = foodQueueItems ?? [];
    foodQueue.innerHTML = `<div class="panel-head"><div><p class="eyebrow">Food Committee</p><h3 id="foodCommitteeQueueTitle">Food Work Queue</h3><p>Deadline-first, event-grouped Food children only; sibling payloads and person-level dietary data are not projected here.</p></div><span class="pill">${items.length} item${items.length === 1 ? '' : 's'}</span></div>${errorMessage ? `<div class="alert error">${esc(errorMessage)}</div>` : ''}<div class="food-work-queue">${foodQueueGroupsMarkup(items)}</div>`;
  };

  const openFoodWorkflow = (componentId) => {
    if (!canAccessFoodQueue()) return;
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
    if (
      role === 'DIRECTOR' ||
      user.authorization?.scopeMode === 'ALL' ||
      (backendMode === 'mock' && ['ADMIN', 'ADMINISTRATOR'].includes(role))
    )
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
            (evidence.relatedEntityType ?? evidence.metadata?.relatedEntityType) === 'COMPOSITE_COMPONENT' &&
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
    if (!canAccessMaterialsQueue() || typeof services.getMaterialsWorkQueue !== 'function') return;
    if (materialsQueuePromise) {
      if (!force) return materialsQueuePromise;
      await materialsQueuePromise.catch(() => undefined);
    }
    if (!force && materialsQueueItems !== null) return;
    materialsQueuePromise = (async () => {
      const operationalScope =
        new URL(location.href).searchParams.get('scope') ?? getState()?.operationalContext?.selected?.value;
      const result = await services.getMaterialsWorkQueue(operationalScope ? { operationalScope } : {});
      materialsQueueItems = Array.isArray(result?.items) ? result.items : [];
      renderMaterialsQueue();
      renderRoleExperience();
    })();
    try {
      await materialsQueuePromise;
    } catch (error) {
      materialsQueueItems = [];
      renderMaterialsQueue(error.message);
      renderRoleExperience();
    } finally {
      materialsQueuePromise = null;
    }
  };

  const renderMaterialsQueue = (error = '') => {
    if (!materialsQueue) return;
    const items = materialsQueueItems ?? [];
    materialsQueue.tabIndex = -1;
    if (backendMode === 'rest') {
      materialsQueue.innerHTML = `<div class="panel-head"><div><p class="eyebrow">Materials Committee · canonical D1 projection</p><h3 id="materialsCommitteeQueueTitle">Scoped Materials Queue</h3><p>Exact specifications, stable event/request/deliverable identities, quote evidence, budget, cumulative receiving, and release quantities remain connected.</p></div><span class="pill">${items.length} item${items.length === 1 ? '' : 's'}</span></div>${error ? `<div class="alert">${esc(error)}</div>` : ''}${materialsQueueGroupsMarkup(items, { allowOpen: materialsDestinationAllowed('materials-deliverables') })}`;
      return;
    }
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
                  values.fulfillmentPath === 'STOCK_ISSUE' ? 'MATERIALS_ISSUE_PROOF' : 'DELIVERABLE_RECEIPT',
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
        if (!materialsRequestsEnabled) throw new Error('Materials request specialization is not enabled.');
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
        const deliverable = event.target.closest('[data-materials-open-deliverable]');
        if (deliverable) {
          const item = (materialsQueueItems ?? []).find(
            (entry) =>
              (entry.deliverableId || entry.componentId) === deliverable.dataset.materialsOpenDeliverable,
          );
          const status = String(item?.status ?? '').toUpperCase();
          if (status === 'FOR_CANVASSING') openMaterialsDestination('materials-canvassing');
          else if (['PROCURED', 'PARTIALLY_RECEIVED', 'RECEIVING'].includes(status))
            openMaterialsDestination('materials-receiving');
          else if (['READY_TO_RELEASE', 'PARTIALLY_RELEASED'].includes(status))
            openMaterialsDestination('materials-release');
          else openMaterialsDestination('materials-deliverables');
        }
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
      String(record.status ?? '')
        .trim()
        .toUpperCase() === 'ACTIVE' &&
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
          route.matchKind === 'OTHER' && !route.archivedAt && venueEquipmentEffectiveAt(route, effectiveAt),
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
      .filter((child) => child.componentType === 'VENUE_EQUIPMENT' && child.ownerCommitteeId === committeeId)
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
      const venueEquipment = updateVenueEquipmentWorkflow(child.payload?.venueEquipment, command.patch ?? {});
      if (venueEquipment.fulfillmentEvidenceId) {
        const evidenceUploaded = (getState()?.evidenceFiles ?? []).some((evidence) => {
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
            (evidence.relatedEntityType ?? evidence.metadata?.relatedEntityType) === 'COMPOSITE_COMPONENT' &&
            (evidence.relatedEntityId ?? evidence.relatedId ?? evidence.metadata?.relatedEntityId) ===
              child.componentId
          );
        });
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
      scheduleEndAt: toManilaIso(form.elements.venueEquipmentScheduleEndAt?.value) || event?.endAt || '',
    };
  };

  const refreshVenueEquipmentQueue = async ({ force = false } = {}) => {
    const committeeIds = venueEquipmentCommitteeIds();
    if (
      !venueEquipmentQueue ||
      !committeeIds.length ||
      typeof services.getVenueEquipmentWorkQueue !== 'function'
    )
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
    venueEquipmentQueue.innerHTML = `<div class="panel-head"><div><p class="eyebrow">Effective-dated routing</p><h3 id="venueEquipmentQueueTitle">Scoped Venue &amp; Equipment work queue</h3><p>Requestability permits review; it never promises a booking, stock, or approval.</p></div><span class="pill">${items.length} item${items.length === 1 ? '' : 's'}</span></div>${error ? `<div class="alert">${esc(error)}</div>` : ''}<div class="line-list">${
      items
        .map(
          (item) =>
            `<div class="request-line"><div><strong>${esc(item.componentId)}</strong><small>${esc(item.ownerCommitteeId)} &middot; ${esc(item.venueEquipment?.confirmationStatus || 'PENDING_CONFIRMATION')} &middot; ${esc(item.lines?.length || 0)} line(s)</small></div><div class="request-line-actions"><span class="pill">${esc(item.status || 'FOR_REVIEW')}</span>${['COMPLETED', 'REJECTED', 'CANCELLED'].includes(item.status) ? '' : `<button class="secondary mini" type="button" data-venue-equipment-manage="${esc(item.componentId)}">Manage</button>`}</div></div>`,
        )
        .join('') ||
      '<div class="empty">No Venue &amp; Equipment work is in the current authorized scope.</div>'
    }</div>`;
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
                otherTriageStatus:
                  details.otherTriageStatus === 'NOT_REQUIRED' ? 'NOT_REQUIRED' : values.otherTriageStatus,
                otherTriageReason:
                  details.otherTriageStatus === 'NOT_REQUIRED' ? '' : values.otherTriageReason,
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
    const suffix =
      timestamp && !Number.isNaN(timestamp.getTime())
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

  const workspaceDefinitions = Object.freeze({
    administrator: { initial: 'A', label: 'Administrator', purpose: 'Control Center', path: '/app/admin' },
    director: { initial: 'D', label: 'Director', purpose: 'Department oversight', path: '/app/director' },
    food: { initial: 'F', label: 'Food Committee', purpose: 'Food operations', path: '/app/food' },
    'inventory-pantry': {
      initial: 'I',
      label: 'Inventory & Pantry',
      purpose: 'Stock and lending',
      path: '/app/inventory',
    },
    materials: {
      initial: 'M',
      label: 'Materials & Documentation',
      purpose: 'Procurement and evidence',
      path: '/app/materials',
    },
  });
  const releaseWorkspaceScopes = Object.freeze({
    administrator: 'ALL:AUTHORIZED',
    director: 'ALL:AUTHORIZED',
    food: 'COMMITTEE:COM_FOOD',
    'inventory-pantry': 'COMMITTEE:COM_INVENTORY_PANTRY',
    materials: 'COMMITTEE:COM_MATERIALS',
  });

  const isAdministrator = () =>
    ['ADMINISTRATOR', 'SYSTEM_OWNER'].includes(
      String(
        getState()?.currentUser?.authorization?.roleId ?? getState()?.currentUser?.role ?? '',
      ).toUpperCase(),
    );

  const authorizedWorkspaceIds = () => {
    const authorization = getState()?.currentUser?.authorization ?? {};
    const projected = Array.isArray(authorization.workspaceIds)
      ? authorization.workspaceIds.filter((id) => workspaceDefinitions[id])
      : [];
    if (projected.length) return projected;
    return isAdministrator() ? Object.keys(workspaceDefinitions) : [];
  };

  const workspaceFromPath = () =>
    Object.entries(workspaceDefinitions).find(
      ([, definition]) =>
        location.pathname === definition.path || location.pathname.startsWith(`${definition.path}/`),
    )?.[0] ?? '';

  const workspaceForCurrentUser = () => {
    const routedWorkspace = workspaceFromPath();
    const allowed = authorizedWorkspaceIds();
    if (allowed.includes(routedWorkspace)) return routedWorkspace;
    const defaultWorkspace = getState()?.currentUser?.authorization?.defaultWorkspaceId;
    if (allowed.includes(defaultWorkspace)) return defaultWorkspace;
    const experience = normalizedExperience();
    if (workspaceDefinitions[experience]) return experience;
    const user = getState()?.currentUser ?? {};
    const roleId = String(user.authorization?.roleId ?? user.role ?? '').toUpperCase();
    if (['ADMINISTRATOR', 'SYSTEM_OWNER'].includes(roleId)) return 'administrator';
    if (roleId === 'DIRECTOR') return 'director';
    const committeeIds = user.authorization?.committeeIds ?? user.scopes?.committee ?? [];
    if (committeeIds.includes('COM_FOOD')) return 'food';
    if (committeeIds.includes('COM_INVENTORY_PANTRY')) return 'inventory-pantry';
    if (committeeIds.includes('COM_MATERIALS')) return 'materials';
    return 'administrator';
  };

  const syncRoutedExperience = () => {
    const workspace = workspaceFromPath();
    if (authorizedWorkspaceIds().includes(workspace)) {
      document.body.dataset.experience = workspace;
    }
  };

  const currentScopeLabel = () => {
    const selected = getState()?.operationalContext?.selected;
    if (selected?.label) return selected.label;
    const authorization = getState()?.currentUser?.authorization ?? {};
    if (authorization.scopeMode === 'ALL') return 'All authorized operations';
    if (authorization.scopeMode === 'SELF') return 'My own records';
    const committees = authorization.committees ?? [];
    if (committees.length) return committees.map((committee) => committee.name).join(', ');
    return 'Server-assigned scope';
  };

  const currentModuleLabel = () => {
    const active = document.querySelector('#primaryNav [data-view].active');
    const copy = active?.querySelector('.nav-copy');
    const label = copy?.childNodes?.[0]?.textContent?.trim();
    return label || document.querySelector('#pageTitle')?.textContent?.trim() || 'Operations Overview';
  };

  const operationalAttentionCount = () => {
    const state = getState() ?? {};
    const statusIn = (row, values) => values.has(String(row?.status ?? '').toUpperCase());
    const requestAttention = (state.requests ?? []).filter((row) =>
      statusIn(row, new Set(['FOR_REVIEW', 'NEEDS_INFORMATION', 'BLOCKED', 'WAITING_FOR_BUDGET'])),
    ).length;
    const lendingAttention = (state.lendingTickets ?? []).filter((row) =>
      statusIn(row, new Set(['FOR_REVIEW', 'OVERDUE', 'DAMAGED', 'LOST'])),
    ).length;
    const inventoryAttention = (state.inventoryItems ?? []).filter(
      (item) =>
        item?.status === 'VERIFY' || Number(item?.openingOnHand ?? 0) <= Number(item?.reorderThreshold ?? 0),
    ).length;
    return requestAttention + lendingAttention + inventoryAttention;
  };

  const adoptAccountControls = () => {
    if (!internalShellBar) return;
    const actions = internalShellBar.querySelector('[data-shell-account-actions]');
    const tools = document.querySelector('.app-header .header-tools');
    const logout = tools?.querySelector('[data-auth-logout]');
    if (logout && actions && !actions.contains(logout)) actions.append(logout);
    tools?.querySelector('.auth-session-label')?.remove();
  };

  const renderInternalShell = () => {
    if (!internalShellBar || isRequestOnly()) return;
    const state = getState() ?? {};
    const user = state.currentUser ?? {};
    const authorization = user.authorization ?? {};
    const workspaceId = workspaceForCurrentUser();
    const workspace = workspaceDefinitions[workspaceId] ?? workspaceDefinitions.administrator;
    const workspaceSelect = internalShellBar.querySelector('#shellWorkspaceSelect');
    const authorizedWorkspaces = authorizedWorkspaceIds();
    workspaceSelect.innerHTML = Object.entries(workspaceDefinitions)
      .map(([id, definition]) => {
        const selected = id === workspaceId ? ' selected' : '';
        const unavailable = !authorizedWorkspaces.includes(id);
        const stateLabel =
          id === workspaceId ? 'current workspace' : unavailable ? 'unavailable' : 'view and operate';
        return `<option value="${esc(id)}"${selected}${unavailable ? ' disabled' : ''}>${esc(definition.initial)} · ${esc(definition.label)} — ${esc(definition.purpose)} — ${esc(stateLabel)}</option>`;
      })
      .join('');
    internalShellBar.querySelector('#shellWorkspaceHelp').textContent =
      authorizedWorkspaces.length > 1
        ? `Switches the active workspace while preserving your authenticated ${authorization.roleLabel || 'Administrator'} identity.`
        : 'Workspace access is assigned by the server.';
    document.body.dataset.workspace = workspaceId;
    const scopeLabel = currentScopeLabel();
    const scopeSelect = internalShellBar.querySelector('#shellScopeSelect');
    const operationalContext = state.operationalContext;
    scopeSelect.innerHTML = operationalContext?.options?.length
      ? operationalContext.options
          .map(
            (entry) =>
              `<option value="${esc(entry.value)}"${entry.value === operationalContext.selected?.value ? ' selected' : ''}${entry.available ? '' : ' disabled'}>${esc(entry.label)}${entry.purpose ? ` — ${esc(entry.purpose)}` : ''}</option>`,
          )
          .join('')
      : `<option value="current">${esc(scopeLabel)}</option>`;
    internalShellBar.querySelector('[data-shell-workspace-crumb]').textContent = workspace.label;
    internalShellBar.querySelector('[data-shell-module-crumb]').textContent = currentModuleLabel();
    if (backendMode === 'rest') {
      document.title = `${workspace.label} · ${currentModuleLabel()} | HAU-USC Logistics`;
    }
    const environment = String(state.environment ?? config.appEnvironment ?? 'UNKNOWN').toUpperCase();
    const version = String(state.appVersion ?? '0.7.0');
    internalShellBar.querySelector('[data-shell-release]').textContent = `${environment} · v${version}`;
    const attention = operationalAttentionCount();
    const attentionButton = internalShellBar.querySelector('[data-shell-attention]');
    attentionButton.querySelector('strong').textContent = String(attention);
    attentionButton.setAttribute(
      'aria-label',
      `${attention} operational item${attention === 1 ? '' : 's'} need attention. Open overview.`,
    );
    const displayName = user.displayName || 'Authenticated staff';
    const roleLabel = authorization.roleLabel || authorization.roleId || user.role || 'Authorized';
    internalShellBar.querySelectorAll('[data-shell-account-name]').forEach((element) => {
      element.textContent = displayName;
    });
    internalShellBar.querySelector('[data-shell-account-role]').textContent = roleLabel;
    internalShellBar.querySelector('[data-shell-account-viewing]').textContent =
      `Viewing: ${workspace.label}`;
    internalShellBar.querySelector('[data-shell-account-scope]').textContent = scopeLabel;
    internalShellBar.querySelector('[data-shell-account-initial]').textContent =
      displayName.trim().charAt(0).toUpperCase() || 'A';
    adoptAccountControls();
  };

  const applyProductionShellCopy = () => {
    if (backendMode !== 'rest' || isRequestOnly()) return;
    const user = getState()?.currentUser ?? {};
    const replacements = new Map([
      ['compositeRequesterName', user.displayName || ''],
      [
        'compositeDepartment',
        user.committee || user.authorization?.roleLabel || user.authorization?.roleId || '',
      ],
      ['compositePurpose', ''],
    ]);
    replacements.forEach((value, name) => {
      const input = document.querySelector(`[name="${name}"]`);
      if (!input || !/preview/iu.test(input.value)) return;
      input.value = value;
      input.defaultValue = value;
    });
    const freshness = document.querySelector('#dashboardFreshness');
    if (freshness?.textContent.includes('local preview calculation')) {
      freshness.textContent = freshness.textContent.replace(
        'local preview calculation',
        'server-authorized operational data',
      );
    }
    document.querySelectorAll('#overviewMetrics small').forEach((summary) => {
      if (summary.textContent.trim() === 'Mock Drive metadata retained') {
        summary.textContent = 'Evidence metadata available to authorized staff';
      }
    });
    const upcomingEmptyState = document.querySelector('#upcomingEvents .empty');
    if (upcomingEmptyState?.textContent.trim() === 'No upcoming events in demo data.') {
      upcomingEmptyState.textContent = 'No approved upcoming events are available.';
    }
    document.querySelectorAll('.preview-badge').forEach((badge) => badge.remove());
  };

  const installInternalShell = () => {
    if (isRequestOnly() || internalShellBar || document.querySelector('[data-internal-shell-context]'))
      return;
    const header = document.querySelector('.app-header');
    if (!header) return;
    internalShellBar = document.createElement('section');
    internalShellBar.className = 'internal-shell-context';
    internalShellBar.dataset.internalShellContext = '';
    internalShellBar.setAttribute('aria-label', 'Current logistics workspace context');
    internalShellBar.innerHTML = `
      <div class="internal-shell-context-primary">
        <nav class="shell-breadcrumbs" aria-label="Breadcrumb">
          <span data-shell-workspace-crumb></span><span aria-hidden="true">/</span>
          <strong data-shell-module-crumb aria-current="page"></strong>
        </nav>
        <div class="shell-context-controls">
          <label for="shellWorkspaceSelect">Workspace
            <select id="shellWorkspaceSelect" aria-describedby="shellWorkspaceHelp"></select>
          </label>
          <small id="shellWorkspaceHelp">Workspace access is assigned by the server.</small>
          <label for="shellScopeSelect">Operational scope
            <select id="shellScopeSelect" aria-describedby="shellScopeHelp"></select>
          </label>
          <small id="shellScopeHelp">Scope is enforced by server authorization.</small>
          <span class="sr-only" data-shell-context-announcement aria-live="polite"></span>
        </div>
      </div>
      <div class="internal-shell-context-meta">
        <span class="shell-release-indicator" data-shell-release role="status"></span>
        <button class="shell-attention" type="button" data-shell-attention data-go="overview">
          <span>Attention</span><strong>0</strong>
        </button>
        <details class="shell-account">
          <summary><span class="shell-account-initial" data-shell-account-initial aria-hidden="true">A</span><span data-shell-account-name>Authenticated staff</span></summary>
          <div class="shell-account-menu">
            <strong data-shell-account-name>Authenticated staff</strong>
            <span data-shell-account-role>Authorized</span>
            <small data-shell-account-viewing>Viewing: Assigned workspace</small>
            <small data-shell-account-scope>Server-assigned scope</small>
            <div data-shell-account-actions></div>
          </div>
        </details>
      </div>`;
    header.before(internalShellBar);
    internalShellBar.querySelector('#shellWorkspaceSelect').addEventListener('change', async (event) => {
      if (authorizedWorkspaceIds().includes(event.target.value) && workspaceDefinitions[event.target.value]) {
        const releaseRoute = location.pathname.split('/')[3] === 'release';
        const target = new URL(
          `${workspaceDefinitions[event.target.value].path}${releaseRoute ? '/release' : ''}`,
          location.origin,
        );
        target.search = location.search;
        if (releaseRoute) target.searchParams.set('scope', releaseWorkspaceScopes[event.target.value]);
        history.pushState(history.state, '', `${target.pathname}${target.search}`);
        syncRoutedExperience();
        renderRoleExperience();
        renderInternalShell();
        if (releaseRoute && changeOperationalScope) {
          try {
            await changeOperationalScope(releaseWorkspaceScopes[event.target.value]);
          } catch (error) {
            toast(error?.message || 'The Release Desk context could not be changed.', true);
          }
        }
        return;
      }
      event.target.value = workspaceForCurrentUser();
    });
    internalShellBar.querySelector('#shellScopeSelect').addEventListener('change', async (event) => {
      const select = event.target;
      const previous = getState()?.operationalContext?.selected?.value ?? 'current';
      if (!changeOperationalScope) {
        select.value = previous;
        return;
      }
      if (hasUnsavedRuntimeState()) {
        select.value = previous;
        toast('Finish or clear the current draft before changing operational scope.', true);
        return;
      }
      select.disabled = true;
      try {
        foodQueueItems = null;
        materialsQueueItems = null;
        venueEquipmentQueueItems = null;
        await changeOperationalScope(select.value);
        await Promise.all([
          refreshFoodQueue({ force: true }),
          refreshMaterialsQueue({ force: true }),
          refreshVenueEquipmentQueue({ force: true }),
        ]);
        const label = getState()?.operationalContext?.selected?.label ?? currentScopeLabel();
        internalShellBar.querySelector('[data-shell-context-announcement]').textContent =
          `Operational scope changed to ${label}.`;
        renderInternalShell();
      } catch (error) {
        select.value = previous;
        toast(error.message, true);
      } finally {
        select.disabled = false;
        select.focus({ preventScroll: true });
      }
    });
    document.addEventListener('click', (event) => {
      if (
        event.target.closest(
          '#primaryNav [data-view], [data-go], [data-shared-mobile-view], [data-shared-more-view]',
        )
      ) {
        queueMicrotask(() => renderInternalShell());
      }
    });
    const tools = document.querySelector('.app-header .header-tools');
    if (tools && !accountControlObserver) {
      accountControlObserver = new MutationObserver(() => adoptAccountControls());
      accountControlObserver.observe(tools, { childList: true });
    }
    addEventListener('popstate', () => {
      syncRoutedExperience();
      renderRoleExperience();
      renderInternalShell();
    });
    renderInternalShell();
    applyProductionShellCopy();
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
      .map(([view, label, icon]) =>
        view === 'more'
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
    const routedWorkspace = workspaceFromPath();
    if (isAdministrator() && workspaceDefinitions[routedWorkspace]) return routedWorkspace;
    const value = String(document.body.dataset.experience ?? '')
      .trim()
      .toLowerCase();
    return (
      {
        admin: 'administrator',
        inventory: 'inventory-pantry',
      }[value] ?? value
    );
  };

  const roleExperienceDefinitions = {
    administrator: {
      label: 'Administrator workspace',
      heading: 'Administrator Control Center',
      description:
        'Start with system exceptions, access changes, evidence failures, reference errors, inventory discrepancies, and blocked request, lending, or release work. Every signal opens the existing server-authorized owner workflow.',
      boundaryTitle: 'Administrator control boundary',
      boundary:
        'Reference changes, account access, and environment controls remain subject to their existing server authorization, separation-of-duties, and audit requirements.',
      actions: [
        [
          'overview',
          'All Request Queues',
          'Server-scoped new, review, blocked, and committee queues',
          'all-request-queues',
        ],
        ['lending', 'Internal Lending Hub', 'Review, handoff, active loan, overdue, and return workflows'],
        ['release', 'Release Desk', 'Distinct recipient-confirmed physical handoff workspace'],
        ['restocking', 'Restocking', 'Replenishment review, procurement, and cumulative receiving'],
        [
          'procurement',
          'Procurement & Deliverables',
          'Canvassing, budget, purchasing, and deliverable status',
        ],
        ['inventory', 'Inventory Management', 'Catalog, balances, reservations, ATP, and movement history'],
        [
          'procurement',
          'Receiving',
          'Validated receiving and automatic event-item registration',
          'receiving',
        ],
        [
          'referenceAdmin',
          'Evidence status',
          'Cross-workspace evidence exceptions and missing records',
          'evidence-status',
        ],
        [
          'overview',
          'Event Management',
          'Create and maintain governed main events, event days, activities, links, and history',
          'event-management',
        ],
      ],
    },
    director: {
      label: 'Director workspace',
      heading: 'Executive Overview',
      description:
        'Lead from decisions, blockers, deadlines, committee readiness, event progress, and exceptions. Progressive detail stays connected to the existing server-authorized owner workflow.',
      boundaryTitle: 'Bounded Management & Access',
      boundary:
        'Director visibility supports event structure and leadership decisions. Access, configuration, and environment changes remain in the existing server-authorized administration boundary.',
      actions: [
        [
          'overview',
          'Decision Queue',
          'Requests and deliverables awaiting a leadership decision',
          'decision-queue',
        ],
        [
          'overview',
          'Event Planning',
          'Upcoming approved events, deadlines, and ownership',
          'event-planning',
        ],
        [
          'overview',
          'Event Series & Sub-events',
          'Approved hierarchy and active event progress',
          'event-series',
        ],
        [
          'overview',
          'Manage Events',
          'Complete dates, venues, committees, deadlines, readiness, links, and audited corrections',
          'event-management',
        ],
        [
          'overview',
          'Committee Readiness',
          'Cross-committee blockers and readiness signals',
          'committee-readiness',
        ],
        [
          'overview',
          'Request Progress',
          'New, review, blocked, and routed request progress',
          'request-progress',
        ],
        ['procurement', 'Procurement Progress', 'Canvassing, budget, purchasing, and receiving'],
        ['release', 'Release Readiness', 'Controlled handoffs and recipient confirmation'],
        ['lending', 'Lending Status', 'Review, overdue, handoff, and return context', 'lending-status'],
        [
          'inventory',
          'Inventory Alerts',
          'Low stock, verification, reservations, and movement history',
          'inventory-alerts',
        ],
        [
          'overview',
          'Management & Access',
          'Server-projected role, scope, and bounded capabilities',
          'management-access',
        ],
      ],
    },
    food: {
      label: 'Food Committee workspace',
      heading: 'Food Overview',
      description:
        'Work from governed event deadlines first: validate aggregate quantities and dietary attention, compare current quotes, track budget and ordering, receive deliveries, then complete controlled distribution.',
      boundaryTitle: 'Food capability boundary',
      boundary:
        'Food ownership scopes the queue and context. Procurement, receiving, evidence, and Release Desk actions remain available only through existing capabilities and server-side validation.',
      actions: [
        [
          'request',
          'Food Work Queue',
          'Every scoped food requirement grouped by event and deadline',
          'food-work-queue',
        ],
        [
          'procurement',
          'Suppliers & Quotes',
          'Current canvass evidence and explicitly historical references',
          'food-suppliers-quotes',
        ],
        [
          'procurement',
          'Procurement',
          'Budget, preferred quote, ordering, and delivery stages',
          'food-procurement',
        ],
        [
          'procurement',
          'Receiving',
          'Cumulative physical intake, condition, handling, and evidence',
          'food-receiving',
        ],
        ['release', 'Release Desk', 'Shared recipient-confirmed controlled distribution', 'food-release'],
        [
          'overview',
          'Workflow Reference',
          'Lead-time, privacy, sourcing, handling, and evidence rules',
          'food-workflow-reference',
        ],
      ],
    },
    'inventory-pantry': {
      label: 'Inventory & Pantry workspace',
      heading: 'Inventory Overview',
      description:
        'Start with exceptions, then work through catalog balances, pantry stock, lending, replenishment, controlled release, and append-only movement history without collapsing physical, reserved, and available-to-promise quantities.',
      boundaryTitle: 'Inventory authority boundary',
      boundary:
        'Catalog ownership scopes stock operations. Reservations, receipts, loans, returns, releases, transfers, and corrections remain capability-bound, revalidated against current state, and recorded through the existing ledger-aware workflows.',
      actions: [
        [
          'inventory',
          'Inventory Management',
          'Catalog, on-hand, reserved, ATP, provenance, and item history',
          'inventory-management',
        ],
        [
          'inventory',
          'Pantry',
          'Non-perishable stock inside the same canonical catalog',
          'inventory-pantry-stock',
        ],
        [
          'restocking',
          'Restocking',
          'Review and replenish without conflating request and receipt',
          'inventory-restocking',
        ],
        [
          'lending',
          'Lending Operations',
          'For-review, claim, on-loan, overdue, return, damage, and loss',
          'inventory-lending',
        ],
        [
          'restocking',
          'Receiving',
          'Validated physical intake and immutable purchase receipts',
          'inventory-receiving',
        ],
        [
          'release',
          'Release Desk',
          'Shared partial/full recipient-confirmed controlled handoff',
          'inventory-release',
        ],
        [
          'inventory',
          'Movement History',
          'Append-only item and reusable-asset movements',
          'inventory-movement-history',
        ],
        [
          'inventory',
          'Condition & Stock Alerts',
          'Low, unavailable, verify, damage, and maintenance attention',
          'inventory-alerts',
        ],
      ],
    },
    materials: {
      label: 'Materials & Documentation workspace',
      heading: 'Materials Overview',
      description:
        'Keep event identity, exact specifications, canvass evidence, quote freshness, budget state, procurement, cumulative receiving, deliverables, and controlled release connected through one traceable fulfillment pipeline.',
      boundaryTitle: 'Materials capability boundary',
      boundary:
        'Materials ownership scopes the queue and fulfillment context. Quote preference, budget, procurement, receiving, evidence, stock transfer, and Release Desk actions remain available only through existing capabilities and server-side validation.',
      actions: [
        [
          'request',
          'Materials Queue',
          'Exact requirements grouped by stable event and request identity',
          'materials-queue',
        ],
        [
          'procurement',
          'Canvassing',
          'Comparable current quotes and evidence before preference',
          'materials-canvassing',
        ],
        [
          'procurement',
          'Procurement',
          'Budget clearance, preferred quote, and purchasing stage',
          'materials-procurement',
        ],
        [
          'procurement',
          'Suppliers',
          'Governed supplier references without private financial details',
          'materials-suppliers',
        ],
        [
          'procurement',
          'Price History',
          'Historical checks clearly separated from current evidence',
          'materials-price-history',
        ],
        [
          'procurement',
          'Receiving',
          'Cumulative physical intake, condition, provenance, and evidence',
          'materials-receiving',
        ],
        [
          'procurement',
          'Deliverables',
          'Requested, received, and released quantities in one pipeline',
          'materials-deliverables',
        ],
        ['release', 'Release Desk', 'Shared recipient-confirmed controlled handoff', 'materials-release'],
      ],
    },
  };

  const countStatuses = (rows, statuses) =>
    (rows ?? []).filter((row) => statuses.has(String(row?.status ?? '').toUpperCase())).length;

  const administratorMetrics = (state) => {
    const counts = adminExceptionCounts(state);
    return [
      [
        'Access changes',
        counts.accessChanges,
        'Pending, applying, or failed access governance',
        'access-changes',
      ],
      [
        'Failed evidence',
        counts.failedEvidence,
        'Rejected, corrupt, unavailable, or failed records',
        'failed-evidence',
      ],
      [
        'Reference-data errors',
        counts.referenceErrors,
        'Stale, conflicting, or failed governed references',
        'reference-errors',
      ],
      [
        'Inventory discrepancies',
        counts.inventoryDiscrepancies,
        'Verification and reorder-threshold exceptions',
        'inventory-discrepancies',
      ],
      [
        'Request blockers',
        counts.requestBlockers,
        'Review, information, budget, and blocked requests',
        'request-blockers',
      ],
      [
        'Lending blockers',
        counts.lendingBlockers,
        'Review, overdue, damage, and loss exceptions',
        'lending-blockers',
      ],
      [
        'Release blockers',
        counts.releaseBlockers,
        'Blocked, incomplete, or partial handoff records',
        'release-blockers',
      ],
      [
        'Environment health',
        counts.environmentIssues,
        'Server-reported environment identity and freshness',
        'environment-health',
      ],
      [
        'Cross-workspace attention',
        counts.total,
        'Combined operational exceptions requiring review',
        'cross-workspace-attention',
      ],
    ];
  };

  const directorMetrics = (state) => {
    const activeSeries = (state.eventSeries ?? []).filter(
      (series) =>
        !['COMPLETED', 'ARCHIVED', 'CANCELLED'].includes(String(series?.status ?? '').toUpperCase()),
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
    const now = Date.now();
    const upcomingDeadlines = (state.events ?? []).filter((event) => {
      const start = new Date(event?.startAt ?? 0).getTime();
      return Number.isFinite(start) && start >= now && start <= now + 14 * 86_400_000;
    }).length;
    const lendingExceptions = countStatuses(
      state.lendingTickets,
      new Set(['FOR_REVIEW', 'OVERDUE', 'DAMAGED', 'LOST']),
    );
    const inventoryAlerts = (state.inventoryItems ?? []).filter(
      (item) =>
        String(item?.status ?? '').toUpperCase() === 'VERIFY' ||
        Number(item?.openingOnHand ?? 0) <= Number(item?.reorderThreshold ?? 0),
    ).length;
    const committeeIds = ['COM_FOOD', 'COM_INVENTORY_PANTRY', 'COM_MATERIALS'];
    const blockedCommittees = new Set(
      [...(state.requests ?? []), ...(state.deliverables ?? [])]
        .filter((row) =>
          ['BLOCKED', 'WAITING_FOR_BUDGET', 'NEEDS_INFORMATION'].includes(
            String(row?.status ?? '').toUpperCase(),
          ),
        )
        .map((row) => row?.assignedCommittee ?? row?.ownerCommitteeId ?? row?.committeeId)
        .filter((id) => committeeIds.includes(id)),
    );
    const projectedCommittees = new Set(
      [...(state.requests ?? []), ...(state.deliverables ?? [])]
        .flatMap((row) => [row?.assignedCommittee, row?.ownerCommitteeId, row?.committeeId])
        .filter((id) => committeeIds.includes(id)),
    );
    const committeeReadiness = projectedCommittees.size
      ? `${projectedCommittees.size - blockedCommittees.size}/${projectedCommittees.size}`
      : 'No data';
    return [
      ['Leadership decisions', decisions, 'Review or missing-information items', 'decision-queue'],
      [
        'Cross-workflow blockers',
        blockers,
        'Budget, information, and overdue exceptions',
        'cross-workflow-blockers',
      ],
      [
        'Upcoming deadlines',
        upcomingDeadlines,
        'Approved events starting within fourteen days',
        'event-planning',
      ],
      [
        'Committee readiness',
        committeeReadiness,
        'Committees without a projected blocking exception',
        'committee-readiness',
      ],
      ['Event progress', activeSeries, 'Active event series and sub-event hierarchy', 'event-series'],
      ['Release readiness', readyToRelease, 'Items eligible for controlled handoff', 'release-readiness'],
      [
        'Lending exceptions',
        lendingExceptions,
        'Review, overdue, damage, and loss attention',
        'lending-status',
      ],
      [
        'Inventory alerts',
        inventoryAlerts,
        'Verification and reorder-threshold attention',
        'inventory-alerts',
      ],
    ];
  };

  const foodOwned = (row) =>
    [row?.ownerCommitteeId, row?.assignedCommittee, row?.committeeId, row?.committee]
      .filter(Boolean)
      .some((value) => String(value).toUpperCase().includes('FOOD')) ||
    String(row?.componentType ?? row?.type ?? '').toUpperCase() === 'FOOD';

  const foodRowsFromState = (state) => {
    if (Array.isArray(foodQueueItems)) return foodQueueItems;
    const parents = new Map(
      (state.compositeRequests ?? []).map((parent) => [parent.requestId ?? parent.id, parent]),
    );
    return (state.compositeComponents ?? []).filter(foodOwned).map((child) => {
      const parent = parents.get(child.requestId) ?? {};
      return {
        requestId: child.requestId,
        componentId: child.componentId ?? child.id,
        status: child.status,
        dueAt: child.dueAt ?? child.payload?.food?.serviceStartAt ?? '',
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

  const activeFoodRows = (state) =>
    foodRowsFromState(state).filter(
      (row) =>
        !['COMPLETED', 'REJECTED', 'CANCELLED', 'ARCHIVED'].includes(String(row?.status ?? '').toUpperCase()),
    );

  const foodDateLabel = (value) => {
    const date = new Date(value ?? '');
    if (!Number.isFinite(date.getTime())) return 'Deadline not recorded';
    return new Intl.DateTimeFormat('en-PH', {
      timeZone: 'Asia/Manila',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    }).format(date);
  };

  const foodStatusLabel = (value) =>
    String(value ?? 'FOR_REVIEW')
      .replaceAll('_', ' ')
      .toLowerCase()
      .replace(/^./u, (character) => character.toUpperCase());

  const foodDietaryLabel = (food = {}) => {
    if (food.dietarySummary === 'ATTENTION_REQUIRED')
      return `${Number(food.dietaryAttentionServings ?? 0)} dietary-attention servings`;
    if (food.dietarySummary === 'PENDING_CONFIRMATION') return 'Dietary/allergen confirmation pending';
    return 'No aggregate dietary attention reported';
  };

  const foodLeadTimeLabel = (food = {}) => {
    if (food.leadTime?.status === 'SHORT') return 'Lead time short';
    if (food.leadTime?.status === 'MET') return 'Lead time met';
    return 'Lead time unknown';
  };

  const foodQueueGroupsMarkup = (rows, { allowManage = true } = {}) => {
    const groups = new Map();
    [...rows]
      .sort(
        (left, right) =>
          new Date(left.dueAt || left.food?.serviceStartAt || left.parent?.eventStartAt || 0) -
          new Date(right.dueAt || right.food?.serviceStartAt || right.parent?.eventStartAt || 0),
      )
      .forEach((row) => {
        const key = row.parent?.eventId || row.parent?.eventName || 'NON_EVENT';
        const group = groups.get(key) ?? {
          label: row.parent?.eventName || row.parent?.eventId || 'Non-event food operations',
          rows: [],
        };
        group.rows.push(row);
        groups.set(key, group);
      });
    if (!groups.size) return '<div class="empty">No Food work is in the current authorized scope.</div>';
    return [...groups.values()]
      .map(
        (group) =>
          `<section class="food-event-group"><div class="food-event-group-head"><h4>${esc(group.label)}</h4><span class="pill">${group.rows.length} line${group.rows.length === 1 ? '' : 's'}</span></div><div class="line-list">${group.rows
            .map((item) => {
              const food = item.food ?? {};
              const terminal = ['COMPLETED', 'REJECTED', 'CANCELLED'].includes(
                String(item.status ?? '').toUpperCase(),
              );
              const deadline = item.dueAt || food.serviceStartAt || item.parent?.eventStartAt;
              return `<article class="request-line food-work-line"><div><strong>${esc(item.parent?.purpose || item.componentId || 'Food requirement')}</strong><small>${esc(item.componentId)}${item.parent?.department ? ` · ${esc(item.parent.department)}` : ''} · ${esc(foodDateLabel(deadline))}</small><small>${esc(food.expectedHeadcount ?? '—')} headcount · ${esc(food.requiredServings ?? '—')} servings · ${esc(foodDietaryLabel(food))}</small><small>${esc(foodLeadTimeLabel(food))} · ${esc(foodStatusLabel(food.sourcingStatus || item.status))}${food.sourceReference ? ` · Source ${esc(food.sourceReference)}` : ''}</small></div><div class="request-line-actions"><span class="pill">${esc(foodStatusLabel(item.status))}</span>${allowManage && !terminal ? `<button class="secondary mini" type="button" data-food-manage="${esc(item.componentId)}">Manage</button>` : ''}</div></article>`;
            })
            .join('')}</div></section>`,
      )
      .join('');
  };

  const foodMetrics = (state) => {
    const active = activeFoodRows(state);
    const now = Date.now();
    const deadlineAttention = active.filter((row) => {
      const due = new Date(row.dueAt || row.food?.serviceStartAt || row.parent?.eventStartAt || 0).getTime();
      return Number.isFinite(due) && due >= now && due <= now + 14 * 86_400_000;
    }).length;
    const leadTimeRisk = active.filter((row) =>
      ['SHORT', 'UNKNOWN'].includes(String(row.food?.leadTime?.status ?? '').toUpperCase()),
    ).length;
    const dietaryAttention = active.filter((row) =>
      ['ATTENTION_REQUIRED', 'PENDING_CONFIRMATION'].includes(row.food?.dietarySummary),
    ).length;
    const sourcing = active.filter(
      (row) =>
        row.food?.sourcingStatus !== 'CONFIRMED' ||
        ['WAITING_FOR_BUDGET', 'TO_BE_PROCURED', 'PROCURED'].includes(String(row.status).toUpperCase()),
    ).length;
    const receiving = countStatuses(active, new Set(['RECEIVING', 'PARTIALLY_RECEIVED']));
    const ready = countStatuses(active, new Set(['READY_FOR_HANDOFF', 'READY_TO_RELEASE']));
    return [
      ['Active food lines', active.length, 'All current scoped requirements', 'food-work-queue'],
      ['Upcoming deadlines', deadlineAttention, 'Due within fourteen days', 'food-work-queue'],
      ['Lead-time attention', leadTimeRisk, 'Short or unknown governed lead time', 'food-workflow-reference'],
      ['Dietary attention', dietaryAttention, 'Aggregate confirmation or accommodation', 'food-work-queue'],
      ['Sourcing and budget', sourcing, 'Canvassing through procurement', 'food-suppliers-quotes'],
      ['Receiving attention', receiving, 'Cumulative quantity and evidence checks', 'food-receiving'],
      ['Ready to distribute', ready, 'Capability-bound shared handoffs', 'food-release'],
    ];
  };

  const inventoryBalance = (state, item) => {
    const suppliedOnHand = Number(item?.onHand);
    const suppliedReserved = Number(item?.reserved);
    const suppliedAvailable = Number(item?.availableToPromise);
    if (
      Number.isFinite(suppliedOnHand) &&
      Number.isFinite(suppliedReserved) &&
      Number.isFinite(suppliedAvailable)
    )
      return { onHand: suppliedOnHand, reserved: suppliedReserved, availableToPromise: suppliedAvailable };
    const onHand = (state.ledgerTransactions ?? [])
      .filter((movement) => movement?.itemId === item.id)
      .reduce(
        (total, movement) =>
          total +
          (String(movement?.direction).toUpperCase() === 'IN' ? 1 : -1) * Number(movement?.quantity ?? 0),
        Number(item?.openingOnHand ?? 0),
      );
    const reserved = (state.reservations ?? [])
      .filter((reservation) => reservation?.itemId === item.id && reservation?.status === 'ACTIVE')
      .reduce((total, reservation) => total + Number(reservation?.quantity ?? 0), 0);
    return { onHand, reserved, availableToPromise: onHand - reserved };
  };

  const inventoryHealth = (state, item) => {
    if (String(item?.status).toUpperCase() === 'VERIFY') return 'VERIFY';
    const balance = inventoryBalance(state, item);
    if (balance.onHand <= 0 || balance.availableToPromise <= 0) return 'OUT_OF_STOCK';
    if (balance.availableToPromise <= Number(item?.reorderThreshold ?? 0)) return 'LOW_STOCK';
    return 'IN_STOCK';
  };

  const inventoryActiveItems = (state) =>
    (state.inventoryItems ?? []).filter((item) => String(item?.status).toUpperCase() !== 'ARCHIVED');

  const inventoryStockAlerts = (state) =>
    inventoryActiveItems(state).filter((item) => inventoryHealth(state, item) !== 'IN_STOCK');

  const inventoryConditionAlerts = (state) => {
    const itemSignals = inventoryActiveItems(state).filter(
      (item) => Number(item?.damaged ?? 0) > 0 || Number(item?.maintenance ?? 0) > 0,
    );
    const assetSignals = (state.inventoryAssets ?? []).filter((asset) =>
      ['DAMAGED', 'MAINTENANCE', 'REPAIR', 'LOST', 'RETIRED'].some((signal) =>
        `${asset?.conditionLabel ?? asset?.condition_label ?? ''} ${asset?.lifecycleStatus ?? asset?.lifecycle_status ?? ''}`
          .toUpperCase()
          .includes(signal),
      ),
    );
    return { itemSignals, assetSignals };
  };

  const inventoryMetrics = (state) => {
    const activeItems = inventoryActiveItems(state);
    const stockAttention = inventoryStockAlerts(state).length;
    const condition = inventoryConditionAlerts(state);
    const activeCirculation =
      countStatuses(state.lendingTickets, new Set(['FOR_REVIEW', 'READY_TO_CLAIM', 'ON_LOAN', 'OVERDUE'])) ||
      activeItems.reduce((total, item) => total + Number(item?.onLoan ?? 0), 0);
    const overdue =
      countStatuses(state.lendingTickets, new Set(['OVERDUE'])) ||
      activeItems.reduce((total, item) => total + Number(item?.overdue ?? 0), 0);
    const openRestocking = (state.restockRequests ?? []).filter(
      (row) =>
        !['RESTOCKED', 'REJECTED', 'CANCELLED', 'ARCHIVED'].includes(String(row?.status).toUpperCase()),
    ).length;
    const receiving = countStatuses(state.restockRequests, new Set(['PROCURED', 'PARTIALLY_RECEIVED']));
    const readyStockRelease = (state.requestLines ?? []).filter(
      (line) =>
        line?.fulfillmentSource === 'ISSUE_FROM_STOCK' &&
        ['READY_TO_RELEASE', 'PARTIALLY_RELEASED'].includes(String(line?.status ?? '').toUpperCase()),
    ).length;
    return [
      ['Active catalog items', activeItems.length, 'Inventory and pantry records', 'inventory-management'],
      [
        'Pantry items',
        activeItems.filter((item) => item?.catalogType === 'PANTRY' || item?.stockArea === 'Pantry').length,
        'Canonical non-perishable stock',
        'inventory-pantry-stock',
      ],
      ['Stock alerts', stockAttention, 'Low, unavailable, or verification-required ATP', 'inventory-alerts'],
      [
        'Condition alerts',
        condition.itemSignals.length + condition.assetSignals.length,
        'Damage and maintenance attention',
        'inventory-alerts',
      ],
      ['Active circulation', activeCirculation, 'Review, claim, loan, and return work', 'inventory-lending'],
      ['Overdue', overdue, 'Current-time circulation exceptions', 'inventory-lending'],
      ['Open restocking', openRestocking, 'Review through cumulative receipt', 'inventory-restocking'],
      ['Receiving attention', receiving, 'Procured or partially received lines', 'inventory-receiving'],
      [
        'Ready stock releases',
        readyStockRelease,
        'Reserved lines awaiting controlled handoff',
        'inventory-release',
      ],
    ];
  };

  const materialsMetrics = (state) => {
    const canonicalQueue = materialsQueueItems ?? [];
    if (backendMode === 'rest' || canonicalQueue.length) {
      const status = (row) => String(row?.status ?? '').toUpperCase();
      const active = canonicalQueue.filter(
        (row) => !['COMPLETED', 'REJECTED', 'CANCELLED', 'ARCHIVED'].includes(status(row)),
      );
      const quoteAttention = active.filter(
        (row) =>
          Number(row?.quoteSummary?.activeCount ?? 0) < 2 ||
          Number(row?.quoteSummary?.distinctUnits ?? 0) > 1 ||
          !row?.materials?.preferredCanvassId,
      ).length;
      const receiving = active.filter(
        (row) =>
          ['PROCURED', 'PARTIALLY_RECEIVED', 'RECEIVING'].includes(status(row)) ||
          Number(row?.quantityReceived ?? 0) < Number(row?.quantityRequested ?? 0),
      ).length;
      return [
        ['Active requirements', active.length, 'Canonical scoped deliverables', 'materials-queue'],
        [
          'Quote attention',
          quoteAttention,
          'Coverage, comparability, freshness, or preference',
          'materials-canvassing',
        ],
        [
          'Waiting for budget',
          countStatuses(active, new Set(['WAITING_FOR_BUDGET'])),
          'Approved requirements blocked before purchase',
          'materials-procurement',
        ],
        [
          'To be procured',
          countStatuses(active, new Set(['TO_BE_PROCURED'])),
          'Preferred sourcing ready for purchasing',
          'materials-procurement',
        ],
        [
          'Receiving attention',
          receiving,
          'Cumulative intake and evidence remain incomplete',
          'materials-receiving',
        ],
        [
          'Ready to release',
          countStatuses(active, new Set(['READY_TO_RELEASE', 'PARTIALLY_RELEASED'])),
          'Received deliverables awaiting controlled handoff',
          'materials-release',
        ],
      ];
    }
    const materialsOwned = (row) =>
      [row?.ownerCommitteeId, row?.assignedCommittee, row?.committeeId, row?.committee]
        .filter(Boolean)
        .some((value) => String(value).toUpperCase().includes('MATERIAL')) ||
      String(row?.componentType ?? row?.type ?? '').toUpperCase() === 'MATERIALS';
    const active = [
      ...(state.compositeComponents ?? []),
      ...(state.deliverables ?? []),
      ...(state.requests ?? []),
    ].filter(
      (row) =>
        materialsOwned(row) &&
        !['COMPLETED', 'REJECTED', 'CANCELLED', 'ARCHIVED'].includes(String(row?.status ?? '').toUpperCase()),
    );
    return [
      [
        'For canvassing',
        countStatuses(active, new Set(['FOR_CANVASSING'])),
        'Current comparable quotes required',
        'materials-canvassing',
      ],
      [
        'Waiting for budget',
        countStatuses(active, new Set(['WAITING_FOR_BUDGET'])),
        'Approved needs blocked before purchase',
        'materials-procurement',
      ],
      [
        'To be procured',
        countStatuses(active, new Set(['TO_BE_PROCURED'])),
        'Preferred sourcing ready for purchasing',
        'materials-procurement',
      ],
      [
        'Ready to release',
        countStatuses(active, new Set(['READY_TO_RELEASE'])),
        'Received deliverables awaiting handoff',
        'materials-release',
      ],
    ];
  };

  const materialsStatusLabel = (value) =>
    String(value ?? 'FOR_REVIEW')
      .replaceAll('_', ' ')
      .toLowerCase()
      .replace(/^./u, (character) => character.toUpperCase());

  const materialsQuantityLabel = (item) => {
    const requested = Number(item?.quantityRequested ?? item?.lines?.[0]?.quantity ?? 0);
    const received = Number(item?.quantityReceived ?? item?.lines?.[0]?.receivedQuantity ?? 0);
    const released = Number(item?.quantityReleased ?? item?.lines?.[0]?.releasedQuantity ?? 0);
    const unit = item?.unit ?? item?.lines?.[0]?.unit ?? '';
    return `Requested ${requested} ${unit} · Received ${received} · Released ${released}`;
  };

  const materialsQueueGroupsMarkup = (rows, { allowOpen = true } = {}) => {
    const groups = new Map();
    [...(rows ?? [])]
      .sort(
        (left, right) =>
          new Date(left?.neededAt || left?.materials?.requiredBy || 0) -
          new Date(right?.neededAt || right?.materials?.requiredBy || 0),
      )
      .forEach((row) => {
        const key = row?.eventId || row?.parent?.eventId || row?.requestId || 'NON_EVENT';
        const group = groups.get(key) ?? {
          label: row?.parent?.eventName || row?.eventId || row?.requestId || 'Non-event materials work',
          rows: [],
        };
        group.rows.push(row);
        groups.set(key, group);
      });
    if (!groups.size) return '<div class="empty">No Materials work is in the current authorized scope.</div>';
    return [...groups.values()]
      .map(
        (group) =>
          `<section class="materials-event-group"><div class="materials-event-group-head"><h4>${esc(group.label)}</h4><span class="pill">${group.rows.length} deliverable${group.rows.length === 1 ? '' : 's'}</span></div><div class="line-list">${group.rows
            .map((item) => {
              const materials = item?.materials ?? {};
              const line = item?.lines?.[0] ?? {};
              const terminal = ['COMPLETED', 'REJECTED', 'CANCELLED', 'ARCHIVED'].includes(
                String(item?.status ?? '').toUpperCase(),
              );
              const quoteCount = Number(item?.quoteSummary?.activeCount ?? 0);
              const unitCount = Number(item?.quoteSummary?.distinctUnits ?? 0);
              const quoteSignal = quoteCount
                ? `${quoteCount} active quote${quoteCount === 1 ? '' : 's'}${unitCount > 1 ? ' · units need comparison' : ''}`
                : 'No active quote';
              const preferred = materials.preferredSupplierName
                ? `Preferred ${materials.preferredSupplierName}${materials.preferredPrice == null ? '' : ` · ₱${Number(materials.preferredPrice).toLocaleString('en-PH')} / ${materials.preferredUnit || item.unit || ''}`}`
                : 'No preferred quote';
              return `<article class="request-line materials-work-line"><div><strong>${esc(materials.specification || line.specification || line.description || item.deliverableId || item.componentId)}</strong><small>${esc(item.deliverableId || item.componentId)} · Request ${esc(item.requestId || 'Not recorded')} · ${esc(item.eventId || item.parent?.eventId || 'No event ID')}</small><small>${esc(materials.materialCategory || line.category || 'Materials')} · ${esc(materialsQuantityLabel(item))}</small><small>${esc(quoteSignal)} · ${esc(preferred)}</small><small>Budget ${esc(materialsStatusLabel(materials.budgetStatus || 'NOT_STARTED'))} · Procurement ${esc(materialsStatusLabel(materials.procurementStatus || item.status))} · Required ${esc(foodDateLabel(item.neededAt || materials.requiredBy))}</small></div><div class="request-line-actions"><span class="pill">${esc(materialsStatusLabel(item.status))}</span>${allowOpen && !terminal ? `<button class="secondary mini" type="button" data-materials-open-deliverable="${esc(item.deliverableId || item.componentId)}">Open workflow</button>` : ''}</div></article>`;
            })
            .join('')}</div></section>`,
      )
      .join('');
  };

  const metricsForExperience = (experience, state) =>
    ({
      administrator: administratorMetrics,
      director: directorMetrics,
      food: foodMetrics,
      'inventory-pantry': inventoryMetrics,
      materials: materialsMetrics,
    })[experience]?.(state) ?? [];

  const openAdminReferenceDestination = ({ surface = 'reference', domain = '' } = {}) => {
    adminControlSurface = surface;
    advertisementAdminOpen = false;
    if (domain) referenceAdminDomain = domain;
    const navigation = document.querySelector('[data-admin-view="referenceAdmin"]');
    navigation?.click();
    const root = document.querySelector('#referenceAdminWorkspace');
    if (domain && root?.querySelector('[name="referenceAdminDomain"]')) {
      root.querySelector('[name="referenceAdminDomain"]').value = domain;
      referenceAdminWorkspace = null;
      void refreshReferenceAdminWorkspace({ force: true });
    }
    renderReferenceAdminWorkspace();
  };

  const openAdminDestination = (destination) => {
    if (destination === 'event-management') return openEventManagement();
    const openView = (view) => document.querySelector(`#primaryNav [data-view="${view}"]`)?.click();
    if (destination === 'access-changes') return openAdminReferenceDestination({ domain: 'PERMISSIONS' });
    if (destination === 'failed-evidence' || destination === 'evidence-status')
      return openAdminReferenceDestination({ surface: 'evidence-status' });
    if (destination === 'reference-errors') return openAdminReferenceDestination({ domain: 'SYNC_HEALTH' });
    if (destination === 'environment-health')
      return openAdminReferenceDestination({ surface: 'operational-health' });
    if (destination === 'inventory-discrepancies') {
      openView('inventory');
      const filter = document.querySelector('#inventoryStatusFilter');
      if (filter) {
        filter.value = 'VERIFY';
        filter.dispatchEvent(new Event('input', { bubbles: true }));
      }
      return;
    }
    if (destination === 'lending-blockers') {
      openView('lending');
      document.querySelector('[data-loan-tab="OVERDUE"]')?.click();
      return;
    }
    if (destination === 'release-blockers') return openView('release');
    if (destination === 'receiving' || destination === 'procurement-evidence') {
      openView('procurement');
      document.querySelector('[data-proc-tab="receiving"]')?.click();
      return;
    }
    if (destination === 'all-request-queues' || destination === 'cross-workspace-attention') {
      openView('overview');
      const target =
        destination === 'all-request-queues'
          ? document.querySelector('#committeeDashboardPanel')
          : document.querySelector('#operationalPulse');
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    if (destination === 'request-blockers') {
      openView('overview');
      document.querySelector('[data-dashboard-queue="blocked"]')?.click();
    }
  };

  const eventManagementAllowed = () => can(getState()?.currentUser, 'event.manage');
  const pendingEventValue = (value) =>
    value === null || value === undefined || value === '' ? 'Not added yet' : String(value);
  const eventDateTimeValue = (value) => (value ? String(value).slice(0, 16) : '');
  const eventFormNumber = (value) => (value === '' ? null : Number(value));

  const eventSeriesForm = (series = null) => `<form id="eventSeriesForm">
    <div class="mode-note">The server allocates the system ID and event code. Older planning schedules stay historical and are never merged into the active hierarchy.</div>
    <div class="form-grid section-gap">
      <label class="span-2">Main event name<input name="name" value="${esc(series?.name ?? '')}" required maxlength="200"></label>
      <label>Status<select name="status">${option('ACTIVE', 'Active planning record', series?.status ?? 'ACTIVE')}${option('ARCHIVED', 'Archived', series?.status)}</select></label>
      <label>Event year<input name="year" type="number" min="2000" max="2200" value="${esc(series?.name?.match(/\b20\d{2}\b/u)?.[0] ?? new Date().getFullYear())}" required></label>
      <label class="span-2">Approved source reference<input name="sourceReference" value="${esc(series?.sourceReference ?? '')}"></label>
      <label class="span-2">Superseded historical reference<input name="supersedesReference" value="${esc(series?.supersedesReference ?? '')}"></label>
      <label class="span-2">Additional notes<textarea name="notes">${esc(series?.notes ?? '')}</textarea></label>
      <label class="span-2">Correction reason<input name="reason" value="${esc(series ? 'Audited event-series correction' : 'Approved main event creation')}" required minlength="8"></label>
    </div>
    <button class="primary" type="submit">${series ? 'Save Main Event' : 'Create Main Event'}</button>
  </form>`;

  const eventDayForm = (seriesId, day = null) => `<form id="eventDayForm">
    <div class="form-grid">
      <label>Event date<input name="date" type="date" value="${esc(day?.date ?? '')}" required></label>
      <label>Status<select name="status">${['UPCOMING', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'ARCHIVED'].map((status) => option(status, status.replaceAll('_', ' '), day?.status ?? 'UPCOMING')).join('')}</select></label>
      <label class="span-2">Day label <small>Optional; a date label is generated when blank.</small><input name="name" value="${esc(day?.name ?? '')}"></label>
      <label class="span-2">Notes<textarea name="notes">${esc(day?.notes ?? '')}</textarea></label>
      <label class="span-2">Correction reason<input name="reason" value="${esc(day ? 'Audited event-day correction' : 'Approved event day creation')}" required minlength="8"></label>
    </div>
    <button class="primary" type="submit">${day ? 'Save Event Day' : 'Add Event Day'}</button>
    <input type="hidden" name="eventSeriesId" value="${esc(seriesId)}">
  </form>`;

  const eventActivityForm = (dayId, activity = null) => {
    const committees = eventManagementDirectory?.committees ?? [];
    return `<form id="eventActivityForm">
      <div class="mode-note">Unknown operational values may remain blank. They render as <strong>Not added yet</strong> or <strong>Not assessed</strong> and stay in owner review.</div>
      <div class="form-grid section-gap">
        <label class="span-2">Activity name<input name="name" value="${esc(activity?.name ?? '')}" required></label>
        <label>Activity type<input name="activityType" value="${esc(activity?.activityType ?? '')}" required></label>
        <label>Venue<input name="venue" value="${esc(activity?.venue ?? '')}" required></label>
        <label class="span-2">Included games or program items <small>Comma-separated; leave blank when not applicable.</small><input name="includedItems" value="${esc((activity?.includedItems ?? []).join(', '))}"></label>
        <label>Time status<select name="timeStatus">${option('TBA', 'TBA', activity?.timeStatus ?? 'TBA')}${option('SCHEDULED', 'Scheduled', activity?.timeStatus)}</select></label>
        <label>Status<select name="status">${['UPCOMING', 'ACTIVE', 'COMPLETED', 'CANCELLED', 'ARCHIVED'].map((status) => option(status, status.replaceAll('_', ' '), activity?.status ?? 'UPCOMING')).join('')}</select></label>
        <label>Starts at<input name="startAt" type="datetime-local" value="${esc(eventDateTimeValue(activity?.startAt))}"></label>
        <label>Ends at<input name="endAt" type="datetime-local" value="${esc(eventDateTimeValue(activity?.endAt))}"></label>
        <label>Responsible committee<select name="responsibleCommitteeId"><option value="">Not added yet</option>${committees.map((entry) => option(entry.id, entry.name, activity?.responsibleCommitteeId)).join('')}</select></label>
        <label>Supporting committees<select name="supportingCommitteeIds" multiple size="4">${committees.map((entry) => option(entry.id, entry.name, (activity?.supportingCommitteeIds ?? []).includes(entry.id) ? entry.id : '')).join('')}</select></label>
        <label>Preparation deadline<input name="preparationDeadline" type="datetime-local" value="${esc(eventDateTimeValue(activity?.preparationDeadline))}"></label>
        <label>Release deadline<input name="releaseDeadline" type="datetime-local" value="${esc(eventDateTimeValue(activity?.releaseDeadline))}"></label>
        <label>Request window opens<input name="requestWindowOpensAt" type="datetime-local" value="${esc(eventDateTimeValue(activity?.requestWindowOpensAt))}"></label>
        <label>Request window closes<input name="requestWindowClosesAt" type="datetime-local" value="${esc(eventDateTimeValue(activity?.requestWindowClosesAt))}"></label>
        <label>Readiness percent <small>Blank means Not assessed.</small><input name="readinessPercentage" type="number" min="0" max="100" step="1" value="${esc(activity?.readinessPercentage ?? '')}"></label>
        <label>Preparation progress <small>Blank means Not assessed.</small><input name="preparationProgress" type="number" min="0" max="100" step="1" value="${esc(activity?.preparationProgress ?? '')}"></label>
        <label class="span-2">Additional notes<textarea name="notes">${esc(activity?.notes ?? '')}</textarea></label>
        <label class="span-2">Approved source reference<input name="sourceReference" value="${esc(activity?.sourceReference ?? '')}"></label>
        <label class="span-2">Correction reason<input name="reason" value="${esc(activity ? 'Audited activity correction' : 'Approved activity creation')}" required minlength="8"></label>
      </div>
      <button class="primary" type="submit">${activity ? 'Save Audited Correction' : 'Add Activity'}</button>
      <input type="hidden" name="eventDayId" value="${esc(dayId)}">
    </form>`;
  };

  const attachEventSeriesForm = (series = null) => {
    const form = document.querySelector('#eventSeriesForm');
    form?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const values = Object.fromEntries(new FormData(form));
      try {
        await services.saveEventSeries({
          ...values,
          ...(series ? { eventSeriesId: series.id, expectedRevision: series.revision } : {}),
        });
        markFormClean(form);
        closeModal();
        await openEventManagement(true);
        toast(series ? 'Main event updated with audit history.' : 'Main event created.');
      } catch (error) {
        toast(error.message, true);
      }
    });
  };

  const attachEventDayForm = (seriesId, day = null) => {
    const form = document.querySelector('#eventDayForm');
    form?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const values = Object.fromEntries(new FormData(form));
      try {
        await services.saveEventDay({
          ...values,
          eventSeriesId: seriesId,
          ...(day ? { eventDayId: day.id, expectedRevision: day.revision } : {}),
        });
        markFormClean(form);
        closeModal();
        await openEventManagement(true);
        toast(day ? 'Event day updated with audit history.' : 'Event day added.');
      } catch (error) {
        toast(error.message, true);
      }
    });
  };

  const attachEventActivityForm = (dayId, activity = null) => {
    const form = document.querySelector('#eventActivityForm');
    form?.addEventListener('submit', async (event) => {
      event.preventDefault();
      const formData = new FormData(form);
      const values = Object.fromEntries(formData);
      values.includedItems = String(values.includedItems ?? '')
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);
      values.supportingCommitteeIds = formData.getAll('supportingCommitteeIds');
      values.readinessPercentage = eventFormNumber(values.readinessPercentage);
      values.preparationProgress = eventFormNumber(values.preparationProgress);
      if (values.timeStatus === 'TBA') {
        values.startAt = null;
        values.endAt = null;
      }
      try {
        await services.saveEventActivity({
          ...values,
          eventDayId: dayId,
          ...(activity ? { activityId: activity.id, expectedRevision: activity.revision } : {}),
        });
        markFormClean(form);
        closeModal();
        await openEventManagement(true);
        toast(activity ? 'Activity correction recorded.' : 'Activity added.');
      } catch (error) {
        toast(error.message, true);
      }
    });
  };

  const openEventEditor = (action, id = '') => {
    if (!eventManagementAllowed()) return toast('Event management is not authorized.', true);
    if (action === 'series-create' || action === 'series-edit') {
      const series = eventManagementDirectory?.eventSeries?.find((entry) => entry.id === id) ?? null;
      openModal(series ? `Edit ${series.name}` : 'Create Main Event', eventSeriesForm(series));
      attachEventSeriesForm(series);
      return;
    }
    if (action === 'day-create' || action === 'day-edit') {
      const day = eventManagementDirectory?.eventDays?.find((entry) => entry.id === id) ?? null;
      const seriesId = day?.seriesId ?? id;
      openModal(day ? `Edit ${day.name}` : 'Add Event Day', eventDayForm(seriesId, day));
      attachEventDayForm(seriesId, day);
      return;
    }
    if (action === 'activity-create' || action === 'activity-edit') {
      const activity = eventManagementDirectory?.activities?.find((entry) => entry.id === id) ?? null;
      const dayId = activity?.eventDayId ?? id;
      openModal(activity ? `Edit ${activity.name}` : 'Add Activity', eventActivityForm(dayId, activity));
      attachEventActivityForm(dayId, activity);
      return;
    }
    if (action === 'activity-link') {
      const activity = eventManagementDirectory?.activities?.find((entry) => entry.id === id);
      if (!activity) return;
      openModal(
        `Link operational record to ${activity.name}`,
        `<form id="eventLinkForm"><div class="form-grid"><label>Record type<select name="linkType">${['REQUEST', 'FOOD_REQUIREMENT', 'MATERIAL', 'PROCUREMENT', 'INVENTORY_REQUIREMENT', 'RELEASE'].map((type) => option(type, type.replaceAll('_', ' '))).join('')}</select></label><label>Authoritative record ID<input name="linkedEntityId" required></label><label class="span-2">Notes<textarea name="notes"></textarea></label><label class="span-2">Reason<input name="reason" value="Link operational record to approved activity" required minlength="8"></label></div><button class="primary" type="submit">Create Audited Link</button></form>`,
      );
      const form = document.querySelector('#eventLinkForm');
      form?.addEventListener('submit', async (event) => {
        event.preventDefault();
        try {
          await services.linkEventOperationalRecord({
            ...Object.fromEntries(new FormData(form)),
            activityId: activity.id,
          });
          markFormClean(form);
          closeModal();
          await openEventManagement(true);
          toast('Operational record linked with audit history.');
        } catch (error) {
          toast(error.message, true);
        }
      });
    }
  };

  const renderEventManagement = () => {
    const root = document.querySelector('[data-event-management]');
    if (!root) return;
    if (!eventManagementDirectory) {
      root.innerHTML = '<div class="empty">Loading protected event management…</div>';
      return;
    }
    const directory = eventManagementDirectory;
    const activityMarkup = (activity) => {
      const readiness =
        activity.readinessPercentage === null ? 'Not assessed' : `${activity.readinessPercentage}%`;
      const progress =
        activity.preparationProgress === null ? 'Not assessed' : `${activity.preparationProgress}%`;
      const time =
        activity.timeStatus === 'TBA'
          ? 'TBA'
          : `${new Date(activity.startAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}–${new Date(activity.endAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`;
      const activityLinks = (directory.links ?? []).filter((entry) => entry.activityId === activity.id);
      return `<article class="event-activity-card"><div class="panel-head"><div><p class="eyebrow">${esc(activity.code)} · ${esc(activity.activityType)}</p><h4>${esc(activity.name)}</h4><p>${esc(time)} · ${esc(activity.venue)}</p>${activity.includedItems?.length ? `<p><strong>Included:</strong> ${esc(activity.includedItems.join(', '))}</p>` : ''}</div><span class="pill">${esc(activity.ownerReviewStatus.replaceAll('_', ' '))}</span></div><dl class="event-truth-grid"><div><dt>Responsible committee</dt><dd>${esc(activity.responsibleCommitteeName ?? 'Not added yet')}</dd></div><div><dt>Supporting committees</dt><dd>${esc(activity.supportingCommitteeIds.length ? activity.supportingCommitteeIds.join(', ') : 'Not added yet')}</dd></div><div><dt>Preparation deadline</dt><dd>${esc(pendingEventValue(activity.preparationDeadline))}</dd></div><div><dt>Request window</dt><dd>${esc(activity.requestWindowOpensAt && activity.requestWindowClosesAt ? `${activity.requestWindowOpensAt} – ${activity.requestWindowClosesAt}` : 'Not added yet')}</dd></div><div><dt>Release deadline</dt><dd>${esc(pendingEventValue(activity.releaseDeadline))}</dd></div><div><dt>Readiness</dt><dd>${esc(readiness)}</dd></div><div><dt>Preparation progress</dt><dd>${esc(progress)}</dd></div><div><dt>Additional notes</dt><dd>${esc(activity.notes ?? 'Not added yet')}</dd></div></dl><div class="button-row"><button class="secondary" type="button" data-event-action="activity-edit" data-event-id="${esc(activity.id)}">Edit audited fields</button><button class="secondary" type="button" data-event-action="activity-link" data-event-id="${esc(activity.id)}">Link operational record</button><span class="pill">${esc(activityLinks.length)} linked</span></div></article>`;
    };
    root.innerHTML = `<div class="panel-head"><div><p class="eyebrow">Protected Admin and Director workflow</p><h2>Event Management</h2><p>Main Events → Event Days → Activities. Missing operational values remain truthful and visible in owner review.</p></div><button class="primary" type="button" data-event-action="series-create">Create Main Event</button></div><div class="event-series-stack section-gap">${
      directory.eventSeries
        .map((series) => {
          const days = directory.eventDays.filter((day) => day.seriesId === series.id && day.active);
          return `<section class="event-series-card"><div class="panel-head"><div><p class="eyebrow">${esc(series.code)} · ${esc(series.status)}</p><h3>${esc(series.name)}</h3><p>Source: ${esc(series.sourceReference ?? 'Not added yet')}</p></div><div class="button-row"><button class="secondary" type="button" data-event-action="series-edit" data-event-id="${esc(series.id)}">Edit</button><button class="primary" type="button" data-event-action="day-create" data-event-id="${esc(series.id)}">Add Event Day</button></div></div>${
            days
              .map(
                (day) =>
                  `<section class="event-day-card"><div class="panel-head"><div><p class="eyebrow">Event Day · ${esc(day.status)}</p><h4>${esc(day.name)}</h4><p>${esc(day.date)}</p></div><div class="button-row"><button class="secondary" type="button" data-event-action="day-edit" data-event-id="${esc(day.id)}">Edit day</button><button class="primary" type="button" data-event-action="activity-create" data-event-id="${esc(day.id)}">Add activity</button></div></div>${
                    directory.activities
                      .filter((activity) => activity.eventDayId === day.id && activity.active)
                      .map(activityMarkup)
                      .join('') || '<div class="empty">No activities added.</div>'
                  }</section>`,
              )
              .join('') || '<div class="empty">No event days added.</div>'
          }</section>`;
        })
        .join('') || '<div class="empty">No governed main events exist.</div>'
    }</div><section class="event-history section-gap"><div class="panel-head"><div><p class="eyebrow">Append-only evidence</p><h3>Activity History</h3><p>Actor, timestamp, reason, and correlation are server-owned.</p></div><span class="pill">${esc(directory.history.length)} records</span></div><div class="line-list">${
      directory.history
        .slice(0, 100)
        .map(
          (entry) =>
            `<div class="request-line"><div><strong>${esc(entry.action.replaceAll('_', ' '))} · ${esc(entry.entityType.replaceAll('_', ' '))}</strong><small>${esc(entry.reason)} · ${esc(entry.actorName ?? entry.actorId)} · ${esc(new Date(entry.occurredAt).toLocaleString())}</small></div><span class="pill">${esc(entry.entityId)}</span></div>`,
        )
        .join('') || '<div class="empty">No event history has been recorded.</div>'
    }</div></section>`;
  };

  const openEventManagement = async (force = false) => {
    if (!eventManagementAllowed()) return toast('Event management is not authorized.', true);
    const root = document.querySelector('[data-event-management]');
    if (!root) return;
    eventManagementOpen = true;
    root.hidden = false;
    renderEventManagement();
    if (!eventManagementDirectory || force) {
      eventManagementPromise ??= services.getEventManagement({}).finally(() => {
        eventManagementPromise = null;
      });
      try {
        eventManagementDirectory = await eventManagementPromise;
        renderEventManagement();
      } catch (error) {
        root.innerHTML = `<div class="alert error">${esc(error.message)}</div>`;
        return;
      }
    }
    root.scrollIntoView({ behavior: 'smooth', block: 'start' });
    root.focus({ preventScroll: true });
  };

  const renderDirectorDetail = (destination) => {
    const panel = document.querySelector('#roleExperiencePanel[data-role-experience="director"]');
    const detail = panel?.querySelector('[data-director-detail]');
    if (!detail) return;
    const state = getState() ?? {};
    const status = (row) => String(row?.status ?? '').toUpperCase();
    let title = 'Leadership detail';
    let note = 'Server-authorized records in the current operational scope.';
    let rows = [];
    if (destination === 'decision-queue') {
      title = 'Decision Queue';
      rows = [...(state.requests ?? []), ...(state.deliverables ?? [])].filter((row) =>
        ['FOR_REVIEW', 'NEEDS_INFORMATION'].includes(status(row)),
      );
    } else if (destination === 'cross-workflow-blockers') {
      title = 'Cross-workflow blockers';
      rows = [
        ...(state.requests ?? []),
        ...(state.deliverables ?? []),
        ...(state.lendingTickets ?? []),
      ].filter((row) =>
        ['BLOCKED', 'WAITING_FOR_BUDGET', 'NEEDS_INFORMATION', 'OVERDUE'].includes(status(row)),
      );
    } else if (destination === 'event-planning') {
      title = 'Event Planning';
      rows = (state.events ?? [])
        .filter((event) => new Date(event?.endAt ?? 0).getTime() >= Date.now())
        .sort((left, right) => new Date(left.startAt) - new Date(right.startAt));
      note = 'Approved upcoming event rows only; no event truth is invented.';
    } else if (destination === 'event-series') {
      title = 'Event Series & Sub-events';
      rows = (state.eventSeries ?? []).filter(
        (series) => !['COMPLETED', 'ARCHIVED', 'CANCELLED'].includes(status(series)),
      );
    } else if (destination === 'committee-readiness') {
      title = 'Committee Readiness';
      const committees = [
        ['COM_FOOD', 'Food Committee'],
        ['COM_INVENTORY_PANTRY', 'Inventory & Pantry Committee'],
        ['COM_MATERIALS', 'Materials Committee'],
      ];
      const operational = [...(state.requests ?? []), ...(state.deliverables ?? [])];
      rows = committees.map(([id, name]) => {
        const owned = operational.filter((row) =>
          [row?.assignedCommittee, row?.ownerCommitteeId, row?.committeeId].includes(id),
        );
        const blockers = owned.filter((row) =>
          ['BLOCKED', 'WAITING_FOR_BUDGET', 'NEEDS_INFORMATION'].includes(status(row)),
        );
        return {
          id,
          name,
          status: owned.length ? (blockers.length ? 'ATTENTION' : 'NO_BLOCKER_PROJECTED') : 'NO_DATA',
          detail: owned.length
            ? `${blockers.length} blocker${blockers.length === 1 ? '' : 's'} across ${owned.length} governed record${owned.length === 1 ? '' : 's'}`
            : 'No governed committee records are projected in this scope',
        };
      });
      note = 'Readiness is derived from governed records; NO DATA is not treated as ready.';
    } else if (destination === 'request-progress') {
      title = 'Request Progress';
      rows = (state.requests ?? []).filter(
        (row) => !['COMPLETED', 'REJECTED', 'CANCELLED', 'ARCHIVED'].includes(status(row)),
      );
    }
    detail.hidden = false;
    detail.innerHTML = `<div class="panel-head"><div><p class="eyebrow">Progressive operational detail</p><h3 id="directorDetailTitle">${esc(title)}</h3><p>${esc(note)}</p></div><span class="pill">${esc(rows.length)} record${rows.length === 1 ? '' : 's'}</span></div><div class="line-list section-gap">${
      rows
        .slice(0, 50)
        .map(
          (row) =>
            `<div class="request-line"><div><strong>${esc(row.name ?? row.itemSpec ?? row.purpose ?? row.id ?? 'Governed record')}</strong><small>${esc(row.id ?? '')}${row.detail ? ` &middot; ${esc(row.detail)}` : ''}</small></div><span class="pill">${esc(row.status ?? 'ACTIVE')}</span></div>`,
        )
        .join('') || '<div class="empty">No governed records match this leadership view.</div>'
    }</div>`;
    detail.scrollIntoView({ behavior: 'smooth', block: 'start' });
    detail.focus({ preventScroll: true });
  };

  const openDirectorDestination = (destination) => {
    if (destination === 'event-management') return openEventManagement();
    const openView = (view) => document.querySelector(`#primaryNav [data-view="${view}"]`)?.click();
    if (
      [
        'decision-queue',
        'cross-workflow-blockers',
        'event-planning',
        'event-series',
        'committee-readiness',
        'request-progress',
      ].includes(destination)
    )
      return renderDirectorDetail(destination);
    if (destination === 'release-readiness') return openView('release');
    if (destination === 'lending-status') {
      openView('lending');
      document.querySelector('[data-loan-tab="FOR_REVIEW"]')?.click();
      return;
    }
    if (destination === 'inventory-alerts') {
      openView('inventory');
      const filter = document.querySelector('#inventoryStatusFilter');
      if (filter) {
        filter.value = 'VERIFY';
        filter.dispatchEvent(new Event('input', { bubbles: true }));
      }
      return;
    }
    if (destination === 'management-access') {
      const management = document.querySelector('[data-director-management-access]');
      management?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      management?.focus({ preventScroll: true });
    }
  };

  const FOOD_DESTINATION_CAPABILITIES = Object.freeze({
    'food-work-queue': 'request.review',
    'food-suppliers-quotes': 'fulfillment.canvass',
    'food-procurement': 'fulfillment.procure',
    'food-receiving': 'fulfillment.receive',
    'food-release': 'fulfillment.release',
  });

  const foodDestinationAllowed = (destination) => {
    const capability = FOOD_DESTINATION_CAPABILITIES[destination];
    return !capability || can(getState()?.currentUser, capability);
  };

  const openFoodDestination = (destination) => {
    if (!foodDestinationAllowed(destination)) return;
    const openView = (view) => document.querySelector(`#primaryNav [data-view="${view}"]`)?.click();
    if (destination === 'food-work-queue') {
      openView('request');
      foodQueue?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    if (destination === 'food-suppliers-quotes') {
      openView('procurement');
      document.querySelector('[data-proc-tab="canvass"]')?.click();
      return;
    }
    if (destination === 'food-procurement') {
      openView('procurement');
      document.querySelector('[data-proc-tab="deliverables"]')?.click();
      return;
    }
    if (destination === 'food-receiving') {
      openView('procurement');
      document.querySelector('[data-proc-tab="receiving"]')?.click();
      return;
    }
    if (destination === 'food-release') {
      openView('release');
      return;
    }
    if (destination === 'food-workflow-reference') {
      const reference = document.querySelector('[data-food-workflow-reference]');
      reference?.removeAttribute('hidden');
      reference?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      reference?.focus({ preventScroll: true });
    }
  };

  const INVENTORY_DESTINATION_CAPABILITIES = Object.freeze({
    'inventory-management': 'view.inventory',
    'inventory-pantry-stock': 'view.inventory',
    'inventory-restocking': 'view.inventory',
    'inventory-lending': 'view.internal',
    'inventory-receiving': 'fulfillment.receive',
    'inventory-release': 'fulfillment.release',
    'inventory-movement-history': 'view.inventory',
    'inventory-alerts': 'view.inventory',
  });

  const inventoryDestinationAllowed = (destination) => {
    const capability = INVENTORY_DESTINATION_CAPABILITIES[destination];
    return !capability || can(getState()?.currentUser, capability);
  };

  const MATERIALS_DESTINATION_CAPABILITIES = Object.freeze({
    'materials-queue': 'request.review',
    'materials-canvassing': 'fulfillment.canvass',
    'materials-procurement': 'fulfillment.procure',
    'materials-suppliers': 'fulfillment.canvass',
    'materials-price-history': 'fulfillment.canvass',
    'materials-receiving': 'fulfillment.receive',
    'materials-deliverables': 'view.internal',
    'materials-release': 'fulfillment.release',
  });

  const materialsDestinationAllowed = (destination) => {
    const capability = MATERIALS_DESTINATION_CAPABILITIES[destination];
    return !capability || can(getState()?.currentUser, capability);
  };

  const inventoryClassificationAllowed = () => {
    const user = getState()?.currentUser;
    if (!user || (!can(user, 'inventory.classify') && !can(user, 'classify_inventory'))) return false;
    const authorization = user.authorization ?? {};
    return (
      ['SYSTEM_OWNER', 'ADMINISTRATOR', 'DIRECTOR'].includes(authorization.roleId ?? user.role) ||
      (authorization.committeeIds ?? []).includes('COM_INVENTORY_PANTRY')
    );
  };

  const localClassificationDirectory = () => {
    const all = (getState()?.inventoryItems ?? [])
      .filter((item) => item.status !== 'ARCHIVED')
      .map((item) => ({
        ...item,
        inventoryKind:
          item.inventoryKind ??
          (String(item.handlingCode ?? item.handling)
            .toUpperCase()
            .includes('REUSABLE') ||
          String(item.handlingCode ?? item.handling)
            .toUpperCase()
            .includes('LOAN')
            ? 'REUSABLE'
            : String(item.handlingCode ?? item.handling)
                  .toUpperCase()
                  .includes('CONSUMABLE')
              ? 'CONSUMABLE'
              : 'UNVERIFIED'),
        classificationStatus:
          item.classificationStatus ??
          (['', 'TO_CLASSIFY'].includes(
            String(item.handlingCode ?? item.handling)
              .trim()
              .toUpperCase(),
          )
            ? 'NEEDS_CLASSIFICATION'
            : 'CLASSIFIED'),
        conditionReviewState: item.conditionReviewState ?? 'NOT_ASSESSED',
        maintenanceReviewState: item.maintenanceReviewState ?? 'NOT_ASSESSED',
        classificationRevision: Number(item.classificationRevision ?? 1),
        assetInstanceCount: Number(item.traceableAssets ?? 0),
        classificationHistory: item.classificationHistory ?? [],
      }));
    const matches = all.filter(
      (item) =>
        (inventoryClassificationStatus === 'ALL' ||
          item.classificationStatus === inventoryClassificationStatus) &&
        (inventoryClassificationKind === 'ALL' || item.inventoryKind === inventoryClassificationKind) &&
        (!inventoryClassificationSearch ||
          [item.id, item.name, item.category, item.stockArea]
            .join(' ')
            .toLowerCase()
            .includes(inventoryClassificationSearch.toLowerCase())),
    );
    const pageSize = 10;
    return {
      progress: {
        total: all.length,
        pending: all.filter((item) => item.classificationStatus === 'NEEDS_CLASSIFICATION').length,
        classified: all.filter((item) => item.classificationStatus === 'CLASSIFIED').length,
      },
      total: matches.length,
      page: inventoryClassificationPage,
      pageSize,
      items: matches.slice(
        (inventoryClassificationPage - 1) * pageSize,
        inventoryClassificationPage * pageSize,
      ),
    };
  };

  const loadInventoryClassificationDirectory = async ({ force = false } = {}) => {
    if (!inventoryClassificationAllowed()) return null;
    if (inventoryClassificationPromise && !force) return inventoryClassificationPromise;
    inventoryClassificationPromise = (async () => {
      const result =
        backendMode === 'mock'
          ? localClassificationDirectory()
          : await services.listInventoryClassifications({
              page: inventoryClassificationPage,
              pageSize: 10,
              search: inventoryClassificationSearch,
              status: inventoryClassificationStatus,
              inventoryKind: inventoryClassificationKind,
            });
      inventoryClassificationDirectory = result;
      renderInventoryClassificationQueue();
      return result;
    })();
    try {
      return await inventoryClassificationPromise;
    } catch (error) {
      toast(`${error.message}${error.correlationId ? ` · ${error.correlationId}` : ''}`, true);
      return null;
    } finally {
      inventoryClassificationPromise = null;
    }
  };

  const classificationFormHtml = (item) => {
    const history = item.classificationHistory ?? [];
    return `<form id="inventoryClassificationForm">
      <div class="mode-note"><strong>${esc(item.id)} · ${esc(item.name)}</strong><br>On hand ${esc(item.onHand ?? 0)}; reserved ${esc(item.reserved ?? 0)}; available ${esc(item.availableToPromise ?? 0)} ${esc(item.unit)}. Quantity is ledger-derived and cannot be edited here.</div>
      <div class="form-grid section-gap">
        <label>Review status<select name="classificationStatus">${option('NEEDS_CLASSIFICATION', 'Needs classification', item.classificationStatus)}${option('CLASSIFIED', 'Classification complete', item.classificationStatus)}</select></label>
        <label>Inventory kind<select name="inventoryKind">${option('UNVERIFIED', 'Unverified', item.inventoryKind)}${option('REUSABLE', 'Reusable', item.inventoryKind)}${option('CONSUMABLE', 'Consumable', item.inventoryKind)}</select></label>
        <label>Stock area<input name="stockArea" value="${esc(item.stockArea ?? '')}" required></label>
        <label>Storage location<input name="storageLocation" value="${esc(item.storageLocation ?? '')}" required></label>
        <label>Unit<input name="unit" value="${esc(item.unit ?? '')}" required><small>Historical units cannot be changed after ledger activity.</small></label>
        <label>Reorder threshold<input name="reorderThreshold" type="number" min="0" step="0.01" value="${esc(item.reorderThreshold ?? 0)}" required></label>
        <label>Condition review<select name="conditionReviewState">${option('NOT_ASSESSED', 'Not assessed', item.conditionReviewState)}${option('NOT_APPLICABLE', 'Not applicable', item.conditionReviewState)}${option('NEW', 'New', item.conditionReviewState)}${option('GOOD', 'Good', item.conditionReviewState)}${option('FAIR', 'Fair', item.conditionReviewState)}${option('POOR', 'Poor / quarantine', item.conditionReviewState)}${option('DAMAGED', 'Damaged', item.conditionReviewState)}</select></label>
        <label>Maintenance review<select name="maintenanceReviewState">${option('NOT_ASSESSED', 'Not assessed', item.maintenanceReviewState)}${option('NOT_APPLICABLE', 'Not applicable', item.maintenanceReviewState)}${option('CLEARED', 'Cleared', item.maintenanceReviewState)}${option('MAINTENANCE_REQUIRED', 'Maintenance required', item.maintenanceReviewState)}</select></label>
        <label class="checkbox span-2"><input name="isLendable" type="checkbox" value="true" ${item.isLendable ? 'checked' : ''}> Enable lending after this review</label>
        <label>Lending audience<select name="lendingAudience">${option('NOT_AVAILABLE_FOR_LENDING', 'Not available for lending', item.lendingAudience)}${option('USC_STAFF_ONLY', 'USC officers and staff only', item.lendingAudience)}${option('STUDENTS_AND_STAFF', 'Students and USC staff', item.lendingAudience)}${option('DOL_INTERNAL_ONLY', 'DOL internal only', item.lendingAudience)}</select></label>
        <label class="checkbox"><input name="enableLendingConfirmed" type="checkbox" value="true"> I explicitly confirm lending may be enabled</label>
        <label>Traceable asset count<input name="assetInstanceCountIfReusable" type="number" min="0" step="1" value="${esc(item.assetInstanceCount ?? 0)}"></label>
        <label class="checkbox"><input name="assetTrackingConfirmed" type="checkbox" value="true"> I verified reusable kind, actual count, individual tracking, and physical condition</label>
        <label class="span-2">New physical asset tags<textarea name="assetTags" placeholder="One verified asset tag per new physical unit"></textarea><small>Opening quantity is never converted into asset instances.</small></label>
        <label class="span-2">Classification notes<textarea name="classificationNotes" maxlength="1000">${esc(item.classificationNotes ?? '')}</textarea></label>
        <label class="span-2">Optional governed evidence ID<input name="evidenceId" value="${esc(item.classificationEvidenceId ?? '')}"></label>
      </div>
      <button class="primary" type="submit">Record Classification</button>
      <section class="section-gap"><h3>Classification history</h3><div class="line-list">${
        history
          .map(
            (entry) =>
              `<div class="request-line"><div><strong>Revision ${esc(entry.revision)} · ${esc(entry.newStatus)}</strong><small>${esc(entry.newKind)} · ${entry.isLendable ? 'Lending enabled' : 'Non-lendable'} · ${esc(entry.occurredAt)}</small><small>Actor ${esc(entry.actorAccountId)}${entry.evidenceId ? ' · Evidence linked' : ''}</small></div></div>`,
          )
          .join('') || '<div class="empty">No classification history has been recorded.</div>'
      }</div></section>
    </form>`;
  };

  const mockClassifyInventoryItem = (item, payload) => {
    const now = new Date().toISOString();
    const previousStatus = item.classificationStatus ?? 'NEEDS_CLASSIFICATION';
    const previousKind = item.inventoryKind ?? 'UNVERIFIED';
    Object.assign(item, {
      inventoryKind: payload.inventoryKind,
      classificationStatus: payload.classificationStatus,
      conditionReviewState: payload.conditionReviewState,
      maintenanceReviewState: payload.maintenanceReviewState,
      stockArea: payload.stockArea,
      storageLocation: payload.storageLocation,
      unit: payload.unit,
      reorderThreshold: Number(payload.reorderThreshold),
      isLendable: payload.isLendable === true,
      lendingAudience: payload.isLendable ? payload.lendingAudience : 'NOT_AVAILABLE_FOR_LENDING',
      handling:
        payload.inventoryKind === 'REUSABLE'
          ? 'REUSABLE_ASSET'
          : payload.inventoryKind === 'CONSUMABLE'
            ? 'CONSUMABLE'
            : 'TO_CLASSIFY',
      classificationNotes: payload.classificationNotes,
      classificationEvidenceId: payload.evidenceId,
      classificationRevision: Number(item.classificationRevision ?? 1) + 1,
      classifiedAt: payload.classificationStatus === 'CLASSIFIED' ? now : null,
    });
    item.classificationHistory ??= [];
    item.classificationHistory.unshift({
      revision: item.classificationRevision,
      previousStatus,
      newStatus: item.classificationStatus,
      previousKind,
      newKind: item.inventoryKind,
      isLendable: item.isLendable,
      occurredAt: now,
      actorAccountId: 'LOCAL_PREVIEW',
      evidenceId: payload.evidenceId,
    });
    return {
      itemId: item.id,
      classificationRevision: item.classificationRevision,
      correlationId: 'LOCAL-PREVIEW',
    };
  };

  const submitInventoryClassification = async (item, draft, { bulkGroupId = '' } = {}) => {
    const payload = {
      itemId: item.id,
      expectedRevision: Number(item.classificationRevision ?? 1),
      classificationStatus: draft.classificationStatus,
      inventoryKind: draft.inventoryKind,
      stockArea: draft.stockArea ?? item.stockArea,
      storageLocation: draft.storageLocation ?? item.storageLocation,
      unit: draft.unit ?? item.unit,
      reorderThreshold: Number(draft.reorderThreshold ?? item.reorderThreshold ?? 0),
      conditionReviewState: draft.conditionReviewState,
      maintenanceReviewState: draft.maintenanceReviewState,
      isLendable: draft.isLendable === true || draft.isLendable === 'true' || draft.isLendable === 'on',
      lendingAudience: draft.lendingAudience ?? 'NOT_AVAILABLE_FOR_LENDING',
      enableLendingConfirmed:
        draft.enableLendingConfirmed === true ||
        draft.enableLendingConfirmed === 'true' ||
        draft.enableLendingConfirmed === 'on',
      assetInstanceCountIfReusable: Number(
        draft.assetInstanceCountIfReusable ?? item.assetInstanceCount ?? 0,
      ),
      assetTrackingConfirmed:
        draft.assetTrackingConfirmed === true ||
        draft.assetTrackingConfirmed === 'true' ||
        draft.assetTrackingConfirmed === 'on',
      assetTags: String(draft.assetTags ?? '')
        .split(/[\n,]/u)
        .map((value) => value.trim())
        .filter(Boolean),
      classificationNotes: draft.classificationNotes ?? '',
      evidenceId: draft.evidenceId ?? '',
      bulkGroupId,
    };
    if (backendMode === 'mock') return mockClassifyInventoryItem(item, payload);
    return services.classifyInventoryItem(payload);
  };

  const openInventoryClassification = (item) => {
    openModal(`Classify ${item.id}`, classificationFormHtml(item), (modal) => {
      const form = modal.querySelector('#inventoryClassificationForm');
      const sync = () => {
        const reusable = form.elements.inventoryKind.value === 'REUSABLE';
        const lendable = form.elements.isLendable.checked;
        form.elements.conditionReviewState.disabled = !reusable;
        form.elements.maintenanceReviewState.disabled = !reusable;
        form.elements.assetInstanceCountIfReusable.disabled = !reusable;
        form.elements.assetTags.disabled = !reusable;
        form.elements.assetTrackingConfirmed.disabled = !reusable;
        form.elements.lendingAudience.disabled = !lendable;
        form.elements.enableLendingConfirmed.disabled = !lendable;
        if (!lendable) form.elements.lendingAudience.value = 'NOT_AVAILABLE_FOR_LENDING';
      };
      form.elements.inventoryKind.addEventListener('change', sync);
      form.elements.isLendable.addEventListener('change', sync);
      sync();
      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        if (!form.reportValidity()) return;
        const button = form.querySelector('[type="submit"]');
        button.disabled = true;
        const draft = Object.fromEntries(new FormData(form));
        draft.isLendable = form.elements.isLendable.checked;
        draft.enableLendingConfirmed = form.elements.enableLendingConfirmed.checked;
        draft.assetTrackingConfirmed = form.elements.assetTrackingConfirmed.checked;
        try {
          const result = await submitInventoryClassification(item, draft);
          markFormClean(form);
          closeModal();
          await commit(`${item.id} classification recorded.`, 'success', result);
          await loadInventoryClassificationDirectory({ force: true });
        } catch (error) {
          toast(`${error.message}${error.correlationId ? ` · ${error.correlationId}` : ''}`, true);
          button.disabled = false;
        }
      });
    });
  };

  const openBulkInventoryClassification = (items) => {
    openModal(
      `Bulk classify ${items.length} items`,
      `<form id="bulkInventoryClassificationForm"><div class="mode-note"><strong>Safe bulk path: non-lendable only.</strong><br>Use this only after physically verifying that every selected item is genuinely similar. Existing stock area, storage location, unit, reorder threshold, and asset records are preserved.</div><div class="form-grid section-gap"><label>Inventory kind<select name="inventoryKind"><option value="CONSUMABLE">Consumable</option><option value="REUSABLE">Reusable</option></select></label><label>Condition review<select name="conditionReviewState"><option value="NOT_APPLICABLE">Not applicable</option><option value="NEW">New</option><option value="GOOD">Good</option><option value="FAIR">Fair</option><option value="POOR">Poor / quarantine</option><option value="DAMAGED">Damaged</option></select></label><label>Maintenance review<select name="maintenanceReviewState"><option value="NOT_APPLICABLE">Not applicable</option><option value="CLEARED">Cleared</option><option value="MAINTENANCE_REQUIRED">Maintenance required</option></select></label><label class="span-2">Classification notes<textarea name="classificationNotes" maxlength="1000" required></textarea></label><label class="checkbox span-2"><input name="similarityConfirmed" type="checkbox" value="true" required> I physically reviewed the selected items, confirm they are genuinely similar, and understand this action cannot enable lending.</label></div><button class="primary" type="submit">Classify Selected as Non-lendable</button></form>`,
      (modal) => {
        const form = modal.querySelector('#bulkInventoryClassificationForm');
        const sync = () => {
          const reusable = form.elements.inventoryKind.value === 'REUSABLE';
          form.elements.conditionReviewState.disabled = !reusable;
          form.elements.maintenanceReviewState.disabled = !reusable;
          if (!reusable) {
            form.elements.conditionReviewState.value = 'NOT_APPLICABLE';
            form.elements.maintenanceReviewState.value = 'NOT_APPLICABLE';
          }
        };
        form.elements.inventoryKind.addEventListener('change', sync);
        sync();
        form.addEventListener('submit', async (event) => {
          event.preventDefault();
          if (!form.reportValidity()) return;
          const button = form.querySelector('[type="submit"]');
          button.disabled = true;
          const draft = Object.fromEntries(new FormData(form));
          const bulkGroupId = `BULK-${crypto.randomUUID()}`;
          try {
            let lastResult = null;
            for (const item of items) {
              lastResult = await submitInventoryClassification(
                item,
                {
                  ...draft,
                  classificationStatus: 'CLASSIFIED',
                  isLendable: false,
                  lendingAudience: 'NOT_AVAILABLE_FOR_LENDING',
                  assetInstanceCountIfReusable: item.assetInstanceCount ?? 0,
                },
                { bulkGroupId },
              );
            }
            markFormClean(form);
            closeModal();
            await commit(`${items.length} non-lendable classifications recorded.`, 'success', lastResult);
            await loadInventoryClassificationDirectory({ force: true });
          } catch (error) {
            toast(`${error.message}${error.correlationId ? ` · ${error.correlationId}` : ''}`, true);
            button.disabled = false;
          }
        });
      },
    );
  };

  function renderInventoryClassificationQueue() {
    const root = document.querySelector('[data-inventory-classification-queue]');
    if (!root || !inventoryClassificationAllowed()) return;
    const directory = inventoryClassificationDirectory;
    if (!directory) {
      root.innerHTML = '<div class="loading">Loading classification queue…</div>';
      return;
    }
    const totalPages = Math.max(1, Math.ceil(directory.total / directory.pageSize));
    root.innerHTML = `<div class="panel-head"><div><p class="eyebrow">Protected physical review</p><h2>Needs Classification</h2><p>Pending items remain non-lendable. Opening stock stays in the immutable ledger; physical-count corrections use adjustment movements.</p></div><span class="pill">${esc(directory.progress.classified)} / ${esc(directory.progress.total)} classified</span></div><div class="toolbar"><input data-classification-search value="${esc(inventoryClassificationSearch)}" placeholder="Search item, ID, category, or stock area" aria-label="Search classification queue"><select data-classification-status><option value="NEEDS_CLASSIFICATION">Needs classification</option><option value="CLASSIFIED">Classified</option><option value="ALL">All review states</option></select><select data-classification-kind><option value="ALL">All kinds</option><option value="UNVERIFIED">Unverified</option><option value="REUSABLE">Reusable</option><option value="CONSUMABLE">Consumable</option></select><button class="secondary" type="button" data-classification-refresh>Refresh</button><button class="secondary" type="button" data-classification-bulk disabled>Bulk classify selected</button></div><div class="mode-note"><strong>${esc(directory.progress.pending)} pending</strong> · ${esc(directory.progress.classified)} complete · ${esc(directory.progress.total)} governed active items</div><div class="line-list section-gap">${
      directory.items
        .map(
          (item) =>
            `<label class="request-line classification-row"><input type="checkbox" data-classification-select value="${esc(item.id)}"><div><strong>${esc(item.id)} · ${esc(item.name)}</strong><small>${esc(item.category)} · ${esc(item.stockArea)} · ${esc(item.unit)}</small><small>${esc(item.inventoryKind)} · ${esc(item.conditionReviewState)} · ${esc(item.maintenanceReviewState)} · ${item.isLendable ? 'Lending enabled' : 'Non-lendable'}</small></div><span><span class="pill">${esc(item.classificationStatus.replaceAll('_', ' '))}</span><button class="secondary mini" type="button" data-classification-review="${esc(item.id)}">Review</button></span></label>`,
        )
        .join('') || '<div class="empty">No items match this classification view.</div>'
    }</div><div class="button-row section-gap"><button class="secondary" type="button" data-classification-page="${directory.page - 1}" ${directory.page <= 1 ? 'disabled' : ''}>Previous</button><span class="pill">Page ${directory.page} of ${totalPages}</span><button class="secondary" type="button" data-classification-page="${directory.page + 1}" ${directory.page >= totalPages ? 'disabled' : ''}>Next</button></div>`;
    root.querySelector('[data-classification-status]').value = inventoryClassificationStatus;
    root.querySelector('[data-classification-kind]').value = inventoryClassificationKind;
    const selected = () =>
      [...root.querySelectorAll('[data-classification-select]:checked')]
        .map((input) => directory.items.find((item) => item.id === input.value))
        .filter(Boolean);
    const bulk = root.querySelector('[data-classification-bulk]');
    root.querySelectorAll('[data-classification-select]').forEach((input) =>
      input.addEventListener('change', () => {
        bulk.disabled = selected().length < 2;
      }),
    );
    bulk.addEventListener('click', () => openBulkInventoryClassification(selected()));
    root.querySelectorAll('[data-classification-review]').forEach((button) =>
      button.addEventListener('click', (event) => {
        event.preventDefault();
        const item = directory.items.find((entry) => entry.id === button.dataset.classificationReview);
        if (item) openInventoryClassification(item);
      }),
    );
    root.querySelector('[data-classification-search]').addEventListener('input', (event) => {
      clearTimeout(inventoryClassificationSearchTimer);
      inventoryClassificationSearchTimer = setTimeout(() => {
        inventoryClassificationSearch = event.target.value.trim();
        inventoryClassificationPage = 1;
        void loadInventoryClassificationDirectory({ force: true });
      }, 220);
    });
    root.querySelector('[data-classification-status]').addEventListener('change', (event) => {
      inventoryClassificationStatus = event.target.value;
      inventoryClassificationPage = 1;
      void loadInventoryClassificationDirectory({ force: true });
    });
    root.querySelector('[data-classification-kind]').addEventListener('change', (event) => {
      inventoryClassificationKind = event.target.value;
      inventoryClassificationPage = 1;
      void loadInventoryClassificationDirectory({ force: true });
    });
    root
      .querySelector('[data-classification-refresh]')
      .addEventListener('click', () => loadInventoryClassificationDirectory({ force: true }));
    root.querySelectorAll('[data-classification-page]').forEach((button) =>
      button.addEventListener('click', () => {
        inventoryClassificationPage = Number(button.dataset.classificationPage);
        void loadInventoryClassificationDirectory({ force: true });
      }),
    );
  }

  const installInventoryClassificationQueue = () => {
    const host = document.querySelector('#inventory');
    if (!host || !inventoryClassificationAllowed()) return;
    let queue = host.querySelector('[data-inventory-classification-queue]');
    if (!queue) {
      queue = document.createElement('article');
      queue.className = 'panel section-gap inventory-classification-queue';
      queue.dataset.inventoryClassificationQueue = '';
      host.append(queue);
    }
    renderInventoryClassificationQueue();
    if (!inventoryClassificationDirectory && !inventoryClassificationPromise) {
      void loadInventoryClassificationDirectory();
    }
  };

  const openMaterialsDestination = (destination) => {
    if (!materialsDestinationAllowed(destination)) return;
    const openView = (view) => document.querySelector(`#primaryNav [data-view="${view}"]`)?.click();
    if (destination === 'materials-queue') {
      openView('request');
      materialsQueue?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      materialsQueue?.focus({ preventScroll: true });
      return;
    }
    if (destination === 'materials-release') return openView('release');
    openView('procurement');
    if (['materials-canvassing', 'materials-suppliers', 'materials-price-history'].includes(destination)) {
      document.querySelector('[data-proc-tab="canvass"]')?.click();
      const target =
        destination === 'materials-canvassing'
          ? document.querySelector('#proc-canvass')
          : document.querySelector('#canvassLibrary');
      target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    if (destination === 'materials-receiving') {
      document.querySelector('[data-proc-tab="receiving"]')?.click();
      document.querySelector('#proc-receiving')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    document.querySelector('[data-proc-tab="deliverables"]')?.click();
  };

  const installInventoryWorkspaceSupplement = () => {
    const host = document.querySelector('#inventory');
    if (!host || host.querySelector('[data-inventory-workspace-supplement]')) return;
    const supplement = document.createElement('article');
    supplement.className = 'panel section-gap inventory-workspace-supplement';
    supplement.dataset.inventoryWorkspaceSupplement = '';
    supplement.tabIndex = -1;
    supplement.hidden = true;
    host.append(supplement);
  };

  const renderInventoryWorkspaceSupplement = () => {
    installInventoryWorkspaceSupplement();
    const root = document.querySelector('[data-inventory-workspace-supplement]');
    if (!root) return;
    root.hidden = !inventoryWorkspaceSurface;
    if (!inventoryWorkspaceSurface) return;
    const state = getState() ?? {};
    if (inventoryWorkspaceSurface === 'movement') {
      const itemMovements = (state.ledgerTransactions ?? []).map((movement) => ({
        id: movement.id,
        type: movement.type ?? movement.transactionType ?? 'MOVEMENT',
        subject: movement.itemId ?? movement.eventItemId ?? 'No item ID',
        quantity:
          `${String(movement.direction).toUpperCase() === 'IN' ? '+' : String(movement.direction).toUpperCase() === 'OUT' ? '−' : ''}${Number(movement.quantity ?? 0)} ${movement.unit ?? ''}`.trim(),
        related: movement.relatedId ?? movement.relatedEntityId ?? movement.requestId ?? '',
        at: movement.createdAt ?? movement.timestamp ?? '',
      }));
      const assetMovements = (state.assetMovementHistory ?? []).map((movement) => ({
        id: movement.id,
        type: movement.movementType ?? movement.movement_type ?? 'ASSET_MOVEMENT',
        subject: movement.assetId ?? movement.asset_id ?? 'No asset ID',
        quantity:
          movement.conditionLabel ??
          movement.condition_label ??
          movement.newStatus ??
          movement.new_status ??
          '',
        related: movement.lendingTicketId ?? movement.lending_ticket_id ?? '',
        at: movement.occurredAt ?? movement.occurred_at ?? '',
      }));
      const rows = [...itemMovements, ...assetMovements]
        .sort((left, right) => new Date(right.at || 0) - new Date(left.at || 0))
        .slice(0, 100);
      root.innerHTML = `<div class="panel-head"><div><p class="eyebrow">Append-only traceability</p><h2>Movement History</h2><p>Posted item and reusable-asset movements remain stable. Corrections are new governed movements, never silent edits.</p></div><span class="pill">${rows.length} movement${rows.length === 1 ? '' : 's'}</span></div><div class="line-list">${
        rows
          .map(
            (row) =>
              `<div class="request-line inventory-movement-line"><div><strong>${esc(row.type)} &middot; ${esc(row.subject)}</strong><small>${esc(row.id)}${row.related ? ` &middot; Related ${esc(row.related)}` : ''}</small><small>${esc(row.at || 'Time not reported')}</small></div><span class="pill">${esc(row.quantity || 'Recorded')}</span></div>`,
          )
          .join('') || '<div class="empty">No movement rows are in the current authorized projection.</div>'
      }</div>`;
      return;
    }
    const stock = inventoryStockAlerts(state);
    const condition = inventoryConditionAlerts(state);
    const alertRows = [
      ...stock.map((item) => {
        const balance = inventoryBalance(state, item);
        return `<div class="request-line"><div><strong>${esc(item.id)} &middot; ${esc(item.name)}</strong><small>On hand ${esc(balance.onHand)} &middot; Reserved ${esc(balance.reserved)} &middot; ATP ${esc(balance.availableToPromise)} ${esc(item.unit ?? '')}</small></div><span class="pill">${esc(inventoryHealth(state, item).replaceAll('_', ' '))}</span></div>`;
      }),
      ...condition.itemSignals.map(
        (item) =>
          `<div class="request-line"><div><strong>${esc(item.id)} &middot; ${esc(item.name)}</strong><small>${esc(Number(item.damaged ?? 0))} damaged &middot; ${esc(Number(item.maintenance ?? 0))} maintenance</small></div><span class="pill">CONDITION</span></div>`,
      ),
      ...condition.assetSignals.map(
        (asset) =>
          `<div class="request-line"><div><strong>${esc(asset.assetTag ?? asset.asset_tag ?? asset.id)}</strong><small>${esc(asset.id)} &middot; ${esc(asset.conditionLabel ?? asset.condition_label ?? 'Condition not reported')}</small></div><span class="pill">${esc(asset.lifecycleStatus ?? asset.lifecycle_status ?? 'ATTENTION')}</span></div>`,
      ),
    ].join('');
    root.innerHTML = `<div class="panel-head"><div><p class="eyebrow">Exception-first stock control</p><h2>Condition &amp; Stock Alerts</h2><p>Low, unavailable, verification-required, damaged, and maintenance signals are derived from current server-projected truth.</p></div><span class="pill">${stock.length + condition.itemSignals.length + condition.assetSignals.length} alert${stock.length + condition.itemSignals.length + condition.assetSignals.length === 1 ? '' : 's'}</span></div><div class="line-list">${alertRows || '<div class="empty">No condition or stock alerts are in the current authorized projection.</div>'}</div>`;
  };

  const openInventoryDestination = (destination) => {
    if (!inventoryDestinationAllowed(destination)) return;
    const openView = (view) => document.querySelector(`#primaryNav [data-view="${view}"]`)?.click();
    if (destination === 'inventory-management' || destination === 'inventory-pantry-stock') {
      inventoryWorkspaceSurface = '';
      openView('inventory');
      const area = document.querySelector('#inventoryAreaFilter');
      if (area) {
        area.value = destination === 'inventory-pantry-stock' ? 'Pantry' : 'ALL';
        area.dispatchEvent(new Event('input', { bubbles: true }));
      }
      return;
    }
    if (destination === 'inventory-restocking' || destination === 'inventory-receiving') {
      openView('restocking');
      if (destination === 'inventory-receiving')
        document.querySelector('#restockReceiveForm')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }
    if (destination === 'inventory-lending') {
      openView('lending');
      document.querySelector('[data-loan-tab="FOR_REVIEW"]')?.click();
      return;
    }
    if (destination === 'inventory-release') return openView('release');
    if (['inventory-movement-history', 'inventory-alerts'].includes(destination)) {
      inventoryWorkspaceSurface = destination === 'inventory-movement-history' ? 'movement' : 'alerts';
      openView('inventory');
      renderInventoryWorkspaceSupplement();
      const supplement = document.querySelector('[data-inventory-workspace-supplement]');
      supplement?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      supplement?.focus({ preventScroll: true });
    }
  };

  const installRoleExperience = () => {
    if (isRequestOnly() || document.querySelector('#roleExperiencePanel')) return;
    const overviewHero = document.querySelector('#overview > .hero');
    if (!overviewHero) return;
    const panel = document.createElement('section');
    panel.id = 'roleExperiencePanel';
    panel.className = 'role-experience panel section-gap';
    panel.hidden = true;
    panel.setAttribute('aria-live', 'polite');
    panel.addEventListener('click', (event) => {
      const destination = event.target.closest('[data-admin-destination]')?.dataset.adminDestination;
      if (destination) openAdminDestination(destination);
      const directorDestination = event.target.closest('[data-director-destination]')?.dataset
        .directorDestination;
      if (directorDestination) openDirectorDestination(directorDestination);
      const foodDestination = event.target.closest('[data-food-destination]')?.dataset.foodDestination;
      if (foodDestination) openFoodDestination(foodDestination);
      const foodManage = event.target.closest('[data-food-manage]')?.dataset.foodManage;
      if (foodManage) openFoodWorkflow(foodManage);
      const inventoryDestination = event.target.closest('[data-inventory-destination]')?.dataset
        .inventoryDestination;
      if (inventoryDestination) openInventoryDestination(inventoryDestination);
      const materialsDestination = event.target.closest('[data-materials-destination]')?.dataset
        .materialsDestination;
      if (materialsDestination) openMaterialsDestination(materialsDestination);
      const eventAction = event.target.closest('[data-event-action]');
      if (eventAction) openEventEditor(eventAction.dataset.eventAction, eventAction.dataset.eventId);
    });
    overviewHero.before(panel);
    if (!roleExperienceObserver) {
      roleExperienceObserver = new MutationObserver(() => {
        renderRoleExperience();
        renderInternalShell();
      });
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
    const authorization = state.currentUser?.authorization ?? {};
    const destinationAttribute = (destination) =>
      experience === 'administrator'
        ? `data-admin-destination="${esc(destination)}"`
        : experience === 'director'
          ? `data-director-destination="${esc(destination)}"`
          : experience === 'food'
            ? `data-food-destination="${esc(destination)}"`
            : experience === 'inventory-pantry'
              ? `data-inventory-destination="${esc(destination)}"`
              : `data-materials-destination="${esc(destination)}"`;
    const destinationEnabled = (destination) =>
      destination === 'event-management'
        ? eventManagementAllowed()
        : experience === 'food'
          ? foodDestinationAllowed(destination)
          : experience === 'inventory-pantry'
            ? inventoryDestinationAllowed(destination)
            : experience === 'materials'
              ? materialsDestinationAllowed(destination)
              : true;
    const destinationAttributes = (destination) =>
      `${destinationAttribute(destination)}${destinationEnabled(destination) ? '' : ' disabled aria-disabled="true" title="Not available in the current server capability projection"'}`;
    const hasSystemAdministration = (authorization.capabilities ?? []).includes('system.admin');
    const directorAdministrationBoundary = hasSystemAdministration
      ? '<strong>Administration stays in its own workspace</strong><small>Your server-authorized System Owner access is preserved, but the Director workspace does not expose the Administrator control center.</small>'
      : '<strong>No system administration</strong><small>Account, configuration, provider, and environment controls remain unavailable unless separately granted by the server.</small>';
    const directorManagement =
      experience === 'director'
        ? `<div class="director-management-projection" data-director-management-access tabindex="-1"><dl><div><dt>Role</dt><dd>${esc(authorization.roleLabel ?? authorization.roleId ?? 'Director')}</dd></div><div><dt>Operational scope</dt><dd>${esc(currentScopeLabel())}</dd></div><div><dt>Committee access</dt><dd>${esc((authorization.committees ?? []).map((entry) => entry.name).join(', ') || 'Server-authorized global summary')}</dd></div><div><dt>Capabilities</dt><dd>${esc((authorization.capabilities ?? []).length)} server-projected</dd></div></dl>${directorAdministrationBoundary}</div>`
        : '';
    const foodRows = experience === 'food' ? activeFoodRows(state) : [];
    const foodOverview =
      experience === 'food'
        ? `<section class="food-overview-detail" data-food-overview aria-labelledby="foodReadinessTitle"><div class="panel-head"><div><p class="eyebrow">Deadline-first operating picture</p><h3 id="foodReadinessTitle">Event food readiness</h3><p>Grouped by governed event and sub-event context. Headcount and servings remain distinct; dietary and allergen information stays aggregate-only.</p></div><span class="pill">${foodRows.length} active line${foodRows.length === 1 ? '' : 's'}</span></div>${foodQueueGroupsMarkup(foodRows, { allowManage: foodDestinationAllowed('food-work-queue') })}</section>`
        : '';
    const foodWorkflowReference =
      experience === 'food'
        ? `<section class="food-workflow-reference panel" data-food-workflow-reference tabindex="-1" aria-labelledby="foodWorkflowReferenceTitle" hidden><div class="panel-head"><div><p class="eyebrow">Governed operating rules</p><h3 id="foodWorkflowReferenceTitle">Food Workflow Reference</h3><p>Live status remains in the owning workflow; this reference never grants an action.</p></div><span class="pill">Asia/Manila</span></div><div class="food-reference-grid"><article><strong>10 business days</strong><span>Bulk, non-perishable, or catering</span><small>Allow time for review, canvassing, budget, supplier confirmation, and ordering.</small></article><article><strong>5 business days</strong><span>Perishable food</span><small>Short or unknown lead time is an attention signal, not an approval.</small></article><article><strong>Historical prices are reference only</strong><span>Current evidence governs</span><small>Compare normalized units, freshness, receipts, lead time, terms, and supplier reliability.</small></article><article><strong>Aggregate dietary and allergen counts only</strong><span>Privacy boundary</span><small>Never store names, diagnoses, medical narratives, contacts, TINs, or payment details.</small></article><article><strong>Receiving is cumulative</strong><span>Physical intake and evidence</span><small>Record quantity, condition, handling or expiry context, supplier provenance, and receipt evidence.</small></article><article><strong>Shared Release Desk</strong><span>Controlled distribution</span><small>Authorized handoff remains recipient-confirmed, audited, and server-validated.</small></article></div></section>`
        : '';
    const inventoryItems = experience === 'inventory-pantry' ? inventoryActiveItems(state) : [];
    const inventoryAlerts = experience === 'inventory-pantry' ? inventoryStockAlerts(state) : [];
    const inventoryOverview =
      experience === 'inventory-pantry'
        ? `<section class="inventory-overview-detail" data-inventory-overview aria-labelledby="inventoryAttentionTitle"><div class="panel-head"><div><p class="eyebrow">Exception-first stock truth</p><h3 id="inventoryAttentionTitle">Inventory attention</h3><p>On-hand, reserved, and available-to-promise remain visibly distinct. Low, unavailable, and verification-required items lead this view.</p></div><span class="pill">${inventoryItems.length} active item${inventoryItems.length === 1 ? '' : 's'}</span></div><div class="line-list">${
            inventoryAlerts
              .slice(0, 12)
              .map((item) => {
                const balance = inventoryBalance(state, item);
                return `<div class="request-line inventory-attention-line"><div><strong>${esc(item.id)} &middot; ${esc(item.name)}</strong><small>${esc(item.catalogType === 'PANTRY' || item.stockArea === 'Pantry' ? 'Pantry' : 'Office Inventory')} &middot; ${esc(item.handling ?? item.handlingCode ?? 'Handling not reported')}</small><small>On hand ${esc(balance.onHand)} &middot; Reserved ${esc(balance.reserved)} &middot; ATP ${esc(balance.availableToPromise)} ${esc(item.unit ?? '')}</small></div><span class="pill">${esc(inventoryHealth(state, item).replaceAll('_', ' '))}</span></div>`;
              })
              .join('') ||
            '<div class="empty">No stock exceptions are in the current authorized projection.</div>'
          }</div></section>`
        : '';
    const materialsRows = experience === 'materials' ? (materialsQueueItems ?? []) : [];
    const materialsQueueLoading = experience === 'materials' && materialsQueueItems === null;
    const materialsOverview =
      experience === 'materials'
        ? `<section class="materials-overview-detail" data-materials-overview aria-labelledby="materialsPipelineTitle"><div class="panel-head"><div><p class="eyebrow">Request → Canvass → Budget → Procurement → Receiving → Deliverables → Release → Complete</p><h3 id="materialsPipelineTitle">Traceable materials pipeline</h3><p>Stable request, event, and deliverable identities keep exact specifications and cumulative quantities connected. Historical prices inform review but never replace current quote evidence.</p></div><span class="pill">${materialsQueueLoading ? 'Loading canonical queue…' : `${materialsRows.length} scoped deliverable${materialsRows.length === 1 ? '' : 's'}`}</span></div>${materialsQueueLoading ? '<div class="empty">Loading the current authorized Materials scope…</div>' : materialsQueueGroupsMarkup(materialsRows, { allowOpen: materialsDestinationAllowed('materials-deliverables') })}</section>`
        : '';
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
      ${metrics.map(([label, value, note, destination]) => (destination ? `<button type="button" ${destinationAttributes(destination)}><span>${esc(label)}</span><strong>${esc(value)}</strong><small>${esc(note)}</small></button>` : `<article><span>${esc(label)}</span><strong>${esc(value)}</strong><small>${esc(note)}</small></article>`)).join('')}
    </div>
    <div class="role-experience-layout">
      <section aria-labelledby="roleExperienceActionsTitle">
        <div class="section-kicker" id="roleExperienceActionsTitle">${experience === 'food' ? 'Food operations' : experience === 'inventory-pantry' ? 'Inventory operations' : experience === 'materials' ? 'Materials operations' : 'Leadership action map'}</div>
        <div class="role-experience-actions">
          ${definition.actions.map(([view, title, detail, destination]) => `<button type="button" ${destination ? destinationAttributes(destination) : `data-go="${esc(view)}"`}><span>${esc(title)}</span><small>${esc(detail)}</small><b aria-hidden="true">&rarr;</b></button>`).join('')}
        </div>
      </section>
      <aside class="role-experience-boundary" aria-label="${esc(definition.boundaryTitle)}">
        <span>Authority boundary</span>
        <h3>${esc(definition.boundaryTitle)}</h3>
        <p>${esc(definition.boundary)}</p>
        ${directorManagement}
      </aside>
    </div>
    ${foodOverview}
    ${foodWorkflowReference}
    ${inventoryOverview}
    ${materialsOverview}
    ${['administrator', 'director'].includes(experience) ? '<section class="event-management panel" data-event-management tabindex="-1" aria-label="Event Management" hidden></section>' : ''}
    ${experience === 'director' ? '<section class="director-detail panel" data-director-detail tabindex="-1" aria-labelledby="directorDetailTitle" hidden></section>' : ''}`;
    if (
      eventManagementOpen &&
      ['administrator', 'director'].includes(experience) &&
      eventManagementAllowed()
    ) {
      const root = panel.querySelector('[data-event-management]');
      if (root) root.hidden = false;
      renderEventManagement();
    }
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
    installLendingUsage();
    installRoleExperience();
    installInventoryWorkspaceSupplement();
    renderRoleExperience();
    installInternalShell();
    installSharedMobileNav();
    installReleaseConfirmation();
    installCanvassQuality();
    installDeliverableReceiving();
    installLendingUsage();
    if (!isRequestOnly()) {
      lending = createLendingController({ markFormClean });
      installLendingApproval();
    }
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
      document.addEventListener(
        eventName,
        () => {
          lastActiveAt = Date.now();
        },
        { passive: true },
      );
    });
    afterRender();
  };

  const afterRender = () => {
    syncSharedMobileNav();
    renderRoleExperience();
    installInternalShell();
    renderInternalShell();
    applyProductionShellCopy();
    lending?.setItems(getState()?.inventoryItems ?? []);
    document.querySelectorAll('#lendingTickets .ticket p').forEach((row) => {
      row.childNodes.forEach((node) => {
        if (node.nodeType === Node.TEXT_NODE)
          node.textContent = node.textContent.replaceAll('Angelite/Non-USC', 'Angelite/Student');
      });
    });
    const catalogButton = document.querySelector('#adminCatalogException');
    if (catalogButton) {
      const allowed = canManageCatalog(getState()?.currentUser);
      catalogButton.hidden = !allowed;
      catalogButton.disabled = !allowed;
      catalogButton.setAttribute('aria-hidden', String(!allowed));
    }
    renderFoodQueue();
    renderMaterialsQueue();
    if (normalizedExperience() === 'materials' && materialsQueueItems === null) void refreshMaterialsQueue();
    renderVenueEquipmentQueue();
    installInventoryClassificationQueue();
    renderInventoryWorkspaceSupplement();
    installReleaseConfirmation();
    installCanvassQuality();
    installDeliverableReceiving();
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
        ? normalizeScopedRevisionPayload(
            {
              contract: 'scoped-revision',
              contractVersion: 1,
              enabled: true,
              scope,
              token,
              globalRevision: result.dataRevision,
              updatedAt: result.dataRevisionUpdatedAt,
              environment: getState()?.environment,
              metrics: {},
            },
            scope,
          )
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
      const user = getState()?.currentUser;
      const allowed = canManageCatalog(user);
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
          : `${can(user, 'request.create') ? `<button class="ghost mini" data-inventory-action="restock" data-item-id="${esc(item.id)}">Restock</button>` : ''}${can(user, 'fulfillment.reserve') ? `<button class="ghost mini" data-inventory-action="context" data-item-id="${esc(item.id)}">Reserve / Release</button>` : ''}${allowed ? `<button class="ghost mini" data-inventory-action="transfer" data-item-id="${esc(item.id)}">Transfer</button>` : ''}`;
      const history = can(user, 'view.inventory')
        ? `<button class="secondary mini" data-inventory-action="history" data-item-id="${esc(item.id)}">Ledger</button>`
        : '';
      return `${catalog}${history}${operational}${lifecycle}`;
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
