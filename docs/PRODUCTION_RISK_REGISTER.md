# v0.7.0 Production Risk Register

Status: **LAUNCH ACCEPTED — ZERO OPEN P0/P1**

| ID | Severity | Launch disposition | Ongoing control |
| --- | --- | --- | --- |
| R-01 | Closed | Production authorization and controlled smoke passed | Keep exact-candidate private authorization and change-window validation |
| R-02 | Closed | Full staging and production workflow acceptance passed | Retain immutable smoke evidence and reconcile every future synthetic run |
| R-03 | Closed | Real staging rollback and isolated final production restore passed | Quarterly restore rehearsal; retain exports, bookmarks, and exact Worker versions |
| R-04 | Closed | Live accessibility/performance/capacity gate passed | Re-run affected widths and measurements for UI/runtime changes |
| R-05 | Closed | Security, privacy, branch, and final-freeze reviews passed | Preserve protected health, redacted logs, denial tests, and green PR gates |
| R-06 | Closed | Production targets, separation, backups, secrets, and route preflight passed | Fail closed on identity drift or incomplete protected configuration |
| R-07 | Closed | Accepted Worker/D1 Access Management is deployed and browser accepted | Keep server-owned capability and distinct-reviewer rules |
| R-08 | Medium | Browser-managed autofill presentation remains outside application control | Maintain stable accessible forms and avoid focus/remount loops |
| R-09 | Closed | Release tag/runtime exact SHA and post-merge CI verified | Require current green PR checks for future `main` changes |

Numeric evidence-retention/deletion periods and optional email-delivery provider
selection remain owner-policy decisions. They are not broken launch-critical
workflows and no purge or fabricated provider health is authorized.

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
