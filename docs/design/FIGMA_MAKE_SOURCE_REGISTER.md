# Figma Make Source Register

The point of this file: **the accepted Figma Make v39 source is recoverable from
Git.** A future session does not need to open Figma to recover the adopted state.

> **Corrected 2026-08-23 (R3-A1).** The original claim that "no MCP tool reads a
> `/make/` URL" is wrong. `mcp__figma__get_design_context` with `nodeId "0:1"`
> on a Make file key **does** return the project's source files as readable
> resource links (205 files for this project). What is genuinely impossible is
> *writing*: `mcp__figma__use_figma` rejects Make file keys outright. Make edits
> must go through the Make editor's code view in an authenticated browser.

```text
FIGMA_DESIGN_FILE        hXJElH4p72KfgAaoUyfNOC
FIGMA_DESIGN_BASELINE_ID DESIGN_BASELINE_2026-08-20-F
FIGMA_DESIGN_VERSION     content identity only; the bridge cannot name a native version
FIGMA_MAKE_FILE          rP9W9MQlZkyQrUx38TVsFS
FIGMA_MAKE_VERSION       Version 40 (R3-A1; previous 39) - see the R3-A1 section
                         v37 canonical theme + route adoption   5 files
                         v38 landing atrium pinned              1 file
                         v39 MK-06 scoped atrium palette pin    1 file
THEME_SOURCE             scripts/design/theme-source.mjs
THEME_GENERATOR          scripts/design/build-make-theme.mjs
ROUTE_GENERATOR          scripts/design/build-make-routes.mjs
MAKE_SOURCE_SNAPSHOT     output/design/make-adoption/   (v39 adopted state)
MAKE_ROLLBACK_SNAPSHOT   output/design/make-preservation/ (v36 captures)
MAKE_SOURCE_STATUS       RECOVERABLE_FROM_GIT
LIVE_PROVIDER_RECHECK    READ available via get_design_context; WRITE only via the
                         Make editor in a browser (see the correction above)
VERIFIED                 2026-08-21, sha256 recomputed from the working tree
                         2026-08-23 R3-A1: live version verified as 40 after full
                         reload, pending edits 0; output/design/figma-make-source/
                         refreshed to v40 with sha256 recorded per file below
FIGMA_MAKE_WRITES        1 saved (v40, 8 files - see R3-A1 section)
FIGMA_DESIGN_WRITES      R3-A1 reconciled the current-authority lane; see
                         .codex/R3_A1_FIGMA_MAKE_DESIGN_SYNC_RECEIPT.md
```

## 1. The v39 adopted source in Git

Hashes recomputed on 2026-08-21 from `output/design/make-adoption/`.

| Provider path                    | Repository path                                      |  Bytes | sha256                                                             |
| -------------------------------- | ---------------------------------------------------- | -----: | ------------------------------------------------------------------ |
| `src/styles/theme.css`           | `output/design/make-adoption/theme.css`              | 20,453 | `249857a93f0f90425504da286aab4a296445b4f74546e4fbff72dcf30663140d` |
| `src/app/PublicFlows.tsx`        | `output/design/make-adoption/PublicFlows.tsx`        | 50,829 | `755c6ed62916608e427eb9f65b5ecb4ea34258fedb1f8a02a3602e4f159aa23c` |
| `src/app/LendingHubRoute.tsx`    | `output/design/make-adoption/LendingHubRoute.tsx`    | 22,814 | `b1faac84ee52e69ef243db6e02d3f8a63b9143d1cb4b4664156beab387c4d0f8` |
| `src/app/ReleaseDeskRoute.tsx`   | `output/design/make-adoption/ReleaseDeskRoute.tsx`   | 21,914 | `f9584533cc7eb7cfff9dd153b26dce11a3c0eb2571bd91be75b9f9bfe513cc24` |
| `src/app/RequestCenterRoute.tsx` | `output/design/make-adoption/RequestCenterRoute.tsx` | 47,823 | `995704cc4dcd198d1d469dfe5e0b7c335003219080d6ca194c9657b1ce03943e` |
| `src/app/appRoutes.ts`           | `output/design/make-preservation/appRoutes.ts`       |  1,047 | `a0de837a820897207a5b1a0916654d2a42928d33dd58fc6240c7c1e65195af5c` |

**The `theme.css` hash matches the v39 identity recorded in
`DESIGN_BASELINE_2026-08-20-F` exactly.** That is the proof that the adopted
state is in Git and not only in the provider.

