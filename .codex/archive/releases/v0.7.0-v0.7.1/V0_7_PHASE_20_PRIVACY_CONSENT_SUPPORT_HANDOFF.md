# v0.7.0 Phase 20 Privacy, Consent, and Support Handoff

Status: ACCEPTED ON STAGING — PRODUCTION UNTOUCHED

Accepted staging runtime: `4709e844f1bfcb0309cb1a2feeca2f66d9aeab89`

## Accepted scope

The public Lending Center and protected department Request Center now expose
accessible Privacy Notice and Acceptable Use dialogs. They explain collected
data, purpose, authorized reviewers, private tracking, borrower responsibility,
evidence/photo consent, governed retention, correction requests, and the
role-based Department of Logistics support path.

No institutional retention duration, email address, phone number, legal basis,
or named contact was invented. The notice truthfully states that a specific
institutional retention period is not published in the application and directs
users to the authorized logistics staff handling the request.

## Enforcement and privacy boundaries

- Public submissions require explicit privacy, acceptable-use, and
  evidence/photo acknowledgments; lending also requires general borrower
  responsibility. Item-specific acknowledgment remains separately governed.
- Server validation rejects omitted acknowledgments and records only the
  policy version and boolean acceptance in protected audit metadata.
- Public request tracking continues to require a Request ID plus a private code
  shown once. The code is not placed in a URL or retained by the browser.
- Public lending continues to expose only a Submission ID. It does not issue a
  public tracking code or internal ticket ID.
- Public errors remain bounded to known safe messages, field names, and a
  correlation ID. Unknown failures remain generic outside development.
- Structured logs redact contact, email, Student ID, credentials, secrets,
  tokens, tracking codes, provider identifiers, object keys, and matching
  values. No analytics integration was added.
- The authenticated downloadable request receipt contains no password,
  tracking code, email, phone number, Student ID, evidence, provider reference,
  or internal audit record.

## Verification

- `npm run check`: pass; 73 Vitest files / 474 tests plus governance, lint,
  deterministic generated artifacts, Apps Script parity, distribution checks,
  Cloudflare types, and deployment dry-run.
- Focused policy and observability coverage: 14 / 14 passed, including every
  required server acknowledgment and log redaction.
- Fresh local Worker/D1/R2 acceptance: 34 / 34 passed.
- Full responsive Playwright matrix: 127 passed / 311 intentional skips / zero
  failed.
- Exact-head PR #9 CI: 6 / 6 passed for the accepted runtime.
- Cache-busted staging health/readiness/version report STAGING, exact runtime,
  schema 28, migration 0028, connected D1/R2/static dependencies, and ready
  true.

## Deployed browser acceptance

- At 1440px, the live Lending Center opens both dialogs, renders all five
  Privacy Notice subjects and five Acceptable Use rules, and has no page-level
  overflow.
- At 390px, policy links and dialog controls remain visible, the Privacy Notice
  remains within the viewport, and dialog content has no horizontal overflow.
- An authorized department requester signed in at 390px, saw the required
  privacy/acceptable-use acknowledgment and both policy links, opened the
  Privacy Notice, and retained the no-tracking-input account boundary. The
  acceptance session was signed out afterward.
- No synthetic request or lending submission was created during deployed Phase
  20 acceptance, so no staging data cleanup was required.

## Boundary and next phase

Production was not deployed, migrated, seeded, promoted, merged, tagged, or
otherwise modified. Phase 20 passes. Continue directly to Phase 21: complete
the protected System Owner operational-health surface using safe, redacted
status only. Never reveal secrets, account identifiers, private provider IDs,
raw errors, object keys, OAuth values, or personal data.
