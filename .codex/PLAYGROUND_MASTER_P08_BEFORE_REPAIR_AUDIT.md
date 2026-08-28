# P08 Core Routes — Before-Repair Audit

DATE: 2026-08-28
PROGRAM: PLAYGROUND-MASTER-2026-08-28
STATUS: REPRODUCTION_COMPLETE;REPAIRS_NOT_STARTED

## Browser boundary

The audit used a fresh headless Chromium context with service workers blocked and no credentials. The canonical custom hostname presented its Cloudflare Access gate and was not bypassed. The accepted private manifest identified the isolated Playground acceptance hostname used by prior FI closeout; that target issued the staging-only System Owner convenience session without credentials.

```text
ROOT_HTTP = 200
ROOT_MAIN_VISIBLE = PASS
STAFF_SIGN_IN_VISIBLE = PASS
ENTER_PLAYGROUND_VISIBLE = PASS
PLAYGROUND_SESSION_HTTP = 200
AUTHENTICATED_NAVIGATION = PASS
PRODUCTION_MUTATION = NONE
```

Private screenshots and the aggregate report contain no credentials or Production-derived row identities. Provider identities and private paths remain outside Git.

## Live route/API matrix

| Route                | Navigation | Worker contract                      | Loaded real coverage                                                    | Loading terminated | Console/request failures |
| -------------------- | ---------- | ------------------------------------ | ----------------------------------------------------------------------- | ------------------ | ------------------------ |
| Overview             | PASS       | `overview` bootstrap v2, HTTP 200    | 8 requests, 11 lines, 7 events, 25 bounded inventory rows               | PASS               | 0 / 0                    |
| Internal Request Hub | PASS       | `request` bootstrap v2, HTTP 200     | 3 server-scoped requests, 5 lines, 7 events, 25 catalog references      | PASS               | 0 / 0                    |
| Internal Lending Hub | PASS       | `lending` bootstrap v2, HTTP 200     | 8 tickets, 25 bounded inventory rows                                    | PASS               | 0 / 0                    |
| Release              | PASS       | `release` bootstrap v2, HTTP 200     | 3 confirmations, 1 correction, 8 requests, 11 lines, 1 lending ticket   | PASS               | 0 / 0                    |
| Restocking           | PASS       | `restocking` bootstrap v2, HTTP 200  | 3 requests, 3 receiving records, 1 canvass reference, 25 inventory rows | PASS               | 0 / 0                    |
| Procurement          | PASS       | `procurement` bootstrap v2, HTTP 200 | 1 deliverable, 2 canvass references, 8 requests, 11 lines               | PASS               | 0 / 0                    |

No route displayed reserved/not-built, generic unavailable, or stuck-loading copy in the successful live state. No fabricated KPI was observed.

## Disposition by P08 acceptance boundary

### Overview — pass candidate

- accepted FI surface is present;
- summary and rows come from the real backend;
- the first useful render terminates and contains operational data;
- no fabricated KPI or reserved/not-built state observed.

### Internal Request Hub — partial, mutation verification required

- real queue loads and the skeleton terminates;
- server filtering/pagination and distinct queue states are visible;
- no fake normal-runtime rows are substituted;
- review/route mutation, retry, abort, timeout, and denied/unavailable projections still require focused regression and real-consequence verification.

### Internal Lending Hub — confirmed linked-inventory defect

- real queue and lifecycle states load;
- every displayed ticket reports `Canonical item unavailable in this projection`, including v2 tickets that are backed by classified lendable inventory;
- the bootstrap returns only the bounded first inventory page rather than guaranteeing the canonical inventory rows referenced by the loaded lending tickets;
- retry and permitted handoff/return consequences still require focused verification.

### Release — confirmed unsupported read-only surface

- the backend-derived queue loads and shows confirmations/corrections;
- the route explicitly states that it is read-only and exposes no supported full/partial release action;
- P08 requires real full/partial release, ledger/reservation reconciliation, and duplicate protection through existing Worker/D1 authority.

### Restocking — confirmed unsupported read-only surface

- real restock, receiving, canvass, and inventory data load;
- the route explicitly states that it is read-only and exposes no receiving action;
- P08 requires a real backend receiving consequence and resulting inventory movement.

### Procurement — pass candidate

- real backend deliverable/canvass/request data load;
- no normal synthetic rows or simulated write are shown;
- unsupported writes are truthfully described as unavailable/read-only.

## Before-repair evidence

The six private screenshots have distinct SHA-256 identities and were visually inspected. The Access-gated custom-host capture and two earlier navigation-method captures are preserved privately as diagnostic evidence but are not treated as route findings.

Focused browser-audit formatting, ESLint, and its static safety regression pass. No Worker, D1, R2, deployment, Production, main, Google, or Figma mutation occurred during P08 reproduction. The convenience session created for the browser audit remains transient Playground state and must be cleaned or reset at the next accepted lifecycle boundary.

Post-audit D1 inspection reports baseline v2 and generation 4 unchanged, foreign keys 0, one session and transient total 1. `playground.working_state` still reports `CLEAN`/inactive; the mismatch between that metadata and the real active session is preserved as a P12 reset-lifecycle finding rather than silently normalized in P08.

## Next exact action

Map the existing Request, Lending, Release, receiving/restocking Worker endpoints and invariants. Add focused regressions for linked lending inventory, release full/partial/duplicate behavior, restock receiving/inventory movement, and truthful failure/retry states before applying the smallest supported frontend/contract repairs.
