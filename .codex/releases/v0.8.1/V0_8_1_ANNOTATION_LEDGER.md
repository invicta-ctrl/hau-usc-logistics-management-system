# v0.8.1 Owner-Annotation Ledger

STATUS: V81-S04_CLASSIFICATION_ACCEPTED

AUTHORITY: Earl accepted V1R7-A3 FINAL STANDALONE; Sol authorized the bounded V81-S03/S04 governance-only classification task.

PRIVACY: Sanitized directions only. This ledger contains no raw owner-feedback text, private paths, Annex material, or personal data.

OWNER_INPUT_DIGESTS: DIRECTIONS=4F6D7C374A8185E84CAE5654B30B6B2B07698AB4C81D51CDE21599AD20BA2723; PDF=AC571DF330F2AB7B2A61E67479365A9F906AA09D0DCA7013910CCBF2C1A78C4A

## Evidence contract

Each row records either a current-source reproduction or the precise render or protected-contract evidence gap that prevents a repair decision. A means a bounded, contract-neutral repair candidate; B requires focused rendered/source/test evidence; C is a source-proven or contract-neutral conclusion; D is broad redesign and deferred; E is a protected-contract, role, privacy, or Class I decision and deferred; F has no rows.

### Representative current-source and test seams

- `R`: `src/v5/src/registry.js:57-128` — frozen route registry and route labels.
- `P`: `src/v5/src/surfaces/public.js` — public and sign-in surface seam.
- `O`: `src/v5/src/surfaces/operations.js:75,294,446,537,716,751,780,832` — overview and operational workbench seams.
- `A`: `src/v5/integration/admin-parity.js:226-253,751-795` — public-panel and administrator parity-form seams.
- `OP`: `src/v5/integration/operations-parity.js:279-322,487-553,795-1125,1291-1321` — operational parity-form and command seams.
- `RT`: `src/v5/integration/runtime.js:312-317,766-835,1435-1446` — selected-record runtime binding seams.
- `S`: `src/v5/src/app.js` plus shell, `v4.css`, and owner-feedback responsive or transition seams.
- `U`: `tests/unit/v5-admin-parity.test.js` and `tests/unit/v5-operations-parity.test.js` — route-form contract tests.
- `I`: `src/v5/integration/operations-parity.js:1002` — capability-gated `saveEventSeries` invoke contract.
- `T`: `tests/e2e/v5-current-application.spec.js:42-46,95,140-224,240` — current route and indexed-navigation evidence.
- `C`: `tests/cloudflare-e2e/local-worker.spec.js:1526` — event-series create-contract evidence.

## Five blocker families

1. F1 — Public identity and access clarity.
2. F2 — Lending discovery and record context.
3. F3 — Request Center and Release Desk contextual workflow.
4. F4 — Restock, procurement, and events workbenches.
5. F5 — Administration, profile, and shell refinement.

## S03 ledger

