# Current Task

- **Task ID:** `PHASE-3-WORKSPACE-CONSOLIDATION`
- **Original instruction:** `proceed to phase 3`
- **Intent and mode:** `REPOSITORY_MAINTENANCE`; execute
- **Secondary intents:** `TESTING`, `DOCUMENT_OR_ARTIFACT`
- **Matched skills:** `pdf` for the attached operating-guide review
- **Objective:** Inventory, classify, preserve, and safely consolidate the
  HAU-USC repository and local workspace into one clearly authoritative active
  checkout without losing unique, unknown, private, or unmerged work.
- **Verified starting state:** authoritative checkout
  `D:\Documents\DOL Website GitHub`; branch
  `feat/live-sync-lending-search-catalog-controls`; HEAD/upstream/PR #6 at
  `048578d1db9fdda93b9ba95b94b74ac1791cfc8c`; count `0 0`; clean; PR open,
  draft, mergeable, and three-check CI green. Seven additional registered
  worktrees exist and require classification.
- **Authoritative specification:** accepted master goal prompt Phase 3; attached
  `HAU_USC_Master_Prompt_Review_and_Operating_Guide.pdf`, sections 7 and 9;
  root `AGENTS.md`; current project status and continuation records.
- **Dependencies:** accepted Phase 2 implementation
  `8e82a8601e930ecf223a6e9170dc3d4dd9954bb1` and documentation checkpoint
  `048578d1db9fdda93b9ba95b94b74ac1791cfc8c`.
- **In scope:** local/remote branches, PRs, tags, registered worktrees, duplicate
  clones, prototype/export/build/handoff folders, private configuration, unknown
  work, preservation artifacts, verified-safe cleanup, one authoritative
  checkout, status reconciliation, and a verified development-baseline tag when
  justified by repository convention.
- **Out of scope:** Slice 7 product behavior; merging PR #6; rewriting or
  force-pushing shared history; deployment, migration, Apps Script, Sheets,
  Drive, Cloudflare, database, or production changes.
- **Allowed files/systems:** repository checkpoint/governance documentation;
  read-only Git/GitHub/local filesystem inspection; dated archives and Git
  bundles outside the active checkout; verified-safe Git worktree/branch cleanup
  only after preservation and classification.
- **Off-limits actions:** reset, stash, clean, manual deletion of registered
  worktree folders, deletion of unknown work, unrelated merges, shared-history
  rewrite, or committing private configuration/generated operational evidence.
- **Assumptions:** `D:\Documents\DOL Website GitHub` remains the authoritative
  active checkout unless inventory proves otherwise; user approval to proceed
  authorizes the accepted Phase 3 consolidation scope but not unrelated external
  systems or PR merge.
- **Domain/security constraints:** preserve all application invariants; never
  expose credentials, resource IDs, personal records, private contacts, supplier
  TINs, Drive links, or operational evidence while classifying configuration.
- **External-system boundary:** GitHub read-only inventory plus authorized branch
  push/CI after the bounded repository checkpoint; no other external mutation.
- **Risks:** hidden untracked/unpushed work, duplicate clones with unique commits,
  private configuration entering archives, stale worktree registration, active
  dependencies, and cleanup performed before preservation proof.
- **Rollback:** retain pre-cleanup branch/tag references, a verified external Git
  bundle, and dated preservation archives; restore a removed worktree only from
  its retained branch/commit after verifying the target path.
- **Focused tests:** deterministic inventory/classification checks, bundle
  verification, branch containment/ahead-behind checks, clean-status proof, and
  governance/continuation validators.
- **Final verification:** repository-required tests where source state changes;
  `git fsck`, bundle verification, final worktree/branch/folder inventory,
  `git diff --check`, independent read-only review, push parity, and PR CI.
- **Acceptance criteria:** every in-scope item has a classification and evidence;
  unique/unknown work is preserved; only proven-safe items are consolidated; one
  authoritative checkout is documented; private configuration remains outside
  Git/shared archives; final state is clean, recoverable, and synchronized.
- **Evidence required:** before/after inventories, classification and disposition,
  preservation paths/hashes, exact Git commands, tests, review, commits, PR/CI,
  remaining unknowns, rollback, and external-action record.
- **Safe-to-continue result:** yes for read-only inventory and preservation;
  cleanup of any individual candidate remains gated by its classification.
- **Verified consolidation result:** eight registered worktrees reduced to the
  authoritative checkout plus one deployment dependency; six superseded
  specialist worktrees and seven redundant local refs removed only after bundle
  and exact-file preservation; unique planning work, remote refs, PRs, tags,
  private configuration, institutional files, and unknown exports retained.
- **Preservation:** verified 47-ref all-history bundle at SHA-256
  `DBA723337646546AC841A417FFFC9B2BA54C6FBEA2536B61CC1CF1F86CB5C7C0`;
  exact Drive/QA generated files and patches preserved; distinct private config
  copies hash-verified outside Git.
- **Verified tests:** governance passed 8 required project files / 14 resume
  fields; full `npm run check` passed 25 Vitest files / 216 tests, 28-module
  build, 29 Apps Script sources / 47 required functions, deterministic generated
  parity, and two 293,406-byte standalone artifacts. `git diff --check`, JSON
  parsing, Git integrity, and bundle verification pass.
- **Independent review:** PASS after one targeted documentation repair round;
  no remaining actionable findings.
- **Current stage:** consolidation, repository verification, and independent
  review complete; checkpoint commit pending.
