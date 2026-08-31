import { useEffect, useMemo, useRef, useState } from 'react';
import {
  FrontendApiError,
  frontendBackend,
  type FrontendOperationalModuleBootstrap,
} from '../../integration/backend';
import { useDialogFocusTrap } from '../hooks/useDialogFocusTrap';
import {
  evidenceByteDigest,
  evidenceError,
  operationalClientRequestId,
  readAsDataUrl,
  readable,
} from './operationUtils';
import { receivingCandidatesFromBootstrap, receivingConsequence, receivingRecheckIssue } from './supplyModel';

/* Hallmark · design-system: DESIGN.md · macrostructure: Focused receiving station · mode: operate */

type CommitNotice = { tone: 'success' | 'error' | 'warning'; message: string };
const RECEIVING_MODAL_BACKGROUND = [
  '.auth-shell__sidebar',
  '.auth-shell__topbar',
  '.auth-shell__dock',
  '[data-receiving-station-background]',
].join(',');

function MutationNotice({ notice }: { notice: CommitNotice | null }) {
  if (!notice) return null;
  return (
    <div
      className={`custody-notice custody-notice--${notice.tone} px-4 py-3 text-sm`}
      role={notice.tone === 'error' ? 'alert' : 'status'}
    >
      {notice.message}
    </div>
  );
}

