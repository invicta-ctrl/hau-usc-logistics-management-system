import { useEffect, useMemo, useRef, useState } from 'react';
import {
  FrontendApiError,
  type FrontendSaveCanvassCommand,
  type FrontendSelectPreferredCanvassCommand,
} from '../../integration/backend';
import { operationalClientRequestId } from './operationUtils';
import type { ProcurementRecord } from './supplyModel';

type CapturedCommand =
  | { kind: 'canvass'; payload: FrontendSaveCanvassCommand }
  | { kind: 'preferred'; payload: FrontendSelectPreferredCanvassCommand };

type Notice = { tone: 'success' | 'error' | 'warning'; message: string } | null;

function today() {
  return new Date().toISOString().slice(0, 10);
}

function initialCanvassForm() {
  return {
    supplierName: '',
    location: '',
    itemSpec: '',
    price: '',
    unit: '',
    receiptStatus: '',
    reliability: '',
    checkedAt: today(),
    sourceUrl: '',
    notes: '',
  };
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'The server did not return a usable response.';
}

function knownRejection(error: unknown) {
  return error instanceof FrontendApiError && error.status >= 400 && error.status < 500;
}

export function CanvassCommandPanel({
  selected,
  canCanvass,
  canSelectPreferred,
  onSaveCanvass,
  onSelectPreferred,
  onRefresh,
  onLockChange,
  onReceipt,
}: {
  selected: ProcurementRecord;
  canCanvass: boolean;
  canSelectPreferred: boolean;
  onSaveCanvass: (command: FrontendSaveCanvassCommand) => Promise<{ canvassId: string }>;
  onSelectPreferred: (command: FrontendSelectPreferredCanvassCommand) => Promise<{ canvassId: string }>;
  onRefresh: () => Promise<void>;
  onLockChange: (locked: boolean) => void;
  onReceipt: (message: string) => void;
}) {
  const [canvassForm, setCanvassForm] = useState(initialCanvassForm);
  const [rationale, setRationale] = useState('');
  const [preferredCanvassId, setPreferredCanvassId] = useState('');
  const [pending, setPending] = useState(false);
  const [captured, setCaptured] = useState<CapturedCommand | null>(null);
  const [receiptRecovery, setReceiptRecovery] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const pendingRef = useRef(false);
  const activeQuotes = useMemo(
    () => selected.quotes.filter((quote) => quote.status === 'ACTIVE' && Boolean(quote.id)),
    [selected.quotes],
  );
  useEffect(() => {
    if (!activeQuotes.some((quote) => quote.id === preferredCanvassId)) {
      setPreferredCanvassId(activeQuotes[0]?.id ?? '');
    }
  }, [activeQuotes, preferredCanvassId]);
  const locked = pending || captured !== null || receiptRecovery;
  const canCreate = canCanvass;
  const canChoosePreferred = canSelectPreferred && activeQuotes.length > 0;
  useEffect(() => {
    setCanvassForm(initialCanvassForm());
    setRationale('');
  }, [selected.id]);

  const run = async (command: CapturedCommand) => {
    if (pendingRef.current) return;
    pendingRef.current = true;
    setPending(true);
    setNotice(null);
    onLockChange(true);
    try {
      const receipt =
        command.kind === 'canvass'
          ? await onSaveCanvass(command.payload)
          : await onSelectPreferred(command.payload);
      if (command.kind === 'canvass') setCanvassForm(initialCanvassForm());
      if (command.kind === 'preferred') setRationale('');
      onReceipt(
        command.kind === 'canvass'
          ? `Canvass reference ${receipt.canvassId} saved.`
          : `Preferred quote ${receipt.canvassId} saved.`,
      );
      try {
        await onRefresh();
        setCaptured(null);
        setReceiptRecovery(false);
        onLockChange(false);
        setNotice({
          tone: 'success',
          message:
            command.kind === 'canvass'
              ? `Canvass reference ${receipt.canvassId} saved. The current server report was refreshed.`
              : `Preferred quote ${receipt.canvassId} saved. The current server report was refreshed.`,
        });
      } catch {
        setCaptured(null);
        setReceiptRecovery(true);
        setNotice({
          tone: 'warning',
          message:
            command.kind === 'canvass'
              ? `Canvass reference ${receipt.canvassId} was saved, but the current server report could not be refreshed. Reload before recording another command.`
              : `Preferred quote ${receipt.canvassId} was saved, but the current server report could not be refreshed. Reload before recording another command.`,
        });
      }
    } catch (error) {
      if (knownRejection(error)) {
        setCaptured(null);
        onLockChange(false);
        setNotice({ tone: 'error', message: errorMessage(error) });
      } else {
        setCaptured(command);
        setNotice({
          tone: 'warning',
          message: 'The server did not confirm this command. Retry the same captured details before recording another command.',
        });
      }
    } finally {
      pendingRef.current = false;
      setPending(false);
    }
  };

  const retryCaptured = () => {
    if (captured) void run(captured);
  };

  const reloadAfterReceipt = () => {
    if (pendingRef.current) return;
    pendingRef.current = true;
    setPending(true);
    setNotice(null);
    void onRefresh()
      .then(() => {
        setReceiptRecovery(false);
        onLockChange(false);
        setNotice({ tone: 'success', message: 'The current server report was refreshed.' });
      })
      .catch((error: unknown) => {
        setNotice({ tone: 'error', message: errorMessage(error) });
      })
      .finally(() => {
        pendingRef.current = false;
        setPending(false);
      });
  };

  return (
    <section className="mt-5 border-t border-border pt-5" aria-labelledby="canvass-command-title">
      <div className="max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-[.14em]">Manage procurement</p>
        <h3 id="canvass-command-title" className="mt-1 font-serif text-2xl">
          Record a supplier quote
        </h3>
        <p className="mt-2 text-sm leading-6 opacity-75">
          Record quote details for the selected deliverable.
        </p>
      </div>

      {notice ? (
        <div className="custody-notice mt-4 px-4 py-3 text-sm" role={notice.tone === 'error' ? 'alert' : 'status'}>
          {notice.message}
        </div>
      ) : null}

      {captured ? (
        <div className="mt-4 flex flex-wrap items-center gap-3 border border-border bg-muted/40 px-4 py-3 text-sm">
          <span>Editing is paused while the unconfirmed command is retried.</span>
          <button
            type="button"
            className="min-h-11 rounded-lg border border-border bg-card px-4 py-2 font-semibold"
            disabled={pending}
            onClick={retryCaptured}
          >
            Retry captured {captured.kind === 'canvass' ? 'quote' : 'preferred quote'}
          </button>
        </div>
      ) : null}

      {receiptRecovery ? (
        <div className="mt-4 flex flex-wrap items-center gap-3 border border-border bg-muted/40 px-4 py-3 text-sm">
          <span>A saved command needs a current server report before another command can be recorded.</span>
          <button
            type="button"
            className="min-h-11 rounded-lg border border-border bg-card px-4 py-2 font-semibold"
            disabled={pending}
            onClick={reloadAfterReceipt}
          >
            Reload server report
          </button>
        </div>
      ) : null}

      {canCreate ? (
        <form
          className="mt-5 grid gap-4 rounded-xl border border-border bg-card p-4 md:grid-cols-2"
          aria-label="Record supplier quote"
          onSubmit={(event) => {
            event.preventDefault();
            if (locked || !canCreate) return;
            const supplierName = canvassForm.supplierName.trim();
            const location = canvassForm.location.trim();
            const itemSpec = canvassForm.itemSpec.trim();
            const price = Number(canvassForm.price);
            const unit = canvassForm.unit.trim();
            const receiptStatus = canvassForm.receiptStatus.trim();
            const reliability = canvassForm.reliability.trim();
            const checkedAt = canvassForm.checkedAt;
            const sourceUrl = canvassForm.sourceUrl.trim();
            const notes = canvassForm.notes.trim();
            const clientRequestId = operationalClientRequestId('canvass', [
              selected.id,
              supplierName,
              location,
              itemSpec,
              price,
              unit,
              receiptStatus,
              reliability,
              checkedAt,
              sourceUrl,
              notes,
            ]);
            const payload: FrontendSaveCanvassCommand = Object.freeze({
              linkedDeliverableId: selected.id,
              supplierName,
              location,
              itemSpec,
              price,
              unit,
              receiptStatus,
              reliability,
              checkedAt,
              sourceUrl,
              notes,
              clientRequestId,
            });
            void run({ kind: 'canvass', payload });
          }}
        >
          <label className="grid gap-1 text-sm font-semibold">
            Supplier name
            <input required maxLength={160} disabled={locked} value={canvassForm.supplierName} onChange={(event) => setCanvassForm({ ...canvassForm, supplierName: event.target.value })} />
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            Supplier location
            <input maxLength={240} disabled={locked} value={canvassForm.location} onChange={(event) => setCanvassForm({ ...canvassForm, location: event.target.value })} />
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            Item specification
            <input required maxLength={500} disabled={locked} value={canvassForm.itemSpec} onChange={(event) => setCanvassForm({ ...canvassForm, itemSpec: event.target.value })} />
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            Unit
            <input required maxLength={80} disabled={locked} value={canvassForm.unit} onChange={(event) => setCanvassForm({ ...canvassForm, unit: event.target.value })} />
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            Price
            <input required min="0.01" step="0.01" type="number" disabled={locked} value={canvassForm.price} onChange={(event) => setCanvassForm({ ...canvassForm, price: event.target.value })} />
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            Checked on
            <input required type="date" disabled={locked} value={canvassForm.checkedAt} onChange={(event) => setCanvassForm({ ...canvassForm, checkedAt: event.target.value })} />
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            Receipt status
            <input maxLength={80} disabled={locked} value={canvassForm.receiptStatus} onChange={(event) => setCanvassForm({ ...canvassForm, receiptStatus: event.target.value })} />
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            Reliability
            <input maxLength={80} disabled={locked} value={canvassForm.reliability} onChange={(event) => setCanvassForm({ ...canvassForm, reliability: event.target.value })} />
          </label>
          <label className="grid gap-1 text-sm font-semibold md:col-span-2">
            Source URL
            <input type="url" maxLength={500} disabled={locked} value={canvassForm.sourceUrl} onChange={(event) => setCanvassForm({ ...canvassForm, sourceUrl: event.target.value })} />
          </label>
          <label className="grid gap-1 text-sm font-semibold md:col-span-2">
            Notes
            <textarea maxLength={1000} disabled={locked} value={canvassForm.notes} onChange={(event) => setCanvassForm({ ...canvassForm, notes: event.target.value })} />
          </label>
          <div className="md:col-span-2">
            <button className="min-h-11 rounded-lg bg-primary px-4 py-2 font-semibold text-primary-foreground" type="submit" disabled={locked}>
              Save supplier quote
            </button>
          </div>
        </form>
      ) : (
        <p className="mt-4 text-sm opacity-75">
          Supplier quote controls are unavailable for this account.
        </p>
      )}

      <section className="mt-5 rounded-xl border border-border bg-card p-4" aria-labelledby="preferred-quote-title">
        <h4 id="preferred-quote-title" className="font-serif text-xl">Choose a preferred quote</h4>
        {activeQuotes.length && canChoosePreferred ? (
          <form
            className="mt-3 grid gap-3"
            aria-label="Choose preferred quote"
            onSubmit={(event) => {
              event.preventDefault();
              if (locked || !canChoosePreferred) return;
              const selectedCanvassId = preferredCanvassId;
              const selectedRationale = rationale.trim();
              const clientRequestId = operationalClientRequestId('preferred-canvass', [
                selectedCanvassId,
                selectedRationale,
              ]);
              const payload: FrontendSelectPreferredCanvassCommand = Object.freeze({
                canvassId: selectedCanvassId,
                rationale: selectedRationale,
                clientRequestId,
              });
              void run({ kind: 'preferred', payload });
            }}
          >
            <label className="grid gap-1 text-sm font-semibold">
              Active quote
              <select
                required
                disabled={locked}
                value={preferredCanvassId}
                onChange={(event) => setPreferredCanvassId(event.target.value)}
              >
                {activeQuotes.map((quote) => (
                  <option key={quote.id} value={quote.id}>
                    {quote.supplierName} · {quote.id} · {quote.price} {quote.unit}
                  </option>
                ))}
              </select>
            </label>
            <label className="grid gap-1 text-sm font-semibold">
              Rationale
              <input required maxLength={500} disabled={locked} value={rationale} onChange={(event) => setRationale(event.target.value)} />
            </label>
            <div>
              <button className="min-h-11 rounded-lg border border-border px-4 py-2 font-semibold" type="submit" disabled={locked}>
                Save preferred quote
              </button>
            </div>
          </form>
        ) : activeQuotes.length ? (
          <p className="mt-2 text-sm opacity-75">Preferred-quote controls are unavailable for this account.</p>
        ) : (
          <p className="mt-2 text-sm opacity-75">No active server-provided quotes are available for this deliverable.</p>
        )}
      </section>
    </section>
  );
}
