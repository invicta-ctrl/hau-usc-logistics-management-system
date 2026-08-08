# V4.1 Baseline vs Production Front End — Keep What Is Better

Owner instruction, 2026-08-09: *"compare both design and functionalities and
keep what's better; I'm leaning towards the new design better than the current
production front end."*

The lean toward V4.1 is recorded and followed. It is **not** treated as a
blanket replacement, because production wins several comparisons outright and
those wins must survive the integration.

Evidence: the production front end captured from the deployed v0.7.2 artifact
before any edit, and the V4.1 baseline on
`design/impeccable-whole-site-preview`.

---

## 1. Where V4.1 is better — adopt

| # | Element | Production today | V4.1 | Status |
|---|---|---|---|---|
| 1 | **Figure/ground** | `--bg #F8F1E4` vs `--paper #FFFDF8` — 1.6% apart in relative luminance, so panels float on nothing | Real surface ladder, ~20% gap | **Adopted** (§17.2) |
| 2 | **Elevation** | Two far-apart steps (`--shadow`, `--shadow-lg`) | Three-step ramp | **Adopted** |
| 3 | **Decorative ground** | Radial gradient + 28px diagonal line pattern behind every operational screen | Clean ground | **Adopted** — pattern removed |
| 4 | **Motion** | No motion tokens; behaviour ad hoc per surface | Documented scale, every animation justified | **Adopted** (tokens in place) |
| 5 | **Type scale** | No scale tokens; sizes literal per file | Named ramp with display step | **Adopted** |
| 6 | **Brand as composition** | Oxblood on rail and buttons only | Anchor/accent tokens usable in content | **Adopted** |
| 7 | **Theme control** | None in the shipped UI | Celestial sun/moon capsule | Pending §17.3 |
| 8 | **Menu / back controls** | Plain default treatments | Kinetic menu, compact glossy back | Pending §17.3 |
| 9 | **Status chips** | Semantic colours spread across five hues | Five tones, always labelled | Pending |
| 10 | **Narrow-width tables** | Horizontal squeeze | Column priority; status and quantity always survive | Pending |
| 11 | **Copy discipline** | Technical vocabulary leaks (below) | Plain-language standard | Pending §17.7 |

## 2. Where PRODUCTION is better — keep, do not replace

This is the half the owner's instruction protects. Each of these is a real
production strength that the V4.1 preview simplified away, usually because the
preview only had to look good, not run a department.

| # | Element | Why production wins | Instruction |
|---|---|---|---|
| 1 | **Navigation subtitles** | Every rail item carries a second line — *"Request Center / Events & catalog restock"*, *"Office Lending Hub / Library-style circulation"*, *"Release Desk / Controlled handoff"*. This is genuine orientation for occasional users and committee staff who do not live in the product. V4.1 reduced most of these to a bare label. | **Keep production's subtitles.** Do not adopt the bare-label rail. |
| 2 | **Metric density in the brief** | The welcome panel carries six live figures at once — active event series, upcoming sub-events, requests needing review, ready to release, overdue loans, low-stock items — each with a qualifier line. V4.1's attention band shows four. | **Keep six.** Apply V4.1's hierarchy and elevation to them, not its reduction. |
| 3 | **Workspace + scope always visible** | Both selectors sit in the context bar on every authenticated screen, so the operator always knows which workspace and which scope they are acting in. V4.1 tucked scope into a rail footer control. | **Keep them in the context bar.** |
| 4 | **Attention aggregate** | A single "Attention · 10" badge summarising everything needing action, in the top bar. V4.1 has no equivalent. | **Keep.** |
| 5 | **Explicit quick actions in the brief** | *Create Request · Open Release Desk · Review Deliverables · Open Inventory* as real buttons in the hero. V4.1's overview leads with a queue and buries entry points. | **Keep.** |
| 6 | **Module cards with qualifiers** | *"Open deliverables 8 — across active event requests"*, *"Waiting for budget 2 — budget workflow is visible but not yet automated"*. That second line is honest about system limits. V4.1 dropped qualifiers. | **Keep the qualifier lines.** |
| 7 | **System fonts, no webfont** | Production ships zero webfonts. V4.1 bundles three woff2 files. | **Keep the system stack.** The display voice comes from scale, weight and tracking. |
| 8 | **Real permissions, forms, and service contracts** | Self-evident, and the specification's conflict rule already protects it. | **Untouchable.** |

## 3. Where both are wrong — fix in this integration

| Element | Problem | Fix |
|---|---|---|
| `DEVELOPMENT · v0.7.2` badge | Environment identity shown to ordinary users | No badge in production; "Test site" in plain language on staging |
| "OPERATIONAL SCOPE" / "Server-assigned scope" | Implementation vocabulary in a user-facing control | "View", with a plain description of what is being viewed |
| "Connecting securely…" | Describes transport, not the user's situation | "Loading your workspace…" |
| "Checking the server-authorized operational service" | Reads as engineering telemetry | "Checking your access" |
| Real person names in the shipped fixture | Personal data in the deployed bundle | **Fixed** — `f1cb980` |
| Three undefined design tokens | `--surface`, `--surface-subtle`, `--accent-strong` fell back to generic cool greys outside the warm palette | **Fixed** — defined in the token layer |

## 4. Net effect

The integration is **V4.1's visual system carrying production's information
density**, not V4.1's screens replacing production's.

Concretely: production's six metrics, subtitled navigation, always-visible
workspace and scope, attention aggregate, quick actions, and honest qualifier
lines all survive — and gain a real surface ladder, an elevation ramp, a motion
system, an editorial type scale, and plain-language copy.

Where the preview looked cleaner only because it showed less, production wins.

## 5. Open question for the owner

V4.1's strongest structural idea — **queue plus split-pane detail**, so a
reviewer never loses their place in a list — has no production equivalent
today; production navigates away to a detail view. Adopting it changes
navigation behaviour, not just presentation, so it sits at the edge of this
specification's "presentation only" scope.

Recommendation: adopt it for Request review and Lending review, where losing
queue position is the most costly, and leave the remaining modules on their
current navigation. Flagged rather than assumed.
