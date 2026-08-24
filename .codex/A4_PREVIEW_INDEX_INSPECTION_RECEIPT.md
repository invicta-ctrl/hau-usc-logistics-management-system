# A4 Preview Index Local Inspection receipt

Status: Sol accepted the complete A4 logical diff and authorized the single checkpoint commit/push.

## Authority and boundaries

- Accepted specification: .codex/specs/accepted/2026-08-24-fi04-fi17-r1-a4-preview-index-local-inspection-no-login-module-browsing.md.
- Attachment SHA-256: FCC881623BD6D941EB881D60542748A8ADF0B14EEA0F40151440244BD23921B0; repository copy is byte-identical.
- Starting branch/HEAD: frontend-design-integration at 2bc233bf6f73c84b930247e06f9f05ddb681d9f5, upstream parity 0/0.
- Pre-existing untracked .ai-bridge/ was preserved and excluded.

## Delivered behavior

- PreviewInspectionState is separate from Session, auth gate state, entry intent, and server capability projection.
- Activation requires Vite DEV, exact 127.0.0.1:4173, a validated Index, open Index state, and an explicit rendered Index action. Hash/query/storage cannot activate it alone.
- Protected rows expose Open Preview; Test Real Access remains normal controller navigation and reaches unchanged authentication/capability behavior. Public rows remain normal navigation.
- Internal inspection uses ShellPresentation and LOCAL_PREVIEW_OPERATOR, not a Session. The actual FI-04 shell and Profile render with an injected deterministic profile fixture before any profile effect can call the backend.
- External Request Center renders through its actual component with an injected deterministic RequesterPortal fixture before effects. Submission is disabled/intercepted in inspection mode, and no protected request reaches the network.
- The banner, data-preview-inspection=true, data-preview-route, explicit Back to Preview Index, and query/scroll browsing state are present. Normal Home remains a separate exit to normal landing; no Sign out label is rebound.
- Profile registry truth is now ACCEPTED / REAL_BACKEND / REAL_MODULE; later FI slices remain explicitly surface/design previews.

## Verification

- npm.cmd test -- tests/unit/preview-index-foundation.test.js: 10 passed.
- Default 1440 Preview Index E2E: 13 passed and 1 intentional exact-4173 skip; the 4174 gate is fail-closed.
- Opt-in existing-4173 INDEX-INSPECT E2E: 1 passed, without restart; inventory, Profile, and External Request Center inspected with zero protected API requests.
- Targeted R3-A1-A2 routing checks at 1440 passed for public, requester, generic staff, profile, Home/sign-out, and activation behavior; the focused 390 mobile drawer regression passed.
- npm.cmd run build and npm.cmd run verify:dist passed.
- Sol acceptance: complete logical diff and independent evidence accepted before checkpoint; no second review loop or FI-05 implementation is authorized.

## External-state boundary

No Figma/Make, backend/Worker, provider, Playground business-data, Production, D1/R2, migration, deployment, main, commit, or push mutation occurred. The loopback preview is a frontend presentation inspection facility only.
