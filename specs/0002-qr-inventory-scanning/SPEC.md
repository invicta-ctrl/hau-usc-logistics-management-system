---
spec_id: "0002"
title: "QR Inventory Scanning, Labels, and Immediate Issue"
status: IN_REVIEW
owner: "Earl Adriano"
created: 2026-07-13
last_updated: 2026-07-13
accepted_by: null
accepted_at: null
supersedes: null
superseded_by: null
---

# 0002 — QR Inventory Scanning, Labels, and Immediate Issue

## 1. Authority and source references

- Initial user instruction: “Add QR-code inventory scanning to the HAU-USC Logistics Management System. Start editing the repository immediately.”
- Amendment instruction: “Before I accept it, add a new requirement: scanning a QR code should immediately deduct inventory and create a ledger transaction.”
- Governing repository rules: `AGENTS.md`, `docs/SPEC_DRIVEN_DEVELOPMENT.md`, `docs/AI_COLLABORATION.md`, and `specs/README.md`.
- Project state: `PROJECT_STATUS.md` and `docs/WORK_CONTINUATION.md` from the V1 release-candidate line.
- Relevant architecture/domain/security documents: `docs/ARCHITECTURE.md`, `docs/DOMAIN_RULES.md`, `docs/SECURITY_AND_ACCESS.md`, `docs/API_AND_SERVICE_CONTRACTS.md`, `docs/TESTING_AND_ACCEPTANCE.md`, and `docs/LAUNCH_RUNBOOK.md`.
- Context Vault routing: `invicta-ctrl/gpt-context-vault`, beginning with `START_HERE.md`, `CONTEXT_INDEX.md`, and `projects/PROJECT_REGISTRY.md`.
- Starting repository state: `docs/adopt-spec-driven-development` at `bfafcf242e03a85ad450f220d423af8bad064f07`.
- Working branch: `feat/qr-inventory-scanning`.

## 2. Problem statement

Inventory staff currently locate and issue items through text search and separate operational actions. During physical inventory work and rapid office distribution, typing an item name or ID and then opening another form adds delay and increases the chance that an item physically leaves storage before its movement is recorded.

The system’s inventory truth is an append-only ledger. A QR workflow must therefore make the physical issue and the digital record one controlled operation. It must not directly rewrite a quantity cell, bypass authorization, double-deduct because the camera decoded the same frame repeatedly, expose protected data in the label, or issue an item that belongs in a lending or reservation-backed workflow.

## 3. Intended outcome

Authorized internal staff can open a dedicated **Issue by QR** workflow in Inventory Management, set the issue context and quantity, arm the scanner, and scan a system-generated item label. The first valid scan immediately submits one server-authorized inventory issue command without a second post-scan confirmation.

A successful command appends exactly one immutable outbound `ISSUE` ledger movement, reduces the item’s ledger-derived on-hand and available-to-promise values by the authorized quantity, advances the shared data revision exactly once, records audit evidence, and returns the updated item result. The scanner then disarms until the operator explicitly chooses to scan the next item.

Each inventory item can also display a printable QR label whose encoded payload contains only a versioned type marker and stable item ID. Label generation remains read-only.

## 4. Scope

### In scope

- Add an internal Inventory Management action to open and close a dedicated **Issue by QR** scanner.
- Require the operator to enter or select issue context before arming the scanner:
  - quantity, defaulting to `1` base unit;
  - purpose or reason;
  - optional approved related reference when supported by the existing model.
- Decode QR codes through a client-side decoder bundled with the application; no external network call may be required at scan time.
- Add a manual code-entry fallback for devices without camera access, denied permissions, unsupported APIs, or automated testing. Manual submission in Issue by QR mode performs the same server-authorized issue command.
- Define and validate one versioned inventory QR payload format:

  ```text
  HAU-USC|ITEM|<ITEM_ID>|V1
  ```

