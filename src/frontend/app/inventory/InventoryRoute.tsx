import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { AlertTriangle, ArrowLeft, RefreshCw, Search } from 'lucide-react';
import type { Route } from '../appTypes';
import { ap } from '../theme/palette';
import { FrontendApiError, frontendBackend } from '../../integration/backend';
import { inventoryItemFromBootstrap } from './inventoryData';
import { INV_FIXTURE } from './inventoryFixtures';
import { InventoryInspector } from './InventoryInspector';
import { InventoryQtyCell } from './InventoryQtyCell';
import { InventoryStateBadge } from './InventoryStateBadge';
import type { InvItem } from './inventoryTypes';

type InventoryLoadState = 'loading' | 'ready' | 'error' | 'denied' | 'stale';

export function InventoryRoute({
  dark,
  navigate,
  inspection = false,
}: {
  dark: boolean;
  navigate: (r: Route) => void;
  /** A4-only fixture mode. It never asks the protected bootstrap endpoint for data. */
  inspection?: boolean;
}) {
  const c = ap(dark);

  const [loadState, setLoadState] = useState<InventoryLoadState>(inspection ? 'ready' : 'loading');
  const [items, setItems] = useState<InvItem[]>(inspection ? INV_FIXTURE : []);
  const [reloadKey, setReloadKey] = useState(0);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'below' | 'out' | 'unconfirmed'>('all');
  const [selected, setSelected] = useState<InvItem | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [previewState, setPreviewState] = useState<'default' | 'error' | 'stale' | 'permission'>('default');
  const [staleAcknowledged, setStaleAcknowledged] = useState(false);

  const triggerRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    if (inspection) {
      setItems(INV_FIXTURE);
      setLoadState('ready');
      return;
    }
    const abort = new AbortController();
    setLoadState((previous) => (previous === 'ready' && items.length > 0 ? 'stale' : 'loading'));
    void frontendBackend
      .inventoryBootstrap(abort.signal)
      .then((result) => {
        if (abort.signal.aborted) return;
        setItems(result.inventoryItems.map(inventoryItemFromBootstrap));
        setLoadState('ready');
      })
      .catch((error: unknown) => {
        if (abort.signal.aborted) return;
        if (error instanceof FrontendApiError && [401, 403].includes(error.status)) {
          setLoadState('denied');
          return;
        }
        setLoadState(items.length > 0 ? 'stale' : 'error');
      });
    return () => abort.abort();
  }, [inspection, reloadKey]);

  useEffect(() => {
    function check() {
      setIsMobile(window.innerWidth < 768);
    }
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const rows = items.filter((item) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      item.name.toLowerCase().includes(q) ||
      item.id.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q);
    const matchFilter =
      filter === 'all'
        ? true
        : filter === 'below'
          ? item.belowThreshold
          : filter === 'out'
            ? item.outOfStock
            : filter === 'unconfirmed'
              ? item.unconfirmed
              : true;
    return matchSearch && matchFilter;
  });

  function handleSelect(item: InvItem) {
    setSelected(item);
  }

  function handleClose() {
    const id = selected?.id;
    setSelected(null);
    if (id) triggerRefs.current[id]?.focus();
  }

  const mono = "'IBM Plex Mono', monospace";
  const sans = "'IBM Plex Sans', system-ui, sans-serif";
  const display = "'Bricolage Grotesque', system-ui, sans-serif";

  const thBg = dark ? '#242120' : '#f7f0e2';
  const tdStyle: CSSProperties = { padding: '14px 16px', verticalAlign: 'middle' };

  const demonstrationState = inspection ? previewState : 'default';
  const visibleState = demonstrationState === 'default' ? loadState : demonstrationState;
  const showTable = visibleState === 'ready' || visibleState === 'stale' || visibleState === 'loading';
  const hasNoBootstrapRecords = visibleState !== 'loading' && items.length === 0;

  function retry() {
    if (inspection) {
      setPreviewState('default');
      return;
    }
    setReloadKey((value) => value + 1);
  }

  return (
    <div className="px-4 md:px-8 py-8 max-w-[1280px] mx-auto">
      {/* Heading + inspection-only state selector */}
      <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p
            style={{
              fontFamily: mono,
              fontSize: 10,
              color: c.muted,
              letterSpacing: '1px',
              textTransform: 'uppercase',
              marginBottom: 4,
            }}
          >
            Inventory
          </p>
          <h1
            style={{
              fontFamily: display,
              fontWeight: 700,
              fontSize: 'clamp(22px, 3vw, 30px)',
              color: c.text,
              letterSpacing: '-0.8px',
              fontVariationSettings: '"opsz" 14, "wdth" 100',
            }}
          >
            Inventory
          </h1>
          <p style={{ fontFamily: sans, fontSize: 13, color: c.muted, marginTop: 4, letterSpacing: -0.1 }}>
            Search stock truth and inspect a record.
          </p>
        </div>
        {inspection ? (
          <div className="flex flex-col gap-1 shrink-0">
            <label
              htmlFor="inv-preview-state"
              style={{
                fontFamily: mono,
                fontSize: 9,
                color: c.muted,
                letterSpacing: '0.9px',
                textTransform: 'uppercase',
              }}
            >
              Inspection state
            </label>
            <select
              id="inv-preview-state"
              value={previewState}
              onChange={(e) => {
                setPreviewState(e.target.value as typeof previewState);
                setStaleAcknowledged(false);
              }}
              className="rounded-[8px] px-3 py-2 text-[12px] focus:outline-none focus:ring-2 focus:ring-[#e8b93c]"
              style={{
                background: dark ? '#2d2927' : '#ffffff',
                border: `1px solid ${c.border}`,
                color: c.text,
                fontFamily: mono,
                minWidth: 164,
              }}
            >
              <option value="default">Default</option>
              <option value="error">Page error</option>
              <option value="stale">Stale data</option>
              <option value="permission">Permission limited</option>
            </select>
          </div>
        ) : (
          <button
            type="button"
            onClick={retry}
            className="inline-flex items-center gap-2 rounded-[8px] px-3 py-2 text-[12px] font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#e8b93c]"
            style={{
              background: dark ? '#2d2927' : '#ffffff',
              border: `1px solid ${c.border}`,
              color: c.text,
              fontFamily: sans,
            }}
          >
            <RefreshCw size={13} strokeWidth={1.6} />
            Refresh inventory
          </button>
        )}
      </div>

      {/* Error state */}
      {visibleState === 'error' && (
        <div
          className="rounded-[12px] flex flex-col items-center justify-center gap-5 px-6 py-16"
          style={{ border: `1px solid ${c.border}`, background: c.m1, minHeight: 320 }}
        >
          <div
            className="flex items-center justify-center rounded-full"
            style={{
              width: 48,
              height: 48,
              background: 'rgba(212,24,61,0.08)',
              border: '1px solid rgba(212,24,61,0.22)',
            }}
          >
            <AlertTriangle size={20} strokeWidth={1.5} color="#d4183d" />
          </div>
          <div className="text-center flex flex-col gap-2 max-w-[360px]">
            <p
              style={{
                fontFamily: display,
                fontWeight: 700,
                fontSize: 18,
                color: c.text,
                letterSpacing: '-0.4px',
                fontVariationSettings: '"opsz" 14, "wdth" 100',
              }}
            >
              This page could not be loaded
            </p>
            <p
              style={{
                fontFamily: sans,
                fontSize: 13,
                color: c.muted,
                letterSpacing: -0.1,
                lineHeight: '20px',
              }}
            >
              An error occurred while preparing this view. No data has been changed. Try again or return to a
              previous view.
            </p>
          </div>
          <button
            type="button"
            onClick={retry}
            className="inline-flex items-center gap-2 rounded-[10px] px-5 py-2.5 text-[13px] font-semibold transition-opacity hover:opacity-90 active:opacity-75 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e8b93c]"
            style={{
              background: dark ? '#e8b93c' : '#40070a',
              color: dark ? '#40070a' : '#faeecb',
              fontFamily: sans,
            }}
          >
            <RefreshCw size={13} strokeWidth={1.6} />
            Retry
          </button>
        </div>
      )}

      {/* Permission limited */}
      {(visibleState === 'permission' || visibleState === 'denied') && (
        <div
          className="rounded-[12px] flex flex-col items-center justify-center gap-5 px-6 py-16"
          style={{ border: `1px solid ${c.border}`, background: c.m1, minHeight: 320 }}
        >
          <div className="flex flex-col items-center gap-4 max-w-[340px] text-center">
            <p
              style={{
                fontFamily: display,
                fontWeight: 700,
                fontSize: 18,
                color: c.text,
                letterSpacing: '-0.4px',
                fontVariationSettings: '"opsz" 14, "wdth" 100',
              }}
            >
              Access limited
            </p>
            <p
              style={{
                fontFamily: sans,
                fontSize: 13,
                color: c.muted,
                letterSpacing: -0.1,
                lineHeight: '20px',
              }}
            >
              This view is not available for your current session.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('overview')}
            className="inline-flex items-center gap-2 rounded-[10px] px-5 py-2.5 text-[13px] font-semibold transition-opacity hover:opacity-90 active:opacity-75 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e8b93c]"
            style={{
              background: dark ? '#e8b93c' : '#40070a',
              color: dark ? '#40070a' : '#faeecb',
              fontFamily: sans,
            }}
          >
            <ArrowLeft size={13} strokeWidth={1.6} />
            Return to overview
          </button>
        </div>
      )}

      {/* Default + Stale: normal table view */}
      {showTable && (
        <>
          {/* Stale warning banner */}
          {visibleState === 'stale' && (
            <div
              className="rounded-[10px] mb-4 px-4 py-3 flex flex-col sm:flex-row sm:items-center gap-3"
              style={{ background: 'rgba(232,185,60,0.08)', border: '1px solid rgba(232,185,60,0.32)' }}
              role="status"
            >
              <div className="flex items-start gap-3 flex-1 min-w-0">
                <AlertTriangle
                  size={15}
                  strokeWidth={1.5}
                  color="#c8992f"
                  style={{ marginTop: 1, flexShrink: 0 }}
                />
                <div>
                  <p
                    style={{
                      fontFamily: sans,
                      fontSize: 13,
                      fontWeight: 500,
                      color: dark ? '#e8b93c' : '#7d5518',
                      letterSpacing: -0.1,
                    }}
                  >
                    Data may be out of date
                  </p>
                  {staleAcknowledged ? (
                    <p
                      style={{
                        fontFamily: mono,
                        fontSize: 10,
                        color: dark ? 'rgba(232,185,60,0.6)' : '#a07828',
                        letterSpacing: '0.1px',
                        marginTop: 2,
                      }}
                    >
                      Outdated record acknowledged
                    </p>
                  ) : (
                    <p
                      style={{
                        fontFamily: sans,
                        fontSize: 12,
                        color: dark ? 'rgba(232,185,60,0.65)' : '#a07828',
                        letterSpacing: -0.1,
                        lineHeight: '18px',
                        marginTop: 2,
                      }}
                    >
                      Values shown are from a previous load and may not reflect current state.
                    </p>
                  )}
                </div>
              </div>
              {!staleAcknowledged && (
                <div className="flex items-center gap-2 shrink-0 pl-6 sm:pl-0">
                  <button
                    type="button"
                    onClick={retry}
                    className="rounded-[8px] px-3 py-1.5 text-[12px] font-semibold transition-opacity hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#e8b93c]"
                    style={{
                      background: dark ? 'rgba(232,185,60,0.18)' : 'rgba(200,153,47,0.15)',
                      color: dark ? '#e8b93c' : '#7d5518',
                      fontFamily: sans,
                      border: `1px solid ${dark ? 'rgba(232,185,60,0.3)' : 'rgba(200,153,47,0.3)'}`,
                    }}
                  >
                    Reload
                  </button>
                  <button
                    type="button"
                    onClick={() => setStaleAcknowledged(true)}
                    className="rounded-[8px] px-3 py-1.5 text-[12px] transition-opacity hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#e8b93c]"
                    style={{
                      background: 'transparent',
                      color: dark ? 'rgba(232,185,60,0.65)' : '#a07828',
                      fontFamily: sans,
                      border: `1px solid ${dark ? 'rgba(232,185,60,0.18)' : 'rgba(200,153,47,0.2)'}`,
                    }}
                  >
                    Review
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Search + Filter bar */}
          <div className="flex flex-col sm:flex-row gap-3 mb-5">
            <div className="relative flex-1">
              <Search
                size={14}
                strokeWidth={1.5}
                color={c.muted}
                style={{
                  position: 'absolute',
                  left: 12,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  pointerEvents: 'none',
                }}
              />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by item name, ID, or category…"
                className="w-full rounded-[8px] pl-9 pr-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#e8b93c]"
                style={{
                  background: dark ? '#2d2927' : '#ffffff',
                  border: `1px solid ${c.border}`,
                  color: c.text,
                  fontFamily: sans,
                }}
              />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as typeof filter)}
              className="rounded-[8px] px-3 py-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#e8b93c]"
              style={{
                background: dark ? '#2d2927' : '#ffffff',
                border: `1px solid ${c.border}`,
                color: c.text,
                fontFamily: sans,
                minWidth: 170,
              }}
              aria-label="Filter inventory"
            >
              <option value="all">All items</option>
              <option value="below">Below threshold</option>
              <option value="out">Out of stock</option>
              <option value="unconfirmed">Unconfirmed</option>
            </select>
          </div>

          {/* The real runtime and local inspection fixture remain explicitly separate. */}
          <div className="flex items-center gap-2 mb-4">
            <span
              className="rounded-[5px] px-2 py-0.5"
              style={{
                fontFamily: mono,
                fontSize: 9,
                color: '#7d5518',
                background: '#fbeed2',
                border: '1px solid #dcbe8a',
                letterSpacing: '0.8px',
                textTransform: 'uppercase',
              }}
            >
              {inspection
                ? 'Inspection sample · actions unavailable'
                : 'Current authorized inventory records'}
            </span>
            <span style={{ fontFamily: mono, fontSize: 10, color: c.muted }}>{items.length} records</span>
          </div>

          {/* Table */}
          {visibleState === 'loading' ? (
            <div className="rounded-[12px] overflow-hidden" style={{ border: `1px solid ${c.border}` }}>
              {[0, 1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="animate-pulse"
                  style={{
                    height: 56,
                    background: i % 2 === 0 ? c.m1 : dark ? '#222120' : '#f9f5ee',
                    borderTop: i > 0 ? `1px solid ${c.border}` : 'none',
                  }}
                />
              ))}
            </div>
          ) : hasNoBootstrapRecords ? (
            <div
              className="rounded-[12px] flex items-center justify-center"
              style={{ border: `1px solid ${c.border}`, background: c.m1, minHeight: 180 }}
            >
              <div className="text-center max-w-[360px] px-4">
                <p
                  style={{
                    fontFamily: mono,
                    fontSize: 10,
                    color: c.muted,
                    letterSpacing: '0.8px',
                    textTransform: 'uppercase',
                  }}
                >
                  No inventory records are available in this authorized scope
                </p>
                <p
                  style={{ fontFamily: sans, fontSize: 12, color: c.muted, marginTop: 8, lineHeight: '18px' }}
                >
                  No records were returned for this account. Search and filters cannot add inventory data.
                </p>
              </div>
            </div>
          ) : rows.length === 0 ? (
            <div
              className="rounded-[12px] flex items-center justify-center"
              style={{ border: `1px solid ${c.border}`, background: c.m1, minHeight: 180 }}
            >
              <div className="text-center">
                <p
                  style={{
                    fontFamily: mono,
                    fontSize: 10,
                    color: c.muted,
                    letterSpacing: '0.8px',
                    textTransform: 'uppercase',
                  }}
                >
                  No records match this filter
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearch('');
                    setFilter('all');
                  }}
                  style={{
                    fontFamily: sans,
                    fontSize: 12,
                    color: '#e8b93c',
                    marginTop: 8,
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Clear filter
                </button>
              </div>
            </div>
          ) : isMobile ? (
            <div className="grid gap-3" role="list" aria-label="Inventory records">
              {rows.map((item) => {
                const isSelected = selected?.id === item.id;
                return (
                  <article
                    key={item.id}
                    role="listitem"
                    className="rounded-[12px] p-4"
                    style={{
                      background: isSelected ? (dark ? '#2d2520' : '#fcf2cf') : c.m1,
                      border: `1px solid ${isSelected ? '#c8992f' : c.border}`,
                    }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p style={{ fontFamily: sans, fontWeight: 650, fontSize: 14, color: c.text }}>
                          {item.name}
                        </p>
                        <p style={{ fontFamily: mono, fontSize: 11, color: c.muted, marginTop: 3 }}>
                          {item.id} · {item.category}
                        </p>
                      </div>
                      <InventoryStateBadge item={item} />
                    </div>
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 my-4">
                      <div>
                        <dt style={{ fontFamily: mono, fontSize: 10, color: c.muted }}>AVAILABLE</dt>
                        <dd style={{ fontFamily: sans, color: c.text, margin: 0 }}>
                          {String(item.available)}
                        </dd>
                      </div>
                      <div>
                        <dt style={{ fontFamily: mono, fontSize: 10, color: c.muted }}>RESERVED</dt>
                        <dd style={{ fontFamily: sans, color: c.text, margin: 0 }}>
                          {String(item.reserved)}
                        </dd>
                      </div>
                      <div>
                        <dt style={{ fontFamily: mono, fontSize: 10, color: c.muted }}>ON HAND</dt>
                        <dd style={{ fontFamily: sans, color: c.text, margin: 0 }}>{String(item.onHand)}</dd>
                      </div>
                      <div>
                        <dt style={{ fontFamily: mono, fontSize: 10, color: c.muted }}>THRESHOLD</dt>
                        <dd style={{ fontFamily: sans, color: c.text, margin: 0 }}>
                          {String(item.threshold)}
                        </dd>
                      </div>
                    </dl>
                    <button
                      ref={(el) => {
                        triggerRefs.current[item.id] = el;
                      }}
                      type="button"
                      onClick={() => handleSelect(item)}
                      className="w-full rounded-[8px] px-4 py-3 text-[13px] font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#e8b93c]"
                      style={{
                        minHeight: 48,
                        background: isSelected ? '#e8b93c' : 'transparent',
                        color: isSelected ? '#40070a' : c.text,
                        border: `1px solid ${isSelected ? '#d1b478' : c.border}`,
                        fontFamily: sans,
                      }}
                      aria-pressed={isSelected}
                    >
                      Open item record
                    </button>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="rounded-[12px] overflow-hidden" style={{ border: `1px solid ${c.border}` }}>
              <div className="overflow-x-auto">
                <table className="w-full" style={{ borderCollapse: 'collapse', minWidth: 680 }}>
                  <thead>
                    <tr style={{ background: thBg, borderBottom: `1px solid ${c.border}` }}>
                      {['Item', 'Category', 'On hand', 'Reserved', 'Available', 'Threshold', 'Lending'].map(
                        (h) => (
                          <th
                            key={h}
                            style={{
                              ...thStyle(thBg, c, mono),
                              textAlign:
                                h === 'On hand' || h === 'Reserved' || h === 'Available' || h === 'Threshold'
                                  ? 'right'
                                  : 'left',
                            }}
                          >
                            {h}
                          </th>
                        ),
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((item, i) => {
                      const isSelected = selected?.id === item.id;
                      const rowBg = isSelected
                        ? dark
                          ? '#2d2520'
                          : '#fcf2cf'
                        : dark
                          ? i % 2 === 0
                            ? c.m1
                            : '#222120'
                          : i % 2 === 0
                            ? '#ffffff'
                            : '#faf7f2';
                      const leftBorder = isSelected ? '3px solid #c8992f' : '3px solid transparent';
                      return (
                        <tr
                          key={item.id}
                          style={{ background: rowBg, borderTop: i > 0 ? `1px solid ${c.border}` : 'none' }}
                        >
                          <td style={{ ...tdStyle, borderLeft: leftBorder, maxWidth: 220 }}>
                            <button
                              ref={(el) => {
                                triggerRefs.current[item.id] = el;
                              }}
                              type="button"
                              onClick={() => handleSelect(item)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  handleSelect(item);
                                }
                              }}
                              className="text-left w-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#e8b93c] rounded-[4px]"
                              aria-pressed={isSelected}
                            >
                              <p
                                style={{
                                  fontFamily: sans,
                                  fontWeight: 600,
                                  fontSize: 13,
                                  color: c.text,
                                  letterSpacing: -0.15,
                                  lineHeight: '17px',
                                }}
                              >
                                {item.name}
                              </p>
                              <p style={{ fontFamily: mono, fontSize: 10, color: c.muted, marginTop: 2 }}>
                                {item.id}
                              </p>
                            </button>
                          </td>
                          <td style={{ ...tdStyle, fontFamily: sans, fontSize: 13, color: c.text }}>
                            {item.category}
                          </td>
                          <td style={{ ...tdStyle, textAlign: 'right' }}>
                            <InventoryQtyCell val={item.onHand} c={c} />
                          </td>
                          <td style={{ ...tdStyle, textAlign: 'right' }}>
                            <InventoryQtyCell val={item.reserved} c={c} />
                          </td>
                          <td style={{ ...tdStyle, textAlign: 'right' }}>
                            <InventoryQtyCell
                              val={item.available}
                              low={
                                typeof item.available === 'number' &&
                                typeof item.threshold === 'number' &&
                                (item.available as number) < (item.threshold as number)
                              }
                              c={c}
                            />
                          </td>
                          <td style={{ ...tdStyle, textAlign: 'right' }}>
                            <InventoryQtyCell val={item.threshold} c={c} />
                          </td>
                          <td style={tdStyle}>
                            <InventoryStateBadge item={item} />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Inspector */}
      {selected && (
        <InventoryInspector item={selected} dark={dark} isMobile={isMobile} onClose={handleClose} />
      )}
    </div>
  );
}

// Helper used inside InventoryRoute table header
function thStyle(bg: string, c: ReturnType<typeof ap>, mono: string): CSSProperties {
  return {
    fontFamily: mono,
    fontWeight: 600,
    fontSize: 10,
    color: c.muted,
    letterSpacing: '1px',
    textTransform: 'uppercase',
    padding: '10px 16px',
    whiteSpace: 'nowrap',
    background: bg,
  };
}
