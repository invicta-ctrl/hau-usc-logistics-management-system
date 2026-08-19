/* HAU-USC Logistics — Public Portals R3 prototype.

   PROTOTYPE HONESTY RULE
   Nothing here talks to a backend. Submission renders a receipt because that is
   the designed outcome, and every such moment is labelled PROTOTYPE BEHAVIOUR in
   the UI. No success is presented as if a service confirmed it. Tracking lookup
   matches a fixture and says so.

   Contract source: production 0.8.2 @ c316e047, src/visual/public-lending-portal.js
   and src/visual/public-requester-portal.js. */

import { RELEASE, LENDING_CATALOG, BORROWER_TYPES, LENDING_ACKS,
         REQUEST_OPTIONS, REQUEST_ACKS, REQUEST_STEPS } from './data.js';

const esc = (v) => String(v ?? '')
  .replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;')
  .replaceAll('"','&quot;').replaceAll("'",'&#039;');

const REQUESTABLE = ['AVAILABLE', 'LIMITED', 'ELIGIBILITY_REQUIRED'];
const requestable = (i) => REQUESTABLE.includes(i.availability);
const pretty = (v) => String(v).replaceAll('_', ' ');
const toneFor = (a) => a === 'AVAILABLE' ? 'done'
  : a === 'LIMITED' ? 'progress'
  : a === 'ELIGIBILITY_REQUIRED' ? 'info' : 'neutral';

const app = document.getElementById('app');
const polite = document.getElementById('live-polite');
const assertive = document.getElementById('live-assertive');
const say = (msg, urgent) => { (urgent ? assertive : polite).textContent = msg; };

const params = () => new URLSearchParams(location.search);
const q = (k, d) => params().get(k) ?? d;

/* ---------------- shared chrome ---------------- */

function masthead(current) {
  const link = (id, href, label) => id === current
    ? `<a href="${href}" aria-current="page">${label}</a>`
    : `<a href="${href}">${label}</a>`;
  return `<header class="masthead">
    <div class="lockup">
      <div class="crest" role="img" aria-label="USC crest placeholder — official mark not embedded in this prototype"></div>
      <div class="wordmark">University Student Council
        <small>Holy Angel University · Department of Logistics</small></div>
    </div>
    <nav class="portal-nav" aria-label="HAU-USC logistics portals">
      ${link('request', '?route=request', 'Request Center')}
      ${link('lending', '?route=lending', 'Lending Center')}
      <a href="#" aria-disabled="true">Staff sign in</a>
      <a href="#" aria-disabled="true">Back to portal selection</a>
    </nav>
  </header>`;
}

const release = () => `<p class="release">${esc(RELEASE.environment)} · mirrors production
  ${esc(RELEASE.appVersion)} · ${esc(RELEASE.candidateSha)} · schema ${esc(RELEASE.schemaVersion)}</p>`;

const assurance = () => `<section class="assurance">
  <div>
    <h2>No account and no sign-in needed</h2>
    <p>Open to USC staff and officers, and to every Angelite student. You do not need a
       HAU-USC Logistics account, staff sign-in, activation, or approval to submit.</p>
  </div>
  <div class="who"><span class="chip">USC Staff / Officer</span><span class="chip">Angelite Student</span></div>
</section>`;

const protoNote = (text) => `<p class="warnbox"><strong>Prototype behaviour.</strong> ${esc(text)}</p>`;

/* ================= PUBLIC LENDING ================= */

const selected = new Map();
let catalogState = 'populated';