- Encode only the stable item ID and non-sensitive routing markers; item name, quantity, stock level, location, borrower data, user data, and live URLs must not be embedded.
- Resolve the decoded item ID by exact match against the current authorized inventory catalog.
- Immediately submit one issue command after the first valid decode while the scanner is armed. There is no second confirmation after the scan.
- Pause decoding and disarm the scanner while the command is in flight and after success or failure. A new transaction requires an explicit re-arm and a new idempotency key.
- Authorize the mutation server-side using the existing release/issue authority boundary, currently `Can_Release`, unless repository inspection proves a narrower existing permission is authoritative.
- Revalidate item status, handling eligibility, requested quantity, physical balance, available-to-promise, and relevant dependencies under a script lock immediately before writing.
- Allow immediate QR issue only for items eligible for direct stock issue under current domain rules. `VERIFY`, inactive, archived, non-circulating, loanable, reusable-asset, reservation-bound, event-item, or otherwise workflow-controlled items fail closed and direct the operator to the appropriate existing workflow.
- Append exactly one immutable outbound ledger movement using the existing ledger schema and movement contracts. The command must include a server ID, item ID, quantity, movement type/direction, actor, timestamp, reason/context, idempotency key, audit correlation ID, and related entity when supplied.
- Record audit/status evidence and advance the aggregate data revision exactly once for a successful non-replay mutation.
- Return the authoritative transaction ID and updated item balance summary to the internal UI.
- On malformed, unsupported, unknown, unsafe, or insufficient-stock results, show a clear safe message and create no ledger, audit, history, reservation, or revision mutation.
- Add a per-item QR-label action and a print-friendly label view containing the item name, item ID, and generated QR image. The visible label may show the item name and item ID; the encoded payload remains ID-only.
- Preserve deterministic single-file builds and standalone demo behavior with fictional inventory data. Demo mode must simulate the ledger mutation through the mock adapter rather than editing balance fields directly.
- Add focused domain, backend, adapter, browser, accessibility, responsive, privacy, idempotency, and build verification.

### Systems and files likely affected

- A new domain/helper module for QR payload creation, parsing, validation, and scan-session state.
- `src/visual/runtime-extensions.js` or the current authoritative Inventory Management extension point.
- `src/styles/visual/runtime-extensions.css`.
- Browser service contract, Apps Script adapter, mock adapter, and future adapter parity declarations.
- Apps Script router and inventory service code for one new server-authorized issue-by-QR command, using existing ledger, lock, command-journal, audit, history, and revision services.
- A bundled QR encoder/decoder dependency or small reviewed local implementation.
- Frontend and backend tests under `tests/unit/` and `tests/e2e/`.
- `package.json` and `package-lock.json` if a dependency is added.
- Generated artifacts only through the existing deterministic build pipeline.
- `docs/API_AND_SERVICE_CONTRACTS.md`, `docs/ADMIN_GUIDE.md`, `docs/SECURITY_AND_ACCESS.md`, `CHANGELOG.md`, `PROJECT_STATUS.md`, `docs/WORK_CONTINUATION.md`, and this specification during implementation and verification.

### User roles and workflows affected

- Authorized internal inventory and release staff.
- Inventory Management direct consumable issue workflow.
- Append-only ledger, audit, idempotency, and revision synchronization.
- No requester-only or public Lending Hub behavior.

## 5. Non-goals

- No direct QR receive, lend, release against an event request, return, transfer, reserve, archive, restore, or stock adjustment in this specification.
- No bypass of the Office Lending Hub for loanable or reusable assets.
- No bypass of Release Desk for reservation-backed or request-linked releases.
- No mutable inventory balance field or direct quantity-cell rewrite. Deduction is derived only from the appended outbound ledger movement.
- No batch transaction from one scan. One accepted scan creates one ledger movement for the preselected quantity.
- No background or passive scanning. The operator must explicitly open and arm Issue by QR mode.
- No automatic repeated deduction while the same code remains in the camera frame. A completed or failed attempt disarms the scanner.
- No Google Sheets schema change unless implementation proves the existing ledger cannot represent the required movement; that condition requires a stop, amendment, and renewed acceptance.
- No QR image file storage in Google Drive.
- No borrower, requester, supplier, evidence, or personal data in QR payloads.
- No public/request-only scanner.
- No barcode formats other than QR in this specification.
- No serialized asset-instance tracking, per-unit QR identity, or replacement of the existing item-level catalog model.
- No deployment, migration, merge, tag, release, Apps Script push, live Google Sheet mutation, or live Google Drive mutation during this repository task.
- Reusing the scanner inside Lending Hub, Release Desk, Restocking, Receiving, or Procurement is deferred to a separately accepted amendment or specification.

