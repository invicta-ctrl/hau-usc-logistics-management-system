# P14 Profile and Personalization

DATE: 2026-08-28
PROGRAM: PLAYGROUND-MASTER-2026-08-28
STATUS: PASS_LOCAL_IMPLEMENTATION; LIVE_PROFILE_E2E_PENDING_P29_P31
ROUTE: SOLO

## Outcome

Profile is now a real authenticated surface organized around Identity, Account, Contact, Appearance, and Security & Activity. Institution-controlled identity, affiliation, role, and authorization grants remain read-only and have a concise correction-request path. Username, password, and contact changes use the existing authenticated, revision-guarded, audited backend contracts; username and password changes revoke the current session and return the user to sign-in.

Appearance now persists Light, Dark, or System through backend-owned account metadata that is already covered by the sealed D1 reset baseline. The authenticated transition loads this preference before mounting the session shell, avoiding a post-login theme race. Profile images use the isolated Playground R2 binding only, with upload/replace/remove, JPEG/PNG/WebP signature and size validation, non-sensitive metadata, private no-store reads, and initials fallback. Production and other non-Playground runtimes receive a generic 404 for avatar access.

## Reset and boundary behavior

- Appearance is stored under the existing reset-restored `app_metadata` authority, so no schema-33 migration was introduced.
- Avatar object linkage is revision-guarded and audited in D1; objects use the `playground-redacted/profile-avatars/` prefix in the isolated Playground bucket.
- The reset lifecycle already restores account avatar columns and D1 metadata and clears non-baseline R2 objects through its sealed manifest.
- Browser adapters project only the fields needed by Profile; credential values, private object metadata, and internal evidence identifiers are not rendered.
- Preview inspection remains read-only and cannot execute profile mutations.

## Verification

```text
Focused profile/service/adapter tests: PASS - 6 files / 53 tests
Full Vitest: PASS - 166 files / 1229 tests
Targeted Profile Playwright: PASS - 10 tests across 320/390/768/1024/1440 projects
Frontend build: PASS - 1679 modules
Release-candidate ESLint: PASS - 0 errors / 2 pre-existing warnings
Targeted Prettier: PASS
git diff --check: PASS
Generated artifacts: REBUILT - dist/index.html and HAU-USC_Logistics-Frontend-Shareable.html
Production mutation: NONE
Google mutation: NONE
Figma mutation: NONE
Playground deployment: NONE
```

The targeted browser run used an isolated local Vite server on port 4175. Its exact process was terminated after verification. The unrelated listener on port 4174 belongs to another preserved worktree and was not changed.

## Next exact action

Begin P15 UI/UX research. Use bounded current authoritative guidance for accessibility, restrained translucency/materials, enterprise operations UI, data-table/dashboard usability, responsive/mobile behavior, and Core Web Vitals. Record only the concise adopted/rejected decision note required by the accepted specification.
