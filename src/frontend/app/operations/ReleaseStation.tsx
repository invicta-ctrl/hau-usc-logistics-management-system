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
import { releaseCandidatesFromBootstrap, releaseConsequence, releaseRecheckIssue } from './releaseModel';

/* Hallmark · design-system: DESIGN.md · macrostructure: Focused custody station · mode: operate */

type CommitNotice = { tone: 'success' | 'error' | 'warning'; message: string };
const RELEASE_MODAL_BACKGROUND = [
  '.auth-shell__sidebar',
  '.auth-shell__topbar',
  '.auth-shell__dock',
  '[data-release-station-background]',
].join(',');

function MutationNotice({ notice }: { notice: CommitNotice | null }) {
  if (!notice) return null;
  return (
    <div
      className={`custody-notice custody-notice--${notice.tone} mb-5 px-4 py-3 text-sm`}
      role={notice.tone === 'error' ? 'alert' : 'status'}
    >
      {notice.message}
    </div>
  );
}

function CustodySummary({
  record,
  recipient,
  item,
  quantity,
  consequence,
  evidence,
}: {
  record: string;
  recipient: string;
  item: string;
  quantity: string;
  consequence: string;
  evidence?: string;
}) {
  const entries = [
    ['Record', record],
    ['Person / recipient', recipient],
    ['Item', item],
    ['Quantity', quantity],
    ...(evidence ? [['Protected evidence', evidence]] : []),
    ['Consequence', consequence],
  ];
  return (
    <section className="custody-summary" aria-label="Release consequence summary">
      <p className="custody-summary__heading">Review before recording</p>
      <dl className="custody-summary__grid">
        {entries.map(([entryLabel, entryValue]) => (
          <div key={entryLabel}>
            <dt>{entryLabel}</dt>
            <dd>{entryValue}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function ReleaseStation({
  bootstrap,
  enabled,
  onCommitted,
}: {
  bootstrap: FrontendOperationalModuleBootstrap;
  enabled: boolean;
  onCommitted: (message: string) => void;
}) {
  const [authority, setAuthority] = useState(bootstrap);
  const candidates = useMemo(() => releaseCandidatesFromBootstrap(authority), [authority]);
  const [selectedId, setSelectedId] = useState('');
  const selected = candidates.find((row) => row.id === selectedId) ?? candidates[0] ?? null;
  const [quantity, setQuantity] = useState('');
  const [recipientName, setRecipientName] = useState('');
  const [recipientRole, setRecipientRole] = useState('');
  const [department, setDepartment] = useState('');
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
    inertSelector: RELEASE_MODAL_BACKGROUND,
  });

  useEffect(() => setAuthority(bootstrap), [bootstrap]);

  useEffect(() => {
    if (!selected) {
      setConfirmationOpen(false);
      return;
    }
    setSelectedId(selected.id);
    setQuantity(String(selected.remaining));
    setRecipientName('');
    setRecipientRole('');
    setDepartment(selected.department);
    setNotes('');
    setFile(null);
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
  const consequence =
    selected && Number.isFinite(amount) && amount > 0
      ? releaseConsequence(selected, amount)
      : 'Enter a valid quantity to see the exact release consequence.';

  const draftProblem = () => {
    if (!selected) return 'Select a ready record.';
    if (!Number.isFinite(amount) || !Number.isInteger(amount) || amount <= 0 || amount > selected.remaining) {
      return `Enter a whole-number release quantity from 1 through ${selected.remaining}.`;
    }
    if (!recipientName.trim() || !recipientRole.trim() || !department.trim()) {
      return 'Recipient name, role, and department are required.';
    }
    return evidenceError(file);
  };

  const reviewRelease = () => {
    const problem = draftProblem();
    if (problem) {
      setNotice({ tone: 'error', message: problem });
      return;
    }
    setNotice(null);
    setAcknowledged(false);
    setConfirmationOpen(true);
  };

  const recordRelease = async () => {
    if (!selected || !file || submitting || !acknowledged) return;
    const before = selected;
    setSubmitting(true);
    setSubmissionPhase('rechecking');
    setNotice(null);
    try {
      const latest = await frontendBackend.operationalModuleBootstrap('release');
      const freshCandidates = releaseCandidatesFromBootstrap(latest);
      const after = freshCandidates.find((candidate) => candidate.id === before.id) ?? null;
      const recheckIssue = releaseRecheckIssue({ before, after, quantity: amount });
      setAuthority(latest);
      if (recheckIssue || !after) {
        setConfirmationOpen(false);
        setAcknowledged(false);
        setNotice({
          tone: 'warning',
          message: `Authoritative recheck stopped this release. ${recheckIssue} Review the refreshed ready record before trying again.`,
        });
        return;
      }

      setSubmissionPhase('recording');
      const [base64, contentDigest] = await Promise.all([readAsDataUrl(file), evidenceByteDigest(file)]);
      const evidence = await frontendBackend.uploadOperationalEvidence({
        evidenceType: 'RELEASE_CONFIRMATION_PHOTO',
        relatedEntityType: 'RELEASE_REQUEST',
        relatedEntityId: after.requestId,
        requestId: after.requestId,
        originalFileName: file.name,
        mimeType: file.type,
        base64,
        clientRequestId: operationalClientRequestId('release-evidence', [
          after.requestId,
          after.id,
          file.name,
          file.size,
          file.lastModified,
          file.type,
          contentDigest,
        ]),
      });
      const receipt = await frontendBackend.confirmRelease({
        requestId: after.requestId,
        recipientConfirmed: true,
        recipientName: recipientName.trim(),
        recipientRole: recipientRole.trim(),
        department: department.trim(),
        evidenceId: evidence.evidenceId,
        lines: [{ requestLineId: after.id, quantity: amount }],
        notes: notes.trim(),
        clientRequestId: operationalClientRequestId('release', [
          after.requestId,
          after.id,
          after.revision,
          after.status,
          after.requested,
          after.released,
          amount,
          recipientName.trim(),
          recipientRole.trim(),
          department.trim(),
          evidence.evidenceId,
          notes.trim(),
        ]),
      });
      setConfirmationOpen(false);
      setAcknowledged(false);
      onCommitted(
        `${receipt.status === 'COMPLETED' ? 'Full' : 'Partial'} release ${receipt.releaseId} recorded. Ready work, reservation coverage, inventory, and receipt history are reloading.`,
      );
    } catch (error) {
      const conflict = error instanceof FrontendApiError && error.status === 409;
      let conflictRefreshed = false;
      if (conflict) {
        try {
          setAuthority(await frontendBackend.operationalModuleBootstrap('release'));
          conflictRefreshed = true;
        } catch {
          // Keep the last verified authority and require an explicit reload below.
        }
      }
      setConfirmationOpen(false);
      setAcknowledged(false);
      setNotice({
        tone: conflict ? 'warning' : 'error',
        message: conflict
          ? `The authoritative release state changed during confirmation. No release receipt was assumed; ${
              conflictRefreshed
                ? 'review the refreshed record before retrying.'
                : 'reload the Release Desk before retrying.'
            }`
          : error instanceof FrontendApiError
            ? `${error.message} No release receipt was assumed; governed evidence may already be staged.`
            : 'The release could not be recorded. No release receipt was assumed; governed evidence may already be staged.',
      });
    } finally {
      setSubmitting(false);
      setSubmissionPhase('idle');
    }
  };

  return (
    <section className="mb-6" aria-labelledby="release-operation-title" data-release-station>
      <div className="border-y border-border bg-card/40 px-4 py-5" data-release-station-background>
        <p className="text-xs font-bold uppercase tracking-[.14em]">Focused custody station</p>
        <h2 id="release-operation-title" className="mt-1 font-serif text-2xl">
          Ready record to verified release
        </h2>
        <p className="mt-2 max-w-3xl text-sm leading-6 opacity-75">
          Choose one ready line. The final action loads a fresh authorized Release Desk record before it
          uploads evidence or asks the server to record inventory movement, custody, receipt, and audit
          history.
        </p>
      </div>

      {!candidates.length ? (
        <div className="border-b border-border px-4 py-10 text-center" data-release-station-background>
          <p className="font-semibold">No ready release records</p>
          <p className="mt-1 text-sm opacity-70">
            No request line in this authorized page is currently ready for physical release.
          </p>
        </div>
      ) : (
        <div className="release-station__layout mt-4" data-release-station-background>
          <section
            className="rounded-xl border border-border bg-card p-4"
            aria-labelledby="release-ready-title"
          >
            <div className="mb-4 flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.12em] opacity-70">Step 1</p>
                <h3 id="release-ready-title" className="mt-1 font-serif text-2xl">
                  Ready records
                </h3>
              </div>
              <span className="font-mono text-xs opacity-70">{candidates.length} loaded</span>
            </div>
            <div className="release-ready-list">
              {candidates.map((candidate) => (
                <button
                  type="button"
                  key={candidate.id}
                  aria-current={selected?.id === candidate.id ? 'true' : undefined}
                  disabled={submitting}
                  onClick={() => {
                    setNotice(null);
                    setSelectedId(candidate.id);
                  }}
                >
                  <strong>{candidate.itemName}</strong>
                  <small>
                    {candidate.requestId} · line {candidate.id}
                  </small>
                  <small>
                    {candidate.remaining} {candidate.unit} remaining · {readable(candidate.status)}
                  </small>
                </button>
              ))}
            </div>
          </section>

          {selected ? (
            <section
              className="rounded-xl border border-border bg-card p-4"
              aria-labelledby="release-form-title"
            >
              <div className="border-b border-border pb-4">
                <p className="text-xs font-bold uppercase tracking-[.12em] opacity-70">Steps 2–5</p>
                <h3 id="release-form-title" className="mt-1 font-serif text-2xl">
                  Recipient, quantity, evidence, consequence
                </h3>
                <p className="mt-2 text-sm opacity-70">
                  {selected.requestId} · line {selected.id} · {selected.itemName}
                </p>
              </div>

              {!enabled ? (
                <p className="custody-notice custody-notice--warning mt-4 px-4 py-3 text-sm">
                  This account can inspect ready records but cannot record releases or upload the required
                  governed evidence.
                </p>
              ) : (
                <form
                  className="mt-4 grid gap-4"
                  onSubmit={(event) => {
                    event.preventDefault();
                    reviewRelease();
                  }}
                >
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="grid gap-1 text-sm font-semibold">
                      Recipient name
                      <input
                        className="min-h-11 rounded-lg border border-border bg-background px-3"
                        autoComplete="off"
                        value={recipientName}
                        onChange={(event) => setRecipientName(event.target.value)}
                      />
                    </label>
                    <label className="grid gap-1 text-sm font-semibold">
                      Recipient role
                      <input
                        className="min-h-11 rounded-lg border border-border bg-background px-3"
                        autoComplete="off"
                        value={recipientRole}
                        onChange={(event) => setRecipientRole(event.target.value)}
                      />
                    </label>
                    <label className="grid gap-1 text-sm font-semibold">
                      Department
                      <input
                        className="min-h-11 rounded-lg border border-border bg-background px-3"
                        autoComplete="organization"
                        value={department}
                        onChange={(event) => setDepartment(event.target.value)}
                      />
                    </label>
                    <label className="grid gap-1 text-sm font-semibold">
                      Quantity to release
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
                    <label className="grid gap-1 text-sm font-semibold sm:col-span-2">
                      Governed release evidence
                      <input
                        className="min-h-11 rounded-lg border border-border bg-background px-3 py-2"
                        type="file"
                        accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
                        onChange={(event) => setFile(event.target.files?.[0] ?? null)}
                      />
                      <small className="font-normal leading-5 opacity-70">
                        Private JPG, PNG, WEBP, or PDF · maximum 10 MB. The file is uploaded only after the
                        final authoritative recheck.
                      </small>
                    </label>
                    <label className="grid gap-1 text-sm font-semibold sm:col-span-2">
                      Operational note (optional)
                      <textarea
                        className="min-h-20 rounded-lg border border-border bg-background px-3 py-2"
                        value={notes}
                        onChange={(event) => setNotes(event.target.value)}
                      />
                    </label>
                  </div>

                  <CustodySummary
                    record={`${selected.requestId} · line ${selected.id}`}
                    recipient={
                      recipientName.trim()
                        ? `${recipientName.trim()} · ${recipientRole.trim() || 'role incomplete'} · ${
                            department.trim() || 'department incomplete'
                          }`
                        : 'Recipient not complete'
                    }
                    item={selected.itemName}
                    quantity={
                      Number.isFinite(amount) && amount > 0
                        ? `${amount} ${selected.unit} of ${selected.remaining} remaining`
                        : 'Quantity not complete'
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
                      Use full remaining quantity
                    </button>
                    <button
                      type="submit"
                      className="min-h-11 rounded-lg bg-primary px-4 font-semibold text-primary-foreground disabled:opacity-60"
                      disabled={submitting}
                    >
                      Review release consequence
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
            aria-labelledby="release-confirmation-title"
            tabIndex={-1}
          >
            <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[.12em] opacity-70">Final confirmation</p>
                <h3 id="release-confirmation-title" className="mt-1 font-serif text-3xl">
                  Recheck and record release
                </h3>
              </div>
              <button
                type="button"
                aria-label="Close release confirmation"
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
                The first confirmation action loads a fresh authorized record. Evidence is uploaded and the
                release command is sent only if this exact line and quantity remain releasable.
              </p>
              <CustodySummary
                record={`${selected.requestId} · line ${selected.id}`}
                recipient={`${recipientName.trim()} · ${recipientRole.trim()} · ${department.trim()}`}
                item={selected.itemName}
                quantity={`${amount} ${selected.unit} of ${selected.remaining} remaining`}
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
                  <strong className="block">I verified the record, recipient, item, and quantity.</strong>
                  <small className="mt-1 block opacity-75">
                    I understand that server acceptance records physical inventory movement, recipient
                    custody, receipt history, and an audit event.
                  </small>
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
                  Return to record
                </button>
                <button
                  type="button"
                  className="min-h-11 rounded-lg bg-primary px-4 font-semibold text-primary-foreground disabled:opacity-60"
                  disabled={!acknowledged || submitting}
                  onClick={() => void recordRelease()}
                >
                  {submissionPhase === 'rechecking'
                    ? 'Rechecking authority…'
                    : submissionPhase === 'recording'
                      ? 'Recording release…'
                      : 'Recheck and record release'}
                </button>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}