function lendingView() {
  const c = LENDING_CATALOG;
  const cats = [...new Set(c.items.map(i => i.category))].sort();
  const avails = [...new Set(c.items.map(i => i.availability))].sort();
  return `${masthead('lending')}
  <main class="shell" id="main">
    <p class="eyebrow">HAU-USC Logistics · Public portal</p>
    <h1 class="page-title">Lending Center</h1>
    <p class="intro">Browse the borrower-safe catalog before providing personal information.
       Every request starts For Review.</p>
    ${release()}
    ${assurance()}

    <section class="panel glass" aria-labelledby="catTitle">
      <div class="on-glass">
        <div class="panel-head">
          <div><h2 id="catTitle">Browse items available for lending</h2>
            <p>Displayed availability is a current review signal, not a reservation or approval.</p></div>
          <span class="count" data-count>0 items</span>
        </div>
        <div class="filters">
          <div class="field field--search">
            <label for="f-search">Search</label>
            <input id="f-search" type="search" autocomplete="off" role="combobox"
              aria-expanded="false" aria-controls="suggest"
              placeholder="Search name, Product ID, alias, or category">
            <div class="suggestions" id="suggest" role="listbox" hidden></div>
          </div>
          <div class="field"><label for="f-cat">Category</label>
            <select id="f-cat"><option value="ALL">All categories</option>
              ${cats.map(v => `<option>${esc(v)}</option>`).join('')}</select></div>
          <div class="field"><label for="f-avail">Availability</label>
            <select id="f-avail"><option value="ALL">All availability</option>
              <option value="REQUESTABLE" selected>Requestable now</option>
              ${avails.map(v => `<option value="${esc(v)}">${esc(pretty(v))}</option>`).join('')}</select></div>
          <div class="field"><label for="f-type">Item type</label>
            <select id="f-type"><option value="ALL">Reusable and consumable</option>
              <option value="REUSABLE">Reusable</option><option value="CONSUMABLE">Consumable</option></select></div>
        </div>
        <div class="catalog" data-catalog></div>
      </div>
    </section>

    <div class="two-col">
      <form class="panel glass" id="lendForm" novalidate>
        <div class="on-glass">
          <div class="panel-head"><div><h2>New borrowing request</h2>
            <p>Select items above, then choose the borrower classification before entering details.</p></div></div>

          <div class="selected-box">
            <div class="panel-head"><div><h3 style="font-size:17px">Selected items</h3>
              <p>No item is reserved until authorized staff approve it.</p></div>
              <span class="count" data-selcount>0 items</span></div>
            <div data-selected><p class="empty">Choose an available catalog item.</p></div>
          </div>

          <fieldset>
            <legend>Who is borrowing?</legend>
            <div class="choice-row">
              ${BORROWER_TYPES.map(b => `<label class="choice">
                <input type="radio" name="borrowerType" value="${esc(b.value)}" required>
                <span><strong>${esc(b.label)}</strong><small>${esc(b.hint)}</small></span></label>`).join('')}
            </div>
          </fieldset>

          <div data-details hidden>
            <div class="form-grid">
              <div class="field"><label for="i-name">Full name *</label>
                <input id="i-name" name="borrowerName" maxlength="120" required placeholder="Given name and surname"></div>
              <div class="field"><label for="i-sid">Student ID *</label>
                <input id="i-sid" name="studentId" inputmode="numeric" pattern="[0-9]{1,8}" maxlength="8" required placeholder="Up to 8 digits"></div>

              <!-- Academic identity is ALWAYS collected. USC officers are Angelite students
                   too, so this is the basic information sheet, not a branch. -->
              <div class="field span-2" data-academic>
                <div class="form-grid" style="margin:0">
                  <div class="field"><label for="i-course" class="lbl">Course and year *</label>
                    <input id="i-course" name="courseYear" maxlength="80" required placeholder="e.g. BSIT 2"></div>
                  <div class="field"><label for="i-acad" class="lbl">College, school, or academic department *</label>
                    <input id="i-acad" name="academicDepartment" maxlength="120" required placeholder="e.g. School of Computing"></div>
                </div>
              </div>

              <!-- Council role is the ONLY branch: shown for USC Staff / Officer,
                   removed outright for a student borrower. -->
              <div class="field span-2" data-staff hidden>
                <div class="form-grid" style="margin:0">
                  <div class="field"><div class="lbl-row"><label for="i-dept" class="lbl">USC department *</label>
                    <span class="badge">USC Staff / Officer only</span></div>
                    <select id="i-dept" name="uscDepartment"><option value="">Select department or office</option>
                      ${LENDING_CATALOG.uscDepartments.map(d => `<option>${esc(d)}</option>`).join('')}</select></div>
                  <div class="field"><div class="lbl-row"><label for="i-role" class="lbl">Position or role</label>
                    <span class="badge">USC Staff / Officer only</span></div>
                    <input id="i-role" name="positionRole" maxlength="120" placeholder="e.g. Committee Head"></div>
                </div>
              </div>

              <div class="field"><label for="i-tel">Contact number *</label>
                <input id="i-tel" name="contactNumber" maxlength="24" required placeholder="Mobile or landline"></div>
              <div class="field"><label for="i-mail">Email address *</label>
                <input id="i-mail" name="email" type="email" maxlength="254" required placeholder="name@example.edu.ph"></div>
              <div class="field span-2"><div class="lbl-row"><label for="i-due" class="lbl">Borrowing until</label>
                  <span class="badge" data-due-badge hidden>Conditional</span></div>
                <input id="i-due" name="dueDate" type="date">
                <p class="help" data-due-help>Optional for the current selection.</p>
                <p class="help">Pickup is not requested here. Authorized staff record the actual pickup date
                   at handoff, so the loan starts from when the item really leaves the desk.</p></div>
              <div class="field span-2"><label for="i-purpose">Purpose *</label>
                <textarea id="i-purpose" name="purpose" maxlength="500" required
                  placeholder="Describe the activity and how the items will be used. Maximum 500 characters."></textarea></div>
            </div>

            <h3 style="font-size:17px;margin-top:var(--s-6)">Required acknowledgments</h3>
            ${LENDING_ACKS.map(a => `<label class="ack${a.conditional ? ' ack--conditional' : ''}" data-ack="${esc(a.name)}">
              <input type="checkbox" name="${esc(a.name)}" ${a.conditional ? '' : 'required'}>
              <span><strong>${esc(a.title)}${a.conditional ? ' <span class="badge">Conditional</span>' : ''}</strong>
              <small>${esc(a.body)}</small></span></label>`).join('')}

            <div class="step-nav">
              <span></span>
              <button class="btn btn--primary" type="submit">Submit borrowing request for review</button>
            </div>
            <p class="disclaimer">Submission does not guarantee approval or allocation. Nothing is
              reserved and no stock is deducted at this step.</p>
          </div>
          <div data-receipt></div>
        </div>
      </form>

      <aside class="aside">
        <section class="panel glass glass--g1"><div class="on-glass">
          <p class="eyebrow">How it works</p><h2 style="font-size:19px">Borrowing process</h2>
          <ol>${LENDING_CATALOG.process.map(s => `<li>${esc(s)}</li>`).join('')}</ol>
        </div></section>

        <section class="panel glass glass--g1"><div class="on-glass">
          <p class="eyebrow">Private tracking</p><h2 style="font-size:19px">Track a borrowing request</h2>
          <p style="font-size:13px;color:var(--text-secondary);margin-top:var(--s-2)">
            Use only the Submission ID and private tracking code shown once after submission.
            This lookup does not display borrower identity or contact details.</p>
          <form id="trackForm" style="margin-top:var(--s-4)">
            <div class="field"><label for="t-id">Submission ID</label>
              <input id="t-id" name="submissionId" autocomplete="off" placeholder="LND-2026-0000"></div>
            <div class="field" style="margin-top:var(--s-3)"><label for="t-code">Private tracking code</label>
              <input id="t-code" name="trackingCode" type="password" autocomplete="off" placeholder="••••••••"></div>
            <button class="btn btn--quiet" type="submit" style="margin-top:var(--s-4);width:100%">Check borrowing status</button>
          </form>
          <div data-track-result></div>
        </div></section>
      </aside>
    </div>
  </main>
  <div class="sticky-bar">
    <div><strong data-selcount-m>0 items selected</strong><small>Nothing is reserved yet</small></div>
    <button class="btn btn--primary" type="button" data-jump>Review</button>
  </div>`;
}

