/* V5 application shell, routing, state switching, and overlay behaviour. */

import { icon, spriteMarkup } from './icons.js';
import { esc, themeToggle } from './components.js';
import { GROUPS, NAV, NAV_ADMIN, SURFACES, TABS, byId } from './registry.js';
import { setPublicTheme } from './surfaces/public.js';
import { requestDetailParts } from './surfaces/operations.js';
import { ROLE_VIEWS, WORKSPACES, NOTIFICATIONS } from './data/mock.js';

const root = document.getElementById('app');
const PLAYGROUND_UI_ALLOWED = import.meta.env.MODE !== 'production';

/* Theme persistence. A file:// preview can have an opaque origin, so every
   storage access is guarded and persistence degrades to session-only. */
const THEME_KEY = 'hau-usc-v4-theme';
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
  surface: 'public.landing',
  variant: 'populated',
  theme: initialTheme(),
  viewport: 'desktop',
  playgroundVerified: false,
  authorizedRoutes: [],
  accountName: 'Authorized user',
  role: 'ADMINISTRATOR',
  workspace: 'administrator',
  rail: 'expanded',
  drawer: 'closed',
  commandQuery: '',
  commandIndex: 0,
  requestDraft: [],
  requestMode: 'create',
  requestType: 'NEW',
  requestSeries: '',
  overlay: null, // 'menu' | 'command' | 'notifications' | 'confirm' | 'detail' | 'role'
};

const reducedMotion = () =>
  window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

let renderReason = 'boot';

function captureFormSnapshot() {
  const controls = [...document.querySelectorAll('#surface-main input, #surface-main select, #surface-main textarea')];
  const focusedIndex = controls.indexOf(document.activeElement);
  return {
    focusedIndex,
    controls: controls.map((control) => ({
      value: control instanceof HTMLInputElement && control.type === 'file' ? '' : control.value,
      file: control instanceof HTMLInputElement && control.type === 'file',
      checked: 'checked' in control ? control.checked : null,
      selectedIndex: control instanceof HTMLSelectElement ? control.selectedIndex : null,
    })),
  };
}

function restoreFormSnapshot(snapshot) {
  if (!snapshot) return;
  const controls = [...document.querySelectorAll('#surface-main input, #surface-main select, #surface-main textarea')];
  controls.forEach((control, index) => {
    const saved = snapshot.controls[index];
    if (!saved) return;
    if (saved.file) {
      return;
    } else if (saved.selectedIndex !== null && control instanceof HTMLSelectElement) {
      control.selectedIndex = saved.selectedIndex;
    } else {
      control.value = saved.value;
    }
    if (saved.checked !== null && 'checked' in control) control.checked = saved.checked;
  });
  if (snapshot.focusedIndex >= 0) {
    controls[snapshot.focusedIndex]?.focus({ preventScroll: true });
  }
}

/* Every state-changing action goes through one coordinator. Same-document
   View Transitions preserve route context when supported; the synchronous
   commit remains the complete fallback for file previews and older browsers. */
function updateView(kind, mutate, afterRender) {
  const preserveForm = !['route', 'state'].includes(kind);
  const formSnapshot = preserveForm ? captureFormSnapshot() : null;
  const commit = () => {
    mutate?.();
    renderReason = kind;
    render();
    renderReason = 'idle';
    restoreFormSnapshot(formSnapshot);
    afterRender?.();
  };

  document.documentElement.dataset.transition = kind;
  if (reducedMotion()) {
    commit();
    delete document.documentElement.dataset.transition;
    return null;
  }

  if (!document.startViewTransition) {
    const fallbackKind = ['route', 'state'].includes(kind) ? kind : null;
    if (fallbackKind) document.documentElement.dataset.fallbackTransition = fallbackKind;
    commit();
    delete document.documentElement.dataset.transition;

    if (fallbackKind) {
      const clearFallback = () => {
        if (document.documentElement.dataset.fallbackTransition === fallbackKind) {
          delete document.documentElement.dataset.fallbackTransition;
        }
      };
      requestAnimationFrame(() => {
        window.setTimeout(clearFallback, 460);
      });
    }
    return null;
  }

  const transition = document.startViewTransition(commit);
  transition.ready.catch(() => {});
  transition.updateCallbackDone.catch(() => {});
  transition.finished
    .catch(() => {})
    .finally(() => {
      if (document.documentElement.dataset.transition === kind) {
        delete document.documentElement.dataset.transition;
      }
    });
  return transition;
}

