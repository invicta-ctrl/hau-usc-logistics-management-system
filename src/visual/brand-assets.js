const BRAND_PATHS = Object.freeze({
  dol: '/brand/dol-logo',
  usc: '/brand/usc-logo',
});

export function brandLockupMarkup({ compact = false, decorative = false } = {}) {
  const label = 'Holy Angel University University Student Council Department of Logistics';
  return `<span class="brand-media-lockup${compact ? ' brand-media-lockup-compact' : ''}"${
    decorative ? ' aria-hidden="true"' : ` role="img" aria-label="${label}"`
  }>
    <img class="brand-media brand-media-usc" src="${BRAND_PATHS.usc}" alt="" decoding="async">
    <img class="brand-media brand-media-dol" src="${BRAND_PATHS.dol}" alt="" decoding="async">
  </span>`;
}

export function installOperationalBranding() {
  const sidebarBrand = document.querySelector('.brand.brand-text-lockup');
  if (sidebarBrand && !sidebarBrand.querySelector('.brand-media-lockup')) {
    sidebarBrand.insertAdjacentHTML('afterbegin', brandLockupMarkup());
  }

  const headerTitle = document.querySelector('.app-header > div:first-child');
  if (headerTitle && !headerTitle.querySelector('.brand-media-lockup')) {
    headerTitle.classList.add('app-header-identity');
    headerTitle.insertAdjacentHTML('afterbegin', brandLockupMarkup({ compact: true }));
  }
}
