import { useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  CircleAlert,
  LoaderCircle,
  RefreshCw,
  Search,
  ShieldAlert,
  X,
} from 'lucide-react';
import {
  FrontendApiError,
  frontendBackend,
  type FrontendRequest,
  type FrontendRequestBootstrap,
  type FrontendRequestLine,
} from '../../integration/backend';
import { useDialogFocusTrap } from '../hooks/useDialogFocusTrap';
import type { Route } from '../appTypes';

const REVIEWABLE_LINE_STATUSES = new Set(['FOR_REVIEW', 'NEEDS_INFORMATION']);
const ARCHIVE_FILTERS = [
  { value: 'ACTIVE', label: 'Active queue' },
  { value: 'ARCHIVED', label: 'Archive' },
  { value: 'ALL', label: 'All records' },
] as const;
const STATUS_FILTERS = ['FOR_REVIEW', 'NEEDS_INFORMATION', 'ACCEPTED', 'REJECTED', 'CLOSED'] as const;
const LINE_ROUTES = ['ISSUE_FROM_STOCK', 'PROCUREMENT', 'RESTOCK', 'REJECT', 'MISSING_INFORMATION'] as const;

export type LineRoute = (typeof LINE_ROUTES)[number];

const ROUTE_LABELS: Record<LineRoute, string> = {
  ISSUE_FROM_STOCK: 'Issue from stock',
  PROCUREMENT: 'Procurement / canvass',
  RESTOCK: 'Catalog restock',
  REJECT: 'Reject',
  MISSING_INFORMATION: 'Missing information',
};

const PREVIEW_QUEUE: FrontendRequestBootstrap = {
  requests: [
    {
      id: 'REQ-PREVIEW-001',
      type: 'STANDARD',
      stage: 'REVIEW',
      parentRequestId: '',
      eventSeriesId: 'SERIES-PREVIEW',
      eventDayId: 'DAY-PREVIEW',
      eventId: 'EVENT-PREVIEW',
      ownerCommitteeId: 'COMMITTEE-PREVIEW',
      catalogType: 'OFFICE_INVENTORY',
      department: 'Preview committee',
      requesterName: 'Preview requester',
      purpose: 'Inspection-only request fixture',
      status: 'FOR_REVIEW',
      priority: 'URGENT',
      createdAt: '2026-08-24T00:00:00.000Z',
      updatedAt: '2026-08-24T00:00:00.000Z',
    },
  ],
  requestLines: [
    {
      id: 'LINE-PREVIEW-001',
      requestId: 'REQ-PREVIEW-001',
      eventId: 'EVENT-PREVIEW',
      itemId: 'ITM-PREVIEW-001',
      description: 'Preview folding chair',
      specification: 'Fixture only',
      category: 'Equipment',
      quantity: 12,
      unit: 'piece',
      fulfillmentSource: '',
      neededAt: '2026-08-30T09:00:00.000Z',
      returnDue: '',
      releasedQuantity: 0,
      receivedQuantity: 0,
      status: 'FOR_REVIEW',
      workflowRevision: 1,
      createdAt: '2026-08-24T00:00:00.000Z',
      updatedAt: '2026-08-24T00:00:00.000Z',
    },
  ],
  eventSeries: [{ id: 'SERIES-PREVIEW', code: 'PREVIEW', name: 'Preview event series', status: 'ACTIVE' }],
  eventDays: [
    {
      id: 'DAY-PREVIEW',
      seriesId: 'SERIES-PREVIEW',
      name: 'Preview day',
      date: '2026-08-30',
      status: 'ACTIVE',
    },
  ],
  events: [
    {
      id: 'EVENT-PREVIEW',
      seriesId: 'SERIES-PREVIEW',
      name: 'Preview operational event',
      startAt: '2026-08-30T09:00:00.000Z',
      endAt: '2026-08-30T12:00:00.000Z',
      eventDayId: 'DAY-PREVIEW',
      activityType: 'Fixture',
      timeStatus: 'SCHEDULED',
      venue: 'Preview only',
      status: 'ACTIVE',
    },
  ],
  inventoryItems: [
    {
      id: 'ITM-PREVIEW-001',
      name: 'Preview folding chair',
      category: 'Equipment',
      unit: 'piece',
      status: 'ACTIVE',
      catalogType: 'OFFICE_INVENTORY',
    },
  ],
  pagination: { page: 1, pageSize: 25, total: 1, hasMore: false },
  scopeRevision: { token: 'preview-fi06-r1', updatedAt: '2026-08-24T00:00:00.000Z' },
};

const EMPTY_QUEUE: FrontendRequestBootstrap = {
  requests: [],
  requestLines: [],
  eventSeries: [],
  eventDays: [],
  events: [],
  inventoryItems: [],
  pagination: { page: 1, pageSize: 25, total: 0, hasMore: false },
  scopeRevision: null,
};

type LoadState = 'loading' | 'refreshing' | 'ready' | 'error' | 'denied' | 'stale';
type Notice = {
  tone: 'success' | 'warning' | 'error';
  title: string;
  message: string;
  correlationId?: string;
  refetch?: boolean;
};

function palette(_dark: boolean) {
  return {
    background: 'var(--paper-warm)',
    surface: 'var(--paper-mid)',
    inset: 'var(--paper-light)',
    border: 'var(--border-paper)',
    text: 'var(--ink-deep)',
    muted: 'var(--ink-mid)',
    selected: 'color-mix(in oklch, var(--gold-vivid) 14%, var(--paper-warm))',
    zebra: 'color-mix(in oklch, var(--ink-deep) 3%, var(--paper-warm))',
  } as const;
}

function labelFor(value: string) {
  return value
    ? value
        .replaceAll('_', ' ')
        .toLowerCase()
        .replace(/\b\w/g, (letter) => letter.toUpperCase())
    : 'Not reported';
}

function shortDate(value: string) {
  if (!value) return 'Not reported';
  const date = new Date(value);
  return Number.isNaN(date.valueOf())
    ? value
    : new Intl.DateTimeFormat('en-PH', { day: '2-digit', month: 'short', year: 'numeric' }).format(date);
}