## 6. Assumptions and constraints

### Technical constraints

- The current authoritative UI is the extracted visual runtime; generated HTML files must not be hand-edited.
- The scanner must run within the existing Vite single-file build and Apps Script HTML Service packaging path.
- The decoder must be bundled locally and must not require a CDN or remote service at runtime.
- Camera access requires a secure browser context and explicit user permission; the feature must degrade to manual entry without blocking the authorized issue workflow.
- Tests must not depend on a real camera. Decoder, media access, adapters, and command results must be injectable or mockable.
- The feature must preserve deterministic generated artifacts.
- The browser must never calculate or persist the authoritative new balance. It submits intent and renders the authoritative server result after refresh.

### Product/domain constraints

- Stable item IDs remain authoritative. A QR label is an alternate input method, not a new inventory identity.
- Item quantities remain ledger-derived.
- Every accepted direct issue is one immutable outbound ledger movement.
- `VERIFY`, inactive, archived, non-circulating, loanable, reusable-asset, reservation-controlled, and workflow-controlled items fail closed in Issue by QR mode.
- A stale or unknown code must not silently select or transact a similarly named item.
- Quantity must be a positive value supported by the item’s base unit and no greater than the current authorized balance.
- Corrections never edit or delete the posted issue row; they use the existing authorized reversal or adjustment process.

### Security/privacy constraints

- The scanner is internal-only and must follow the server-authorized portal boundary.
- QR payloads are untrusted browser input and must be strictly parsed with exact prefix, type, version, and item-ID validation.
- The encoded value must not contain protected balances, reservations, Drive identifiers, evidence links, users, contacts, student IDs, or other sensitive data.
- Scanning must not grant authorization. The server resolves the active institutional user and checks permission for every command.
- Camera frames must remain local to the browser and must not be uploaded, logged, or persisted.
- The browser-provided item ID, quantity, reason, related reference, and idempotency key are all untrusted and revalidated server-side.

### Time, environment, and tooling constraints

- Preserve the one-writer rule.
- Implementation starts only after this amended specification is explicitly accepted.
- Repository work is allowed only on the isolated feature branch.
- Live Google Workspace and deployment actions remain prohibited.

## 7. Requirements

### REQ-001 — Versioned inventory QR payload

The system shall generate and parse exactly one initial payload format, `HAU-USC|ITEM|<ITEM_ID>|V1`, where `<ITEM_ID>` is a valid stable inventory item ID. Parsing shall reject extra fields, unsupported versions, unsupported entity types, blank IDs, and malformed values.

### REQ-002 — Privacy-minimal QR labels

The encoded QR payload shall contain only the routing markers, version, and stable item ID. The print-visible label may include the item name and item ID but shall not display protected stock balances, reservations, personal data, supplier data, or private URLs.

### REQ-003 — Explicitly armed internal scanner

Inventory Management shall provide an internal-only Issue by QR UI that requests camera access only after explicit user action, requires issue context before arming, displays permission/loading/armed/processing/success/error states, allows the user to stop the camera, and releases the media stream when closed, completed, hidden, or navigated away from.

### REQ-004 — Manual fallback with equivalent behavior

The Issue by QR UI shall include a manual input that accepts the exact QR payload or a stable item ID. Submitting the manual value while the issue form is armed shall use the same parser, authorization, validation, idempotency, ledger, audit, revision, and result behavior as camera decoding.

### REQ-005 — Immediate issue on first valid scan

