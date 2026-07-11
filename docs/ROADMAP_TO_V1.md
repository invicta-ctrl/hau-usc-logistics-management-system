# Roadmap to v1.0

| Phase                             | Status                  | Exit gate                                                                                    |
| --------------------------------- | ----------------------- | -------------------------------------------------------------------------------------------- |
| 0. Preserve baseline              | Implemented             | Original prototype and audit retained; fixed demo data; no production writes                 |
| 1. P0 integrity fixes             | Implemented/tested      | Six audit probes and line-level restock regression pass                                      |
| 2. UX and accessibility           | Implemented for preview | Mobile navigation, readable targets, focus and validation patterns; manual AT review remains |
| 3. Modular source                 | Implemented/tested      | Vite modules, service boundary, Vitest, single-file build, documentation                     |
| 4. Apps Script/full-stack backend | Not started             | Institutional identity, LockService, server IDs, batch writes, persistent audit              |
| 5. Migration and reconciliation   | Not started             | Verified opening ledger, resolved duplicates, configured users/events                        |
| 6. Controlled DOL pilot           | Not started             | Small-group acceptance report, training findings, rollback plan                              |
| 7. Production v1.0                | Not started             | Backups, admin/requester guides, accessibility review, monitoring, sign-off                  |

Do not automate DOF budget approval during Phase 4's first slice. Harden request acceptance, reservation, release, receiving, lending, and audit transactions first.
