---
schema_version: 1
status: active
scope: hau-usc-logistics-frontend-design
authority: canonical
branch: frontend-design-integration
visual_authority: prototypes/impeccable-whole-site-redesign-v5/
functional_authority: deployed-production-and-current-source
production_url: https://logistics.hausc.org/
playground_url: https://playground.hausc.org/
figma_file_key: hXJElH4p72KfgAaoUyfNOC
figma_url: https://www.figma.com/design/hXJElH4p72KfgAaoUyfNOC/
figma_make_key: rP9W9MQlZkyQrUx38TVsFS
progress_tracker: docs/design/DESIGN_EXECUTION_TRACKER.md
design_vault: D:/Documents/Codex/HAU-USC Logistics/design-vault
last_consolidated: 2026-08-13
---

# HAU-USC Design Authority

This is the single active textual design authority for HAU-USC Logistics. It consolidates binding owner direction, accepted frontend rules, product and route inventory, module design guidance, Figma registry, V-01 through V-42 annotations, research synthesis, asset provenance, and the shared local Design Vault index.

Status vocabulary is binding throughout this file:

- CURRENT: accepted or currently operative design guidance.
- OFFICIAL: verified institutional source or approved brand material.
- APPROVED: explicitly accepted for the named use.
- REFERENCE: useful evidence that does not override current authority.
- HISTORICAL: retained for provenance only.
- SUPERSEDED: replaced and not to be implemented.
- CONTRACT-GATED: requires a separate accepted product, security, privacy, provider, or data contract.
- FUTURE CONCEPT: directional only; not owned, deployed, or authorized.

This file does not replace AGENTS.md, .codex governance, accepted specifications, security policy, data invariants, release runbooks, or backend contracts. It does not authorize a deployment, Figma write, runtime refactor, database or provider change, or destructive cleanup.

## Table of contents

D00 Agent Quick Start · D01 Authority and Scope · D02 Canonical URLs and Links · D03 Canonical Local Paths · D04 Local Design Vault Manifest · D05 Figma Authority and Page Map · D06 Product / Route Inventory · D07 HAU-USC Brand Identity · D08 Color / Material System · D09 Typography · D10 Spacing / Radius / Layout

D11 Iconography / Semantic Status · D12 Light / Dark Theme · D13 Motion / Interaction · D14 3D / Spatial Design Rules · D15 Responsive / Mobile · D16 Content / Copy / Plain Language · D17 Accessibility / Reduced Motion · D18 Public USC-Wide Landing Vision · D19 Logistics Shell / Navigation · D20 Overview / Command Center

D21 Profile · D22 Inventory · D23 Request Center · D24 Lending Hub · D25 Release Desk · D26 Restocking / Procurement / Events · D27 Administration / Governance · D28 Public / Authentication · D29 Loading / Empty / Error / Stale States · D30 Brand Media / Web Assets

D31 Current USC Event Media Direction · D32 Owner Annotations V-01–V-42 · D33 Contract-Gated Design Concepts · D34 Research Synthesis · D35 Reference Patterns Adopted / Rejected · D36 Figma-to-Code / Implementation Constraints · D37 Current Design Status · D38 v0.8.5 Reconciliation Rules · D39 Future Department-Hub Architecture · D40 Design Change Log

## D00 — Agent Quick Start

DESIGN AUTHORITY: D:/Documents/Codex/HAU-USC Logistics/worktrees/spec-v073-frontend-design-integration/DESIGN.md

LOCAL DESIGN VAULT: D:/Documents/Codex/HAU-USC Logistics/design-vault

FIGMA: https://www.figma.com/design/hXJElH4p72KfgAaoUyfNOC/

GITHUB: https://github.com/invicta-ctrl/hau-usc-logistics-management-system and https://github.com/invicta-ctrl/hau-usc-logistics-management-system/blob/frontend-design-integration/DESIGN.md

PRODUCTION: https://logistics.hausc.org/

PLAYGROUND: https://playground.hausc.org/

FUTURE USC UMBRELLA CONCEPT: https://hausc.org/ — FUTURE CONCEPT, not verified as owned or deployed.

RETRIEVAL: read live governance, then use lean-ctx to retrieve D00 plus only the relevant Dxx sections. Resolve only the referenced asset. Do not load the whole vault or ask the owner to re-upload an indexed source. See D36.

## D01 — Authority and Scope

### Precedence

1. The owner's current explicit instruction.
2. The accepted frontend specification and approved amendments.
3. This DESIGN.md for durable design authority.
4. prototypes/impeccable-whole-site-redesign-v5/ for visual and frontend architecture.
5. Deployed production and current source for functional behavior.
6. V-01 through V-42 for owner-specific correction intent.
7. Proposed research as REFERENCE until accepted.
8. Historical captures and generated evidence as provenance only.

The accepted transfer direction is:

~~~text
production functionality -> v5 visual architecture
~~~

Preserve routes, forms, fields, state, validation, service calls, permissions, privacy, accessibility, audit/history behavior, and inventory/ledger invariants. Frontend authority does not permit backend, D1, R2, provider, authorization, data-shape, product-policy, deployment, or domain changes.

### Governing local sources

- AGENTS.md
- .codex/CURRENT.md
- .codex/CURRENT_TASK.md
- .codex/CURRENT_HANDOFF.md
- .codex/PHASE_AND_CONTEXT_POLICY.md
- .codex/specs/active/v0.7.3-frontend-design-integration.md

### Owner intent preserved

CURRENT owner intent includes the Institutional Logistics Ledger narrative, premium but restrained glass, a USC-wide landing vision, HAU-USC as primary public identity, Logistics as the current specialized hub, future department-hub extensibility, loyalty to official USC media, current-event grounding only from verified sources, meaningful optional 3D, purposeful motion, desktop and mobile priority, simpler copy, consistent theme and urgency icons, a corrected compact rail, whole-product module redesign, Profile redesign, Administration/Governance redesign, no stale Figma assumptions, and the owner's authority to make manual design edits.

An accepted manual Figma decision must be handed off and reconciled into DESIGN.md during an authorized repository-write task. Silent Figma/text drift is not allowed.

## D02 — Canonical URLs and Links

| Resource | URL | Status | Verified 2026-08-13 |
|---|---|---|---|
| Actual GitHub repository | https://github.com/invicta-ctrl/hau-usc-logistics-management-system | CURRENT | HTTP 200 |
| Current branch | https://github.com/invicta-ctrl/hau-usc-logistics-management-system/tree/frontend-design-integration | CURRENT | HTTP 200 |
| Current branch DESIGN.md | https://github.com/invicta-ctrl/hau-usc-logistics-management-system/blob/frontend-design-integration/DESIGN.md | CURRENT remote path; local content not synchronized | HTTP 200 |
| Future main DESIGN.md | https://github.com/invicta-ctrl/hau-usc-logistics-management-system/blob/main/DESIGN.md | FUTURE CONCEPT until merged | Not claimed current |
| Figma file | https://www.figma.com/design/hXJElH4p72KfgAaoUyfNOC/ | CURRENT workbench | HTTP 200 and metadata read |
| Production | https://logistics.hausc.org/ | CURRENT external runtime | HTTP 200 |
| Isolated Playground | https://playground.hausc.org/ | CURRENT external runtime | HTTP 200 |
| Future USC umbrella | https://hausc.org/ | FUTURE CONCEPT | Ownership/deployment not asserted |
| Official HAU USC profile | https://www.hau.edu.ph/organizations/356a192b7913b04c54574d18c28d46e6395428ab | OFFICIAL | Verified |
| USC Facebook | https://www.facebook.com/holyangeluniversitysc | OFFICIAL link listed by HAU | Verified via HAU profile |
| USC Instagram | https://www.instagram.com/usc_hau | OFFICIAL link listed by HAU | Verified via HAU profile |

HTTP reachability does not prove visual parity, runtime health, ownership, or authorization. Reverify external state at any future promotion gate.

## D03 — Canonical Local Paths

| Resource | Absolute Windows path | Repo-relative path | Status |
|---|---|---|---|
| Shared project parent | D:/Documents/Codex/HAU-USC Logistics | Not applicable | CURRENT stable parent |
| Canonical Design Vault | D:/Documents/Codex/HAU-USC Logistics/design-vault | Outside Git worktrees | CURRENT stable shared path |
| Current repository worktree | D:/Documents/Codex/HAU-USC Logistics/worktrees/spec-v073-frontend-design-integration | / | EPHEMERAL WORKTREE PATH |
| Canonical authority | D:/Documents/Codex/HAU-USC Logistics/worktrees/spec-v073-frontend-design-integration/DESIGN.md | DESIGN.md | CURRENT |
| Runtime brand route source | current worktree plus /src/visual/brand-assets.js | src/visual/brand-assets.js | CURRENT runtime |
| Runtime public asset directory | current worktree plus /public/assets | public/assets/ | CURRENT runtime |
| v5 visual authority | current worktree plus /prototypes/impeccable-whole-site-redesign-v5 | prototypes/impeccable-whole-site-redesign-v5/ | CURRENT visual authority |
| Runtime visual source | current worktree plus /src/visual | src/visual/ | CURRENT |
| Runtime style source | current worktree plus /src/styles/visual | src/styles/visual/ | CURRENT |
| Generated visual evidence | current worktree plus /output/design | output/design/ | REFERENCE; do not hand-edit |
| Figma capture source | D:/Documents/Codex/HAU-USC Logistics/design-vault/figma/exports/capture-source-2026-08-12 | Not applicable | REFERENCE |
| Figma prototype source | D:/Documents/Codex/HAU-USC Logistics/design-vault/figma/exports/institutional-ledger-prototype-2026-08-13 | Not applicable | REFERENCE |
| Current Figma screenshots | D:/Documents/Codex/HAU-USC Logistics/design-vault/figma/screenshots/current | Not applicable | REFERENCE captures |
| Owner instructions | D:/Documents/Codex/HAU-USC Logistics/design-vault/owner/source-instructions | Not applicable | CURRENT provenance |
| Owner annotations | D:/Documents/Codex/HAU-USC Logistics/design-vault/owner/annotations | Not applicable | CURRENT provenance |
| Research sources | D:/Documents/Codex/HAU-USC Logistics/design-vault/research | Not applicable | REFERENCE |
| Archived duplicates | D:/Documents/Codex/HAU-USC Logistics/design-vault/archive/duplicates | Not applicable | ARCHIVE |
| 3D sources/renders | No verified project-specific local source was found | Not applicable | NOT INDEXED; do not invent |

Do not hard-code the worktree path as permanent project authority. Future worktrees use repo-relative DESIGN.md and the stable sibling vault path.

## D04 — Local Design Vault Manifest

### Vault integrity summary

| Family | Purpose | Files | Bytes | Family root hash |
|---|---|---:|---:|---|
| owner/source-instructions | Canonical source prompts and owner packet | 2 | 82,913 | 45eda5b91213d1aae4d8efbab2f1951b494520a08ada0dde893221c293b503d1 |
| owner/annotations | Annotated PDF and V-01 through V-42 crops | 43 | 4,561,843 | 37397b29b962e4374924bddace560e9cd5be8455856a128a17f41dde3de36182 |
| research/pdf | Owner design PDF | 1 | 121,605 | f8f95e01a8598bd644bfaeb44e7186ff5f35f9ea373803cf72be7d45bbcbca5d |
| research/transcripts | Searchable PDF transcripts | 2 | 67,542 | 9b59a265950c0feb230cf18c2ca06f9a65c4fce2c7e4e6f3165cddabada56edb |
| research/external/design-dna-2026-08-10 | Research synthesis sources | 13 | 101,374 | 2db8a2576a8bc67d019a0bb8442f65a2a9bb1bffcf1bab81698394b2caa204fd |
| figma/exports/capture-source-2026-08-12 | Capture source artifacts | 24 | 49,393 | ac030f1d1420b43e4a0212b34c7e17762c57b8fde765e9c04bd9b133b4f4a421 |
| figma/exports/institutional-ledger-prototype-2026-08-13 | Prototype source artifacts | 12 | 290,635 | 79cd2150958e788871be05d2136572e280119edb15e2e582d89fa5c458eef6e3 |
| figma/screenshots/current/institutional-ledger-2026-08-13 | Institutional Ledger captures | 31 | 9,767,818 | 709aa0ff57f30e5d669b2452b8511b2dc3ce2eea2f0d3f1f870e408393f84f0a |
| figma/screenshots/current/usc-wide-overhaul-2026-08-13 | USC-wide captures after duplicate archival | 98 | 32,713,564 | 350c4d2ce52191205ec2e2f3c98558ce151f25c19606201c27b2f3b625637dd0 |
| archive/duplicates | Two byte-identical image aliases retained as recoverable archive | 2 | 566,361 | 331b7d5325fe120b0ad01809780b4b2e53b0ba545016d239063fc6cf35bd9421 |

Vault total: 228 files, 48,323,048 bytes.

Vault root hash: 41b3767ac39dda041eed23fa33cc0c511eec23ce973d16a2b776f03463cb5de8

The root and family hashes are SHA-256 over UTF-8 CRLF-joined, sorted records of forward-slash relative path, byte count, and file SHA-256. They are consolidation integrity markers, not Git tree hashes.

### Important asset registry

| Asset ID | Name / type | Purpose | Canonical local path | Repo path | Source URL | Source original path | SHA-256 or family hash | Status | Used by / notes |
|---|---|---|---|---|---|---|---|---|---|
| OWN-001 | Consolidation master prompt / Markdown | Governing source for this task | design-vault/owner/source-instructions/design-authority-consolidation-master-prompt-2026-08-13.md | None | None; local owner source | D:/Download/HAU_USC_Codex_Design_Authority_Consolidation_Design_Vault_Master_Prompt.md | 5422ba8a4965764cb838d8adac58ca43c94893c4489d701cf40a8f25eafdaef0 | CURRENT provenance | D00-D40 |
| OWN-002 | Playground Overhaul v1 owner packet / Markdown | Owner requirements and V-ID source | design-vault/owner/source-instructions/playground-overhaul-v1-owner-packet.md | None | None; local owner source | D:/Documents/Codex/Playground Overhaul v1/Playground Overhaul v1.md | dc745a3113806878215d4d3c855fc8f3a5281726ce5c50f31ea76a897d0f4009 | CURRENT provenance | D32 |
| PDF-001 | Playground Overhaul v1 design / PDF | Design source | design-vault/research/pdf/playground-overhaul-v1-design.pdf | None | None; local owner source | D:/Documents/Codex/Playground Overhaul v1/Playground Overhaul v1 - Design.pdf | d6c7aa5b63911895e23f571af8c88112c479b286e8f4d9bf7b9c87dc02d66c09 | REFERENCE | 18 pages; D04 |
| PDF-002 | Playground design and annotations / PDF | Owner visual provenance | design-vault/owner/annotations/playground-overhaul-v1-design-and-annotations.pdf | None | None; local owner source | D:/Documents/Codex/Playground Overhaul v1/Playground Overhaul v1 - Design and Annotation.pdf | 824f4a6fd0168134eeece0072b91a6e9f51d4e40e02d5278905285d6af152622 | CURRENT provenance | 69 pages; D32 |
| ANN-001 | V-01 through V-42 / PNG family | Bounded annotation lookup | design-vault/owner/annotations/v01-v42/ | None | https://www.figma.com/design/hXJElH4p72KfgAaoUyfNOC/ | D:/Documents/Codex/.tmp/figma-design-institutional-ledger-2026-08-13/vids | 37397b29b962e4374924bddace560e9cd5be8455856a128a17f41dde3de36182 family | CURRENT provenance | Open only when D32 is disputed |
| RES-001 | Design-DNA packet / Markdown family | Distilled interaction/visual research | design-vault/research/external/design-dna-2026-08-10/ | None | Source URLs retained inside research files | design-dna-staging-2026-08-10 worktree docs/design | 2db8a2576a8bc67d019a0bb8442f65a2a9bb1bffcf1bab81698394b2caa204fd | REFERENCE | D34-D35 |
| FIG-001 | Figma capture source / mixed source family | Capture provenance | design-vault/figma/exports/capture-source-2026-08-12/ | None | https://www.figma.com/design/hXJElH4p72KfgAaoUyfNOC/ | D:/Documents/Codex/.tmp/figma-capture-2026-08-12 | ac030f1d1420b43e4a0212b34c7e17762c57b8fde765e9c04bd9b133b4f4a421 | REFERENCE | D05 |
| FIG-002 | Institutional Ledger prototype / HTML-CSS-JS family | Prototype source | design-vault/figma/exports/institutional-ledger-prototype-2026-08-13/ | None | https://www.figma.com/design/hXJElH4p72KfgAaoUyfNOC/ | D:/Documents/Codex/.tmp/figma-design-institutional-ledger-2026-08-13/proto | 79cd2150958e788871be05d2136572e280119edb15e2e582d89fa5c458eef6e3 | REFERENCE | D05, D34 |
| FIG-003 | Institutional Ledger screenshots / PNG family | Visual evidence | design-vault/figma/screenshots/current/institutional-ledger-2026-08-13/ | None | https://www.figma.com/design/hXJElH4p72KfgAaoUyfNOC/ | D:/Documents/Codex/.tmp/figma-design-institutional-ledger-2026-08-13 screenshots | 709aa0ff57f30e5d669b2452b8511b2dc3ce2eea2f0d3f1f870e408393f84f0a | REFERENCE capture | D05, D34 |
| FIG-004 | USC-wide overhaul screenshots / PNG family | Visual evidence | design-vault/figma/screenshots/current/usc-wide-overhaul-2026-08-13/ | None | https://www.figma.com/design/hXJElH4p72KfgAaoUyfNOC/ | D:/Documents/Codex/.tmp/hau-usc-figma-overhaul-2026-08-13 | 350c4d2ce52191205ec2e2f3c98558ce151f25c19606201c27b2f3b625637dd0 | REFERENCE capture | D05, D18-D32 |
| ARC-001 | Duplicate image aliases / PNG family | Recoverable archive | design-vault/archive/duplicates/ | None | https://www.figma.com/design/hXJElH4p72KfgAaoUyfNOC/ | Same named temp capture files | 331b7d5325fe120b0ad01809780b4b2e53b0ba545016d239063fc6cf35bd9421 | ARCHIVE | Two duplicate groups; not active |

