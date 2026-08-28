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
type CommitNotice = { tone: 'success' | 'error' | 'warning'; message: string };

const EVIDENCE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);

function value(row: RecordRow, keys: string[]) {
  for (const key of keys) {
    if (row[key] !== undefined && row[key] !== null) return row[key];
  }
  return undefined;
}

function textValue(row: RecordRow, keys: string[]) {
  const candidate = value(row, keys);
  return typeof candidate === 'string' ? candidate.trim() : '';
}

function numberValue(row: RecordRow, keys: string[]) {
  const candidate = Number(value(row, keys));
  return Number.isFinite(candidate) ? candidate : 0;
}

export function operationalClientRequestId(kind: string, values: Array<string | number | boolean>) {
  let hash = 2166136261;
  for (const character of [kind, ...values.map(String)].join('|')) {
    hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  }
  return `p08-${kind}-${(hash >>> 0).toString(36)}`;
}

function evidenceError(file: File | null) {
  if (!file) return 'Select a governed photo or PDF before recording this operation.';
  if (!EVIDENCE_TYPES.has(file.type)) return 'Use a JPG, PNG, WEBP, or PDF evidence file.';
  if (file.size <= 0) return 'The selected evidence file is empty.';
  if (file.size > 10 * 1024 * 1024) return 'The selected evidence file exceeds the 10 MB limit.';
  return '';
}

function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('The evidence file could not be read.'));
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.readAsDataURL(file);
  });
}

const ROUTE_COPY: Record<
  FrontendOperationalModuleName,
  { title: string; summary: string; collections: string[] }
