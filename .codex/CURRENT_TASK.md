# Current Task

INTENT: SOFTWARE_FEATURE
SECONDARY INTENTS: PRIVACY_REVIEW, TESTING, STAGING_ACCEPTANCE, RELEASE
MODE: execute
TARGET: HAU-USC Logistics v0.7.0 Phase 20 Privacy, Consent, and Support
SKILLS: lean-ctx, browser:control-in-app-browser
AUTHORITY: autonomous Phase 18–29 master prompt; `.codex/specs/v0.7.0-production-master.md`; accepted amendments; repository invariants
RISK: high
DELIVERABLE: accessible production-ready privacy, acceptable-use, consent, correction, retention, and support content across public requester and borrower workflows
VERIFICATION: content/source audit; public and authenticated surface tests; privacy/error/URL/log/screenshot/receipt/unauthorized-response review; repository gate; deployed desktop/mobile acceptance; exact-head CI
STOP CONDITIONS: invented institutional policy or contact; private-data exposure; weakened tracking/auth; inaccessible consent; unresolved P0/P1; production mutation

## Active Phase 20 contract

- Provide accessible Privacy Notice and Acceptable Use content.
- Explain requester data use, borrower responsibility, evidence/photo consent,
  correction requests, retention expectations, and support/contact paths.
- Public requester and borrower surfaces must state what is collected, why it
  is collected, who reviews it, how private tracking works, what is retained,
  and how correction can be requested.
- No private data may appear in public errors, URLs, logs, screenshots,
  analytics, downloadable receipts, or unauthorized responses.
- Do not invent an institutional retention period, legal basis, email address,
  phone number, or office contact. Use an existing approved repository value or
  truthful role/path wording when a value is not yet approved.
- Production remains out of scope during the Phase 20 staging gate.

The primary agent is the only writer, credential handler, provider mutator,
migration executor, deployer, merger, tagger, release manager, and rollback
operator.

## Current execution checkpoint

- Phase 19: accepted on staging at exact runtime
  `f8b19f6be042c995ad0ae01f420d15ac191cfdad`; exact-head CI is 6 / 6.
- Staging: schema 28, six published brand slots, seven retained versions,
  lifecycle/audit reconciliation complete, synthetic owner disabled.
- Phase 20: active. Audit existing privacy/consent/support copy and private-data
  boundaries before editing.
- Production: untouched and prohibited.
