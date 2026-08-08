import { getRuntimeReleaseIdentity, releaseIdentityLabel } from '../app/release-identity.js';

export const STAFF_SIGN_IN_URL = 'https://logistics.hausc.org/login';

const destination = ({ current, id, href, label }) =>
  current === id ? `<span aria-current="page">${label}</span>` : `<a href="${href}">${label}</a>`;

export function portalNavigationMarkup({ current = '' } = {}) {
  return `<nav class="portal-navigation" aria-label="HAU-USC logistics portals">
    ${destination({ current, id: 'request', href: '/request', label: 'Request Center' })}
    ${destination({ current, id: 'lending', href: '/lending', label: 'Lending Center' })}
    ${destination({ current, id: 'staff', href: STAFF_SIGN_IN_URL, label: 'Staff sign in' })}
    ${current === 'selection' ? '' : '<a href="/portals">Back to portal selection</a>'}
  </nav>`;
}

export function releaseIdentityMarkup() {
  const identity = getRuntimeReleaseIdentity();
  return `<p class="auth-environment" data-release-identity data-environment="${identity.environment}" data-release-sha="${identity.candidateSha}" data-release-schema="${identity.schemaVersion}">${releaseIdentityLabel(identity)}</p>`;
}

export function portalSelectionMarkup() {
  return `<section class="auth-card auth-card-wide portal-selection" aria-labelledby="portalSelectionTitle">
    <p class="eyebrow">HAU-USC Logistics</p>
    <h1 id="portalSelectionTitle">Choose a logistics portal</h1>
    <p class="auth-intro">Use the portal that matches the work you need to complete. Access and records remain separated by the server.</p>
    ${releaseIdentityMarkup()}
    ${portalNavigationMarkup({ current: 'selection' })}
  </section>`;
}
