# R3-A1-A2 Make — staged Checkpoint A source

These are the **exact bytes** dispatched into the Figma Make editor for
Checkpoint A. Each dispatch asserted `after === next` against the served file, so
the provider document and the file here are byte-identical at write time.

They are kept so the work survives a lost browser session — the same lesson the
stalled `PublicFlows.tsx` save produced.

| sha256 (first 16) | bytes | provider path |
|---|---:|---|
| `b0e03e9d13384756` | 1,056 | `src/app/appRoutes.ts` |
| `648bea9016cada30` | 2,569 | `src/app/appTypes.ts` |
| `fe371e5e21bcb0d2` | 11,675 | `src/app/auth/AccountRecoveryPanel.tsx` |
| `581204ebe4d2e1f6` | 4,283 | `src/app/auth/VerificationCodeField.tsx` |
| `279e30d8103491d3` | 5,241 | `src/app/entryIntent.ts` |
| `7e31f72c277479a1` | 21,299 | `src/app/request/ExternalRequestCenter.tsx` |

Truncation markers: **0**.

## Why Checkpoint A is additive

`appTypes.ts` keeps `"request"` in `PublicSubRoute` at this checkpoint. Every
existing caller therefore still type-checks, and nothing yet imports the three
new components — so the project compiles with Checkpoint A applied on its own.
Checkpoint B removes `"request"` in the same save as the callers that stop using
it.

## Provider file creation

The Make "Create new file" field **flattens `/` to `_`** — typing
`src/app/entryIntent.ts` produced a root-level `src_app_entryIntent.ts`. That
attempt was reverted with the per-file restore control.

The working path is the **file-tree context menu**: right-click a folder →
`Create file` / `Create folder`, which creates inside that folder. `request/`
was created that way.

Two renames did not take on the first attempt (the inline field was not focused
when the keystrokes were sent) and left a `new-file.tsx`; both were corrected
before saving — one by reverting, one by an explicit context-menu Rename. Any
`new-file.tsx` in a diff is a rename that silently failed and must be fixed
before Save.
