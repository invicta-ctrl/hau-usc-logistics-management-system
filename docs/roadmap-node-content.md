# HAU-USC Logistics Roadmap — Interactive Node Content

Use this file after importing `HAU_USC_Logistics_RoadmapSH_Improved_2026-07-11.txt` into roadmap.sh. The importer creates the canvas hierarchy; paste the matching section into each clickable node.

## How every active node should be used

Each active phase must show:

- Purpose and operational context
- Deliverables and acceptance checks
- Owner and supporting committee
- Dependencies and blockers
- Evidence links: GitHub milestone, issues, PRs, screenshots, tests, deployment, report, or signed decision
- Next action: one small implementation slice

Suggested effort labels: Small, Medium, Large. Suggested owners: DOL Director, Process Owner, Committee Head, Technical Maintainer, or joint ownership.

## Current implementation gate — July 11, 2026

- Capability audit classification: **FIX LATER**. The current HTML is a visual/workflow preview and is not yet merged into the production prototype.
- Current platform: verified institutional Google accounts/SSO with Google Apps Script and Google Sheets. Loans and returns must persist across devices; inventory remains an append-only ledger.
- Requesters do not enter budgets or prices. DOL reviews and canvasses first; any later DOF budget request and procurement approval are outside this current slice.
- Request Center paths: **Event Logistics** and **Office Restock**.
- Separate staff workflows: **Inventory Management System**, **Event Deliverables**, **Restocking**, **Register Product**, and **Canvassing**.
- Event Deliverables must let the requesting department check received lines and record who confirmed receipt, when, and with what remarks.
- Reorder Level is not a user-facing requirement; use availability and review status.
- Current preview file: `Index_Frontend_Visual_Preview_Revision_02_2026-07-11.html`.

## Operating model from the July 4 meeting

### Committee ownership

- Inventory Committee — office supplies, equipment, stock movement, lending, returns, pantry, and end-of-term inventory handoff to OSA.
- Food Committee — food requests and distribution to staff, judges, and guests.
- Materials Committee — material requests, canvassing, purchasing references, and supplier spreadsheet.
- Committee heads report summarized, agreed, factual information to the Director for Logistics.

### Lead-time rules

| Workflow | Lead time | Notes |
|---|---:|---|
| Major venue: PGN/SJH Auditorium, University Theater, Covered Court, IH Gymnasium, Piazza | 4 business weeks | Sunday and exam week do not count |
| PGN case rooms and other rooms | 2 business weeks | Sunday and exam week do not count |
| Materials bulk order | 3 business weeks | Request type must be explicit |
| Materials retail order | 1 business week | Request type must be explicit |
| Food bulk, non-perishable, catering | 2 business weeks | Request type must be explicit |
| Food perishable | 1 business week | Request type must be explicit |

The system must show the calculated due date, excluded dates, urgency state, and recovery action when a request is late or inside the lead time.

### Approval and financial trail

1. Project head/requester submits the event logistics or office-restock need without a budget field.
2. DOL reviews the request and canvasses supplier/item prices.
3. A later implementation phase may route a prepared budget request to DOF and USC approval before procurement.
4. The later finance trail uses PCV for items costing ₱300 or below and AS for ₱301 and above.
5. PCV/AS is used only when a vendor does not provide a sales invoice.
6. Sales receipts/invoices must contain the store name and TIN; customer name is HAU-USC and address is Angeles City unless the vendor requires otherwise.
7. Cash disbursement records include disbursement number, RFB control number, total amount, and signed undertaking.

## Phase node template

### Purpose
What operational problem this phase solves and why it is sequenced here.

### Deliverables

- [ ] One small GitHub issue exists for each deliverable.
- [ ] The responsible owner is named.
- [ ] Test data and expected behavior are defined.
- [ ] Evidence is linked after implementation.

### Definition of done

- [ ] Core workflow works for a realistic DOL scenario.
- [ ] Permission, data-integrity, and privacy behavior is tested.
- [ ] Mobile, keyboard, loading, empty, success, and error states are checked where relevant.
- [ ] Documentation and rollback notes are updated.

### Evidence

- GitHub milestone and issue links
- Before/after screenshots or recording
- Test output and UAT scenario results
- Staging or production URL
- Data reconciliation or report-freshness record
- Owner decision for accepted limitations

### Next action

Write one task using the format: `Inspect → Plan → Implement → Test → Review diff → Update status → Stop`.

## v0.1 — Safeguard, Process Model, and YDD Pilot

**Status:** CURRENT · **Owner:** Technical Maintainer + DOL Director · **Effort:** Medium

### Context

The July 4 minutes establish the real operating model. Before architecture changes, the prototype must be recoverable and the YDD 2026 work must be visible enough to prevent missed deadlines and overloaded staff.

