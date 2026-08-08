# Production Risk Register

Status: **v0.7.2 OPERATIONAL — ZERO OPEN P0/P1**

| ID | State | Ongoing control |
| --- | --- | --- |
| R-01 | Closed | Require exact-candidate private authorization and an approved change window. |
| R-02 | Closed | Retain immutable smoke evidence and reconcile every future bounded production write. |
| R-03 | Closed | Capture fresh D1/Worker recovery proof before change; rehearse isolated restore periodically. |
| R-04 | Closed | Re-run affected accessibility and capacity evidence for UI/runtime changes. |
| R-05 | Closed | Preserve protected health, redacted logs, denial tests, and green protected PR gates. |
| R-06 | Closed | Fail closed on target, binding, identity, secret, schema, or readiness drift. |
| R-07 | Closed | Keep authorization server-owned and preserve distinct-reviewer/account-lifecycle rules. |
| R-08 | Accepted limitation | Browser-managed autofill presentation remains outside application control; keep stable accessible forms. |
| R-09 | Closed | Require current exact-head CI and post-merge identity verification for every future release. |

Numeric retention/deletion periods remain an owner-policy decision. No automated
evidence purge is authorized. The v0.7.2.1 maintenance milestone cannot change
production runtime, data, identity, secrets, bindings, or routes.
