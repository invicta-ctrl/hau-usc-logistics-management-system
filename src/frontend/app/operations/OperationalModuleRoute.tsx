import { useEffect, useMemo, useState } from 'react';
import {
  FrontendApiError,
  frontendBackend,
  type FrontendOperationalModuleBootstrap,
  type FrontendOperationalModuleName,
} from '../../integration/backend';
import { ProcurementWorkspace } from './ProcurementWorkspace';
import { ReceivingHistory } from './ReceivingHistory';
import { ReceivingStation } from './ReceivingStation';
import { ReleaseHistory } from './ReleaseHistory';
import { ReleaseStation } from './ReleaseStation';
import { readable } from './operationUtils';

export { operationalClientRequestId } from './operationUtils';

/* Hallmark · design-system: DESIGN.md · macrostructure: Workbench · mode: operate */

type LoadState = 'loading' | 'ready' | 'denied' | 'unavailable';
type RecordRow = Record<string, unknown>;
type CommitNotice = { tone: 'success' | 'error' | 'warning'; message: string };

const ROUTE_COPY: Record<
  FrontendOperationalModuleName,
  { title: string; summary: string; collections: string[] }
> = {
  overview: {
    title: 'Current operational picture',
    summary: 'Review the requests, events, inventory, and work queues currently authorized for this account.',
    collections: ['requests', 'events', 'inventoryItems', 'requestLines'],
  },
  release: {
    title: 'Release Desk',
    summary:
      'Select one ready record, identify the recipient, review the exact custody consequence, and let the server recheck authority before recording the handoff.',
    collections: ['releaseConfirmations', 'requests', 'lendingTickets', 'releaseCorrections'],
  },
  restocking: {
    title: 'Receiving Desk',
    summary:
      'Record one evidence-backed inventory receipt against current cumulative restock truth, then verify the resulting receipt history.',
    collections: ['restockRequests', 'restockRecords', 'canvassReferences', 'inventoryItems'],
  },
  procurement: {
    title: 'Procurement Workspace',
    summary:
      'Trace each authorized deliverable through canvass references, supplier context, cumulative receiving, and its next governed consequence.',
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

function rowPresentation(row: RecordRow, index: number) {
  const id = scalar(row, ['id', 'code', 'reference', 'requestId', 'request_id']) || `Record ${index + 1}`;
  const title =
    scalar(row, ['name', 'title', 'description', 'purpose', 'itemName', 'item_name', 'reason']) || id;
  const status = readable(scalar(row, ['status', 'state', 'stage', 'timeStatus', 'time_status']));
  const type = readable(
    scalar(row, ['type', 'requestType', 'request_type', 'category', 'catalogType', 'catalog_type']),
  );
  const quantity = scalar(row, [
    'quantity',
    'requestedQuantity',
    'requested_quantity',
    'receivedQuantity',
    'received_quantity',
  ]);
  const unit = scalar(row, ['unit']);
  const updated = scalar(row, [
    'updatedAt',
    'updated_at',
    'createdAt',
    'created_at',
    'receivedAt',
    'received_at',
  ]);
  return {
    id,
    title,
    status,
    meta: [
      type !== 'Not reported' ? type : '',
      quantity ? `${quantity}${unit ? ` ${unit}` : ''}` : '',
      updated,
    ]
      .filter(Boolean)
      .join(' · '),
  };
}

function Collection({ name, rows }: { name: string; rows: RecordRow[] }) {
  const visible = rows.slice(0, 8);
  return (
    <section className="border-t border-border pt-4 md:pt-5" aria-labelledby={`operational-${name}`}>
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
                  <p className="mt-0.5 truncate text-xs opacity-65">
                    {item.id}
                    {item.meta ? ` · ${item.meta}` : ''}
                  </p>
                </div>
                <span className="text-xs font-bold uppercase tracking-[.08em] opacity-75">{item.status}</span>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="border-y border-dashed border-border px-4 py-8 text-center">
          <p className="font-semibold">No records are currently reported</p>
          <p className="mt-1 text-sm opacity-70">
            No authorized records are available. No sample rows were added.
          </p>
        </div>
      )}
      {rows.length > visible.length ? (
        <p className="mt-3 text-xs opacity-65">
          Showing {visible.length} of {rows.length} rows in this bounded route view.
        </p>
      ) : null}
    </section>
  );
}

function MutationNotice({
  notice,
  releaseBackground = false,
  receivingBackground = false,
}: {
  notice: CommitNotice | null;
  releaseBackground?: boolean;
  receivingBackground?: boolean;
}) {
  if (!notice) return null;
  return (
    <div
      className={`custody-notice custody-notice--${notice.tone} mb-5 px-4 py-3 text-sm`}
      role={notice.tone === 'error' ? 'alert' : 'status'}
      data-release-station-background={releaseBackground ? true : undefined}
      data-receiving-station-background={receivingBackground ? true : undefined}
    >
      {notice.message}
    </div>
  );
}

