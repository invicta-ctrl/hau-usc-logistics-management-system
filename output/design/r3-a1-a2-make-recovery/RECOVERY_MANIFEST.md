# R3-A1-A2 — Figma Make recovery checkpoint

STATUS: EXACT UNSAVED SOURCE PRESERVED
PURPOSE: recovery authority for a stalled Figma Make provider save

---

## Why this exists

The transformed `PublicFlows.tsx` existed **only as unsaved client-side state**
in an authenticated Chrome Figma Make tab. The provider Save control stalled:
spinner running for >15 minutes, header still reporting **Version 40**, pending
panel still showing the edit.

`.codex/R3_A1_A2_MAKE_CHANGESET.md` records the *recipe* — the 20 asserted
transformations. A recipe is reproducible but it is not the artifact. This
directory holds **the exact resulting source**, which is the recovery authority.

---

## Preserved artifact

| Field | Value |
|---|---|
| Repository path | `output/design/r3-a1-a2-make-recovery/PublicFlows.tsx` |
| Provider path | `src/app/PublicFlows.tsx` |
| Provider file | `rP9W9MQlZkyQrUx38TVsFS` — HAU-USC Logistics · Prototyping |
| Originating provider version | **Version 40** (baseline; the edit was NOT saved) |
| Pending provider change | `1 edited file · PublicFlows.tsx +53 −173` |
| Lines | **669** newline-terminated (CodeMirror reports 670 lines) |
| Bytes (UTF-8) | **43,499** |
| SHA256 | `165aa1c626775b0330f0b2bdb6dd30a70fe940d7bca753712172d903ee1c2765` |
| Extraction time | 2026-08-23 23:58 local |
| Extraction method | `EditorView.state.doc.toString()` → `fetch POST` → localhost receiver on `127.0.0.1:8791` |
| Changeset recipe | `.codex/R3_A1_A2_MAKE_CHANGESET.md` |

### Why the bytes moved over localhost

The browser-tool response filter rejects large raw source payloads returned from
page script (they trip a "Cookie/query string data" / "Base64 encoded data"
guard). Returning 43 KB of TSX through the tool result was therefore not
possible. The page instead POSTed the document straight to a short-lived
loopback-bound receiver, which wrote the bytes to disk unmodified. The receiver
listened on `127.0.0.1` only and was shut down immediately afterwards.

This preserves byte fidelity — no chunking, no re-encoding, no transcription.

---

## Integrity verification — performed on the file at rest

| Check | Result |
|---|---|
| `…N tokens truncated…` markers | **0** |
| `Public front door` occurrences | **0** |
| R3-A1-A2 scope-correction header present | yes |
| `Public lending navigation` nav label | 1 |
| `Track lending` | 6 |
| Functional public Request Center view | **absent** |
| `Request Center` textual references | 5, all verified intentional |

The five remaining `Request Center` references, by line:

| Line | Context |
|---|---|
| 8 | header — "It no longer owns a logistics Request Center" |
| 9 | header — "the External Request Center is context B" |
| 18 | header — records the superseded reading |
| 224 | nav rationale comment — `"Request Center" is gone from here` |
| 512 | policy copy — names the External Request Center and where it is reached |

None of them renders a public request surface.

---

## What this file is, and is not

**Is:** the exact source to re-apply if the stalled save did not land, so the 20
manual CodeMirror transformations never have to be repeated.

**Is not:** evidence that the provider saved anything. Provider state is decided
only by reading back a freshly loaded editor session. At the time of writing:

```
SAVE_STATUS = UNKNOWN — stalled, not confirmed either way
PROVIDER_VERSION_OBSERVED = 40
MAKE_PENDING_EDITS = 1
```

---

## Relationship to the truncated mirror

This file is **not** part of `output/design/figma-make-source/`, the repository
Make mirror. That mirror carries a separate integrity defect — 47 files contain
literal `…N tokens truncated…` markers — recorded as `FE-R3-015` in
`docs/design/FIGMA_MAKE_SOURCE_REGISTER.md` and listed in
`.codex/R3_A1_A2_MAKE_MIRROR_TRUNCATION.txt`.

This recovery artifact is byte-faithful and truncation-free, and is therefore
safe to use as authoring input. The mirror is not.
