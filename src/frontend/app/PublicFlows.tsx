/* HAU-USC Logistics — PublicFlows.tsx  ·  R3 CONTRACT-RECONCILED REPLACEMENT
 *
 * DROP-IN TARGET
 *   Figma Make file rP9W9MQlZkyQrUx38TVsFS → src/app/PublicFlows.tsx
 *   Replace the whole file. Props and the default export are unchanged, so
 *   App.tsx / AppRouteRenderer.tsx need no edit.
 *
 * WHY THIS REPLACES THE PREVIOUS FILE
 *   The previous PublicFlows.tsx gated both public portals behind staff
 *   sign-in. Verbatim: "Sign in before entering activity, item, quantity, or
 *   timing details", "Public data entry — Disabled", "Sign in to start
 *   request", "Sign in to request equipment".
 *
 *   That contradicts production. At 0.8.2 / c316e047,
 *   src/visual/public-lending-portal.js and src/visual/public-requester-portal.js
 *   contain NO session check, NO sign-in gate and NO authorization branch. They
 *   mount public catalogs and POST to /api/public/lending and /api/public/request.
 *   DESIGN.md D24.0 records this as OWNER-LOCKED.
 *
 *   The "Staff sign in" control navigates to the sign-in page directly. It must
 *   not call requireAuth with a capability-gated target: a generic sign-in link
 *   that pre-commits to a destination denies otherwise-valid staff accounts
 *   that simply lack that one capability. requireAuth is for the case where the
 *   user asked for a specific protected destination, which no public control does.
 *
 * BACKEND BOUNDARY
 *   Visual structure comes from Make. Catalog, option, submission, receipt,
 *   and tracking truth comes only from the accepted Worker contracts.
 */

import React, { useEffect, useMemo, useRef, useState, type FormEvent } from "react";
import { uscLogo, dolLogo, defaultItemImage } from "../../ProductionAssets";
import {
  FrontendApiError,
  frontendBackend,
  type PublicLendingItem,
  type PublicRequestOptions,
  type PublicSubmissionReceipt,
  type PublicTrackingResult,
} from "../integration/backend";

type Route = "request" | "tracking" | "borrow";
type View = "Lending Center" | "Request Center" | "Track a record" | "Policy";

type CatalogState = "populated" | "loading" | "error" | "empty";
type BorrowerType = "" | "USC_STAFF" | "ANGELITE";
type RequestPurpose = "EVENT_ACTIVITY_SUPPORT" | "OFFICE_INVENTORY_PANTRY";

type RequestLine = {
  category: string;
  itemId: string;
  referenceId: string;
  description: string;
  quantity: number;
  unit: string;
  specification: string;
};

const LENDING_ACKS = [
  { name: "responsibilityAcknowledged", conditional: true, title: "Responsibility acknowledgment",
    body: "Required for the current selection — this item carries a governed acknowledgment rule." },
  { name: "dataUseAcknowledged", title: "Privacy acknowledgment",
    body: "I read the Privacy Notice and understand the data use, private review, governed retention, correction, and support paths." },
  { name: "acceptableUseAcknowledged", title: "Acceptable Use acknowledgment",
    body: "I will provide accurate authorized information and will not put secrets, unrelated sensitive data, or another person’s information in this request." },
  { name: "borrowerResponsibilityAcknowledged", title: "Borrower responsibility",
    body: "I understand this starts For Review and I must follow eligibility, pickup, care, condition, return, due-date, and correction instructions from authorized logistics staff." },
  { name: "evidenceConsentAcknowledged", title: "Evidence and photo acknowledgment",
    body: "If evidence is later requested through a protected workflow, I will share only relevant content I am authorized to provide and have consent for." },
] as const;

const REQUEST_ACKS = [
  { name: "reviewAcknowledged", title: "Review acknowledgment",
    body: "I understand this request starts For Review and that submitting it does not reserve stock or guarantee fulfilment." },
  { name: "dataUseAcknowledged", title: "Privacy acknowledgment",
    body: "I read the Privacy Notice and understand the data use, private review, governed retention, correction, and support paths." },
  { name: "acceptableUseAcknowledged", title: "Acceptable Use acknowledgment",
    body: "I will provide accurate authorized information and will not put secrets, unrelated sensitive data, or another person’s information in this request." },
  { name: "evidenceConsentAcknowledged", title: "Evidence and photo acknowledgment",
    body: "If evidence is later requested through a protected workflow, I will share only relevant content I am authorized to provide and have consent for." },
] as const;

const REQUEST_STEPS = ["Request purpose", "Requester", "Context", "Request lines", "Review and submit"];
const REQUESTABLE = ["AVAILABLE", "LIMITED", "ELIGIBILITY_REQUIRED"];
const pretty = (v: string) => v.replaceAll("_", " ");
const toneOf = (a: PublicLendingItem["availability"]) =>
  a === "AVAILABLE" ? "done" : a === "LIMITED" ? "progress" : a === "ELIGIBILITY_REQUIRED" ? "info" : "neutral";

const apiMessage = (error: unknown) => error instanceof FrontendApiError
  ? error.message
  : "The service is temporarily unavailable. Please try again.";

const newClientRequestId = () => `frontend-${crypto.randomUUID()}`;