`appRoutes.ts` was **not** among the five files v37 changed and was untouched by
v38 and v39, so the v36 capture is the current version. It is filed under
`make-preservation/` rather than `make-adoption/` for that reason. This is
recorded here so nobody re-opens Figma to look for a "missing v39 appRoutes".

## 2. The v36 rollback baseline

Hashes recomputed 2026-08-21; each matches the value recorded in
`docs/design/FIGMA_DESIGN_MAKE_AUDIT.md` §9.1 and
`docs/design/FIGMA_MAKE_ADOPTION_PACKET.md` §1.

| Repository path                                                  |  Bytes | sha256                                                             | Role                                                                    |
| ---------------------------------------------------------------- | -----: | ------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| `output/design/make-preservation/theme.v36.css`                  |  9,419 | `50cb55de9d8e20ad0661cb187b295ea86621aaf2e29c7d8584dd7e159d833082` | Pre-adoption theme                                                      |
| `output/design/make-preservation/PublicFlows.tsx`                | 50,694 | `50c623013e35f64c93bf63415ed7e8d78b82089d9a106f513fcebac5e272191c` | v36 capture                                                             |
| `output/design/make-preservation/LendingHubRoute.tsx`            | 22,816 | `2132c68c06915a7acea4a43d7ae31c079a7b5c5ec039cc3c0529d6c738efa967` | v36 capture                                                             |
| `output/design/make-preservation/ReleaseDeskRoute.tsx`           | 21,957 | `7c92b4835aa95386d6ea2611caf9b5379e74b8b74e934d201c8624ac4a2c898e` | v36 capture                                                             |
| `output/design/make-preservation/RequestCenterRoute.unsaved.tsx` | 45,354 | `4087473ca337b510859bb841425bfd4548181b2847db62627b0ea79715d5b159` | **Third-party unsaved edit**, preserved byte-exact. Authorship UNKNOWN. |
| `output/design/make-preservation/index.css`                      | 27,878 | `281a620e29c20a75e83b3ebcdfca761cd3696da0677cd4ca7607cb89f5626b15` | v36 capture                                                             |
| `output/design/make-preservation/appRoutes.ts`                   |  1,047 | `a0de837a820897207a5b1a0916654d2a42928d33dd58fc6240c7c1e65195af5c` | Current; see §1                                                         |

## 3. Deterministic reconstruction — no Figma needed

The v39 delta is reproducible from committed sources. It is **not** a
Figma-only artifact.

| Repository path                                                          |  Bytes | sha256                                                             | Role                              |
| ------------------------------------------------------------------------ | -----: | ------------------------------------------------------------------ | --------------------------------- |
| `scripts/design/theme-source.mjs`                                        | 15,220 | `a5246678ff4b254012783fad2fb9f450b43811ceb024550ebbc70030c0b4f43f` | Canonical token source            |
| `scripts/design/build-make-theme.mjs`                                    | 14,105 | `e01f76d6aad666eed4e1a2194a5371283ca77b5b7b9b113a57b01fefbb42929b` | Generates the Make theme override |
| `scripts/design/build-make-routes.mjs`                                   | 16,327 | `cab88192ad93bbe9db6986c7d40617748964ca793d46c8da2e1f8989ce042fa9` | Generates the four route files    |
| `prototypes/public-portals-r3/figma-make/src/styles/theme-canonical.css` | 11,033 | `2542f712cd0de2c13eb8e1c64c56d6fccf4971e282c21a4f19ad882b1890ab2c` | Generated canonical override      |
| `prototypes/shared/hau-theme.css`                                        |  7,816 | `5922ec25b1ea185c93d2c6303180964a67c4b5d69fb2ed3a8331fbef6de73cba` | Generated canonical CSS           |
| `prototypes/public-portals-r3/figma-make/src/app/PublicFlows.tsx`        | 50,668 | `e688738412f09678a98289728b5779082cc0393f944efb0d29a6b4619dfe34de` | Committed working copy            |
| `prototypes/public-portals-r3/figma-make/src/app/StaffAccess.tsx`        |  2,900 | `e677be43345d38f0ced45b1e6b3124173556ac009801830092e1ddd2bd233939` | Committed working copy            |

Verification commands (from `docs/design/FIGMA_DESIGN_MAKE_AUDIT.md` §10):

```bash
node scripts/design/build-make-theme.mjs --check      # override is current
node scripts/design/verify-make-theme.mjs             # resolved cascade, both modes
node scripts/design/verify-make-landing-theme.mjs     # pinned chrome vs reading planes, 31/31
node scripts/design/theme-source.mjs --check          # canonical token source is current
```