function statusStyle(status: string) {
  const styles: Record<
    string,
    { label: string; color: string; background: string; border: string; dot: string }
  > = {
    FOR_REVIEW: {
      label: 'In DOL review',
      color: '#7d5518',
      background: 'color-mix(in oklch, var(--gold-vivid) 15%, transparent)',
      border: 'rgba(200,153,47,0.32)',
      dot: '#c8992f',
    },
    NEEDS_INFORMATION: {
      label: 'Needs clarification',
      color: '#c8152a',
      background: 'rgba(212,24,61,0.10)',
      border: 'rgba(212,24,61,0.25)',
      dot: '#d4183d',
    },
    ACCEPTED: {
      label: 'Route recorded',
      color: '#1a5c38',
      background: 'rgba(31,107,65,0.12)',
      border: 'rgba(31,107,65,0.26)',
      dot: '#1f6b41',
    },
    REJECTED: {
      label: 'Rejected',
      color: '#c8152a',
      background: 'rgba(212,24,61,0.10)',
      border: 'rgba(212,24,61,0.25)',
      dot: '#d4183d',
    },
    CLOSED: {
      label: 'Closed',
      color: 'var(--ink-mid)',
      background: 'color-mix(in oklch, var(--ink-mid) 10%, transparent)',
      border: 'color-mix(in oklch, var(--ink-mid) 22%, transparent)',
      dot: '#8a7278',
    },
  };
  return (
    styles[status] ?? {
      label: labelFor(status),
      color: 'var(--ink-mid)',
      background: 'color-mix(in oklch, var(--ink-mid) 10%, transparent)',
      border: 'color-mix(in oklch, var(--ink-mid) 22%, transparent)',
      dot: '#8a7278',
    }
  );
}

export function permittedReviewRoutes(request: FrontendRequest, line: FrontendRequestLine): LineRoute[] {
  const routes: LineRoute[] = [];
  if (line.itemId) routes.push('ISSUE_FROM_STOCK');
  if (request.type !== 'CATALOG_RESTOCK') routes.push('PROCUREMENT');
  if (
    line.itemId &&
    (request.type === 'CATALOG_RESTOCK' || ['OFFICE_INVENTORY', 'PANTRY'].includes(request.catalogType))
  )
    routes.push('RESTOCK');
  routes.push('REJECT', 'MISSING_INFORMATION');
  return routes;
}

export function requestReviewSignature({
  requestId,
  revision,
  decisions,
  note,
}: {
  requestId: string;
  revision: string;
  decisions: Record<string, LineRoute>;
  note: string;
}) {
  const routes = Object.entries(decisions)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([lineId, decision]) => `${lineId}:${decision}`)
    .join('|');
  return `${requestId}|${revision}|${routes}|${note.trim()}`;
}

/** Same logical command keeps a retry-safe key; line or note changes create a new key. */
export function reviewClientRequestId(input: {
  requestId: string;
  revision: string;
  decisions: Record<string, LineRoute>;
  note: string;
}) {
  let hash = 2166136261;
  for (const character of requestReviewSignature(input))
    hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  return `fi06-${input.requestId}-${(hash >>> 0).toString(36)}`;
}

function StatusBadge({ status }: { status: string }) {
  const meta = statusStyle(status);
  return (
    <span
      className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5"
      style={{
        fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
        fontSize: 11,
        fontWeight: 500,
        background: meta.background,
        color: meta.color,
        border: `1px solid ${meta.border}`,
      }}
    >
      <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: meta.dot }} />
      {meta.label}
    </span>
  );
}

function UrgencyBadge({ priority }: { priority: string }) {
  if (!['URGENT', 'ESCALATED'].includes(priority)) return null;
  const escalated = priority === 'ESCALATED';
  return (
    <span
      className="inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5"
      style={{
        fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
        fontSize: 10,
        fontWeight: 500,
        color: escalated ? '#7d5518' : '#c8152a',
        background: escalated
          ? 'color-mix(in oklch, var(--gold-vivid) 12%, transparent)'
          : 'rgba(212,24,61,0.08)',
        border: escalated ? '1px solid rgba(200,153,47,0.28)' : '1px solid rgba(212,24,61,0.20)',
      }}
    >
      <AlertTriangle size={10} strokeWidth={2} />
      {escalated ? 'Escalated' : 'Urgent'}
    </span>
  );
}

function QueueSkeleton({ dark }: { dark: boolean }) {
  const colors = palette(dark);
  return (
    <div className="flex items-start gap-5" aria-label="Loading request queue">
      <div
        className="min-w-0 flex-1 overflow-hidden rounded-xl"
        style={{ background: colors.surface, border: `1px solid ${colors.border}` }}
      >
        <div className="flex flex-wrap gap-2 border-b px-4 py-3" style={{ borderColor: colors.border }}>
          <span className="h-8 w-56 animate-pulse rounded-md" style={{ background: colors.inset }} />
          <span className="h-8 w-24 animate-pulse rounded-full" style={{ background: colors.inset }} />
          <span className="h-8 w-24 animate-pulse rounded-full" style={{ background: colors.inset }} />
        </div>
        {[0, 1, 2, 3, 4].map((row) => (
          <div
            key={row}
            className="flex items-center gap-4 border-b px-4 py-4 last:border-b-0"
            style={{ borderColor: colors.border }}
          >
            <span className="h-8 flex-[4] animate-pulse rounded-md" style={{ background: colors.inset }} />
            <span
              className="hidden h-5 flex-1 animate-pulse rounded-md md:block"
              style={{ background: colors.inset }}
            />
            <span
              className="hidden h-5 flex-1 animate-pulse rounded-md md:block"
              style={{ background: colors.inset }}
            />
            <span className="h-5 w-24 animate-pulse rounded-full" style={{ background: colors.inset }} />
          </div>
        ))}
      </div>
      <aside
        className="hidden w-[320px] shrink-0 rounded-xl p-5 xl:block"
        style={{ background: colors.surface, border: `1px solid ${colors.border}` }}
      >
        <span className="mb-4 block h-3 w-1/2 animate-pulse rounded" style={{ background: colors.inset }} />
        <span className="block h-28 animate-pulse rounded-lg" style={{ background: colors.inset }} />
      </aside>
    </div>
  );
}

