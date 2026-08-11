# V5 frontend integrity baseline

Captured: 2026-08-09, Asia/Manila; owner amendment recorded 2026-08-10
Purpose: preserve the frozen V5 authority while recording the accepted live-application integration
Visual change authorized by the current task: Earl's accepted V5 owner visual-feedback amendment plus the bounded Impeccable bolder refinement

## Frozen source identity

The authority is the current on-disk state of:

```text
D:/Documents/Codex/HAU-USC Logistics/worktrees/spec-v073-frontend-design-integration/
prototypes/impeccable-whole-site-redesign-v5/
```

That worktree is on `frontend-design-integration` at `908653dc956c9ccffa68ac0b350fc23b69f053ea` and contains five documented, owner-authorized reference defect corrections. Their authority and exact scope are recorded in `docs/design/V5_REFERENCE_DEFECT_CORRECTIONS.md` in that worktree. They predate this steer; this integration imports but does not extend them. The source authority changed once after the initial capture, so the vendored copy was reconciled to this exact current commit before candidate freeze.

## SHA-256 manifest

```text
4c373ce3c1cca41c864eb3e27c059a59fc6310547ab9c9b6cd780d387ba24206  assets/fonts/bricolage-grotesque-700-latin.woff2
e2291e842cf5af167122a22881a740c7f2dda7716f1e8cd76680264f4a859470  assets/fonts/ibm-plex-sans-latin.woff2
05c91a26d19a61eafe7ce8e0b77eff3fd279ce994dc89f432f4cd06784935e84  assets/fonts/newsreader-600-latin.woff2
216c68f83eba38ab785455481da28b53543fc40ec30de1f4dd18984ad3aa1ce0  assets/images/hau-campus-login-background.jpg
1f293f5c260672d802ef65f6558885f47b6f729912fc7628089d0e98a24c6332  index.html
9bbfa7c24095d75a87cb196d3d33336b06e77d65acaf6e6e1f7de19ea1191b26  src/app.js
7f4ac231b6a7b322ffe1cecad7b830fd433d0448323c0ec75cbad3a3c5aa97b7  src/components.js
568641ecf82c92743e3ed713163af442aded4dc4187ab772a5d720726da5acf0  src/data/mock.js
3348c18144e4fef2130dca9e460a83120e0d62eefb7d529f00f9a375f2abc5ff  src/data/vocabulary.js
dd391a7f6ee26c5629d7302c98a3c881a86fa5493aa1f3459c06575381b7b3ee  src/icons.js
029c1d4b7d04bee3f1f181fe81bb56fcd3452ac998c586da92577d21b646088b  src/registry.js
0d0a29ca1c5ebed8c959f2358a9f6e9689af3f911292d4b1170067049ac19e5f  src/surfaces/admin.js
bed3fa89c35a564a18afbd33fbeffe493bbb2348949ec4972640be9f3aac378e  src/surfaces/operations.js
f848b6fc78804205599f677febf5aac9a29f8a57e6ca960852821afc35b988be  src/surfaces/public.js
bbb30c822d5c727600c4b098097d7ce65af80f2f3e6305c8d7b5869d27d50617  styles/base.css
dd99ad47a3a567a33a6f004fc031954a3a1c1d65e46aa189c097875bf840629a  styles/components.css
3e7ec2f3be9742f39d0f32491d24f020bfef474198ee895c669bb56436d2ad23  styles/motion.css
d514d7fe7d94d7500a248c8767856be62c779afc6ab7f6a9f42067f358767b4c  styles/responsive.css
953de667e602a5df11159e07e36bd8032d4c57854b6b2ec3d7459445a8a26eea  styles/shell.css
510b799b5e960ce940ca94e73b2d935e511a37d2c103e10a7d528f7a7d64b123  styles/surfaces.css
404a8b00fa136423b545f0c3a8b28381c98120baae4c988d22ee7b5883381f41  styles/tokens.css
08e3b5776c24c0b854ac408f1f6eb252e2174103841d31a7076dab3c3c4b422b  styles/v3.css
c4d611b8fa4fdcb140782331202ca7a97862cc67f65f738594fd847e4572a3b3  styles/v4.css
4746d3376f1fabfbbd687715da65f253e4e79625aa44bcb41f3b144580e70903  styles/v5.css
```

`README.md`, font license texts, and tools are retained with the source copy but are not runtime visual inputs. The runtime fingerprint includes every HTML, JavaScript, CSS, font, and image file.

## Structural contract

- 33 registered hash routes: 11 public, 5 role overviews, 10 operations, and 7 administration routes.
- Root application host: `#app`.
- Route format: `#/surface.id`; the route IDs and registry order are frozen.
- Runtime visual stylesheets: `tokens.css`, `base.css`, `shell.css`, `components.css`, `surfaces.css`, `responsive.css`, `motion.css`, `v3.css`, `v4.css`, and `v5.css`, in the order in `index.html`.
- Static visual assets: three bundled fonts plus `hau-campus-login-background.jpg`; SVG icons are emitted from the frozen `src/icons.js` sprite.
- Major DOM remains produced by the V5 `index.html`, `src/app.js`, `src/components.js`, `src/registry.js`, and three surface modules. The accepted 2026-08-10 owner amendment additionally authorizes the event-led full-bleed public landing, governed USC/DOL identity, production-shaped staff sign-in, and responsive corrections listed in `DESIGN.md`. It does not authorize route deletion/reordering, a replacement workbench system, or unrelated visual change.

## Historical pre-owner-amendment post-wiring result

The counts and hashes in this section describe the backend-integration state before Earl's 2026-08-10 visual-feedback amendment. They remain immutable comparison evidence and are superseded for current-source acceptance by the next section.

