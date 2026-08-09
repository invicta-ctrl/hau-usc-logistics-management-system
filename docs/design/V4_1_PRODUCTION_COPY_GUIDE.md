# V4.1 Production Copy Guide

This guide applies the copy rules in the accepted
`.codex/specs/active/v0.7.3-frontend-design-integration.md` to the real
front end. Domain meaning, status semantics, permissions, fields, and service
contracts remain authoritative.

## Voice

- Headings are short, direct, and usually two to six words.
- Descriptions normally use one sentence of eight to eighteen words.
- Buttons name the action the user is taking.
- Errors say what happened, whether anything saved, and what to do next.
- Copy is operational and calm. It does not market, dramatize, or expose
  implementation detail.

## Terms kept

Request, Lending, Release, Inventory, Restocking, Receiving, Canvassing,
Procurement, Event, Sub-event, For Review, Ready to Release, Ready to Claim,
Overdue, Returned.

These words carry real workflow meaning and must not be replaced with vague
synonyms.

## Technical terms removed from ordinary UI

Backend, runtime, bootstrap, API, provider, D1, R2, Cloudflare, schema,
migration, canonical, reconciliation, binding, payload, idempotency,
projection, adapter, and Worker.

Owner-only diagnostics may retain precise technical detail after a plain
summary. Technical values remain available through data attributes and
accessible release labels where they are needed for verification; they are not
the ordinary visible copy.

## Applied production changes

| Previous wording | Production wording | Meaning preserved |
|---|---|---|
| Environment and backend identity strings | `Online` or `Test site` | Release identity remains in authoritative attributes and accessible detail |
| `Post LOAN_RETURN` | `Confirm return` | The same return service call and ledger event are used |
| `Confirm the physical return and post LOAN_RETURN to the ledger?` | `Confirm the physical return?` | The same accountable return confirmation remains required |
| `Back to portal selection` | `Back to portals` | Destination remains `/portals` |
| Directory-style portal introduction | `Request. Prepare. Release.` plus direct actions | All real public destinations remain reachable |

## Landing copy

- Identity: Holy Angel University / University Student Council.
- Headline: `Request. Prepare. Release.`
- Supporting sentence: names Request, Lending, and private tracking only.
- Primary action: `Open Request Center`.
- Secondary action: `Open Lending Center`.
- Quiet action: `Staff sign in`.
- Tracking guidance tells users to retain the private code shown after
  submission. No stock count, fake metric, or invented capability appears.

## Guardrails

- Raw enum values still pass through `src/domain/presentation-labels.js`.
- Request submission is never described as a reservation or stock deduction.
- Release and return language does not collapse distinct lifecycle states.
- Public copy never exposes protected inventory, borrower identity, supplier
  detail, staff records, or audit internals.
- Tests assert the new plain labels without removing contract, privacy, or
  workflow assertions.
