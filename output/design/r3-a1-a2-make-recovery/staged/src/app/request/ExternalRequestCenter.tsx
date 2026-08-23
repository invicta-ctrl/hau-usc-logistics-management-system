/* HAU-USC Logistics — External Request Center (context B).  FIGMA MAKE PROTOTYPE.
 *
 * R3-A1-A2. Verified USC staff and officers only. A session is required.
 *
 * This is deliberately NOT the old public request wizard behind a login screen.
 * The public wizard collected requester name, type, organization, contact number
 * and email as free text. Here the requester is the signed-in account: the
 * identity block is read-only and comes from the session, which is what the
 * authenticated `/api/portal/request` contract does server-side.
 *
 * DOL requester mode (§34): a DOL account that deliberately opened this surface
 * stays here and is offered `Open Logistics Hub`. It is not redirected into the
 * Main Logistics Hub, because its explicit entry intent was requester mode.
 *
 * PROTOTYPE HONESTY (§27): submission is simulated. Nothing is stored, reserved
 * or sent. The screen says so, and it also names the one server-side gap that
 * affects this exact surface — a DOL account is currently refused by the real
 * portal contract.
 */

import { useMemo, useState } from "react";
import { ArrowUpRight, Home, Plus, Trash2 } from "lucide-react";

import type { Session } from "../appTypes";
import { ap } from "../theme/palette";
import { ThemeToggle } from "../brand/ThemeToggle";
import { DolMark, UscMark } from "../brand/BrandMarks";

type DraftLine = { category: string; description: string; quantity: number; unit: string; specification: string };

const CHOICES: Record<string, string[]> = {
  "Venue / Facility": ["University Theater", "PGN Auditorium", "Student Center", "Covered Court"],
  Logistics: ["Monoblock Chairs", "Rostrum", "Platform", "Philippine Flag", "Department Flag/s"],
  Equipment: ["Wireless microphone", "Projector", "Portable speaker"],
  Other: [],
};
const UNITS = ["piece", "set", "unit", "chair", "table", "facility", "day"];
const CATEGORIES = Object.keys(CHOICES);

const EVENT_SERIES = [
  { id: "SER-1", name: "General Assembly 2026–2027" },
  { id: "SER-2", name: "Angelite Week 2026" },
];
const EVENTS = [
  { id: "EVT-1", seriesId: "SER-1", name: "Day 1 — opening plenary", venue: "Plenary Hall" },
  { id: "EVT-2", seriesId: "SER-1", name: "Day 2 — committee sessions", venue: "Student Center" },
  { id: "EVT-3", seriesId: "SER-2", name: "Opening programme", venue: "Covered Court" },
];

/* Shaped like the authenticated portal projection: own records only, no other
   requester's data, no internal operational detail. */
const OWN_REQUESTS = [
  {
    id: "REQ-2026-0142", status: "FOR_REVIEW", type: "NEW",
    event: "General Assembly 2026–2027", subEvent: "Day 1 — opening plenary",
    purpose: "Seating and rostrum for the opening plenary.",
    lines: 3, updatedAt: "2026-08-21",
  },
  {
    id: "REQ-2026-0138", status: "PARTIALLY_FULFILLED", type: "NEW",
    event: "Angelite Week 2026", subEvent: "Opening programme",
    purpose: "Sound and staging for the opening programme.",
    lines: 5, updatedAt: "2026-08-18",
  },
];

const pretty = (value: string) => value.replaceAll("_", " ");
const emptyLine = (): DraftLine => ({ category: CATEGORIES[1], description: "", quantity: 1, unit: "piece", specification: "" });