function ReceivingSummary({
  record,
  item,
  quantity,
  requested,
  prior,
  after,
  outstanding,
  supplier,
  evidence,
  consequence,
}: {
  record: string;
  item: string;
  quantity: string;
  requested: string;
  prior: string;
  after: string;
  outstanding: string;
  supplier: string;
  evidence: string;
  consequence: string;
}) {
  const entries = [
    ['Record', record],
    ['Item', item],
    ['Approved total', requested],
    ['This receipt', quantity],
    ['Prior cumulative', prior],
    ['Cumulative after', after],
    ['Outstanding after', outstanding],
    ['Supplier reference', supplier],
    ['Protected evidence', evidence],
    ['Consequence', consequence],
  ];
  return (
    <section className="custody-summary" aria-label="Receiving consequence summary">
      <p className="custody-summary__heading">Review before recording</p>
      <dl className="custody-summary__grid">
        {entries.map(([label, value]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function ReceivingStation({
  bootstrap,
  enabled,
  onCommitted,
}: {
  bootstrap: FrontendOperationalModuleBootstrap;
  enabled: boolean;
  onCommitted: (message: string) => void;
}) {
  const [authority, setAuthority] = useState(bootstrap);
  const candidates = useMemo(() => receivingCandidatesFromBootstrap(authority), [authority]);
  const [selectedId, setSelectedId] = useState('');
  const selected = candidates.find((row) => row.id === selectedId) ?? candidates[0] ?? null;
  const [quantity, setQuantity] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submissionPhase, setSubmissionPhase] = useState<'idle' | 'rechecking' | 'recording'>('idle');
  const [notice, setNotice] = useState<CommitNotice | null>(null);
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);
  const confirmationRef = useRef<HTMLElement | null>(null);

  useDialogFocusTrap({
    open: confirmationOpen,
    dialogRef: confirmationRef,
    inertSelector: RECEIVING_MODAL_BACKGROUND,
  });

  useEffect(() => setAuthority(bootstrap), [bootstrap]);

  useEffect(() => {
    if (!selected) {
      setConfirmationOpen(false);
      return;
    }
    setSelectedId(selected.id);
    setQuantity(String(selected.remaining));
    setInvoiceNumber('');
    setNotes('');
    setFile(null);
    setNotice(null);
    setAcknowledged(false);
    setConfirmationOpen(false);
  }, [selected?.id]);

  useEffect(() => {
    if (!confirmationOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || submitting) return;
      event.preventDefault();
      setConfirmationOpen(false);
      setAcknowledged(false);
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [confirmationOpen, submitting]);

  const amount = Number(quantity);
  const consequence = selected
    ? receivingConsequence(selected, amount)
    : 'Select an open restock record to review its receiving consequence.';
  const cumulativeAfter = selected && Number.isSafeInteger(amount) ? selected.received + amount : 0;

  const draftProblem = () => {
    if (!selected) return 'Select an open restock record.';
    if (!Number.isSafeInteger(amount) || amount <= 0 || amount > selected.remaining) {
      return `Enter a positive whole-number receiving quantity no greater than ${selected.remaining} ${selected.unit}.`;
    }
    if (selected.preferredQuoteConflict) {
      return 'This record has conflicting preferred supplier references. Resolve that procurement state before receiving.';
    }
    return evidenceError(file);
  };

  const reviewReceipt = () => {
    const problem = draftProblem();
    if (problem) {
      setNotice({ tone: 'error', message: problem });
      return;
    }
    setNotice(null);
    setAcknowledged(false);
    setConfirmationOpen(true);
  };

  const recordReceipt = async () => {
    if (!selected || !file || submitting || !acknowledged) return;
    const before = selected;
    setSubmitting(true);
    setSubmissionPhase('rechecking');
    setNotice(null);
    try {
      const latest = await frontendBackend.operationalModuleBootstrap('restocking');
      const freshCandidates = receivingCandidatesFromBootstrap(latest);
      const after = freshCandidates.find((candidate) => candidate.id === before.id) ?? null;
      const recheckIssue = receivingRecheckIssue({ before, after, quantity: amount });
      setAuthority(latest);
      if (recheckIssue || !after) {
        setConfirmationOpen(false);
        setAcknowledged(false);
        setNotice({
          tone: 'warning',
          message: `Authoritative recheck stopped this receipt. ${recheckIssue} Review the refreshed record before trying again.`,
        });
        return;
      }

      setSubmissionPhase('recording');
      const [base64, contentDigest] = await Promise.all([readAsDataUrl(file), evidenceByteDigest(file)]);
      const evidence = await frontendBackend.uploadOperationalEvidence({
        evidenceType: 'RESTOCK_RECEIPT',
        relatedEntityType: 'RESTOCK',
        relatedEntityId: after.id,
        restockId: after.id,
        originalFileName: file.name,
        mimeType: file.type,
        base64,
        clientRequestId: operationalClientRequestId('restock-evidence', [
          after.id,
          file.name,
          file.size,
          file.lastModified,
          file.type,
          contentDigest,
        ]),
      });
      const receipt = await frontendBackend.receiveRestock({
        restockRequestId: after.id,
        quantity: amount,
        unit: after.unit,
        evidenceId: evidence.evidenceId,
        invoiceStatus: invoiceNumber.trim() ? 'RECORDED' : 'NOT_REPORTED',
        invoiceNumber: invoiceNumber.trim(),
        notes: notes.trim(),
        clientRequestId: operationalClientRequestId('restock', [
          after.id,
          after.revision,
          after.status,
          after.requested,
          after.received,
          amount,
          after.unit,
          evidence.evidenceId,
          invoiceNumber.trim(),
          notes.trim(),
        ]),
      });
      setConfirmationOpen(false);
      setAcknowledged(false);
      onCommitted(
        `${receipt.status === 'RECEIVED' ? 'Full' : 'Partial'} receipt ${receipt.receiptId} recorded. Cumulative receiving is ${receipt.cumulativeReceived}; ${receipt.remaining} remains. Receiving state and bounded receipt history are reloading.`,
      );
    } catch (error) {
      const conflict = error instanceof FrontendApiError && error.status === 409;
      let conflictRefreshed = false;
      if (conflict) {
        try {
          setAuthority(await frontendBackend.operationalModuleBootstrap('restocking'));
          conflictRefreshed = true;
        } catch {
          // Keep the last verified authority and require an explicit route reload below.
        }
      }
      setConfirmationOpen(false);
      setAcknowledged(false);
      setNotice({
        tone: conflict ? 'warning' : 'error',
        message: conflict
          ? `The authoritative receiving state changed during confirmation. No receipt was assumed; ${
              conflictRefreshed
                ? 'review the refreshed record before retrying.'
                : 'reload the receiving workspace before retrying.'
            }`
          : error instanceof FrontendApiError
            ? `${error.message} No receipt was assumed; governed evidence may already be staged.`
            : 'The receipt could not be recorded. No receipt was assumed; governed evidence may already be staged.',
      });
    } finally {
      setSubmitting(false);
      setSubmissionPhase('idle');
    }
  };

  return (
    <section className="mb-6" aria-labelledby="receiving-operation-title" data-receiving-station>
      <div className="border-y border-border bg-card/40 px-4 py-5" data-receiving-station-background>
        <p className="text-xs font-bold uppercase tracking-[.14em]">Focused receiving station</p>
        <h2 id="receiving-operation-title" className="mt-1 font-serif text-2xl">
          Open restock to cumulative inventory receipt
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 opacity-75">
          Select one open record, verify the quantity and evidence, and review the exact inventory
          consequence. The final action reloads authorized receiving truth before it uploads evidence or
          records a receipt.
        </p>
      </div>

      {!candidates.length ? (
        <div className="border-b border-border px-4 py-10 text-center" data-receiving-station-background>
          <p className="font-semibold">No restock records are open for receiving</p>
          <p className="mt-1 text-sm opacity-70">
            No authorized restock record in this page has an outstanding receivable quantity.
          </p>
        </div>
      ) : (
        <div className="supply-station__layout mt-4" data-receiving-station-background>
          <section
            className="rounded-xl border border-border bg-card p-4"
            aria-labelledby="receiving-open-title"
          >
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.12em] opacity-70">Step 1</p>
                <h3 id="receiving-open-title" className="mt-1 font-serif text-2xl">
                  Open receiving records
                </h3>
              </div>
              <span className="font-mono text-xs opacity-70">{candidates.length} loaded</span>
            </div>
            <div className="supply-record-list">
              {candidates.map((candidate) => (
                <button
                  type="button"
                  key={candidate.id}
                  aria-current={selected?.id === candidate.id ? 'true' : undefined}
                  disabled={submitting}
                  onClick={() => setSelectedId(candidate.id)}
                >
                  <strong>{candidate.itemName}</strong>
                  <small>{candidate.id}</small>
                  <small>
                    {candidate.received} of {candidate.requested} {candidate.unit} received ·{' '}
                    {readable(candidate.status)}
                  </small>
                </button>
              ))}
            </div>
          </section>

          {selected ? (
            <section
              className="rounded-xl border border-border bg-card p-4"
              aria-labelledby="receiving-form-title"
            >
              <div className="border-b border-border pb-4">
                <p className="text-xs font-bold uppercase tracking-[.12em] opacity-70">Steps 2–5</p>
                <h3 id="receiving-form-title" className="mt-1 font-serif text-2xl">
                  Quantity, invoice, evidence, consequence
                </h3>
                <p className="mt-2 text-sm opacity-70">
                  {selected.id} · {selected.itemName} · {selected.remaining} {selected.unit} outstanding
                </p>
              </div>

              {selected.preferredQuoteConflict ? (
                <p className="custody-notice custody-notice--warning mt-4 px-4 py-3 text-sm">
                  Multiple active preferred supplier references are reported. Receiving is blocked until the
                  procurement record has one authoritative preference.
                </p>
              ) : null}

              {!enabled ? (
                <p className="custody-notice custody-notice--warning mt-4 px-4 py-3 text-sm">
                  This account can inspect receiving records but cannot record receipts or upload the required
                  governed evidence.
                </p>
              ) : (
                <form
                  className="mt-4 grid gap-4"
                  onSubmit={(event) => {
                    event.preventDefault();
                    reviewReceipt();
                  }}
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="grid gap-1 text-sm font-semibold">
                      Quantity received now
                      <input
                        className="min-h-11 rounded-lg border border-border bg-background px-3"
                        type="number"
                        inputMode="numeric"
                        min="1"
                        max={selected.remaining}
                        step="1"
                        value={quantity}
                        onChange={(event) => setQuantity(event.target.value)}
                      />
                    </label>
                    <label className="grid gap-1 text-sm font-semibold">
                      Invoice number (optional)
                      <input
                        className="min-h-11 rounded-lg border border-border bg-background px-3"
                        autoComplete="off"
                        value={invoiceNumber}
                        onChange={(event) => setInvoiceNumber(event.target.value)}
                      />
                    </label>
                    <label className="grid gap-1 text-sm font-semibold sm:col-span-2">
                      Governed receiving evidence
                      <input
                        className="min-h-11 rounded-lg border border-border bg-background px-3 py-2"
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
                        onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                      />
                      <small className="font-normal leading-5 opacity-70">
                        Private JPG, PNG, WEBP, or PDF · maximum 10 MB. Upload begins only after the final
                        authoritative recheck.
                      </small>
                    </label>
                    <label className="grid gap-1 text-sm font-semibold sm:col-span-2">
                      Receiving note (optional)
                      <textarea
                        className="min-h-20 rounded-lg border border-border bg-background px-3 py-2"
                        value={notes}
                        onChange={(event) => setNotes(event.target.value)}
                      />
                    </label>
                  </div>

                  <ReceivingSummary
                    record={selected.id}
                    item={selected.itemName}
                    quantity={
                      Number.isSafeInteger(amount) && amount > 0
                        ? `${amount} ${selected.unit}`
                        : 'Not complete'
                    }
                    requested={`${selected.requested} ${selected.unit}`}
                    prior={`${selected.received} of ${selected.requested} ${selected.unit}`}
                    after={
                      Number.isSafeInteger(amount) && amount > 0
                        ? `${cumulativeAfter} of ${selected.requested} ${selected.unit}`
                        : 'Not complete'
                    }
                    outstanding={
                      Number.isSafeInteger(amount) && amount > 0 && amount <= selected.remaining
                        ? `${selected.remaining - amount} ${selected.unit}`
                        : 'Not complete'
                    }
                    supplier={
                      selected.supplierName
                        ? `${selected.supplierName}${
                            selected.preferredPrice
                              ? ` · ${selected.preferredPrice.toLocaleString()} per ${selected.unit}`
                              : ''
                          }`
                        : 'No preferred supplier reference loaded in this page'
                    }
                    evidence={file?.name || 'Not selected'}
                    consequence={consequence}
                  />

                  <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-between">
                    <button
                      type="button"
                      className="min-h-11 rounded-lg border border-border px-4 font-semibold"
                      onClick={() => setQuantity(String(selected.remaining))}
                    >
                      Use full outstanding quantity
                    </button>
                    <button
                      type="submit"
                      className="min-h-11 rounded-lg bg-primary px-4 font-semibold text-primary-foreground disabled:opacity-60"
                      disabled={submitting || selected.preferredQuoteConflict}
                    >
                      Review receiving consequence
                    </button>
                  </div>
                  <MutationNotice notice={notice} />
                </form>
              )}
            </section>
          ) : null}
        </div>
      )}

      {confirmationOpen && selected ? (
        <div className="release-confirmation-backdrop">
          <section
            ref={confirmationRef}
            className="release-confirmation p-5"
            role="dialog"
            aria-modal="true"
            aria-labelledby="receiving-confirmation-title"
            tabIndex={-1}
          >
            <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.12em] opacity-70">Final confirmation</p>
                <h3 id="receiving-confirmation-title" className="mt-1 font-serif text-3xl">
                  Recheck and record receipt
                </h3>
              </div>
              <button
                type="button"
                aria-label="Close receiving confirmation"
                className="grid h-11 w-11 place-items-center rounded-lg border border-border text-xl"
                disabled={submitting}
                onClick={() => {
                  setConfirmationOpen(false);
                  setAcknowledged(false);
                }}
              >
                ×
              </button>
            </div>
            <div className="grid gap-4 pt-4">
              <p className="m-0 text-sm leading-6 opacity-75">
                The first confirmation action reloads this authorized restock record. Evidence and the receipt
                command proceed only if its identity, revision, cumulative quantity, unit, and status still
                match.
              </p>
              <ReceivingSummary
                record={selected.id}
                item={selected.itemName}
                quantity={`${amount} ${selected.unit}`}
                requested={`${selected.requested} ${selected.unit}`}
                prior={`${selected.received} of ${selected.requested} ${selected.unit}`}
                after={`${cumulativeAfter} of ${selected.requested} ${selected.unit}`}
                outstanding={`${selected.remaining - amount} ${selected.unit}`}
                supplier={selected.supplierName || 'No preferred supplier reference loaded in this page'}
                evidence={file?.name || 'Not selected'}
                consequence={consequence}
              />
              <label className="flex gap-3 rounded-lg border border-border bg-muted p-3 text-sm leading-6">
                <input
                  data-dialog-initial-focus
                  className="mt-1 h-4 w-4 shrink-0"
                  type="checkbox"
                  checked={acknowledged}
                  disabled={submitting}
                  onChange={(event) => setAcknowledged(event.target.checked)}
                />
                <span>
                  I verified the record, item, quantity, prior cumulative total, evidence, and inventory
                  consequence shown above.
                </span>
              </label>
              <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                <button
                  type="button"
                  className="min-h-11 rounded-lg border border-border px-4 font-semibold"
                  disabled={submitting}
                  onClick={() => {
                    setConfirmationOpen(false);
                    setAcknowledged(false);
                  }}
                >
                  Return to receiving
                </button>
                <button
                  type="button"
                  className="min-h-11 rounded-lg bg-primary px-4 font-semibold text-primary-foreground disabled:opacity-60"
                  disabled={!acknowledged || submitting}
                  onClick={() => void recordReceipt()}
                >
                  {submissionPhase === 'rechecking'
                    ? 'Rechecking authorized quantity…'
                    : submissionPhase === 'recording'
                      ? 'Recording receipt…'
                      : 'Recheck and record receipt'}
                </button>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}
