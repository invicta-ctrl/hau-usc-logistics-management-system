/* Public and pre-authentication surfaces.
   Calmer, narrower, larger than internal. One action per screen.
   Nothing here exposes protected stock, internal notes, roster data,
   supplier evidence, or audit internals. */

import { icon } from '../icons.js';
import {
  backControl,
  esc,
  facts,
  field,
  notice,
  receipt,
  stepper,
  themeToggle,
  timeline,
} from '../components.js';

const marks = `<span class="public__marks"><span class="public__mark">HAU</span><span class="public__mark">USC</span></span>`;
const serviceDataLabel = `<p class="preview-data-label" role="note">Service-backed workflow <span aria-hidden="true">·</span> protected fields stay private</p>`;

/* Public surfaces are plain render functions with no context argument, so the
   shell reads the current theme from here. app.js sets it before each render.
   Only the toggle's accessible name and pressed state depend on it — the icon
   itself is switched by CSS from [data-theme]. */
let publicDark = false;
export function setPublicTheme(dark) {
  publicDark = !!dark;
}

export function publicShell(
  inner,
  { wide = false, back = true, dark = publicDark, landing = false, dataLabel = true } = {},
) {
  return `<div class="public${landing ? ' public--landing' : ''}">
    <header class="public__bar">
      <div class="public__brand">${marks}
        <span class="public__wordmark"><b>HAU-USC Logistics</b><span>Department of Logistics</span></span>
      </div>
      <div class="public__bar-actions">
        ${themeToggle(dark)}
        ${
          back ? backControl() : ''
        }
      </div>
    </header>
    <main class="public__main${wide ? ' public__main--wide' : ''}" id="surface-main" tabindex="-1">${dataLabel ? serviceDataLabel : ''}${inner}</main>
    <footer class="public__foot">
      <p class="public__foot-line">Every item moves with a record.</p>
      <div class="public__foot-meta">
        <span>HAU-USC Logistics · © 2026</span>
        <a href="#/public.policy">Privacy Notice and Acceptable Use</a>
      </div>
    </footer>
  </div>`;
}

/* ---------- 1. Portal landing ---------- */

export const landing = () =>
  publicShell(
    `<section class="landing-hero" aria-labelledby="landing-title">
      <img class="landing-hero__media" src="assets/images/hau-campus-login-background.jpg"
        alt="" width="1654" height="951" decoding="async" fetchpriority="high" />
      <div class="landing-hero__content">
        <h1 id="landing-title">Holy Angel University Student Council</h1>
        <p>The university's highest student governing body, representing the tertiary student community through leadership, service, and shared responsibility.</p>
        <div class="landing-hero__actions">
          <a class="btn btn--primary" href="#/public.request-intake">Open Request Center${icon('arrow-right')}</a>
          <a class="landing-link" href="https://www.facebook.com/holyangeluniversitysc" target="_blank" rel="noopener noreferrer">Visit the official USC Facebook page${icon('arrow-right', 'icon--sm')}</a>
        </div>
      </div>
      <div class="landing-hero__monogram" aria-hidden="true"><span>HAU</span><span>USC</span></div>
    </section>

    <section class="landing-intro" aria-labelledby="landing-intro-title">
      <h2 id="landing-intro-title">Student representation that stays close to the Angelite community.</h2>
      <p>USC brings together elected student leaders from across Holy Angel University's colleges. Its public work is grounded in service, integrity, equality, solidarity, and responsibility.</p>
    </section>

    <nav class="portal-actions" aria-label="Logistics portals">
      <a class="portal-action portal-action--primary" href="#/public.request-intake">
        <span class="portal-action__mark">${icon('clipboard')}</span>
        <span><b>Request Center</b><small>Create a department request or privately track existing work.</small></span>
        ${icon('arrow-right')}
      </a>
      <a class="portal-action" href="#/public.lending-intake">
        <span class="portal-action__mark">${icon('lending')}</span>
        <span><b>Office Lending</b><small>Borrow reusable equipment with an accountable return date.</small></span>
        ${icon('arrow-right')}
      </a>
      <a class="portal-action" href="#/public.signin">
        <span class="portal-action__mark">${icon('lock')}</span>
        <span><b>Staff sign in</b><small>Enter the role-based logistics workspace.</small></span>
        ${icon('arrow-right')}
      </a>
    </nav>

    <section class="landing-updates" aria-labelledby="landing-updates-title">
      <div><h2 id="landing-updates-title">Official USC updates</h2>
        <p>Authorized announcements appear through the official council channels. No announcement is shown unless the service publishes it.</p></div>
      <a class="btn" href="https://www.facebook.com/holyangeluniversitysc" target="_blank" rel="noopener noreferrer">View official page${icon('arrow-right', 'icon--sm')}</a>
    </section>`,
    { back: false, wide: true, landing: true, dataLabel: false },
  );

