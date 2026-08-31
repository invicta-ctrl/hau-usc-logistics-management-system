import { useEffect, useMemo, useState } from 'react';
import {
  FrontendApiError,
  frontendBackend,
  type FrontendOperationalModuleBootstrap,
  type FrontendOperationalModuleName,
} from '../../integration/backend';
import { ReleaseHistory } from './ReleaseHistory';
import { ReleaseStation } from './ReleaseStation';
import {
  evidenceError,
  numberValue,
  operationalClientRequestId,
  readAsDataUrl,
  readable,
  textValue,
} from './operationUtils';

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
    title: 'Restocking and receiving',
    summary: 'Review restock requests, receipts, and canvass references from the current authorized records.',
    collections: ['restockRequests', 'restockRecords', 'canvassReferences', 'inventoryItems'],
  },
  procurement: {
    title: 'Procurement lifecycle',
    summary:
      'Review deliverables, canvass references, and linked requests without simulating an unsupported write.',
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
}: {
  notice: CommitNotice | null;
  releaseBackground?: boolean;
}) {
  if (!notice) return null;
  return (
    <div
      className={`custody-notice custody-notice--${notice.tone} mb-5 px-4 py-3 text-sm`}
      role={notice.tone === 'error' ? 'alert' : 'status'}
      data-release-station-background={releaseBackground ? true : undefined}
    >
      {notice.message}
    </div>
  );
}

