# Current Bounded Task

INTENT: SOFTWARE_FEATURE
MODE: EXECUTE
OBJECTIVE: Integrate the accepted V4.1 visual language into the authoritative HAU-USC Logistics front end while preserving every production route, workflow, form, action, status, permission boundary, and service contract exactly as they behave today.
TARGET: frontend-design-integration, based on origin/main
SKILLS: impeccable (critique, audit, adapt, harden, polish, detector); hallmark for composition direction; ui-quality-gate as a read-only audit; anti-slop-implementation for bounded repository discipline
CURRENT_POINTER: .codex/CURRENT.md
CURRENT_HANDOFF: .codex/CURRENT_HANDOFF.md
ACCEPTED_SPEC: .codex/specs/active/v0.7.3-frontend-design-integration.md
AUTHORITY: The accepted v0.7.3 front-end design integration specification; AGENTS.md; .codex/PHASE_AND_CONTEXT_POLICY.md; production functionality as recorded in docs/design/PRODUCTION_FRONTEND_PARITY_BASELINE.md
REQUIRED_MODEL: Sol-class judgement for the parity gate and any authorization-adjacent surface; ordinary implementation routing for presentation-only work
ACTIVE_WRITER: Claude Opus 5 (Claude Code)
WRITER_LOCK: CLAIMED - 2026-08-09, Asia/Manila
GIT_UPSTREAM: origin/main
BASE_SHA: 7245c717f2b8bff3f327b47ff844281d94eaa1db
PRODUCTION_RELEASE: v0.7.2 @ 84eacfcdb47a3985fed48e3ba14bb413946d4410
RISK: MEDIUM-HIGH - presentation-only apart from the section 4.1 docked-detail amendment, but it touches every production surface in one accepted slice, so rollback granularity and parity proof are the primary risks
DELIVERABLE: A verified front-end implementation candidate plus the design and verification documents required by the accepted specification
SCOPE: Front-end source under src/, front-end artifacts regenerated through repository build scripts, user-facing copy, front-end animation, a progressive-enhancement 3D landing hero, and front-end/browser/accessibility/visual tests
OUT_OF_SCOPE: Back-end business rules, D1 schema or data, R2 behaviour, migrations, Worker service contracts, Google Sheets/Drive writes, provider changes, the auth/security model, deployment, staging or production mutation, DNS or domain changes, release tagging, and merge to main
VERIFICATION: Functional parity with browser evidence per journey; accessibility (landmarks, headings, focus, keyboard, focus containment and restoration, announcements, no colour-only meaning, contrast, 200% zoom, touch targets, reduced motion, 320px); responsive at 320/375/414/768/1024/1440; repository checks where governance requires; generated-artifact verification; git diff --check; measured bundle and runtime delta
STOP_CONDITIONS: A change would require back-end, service-contract, migration, provider, or environment work; a protected artifact or the release branch would be written; real private data would be needed; a production route cannot be verified from authoritative source; functional parity cannot be proven; accessibility or performance cannot reach standard without reducing the visual effect - in which case reduce the effect, never the gate
BLOCKER: NONE
NEXT_EXACT_ACTION: Continue the section 17 order at step 3, shell and signature controls.

Owner accepted the specification on 2026-08-09. Three owner decisions are
binding on this task: the integration base is `origin/main` rather than tag
`v0.7.2`; the whole front end is a single slice rather than four; and the
docked queue-plus-detail pattern is adopted for every module that already has
a queue and a detail view, recorded as specification section 4.1.

The single-slice trade-off - one commit range for rollback and parity proof
across roughly thirty surfaces at once - is recorded as an accepted risk in the
specification, and is mitigated by capturing the parity baseline before the
first edit and by the fixed implementation order in specification section 17.

The Impeccable design programme that produced the V4.1 visual contract is
merged into this branch. Its own history, decisions, previews, and closure
evidence are preserved in `.codex/IMPECCABLE_V2_*`, `.codex/IMPECCABLE_V3_*`,
`.codex/IMPECCABLE_V4_*`, `.codex/V0_4_2_FRONTEND_*`, `docs/design/`, and
`prototypes/`. Those records are historical design-programme truth and are not
the pointer for this implementation task.

Nothing is deployed, merged to main, tagged, or written to any external system
under this task.
