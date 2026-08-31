/* HAU-USC Logistics — External Request Center (context B)
 *
 * R3-A1-A2. Verified USC staff and officers only. A session is required, and the
 * boundary is real rather than cosmetic: every call here goes to
 * `/api/portal/request`, which the Worker authorizes with
 * `authorize(request, auth, CAPABILITIES.REQUEST_CREATE)` and scopes to
 * `requester_account_id = <session account>`. Requester identity is taken from
 * the session server-side and is never supplied by the browser.
 *
 * This is deliberately NOT the old public request wizard behind a login screen.
 * The public wizard collected requester name, type, organization, contact number
 * and email as free text and posted to `/api/public/request`. Gating that form
 * would have produced a frontend-only security boundary — the thing R3-A1-A2 §20
 * forbids — because the endpoint behind it accepts anonymous submissions.
 *
 * DOL requester mode: a DOL account that deliberately opened this surface stays
 * here and is offered `Open Logistics Hub`. It is not redirected into the Main
 * Logistics Hub, because its explicit entry intent was requester mode.
 */

import { useCallback, useEffect, useId, useMemo, useState } from 'react';
import { ArrowUpRight, Home, Plus, Trash2 } from 'lucide-react';

import { ap } from '../theme/palette';
import { ThemeToggle } from '../brand/ThemeToggle';
import { DolMark, UscMark } from '../brand/BrandMarks';
import {
  FrontendApiError,
  frontendBackend,
  type RequesterPortal,
  type RequesterSubmissionReceipt,
} from '../../integration/backend';

type PortalState = 'loading' | 'ready' | 'error' | 'portal-unavailable';

/** Presentation only. Real authorization remains entirely server-side. */
export type RequesterPresentation = Readonly<{
  displayName: string;
  internalOperator: boolean;
}>;

type DraftLine = {
  category: string;
  description: string;
  custom: boolean;
  specification: string;
  quantity: number;
  unit: string;
};

const ACKS = [
  {
    name: 'reviewAcknowledged',
    title: 'Review acknowledgment',
    body: 'I understand this request starts For Review and that submitting it does not reserve stock or guarantee fulfilment.',
  },
  {
    name: 'authorityAcknowledged',
    title: 'Requester authority',
    body: 'I am submitting this on behalf of my USC office, committee, or activity, and I am authorized to do so.',
  },
  {
    name: 'acceptableUseAcknowledged',
    title: 'Acceptable Use acknowledgment',
    body: 'I will provide accurate authorized information and will not put secrets, unrelated sensitive data, or another person’s information in this request.',
  },
] as const;

type AckName = (typeof ACKS)[number]['name'];

const pretty = (value: string) => value.replaceAll('_', ' ');

const newClientRequestId = () => `frontend-${crypto.randomUUID()}`;

const emptyLine = (category: string, unit: string): DraftLine => ({
  category,
  description: '',
  custom: false,
  specification: '',
  quantity: 1,
  unit,
});