function RestockWorkflow({
  bootstrap,
  enabled,
  onCommitted,
}: {
  bootstrap: FrontendOperationalModuleBootstrap;
  enabled: boolean;
  onCommitted: (message: string) => void;
}) {
  const candidates = useMemo(
    () =>
      (bootstrap.data.restockRequests ?? [])
        .filter((row) =>
          ['TO_BE_PROCURED', 'PROCURED', 'PARTIALLY_RECEIVED'].includes(textValue(row, ['status'])),
        )
        .map((row) => {
          const requested = numberValue(row, ['requested_quantity', 'requestedQuantity', 'quantity']);
          const received = numberValue(row, ['received_quantity', 'receivedQuantity']);
          return {
            id: textValue(row, ['id']),
            itemId: textValue(row, ['item_id', 'itemId']),
            reason: textValue(row, ['reason']),
            unit: textValue(row, ['unit']),
            remaining: Math.max(0, requested - received),
          };
        })
        .filter((row) => row.id && row.remaining > 0),
    [bootstrap],
  );
  const itemNames = useMemo(
    () =>
      new Map(
        (bootstrap.data.inventoryItems ?? []).map((row) => [
          textValue(row, ['id']),
          textValue(row, ['name']),
        ]),
      ),
    [bootstrap],
  );
  const [selectedId, setSelectedId] = useState('');
  const selected = candidates.find((row) => row.id === selectedId) ?? candidates[0] ?? null;
  const [quantity, setQuantity] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<CommitNotice | null>(null);

  useEffect(() => {
    if (selected) setQuantity(String(selected.remaining));
  }, [selected?.id, selected?.remaining]);

  const submit = async () => {
    if (!selected || submitting) return;
    const amount = Number(quantity);
    const fileProblem = evidenceError(file);
    if (!Number.isFinite(amount) || amount <= 0 || amount > selected.remaining) {
      setNotice({
        tone: 'error',
        message: `Enter a receiving quantity from 1 through ${selected.remaining}.`,
      });
      return;
    }
    if (fileProblem || !file) {
      setNotice({ tone: 'error', message: fileProblem });
      return;
    }
    setSubmitting(true);
    setNotice(null);
    try {
      const evidence = await frontendBackend.uploadOperationalEvidence({
        evidenceType: 'RESTOCK_RECEIPT',
        relatedEntityType: 'RESTOCK',
        relatedEntityId: selected.id,
        restockId: selected.id,
        originalFileName: file.name,
        mimeType: file.type,
        base64: await readAsDataUrl(file),
        clientRequestId: operationalClientRequestId('restock-evidence', [
          selected.id,
          file.name,
          file.size,
          file.lastModified,
        ]),
      });
      const receipt = await frontendBackend.receiveRestock({
        restockRequestId: selected.id,
        quantity: amount,
        unit: selected.unit,
        evidenceId: evidence.evidenceId,
        invoiceStatus: invoiceNumber.trim() ? 'RECORDED' : 'NOT_REPORTED',
        invoiceNumber: invoiceNumber.trim(),
        notes: notes.trim(),
        clientRequestId: operationalClientRequestId('restock', [
          bootstrap.scopeRevision.token,
          selected.id,
          amount,
          selected.unit,
          evidence.evidenceId,
          invoiceNumber.trim(),
          notes.trim(),
        ]),
      });
      onCommitted(
        `${receipt.status === 'RECEIVED' ? 'Full' : 'Partial'} receipt recorded. Cumulative receiving and the linked inventory movement were reloaded.`,
      );
    } catch (error) {
      const conflict = error instanceof FrontendApiError && error.status === 409;
      setNotice({
        tone: conflict ? 'warning' : 'error',
        message: conflict
          ? 'The receiving record changed or the cumulative quantity conflicts with the current state. Reload before trying again.'
          : error instanceof FrontendApiError
            ? error.message
            : 'The receipt could not be recorded. No local success was assumed.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      className="mb-6 border-y border-border bg-card/40 px-4 py-5"
      aria-labelledby="restock-operation-title"
    >
      <p className="text-xs font-bold uppercase tracking-[.14em]">Receiving operation</p>
      <h2 id="restock-operation-title" className="mt-1 font-serif text-2xl">
        Record an inventory receipt
      </h2>
      {!enabled ? (
        <p className="mt-3 text-sm opacity-75">
          This account can view restocking data but cannot record receipts or upload the required evidence.
        </p>
      ) : !candidates.length ? (
        <p className="mt-3 text-sm opacity-75">
          No restock record in this authorized page is open for receiving.
        </p>
      ) : (
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <label className="grid gap-1 text-sm font-semibold">
            Open restock record
            <select
              className="min-h-11 border border-border bg-background px-3"
              value={selected?.id ?? ''}
              onChange={(event) => setSelectedId(event.target.value)}
            >
              {candidates.map((row) => (
                <option key={row.id} value={row.id}>
                  {itemNames.get(row.itemId) || row.itemId || row.reason || row.id} · {row.remaining}{' '}
                  {row.unit} remaining
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            Quantity received
            <input
              className="min-h-11 border border-border bg-background px-3"
              type="number"
              min="1"
              max={selected?.remaining ?? 1}
              step="1"
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            Invoice number (optional)
            <input
              className="min-h-11 border border-border bg-background px-3"
              value={invoiceNumber}
              onChange={(event) => setInvoiceNumber(event.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            Receiving evidence
            <input
              className="min-h-11 border border-border bg-background px-3 py-2"
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </label>
          <label className="grid gap-1 text-sm font-semibold lg:col-span-2">
            Receiving note
            <textarea
              className="min-h-20 border border-border bg-background px-3 py-2"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
            />
          </label>
          <div className="flex flex-wrap gap-2 lg:col-span-2">
            <button
              type="button"
              className="min-h-11 border border-border px-4 font-semibold"
              onClick={() => selected && setQuantity(String(selected.remaining))}
            >
              Record full remaining quantity
            </button>
            <button
              type="button"
              className="min-h-11 bg-primary px-4 font-semibold text-primary-foreground disabled:opacity-60"
              disabled={submitting}
              onClick={() => void submit()}
            >
              {submitting ? 'Recording receipt…' : 'Confirm receiving'}
            </button>
          </div>
          <div className="lg:col-span-2">
            <MutationNotice notice={notice} />
          </div>
        </div>
      )}
    </section>
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
      >
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-3xl">
            <h1 className="font-serif text-3xl leading-tight sm:text-4xl md:text-5xl">{copy.title}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 opacity-75 md:text-base">{copy.summary}</p>
          </div>
          <div className="text-right text-xs opacity-70">
            <p className="font-bold uppercase tracking-[.12em]">
              {module === 'release' ? 'Focused station' : 'Current records'} ·{' '}
              {mutationEnabled && ['release', 'restocking'].includes(module)
                ? 'operational writes enabled'
                : 'read-only'}
            </p>
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
          <MutationNotice notice={commitNotice} releaseBackground={module === 'release'} />
          {module !== 'release' ? (
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
            <RestockWorkflow bootstrap={bootstrap} enabled={mutationEnabled} onCommitted={commit} />
          ) : null}
          {module === 'release' && bootstrap ? (
            <ReleaseHistory bootstrap={bootstrap} />
          ) : (
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