function bindLending() {
  const root = app;
  const catalogRoot = root.querySelector('[data-catalog]');
  const search = root.querySelector('#f-search');
  const suggest = root.querySelector('#suggest');
  const cat = root.querySelector('#f-cat');
  const avail = root.querySelector('#f-avail');
  const type = root.querySelector('#f-type');
  const count = root.querySelector('[data-count]');
  const form = root.querySelector('#lendForm');
  const selRoot = root.querySelector('[data-selected]');
  const selCount = root.querySelector('[data-selcount]');
  const selCountM = root.querySelector('[data-selcount-m]');
  const details = root.querySelector('[data-details]');
  const staff = root.querySelector('[data-staff]');
  const academic = root.querySelector('[data-academic]');
  const due = root.querySelector('#i-due');
  const dueHelp = root.querySelector('[data-due-help]');
  const dueBadge = root.querySelector('[data-due-badge]');
  const ackResp = root.querySelector('[data-ack="responsibilityAcknowledged"] input');

  let searchTimer;

  const syncBorrower = (value) => {
    details.hidden = !value;
    const isStaff = value === 'USC_STAFF';
    // Academic identity is common ground — always collected, never toggled.
    academic.querySelectorAll('input,select').forEach(c => {
      c.disabled = !value; c.required = Boolean(value);
    });
    // Council role is the only branch. Removed outright for a student borrower,
    // and cleared + disabled so it cannot submit stale data.
    staff.hidden = !isStaff;
    staff.querySelectorAll('input,select').forEach(c => {
      c.disabled = !isStaff; c.required = isStaff && c.name === 'uscDepartment';
      if (!isStaff) c.value = '';
    });
    if (value) say(isStaff
      ? 'USC staff and officer details shown, including council department.'
      : 'Student details shown. Council department is not collected.');
  };
  form.querySelectorAll('[name="borrowerType"]').forEach(r =>
    r.addEventListener('change', () => syncBorrower(r.value)));

  const renderSelected = () => {
    const needsDue = [...selected.values()].some(l => l.dueDateRequired);
    const needsAck = [...selected.values()].some(l => l.acknowledgmentRequired);
    due.required = needsDue; dueBadge.hidden = !needsDue;
    dueHelp.textContent = needsDue ? 'Required for the selected reusable item.' : 'Optional for the current selection.';
    ackResp.required = needsAck;
    root.querySelector('[data-ack="responsibilityAcknowledged"]').classList.toggle('ack--conditional', needsAck);

    const label = `${selected.size} item${selected.size === 1 ? '' : 's'}`;
    selCount.textContent = label;
    selCountM.textContent = `${label} selected`;
    selRoot.innerHTML = selected.size
      ? [...selected.values()].map(l => `<div class="line">
          <span class="who"><strong>${esc(l.name)}</strong>
            <small>${esc(pretty(l.type))} · ${esc(l.unit)} · maximum ${esc(l.maximumQuantity)}</small></span>
          <label class="lbl">Quantity
            <input type="number" min="1" max="${esc(l.maximumQuantity)}" step="1" value="${esc(l.quantity)}"
              data-qty="${esc(l.itemId)}" aria-label="Quantity for ${esc(l.name)}"></label>
          <button class="btn btn--quiet btn--mini" type="button" data-remove="${esc(l.itemId)}">Remove</button>
        </div>`).join('')
      : '<p class="empty">Choose an available catalog item.</p>';

    selRoot.querySelectorAll('[data-qty]').forEach(i => i.addEventListener('change', () => {
      const line = selected.get(i.dataset.qty);
      const n = Number(i.value);
      const ok = Number.isSafeInteger(n) && n >= 1 && n <= Number(line.maximumQuantity);
      i.setCustomValidity(ok ? '' : 'Enter a whole number within the allowed maximum.');
      if (ok) { line.quantity = n; say(`${line.name} quantity ${n}.`); } else i.reportValidity();
    }));
    selRoot.querySelectorAll('[data-remove]').forEach(b => b.addEventListener('click', () => {
      const l = selected.get(b.dataset.remove);
      selected.delete(b.dataset.remove);
      say(`${l.name} removed. ${selected.size} item${selected.size === 1 ? '' : 's'} selected.`);
      renderSelected(); renderCatalog();
    }));
  };

  const visibleItems = () => {
    const query = search.value.trim().toLowerCase();
    return LENDING_CATALOG.items.filter(i =>
      (!query || [i.name, i.productId, i.category, ...(i.aliases ?? [])].join(' ').toLowerCase().includes(query)) &&
      (cat.value === 'ALL' || i.category === cat.value) &&
      (avail.value === 'ALL' || i.availability === avail.value ||
        (avail.value === 'REQUESTABLE' && requestable(i))) &&
      (type.value === 'ALL' || i.type === type.value));
  };

  /* Search-first. The catalog opens closed and reveals on intent: two characters
     of search, or a category / item-type choice. Discovery still has to work, so
     the total is stated and the categories are one-tap entries — otherwise
     "What can I borrow?" would have no answer at all. */
  const searching = () =>
    search.value.trim().length >= 2 || cat.value !== 'ALL' || type.value !== 'ALL' || avail.value !== 'REQUESTABLE';

  function renderCatalog() {
    if (catalogState !== 'populated') return renderCatalogState();
    if (!searching()) {
      const cats = [...new Set(LENDING_CATALOG.items.map(i => i.category))].sort();
      count.textContent = `${LENDING_CATALOG.items.length} published`;
      catalogRoot.innerHTML = `<div class="state-block" style="grid-column:1/-1">
        <h3>Search to see what you can borrow</h3>
        <p>${LENDING_CATALOG.items.length} items are published for lending. Type at least two characters,
           or pick a category to start.</p>
        <div class="cat-chips">
          ${cats.map(c => `<button class="btn btn--quiet btn--mini" type="button" data-cat="${esc(c)}">${esc(c)}</button>`).join('')}
          <button class="btn btn--quiet btn--mini" type="button" data-showall>Show everything</button>
        </div></div>`;
      catalogRoot.querySelectorAll('[data-cat]').forEach(b => b.addEventListener('click', () => {
        cat.value = b.dataset.cat; say(`${b.dataset.cat} selected.`); renderCatalog();
      }));
      catalogRoot.querySelector('[data-showall]')?.addEventListener('click', () => {
        avail.value = 'ALL'; say('Showing all published items.'); renderCatalog();
      });
      return;
    }
    const vis = visibleItems();
    count.textContent = `${vis.length} item${vis.length === 1 ? '' : 's'}`;
    catalogRoot.innerHTML = vis.length ? vis.map(i => `
      <article class="card${selected.has(i.id) ? ' card--selected' : ''}">
        <div class="thumb" role="img" aria-label=""></div>
        <span class="status status--${toneFor(i.availability)}">${esc(pretty(i.availability))}</span>
        <p class="pid">Product ID ${esc(i.productId)}</p>
        <h3>${esc(i.name)}</h3>
        <p class="cat">${esc(i.category)} · ${esc(pretty(i.type))}</p>
        <p class="desc">${esc(i.description)}</p>
        <p class="meta">Unit: ${esc(i.unit)} · Maximum request: ${esc(i.maximumQuantity)}${
          i.defaultLoanDays ? ` · Normal loan: ${esc(i.defaultLoanDays)} days` : ''}</p>
        ${i.eligibility ? `<p class="rule"><strong>Eligibility:</strong> ${esc(i.eligibility)}</p>` : ''}
        ${i.restrictions ? `<p class="rule"><strong>Restrictions:</strong> ${esc(i.restrictions)}</p>` : ''}
        ${i.handlingNotes ? `<p class="rule"><strong>Handling:</strong> ${esc(i.handlingNotes)}</p>` : ''}
        <span class="spacer"></span>
        <button class="btn ${selected.has(i.id) ? 'btn--quiet' : 'btn--primary'} btn--mini" type="button"
          data-select="${esc(i.id)}" ${!requestable(i) ? 'disabled' : ''}>
          ${selected.has(i.id) ? 'Selected' : requestable(i) ? 'Request item' : 'Not requestable'}</button>
      </article>`).join('')
      : `<div class="state-block" style="grid-column:1/-1"><h3>No catalog items match the current search and filters.</h3>
         <p>The catalog has items; the current search, category, availability or item-type selection excludes all of them.</p>
         <button class="btn btn--quiet btn--mini" type="button" data-clear style="margin-top:var(--s-4)">Clear filters</button></div>`;

    say(`${vis.length} item${vis.length === 1 ? '' : 's'} match.`);
    catalogRoot.querySelectorAll('[data-select]').forEach(b => b.addEventListener('click', () => {
      const i = LENDING_CATALOG.items.find(x => x.id === b.dataset.select);
      if (!i || selected.has(i.id)) return;
      selected.set(i.id, { itemId: i.id, name: i.name, type: i.type, unit: i.unit,
        maximumQuantity: i.maximumQuantity, dueDateRequired: i.dueDateRequired,
        acknowledgmentRequired: i.acknowledgmentRequired, quantity: 1 });
      say(`${i.name} added. ${selected.size} item${selected.size === 1 ? '' : 's'} selected.`);
      renderSelected(); renderCatalog();
    }));
    catalogRoot.querySelector('[data-clear]')?.addEventListener('click', () => {
      search.value = ''; cat.value = 'ALL'; avail.value = 'REQUESTABLE'; type.value = 'ALL'; renderCatalog();
    });
  }

  function renderCatalogState() {
    const map = {
      loading: `<div class="state-block" style="grid-column:1/-1" role="status">
        <h3>Loading the governed catalog…</h3><p>Checking current borrower-safe availability.</p>
        <div class="skeleton"><span></span><span></span><span></span></div></div>`,
      error: `<div class="state-block" style="grid-column:1/-1" role="alert">
        <h3>Catalog service unavailable</h3>
        <p>The borrower-safe catalog could not be loaded. This is a service error, not an empty catalog.</p>
        <button class="btn btn--quiet btn--mini" type="button" data-retry style="margin-top:var(--s-4)">Try again</button></div>`,
      empty: `<div class="state-block" style="grid-column:1/-1">
        <h3>No approved lending items are published.</h3>
        <p>The governed catalog loaded successfully, but no active item is currently approved for public lending.</p></div>`,
    };
    catalogRoot.innerHTML = map[catalogState] ?? '';
    count.textContent = '—';
    catalogRoot.querySelector('[data-retry]')?.addEventListener('click', () => {
      catalogState = 'populated'; renderCatalog();
    });
  }

  const renderSuggestions = () => {
    const query = search.value.trim().toLowerCase();
    const matches = query.length >= 2 ? visibleItems().slice(0, 8) : [];
    suggest.hidden = matches.length === 0;
    search.setAttribute('aria-expanded', matches.length ? 'true' : 'false');
    suggest.innerHTML = matches.map(i =>
      `<button type="button" role="option" data-sug="${esc(i.id)}">
        <strong>${esc(i.name)}</strong><small>${esc(i.productId)} · ${esc(i.category)}</small></button>`).join('');
  };
  suggest.addEventListener('click', (e) => {
    const b = e.target.closest('[data-sug]'); if (!b) return;
    const i = LENDING_CATALOG.items.find(x => x.id === b.dataset.sug);
    search.value = i.name; suggest.hidden = true;
    search.setAttribute('aria-expanded', 'false'); renderCatalog();
  });
  search.addEventListener('input', () => {
    clearTimeout(searchTimer);                 // throttle so every keystroke does not announce
    searchTimer = setTimeout(() => { renderCatalog(); renderSuggestions(); }, 220);
  });
  [cat, avail, type].forEach(c => c.addEventListener('change', renderCatalog));

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!selected.size) {
      say('Select at least one available lending item.', true);
      app.querySelector('[data-catalog]').scrollIntoView({ block: 'center' });
      return;
    }
    if (!form.reportValidity()) { say('Some required details are missing.', true); return; }
    const id = `LND-2026-${String(400 + Math.floor(selected.size * 7 + 11)).padStart(4, '0')}`;
    const code = 'PROTOTYPE-CODE-NOT-REAL';
    form.querySelectorAll('input,select,textarea,button').forEach(c => { c.disabled = true; });
    app.querySelector('[data-receipt]').innerHTML = `
      <section class="panel receipt" role="status" style="margin-top:var(--s-6)">
        <span class="status status--done">Borrowing request submitted</span>
        <h2 style="font-size:30px;margin-top:var(--s-3)">Save your private tracking details</h2>
        <div class="codes">
          <div><span class="lbl">Submission ID</span><code>${esc(id)}</code></div>
          <div><span class="lbl">Private tracking code</span><code>${esc(code)}</code></div>
        </div>
        <p class="warnbox">Copy both values now into a private password manager or secure note.
          The tracking code is shown once. Do not paste it into email, chat, or a public form.</p>
        <p style="margin-top:var(--s-4)"><span class="lbl">Initial status</span>
          <span class="status status--info" style="margin-left:var(--s-3)">For Review</span></p>
        <p style="font-size:14px;color:var(--text-secondary);margin-top:var(--s-3)">
          Submission does not guarantee approval or allocation. Authorized staff will complete
          eligibility and availability review. Nothing is reserved and no stock is deducted.</p>
        ${protoNote('No request was created. No service confirmed this. The identifier and code above are fixtures.')}
      </section>`;
    say(`Borrowing request submitted. Record ${id}. Initial status For Review.`);
    app.querySelector('[data-receipt]').scrollIntoView({ block: 'center' });
  });

  app.querySelector('#trackForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const out = app.querySelector('[data-track-result]');
    out.innerHTML = `<div class="state-block" role="status" style="margin-top:var(--s-4)">
      <h3 style="font-size:17px">Prototype tracking</h3>
      <p>This prototype has no tracking service. In production this returns lifecycle state only —
         never borrower identity, contact details, reviewer identity, internal notes, or stock levels.</p></div>`;
    e.target.elements.trackingCode.value = '';
    say('Prototype tracking result shown.');
  });

  app.querySelector('[data-jump]')?.addEventListener('click', () =>
    app.querySelector('#lendForm').scrollIntoView({ behavior: 'smooth', block: 'start' }));

  renderCatalog(); renderSelected(); syncBorrower('');
}