/* ---------- 2. Sign in ---------- */

export function signin({ state }) {
  const invalid = state === 'error';
  const unavailable = state === 'unavailable';
  return publicShell(
    `<div class="auth-card">
      <h1>Staff sign in</h1>
      <p>Department of Logistics accounts only.</p>
      ${
        unavailable
          ? notice({
              tone: 'alert',
              title: 'Sign-in is temporarily unavailable',
              body: 'We could not reach the account service. Nothing was submitted. Please try again in a few minutes.',
            })
          : ''
      }
      ${
        invalid
          ? notice({
              tone: 'alert',
              title: 'We could not sign you in',
              body: 'The username or password did not match. Nothing was changed on your account.',
            })
          : ''
      }
      <form onsubmit="return false">
        ${field({ label: 'Username', name: 'u', required: true, value: invalid ? 'logistics.office' : '' })}
        ${field({
          label: 'Password',
          name: 'p',
          type: 'password',
          required: true,
          error: invalid ? 'Enter your password to continue.' : '',
        })}
        <button class="btn btn--primary" type="submit"${
          state === 'loading' ? ' data-state="loading" disabled' : ''
        }>${icon('lock')}${state === 'loading' ? 'Signing in…' : 'Sign in'}</button>
      </form>
      <p class="auth-alt">No account yet? <a href="#/public.application">Apply for access</a></p>
    </div>`,
  );
}

/* ---------- 3. Create staff account ---------- */

export const register = () =>
  publicShell(
    `<div class="auth-card">
      <h1>Create a staff account</h1>
      <p>Your account is activated after review. You will not be able to sign in until it is approved.</p>
      <form onsubmit="return false">
        ${field({ label: 'Full name', name: 'n', required: true })}
        ${field({ label: 'Institutional email', name: 'e', type: 'email', required: true, hint: 'Must match the protected directory exactly.' })}
        ${field({ label: 'Username', name: 'u', required: true, hint: 'Letters, numbers, and dots only.' })}
        ${field({ label: 'Password', name: 'p', type: 'password', required: true, hint: 'At least 12 characters.' })}
        <button class="btn btn--primary" type="submit">Create account</button>
      </form>
      <p class="auth-alt">Already have one? <a href="#/public.signin">Sign in</a></p>
    </div>`,
  );

/* ---------- 4. Email verification ---------- */

export const verify = () =>
  publicShell(
    `<div class="auth-card">
      <h1>Confirm your email</h1>
      <p>We sent a confirmation link to the institutional address you provided.</p>
      ${notice({
        tone: 'info',
        title: 'Nothing is active yet',
        body: 'Your account stays inactive until the link is opened and an administrator completes the review.',
      })}
      <div style="display:grid;gap:8px;margin-top:20px">
        <button class="btn" type="button" data-act="open-parity-actions">Resend confirmation</button>
        <a class="btn btn--quiet" href="#/public.signin">Back to sign in</a>
      </div>
    </div>`,
  );