When an authorized operator has armed Issue by QR mode and the decoder produces the first valid eligible item payload, the browser shall immediately submit one issue command using the preselected quantity and context without a second post-scan confirmation. The decoder shall pause before submission and remain disarmed until the operator explicitly starts the next scan.

### REQ-006 — Atomic append-only inventory deduction

A successful issue-by-QR command shall, under one server-side lock and idempotency boundary, revalidate the current item and balance, allocate a server transaction ID, append exactly one immutable outbound `ISSUE` ledger movement, append required audit/history evidence, advance the aggregate data revision exactly once, and return the authoritative result. The system shall not directly rewrite an inventory quantity field.

### REQ-007 — Authorization and workflow eligibility

The server shall resolve the active institutional user and require the existing authoritative release/issue permission. The command shall reject `VERIFY`, inactive, archived, non-circulating, loanable, reusable-asset, reservation-bound, event-item, insufficient-stock, invalid-unit, and otherwise workflow-controlled items without writing any operational record.

### REQ-008 — Duplicate-scan and replay protection

Only one issue command may be in flight for a scanner session. Repeated decoder frames, double submissions, network retries, and completed idempotency-key replays shall produce at most one ledger movement and one data-revision increment. A new intentional issue requires explicit re-arming and a new idempotency key.

### REQ-009 — Safe failure and authoritative feedback

Malformed, unsupported, unknown, unauthorized, unsafe, stale, or insufficient-stock results shall show a specific safe message and correlation ID where applicable. Success shall show the server transaction ID, issued quantity, item name/ID, and authoritative updated balance summary. The UI shall refresh authoritative state after the command and shall not infer success from local calculations.

### REQ-010 — Accessible and responsive interaction

The scanner, issue-context form, manual fallback, processing/result states, and label view shall be keyboard accessible, screen-reader labeled, focus-managed, and usable without horizontal page overflow at the project’s required mobile and desktop widths.

### REQ-011 — Deterministic and testable implementation

The decoder boundary, payload parser, scan-session state, authorization contract, idempotent mutation, ledger append, and item-resolution behavior shall be testable without a physical camera or live Google resource. Existing lint, unit, build, Apps Script packaging, artifact-verification, governance, privacy, and relevant Playwright checks shall remain green.

## 8. Acceptance criteria

### AC-001 — Generated payload is stable and privacy-minimal

Given an eligible inventory item with ID `ITM-0001`, when the QR label is generated, then the encoded value is exactly `HAU-USC|ITEM|ITM-0001|V1`, and no quantity, location, balance, reservation, user, borrower, supplier, evidence, Drive, or URL field is encoded.

Evidence expected:

- Unit tests for payload generation and parsing.
- Inspected generated label in demo mode.

### AC-002 — One valid scan immediately creates one issue

Given an authorized internal user, an armed Issue by QR session with quantity `1`, and an eligible active item with sufficient stock, when the decoder returns that item’s valid payload, then the browser immediately submits the command without another confirmation and the authoritative result contains exactly one new outbound `ISSUE` ledger transaction for quantity `1`.

Evidence expected:

- Browser test with mocked media/decoder and adapter spy.
- Backend/service test asserting one ledger append and no direct quantity rewrite.

### AC-003 — Inventory balance is deducted from ledger truth

Given an item with ledger-derived on-hand `10` and no reservation conflict, when a valid issue-by-QR command for quantity `2` succeeds, then one immutable outbound movement of `2` is appended, the authoritative on-hand becomes `8`, available-to-promise is recomputed from ledger/reservations, audit/history evidence is appended, and data revision advances exactly once.

Evidence expected:

- Backend integration test covering ledger, audit/history, and revision records.

### AC-004 — Manual fallback performs the same controlled issue

Given camera access is unavailable, unsupported, or denied, when an authorized user arms the form and manually enters a valid payload or exact item ID, then the same immediate server-authorized issue behavior succeeds without requiring camera permission.

Evidence expected:

- Browser/unit test for unsupported/denied camera state and successful manual issue.

### AC-005 — Unsafe or ineligible items fail closed

