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
 *   onRequireAuth is retained in the props type for compatibility but is only
 *   used for genuinely protected destinations (staff sign-in), never to gate
 *   public intake.
 *
 * PROTOTYPE HONESTY
 *   Nothing here talks to a backend. Every simulated outcome is labelled.
 *   No success is presented as if a service confirmed it.
 */

import React, { useMemo, useState } from "react";
import { uscLogo, dolLogo, defaultItemImage } from "../../ProductionAssets";

type Route = "request" | "tracking" | "borrow";
type View = "Lending Center" | "Request Center" | "Track a record" | "Policy";

type CatalogState = "populated" | "loading" | "error" | "empty";
type BorrowerType = "" | "USC_STAFF" | "ANGELITE";
type RequestPurpose = "EVENT_ACTIVITY_SUPPORT" | "OFFICE_INVENTORY_PANTRY";

/* ---- fixtures shaped like /api/public/lending/catalog ---- */
type Item = {
  id: string; productId: string; name: string; category: string;
  type: "REUSABLE" | "CONSUMABLE";
  availability: "AVAILABLE" | "LIMITED" | "ELIGIBILITY_REQUIRED" | "UNAVAILABLE";
  unit: string; maximumQuantity: number; defaultLoanDays?: number;
  description: string; eligibility?: string; restrictions?: string; handlingNotes?: string;
  dueDateRequired: boolean; acknowledgmentRequired: boolean;
};

const ITEMS: Item[] = [
  { id: "itm-0114", productId: "LND-0114", name: "Folding chair", category: "Furniture", type: "REUSABLE",
    availability: "AVAILABLE", unit: "piece", maximumQuantity: 20, defaultLoanDays: 7,
    description: "Stackable steel-frame chair for assemblies and general activity seating.",
    dueDateRequired: true, acknowledgmentRequired: false },
  { id: "itm-0088", productId: "LND-0088", name: "Trestle table", category: "Furniture", type: "REUSABLE",
    availability: "LIMITED", unit: "piece", maximumQuantity: 6, defaultLoanDays: 7,
    description: "Folding table for registration counters and activity stations.",
    restrictions: "Indoor use only. Two-person carry required.",
    dueDateRequired: true, acknowledgmentRequired: false },
  { id: "itm-0203", productId: "LND-0203", name: "Wireless microphone", category: "Audio", type: "REUSABLE",
    availability: "ELIGIBILITY_REQUIRED", unit: "set", maximumQuantity: 2, defaultLoanDays: 3,
    description: "Handheld UHF microphone with receiver, batteries not included.",
    eligibility: "Approved council activity with a named officer-in-charge.",
    handlingNotes: "Return in the case with both antennae seated.",
    dueDateRequired: true, acknowledgmentRequired: true },
  { id: "itm-0450", productId: "LND-0450", name: "Extension cord, 10m", category: "Power", type: "REUSABLE",
    availability: "AVAILABLE", unit: "piece", maximumQuantity: 8, defaultLoanDays: 5,
    description: "Heavy-duty 10-metre extension with four grounded outlets.",
    dueDateRequired: true, acknowledgmentRequired: false },
  { id: "itm-0512", productId: "LND-0512", name: "Whiteboard marker set", category: "Supplies", type: "CONSUMABLE",
    availability: "AVAILABLE", unit: "set", maximumQuantity: 4,
    description: "Four-colour dry-erase marker set for committee sessions.",
    dueDateRequired: false, acknowledgmentRequired: false },
  { id: "itm-0620", productId: "LND-0620", name: "Portable PA speaker", category: "Audio", type: "REUSABLE",
    availability: "UNAVAILABLE", unit: "unit", maximumQuantity: 1, defaultLoanDays: 2,
    description: "Battery PA speaker with stand. Currently out for maintenance.",
    dueDateRequired: true, acknowledgmentRequired: true },
];