**FI-00 correction.** The `design:*` npm aliases quoted in the historical design
records do **not** exist in the v0.8.3 `package.json`, which is now this branch's
build authority. Invoke the scripts directly, as above. All four commands were
re-run and pass on the FI-00 reconciled tree.

`node scripts/design/build-make-routes.mjs --check` is **unavailable**: it
imports `esbuild`, which is not a declared dependency in `package.json` on
either main or the pre-FI-00 branch. This is a pre-existing condition, not an
FI-00 regression. Adding the dependency is an owner decision for FI-01.

These scripts live in `scripts/design/`, which exists **only on
`frontend-design-integration`**. Frozen main has no `scripts/design/`. They
become runnable on main only if FI-00's owner decision promotes that directory.

## 4. Provider access reality

```text
Figma Design (hXJElH4p72KfgAaoUyfNOC)
  Readable via MCP: yes, in principle (get_metadata, get_screenshot, get_design_context).
  2026-08-21 read-only probe: get_metadata with no nodeId returned exactly one
  page, `0:1  00 — Capture Index`. The durable audit records 28 pages.
  Interpretation: the desktop bridge exposed a single loaded page. This is NOT
  evidence that the file changed. Recorded as UNVERIFIED, not as drift.
  Authenticated as Invicta-ctrl, "Earl Lawrence Adriano's team", Pro, Full seat.

Figma Make (rP9W9MQlZkyQrUx38TVsFS)
  Readable via MCP: NO. get_metadata, get_screenshot, and use_figma all exclude
  `/make/` URLs; create_new_file accepts only design, figjam, slides.
  This limitation is durable and was already recorded in the audit §4.
  A live re-check requires a signed-in browser session, which is how the v36 and
  v39 captures in §1 and §2 were obtained.

WRITES PERFORMED BY THIS PREPARATION: none. No save, discard, format, edit,
publish, rename, version, variable change, Make code change, or resolution of
another user's pending edit.
```

## 5. What a future session may and may not do

```text
MAY   read the Git copies in §1-§3 and treat them as the v39 visual authority
MAY   re-run the verification scripts in §3 to prove the cascade still resolves
MAY   port token VALUES and layout INTENT from these files
MAY   open Figma read-only if a slice needs evidence genuinely absent here

MUST NOT  import, compile, or bundle any .tsx file into the product
MUST NOT  hand-edit any generated file listed as GENERATED_EVIDENCE_ONLY
MUST NOT  mutate either Figma file
MUST NOT  resolve, save, or discard a pending third-party edit in Make
MUST NOT  treat a screenshot as a cascade diagnosis (DESIGN.md V-41)
```

## 6. Standing rules inherited from the design stream

Recorded because they were learned the expensive way, twice.

1. A node whose background cannot be resolved with confidence is **skipped**,
   never assumed. Gradient and image fills are not solid fills.
2. Bulk colour mutation is preceded by a dry run reporting counts and samples.
3. Verification screenshots are taken at **native resolution**. A 2× downscale
   hid a 283-node regression.
4. Original values are logged in full, not sampled, before mutation.
5. In Make, a save does not mint a version immediately. The reliable test that a
   change landed is a reload followed by a re-hash of the file, not the state of
   the pending-edits panel.
6. Preserve first. The reason the third-party `RequestCenterRoute.tsx` edit was
   recoverable after an accidental `Format code` click is that it had already
   been captured byte-exact.

## STALE_IF

```text
output/design/make-adoption/theme.css sha256 != 249857a93f0f90425504da286aab4a296445b4f74546e4fbff72dcf30663140d
docs/design/FIGMA_BASELINE_REGISTER.md gains a baseline after 2026-08-20-F
docs/design/FIGMA_DESIGN_MAKE_AUDIT.md gains a section after 10
scripts/design/build-make-theme.mjs or build-make-routes.mjs changes
a live Make reload reports a version other than 39, or pending edits != NONE
```

Cheap re-verification:

```bash
sha256sum output/design/make-adoption/theme.css
```

---

## R3-A1 — 2026-08-23 — public request reconciliation, SAVE NOT COMPLETED

```text
AMENDMENT               .codex/specs/accepted/2026-08-23-r3-a1-figma-make-design-sync-codex-preview-handoff.md
PREVIOUS_VERSION        39
CURRENT_VERSION         40   (SAVED AND VERIFIED after full reload)
PENDING_EDITS_BEFORE    NONE (verified on open, so nothing unknown was swept in)
PENDING_EDITS_AFTER     0    (verified after full reload)
FILES_CHANGED           8    (provider label: "8 edited files - Version 40")
SOURCE_SNAPSHOT         output/design/figma-make-source/ REFRESHED to v40
ROLLBACK_SNAPSHOT       unchanged (output/design/make-preservation/, v36 captures)
HASHES                  recorded below for all 8 changed files
FIGMA_MAKE_WRITE        AUTHORIZED_BY_R3_A1, APPLIED, SAVED AS v40
BEHAVIOUR_VERIFIED      public "Start a logistics request" -> PUBLIC REQUEST CENTER;
                        "Staff sign in" -> separate staff sign-in page
CODEX_ADOPTION_POINTER  .codex/CURRENT_HANDOFF.md
```

