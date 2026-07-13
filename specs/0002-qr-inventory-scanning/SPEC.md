---
spec_id: "0002"
title: "QR Inventory Scanning and Labels"
status: IN_REVIEW
owner: "Earl Adriano"
created: 2026-07-13
last_updated: 2026-07-13
accepted_by: null
accepted_at: null
supersedes: null
superseded_by: null
---

# 0002 — QR Inventory Scanning and Labels

## 1. Authority and source references

- Current user instruction: “Add QR-code inventory scanning to the HAU-USC Logistics Management System. Start editing the repository immediately.”
- Governing repository rules: `AGENTS.md`, `docs/SPEC_DRIVEN_DEVELOPMENT.md`, `docs/AI_COLLABORATION.md`, and `specs/README.md`.
- Project state: `PROJECT_STATUS.md` and `docs/WORK_CONTINUATION.md` from the V1 release-candidate line.
- Relevant architecture/domain/security documents: `docs/ARCHITECTURE.md`, `docs/DOMAIN_RULES.md`, `docs/SECURITY_AND_ACCESS.md`, `docs/TESTING_AND_ACCEPTANCE.md`, and `docs/LAUNCH_RUNBOOK.md`.
- Context Vault routing: `invicta-ctrl/gpt-context-vault`, beginning with `START_HERE.md`, `CONTEXT_INDEX.md`, and `projects/PROJECT_REGISTRY.md`.
- Starting repository state: `docs/adopt-spec-driven-development` at `bfafcf242e03a85ad450f220d423af8bad064f07`.
- Working branch: `feat/qr-inventory-scanning`.

## 2. Problem statement

Inventory staff currently locate items through text search and catalog navigation. During physical inventory work, storage checks, and item identification, typing an item name or ID is slower and more error-prone than scanning a label attached to the item or storage container.

The system also has strict ledger, authorization, privacy, and append-only rules. A scan must therefore identify an item safely without becoming an unreviewed shortcut that changes stock, bypasses permissions, exposes protected balances, or relies on untrusted QR payload data.

## 3. Intended outcome

Authorized internal staff can open a camera-based QR scanner from Inventory Management, scan a system-generated item label, and immediately locate and select the matching inventory item. Each inventory item can display a printable QR label whose payload contains only a versioned type marker and the stable item ID.

Scanning is identification only. It does not directly create a ledger movement, reserve stock, release an item, return a loan, receive stock, edit metadata, or perform another mutation. Existing authorized workflows remain the only way to change operational state.

## 4. Scope

### In scope

- Add an internal Inventory Management action to open and close a QR scanner.
- Decode QR codes through a client-side decoder bundled with the application; no external network call may be required at scan time.
- Add a manual code-entry fallback for devices without camera access, denied permissions, unsupported APIs, or automated testing.
- Define and validate one versioned inventory QR payload format:

  ```text
  HAU-USC|ITEM|<ITEM_ID>|V1
  ```

- Encode only the stable item ID and non-sensitive routing markers; item name, quantity, stock level, location, borrower data, user data, and live URLs must not be embedded.
- Resolve the decoded item ID against the current authorized inventory catalog.
- On a valid match, navigate to Inventory Management when necessary, select/highlight the item, and open its existing detail or ledger view.
- On malformed, unsupported, inactive, archived, `VERIFY`, or unknown items, show a clear safe result without changing inventory state.
- Add a per-item QR-label action and a print-friendly label view containing the item name, item ID, and generated QR image. The visible label may show the item name and ID; the encoded payload remains ID-only.
- Preserve deterministic single-file builds and standalone demo behavior with fictional inventory data.
- Add focused unit, browser, accessibility, responsive, and build verification.

### Systems and files likely affected

