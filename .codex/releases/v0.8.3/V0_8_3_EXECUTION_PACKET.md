# v0.8.3 Identity Foundation Execution Packet

STATUS: A6_ACTIVE;ID_B_DECISION_GATE_RESOLVED;S05_DIRECT_SCOPE_MAP_NEXT
BASE_BRANCH: main
BASE_SHA: 7d826f2683fbca8058ff08e8ae40acc1e095c076
BRANCH: release/v0.8.3-identity-foundation
ACCEPTED_SPEC: .codex/specs/active/v0.8.3-identity-intake-a5-accepted.md
CONTROLLING_AMENDMENT: V1R7-A6 Final Autonomous Completion Amendment, 2026-08-14
CONTINUITY: v0.8.3 -> v0.8.4 -> v0.8.5; no routine owner pause

## Entry facts refreshed after v0.8.2

- v0.8.2 S17 remains closed on main at
  `7d826f2683fbca8058ff08e8ae40acc1e095c076`.
- Production remains v0.8.2 at the separately deployed candidate
  `c316e047c845fa182e82156c95945c4a5e5de2ff`, schema 30, migration 0030.
- The V83 branch is clean and local/upstream/live-parity at
  `8db55a8c8f59c3720dda11889c37c5411005b6df` at A6 writer transfer.
- Existing ID-A account/session evidence remains valid; it does not authorize
  fabricated person, assignment, or privilege data.

## Stage plan

1. S00 — A5 minimal ID-A authority and privacy boundary: PASS.
2. S01 — post-V82 Git/runtime/schema freshness: PASS.
3. S02 — temporary release branch and Terra writer lock: historical PASS.
4. S03 — ID-A auth/session preservation: PASS (7 files, 42 tests).
5. S04 — verified preservation no-op: PASS; no source/schema/provider diff.
6. S05 — A6 owner-decision table adopted; writer-transfer and direct scope map.
7. S06+ — execute ID-B through ID-H as bounded expand-first slices, with
   focused tests first, then proportionate gates and release stages.

## A6 operational rules

- The six identity decisions in the accepted specification are authoritative;
  no new owner-decision gate is permitted for them.
- Person identity is immutable opaque `person_id`; email and account linkage
  follow the explicit cardinality, provenance, ambiguity, and no-auto-merge
  rules; assignment and authorization projection preserve baseline access and
  grant no inferred privilege.
- Never fabricate external/business truth. Use minimum authoritative sources,
  canonical internal-ID generation, or null/unknown/quarantine as applicable.
- Restore the shared password visibility control on applicable current password
  surfaces with focused behavioral/accessibility tests and Playground browser
  evidence before Figma interaction.
- Do not inspect Figma/Make before the password/browser evidence gate; do not
  perform provider writes, deployment, migration, or roster import before its
  exact slice preflight authorizes them.

## First bounded implementation scope

Map only the direct repository source/tests and any indispensable private
authoritative source dependency for (a) reusable password-entry controls and
(b) the existing identity/account/assignment seams needed to select the first
ID-B expand-first slice. Do not read unrelated private data, fabricate roster
truth, or change source during this map. Select one smallest reversible slice,
write focused regression coverage first, and commit/push it with parity.

## Release and stop condition

After each meaningful safe candidate: focused verification, review, commit,
push, Playground, acceptance, Production preflight, backup, protected merge,
Production deploy, smoke, reconciliation, pointers, cleanup, and S17. Stop
only at an A6 true safety/external-truth blocker; preserve and push safe work
and accurately release the writer lock before stopping.
