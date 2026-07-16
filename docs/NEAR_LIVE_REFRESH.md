# Bounded Near-Live Active-Module Refresh

## Purpose

Slice 12 replaces five-second full-bootstrap polling with a bounded change
signal. It improves update visibility without claiming WebSocket/realtime
consistency or turning Google Sheets into a transactional database.

## Accepted behavior

- Default cadence: 15 seconds plus bounded client jitter.
- Eligibility: authenticated internal session, visible page, online browser,
  and focused or recently active window.
- Concurrency: at most one scoped revision request in flight per session. Focus,
  reconnect, manual refresh, and scheduled checks coalesce.
- Change handling: an unchanged token performs no module fetch. A changed token
  refreshes only the active bounded module and its approved summary projection.
- Dirty policy: never overwrite a dirty form, open consequential modal, or
  unsaved runtime state. Show Refresh now and Continue editing instead.
- Mutation policy: consume the returned scoped revision and refresh only the
  affected active module. Refresh never retries or replays a write.
- Ordering: ignore a response older than the latest issued/accepted request.
- Resilience: bounded exponential backoff with jitter, last-successful-update
  time, visible checking/delayed/stale/offline/updates-available states, and a
  manual refresh control.
- Rollback: a fail-closed server-provided feature flag disables scheduled
  polling while preserving manual and post-mutation scoped refresh.

## Scope tokens

The server owns a monotonically increasing global revision and per-scope
tokens. A safe revision response contains contract version, enabled state,
requested/authorized scope, token, global revision, update time, environment,
and read metrics only. It contains no operational rows or cached authorization
decision. Unknown or unauthorized scopes fail closed.

The browser maps the active view to one allowlisted bounded module query. It
does not poll inactive modules and does not fall back to full bootstrap on a
scheduled tick.

## Current platform preflight

Official Google documentation was rechecked on 2026-07-16:

- Apps Script execution: six minutes per execution, 30 simultaneous executions
  per user, and 1,000 simultaneous executions per script.
- `google.script.run`: asynchronous and limited to ten concurrent server calls
  from a page.
- Google recommends minimizing service calls and batching reads/writes.

Sources:

- <https://developers.google.com/apps-script/guides/services/quotas>
- <https://developers.google.com/apps-script/guides/html/communication>
- <https://developers.google.com/apps-script/guides/html/reference/run>
- <https://developers.google.com/apps-script/guides/support/best-practices>

These limits are mutable ceilings, not safe operating targets.

## Repository load model

The implementation evidence reports parameterized scenarios for 1, 10, and 30
continuously eligible active sessions. These are engineering capacity scenarios,
not an institutional user forecast. At a 15-second cadence, the upper-bound
revision calls per hour are `sessions * 240` before visibility, activity,
backoff, and jitter reductions. Unchanged checks must read only bounded revision
metadata and must cause zero module queries.

Exact institutional expected/peak session counts and live p95 update visibility
require named-owner acceptance in the separately authorized Slice 13 staging
exercise. Repository acceptance proves deterministic behavior, request/read
counts, and a conservative model; it does not claim live quota or latency proof.

## Acceptance evidence

- fake-timer cadence, jitter, backoff, recovery, and remote-disable tests;
- visible/hidden, focus/recent activity, online/offline, dirty, and single-flight
  tests;
- changed/unchanged, active-scope-only, post-mutation, and out-of-order tests;
- multi-session request/read-count model at 1/10/30 sessions;
- browser proof for last-updated, checking, delayed/stale, manual refresh, and
  dirty-update deferral;
- deterministic generated parity, privacy scan, and full repository gates.

No deployment, migration, live Script Property change, external Google write,
PR merge, staging, or production action belongs to Slice 12.
