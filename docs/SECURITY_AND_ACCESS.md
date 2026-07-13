# Security, Privacy, Access, and Data Governance

## Security state

The deterministic browser preview is **DEMO**, not a security boundary. The Apps Script authorization, validation, and storage controls described as **CURRENT** are implemented in source, but they are not evidence that a particular deployment, Google account, Sheet, or Drive folder is configured correctly. Production remains blocked until the launch evidence, privacy decisions, access review, and unresolved controls in this document are approved.

Security objectives are:

1. only an authorized institutional identity can read internal records or mutate operational state;
2. request-only users receive the minimum data needed to submit a request;
3. inventory, ledger, status, audit, migration, and evidence integrity is preserved;
4. personal, commercial, configuration, and incident data is not disclosed through UI, logs, links, source, or build artifacts;
5. a failed or replayed command cannot create an untraceable duplicate;
6. every privileged change is attributable, reviewable, and recoverable.

## Roles and permissions

| Role                | Review/reserve | Release | Receive | Admin | Manage catalog |
| ------------------- | -------------: | ------: | ------: | ----: | -------------: |
| `REQUESTER`         |             no |      no |      no |    no |  explicit only |
| `DOL_STAFF`         |            yes |     yes |     yes |    no |  explicit only |
| `COMMITTEE_HEAD`    |            yes |      no |     yes |    no |  explicit only |
| `DOL_DIRECTOR`      |            yes |     yes |     yes |   yes |            yes |
| `ADMIN`             |            yes |     yes |     yes |   yes |            yes |
| `READ_ONLY_AUDITOR` |             no |      no |      no |    no |  explicit only |

Every sensitive callable resolves `Session.getActiveUser().getEmail()` and the active row in `14_USERS_ACCESS`. Browser-supplied email, role, permission flag, hidden navigation state, and request query parameter are untrusted. Inactive or missing internal identities fail closed.

Internal item detail requires `Can_Review` or `Can_Manage_Catalog`. Catalog create/update/storage/archive/restore requires `Can_Manage_Catalog`. An active `ADMIN` or `DOL_DIRECTOR` retains the documented backward-compatible default if that newly appended cell is blank; all other roles require an explicit true value. Production onboarding should remove reliance on blank compatibility cells by reviewing every row.

Migration, configuration, access seeding, cycle-count adjustment, event-item merge/transfer, backup, and health operations require admin or the narrowly bounded empty-database setup-owner bootstrap. Routine operators must not receive Apps Script editor, spreadsheet owner, Drive manager, or trigger administration merely to perform application workflows.

## Public/request-only boundary

The server forces public and requester identities through the sanitized bootstrap even if a caller sends `requestOnly: false`. The response can contain approved event choices and catalog suggestions, but it excludes exact on-hand/reserved/available-to-promise values, verification notes, legacy provenance, user/access rows, ledgers, reservations, suppliers and tax fields, borrower history, evidence internals, audit/error/configuration records, health output, and admin functions.

The requester is told that stock routing is pending DOL review. The later locked review command rechecks current availability and policy. The request-only client receives no revision fields and does not start internal polling. Direct invocation of a staff mutation still runs the permission check.

Evidence upload authorization occurs before file decode or Drive access. Receiving evidence requires `Can_Receive`, release/lending evidence requires `Can_Release`, and other supporting evidence requires `Can_Admin`. See [Google Drive Evidence](GOOGLE_DRIVE_EVIDENCE.md).

## Trust boundaries and threat register

