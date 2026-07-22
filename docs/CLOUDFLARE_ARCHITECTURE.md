# Cloudflare staging architecture

## Runtime shape

The Phase 3 staging candidate is one Cloudflare Worker with three explicit boundaries:

1. `dist/` is served through Workers Static Assets. API paths match `run_worker_first` and never fall through to the SPA.
2. `src/worker/index.js` owns the HTTP boundary, security headers, correlation IDs, authentication cookies, CSRF checks, capability checks, safe errors, and route dispatch.
3. The `DB` binding is the operational source of truth. `src/server/d1/` supplies the persistent authentication repository, distributed rate limiter, scoped reads, transactions/batches, idempotency, and workflow services.

`wrangler.jsonc` contains only public-safe configuration. Its all-zero database identifiers are deliberate placeholders. Real account, Worker, database, route, rollback, Google, and Drive identifiers belong in the approved private staging configuration outside Git.

Official platform references:

- [Workers Static Assets binding and Worker-first routing](https://developers.cloudflare.com/workers/static-assets/binding/)
- [Wrangler environment and binding configuration](https://developers.cloudflare.com/workers/wrangler/configuration/)
- [D1 migrations](https://developers.cloudflare.com/d1/reference/migrations/)

## API and browser contract

- Public: `/api/health`, `/api/readiness`, and request-only bootstrap projections.
- Authentication: `/api/auth/*` and the `/api/session` compatibility alias.
- Operational: bootstrap/module reads and action-specific POST mutations.
- Diagnostics: `/api/admin/migrations`, restricted to `system.diagnostics`.
- Static fallback: all non-API navigation routes resolve to the single-page application.

Production uses `Secure`, `HttpOnly`, `SameSite=Lax`, host-only authentication cookies. Local HTTP workerd uses distinct non-Host-prefixed cookie names solely because browsers reject a `__Host-` cookie without HTTPS. No deployed environment is allowed to use the local cookie mode.

## Authorization and data isolation

The server derives capabilities and experience routing from the authenticated account. The client cannot select a role. Committee-scoped actors are filtered and checked against the target request, lending ticket, restock, or deliverable assignment; proving membership in any committee is not sufficient. Administrator API families require the specific system/reference capability, and operational capabilities do not imply administrative access.

Request/review, reservation/release, lending handoff/return, and receiving paths use D1 constraints plus idempotency records. Inventory truth is derived from the append-only ledger and active reservations. Audit and status history are append-only. D1 triggers prevent negative inventory, excessive reservation consumption, over-receiving, and post-cutover Sheet imports.

## Environment boundary

- Local: workerd plus local D1 and fictional seed data only.
- Staging: separately named Worker, route, and D1 binding supplied through the private authorization package and private Wrangler configuration.
- Production: no target is configured or authorized by this candidate.

Before the first remote command, `npm run phase3:authorization:check -- <absolute-private-json-path>` must validate the exact committed candidate and report approval through the gate needed for the next action. A missing, pending, denied, stale, or repository-contained package is a hard stop.

## Observability and rollback posture

Every Worker response has a correlation ID. Logs exclude keys that could carry tokens, secrets, cookies, passwords, or authorization values, and public errors omit stack traces. Readiness reports only safe environment, version, candidate, binding, schema, and latest-migration labels.

The rollback unit is the exact immutable Worker candidate plus a private D1 backup/export. Deployment rollback cannot delete or edit ledger, audit, status-history, receiving, release, or evidence rows. Database recovery uses the accepted export/restore or forward-repair procedure in `docs/D1_MIGRATION_AND_ROLLBACK.md`.