Given a malformed payload, unsupported version/entity type, unknown item ID, `VERIFY`, inactive, archived, non-circulating, loanable, reusable-asset, reservation-bound, event-item, invalid-unit, or insufficient-stock item, when it is scanned or entered, then the UI shows a specific safe message and no ledger, audit, history, reservation, or revision mutation occurs.

Evidence expected:

- Table-driven parser, policy, and backend tests covering every rejected class.

### AC-006 — Duplicate frames and retries cannot double-deduct

Given the same QR remains visible across multiple decoded frames or the same command is retried, when the first command succeeds, then all duplicate frames are ignored while processing and any completed idempotency-key replay returns the stored result with no second ledger row, audit row, or revision increment.

Evidence expected:

- Scanner state tests, adapter retry tests, and backend idempotency tests.

### AC-007 — A new transaction requires explicit re-arm

Given a successful or failed scan attempt, when the result is displayed, then the scanner is disarmed, active media tracks are stopped or paused according to the reviewed implementation, and another deduction cannot occur until the operator explicitly selects “Scan next item,” which allocates a new idempotency key.

Evidence expected:

- Browser lifecycle test with mocked tracks and command counter.

### AC-008 — Public portals remain unchanged

Given request-only or public Lending Hub mode, when the application loads, then no Issue by QR scanner or QR-label control is rendered, no protected inventory collection or issue API is exposed to the portal, and current public bootstrap/privacy tests continue to pass.

Evidence expected:

- Existing public-privacy tests plus focused visibility and callable-boundary assertions.

### AC-009 — Camera lifecycle and privacy are controlled

Given the scanner has an active media stream, when the modal closes, a scan is accepted, an error occurs, the user navigates away, or the page becomes hidden, then active media tracks are stopped as required and no frame, image, or decoded camera data is uploaded, persisted, or logged.

Evidence expected:

- Browser/unit tests with mocked media tracks and stop-call assertions.

### AC-010 — Label and scanner remain accessible and responsive

Given keyboard-only and screen-reader use at 320, 390, 768, 1024, 1366, and 1440 pixel widths, when the scanner and label view are opened, armed, processed, and closed, then focus is visible and restored, destructive consequences are clearly described before arming, controls have accessible names, status updates are announced, and no page-level horizontal overflow is introduced.

Evidence expected:

- Focus/accessibility assertions and the relevant Playwright viewport matrix.

### AC-011 — Repository verification remains green

Given the implementation is complete, when required project checks run, then lint, unit tests, deterministic build, Apps Script package/static validation, standalone artifact verification, governance, privacy, backend mutation, and relevant Playwright tests pass with exact results recorded.

Evidence expected:

- `npm run check`.
- `npm run verify` when required by the branch workflow.
- Focused backend and scanner tests.
- Full relevant Playwright results.
- CI status for the feature branch.

## 9. External-write permissions

- Repository writes allowed: yes, only on `feat/qr-inventory-scanning`, after this amended specification is accepted for implementation.
- Google Workspace writes allowed during this task: no.
- Deployment, migration, merge, tag, release, or destructive actions allowed: no.
- Repository implementation may add the server-side mutation code and mock/demo behavior, but it must not invoke a live Google Sheet, Drive, Apps Script deployment, trigger, or production resource during development or verification.
- Explicitly prohibited actions: Apps Script push, immutable version creation, deployment-pointer change, Script Property change, trigger change, live Google Sheet mutation, live Google Drive mutation, production action, PR merge, tag, release, protected PR #2 modification, and history rewrite.

## 10. Security, privacy, and data considerations

