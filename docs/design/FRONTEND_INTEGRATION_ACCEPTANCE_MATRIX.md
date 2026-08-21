# Frontend Integration Acceptance Matrix

The reusable verification gate for every FI slice, for the Playground candidate,
and for Production promotion. Run the slice-scoped subset per slice; run the
whole matrix at FI-14.

```text
APPLIES_TO      frontend-design-integration candidates for frozen v0.8.3
CONTRACT_SOURCE docs/design/FRONTEND_BACKEND_CONTRACT_MATRIX.md
A_PASS_IS       evidence, not an assertion. Record the command and its result.
A_NON_PASS      is recorded as non-pass. Never as PASS with a caveat.
```

---

## A. Contract completeness

| #   | Check                                                                                                     | Evidence                                                                  |
| --- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| A1  | Every field, action, and status listed for the slice in the contract matrix exists in the shipped surface | Field-by-field diff against the named source symbol                       |
| A2  | No existing backend capability was silently removed from a surface                                        | Before/after action inventory                                             |
| A3  | No unsupported design capability was fabricated                                                           | Every action maps to a listed Worker route or `METHOD_CAPABILITIES` entry |
| A4  | `public.register` remains unimplemented                                                                   | Route classification unchanged in `src/v5/src/registry.js`                |
| A5  | Route inventory unchanged unless an amendment authorized it                                               | 33 `SURFACES`, 34 `V5_ROUTE_CLASSIFICATIONS`                              |
| A6  | `SERVICE_METHODS` contract satisfied by any new adapter                                                   | `assertServiceContract` does not throw                                    |
| A7  | Status timelines built from the D1 transition tables, not `src/domain/`                                   | No `PARTIALLY_FULFILLED`, `IN_PROGRESS`, or `READY_FOR_HANDOFF` rendered  |

---

## B. Real backend, no fixtures

| #   | Check                                                                                                                                                         | Evidence                                                  |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| B1  | Every backend-supported route calls the real Playground Worker API                                                                                            | Network log shows `/api/*` requests, not local fixtures   |
| B2  | No Production-path mock or preview data renders                                                                                                               | `clearBackendViewModels()` still runs before first render |
| B3  | Browser code never touches D1 or R2 directly                                                                                                                  | Source scan: no D1/R2 client in `src/v5/**`               |
| B4  | A surface reaches the network only through `src/v5/integration/backend.js`                                                                                    | No `fetch(` in `src/v5/src/**`                            |
| B5  | No preview label, mock actor, fake count, demo selector, role simulator, viewport selector, version chrome, or implementation jargon in a user-facing surface | Text scan + screenshots                                   |
| B6  | Media and brand assets are Worker-served, not inlined or re-hosted                                                                                            | Requests resolve to `/brand/*` and `/media/*`             |

---

## C. Authorization and security

| #   | Check                                                                                                 | Evidence                                          |
| --- | ----------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| C1  | Authorization is enforced server-side; UI hiding is never the control                                 | Denied-case test per capability in the slice      |
| C2  | Each slice route rejects a user lacking its capability                                                | `isV5RouteAuthorized` denial **and** a server 403 |
| C3  | Session, CSRF, credential-version, expiry, revocation, and rate-limit behavior unchanged              | Auth suite green                                  |
| C4  | CSRF token never rendered, logged, copied, or exposed to a surface                                    | Source scan + console scan                        |
| C5  | Login and reset failures remain generic; no account enumeration                                       | Negative-path test                                |
| C6  | Eight-digit verification lifecycle and resend invalidation preserved                                  | Application-flow test                             |
| C7  | Bearer status-token flows stay separate from session flows                                            | Application-status and withdraw tests             |
| C8  | Public mutation origin guard intact: cross-site rejected 403, non-JSON rejected 415                   | `assertPublicMutationOrigin` tests                |
| C9  | Account-application review still requires `reviewEvidence`; the decrypted envelope is never rendered  | Review-form test                                  |
| C10 | No export, copy-all, print, or screenshot affordance added to roster, directory, or identity surfaces | Manual surface review                             |

---

## D. Data integrity

| #   | Check                                                                                                        | Evidence                                                               |
| --- | ------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------- |
| D1  | Request submission does not deduct physical stock                                                            | Ledger unchanged after submit                                          |
| D2  | Reservations affect availability only, never on-hand quantity                                                | Availability vs on-hand assertion                                      |
| D3  | Release, handoff, return, receiving, transfer, reversal, and adjustment remain explicit authorized movements | Per-action test                                                        |
| D4  | Inventory quantity still derives from the append-only ledger                                                 | No client-computed on-hand                                             |
| D5  | Activity History remains append-only and role-scoped                                                         | History query before/after                                             |
| D6  | Posted ledger, audit, custody, identity, approval, status, and evidence history is not overwritten           | Row-count and immutability assertion                                   |
| D7  | No frontend change reruns, rewrites, or adds a migration; 0031 and 0032 untouched                            | `git diff --stat migrations/` empty; `/api/admin/migrations` unchanged |
| D8  | Canonical identity and account-to-person linkage never inferred from a name, email, role, or display string  | Identity-foundation test                                               |
| D9  | Unknown records stay unresolved or quarantined; no fabricated balance, identity, date, role, or provenance   | Manual review of empty and unknown states                              |
| D10 | Server pagination bounds respected: 100 standard, 500 inventory, 500 child rows                              | No client-side bound override                                          |
| D11 | Retry reuses the idempotency key                                                                             | Duplicate-submit test produces one record                              |

---

## E. UI states