/* ---------------- Focus management ---------------- */

/* render() replaces innerHTML, so a stored element reference is detached by the
   time an overlay closes. Store a way to *find* the trigger again instead. */
let lastFocusedSelector = null;
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

function trapFocus(container, preferred = null) {
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
  const preferredNode = preferred ? container.querySelector(preferred) : null;
  (preferredNode ?? first).focus();
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
  updateView(
    'overlay',
    () => {
      state.overlay = name;
      if (name === 'command') {
        state.commandQuery = '';
        state.commandIndex = 0;
      }
    },
    () => {
      const node = document.querySelector('[data-overlay-root]');
      const preferred = {
        command: '#command-input',
        menu: '[role="menuitem"]',
        notifications: '[data-act="close-overlay"]',
        confirm: '[data-act="confirm-done"]',
        detail: '[data-act="confirm-accept"]',
      }[name];
      if (node) trapFocus(node, preferred ?? null);
    },
  );
}

function closeOverlay() {
  const selector = lastFocusedSelector;
  lastFocusedSelector = null;
  updateView(
    'overlay',
    () => {
      state.overlay = null;
    },
    () => {
      const target = selector ? document.querySelector(selector) : null;
      // Fall back to the main region so focus is never dropped on the body.
      (target ?? document.getElementById('surface-main'))?.focus();
    },
  );
}

/* ---------------- Theme ----------------
   The theme is updated in place so the celestial plate remains the same DOM
   element while it travels. Rebuilding #app here would turn the requested
   motion into a crossfade and would also discard focus and form state. */

/* Colour-only transition, applied for one frame budget so the theme change
   reads as deliberate rather than as a flash. Layout never animates. */
let themeAnimTimer;
function setTheme(next) {
  const dark = next === 'dark';
  const commit = () => {
    state.theme = next;
    store.set(THEME_KEY, next);
    /* The token layer is authored as `[data-theme="dark"]` with no light
       counterpart, so light is only the `:root` default. Updating the body
       alone leaves a stale `dark` on the root element, the dark tokens keep
       inheriting, and dark → light does nothing until the next full render.
       Both nodes carry the attribute in render(); both must carry it here. */
    document.documentElement.dataset.theme = next;
    document.body.dataset.theme = next;
    document.querySelectorAll('[data-act="toggle-theme"]').forEach((button) => {
      button.setAttribute('aria-pressed', String(dark));
      button.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
    });
    document.querySelectorAll('[data-act="theme"]').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.v === next));
    });
  };

  document.body.classList.add('theme-anim');
  /* A document View Transition snapshots the control and prevents its live
     thumb from travelling. Commit directly so the same DOM node animates;
     the scoped colour transitions above still crossfade the surrounding UI. */
  commit();

  clearTimeout(themeAnimTimer);
  themeAnimTimer = setTimeout(() => document.body.classList.remove('theme-anim'), 400);
}

/* ---------------- Toast ---------------- */

let toastTimer;
function toast(message, tone = 'info') {
  const region = document.getElementById('toast-region');
  if (!region) return;
  const error = tone === 'error';
  region.innerHTML = `<div class="toast" data-tone="${error ? 'error' : 'info'}"${
    error ? ' role="alert"' : ''
  }>${icon(error ? 'alert' : 'info')}<span>${esc(message)}</span></div>`;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => {
    region.innerHTML = '';
  }, 3600);
}

/* ---------------- Playground chrome ---------------- */

function playgroundBar() {
  if (!PLAYGROUND_UI_ALLOWED || !state.playgroundVerified) return '';
  return `<div class="preview-bar"${state.overlay ? ' inert aria-hidden="true"' : ''}>
    <div class="preview-bar__brand">
      ${icon('box', 'icon--sm')}
      <span>HAU-USC Logistics · Isolated Staging Playground</span>
      <span class="preview-bar__tag">Test environment</span>
    </div>
    ${state.surface === 'index' ? themeToggle(state.theme === 'dark') : ''}
    <a class="btn btn--sm" href="#/index">${icon('home', 'icon--sm')}Index</a>
  </div>`;
}