### Why this section exists

The v40 save landed, but the repository mirror has not caught up. Until it does,
this register records *what* changed; the authoritative description is the table
in `.codex/R3_A1_FIGMA_MAKE_DESIGN_SYNC_RECEIPT.md`.

### Changed provider files (all under `src/app/`)

`landing/HeroSection.tsx`, `landing/LandingPage.tsx`,
`landing/LogisticsHubSection.tsx`, `public/Footer.tsx`,
`public/PublicMobileDrawer.tsx`, `public/PublicNavbar.tsx`,
`AppRouteRenderer.tsx`, `PublicFlows.tsx`.

`useAppController.ts` was deliberately **not** changed: the Make prototype grants
`capabilities: [...AUTH_ROUTES]` and has no `capabilities.includes(target)` gate,
so FE-R3-002's capability-gate half has no counterpart there. Rationale is in the
receipt.

### Mirror refresh — DONE

All five provider steps are complete: the save landed as v40, pending edits are 0
after reload, both the public and staff paths were exercised in the live
prototype, and `output/design/figma-make-source/` now holds the v40 state.

#### The v40 mirror

Recomputed 2026-08-23 from `output/design/figma-make-source/`. Line endings are
LF, matching the existing capture convention for this tree (the rest of the
repository is CRLF; these are faithful provider captures).

| Provider path (`src/app/...`) | Bytes | sha256 |
| --- | ---: | --- |
| `landing/HeroSection.tsx` | 2,201 | `b94fc789464ea2baa937af12e1cdd604310dff5e625fdc9b0ead8c33518c52a8` |
| `landing/LandingPage.tsx` | 650 | `28aa373d3526b3a728a38b7aaae9dbccc65fca93f010088e4ad4f386a3fde78c` |
| `landing/LogisticsHubSection.tsx` | 6,235 | `3f83a62945cdb4c6c0458724ceb86c50a4be40a628ce44a1c673537113cfd745` |
| `public/Footer.tsx` | 4,313 | `9fd53415455c5732f8af42e2922eb1dd60ce1fb163f3c3b1f510930e14acb3ac` |
| `public/PublicMobileDrawer.tsx` | 4,560 | `2b5b19231bc9d235df7340c01534eea734224d7cb53d5e107d833341a2fe182f` |
| `public/PublicNavbar.tsx` | 3,879 | `d9f21032389b92da36d055963e222078b93fba2d94336417acf047a015386018` |
| `AppRouteRenderer.tsx` | 3,633 | `94922a20488ebb8ad84d96fc7b7db44a7443499ed8757a5ad9b029499197f57b` |
| `PublicFlows.tsx` | 46,303 | `3ab0ebb5bcab408f80fea9c71c4d8418e144e6ac5222878e8b16a4b0f196826f` |

The resulting Git diff is surgical — 8 files, 19 insertions and 29 deletions —
which is the exact shape of the R3 public-entry patch. A whole-file diff here
would have meant a line-ending or transcription error.

#### How each file was produced, and how far it is verified

Stated precisely so a later session does not over-trust this table:

- **Byte-verified against the provider:** `landing/HeroSection.tsx`. Re-read from
  `file://figma/make/source/rP9W9MQlZkyQrUx38TVsFS/...` after the save; the
  provider body is byte-identical to the mirror minus the terminal newline,
  provider sha256
  `556327163556ce208a0ffbc66eaa2eba8ac6a15ac31541d32e747cb88f6c153a`.
- **Structure-verified against the provider:** `landing/LandingPage.tsx`,
  `public/PublicNavbar.tsx`, `AppRouteRenderer.tsx` — each was read in full from
  the provider after the save and the mirror was produced to match, including the
  deliberate retention of `onRequireAuth` where the provider retains it.
- **Reconstructed and grep-verified:** `landing/LogisticsHubSection.tsx`,
  `public/Footer.tsx`, `public/PublicMobileDrawer.tsx`, `PublicFlows.tsx` — the
  identical edits were applied to the faithful v39 capture. Before editing, the
  capture's line numbers for every target matched the live file exactly
  (`PublicFlows` 20-22, 115, 120, 234), which is strong evidence the capture was
  in sync. These four were **not** re-read from the provider byte-for-byte.

