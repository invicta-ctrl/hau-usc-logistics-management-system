/* Public and pre-authentication surfaces.
   Calmer, narrower, larger than internal. One action per screen.
   Nothing here exposes protected stock, internal notes, roster data,
   supplier evidence, or audit internals. */

import { icon } from '../icons.js';
import { heroPoster } from './hero-poster.js';
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

const marks = `<span class="public__marks" aria-label="USC and Department of Logistics">
  <span class="public__mark public__mark--usc"><img src="/brand/usc-logo" alt="USC" /></span>
  <span class="public__mark public__mark--dol"><img src="/brand/dol-logo" alt="Department of Logistics" /></span>
</span>`;
const landingIdentity = `<a class="landing-brand" href="#/public.landing" aria-label="HAU-USC home">
  <span class="landing-brand__crest"><img src="/brand/usc-logo" alt="USC" /></span>
  <span class="landing-brand__usc"><b>University Student Council</b><span>Holy Angel University</span></span>
  <span class="landing-brand__department"><span class="landing-brand__divider" aria-hidden="true"></span><img src="/brand/dol-logo" alt="Department of Logistics" /><span>Department of<br />Logistics</span></span>
</a>`;
const landingFooterIdentity = `<div class="landing-footer__identity"><span class="landing-footer__crest"><img src="/brand/usc-logo" alt="USC" /></span><span><b>University Student Council</b><small>Holy Angel University</small></span></div>`;
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
  { wide = false, back = true, dark = publicDark, landing = false, signin = false, dataLabel = true } = {},
) {
  return `<div class="public${landing ? ' public--landing' : ''}${signin ? ' public--signin' : ''}">
    <header class="public__bar">
      <div class="public__brand">${
        landing
          ? landingIdentity
          : `${marks}
        <span class="public__wordmark"><b>Holy Angel University Student Council</b><span>Department of Logistics</span></span>
      `
      }</div>
      ${
        landing
          ? `<nav class="public__navigation" aria-label="Public navigation">
              <a href="#/public.landing" aria-current="page">Home</a>
              <a href="#/public.landing" data-act="scroll-to-logistics">Logistics hub</a>
            </nav>`
          : ''
      }
      <div class="public__bar-actions">
        ${themeToggle(dark)}
        ${landing ? '<a class="public__signin-link" href="#/public.signin">Staff sign in</a>' : back ? backControl() : ''}
        ${
          landing
            ? `<details class="public__compact-nav"><summary aria-label="Open public navigation">${icon('menu')}</summary><nav aria-label="Compact public navigation"><a href="#/public.landing" aria-current="page">Home</a><a href="#/public.landing" data-act="scroll-to-logistics">Logistics hub</a><a href="#/public.signin">Staff sign in</a></nav></details>`
            : ''
        }
      </div>
    </header>
    <main class="public__main${wide ? ' public__main--wide' : ''}" id="surface-main" tabindex="-1">${dataLabel ? serviceDataLabel : ''}${inner}</main>
    ${
      landing
        ? `<footer class="public__foot public__foot--landing" aria-label="Site footer">
            ${landingFooterIdentity}
            <p class="landing-footer__motto">Laus Deo Semper</p>
            <nav class="landing-footer__group" aria-label="Services"><p>Services</p><a href="#/public.landing" data-act="scroll-to-logistics">Logistics hub <span>Open</span></a></nav>
            <nav class="landing-footer__group" aria-label="Access"><p>Access</p><a href="#/public.request-intake">Start a logistics request</a><a href="#/public.signin">Staff sign in</a><a class="landing-footer__policy" href="#/public.policy">Privacy Notice and Acceptable Use</a></nav>
            <p class="landing-footer__place">Holy Angel University <span aria-hidden="true">·</span> Angeles City, Pampanga</p>
          </footer>`
        : `<footer class="public__foot">
            <p class="public__foot-line">Every item moves with a record.</p>
            <div class="public__foot-meta"><span>HAU-USC <span aria-hidden="true">·</span> © 2026–2027</span><a href="#/public.policy">Privacy Notice and Acceptable Use</a></div>
          </footer>`
    }
  </div>`;
}

/* ---------- 1. Portal landing ---------- */