/* ---------------- Surface index ---------------- */

function indexPage() {
  return `<main class="index-wrap" id="surface-main" tabindex="-1">
    <h1>Isolated Staging Playground Index</h1>
    <p>Use this private route directory to test the V5 application against isolated
    playground services. Protected destinations still enforce the signed-in persona's
    server-authorized capabilities.</p>
    <label class="cmdk__field" for="index-search">
      ${icon('search')}
      <span class="visually-hidden">Search routes</span>
      <input id="index-search" type="search" autocomplete="off" data-act="index-search"
        placeholder="Search routes, modules, or workspaces" />
    </label>
    <p><span class="illustrative">${icon(
      'info',
      'icon--sm icon--muted',
    )}Press <kbd>/</kbd> or <kbd>Ctrl</kbd>+<kbd>K</kbd> to focus route search. Real login and authorization remain active.</span></p>
    <p id="index-search-status" role="status" aria-live="polite">${SURFACES.length} routes available</p>
    ${GROUPS.map(
      (g) => `<section class="index-group" data-index-group>
      <h2>${esc(g)}</h2>
      <div class="index-list">
        ${SURFACES.filter((s) => s.group === g)
          .map(
            (s) => `<a class="index-item" href="#/${s.id}" data-index-item data-search="${esc(
              `${s.name} ${s.group} ${s.id}`.toLowerCase(),
            )}">
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
  </main>`;
}

/* ---------------- Internal shell ---------------- */

function routeCode(id) {
  const item = byId(id);
  const prefix = item?.group === 'Administration' ? 'A' : item?.group === 'Public' ? 'P' : 'O';
  const groupItems = SURFACES.filter((surface) => surface.group === item?.group);
  const index = Math.max(0, groupItems.findIndex((surface) => surface.id === id));
  return `${prefix}-${String(index + 1).padStart(2, '0')}`;
}

function rail() {
  const navItem = (n, index, bank) =>
    `<button class="nav-item" type="button" data-act="go" data-id="${n.id}"${
      n.id === state.surface ? ' aria-current="page"' : ''
    }>
      <span class="nav-item__icon">${icon(n.icon)}</span>
      <span class="nav-item__text">${esc(n.label)}</span>
      <span class="nav-item__code" aria-hidden="true">${bank}-${String(index + 1).padStart(2, '0')}</span>
    </button>`;

  const ws = WORKSPACES.find((w) => w.id === state.workspace);

  return `<aside class="rail" id="primary-navigation" aria-label="Primary"${
    state.overlay ? ' inert aria-hidden="true"' : ''
  }>
    <div class="rail__brand">
      <div class="rail__marks"><span class="rail__mark">HAU</span><span class="rail__mark">USC</span></div>
      <span class="rail__name">HAU-USC Logistics<span class="rail__department">Department of Logistics</span></span>
      <span class="rail__system-code">ROUTE CONSOLE · 04</span>
    </div>
    <div class="rail__scroll">
      <nav class="rail__section" aria-label="Operations">
        <span class="label"><b>Operations</b><i>O-BANK</i></span>
        ${NAV.filter((n) => state.authorizedRoutes.includes(n.id))
          .map((n, i) => navItem(n, i, 'O'))
          .join('')}
      </nav>
      <nav class="rail__section" aria-label="Administration">
        <span class="label"><b>Administration</b><i>A-BANK</i></span>
        ${NAV_ADMIN.filter((n) => state.authorizedRoutes.includes(n.id))
          .map((n, i) => navItem(n, i, 'A'))
          .join('')}
      </nav>
    </div>
    <div class="rail__foot">
      <div class="scope-button" aria-label="Current authorized workspace">
        <span class="avatar">${esc((ws?.name ?? 'A')[0])}</span>
        <span class="scope-button__text"><b>${esc(ws?.name ?? '')}</b><span>${esc(ws?.sub ?? '')}</span></span>
      </div>
    </div>
  </aside>
  <button class="rail__scrim" type="button" data-act="close-drawer" aria-label="Close navigation"></button>`;
}

function topbar() {
  const role = ROLE_VIEWS.find((r) => r.id === state.role);
  const surface = byId(state.surface);
  const narrow = state.viewport !== 'desktop' || window.innerWidth <= 1023;
  const navOpen = narrow ? state.drawer === 'open' : state.rail === 'expanded';
  return `<header class="topbar">
    <button class="menu-control" type="button" data-act="toggle-rail"
      data-drawer-open="${narrow && state.drawer === 'open'}"
      aria-expanded="${navOpen}" aria-controls="primary-navigation"
      aria-label="${narrow ? (navOpen ? 'Close navigation' : 'Open navigation') : navOpen ? 'Collapse navigation' : 'Expand navigation'}">
      <span class="menu-control__glyph" aria-hidden="true"><i></i><i></i><i></i></span>
      <span class="menu-control__label">Navigate</span>
    </button>
    <div class="topbar__route" aria-label="Current route">
      <span>${routeCode(state.surface)}</span>
      <b>${esc(surface?.name ?? 'Workspace')}</b>
    </div>
    <button class="searchpill" type="button" data-act="open-command"
      aria-label="Search routes, requests, and items"
      aria-haspopup="dialog" aria-expanded="${state.overlay === 'command'}" aria-controls="command-dialog">
      ${icon('search', 'icon--sm icon--muted')}
      <span>Search routes, requests, items…</span>
      <kbd>Ctrl K</kbd>
    </button>
    <div class="topbar__actions">
      ${themeToggle(state.theme === 'dark')}
      ${
        NOTIFICATIONS.length
          ? `<button class="icon-button notif" type="button" data-act="open-notifications"
        aria-label="Notifications, ${NOTIFICATIONS.length} unread">
        ${icon('bell')}<span class="notif__count" aria-hidden="true">${NOTIFICATIONS.length}</span>
      </button>`
          : ''
      }
      <button class="account-button" type="button" data-act="open-menu"
        aria-haspopup="true" aria-expanded="${state.overlay === 'menu'}" aria-controls="account-menu">
        <span class="avatar">${esc(
          state.accountName
            .split(/\s+/u)
            .filter(Boolean)
            .slice(0, 2)
            .map((part) => part[0])
            .join('') || 'AU',
        )}</span>
        <span class="account-button__text"><b>${esc(state.accountName)}</b><span>${esc(role?.name ?? '')}</span></span>
        ${icon('chevron', 'icon--sm')}
      </button>
    </div>
  </header>`;
}

function tabbar() {
  return `<nav class="tabbar" aria-label="Sections"${state.overlay ? ' inert aria-hidden="true"' : ''}>
    ${TABS.filter((t) => state.authorizedRoutes.includes(t.id)).map(
      (t) =>
        `<button type="button" data-act="go" data-id="${t.id}"${
          t.id === state.surface ? ' aria-current="page"' : ''
        }>${icon(t.icon, 'icon--sm')}<span>${esc(t.label)}</span></button>`,
    ).join('')}
  </nav>`;
}

function commandMatches(query = '') {
  const needle = query.trim().toLowerCase();
  return SURFACES.filter(
    (surface) => surface.kind === 'public' || state.authorizedRoutes.includes(surface.id),
  ).filter((surface) => {
    if (!needle) return true;
    return `${surface.name} ${surface.group} ${surface.id}`.toLowerCase().includes(needle);
  }).slice(0, 6);
}

function commandResults(query = state.commandQuery, active = state.commandIndex) {
  const matches = commandMatches(query);
  if (!matches.length) {
    return `<div class="cmdk__empty" role="status">No routes match “${esc(query)}”. Try a request, loan, inventory, or administration term.</div>`;
  }
  return matches
    .map(
      (match, index) => `<button class="cmdk__item${index === active ? ' is-active' : ''}"
        id="command-option-${index}" type="button" role="option" aria-selected="${index === active}"
        data-act="go" data-id="${match.id}">
        <span class="cmdk__code">${routeCode(match.id)}</span>
        <span><b>${esc(match.name)}</b><small>${esc(match.group)}</small></span>
        ${icon('arrow-right', 'icon--sm')}
      </button>`,
    )
    .join('');
}

function syncCommandResults() {
  const list = document.getElementById('command-results');
  const input = document.getElementById('command-input');
  if (!list || !input) return;
  const matches = commandMatches(state.commandQuery);
  if (matches.length) state.commandIndex = Math.min(state.commandIndex, matches.length - 1);
  else state.commandIndex = 0;
  list.innerHTML = commandResults();
  input.setAttribute(
    'aria-activedescendant',
    matches.length ? `command-option-${state.commandIndex}` : '',
  );
  const status = document.getElementById('command-status');
  if (status) status.textContent = `${matches.length} route${matches.length === 1 ? '' : 's'} available`;
}

function moveCommand(delta) {
  const matches = commandMatches(state.commandQuery);
  if (!matches.length) return;
  state.commandIndex = (state.commandIndex + delta + matches.length) % matches.length;
  syncCommandResults();
  document.getElementById(`command-option-${state.commandIndex}`)?.scrollIntoView({ block: 'nearest' });
}

function overlays() {
  if (state.overlay === 'menu') {
    return `<div class="menu" id="account-menu" data-overlay-root role="menu" aria-label="Account">
      <button type="button" role="menuitem" data-act="go" data-id="account.profile">My profile</button>
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
    return `<div class="dialog cmdk" id="command-dialog" data-overlay-root role="dialog" aria-modal="true"
      aria-labelledby="command-title">
      <button class="drawer-scrim" type="button" data-act="close-overlay" aria-label="Close search"></button>
      <div class="dialog__panel cmdk__panel">
        <h2 class="visually-hidden" id="command-title">Search logistics routes</h2>
        <label class="cmdk__field" for="command-input">
          ${icon('search', 'icon--sm icon--muted')}
          <input id="command-input" type="search" value="${esc(state.commandQuery)}"
            placeholder="Search routes, requests, items…" autocomplete="off" data-act="command-input"
            role="combobox" aria-autocomplete="list" aria-controls="command-results"
            aria-expanded="true" aria-activedescendant="command-option-${state.commandIndex}" />
          <kbd>Esc</kbd>
        </label>
        <div class="cmdk__results" id="command-results" role="listbox">
          ${commandResults()}
        </div>
        <div class="cmdk__foot">
          <span id="command-status" aria-live="polite">${commandMatches().length} routes available</span>
          <span><kbd>↑</kbd><kbd>↓</kbd> navigate · <kbd>Enter</kbd> open</span>
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
          <h3 id="cd-t">Accept and reserve this request?</h3>
          <p id="cd-b" class="muted" style="font-size:var(--t-sm)">
            Accepting reserves 6 lines against authoritative stock. Reserving is not a release —
            nothing physically leaves the office until you record a handoff at the Release Desk.</p>
          <p class="preview-action-note">This action is validated and recorded by the authorized service.</p>
        </div>
        <div class="dialog__foot">
          <button class="btn btn--quiet" type="button" data-act="close-overlay">Cancel</button>
          <button class="btn btn--primary" type="button" data-act="confirm-done">Confirm acceptance</button>
        </div>
      </div>
    </div>`;
  }

  if (state.overlay === 'detail') {
    /* Below 1180px the split pane is hidden and this drawer is the only way to
       reach a request. It therefore carries the whole detail — lines, routing
       controls, evidence — not a summary of them. */
    const { head, body, foot } = requestDetailParts(
      state.variant,
      `<button class="icon-button" type="button" data-act="close-overlay" aria-label="Close">${icon('close')}</button>`,
    );
    return `<div data-overlay-root>
      <button class="drawer-scrim" type="button" data-act="close-overlay" aria-label="Close detail"></button>
      <aside class="drawer" role="dialog" aria-modal="true" aria-label="Request detail">
        <div class="detail__head">${head}</div>
        <div class="detail__body">${body}</div>
        <div class="detail__foot">${foot}</div>
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
  const surfaceContext = {
    state: state.variant,
    requestDraft: state.requestDraft,
    requestMode: state.requestMode,
    requestType: state.requestType,
    requestSeries: state.requestSeries,
  };

  let body;
  if (PLAYGROUND_UI_ALLOWED && state.surface === 'index') {
    body = `<div class="frame" data-viewport="${state.viewport}">${indexPage()}</div>`;
  } else if (surface.kind === 'public') {
    setPublicTheme(state.theme === 'dark');
    body = `<div class="frame" data-viewport="${state.viewport}">${surface.render(surfaceContext)}</div>`;
  } else {
    const routeSequence = renderReason === 'boot' || renderReason === 'route';
    body = `<div class="frame" data-viewport="${state.viewport}">
      <div class="shell" data-rail="${state.rail}" data-drawer="${state.drawer}">
        ${rail()}
        <section class="workspace"${state.overlay ? ' inert aria-hidden="true"' : ''}>
          ${topbar()}
          <div class="route-progress" data-run="${routeSequence}" aria-hidden="true">
            <span class="route-progress__line"></span>
            <span class="route-progress__code">${routeCode(state.surface)}</span>
            <i></i><i></i><i></i>
          </div>
          <main class="main" id="surface-main" tabindex="-1">
            <div class="main__inner stage" key="${esc(state.surface)}-${esc(state.variant)}">
              ${surface.render(surfaceContext)}
            </div>
          </main>
        </section>
        ${tabbar()}
        ${overlays()}
      </div>
    </div>`;
  }

  root.innerHTML = `${playgroundBar()}${body}
    <div class="toast-region" id="toast-region" role="status" aria-live="polite"></div>`;

  syncPlaygroundBarHeight();
  document.dispatchEvent(
    new CustomEvent('hau:v5-rendered', { detail: { surface: state.surface } }),
  );
}

/* Publish the server-verified playground bar height only while it is present. */
let barObserver;
function syncPlaygroundBarHeight() {
  const bar = root.querySelector('.preview-bar');
  if (!bar) {
    barObserver?.disconnect();
    document.documentElement.style.removeProperty('--preview-bar-h');
    return;
  }
  const apply = () =>
    document.documentElement.style.setProperty('--preview-bar-h', `${bar.offsetHeight}px`);
  apply();
  barObserver?.disconnect();
  barObserver = new ResizeObserver(apply);
  barObserver.observe(bar);
}

/* ---------------- Events ---------------- */

function go(id) {
  if (id === 'index' && (!PLAYGROUND_UI_ALLOWED || !state.playgroundVerified)) {
    id = 'public.landing';
  }
  if (!byId(id) && id !== 'index') return;
  updateView(
    'route',
    () => {
      state.surface = id;
      const s = byId(id);
      state.variant = s?.states?.[0] ?? 'populated';
      state.overlay = null;
      state.drawer = 'closed';
      location.hash = `#/${id}`;
    },
    focusMain,
  );
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
  if (act === 'theme') return setTheme(el.dataset.v);
  if (act === 'toggle-theme') return setTheme(state.theme === 'dark' ? 'light' : 'dark');
  if (act === 'toggle-rail') {
    return updateView('local', () => {
      const narrow = state.viewport !== 'desktop' || window.innerWidth <= 1023;
      if (narrow) state.drawer = state.drawer === 'open' ? 'closed' : 'open';
      else state.rail = state.rail === 'expanded' ? 'collapsed' : 'expanded';
    });
  }
  if (act === 'close-drawer') {
    return updateView('local', () => {
      state.drawer = 'closed';
    });
  }
  if (act === 'open-menu') return openOverlay('menu');
  if (act === 'open-notifications') return openOverlay('notifications');
  if (act === 'open-command') return openOverlay('command');
  if (act === 'close-overlay') return closeOverlay();
  if (act === 'confirm-accept') {
    /* An `aria-disabled` control stays focusable on purpose, so the block has to
       be enforced here as well as announced. Saying nothing on the click would
       read as a dead button. */
    if (el.getAttribute('aria-disabled') === 'true') {
      toast(
        el.dataset.blockedReason ?? 'This request cannot be accepted yet.',
        'error',
      );
      return;
    }
    return openOverlay('confirm');
  }
  if (act === 'confirm-return') {
    toast('The authorized return service is not ready. No stock or custody record changed.', 'error');
    return;
  }
  if (act === 'confirm-release') {
    toast('The authorized release service is not ready. Nothing was released.', 'error');
    return;
  }
  if (act === 'confirm-done') {
    closeOverlay();
    toast('The authorized acceptance service is not ready. No record changed.', 'error');
    return;
  }
  if (act === 'select:request' || act === 'select:release') {
    const narrow = root.querySelector('.frame').clientWidth < 1181;
    if (narrow) return openOverlay('detail');
    toast('Detail shown beside the queue.');
    return;
  }
  if (act === 'request-mode') {
    const nextMode = el.dataset.mode === 'track' ? 'track' : 'create';
    return updateView(
      'local',
      () => {
        state.requestMode = nextMode;
      },
      () => document.querySelector(`[data-act="request-mode"][data-mode="${nextMode}"]`)?.focus(),
    );
  }
  if (act === 'request-add-line') {
    const form = document.getElementById('request-center-form');
    if (!form) return;
    const description = String(form.elements.lineDescription?.value ?? '').trim();
    const quantity = Number(form.elements.lineQuantity?.value);
    const category = String(form.elements.lineCategory?.value ?? 'Other');
    const unit = String(form.elements.lineUnit?.value ?? 'piece');
    const specification = String(form.elements.lineSpecification?.value ?? '').trim();
    if (!description || !Number.isInteger(quantity) || quantity < 1) {
      form.elements.lineDescription?.focus();
      toast('Name an item and enter a whole-number quantity of at least one.', 'error');
      return;
    }
    if (
      state.requestDraft.some(
        (line) =>
          line.category.toLowerCase() === category.toLowerCase() &&
          line.description.toLowerCase() === description.toLowerCase(),
      )
    ) {
      toast('That requested item is already in the preview list.', 'error');
      return;
    }
    return updateView(
      'local',
      () => state.requestDraft.push({ category, description, quantity, unit, specification }),
      () => {
        const nextForm = document.getElementById('request-center-form');
        if (nextForm) {
          nextForm.elements.lineDescription.value = '';
          nextForm.elements.lineSpecification.value = '';
          nextForm.elements.lineDescription.focus();
        }
      },
    );
  }
  if (act === 'request-remove-line') {
    const index = Number(el.dataset.index);
    if (!Number.isInteger(index) || !state.requestDraft[index]) return;
    return updateView(
      'local',
      () => state.requestDraft.splice(index, 1),
    );
  }
  if (act === 'request-submit') {
    const form = document.getElementById('request-center-form');
    if (!form?.elements.acknowledged?.checked) {
      form?.elements.acknowledged?.focus();
      toast('Confirm the privacy and no-reservation acknowledgment first.', 'error');
      return;
    }
    toast('The authorized request service is not ready. Nothing was submitted.', 'error');
    return;
  }
  if (act === 'request-track') {
    toast('The authorized tracking service is not ready. No lookup was performed.', 'error');
    return;
  }
  if (act === 'refresh') {
    toast('The latest authorized records were requested.');
    return;
  }
  if (act === 'filter') {
    toast('Filters apply to the currently loaded authorized records.');
  }
});

document.addEventListener('change', (event) => {
  const el = event.target.closest('[data-act]');
  if (!el) return;
  if (el.dataset.act === 'request-type') {
    state.requestType = el.value === 'ADDITIONAL' ? 'ADDITIONAL' : 'NEW';
    const wrap = document.querySelector('[data-request-parent-wrap]');
    const additional = el.value === 'ADDITIONAL';
    if (wrap) wrap.hidden = !additional;
    wrap?.querySelectorAll('input,select').forEach((control) => {
      control.required = additional;
      control.disabled = !additional;
    });
    return;
  }
  if (el.dataset.act === 'request-series') {
    state.requestSeries = el.value;
    const form = document.getElementById('request-center-form');
    const target = form?.elements.event;
    if (!target) return;
    const options = {
      aurora: ['Commons opening', 'Student services forum'],
      lantern: ['Assembly program', 'Closing session'],
    }[el.value];
    target.disabled = !options;
    target.innerHTML = options
      ? `<option value="">Select Sub-event</option>${options.map((name) => `<option>${esc(name)}</option>`).join('')}`
      : '<option value="">Select Event first</option>';
    return;
  }
});

document.addEventListener('input', (event) => {
  const indexSearch = event.target.closest('[data-act="index-search"]');
  if (indexSearch) {
    const query = indexSearch.value.trim().toLowerCase();
    let visible = 0;
    document.querySelectorAll('[data-index-item]').forEach((item) => {
      item.hidden = Boolean(query) && !item.dataset.search.includes(query);
      item.style.display = item.hidden ? 'none' : '';
      if (!item.hidden) visible += 1;
    });
    document.querySelectorAll('[data-index-group]').forEach((group) => {
      group.hidden = !group.querySelector('[data-index-item]:not([hidden])');
      group.style.display = group.hidden ? 'none' : '';
    });
    const status = document.getElementById('index-search-status');
    if (status) status.textContent = `${visible} route${visible === 1 ? '' : 's'} available`;
    return;
  }
  const input = event.target.closest('[data-act="command-input"]');
  if (!input) return;
  state.commandQuery = input.value;
  state.commandIndex = 0;
  syncCommandResults();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    if (state.overlay) return closeOverlay();
    if (state.drawer === 'open') {
      updateView('local', () => {
        state.drawer = 'closed';
      });
    }
    return;
  }
  if (state.overlay === 'command') {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      moveCommand(1);
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      moveCommand(-1);
      return;
    }
    if (event.key === 'Enter') {
      const match = commandMatches(state.commandQuery)[state.commandIndex];
      if (match) {
        event.preventDefault();
        go(match.id);
      }
      return;
    }
  }
  const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(event.target.tagName);
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
    event.preventDefault();
    if (state.surface === 'index') {
      document.getElementById('index-search')?.focus();
      return;
    }
    if (state.overlay === 'command') return closeOverlay();
    if (state.surface !== 'index' && byId(state.surface)?.kind === 'internal') openOverlay('command');
    return;
  }
  if (event.key === '/' && !typing) {
    event.preventDefault();
    if (state.surface === 'index') {
      document.getElementById('index-search')?.focus();
      return;
    }
    if (state.surface !== 'index' && byId(state.surface)?.kind === 'internal') openOverlay('command');
  }
});

