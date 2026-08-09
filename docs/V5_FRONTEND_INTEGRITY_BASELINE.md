# V5 frontend integrity baseline

Captured: 2026-08-09, Asia/Manila
Purpose: pre-wiring fingerprint for the accepted V5 backend-integration steer
Visual change authorized by this task: none

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
- Major DOM is produced by the frozen `index.html`, `src/app.js`, `src/components.js`, `src/registry.js`, and three surface modules. Integration may change text/value/src data at runtime but must not intentionally change structure, classes, copy templates, routes, CSS, tokens, assets, or responsive behavior.

## Post-wiring result

Recomputed against current authority commit `908653dc956c9ccffa68ac0b350fc23b69f053ea`:

- Runtime file count: 39 authority files and 39 vendored non-integration files.
- Byte-identical files: 37 of 39.
- CSS: all ten stylesheet files byte-identical, including current corrected `styles/v4.css`.
- Static fonts/images, icons, tokens, registry, routes, components, application shell, and index: byte-identical.
- `src/surfaces/public.js` vendored SHA-256: `b9f69f2488d706a314e48e0c566d331f5d28033e3147f75c467c714040531c97`. Difference is limited to Earl's authorized public request/tracking/lending contract fields and copy.
- `src/surfaces/operations.js` vendored SHA-256: `b3a8fdedc56e43aa66325b159a53ee91596b65eea3b8a28497cb48c658f87846`. The only difference is a functional data-binding correction: the accepted request guard recomputes pending lines from the mutable backend-projected array instead of capturing the empty array at module import.
- Integration JavaScript is external to the frozen source layers. It clears mock arrays, maps API DTOs, delegates events, and updates text/value/src state without adding styles or replacing the component system.

Expected intentional design change remains **none**. Expected data differences are current server values replacing illustrative array values. The only source-level visual additions are the separately owner-authorized minimum contract fields/copy, rendered with existing V5 patterns and no CSS addition.

Representative visual evidence must be taken from the exact deployed candidate at 1440, 1024, 768, and 390 CSS pixels in both themes. The earlier built-in-browser checkpoint established live route/auth/data behavior; subsequent localhost browser automation was unavailable because the browser-control URL policy blocked loopback inspection. This is an evidence-tool limitation, not permission to bypass it.