### Checklist

- [ ] Tag the unchanged prototype and back up the Apps Script project and Sheets.
- [ ] Catalogue current pages, server functions, Sheet tabs, columns, formulas, triggers, and deployments.
- [ ] Map Food, Inventory, Materials, Director, Finance, USC President, project head, borrower, and maintainer responsibilities.
- [ ] Build the YDD task list with owner, date, event, dependency, status, and evidence.
- [ ] Record venue, materials, food, RFB, PCV, AS, receipt, and cash-disbursement rules.
- [ ] Record Jotform as the normal office in/out intake and paper strike as an emergency exception.

### Gate evidence

Baseline tag, backup, restore test, workflow map, responsibility matrix, YDD readiness board, risk register, smoke-test record.

## v0.2 — Modular Prototype and Workflow Shell

**Status:** NEXT · **Owner:** Technical Maintainer · **Effort:** Large

### Context

The prototype should become a set of understandable feature modules before authentication and database migration make changes expensive.

### Checklist

- [ ] Split requests, inventory, lending, releases, procurement, event tasks, admin, styles, utilities, and data services.
- [ ] Keep Apps Script behind an API adapter so the frontend does not depend directly on `google.script.run`.
- [ ] Add reusable form, table, status, confirmation, drawer, and help components.
- [ ] Preserve HAU-USC branding and improve predictive/fuzzy item search.
- [ ] Add baseline unit tests and a repeatable smoke-test script.

### Gate evidence

Module map, adapter contract, screenshots, test output, staging URL, and diff review.

## v0.3 — Verified Access and Simplified Administration

**Status:** PLANNED · **Owner:** Technical Maintainer + DOL Director · **Effort:** Large

### Context

The system serves DOL first and authorized USC departments second. Access must be determined by verified identity, active account, role, and department scope.

### Checklist

- [ ] Allow only exact active council accounts.
- [ ] Deny unknown and inactive accounts by default.
- [ ] Define role templates and department scopes.
- [ ] Enforce authorization in backend functions, then in Supabase RLS after migration.
- [ ] Add admin actions for activate, deactivate, role change, scope change, and review history.
- [ ] Test direct unauthorized calls and cross-department record access.

### Gate evidence

Permission matrix, positive/negative test results, access-denied screenshots, audit records, and admin walkthrough.

## v0.4 — Unified Logistics Request Desk

**Status:** PLANNED · **Owner:** DOL Director + Process Owners · **Effort:** Large

### Context

Venue, material, and food requests have different lead times and different reviewers. A single request desk should guide the requester while keeping DOL review, canvassing, later approval, and fulfillment separate. Office restock must be visible beside Event Logistics but remain its own request path.

### Checklist

- [ ] Create venue request fields and reservation lead-time rules.
- [ ] Create materials request fields for bulk and retail orders.
- [ ] Create food request fields for bulk, non-perishable, catering, and perishable orders.
- [ ] Calculate deadlines using business days, excluding Sunday and exam week.
- [ ] Add status history: submitted, needs revision, under review, DOL canvassing, later budget requested, finance checked, president approved, partially fulfilled, fulfilled, rejected, cancelled.
- [ ] Link requests to RFB records without allowing requesters to set approval fields.
- [ ] Prevent duplicate submissions with idempotency keys.

### Gate evidence

One complete venue scenario, one materials scenario, one food scenario, late-request behavior, approval timeline, and audit record.

## v0.5 — Inventory, Pantry, Lending, and Release Ledger

**Status:** PLANNED · **Owner:** Inventory Committee + Technical Maintainer · **Effort:** Large

### Context

The July 4 rule is simple: items entering or leaving the office must be requested and accounted for. The system must support normal intake while preserving an emergency paper-strike fallback. Event deliverables, restocking, and new-product registration must remain separate screens linked through request, event, product, supplier, and ledger references.

### Checklist

- [ ] Register products with generated or manual unique product IDs and opening stock.
- [ ] Add exact, name, variant, and fuzzy/predictive search.
- [ ] Record receipts, issues, loans, returns, event releases, adjustments, pantry additions, damage, loss, and overdue states as transactions.
- [ ] Require reason and permission for adjustments.
- [ ] Require borrower details and School ID confirmation.
- [ ] Support partial event releases and partial returns.
- [ ] Use green paper strike for USC officers/staff and pink paper strike for Angelites/non-USC only when the item is needed within minutes.
- [ ] Add a recipient-side event-deliverable confirmation: check individual lines, confirm all received, record receiving officer/role/time/remarks, and support partial receipt.
- [ ] Produce a price list for personal-use charges while keeping USC-event consumption on request workflows.

### Gate evidence