/* ---------- 5. Account application ---------- */

export const application = () =>
  publicShell(
    `<div class="public__head">
      <h1>Apply for access</h1>
      <p>Tell us who you are and what you need to do. A Department of Logistics administrator reviews every application.</p>
    </div>
    ${stepper(['Identity', 'Purpose', 'Review'], 0)}
    <form class="form-grid" onsubmit="return false">
      <fieldset>
        <legend>Your identity</legend>
        <div style="display:grid;gap:16px">
          ${field({ label: 'Full name', name: 'n', required: true })}
          ${field({ label: 'Institutional email', name: 'e', type: 'email', required: true })}
          ${field({
            label: 'You are a',
            name: 'kind',
            options: ['USC officer', 'USC staff', 'Angelite student', 'Department of Logistics staff'],
          })}
        </div>
      </fieldset>
      <fieldset>
        <legend>What you need</legend>
        <div style="display:grid;gap:16px">
          ${field({
            label: 'Reason for access',
            name: 'r',
            textarea: true,
            hint: 'Describe the work you need to do. Do not include personal records here.',
            required: true,
          })}
        </div>
      </fieldset>
      <button class="btn btn--primary" type="submit" data-act="open-parity-actions">Continue to review</button>
    </form>`,
  );

/* ---------- 6. Application status ---------- */

export const applicationStatus = () =>
  publicShell(
    `<div class="public__head">
      <h1>Application status</h1>
      <p>Open the private status link issued for an application.</p>
    </div>
    <div class="panel"><div class="panel__body">
      ${timeline([
        { title: 'Application not loaded', meta: 'A private status token is required', current: true },
      ])}
      ${notice({
        tone: 'info',
        title: 'What happens next',
        body: 'An administrator checks your identity against the protected directory. If it does not match exactly, the application waits for manual review rather than being approved automatically.',
      })}
    </div></div>`,
  );

/* ---------- 7. Public request intake ---------- */