- Authorization boundary: internal inventory UI plus server-enforced release/issue permission; browser visibility is not authorization.
- Sensitive data involved: no sensitive data may be encoded. Camera frames are transient local input.
- Logging/redaction requirements: do not log frame data, decoded images, private bootstrap data, or full unexpected payloads. Safe logs may record item ID, transaction ID, bounded reason code, actor identity under existing audit rules, and correlation ID.
- Data integrity and concurrency requirements: every command requires validation, authorization, server IDs, a script lock, idempotency, append-only ledger, audit/history evidence, and exactly one data-revision increment for a successful non-replay mutation.
- Browser trust: item ID, quantity, reason, reference, and idempotency key are untrusted. The server rereads current item, ledger, reservation, and policy state before committing.
- Duplicate protection: decoder callbacks are ignored while processing; the backend command journal remains authoritative across retries and devices.
- Recovery: unexpected post-write failure must return a bounded recovery-required result with correlation and transaction context rather than inviting an automatic blind retry.
- Supply-chain requirement: any added client dependency must be pinned through the lockfile, bundled locally, reviewed for license/size/security suitability, and covered by existing build and sensitive-content checks.

## 11. Implementation plan

1. Add a pure QR payload module with exact generation, parsing, normalization, and safe error codes (`REQ-001`, `REQ-002`).
2. Add a mockable decoder/media boundary and explicit scanner-session state machine with arm, process, disarm, cleanup, and manual fallback (`REQ-003`–`REQ-005`, `REQ-008`–`REQ-010`).
3. Add a semantic issue-by-QR service contract across the browser contract, mock adapter, Apps Script adapter, and future adapter declaration (`REQ-005`–`REQ-009`).
4. Implement the Apps Script command using existing authorization, lock, idempotency, ledger, audit/history, error, and data-revision services without changing the Sheet schema (`REQ-006`–`REQ-009`).
5. Integrate the internal-only Issue by QR form, immediate command submission, authoritative result rendering, and per-item print-friendly labels into Inventory Management (`REQ-002`–`REQ-010`).
6. Add unit, integration, browser, privacy, accessibility, and viewport tests; regenerate owned artifacts through the normal build; update contracts, operator guidance, status, and evidence (`REQ-011`).

## 12. Task checklist

- [ ] Amended spec explicitly accepted by Earl.
- [ ] Add and test payload generator/parser (`REQ-001`, `REQ-002`).
- [ ] Add and test scanner-session lifecycle and duplicate-frame suppression (`REQ-003`, `REQ-005`, `REQ-008`).
- [ ] Add manual fallback with equivalent issue behavior (`REQ-004`).
- [ ] Add semantic service/adapter contract (`REQ-005`–`REQ-009`).
- [ ] Add server-authorized atomic issue-by-QR command (`REQ-006`–`REQ-009`).
- [ ] Add direct-issue eligibility and fail-closed policy tests (`REQ-007`).
- [ ] Add internal-only UI, authoritative feedback, and label view (`REQ-002`, `REQ-003`, `REQ-009`, `REQ-010`).
- [ ] Add idempotency, retry, recovery, privacy, accessibility, and viewport checks (`REQ-008`–`REQ-011`).
- [ ] Run required checks and record exact evidence (`REQ-011`).
- [ ] Update `docs/API_AND_SERVICE_CONTRACTS.md`, operator/security guidance, `CHANGELOG.md`, `PROJECT_STATUS.md`, `docs/WORK_CONTINUATION.md`, and this specification.

## 13. Verification plan

| Acceptance criterion | Verification method | Command or procedure | Required result |
|---|---|---|---|
| `AC-001` | Unit + inspection | Focused QR payload tests and demo label inspection | Exact V1 payload; no protected fields |
| `AC-002` | Browser + backend | Mock decoder returns eligible item payload | Immediate command; exactly one `ISSUE` row |
| `AC-003` | Backend integration | Start at on-hand 10; issue quantity 2 | Ledger-derived on-hand 8; audit/history; revision +1 |
| `AC-004` | Browser/unit | Mock denied/unsupported camera and manual submit | Same controlled issue without camera |
| `AC-005` | Unit/backend | Table-driven invalid, unsafe, and insufficient cases | Safe error; zero operational writes |
| `AC-006` | Unit/integration | Repeated frames, double submit, retry, idempotent replay | At most one movement and one revision increment |
| `AC-007` | Browser lifecycle | Attempt second decode before explicit re-arm | No second command; new key only after re-arm |
| `AC-008` | Browser/privacy/backend | Load request-only and lending-only portals | No scanner, protected data, or callable access |
| `AC-009` | Unit/browser | Close/success/navigation/visibility/error lifecycle cases | Tracks stopped; no camera data persisted or logged |
| `AC-010` | Browser/accessibility | Keyboard flow and required viewport matrix | Clear consequence, focus restored, named controls, no overflow |
| `AC-011` | Repository/CI | Required project commands and branch CI | All required checks pass |

