import { getRuntimeReleaseIdentity, releaseIdentityLabel } from '../app/release-identity.js';
import { landingNetworkMarkup } from './landing-network.js';
import { themeControlMarkup } from './signature-controls.js';

export const STAFF_SIGN_IN_URL = 'https://logistics.hausc.org/login';

function staffSignInUrl() {
  return typeof document !== 'undefined' && document.body?.dataset.runtimeMode === 'mock'
    ? '/login'
    : STAFF_SIGN_IN_URL;
}

const destination = ({ current, id, href, label }) =>
  current === id ? `<span aria-current="page">${label}</span>` : `<a href="${href}">${label}</a>`;

export function portalNavigationMarkup({ current = '' } = {}) {
  const staffUrl = staffSignInUrl();
  return `<nav class="portal-navigation" aria-label="HAU-USC logistics portals">
    ${destination({ current, id: 'request', href: '/request', label: 'Request Center' })}
    ${destination({ current, id: 'lending', href: '/lending', label: 'Lending Center' })}
    ${destination({ current, id: 'staff', href: staffUrl, label: 'Staff sign in' })}
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
  return `<section class="portal-landing" aria-labelledby="portalSelectionTitle">
    <header class="portal-landing__nav">
      <a class="portal-landing__brand" href="/portals" aria-label="HAU-USC Logistics home"><span class="portal-landing__mark" aria-hidden="true">H</span><span>HAU-USC Logistics</span></a>
      <nav aria-label="Public logistics navigation"><a href="/request">Request</a><a href="/lending">Lending</a><a href="${staffUrl}">Staff</a></nav>
      ${themeControlMarkup()}
    </header>
    <main class="portal-landing__main">
      <div class="portal-landing__copy">
        <div class="portal-landing__identity"><span>Holy Angel University</span><span>University Student Council</span></div>
        <h1 id="portalSelectionTitle">Request. Prepare. Release.</h1>
        <p>Start a logistics request, borrow office equipment, or check a private tracking record.</p>
        <div class="portal-landing__actions">
          <a class="primary" href="/request">Open Request Center</a>
          <a class="secondary" href="/lending">Open Lending Center</a>
        </div>
        <div class="portal-landing__quiet-actions">
          <a href="${staffUrl}">Staff sign in</a>
          ${releaseIdentityMarkup()}
        </div>
      </div>
      ${landingNetworkMarkup()}
    </main>
    <section class="portal-landing__guidance" aria-labelledby="landingGuidanceTitle">
      <div><h2 id="landingGuidanceTitle">Keep your tracking details</h2><p>Save the private code shown after submission. You will need it to check progress.</p></div>
      <div class="portal-landing__tracking"><a href="/request#request-tracking">Track a request</a><a href="/lending#lending-tracking">Track a loan</a></div>
    </section>
    <footer class="portal-landing__footer"><strong>Clear requests. Accountable handoffs.</strong><span>HAU-USC Department of Logistics</span></footer>
  </section>`;
}