- A new domain/helper module for QR payload creation, parsing, and validation.
- `src/visual/runtime-extensions.js` or the current authoritative inventory runtime extension point.
- `src/styles/visual/runtime-extensions.css`.
- A bundled QR encoder/decoder dependency or small reviewed local implementation.
- Frontend tests under `tests/unit/` and `tests/e2e/`.
- `package.json` and `package-lock.json` if a dependency is added.
- Generated artifacts only through the existing deterministic build pipeline.
- `CHANGELOG.md`, `PROJECT_STATUS.md`, `docs/WORK_CONTINUATION.md`, and this specification during implementation and verification.

### User roles and workflows affected

- Authorized internal inventory/catalog users.
- Inventory Management item lookup and item-label preparation.
- No requester-only or public Lending Hub behavior.

## 5. Non-goals

- A scan must not directly receive, issue, lend, release, return, transfer, reserve, archive, restore, or adjust stock.
- No new inventory quantity field, mutable balance field, or ledger-bypass path.
- No Google Sheets schema change for the initial slice.
- No new Apps Script mutation API for the initial slice.
- No storage of QR image files in Google Drive.
- No borrower, requester, supplier, evidence, or personal data in QR payloads.
- No public/request-only scanner.
- No barcode formats other than QR in this specification.
- No serialized asset-instance tracking, per-unit QR identity, or replacement of the existing item-level catalog model.
- No deployment, migration, merge, tag, release, Apps Script push, Google Sheet mutation, or Google Drive mutation.
- Reusing the scanner inside Lending Hub, Release Desk, Restocking, Receiving, or Procurement is deferred to a separately accepted amendment or specification.

## 6. Assumptions and constraints

### Technical constraints

- The current authoritative UI is the extracted visual runtime; generated HTML files must not be hand-edited.
- The scanner must run within the existing Vite single-file build and Apps Script HTML Service packaging path.
- The decoder must be bundled locally and must not require a CDN or remote service at runtime.
- Camera access requires a secure browser context and explicit user permission; the feature must degrade to manual entry without blocking inventory lookup.
- Tests must not depend on a real camera. Decoder and media access must be injectable or mockable.
- The feature must preserve deterministic generated artifacts.

### Product/domain constraints

- Stable item IDs remain authoritative. A QR label is an alternate input method, not a new inventory identity.
- Item quantities remain ledger-derived.
- `VERIFY`, inactive, and archived items fail closed and cannot be treated as transaction-ready.
- A stale or unknown code must not silently select a similarly named item.

### Security/privacy constraints

- The scanner is internal-only and must follow the server-authorized portal boundary.
- QR payloads are untrusted browser input and must be strictly parsed with exact prefix, type, version, and item-ID validation.
- The encoded value must not contain protected balances, reservations, Drive identifiers, evidence links, users, contacts, student IDs, or other sensitive data.
- Scanning must not grant authorization or expose a protected item to an unauthorized portal.
- Camera frames must remain local to the browser and must not be uploaded, logged, or persisted.

### Time, environment, and tooling constraints

- Preserve the one-writer rule.
- Implementation starts only after this specification is explicitly accepted.
- Repository work is allowed only on the isolated feature branch.
- Live Google Workspace and deployment actions remain prohibited.

## 7. Requirements

### REQ-001 — Versioned inventory QR payload

The system shall generate and parse exactly one initial payload format, `HAU-USC|ITEM|<ITEM_ID>|V1`, where `<ITEM_ID>` is a valid stable inventory item ID. Parsing shall reject extra fields, unsupported versions, unsupported entity types, blank IDs, and malformed values.

### REQ-002 — Privacy-minimal QR labels

The encoded QR payload shall contain only the routing markers, version, and stable item ID. The print-visible label may include the item name and item ID but shall not display protected stock balances, reservations, personal data, supplier data, or private URLs.

### REQ-003 — Internal camera scanner

Inventory Management shall provide an internal-only scanner UI that requests camera access only after an explicit user action, displays permission/loading/scanning/success/error states, allows the user to stop the camera, and releases the media stream when closed, completed, hidden, or navigated away from.

### REQ-004 — Manual fallback

The scanner UI shall include a manual input that accepts the exact QR payload or a stable item ID. Manual input shall use the same parser, authorization boundary, and item-resolution behavior as camera decoding.