| ID   | Route               | Family  | Current-source reproduction or explicit evidence gap                                                                                                                      | Class | S04 disposition                                          | Representative seam |
| ---- | ------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----- | -------------------------------------------------------- | ------------------- |
| V-01 | `public.signin`     | F1      | `publicPanels()` unconditionally appends activation and reset panels; activation dispatch later fails closed without CSRF.                                                | A     | R1 selected.                                             | R, P, A, U          |
| V-02 | `public.signin`     | F1      | Source literally says “Use the opaque reset token issued through the approved recovery channel.”; plain-language copy is the defect.                                      | C     | R1 selected; focused copy and accessibility design only. | R, P, A, U          |
| V-03 | `public.signin`     | F1      | Requested USC-email and eight-digit reset lifecycle differs from the opaque-token `/api/auth/reset/complete` contract.                                                    | E     | Deferred pending explicit authority.                     | R, P, A, U          |
| V-04 | `public.signin`     | F1      | Activation field is labelled `Verified email` without USC-work-email guidance; this is a copy-only seam.                                                                  | C     | R1 selected; contract-neutral copy/form design.          | R, P, A, U          |
| V-05 | `public.signin`     | F1      | Rendered proof is needed for the requested public-access presentation variant.                                                                                            | B     | Evidence required; unselected.                           | R, P, T             |
| V-06 | `lending.queue`     | F2      | Borrower option currently labels `USC staff or officer`; capitalization and label correction only.                                                                        | C     | R1 selected.                                             | R, O, OP, U         |
| V-07 | `lending.queue`     | F2      | Required field is `Student or account reference`; requested `Student ID No.` is label-only and preserves the backend ID invariant.                                        | C     | R1 selected.                                             | R, O, OP, U         |
| V-08 | `lending.queue`     | F2      | Required field is `Contact`; requested `Contact Number` is label and input-mode clarification only.                                                                       | C     | R1 selected.                                             | R, O, OP, U         |
| V-09 | `lending.queue`     | F2      | Optional `notes` textarea exists in lending-create; routine UI treatment is contract-neutral.                                                                             | A     | R1 selected.                                             | R, O, OP, U         |
| V-10 | `lending.queue`     | F2      | Item picker is a static authorized-inventory `<select>`; suggestive search needs focused accessible-combobox evidence.                                                    | B     | Evidence required; unselected.                           | R, O, OP, U         |
| V-11 | `lending.queue`     | F2 + F5 | Shell-to-lending context requires focused rendered and source/test evidence.                                                                                              | B     | Evidence required; unselected.                           | R, O, S, T          |
| V-12 | `lending.queue`     | F2      | Lending table has no route-local search or filter; client-only filtering over already-authorized rows is a candidate.                                                     | A     | R2 selected.                                             | R, O, OP, U         |
| V-13 | `lending.queue`     | F2      | Queue already links to `lending.detail`, and governed actions already exist.                                                                                              | C     | Evidence-only no-code conclusion.                        | R, O, OP, U         |
| V-14 | `lending.queue`     | F2      | Requested scheduler or notification behavior is a new protected contract.                                                                                                 | E     | Deferred pending explicit authority.                     | R, O, OP, U         |
| V-15 | `lending.queue`     | F1      | Preview bar names Isolated Staging Playground and Test environment but omits version and candidate; safe projection needs focused evidence.                               | B     | Evidence required; unselected.                           | R, O, S, T          |
| V-16 | `admin.overview`    | F5      | Overview-shell refinement needs focused source, render, and route-test evidence.                                                                                          | B     | Evidence required; unselected.                           | R, O, T             |
| V-17 | `request.queue`     | F3      | Controller appends every authorized request form as a detached `Authorized operations` section to `#surface-main`.                                                        | A     | R2 selected.                                             | R, O, OP, U         |
| V-18 | `request.queue`     | F3      | Request queue is already populated from server state.                                                                                                                     | C     | Evidence-only no-code conclusion.                        | R, O, OP, U         |
| V-19 | `request.queue`     | F3      | Review, info, reject, and reserve commands exist, but lifecycle/context unification exceeds current proof.                                                                | B     | Evidence required; unselected.                           | R, O, OP, U         |
| V-20 | `release.desk`      | F3      | Release page renders `partialPanel()` and controller additionally appends detached release forms; contextual mount or dialog is a candidate using existing commands only. | A     | R2 selected.                                             | R, O, OP, U         |
| V-21 | `release.desk`      | F3      | Release queue already projects ready and partial records.                                                                                                                 | C     | Evidence-only no-code conclusion.                        | R, O, OP, U         |
| V-22 | `release.desk`      | F3      | Release table has no route-local search or filter; client-only filtering is a candidate.                                                                                  | A     | R2 selected.                                             | R, O, OP, U         |
| V-23 | `release.desk`      | F3      | Requested evidence-upload or media behavior is a new protected contract.                                                                                                  | E     | Deferred pending explicit authority.                     | R, O, OP, U         |
| V-24 | `release.desk`      | F3      | Runtime binds selected release facts, quantity, and recipient, while parity form does not fully consume or prefill that context.                                          | B     | Evidence required; unselected.                           | R, O, OP, RT, U     |
| V-25 | `release.desk`      | F3      | Parity form labels are `Request` and `Ready release line`; Request Ticket ID or shortening is label-only.                                                                 | C     | R1 selected.                                             | R, O, OP, U         |
| V-26 | `release.desk`      | F3      | Requested change removes a required custody attestation.                                                                                                                  | E     | Deferred pending explicit authority.                     | R, O, OP, U         |
| V-27 | `restocking.queue`  | F4      | No current create-restock command was found; required contract and role proof is absent.                                                                                  | E     | Deferred pending explicit authority.                     | R, O, OP, U         |
| V-28 | `procurement.board` | F4      | Procurement workbench presentation requires focused rendered/source/test evidence.                                                                                        | B     | Evidence required; unselected.                           | R, O, OP, U         |
| V-29 | `admin.directory`   | F5      | Directory request reaches protected roster and privacy semantics.                                                                                                         | E     | Deferred pending explicit authority.                     | R, A, U             |
| V-30 | `owner.health`      | F5      | Requested behavior requires Production-admin parity or authority.                                                                                                         | E     | Deferred pending explicit authority.                     | R, O, OP, U         |
| V-31 | `owner.health`      | F5      | Responsive CSS hides rail off-canvas at `<=1023` while desktop collapse narrows it; navigation-hide defect needs viewport proof.                                          | B     | Evidence required; unselected.                           | R, O, S, T          |
| V-32 | `owner.health`      | F5      | Navigation toggle already has transform and opacity transitions plus reduced-motion rules.                                                                                | C     | Evidence-only no-code conclusion.                        | R, O, S, T          |
| V-33 | `events.series`     | F4      | Capability-gated `saveEventSeries` create form exists, but its contextual affordance is detached.                                                                         | A     | R2 selected.                                             | R, O, I, OP, C, U   |
| V-34 | `account.profile`   | F5      | Requested behavior adds protected profile or media fields.                                                                                                                | E     | Deferred pending explicit authority.                     | R, A, U             |
| V-35 | `account.profile`   | F5      | Broad profile visual-system request lacks a bounded contract-neutral repair.                                                                                              | D     | Deferred under A3; no redesign.                          | R, T                |
| V-36 | `account.profile`   | F5      | Broad shell or profile refinement exceeds the accepted bounded repair scope.                                                                                              | D     | Deferred under A3; no redesign.                          | R, T                |
| V-37 | `public.landing`    | F1      | Two provider-backed masthead marks exist; optical scale needs asset and render proof.                                                                                     | B     | Evidence required; unselected.                           | R, P, S, T          |
| V-38 | `public.landing`    | F1      | Hero USC mark is intentionally paper-backed by current CSS; removal or blending needs transparent-asset and render proof.                                                 | B     | Evidence required; unselected.                           | R, P, S, T          |
| V-39 | `public.landing`    | F1      | Landing supporting copy is literal source at `public.js:67-68`; editorial grammar or capitalization is contract-neutral.                                                  | C     | R1 selected.                                             | R, P, T             |
| V-40 | `public.landing`    | F1 + F5 | Broad landing visual-system request is a redesign decision, not a bounded defect repair.                                                                                  | D     | Deferred under A3; no redesign.                          | R, P, T             |
| V-41 | `public.landing`    | F1      | Crop does not identify the exact token or element producing the alleged mismatch; render proof is required.                                                               | B     | Evidence required; unselected.                           | R, P, T             |
| V-42 | `public.landing`    | F1      | Sticky masthead and hero styles exist, but overlap needs viewport and scroll reproduction before repair.                                                                  | B     | Evidence required; unselected.                           | R, P, S, T          |