Copy-first verification preserved every unique source. Six redundant zero-byte capture files were removed from the new vault; each remains recoverable from its original temporary source. Two byte-identical image aliases were moved into archive/duplicates, retaining their more descriptive current counterparts. The duplicate audit identified three groups and eight extra copies; active families now contain one copy per hash.

### PDF integrity

| Artifact | Pages | Encrypted | AcroForm | JavaScript | Replacement glyphs |
|---|---:|---|---|---|---:|
| PDF-001 | 18 | No | No | No | 0 |
| PDF-002 | 69 | No | No | No | 0 |

The copied PDFs are byte-identical to the previously rendered and visually inspected owner packet. The 42 V-ID crops are sequential with no missing identifier.

### File-level manifest

Every vault file is recorded below by relative path, bytes, and SHA-256. This index lives here so there is no competing active manifest document.

| Relative path | Bytes | SHA-256 |
|---|---:|---|
| archive/duplicates/p10-icons-lending.png | 282526 | 904c2922b6de5f8f62c4c61581bf586c4abb62a2705ffbb4f8d6ad3b6d2298f6 |
| archive/duplicates/p10-icons-release.png | 283835 | 8f6483fd67a77ee4e7d3ce89d36204d88d1fe45beb24d060e5bf6d5b086dfd2c |
| figma/exports/capture-source-2026-08-12/capture.mjs | 2910 | 3c2e86d40c682c0d36397dd72cd7bdd2d1543468ee2d07ab16569fd4efccd2c0 |
| figma/exports/capture-source-2026-08-12/click-probe.mjs | 2587 | a904e90c5d80c67bcc91b39c9be92e5325501c6ce0a57c7869e789d6a2cf751d |
| figma/exports/capture-source-2026-08-12/explore.mjs | 1830 | 074520d3d89057901ee07e5cf8609a01c762be95156b8cf40700b6226e3b9283 |
| figma/exports/capture-source-2026-08-12/jobs-mobile.json | 1587 | 89e01ed5f93c3fee30b3eb0e89f43dd6e90bdee7d8ca421ada25494ad5c739fd |
| figma/exports/capture-source-2026-08-12/jobs-mobile.json.progress | 4635 | 5916b73886f6e63a89c929b5dac1fc2ee696152742ecdd96f85efdb64360e049 |
| figma/exports/capture-source-2026-08-12/jobs-play-desktop.json | 1123 | 498a7fe2f8cd112e1ec251bc2858f3357801e3a97c939559d258d4c7c78604b8 |
| figma/exports/capture-source-2026-08-12/jobs-prod-desktop.json | 1547 | 8eb921e9d904d89c772dbc80170a2fc82b71e1b7ed7deecc4fdda3a3d7e0ebe5 |
| figma/exports/capture-source-2026-08-12/jobs-remaining-desktop.json | 1763 | 357e4ce15ec75396f6fc00f0030e7a11e110e2f8256857de278f450d5526e87e |
| figma/exports/capture-source-2026-08-12/jobs-remaining-desktop.json.progress | 4725 | a1167c2d8c1bf5363c650e3088f5665835a880c0df5240e065d5aa0e5db126ea |
| figma/exports/capture-source-2026-08-12/jobs-test1.json | 353 | ced645d730a82b871d6f560ae7d2f640858f75145d5a20a70635284bc86c2ffb |
| figma/exports/capture-source-2026-08-12/jobs-test1.json.progress | 872 | 1fb7167e8be6a06de6befb21c31ac7ae8e842435c9b3cb4ea56b6711e4f9c3c1 |
| figma/exports/capture-source-2026-08-12/jobs-test2.json | 316 | 486ad4ac0ed843ec58c02267ff4b45766a63179a11bdbcff9b6604cce1a58bcc |
| figma/exports/capture-source-2026-08-12/jobs-test2.json.progress | 844 | 10c3e044eb9e7263214ec857f81d15f9178521432baa65a9f234e8ff6cfa276d |
| figma/exports/capture-source-2026-08-12/measure-responsive.mjs | 2779 | 9b2bc469af441dd96211bc64b9eef40db32f8caaba04535e959598dff56bd6cd |
| figma/exports/capture-source-2026-08-12/mobile.err | 0 | e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855 |
| figma/exports/capture-source-2026-08-12/mobile.out | 2836 | 9b8d76dc7559eba50eba4df699b8b0426f06641cdd8d6cdca762ffb3093acbb8 |
| figma/exports/capture-source-2026-08-12/remaining.out | 2912 | f3016d899e91a1238ef07421bf3ff2f26dddb024198605213359c37089e2f522 |
| figma/exports/capture-source-2026-08-12/responsive.json | 4252 | 6f4c5db7240fdde71b6ce02ab1e4926dfd68fc96010eff0d7aea092cf0fe7dd1 |
| figma/exports/capture-source-2026-08-12/run-batch.mjs | 5167 | 14369124bb32ce02d11c8c8e47f9b5082e0aefc33e01e0f8a32bdaeef93abd30 |
| figma/exports/capture-source-2026-08-12/test1.out | 464 | baa1421ec590537c966164a41e621ecf257f4773b0f2fde47003c96db5287c71 |
| figma/exports/capture-source-2026-08-12/test2.out | 455 | 104b25c4e6fa937a872a241909c32038923c06228d44e0e7a1b41a6d9067a4ea |
| figma/exports/capture-source-2026-08-12/verify-no-writes.mjs | 1806 | e50e1eab235efed311343d00debce26ce3b4bf85add1b7b48f46e44c9d4884c3 |
| figma/exports/capture-source-2026-08-12/views.mjs | 2410 | 5084b7a68cec95a148376006c1de1ef9424ccd2f9429b83e77e6f67ebf4080a8 |
| figma/exports/capture-source-2026-08-12/views-spec.json | 1220 | 00955b077544ab48db24662a2705c1caeeeb64dfd03f49c04bc0b9b854fd70d3 |
| figma/exports/institutional-ledger-prototype-2026-08-13/app.js | 122163 | a30df10e0b0117b9f35c9282f79db7da891dcd935c0b7e6e4cebdfced5e2afe0 |
| figma/exports/institutional-ledger-prototype-2026-08-13/icons.js | 6065 | b2082f01d68555836b33243bdc428bb903739acac3ee2f455add1707af0f340b |
| figma/exports/institutional-ledger-prototype-2026-08-13/index.html | 1607 | 17a7cbc2a57cfda0f8a64a27a9bdceb6de182beaced5f08422017ed63d266891 |
| figma/exports/institutional-ledger-prototype-2026-08-13/overhaul.css | 16684 | 307ed9e37edc1cf6e855869b7cba64171115a63ab7801e6a5ac08a018de625ee |
| figma/exports/institutional-ledger-prototype-2026-08-13/route-map.js | 4542 | abfa68e24abf8e1219c92ea300de35eaf35d734a1679b7fbb1cab0a07b2043f9 |
| figma/exports/institutional-ledger-prototype-2026-08-13/sheet.html | 6861 | 2b41b9ce5e88a854038449c3a6bded916f3c7db2b6c12c2c944e20da6f055b6f |
| figma/exports/institutional-ledger-prototype-2026-08-13/sheets.css | 2988 | 32a4ac21cc99a1d16b192998d82810e2bdcac50dc61e592441a80c26b16e4209 |
| figma/exports/institutional-ledger-prototype-2026-08-13/sheets.js | 42785 | f5b8516e0fe3602892e07e2fa68211e4a68330703e2decd1ad36900b74aad75d |
| figma/exports/institutional-ledger-prototype-2026-08-13/system.css | 27598 | f8bcacab8e9c3cfa8de0fa02c5c60cfc697be88f2ae5414bafb916e4163338cf |
| figma/exports/institutional-ledger-prototype-2026-08-13/tokens.css | 6463 | 1721e88b8131bb1d615d70468573c60122f0951da16275224fb6f641de3ac243 |
| figma/exports/institutional-ledger-prototype-2026-08-13/usc.css | 28418 | dfa05b8517c5297d368e0faf2639fb682a6bffd35616aaf325ef4c2ae3b28006 |
| figma/exports/institutional-ledger-prototype-2026-08-13/usc.js | 24461 | f59e0e30eb59460db707b432faae5d82ee6726769f6ae5035386fa0f138be1ae |
| figma/screenshots/current/institutional-ledger-2026-08-13/qa-components.png | 38710 | 35a81f461463d02753e8a4e897e332a478a206a1ff5abbd1a2b8f1f336e93133 |
| figma/screenshots/current/institutional-ledger-2026-08-13/qa-components2.png | 46342 | bd31890bebbda59e4386f120d7974afb7a7c7d3b12da935551c14f98d40c50f0 |
| figma/screenshots/current/institutional-ledger-2026-08-13/qa-components2-crop.png | 220168 | 292a47c2b4db9db78bb025e725f88c81084aebde375661fdee9e442e88f978da |
| figma/screenshots/current/institutional-ledger-2026-08-13/qa-figma-request.png | 462719 | 616fffb746583697249546a2f71748a85081f3715cd72ca31de071a5cf695c6a |
| figma/screenshots/current/institutional-ledger-2026-08-13/qa-landing.png | 477518 | b0ef15db33e402612a9028a55c6454bb09fd9fd8fbd8035cc51f7f6b4d1554e3 |
| figma/screenshots/current/institutional-ledger-2026-08-13/qa-landing2.png | 186690 | bf87f49105a0611720e6372957a60b64c098ee19853648a170b62ec64d1599f1 |
| figma/screenshots/current/institutional-ledger-2026-08-13/qa-lending-new.png | 305061 | 3a180b0c7fde181a448df44389c1cfa81485c5beaffe521bb3e11025fd37c455 |
| figma/screenshots/current/institutional-ledger-2026-08-13/qa-p98-b1.png | 237408 | f86686e76bee1bc8a5fa2b006d4d99296b9d2f0f2018d68e6bccd27e464a6c83 |
| figma/screenshots/current/institutional-ledger-2026-08-13/qa-recovery.png | 132962 | aa21656d11de9e5c2fec9f2c543f9aa63a115ebaae5360187140e159677977ba |
| figma/screenshots/current/institutional-ledger-2026-08-13/qa-release-task.png | 439063 | 780bc0ff954fe7b2ef8dbdabb9d6c3b9014992b735a62029ab43ddc50d234333 |
| figma/screenshots/current/institutional-ledger-2026-08-13/qa-request.png | 337483 | f05ce26829d54bb672d9222b60d22feb4b2b23dd3c19385f0b82203d06b4e0b8 |
| figma/screenshots/current/institutional-ledger-2026-08-13/shot-landing.png | 460973 | e6ca1495b8f845726896ae0f03ceba3e7177018de7f164252deabc4980f35948 |
| figma/screenshots/current/institutional-ledger-2026-08-13/shot-landing2.png | 461750 | 0b63ed71312191d08a4a33943c2e5a4069f4d3dadd622c8406cb497c0f11429c |
| figma/screenshots/current/institutional-ledger-2026-08-13/shot-mobile.png | 164782 | 995b53c11557f7a6ae437cbe444bc48b329641b8d6874bf1623fb6ceb30fea5f |
| figma/screenshots/current/institutional-ledger-2026-08-13/shot-overview.png | 317510 | 11e75b3d404bbdca1824d530a055a62e1bc883a3a9859affca26c574317bd2e0 |
| figma/screenshots/current/institutional-ledger-2026-08-13/shot-release.png | 221365 | bc558757a711d69bc1fd0e012077278e5fba905cde8e183ceb242e5677ff1bde |
| figma/screenshots/current/institutional-ledger-2026-08-13/v3-hero-crop.png | 142730 | db400aa9d34ac913061b43c572cbbdf0f17a1c30bf3149e0e1c91413453414ab |
| figma/screenshots/current/institutional-ledger-2026-08-13/v3-l-1440.png | 552383 | f700863841654e2859754e906717ea8b78df4961ed341800152a57929949a5d1 |
| figma/screenshots/current/institutional-ledger-2026-08-13/v3-l-1440-crop.png | 133513 | 6aee0fc3085ba78297d28b28f9abc66e5e41a1c4412b3c56fc564a3c8eaa382f |
| figma/screenshots/current/institutional-ledger-2026-08-13/v3-l-1440d.png | 553777 | b7807f30c0d1ea033064b04d4ead81f1578eaf5333aab1d2b05250dfd0a359bf |
| figma/screenshots/current/institutional-ledger-2026-08-13/v3-l-320.png | 480110 | e982c524a58f6da41b0d771db9134fdbc8c2e386cf6c8080ae902694a27d4c5c |
| figma/screenshots/current/institutional-ledger-2026-08-13/v3-l-390.png | 486160 | 4595a53cc0b013a3a899c1a83ea4145e22846b40f8c162f97c1325da75dd4bc5 |
| figma/screenshots/current/institutional-ledger-2026-08-13/v3-l-390-crop.png | 105894 | 6cc2bd0c6221fc4cee9890f8b58e8e41d506c768587bdf0e9e02fee52b4d01cd |
| figma/screenshots/current/institutional-ledger-2026-08-13/v3-l-768.png | 536558 | 2661fc9c1c3e99a5a71479055e07ce8330e9e884b65a81db7925c56c51a89ef6 |
| figma/screenshots/current/institutional-ledger-2026-08-13/v3-landing-1440.png | 515078 | b7bf16a35e9f54e3b338f615f287926e90e8a23f8f7648a9363bd9c59549cd3d |
| figma/screenshots/current/institutional-ledger-2026-08-13/v3-landing-390.png | 467068 | ddd619218013a2d2ef7bf7d51efadca7d21af653453180eaa389bbff336c52a7 |
| figma/screenshots/current/institutional-ledger-2026-08-13/v3-mid-crop.png | 112743 | 9a6060e25ce332560570d19f26879d42a26fb34fc7e640e737c86ce05aad6425 |
| figma/screenshots/current/institutional-ledger-2026-08-13/v3-overview.png | 333327 | 191f0c40b1d15f6b327ba8375237451327d0d130d63341f4bc7693c56cf5b932 |
| figma/screenshots/current/institutional-ledger-2026-08-13/v3-ov-mobile.png | 181363 | ba1676efd3d21947fc8e11f0ee4d9575dee40a8265127a4011b19e0686f8b4d6 |
| figma/screenshots/current/institutional-ledger-2026-08-13/v3-profile.png | 371560 | 6d1b920a147654e2a1469ac48337be71f3a86a7e958757aca63da969f93f5f51 |
| figma/screenshots/current/institutional-ledger-2026-08-13/v3-request.png | 285050 | 06b2819a0aef96dfc6777e5634e3fdbfc1a03bec07eb3cd7676d8f34bf6d3c73 |
| figma/screenshots/current/usc-wide-overhaul-2026-08-13/p0-source-ledger.png | 74330 | 80adba34483fad0fe1b6ac48d55ed4c038b9f7fc853970dce6dbff9c21937292 |
| figma/screenshots/current/usc-wide-overhaul-2026-08-13/p10-icons-states.png | 114461 | 33322e74bed94b30308657907b0423b054a3a6ae5f46a2df8318baa68b1de7da |
| figma/screenshots/current/usc-wide-overhaul-2026-08-13/p10-lending-final-cleanup.png | 282526 | 904c2922b6de5f8f62c4c61581bf586c4abb62a2705ffbb4f8d6ad3b6d2298f6 |
| figma/screenshots/current/usc-wide-overhaul-2026-08-13/p10-live-progress-98.png | 45165 | 0369ea94f3a0ef38f4bb697f8f727b1d66d56d8a191de29d975ce873a3c82b42 |
| figma/screenshots/current/usc-wide-overhaul-2026-08-13/p10-live-progress-final.png | 42175 | 263fddbbe2650551facca0af162f7f6c529e47659ac7b51231bad27f1ffaaa17 |
| figma/screenshots/current/usc-wide-overhaul-2026-08-13/p10-masthead-dark-1440.png | 26035 | 72a36106b8bf934056dd9d7392b606f429f413f881588c26f51f97666172f925 |
| figma/screenshots/current/usc-wide-overhaul-2026-08-13/p10-masthead-dark-1920.png | 56282 | f2af119f86610e29d917cb73ad8ac8e27347eff7eef4c1ffe092669a1da57fcd |
| figma/screenshots/current/usc-wide-overhaul-2026-08-13/p10-masthead-light-1440.png | 36123 | 88d395ac3cf6bccd278bcf3aa4caad11e645f21dc4611f8de9c2f51f4ed51d50 |
| figma/screenshots/current/usc-wide-overhaul-2026-08-13/p10-masthead-p2-1440.png | 52771 | 894634cd152e0d75b5b69c4cc11755c30266a253c95ff3d3878087984c214827 |
| figma/screenshots/current/usc-wide-overhaul-2026-08-13/p10-p2-final-cleanup.png | 561034 | f7a5e8e6feffbecd049289e9a81d4cee5117c75fd2e5f5e6cb99eb5c2c6980a5 |
| figma/screenshots/current/usc-wide-overhaul-2026-08-13/p10-p3-final-cleanup.png | 470172 | b67deac3a8487390062636e30d29b7ad3b7c5653efb3c14191a9fe0836a4897b |
| figma/screenshots/current/usc-wide-overhaul-2026-08-13/p10-page90-final-cleanup.png | 233866 | f760cdb6287262774628b755a9420ee4e9682f98f86029c8b3667506347d901b |
| figma/screenshots/current/usc-wide-overhaul-2026-08-13/p10-page98-final.png | 64703 | 1eed88fe4e881bbac0b592a6fa39f41c83ee4dbb4e1d38efa41326980865077a |
| figma/screenshots/current/usc-wide-overhaul-2026-08-13/p10-page99-final.png | 142342 | b7f6e87cacfe4adec039c8f76b49f2d6a057754638660bd5bdbd89bc75dc65f5 |
| figma/screenshots/current/usc-wide-overhaul-2026-08-13/p10-release-final-cleanup.png | 283835 | 8f6483fd67a77ee4e7d3ce89d36204d88d1fe45beb24d060e5bf6d5b086dfd2c |
| figma/screenshots/current/usc-wide-overhaul-2026-08-13/p10-research-matrix-69.png | 413579 | 0c38ebde5b934f4be14a76b16a09e0e136c403c3787b94d63b50432a427c82ab |
| figma/screenshots/current/usc-wide-overhaul-2026-08-13/p10-supply-final-cleanup.png | 371582 | e5f2c11e75deb2aa72f941ec0a0a610e356cd4bf9f401d3db1c16b9f9f6c21fa |
| figma/screenshots/current/usc-wide-overhaul-2026-08-13/p1-critique-disposition.png | 38452 | d5e9354f74324cded3bd91d90cefc8cbd8ba4483ce99de9134369213c413cb17 |
| figma/screenshots/current/usc-wide-overhaul-2026-08-13/p1-desktop-critique-fixed.png | 941343 | 8d2263a0de4dcf5b937219d02183d58d04a2c1f02cc0a63430f831ac82d522ca |
| figma/screenshots/current/usc-wide-overhaul-2026-08-13/p1-desktop-topology-path-fixed.png | 441331 | b1af1be18f985f5d3cdb0dda5db24e26a7be29448d2ed767f4eb1eef7247f27c |
| figma/screenshots/current/usc-wide-overhaul-2026-08-13/p1-desktop-topology-svg.png | 430744 | 23c03a60178fb8c56a1ecfd077f17d12775f5363e29c82389207f984d9557858 |
| figma/screenshots/current/usc-wide-overhaul-2026-08-13/p1-desktop-wip.png | 1076425 | 3a94bcbe644a385fc2c2da7eb6a1a5049349de89e1c7792e781e58293d43a368 |
| figma/screenshots/current/usc-wide-overhaul-2026-08-13/p1-material-critique-fixed.png | 347745 | 5c47eddcedd9d21864693e066d1422213e5567164d38de1b9fc91db90138e61f |
| figma/screenshots/current/usc-wide-overhaul-2026-08-13/p1-material-wip.png | 382227 | 25903027055a4a2fd7ebd19434e8b3ad0c4ae536179754db0ea59c7b73806785 |
| figma/screenshots/current/usc-wide-overhaul-2026-08-13/p1-mobile-critique-fixed.png | 312144 | 724c1c5e01c8243abf9fe235b294366f25f992020d2614d404edcf3e0fef76af |
| figma/screenshots/current/usc-wide-overhaul-2026-08-13/p1-mobile-topology-path-fixed.png | 158104 | 9bc10261001b77c3681e7a89da1d19eba96be201df6d25eb1fe168325e544bde |
| figma/screenshots/current/usc-wide-overhaul-2026-08-13/p1-mobile-topology-svg.png | 152220 | 65a339a2c607e51a37a89a784d0578d31cd2d1f2bed61659a7200446fae46549 |
| figma/screenshots/current/usc-wide-overhaul-2026-08-13/p1-mobile-wip.png | 421094 | debbdde57be7409c5d5aff579a25ed142c4205e027b419a1ba1d896a39661b77 |
| figma/screenshots/current/usc-wide-overhaul-2026-08-13/p1-reference-log.png | 39288 | 757d59bb311acd53188764d9b6b96d08920f811e9fbc5b9a4f79bfba46d5780c |
| figma/screenshots/current/usc-wide-overhaul-2026-08-13/p2-1024.png | 629278 | f2c451d1fc994441ea8e356723eec6ff1bdf39cb737b34db9ecb7b8f9ebd1c70 |
| figma/screenshots/current/usc-wide-overhaul-2026-08-13/p2-1024-final.png | 636722 | 228ed9b06bc0f6bb99a0388a8d2eabee777f9de1cd22c8ba849a5ee00132ced7 |
| figma/screenshots/current/usc-wide-overhaul-2026-08-13/p2-1024-fixed.png | 633382 | 063da281b628ef290538dcaf19910a719078af25dc1440a964e28919d7c15851 |
| figma/screenshots/current/usc-wide-overhaul-2026-08-13/p2-1440.png | 932906 | a961a5206513529cb284952adbdc106ae777bd41cf1cc2a0b91031c471885716 |
| figma/screenshots/current/usc-wide-overhaul-2026-08-13/p2-1920.png | 1144583 | c2878a3b6c05bc53c7d8bcd23bda5b3a547ad9e6059ef643b4757bd60136ad4e |
| figma/screenshots/current/usc-wide-overhaul-2026-08-13/p2-1920-final.png | 1048130 | b29f3486c6646bdd0074ad06ff2e7bc20e9883ebeee2f3df6fa831c784747762 |
| figma/screenshots/current/usc-wide-overhaul-2026-08-13/p2-contract.png | 39046 | 4c8062d3af06048e598aa74681ff95fce2d64d8d05ac092608df5aa615f5bb49 |
| figma/screenshots/current/usc-wide-overhaul-2026-08-13/p3-320.png | 278824 | 8d1b831536bb826db1cbd0c12abbf095974dd41cf100013291a7ffc86582c10f |
| figma/screenshots/current/usc-wide-overhaul-2026-08-13/p3-320-200pct-proof.png | 169034 | e3e5a758b6716e8a6f1734f6df3ad016ab9f990862b428cabb2ace500ad14570 |
| figma/screenshots/current/usc-wide-overhaul-2026-08-13/p3-320-final.png | 140584 | 2f419d432ec437789c7d14e707e7aacc50dfd4596d579637f51abca92bc469a4 |
| figma/screenshots/current/usc-wide-overhaul-2026-08-13/p3-375.png | 296864 | 1a8e15a59e75ab5e046c3b17168be74d27e2ea17878f8222e01ac3988e75a0b7 |
| figma/screenshots/current/usc-wide-overhaul-2026-08-13/p3-390.png | 304764 | 12fe6fb4aff553d1c522079b199491a5f6daf79d53ac66b844976f63a2f75819 |
| figma/screenshots/current/usc-wide-overhaul-2026-08-13/p3-414.png | 318042 | 6d504a4fa5f1f8bef70e2a306c237c19a849101f63af4ca210308332224436bf |
| figma/screenshots/current/usc-wide-overhaul-2026-08-13/p3-414-final.png | 137569 | d51f695aec7b7b069ad15f72de12417963e27543ed84edfacd4f41f7654230e7 |
| figma/screenshots/current/usc-wide-overhaul-2026-08-13/p3-768.png | 545535 | 0d68504e112a40978f16d121a55c009925161f2444136355cefe34072d2a8808 |
| figma/screenshots/current/usc-wide-overhaul-2026-08-13/p3-open-drawer-proof.png | 66253 | 4e8cb30833dd6d4bcb61f186a69972bc5cac904c7358fab25fcd95d6efe31151 |
| figma/screenshots/current/usc-wide-overhaul-2026-08-13/p4-desktop-dark.png | 873850 | 630df942f7753855ca19a114bed3e473fa69710d245570998d04aae9048e35c7 |
| figma/screenshots/current/usc-wide-overhaul-2026-08-13/p4-desktop-dark-final.png | 863103 | fc3f413967d5077dc5048492304ce221ac88cd6118c561065c06b8bff7b83c44 |
| figma/screenshots/current/usc-wide-overhaul-2026-08-13/p4-desktop-light.png | 963953 | 3d302f443318b93ac5878967286a90d3e9c0023d6c0e40f5656b5d8e6367ceb9 |
| figma/screenshots/current/usc-wide-overhaul-2026-08-13/p4-desktop-light-final.png | 954930 | fe71c82c4dbd2db9356baa37b08f22c3d0e6191300a2cddec76b6c4ac1c16213 |
| figma/screenshots/current/usc-wide-overhaul-2026-08-13/p4-mobile-dark.png | 249756 | b32a333adf00f43e393e0f9c0d5c0a3898fafc4624ea9eab45a315df641e552b |
| figma/screenshots/current/usc-wide-overhaul-2026-08-13/p4-mobile-dark-final.png | 243483 | 939f77c3b8b0cf72e909977082fd1d190ac19b6b887d1c3208dbb0e935c9eceb |
| figma/screenshots/current/usc-wide-overhaul-2026-08-13/p4-mobile-dark-fixed.png | 249282 | 1dbe6531d912a33d5d1af0e15b3b2f6c44fe0d10a556c86031e7838122b8e602 |
| figma/screenshots/current/usc-wide-overhaul-2026-08-13/p4-mobile-light.png | 283258 | 7265c62565dfcf026d7648b77ace0da223eca821e228a557f98d4eb639897cf6 |
| figma/screenshots/current/usc-wide-overhaul-2026-08-13/p4-mobile-light-final.png | 277031 | 7bfd323af23d0ea1459a5a517f27044e1357abae0b83a877b535c875a1075430 |
| figma/screenshots/current/usc-wide-overhaul-2026-08-13/p4-mobile-light-final2.png | 276506 | f6773082c9964126b4d1e0837fab599b5d1913a0bc8cdd950b776b921b0e960d |
| figma/screenshots/current/usc-wide-overhaul-2026-08-13/p4-mobile-light-fixed.png | 282958 | 82c53acad1dd9108e2558918a5a4ae5166cca969faa7b8d67f74169097cf7d6b |
| figma/screenshots/current/usc-wide-overhaul-2026-08-13/p4-motion-a11y.png | 289745 | a9d3e7865d18c0129daf6b184b1021362a8ead0e39baaed9c656839a0e453687 |
| figma/screenshots/current/usc-wide-overhaul-2026-08-13/p4-responsive-evidence.png | 277594 | 3c033f5bd1a8d5139f208ef76d729c767228789e4ebc06ce29268f9d5960c093 |
| figma/screenshots/current/usc-wide-overhaul-2026-08-13/p5-active-1024.png | 267077 | a5912f350ab45ec73acff2e4b1944428f85fda7956ebc4dadf971f81a2fb3a05 |
| figma/screenshots/current/usc-wide-overhaul-2026-08-13/p5-components.png | 295623 | 5ff24c59615f0e120a7d214c9a65f8efe2c0881ff5c9cfd6eda98a35b2260f83 |
| figma/screenshots/current/usc-wide-overhaul-2026-08-13/p5-foundations.png | 379802 | a7409de4c623865042db79828fc57b7557130dfe3b077b7d8845045cc29ed3dc |
| figma/screenshots/current/usc-wide-overhaul-2026-08-13/p5-native-families.png | 128576 | 7e758a7e442260c3643e7b09e8ea6c5c712ab454b55cceb9d26a798d911600c7 |
| figma/screenshots/current/usc-wide-overhaul-2026-08-13/p5-shell.png | 307084 | 9883f18299eb48da7680e395f248a48d308615642b5883896161201ffe21db8c |
| figma/screenshots/current/usc-wide-overhaul-2026-08-13/p5-shell-1024-before.png | 272241 | 1d7d5576ab77d7779ad515b75682d674b519c1e30adab1ef7b20cea36e59e07e |
| figma/screenshots/current/usc-wide-overhaul-2026-08-13/p5-shell-1024-fixed.png | 267090 | ce566a5d197a92d831a6553fef046abf1841cf2ea6f48afcf8cf6ea960fde7a7 |
| figma/screenshots/current/usc-wide-overhaul-2026-08-13/p5-urgency-native.png | 6715 | f43d3e8e0ea2638cded7ede71a657a1b8b3cfdb1c36aa14555a514700fe5cdc9 |
| figma/screenshots/current/usc-wide-overhaul-2026-08-13/p6-dark.png | 163426 | b4e80d3634d6370a91ac32337b7934bb68d444231751daa3f2afcf0a760dea8b |
| figma/screenshots/current/usc-wide-overhaul-2026-08-13/p6-dark-final.png | 162694 | 112749ac64fc21f9b22339470be354ebbe3906d2c6593bcf25354f3d01180019 |
| figma/screenshots/current/usc-wide-overhaul-2026-08-13/p6-evidence.png | 175226 | 79a75a112ed8d051f52d5408eaa798b07cde92d42ea425a2ec0100f42434a864 |
| figma/screenshots/current/usc-wide-overhaul-2026-08-13/p6-light.png | 162325 | 16c1bc70be2e289319dde601903e08bb7a9ee8dcfd0d6f26a12381ea1666119d |
| figma/screenshots/current/usc-wide-overhaul-2026-08-13/p6-light-final.png | 161720 | 62eb92bc1c36c20fb310e1c546d95888181de5970d97228880e2b87e2d141330 |
| figma/screenshots/current/usc-wide-overhaul-2026-08-13/p6-mobile.png | 102731 | a41cc7221fdb40339c152efa7089cc12e42ee97b8f1127db87249b140ccd229e |
| figma/screenshots/current/usc-wide-overhaul-2026-08-13/p6-overview-a.png | 431165 | af92fcbb245581d2188cc0ccd961b27bc63036d6627dd878d73d85cc40311049 |
| figma/screenshots/current/usc-wide-overhaul-2026-08-13/p6-overview-b.png | 406702 | a855671a76f20756a7b56477d092731f13c83487b61c0d6e396930b7f6b85b1c |
| figma/screenshots/current/usc-wide-overhaul-2026-08-13/p6-overview-c.png | 430433 | a1b4f365819faa4cd537632c5b476e5c0f0dd5133dc57b961a767e86c06f06e1 |
| figma/screenshots/current/usc-wide-overhaul-2026-08-13/p6-overview-mobile.png | 341695 | ecae6700d5233dd2e40008a0ba3d81aa8cc73554390509d9498cbc241cf9c9c7 |
| figma/screenshots/current/usc-wide-overhaul-2026-08-13/p7-admin-after.png | 217764 | eb1ec950235224c48b107e7c50b46cf3809b3c41176a1c5dd4cd473402e34871 |
| figma/screenshots/current/usc-wide-overhaul-2026-08-13/p7-admin-before.png | 292611 | a2483ec1ec5bda45403d6ecae9a33073654aae428ce9739354371c7354e9b9c8 |
| figma/screenshots/current/usc-wide-overhaul-2026-08-13/p7-inventory-after.png | 152995 | 211855694e9df659b0aa4d1797198a21ff1fdf4b3467bf638fb786b609387d48 |
| figma/screenshots/current/usc-wide-overhaul-2026-08-13/p7-inventory-before.png | 349425 | 7659dc042ff4e1347d522b5be645db5feb95aa933367cd68cd44d9787f940a29 |
| figma/screenshots/current/usc-wide-overhaul-2026-08-13/p7-lending-after.png | 376758 | 0cea2c5d15877ae8c8ce3b71923d3596649090456d3720e914fac25d9e9980bd |
| figma/screenshots/current/usc-wide-overhaul-2026-08-13/p7-lending-before.png | 446392 | 6f012b47f4e2bfc34c4fd01532071e17dd4aefd21f0f29e18d50e56970a0480c |
| figma/screenshots/current/usc-wide-overhaul-2026-08-13/p7-release-after.png | 381886 | 498fe05577eee71969ad6942b016fd2f8868a2189176b1524068c623449677e3 |
| figma/screenshots/current/usc-wide-overhaul-2026-08-13/p7-release-before.png | 401620 | 2a3a3370784f77c36351cf91a22b8abed58472d8015bb65df0fb5fbdac41731a |
| figma/screenshots/current/usc-wide-overhaul-2026-08-13/p7-request-after.png | 331115 | 15cfb4b500e39ed2b8908145e1ef0e6341ddbafd87e39c65878e891df4213189 |
| figma/screenshots/current/usc-wide-overhaul-2026-08-13/p7-request-before.png | 511041 | 16dd6b8381cca7ca0b6ccb58a3c47cb35c9154e24b130eecdb06faad421624a3 |
| figma/screenshots/current/usc-wide-overhaul-2026-08-13/p7-request-mobile-before.png | 140347 | e3ec49e68cc5fea250d67add2cff7539a326e3a9cb7e96a90d9a98eb879904ed |
| figma/screenshots/current/usc-wide-overhaul-2026-08-13/p7-supply-after.png | 500446 | e8c1528278b127049a954a3a81b056eeb189d22977e9b0c8d337019f9541f8bc |
| figma/screenshots/current/usc-wide-overhaul-2026-08-13/p7-supply-before.png | 370326 | b72c68c774f3ee0481011ee958559c93c9e27be053955cdd2fee4ded6cdce552 |
| figma/screenshots/current/usc-wide-overhaul-2026-08-13/p8-page96-before.png | 136134 | 5fd1ce7492d840798403a765a70844653f03e90926c77e9212e3c9b8fb3d9907 |
| figma/screenshots/current/usc-wide-overhaul-2026-08-13/p8-page97-before.png | 127137 | 7944165b6373460b9d28207357e87d4e77425d29e46972f0ce55758499a8ffdd |
| figma/screenshots/current/usc-wide-overhaul-2026-08-13/p9-page99-current.png | 121976 | d6628b184d190de047477a0ee9c0817f1c2e6c7587ddc28551950011f7ab38b0 |
| figma/screenshots/current/usc-wide-overhaul-2026-08-13/page10-live-p0.png | 61968 | 1a6e489f32936fc05e67267c405e711c76d72bfbead779948b577ac3aee1ee15 |
| figma/screenshots/current/usc-wide-overhaul-2026-08-13/page10-p1.png | 63921 | 1892c74dfaa18cd66b6807d05d8c8c763118a64613969d2e6d41333bf5e9907f |
| figma/screenshots/current/usc-wide-overhaul-2026-08-13/page10-p1-critique-fixed.png | 68051 | efedd91c7d6faf9986c083c8d92242b21aba5002cf3764d393c5af96298304df |
| figma/screenshots/current/usc-wide-overhaul-2026-08-13/page90-dark-current.png | 668538 | db27cff7f62d92abfc0074b8dff3bf119984a3c946755d840b6374c747eb260c |
| figma/screenshots/current/usc-wide-overhaul-2026-08-13/page90-light-current.png | 637491 | 943fe84be01785845efb6ae6b7c0711324296ffd75f4bcc721df6da98c7c5926 |
| figma/screenshots/current/usc-wide-overhaul-2026-08-13/page90-mobile-current.png | 474234 | 64c2c1c2d3f1ab81a81745058f9848edcb6575e77680b011897c6463ddd459bf |
| owner/annotations/playground-overhaul-v1-design-and-annotations.pdf | 2667888 | 824f4a6fd0168134eeece0072b91a6e9f51d4e40e02d5278905285d6af152622 |
| owner/annotations/v01-v42/V-01.png | 312734 | d7811b85f59984f2a0354bb9fcc96a5ffeae7949307434bff4f2ed5fdbf0fb44 |
| owner/annotations/v01-v42/V-02.png | 7360 | 6d85df2a05b81baf9ef746ebd8369dbf862c547ded66aecdc5d14404f05cef43 |
| owner/annotations/v01-v42/V-03.png | 12264 | 84d964fd99ca28cbdc4975d5c35c2693779998612b43c2ddc0b92d9ff8da7178 |
| owner/annotations/v01-v42/V-04.png | 2755 | 43f25ec8df25859196d8154aba0999250cdc48546485ea252304fe9d9712f7fe |
| owner/annotations/v01-v42/V-05.png | 12517 | 836d760b4e4c18fb05e76080eb52c5e9d745d487ef727d2a2714f9117a53390b |
| owner/annotations/v01-v42/V-06.png | 7321 | 46df418b14ed8755fcab828e51f297aca06b16db64afa53ca951324a4e71a215 |
| owner/annotations/v01-v42/V-07.png | 6132 | 80bc3ef3d82b642eace1c557662ed6997344edec1d654746d20ffe54aaa91c68 |
| owner/annotations/v01-v42/V-08.png | 3651 | f3baea35a3be6fead277b99967f74dc2daeeae281c4484a02783b352fc2eba9b |
| owner/annotations/v01-v42/V-09.png | 5198 | a10ca21b56f3c8b991db670ed748a26b5dafb128d083c7d2576351b946f4d454 |
| owner/annotations/v01-v42/V-10.png | 3448 | 0e25162a3cd6694da57b9c9fdaccbee16728d03445d47880e1c6be0efd1cfac2 |
| owner/annotations/v01-v42/V-11.png | 4123 | cce5954dc3b5e47652bdfe650e06f77643de08b86a4671b03e7a6dff871f0dc8 |
| owner/annotations/v01-v42/V-12.png | 5430 | e88f49ced20751459855b5620fea5c4d5d9471b97bda10f2188cfc5dac5a03f8 |
| owner/annotations/v01-v42/V-13.png | 73260 | cdbf5a0fda1f2ea96ebed65762ecd658de94daf7f9b108adbd0d7016d27ff277 |
| owner/annotations/v01-v42/V-14.png | 552 | 6d48ae42163a70c777566fb76306449af95b148022fe54b473105af5116a70f3 |
| owner/annotations/v01-v42/V-15.png | 3380 | ab6651080defcf58b7160c9960d9c26634f3ab29108d796a4bbaa0557ebc41ac |
| owner/annotations/v01-v42/V-16.png | 63390 | 2190557aa2646d9cb15e244962d264b6a4831b772ad15f9075f341c700b13e4b |
| owner/annotations/v01-v42/V-17.png | 49233 | 1a2308ea6cbb854c24fc56b90b9d4bf549b9944918f20a1db520fd2218ab2b06 |
| owner/annotations/v01-v42/V-18.png | 63953 | c8f4803ce8cebc5c57decfcb23ff449c4196f46df8d1bb2f852a976ba790b145 |
| owner/annotations/v01-v42/V-19.png | 42566 | 763fa16f8d1bebc0547ce9f4bdc6ade78b7fba4d845172d3e467a82264b29c66 |
| owner/annotations/v01-v42/V-20.png | 60268 | 3b32170b6b29bd7646751ac60c7ddb90a862b5ddaea7cff9a0a718497effab5c |
| owner/annotations/v01-v42/V-21.png | 96056 | 465497f92c74e4621ec2aa6e29acf01792d234b9798d5c813539f93d637af4a4 |
| owner/annotations/v01-v42/V-22.png | 6961 | da0c4ad5fde350f623062935fe71313922905aa95deccd4e2759a4b25ab1abce |
| owner/annotations/v01-v42/V-23.png | 4542 | f13d8a4dd90b9959a2fc6df565dfeacefdc669336da582e617366b44187e4c57 |
| owner/annotations/v01-v42/V-24.png | 4276 | 6a821b13fa46621eaba22c658d20c26acb7212f03dc02d1d0b818e6af2b1f73d |
| owner/annotations/v01-v42/V-25.png | 35304 | c66fb9764d35815aa46fc275fb85168d8e62068d5f3512dccbf6962c3b89ecc6 |
| owner/annotations/v01-v42/V-26.png | 2685 | 193ad864af3ffaf96b197957c9a9884b4afdfdefddb735db1af41ddeaea4193b |
| owner/annotations/v01-v42/V-27.png | 56242 | 2ba659d43249d65891855e08baf2053603af54b7358ddf4aaf87564adc7fe69d |
| owner/annotations/v01-v42/V-28.png | 2800 | 8fe5cfca308bdfd0a80ca946f83ac82b143c4d2ca2f3e80af3427a58d92968a4 |
| owner/annotations/v01-v42/V-29.png | 23828 | 28efd48a31b7ea24ef0743aeb9f317705be7e7e285785b5eaefcc1e019fba5f4 |
| owner/annotations/v01-v42/V-30.png | 9333 | d8e090d4636ab3f9993a29fd03bf1e226df8b902b6a8d25e0a95f05ff41fe9bd |
| owner/annotations/v01-v42/V-31.png | 91711 | 732aa6ef361ded4227af8a48566e5f7c8c432077f188aae705ab0cf9f628ce8e |
| owner/annotations/v01-v42/V-32.png | 3253 | f3703168102a6b3e479f660a5cbbd9d87603e68e68735c5a2bc613a22b9f39b1 |
| owner/annotations/v01-v42/V-33.png | 43862 | bb769d7191d36ca42df075f90f50a33345036d0d603a1882f31eff9abbba2d56 |
| owner/annotations/v01-v42/V-34.png | 60206 | aa1d71a6fa54b44b15ea53daa50665bec0f17bd4b75ab2bf915089184dd729b7 |
| owner/annotations/v01-v42/V-35.png | 2329 | 5fdc61c0dfdfe77b2d5b0357ab4ef05851d8d7279099f61a297b2e94dfd77ab9 |
| owner/annotations/v01-v42/V-36.png | 4262 | c458e6c63746f8eb637c894cbe48903a15c866a304f522a5c8c4a7c51e08e695 |
| owner/annotations/v01-v42/V-37.png | 10000 | 4f776935bc9e161b3dfcaf49112d4794b2aebc4a12cd6ddb72bc9656a8a16696 |
| owner/annotations/v01-v42/V-38.png | 30423 | 40c9a2d458cfa8679a1dcf894e405383f0da57844ea89653352d6f0053f5eb50 |
| owner/annotations/v01-v42/V-39.png | 134485 | e1cbb1c1371eb0fa4168ef3d24e69fe9492281497313a303f447b092b614bade |
| owner/annotations/v01-v42/V-40.png | 477727 | c7f374e858d1d40d23b905b615a646414fcb7758f625d9b363352df770029718 |
| owner/annotations/v01-v42/V-41.png | 2120 | 273c1767bcd382b6eb8e7d7f5b1f51683f6e1c782c5a13acedd2d2410b39e363 |
| owner/annotations/v01-v42/V-42.png | 52015 | 2fce3b84df334ebdfa4fffac58d0c9ef5e6a24182ab8075cfdb6328a58515f9a |
| owner/source-instructions/design-authority-consolidation-master-prompt-2026-08-13.md | 29613 | 5422ba8a4965764cb838d8adac58ca43c94893c4489d701cf40a8f25eafdaef0 |
| owner/source-instructions/playground-overhaul-v1-owner-packet.md | 53300 | dc745a3113806878215d4d3c855fc8f3a5281726ce5c50f31ea76a897d0f4009 |
| research/external/design-dna-2026-08-10/DESIGN_RESEARCH_HANDOFF.md | 6370 | 00d49e41711b35608bdf1aee3886cbf3b048ac799acbfec91f272a4577b14616 |
| research/external/design-dna-2026-08-10/MODULE_REDESIGN_PLAN.md | 7245 | bbf68f549c0c96c448acbc8b0131d5f83dd8085b570dfb3263d8c039b9dc2644 |
| research/external/design-dna-2026-08-10/PROPOSED_DESIGN_SYSTEM.md | 11083 | 6c1067dbf56d694c8bb01ee3ba04c95c1c20f3e56fa9cc916565406d84827da0 |
| research/external/design-dna-2026-08-10/REFERENCE_MATRIX.md | 9181 | 4135a46e0fe8e1b8feac919b5f2857a7d5699fccecdfd3324c170fefad9f3fbe |
| research/external/design-dna-2026-08-10/references/21st-dev-dna.md | 6531 | 76215e5cb672568c7fba50739fbd2c75818683ce9fad3ac848baffde2c776ad0 |
| research/external/design-dna-2026-08-10/references/awwwards-dna.md | 6331 | 483190d75bad1a77a887a1b58ff8abefef718b76b6fad66d14b113c75bfd6683 |
| research/external/design-dna-2026-08-10/references/codrops-dna.md | 6492 | b52688942fdc72ed87afad8cf47519d116f072d793da1dd9cae9d07b3edf2f0f |
| research/external/design-dna-2026-08-10/references/magic-ui-dna.md | 6302 | 9d18b3aaf189acb3badc8a904e7ada2562e60d869d6c16362e58620d4670b301 |
| research/external/design-dna-2026-08-10/references/mobbin-dna.md | 6867 | d848c3ee77864bfd800aaa5082c661cb457e75c2c2a6362844da3e749f265e47 |
| research/external/design-dna-2026-08-10/references/recent-design-dna.md | 5705 | 06c9b93177a8ae61f6a3bd7d3392fd8a2a088d3ef223031aaf2c54631ebb5fcb |
| research/external/design-dna-2026-08-10/references/saasframe-dna.md | 6329 | bb7778a4162b70d9d5d8bb6bf775765213f9e0006795916a5089bb259ba1767a |
| research/external/design-dna-2026-08-10/references/spline-dna.md | 7106 | cfe20833255bf9931e9e0eb4e70b361b97a25ce7e606eb2c1eec9cba36636ea6 |
| research/external/design-dna-2026-08-10/USC_DESIGN_DNA.md | 15832 | 03b77e985fd051f2b5f9da7f5f7eeac67ce2a14662419ed06d04d97b5b8e22bd |
| research/pdf/playground-overhaul-v1-design.pdf | 121605 | d6c7aa5b63911895e23f571af8c88112c479b286e8f4d9bf7b9c87dc02d66c09 |
| research/transcripts/playground-overhaul-v1/annotation-pdf-text.txt | 53778 | 8011e29b203d3278e5174305cb86c5c4c7b09de3b467771928592cbc8c27c77c |
| research/transcripts/playground-overhaul-v1/design-pdf-text.txt | 13764 | 821ea901afa65e986558716f6f37604dec4cc8a1e1cf93706aedc83c09cba9fb |

