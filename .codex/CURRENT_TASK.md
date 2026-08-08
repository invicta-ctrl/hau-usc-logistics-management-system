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
NEXT_EXACT_ACTION: Continue the section 17 order at step 3, shell and signature controls (celestial theme toggle, kinetic menu, compact back). Steps 2, 7 and 8 are complete; 4, 5, 6 and 9 remain.

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

## Section 17 progress at 2026-08-09

Done:
- 17.1 rollback evidence. Rollback point f0312b7; production baseline captured
  from the deployed v0.7.2 artifact before the first source edit. The captured
  images are NOT committed because the pre-sanitization production bundle
  renders real personal data.
- 17.2 design foundation. Surface ladder, elevation ramp, motion tokens, type
  scale, compositional anchors, decorative grid neutralised, three
  previously-undefined tokens defined.
- 17.7 copy pass, largely. Environment badge, scope control, loading and
  status copy now plain language. Server-side ApiError codes and messages are
  untouched - they are the service contract and out of scope.
- 17.8 preview-chrome sweep. Clean; the one banner found is tree-shaken out.
- Section 4.1 docked detail across all eleven detail surfaces.
- Personal data removed from the shipped front end.

Remaining:
- 17.3 shell and signature controls: celestial theme toggle, kinetic menu,
  compact back control, mobile navigation. Reference implementations exist in
  prototypes/impeccable-whole-site-redesign-v5/ (styles/v5.css and
  src/components.js celestialToggle) and are proven against the owner's
  reference in docs/design/references/v0.4.1-control-references/.
- 17.4 landing page and the progressive-enhancement 3D hero with static
  fallback.
- 17.5 and 17.6 operational and administration surface composition.
- 17.9 functional parity gate with browser evidence per journey, plus the
  responsive, accessibility, contrast, zoom and reduced-motion matrix.
- Typography consolidation: production uses twenty distinct literal sizes.
  Recorded as typographyDrift in DESIGN.md; detector findings against the
  off-ramp values are true positives and are deliberately left visible.
- Refresh .impeccable/design.json, which is stale relative to DESIGN.md.
- Build-order fix: scripts/create-shareable.mjs must run after vite build for
  the guided demo to match; npm run build currently leaves them out of step
  and verify:dist fails until create-shareable is run a second time.

Known-good verification command sequence:
  npm run build && node scripts/create-shareable.mjs && npm run verify:dist
  && npm run test && npm run lint
