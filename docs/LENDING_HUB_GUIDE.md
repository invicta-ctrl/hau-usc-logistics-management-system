# Office Lending Hub guide

## Create a ticket

1. Choose the borrower type: USC Officer/Staff or Angelite/Student.
2. Enter the Student ID as one to eight digits. Letters, symbols, and longer values are
   rejected.
3. Search inventory by item name, ID, alias, category, stock area, handling, or unit, then
   select a visible suggestion. Typed text alone cannot create an item identity.
4. Review the audience, available-to-promise quantity, handling, maximum quantity, and due
   date explanation. Enter purpose and quantity, then create the `FOR_REVIEW` ticket.

Browser explanations are not authorization. The server rechecks item status, verification
flags, audience, quantity limits, stock, borrower eligibility, and current ticket state.

## Review and identity verification

An authorized reviewer must attest the approved source before a ticket becomes
`READY_TO_CLAIM`:

- USC Officer/Staff uses the approved active USC source. An email domain alone is never
  sufficient.
- Angelite/Student uses the approved identity rule.

The verification source, reviewer, and time are retained in append-only history and audit
metadata. The reviewer cannot bypass current capability checks from the interface.

## Lifecycles

Loanable items follow:

`FOR_REVIEW -> READY_TO_CLAIM -> ON_LOAN -> OVERDUE -> RETURNED`

`OVERDUE` is derived when an open loan passes its due date; return remains the resolving
action. Consumables follow:

`FOR_REVIEW -> READY_TO_CLAIM -> ISSUE -> COMPLETED`

## Handoff and return

- Handoff rechecks approval, borrower eligibility, item audience, stock, reservation, due
  date, capability, and ticket revision.
- Loan handoff creates the controlled stock movement and active circulation state.
- Consumable issue completes after its controlled handoff.
- Return records the inbound movement and closes the circulation state.
- Idempotency, locking, expected revision, and terminal-state checks prevent duplicate
  handoff or return.

Never correct a loan by editing a posted ledger row. Use the authorized workflow or the
documented corrective process so movement and audit history remain append-only.
