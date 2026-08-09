import { activateBrandMediaFallbacks } from './brand-assets.js';

const THEME_STORAGE_KEY = 'hau-usc-logistics-theme';

const SUN_ICON = `<svg aria-hidden="true" viewBox="0 0 24 24"><path fill="currentColor" d="M12 1.75a1 1 0 0 1 1 1V4a1 1 0 1 1-2 0V2.75a1 1 0 0 1 1-1Zm0 5.25a5 5 0 1 1 0 10 5 5 0 0 1 0-10Zm9.25 4a1 1 0 1 1 0 2H20a1 1 0 1 1 0-2h1.25ZM4 11a1 1 0 1 1 0 2H2.75a1 1 0 1 1 0-2H4Zm14.42-6.84a1 1 0 0 1 1.42 1.42l-.89.88a1 1 0 0 1-1.41-1.41l.88-.89ZM5.05 17.54a1 1 0 0 1 1.41 1.41l-.88.89a1 1 0 0 1-1.42-1.42l.89-.88Zm13.9 0 .89.88a1 1 0 0 1-1.42 1.42l-.88-.89a1 1 0 0 1 1.41-1.41ZM5.58 4.16l.88.89a1 1 0 0 1-1.41 1.41l-.89-.88a1 1 0 1 1 1.42-1.42ZM13 20v1.25a1 1 0 1 1-2 0V20a1 1 0 1 1 2 0Z"/></svg>`;
const MOON_ICON = `<svg aria-hidden="true" viewBox="0 0 24 24"><path fill="currentColor" d="M20.74 15.45A9 9 0 0 1 8.55 3.26a1 1 0 0 0-1.12-1.51A10.75 10.75 0 1 0 22.25 16.57a1 1 0 0 0-1.51-1.12Z"/></svg>`;

function preferredTheme() {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    if (stored === 'light' || stored === 'dark') return stored;
  } catch {
    // Storage can be unavailable in privacy-restricted browsing contexts.
  }
  return globalThis.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function setTheme(theme, { persist = false } = {}) {
  const next = theme === 'dark' ? 'dark' : 'light';
  document.documentElement.dataset.theme = next;
  document.documentElement.style.colorScheme = next;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', next === 'dark' ? '#1f1012' : '#610b0f');
  document.querySelectorAll('[data-theme-control]').forEach((control) => {
    const dark = next === 'dark';
    control.dataset.theme = next;
    control.setAttribute('aria-pressed', String(dark));
    control.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
    control.title = dark ? 'Switch to light mode' : 'Switch to dark mode';
  });
  if (persist) {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // The selected theme still applies for this page when persistence is blocked.
    }
  }
}

export function themeControlMarkup() {
  return `<button class="celestial celestial-control" type="button" data-theme-control aria-pressed="false" aria-label="Switch to dark mode">
    <span class="celestial__capsule" aria-hidden="true">
      <span class="celestial__sheen"></span>
      <span class="celestial__plate celestial-control__plate"></span>
      <span class="celestial__slot celestial__slot--sun celestial-control__icon" data-theme-icon="light">${SUN_ICON}</span>
      <span class="celestial__slot celestial__slot--moon celestial-control__icon" data-theme-icon="dark">${MOON_ICON}</span>
    </span>
  </button>`;
}

export function backControlMarkup({ href = '/portals', label = 'Back' } = {}) {
  return `<a class="signature-back back-control" href="${href}" data-signature-back aria-label="${label}">
    <span class="back-control__glyph"><svg aria-hidden="true" viewBox="0 0 24 24"><path d="m14.5 5-7 7 7 7" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/></svg></span>
    <span class="back-control__label">${label}</span>
  </a>`;
}

function menuControlMarkup() {
  return `<button class="menu-control" type="button" data-signature-menu data-drawer-open="true" aria-expanded="true" aria-controls="primaryNav" aria-label="Close navigation">
    <span class="menu-control__glyph" aria-hidden="true"><i></i><i></i><i></i></span><span class="menu-control__label">Navigate</span>
  </button>`;
}