## D05 — Figma Authority and Page Map

DESIGN.md is the durable textual authority. Figma is the visual workbench. A binding owner instruction or accepted contract must be reconciled into both; neither silently overrides the other.

| Field | Value | Verified |
|---|---|---|
| Name | `Document` — the file has never been named. The earlier "HAU-USC Logistics — Frontend Design Lab" record was aspirational, not the stored name. | 2026-08-19 |
| URL | https://www.figma.com/design/hXJElH4p72KfgAaoUyfNOC/ | 2026-08-19 |
| File key | hXJElH4p72KfgAaoUyfNOC | 2026-08-19 |
| Plan / seat | Professional, Full seat. The former Starter three-page cap and 20-call monthly MCP quota no longer apply. | 2026-08-19 |
| Mutation state | MUTATED. The file has been written to repeatedly since 2026-08-13. | 2026-08-19 |
| Pages | 28 | 2026-08-19 |
| Variable collections | 8, totalling 120 variables | 2026-08-19 |
| Text styles | 11 | 2026-08-19 |
| Effect styles | 9, including the Material G0–G4 ladder | 2026-08-19 |
| Paint styles | 0 — colour is carried by variables | 2026-08-19 |
| Components | 102 on page 12 | 2026-08-19 |

Superseded record, retained for provenance: this section previously stated that
the file held only `00 — Capture Index` (page `0:1`, sections `35:141`,
`35:142`, `35:145`) under a Starter-plan three-page constraint, and that
consolidation was "read-only metadata inspection; no Figma mutation". That was
true on 2026-08-13 as a description of what the consolidation task itself did,
but it was carried forward as if it described the file. It does not. The full
verified page map is in
[`docs/design/FIGMA_DESIGN_MAKE_AUDIT.md`](docs/design/FIGMA_DESIGN_MAKE_AUDIT.md).