If byte-exactness matters for the four reconstructed files, re-read them from the
provider and compare against the hashes above.

#### Retained `onRequireAuth`, deliberately

`LandingPage.tsx` (3 occurrences), `LogisticsHubSection.tsx` (3) and
`AppRouteRenderer.tsx` (1) still reference `onRequireAuth`. That is correct: the
Logistics-hub protected-tile seam survives for FI-04. Only the public request
path was detached from `requireAuth`.

### STALE IF

- a live Make reload reports a version other than 40;
- the pending-edit count is not 0;
- the four reconstructed files are re-read from the provider and any hash above
  turns out to differ.

---

## INTEGRITY DEFECT — recorded by R3-A1-A2, 2026-08-23

> **This register overstated the fidelity of the repository Make mirror.**

`output/design/figma-make-source/` contains **47 files with a literal
`…N tokens truncated…` marker embedded in the source text**. A file carrying that
marker is not a copy of the provider source — it is a truncated MCP read saved as
if it were one. None of those 47 files could compile.

Discovered while attempting to author the R3-A1-A2 Make changeset from the mirror:
`src/app/PublicFlows.tsx:415` reads

```
            …1184 tokens truncated…            const n = idx + 1;
```

The full list is in `.codex/R3_A1_A2_MAKE_MIRROR_TRUNCATION.txt`.

**What is and is not affected.**

- The **live Figma Make file is unaffected.** This is a defect in the repository
  mirror only. The provider still holds the real source at Version 40.
- The per-file `sha256` values already recorded here remain *accurate hashes of
  the mirrored bytes* — they simply hash truncated content. They are not evidence
  that the mirror matches the provider.
- R3-A1 recorded its eight changed files as "one byte-verified, three
  structure-verified against full provider reads, four reconstructed and
  grep-verified". `PublicFlows.tsx` is among the reconstructions, and it is
  truncated. The R3-A1 changeset table itself is unaffected and remains a correct
  description of what was applied live.

**Consequence for R3-A1-A2.** The mirror was rejected as a source of truth for
authoring Make edits. Live source is read from the Figma Make editor instead.

**Fixed by this pass** — see "RESOLVED" below. (Original note, written before the
fix: repairing all 47 files requires a full provider re-capture, which is its own
bounded task. Recorded as `FE-R3-015`.)

---

## RESOLVED — R3-A1-A2, 2026-08-24

`CURRENT_MAKE_MIRROR_TRUNCATION_MARKERS = 0`

The defect recorded above is fixed. The current mirror is no longer derived from
MCP reads at all — it is a byte-faithful provider export.

### What was done

1. The authenticated Figma Make code view's **"Download code"** export was taken
   at provider **Version 41**.
   Archive sha256 `b01a320fe149383ec548cf68049d81aa93ad9fc0e3a2636446a8002a292d42c8`.
2. Extracted verbatim to `output/design/make-provider-export-v41/`, with a
   per-file manifest at `output/design/make-provider-export-v41/MANIFEST.md`
   recording provider version, path, bytes, sha256 and a truncation check for
   every one of the **208** files.
3. `output/design/figma-make-source/` — the CURRENT mirror — was rebuilt from
   that export.

| | files | truncated |
|---|---:|---:|
| Old MCP-derived mirror | 200 | **47** |
| Current provider-export mirror | **208** | **0** |

### Status of the old mirror

```
SUPERSEDED — MCP RESPONSE TRUNCATION
NOT BYTE-FAITHFUL SOURCE AUTHORITY
```

It was replaced in place rather than kept alongside, because a truncated mirror
sitting next to a faithful one is a trap for the next reader. Its exact bytes
remain recoverable from git history — nothing was destroyed, and no historical
snapshot elsewhere in `output/design/` was rewritten.

### Fidelity evidence for the file this amendment changed

`src/app/PublicFlows.tsx` agrees three ways at
sha256 `165aa1c626775b0330f0b2bdb6dd30a70fe940d7bca753712172d903ee1c2765`:

| Source | Result |
|---|---|
| Live CodeMirror document in the editor | match |
| Preserved recovery artifact (`output/design/r3-a1-a2-make-recovery/`) | match |
| Provider "Download code" export at Version 41 | match |

### Verification-level language retired

The older per-file grading in this register — "byte-verified",
"structure-verified", "reconstructed and grep-verified" — described how confident
an MCP-read reconstruction was. That vocabulary no longer applies: every file in
the current mirror is a provider export byte. `FE-R3-015` is **CLOSED**.