function NoticeCard({
  notice,
  onDismiss,
  onRefetch,
}: {
  notice: Notice;
  onDismiss: () => void;
  onRefetch: () => void;
}) {
  const tone =
    notice.tone === 'success'
      ? {
          icon: CheckCircle2,
          color: '#1f6b41',
          background: 'rgba(31,107,65,0.07)',
          border: 'rgba(31,107,65,0.22)',
          role: 'status' as const,
        }
      : notice.tone === 'warning'
        ? {
            icon: AlertTriangle,
            color: '#7d5518',
            background: 'color-mix(in oklch, var(--gold-vivid) 10%, transparent)',
            border: 'rgba(200,153,47,0.30)',
            role: 'alert' as const,
          }
        : {
            icon: CircleAlert,
            color: '#c8152a',
            background: 'rgba(212,24,61,0.07)',
            border: 'rgba(212,24,61,0.22)',
            role: 'alert' as const,
          };
  const Icon = tone.icon;
  return (
    <section
      role={tone.role}
      className="mb-5 flex items-start gap-3 rounded-xl px-4 py-3"
      style={{ background: tone.background, border: `1px solid ${tone.border}`, color: tone.color }}
    >
      <Icon className="mt-0.5 shrink-0" size={18} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{notice.title}</p>
        <p className="mt-0.5 text-sm leading-5">{notice.message}</p>
        {notice.correlationId && (
          <p className="mt-1 font-mono text-[10px]">Correlation {notice.correlationId}</p>
        )}
        {notice.refetch && (
          <button
            type="button"
            className="mt-2 inline-flex items-center gap-1 text-sm font-semibold underline"
            onClick={onRefetch}
          >
            Refresh authoritative queue
            <RefreshCw size={13} />
          </button>
        )}
      </div>
      <button type="button" aria-label="Dismiss message" className="rounded p-1" onClick={onDismiss}>
        <X size={16} />
      </button>
    </section>
  );
}

function State({
  title,
  detail,
  action,
  actionLabel,
  dark,
}: {
  title: string;
  detail: string;
  action: () => void;
  actionLabel: string;
  dark: boolean;
}) {
  const colors = palette(dark);
  return (
    <section className="mx-auto max-w-xl px-6 py-16 text-center" style={{ color: colors.text }}>
      <ShieldAlert className="mx-auto mb-4" size={30} style={{ color: colors.muted }} />
      <p className="font-mono text-[10px] uppercase tracking-[0.9px]" style={{ color: colors.muted }}>
        Internal Request Hub
      </p>
      <h1
        className="mt-2 font-bold tracking-tight"
        style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif", fontSize: 26 }}
      >
        {title}
      </h1>
      <p className="mx-auto mt-3 max-w-md text-sm leading-6" style={{ color: colors.muted }}>
        {detail}
      </p>
      <button
        type="button"
        className="mt-6 rounded-lg px-4 py-2.5 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--gold-vivid)]"
        style={{ background: colors.inset, border: `1px solid ${colors.border}`, color: colors.text }}
        onClick={action}
      >
        {actionLabel}
      </button>
    </section>
  );
}

function lifecycleFor(status: string) {
  const inReview = ['FOR_REVIEW', 'NEEDS_INFORMATION'].includes(status);
  const outcomeRecorded = ['ACCEPTED', 'REJECTED', 'CLOSED'].includes(status);
  return [
    { label: 'Submitted', done: true, current: false, note: 'Request is present in the authorized queue.' },
    {
      label: 'DOL review',
      done: outcomeRecorded,
      current: inReview,
      note:
        status === 'NEEDS_INFORMATION'
          ? 'Clarification is required before the next review.'
          : inReview
            ? 'Awaiting explicit line routing.'
            : outcomeRecorded
              ? 'Review outcome is recorded.'
              : `Server state: ${labelFor(status)}.`,
    },
    {
      label: 'Line routing',
      done: status === 'ACCEPTED',
      current: false,
      note:
        status === 'ACCEPTED'
          ? 'The server recorded downstream line routes.'
          : 'No route is inferred by this browser.',
    },
    {
      label: 'Outcome',
      done: ['REJECTED', 'CLOSED'].includes(status),
      current: false,
      note:
        status === 'REJECTED'
          ? 'The server recorded rejection.'
          : status === 'CLOSED'
            ? 'The record is closed.'
            : 'Wait for the authoritative lifecycle update.',
    },
  ];
}