Current page architecture, by node:

| Page | Node | Role |
|---|---|---|
| 00–03 Capture Index / Production / Playground / Comparisons | 0:1, 9:2, 9:3, 55:2 | HISTORICAL and REFERENCE captures |
| 04 USC Brand + Official Media Direction | 274:2 | CURRENT |
| 10 Authority + Design Handoff | 55:3 | **EMPTY — outstanding gap** |
| 11 Foundations · 12 Components · 13 Shell + Navigation | 55:4, 55:5, 55:6 | CURRENT design system |
| 15 Landing · 20 Overview · 21 Profile | 274:3, 55:7, 274:4 | CURRENT modules |
| 30 Inventory · 40 Request · 50 Lending · 60 Release | 55:8, 55:9, 55:10, 55:11 | CURRENT modules |
| 70 Restocking/Procurement/Events · 80 Administration · 90 Public + Auth | 55:12, 55:13, 55:14 | CURRENT modules |
| 91–99 State / Responsive / Motion / A11y / Spatial / Content / Loading / Traceability / Research Delta | 55:15–55:20, 78:2–78:4 | CURRENT annotation pages |

Frames are labelled `CURRENT`, `PROTOTYPE R2`, `HISTORICAL` or `SUPERSEDED` in
their own names. Honour those labels: several pages carry current and superseded
material side by side, and section `45:5` on page 20 is explicitly SUPERSEDED
despite still being referenced by the prototype's `route-map.js`.