/* ================= PUBLIC REQUEST ================= */

let step = 1;
const req = { purpose: 'EVENT_ACTIVITY_SUPPORT', lines: [
  { category: 'Furniture', item: 'Folding chair — monobloc', quantity: 120, unit: 'piece', spec: 'For the plenary hall' },
  { category: 'Audio', item: 'Wireless microphone', quantity: 4, unit: 'set', spec: 'Panel discussion' },
] };

function stepper() {
  return `<div class="stepper">${REQUEST_STEPS.map((label, i) => {
    const n = i + 1;
    const state = n < step ? 'done' : n === step ? 'current' : 'todo';
    return `<div class="step step--${state}">
      <span class="marker">${state === 'done' ? '✓' : n}</span>
      <span class="label">${esc(label)}</span></div>`;
  }).join('')}</div>`;
}

function requestView() {
  const o = REQUEST_OPTIONS;
  const isEvent = req.purpose === 'EVENT_ACTIVITY_SUPPORT';
  return `${masthead('request')}
  <main class="shell" id="main">
    <p class="eyebrow">HAU-USC Logistics · Public portal</p>
    <h1 class="page-title">Request Center</h1>
    <p class="intro">Tell us what the activity needs. No account is required — you receive a private
       tracking code once, after you submit.</p>
    ${release()}
    ${assurance()}
    ${stepper()}

    <section class="panel glass panel--active" aria-labelledby="stepTitle">
      <div class="on-glass">
        <p class="eyebrow">Step ${step} of 5</p>
        <h2 id="stepTitle" style="font-size:24px;margin-top:var(--s-2)">${esc(REQUEST_STEPS[step - 1])}</h2>
        <div data-step-body>${stepBody(isEvent, o)}</div>
        <div class="step-nav">
          <button class="btn btn--quiet" type="button" data-back ${step === 1 ? 'disabled' : ''}>Back</button>
          <button class="btn btn--primary" type="button" data-next>
            ${step === 5 ? 'Submit request for review' : 'Continue'}</button>
        </div>
      </div>
    </section>
    <p class="disclaimer">Submitting does not reserve anything and deducts no stock. The Department of
      Logistics reviews the request first; reservation and release are recorded separately.</p>
    <div data-receipt></div>
  </main>`;
}

