# Roadmap to v1.0

| Phase                             | Status                  | Exit gate                                                                                    |
| --------------------------------- | ----------------------- | -------------------------------------------------------------------------------------------- |
| 0. Preserve baseline              | Implemented             | Original prototype and audit retained; fixed demo data; no production writes                 |
| 1. P0 integrity fixes             | Implemented/tested      | Six audit probes and line-level restock regression pass                                      |
| 2. UX and accessibility           | Implemented for preview | Mobile navigation, readable targets, focus and validation patterns; manual AT review remains |
| 3. Modular source                 | Implemented/tested      | Vite modules, service boundary, Vitest, single-file build, documentation                     |
| 4. Apps Script/full-stack backend | Implemented; staging validation pending | Institutional identity, LockService, server IDs, adapters, workflow writes, audit, evidence |
| 5. Migration and reconciliation   | Tooling implemented; not applied | Approved mappings, launch backup, dry-run/reconciliation sign-off, frozen baseline           |
| 6. Controlled DOL pilot           | Not started             | Small-group acceptance report, training findings, rollback plan                              |
| 7. Production v1.0                | Not started             | Backups, admin/requester guides, accessibility review, monitoring, sign-off                  |

DOF budget status remains a placeholder; no financial approval automation is implemented. Phase 4 is not complete operationally until staging schema, Drive, access, concurrency, and smoke tests pass.
