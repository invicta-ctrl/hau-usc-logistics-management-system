/* Preview application: shell, routing, state switching, and overlay behaviour.
   All interaction is local. No network request is made from this preview. */

import { icon, spriteMarkup } from './icons.js';
import { esc, chip, themeToggle } from './components.js';
import { GROUPS, NAV, NAV_ADMIN, SURFACES, TABS, byId } from './registry.js';
import { setPublicTheme } from './surfaces/public.js';
import { ROLE_VIEWS, SCOPES, WORKSPACES, NOTIFICATIONS } from './data/mock.js';

const root = document.getElementById('app');

/* Theme persistence. A file:// preview can have an opaque origin, so every
   storage access is guarded and persistence degrades to session-only. */
const THEME_KEY = 'hau-usc-v2-theme';
const store = {
  get(key) {
    try {
      return window.localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key, value) {
    try {
      window.localStorage.setItem(key, value);
    } catch {
      /* persistence is optional in an opaque-origin preview */
    }
  },
};

/* Stored preference wins. System preference is only the first-run default. */
function initialTheme() {
  const stored = store.get(THEME_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

const state = {
  surface: 'index',
  variant: 'populated',
  theme: initialTheme(),
  viewport: 'desktop',
  role: 'ADMINISTRATOR',
  workspace: 'administrator',
  scope: 'ALL',
  rail: 'expanded',
  drawer: 'closed',
  overlay: null, // 'menu' | 'command' | 'notifications' | 'confirm' | 'detail'
};

/* ---------------- Focus management ---------------- */

/* render() replaces innerHTML, so a stored element reference is detached by the
   time an overlay closes. Store a way to *find* the trigger again instead. */
let lastFocusedSelector = null;
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function trapFocus(container) {
  const nodes = [...container.querySelectorAll(FOCUSABLE)].filter(
    (n) => n.offsetParent !== null || n === document.activeElement,
  );
  if (!nodes.length) return;
  const first = nodes[0];
  const last = nodes[nodes.length - 1];
  container.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  });
  first.focus();
}

/* Move focus to the new surface without scrolling its own header out of view:
   a plain .focus() on the main region scrolls it to the top of the viewport
   and hides the sticky workspace topbar. */
function focusMain() {
  const main = document.getElementById('surface-main');
  if (!main) return;
  main.focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: 'auto' });
}

function describeFocus(el) {
  if (!el || el === document.body) return null;
  if (el.id) return `#${CSS.escape(el.id)}`;
  const act = el.dataset?.act;
  if (!act) return null;
  const ref = el.dataset.ref ? `[data-ref="${CSS.escape(el.dataset.ref)}"]` : '';
  const id = el.dataset.id ? `[data-id="${CSS.escape(el.dataset.id)}"]` : '';
  return `[data-act="${CSS.escape(act)}"]${ref}${id}`;
}

function openOverlay(name) {
  lastFocusedSelector = describeFocus(document.activeElement);
  state.overlay = name;
  render();
  const node = document.querySelector('[data-overlay-root]');
  if (node) trapFocus(node);
}

function closeOverlay() {
  state.overlay = null;
  const selector = lastFocusedSelector;
  lastFocusedSelector = null;
  render();
  const target = selector ? document.querySelector(selector) : null;
  // Fall back to the main region so focus is never dropped on the body.
  (target ?? document.getElementById('surface-main'))?.focus();
}

/* ---------------- Theme ----------------
   Sun in light, moon in dark. Both glyphs are always in the DOM; CSS rotates
   and crossfades between them so the press transforms the icon rather than
   swapping it. The accessible name describes the ACTION; aria-pressed reports
   whether dark is active, so the state stays truthful. */

/* Colour-only transition, applied for one frame budget so the theme change
   reads as deliberate rather than as a flash. Layout never animates. */
let themeAnimTimer;
function setTheme(next) {
  state.theme = next;
  store.set(THEME_KEY, next);
  document.body.classList.add('theme-anim');
  render();
  clearTimeout(themeAnimTimer);
  themeAnimTimer = setTimeout(() => document.body.classList.remove('theme-anim'), 400);
}

/* ---------------- Toast ---------------- */

let toastTimer;
function toast(message) {
  const region = document.getElementById('toast-region');
  if (!region) return;
  region.innerHTML = `<div class="toast">${icon('check')}<span>${esc(message)}</span></div>`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    region.innerHTML = '';
  }, 3600);
}

/* ---------------- Preview chrome ---------------- */