function landingAnnouncementPresentation(state) {
  if (state === 'loading') {
    return {
      title: 'Loading official updates',
      summary: 'Please wait while published USC updates are retrieved.',
    };
  }
  if (state === 'error') {
    return {
      title: 'Updates are temporarily unavailable',
      summary: 'Core public destinations remain available. Please check the official USC page for updates.',
    };
  }
  if (state === 'media-failure') {
    return {
      title: 'Official USC updates',
      summary: 'The published update is available, but its media could not be loaded.',
      status:
        'The published media could not be loaded. The update remains available through its official link. Core public destinations are unaffected.',
    };
  }
  if (state === 'populated') {
    return {
      title: 'Official USC updates',
      summary: 'Authorized announcements appear here only after the official service publishes them.',
    };
  }
  return {
    title: 'Official USC updates',
    summary:
      'No published updates are currently available. Announcements appear here only after the official service publishes them.',
  };
}

export function landing({ state } = {}) {
  const advertisementState = ['loading', 'populated', 'empty', 'error', 'media-failure'].includes(state)
    ? state
    : 'loading';
  const announcement = landingAnnouncementPresentation(advertisementState);
  return publicShell(
    `<section class="landing-hero" aria-labelledby="landing-title">
      <div class="landing-hero__media-slot" aria-hidden="true"><img class="landing-hero__institutional-media" src="${heroPoster}" alt="" /></div>
      <div class="landing-hero__content">
        <p class="landing-hero__eyebrow">HAU-USC · Institutional Logistics Ledger</p>
        <h1 id="landing-title">Every request. Every handoff. On record.</h1>
        <p>HAU-USC Logistics coordinates equipment and supply services through a governed record—from first request to confirmed return.</p>
        <div class="landing-hero__actions">
          <a class="btn btn--primary" href="#/public.request-intake">Start a logistics request${icon('arrow-right')}</a>
          <a class="landing-link" href="#/public.lending-intake">Browse public lending${icon('arrow-right', 'icon--sm')}</a>
        </div>
        <p class="landing-hero__utility"><a href="#/public.request-tracking">Track request</a><a href="#/public.signin">Staff sign in</a></p>
      </div>
    </section>

    <section class="landing-current" data-advertisement-state="${advertisementState}" aria-busy="${advertisementState === 'loading'}" aria-labelledby="landing-current-title">
      <div class="landing-section-head"><p class="eyebrow">Current</p><h2 id="landing-current-title">What the council is doing now</h2></div>
      <div class="landing-current__grid">
        <div class="landing-current__visual"><span>Official public updates</span><div class="landing-updates__media-slot" hidden></div></div>
        <article class="landing-current__card"><p class="eyebrow">Current production snapshot</p><h3>${announcement.title}</h3>
          <p class="landing-current__summary" aria-live="polite">${announcement.summary}</p>${
            announcement.status
              ? `
          <p class="landing-current__status" role="status">${announcement.status}</p>`
              : ''
          }<a class="landing-current__official" href="https://www.facebook.com/holyangeluniversitysc" target="_blank" rel="noopener noreferrer">View official page${icon('arrow-right', 'icon--sm')}</a></article>
      </div>
    </section>

    <section class="landing-hub" id="logistics" tabindex="-1" aria-labelledby="landing-hub-title">
      <div class="landing-section-head landing-section-head--dark"><p class="eyebrow">Open now</p><div><h2 id="landing-hub-title">The Logistics hub</h2><p>The council’s only specialised service currently running</p></div></div>
      <div class="landing-hub__grid">
        <div class="landing-hub__service"><div class="landing-hub__identity"><img src="/brand/dol-logo" alt="" /><span><b>Department of Logistics</b><small>University Student Council</small></span></div><p>Equipment and supplies for council activities. Ask for what an activity needs, borrow reusable items with an agreed return date, and see where your request stands.</p>
          <nav class="landing-hub__actions" aria-label="Logistics actions"><a class="landing-hub__action landing-hub__action--primary" href="#/public.request-intake"><b>Start a request</b><small>Authorized intake for an activity, office or committee need.</small></a><a class="landing-hub__action" href="#/public.lending-intake"><b>Browse equipment</b><small>See reusable items before signing in to act.</small></a><a class="landing-hub__action" href="#/public.request-tracking"><b>Track a request</b><small>Use your reference. No account needed.</small></a><a class="landing-hub__action" href="#/public.signin"><b>Staff sign in</b><small>Open the authorized logistics workspace.</small></a></nav>
        </div>
        <ol class="landing-ledger" aria-label="Logistics request lifecycle"><li><span>01</span><div><b>Request</b><p>Someone states what is needed, what it is for, and when.</p></div></li><li><span>02</span><div><b>Review</b><p>The committee checks scope, stock and timing.</p></div></li><li><span>03</span><div><b>Reserve</b><p>Approved lines are held against inventory.</p></div></li><li><span>04</span><div><b>Release</b><p>Items are handed over and the handover is recorded.</p></div></li><li><span>05</span><div><b>Return</b><p>Borrowed items come back and their condition is noted.</p></div></li><li><span>06</span><div><b>Ledger</b><p>Every step is recorded; the evidence is permanent.</p></div></li></ol>
      </div>
    </section>`,
    { back: false, wide: true, landing: true, dataLabel: false },
  );
}

