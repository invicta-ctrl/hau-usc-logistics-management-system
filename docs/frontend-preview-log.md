# HAU-USC Logistics - Frontend Visual Preview Log

**Earlier direct preview file:** `Index_Frontend_Visual_Preview_2026-07-11.html`  
**Current revision:** `Index_Frontend_Visual_Preview_Revision_02_2026-07-11.html`  
**Working variant:** `Index_Current_Prototype_Logo_Update_2026-07-11.html` with `?preview=1`  
**Status:** Draft visual preview - awaiting user review  
**Baseline:** `Index_Current_Prototype.html` remains unchanged

## Purpose

This file records visual changes that may be accepted, revised, or rejected before tomorrow's full implementation work. Codex must read this log before merging any preview work into the real project.

## Preview changes

- Added a visible **Front-end preview** banner that makes the demo-only state clear.
- Added an **Operational pulse** panel for requests needing review, blocked items, open loans, and pantry expiry.
- Added a **YDD 2026 readiness** panel with progress indicators for preparation, approvals, materials/food, and equipment/release.
- Added a four-step request pathway: Submit details, DOL reviews, Budget and approval, Fulfill and track.
- Kept the existing main navigation, branded hero, cards, request form, release desk, stock management, and dynamic logo system.
- Added preview-only mock data for inventory, requests, event tickets, loans, lead-time rules, and user access.
- Preview actions return demo messages and do not write to Google Sheets or the backend.
- The logo refinement remains included: no center separator, larger responsive containers, and optional high-resolution PNG support.

## Intentionally unchanged

- Current production HTML baseline
- Apps Script backend
- Google Sheets schema and data
- Authentication and authorization implementation
- Inventory ledger behavior
- Persistent loan/return implementation
- Actual PNG asset files
- Roadmap phase status

## Review decision

**Pending user review.** The user may classify this preview as:

- ACCEPT — preserve the direction for implementation.
- REVISE — keep the idea but change the visual treatment.
- REJECT — do not merge the preview; preserve the baseline and record the rejected elements below.

## If rejected or revised

Codex must not silently delete the preview. Update this section with:

- Decision date
- Accepted elements
- Rejected elements
- Reason for rejection or revision
- Baseline behavior that must remain
- Follow-up issue, if any

## Revision 02 — workflow and mobile corrections

**Preview file:** `Index_Frontend_Visual_Preview_Revision_02_2026-07-11.html`  
**Status:** Pending user review; the original preview remains preserved.  
**Decision:** Not accepted or rejected yet.

### Changes shown in this revision

- Removed requester-entered budget, budget PIC, budget date, estimated unit cost, and estimated request total.
- Changed the request pathway to: Submit details → DOL reviews → DOL canvasses → Fulfill and track.
- Restored a separate **Office Restock** request choice beside **Event Logistics**.
- Renamed and separated staff workflows: **Inventory Management System**, **Event Deliverables**, **Restocking**, **Register Product**, and **Canvassing**.
- Removed the visible Reorder Level concept from product registration, inventory rows, and overview wording.
- Kept Restocking for existing Product IDs and Register Product for new catalog items; both remain linked through the inventory ledger.
- Added an Event Deliverables confirmation flow: select a ticket, check received lines, confirm selected/all items, and record receiving officer, role, preview time, and remarks.
- Added a Canvassing tab with supplier/shop, location, item/specification, price, unit, receipt/invoice status, supplier TIN, evidence link, and notes.
- Added the MOTM receipt details at the top of Canvassing: Customer Name `HAU-USC`, Address `Angeles City`, TIN `000-772-540-00000`.
- Added mobile-safe Lending Hub controls: long ticket labels truncate safely, helper text no longer collides with controls, and return actions use full-width touch targets.

### Intentionally unchanged

- The original production prototype and the earlier visual preview file.
- Apps Script, Google Sheets, verified institutional access, and append-only ledger decisions.
- Actual backend persistence; all Revision 02 controls remain visual preview behavior only.
- Actual logo PNG assets; the separator-free, larger, high-resolution-ready logo treatment remains from the prior revision.
- DOF budget approval, procurement execution, and finance workflow implementation; these remain future work.
- Reorder-level backend/schema decisions; only the visible preview treatment was removed.

### Review handling for Codex

If the user accepts, preserve the workflow direction and implement it against the Apps Script/Sheets contracts. If the user revises or rejects it, record the decision date, accepted elements, rejected elements, reason, baseline behavior to restore, and follow-up issue here before changing the production prototype. Do not delete this revision.
