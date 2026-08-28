import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type ReactNode } from 'react';
import {
  AlertTriangle,
  Camera,
  CheckCircle2,
  CircleAlert,
  ClipboardCheck,
  LoaderCircle,
  PackageCheck,
  RefreshCw,
  Search,
  ShieldAlert,
  X,
} from 'lucide-react';
import {
  FrontendApiError,
  frontendBackend,
  type FrontendEvidenceReceipt,
  type FrontendLendingAssetOption,
  type FrontendLendingBootstrap,
  type FrontendLendingInventoryItem,
  type FrontendLendingTicket,
} from '../../integration/backend';
import type { Route } from '../appTypes';
import { useDialogFocusTrap } from '../hooks/useDialogFocusTrap';

const PAGE_SIZE = 25;
const DECISIONS = ['APPROVE', 'PARTIAL_APPROVE', 'SUBSTITUTE', 'REJECT'] as const;
const RETURN_CONDITIONS = [
  'GOOD',
  'FAIR',
  'POOR',
  'MAINTENANCE_REQUIRED',
  'DAMAGED_BEYOND_USE',
  'LOST',
] as const;
const EVIDENCE_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'application/pdf']);

type Decision = (typeof DECISIONS)[number];
type ReturnCondition = (typeof RETURN_CONDITIONS)[number];
type LoadState = 'loading' | 'refreshing' | 'ready' | 'error' | 'denied' | 'stale';
type DialogKind = 'review' | 'handoff' | 'return' | null;
type Notice = {
  tone: 'success' | 'warning' | 'error';
  title: string;
  message: string;
  correlationId?: string;
  refetch?: boolean;
};
type ReviewDraft = {
  decision: Decision;
  identityVerified: boolean;
  approvedQuantity: string;
  substitutionItemId: string;
  reason: string;
  note: string;
  assetIds: string[];
};
type HandoffDraft = { condition: string; note: string; acknowledged: boolean };
type ReturnDraft = {
  condition: ReturnCondition;
  returned: string;
  lost: string;
  damaged: string;
  note: string;
  acknowledged: boolean;
  file: File | null;
  evidence: FrontendEvidenceReceipt | null;
};

const EMPTY_QUEUE: FrontendLendingBootstrap = {
  lendingTickets: [],
  inventoryItems: [],
  pagination: { page: 1, pageSize: PAGE_SIZE, total: 0, hasMore: false },
  scopeRevision: { token: 'not-loaded', updatedAt: '' },
};

/** A4 local-only data. It is never used by an authenticated route. */
const PREVIEW_QUEUE: FrontendLendingBootstrap = {
  lendingTickets: [
    {
      id: 'LEND-PREVIEW-REVIEW',
      itemId: 'ITM-PREVIEW-CHAIR',
      requestedItemId: 'ITM-PREVIEW-CHAIR',
      quantity: 2,
      requestedQuantity: 2,
      unit: 'piece',
      studentIdNumber: '20260041',
      borrowerName: 'Preview Angelite',
      borrowerType: 'ANGELITE',
      department: 'Preview Department',
      contact: 'Preview-only contact',
      email: 'preview.borrower@local.invalid',
      courseYear: 'Preview course/year',
      positionRole: '',
      purpose: 'Deterministic review fixture',
      dueAt: '2026-09-14T17:00:00.000Z',
      requestedStartAt: '2026-09-09T09:00:00.000Z',
      requestedEndAt: '2026-09-14T17:00:00.000Z',
      ticketType: 'LOAN',
      status: 'FOR_REVIEW',
      reviewDecision: '',
      reviewNotes: '',
      rejectionReason: '',
      substitutionNote: '',
      eligibilitySource: '',
      eligibilityReviewedBy: '',
      eligibilityReviewedAt: '',
      assetOptions: [
        {
          id: 'AST-PREVIEW-1',
          itemId: 'ITM-PREVIEW-CHAIR',
          assetTag: 'PREVIEW-CHAIR-1',
          serialNumber: '',
          condition: 'GOOD',
          status: 'AVAILABLE',
        },
        {
          id: 'AST-PREVIEW-2',
          itemId: 'ITM-PREVIEW-CHAIR',
          assetTag: 'PREVIEW-CHAIR-2',
          serialNumber: '',
          condition: 'GOOD',
          status: 'AVAILABLE',
        },
      ],
      history: [
        {
          previousStatus: '',
          newStatus: 'FOR_REVIEW',
          changedAt: '2026-08-24T09:00:00.000Z',
          changedBy: 'Preview fixture',
    reason: 'Preview inspection seed',
          metadata: {},
        },
      ],
      createdAt: '2026-08-24T09:00:00.000Z',
      updatedAt: '2026-08-24T09:00:00.000Z',
    },
    {
      id: 'LEND-PREVIEW-CLAIM',
      itemId: 'ITM-PREVIEW-MARKER',
      requestedItemId: 'ITM-PREVIEW-MARKER',
      quantity: 24,
      requestedQuantity: 24,
      unit: 'piece',
      studentIdNumber: '',
      borrowerName: 'Preview Office',
      borrowerType: 'USC_STAFF',
      department: 'Preview Office',
      contact: 'Preview-only contact',
      email: 'preview.office@local.invalid',
      courseYear: '',
      positionRole: 'Officer',
      purpose: 'Deterministic issue fixture',
      dueAt: '',
      requestedStartAt: '2026-09-09T09:00:00.000Z',
      requestedEndAt: '',
      ticketType: 'CONSUMABLE',
      status: 'READY_TO_CLAIM',
      reviewDecision: 'APPROVE',
      reviewNotes: 'Fixture approval',
      rejectionReason: '',
      substitutionNote: '',
      eligibilitySource: 'APPROVED_ACTIVE_USC_SOURCE',
      eligibilityReviewedBy: 'Preview operator',
      eligibilityReviewedAt: '2026-08-24T09:30:00.000Z',
      assetOptions: [],
      history: [
        {
          previousStatus: 'FOR_REVIEW',
          newStatus: 'READY_TO_CLAIM',
          changedAt: '2026-08-24T09:30:00.000Z',
          changedBy: 'Preview fixture',
          reason: 'Fixture approval',
          metadata: {},
        },
      ],
      createdAt: '2026-08-24T09:00:00.000Z',
      updatedAt: '2026-08-24T09:30:00.000Z',
    },
    {
      id: 'LEND-PREVIEW-RETURN',
      itemId: 'ITM-PREVIEW-MIC',
      requestedItemId: 'ITM-PREVIEW-MIC',
      quantity: 1,
      requestedQuantity: 1,
      unit: 'piece',
      studentIdNumber: '20260042',
      borrowerName: 'Preview Custodian',
      borrowerType: 'ANGELITE',
      department: 'Preview Department',
      contact: 'Preview-only contact',
      email: 'preview.custody@local.invalid',
      courseYear: 'Preview course/year',
      positionRole: '',
      purpose: 'Deterministic return fixture',
      dueAt: '2020-09-01T17:00:00.000Z',
      requestedStartAt: '2020-08-25T09:00:00.000Z',
      requestedEndAt: '2020-09-01T17:00:00.000Z',
      ticketType: 'LOAN',
      status: 'ON_LOAN',
      reviewDecision: 'APPROVE',
      reviewNotes: 'Fixture approval',
      rejectionReason: '',
      substitutionNote: '',
      eligibilitySource: 'APPROVED_ANGELITE_IDENTITY_RULE',
      eligibilityReviewedBy: 'Preview operator',
      eligibilityReviewedAt: '2020-08-24T09:30:00.000Z',
      assetOptions: [],
      history: [
        {
          previousStatus: 'READY_TO_CLAIM',
          newStatus: 'ON_LOAN',
          changedAt: '2020-08-25T09:00:00.000Z',
          changedBy: 'Preview fixture',
          reason: 'Fixture handoff',
          metadata: {},
        },
      ],
      createdAt: '2020-08-24T09:00:00.000Z',
      updatedAt: '2020-08-25T09:00:00.000Z',
    },
  ],
  inventoryItems: [
    {
      id: 'ITM-PREVIEW-CHAIR',
      name: 'Preview folding chair',
      category: 'Furniture',
      unit: 'piece',
      status: 'ACTIVE',
      catalogType: 'OFFICE_INVENTORY',
      stockArea: 'Preview stock area',
      isLendable: true,
      lendingKind: 'REUSABLE',
      lendingStatus: 'ACTIVE',
      lendingAudience: 'ANGELITE_AND_USC_STAFF',
      eligibilityRule: 'Preview identity rule',
      conditionTracked: true,
      conditionReviewState: 'ASSESSED',
      maintenanceReviewState: 'CURRENT',
      lendableAvailable: 2,
      availableAssets: 2,
      traceableAssets: 2,
      maximumLoanQuantity: 2,
    },
    {
      id: 'ITM-PREVIEW-MARKER',
      name: 'Preview marker pens',
      category: 'Office supplies',
      unit: 'piece',
      status: 'ACTIVE',
      catalogType: 'OFFICE_INVENTORY',
      stockArea: 'Preview stock area',
      isLendable: true,
      lendingKind: 'CONSUMABLE',
      lendingStatus: 'ACTIVE',
      lendingAudience: 'ANGELITE_AND_USC_STAFF',
      eligibilityRule: 'Preview identity rule',
      conditionTracked: false,
      lendableAvailable: 72,
      maximumLoanQuantity: 24,
    },
    {
      id: 'ITM-PREVIEW-MIC',
      name: 'Preview wireless microphone',
      category: 'AV equipment',
      unit: 'piece',
      status: 'ACTIVE',
      catalogType: 'OFFICE_INVENTORY',
      stockArea: 'Preview stock area',
      isLendable: true,
      lendingKind: 'REUSABLE',
      lendingStatus: 'ACTIVE',
      lendingAudience: 'ANGELITE_AND_USC_STAFF',
      eligibilityRule: 'Preview identity rule',
      conditionTracked: true,
      conditionReviewState: 'ASSESSED',
      maintenanceReviewState: 'CURRENT',
      lendableAvailable: 0,
      availableAssets: 0,
      traceableAssets: 1,
      maximumLoanQuantity: 1,
    },
  ],
  pagination: { page: 1, pageSize: PAGE_SIZE, total: 3, hasMore: false },
  scopeRevision: { token: 'preview-fi07-r1', updatedAt: '2026-08-24T00:00:00.000Z' },
};

