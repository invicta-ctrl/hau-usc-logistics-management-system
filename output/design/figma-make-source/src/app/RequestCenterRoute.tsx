import React, { useState, useEffect, useRef } from "react";
import { Search, X, ArrowLeft, AlertTriangle, CheckCircle2, ChevronRight } from "lucide-react";

// ── palette ───────────────────────────────────────────────────────────────────

function ap(_dark: boolean) {
  // Colour comes from theme.css. Each entry names a semantic role in the
  // canonical ladder, so light and dark resolve from one source instead of two
  // hardcoded branches that could drift apart.
  return {
    bg:     "var(--paper-warm)",   // work — the reading plane this route sits on
    m1:     "var(--paper-mid)",    // raised — rows, cards, inspector
    m2:     "var(--paper-light)",  // inset — headers, filter strips, wells
    border: "var(--border-paper)", // border/subtle
    text:   "var(--ink-deep)",     // text/primary
    muted:  "var(--ink-mid)",      // text/secondary
    skel:   "var(--paper-light)",  // skeleton blocks read as an inset
    sel:    "color-mix(in oklch, var(--gold-vivid) 14%, var(--paper-warm))",
    zebra:  "color-mix(in oklch, var(--ink-deep) 3%, var(--paper-warm))",
  } as const;
}

const mono    = "'IBM Plex Mono', monospace";
const sans    = "'IBM Plex Sans', system-ui, sans-serif";
const display = "'Bricolage Grotesque', system-ui, sans-serif";

// ── types ─────────────────────────────────────────────────────────────────────

type ReqStatus  = "in-review" | "submitted" | "needs-correction" | "approved" | "closed";
type ReqUrgency = "urgent" | "escalated";
type ActionType = "accept" | "fulfil" | "ask" | "canvass" | "reject";

type ReqLine = {
  name: string;
  qty: number;
  avail: "available" | "short";
  shortBy?: number;
  /* Production gates ISSUE_FROM_STOCK and RESTOCK on the line resolving to a
     catalog item. Without it the route set cannot be derived at all. */
  itemId?: string;
};

type ReqItem = {
  id: string;
  title: string;
  dept: string;
  committee: string;
  lines: number;
  needed: string;
  status: ReqStatus;
  urgency: ReqUrgency | null;
  routing: string | null;
  submittedAgo: string;
  detailLines: ReqLine[];
  context: string;
  nextAction: string;
  /* The other two fields permittedRoutes() branches on. */
  type?: "CATALOG_RESTOCK" | "STANDARD";
  catalogType?: "OFFICE_INVENTORY" | "PANTRY" | null;
};

/* Mirrors production's REVIEW_ROUTE_LABELS in src/visual/runtime.js. */
const ROUTE_LABELS = {
  ISSUE_FROM_STOCK:    "Issue from stock",
  PROCUREMENT:         "Procurement / canvass",
  RESTOCK:             "Catalog restock",
  REJECT:              "Reject",
  MISSING_INFORMATION: "Missing information",
} as const;

type RouteKey = keyof typeof ROUTE_LABELS;

/* Mirrors production's permittedRoutes(request, line). Production's own note
   applies here too: presentational filtering only — the server revalidates every
   decision and is the single source of truth for what is legal. Only REJECT and
   MISSING_INFORMATION are unconditional. */
function permittedRoutes(request: ReqItem, line: ReqLine): RouteKey[] {
  const routes: RouteKey[] = [];
  if (line.itemId) routes.push("ISSUE_FROM_STOCK");
  if (request.type !== "CATALOG_RESTOCK") routes.push("PROCUREMENT");
  if (
    line.itemId &&
    (request.type === "CATALOG_RESTOCK" ||
      ["OFFICE_INVENTORY", "PANTRY"].includes(request.catalogType ?? ""))
  ) {
    routes.push("RESTOCK");
  }
  routes.push("REJECT", "MISSING_INFORMATION");
  return routes;
}

// ── fixtures ──────────────────────────────────────────────────────────────────