Recomputed against current authority commit `908653dc956c9ccffa68ac0b350fc23b69f053ea` after the superseding full-parity implementation:

- Complete preserved-tree file count: 39 authority files and 39 vendored files; 31 are byte-identical and 8 intentionally differ.
- Runtime visual-input count: 24 files; 17 are byte-identical and 7 intentionally differ.
- CSS: 9 of 10 stylesheets are byte-identical. `styles/v4.css` changes only the mobile playground-only generated label from `Preview v4.1` to `Playground`; no selector, property, token, layout, breakpoint, or theme value changed.
- All bundled fonts, the HAU campus image, icons, vocabulary, mock source, tokens, base/component/shell/surface/responsive/motion/v3/v5 CSS, and the frozen prototype `index.html` are byte-identical.
- `src/app.js` vendored SHA-256: `57a9d0afa77c4f62273601ee02c25fdd32a58ef8e8028f00984e5d0337490e95`. It removes the browser simulation harness, fail-closes the Index and playground chrome behind verified playground identity, adds Index search, uses authorized routes/current account identity, preserves production suppression, and emits the post-render integration lifecycle event.
- `src/components.js` vendored SHA-256: `1079ca51bc53e0462e44f0d95597b78f62e3fca0ceb95be0a0854aa18b0284d7`. It replaces the preview service label and removes the destructive-looking `noop` fallback.
- `src/registry.js` vendored SHA-256: `3e06f191b10a2c841a7df6b80443002247fe2976d6efa724057681e977ae9799`. It adds the executable exhaustive route classification without changing the 33 route IDs, grouping, order, kinds, or renderers.
- `src/surfaces/admin.js` vendored SHA-256: `721304828f63af7cbd237644cc37657a550d2df31028a8f1dc43f0682607c199`. It replaces illustrative administrative records and local avatar simulation with governed action hooks and truthful empty/current-state copy.
- `src/surfaces/operations.js` vendored SHA-256: `1715fd4b4e7360178fa61730cfc48dab51db33406c24d9601b26c8d89aa78017`. It binds counts and rows to current state, removes prototype records, exposes governed operation hooks, and recomputes pending request lines from mutable backend-projected state.
- `src/surfaces/public.js` vendored SHA-256: `e6c697c181ff63ba040f451b60ae2c6a0e9a769373c7269dbc4af199ec697e86`. It adds only authorized current public contract fields and actions, accurate upload/application copy, and mock-free tracking states; the original authority image path remains in the template and the integration runtime replaces it with the bundled asset URL.
- `tools/motion-test.mjs` vendored SHA-256: `ba9219b42c97a2de33fb5fab48e317d21514cf8be0ac5c076706b7659acd4c7b`. This non-runtime tool points at the current application entry instead of the obsolete standalone preview path.
- The integration controllers are additive JavaScript outside the frozen source tree. They map current API DTOs and exact command contracts into existing V5 form, card, section, drawer, and feedback primitives; they add no CSS or replacement component system.

The intentional differences at that checkpoint were functional integration, environment denial, truthful content, and required contract completeness. The preserved V5 workbench remained authoritative.

That checkpoint's browser evidence was captured at 320, 390, 768, 1024, and 1440 CSS pixels. Exact deployed-candidate evidence is superseded by each newly frozen candidate.

## Current owner-amended visual contract

The 2026-08-10 accepted amendment preserves every registered V5 route and the V5 internal workbench while intentionally changing the public arrival and playground convenience behavior:

- `src/v5/src/app.js` SHA-256 `f7d40fd1cef76d94b3e45ccde8a1d5f901c61e6b09a6b7d9c5de87665eb80a75`: Index copy now explains the server-authorized owner session and retained real-login test path.
- `src/v5/src/surfaces/public.js` SHA-256 `4ebf5da153f9b3f998f86cb3b6ccbbb7998208d22ba89bcd847ffa933d35d3fb`: governed USC/DOL image slots, full council wordmark, Staff sign-in hero CTA, USC-only hero mark, enlarged announcement hierarchy, and `HAU-USC · 2026-2027` footer.
- `src/v5/integration/owner-visual-feedback.css` SHA-256 `82b7118d23905d5b70b92a22b947a4398f390995b347eee0ca0a2d725c6fc860`: the final integration-only visual layer; it owns full-bleed event composition, warm-gold Request Center treatment, production-background sign-in, and responsive safeguards without altering the frozen token system. The accepted Impeccable bolder refinement changes only the landing masthead and hero: full-width institutional banner, stronger marks/wordmark, concentrated oxblood photographic field, tighter headline, decisive actions, and a reduced-motion-safe cover reveal.
- `src/v5/assets/images/usc-facebook-cover-youth-development-day-2026.jpg` SHA-256 `6ec7c5a75f1a360e68064d4887d237c64e12359969730fefbfdd9c95ea60d747`: vendored official USC Facebook event cover used only as the deterministic fallback. A server-published PUBLIC announcement may replace the hero title, description, CTA, destination, alternative text, and image.
- Existing governed brand slots remain the only application-wide logo/theme asset controls. The existing advertisement contract remains the only event-led landing-media control; no arbitrary CSS, HTML, bucket, object-key, or browser-selected binding was introduced.
- Browser acceptance now covers `320/375/390/414/768/1024/1280×800/1440/1920` CSS pixels, light/dark, all 33 routes, searchable Index, guarded owner auto-session, explicit real-login escape hatch, dynamic event projection, eight-digit verification field constraints, first-fold fit, and Production playground denial with no horizontal overflow or browser errors.

The complete interaction and responsive contract is `DESIGN.md`. Exact deployed-candidate evidence must still be refreshed after candidate freeze and playground-only deployment.