export default function PublicFlows({
  route, onBack, dark, onNavigate,
}: {
  route: Route;
  onBack: () => void;
  dark: boolean;
  onNavigate: (route: "staff-signin") => void;
}) {
  const initial: View =
    route === "borrow" ? "Lending Center" : route === "tracking" ? "Track a record" : "Request Center";
  const [view, setView] = useState<View>(initial);

  /* ---------- lending state ---------- */
  const [catalogState, setCatalogState] = useState<CatalogState>("loading");
  const [catalogItems, setCatalogItems] = useState<PublicLendingItem[]>([]);
  const [uscDepartments, setUscDepartments] = useState<string[]>([]);
  const [catalogReload, setCatalogReload] = useState(0);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("ALL");
  const [availability, setAvailability] = useState("REQUESTABLE");
  const [itemType, setItemType] = useState("ALL");
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [borrowerType, setBorrowerType] = useState<BorrowerType>("");
  const [lendReceipt, setLendReceipt] = useState<PublicSubmissionReceipt | null>(null);
  const [lendingBusy, setLendingBusy] = useState(false);
  const lendingRequestId = useRef(newClientRequestId());

  /* ---------- request state ---------- */
  const [step, setStep] = useState(1);
  const [purpose, setPurpose] = useState<RequestPurpose>("EVENT_ACTIVITY_SUPPORT");
  const [requestOptions, setRequestOptions] = useState<PublicRequestOptions | null>(null);
  const [requestOptionsState, setRequestOptionsState] = useState<"loading" | "ready" | "error">("loading");
  const [requestOptionsReload, setRequestOptionsReload] = useState(0);
  const [requestDraft, setRequestDraft] = useState({
    requesterName: "", requesterType: "", organization: "", contactNumber: "", email: "",
    eventSeriesId: "", eventId: "", location: "", startDate: "", endDate: "",
    stockArea: "", neededDate: "", purpose: "", originalRequestId: "", relatedRequestId: "",
  });
  const [lines, setLines] = useState<RequestLine[]>([
    { category: "Other", itemId: "", referenceId: "", description: "", quantity: 1, unit: "piece", specification: "" },
  ]);
  const [requestAcks, setRequestAcks] = useState({
    reviewAcknowledged: false, dataUseAcknowledged: false,
    acceptableUseAcknowledged: false, evidenceConsentAcknowledged: false,
  });
  const [reqReceipt, setReqReceipt] = useState<PublicSubmissionReceipt | null>(null);
  const [requestBusy, setRequestBusy] = useState(false);
  const requestClientId = useRef(newClientRequestId());

  /* ---------- tracking state ---------- */
  const [trackingKind, setTrackingKind] = useState<"request" | "lending">("request");
  const [trackingId, setTrackingId] = useState("");
  const [trackingCode, setTrackingCode] = useState("");
  const [trackingBusy, setTrackingBusy] = useState(false);
  const [trackingResult, setTrackingResult] = useState<PublicTrackingResult | null>(null);

  const [live, setLive] = useState("");
  const [alert, setAlert] = useState("");

  useEffect(() => {
    if (view !== "Lending Center") return undefined;
    const controller = new AbortController();
    setCatalogState("loading");
    setAlert("");
    void frontendBackend.publicLendingCatalog(controller.signal).then((catalog) => {
      setCatalogItems(catalog.items);
      setUscDepartments(catalog.uscDepartments);
      setCatalogState(catalog.items.length ? "populated" : "empty");
    }).catch((error: unknown) => {
      if ((error as { name?: string })?.name === "AbortError") return;
      setCatalogState("error");
      setAlert(apiMessage(error));
    });
    return () => controller.abort();
  }, [view, catalogReload]);

  useEffect(() => {
    if (view !== "Request Center") return undefined;
    const controller = new AbortController();
    setRequestOptionsState("loading");
    setAlert("");
    void frontendBackend.publicRequestOptions(controller.signal).then((options) => {
      setRequestOptions(options);
      setRequestDraft((current) => ({
        ...current,
        requesterType: current.requesterType || options.requesterTypes[0] || "",
        eventSeriesId: current.eventSeriesId || options.eventSeries[0]?.id || "",
        eventId: current.eventId || options.events.find((event) => event.seriesId === (current.eventSeriesId || options.eventSeries[0]?.id))?.id || "",
        stockArea: current.stockArea || options.stockAreas[0] || "",
      }));
      setRequestOptionsState("ready");
    }).catch((error: unknown) => {
      if ((error as { name?: string })?.name === "AbortError") return;
      setRequestOptionsState("error");
      setAlert(apiMessage(error));
    });
    return () => controller.abort();
  }, [view, requestOptionsReload]);

  const categories = useMemo(() => [...new Set(catalogItems.map((i) => i.category))].sort(), [catalogItems]);
  const selectedItems = useMemo(
    () => Object.keys(selected).map((id) => catalogItems.find((i) => i.id === id)!).filter(Boolean),
    [catalogItems, selected],
  );
  const needsDueDate = selectedItems.some((i) => i.dueDateRequired);
  const needsRespAck = selectedItems.some((i) => i.acknowledgmentRequired);

  /* Search-first gate. The catalog opens closed and reveals on intent:
     two characters of search, or a category / item-type choice. */
  const searching =
    query.trim().length >= 2 || category !== "ALL" || itemType !== "ALL" || availability !== "REQUESTABLE";

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return catalogItems.filter(
      (i) =>
        (!q || `${i.name} ${i.productId} ${i.category}`.toLowerCase().includes(q)) &&
        (category === "ALL" || i.category === category) &&
        (availability === "ALL" ||
          i.availability === availability ||
          (availability === "REQUESTABLE" && REQUESTABLE.includes(i.availability))) &&
        (itemType === "ALL" || i.type === itemType),
    );
  }, [catalogItems, query, category, availability, itemType]);

  const toggleItem = (i: PublicLendingItem) => {
    if (!REQUESTABLE.includes(i.availability)) return;
    setSelected((prev) => {
      const next = { ...prev };
      if (next[i.id]) { delete next[i.id]; setLive(`${i.name} removed.`); }
      else { next[i.id] = 1; setLive(`${i.name} added. ${Object.keys(next).length} selected.`); }
      return next;
    });
  };

  async function submitLending(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedItems.length || lendingBusy) {
      setAlert("Select at least one available lending item.");
      return;
    }
    const form = new FormData(event.currentTarget);
    setAlert("");
    setLendingBusy(true);
    try {
      const receipt = await frontendBackend.submitPublicLending({
        clientRequestId: lendingRequestId.current,
        borrowerType,
        borrowerName: form.get("borrowerName"),
        studentId: form.get("studentId"),
        courseYear: form.get("courseYear"),
        academicDepartment: form.get("academicDepartment"),
        uscDepartment: form.get("uscDepartment"),
        positionRole: form.get("positionRole"),
        contactNumber: form.get("contactNumber"),
        email: form.get("email"),
        pickupDate: form.get("pickupDate"),
        dueDate: form.get("dueDate"),
        purpose: form.get("purpose"),
        responsibilityAcknowledged: form.get("responsibilityAcknowledged") === "on",
        dataUseAcknowledged: form.get("dataUseAcknowledged") === "on",
        acceptableUseAcknowledged: form.get("acceptableUseAcknowledged") === "on",
        borrowerResponsibilityAcknowledged: form.get("borrowerResponsibilityAcknowledged") === "on",
        evidenceConsentAcknowledged: form.get("evidenceConsentAcknowledged") === "on",
        lines: selectedItems.map((item) => ({ itemId: item.id, quantity: selected[item.id] })),
      });
      setLendReceipt(receipt);
      setLive(`Borrowing request submitted. Record ${receipt.id}. Initial status ${pretty(receipt.status)}.`);
    } catch (error) {
      setAlert(apiMessage(error));
    } finally {
      setLendingBusy(false);
    }
  }

  const updateRequestDraft = (field: keyof typeof requestDraft, value: string) =>
    setRequestDraft((current) => ({ ...current, [field]: value }));

  const updateRequestLine = (index: number, patch: Partial<RequestLine>) =>
    setLines((current) => current.map((line, lineIndex) => lineIndex === index ? { ...line, ...patch } : line));

  async function continueRequest() {
    if (requestBusy) return;
    if (step < 5) {
      setStep((current) => current + 1);
      setLive(`Step ${step + 1} of 5. ${REQUEST_STEPS[step]}.`);
      return;
    }
    if (!requestOptions || !lines.length || Object.values(requestAcks).some((value) => !value)) {
      setAlert("Complete the required request details and acknowledgments before submitting.");
      return;
    }
    setAlert("");
    setRequestBusy(true);
    try {
      const receipt = await frontendBackend.submitPublicRequest({
        clientRequestId: requestClientId.current,
        requestPurpose: purpose,
        requesterName: requestDraft.requesterName,
        requesterType: requestDraft.requesterType,
        organization: requestDraft.organization,
        contactNumber: requestDraft.contactNumber,
        email: requestDraft.email,
        purpose: requestDraft.purpose,
        startDate: purpose === "EVENT_ACTIVITY_SUPPORT" ? requestDraft.startDate : "",
        endDate: purpose === "EVENT_ACTIVITY_SUPPORT" ? requestDraft.endDate : "",
        eventSeriesId: purpose === "EVENT_ACTIVITY_SUPPORT" ? requestDraft.eventSeriesId : "",
        eventId: purpose === "EVENT_ACTIVITY_SUPPORT" ? requestDraft.eventId : "",
        location: purpose === "EVENT_ACTIVITY_SUPPORT" ? requestDraft.location : "",
        stockArea: purpose === "OFFICE_INVENTORY_PANTRY" ? requestDraft.stockArea : "",
        neededDate: purpose === "OFFICE_INVENTORY_PANTRY" ? requestDraft.neededDate : "",
        originalRequestId: purpose === "EVENT_ACTIVITY_SUPPORT" ? requestDraft.originalRequestId : "",
        relatedRequestId: purpose === "OFFICE_INVENTORY_PANTRY" ? requestDraft.relatedRequestId : "",
        dataUseAcknowledged: requestAcks.dataUseAcknowledged,
        acceptableUseAcknowledged: requestAcks.acceptableUseAcknowledged,
        evidenceConsentAcknowledged: requestAcks.evidenceConsentAcknowledged,
        lines: lines.map((line) => ({
          category: line.category,
          itemId: line.itemId || undefined,
          referenceId: line.referenceId || undefined,
          description: line.description,
          quantity: line.quantity,
          unit: line.unit,
          specification: line.specification,
        })),
      });
      setReqReceipt(receipt);
      setLive(`Request submitted. Record ${receipt.id}. Initial status ${pretty(receipt.status)}.`);
    } catch (error) {
      setAlert(apiMessage(error));
    } finally {
      setRequestBusy(false);
    }
  }

  async function checkTracking() {
    if (!trackingId.trim() || !trackingCode.trim() || trackingBusy) {
      setAlert("Enter the record identifier and private tracking code.");
      return;
    }
    setAlert("");
    setTrackingBusy(true);
    setTrackingResult(null);
    try {
      const result = trackingKind === "request"
        ? await frontendBackend.trackPublicRequest({ requestId: trackingId.trim(), trackingCode: trackingCode.trim() })
        : await frontendBackend.trackPublicLending({ submissionId: trackingId.trim(), trackingCode: trackingCode.trim() });
      setTrackingResult(result);
      setLive(`${result.id} status ${pretty(result.status)}.`);
    } catch (error) {
      setAlert(apiMessage(error));
    } finally {
      setTrackingBusy(false);
    }
  }

  return (
    <main className={`pub ${dark ? "dark" : "light"}`}>
      <style>{css}</style>

      {/* G0 · institutional ground. Decorative only, so it is never announced. */}
      <div className="g0" aria-hidden="true" data-module={view === "Request Center" ? "request" : "lending"} />

      {/* Persistent live regions, present at mount and empty so injected text is announced. */}
      <div className="sr-only" role="status" aria-live="polite">{live}</div>
      <div className="sr-only" role="alert" aria-live="assertive">{alert}</div>

      <header className="mast">
        <button type="button" onClick={onBack} className="back">← Public front door</button>
        <div className="identity">
          <img src={uscLogo} alt="USC" />
          <img src={dolLogo} alt="Department of Logistics" />
          <span>University Student Council<br />Holy Angel University</span>
        </div>
        <strong>Institutional Logistics Ledger</strong>
      </header>

      <section className="notice" role="note">
        <b>Governed public service</b>
        <span>Catalogs, submissions, receipts, and status results come from the current HAU-USC Logistics service.</span>
      </section>

      {/* NO-LOGIN assurance. This is the countermeasure to the sign-in-gated model
          this file previously carried — the design must state the access truth. */}
      {(view === "Lending Center" || view === "Request Center") && (
        <section className="assure glass">
          <div>
            <b>No account and no sign-in needed</b>
            <p>Open to USC staff and officers, and to every Angelite student. You do not need a
               HAU-USC Logistics account, staff sign-in, activation, or approval to submit.</p>
          </div>
          <div className="who"><span className="chip">USC Staff / Officer</span><span className="chip">Angelite Student</span></div>
        </section>
      )}

      {/* Production's portal-navigation.js offers exactly four destinations:
          Request Center, Lending Center, Staff sign in, and back to selection.
          Applying for staff access is not a public portal view — it sits behind
          the sign-in page, which is the one genuinely protected path here. */}
      <nav aria-label="Public portals">
        {(["Lending Center", "Request Center", "Track a record", "Policy"] as View[]).map((next) => (
          <button type="button" key={next} className={view === next ? "active" : ""}
            onClick={() => { setView(next); setLendReceipt(null); setReqReceipt(null); setTrackingResult(null); setAlert(""); }}>
            {next}
          </button>
        ))}
        <button type="button" className="leave" onClick={() => onNavigate("staff-signin")}>
          Staff sign in
        </button>
      </nav>

      {/* ==================== LENDING CENTER ==================== */}
      {view === "Lending Center" && (
        <>
          <section className="panel glass">
            <p className="eye">Public lending · no sign-in</p>
            <h1>Lending Center</h1>
            <p>Browse the borrower-safe catalog before providing personal information.
               Every request starts For Review.</p>

            {catalogState === "populated" && (
              <>
                <div className="filters">
                  <label className="grow">Search
                    <input type="search" value={query} onChange={(e) => setQuery(e.target.value)}
                      placeholder="Search name, Product ID, alias, or category" />
                  </label>
                  <label>Category
                    <select value={category} onChange={(e) => setCategory(e.target.value)}>
                      <option value="ALL">All categories</option>
                      {categories.map((c) => <option key={c}>{c}</option>)}
                    </select>
                  </label>
                  <label>Availability
                    <select value={availability} onChange={(e) => setAvailability(e.target.value)}>
                      <option value="ALL">All availability</option>
                      <option value="REQUESTABLE">Requestable now</option>
                      <option value="AVAILABLE">Available</option>
                      <option value="LIMITED">Limited</option>
                      <option value="ELIGIBILITY_REQUIRED">Eligibility required</option>
                    </select>
                  </label>
                  <label>Item type
                    <select value={itemType} onChange={(e) => setItemType(e.target.value)}>
                      <option value="ALL">Reusable and consumable</option>
                      <option value="REUSABLE">Reusable</option>
                      <option value="CONSUMABLE">Consumable</option>
                    </select>
                  </label>
                </div>

                {!searching ? (
                  /* Search-first. The grid stays closed until the borrower asks for
                     something, so the page opens calm instead of as a wall of cards.
                     Discovery still has to work, so the count is stated and the
                     categories are offered as one-tap entries into the catalog —
                     otherwise "What can I borrow?" would have no answer at all. */
                  <div className="stateBlock">
                    <strong>Search to see what you can borrow</strong>
                    <p>{catalogItems.length} items are published for lending. Type at least two characters,
                       or pick a category to start.</p>
                    <div className="catChips">
                      {categories.map((c) => (
                        <button type="button" key={c} onClick={() => { setCategory(c); setLive(`${c} selected.`); }}>{c}</button>
                      ))}
                      <button type="button" className="allBtn" onClick={() => { setCategory("ALL"); setQuery(" "); setLive("Showing all published items."); }}>
                        Show everything
                      </button>
                    </div>
                  </div>
                ) : visible.length === 0 ? (
                  <div className="stateBlock">
                    <strong>No catalog items match the current search and filters.</strong>
                    <p>The catalog has items; the current selection excludes all of them.</p>
                    <button type="button" onClick={() => { setQuery(""); setCategory("ALL"); setAvailability("ALL"); setItemType("ALL"); }}>
                      Clear filters
                    </button>
                  </div>
                ) : (
                  <ul className="catalog" aria-label="Borrower-safe catalog">
                    {visible.map((i) => {
                      const on = Boolean(selected[i.id]);
                      const can = REQUESTABLE.includes(i.availability);
                      return (
                        <li key={i.id} className={on ? "sel" : ""}>
                          <img className="itemThumb" src={i.imageUrl || defaultItemImage} alt="" />
                          <div className="ident">
                            <span className={`tone tone--${toneOf(i.availability)}`}>{pretty(i.availability)}</span>
                            <b>{i.name}</b>
                            <small>{i.productId} · {i.category} · {pretty(i.type)}</small>
                            <small>{i.description}</small>
                            <small>Unit: {i.unit} · Max {i.maximumQuantity}
                              {i.defaultLoanDays ? ` · Normal loan ${i.defaultLoanDays} days` : ""}</small>
                            {i.eligibility && <small><b>Eligibility:</b> {i.eligibility}</small>}
                            {i.restrictions && <small><b>Restrictions:</b> {i.restrictions}</small>}
                            {i.handlingNotes && <small><b>Handling:</b> {i.handlingNotes}</small>}
                          </div>
                          <button type="button" disabled={!can} className={on ? "" : "primary"} onClick={() => toggleItem(i)}>
                            {on ? "Selected" : can ? "Request item" : "Not requestable"}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </>
            )}

            {catalogState === "loading" && (
              <div className="stateBlock" role="status">
                <strong>Loading the governed catalog…</strong>
                <p>Checking current borrower-safe availability.</p>
                <div className="skeleton"><span /><span /><span /></div>
              </div>
            )}
            {catalogState === "error" && (
              <div className="stateBlock err" role="alert">
                <strong>Catalog service unavailable</strong>
                <p>The borrower-safe catalog could not be loaded. This is a service error, not an empty catalog.</p>
                <button type="button" onClick={() => setCatalogReload((value) => value + 1)}>Try again</button>
              </div>
            )}
            {catalogState === "empty" && (
              <div className="stateBlock">
                <strong>No approved lending items are published.</strong>
                <p>The governed catalog loaded successfully, but no active item is currently approved for public lending.</p>
              </div>
            )}
          </section>

          {!lendReceipt ? (
            <form className="panel glass" onSubmit={submitLending}>
              <p className="eye">Step 2</p>
              <h2>New borrowing request</h2>

              <div className="selBox">
                <b>Selected items · {selectedItems.length}</b>
                <small>No item is reserved until authorized staff approve it.</small>
                {selectedItems.length === 0 ? <p className="muted">Choose an available catalog item.</p> : (
                  <ul className="lines">
                    {selectedItems.map((i) => (
                      <li key={i.id}>
                        <span><b>{i.name}</b><small>{pretty(i.type)} · {i.unit} · maximum {i.maximumQuantity}</small></span>
                        <label className="qty">Quantity
                          <input type="number" min={1} max={i.maximumQuantity} value={selected[i.id]}
                            onChange={(e) => setSelected((p) => ({ ...p, [i.id]: Number(e.target.value) }))}
                            aria-label={`Quantity for ${i.name}`} />
                        </label>
                        <button type="button" onClick={() => toggleItem(i)}>Remove</button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              <fieldset>
                <legend>Who is borrowing?</legend>
                <div className="choices">
                  {[
                    { v: "USC_STAFF", t: "USC Staff / Officer", s: "Department or office borrower" },
                    { v: "ANGELITE", t: "Angelite Student", s: "Academic borrower" },
                  ].map((o) => (
                    <label key={o.v} className={borrowerType === o.v ? "choice on" : "choice"}>
                      <input type="radio" name="borrowerType" value={o.v} required
                        checked={borrowerType === o.v}
                        onChange={() => { setBorrowerType(o.v as BorrowerType); setLive(`${o.t} details shown.`); }} />
                      <span><b>{o.t}</b><small>{o.s}</small></span>
                    </label>
                  ))}
                </div>
              </fieldset>

              {borrowerType && (
                <>
                  <div className="grid">
                    <label>Full name *<input name="borrowerName" required maxLength={120} placeholder="Given name and surname" /></label>
                    <label>Student ID *<input name="studentId" required inputMode="numeric" pattern="[0-9]{1,8}" maxLength={8} placeholder="Up to 8 digits" /></label>

                    {/* Academic identity is ALWAYS collected. A USC officer is an Angelite
                        student too, so this is the basic information sheet, not a branch. */}
                    <label>Course and year *<input name="courseYear" required={borrowerType === "ANGELITE"} maxLength={80} placeholder="e.g. BSIT 2" /></label>
                    <label>College, school, or academic department *
                      <input name="academicDepartment" required={borrowerType === "ANGELITE"} maxLength={120} placeholder="e.g. School of Computing" /></label>

                    {/* Council role is the ONLY branch. It is absent for a student borrower,
                        so nothing from it can be submitted. */}
                    {borrowerType === "USC_STAFF" && (
                      <>
                        <label>USC department * <em className="badge">USC Staff / Officer only</em>
                          <select name="uscDepartment" required defaultValue=""><option value="">Select department or office</option>
                            {uscDepartments.map((d) => <option key={d}>{d}</option>)}</select></label>
                        <label>Position or role <em className="badge">USC Staff / Officer only</em>
                          <input name="positionRole" maxLength={120} placeholder="e.g. Committee Head" /></label>
                      </>
                    )}

                    <label>Contact number *<input name="contactNumber" required maxLength={24} placeholder="Mobile or landline" /></label>
                    <label>Email address *<input name="email" required type="email" maxLength={254} placeholder="name@example.edu.ph" /></label>

                    <label>Requested pickup date *
                      <input name="pickupDate" type="date" required />
                      <small className="muted">Authorized staff confirm the actual handoff separately.</small>
                    </label>
                    <label className="span2">Borrowing until {needsDueDate && <em className="badge">Conditional</em>}
                      <input name="dueDate" type="date" required={needsDueDate} />
                      <small className="muted">{needsDueDate
                        ? "Required for the selected reusable item."
                        : "Optional for the current selection."}</small></label>
                    <label className="span2">Purpose *<textarea name="purpose" required maxLength={500} rows={3}
                      placeholder="Describe the activity and how the items will be used. Maximum 500 characters." /></label>
                  </div>

                  <h3>Required acknowledgments</h3>
                  {LENDING_ACKS.map((a) => {
                    const conditional = "conditional" in a && a.conditional;
                    if (conditional && !needsRespAck) return null;
                    return (
                      <label key={a.name} className={conditional ? "ack cond" : "ack"}>
                        <input type="checkbox" name={a.name} required />
                        <span><b>{a.title}{conditional && <em className="badge">Conditional</em>}</b><small>{a.body}</small></span>
                      </label>
                    );
                  })}

                  <button className="primary" disabled={lendingBusy}>{lendingBusy ? "Submitting…" : "Submit borrowing request for review"}</button>
                  <p className="consequence">Submission does not guarantee approval or allocation. Nothing is
                    reserved and no stock is deducted at this step.</p>
                </>
              )}
            </form>
          ) : (
            <Receipt kind="Borrowing request" receipt={lendReceipt} onClose={() => {
              setLendReceipt(null);
              lendingRequestId.current = newClientRequestId();
            }} />
          )}
        </>
      )}

      {/* ==================== REQUEST CENTER ==================== */}
      {view === "Request Center" && (
        <section className="panel glass">
          <p className="eye">Public request · no sign-in</p>
          <h1>Request Center</h1>
          <p>Tell us what the activity needs. No account is required — you receive a private tracking code
             once, after you submit.</p>

          <ol className="stepper" aria-label="Request steps">
            {REQUEST_STEPS.map((label, idx) => {
              const n = idx + 1;
              const state = n < step ? "done" : n === step ? "cur" : "todo";
              return <li key={label} className={state} aria-current={n === step ? "step" : undefined}>
                <span className="mk">{state === "done" ? "✓" : n}</span>{label}</li>;
            })}
          </ol>

          {requestOptionsState === "loading" && !reqReceipt && (
            <div className="stateBlock" role="status"><strong>Loading governed request options…</strong></div>
          )}
          {requestOptionsState === "error" && !reqReceipt && (
            <div className="stateBlock err" role="alert">
              <strong>Request options unavailable</strong>
              <p>The request form cannot safely submit without current governed references.</p>
              <button type="button" onClick={() => setRequestOptionsReload((value) => value + 1)}>Try again</button>
            </div>
          )}

          {reqReceipt ? <Receipt kind="Request" receipt={reqReceipt} onClose={() => {
            setReqReceipt(null);
            setStep(1);
            requestClientId.current = newClientRequestId();
          }} /> : requestOptionsState === "ready" && requestOptions ? (
            <>
              {step === 1 && (
                <fieldset><legend>Request purpose</legend>
                  <p className="muted">This choice decides which context fields appear at step 3.</p>
                  <div className="choices">
                    {[
                      { v: "EVENT_ACTIVITY_SUPPORT", t: "Event or activity support", s: "For an approved event series and sub-event." },
                      { v: "OFFICE_INVENTORY_PANTRY", t: "Office inventory or pantry", s: "For approved office inventory or pantry needs." },
                    ].map((o) => (
                      <label key={o.v} className={purpose === o.v ? "choice on" : "choice"}>
                        <input type="radio" name="requestPurpose" checked={purpose === o.v}
                          onChange={() => { setPurpose(o.v as RequestPurpose); setLive(`${o.t} selected. Step 3 fields will change.`); }} />
                        <span><b>{o.t}</b><small>{o.s}</small></span>
                      </label>
                    ))}
                  </div>
                </fieldset>
              )}

              {step === 2 && (
                <div className="grid">
                  <label>Requester name *<input required value={requestDraft.requesterName} onChange={(e) => updateRequestDraft("requesterName", e.target.value)} placeholder="Given name and surname" /></label>
                  <label>Requester type *<select required value={requestDraft.requesterType} onChange={(e) => updateRequestDraft("requesterType", e.target.value)}>
                    {requestOptions.requesterTypes.map((value) => <option key={value}>{value}</option>)}</select></label>
                  <label>Organization, department or office *<input required value={requestDraft.organization} onChange={(e) => updateRequestDraft("organization", e.target.value)} placeholder="Organization, department, or office" /></label>
                  <label>Contact number *<input required value={requestDraft.contactNumber} onChange={(e) => updateRequestDraft("contactNumber", e.target.value)} placeholder="Mobile or landline" /></label>
                  <label className="span2">Email address *<input required type="email" value={requestDraft.email} onChange={(e) => updateRequestDraft("email", e.target.value)} placeholder="name@example.edu.ph" />
                    <small className="muted">Used to send the tracking reference. Not shown in public tracking.</small></label>
                </div>
              )}

              {step === 3 && (purpose === "EVENT_ACTIVITY_SUPPORT" ? (
                <div className="grid">
                  <p className="muted span2">These fields appear because the purpose is <b>Event or activity support</b>.</p>
                  <label>Event series *<select required value={requestDraft.eventSeriesId} onChange={(e) => {
                    const eventSeriesId = e.target.value;
                    const firstEvent = requestOptions.events.find((event) => event.seriesId === eventSeriesId);
                    setRequestDraft((current) => ({ ...current, eventSeriesId, eventId: firstEvent?.id || "" }));
                  }}>{requestOptions.eventSeries.map((series) => <option key={series.id} value={series.id}>{series.name}</option>)}</select></label>
                  <label>Sub-event *<select required value={requestDraft.eventId} onChange={(e) => updateRequestDraft("eventId", e.target.value)}>
                    <option value="">Select an event</option>
                    {requestOptions.events.filter((event) => event.seriesId === requestDraft.eventSeriesId).map((event) => <option key={event.id} value={event.id}>{event.name}</option>)}
                  </select></label>
                  <label>Location<input value={requestDraft.location} onChange={(e) => updateRequestDraft("location", e.target.value)} placeholder="e.g. Plenary Hall" /></label>
                  <label>Event purpose *<input required value={requestDraft.purpose} onChange={(e) => updateRequestDraft("purpose", e.target.value)} placeholder="Why the items are needed" /></label>
                  <label>Needed from<input type="date" value={requestDraft.startDate} onChange={(e) => updateRequestDraft("startDate", e.target.value)} /></label>
                  <label>Needed until<input type="date" value={requestDraft.endDate} onChange={(e) => updateRequestDraft("endDate", e.target.value)} /></label>
                  <label className="span2">Related or original request <em className="badge">Optional</em>
                    <input value={requestDraft.originalRequestId} onChange={(e) => updateRequestDraft("originalRequestId", e.target.value)} placeholder="Reference an earlier verified request" /></label>
                </div>
              ) : (
                <div className="grid">
                  <p className="muted span2">These fields appear because the purpose is <b>Office inventory or pantry</b>.
                    The event fields are not collected for this branch.</p>
                  <label>Inventory or pantry area *<select required value={requestDraft.stockArea} onChange={(e) => updateRequestDraft("stockArea", e.target.value)}>
                    {requestOptions.stockAreas.map((value) => <option key={value}>{value}</option>)}</select></label>
                  <label>Needed date *<input required type="date" value={requestDraft.neededDate} onChange={(e) => updateRequestDraft("neededDate", e.target.value)} /></label>
                  <label className="span2">Purpose or justification *<textarea required rows={3} value={requestDraft.purpose} onChange={(e) => updateRequestDraft("purpose", e.target.value)}
                    placeholder="Why the office or pantry needs these items." /></label>
                  <label className="span2">Related or original request <em className="badge">Optional</em>
                    <input value={requestDraft.relatedRequestId} onChange={(e) => updateRequestDraft("relatedRequestId", e.target.value)} placeholder="Reference an earlier verified request" /></label>
                </div>
              ))}

              {step === 4 && (
                <>
                  <p className="muted">Each line carries a category, an approved selection, a quantity with its unit,
                     and an optional specification.</p>
                  <ul className="lines">
                    {lines.map((l, idx) => (
                      <li key={idx}>
                        <div className="requestLine grid">
                          <label>Category<select value={l.category} onChange={(e) => updateRequestLine(idx, { category: e.target.value, itemId: "", referenceId: "", description: "", unit: "" })}>
                            {requestOptions.categories.map((value) => <option key={value}>{value}</option>)}</select></label>
                          {l.category === "Inventory Item" ? (
                            <label>Approved item<select value={l.itemId} onChange={(e) => {
                              const item = requestOptions.items.find((value) => value.id === e.target.value);
                              updateRequestLine(idx, { itemId: e.target.value, description: item?.name || "", unit: item?.unit || "" });
                            }}><option value="">Select an item</option>{requestOptions.items.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
                          ) : ["Venue / Facility", "Logistics / Equipment"].includes(l.category) ? (
                            <label>Approved reference<select value={l.referenceId} onChange={(e) => {
                              const reference = requestOptions.references.find((value) => value.id === e.target.value);
                              updateRequestLine(idx, { referenceId: e.target.value, description: reference?.name || "", unit: reference?.unit || "" });
                            }}><option value="">Select a reference</option>{requestOptions.references.filter((reference) =>
                              l.category === "Venue / Facility" ? reference.group === "Venues / Facilities" : reference.group !== "Venues / Facilities"
                            ).map((reference) => <option key={reference.id} value={reference.id}>{reference.name}</option>)}</select></label>
                          ) : (
                            <label>Description<input required value={l.description} onChange={(e) => updateRequestLine(idx, { description: e.target.value })} /></label>
                          )}
                          <label>Quantity<input type="number" min={1} value={l.quantity} onChange={(e) => updateRequestLine(idx, { quantity: Number(e.target.value) })} /></label>
                          <label>Unit<input required readOnly={Boolean(l.itemId || l.referenceId)} value={l.unit} onChange={(e) => updateRequestLine(idx, { unit: e.target.value })} /></label>
                          <label className="span2">Specification<textarea value={l.specification} onChange={(e) => updateRequestLine(idx, { specification: e.target.value })} /></label>
                        </div>
                        <button type="button" disabled={lines.length === 1} onClick={() => setLines((current) => current.filter((_, lineIndex) => lineIndex !== idx))}>Remove</button>
                      </li>
                    ))}
                  </ul>
                  <button type="button" onClick={() => setLines((p) => [...p,
                    { category: "Other", itemId: "", referenceId: "", description: "", quantity: 1, unit: "piece", specification: "" }])}>+ Add line</button>
                </>
              )}

              {step === 5 && (
                <>
                  {[
                    [1, "Request purpose", purpose === "EVENT_ACTIVITY_SUPPORT" ? "Event or activity support" : "Office inventory or pantry"],
                    [2, "Requester", `${requestDraft.requesterName || "Not entered"} · ${requestDraft.requesterType || "Not selected"} · ${requestDraft.organization || "Not entered"}`],
                    [3, "Context", purpose === "EVENT_ACTIVITY_SUPPORT"
                      ? `${requestOptions.eventSeries.find((value) => value.id === requestDraft.eventSeriesId)?.name || "No series"} · ${requestOptions.events.find((value) => value.id === requestDraft.eventId)?.name || "No event"}`
                      : `${requestDraft.stockArea || "No area"} · ${requestDraft.neededDate || "No date"}`],
                    [4, "Request lines", `${lines.length} line${lines.length === 1 ? "" : "s"}`],
                  ].map(([n, t, v]) => (
                    <div className="summary" key={String(n)}>
                      <span><small>Step {n} · {t}</small><b>{v}</b></span>
                      <button type="button" onClick={() => setStep(Number(n))}>Edit</button>
                    </div>
                  ))}
                  <h3>Required acknowledgments</h3>
                  {REQUEST_ACKS.map((a) => (
                    <label key={a.name} className="ack"><input type="checkbox" required checked={requestAcks[a.name]}
                      onChange={(e) => setRequestAcks((current) => ({ ...current, [a.name]: e.target.checked }))} />
                      <span><b>{a.title}</b><small>{a.body}</small></span></label>
                  ))}
                </>
              )}

              <div className="stepNav">
                <button type="button" disabled={step === 1} onClick={() => setStep((s) => s - 1)}>Back</button>
                <button type="button" className="primary" disabled={requestBusy} onClick={() => void continueRequest()}>
                  {requestBusy ? "Submitting…" : step === 5 ? "Submit request for review" : "Continue"}
                </button>
              </div>
              <p className="consequence">Submitting does not reserve anything and deducts no stock. The Department of
                Logistics reviews the request first; reservation and release are recorded separately.</p>
            </>
          ) : null}
        </section>
      )}

      {/* ==================== TRACKING ==================== */}
      {view === "Track a record" && (
        <section className="panel glass">
          <p className="eye">Private tracking</p>
          <h1>Track a record</h1>
          <p>Use only the identifier and private tracking code shown once after submission. This lookup does not
             display requester or borrower identity, contact details, reviewer identity, internal notes, or stock levels.</p>
          <fieldset><legend>Record type</legend><div className="choices">
            <label className={trackingKind === "request" ? "choice on" : "choice"}><input type="radio" checked={trackingKind === "request"} onChange={() => setTrackingKind("request")} />Request</label>
            <label className={trackingKind === "lending" ? "choice on" : "choice"}><input type="radio" checked={trackingKind === "lending"} onChange={() => setTrackingKind("lending")} />Borrowing request</label>
          </div></fieldset>
          <div className="grid">
            <label>Request or Submission ID<input value={trackingId} onChange={(e) => setTrackingId(e.target.value)} placeholder="REQ-… or LBR-…" /></label>
            <label>Private tracking code<input type="password" value={trackingCode} onChange={(e) => setTrackingCode(e.target.value)} placeholder="••••••••" /></label>
          </div>
          <button type="button" className="primary" disabled={trackingBusy} onClick={() => void checkTracking()}>
            {trackingBusy ? "Checking…" : "Check status"}
          </button>
          {trackingResult && <div className="stateBlock" role="status">
            <strong>{trackingResult.id} · {pretty(trackingResult.status)}</strong>
            <p>{trackingResult.lines.length} tracked line{trackingResult.lines.length === 1 ? "" : "s"}. Updated {trackingResult.updatedAt || "not reported"}.</p>
            <ul className="lines">{trackingResult.lines.map((line, index) => <li key={`${line.label}-${index}`}>
              <span><b>{line.label}</b><small>{line.quantity} {line.unit} · {pretty(line.status)}</small></span>
            </li>)}</ul>
          </div>}
        </section>
      )}

      {/* ==================== POLICY ==================== */}
      {view === "Policy" && (
        <section className="panel glass">
          <p className="eye">Policy</p>
          <h1>How logistics records are handled</h1>
          <h2>Public access</h2>
          <p>The Request Center and the Lending Center are public. No account, sign-in, activation, or approval is
             needed to submit. Staff review happens after submission, not before.</p>
          <h2>Protected information</h2>
          <p>Public tracking does not reveal staff identity, contact information, internal notes, or whether another
             protected account exists.</p>
          <h2>Service boundary</h2>
          <p>The browser submits only to the same-origin guarded service. Authorization, validation, inventory, review, and record truth remain server-owned.</p>
        </section>
      )}
    </main>
  );
}

function Receipt({ kind, receipt, onClose }: { kind: string; receipt: PublicSubmissionReceipt; onClose: () => void }) {
  return (
    <section className="panel receipt glass" role="status" aria-live="polite">
      <p className="eye">{kind} submitted</p>
      <h2>Save your private tracking details</h2>
      <div className="codes">
        <div><small>{kind === "Request" ? "Request ID" : "Submission ID"}</small><code>{receipt.id}</code></div>
        <div><small>Private tracking code</small><code>{receipt.trackingCode}</code></div>
      </div>
      <p className="warn">Copy both values now into a private password manager or secure note. The tracking code is
        shown once. Do not paste it into email, chat, or a public form.</p>
      <p><small>Initial status</small> <em className="tone tone--info">{pretty(receipt.status)}</em></p>
      <p className="consequence">The service confirmed this receipt. Closing this panel will not show the private tracking code again.</p>
      <button type="button" className="primary" onClick={onClose}>Close</button>
    </section>
  );
}

const css = `
.pub{--paper:#e9e0d0;--surface:var(--paper-warm);--inset:var(--paper-light);--muted:var(--ink-mid);--text:var(--ink-deep);--line:#d8cbb6;--hair:#e6dcc9;--ox:#610b0f;--gold:#7d5518;--action:var(--gold-vivid);--onAction:#40070a;
 --doneF:#1f6b41;--doneB:#e2f3e9;--doneL:#a8d3ba;--progF:#7d5518;--progB:#fbeed2;--progL:#dcbe8a;--infoF:#23557f;--infoB:#e4eefa;--infoL:#b0cbe6;--alertF:#9c2630;--alertB:#fbe6e8;--alertL:#e3aeb3;--neuF:#5d4a4f;--neuB:#ece3d3;--neuL:#cdbfa7;
 --onOx:var(--gold-cream);--glassHi:rgba(255,255,255,.34);--glassShadow:rgba(26,5,8,.14);
 --g2:rgba(255,251,242,.34);--edge:rgba(255,255,255,.62);--fA:rgba(97,11,15,.30);--fD:color-mix(in oklch, var(--gold-vivid) 26%, transparent);--fH:color-mix(in oklch, var(--paper-warm) 55%, transparent);--rule:rgba(97,11,15,.07);
 position:relative;min-height:100vh;padding:0 20px 80px;background:var(--paper);color:var(--text);font-family:"IBM Plex Sans",Inter,Arial,sans-serif}
.pub.dark{--paper:#100b0c;--surface:#1f1719;--inset:#281d20;--muted:#b3a0a4;--text:#f7efe6;--line:#3d2e31;--hair:#2c2124;--ox:#a5424b;--gold:#c9a45f;--action:#eed08a;--onAction:#40070a;
 --doneF:#9ad9b2;--doneB:rgba(45,112,72,.28);--doneL:rgba(154,217,178,.36);--progF:#eecb92;--progB:rgba(150,103,30,.28);--progL:rgba(238,203,146,.38);--infoF:#a8cbf0;--infoB:rgba(58,104,158,.26);--infoL:rgba(168,203,240,.38);--alertF:#f6acb2;--alertB:rgba(166,52,60,.3);--alertL:rgba(246,172,178,.36);--neuF:#cbb9bc;--neuB:rgba(255,255,255,.07);--neuL:rgba(255,255,255,.18);
 --onOx:var(--gold-cream);--glassHi:rgba(255,250,235,.22);--glassShadow:rgba(0,0,0,.34);
 --g2:rgba(107,26,38,.30);--edge:rgba(255,240,199,.34);--fA:rgba(165,66,75,.34);--fD:rgba(238,208,138,.16);--fH:rgba(120,20,26,.40);--rule:rgba(247,236,217,.05)}
.pub *{box-sizing:border-box}
.sr-only{position:absolute;width:1px;height:1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap}

/* G0 · large slow institutional fields. Only features bigger than ~132px survive a 22px blur, so nothing small is put here. */
.g0{position:fixed;inset:0;z-index:0;pointer-events:none;
 background-image:radial-gradient(58vw 58vw at 78% 4%,var(--fA),transparent 62%),radial-gradient(42vw 42vw at 6% 74%,var(--fD),transparent 66%),radial-gradient(70vw 46vw at 44% 108%,var(--fH),transparent 70%),repeating-linear-gradient(to right,var(--rule) 0 1px,transparent 1px 186px)}
.g0[data-module="request"]{background-image:radial-gradient(58vw 58vw at 16% 8%,var(--fA),transparent 62%),radial-gradient(42vw 42vw at 88% 62%,var(--fD),transparent 66%),radial-gradient(70vw 46vw at 58% 112%,var(--fH),transparent 70%),repeating-linear-gradient(to right,var(--rule) 0 1px,transparent 1px 186px)}
.pub>*:not(.g0){position:relative;z-index:1}

/* Glass is for CONTAINERS. Inputs and tables stay opaque so contrast never depends on what drifts behind. */
.glass{background:var(--g2);border:1px solid var(--edge);-webkit-backdrop-filter:blur(22px) saturate(118%);backdrop-filter:blur(22px) saturate(118%);box-shadow:inset 0 1px 0 var(--glassHi),0 12px 32px var(--glassShadow)}
.pub input,.pub select,.pub textarea{background:var(--surface)}
@media(prefers-reduced-transparency:reduce){.glass{background:var(--surface);-webkit-backdrop-filter:none;backdrop-filter:none}.g0{background-image:none}}
@media(prefers-reduced-motion:reduce){*{animation-duration:1ms!important;transition-duration:1ms!important}}

.pub button,.pub input,.pub select,.pub textarea{font:inherit;min-height:44px;padding:10px 12px;border:1px solid var(--line);background:var(--surface);color:var(--text);border-radius:10px}
.pub button{cursor:pointer}
.pub button:focus-visible,.pub input:focus-visible,.pub select:focus-visible,.pub textarea:focus-visible{outline:3px solid var(--action);outline-offset:2px}
.pub button:disabled{opacity:.45;cursor:not-allowed}
.primary{background:var(--action)!important;color:var(--onAction)!important;border-color:var(--action)!important;font-weight:700;min-height:48px}
.mast{max-width:1180px;margin:auto;min-height:82px;display:grid;grid-template-columns:1fr auto 1fr;align-items:center;gap:18px;border-bottom:1px solid var(--line)}
.mast>strong{text-align:right}.identity{display:flex;align-items:center;gap:8px}.identity img{width:38px;height:38px;object-fit:contain}
.identity span{font-size:11px;font-weight:700}.back{justify-self:start;border:0!important;background:transparent!important}
.notice,.pub nav,.panel,.assure{max-width:980px;margin-left:auto;margin-right:auto}
.notice{display:flex;justify-content:center;gap:10px;padding:10px;margin-top:18px;border:1px dashed var(--line);font-size:12px;border-radius:10px}
.notice span{color:var(--muted)}
.assure{display:flex;gap:24px;align-items:center;flex-wrap:wrap;margin-top:16px;padding:18px 22px;border-radius:14px}
.assure b{font-size:18px}.assure p{margin:4px 0 0;color:var(--text);font-size:14px;max-width:64ch}
.assure .who{display:flex;gap:8px;margin-left:auto;flex-wrap:wrap}
.chip{padding:8px 14px;border-radius:999px;background:var(--surface);border:1px solid var(--line);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.06em}
.pub nav{display:grid;grid-template-columns:repeat(5,1fr);margin-top:14px;gap:6px}
.pub nav button{font-size:12px}.pub nav .active{background:var(--ox);color:var(--onOx);border-color:var(--ox);font-weight:800}
.panel{margin-top:20px;padding:clamp(22px,4vw,40px);border-radius:18px}
.panel h1{font:700 clamp(32px,4.4vw,52px)/1.02 "Bricolage Grotesque",Georgia,serif;letter-spacing:-.03em;margin:6px 0 12px}
.panel h2{font:700 24px/1.2 "Bricolage Grotesque",Georgia,serif;margin:0 0 6px}
.panel h3{font:700 17px/1.3 "Bricolage Grotesque",Georgia,serif;margin:24px 0 8px}
.panel>p{color:var(--muted);max-width:70ch}
.eye{margin:0!important;color:var(--gold)!important;font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase}
.muted{color:var(--muted)}
.stateSwitch{display:flex;gap:6px;margin:18px 0 6px;flex-wrap:wrap}.stateSwitch button{font-size:12px;min-height:36px;padding:6px 12px;border-radius:999px}
.stateSwitch .active{background:var(--ox);color:var(--onOx);border-color:var(--ox)}
.filters{display:flex;gap:12px;margin-top:16px;flex-wrap:wrap}.filters label{display:grid;gap:6px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:var(--muted);flex:1;min-width:150px}
.filters .grow{flex:2 1 260px}
.catalog{list-style:none;margin:18px 0 0;padding:0;display:grid;gap:12px}
.catalog li{display:grid;grid-template-columns:72px minmax(0,1fr) auto;gap:14px;align-items:start;padding:14px;border:1px solid var(--hair);border-radius:14px;background:var(--surface)}
.catalog li.sel{border-color:var(--action);border-width:2px}
.itemThumb{width:72px;height:72px;object-fit:cover;border-radius:10px;border:1px solid var(--line);background:var(--inset)}
.ident{display:grid;gap:3px}.ident b{font-size:16px}.ident small{color:var(--muted);font-size:11px}
.tone{display:inline-block;padding:4px 9px;border-radius:999px;font-size:10px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;justify-self:start;font-style:normal}
.tone--done{background:var(--doneB);color:var(--doneF);border:1px solid var(--doneL)}
.tone--progress{background:var(--progB);color:var(--progF);border:1px solid var(--progL)}
.tone--info{background:var(--infoB);color:var(--infoF);border:1px solid var(--infoL)}
.tone--neutral{background:var(--neuB);color:var(--neuF);border:1px solid var(--neuL)}
.stateBlock{margin-top:18px;padding:20px;border:1px solid var(--hair);border-radius:14px;background:var(--inset);display:grid;gap:8px;justify-items:start}
.stateBlock.err{border-color:var(--alertL)}
.stateBlock strong{font-size:18px}.stateBlock p{margin:0;color:var(--muted)}
.catChips{display:flex;flex-wrap:wrap;gap:8px;margin-top:4px}
.catChips button{min-height:40px;padding:8px 14px;border-radius:999px;font-size:13px}
.catChips .allBtn{background:var(--inset);border-color:var(--line)}
.skeleton{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;width:100%}
.skeleton span{height:58px;border-radius:10px;background:var(--hair);animation:pl 1.4s ease-in-out infinite}
@keyframes pl{0%,100%{opacity:.55}50%{opacity:1}}
.selBox{margin-top:18px;padding:16px;background:var(--inset);border:1px solid var(--hair);border-radius:14px}
.selBox b{display:block}.selBox small{color:var(--muted)}
.lines{list-style:none;margin:12px 0 0;padding:0;display:grid;gap:10px}
.lines li{display:flex;gap:14px;align-items:center;flex-wrap:wrap;padding:12px 14px;background:var(--surface);border:1px solid var(--hair);border-radius:10px}
.lines li>span{flex:1;min-width:180px}.lines small{display:block;color:var(--muted);font-size:11px}
.qty{display:grid;gap:4px;font-size:11px;font-weight:700;text-transform:uppercase;color:var(--muted)}.qty input{width:90px}
fieldset{border:0;margin:22px 0 0;padding:0}legend{font:700 17px/1.3 "Bricolage Grotesque",Georgia,serif;padding:0 0 10px}
.choices{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.choice{display:flex;gap:12px;align-items:center;padding:14px;border:1px solid var(--line);border-radius:12px;background:var(--surface);cursor:pointer}
.choice.on{background:var(--progB);border-color:var(--action);border-width:2px}
.choice input{width:18px;height:18px;min-height:0;flex:none;accent-color:var(--ox)}
.choice b{display:block;font-size:15px}.choice small{color:var(--muted);font-size:11px}
.grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:16px}
.grid label,.panel label{display:grid;gap:6px;font-size:12px;font-weight:700}
.grid .span2{grid-column:1/-1}
.badge{display:inline-block;margin-left:6px;padding:2px 8px;border-radius:999px;background:var(--infoB);color:var(--infoF);border:1px solid var(--infoL);font-size:10px;font-style:normal;font-weight:700}
.ack{display:flex;gap:12px;align-items:flex-start;padding:14px;margin-top:10px;background:var(--inset);border:1px solid var(--hair);border-radius:12px}
.ack.cond{border-color:var(--infoL)}
.ack input{width:18px;height:18px;min-height:0;flex:none;margin-top:3px;accent-color:var(--ox)}
.ack b{display:block;font-size:15px}.ack small{color:var(--muted);font-size:13px}
/* The sign-in hand-off leaves the public portal, so it must not look like a
   sibling tab that switches a view in place. */
nav .leave{margin-left:auto;border-style:dashed}
nav .leave::after{content:" →"}

/* No left accent bar. DESIGN.md D08: lines are semantic — they connect a route,
   divide data, or indicate selection. A coloured tab on a disclaimer does none
   of those, and it is the most common tell of a generated UI. The quiet inset
   surface and a hairline carry it instead. Inherited from the previous file's
   .consequence/.gate rule; not carried forward. */
.consequence{margin-top:14px;padding:12px 14px;background:var(--inset);border:1px solid var(--hair);color:var(--muted);font-size:12px;border-radius:10px}
.stepper{list-style:none;display:grid;grid-auto-flow:column;grid-auto-columns:1fr;gap:6px;margin:20px 0 6px;padding:0}
.stepper li{display:flex;gap:8px;align-items:center;padding:12px;border-radius:12px;font-size:12px}
.stepper li.cur{background:var(--progB);border:1px solid var(--action)}
.stepper li.todo{color:var(--muted)}
.mk{flex:none;padding:3px 8px;border-radius:999px;font-size:11px;font-weight:800;background:var(--inset);border:1px solid var(--line)}
.stepper li.done .mk{background:var(--doneB);color:var(--doneF);border-color:var(--doneL)}
.stepper li.cur .mk{background:var(--ox);color:var(--onOx);border-color:var(--ox)}
.summary{display:flex;gap:16px;align-items:center;padding:14px 16px;margin-top:12px;background:var(--inset);border:1px solid var(--hair);border-radius:12px}
.summary>span{flex:1}.summary small{display:block;color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:.06em}
.stepNav{display:flex;justify-content:space-between;gap:12px;margin-top:22px}
.receipt{border:2px solid var(--doneL)}
.codes{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin:16px 0}
.codes div{padding:16px;background:var(--inset);border:1px solid var(--line);border-radius:12px}
.codes small{color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:.06em}
.codes code{display:block;margin-top:8px;font-family:"IBM Plex Mono",monospace;font-size:19px}
.warn{padding:14px;background:var(--progB);color:var(--progF);border:1px solid var(--progL);border-radius:12px;font-size:14px}
@media(max-width:900px){.mast{grid-template-columns:1fr auto}.mast>strong{display:none}.pub nav{grid-template-columns:repeat(2,1fr)}.stepper{grid-auto-flow:row}}
@media(max-width:640px){.pub{padding:0 12px 90px}.grid,.choices,.codes,.skeleton{grid-template-columns:1fr}
 .catalog li{grid-template-columns:60px minmax(0,1fr)}.catalog li>button{grid-column:2}
 .assure .who{margin-left:0}.panel{padding:20px 16px}.pub nav{grid-template-columns:1fr}}
`;

// end of PublicFlows.tsx
