# Documentation Index

This page is the durable map for implementers, reviewers, operators, and future maintainers. The repository is the source of truth. Never infer deployment state from a screenshot, local folder, chat transcript, or uncommitted note.

The current deployment evidence is recorded in [Work Continuation](WORK_CONTINUATION.md), [Project Status](../PROJECT_STATUS.md), and [V1 Readiness Audit](V1_READINESS_AUDIT.md). As of 2026-07-13, staging Version 13 and production Version 3 serve the corrected package; read-only smoke passed, while full mutation acceptance and release approval remain open.

## Status vocabulary

- **CURRENT** describes behavior implemented in this repository. It may still require an authorized staging deployment before it is operational.
- **DEMO** describes the deterministic browser preview and fictional local data. It is not authentication, persistence, or deployment evidence.
- **PLANNED** is accepted near-term work that is not yet implemented.
- **FUTURE** is a design option or proposed target. It must not be represented as live.
- **HISTORICAL** records a dated event or superseded baseline. Read the current resume block before acting on it.

## Start here

| Need                                                       | Canonical document                                                        | Status                                 |
| ---------------------------------------------------------- | ------------------------------------------------------------------------- | -------------------------------------- |
| System boundaries, data flows, screens, and trust model    | [Architecture](ARCHITECTURE.md)                                           | CURRENT plus labeled FUTURE diagrams   |
| Browser-to-service and Apps Script callable contracts      | [API and Service Contracts](API_AND_SERVICE_CONTRACTS.md)                 | CURRENT                                |
| Entity meanings and Sheets-to-PostgreSQL mapping           | [Data Dictionary](DATA_DICTIONARY.md)                                     | CURRENT plus FUTURE mapping            |
| Exact operational tab purpose and source-of-truth rules    | [Google Sheets Schema](GOOGLE_SHEETS_SCHEMA.md)                           | CURRENT                                |
| Drive folder policy, evidence lifecycle, and safe examples | [Google Drive Evidence](GOOGLE_DRIVE_EVIDENCE.md)                         | CURRENT                                |
| Authorization, privacy, threats, and data governance       | [Security and Access](SECURITY_AND_ACCESS.md)                             | CURRENT plus required launch decisions |
| Responsive behavior and honest PWA/offline status          | [Mobile and PWA Strategy](MOBILE_AND_PWA_STRATEGY.md)                     | CURRENT plus PLANNED                   |
| Fifteen-minute setup and safe extension workflows          | [Developer Onboarding](DEVELOPER_ONBOARDING.md)                           | CURRENT                                |
| User administration and configuration                      | [Administrator Guide](ADMIN_GUIDE.md)                                     | CURRENT                                |
| Request submission and requester privacy boundary          | [Requester Guide](REQUESTER_GUIDE.md)                                     | CURRENT                                |
| Daily receiving, release, lending, and reconciliation      | [Operator Checklist](OPERATOR_CHECKLIST.md)                               | CURRENT                                |
| Environment gates, release evidence, and complete rollback | [Operations and Deployment Runbook](OPERATIONS_AND_DEPLOYMENT_RUNBOOK.md) | CURRENT                                |
| V1 repository/live gate matrix and exact evidence          | [V1 Readiness Audit](V1_READINESS_AUDIT.md)                              | CURRENT release evidence               |
| Dated provider research and weighted comparison            | [Hosting and Database Candidates](HOSTING_AND_DATABASE_CANDIDATES.md)     | FUTURE                                 |
| Proposed hosted architecture and migration phases          | [Future Hosting and Database](FUTURE_HOSTING_AND_DATABASE.md)             | FUTURE                                 |
| Hosted-platform decision and reversal conditions           | [ADR 0001: Future Hosted Platform](adr/0001-future-hosted-platform.md)    | Proposed                               |

## Delivery and operating references

| Topic                                     | Document                                                        |
| ----------------------------------------- | --------------------------------------------------------------- |
| Required multi-agent workflow             | [AI Collaboration](AI_COLLABORATION.md)                         |
| Current resumable task state              | [Work Continuation](WORK_CONTINUATION.md)                       |
| Domain invariants                         | [Domain Rules](DOMAIN_RULES.md)                                 |
| Apps Script local configuration           | [Apps Script Setup](APPS_SCRIPT_SETUP.md)                       |
| Clasp staging safeguard                   | [Clasp Deployment](CLASP_DEPLOYMENT.md)                         |
| Staging and production launch sequence    | [Launch Runbook](LAUNCH_RUNBOOK.md)                             |
| Backup and restore controls               | [Backup and Recovery](BACKUP_AND_RECOVERY.md)                   |
| Non-destructive import and reconciliation | [Migration and Reconciliation](MIGRATION_AND_RECONCILIATION.md) |
| Test coverage and operator acceptance     | [Testing and Acceptance](TESTING_AND_ACCEPTANCE.md)             |
| Detailed test plan                        | [Test Plan](TEST_PLAN.md)                                       |
| Known constraints                         | [Known Limitations](KNOWN_LIMITATIONS.md)                       |
| Accessibility requirements                | [Accessibility](ACCESSIBILITY.md)                               |
| Versioned final demo baseline             | [Final Demo Baseline](FINAL_DEMO_BASELINE.md)                   |
| Near-term milestones                      | [Roadmap to V1](ROADMAP_TO_V1.md)                               |

## Dated and historical evidence

The `docs/reference/` and dated incident/schema reports are evidence, not current instructions. When they conflict with this index, the current resume block, or a canonical document above, stop and reconcile the conflict before changing code or an external system.

## Documentation change rules

1. Label current, demo, planned, and future behavior explicitly.
2. Link one canonical document instead of duplicating instructions across handoff notes.
3. Use fictitious identifiers and people in examples. Keep real resource identifiers, credentials, contacts, student data, supplier tax information, and evidence bytes outside git.
4. Update the canonical page in the same change as a contract, role, tab, folder, release, or provider decision.
5. Run `npm run check:docs` and `npm run check:sensitive` before handoff.