function label(value: string) {
  return value
    ? value
        .replaceAll('_', ' ')
        .toLowerCase()
        .replace(/\b\w/g, (letter) => letter.toUpperCase())
    : 'Not reported';
}

function date(value: string) {
  if (!value) return 'Not reported';
  const parsed = new Date(value);
  return Number.isNaN(parsed.valueOf())
    ? value
    : new Intl.DateTimeFormat('en-PH', { day: '2-digit', month: 'short', year: 'numeric' }).format(parsed);
}

function dateTime(value: string) {
  if (!value) return 'Not reported';
  const parsed = new Date(value);
  return Number.isNaN(parsed.valueOf())
    ? value
    : new Intl.DateTimeFormat('en-PH', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(parsed);
}

function numberValue(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}

export function borrowerLabel(ticket: Pick<FrontendLendingTicket, 'borrowerName'>) {
  return ticket.borrowerName || 'Borrower not reported';
}

/** Ticket reachability is page-local: the bootstrap total/hasMore describe inventory, not tickets. */
export function canAdvanceLendingPage(
  queue: Pick<FrontendLendingBootstrap, 'lendingTickets' | 'pagination'>,
) {
  return queue.lendingTickets.length === queue.pagination.pageSize;
}

export function derivedLendingStatus(
  ticket: Pick<FrontendLendingTicket, 'status' | 'dueAt'>,
  now = Date.now(),
) {
  if (ticket.status !== 'ON_LOAN' || !ticket.dueAt) return ticket.status;
  const due = new Date(ticket.dueAt).valueOf();
  return Number.isFinite(due) && due < now ? 'OVERDUE' : ticket.status;
}

function statusClasses(status: string) {
  const values: Record<string, string> = {
    FOR_REVIEW: 'border-amber-700/30 bg-amber-500/15 text-amber-900',
    READY_TO_CLAIM: 'border-sky-700/30 bg-sky-500/15 text-sky-900',
    ON_LOAN: 'border-violet-700/30 bg-violet-500/15 text-violet-900',
    OVERDUE: 'border-rose-700/30 bg-rose-500/15 text-rose-900',
    RETURNED: 'border-emerald-700/30 bg-emerald-500/15 text-emerald-900',
    COMPLETED: 'border-emerald-700/30 bg-emerald-500/15 text-emerald-900',
    REJECTED: 'border-rose-700/30 bg-rose-500/15 text-rose-900',
  };
  return values[status] ?? 'border-stone-500/30 bg-stone-500/10 text-stone-700';
}

function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={
        'inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-semibold ' +
        statusClasses(status)
      }
    >
      {label(status)}
    </span>
  );
}

function itemFor(ticket: FrontendLendingTicket, items: FrontendLendingInventoryItem[]) {
  return items.find((item) => item.id === ticket.itemId) ?? null;
}

function requestedItemFor(ticket: FrontendLendingTicket, items: FrontendLendingInventoryItem[]) {
  return items.find((item) => item.id === ticket.requestedItemId) ?? null;
}

function identityFor(ticket: FrontendLendingTicket) {
  const staff = ticket.borrowerType === 'USC_STAFF';
  return {
    source: staff ? 'APPROVED_ACTIVE_USC_SOURCE' : 'APPROVED_ANGELITE_IDENTITY_RULE',
    label: staff ? 'Approved active USC officer/staff source' : 'Approved Angelite/student identity rule',
    instruction: staff
      ? 'Confirm active status through the approved USC officer/staff source. An email domain alone is not sufficient.'
      : 'Confirm using the approved Angelite/student institutional identity rule before approval.',
  };
}

function reviewDraftFor(ticket: FrontendLendingTicket): ReviewDraft {
  return {
    decision: 'APPROVE',
    identityVerified: false,
    approvedQuantity: String(ticket.requestedQuantity),
    substitutionItemId: '',
    reason: '',
    note: '',
    assetIds: [],
  };
}

function dialogMatchesStatus(dialog: DialogKind, status: string) {
  return (
    dialog === null ||
    (dialog === 'review' && status === 'FOR_REVIEW') ||
    (dialog === 'handoff' && status === 'READY_TO_CLAIM') ||
    (dialog === 'return' && status === 'ON_LOAN')
  );
}

function returnDraftFor(ticket: FrontendLendingTicket): ReturnDraft {
  return {
    condition: 'GOOD',
    returned: String(ticket.quantity),
    lost: '0',
    damaged: '0',
    note: '',
    acknowledged: false,
    file: null,
    evidence: null,
  };
}

export function lendingCommandSignature(input: {
  verb: 'review' | 'handoff' | 'evidence' | 'return';
  ticketId: string;
  revision: string;
  values: Record<string, string | number | boolean | string[] | undefined>;
}) {
  const sorted = Object.entries(input.values)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(
      ([key, value]) =>
        key + '=' + (Array.isArray(value) ? [...value].sort().join(',') : String(value ?? '')),
    )
    .join('|');
  return [input.verb, input.ticketId, input.revision, sorted].join('|');
}

export function lendingClientRequestId(input: Parameters<typeof lendingCommandSignature>[0]) {
  let hash = 2166136261;
  for (const character of lendingCommandSignature(input))
    hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  return 'fi07-' + input.verb + '-' + input.ticketId + '-' + (hash >>> 0).toString(36);
}

export function returnReconciliationError(input: {
  quantity: number;
  returned: number;
  lost: number;
  damaged: number;
  condition: ReturnCondition;
  note: string;
  item: Pick<FrontendLendingInventoryItem, 'lendingKind' | 'traceableAssets'> | null;
}) {
  if (![input.returned, input.lost, input.damaged].every((value) => Number.isFinite(value) && value >= 0)) {
    return 'Enter a non-negative quantity for every return outcome.';
  }
  if (Math.abs(input.returned + input.lost + input.damaged - input.quantity) > 0.000001) {
    return 'Returned, lost, and damaged-beyond-use quantities must exactly equal the quantity on loan.';
  }
  if (!input.item) {
    return 'The canonical return inventory item is not projected; return outcomes cannot be reconciled.';
  }
  const traceabilityIsKnownAggregate =
    input.item.lendingKind === 'REUSABLE' &&
    Number.isInteger(input.item.traceableAssets) &&
    input.item.traceableAssets === 0;
  const mustUseOneOutcomeBucket = input.item.lendingKind !== 'CONSUMABLE' && !traceabilityIsKnownAggregate;
  if (
    mustUseOneOutcomeBucket &&
    [input.returned, input.lost, input.damaged].filter((value) => value > 0).length !== 1
  ) {
    return 'Traceable or unprojected reusable returns require exactly one nonzero outcome bucket because one lifecycle condition applies to every assigned asset.';
  }
  if (input.lost > 0 && input.damaged > 0) {
    return 'A single return condition cannot truthfully represent both lost and damaged-beyond-use outcomes.';
  }
  if (input.condition === 'LOST' && input.lost <= 0) {
    return 'Lost condition requires a positive lost quantity.';
  }
  if (input.condition === 'DAMAGED_BEYOND_USE' && input.damaged <= 0) {
    return 'Damaged-beyond-use condition requires a positive damaged-beyond-use quantity.';
  }
  if (
    input.condition !== 'LOST' &&
    input.condition !== 'DAMAGED_BEYOND_USE' &&
    (input.lost > 0 || input.damaged > 0)
  ) {
    return 'Lost or damaged-beyond-use quantities require the matching return condition.';
  }
  if ((input.lost > 0 || input.damaged > 0) && !input.note.trim()) {
    return 'An inspection note is required for lost or damaged-beyond-use quantities.';
  }
  return '';
}

export function reviewCandidateAssets(
  ticket: Pick<FrontendLendingTicket, 'status' | 'assetOptions'>,
  targetItemId: string,
) {
  if (ticket.status !== 'FOR_REVIEW') return [];
  return ticket.assetOptions.filter((asset) => asset.itemId === targetItemId && asset.status === 'AVAILABLE');
}

export function traceableReviewError(input: {
  item: Pick<FrontendLendingInventoryItem, 'lendingKind' | 'traceableAssets'> | null;
  targetItemId: string;
  candidates: FrontendLendingAssetOption[];
  quantity: number;
  assetIds: string[];
}) {
  if (!input.item)
    return 'The canonical target inventory item is not projected; reusable assignment is unavailable.';
  if (input.item.lendingKind === 'CONSUMABLE') {
    return input.assetIds.length ? 'Consumable approvals cannot include traceable asset assignments.' : '';
  }
  if (input.item.lendingKind !== 'REUSABLE') {
    return 'The canonical target lending kind is unavailable; traceable assignment cannot be verified.';
  }
  if (input.item.traceableAssets === undefined) {
    return 'Traceable asset assignment is unavailable because the canonical target inventory projection is redacted.';
  }
  if (input.item.traceableAssets === 0) {
    return input.assetIds.length
      ? 'This target has no traceable assets; do not submit asset assignments.'
      : '';
  }
  if (!Number.isInteger(input.quantity)) {
    return 'Traceable reusable approval requires a whole-unit approved quantity.';
  }
  const validIds = new Set(
    input.candidates
      .filter((asset) => asset.itemId === input.targetItemId && asset.status === 'AVAILABLE')
      .map((asset) => asset.id),
  );
  if (validIds.size < input.quantity) {
    return 'There are not enough matching available review candidates for the requested traceable assignment.';
  }
  const selectedIds = new Set(input.assetIds);
  if (
    input.assetIds.length !== input.quantity ||
    selectedIds.size !== input.quantity ||
    [...selectedIds].some((id) => !validIds.has(id))
  ) {
    return 'Choose exactly the approved quantity of valid matching available review candidates.';
  }
  return '';
}

