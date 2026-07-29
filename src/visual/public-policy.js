export const PUBLIC_POLICY_VERSION = '2026-07-28';

export function publicPolicyLinksMarkup() {
  return `<nav class="public-policy-links" aria-label="Privacy and acceptable use">
    <button type="button" data-public-policy-open="privacy">Privacy Notice</button>
    <button type="button" data-public-policy-open="acceptable-use">Acceptable Use</button>
  </nav>`;
}

export function publicPolicyDialogsMarkup() {
  return `<dialog class="public-policy-dialog" data-public-policy-dialog="privacy" aria-labelledby="publicPrivacyTitle">
    <div class="public-policy-dialog-head"><div><p class="eyebrow">HAU-USC Logistics</p><h2 id="publicPrivacyTitle">Privacy Notice</h2></div><button class="secondary mini" type="button" data-public-policy-close aria-label="Close Privacy Notice">Close</button></div>
    <section><h3>What is collected</h3><p>Request workflows collect the identity, organization or department, contact details, schedule, purpose, selected items, and other details you enter. Borrowing workflows also collect borrower classification, Student ID, course or role details, requested dates, and item quantities.</p></section>
    <section><h3>Why and who reviews it</h3><p>The information is used to identify the request, validate eligibility and source records, route work, review availability, coordinate a decision or handoff, and maintain accountable operational history. Only authorized HAU-USC and Department of Logistics staff and approvers assigned to the workflow may review private details.</p></section>
    <section><h3>Private tracking and public exposure</h3><p>A public logistics request receives a Request ID and a private tracking code shown once. The code is not placed in the URL or retained by this browser. Borrowing submissions receive a Submission ID and are reviewed privately; no public tracking code or internal ticket ID is issued. Do not post identifiers or tracking codes publicly.</p></section>
    <section><h3>Evidence and photos</h3><p>No public evidence is collected by these forms. If authorized staff later request a file or photo through a protected workflow, provide only relevant content you are authorized to share and obtain consent from identifiable people. Do not include unrelated IDs, secrets, or sensitive information.</p></section>
    <section><h3>Retention, correction, and support</h3><p>Submitted records, status history, acknowledgments, audit history, and any later protected evidence are retained as governed operational records. A specific institutional retention period has not been published in this application. To request a correction or support, contact the authorized Department of Logistics staff handling the request and quote only the Request ID or Submission ID; never send a private tracking code in a public channel.</p></section>
  </dialog>
  <dialog class="public-policy-dialog" data-public-policy-dialog="acceptable-use" aria-labelledby="publicAcceptableUseTitle">
    <div class="public-policy-dialog-head"><div><p class="eyebrow">HAU-USC Logistics</p><h2 id="publicAcceptableUseTitle">Acceptable Use</h2></div><button class="secondary mini" type="button" data-public-policy-close aria-label="Close Acceptable Use">Close</button></div>
    <ul>
      <li>Provide accurate details for a legitimate logistics or borrowing need and use only contact information you are authorized to provide.</li>
      <li>Do not impersonate another person, probe other requests, submit harmful content, or place passwords, secrets, private tracking codes, or unrelated sensitive data in free-text fields.</li>
      <li>Submission starts a review. It is not an approval, reservation, allocation, release, or guarantee of availability.</li>
      <li>Borrowers must follow eligibility, pickup, care, return, condition, and due-date instructions and promptly report loss, damage, or a needed correction to authorized logistics staff.</li>
      <li>Supporting files or photos may be provided only when requested through a protected workflow and only when the submitter has authority and any required consent.</li>
    </ul>
  </dialog>`;
}

export function bindPublicPolicyDialogs(root) {
  root.querySelectorAll('[data-public-policy-open]').forEach((button) =>
    button.addEventListener('click', () => {
      const dialog = root.querySelector(
        `[data-public-policy-dialog="${button.dataset.publicPolicyOpen}"]`,
      );
      if (dialog?.showModal) dialog.showModal();
      else dialog?.setAttribute('open', '');
    }),
  );
  root.querySelectorAll('[data-public-policy-dialog]').forEach((dialog) => {
    dialog.querySelector('[data-public-policy-close]')?.addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', (event) => {
      if (event.target === dialog) dialog.close();
    });
  });
}