### REQ-005 — Safe item resolution

A valid scan shall resolve by exact item ID against the current authorized inventory data. A matched active item shall be selected and its existing detail or ledger view opened. Unknown, malformed, unsupported, `VERIFY`, inactive, or archived results shall show a safe message and shall not select another item or mutate state.

### REQ-006 — Identification-only behavior

Scanning and label generation shall be read-only. They shall not call an inventory mutation service, append ledger rows, alter reservations, advance data revision, upload files, or change item metadata.

### REQ-007 — Accessible and responsive interaction

The scanner, manual fallback, result state, and label view shall be keyboard accessible, screen-reader labeled, focus-managed, and usable without horizontal page overflow at the project’s required mobile and desktop widths.

### REQ-008 — Deterministic and testable implementation

The decoder boundary, payload parser, and inventory resolution shall be testable without a physical camera. Existing lint, unit, build, Apps Script packaging, artifact-verification, governance, and relevant Playwright checks shall remain green.

## 8. Acceptance criteria

### AC-001 — Generated payload is stable and privacy-minimal

Given an eligible inventory item with ID `ITM-0001`, when the QR label is generated, then the encoded value is exactly `HAU-USC|ITEM|ITM-0001|V1`, and no quantity, location, balance, reservation, user, borrower, supplier, evidence, Drive, or URL field is encoded.

Evidence expected:

- Unit tests for payload generation and parsing.
- Inspected generated label in demo mode.

### AC-002 — Valid camera scan locates the exact item

Given an authorized internal inventory user and a current active item, when the decoder returns that item’s valid QR payload, then the system selects that exact item, opens the existing item detail or ledger view, announces success, stops the active camera stream, and performs no mutation.

Evidence expected:

- Browser test with mocked media/decoder.
- Service spy or equivalent proving no mutation method was called.

### AC-003 — Manual fallback works without camera access

Given camera access is unavailable, unsupported, or denied, when the user enters a valid payload or exact item ID manually, then the same item-resolution behavior succeeds without requiring camera permission.

Evidence expected:

- Unit or browser test for unsupported/denied camera state and successful manual entry.

### AC-004 — Invalid and unsafe results fail closed

Given a malformed payload, unsupported version/entity type, unknown item ID, inactive item, archived item, or `VERIFY` item, when it is scanned or entered, then the UI shows a specific safe message, preserves the previous selection, performs no fuzzy substitution, and performs no mutation.

Evidence expected:

- Parser and resolution tests covering every rejected class.

### AC-005 — Public portals remain unchanged

Given request-only or public Lending Hub mode, when the application loads, then no inventory scanner or QR-label control is rendered, no protected inventory collection is exposed, and current public bootstrap/privacy tests continue to pass.

Evidence expected:

- Existing public-privacy tests plus a focused visibility assertion.

### AC-006 — Camera lifecycle is controlled

Given the scanner has an active media stream, when the modal closes, the scan succeeds, the user navigates away, the page becomes hidden, or an error occurs, then all active media tracks are stopped and no frame is uploaded, persisted, or logged.

Evidence expected:

- Browser/unit tests with mocked media tracks and stop-call assertions.

### AC-007 — Label and scanner remain accessible and responsive

Given keyboard-only and screen-reader use at 320, 390, 768, 1024, 1366, and 1440 pixel widths, when the scanner and label view are opened and closed, then focus is visible and restored, controls have accessible names, status updates are announced, and no page-level horizontal overflow is introduced.

Evidence expected:

- Focus/accessibility assertions and the relevant Playwright viewport matrix.

### AC-008 — Repository verification remains green

Given the implementation is complete, when required project checks run, then lint, unit tests, deterministic build, Apps Script package/static validation, standalone artifact verification, governance checks, and relevant Playwright tests pass with exact results recorded.

Evidence expected:

- `npm run check`.
- `npm run verify` when required by the branch workflow.
- Focused and full relevant Playwright results.
- CI status for the feature branch.