function previewBar() {
  const surface = byId(state.surface);
  const variants = surface?.states ?? ['populated'];
  return `<div class="preview-bar">
    <div class="preview-bar__brand">
      ${icon('box', 'icon--sm')}
      <span>HAU-USC Logistics · Redesign preview</span>
      <span class="preview-bar__tag">Not production</span>
    </div>

    <label class="visually-hidden" for="surface-picker">Surface</label>
    <select class="preview-select" id="surface-picker" data-act="pick-surface">
      <option value="index"${state.surface === 'index' ? ' selected' : ''}>— Surface index —</option>
      ${GROUPS.map(
        (g) => `<optgroup label="${esc(g)}">${SURFACES.filter((s) => s.group === g)
          .map(
            (s) =>
              `<option value="${s.id}"${s.id === state.surface ? ' selected' : ''}>${esc(s.name)}</option>`,
          )
          .join('')}</optgroup>`,
      ).join('')}
    </select>

    ${
      variants.length > 1
        ? `<label class="visually-hidden" for="state-picker">State</label>
      <select class="preview-select" id="state-picker" data-act="pick-state">
        ${variants
          .map(
            (v) =>
              `<option value="${v}"${v === state.variant ? ' selected' : ''}>${esc(
                v[0].toUpperCase() + v.slice(1),
              )}</option>`,
          )
          .join('')}
      </select>`
        : ''
    }

    <div class="preview-group" role="group" aria-label="Preview width">
      ${['desktop', 'tablet', 'mobile']
        .map(
          (v) =>
            `<button type="button" data-act="viewport" data-v="${v}" aria-pressed="${
              state.viewport === v
            }">${v[0].toUpperCase() + v.slice(1)}</button>`,
        )
        .join('')}
    </div>

    <div class="preview-group" role="group" aria-label="Theme">
      ${['light', 'dark']
        .map(
          (t) =>
            `<button type="button" data-act="theme" data-v="${t}" aria-pressed="${
              state.theme === t
            }">${t[0].toUpperCase() + t.slice(1)}</button>`,
        )
        .join('')}
    </div>

    <a class="btn btn--sm" href="#/index">${icon('home', 'icon--sm')}Index</a>
  </div>`;
}

/* ---------------- Surface index ---------------- */

function indexPage() {
  return `<div class="index-wrap">
    <h1>Whole-site redesign preview</h1>
    <p>Institutional Operations Editorial — the proposed v0.8.0 design baseline for the
    HAU-USC Logistics Management System. Every surface below is a local preview.
    Nothing here contacts a live service, and all figures are illustrative.</p>
    <p style="margin-top:12px"><span class="illustrative">${icon(
      'info',
      'icon--sm icon--muted',
    )}Use the width and theme controls above. Press <kbd>/</kbd> or <kbd>Ctrl</kbd>+<kbd>K</kbd> inside a workspace to open search.</span></p>
    ${GROUPS.map(
      (g) => `<section class="index-group">
      <h2>${esc(g)}</h2>
      <div class="index-list">
        ${SURFACES.filter((s) => s.group === g)
          .map(
            (s) => `<a class="index-item" href="#/${s.id}">
            <span><b>${esc(s.name)}</b><span>${s.states.length} state${
              s.states.length > 1 ? 's' : ''
            }</span></span>
            <span class="index-tier" data-tier="${s.tier}">${s.tier}</span>
          </a>`,
          )
          .join('')}
      </div>
    </section>`,
    ).join('')}
  </div>`;
}

/* ---------------- Internal shell ---------------- */

function rail() {
  const navItem = (n) =>
    `<button class="nav-item" type="button" data-act="go" data-id="${n.id}"${
      n.id === state.surface ? ' aria-current="page"' : ''
    }>
      <span class="nav-item__icon">${icon(n.icon)}</span>
      <span class="nav-item__text">${esc(n.label)}</span>
    </button>`;

  const ws = WORKSPACES.find((w) => w.id === state.workspace);
  const sc = SCOPES.find((s) => s.id === state.scope);

  return `<aside class="rail" aria-label="Primary">
    <div class="rail__brand">
      <div class="rail__marks"><span class="rail__mark">HAU</span><span class="rail__mark">USC</span></div>
      <span class="rail__kicker">Department of Logistics</span>
      <span class="rail__name">HAU-USC Logistics</span>
    </div>
    <div class="rail__scroll">
      <nav class="rail__section" aria-label="Operations">
        <span class="label">Operations</span>
        ${NAV.map(navItem).join('')}
      </nav>
      <nav class="rail__section" aria-label="Administration">
        <span class="label">Administration</span>
        ${NAV_ADMIN.map(navItem).join('')}
      </nav>
    </div>
    <div class="rail__foot">
      <button class="scope-button" type="button" data-act="cycle-workspace">
        <span class="avatar">${esc((ws?.name ?? 'A')[0])}</span>
        <span class="scope-button__text"><b>${esc(ws?.name ?? '')}</b><span>${esc(ws?.sub ?? '')}</span></span>
        ${icon('chevron', 'icon--sm')}
      </button>
      <button class="scope-button" type="button" data-act="cycle-scope">
        <span class="avatar">${icon('filter', 'icon--sm')}</span>
        <span class="scope-button__text"><b>${esc(sc?.name ?? '')}</b><span>${esc(sc?.sub ?? '')}</span></span>
        ${icon('chevron', 'icon--sm')}
      </button>
    </div>
  </aside>
  <button class="rail__scrim" type="button" data-act="close-drawer" aria-label="Close navigation"></button>`;
}

function topbar() {
  const role = ROLE_VIEWS.find((r) => r.id === state.role);
  return `<header class="topbar">
    <button class="icon-button" type="button" data-act="toggle-rail"
      aria-label="${state.drawer === 'open' ? 'Close navigation' : 'Toggle navigation'}">
      ${icon('menu')}
    </button>
    <label class="search" for="q">
      <span class="visually-hidden">Search requests, loans, items and events</span>
      ${icon('search', 'icon--sm icon--muted')}
      <input id="q" type="search" placeholder="Search requests, loans, items…" autocomplete="off"
        data-act="open-command" readonly />
      <kbd>Ctrl K</kbd>
    </label>
    <div class="topbar__actions">
      ${themeToggle(state.theme === 'dark')}
      <button class="icon-button notif" type="button" data-act="open-notifications"
        aria-label="Notifications, 3 unread">
        ${icon('bell')}<span class="notif__count" aria-hidden="true">3</span>
      </button>
      <button class="account-button" type="button" data-act="open-menu"
        aria-haspopup="true" aria-expanded="${state.overlay === 'menu'}" aria-controls="account-menu">
        <span class="avatar">LO</span>
        <span class="account-button__text"><b>Logistics Office</b><span>${esc(role?.name ?? '')}</span></span>
        ${icon('chevron', 'icon--sm')}
      </button>
    </div>
  </header>`;
}

function tabbar() {
  return `<nav class="tabbar" aria-label="Sections">
    ${TABS.map(
      (t) =>
        `<button type="button" data-act="go" data-id="${t.id}"${
          t.id === state.surface ? ' aria-current="page"' : ''
        }>${icon(t.icon, 'icon--sm')}<span>${esc(t.label)}</span></button>`,
    ).join('')}
  </nav>`;
}

function overlays() {
  if (state.overlay === 'menu') {
    return `<div class="menu" id="account-menu" data-overlay-root role="menu" aria-label="Account">
      <button type="button" role="menuitem" data-act="go" data-id="account.profile">My profile</button>
      <button type="button" role="menuitem" data-act="cycle-role">Switch role view</button>
      <button type="button" role="menuitem" data-act="close-overlay">Session details</button>
      <button type="button" role="menuitem" data-act="close-overlay">Sign out</button>
    </div>`;
  }

  if (state.overlay === 'notifications') {
    return `<div class="menu" id="account-menu" data-overlay-root role="dialog"
      aria-label="Notifications" style="width:320px">
      ${NOTIFICATIONS.map(
        (n) => `<div style="display:grid;gap:2px;padding:10px;border-radius:6px">
        <b style="font-size:var(--t-sm)">${esc(n.title)}</b>
        <span class="muted" style="font-size:var(--t-xs)">${esc(n.body)}</span></div>`,
      ).join('')}
      <button type="button" data-act="close-overlay" style="border-top:1px solid var(--line);margin-top:4px">Close</button>
    </div>`;
  }

  if (state.overlay === 'command') {
    const matches = SURFACES.slice(0, 8);
    return `<div class="dialog" data-overlay-root role="dialog" aria-modal="true" aria-label="Search">
      <button class="drawer-scrim" type="button" data-act="close-overlay" aria-label="Close search"></button>
      <div class="dialog__panel" style="width:min(560px,100%)">
        <div style="padding:12px 14px;border-bottom:1px solid var(--line);display:flex;gap:10px;align-items:center">
          ${icon('search', 'icon--sm icon--muted')}
          <input type="search" placeholder="Search surfaces, requests, items…"
            style="flex:1;border:0;outline:0;background:none;font-size:var(--t-md)" aria-label="Search" />
        </div>
        <div style="max-height:320px;overflow:auto;padding:6px">
          ${matches
            .map(
              (m) =>
                `<button type="button" data-act="go" data-id="${m.id}"
              style="display:grid;width:100%;gap:1px;padding:9px 10px;border-radius:6px;text-align:left">
              <b style="font-size:var(--t-sm)">${esc(m.name)}</b>
              <span class="muted" style="font-size:var(--t-xs)">${esc(m.group)}</span></button>`,
            )
            .join('')}
        </div>
      </div>
    </div>`;
  }

  if (state.overlay === 'confirm') {
    return `<div class="dialog" data-overlay-root role="dialog" aria-modal="true"
      aria-labelledby="cd-t" aria-describedby="cd-b">
      <button class="drawer-scrim" type="button" data-act="close-overlay" aria-label="Cancel"></button>
      <div class="dialog__panel">
        <div class="dialog__body">
          <h3 id="cd-t">Accept this request and reserve stock?</h3>
          <p id="cd-b" class="muted" style="font-size:var(--t-sm)">
            Accepting reserves 6 lines against authoritative stock. Reserving is not a release —
            nothing physically leaves the office until you record a handoff at the Release Desk.</p>
        </div>
        <div class="dialog__foot">
          <button class="btn btn--quiet" type="button" data-act="close-overlay">Cancel</button>
          <button class="btn btn--primary" type="button" data-act="confirm-done">Accept and reserve</button>
        </div>
      </div>
    </div>`;
  }

  if (state.overlay === 'detail') {
    return `<div data-overlay-root>
      <button class="drawer-scrim" type="button" data-act="close-overlay" aria-label="Close detail"></button>
      <aside class="drawer" role="dialog" aria-modal="true" aria-label="Request detail">
        <div class="detail__head">
          <div class="detail__title"><h2>Sound system and stage materials</h2>
            <button class="icon-button" type="button" data-act="close-overlay" aria-label="Close">${icon('close')}</button></div>
          <p class="muted" style="font-size:var(--t-xs)">REQ-000318 · USC Executive Board</p>
          <div>${chip('FOR_REVIEW')}</div>
        </div>
        <div class="detail__body">
          <p style="font-size:var(--t-sm)">Six lines need one routing decision each. Two are still
          pending a decision, so this request cannot be accepted yet.</p>
        </div>
        <div class="detail__foot">
          <button class="btn btn--primary" type="button" data-act="confirm-accept">Accept and reserve</button>
          <button class="btn btn--quiet" type="button" data-act="close-overlay">Close</button>
        </div>
      </aside>
    </div>`;
  }

  return '';
}

/* ---------------- Render ---------------- */

function render() {
  const surface = byId(state.surface);
  document.documentElement.setAttribute('data-theme', state.theme);
  document.body.setAttribute('data-theme', state.theme);

  let body;
  if (state.surface === 'index') {
    body = `<div class="frame" data-viewport="${state.viewport}">${indexPage()}</div>`;
  } else if (surface.kind === 'public') {
    setPublicTheme(state.theme === 'dark');
    body = `<div class="frame" data-viewport="${state.viewport}">${surface.render({
      state: state.variant,
    })}</div>`;
  } else {
    body = `<div class="frame" data-viewport="${state.viewport}">
      <div class="shell" data-rail="${state.rail}" data-drawer="${state.drawer}">
        ${rail()}
        <section class="workspace">
          ${topbar()}
          <main class="main" id="surface-main" tabindex="-1">
            <div class="main__inner stage" key="${esc(state.surface)}-${esc(state.variant)}">
              ${surface.render({ state: state.variant })}
            </div>
          </main>
        </section>
        ${tabbar()}
        ${overlays()}
      </div>
    </div>`;
  }

  root.innerHTML = `${previewBar()}${body}
    <div class="toast-region" id="toast-region" role="status" aria-live="polite"></div>`;

  syncPreviewBarHeight();
}

/* The preview bar is preview chrome, not product chrome, but it still occupies
   space above the shell. Publish its height so the sticky rail and topbar sit
   under it instead of overflowing the viewport. */
let barObserver;
function syncPreviewBarHeight() {
  const bar = root.querySelector('.preview-bar');
  if (!bar) return;
  const apply = () =>
    document.documentElement.style.setProperty('--preview-bar-h', `${bar.offsetHeight}px`);
  apply();
  barObserver?.disconnect();
  barObserver = new ResizeObserver(apply);
  barObserver.observe(bar);
}

/* ---------------- Events ---------------- */

function go(id) {
  if (!byId(id) && id !== 'index') return;
  state.surface = id;
  const s = byId(id);
  state.variant = s?.states?.[0] ?? 'populated';
  state.overlay = null;
  state.drawer = 'closed';
  location.hash = `#/${id}`;
  render();
  focusMain();
}