export function OperationalModuleRoute({
  module,
  sessionName = '',
  canMutate = false,
  canUploadEvidence = false,
}: {
  module: FrontendOperationalModuleName;
  sessionName?: string;
  canMutate?: boolean;
  canUploadEvidence?: boolean;
}) {
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const [bootstrap, setBootstrap] = useState<FrontendOperationalModuleBootstrap | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [commitNotice, setCommitNotice] = useState<CommitNotice | null>(null);
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
        setLoadState(
          error instanceof FrontendApiError && [401, 403].includes(error.status) ? 'denied' : 'unavailable',
        );
      });
    return () => abort.abort();
  }, [module, reloadKey]);

  const collections = useMemo(
    () => copy.collections.map((name) => ({ name, rows: (bootstrap?.data[name] ?? []) as RecordRow[] })),
    [bootstrap, copy.collections],
  );
  const totalRows = collections.reduce((sum, collection) => sum + collection.rows.length, 0);
  const mutationEnabled = canMutate && canUploadEvidence;
  const commit = (message: string) => {
    setCommitNotice({ tone: 'success', message });
    setReloadKey((value) => value + 1);
  };

  return (
    <div
      className="custody-workspace mx-auto w-full max-w-[1440px] px-4 py-7 md:px-8 md:py-9"
      data-operational-module={module}
    >
      <header
        className="mb-6 border-b border-border pb-6"
        data-release-station-background={module === 'release' ? true : undefined}
        data-receiving-station-background={module === 'restocking' ? true : undefined}
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-3xl">
            <h1 className="font-serif text-3xl leading-tight sm:text-4xl md:text-5xl">{copy.title}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 opacity-75 md:text-base">{copy.summary}</p>
          </div>
          <div className="text-right text-xs opacity-70">
            <p className="font-bold uppercase tracking-[.12em]">
              {module === 'release'
                ? 'Focused release station'
                : module === 'restocking'
                  ? 'Focused receiving station'
                  : module === 'procurement'
                    ? 'Consequence review'
                    : 'Current records'}{' '}
              ·{' '}
              {mutationEnabled && ['release', 'restocking'].includes(module)
                ? 'operational writes enabled'
                : 'read-only'}
            </p>
            {sessionName ? <p className="mt-1">Authorized for {sessionName}</p> : null}
            {bootstrap ? <p className="mt-1">Record version {bootstrap.scopeRevision.token}</p> : null}
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
          <h2 className="mt-2 font-serif text-3xl">
            This operational route is not available to this account
          </h2>
          <p className="mt-2 opacity-75">The response does not confirm whether a protected record exists.</p>
        </section>
      ) : loadState === 'unavailable' ? (
        <section className="border-y border-border py-6" role="alert">
          <p className="text-xs font-bold uppercase tracking-[.16em]">Unavailable</p>
          <h2 className="mt-2 font-serif text-3xl">
            The {copy.title.toLowerCase()} service is temporarily unavailable
          </h2>
          <p className="mt-2 opacity-75">No record was changed, and no sample data was added.</p>
          <button
            className="mt-5 min-h-11 rounded-lg border border-border bg-card px-4 py-2 font-semibold"
            type="button"
            onClick={() => setReloadKey((value) => value + 1)}
          >
            Retry read-only load
          </button>
        </section>
      ) : (
        <>
          <MutationNotice
            notice={commitNotice}
            releaseBackground={module === 'release'}
            receivingBackground={module === 'restocking'}
          />
          {module === 'overview' ? (
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-y border-border bg-muted/40 px-4 py-3 text-sm">
              <span>
                <strong>{totalRows}</strong> authorized rows across {collections.length} operational
                collections
              </span>
              <span className="opacity-70">
                Record version {bootstrap?.scopeRevision.token} · page {bootstrap?.pagination.page}
              </span>
            </div>
          ) : null}
          {module === 'release' && bootstrap ? (
            <ReleaseStation bootstrap={bootstrap} enabled={mutationEnabled} onCommitted={commit} />
          ) : module === 'restocking' && bootstrap ? (
            <ReceivingStation bootstrap={bootstrap} enabled={mutationEnabled} onCommitted={commit} />
          ) : module === 'procurement' && bootstrap ? (
            <ProcurementWorkspace bootstrap={bootstrap} />
          ) : null}
          {module === 'release' && bootstrap ? (
            <ReleaseHistory bootstrap={bootstrap} />
          ) : module === 'restocking' && bootstrap ? (
            <ReceivingHistory bootstrap={bootstrap} />
          ) : module === 'procurement' ? null : (
            <div className="grid gap-4 xl:grid-cols-2">
              {collections.map((collection) => (
                <Collection key={collection.name} name={collection.name} rows={collection.rows} />
              ))}
            </div>
          )}
          {module !== 'overview' && module !== 'release' && module !== 'restocking' ? (
            <aside className="mt-5 border-t border-dashed border-border px-1 pt-4 text-sm opacity-75">
              This page is read-only because no approved update action is available for this record.
            </aside>
          ) : !mutationEnabled && (module === 'release' || module === 'restocking') ? (
            <aside className="mt-5 border-t border-dashed border-border px-1 pt-4 text-sm opacity-75">
              Update controls are unavailable for this account.
            </aside>
          ) : null}
        </>
      )}
    </div>
  );
}