Ledger reconciliation, cross-device loan test, return test, partial-return test, paper-strike reconciliation, low-stock report, and end-of-term inventory export.

## v0.6 — Procurement, Food, and Finance Traceability

**Status:** PLANNED · **Owner:** Materials/Food Committees + Director · **Effort:** Medium/Large

### Context

Procurement must be defensible after the event. DOL supplier references and canvassing can be captured now; budget approval and procurement actions remain a later phase and should not be simulated as requester-entered values.

### Checklist

- [ ] Add the Canvassing tab with supplier, item, shop name, location, price, receipt/invoice availability, supplier TIN, evidence, and notes.
- [ ] Put the USC original-receipt information at the top of the Canvassing tab: HAU-USC, Angeles City, TIN 000-772-540-00000.
- [ ] Maintain supplier list and price history for council reference.
- [ ] Maintain food supplier catalogue and timing guidance.
- [ ] Validate PCV, AS, sales receipt/invoice, and cash-disbursement fields.
- [ ] Link purchase documents to request, RFB, supplier, event, and inventory or food distribution.
- [ ] Distinguish personal-use charges from USC-event requests.

### Gate evidence

One sampled materials purchase and one sampled food purchase traced end-to-end, including document checklist and committee approval.

## v0.7 — Supabase Shadow Migration and Read-Only Sheets Reporting

**Status:** PLANNED · **Owner:** Technical Maintainer · **Effort:** Large

### Context

Google Sheets remains familiar and useful, but it should become a reporting/export destination rather than the long-term operational source of truth.

### Checklist

- [ ] Define canonical tables for users, departments, requests, events, products, transactions, loans, releases, suppliers, documents, tasks, and audit events.
- [ ] Use migrations, constraints, stable IDs, reference tables, and RLS policies.
- [ ] Import and reconcile current records in staging.
- [ ] Keep one operational writer during shadow mode.
- [ ] Publish read-only Sheets reports with source, timestamp, row counts, and export status.
- [ ] Ensure editing a report cannot change production data.

### Gate evidence

Rebuild-from-migrations result, mapping report, reconciliation report, RLS tests, sample exports, and freshness/error status.

## v0.8 — Cutover, Monitoring, Backup, and Event Readiness

**Status:** PLANNED · **Owner:** Technical Maintainer + DOL Admin · **Effort:** Large

### Context

The system must be operable by nontechnical administrators and diagnosable by maintainers. Event readiness should combine tasks, deadlines, requests, procurement, equipment, food, and stock warnings.

### Checklist

- [ ] Freeze Sheet writes and perform final reconciliation.
- [ ] Switch production writes to PostgreSQL with rollback plan.
- [ ] Add admin health view with plain-language explanations.
- [ ] Add alerts for low stock, overdue loans, export failure, privileged access change, missed task, and critical incident.
- [ ] Test backup restore and document restoration authority.
- [ ] Repeat YDD-style event readiness using a future event scenario.

### Gate evidence

Cutover log, rollback rehearsal, restore drill, alert delivery records, health dashboard walkthrough, and event-readiness report.

## v0.9 — User Acceptance, Training, and Handover

**Status:** PLANNED · **Owner:** DOL Director + Technical Maintainer · **Effort:** Medium

### Checklist

- [ ] Run scenario-based UAT for request, approval, procurement, inventory, lending, release, return, reporting, and admin workflows.
- [ ] Test unauthorized access, duplicate submissions, late requests, exam-week exclusions, stock conflicts, and report edits.
- [ ] Complete mobile, keyboard, touch, accessibility, and plain-language review.
- [ ] Deliver training guide, quick reference, support path, runbooks, and ownership map.
- [ ] Rehearse deployment, incident response, data restoration, and rollback.

### Gate evidence

Signed UAT matrix, defect register, training attendance/acknowledgement, runbook rehearsal, release candidate URL, and handover checklist.

## v1.0 — Stable Internal DOL/USC Release

**Status:** PLANNED · **Owner:** DOL Director + Technical Maintainer · **Effort:** Release

### Acceptance checklist

- [ ] Core DOL workflows are complete and usable without developer intervention.
- [ ] Authorized USC departments can submit and monitor permitted requests.
- [ ] Inventory, loans, returns, releases, pantry, and emergency exceptions are traceable.
- [ ] Procurement and finance documents are linked and auditable.
- [ ] Google Sheets reports are read-only, fresh, and understandable.
- [ ] Monitoring, backup, restore, support, and ownership are operational.
- [ ] Production acceptance is signed.

## Post-v1.0 approval boundary

Do not add general HAU student lending, public access, Microsoft/Entra login, QR/barcode workflows, or institution-wide deployment to the v1.0 implementation queue without a separate privacy, approval, security, support, and service-level decision.