document.addEventListener('click', (event) => {
  const el = event.target.closest('[data-act]');
  if (!el) {
    if (state.overlay === 'menu' || state.overlay === 'notifications') closeOverlay();
    return;
  }
  const act = el.dataset.act;

  if (act === 'go') return go(el.dataset.id);
  if (act.startsWith('go:')) return go(act.slice(3));
  if (act === 'viewport') {
    state.viewport = el.dataset.v;
    return render();
  }
  if (act === 'theme') return setTheme(el.dataset.v);
  if (act === 'toggle-theme') return setTheme(state.theme === 'dark' ? 'light' : 'dark');
  if (act === 'toggle-rail') {
    state.drawer = state.drawer === 'open' ? 'closed' : 'open';
    state.rail = state.rail === 'expanded' ? 'collapsed' : 'expanded';
    return render();
  }
  if (act === 'close-drawer') {
    state.drawer = 'closed';
    return render();
  }
  if (act === 'open-menu') return openOverlay('menu');
  if (act === 'open-notifications') return openOverlay('notifications');
  if (act === 'open-command') return openOverlay('command');
  if (act === 'close-overlay') return closeOverlay();
  if (act === 'confirm-accept') return openOverlay('confirm');
  if (act === 'confirm-return') {
    toast('Return recorded. Stock restored to inventory.');
    return;
  }
  if (act === 'confirm-release') {
    state.variant = 'success';
    render();
    toast('Partial release recorded and confirmed by the recipient.');
    return;
  }
  if (act === 'confirm-done') {
    closeOverlay();
    toast('Request accepted. Six lines reserved — nothing has been released.');
    return;
  }
  if (act === 'select:request' || act === 'select:release') {
    const narrow = root.querySelector('.frame').clientWidth < 1181;
    if (narrow) return openOverlay('detail');
    toast('Detail shown beside the queue.');
    return;
  }
  if (act === 'cycle-workspace') {
    const i = WORKSPACES.findIndex((w) => w.id === state.workspace);
    state.workspace = WORKSPACES[(i + 1) % WORKSPACES.length].id;
    render();
    toast(`Workspace: ${WORKSPACES.find((w) => w.id === state.workspace).name}`);
    return;
  }
  if (act === 'cycle-scope') {
    const i = SCOPES.findIndex((s) => s.id === state.scope);
    state.scope = SCOPES[(i + 1) % SCOPES.length].id;
    render();
    toast(`Scope: ${SCOPES.find((s) => s.id === state.scope).name}`);
    return;
  }
  if (act === 'cycle-role') {
    const i = ROLE_VIEWS.findIndex((r) => r.id === state.role);
    state.role = ROLE_VIEWS[(i + 1) % ROLE_VIEWS.length].id;
    closeOverlay();
    toast(`Viewing as ${ROLE_VIEWS.find((r) => r.id === state.role).name}`);
    return;
  }
  if (act === 'refresh') {
    toast('Refreshed.');
    return;
  }
  if (act === 'filter') {
    toast('Filters are illustrative in this preview.');
  }
});

document.addEventListener('change', (event) => {
  const el = event.target.closest('[data-act]');
  if (!el) return;
  if (el.dataset.act === 'pick-surface') return go(el.value);
  if (el.dataset.act === 'pick-state') {
    state.variant = el.value;
    render();
    focusMain();
  }
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    if (state.overlay) return closeOverlay();
    if (state.drawer === 'open') {
      state.drawer = 'closed';
      render();
    }
    return;
  }
  const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName);
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    if (state.surface !== 'index' && byId(state.surface)?.kind === 'internal') openOverlay('command');
    return;
  }
  if (event.key === '/' && !typing) {
    event.preventDefault();
    if (state.surface !== 'index' && byId(state.surface)?.kind === 'internal') openOverlay('command');
  }
});

window.addEventListener('hashchange', () => {
  const id = location.hash.replace(/^#\/?/, '') || 'index';
  if (id !== state.surface) go(id);
});

/* ---------------- Boot ---------------- */

document.body.insertAdjacentHTML('afterbegin', spriteMarkup());
const initial = location.hash.replace(/^#\/?/, '') || 'index';
state.surface = byId(initial) ? initial : 'index';
state.variant = byId(state.surface)?.states?.[0] ?? 'populated';
render();