> = {
  overview: {
    title: 'Current operational picture',
    summary:
      'A read-only projection of the requests, events, inventory, and work queues currently authorized for this account.',
    collections: ['requests', 'events', 'inventoryItems', 'requestLines'],
  },
  release: {
    title: 'Physical release records',
    summary:
      'Review ready work and recorded releases. This route does not invent or simulate a custody change.',
    collections: ['releaseConfirmations', 'requests', 'lendingTickets', 'releaseCorrections'],
  },
  restocking: {
    title: 'Restocking and receiving',
    summary:
      'Review restock requests, receipts, and canvass references from the authenticated operational contract.',
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

function readable(value: string) {
  return value
    ? value
        .replaceAll('_', ' ')
        .toLowerCase()
        .replace(/\b\w/gu, (letter) => letter.toUpperCase())
    : 'Not reported';
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
            The backend returned an empty authorized collection. No sample rows were substituted.
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

function MutationNotice({ notice }: { notice: CommitNotice | null }) {
  if (!notice) return null;
  const tone =
    notice.tone === 'success'
      ? 'border-emerald-700/30 bg-emerald-500/10'
      : notice.tone === 'warning'
        ? 'border-amber-700/30 bg-amber-500/10'
        : 'border-rose-700/30 bg-rose-500/10';
  return (
    <div
      className={`mb-5 border px-4 py-3 text-sm ${tone}`}
      role={notice.tone === 'error' ? 'alert' : 'status'}
    >
      {notice.message}
    </div>
  );
}

function ReleaseWorkflow({
  bootstrap,
  enabled,
  onCommitted,
}: {
  bootstrap: FrontendOperationalModuleBootstrap;
  enabled: boolean;
  onCommitted: (message: string) => void;
}) {
  const candidates = useMemo(() => {
    const requests = new Map((bootstrap.data.requests ?? []).map((row) => [textValue(row, ['id']), row]));
    return (bootstrap.data.requestLines ?? [])
      .filter((row) => ['READY_TO_RELEASE', 'PARTIALLY_RELEASED'].includes(textValue(row, ['status'])))
      .map((row) => {
        const requestId = textValue(row, ['requestId', 'request_id']);
        const requested = numberValue(row, ['quantity', 'requestedQuantity', 'requested_quantity']);
        const released = numberValue(row, ['releasedQuantity', 'released_quantity']);
        return {
          id: textValue(row, ['id']),
          requestId,
          description:
            textValue(row, ['description']) ||
            textValue(requests.get(requestId) ?? {}, ['purpose']) ||
            requestId,
          department: textValue(requests.get(requestId) ?? {}, ['department']),
          unit: textValue(row, ['unit']),
          remaining: Math.max(0, requested - released),
        };
      })
      .filter((row) => row.id && row.requestId && row.remaining > 0);
  }, [bootstrap]);
  const [selectedId, setSelectedId] = useState('');
  const selected = candidates.find((row) => row.id === selectedId) ?? candidates[0] ?? null;
  const [quantity, setQuantity] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientRole, setRecipientRole] = useState('');
  const [department, setDepartment] = useState('');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<CommitNotice | null>(null);

  useEffect(() => {
    if (!selected) return;
    setQuantity(String(selected.remaining));
    setDepartment(selected.department);
  }, [selected?.id, selected?.remaining, selected?.department]);

  const submit = async () => {
    if (!selected || submitting) return;
    const amount = Number(quantity);
    const fileProblem = evidenceError(file);
    if (!Number.isFinite(amount) || amount <= 0 || amount > selected.remaining) {
      setNotice({ tone: 'error', message: `Enter a release quantity from 1 through ${selected.remaining}.` });
      return;
    }
    if (!recipientName.trim() || !recipientRole.trim() || !department.trim()) {
      setNotice({ tone: 'error', message: 'Recipient name, role, and department are required.' });
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
        evidenceType: 'RELEASE_CONFIRMATION_PHOTO',
        relatedEntityType: 'RELEASE_REQUEST',
        relatedEntityId: selected.requestId,
        requestId: selected.requestId,
        originalFileName: file.name,
        mimeType: file.type,
        base64: await readAsDataUrl(file),
        clientRequestId: operationalClientRequestId('release-evidence', [
          selected.requestId,
          file.name,
          file.size,
          file.lastModified,
        ]),
      });
      const receipt = await frontendBackend.confirmRelease({
        requestId: selected.requestId,
        recipientConfirmed: true,
        recipientName: recipientName.trim(),
        recipientRole: recipientRole.trim(),
        department: department.trim(),
        evidenceId: evidence.evidenceId,
        lines: [{ requestLineId: selected.id, quantity: amount }],
        notes: notes.trim(),
        clientRequestId: operationalClientRequestId('release', [
          bootstrap.scopeRevision.token,
          selected.requestId,
          selected.id,
          amount,
          recipientName.trim(),
          recipientRole.trim(),
          department.trim(),
          evidence.evidenceId,
          notes.trim(),
        ]),
      });
      onCommitted(
        `${receipt.status === 'COMPLETED' ? 'Full' : 'Partial'} release recorded by Worker/D1. The queue, reservation coverage, and inventory ledger were reloaded.`,
      );
    } catch (error) {
      const conflict = error instanceof FrontendApiError && error.status === 409;
      setNotice({
        tone: conflict ? 'warning' : 'error',
        message: conflict
          ? 'The release state changed or this command conflicts with the current reservation. Reload before trying again.'
          : error instanceof FrontendApiError
            ? error.message
            : 'The release could not be recorded. No local success was assumed.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      className="mb-6 border-y border-border bg-card/40 px-4 py-5"
      aria-labelledby="release-operation-title"
    >
      <p className="text-xs font-bold uppercase tracking-[.14em]">Custody operation</p>
      <h2 id="release-operation-title" className="mt-1 font-serif text-2xl">
        Record a physical release
      </h2>
      {!enabled ? (
        <p className="mt-3 text-sm opacity-75">
          This account can read the queue but cannot run the Worker release command or upload its required
          evidence.
        </p>
      ) : !candidates.length ? (
        <p className="mt-3 text-sm opacity-75">
          No request line in this authorized page is ready for physical release.
        </p>
      ) : (
        <div className="mt-4 grid gap-3 lg:grid-cols-2">
          <label className="grid gap-1 text-sm font-semibold">
            Ready request line
            <select
              className="min-h-11 border border-border bg-background px-3"
              value={selected?.id ?? ''}
              onChange={(event) => setSelectedId(event.target.value)}
            >
              {candidates.map((row) => (
                <option key={row.id} value={row.id}>
                  {row.description} · {row.remaining} {row.unit} remaining
                </option>
              ))}
            </select>
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            Quantity to release
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
            Recipient name
            <input
              className="min-h-11 border border-border bg-background px-3"
              value={recipientName}
              onChange={(event) => setRecipientName(event.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            Recipient role
            <input
              className="min-h-11 border border-border bg-background px-3"
              value={recipientRole}
              onChange={(event) => setRecipientRole(event.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            Department
            <input
              className="min-h-11 border border-border bg-background px-3"
              value={department}
              onChange={(event) => setDepartment(event.target.value)}
            />
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            Release evidence
            <input
              className="min-h-11 border border-border bg-background px-3 py-2"
              type="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
            />
          </label>
          <label className="grid gap-1 text-sm font-semibold lg:col-span-2">
            Operational note
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
              {submitting ? 'Recording release…' : 'Confirm recipient and release'}
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
        `${receipt.status === 'RECEIVED' ? 'Full' : 'Partial'} receipt recorded by Worker/D1. Cumulative receiving and the linked inventory movement were reloaded.`,
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
          This account can read restocking data but cannot run the Worker receiving command or upload its
          required evidence.
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
    <div className="mx-auto w-full max-w-[1440px] px-4 py-7 md:px-8 md:py-9" data-operational-module={module}>
      <header className="mb-6 border-b border-border pb-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-3xl">
            <h1 className="font-serif text-3xl leading-tight sm:text-4xl md:text-5xl">{copy.title}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 opacity-75 md:text-base">{copy.summary}</p>
          </div>
          <div className="text-right text-xs opacity-70">
            <p className="font-bold uppercase tracking-[.12em]">
              Real backend ·{' '}
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
          <p className="mt-2 opacity-75">No record was changed, and no fixture data was substituted.</p>
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
          <MutationNotice notice={commitNotice} />
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 border-y border-border bg-muted/40 px-4 py-3 text-sm">
            <span>
              <strong>{totalRows}</strong> authorized rows across {collections.length} operational collections
            </span>
            <span className="opacity-70">
              Revision {bootstrap?.scopeRevision.token} · page {bootstrap?.pagination.page}
            </span>
          </div>
          {module === 'release' && bootstrap ? (
            <ReleaseWorkflow bootstrap={bootstrap} enabled={mutationEnabled} onCommitted={commit} />
          ) : module === 'restocking' && bootstrap ? (
            <RestockWorkflow bootstrap={bootstrap} enabled={mutationEnabled} onCommitted={commit} />
          ) : null}
          <div className="grid gap-4 xl:grid-cols-2">
            {collections.map((collection) => (
              <Collection key={collection.name} name={collection.name} rows={collection.rows} />
            ))}
          </div>
          {module !== 'overview' && module !== 'release' && module !== 'restocking' ? (
            <aside className="mt-5 border-t border-dashed border-border px-1 pt-4 text-sm opacity-75">
              This route is read-only because the current accepted frontend contract does not expose a
              supported mutation for this surface. Existing Worker authorization remains authoritative.
            </aside>
          ) : !mutationEnabled && (module === 'release' || module === 'restocking') ? (
            <aside className="mt-5 border-t border-dashed border-border px-1 pt-4 text-sm opacity-75">
              Mutation controls remain unavailable because this session lacks the exact Worker command or
              evidence capability.
            </aside>
          ) : null}
        </>
      )}
    </div>
  );
}