Required project checks:

```text
npm run check
npm run verify
```

Run focused QR/backend mutation tests and the full relevant Playwright matrix when Chromium is available. Record intentionally inapplicable cases rather than weakening assertions.

## 14. Rollback, recovery, and reversibility

- The repository feature is additive and isolated on its branch. Reverting its commits removes the scanner, label, service contract, and backend callable from source.
- Generated artifacts are restored only by rebuilding from reverted source; do not hand-edit them.
- No live operational data is created during this repository task, so repository rollback requires no live Sheet or Drive cleanup.
- After future deployment, posted issue transactions remain immutable. A mistaken scan is corrected only through the existing authorized reversal or adjustment workflow with linked reason, actor, timestamp, and audit evidence; never delete or edit the original ledger row.
- If an unexpected post-write error occurs, operators must use the returned correlation/transaction context to reconcile before retrying. Do not generate a new key until the prior result is known.
- If a decoder dependency causes build, license, security, or compatibility problems, remove it and suspend camera scanning; do not retain a mutation path that lacks verified duplicate protection.

## 15. Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Same QR decoded across many frames | Multiple unintended deductions | Pause decoder before command, one in-flight command, disarm after result, server idempotency |
| Wrong item scanned | Immediate stock reduction on wrong record | Explicit armed mode, visible consequence, exact ID resolution, authoritative success receipt, reversal workflow |
| Wrong quantity/context preselected | Incorrect ledger movement | Clear pre-arm summary, positive/unit validation, server revalidation, no hidden defaults beyond visible quantity 1 |
| Insufficient or stale stock | Negative or conflicting allocation | Lock and re-read ledger/reservations immediately before append; fail with zero writes |
| Loanable/reusable item bypasses Lending Hub | Lost return accountability | Direct-issue eligibility rejects loanable/reusable/workflow-controlled items |
| Request/reservation release bypass | Broken request traceability | Reject reservation-bound and request-linked items; use Release Desk instead |
| Unauthorized user scans a code | Unauthorized stock movement | Server-resolved identity and permission check on every command |
| Network retry after successful write | Duplicate movement | Command journal/idempotency returns stored result without new ledger/revision writes |
| Post-write response failure | Operator may retry blindly | Recovery-required response, correlation context, reconcile before new key |
| Camera permission denied or unavailable | Scanner cannot start | Manual fallback with identical controlled command path |
| QR payload exposes operational data | Privacy leakage when labels are seen | Encode only stable item ID and non-sensitive routing/version markers |
| Camera stream left active | Privacy and battery impact | Centralized cleanup on close, processing, result, error, navigation, visibility change, and teardown |
| Added dependency breaks deterministic build | Release regression | Pin and bundle locally; verify license/security; run deterministic artifact checks |
| Feature appears in public portals | Protected catalog/API exposure | Internal-only render and server boundary; public privacy tests |

## 16. Stop conditions

Stop and report before continuing when:

- the branch or starting commit differs from `feat/qr-inventory-scanning` at base `bfafcf242e03a85ad450f220d423af8bad064f07` without an approved amendment;
- this amended specification has not been explicitly accepted;
- another writer is actively changing the same branch or shared files;
- implementing the command requires a Sheet schema change, new permission model, live deployment, or live external write not authorized here;
- current ledger, command-journal, lock, audit/history, or revision services cannot satisfy atomicity and replay requirements;
- direct-issue eligibility cannot reliably distinguish consumable/direct-issue items from loanable, reusable, reservation-bound, event, or workflow-controlled items;
- a selected decoder cannot be bundled locally, pinned, licensed appropriately, or tested without a real camera;
- the implementation cannot guarantee at most one ledger movement per intentional scan;
- an error occurs after a ledger append and reconciliation cannot prove the command result;
- a required check fails and the cause is not understood;
- a material scope change is needed without a logged amendment and renewed acceptance.