export function ExternalRequestCenter({
  session,
  dark,
  onToggleTheme,
  onHome,
  onOpenLogisticsHub,
  onSignOut,
  requesterMode,
}: {
  session: Session;
  dark: boolean;
  onToggleTheme: () => void;
  onHome: () => void;
  onOpenLogisticsHub: () => void;
  onSignOut: () => void;
  requesterMode: boolean;
}) {
  const c = ap(dark);
  const [composing, setComposing] = useState(false);
  const [eventSeriesId, setEventSeriesId] = useState("");
  const [eventId, setEventId] = useState("");
  const [purpose, setPurpose] = useState("");
  const [lines, setLines] = useState<DraftLine[]>([emptyLine()]);
  const [acked, setAcked] = useState(false);
  const [receipt, setReceipt] = useState<string | null>(null);
  const [alert, setAlert] = useState("");
  const [live, setLive] = useState("");

  const eventsForSeries = useMemo(
    () => EVENTS.filter((event) => !eventSeriesId || event.seriesId === eventSeriesId),
    [eventSeriesId],
  );
  const linesValid = lines.every((line) => line.description.trim() && line.quantity > 0);
  const canSubmit = Boolean(eventSeriesId && eventId && purpose.trim() && linesValid && acked);

  const update = (index: number, patch: Partial<DraftLine>) =>
    setLines((current) => current.map((line, i) => (i === index ? { ...line, ...patch } : line)));

  function submit() {
    if (!canSubmit) {
      setAlert("Complete the event, purpose, at least one requested item, and the acknowledgment.");
      return;
    }
    setAlert("");
    const id = `REQ-2026-0${140 + Math.floor(Math.random() * 50)}`;
    setReceipt(id);
    setComposing(false);
    setLive(`Simulated submission. Record ${id}. Initial status FOR REVIEW.`);
  }

  const field = {
    background: c.m2, border: `1px solid ${c.border}`, color: c.text, borderRadius: 10,
    padding: "10px 14px", fontSize: 13, minHeight: 44, width: "100%",
    fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
  } as const;
  const primary = {
    background: "var(--gold-vivid)", color: "var(--oxblood-deep)", border: "1px solid var(--gold-mid)",
    borderRadius: 10, minHeight: 44, padding: "0 18px", fontSize: 13, fontWeight: 600,
    fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
  } as const;
  const quiet = {
    background: "transparent", color: dark ? "#f6e29a" : "#610b0f",
    border: `1px solid ${c.border}`, borderRadius: 10, minHeight: 44, padding: "0 16px",
    fontSize: 13, fontWeight: 600, fontFamily: "'IBM Plex Sans', system-ui, sans-serif",
  } as const;

  return (
    <div className="min-h-screen flex flex-col" style={{ background: c.bg, color: c.text }}>
      <div className="sr-only" role="status" aria-live="polite">{live}</div>
      <div className="sr-only" role="alert" aria-live="assertive">{alert}</div>

      <header
        className="flex items-center gap-4 px-5 md:px-8 py-[14px]"
        style={{ background: "#40070a", borderBottom: "1px solid rgba(242,209,92,0.22)" }}
      >
        <div className="flex items-center gap-3">
          <UscMark size={36} />
          <DolMark size={30} />
          <span className="hidden sm:inline" style={{ fontFamily: "'Newsreader', Georgia, serif", fontWeight: 700, fontSize: 13, color: "#fff", letterSpacing: -0.075 }}>
            External Request Center
          </span>
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <ThemeToggle dark={dark} onToggle={onToggleTheme} />
          <button type="button" onClick={onHome} style={{ ...quiet, color: "#faeecb", minHeight: 36 }}>
            <span className="inline-flex items-center gap-2"><Home size={14} strokeWidth={1.6} />Home</span>
          </button>
          <button type="button" onClick={onSignOut} style={{ ...quiet, color: "#faeecb", minHeight: 36 }}>
            Sign out
          </button>
        </div>
      </header>

      <main id="main-content" className="flex-1 w-full max-w-[1120px] mx-auto px-5 md:px-8 py-8 flex flex-col gap-6">
        {/* §34 DOL requester-mode cue. Shown only when a DOL account deliberately
            entered requester mode, so an ordinary USC requester never sees it. */}
        {requesterMode && session.internalOperator && (
          <section className="flex flex-wrap items-center gap-4 rounded-[14px] px-5 py-4" style={{ background: c.m1, border: `1px solid ${c.border}` }}>
            <div className="flex flex-col gap-1 flex-1 min-w-[240px]">
              <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: "1px", textTransform: "uppercase", color: dark ? "#e8b93c" : "#7d5518" }}>
                Requester view
              </p>
              <p style={{ fontSize: 13, color: c.text }}>
                You are using the External Request Center as a requester. Your DOL operational access is unchanged.
              </p>
            </div>
            <button type="button" onClick={onOpenLogisticsHub} style={primary}>
              <span className="inline-flex items-center gap-2">Open Logistics Hub<ArrowUpRight size={14} strokeWidth={1.8} /></span>
            </button>
          </section>
        )}

        <section className="flex flex-col gap-2">
          <h1 style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif", fontWeight: 700, fontSize: 28, letterSpacing: "-0.8px", color: c.text }}>
            External Request Center
          </h1>
          <p style={{ fontSize: 13, color: c.muted, maxWidth: 660, lineHeight: "20px" }}>
            Submit USC operational needs — inventory and pantry restocking, office supplies, event materials
            and food, venue and activity support. Signed in as <strong style={{ color: c.text }}>{session.displayName}</strong> ({session.role}).
          </p>
        </section>

        <section role="note" className="rounded-[14px] px-5 py-4 flex flex-col gap-2" style={{ background: c.m1, border: `1px dashed ${c.border}` }}>
          <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: "1px", textTransform: "uppercase", color: dark ? "#e8b93c" : "#7d5518" }}>
            Prototype simulation
          </p>
          <p style={{ fontSize: 12, color: c.muted, lineHeight: "18px" }}>
            Submitting here stores nothing and reserves nothing. In the product this surface binds to the
            authenticated <code>/api/portal/request</code> contract, which derives the requester from the session —
            the browser never supplies requester identity.
          </p>
          {session.internalOperator && (
            <p style={{ fontSize: 12, color: c.muted, lineHeight: "18px" }}>
              <strong style={{ color: c.text }}>BACKEND_CONTRACT_GAP_DOL_REQUESTER_MODE</strong> — the real portal
              contract currently requires <code>roleId === REQUESTER</code>, so a DOL account is refused today.
              This screen is the accepted design for DOL requester mode, not evidence that the server supports it.
            </p>
          )}
        </section>

        {receipt && (
          <section role="status" className="rounded-[14px] px-5 py-6 flex flex-col gap-2" style={{ background: c.m1, border: "1px solid var(--gold-mid)" }}>
            <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: "1px", textTransform: "uppercase", color: dark ? "#e8b93c" : "#7d5518" }}>
              Simulated submission
            </p>
            <strong style={{ fontSize: 16, color: c.text }}>{receipt}</strong>
            <p style={{ fontSize: 13, color: c.muted }}>
              Status FOR REVIEW. In the product this record would appear below and be visible to the
              Department of Logistics for review.
            </p>
          </section>
        )}

        {!composing ? (
          <>
            <section className="flex flex-wrap items-center gap-3">
              <button type="button" onClick={() => { setComposing(true); setReceipt(null); setAlert(""); }} style={primary}>
                <span className="inline-flex items-center gap-2"><Plus size={15} strokeWidth={1.8} />New request</span>
              </button>
              <span style={{ fontSize: 12, color: c.muted }}>{OWN_REQUESTS.length} of your requests</span>
            </section>

            <section className="flex flex-col gap-3" aria-label="Your requests">
              <h2 style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif", fontWeight: 700, fontSize: 18, color: c.text }}>
                Your requests
              </h2>
              <ul className="flex flex-col gap-3">
                {OWN_REQUESTS.map((request) => (
                  <li key={request.id} className="rounded-[14px] px-5 py-4 flex flex-col gap-2" style={{ background: c.m1, border: `1px solid ${c.border}` }}>
                    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                      <strong style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 13, color: c.text }}>{request.id}</strong>
                      <span
                        className="rounded-full px-2 py-0.5"
                        style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: "0.8px", textTransform: "uppercase", background: dark ? "rgba(232,185,60,0.18)" : "#f7f0e2", color: dark ? "#e8b93c" : "#7d5518" }}
                      >
                        {pretty(request.status)}
                      </span>
                    </div>
                    <p style={{ fontSize: 13, color: c.text }}>{request.event} · {request.subEvent}</p>
                    <p style={{ fontSize: 12, color: c.muted, lineHeight: "18px" }}>{request.purpose}</p>
                    <p style={{ fontSize: 11, color: c.muted }}>{request.lines} lines · updated {request.updatedAt}</p>
                  </li>
                ))}
              </ul>
            </section>
          </>
        ) : (
          <section className="flex flex-col gap-5" aria-label="New request">
            <h2 style={{ fontFamily: "'Bricolage Grotesque', system-ui, sans-serif", fontWeight: 700, fontSize: 18, color: c.text }}>
              New request
            </h2>
            {alert && <p role="alert" style={{ fontSize: 12, color: "var(--destructive)" }}>{alert}</p>}

            {/* Requester identity is read-only: it comes from the session, not from
                free-text fields the browser fills in. */}
            <div className="rounded-[14px] px-5 py-4 flex flex-col gap-1" style={{ background: c.m1, border: `1px solid ${c.border}` }}>
              <p style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 10, letterSpacing: "1px", textTransform: "uppercase", color: dark ? "#e8b93c" : "#7d5518" }}>
                Requester — from your session
              </p>
              <p style={{ fontSize: 13, color: c.text }}>{session.displayName} · {session.role}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="flex flex-col gap-1.5" htmlFor="erc-series" style={{ fontSize: 13, color: c.text }}>
                Event series
                <select id="erc-series" value={eventSeriesId} onChange={(e) => { setEventSeriesId(e.target.value); setEventId(""); }} style={field}>
                  <option value="">Select an event series</option>
                  {EVENT_SERIES.map((series) => <option key={series.id} value={series.id}>{series.name}</option>)}
                </select>
              </label>
              <label className="flex flex-col gap-1.5" htmlFor="erc-event" style={{ fontSize: 13, color: c.text }}>
                Event or sub-event
                <select id="erc-event" value={eventId} onChange={(e) => setEventId(e.target.value)} style={field} disabled={!eventSeriesId}>
                  <option value="">Select an event</option>
                  {eventsForSeries.map((event) => <option key={event.id} value={event.id}>{event.name} — {event.venue}</option>)}
                </select>
              </label>
            </div>

            <label className="flex flex-col gap-1.5" htmlFor="erc-purpose" style={{ fontSize: 13, color: c.text }}>
              Purpose
              <textarea
                id="erc-purpose" value={purpose} rows={3} maxLength={500}
                onChange={(e) => setPurpose(e.target.value)}
                placeholder="What is this for, and what does the activity need it to achieve?"
                style={{ ...field, minHeight: 88, resize: "vertical" }}
              />
            </label>

            <fieldset className="flex flex-col gap-3">
              <legend style={{ fontSize: 13, fontWeight: 600, color: c.text, marginBottom: 8 }}>Requested items</legend>
              {lines.map((line, index) => {
                const choices = CHOICES[line.category] ?? [];
                return (
                  <div key={index} className="rounded-[14px] px-4 py-4 flex flex-col gap-3" style={{ background: c.m1, border: `1px solid ${c.border}` }}>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <label className="flex flex-col gap-1.5" htmlFor={`erc-cat-${index}`} style={{ fontSize: 12, color: c.text }}>
                        Category
                        <select id={`erc-cat-${index}`} value={line.category} onChange={(e) => update(index, { category: e.target.value, description: "" })} style={field}>
                          {CATEGORIES.map((category) => <option key={category} value={category}>{category}</option>)}
                        </select>
                      </label>
                      <label className="flex flex-col gap-1.5" htmlFor={`erc-item-${index}`} style={{ fontSize: 12, color: c.text }}>
                        Item
                        {choices.length > 0 ? (
                          <select id={`erc-item-${index}`} value={line.description} onChange={(e) => update(index, { description: e.target.value })} style={field}>
                            <option value="">Select an approved item</option>
                            {choices.map((choice) => <option key={choice} value={choice}>{choice}</option>)}
                          </select>
                        ) : (
                          <input id={`erc-item-${index}`} value={line.description} maxLength={240}
                            onChange={(e) => update(index, { description: e.target.value })}
                            placeholder="Describe what is needed" style={field} />
                        )}
                      </label>
                      <label className="flex flex-col gap-1.5" htmlFor={`erc-qty-${index}`} style={{ fontSize: 12, color: c.text }}>
                        Quantity
                        <input id={`erc-qty-${index}`} type="number" min={1} value={line.quantity}
                          onChange={(e) => update(index, { quantity: Math.max(1, Number(e.target.value) || 1) })} style={field} />
                      </label>
                      <label className="flex flex-col gap-1.5" htmlFor={`erc-unit-${index}`} style={{ fontSize: 12, color: c.text }}>
                        Unit
                        <select id={`erc-unit-${index}`} value={line.unit} onChange={(e) => update(index, { unit: e.target.value })} style={field}>
                          {UNITS.map((unit) => <option key={unit} value={unit}>{unit}</option>)}
                        </select>
                      </label>
                    </div>
                    <label className="flex flex-col gap-1.5" htmlFor={`erc-spec-${index}`} style={{ fontSize: 12, color: c.text }}>
                      Specification <span style={{ color: c.muted, fontWeight: 400 }}>(optional)</span>
                      <input id={`erc-spec-${index}`} value={line.specification} maxLength={1000}
                        onChange={(e) => update(index, { specification: e.target.value })}
                        placeholder="Size, colour, setup notes, timing" style={field} />
                    </label>
                    {lines.length > 1 && (
                      <button type="button" onClick={() => setLines((current) => current.filter((_, i) => i !== index))}
                        style={{ ...quiet, alignSelf: "flex-start", minHeight: 38 }}>
                        <span className="inline-flex items-center gap-2"><Trash2 size={14} strokeWidth={1.6} />Remove item</span>
                      </button>
                    )}
                  </div>
                );
              })}
              <button type="button" onClick={() => setLines((current) => [...current, emptyLine()])} style={{ ...quiet, alignSelf: "flex-start" }}>
                <span className="inline-flex items-center gap-2"><Plus size={14} strokeWidth={1.8} />Add another item</span>
              </button>
            </fieldset>

            <label className="flex gap-3 items-start rounded-[10px] px-4 py-3" style={{ background: c.m1, border: `1px solid ${c.border}` }}>
              <input type="checkbox" checked={acked} onChange={(e) => setAcked(e.target.checked)} style={{ marginTop: 3, width: 18, height: 18 }} />
              <span className="flex flex-col gap-1">
                <strong style={{ fontSize: 13, color: c.text }}>Review acknowledgment</strong>
                <span style={{ fontSize: 12, color: c.muted, lineHeight: "18px" }}>
                  I understand this request starts For Review, that submitting it does not reserve stock, and that
                  I am submitting on behalf of my USC office or activity.
                </span>
              </span>
            </label>

            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={submit} disabled={!canSubmit} style={{ ...primary, opacity: canSubmit ? 1 : 0.55 }}>
                Submit request
              </button>
              <button type="button" onClick={() => { setComposing(false); setAlert(""); }} style={quiet}>Cancel</button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default ExternalRequestCenter;
