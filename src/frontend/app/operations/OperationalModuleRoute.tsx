import { useEffect, useMemo, useState } from 'react';
import {
  FrontendApiError,
  frontendBackend,
  type FrontendOperationalModuleBootstrap,
  type FrontendOperationalModuleName,
} from '../../integration/backend';

/* Hallmark · design-system: DESIGN.md · macrostructure: Workbench · mode: operate */

type LoadState = 'loading' | 'ready' | 'denied' | 'unavailable';
type RecordRow = Record<string, unknown>;

const ROUTE_COPY: Record<
  FrontendOperationalModuleName,
  { title: string; summary: string; collections: string[] }
> = {
  overview: {
    title: 'Current operational picture',
    summary: 'A read-only projection of the requests, events, inventory, and work queues currently authorized for this account.',
    collections: ['requests', 'events', 'inventoryItems', 'requestLines'],
  },
  release: {
    title: 'Physical release records',
    summary: 'Review ready work and recorded releases. This route does not invent or simulate a custody change.',
    collections: ['releaseConfirmations', 'requests', 'lendingTickets', 'releaseCorrections'],
  },
  restocking: {
    title: 'Restocking and receiving',
    summary: 'Review restock requests, receipts, and canvass references from the authenticated operational contract.',
    collections: ['restockRequests', 'restockRecords', 'canvassReferences', 'inventoryItems'],
  },
  procurement: {
    title: 'Procurement lifecycle',
    summary: 'Review deliverables, canvass references, and linked requests without simulating an unsupported write.',
    collections: ['deliverables', 'canvassReferences', 'requests', 'requestLines'],
  },
};

const COLLECTION_LABELS: Record<string, string> = {
  requests: 'Requests',
  requestLines: 'Request lines',
  events: 'Events',
  inventoryItems: 'Inventory references',
  lendingTickets: 'Lending records',
  releaseConfirmations: 'Release confirmations',
  releaseCorrections: 'Release corrections',
  restockRequests: 'Restock requests',
  restockRecords: 'Receiving records',
  canvassReferences: 'Canvass references',
  deliverables: 'Deliverables',
};

function scalar(row: RecordRow, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
    if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  }
  return '';
}

function readable(value: string) {
  return value
    ? value.replaceAll('_', ' ').toLowerCase().replace(/\b\w/gu, (letter) => letter.toUpperCase())
    : 'Not reported';
}

function rowPresentation(row: RecordRow, index: number) {
  const id = scalar(row, ['id', 'code', 'reference', 'requestId', 'request_id']) || `Record ${index + 1}`;
  const title =
    scalar(row, ['name', 'title', 'description', 'purpose', 'itemName', 'item_name', 'reason']) || id;
  const status = readable(scalar(row, ['status', 'state', 'stage', 'timeStatus', 'time_status']));
  const type = readable(scalar(row, ['type', 'requestType', 'request_type', 'category', 'catalogType', 'catalog_type']));
  const quantity = scalar(row, ['quantity', 'requestedQuantity', 'requested_quantity', 'receivedQuantity', 'received_quantity']);
  const unit = scalar(row, ['unit']);
  const updated = scalar(row, ['updatedAt', 'updated_at', 'createdAt', 'created_at', 'receivedAt', 'received_at']);
  return {
    id,
    title,
    status,
    meta: [type !== 'Not reported' ? type : '', quantity ? `${quantity}${unit ? ` ${unit}` : ''}` : '', updated]
      .filter(Boolean)
      .join(' · '),
  };
}