function stepBody(isEvent, o) {
  if (step === 1) return `<p style="color:var(--text-secondary);font-size:14px;margin-top:var(--s-2)">
      This choice decides which context fields appear at step 3.</p>
    <div class="choice-row" style="margin-top:var(--s-4)">
      ${o.purposes.map(p => `<label class="choice">
        <input type="radio" name="requestPurpose" value="${esc(p.value)}" ${req.purpose === p.value ? 'checked' : ''}>
        <span><strong>${esc(p.label)}</strong><small>${esc(p.hint)}</small></span></label>`).join('')}
    </div>`;

  if (step === 2) return `<div class="form-grid">
      <div class="field"><label for="r-name">Requester name *</label><input id="r-name" placeholder="Given name and surname"></div>
      <div class="field"><label for="r-type">Requester type *</label>
        <select id="r-type">${o.requesterTypes.map(t => `<option>${esc(t)}</option>`).join('')}</select></div>
      <div class="field"><label for="r-org">Organization, department or office *</label>
        <select id="r-org">${o.organizations.map(t => `<option>${esc(t)}</option>`).join('')}</select></div>
      <div class="field"><label for="r-tel">Contact number *</label><input id="r-tel" placeholder="Mobile or landline"></div>
      <div class="field span-2"><label for="r-mail">Email address *</label>
        <input id="r-mail" type="email" placeholder="name@example.edu.ph">
        <p class="help">Used to send the tracking reference. It is not shown in public tracking.</p></div>
    </div>`;

  if (step === 3) return isEvent
    ? `<p style="color:var(--text-secondary);font-size:14px;margin-top:var(--s-2)">
         These fields appear because the purpose is <strong>Event or activity support</strong>.</p>
       <div class="form-grid">
        <div class="field"><label for="e-series">Event series *</label>
          <select id="e-series">${o.eventSeries.map(s => `<option>${esc(s.name)}</option>`).join('')}</select></div>
        <div class="field"><label for="e-sub">Sub-event *</label>
          <select id="e-sub">${o.eventSeries[0].events.map(e => `<option>${esc(e.name)}</option>`).join('')}</select>
          <p class="help">Sub-events load from the selected series.</p></div>
        <div class="field"><label for="e-loc">Location *</label><input id="e-loc" placeholder="e.g. Plenary Hall"></div>
        <div class="field"><label for="e-purpose">Event purpose *</label><input id="e-purpose" placeholder="Why the items are needed"></div>
        <div class="field"><label for="e-from">Needed from *</label><input id="e-from" type="date"></div>
        <div class="field"><label for="e-to">Needed until *</label><input id="e-to" type="date"></div>
        <div class="field span-2"><div class="lbl-row"><label for="e-rel" class="lbl">Related or original request</label>
          <span class="badge">Optional</span></div>
          <input id="e-rel" placeholder="Reference an earlier request">
          <p class="help">Used when this request continues or corrects an earlier one.</p></div>
       </div>`
    : `<p style="color:var(--text-secondary);font-size:14px;margin-top:var(--s-2)">
         These fields appear because the purpose is <strong>Office inventory or pantry</strong>.
         The event fields are not collected for this branch.</p>
       <div class="form-grid">
        <div class="field"><label for="p-area">Inventory or pantry area *</label>
          <select id="p-area">${o.stockAreas.map(s => `<option>${esc(s)}</option>`).join('')}</select></div>
        <div class="field"><label for="p-date">Needed date *</label><input id="p-date" type="date"></div>
        <div class="field span-2"><label for="p-purpose">Purpose or justification *</label>
          <textarea id="p-purpose" placeholder="Why the office or pantry needs these items."></textarea></div>
        <div class="field span-2"><div class="lbl-row"><label for="p-rel" class="lbl">Related or original request</label>
          <span class="badge">Optional</span></div><input id="p-rel" placeholder="Reference an earlier request"></div>
       </div>`;

  if (step === 4) return `<p style="color:var(--text-secondary);font-size:14px;margin-top:var(--s-2)">
      Each line carries a category, an approved selection, a quantity with its unit, and an optional specification.</p>
    <div style="margin-top:var(--s-4)">
      ${req.lines.map((l, i) => `<div class="line">
        <span class="who"><strong>${esc(l.item)}</strong>
          <small>${esc(l.category)} · ${esc(l.quantity)} ${esc(l.unit)} · ${esc(l.spec)}</small></span>
        <button class="btn btn--quiet btn--mini" type="button" data-rm-line="${i}">Remove</button></div>`).join('')}
    </div>
    <button class="btn btn--quiet btn--mini" type="button" data-add-line style="margin-top:var(--s-4)">+ Add line</button>`;

  /* step 5 — review with per-step Edit, then the four acknowledgments */
  const ctx = req.purpose === 'EVENT_ACTIVITY_SUPPORT'
    ? 'General Assembly 2026–2027 · Day 2 — committee sessions · Plenary Hall'
    : 'Council pantry · needed 12 Sep 2026';
  const rows = [
    [1, 'Request purpose', REQUEST_OPTIONS.purposes.find(p => p.value === req.purpose).label],
    [2, 'Requester', 'Maria Santos · USC Officer · Committee on Activities'],
    [3, 'Context', ctx],
    [4, 'Request lines', `${req.lines.length} line${req.lines.length === 1 ? '' : 's'}`],
  ];
  return `${rows.map(([n, t, v]) => `<div class="summary-row">
      <span class="val"><span class="lbl">Step ${n} · ${esc(t)}</span><strong>${esc(v)}</strong></span>
      <button class="btn btn--quiet btn--mini" type="button" data-edit="${n}">Edit</button></div>`).join('')}
    <h3 style="font-size:17px;margin-top:var(--s-6)">Required acknowledgments</h3>
    ${REQUEST_ACKS.map(a => `<label class="ack"><input type="checkbox" name="${esc(a.name)}" required>
      <span><strong>${esc(a.title)}</strong><small>${esc(a.body)}</small></span></label>`).join('')}`;
}