## 9. External-write permissions

- Repository writes allowed: yes, only on `feat/qr-inventory-scanning`, after spec acceptance for implementation files.
- Google Workspace writes allowed: no.
- Deployment, migration, merge, tag, release, or destructive actions allowed: no.
- Explicitly prohibited actions: Apps Script push, immutable version creation, deployment-pointer change, Script Property change, trigger change, Google Sheet mutation, Google Drive mutation, production action, PR merge, tag, release, protected PR #2 modification, and history rewrite.

## 10. Security, privacy, and data considerations

- Authorization boundary: internal inventory UI only; server-authorized portal mode remains authoritative.
- Sensitive data involved: none should be encoded. Camera frames are transient local input.
- Logging/redaction requirements: do not log frame data, decoded images, private bootstrap data, or full unexpected payloads. Safe diagnostics may record only a bounded reason code.
- Data integrity and concurrency requirements: scan is read-only and must not participate in ledger or revision mutations. Item lookup uses exact stable IDs from the current authorized catalog.
- Supply-chain requirement: any added client dependency must be pinned through the lockfile, bundled locally, reviewed for license/size/security suitability, and covered by the existing build and sensitive-content checks.

## 11. Implementation plan

1. Add a pure QR payload module with exact generation, parsing, normalization, and safe error codes (`REQ-001`, `REQ-002`).
2. Add a mockable local decoder/media boundary and scanner controller with explicit lifecycle cleanup (`REQ-003`, `REQ-004`, `REQ-008`).
3. Integrate scanner entry, exact item resolution, result states, existing item-detail navigation, and internal-only visibility into Inventory Management (`REQ-003` through `REQ-007`).
4. Add per-item print-friendly QR labels generated from stable IDs (`REQ-001`, `REQ-002`, `REQ-007`).
5. Add unit and browser tests, regenerate owned artifacts through the normal build, and update documentation/status/evidence (`REQ-008`).

## 12. Task checklist

- [ ] Spec explicitly accepted by Earl.
- [ ] Add and test payload generator/parser (`REQ-001`, `REQ-002`).
- [ ] Add and test camera/decoder lifecycle boundary (`REQ-003`, `REQ-006`, `REQ-008`).
- [ ] Add manual fallback (`REQ-004`).
- [ ] Add exact item-resolution and fail-closed states (`REQ-005`, `REQ-006`).
- [ ] Add internal-only scanner UI and label view (`REQ-002`, `REQ-003`, `REQ-007`).
- [ ] Add accessibility and viewport checks (`REQ-007`).
- [ ] Run required checks and record exact evidence (`REQ-008`).
- [ ] Update `CHANGELOG.md`, `PROJECT_STATUS.md`, `docs/WORK_CONTINUATION.md`, and this specification.

## 13. Verification plan

| Acceptance criterion | Verification method | Command or procedure | Required result |
|---|---|---|---|
| `AC-001` | Unit + inspection | Focused QR payload tests and demo label inspection | Exact V1 payload; no protected fields |
| `AC-002` | Browser + service spy | Mock decoder returns active item payload | Exact item selected; detail opened; camera stopped; zero mutation calls |
| `AC-003` | Browser/unit | Mock denied/unsupported camera and submit manual value | Manual lookup succeeds without camera |
| `AC-004` | Unit/browser | Table-driven invalid/unsafe payload and item states | Safe error; previous selection preserved; no mutation |
| `AC-005` | Browser/privacy | Load request-only and lending-only shareables | No scanner/control/protected data |
| `AC-006` | Unit/browser | Close/success/navigation/visibility/error lifecycle cases | Every active track receives `stop()` |
| `AC-007` | Browser/accessibility | Keyboard flow and required viewport matrix | Focus restored; named controls; no page overflow |
| `AC-008` | Repository/CI | Required project commands and branch CI | All required checks pass |

Required project checks:

```text
npm run check
npm run verify
```

Run the focused scanner browser tests and the full relevant Playwright matrix when Chromium is available. Record any intentionally inapplicable cases rather than weakening assertions.