export function requestIntake({
  state,
  requestDraft = [],
  requestMode = 'create',
  requestType = 'NEW',
  requestSeries = '',
}) {
  const invalid = state === 'error';
  const requestEvents = {};
  const subEvents = requestEvents[requestSeries] ?? [];
  const draftMarkup = requestDraft.length
    ? requestDraft
        .map(
          (line, index) => `<li class="request-draft__item">
            <span><b>${esc(line.description)}</b><small>${esc(line.category)} <span aria-hidden="true">·</span> ${esc(line.quantity)} ${esc(line.unit)}${line.specification ? ` <span aria-hidden="true">·</span> ${esc(line.specification)}` : ''}</small></span>
            <button class="btn btn--quiet btn--sm" type="button" data-act="request-remove-line" data-index="${index}">Remove</button>
          </li>`,
        )
        .join('')
    : '<li class="request-draft__empty">No requested items added yet.</li>';

  return publicShell(
    `<div class="request-center-head">
      <div><h1>Request Center</h1>
        <p>Submit a request for review or track a prior submission with its private tracking code.</p></div>
      <span class="request-center-head__identity">${icon('shield', 'icon--sm')}Public request portal</span>
    </div>
    <div class="request-mode-tabs" role="tablist" aria-label="Request Center mode">
      <button id="request-create-tab" type="button" role="tab" data-act="request-mode" data-mode="create"
        aria-selected="${requestMode === 'create'}" aria-controls="request-create-panel">Create Request</button>
      <button id="request-track-tab" type="button" role="tab" data-act="request-mode" data-mode="track"
        aria-selected="${requestMode === 'track'}" aria-controls="request-track-panel">Track Existing Request</button>
    </div>
    ${
      invalid
        ? notice({
            tone: 'alert',
            title: 'Two fields need attention',
            body: 'Nothing has been submitted yet. Fix the highlighted fields and try again.',
          })
        : ''
    }
    <section id="request-create-panel" role="tabpanel" aria-labelledby="request-create-tab"${requestMode === 'create' ? '' : ' hidden'}>
      <form class="request-center-form" id="request-center-form" onsubmit="return false">
        <section class="request-form-section" aria-labelledby="request-identity-title">
          <div class="request-form-section__head"><span>1</span><div><h2 id="request-identity-title">Request identity</h2><p>Use accurate contact details so an authorized reviewer can follow up safely.</p></div></div>
          <div class="request-form-grid">
            ${field({ label: 'Requester name', name: 'requesterName', required: true })}
            ${field({
              label: 'Requester type',
              name: 'requesterType',
              options: [
                'HAU student / Angelite',
                'HAU office / department',
                'USC officer / committee',
                'External partner',
              ],
              required: true,
            })}
            ${field({ label: 'Organisation or office', name: 'organization', required: true })}
            ${field({ label: 'Email', name: 'email', type: 'email', required: true })}
            ${field({ label: 'Contact number', name: 'contactNumber', type: 'tel', required: true })}
          </div>
        </section>

        <section class="request-form-section" aria-labelledby="request-type-title">
          <div class="request-form-section__head"><span>2</span><div><h2 id="request-type-title">New or Additional</h2><p>Additional requests stay separate and link back to an existing request.</p></div></div>
          <fieldset class="request-type-choice"><legend>Request type</legend>
            <label><input type="radio" name="requestType" value="NEW" data-act="request-type"${requestType === 'NEW' ? ' checked' : ''} /><span><b>New request</b><small>Start a new logistics request.</small></span></label>
            <label><input type="radio" name="requestType" value="ADDITIONAL" data-act="request-type"${requestType === 'ADDITIONAL' ? ' checked' : ''} /><span><b>Additional request</b><small>Link new requirements to existing work.</small></span></label>
          </fieldset>
          <div class="request-form-grid" data-request-parent-wrap${requestType === 'ADDITIONAL' ? '' : ' hidden'}>
            ${field({ label: 'Related request ID', name: 'parentRequestId', required: requestType === 'ADDITIONAL' })}
            ${field({ label: 'Related request tracking code', name: 'parentTrackingCode', required: requestType === 'ADDITIONAL' })}
          </div>
        </section>

        <section class="request-form-section" aria-labelledby="request-event-title">
          <div class="request-form-section__head"><span>3</span><div><h2 id="request-event-title">Event and Sub-event</h2><p>Only approved source records appear in production.</p></div></div>
          <label class="field">Request purpose<select name="requestPurpose" data-act="request-purpose" required>
            <option value="">Select request purpose</option>
            <option value="EVENT_ACTIVITY_SUPPORT">Event or activity support</option>
            <option value="OFFICE_INVENTORY_PANTRY">Office inventory or pantry</option>
          </select></label>
          <div class="request-form-grid">
            <label class="field" data-request-event-field>Event<select name="eventSeries" data-act="request-series"><option value="">Select Event</option></select></label>
            <label class="field" data-request-event-field>Sub-event<select name="event"${subEvents.length ? '' : ' disabled'}><option value="">${subEvents.length ? 'Select Sub-event' : 'Select Event first'}</option>${subEvents.map((name) => `<option>${esc(name)}</option>`).join('')}</select></label>
            ${field({ label: 'Start date', name: 'startDate', type: 'date' })}
            ${field({ label: 'End date', name: 'endDate', type: 'date' })}
            <label class="field" data-request-office-field>Stock area<select name="stockArea"><option value="">Select stock area</option></select></label>
            <label class="field" data-request-office-field>Needed date<input name="neededDate" type="date" /></label>
          </div>
        </section>

        <section class="request-form-section" aria-labelledby="request-items-title">
          <div class="request-form-section__head"><span>4</span><div><h2 id="request-items-title">Requested venues, logistics, and equipment</h2><p>Every line starts For Review. Submission creates no reservation or stock movement.</p></div></div>
          <label class="field">Purpose or need<textarea name="purpose" maxlength="500" required></textarea></label>
          <div class="request-composer">
            <label class="field">Category<select name="lineCategory"><option>Logistics / Equipment</option><option>Venue / Facility</option><option>Inventory Item</option><option>Other</option></select></label>
            <label class="field request-composer__item">Approved or custom item<input name="lineDescription" placeholder="Name the requested item" maxlength="120" /></label>
            <label class="field">Quantity<input name="lineQuantity" type="number" min="1" max="100000" step="1" value="1" /></label>
            <label class="field">Unit<select name="lineUnit"><option>piece</option><option>set</option><option>pack</option><option>service</option></select></label>
            <label class="field request-composer__spec">Optional note or specification<textarea name="lineSpecification" maxlength="240"></textarea></label>
            <button class="btn" type="button" data-act="request-add-line">${icon('plus', 'icon--sm')}Add requested item</button>
          </div>
          <div class="request-draft" aria-live="polite"><div><h3>Requested items</h3><span>${requestDraft.length} item${requestDraft.length === 1 ? '' : 's'}</span></div><ul>${draftMarkup}</ul></div>
          ${notice({
            tone: 'info',
            title: 'Availability is confirmed after review',
            body: 'The public workflow does not expose authoritative stock counts. Routing and availability remain advisory until staff review.',
          })}
          <label class="request-ack"><input type="checkbox" name="dataUseAcknowledged" required /><span><b>Privacy</b><small>I understand how my information is used to review and track this request.</small></span></label>
          <label class="request-ack"><input type="checkbox" name="acceptableUseAcknowledged" required /><span><b>Acceptable use</b><small>I confirm this request is legitimate and accurate, and that submission does not reserve stock.</small></span></label>
          <label class="request-ack"><input type="checkbox" name="evidenceConsentAcknowledged" required /><span><b>Evidence and photos</b><small>I understand authorized staff may attach evidence or handoff photos to this request.</small></span></label>
          <button class="btn btn--primary" type="button" data-act="request-submit"${requestDraft.length ? '' : ' disabled'}>Submit request for review${icon('arrow-right')}</button>
        </section>
      </form>
    </section>
    <section id="request-track-panel" class="request-track-panel" role="tabpanel" aria-labelledby="request-track-tab"${requestMode === 'track' ? '' : ' hidden'}>
      <div><h2>Track Existing Request</h2><p>Enter the request ID and private tracking code from the submission receipt.</p></div>
      <form onsubmit="return false"><label class="field">Request ID<input name="requestSearch" autocomplete="off" required /></label><label class="field">Tracking code<input name="trackingCode" autocomplete="off" required /></label><button class="btn" type="button" data-act="request-track">${icon('search', 'icon--sm')}Search request</button></form>
      <div class="request-track-empty" role="status">No request has been loaded.</div>
    </section>`,
    { wide: true },
  );
}