## 17. Open questions

None blocking review. This amended specification resolves the immediate-deduction request as follows:

- The feature is a dedicated, explicitly armed **Issue by QR** workflow, not passive scanning anywhere in the application.
- Quantity defaults visibly to one base unit and may be changed before arming.
- The first valid eligible scan immediately submits the issue without a second post-scan confirmation.
- One successful scan creates one immutable outbound ledger movement.
- The scanner disarms after every attempt; each new issue requires explicit re-arming.
- Loanable, reusable, reservation-backed, event, and other workflow-controlled items are not eligible for this shortcut.

Per-unit asset serialization, QR receiving, QR returns, QR lending, and QR request releases remain deferred.

## 18. Decision and amendment log

| ID | Date | Type | Decision/change | Approved by | Affected IDs |
|---|---|---|---|---|---|
| `DEC-001` | 2026-07-13 | Superseded decision | Initial draft limited scanning to read-only item identification | Superseded by user amendment | Former `REQ-003`–`REQ-006`, former `AC-002`–`AC-006` |
| `AMD-001` | 2026-07-13 | Material amendment | Add immediate inventory deduction and immutable ledger creation on a valid authorized QR scan | Requested by Earl; pending full spec acceptance | Sections 2–17; `REQ-005`–`REQ-009`; `AC-002`–`AC-007` |
| `DEC-002` | 2026-07-13 | Decision | Encode only a versioned type marker and stable item ID | Pending acceptance | `REQ-001`, `REQ-002`, `AC-001` |
| `DEC-003` | 2026-07-13 | Decision | Use a dedicated armed Issue by QR mode with visible quantity/context and no second confirmation after scan | Pending acceptance | `REQ-003`–`REQ-005`, `AC-002`, `AC-004`, `AC-007`, `AC-010` |
| `DEC-004` | 2026-07-13 | Decision | Preserve append-only ledger truth; never rewrite quantity directly | Pending acceptance | `REQ-006`, `AC-002`, `AC-003`, Section 14 |
| `DEC-005` | 2026-07-13 | Decision | Reject loanable, reusable, reservation-backed, event, and workflow-controlled items from immediate issue | Pending acceptance | `REQ-007`, `AC-005` |
| `DEC-006` | 2026-07-13 | Decision | Keep live Workspace writes, deployment, migration, merge, tag, and release outside this repository task | Pending acceptance | Section 9 |

A material amendment returns the spec to `IN_REVIEW` until renewed approval is recorded.

## 19. Completion evidence

Complete during verification.

| Acceptance criterion | Evidence | Result |
|---|---|---|
| `AC-001` | Pending | Pending |
| `AC-002` | Pending | Pending |
| `AC-003` | Pending | Pending |
| `AC-004` | Pending | Pending |
| `AC-005` | Pending | Pending |
| `AC-006` | Pending | Pending |
| `AC-007` | Pending | Pending |
| `AC-008` | Pending | Pending |
| `AC-009` | Pending | Pending |
| `AC-010` | Pending | Pending |
| `AC-011` | Pending | Pending |

## 20. Handoff

- Current branch: `feat/qr-inventory-scanning`.
- Starting commit: `bfafcf242e03a85ad450f220d423af8bad064f07`.
- Current status: amended specification is `IN_REVIEW`; implementation remains prohibited until explicit acceptance.
- Files changed so far: `specs/0002-qr-inventory-scanning/SPEC.md`.
- External actions performed: created the isolated feature branch, opened draft PR #5, and amended the specification in response to Earl’s requirement.
- External actions not performed: no implementation, generated artifact, Google Workspace, deployment, migration, merge, tag, release, or protected PR #2 change.
- Recommended next action: Earl reviews and explicitly accepts amended spec `0002`; implementation may then begin on the same isolated branch.
