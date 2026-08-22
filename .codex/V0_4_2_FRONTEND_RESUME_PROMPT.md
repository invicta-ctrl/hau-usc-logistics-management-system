# Codex Resume Prompt — v0.4.2 Glossy Command Center

Paste the fenced block into a fresh Codex task from the repository root.
Self-contained: do **not** reconstruct state from chat.

---

```text
INTENT
DOCUMENT_OR_ARTIFACT with secondary SOFTWARE_FEATURE (isolated front-end
preview), REVIEW, WRITING. Front-end only. Not a full-stack task.

MODE
Continue the owner-named v0.4.2 "Glossy Command Center" front-end design
preview on the isolated design branch.

REQUIRED ENTRY SEQUENCE — read these and nothing else by default
1. AGENTS.md
2. .codex/CURRENT.md                       (v0.7.x production program pointer)
3. .codex/PHASE_AND_CONTEXT_POLICY.md
4. .codex/V0_4_2_FRONTEND_CURRENT.md       (this program's pointer)
5. .codex/V0_4_2_FRONTEND_HANDOFF.md       (durable technical record)
6. docs/design/references/HAU_USC_Logistics_v0.4.1_Glossy_Command_Center_Reference_Pack.pdf
   and docs/design/references/v0.4.1-control-references/*.png
7. Only the v5 preview source needed for the current slice:
   prototypes/impeccable-whole-site-redesign-v5/
Do not broad-scan the repository.

BRANCH
design/impeccable-whole-site-preview, in the linked worktree.
The authoritative checkout stays on release/v0.7.2-production-access-operations
and must never be written. Treat release movement as external drift: record the
SHA, never merge, never rebase onto it.

HANDSHAKE BEFORE WRITING
1. Report worktree root, branch, HEAD, upstream, `git status --short`.
2. Report the release checkout's branch/SHA read-only; confirm clean.
3. Confirm the v0.4.1 baseline is intact:
   output/design/backups/HAU_USC_Logistics_Impeccable_Whole_Site_Redesign_Preview_v4_1_Baseline_Backup.html
   sha256 99a74cc1d6daeecfe3a14b267b19f71d4491fd135a10a8a904b0c94f18b27072
   and equals output/design/..._Preview_v4.html
4. Confirm prototypes/impeccable-whole-site-redesign-v4/ is unmodified.
5. Never reset, clean, discard, force-checkout, or force-push.

SCOPE — FRONT END ONLY
Allowed: HTML, CSS, client-side JS, isolated preview dependencies, local mock
data, WebGL/Three.js inside the preview, animations, responsive layout, glass
effects, themes, local screenshots, design docs, commits/pushes on the design
branch.
Forbidden: Worker logic, backend services, APIs/contracts, D1, R2, migrations,
Google Sheets/Drive, email/providers, auth backend, production permissions,
deployment config, Cloudflare bindings, secrets, staging, production, DNS, the
release branch.

WORK BOUNDARY
Edit only prototypes/impeccable-whole-site-redesign-v5/.
Never modify the v1/v2/v3/v4 source trees, their exports,
output/design/backups/, output/design/impeccable-redesign-v4* evidence, or
docs/design/references/.

NEXT SLICE — in priority order
1. WEBGL ROUTING GLOBE (the brief's required signature feature).
   - Vendor Three.js into the preview (npm was reachable). Bundle it into the
     export; the shareable artifact must make NO runtime network request.
   - Draggable rotation, wheel/pinch zoom, slow idle auto-rotation, glowing
     route arcs with travel pulses, luminous origin/destination/status nodes,
     hover/focus labels, selected-route highlight, atmospheric rim, legend,
     pause/reset, responsive composition.
   - HAU gold + cyan/emerald route palette. Sanitized mock telemetry only,
     visibly labelled as preview/demo data. No real locations or private data.
   - Feature-detect WebGL2; cap devicePixelRatio; pause on document hidden and
     when offscreen; dispose renderer/geometries/materials/textures/listeners.
   - Under prefers-reduced-motion: no auto-rotation, no travel pulses, static
     highlighted nodes, interaction still usable.
   - Provide a premium static/2D routing fallback when WebGL2 is unavailable.
   - Selecting a node should open an EXISTING local preview drawer/detail, not
     a new product module.
2. Apply the glass system broadly: command bar, telemetry panels, drawers,
   filters, quick actions, selected summaries. Keep dense tables flatter for
   legibility. Do not make every container the same glass card.
3. Re-tone dark mode from predominantly maroon to deep charcoal / warm
   near-black WITH an oxblood tint, per the brief.
4. Extreme-but-purposeful motion: command-center entrance (under ~1.8s,
   interactive immediately), glass pointer tilt on pointer devices only,
   telemetry reveal, route-tracer and glossy skeleton loading replacing
   spinners. Every animation must communicate navigation, state, hierarchy,
   continuity, cause/effect, progress, attention, live activity, completion, or
   spatial relationship — otherwise remove it.
5. Capture the before/after visual delta matrix (11 named views from the brief)
   and run the delta gate: if text and logos were blurred, would the new
   version still be obviously different and more premium?

DO NOT REGRESS — these are already delivered and verified
- The celestial toggle's FILLED crescent moon and filled sun. Never route the
  celestial glyphs through the monoline sprite: it forces
  fill="none" stroke="currentColor" and produces the rejected outline moon.
- The toggle's accessible state uses aria-pressed because setTheme() updates
  that node imperatively so the plate can animate without a re-render. Do not
  add role="switch"/aria-checked unless you also update setTheme().
- The menu close-morph is keyed to data-drawer-open, not aria-expanded.
- Workflow coverage: no route or state variant may be removed.

VERIFICATION — run, do not assume
node prototypes/impeccable-whole-site-redesign-v5/tools/export.mjs
PLAYWRIGHT_PATH=<repo>/node_modules/playwright/index.mjs node \
  prototypes/impeccable-whole-site-redesign-v5/tools/verify.mjs <export> <screensDir>
PLAYWRIGHT_PATH=... node .../tools/contrast.mjs <export>
PLAYWRIGHT_PATH=... node .../tools/theme-test.mjs <export>
PLAYWRIGHT_PATH=... node .../tools/control-shots.mjs <export> <outDir>
node <impeccable-skill>/scripts/detect.mjs prototypes/impeccable-whole-site-redesign-v5/
git diff --check

Required: 0 contrast failures both themes; 0 a11y/responsive findings at
320/375/390/414/768/1024/1440; 0 console errors; 0 non-file: runtime requests;
focus restored to trigger; reduced motion honoured; 0 overflow at 200% zoom;
13/13 celestial acceptance checks. Detector baseline is 58 on v4.1 and 71 on
v5 — the extra 13 are design-system documentation drift from the glass tokens;
recording the glass/glow scale in the DESIGN.md frontmatter sidecar clears them.
Additionally verify globe render, interaction, fallback, reduced-motion
behaviour, disposal, and no hidden-tab GPU churn.

GIT
Authorized: local commits and pushes on design/impeccable-whole-site-preview.
Not authorized: PR, merge, main, release branch, production, staging,
Cloudflare, D1, R2, Google, migrations, DNS, secrets, force-push.
Do not commit .impeccable/hook.cache.json.
Commit small durable checkpoints; do not hold hours of work uncommitted.

START HERE
Read .codex/V0_4_2_FRONTEND_CURRENT.md -> NEXT ACTION and execute exactly that
slice. Update CURRENT and HANDOFF before finishing.
```