/* ---------- 8. Public request tracking + receipt ---------- */

export function requestTracking({ state }) {
  if (state === 'empty') {
    return publicShell(
      `<div class="public__head"><h1>Track a submission</h1>
        <p>Enter the request ID and private tracking code from your receipt.</p></div>
      <form class="form-grid" onsubmit="return false">
        ${field({ label: 'Request ID', name: 'ref', required: true })}
        ${field({ label: 'Tracking code', name: 'trackingCode', required: true })}
        <button class="btn btn--primary" type="submit">${icon('search')}Track</button>
      </form>
      ${notice({
        tone: 'info',
        title: 'No reference number?',
        body: 'We cannot look up submissions by name for privacy reasons. Check the confirmation you received when you submitted.',
      })}`,
    );
  }

  if (state === 'success') {
    return publicShell(
      `<div class="public__head"><h1>Request submitted</h1>
        <p>Keep this reference. It is the only way to track this request.</p></div>
      ${receipt({
        ref: 'Recorded request',
        title: 'Submission receipt',
        lines: [
          { label: 'Submitted', value: 'Recorded by the authorized service' },
          { label: 'Reference', value: 'Use the private receipt shown after submission' },
          { label: 'Status', value: 'Load with the private tracking code' },
        ],
        footer: notice({
          tone: 'info',
          title: 'Stock has not been reserved',
          body: 'Reservation happens only after the Department of Logistics accepts your request.',
        }),
      })}
      <div style="display:flex;gap:8px;margin-top:20px">
        <a class="btn" href="#/public.request-tracking">Track this request</a>
        <a class="btn btn--quiet" href="#/public.landing">Back to portals</a>
      </div>`,
    );
  }

  return publicShell(
    `<div class="public__head"><h1>Request status</h1>
      <p>Verified request details load only after a private tracking check.</p></div>
    <div class="panel"><div class="panel__body" style="display:grid;gap:24px">
      <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
        <span class="muted" style="font-size:var(--t-sm)">No request is loaded.</span>
      </div>
      ${timeline([
        { title: 'Request not loaded', meta: 'Enter the request ID and private tracking code', current: true },
      ])}
      ${facts([
        { label: 'Request', value: 'Not loaded' },
        { label: 'Status', value: 'Not loaded' },
        { label: 'Purpose', value: 'Not loaded' },
      ])}
      ${notice({
        tone: 'info',
        title: 'What you need to do next',
        body: 'Use the private tracking form to load an authorized status response.',
      })}
    </div></div>`,
  );
}