Every state declared for the slice in the contract matrix must render, at every
listed width, in both themes.

```text
loading      empty       populated    success
error        denied      unavailable  validation error
stale / conflict (revision drift)     partial (restocking, partial release)
```

| #   | Check                                                                               |
| --- | ----------------------------------------------------------------------------------- |
| E1  | Widths 320, 390, 768, 1024, 1440 CSS px                                             |
| E2  | 200% browser zoom                                                                   |
| E3  | Light and dark, both resolving from tokens, no mixed-theme frame (`DESIGN.md` V-36) |
| E4  | Keyboard-only traversal of every interactive control                                |
| E5  | Visible focus on every focusable element; focus restored on dialog and drawer close |
| E6  | Dialogs and drawers trap focus and close on Escape                                  |
| E7  | Reduced motion honoured; every animation settles                                    |
| E8  | No page-level horizontal overflow at any width                                      |
| E9  | WCAG 2.2 AA contrast for every text/background pair, measured at native resolution  |
| E10 | Dirty-state guard preserved on forms                                                |
| E11 | Skip link and landmark structure intact                                             |

Contrast is **measured**, not eyeballed, using `scripts/design/contrast-audit.mjs`
and `overlay-contrast.mjs`. Screenshots for contrast verification are taken at
native resolution — a downscale once hid a 283-node regression.

---

## F. Environment isolation

| #   | Check                                                                                            | Evidence                                                             |
| --- | ------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------- |
| F1  | Playground Worker, D1, R2, secrets, and queues are distinct from Production                      | `wrangler.jsonc` env blocks; binding read-back                       |
| F2  | Browser state cannot retarget the environment                                                    | No client environment switch; `entry.js` contract comment still true |
| F3  | Playground data never synchronizes back to Production                                            | One-way refresh runbook only                                         |
| F4  | Production-derived data used only under the accepted refresh runbook, minimized and time-bounded | Runbook citation                                                     |
| F5  | No live Production mutation during frontend acceptance                                           | Production D1/R2 pre/post fingerprints unchanged                     |
| F6  | `/api/playground/*` controls do not appear in a Production build                                 | `isPlaygroundRuntime` gate verified                                  |

---

## G. Commands

```bash
# per slice
npm run lint
npm test
npm run build
npm run verify:dist

# shell, navigation, or responsive slices
npm run test:e2e
npm run test:e2e:v5
npm run test:e2e:v5:visual

# design and accessibility audits
node scripts/design/contrast-audit.mjs
node scripts/design/overlay-contrast.mjs
node scripts/design/keyboard-audit.mjs
node scripts/design/responsive-audit.mjs
node scripts/design/semantics-audit.mjs
node scripts/design/comfort-audit.mjs

# theme cascade, if FI-01 touched tokens
npm run design:make-theme:check
npm run design:make-verify
npm run design:make-landing

# candidate freeze
npm run check
npm run release:candidate:manifest
npm run verify:deploy:artifact
npm run check:apps-script
npm run check:governance

# Playground and Production gates
npm run cloudflare:preflight
npm run staging:candidate:evidence
npm run staging:candidate:smoke
npm run production:preflight
npm run production:authorization:check
```

`scripts/design/*` runs only if FI-00's owner decision promoted that directory
to the work branch's tree. Frozen main has no `scripts/design/`.

---

## H. Reusable evidence and invalidators

Do not re-run a passed gate while its inputs are unchanged.

| Evidence                     | Invalidated by                                                                                                                                   |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Contract parity for a slice  | `src/worker/index.js`, `src/server/**`, `src/services/**`, `src/v5/integration/**`, `src/domain/permissions.js`, `src/app/bootstrap-contract.js` |
| Visual and responsive matrix | `src/v5/styles/**`, `src/v5/src/**`, `src/index.html`, `DESIGN.md`                                                                               |
| Token and cascade checks     | `scripts/design/theme-source.mjs`, `output/design/make-adoption/theme.css`, `src/v5/styles/tokens.css`                                           |
| Generated artifact parity    | `vite.config.js`, `package.json`, `scripts/create-v5-shareable.mjs`, any `src/**` change                                                         |
| Auth and security suite      | `src/server/auth/**`, `src/auth/**`, `src/server/account-application/**`                                                                         |
| Data-integrity suite         | `src/server/d1/**`, `migrations/**`                                                                                                              |
| Playground acceptance        | **any** source or artifact change — a candidate is invalidated by definition                                                                     |

---

## I. Candidate identity to record at FI-13

```text
CANDIDATE_COMMIT
CANDIDATE_TREE
LOCKFILE_AND_TOOLCHAIN
APPLICATION_ARTIFACT_IDENTITY     dist hash and byte size
WORKER_IDENTITY
SCHEMA_AND_MIGRATION_STATE        expect schema32, 0031 + 0032
TARGET_ENVIRONMENT
PLAYGROUND_BASELINE
```

At FI-15, a protected merge may produce a different commit SHA on `main`. That
is expected. A different **tree** or a different **application artifact** is a
hard stop. Prove equivalence with the exact Playground-tested candidate before
Production, and never silently rebuild different source.

---

## J. Non-pass discipline

```text
A green CI run is not Production approval.
A successful Playground deployment is not Production approval.
Production promotion requires Earl's explicit GO for the exact tested candidate.
Any source or artifact change after Earl tests a candidate invalidates approval.
Freeze and test a new candidate.

If a gate is waived, record it as OWNER_WAIVED. Never as PASS.
If a gate did not run, record it as UNRUN. Never as PASS.
```