window.addEventListener('hashchange', () => {
  const id = location.hash.replace(/^#\/?/, '') || 'public.landing';
  if (id !== state.surface) go(id);
});

// Exported by scripts/v5-application-plugin.mjs in the integrated application build.
// eslint-disable-next-line no-unused-vars
function setPlaygroundContext(verified) {
  state.playgroundVerified = PLAYGROUND_UI_ALLOWED && verified === true;
  const requested = location.hash.replace(/^#\/?/, '') || 'public.landing';
  if (state.playgroundVerified && requested === 'index') go('index');
  else if (!state.playgroundVerified && (state.surface === 'index' || requested === 'index')) {
    go('public.landing');
  } else render();
}

// Exported by scripts/v5-application-plugin.mjs in the integrated application build.
// eslint-disable-next-line no-unused-vars
function setAuthorizedRoutes(routeIds, accountName = '') {
  state.authorizedRoutes = Array.isArray(routeIds) ? [...new Set(routeIds.map(String))] : [];
  state.accountName = String(accountName || 'Authorized user');
  render();
}

/* ---------------- Boot ---------------- */

document.body.insertAdjacentHTML('afterbegin', spriteMarkup());
document.documentElement.classList.add('v4-boot');
const initial = location.hash.replace(/^#\/?/, '') || 'public.landing';
state.surface = byId(initial) ? initial : 'public.landing';
state.variant = byId(state.surface)?.states?.[0] ?? 'populated';
render();
renderReason = 'idle';
requestAnimationFrame(() => {
  requestAnimationFrame(() => document.documentElement.classList.remove('v4-boot'));
});
