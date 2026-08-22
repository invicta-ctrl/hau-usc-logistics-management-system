import React, { useState } from "react";
import {
  uscLogo,
  dolLogo,
  combinedLockup,
  loginBackground,
  favicon,
  defaultItemImage,
  currentProductionCover,
} from "../../ProductionAssets";
type Tab =
  | "Accounts & access"
  | "Staff directory"
  | "Reference administration"
  | "Link registry"
  | "Brand & media"
  | "System status"
  | "Activity";
type Prev =
  | "Populated"
  | "Loading"
  | "Empty"
  | "Filtered empty"
  | "Pending activation"
  | "Denied"
  | "Stale revision"
  | "Validation error"
  | "Unavailable"
  | "Simulated save success";
const tabs: Tab[] = [
  "Accounts & access",
  "Staff directory",
  "Reference administration",
  "Link registry",
  "Brand & media",
  "System status",
  "Activity",
];
export default function AdministrationRoute({
  dark,
  navigate,
}: {
  dark: boolean;
  navigate?: (r: string) => void;
}) {
  const [tab, setTab] = useState<Tab>("Accounts & access"),
    [prev, setPrev] = useState<Prev>("Populated"),
    [selected, setSelected] = useState("Inventory committee"),
    [dirty, setDirty] = useState(false),
    [reason, setReason] = useState("Committee reassignment"),
    [notice, setNotice] = useState("");
  const state = [
    "Populated",
    "Loading",
    "Empty",
    "Filtered empty",
    "Pending activation",
    "Denied",
    "Stale revision",
    "Validation error",
    "Unavailable",
    "Simulated save success",
  ];
  const content =
    prev === "Loading" ? (
      <div className="skeleton" aria-busy="true" />
    ) : prev === "Denied" ? (
      <State
        k="Denied"
        h="Access administration is not available to your account"
        p="This message does not confirm whether an account or person exists."
      >
        <button
          className="primary"
          onClick={() => navigate?.("overview")}
        >
          Back to overview
        </button>
      </State>
    ) : prev === "Stale revision" ? (
      <State
        k="Revision conflict"
        h="Revision 9 is no longer current"
        p="No capability change was applied. Reload the latest authorized revision."
      >
        <button
          className="primary"
          onClick={() => setPrev("Populated")}
        >
          Reload revision
        </button>
      </State>
    ) : prev === "Unavailable" ? (
      <State
        k="Unavailable"
        h="Administration service unavailable"
        p="No role, roster, reference, media, or audit record changed."
      >
        <button
          className="primary"
          onClick={() => setPrev("Populated")}
        >
          Retry
        </button>
      </State>
    ) : prev === "Empty" || prev === "Filtered empty" ? (
      <State
        k={prev}
        h="No administration records match this view"
        p="Restore the populated fixture without changing authority."
      >
        <button
          className="primary"
          onClick={() => setPrev("Populated")}
        >
          Clear filters
        </button>
      </State>
    ) : prev === "Simulated save success" ? (
      <State
        k="Synthetic result"
        h="Revision 10 preview saved locally"
        p="No server, roster, Google, provider, D1, R2, or audit write occurred."
      >
        <button
          className="primary"
          onClick={() => setPrev("Populated")}
        >
          Return to access
        </button>
      </State>
    ) : (
      <Panel
        tab={tab}
        selected={selected}
        setSelected={setSelected}
        dirty={dirty}
        setDirty={setDirty}
        reason={reason}
        setReason={setReason}
        setPrev={setPrev}
        setNotice={setNotice}
      />
    );
  return (
    <div className={"adm " + (dark ? "dark" : "light")}>
      <style>{css}</style>
      <section className="sandbox">
        <b>Design fixture</b>
        <span>Synthetic prototype · no backend</span>
        <label>
          Preview state
          <select
            value={prev}
            onChange={(e) => setPrev(e.target.value as Prev)}
          >
            {state.map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </label>
      </section>
      <header>
        <div>
          <p className="eye">Administration + governance</p>
          <h1>Authorized system controls</h1>
          <p>
            Review consequence, authority, and current revision
            before any permitted action.
          </p>
        </div>
        <small>Design fixture · not production data</small>
      </header>
      <nav
        className="tabs"
        aria-label="Administration sections"
      >
        {tabs.map((x) => (
          <button
            className={tab === x ? "active" : ""}
            key={x}
            onClick={() => setTab(x)}
          >
            {x}
          </button>
        ))}
      </nav>
      <select
        className="tab-select"
        value={tab}
        aria-label="Administration section"
        onChange={(e) => setTab(e.target.value as Tab)}
      >
        {tabs.map((x) => (
          <option key={x}>{x}</option>
        ))}
      </select>
      {content}
      <div className="live" role="status" aria-live="polite">
        {notice}
      </div>
    </div>
  );
}
function Panel({
  tab,
  selected,
  setSelected,
  dirty,
  setDirty,
  reason,
  setReason,
  setPrev,
  setNotice,
}: {
  tab: Tab;
  selected: string;
  setSelected: (x: string) => void;
  dirty: boolean;
  setDirty: (x: boolean) => void;
  reason: string;
  setReason: (x: string) => void;
  setPrev: (x: Prev) => void;
  setNotice: (x: string) => void;
}) {
  if (tab === "Accounts & access")
    return (
      <div className="grid">
        <section className="plane">
          <div className="head">
            <div>
              <p className="eye">Account revisions</p>
              <h2>Assigned identity and access</h2>
            </div>
            <b>Server acceptance is authoritative</b>
          </div>
          <table>
            <thead>
              <tr>
                <th>Account</th>
                <th>Scope</th>
                <th>State</th>
                <th>Revision</th>
              </tr>
            </thead>
            <tbody>
              {[
                [
                  "Administrator",
                  "Full operations",
                  "Active",
                  "14",
                ],
                [
                  "Inventory committee",
                  "Inventory and receiving",
                  "Active",
                  "9",
                ],
                [
                  "Food committee",
                  "Requests",
                  "Pending activation",
                  "2",
                ],
              ].map((r) => (
                <tr key={r[0]}>
                  <td>
                    <button
                      className="row"
                      onClick={() => setSelected(r[0])}
                    >
                      <b>Masked account</b>
                      <span>{r[0]}</span>
                    </button>
                  </td>
                  <td>{r[1]}</td>
                  <td>
                    <em>{r[2]}</em>
                  </td>
                  <td>{r[3]}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Cards
            rows={[
              [
                "Administrator",
                "Full operations",
                "Active",
                "14",
              ],
              [
                "Inventory committee",
                "Inventory and receiving",
                "Active",
                "9",
              ],
              [
                "Food committee",
                "Requests",
                "Pending activation",
                "2",
              ],
            ]}
            action={setSelected}
          />
        </section>
        <aside className="detail">
          <p className="eye">{selected}</p>
          <h2>Revision consequence preview</h2>
          <p>Current revision 9 must remain current.</p>
          <dl>
            <div>
              <dt>Record receiving</dt>
              <dd>Allowed → Allowed</dd>
            </div>
            <div>
              <dt>Confirm release</dt>
              <dd>Not allowed → Allowed</dd>
            </div>
            <div>
              <dt>Administer references</dt>
              <dd>Not allowed → Not allowed</dd>
            </div>
          </dl>
          <label className="check">
            <input
              type="checkbox"
              checked={dirty}
              onChange={(e) => setDirty(e.target.checked)}
            />
            Preview confirm-release capability
          </label>
          <div className="actions">
            <button
              className="primary"
              disabled={!dirty}
              onClick={() => setPrev("Simulated save success")}
            >
              Save revision 10
            </button>
            <button onClick={() => setDirty(false)}>
              Discard
            </button>
          </div>
        </aside>
      </div>
    );
  if (tab === "Staff directory")
    return (
      <div className="grid">
        <section className="plane">
          <div className="head">
            <div>
              <p className="eye">Directory</p>
              <h2>Authorized staff records</h2>
            </div>
            <b>12 of 34 people</b>
          </div>
          <table>
            <thead>
              <tr>
                <th>Person</th>
                <th>Area</th>
                <th>Role</th>
                <th>State</th>
                <th>Contact</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Inventory", "Committee head", "Active"],
                ["Food", "Member", "Active"],
                ["Materials", "Member", "Pending activation"],
              ].map((r) => (
                <tr key={r[0]}>
                  <td>Authorized staff member</td>
                  <td>{r[0]}</td>
                  <td>{r[1]}</td>
                  <td>
                    <em>{r[2]}</em>
                  </td>
                  <td>Masked — reveal needs a purpose</td>
                </tr>
              ))}
            </tbody>
          </table>
          <Cards
            rows={[
              ["Inventory", "Committee head", "Active", ""],
              ["Food", "Member", "Active", ""],
              ["Materials", "Member", "Pending activation", ""],
            ]}
            action={() => {}}
          />
        </section>
        <aside className="detail">
          <p className="eye">Selected protected record</p>
          <h2>Inventory committee</h2>
          <dl>
            <div>
              <dt>Role</dt>
              <dd>Committee head</dd>
            </div>
            <div>
              <dt>State</dt>
              <dd>Active</dd>
            </div>
            <div>
              <dt>Activated</dt>
              <dd>04 Aug 2026</dd>
            </div>
            <div>
              <dt>Last reviewed</dt>
              <dd>01 Sep 2026</dd>
            </div>
            <div>
              <dt>Contact</dt>
              <dd>Masked — reveal needs a purpose</dd>
            </div>
          </dl>
          <section className="gate">
            <b>
              PROPOSED UX · CONTRACT-GATED · NOT
              IMPLEMENTATION-READY
            </b>
            <p>
              Blocked by field-level roster / identity authority
              contract.
            </p>
            <button disabled>Add staff information</button>
            <button disabled>Edit fields</button>
            <button disabled>Reveal contact</button>
          </section>
          <label>
            Governance reason
            <input
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </label>
          <div className="actions">
            <button
              onClick={() =>
                setNotice("Synthetic consequence preview only")
              }
            >
              Preview
            </button>
            <button
              disabled={!reason.trim()}
              onClick={() =>
                setNotice(
                  "Applied locally · no Google or provider write",
                )
              }
            >
              Apply
            </button>
            <button
              onClick={() =>
                setNotice("Local preview rolled back")
              }
            >
              Roll back
            </button>
          </div>
        </aside>
      </div>
    );
  if (tab === "System status")
    return (
      <section className="plane">
        <div className="head">
          <div>
            <p className="eye">System status</p>
            <h2>STAGING · verified by service fixture</h2>
          </div>
          <em>Production denial guard active</em>
        </div>
        <table>
          <thead>
            <tr>
              <th>Dependency</th>
              <th>State</th>
              <th>Source</th>
              <th>Last verified</th>
            </tr>
          </thead>
          <tbody>
            {[
              [
                "Playground mode",
                "True",
                "Fixed fixture",
                "Now",
              ],
              [
                "Schema",
                "30 · migration 0030",
                "Service fixture",
                "Now",
              ],
              [
                "D1",
                "Isolated · connected",
                "Service fixture",
                "Now",
              ],
              [
                "Static assets",
                "Served",
                "Service fixture",
                "Now",
              ],
              [
                "Brand / evidence assets",
                "R2 isolated",
                "Service fixture",
                "Now",
              ],
            ].map((r) => (
              <tr key={r[0]}>
                {r.map((v, i) => (
                  <td key={i}>{i === 1 ? <em>{v}</em> : v}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    );
  if (tab === "Reference administration")
    return (
      <Dense
        title="Reference sets"
        rows={[
          [
            "Departments",
            "18 rows",
            "Revision 14",
            "Published",
          ],
          [
            "Item categories",
            "9 rows",
            "Revision 6 · draft 7",
            "Draft",
          ],
        ]}
      />
    );
  if (tab === "Link registry")
    return (
      <Dense
        title="Governed links"
        rows={[
          [
            "Official USC page",
            "HTTPS validated",
            "Published",
            "Read-only",
          ],
          ["Policy", "Same-origin", "Published", "Read-only"],
        ]}
      />
    );
  if (tab === "Brand & media")
    return <BrandMedia />;
  return (
    <section className="plane">
      <div className="head">
        <div>
          <p className="eye">Append-only activity</p>
          <h2>Verified operational events</h2>
        </div>
        <b>One row per event</b>
      </div>
      <table>
        <thead>
          <tr>
            <th>Time</th>
            <th>Event</th>
            <th>Record</th>
            <th>Evidence</th>
          </tr>
        </thead>
        <tbody>
          {[
            [
              "09:42",
              "Release confirmed",
              "REQ-2026-0136",
              "3 lines · evidence attached",
            ],
            [
              "09:18",
              "Receiving recorded",
              "PO-2026-0031",
              "Partial · 2 of 5 lines",
            ],
            [
              "08:55",
              "Loan flagged overdue",
              "LN-2026-0085",
              "Overdue state recorded",
            ],
            [
              "08:30",
              "Request returned for correction",
              "REQ-2026-0139",
              "Reason recorded",
            ],
            [
              "08:02",
              "Departments revision published",
              "Revision 14",
              "Published",
            ],
          ].map((r) => (
            <tr key={r[0]}>
              {r.map((v, i) => (
                <td key={i}>{v}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      <p className="note">
        Automated reminder unavailable — scheduler contract
        absent. No duplicate activity rows.
      </p>
    </section>
  );
}
const brandAssets = [
  [uscLogo, "USC logo", "Published", "Public identity"],
  [dolLogo, "DOL logo", "Published", "Current Logistics hub"],
  [combinedLockup, "Combined lockup", "Published", "Operational shell"],
  [loginBackground, "Login background", "Published", "Staff sign-in"],
  [favicon, "Favicon", "Published but unlinked in Production", "Prototype browser identity"],
  [defaultItemImage, "Default item image", "Published · catalog empty", "Lending fixture fallback"],
  [currentProductionCover, "Current public cover", "Verified fallback snapshot", "Landing media"],
] as const;
function BrandMedia() {
  return (
    <section className="plane">
      <div className="head">
        <div>
          <p className="eye">Production web-asset parity</p>
          <h2>Governed asset slots and current fallback</h2>
        </div>
        <b>Local static prototype copies</b>
      </div>
      <table className="asset-table">
        <thead><tr><th>Preview</th><th>Asset</th><th>Production state</th><th>Prototype use</th></tr></thead>
        <tbody>{brandAssets.map(([src, name, state, use]) => (
          <tr key={name}>
            <td><img className="asset-preview" src={src} alt="" /></td>
            <td><b>{name}</b></td><td>{state}</td><td>{use}</td>
          </tr>
        ))}</tbody>
      </table>
      <div className="asset-cards">{brandAssets.map(([src, name, state, use]) => (
        <article key={name}><img className="asset-preview" src={src} alt="" /><div><b>{name}</b><span>{state}</span><small>{use}</small></div></article>
      ))}</div>
      <p className="note">Design fixture only. No production, R2, provider, or asset-governance write occurred.</p>
    </section>
  );
}
function Dense({
  title,
  rows,
}: {
  title: string;
  rows: string[][];
}) {
  return (
    <section className="plane">
      <div className="head">
        <div>
          <p className="eye">Administration</p>
          <h2>{title}</h2>
        </div>
        <b>Read-only synthetic fixture</b>
      </div>
      <table>
        <tbody>
          {rows.map((r) => (
            <tr key={r[0]}>
              {r.map((v, i) => (
                <td key={i}>{i === 0 ? <b>{v}</b> : v}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
function Cards({
  rows,
  action,
}: {
  rows: string[][];
  action: (x: string) => void;
}) {
  return (
    <div className="cards">
      {rows.map((r) => (
        <article key={r[0]}>
          <div>
            <b>{r[0]}</b>
            <em>{r[2]}</em>
          </div>
          <p>
            {r[1]} · revision {r[3] || "—"}
          </p>
          <button
            className="primary"
            onClick={() => action(r[0])}
          >
            Open record
          </button>
        </article>
      ))}
    </div>
  );
}
function State({
  k,
  h,
  p,
  children,
}: {
  k: string;
  h: string;
  p: string;
  children: React.ReactNode;
}) {
  return (
    <section className="state">
      <p className="eye">{k}</p>
      <h2>{h}</h2>
      <p>{p}</p>
      {children}
    </section>
  );
}
const css = `
.adm{--bg:#fffdf8;--m1:#fff;--m2:#f7f0e2;--text:#241416;--muted:#6f5a60;--line:#e6dcc9;--ox:#6f1624;--gold:#a77417;min-height:100%;min-width:0;padding:24px;background:var(--bg);color:var(--text);font-family:"IBM Plex Sans",Inter,Arial,sans-serif}.adm.dark{--bg:#1c1917;--m1:#242120;--m2:#2d2927;--text:#faf9f7;--muted:#b9aaa7;--line:#49413d;--ox:#8e2134;--gold:#d0a64a}.adm *{box-sizing:border-box}.adm button,.adm input,.adm select{font:inherit;min-height:44px;padding:10px 12px;border:1px solid var(--line);background:var(--m1);color:var(--text)}.adm button:focus-visible,.adm input:focus-visible,.adm select:focus-visible{outline:3px solid var(--gold);outline-offset:2px}.adm button:disabled{opacity:.45}.sandbox,header,.head{display:flex;justify-content:space-between;align-items:center;gap:14px}.sandbox,header,.tabs,.grid,.plane,.state,.skeleton,.live{max-width:1440px;margin-left:auto;margin-right:auto}.sandbox{padding:10px 12px;border:1px dashed var(--line);background:var(--m2);font-size:12px}.sandbox span{color:var(--muted)}.sandbox label{display:flex;gap:8px;align-items:center}header{margin-top:22px;align-items:flex-end}header h1{font:700 clamp(28px,3vw,38px)/1.08 "Bricolage Grotesque","IBM Plex Sans",sans-serif;margin:4px 0 10px}header p{margin:0;color:var(--muted)}header small{border:1px solid var(--line);padding:8px}.eye{margin:0;color:var(--gold)!important;font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase}.tabs{display:grid;grid-template-columns:repeat(7,1fr);margin-top:20px}.tabs .active{background:var(--ox);color:#fff;border-color:var(--ox);font-weight:800}.grid{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(340px,.75fr);gap:16px;margin-top:16px;align-items:start}.plane,.detail,.state{background:var(--m1);border:1px solid var(--line)}.head{padding:17px;border-bottom:1px solid var(--line)}h2{font-family:"Bricolage Grotesque","IBM Plex Sans",sans-serif;margin:3px 0}.adm table{width:100%;border-collapse:collapse}.adm th,.adm td{text-align:left;padding:13px 15px;border-bottom:1px solid var(--line);font-size:13px}.adm th{background:var(--m2);font-size:10px;color:var(--muted);text-transform:uppercase}.row{display:grid;text-align:left;border:0!important;padding:0!important;background:transparent!important}.row span{color:var(--muted);font-size:11px}em{font-style:normal;display:inline-block;padding:5px 8px;background:var(--m2);border:1px solid var(--line);font-size:11px;font-weight:800}.cards{display:none}.detail{position:sticky;top:16px;padding:17px}.detail dl{display:grid;gap:9px}.detail dl div{display:grid;grid-template-columns:145px 1fr;gap:8px}.detail dt{color:var(--muted)}.detail dd{margin:0;font-weight:700}.detail label{display:grid;gap:5px;margin:14px 0}.check{grid-template-columns:24px 1fr!important;align-items:center}.check input{min-height:20px}.actions{display:flex;gap:8px;flex-wrap:wrap}.primary{background:var(--ox)!important;color:#fff!important;border-color:var(--ox)!important;font-weight:800}.gate{display:grid;gap:7px;padding:13px;margin:14px 0;background:var(--m2);border-left:4px solid var(--gold)}.gate>b{font-size:10px;color:var(--gold)}.gate p{color:var(--muted);font-size:12px}.state{padding:42px 20px;margin-top:16px}.state p{color:var(--muted)}.skeleton{height:520px;margin-top:16px;background:var(--m2);border:1px solid var(--line)}.note{padding:12px;color:var(--muted)}.live{min-height:24px;margin-top:12px;color:var(--muted);font-size:12px}
.asset-preview{width:64px;height:48px;object-fit:contain;background:var(--m2);border:1px solid var(--line)}.asset-cards{display:none}.tab-select{display:none}@media(max-width:900px){.tabs{grid-template-columns:repeat(2,1fr)}}@media(max-width:768px){.adm{padding:14px}.sandbox,header{flex-direction:column;align-items:flex-start}.tabs{display:none}.tab-select{display:block;width:100%;margin-top:14px}.grid{grid-template-columns:1fr}.adm table{display:none}.asset-cards{display:grid;gap:0}.asset-cards article{display:grid;grid-template-columns:72px 1fr;gap:12px;align-items:center;padding:12px;border-bottom:1px solid var(--line)}.asset-cards article div{display:grid;gap:3px}.asset-cards span,.asset-cards small{color:var(--muted)}.cards{display:grid;gap:10px;padding:12px}.cards article{border:1px solid var(--line);padding:13px}.cards article>div{display:flex;justify-content:space-between}.cards .primary{width:100%;min-height:48px}.detail{position:relative;top:auto}.actions{display:grid}.actions button{width:100%;min-height:48px}}@media(max-width:390px){.adm{padding:12px}header h1{font-size:32px}.head{flex-direction:column;align-items:flex-start}.detail dl div{grid-template-columns:1fr}}`;