function Collection({ name, rows }: { name: string; rows: RecordRow[] }) {
  const visible = rows.slice(0, 8);
  return (
    <section
      className="border-t border-border pt-4 md:pt-5"
      aria-labelledby={`operational-${name}`}
    >
      <div className="mb-4 flex items-start justify-between gap-3">
        <div>
          <h2 id={`operational-${name}`} className="font-serif text-2xl">
            {COLLECTION_LABELS[name] ?? readable(name)}
          </h2>
        </div>
        <span className="rounded-full border border-border px-2.5 py-1 text-xs font-bold tabular-nums">
          {rows.length}
        </span>
      </div>
      {visible.length ? (
        <ul className="divide-y divide-border">
          {visible.map((row, index) => {
            const item = rowPresentation(row, index);
            return (
              <li
                key={`${item.id}-${index}`}
                className="grid gap-1 py-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold">{item.title}</p>
                  <p className="mt-0.5 truncate text-xs opacity-65">{item.id}{item.meta ? ` · ${item.meta}` : ''}</p>
                </div>
                <span className="text-xs font-bold uppercase tracking-[.08em] opacity-75">{item.status}</span>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="border-y border-dashed border-border px-4 py-8 text-center">
          <p className="font-semibold">No records are currently reported</p>
          <p className="mt-1 text-sm opacity-70">The backend returned an empty authorized collection. No sample rows were substituted.</p>
        </div>
      )}
      {rows.length > visible.length ? (
        <p className="mt-3 text-xs opacity-65">Showing {visible.length} of {rows.length} rows in this bounded route view.</p>
      ) : null}
    </section>
  );
}

export function OperationalModuleRoute({
  module,
  sessionName = '',
}: {
  module: FrontendOperationalModuleName;
  sessionName?: string;
}) {
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [bootstrap, setBootstrap] = useState<FrontendOperationalModuleBootstrap | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const copy = ROUTE_COPY[module];

  useEffect(() => {
    const abort = new AbortController();
    setLoadState('loading');
    setBootstrap(null);
    void frontendBackend
      .operationalModuleBootstrap(module, abort.signal)
      .then((result) => {
        if (abort.signal.aborted) return;
        setBootstrap(result);
        setLoadState('ready');
      })
      .catch((error: unknown) => {
        if (abort.signal.aborted) return;
        setLoadState(error instanceof FrontendApiError && [401, 403].includes(error.status) ? 'denied' : 'unavailable');
      });
    return () => abort.abort();
  }, [module, reloadKey]);

  const collections = useMemo(
    () => copy.collections.map((name) => ({ name, rows: (bootstrap?.data[name] ?? []) as RecordRow[] })),
    [bootstrap, copy.collections],
  );
  const totalRows = collections.reduce((sum, collection) => sum + collection.rows.length, 0);

  return (
    <div className="mx-auto w-full max-w-[1440px] px-4 py-7 md:px-8 md:py-9" data-operational-module={module}>
      <header className="mb-6 border-b border-border pb-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-3xl">
            <h1 className="font-serif text-3xl leading-tight sm:text-4xl md:text-5xl">{copy.title}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 opacity-75 md:text-base">{copy.summary}</p>
          </div>
          <div className="text-right text-xs opacity-70">
            <p className="font-bold uppercase tracking-[.12em]">Real backend · read-only</p>
            {sessionName ? <p className="mt-1">Authorized for {sessionName}</p> : null}
          </div>
        </div>
      </header>

      {loadState === 'loading' ? (
        <div className="grid gap-4 md:grid-cols-2" aria-busy="true" aria-label={`Loading ${module} data`}>
          {[0, 1, 2, 3].map((item) => (
            <div key={item} className="h-48 animate-pulse rounded-xl bg-muted opacity-60" />
          ))}
        </div>
      ) : loadState === 'denied' ? (
        <section className="border-y border-border py-6" role="alert">
          <p className="text-xs font-bold uppercase tracking-[.16em]">Denied</p>
          <h2 className="mt-2 font-serif text-3xl">This operational route is not available to this account</h2>
          <p className="mt-2 opacity-75">The response does not confirm whether a protected record exists.</p>
        </section>
      ) : loadState === 'unavailable' ? (
        <section className="border-y border-border py-6" role="alert">
          <p className="text-xs font-bold uppercase tracking-[.16em]">Unavailable</p>
          <h2 className="mt-2 font-serif text-3xl">The {copy.title.toLowerCase()} service is temporarily unavailable</h2>
          <p className="mt-2 opacity-75">No record was changed, and no fixture data was substituted.</p>
          <button className="mt-5 min-h-11 rounded-lg border border-border bg-card px-4 py-2 font-semibold" type="button" onClick={() => setReloadKey((value) => value + 1)}>
            Retry read-only load
          </button>
        </section>
      ) : (
        <>
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-y border-border bg-muted/40 px-4 py-3 text-sm">
            <span><strong>{totalRows}</strong> authorized rows across {collections.length} operational collections</span>
            <span className="opacity-70">Revision {bootstrap?.scopeRevision.token} · page {bootstrap?.pagination.page}</span>
          </div>
          <div className="grid gap-4 xl:grid-cols-2">
            {collections.map((collection) => (
              <Collection key={collection.name} name={collection.name} rows={collection.rows} />
            ))}
          </div>
          {module !== 'overview' ? (
            <aside className="mt-5 border-t border-dashed border-border px-1 pt-4 text-sm opacity-75">
              This route is read-only because the current accepted frontend contract does not expose a supported mutation for this surface. Existing Worker authorization remains authoritative.
            </aside>
          ) : null}
        </>
      )}
    </div>
  );
}