function fileError(file: File | null) {
  if (!file) return 'Select the governed return photo or document before confirming the return.';
  if (!EVIDENCE_MIME_TYPES.has(file.type)) return 'Use a JPG, PNG, WEBP, or PDF return photo/document.';
  if (file.size <= 0) return 'The selected return evidence file is empty.';
  if (file.size > 10 * 1024 * 1024) return 'The selected return evidence file exceeds the 10 MB limit.';
  const extension = file.name.split('.').at(-1)?.toLowerCase() ?? '';
  const extensions: Record<string, string[]> = {
    'image/jpeg': ['jpg', 'jpeg'],
    'image/png': ['png'],
    'image/webp': ['webp'],
    'application/pdf': ['pdf'],
  };
  return extensions[file.type]?.includes(extension)
    ? ''
    : 'The file extension must match the selected evidence type.';
}

function readAsBase64(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('The return evidence file could not be read.'));
    reader.onload = () => resolve(String(reader.result ?? ''));
    reader.readAsDataURL(file);
  });
}

/** The content digest is used only while constructing the evidence idempotency command. */
export async function evidenceByteDigest(file: Pick<File, 'arrayBuffer'>) {
  if (!globalThis.crypto?.subtle) {
    throw new Error('Secure evidence identity is unavailable in this browser.');
  }
  const digest = await globalThis.crypto.subtle.digest('SHA-256', await file.arrayBuffer());
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

function Modal({
  title,
  eyebrow,
  onClose,
  children,
}: {
  title: string;
  eyebrow: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const ref = useRef<HTMLElement | null>(null);
  useDialogFocusTrap({ open: true, dialogRef: ref });
  return (
    <div className="fixed inset-0 z-[90] grid place-items-center bg-black/55 p-4">
      <section
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="fi07-modal-title"
        tabIndex={-1}
        className="max-h-[calc(100vh-2rem)] w-full max-w-2xl overflow-auto rounded-xl border border-[var(--border-paper)] bg-[var(--paper-mid)] p-5 text-[var(--ink-deep)] shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[var(--border-paper)] pb-4">
          <div>
            <p className="m-0 font-mono text-[11px] font-semibold uppercase tracking-[.08em] text-[var(--ink-mid)]">
              {eyebrow}
            </p>
            <h2 id="fi07-modal-title" className="mt-1 font-serif text-3xl">
              {title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close confirmation"
            className="grid h-11 w-11 place-items-center rounded-lg border border-[var(--border-paper)]"
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}

function Field({
  label: fieldLabel,
  children,
  detail,
}: {
  label: string;
  children: ReactNode;
  detail?: string;
}) {
  return (
    <label className="grid gap-1.5 text-xs font-semibold text-[var(--ink-mid)]">
      <span>{fieldLabel}</span>
      {children}
      {detail ? <small className="font-normal leading-5">{detail}</small> : null}
    </label>
  );
}

function KeyValue({ label: keyLabel, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-mono text-[10px] uppercase tracking-[.05em] text-[var(--ink-mid)]">{keyLabel}</dt>
      <dd className="m-0 mt-1 break-words text-xs leading-5">{value || 'Not reported'}</dd>
    </div>
  );
}

export function InternalLendingHub({
  dark,
  navigate,
  inspection = false,
  canApproveLending = false,
  canHandoffLending = false,
  canReturnLending = false,
  canUploadLendingEvidence = false,
}: {
  dark: boolean;
  navigate: (route: Route) => void;
  inspection?: boolean;
  canApproveLending?: boolean;
  canHandoffLending?: boolean;
  canReturnLending?: boolean;
  canUploadLendingEvidence?: boolean;
}) {
  const [queue, setQueue] = useState<FrontendLendingBootstrap>(inspection ? PREVIEW_QUEUE : EMPTY_QUEUE);
  const queueRef = useRef(queue);
  const [loadState, setLoadState] = useState<LoadState>(inspection ? 'ready' : 'loading');
  const [refreshEpoch, setRefreshEpoch] = useState(0);
  const [page, setPage] = useState(1);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('ALL');
  const [selected, setSelected] = useState<FrontendLendingTicket | null>(null);
  const [dialog, setDialog] = useState<DialogKind>(null);
  const [review, setReview] = useState<ReviewDraft | null>(null);
  const [handoff, setHandoff] = useState<HandoffDraft>({ condition: 'GOOD', note: '', acknowledged: false });
  const [returnState, setReturnState] = useState<ReturnDraft | null>(null);
  const [inlineError, setInlineError] = useState('');
  const [notice, setNotice] = useState<Notice | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const inFlight = useRef(false);
  const triggerRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const inspectorRef = useRef<HTMLElement | null>(null);
  const queueFallbackRef = useRef<HTMLInputElement | null>(null);
  const selectedRef = useRef<FrontendLendingTicket | null>(selected);
  const dialogRef = useRef<DialogKind>(dialog);
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);
  useEffect(() => {
    dialogRef.current = dialog;
  }, [dialog]);
  useDialogFocusTrap({ open: Boolean(selected) && !dialog, dialogRef: inspectorRef });

  const restoreQueueFocus = useCallback((ticketId?: string) => {
    requestAnimationFrame(() => {
      const matches = ticketId
        ? Array.from(document.querySelectorAll<HTMLButtonElement>('[data-ticket-trigger="' + ticketId + '"]'))
        : [];
      const visible = matches.find((button) => button.offsetParent !== null);
      (visible ?? (ticketId ? triggerRefs.current[ticketId] : null) ?? queueFallbackRef.current)?.focus({
        preventScroll: true,
      });
    });
  }, []);

  const clearSelection = useCallback(
    (ticketId?: string, restoreFocus = true) => {
      selectedRef.current = null;
      dialogRef.current = null;
      setSelected(null);
      setDialog(null);
      setReview(null);
      setHandoff({ condition: 'GOOD', note: '', acknowledged: false });
      setReturnState(null);
      setInlineError('');
      if (restoreFocus) restoreQueueFocus(ticketId);
    },
    [restoreQueueFocus],
  );

  const refetch = useCallback(() => {
    if (!inspection) setRefreshEpoch((value) => value + 1);
  }, [inspection]);

  const goToPage = useCallback(
    (nextPage: number) => {
      if (inspection || nextPage < 1) return;
      clearSelection(undefined);
      setPage(nextPage);
    },
    [clearSelection, inspection],
  );

  useEffect(() => {
    if (inspection) return;
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, [inspection]);

  useEffect(() => {
    if (inspection) return;
    const controller = new AbortController();
    setLoadState(queueRef.current.lendingTickets.length ? 'refreshing' : 'loading');
    void frontendBackend
      .lendingBootstrap({ page, pageSize: PAGE_SIZE, signal: controller.signal })
      .then((next) => {
        if (controller.signal.aborted) return;
        queueRef.current = next;
        setQueue(next);
        const current = selectedRef.current;
        if (current) {
          const replacement = next.lendingTickets.find((ticket) => ticket.id === current.id) ?? null;
          if (!replacement) {
            clearSelection(undefined);
            setNotice({
              tone: 'warning',
              title: 'Selected ticket is no longer on this loaded page',
              message:
                'The authoritative reload no longer projects that ticket here. Its dialog and draft were closed before any action could be submitted.',
            });
          } else {
            selectedRef.current = replacement;
            setSelected(replacement);
            if (!dialogMatchesStatus(dialogRef.current, replacement.status)) {
              dialogRef.current = null;
              setDialog(null);
              setInlineError('');
              setNotice({
                tone: 'warning',
                title: 'Selected ticket lifecycle changed',
                message:
                  'The authoritative record is now ' +
                  label(replacement.status) +
                  '. Its no-longer-applicable confirmation dialog was closed.',
              });
            }
          }
        }
        setLoadState('ready');
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setLoadState(
          error instanceof FrontendApiError && [401, 403].includes(error.status)
            ? 'denied'
            : queueRef.current.lendingTickets.length
              ? 'stale'
              : 'error',
        );
      });
    return () => controller.abort();
  }, [clearSelection, inspection, page, refreshEpoch]);

  useEffect(() => {
    if (!selected && !dialog) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [dialog, selected]);

  const closeInspector = useCallback(() => {
    const id = selected?.id;
    clearSelection(id);
  }, [clearSelection, selected?.id]);

  useEffect(() => {
    if (!selected) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      event.preventDefault();
      if (dialog) {
        setDialog(null);
        setInlineError('');
      } else closeInspector();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [closeInspector, dialog, selected]);

  const visible = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return queue.lendingTickets.filter((ticket) => {
      const status = derivedLendingStatus(ticket, now);
      const filterMatch = filter === 'ALL' || filter === status || filter === ticket.status;
      const text = [
        ticket.id,
        ticket.borrowerName,
        ticket.department,
        ticket.purpose,
        itemFor(ticket, queue.inventoryItems)?.name ?? '',
      ]
        .join(' ')
        .toLowerCase();
      return filterMatch && (!needle || text.includes(needle));
    });
  }, [filter, now, query, queue.inventoryItems, queue.lendingTickets]);

  const selectTicket = useCallback((ticket: FrontendLendingTicket, trigger?: HTMLButtonElement) => {
    if (trigger) triggerRefs.current[ticket.id] = trigger;
    selectedRef.current = ticket;
    dialogRef.current = null;
    setSelected(ticket);
    setReview(reviewDraftFor(ticket));
    setHandoff({ condition: 'GOOD', note: '', acknowledged: false });
    setReturnState(returnDraftFor(ticket));
    setDialog(null);
    setInlineError('');
  }, []);

  const previewTransition = useCallback(
    (status: string, title: string, message: string) => {
      if (!selected) return;
      setQueue((current) => {
        const next = {
          ...current,
          lendingTickets: current.lendingTickets.map((ticket) =>
            ticket.id === selected.id
              ? {
                  ...ticket,
                  status,
                  updatedAt: '2026-08-24T10:00:00.000Z',
                  history: [
                    ...ticket.history,
                    {
                      previousStatus: ticket.status,
                      newStatus: status,
                      changedAt: '2026-08-24T10:00:00.000Z',
                      changedBy: 'Preview fixture',
                      reason: 'Local-only FI-07 demonstration',
                      metadata: {},
                    },
                  ],
                }
              : ticket,
          ),
        };
        queueRef.current = next;
        return next;
      });
      setSelected((ticket) => {
        const next = ticket ? { ...ticket, status, updatedAt: '2026-08-24T10:00:00.000Z' } : null;
        selectedRef.current = next;
        return next;
      });
      dialogRef.current = null;
      setDialog(null);
      setInlineError('');
      setNotice({ tone: 'success', title, message });
    },
    [selected],
  );

  const failed = useCallback(
    (error: unknown, fallback: string) => {
      const api = error instanceof FrontendApiError ? error : null;
      const conflict = api?.status === 409;
      const denied = api?.status === 403;
      const message = api?.message || fallback;
      setInlineError(message);
      setNotice({
        tone: conflict ? 'warning' : 'error',
        title: conflict
          ? 'The lending record changed on the server'
          : denied
            ? 'This action is not permitted'
            : 'The action was not recorded',
        message: conflict
          ? message + ' The authoritative queue will be refreshed; review the current record before retrying.'
          : message,
        correlationId: api?.correlationId || undefined,
        refetch: conflict || denied,
      });
      if (conflict || denied) refetch();
    },
    [refetch],
  );

  const complete = useCallback(
    (next: Notice) => {
      setNotice(next);
      dialogRef.current = null;
      setDialog(null);
      setInlineError('');
      refetch();
    },
    [refetch],
  );

  const submitReview = useCallback(async () => {
    if (!selected || !review || submitting || inFlight.current) return;
    if (loadState !== 'ready')
      return setInlineError('Actions are paused until the authoritative queue reloads.');
    const quantity = numberValue(review.approvedQuantity);
    const targetItem = review.decision === 'SUBSTITUTE' ? review.substitutionItemId : selected.itemId;
    const targetInventoryItem = queue.inventoryItems.find((item) => item.id === targetItem) ?? null;
    const options = reviewCandidateAssets(selected, targetItem);
    if (review.decision !== 'REJECT' && !review.identityVerified)
      return setInlineError('Confirm the required borrower identity source before approval.');
    if (review.decision !== 'REJECT' && (!Number.isFinite(quantity) || quantity <= 0))
      return setInlineError('Enter a positive approved quantity.');
    if (review.decision === 'APPROVE' && quantity !== selected.requestedQuantity)
      return setInlineError(
        'Approve must keep the full requested quantity. Choose Partial approve for a lower amount.',
      );
    if (review.decision === 'PARTIAL_APPROVE' && quantity >= selected.requestedQuantity)
      return setInlineError('Partial approve must be lower than the requested quantity.');
    if (review.decision === 'SUBSTITUTE' && (!targetItem || targetItem === selected.itemId))
      return setInlineError('Choose a different canonical lending item for substitution.');
    if (review.decision !== 'APPROVE' && !review.reason.trim())
      return setInlineError('Record a reason for partial approval, substitution, or rejection.');
    if (review.decision !== 'REJECT') {
      const assignmentError = traceableReviewError({
        item: targetInventoryItem,
        targetItemId: targetItem,
        candidates: options,
        quantity,
        assetIds: review.assetIds,
      });
      if (assignmentError) return setInlineError(assignmentError);
    }
    if (inspection) {
      previewTransition(
        review.decision === 'REJECT' ? 'REJECTED' : 'READY_TO_CLAIM',
        'Local lending review demonstrated',
        'This fixture-only review did not contact a protected service or change a business record.',
      );
      return;
    }
    inFlight.current = true;
    setSubmitting(true);
    setInlineError('');
    setNotice(null);
    try {
      const identity = identityFor(selected);
      const result = await frontendBackend.approveLendingTicket({
        ticketId: selected.id,
        decision: review.decision,
        ...(review.decision === 'REJECT'
          ? {}
          : {
              identityVerified: true,
              identityVerificationSource: identity.source,
              approvedQuantity: quantity,
              ...(review.decision === 'SUBSTITUTE' ? { substitutionItemId: targetItem } : {}),
              ...(targetInventoryItem?.lendingKind === 'REUSABLE' && targetInventoryItem.traceableAssets! > 0
                ? { assetIds: review.assetIds }
                : {}),
            }),
        ...(review.decision !== 'APPROVE' ? { reviewReason: review.reason.trim() } : {}),
        ...(review.note.trim() ? { reviewNotes: review.note.trim() } : {}),
        clientRequestId: lendingClientRequestId({
          verb: 'review',
          ticketId: selected.id,
          revision: selected.updatedAt,
          values: {
            decision: review.decision,
            identity: review.identityVerified,
            quantity,
            targetItem,
            reason: review.reason.trim(),
            note: review.note.trim(),
            assetIds: review.assetIds,
          },
        }),
      });
      complete({
        tone: 'success',
        title: 'Server lending review recorded',
        message:
          result.ticketId +
          ' is now ' +
          label(result.status) +
          (result.replayed ? ' (idempotent replay).' : '.'),
        correlationId: result.correlationId || undefined,
      });
    } catch (error) {
      failed(error, 'The lending review could not be recorded. No local success was assumed.');
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  }, [
    complete,
    failed,
    inspection,
    loadState,
    previewTransition,
    queue.inventoryItems,
    review,
    selected,
    submitting,
  ]);

  const submitHandoff = useCallback(async () => {
    if (!selected || submitting || inFlight.current) return;
    if (loadState !== 'ready')
      return setInlineError('Actions are paused until the authoritative queue reloads.');
    if (!handoff.acknowledged)
      return setInlineError('Acknowledge the custody consequence before recording this handoff or issue.');
    if (inspection) {
      previewTransition(
        selected.ticketType === 'CONSUMABLE' ? 'COMPLETED' : 'ON_LOAN',
        'Local custody action demonstrated',
        'This fixture-only handoff or issue did not contact a protected service or create a ledger movement.',
      );
      return;
    }
    inFlight.current = true;
    setSubmitting(true);
    setInlineError('');
    setNotice(null);
    try {
      const result = await frontendBackend.confirmLendingHandoff({
        ticketId: selected.id,
        ...(handoff.condition.trim() ? { conditionLabel: handoff.condition.trim() } : {}),
        ...(handoff.note.trim() ? { notes: handoff.note.trim() } : {}),
        clientRequestId: lendingClientRequestId({
          verb: 'handoff',
          ticketId: selected.id,
          revision: selected.updatedAt,
          values: { condition: handoff.condition.trim(), note: handoff.note.trim() },
        }),
      });
      complete({
        tone: 'success',
        title: selected.ticketType === 'CONSUMABLE' ? 'Server issue recorded' : 'Server handoff recorded',
        message:
          result.ticketId +
          ' is now ' +
          label(result.status) +
          (result.replayed ? ' (idempotent replay).' : '.'),
        correlationId: result.correlationId || undefined,
      });
    } catch (error) {
      failed(error, 'The custody action could not be recorded. No local success was assumed.');
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  }, [complete, failed, handoff, inspection, loadState, previewTransition, selected, submitting]);

  const submitReturn = useCallback(async () => {
    if (!selected || !returnState || submitting || inFlight.current) return;
    if (loadState !== 'ready')
      return setInlineError('Actions are paused until the authoritative queue reloads.');
    const returned = numberValue(returnState.returned);
    const lost = numberValue(returnState.lost);
    const damaged = numberValue(returnState.damaged);
    const reconciliation = returnReconciliationError({
      quantity: selected.quantity,
      returned,
      lost,
      damaged,
      condition: returnState.condition,
      note: returnState.note,
      item: itemFor(selected, queue.inventoryItems),
    });
    if (reconciliation) return setInlineError(reconciliation);
    if (!returnState.acknowledged)
      return setInlineError('Acknowledge the return and custody consequence before confirming.');
    if (inspection) {
      previewTransition(
        'RETURNED',
        'Local return demonstrated',
        'This fixture-only return did not upload evidence, contact a protected service, or create a custody or ledger record.',
      );
      return;
    }
    const evidenceIssue = returnState.evidence ? '' : fileError(returnState.file);
    if (evidenceIssue) return setInlineError(evidenceIssue);
    inFlight.current = true;
    setSubmitting(true);
    setInlineError('');
    setNotice(null);
    try {
      let evidence = returnState.evidence;
      if (!evidence) {
        const file = returnState.file!;
        const contentDigest = await evidenceByteDigest(file);
        evidence = await frontendBackend.uploadLendingReturnEvidence({
          evidenceType: 'LENDING_RETURN_PHOTO',
          relatedEntityType: 'LENDING',
          relatedEntityId: selected.id,
          lendingTicketId: selected.id,
          originalFileName: file.name,
          mimeType: file.type,
          base64: await readAsBase64(file),
          clientRequestId: lendingClientRequestId({
            verb: 'evidence',
            ticketId: selected.id,
            revision: selected.updatedAt,
            values: {
              name: file.name,
              size: file.size,
              modified: file.lastModified,
              type: file.type,
              sha256: contentDigest,
            },
          }),
        });
        setReturnState((current) => (current ? { ...current, evidence } : current));
      }
      const result = await frontendBackend.confirmLendingReturn({
        ticketId: selected.id,
        conditionLabel: returnState.condition,
        evidenceId: evidence.evidenceId,
        returnedQuantity: returned,
        lostQuantity: lost,
        damagedBeyondUseQuantity: damaged,
        ...(returnState.note.trim() ? { notes: returnState.note.trim() } : {}),
        clientRequestId: lendingClientRequestId({
          verb: 'return',
          ticketId: selected.id,
          revision: selected.updatedAt,
          values: {
            condition: returnState.condition,
            evidence: evidence.evidenceId,
            returned,
            lost,
            damaged,
            note: returnState.note.trim(),
          },
        }),
      });
      complete({
        tone: 'success',
        title: 'Server return recorded',
        message:
          result.ticketId +
          ' is now ' +
          label(result.status) +
          (result.replayed ? ' (idempotent replay).' : '.'),
        correlationId: result.correlationId || evidence.correlationId || undefined,
      });
    } catch (error) {
      failed(error, 'The return could not be recorded. No local success was assumed.');
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  }, [
    complete,
    failed,
    inspection,
    loadState,
    previewTransition,
    queue.inventoryItems,
    returnState,
    selected,
    submitting,
  ]);

  const openAction = useCallback(
    (kind: Exclude<DialogKind, null>) => {
      const permitted =
        inspection ||
        (kind === 'review'
          ? canApproveLending
          : kind === 'handoff'
            ? canHandoffLending
            : canReturnLending && canUploadLendingEvidence);
      if (!permitted || loadState !== 'ready') return;
      dialogRef.current = kind;
      setDialog(kind);
      setInlineError('');
    },
    [canApproveLending, canHandoffLending, canReturnLending, canUploadLendingEvidence, inspection, loadState],
  );

  if (loadState === 'denied') {
    return (
      <section className="mx-auto grid min-h-[420px] max-w-2xl place-items-center rounded-xl border border-[var(--border-paper)] bg-[var(--paper-mid)] p-8 text-center">
        <ShieldAlert size={28} />
        <p className="mt-4 font-mono text-xs uppercase tracking-[.08em]">Internal Lending Hub</p>
        <h1 className="mt-1 font-serif text-5xl">Access limited</h1>
        <p className="mt-3 max-w-lg text-sm leading-6 text-[var(--ink-mid)]">
          This DOL-only workspace requires the current server session to grant internal access. This message
          does not confirm whether any protected lending record exists.
        </p>
        <button
          type="button"
          className="mt-5 min-h-11 rounded-lg bg-[#7c5718] px-4 text-sm font-semibold text-white"
          onClick={() => navigate('overview')}
        >
          Return to overview
        </button>
      </section>
    );
  }
  if (loadState === 'error') {
    return (
      <section className="mx-auto grid min-h-[420px] max-w-2xl place-items-center rounded-xl border border-[var(--border-paper)] bg-[var(--paper-mid)] p-8 text-center">
        <ShieldAlert size={28} />
        <p className="mt-4 font-mono text-xs uppercase tracking-[.08em]">Internal Lending Hub</p>
        <h1 className="mt-1 font-serif text-5xl">Lending queue unavailable</h1>
        <p className="mt-3 max-w-lg text-sm leading-6 text-[var(--ink-mid)]">
          No lending record was changed. Retry the same authenticated bootstrap when the service is available.
        </p>
        <button
          type="button"
          className="mt-5 min-h-11 rounded-lg bg-[#7c5718] px-4 text-sm font-semibold text-white"
          onClick={refetch}
        >
          Retry lending queue
        </button>
      </section>
    );
  }

  const selectedItem = selected ? itemFor(selected, queue.inventoryItems) : null;
  const selectedRequestedItem = selected ? requestedItemFor(selected, queue.inventoryItems) : null;
  const selectedStatus = selected ? derivedLendingStatus(selected, now) : '';
  const reviewIdentity = selected ? identityFor(selected) : null;
  const reviewItemId =
    selected && review
      ? review.decision === 'SUBSTITUTE'
        ? review.substitutionItemId
        : selected.itemId
      : '';
  const reviewTargetItem = queue.inventoryItems.find((item) => item.id === reviewItemId) ?? null;
  const reviewAssets = selected ? reviewCandidateAssets(selected, reviewItemId) : [];
  const inspectorReviewCandidates = selected ? reviewCandidateAssets(selected, selected.itemId) : [];
  const actionPaused = loadState !== 'ready';
  const reviewAllowed = inspection || (canApproveLending && loadState === 'ready');
  const handoffAllowed = inspection || (canHandoffLending && loadState === 'ready');
  const returnAllowed = inspection || (canReturnLending && canUploadLendingEvidence && loadState === 'ready');
  const inputClass =
    'min-h-11 w-full rounded-lg border border-[var(--border-paper)] bg-[var(--paper-light)] px-3 py-2 text-sm text-[var(--ink-deep)]';
  const quietButton =
    'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg border border-[var(--border-paper)] px-3 py-2 text-sm font-semibold text-[var(--ink-deep)]';
  const primaryButton =
    'inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-[#7c5718] px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50';

  return (
    <main
      className="max-w-full space-y-4 overflow-x-hidden text-[var(--ink-deep)]"
      data-fi07-lending-hub
      data-fi07-mode={inspection ? 'preview' : 'authenticated'}
      data-theme={dark ? 'dark' : 'light'}
    >
      <header className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
        <div>
          <p className="m-0 font-mono text-[11px] font-semibold uppercase tracking-[.08em] text-[var(--ink-mid)]">
            Internal Lending Hub · DOL
          </p>
          <h1 className="mt-1 font-serif text-[clamp(2.25rem,4vw,3.35rem)] leading-none">
            Loans and custody
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--ink-mid)]">
            Find a lending ticket, verify the authoritative record, then complete only the permitted next
            action.
          </p>
        </div>
        <aside className="min-w-0 rounded-lg border border-[var(--border-paper)] bg-[var(--paper-mid)] px-4 py-3 text-xs sm:min-w-64">
          <strong className="block">
                {inspection ? 'Preview inspection fixture' : 'Authenticated lending projection'}
          </strong>
          <span className="mt-1 block leading-5 text-[var(--ink-mid)]">
            {inspection
              ? 'No backend read, mutation, or evidence upload.'
              : 'Lending revision ' + queue.scopeRevision.token}
          </span>
        </aside>
      </header>

      <ol className="grid grid-cols-2 overflow-hidden rounded-lg border border-[var(--border-paper)] bg-[var(--paper-mid)] sm:flex">
        {['Find', 'Select', 'Verify', 'Act', 'Confirm', 'Refresh'].map((step, index) => (
          <li
            key={step}
            className="flex min-h-10 items-center gap-2 border-b border-r border-[var(--border-paper)] px-3 py-2 text-[10px] font-bold uppercase tracking-[.07em] last:border-r-0 even:border-r-0 sm:flex-1 sm:border-b-0 sm:even:border-r sm:last:border-r-0"
          >
            <b className="font-mono text-[#c8992f]">{String(index + 1).padStart(2, '0')}</b>
            {step}
          </li>
        ))}
      </ol>

      {inspection ? (
        <section
          role="note"
          className="flex gap-2 rounded-lg border border-[#d1b478] bg-[#fff4d6] p-3 text-sm leading-5 text-[#40070a]"
        >
          <ShieldAlert size={18} className="mt-0.5 shrink-0" />
          <span>
            <strong>Preview inspection</strong> · deterministic fixture and local-only action simulation. No
            authenticated session, capability, protected read, mutation, or evidence upload is created.
          </span>
        </section>
      ) : null}
      {loadState === 'refreshing' ? (
        <p role="status" className="flex items-center gap-2 text-sm text-[var(--ink-mid)]">
          <LoaderCircle size={16} className="animate-spin" />
          Refreshing the authoritative lending queue…
        </p>
      ) : null}
      {loadState === 'stale' ? (
        <section
          role="alert"
          className="flex flex-col gap-3 rounded-lg border border-amber-700/30 bg-amber-500/10 p-3 sm:flex-row sm:items-center"
        >
          <AlertTriangle size={20} />
          <div className="flex-1">
            <strong>Last-known lending data</strong>
            <p className="m-0 mt-1 text-sm text-[var(--ink-mid)]">
              The lending revision may have changed. Actions are paused until a successful reload.
            </p>
          </div>
          <button type="button" className={primaryButton} onClick={refetch}>
            <RefreshCw size={16} />
            Reload
          </button>
        </section>
      ) : null}
      {notice ? (
        <section
          role={notice.tone === 'error' ? 'alert' : 'status'}
          className={
            'flex flex-col gap-3 rounded-lg border p-3 sm:flex-row sm:items-start ' +
            (notice.tone === 'success'
              ? 'border-emerald-700/30 bg-emerald-500/10'
              : notice.tone === 'warning'
                ? 'border-amber-700/30 bg-amber-500/10'
                : 'border-rose-700/30 bg-rose-500/10')
          }
        >
          <span>
            {notice.tone === 'success' ? (
              <CheckCircle2 size={19} />
            ) : notice.tone === 'warning' ? (
              <AlertTriangle size={19} />
            ) : (
              <CircleAlert size={19} />
            )}
          </span>
          <div className="flex-1">
            <strong>{notice.title}</strong>
            <p className="m-0 mt-1 text-sm leading-5">{notice.message}</p>
            {notice.correlationId ? (
              <small className="mt-1 block font-mono text-[11px]">
                Correlation ID: {notice.correlationId}
              </small>
            ) : null}
          </div>
          {notice.refetch ? (
            <button type="button" className={quietButton} onClick={refetch}>
              <RefreshCw size={16} />
              Refresh queue
            </button>
          ) : null}
        </section>
      ) : null}

      {loadState === 'loading' ? (
        <section aria-busy="true" className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(19rem,.62fr)]">
          <div className="h-[430px] animate-pulse rounded-xl border border-[var(--border-paper)] bg-[var(--paper-mid)]" />
          <div className="hidden h-[430px] animate-pulse rounded-xl border border-[var(--border-paper)] bg-[var(--paper-mid)] lg:block" />
        </section>
      ) : (
        <section className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(19rem,.62fr)]">
          <section
            className="min-w-0 rounded-xl border border-[var(--border-paper)] bg-[var(--paper-mid)] p-4"
            aria-labelledby="fi07-queue-heading"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="m-0 font-mono text-[11px] font-semibold uppercase tracking-[.08em] text-[var(--ink-mid)]">
                  Loaded queue
                </p>
                <h2 id="fi07-queue-heading" className="mt-1 font-serif text-3xl">
                  Lending tickets in authorized scope
                </h2>
              </div>
              <span className="max-w-36 text-right font-mono text-[10px] leading-4 text-[var(--ink-mid)]">
                Server page {queue.pagination.page} · {queue.lendingTickets.length} loaded
              </span>
            </div>
            <p className="mt-3 text-xs leading-5 text-[var(--ink-mid)]">
              Search and status filters apply only to this loaded authoritative page. No global lending-ticket
              total is shown because the current bootstrap total is not ticket-owned.
            </p>
            <div className="mt-4 grid gap-2 md:grid-cols-[minmax(0,1fr)_minmax(10rem,.42fr)_auto]">
              <label className="grid gap-1 text-xs font-semibold text-[var(--ink-mid)]">
                <span>Search loaded tickets</span>
                <span className="flex min-h-11 items-center gap-2 rounded-lg border border-[var(--border-paper)] bg-[var(--paper-light)] px-3">
                  <Search size={16} />
                  <input
                    ref={queueFallbackRef}
                    data-fi07-queue-fallback
                    className="min-w-0 flex-1 bg-transparent text-sm text-[var(--ink-deep)] outline-none"
                    aria-label="Search loaded lending tickets"
                    type="search"
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Ticket, borrower, item"
                  />
                </span>
              </label>
              <label className="grid gap-1 text-xs font-semibold text-[var(--ink-mid)]">
                <span>Lifecycle</span>
                <select
                  className={inputClass}
                  aria-label="Filter loaded lending tickets by lifecycle"
                  value={filter}
                  onChange={(event) => setFilter(event.target.value)}
                >
                  <option value="ALL">All loaded states</option>
                  <option value="FOR_REVIEW">For review</option>
                  <option value="READY_TO_CLAIM">Ready to claim</option>
                  <option value="ON_LOAN">On loan</option>
                  <option value="OVERDUE">Overdue</option>
                  <option value="RETURNED">Returned</option>
                  <option value="COMPLETED">Issued</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </label>
              <button
                type="button"
                className={quietButton}
                onClick={() => {
                  setQuery('');
                  setFilter('ALL');
                }}
              >
                Clear filters
              </button>
            </div>
            <nav
              className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[var(--border-paper)] pt-3"
              aria-label="Loaded lending ticket pages"
            >
              <button
                type="button"
                className={quietButton}
                disabled={
                  inspection ||
                  queue.pagination.page <= 1 ||
                  loadState === 'loading' ||
                  loadState === 'refreshing'
                }
                onClick={() => goToPage(queue.pagination.page - 1)}
              >
                Previous
              </button>
              <span className="font-mono text-[11px] text-[var(--ink-mid)]">
                Loaded ticket page {queue.pagination.page}
              </span>
              <button
                type="button"
                className={quietButton}
                disabled={
                  inspection ||
                  !canAdvanceLendingPage(queue) ||
                  loadState === 'loading' ||
                  loadState === 'refreshing'
                }
                onClick={() => goToPage(queue.pagination.page + 1)}
              >
                Next
              </button>
            </nav>

            {!visible.length ? (
              <div className="grid place-items-center gap-2 rounded-lg border border-dashed border-[var(--border-paper)] p-10 text-center">
                <ClipboardCheck size={28} />
                <h3 className="mt-1 text-base font-semibold">No loaded lending tickets match</h3>
                <p className="m-0 max-w-md text-sm leading-5 text-[var(--ink-mid)]">
                  Change the loaded-page filters or reload the authoritative lending queue.
                </p>
                <button
                  type="button"
                  className={primaryButton}
                  onClick={() => {
                    setQuery('');
                    setFilter('ALL');
                  }}
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <>
                <div className="mt-4 hidden w-full overflow-auto rounded-lg border border-[var(--border-paper)] md:block">
                  <table className="w-full min-w-[630px] border-collapse text-left text-sm">
                    <thead className="bg-black/[.035] text-[10px] uppercase tracking-[.07em] text-[var(--ink-mid)]">
                      <tr>
                        <th className="p-3">Lending ticket</th>
                        <th className="p-3">Borrower / custody</th>
                        <th className="p-3">Timing</th>
                        <th className="p-3">Lifecycle</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visible.map((ticket) => {
                        const item = itemFor(ticket, queue.inventoryItems);
                        const status = derivedLendingStatus(ticket, now);
                        return (
                          <tr
                            key={ticket.id}
                            className={
                              'border-t border-[var(--border-paper)] ' +
                              (selected?.id === ticket.id ? 'bg-amber-500/10' : '')
                            }
                          >
                            <td className="p-3 align-top">
                              <button
                                type="button"
                                data-ticket-trigger={ticket.id}
                                ref={(node) => {
                                  triggerRefs.current[ticket.id] = node;
                                }}
                                onClick={(event) => selectTicket(ticket, event.currentTarget)}
                                className="grid w-full gap-1 text-left"
                              >
                                <strong>
                                  {item?.name ?? 'Canonical item unavailable in this projection'}
                                </strong>
                                <span className="font-mono text-[11px] text-[var(--ink-mid)]">
                                  {ticket.id} · {ticket.quantity} {ticket.unit}
                                </span>
                              </button>
                            </td>
                            <td className="p-3 align-top">
                              <strong className="block">{borrowerLabel(ticket)}</strong>
                              <span className="mt-1 block text-xs text-[var(--ink-mid)]">
                                {ticket.department || ticket.borrowerType}
                              </span>
                            </td>
                            <td className="p-3 align-top">
                              <strong className="block">
                                {ticket.dueAt ? date(ticket.dueAt) : 'No return due'}
                              </strong>
                              <span className="mt-1 block text-xs text-[var(--ink-mid)]">
                                {ticket.ticketType === 'CONSUMABLE' ? 'Consumable issue' : 'Reusable custody'}
                              </span>
                            </td>
                            <td className="p-3 align-top">
                              <StatusBadge status={status} />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="mt-4 grid gap-3 md:hidden">
                  {visible.map((ticket) => {
                    const item = itemFor(ticket, queue.inventoryItems);
                    return (
                      <article
                        key={ticket.id}
                        className="rounded-lg border border-[var(--border-paper)] bg-[var(--paper-light)] p-3"
                      >
                        <div className="flex items-start justify-between gap-2 font-mono text-[11px]">
                          <span>{ticket.id}</span>
                          <StatusBadge status={derivedLendingStatus(ticket, now)} />
                        </div>
                        <h3 className="mt-4 text-base font-semibold">
                          {item?.name ?? 'Canonical item unavailable in this projection'}
                        </h3>
                        <p className="mt-1 text-xs leading-5 text-[var(--ink-mid)]">
                          {borrowerLabel(ticket)} · {ticket.quantity} {ticket.unit} ·{' '}
                          {ticket.dueAt ? 'Due ' + date(ticket.dueAt) : 'Consumable issue'}
                        </p>
                        <button
                          type="button"
                          data-ticket-trigger={ticket.id}
                          ref={(node) => {
                            triggerRefs.current[ticket.id] = node;
                          }}
                          onClick={(event) => selectTicket(ticket, event.currentTarget)}
                          className={'mt-3 w-full ' + primaryButton}
                        >
                          Open ticket
                        </button>
                      </article>
                    );
                  })}
                </div>
              </>
            )}
          </section>

          {selected ? (
            <aside
              ref={inspectorRef}
              role={dialog ? undefined : 'dialog'}
              aria-modal={dialog ? undefined : true}
              aria-hidden={dialog ? true : undefined}
              aria-labelledby="fi07-ticket-title"
              data-lending-inspector
              tabIndex={-1}
              className="fixed inset-0 z-50 overflow-auto border-[var(--border-paper)] bg-[var(--paper-mid)] p-4 lg:sticky lg:top-4 lg:z-auto lg:max-h-[calc(100vh-2rem)] lg:rounded-xl lg:border"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="m-0 font-mono text-[11px] font-semibold uppercase tracking-[.08em] text-[var(--ink-mid)]">
                    {selected.id}
                  </p>
                  <h2 id="fi07-ticket-title" className="mt-1 font-serif text-3xl">
                    {selectedItem?.name ?? 'Canonical lending ticket'}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={closeInspector}
                  aria-label="Close lending ticket details"
                  className="grid h-11 w-11 place-items-center rounded-lg border border-[var(--border-paper)]"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="mt-3">
                <StatusBadge status={selectedStatus} />
              </div>
              <section className="mt-4 border-t border-[var(--border-paper)] pt-4">
                <h3 className="text-sm font-semibold">Borrower and custody</h3>
                <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <KeyValue label="Borrower" value={borrowerLabel(selected)} />
                  <KeyValue
                    label="Identity reference"
                    value={selected.studentIdNumber || selected.positionRole || selected.borrowerType}
                  />
                  <KeyValue label="Department" value={selected.department} />
                  <KeyValue label="Contact" value={selected.contact} />
                  <KeyValue label="Purpose" value={selected.purpose} />
                  <KeyValue
                    label="Return by"
                    value={selected.dueAt ? dateTime(selected.dueAt) : 'Not applicable'}
                  />
                </dl>
              </section>
              <section className="mt-4 border-t border-[var(--border-paper)] pt-4">
                <h3 className="text-sm font-semibold">Requested and approved</h3>
                <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <KeyValue
                    label="Requested"
                    value={
                      (selectedRequestedItem?.name ?? selected.requestedItemId) +
                      ' · ' +
                      selected.requestedQuantity +
                      ' ' +
                      selected.unit
                    }
                  />
                  <KeyValue
                    label="Approved"
                    value={
                      (selectedItem?.name ?? selected.itemId) +
                      ' · ' +
                      selected.quantity +
                      ' ' +
                      selected.unit
                    }
                  />
                  <KeyValue label="Ticket type" value={label(selected.ticketType)} />
                  <KeyValue
                    label="Eligibility source"
                    value={selected.eligibilitySource || 'Not yet recorded'}
                  />
                  <KeyValue label="Review decision" value={selected.reviewDecision || 'Pending review'} />
                  <KeyValue
                    label="Review reason"
                    value={selected.rejectionReason || selected.substitutionNote || selected.reviewNotes}
                  />
                </dl>
              </section>
              <section className="mt-4 border-t border-[var(--border-paper)] pt-4">
                <h3 className="text-sm font-semibold">Catalog and condition visibility</h3>
                <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <KeyValue
                    label="Lending availability"
                    value={
                      selectedItem?.lendableAvailable === undefined
                        ? 'Not available for this session'
                        : String(selectedItem.lendableAvailable) + ' ' + selectedItem.unit
                    }
                  />
                  <KeyValue
                    label="Traceable assets"
                    value={
                      selectedItem?.traceableAssets === undefined
                        ? 'Not available for this session'
                        : String(selectedItem.traceableAssets)
                    }
                  />
                  <KeyValue
                    label="Condition review"
                    value={
                      selectedItem?.conditionReviewState
                        ? label(selectedItem.conditionReviewState)
                        : 'Not reported'
                    }
                  />
                  <KeyValue
                    label="Maintenance visibility"
                    value={
                      selectedItem?.maintenanceReviewState
                        ? label(selectedItem.maintenanceReviewState)
                        : 'Not reported'
                    }
                  />
                </dl>
              </section>
              <section className="mt-4 border-t border-[var(--border-paper)] pt-4">
                <h3 className="text-sm font-semibold">Asset review context</h3>
                {selected.status === 'FOR_REVIEW' && inspectorReviewCandidates.length ? (
                  <ul className="mt-3 grid gap-2">
                    {inspectorReviewCandidates.map((asset) => (
                      <li
                        key={asset.id}
                        className="rounded-lg border border-[var(--border-paper)] bg-[var(--paper-light)] p-2 text-xs"
                      >
                        <strong className="block">{asset.assetTag || asset.id}</strong>
                        <span className="mt-1 block text-[var(--ink-mid)]">
                          {asset.serialNumber || 'No serial reported'} · {label(asset.condition)} · Available
                        </span>
                      </li>
                    ))}
                  </ul>
                ) : selected.status === 'FOR_REVIEW' ? (
                  <p className="mt-2 text-xs leading-5 text-[var(--ink-mid)]">
                    No matching available review candidates are projected for this item. Assignment remains
                    unavailable until the authoritative review contract projects eligible candidates.
                  </p>
                ) : (
                  <p className="mt-2 text-xs leading-5 text-[var(--ink-mid)]">
                    Assigned custody asset identities are not projected by this contract.
                  </p>
                )}
                {selected.status === 'FOR_REVIEW' ? (
                  <p className="mt-2 text-xs leading-5 text-[var(--ink-mid)]">
                    Available review candidates — not yet assigned. The server establishes any traceable
                    custody assignment only when it accepts the review.
                  </p>
                ) : null}
              </section>
              <section className="mt-4 border-t border-[var(--border-paper)] pt-4">
                <h3 className="text-sm font-semibold">Server status history</h3>
                {selected.history.length ? (
                  <ol className="mt-3 grid gap-2">
                    {selected.history.map((entry, index) => (
                      <li
                        key={entry.changedAt + entry.newStatus + index}
                        className="rounded-lg border border-[var(--border-paper)] bg-[var(--paper-light)] p-2 text-xs"
                      >
                        <strong className="block">{label(entry.newStatus)}</strong>
                        <span className="mt-1 block text-[var(--ink-mid)]">
                          {dateTime(entry.changedAt)}
                          {entry.reason ? ' · ' + entry.reason : ''}
                        </span>
                      </li>
                    ))}
                  </ol>
                ) : (
                  <p className="mt-2 text-xs text-[var(--ink-mid)]">
                    No status history is projected for this ticket.
                  </p>
                )}
              </section>
              <section className="mt-4 border-l-4 border-[#c8992f] bg-amber-500/10 p-3 text-xs leading-5">
                <strong className="font-mono text-[10px] uppercase tracking-[.06em]">
                  Contract-gated controls
                </strong>
                <p className="m-0 mt-1">
                  Due reminders, monitoring, cancellation, asset registration, and maintenance logging are not
                  accepted FI-07 actions. Condition and maintenance are presentation-only where canonical data
                  reports them.
                </p>
              </section>
              <div className="mt-4 grid gap-2">
                {selected.status === 'FOR_REVIEW' ? (
                  <button
                    type="button"
                    disabled={!reviewAllowed}
                    onClick={() => openAction('review')}
                    className={primaryButton}
                  >
                    <ClipboardCheck size={17} />
                    {inspection
                      ? 'Demonstrate review'
                      : canApproveLending
                        ? 'Review ticket'
                        : 'Review not permitted'}
                  </button>
                ) : null}
                {selected.status === 'READY_TO_CLAIM' ? (
                  <button
                    type="button"
                    disabled={!handoffAllowed}
                    onClick={() => openAction('handoff')}
                    className={primaryButton}
                  >
                    <PackageCheck size={17} />
                    {selected.ticketType === 'CONSUMABLE' ? 'Confirm issue' : 'Confirm handoff'}
                  </button>
                ) : null}
                {selected.status === 'ON_LOAN' ? (
                  <button
                    type="button"
                    disabled={!returnAllowed}
                    onClick={() => openAction('return')}
                    className={primaryButton}
                  >
                    <Camera size={17} />
                    {inspection
                      ? 'Demonstrate return'
                      : canReturnLending && canUploadLendingEvidence
                        ? 'Inspect return'
                        : 'Return not permitted'}
                  </button>
                ) : null}
                {!inspection && loadState === 'stale' ? (
                  <p className="m-0 text-xs text-[var(--ink-mid)]">Actions are paused while data is stale.</p>
                ) : null}
              </div>
            </aside>
          ) : (
            <aside className="hidden min-h-[280px] place-content-center rounded-xl border border-[var(--border-paper)] bg-[var(--paper-mid)] p-8 text-center text-[var(--ink-mid)] lg:grid">
              <ClipboardCheck size={25} className="mx-auto" />
              <strong className="mt-3 text-[var(--ink-deep)]">Select a lending ticket</strong>
              <span className="mt-1 text-sm leading-5">
                Inspect borrower custody, canonical availability context, and the permitted next action.
              </span>
            </aside>
          )}
        </section>
      )}

      {dialog === 'review' && selected && review && reviewIdentity ? (
        <Modal
          eyebrow="Borrower and catalog review"
          title={'Review ' + selected.id}
          onClose={() => {
            setDialog(null);
            setInlineError('');
          }}
        >
          <form
            className="grid gap-4 pt-4"
            onSubmit={(event) => {
              event.preventDefault();
              void submitReview();
            }}
          >
            <p className="m-0 text-sm leading-6 text-[var(--ink-mid)]">
              The Worker rechecks identity, scope, availability, quantity, asset assignment, lifecycle, and
              idempotency before recording this review.
            </p>
            <Field label="Decision">
              <select
                data-dialog-initial-focus
                className={inputClass}
                value={review.decision}
                onChange={(event) =>
                  setReview((current) =>
                    current
                      ? { ...current, decision: event.target.value as Decision, assetIds: [] }
                      : current,
                  )
                }
              >
                <option value="APPROVE">Approve full request</option>
                <option value="PARTIAL_APPROVE">Partial approve</option>
                <option value="SUBSTITUTE">Approve substitute</option>
                <option value="REJECT">Reject</option>
              </select>
            </Field>
            {review.decision !== 'REJECT' ? (
              <>
                <label className="flex gap-2 rounded-lg border border-[var(--border-paper)] bg-[var(--paper-light)] p-3 text-xs leading-5">
                  <input
                    className="mt-0.5 h-4 w-4 shrink-0"
                    type="checkbox"
                    checked={review.identityVerified}
                    onChange={(event) =>
                      setReview((current) =>
                        current ? { ...current, identityVerified: event.target.checked } : current,
                      )
                    }
                  />
                  <span>
                    <strong className="block">Identity verified through {reviewIdentity.label}</strong>
                    <small className="mt-1 block text-[var(--ink-mid)]">{reviewIdentity.instruction}</small>
                  </span>
                </label>
                <Field label="Approved quantity">
                  <input
                    className={inputClass}
                    inputMode="decimal"
                    value={review.approvedQuantity}
                    onChange={(event) =>
                      setReview((current) =>
                        current ? { ...current, approvedQuantity: event.target.value } : current,
                      )
                    }
                  />
                </Field>
                {review.decision === 'SUBSTITUTE' ? (
                  <Field label="Canonical substitute item">
                    <select
                      className={inputClass}
                      value={review.substitutionItemId}
                      onChange={(event) =>
                        setReview((current) =>
                          current
                            ? { ...current, substitutionItemId: event.target.value, assetIds: [] }
                            : current,
                        )
                      }
                    >
                      <option value="">Choose an approved substitute</option>
                      {queue.inventoryItems
                        .filter(
                          (item) =>
                            item.id !== selected.itemId && item.isLendable && item.lendingStatus === 'ACTIVE',
                        )
                        .map((item) => (
                          <option key={item.id} value={item.id}>
                            {item.name} · {item.unit}
                          </option>
                        ))}
                    </select>
                  </Field>
                ) : null}
                {reviewTargetItem?.lendingKind === 'REUSABLE' ? (
                  <fieldset className="grid gap-2 rounded-lg border border-[var(--border-paper)] p-3">
                    <legend className="px-1 text-xs font-semibold">
                      Available review candidates — not yet assigned
                    </legend>
                    {reviewTargetItem.traceableAssets === undefined ? (
                      <p role="alert" className="m-0 text-xs leading-5 text-rose-800">
                        Traceable asset assignment is unavailable because the canonical target inventory
                        projection is redacted. This reusable review cannot be submitted.
                      </p>
                    ) : reviewTargetItem.traceableAssets === 0 ? (
                      <p className="m-0 text-xs leading-5 text-[var(--ink-mid)]">
                        The canonical target has no traceable assets. No asset identities will be submitted
                        for this review.
                      </p>
                    ) : (
                      <>
                        <p className="m-0 text-xs leading-5 text-[var(--ink-mid)]">
                          Choose exactly the approved quantity from matching available candidates. They are
                          not custody assignments until the server accepts this review.
                        </p>
                        {reviewAssets.length ? (
                          reviewAssets.map((asset) => (
                            <label className="flex gap-2 text-xs" key={asset.id}>
                              <input
                                className="mt-0.5 h-4 w-4"
                                type="checkbox"
                                disabled={submitting || actionPaused}
                                checked={review.assetIds.includes(asset.id)}
                                onChange={(event) =>
                                  setReview((current) =>
                                    current
                                      ? {
                                          ...current,
                                          assetIds: event.target.checked
                                            ? [...current.assetIds, asset.id]
                                            : current.assetIds.filter((value) => value !== asset.id),
                                        }
                                      : current,
                                  )
                                }
                              />
                              <span>
                                {asset.assetTag || asset.id} · {asset.serialNumber || 'No serial reported'} ·{' '}
                                {label(asset.condition)}
                              </span>
                            </label>
                          ))
                        ) : (
                          <p role="alert" className="m-0 text-xs leading-5 text-rose-800">
                            No matching available review candidates are projected. This traceable reusable
                            review cannot be submitted.
                          </p>
                        )}
                      </>
                    )}
                  </fieldset>
                ) : null}
              </>
            ) : null}
            {review.decision !== 'APPROVE' ? (
              <Field label="Reason">
                <textarea
                  className={inputClass}
                  rows={3}
                  value={review.reason}
                  onChange={(event) =>
                    setReview((current) => (current ? { ...current, reason: event.target.value } : current))
                  }
                />
              </Field>
            ) : null}
            <Field label="Review note (optional)">
              <textarea
                className={inputClass}
                rows={3}
                value={review.note}
                onChange={(event) =>
                  setReview((current) => (current ? { ...current, note: event.target.value } : current))
                }
              />
            </Field>
            {inlineError ? (
              <p
                role="alert"
                className="m-0 rounded-lg border border-rose-700/30 bg-rose-500/10 p-3 text-xs leading-5"
              >
                {inlineError}
              </p>
            ) : null}
            <p className="m-0 text-xs leading-5 text-[var(--ink-mid)]">
              Recording this review changes the authoritative lending lifecycle only after server validation
              succeeds.
            </p>
            <div className="flex flex-wrap justify-end gap-2">
              <button className={primaryButton} type="submit" disabled={submitting || actionPaused}>
                {submitting ? (
                  <>
                    <LoaderCircle size={17} className="animate-spin" />
                    Recording…
                  </>
                ) : inspection ? (
                  'Record local demonstration'
                ) : (
                  'Record server review'
                )}
              </button>
              <button
                className={quietButton}
                type="button"
                disabled={submitting}
                onClick={() => setDialog(null)}
              >
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      ) : null}

      {dialog === 'handoff' && selected ? (
        <Modal
          eyebrow="Custody consequence"
          title={
            (selected.ticketType === 'CONSUMABLE' ? 'Confirm issue for ' : 'Confirm handoff for ') +
            selected.id
          }
          onClose={() => {
            setDialog(null);
            setInlineError('');
          }}
        >
          <form
            className="grid gap-4 pt-4"
            onSubmit={(event) => {
              event.preventDefault();
              void submitHandoff();
            }}
          >
            <p className="m-0 text-sm leading-6 text-[var(--ink-mid)]">
              {selected.ticketType === 'CONSUMABLE'
                ? 'This confirms a consumable issue.'
                : 'This transfers reusable custody to the borrower.'}{' '}
              The server records the authoritative inventory movement and lifecycle outcome.
            </p>
            <Field label="Handoff condition label (optional)">
              <input
                data-dialog-initial-focus
                className={inputClass}
                value={handoff.condition}
                onChange={(event) => setHandoff((current) => ({ ...current, condition: event.target.value }))}
                placeholder="GOOD"
              />
            </Field>
            <Field label="Custody note (optional)">
              <textarea
                className={inputClass}
                rows={3}
                value={handoff.note}
                onChange={(event) => setHandoff((current) => ({ ...current, note: event.target.value }))}
              />
            </Field>
            <label className="flex gap-2 rounded-lg border border-[var(--border-paper)] bg-[var(--paper-light)] p-3 text-xs leading-5">
              <input
                className="mt-0.5 h-4 w-4 shrink-0"
                type="checkbox"
                checked={handoff.acknowledged}
                onChange={(event) =>
                  setHandoff((current) => ({ ...current, acknowledged: event.target.checked }))
                }
              />
              <span>
                <strong className="block">I understand this records the physical custody consequence.</strong>
                <small className="mt-1 block text-[var(--ink-mid)]">
                  {selected.ticketType === 'CONSUMABLE'
                    ? 'This is an issue, not a returnable loan.'
                    : 'This makes the approved reusable unit on loan until a governed return is recorded.'}
                </small>
              </span>
            </label>
            {inlineError ? (
              <p
                role="alert"
                className="m-0 rounded-lg border border-rose-700/30 bg-rose-500/10 p-3 text-xs leading-5"
              >
                {inlineError}
              </p>
            ) : null}
            <div className="flex flex-wrap justify-end gap-2">
              <button className={primaryButton} type="submit" disabled={submitting || actionPaused}>
                {submitting ? (
                  <>
                    <LoaderCircle size={17} className="animate-spin" />
                    Recording…
                  </>
                ) : inspection ? (
                  'Record local demonstration'
                ) : selected.ticketType === 'CONSUMABLE' ? (
                  'Confirm issue'
                ) : (
                  'Confirm handoff'
                )}
              </button>
              <button
                className={quietButton}
                type="button"
                disabled={submitting}
                onClick={() => setDialog(null)}
              >
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      ) : null}

      {dialog === 'return' && selected && returnState ? (
        <Modal
          eyebrow="Governed return inspection"
          title={'Confirm return for ' + selected.id}
          onClose={() => {
            setDialog(null);
            setInlineError('');
          }}
        >
          <form
            className="grid gap-4 pt-4"
            onSubmit={(event) => {
              event.preventDefault();
              void submitReturn();
            }}
          >
            <p className="m-0 text-sm leading-6 text-[var(--ink-mid)]">
              Returned, lost, and damaged-beyond-use quantities must exactly reconcile to {selected.quantity}{' '}
              {selected.unit}. The real workflow stores governed return evidence before the server can accept
              the return.
            </p>
            <Field label="Return condition">
              <select
                data-dialog-initial-focus
                className={inputClass}
                value={returnState.condition}
                onChange={(event) =>
                  setReturnState((current) =>
                    current ? { ...current, condition: event.target.value as ReturnCondition } : current,
                  )
                }
              >
                {RETURN_CONDITIONS.map((condition) => (
                  <option value={condition} key={condition}>
                    {label(condition)}
                  </option>
                ))}
              </select>
            </Field>
            <div className="grid gap-2 sm:grid-cols-3">
              <Field label="Returned">
                <input
                  className={inputClass}
                  inputMode="decimal"
                  value={returnState.returned}
                  onChange={(event) =>
                    setReturnState((current) =>
                      current ? { ...current, returned: event.target.value } : current,
                    )
                  }
                />
              </Field>
              <Field label="Lost">
                <input
                  className={inputClass}
                  inputMode="decimal"
                  value={returnState.lost}
                  onChange={(event) =>
                    setReturnState((current) =>
                      current ? { ...current, lost: event.target.value } : current,
                    )
                  }
                />
              </Field>
              <Field label="Damaged beyond use">
                <input
                  className={inputClass}
                  inputMode="decimal"
                  value={returnState.damaged}
                  onChange={(event) =>
                    setReturnState((current) =>
                      current ? { ...current, damaged: event.target.value } : current,
                    )
                  }
                />
              </Field>
            </div>
            <Field label="Inspection note">
              <textarea
                className={inputClass}
                rows={3}
                value={returnState.note}
                onChange={(event) =>
                  setReturnState((current) => (current ? { ...current, note: event.target.value } : current))
                }
                placeholder="Required for lost or damaged-beyond-use quantities"
              />
            </Field>
            {inspection ? (
              <section
                role="note"
                className="flex gap-2 rounded-lg border border-[#d1b478] bg-[#fff4d6] p-3 text-xs leading-5 text-[#40070a]"
              >
                <Camera size={18} className="shrink-0" />
                <span>
                  <strong>Fixture evidence simulation</strong> · no file is selected or uploaded in Preview
                  Index inspection.
                </span>
              </section>
            ) : (
              <Field
                label="Governed return photo or document"
                detail="JPG, PNG, WEBP, or PDF · maximum 10 MB · stored privately before return confirmation."
              >
                <input
                  className={inputClass}
                  type="file"
                  accept=".jpg,.jpeg,.png,.webp,.pdf,image/jpeg,image/png,image/webp,application/pdf"
                  onChange={(event: ChangeEvent<HTMLInputElement>) => {
                    const file = event.target.files?.[0] ?? null;
                    setReturnState((current) => (current ? { ...current, file, evidence: null } : current));
                  }}
                />
              </Field>
            )}
            {!inspection && returnState.evidence ? (
              <p className="m-0 flex gap-2 rounded-lg border border-emerald-700/30 bg-emerald-500/10 p-3 text-xs leading-5">
                <CheckCircle2 size={17} className="shrink-0" />
                Return evidence has been securely staged and will be linked to this governed return.
              </p>
            ) : null}
            <label className="flex gap-2 rounded-lg border border-[var(--border-paper)] bg-[var(--paper-light)] p-3 text-xs leading-5">
              <input
                className="mt-0.5 h-4 w-4 shrink-0"
                type="checkbox"
                checked={returnState.acknowledged}
                onChange={(event) =>
                  setReturnState((current) =>
                    current ? { ...current, acknowledged: event.target.checked } : current,
                  )
                }
              />
              <span>
                <strong className="block">I confirm the inspected quantities and condition.</strong>
                <small className="mt-1 block text-[var(--ink-mid)]">
                  This records the return only after evidence, scope, lifecycle, quantity, and custody
                  validation succeeds.
                </small>
              </span>
            </label>
            {inlineError ? (
              <p
                role="alert"
                className="m-0 rounded-lg border border-rose-700/30 bg-rose-500/10 p-3 text-xs leading-5"
              >
                {inlineError}
              </p>
            ) : null}
            <div className="flex flex-wrap justify-end gap-2">
              <button className={primaryButton} type="submit" disabled={submitting || actionPaused}>
                {submitting ? (
                  <>
                    <LoaderCircle size={17} className="animate-spin" />
                    Recording…
                  </>
                ) : inspection ? (
                  'Record local demonstration'
                ) : (
                  'Upload evidence and confirm return'
                )}
              </button>
              <button
                className={quietButton}
                type="button"
                disabled={submitting}
                onClick={() => setDialog(null)}
              >
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      ) : null}
    </main>
  );
}
