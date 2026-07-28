# Current Task

INTENT: SOFTWARE_FEATURE
SECONDARY INTENTS: AUDIT, TESTING, STAGING_ACCEPTANCE, RELEASE
MODE: execute
TARGET: HAU-USC Logistics v0.7.0 Phase 19 governed Brand Assets workspace and R2 delivery
SKILLS: lean-ctx, cloudflare-deploy, browser:control-in-app-browser
AUTHORITY: autonomous Phase 18–29 master prompt; `.codex/specs/v0.7.0-production-master.md`; accepted amendments; repository invariants
RISK: high
DELIVERABLE: accepted focused Brand Assets workspace with six governed slots, private staging R2 objects and D1 metadata, complete lifecycle/version validation, and automatic application use
VERIFICATION: code and schema audit; six-slot reconciliation; focused lifecycle/security/validation tests; repository gate; staging R2/D1 separation; deployed desktop/mobile acceptance; rollback; exact-head CI
STOP CONDITIONS: unknown work; missing authoritative asset source; cross-environment binding; unsafe MIME/SVG handling; authorization or audit defect; privacy exposure; irreversible data-loss risk; unresolved P0/P1; production mutation

## Active Phase 19 contract

- Required slots: USC logo, DOL logo, combined lockup, favicon, login
  background, and default item image.
- The focused Owner workspace must govern upload, preview, publish, replace,
  rollback, alt text, duplicate handling, and version history.
- Private/governed R2 stores objects; D1 stores governed metadata and history.
- Validate MIME from bytes, dimensions, size, SVG sanitation, content hashes,
  duplicates, and environment separation.
- Published slots automatically drive login, navigation, mobile header,
  Request Center, Lending Center, favicon, and item placeholders.
- Do not add Unsplash, Pexels, Pixabay, or another live stock-media integration.
- Production remains out of scope during the Phase 19 staging gate.

The primary agent is the only writer, credential handler, provider mutator,
migration executor, deployer, merger, tagger, release manager, and rollback
operator.

## Current execution checkpoint

- Phase 18: accepted on staging at exact runtime
  `80c0db43cc06145ada09434fd55f3fd31c0873f7`; PR #9 exact-head CI 6 / 6.
- Phase 19: audit in progress. Existing governed brand/R2 implementation and
  staging objects must be reconciled before any new schema or media mutation.
- Production: untouched and prohibited.