const REQUESTS: ReqItem[] = [
  {
    id: "REQ-2026-0142",
    title: "General Assembly — venue and equipment",
    dept: "Department A", committee: "Materials", lines: 6, needed: "12 Sep",
    status: "in-review", urgency: "urgent", routing: null, submittedAgo: "2h ago",
    type: "STANDARD", catalogType: "OFFICE_INVENTORY",
    detailLines: [
      { name: "Folding chair — monobloc", qty: 120, avail: "available", itemId: "ITM-DEMO-156" },
      { name: "Wireless microphone",      qty: 4,   avail: "short", shortBy: 1 },
      { name: "Trestle table 6ft",        qty: 12,  avail: "available", itemId: "ITM-DEMO-161" },
    ],
    context: "6 line items pending DOL review. Urgent flag set — needed by 12 Sep. 3 representative lines shown; full set requires authoritative ledger check.",
    nextAction: "Review line availability. Issue from stock if the line is confirmed, or mark missing information if any line needs clarification. Every line needs its own route.",
  },
  {
    id: "REQ-2026-0141",
    title: "Leadership Summit — materials",
    dept: "Department B", committee: "Materials", lines: 12, needed: "18 Sep",
    status: "submitted", urgency: null, routing: null, submittedAgo: "5h ago",
    detailLines: [],
    context: "12 line items submitted, awaiting DOL review. No urgency flag set. Needed by 18 Sep.",
    nextAction: "Begin line review when queue priority permits.",
  },
  {
    id: "REQ-2026-0139",
    title: "Outreach Drive — food packs",
    dept: "Department C", committee: "Food", lines: 4, needed: "14 Sep",
    status: "needs-correction", urgency: "escalated", routing: "Canvassing", submittedAgo: "1d ago",
    detailLines: [],
    context: "Returned for correction and routed to canvassing. Escalated flag set. Requester has been notified.",
    nextAction: "Await corrected resubmission before further DOL action.",
  },
  {
    id: "REQ-2026-0136",
    title: "Sports Fest — sound system",
    dept: "Department A", committee: "Materials", lines: 3, needed: "11 Sep",
    status: "approved", urgency: null, routing: "Release Desk", submittedAgo: "2d ago",
    detailLines: [],
    context: "Approved and routed to Release Desk. 3 lines reserved against the approved request.",
    nextAction: "No DOL action required. Release Desk manages physical handover.",
  },
  {
    id: "REQ-2026-0134",
    title: "Orientation — chairs and tables",
    dept: "Department D", committee: "Materials", lines: 8, needed: "09 Sep",
    status: "closed", urgency: null, routing: null, submittedAgo: "3d ago",
    detailLines: [],
    context: "Request is closed. 8 lines are reconciled and the record is finalized.",
    nextAction: "No further action required. Record is read-only.",
  },
];

// ── status config ─────────────────────────────────────────────────────────────

const STATUS_CFG: Record<ReqStatus, { label: string; bg: string; color: string; border: string; dot: string }> = {
  "in-review":        { label: "In DOL review",    bg: "color-mix(in oklch, var(--gold-vivid) 15%, transparent)",  color: "#7d5518", border: "rgba(200,153,47,0.32)", dot: "#c8992f" },
  "submitted":        { label: "Submitted",         bg: "rgba(59,130,246,0.12)",  color: "#1d4ed8", border: "rgba(59,130,246,0.28)", dot: "#2563eb" },
  "needs-correction": { label: "Needs correction",  bg: "rgba(212,24,61,0.10)",   color: "#c8152a", border: "rgba(212,24,61,0.25)",  dot: "#d4183d" },
  "approved":         { label: "Approved",          bg: "rgba(31,107,65,0.12)",   color: "#1a5c38", border: "rgba(31,107,65,0.26)",  dot: "#1f6b41" },
  "closed":           { label: "Closed",            bg: "color-mix(in oklch, var(--ink-mid) 10%, transparent)",   color: "var(--ink-mid)", border: "color-mix(in oklch, var(--ink-mid) 22%, transparent)",  dot: "#8a7278" },
};

// ── action config ─────────────────────────────────────────────────────────────

const ACTION_CFG: Record<ActionType, { label: string; desc: string; confirmLabel: string; danger?: boolean }> = {
  accept:  { label: "Catalog restock",   confirmLabel: "Record catalog restock locally",   desc: "Reserve the listed quantities against this request. Availability will be checked against the current ledger." },
  fulfil:  { label: "Issue from stock",    confirmLabel: "Issue from stock locally",    desc: "Mark the request as fulfilled directly from available stock without a separate reservation step." },
  ask:     { label: "Missing information",  confirmLabel: "Mark missing information locally",              desc: "Hold the request and send a clarification note to the requester. Awaiting their response before further DOL action." },
  canvass: { label: "Procurement / canvass",  confirmLabel: "Route to procurement locally",  desc: "Route this request to the canvassing queue for alternative sourcing or inter-department coordination." },
  reject:  { label: "Reject",              confirmLabel: "Reject locally",                desc: "Reject this request and notify the requester. In a live system this would close the record.", danger: true },
};

// ── small components ──────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ReqStatus }) {
  const s = STATUS_CFG[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 whitespace-nowrap"
      style={{ fontFamily: sans, fontSize: 11, fontWeight: 500, letterSpacing: -0.1, background: s.bg, color: s.color, border: `1px solid ${s.border}` }}
    >
      <span style={{ width: 6, height: 6, borderRadius: "50%", background: s.dot, flexShrink: 0, display: "inline-block" }} />
      {s.label}
    </span>
  );
}

function UrgencyBadge({ urgency }: { urgency: ReqUrgency }) {
  if (urgency === "urgent") {
    return (
      <span
        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 whitespace-nowrap"
        style={{ fontFamily: sans, fontSize: 10, fontWeight: 500, background: "rgba(212,24,61,0.08)", color: "#c8152a", border: "1px solid rgba(212,24,61,0.20)" }}
      >
        <AlertTriangle size={9} strokeWidth={2} />
        Urgent
      </span>
    );
  }
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 whitespace-nowrap"
      style={{ fontFamily: sans, fontSize: 10, fontWeight: 500, background: "color-mix(in oklch, var(--ink-mid) 10%, transparent)", color: "var(--ink-mid)", border: "1px solid color-mix(in oklch, var(--ink-mid) 20%, transparent)" }}
    >
      Escalated
    </span>
  );
}