function bindRequest() {
  const rerender = () => { render(); };
  app.querySelectorAll('[name="requestPurpose"]').forEach(r => r.addEventListener('change', () => {
    req.purpose = r.value;
    say(`${REQUEST_OPTIONS.purposes.find(p => p.value === r.value).label} selected. Step 3 fields will change.`);
  }));
  app.querySelector('[data-back]')?.addEventListener('click', () => { if (step > 1) { step--; rerender(); } });
  app.querySelector('[data-next]')?.addEventListener('click', () => {
    if (step < 5) { step++; say(`Step ${step} of 5. ${REQUEST_STEPS[step - 1]}.`); rerender(); return; }
    const boxes = [...app.querySelectorAll('.ack input')];
    if (boxes.some(b => !b.checked)) { say('All acknowledgments are required before submitting.', true); return; }
    app.querySelector('[data-receipt]').innerHTML = `
      <section class="panel receipt" role="status" style="margin-top:var(--s-6)">
        <span class="status status--done">Request submitted</span>
        <h2 style="font-size:30px;margin-top:var(--s-3)">Save your private tracking details</h2>
        <div class="codes">
          <div><span class="lbl">Request ID</span><code>REQ-2026-0142</code></div>
          <div><span class="lbl">Private tracking code</span><code>PROTOTYPE-CODE-NOT-REAL</code></div>
        </div>
        <p class="warnbox">This code is shown once. Store it securely; it cannot be recovered from this browser.</p>
        <p style="margin-top:var(--s-4)"><span class="lbl">Initial status</span>
          <span class="status status--info" style="margin-left:var(--s-3)">For Review</span></p>
        ${protoNote('No request was created. No service confirmed this. The identifier and code above are fixtures.')}
      </section>`;
    say('Request submitted. Record REQ-2026-0142. Initial status For Review.');
    app.querySelector('[data-receipt]').scrollIntoView({ block: 'center' });
  });
  app.querySelectorAll('[data-edit]').forEach(b =>
    b.addEventListener('click', () => { step = Number(b.dataset.edit); rerender(); }));
  app.querySelectorAll('[data-rm-line]').forEach(b =>
    b.addEventListener('click', () => { req.lines.splice(Number(b.dataset.rmLine), 1); rerender(); }));
  app.querySelector('[data-add-line]')?.addEventListener('click', () => {
    req.lines.push({ category: 'Supplies', item: 'New line', quantity: 1, unit: 'piece', spec: '—' });
    say(`${req.lines.length} lines.`); rerender();
  });
}

/* ================= ROUTER ================= */

function render() {
  const route = q('route', 'lending');
  const theme = q('theme', 'light');
  document.documentElement.setAttribute('data-theme', theme);
  document.querySelector('.g0').setAttribute('data-module', route === 'request' ? 'request' : 'lending');

  if (route === 'request') { app.innerHTML = requestView(); bindRequest(); }
  else { app.innerHTML = lendingView(); bindLending(); }

  document.title = `HAU-USC · ${route} · ${theme} · R3 prototype`;
}

/* prototype control bar */
document.getElementById('proto-route').addEventListener('change', (e) => setParam('route', e.target.value));
document.getElementById('proto-theme').addEventListener('change', (e) => setParam('theme', e.target.value));
document.getElementById('proto-state').addEventListener('change', (e) => {
  catalogState = e.target.value;
  if (q('route', 'lending') !== 'request') render();
});
function setParam(k, v) {
  const p = params(); p.set(k, v);
  history.replaceState(null, '', `?${p}`); render();
  document.getElementById('proto-route').value = q('route', 'lending');
  document.getElementById('proto-theme').value = q('theme', 'light');
}
document.getElementById('proto-route').value = q('route', 'lending');
document.getElementById('proto-theme').value = q('theme', 'light');

render();