Do not invent page architecture, and do not trust any node mapping older than
the verification date above without re-reading the file.

| Surface | Production node | Playground node | Status |
|---|---|---|---|
| Landing | 34:2 | 34:16 | CURRENT capture registry |
| Staff sign in | 34:4 | 34:19 | CURRENT capture registry |
| Account/application | 34:7 | Not recorded | CURRENT production capture only |
| Request | 34:11 | 34:21 | CURRENT capture registry |
| Lending | 34:13 | 34:24 | CURRENT capture registry |
| Other internal modules | Not verified | Not verified | Recapture before claiming a target |

Node IDs prove registry presence, not live parity. Recapture the relevant route before treating a frame as current implementation evidence.

## D06 — Product / Route Inventory

The following inventory is CURRENT from the accepted frontend integration specification and source. Preserve it unless an accepted amendment changes it.

### Public and pre-authentication paths

| Path | Purpose |
|---|---|
| / | Public USC/Logistics landing |
| /login | Staff sign in |
| /request | Public request intake |
| /request#request-tracking | Public request tracking |
| /lending | Public lending intake |
| /lending#lending-tracking | Public lending tracking |
| /register | Account application |
| /application-status | Account-application status |
| /portals#module-index | Public module index |

Public/pre-auth source surfaces include auth-gateway, public-requester-portal, public-lending-portal, public-account-application, requester-portal, borrower-lending-portal, public-policy, brand-assets, public-advertisement-carousel, and portal-navigation.

### Authenticated workspaces and modules

Canonical workspace roots: /admin, /director, /food, /inventory, and /materials.

Canonical module form: /{slug}/{module}. Legacy /app/{slug}/{module} remains accepted only where current routing supports it.

Modules: overview, request, lending, release, restocking, procurement, and inventory.

View templates: overview, request, lending, inventory, release, restocking, procurement, and reference-admin.

Roles: SYSTEM_OWNER, ADMINISTRATOR, DIRECTOR, COMMITTEE_HEAD, DOL_STAFF, REQUESTER, and READ_ONLY_AUDITOR.

Authenticated shell sources include runtime, runtime-extensions, authenticated-account-controls, bootstrap-controller, bootstrap-ui, and form-dirty-state.

Reports has no bootstrap module or view template and must not be invented as a production destination.

## D07 — HAU-USC Brand Identity

HAU-USC is the primary public identity; Logistics is the current specialized operational hub. The experience should feel institutional, student-accessible, calm, exact, and accountable.

CURRENT rules:

- Preserve approved HAU, USC, and DOL marks, proportions, clear space, transparency, and role.
- Use the Institutional Logistics Ledger as an organizing narrative: actions have owners, states, timestamps, and consequences.
- Prefer evidence over decorative claims.
- Keep USC identity visually primary on the public landing.
- Use the DOL mark only in approved operational contexts; V-38 forbids it in the USC hero-mark slot.
- Do not invent event imagery, officers, metrics, testimonials, affiliations, or institutional claims.
- Do not present AI-generated or stock imagery as documentary USC media.
- Preserve official media loyalty: verified official sources outrank stylistic convenience.
- Future department identity may extend the system, but cannot dilute the current Logistics product or imply deployed hubs.

## D08 — Color / Material System

### D08.0 — Canonical primary gold — OWNER-LOCKED, BINDING

Status: CURRENT. Owner decision, 2026-08-19. Supersedes the unresolved
`#f2d15c` palette question and every earlier gold literal.

```text
PRIMARY GOLD    #D4AF37
```

Every other gold in the system is **derived from it**, by a stated fraction
rather than by eye, so the ramp cannot drift into five independent guesses
again:

| Role | Light | Dark | Derivation |
|---|---|---|---|
| `gold/primary` — the decisive accent | `#D4AF37` | `#E1C671` | canonical; dark lifts 30% toward paper because #D4AF37 sits too close to the dark surfaces to stay decisive |
| `gold/light` — surfaces and highlights | `#E6D088` | `#EDDCA7` | 42% primary over paper |
| `gold/tint` — washes | `#F7EFD5` | `rgba(212,175,55,.16)` | 82% primary over paper |
| `gold/border` — decorative boundaries | `rgba(212,175,55,.45)` | `rgba(225,198,113,.45)` | translucent primary |
| `gold/glow` — halos and veils | `rgba(212,175,55,.14)` | `rgba(225,198,113,.14)` | very low opacity primary |

**Two golds are deliberately NOT re-derived.** `gold/700` (`#7d5518` light,
`#c9a45f` dark) is `color/accent/text` — the only gold that passes 4.5:1 as ink
on cream, measured at 6.49:1. `gold/500` is the ramp step below primary. Moving
either would trade a brand tidy-up for a contrast failure.

**Gold carries no accessibility duty.** It never satisfies 1.4.11: `#D4AF37`
measures 2.07:1 on the working surface and 1.61:1 on the ground. Control
boundaries, selected states and focus indicators are carried by
`--border-control`, `--selected-line` and `--focus-ring-contrast`. Gold is the
brand layer on top, never the layer that makes a control identifiable.

What gold **does** guarantee: dark ink on primary measures **7.97:1** light and
**10.02:1** dark, so a primary action is always legible.

**Do not flatten the hierarchy.** A light highlight is not primary gold at low
opacity — it is `gold/light`. Replacing every gold-ish value with `#D4AF37`
destroys the depth the ladder exists to create.


The CURRENT palette separates structure, signal, and content:

- Oxblood is the institutional anchor for navigation, decisive actions, hero atmosphere, and operational briefs.
- Gold is scarce. It marks active controls, focus, selected routes, and high-value emphasis rather than decorating every container.
- Warm paper gives light mode crisp figure/ground separation.
- Charcoal and near-black oxblood form dark mode's ground with off-white type and restrained luminous edges.
- Semantic green, amber, red, and blue-gray reinforce status labels and icons. Color never carries meaning alone.

Premium glass is CURRENT only as a restrained material rule:

- Use localized translucency for the floating public bar, command menu, dialog, drawer, or mobile tabbar where layer behavior earns it.
- Pair blur with a fine gold or oxblood edge and reliable text contrast.
- Do not wash the whole application in glass.
- Ordinary work sections use paper tone, proximity, alignment, and hairlines.
- Avoid decorative glow, excessive gradients, nested translucent cards, and fake depth.

Lines are semantic: they may connect a route, divide data, or indicate selection. Decorative corner and heading lines are rejected.

## D09 — Typography

Bricolage Grotesque is the product voice for display, page, and surface headings. IBM Plex Sans handles body copy, data, forms, navigation, and controls. Newsreader is reserved for the HAU-USC wordmark.

CURRENT rules:

- Establish one clear reading order instead of making every card, metric, and action equally loud.
- Use concise labels; uppercase only for route, state, or section labels where the system requires it.
- Use tabular numerals for operational values.
- Keep body line length controlled.
- Headings and display statements wrap safely at 320 pixels and 200 percent zoom.
- Do not use weight, capitalization, or typography alone to convey state.
- Use bundled font assets and reliable fallbacks; do not add remote font dependencies without an accepted performance/privacy decision.

## D10 — Spacing / Radius / Layout

The public landing is an image-led gateway inside a floating glass identity bar. It contains no step tutorial. The authenticated shell uses a persistent desktop route rail, command topbar, and wide editorial working canvas.

CURRENT rules:

- Use content hierarchy rather than equal card dimensions.
- Prefer spacing and headings over nested cards.
- Controls use asymmetric route radii that feel authored for the product.
- Pills are reserved for compact status, the celestial toggle, and tightly grouped modes.
- Elevation is earned by layer behavior.
- At 1023 pixels and below, the route rail becomes an off-canvas drawer.
- At 767 pixels and below, the command bar compacts, content stacks in task order, and five primary destinations may use fixed bottom navigation with safe-area and scroll clearance.
- Test narrow mobile, wide mobile, tablet, laptop, wide desktop, zoom, long names, and long status labels.

## D11 — Iconography / Semantic Status

Icons are bundled monoline SVGs and sit directly beside labels unless a functional plate is needed for state, target, or focus.

CURRENT rules:

- Keep theme icons visually and semantically consistent across states.
- Keep urgency icons consistent and pair them with text.
- Preserve a recognizable three-line menu while its geometry changes for open/close.
- The compact back control uses a small gold glyph plate plus readable label surface.
- Avoid repeated rounded-square icon containers and ornamental elbows.
- Never use color or an icon alone for status.
- Status vocabulary must match backend meaning; do not rename a state into a different promise.
- Use green for verified success, amber for pending/attention, red for error/destructive/overdue, and blue-gray for neutral information only when the semantic mapping is accepted.

## D12 — Light / Dark Theme

Light and dark are equal CURRENT modes, not separate products.

- Light uses warm paper, crisp surface separation, oxblood structure, and restrained gold.
- Dark uses charcoal or near-black oxblood, off-white text, and controlled luminous edges.
- Theme choice persists only through the accepted storage mechanism.
- V-36 requires a whole-page coherent transition with no flash of unthemed content or mixed-theme frames.
- Theme controls expose an accessible name, pressed/state semantics, keyboard operation, and consistent iconography.
- Both themes meet contrast requirements in default, hover, focus, selected, disabled, loading, and error states.
- Reduced-motion users receive an immediate or minimal transition.
- V-41 requires reproduction and token/cascade diagnosis for any mismatched color state; do not guess from a screenshot.

## D13 — Motion / Interaction

Purposeful motion is CURRENT; spectacle is rejected.

Allowed:

- brief state transitions;
- navigation continuity;
- disclosure and expansion;
- focus-preserving dialog and drawer transitions;
- progress that reflects real work;
- restrained public-section entrances;
- V-32 Navigate-control motion that explains expansion or selection.

Not allowed:

- motion required to understand content;
- fake progress;
- autoplay distraction near operational tasks;
- cursor-following effects in authenticated views;
- animation that delays a primary action;
- perpetual decorative loops;
- parallax that harms reading;
- motion that ignores reduced-motion preference.

Use a small duration/easing system, favor transform and opacity when appropriate, and verify interruption, cancellation, focus continuity, performance, and reduced motion.

## D14 — 3D / Spatial Design Rules

The authoritative product experience is two-dimensional. Meaningful 3D is FUTURE CONCEPT or REFERENCE until a specific accepted implementation exists.

Any optional 3D must:

- have a complete 2D equivalent;
- place no route, fact, action, or state exclusively in 3D;
- fail and load into a usable fallback;
- honor reduced motion and resource constraints;
- support non-precision and keyboard-accessible alternatives;
- record asset license, performance budget, privacy effect, and ownership;
- remain outside authentication, Profile, Request, Lending, Release, Inventory, and Administration task dependency.

Spline research is REFERENCE. No verified project-specific local 3D source or render was found, so no 3D vault directory was created.

## D15 — Responsive / Mobile

Desktop and mobile are equal priorities.

- Primary actions remain reachable without hover.
- Fixed headers, drawers, and bottom navigation do not obscure content, focus, or validation.
- Forms become one column before labels or actions become cramped.
- Tables may recompose but retain headers, record relationships, state, and actions.
- Long identifiers, names, quantities, and status labels wrap safely.
- Maintain touch targets, safe-area insets, and scroll clearance.
- Test at 320, 390 or 414, 768, 1024, and 1440 pixels, plus 200 percent zoom and text resize.
- Test both themes and representative loading, empty, error, stale, denied, and populated states.
- Do not disable browser zoom.

## D16 — Content / Copy / Plain Language

- Use plain, specific, respectful language.
- Buttons use verbs that describe the action.
- Destructive labels name the consequence.
- Recovery copy avoids security internals and account enumeration.
- Dates, quantities, units, and timezones are explicit.
- Expand institutional abbreviations for broad audiences.
- Replace jargon with the user's next action without inventing policy.
- Do not promise approval, fulfillment, response time, delivery, reminder, or recovery behavior without an accepted contract.
- Placeholder content is labeled and never shipped as fact.
- Correct grammar, capitalization, and institutional naming through owner-approved strings.
- Use USC Staff/Officer, Student ID No., Contact Number, Request Ticket ID, and similar V-ID language only when the accepted domain mapping supports it.

## D17 — Accessibility / Reduced Motion

Release acceptance includes:

- keyboard-only operation and logical focus order;
- visible focus;
- semantic names, headings, landmarks, tables, forms, and status;
- dialog focus containment and restoration;
- screen-reader state announcements with restrained live regions;
- browser zoom, text scaling, and responsive reflow;
- sufficient contrast and non-color state cues;
- reduced motion;
- touch target size and spacing;
- accessible empty, loading, error, stale, and permission states.

Decorative images use empty alternative text; informative images use concise meaningful alternatives. Automated checks are necessary but do not replace manual keyboard, screen-reader spot, zoom, contrast, and reduced-motion verification.

## D18 — Public USC-Wide Landing Vision

The CURRENT public vision introduces HAU-USC first and Logistics as the active service hub.

Hierarchy:

1. approved USC institutional identity and transparent hero mark;
2. concise service purpose;
3. one primary verified action;
4. secondary staff sign-in;
5. grounded capability explanations;
6. verified official USC sources;
7. restrained footer with real destinations only.

V-37 through V-42 govern masthead scale, hero-mark usage, copy, hierarchy, color-state diagnosis, and scroll overlap. Use the real approved campus image only where licensed and appropriate. Do not add a current event, statistic, officer roster, or institutional claim without a verified current source and expiry/review rule.

The floating public identity bar may use restrained glass. The hero must remain readable, fast, responsive, and useful without motion.

## D19 — Logistics Shell / Navigation

- Preserve role-aware routes and current location.
- Normal routes show one primary task and no persistent demo/module walls.
- Retain truthful private Playground identity and deny production markers there.
- The desktop rail is persistent and compact; V-11 governs the approved DOL mark when collapsed.
- V-31 requires a collapsible drawer/rail whose state can persist per device without hiding location or focus.
- At mobile widths, use an accessible drawer or accepted bottom navigation.
- Back behavior follows browser and route semantics.
- Preview-only controls and labels do not enter production.
- The shell may show a server-authorized candidate identity; V-15 forbids client-spoofed environment claims.

## D20 — Overview / Command Center

The Overview is an operational orientation surface, not a generic analytics dashboard.

- Prioritize time-sensitive or blocked work, the primary role action, recent relevant activity, then secondary guidance.
- The Control Centre is intentionally asymmetric: narrative priority on the left, decision counts and context on a shared field to the right.
- V-16 rejects equal-size panels when operational importance differs.
- Counts and metrics come from real data only.
- Preserve loading, empty, populated, stale, denied, and error states.
- Do not add ornamental KPIs, fake trends, or unsupported reports.

## D21 — Profile

Profile is the identity and account context surface.

- Distinguish verified/system-managed identity from editable fields.
- Show role and organization context without enabling self-service role changes.
- Make save, error, unsaved-change, and session actions explicit.
- Confirm destructive or session-ending actions.
- Do not expose internal identifiers unless operationally necessary.
- Use a stable avatar fallback; do not invent portraits.
- V-34 makes bio and portrait upload CONTRACT-GATED by private media, access, retention, and privacy rules.
- V-35 permits a larger account area only after V-34 is satisfied; stress-test long names, roles, and fallback imagery.
- Current Figma account capture node 34:7 is production-only and must be recaptured before implementation claims.

## D22 — Inventory

Inventory is an operational truth surface.

- Preserve authoritative quantity, unit, revision, audit, reservation, custody, and ledger semantics.
- Distinguish on-hand, available, reserved, lent, unavailable, and maintenance states only where the data contract supports them.
- V-10 search uses real catalog results, keyboard selection, and no mock data.
- V-35 preserves inventory and ledger truth across redesign.
- Tables retain useful headers, row identity, quantity meaning, responsive relationships, and action names.
- Bulk actions expose scope and consequence.
- Do not collapse signed history into a mutable current-state illusion.
- Visual work cannot weaken atomicity, idempotency, concurrency, or server authorization.

## D23 — Request Center

### D23.0 — The Request Center is a submission form with a queue appended — BINDING

Status: CURRENT. Verified against production 0.8.2 at candidate `c316e047`,
schema 30, on 2026-08-19, from `src/visual/views/request.html` and the review
functions in `src/visual/runtime.js`.

The earlier statement that *"the intake queue is the dominant CURRENT Request
Center surface"* described a design proposal, not the product. In production
the Request Center is **one view**: a submission form — request type, requester
block, event or catalog context, purpose, and a line composer — with the review
queue appended **below it**, rendered only for a session holding the
`request.review` capability. There is no separate reviewer screen.

Four rules follow, and a design that breaks any of them contradicts this
section:

1. **Every reviewable line gets its own route decision.** There is no
   pre-selected default; RV-01.6 removed it precisely so one click cannot route
   a whole request. Request-level accept buttons are prohibited.
2. **The route vocabulary is fixed:** Issue from stock, Procurement / canvass,
   Catalog restock, Reject, Missing information. Catalog restock appears only
   when the request is a Catalog Restock or carries an Office Inventory /
   Pantry catalog type. "Send to Release Desk" is not a review route — the
   Release Desk is a separate module a request reaches through its lifecycle.
3. **The queue holds only requests awaiting a decision** — For Review and Needs
   Information. Accepted, rejected and closed records are not in it.
4. **Pagination comes from the server**, never from the visible rows, or review
   work past the first page becomes unreachable.

Fulfillment is not the requester's choice: the control is present but disabled
so the requester can see that the system decides from inventory.

Full contract and drift register: `docs/design/PRODUCTION_PORTAL_PARITY_AUDIT.md`
sections 10 through 13.

### D23.1 — Surface guidance

- Authenticated context includes department identity, Create/Track modes, New/Additional request choice, event/sub-event dependency, item composition, review language, and visible For Review outcome.
- V-17 removes a detached authorized-operations wall only after contextual replacements are proven.
- V-19 attaches review, fulfil, update, route, reserve, and release actions to the selected request or line according to capability.
- V-20 uses a contextual task/dialog for physical release.
- V-24 pre-fills known ticket, line, and identity data and defends against stale revision and tampering.
- Lists show sufficient record identity, status, owner/context, and time.
- Search and filters use supported semantics and authorized identifiers.
- Forms preserve entered data after recoverable validation errors.
- Detail puts status and next action near the title and separates requester content, history, and staff-only notes.
- Image evidence is not implemented under design authority; see V-23 and D33.

## D24 — Lending Hub

### D24.0 — Public Lending Center access model — OWNER-LOCKED, BINDING

Status: CURRENT. Verified against production 0.8.2 at candidate
c316e047c845fa182e82156c95945c4a5e5de2ff, schema 30, on 2026-08-19.

**The Public Lending Center requires NO LOGIN.** It is a public,
university-facing intake surface at `/lending` (and via `lending.hausc.org`,
which 307s to `/lending`).

A borrower must NOT need any of the following to submit a borrowing request:
a HAU-USC Logistics account, Staff Sign In, account activation, Administrator
approval, Director approval, or an internal staff session.

Its audience is USC Staff and Officers **and** the wider Holy Angel University
Angelite student body. Both borrower classes are equal in the contract:

| Class | Value | Conditionally required |
|---|---|---|
| USC Staff / Officer | `USC_STAFF` | `uscDepartment` required; `positionRole` |
| Angelite Student | `ANGELITE` | `courseYear` and `academicDepartment` both required |

`src/visual/public-lending-portal.js` contains no session check, no sign-in
gate, and no authorization branch. `mountPublicLendingPortal` fetches
`/api/public/lending/catalog` on mount and posts to `/api/public/lending`.

Binding design rules:

- Catalog before form. Production copy: "Browse the borrower-safe catalog
  before providing personal information. Every request starts For Review."
- Submission creates a record in **For Review**. It is never approval, claim,
  handoff, or reservation, and it deducts no physical stock.
- The receipt shows the Submission ID and a private tracking code **once**.
- Private tracking must not display borrower identity or contact details.
- "No approved lending items are published" and "No catalog items match the
  current search and filters" are **separate** states and must never be
  collapsed into one message.
- The public surface must not expose internal stock internals beyond
  borrower-safe availability, staff notes, borrower history, review or
  authorization controls, raw audit data, internal D1 identifiers, or provider
  details.

Any design, frame, or prototype that gates borrowing behind sign-in
contradicts this section and must be marked SUPERSEDED, not corrected in place
and left ambiguous. Four such frames were found and superseded on 2026-08-19;
see `docs/design/PRODUCTION_PORTAL_PARITY_AUDIT.md`.

Do not confuse this surface with the internal **Office Lending Hub**, which is
authenticated staff-side and is described in the rest of D24.

### D24.1 — Office Lending Hub (internal, authenticated)

- Use borrower labels only when they match accepted identity vocabulary.
- V-10 requires suggestive item search backed by the real catalog.
- V-12 adds clear lending search/filter language above the loans table.
- Selecting a loan reveals record context and permitted lifecycle actions; remove detached action walls.
- Distinguish request, approval, release, return, late, damaged, missing, discrepancy, and unresolved states without color alone.
- Summarize item, quantity, borrower context, dates, and constraints before confirmation.
- V-09 preserves loan notes unless a contract-usage search proves them redundant.
- V-14's three-hour reminder is unavailable until the scheduler/email contract is accepted and proven.
- Preserve custody, inventory, history, and authorization semantics.

## D25 — Release Desk

- Reviewed or ready-for-release work is the primary queue.
- Add clear search/filter language using authorized identifiers.
- Open physical release from the selected ready record in an accessible contextual dialog or task.
- Prefill Request Ticket ID, selected lines, and known identity.
- Revalidate stale revision and authorization at submit.
- Refresh only after service-confirmed success.
- V-23 handoff-image upload is CONTRACT-GATED by protected R2/media rules.
- V-26 forbids removing recipient confirmation until accepted custody/evidence policy proves it redundant.
- Do not expose a detached release wall or imply completion before the service confirms it.

## D26 — Restocking / Procurement / Events

### Restocking

Center the view on restock requests. Expose Restock an Item only when capability permits. Preserve receive-to-ledger behavior, quantity units, history, and authorization.

### Procurement

Provide deliberate switchable views for canvassing, suppliers, deliverables, and receiving without losing sequence or state. Preserve accepted transition rules and permissions.

### Events

New Event appears only under exact capability rules and after create/series/day/activity behavior is verified. Event media and public-current-event presentation remain separate from operational event records. Do not infer a public event campaign from an internal event entity.

## D27 — Administration / Governance

- Preserve every accepted production administration function; route/capability inventory must have zero unexplained omissions.
- Administration and Governance are operational, not decorative settings dashboards.
- Actions are role-aware and server-authorized.
- Staff information uses only authorized protected identity fields.
- V-29 requires a protected roster/identity contract and explicit field/role denial tests; no Google write is authorized.
- Bulk actions expose scope and consequence.
- Audit, revision, environment health, access management, and system-owner functions remain truthful to current services.
- DESIGN.md summarizes visual treatment only; it does not replace governance or security authority.

## D28 — Public / Authentication

Public surfaces include landing, request/lending intake and tracking, account application/status, policy, portal navigation, and staff sign in.

Authentication rules:

- Keep one direct, accessible form with persistent labels and correct autocomplete.
- Avoid decorative content pushing the form below the fold on mobile.
- Recovery copy is plain and non-enumerating.
- V-03's 8-digit reset flow is CONTRACT-GATED by a complete auth/provider contract.
- Label the approved USC work/institutional email clearly.
- Preserve backend authentication, session, CSRF, rate-limit, lockout, recovery, and provider behavior.
- Do not imply a recovery or support capability the runtime does not provide.
- Current Figma nodes: production sign in 34:4 and Playground sign in 34:19.

## D29 — Loading / Empty / Error / Stale States

Every module designs these states explicitly:

- Loading: stable layout, meaningful skeleton/progress, no focus trap, no fake data.
- Empty: what is empty, why it may be empty, and the next valid action.
- Filtered empty: distinguish no matches from no records.
- Error: what failed, what remains safe, and the next recovery action; no stack traces or secrets.
- Stale/conflict: explain that data changed, preserve safe input, refresh/reconcile before retry.
- Permission-limited: distinguish role denial from missing data or failure without leaking resource details.
- Degraded/offline: never imply a write succeeded without service confirmation.
- Success: confirm the exact completed action without promising downstream work.

Use inline feedback for local scope, banners for page scope, and toasts only for brief non-critical confirmation.

## D29.1 — Narrow-width strategy, per table — BINDING

Verified against `runtime.js` at `c316e047`. Production authors **six**
`desktop-table` tables, each already paired with a `.mobile-cards` variant. The
mechanism exists; what was missing was a declared decision per table about what
must stay *comparable* when the columns collapse.

Cards are not the automatic answer. A table exists so a reader can compare rows;
a card stack destroys exactly that. For each table below, the **comparison key**
is the one value a reader scans down the column for, and it must remain
scannable at 320px — same position in every card, same alignment, not buried in
prose.

| Table | Comparison key at narrow width | Identity | Kept in the card | Moved to detail |
|---|---|---|---|---|
| Request review queue | **lines awaiting a decision** | Request ID + purpose | status chip, requester, line count, Review lines action | department, timestamps |
| Inventory | **Available to Promise** | Product + Product ID | on hand, reserved, ATP as one numeric row; status/reorder chip | provenance, movement, evidence |
| Restock requests | **status** | Item + catalog | requester, requested/needed date, actions | assignment, evidence |
| Restock log | **received quantity** | Item + received date | source | evidence |
| Deliverables | **status / budget** | Event / Request + item | inventory source, receiving | assignment |
| Canvass library | **price** | Reference / item + supplier | receipt / TIN, checked | links, notes, evidence |

Three rules follow:

1. **Numbers that get compared stay in a numeric row**, aligned, in the same
   card position every time. Inventory's on hand / reserved / ATP triple is the
   clearest case: split across three prose lines it stops being comparable.
2. **The action that resolves the row travels with it.** A card that drops
   "Review lines" or "Confirm handoff" forces a round trip through detail to do
   the one thing the queue exists for.
3. **What moves to detail must be genuinely secondary** — provenance, audit,
   evidence, long notes. Anything a reader sorts or filters by is not secondary
   and stays on the card.

Overdue and short-stock states must remain distinguishable without colour at
every width, per D-11.

## D30 — Brand Media / Web Assets

### Runtime-tracked assets

| Asset ID | Repo path | Purpose / users | SHA-256 | Status |
|---|---|---|---|---|
| WEB-001 | src/visual/brand-assets.js | Runtime brand route definitions including favicon, USC/DOL marks, and login background delivery | 47f66bacbe2fb18850631b8c61386b85284d90d9740c7835d36b0edf26298a7f | CURRENT runtime source; do not move |
| WEB-002 | prototypes/impeccable-whole-site-redesign-v5/assets/fonts/bricolage-grotesque-700-latin.woff2 | Display headings | 4c373ce3c1cca41c864eb3e27c059a59fc6310547ab9c9b6cd780d387ba24206 | CURRENT visual-authority asset |
| WEB-003 | prototypes/impeccable-whole-site-redesign-v5/assets/fonts/ibm-plex-sans-latin.woff2 | Body, data, forms, navigation | e2291e842cf5af167122a22881a740c7f2dda7716f1e8cd76680264f4a859470 | CURRENT visual-authority asset |
| WEB-004 | prototypes/impeccable-whole-site-redesign-v5/assets/fonts/newsreader-600-latin.woff2 | HAU-USC wordmark | 05c91a26d19a61eafe7ce8e0b77eff3fd279ce994dc89f432f4cd06784935e84 | CURRENT visual-authority asset |
| WEB-005 | prototypes/impeccable-whole-site-redesign-v5/assets/images/hau-campus-login-background.jpg | Campus hero/login background | 216c68f83eba38ab785455481da28b53543fc40ec30de1f4dd18984ad3aa1ce0 | APPROVED in visual authority; confirm runtime use/license |
| WEB-006 | output/design/v5-production-acceptance/ | Exact candidate visual acceptance evidence | See Git-tracked file hashes | REFERENCE evidence, not runtime source |
| WEB-007 | public/assets/ | Runtime public asset entry point | Directory | CURRENT; inspect imports before changes |

Do not move or rename runtime assets merely for organization. Generated screenshots are evidence, not production media.

### Official media registry

No verified standalone local copy of the current USC profile image, cover image, event visual, or official mark binary was added to the vault during this consolidation. The official HAU profile and its listed social links are recorded in D02. Runtime-served marks remain at their legitimate source path. Any future official binary needs source URL, capture date, usage permission, hash, and canonical local copy before being labeled OFFICIAL.

## D31 — Current USC Event Media Direction

Status: CONTRACT-GATED / NOT CURRENTLY VERIFIED.

No current official USC event post or directly reusable event asset was verified on 2026-08-13. Therefore:

- do not render a current-event module as fact;
- do not reuse old event media as current;
- do not treat internal event records as public campaign approval;
- do not use AI-generated media as official documentation;
- omit the module or show an explicitly non-production placeholder until verified.

A future current-event record must include source URL, official publisher, event/date context, captured date, usage rights, canonical local copy, SHA-256, expiry/review date, route placement, and owner approval.

## D32 — Owner Annotations V-01–V-42

This normalized registry is sufficient for normal retrieval. Open the 69-page PDF or a V-ID crop only when a record is disputed, ambiguous, or needs visual provenance.