function Skel({ w = "100%", h, dark }: { w?: string; h: number; dark: boolean }) {
  const c = ap(dark);
  return <div className="animate-pulse rounded-[6px]" style={{ width: w, height: h, background: c.skel, flexShrink: 0 }} />;
}

// ── skeleton ──────────────────────────────────────────────────────────────────

function QueueSkeleton({ dark }: { dark: boolean }) {
  const c = ap(dark);
  return (
    <div className="flex gap-5 items-start">
      {/* Queue */}
      <div className="flex-1 min-w-0 rounded-[12px] overflow-hidden" style={{ border: `1px solid ${c.border}`, background: c.m1 }}>
        {/* Filter bar */}
        <div className="flex gap-2 px-4 py-3" style={{ borderBottom: `1px solid ${c.border}` }}>
          <Skel w="220px" h={32} dark={dark} />
          <Skel w="90px"  h={32} dark={dark} />
          <Skel w="90px"  h={32} dark={dark} />
        </div>
        {/* Table header */}
        <div className="flex gap-4 px-4 py-2.5" style={{ borderBottom: `1px solid ${c.border}`, background: c.m2 }}>
          {(["40%","14%","12%","18%","10%"] as const).map((w, i) => (
            <Skel key={i} w={w} h={11} dark={dark} />
          ))}
        </div>
        {/* Rows */}
        {[0,1,2,3,4].map((i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-4" style={{ borderTop: i > 0 ? `1px solid ${c.border}` : "none" }}>
            <div className="flex flex-col gap-2" style={{ flex: "4 0 0", minWidth: 0 }}>
              <Skel w="70%" h={13} dark={dark} />
              <Skel w="44%" h={10} dark={dark} />
            </div>
            <Skel w="12%" h={11} dark={dark} />
            <Skel w="10%" h={11} dark={dark} />
            <Skel w="17%" h={22} dark={dark} />
            <Skel w="9%"  h={18} dark={dark} />
          </div>
        ))}
      </div>

      {/* Inspector */}
      <div className="hidden md:flex flex-col gap-4 shrink-0 rounded-[12px] overflow-hidden p-5" style={{ width: 400, border: `1px solid ${c.border}`, background: c.m1 }}>
        <Skel w="55%" h={10} dark={dark} />
        <Skel h={20} dark={dark} />
        <Skel w="65%" h={12} dark={dark} />
        <div className="flex gap-2">
          <Skel w="38%" h={22} dark={dark} />
          <Skel w="24%" h={22} dark={dark} />
        </div>
        <div className="flex flex-col gap-4 pt-2">
          {[0,1,2,3].map((i) => (
            <div key={i} className="flex gap-3 items-start">
              <Skel w="15px" h={15} dark={dark} />
              <div className="flex-1 flex flex-col gap-1.5 min-w-0">
                <Skel w="40%" h={12} dark={dark} />
                <Skel w="62%" h={10} dark={dark} />
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-col gap-2 pt-1">
          {[0,1,2].map((i) => (
            <div key={i} className="rounded-[8px] px-3 py-3" style={{ border: `1px solid ${c.border}` }}>
              <Skel w="68%" h={12} dark={dark} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── inspector ─────────────────────────────────────────────────────────────────

function Inspector({
  item,
  dark,
  isMobile,
  onClose,
}: {
  item: ReqItem;
  dark: boolean;
  isMobile: boolean;
  onClose: () => void;
}) {
  const c = ap(dark);
  const closeRef = useRef<HTMLButtonElement>(null);
  const [activeAction, setActiveAction] = useState<ActionType | null>(null);
  const [confirmedActions, setConfirmedActions] = useState<Set<ActionType>>(new Set());

  useEffect(() => {
    closeRef.current?.focus();
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose(); }
    document.addEventListener("keydown", onKey);
    if (isMobile) document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose, isMobile]);

  function confirmAction(a: ActionType) {
    setConfirmedActions((prev) => new Set([...prev, a]));
    setActiveAction(null);
  }

  const is0142 = item.id === "REQ-2026-0142";
  const isActionable = item.status === "in-review" || item.status === "submitted";

  const LIFECYCLE = [
    {
      label: "Submitted",
      done: true, current: false,
      note: is0142 ? `Example requester · ${item.submittedAgo}` : item.submittedAgo,
    },
    {
      label: "In DOL review",
      done: item.status !== "submitted" && item.status !== "in-review" ? true : item.status !== "submitted" && item.status !== "needs-correction",
      current: item.status === "in-review",
      note: item.status === "in-review" ? "Awaiting your decision"
          : item.status === "submitted"  ? "Not yet started"
          : "Completed",
    },
    {
      label: "Reservation",
      done: item.status === "approved" || item.status === "closed",
      current: false,
      note: (item.status === "approved" || item.status === "closed") ? "Reserved" : "Not yet reserved",
    },
    {
      label: "Release",
      done: item.status === "closed",
      current: false,
      note: item.status === "closed" ? "Released" : "Not yet released",
    },
  ];

  const panelStyle: React.CSSProperties = isMobile
    ? { position: "fixed", inset: 0, zIndex: 60, background: c.m1, overflowY: "auto", display: "flex", flexDirection: "column" }
    : { position: "fixed", top: 0, right: 0, bottom: 0, zIndex: 50, width: "min(460px, 100vw)", background: c.m1, borderLeft: `1px solid ${c.border}`, boxShadow: "-4px 0 28px rgba(0,0,0,0.16)", overflowY: "auto", display: "flex", flexDirection: "column" };

  return (
    <>
      {!isMobile && (
        <div
          className="fixed inset-0 z-40"
          style={{ background: "rgba(0,0,0,0.18)" }}
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <div role="dialog" aria-modal="true" aria-labelledby="rc-title" style={panelStyle}>
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 shrink-0" style={{ borderBottom: `1px solid ${c.border}` }}>
          {isMobile ? (
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-2 rounded-[6px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--gold-vivid)]"
              style={{ minHeight: 44, minWidth: 44, fontFamily: sans, fontSize: 13, color: c.muted, background: "none", border: "none", cursor: "pointer" }}
              aria-label="Back to requests"
            >
              <ArrowLeft size={14} strokeWidth={1.5} />
              Back to requests
            </button>
          ) : (
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-[8px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--gold-vivid)]"
              style={{ width: 44, height: 44, color: c.muted, background: c.m2, border: `1px solid ${c.border}`, cursor: "pointer" }}
              aria-label="Close record"
            >
              <X size={15} strokeWidth={1.5} />
            </button>
          )}
          <span style={{ fontFamily: mono, fontSize: 9, color: c.muted, letterSpacing: "0.9px", textTransform: "uppercase" }}>
            request.record
          </span>
        </div>

        {/* Identity */}
        <div className="px-5 pt-5 pb-4 shrink-0" style={{ borderBottom: `1px solid ${c.border}` }}>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span style={{ fontFamily: mono, fontSize: 10, color: c.muted, letterSpacing: "0.4px" }}>{item.id}</span>
            <StatusBadge status={item.status} />
            {item.urgency && <UrgencyBadge urgency={item.urgency} />}
          </div>
          <h2
            id="rc-title"
            style={{ fontFamily: display, fontWeight: 700, fontSize: 17, color: c.text, letterSpacing: "-0.4px", fontVariationSettings: '"opsz" 14, "wdth" 100', lineHeight: "1.3" }}
          >
            {item.title}
          </h2>
          <p style={{ fontFamily: sans, fontSize: 12, color: c.muted, marginTop: 4, letterSpacing: -0.1 }}>
            {item.dept} · {item.lines} lines · needed {item.needed} · submitted {item.submittedAgo}
            {is0142 ? " · Example requester" : ""}
          </p>
          {item.routing && (
            <p style={{ fontFamily: mono, fontSize: 10, color: c.muted, marginTop: 3, letterSpacing: "0.2px" }}>
              → {item.routing}
            </p>
          )}
          <div className="mt-3 inline-block rounded-[5px] px-2 py-0.5" style={{ background: dark ? "color-mix(in oklch, var(--gold-vivid) 8%, transparent)" : "#fbeed2", border: "1px solid #dcbe8a" }}>
            <span style={{ fontFamily: mono, fontSize: 9, color: "#7d5518", letterSpacing: "0.8px", textTransform: "uppercase" }}>
              Design fixture · not production data
            </span>
          </div>
        </div>

        {/* Lifecycle */}
        <div className="px-5 py-4 shrink-0" style={{ borderBottom: `1px solid ${c.border}` }}>
          <p style={{ fontFamily: mono, fontSize: 9, color: c.muted, letterSpacing: "0.9px", textTransform: "uppercase", marginBottom: 12 }}>
            Lifecycle
          </p>
          {LIFECYCLE.map((step, i) => (
            <div key={step.label} className="flex items-start gap-3">
              <div className="flex flex-col items-center shrink-0" style={{ paddingTop: 1 }}>
                <div
                  className="inline-flex items-center justify-center rounded-full shrink-0"
                  style={{
                    width: 16, height: 16,
                    background: step.done ? "#1f6b41" : step.current ? "#c8992f" : "transparent",
                    border: step.done ? "none" : `1.5px solid ${step.current ? "#c8992f" : c.border}`,
                  }}
                >
                  {step.done && <CheckCircle2 size={10} strokeWidth={2.5} color="#fff" />}
                </div>
                {i < LIFECYCLE.length - 1 && (
                  <div style={{ width: 1.5, flex: "0 0 22px", height: 22, background: step.done ? "#1f6b41" : c.border, marginTop: 2 }} />
                )}
              </div>
              <div style={{ paddingBottom: i < LIFECYCLE.length - 1 ? 0 : 0, minHeight: i < LIFECYCLE.length - 1 ? 38 : 0 }}>
                <p style={{ fontFamily: sans, fontSize: 12, fontWeight: step.current ? 600 : 500, color: step.done || step.current ? c.text : c.muted, letterSpacing: -0.1 }}>
                  {step.label}
                </p>
                <p style={{ fontFamily: sans, fontSize: 11, color: c.muted, marginTop: 1, letterSpacing: -0.05 }}>
                  {step.note}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Line items — REQ-2026-0142 */}
        {is0142 && (
          <div className="px-5 py-4 shrink-0" style={{ borderBottom: `1px solid ${c.border}` }}>
            <p style={{ fontFamily: mono, fontSize: 9, color: c.muted, letterSpacing: "0.9px", textTransform: "uppercase", marginBottom: 10 }}>
              Line items · 3 of {item.lines} shown
            </p>
            <div className="flex flex-col rounded-[8px] overflow-hidden" style={{ border: `1px solid ${c.border}` }}>
              {item.detailLines.map((line, i) => (
                <div
                  key={line.name}
                  className="flex flex-col gap-2 px-3 py-2.5"
                  style={{ background: c.m1, borderTop: i >…495 tokens truncated…>
              <div>
                <p style={{ fontFamily: mono, fontSize: 9, color: c.muted, letterSpacing: "0.9px", textTransform: "uppercase", marginBottom: 4 }}>Context</p>
                <p style={{ fontFamily: sans, fontSize: 12, color: c.text, lineHeight: "18px", letterSpacing: -0.1 }}>{item.context}</p>
              </div>
              <div>
                <p style={{ fontFamily: mono, fontSize: 9, color: c.muted, letterSpacing: "0.9px", textTransform: "uppercase", marginBottom: 4 }}>Next action</p>
                <p style={{ fontFamily: sans, fontSize: 12, color: c.text, lineHeight: "18px", letterSpacing: -0.1 }}>{item.nextAction}</p>
              </div>
            </div>
          </div>
        )}

        {/* Actions — only for in-review / submitted */}
        {isActionable && (
          <div className="px-5 py-4 shrink-0" style={{ borderBottom: `1px solid ${c.border}` }}>
            <p style={{ fontFamily: mono, fontSize: 9, color: c.muted, letterSpacing: "0.9px", textTransform: "uppercase", marginBottom: 10 }}>
              Actions
            </p>

            {activeAction ? (
              /* Confirmation panel */
              <div className="flex flex-col gap-3">
                <div className="rounded-[10px] px-4 py-3" style={{ background: c.m2, border: `1px solid ${c.border}` }}>
                  <p style={{ fontFamily: sans, fontSize: 13, fontWeight: 600, color: c.text, letterSpacing: -0.15, marginBottom: 4 }}>
                    {ACTION_CFG[activeAction].label}
                  </p>
                  <p style={{ fontFamily: sans, fontSize: 12, color: c.muted, lineHeight: "18px", letterSpacing: -0.1 }}>
                    {ACTION_CFG[activeAction].desc}
                  </p>
                </div>

                <div className="rounded-[8px] px-4 py-3" style={{ background: "color-mix(in oklch, var(--gold-vivid) 7%, transparent)", border: "1px solid color-mix(in oklch, var(--gold-vivid) 28%, transparent)" }}>
                  <p style={{ fontFamily: mono, fontSize: 9, color: "#7d5518", letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: 3 }}>
                    Local review only
                  </p>
                  <p style={{ fontFamily: sans, fontSize: 11, color: dark ? "color-mix(in oklch, var(--gold-cream) 70%, transparent)" : "#7d5518", lineHeight: "16px" }}>
                    No request, reservation, message, rejection, or service action will be submitted or confirmed. This interaction is local to this session only.
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => confirmAction(activeAction)}
                    className="flex-1 rounded-[8px] py-2.5 text-[13px] font-semibold transition-opacity hover:opacity-85 active:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--gold-vivid)]"
                    style={{
                      fontFamily: sans, cursor: "pointer",
                      background: ACTION_CFG[activeAction].danger ? "rgba(212,24,61,0.10)" : (dark ? "var(--gold-vivid)" : "var(--oxblood-deep)"),
                      color:      ACTION_CFG[activeAction].danger ? "#c8152a" : (dark ? "var(--oxblood-deep)" : "var(--gold-cream)"),
                      border:     ACTION_CFG[activeAction].danger ? "1px solid rgba(212,24,61,0.28)" : "none",
                    }}
                  >
                    {ACTION_CFG[activeAction].confirmLabel}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveAction(null)}
                    className="rounded-[8px] px-4 py-2.5 text-[13px] transition-opacity hover:opacity-80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--gold-vivid)]"
                    style={{ fontFamily: sans, color: c.muted, background: c.m2, border: `1px solid ${c.border}`, cursor: "pointer" }}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              /* Action list */
              <div className="flex flex-col gap-2">
                {confirmedActions.size > 0 && (
                  <div className="rounded-[8px] px-4 py-3 mb-1" style={{ background: "rgba(31,107,65,0.07)", border: "1px solid rgba(31,107,65,0.22)" }}>
                    <p style={{ fontFamily: mono, fontSize: 9, color: "#1f6b41", letterSpacing: "0.8px", textTransform: "uppercase", marginBottom: 2 }}>Actioned locally only</p>
                    <p style={{ fontFamily: sans, fontSize: 11, color: "#1f6b41", lineHeight: "16px" }}>
                      No request, reservation, message, rejection, or service action was submitted or confirmed.
                    </p>
                  </div>
                )}

                {(["accept","fulfil","ask","canvass","reject"] as ActionType[]).map((action) => {
                  const done = confirmedActions.has(action);
                  const isDanger = ACTION_CFG[action].danger;
                  return (
                    <button
                      key={action}
                      type="button"
                      onClick={() => { if (!done) setActiveAction(action); }}
                      disabled={done}
                      aria-pressed={done}
                      className="flex items-center justify-between gap-2 rounded-[8px] px-4 py-3 text-left w-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--gold-vivid)]"
                      style={{
                        fontFamily: sans, fontSize: 13, letterSpacing: -0.15,
                        background: done ? (dark ? "rgba(31,107,65,0.08)" : "rgba(31,107,65,0.06)") : c.m2,
                        color:      done ? "#1f6b41" : isDanger ? "#c8152a" : c.text,
                        border:     `1px solid ${done ? "rgba(31,107,65,0.22)" : c.border}`,
                        cursor:     done ? "default" : "pointer",
                        opacity:    done ? 0.75 : 1,
                      }}
                    >
                      <span>{ACTION_CFG[action].label}</span>
                      {done
                        ? <CheckCircle2 size={14} strokeWidth={1.5} color="#1f6b41" />
                        : <ChevronRight size={14} strokeWidth={1.5} color={c.muted} />
                      }
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* The Release Desk is a separate module. Review never routes here: a request arrives when its lines reach a ready state. */}
        <div className="px-5 py-4 shrink-0" style={{ borderBottom: `1px solid ${c.border}` }}>
          <button
            type="button"
            disabled
            className="w-full rounded-[8px] py-3 text-center"
            style={{ fontFamily: sans, fontSize: 13, color: c.muted, background: c.m2, border: `1px solid ${c.border}`, cursor: "not-allowed", opacity: 0.5 }}
            title="Review never routes to the Release Desk"
          >
            Release Desk — separate module
          </button>
          <p style={{ fontFamily: mono, fontSize: 9, color: c.muted, letterSpacing: "0.5px", textAlign: "center", marginTop: 5 }}>
            Review cannot send a request here; it arrives when its lines reach their ready state
          </p>
        </div>

        {/* Ledger provenance — REQ-2026-0142 */}
        {is0142 && (
          <div className="px-5 py-4 shrink-0">
            <p style={{ fontFamily: mono, fontSize: 9, color: c.muted, letterSpacing: "0.9px", textTransform: "uppercase", marginBottom: 8 }}>
              Ledger · provenance
            </p>
            {[["Revision","4"],["Snapshot","f5fcfafc"],["Source","DESIGN FIXTURE"]].map(([k,v]) => (
              <div key={k} className="flex items-center justify-between py-1">
                <span style={{ fontFamily: mono, fontSize: 10, color: c.muted }}>{k}</span>
                <span style={{ fontFamily: mono, fontSize: 10, color: c.text }}>{v}</span>
              </div>
            ))}
            <p style={{ fontFamily: mono, fontSize: 9, color: c.muted, letterSpacing: "0.4px", marginTop: 10, lineHeight: "14px" }}>
              Session-local only. No data submitted; no service has confirmed any value shown here.
            </p>
          </div>
        )}
      </div>
    </>
  );
}

// ── main route ────────────────────────────────────────────────────────────────

export default function RequestCenterRoute({
  dark,
  navigate: _navigate,
}: {
  dark: boolean;
  navigate: (route: string) => void;
}) {
  const c = ap(dark);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState("");
  const [statusFilter, setStatusFilter] = useState<ReqStatus[]>([]);
  const [selected,     setSelected]     = useState<ReqItem | null>(null);
  const [isMobile,     setIsMobile]     = useState(false);
  const triggerRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    function check() { setIsMobile(window.innerWidth < 768); }
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const filtered = REQUESTS.filter((r) => {
    const q = search.toLowerCase();
    const matchSearch = !q || r.title.toLowerCase().includes(q) || r.id.toLowerCase().includes(q) || r.dept.toLowerCase().includes(q);
    const matchFilter = statusFilter.length === 0 || statusFilter.includes(r.status);
    return matchSearch && matchFilter;
  });

  function handleSelect(item: ReqItem) { setSelected(item); }

  function handleClose() {
    const id = selected?.id;
    setSelected(null);
    if (id) setTimeout(() => triggerRefs.current[id]?.focus(), 0);
  }

  function toggleFilter(s: ReqStatus) {
    setStatusFilter((prev) => prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]);
  }

  function clearFilters() { setStatusFilter([]); setSearch(""); }

  const FILTER_OPTIONS: { status: ReqStatus }[] = [
    { status: "in-review" }, { status: "submitted" }, { status: "needs-correction" },
    { status: "approved" },  { status: "closed" },
  ];

  // Mobile: full-screen inspector takes over entirely
  if (isMobile && selected) {
    return <Inspector item={selected} dark={dark} isMobile onClose={handleClose} />;
  }

  const thBg = dark ? "#242120" : "#f7f0e2";

  return (
    <div className="px-4 md:px-8 py-8 max-w-[1280px] mx-auto">
      {/* Heading */}
      <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
        <div>
          <p style={{ fontFamily: mono, fontSize: 10, color: c.muted, letterSpacing: "1px", textTransform: "uppercase", marginBottom: 4 }}>
            Request Center
          </p>
          <h1 style={{ fontFamily: display, fontWeight: 700, fontSize: "clamp(22px, 3vw, 30px)", color: c.text, letterSpacing: "-0.8px", fontVariationSettings: '"opsz" 14, "wdth" 100' }}>
            Request review queue
          </h1>
          <p style={{ fontFamily: sans, fontSize: 13, color: c.muted, marginTop: 4, letterSpacing: -0.1 }}>
            Review requests and act from the selected record.
          </p>
        </div>
        <span
          className="self-start mt-1 rounded-[5px] px-2 py-0.5"
          style={{ fontFamily: mono, fontSize: 9, color: "#7d5518", background: "#fbeed2", border: "1px solid #dcbe8a", letterSpacing: "0.8px", textTransform: "uppercase", whiteSpace: "nowrap" }}
        >
          Design fixture · not production data
        </span>
      </div>

      {/* Skeleton */}
      {loading ? <QueueSkeleton dark={dark} /> : (
        <div className="rounded-[12px] overflow-hidden" style={{ border: `1px solid ${c.border}`, background: c.m1 }}>
          {/* Queue title row */}
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: `1px solid ${c.border}` }}>
            <p style={{ fontFamily: sans, fontWeight: 600, fontSize: 14, color: c.text, letterSpacing: -0.2 }}>Queue</p>
            <span style={{ fontFamily: mono, fontSize: 10, color: c.muted }}>
              {filtered.length} of {REQUESTS.length} requests
            </span>
          </div>

          {/* Search + filter chips */}
          <div className="px-4 py-3 flex flex-col sm:flex-row gap-3 flex-wrap" style={{ borderBottom: `1px solid ${c.border}` }}>
            <div className="relative" style={{ flex: "0 0 260px", maxWidth: "100%" }}>
              <Search size={13} strokeWidth={1.5} color={c.muted} style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", pointerEvents: "none" }} />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search title, ID, or department…"
                className="w-full rounded-[8px] pl-8 pr-3 py-2 text-[12px] focus:outline-none focus:ring-2 focus:ring-[var(--gold-vivid)]"
                style={{ background: dark ? "#2d2927" : "#f7f0e2", border: `1px solid ${c.border}`, color: c.text, fontFamily: sans }}
              />
            </div>
            <div className="flex flex-wrap gap-1.5 items-center">
              {FILTER_OPTIONS.map(({ status }) => {
                const active = statusFilter.includes(status);
                const s = STATUS_CFG[status];
                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => toggleFilter(status)}
                    className="rounded-full px-3 py-1 text-[11px] whitespace-nowrap transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--gold-vivid)]"
                    style={{ fontFamily: sans, background: active ? s.bg : "transparent", color: active ? s.color : c.muted, border: `1px solid ${active ? s.border : c.border}`, cursor: "pointer" }}
                    aria-pressed={active}
                  >
                    {s.label}
                    {active && (
                      <span className="ml-1 inline-flex items-center" aria-hidden="true">×</span>
                    )}
                  </button>
                );
              })}
              {(statusFilter.length > 0 || search) && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="rounded-full px-3 py-1 text-[11px] whitespace-nowrap transition-opacity hover:opacity-75 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--gold-vivid)]"
                  style={{ fontFamily: sans, color: c.muted, border: `1px solid ${c.border}`, background: "transparent", cursor: "pointer" }}
                >
                  Clear filters
                </button>
              )}
            </div>
          </div>

          {/* Scoping note */}
          <p className="px-4 py-2" style={{ fontFamily: sans, fontSize: 11, color: c.muted, letterSpacing: -0.05, borderBottom: `1px solid ${c.border}` }}>
            Requests in your authorized scope, newest first. Select a row to open the record and its permitted actions.
          </p>

          {/* Empty state */}
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <p style={{ fontFamily: mono, fontSize: 10, color: c.muted, letterSpacing: "0.8px", textTransform: "uppercase" }}>
                No requests match this filter
              </p>
              <button
                type="button"
                onClick={clearFilters}
                className="rounded-[8px] px-4 py-2 text-[12px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--gold-vivid)]"
                style={{ fontFamily: sans, color: "var(--gold-vivid)", background: "none", border: `1px solid ${c.border}`, cursor: "pointer" }}
              >
                Clear filters
              </button>
            </div>

          ) : isMobile ? (
            /* Mobile card list */
            <div className="flex flex-col">
              {filtered.map((item, i) => {
                const isSelected = selected?.id === item.id;
                return (
                  <button
                    key={item.id}
                    ref={(el) => { triggerRefs.current[item.id] = el; }}
                    type="button"
                    onClick={() => handleSelect(item)}
                    className="flex flex-col gap-2 px-4 py-4 text-left w-full transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[var(--gold-vivid)]"
                    style={{ background: isSelected ? c.sel : c.m1, borderTop: i > 0 ? `1px solid ${c.border}` : "none", borderLeft: isSelected ? "3px solid #c8992f" : "3px solid transparent" }}
                    aria-pressed={isSelected}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <span style={{ fontFamily: sans, fontWeight: 600, fontSize: 13, color: c.text, letterSpacing: -0.15, lineHeight: "18px" }}>
                        {item.title}
                      </span>
                      <StatusBadge status={item.status} />
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <span style={{ fontFamily: mono, fontSize: 10, color: c.muted }}>{item.id}</span>
                      <span style={{ fontFamily: sans, fontSize: 11, color: c.muted }}>{item.dept}</span>
                      <span style={{ fontFamily: sans, fontSize: 11, color: c.muted }}>{item.lines} lines</span>
                      <span style={{ fontFamily: sans, fontSize: 11, color: c.muted }}>Needed {item.needed}</span>
                    </div>
                    {item.urgency && (
                      <div><UrgencyBadge urgency={item.urgency} /></div>
                    )}
                  </button>
                );
              })}
            </div>

          ) : (
            /* Desktop dense table */
            <div className="overflow-x-auto">
              <table className="w-full" style={{ borderCollapse: "collapse", minWidth: 580 }}>
                <thead>
                  <tr style={{ background: thBg, borderBottom: `1px solid ${c.border}` }}>
                    {["Request","Committee","Needed by","State","Urgency"].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-left" style={{ fontFamily: mono, fontWeight: 600, fontSize: 9, color: c.muted, letterSpacing: "1px", textTransform: "uppercase", whiteSpace: "nowrap" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item, i) => {
                    const isSelected = selected?.id === item.id;
                    return (
                      <tr
                        key={item.id}
                        style={{
                          background: isSelected ? c.sel : (i % 2 === 0 ? c.m1 : c.zebra),
                          borderTop: i > 0 ? `1px solid ${c.border}` : "none",
                          borderLeft: isSelected ? "3px solid #c8992f" : "3px solid transparent",
                        }}
                      >
                        {/* Request cell — clickable */}
                        <td className="px-4 py-3" style={{ maxWidth: 280 }}>
                          <button
                            ref={(el) => { triggerRefs.current[item.id] = el; }}
                            type="button"
                            onClick={() => handleSelect(item)}
                            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); handleSelect(item); } }}
                            className="text-left w-full rounded-[4px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--gold-vivid)]"
                            aria-pressed={isSelected}
                          >
                            <p style={{ fontFamily: sans, fontWeight: 600, fontSize: 13, color: c.text, letterSpacing: -0.15, lineHeight: "17px" }}>
                              {item.title}
                            </p>
                            <p style={{ fontFamily: mono, fontSize: 10, color: c.muted, marginTop: 2 }}>
                              {item.id} · {item.dept} · {item.lines} lines
                            </p>
                            {item.routing && (
                              <p style={{ fontFamily: mono, fontSize: 9, color: c.muted, marginTop: 1, letterSpacing: "0.2px" }}>
                                → {item.routing}
                              </p>
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap" style={{ fontFamily: sans, fontSize: 12, color: c.muted }}>
                          {item.committee}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap" style={{ fontFamily: mono, fontSize: 12, color: c.text }}>
                          {item.needed}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <StatusBadge status={item.status} />
                        </td>
                        <td className="px-4 py-3">
                          {item.urgency
                            ? <UrgencyBadge urgency={item.urgency} />
                            : <span style={{ fontFamily: mono, fontSize: 10, color: c.muted }}>—</span>
                          }
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Table footer */}
          <div className="flex items-center gap-4 px-4 py-2" style={{ borderTop: `1px solid ${c.border}`, background: thBg }}>
            <span style={{ fontFamily: mono, fontSize: 9, color: c.muted, letterSpacing: "0.6px", textTransform: "uppercase" }}>
              Design fixture · not production data
            </span>
            <span style={{ fontFamily: mono, fontSize: 9, color: c.muted }}>snapshot f5fcfafc · revision 4</span>
          </div>
        </div>
      )}

      {/* Desktop inspector — fixed overlay, does not squeeze queue */}
      {!loading && selected && !isMobile && (
        <Inspector item={selected} dark={dark} isMobile={false} onClose={handleClose} />
      )}
    </div>
  );
}