## 14. Rollback, recovery, and reversibility

- The feature is additive and isolated on its branch.
- Reverting the feature commits removes scanner and label UI without affecting inventory records because the feature performs no operational writes.
- If a decoder dependency causes build, license, security, or compatibility problems, remove it and retain the pure payload parser/manual fallback until a replacement is separately reviewed.
- Generated artifacts are restored only by rebuilding from the reverted source; do not hand-edit them.
- No Sheet, Drive, Apps Script deployment, or operational data rollback is required.

## 15. Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Camera permission denied or unavailable | Scanner cannot start | Always provide manual fallback and clear permission guidance |
| Browser/device decoder incompatibility | Inconsistent mobile behavior | Bundle one reviewed decoder, mock its boundary, and test required mobile widths |
| Malicious or unrelated QR payload | Wrong item selection or unsafe behavior | Exact prefix/type/version/ID parsing and exact catalog lookup; no fuzzy fallback |
| Camera stream left active | Privacy and battery impact | Centralized cleanup on close, success, error, navigation, visibility change, and teardown |
| QR payload exposes operational data | Privacy leakage when labels are seen | Encode only stable item ID and non-sensitive routing/version markers |
| Scan becomes an accidental mutation shortcut | Ledger or authorization bypass | Keep scanner read-only; assert zero mutation calls; use existing workflows for all writes |
| Added dependency breaks deterministic single-file build | Release regression | Pin dependency, bundle locally, run deterministic build/artifact checks, and stop on mismatch |
| Feature appears in public portals | Protected catalog exposure | Internal-only render guard and existing requester/lending privacy tests |

## 16. Stop conditions

Stop and report before continuing when:

- the branch or starting commit differs from `feat/qr-inventory-scanning` at base `bfafcf242e03a85ad450f220d423af8bad064f07` without an approved amendment;
- this specification has not been explicitly accepted;
- another writer is actively changing the same branch or shared files;
- implementing the scanner requires a Sheet schema, new mutation API, Drive storage, deployment, or live external write;
- a selected decoder cannot be bundled locally, pinned, licensed appropriately, or tested without a real camera;
- inventory item IDs or current UI hooks differ materially from the assumptions in this spec;
- the implementation would allow a scan to mutate stock or bypass an existing permission/workflow;
- a required check fails and the cause is not understood;
- a material scope change is needed without a logged amendment and renewed acceptance.

## 17. Open questions

None blocking review. This specification deliberately limits the first slice to item-level identification and printable labels. Transactional scanning and per-unit asset serialization are deferred.

## 18. Decision and amendment log

| ID | Date | Type | Decision/change | Approved by | Affected IDs |
|---|---|---|---|---|---|
| `DEC-001` | 2026-07-13 | Decision | Begin with a read-only item-identification slice rather than direct stock mutation | Pending acceptance | `REQ-003`–`REQ-006`, `AC-002`–`AC-006` |
| `DEC-002` | 2026-07-13 | Decision | Encode only a versioned type marker and stable item ID | Pending acceptance | `REQ-001`, `REQ-002`, `AC-001` |
| `DEC-003` | 2026-07-13 | Decision | Keep public portals, Sheets schema, Apps Script mutations, Drive, and deployment outside scope | Pending acceptance | Section 5, Section 9 |

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

## 20. Handoff

- Current branch: `feat/qr-inventory-scanning`.
- Starting commit: `bfafcf242e03a85ad450f220d423af8bad064f07`.
- Current status: specification created and `IN_REVIEW`; implementation prohibited until explicit acceptance.
- Files changed so far: `specs/0002-qr-inventory-scanning/SPEC.md`.
- External actions performed: created the isolated feature branch and committed this specification.
- External actions not performed: no implementation, generated artifact, Google Workspace, deployment, migration, merge, tag, release, or protected PR #2 change.
- Recommended next action: Earl reviews and explicitly accepts this specification; then the implementation milestone may begin on the same isolated branch.