/* ---------- 2. Sign in ---------- */

export function signin({ state }) {
  const invalid = state === 'error';
  const unavailable = state === 'unavailable';
  return publicShell(
    `<div class="auth-card auth-card--signin">
      <p class="auth-card__eyebrow">Department of Logistics</p>
      <h1>Staff sign in</h1>
      <p>Access the logistics workspace. The authorized account record determines what you can view and do.</p>
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
        ${field({
          label: 'Identifier',
          name: 'u',
          required: true,
          value: invalid ? 'logistics.office' : '',
          placeholder: 'Username, account code, or email',
        })}
        ${field({
          label: 'Password',
          name: 'p',
          type: 'password',
          required: true,
          autocomplete: 'current-password',
          passwordVisibility: true,
          error: invalid ? 'Enter your password to continue.' : '',
        })}
        <button class="btn btn--primary" type="submit"${
          state === 'loading' ? ' data-state="loading" disabled' : ''
        }>${icon('lock')}${state === 'loading' ? 'Signing in…' : 'Sign in'}</button>
      </form>
      <p class="auth-card__help">If you have trouble signing in, contact your system administrator.</p>
      <p class="auth-alt"><a href="#/public.landing">Return to public front door</a><span aria-hidden="true"> · </span><a href="#/public.application">Apply for access</a></p>
    </div>`,
    { signin: true },
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
        ${field({ label: 'Password', name: 'p', type: 'password', required: true, autocomplete: 'new-password', passwordVisibility: true, hint: 'At least 12 characters.' })}
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
      <p>Start with your approved institutional email, then enter the eight-digit code when you receive it.</p>
      <div class="fi03-result" data-fi03-result hidden aria-live="polite"></div>
      <p class="auth-alt">Email verification only confirms this step. It does not approve or activate an account.</p>
    </div>`,
  );

/* ---------- 5. Account application ---------- */

export const application = () =>
  publicShell(
    `<div class="public__head">
      <h1>Apply for access</h1>
      <p>Tell us who you are and what you need to do. A Department of Logistics administrator reviews every application.</p>
    </div>
    ${stepper(['Email verification', 'Application', 'Review'], 1)}
    <div class="fi03-result" data-fi03-result hidden aria-live="polite"></div>
    <p class="fi03-flow-note">Verification, administrator review, Director approval, and account activation are separate steps.</p>`,
  );

/* ---------- 6. Application status ---------- */

export const applicationStatus = () =>
  publicShell(
    `<div class="public__head">
      <h1>Application status</h1>
      <p>Use the private status token issued after submission. It is never placed in a URL.</p>
    </div>
    <div class="fi03-result" data-fi03-result hidden aria-live="polite"></div>
    <p class="fi03-flow-note">A status check does not reveal protected review details or change an application.</p>`,
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
        {
          title: 'Request not loaded',
          meta: 'Enter the request ID and private tracking code',
          current: true,
        },
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
        {
          title: 'Lending record not loaded',
          meta: 'Enter the submission ID and private tracking code',
          current: true,
        },
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