export function ExternalRequestCenter({
  presentation,
  dark,
  onToggleTheme,
  onHome,
  onOpenLogisticsHub,
  onSignOut,
  requesterMode,
  previewPortal,
  inspection = false,
}: {
  presentation: RequesterPresentation;
  dark: boolean;
  onToggleTheme: () => void;
  onHome: () => void;
  onOpenLogisticsHub: () => void;
  onSignOut: () => Promise<void>;
  requesterMode: boolean;
  previewPortal?: RequesterPortal;
  inspection?: boolean;
}) {
  const c = ap(dark);
  const formId = useId();
  const [state, setState] = useState<PortalState>(previewPortal ? 'ready' : 'loading');
  const [portal, setPortal] = useState<RequesterPortal | null>(previewPortal ?? null);
  const [reload, setReload] = useState(0);
  const [alert, setAlert] = useState('');
  const [live, setLive] = useState('');
  const [portalErrorCode, setPortalErrorCode] = useState('');

  const [composing, setComposing] = useState(false);
  const [requestType, setRequestType] = useState<'NEW' | 'ADDITIONAL'>('NEW');
  const [parentRequestId, setParentRequestId] = useState('');
  const [eventSeriesId, setEventSeriesId] = useState('');
  const [eventId, setEventId] = useState('');
  const [purpose, setPurpose] = useState('');
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [acks, setAcks] = useState<Record<AckName, boolean>>({
    reviewAcknowledged: false,
    authorityAcknowledged: false,
    acceptableUseAcknowledged: false,
  });
  const [busy, setBusy] = useState(false);
  const [receipt, setReceipt] = useState<RequesterSubmissionReceipt | null>(null);
  const [clientRequestId, setClientRequestId] = useState(newClientRequestId);

  useEffect(() => {
    if (previewPortal) {
      setPortal(previewPortal);
      setState('ready');
      setAlert('');
      return;
    }
    const controller = new AbortController();
    setState('loading');
    setAlert('');
    void frontendBackend
      .requesterPortal(controller.signal)
      .then((next) => {
        setPortal(next);
        setState('ready');
      })
      .catch((error: unknown) => {
        if ((error as { name?: string })?.name === 'AbortError') return;
        const code = error instanceof FrontendApiError ? error.code : '';
        setPortalErrorCode(code);
        // REQUESTER_PORTAL_REQUIRED is the server telling us this account is not a
        // roleId REQUESTER. That is the recorded DOL-requester-mode contract gap,
        // not a client bug, and it is reported truthfully rather than masked.
        setState(
          code === 'REQUESTER_PORTAL_REQUIRED' || code === 'CAPABILITY_REQUIRED'
            ? 'portal-unavailable'
            : 'error',
        );
        setAlert(
          error instanceof FrontendApiError
            ? error.message
            : 'The request service is temporarily unavailable.',
        );
      });
    return () => controller.abort();
  }, [previewPortal, reload]);

  const categories = useMemo(() => Object.keys(portal?.choices ?? {}), [portal]);
  const units = portal?.units ?? [];
  const eventsForSeries = useMemo(
    () => (portal?.events ?? []).filter((event) => !eventSeriesId || event.seriesId === eventSeriesId),
    [portal, eventSeriesId],
  );
  const openRequests = useMemo(
    () =>
      (portal?.requests ?? []).filter(
        (request) => !['CANCELLED', 'REJECTED', 'COMPLETED'].includes(request.status),
      ),
    [portal],
  );

  const startCompose = useCallback(() => {
    if (!portal) return;
    const firstCategory = Object.keys(portal.choices)[0] ?? 'Other';
    const firstUnit = portal.units[0] ?? 'piece';
    setComposing(true);
    setReceipt(null);
    setAlert('');
    setRequestType('NEW');
    setParentRequestId('');
    setEventSeriesId(portal.eventSeries[0]?.id ?? '');
    setEventId('');
    setPurpose('');
    setLines([emptyLine(firstCategory, firstUnit)]);
    setAcks({ reviewAcknowledged: false, authorityAcknowledged: false, acceptableUseAcknowledged: false });
    setClientRequestId(newClientRequestId());
  }, [portal]);

  const updateLine = (index: number, patch: Partial<DraftLine>) =>
    setLines((current) => current.map((line, i) => (i === index ? { ...line, ...patch } : line)));

  const allAcked = ACKS.every((ack) => acks[ack.name]);
  const linesValid = lines.length > 0 && lines.every((line) => line.description.trim() && line.quantity > 0);
  const canSubmit = Boolean(eventSeriesId && eventId && purpose.trim() && linesValid && allAcked && !busy);

  async function submit() {
    if (inspection) {
      setAlert('Actions are unavailable in inspection mode.');
      return;
    }
    if (!canSubmit) {
      setAlert(
        'Complete the event, purpose, at least one requested item, and every acknowledgment before submitting.',
      );
      return;
    }
    setAlert('');
    setBusy(true);
    try {
      const result = await frontendBackend.submitRequesterRequest({
        clientRequestId,
        requestType,
        parentRequestId: requestType === 'ADDITIONAL' ? parentRequestId : '',
        eventSeriesId,
        eventId,
        purpose: purpose.trim(),
        lines: lines.map((line) => ({
          category: line.category,
          description: line.description.trim(),
          custom: line.custom,
          quantity: line.quantity,
          unit: line.unit,
          specification: line.specification.trim(),
        })),
      });
      setReceipt(result);
      setComposing(false);
      setLive(`Request submitted. Record ${result.id}. Initial status ${pretty(result.status)}.`);
      setReload((n) => n + 1);
    } catch (error) {
      setAlert(
        error instanceof FrontendApiError ? error.message : 'The request service is temporarily unavailable.',
      );
    } finally {
      setBusy(false);
    }
  }

  const field = {
    background: c.m2,
    border: `1px solid ${c.border}`,
    color: c.text,
    borderRadius: 10,
    padding: '10px 14px',
    fontSize: 13,
    fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
    minHeight: 44,
    width: '100%',
  } as const;

  const primaryButton = {
    background: '#e8b93c',
    color: '#40070a',
    border: '1px solid #d1b478',
    borderRadius: 10,
    minHeight: 44,
    padding: '0 18px',
    fontSize: 13,
    fontWeight: 600,
    fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
  } as const;

  const quietButton = {
    background: 'transparent',
    color: dark ? '#f6e29a' : '#610b0f',
    border: `1px solid ${dark ? 'rgba(242,209,92,0.4)' : '#d1b478'}`,
    borderRadius: 10,
    minHeight: 44,
    padding: '0 16px',
    fontSize: 13,
    fontWeight: 600,
    fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
  } as const;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: c.bg, color: c.text }}>
      <div className="sr-only" role="status" aria-live="polite">
        {live}
      </div>
      <div className="sr-only" role="alert" aria-live="assertive">
        {alert}
      </div>

      <header
        className="flex items-center gap-4 px-5 md:px-8 py-[14px]"
        style={{ background: '#40070a', borderBottom: '1px solid rgba(242,209,92,0.22)' }}
      >
        <div className="flex items-center gap-3">
          <UscMark size={36} />
          <DolMark size={30} />
          <span
            className="hidden sm:inline"
            style={{
              fontFamily: "'Newsreader', Georgia, serif",
              fontWeight: 700,
              fontSize: 13,
              color: '#fff',
              letterSpacing: -0.075,
            }}
          >
            External Request Center
          </span>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <ThemeToggle dark={dark} onToggle={onToggleTheme} />
          <button type="button" onClick={onHome} style={{ ...quietButton, color: '#faeecb', minHeight: 36 }}>
            <span className="inline-flex items-center gap-2">
              <Home size={14} strokeWidth={1.6} aria-hidden="true" />
              Home
            </span>
          </button>
          {!inspection ? (
            <button
              type="button"
              onClick={() => void onSignOut()}
              style={{ ...quietButton, color: '#faeecb', minHeight: 36 }}
            >
              Sign out
            </button>
          ) : null}
        </div>
      </header>

      <main
        id="main-content"
        className="route-focus-target flex-1 w-full max-w-[1120px] mx-auto px-5 md:px-8 py-8 flex flex-col gap-6"
        tabIndex={-1}
      >
        {/* R3-A1-A2 §34 — DOL requester-mode context cue. Shown only when a DOL
            account deliberately entered requester mode, so it never appears for
            ordinary USC requesters. */}
        {requesterMode && presentation.internalOperator && (
          <section
            className="flex flex-wrap items-center gap-4 rounded-[14px] px-5 py-4"
            style={{ background: c.m1, border: `1px solid ${c.border}` }}
          >
            <div className="flex flex-col gap-1 flex-1 min-w-[240px]">
              <p
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 10,
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  color: dark ? '#e8b93c' : '#7d5518',
                }}
              >
                Requester view
              </p>
              <p style={{ fontSize: 13, color: c.text }}>
                You are using the External Request Center as a requester. Your DOL operational access is
                unchanged.
              </p>
            </div>
            <button type="button" onClick={onOpenLogisticsHub} style={primaryButton}>
              <span className="inline-flex items-center gap-2">
                Open Logistics Hub
                <ArrowUpRight size={14} strokeWidth={1.8} aria-hidden="true" />
              </span>
            </button>
          </section>
        )}

        <section className="flex flex-col gap-2">
          <h1
            style={{
              fontFamily: "'Bricolage Grotesque', system-ui, sans-serif",
              fontWeight: 700,
              fontSize: 28,
              letterSpacing: '-0.8px',
              color: c.text,
            }}
          >
            External Request Center
          </h1>
          <p style={{ fontSize: 13, color: c.muted, maxWidth: 640, lineHeight: '20px' }}>
            Submit USC operational needs — inventory and pantry restocking, office supplies, event materials
            and food, venue and activity support. Signed in as{' '}
            <strong style={{ color: c.text }}>{presentation.displayName}</strong>
            {portal?.profile.displayName ? (
              <>
                {' '}
                for <strong style={{ color: c.text }}>{portal.profile.displayName}</strong>
              </>
            ) : null}
            .
          </p>
        </section>

        {state === 'loading' && (
          <section
            className="rounded-[14px] px-5 py-6"
            style={{ background: c.m1, border: `1px solid ${c.border}` }}
            aria-busy="true"
          >
            <p style={{ fontSize: 13, color: c.muted }}>Loading your requests…</p>
          </section>
        )}

        {state === 'portal-unavailable' && (
          <section
            role="alert"
            className="rounded-[14px] px-5 py-6 flex flex-col gap-3"
            style={{ background: c.m1, border: `1px solid ${c.border}` }}
          >
            <strong style={{ fontSize: 14, color: c.text }}>
              The requester portal is not available for this account
            </strong>
            <p style={{ fontSize: 13, color: c.muted, lineHeight: '20px' }}>
              Your account is signed in, but it cannot submit requests here. Open the Logistics Hub if your
              account has internal access, or return home.
            </p>
            <div className="flex flex-wrap gap-3">
              {presentation.internalOperator && (
                <button type="button" onClick={onOpenLogisticsHub} style={primaryButton}>
                  Open Logistics Hub
                </button>
              )}
              <button type="button" onClick={onHome} style={quietButton}>
                Home
              </button>
            </div>
          </section>
        )}

        {state === 'error' && (
          <section
            role="alert"
            className="rounded-[14px] px-5 py-6 flex flex-col gap-3"
            style={{ background: c.m1, border: `1px solid ${c.border}` }}
          >
            <strong style={{ fontSize: 14, color: c.text }}>
              The request service is temporarily unavailable
            </strong>
            <p style={{ fontSize: 13, color: c.muted }}>{alert}</p>
            <div className="flex gap-3">
              <button type="button" onClick={() => setReload((n) => n + 1)} style={primaryButton}>
                Try again
              </button>
              <button type="button" onClick={onHome} style={quietButton}>
                Home
              </button>
            </div>
          </section>
        )}

        {receipt && (
          <section
            role="status"
            className="rounded-[14px] px-5 py-6 flex flex-col gap-2"
            style={{ background: c.m1, border: '1px solid #d1b478' }}
          >
            <p
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 10,
                letterSpacing: '1px',
                textTransform: 'uppercase',
                color: dark ? '#e8b93c' : '#7d5518',
              }}
            >
              Request submitted
            </p>
            <strong style={{ fontSize: 16, color: c.text }}>{receipt.id}</strong>
            <p style={{ fontSize: 13, color: c.muted }}>
              {receipt.event}
              {receipt.subEvent ? ` · ${receipt.subEvent}` : ''} · {pretty(receipt.status)}. It appears in
              your requests below and is visible to the Department of Logistics for review.
            </p>
          </section>
        )}

        {state === 'ready' && portal && !composing && (
          <>
            <section className="flex flex-wrap items-center gap-3">
              <button type="button" onClick={startCompose} style={primaryButton}>
                <span className="inline-flex items-center gap-2">
                  <Plus size={15} strokeWidth={1.8} aria-hidden="true" />
                  New request
                </span>
              </button>
              <span style={{ fontSize: 12, color: c.muted }}>
                {openRequests.length} open · {portal.requests.length} total
              </span>
            </section>

            <section className="flex flex-col gap-3" aria-label="Your requests">
              <h2
                style={{
                  fontFamily: "'Bricolage Grotesque', system-ui, sans-serif",
                  fontWeight: 700,
                  fontSize: 18,
                  color: c.text,
                }}
              >
                Your requests
              </h2>
              {portal.requests.length === 0 ? (
                <div
                  className="rounded-[14px] px-5 py-6"
                  style={{ background: c.m1, border: `1px solid ${c.border}` }}
                >
                  <strong style={{ fontSize: 14, color: c.text }}>No requests yet</strong>
                  <p style={{ fontSize: 13, color: c.muted, marginTop: 4 }}>
                    Requests you submit for your office appear here with their current review status.
                  </p>
                </div>
              ) : (
                <ul className="flex flex-col gap-3">
                  {portal.requests.map((request) => (
                    <li
                      key={request.id}
                      className="rounded-[14px] px-5 py-4 flex flex-col gap-2"
                      style={{ background: c.m1, border: `1px solid ${c.border}` }}
                    >
                      <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                        <strong
                          style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, color: c.text }}
                        >
                          {request.id}
                        </strong>
                        <span
                          className="rounded-full px-2 py-0.5"
                          style={{
                            fontFamily: "'IBM Plex Mono', monospace",
                            fontSize: 10,
                            letterSpacing: '0.8px',
                            textTransform: 'uppercase',
                            background: dark ? 'rgba(232,185,60,0.18)' : '#f7f0e2',
                            color: dark ? '#e8b93c' : '#7d5518',
                          }}
                        >
                          {pretty(request.status)}
                        </span>
                        {request.requestType === 'ADDITIONAL' && (
                          <span style={{ fontSize: 11, color: c.muted }}>
                            Additional to {request.parentRequestId}
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: 13, color: c.text }}>
                        {request.event}
                        {request.subEvent ? ` · ${request.subEvent}` : ''}
                      </p>
                      <p style={{ fontSize: 12, color: c.muted, lineHeight: '18px' }}>{request.purpose}</p>
                      <p style={{ fontSize: 11, color: c.muted }}>
                        {request.lines.length} line{request.lines.length === 1 ? '' : 's'} · updated{' '}
                        {request.updatedAt || 'not reported'}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}

        {state === 'ready' && portal && composing && (
          <section className="flex flex-col gap-5" aria-label="New request">
            <h2
              style={{
                fontFamily: "'Bricolage Grotesque', system-ui, sans-serif",
                fontWeight: 700,
                fontSize: 18,
                color: c.text,
              }}
            >
              New request
            </h2>

            {alert && (
              <p role="alert" style={{ fontSize: 12, color: 'var(--destructive)' }}>
                {alert}
              </p>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label
                className="flex flex-col gap-1.5"
                htmlFor={`${formId}-type`}
                style={{ fontSize: 13, color: c.text }}
              >
                Request type
                <select
                  id={`${formId}-type`}
                  value={requestType}
                  onChange={(e) => setRequestType(e.target.value as 'NEW' | 'ADDITIONAL')}
                  style={field}
                >
                  <option value="NEW">New request</option>
                  <option value="ADDITIONAL">Additional to an existing request</option>
                </select>
              </label>

              {requestType === 'ADDITIONAL' && (
                <label
                  className="flex flex-col gap-1.5"
                  htmlFor={`${formId}-parent`}
                  style={{ fontSize: 13, color: c.text }}
                >
                  Parent request
                  <select
                    id={`${formId}-parent`}
                    value={parentRequestId}
                    onChange={(e) => setParentRequestId(e.target.value)}
                    style={field}
                  >
                    <option value="">Select a request</option>
                    {openRequests.map((request) => (
                      <option key={request.id} value={request.id}>
                        {request.id} — {request.event}
                      </option>
                    ))}
                  </select>
                </label>
              )}

              <label
                className="flex flex-col gap-1.5"
                htmlFor={`${formId}-series`}
                style={{ fontSize: 13, color: c.text }}
              >
                Event series
                <select
                  id={`${formId}-series`}
                  value={eventSeriesId}
                  onChange={(e) => {
                    setEventSeriesId(e.target.value);
                    setEventId('');
                  }}
                  style={field}
                >
                  <option value="">Select an event series</option>
                  {portal.eventSeries.map((series) => (
                    <option key={series.id} value={series.id}>
                      {series.name}
                    </option>
                  ))}
                </select>
              </label>

              <label
                className="flex flex-col gap-1.5"
                htmlFor={`${formId}-event`}
                style={{ fontSize: 13, color: c.text }}
              >
                Event or sub-event
                <select
                  id={`${formId}-event`}
                  value={eventId}
                  onChange={(e) => setEventId(e.target.value)}
                  style={field}
                  disabled={!eventSeriesId}
                >
                  <option value="">Select an event</option>
                  {eventsForSeries.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.name}
                      {event.venue ? ` — ${event.venue}` : ''}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label
              className="flex flex-col gap-1.5"
              htmlFor={`${formId}-purpose`}
              style={{ fontSize: 13, color: c.text }}
            >
              Purpose
              <textarea
                id={`${formId}-purpose`}
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                rows={3}
                maxLength={500}
                placeholder="e.g. Seating and a rostrum for the opening plenary…"
                style={{ ...field, minHeight: 88, resize: 'vertical' }}
              />
            </label>

            <fieldset className="flex flex-col gap-3">
              <legend style={{ fontSize: 13, fontWeight: 600, color: c.text, marginBottom: 8 }}>
                Requested items
              </legend>
              {lines.map((line, index) => {
                const choices = portal.choices[line.category] ?? [];
                return (
                  <div
                    key={index}
                    className="rounded-[14px] px-4 py-4 flex flex-col gap-3"
                    style={{ background: c.m1, border: `1px solid ${c.border}` }}
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label
                        className="flex flex-col gap-1.5"
                        htmlFor={`${formId}-cat-${index}`}
                        style={{ fontSize: 12, color: c.text }}
                      >
                        Category
                        <select
                          id={`${formId}-cat-${index}`}
                          value={line.category}
                          onChange={(e) =>
                            updateLine(index, { category: e.target.value, description: '', custom: false })
                          }
                          style={field}
                        >
                          {categories.map((category) => (
                            <option key={category} value={category}>
                              {category}
                            </option>
                          ))}
                        </select>
                      </label>

                      <label
                        className="flex flex-col gap-1.5"
                        htmlFor={`${formId}-item-${index}`}
                        style={{ fontSize: 12, color: c.text }}
                      >
                        Item
                        {choices.length > 0 && !line.custom ? (
                          <select
                            id={`${formId}-item-${index}`}
                            value={line.description}
                            onChange={(e) => {
                              if (e.target.value === '__custom')
                                updateLine(index, { custom: true, description: '' });
                              else updateLine(index, { description: e.target.value });
                            }}
                            style={field}
                          >
                            <option value="">Select an approved item</option>
                            {choices.map((choice) => (
                              <option key={choice} value={choice}>
                                {choice}
                              </option>
                            ))}
                            <option value="__custom">Something else…</option>
                          </select>
                        ) : (
                          <input
                            id={`${formId}-item-${index}`}
                            value={line.description}
                            onChange={(e) => updateLine(index, { description: e.target.value })}
                            placeholder="e.g. Extension cords…"
                            maxLength={240}
                            style={field}
                          />
                        )}
                      </label>

                      <label
                        className="flex flex-col gap-1.5"
                        htmlFor={`${formId}-qty-${index}`}
                        style={{ fontSize: 12, color: c.text }}
                      >
                        Quantity
                        <input
                          id={`${formId}-qty-${index}`}
                          type="number"
                          min={1}
                          value={line.quantity}
                          onChange={(e) =>
                            updateLine(index, { quantity: Math.max(1, Number(e.target.value) || 1) })
                          }
                          style={field}
                        />
                      </label>

                      <label
                        className="flex flex-col gap-1.5"
                        htmlFor={`${formId}-unit-${index}`}
                        style={{ fontSize: 12, color: c.text }}
                      >
                        Unit
                        <select
                          id={`${formId}-unit-${index}`}
                          value={line.unit}
                          onChange={(e) => updateLine(index, { unit: e.target.value })}
                          style={field}
                        >
                          {units.map((unit) => (
                            <option key={unit} value={unit}>
                              {unit}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>

                    <label
                      className="flex flex-col gap-1.5"
                      htmlFor={`${formId}-spec-${index}`}
                      style={{ fontSize: 12, color: c.text }}
                    >
                      Specification <span style={{ color: c.muted, fontWeight: 400 }}>(optional)</span>
                      <input
                        id={`${formId}-spec-${index}`}
                        value={line.specification}
                        onChange={(e) => updateLine(index, { specification: e.target.value })}
                        placeholder="e.g. 3 m, black, set up by 08:00…"
                        maxLength={1000}
                        style={field}
                      />
                    </label>

                    {lines.length > 1 && (
                      <button
                        type="button"
                        onClick={() => setLines((current) => current.filter((_, i) => i !== index))}
                        style={{ ...quietButton, alignSelf: 'flex-start', minHeight: 38 }}
                      >
                        <span className="inline-flex items-center gap-2">
                          <Trash2 size={14} strokeWidth={1.6} aria-hidden="true" />
                          Remove item
                        </span>
                      </button>
                    )}
                  </div>
                );
              })}

              <button
                type="button"
                onClick={() =>
                  setLines((current) => [
                    ...current,
                    emptyLine(categories[0] ?? 'Other', units[0] ?? 'piece'),
                  ])
                }
                style={{ ...quietButton, alignSelf: 'flex-start' }}
              >
                <span className="inline-flex items-center gap-2">
                  <Plus size={14} strokeWidth={1.8} aria-hidden="true" />
                  Add another item
                </span>
              </button>
            </fieldset>

            <fieldset className="flex flex-col gap-3">
              <legend style={{ fontSize: 13, fontWeight: 600, color: c.text, marginBottom: 8 }}>
                Acknowledgments
              </legend>
              {ACKS.map((ack) => (
                <label
                  key={ack.name}
                  className="flex gap-3 items-start rounded-[10px] px-4 py-3"
                  style={{ background: c.m1, border: `1px solid ${c.border}` }}
                >
                  <input
                    type="checkbox"
                    checked={acks[ack.name]}
                    onChange={(e) => setAcks((current) => ({ ...current, [ack.name]: e.target.checked }))}
                    style={{ marginTop: 3, width: 18, height: 18 }}
                  />
                  <span className="flex flex-col gap-1">
                    <strong style={{ fontSize: 13, color: c.text }}>{ack.title}</strong>
                    <span style={{ fontSize: 12, color: c.muted, lineHeight: '18px' }}>{ack.body}</span>
                  </span>
                </label>
              ))}
            </fieldset>

            <p style={{ fontSize: 12, color: c.muted, lineHeight: '18px' }}>
              Submitting does not reserve anything and deducts no stock. The Department of Logistics reviews
              the request first; reservation and release are recorded separately.
            </p>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void submit()}
                disabled={!canSubmit || inspection}
                style={{ ...primaryButton, opacity: canSubmit && !inspection ? 1 : 0.55 }}
              >
                {inspection ? 'Submission disabled in preview' : busy ? 'Submitting…' : 'Submit request'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setComposing(false);
                  setAlert('');
                }}
                style={quietButton}
              >
                Cancel
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default ExternalRequestCenter;