## Locked classification result

CLASS_COUNTS: A=7; B=13; C=11; D=3; E=8; F=0; TOTAL=42

R1_ACCESS_COPY_FORM_CLARITY: V-01,V-02,V-04,V-06,V-07,V-08,V-09,V-25,V-39

R2_QUEUE_DISCOVERY_CONTEXTUAL_AFFORDANCES: V-12,V-17,V-20,V-22,V-33

EVIDENCE_ONLY_NO_CODE: V-13,V-18,V-21,V-32

DEFERRED: B=EVIDENCE_REQUIRED; D=DEFERRED_BROAD_REDESIGN; E=DEFERRED_PROTECTED_CONTRACT_OR_ROLE; F=NONE

## Hallmark audit conclusion

The existing `DESIGN.md` system and inspected landing Hallmark stamps are truthful for the audited design scope. Named Hallmark slop findings: 0 critical, 0 major, 0 minor. This conclusion does not negate the 42 owner findings: they are operational context, copy, contract, and evidence concerns rather than a named Hallmark anti-pattern requiring a redesign.

## S05 boundary

S05 may design only R1 and R2 with exact source seams, contract invariants, accessibility behavior, focused tests, and rollback scope. A fresh high-risk Luna audit is required before product edits. B remains evidence-required; D, E, and F remain deferred. No provider, Playground, Production, migration, merge, deploy, or recovery-pointer action is authorized.