function RequestInspector({
  dark,
  item,
  lines,
  events,
  inventory,
  decisions,
  note,
  canWrite,
  readOnlyReason,
  inspection,
  submitting,
  inlineError,
  canRecover,
  lineSelectRefs,
  onSetDecision,
  onSetNote,
  onClose,
  onSubmit,
  onRefetch,
}: {
  dark: boolean;
  item: FrontendRequest;
  lines: FrontendRequestLine[];
  events: FrontendRequestBootstrap['events'];
  inventory: FrontendRequestBootstrap['inventoryItems'];
  decisions: Record<string, LineRoute>;
  note: string;
  canWrite: boolean;
  readOnlyReason: string;
  inspection: boolean;
  submitting: boolean;
  inlineError: string;
  canRecover: boolean;
  lineSelectRefs: MutableRefObject<Record<string, HTMLSelectElement | null>>;
  onSetDecision: (lineId: string, route: LineRoute) => void;
  onSetNote: (value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
  onRefetch: () => void;
}) {
  const colors = palette(dark);
  const dialogRef = useRef<HTMLDivElement>(null);
  useDialogFocusTrap({ open: true, dialogRef });
  const event = events.find((entry) => entry.id === item.eventId);
  const inventoryById = useMemo(() => new Map(inventory.map((entry) => [entry.id, entry])), [inventory]);
  const lifecycle = lifecycleFor(item.status);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [onClose]);

  return (
    <>
      <button
        aria-label="Close request record"
        className="fixed inset-0 z-40 hidden cursor-default md:block"
        style={{ background: 'rgba(0,0,0,0.18)' }}
        onClick={onClose}
      />
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="internal-request-record-title"
        tabIndex={-1}
        className="fixed inset-0 z-50 flex w-full flex-col overflow-y-auto overscroll-contain md:inset-y-0 md:left-auto md:w-[min(470px,100vw)]"
        style={{
          background: colors.surface,
          color: colors.text,
          borderLeft: `1px solid ${colors.border}`,
          boxShadow: '-4px 0 28px rgba(0,0,0,0.16)',
        }}
      >
        <header
          className="flex shrink-0 items-center justify-between gap-3 px-5 py-3"
          style={{ borderBottom: `1px solid ${colors.border}` }}
        >
          <button
            type="button"
            data-dialog-initial-focus
            aria-label="Back to requests"
            className="inline-flex min-h-11 min-w-11 items-center justify-center gap-2 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--gold-vivid)] md:border"
            style={{ background: colors.inset, borderColor: colors.border, color: colors.muted }}
            onClick={onClose}
          >
            <ArrowLeft className="md:hidden" size={15} />
            <X className="hidden md:block" size={16} />
            <span className="text-sm md:hidden">Back to requests</span>
          </button>
          <span className="font-mono text-[9px] uppercase tracking-[0.9px]" style={{ color: colors.muted }}>
            request.record
          </span>
        </header>
        <div className="shrink-0 px-5 pb-4 pt-5" style={{ borderBottom: `1px solid ${colors.border}` }}>
          <div className="mb-2 flex flex-wrap items-center gap-2">
            <span className="font-mono text-[10px]" style={{ color: colors.muted }}>
              {item.id}
            </span>
            <StatusBadge status={item.status} />
            <UrgencyBadge priority={item.priority} />
          </div>
          <h2
            id="internal-request-record-title"
            className="font-bold tracking-tight"
            style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif", fontSize: 18 }}
          >
            {item.purpose || 'No purpose recorded'}
          </h2>
          <p className="mt-1 text-xs leading-5" style={{ color: colors.muted }}>
            {item.department || 'Department not reported'} · {lines.length} reviewable{' '}
            {lines.length === 1 ? 'line' : 'lines'} · updated {shortDate(item.updatedAt)}
          </p>
          <p className="mt-1 text-xs leading-5" style={{ color: colors.muted }}>
            {event
              ? `Event: ${event.name}`
              : item.eventId
                ? `Event reference: ${item.eventId}`
                : 'No event reference supplied'}
          </p>
          {inspection && (
            <p
              className="mt-3 inline-block rounded-md px-2 py-1 font-mono text-[9px] uppercase tracking-[0.8px]"
              style={{ color: '#7d5518', background: '#fbeed2', border: '1px solid #dcbe8a' }}
            >
                Preview inspection fixture · no service action
            </p>
          )}
        </div>
        <section
          className="shrink-0 px-5 py-4"
          style={{ borderBottom: `1px solid ${colors.border}` }}
          aria-label="Lifecycle"
        >
          <p className="mb-3 font-mono text-[9px] uppercase tracking-[0.9px]" style={{ color: colors.muted }}>
            Lifecycle
          </p>
          {lifecycle.map((step, index) => (
            <div key={step.label} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span
                  className="inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full"
                  style={{
                    background: step.done ? '#1f6b41' : step.current ? '#c8992f' : 'transparent',
                    border: step.done ? 'none' : `1.5px solid ${step.current ? '#c8992f' : colors.border}`,
                  }}
                >
                  {step.done && <CheckCircle2 size={10} color="#fff" strokeWidth={2.5} />}
                </span>
                {index < lifecycle.length - 1 && (
                  <span className="h-5 w-px" style={{ background: step.done ? '#1f6b41' : colors.border }} />
                )}
              </div>
              <div className="min-h-10 pb-1">
                <p
                  className="text-xs font-medium"
                  style={{ color: step.done || step.current ? colors.text : colors.muted }}
                >
                  {step.label}
                </p>
                <p className="mt-0.5 text-[11px] leading-4" style={{ color: colors.muted }}>
                  {step.note}
                </p>
              </div>
            </div>
          ))}
        </section>
        <section className="shrink-0 px-5 py-4" style={{ borderBottom: `1px solid ${colors.border}` }}>
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="font-mono text-[9px] uppercase tracking-[0.9px]" style={{ color: colors.muted }}>
              Explicit line routing
            </p>
            <span className="font-mono text-[10px]" style={{ color: colors.muted }}>
              {lines.length} reviewable
            </span>
          </div>
          {lines.length === 0 ? (
            <p
              className="rounded-lg px-3 py-3 text-sm"
              style={{ color: colors.muted, background: colors.inset, border: `1px solid ${colors.border}` }}
            >
              No reviewable lines remain for this server-projected record.
            </p>
          ) : (
            <div className="overflow-hidden rounded-lg" style={{ border: `1px solid ${colors.border}` }}>
              {lines.map((line, index) => {
                const catalogItem = inventoryById.get(line.itemId);
                return (
                  <div
                    key={line.id}
                    className="px-3 py-3"
                    style={{
                      background: colors.surface,
                      borderTop: index ? `1px solid ${colors.border}` : 'none',
                    }}
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium">{line.description}</p>
                      <p className="mt-0.5 text-[11px] leading-4" style={{ color: colors.muted }}>
                        {line.quantity} {line.unit} · {labelFor(line.status)}
                        {line.neededAt ? ` · needed ${shortDate(line.neededAt)}` : ''}
                      </p>
                      <p className="mt-0.5 font-mono text-[10px]" style={{ color: colors.muted }}>
                        {catalogItem
                          ? `Catalog reference: ${catalogItem.name}`
                          : line.itemId
                            ? `Catalog reference: ${line.itemId}`
                            : 'No exact catalog item'}
                      </p>
                    </div>
                    {canWrite ? (
                      <label className="mt-3 block text-[11px]" style={{ color: colors.muted }}>
                        Route decision
                        <select
                          ref={(element) => {
                            lineSelectRefs.current[line.id] = element;
                          }}
                          aria-label={`Route ${line.description}`}
                          value={decisions[line.id] ?? ''}
                          onChange={(event) => onSetDecision(line.id, event.target.value as LineRoute)}
                          className="mt-1.5 w-full rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--gold-vivid)]"
                          style={{
                            color: colors.text,
                            background: colors.inset,
                            border: `1px solid ${colors.border}`,
                          }}
                        >
                          <option value="">Select a server-permitted route</option>
                          {permittedReviewRoutes(item, line).map((route) => (
                            <option key={route} value={route}>
                              {ROUTE_LABELS[route]}
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : (
                      <p
                        className="mt-3 rounded-md px-3 py-2 text-xs"
                        style={{
                          color: colors.muted,
                          background: colors.inset,
                          border: `1px solid ${colors.border}`,
                        }}
                      >
                        {readOnlyReason}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>
        <section className="shrink-0 px-5 py-4" style={{ borderBottom: `1px solid ${colors.border}` }}>
          <p className="mb-2 font-mono text-[9px] uppercase tracking-[0.9px]" style={{ color: colors.muted }}>
            Context
          </p>
          <div className="space-y-2 text-xs leading-5" style={{ color: colors.muted }}>
            <p>Committee scope reference: {item.ownerCommitteeId || 'not reported'}.</p>
            <p>Request stage: {item.stage ? labelFor(item.stage) : 'not reported'}.</p>
            <p>
              Creation belongs to the authenticated External Request Center; this DOL surface only reads and
              reviews the existing queue.
            </p>
          </div>
        </section>
        {canWrite && lines.length > 0 && (
          <section className="mt-auto shrink-0 px-5 py-4" style={{ borderTop: `1px solid ${colors.border}` }}>
            <label className="block text-xs" style={{ color: colors.muted }}>
              Review note <span className="font-normal">(optional)</span>
              <textarea
                value={note}
                onChange={(event) => onSetNote(event.target.value)}
                maxLength={500}
                rows={3}
                placeholder="Recorded with this review command"
                className="mt-1.5 w-full resize-y rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--gold-vivid)]"
                style={{ color: colors.text, background: colors.inset, border: `1px solid ${colors.border}` }}
              />
            </label>
            {inlineError && (
              <div
                role="alert"
                className="mt-3 rounded-lg px-3 py-2 text-sm"
                style={{
                  color: '#c8152a',
                  background: 'rgba(212,24,61,0.07)',
                  border: '1px solid rgba(212,24,61,0.22)',
                }}
              >
                <p>{inlineError}</p>
                {canRecover && (
                  <button
                    type="button"
                    className="mt-2 inline-flex items-center gap-1 text-sm font-semibold underline"
                    style={{ color: '#7d5518' }}
                    onClick={onRefetch}
                  >
                    Refresh authoritative queue
                    <RefreshCw size={13} />
                  </button>
                )}
              </div>
            )}
            <button
              type="button"
              disabled={submitting}
              className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
              style={{ color: 'var(--gold-cream)', background: 'var(--oxblood-deep)' }}
              onClick={onSubmit}
            >
              {submitting && <LoaderCircle className="animate-spin" size={15} />}
              {submitting
                ? 'Recording server review…'
                : inspection
                  ? 'Record local review demonstration'
                  : 'Record review'}
            </button>
            <p className="mt-2 text-center font-mono text-[9px] leading-4" style={{ color: colors.muted }}>
              Every reviewable line needs one explicit route. This browser does not calculate stock or
              reservations.
            </p>
          </section>
        )}
      </section>
    </>
  );
}

export function InternalRequestHub({
  dark,
  navigate,
  inspection = false,
  canReviewRequests = false,
}: {
  dark: boolean;
  navigate: (route: Route) => void;
  inspection?: boolean;
  canReviewRequests?: boolean;
}) {
  const colors = palette(dark);
  const [queue, setQueue] = useState<FrontendRequestBootstrap>(inspection ? PREVIEW_QUEUE : EMPTY_QUEUE);
  const queueRef = useRef(queue);
  const [loadState, setLoadState] = useState<LoadState>(inspection ? 'ready' : 'loading');
  const [query, setQuery] = useState('');
  const [serverQuery, setServerQuery] = useState('');
  const [archiveFilter, setArchiveFilter] = useState<(typeof ARCHIVE_FILTERS)[number]['value']>('ACTIVE');
  const [statusFilters, setStatusFilters] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [refreshEpoch, setRefreshEpoch] = useState(0);
  const [selected, setSelected] = useState<FrontendRequest | null>(null);
  const [decisions, setDecisions] = useState<Record<string, LineRoute>>({});
  const [note, setNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [inlineError, setInlineError] = useState('');
  const [notice, setNotice] = useState<Notice | null>(null);
  const requestSequence = useRef(0);
  const submissionInFlight = useRef(false);
  const triggerRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const lineSelectRefs = useRef<Record<string, HTMLSelectElement | null>>({});

  const refetch = useCallback(() => {
    if (!inspection) setRefreshEpoch((value) => value + 1);
  }, [inspection]);

  useEffect(() => {
    if (inspection) return;
    const timeout = window.setTimeout(() => setServerQuery(query.trim()), 220);
    return () => window.clearTimeout(timeout);
  }, [inspection, query]);

  useEffect(() => {
    if (inspection) return;
    const controller = new AbortController();
    const sequence = requestSequence.current + 1;
    requestSequence.current = sequence;
    setLoadState(queueRef.current.requests.length ? 'refreshing' : 'loading');
    void frontendBackend
      .requestBootstrap({
        page,
        pageSize: 25,
        query: serverQuery,
        filter: archiveFilter,
        signal: controller.signal,
      })
      .then((next) => {
        if (controller.signal.aborted || sequence !== requestSequence.current) return;
        queueRef.current = next;
        setQueue(next);
        setSelected((current) =>
          current ? (next.requests.find((request) => request.id === current.id) ?? null) : null,
        );
        setLoadState('ready');
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted || sequence !== requestSequence.current) return;
        if (error instanceof FrontendApiError && [401, 403].includes(error.status)) {
          setLoadState('denied');
          return;
        }
        setLoadState(queueRef.current.requests.length ? 'stale' : 'error');
      });
    return () => controller.abort();
  }, [archiveFilter, inspection, page, refreshEpoch, serverQuery]);

  const visible = useMemo(
    () => queue.requests.filter((request) => !statusFilters.length || statusFilters.includes(request.status)),
    [queue.requests, statusFilters],
  );
  const reviewableLines = useMemo(
    () =>
      queue.requestLines.filter(
        (line) => line.requestId === selected?.id && REVIEWABLE_LINE_STATUSES.has(line.status),
      ),
    [queue.requestLines, selected?.id],
  );
  const pageCount = Math.max(1, Math.ceil(queue.pagination.total / Math.max(1, queue.pagination.pageSize)));
  const writeEnabled = (inspection || canReviewRequests) && loadState === 'ready';
  const closeInspector = useCallback(() => {
    const requestId = selected?.id;
    setSelected(null);
    setInlineError('');
    if (requestId) requestAnimationFrame(() => triggerRefs.current[requestId]?.focus());
  }, [selected?.id]);
  const selectRequest = useCallback((request: FrontendRequest) => {
    setSelected(request);
    setDecisions({});
    setNote('');
    setInlineError('');
  }, []);

  const submitReview = useCallback(async () => {
    if (!selected || submitting || submissionInFlight.current || !writeEnabled) return;
    const missing = reviewableLines.find((line) => !decisions[line.id]);
    if (missing) {
      setInlineError('Choose one explicit route for every reviewable line before recording this review.');
      requestAnimationFrame(() => lineSelectRefs.current[missing.id]?.focus());
      return;
    }
    if (inspection) {
      setInlineError('');
      setNotice({
        tone: 'success',
        title: 'Local review demonstration recorded',
        message:
          'This fixture-only interaction did not contact a protected service or create a business record.',
      });
      return;
    }
    const normalizedNote = note.trim();
    submissionInFlight.current = true;
    setSubmitting(true);
    setInlineError('');
    setNotice(null);
    try {
      const result = await frontendBackend.reviewRequest({
        requestId: selected.id,
        decision: 'ACCEPT',
        lineDecisions: reviewableLines.map((line) => ({ lineId: line.id, decision: decisions[line.id] })),
        note: normalizedNote || undefined,
        clientRequestId: reviewClientRequestId({
          requestId: selected.id,
          revision: selected.updatedAt,
          decisions,
          note: normalizedNote,
        }),
      });
      setNotice({
        tone: 'success',
        title: 'Server review recorded',
        message: `${result.requestId} is now ${labelFor(result.status)}${result.replayed ? ' (idempotent replay)' : ''}. Refreshing the authoritative queue.`,
        correlationId: result.correlationId || undefined,
      });
      closeInspector();
      refetch();
    } catch (error: unknown) {
      const api = error instanceof FrontendApiError ? error : null;
      const conflict = api?.status === 409;
      const denied = api?.status === 403;
      const message = api?.message || 'The review could not be recorded. No local success was assumed.';
      setInlineError(message);
      setNotice({
        tone: conflict ? 'warning' : 'error',
        title: conflict
          ? 'Review changed on the server'
          : denied
            ? 'Review is not permitted'
            : 'Review was not recorded',
        message,
        correlationId: api?.correlationId || undefined,
        refetch: conflict || denied,
      });
    } finally {
      submissionInFlight.current = false;
      setSubmitting(false);
    }
  }, [
    closeInspector,
    decisions,
    inspection,
    note,
    refetch,
    reviewableLines,
    selected,
    submitting,
    writeEnabled,
  ]);

  if (loadState === 'denied')
    return (
      <State
        dark={dark}
        title="Access limited"
        detail="This DOL-only Internal Request Hub requires both the internal workspace and request-view capabilities from the current server session."
        action={() => navigate('overview')}
        actionLabel="Return to overview"
      />
    );
  if (loadState === 'error')
    return (
      <State
        dark={dark}
        title="Request queue unavailable"
        detail="No request data was changed. Retry the same authenticated bootstrap when the service is available."
        action={refetch}
        actionLabel="Retry queue"
      />
    );

  return (
    <main
      className="mx-auto max-w-[1440px] px-4 py-8 md:px-8"
      style={{ color: colors.text }}
      data-fi06-state={loadState}
    >
      <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="font-mono text-[10px] uppercase tracking-[1px]" style={{ color: colors.muted }}>
            DOL · Internal Request Hub
          </p>
          <h1
            className="mt-1 font-bold tracking-tight"
            style={{
              fontFamily: "'Bricolage Grotesque', system-ui, sans-serif",
              fontSize: 'clamp(24px, 3vw, 32px)',
            }}
          >
            Request review queue
          </h1>
          <p className="mt-1 text-sm" style={{ color: colors.muted }}>
            Review server-projected requests and record an explicit route for every reviewable line.
          </p>
        </div>
        <button
          type="button"
          disabled={loadState === 'loading' || inspection}
          className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
          style={{ color: colors.text, background: colors.inset, border: `1px solid ${colors.border}` }}
          onClick={refetch}
        >
          <RefreshCw size={14} />
          Refresh queue
        </button>
      </header>
      {notice && <NoticeCard notice={notice} onDismiss={() => setNotice(null)} onRefetch={refetch} />}
      {inspection ? (
        <p
          className="mb-4 rounded-lg px-3 py-2 text-xs"
          style={{ color: '#7d5518', background: '#fbeed2', border: '1px solid #dcbe8a' }}
        >
          Local Preview Inspection: deterministic fixture and local-only action demonstration. No protected
          request or mutation is sent.
        </p>
      ) : !canReviewRequests ? (
        <p
          className="mb-4 rounded-lg px-3 py-2 text-xs"
          style={{ color: colors.muted, background: colors.inset, border: `1px solid ${colors.border}` }}
        >
          Read-only queue: the current server-projected session does not include request.review. The Worker
          remains authoritative for every review attempt.
        </p>
      ) : null}
      {loadState === 'stale' && (
        <p
          role="alert"
          className="mb-4 rounded-lg px-3 py-2 text-sm"
          style={{
            color: '#7d5518',
            background: 'color-mix(in oklch, var(--gold-vivid) 10%, transparent)',
            border: '1px solid rgba(200,153,47,0.30)',
          }}
        >
          Last known queue shown. The refresh did not complete, so review controls remain disabled until a
          fresh authoritative page arrives.
        </p>
      )}
      {loadState === 'refreshing' && (
        <p
          role="status"
          className="mb-4 rounded-lg px-3 py-2 text-sm"
          style={{
            color: colors.muted,
            background: colors.inset,
            border: `1px solid ${colors.border}`,
          }}
        >
          Updating the authoritative queue. Review controls are temporarily disabled until this refresh
          completes.
        </p>
      )}
      {loadState === 'loading' ? (
        <QueueSkeleton dark={dark} />
      ) : (
        <div className="flex items-start gap-5">
          <section
            className="min-w-0 flex-1 overflow-hidden rounded-xl"
            style={{ background: colors.surface, border: `1px solid ${colors.border}` }}
            aria-label="Request queue"
          >
            <div
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              style={{ borderBottom: `1px solid ${colors.border}` }}
            >
              <p className="text-sm font-semibold">Queue</p>
              <span className="font-mono text-[10px]" style={{ color: colors.muted }}>
                {queue.pagination.total} server-scoped {queue.pagination.total === 1 ? 'request' : 'requests'}
              </span>
            </div>
            <div className="border-b px-4 py-3" style={{ borderColor: colors.border }}>
              <div className="flex flex-col gap-3">
                <label className="relative block max-w-md">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2"
                    size={14}
                    style={{ color: colors.muted }}
                  />
                  <input
                    type="search"
                    value={query}
                    onChange={(event) => {
                      setQuery(event.target.value);
                      setPage(1);
                    }}
                    placeholder="Search request ID, purpose, or requester…"
                    className="w-full rounded-lg py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--gold-vivid)]"
                    style={{
                      color: colors.text,
                      background: colors.inset,
                      border: `1px solid ${colors.border}`,
                    }}
                  />
                </label>
                <div className="flex flex-wrap items-center gap-1.5">
                  {ARCHIVE_FILTERS.map((filter) => {
                    const active = archiveFilter === filter.value;
                    return (
                      <button
                        key={filter.value}
                        type="button"
                        aria-pressed={active}
                        onClick={() => {
                          setArchiveFilter(filter.value);
                          setPage(1);
                        }}
                        className="rounded-full px-3 py-1 text-[11px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--gold-vivid)]"
                        style={{
                          color: active ? '#7d5518' : colors.muted,
                          background: active
                            ? 'color-mix(in oklch, var(--gold-vivid) 12%, transparent)'
                            : 'transparent',
                          border: `1px solid ${active ? 'rgba(200,153,47,0.30)' : colors.border}`,
                        }}
                      >
                        {filter.label}
                      </button>
                    );
                  })}
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span
                    className="mr-1 font-mono text-[9px] uppercase tracking-[0.7px]"
                    style={{ color: colors.muted }}
                  >
                    This page
                  </span>
                  {STATUS_FILTERS.map((status) => {
                    const active = statusFilters.includes(status);
                    const meta = statusStyle(status);
                    return (
                      <button
                        key={status}
                        type="button"
                        aria-pressed={active}
                        onClick={() =>
                          setStatusFilters((current) =>
                            active ? current.filter((entry) => entry !== status) : [...current, status],
                          )
                        }
                        className="rounded-full px-3 py-1 text-[11px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--gold-vivid)]"
                        style={{
                          color: active ? meta.color : colors.muted,
                          background: active ? meta.background : 'transparent',
                          border: `1px solid ${active ? meta.border : colors.border}`,
                        }}
                      >
                        {meta.label}
                      </button>
                    );
                  })}
                  {(statusFilters.length > 0 || query) && (
                    <button
                      type="button"
                      onClick={() => {
                        setStatusFilters([]);
                        setQuery('');
                        setServerQuery('');
                        setPage(1);
                      }}
                      className="rounded-full px-3 py-1 text-[11px] underline"
                      style={{ color: colors.muted }}
                    >
                      Clear filters
                    </button>
                  )}
                </div>
              </div>
            </div>
            <p
              className="border-b px-4 py-2 text-[11px]"
              style={{ color: colors.muted, borderColor: colors.border }}
            >
              Server filter and pagination define this queue. Status chips refine only the loaded page; the
              browser does not infer queue membership or route legality.
            </p>
            {visible.length === 0 ? (
              <div className="flex min-h-56 flex-col items-center justify-center gap-3 px-5 py-12 text-center">
                <p
                  className="font-mono text-[10px] uppercase tracking-[0.8px]"
                  style={{ color: colors.muted }}
                >
                  {queue.requests.length
                    ? 'No loaded request matches these status filters'
                    : 'No requests are in this authorized scope'}
                </p>
                {queue.requests.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setStatusFilters([])}
                    className="rounded-lg px-3 py-2 text-sm"
                    style={{
                      color: colors.text,
                      background: colors.inset,
                      border: `1px solid ${colors.border}`,
                    }}
                  >
                    Clear status filters
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="md:hidden">
                  {visible.map((request, index) => {
                    const selectedRow = selected?.id === request.id;
                    const lineCount = queue.requestLines.filter(
                      (line) => line.requestId === request.id && REVIEWABLE_LINE_STATUSES.has(line.status),
                    ).length;
                    return (
                      <button
                        key={request.id}
                        ref={(element) => {
                          triggerRefs.current[request.id] = element;
                        }}
                        type="button"
                        onClick={() => selectRequest(request)}
                        aria-pressed={selectedRow}
                        className="flex w-full flex-col gap-2 px-4 py-4 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[var(--gold-vivid)]"
                        style={{
                          background: selectedRow ? colors.selected : colors.surface,
                          borderTop: index ? `1px solid ${colors.border}` : 'none',
                          borderLeft: selectedRow ? '3px solid #c8992f' : '3px solid transparent',
                        }}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <span className="text-sm font-semibold leading-5">
                            {request.purpose || 'No purpose recorded'}
                          </span>
                          <StatusBadge status={request.status} />
                        </div>
                        <div
                          className="flex flex-wrap gap-x-3 gap-y-1 text-[11px]"
                          style={{ color: colors.muted }}
                        >
                          <span className="font-mono">{request.id}</span>
                          <span>{request.department || 'Department not reported'}</span>
                          <span>
                            {lineCount} reviewable {lineCount === 1 ? 'line' : 'lines'}
                          </span>
                          <span>Updated {shortDate(request.updatedAt)}</span>
                        </div>
                        <UrgencyBadge priority={request.priority} />
                      </button>
                    );
                  })}
                </div>
                <div className="hidden overflow-x-auto md:block">
                  <table className="w-full" style={{ borderCollapse: 'collapse', minWidth: 690 }}>
                    <thead>
                      <tr style={{ background: colors.inset, borderBottom: `1px solid ${colors.border}` }}>
                        {['Request', 'Committee', 'Needed by', 'State', 'Urgency'].map((heading) => (
                          <th
                            key={heading}
                            scope="col"
                            className="px-4 py-2.5 text-left font-mono text-[9px] uppercase tracking-[1px]"
                            style={{ color: colors.muted }}
                          >
                            {heading}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {visible.map((request, index) => {
                        const selectedRow = selected?.id === request.id;
                        const lines = queue.requestLines.filter(
                          (line) =>
                            line.requestId === request.id && REVIEWABLE_LINE_STATUSES.has(line.status),
                        );
                        return (
                          <tr
                            key={request.id}
                            style={{
                              background: selectedRow
                                ? colors.selected
                                : index % 2
                                  ? colors.zebra
                                  : colors.surface,
                              borderTop: index ? `1px solid ${colors.border}` : 'none',
                              borderLeft: selectedRow ? '3px solid #c8992f' : '3px solid transparent',
                            }}
                          >
                            <td className="px-4 py-3" style={{ maxWidth: 330 }}>
                              <button
                                ref={(element) => {
                                  triggerRefs.current[request.id] = element;
                                }}
                                type="button"
                                onClick={() => selectRequest(request)}
                                aria-pressed={selectedRow}
                                className="w-full rounded text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--gold-vivid)]"
                              >
                                <p className="text-sm font-semibold leading-5">
                                  {request.purpose || 'No purpose recorded'}
                                </p>
                                <p className="mt-0.5 font-mono text-[10px]" style={{ color: colors.muted }}>
                                  {request.id} · {request.department || 'Department not reported'} ·{' '}
                                  {lines.length} reviewable {lines.length === 1 ? 'line' : 'lines'}
                                </p>
                              </button>
                            </td>
                            <td
                              className="whitespace-nowrap px-4 py-3 text-xs"
                              style={{ color: colors.muted }}
                            >
                              {request.ownerCommitteeId || 'Not reported'}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3 font-mono text-xs">
                              {shortDate(
                                lines.map((line) => line.neededAt).find(Boolean) || request.updatedAt,
                              )}
                            </td>
                            <td className="whitespace-nowrap px-4 py-3">
                              <StatusBadge status={request.status} />
                            </td>
                            <td className="px-4 py-3">
                              <UrgencyBadge priority={request.priority} />
                              <span className="font-mono text-[10px]" style={{ color: colors.muted }}>
                                {['URGENT', 'ESCALATED'].includes(request.priority) ? '' : '—'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </>
            )}
            <footer
              className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
              style={{ background: colors.inset, borderTop: `1px solid ${colors.border}` }}
            >
              <span className="font-mono text-[10px]" style={{ color: colors.muted }}>
                Page {queue.pagination.page} of {pageCount} · {queue.pagination.total} total
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={queue.pagination.page <= 1}
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ color: colors.text, border: `1px solid ${colors.border}` }}
                >
                  <ChevronLeft size={14} />
                  Previous
                </button>
                <button
                  type="button"
                  disabled={!queue.pagination.hasMore}
                  onClick={() => setPage((current) => current + 1)}
                  className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-xs disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ color: colors.text, border: `1px solid ${colors.border}` }}
                >
                  Next
                  <ChevronRight size={14} />
                </button>
              </div>
            </footer>
          </section>
          <aside
            className="hidden w-[320px] shrink-0 rounded-xl p-5 xl:block"
            style={{ background: colors.surface, border: `1px solid ${colors.border}` }}
          >
            <p className="font-mono text-[9px] uppercase tracking-[0.9px]" style={{ color: colors.muted }}>
              Queue context
            </p>
            <p className="mt-3 text-sm leading-5" style={{ color: colors.text }}>
              Select one request to inspect its lifecycle, event reference, catalog references, and reviewable
              line routes.
            </p>
            <dl className="mt-5 space-y-3 text-xs">
              <div>
                <dt
                  className="font-mono text-[9px] uppercase tracking-[0.7px]"
                  style={{ color: colors.muted }}
                >
                  Scope revision
                </dt>
                <dd className="mt-1 break-all" style={{ color: colors.text }}>
                  {queue.scopeRevision?.token || 'Not reported'}
                </dd>
              </div>
              <div>
                <dt
                  className="font-mono text-[9px] uppercase tracking-[0.7px]"
                  style={{ color: colors.muted }}
                >
                  Event references
                </dt>
                <dd className="mt-1" style={{ color: colors.text }}>
                  {queue.events.length} projected for this page
                </dd>
              </div>
              <div>
                <dt
                  className="font-mono text-[9px] uppercase tracking-[0.7px]"
                  style={{ color: colors.muted }}
                >
                  Catalog references
                </dt>
                <dd className="mt-1" style={{ color: colors.text }}>
                  {queue.inventoryItems.length} projected; no availability is calculated here
                </dd>
              </div>
            </dl>
            <p
              className="mt-6 rounded-lg px-3 py-3 text-xs leading-5"
              style={{ color: colors.muted, background: colors.inset, border: `1px solid ${colors.border}` }}
            >
              Creation remains in the authenticated External Request Center. This internal DOL route neither
              creates a request nor releases stock.
            </p>
          </aside>
        </div>
      )}
      {selected && (
        <RequestInspector
          dark={dark}
          item={selected}
          lines={reviewableLines}
          events={queue.events}
          inventory={queue.inventoryItems}
          decisions={decisions}
          note={note}
          canWrite={writeEnabled}
          readOnlyReason={
            loadState === 'refreshing'
              ? 'Review controls are temporarily disabled while the authoritative queue updates.'
              : loadState === 'stale'
                ? 'Review controls are disabled until a fresh authoritative page arrives.'
                : 'Read-only: the current session has no server-projected request.review capability.'
          }
          inspection={inspection}
          submitting={submitting}
          inlineError={inlineError}
          canRecover={notice?.refetch === true}
          lineSelectRefs={lineSelectRefs}
          onSetDecision={(lineId, route) => {
            setDecisions((current) => ({ ...current, [lineId]: route }));
            setInlineError('');
          }}
          onSetNote={(value) => {
            setNote(value);
            setInlineError('');
          }}
          onClose={closeInspector}
          onSubmit={() => void submitReview()}
          onRefetch={refetch}
        />
      )}
    </main>
  );
}
