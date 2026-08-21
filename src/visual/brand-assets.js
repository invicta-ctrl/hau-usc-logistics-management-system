const BRAND_PATHS = Object.freeze({
  combined: '/brand/combined-lockup',
  dol: '/brand/dol-logo',
  usc: '/brand/usc-logo',
});

export function brandLockupMarkup({ compact = false, decorative = false } = {}) {
  const label = 'Holy Angel University University Student Council Department of Logistics';
  return `<span class="brand-media-lockup brand-media-lockup-combined${compact ? ' brand-media-lockup-compact' : ''}"${
    decorative ? ' aria-hidden="true"' : ` role="group" aria-label="${label}"`
  }>
    <a class="brand-mark brand-media-link" href="https://www.facebook.com/holyangeluniversitysc" target="_blank" rel="noopener noreferrer" aria-label="Visit the HAU-USC official Facebook page"${decorative ? ' tabindex="-1"' : ''}><img class="brand-media brand-media-combined" src="${BRAND_PATHS.combined}" alt="" decoding="async"></a>
  </span>`;
}

export { BRAND_PATHS };

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