function bindThemeControls() {
  document.querySelectorAll('[data-theme-control]:not([data-theme-bound])').forEach((control) => {
    control.dataset.themeBound = '';
    control.addEventListener('click', () => {
      const current = document.documentElement.dataset.theme || 'light';
      setTheme(current === 'dark' ? 'light' : 'dark', { persist: true });
    });
  });
  setTheme(document.documentElement.dataset.theme || preferredTheme());
}

function setNavigationOpen(open, { focus = false } = {}) {
  const menu = document.querySelector('[data-signature-menu]');
  document.body.dataset.navigation = open ? 'open' : 'closed';
  menu?.setAttribute('aria-expanded', String(open));
  if (menu) menu.dataset.drawerOpen = String(open && matchMedia('(max-width: 63.99rem)').matches);
  menu?.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
  document.querySelector('[data-navigation-backdrop]')?.toggleAttribute('hidden', !open);
  if (focus && open) {
    document.querySelector('#primaryNav button.active, #primaryNav button')?.focus({ preventScroll: true });
  }
}

function installInternalControls() {
  const shellContext = document.querySelector('[data-internal-shell-context]');
  if (!shellContext || shellContext.querySelector('[data-signature-controls]')) return;
  const controls = document.createElement('div');
  controls.className = 'signature-controls';
  controls.dataset.signatureControls = '';
  controls.innerHTML = `${menuControlMarkup()}${backControlMarkup({ label: 'Back' })}${themeControlMarkup()}`;
  shellContext.querySelector('.internal-shell-context-meta')?.prepend(controls);

  let backdrop = document.querySelector('[data-navigation-backdrop]');
  if (!backdrop) {
    backdrop = document.createElement('button');
    backdrop.type = 'button';
    backdrop.className = 'navigation-backdrop';
    backdrop.dataset.navigationBackdrop = '';
    backdrop.setAttribute('aria-label', 'Close navigation');
    backdrop.hidden = true;
    document.body.append(backdrop);
    backdrop.addEventListener('click', () => setNavigationOpen(false));
  }

  const menu = controls.querySelector('[data-signature-menu]');
  menu.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    setNavigationOpen(open, { focus: open && matchMedia('(max-width: 63.99rem)').matches });
  });
  document.querySelector('#primaryNav')?.addEventListener('click', () => {
    if (matchMedia('(max-width: 63.99rem)').matches) setNavigationOpen(false);
  });
  const compact = matchMedia('(max-width: 63.99rem)').matches;
  setNavigationOpen(!compact);
}

function installPublicControls() {
  const surface = document.querySelector(
    '.auth-gateway > section:not(.portal-landing), .public-request-portal, .public-lending-portal',
  );
  if (!surface || surface.querySelector(':scope > [data-signature-controls]')) return;
  const controls = document.createElement('div');
  controls.className = 'signature-controls signature-controls--public';
  controls.dataset.signatureControls = '';
  controls.innerHTML = `${backControlMarkup({ label: 'Portals' })}${themeControlMarkup()}`;
  surface.prepend(controls);
}

function bindBackControls() {
  document.querySelectorAll('[data-signature-back]:not([data-signature-bound])').forEach((control) => {
    control.dataset.signatureBound = '';
    control.addEventListener('click', (event) => {
      if (location.pathname === '/portals') return;
      if (history.length <= 1) return;
      event.preventDefault();
      history.back();
    });
  });
}

function syncControls() {
  activateBrandMediaFallbacks();
  installInternalControls();
  installPublicControls();
  bindThemeControls();
  bindBackControls();
}

let installed = false;

export function installSignatureControls() {
  if (installed) return;
  installed = true;
  setTheme(preferredTheme());
  syncControls();
  const observer = new MutationObserver(syncControls);
  observer.observe(document.body, { childList: true, subtree: true });
  document.addEventListener('keydown', (event) => {
    if (event.key !== 'Escape' || document.body.dataset.navigation !== 'open') return;
    if (!matchMedia('(max-width: 63.99rem)').matches) return;
    setNavigationOpen(false);
    document.querySelector('[data-signature-menu]')?.focus({ preventScroll: true });
  });
  document.addEventListener('hau:v5-navigation-close', () => setNavigationOpen(false));
}
