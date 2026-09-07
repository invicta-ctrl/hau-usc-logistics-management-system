import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent } from 'react';
import { AlertTriangle, ArrowLeft, ChevronLeft, ChevronRight, RefreshCw, Search } from 'lucide-react';
import type {
  FrontendInventoryBootstrap,
  FrontendInventoryClassificationItem,
  InventoryBootstrapFilter,
} from '../../integration/backend';
import { FrontendApiError, frontendBackend } from '../../integration/backend';
import type { Route } from '../appTypes';
import { ap } from '../theme/palette';
import { inventoryItemsFromBootstrap } from './inventoryData';
import { INV_FIXTURE } from './inventoryFixtures';
import { InventoryInspector } from './InventoryInspector';
import { InventoryQtyCell } from './InventoryQtyCell';
import { InventoryStateBadge } from './InventoryStateBadge';
import type { InvItem } from './inventoryTypes';

type InventoryLoadState = 'loading' | 'ready' | 'refreshing' | 'error' | 'denied' | 'stale';
type PreviewState = 'default' | 'error' | 'stale' | 'permission';

const PAGE_SIZE = 25;
const FILTERS: Array<{ value: InventoryBootstrapFilter; label: string }> = [
  { value: 'ALL', label: 'All records' },
  { value: 'BELOW', label: 'Below threshold' },
  { value: 'OUT', label: 'Out of stock' },
  { value: 'UNCONFIRMED', label: 'Unconfirmed' },
];

/** A late response must never replace a newer search, filter, or page intent. */
function isCurrentInventoryProjection(capturedIntent: number, currentIntent: number) {
  return capturedIntent === currentIntent;
}

/** Only a load started after a failed command refresh can re-enable bulk submission. */
function canResolveBulkReloadGate(capturedGeneration: number, currentGeneration: number) {
  return capturedGeneration === currentGeneration;
}

function persistedBulkRefreshFailure(bulkGroupId: string) {
  return {
    loadState: 'stale' as const,
    reloadRequired: true,
    notice: `Classification group ${bulkGroupId} was recorded, but the inventory projection could not refresh. Reload this workspace before another classification.`,
  };
}

