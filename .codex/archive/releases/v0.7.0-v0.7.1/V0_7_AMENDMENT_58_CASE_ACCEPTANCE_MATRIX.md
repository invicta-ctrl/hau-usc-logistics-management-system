# v0.7.0 Follow-Up Amendment — 58-Case Acceptance Matrix

Decision: **58 / 58 PASS ON STAGING — PRODUCTION NO-GO**

Final accepted runtime:
`afe9204828cd51f66ffabf46d0b7a69017c77c65`

Evidence is cumulative across the three bounded amendment implementation
slices and the final Slice 4 run. Product/evidence commit `60a0138` passed the
complete repository gate, full browser matrix, four-case deployed suite, D1
reconciliation, and governed-source readback. The test-only stabilization
commits through `afe9204` then passed repeated 390px proof, the full browser
matrix, exact staging health/brand smoke, and the exact remote 6 / 6 CI gate.

| ID | Acceptance case | Evidence | Result |
| --- | --- | --- | --- |
| A01 | Governed inventory source is identified and read without inventing data | Live `01_ITEM_MASTER` readback; one active `ITM-0001` | PASS |
| A02 | Source/import/D1/API/client catalog path reports the real result | Slice 1 diagnosis; final live public catalog count `0` | PASS |
| A03 | Successful true-empty differs from a failed catalog request | `auth-gateway.spec.js` focused state test; live true-empty | PASS |
| A04 | Backend/network failure shows an error and retry, not an empty result | `auth-gateway.spec.js` focused state test | PASS |
| A05 | Trimmed case-insensitive name/Product ID/alias/category search and suggestions work | Lending browser regression and source review | PASS |
| A06 | Category, availability, and reusable/consumable filters update the live count without reload | Lending portal/browser regression and complete browser matrix | PASS |
| A07 | Borrower catalog excludes balances, storage, suppliers, provenance, and internal notes | `lending-catalog-service.test.js`; local Worker public DTO assertions | PASS |
| A08 | Public availability remains non-binding and does not reserve/approve | Local Worker submission and final D1 reconciliation | PASS |
| A09 | USC Staff/Officer classification requires the approved staff fields and department list | Local Worker and deployed public-lending scenarios | PASS |
| A10 | Angelite classification requires course/year and academic department | Browser, local Worker, and deployed public-lending scenarios | PASS |
| A11 | Switching borrower type clears and disables inactive fields | Focused 390px browser regression | PASS |
| A12 | Public Lending Ticket/private-code tracking is absent | Local Worker, 390px browser, deployed suite | PASS |
| A13 | Public submission starts `FOR_REVIEW` without stock movement | Local Worker inventory-before/after assertion and D1 reconciliation | PASS |
| A14 | Administrator may view Lending Usage | Local Worker authorization and `lending-usage-service.test.js` | PASS |
| A15 | Director may view Lending Usage | Local Worker authorization and `lending-usage-service.test.js` | PASS |
| A16 | Inventory-scoped authorized staff may view Lending Usage | Local Worker authorization and `lending-usage-service.test.js` | PASS |
| A17 | Other roles are denied Lending Usage | Local Worker HTTP 403 and unit authorization test | PASS |
| A18 | Consumable, reusable borrowed/outstanding/overdue metrics remain separated | `lending-usage-service.test.js` | PASS |
| A19 | Date/department/staff/item filters and safe CSV export work | `lending-usage-service.test.js` | PASS |
| A20 | Exact ten department/office identities and Access IDs are governed | Department registry unit and live D1 reconciliation | PASS |
| A21 | Department account initialization is atomic and replay-safe | Access service unit and local Worker lifecycle | PASS |
| A22 | Passwords are generated server-side, hashed, and never stored/returned as plaintext | Access unit/local Worker and live aggregate reconciliation | PASS |
| A23 | Initial department sign-in requires starter activation | Local Worker and deployed authentication flow | PASS |
| A24 | Department identity is derived from the server session and cannot be edited | Local Worker API, 390px browser, deployed request flow | PASS |
| A25 | Revocation immediately invalidates department access | Local Worker and live Slice 2 revocation proof | PASS |
| A26 | Restore preserves `STARTER` for an unactivated account | Unit, local Worker, and live Slice 2 proof | PASS |
| A27 | Reset emits one server-generated credential and revokes prior sessions | Unit, local Worker, and Administrator UI proof | PASS |
| A28 | Exact outside-Git credential handoff is owner-restricted and untracked | Live file/ACL/status reconciliation; no values printed | PASS |
| A29 | `/request` requires authenticated department access | Deployed route proof and final staging suite | PASS |
| A30 | Legacy public Request APIs fail closed with `SESSION_REQUIRED` | Local Worker boundary test | PASS |
| A31 | Step 3 exposes only governed Event and dependent Sub-event selectors | Request portal browser and server event validation | PASS |
| A32 | Long Event/Sub-event lists expose accessible autocomplete controls | Final 390px autocomplete regression | PASS |
| A33 | Exact venue, logistics, equipment, and unit registries are preserved | `request-center.test.js` | PASS |
| A34 | Governed custom request lines validate name, quantity, unit, and duplicate rules | Local Worker Request Center lifecycle | PASS |
| A35 | New request creation uses authenticated department/event/sub-event identity | Local Worker and deployed New request proof | PASS |
| A36 | Duplicate active New requests are blocked with a safe conflict | Local Worker `REQUEST_ALREADY_EXISTS` assertion | PASS |
| A37 | Additional parent search is department-scoped | Local Worker multi-requester scoping assertion | PASS |
| A38 | Additional creates a separate child, lines, history, and audit without overwriting parent | Local Worker and deployed D1 parent/child reconciliation | PASS |
| A39 | Authenticated Tracking requires no private code | 390px browser and deployed Request Center | PASS |
| A40 | Tracking by Request ID/event/sub-event is department-scoped | Local Worker isolation and deployed tracking proof | PASS |
| A41 | Requester results exclude other departments and internal/audit/procurement/storage data | Local Worker serialized-response assertions | PASS |
| A42 | Requester creation has no inventory-vs-purchase choice | Portal/browser review and final full matrix | PASS |
| A43 | Request availability language is explicitly non-binding | Portal browser and PDF receipt assertions | PASS |
| A44 | Header, lines, initial history, audit, idempotency, and revision commit atomically | Local Worker fresh-D1 lifecycle and live D1 counts | PASS |
| A45 | Duplicate clicks/retries replay the same committed request | Local Worker idempotent replay assertion | PASS |
| A46 | Every submitted request/line begins `FOR_REVIEW` | Local Worker and deployed request proof | PASS |
| A47 | Success renders only after the server-confirmed commit | 390px browser request interception and deployed flow | PASS |
| A48 | Success includes logo, Request ID, event/sub-event, department, time, status, and actions | 390px browser and deployed flow | PASS |
| A49 | Branded PDF contains the safe receipt contract and excludes secrets/internal fields | 390px download plus deployed `%PDF-1.4` content proof | PASS |
| A50 | Paired HAU-USC/DOL marks use balanced responsive containers and preserved aspect ratios | Live Slice 1 geometry proof; final brand suite | PASS |
| A51 | HAU-USC logo link uses approved URL, new tab, safe rel, label, and touch target | Live Slice 1 link proof | PASS |
| A52 | Approved Executive Staff poster is source-hash matched and uncropped | R2 round-trip SHA-256 and live `object-fit: contain` proof | PASS |
| A53 | Advertisement management is Administrator-only | Local Worker authorization and live Slice 1 proof | PASS |
| A54 | Media upload validates type/content/size/path and serves only authorized assets | Local Worker invalid/valid upload proof | PASS |
| A55 | Activation, ordering, scheduling, archive, idempotency, and audit are governed | Local Worker and live temporary-ad lifecycle | PASS |
| A56 | Multiple ads support five-second loop, previous/next, indicators, keyboard, and swipe | Live Slice 1 carousel acceptance | PASS |
| A57 | Carousel pauses on hover/focus/hidden state, honors reduced motion, lazy-loads, and hides single-ad controls | Live Slice 1 carousel acceptance | PASS |
| A58 | Mobile ordering keeps announcements after the borrowing workflow with no obstruction/overflow | 390px browser and live Slice 1 mobile proof | PASS |

## Final data truth and cleanup

- The governed Google workbook still contains one active item,
  `ITM-0001 / Detergent Bar`, marked `NOT_AVAILABLE_FOR_LENDING`.
- The governed `13_EVENTS` source contains only its header and no approved event
  rows. Production event values remain an owner-data gate.
- The live staging public lending catalog returns zero items.
- Acceptance Request records are archived with history/audit retained.
- Acceptance event and lending fixtures are inactive.
- Request acceptance created zero reservations and zero inventory-ledger rows.
- DOL is restored to `STARTER` with a refreshed owner-restricted handoff.