/* ---------- 9. Public lending intake ---------- */

export const lendingIntake = () =>
  publicShell(
    `<div class="public__head">
      <h1>Borrow equipment</h1>
      <p>Borrowing is a loan with a return date. Some items require approved borrower identity evidence before handoff.</p>
    </div>
    ${stepper(['Who is borrowing', 'What and when', 'Review'], 0)}
    <form class="form-grid" onsubmit="return false">
      <fieldset>
        <legend>Borrower</legend>
        <div style="display:grid;gap:16px">
          ${field({ label: 'Borrower name', name: 'borrowerName', required: true })}
          ${field({ label: 'Borrowing organisation', name: 'org', required: true })}
          ${field({ label: 'You are a', name: 'k', options: ['USC officer', 'USC staff', 'Angelite student'], required: true })}
          ${field({ label: 'Student or institutional ID', name: 'studentId', required: true })}
          ${field({ label: 'Course and year', name: 'courseYear', required: true })}
          ${field({ label: 'Academic department', name: 'academicDepartment', required: true })}
          ${field({ label: 'USC department or office', name: 'uscDepartment', options: ['Select department'], required: true })}
          ${field({ label: 'Contact number', name: 'contactNumber', type: 'tel', required: true })}
          ${field({ label: 'Email', name: 'email', type: 'email', required: true })}
        </div>
      </fieldset>
      <fieldset>
        <legend>Loan</legend>
        <div style="display:grid;gap:16px">
          <div class="form-row">
            ${field({ label: 'Item', name: 'i', options: ['Projector and screen', 'Portable PA system', 'Tent, 10 × 10', 'Megaphone'] })}
            ${field({ label: 'Quantity', name: 'quantity', type: 'number', value: '1', required: true })}
            ${field({ label: 'Pickup date', name: 'pickupDate', type: 'date', required: true })}
            ${field({ label: 'Return by', name: 'r', type: 'date', required: true })}
          </div>
          ${field({ label: 'Purpose', name: 'purpose', textarea: true, required: true })}
        </div>
      </fieldset>
      <label class="request-ack"><input type="checkbox" name="dataUseAcknowledged" required /><span><b>Privacy</b><small>I understand how my information is used to review and track this lending request.</small></span></label>
      <label class="request-ack"><input type="checkbox" name="acceptableUseAcknowledged" required /><span><b>Acceptable use</b><small>I will use borrowed items only for the approved purpose.</small></span></label>
      <label class="request-ack"><input type="checkbox" name="borrowerResponsibilityAcknowledged" required /><span><b>Borrower responsibility</b><small>I accept responsibility for custody, condition, and timely return.</small></span></label>
      <label class="request-ack"><input type="checkbox" name="evidenceConsentAcknowledged" required /><span><b>Evidence and photos</b><small>I understand authorized staff may record identity or handoff evidence.</small></span></label>
      <button class="btn btn--primary" type="submit">Review and submit</button>
    </form>`,
  );

