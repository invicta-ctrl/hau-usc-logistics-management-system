# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- HAU University Student Council logistics staff operating request, inventory,
  lending, release, procurement, restocking, event, and governance workflows.
- Council officers and authorized reviewers who need role-appropriate queues,
  approvals, auditability, and reliable operational state.
- Students and institutional requesters using bounded public request, lending,
  verification, application, and tracking flows.
- Earl as owner/operator, who validates exact candidates in the private
  Isolated Staging Playground before any Production promotion.

## Product Purpose

HAU-USC Logistics turns council logistics work into a governed operational
record. It coordinates requests, stock, lending, releases, procurement,
restocking, events, accounts, and public updates while preserving authorization,
privacy, reconciliation, and recovery boundaries.

Success means staff can complete frequent logistics work quickly and accurately,
the public can access the correct bounded services, and every consequential
state change remains attributable and reconcilable.

## Positioning

This is not a generic inventory dashboard. It joins institutional public service,
role-governed workflows, inventory truth, lending accountability, release
evidence, and council administration in one auditable system with an isolated
owner-testing environment.

## Operating Context

- Production is the accepted operational truth; the Isolated Staging Playground
  is a distinct environment for exact-candidate testing.
- Staff work ranges from dense scanning and bulk inventory operations to careful
  approvals, evidence review, handoff, return, and administrative publishing.
- Public and staff surfaces share one product but have different privacy,
  density, and authentication requirements.
- Desktop and laptop operation are primary for dense workflows; tablet and
  mobile must preserve critical review, lookup, confirmation, and tracking tasks.

## Capabilities and Constraints

- Preserve authentication, permissions, D1/R2 behavior, request, inventory,
  lending, release, procurement, restocking, event, governance, announcement,
  and audit contracts.
- Represent loading, empty, error, partial, unavailable, disabled, permission,
  pending, approved, denied, released, returned, overdue, low-stock, and reorder
  states truthfully.
- Never fabricate backend success, operational data, people, metrics, evidence,
  or Production state for presentation.
- Production promotion requires Earl's explicit approval for the exact tested
  candidate; a successful playground deployment is not approval.
- M1/M2, schema changes, Production deployment, and Production data mutation are
  outside the current design-research task.

## Brand Commitments

- Product name: HAU-USC Logistics Management System.
- Institutional identity: Holy Angel University Student Council and Department
  of Logistics marks and approved organizational imagery.
- Voice: direct, calm, accountable, institutionally grounded, and operational.
- Oxblood and gold are established identity anchors; any future evolution must
  remain recognizably HAU-USC and requires design-gate approval.
- The current V5 system and frozen prototype remain the incumbent visual truth
  until an approved redesign direction replaces or amends them.

## Evidence on Hand

- Current authoritative visual contract: `DESIGN.md`.
- Frontend integrity and frozen-source evidence:
  `docs/V5_FRONTEND_INTEGRITY_BASELINE.md`.
- Accepted Production baseline: v0.8.0 at the repository-recorded accepted SHA.
- Current exact candidate and environment truth: `.codex/CURRENT.md` and
  `.codex/CURRENT_HANDOFF.md`.
- Real application routes, DTOs, commands, tests, and operational services are
  present in the repository and must remain the source of functional truth.
- No testimonials, adoption metrics, performance claims, or institutional
  benchmarks are approved for fabrication.

## Product Principles

1. Operational truth outranks visual theatre.
2. Make the next safe action obvious without hiding context or audit evidence.
3. Adapt visual intensity to the job: expressive overview, disciplined
   operations, calmer administration.
4. Use progressive disclosure to serve both frequent operators and occasional
   public users.
5. Treat accessibility, performance, environment isolation, and recovery as
   product behavior rather than release polish.

## Accessibility & Inclusion

Keyboard navigation, visible focus, semantic structure, readable contrast,
screen-reader labels, non-color status communication, 44px touch targets,
reduced-motion behavior, and structural mobile adaptation are required. Critical
operations must remain usable without animation, WebGL, hover, or fine pointer
control.