const USC_DEPARTMENTS = [
  "Office of the President", "Committee on Activities", "Committee on Finance",
  "Committee on Publications", "Department of Logistics",
];

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
const toneOf = (a: Item["availability"]) =>
  a === "AVAILABLE" ? "done" : a === "LIMITED" ? "progress" : a === "ELIGIBILITY_REQUIRED" ? "info" : "neutral";

export default function PublicFlows({
  route, onBack, dark, onRequireAuth,
}: {
  route: Route;
  onBack: () => void;
  dark: boolean;
  onRequireAuth: (route: "request-center" | "lending") => void;
}) {
  const initial: View =
    route === "borrow" ? "Lending Center" : route === "tracking" ? "Track a record" : "Request Center";
  const [view, setView] = useState<View>(initial);

  /* ---------- lending state ---------- */
  const [catalogState, setCatalogState] = useState<CatalogState>("populated");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("ALL");
  const [availability, setAvailability] = useState("REQUESTABLE");
  const [itemType, setItemType] = useState("ALL");
  const [selected, setSelected] = useState<Record<string, number>>({});
  const [borrowerType, setBorrowerType] = useState<BorrowerType>("");
  const [lendReceipt, setLendReceipt] = useState<{ id: string } | null>(null);

  /* ---------- request state ---------- */
  const [step, setStep] = useState(1);
  const [purpose, setPurpose] = useState<RequestPurpose>("EVENT_ACTIVITY_SUPPORT");
  const [lines, setLines] = useState([
    { category: "Furniture", item: "Folding chair — monobloc", quantity: 120, unit: "piece", spec: "For the plenary hall" },
    { category: "Audio", item: "Wireless microphone", quantity: 4, unit: "set", spec: "Panel discussion" },
  ]);
  const [reqReceipt, setReqReceipt] = useState(false);

  const [live, setLive] = useState("");
  const [alert, setAlert] = useState("");

  const categories = useMemo(() => [...new Set(ITEMS.map((i) => i.category))].sort(), []);
  const selectedItems = useMemo(
    () => Object.keys(selected).map((id) => ITEMS.find((i) => i.id === id)!).filter(Boolean),
    [selected],
  );
  const needsDueDate = selectedItems.some((i) => i.dueDateRequired);
  const needsRespAck = selectedItems.some((i) => i.acknowledgmentRequired);

  /* Search-first gate. The catalog opens closed and reveals on intent:
     two characters of search, or a category / item-type choice. */
  const searching =
    query.trim().length >= 2 || category !== "ALL" || itemType !== "ALL" || availability !== "REQUESTABLE";

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return ITEMS.filter(
      (i) =>
        (!q || `${i.name} ${i.productId} ${i.category}`.toLowerCase().includes(q)) &&
        (category === "ALL" || i.category === category) &&
        (availability === "ALL" ||
          i.availability === availability ||
          (availability === "REQUESTABLE" && REQUESTABLE.includes(i.availability))) &&
        (itemType === "ALL" || i.type === itemType),
    );
  }, [query, category, availability, itemType]);

  const toggleItem = (i: Item) => {
    if (!REQUESTABLE.includes(i.availability)) return;
    setSelected((prev) => {
      const next = { ...prev };
      if (next[i.id]) { delete next[i.id]; setLive(`${i.name} removed.`); }
      else { next[i.id] = 1; setLive(`${i.name} added. ${Object.keys(next).length} selected.`); }
      return next;
    });
  };

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
        <b>Prototype simulation</b>
        <span>Nothing is submitted, verified, emailed, or stored. Mirrors production 0.8.2 · c316e047.</span>
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
            onClick={() => { setView(next); setLendReceipt(null); setReqReceipt(false); setAlert(""); }}>
            {next}
          </button>
        ))}
        <button type="button" className="leave" onClick={() => onRequireAuth("request-center")}>
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

            <div className="stateSwitch" role="group" aria-label="Catalog state (prototype control)">
              {(["populated", "loading", "error", "empty"] as CatalogState[]).map((s) => (
                <button type="button" key={s} aria-pressed={catalogState === s}
                  className={catalogState === s ? "active" : ""} onClick={() => setCatalogState(s)}>
                  {s === "empty" ? "nothing published" : s}
                </button>
              ))}
            </div>

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
                    <p>{ITEMS.length} items are published for lending. Type at least two characters,
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
                          <img className="itemThumb" src={defaultItemImage} alt="" />
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
                <button type="button" onClick={() => setCatalogState("populated")}>Try again</button>
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
            <form className="panel glass" onSubmit={(e) => {
              e.preventDefault();
              if (!selectedItems.length) { setAlert("Select at least one available lending item."); return; }
              setAlert(""); setLendReceipt({ id: "LND-2026-0417" });
              setLive("Borrowing request submitted. Record LND-2026-0417. Initial status For Review.");
            }}>
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
            …1184 tokens truncated…            const n = idx + 1;
              const state = n < step ? "done" : n === step ? "cur" : "todo";
              return <li key={label} className={state} aria-current={n === step ? "step" : undefined}>
                <span className="mk">{state === "done" ? "✓" : n}</span>{label}</li>;
            })}
          </ol>

          {reqReceipt ? <Receipt kind="Request" id="REQ-2026-0142" onClose={() => { setReqReceipt(false); setStep(1); }} /> : (
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
                  <label>Requester name *<input placeholder="Given name and surname" /></label>
                  <label>Requester type *<select><option>USC Officer</option><option>USC Staff</option>
                    <option>Committee Head</option><option>Department Representative</option></select></label>
                  <label>Organization, department or office *<select>{USC_DEPARTMENTS.map((d) => <option key={d}>{d}</option>)}</select></label>
                  <label>Contact number *<input placeholder="Mobile or landline" /></label>
                  <label className="span2">Email address *<input type="email" placeholder="name@example.edu.ph" />
                    <small className="muted">Used to send the tracking reference. Not shown in public tracking.</small></label>
                </div>
              )}

              {step === 3 && (purpose === "EVENT_ACTIVITY_SUPPORT" ? (
                <div className="grid">
                  <p className="muted span2">These fields appear because the purpose is <b>Event or activity support</b>.</p>
                  <label>Event series *<select><option>General Assembly 2026–2027</option><option>Angelite Week 2026</option></select></label>
                  <label>Sub-event *<select><option>Day 2 — committee sessions</option><option>Day 1 — opening plenary</option></select></label>
                  <label>Location *<input placeholder="e.g. Plenary Hall" /></label>
                  <label>Event purpose *<input placeholder="Why the items are needed" /></label>
                  <label>Needed from *<input type="date" /></label>
                  <label>Needed until *<input type="date" /></label>
                  <label className="span2">Related or original request <em className="badge">Optional</em>
                    <input placeholder="Reference an earlier request" /></label>
                </div>
              ) : (
                <div className="grid">
                  <p className="muted span2">These fields appear because the purpose is <b>Office inventory or pantry</b>.
                    The event fields are not collected for this branch.</p>
                  <label>Inventory or pantry area *<select><option>Council pantry</option><option>Main office supplies</option>
                    <option>Publications store</option><option>Events store</option></select></label>
                  <label>Needed date *<input type="date" /></label>
                  <label className="span2">Purpose or justification *<textarea rows={3}
                    placeholder="Why the office or pantry needs these items." /></label>
                  <label className="span2">Related or original request <em className="badge">Optional</em>
                    <input placeholder="Reference an earlier request" /></label>
                </div>
              ))}

              {step === 4 && (
                <>
                  <p className="muted">Each line carries a category, an approved selection, a quantity with its unit,
                     and an optional specification.</p>
                  <ul className="lines">
                    {lines.map((l, idx) => (
                      <li key={idx}>
                        <span><b>{l.item}</b><small>{l.category} · {l.quantity} {l.unit} · {l.spec}</small></span>
                        <button type="button" onClick={() => setLines((p) => p.filter((_, i) => i !== idx))}>Remove</button>
                      </li>
                    ))}
                  </ul>
                  <button type="button" onClick={() => setLines((p) => [...p,
                    { category: "Supplies", item: "New line", quantity: 1, unit: "piece", spec: "—" }])}>+ Add line</button>
                </>
              )}

              {step === 5 && (
                <>
                  {[
                    [1, "Request purpose", purpose === "EVENT_ACTIVITY_SUPPORT" ? "Event or activity support" : "Office inventory or pantry"],
                    [2, "Requester", "Maria Santos · USC Officer · Committee on Activities"],
                    [3, "Context", purpose === "EVENT_ACTIVITY_SUPPORT"
                      ? "General Assembly 2026–2027 · Day 2 · Plenary Hall" : "Council pantry · needed 12 Sep 2026"],
                    [4, "Request lines", `${lines.length} line${lines.length === 1 ? "" : "s"}`],
                  ].map(([n, t, v]) => (
                    <div className="summary" key={String(n)}>
                      <span><small>Step {n} · {t}</small><b>{v}</b></span>
                      <button type="button" onClick={() => setStep(Number(n))}>Edit</button>
                    </div>
                  ))}
                  <h3>Required acknowledgments</h3>
                  {REQUEST_ACKS.map((a) => (
                    <label key={a.name} className="ack"><input type="checkbox" required />
                      <span><b>{a.title}</b><small>{a.body}</small></span></label>
                  ))}
                </>
              )}

              <div className="stepNav">
                <button type="button" disabled={step === 1} onClick={() => setStep((s) => s - 1)}>Back</button>
                <button type="button" className="primary" onClick={() => {
                  if (step < 5) { setStep((s) => s + 1); setLive(`Step ${step + 1} of 5. ${REQUEST_STEPS[step]}.`); }
                  else { setReqReceipt(true); setLive("Request submitted. Record REQ-2026-0142. Initial status For Review."); }
                }}>{step === 5 ? "Submit request for review" : "Continue"}</button>
              </div>
              <p className="consequence">Submitting does not reserve anything and deducts no stock. The Department of
                Logistics reviews the request first; reservation and release are recorded separately.</p>
            </>
          )}
        </section>
      )}

      {/* ==================== TRACKING ==================== */}
      {view === "Track a record" && (
        <section className="panel glass">
          <p className="eye">Private tracking</p>
          <h1>Track a record</h1>
          <p>Use only the identifier and private tracking code shown once after submission. This lookup does not
             display requester or borrower identity, contact details, reviewer identity, internal notes, or stock levels.</p>
          <div className="grid">
            <label>Request or Submission ID<input placeholder="REQ-2026-0142 or LND-2026-0417" /></label>
            <label>Private tracking code<input type="password" placeholder="••••••••" /></label>
          </div>
          <button type="button" className="primary" onClick={() => setLive("Prototype tracking result shown.")}>
            Check status
          </button>
          <div className="stateBlock" role="status">
            <strong>Prototype tracking</strong>
            <p>This prototype has no tracking service. In production this returns lifecycle state only.</p>
          </div>
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
          <h2>Prototype limit</h2>
          <p>This design proves interaction only. It has no authentication, email, database, provider, or storage connection.</p>
        </section>
      )}
    </main>
  );
}

function Receipt({ kind, id, onClose }: { kind: string; id: string; onClose: () => void }) {
  return (
    <section className="panel receipt glass" role="status" aria-live="polite">
      <p className="eye">{kind} submitted</p>
      <h2>Save your private tracking details</h2>
      <div className="codes">
        <div><small>{kind === "Request" ? "Request ID" : "Submission ID"}</small><code>{id}</code></div>
        <div><small>Private tracking code</small><code>PROTOTYPE-CODE-NOT-REAL</code></div>
      </div>
      <p className="warn">Copy both values now into a private password manager or secure note. The tracking code is
        shown once. Do not paste it into email, chat, or a public form.</p>
      <p><small>Initial status</small> <em className="tone tone--info">For Review</em></p>
      <p className="consequence">No record was created. No service confirmed this. The identifier and code above are fixtures.</p>
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