function formatRevisionTime(value: string) {
  if (!value) return 'Time not reported';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? 'Time not reported'
    : new Intl.DateTimeFormat('en-PH', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(parsed);
}

function previewRows(items: InvItem[], query: string, filter: InventoryBootstrapFilter) {
  const normalizedQuery = query.trim().toLowerCase();
  return items.filter((item) => {
    const matchesQuery =
      !normalizedQuery ||
      item.name.toLowerCase().includes(normalizedQuery) ||
      item.id.toLowerCase().includes(normalizedQuery) ||
      item.category.toLowerCase().includes(normalizedQuery);
    const matchesFilter =
      filter === 'ALL' ||
      (filter === 'BELOW' && item.belowThreshold) ||
      (filter === 'OUT' && item.outOfStock) ||
      (filter === 'UNCONFIRMED' && item.unconfirmed);
    return matchesQuery && matchesFilter;
  });
}

export function InventoryRoute({
  dark,
  navigate,
  availableRoutes = [],
  canClassify = false,
  inspection = false,
}: {
  dark: boolean;
  navigate: (route: Route) => void;
  availableRoutes?: Route[];
  canClassify?: boolean;
  /** A4-only fixture mode. It never asks the protected bootstrap endpoint for data. */
  inspection?: boolean;
}) {
  const c = ap(dark);
  const [loadState, setLoadState] = useState<InventoryLoadState>(inspection ? 'ready' : 'loading');
  const [items, setItems] = useState<InvItem[]>(inspection ? INV_FIXTURE : []);
  const [pagination, setPagination] = useState({ page: 1, pageSize: PAGE_SIZE, total: 0, hasMore: false });
  const [revision, setRevision] = useState<{ token: string; updatedAt: string } | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [searchInput, setSearchInput] = useState('');
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<InventoryBootstrapFilter>('ALL');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<InvItem | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [previewState, setPreviewState] = useState<PreviewState>('default');
  const [errorMessage, setErrorMessage] = useState('');
  const [bulkItemIds, setBulkItemIds] = useState('');
  const [bulkKind, setBulkKind] = useState<'CONSUMABLE'>('CONSUMABLE');
  const [bulkStatus, setBulkStatus] = useState<'CLASSIFIED'>('CLASSIFIED');
  const [bulkCondition, setBulkCondition] = useState<'NOT_APPLICABLE'>('NOT_APPLICABLE');
  const [bulkMaintenance, setBulkMaintenance] = useState<'NOT_APPLICABLE'>('NOT_APPLICABLE');
  const [bulkLendingAudience, setBulkLendingAudience] = useState<'NOT_AVAILABLE_FOR_LENDING'>(
    'NOT_AVAILABLE_FOR_LENDING',
  );
  const [bulkNotes, setBulkNotes] = useState('');
  const [bulkReason, setBulkReason] = useState('');
  const [bulkSimilarityConfirmed, setBulkSimilarityConfirmed] = useState(false);
  const [bulkSubmitting, setBulkSubmitting] = useState(false);
  const [bulkNotice, setBulkNotice] = useState('');
  const triggerRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const searchRef = useRef<HTMLInputElement>(null);
  const itemsRef = useRef(items);
  const requestKeyRef = useRef('');
  const projectionIntentRef = useRef(0);
  const bulkReloadRequiredRef = useRef(false);
  const bulkReloadGenerationRef = useRef(0);
  const [bulkReloadRequired, setBulkReloadRequired] = useState(false);

  const invalidateProjection = useCallback(() => {
    projectionIntentRef.current += 1;
  }, []);

  const requireBulkReload = useCallback(() => {
    bulkReloadRequiredRef.current = true;
    bulkReloadGenerationRef.current += 1;
    setBulkReloadRequired(true);
  }, []);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  const applyInventoryProjection = useCallback(
    (result: FrontendInventoryBootstrap, requestKey: string) => {
      const nextItems = inventoryItemsFromBootstrap(result);
      requestKeyRef.current = requestKey;
      setItems(nextItems);
      setPagination(result.pagination);
      setRevision(result.scopeRevision);
      setSelected((current) => nextItems.find((item) => item.id === current?.id) ?? null);
    },
    [],
  );

  useEffect(() => {
    if (inspection) {
      setQuery(searchInput.trim());
      return;
    }
    const timeout = window.setTimeout(() => {
      setPage(1);
      setQuery(searchInput.trim());
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [inspection, searchInput]);

  useEffect(() => {
    if (inspection) {
      setItems(INV_FIXTURE);
      setLoadState('ready');
      return;
    }
    const abort = new AbortController();
    const requestKey = `${page}|${filter}|${query}`;
    const capturedIntent = projectionIntentRef.current;
    const capturedReloadGeneration = bulkReloadGenerationRef.current;
    const sameProjection = requestKeyRef.current === requestKey;
    if (!sameProjection) {
      setItems([]);
      setSelected(null);
    }
    setLoadState(sameProjection && itemsRef.current.length > 0 ? 'refreshing' : 'loading');
    setErrorMessage('');
    void frontendBackend
      .inventoryBootstrap({ page, pageSize: PAGE_SIZE, query, filter, signal: abort.signal })
      .then((result) => {
        if (abort.signal.aborted || !isCurrentInventoryProjection(capturedIntent, projectionIntentRef.current)) return;
        applyInventoryProjection(result, requestKey);
        if (
          bulkReloadRequiredRef.current &&
          canResolveBulkReloadGate(capturedReloadGeneration, bulkReloadGenerationRef.current)
        ) {
          bulkReloadRequiredRef.current = false;
          setBulkReloadRequired(false);
        }
        setLoadState('ready');
      })
      .catch((error: unknown) => {
        if (abort.signal.aborted) return;
        if (error instanceof FrontendApiError && [401, 403].includes(error.status)) {
          setLoadState('denied');
          return;
        }
        setErrorMessage(error instanceof Error ? error.message : 'Inventory is temporarily unavailable.');
        setLoadState(sameProjection && itemsRef.current.length > 0 ? 'stale' : 'error');
      });
    return () => abort.abort();
  }, [applyInventoryProjection, filter, inspection, page, query, reloadKey]);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 59.99rem)');
    const sync = () => setIsMobile(media.matches);
    sync();
    media.addEventListener('change', sync);
    return () => media.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    const focusSearch = (event: KeyboardEvent) => {
      const target = event.target;
      const isTyping =
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        (target instanceof HTMLElement && target.isContentEditable);
      if (event.key === '/' && !isTyping) {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    document.addEventListener('keydown', focusSearch);
    return () => document.removeEventListener('keydown', focusSearch);
  }, []);

  const rows = useMemo(
    () => (inspection ? previewRows(items, query, filter) : items),
    [filter, inspection, items, query],
  );
  const visibleState: InventoryLoadState | 'permission' =
    inspection && previewState !== 'default'
      ? previewState === 'permission'
        ? 'permission'
        : previewState
      : loadState;
  const showRecords = ['ready', 'refreshing', 'stale'].includes(visibleState);
  const total = inspection ? rows.length : pagination.total;
  const pageCount = Math.max(1, Math.ceil(total / Math.max(1, pagination.pageSize)));
  const authorizedEmpty =
    showRecords && total === 0 && !searchInput.trim() && filter === 'ALL' && visibleState !== 'refreshing';
  const filteredEmpty =
    showRecords &&
    total === 0 &&
    (Boolean(searchInput.trim()) || filter !== 'ALL') &&
    visibleState !== 'refreshing';

  const handleSelect = useCallback((item: InvItem) => setSelected(item), []);
  const handleClose = useCallback(() => {
    setSelected((current) => {
      const id = current?.id;
      window.requestAnimationFrame(() => {
        if (id) triggerRefs.current[id]?.focus();
      });
      return null;
    });
  }, []);

  function updateFilter(next: InventoryBootstrapFilter) {
    invalidateProjection();
    setFilter(next);
    setPage(1);
  }

  function clearFilters() {
    invalidateProjection();
    setSearchInput('');
    setQuery('');
    setFilter('ALL');
    setPage(1);
    searchRef.current?.focus();
  }

  function retry() {
    if (inspection) {
      setPreviewState('default');
      return;
    }
    setReloadKey((value) => value + 1);
  }

  async function submitBulkClassification(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (bulkSubmitting || bulkReloadRequired) return;
    const itemIds = [...new Set(bulkItemIds.split(/[\n,]+/u).map((item) => item.trim()).filter(Boolean))];
    if (itemIds.length < 2) {
      setBulkNotice('Enter at least two unique inventory item IDs from one physically reviewed similar group.');
      return;
    }
    if (!bulkSimilarityConfirmed) {
      setBulkNotice('Confirm that the selected records share the same verified classification before saving.');
      return;
    }
    if (!bulkNotes.trim() || !bulkReason.trim()) {
      setBulkNotice('Record both the physical review notes and the bulk classification reason before saving.');
      return;
    }

    setBulkSubmitting(true);
    setBulkNotice('');
    const requestKey = `${page}|${filter}|${query}`;
    const capturedIntent = projectionIntentRef.current;
    try {
      const selectedItems = await Promise.all(
        itemIds.map(async (itemId) => {
          const queue = await frontendBackend.inventoryClassifications({
            status: 'NEEDS_CLASSIFICATION',
            page: 1,
            pageSize: 10,
            search: itemId,
          });
          return queue.find((item) => item.id === itemId) ?? null;
        }),
      );
      if (selectedItems.some((item) => !item)) {
        setBulkNotice('One or more requested records are no longer in your current classification queue. Refresh and review them before retrying.');
        return;
      }
      const candidates = selectedItems.filter(
        (item): item is FrontendInventoryClassificationItem => item !== null,
      );
      const receipt = await frontendBackend.bulkClassifyInventoryItems({
        clientRequestId: `inventory-bulk-classify-${crypto.randomUUID()}`,
        reason: bulkReason.trim(),
        similarityConfirmed: true,
        items: candidates.map((item) => ({
          itemId: item.id,
          expectedRevision: item.classificationRevision,
          classificationStatus: bulkStatus,
          inventoryKind: bulkKind,
          stockArea: item.stockArea,
          storageLocation: item.storageLocation,
          unit: item.unit,
          reorderThreshold: item.reorderThreshold,
          conditionReviewState: bulkCondition,
          maintenanceReviewState: bulkMaintenance,
          classificationNotes: bulkNotes.trim(),
          reason: bulkReason.trim(),
          similarityConfirmed: true,
          isLendable: false,
          lendingAudience: bulkLendingAudience,
          enableLendingConfirmed: false,
          assetInstanceCountIfReusable: 0,
          assetTrackingConfirmed: false,
          assetTags: [],
        })),
      });
      setBulkItemIds('');
      setBulkNotes('');
      setBulkReason('');
      setBulkSimilarityConfirmed(false);
      try {
        const refreshed = await frontendBackend.refreshInventoryBootstrap({ page, pageSize: PAGE_SIZE, query, filter });
        if (isCurrentInventoryProjection(capturedIntent, projectionIntentRef.current)) {
          applyInventoryProjection(refreshed, requestKey);
          setLoadState('ready');
          setBulkNotice(`Classification group ${receipt.bulkGroupId} was recorded and the authorized inventory projection was refreshed.`);
        } else {
          requireBulkReload();
          setBulkNotice(`Classification group ${receipt.bulkGroupId} was recorded, but this workspace changed while it was saving. Reload inventory before another classification.`);
        }
      } catch {
        const failure = persistedBulkRefreshFailure(receipt.bulkGroupId);
        requireBulkReload();
        setLoadState(failure.loadState);
        setBulkNotice(failure.notice);
      }
    } catch (error) {
      const safeRefresh = error instanceof FrontendApiError && [403, 409].includes(error.status);
      let refreshedAfterFailure = false;
      if (safeRefresh) {
        try {
          const refreshed = await frontendBackend.refreshInventoryBootstrap({ page, pageSize: PAGE_SIZE, query, filter });
          if (isCurrentInventoryProjection(capturedIntent, projectionIntentRef.current)) {
            applyInventoryProjection(refreshed, requestKey);
            setLoadState('ready');
            refreshedAfterFailure = true;
          } else {
            requireBulkReload();
          }
        } catch {
          requireBulkReload();
          setLoadState('stale');
        }
      }
      setBulkNotice(
        safeRefresh
          ? error.status === 403
            ? `Your classification permission changed. No classification was assumed; ${refreshedAfterFailure ? 'review the refreshed inventory state before retrying.' : 'reload this workspace before retrying.'}`
            : `The classification queue changed during review. No classification was assumed; ${refreshedAfterFailure ? 'review the refreshed inventory state before retrying.' : 'reload this workspace before retrying.'}`
          : error instanceof FrontendApiError
            ? `${error.message} No classification was assumed.`
            : 'The classification could not be recorded. No classification was assumed.',
      );
    } finally {
      setBulkSubmitting(false);
    }
  }

  return (
    <main className="inventory-workspace fbr-f2-inventory layout-container" aria-labelledby="inventory-title">
      <header className="inventory-workspace__header" data-inventory-modal-background>
        <div>
          <p className="inventory-workspace__kicker">Inventory records</p>
          <h1 id="inventory-title">Inventory</h1>
          <p>Search canonical stock truth, then inspect the movements and reservations behind one record.</p>
        </div>
        {inspection ? (
          <label className="inventory-workspace__preview-control" htmlFor="inv-preview-state">
            <span>Inspection state</span>
            <select
              id="inv-preview-state"
              value={previewState}
              onChange={(event) => setPreviewState(event.target.value as PreviewState)}
            >
              <option value="default">Default</option>
              <option value="error">Page error</option>
              <option value="stale">Stale data</option>
              <option value="permission">Permission limited</option>
            </select>
          </label>
        ) : (
          <button
            type="button"
            className="inventory-workspace__refresh"
            onClick={retry}
            disabled={visibleState === 'loading' || visibleState === 'refreshing'}
          >
            <RefreshCw aria-hidden="true" size={16} />
            {visibleState === 'refreshing' ? 'Refreshing…' : 'Refresh inventory'}
          </button>
        )}
      </header>

      {visibleState === 'error' ? (
        <section className="inventory-workspace__state surface-content" role="alert">
          <AlertTriangle aria-hidden="true" size={24} />
          <h2>This page could not be loaded</h2>
          <p>
            {errorMessage ||
              'No data has been changed. Try loading the authorized inventory projection again.'}
          </p>
          <button type="button" onClick={retry}>
            <RefreshCw aria-hidden="true" size={16} />
            Retry
          </button>
        </section>
      ) : null}

      {visibleState === 'denied' || visibleState === 'permission' ? (
        <section className="inventory-workspace__state surface-content">
          <h2>Access limited</h2>
          <p>This view is not available for your current session.</p>
          <button type="button" onClick={() => navigate('overview')}>
            <ArrowLeft aria-hidden="true" size={16} />
            Return to overview
          </button>
        </section>
      ) : null}

      {visibleState === 'loading' ? (
        <section className="inventory-workspace__state surface-content" role="status">
          <span className="inventory-workspace__pulse" aria-hidden="true" />
          <h2>Loading inventory</h2>
          <p>Preparing one bounded page of authorized records and recent context…</p>
        </section>
      ) : null}

      {showRecords ? (
        <>
          {visibleState === 'stale' ? (
            <div className="inventory-workspace__notice" role="status" data-inventory-modal-background>
              <AlertTriangle aria-hidden="true" size={17} />
              <span>Data may be out of date. The last authoritative projection remains visible.</span>
              <button type="button" onClick={retry}>
                Try again
              </button>
            </div>
          ) : null}

          <section
            className="inventory-workspace__controls surface-content"
            aria-label="Inventory search and filters"
            data-inventory-modal-background
          >
            <label className="inventory-workspace__search" htmlFor="inventory-search">
              <span>Search inventory</span>
              <div>
                <Search aria-hidden="true" size={17} />
                <input
                  ref={searchRef}
                  id="inventory-search"
                  type="search"
                  value={searchInput}
                  onChange={(event) => {
                    invalidateProjection();
                    setSearchInput(event.target.value);
                  }}
                  placeholder="Item name, ID, category, or alias"
                  autoComplete="off"
                />
                <kbd aria-hidden="true">/</kbd>
              </div>
            </label>
            <fieldset className="inventory-workspace__filters">
              <legend>Filter inventory</legend>
              <div>
                {FILTERS.map((entry) => (
                  <button
                    key={entry.value}
                    type="button"
                    aria-pressed={filter === entry.value}
                    onClick={() => updateFilter(entry.value)}
                  >
                    {entry.label}
                  </button>
                ))}
              </div>
            </fieldset>
          </section>

          {canClassify && !inspection ? (
            <section
              className="inventory-classification surface-content"
              aria-labelledby="inventory-classification-title"
              data-inventory-modal-background
            >
              <div className="inventory-classification__head">
                <div>
                  <p>Classification queue</p>
                  <h2 id="inventory-classification-title">Inventory classification</h2>
                </div>
                <p>Classify a verified similar group of consumable records. Reusable physical assessment and asset tracking are unavailable in this command.</p>
              </div>
              <form aria-label="Inventory classification" onSubmit={submitBulkClassification}>
                <label className="inventory-classification__wide">
                  <span>Inventory item IDs</span>
                  <textarea
                    value={bulkItemIds}
                    onChange={(event) => setBulkItemIds(event.target.value)}
                    placeholder="One authoritative inventory ID per line"
                    disabled={bulkSubmitting || bulkReloadRequired}
                  />
                </label>
                <label>
                  <span>Inventory kind</span>
                  <select value={bulkKind} onChange={(event) => setBulkKind(event.target.value as 'CONSUMABLE')} disabled={bulkSubmitting || bulkReloadRequired}>
                    <option value="CONSUMABLE">Consumable</option>
                  </select>
                </label>
                <label>
                  <span>Classification status</span>
                  <select value={bulkStatus} onChange={(event) => setBulkStatus(event.target.value as 'CLASSIFIED')} disabled={bulkSubmitting || bulkReloadRequired}>
                    <option value="CLASSIFIED">Classified</option>
                  </select>
                </label>
                <label>
                  <span>Condition review state</span>
                  <select value={bulkCondition} onChange={(event) => setBulkCondition(event.target.value as 'NOT_APPLICABLE')} disabled={bulkSubmitting || bulkReloadRequired}>
                    <option value="NOT_APPLICABLE">Not applicable</option>
                  </select>
                </label>
                <label>
                  <span>Maintenance review state</span>
                  <select value={bulkMaintenance} onChange={(event) => setBulkMaintenance(event.target.value as 'NOT_APPLICABLE')} disabled={bulkSubmitting || bulkReloadRequired}>
                    <option value="NOT_APPLICABLE">Not applicable</option>
                  </select>
                </label>
                <label>
                  <span>Lending audience</span>
                  <select value={bulkLendingAudience} onChange={(event) => setBulkLendingAudience(event.target.value as 'NOT_AVAILABLE_FOR_LENDING')} disabled={bulkSubmitting || bulkReloadRequired}>
                    <option value="NOT_AVAILABLE_FOR_LENDING">Not available for lending</option>
                  </select>
                </label>
                <label className="inventory-classification__wide">
                  <span>Classification notes</span>
                  <textarea value={bulkNotes} onChange={(event) => setBulkNotes(event.target.value)} disabled={bulkSubmitting || bulkReloadRequired} />
                </label>
                <label className="inventory-classification__wide">
                  <span>Bulk classification reason</span>
                  <textarea value={bulkReason} onChange={(event) => setBulkReason(event.target.value)} disabled={bulkSubmitting || bulkReloadRequired} />
                </label>
                <label className="inventory-classification__confirm inventory-classification__wide">
                  <input type="checkbox" checked={bulkSimilarityConfirmed} onChange={(event) => setBulkSimilarityConfirmed(event.target.checked)} disabled={bulkSubmitting || bulkReloadRequired} />
                  <span>Confirm these items share the same classification</span>
                </label>
                <div className="inventory-classification__submit inventory-classification__wide">
                  <button type="submit" disabled={bulkSubmitting || bulkReloadRequired}>
                    {bulkSubmitting ? 'Recording classification…' : 'Classify a verified similar group'}
                  </button>
                  {bulkNotice ? <p role="status">{bulkNotice}</p> : null}
                  {bulkReloadRequired ? <button type="button" onClick={retry}>Reload inventory</button> : null}
                </div>
              </form>
            </section>
          ) : null}

          <div
            className="inventory-workspace__result-meta"
            role="status"
            aria-live="polite"
            data-inventory-modal-background
          >
            <p>
              <strong>{total}</strong> {total === 1 ? 'record' : 'records'} in this authorized result
              {!inspection && total > 0 ? ` · page ${pagination.page} of ${pageCount}` : ''}
            </p>
            {revision ? (
              <p>
                Revision {revision.token} ·{' '}
                <time dateTime={revision.updatedAt}>{formatRevisionTime(revision.updatedAt)}</time>
              </p>
            ) : null}
          </div>

          <div
            className={`inventory-workspace__layout${selected ? ' inventory-workspace__layout--inspecting' : ''}`}
          >
            <section
              className="inventory-workspace__records surface-content"
              aria-label="Inventory result records"
              data-inventory-modal-background
            >
              {authorizedEmpty ? (
                <div className="inventory-workspace__empty">
                  <h2>No inventory records are available in this authorized scope</h2>
                  <p>The service returned an empty canonical inventory projection.</p>
                </div>
              ) : null}
              {filteredEmpty ? (
                <div className="inventory-workspace__empty">
                  <h2>No records match this filter</h2>
                  <p>Clear the current search and filter to return to the full authorized result.</p>
                  <button type="button" onClick={clearFilters}>
                    Clear filter
                  </button>
                </div>
              ) : null}

              {rows.length > 0 ? (
                <>
                  <div className="inventory-workspace__cards">
                    {rows.map((item) => (
                      <article key={item.id} className={selected?.id === item.id ? 'is-selected' : ''}>
                        <div className="inventory-workspace__record-head">
                          <div>
                            <p>{item.id}</p>
                            <h2>{item.name}</h2>
                            <span>{item.category}</span>
                          </div>
                          <InventoryStateBadge item={item} />
                        </div>
                        <dl className="inventory-workspace__quantities">
                          <div>
                            <dt>On hand</dt>
                            <dd>{item.onHand}</dd>
                          </div>
                          <div>
                            <dt>Reserved</dt>
                            <dd>{item.reserved}</dd>
                          </div>
                          <div>
                            <dt>Available</dt>
                            <dd>{item.available}</dd>
                          </div>
                        </dl>
                        <button
                          ref={(node) => {
                            triggerRefs.current[item.id] = node;
                          }}
                          type="button"
                          onClick={() => handleSelect(item)}
                          aria-label={`Open item record ${item.name}`}
                        >
                          Open item record
                          <ChevronRight aria-hidden="true" size={16} />
                        </button>
                      </article>
                    ))}
                  </div>

                  <div className="inventory-workspace__table-scroll">
                    <table>
                      <thead>
                        <tr>
                          <th scope="col">Item</th>
                          <th scope="col">State</th>
                          <th scope="col" className="inventory-workspace__numeric">
                            On hand
                          </th>
                          <th scope="col" className="inventory-workspace__numeric">
                            Reserved
                          </th>
                          <th scope="col" className="inventory-workspace__numeric">
                            Available
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.map((item) => (
                          <tr key={item.id} aria-selected={selected?.id === item.id}>
                            <th scope="row">
                              <button
                                ref={(node) => {
                                  triggerRefs.current[item.id] = node;
                                }}
                                type="button"
                                onClick={() => handleSelect(item)}
                                aria-label={`${item.name}, ${item.id}. Open item record`}
                              >
                                <strong>{item.name}</strong>
                                <span>
                                  {item.id} · {item.category}
                                </span>
                              </button>
                            </th>
                            <td>
                              <InventoryStateBadge item={item} />
                            </td>
                            <td className="inventory-workspace__numeric">
                              <InventoryQtyCell val={item.onHand} c={c} />
                            </td>
                            <td className="inventory-workspace__numeric">
                              <InventoryQtyCell val={item.reserved} c={c} />
                            </td>
                            <td className="inventory-workspace__numeric">
                              <InventoryQtyCell
                                val={item.available}
                                low={item.belowThreshold || item.outOfStock}
                                c={c}
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : null}

              {!inspection && total > 0 ? (
                <nav className="inventory-workspace__pagination" aria-label="Inventory result pages">
                  <button
                    type="button"
                    disabled={pagination.page <= 1 || visibleState === 'refreshing'}
                    onClick={() => {
                      invalidateProjection();
                      setPage((value) => Math.max(1, value - 1));
                    }}
                  >
                    <ChevronLeft aria-hidden="true" size={16} />
                    Previous
                  </button>
                  <span>
                    Page {pagination.page} of {pageCount}
                  </span>
                  <button
                    type="button"
                    disabled={!pagination.hasMore || visibleState === 'refreshing'}
                    onClick={() => {
                      invalidateProjection();
                      setPage((value) => value + 1);
                    }}
                  >
                    Next
                    <ChevronRight aria-hidden="true" size={16} />
                  </button>
                </nav>
              ) : null}
            </section>

            {selected ? (
              <InventoryInspector
                item={selected}
                dark={dark}
                isMobile={isMobile}
                availableRoutes={availableRoutes}
                onNavigate={navigate}
                onClose={handleClose}
              />
            ) : null}
          </div>
        </>
      ) : null}
    </main>
  );
}
