/* Public and pre-authentication surfaces.
   Calmer, narrower, larger than internal. One action per screen.
   Nothing here exposes protected stock, internal notes, roster data,
   supplier evidence, or audit internals. */

import { icon } from '../icons.js';
import {
  backControl,
  chip,
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
const illustrativeDataLabel = `<p class="preview-data-label" role="note">Illustrative preview data <span aria-hidden="true">·</span> no live record</p>`;

/* Public surfaces are plain render functions with no context argument, so the
   shell reads the current theme from here. app.js sets it before each render.
   Only the toggle's accessible name and pressed state depend on it — the icon
   itself is switched by CSS from [data-theme]. */
let publicDark = false;
export function setPublicTheme(dark) {
  publicDark = !!dark;
}

export function publicShell(inner, { wide = false, back = true, dark = publicDark } = {}) {
  return `<div class="public">
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
    <main class="public__main${wide ? ' public__main--wide' : ''}" id="surface-main" tabindex="-1">${illustrativeDataLabel}${inner}</main>
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
    `<div class="public__head">
      <h1>Every logistics request starts here.</h1>
      <p>Choose the route that matches the work. We give every submission a reference number so its status stays visible.</p>
    </div>
    <ol class="portal-route" aria-label="Submission route">
      <li><span>01</span><b>Choose a portal</b></li>
      <li><span>02</span><b>Submit the details</b></li>
      <li><span>03</span><b>Track the reference</b></li>
    </ol>
    <div class="portal-grid">
      <a class="portal-card" href="#/public.request-intake">
        <span class="portal-card__mark">${icon('clipboard')}</span>
        <b>Request items or materials</b>
        <span>For events, office needs, and catalog restock.</span>
      </a>
      <a class="portal-card" href="#/public.lending-intake">
        <span class="portal-card__mark">${icon('repeat')}</span>
        <b>Borrow equipment</b>
        <span>Library-style lending with a return date.</span>
      </a>
      <a class="portal-card" href="#/public.request-tracking">
        <span class="portal-card__mark">${icon('search')}</span>
        <b>Track a submission</b>
        <span>Check status using your reference number.</span>
      </a>
      <a class="portal-card" href="#/public.signin">
        <span class="portal-card__mark">${icon('lock')}</span>
        <b>Staff sign in</b>
        <span>For Department of Logistics staff and officers.</span>
      </a>
    </div>`,
    { back: false },
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
        <button class="btn" type="button">Resend confirmation</button>
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
      <button class="btn btn--primary" type="submit">Continue to review</button>
    </form>`,
  );

/* ---------- 6. Application status ---------- */

export const applicationStatus = () =>
  publicShell(
    `<div class="public__head">
      <h1>Application status</h1>
      <p>Reference <b>APP-DEMO-214</b></p>
    </div>
    <div class="panel"><div class="panel__body">
      ${timeline([
        { title: 'Application received', meta: '3 May 2032', done: true },
        { title: 'Email confirmed', meta: '3 May 2032', done: true },
        { title: 'Administrator review', meta: 'In progress', current: true },
        { title: 'Director decision', meta: 'Not started' },
        { title: 'Access activated', meta: 'Not started' },
      ])}
      ${notice({
        tone: 'info',
        title: 'What happens next',
        body: 'An administrator checks your identity against the protected directory. If it does not match exactly, the application waits for manual review rather than being approved automatically.',
      })}
    </div></div>`,
  );

/* ---------- 7. Public request intake ---------- */

export function requestIntake({ state }) {
  const invalid = state === 'error';
  return publicShell(
    `<div class="public__head">
      <h1>Request items or materials</h1>
      <p>Submitting a request does not reserve or deduct stock. The Department of Logistics reviews each line and decides how it will be fulfilled.</p>
    </div>
    ${stepper(['Who and when', 'What you need', 'Review and submit'], 1)}
    ${
      invalid
        ? notice({
            tone: 'alert',
            title: 'Two fields need attention',
            body: 'Nothing has been submitted yet. Fix the highlighted fields and try again.',
          })
        : ''
    }
    <form class="form-grid" onsubmit="return false">
      <fieldset>
        <legend>Request details</legend>
        <div style="display:grid;gap:16px">
          <div class="form-row">
            ${field({ label: 'Requesting organisation', name: 'org', required: true, value: 'USC Executive Board' })}
            ${field({
              label: 'Date needed',
              name: 'd',
              type: 'date',
              required: true,
              error: invalid ? 'Choose a date at least three working days from today.' : '',
            })}
          </div>
          ${field({
            label: 'Linked event',
            name: 'evt',
            options: ['Not linked', 'Aurora Commons Week · Route A', 'Aurora Commons Week · Route B', 'Lantern Forum'],
          })}
          ${field({
            label: 'Purpose',
            name: 'p',
            textarea: true,
            required: true,
            hint: 'Say what the items are for. Do not include personal or contact details.',
            error: invalid ? 'Tell us what the items will be used for.' : '',
          })}
        </div>
      </fieldset>
      <fieldset>
        <legend>Items requested</legend>
        <div style="display:grid;gap:16px">
          <div class="form-row">
            ${field({ label: 'Item', name: 'i1', value: 'Monobloc chair' })}
            ${field({ label: 'Quantity', name: 'q1', type: 'number', value: '40' })}
          </div>
          <button class="btn btn--sm" type="button">${icon('plus', 'icon--sm')}Add another item</button>
          ${notice({
            tone: 'info',
            title: 'Availability is confirmed after review',
            body: 'We do not show live stock counts on public portals. Your request is checked against authoritative stock during review.',
          })}
        </div>
      </fieldset>
      <button class="btn btn--primary" type="submit">Review and submit</button>
    </form>`,
  );
}

/* ---------- 8. Public request tracking + receipt ---------- */

export function requestTracking({ state }) {
  if (state === 'empty') {
    return publicShell(
      `<div class="public__head"><h1>Track a submission</h1>
        <p>Enter the reference number from your receipt.</p></div>
      <form class="form-grid" onsubmit="return false">
        ${field({ label: 'Reference number', name: 'ref', hint: 'For example, REQ-DEMO-431.' })}
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
        ref: 'REQ-DEMO-431',
        title: 'Submission receipt',
        lines: [
          { label: 'Submitted', value: '7 May 2032, 9:32 AM' },
          { label: 'Organisation', value: 'Illustrative Executive Council' },
          { label: 'Event', value: 'Aurora Commons Week · Route A' },
          { label: 'Items', value: '6 lines' },
          { label: 'Date needed', value: '19 May 2032' },
          { label: 'Status', html: chip('FOR_REVIEW') },
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
    `<div class="public__head"><h1>Request REQ-DEMO-431</h1>
      <p>Aurora Commons Week · Route A — submitted 7 May 2032</p></div>
    <div class="panel"><div class="panel__body" style="display:grid;gap:24px">
      <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
        ${chip('FOR_REVIEW')}<span class="muted" style="font-size:var(--t-sm)">Updated 2 hours ago</span>
      </div>
      ${timeline([
        { title: 'Submitted', meta: '7 May 2032, 9:32 AM', done: true },
        { title: 'Under review', meta: 'Each line is being routed', current: true },
        { title: 'Accepted and reserved', meta: 'Not started' },
        { title: 'Ready to release', meta: 'Not started' },
        { title: 'Released to you', meta: 'Not started' },
      ])}
      ${notice({
        tone: 'info',
        title: 'What you need to do next',
        body: 'Nothing right now. We will contact your organisation if a line needs more information.',
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
          ${field({ label: 'Borrowing organisation', name: 'org', required: true })}
          ${field({ label: 'You are a', name: 'k', options: ['USC officer', 'USC staff', 'Angelite student'] })}
          ${field({
            label: 'Identity evidence',
            name: 'ev',
            type: 'file',
            hint: 'Required for student borrowers. Uploaded evidence is private and is not shown publicly.',
          })}
        </div>
      </fieldset>
      <fieldset>
        <legend>Loan</legend>
        <div style="display:grid;gap:16px">
          <div class="form-row">
            ${field({ label: 'Item', name: 'i', options: ['Projector and screen', 'Portable PA system', 'Tent, 10 × 10', 'Megaphone'] })}
            ${field({ label: 'Return by', name: 'r', type: 'date', required: true })}
          </div>
        </div>
      </fieldset>
      <button class="btn btn--primary" type="submit">Review and submit</button>
    </form>`,
  );

/* ---------- 10. Public lending tracking ---------- */

export const lendingTracking = () =>
  publicShell(
    `<div class="public__head"><h1>Loan LOAN-DEMO-228</h1><p>Tent, 10 × 10 — requested 5 May 2032</p></div>
    <div class="panel"><div class="panel__body" style="display:grid;gap:24px">
      <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap">
        ${chip('READY_TO_CLAIM')}<span class="muted" style="font-size:var(--t-sm)">Claim by 14 May 2032</span>
      </div>
      ${timeline([
        { title: 'Requested', meta: '5 May 2032', done: true },
        { title: 'Reviewed and approved', meta: '6 May 2032', done: true },
        { title: 'Ready to claim', meta: 'Bring your approved identity evidence', current: true },
        { title: 'Handed over', meta: 'Not started' },
        { title: 'Returned', meta: 'Not started' },
      ])}
      ${notice({
        tone: 'progress',
        title: 'Bring identity evidence to the handoff',
        body: 'Student borrowers must present the same approved evidence recorded on this loan. Staff confirm receipt at handoff.',
      })}
      ${facts([
        { label: 'Return by', value: '14 May 2032' },
        { label: 'Pickup point', value: 'Department of Logistics office' },
      ])}
    </div></div>`,
  );

/* ---------- 11. Privacy / acceptable use ---------- */

export const policy = () =>
  publicShell(
    `<div class="public__head"><h1>Privacy Notice and Acceptable Use</h1>
      <p>What we record when you use the public portals, and what you agree to.</p></div>
    <div class="panel"><div class="panel__body" style="display:grid;gap:20px">
      <section>
        <h2 style="font-size:var(--t-md);font-weight:700">What we record</h2>
        <p class="muted" style="font-size:var(--t-sm);margin-top:6px">Your organisation, what you requested, when you need it, and the decisions staff make. Identity evidence you upload for lending is stored privately and is never shown on public pages.</p>
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
