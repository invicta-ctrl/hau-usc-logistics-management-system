/**
 * StaffAccess — apply for staff access.
 *
 * WHY THIS IS NOT IN PublicFlows.tsx
 *
 * It used to be a fifth tab in the public portal, sitting beside Lending Center
 * and Request Center. That put a protected, account-creating path inside a
 * surface whose entire point is that it needs no account, and it contradicted
 * production: portal-navigation.js at c316e047 offers exactly four
 * destinations — Request Center, Lending Center, Staff sign in, and back to
 * portal selection. There is no public access-application view.
 *
 * In production the application is an `auth-card`
 * (src/visual/public-account-application.js). It belongs with the sign-in
 * surface, which is where this component is meant to render.
 *
 * The public portal now carries a Staff sign in hand-off instead, drawn so it
 * reads as leaving the portal rather than switching a tab in place.
 *
 * Nothing here submits, verifies, emails, or stores. It is a design fixture.
 */

type Props = {
  /** Called when the applicant continues to the real sign-in surface. */
  onContinue: () => void;
  /** Called to return to the public portals. */
  onBack?: () => void;
};

export default function StaffAccess({ onContinue, onBack }: Props) {
  return (
    <section className="panel glass" aria-labelledby="staffAccessTitle">
      <p className="eye">Staff access</p>
      <h1 id="staffAccessTitle">Apply for staff access</h1>
      <p>
        Staff access is the one path here that is genuinely protected. Public request and public
        lending are not — they need no account, no activation, and no approval.
      </p>

      <div className="grid">
        <label>
          Institutional identifier
          <input placeholder="Authorized identifier" autoComplete="off" />
        </label>
        <label>
          Committee or office
          <input autoComplete="organization" />
        </label>
        <label className="span2">
          Requested work scope
          <select defaultValue="">
            <option value="">Choose scope</option>
            <option>Requests</option>
            <option>Inventory and receiving</option>
            <option>Release Desk</option>
          </select>
        </label>
        <label className="span2">
          Reason
          <textarea rows={3} maxLength={500} />
        </label>
      </div>

      <div className="row">
        <button type="button" className="primary" onClick={onContinue}>
          Continue to staff sign-in
        </button>
        {onBack && (
          <button type="button" onClick={onBack}>
            Back to the public portals
          </button>
        )}
      </div>

      <p className="consequence">
        Roles and capabilities come from authorized account records. Applicants cannot choose
        administrator access, and submitting this form grants nothing on its own.
      </p>
    </section>
  );
}