| Threat                                                                | Assets at risk                             | CURRENT control                                                                                            | Gap or required evidence                                                                                                                         |
| --------------------------------------------------------------------- | ------------------------------------------ | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Browser tampers with role, item ID, quantity, status, or request mode | Authorization and inventory                | Server identity, DTO sanitation, permission/validation/state checks                                        | Manual hostile-call tests in staging for every permission family                                                                                 |
| Duplicate click, timeout retry, or concurrent operator                | Ledger and workflow integrity              | Stable client request ID, script lock, recorded idempotency result, state recheck                          | Load/concurrency acceptance at expected pilot volume; reconcile ambiguous timeout by correlation ID                                              |
| Spreadsheet formula injection from user text                          | Sheet owner/session and exported data      | Central `setValuesSafely_` neutralizes leading `=`, `+`, `-`, `@`, tab, and carriage-return text across append, batch, and update paths; unit coverage includes the command journal | Verify exported/imported files and representative live Sheet behavior in staging; keep system columns restricted and warning-protected           |
| Stored/reflected XSS in browser templates                             | Session data and command authority         | Escaping helpers/text assignment on reviewed paths; server-safe DTO envelope                               | Test every user/supplier/imported text sink; add content-security controls where hosting permits; no unsafe HTML exceptions without review       |
| CSRF or cross-origin command attempt                                  | Authorized user's mutation ability         | Apps Script callable executes in the served application and rechecks active identity; default frame policy | Verify deployment audience and frame behavior; FUTURE cookie API requires SameSite, origin checks, and CSRF defense or a non-cookie token design |
| Clickjacking or malicious embedding                                   | User intent                                | `XFrameOptionsMode.DEFAULT`                                                                                | Browser acceptance must verify expected headers/platform behavior; do not weaken framing for convenience                                         |
| Unauthorized Drive link or inherited sharing                          | Evidence and personal data                 | Controlled folder IDs, permission before upload, no public filename data                                   | Quarterly group/share review; test external sharing disabled; signed-link policy for FUTURE                                                      |
| Malicious or mislabeled upload                                        | Operator device, Drive, downstream viewers | Permission-before-decode, encoded/decoded size bounds, MIME/extension/magic-signature agreement, image dimension/pixel bounds, digest, private parent/share verification | Malware and deeper PDF active-content scanning, approved viewer guidance, and live staging evidence remain launch/governance gates               |
| Spreadsheet/Drive identifier or secret committed                      | Whole environment                          | Ignored config files, no-value sensitive-content scanner, fail-closed properties                           | Review scanner findings; history remediation if a value was previously public; rotate/restrict affected resources                                |
| Privileged Google/OAuth account compromise                            | Sheets, Drive, Apps Script                 | Institutional identity and Google audit surfaces                                                           | Require institutional MFA/account policy, named deployment owner and backup owner, offboarding and recovery contacts                             |
| Direct manual Sheet edit                                              | Data integrity and revision sync           | Operational tabs are server-owned; edit trigger advances revision                                          | Protect ranges, restrict editors, monitor audit/reconciliation; Apps Script writes do not fire edit triggers                                     |
| Backup used as live database                                          | Recovery integrity                         | Separate required operational/backup IDs; equality rejected                                                | Validate destination privately at each launch; backup resource stays write-protected from routine app workflows                                  |
| Dependency/build compromise                                           | Browser and backend package                | Lockfile, CI, generated-artifact verification                                                              | Review automated dependency updates; pin/review CI actions; maintain release provenance and artifact digest                                      |
| Log or analytics over-collection                                      | Personal/configuration data                | Public errors are safe; controlled error Sheet holds stacks                                                | Define retention/access; never add payload/body logging or third-party analytics without privacy review                                          |

## Input, output, and browser defenses

- Validate required types, finite positive/non-negative quantities, enums, date relationships, entity existence, current status, and linked ownership on the server.
- Treat all imported legacy cells and supplier/requester text as hostile display input. Escape for HTML, attributes, CSV, formulas, URLs, and logs according to the output context.
- Do not use `innerHTML` with untrusted data unless every interpolated field is passed through the reviewed context-specific encoder. Prefer `textContent` for plain text.
- Reject `javascript:`, `data:`, or unapproved external URL schemes. Canvass/source links should be rendered with safe rel attributes and a controlled allowlist.
- CSV exports must neutralize cells beginning with `=`, `+`, `-`, `@`, tab, or carriage return before a spreadsheet application opens them.
- Never trust client file MIME, size, filename, entity relationship, or digest. The server recomputes and cross-checks encoded/decoded size, file signature, image bounds, and digest before private storage. Malware and deeper PDF active-content scanning plus approved viewer policy remain required production decisions.
- Return stable safe error codes and correlation IDs. Do not return stack traces, Sheet ranges, resource IDs, access rows, raw command bodies, or config values.
- Avoid sensitive data in browser storage. DEMO local storage contains fictional data only; CURRENT operational data is memory state and must not be added to offline caches.

## Identity, OAuth scopes, and privileged ownership

The current Apps Script manifest requests spreadsheet, Drive, trigger administration, and active-user email scopes. These are broad because one server project performs storage, backup, evidence, and trigger setup. Scope consent must use the institutional project/owner and be reviewed at staging and production. Users should access the restricted web app; they do not need editor-level scope grants.

Record privately:

- deployment owner and backup owner;
- which institutional group may open the web app;
- who can edit Apps Script, operational Sheets, backup Sheets, Drive folders, triggers, and Script Properties;
- break-glass access, recovery method, and approval log;
- last quarterly access review and removed accounts.

High privilege should be time-bounded where possible. Shared credentials and personal OAuth tokens are prohibited. A deployment owner change is a release/security event, not routine user administration.

## Secrets, identifiers, and source controls