/* ---------- 10. Public lending tracking ---------- */

export function lendingTracking({ state } = {}) {
  if (state === 'empty') {
    return publicShell(
      `<div class="public__head"><h1>Track a lending submission</h1>
        <p>Enter the submission ID and private tracking code from your receipt.</p></div>
      <form class="form-grid" onsubmit="return false" data-v5-lending-track>
        ${field({ label: 'Submission ID', name: 'submissionId', required: true })}
        ${field({ label: 'Tracking code', name: 'trackingCode', required: true })}
        <button class="btn btn--primary" type="submit">${icon('search')}Track</button>
      </form>
      ${notice({
        tone: 'info',
        title: 'Private lookup',
        body: 'For privacy, a lending submission cannot be found by borrower name or email.',
      })}`,
    );
  }
  return publicShell(
    `<div class="public__head"><h1>Loan tracking</h1><p>Verified lending details load after a private lookup.</p></div>
    <div class="panel"><div class="panel__body" style="display:grid;gap:24px">
      <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
        <span class="chip">NOT LOADED</span>
      </div>
      ${timeline([
        { title: 'Lending record not loaded', meta: 'Enter the submission ID and private tracking code', current: true },
      ])}
      ${notice({
        tone: 'info',
        title: 'Private lookup required',
        body: 'A lending record is shown only after its private tracking code is verified.',
      })}
      ${facts([
        { label: 'Submission', value: 'Not loaded' },
        { label: 'Status', value: 'Not loaded' },
        { label: 'Items', value: 'Not loaded' },
      ])}
    </div></div>`,
  );
}

/* ---------- 11. Privacy / acceptable use ---------- */

export const policy = () =>
  publicShell(
    `<div class="public__head"><h1>Privacy Notice and Acceptable Use</h1>
      <p>What we record when you use the public portals, and what you agree to.</p></div>
    <div class="panel"><div class="panel__body" style="display:grid;gap:20px">
      <section>
        <h2 style="font-size:var(--t-md);font-weight:700">What we record</h2>
        <p class="muted" style="font-size:var(--t-sm);margin-top:6px">Your organisation, what you requested, when you need it, and the decisions staff make. Identity or handoff evidence recorded by authorized staff is stored privately and is never shown on public pages.</p>
      </section>
      <section>
        <h2 style="font-size:var(--t-md);font-weight:700">What we do not do</h2>
        <p class="muted" style="font-size:var(--t-sm);margin-top:6px">We do not look up submissions by name, publish borrower identity, or expose internal notes, stock levels, supplier records, or audit history on public pages.</p>
      </section>
      <section>
        <h2 style="font-size:var(--t-md);font-weight:700">Corrections</h2>
        <p class="muted" style="font-size:var(--t-sm);margin-top:6px">Records that affect custody are corrected by adding a reversal, never by deleting history. Ask the Department of Logistics if something is wrong.</p>
      </section>
      <label style="display:flex;gap:10px;align-items:flex-start;padding-top:8px;border-top:1px solid var(--line)">
        <input type="checkbox" style="margin-top:3px" />
        <span style="font-size:var(--t-sm)">I have read the Privacy Notice and agree to the Acceptable Use terms.</span>
      </label>
      <button class="btn btn--primary" type="button" style="justify-self:start">Acknowledge and continue</button>
    </div></div>`,
  );