| V-ID | Owner intent | Route / module | Current design rule | Contract gate | Current Figma target | Implementation note | Status |
|---|---|---|---|---|---|---|---|
| V-01 | Make normal routes production-like with one primary task and no persistent demo/module walls; retain truthful private Playground identity. | Shell / all normal routes | Contextual task surface; no preview chrome | Existing environment contract | Capture Index; route-specific recapture | Deny production markers in Playground | CURRENT |
| V-02 | Replace recovery jargon with plain action-oriented language without revealing security internals. | Authentication | Plain language plus non-enumeration | Existing auth policy | Sign in 34:4 / 34:19 | Copy and denial tests | CURRENT |
| V-03 | Reset flow proposes email, new password, confirmation, 8-digit code, and service-confirmed completion. | Authentication recovery | Show unavailable until full service exists | Critical auth/provider contract: entropy, storage, TTL, resend, attempts, rate limit, session/CSRF, audit, email | Sign-in family; new target unverified | Stop without accepted contract | CONTRACT-GATED |
| V-04 | Label and explain the approved USC work/institutional email clearly. | Public/auth | Clear field purpose and privacy | Accepted identity vocabulary | 34:4 / 34:19 | Copy, validation, privacy review | CURRENT |
| V-05 | Improve USC/DOL lockup blending, scale, spacing, and contrast using approved assets. | Landing/auth/shell | Preserve mark roles and proportions | Approved asset source | Landing 34:2 / 34:16; sign in 34:4 / 34:19 | Light/dark/responsive asset audit | CURRENT |
| V-06 | Use USC Staff/Officer when it matches accepted borrower identity vocabulary. | Lending | Use mapped domain label only | Lending contract vocabulary | 34:13 / 34:24 | Copy plus contract test | CONDITIONAL |
| V-07 | Use Student ID No. for the appropriate borrower reference field. | Lending | Map label to real stored field | Field mapping and persistence contract | 34:13 / 34:24 | API/persistence test | CONDITIONAL |
| V-08 | Use Contact Number and preserve validation/privacy rules. | Lending/forms | Plain label, governed handling | Existing protected-data rules | 34:13 / 34:24 | Validation and privacy review | CURRENT |
| V-09 | Remove loan notes only if no accepted workflow, audit, or export requires them. | Lending | Retain unless usage search proves redundancy | Workflow/audit/export dependency | 34:13 / 34:24 | Contract usage search and regression | CONDITIONAL |
| V-10 | Add suggestive inventory-item search with keyboard selection and real catalog results. | Lending/inventory | No mock results; accessible combobox | Real catalog API/service | 34:13 / 34:24 | Mobile, keyboard, integration tests | CONTRACT-GATED BY EXISTING SUPPORT |
| V-11 | Collapsed navigation presents the approved DOL mark compactly without losing route, focus, or accessible name. | Shell/navigation | Compact rail retains context | Approved DOL asset | Capture Index; shell node unverified | Shell snapshots and keyboard test | CURRENT |
| V-12 | Add clear lending search/filter language above the loans table. | Lending | Visible search scope and filters | Existing query semantics | 34:13 / 34:24 | Filtered-empty tests | CURRENT |
| V-13 | Selecting a loan reveals context and permitted lifecycle actions; remove detached action walls. | Lending | Actions attach to selected record | Capability and lifecycle contract | 34:13 / 34:24 | DOM/API and inspector evidence | CURRENT |
| V-14 | Due reminder is proposed exactly three hours before due time. | Lending/reminders | UI says unavailable until proven | Scheduler/email: timezone, retry, dedupe, cancellation, audit, provider | New target unverified | Stop without accepted contract | CONTRACT-GATED |
| V-15 | Show actual server-authorized Playground version/candidate identity safely. | Shell/environment | Server authority only | Deployment identity contract | Capture Index | Spoofing-denial assertion | CURRENT CONSTRAINT |
| V-16 | Rebalance Overview panel sizes around operational importance. | Overview | Asymmetric hierarchy | Real content/data | Internal overview node unverified | Responsive real-content matrix | CURRENT |
| V-17 | Remove detached Request Center authorized-operations wall after contextual replacements are verified. | Request Center | Selected-record actions replace wall | Capability parity | 34:11 / 34:21 | Workflow regression and absence assertion | CONDITIONAL |
| V-18 | Make Request Center intake queue the dominant surface. | Request Center | Queue first | Existing queue contract | 34:11 / 34:21 | Desktop/mobile data-state evidence | CURRENT |
| V-19 | Attach review, fulfil, update, route, reserve, and release actions to selected request/line by capability. | Request/Release | Contextual authorized actions | Cross-module capability rules | Request 34:11 / 34:21; release target unverified | Flow plus authorization denials | CURRENT CONSTRAINT |
| V-20 | Replace detached physical-release form with a contextual task/dialog from a selected ready record. | Request/Release | Accessible contextual dialog | Existing release service | Request 34:11 / 34:21; release target unverified | Focus/cancel/submit/refresh tests | CURRENT |
| V-21 | Make reviewed/ready-for-release work the Release Desk primary queue. | Release Desk | Ready queue first | Queue projection/reconciliation | Release target unverified | Projection tests | CURRENT |
| V-22 | Add clear release search/filter language and authorized identifiers. | Release Desk | Visible scope and privacy-safe identifiers | Query/privacy contract | Release target unverified | Search and filtered-empty tests | CURRENT |
| V-23 | Handoff-evidence image upload must use protected governed media. | Release Desk/media | Do not implement as local/public upload | Critical R2/privacy: MIME/size, malware, metadata, retention, access, encryption, deletion/restoration, audit, preview, redaction | Request 34:11 / 34:21; upload target unverified | Stop without accepted contract | CONTRACT-GATED |
| V-24 | Prefill release task from selected ticket/lines; never re-enter known identity. | Request/Release | Bind selected record and lines | Revision and tamper rules | Request 34:11 / 34:21 | Stale-revision and tamper tests | CURRENT |
| V-25 | Use concise labels including Request Ticket ID and a clear ready-line selector. | Release Desk | Plain mapped labels | API mapping | Release target unverified | Copy and mapping test | CURRENT |
| V-26 | Remove recipient-confirmed-handoff only after custody/evidence policy proves it redundant. | Release Desk | Retain until policy decision | Separate custody/evidence policy | Release target unverified | Release safety and audit regression | CONTRACT-GATED |
| V-27 | Center restocking on restock requests and expose Restock an Item when capability permits. | Restocking | Queue plus contextual create | Restock capability | Internal target unverified | Lifecycle and ledger tests | CURRENT CONSTRAINT |
| V-28 | Provide deliberate switchable views for canvassing, suppliers, and deliverables without losing sequence/state. | Procurement | Stateful tabs/views | Procurement transitions | Internal target unverified | Transition and responsive tests | CURRENT |
| V-29 | Create practical staff information using authorized protected identity fields only. | Administration | Minimum authorized roster fields | Protected identity/roster contract; no Google write | Internal target unverified | Role/field denial tests | CONTRACT-GATED |
| V-30 | Preserve every accepted production administration function. | Administration | Zero unexplained omissions | Existing route/capability inventory | Internal target unverified | Inventory diff | CURRENT INVARIANT |
| V-31 | Make sidebar/drawer collapsible and persistent per device without hiding location/focus. | Shell/navigation | Accessible persistent rail state | Accepted local preference mechanism | Capture Index; shell target unverified | Keyboard, viewport, reload tests | CURRENT |
| V-32 | Animate Navigate control to explain expansion/selection while preserving reduced motion/performance. | Shell/motion | Motion explains state | Existing control behavior | Capture Index; control target unverified | Motion trace and focus continuity | CURRENT |
| V-33 | Add New Event under exact capability rules. | Events | Contextual action only when authorized | Event create/series/day/activity capability | Internal target unverified | Lifecycle tests | CONTRACT-GATED BY CAPABILITY |
| V-34 | Profile bio and portrait upload require private governed media and retention. | Profile/media | Fallback only until contract exists | Private media/privacy contract; no implicit public-brand reuse | Account 34:7 production only | Stop without accepted contract | CONTRACT-GATED |
| V-35 | Enlarge account area for portrait and identity without crowding shell. | Profile/shell | Stress-safe identity area | V-34 must be satisfied for uploads | Account 34:7 production only | Long-name/role/fallback captures | CONDITIONAL |
| V-36 | Theme transition covers the whole page with no flash or mixed-theme frames and honors reduced motion. | Global theme | Coherent atomic theme state | Existing theme persistence | All relevant captured routes | No-FOUC and reduced-motion tests | CURRENT |
| V-37 | Increase masthead logo-pair scale/spacing while preserving proportions. | Landing | Approved lockup geometry | Approved assets | 34:2 / 34:16 | Responsive visual acceptance | CURRENT |
| V-38 | Use approved USC transparent hero mark only; no DOL mark or white matte in hero slot. | Landing hero | USC-only transparent hero mark | Approved USC asset | 34:2 / 34:16 | Transparency/background tests | CURRENT |
| V-39 | Correct grammar, capitalization, and institutional naming. | Landing/copy | Owner-approved institutional strings | Owner copy approval | 34:2 / 34:16 | Snapshot/string tests | CURRENT |
| V-40 | Strengthen landing hierarchy, hero lockup, rhythm, first fold, and scroll continuity within v5 DNA. | Landing | Preserve v5, improve hierarchy | Accepted v5 authority | 34:2 / 34:16 | 320/390/768/1024/1440 light/dark | CURRENT |
| V-41 | Reproduce and repair mismatched/broken color state; do not guess from screenshot. | Landing/theme | Diagnose token/cascade after reproduction | Confirmed defect required | 34:2 / 34:16 plus exact runtime capture | Regression and exact visual test | BUG-FIX GATE |
| V-42 | Fix scrolled masthead/hero overlap with stable stacking/spacing. | Landing/scroll | Explicit sticky/stacking contract | Existing shell behavior | 34:2 / 34:16 | Scroll, zoom, text-resize evidence | CURRENT |

Provenance: design-vault/owner/source-instructions/playground-overhaul-v1-owner-packet.md, design-vault/owner/annotations/playground-overhaul-v1-design-and-annotations.pdf, and design-vault/owner/annotations/v01-v42/.

## D33 — Contract-Gated Design Concepts

Design intent is not permission to invent services.

| Concept | V-ID | Required accepted contract before implementation | Safe current treatment |
|---|---|---|---|
| 8-digit reset flow | V-03 | Auth/provider security, lifecycle, rate limit, session/CSRF, audit, email | Keep current recovery behavior; plain copy only |
| Three-hour due reminder | V-14 | Scheduler, timezone, retries, dedupe, cancellation, provider, delivery audit | Mark unavailable or omit |
| Protected handoff evidence | V-23 | R2/media validation, access, encryption, retention, deletion/restoration, preview/redaction, audit | No upload control |
| Remove recipient confirmation | V-26 | Custody/evidence policy and audit proof | Retain accepted control |
| Protected staff information | V-29 | Identity/roster fields, role access, privacy, source authority | No invented roster and no Google write |
| Profile bio/portrait | V-34/V-35 | Private media access, retention, deletion, fallback, privacy | Use approved fallback; no upload |
| New Event | V-33 | Exact create/series/day/activity capability | Hide/disable truthfully |
| Optional 3D | D14 | Accepted scope, license, performance, accessibility, privacy | Complete 2D experience |

If a visual request appears to need backend work, preserve current behavior, record the gap, and stop that concept. Never route around a contract with mock data or client-only enforcement.

## D34 — Research Synthesis

Research is distilled into actionable rules; source documents remain REFERENCE.

| Source family | Principle | HAU-USC adaptation | Where used | Rejected |
|---|---|---|---|---|
| 21st.dev | Reusable, stateful interaction patterns | Build semantic primitives with finite variants | Shell, forms, status, dialogs | Copy-pasted novelty components |
| Awwwards | Strong editorial hierarchy and pacing | One dominant purpose, confident USC identity, controlled landing rhythm | D18, D20 | Cinematic delay, unreadable art direction |
| Codrops | Motion can clarify spatial/state relationships | Use restrained reveal, navigation continuity, and reduced-motion equivalents | D13, D19 | Cursor tricks, perpetual motion, task obstruction |
| Magic UI | Small effects can reinforce emphasis | Scarce, bounded accents tied to real state | D08, D13 | Glow-heavy component walls |
| Mobbin | Familiar task flows reduce cognitive load | Conventional forms, lists, detail, confirmation, recovery | D21-D29 | Consumer-app patterns that weaken institutional context |
| SaaSFrame | Product shells benefit from consistent navigation and density | Stable rail/topbar, contextual actions, readable operational tables | D19-D27 | Generic KPI dashboards |
| Spline | Spatial media can support storytelling | Optional public enhancement with complete 2D fallback | D14, D18 | 3D-dependent workflows |
| Recent design DNA / premium-site research | Editorial type, asymmetric composition, restrained glass | Institutional Logistics Ledger with warm paper, oxblood, gold, localized depth | D07-D10, D18-D20 | Glass everywhere, beige-on-beige, decorative lines |
| Figma workflow research and live metadata | Durable IDs and capture registry reduce drift | Record file key, page/section/node IDs, status, recapture rule | D05, D32, D36 | Stale Page 10 assumptions |
| Owner PDF transcripts | Large packets need bounded searchable summaries | D32 normalizes V-IDs; transcripts remain source evidence | D04, D32 | Reopening 69 pages for routine tasks |
| YouTube transcript research | No separately verified current project transcript was found | Do not invent a source; add only when verified and distilled | Future D34 update | Unattributed video claims |
| Typography research | Distinct display/body/wordmark roles support hierarchy | Bricolage Grotesque, IBM Plex Sans, Newsreader | D09 | Multiple decorative display voices |

Source directory: D:/Documents/Codex/HAU-USC Logistics/design-vault/research/external/design-dna-2026-08-10/.

## D35 — Reference Patterns Adopted / Rejected

### Adopted as CURRENT

- Institutional Logistics Ledger narrative.
- Strong editorial hierarchy with one primary task.
- Asymmetric Overview layout.
- Warm paper, oxblood structure, scarce gold.
- Localized premium glass on earned elevated layers.
- Bricolage Grotesque, IBM Plex Sans, and Newsreader role separation.
- Contextual record actions instead of detached action walls.
- 2D authority with optional spatial enhancement.
- Purposeful motion with reduced-motion parity.
- Desktop/mobile/theme/state acceptance matrices.
- Official-media provenance and no fabricated events.

### Rejected or constrained

- Persistent demo/module walls.
- Generic equal-card dashboards.
- Glass everywhere, ornamental glow, and decorative lines.
- Fake metrics, mock catalog results, or invented official content.
- 3D-, hover-, animation-, or image-dependent operational meaning.
- Client-only authorization.
- Unverified Figma mappings.
- AI-generated media labeled official.
- Backend/provider/media behavior introduced through interface design.
- Removing fields or custody controls without dependency proof.

Historical v2-v4 screenshots and earlier mockups remain REFERENCE evidence. The accepted v5 authority supersedes conflicting visual direction.

## D36 — Figma-to-Code / Implementation Constraints

### Source and candidate rules

- Translate accepted design into real source, not generated HTML.
- Visual authority: prototypes/impeccable-whole-site-redesign-v5/.
- Functional authority: deployed production and current source.
- Keep UI/copy adaptation in the intended source/runtime adapter.
- Regenerate derived output through repository scripts.
- Preserve strict functional and generated-artifact parity.
- Never weaken tests to accept visual drift.
- Verify exact routes, role/capability behavior, state semantics, privacy, accessibility, responsive layout, themes, and visual evidence.
- Figma frames are design targets, not runtime contracts.
- Recapture before implementation when a node may be stale.
- Figma-only sessions are repository read-only unless separately authorized; accepted decisions require a handoff and later DESIGN.md reconciliation.
- Claude Code can use this file directly; tool-specific steps are labeled below.

### Future prompt bootstrap

~~~text
HAU-USC DESIGN CONTEXT

Repository:
https://github.com/invicta-ctrl/hau-usc-logistics-management-system

Canonical design authority:
D:/Documents/Codex/HAU-USC Logistics/worktrees/spec-v073-frontend-design-integration/DESIGN.md
https://github.com/invicta-ctrl/hau-usc-logistics-management-system/blob/frontend-design-integration/DESIGN.md

Canonical local Design Vault:
D:/Documents/Codex/HAU-USC Logistics/design-vault

Canonical Figma:
https://www.figma.com/design/hXJElH4p72KfgAaoUyfNOC/

Production:
https://logistics.hausc.org/

Isolated Playground:
https://playground.hausc.org/

Future USC umbrella concept:
https://hausc.org/ — concept only

Context rule:
Read live governance. Use lean-ctx against DESIGN.md and retrieve D00 plus
only the Dxx sections relevant to the task. Open heavy PDFs or images only
when DESIGN.md points to them for unresolved visual or source verification.
Do not ask the owner to re-upload indexed sources.
~~~

### Retrieval protocol

Normal design task:

1. Read AGENTS.md and live repository governance.
2. Codex: use lean-ctx on DESIGN.md.
3. Claude Code: use available bounded search/read tooling on DESIGN.md; prefer lean-ctx when installed.
4. Retrieve D00 plus only the relevant Dxx sections.
5. Resolve the linked vault or runtime asset path.
6. Open only the needed visual/source asset.
7. Work within the accepted specification.

Do not load all of DESIGN.md by default, open every PDF, load the full 69-page annotation source, rescan all research, search random worktrees, or ask the owner to re-upload indexed files.

Exception: an explicitly authorized full design audit or consolidation may load broader context.

Suggested lean-ctx anchors:

Required test-query aliases: landing page design -> D18; Profile design -> D21; Request Center design -> D23; 3D rules -> D14; motion rules -> D13; official USC media -> D30-D31; V-23 -> D32-D33.

| Need | Anchor |
|---|---|
| Landing page design | D18 or Public USC-Wide Landing Vision |
| Profile design | D21 or Profile |
| Request Center design | D23 or Request Center |
| 3D rules | D14 or 3D / Spatial Design Rules |
| Motion rules | D13 or Motion / Interaction |
| Official USC media | D30-D31 |
| V-23 | V-23 in D32, then D33 |
| Heavy PDFs | D04 |
| Figma nodes | D05 |

## D37 — Current Design Status

| Field | Current value |
|---|---|
| Consolidation mode | LOCAL-ONLY |
| Branch | frontend-design-integration |
| Starting commit/upstream | 908653dc956c9ccffa68ac0b350fc23b69f053ea |
| Starting Git tree | 3b1d21bb77b4d41e5190a998e4be60143235cd10 |
| Consolidation commit | `429847e` on `frontend-design-integration`, pushed 2026-08-20. The earlier LOCAL_ONLY_NOT_COMMITTED value described the 2026-08-13 local-only task and had gone stale. |
| Consolidation Git tree | Committed; see `git rev-parse 429847e^{tree}` |
| GitHub synchronized | Yes — `origin/frontend-design-integration` at `429847e` |
| Accepted visual authority | v5 prototype for structure; `scripts/design/theme-source.mjs` for every colour, surface, background and glass value (D41) |
| Functional authority | Deployed production and current source |
| Figma | MUTATED. 28 pages, 8 variable collections, 102 components. Theme synced from `scripts/design/theme-source.mjs` on 2026-08-20: 6 surface/ink primitives retuned, 4 variables created (`paper/overlay`, `color/border/control`, `color/selected-line`, `color/focus/ring-contrast`), 4 glass saturation variables created, glass recipe and background fields updated. Gold and oxblood ramps verified **unchanged** by the sync report. See D05, D41 and docs/design/FIGMA_DESIGN_MAKE_AUDIT.md. |
| Figma Make | EXISTS and is READ-VERIFIED at Version 36, file `rP9W9MQlZkyQrUx38TVsFS`. The former "NOT APPLICABLE / no Make project exists" record was **stale and wrong** — it described a toolchain limitation, not the file. v36 edited exactly two files (`LendingHubRoute.tsx` +23/-3, `ReleaseDeskRoute.tsx` +2/-1), both labelled "Fix TypeScript build error". `PublicFlows.tsx` at v36 is byte-identical to the committed source (lines 1-789 = 50,587 chars, FNV-1a `d7cb6c66`) plus one trailing comment line. Make still carries its own palette and is the one surface not yet on the canonical theme — see D41 and the residual in docs/design/DESIGN_EXECUTION_TRACKER.md. |
| Vault | 228 files, 48,323,048 bytes, root hash in D04 |
| V-ID registry | 42 of 42 present |
| Legacy design docs | None deleted; classified REFERENCE/HISTORICAL |
| Runtime code/assets | Not modified by this consolidation |
| Pre-existing r2 working changes | Preserved; not validated or claimed complete here |
| Production / Playground | Both reachable with HTTP 200 on 2026-08-13; not mutated |

The branch-local previous task was complete and its writer lock released before this documentation task. User authority narrowed execution to local files, so commit, push, PR, deployment, and external mutation were intentionally not performed.

Exactly one root DESIGN.md is active. Existing docs/design files, prototype notes, generated evidence, and vault sources are non-authoritative references unless an accepted specification independently requires them.

## D38 — v0.8.5 Reconciliation Rules

No accepted v0.8.5 design specification was found in this branch during consolidation. Therefore v0.8.5 is not claimed as current here.

If a future v0.8.5 work unit is accepted:

1. start from fresh repository and external-state truth;
2. identify the exact accepted specification, branch, commit, schema, and runtime markers;
3. diff route, module, role, data, authorization, privacy, ledger, and asset contracts against D06 and current source;
4. reconcile affected D-sections and V-IDs without silently importing stale assumptions;
5. keep D1 and backend contracts authoritative for inventory and ledger behavior;
6. preserve generated-artifact pipelines;
7. reproduce defects before patches;
8. keep unimplemented concepts in D33 CONTRACT-GATED;
9. update D37 and append D40 only with verified evidence.

Do not use the version label to authorize a migration, provider change, deployment, or design expansion.

## D39 — Future Department-Hub Architecture

Status: FUTURE CONCEPT.

HAU-USC may eventually present an umbrella experience in which Logistics is the current specialized hub and other departments gain distinct hubs. The concept should:

- preserve HAU-USC as the primary public identity;
- keep each hub's routes, permissions, data, and ownership explicit;
- reuse accessible shell, token, and interaction foundations;
- allow scoped brand expression without fragmenting the system;
- keep a complete 2D path;
- avoid suggesting that future hubs or https://hausc.org/ are deployed, owned, or approved.

No future domain, department, route, data model, navigation item, or 3D environment may be implemented from this concept alone. It requires product architecture, security/privacy review, proof strategy, accepted specification, and deployment authority.

## D41 — Theme System, Surface Ladders, Background Environment and Institutional Glass — BINDING

Single source: `scripts/design/theme-source.mjs`. It emits
`prototypes/shared/hau-theme.css` (both prototypes load it) and the payload that
syncs the Figma variable collections. Nothing else declares a colour. Rebuild
with `npm run design:theme`; `npm run design:theme:check` fails if the generated
files are stale.

This section exists because the same design system was being described in three
incompatible places. The public-portal prototype, the whole-site prototype and
Figma Make each carried their own palette; two of the three did not contain the
owner-locked gold. Values now have one home and one derivation.

### D41.1 — Values are declared as intent, not as hex

Every surface and text role is declared as a target **CIE L\***, a chroma and a
hue, and solved into sRGB. Three consequences that matter more than the hexes:

- one step up the ladder is the same *perceived* distance in light and in dark;
- `scripts/design/comfort-audit.mjs` measures rendered L\* on screen, so it is
  checking the same number this file asked for;
- retuning the ladder is editing five numbers, not forty.

### D41.2 — The surface ladder, and what each step is FOR

A hex tells an implementer nothing about where it may be used. This does.

| Step | Purpose | Light | L\* | Dark | L\* |
|---|---|---|---|---|---|
| `ground` | Environmental canvas. **Never** carries reading content. Furthest surface from the reader. | `#E5DAC7` | 87.4 | `#211615` | 8.6 |
| `inset` | A recess *inside* the work plane: filter bars, table headers, disabled regions. One step toward the ground. | `#EFE5D7` | 91.4 | `#291C1C` | 11.9 |
| `work` | The primary reading and operational plane. Tables, forms, records. Tuned first; everything else is positioned relative to it. | `#F7F1E8` | 95.4 | `#312222` | 15.0 |
| `raised` | Temporary elevation: floating cards, popovers, suggestion lists. One step away from the ground. | `#FBF6F0` | 97.1 | `#3B2A2A` | 19.0 |
| `overlay` | Dialogs, command palette, context panels. Furthest from the ground, smallest area, which is why it may be the brightest value in light mode. | `#FDFAF6` | 98.4 | `#433231` | 22.6 |

The ladder runs in the **same direction in both modes** — ground is always the
step furthest from the reader. Before this pass the dark `inset` sat *above*
`work`, so a filter bar read as a recess in light and as a bump in dark. It does
not any more.

**Neither end touches the extremes, deliberately.** Light stops at L\* 98.4 and
only dialogs use it; dark bottoms out at L\* 8.6. A pure-white sheet and a
pure-black field are the same failure pointing in opposite directions, and the
measured versions of both were present before this pass: the whole-site dark
ground resolved to L\* 1.8, and 34% of a dark viewport was effectively `#000`.

### D41.3 — Chroma runs opposite ways in the two modes

Light hue 80, chroma **decreasing** up the ladder: the cream lives in the
environment and the reading plane is near-neutral, so body copy and status
colour read true on it.

Dark hue 20, chroma **increasing** up the ladder: rising out of the ground reads
as moving toward the institution rather than toward grey.

### D41.4 — Text roles

| Role | Use | Light | Dark | On `work` |
|---|---|---|---|---|
| `text-primary` | Titles, table values, primary copy | `#342424` | `#F1E9E3` | 13.1:1 / 12.7:1 |
| `text-secondary` | Supporting copy | `#5B4A4A` | `#D5CAC6` | 7.4:1 / 9.5:1 |
| `text-muted` | Hints, meta, placeholders | `#716362` | `#ABA09F` | 5.1:1 / 6.0:1 |

Light ink is oxblood-charcoal, not `#000`: at 13:1 nothing is bought by going
blacker except glare. Dark ink is warm off-white, not `#FFF`, for the same
reason in the other direction. `text-muted` is solved against **`inset`**, the
hardest of the three planes, not against `work`.

Gold is never body copy. `accent-text` (`#7D5518` light, `#C9A45F` dark) is the
only gold that clears 4.5:1 as ink, and it is for eyebrows and emphasis.

### D41.5 — Borders, controls and focus

`border-subtle` and `border-default` are decoration and may be quiet.
`border-control` (`#7F7469` / `#8B7B7A`) and `selected-line` (`#76592F` /
`#C8AC7E`) are not: WCAG 2.2 1.4.11 needs 3:1 for anything identifying a control
or its state, measured against **every** surface the control can sit on — the
ground as well as the work plane. They are solved against the hardest of those.

Focus is a **two-part** token by design: a gold ring for identity plus
`focus-ring-contrast` (`#40070A` / `#FAF1DE`) carrying the 3:1, so the indicator
never has to choose between looking like HAU-USC and being visible.

Interactive targets meet WCAG 2.2 2.5.8 at 24x24 minimum, with the project's
practical goal of 44x44 applied wherever the control is standalone. Radios and
checkboxes are 24x24 controls inside a larger clickable label.

### D41.6 — Status

Hues are unchanged; they already pass and operators already know them. What
changed is that **dark status backgrounds are now solid values**, composited
once against the dark work plane instead of being alpha over whatever happens to
be behind. A status pill whose contrast depends on which panel it lands in is
not a status system. All five tones separate by hue and clear 6.6:1 in dark and
5.6:1 in light. Status is never carried by colour alone — every tone has a label
and a boundary line.

### D41.7 — Background environment

The ground is an authored environment, not a flat colour and not decoration:
three broad radial fields plus a ledger rule, fixed so it never repaints on
scroll, `aria-hidden` because it carries no information.

| Field | Job | Light alpha | Dark alpha |
|---|---|---|---|
| `anchor` | Oxblood weight, so the composition has a heavy corner | 0.10 | 0.16 |
| `decision` | Gold warmth where the eye should settle | 0.10 | 0.055 |
| `halo` | A lift that keeps the opposite corner from going dead | 0.40 | 0.26 |

Alphas are low on purpose. The previous generation ran `anchor` at 0.30 and
`halo` at 0.55, which reads as gradient blobs the moment you notice it. The test
is that **depth and warmth register before the gradient does**. The two rotated
"governed rails" were removed: at these alphas a hard rotated bar is the one
element that still reads as decoration rather than as environment.

Below 768 the ground drops to two fields and no pane noise.

### D41.8 — Institutional Glass, second generation

Fill, blur, edge and shadow are **one recipe per step**, not six independent
properties.

| Step | Fill alpha (light/dark) | Blur | Saturate | Use |
|---|---|---|---|---|
| G1 | 0.34 / 0.34 | 10px | 108% | Soft grouping |
| G2 | 0.52 / 0.50 | 14px | 112% | Operational panes |
| G3 | 0.66 / 0.64 | 18px | 116% | Raised records |
| G4 | 0.34 / 0.24 | 22px | 120% | Crystal focus — *decide here* |

**Fill went up and blur came down at every step.** G2 moved from 0.34/22px to
0.52/14px. A thin pane leans on heavy blur to stay readable, which is an
expensive way to buy what opacity gives free, and heavy blur is exactly what
makes glass read as frosted plastic rather than glass. The new recipe is more
legible *and* cheaper to paint.

G4 is the **only** step allowed a gold edge, because it is the only step that
means "decide here". Drawing every pane with a gold rectangle is how the accent
stops meaning anything.

**The modal scrim carries a different alpha per mode**, because the two modes
have opposite amounts of headroom. Light is 0.16 oxblood; dark is 0.34 near-black.
A single value cannot serve both: the previous hardcoded 0.55 washed the light
page deep maroon (content plane L* 89 down to 52) and crushed the dark one. In
dark mode focus comes from the overlay pane being 14 L* **brighter** than the
ground, not from burying the page — the same elevation-by-luminance rule that
governs the rest of the ladder.

**Where glass is allowed:** command palette and overlay, contextual inspector,
limited navigation treatment, Overview signature regions, public landing hero,
temporary elevated action surfaces.

**Where it is not:** inventory tables, staff request queue, release transaction
workbench, dense forms, record histories, high-risk confirmations, and every
Access/Admin control. Operational readability outranks expression. Measured: the
whole-site prototype carries **zero** `backdrop-filter` on Overview, Inventory
and Release Desk at all eight widths.

Body text, tables, inputs and quantities never sit on a transmissive pane — they
sit on `.on-glass`, a near-opaque layer, so contrast stops depending on what
drifts behind. Glass-inside-glass is disabled in CSS, not merely discouraged.

### D41.9 — Theme selection and transition

Precedence: **explicit user choice, then system preference**. The system
preference is followed *live*, not only at boot — reading `prefers-color-scheme`
once means someone who switches their OS to dark at dusk keeps the light theme
until they reload, which is the same defect as never reading it, only later. A
theme applied because the *system* changed is deliberately **not** stored, since
storing it would pin the theme and stop the preference being followed again.

Both prototypes resolve the theme in a **pre-paint inline script**. Without it
the document renders light for one frame and the module corrects it, which a
dark-preference visitor sees as a full-viewport white flash.

The transition is colour-only, one budget long (`--m-theme` 240ms), scoped to
elements that paint a surface, armed by a class that is then removed — so it
costs one transition and never slows an ordinary interaction afterwards. Layout
never animates. Under `prefers-reduced-motion: reduce` all durations collapse to
1ms and the theme change remains fully understandable.

### D41.10 — Responsive and performance rules

Desktop atmosphere is simplified below 768: two background fields instead of
three, no pane noise, and blur clamped to the G1 radius at every step. Measured
across 8 widths x 2 themes x 5 surfaces: zero horizontal overflow, zero clipped
panes, zero nested `backdrop-filter`, zero filter animation, blur area 0–33% of
the viewport against a budget of 130% narrow / 260% wide.

### D41.11 — Acceptance

WCAG 2.2 AA is the floor, not the target. Four gates, all measured:

| Gate | Command | Result |
|---|---|---|
| Token contrast, both themes | `npm run design:contrast` | 66/66 |
| Text over photography, gradients and glass | `npm run design:overlay` | 134/134 sampled runs, worst 4.87:1 |
| Visual comfort — glare, crush, chroma, brightness shock | `npm run design:comfort` | 88/88 across 11 surfaces including the command overlay, 5 by two named waivers |
| Responsive and paint cost, 8 widths | `npm run design:responsive` | 80/80 |

Comfort thresholds are this project's own bar and are **not** a substitute for
WCAG. Waivers are named in the script with a reason and printed in the report,
because a threshold nudged until everything passes is not a gate.

## D40 — Design Change Log

Append entries; do not rewrite history.

| Date | Source / owner instruction | Sections affected | Change and supersession | Figma impact | Implementation impact |
|---|---|---|---|---|---|
| 2026-08-09 | Accepted v0.7.3 frontend integration specification | D01, D06-D30, D35-D38 | v5 visual architecture accepted over conflicting older V4.1/V4.2 mock direction; production/current source retained as functional authority | v5 remains target authority | Frontend-only transfer with parity gates |
| 2026-08-13 | Design Authority Consolidation + Local Design Vault master prompt; user required local-only execution on frontend-design-integration | D00-D40 | Consolidated owner intent, research, paths, URLs, assets, Figma registry, V-01 through V-42, module rules, and retrieval protocol into one root authority; legacy docs demoted to reference; no remote sync claimed | Read-only metadata inspection; no write | Documentation and shared local vault only; runtime untouched |
| 2026-08-19 | Owner instruction: Claude isolated frontend-design stream (audit, research reconciliation, Hallmark/Impeccable, Figma + documentation update) | D05, D37, D40 | Reconciled the Figma registry against the live file: 28 pages, 120 variables, 102 components, MUTATED — the previous three-page Starter-plan/no-mutation record was stale. Recorded Figma Make as NOT APPLICABLE with the owner-approved local-prototype substitution. Added docs/design/FIGMA_DESIGN_MAKE_AUDIT.md and docs/design/FIGMA_BASELINE_REGISTER.md. | WRITE performed. Created semantic variable `color/accent/text` (VariableID:563:2) aliased to gold/700; rebound 46 text nodes on the five current R2 Overview light frames to repair a measured 1.52:1 WCAG 2.2 AA 1.4.3 failure. | None. No runtime, product, release, provider, or v0.8.3 file was modified. |
| 2026-08-19 | Owner instruction: production-to-Figma reconciliation of the public portals | D24, D40 | Added D24.0, the OWNER-LOCKED Public Lending no-login access model, verified against production 0.8.2 c316e047; split D24 into public and internal halves. Added docs/design/PRODUCTION_PORTAL_PARITY_AUDIT.md. | Superseded 4 frames that gated borrowing behind staff sign-in. Built the Public Lending portal: 1440 light and dark, Angelite branch, receipt, four declared catalog states, 390 mobile. Added semantic tokens color/accent/text and color/text/on-accent. | None. Product worktree read-only; no provider, database, or deployment writes. |
| 2026-08-19 | Owner instruction: continue with the unfinished work — Staff Request Center reconciliation | D23, D40 | Added D23.0 as BINDING: production's Request Center is a submission form with the review queue appended, gated on the request.review capability, with a per-line route decision and no pre-selected default (RV-01.6). Corrected the stale claim that the intake queue is the dominant surface. Added parity-audit sections 10-13 recording the context C and context B contracts, eight drift entries (SR-01..SR-08) and the SR-09 clipping defect. | Rebuilt the CURRENT decision panel 300:624 to a per-line route model with production vocabulary; corrected the prototype twin 329:1009; replaced two review-queue rows carrying statuses the queue cannot hold; added the full-height inspector evidence frame 603:137. All originals logged in the audit before edit. | None. Product worktree read-only; no provider, database, or deployment writes. |
| 2026-08-20 | Owner instruction: final visual refinement, theme comfort, Institutional Glass environment, usability closure and Codex handoff | D37, D41, D40 | Added D41 as BINDING: one generated theme source replaces three divergent palettes. Corrected the stale D37 claim that no Figma Make project exists. Light mode lost its pure-white planes (up to 54% of a viewport was effectively #FFF); dark mode lost its crush (up to 95% of a viewport at CIE L* <= 5, ground at L* 1.8). Surface ladders, background fields and the glass recipe re-derived from declared L* targets. Institutional Glass second generation: fill up, blur down at every step. | WRITE performed. Primitives, Semantic Color and Glass Material collections synced from theme-source.mjs; 7 variables created; gold and oxblood ramps verified unchanged, so the owner-locked #D4AF37 is untouched. Blur variables propagated to the four Material effect styles, keeping D-02 closed. | Design prototypes only. Both now load prototypes/shared/hau-theme.css. Product worktree untouched; no provider, database or deployment write. Figma Make read-verified but NOT modified. |

### Local/Git synchronization record

| Field | Value |
|---|---|
| LOCAL_DESIGN_MD_PATH | D:/Documents/Codex/HAU-USC Logistics/worktrees/spec-v073-frontend-design-integration/DESIGN.md |
| REPO_RELATIVE_PATH | DESIGN.md |
| GIT_BRANCH | frontend-design-integration |
| GIT_COMMIT | `429847e`; previous branch head `fb27c4e` |
| GIT_TREE | Committed at `429847e` |
| REMOTE_DESIGN_MD_URL | https://github.com/invicta-ctrl/hau-usc-logistics-management-system/blob/frontend-design-integration/DESIGN.md |
| REMOTE_SYNC | Yes — pushed 2026-08-20; local and remote both at `429847e` |

### Verification rule for future changes

Before declaring a design implementation complete, verify every acceptance criterion; source lint/static checks; focused and broader tests; generated output; route/contract parity; keyboard/focus; responsive/theme/reduced-motion behavior; visual states; privacy/placeholders; exact branch/commit/tree; and required continuation records. Report unrun checks and external uncertainty honestly. Stop before commit, push, Figma mutation, deployment, deletion, or the next milestone unless explicitly authorized.
