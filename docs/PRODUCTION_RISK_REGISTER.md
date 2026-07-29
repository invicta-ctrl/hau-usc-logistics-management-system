# v0.6 Production Risk Register

| ID | Severity | Risk / evidence gap | Current control | Closure evidence required |
| --- | --- | --- | --- | --- |
| R-01 | Launch blocker | Gate E actions are not approved | Fail-closed Phase 3 package validator; no writes performed | Valid exact-candidate package approving workflow writes, evidence, rollback, and retention |
| R-02 | Launch blocker | Full live workflow/evidence/reconciliation acceptance is incomplete | Local workerd and bounded auth/access smoke pass | Approved Gate E matrix with safe synthetic data and final reconciliation |
| R-03 | Launch blocker | Staging rollback has inputs but no rehearsal/restoration proof | ACL-protected D1 export and Worker anchor retained | Timed, authorized rollback and restoration with integrity reconciliation |
| R-04 | High | Live accessibility and performance/capacity evidence is incomplete | Responsive Playwright matrix and accessibility fundamentals pass locally | Final-candidate live accessibility and measured performance/capacity evidence |
| R-05 | High | Final security and data/recovery reviews are absent | No unsupported PASS claimed | Two independent read-only PASS reviews on one frozen packet |
| R-06 | Launch blocker | Production authorization/resources/backups/window are unverified | Production validator rejects missing, stale, staging, placeholder, or pending data | Complete valid private production package and read-only preflight |
| R-07 | High | Legacy non-Access Reference Administration Worker endpoint returns 404 | Access Management renders independently and remains server-authorized | Gate E decision: implement accepted D1 contract or explicitly exclude with owner acceptance |
| R-08 | Medium | Browser/extension autofill UI cannot be fully suppressed by the application | Stable standard form, no autofocus/remount/refocus loop | Retain regression; document browser limitation |
| R-09 | High | Final remote CI may move after evidence documentation | Exact-SHA CI verification required | All required PR checks green at the eventual evidence/release head |

No open P0/P1 implementation finding is claimed resolved beyond the tested Task 3 auth/access scope. Missing authorization and acceptance evidence remain launch blockers, so production is NO-GO.
