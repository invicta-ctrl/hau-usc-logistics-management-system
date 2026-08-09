import { getRuntimeReleaseIdentity, releaseIdentityLabel } from '../app/release-identity.js';
import campusLandingFallback from '../../prototypes/impeccable-whole-site-redesign-v5/assets/images/hau-campus-login-background.jpg?inline';
import { landingNetworkMarkup } from './landing-network.js';
import { themeControlMarkup } from './signature-controls.js';

export const STAFF_SIGN_IN_URL = 'https://logistics.hausc.org/login';

const arrowIconMarkup =
  '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h13M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';

function staffSignInUrl() {
  return typeof document !== 'undefined' && document.body?.dataset.runtimeMode === 'mock'
    ? '/login'
    : STAFF_SIGN_IN_URL;
}

function landingMediaUrl() {
  return typeof document !== 'undefined' && document.body?.dataset.runtimeMode === 'mock'
    ? campusLandingFallback
    : '/brand/login-background';
}

const destination = ({ current, id, href, label }) =>
  current === id ? `<span aria-current="page">${label}</span>` : `<a href="${href}">${label}</a>`;

export function portalNavigationMarkup({ current = '' } = {}) {
  const staffUrl = staffSignInUrl();
  return `<nav class="portal-navigation" aria-label="HAU-USC logistics portals">
    ${destination({ current, id: 'request', href: '/request', label: 'Request Center' })}
    ${destination({ current, id: 'lending', href: '/lending', label: 'Lending Center' })}
    ${destination({ current, id: 'staff', href: staffUrl, label: 'Staff sign in' })}
    <a href="/portals#module-index" data-module-index-open>Module index</a>
    ${current === 'selection' ? '' : '<a href="/portals">Back to portals</a>'}
  </nav>`;
}

export function releaseIdentityMarkup() {
  const identity = getRuntimeReleaseIdentity();
  const publicLabel = identity.verified && identity.environment === 'PRODUCTION' ? 'Online' : 'Test site';
  return `<p class="auth-environment" data-release-identity data-environment="${identity.environment}" data-release-sha="${identity.candidateSha}" data-release-schema="${identity.schemaVersion}" aria-label="${releaseIdentityLabel(identity)}">${publicLabel}</p>`;
}

export function portalSelectionMarkup() {
  const staffUrl = staffSignInUrl();
  const landingMedia = landingMediaUrl();
  return `<section class="portal-landing public public--landing" aria-labelledby="portalSelectionTitle">
    <header class="public__bar">
      <a class="public__brand" href="/portals" aria-label="HAU-USC Logistics home">
        <span class="public__marks" aria-hidden="true"><span class="public__mark">HAU</span><span class="public__mark">USC</span></span>
        <span class="public__wordmark"><b>HAU-USC Logistics</b><span>Department of Logistics</span></span>
      </a>
      <div class="public__bar-actions"><a class="btn btn--quiet module-index-link" href="/portals#module-index" data-module-index-open>Module index</a>${themeControlMarkup()}</div>
    </header>
    <main class="public__main public__main--wide" id="surface-main" tabindex="-1">
      <section class="landing-hero" aria-labelledby="portalSelectionTitle">
        <img class="landing-hero__media" src="${landingMedia}" alt="" width="1654" height="951" decoding="async" fetchpriority="high">
        <div class="landing-hero__content">
          <h1 id="portalSelectionTitle">Request. Prepare. Release.</h1>
          <p>Request event support, borrow office equipment, and follow each handoff.</p>
          <div class="landing-hero__actions">
            <a class="btn btn--primary" href="/request">Open Request Center ${arrowIconMarkup}</a>
            <a class="landing-link" href="/lending">Open Lending Center ${arrowIconMarkup}</a>
          </div>
        </div>
        <div class="landing-hero__monogram" aria-hidden="true"><span>HAU</span><span>USC</span></div>
      </section>

      <section class="landing-intro" aria-labelledby="landingGuidanceTitle">
        <h2 id="landingGuidanceTitle">One place for accountable campus logistics.</h2>
        <p>Choose the service you need. Staff access and private tracking remain protected by the existing account rules.</p>
      </section>

      <nav class="portal-actions" aria-label="Logistics portals">
        <a class="portal-action portal-action--primary" href="/request"><span class="portal-action__mark" aria-hidden="true">R</span><span><b>Request Center</b><small>Send an event or logistics request.</small></span>${arrowIconMarkup}</a>
        <a class="portal-action" href="/lending"><span class="portal-action__mark" aria-hidden="true">L</span><span><b>Lending Center</b><small>Borrow equipment with a recorded return.</small></span>${arrowIconMarkup}</a>
        <a class="portal-action" href="${staffUrl}"><span class="portal-action__mark" aria-hidden="true">S</span><span><b>Staff sign in</b><small>Open your authorized workspace.</small></span>${arrowIconMarkup}</a>
        <a class="portal-action" href="/portals#module-index" data-module-index-open><span class="portal-action__mark" aria-hidden="true">M</span><span><b>Module index</b><small>Find every available logistics destination.</small></span>${arrowIconMarkup}</a>
      </nav>

      ${landingNetworkMarkup()}

      <section class="landing-updates portal-landing__guidance" aria-labelledby="landingTrackingTitle">
        <div><h2 id="landingTrackingTitle">Keep your tracking details</h2><p>Save the private code shown after submission. You will need it to check progress.</p></div>
        <div class="portal-landing__tracking"><a class="btn" href="/request#request-tracking">Track a request</a><a class="btn btn--quiet" href="/lending#lending-tracking">Track a loan</a></div>
      </section>
      <div class="portal-landing__quiet-actions"><a href="${staffUrl}">Staff sign in</a>${releaseIdentityMarkup()}</div>
    </main>
    <footer class="public__foot"><p class="public__foot-line">Every item moves with a record.</p><div class="public__foot-meta"><span>HAU-USC Logistics &middot; &copy; 2026</span><a href="https://www.facebook.com/holyangeluniversitysc" target="_blank" rel="noopener noreferrer">Official USC page</a></div></footer>
  </section>`;
}