`HAU_ENVIRONMENT`, `HAU_SPREADSHEET_ID`, and `HAU_BACKUP_SPREADSHEET_ID` are Script Properties. Folder references are restricted config rows. Missing, placeholder, malformed, unsupported, or identical operational/backup values stop the application before a Sheet is opened.

Do not commit `.clasp.json`, `.clasprc.json`, environment files, OAuth material, API keys, service-account files, private keys, real Script/Spreadsheet/Drive/deployment identifiers, institutional credentials, personal contacts, student records, supplier tax information, or evidence files. `npm run check:sensitive` scans tracked text and reports only file, line, and category; it intentionally never prints a matched value. A passing scanner complements review and history scanning—it is not proof that a secret never existed.

The current tree contains no configured spreadsheet identifier. A previously tracked identifier remains a repository-history governance item and must be restricted, rotated/replaced, and history-remediated if the resource owner's policy requires it.

If a sensitive value reaches git or an issue/artifact:

1. stop publication and preserve a private incident record;
2. revoke/rotate or restrict the credential/resource first;
3. remove the value from the current tree and public artifact;
4. decide with the repository owner whether history rewrite and downstream clone coordination are required;
5. verify logs, caches, release assets, CI artifacts, screenshots, and forks;
6. document the remediation without repeating the value.

## Audit and non-repudiation

Every successful mutation records actor, action, entity, correlation, before/after context where safe, and idempotency completion. Status transitions append history. Posted ledger, history, and audit rows are not edited or deleted; corrections use explicit reversals, adjustments, superseding events, or forward migrations.

Audit data is itself restricted because it can contain emails, entity history, and prior values. Reviewer access must be read-only, purpose-limited, and logged where the platform permits. Clock/time-zone handling uses `Asia/Manila`, while future systems should also retain an unambiguous UTC instant.

## Privacy and governance decisions required before production

| Decision                                                                  | Required owner                                      | Current state                                    |
| ------------------------------------------------------------------------- | --------------------------------------------------- | ------------------------------------------------ |
| Lawful purpose and minimum borrower/requester/supplier fields             | HAU privacy/data owner and DOL                      | Unresolved                                       |
| Student ID/contact, request, evidence, audit, error, and backup retention | HAU privacy/data owner, records owner, system owner | Unresolved; no destructive automation authorized |
| Data subject access/correction process without editing immutable evidence | Privacy/records owner                               | Unresolved                                       |
| Incident notification and escalation contacts/timelines                   | Security/privacy owners                             | Unresolved                                       |
| External supplier/evidence sharing and processor terms                    | Procurement/privacy/legal owners                    | Unresolved                                       |
| Institutional MFA, account recovery, and offboarding controls             | Identity/system owner                               | Requires launch evidence                         |
| Production audience and least-privilege groups                            | DOL owner and system owner                          | Unresolved                                       |
| Legal hold and deletion approval                                          | Legal/records/privacy owner                         | Unresolved                                       |
| Future provider residency, backup, subprocessor, and exit requirements    | Governance/procurement owners                       | FUTURE decision                                  |

Until a retention schedule is approved, do not infer that indefinite storage is acceptable and do not automate deletion. Minimize new collection, restrict access, and keep unresolved policy visible in release evidence.

## Incident response minimum

1. Stop or bound the affected writes/sharing without deleting evidence.
2. Record time, environment, deployment version, commit, correlation IDs, affected entity classes, and reporter in a restricted incident log.
3. Preserve relevant audit/error rows, remote source snapshot, Drive metadata, and backup evidence.
4. Revoke exposed credentials/access and isolate malicious files or accounts.
5. Assess personal/commercial data exposure with the authorized privacy/security owners; follow institutional notification rules.
6. Restore the preceding approved release or configuration only through the documented rollback process.
7. Reconcile every mutation and evidence object; use forward correction, never silent ledger/history edits.
8. Complete cause, impact, control improvement, owner, and due date before closing.

See [Operations and Deployment Runbook](OPERATIONS_AND_DEPLOYMENT_RUNBOOK.md) for technical rollback and [Backup and Recovery](BACKUP_AND_RECOVERY.md) for recovery evidence.

## Future hosted controls

The **FUTURE** platform must use an institutional identity provider or reviewed managed auth, short sessions, explicit server policy, private networking where practical, managed secrets, encrypted PostgreSQL/object storage, row-level restrictions as defense in depth, short-lived signed object access, centralized audit/monitoring, database point-in-time recovery, and tested provider exit. Browsers never receive database service credentials or direct write permission to ledger, audit, roles, idempotency, outbox, or migration tables.

Provider selection and architecture are still proposed in [Hosting and Database Candidates](HOSTING_AND_DATABASE_CANDIDATES.md); no provider compliance, latency, or security claim is inherited merely by choosing a managed service.
