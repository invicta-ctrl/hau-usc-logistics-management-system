# v0.7.2 Account Application and Approval Guide

Status: repository candidate; live use begins only after email-provider and
pre-production acceptance pass.

## Applicant flow

1. Verify the approved email through the live-delivered one-time code.
2. Select the correct approved identity class and affiliation.
3. Choose a policy-compliant username and password.
4. Review and submit. Save the one-time private status receipt securely.
5. Use the private receipt to view status, provide requested changes, or
   withdraw. Do not send the receipt through public channels.

## Administrator review

- Open Account Requests from the authenticated header.
- Review only the server-disclosed protected detail and redacted history.
- Confirm identity eligibility, affiliation, requested access, and conflicts.
- Approve for Director review, request changes, or reject with a bounded reason.
- Never approve your own later-stage decision or bypass a missing roster/provider
  check.

## Director and owner controls

- Director approval must be performed by an eligible actor distinct from the
  Administrator reviewer.
- System Owner override is exceptional, audited, reasoned, and cannot bypass
  failed identity/provider/configuration prerequisites.
- Activation creates starter access only after the approved application handoff
  reconciles. A failed reconciliation must not leave an authenticated session.

## Safety rules

- Applicant status is private and bearer-token protected.
- Email, profile, and roster data remain encrypted or redacted in ordinary
  responses and logs.
- Username conflict suggestions appear only after eligibility verification;
  identity conflicts stay generic.
- Use Access Management for later role/scope/session/credential operations and
  My Profile for permitted self-service changes.
