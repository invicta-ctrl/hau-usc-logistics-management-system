# Figma Make Source Register

The point of this file: **the accepted Figma Make v39 source is recoverable from
Git.** A future session does not need to open Figma, and cannot, because no MCP
tool reads a `/make/` URL.

```text
FIGMA_DESIGN_FILE        hXJElH4p72KfgAaoUyfNOC
FIGMA_DESIGN_BASELINE_ID DESIGN_BASELINE_2026-08-20-F
FIGMA_DESIGN_VERSION     content identity only; the bridge cannot name a native version
FIGMA_MAKE_FILE          rP9W9MQlZkyQrUx38TVsFS
FIGMA_MAKE_VERSION       Version 39 - pending edits NONE
                         v37 canonical theme + route adoption   5 files
                         v38 landing atrium pinned              1 file
                         v39 MK-06 scoped atrium palette pin    1 file
THEME_SOURCE             scripts/design/theme-source.mjs
THEME_GENERATOR          scripts/design/build-make-theme.mjs
ROUTE_GENERATOR          scripts/design/build-make-routes.mjs
MAKE_SOURCE_SNAPSHOT     output/design/make-adoption/   (v39 adopted state)
MAKE_ROLLBACK_SNAPSHOT   output/design/make-preservation/ (v36 captures)
MAKE_SOURCE_STATUS       RECOVERABLE_FROM_GIT
LIVE_PROVIDER_RECHECK    UNAVAILABLE_BY_TOOLCHAIN (see section 4)
VERIFIED                 2026-08-21, sha256 recomputed from the working tree
FIGMA_WRITES             0
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
